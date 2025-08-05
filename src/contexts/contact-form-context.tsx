"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ContactFormContextType {
  isContactFormOpen: boolean;
  setIsContactFormOpen: (open: boolean) => void;
  editingContact: any;
  setEditingContact: (contact: any) => void;
  openContactForm: (contact?: any) => void;
  closeContactForm: () => void;
}

const ContactFormContext = createContext<ContactFormContextType | undefined>(undefined);

export function ContactFormProvider({ children }: { children: ReactNode }) {
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);

  const openContactForm = (contact?: any) => {
    setEditingContact(contact || null);
    setIsContactFormOpen(true);
  };

  const closeContactForm = () => {
    setIsContactFormOpen(false);
    setEditingContact(null);
  };

  return (
    <ContactFormContext.Provider value={{
      isContactFormOpen,
      setIsContactFormOpen,
      editingContact,
      setEditingContact,
      openContactForm,
      closeContactForm
    }}>
      {children}
    </ContactFormContext.Provider>
  );
}

export function useContactForm() {
  const context = useContext(ContactFormContext);
  if (context === undefined) {
    throw new Error('useContactForm must be used within a ContactFormProvider');
  }
  return context;
}