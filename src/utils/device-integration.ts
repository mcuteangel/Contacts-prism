// ===== IMPORTS & DEPENDENCIES =====
import { toast } from "sonner";
import type { Contact } from "@/database/db";
import QRCode from 'qrcode';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { saveAs } from 'file-saver';
import { ErrorManager } from '@/lib/error-manager';

/**
 * Interface for phone number information
 */
interface PhoneNumber {
  number: string;
  type?: 'mobile' | 'home' | 'work' | 'other';
  is_primary?: boolean;
}

// ===== CORE BUSINESS LOGIC =====
export class DeviceIntegration {
  static makeCall(phoneNumber: string): void {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`);
    }
  }

  static openMaps(address?: string): void {
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      // Using a more universal format that works better across platforms
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    } else {
      // Default to maps home
      window.open('https://www.google.com/maps', '_blank');
    }
  }

  static sendSMS(phoneNumber: string, message?: string): void {
    if (phoneNumber) {
      const smsUrl = message ? `sms:${phoneNumber}?body=${encodeURIComponent(message)}` : `sms:${phoneNumber}`;
      window.open(smsUrl);
    }
  }

  static sendEmail(emailAddress: string, subject?: string, body?: string): void {
    if (emailAddress) {
      const emailUrl = subject || body 
        ? `mailto:${emailAddress}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`
        : `mailto:${emailAddress}`;
      window.open(emailUrl);
    }
  }

  /**
   * Converts a contact object to the standard VCard (.vcf) format string.
   * This format is universally recognized by contact applications.
   * @param contact - The contact information to convert
   * @param phoneNumbers - Optional array of phone numbers to include in the VCard
   * @returns VCF formatted string
   */
  private static formatContactAsVCard(contact: Contact, phoneNumbers: PhoneNumber[] = []): string {
    let vCard = "BEGIN:VCARD\n";
    vCard += "VERSION:3.0\n";
    vCard += `N:${contact.last_name || ''};${contact.first_name || ''}\n`;
    vCard += `FN:${contact.first_name || ''} ${contact.last_name || ''}\n`;
    
    // Add phone numbers if provided
    phoneNumbers.forEach(phone => {
      const type = phone.type ? `;TYPE=${phone.type.toUpperCase()}` : '';
      vCard += `TEL${type}:${phone.number}\n`;
    });
    
    // Add role if exists (using it as TITLE since job_title doesn't exist)
    if (contact.role) {
      vCard += `TITLE:${contact.role}\n`;
    }
    
    // Add organization/company if exists
    if (contact.company) {
      vCard += `ORG:${contact.company}\n`;
    }
    
    // Add address if exists
    if (contact.address) {
      vCard += `ADR;TYPE=HOME:;;${contact.address.replace(/\n/g, ';')};;;;\n`;
    }
    
    // Add gender if exists
    if (contact.gender && contact.gender !== 'not_specified') {
      const genderMap: Record<string, string> = {
        'male': 'M',
        'female': 'F',
        'other': 'O'
      };
      vCard += `GENDER:${genderMap[contact.gender] || ''}\n`;
    }
    
    // Add notes if exists
    if (contact.notes) {
      vCard += `NOTE:${contact.notes.replace(/\n/g, '\\\\n')}\n`;
    }
    
    vCard += "END:VCARD";
    return vCard;
  }

  /**
   * Shares a contact using the Web Share API if available, with a fallback to clipboard.
   * The contact is shared as a standard .vcf file.
   */
  /**
   * Shares a contact using the Web Share API if available, with a fallback to clipboard.
   * The contact is shared as a standard .vcf file.
   * @param contact - The contact to share
   * @param phoneNumbers - Optional array of phone numbers to include in the VCard
   * @throws Will throw an error if sharing fails and clipboard fallback also fails
   */
  static async shareContact(contact: Contact, phoneNumbers: PhoneNumber[] = []): Promise<void> {
    try {
      const vCardData = this.formatContactAsVCard(contact, phoneNumbers);
      const fileName = `${contact.first_name || 'contact'}.vcf`;
      
      // Create a Blob with the VCard data
      const blob = new Blob([vCardData], { type: 'text/vcard' });
      const file = new File([blob], fileName, { type: 'text/vcard' });
      
      const shareData = {
        title: `مخاطب: ${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        text: `اطلاعات مخاطب ${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        files: [file]
      };

      // Check if Web Share API with files is supported
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share(shareData);
          return;
        } catch {
          // Error will be handled by the outer catch block
          // Continue to fallback if sharing fails
        }
      }
      
      // Fallback: Copy VCard to clipboard
      try {
        await this.copyToClipboard(vCardData);
        toast.success('اطلاعات مخاطب (VCard) در کلیپ‌بورد کپی شد!');
        return;
      } catch {
        // Error will be handled by the outer catch block
        throw new Error('خطا در کپی اطلاعات به حافظه موقت');
      }
    } catch (error) {
      // Error will be shown to user via toast
      const errorMessage = error instanceof Error ? error.message : 'خطای ناشناخته';
      toast.error(`خطا در اشتراک‌گذاری مخاطب: ${errorMessage}`);
      throw error; // Re-throw to allow calling code to handle the error
    }
  }

  /**
   * Generates a QR code image for the given contact information
   * @param contact - The contact information to encode in the QR code
   * @param phoneNumbers - Optional array of phone numbers to include
   * @returns Promise that resolves to a data URL of the QR code image
   */
  static async generateContactQR(contact: Contact, phoneNumbers: PhoneNumber[] = []): Promise<string> {
    try {
      // Format contact as vCard for QR code
      const vCardData = this.formatContactAsVCard(contact, phoneNumbers);
      
      // Generate QR code as data URL
      return await QRCode.toDataURL(vCardData, {
        errorCorrectionLevel: 'H', // High error correction
        margin: 1,
        scale: 8,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (error) {
      // Error will be thrown and handled by the caller
      throw new Error('خطا در تولید کد QR');
    }
  }

  /**
   * Shares a contact as a QR code image
   * @param contact - The contact to share
   * @param phoneNumbers - Optional array of phone numbers to include
   * @returns Promise that resolves when sharing is complete
   */
  static async shareAsQR(contact: Contact, phoneNumbers: PhoneNumber[] = []): Promise<void> {
    try {
      const qrDataUrl = await this.generateContactQR(contact, phoneNumbers);
      
      // Convert data URL to blob
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      
      // Create file from blob
      const fileName = `${contact.first_name || 'contact'}_${Date.now()}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      
      // Try Web Share API first
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `کد QR مخاطب: ${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
          text: `اسکن کنید تا اطلاعات مخاطب ذخیره شود`,
          files: [file]
        });
        return;
      }
      
      // Fallback: Download QR code
      this.downloadQRCode(blob, fileName);
      
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error('خطای ناشناخته');
      ErrorManager.logError(errorInstance, {
        component: 'DeviceIntegration',
        action: 'shareAsQR'
      });
      const errorMessage = errorInstance.message;
      toast.error(`خطا در اشتراک‌گذاری کد QR: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Downloads QR code as an image file
   * @param blob - The QR code image blob
   * @param fileName - The name of the file to save
   */
  private static downloadQRCode(blob: Blob, fileName: string): void {
    try {
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('کد QR با موفقیت دانلود شد');
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error('خطا در ذخیره‌سازی کد QR');
      ErrorManager.logError(errorInstance, {
        component: 'DeviceIntegration',
        action: 'downloadQRCode'
      });
      throw new Error('خطا در ذخیره‌سازی کد QR');
    }
  }

  /**
   * A helper function to copy text to the clipboard with a fallback for older browsers.
   * @param text - The text to copy to clipboard
   * @throws Will throw an error if both modern and fallback methods fail
   */
  private static async copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older/insecure contexts
      return new Promise((resolve, reject) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          resolve();
        } catch (err) {
          reject(err);
        } finally {
          document.body.removeChild(textArea);
        }
      });
    }
  }
}