import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare } from 'lucide-react';
import { type ContactUI, type PhoneNumberUI } from '@/domain/ui-types';
import { DeviceIntegration } from '@/utils/device-integration';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ContactPhoneInfoProps {
  contact: ContactUI;
  onCall?: (phoneNumber: string) => void;
  onSMS?: (phoneNumber: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ContactPhoneInfo({ contact, onCall, onSMS }: ContactPhoneInfoProps) {
  const phoneList = (c: ContactUI): PhoneNumberUI[] =>
    Array.isArray(c.phoneNumbers) ? (c.phoneNumbers as PhoneNumberUI[]) : [];

  const handleCall = (phoneNumber: string) => {
    onCall ? onCall(phoneNumber) : DeviceIntegration.makeCall(phoneNumber);
  };

  const handleSMS = (phoneNumber: string) => {
    onSMS ? onSMS(phoneNumber) : DeviceIntegration.sendSMS(phoneNumber);
  };

  const phones = phoneList(contact);

  if (phones.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center text-sm text-muted-foreground mt-1 gap-2">
      <Phone size={14} className="ml-1" />
      {phones.map((pn, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <span>
            {pn.type}: {pn.number}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={() => handleCall(pn.number)}
                >
                  <Phone size={12} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>تماس با {pn.number}</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={() => handleSMS(pn.number)}
                >
                  <MessageSquare size={12} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>ارسال پیامک به {pn.number}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ))}
    </div>
  );
}