"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ContactService } from "@/services/contact-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, FolderPlus, FolderOpen, Folder, ChevronRight, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroupSchema, type CreateGroupInput } from "@/domain/schemas/group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddGroupDialog } from "./add-group-dialog";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { ErrorManager } from "@/lib/error-manager";
import type { NestedGroupUI, GroupHierarchyItem } from "@/domain/nested-group-types";
import { useDragDrop } from "@/hooks/use-drag-drop";

export function NestedGroupsManagement() {
  const [groups, setGroups] = useState<NestedGroupUI[]>([]);
  const [filter, setFilter] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string | number>>(new Set());
  
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
        component: 'NestedGroupsManagement',
        action: 'groupsOperation',
        metadata: { 
          operation: error.message.includes('دریافت') ? 'fetch' : 
                   error.message.includes('افزودن') ? 'add' : 
                   error.message.includes('حذف') ? 'delete' : 'unknown'
        }
      });
    }
  });

  // Drag and drop functionality
  const dragDrop = useDragDrop({
    onReorder: (fromId, toId) => {
      console.log('Reordering groups:', fromId, 'to', toId);
      // TODO: Implement group reordering logic
    },
    onMoveToGroup: (groupId, newParentId) => {
      console.log('Moving group', groupId, 'to parent', newParentId);
      // TODO: Implement move to parent group logic
    },
  });

  // RHF setup for adding a group via inline form
  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: "", parentId: undefined },
    mode: "onChange",
  });

  // Convert flat groups to hierarchical structure
  const buildHierarchy = (flatGroups: NestedGroupUI[]): NestedGroupUI[] => {
    const groupMap = new Map<string | number, NestedGroupUI>();
    const rootGroups: NestedGroupUI[] = [];

    // First pass: create map of all groups
    flatGroups.forEach(group => {
      groupMap.set(group.id!, { ...group, children: [], expanded: false });
    });

    // Second pass: build hierarchy
    flatGroups.forEach(group => {
      const currentGroup = groupMap.get(group.id!)!;
      
      if (group.groupId) {
        // This group has a parent
        const parentGroup = groupMap.get(group.groupId);
        if (parentGroup) {
          parentGroup.children!.push(currentGroup);
          currentGroup.parentId = group.groupId;
          currentGroup.level = (parentGroup.level || 0) + 1;
          currentGroup.path = [...(parentGroup.path || []), parentGroup.id!];
        }
      } else {
        // This is a root group
        rootGroups.push(currentGroup);
        currentGroup.level = 0;
        currentGroup.path = [currentGroup.id!];
      }
    });

    return rootGroups;
  };

  const filteredGroups = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return groups;
    
    const filterRecursive = (groupList: NestedGroupUI[]): NestedGroupUI[] => {
      return groupList.filter(group => {
        const matches = group.name?.toLowerCase().includes(f);
        if (matches) return true;
        
        if (group.children) {
          const filteredChildren = filterRecursive(group.children);
          if (filteredChildren.length > 0) {
            group.children = filteredChildren;
            return true;
          }
        }
        
        return false;
      });
    };
    
    return filterRecursive(groups);
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
        groupId: g.groupId,
        createdAt: g.createdAt ?? g.created_at,
        updatedAt: g.updatedAt ?? g.updated_at,
      })) as NestedGroupUI[];
      
      const hierarchy = buildHierarchy(list);
      setGroups(hierarchy);
    }, {
      component: "NestedGroupsManagement",
      action: "fetchGroups"
    });
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleAddGroup = async (values: CreateGroupInput) => {
    const parsed = createGroupSchema.safeParse(values);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? "نام گروه نامعتبر است.";
      setError(new Error(first), { 
        component: "NestedGroupsManagement", 
        action: "validateAddGroup",
        metadata: { groupName: values.name }
      });
      return;
    }
    const name = parsed.data.name.trim();
    const parentId = parsed.data.parentId;
    
    await executeAsync(async () => {
      const res = await ContactService.addGroup(name, parentId ? String(parentId) : undefined);
      if (!res.ok) {
        throw new Error(res.error || "خطا در افزودن گروه");
      }
      form.reset({ name: "", parentId: undefined });
      await fetchGroups();
      
      // نمایش پیام موفقیت
      ErrorManager.notifyUser("گروه با موفقیت اضافه شد!", "success");
      
      // گزارش موفقیت‌آمیز بودن عملیات
      ErrorManager.logError(new Error(`Group added: ${name}`), {
        component: 'NestedGroupsManagement',
        action: 'addGroup',
        metadata: { groupName: name, parentId }
      });
    }, {
      component: "NestedGroupsManagement",
      action: "addGroup",
      metadata: { groupName: name, parentId }
    });
  };

  const handleDeleteGroup = async (id: string | number) => {
    const groupToDelete = findGroupById(groups, id);
    if (!groupToDelete) {
      setError(new Error("گروه مورد نظر یافت نشد"), {
        component: "NestedGroupsManagement",
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
        component: 'NestedGroupsManagement',
        action: 'deleteGroup',
        metadata: { groupId: id, groupName: groupToDelete.name }
      });
    }, {
      component: "NestedGroupsManagement",
      action: "deleteGroup",
      metadata: { 
        groupId: id,
        groupName: groupToDelete.name
      }
    });
  };

  const findGroupById = (groupList: NestedGroupUI[], id: string | number): NestedGroupUI | null => {
    for (const group of groupList) {
      if (group.id === id) return group;
      if (group.children) {
        const found = findGroupById(group.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleExpand = (groupId: string | number) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const renderGroup = (group: NestedGroupUI, level: number = 0) => {
    const isExpanded = expandedGroups.has(group.id!);
    const hasChildren = group.children && group.children.length > 0;
    const paddingLeft = level * 20;

    return (
      <div key={String(group.id)} className="w-full">
        <div 
          className="glass p-3 rounded-lg flex justify-between items-center hover:bg-muted/50 transition-colors cursor-pointer group"
          style={{ marginLeft: `${paddingLeft}px` }}
          onClick={() => hasChildren && toggleExpand(group.id!)}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasChildren && (
              <div className="text-muted-foreground">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            )}
            {!hasChildren && <div className="w-4" />}
            <div className="flex items-center gap-2">
              {hasChildren ? (
                isExpanded ? <FolderOpen size={18} className="text-blue-500" /> : <Folder size={18} className="text-blue-500" />
              ) : <FolderPlus size={18} className="text-gray-400" />}
              <span className="font-medium">{group.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={(e) => {
              e.stopPropagation();
              handleDeleteGroup(String(group.id));
            }}>
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {group.children!.map(child => renderGroup(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CardTitle>مدیریت گروه‌های تودرتو</CardTitle>
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
          <AddGroupDialog 
            onAddGroup={async (n, p) => handleAddGroup({ name: n, parentId: p })} 
            onGroupAdded={fetchGroups} 
          />
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
        ) : filteredGroups.length === 0 ? (
          <div className="text-sm opacity-70">گروهی یافت نشد. یک گروه جدید اضافه کنید!</div>
        ) : (
          <div className="space-y-1">
            {filteredGroups.map(group => renderGroup(group))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}