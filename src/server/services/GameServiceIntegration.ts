import { redisGameService } from './RedisGameService';
import { playerResourceService } from './PlayerResourceService';
import { GAME_CONFIG } from '../../shared/types';

/**
 * Integration service that combines game state and player resource management
 * Provides high-level operations that coordinate between both services
 */
export class GameServiceIntegration {
  
  /**
   * Initialize a complete game session for a player in a subreddit
   */
  async initializePlayerSession(username: string, subredditName: string) {
    try {
      // Initialize game state for subreddit
      const gameState = await redisGameService.initializeGameState(subredditName);
      
      // Initialize player resources
      const playerResources = await playerResourceService.initializePlayerResources(username, subredditName);
      
      // Track player as active
      await redisGameService.trackActivePlayer(username, subredditName);
      
      return {
        gameState,
        playerResources,
        success: true
      };
    } catch (error) {
      return {
        gameState: null,
        playerResources: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process a player action (plant, feed, charge, post)
   */
  async processPlayerAction(
    username: string, 
    subredditName: string, 
    actionType: 'plant' | 'feed' | 'charge' | 'post'
  ) {
    try {
      // Check if player is on cooldown
      const onCooldown = await redisGameService.checkActionCooldown(username, subredditName);
      if (onCooldown) {
        return {
          success: false,
          error: 'Action is on cooldown'
        };
      }

      // Check if player can afford the action
      const canAfford = await playerResourceService.canAffordAction(username, subredditName, actionType);
      if (!canAfford) {
        return {
          success: false,
          error: 'Insufficient resources'
        };
      }

      // Process the resource transaction
      const { resources, cost } = await playerResourceService.processActionTransaction(
        username, 
        subredditName, 
        actionType
      );

      // Calculate growth contribution
      const growthContribution = this.calculateGrowthContribution(actionType);

      // Record the action in history
      const actionHistory = await redisGameService.recordAction({
        username,
        subredditName,
        actionType,
        resourcesSpent: cost,
        growthContributed: growthContribution
      });

      // Set cooldown for the action
      await redisGameService.setActionCooldown(username, subredditName, 60000); // 1 minute cooldown

      // Track player as active
      await redisGameService.trackActivePlayer(username, subredditName);

      // Get updated game state
      const gameState = await redisGameService.getGameState(subredditName);

      return {
        success: true,
        gameState,
        playerResources: resources,
        actionHistory,
        growthContributed: growthContribution
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get complete game status for a subreddit
   */
  async getGameStatus(subredditName: string) {
    try {
      const gameState = await redisGameService.getGameState(subredditName);
      const activePlayerCount = await redisGameService.getActivePlayerCount(subredditName);
      const recentActions = await redisGameService.getRecentActions(subredditName, 10);

      return {
        success: true,
        gameState,
        activePlayerCount,
        recentActions
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get player status including resources and rank
   */
  async getPlayerStatus(username: string, subredditName: string) {
    try {
      const playerResources = await playerResourceService.getPlayerResources(username, subredditName);
      const playerRank = await playerResourceService.getPlayerRank(username, subredditName);
      const onCooldown = await redisGameService.checkActionCooldown(username, subredditName);

      return {
        success: true,
        playerResources,
        playerRank,
        onCooldown
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Award cinnamon to player from Reddit upvotes
   */
  async awardUpvoteCinnamon(username: string, subredditName: string, upvoteCount: number) {
    try {
      const updatedResources = await playerResourceService.awardUpvoteCinnamon(
        username, 
        subredditName, 
        upvoteCount
      );

      // Update daily upvotes in game state
      const gameState = await redisGameService.getGameState(subredditName);
      if (gameState) {
        await redisGameService.updateGameState(subredditName, {
          dailyUpvotes: gameState.dailyUpvotes + upvoteCount
        });
      }

      return {
        success: true,
        playerResources: updatedResources,
        cinnamonAwarded: upvoteCount * GAME_CONFIG.RESOURCE_REWARDS.UPVOTE_CINNAMON
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Calculate growth contribution based on action type
   */
  private calculateGrowthContribution(actionType: string): number {
    switch (actionType) {
      case 'plant':
        return GAME_CONFIG.GROWTH_MULTIPLIERS.SEEDS_PLANTED;
      case 'feed':
        return GAME_CONFIG.GROWTH_MULTIPLIERS.SPIRITS_FED;
      case 'charge':
        return GAME_CONFIG.GROWTH_MULTIPLIERS.ROBOT_CHARGED;
      case 'post':
        return 0; // Post doesn't directly contribute to growth
      default:
        return 0;
    }
  }
}

// Export singleton instance
export const gameServiceIntegration = new GameServiceIntegration();