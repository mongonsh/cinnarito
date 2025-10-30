import { redis } from '@devvit/web/server';
import { 
  GameState, 
  ActionHistory, 
  DailyGrowthStats,
  REDIS_KEYS,
  ERROR_MESSAGES,
  GAME_CONFIG,
  isGameState,
  isActionHistory
} from '../../shared/types';

/**
 * Redis service layer for game state operations
 * Handles CRUD operations for game state with subreddit-specific namespacing
 */
export class RedisGameService {
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  /**
   * Initialize game state for a subreddit if it doesn't exist
   */
  async initializeGameState(subredditName: string): Promise<GameState> {
    try {
      const existingState = await this.getGameState(subredditName);
      if (existingState) {
        return existingState;
      }

      const initialState: GameState = {
        subredditName,
        treeLevel: 1,
        totalGrowth: 0,
        seedsPlanted: 0,
        spiritsFed: 0,
        robotCharged: 0,
        dailyUpvotes: 0,
        lastGrowthCalculation: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveGameState(initialState);
      return initialState;
    } catch (error) {
      throw new Error(`Failed to initialize game state: ${error}`);
    }
  }

  /**
   * Get game state for a specific subreddit
   */
  async getGameState(subredditName: string): Promise<GameState | null> {
    return this.withRetry(async () => {
      const key = REDIS_KEYS.SUBREDDIT_STATE(subredditName);
      const data = await redis.get(key);
      
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);
      
      // Convert date strings back to Date objects
      parsed.lastGrowthCalculation = new Date(parsed.lastGrowthCalculation);
      parsed.createdAt = new Date(parsed.createdAt);
      parsed.updatedAt = new Date(parsed.updatedAt);

      if (!isGameState(parsed)) {
        throw new Error('Invalid game state data structure');
      }

      return parsed;
    });
  }

  /**
   * Save game state for a specific subreddit
   */
  async saveGameState(gameState: GameState): Promise<void> {
    return this.withRetry(async () => {
      const key = REDIS_KEYS.SUBREDDIT_STATE(gameState.subredditName);
      gameState.updatedAt = new Date();
      
      await redis.set(key, JSON.stringify(gameState));
    });
  }

  /**
   * Update specific fields of game state atomically
   */
  async updateGameState(
    subredditName: string, 
    updates: Partial<Omit<GameState, 'subredditName' | 'createdAt'>>
  ): Promise<GameState> {
    return this.withRetry(async () => {
      const currentState = await this.getGameState(subredditName);
      if (!currentState) {
        throw new Error(`Game state not found for subreddit: ${subredditName}`);
      }

      const updatedState: GameState = {
        ...currentState,
        ...updates,
        updatedAt: new Date()
      };

      // Recalculate tree level based on total growth
      updatedState.treeLevel = this.calculateTreeLevel(updatedState.totalGrowth);

      await this.saveGameState(updatedState);
      return updatedState;
    });
  }

  /**
   * Add action to history and update game state
   */
  async recordAction(actionHistory: Omit<ActionHistory, 'id' | 'timestamp'>): Promise<ActionHistory> {
    return this.withRetry(async () => {
      const action: ActionHistory = {
        ...actionHistory,
        id: this.generateActionId(),
        timestamp: new Date()
      };

      // Store action in a simple list for now (can be optimized later with sorted sets)
      const actionKey = REDIS_KEYS.ACTION_HISTORY(actionHistory.subredditName);
      const existingActions = await redis.get(actionKey);
      const actions = existingActions ? JSON.parse(existingActions) : [];
      
      actions.unshift(action); // Add to beginning
      
      // Keep only last 1000 actions
      if (actions.length > 1000) {
        actions.splice(1000);
      }
      
      await redis.set(actionKey, JSON.stringify(actions));

      // Update game state based on action
      await this.updateGameStateFromAction(action);

      return action;
    });
  }

  /**
   * Get recent actions for a subreddit
   */
  async getRecentActions(subredditName: string, limit: number = 50): Promise<ActionHistory[]> {
    return this.withRetry(async () => {
      const key = REDIS_KEYS.ACTION_HISTORY(subredditName);
      const data = await redis.get(key);
      
      if (!data) {
        return [];
      }
      
      const actions = JSON.parse(data);
      
      return actions.slice(0, limit).map((actionData: any) => {
        const parsed = { ...actionData };
        parsed.timestamp = new Date(parsed.timestamp);
        
        if (!isActionHistory(parsed)) {
          throw new Error('Invalid action history data structure');
        }
        
        return parsed;
      });
    });
  }

  /**
   * Get daily growth stats for a specific date
   */
  async getDailyGrowthStats(subredditName: string, date: string): Promise<DailyGrowthStats | null> {
    return this.withRetry(async () => {
      const key = REDIS_KEYS.DAILY_GROWTH(subredditName, date);
      const data = await redis.get(key);
      
      if (!data) {
        return null;
      }

      return JSON.parse(data);
    });
  }

  /**
   * Update daily growth stats
   */
  async updateDailyGrowthStats(subredditName: string, date: string, stats: DailyGrowthStats): Promise<void> {
    return this.withRetry(async () => {
      const key = REDIS_KEYS.DAILY_GROWTH(subredditName, date);
      await redis.set(key, JSON.stringify(stats));
      
      // Note: Redis expire might not be available in Devvit, so we'll handle cleanup manually
    });
  }

  /**
   * Track active players in a subreddit
   */
  async trackActivePlayer(username: string, subredditName: string): Promise<void> {
    return this.withRetry(async () => {
      const key = REDIS_KEYS.ACTIVE_PLAYERS(subredditName);
      const now = Date.now();
      
      // Get existing active players
      const existingData = await redis.get(key);
      const activePlayers = existingData ? JSON.parse(existingData) : {};
      
      // Add/update player timestamp
      activePlayers[username] = now;
      
      // Remove players inactive for more than 1 hour
      const oneHourAgo = now - (60 * 60 * 1000);
      Object.keys(activePlayers).forEach(player => {
        if (activePlayers[player] < oneHourAgo) {
          delete activePlayers[player];
        }
      });
      
      await redis.set(key, JSON.stringify(activePlayers));
    });
  }

  /**
   * Get count of active players in a subreddit
   */
  async getActivePlayerCount(subredditName: string): Promise<number> {
    return this.withRetry(async () => {
      const key = REDIS_KEYS.ACTIVE_PLAYERS(subredditName);
      const data = await redis.get(key);
      
      if (!data) {
        return 0;
      }
      
      const activePlayers = JSON.parse(data);
      return Object.keys(activePlayers).length;
    });
  }

  /**
   * Check if player has action cooldown
   */
  async checkActionCooldown(username: string, subredditName: string): Promise<boolean> {
    return this.withRetry(async () => {
      const key = REDIS_KEYS.ACTION_COOLDOWN(username, subredditName);
      const expiryTimeStr = await redis.get(key);
      
      if (!expiryTimeStr) {
        return false;
      }
      
      const expiryTime = parseInt(expiryTimeStr);
      const now = Date.now();
      
      if (now >= expiryTime) {
        // Cooldown expired, clean up
        await redis.del(key);
        return false;
      }
      
      return true;
    });
  }

  /**
   * Set action cooldown for player
   */
  async setActionCooldown(username: string, subredditName: string, durationMs: number = 60000): Promise<void> {
    return this.withRetry(async () => {
      const key = REDIS_KEYS.ACTION_COOLDOWN(username, subredditName);
      const expiryTime = Date.now() + durationMs;
      await redis.set(key, expiryTime.toString());
    });
  }

  /**
   * Calculate tree level based on total growth
   */
  private calculateTreeLevel(totalGrowth: number): number {
    const levels = Object.values(GAME_CONFIG.TREE_LEVELS);
    
    for (let i = levels.length - 1; i >= 0; i--) {
      const level = levels[i];
      if (level && totalGrowth >= level.growthRequired) {
        return level.level;
      }
    }
    
    return 1; // Default to seedling
  }

  /**
   * Update game state based on recorded action
   */
  private async updateGameStateFromAction(action: ActionHistory): Promise<void> {
    const updates: Partial<GameState> = {
      totalGrowth: 0 // Will be calculated
    };

    switch (action.actionType) {
      case 'plant':
        updates.seedsPlanted = 1;
        break;
      case 'feed':
        updates.spiritsFed = 1;
        break;
      case 'charge':
        updates.robotCharged = 1;
        break;
      case 'post':
        // Post action doesn't directly affect growth counters
        break;
    }

    // Get current state to calculate incremental updates
    const currentState = await this.getGameState(action.subredditName);
    if (currentState) {
      updates.seedsPlanted = currentState.seedsPlanted + (updates.seedsPlanted || 0);
      updates.spiritsFed = currentState.spiritsFed + (updates.spiritsFed || 0);
      updates.robotCharged = currentState.robotCharged + (updates.robotCharged || 0);
      updates.totalGrowth = currentState.totalGrowth + action.growthContributed;
    }

    await this.updateGameState(action.subredditName, updates);
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Retry wrapper for Redis operations with exponential backoff
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.maxRetries) {
          break;
        }
        
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error(`${ERROR_MESSAGES.REDIS_CONNECTION_ERROR}: ${lastError?.message || 'Unknown error'}`);
  }
}

// Export singleton instance
export const redisGameService = new RedisGameService();