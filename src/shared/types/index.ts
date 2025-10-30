// Re-export all types from api.ts
export * from './api';

// Re-export all types from components.ts
export * from './components';

// Re-export validation utilities
export * from './validation';

// Re-export constants
export * from '../constants';

// Additional utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<T>;

// Type guards for runtime type checking
export const isGameState = (obj: any): obj is GameState => {
  return obj && 
    typeof obj.subredditName === 'string' &&
    typeof obj.treeLevel === 'number' &&
    typeof obj.totalGrowth === 'number' &&
    typeof obj.seedsPlanted === 'number' &&
    typeof obj.spiritsFed === 'number' &&
    typeof obj.robotCharged === 'number' &&
    typeof obj.dailyUpvotes === 'number';
};

export const isPlayerResources = (obj: any): obj is PlayerResources => {
  return obj &&
    typeof obj.username === 'string' &&
    typeof obj.subredditName === 'string' &&
    typeof obj.cinnamon === 'number' &&
    typeof obj.seeds === 'number' &&
    typeof obj.energy === 'number' &&
    typeof obj.totalContributions === 'number';
};

export const isActionHistory = (obj: any): obj is ActionHistory => {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.username === 'string' &&
    typeof obj.subredditName === 'string' &&
    ['plant', 'feed', 'charge', 'post'].includes(obj.actionType) &&
    typeof obj.resourcesSpent === 'number' &&
    typeof obj.growthContributed === 'number';
};

// Import the types we need for the type guards
import { GameState, PlayerResources, ActionHistory } from './api';