// ===== IMPORTS & DEPENDENCIES =====
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ContactService } from "@/services/contact-service";
import { type Contact, type Group } from "@/database/db";
import { Tags, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

// ===== TYPES & INTERFACES =====
interface CategorizationResult {
  contactId: number;
  contactName: string;
  contactPhones: string;
  suggestedGroupId: number | null;
  suggestedGroupName: string;
  confidence: number;
  reasons: string[];
}

// ===== UTILITY FUNCTIONS =====
/**
 * Analyzes a single contact to suggest a group based on a set of rules.
 * This is a pure function, making it predictable and easy to test.
 */
const analyzeContactForGroup = (contact: Contact, availableGroups: Group[]): Omit<CategorizationResult, 'contactName' | 'contactPhones'> => {
  let bestSuggestion = { suggestedGroupId: null as number | null, confidence: 0, reasons: [] as string[] };

  const checkAndSetSuggestion = (groupId: number, confidence: number, reason: string) => {
    if (confidence > bestSuggestion.confidence) {
      bestSuggestion = { suggestedGroupId: groupId, confidence, reasons: [reason] };
    } else if (confidence === bestSuggestion.confidence && bestSuggestion.suggestedGroupId === groupId) {
      bestSuggestion.reasons.push(reason);
    }
  };

  if (contact.position) {
    const positionGroup = availableGroups.find(g => g.name.toLowerCase() === contact.position!.toLowerCase());
    if (positionGroup?.id) {
        checkAndSetSuggestion(positionGroup.id, 0.8, `سمت: ${contact.position}`);
    }
  }
  
  if (contact.notes) {
      availableGroups.forEach(group => {
          if (contact.notes!.toLowerCase().includes(group.name.toLowerCase())) {
              checkAndSetSuggestion(group.id!, 0.6, `یادداشت حاوی نام گروه`);
          }
      });
  }

  return { contactId: contact.id!, ...bestSuggestion };
};


// ===== CORE BUSINESS LOGIC (COMPONENT) =====
export function AIAutoCategorization() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [results, setResults] = useState<CategorizationResult[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [progress, setProgress] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [allContacts, allGroups] = await Promise.all([
        ContactService.getAllContacts(),
        ContactService.getAllGroups()
      ]);
      // Only suggest categories for contacts that are currently uncategorized
      setContacts(allContacts.filter(c => !c.groupId));
      setGroups(allGroups);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("خطا در بارگذاری داده‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAnalyzeAll = async () => {
    if (contacts.length === 0 || groups.length === 0) {
      toast.error("ابتدا مخاطبین بدون گروه و گروه‌ها را ایجاد کنید");
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResults([]);

    const CHUNK_SIZE = 50; // Process 50 contacts at a time
    const allResults: CategorizationResult[] = [];

    for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
      const chunk = contacts.slice(i, i + CHUNK_SIZE);
      
      const chunkResults = chunk
        .map(contact => {
          const analysis = analyzeContactForGroup(contact, groups);
          return {
              ...analysis,
              contactName: `${contact.firstName} ${contact.lastName || ''}`.trim(),
              contactPhones: contact.phoneNumbers.length > 0 ? contact.phoneNumbers[0].number : "بدون شماره",
              suggestedGroupName: analysis.suggestedGroupId ? (groups.find(g => g.id === analysis.suggestedGroupId)?.name || 'نامشخص') : 'بدون پیشنهاد'
          };
        })
        .filter(res => res.suggestedGroupId !== null); // Only keep contacts with a suggestion

      allResults.push(...chunkResults);
      
      // Update progress and yield to the main thread to prevent UI freezing
      setProgress(Math.round(((i + chunk.length) / contacts.length) * 100));
      await new Promise(resolve => setTimeout(resolve, 20)); // Small delay for UI updates
    }

    allResults.sort((a, b) => b.confidence - a.confidence);
    setResults(allResults);
    toast.success(`${allResults.length} پیشنهاد دسته‌بندی پیدا شد`);
    setProcessing(false);
  };
  
  const handleApplySuggestions = async () => {
    if (results.length === 0) return;
    
    setApplying(true);
    try {
      let appliedCount = 0;
      for (const result of results) {
        if (result.suggestedGroupId) {
          await ContactService.updateContact(result.contactId, { groupId: result.suggestedGroupId });
          appliedCount++;
        }
      }
      toast.success(`${appliedCount} مخاطب با موفقیت دسته‌بندی شد`);
      setResults([]);
      await fetchData(); // Refresh the list of uncategorized contacts
    } catch (error) {
      console.error("Error applying suggestions:", error);
      toast.error("خطا در اعمال پیشنهادات");
    } finally {
      setApplying(false);
    }
  };

  const filteredResults = results.filter(result =>
    result.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderContent = () => {
    if (processing) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium mb-4">در حال تحلیل هوشمند...</h3>
            <Progress value={progress} className="w-full max-w-sm mx-auto" />
            <p className="text-muted-foreground mt-2 text-sm">{progress}%</p>
          </CardContent>
        </Card>
      );
    }

    if (results.length > 0) {
      return (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>پیشنهادات دسته‌بندی</CardTitle>
                <CardDescription>{results.length} پیشنهاد برای مخاطبین بدون گروه یافت شد.</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="جستجوی نتایج..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {filteredResults.map((result) => (
                <div key={result.contactId} className="border rounded-lg p-4 bg-background hover:bg-muted/50 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                      <h4 className="font-semibold">{result.contactName}</h4>
                      <p className="text-sm text-muted-foreground">{result.contactPhones}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">گروه پیشنهادی</p>
                      <Badge variant="default">{result.suggestedGroupName}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">دلایل و اطمینان ({Math.round(result.confidence * 100)}%)</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.reasons.map((reason, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{reason}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">دسته‌بندی خودکار مخاطبین</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            موتور هوشمند ما مخاطبین بدون گروه شما را تحلیل کرده و بر اساس اطلاعاتی مانند شرکت یا سمت، بهترین گروه را پیشنهاد می‌دهد.
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Tags className="h-6 w-6" />
            دسته‌بندی خودکار مخاطبین
          </h2>
          <p className="text-muted-foreground">
            پیشنهاد هوشمند گروه برای مخاطبین دسته‌بندی نشده.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAnalyzeAll} disabled={processing || applying || contacts.length === 0}>
            <Sparkles className="h-4 w-4 ml-2" />
            {processing ? "در حال تحلیل..." : `تحلیل ${contacts.length} مخاطب`}
          </Button>
          {results.length > 0 && (
            <Button variant="default" onClick={handleApplySuggestions} disabled={applying || processing}>
              {applying ? "در حال اعمال..." : "اعمال همه پیشنهادات"}
            </Button>
          )}
        </div>
      </div>
      {renderContent()}
    </div>
  );
}