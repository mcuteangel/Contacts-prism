"use client";

import React, { useState } from "react";
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
  const [newGroupName, setNewGroupName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = async () => {
    if (!newGroupName.trim()) {
      toast.error("نام گروه نمی‌تواند خالی باشد.");
      return;
    }
    try {
      await onAddGroup(newGroupName);
      setNewGroupName(""); // Clear input
      setIsOpen(false); // Close dialog
      onGroupAdded(); // Notify parent to refresh groups
    } catch (error) {
      toast.error("افزودن گروه با شکست مواجه شد.");
      console.error("Error adding group:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="icon">
          <Plus size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[300px] glass">
        <DialogHeader>
          <DialogTitle>افزودن گروه جدید</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="new-group-name"
            placeholder="نام گروه"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAdd();
                e.preventDefault();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleAdd}>افزودن</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}