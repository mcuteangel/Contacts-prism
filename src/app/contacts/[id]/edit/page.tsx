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
  phoneNumbers: Array<{
    type: "mobile" | "home" | "work" | "other";
    number: string;
    id?: string | number;
  }>;
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
    const result = await ContactService.getAllGroups();
    if (result.ok) {
      setGroups(result.data);
    } else {
      toast.error("خطا در دریافت لیست گروه‌ها");
    }
  }, []);

  const fetchContact = useCallback(async (contactId: string) => {
    const result = await ContactService.getById(contactId);
    if (result.ok && result.data) {
      setContact({
        id: result.data.id,
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        phoneNumbers: (result.data.phoneNumbers || []).map(phone => ({
          type: (phone.type as "mobile" | "home" | "work" | "other") || 'mobile',
          number: phone.number,
          id: phone.id
        })),
        notes: result.data.notes || '',
        position: result.data.position,
        address: result.data.address || '',
        groupId: result.data.groupId ? String(result.data.groupId) : undefined,
        customFields: (result.data.customFields || []).map(field => ({
          name: field.name,
          value: field.value,
          type: field.type as 'text' | 'number' | 'date' | 'list' | undefined
        }))
      });
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
    const result = await ContactService.addGroup(groupName);
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
