"use client";

import React from "react";
import { SettingsDialog } from "@/components/settings-dialog"; // Fixed import path
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface HeaderProps {
  onContactsRefreshed: () => void;
}

export function Header({ onContactsRefreshed }: HeaderProps) {
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-10 glass border-b border-border p-4 flex justify-between items-center shadow-sm">
      <h1 className="text-2xl font-bold text-foreground">مخاطبین منشور</h1>
      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={() => setIsSettingsDialogOpen(true)}>
          <Settings size={18} />
        </Button>
        <ThemeToggle />
      </div>
      <SettingsDialog
        isOpen={isSettingsDialogOpen}
        onOpenChange={setIsSettingsDialogOpen}
        onContactsRefreshed={onContactsRefreshed}
      />
    </header>
  );
}