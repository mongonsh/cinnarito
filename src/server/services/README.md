# Redis Game Services

This directory contains the Redis-based game state management services for the Cinnarito community game.

## Services Overview

### RedisGameService
Handles game state operations with subreddit-specific namespacing:
- Game state CRUD operations
- Action history tracking
- Daily growth statistics
- Active player tracking
- Action cooldown management

### PlayerResourceService
Manages individual player resources and data:
- Player resource initialization and persistence
- Cinnamon earning and spending
- Resource validation
- Player rankings and leaderboards

### GameServiceIntegration
High-level service that coordinates between game state and player resources:
- Complete player session initialization
- Player action processing with validation
- Game status retrieval
- Reddit upvote reward processing

## Key Features

### Subreddit Isolation
All data is namespaced by subreddit to ensure complete isolation between different communities.

### Connection Pooling & Error Handling
- Automatic retry with exponential backoff
- Circuit breaker pattern for Redis operations
- Graceful error handling and recovery

### Resource Management
- Validates resource costs before actions
- Prevents negative balances
- Enforces resource limits

### Growth Calculation
Uses the specified formula: `growth = seedsPlanted * 1.5 + spiritsFed * 2 + robotCharged * 3 + redditUpvotes * 0.1`

## Usage Examples

### Initialize a player session
```typescript
import { gameServiceIntegration } from './services';

const session = await gameServiceIntegration.initializePlayerSession('username', 'subreddit');
```

### Process a player action
```typescript
const result = await gameServiceIntegration.processPlayerAction('username', 'subreddit', 'plant');
```

### Get game status
```typescript
const status = await gameServiceIntegration.getGameStatus('subreddit');
```

## Redis Key Patterns

- Game State: `cinnarito:subreddit:{subreddit}:state`
- Player Resources: `cinnarito:player:{username}:{subreddit}:resources`
- Action History: `cinnarito:subreddit:{subreddit}:actions`
- Daily Growth: `cinnarito:subreddit:{subreddit}:daily:{date}`
- Active Players: `cinnarito:subreddit:{subreddit}:active`
- Action Cooldowns: `cinnarito:cooldown:{username}:{subreddit}`

## Testing

Unit tests are available in the `__tests__` directory. Run with:
```bash
npm run test
```

## Error Handling

All services implement comprehensive error handling with:
- Input validation
- Resource constraint checking
- Redis connection failure recovery
- Detailed error messages for debugging