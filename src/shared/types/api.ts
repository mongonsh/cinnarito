// Core Game Data Models
export interface GameState {
  subredditName: string;
  treeLevel: number;
  totalGrowth: number;
  seedsPlanted: number;
  spiritsFed: number;
  robotCharged: number;
  dailyUpvotes: number;
  lastGrowthCalculation: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerResources {
  username: string;
  subredditName: string;
  cinnamon: number;
  seeds: number;
  energy: number;
  totalContributions: number;
  lastActive: Date;
}

export interface ActionHistory {
  id: string;
  username: string;
  subredditName: string;
  actionType: 'plant' | 'feed' | 'charge' | 'post';
  resourcesSpent: number;
  timestamp: Date;
  growthContributed: number;
}

// API Request/Response Types
export interface InitResponse {
  type: 'init';
  subredditName: string;
  gameState: GameState;
  playerResources: PlayerResources;
  username: string;
  postId: string;
  count: number;
}

// Legacy init response for backward compatibility
export interface LegacyInitResponse {
  type: 'init';
  postId: string;
  count: number;
  username: string;
}

// Legacy response types for existing counter functionality
export interface IncrementResponse {
  type: 'increment';
  count: number;
  postId: string;
}

export interface DecrementResponse {
  type: 'decrement';
  count: number;
  postId: string;
}

export interface ActionRequest {
  type: 'plant' | 'feed' | 'charge' | 'post';
  subredditName: string;
  username: string;
}

export interface ActionResponse {
  success: boolean;
  newGameState: GameState;
  newPlayerResources: PlayerResources;
  message?: string;
}

export interface StateResponse {
  gameState: GameState;
  lastModified: Date;
  activePlayerCount: number;
  recentActions?: ActionHistory[];
  stateHash?: string;
  stateDiff?: StateDiff | null;
  serverTime?: string;
}

export interface StateDiff {
  type: 'full' | 'incremental';
  changes: Partial<GameState>;
  previousHash: string;
  currentHash: string;
}

// Daily Growth Tracking
export interface DailyGrowthStats {
  date: string;
  seedsPlanted: number;
  spiritsFed: number;
  robotCharged: number;
  redditUpvotes: number;
  totalGrowth: number;
  activePlayerCount: number;
}

// Player Action Types
export type PlayerActionType = 'plant' | 'feed' | 'charge' | 'post';

export interface PlayerAction {
  type: PlayerActionType;
  resourceCost: number;
  growthContribution: number;
}
