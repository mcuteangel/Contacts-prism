'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ContactForm } from '@/components/contact-form';
import { ContactService } from '@/services/contact-service';
import { toast } from 'sonner';

type UIGroup = { id?: number | string; name: string };

export default function NewContactPage() {
  const [groups, setGroups] = useState<UIGroup[]>([]);

  const fetchGroups = useCallback(async () => {
    const result = await (ContactService as any).getAllGroups();
    if (result.ok) {
      setGroups(result.data);
    } else {
      toast.error("خطا در دریافت لیست گروه‌ها");
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleAddGroup = async (groupName: string) => {
    const result = await (ContactService as any).createGroup({ name: groupName });
    if (result.ok) {
      toast.success("گروه جدید با موفقیت اضافه شد");
      fetchGroups();
    } else {
      toast.error("خطا در افزودن گروه");
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">افزودن مخاطب جدید</h1>
      <ContactForm 
        groups={groups}
        onAddGroup={handleAddGroup}
        onGroupsRefreshed={fetchGroups}
      />
    </div>
  );
}
