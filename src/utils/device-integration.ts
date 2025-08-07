// ===== IMPORTS & DEPENDENCIES =====
import { toast } from "sonner";
import type { Contact } from "@/database/db";
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';

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
        } catch (err) {
          console.error('Error sharing contact:', err);
          // Continue to fallback if sharing fails
        }
      }
      
      // Fallback: Copy VCard to clipboard
      await this.copyToClipboard(vCardData);
      toast.success('اطلاعات مخاطب (VCard) در کلیپ‌بورد کپی شد!');
      
    } catch (error) {
      console.error('Error in shareContact:', error);
      toast.error('خطا در اشتراک‌گذاری مخاطب');
    }
  }

  /**
   * A helper function to copy text to the clipboard with a fallback for older browsers.
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