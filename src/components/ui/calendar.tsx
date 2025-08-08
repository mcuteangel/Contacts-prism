"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  variant?: 'default' | 'glass'
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  variant = 'default',
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-3 transition-all duration-300",
        variant === 'glass' && [
          "rounded-xl border border-border/30 bg-background/60 backdrop-blur-md shadow-lg",
          "[&_.rdp-caption]:text-foreground/90",
          "[&_.rdp-head_cell]:text-foreground/80",
          "[&_.rdp-day]:text-foreground/90",
          "[&_.rdp-day_today]:border border-border/50",
          "[&_.rdp-day_outside]:text-foreground/40",
          "[&_.rdp-button:hover:not([disabled])]:bg-background/50",
          "[&_.rdp-button.rdp-day_selected]:bg-primary/90 [&_.rdp-button.rdp-day_selected]:text-primary-foreground",
          "[&_.rdp-button.rdp-day_selected:hover]:bg-primary/80",
        ],
        className
      )}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: cn(
          "text-sm font-medium",
          variant === 'glass' && "text-foreground/90"
        ),
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: variant === 'glass' ? 'ghost' : 'outline' }),
          variant === 'glass' 
            ? "h-7 w-7 p-0 bg-background/50 hover:bg-background/80 border-border/30 hover:border-border/50 text-foreground/80 hover:text-foreground transition-all"
            : "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: cn(
          "rounded-md w-8 font-normal text-[0.8rem]",
          variant === 'glass' 
            ? "text-foreground/70" 
            : "text-muted-foreground"
        ),
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          variant === 'glass' 
            ? "[&:has([aria-selected])]:bg-background/30 [&:has([aria-selected].day-outside)]:bg-background/20 [&:has([aria-selected].day-range-end)]:rounded-r-md"
            : "[&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: variant === 'glass' ? 'ghost' : 'ghost' }),
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
          variant === 'glass' && [
            "hover:bg-background/50 hover:text-foreground/90",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background/50 focus:ring-primary/50"
          ]
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected: cn(
          variant === 'glass'
            ? "bg-primary/90 text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground focus:bg-primary/80 focus:text-primary-foreground"
            : "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
        ),
        day_today: cn(
          variant === 'glass'
            ? "bg-background/30 text-foreground border border-border/50"
            : "bg-accent text-accent-foreground"
        ),
        day_outside: cn(
          variant === 'glass'
            ? "day-outside text-foreground/40 aria-selected:bg-background/20 aria-selected:text-foreground/60"
            : "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground"
        ),
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: cn(
          variant === 'glass'
            ? "aria-selected:bg-background/30 aria-selected:text-foreground/90"
            : "aria-selected:bg-accent aria-selected:text-accent-foreground"
        ),
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
