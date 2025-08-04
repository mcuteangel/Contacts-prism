"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { type Contact, type Group } from "@/database/db";
import { Trash2, Edit, Phone, Tag, MapPin, Briefcase, User } from "lucide-react";

interface ContactListProps {
  contacts: Contact[];
  groups: Group[];
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (id: number) => void;
}

export function ContactList({ contacts, groups, onEditContact, onDeleteContact }: ContactListProps) {
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
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Phone size={14} className="ml-1" />
                  {contact.phoneNumbers.map((pn, idx) => (
                    <span key={idx} className="ml-2">
                      {pn.type}: {pn.number}
                    </span>
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