import { describe, it, expect, beforeEach } from 'vitest';
import { RedisGameService } from '../RedisGameService';
import { GameState } from '../../../shared/types';

// Mock Redis for testing
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
};

vi.mock('@devvit/web/server', () => ({
  redis: mockRedis
}));

describe('RedisGameService', () => {
  let service: RedisGameService;

  beforeEach(() => {
    service = new RedisGameService();
    vi.clearAllMocks();
  });

  describe('initializeGameState', () => {
    it('should create initial game state for new subreddit', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.initializeGameState('testsubreddit');

      expect(result).toMatchObject({
        subredditName: 'testsubreddit',
        treeLevel: 1,
        totalGrowth: 0,
        seedsPlanted: 0,
        spiritsFed: 0,
        robotCharged: 0,
        dailyUpvotes: 0
      });

      expect(mockRedis.set).toHaveBeenCalledWith(
        'cinnarito:subreddit:testsubreddit:state',
        expect.stringContaining('"subredditName":"testsubreddit"')
      );
    });

    it('should return existing game state if already exists', async () => {
      const existingState: GameState = {
        subredditName: 'testsubreddit',
        treeLevel: 2,
        totalGrowth: 100,
        seedsPlanted: 10,
        spiritsFed: 5,
        robotCharged: 2,
        dailyUpvotes: 20,
        lastGrowthCalculation: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(existingState));

      const result = await service.initializeGameState('testsubreddit');

      expect(result.subredditName).toBe('testsubreddit');
      expect(result.treeLevel).toBe(2);
      expect(result.totalGrowth).toBe(100);
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe('updateGameState', () => {
    it('should update game state with new values', async () => {
      const existingState: GameState = {
        subredditName: 'testsubreddit',
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

      mockRedis.get.mockResolvedValue(JSON.stringify(existingState));
      mockRedis.set.mockResolvedValue('OK');

      const result = await service.updateGameState('testsubreddit', {
        totalGrowth: 50,
        seedsPlanted: 5
      });

      expect(result.totalGrowth).toBe(50);
      expect(result.seedsPlanted).toBe(5);
      expect(result.treeLevel).toBe(1); // Should recalculate based on growth
      expect(mockRedis.set).toHaveBeenCalled();
    });
  });
});