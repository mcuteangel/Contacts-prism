/**
 * مقداردهی اولیه ContactService
 * این فایل باید در ابتدای اپلیکیشن اجرا شود
 */

import { ContactService } from '@/services/contact-service';

let isInitialized = false;

/**
 * مقداردهی اولیه ContactService
 * شامل migration ها و تنظیمات اولیه
 */
export async function initializeContactService(): Promise<void> {
  if (isInitialized) {
    return;
  }

  try {
    console.log('[ContactService] Starting initialization...');
    
    const result = await ContactService.initialize();
    
    if (result.ok) {
      console.log('[ContactService] Initialization completed successfully:', result.data);
      isInitialized = true;
    } else {
      console.error('[ContactService] Initialization failed:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('[ContactService] Initialization error:', error);
    throw error;
  }
}

/**
 * بررسی وضعیت مقداردهی اولیه
 */
export function isContactServiceInitialized(): boolean {
  return isInitialized;
}