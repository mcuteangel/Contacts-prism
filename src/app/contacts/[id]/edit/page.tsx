'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ContactForm } from '@/components/contact-form';
import { ContactService } from '@/services/contact-service';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';

type UIContact = {
  id?: number | string;
  firstName: string;
  lastName: string;
  phoneNumbers: { type: "mobile" | "home" | "work" | "other"; number: string }[];
  gender?: "male" | "female" | "other";
  notes?: string;
  position?: string;
  address?: string;
  groupId?: number | string;
  customFields?: { name: string; value: string; type?: 'text' | 'number' | 'date' | 'list' }[];
  avatar?: string | null;
};

type UIGroup = { id?: number | string; name: string };

export default function EditContactPage() {
  const [contact, setContact] = useState<UIContact | null>(null);
  const [groups, setGroups] = useState<UIGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const { id } = params;

  const fetchGroups = useCallback(async () => {
    const result = await (ContactService as any).getAllGroups();
    if (result.ok) {
      setGroups(result.data);
    } else {
      toast.error("خطا در دریافت لیست گروه‌ها");
    }
  }, []);

  const fetchContact = useCallback(async (contactId: string) => {
    const result = await (ContactService as any).getContactById(contactId);
    if (result.ok) {
      setContact(result.data);
    } else {
      toast.error("مخاطب مورد نظر یافت نشد");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGroups();
    if (typeof id === 'string') {
      fetchContact(id);
    }
  }, [id, fetchGroups, fetchContact]);

  const handleAddGroup = async (groupName: string) => {
    const result = await (ContactService as any).createGroup({ name: groupName });
    if (result.ok) {
      toast.success("گروه جدید با موفقیت اضافه شد");
      fetchGroups();
    } else {
      toast.error("خطا در افزودن گروه");
    }
  };

  if (loading) {
    return <div>در حال بارگذاری...</div>;
  }

  if (!contact) {
    return <div>مخاطب یافت نشد.</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">ویرایش مخاطب</h1>
      <ContactForm 
        editingContact={contact}
        groups={groups}
        onAddGroup={handleAddGroup}
        onGroupsRefreshed={fetchGroups}
      />
    </div>
  );
}
