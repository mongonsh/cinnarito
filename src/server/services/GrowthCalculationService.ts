import { 
  DailyGrowthStats,
  GAME_CONFIG,
  REDIS_KEYS
} from '../../shared/types';
import { redisGameService } from './RedisGameService';
import { redis } from '@devvit/web/server';

/**
 * Service for calculating and processing community growth
 * Handles daily growth calculations, tree level updates, and growth persistence
 */
export class GrowthCalculationService {
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  /**
   * Calculate growth using the specified formula:
   * growth = seedsPlanted * 1.5 + spiritsFed * 2 + robotCharged * 3 + redditUpvotes * 0.1
   */
  calculateGrowth(
    seedsPlanted: number,
    spiritsFed: number,
    robotCharged: number,
    redditUpvotes: number
  ): number {
    const growth = 
      seedsPlanted * GAME_CONFIG.GROWTH_MULTIPLIERS.SEEDS_PLANTED +
      spiritsFed * GAME_CONFIG.GROWTH_MULTIPLIERS.SPIRITS_FED +
      robotCharged * GAME_CONFIG.GROWTH_MULTIPLIERS.ROBOT_CHARGED +
      redditUpvotes * GAME_CONFIG.GROWTH_MULTIPLIERS.REDDIT_UPVOTES;

    return Math.round(growth * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate tree level based on total growth
   */
  calculateTreeLevel(totalGrowth: number): number {
    const levels = Object.values(GAME_CONFIG.TREE_LEVELS);
    
    // Sort levels by growth required (descending) to find the highest level achieved
    const sortedLevels = levels.sort((a, b) => b.growthRequired - a.growthRequired);
    
    for (const level of sortedLevels) {
      if (totalGrowth >= level.growthRequired) {
        return level.level;
      }
    }
    
    return 1; // Default to seedling
  }

  /**
   * Process daily growth calculation for a subreddit
   */
  async processDailyGrowth(subredditName: string): Promise<DailyGrowthStats> {
    return this.withRetry(async () => {
      const gameState = await redisGameService.getGameState(subredditName);
      if (!gameState) {
        throw new Error(`Game state not found for subreddit: ${subredditName}`);
      }

      const today = new Date().toISOString().split('T')[0]!; // YYYY-MM-DD format
      
      // Check if we've already processed today's growth
      const existingStats = await this.getDailyGrowthStats(subredditName, today);
      if (existingStats) {
        return existingStats;
      }

      // Calculate today's growth
      const dailyGrowth = this.calculateGrowth(
        gameState.seedsPlanted,
        gameState.spiritsFed,
        gameState.robotCharged,
        gameState.dailyUpvotes
      );

      // Get active player count
      const activePlayerCount = await redisGameService.getActivePlayerCount(subredditName);

      // Create daily growth stats
      const dailyStats: DailyGrowthStats = {
        date: today,
        seedsPlanted: gameState.seedsPlanted,
        spiritsFed: gameState.spiritsFed,
        robotCharged: gameState.robotCharged,
        redditUpvotes: gameState.dailyUpvotes,
        totalGrowth: dailyGrowth,
        activePlayerCount
      };

      // Save daily stats
      await this.saveDailyGrowthStats(subredditName, today, dailyStats);

      // Update game state with new totals and reset daily counters
      const newTotalGrowth = gameState.totalGrowth + dailyGrowth;
      const newTreeLevel = this.calculateTreeLevel(newTotalGrowth);

      await redisGameService.updateGameState(subredditName, {
        totalGrowth: newTotalGrowth,
        treeLevel: newTreeLevel,
        lastGrowthCalculation: new Date(),
        // Reset daily counters (optional - depends on game design)
        // dailyUpvotes: 0
      });

      return dailyStats;
    });
  }

  /**
   * Get growth history for a subreddit
   */
  async getGrowthHistory(subredditName: string, days: number = 7): Promise<DailyGrowthStats[]> {
    return this.withRetry(async () => {
      const history: DailyGrowthStats[] = [];
      const today = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0]!;

        const stats = await this.getDailyGrowthStats(subredditName, dateStr);
        if (stats) {
          history.push(stats);
        }
      }

      return history.reverse(); // Return in chronological order
    });
  }

  /**
   * Calculate growth projection based on current activity
   */
  async calculateGrowthProjection(subredditName: string): Promise<{
    currentDayGrowth: number;
    projectedDailyGrowth: number;
    daysToNextLevel: number;
    nextLevelGrowthRequired: number;
  }> {
    return this.withRetry(async () => {
      const gameState = await redisGameService.getGameState(subredditName);
      if (!gameState) {
        throw new Error(`Game state not found for subreddit: ${subredditName}`);
      }

      // Calculate current day's potential growth
      const currentDayGrowth = this.calculateGrowth(
        gameState.seedsPlanted,
        gameState.spiritsFed,
        gameState.robotCharged,
        gameState.dailyUpvotes
      );

      // Get recent history to calculate average
      const history = await this.getGrowthHistory(subredditName, 7);
      const recentGrowth = history.slice(-3); // Last 3 days
      
      let projectedDailyGrowth = currentDayGrowth;
      if (recentGrowth.length > 0) {
        const averageGrowth = recentGrowth.reduce((sum, day) => sum + day.totalGrowth, 0) / recentGrowth.length;
        projectedDailyGrowth = Math.max(averageGrowth, currentDayGrowth);
      }

      // Find next level
      const currentLevel = gameState.treeLevel;
      const levels = Object.values(GAME_CONFIG.TREE_LEVELS);
      const nextLevel = levels.find(level => level.level > currentLevel);
      
      let daysToNextLevel = Infinity;
      let nextLevelGrowthRequired = 0;
      
      if (nextLevel && projectedDailyGrowth > 0) {
        nextLevelGrowthRequired = nextLevel.growthRequired;
        const growthNeeded = nextLevelGrowthRequired - gameState.totalGrowth;
        daysToNextLevel = Math.ceil(growthNeeded / projectedDailyGrowth);
      }

      return {
        currentDayGrowth,
        projectedDailyGrowth,
        daysToNextLevel,
        nextLevelGrowthRequired
      };
    });
  }

  /**
   * Check if a milestone has been reached
   */
  async checkMilestones(_subredditName: string, previousTotalGrowth: number, newTotalGrowth: number): Promise<{
    levelUp: boolean;
    newLevel?: number;
    milestoneReached?: string;
  }> {
    const previousLevel = this.calculateTreeLevel(previousTotalGrowth);
    const newLevel = this.calculateTreeLevel(newTotalGrowth);
    
    const result: {
      levelUp: boolean;
      newLevel?: number;
      milestoneReached?: string;
    } = {
      levelUp: newLevel > previousLevel
    };

    if (newLevel > previousLevel) {
      result.newLevel = newLevel;
    }

    if (result.levelUp && result.newLevel) {
      const levelNames = {
        1: 'Seedling',
        2: 'Sapling',
        3: 'Young Tree',
        4: 'Mature Tree',
        5: 'Ancient Tree',
        6: 'Spirit Tree'
      };
      result.milestoneReached = `Tree evolved to ${levelNames[result.newLevel as keyof typeof levelNames]}!`;
    }

    // Check for other milestones
    const milestones = [100, 250, 500, 1000, 2500, 5000];
    for (const milestone of milestones) {
      if (previousTotalGrowth < milestone && newTotalGrowth >= milestone) {
        result.milestoneReached = `Community reached ${milestone} total growth!`;
        break;
      }
    }

    return result;
  }

  /**
   * Get current day's stats for posting
   */
  async getDailyStats(subredditName: string): Promise<DailyGrowthStats> {
    return this.withRetry(async () => {
      const gameState = await redisGameService.getGameState(subredditName);
      if (!gameState) {
        throw new Error(`Game state not found for subreddit: ${subredditName}`);
      }

      const today = new Date().toISOString().split('T')[0]!;
      
      // Try to get existing daily stats first
      const existingStats = await this.getDailyGrowthStats(subredditName, today);
      if (existingStats) {
        return existingStats;
      }

      // Calculate current day's growth
      const dailyGrowth = this.calculateGrowth(
        gameState.seedsPlanted,
        gameState.spiritsFed,
        gameState.robotCharged,
        gameState.dailyUpvotes
      );

      // Get active player count
      const activePlayerCount = await redisGameService.getActivePlayerCount(subredditName);

      // Create daily stats
      const dailyStats: DailyGrowthStats = {
        date: today,
        seedsPlanted: gameState.seedsPlanted,
        spiritsFed: gameState.spiritsFed,
        robotCharged: gameState.robotCharged,
        redditUpvotes: gameState.dailyUpvotes,
        totalGrowth: dailyGrowth,
        activePlayerCount
      };

      return dailyStats;
    });
  }

  /**
   * Get daily growth stats for a specific date
   */
  private async getDailyGrowthStats(subredditName: string, date: string): Promise<DailyGrowthStats | null> {
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
   * Save daily growth stats
   */
  private async saveDailyGrowthStats(subredditName: string, date: string, stats: DailyGrowthStats): Promise<void> {
    return this.withRetry(async () => {
      const key = REDIS_KEYS.DAILY_GROWTH(subredditName, date);
      await redis.set(key, JSON.stringify(stats));
    });
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
    
    throw new Error(`Growth calculation error: ${lastError?.message || 'Unknown error'}`);
  }
}

// Export singleton instance
export const growthCalculationService = new GrowthCalculationService();