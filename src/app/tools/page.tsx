"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { ContactService } from "@/services/contact-service";

export default function ToolsPage() {
  const handleExport = async () => {
    try {
      const json = await ContactService.exportContacts();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'prism_contacts_backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("مخاطبین با موفقیت خروجی گرفته شدند!");
    } catch (error) {
      toast.error("خروجی گرفتن از مخاطبین با شکست مواجه شد.");
      console.error("Error exporting contacts:", error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonString = e.target?.result as string;
          await ContactService.importContacts(jsonString);
          toast.success("مخاطبین با موفقیت ورودی گرفته شدند!");
          // No direct refresh needed here, as the contacts page will re-fetch on mount
        } catch (error) {
          toast.error("ورودی گرفتن از مخاطبین با شکست مواجه شد. لطفاً از معتبر بودن فایل JSON اطمینان حاصل کنید.");
          console.error("Error importing contacts:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-3xl font-bold text-primary-foreground mb-6">ابزار</h1>
      <div className="grid gap-4 py-4 w-full max-w-sm">
        <div className="flex flex-col gap-2">
          <Label className="text-right">پشتیبان‌گیری و بازیابی</Label>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" className="flex-grow flex items-center gap-2">
              <Download size={18} /> خروجی
            </Button>
            <Input
              id="import-file-tools"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Label htmlFor="import-file-tools" className="flex-grow flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer">
              <Upload size={18} /> ورودی
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}