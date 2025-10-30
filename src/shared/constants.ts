// Game Configuration Constants
export const GAME_CONFIG = {
  // Resource costs for different actions
  RESOURCE_COSTS: {
    PLANT_SEED: 5,
    FEED_SPIRIT: 3,
    CHARGE_ROBOT: 10,
    POST_UPDATE: 0
  },

  // Growth calculation multipliers
  GROWTH_MULTIPLIERS: {
    SEEDS_PLANTED: 1.5,
    SPIRITS_FED: 2,
    ROBOT_CHARGED: 3,
    REDDIT_UPVOTES: 0.1
  },

  // Resource rewards
  RESOURCE_REWARDS: {
    UPVOTE_CINNAMON: 0.1,
    STARTING_CINNAMON: 10,
    DAILY_BONUS: 5
  },

  // Tree growth levels
  TREE_LEVELS: {
    SEEDLING: { level: 1, growthRequired: 0 },
    SAPLING: { level: 2, growthRequired: 50 },
    YOUNG_TREE: { level: 3, growthRequired: 150 },
    MATURE_TREE: { level: 4, growthRequired: 300 },
    ANCIENT_TREE: { level: 5, growthRequired: 500 },
    SPIRIT_TREE: { level: 6, growthRequired: 1000 }
  },

  // Visual theme colors
  COLORS: {
    PRIMARY_PURPLE: '#A78BFA',
    ACCENT_ORANGE: '#FFB347',
    BACKGROUND_DARK: '#2B2340',
    SUCCESS_GREEN: '#10B981',
    ERROR_RED: '#EF4444',
    WARNING_YELLOW: '#F59E0B'
  },

  // Animation settings
  ANIMATIONS: {
    TREE_GROWTH_DURATION: 2000,
    SPIRIT_FLOAT_DURATION: 3000,
    ROBOT_HOVER_DURATION: 4000,
    ACTION_FEEDBACK_DURATION: 1000,
    SPLASH_TRANSITION_DURATION: 1500
  },

  // Polling and sync settings
  SYNC: {
    POLLING_INTERVAL_ACTIVE: 5000,    // 5 seconds when active
    POLLING_INTERVAL_IDLE: 30000,     // 30 seconds when idle
    MAX_RETRY_ATTEMPTS: 3,
    RETRY_DELAY_BASE: 1000,
    CONNECTION_TIMEOUT: 10000
  },

  // Game limits and validation
  LIMITS: {
    MAX_ACTIONS_PER_MINUTE: 10,
    MAX_CINNAMON: 10000,
    MAX_TREE_LEVEL: 6,
    MIN_SUBREDDIT_NAME_LENGTH: 3,
    MAX_SUBREDDIT_NAME_LENGTH: 21
  }
} as const;

// API endpoints
export const API_ENDPOINTS = {
  INIT: (subreddit: string) => `/api/init/${subreddit}`,
  PLANT: '/api/plant',
  FEED: '/api/feed',
  CHARGE: '/api/charge',
  POST: '/api/post',
  STATE: (subreddit: string) => `/api/state/${subreddit}`
} as const;

// Redis key patterns
export const REDIS_KEYS = {
  SUBREDDIT_STATE: (subreddit: string) => `cinnarito:subreddit:${subreddit}:state`,
  PLAYER_RESOURCES: (username: string, subreddit: string) => 
    `cinnarito:player:${username}:${subreddit}:resources`,
  ACTION_HISTORY: (subreddit: string) => `cinnarito:subreddit:${subreddit}:actions`,
  DAILY_GROWTH: (subreddit: string, date: string) => 
    `cinnarito:subreddit:${subreddit}:daily:${date}`,
  ACTIVE_PLAYERS: (subreddit: string) => `cinnarito:subreddit:${subreddit}:active`,
  ACTION_COOLDOWN: (username: string, subreddit: string) => 
    `cinnarito:cooldown:${username}:${subreddit}`
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INSUFFICIENT_RESOURCES: 'Not enough cinnamon to perform this action',
  INVALID_ACTION: 'Invalid action type',
  SUBREDDIT_NOT_FOUND: 'Subreddit not found',
  PLAYER_NOT_FOUND: 'Player not found',
  NETWORK_ERROR: 'Network connection error',
  SERVER_ERROR: 'Server error occurred',
  VALIDATION_ERROR: 'Data validation failed',
  RATE_LIMIT_EXCEEDED: 'Too many actions performed recently',
  REDIS_CONNECTION_ERROR: 'Database connection error'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  SEED_PLANTED: 'Seed planted successfully! 🌱',
  SPIRIT_FED: 'Spirit fed with cinnamon! 👻',
  ROBOT_CHARGED: 'Robot charged and ready! 🤖',
  POST_CREATED: 'Community update posted! 📝',
  TREE_GREW: 'The Spirit Tree has grown! 🌳',
  MILESTONE_REACHED: 'Community milestone reached! 🎉'
} as const;