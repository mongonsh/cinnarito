import { GameState, PlayerResources, PlayerAction } from './api';

// Component Props Interfaces
export interface SplashScreenProps {
  onStart: () => void;
}

export interface SplashScreenState {
  isAnimating: boolean;
  showStartButton: boolean;
}

export interface CommunityGardenProps {
  subredditName: string;
  gameState: GameState;
  onAction: (action: PlayerAction) => void;
}

export interface ActionPanelProps {
  playerResources: PlayerResources;
  onPlant: () => void;
  onFeedSpirit: () => void;
  onChargeRobot: () => void;
  onPostUpdate: () => void;
  disabled: boolean;
}

export interface SpiritTreeProps {
  level: number;
  totalGrowth: number;
  isGrowing: boolean;
}

export interface FloatingSpiritsProps {
  count: number;
  activityLevel: number;
}

export interface RedditRobotProps {
  chargeLevel: number;
  isCollecting: boolean;
  cinnamonCount: number;
}

// Hook Return Types
export interface UseGameStateReturn {
  gameState: GameState | null;
  playerResources: PlayerResources | null;
  loading: boolean;
  error: string | null;
  refreshState: () => Promise<void>;
}

export interface UseActionsReturn {
  plantSeed: () => Promise<boolean>;
  feedSpirit: () => Promise<boolean>;
  chargeRobot: () => Promise<boolean>;
  postUpdate: () => Promise<boolean>;
  isActionInProgress: boolean;
}

// Error Handling Types
export interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  retryCount: number;
}

export interface RedisErrorHandler {
  maxRetries: number;
  retryDelay: number;
  fallbackToMemory: boolean;
}

// Animation and Visual Types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface VisualEffectConfig {
  particleCount: number;
  colors: string[];
  duration: number;
}

// Note: Game configuration constants are now in ../constants.ts