import { useState, useCallback } from 'react';
import { PlayerActionType, ActionResponse, GameState, PlayerResources } from '../../shared/types';

interface UseActionsProps {
  subredditName: string;
  username: string;
  gameState: GameState | null;
  playerResources: PlayerResources | null;
  onStateUpdate?: (newGameState: GameState, newPlayerResources: PlayerResources) => void;
}

interface UseActionsReturn {
  plantSeed: () => Promise<boolean>;
  feedSpirit: () => Promise<boolean>;
  chargeRobot: () => Promise<boolean>;
  postUpdate: () => Promise<boolean>;
  isActionInProgress: boolean;
  lastActionResult: string | null;
  actionCooldowns: Record<PlayerActionType, number>;
}

interface ActionConfig {
  type: PlayerActionType;
  resourceType: 'cinnamon' | 'seeds' | 'energy';
  cost: number;
  cooldownMs: number;
  growthContribution: number;
}

const ACTION_CONFIGS: Record<PlayerActionType, ActionConfig> = {
  plant: {
    type: 'plant',
    resourceType: 'cinnamon',
    cost: 10,
    cooldownMs: 5000, // 5 seconds
    growthContribution: 1.5,
  },
  feed: {
    type: 'feed',
    resourceType: 'cinnamon',
    cost: 15,
    cooldownMs: 8000, // 8 seconds
    growthContribution: 2.0,
  },
  charge: {
    type: 'charge',
    resourceType: 'energy',
    cost: 25,
    cooldownMs: 12000, // 12 seconds
    growthContribution: 3.0,
  },
  post: {
    type: 'post',
    resourceType: 'cinnamon',
    cost: 5,
    cooldownMs: 30000, // 30 seconds
    growthContribution: 0.5,
  },
};

export const useActions = ({
  subredditName,
  username,
  gameState,
  playerResources,
  onStateUpdate,
}: UseActionsProps): UseActionsReturn => {
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [lastActionResult, setLastActionResult] = useState<string | null>(null);
  const [actionCooldowns, setActionCooldowns] = useState<Record<PlayerActionType, number>>({
    plant: 0,
    feed: 0,
    charge: 0,
    post: 0,
  });

  // Clear cooldown for a specific action
  const clearCooldown = useCallback((actionType: PlayerActionType) => {
    setActionCooldowns(prev => ({
      ...prev,
      [actionType]: 0,
    }));
  }, []);

  // Set cooldown for a specific action
  const setCooldown = useCallback((actionType: PlayerActionType, durationMs: number) => {
    const endTime = Date.now() + durationMs;
    setActionCooldowns(prev => ({
      ...prev,
      [actionType]: endTime,
    }));

    // Auto-clear cooldown when it expires
    setTimeout(() => {
      clearCooldown(actionType);
    }, durationMs);
  }, [clearCooldown]);

  // Validate if an action can be performed
  const validateAction = useCallback((actionType: PlayerActionType): { valid: boolean; reason?: string } => {
    if (!gameState || !playerResources) {
      return { valid: false, reason: 'Game state not loaded' };
    }

    if (isActionInProgress) {
      return { valid: false, reason: 'Another action is in progress' };
    }

    const now = Date.now();
    if (actionCooldowns[actionType] > now) {
      const remainingSeconds = Math.ceil((actionCooldowns[actionType] - now) / 1000);
      return { valid: false, reason: `Action on cooldown (${remainingSeconds}s remaining)` };
    }

    const config = ACTION_CONFIGS[actionType];
    const availableResource = playerResources[config.resourceType];
    
    if (availableResource < config.cost) {
      return { valid: false, reason: `Insufficient ${config.resourceType} (need ${config.cost}, have ${availableResource})` };
    }

    return { valid: true };
  }, [gameState, playerResources, isActionInProgress, actionCooldowns]);

  // Perform optimistic update for better UX
  const performOptimisticUpdate = useCallback((actionType: PlayerActionType) => {
    if (!gameState || !playerResources || !onStateUpdate) return null;

    const config = ACTION_CONFIGS[actionType];
    
    // Create optimistic new state
    const optimisticGameState: GameState = {
      ...gameState,
      [actionType === 'plant' ? 'seedsPlanted' : 
       actionType === 'feed' ? 'spiritsFed' : 
       actionType === 'charge' ? 'robotCharged' : 'dailyUpvotes']: 
        gameState[actionType === 'plant' ? 'seedsPlanted' : 
                 actionType === 'feed' ? 'spiritsFed' : 
                 actionType === 'charge' ? 'robotCharged' : 'dailyUpvotes'] + 1,
      totalGrowth: gameState.totalGrowth + config.growthContribution,
      updatedAt: new Date(),
    };

    const optimisticPlayerResources: PlayerResources = {
      ...playerResources,
      [config.resourceType]: playerResources[config.resourceType] - config.cost,
      totalContributions: playerResources.totalContributions + 1,
      lastActive: new Date(),
    };

    return { optimisticGameState, optimisticPlayerResources };
  }, [gameState, playerResources, onStateUpdate]);

  // Generic action executor
  const executeAction = useCallback(async (actionType: PlayerActionType): Promise<boolean> => {
    const validation = validateAction(actionType);
    if (!validation.valid) {
      setLastActionResult(validation.reason || 'Action failed validation');
      return false;
    }

    setIsActionInProgress(true);
    setLastActionResult(null);

    // Perform optimistic update
    const optimisticUpdate = performOptimisticUpdate(actionType);
    if (optimisticUpdate && onStateUpdate) {
      onStateUpdate(optimisticUpdate.optimisticGameState, optimisticUpdate.optimisticPlayerResources);
    }

    try {
      // Make API call to server with the correct endpoint for each action
      const endpoint = `/api/${actionType}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subredditName,
          username,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ActionResponse = await response.json();

      if (result.success) {
        // Update with actual server response
        if (onStateUpdate) {
          onStateUpdate(result.newGameState, result.newPlayerResources);
        }
        
        // Set cooldown for this action
        setCooldown(actionType, ACTION_CONFIGS[actionType].cooldownMs);
        
        setLastActionResult(result.message || `${actionType} action completed successfully!`);
        return true;
      } else {
        throw new Error(result.message || 'Action failed on server');
      }
    } catch (error) {
      console.error(`Error executing ${actionType} action:`, error);
      
      // Revert optimistic update on error
      if (gameState && playerResources && onStateUpdate) {
        onStateUpdate(gameState, playerResources);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setLastActionResult(`Failed to ${actionType}: ${errorMessage}`);
      return false;
    } finally {
      setIsActionInProgress(false);
    }
  }, [validateAction, performOptimisticUpdate, onStateUpdate, subredditName, username, setCooldown, gameState, playerResources]);

  // Individual action functions
  const plantSeed = useCallback(() => executeAction('plant'), [executeAction]);
  const feedSpirit = useCallback(() => executeAction('feed'), [executeAction]);
  const chargeRobot = useCallback(() => executeAction('charge'), [executeAction]);
  const postUpdate = useCallback(() => executeAction('post'), [executeAction]);

  return {
    plantSeed,
    feedSpirit,
    chargeRobot,
    postUpdate,
    isActionInProgress,
    lastActionResult,
    actionCooldowns,
  };
};