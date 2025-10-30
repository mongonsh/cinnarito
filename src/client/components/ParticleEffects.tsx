import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: string;
  x: number;
  y: number;
  emoji: string;
  color: string;
  size: number;
  duration: number;
  delay: number;
}

interface ParticleEffectsProps {
  trigger: boolean;
  type: 'success' | 'resource-gain' | 'resource-loss' | 'plant' | 'feed' | 'charge' | 'post';
  position?: { x: number; y: number };
  count?: number;
  className?: string;
}

const PARTICLE_CONFIGS = {
  success: {
    emojis: ['✨', '🌟', '💫', '⭐'],
    colors: ['#FFD700', '#FFA500', '#FF69B4', '#00FF7F'],
    count: 8,
    duration: 1.5,
  },
  'resource-gain': {
    emojis: ['🍯', '💰', '⚡', '🌟'],
    colors: ['#FFB347', '#FFD700', '#00FF7F', '#87CEEB'],
    count: 6,
    duration: 1.2,
  },
  'resource-loss': {
    emojis: ['💸', '📉', '⬇️'],
    colors: ['#FF6B6B', '#FF4444', '#CC3333'],
    count: 4,
    duration: 1.0,
  },
  plant: {
    emojis: ['🌱', '🌿', '🍃', '🌾'],
    colors: ['#90EE90', '#32CD32', '#228B22', '#006400'],
    count: 6,
    duration: 1.3,
  },
  feed: {
    emojis: ['🍩', '🍯', '✨', '💫'],
    colors: ['#FFB347', '#FFD700', '#FFA500', '#FF8C00'],
    count: 5,
    duration: 1.2,
  },
  charge: {
    emojis: ['⚡', '🔋', '💡', '⭐'],
    colors: ['#00BFFF', '#87CEEB', '#FFD700', '#FFFF00'],
    count: 7,
    duration: 1.4,
  },
  post: {
    emojis: ['💬', '📢', '🗨️', '📝'],
    colors: ['#A78BFA', '#8B5CF6', '#7C3AED', '#6D28D9'],
    count: 5,
    duration: 1.1,
  },
};

export const ParticleEffects: React.FC<ParticleEffectsProps> = ({
  trigger,
  type,
  position = { x: 50, y: 50 },
  count,
  className = '',
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [effectId, setEffectId] = useState(0);

  const config = PARTICLE_CONFIGS[type];
  const particleCount = count || config.count;

  useEffect(() => {
    if (trigger) {
      const newParticles: Particle[] = [];
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const distance = 30 + Math.random() * 40;
        const emoji = config.emojis[Math.floor(Math.random() * config.emojis.length)];
        const color = config.colors[Math.floor(Math.random() * config.colors.length)];
        
        newParticles.push({
          id: `${effectId}-${i}`,
          x: position.x + Math.cos(angle) * distance,
          y: position.y + Math.sin(angle) * distance,
          emoji,
          color,
          size: 0.8 + Math.random() * 0.4,
          duration: config.duration + Math.random() * 0.3,
          delay: Math.random() * 0.2,
        });
      }
      
      setParticles(newParticles);
      setEffectId(prev => prev + 1);
      
      // Clear particles after animation
      setTimeout(() => {
        setParticles([]);
      }, (config.duration + 0.5) * 1000);
    }
  }, [trigger, type, position.x, position.y, particleCount, config, effectId]);

  return (
    <div className={`particle-effects-container absolute inset-0 pointer-events-none ${className}`}>
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="particle absolute"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              color: particle.color,
              fontSize: `${particle.size}rem`,
            }}
            initial={{
              x: 0,
              y: 0,
              scale: 0,
              opacity: 0,
              rotate: 0,
            }}
            animate={{
              x: particle.x - position.x,
              y: particle.y - position.y,
              scale: [0, particle.size, particle.size * 0.8, 0],
              opacity: [0, 1, 0.8, 0],
              rotate: [0, 180, 360],
            }}
            exit={{
              scale: 0,
              opacity: 0,
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: "easeOut",
            }}
          >
            {particle.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Resource change animation component
interface ResourceChangeProps {
  value: number;
  type: 'cinnamon' | 'seeds' | 'energy';
  position?: { x: number; y: number };
  show: boolean;
}

export const ResourceChangeAnimation: React.FC<ResourceChangeProps> = ({
  value,
  type,
  position = { x: 50, y: 20 },
  show,
}) => {
  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'cinnamon': return '🍯';
      case 'seeds': return '🌱';
      case 'energy': return '⚡';
      default: return '💰';
    }
  };

  const isPositive = value > 0;
  const displayValue = Math.abs(value);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="resource-change absolute pointer-events-none z-50"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
          }}
          initial={{
            y: 0,
            opacity: 0,
            scale: 0.5,
          }}
          animate={{
            y: -30,
            opacity: 1,
            scale: 1,
          }}
          exit={{
            y: -50,
            opacity: 0,
            scale: 0.8,
          }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
          }}
        >
          <div 
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold shadow-lg ${
              isPositive 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
            }`}
          >
            <span>{isPositive ? '+' : '-'}</span>
            <span>{displayValue}</span>
            <span>{getResourceIcon(type)}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Loading state component with engaging animations
interface LoadingStateProps {
  message?: string;
  type?: 'default' | 'action' | 'sync' | 'growth';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  type = 'default',
  size = 'medium',
  className = '',
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const getLoadingAnimation = () => {
    switch (type) {
      case 'action':
        return {
          emoji: '⚡',
          color: '#FFD700',
          animation: {
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          },
        };
      case 'sync':
        return {
          emoji: '🔄',
          color: '#00BFFF',
          animation: {
            rotate: [0, 360],
          },
        };
      case 'growth':
        return {
          emoji: '🌱',
          color: '#32CD32',
          animation: {
            scale: [1, 1.3, 1],
            y: [0, -5, 0],
          },
        };
      default:
        return {
          emoji: '✨',
          color: '#A78BFA',
          animation: {
            rotate: [0, 360],
            opacity: [0.5, 1, 0.5],
          },
        };
    }
  };

  const loadingConfig = getLoadingAnimation();

  return (
    <div className={`loading-state flex flex-col items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} flex items-center justify-center text-2xl`}
        style={{ color: loadingConfig.color }}
        animate={loadingConfig.animation}
        transition={{
          duration: type === 'sync' ? 1 : 2,
          repeat: Infinity,
          repeatType: type === 'action' || type === 'growth' ? 'reverse' : 'loop',
          ease: type === 'sync' ? 'linear' : 'easeInOut',
        }}
      >
        {loadingConfig.emoji}
      </motion.div>
      
      {message && (
        <motion.p
          className="text-white text-sm mt-2 text-center"
          animate={{
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};