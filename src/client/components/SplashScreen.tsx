import { motion } from 'framer-motion';
import { useState } from 'react';

interface SplashScreenProps {
  onStart: () => void;
}

export const SplashScreen = ({ onStart }: SplashScreenProps) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStart = () => {
    setIsTransitioning(true);
    // Delay the actual transition to allow exit animation
    setTimeout(() => {
      onStart();
    }, 800);
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-900 to-purple-800 text-white relative overflow-hidden"
      style={{ backgroundColor: '#2B2340' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-orange-300 rounded-full opacity-30"
            style={{ backgroundColor: '#FFB347' }}
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 600),
            }}
            animate={{
              y: [null, -20, 20, -10],
              x: [null, 10, -10, 5],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="z-10 flex flex-col items-center space-y-8">
        {/* Cinnarito Logo */}
        <motion.div
          className="text-center"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <motion.h1
            className="text-4xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-300 to-orange-300 bg-clip-text text-transparent px-4"
            style={{
              background: 'linear-gradient(45deg, #A78BFA, #FFB347)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            Cinnarito
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl text-purple-200 max-w-md mx-auto px-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            Grow your spirit tree together, one cinnamon roll at a time
          </motion.p>
        </motion.div>

        {/* Animated Characters */}
        <div className="flex items-center justify-center space-x-8 sm:space-x-12">
          {/* Spirit Character */}
          <motion.div
            className="text-4xl sm:text-6xl"
            initial={{ x: -100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              x: { duration: 1, delay: 1 },
              opacity: { duration: 1, delay: 1 },
              y: { duration: 2, repeat: Infinity, repeatType: 'reverse' },
              rotate: { duration: 3, repeat: Infinity, repeatType: 'reverse' }
            }}
          >
            👻
          </motion.div>

          {/* Tree in the middle */}
          <motion.div
            className="text-6xl sm:text-8xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              rotate: [0, 2, -2, 0]
            }}
            transition={{
              scale: { duration: 1, delay: 1.2 },
              opacity: { duration: 1, delay: 1.2 },
              rotate: { duration: 4, repeat: Infinity, repeatType: 'reverse' }
            }}
          >
            🌳
          </motion.div>

          {/* Reddit Robot Character */}
          <motion.div
            className="text-4xl sm:text-6xl"
            initial={{ x: 100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              y: [0, -8, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              x: { duration: 1, delay: 1 },
              opacity: { duration: 1, delay: 1 },
              y: { duration: 2.5, repeat: Infinity, repeatType: 'reverse' },
              scale: { duration: 2, repeat: Infinity, repeatType: 'reverse' }
            }}
          >
            🤖
          </motion.div>
        </div>

        {/* Press Start Button */}
        <motion.button
          className="px-8 py-4 text-xl font-bold text-purple-900 bg-gradient-to-r from-purple-300 to-orange-300 rounded-full shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105"
          style={{
            background: 'linear-gradient(45deg, #A78BFA, #FFB347)',
          }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          whileHover={{ 
            scale: 1.1,
            boxShadow: '0 10px 25px rgba(167, 139, 250, 0.3)'
          }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStart}
          disabled={isTransitioning}
        >
          <motion.span
            animate={{
              opacity: [1, 0.7, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            Press Start
          </motion.span>
        </motion.button>

        {/* Subtitle animation */}
        <motion.div
          className="text-center text-purple-300 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
        >
          <motion.p
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            Join your community garden adventure
          </motion.p>
        </motion.div>
      </div>

      {/* Transition overlay */}
      {isTransitioning && (
        <motion.div
          className="absolute inset-0 bg-purple-900 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
      )}
    </motion.div>
  );
};