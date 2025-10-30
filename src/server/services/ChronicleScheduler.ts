import { chronicleGenerationService } from './ChronicleGenerationService';

export class ChronicleScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly checkInterval = 60000; // Check every minute
  private isRunning = false;

  /**
   * Start the chronicle scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('Chronicle scheduler is already running');
      return;
    }

    console.log('Starting chronicle scheduler...');
    this.isRunning = true;
    
    this.intervalId = setInterval(async () => {
      await this.processAllSubreddits();
    }, this.checkInterval);
  }

  /**
   * Stop the chronicle scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Chronicle scheduler is not running');
      return;
    }

    console.log('Stopping chronicle scheduler...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Process scheduled chronicles for all active subreddits
   */
  private async processAllSubreddits(): Promise<void> {
    try {
      // Get list of active subreddits
      const activeSubreddits = await this.getActiveSubreddits();
      
      // Process each subreddit
      for (const subredditName of activeSubreddits) {
        try {
          await chronicleGenerationService.processScheduledChronicles(subredditName);
        } catch (error) {
          console.error(`Error processing chronicles for ${subredditName}:`, error);
        }
      }
    } catch (error) {
      console.error('Error in chronicle scheduler:', error);
    }
  }

  /**
   * Get list of active subreddits that have game states
   */
  private async getActiveSubreddits(): Promise<string[]> {
    try {
      // This is a simplified implementation
      // In a real system, you might want to maintain a registry of active subreddits
      // For now, we'll return an empty array and rely on manual triggering
      return [];
    } catch (error) {
      console.error('Error getting active subreddits:', error);
      return [];
    }
  }

  /**
   * Manually trigger chronicle processing for a specific subreddit
   */
  async triggerForSubreddit(subredditName: string): Promise<void> {
    try {
      await chronicleGenerationService.processScheduledChronicles(subredditName);
      console.log(`Chronicle processing triggered for ${subredditName}`);
    } catch (error) {
      console.error(`Error triggering chronicles for ${subredditName}:`, error);
      throw error;
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; checkInterval: number } {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
    };
  }
}

// Export singleton instance
export const chronicleScheduler = new ChronicleScheduler();