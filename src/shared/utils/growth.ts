import { GameState, DailyGrowthStats } from '../types/api';
import { GAME_CONFIG } from '../constants';

/**
 * Calculate growth based on the formula from requirements:
 * growth = seedsPlanted * 1.5 + spiritsFed * 2 + robotCharged * 3 + redditUpvotes * 0.1
 */
export const calculateGrowth = (stats: {
  seedsPlanted: number;
  spiritsFed: number;
  robotCharged: number;
  redditUpvotes: number;
}): number => {
  const { GROWTH_MULTIPLIERS } = GAME_CONFIG;
  
  return (
    stats.seedsPlanted * GROWTH_MULTIPLIERS.SEEDS_PLANTED +
    stats.spiritsFed * GROWTH_MULTIPLIERS.SPIRITS_FED +
    stats.robotCharged * GROWTH_MULTIPLIERS.ROBOT_CHARGED +
    stats.redditUpvotes * GROWTH_MULTIPLIERS.REDDIT_UPVOTES
  );
};

/**
 * Calculate the tree level based on total growth
 */
export const calculateTreeLevel = (totalGrowth: number): number => {
  const { TREE_LEVELS } = GAME_CONFIG;
  
  if (totalGrowth >= TREE_LEVELS.SPIRIT_TREE.growthRequired) return TREE_LEVELS.SPIRIT_TREE.level;
  if (totalGrowth >= TREE_LEVELS.ANCIENT_TREE.growthRequired) return TREE_LEVELS.ANCIENT_TREE.level;
  if (totalGrowth >= TREE_LEVELS.MATURE_TREE.growthRequired) return TREE_LEVELS.MATURE_TREE.level;
  if (totalGrowth >= TREE_LEVELS.YOUNG_TREE.growthRequired) return TREE_LEVELS.YOUNG_TREE.level;
  if (totalGrowth >= TREE_LEVELS.SAPLING.growthRequired) return TREE_LEVELS.SAPLING.level;
  
  return TREE_LEVELS.SEEDLING.level;
};

/**
 * Update game state with new growth
 */
export const updateGameStateWithGrowth = (
  gameState: GameState,
  newGrowth: number
): GameState => {
  const updatedTotalGrowth = gameState.totalGrowth + newGrowth;
  const newTreeLevel = calculateTreeLevel(updatedTotalGrowth);
  
  return {
    ...gameState,
    totalGrowth: updatedTotalGrowth,
    treeLevel: newTreeLevel,
    updatedAt: new Date()
  };
};

/**
 * Create daily growth stats from game state
 */
export const createDailyGrowthStats = (
  gameState: GameState,
  activePlayerCount: number
): DailyGrowthStats => {
  const today = new Date().toISOString().split('T')[0] || new Date().toDateString();
  const dailyGrowth = calculateGrowth({
    seedsPlanted: gameState.seedsPlanted,
    spiritsFed: gameState.spiritsFed,
    robotCharged: gameState.robotCharged,
    redditUpvotes: gameState.dailyUpvotes
  });
  
  return {
    date: today,
    seedsPlanted: gameState.seedsPlanted,
    spiritsFed: gameState.spiritsFed,
    robotCharged: gameState.robotCharged,
    redditUpvotes: gameState.dailyUpvotes,
    totalGrowth: dailyGrowth,
    activePlayerCount
  };
};