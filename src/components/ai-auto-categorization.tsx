"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ContactService } from "@/services/contact-service";
import { type Contact, type Group } from "@/database/db";
import { 
  Tags, 
  Search, 
  Sparkles, 
  CheckCircle,
  User,
  Building2,
  Briefcase,
  Phone
} from "lucide-react";
import { toast } from "sonner";

interface CategorizationResult {
  contactId: number;
  suggestedGroupId: number | null;
  confidence: number;
  reasons: string[];
}

export function AIAutoCategorization() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [results, setResults] = useState<CategorizationResult[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allContacts, allGroups] = await Promise.all([
          ContactService.getAllContacts(),
          ContactService.getAllGroups()
        ]);
        setContacts(allContacts);
        setGroups(allGroups);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("خطا در بارگذاری داده‌ها");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const analyzeContact = (contact: Contact, availableGroups: Group[]): CategorizationResult => {
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

    // Check phone-based groups (for regional groups)
    if (contact.phoneNumbers.length > 0) {
      const phone = contact.phoneNumbers[0].number;
      const phoneGroups = availableGroups.filter(g => {
        // Simple check for area codes in group names
        return g.name.includes("۰۲۱") && phone.startsWith("021");
      });
      
      if (phoneGroups.length > 0 && bestConfidence < 0.6) {
        bestGroupId = phoneGroups[0].id;
        bestConfidence = 0.6;
        reasons.push("کد شهری");
      }
    }

    return {
      contactId: contact.id,
      suggestedGroupId: bestGroupId,
      confidence: bestConfidence,
      reasons
    };
  };

  const handleAnalyzeAll = async () => {
    if (contacts.length === 0 || groups.length === 0) {
      toast.error("ابتدا مخاطبین و گروه‌ها را ایجاد کنید");
      return;
    }

    setProcessing(true);
    try {
      const analysisResults: CategorizationResult[] = [];
      
      for (const contact of contacts) {
        const result = analyzeContact(contact, groups);
        analysisResults.push(result);
      }
      
      // Sort by confidence (highest first)
      analysisResults.sort((a, b) => b.confidence - a.confidence);
      setResults(analysisResults);
      toast.success(`${analysisResults.length} مخاطب تحلیل شد`);
    } catch (error) {
      console.error("Error analyzing contacts:", error);
      toast.error("خطا در تحلیل مخاطبین");
    } finally {
      setProcessing(false);
    }
  };

  const handleApplySuggestions = async () => {
    if (results.length === 0) return;
    
    setApplying(true);
    try {
      let appliedCount = 0;
      
      for (const result of results) {
        if (result.suggestedGroupId !== null) {
          await ContactService.updateContact(result.contactId, {
            groupId: result.suggestedGroupId
          });
          appliedCount++;
        }
      }
      
      toast.success(`${appliedCount} مخاطب دسته‌بندی شد`);
      setResults([]);
    } catch (error) {
      console.error("Error applying suggestions:", error);
      toast.error("خطا در اعمال پیشنهادات");
    } finally {
      setApplying(false);
    }
  };

  const filteredResults = results.filter(result =>
    contacts.find(c => c.id === result.contactId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Tags className="h-6 w-6" />
            دسته‌بندی خودکار مخاطبین
          </h2>
          <p className="text-muted-foreground">
            پیشنهاد گروه‌بندی مخاطبین با استفاده از هوش مصنوعی
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleAnalyzeAll}
            disabled={processing || contacts.length === 0}
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                در حال تحلیل...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 ml-2" />
                تحلیل همه مخاطبین
              </>
            )}
          </Button>
          
          {results.length > 0 && (
            <Button
              variant="default"
              onClick={handleApplySuggestions}
              disabled={applying}
            >
              {applying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  در حال اعمال...
                </>
              ) : (
                "اعمال پیشنهادات"
              )}
            </Button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">تحلیل دسته‌بندی مخاطبین</h3>
            <p className="text-muted-foreground mb-4">
              با کلیک بر روی دکمه "تحلیل همه مخاطبین" می‌توانید پیشنهادات دسته‌بندی را دریافت کنید
            </p>
            <Button
              onClick={handleAnalyzeAll}
              disabled={processing || contacts.length === 0}
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  در حال تحلیل...
                </>
              ) : (
                "تحلیل همه مخاطبین"
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>پیشنهادات دسته‌بندی</CardTitle>
                <CardDescription>
                  {results.length} مخاطب با پیشنهادات دسته‌بندی
                </CardDescription>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="جستجوی مخاطبین..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {filteredResults.map((result) => {
                const contact = contacts.find(c => c.id === result.contactId);
                const group = groups.find(g => g.id === result.suggestedGroupId);
                
                if (!contact) return null;
                
                return (
                  <div 
                    key={result.contactId} 
                    className="border rounded-lg p-4 bg-background hover:bg-muted/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div>
                            <h4 className="font-semibold">{contact.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {contact.phoneNumbers.length > 0 
                                ? contact.phoneNumbers[0].number 
                                : "شماره‌ای ثبت نشده"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium">گروه پیشنهادی</p>
                            {group ? (
                              <Badge variant="default">{group.name}</Badge>
                            ) : (
                              <Badge variant="secondary">بدون گروه</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium">میزان اطمینان</p>
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${result.confidence * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium w-12">
                                {Math.round(result.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex flex-wrap gap-1">
                          {result.reasons.map((reason, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}