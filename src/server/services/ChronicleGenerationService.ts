import { GameState, DailyGrowthStats } from '../../shared/types/api';
import { redisGameService } from './RedisGameService';
import { growthCalculationService } from './GrowthCalculationService';
import { redditPostingService, RedditPostData } from './RedditPostingService';
import { redis } from '@devvit/web/server';

export interface ChronicleTemplate {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'milestone' | 'achievement';
  titleTemplate: string;
  contentTemplate: string;
  conditions?: ChronicleCondition[];
}

export interface ChronicleCondition {
  type: 'growth_threshold' | 'level_up' | 'activity_spike' | 'milestone_reached';
  value: number | string;
  operator?: 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
}

export interface ChronicleSchedule {
  subredditName: string;
  scheduleType: 'daily' | 'weekly';
  nextRunTime: Date;
  isActive: boolean;
  lastRunTime?: Date;
}

export interface GeneratedChronicle {
  title: string;
  content: string;
  type: 'daily' | 'weekly' | 'milestone' | 'achievement';
  gameState: GameState;
  dailyStats?: DailyGrowthStats;
  metadata: {
    generatedAt: Date;
    templateUsed: string;
    subredditName: string;
  };
}

export class ChronicleGenerationService {
  private readonly templates: Map<string, ChronicleTemplate> = new Map();
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Generate a daily chronicle for a subreddit
   */
  async generateDailyChronicle(subredditName: string): Promise<GeneratedChronicle> {
    return this.withRetry(async () => {
      const gameState = await redisGameService.getGameState(subredditName);
      if (!gameState) {
        throw new Error(`Game state not found for subreddit: ${subredditName}`);
      }

      const dailyStats = await growthCalculationService.getDailyStats(subredditName);
      const template = this.templates.get('daily_standard')!;
      
      const chronicle = await this.generateFromTemplate(template, gameState, dailyStats);
      
      return {
        ...chronicle,
        type: 'daily',
        gameState,
        dailyStats,
        metadata: {
          generatedAt: new Date(),
          templateUsed: template.id,
          subredditName,
        },
      };
    });
  }

  /**
   * Generate a milestone chronicle
   */
  async generateMilestoneChronicle(
    subredditName: string, 
    milestone: string
  ): Promise<GeneratedChronicle> {
    return this.withRetry(async () => {
      const gameState = await redisGameService.getGameState(subredditName);
      if (!gameState) {
        throw new Error(`Game state not found for subreddit: ${subredditName}`);
      }

      const template = this.templates.get('milestone_achievement')!;
      const chronicle = await this.generateFromTemplate(template, gameState, undefined, { milestone });
      
      return {
        ...chronicle,
        type: 'milestone',
        gameState,
        metadata: {
          generatedAt: new Date(),
          templateUsed: template.id,
          subredditName,
        },
      };
    });
  }

  /**
   * Generate a weekly summary chronicle
   */
  async generateWeeklyChronicle(subredditName: string): Promise<GeneratedChronicle> {
    return this.withRetry(async () => {
      const gameState = await redisGameService.getGameState(subredditName);
      if (!gameState) {
        throw new Error(`Game state not found for subredditName: ${subredditName}`);
      }

      // Get weekly stats
      const weeklyHistory = await growthCalculationService.getGrowthHistory(subredditName, 7);
      const template = this.templates.get('weekly_summary')!;
      
      const chronicle = await this.generateFromTemplate(template, gameState, undefined, { weeklyHistory });
      
      return {
        ...chronicle,
        type: 'weekly',
        gameState,
        metadata: {
          generatedAt: new Date(),
          templateUsed: template.id,
          subredditName,
        },
      };
    });
  }

  /**
   * Check if any chronicles should be automatically generated and posted
   */
  async processScheduledChronicles(subredditName: string): Promise<void> {
    return this.withRetry(async () => {
      const schedules = await this.getChronicleSchedules(subredditName);
      const now = new Date();

      for (const schedule of schedules) {
        if (!schedule.isActive || schedule.nextRunTime > now) {
          continue;
        }

        try {
          let chronicle: GeneratedChronicle;
          
          switch (schedule.scheduleType) {
            case 'daily':
              chronicle = await this.generateDailyChronicle(subredditName);
              break;
            case 'weekly':
              chronicle = await this.generateWeeklyChronicle(subredditName);
              break;
            default:
              continue;
          }

          // Post the chronicle to Reddit
          const postData: RedditPostData = {
            title: chronicle.title,
            content: chronicle.content,
            subredditName,
            postType: schedule.scheduleType === 'daily' ? 'daily_summary' : 'community_update',
          };

          const postResult = await redditPostingService.postCommunityUpdate(postData);
          
          if (postResult.success) {
            // Update schedule for next run
            await this.updateScheduleNextRun(schedule);
            
            // Log successful chronicle posting
            console.log(`Chronicle posted successfully for ${subredditName}: ${postResult.postUrl}`);
          } else {
            console.error(`Failed to post chronicle for ${subredditName}: ${postResult.error}`);
          }
        } catch (error) {
          console.error(`Error processing scheduled chronicle for ${subredditName}:`, error);
        }
      }
    });
  }

  /**
   * Set up automated chronicle posting schedule for a subreddit
   */
  async setupChronicleSchedule(
    subredditName: string,
    scheduleType: 'daily' | 'weekly',
    startTime?: Date
  ): Promise<void> {
    return this.withRetry(async () => {
      const schedule: ChronicleSchedule = {
        subredditName,
        scheduleType,
        nextRunTime: startTime || this.calculateNextRunTime(scheduleType),
        isActive: true,
      };

      await this.saveChronicleSchedule(schedule);
    });
  }

  /**
   * Generate chronicle content from template
   */
  private async generateFromTemplate(
    template: ChronicleTemplate,
    gameState: GameState,
    dailyStats?: DailyGrowthStats,
    additionalData?: Record<string, any>
  ): Promise<{ title: string; content: string }> {
    const context = {
      gameState,
      dailyStats,
      ...additionalData,
      // Helper functions for templates
      formatNumber: (num: number) => num.toLocaleString(),
      formatGrowth: (growth: number) => growth.toFixed(1),
      getTreeEmoji: (level: number) => this.getTreeEmoji(level),
      getProgressBar: (level: number) => this.generateProgressBar(level),
    };

    const title = this.processTemplate(template.titleTemplate, context);
    const content = this.processTemplate(template.contentTemplate, context);

    return { title, content };
  }

  /**
   * Process template string with context variables
   */
  private processTemplate(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(context, path);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Initialize chronicle templates
   */
  private initializeTemplates(): void {
    // Daily chronicle template
    this.templates.set('daily_standard', {
      id: 'daily_standard',
      name: 'Daily Chronicle',
      type: 'daily',
      titleTemplate: '🌳 Cinnarito Daily Chronicle - {{gameState.subredditName}} Garden Update',
      contentTemplate: `{{getTreeEmoji gameState.treeLevel}} **Welcome to today's Cinnarito Chronicle!** {{getTreeEmoji gameState.treeLevel}}

Our community garden continues to flourish thanks to everyone's contributions! Here's what happened in the last 24 hours:

## 📊 Daily Activity Summary
- **🌱 Seeds Planted:** {{formatNumber dailyStats.seedsPlanted}}
- **👻 Spirits Fed:** {{formatNumber dailyStats.spiritsFed}}
- **🤖 Robot Charges:** {{formatNumber dailyStats.robotCharged}}
- **⬆️ Reddit Upvotes:** {{formatNumber dailyStats.redditUpvotes}}
- **📈 Growth Generated:** {{formatGrowth dailyStats.totalGrowth}}

## 🌳 Current Garden Status
- **Tree Level:** {{gameState.treeLevel}}
- **Total Growth:** {{formatGrowth gameState.totalGrowth}}
- **Community Seeds:** {{formatNumber gameState.seedsPlanted}}
- **Spirits Fed:** {{formatNumber gameState.spiritsFed}}
- **Robot Power:** {{formatNumber gameState.robotCharged}}
- **Active Gardeners:** {{dailyStats.activePlayerCount}}

{{getProgressBar gameState.treeLevel}}

## 🎯 What's Next?
Keep nurturing our Spirit Tree! Every action counts:
- 🌿 **Plant seeds** to expand our garden
- 🍩 **Feed spirits** to boost their energy  
- 🤖 **Charge the robot** for automated growth
- 💬 **Share updates** to inspire others

*Together, we're growing something magical! 🌟*

---
*This is an automated Cinnarito Chronicle. Join the game to contribute to our community garden!*`,
    });

    // Milestone achievement template
    this.templates.set('milestone_achievement', {
      id: 'milestone_achievement',
      name: 'Milestone Achievement',
      type: 'milestone',
      titleTemplate: '🎉 Cinnarito Milestone Achieved - {{milestone}}!',
      contentTemplate: `{{getTreeEmoji gameState.treeLevel}} **AMAZING NEWS, r/{{gameState.subredditName}}!** {{getTreeEmoji gameState.treeLevel}}

We've just achieved a major milestone: **{{milestone}}**! 🎉

## 🏆 Achievement Unlocked
Our community garden has reached new heights thanks to everyone's dedication and teamwork!

## 🌳 Current Garden Stats
- **Tree Level:** {{gameState.treeLevel}}
- **Total Growth:** {{formatGrowth gameState.totalGrowth}}
- **Seeds Planted:** {{formatNumber gameState.seedsPlanted}}
- **Spirits Fed:** {{formatNumber gameState.spiritsFed}}
- **Robot Charges:** {{formatNumber gameState.robotCharged}}

{{getProgressBar gameState.treeLevel}}

This milestone represents the collective effort of our entire community. Every seed planted, every spirit fed, and every robot charge has contributed to this moment!

## 🚀 Keep the Momentum Going!
Let's celebrate this achievement and keep growing together:
- 🌿 Plant more seeds to expand our garden
- 👻 Feed spirits to keep them happy and energized
- 🤖 Charge the robot for automated community growth
- 💬 Share this milestone with friends!

*Thank you to everyone who made this possible! Our garden grows stronger with each contribution.* 🌟

---
*Join the Cinnarito game and help our community garden flourish!*`,
    });

    // Weekly summary template
    this.templates.set('weekly_summary', {
      id: 'weekly_summary',
      name: 'Weekly Summary',
      type: 'weekly',
      titleTemplate: '📅 Cinnarito Weekly Roundup - {{gameState.subredditName}} Garden Progress',
      contentTemplate: `{{getTreeEmoji gameState.treeLevel}} **Weekly Cinnarito Roundup!** {{getTreeEmoji gameState.treeLevel}}

What an incredible week for our community garden! Let's celebrate our collective achievements:

## 📈 Weekly Highlights
- **Current Tree Level:** {{gameState.treeLevel}}
- **Total Growth:** {{formatGrowth gameState.totalGrowth}}
- **Seeds in Garden:** {{formatNumber gameState.seedsPlanted}}
- **Spirits Fed:** {{formatNumber gameState.spiritsFed}}
- **Robot Power Level:** {{formatNumber gameState.robotCharged}}

{{getProgressBar gameState.treeLevel}}

## 🌟 Community Impact
Our garden represents the power of collaboration! Every member who planted a seed, fed a spirit, or charged our robot has contributed to this beautiful shared space.

## 🎯 Looking Ahead
The coming week brings new opportunities to grow:
- Continue nurturing our Spirit Tree
- Welcome new community members
- Reach for the next growth milestone
- Share our garden's story with others

*Thank you for being part of this magical journey! 🌳✨*

---
*Join the Cinnarito community game and help our garden flourish!*`,
    });
  }

  /**
   * Get appropriate tree emoji based on level
   */
  private getTreeEmoji(level: number): string {
    if (level >= 10) return '🌳'; // Mature tree
    if (level >= 7) return '🌲'; // Growing tree
    if (level >= 4) return '🌿'; // Young plant
    if (level >= 2) return '🌱'; // Seedling
    return '🌰'; // Seed
  }

  /**
   * Generate a visual progress bar for the tree level
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
   * Calculate next run time based on schedule type
   */
  private calculateNextRunTime(scheduleType: 'daily' | 'weekly'): Date {
    const now = new Date();
    const nextRun = new Date(now);

    if (scheduleType === 'daily') {
      // Schedule for next day at 9 AM UTC
      nextRun.setUTCDate(nextRun.getUTCDate() + 1);
      nextRun.setUTCHours(9, 0, 0, 0);
    } else if (scheduleType === 'weekly') {
      // Schedule for next Monday at 9 AM UTC
      const daysUntilMonday = (8 - nextRun.getUTCDay()) % 7 || 7;
      nextRun.setUTCDate(nextRun.getUTCDate() + daysUntilMonday);
      nextRun.setUTCHours(9, 0, 0, 0);
    }

    return nextRun;
  }

  /**
   * Get chronicle schedules for a subreddit
   */
  private async getChronicleSchedules(subredditName: string): Promise<ChronicleSchedule[]> {
    const key = `cinnarito:chronicle:schedules:${subredditName}`;
    const data = await redis.get(key);
    
    if (!data) {
      return [];
    }

    const schedules = JSON.parse(data) as ChronicleSchedule[];
    return schedules.map(schedule => ({
      ...schedule,
      nextRunTime: new Date(schedule.nextRunTime),
      lastRunTime: schedule.lastRunTime ? new Date(schedule.lastRunTime) : undefined,
    })) as ChronicleSchedule[];
  }

  /**
   * Save chronicle schedule
   */
  private async saveChronicleSchedule(schedule: ChronicleSchedule): Promise<void> {
    const key = `cinnarito:chronicle:schedules:${schedule.subredditName}`;
    const existingSchedules = await this.getChronicleSchedules(schedule.subredditName);
    
    // Update or add the schedule
    const updatedSchedules = existingSchedules.filter(s => s.scheduleType !== schedule.scheduleType);
    updatedSchedules.push(schedule);
    
    await redis.set(key, JSON.stringify(updatedSchedules));
  }

  /**
   * Update schedule for next run
   */
  private async updateScheduleNextRun(schedule: ChronicleSchedule): Promise<void> {
    schedule.lastRunTime = new Date();
    schedule.nextRunTime = this.calculateNextRunTime(schedule.scheduleType);
    
    await this.saveChronicleSchedule(schedule);
  }

  /**
   * Retry wrapper for operations with exponential backoff
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
    
    throw new Error(`Chronicle generation error: ${lastError?.message || 'Unknown error'}`);
  }
}

// Export singleton instance
export const chronicleGenerationService = new ChronicleGenerationService();