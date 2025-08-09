// Types for nested groups functionality
import type { GroupUI } from "./ui-types";

export interface NestedGroupUI extends GroupUI {
  children?: NestedGroupUI[];
  parentId?: string | number;
  level?: number;
  path?: string[];
  expanded?: boolean;
}

export interface GroupHierarchyItem {
  id: string | number;
  name: string;
  children?: GroupHierarchyItem[];
  parentId?: string | number;
  level?: number;
}

export interface GroupDragDropItem {
  id: string | number;
  type: 'group';
  name: string;
  parentId?: string | number;
  level?: number;
}

export interface GroupReorderData {
  groupId: string | number;
  newParentId?: string | number;
  index?: number;
}