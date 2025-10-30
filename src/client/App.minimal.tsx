import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary';

// Minimal App component for testing
const MinimalApp = () => {
  const [showSplash, setShowSplash] = useState(true);

  const handleStartGame = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-purple-800">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🌳</div>
          <h1 className="text-4xl font-bold mb-4">Cinnarito</h1>
          <p className="text-lg mb-8">Community Garden Game</p>
          <button
            onClick={handleStartGame}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Press Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-purple-800">
      <div className="text-center text-white">
        <div className="text-6xl mb-4">🌳</div>
        <h1 className="text-2xl font-bold mb-4">Welcome to the Garden!</h1>
        <p className="mb-4">This is a minimal version to test the app.</p>
        <button
          onClick={() => setShowSplash(true)}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Back to Splash
        </button>
      </div>
    </div>
  );
};

// Main App component with error boundary
export const App = () => {
  return (
    <ErrorBoundary>
      <MinimalApp />
    </ErrorBoundary>
  );
};