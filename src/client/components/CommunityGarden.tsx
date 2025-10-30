import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameState, PlayerResources, PlayerActionType } from '../../shared/types';
import { SpiritTree } from './SpiritTree';
import { FloatingSpirits } from './FloatingSpirits';
import { RedditRobot } from './RedditRobot';
import { ActionPanel } from './ActionPanel';
import { ParticleEffects, ResourceChangeAnimation, LoadingState } from './ParticleEffects';
import { HoverCard, GlowingBorder, Tooltip } from './HoverEffects';
import { useMobileTouch } from '../hooks/useMobileTouch';

interface PerformanceSettings {
  enableAnimations: boolean;
  particleCount: number;
  updateInterval: number;
  enableBlur: boolean;
  enableShadows: boolean;
}

interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  supportsWebGL: boolean;
  supportsWebGL2: boolean;
  devicePixelRatio: number;
  maxTextureSize: number;
  preferReducedMotion: boolean;
}

interface HapticFeedback {
  lightTap: () => void;
  mediumTap: () => void;
  heavyTap: () => void;
  doubleTap: () => void;
  errorFeedback: () => void;
  successFeedback: () => void;
}

interface CommunityGardenProps {
  subredditName: string;
  gameState: GameState;
  playerResources: PlayerResources;
  onAction: (action: PlayerActionType) => void;
  onPlant: () => void;
  onFeedSpirit: () => void;
  onChargeRobot: () => void;
  onPostUpdate: () => void;
  isActionInProgress?: boolean;
  actionDisabled?: boolean;
  performanceSettings?: PerformanceSettings;
  deviceCapabilities?: DeviceCapabilities;
  hapticFeedback?: HapticFeedback;
}

interface ActionFeedback {
  type: 'plant' | 'feed' | 'charge' | 'post';
  position: { x: number; y: number };
  resourceChange?: { type: 'cinnamon' | 'seeds' | 'energy'; value: number };
}

export const CommunityGarden: React.FC<CommunityGardenProps> = ({
  subredditName,
  gameState,
  playerResources,
  onAction,
  onPlant,
  onFeedSpirit,
  onChargeRobot,
  onPostUpdate,
  isActionInProgress = false,
  actionDisabled = false,
  performanceSettings = {
    enableAnimations: true,
    particleCount: 50,
    updateInterval: 1000,
    enableBlur: true,
    enableShadows: true,
  },
  deviceCapabilities = {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    hasTouch: false,
    supportsWebGL: false,
    supportsWebGL2: false,
    devicePixelRatio: 1,
    maxTextureSize: 0,
    preferReducedMotion: false,
  },
  hapticFeedback = {
    lightTap: () => {},
    mediumTap: () => {},
    heavyTap: () => {},
    doubleTap: () => {},
    errorFeedback: () => {},
    successFeedback: () => {},
  },
}) => {
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [resourceChange, setResourceChange] = useState<{ type: 'cinnamon' | 'seeds' | 'energy'; value: number } | null>(null);
  const [previousResources, setPreviousResources] = useState(playerResources);
  
  const gardenRef = useRef<HTMLDivElement>(null);

  // Track resource changes for animations
  useEffect(() => {
    if (previousResources) {
      const cinnamonChange = playerResources.cinnamon - previousResources.cinnamon;
      const seedsChange = playerResources.seeds - previousResources.seeds;
      const energyChange = playerResources.energy - previousResources.energy;

      if (cinnamonChange !== 0) {
        setResourceChange({ type: 'cinnamon', value: cinnamonChange });
        setTimeout(() => setResourceChange(null), 2000);
      } else if (seedsChange !== 0) {
        setResourceChange({ type: 'seeds', value: seedsChange });
        setTimeout(() => setResourceChange(null), 2000);
      } else if (energyChange !== 0) {
        setResourceChange({ type: 'energy', value: energyChange });
        setTimeout(() => setResourceChange(null), 2000);
      }
    }
    setPreviousResources(playerResources);
  }, [playerResources, previousResources]);

  const handleGardenInteraction = (position: { x: number; y: number }, isTouch = false) => {
    // Trigger particle effect at interaction position
    setActionFeedback({
      type: 'plant',
      position,
    });
    setShowParticles(true);
    
    // Provide haptic feedback for touch interactions
    if (isTouch && deviceCapabilities.hasTouch) {
      hapticFeedback.lightTap();
    }
    
    setTimeout(() => {
      setShowParticles(false);
      setActionFeedback(null);
    }, 1500);
    
    console.log(`Garden interacted at (${position.x}%, ${position.y}%)`);
    onAction('plant');
  };

  const handleGardenClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Handle click interactions for planting seeds or other garden interactions
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    handleGardenInteraction({ x, y }, false);
  };

  // Mobile touch handling
  useMobileTouch(gardenRef as React.RefObject<HTMLElement>, {
    onTap: (touchGesture) => {
      if (!actionDisabled) {
        const rect = gardenRef.current?.getBoundingClientRect();
        if (rect) {
          const x = ((touchGesture.currentPosition.x - rect.left) / rect.width) * 100;
          const y = ((touchGesture.currentPosition.y - rect.top) / rect.height) * 100;
          handleGardenInteraction({ x, y }, true);
        }
      }
    },
    onDoubleTap: () => {
      if (!actionDisabled) {
        hapticFeedback.doubleTap();
        // Double tap could trigger a special action
        console.log('Double tap detected');
      }
    },
    onLongPress: () => {
      if (!actionDisabled) {
        hapticFeedback.heavyTap();
        // Long press could show context menu or info
        console.log('Long press detected');
      }
    },
  }, {
    preventDefault: deviceCapabilities.hasTouch,
  });

  const handleActionWithFeedback = (actionType: 'plant' | 'feed' | 'charge' | 'post', actionFn: () => void) => {
    // Trigger visual feedback
    const positions = {
      plant: { x: 50, y: 70 },
      feed: { x: 30, y: 40 },
      charge: { x: 80, y: 80 },
      post: { x: 50, y: 20 },
    };

    setActionFeedback({
      type: actionType,
      position: positions[actionType],
    });
    setShowParticles(true);
    
    // Provide haptic feedback
    if (deviceCapabilities.hasTouch) {
      hapticFeedback.mediumTap();
    }
    
    setTimeout(() => {
      setShowParticles(false);
      setActionFeedback(null);
    }, 1500);

    actionFn();
  };

  return (
    <motion.div 
      className="community-garden-container w-full h-screen relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background with the specified color palette */}
      <div 
        className="garden-background absolute inset-0"
        style={{ backgroundColor: '#2B2340' }}
      >
        {/* Garden Canvas/Container */}
        <motion.div 
          ref={gardenRef}
          className={`garden-canvas relative w-full h-full ${
            deviceCapabilities.hasTouch ? 'touch-manipulation' : 'cursor-pointer'
          }`}
          onClick={!deviceCapabilities.hasTouch ? handleGardenClick : undefined}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleGardenClick(e as any);
            }
          }}
          aria-label="Community garden - tap or click to interact"
          whileHover={performanceSettings.enableAnimations ? { scale: 1.002 } : {}}
          transition={{ duration: 0.3 }}
          style={{
            willChange: performanceSettings.enableAnimations ? 'transform' : 'auto',
          }}
        >
          {/* Garden Grid/Tile System - Responsive grid */}
          <div className="garden-grid absolute inset-0 grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 grid-rows-4 sm:grid-rows-6 lg:grid-rows-8 gap-1 p-2 sm:p-4">
            {/* Generate garden tiles - fixed count for now, can be made responsive later */}
            {Array.from({ length: 48 }, (_, index) => (
              <HoverCard
                key={index}
                hoverScale={1.1}
                glowColor="#A78BFA"
                className="garden-tile relative rounded-lg border border-purple-400/20 min-h-[20px] sm:min-h-[30px]"
                style={{ backgroundColor: 'rgba(167, 139, 250, 0.1)' }}
              >
                {/* Seed visualization - show planted seeds */}
                {index < gameState.seedsPlanted && (
                  <Tooltip content={`Seed ${index + 1} - Growing!`}>
                    <motion.div 
                      className="seed-indicator absolute inset-0 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <motion.div 
                        className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                        style={{ backgroundColor: '#FFB347' }}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.8, 1, 0.8]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: 'reverse'
                        }}
                      />
                    </motion.div>
                  </Tooltip>
                )}
              </HoverCard>
            ))}
          </div>

          {/* Central Tree Area - SpiritTree component */}
          <div className="tree-container absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {performanceSettings.enableShadows ? (
              <GlowingBorder glowColor="#32CD32" intensity="medium">
                <SpiritTree
                  level={gameState.treeLevel}
                  totalGrowth={gameState.totalGrowth}
                  className="drop-shadow-lg"
                />
              </GlowingBorder>
            ) : (
              <SpiritTree
                level={gameState.treeLevel}
                totalGrowth={gameState.totalGrowth}
              />
            )}
          </div>

          {/* Floating Spirits Area - FloatingSpirits component */}
          {performanceSettings.enableAnimations && (
            <FloatingSpirits
              spiritCount={Math.min(gameState.spiritsFed, performanceSettings.particleCount)}
              containerWidth={deviceCapabilities.isMobile ? 400 : 800}
              containerHeight={deviceCapabilities.isMobile ? 600 : 600}
              className="z-10"
            />
          )}

          {/* Reddit Robot Area - RedditRobot component */}
          <div className="robot-container absolute bottom-16 sm:bottom-20 right-4 sm:right-20 z-20">
            {deviceCapabilities.isDesktop ? (
              <Tooltip content={`Robot Charge: ${gameState.robotCharged}/10`}>
                <RedditRobot
                  chargeLevel={gameState.robotCharged}
                  isCollecting={isActionInProgress}
                  className={performanceSettings.enableShadows ? "drop-shadow-lg" : ""}
                />
              </Tooltip>
            ) : (
              <RedditRobot
                chargeLevel={gameState.robotCharged}
                isCollecting={isActionInProgress}
                className={performanceSettings.enableShadows ? "drop-shadow-lg" : ""}
              />
            )}
          </div>

          {/* Game State Display - Responsive positioning */}
          <motion.div 
            className="game-info absolute top-2 sm:top-4 left-2 sm:left-4 text-white bg-black/30 rounded-lg p-2 sm:p-3 max-w-[140px] sm:max-w-none"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              scale: 1.05
            }}
          >
            <h3 className="font-bold text-sm sm:text-lg mb-1 sm:mb-2 truncate" style={{ color: '#A78BFA' }}>
              r/{subredditName}
            </h3>
            <div className="space-y-1 text-xs sm:text-sm">
              <motion.div
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              >
                Growth: {gameState.totalGrowth.toFixed(1)}
              </motion.div>
              <div>Seeds: {gameState.seedsPlanted}</div>
              <div>Spirits: {gameState.spiritsFed}</div>
              <div>Robot: {gameState.robotCharged}</div>
            </div>
          </motion.div>

          {/* Player Resources Display - Responsive positioning */}
          <motion.div 
            className="player-info absolute top-2 sm:top-4 right-2 sm:right-4 text-white bg-black/30 rounded-lg p-2 sm:p-3 max-w-[140px] sm:max-w-none"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              scale: 1.05
            }}
          >
            <h3 className="font-bold text-sm sm:text-lg mb-1 sm:mb-2 truncate" style={{ color: '#FFB347' }}>
              {playerResources.username}
            </h3>
            <div className="space-y-1 text-xs sm:text-sm">
              <div>🍯 {playerResources.cinnamon}</div>
              <div>🌱 {playerResources.seeds}</div>
              <div>⚡ {playerResources.energy}</div>
            </div>
          </motion.div>

          {/* Loading State Overlay */}
          {isActionInProgress && (
            <motion.div
              className="loading-overlay absolute inset-0 bg-black/20 flex items-center justify-center z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingState
                message="Processing action..."
                type="action"
                size="large"
              />
            </motion.div>
          )}

          {/* Particle Effects */}
          {actionFeedback && (
            <ParticleEffects
              trigger={showParticles}
              type={actionFeedback.type}
              position={actionFeedback.position}
            />
          )}

          {/* Resource Change Animation */}
          {resourceChange && (
            <ResourceChangeAnimation
              value={resourceChange.value}
              type={resourceChange.type}
              show={true}
              position={{ x: 85, y: 15 }}
            />
          )}
        </motion.div>
      </div>

      {/* Action Panel - Fixed position overlay */}
      <ActionPanel
        playerResources={playerResources}
        onPlant={() => handleActionWithFeedback('plant', onPlant)}
        onFeedSpirit={() => handleActionWithFeedback('feed', onFeedSpirit)}
        onChargeRobot={() => handleActionWithFeedback('charge', onChargeRobot)}
        onPostUpdate={() => handleActionWithFeedback('post', onPostUpdate)}
        disabled={actionDisabled}
        isActionInProgress={isActionInProgress}
      />
    </motion.div>
  );
};