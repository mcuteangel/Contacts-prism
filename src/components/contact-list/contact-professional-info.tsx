import React from 'react';
import { Briefcase, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type ContactUI } from '@/domain/ui-types';
import { DeviceIntegration } from '@/utils/device-integration';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface ContactProfessionalInfoProps {
  contact: ContactUI;
  onMaps?: (contact: ContactUI) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ContactProfessionalInfo({ contact, onMaps, size = 'md' }: ContactProfessionalInfoProps) {
  const handleMaps = (contact: ContactUI) => {
    if (contact.address) {
      onMaps ? onMaps(contact) : DeviceIntegration.openMaps(contact.address);
    }
  };

  return (
    <div className="space-y-1">
      {contact.position && (
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{contact.position}</span>
        </div>
      )}
      
      {contact.address && (
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <MapPin size={14} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">
                    {contact.address}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={() => handleMaps(contact)}
                  >
                    <MapPin size={12} />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>نمایش در نقشه</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}