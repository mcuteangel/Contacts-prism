"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ContactService } from "@/services/contact-service";
import { type Contact, type Group } from "@/database/db";
import { Brain, RefreshCw, Tag, Users, Building2, Phone } from "lucide-react";

interface CategorizationSuggestion {
  contactId: number;
  contactName: string;
  suggestedGroup: string;
  confidence: number;
  reasons: string[];
}

export function AIAutoCategorization() {
  const [suggestions, setSuggestions] = useState<CategorizationSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const allGroups = await ContactService.getAllGroups();
      setGroups(allGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const analyzeAndCategorize = async () => {
    setIsAnalyzing(true);
    try {
      const contacts = await ContactService.getAllContacts();
      const newSuggestions: CategorizationSuggestion[] = [];

      for (const contact of contacts) {
        if (!contact.groupId) { // Only categorize contacts without groups
          const suggestion = suggestGroupForContact(contact);
          if (suggestion.confidence > 0.6) {
            newSuggestions.push(suggestion);
          }
        }
      }

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error("Error categorizing contacts:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const suggestGroupForContact = (contact: Contact): CategorizationSuggestion => {
    let bestGroup = "عمومی";
    let bestConfidence = 0;
    const reasons: string[] = [];

    // Check company-based groups
    if (contact.company) {
      const companyGroup = groups.find(g => 
        g.name.toLowerCase().includes(contact.company!.toLowerCase())
      );
      if (companyGroup) {
        bestGroup = companyGroup.name;
        bestConfidence = 0.9;
        reasons.push(`شرکت: ${contact.company}`);
      }
    }

    // Check position-based groups
    if (contact.position) {
      const positionGroup = groups.find(g => 
        g.name.toLowerCase().includes(contact.position!.toLowerCase())
      );
      if (positionGroup && bestConfidence < 0.8) {
        bestGroup = positionGroup.name;
        bestConfidence = 0.8;
        reasons.push(`سمت: ${contact.position}`);
      }
    }

    // Check phone number patterns
    if (contact.phoneNumbers.some(pn => pn.type === 'Work')) {
      const workGroup = groups.find(g => g.name.toLowerCase().includes('کار'));
      if (workGroup && bestConfidence < 0.7) {
        bestGroup = workGroup.name;
        bestConfidence = 0.7;
        reasons.push("شماره کاری");
      }
    }

    // Check phone number patterns for mobile
    if (contact.phoneNumbers.some(pn => pn.type === 'Mobile')) {
      const mobileGroup = groups.find(g => g.name.toLowerCase().includes('موبایل'));
      if (mobileGroup && bestConfidence < 0.6) {
        bestGroup = mobileGroup.name;
        bestConfidence = 0.6;
        reasons.push("شماره موبایل");
      }
    }

    return {
      contactId: contact.id!,
      contactName: `${contact.firstName} ${contact.lastName}`,
      suggestedGroup: bestGroup,
      confidence: bestConfidence,
      reasons
    };
  };

  const toggleSuggestionSelection = (contactId: number) => {
    const newSelected = new Set(selectedSuggestions);
    const key = `contact-${contactId}`;
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedSuggestions(newSelected);
  };

  const applySelectedSuggestions = async () => {
    for (const contactId of selectedSuggestions.keys().map(key => parseInt(key.split('-')[1]))) {
      const suggestion = suggestions.find(s => s.contactId === contactId);
      if (suggestion) {
        try {
          const targetGroup = groups.find(g => g.name === suggestion.suggestedGroup);
          if (targetGroup) {
            await ContactService.updateContact(contactId, { groupId: targetGroup.id });
          }
        } catch (error) {
          console.error(`Error categorizing contact ${contactId}:`, error);
        }
      }
    }
    
    setSelectedSuggestions(new Set());
    await analyzeAndCategorize(); // Refresh suggestions
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary-foreground">دسته‌بندی خودکار مخاطبین</h1>
        <Button onClick={analyzeAndCategorize} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Brain className="mr-2 h-4 w-4" />
          )}
          {isAnalyzing ? "در حال تحلیل..." : "تحلیل و دسته‌بندی"}
        </Button>
      </div>

      <Alert className="mb-6">
        <Brain className="h-4 w-4" />
        <AlertDescription>
          این قابلیت به صورت خودکار مخاطبین بدون گروه را بر اساس اطلاعات شغلی، شرکت و شماره تلفن دسته‌بندی می‌کند.
          پیشنهادات بر اساس الگوهای موجود در گروه‌های شما ایجاد می‌شوند.
        </AlertDescription>
      </Alert>

      {suggestions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Tag className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-lg font-semibold">هیچ پیشنهادی برای دسته‌بندی وجود ندارد</h3>
              <p className="text-muted-foreground">
                همه مخاطبین شما در گروه‌های مناسب قرار دارند یا گروهی برای دسته‌بندی وجود ندارد.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => {
            const isSelected = selectedSuggestions.has(`contact-${suggestion.contactId}`);
            const targetGroup = groups.find(g => g.name === suggestion.suggestedGroup);

            return (
              <Card key={index} className={isSelected ? "ring-2 ring-primary" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {suggestion.contactName}
                      </CardTitle>
                      <CardDescription>
                        پیشنهاد گروه: {suggestion.suggestedGroup} 
                        <Badge variant="outline" className="ml-2">
                          {(suggestion.confidence * 100).toFixed(0)}% اطمینان
                        </Badge>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSuggestionSelection(suggestion.contactId)}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1">دلایل پیشنهاد:</h4>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.reasons.map((reason, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>گروه فعلی: ندارد</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        <span>گروه پیشنهادی: {targetGroup?.name || suggestion.suggestedGroup}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {selectedSuggestions.size > 0 && (
            <div className="flex justify-end gap-2">
              <Alert>
                <Tag className="h-4 w-4" />
                <AlertDescription>
                  {selectedSuggestions.size} مخاطب برای دسته‌بندی انتخاب شده‌اند.
                </AlertDescription>
              </Alert>
              <Button onClick={applySelectedSuggestions}>
                اعمال دسته‌بندی برای {selectedSuggestions.size} مخاطب
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}