import { useState, useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  isLowPerformance: boolean;
}

interface PerformanceSettings {
  enableAnimations: boolean;
  particleCount: number;
  updateInterval: number;
  enableBlur: boolean;
  enableShadows: boolean;
}

export const usePerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    isLowPerformance: false,
  });

  const [settings, setSettings] = useState<PerformanceSettings>({
    enableAnimations: true,
    particleCount: 50,
    updateInterval: 1000,
    enableBlur: true,
    enableShadows: true,
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const renderTimes = useRef<number[]>([]);

  // FPS monitoring
  const measureFPS = useCallback(() => {
    const now = performance.now();
    frameCount.current++;
    
    if (now - lastTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
      
      setMetrics(prev => ({
        ...prev,
        fps,
        isLowPerformance: fps < 30,
      }));

      frameCount.current = 0;
      lastTime.current = now;
    }
  }, []);

  // Memory usage monitoring
  const measureMemory = useCallback(() => {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        if (memory && memory.usedJSHeapSize) {
          const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
          
          setMetrics(prev => ({
            ...prev,
            memoryUsage,
          }));
        }
      }
    } catch (error) {
      console.log('Memory monitoring not available:', error);
    }
  }, []);

  // Render time monitoring
  const measureRenderTime = useCallback((startTime: number) => {
    const renderTime = performance.now() - startTime;
    renderTimes.current.push(renderTime);
    
    // Keep only last 10 measurements
    if (renderTimes.current.length > 10) {
      renderTimes.current.shift();
    }
    
    const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
    
    setMetrics(prev => ({
      ...prev,
      renderTime: Math.round(avgRenderTime * 100) / 100,
    }));
  }, []);

  // Auto-adjust settings based on performance
  useEffect(() => {
    if (metrics.isLowPerformance) {
      setSettings(prev => ({
        ...prev,
        enableAnimations: metrics.fps < 20,
        particleCount: Math.max(10, Math.floor(prev.particleCount * 0.5)),
        updateInterval: Math.min(2000, prev.updateInterval * 1.5),
        enableBlur: metrics.fps > 15,
        enableShadows: metrics.fps > 20,
      }));
    } else if (metrics.fps > 50) {
      // Gradually restore settings when performance improves
      setSettings(prev => ({
        ...prev,
        enableAnimations: true,
        particleCount: Math.min(50, prev.particleCount + 5),
        updateInterval: Math.max(1000, prev.updateInterval * 0.9),
        enableBlur: true,
        enableShadows: true,
      }));
    }
  }, [metrics.fps, metrics.isLowPerformance]);

  // Performance monitoring loop
  useEffect(() => {
    let animationFrame: number;
    let memoryInterval: NodeJS.Timeout;

    const loop = () => {
      measureFPS();
      animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);
    memoryInterval = setInterval(measureMemory, 5000);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(memoryInterval);
    };
  }, [measureFPS, measureMemory]);

  const startRenderMeasurement = useCallback(() => {
    return performance.now();
  }, []);

  const endRenderMeasurement = useCallback((startTime: number) => {
    measureRenderTime(startTime);
  }, [measureRenderTime]);

  return {
    metrics,
    settings,
    startRenderMeasurement,
    endRenderMeasurement,
    updateSettings: setSettings,
  };
};

// Hook for device capabilities detection
export const useDeviceCapabilities = () => {
  const [capabilities, setCapabilities] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    hasTouch: false,
    supportsWebGL: false,
    supportsWebGL2: false,
    devicePixelRatio: 1,
    maxTextureSize: 0,
    preferReducedMotion: false,
  });

  useEffect(() => {
    const checkCapabilities = () => {
      try {
        // Device type detection
        const userAgent = navigator.userAgent || '';
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)|Android(?=.*\bTablet\b)/i.test(userAgent);
        const isDesktop = !isMobile && !isTablet;

        // Touch support
        const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

        // WebGL support
        let supportsWebGL = false;
        let supportsWebGL2 = false;
        let maxTextureSize = 0;
        
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl');
          const gl2 = canvas.getContext('webgl2');
          supportsWebGL = !!gl;
          supportsWebGL2 = !!gl2;

          // Max texture size
          if (gl) {
            maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;
          }
        } catch (webglError) {
          console.log('WebGL detection failed:', webglError);
        }

        // Device pixel ratio
        const devicePixelRatio = window.devicePixelRatio || 1;

        // Reduced motion preference
        let preferReducedMotion = false;
        try {
          preferReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (mediaQueryError) {
          console.log('Media query detection failed:', mediaQueryError);
        }

        setCapabilities({
          isMobile,
          isTablet,
          isDesktop,
          hasTouch,
          supportsWebGL,
          supportsWebGL2,
          devicePixelRatio,
          maxTextureSize,
          preferReducedMotion,
        });
      } catch (error) {
        console.log('Device capabilities detection failed:', error);
        // Set safe defaults
        setCapabilities({
          isMobile: false,
          isTablet: false,
          isDesktop: true,
          hasTouch: false,
          supportsWebGL: false,
          supportsWebGL2: false,
          devicePixelRatio: 1,
          maxTextureSize: 0,
          preferReducedMotion: false,
        });
      }
    };

    checkCapabilities();

    // Listen for orientation changes on mobile
    const handleOrientationChange = () => {
      setTimeout(checkCapabilities, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return capabilities;
};

// Hook for code splitting and lazy loading
export const useLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const [Component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    importFunc()
      .then((module) => {
        if (mounted) {
          setComponent(() => module.default);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [importFunc]);

  return { Component, loading, error, Fallback: fallback };
};