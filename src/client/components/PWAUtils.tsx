import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PWAInstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  onInstall,
  onDismiss,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    try {
      // Check if already installed
      const checkInstalled = () => {
        const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
        const isInWebAppiOS = (window.navigator as any).standalone === true;
        setIsInstalled(isStandalone || isInWebAppiOS);
      };

      checkInstalled();

      // Listen for install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        
        // Show prompt after a delay if not already installed
        if (!isInstalled) {
          setTimeout(() => setShowPrompt(true), 3000);
        }
      };

      // Listen for app installed
      const handleAppInstalled = () => {
        setIsInstalled(true);
        setShowPrompt(false);
        setDeferredPrompt(null);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    } catch (error) {
      console.log('PWA install prompt setup failed:', error);
    }
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      onInstall?.();
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onDismiss?.();
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="pwa-install-prompt fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <motion.div
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-4 shadow-lg border border-purple-500"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">📱</div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">
                Install Cinnarito
              </h3>
              <p className="text-xs text-purple-100 mb-3">
                Add to your home screen for the best experience!
              </p>
              <div className="flex gap-2">
                <motion.button
                  onClick={handleInstall}
                  className="px-3 py-1 bg-white text-purple-700 text-xs rounded font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Install
                </motion.button>
                <motion.button
                  onClick={handleDismiss}
                  className="px-3 py-1 bg-purple-800 text-white text-xs rounded"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Later
                </motion.button>
              </div>
            </div>
            <motion.button
              onClick={handleDismiss}
              className="text-purple-200 hover:text-white text-lg leading-none"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Service Worker registration and management
export const usePWA = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Register service worker
    const registerSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // Check if service worker file exists before registering
          const response = await fetch('/sw.js', { method: 'HEAD' });
          if (response.ok) {
            const registration = await navigator.serviceWorker.register('/sw.js');
            setSwRegistration(registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    setUpdateAvailable(true);
                  }
                });
              }
            });
            
            console.log('Service Worker registered successfully');
          } else {
            console.log('Service Worker file not found, skipping registration');
          }
        } catch (error) {
          console.log('Service Worker registration failed, continuing without PWA features:', error);
        }
      }
    };

    registerSW();

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateServiceWorker = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  const cacheGameState = (gameState: any) => {
    if (swRegistration?.active) {
      swRegistration.active.postMessage({
        type: 'CACHE_GAME_STATE',
        gameState,
      });
    }
  };

  return {
    isOnline,
    updateAvailable,
    updateServiceWorker,
    cacheGameState,
    swRegistration,
  };
};

// Update notification component
interface UpdateNotificationProps {
  show: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  show,
  onUpdate,
  onDismiss,
}) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="update-notification fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <motion.div
            className="bg-blue-600 text-white rounded-lg p-4 shadow-lg border border-blue-500 max-w-sm"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start gap-3">
              <div className="text-xl">🔄</div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">
                  Update Available
                </h3>
                <p className="text-xs text-blue-100 mb-3">
                  A new version of Cinnarito is ready to install.
                </p>
                <div className="flex gap-2">
                  <motion.button
                    onClick={onUpdate}
                    className="px-3 py-1 bg-white text-blue-700 text-xs rounded font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Update Now
                  </motion.button>
                  <motion.button
                    onClick={onDismiss}
                    className="px-3 py-1 bg-blue-800 text-white text-xs rounded"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Later
                  </motion.button>
                </div>
              </div>
              <motion.button
                onClick={onDismiss}
                className="text-blue-200 hover:text-white text-lg leading-none"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};