import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingSpiritsProps {
  spiritCount: number;
  containerWidth?: number;
  containerHeight?: number;
  className?: string;
}

interface Spirit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  emoji: string;
  animationDelay: number;
}

export const FloatingSpirits: React.FC<FloatingSpiritsProps> = ({
  spiritCount,
  containerWidth = 800,
  containerHeight = 600,
  className = '',
}) => {
  const [spirits, setSpirits] = useState<Spirit[]>([]);

  // Spirit emojis to choose from
  const spiritEmojis = ['👻', '🌟', '✨', '💫', '🔮'];

  // Initialize spirits
  useEffect(() => {
    const newSpirits: Spirit[] = [];
    
    for (let i = 0; i < Math.min(spiritCount, 12); i++) { // Cap at 12 spirits for performance
      newSpirits.push({
        id: i,
        x: Math.random() * (containerWidth - 60) + 30, // Keep spirits away from edges
        y: Math.random() * (containerHeight - 60) + 30,
        vx: (Math.random() - 0.5) * 0.5, // Slow horizontal movement
        vy: (Math.random() - 0.5) * 0.3, // Slower vertical movement
        size: 0.8 + Math.random() * 0.4, // Size between 0.8 and 1.2
        opacity: 0.6 + Math.random() * 0.3, // Opacity between 0.6 and 0.9
        emoji: spiritEmojis[Math.floor(Math.random() * spiritEmojis.length)] || '👻',
        animationDelay: Math.random() * 3, // Random animation delay
      });
    }
    
    setSpirits(newSpirits);
  }, [spiritCount, containerWidth, containerHeight]);

  // Animate spirits
  useEffect(() => {
    if (spirits.length === 0) return;

    const animationInterval = setInterval(() => {
      setSpirits(prevSpirits => 
        prevSpirits.map(spirit => {
          let newX = spirit.x + spirit.vx;
          let newY = spirit.y + spirit.vy;
          let newVx = spirit.vx;
          let newVy = spirit.vy;

          // Bounce off walls with some randomness
          if (newX <= 30 || newX >= containerWidth - 30) {
            newVx = -spirit.vx + (Math.random() - 0.5) * 0.2;
            newX = Math.max(30, Math.min(containerWidth - 30, newX));
          }
          
          if (newY <= 30 || newY >= containerHeight - 30) {
            newVy = -spirit.vy + (Math.random() - 0.5) * 0.2;
            newY = Math.max(30, Math.min(containerHeight - 30, newY));
          }

          // Add some random drift to make movement more organic
          newVx += (Math.random() - 0.5) * 0.02;
          newVy += (Math.random() - 0.5) * 0.02;

          // Limit velocity
          newVx = Math.max(-1, Math.min(1, newVx));
          newVy = Math.max(-0.8, Math.min(0.8, newVy));

          return {
            ...spirit,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
          };
        })
      );
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(animationInterval);
  }, [spirits.length, containerWidth, containerHeight]);

  return (
    <div className={`floating-spirits-container absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <AnimatePresence>
        {spirits.map((spirit) => (
          <motion.div
            key={spirit.id}
            className="floating-spirit absolute"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              x: spirit.x,
              y: spirit.y,
              scale: spirit.size,
              opacity: spirit.opacity,
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              x: { duration: 0.05, ease: "linear" },
              y: { duration: 0.05, ease: "linear" },
              scale: { duration: 0.3 },
              opacity: { duration: 0.3 }
            }}
          >
            {/* Spirit with glow effect */}
            <motion.div 
              className="spirit-glow relative"
              style={{
                filter: `drop-shadow(0 0 8px #A78BFA80)`,
              }}
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                rotate: { duration: 3 + spirit.animationDelay, repeat: Infinity, repeatType: 'reverse' },
                scale: { duration: 2 + spirit.animationDelay, repeat: Infinity, repeatType: 'reverse' }
              }}
            >
              <motion.div 
                className="spirit-emoji text-2xl"
                animate={{
                  opacity: [0.6, 1, 0.6],
                  y: [0, -3, 0]
                }}
                transition={{
                  duration: 2 + spirit.animationDelay,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: "easeInOut"
                }}
              >
                {spirit.emoji}
              </motion.div>
            </motion.div>

            {/* Trailing effect */}
            <motion.div 
              className="spirit-trail absolute inset-0 rounded-full"
              style={{
                backgroundColor: '#A78BFA',
              }}
              animate={{
                scale: [0.5, 1.5, 0.5],
                opacity: [0.2, 0, 0.2]
              }}
              transition={{
                duration: 3 + spirit.animationDelay,
                repeat: Infinity,
                delay: spirit.animationDelay
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Ambient magical particles */}
      <AnimatePresence>
        {spiritCount > 5 && (
          <motion.div 
            className="ambient-particles absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {Array.from({ length: Math.min(spiritCount - 5, 8) }, (_, index) => (
              <motion.div
                key={`particle-${index}`}
                className="ambient-particle absolute"
                style={{
                  left: `${20 + (index * 12) % 80}%`,
                  top: `${25 + (index * 18) % 70}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 0.8, 0],
                  y: [0, -20, 0]
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: index * 0.7,
                  ease: "easeInOut"
                }}
              >
                <div 
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: '#FFB347' }}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Energy waves for high spirit counts */}
      <AnimatePresence>
        {spiritCount > 10 && (
          <motion.div 
            className="energy-waves absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="energy-wave absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{
                width: '200px',
                height: '200px',
                borderColor: '#A78BFA40',
              }}
              animate={{
                scale: [0.5, 1.5, 0.5],
                opacity: [0.8, 0, 0.8]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
            <motion.div 
              className="energy-wave absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{
                width: '300px',
                height: '300px',
                borderColor: '#FFB34720',
              }}
              animate={{
                scale: [0.3, 1.8, 0.3],
                opacity: [0.6, 0, 0.6]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                delay: 2,
                ease: "easeOut"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};