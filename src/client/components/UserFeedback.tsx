import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface FeedbackMessage {
  id: string;
  type: FeedbackType;
  title: string;
  message: string;
  duration?: number | undefined;
  persistent?: boolean | undefined;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | undefined;
  }> | undefined;
}

interface UserFeedbackProps {
  className?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxMessages?: number;
}

interface FeedbackContextType {
  showFeedback: (message: Omit<FeedbackMessage, 'id'>) => string;
  hideFeedback: (id: string) => void;
  clearAll: () => void;
}

const FeedbackContext = React.createContext<FeedbackContextType | null>(null);

export const useFeedback = () => {
  const context = React.useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export const UserFeedback: React.FC<UserFeedbackProps> = ({
  className = '',
  position = 'top-right',
  maxMessages = 5,
}) => {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);

  const showFeedback = useCallback((message: Omit<FeedbackMessage, 'id'>) => {
    const id = `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: FeedbackMessage = {
      ...message,
      id,
      duration: message.duration ?? (message.persistent ? undefined : 5000),
    };

    setMessages(prev => {
      const updated = [newMessage, ...prev];
      return updated.slice(0, maxMessages);
    });

    // Auto-hide non-persistent messages
    if (!message.persistent && newMessage.duration) {
      setTimeout(() => {
        hideFeedback(id);
      }, newMessage.duration);
    }

    return id;
  }, [maxMessages]);

  const hideFeedback = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setMessages([]);
  }, []);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  const getTypeStyles = (type: FeedbackType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-600',
          border: 'border-green-500',
          icon: '✅',
          textColor: 'text-green-100',
        };
      case 'error':
        return {
          bg: 'bg-red-600',
          border: 'border-red-500',
          icon: '❌',
          textColor: 'text-red-100',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-600',
          border: 'border-yellow-500',
          icon: '⚠️',
          textColor: 'text-yellow-100',
        };
      case 'info':
        return {
          bg: 'bg-blue-600',
          border: 'border-blue-500',
          icon: 'ℹ️',
          textColor: 'text-blue-100',
        };
      case 'loading':
        return {
          bg: 'bg-purple-600',
          border: 'border-purple-500',
          icon: '⏳',
          textColor: 'text-purple-100',
        };
      default:
        return {
          bg: 'bg-gray-600',
          border: 'border-gray-500',
          icon: '📝',
          textColor: 'text-gray-100',
        };
    }
  };

  return (
    <FeedbackContext.Provider value={{ showFeedback, hideFeedback, clearAll }}>
      <div className={`feedback-container fixed ${getPositionClasses()} z-50 ${className}`}>
        <AnimatePresence mode="popLayout">
          {messages.map((message) => {
            const styles = getTypeStyles(message.type);
            
            return (
              <motion.div
                key={message.id}
                className={`feedback-message ${styles.bg} ${styles.border} ${styles.textColor} rounded-lg shadow-lg border p-4 mb-3 max-w-sm`}
                initial={{ 
                  opacity: 0, 
                  x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0,
                  y: position.includes('top') ? -20 : 20,
                  scale: 0.9 
                }}
                animate={{ 
                  opacity: 1, 
                  x: 0, 
                  y: 0, 
                  scale: 1 
                }}
                exit={{ 
                  opacity: 0, 
                  x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0,
                  scale: 0.9 
                }}
                transition={{ 
                  duration: 0.3, 
                  ease: "easeOut",
                  layout: { duration: 0.2 }
                }}
                layout
              >
                <div className="flex items-start gap-3">
                  <motion.div 
                    className="flex-shrink-0 text-lg"
                    animate={message.type === 'loading' ? {
                      rotate: [0, 360]
                    } : {}}
                    transition={message.type === 'loading' ? {
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    } : {}}
                  >
                    {styles.icon}
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-1">
                      {message.title}
                    </h4>
                    <p className="text-sm opacity-90">
                      {message.message}
                    </p>
                    
                    {message.actions && message.actions.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {message.actions.map((action, actionIndex) => (
                          <motion.button
                            key={actionIndex}
                            onClick={() => {
                              action.action();
                              if (!message.persistent) {
                                hideFeedback(message.id);
                              }
                            }}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              action.variant === 'primary'
                                ? 'bg-white/20 hover:bg-white/30 text-white'
                                : 'bg-black/20 hover:bg-black/30 text-white/80'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {action.label}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <motion.button
                    onClick={() => hideFeedback(message.id)}
                    className="flex-shrink-0 text-white/60 hover:text-white text-lg leading-none"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    ×
                  </motion.button>
                </div>
                
                {/* Progress bar for timed messages */}
                {!message.persistent && message.duration && (
                  <motion.div 
                    className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-lg"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ 
                      duration: message.duration / 1000,
                      ease: "linear"
                    }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </FeedbackContext.Provider>
  );
};

// Provider component for app-wide feedback
export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <UserFeedback />
    </>
  );
};

// Convenience hooks for common feedback types
export const useSuccessFeedback = () => {
  const { showFeedback } = useFeedback();
  return useCallback((title: string, message: string, actions?: FeedbackMessage['actions']) => {
    return showFeedback({ 
      type: 'success', 
      title, 
      message, 
      ...(actions && { actions })
    });
  }, [showFeedback]);
};

export const useErrorFeedback = () => {
  const { showFeedback } = useFeedback();
  return useCallback((title: string, message: string, actions?: FeedbackMessage['actions']) => {
    return showFeedback({ 
      type: 'error', 
      title, 
      message, 
      persistent: true, 
      ...(actions && { actions })
    });
  }, [showFeedback]);
};

export const useWarningFeedback = () => {
  const { showFeedback } = useFeedback();
  return useCallback((title: string, message: string, actions?: FeedbackMessage['actions']) => {
    return showFeedback({ 
      type: 'warning', 
      title, 
      message, 
      ...(actions && { actions })
    });
  }, [showFeedback]);
};

export const useLoadingFeedback = () => {
  const { showFeedback, hideFeedback } = useFeedback();
  return useCallback((title: string, message: string) => {
    const id = showFeedback({ type: 'loading', title, message, persistent: true });
    return () => hideFeedback(id);
  }, [showFeedback, hideFeedback]);
};