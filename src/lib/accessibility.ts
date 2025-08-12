/**
 * Accessibility utilities and helpers
 */

import { ErrorManager } from './error-manager';

export interface AccessibilityConfig {
  announceChanges: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  focusIndicators: boolean;
}

export interface AriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  'aria-disabled'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-required'?: boolean;
  role?: string;
  tabIndex?: number;
}

class AccessibilityManager {
  private static instance: AccessibilityManager;
  private config: AccessibilityConfig;
  private announcer: HTMLElement | null = null;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initializeAnnouncer();
    this.detectUserPreferences();
  }

  public static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  private getDefaultConfig(): AccessibilityConfig {
    return {
      announceChanges: true,
      keyboardNavigation: true,
      highContrast: false,
      reducedMotion: false,
      screenReader: false,
      fontSize: 'medium',
      focusIndicators: true,
    };
  }

  /**
   * Initialize screen reader announcer
   */
  private initializeAnnouncer(): void {
    if (typeof window === 'undefined') return;

    try {
      this.announcer = document.createElement('div');
      this.announcer.setAttribute('aria-live', 'polite');
      this.announcer.setAttribute('aria-atomic', 'true');
      this.announcer.setAttribute('class', 'sr-only');
      this.announcer.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `;
      document.body.appendChild(this.announcer);
    } catch (error) {
      ErrorManager.logError(error as Error, {
        component: 'AccessibilityManager',
        action: 'initializeAnnouncer'
      });
    }
  }

  /**
   * Detect user accessibility preferences
   */
  private detectUserPreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      // Detect reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.config.reducedMotion = prefersReducedMotion.matches;

      // Detect high contrast preference
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
      this.config.highContrast = prefersHighContrast.matches;

      // Detect screen reader
      this.config.screenReader = this.detectScreenReader();

      // Listen for changes
      prefersReducedMotion.addEventListener('change', (e) => {
        this.config.reducedMotion = e.matches;
        this.applyAccessibilitySettings();
      });

      prefersHighContrast.addEventListener('change', (e) => {
        this.config.highContrast = e.matches;
        this.applyAccessibilitySettings();
      });

      this.applyAccessibilitySettings();
    } catch (error) {
      ErrorManager.logError(error as Error, {
        component: 'AccessibilityManager',
        action: 'detectUserPreferences'
      });
    }
  }

  /**
   * Detect if screen reader is active
   */
  private detectScreenReader(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      // Check for common screen reader indicators
      const userAgent = navigator.userAgent.toLowerCase();
      const screenReaderIndicators = [
        'nvda', 'jaws', 'dragon', 'zoomtext', 'fusion', 'hal', 'supernova'
      ];

      const hasScreenReaderUA = screenReaderIndicators.some(indicator => 
        userAgent.includes(indicator)
      );

      // Check for screen reader specific APIs
      const hasScreenReaderAPI = 'speechSynthesis' in window || 
                                'webkitSpeechSynthesis' in window;

      return hasScreenReaderUA || hasScreenReaderAPI;
    } catch (error) {
      return false;
    }
  }

  /**
   * Apply accessibility settings to the document
   */
  private applyAccessibilitySettings(): void {
    if (typeof document === 'undefined') return;

    try {
      const root = document.documentElement;

      // Apply reduced motion
      if (this.config.reducedMotion) {
        root.style.setProperty('--animation-duration', '0.01ms');
        root.style.setProperty('--transition-duration', '0.01ms');
      } else {
        root.style.removeProperty('--animation-duration');
        root.style.removeProperty('--transition-duration');
      }

      // Apply high contrast
      if (this.config.highContrast) {
        root.classList.add('high-contrast');
      } else {
        root.classList.remove('high-contrast');
      }

      // Apply font size
      root.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
      root.classList.add(`font-${this.config.fontSize}`);

      // Apply focus indicators
      if (this.config.focusIndicators) {
        root.classList.add('focus-indicators');
      } else {
        root.classList.remove('focus-indicators');
      }
    } catch (error) {
      ErrorManager.logError(error as Error, {
        component: 'AccessibilityManager',
        action: 'applyAccessibilitySettings'
      });
    }
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.config.announceChanges || !this.announcer) return;

    try {
      this.announcer.setAttribute('aria-live', priority);
      this.announcer.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        if (this.announcer) {
          this.announcer.textContent = '';
        }
      }, 1000);
    } catch (error) {
      ErrorManager.logError(error as Error, {
        component: 'AccessibilityManager',
        action: 'announce',
        metadata: { message, priority }
      });
    }
  }

  /**
   * Get accessibility configuration
   */
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Update accessibility configuration
   */
  updateConfig(updates: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...updates };
    this.applyAccessibilitySettings();
    
    // Save to localStorage
    try {
      localStorage.setItem('accessibility-config', JSON.stringify(this.config));
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  /**
   * Load configuration from localStorage
   */
  loadConfig(): void {
    try {
      const saved = localStorage.getItem('accessibility-config');
      if (saved) {
        const config = JSON.parse(saved);
        this.config = { ...this.config, ...config };
        this.applyAccessibilitySettings();
      }
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  /**
   * Generate ARIA attributes for common UI patterns
   */
  getAriaAttributes(pattern: string, options: Record<string, any> = {}): AriaAttributes {
    const patterns: Record<string, (opts: any) => AriaAttributes> = {
      button: (opts) => ({
        role: 'button',
        'aria-pressed': opts.pressed,
        'aria-expanded': opts.expanded,
        'aria-disabled': opts.disabled,
        tabIndex: opts.disabled ? -1 : 0,
      }),
      
      dialog: (opts) => ({
        role: 'dialog',
        'aria-modal': true,
        'aria-labelledby': opts.titleId,
        'aria-describedby': opts.descriptionId,
      }),
      
      menu: (opts) => ({
        role: 'menu',
        'aria-orientation': opts.orientation || 'vertical',
        'aria-labelledby': opts.labelId,
      }),
      
      menuitem: (opts) => ({
        role: 'menuitem',
        'aria-selected': opts.selected,
        'aria-disabled': opts.disabled,
        tabIndex: opts.selected ? 0 : -1,
      }),
      
      tab: (opts) => ({
        role: 'tab',
        'aria-selected': opts.selected,
        'aria-controls': opts.panelId,
        tabIndex: opts.selected ? 0 : -1,
      }),
      
      tabpanel: (opts) => ({
        role: 'tabpanel',
        'aria-labelledby': opts.tabId,
        tabIndex: 0,
      }),
      
      form: (opts) => ({
        'aria-label': opts.label,
        'aria-describedby': opts.descriptionId,
        'aria-invalid': opts.invalid,
        'aria-required': opts.required,
      }),
      
      alert: (opts) => ({
        role: 'alert',
        'aria-live': 'assertive',
        'aria-atomic': true,
      }),
      
      status: (opts) => ({
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': true,
      }),
    };

    const generator = patterns[pattern];
    if (!generator) {
      ErrorManager.logError(new Error(`Unknown ARIA pattern: ${pattern}`), {
        component: 'AccessibilityManager',
        action: 'getAriaAttributes'
      });
      return {};
    }

    return generator(options);
  }

  /**
   * Focus management utilities
   */
  focusManagement = {
    /**
     * Trap focus within an element
     */
    trapFocus: (element: HTMLElement): (() => void) => {
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      };

      element.addEventListener('keydown', handleTabKey);
      firstElement?.focus();

      return () => {
        element.removeEventListener('keydown', handleTabKey);
      };
    },

    /**
     * Restore focus to previously focused element
     */
    restoreFocus: (previousElement: HTMLElement | null) => {
      if (previousElement && typeof previousElement.focus === 'function') {
        previousElement.focus();
      }
    },

    /**
     * Find next focusable element
     */
    findNextFocusable: (current: HTMLElement, direction: 'next' | 'prev' = 'next'): HTMLElement | null => {
      const focusableElements = Array.from(document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )) as HTMLElement[];

      const currentIndex = focusableElements.indexOf(current);
      if (currentIndex === -1) return null;

      const nextIndex = direction === 'next' 
        ? (currentIndex + 1) % focusableElements.length
        : (currentIndex - 1 + focusableElements.length) % focusableElements.length;

      return focusableElements[nextIndex];
    },
  };
}

// Export singleton instance
export const accessibilityManager = AccessibilityManager.getInstance();

// Utility functions
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  accessibilityManager.announce(message, priority);
}

export function getAriaAttributes(pattern: string, options: Record<string, any> = {}): AriaAttributes {
  return accessibilityManager.getAriaAttributes(pattern, options);
}

export function trapFocus(element: HTMLElement): () => void {
  return accessibilityManager.focusManagement.trapFocus(element);
}

export function restoreFocus(previousElement: HTMLElement | null): void {
  accessibilityManager.focusManagement.restoreFocus(previousElement);
}

// Initialize on import
if (typeof window !== 'undefined') {
  accessibilityManager.loadConfig();
}