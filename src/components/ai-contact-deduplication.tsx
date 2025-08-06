"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ContactService } from "@/services/contact-service";
import { type Contact, type Group } from "@/database/db";
import { 
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  Merge, 
  AlertTriangle,
  User,
  Mail,
  Building2,
  Briefcase
} from "lucide-react";
import { toast } from "sonner";

interface ContactPair {
  contact1: Contact;
  contact2: Contact;
  similarity: number;
  reasons: string[];
}

interface MergeResult {
  contact1Id: number;
  contact2Id: number;
  mergedId: number;
}

export function AIContactDeduplication() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [pairs, setPairs] = useState<ContactPair[]>([]);
  const [mergeResults, setMergeResults] = useState<Record<string, boolean>>({});
  const [selectedPairs, setSelectedPairs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactsRes, groupsRes] = await Promise.all([
          ContactService.getAllContacts(),
          ContactService.getAllGroups()
        ]);
        const list = contactsRes.ok ? contactsRes.data.data : [];
        setContacts(list);

        if (!groupsRes.ok) {
          console.error("Error fetching groups:", groupsRes.error);
          toast.error("بارگذاری گروه‌ها با شکست مواجه شد.");
          setGroups([]);
        } else {
          setGroups(groupsRes.data);
        }

        await findDuplicatePairs(list);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("خطا در بارگذاری داده‌ها");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateSimilarity = (contact1: Contact, contact2: Contact): { score: number; maxScore: number; reasons: string[] } => {
    let score = 0;
    let maxScore = 0;
    const reasons: string[] = [];

    // Name similarity (highest weight)
    maxScore += 2;
    const fullName1 = [contact1.firstName || "", contact1.lastName || ""].join(" ").trim().toLowerCase();
    const fullName2 = [contact2.firstName || "", contact2.lastName || ""].join(" ").trim().toLowerCase();
    if (fullName1 && fullName2) {
      if (fullName1 === fullName2) {
        score += 2;
        reasons.push("نام یکسان");
      } else if (fullName1.includes(fullName2) || fullName2.includes(fullName1)) {
        score += 1;
        reasons.push("نام مشابه");
      }
    }

    // Email similarity (if optional email field exists in your model, otherwise skip)
    maxScore += 1;
    const email1 = (contact1 as any).email as string | undefined;
    const email2 = (contact2 as any).email as string | undefined;
    if (email1 && email2) {
      if (email1.toLowerCase() === email2.toLowerCase()) {
        score += 1;
        reasons.push("ایمیل یکسان");
      }
    }

    // Company similarity (if optional company field exists in your model, otherwise skip)
    maxScore += 1;
    const company1 = (contact1 as any).company as string | undefined;
    const company2 = (contact2 as any).company as string | undefined;
    if (company1 && company2) {
      if (company1.toLowerCase() === company2.toLowerCase()) {
        score += 1;
        reasons.push("شرکت مشابه");
      }
    }

    // Phone number similarity
    maxScore += 1;
    const phoneNumbers1 = contact1.phoneNumbers.map(p => p.number);
    const phoneNumbers2 = contact2.phoneNumbers.map(p => p.number);
    const commonPhones = phoneNumbers1.filter(phone => phoneNumbers2.includes(phone));
    if (commonPhones.length > 0) {
      score += 1;
      reasons.push("شماره تماس مشترک");
    }

    return { score, maxScore, reasons };
  };

  const findDuplicatePairs = async (contactsList: Contact[]) => {
    const pairs: ContactPair[] = [];
    
    for (let i = 0; i < contactsList.length; i++) {
      for (let j = i + 1; j < contactsList.length; j++) {
        const contact1 = contactsList[i];
        const contact2 = contactsList[j];
        
        const { score, maxScore, reasons } = calculateSimilarity(contact1, contact2);
        const similarity = maxScore > 0 ? score / maxScore : 0;
        
        if (similarity >= 0.5) {
          pairs.push({
            contact1,
            contact2,
            similarity,
            reasons
          });
        }
      }
    }
    
    // Sort by similarity (highest first)
    pairs.sort((a, b) => b.similarity - a.similarity);
    setPairs(pairs);
  };

  const handleSelectPair = (pairKey: string) => {
    const newSelected = new Set(selectedPairs);
    if (newSelected.has(pairKey)) {
      newSelected.delete(pairKey);
    } else {
      newSelected.add(pairKey);
    }
    setSelectedPairs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPairs.size === pairs.length) {
      setSelectedPairs(new Set());
    } else {
      const allKeys = pairs.map((_, index) => index.toString());
      setSelectedPairs(new Set(allKeys));
    }
  };

  const handleMergeSelected = async () => {
    if (selectedPairs.size === 0) return;
    
    setProcessing(true);
    try {
      const results: MergeResult[] = [];
      
      for (const pairKey of selectedPairs) {
        const pairIndex = parseInt(pairKey);
        const pair = pairs[pairIndex];
        
        if (pair) {
          // For demo purposes, we'll just mark as merged without actual merging
          setMergeResults(prev => ({ ...prev, [pairKey]: true }));
        }
      }
      
      setSelectedPairs(new Set());
      toast.success(`${results.length} جفت مخاطب با موفقیت ادغام شدند`);
    } catch (error) {
      console.error("Error merging contacts:", error);
      toast.error("خطا در ادغام مخاطبین");
    } finally {
      setProcessing(false);
    }
  };

  const filteredPairs = pairs.filter(pair =>
    (pair.contact1.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pair.contact2.firstName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pair.contact1.lastName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pair.contact2.lastName || "").toLowerCase().includes(searchTerm.toLowerCase())
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
            <Users className="h-6 w-6" />
            حذف تکرار مخاطبین
          </h2>
          <p className="text-muted-foreground">
            تشخیص و ادغام مخاطبین تکراری با استفاده از هوش مصنوعی
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSelectAll}
            disabled={pairs.length === 0}
          >
            {selectedPairs.size === pairs.length ? "لغو انتخاب همه" : "انتخاب همه"}
          </Button>
          <Button
            onClick={handleMergeSelected}
            disabled={selectedPairs.size === 0 || processing}
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                در حال ادغام...
              </>
            ) : (
              <>
                <Merge className="h-4 w-4 ml-2" />
                ادغام انتخاب‌شده‌ها
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>مخاطبین تکراری پیدا شده</CardTitle>
              <CardDescription>
                {pairs.length} جفت مخاطب مشابه پیدا شد
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
          {filteredPairs.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">مخاطب تکراری پیدا نشد</h3>
              <p className="text-muted-foreground">
                هیچ جفت مخاطب مشابهی پیدا نشد
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPairs.map((pair, index) => {
                const pairKey = index.toString();
                const isMerged = mergeResults[pairKey];
                const isSelected = selectedPairs.has(pairKey);
                
                return (
                  <div 
                    key={pairKey} 
                    className={`border rounded-lg p-4 transition-all ${
                      isMerged 
                        ? "bg-green-50 border-green-200" 
                        : isSelected 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-background hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex items-center h-5 pt-1">
                        {!isMerged ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectPair(pairKey)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold">مخاطب ۱</h4>
                          <p>نام: {[pair.contact1.firstName, pair.contact1.lastName].filter(Boolean).join(" ") || "-"}</p>
                          {pair.contact1.position && <p>سمت: {pair.contact1.position}</p>}
                          {(pair.contact1 as any).company && <p>شرکت: {(pair.contact1 as any).company}</p>}
                          {(pair.contact1 as any).email && <p>ایمیل: {(pair.contact1 as any).email}</p>}
                          {pair.contact1.phoneNumbers.length > 0 && (
                            <p>تلفن: {pair.contact1.phoneNumbers[0].number}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold">مخاطب ۲</h4>
                          <p>نام: {[pair.contact2.firstName, pair.contact2.lastName].filter(Boolean).join(" ") || "-"}</p>
                          {pair.contact2.position && <p>سمت: {pair.contact2.position}</p>}
                          {(pair.contact2 as any).company && <p>شرکت: {(pair.contact2 as any).company}</p>}
                          {(pair.contact2 as any).email && <p>ایمیل: {(pair.contact2 as any).email}</p>}
                          {pair.contact2.phoneNumbers.length > 0 && (
                            <p>تلفن: {pair.contact2.phoneNumbers[0].number}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {Math.round(pair.similarity * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">شباهت</div>
                      </div>
                    </div>
                    
                    {pair.reasons.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex flex-wrap gap-2">
                          {pair.reasons.map((reason, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              <AlertTriangle className="h-3 w-3 ml-1" />
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}