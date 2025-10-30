import { context } from '@devvit/web/server';
import { GAME_CONFIG } from '../../shared/constants';

export interface SubredditValidationResult {
  isValid: boolean;
  subredditName?: string;
  error?: string;
}

export interface SubredditContextInfo {
  subredditName: string;
  isFromDevvitContext: boolean;
  isFromRequest: boolean;
  source: 'devvit_context' | 'request_param' | 'request_body' | 'fallback';
}

/**
 * Service for managing subreddit context detection and validation
 * Ensures proper subreddit isolation and context management
 */
export class SubredditContextService {
  
  /**
   * Detect subreddit context from multiple sources with priority order
   */
  detectSubredditContext(requestSubreddit?: string): SubredditContextInfo {
    // Priority 1: Request parameter/body (explicit user choice)
    if (requestSubreddit && this.isValidSubredditName(requestSubreddit)) {
      return {
        subredditName: requestSubreddit,
        isFromDevvitContext: false,
        isFromRequest: true,
        source: 'request_param',
      };
    }

    // Priority 2: Devvit context (current subreddit where app is running)
    try {
      if (context.subredditName && this.isValidSubredditName(context.subredditName)) {
        return {
          subredditName: context.subredditName,
          isFromDevvitContext: true,
          isFromRequest: false,
          source: 'devvit_context',
        };
      }
    } catch (error) {
      console.warn('Failed to access Devvit context:', error);
    }

    // Priority 3: Fallback for development/testing
    const fallbackSubreddit = 'testsubreddit';
    return {
      subredditName: fallbackSubreddit,
      isFromDevvitContext: false,
      isFromRequest: false,
      source: 'fallback',
    };
  }

  /**
   * Validate subreddit name format and constraints
   */
  validateSubredditName(subredditName: string): SubredditValidationResult {
    if (!subredditName) {
      return {
        isValid: false,
        error: 'Subreddit name is required',
      };
    }

    if (typeof subredditName !== 'string') {
      return {
        isValid: false,
        error: 'Subreddit name must be a string',
      };
    }

    const cleanName = subredditName.trim().toLowerCase();

    // Check length constraints
    if (cleanName.length < GAME_CONFIG.LIMITS.MIN_SUBREDDIT_NAME_LENGTH) {
      return {
        isValid: false,
        error: `Subreddit name must be at least ${GAME_CONFIG.LIMITS.MIN_SUBREDDIT_NAME_LENGTH} characters`,
      };
    }

    if (cleanName.length > GAME_CONFIG.LIMITS.MAX_SUBREDDIT_NAME_LENGTH) {
      return {
        isValid: false,
        error: `Subreddit name must be no more than ${GAME_CONFIG.LIMITS.MAX_SUBREDDIT_NAME_LENGTH} characters`,
      };
    }

    // Check format (Reddit subreddit naming rules)
    const subredditRegex = /^[a-z0-9][a-z0-9_]{2,20}$/;
    if (!subredditRegex.test(cleanName)) {
      return {
        isValid: false,
        error: 'Subreddit name contains invalid characters or format',
      };
    }

    // Check for reserved names
    const reservedNames = ['api', 'www', 'reddit', 'admin', 'mod', 'all', 'popular'];
    if (reservedNames.includes(cleanName)) {
      return {
        isValid: false,
        error: 'Subreddit name is reserved',
      };
    }

    return {
      isValid: true,
      subredditName: cleanName,
    };
  }

  /**
   * Sanitize and normalize subreddit name
   */
  sanitizeSubredditName(subredditName: string): string {
    if (!subredditName) return '';
    
    // Remove r/ prefix if present
    let cleaned = subredditName.trim();
    if (cleaned.startsWith('r/')) {
      cleaned = cleaned.substring(2);
    }
    if (cleaned.startsWith('/r/')) {
      cleaned = cleaned.substring(3);
    }

    // Convert to lowercase and remove invalid characters
    cleaned = cleaned.toLowerCase().replace(/[^a-z0-9_]/g, '');

    return cleaned;
  }

  /**
   * Check if subreddit name is valid (quick validation)
   */
  private isValidSubredditName(subredditName: string): boolean {
    const validation = this.validateSubredditName(subredditName);
    return validation.isValid;
  }

  /**
   * Get subreddit context with validation for API endpoints
   */
  getValidatedSubredditContext(requestSubreddit?: string): SubredditValidationResult {
    const contextInfo = this.detectSubredditContext(requestSubreddit);
    const validation = this.validateSubredditName(contextInfo.subredditName);

    if (!validation.isValid) {
      return validation;
    }

    return {
      isValid: true,
      subredditName: validation.subredditName,
    };
  }

  /**
   * Ensure data isolation by validating subreddit context in operations
   */
  validateDataIsolation(operationSubreddit: string, contextSubreddit: string): boolean {
    // In multi-subreddit mode, operations should be isolated to their respective subreddits
    // This prevents cross-subreddit data leakage
    const normalizedOperation = this.sanitizeSubredditName(operationSubreddit);
    const normalizedContext = this.sanitizeSubredditName(contextSubreddit);
    
    return normalizedOperation === normalizedContext;
  }

  /**
   * Generate subreddit-specific cache keys
   */
  generateCacheKey(baseKey: string, subredditName: string, ...additionalKeys: string[]): string {
    const sanitizedSubreddit = this.sanitizeSubredditName(subredditName);
    const parts = [baseKey, sanitizedSubreddit, ...additionalKeys].filter(Boolean);
    return parts.join(':');
  }

  /**
   * Check if subreddit switching is allowed
   */
  canSwitchToSubreddit(targetSubreddit: string, currentUser?: string): { allowed: boolean; reason?: string } {
    const validation = this.validateSubredditName(targetSubreddit);
    
    if (!validation.isValid) {
      return {
        allowed: false,
        reason: validation.error,
      };
    }

    // Additional checks could be added here:
    // - User permissions
    // - Subreddit accessibility
    // - Rate limiting
    
    return { allowed: true };
  }

  /**
   * Get subreddit display name for UI
   */
  getDisplayName(subredditName: string): string {
    const sanitized = this.sanitizeSubredditName(subredditName);
    return `r/${sanitized}`;
  }

  /**
   * Extract subreddit from various URL formats
   */
  extractSubredditFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      
      // Match patterns like /r/subreddit or /r/subreddit/...
      const pathMatch = urlObj.pathname.match(/^\/r\/([a-zA-Z0-9_]+)/);
      if (pathMatch) {
        return this.sanitizeSubredditName(pathMatch[1]);
      }

      // Check query parameters
      const subredditParam = urlObj.searchParams.get('subreddit');
      if (subredditParam) {
        return this.sanitizeSubredditName(subredditParam);
      }

      return null;
    } catch (error) {
      console.warn('Failed to extract subreddit from URL:', error);
      return null;
    }
  }

  /**
   * Log subreddit context for debugging
   */
  logContextInfo(contextInfo: SubredditContextInfo, operation: string): void {
    console.log(`[SubredditContext] ${operation}:`, {
      subreddit: contextInfo.subredditName,
      source: contextInfo.source,
      fromDevvit: contextInfo.isFromDevvitContext,
      fromRequest: contextInfo.isFromRequest,
    });
  }
}

// Export singleton instance
export const subredditContextService = new SubredditContextService();