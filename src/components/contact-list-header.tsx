"use client";

import React, { memo, useCallback, useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// کلید ذخیره جستجوهای اخیر در localStorage
const RECENT_SEARCHES_KEY = 'recentSearches';

/**
 * دریافت جستجوهای اخیر از localStorage
 */
const getRecentSearches = (): string[] => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
  return saved ? JSON.parse(saved) : [];
};

/**
 * ذخیره جستجوی جدید در لیست جستجوهای اخیر
 */
const saveSearchTerm = (term: string) => {
  if (!term.trim()) return;
  
  const searches = getRecentSearches();
  // حذف تکراری‌ها و اضافه کردن به ابتدای لیست
  const updatedSearches = [
    term.trim(),
    ...searches.filter(search => search.toLowerCase() !== term.trim().toLowerCase())
  ].slice(0, 5); // فقط 5 مورد آخر را نگه دار
  
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
};

interface ContactListHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSearchSubmit?: (term: string) => void;
}

export const ContactListHeader = memo(function ContactListHeader({
  searchTerm,
  onSearchChange,
  onSearchSubmit,
}: ContactListHeaderProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // بارگیری جستجوهای اخیر
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // بستن پیشنهادات با کلیک خارج از کادر
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // تولید پیشنهادات بر اساس متن وارد شده
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([]);
      return;
    }

    // اینجا می‌توانید منطق پیشرفته‌تری برای پیشنهادات اضافه کنید
    // در حال حاضر فقط جستجوهای مشابه را پیشنهاد می‌دهد
    const recent = getRecentSearches();
    const matched = recent.filter(search => 
      search.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setSuggestions(matched);
  }, [searchTerm]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
      setShowSuggestions(true);
    },
    [onSearchChange]
  );

  const handleSuggestionClick = useCallback((suggestion: string) => {
    onSearchChange(suggestion);
    setShowSuggestions(false);
    if (onSearchSubmit) onSearchSubmit(suggestion);
  }, [onSearchChange, onSearchSubmit]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      saveSearchTerm(searchTerm);
      setRecentSearches(getRecentSearches());
      if (onSearchSubmit) onSearchSubmit(searchTerm);
      setShowSuggestions(false);
    }
  }, [searchTerm, onSearchSubmit]);

  const clearSearch = useCallback(() => {
    onSearchChange('');
    if (onSearchSubmit) onSearchSubmit('');
  }, [onSearchChange, onSearchSubmit]);

  return (
    <div className="flex flex-col w-full mb-6" ref={containerRef}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Input
            type="text"
            placeholder="جستجوی مخاطبین..."
            className="pl-10 pr-10 py-2 w-full rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
            value={searchTerm}
            onChange={handleChange}
            onFocus={() => setShowSuggestions(true)}
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            role="combobox"
          />
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
            aria-hidden="true"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="پاک کردن جستجو"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        <Button 
          type="submit" 
          variant="default" 
          className="hidden" // مخفی شده، فقط برای ارسال فرم با اینتر
        >
          جستجو
        </Button>
      </form>

      {/* پنل پیشنهادات و جستجوهای اخیر */}
      {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
        <div className="absolute z-10 mt-1 w-full max-w-md rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-2">
            {/* پیشنهادات */}
            {suggestions.length > 0 && (
              <>
                <h4 className="px-2 py-1 text-sm font-medium text-muted-foreground">پیشنهادات</h4>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>
                      <button
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-right px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md flex items-center justify-between"
                      >
                        <span>{suggestion}</span>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* جستجوهای اخیر */}
            {recentSearches.length > 0 && (
              <>
                <h4 className="px-2 py-1 mt-2 text-sm font-medium text-muted-foreground">جستجوهای اخیر</h4>
                <ul className="space-y-1">
                  {recentSearches
                    .filter(search => !suggestions.includes(search))
                    .map((search, index) => (
                      <li key={`recent-${index}`}>
                        <button
                          type="button"
                          onClick={() => handleSuggestionClick(search)}
                          className="w-full text-right px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md flex items-center justify-between"
                        >
                          <span>{search}</span>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </li>
                    ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default ContactListHeader;