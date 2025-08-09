import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchSuggestions } from '@/services/contact-service-with-query';

interface SmartSearchConfig {
  minQueryLength?: number;
  maxSuggestions?: number;
  enableSmartDefaults?: boolean;
  enableRecentSearches?: boolean;
  maxRecentSearches?: number;
}

interface SmartSearchResult {
  suggestions: Array<{
    id: string;
    text: string;
    type: 'recent' | 'popular' | 'smart' | 'contact';
    category?: string;
  }>;
  isLoading: boolean;
  hasMore: boolean;
}

/**
 * Hook برای مدیریت جستجوی هوشمند با پیشنهادات و پیش‌فرض‌سازی
 */
export function useSmartSearch(
  query: string,
  config: SmartSearchConfig = {}
): SmartSearchResult & {
  addRecentSearch: (searchTerm: string) => void;
  removeRecentSearch: (searchTerm: string) => void;
  clearRecentSearches: () => void;
  getSmartDefaults: () => string[];
} {
  const {
    minQueryLength = 2,
    maxSuggestions = 5,
    enableSmartDefaults = true,
    enableRecentSearches = true,
    maxRecentSearches = 10,
  } = config;

  // State for recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('prism-recent-searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // State for popular searches
  const [popularSearches, setPopularSearches] = useState<string[]>([
    'name:علی',
    'name:سارا',
    'phone:0912',
    'company:شرکت',
    'group:کار',
  ]);

  // Get search suggestions from React Query
  const {
    data: contactSuggestions = [],
    isLoading: isSuggestionsLoading,
  } = useSearchSuggestions(query, maxSuggestions);

  // Generate smart defaults based on current context
  const getSmartDefaults = useCallback((): string[] => {
    if (!enableSmartDefaults) return [];

    const defaults: string[] = [];

    // Add popular searches if query is empty
    if (!query.trim()) {
      defaults.push(...popularSearches.slice(0, 3));
    }

    // Add smart suggestions based on recent searches
    if (recentSearches.length > 0) {
      const recentUnique = [...new Set(recentSearches)];
      defaults.push(...recentUnique.slice(0, 2));
    }

    // Add contextual suggestions based on current date/time
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 9 && hour <= 17) {
      defaults.push('group:کار');
    }
    
    if (hour >= 18 && hour <= 22) {
      defaults.push('group:دوستان');
    }

    return [...new Set(defaults)].slice(0, 5);
  }, [query, recentSearches, popularSearches, enableSmartDefaults]);

  // Combine all suggestions
  const suggestions = useMemo(() => {
    const allSuggestions: Array<{
      id: string;
      text: string;
      type: 'recent' | 'popular' | 'smart' | 'contact';
      category?: string;
    }> = [];

    // Add recent searches
    if (enableRecentSearches && query.trim() === '') {
      recentSearches.forEach((search, index) => {
        allSuggestions.push({
          id: `recent-${index}`,
          text: search,
          type: 'recent',
          category: 'جستجوهای اخیر',
        });
      });
    }

    // Add smart defaults
    if (query.trim() === '') {
      const smartDefaults = getSmartDefaults();
      smartDefaults.forEach((search, index) => {
        allSuggestions.push({
          id: `smart-${index}`,
          text: search,
          type: 'smart',
          category: 'پیشنهاد هوشمند',
        });
      });
    }

    // Add popular searches
    if (query.trim() === '') {
      popularSearches.forEach((search, index) => {
        allSuggestions.push({
          id: `popular-${index}`,
          text: search,
          type: 'popular',
          category: 'جستجوی محبوب',
        });
      });
    }

    // Add contact suggestions
    if (query.length >= minQueryLength) {
      contactSuggestions.forEach((suggestion, index) => {
        allSuggestions.push({
          id: `contact-${suggestion.id}`,
          text: suggestion.name,
          type: 'contact',
          category: 'مخاطبین',
        });
      });
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.text === suggestion.text)
    );

    return uniqueSuggestions.slice(0, maxSuggestions);
  }, [
    query,
    recentSearches,
    popularSearches,
    contactSuggestions,
    getSmartDefaults,
    enableRecentSearches,
    minQueryLength,
    maxSuggestions,
  ]);

  // Manage recent searches
  const addRecentSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setRecentSearches(prev => {
      // Remove if already exists
      const filtered = prev.filter(term => term !== searchTerm);
      // Add to beginning
      const updated = [searchTerm, ...filtered];
      // Limit to maxRecentSearches
      const limited = updated.slice(0, maxRecentSearches);
      
      // Save to localStorage
      try {
        localStorage.setItem('prism-recent-searches', JSON.stringify(limited));
      } catch (error) {
        console.error('Failed to save recent searches:', error);
      }
      
      return limited;
    });
  }, [maxRecentSearches]);

  const removeRecentSearch = useCallback((searchTerm: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(term => term !== searchTerm);
      
      try {
        localStorage.setItem('prism-recent-searches', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent searches:', error);
      }
      
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    
    try {
      localStorage.removeItem('prism-recent-searches');
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, []);

  return {
    suggestions,
    isLoading: isSuggestionsLoading,
    hasMore: false,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    getSmartDefaults,
  };
}