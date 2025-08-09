import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { type ContactUI } from '@/domain/ui-types';

interface ContactAvatarProps {
  contact: ContactUI;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ContactAvatar({ contact, className = '', size = 'md' }: ContactAvatarProps) {
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (index: number): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-yellow-500',
      'bg-red-500',
    ];
    return colors[index % colors.length];
  };

  const avatarColor = getAvatarColor(
    contact.id ? Number(contact.id) % 7 :
    (contact.firstName.charCodeAt(0) + contact.lastName.charCodeAt(0)) % 7
  );

  const avatarSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  
  return (
    <Avatar className={`${className} ${avatarSize} flex-shrink-0`}>
      <AvatarFallback
        className={`${avatarColor} text-white font-medium text-sm`}
      >
        {getInitials(contact.firstName || '', contact.lastName || '')}
      </AvatarFallback>
    </Avatar>
  );
}