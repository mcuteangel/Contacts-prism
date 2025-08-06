"use client";

import React, { useEffect, useState } from "react";
import { ContactService } from "@/services/contact-service";
import { type Group } from "@/database/db";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";

// RHF + Zod for Group creation
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroupSchema, type CreateGroupInput } from "@/domain/schemas/group";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: "" },
  });

  const fetchGroups = async () => {
    try {
      const res = await ContactService.getAllGroups();
      if (!res.ok) {
        toast.error("بارگذاری گروه‌ها با شکست مواجه شد.");
        console.error("Error fetching groups:", res.error);
        return;
      }
      setGroups(res.data);
    } catch (error) {
      toast.error("بارگذاری گروه‌ها با شکست مواجه شد.");
      console.error("Error fetching groups:", error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroup: SubmitHandler<CreateGroupInput> = async (values) => {
    const parsed = createGroupSchema.safeParse(values);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "ورودی نامعتبر است";
      toast.error(msg);
      return;
    }
    try {
      await ContactService.addGroup(parsed.data.name.trim());
      toast.success("گروه با موفقیت اضافه شد!");
      form.reset({ name: "" });
      fetchGroups();
    } catch (error) {
      toast.error("افزودن گروه با شکست مواجه شد.");
      console.error("Error adding group:", error);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (window.confirm("آیا از حذف این گروه مطمئن هستید؟ مخاطبین مرتبط با این گروه حذف نمی‌شوند.")) {
      try {
        const delRes = await ContactService.deleteGroup(id);
        if (!delRes.ok) {
          toast.error("حذف گروه با شکست مواجه شد.");
          console.error("Error deleting group:", delRes.error);
          return;
        }
        toast.success("گروه با موفقیت حذف شد!");
        fetchGroups();
      } catch (error) {
        toast.error("حذف گروه با شکست مواجه شد.");
        console.error("Error deleting group:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-900 dark:to-black">
      <div className="p-4 sm:p-8">
        <h1 className="text-3xl font-bold text-primary-foreground mb-6">مدیریت گروه‌ها</h1>
        <div className="glass p-6 rounded-lg shadow-lg backdrop-blur-md">
          <form className="flex gap-2 mb-6" onSubmit={form.handleSubmit(handleAddGroup)}>
            <Input
              placeholder="نام گروه جدید"
              {...form.register("name")}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.form?.requestSubmit();
                  e.preventDefault();
                }
              }}
            />
            <Button type="submit">
              <Plus size={18} className="ml-2" /> افزودن
            </Button>
          </form>
          {form.formState.errors.name && (
            <p className="text-right text-red-500 text-sm -mt-4 mb-4">
              {form.formState.errors.name.message}
            </p>
          )}

          {groups.length === 0 ? (
            <p className="text-center text-muted-foreground">گروهی یافت نشد. یک گروه جدید اضافه کنید!</p>
          ) : (
            <div className="grid gap-3">
              {groups.map((group) => (
                <div key={group.id} className="glass p-3 rounded-lg flex justify-between items-center">
                  <span className="font-medium">{group.name}</span>
                  <Button variant="destructive" size="icon" onClick={() => handleDeleteGroup(group.id!)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}