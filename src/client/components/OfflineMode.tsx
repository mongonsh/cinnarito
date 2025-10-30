import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, PlayerResources } from '../../shared/types';
import { SpiritTree } from './SpiritTree';
import { FloatingSpirits } from './FloatingSpirits';
import { RedditRobot } from './RedditRobot';

interface OfflineModeProps {
  gameState: GameState | null;
  playerResources: PlayerResources | null;
  subredditName: string;
  onRetry: () => void;
  className?: string;
}

export const OfflineMode: React.FC<OfflineModeProps> = ({
  gameState,
  playerResources,
  subredditName,
  onRetry,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Use cached data or fallback values
  const displayGameState = gameState || {
    subredditName,
    treeLevel: 1,
    totalGrowth: 0,
    seedsPlanted: 0,
    spiritsFed: 0,
    robotCharged: 0,
    dailyUpvotes: 0,
    lastGrowthCalculation: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const displayPlayerResources = playerResources || {
    username: 'Player',
    subredditName,
    cinnamon: 0,
    seeds: 0,
    energy: 0,
    totalContributions: 0,
    lastActive: new Date(),
  };

  return (
    <motion.div 
      className={`offline-mode-container w-full h-screen relative overflow-hidden ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background with offline overlay */}
      <div 
        className="offline-background absolute inset-0"
        style={{ backgroundColor: '#2B2340' }}
      >
        {/* Offline overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        
        {/* Garden View (Read-only) */}
        <motion.div 
          className="garden-canvas relative w-full h-full"
          initial={{ scale: 0.95, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 0.8 }}
          transition={{ duration: 0.6 }}
        >
          {/* Garden Grid - Dimmed */}
          <div className="garden-grid absolute inset-0 grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 grid-rows-4 sm:grid-rows-6 lg:grid-rows-8 gap-1 p-2 sm:p-4 opacity-60">
            {Array.from({ length: 48 }, (_, index) => (
              <div
                key={index}
                className="garden-tile relative rounded-lg border border-purple-400/10 min-h-[20px] sm:min-h-[30px]"
                style={{ backgroundColor: 'rgba(167, 139, 250, 0.05)' }}
              >
                {/* Cached seed visualization */}
                {index < displayGameState.seedsPlanted && (
                  <div className="seed-indicator absolute inset-0 flex items-center justify-center">
                    <div 
                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-full opacity-60"
                      style={{ backgroundColor: '#FFB347' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Central Tree Area - Cached state */}
          <div className="tree-container absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-70">
            <SpiritTree
              level={displayGameState.treeLevel}
              totalGrowth={displayGameState.totalGrowth}
              className="drop-shadow-lg grayscale"
            />
          </div>

          {/* Floating Spirits - Cached */}
          <div className="opacity-50">
            <FloatingSpirits
              spiritCount={displayGameState.spiritsFed}
              containerWidth={800}
              containerHeight={600}
              className="z-10"
            />
          </div>

          {/* Reddit Robot - Offline state */}
          <div className="robot-container absolute bottom-16 sm:bottom-20 right-4 sm:right-20 z-20 opacity-60">
            <RedditRobot
              chargeLevel={displayGameState.robotCharged}
              isCollecting={false}
              className="drop-shadow-lg grayscale"
            />
          </div>

          {/* Cached Game State Display */}
          <motion.div 
            className="game-info absolute top-2 sm:top-4 left-2 sm:left-4 text-white bg-black/50 rounded-lg p-2 sm:p-3 max-w-[140px] sm:max-w-none border border-yellow-500/50"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="font-bold text-sm sm:text-lg mb-1 sm:mb-2 truncate text-yellow-300">
              r/{displayGameState.subredditName} (Cached)
            </h3>
            <div className="space-y-1 text-xs sm:text-sm opacity-80">
              <div>Growth: {displayGameState.totalGrowth.toFixed(1)}</div>
              <div>Seeds: {displayGameState.seedsPlanted}</div>
              <div>Spirits: {displayGameState.spiritsFed}</div>
              <div>Robot: {displayGameState.robotCharged}</div>
            </div>
          </motion.div>

          {/* Cached Player Resources Display */}
          <motion.div 
            className="player-info absolute top-2 sm:top-4 right-2 sm:right-4 text-white bg-black/50 rounded-lg p-2 sm:p-3 max-w-[140px] sm:max-w-none border border-yellow-500/50"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="font-bold text-sm sm:text-lg mb-1 sm:mb-2 truncate text-yellow-300">
              {displayPlayerResources.username} (Cached)
            </h3>
            <div className="space-y-1 text-xs sm:text-sm opacity-80">
              <div>🍯 {displayPlayerResources.cinnamon}</div>
              <div>🌱 {displayPlayerResources.seeds}</div>
              <div>⚡ {displayPlayerResources.energy}</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Offline Mode Overlay */}
      <motion.div 
        className="offline-overlay absolute inset-0 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <motion.div 
          className="offline-panel bg-black/80 backdrop-blur-md rounded-lg p-6 max-w-md mx-4 text-white text-center border border-yellow-500/50"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div 
            className="offline-icon text-6xl mb-4"
            animate={{ 
              rotate: [0, -5, 5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          >
            📡❌
          </motion.div>
          
          <motion.h2 
            className="text-2xl font-bold mb-4 text-yellow-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            You're Offline
          </motion.h2>
          
          <motion.p 
            className="text-gray-200 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            You can view your cached garden state, but actions are disabled until you reconnect.
          </motion.p>

          <div className="flex flex-col gap-3">
            <motion.button
              onClick={onRetry}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              Try to Reconnect
            </motion.button>
            
            <motion.button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </motion.button>
          </div>

          {/* Offline Details */}
          <AnimatePresence>
            {showDetails && (
              <motion.div 
                className="mt-4 p-3 bg-black/30 rounded text-left text-sm"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-2">
                  <div>
                    <strong>Last Update:</strong> {
                      gameState?.updatedAt 
                        ? new Date(gameState.updatedAt).toLocaleString()
                        : 'No cached data'
                    }
                  </div>
                  <div>
                    <strong>Network Status:</strong> Disconnected
                  </div>
                  <div>
                    <strong>Available Actions:</strong> View only
                  </div>
                  <div className="text-yellow-300 text-xs mt-2">
                    Your progress will sync automatically when you reconnect.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};