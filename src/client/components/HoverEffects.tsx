import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface HoverCardProps {
  children: ReactNode;
  hoverScale?: number;
  hoverRotate?: number;
  glowColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const HoverCard: React.FC<HoverCardProps> = ({
  children,
  hoverScale = 1.05,
  hoverRotate = 0,
  glowColor = '#A78BFA',
  className = '',
  style,
}) => {
  return (
    <motion.div
      className={`hover-card ${className}`}
      style={style}
      whileHover={{
        scale: hoverScale,
        rotate: hoverRotate,
        boxShadow: `0 8px 25px ${glowColor}40`,
      }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  );
};

interface FloatingButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  className = '',
}) => {
  const variants = {
    primary: {
      bg: 'bg-purple-600',
      hover: 'hover:bg-purple-500',
      glow: '#A78BFA',
    },
    secondary: {
      bg: 'bg-gray-600',
      hover: 'hover:bg-gray-500',
      glow: '#9CA3AF',
    },
    success: {
      bg: 'bg-green-600',
      hover: 'hover:bg-green-500',
      glow: '#10B981',
    },
    warning: {
      bg: 'bg-yellow-600',
      hover: 'hover:bg-yellow-500',
      glow: '#F59E0B',
    },
    danger: {
      bg: 'bg-red-600',
      hover: 'hover:bg-red-500',
      glow: '#EF4444',
    },
  };

  const sizes = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  const variantConfig = variants[variant];
  const sizeConfig = sizes[size];

  return (
    <motion.button
      className={`
        floating-button relative rounded-full font-semibold text-white
        ${variantConfig.bg} ${variantConfig.hover} ${sizeConfig}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? {
        scale: 1.1,
        boxShadow: `0 8px 25px ${variantConfig.glow}60`,
        y: -2,
      } : {}}
      whileTap={!disabled ? {
        scale: 0.95,
        y: 0,
      } : {}}
      animate={!disabled ? {
        y: [0, -2, 0],
      } : {}}
      transition={{
        y: { duration: 2, repeat: Infinity, repeatType: 'reverse' },
        scale: { duration: 0.2 },
        boxShadow: { duration: 0.2 },
      }}
    >
      {children}
      
      {/* Ripple effect on click */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: variantConfig.glow }}
        initial={{ scale: 0, opacity: 0.5 }}
        whileTap={!disabled ? {
          scale: 1.2,
          opacity: 0,
        } : {}}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
};

interface PulsingIconProps {
  emoji: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  pulseColor?: string;
  className?: string;
}

export const PulsingIcon: React.FC<PulsingIconProps> = ({
  emoji,
  size = 'medium',
  color = '#FFFFFF',
  pulseColor = '#A78BFA',
  className = '',
}) => {
  const sizes = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl',
  };

  return (
    <motion.div
      className={`pulsing-icon relative inline-block ${sizes[size]} ${className}`}
      style={{ color }}
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    >
      {emoji}
      
      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor: pulseColor }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.8, 0, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />
    </motion.div>
  );
};

interface TooltipProps {
  children: ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`tooltip-container relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <motion.div
        className={`
          tooltip absolute z-50 px-2 py-1 text-xs text-white bg-black/80 
          rounded whitespace-nowrap pointer-events-none
          ${positionClasses[position]}
        `}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isVisible ? {
          opacity: 1,
          scale: 1,
        } : {
          opacity: 0,
          scale: 0.8,
        }}
        transition={{ duration: 0.2 }}
      >
        {content}
      </motion.div>
    </div>
  );
};

interface GlowingBorderProps {
  children: ReactNode;
  glowColor?: string;
  intensity?: 'low' | 'medium' | 'high';
  animated?: boolean;
  className?: string;
}

export const GlowingBorder: React.FC<GlowingBorderProps> = ({
  children,
  glowColor = '#A78BFA',
  intensity = 'medium',
  animated = true,
  className = '',
}) => {
  const intensities = {
    low: '0 0 10px',
    medium: '0 0 20px',
    high: '0 0 30px',
  };

  return (
    <motion.div
      className={`glowing-border relative ${className}`}
      style={{
        boxShadow: `${intensities[intensity]} ${glowColor}60`,
        border: `1px solid ${glowColor}80`,
      }}
      animate={animated ? {
        boxShadow: [
          `${intensities[intensity]} ${glowColor}40`,
          `${intensities[intensity]} ${glowColor}80`,
          `${intensities[intensity]} ${glowColor}40`,
        ],
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: 'reverse',
      }}
    >
      {children}
    </motion.div>
  );
};

interface MagneticButtonProps {
  children: ReactNode;
  onClick?: () => void;
  magnetStrength?: number;
  className?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  onClick,
  magnetStrength = 0.3,
  className = '',
}) => {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * magnetStrength;
    const deltaY = (e.clientY - centerY) * magnetStrength;
    
    setMousePosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.div
      className={`magnetic-button cursor-pointer ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{
        x: mousePosition.x,
        y: mousePosition.y,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      whileHover={{
        scale: 1.05,
      }}
      whileTap={{
        scale: 0.95,
      }}
    >
      {children}
      
      {/* Magnetic field visualization */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-full border border-purple-400/30"
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0.5 }}
          exit={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
};