import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type UIGroup = {
  id?: number | string;
  name: string;
};

type GroupsSectionProps = {
  groups: UIGroup[];
  onAddGroup: (groupName: string) => Promise<void>;
  onGroupsRefreshed: () => void;
};

export function GroupsSection({ groups, onAddGroup, onGroupsRefreshed }: GroupsSectionProps) {
  const { setValue, watch } = useFormContext();
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const selectedGroupId = watch('groupId');

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    
    try {
      setIsAddingGroup(true);
      await onAddGroup(newGroupName);
      setNewGroupName('');
      setIsAddGroupDialogOpen(false);
      onGroupsRefreshed();
    } catch (error) {
      console.error('Error adding group:', error);
    } finally {
      setIsAddingGroup(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">گروه‌ها</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddGroupDialogOpen(true)}
        >
          <Plus className="h-4 w-4 ml-1" />
          گروه جدید
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="group">انتخاب گروه</Label>
        <div className="flex gap-2">
          <Select
            value={selectedGroupId || ''}
            onValueChange={(value) => setValue('groupId', value || null)}
          >
            <SelectTrigger id="group" className="w-fit">
              <SelectValue placeholder="بدون گروه" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={String(group.id)}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedGroupId && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => setValue('groupId', null)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isAddGroupDialogOpen} onOpenChange={setIsAddGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>افزودن گروه جدید</DialogTitle>
            <DialogDescription>
              نام گروه جدید را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newGroupName">نام گروه</Label>
              <Input
                id="newGroupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="مثلا: دوستان"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddGroupDialogOpen(false)}
              disabled={isAddingGroup}
            >
              انصراف
            </Button>
            <Button
              type="button"
              onClick={handleAddGroup}
              disabled={!newGroupName.trim() || isAddingGroup}
            >
              {isAddingGroup ? 'در حال افزودن...' : 'افزودن گروه'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}