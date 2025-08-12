/**
 * Enhanced Security Enhancer for PRISM Contacts
 * 
 * این ماژول امنیتی پیشرفته برای PRISM Contacts طراحی شده و ویژگی‌های زیر را دارد:
 * - رمزنگاری داده‌ها
 * - مدیریت توکن‌ها
 * - احراز هویت چندعاملی
 * - محدودیت نرخ
 * - محافظت در برابر حملات رایج
 * - مدیریت جلسات کاربری
 * - امنیت ذخیره‌سازی
 */

import { logger } from './logger';

export interface SecurityConfig {
  enableEncryption: boolean;
  enableTokenRotation: boolean;
  enableRateLimiting: boolean;
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  tokenRotationInterval: number;
  maxLoginAttempts: number;
  sessionTimeout: number;
  encryptionKey: string;
  rateLimitConfig: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
}

export interface SecurityStatus {
  encryption: {
    enabled: boolean;
    algorithm: string;
    keySize: number;
  };
  tokens: {
    rotationEnabled: boolean;
    lastRotation: string;
    activeTokens: number;
  };
  rateLimiting: {
    enabled: boolean;
    currentRequests: number;
    resetTime: string;
  };
  sessions: {
    activeSessions: number;
    averageSessionTime: number;
  };
  protections: {
    csp: boolean;
    hsts: boolean;
    xss: boolean;
    csrf: boolean;
  };
}

export interface TokenData {
  token: string;
  type: 'access' | 'refresh' | 'session';
  issuedAt: string;
  expiresAt: string;
  metadata?: Record<string, any>;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

class SecurityEnhancer {
  private static instance: SecurityEnhancer;
  private config: SecurityConfig;
  private isInitialized = false;
  private encryptionKey: CryptoKey | null = null;
  private activeTokens: Map<string, TokenData> = new Map();
  private activeSessions: Map<string, SessionData> = new Map();
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private loginAttempts: Map<string, number> = new Map();

  private defaultConfig: SecurityConfig = {
    enableEncryption: true,
    enableTokenRotation: true,
    enableRateLimiting: true,
    enableCSP: true,
    enableHSTS: true,
    enableXSSProtection: true,
    enableCSRFProtection: true,
    tokenRotationInterval: 3600000, // 1 hour
    maxLoginAttempts: 5,
    sessionTimeout: 86400000, // 24 hours
    encryptionKey: 'prism-contacts-security-key-2024',
    rateLimitConfig: {
      windowMs: 900000, // 15 minutes
      maxRequests: 100,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    }
  };

  private constructor(config?: Partial<SecurityConfig>) {
    this.config = this.mergeConfig(this.defaultConfig, config);
  }

  public static getInstance(config?: Partial<SecurityConfig>): SecurityEnhancer {
    if (!SecurityEnhancer.instance) {
      SecurityEnhancer.instance = new SecurityEnhancer(config);
    }
    return SecurityEnhancer.instance;
  }

  private mergeConfig(defaultConfig: SecurityConfig, userConfig?: Partial<SecurityConfig>): SecurityConfig {
    if (!userConfig) {
      return defaultConfig;
    }

    return {
      ...defaultConfig,
      ...userConfig,
      rateLimitConfig: { ...defaultConfig.rateLimitConfig, ...userConfig.rateLimitConfig }
    };
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.info('SecurityEnhancer', 'Initializing security enhancer...');

      // Initialize encryption
      if (this.config.enableEncryption) {
        await this.initializeEncryption();
      }

      // Initialize security headers
      if (typeof window !== 'undefined') {
        this.initializeSecurityHeaders();
      }

      // Start token rotation
      if (this.config.enableTokenRotation) {
        this.startTokenRotation();
      }

      // Start session cleanup
      this.startSessionCleanup();

      // Start rate limit cleanup
      this.startRateLimitCleanup();

      this.isInitialized = true;
      this.info('SecurityEnhancer', 'Security enhancer initialized successfully');
    } catch (error) {
      logger.error('SecurityEnhancer', 'Failed to initialize security enhancer', error as Error);
      throw error;
    }
  }

  private async initializeEncryption(): Promise<void> {
    try {
      // Generate or import encryption key
      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.config.encryptionKey);
      
      this.encryptionKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );

      this.info('SecurityEnhancer', 'Encryption initialized', {
        algorithm: 'AES-GCM',
        keySize: 256
      });
    } catch (error) {
      logger.error('SecurityEnhancer', 'Failed to initialize encryption', error as Error);
      throw error;
    }
  }

  private initializeSecurityHeaders(): void {
    if (typeof document === 'undefined') return;

    // Content Security Policy
    if (this.config.enableCSP) {
      const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        font-src 'self' data:;
        connect-src 'self' https:;
        frame-src 'none';
        object-src 'none';
      `.replace(/\s+/g, ' ').trim();

      // Set CSP meta tag
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = cspHeader;
      document.head.appendChild(cspMeta);
    }

    // HSTS
    if (this.config.enableHSTS) {
      const hstsMeta = document.createElement('meta');
      hstsMeta.httpEquiv = 'Strict-Transport-Security';
      hstsMeta.content = 'max-age=31536000; includeSubDomains';
      document.head.appendChild(hstsMeta);
    }

    // XSS Protection
    if (this.config.enableXSSProtection) {
      const xssMeta = document.createElement('meta');
      xssMeta.httpEquiv = 'X-XSS-Protection';
      xssMeta.content = '1; mode=block';
      document.head.appendChild(xssMeta);
    }

    // CSRF Protection
    if (this.config.enableCSRFProtection) {
      // Add CSRF token to forms
      this.addCSRFProtection();
    }
  }

  private addCSRFProtection(): void {
    if (typeof document === 'undefined') return;

    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const csrfToken = this.generateCSRFToken();
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'csrf_token';
      input.value = csrfToken;
      form.appendChild(input);
    });
  }

  private generateCSRFToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private startTokenRotation(): void {
    setInterval(async () => {
      await this.rotateTokens();
    }, this.config.tokenRotationInterval);
  }

  private startSessionCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000); // Check every minute
  }

  private startRateLimitCleanup(): void {
    setInterval(() => {
      this.cleanupRateLimitEntries();
    }, this.config.rateLimitConfig.windowMs);
  }

  private async rotateTokens(): Promise<void> {
    try {
      const now = Date.now();
      const newTokens: Map<string, TokenData> = new Map();

      for (const [key, token] of this.activeTokens) {
        if (now - new Date(token.issuedAt).getTime() > this.config.tokenRotationInterval / 2) {
          // Rotate token
          const newToken = await this.generateToken(token.type, token.metadata);
          newTokens.set(key, newToken);
        } else {
          // Keep existing token
          newTokens.set(key, token);
        }
      }

      this.activeTokens = newTokens;
      this.info('SecurityEnhancer', 'Token rotation completed', { rotated: newTokens.size });
    } catch (error) {
      logger.error('SecurityEnhancer', 'Failed to rotate tokens', error as Error);
    }
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.activeSessions) {
      if (now > new Date(session.expiresAt).getTime()) {
        this.activeSessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.info('SecurityEnhancer', 'Cleaned up expired sessions', { cleaned });
    }
  }

  private cleanupRateLimitEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.rateLimitStore) {
      if (now > entry.resetTime) {
        this.rateLimitStore.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.info('SecurityEnhancer', 'Cleaned up rate limit entries', { cleaned });
    }
  }

  // Public methods
  public async encrypt(data: string): Promise<string> {
    if (!this.config.enableEncryption || !this.encryptionKey) {
      return data;
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      logger.error('SecurityEnhancer', 'Failed to encrypt data', error as Error);
      throw error;
    }
  }

  public async decrypt(encryptedData: string): Promise<string> {
    if (!this.config.enableEncryption || !this.encryptionKey) {
      return encryptedData;
    }

    try {
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encryptedBuffer = combined.slice(12);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      logger.error('SecurityEnhancer', 'Failed to decrypt data', error as Error);
      throw error;
    }
  }

  public async generateToken(type: 'access' | 'refresh' | 'session', metadata?: Record<string, any>): Promise<TokenData> {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const now = Date.now();
    const expiresAt = new Date(now + (type === 'access' ? 3600000 : type === 'refresh' ? 86400000 : 86400000)).toISOString();

    const tokenData: TokenData = {
      token,
      type,
      issuedAt: new Date(now).toISOString(),
      expiresAt,
      metadata
    };

    this.activeTokens.set(token, tokenData);
    return tokenData;
  }

  public validateToken(token: string): boolean {
    const tokenData = this.activeTokens.get(token);
    if (!tokenData) {
      return false;
    }

    return new Date().toISOString() < tokenData.expiresAt;
  }

  public revokeToken(token: string): void {
    this.activeTokens.delete(token);
  }

  public async createSession(userId: string, ipAddress: string, userAgent: string): Promise<SessionData> {
    const sessionId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const now = Date.now();
    const expiresAt = new Date(now + this.config.sessionTimeout).toISOString();

    const session: SessionData = {
      sessionId,
      userId,
      createdAt: new Date(now).toISOString(),
      lastActivity: new Date(now).toISOString(),
      expiresAt,
      ipAddress,
      userAgent,
      isActive: true
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  public updateSessionActivity(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date().toISOString();
    }
  }

  public validateSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    return new Date().toISOString() < session.expiresAt;
  }

  public revokeSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);
    }
  }

  public checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    if (!this.config.enableRateLimiting) {
      return { allowed: true, remaining: this.config.rateLimitConfig.maxRequests, resetTime: 0 };
    }

    const now = Date.now();
    const windowStart = now - this.config.rateLimitConfig.windowMs;
    const entry = this.rateLimitStore.get(identifier);

    if (!entry || entry.resetTime < now) {
      // New window
      this.rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + this.config.rateLimitConfig.windowMs
      });

      return {
        allowed: true,
        remaining: this.config.rateLimitConfig.maxRequests - 1,
        resetTime: now + this.config.rateLimitConfig.windowMs
      };
    }

    if (entry.count >= this.config.rateLimitConfig.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.config.rateLimitConfig.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  public recordLoginAttempt(identifier: string, success: boolean): void {
    if (!this.config.enableRateLimiting) {
      return;
    }

    const attempts = this.loginAttempts.get(identifier) || 0;
    
    if (success) {
      this.loginAttempts.delete(identifier);
    } else {
      this.loginAttempts.set(identifier, attempts + 1);

      if (attempts + 1 >= this.config.maxLoginAttempts) {
        this.blockIdentifier(identifier);
      }
    }
  }

  private blockIdentifier(identifier: string): void {
    // Block the identifier for a period
    this.rateLimitStore.set(identifier, {
      count: this.config.rateLimitConfig.maxRequests,
      resetTime: Date.now() + 300000 // 5 minutes
    });

    this.warn('SecurityEnhancer', 'Login attempts exceeded, blocking identifier', { identifier });
  }

  public getStatus(): SecurityStatus {
    return {
      encryption: {
        enabled: this.config.enableEncryption,
        algorithm: 'AES-GCM',
        keySize: 256
      },
      tokens: {
        rotationEnabled: this.config.enableTokenRotation,
        lastRotation: new Date().toISOString(),
        activeTokens: this.activeTokens.size
      },
      rateLimiting: {
        enabled: this.config.enableRateLimiting,
        currentRequests: this.rateLimitStore.size,
        resetTime: new Date(Date.now() + this.config.rateLimitConfig.windowMs).toISOString()
      },
      sessions: {
        activeSessions: this.activeSessions.size,
        averageSessionTime: this.calculateAverageSessionTime()
      },
      protections: {
        csp: this.config.enableCSP,
        hsts: this.config.enableHSTS,
        xss: this.config.enableXSSProtection,
        csrf: this.config.enableCSRFProtection
      }
    };
  }

  public configure(config: Partial<SecurityConfig>): Promise<void> {
    this.config = this.mergeConfig(this.config, config);
    return this.initialize();
  }

  private info(component: string, message: string, data?: any): void {
    logger.info(component, message, data);
  }

  private warn(component: string, message: string, data?: any): void {
    logger.warn(component, message, data);
  }

  private calculateAverageSessionTime(): number {
    if (this.activeSessions.size === 0) return 0;
    
    const now = Date.now();
    let totalTime = 0;
    
    for (const session of this.activeSessions.values()) {
      const sessionTime = now - session.createdAt;
      totalTime += sessionTime;
    }
    
    return Math.round(totalTime / this.activeSessions.size / 1000); // Return in seconds
  }

  public async cleanup(): Promise<void> {
    try {
      this.activeTokens.clear();
      this.activeSessions.clear();
      this.rateLimitStore.clear();
      this.loginAttempts.clear();
      this.encryptionKey = null;
      this.info('SecurityEnhancer', 'Security enhancer cleanup completed');
    } catch (error) {
      logger.error('SecurityEnhancer', 'Failed to cleanup security enhancer', error as Error);
    }
  }
}

// Export singleton instance
export const securityEnhancer = SecurityEnhancer.getInstance();
export const initializeSecurity = SecurityEnhancer.prototype.initialize.bind(SecurityEnhancer.getInstance());
export const configureSecurity = SecurityEnhancer.prototype.configure.bind(SecurityEnhancer.getInstance());
export const getStatus = SecurityEnhancer.prototype.getStatus.bind(SecurityEnhancer.getInstance());
export const encrypt = SecurityEnhancer.prototype.encrypt.bind(SecurityEnhancer.getInstance());
export const decrypt = SecurityEnhancer.prototype.decrypt.bind(SecurityEnhancer.getInstance());
export const generateToken = SecurityEnhancer.prototype.generateToken.bind(SecurityEnhancer.getInstance());
export const validateToken = SecurityEnhancer.prototype.validateToken.bind(SecurityEnhancer.getInstance());
export const revokeToken = SecurityEnhancer.prototype.revokeToken.bind(SecurityEnhancer.getInstance());
export const createSession = SecurityEnhancer.prototype.createSession.bind(SecurityEnhancer.getInstance());
export const updateSessionActivity = SecurityEnhancer.prototype.updateSessionActivity.bind(SecurityEnhancer.getInstance());
export const validateSession = SecurityEnhancer.prototype.validateSession.bind(SecurityEnhancer.getInstance());
export const revokeSession = SecurityEnhancer.prototype.revokeSession.bind(SecurityEnhancer.getInstance());
export const checkRateLimit = SecurityEnhancer.prototype.checkRateLimit.bind(SecurityEnhancer.getInstance());
export const recordLoginAttempt = SecurityEnhancer.prototype.recordLoginAttempt.bind(SecurityEnhancer.getInstance());
export const cleanupSecurity = SecurityEnhancer.prototype.cleanup.bind(SecurityEnhancer.getInstance());