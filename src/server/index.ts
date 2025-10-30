import express from 'express';
import { InitResponse, LegacyInitResponse, IncrementResponse, DecrementResponse, GameState } from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { redisGameService } from './services/RedisGameService';
import { playerResourceService } from './services/PlayerResourceService';
import { growthCalculationService } from './services/GrowthCalculationService';
import { redditPostingService } from './services/RedditPostingService';
import { chronicleGenerationService } from './services/ChronicleGenerationService';
import { chronicleScheduler } from './services/ChronicleScheduler';
import { subredditContextService } from './services/SubredditContextService';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, LegacyInitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const [count, username] = await Promise.all([
        redis.get('count'),
        reddit.getCurrentUsername(),
      ]);

      res.json({
        type: 'init',
        postId: postId,
        count: count ? parseInt(count) : 0,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

// Game initialization endpoint for Cinnarito
router.get<{ subreddit: string }, InitResponse | { status: string; message: string }>(
  '/api/init/:subreddit',
  async (req, res): Promise<void> => {
    const { subreddit } = req.params;
    const { postId } = context;

    // Validate and sanitize subreddit context
    const subredditValidation = subredditContextService.getValidatedSubredditContext(subreddit);
    if (!subredditValidation.isValid) {
      console.error('API Game Init Error: Invalid subreddit', subredditValidation.error);
      res.status(400).json({
        status: 'error',
        message: subredditValidation.error || 'Invalid subreddit name',
      });
      return;
    }

    const validatedSubreddit = subredditValidation.subredditName!;

    if (!postId) {
      console.error('API Game Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      // Get current username
      const username = await reddit.getCurrentUsername();
      if (!username) {
        res.status(401).json({
          status: 'error',
          message: 'User authentication required',
        });
        return;
      }

      // Log context info for debugging
      const contextInfo = subredditContextService.detectSubredditContext(subreddit);
      subredditContextService.logContextInfo(contextInfo, 'Game Init');

      // Initialize or get game state for the subreddit
      const gameState = await redisGameService.initializeGameState(validatedSubreddit);
      
      // Initialize or get player resources
      const playerResources = await playerResourceService.initializePlayerResources(username, validatedSubreddit);
      
      // Track active player
      await redisGameService.trackActivePlayer(username, validatedSubreddit);

      // Get legacy count for backward compatibility
      const count = await redis.get('count');

      res.json({
        type: 'init',
        subredditName: validatedSubreddit,
        gameState,
        playerResources,
        username,
        postId,
        count: count ? parseInt(count) : 0,
      });
    } catch (error) {
      console.error(`API Game Init Error for subreddit ${validatedSubreddit}:`, error);
      let errorMessage = 'Unknown error during game initialization';
      if (error instanceof Error) {
        errorMessage = `Game initialization failed: ${error.message}`;
      }
      res.status(500).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Player action endpoints for Cinnarito game
router.post('/api/plant', async (req, res): Promise<void> => {
  try {
    const { subredditName } = req.body;
    const username = await reddit.getCurrentUsername();

    if (!username) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    // Validate subreddit context
    const subredditValidation = subredditContextService.getValidatedSubredditContext(subredditName);
    if (!subredditValidation.isValid) {
      res.status(400).json({
        success: false,
        message: subredditValidation.error || 'Invalid subreddit name',
      });
      return;
    }

    const validatedSubreddit = subredditValidation.subredditName!;

    // Check if player can afford the action
    const canAfford = await playerResourceService.canAffordAction(username, validatedSubreddit, 'plant');
    if (!canAfford) {
      res.status(400).json({
        success: false,
        message: 'Insufficient cinnamon to plant seed',
      });
      return;
    }

    // Check action cooldown
    const hasCooldown = await redisGameService.checkActionCooldown(username, validatedSubreddit);
    if (hasCooldown) {
      res.status(429).json({
        success: false,
        message: 'Action cooldown active, please wait',
      });
      return;
    }

    // Process the action transaction
    const { resources, cost } = await playerResourceService.processActionTransaction(username, validatedSubreddit, 'plant');
    
    // Calculate growth contribution
    const growthContribution = 1.5; // From GAME_CONFIG.GROWTH_MULTIPLIERS.SEEDS_PLANTED
    
    // Get current game state for milestone checking
    const currentGameState = await redisGameService.getGameState(validatedSubreddit);
    const previousTotalGrowth = currentGameState?.totalGrowth || 0;

    // Record the action
    await redisGameService.recordAction({
      username,
      subredditName: validatedSubreddit,
      actionType: 'plant',
      resourcesSpent: cost,
      growthContributed: growthContribution,
    });

    // Set action cooldown
    await redisGameService.setActionCooldown(username, validatedSubreddit, 60000); // 1 minute cooldown

    // Get updated game state
    const gameState = await redisGameService.getGameState(validatedSubreddit);
    
    // Check for milestones
    let milestoneMessage = 'Seed planted successfully! 🌱';
    if (gameState) {
      const milestones = await growthCalculationService.checkMilestones(validatedSubreddit, previousTotalGrowth, gameState.totalGrowth);
      if (milestones.levelUp || milestones.milestoneReached) {
        milestoneMessage += ` ${milestones.milestoneReached || 'Tree level up!'}`;
      }
    }

    res.json({
      success: true,
      newGameState: gameState!,
      newPlayerResources: resources,
      message: milestoneMessage,
    });
  } catch (error) {
    console.error('Plant action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to plant seed',
    });
  }
});

router.post('/api/feed', async (req, res): Promise<void> => {
  try {
    const { subredditName } = req.body;
    const username = await reddit.getCurrentUsername();

    if (!username) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    // Validate subreddit context
    const subredditValidation = subredditContextService.getValidatedSubredditContext(subredditName);
    if (!subredditValidation.isValid) {
      res.status(400).json({
        success: false,
        message: subredditValidation.error || 'Invalid subreddit name',
      });
      return;
    }

    const validatedSubreddit = subredditValidation.subredditName!;

    // Check if player can afford the action
    const canAfford = await playerResourceService.canAffordAction(username, validatedSubreddit, 'feed');
    if (!canAfford) {
      res.status(400).json({
        success: false,
        message: 'Insufficient cinnamon to feed spirit',
      });
      return;
    }

    // Check action cooldown
    const hasCooldown = await redisGameService.checkActionCooldown(username, validatedSubreddit);
    if (hasCooldown) {
      res.status(429).json({
        success: false,
        message: 'Action cooldown active, please wait',
      });
      return;
    }

    // Process the action transaction
    const { resources, cost } = await playerResourceService.processActionTransaction(username, validatedSubreddit, 'feed');
    
    // Calculate growth contribution
    const growthContribution = 2; // From GAME_CONFIG.GROWTH_MULTIPLIERS.SPIRITS_FED
    
    // Get current game state for milestone checking
    const currentGameState = await redisGameService.getGameState(validatedSubreddit);
    const previousTotalGrowth = currentGameState?.totalGrowth || 0;

    // Record the action
    await redisGameService.recordAction({
      username,
      subredditName: validatedSubreddit,
      actionType: 'feed',
      resourcesSpent: cost,
      growthContributed: growthContribution,
    });

    // Set action cooldown
    await redisGameService.setActionCooldown(username, validatedSubreddit, 60000); // 1 minute cooldown

    // Get updated game state
    const gameState = await redisGameService.getGameState(validatedSubreddit);
    
    // Check for milestones
    let milestoneMessage = 'Spirit fed with cinnamon! 👻';
    if (gameState) {
      const milestones = await growthCalculationService.checkMilestones(validatedSubreddit, previousTotalGrowth, gameState.totalGrowth);
      if (milestones.levelUp || milestones.milestoneReached) {
        milestoneMessage += ` ${milestones.milestoneReached || 'Tree level up!'}`;
      }
    }

    res.json({
      success: true,
      newGameState: gameState!,
      newPlayerResources: resources,
      message: milestoneMessage,
    });
  } catch (error) {
    console.error('Feed action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to feed spirit',
    });
  }
});

router.post('/api/charge', async (req, res): Promise<void> => {
  try {
    const { subredditName } = req.body;
    const username = await reddit.getCurrentUsername();

    if (!username) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    // Validate subreddit context
    const subredditValidation = subredditContextService.getValidatedSubredditContext(subredditName);
    if (!subredditValidation.isValid) {
      res.status(400).json({
        success: false,
        message: subredditValidation.error || 'Invalid subreddit name',
      });
      return;
    }

    const validatedSubreddit = subredditValidation.subredditName!;

    // Check if player can afford the action
    const canAfford = await playerResourceService.canAffordAction(username, validatedSubreddit, 'charge');
    if (!canAfford) {
      res.status(400).json({
        success: false,
        message: 'Insufficient cinnamon to charge robot',
      });
      return;
    }

    // Check action cooldown
    const hasCooldown = await redisGameService.checkActionCooldown(username, validatedSubreddit);
    if (hasCooldown) {
      res.status(429).json({
        success: false,
        message: 'Action cooldown active, please wait',
      });
      return;
    }

    // Process the action transaction
    const { resources, cost } = await playerResourceService.processActionTransaction(username, validatedSubreddit, 'charge');
    
    // Calculate growth contribution
    const growthContribution = 3; // From GAME_CONFIG.GROWTH_MULTIPLIERS.ROBOT_CHARGED
    
    // Get current game state for milestone checking
    const currentGameState = await redisGameService.getGameState(validatedSubreddit);
    const previousTotalGrowth = currentGameState?.totalGrowth || 0;

    // Record the action
    await redisGameService.recordAction({
      username,
      subredditName: validatedSubreddit,
      actionType: 'charge',
      resourcesSpent: cost,
      growthContributed: growthContribution,
    });

    // Set action cooldown
    await redisGameService.setActionCooldown(username, validatedSubreddit, 60000); // 1 minute cooldown

    // Get updated game state
    const gameState = await redisGameService.getGameState(validatedSubreddit);
    
    // Check for milestones
    let milestoneMessage = 'Robot charged and ready! 🤖';
    if (gameState) {
      const milestones = await growthCalculationService.checkMilestones(validatedSubreddit, previousTotalGrowth, gameState.totalGrowth);
      if (milestones.levelUp || milestones.milestoneReached) {
        milestoneMessage += ` ${milestones.milestoneReached || 'Tree level up!'}`;
      }
    }

    res.json({
      success: true,
      newGameState: gameState!,
      newPlayerResources: resources,
      message: milestoneMessage,
    });
  } catch (error) {
    console.error('Charge action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to charge robot',
    });
  }
});

router.post('/api/post', async (req, res): Promise<void> => {
  try {
    const { subredditName, postType = 'community_update', customMessage } = req.body;
    const username = await reddit.getCurrentUsername();

    if (!username) {
      res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
      return;
    }

    // Validate subreddit context
    const subredditValidation = subredditContextService.getValidatedSubredditContext(subredditName);
    if (!subredditValidation.isValid) {
      res.status(400).json({
        success: false,
        message: subredditValidation.error || 'Invalid subreddit name',
      });
      return;
    }

    const validatedSubreddit = subredditValidation.subredditName!;

    // Check action cooldown (post has longer cooldown)
    const hasCooldown = await redisGameService.checkActionCooldown(username, validatedSubreddit);
    if (hasCooldown) {
      res.status(429).json({
        success: false,
        message: 'Action cooldown active, please wait',
      });
      return;
    }

    // Validate posting permissions
    const permissionCheck = await redditPostingService.validatePostPermissions(validatedSubreddit);
    if (!permissionCheck.canPost) {
      res.status(403).json({
        success: false,
        message: permissionCheck.reason || 'Cannot post to subreddit',
      });
      return;
    }

    // Get current game state for post content
    const gameState = await redisGameService.getGameState(validatedSubreddit);
    if (!gameState) {
      res.status(404).json({
        success: false,
        message: 'Game state not found for subreddit',
      });
      return;
    }

    // Process the action transaction (post is free)
    const { resources, cost } = await playerResourceService.processActionTransaction(username, validatedSubreddit, 'post');
    
    // Post action doesn't contribute to growth directly
    const growthContribution = 0;

    // Create the Reddit post based on type
    let postResult;
    try {
      if (postType === 'daily_summary') {
        // Get daily stats for summary
        const dailyStats = await growthCalculationService.getDailyStats(validatedSubreddit);
        const postData = redditPostingService.formatDailySummary(gameState, dailyStats);
        postResult = await redditPostingService.postCommunityUpdate(postData);
      } else if (postType === 'milestone' && customMessage) {
        const postData = redditPostingService.formatMilestonePost(gameState, customMessage);
        postResult = await redditPostingService.postCommunityUpdate(postData);
      } else {
        // Default community update
        const message = customMessage || `Our community garden is thriving! Come join us in growing our Spirit Tree together. 🌳✨`;
        const postData = redditPostingService.formatCommunityUpdate(gameState, message);
        postResult = await redditPostingService.postCommunityUpdate(postData);
      }

      if (!postResult.success) {
        res.status(500).json({
          success: false,
          message: `Failed to post to Reddit: ${postResult.error}`,
        });
        return;
      }
    } catch (postError) {
      console.error('Reddit posting failed:', postError);
      res.status(500).json({
        success: false,
        message: 'Failed to create Reddit post',
      });
      return;
    }
    
    // Record the action
    await redisGameService.recordAction({
      username,
      subredditName: validatedSubreddit,
      actionType: 'post',
      resourcesSpent: cost,
      growthContributed: growthContribution,
    });

    // Set longer cooldown for posting (5 minutes)
    await redisGameService.setActionCooldown(username, validatedSubreddit, 300000);

    // Get updated game state
    const updatedGameState = await redisGameService.getGameState(validatedSubreddit);

    res.json({
      success: true,
      newGameState: updatedGameState!,
      newPlayerResources: resources,
      message: 'Community update posted to Reddit! 📝',
      postUrl: postResult.postUrl,
      postId: postResult.postId,
    });
  } catch (error) {
    console.error('Post action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post update',
    });
  }
});

// Growth calculation endpoints
router.post('/api/growth/calculate/:subreddit', async (req, res): Promise<void> => {
  try {
    const { subreddit } = req.params;
    
    if (!subreddit) {
      res.status(400).json({
        success: false,
        message: 'Subreddit parameter is required',
      });
      return;
    }

    // Process daily growth calculation
    const dailyStats = await growthCalculationService.processDailyGrowth(subreddit);
    
    // Get updated game state
    const gameState = await redisGameService.getGameState(subreddit);

    res.json({
      success: true,
      dailyStats,
      gameState,
      message: 'Growth calculated successfully',
    });
  } catch (error) {
    console.error('Growth calculation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate growth',
    });
  }
});

router.get('/api/growth/history/:subreddit', async (req, res): Promise<void> => {
  try {
    const { subreddit } = req.params;
    const days = parseInt(req.query.days as string) || 7;
    
    if (!subreddit) {
      res.status(400).json({
        success: false,
        message: 'Subreddit parameter is required',
      });
      return;
    }

    // Get growth history
    const history = await growthCalculationService.getGrowthHistory(subreddit, days);
    
    // Get growth projection
    const projection = await growthCalculationService.calculateGrowthProjection(subreddit);

    res.json({
      success: true,
      history,
      projection,
    });
  } catch (error) {
    console.error('Growth history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get growth history',
    });
  }
});

// Chronicle generation endpoints
router.post('/api/chronicle/generate/:subreddit', async (req, res): Promise<void> => {
  try {
    const { subreddit } = req.params;
    const { type = 'daily', milestone } = req.body;
    
    if (!subreddit) {
      res.status(400).json({
        success: false,
        message: 'Subreddit parameter is required',
      });
      return;
    }

    let chronicle;
    switch (type) {
      case 'daily':
        chronicle = await chronicleGenerationService.generateDailyChronicle(subreddit);
        break;
      case 'weekly':
        chronicle = await chronicleGenerationService.generateWeeklyChronicle(subreddit);
        break;
      case 'milestone':
        if (!milestone) {
          res.status(400).json({
            success: false,
            message: 'Milestone parameter is required for milestone chronicles',
          });
          return;
        }
        chronicle = await chronicleGenerationService.generateMilestoneChronicle(subreddit, milestone);
        break;
      default:
        res.status(400).json({
          success: false,
          message: 'Invalid chronicle type. Must be daily, weekly, or milestone',
        });
        return;
    }

    res.json({
      success: true,
      chronicle,
    });
  } catch (error) {
    console.error('Chronicle generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate chronicle',
    });
  }
});

router.post('/api/chronicle/schedule/:subreddit', async (req, res): Promise<void> => {
  try {
    const { subreddit } = req.params;
    const { scheduleType, startTime } = req.body;
    
    if (!subreddit) {
      res.status(400).json({
        success: false,
        message: 'Subreddit parameter is required',
      });
      return;
    }

    if (!['daily', 'weekly'].includes(scheduleType)) {
      res.status(400).json({
        success: false,
        message: 'Schedule type must be daily or weekly',
      });
      return;
    }

    const parsedStartTime = startTime ? new Date(startTime) : undefined;
    
    await chronicleGenerationService.setupChronicleSchedule(
      subreddit,
      scheduleType,
      parsedStartTime
    );

    res.json({
      success: true,
      message: `Chronicle schedule set up for ${scheduleType} posting`,
    });
  } catch (error) {
    console.error('Chronicle schedule setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set up chronicle schedule',
    });
  }
});

router.post('/api/chronicle/process/:subreddit', async (req, res): Promise<void> => {
  try {
    const { subreddit } = req.params;
    
    if (!subreddit) {
      res.status(400).json({
        success: false,
        message: 'Subreddit parameter is required',
      });
      return;
    }

    await chronicleScheduler.triggerForSubreddit(subreddit);

    res.json({
      success: true,
      message: 'Scheduled chronicles processed',
    });
  } catch (error) {
    console.error('Chronicle processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process scheduled chronicles',
    });
  }
});

router.get('/api/chronicle/scheduler/status', async (_req, res): Promise<void> => {
  try {
    const status = chronicleScheduler.getStatus();
    res.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Chronicle scheduler status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduler status',
    });
  }
});

router.post('/api/chronicle/scheduler/start', async (_req, res): Promise<void> => {
  try {
    chronicleScheduler.start();
    res.json({
      success: true,
      message: 'Chronicle scheduler started',
    });
  } catch (error) {
    console.error('Chronicle scheduler start error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start scheduler',
    });
  }
});

router.post('/api/chronicle/scheduler/stop', async (_req, res): Promise<void> => {
  try {
    chronicleScheduler.stop();
    res.json({
      success: true,
      message: 'Chronicle scheduler stopped',
    });
  } catch (error) {
    console.error('Chronicle scheduler stop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop scheduler',
    });
  }
});

// State synchronization endpoint with efficient diffing and cache validation
router.get('/api/state/:subreddit', async (req, res): Promise<void> => {
  try {
    const { subreddit } = req.params;
    const clientLastModified = req.headers['if-modified-since'];
    const clientETag = req.headers['if-none-match'];
    
    // Validate subreddit context
    const subredditValidation = subredditContextService.getValidatedSubredditContext(subreddit);
    if (!subredditValidation.isValid) {
      res.status(400).json({
        success: false,
        message: subredditValidation.error || 'Invalid subreddit name',
      });
      return;
    }

    const validatedSubreddit = subredditValidation.subredditName!;

    // Get current game state
    const gameState = await redisGameService.getGameState(validatedSubreddit);
    if (!gameState) {
      res.status(404).json({
        success: false,
        message: 'Game state not found for subreddit',
      });
      return;
    }

    // Generate ETag based on game state content
    const stateHash = generateStateHash(gameState);
    const lastModified = gameState.updatedAt.toISOString();

    // Check if client has the latest version using cache validation
    const clientHasLatest = (
      (clientLastModified && new Date(clientLastModified) >= gameState.updatedAt) ||
      (clientETag && clientETag === stateHash)
    );

    if (clientHasLatest) {
      // Client has the latest version, return 304 Not Modified
      res.status(304).end();
      return;
    }

    // Get additional state information
    const [activePlayerCount, recentActions] = await Promise.all([
      redisGameService.getActivePlayerCount(validatedSubreddit),
      redisGameService.getRecentActions(validatedSubreddit, 5) // Last 5 actions for context
    ]);

    // Set cache headers for efficient caching
    res.set({
      'Last-Modified': lastModified,
      'ETag': stateHash,
      'Cache-Control': 'private, max-age=0, must-revalidate',
    });

    // Create state diff if client provided previous state info
    let stateDiff = null;
    if (req.query.includeDiff === 'true' && req.query.previousHash) {
      stateDiff = generateStateDiff(gameState, req.query.previousHash as string);
    }

    res.json({
      gameState,
      lastModified: gameState.updatedAt,
      activePlayerCount,
      recentActions,
      stateHash,
      stateDiff,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error('State sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game state',
    });
  }
});

// Helper function to generate state hash for ETag
function generateStateHash(gameState: GameState): string {
  const stateString = JSON.stringify({
    treeLevel: gameState.treeLevel,
    totalGrowth: gameState.totalGrowth,
    seedsPlanted: gameState.seedsPlanted,
    spiritsFed: gameState.spiritsFed,
    robotCharged: gameState.robotCharged,
    dailyUpvotes: gameState.dailyUpvotes,
    updatedAt: gameState.updatedAt.getTime(),
  });
  
  // Simple hash function (in production, consider using crypto.createHash)
  let hash = 0;
  for (let i = 0; i < stateString.length; i++) {
    const char = stateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(36)}"`;
}

// Helper function to generate state diff for efficient updates
function generateStateDiff(currentState: GameState, previousHash: string): any {
  // This is a simplified diff - in production, you might want more sophisticated diffing
  return {
    type: 'full', // For now, always send full state
    changes: {
      treeLevel: currentState.treeLevel,
      totalGrowth: currentState.totalGrowth,
      seedsPlanted: currentState.seedsPlanted,
      spiritsFed: currentState.spiritsFed,
      robotCharged: currentState.robotCharged,
      dailyUpvotes: currentState.dailyUpvotes,
    },
    previousHash,
    currentHash: generateStateHash(currentState),
  };
}

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));

// Start the chronicle scheduler
chronicleScheduler.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  chronicleScheduler.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  chronicleScheduler.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.listen(port);
