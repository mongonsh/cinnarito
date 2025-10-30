import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RedditRobotProps {
  chargeLevel: number;
  isCollecting?: boolean;
  className?: string;
}

export const RedditRobot: React.FC<RedditRobotProps> = ({
  chargeLevel,
  isCollecting = false,
  className = '',
}) => {
  const [eyeState, setEyeState] = useState<'open' | 'blink' | 'closed'>('open');
  const [hoverOffset, setHoverOffset] = useState(0);
  const [collectingAnimation, setCollectingAnimation] = useState(false);

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyeState('blink');
      setTimeout(() => setEyeState('open'), 150);
    }, 2000 + Math.random() * 3000); // Random blink every 2-5 seconds

    return () => clearInterval(blinkInterval);
  }, []);

  // Hovering animation
  useEffect(() => {
    const hoverInterval = setInterval(() => {
      setHoverOffset(Math.sin(Date.now() / 1000) * 3); // Smooth sine wave hovering
    }, 50);

    return () => clearInterval(hoverInterval);
  }, []);

  // Collection animation trigger
  useEffect(() => {
    if (isCollecting) {
      setCollectingAnimation(true);
      const timeout = setTimeout(() => setCollectingAnimation(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [isCollecting]);

  // Get robot color based on charge level
  const getRobotColor = (charge: number) => {
    if (charge === 0) return '#666666'; // Gray when uncharged
    if (charge <= 2) return '#FF6B6B'; // Red for low charge
    if (charge <= 5) return '#FFB347'; // Orange for medium charge
    if (charge <= 8) return '#4ECDC4'; // Teal for high charge
    return '#A78BFA'; // Purple for max charge
  };

  // Get energy level indicator
  const getEnergyBars = (charge: number) => {
    const maxBars = 5;
    const activeBars = Math.min(Math.ceil((charge / 10) * maxBars), maxBars);
    return Array.from({ length: maxBars }, (_, index) => index < activeBars);
  };

  const robotColor = getRobotColor(chargeLevel);
  const energyBars = getEnergyBars(chargeLevel);

  return (
    <motion.div 
      className={`reddit-robot-container relative ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: "backOut" }}
    >
      {/* Robot Body */}
      <motion.div 
        className="robot-body relative"
        animate={{ 
          y: [0, -3, 0],
          rotate: [0, 1, -1, 0]
        }}
        transition={{
          y: { duration: 2, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut" },
          rotate: { duration: 3, repeat: Infinity, repeatType: 'reverse' }
        }}
      >
        {/* Main Robot Body */}
        <motion.div 
          className="robot-main w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex flex-col items-center justify-center relative shadow-lg"
          style={{
            backgroundColor: robotColor,
            boxShadow: `0 4px 12px ${robotColor}40`,
          }}
          animate={collectingAnimation ? {
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          } : {}}
          transition={{ duration: 0.8 }}
        >
          {/* Robot Eyes */}
          <div className="robot-eyes flex gap-1 mb-1">
            <motion.div 
              className="robot-eye w-2 h-2 rounded-full bg-white"
              animate={{
                scaleY: eyeState === 'blink' ? 0.2 : eyeState === 'closed' ? 0 : 1
              }}
              transition={{ duration: 0.15 }}
            />
            <motion.div 
              className="robot-eye w-2 h-2 rounded-full bg-white"
              animate={{
                scaleY: eyeState === 'blink' ? 0.2 : eyeState === 'closed' ? 0 : 1
              }}
              transition={{ duration: 0.15 }}
            />
          </div>

          {/* Robot Mouth/Speaker */}
          <motion.div 
            className="robot-mouth w-4 h-1 rounded-full bg-black/30"
            animate={collectingAnimation ? {
              scaleX: [1, 1.5, 1],
              scaleY: [1, 0.8, 1]
            } : {}}
            transition={{ duration: 0.6 }}
          />

          {/* Reddit Logo on chest */}
          <motion.div 
            className="robot-logo absolute bottom-1 text-xs"
            animate={{
              rotate: [0, 10, -10, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          >
            🤖
          </motion.div>
        </motion.div>

        {/* Robot Arms */}
        <div className="robot-arms absolute top-1/2 -left-2 -right-2 flex justify-between pointer-events-none">
          <motion.div 
            className="robot-arm w-3 h-1 rounded-full"
            style={{ backgroundColor: robotColor }}
            animate={collectingAnimation ? {
              rotate: [-10, -30, -10],
              y: [0, -2, 0]
            } : {
              rotate: [0, -5, 0]
            }}
            transition={{
              duration: collectingAnimation ? 0.8 : 2,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          />
          <motion.div 
            className="robot-arm w-3 h-1 rounded-full"
            style={{ backgroundColor: robotColor }}
            animate={collectingAnimation ? {
              rotate: [10, 30, 10],
              y: [0, -2, 0]
            } : {
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: collectingAnimation ? 0.8 : 2,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          />
        </div>

        {/* Robot Legs */}
        <div className="robot-legs absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
          <motion.div 
            className="robot-leg w-2 h-3 rounded-b-full"
            style={{ backgroundColor: robotColor }}
            animate={{
              scaleY: [1, 0.9, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: 0.2
            }}
          />
          <motion.div 
            className="robot-leg w-2 h-3 rounded-b-full"
            style={{ backgroundColor: robotColor }}
            animate={{
              scaleY: [1, 0.9, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: 0.4
            }}
          />
        </div>
      </motion.div>

      {/* Energy Level Indicator */}
      <motion.div 
        className="energy-indicator absolute -top-6 left-1/2 transform -translate-x-1/2 flex gap-0.5"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {energyBars.map((isActive, index) => (
          <motion.div
            key={index}
            className="energy-bar w-1.5 h-3 rounded-full"
            style={{
              backgroundColor: isActive ? robotColor : '#666666',
              boxShadow: isActive ? `0 0 4px ${robotColor}` : 'none',
            }}
            animate={isActive ? {
              opacity: [0.7, 1, 0.7],
              scale: [1, 1.1, 1]
            } : {
              opacity: 0.3
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: index * 0.1
            }}
          />
        ))}
      </motion.div>

      {/* Charge Level Text */}
      <motion.div 
        className="charge-text absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <motion.div 
          className="text-white text-xs font-bold"
          animate={{
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          Charge: {chargeLevel}
        </motion.div>
      </motion.div>

      {/* Collection Effect */}
      <AnimatePresence>
        {collectingAnimation && (
          <motion.div 
            className="collection-effect absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Cinnamon particles being collected */}
            {Array.from({ length: 6 }, (_, index) => (
              <motion.div
                key={index}
                className="cinnamon-particle absolute"
                style={{
                  left: `${20 + (index * 15) % 60}%`,
                  top: `${20 + (index * 20) % 60}%`,
                }}
                initial={{ scale: 0, y: 20 }}
                animate={{ 
                  scale: [0, 1, 0],
                  y: [20, -10, -30],
                  x: [0, Math.random() * 10 - 5, 0]
                }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
              >
                <div className="text-yellow-400 text-xs">🍯</div>
              </motion.div>
            ))}

            {/* Collection beam effect */}
            <motion.div 
              className="collection-beam absolute inset-0 rounded-lg"
              style={{
                background: `radial-gradient(circle, ${robotColor}40 0%, transparent 70%)`,
              }}
              animate={{
                scale: [0.8, 1.2, 0.8],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                duration: 0.5,
                repeat: 2,
                repeatType: 'reverse'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle Sparkles for high charge levels */}
      <AnimatePresence>
        {chargeLevel >= 8 && !collectingAnimation && (
          <motion.div 
            className="idle-sparkles absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {Array.from({ length: 3 }, (_, index) => (
              <motion.div
                key={index}
                className="sparkle absolute"
                style={{
                  left: `${30 + (index * 20) % 40}%`,
                  top: `${25 + (index * 25) % 50}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 1.2,
                  ease: "easeInOut"
                }}
              >
                <div className="text-yellow-300 text-xs">✨</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Low battery warning */}
      <AnimatePresence>
        {chargeLevel === 0 && (
          <motion.div 
            className="low-battery absolute -top-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="text-red-400 text-xs"
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
            >
              ⚠️ Low Battery
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};