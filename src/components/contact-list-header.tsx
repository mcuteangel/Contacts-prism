"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ContactListHeaderProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export function ContactListHeader({
  searchTerm,
  onSearchChange,
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
    </div>
  );
}