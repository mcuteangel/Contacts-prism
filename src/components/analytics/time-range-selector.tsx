"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface TimeRangeSelectorProps {
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

export function TimeRangeSelector({ selectedRange, onRangeChange }: TimeRangeSelectorProps) {
  const ranges = [
    { value: "7d", label: "۷ روز" },
    { value: "30d", label: "۳۰ روز" },
    { value: "90d", label: "۹۰ روز" }
  ];

  return (
    <div className="flex gap-2">
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant={selectedRange === range.value ? "default" : "outline"}
          size="sm"
          onClick={() => onRangeChange(range.value)}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}