import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, PlayerResources, StateResponse } from '../../shared/types/api';

interface UseGameStateProps {
  subredditName: string;
  username: string;
}

interface UseGameStateReturn {
  gameState: GameState | null;
  playerResources: PlayerResources | null;
  loading: boolean;
  error: string | null;
  refreshState: () => Promise<void>;
  lastSyncTime: Date | null;
  isPolling: boolean;
  activePlayerCount: number;
}

interface GameStateCache {
  gameState: GameState;
  playerResources: PlayerResources;
  lastModified: Date;
  cachedAt: Date;
}

// Smart polling intervals based on activity
const POLLING_INTERVALS = {
  ACTIVE: 3000,     // 3 seconds when user is active
  IDLE: 10000,      // 10 seconds when user is idle
  BACKGROUND: 30000, // 30 seconds when tab is in background
  ERROR: 15000,     // 15 seconds after an error
} as const;

// Cache duration for state data
const CACHE_DURATION_MS = 2000; // 2 seconds

export const useGameState = ({ subredditName, username }: UseGameStateProps): UseGameStateReturn => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerResources, setPlayerResources] = useState<PlayerResources | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [activePlayerCount, setActivePlayerCount] = useState(0);

  // Refs for managing polling and activity tracking
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());
  const isTabVisibleRef = useRef<boolean>(true);
  const cacheRef = useRef<GameStateCache | null>(null);
  const retryCountRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track user activity for smart polling
  const updateActivity = useCallback(() => {
    lastActivityRef.current = new Date();
  }, []);

  // Check if cached data is still valid
  const isCacheValid = useCallback((): boolean => {
    if (!cacheRef.current) return false;
    const now = new Date();
    const cacheAge = now.getTime() - cacheRef.current.cachedAt.getTime();
    return cacheAge < CACHE_DURATION_MS;
  }, []);

  // Get appropriate polling interval based on activity and visibility
  const getPollingInterval = useCallback((): number => {
    if (!isTabVisibleRef.current) {
      return POLLING_INTERVALS.BACKGROUND;
    }

    const now = new Date();
    const timeSinceActivity = now.getTime() - lastActivityRef.current.getTime();
    const isUserActive = timeSinceActivity < 30000; // 30 seconds

    if (error) {
      return POLLING_INTERVALS.ERROR;
    }

    return isUserActive ? POLLING_INTERVALS.ACTIVE : POLLING_INTERVALS.IDLE;
  }, [error]);

  // Fetch initial game state
  const fetchInitialState = useCallback(async (): Promise<void> => {
    if (!subredditName || !username) return;

    try {
      setLoading(true);
      setError(null);

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const response = await fetch(`/api/init/${subredditName}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.type === 'init') {
        setGameState(data.gameState);
        setPlayerResources(data.playerResources);
        setLastSyncTime(new Date());
        
        // Update cache
        cacheRef.current = {
          gameState: data.gameState,
          playerResources: data.playerResources,
          lastModified: new Date(data.gameState.updatedAt),
          cachedAt: new Date(),
        };

        retryCountRef.current = 0;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, don't update error state
      }

      console.error('Error fetching initial game state:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to load game state: ${errorMessage}`);
      retryCountRef.current++;
    } finally {
      setLoading(false);
    }
  }, [subredditName, username]);

  // Fetch state updates for real-time synchronization
  const fetchStateUpdate = useCallback(async (): Promise<void> => {
    if (!subredditName || loading) return;

    // Use cached data if still valid
    if (isCacheValid() && cacheRef.current) {
      return;
    }

    try {
      setError(null);

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      // Prepare headers for cache validation
      const headers: HeadersInit = {};
      if (cacheRef.current) {
        headers['If-Modified-Since'] = cacheRef.current.lastModified.toISOString();
        if (cacheRef.current.gameState) {
          // Include previous hash for potential diffing
          const url = new URL(`/api/state/${subredditName}`, window.location.origin);
          url.searchParams.set('includeDiff', 'true');
          if ((cacheRef.current as any).stateHash) {
            url.searchParams.set('previousHash', (cacheRef.current as any).stateHash);
          }
        }
      }

      const url = `/api/state/${subredditName}${cacheRef.current ? '?includeDiff=true' : ''}`;
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers,
      });

      if (response.status === 304) {
        // Not modified - client has the latest version
        retryCountRef.current = 0;
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: StateResponse = await response.json();

      // Check if state has actually changed
      const lastModified = new Date(data.lastModified);
      const hasStateChanged = !cacheRef.current || 
        lastModified.getTime() > cacheRef.current.lastModified.getTime();

      if (hasStateChanged) {
        // Apply state diff if available for more efficient updates
        if (data.stateDiff && data.stateDiff.type === 'incremental' && gameState) {
          // Apply incremental changes
          const updatedState = { ...gameState, ...data.stateDiff.changes };
          setGameState(updatedState);
        } else {
          // Full state update
          setGameState(data.gameState);
        }
        
        setLastSyncTime(new Date());
        
        // Update cache with new game state and hash
        cacheRef.current = {
          gameState: data.gameState,
          playerResources: playerResources!, // Keep existing player resources
          lastModified,
          cachedAt: new Date(),
          ...(data.stateHash && { stateHash: data.stateHash }),
        } as GameStateCache & { stateHash?: string };
      }

      setActivePlayerCount(data.activePlayerCount);
      retryCountRef.current = 0;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, don't update error state
      }

      console.error('Error fetching state update:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to sync state: ${errorMessage}`);
      retryCountRef.current++;
    }
  }, [subredditName, loading, isCacheValid, playerResources, gameState]);

  // Manual refresh function
  const refreshState = useCallback(async (): Promise<void> => {
    updateActivity();
    
    // Clear cache to force fresh data
    cacheRef.current = null;
    
    if (!gameState) {
      await fetchInitialState();
    } else {
      await fetchStateUpdate();
    }
  }, [gameState, fetchInitialState, fetchStateUpdate, updateActivity]);

  // Start polling for real-time updates
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setIsPolling(true);
    
    const poll = async () => {
      await fetchStateUpdate();
      
      // Schedule next poll with dynamic interval
      const interval = getPollingInterval();
      pollingIntervalRef.current = setTimeout(poll, interval);
    };

    // Start first poll after initial delay
    const initialInterval = getPollingInterval();
    pollingIntervalRef.current = setTimeout(poll, initialInterval);
  }, [fetchStateUpdate, getPollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Handle visibility change for smart polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
      
      if (document.hidden) {
        // Tab became hidden, reduce polling frequency
        if (isPolling) {
          stopPolling();
          startPolling();
        }
      } else {
        // Tab became visible, increase polling frequency and refresh
        updateActivity();
        if (isPolling) {
          stopPolling();
          startPolling();
        }
        // Refresh state when tab becomes visible
        refreshState();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPolling, startPolling, stopPolling, updateActivity, refreshState]);

  // Handle user activity events for smart polling
  useEffect(() => {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateActivity();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [updateActivity]);

  // Initialize state and start polling
  useEffect(() => {
    if (subredditName && username) {
      // Clear existing state when subreddit changes
      setGameState(null);
      setPlayerResources(null);
      setError(null);
      cacheRef.current = null;
      
      fetchInitialState().then(() => {
        startPolling();
      });
    }

    return () => {
      stopPolling();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [subredditName, username, fetchInitialState, startPolling, stopPolling]);

  // Update state when external updates occur (from actions)
  const updateState = useCallback((newGameState: GameState, newPlayerResources: PlayerResources) => {
    setGameState(newGameState);
    setPlayerResources(newPlayerResources);
    setLastSyncTime(new Date());
    updateActivity();

    // Update cache
    cacheRef.current = {
      gameState: newGameState,
      playerResources: newPlayerResources,
      lastModified: new Date(newGameState.updatedAt),
      cachedAt: new Date(),
    };
  }, [updateActivity]);

  // Expose update function for external use (e.g., from useActions)
  useEffect(() => {
    // Store update function in a way that can be accessed by other hooks
    (window as any).__gameStateUpdate = updateState;
    
    return () => {
      delete (window as any).__gameStateUpdate;
    };
  }, [updateState]);

  return {
    gameState,
    playerResources,
    loading,
    error,
    refreshState,
    lastSyncTime,
    isPolling,
    activePlayerCount,
  };
};