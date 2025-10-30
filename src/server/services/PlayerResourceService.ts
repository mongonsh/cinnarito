import { redis } from '@devvit/web/server';
import { 
  PlayerResources, 
  REDIS_KEYS,
  ERROR_MESSAGES,
  GAME_CONFIG,
  isPlayerResources
} from '../../shared/types';

/**
 * Service for managing individual player resources and data
 * Handles resource earning, spending, and validation with Redis persistence
 */
export class PlayerResourceService {
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  /**
   * Initialize player resources if they don't exist
   */
  async initializePlayerResources(username: string, subredditName: string): Promise<PlayerResources> {
    try {
      const existingResources = await this.getPlayerResources(username, subredditName);
      if (existingResources) {
        return existingResources;
      }

      const initialResources: PlayerResources = {
        username,
        subredditName,
        cinnamon: GAME_CONFIG.RESOURCE_REWARDS.STARTING_CINNAMON,
        seeds: 0,
        energy: 0,
        totalContributions: 0,
        lastActive: new Date()
      };

      await this.savePlayerResources(initialResources);
      return initialResources;
    } catch (error) {
      throw new Error(`Failed to initialize player resources: ${error}`);
    }
  }

  /**
   * Get player resources for a specific player and subreddit
   */
  async getPlayerResources(username: string, subredditName: string): Promise<PlayerResources | null> {
    return this.withRetry(async () => {
      const key = REDIS_KEYS.PLAYER_RESOURCES(username, subredditName);
      const data = await redis.get(key);
      
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);
      
      // Convert date string back to Date object
      parsed.lastActive = new Date(parsed.lastActive);

      if (!isPlayerResources(parsed)) {
        throw new Error('Invalid player resources data structure');
      }

      return parsed;
    });
  }

  /**
   * Save player resources
   */
  async savePlayerResources(resources: PlayerResources): Promise<void> {
    return this.withRetry(async () => {
      const key = REDIS_KEYS.PLAYER_RESOURCES(resources.username, resources.subredditName);
      resources.lastActive = new Date();
      
      await redis.set(key, JSON.stringify(resources));
      
      // Update player index for the subreddit
      await this.updatePlayerIndex(resources.username, resources.subredditName);
    });
  }

  /**
   * Update player resources with validation
   */
  async updatePlayerResources(
    username: string, 
    subredditName: string, 
    updates: Partial<Omit<PlayerResources, 'username' | 'subredditName'>>
  ): Promise<PlayerResources> {
    return this.withRetry(async () => {
      const currentResources = await this.getPlayerResources(username, subredditName);
      if (!currentResources) {
        throw new Error(`Player resources not found: ${username} in ${subredditName}`);
      }

      const updatedResources: PlayerResources = {
        ...currentResources,
        ...updates,
        lastActive: new Date()
      };

      // Validate resource limits
      this.validateResourceLimits(updatedResources);

      await this.savePlayerResources(updatedResources);
      return updatedResources;
    });
  }

  /**
   * Earn cinnamon resources (e.g., from Reddit upvotes)
   */
  async earnCinnamon(username: string, subredditName: string, amount: number): Promise<PlayerResources> {
    if (amount <= 0) {
      throw new Error('Cinnamon amount must be positive');
    }

    return this.withRetry(async () => {
      const currentResources = await this.getPlayerResources(username, subredditName);
      if (!currentResources) {
        throw new Error(`Player resources not found: ${username} in ${subredditName}`);
      }

      const newCinnamon = Math.min(
        currentResources.cinnamon + amount,
        GAME_CONFIG.LIMITS.MAX_CINNAMON
      );

      return this.updatePlayerResources(username, subredditName, {
        cinnamon: newCinnamon
      });
    });
  }

  /**
   * Spend cinnamon resources with validation
   */
  async spendCinnamon(username: string, subredditName: string, amount: number): Promise<PlayerResources> {
    if (amount <= 0) {
      throw new Error('Cinnamon amount must be positive');
    }

    return this.withRetry(async () => {
      const currentResources = await this.getPlayerResources(username, subredditName);
      if (!currentResources) {
        throw new Error(`Player resources not found: ${username} in ${subredditName}`);
      }

      if (currentResources.cinnamon < amount) {
        throw new Error(ERROR_MESSAGES.INSUFFICIENT_RESOURCES);
      }

      return this.updatePlayerResources(username, subredditName, {
        cinnamon: currentResources.cinnamon - amount,
        totalContributions: currentResources.totalContributions + amount
      });
    });
  }

  /**
   * Validate if player can afford an action
   */
  async canAffordAction(username: string, subredditName: string, actionType: string): Promise<boolean> {
    return this.withRetry(async () => {
      const resources = await this.getPlayerResources(username, subredditName);
      if (!resources) {
        return false;
      }

      const cost = this.getActionCost(actionType);
      return resources.cinnamon >= cost;
    });
  }

  /**
   * Process action resource transaction
   */
  async processActionTransaction(
    username: string, 
    subredditName: string, 
    actionType: string
  ): Promise<{ resources: PlayerResources; cost: number }> {
    return this.withRetry(async () => {
      const cost = this.getActionCost(actionType);
      
      if (cost === 0) {
        // Free action, just update last active
        const resources = await this.updatePlayerResources(username, subredditName, {});
        return { resources, cost };
      }

      const resources = await this.spendCinnamon(username, subredditName, cost);
      return { resources, cost };
    });
  }

  /**
   * Award daily bonus cinnamon
   */
  async awardDailyBonus(username: string, subredditName: string): Promise<PlayerResources> {
    return this.earnCinnamon(username, subredditName, GAME_CONFIG.RESOURCE_REWARDS.DAILY_BONUS);
  }

  /**
   * Award cinnamon from Reddit upvotes
   */
  async awardUpvoteCinnamon(username: string, subredditName: string, upvoteCount: number): Promise<PlayerResources> {
    const cinnamonAmount = upvoteCount * GAME_CONFIG.RESOURCE_REWARDS.UPVOTE_CINNAMON;
    return this.earnCinnamon(username, subredditName, cinnamonAmount);
  }

  /**
   * Get all players for a subreddit (for leaderboards, etc.)
   * Note: This is a simplified implementation. In production, consider maintaining a separate index.
   */
  async getSubredditPlayers(subredditName: string, limit: number = 100): Promise<PlayerResources[]> {
    return this.withRetry(async () => {
      // For now, we'll maintain a simple index of players per subreddit
      const indexKey = `cinnarito:subreddit:${subredditName}:players`;
      const playersData = await redis.get(indexKey);
      
      if (!playersData) {
        return [];
      }
      
      const playerUsernames = JSON.parse(playersData);
      const players: PlayerResources[] = [];
      
      for (const username of playerUsernames.slice(0, limit)) {
        const playerData = await this.getPlayerResources(username, subredditName);
        if (playerData) {
          players.push(playerData);
        }
      }
      
      // Sort by total contributions descending
      return players.sort((a, b) => b.totalContributions - a.totalContributions);
    });
  }

  /**
   * Get player rank in subreddit by total contributions
   */
  async getPlayerRank(username: string, subredditName: string): Promise<number> {
    return this.withRetry(async () => {
      const players = await this.getSubredditPlayers(subredditName);
      const playerIndex = players.findIndex(p => p.username === username);
      return playerIndex >= 0 ? playerIndex + 1 : -1;
    });
  }

  /**
   * Clean up inactive player data (for maintenance)
   */
  async cleanupInactivePlayers(subredditName: string, daysInactive: number = 30): Promise<number> {
    return this.withRetry(async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
      
      const players = await this.getSubredditPlayers(subredditName, 1000);
      let cleanedCount = 0;
      
      for (const player of players) {
        if (player.lastActive < cutoffDate) {
          const key = REDIS_KEYS.PLAYER_RESOURCES(player.username, player.subredditName);
          await redis.del(key);
          await this.removeFromPlayerIndex(player.username, player.subredditName);
          cleanedCount++;
        }
      }
      
      return cleanedCount;
    });
  }

  /**
   * Get action cost based on action type
   */
  private getActionCost(actionType: string): number {
    switch (actionType) {
      case 'plant':
        return GAME_CONFIG.RESOURCE_COSTS.PLANT_SEED;
      case 'feed':
        return GAME_CONFIG.RESOURCE_COSTS.FEED_SPIRIT;
      case 'charge':
        return GAME_CONFIG.RESOURCE_COSTS.CHARGE_ROBOT;
      case 'post':
        return GAME_CONFIG.RESOURCE_COSTS.POST_UPDATE;
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  /**
   * Validate resource limits
   */
  private validateResourceLimits(resources: PlayerResources): void {
    if (resources.cinnamon < 0) {
      throw new Error('Cinnamon cannot be negative');
    }
    
    if (resources.cinnamon > GAME_CONFIG.LIMITS.MAX_CINNAMON) {
      throw new Error(`Cinnamon cannot exceed ${GAME_CONFIG.LIMITS.MAX_CINNAMON}`);
    }
    
    if (resources.seeds < 0) {
      throw new Error('Seeds cannot be negative');
    }
    
    if (resources.energy < 0) {
      throw new Error('Energy cannot be negative');
    }
    
    if (resources.totalContributions < 0) {
      throw new Error('Total contributions cannot be negative');
    }
  }

  /**
   * Update player index for subreddit
   */
  private async updatePlayerIndex(username: string, subredditName: string): Promise<void> {
    const indexKey = `cinnarito:subreddit:${subredditName}:players`;
    const playersData = await redis.get(indexKey);
    
    let players = playersData ? JSON.parse(playersData) : [];
    
    if (!players.includes(username)) {
      players.push(username);
      await redis.set(indexKey, JSON.stringify(players));
    }
  }

  /**
   * Remove player from index
   */
  private async removeFromPlayerIndex(username: string, subredditName: string): Promise<void> {
    const indexKey = `cinnarito:subreddit:${subredditName}:players`;
    const playersData = await redis.get(indexKey);
    
    if (playersData) {
      let players = JSON.parse(playersData);
      players = players.filter((player: string) => player !== username);
      await redis.set(indexKey, JSON.stringify(players));
    }
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
export const playerResourceService = new PlayerResourceService();