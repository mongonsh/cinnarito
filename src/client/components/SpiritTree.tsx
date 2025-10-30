import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpiritTreeProps {
  level: number;
  totalGrowth: number;
  className?: string;
}

export const SpiritTree: React.FC<SpiritTreeProps> = ({
  level,
  totalGrowth,
  className = '',
}) => {
  // Calculate tree size based on level
  const getTreeSize = (level: number) => {
    const baseSize = 80; // Base size in pixels
    const growthFactor = 1.2; // 20% growth per level
    return Math.min(baseSize * Math.pow(growthFactor, level - 1), 200); // Cap at 200px
  };

  // Get tree emoji based on level
  const getTreeEmoji = (level: number) => {
    if (level <= 1) return '🌱'; // Seedling
    if (level <= 3) return '🌿'; // Small plant
    if (level <= 5) return '🌳'; // Tree
    if (level <= 8) return '🌲'; // Evergreen tree
    return '🎄'; // Christmas tree for max level
  };

  // Get tree color based on level
  const getTreeColor = (level: number) => {
    if (level <= 1) return '#90EE90'; // Light green
    if (level <= 3) return '#32CD32'; // Lime green
    if (level <= 5) return '#228B22'; // Forest green
    if (level <= 8) return '#006400'; // Dark green
    return '#A78BFA'; // Purple for max level (magical)
  };

  // Calculate growth progress to next level
  const getGrowthProgress = (level: number, totalGrowth: number) => {
    const growthPerLevel = 50; // Growth needed per level
    const expectedGrowthForLevel = (level - 1) * growthPerLevel;
    const currentLevelGrowth = totalGrowth - expectedGrowthForLevel;
    return Math.max(0, Math.min(100, (currentLevelGrowth / growthPerLevel) * 100));
  };

  const treeSize = getTreeSize(level);
  const treeEmoji = getTreeEmoji(level);
  const treeColor = getTreeColor(level);
  const growthProgress = getGrowthProgress(level, totalGrowth);

  return (
    <motion.div 
      className={`spirit-tree-container relative ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Tree Base/Roots */}
      <motion.div 
        className="tree-base absolute bottom-0 left-1/2 transform -translate-x-1/2 rounded-full opacity-30"
        style={{
          width: `${treeSize * 0.8}px`,
          height: `${treeSize * 0.2}px`,
          backgroundColor: '#8B4513', // Brown color for roots
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      />

      {/* Main Tree */}
      <motion.div 
        className="tree-main relative flex items-center justify-center"
        style={{
          width: `${treeSize}px`,
          height: `${treeSize}px`,
          fontSize: `${treeSize * 0.6}px`,
          color: treeColor,
          filter: `drop-shadow(0 0 ${Math.max(level * 2, 4)}px ${treeColor}40)`,
        }}
        key={level} // Re-animate when level changes
        initial={{ scale: 0.5, y: 20 }}
        animate={{ 
          scale: 1,
          y: 0,
          rotate: [0, 1, -1, 0]
        }}
        transition={{
          scale: { duration: 0.8, ease: "backOut" },
          y: { duration: 0.8, ease: "backOut" },
          rotate: { duration: 4, repeat: Infinity, repeatType: 'reverse' }
        }}
      >
        <motion.div 
          className="tree-emoji"
          animate={{
            y: [0, -2, 0],
          }}
          transition={{
            duration: 2 + level * 0.3,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: "easeInOut"
          }}
        >
          {treeEmoji}
        </motion.div>
      </motion.div>

      {/* Growth Progress Ring */}
      <motion.div 
        className="growth-ring absolute inset-0 rounded-full border-4 border-transparent"
        style={{
          background: `conic-gradient(#FFB347 ${growthProgress}%, transparent ${growthProgress}%)`,
          mask: 'radial-gradient(circle, transparent 70%, black 72%)',
          WebkitMask: 'radial-gradient(circle, transparent 70%, black 72%)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Level Indicator */}
      <motion.div 
        className="level-indicator absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <motion.div 
          className="level-badge px-3 py-1 rounded-full text-white font-bold text-sm shadow-lg"
          style={{ backgroundColor: '#A78BFA' }}
          whileHover={{ scale: 1.1 }}
          animate={{
            boxShadow: [
              '0 4px 8px rgba(167, 139, 250, 0.3)',
              '0 6px 12px rgba(167, 139, 250, 0.5)',
              '0 4px 8px rgba(167, 139, 250, 0.3)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        >
          Level {level}
        </motion.div>
        <motion.div 
          className="growth-text text-xs text-white/70 mt-1"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        >
          {totalGrowth.toFixed(1)} growth
        </motion.div>
      </motion.div>

      {/* Magical Sparkles for higher levels */}
      <AnimatePresence>
        {level >= 5 && (
          <motion.div 
            className="sparkles absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {Array.from({ length: Math.min(level - 4, 6) }, (_, index) => (
              <motion.div
                key={index}
                className="sparkle absolute"
                style={{
                  left: `${20 + (index * 15) % 60}%`,
                  top: `${20 + (index * 20) % 60}%`,
                }}
                initial={{ scale: 0, rotate: 0 }}
                animate={{ 
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360],
                  y: [0, -10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.3,
                  ease: "easeInOut"
                }}
              >
                <div className="text-yellow-300 text-xs">✨</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Growth Animation Overlay */}
      <motion.div 
        className="growth-animation absolute inset-0 rounded-full pointer-events-none"
        style={{
          backgroundColor: `${treeColor}20`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0, 0.3, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse'
        }}
      />
    </motion.div>
  );
};