"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { type Contact, type Group } from "@/database/db";
import { Trash2, Edit, Phone, Tag, MapPin, Briefcase, User, MessageSquare, Mail, Share2 } from "lucide-react";
import { DeviceIntegration } from "@/utils/device-integration";

interface ContactListProps {
  contacts: Contact[];
  groups: Group[];
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (id: number) => void;
}

export function ContactList({ contacts, groups, onEditContact, onDeleteContact }: ContactListProps) {
  const handleCall = (phoneNumber: string) => {
    DeviceIntegration.makeCall(phoneNumber);
  };

  const handleSMS = (phoneNumber: string) => {
    DeviceIntegration.sendSMS(phoneNumber);
  };

  const handleEmail = (emailAddress: string) => {
    DeviceIntegration.sendEmail(emailAddress);
  };

  const handleMaps = (contact: Contact) => {
    DeviceIntegration.openMaps(contact.address);
  };

  const handleShare = (contact: Contact) => {
    DeviceIntegration.shareContact(contact);
  };

  return (
    <div className="grid gap-4">
      {contacts.length === 0 ? (
        <p className="text-center text-muted-foreground">مخاطبی یافت نشد. برای شروع یک مخاطب جدید اضافه کنید!</p>
      ) : (
        contacts.map((contact) => (
          <div key={contact.id} className="glass p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex-grow">
              <h3 className="font-semibold text-lg">{contact.firstName} {contact.lastName}</h3>
              {contact.phoneNumbers.length > 0 && (
                <div className="flex flex-wrap items-center text-sm text-muted-foreground mt-1 gap-2">
                  <Phone size={14} className="ml-1" />
                  {contact.phoneNumbers.map((pn, idx) => (
                    <div key={idx} className="flex items-center gap-1">
                      <span>{pn.type}: {pn.number}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCall(pn.number)}
                        title="تماس"
                      >
                        <Phone size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0"
                        onClick={() => handleSMS(pn.number)}
                        title="ارسال پیامک"
                      >
                        <MessageSquare size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {contact.position && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center">
                  <Briefcase size={14} className="ml-1" /> {contact.position}
                </p>
              )}
              {contact.address && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center">
                  <MapPin size={14} className="ml-1" /> {contact.address}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0 ml-1"
                    onClick={() => handleMaps(contact)}
                    title="نمایش در نقشه"
                  >
                    <MapPin size={12} />
                  </Button>
                </p>
              )}
              {contact.groupId && groups.find(g => g.id === contact.groupId) && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center">
                  <Tag size={14} className="ml-1" /> {groups.find(g => g.id === contact.groupId)?.name}
                </p>
              )}
              {contact.gender && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center">
                  <User size={14} className="ml-1" /> {contact.gender === 'male' ? 'مرد' : contact.gender === 'female' ? 'زن' : 'سایر'}
                </p>
              )}
              {contact.notes && (
                <p className="text-xs text-muted-foreground mt-1 italic">{contact.notes}</p>
              )}
              {contact.customFields && contact.customFields.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {contact.customFields.map((cf, idx) => (
                    <p key={idx}>
                      <span className="font-medium">{cf.name}:</span> {cf.value} ({cf.type})
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="icon" onClick={() => onEditContact(contact)}>
                <Edit size={16} />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleShare(contact)}>
                <Share2 size={16} />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => onDeleteContact(contact.id!)}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}