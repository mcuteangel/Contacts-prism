"use client";

import React, { useEffect, useState } from "react";
import { ContactService } from "@/services/contact-service";
import { type Group } from "@/database/db";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroupSchema, type CreateGroupInput } from "@/domain/schemas/group";

export function GroupsManagement() {
  const [groups, setGroups] = useState<Group[]>([]);

  // RHF setup for adding a group
  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: "" },
    mode: "onChange",
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

  const handleAddGroup = async (values: CreateGroupInput) => {
    const parsed = createGroupSchema.safeParse(values);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "نام گروه نامعتبر است.";
      toast.error(first);
      return;
    }
    const name = parsed.data.name.trim();
    try {
      const res = await ContactService.addGroup(name);
      if (!res.ok) {
        toast.error("افزودن گروه با شکست مواجه شد.");
        console.error("Error adding group:", res.error);
        return;
      }
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
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4 text-primary-foreground">مدیریت گروه‌ها</h2>

      <form
        className="flex gap-2 mb-6"
        onSubmit={form.handleSubmit(handleAddGroup)}
      >
        <Input
          placeholder="نام گروه جدید"
          {...form.register("name")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // اجازه می‌دهیم submit فرم انجام شود
            }
          }}
        />
        <Button type="submit">
          <Plus size={18} className="ml-2" /> افزودن
        </Button>
      </form>

      {form.formState.errors.name ? (
        <p className="text-sm text-red-500 mb-4">{form.formState.errors.name.message}</p>
      ) : null}

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
  );
}