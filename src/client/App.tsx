import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useCounter, 
  useActions, 
  useGameState, 
  usePerformance, 
  useDeviceCapabilities,
  useHapticFeedback 
} from './hooks';
import { 
  SplashScreen, 
  CommunityGarden, 
  SubredditSwitcher, 
  ErrorBoundary, 
  NetworkStatus,
  OfflineMode,
  FeedbackProvider,
  PWAInstallPrompt,
  UpdateNotification,
  useNetworkStatus,
  useErrorFeedback,
  useSuccessFeedback,
  useWarningFeedback,
  usePWA
} from './components';
import { SubredditProvider, useSubredditContext } from './contexts/SubredditContext';
import { GameState, PlayerResources, PlayerActionType } from '../shared/types';

// Main App component that uses subreddit context
const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [appError, setAppError] = useState<string | null>(null);
  const [showOfflineMode, setShowOfflineMode] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  
  // Basic hooks
  const { count, username, loading: counterLoading, increment, decrement } = useCounter();
  const { currentSubreddit, isLoading: subredditLoading, error: subredditError } = useSubredditContext();
  
  // Network status with error handling
  let isOnline = true;
  let wasOffline = false;
  try {
    const networkStatus = useNetworkStatus();
    isOnline = networkStatus.isOnline;
    wasOffline = networkStatus.wasOffline;
  } catch (error) {
    console.log('Network status hook failed, using defaults:', error);
  }
  
  // Performance and device hooks with fallbacks
  let metrics = { fps: 60, memoryUsage: 0, renderTime: 0, isLowPerformance: false };
  let settings = { enableAnimations: true, particleCount: 50, updateInterval: 1000, enableBlur: true, enableShadows: true };
  try {
    const performance = usePerformance();
    metrics = performance.metrics;
    settings = performance.settings;
  } catch (error) {
    console.log('Performance hook failed, using defaults:', error);
  }
  
  let deviceCapabilities = { isMobile: false, isTablet: false, isDesktop: true, hasTouch: false, supportsWebGL: false, supportsWebGL2: false, devicePixelRatio: 1, maxTextureSize: 0, preferReducedMotion: false };
  try {
    deviceCapabilities = useDeviceCapabilities();
  } catch (error) {
    console.log('Device capabilities hook failed, using defaults:', error);
  }
  
  let hapticFeedback = { lightTap: () => {}, mediumTap: () => {}, heavyTap: () => {}, doubleTap: () => {}, errorFeedback: () => {}, successFeedback: () => {} };
  try {
    hapticFeedback = useHapticFeedback();
  } catch (error) {
    console.log('Haptic feedback hook failed, using defaults:', error);
  }
  
  // PWA hooks with fallbacks
  let updateAvailable = false;
  let updateServiceWorker = () => {};
  let cacheGameState = () => {};
  try {
    const pwa = usePWA();
    updateAvailable = pwa.updateAvailable;
    updateServiceWorker = pwa.updateServiceWorker;
    cacheGameState = pwa.cacheGameState;
  } catch (error) {
    console.log('PWA hook failed, using defaults:', error);
  }
  
  // Feedback hooks with fallbacks
  let showError = (title: string, message: string) => console.error(title, message);
  let showSuccess = (title: string, message: string) => console.log(title, message);
  let showWarning = (title: string, message: string) => console.warn(title, message);
  try {
    showError = useErrorFeedback();
    showSuccess = useSuccessFeedback();
    showWarning = useWarningFeedback();
  } catch (error) {
    console.log('Feedback hooks failed, using console fallbacks:', error);
  }

  const handleStartGame = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Handle application-level errors
  const handleAppError = useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Application error:', error, errorInfo);
    setAppError(error.message);
    
    // Show user-friendly error feedback
    showError(
      'Something went wrong',
      error.message || 'An unexpected error occurred',
      [
        {
          label: 'Retry',
          action: () => {
            setAppError(null);
            window.location.reload();
          },
          variant: 'primary'
        },
        {
          label: 'Dismiss',
          action: () => setAppError(null),
          variant: 'secondary'
        }
      ]
    );
  }, [showError]);

  // Handle network status changes
  useEffect(() => {
    if (isOnline && wasOffline) {
      if (appError) {
        setAppError(null);
      }
      if (showOfflineMode) {
        setShowOfflineMode(false);
      }
      showSuccess('Back online!', 'Your connection has been restored.');
      hapticFeedback.successFeedback();
    } else if (!isOnline && !showOfflineMode) {
      showWarning(
        'Connection lost',
        'You\'re now offline. Some features may be limited.',
        [
          {
            label: 'View Offline',
            action: () => setShowOfflineMode(true),
            variant: 'primary'
          }
        ]
      );
      hapticFeedback.errorFeedback();
    }
  }, [isOnline, wasOffline, appError, showOfflineMode, showSuccess, showWarning, hapticFeedback]);

  // Handle PWA updates
  useEffect(() => {
    if (updateAvailable) {
      setShowUpdateNotification(true);
    }
  }, [updateAvailable]);

  // Performance monitoring
  useEffect(() => {
    if (metrics.isLowPerformance) {
      showWarning(
        'Performance Notice',
        'Reducing visual effects to improve performance.',
        [
          {
            label: 'OK',
            action: () => {},
            variant: 'primary'
          }
        ]
      );
    }
  }, [metrics.isLowPerformance, showWarning]);

  // Use real game state management with subreddit context
  const {
    gameState,
    playerResources,
    loading: gameStateLoading,
    error: gameStateError,
    refreshState,
    lastSyncTime,
    isPolling,
    activePlayerCount,
  } = useGameState({
    subredditName: currentSubreddit || 'testsubreddit',
    username: username || 'TestPlayer',
  });

  // Handle state updates from actions
  const handleStateUpdate = useCallback((newGameState: GameState, newPlayerResources: PlayerResources) => {
    try {
      // The useGameState hook will handle updates through its exposed update function
      if ((window as any).__gameStateUpdate) {
        (window as any).__gameStateUpdate(newGameState, newPlayerResources);
      }
    } catch (error) {
      console.error('Error updating game state:', error);
      handleAppError(error as Error);
    }
  }, [handleAppError]);

  // Initialize useActions hook with subreddit context
  const {
    plantSeed,
    feedSpirit,
    chargeRobot,
    postUpdate,
    isActionInProgress,
    lastActionResult,
  } = useActions({
    subredditName: currentSubreddit || gameState?.subredditName || 'testsubreddit',
    username: username || 'TestPlayer',
    gameState,
    playerResources,
    onStateUpdate: handleStateUpdate,
  });

  const handlePlayerAction = useCallback((action: PlayerActionType) => {
    console.log(`Player action: ${action}`);
    // Legacy handler for backward compatibility
  }, []);

  // Cache game state for offline access
  useEffect(() => {
    if (gameState && playerResources) {
      cacheGameState({ gameState, playerResources });
    }
  }, [gameState, playerResources, cacheGameState]);

  if (showSplash) {
    return (
      <>
        <NetworkStatus showWhenOnline={false} />
        <AnimatePresence mode="wait">
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8 }}
          >
            <ErrorBoundary onError={handleAppError}>
              <SplashScreen onStart={handleStartGame} />
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </>
    );
  }

  // Show loading state while subreddit or game state is loading
  if (subredditLoading || gameStateLoading || !currentSubreddit || !gameState || !playerResources) {
    return (
      <>
        <NetworkStatus showWhenOnline={false} />
        <motion.div 
          className="app-container relative w-full h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-purple-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="text-center text-white"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div 
              className="rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.p 
              className="text-lg"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            >
              {subredditLoading ? 'Detecting community...' : 'Loading your community garden...'}
            </motion.p>
            <AnimatePresence>
              {currentSubreddit && (
                <motion.p 
                  className="text-sm text-white/70 mt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  r/{currentSubreddit}
                </motion.p>
              )}
            </AnimatePresence>
            
            {/* Network status indicator */}
            <AnimatePresence>
              {!isOnline && (
                <motion.div 
                  className="mt-4 p-3 bg-yellow-600/20 rounded-lg border border-yellow-500"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-yellow-200 text-sm">
                    You're offline. Some features may not work properly.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {(gameStateError || subredditError || appError) && (
                <motion.div 
                  className="mt-4 p-3 bg-red-600/20 rounded-lg border border-red-500"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-red-200 text-sm">
                    {gameStateError || subredditError || appError}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <motion.button
                      onClick={refreshState}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Retry
                    </motion.button>
                    {appError && (
                      <motion.button
                        onClick={() => setAppError(null)}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Dismiss
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </>
    );
  }

  // Show offline mode if requested or if offline for too long
  if (showOfflineMode || (!isOnline && gameState && playerResources)) {
    return (
      <>
        <NetworkStatus showWhenOnline={true} />
        <OfflineMode
          gameState={gameState}
          playerResources={playerResources}
          subredditName={currentSubreddit}
          onRetry={() => {
            setShowOfflineMode(false);
            refreshState();
          }}
        />
      </>
    );
  }

  return (
    <>
      <NetworkStatus showWhenOnline={true} />
      {/* PWA components with error boundaries */}
      <ErrorBoundary fallback={null}>
        <PWAInstallPrompt 
          onInstall={() => {
            showSuccess('App Installed!', 'Cinnarito has been added to your home screen.');
            hapticFeedback.successFeedback();
          }}
        />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <UpdateNotification
          show={showUpdateNotification}
          onUpdate={() => {
            updateServiceWorker();
            setShowUpdateNotification(false);
          }}
          onDismiss={() => setShowUpdateNotification(false)}
        />
      </ErrorBoundary>
      <AnimatePresence mode="wait">
        <motion.div 
          key="game"
          className="app-container relative w-full h-screen"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <ErrorBoundary onError={handleAppError}>
            <CommunityGarden
              subredditName={currentSubreddit}
              gameState={gameState}
              playerResources={playerResources}
              onAction={handlePlayerAction}
              onPlant={plantSeed}
              onFeedSpirit={feedSpirit}
              onChargeRobot={chargeRobot}
              onPostUpdate={postUpdate}
              isActionInProgress={isActionInProgress}
              actionDisabled={counterLoading || !isOnline}
              performanceSettings={settings}
              deviceCapabilities={deviceCapabilities}
              hapticFeedback={hapticFeedback}
            />
          </ErrorBoundary>
          
          {/* Subreddit Switcher - positioned in top right */}
          <motion.div 
            className="absolute top-4 right-4 z-50"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <ErrorBoundary 
              onError={handleAppError}
              fallback={
                <div className="text-white text-sm bg-red-600/20 p-2 rounded">
                  Switcher Error
                </div>
              }
            >
              <SubredditSwitcher compact />
            </ErrorBoundary>
          </motion.div>
          
          {/* Debug/Testing Controls - positioned over the garden */}
          <motion.div 
            className="debug-controls absolute bottom-20 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.div 
              className="flex gap-2 bg-black/50 rounded-lg p-2"
              whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
                onClick={() => setShowSplash(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Splash
              </motion.button>
              <motion.button
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                onClick={increment}
                disabled={counterLoading || !isOnline}
                whileHover={{ scale: (counterLoading || !isOnline) ? 1 : 1.05 }}
                whileTap={{ scale: (counterLoading || !isOnline) ? 1 : 0.95 }}
              >
                + ({counterLoading ? '...' : count})
              </motion.button>
              <motion.button
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                onClick={decrement}
                disabled={counterLoading || !isOnline}
                whileHover={{ scale: (counterLoading || !isOnline) ? 1 : 1.05 }}
                whileTap={{ scale: (counterLoading || !isOnline) ? 1 : 0.95 }}
              >
                -
              </motion.button>
              <motion.button
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                onClick={refreshState}
                disabled={gameStateLoading}
                whileHover={{ scale: gameStateLoading ? 1 : 1.05 }}
                whileTap={{ scale: gameStateLoading ? 1 : 0.95 }}
              >
                Refresh State
              </motion.button>
            </motion.div>
            
            {/* Real-time Status Display */}
            <motion.div 
              className="bg-black/70 text-white text-xs rounded-lg p-2 max-w-xs text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <motion.div 
                  className={`w-2 h-2 rounded-full ${
                    isPolling && isOnline ? 'bg-green-400' : 'bg-red-400'
                  }`}
                  animate={(isPolling && isOnline) ? {
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1]
                  } : {}}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: 'reverse'
                  }}
                />
                <span>{(isPolling && isOnline) ? 'Live' : 'Offline'}</span>
                <span>•</span>
                <span>{activePlayerCount} active</span>
              </div>
              {lastSyncTime && (
                <div className="text-gray-300">
                  Last sync: {lastSyncTime.toLocaleTimeString()}
                </div>
              )}
              {!isOnline && (
                <div className="text-yellow-300 mt-1">
                  Network offline
                </div>
              )}
            </motion.div>
            
            {/* Action Result Display */}
            <AnimatePresence>
              {lastActionResult && (
                <motion.div 
                  className="bg-black/70 text-white text-xs rounded-lg p-2 max-w-xs text-center"
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  {lastActionResult}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* App Error Display */}
            <AnimatePresence>
              {appError && (
                <motion.div 
                  className="bg-red-600/20 border border-red-500 text-red-200 text-xs rounded-lg p-2 max-w-xs text-center"
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-2">{appError}</div>
                  <motion.button
                    onClick={() => setAppError(null)}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Dismiss
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

// Main App component with providers
export const App = () => {
  const handleTopLevelError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('Top-level application error:', error, errorInfo);
    // Could send to error reporting service here
  };

  return (
    <ErrorBoundary 
      onError={handleTopLevelError}
      fallback={
        <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-red-900 to-red-800">
          <div className="text-center text-white p-6">
            <div className="text-6xl mb-4">🌳💥</div>
            <h1 className="text-2xl font-bold mb-4">Critical Error</h1>
            <p className="mb-6">The application encountered a critical error and needs to be reloaded.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      }
    >
      <FeedbackProvider>
        <SubredditProvider>
          <AppContent />
        </SubredditProvider>
      </FeedbackProvider>
    </ErrorBoundary>
  );
};
