import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Share2, Trash2, Star, Pin } from 'lucide-react';
import { type ContactUI } from '@/domain/ui-types';
import { DeviceIntegration } from '@/utils/device-integration';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface ContactActionsProps {
  contact: ContactUI;
  onEdit?: (contact: ContactUI) => void;
  onDelete?: (id: number | string) => void;
  onShare?: (contact: ContactUI) => void;
  onStar?: (contact: ContactUI) => void;
  onPin?: (contact: ContactUI) => void;
  isStarred?: boolean;
  isPinned?: boolean;
  showStar?: boolean;
  showPin?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ContactActions({
  contact,
  onEdit,
  onDelete,
  onShare,
  onStar,
  onPin,
  isStarred = false,
  isPinned = false,
  showStar = true,
  showPin = true,
  size = 'md'
}: ContactActionsProps) {
  const buttonSize = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;

  const handleShare = (contact: ContactUI) => {
    onShare 
      ? onShare(contact)
      : DeviceIntegration.shareContact({
          ...contact,
          id: contact.id ? String(contact.id) : undefined,
        } as any);
  };

  const handleDelete = (id: number | string) => {
    if (window.confirm("آیا از حذف این مخاطب مطمئن هستید؟")) {
      onDelete?.(id);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex gap-1 flex-shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className={`${buttonSize} p-0`}
              onClick={() => onEdit?.(contact)}
            >
              <Edit size={iconSize} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>ویرایش مخاطب</p>
          </TooltipContent>
        </Tooltip>
        
        {showPin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className={`${buttonSize} p-0 ${isPinned ? 'text-yellow-500 hover:text-yellow-600' : ''}`}
                onClick={() => onPin?.(contact)}
              >
                <Pin size={iconSize} className={isPinned ? 'fill-current' : ''} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isPinned ? "برداشتن پین" : "پین کردن مخاطب"}</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {showStar && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className={`${buttonSize} p-0 ${isStarred ? 'text-yellow-500 hover:text-yellow-600' : ''}`}
                onClick={() => onStar?.(contact)}
              >
                <Star size={iconSize} className={isStarred ? 'fill-current' : ''} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isStarred ? "برداشتن ستاره" : "ستاره‌دار کردن مخاطب"}</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className={`${buttonSize} p-0`}
              onClick={() => handleShare(contact)}
            >
              <Share2 size={iconSize} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>اشتراک‌گذاری مخاطب</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="destructive" 
              size="icon" 
              className={`${buttonSize} p-0`}
              onClick={() => handleDelete(String(contact.id!))}
            >
              <Trash2 size={iconSize} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>حذف مخاطب</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}