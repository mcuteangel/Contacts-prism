"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, Locale } from "react-day-picker"
import { faIR, enUS } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  variant?: 'default' | 'glass'
  locale?: Locale
}

// Function to get direction based on locale
const getDirection = (locale: Locale): 'rtl' | 'ltr' => {
  return locale.code === 'fa-IR' ? 'rtl' : 'ltr';
};

// Function to get default locale based on user preference or fallback
const getDefaultLocale = (): Locale => {
  // Check if user prefers Persian/Farsi
  if (typeof navigator !== 'undefined') {
    const userLang = navigator.language;
    if (userLang?.startsWith('fa') || userLang?.startsWith('fa-IR')) {
      return faIR;
    }
  }
  return faIR; // Default to Persian for this app
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  variant = 'default',
  locale = getDefaultLocale(),
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-3",
        variant === 'glass' && "glass",
        className
      )}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: getDirection(locale) === 'rtl' ? "absolute right-1" : "absolute left-1",
        nav_button_next: getDirection(locale) === 'rtl' ? "absolute left-1" : "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      locale={locale}
      dir={getDirection(locale)}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }