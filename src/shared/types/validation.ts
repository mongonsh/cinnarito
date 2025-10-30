import { GameState, PlayerResources, PlayerActionType } from './api';

// Validation functions for data integrity
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateGameState = (gameState: Partial<GameState>): GameState => {
  const errors: string[] = [];

  if (!gameState.subredditName || typeof gameState.subredditName !== 'string') {
    errors.push('subredditName must be a non-empty string');
  }

  if (typeof gameState.treeLevel !== 'number' || gameState.treeLevel < 0) {
    errors.push('treeLevel must be a non-negative number');
  }

  if (typeof gameState.totalGrowth !== 'number' || gameState.totalGrowth < 0) {
    errors.push('totalGrowth must be a non-negative number');
  }

  if (typeof gameState.seedsPlanted !== 'number' || gameState.seedsPlanted < 0) {
    errors.push('seedsPlanted must be a non-negative number');
  }

  if (typeof gameState.spiritsFed !== 'number' || gameState.spiritsFed < 0) {
    errors.push('spiritsFed must be a non-negative number');
  }

  if (typeof gameState.robotCharged !== 'number' || gameState.robotCharged < 0) {
    errors.push('robotCharged must be a non-negative number');
  }

  if (typeof gameState.dailyUpvotes !== 'number' || gameState.dailyUpvotes < 0) {
    errors.push('dailyUpvotes must be a non-negative number');
  }

  if (errors.length > 0) {
    throw new ValidationError(`GameState validation failed: ${errors.join(', ')}`);
  }

  return {
    subredditName: gameState.subredditName!,
    treeLevel: gameState.treeLevel!,
    totalGrowth: gameState.totalGrowth!,
    seedsPlanted: gameState.seedsPlanted!,
    spiritsFed: gameState.spiritsFed!,
    robotCharged: gameState.robotCharged!,
    dailyUpvotes: gameState.dailyUpvotes!,
    lastGrowthCalculation: gameState.lastGrowthCalculation || new Date(),
    createdAt: gameState.createdAt || new Date(),
    updatedAt: new Date()
  };
};

export const validatePlayerResources = (resources: Partial<PlayerResources>): PlayerResources => {
  const errors: string[] = [];

  if (!resources.username || typeof resources.username !== 'string') {
    errors.push('username must be a non-empty string');
  }

  if (!resources.subredditName || typeof resources.subredditName !== 'string') {
    errors.push('subredditName must be a non-empty string');
  }

  if (typeof resources.cinnamon !== 'number' || resources.cinnamon < 0) {
    errors.push('cinnamon must be a non-negative number');
  }

  if (typeof resources.seeds !== 'number' || resources.seeds < 0) {
    errors.push('seeds must be a non-negative number');
  }

  if (typeof resources.energy !== 'number' || resources.energy < 0) {
    errors.push('energy must be a non-negative number');
  }

  if (typeof resources.totalContributions !== 'number' || resources.totalContributions < 0) {
    errors.push('totalContributions must be a non-negative number');
  }

  if (errors.length > 0) {
    throw new ValidationError(`PlayerResources validation failed: ${errors.join(', ')}`);
  }

  return {
    username: resources.username!,
    subredditName: resources.subredditName!,
    cinnamon: resources.cinnamon!,
    seeds: resources.seeds!,
    energy: resources.energy!,
    totalContributions: resources.totalContributions!,
    lastActive: new Date()
  };
};

export const validateActionType = (actionType: string): PlayerActionType => {
  const validActions: PlayerActionType[] = ['plant', 'feed', 'charge', 'post'];
  
  if (!validActions.includes(actionType as PlayerActionType)) {
    throw new ValidationError(`Invalid action type: ${actionType}. Must be one of: ${validActions.join(', ')}`);
  }
  
  return actionType as PlayerActionType;
};

export const validateResourceCost = (actionType: PlayerActionType, playerResources: PlayerResources): boolean => {
  const costs = {
    plant: 5,
    feed: 3,
    charge: 10,
    post: 0
  };

  const requiredCinnamon = costs[actionType];
  return playerResources.cinnamon >= requiredCinnamon;
};

// Helper function to create default game state
export const createDefaultGameState = (subredditName: string): GameState => {
  const now = new Date();
  return {
    subredditName,
    treeLevel: 1,
    totalGrowth: 0,
    seedsPlanted: 0,
    spiritsFed: 0,
    robotCharged: 0,
    dailyUpvotes: 0,
    lastGrowthCalculation: now,
    createdAt: now,
    updatedAt: now
  };
};

// Helper function to create default player resources
export const createDefaultPlayerResources = (username: string, subredditName: string): PlayerResources => {
  return {
    username,
    subredditName,
    cinnamon: 10, // Starting cinnamon
    seeds: 0,
    energy: 0,
    totalContributions: 0,
    lastActive: new Date()
  };
};