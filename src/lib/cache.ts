// Local storage utilities with error handling and expiration
class LocalStorageCache {
    private prefix = 'githelp_';

    // Set data with optional expiration
    set<T>(key: string, data: T, expirationMinutes?: number): void {
        try {
            const item = {
                data,
                timestamp: Date.now(),
                expiration: expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : null,
            };

            localStorage.setItem(this.prefix + key, JSON.stringify(item));
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
        }
    }

    // Get data with expiration check
    get<T>(key: string): T | null {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return null;

            const parsed = JSON.parse(item);

            // Check if expired
            if (parsed.expiration && Date.now() > parsed.expiration) {
                this.remove(key);
                return null;
            }

            return parsed.data;
        } catch (error) {
            console.warn('Failed to read from localStorage:', error);
            return null;
        }
    }

    // Remove specific item
    remove(key: string): void {
        try {
            localStorage.removeItem(this.prefix + key);
        } catch (error) {
            console.warn('Failed to remove from localStorage:', error);
        }
    }

    // Clear all app data
    clear(): void {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
        }
    }

    // Check if key exists and is not expired
    has(key: string): boolean {
        return this.get(key) !== null;
    }

    // Get all keys with prefix
    getAllKeys(): string[] {
        try {
            return Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .map(key => key.replace(this.prefix, ''));
        } catch (error) {
            console.warn('Failed to get localStorage keys:', error);
            return [];
        }
    }
}

// Session storage utilities (data persists only for the session)
class SessionStorageCache {
    private prefix = 'githelp_session_';

    set<T>(key: string, data: T): void {
        try {
            sessionStorage.setItem(this.prefix + key, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save to sessionStorage:', error);
        }
    }

    get<T>(key: string): T | null {
        try {
            const item = sessionStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.warn('Failed to read from sessionStorage:', error);
            return null;
        }
    }

    remove(key: string): void {
        try {
            sessionStorage.removeItem(this.prefix + key);
        } catch (error) {
            console.warn('Failed to remove from sessionStorage:', error);
        }
    }

    clear(): void {
        try {
            const keys = Object.keys(sessionStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    sessionStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('Failed to clear sessionStorage:', error);
        }
    }
}

// Memory cache for temporary data (lost on page refresh)
class MemoryCache {
    private cache = new Map<string, { data: any; timestamp: number; expiration?: number }>();

    set<T>(key: string, data: T, expirationMinutes?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            expiration: expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : undefined,
        });
    }

    get<T>(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;

        // Check if expired
        if (item.expiration && Date.now() > item.expiration) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    remove(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    // Clean up expired items
    cleanup(): void {
        const now = Date.now();
        this.cache.forEach((item, key) => {
            if (item.expiration && now > item.expiration) {
                this.cache.delete(key);
            }
        });
    }
}

// Export cache instances
export const localCache = new LocalStorageCache();
export const sessionCache = new SessionStorageCache();
export const memoryCache = new MemoryCache();

// Cleanup expired memory cache items every 5 minutes
if (typeof window !== 'undefined') {
    setInterval(() => {
        memoryCache.cleanup();
    }, 5 * 60 * 1000); // 5 minutes
}

// Cache keys for consistent usage
export const cacheKeys = {
    // User preferences
    userPreferences: 'user_preferences',
    theme: 'theme',
    language: 'language',

    // UI state
    sidebarCollapsed: 'sidebar_collapsed',
    lastVisitedProject: 'last_visited_project',
    recentProjects: 'recent_projects',

    // Temporary data
    formDrafts: 'form_drafts',
    searchHistory: 'search_history',

    // Analytics
    analyticsCache: 'analytics_cache',

    // Q&A
    qaFilters: 'qa_filters',
    qaSearchHistory: 'qa_search_history',
} as const;

// Helper functions for common cache operations
export const cacheHelpers = {
    // Save user preferences
    saveUserPreferences: (preferences: any) => {
        localCache.set(cacheKeys.userPreferences, preferences);
    },

    // Get user preferences
    getUserPreferences: () => {
        return localCache.get(cacheKeys.userPreferences);
    },

    // Save recent projects (max 10)
    saveRecentProject: (projectId: string, projectName: string) => {
        const recent = localCache.get<Array<{ id: string; name: string; timestamp: number }>>(cacheKeys.recentProjects) || [];

        // Remove existing entry if present
        const filtered = recent.filter(p => p.id !== projectId);

        // Add to beginning
        filtered.unshift({
            id: projectId,
            name: projectName,
            timestamp: Date.now(),
        });

        // Keep only last 10
        const trimmed = filtered.slice(0, 10);

        localCache.set(cacheKeys.recentProjects, trimmed);
    },

    // Get recent projects
    getRecentProjects: () => {
        return localCache.get<Array<{ id: string; name: string; timestamp: number }>>(cacheKeys.recentProjects) || [];
    },

    // Cache form draft
    saveFormDraft: (formId: string, data: any) => {
        const drafts = sessionCache.get<Record<string, any>>('form_drafts') || {};
        drafts[formId] = { data, timestamp: Date.now() };
        sessionCache.set('form_drafts', drafts);
    },

    // Get form draft
    getFormDraft: (formId: string) => {
        const drafts = sessionCache.get<Record<string, any>>('form_drafts') || {};
        return drafts[formId]?.data || null;
    },

    // Clear expired drafts (older than 1 hour)
    clearExpiredDrafts: () => {
        const drafts = sessionCache.get<Record<string, any>>('form_drafts') || {};
        const oneHourAgo = Date.now() - (60 * 60 * 1000);

        Object.keys(drafts).forEach(key => {
            if (drafts[key].timestamp < oneHourAgo) {
                delete drafts[key];
            }
        });

        sessionCache.set('form_drafts', drafts);
    },
};