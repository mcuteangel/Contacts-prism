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
    // Logging disabled
    
    const result = await ContactService.initialize();
    
    if (result.ok) {
      // Logging disabled

      isInitialized = true;
    } else {
      // Logging disabled

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