"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    variant?: "default" | "glass"
  }
>(({ className, variant = "default", children, ...props }, ref) => {
  const isGlass = variant === "glass"
  
  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn(
        "relative overflow-hidden",
        isGlass && "glass rounded-lg border border-border/30 bg-background/30 p-2",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport 
        className={cn(
          "h-full w-full rounded-[inherit]",
          isGlass && "pr-3" // Add padding for glass variant to prevent content from being hidden behind scrollbar
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar variant={variant} />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
})
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & {
    variant?: "default" | "glass"
  }
>(({ className, orientation = "vertical", variant = "default", ...props }, ref) => {
  const isGlass = variant === "glass"
  
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-all duration-300",
        isGlass && "opacity-0 hover:opacity-100",
        orientation === "vertical" && "h-full w-2.5 p-0.5",
        orientation === "horizontal" && "h-2.5 flex-col p-0.5",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb 
        className={cn(
          "relative flex-1 rounded-full transition-colors duration-200",
          isGlass 
            ? "bg-foreground/20 hover:bg-foreground/30" 
            : "bg-border hover:bg-border/80"
        )} 
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
})
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
