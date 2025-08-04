"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Download, Upload } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface ContactListHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAddContactClick: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ContactListHeader({
  searchTerm,
  onSearchChange,
  onAddContactClick,
  onExport,
  onImport,
}: ContactListHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <Input
          type="text"
          placeholder="جستجوی مخاطبین..."
          className="pl-10 pr-4 py-2 w-full rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
      </div>
      <div className="flex gap-2">
        <Button className="flex items-center gap-2" onClick={onAddContactClick}>
          <Plus size={18} /> افزودن مخاطب
        </Button>
        <Button onClick={onExport} variant="outline" className="flex items-center gap-2">
          <Download size={18} /> خروجی
        </Button>
        <Input
          id="import-file"
          type="file"
          accept=".json"
          onChange={onImport}
          className="hidden"
        />
        <Label htmlFor="import-file" className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer">
          <Upload size={18} /> ورودی
        </Label>
      </div>
    </div>
  );
}