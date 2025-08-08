"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Collapsible = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.Root
    ref={ref}
    className={cn("glass rounded-lg border border-border/30 bg-background/30 p-2", className)}
    {...props}
  />
))

const CollapsibleTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleTrigger>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleTrigger> & {
    asChild?: boolean
  }
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleTrigger
    ref={ref}
    className={cn(
      "group flex w-full items-center justify-between rounded-md px-4 py-3 text-sm font-medium transition-all",
      "hover:bg-accent/20 hover:text-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
      "data-[state=open]:text-foreground",
      className
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 group-hover:text-foreground" />
  </CollapsiblePrimitive.CollapsibleTrigger>
))

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    className={cn(
      "overflow-hidden text-sm",
      "data-[state=open]:animate-collapsible-down",
      "data-[state=closed]:animate-collapsible-up",
      className
    )}
    {...props}
  >
    <div className="px-4 pb-3 pt-0">
      <div className="glass rounded-lg p-3 text-muted-foreground">
        {children}
      </div>
    </div>
  </CollapsiblePrimitive.CollapsibleContent>
))

Collapsible.displayName = "Collapsible"
CollapsibleTrigger.displayName = "CollapsibleTrigger"
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
