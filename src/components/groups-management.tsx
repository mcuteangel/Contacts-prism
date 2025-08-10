"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ContactService } from "@/services/contact-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroupSchema, type CreateGroupInput } from "@/domain/schemas/group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddGroupDialog } from "./add-group-dialog";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { ErrorManager } from "@/lib/error-manager";
import type { GroupUI as UIGroup } from "@/domain/ui-types";

export function GroupsManagement() {
  const [groups, setGroups] = useState<UIGroup[]>([]);
  const [filter, setFilter] = useState("");
  
  // استفاده از هوک مدیریت خطای پیشرفته
  const {
    isLoading: loading,
    error,
    errorMessage,
    retryCount,
    retry,
    executeAsync,
    setError
  } = useErrorHandler(null, {
    maxRetries: 3,
    retryDelay: 1000,
    showToast: true,
    customErrorMessage: "خطایی در مدیریت گروه‌ها رخ داد",
    onError: (error) => {
      ErrorManager.logError(error, {
        component: 'GroupsManagement',
        action: 'groupsOperation',
        metadata: { 
          operation: error.message.includes('دریافت') ? 'fetch' : 
                   error.message.includes('افزودن') ? 'add' : 
                   error.message.includes('حذف') ? 'delete' : 'unknown'
        }
      });
    }
  });


  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return groups;
    return groups.filter((g) => g.name?.toLowerCase().includes(f));
  }, [groups, filter]);

  const fetchGroups = async () => {
    await executeAsync(async () => {
      const res = await ContactService.getAllGroups();
      if (!res.ok) {
        throw new Error(res.error || "خطا در دریافت لیست گروه‌ها");
      }
      const list = (res.data ?? []).map((g: any) => ({
        id: String(g.id ?? ""),
        name: g.name ?? "",
        createdAt: g.createdAt ?? g.created_at,
        updatedAt: g.updatedAt ?? g.updated_at,
      })) as UIGroup[];
      setGroups(list);
    }, {
      component: "GroupsManagement",
      action: "fetchGroups"
    });
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroup = async (name: string) => {
    await executeAsync(async () => {
      const res = await ContactService.addGroup(name.trim());
      if (!res.ok) {
        throw new Error(res.error || "خطا در افزودن گروه");
      }
      await fetchGroups();
      
      // نمایش پیام موفقیت
      ErrorManager.notifyUser("گروه با موفقیت اضافه شد!", "success");
      
      // گزارش موفقیت‌آمیز بودن عملیات
      ErrorManager.logError(new Error(`Group added: ${name}`), {
        component: 'GroupsManagement',
        action: 'addGroup',
        metadata: { groupName: name }
      });
    }, {
      component: "GroupsManagement",
      action: "addGroup",
      metadata: { groupName: name }
    });
  };

  const handleDeleteGroup = async (id: string | number) => {
    const groupToDelete = groups.find(g => String(g.id) === String(id));
    if (!groupToDelete) {
      setError(new Error("گروه مورد نظر یافت نشد"), {
        component: "GroupsManagement",
        action: "deleteGroup",
        metadata: { groupId: id }
      });
      return;
    }
    
    if (!window.confirm(`آیا از حذف گروه "${groupToDelete.name}" مطمئن هستید؟ مخاطبین مرتبط با این گروه حذف نمی‌شوند.`)) {
      return;
    }
    
    await executeAsync(async () => {
      const res = await ContactService.deleteGroup(String(id));
      if (!res.ok) {
        throw new Error(res.error || `خطا در حذف گروه ${groupToDelete.name}`);
      }
      await fetchGroups();
      
      // نمایش پیام موفقیت
      ErrorManager.notifyUser(`گروه "${groupToDelete.name}" با موفقیت حذف شد!`, "success");
      
      // گزارش موفقیت‌آمیز بودن عملیات
      ErrorManager.logError(new Error(`Group deleted: ${groupToDelete.name} (${id})`), {
        component: 'GroupsManagement',
        action: 'deleteGroup',
        metadata: { groupId: id, groupName: groupToDelete.name }
      });
    }, {
      component: "GroupsManagement",
      action: "deleteGroup",
      metadata: { 
        groupId: id,
        groupName: groupToDelete.name
      }
    });
  };

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CardTitle>مدیریت گروه‌ها</CardTitle>
          {error && (
            <div className="text-sm text-destructive flex items-center gap-2">
              <span>{errorMessage}</span>
              {retryCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={retry}
                  disabled={loading}
                  className="text-destructive hover:bg-destructive/10"
                >
                  تلاش مجدد ({retryCount} از ۳)
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="جست‌وجوی گروه..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-8 w-[200px]"
          />
          <AddGroupDialog onAddGroup={async (name: string) => handleAddGroup(name)} onGroupAdded={fetchGroups} />
        </div>
      </CardHeader>
      <CardContent>

        {loading ? (
          <div className="text-sm opacity-70">در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm opacity-70">گروهی یافت نشد. یک گروه جدید اضافه کنید!</div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((group: UIGroup) => (
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