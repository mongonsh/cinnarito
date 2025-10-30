import React, { useState } from 'react';
import { useSubredditContext } from '../contexts/SubredditContext';

export interface SubredditSwitcherProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export const SubredditSwitcher: React.FC<SubredditSwitcherProps> = ({
  className = '',
  showLabel = true,
  compact = false,
}) => {
  const { 
    currentSubreddit, 
    availableSubreddits, 
    switchSubreddit, 
    isLoading 
  } = useSubredditContext();
  
  const [isOpen, setIsOpen] = useState(false);
  const [customSubreddit, setCustomSubreddit] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSubredditSelect = (subredditName: string) => {
    switchSubreddit(subredditName);
    setIsOpen(false);
    setShowCustomInput(false);
    setCustomSubreddit('');
  };

  const handleCustomSubredditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSubreddit.trim()) {
      const cleanName = customSubreddit.trim().replace(/^r\//, '');
      handleSubredditSelect(cleanName);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setShowCustomInput(false);
      setCustomSubreddit('');
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        {showLabel && <span className="text-sm text-white/70">Loading...</span>}
      </div>
    );
  }

  if (!currentSubreddit) {
    return (
      <div className={`text-red-400 text-sm ${className}`}>
        No subreddit detected
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {showLabel && !compact && (
        <label className="block text-xs text-white/70 mb-1">
          Community
        </label>
      )}
      
      <div className="relative">
        <button
          onClick={toggleDropdown}
          disabled={isLoading}
          className={`
            flex items-center justify-between gap-2 px-3 py-2 
            bg-black/30 hover:bg-black/50 border border-white/20 
            rounded-lg text-white text-sm transition-colors
            ${compact ? 'min-w-0' : 'min-w-[120px]'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-orange-400 text-xs">r/</span>
            <span className="truncate">
              {currentSubreddit}
            </span>
          </div>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 border border-white/20 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {/* Available Subreddits */}
            {availableSubreddits.length > 0 && (
              <div className="p-2">
                <div className="text-xs text-white/50 mb-2 px-2">Recent Communities</div>
                {availableSubreddits.map((subreddit) => (
                  <button
                    key={subreddit}
                    onClick={() => handleSubredditSelect(subreddit)}
                    className={`
                      w-full text-left px-3 py-2 rounded text-sm transition-colors
                      flex items-center gap-2
                      ${subreddit === currentSubreddit 
                        ? 'bg-purple-600/30 text-purple-200' 
                        : 'hover:bg-white/10 text-white'
                      }
                    `}
                  >
                    <span className="text-orange-400 text-xs">r/</span>
                    <span className="truncate">{subreddit}</span>
                    {subreddit === currentSubreddit && (
                      <svg className="w-4 h-4 ml-auto text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Divider */}
            {availableSubreddits.length > 0 && (
              <div className="border-t border-white/10 my-1"></div>
            )}

            {/* Custom Subreddit Input */}
            {showCustomInput ? (
              <div className="p-3">
                <form onSubmit={handleCustomSubredditSubmit}>
                  <div className="text-xs text-white/50 mb-2">Enter Community Name</div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-black/50 border border-white/20 rounded px-2 py-1 flex-1">
                      <span className="text-orange-400 text-xs mr-1">r/</span>
                      <input
                        type="text"
                        value={customSubreddit}
                        onChange={(e) => setCustomSubreddit(e.target.value)}
                        placeholder="subreddit"
                        className="bg-transparent text-white text-sm outline-none flex-1 min-w-0"
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!customSubreddit.trim()}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs rounded transition-colors"
                    >
                      Go
                    </button>
                  </div>
                </form>
                <button
                  onClick={() => setShowCustomInput(false)}
                  className="text-xs text-white/50 hover:text-white/70 mt-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomInput(true)}
                className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Join Another Community
              </button>
            )}
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SubredditSwitcher;