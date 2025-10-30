import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerResources } from '../../shared/types';

interface ActionPanelProps {
  playerResources: PlayerResources;
  onPlant: () => void;
  onFeedSpirit: () => void;
  onChargeRobot: () => void;
  onPostUpdate: () => void;
  disabled: boolean;
  isActionInProgress?: boolean;
}

interface ActionButtonProps {
  emoji: string;
  label: string;
  cost: number;
  resourceType: 'cinnamon' | 'seeds' | 'energy';
  available: number;
  onClick: () => void;
  disabled: boolean;
  isInProgress?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  emoji,
  label,
  cost,
  resourceType,
  available,
  onClick,
  disabled,
  isInProgress = false,
}) => {
  const canAfford = available >= cost;
  const isDisabled = disabled || !canAfford || isInProgress;
  
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'cinnamon': return '🍯';
      case 'seeds': return '🌱';
      case 'energy': return '⚡';
      default: return '💰';
    }
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        action-button relative flex flex-col items-center justify-center
        w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2
        ${isDisabled 
          ? 'bg-gray-600/50 border-gray-500/50 cursor-not-allowed opacity-50' 
          : 'bg-purple-600/80 border-purple-400 cursor-pointer'
        }
      `}
      aria-label={`${label} - Cost: ${cost} ${resourceType}`}
      title={`${label}\nCost: ${cost} ${getResourceIcon(resourceType)}\nAvailable: ${available}`}
      whileHover={!isDisabled ? { 
        scale: 1.05,
        backgroundColor: 'rgba(139, 92, 246, 0.9)',
        borderColor: 'rgba(196, 181, 253, 1)',
        boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)'
      } : {}}
      whileTap={!isDisabled ? { 
        scale: 0.95,
        backgroundColor: 'rgba(139, 92, 246, 1)'
      } : {}}
      animate={isInProgress ? {
        scale: [1, 1.05, 1],
        opacity: [0.8, 1, 0.8]
      } : {}}
      transition={{
        scale: { duration: 0.2 },
        backgroundColor: { duration: 0.2 },
        borderColor: { duration: 0.2 },
        boxShadow: { duration: 0.2 }
      }}
    >
      {/* Action Emoji */}
      <motion.div 
        className="text-xl sm:text-2xl mb-1"
        animate={isInProgress ? {
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 1]
        } : {}}
        transition={{
          duration: 0.6,
          repeat: isInProgress ? Infinity : 0,
          repeatType: 'reverse'
        }}
      >
        {isInProgress ? '⏳' : emoji}
      </motion.div>
      
      {/* Resource Cost Display */}
      <motion.div 
        className="flex items-center text-xs text-white/90"
        animate={!canAfford ? {
          x: [-2, 2, -2, 2, 0],
          color: '#FCA5A5'
        } : {}}
        transition={{ duration: 0.5 }}
      >
        <span className="mr-1">{getResourceIcon(resourceType)}</span>
        <span className={canAfford ? 'text-green-300' : 'text-red-300'}>
          {cost}
        </span>
      </motion.div>
      
      {/* Visual feedback overlay for successful actions */}
      <AnimatePresence>
        {!isDisabled && (
          <motion.div 
            className="absolute inset-0 rounded-xl bg-gradient-to-t from-orange-400/20 to-transparent"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      {/* Success ripple effect */}
      <AnimatePresence>
        {!isDisabled && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-green-400"
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{ pointerEvents: 'none' }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export const ActionPanel: React.FC<ActionPanelProps> = ({
  playerResources,
  onPlant,
  onFeedSpirit,
  onChargeRobot,
  onPostUpdate,
  disabled,
  isActionInProgress = false,
}) => {
  // Action configurations with costs and requirements
  const actions = [
    {
      emoji: '🌿',
      label: 'Plant Seed',
      cost: 10,
      resourceType: 'cinnamon' as const,
      available: playerResources.cinnamon,
      onClick: onPlant,
    },
    {
      emoji: '🍩',
      label: 'Feed Spirit',
      cost: 15,
      resourceType: 'cinnamon' as const,
      available: playerResources.cinnamon,
      onClick: onFeedSpirit,
    },
    {
      emoji: '🤖',
      label: 'Charge Robot',
      cost: 25,
      resourceType: 'energy' as const,
      available: playerResources.energy,
      onClick: onChargeRobot,
    },
    {
      emoji: '💬',
      label: 'Post Update',
      cost: 5,
      resourceType: 'cinnamon' as const,
      available: playerResources.cinnamon,
      onClick: onPostUpdate,
    },
  ];

  return (
    <motion.div 
      className="action-panel fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "backOut" }}
    >
      <motion.div 
        className="bg-black/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-purple-400/30"
        whileHover={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderColor: 'rgba(196, 181, 253, 0.5)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Panel Header */}
        <motion.div 
          className="text-center mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.h3 
            className="text-white font-semibold text-sm sm:text-base"
            animate={{
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          >
            Actions
          </motion.h3>
          <motion.div 
            className="text-xs text-white/70 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Choose your contribution
          </motion.div>
        </motion.div>
        
        {/* Action Buttons Grid */}
        <motion.div 
          className="flex gap-2 sm:gap-3 justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {actions.map((action, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                duration: 0.4, 
                delay: 0.4 + index * 0.1,
                ease: "backOut"
              }}
            >
              <ActionButton
                emoji={action.emoji}
                label={action.label}
                cost={action.cost}
                resourceType={action.resourceType}
                available={action.available}
                onClick={action.onClick}
                disabled={disabled}
                isInProgress={isActionInProgress}
              />
            </motion.div>
          ))}
        </motion.div>
        
        {/* Status Messages */}
        <AnimatePresence>
          {disabled && (
            <motion.div 
              className="text-center mt-2 text-xs text-red-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              Actions temporarily disabled
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {isActionInProgress && (
            <motion.div 
              className="text-center mt-2 text-xs text-yellow-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: [1, 1.05, 1]
              }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ 
                opacity: { duration: 0.3 },
                y: { duration: 0.3 },
                scale: { duration: 1, repeat: Infinity, repeatType: 'reverse' }
              }}
            >
              Processing action...
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};