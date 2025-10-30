import { reddit } from '@devvit/web/server';
import { GameState, DailyGrowthStats } from '../../shared/types/api';

export interface RedditPostData {
  title: string;
  content: string;
  subredditName: string;
  postType: 'daily_summary' | 'milestone' | 'community_update';
}

export interface PostResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
}

export class RedditPostingService {
  /**
   * Posts a community update to Reddit
   */
  async postCommunityUpdate(postData: RedditPostData): Promise<PostResult> {
    try {
      // Validate input
      if (!postData.title || !postData.content || !postData.subredditName) {
        return {
          success: false,
          error: 'Missing required post data (title, content, or subredditName)',
        };
      }

      // Create the post using Devvit's Reddit API
      const post = await reddit.submitPost({
        title: postData.title,
        text: postData.content,
        subredditName: postData.subredditName,
        sendreplies: true,
      });

      if (!post || !post.id) {
        return {
          success: false,
          error: 'Failed to create Reddit post - no post ID returned',
        };
      }

      // Generate post URL
      const postUrl = `https://reddit.com/r/${postData.subredditName}/comments/${post.id}`;

      return {
        success: true,
        postId: post.id,
        postUrl,
      };
    } catch (error) {
      console.error('Reddit posting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while posting',
      };
    }
  }

  /**
   * Formats a daily summary post for the community
   */
  formatDailySummary(gameState: GameState, dailyStats: DailyGrowthStats): RedditPostData {
    const title = `🌳 Cinnarito Daily Chronicle - ${gameState.subredditName} Garden Update`;
    
    const content = this.generateDailySummaryContent(gameState, dailyStats);

    return {
      title,
      content,
      subredditName: gameState.subredditName,
      postType: 'daily_summary',
    };
  }

  /**
   * Formats a milestone achievement post
   */
  formatMilestonePost(gameState: GameState, milestone: string): RedditPostData {
    const title = `🎉 Cinnarito Milestone Achieved - ${milestone}!`;
    
    const content = this.generateMilestoneContent(gameState, milestone);

    return {
      title,
      content,
      subredditName: gameState.subredditName,
      postType: 'milestone',
    };
  }

  /**
   * Formats a general community update post
   */
  formatCommunityUpdate(gameState: GameState, message: string): RedditPostData {
    const title = `🌿 Cinnarito Community Update - ${gameState.subredditName}`;
    
    const content = this.generateCommunityUpdateContent(gameState, message);

    return {
      title,
      content,
      subredditName: gameState.subredditName,
      postType: 'community_update',
    };
  }

  /**
   * Generates the content for daily summary posts
   */
  private generateDailySummaryContent(gameState: GameState, dailyStats: DailyGrowthStats): string {
    const treeEmoji = this.getTreeEmoji(gameState.treeLevel);
    const growthPercentage = dailyStats.totalGrowth > 0 ? 
      ((dailyStats.totalGrowth / gameState.totalGrowth) * 100).toFixed(1) : '0.0';

    return `${treeEmoji} **Welcome to today's Cinnarito Chronicle!** ${treeEmoji}

Our community garden continues to flourish thanks to everyone's contributions! Here's what happened in the last 24 hours:

## 📊 Daily Activity Summary
- **🌱 Seeds Planted:** ${dailyStats.seedsPlanted}
- **👻 Spirits Fed:** ${dailyStats.spiritsFed} 
- **🤖 Robot Charges:** ${dailyStats.robotCharged}
- **⬆️ Reddit Upvotes:** ${dailyStats.redditUpvotes}
- **📈 Growth Generated:** ${dailyStats.totalGrowth.toFixed(1)} (${growthPercentage}% of total)

## 🌳 Current Garden Status
- **Tree Level:** ${gameState.treeLevel}
- **Total Growth:** ${gameState.totalGrowth.toFixed(1)}
- **Community Seeds:** ${gameState.seedsPlanted}
- **Spirits Fed:** ${gameState.spiritsFed}
- **Robot Power:** ${gameState.robotCharged}
- **Active Gardeners:** ${dailyStats.activePlayerCount}

${this.generateProgressBar(gameState.treeLevel)}

## 🎯 What's Next?
Keep nurturing our Spirit Tree! Every action counts:
- 🌿 **Plant seeds** to expand our garden
- 🍩 **Feed spirits** to boost their energy  
- 🤖 **Charge the robot** for automated growth
- 💬 **Share updates** to inspire others

*Together, we're growing something magical! 🌟*

---
*This is an automated Cinnarito Chronicle. Join the game to contribute to our community garden!*`;
  }

  /**
   * Generates content for milestone posts
   */
  private generateMilestoneContent(gameState: GameState, milestone: string): string {
    const treeEmoji = this.getTreeEmoji(gameState.treeLevel);
    
    return `${treeEmoji} **AMAZING NEWS, r/${gameState.subredditName}!** ${treeEmoji}

We've just achieved a major milestone: **${milestone}**! 🎉

## 🏆 Achievement Unlocked
Our community garden has reached new heights thanks to everyone's dedication and teamwork!

## 🌳 Current Garden Stats
- **Tree Level:** ${gameState.treeLevel}
- **Total Growth:** ${gameState.totalGrowth.toFixed(1)}
- **Seeds Planted:** ${gameState.seedsPlanted}
- **Spirits Fed:** ${gameState.spiritsFed}
- **Robot Charges:** ${gameState.robotCharged}

${this.generateProgressBar(gameState.treeLevel)}

This milestone represents the collective effort of our entire community. Every seed planted, every spirit fed, and every robot charge has contributed to this moment!

## 🚀 Keep the Momentum Going!
Let's celebrate this achievement and keep growing together:
- 🌿 Plant more seeds to expand our garden
- 👻 Feed spirits to keep them happy and energized
- 🤖 Charge the robot for automated community growth
- 💬 Share this milestone with friends!

*Thank you to everyone who made this possible! Our garden grows stronger with each contribution.* 🌟

---
*Join the Cinnarito game and help our community garden flourish!*`;
  }

  /**
   * Generates content for general community updates
   */
  private generateCommunityUpdateContent(gameState: GameState, message: string): string {
    const treeEmoji = this.getTreeEmoji(gameState.treeLevel);
    
    return `${treeEmoji} **Cinnarito Community Update** ${treeEmoji}

${message}

## 🌳 Current Garden Status
- **Tree Level:** ${gameState.treeLevel}
- **Total Growth:** ${gameState.totalGrowth.toFixed(1)}
- **Seeds Planted:** ${gameState.seedsPlanted}
- **Spirits Fed:** ${gameState.spiritsFed}
- **Robot Power:** ${gameState.robotCharged}

${this.generateProgressBar(gameState.treeLevel)}

## 🎮 Join the Fun!
Help our community garden grow by:
- 🌿 Planting seeds for future growth
- 🍩 Feeding spirits with cinnamon energy
- 🤖 Charging the robot for automation
- 💬 Sharing updates with the community

*Every action makes our garden more magical!* ✨

---
*This update was shared through the Cinnarito community game.*`;
  }

  /**
   * Gets appropriate tree emoji based on level
   */
  private getTreeEmoji(level: number): string {
    if (level >= 10) return '🌳'; // Mature tree
    if (level >= 7) return '🌲'; // Growing tree
    if (level >= 4) return '🌿'; // Young plant
    if (level >= 2) return '🌱'; // Seedling
    return '🌰'; // Seed
  }

  /**
   * Generates a visual progress bar for the tree level
   */
  private generateProgressBar(level: number): string {
    const maxLevel = 20; // Assume max level for progress bar
    const progress = Math.min(level / maxLevel, 1);
    const filledBars = Math.floor(progress * 10);
    const emptyBars = 10 - filledBars;
    
    const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
    const percentage = (progress * 100).toFixed(0);
    
    return `**Tree Growth Progress:** ${progressBar} ${percentage}% (Level ${level})`;
  }

  /**
   * Validates if a post can be made (rate limiting, permissions, etc.)
   */
  async validatePostPermissions(_subredditName: string): Promise<{ canPost: boolean; reason?: string }> {
    try {
      // Check if we have permission to post to the subreddit
      const currentUser = await reddit.getCurrentUsername();
      if (!currentUser) {
        return {
          canPost: false,
          reason: 'User authentication required',
        };
      }

      // Additional validation could be added here:
      // - Check subreddit posting permissions
      // - Check rate limits
      // - Check if subreddit exists and is accessible
      
      return { canPost: true };
    } catch (error) {
      console.error('Post permission validation error:', error);
      return {
        canPost: false,
        reason: error instanceof Error ? error.message : 'Permission validation failed',
      };
    }
  }
}

// Export singleton instance
export const redditPostingService = new RedditPostingService();