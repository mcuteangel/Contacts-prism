"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ContactService } from "@/services/contact-service";
import { type Contact } from "@/database/db";
import { Brain, RefreshCw, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface DuplicatePair {
  contact1: Contact;
  contact2: Contact;
  similarity: number;
  reasons: string[];
}

export function AIContactDeduplication() {
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPairs, setSelectedPairs] = useState<Set<string>>(new Set());
  const [mergeResults, setMergeResults] = useState<{[key: string]: boolean}>({});

  const analyzeDuplicates = async () => {
    setIsAnalyzing(true);
    try {
      const contacts = await ContactService.getAllContacts();
      const duplicatePairs: DuplicatePair[] = [];

      // Simple similarity algorithm (can be enhanced with ML libraries)
      for (let i = 0; i < contacts.length; i++) {
        for (let j = i + 1; j < contacts.length; j++) {
          const contact1 = contacts[i];
          const contact2 = contacts[j];
          
          if (contact1.id === contact2.id) continue;

          const similarity = calculateSimilarity(contact1, contact2);
          if (similarity > 0.7) { // Threshold for duplicates
            const reasons = findSimilarityReasons(contact1, contact2);
            duplicatePairs.push({
              contact1,
              contact2,
              similarity,
              reasons
            });
          }
        }
      }

      setDuplicates(duplicatePairs);
    } catch (error) {
      console.error("Error analyzing duplicates:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateSimilarity = (contact1: Contact, contact2: Contact): number => {
    let score = 0;
    let maxScore = 0;

    // Name similarity
    maxScore += 2;
    if (contact1.firstName.toLowerCase() === contact2.firstName.toLowerCase()) score += 1;
    if (contact1.lastName?.toLowerCase() === contact2.lastName?.toLowerCase()) score += 1;

    // Phone number similarity
    maxScore += contact1.phoneNumbers.length + contact2.phoneNumbers.length;
    contact1.phoneNumbers.forEach(pn1 => {
      contact2.phoneNumbers.forEach(pn2 => {
        if (pn1.number === pn2.number) score += 1;
        else if (pn1.number.replace(/\D/g, '') === pn2.number.replace(/\D/g, '')) score += 0.5;
      });
    });

    // Email similarity (if implemented)
    maxScore += 1;
    if (contact1.email === contact2.email) score += 1;

    // Company similarity
    maxScore += 1;
    if (contact1.company?.toLowerCase() === contact2.company?.toLowerCase()) score += 1;

    return maxScore > 0 ? score / maxScore : 0;
  };

  const findSimilarityReasons = (contact1: Contact, contact2: Contact): string[] => {
    const reasons: string[] = [];

    if (contact1.firstName.toLowerCase() === contact2.firstName.toLowerCase()) {
      reasons.push("نام مشابه");
    }
    if (contact1.lastName?.toLowerCase() === contact2.lastName?.toLowerCase()) {
      reasons.push("نام خانوادگی مشابه");
    }
    
    const commonPhones = contact1.phoneNumbers.filter(pn1 => 
      contact2.phoneNumbers.some(pn2 => pn1.number === pn2.number)
    );
    if (commonPhones.length > 0) {
      reasons.push(`شماره‌های مشترک: ${commonPhones.map(p => p.number).join(', ')}`);
    }

    if (contact1.company?.toLowerCase() === contact2.company?.toLowerCase()) {
      reasons.push("شرکت مشابه");
    }

    return reasons;
  };

  const togglePairSelection = (pairKey: string) => {
    const newSelected = new Set(selectedPairs);
    if (newSelected.has(pairKey)) {
      newSelected.delete(pairKey);
    } else {
      newSelected.add(pairKey);
    }
    setSelectedPairs(newSelected);
  };

  const mergeSelectedPairs = async () => {
    for (const pairKey of selectedPairs) {
      const [id1, id2] = pairKey.split('-').map(Number);
      try {
        // Simple merge: keep the first contact, update with data from second
        const contact1 = await ContactService.getContact(id1);
        const contact2 = await ContactService.getContact(id2);
        
        if (contact1 && contact2) {
          const mergedContact = {
            ...contact1,
            phoneNumbers: [...contact1.phoneNumbers, ...contact2.phoneNumbers.filter(pn2 => 
              !contact1.phoneNumbers.some(pn1 => pn1.number === pn2.number)
            )],
            customFields: [...contact1.customFields || [], ...(contact2.customFields || [])]
          };

          await ContactService.updateContact(id1, mergedContact);
          await ContactService.deleteContact(id2);
        }
      } catch (error) {
        console.error(`Error merging pair ${pairKey}:`, error);
        setMergeResults(prev => ({ ...prev, [pairKey]: false }));
        return;
      }
    }
    
    setMergeResults(prev => ({ ...prev, [selectedPairs.keys().next().value]: true }));
    setSelectedPairs(new Set());
    await analyzeDuplicates(); // Refresh the list
  };

  useEffect(() => {
    analyzeDuplicates();
  }, []);

  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary-foreground">شناسایی مخاطبین تکراری</h1>
        <Button onClick={analyzeDuplicates} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {isAnalyzing ? "در حال تحلیل..." : "تحلیل مجدد"}
        </Button>
      </div>

      <Alert className="mb-6">
        <Brain className="h-4 w-4" />
        <AlertDescription>
          این قابلیت با استفاده از الگوریتم‌های تطبیق ساده، مخاطبان مشابه را شناسایی می‌کند.
          برای نتایج دقیق‌تر، می‌توانید از هوش مصنوعی پیشرفته‌تر استفاده کنید.
        </AlertDescription>
      </Alert>

      {duplicates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-lg font-semibold">هیچ مخاطب تکراری یافت نشد</h3>
              <p className="text-muted-foreground">
                سیستم مخاطبین شما تمیز و بدون تکراری است.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {duplicates.map((pair, index) => {
            const pairKey = `${pair.contact1.id}-${pair.contact2.id}`;
            const isSelected = selectedPairs.has(pairKey);
            const mergeSuccess = mergeResults[pairKey];

            return (
              <Card key={index} className={isSelected ? "ring-2 ring-primary" : ""}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {pair.contact1.firstName} {pair.contact1.lastName} ↔ {pair.contact2.firstName} {pair.contact2.lastName}
                      </CardTitle>
                      <CardDescription>
                        شباهت: {(pair.similarity * 100).toFixed(1)}%
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={mergeSuccess === true ? "default" : mergeSuccess === false ? "destructive" : "secondary"}>
                        {mergeSuccess === true ? "ادغام شد" : mergeSuccess === false ? "خطا در ادغام" : "منتظر ادغام"}
                      </Badge>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePairSelection(pairKey)}
                        className="w-4 h-4"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-1">دلایل شباهت:</h4>
                      <div className="flex flex-wrap gap-1">
                        {pair.reasons.map((reason, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm mb-2">مخاطب اول:</h4>
                        <div className="text-sm space-y-1">
                          <p>نام: {pair.contact1.firstName} {pair.contact1.lastName}</p>
                          <p>شماره‌ها: {pair.contact1.phoneNumbers.map(p => `${p.type}: ${p.number}`).join(', ')}</p>
                          {pair.contact1.position && <p>سمت: {pair.contact1.position}</p>}
                          {pair.contact1.company && <p>شرکت: {pair.contact1.company}</p>}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">مخاطب دوم:</h4>
                        <div className="text-sm space-y-1">
                          <p>نام: {pair.contact2.firstName} {pair.contact2.lastName}</p>
                          <p>شماره‌ها: {pair.contact2.phoneNumbers.map(p => `${p.type}: ${p.number}`).join(', ')}</p>
                          {pair.contact2.position && <p>سمت: {pair.contact2.position}</p>}
                          {pair.contact2.company && <p>شرکت: {pair.contact2.company}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {selectedPairs.size > 0 && (
            <div className="flex justify-end gap-2">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {selectedPairs.size} جفت مخاطب برای ادغام انتخاب شده‌اند. این عمل غیرقابل بازگشت است.
                </AlertDescription>
              </Alert>
              <Button onClick={mergeSelectedPairs} variant="destructive">
                ادغام {selectedPairs.size} جفت انتخاب شده
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}