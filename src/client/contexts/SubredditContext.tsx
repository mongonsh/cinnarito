import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface SubredditContextValue {
  currentSubreddit: string | null;
  availableSubreddits: string[];
  switchSubreddit: (subredditName: string) => void;
  isLoading: boolean;
  error: string | null;
}

const SubredditContext = createContext<SubredditContextValue | undefined>(undefined);

export interface SubredditProviderProps {
  children: ReactNode;
  initialSubreddit?: string;
}

export const SubredditProvider: React.FC<SubredditProviderProps> = ({ 
  children, 
  initialSubreddit 
}) => {
  const [currentSubreddit, setCurrentSubreddit] = useState<string | null>(initialSubreddit || null);
  const [availableSubreddits, setAvailableSubreddits] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detect subreddit from Devvit context
  const detectSubredditFromContext = useCallback(async (): Promise<string | null> => {
    try {
      // In a real Devvit environment, this would come from the Devvit context
      // For now, we'll try to detect it from the URL or use a default
      
      // Check if we're in a Devvit context with subreddit information
      if (typeof window !== 'undefined' && (window as any).__devvit_context) {
        const devvitContext = (window as any).__devvit_context;
        if (devvitContext.subredditName) {
          return devvitContext.subredditName;
        }
      }

      // Try to extract from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const subredditFromUrl = urlParams.get('subreddit');
      if (subredditFromUrl) {
        return subredditFromUrl;
      }

      // Try to extract from path
      const pathMatch = window.location.pathname.match(/\/r\/([^\/]+)/);
      if (pathMatch) {
        return pathMatch[1];
      }

      // Default fallback for development
      return 'testsubreddit';
    } catch (err) {
      console.error('Error detecting subreddit from context:', err);
      return null;
    }
  }, []);

  // Load available subreddits from localStorage or API
  const loadAvailableSubreddits = useCallback(async (): Promise<string[]> => {
    try {
      // Try to load from localStorage first
      const stored = localStorage.getItem('cinnarito_available_subreddits');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }

      // In a real implementation, this might come from an API endpoint
      // For now, return the current subreddit as the only available one
      const current = await detectSubredditFromContext();
      return current ? [current] : [];
    } catch (err) {
      console.error('Error loading available subreddits:', err);
      return [];
    }
  }, [detectSubredditFromContext]);

  // Save available subreddits to localStorage
  const saveAvailableSubreddits = useCallback((subreddits: string[]) => {
    try {
      localStorage.setItem('cinnarito_available_subreddits', JSON.stringify(subreddits));
    } catch (err) {
      console.error('Error saving available subreddits:', err);
    }
  }, []);

  // Switch to a different subreddit
  const switchSubreddit = useCallback((subredditName: string) => {
    if (!subredditName) {
      setError('Invalid subreddit name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Add to available subreddits if not already present
      setAvailableSubreddits(prev => {
        const updated = prev.includes(subredditName) ? prev : [...prev, subredditName];
        saveAvailableSubreddits(updated);
        return updated;
      });

      // Switch to the new subreddit
      setCurrentSubreddit(subredditName);

      // Store the current subreddit preference
      localStorage.setItem('cinnarito_current_subreddit', subredditName);

      // Trigger a custom event to notify other components of the switch
      window.dispatchEvent(new CustomEvent('subredditChanged', {
        detail: { subredditName }
      }));
    } catch (err) {
      console.error('Error switching subreddit:', err);
      setError('Failed to switch subreddit');
    } finally {
      setIsLoading(false);
    }
  }, [saveAvailableSubreddits]);

  // Initialize subreddit context
  useEffect(() => {
    const initializeContext = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load available subreddits
        const available = await loadAvailableSubreddits();
        setAvailableSubreddits(available);

        // Determine current subreddit
        let current = currentSubreddit;

        // Check if we have a stored preference
        if (!current) {
          const stored = localStorage.getItem('cinnarito_current_subreddit');
          if (stored && available.includes(stored)) {
            current = stored;
          }
        }

        // If still no current subreddit, detect from context
        if (!current) {
          current = await detectSubredditFromContext();
        }

        // If we have a current subreddit, make sure it's in the available list
        if (current) {
          if (!available.includes(current)) {
            const updatedAvailable = [...available, current];
            setAvailableSubreddits(updatedAvailable);
            saveAvailableSubreddits(updatedAvailable);
          }
          setCurrentSubreddit(current);
        } else {
          setError('Unable to determine current subreddit');
        }
      } catch (err) {
        console.error('Error initializing subreddit context:', err);
        setError('Failed to initialize subreddit context');
      } finally {
        setIsLoading(false);
      }
    };

    initializeContext();
  }, [currentSubreddit, loadAvailableSubreddits, detectSubredditFromContext, saveAvailableSubreddits]);

  // Listen for external subreddit changes (e.g., from URL changes)
  useEffect(() => {
    const handleSubredditChange = (event: CustomEvent) => {
      const { subredditName } = event.detail;
      if (subredditName && subredditName !== currentSubreddit) {
        switchSubreddit(subredditName);
      }
    };

    window.addEventListener('subredditChanged', handleSubredditChange as EventListener);
    
    return () => {
      window.removeEventListener('subredditChanged', handleSubredditChange as EventListener);
    };
  }, [currentSubreddit, switchSubreddit]);

  const contextValue: SubredditContextValue = {
    currentSubreddit,
    availableSubreddits,
    switchSubreddit,
    isLoading,
    error,
  };

  return (
    <SubredditContext.Provider value={contextValue}>
      {children}
    </SubredditContext.Provider>
  );
};

export const useSubredditContext = (): SubredditContextValue => {
  const context = useContext(SubredditContext);
  if (context === undefined) {
    throw new Error('useSubredditContext must be used within a SubredditProvider');
  }
  return context;
};

// Hook for detecting subreddit changes
export const useSubredditDetection = () => {
  const { switchSubreddit } = useSubredditContext();

  useEffect(() => {
    // Listen for URL changes that might indicate a subreddit change
    const handlePopState = () => {
      const pathMatch = window.location.pathname.match(/\/r\/([^\/]+)/);
      if (pathMatch) {
        switchSubreddit(pathMatch[1]);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [switchSubreddit]);
};

// Utility function to get subreddit from Devvit context
export const getSubredditFromDevvitContext = (): string | null => {
  try {
    // In a real Devvit environment, this would access the actual context
    if (typeof window !== 'undefined' && (window as any).__devvit_context) {
      const devvitContext = (window as any).__devvit_context;
      return devvitContext.subredditName || null;
    }
    return null;
  } catch (err) {
    console.error('Error accessing Devvit context:', err);
    return null;
  }
};