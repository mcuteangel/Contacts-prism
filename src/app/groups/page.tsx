"use client";

import React, { useEffect, useState } from "react";
import { ContactService } from "@/services/contact-service";
import { type Group } from "@/database/db";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [newGroupName, setNewGroupName] = useState("");

  const fetchGroups = async () => {
    try {
      const allGroups = await ContactService.getAllGroups();
      setGroups(allGroups);
    } catch (error) {
      toast.error("بارگذاری گروه‌ها با شکست مواجه شد.");
      console.error("Error fetching groups:", error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("نام گروه نمی‌تواند خالی باشد.");
      return;
    }
    try {
      await ContactService.addGroup(newGroupName);
      toast.success("گروه با موفقیت اضافه شد!");
      setNewGroupName("");
      fetchGroups();
    } catch (error) {
      toast.error("افزودن گروه با شکست مواجه شد.");
      console.error("Error adding group:", error);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (window.confirm("آیا از حذف این گروه مطمئن هستید؟ مخاطبین مرتبط با این گروه حذف نمی‌شوند.")) {
      try {
        await ContactService.deleteGroup(id);
        toast.success("گروه با موفقیت حذف شد!");
        fetchGroups();
      } catch (error) {
        toast.error("حذف گروه با شکست مواجه شد.");
        console.error("Error deleting group:", error);
      }
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-primary-foreground mb-6">مدیریت گروه‌ها</h1>
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="نام گروه جدید"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddGroup();
              e.preventDefault();
            }
          }}
        />
        <Button onClick={handleAddGroup}>
          <Plus size={18} className="ml-2" /> افزودن
        </Button>
      </div>

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