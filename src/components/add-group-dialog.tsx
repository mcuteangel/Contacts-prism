"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGroupSchema, type CreateGroupInput } from "@/domain/schemas/group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddGroupDialogProps {
  onAddGroup: (groupName: string) => Promise<void>;
  onGroupAdded: () => void; // Callback to refresh groups in parent
}

export function AddGroupDialog({ onAddGroup, onGroupAdded }: AddGroupDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: "" },
  });

  const handleAdd: (values: CreateGroupInput) => Promise<void> = async (values) => {
    const parsed = createGroupSchema.safeParse(values);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "ورودی نامعتبر است";
      toast.error(msg);
      return;
    }
    try {
      await onAddGroup(parsed.data.name.trim());
      toast.success("گروه با موفقیت اضافه شد!");
      form.reset({ name: "" });
      setIsOpen(false); // Close dialog
      onGroupAdded(); // Notify parent to refresh groups
    } catch (error) {
      toast.error("افزودن گروه با شکست مواجه شد.");
      console.error("Error adding group:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) form.reset({ name: "" }); }}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="icon">
          <Plus size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[300px] glass">
        <DialogHeader>
          <DialogTitle>افزودن گروه جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleAdd)} className="grid gap-4 py-4">
          <Input
            id="new-group-name"
            placeholder="نام گروه"
            {...form.register("name")}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.form?.requestSubmit();
                e.preventDefault();
              }
            }}
          />
          <DialogFooter>
            <Button type="submit">افزودن</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}