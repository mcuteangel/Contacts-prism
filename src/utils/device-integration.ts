export class DeviceIntegration {
  static makeCall(phoneNumber: string) {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_blank');
    }
  }

  static openMaps(address?: string, latitude?: number, longitude?: number) {
    if (latitude && longitude) {
      // Using coordinates
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
    } else if (address) {
      // Using address
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    } else {
      // Default to user's location if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
          },
          (error) => {
            console.error('Error getting location:', error);
            window.open('https://www.google.com/maps', '_blank');
          }
        );
      } else {
        window.open('https://www.google.com/maps', '_blank');
      }
    }
  }

  static sendSMS(phoneNumber: string, message?: string) {
    if (phoneNumber) {
      const smsUrl = message ? `sms:${phoneNumber}?body=${encodeURIComponent(message)}` : `sms:${phoneNumber}`;
      window.open(smsUrl, '_blank');
    }
  }

  static sendEmail(emailAddress: string, subject?: string, body?: string) {
    if (emailAddress) {
      const emailUrl = subject || body 
        ? `mailto:${emailAddress}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`
        : `mailto:${emailAddress}`;
      window.open(emailUrl, '_blank');
    }
  }

  static shareContact(contact: any) {
    if (navigator.share) {
      const shareData = {
        title: `مخاطب: ${contact.firstName} ${contact.lastName}`,
        text: `اطلاعات مخاطب ${contact.firstName} ${contact.lastName}`,
        url: window.location.href
      };
      
      navigator.share(shareData).catch(console.error);
    } else {
      // Fallback for browsers that don't support Web Share API
      this.copyToClipboard(this.formatContactForShare(contact));
      alert('اطلاعات مخاطب در کلیپ‌بورد کپی شد!');
    }
  }

  static formatContactForShare(contact: any): string {
    let shareText = `مخاطب: ${contact.firstName} ${contact.lastName}\n\n`;
    
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      shareText += 'شماره‌ها:\n';
      contact.phoneNumbers.forEach((phone: any) => {
        shareText += `- ${phone.type}: ${phone.number}\n`;
      });
    }
    
    if (contact.email) {
      shareText += `ایمیل: ${contact.email}\n`;
    }
    
    if (contact.position) {
      shareText += `سمت: ${contact.position}\n`;
    }
    
    if (contact.company) {
      shareText += `شرکت: ${contact.company}\n`;
    }
    
    if (contact.address) {
      shareText += `آدرس: ${contact.address}\n`;
    }
    
    if (contact.notes) {
      shareText += `یادداشت: ${contact.notes}\n`;
    }
    
    return shareText;
  }

  static copyToClipboard(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(console.error);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }
}