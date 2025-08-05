"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Search,
  Filter,
  Zap,
  Tag,
  Building2
} from "lucide-react";
import { ContactService } from "@/services/contact-service";
import { type Contact, type Group } from "@/database/db";

interface CategorizationResult {
  contactId: number;
  suggestedGroupId: number | null;
  confidence: number;
  reasons: string[];
}

export function AIContactCategorization() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [results, setResults] = useState<CategorizationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allContacts, allGroups] = await Promise.all([
        ContactService.getAllContacts(),
        ContactService.getAllGroups()
      ]);
      setContacts(allContacts);
      setGroups(allGroups);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const categorizeContacts = async () => {
    setLoading(true);
    try {
      const categorizationResults: CategorizationResult[] = [];
      
      for (const contact of contacts) {
        const result = suggestCategorization(contact, groups);
        categorizationResults.push(result);
      }
      
      setResults(categorizationResults);
    } catch (error) {
      console.error("Error categorizing contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const suggestCategorization = (contact: Contact, availableGroups: Group[]): CategorizationResult => {
    let bestGroupId: number | null = null;
    let bestConfidence = 0;
    const reasons: string[] = [];

    // Check name-based groups
    if (contact.name) {
      const nameGroups = availableGroups.filter(g =>
        contact.name!.toLowerCase().includes(g.name.toLowerCase())
      );
      
      if (nameGroups.length > 0) {
        bestGroupId = nameGroups[0].id;
        bestConfidence = 0.7;
        reasons.push(`نام: ${contact.name}`);
      }
    }

    // Check company-based groups
    if (contact.company) {
      const companyGroup = availableGroups.find(g =>
        g.name.toLowerCase().includes(contact.company!.toLowerCase())
      );
      
      if (companyGroup) {
        bestGroupId = companyGroup.id;
        bestConfidence = 0.9;
        reasons.push(`شرکت: ${contact.company}`);
      }
    }

    // Check position-based groups
    if (contact.position) {
      const positionGroups = availableGroups.filter(g =>
        contact.position!.toLowerCase().includes(g.name.toLowerCase())
      );
      
      if (positionGroups.length > 0 && bestConfidence < 0.8) {
        bestGroupId = positionGroups[0].id;
        bestConfidence = 0.8;
        reasons.push(`سمت: ${contact.position}`);
      }
    }

    // Check phone number patterns
    if (contact.phoneNumbers.length > 0) {
      const phoneGroups = availableGroups.filter(g =>
        contact.phoneNumbers.some(p => p.number.includes(g.name))
      );
      
      if (phoneGroups.length > 0 && bestConfidence < 0.6) {
        bestGroupId = phoneGroups[0].id;
        bestConfidence = 0.6;
        reasons.push(`شماره تلفن: ${contact.phoneNumbers[0].number}`);
      }
    }

    return {
      contactId: contact.id,
      suggestedGroupId: bestGroupId,
      confidence: bestConfidence,
      reasons
    };
  };

  const applyCategorization = async () => {
    if (selectedGroupId === null) return;

    setLoading(true);
    try {
      for (const result of results) {
        if (result.suggestedGroupId === selectedGroupId) {
          await ContactService.updateContact(result.contactId, { groupId: selectedGroupId });
        }
      }
      
      // Refresh contacts
      await loadData();
      setResults([]);
    } catch (error) {
      console.error("Error applying categorization:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(result =>
    contacts.find(c => c.id === result.contactId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap size={20} />
            دسته‌بندی خودکار هوش مصنوعی
          </CardTitle>
          <CardDescription>
            با هوش مصنوعی مخاطبان را به گروه‌های مناسب دسته‌بندی کنید
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="جستجوی مخاطبان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={categorizeContacts} disabled={loading}>
              <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              دسته‌بندی خودکار
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {results.length} مخاطب برای دسته‌بندی یافت شد
            </CardTitle>
            <CardDescription>
              گروه مورد نظر را انتخاب و تغییرات را اعمال کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">گروه مقصد:</label>
              <select
                value={selectedGroupId || ''}
                onChange={(e) => setSelectedGroupId(Number(e.target.value) || null)}
                className="w-full p-2 border rounded"
              >
                <option value="">گروه را انتخاب کنید</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredResults.map((result) => {
                const contact = contacts.find(c => c.id === result.contactId);
                if (!contact) return null;

                return (
                  <div key={result.contactId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold">{contact.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {result.confidence * 100}% اطمینان
                        </p>
                      </div>
                      <Badge variant={result.confidence > 0.7 ? "default" : "secondary"}>
                        {result.confidence * 100}% شباهت
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-medium">دلایل پیشنهاد:</h5>
                      <div className="flex flex-wrap gap-2">
                        {result.reasons.map((reason, index) => (
                          <Badge key={index} variant="outline">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {result.suggestedGroupId && (
                      <div className="mt-4">
                        <p className="text-sm">
                          پیشنهاد: <span className="font-medium">
                            {groups.find(g => g.id === result.suggestedGroupId)?.name}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedGroupId && (
              <div className="mt-6 flex justify-end">
                <Button onClick={applyCategorization} disabled={loading}>
                  <CheckCircle size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                  اعمال دسته‌بندی به {filteredResults.length} مخاطب
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}