"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ContactService } from "@/services/contact-service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroupSchema, type CreateGroupInput } from "@/domain/schemas/group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddGroupDialog } from "./add-group-dialog";

import type { GroupUI as UIGroup } from "@/domain/ui-types";

export function GroupsManagement() {
  const [groups, setGroups] = useState<UIGroup[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // RHF setup for adding a group via inline form (kept for keyboard UX)
  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: "" },
    mode: "onChange",
  });

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return groups;
    return groups.filter((g) => g.name?.toLowerCase().includes(f));
  }, [groups, filter]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await ContactService.getAllGroups();
      if (!res.ok) {
        toast.error("بارگذاری گروه‌ها با شکست مواجه شد.");
        console.error("Error fetching groups:", res.error);
        return;
      }
      const list = (res.data ?? []).map((g: any) => ({
        id: String(g.id ?? ""),
        name: g.name ?? "",
        createdAt: g.createdAt ?? g.created_at,
        updatedAt: g.updatedAt ?? g.updated_at,
      })) as UIGroup[];
      setGroups(list);
    } catch (error) {
      toast.error("بارگذاری گروه‌ها با شکست مواجه شد.");
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
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

  const handleDeleteGroup = async (id: string | number) => {
    if (window.confirm("آیا از حذف این گروه مطمئن هستید؟ مخاطبین مرتبط با این گروه حذف نمی‌شوند.")) {
      try {
        const delRes = await ContactService.deleteGroup(String(id));
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
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>مدیریت گروه‌ها</CardTitle>
        <div className="flex items-center gap-2">
          <Input
            placeholder="جست‌وجوی گروه..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-8 w-[200px]"
          />
          <AddGroupDialog onAddGroup={async (n) => handleAddGroup({ name: n })} onGroupAdded={fetchGroups} />
        </div>
      </CardHeader>
      <CardContent>
        <form className="flex gap-2 mb-4" onSubmit={form.handleSubmit(handleAddGroup)}>
          <Input
            placeholder="نام گروه جدید"
            {...form.register("name")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // allow form submit
              }
            }}
          />
          <Button type="submit" aria-label="افزودن گروه">
            <Plus size={18} className="ml-2" /> افزودن
          </Button>
        </form>

        {form.formState.errors.name ? (
          <p className="text-sm text-red-500 mb-4">{form.formState.errors.name.message}</p>
        ) : null}

        {loading ? (
          <div className="text-sm opacity-70">در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm opacity-70">گروهی یافت نشد. یک گروه جدید اضافه کنید!</div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((group) => (
              <div key={String(group.id)} className="glass p-3 rounded-lg flex justify-between items-center">
                <span className="font-medium">{group.name}</span>
                <Button variant="destructive" size="icon" onClick={() => handleDeleteGroup(String(group.id))}>
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}