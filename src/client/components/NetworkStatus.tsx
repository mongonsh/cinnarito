import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NetworkStatusProps {
  className?: string;
  showWhenOnline?: boolean;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  className = '', 
  showWhenOnline = false 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (showWhenOnline) {
        setShowStatus(true);
        setTimeout(() => setShowStatus(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show status initially if offline
    if (!isOnline) {
      setShowStatus(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showWhenOnline, isOnline]);

  const shouldShow = showStatus && (!isOnline || showWhenOnline);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className={`network-status fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <motion.div
            className={`px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium ${
              isOnline 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-green-200' : 'bg-red-200'
              }`}
              animate={isOnline ? {
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              } : {
                scale: [1, 0.8, 1],
                opacity: [1, 0.5, 1]
              }}
              transition={{
                duration: isOnline ? 1 : 2,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            />
            <span>
              {isOnline ? 'Back online!' : 'You\'re offline'}
            </span>
            {!isOnline && (
              <motion.button
                onClick={() => setShowStatus(false)}
                className="ml-2 text-red-200 hover:text-white"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for network status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
};