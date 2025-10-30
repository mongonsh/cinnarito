import { useState, useEffect, useCallback, useRef } from 'react';

interface TouchGesture {
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'pan';
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  deltaX: number;
  deltaY: number;
  distance: number;
  scale?: number;
  velocity?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

interface TouchHandlers {
  onTap?: (gesture: TouchGesture) => void;
  onDoubleTap?: (gesture: TouchGesture) => void;
  onLongPress?: (gesture: TouchGesture) => void;
  onSwipe?: (gesture: TouchGesture) => void;
  onPinch?: (gesture: TouchGesture) => void;
  onPan?: (gesture: TouchGesture) => void;
}

interface TouchOptions {
  longPressDelay?: number;
  doubleTapDelay?: number;
  swipeThreshold?: number;
  pinchThreshold?: number;
  preventDefault?: boolean;
}

export const useMobileTouch = (
  elementRef: React.RefObject<HTMLElement>,
  handlers: TouchHandlers,
  options: TouchOptions = {}
) => {
  const {
    longPressDelay = 500,
    doubleTapDelay = 300,
    swipeThreshold = 50,
    pinchThreshold = 10,
    preventDefault = true,
  } = options;

  const [isPressed, setIsPressed] = useState(false);
  const [gesture, setGesture] = useState<TouchGesture | null>(null);

  const touchState = useRef({
    startTime: 0,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    lastTapTime: 0,
    longPressTimer: null as NodeJS.Timeout | null,
    initialDistance: 0,
    initialScale: 1,
    touches: [] as Touch[],
  });

  const calculateDistance = useCallback((touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const calculateDirection = useCallback((deltaX: number, deltaY: number) => {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, []);

  const createGesture = useCallback((
    type: TouchGesture['type'],
    currentPos: { x: number; y: number },
    additionalProps: Partial<TouchGesture> = {}
  ): TouchGesture => {
    const deltaX = currentPos.x - touchState.current.startPosition.x;
    const deltaY = currentPos.y - touchState.current.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const timeDelta = Date.now() - touchState.current.startTime;
    const velocity = timeDelta > 0 ? distance / timeDelta : 0;

    return {
      type,
      startPosition: touchState.current.startPosition,
      currentPosition: currentPos,
      deltaX,
      deltaY,
      distance,
      velocity,
      direction: calculateDirection(deltaX, deltaY),
      ...additionalProps,
    };
  }, [calculateDirection]);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    const now = Date.now();
    
    touchState.current = {
      ...touchState.current,
      startTime: now,
      startPosition: { x: touch.clientX, y: touch.clientY },
      currentPosition: { x: touch.clientX, y: touch.clientY },
      touches: Array.from(event.touches),
    };

    if (event.touches.length === 2) {
      touchState.current.initialDistance = calculateDistance(event.touches[0], event.touches[1]);
      touchState.current.initialScale = 1;
    }

    setIsPressed(true);

    // Set up long press timer
    if (touchState.current.longPressTimer) {
      clearTimeout(touchState.current.longPressTimer);
    }
    
    touchState.current.longPressTimer = setTimeout(() => {
      const gesture = createGesture('long-press', touchState.current.currentPosition);
      setGesture(gesture);
      handlers.onLongPress?.(gesture);
    }, longPressDelay);

  }, [preventDefault, calculateDistance, createGesture, handlers, longPressDelay]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    const currentPos = { x: touch.clientX, y: touch.clientY };
    
    touchState.current.currentPosition = currentPos;
    touchState.current.touches = Array.from(event.touches);

    // Handle pinch gesture
    if (event.touches.length === 2) {
      const currentDistance = calculateDistance(event.touches[0], event.touches[1]);
      const scale = currentDistance / touchState.current.initialDistance;
      
      if (Math.abs(scale - touchState.current.initialScale) > pinchThreshold / 100) {
        const gesture = createGesture('pinch', currentPos, { scale });
        setGesture(gesture);
        handlers.onPinch?.(gesture);
        touchState.current.initialScale = scale;
      }
    } else {
      // Handle pan gesture
      const gesture = createGesture('pan', currentPos);
      setGesture(gesture);
      handlers.onPan?.(gesture);
    }

    // Clear long press timer if moved too much
    const distance = Math.sqrt(
      Math.pow(currentPos.x - touchState.current.startPosition.x, 2) +
      Math.pow(currentPos.y - touchState.current.startPosition.y, 2)
    );
    
    if (distance > 10 && touchState.current.longPressTimer) {
      clearTimeout(touchState.current.longPressTimer);
      touchState.current.longPressTimer = null;
    }

  }, [preventDefault, calculateDistance, createGesture, handlers, pinchThreshold]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }

    setIsPressed(false);

    // Clear long press timer
    if (touchState.current.longPressTimer) {
      clearTimeout(touchState.current.longPressTimer);
      touchState.current.longPressTimer = null;
    }

    const now = Date.now();
    const timeDelta = now - touchState.current.startTime;
    const distance = Math.sqrt(
      Math.pow(touchState.current.currentPosition.x - touchState.current.startPosition.x, 2) +
      Math.pow(touchState.current.currentPosition.y - touchState.current.startPosition.y, 2)
    );

    // Handle swipe gesture
    if (distance > swipeThreshold && timeDelta < 500) {
      const gesture = createGesture('swipe', touchState.current.currentPosition);
      setGesture(gesture);
      handlers.onSwipe?.(gesture);
      return;
    }

    // Handle tap gestures
    if (distance < 10 && timeDelta < 500) {
      const timeSinceLastTap = now - touchState.current.lastTapTime;
      
      if (timeSinceLastTap < doubleTapDelay) {
        // Double tap
        const gesture = createGesture('double-tap', touchState.current.currentPosition);
        setGesture(gesture);
        handlers.onDoubleTap?.(gesture);
        touchState.current.lastTapTime = 0; // Reset to prevent triple tap
      } else {
        // Single tap (with delay to check for double tap)
        setTimeout(() => {
          if (now === touchState.current.lastTapTime) {
            const gesture = createGesture('tap', touchState.current.currentPosition);
            setGesture(gesture);
            handlers.onTap?.(gesture);
          }
        }, doubleTapDelay);
        touchState.current.lastTapTime = now;
      }
    }

  }, [preventDefault, swipeThreshold, doubleTapDelay, createGesture, handlers]);

  useEffect(() => {
    try {
      const element = elementRef.current;
      if (!element) return;

      // Add touch event listeners
      element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
      element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
      element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault });

      return () => {
        try {
          element.removeEventListener('touchstart', handleTouchStart);
          element.removeEventListener('touchmove', handleTouchMove);
          element.removeEventListener('touchend', handleTouchEnd);
          
          // Clean up timer
          if (touchState.current.longPressTimer) {
            clearTimeout(touchState.current.longPressTimer);
          }
        } catch (cleanupError) {
          console.log('Touch event cleanup failed:', cleanupError);
        }
      };
    } catch (error) {
      console.log('Touch event setup failed:', error);
    }
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]);

  return {
    isPressed,
    gesture,
    clearGesture: () => setGesture(null),
  };
};

// Hook for haptic feedback on mobile devices
export const useHapticFeedback = () => {
  const vibrate = useCallback((pattern: number | number[] = 50) => {
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.log('Haptic feedback not available:', error);
    }
  }, []);

  const lightTap = useCallback(() => vibrate(10), [vibrate]);
  const mediumTap = useCallback(() => vibrate(50), [vibrate]);
  const heavyTap = useCallback(() => vibrate(100), [vibrate]);
  const doubleTap = useCallback(() => vibrate([50, 50, 50]), [vibrate]);
  const errorFeedback = useCallback(() => vibrate([100, 50, 100]), [vibrate]);
  const successFeedback = useCallback(() => vibrate([50, 25, 50, 25, 50]), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    doubleTap,
    errorFeedback,
    successFeedback,
  };
};