"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
  variants: {
    variant: {
      default: [
        "bg-background/60 backdrop-blur-sm border border-border/30 shadow-sm",
        "hover:bg-background/80 hover:shadow-md hover:border-primary/50",
        "data-[state=on]:bg-primary/30 data-[state=on]:text-foreground data-[state=on]:border-primary/50 data-[state=on]:shadow-primary/20"
      ].join(" "),
      outline: [
        "border-2 border-border/30 bg-background/40 backdrop-blur-sm shadow-sm",
        "hover:bg-background/60 hover:shadow-md hover:border-primary/50",
        "data-[state=on]:bg-primary/20 data-[state=on]:text-foreground data-[state=on]:border-primary/50"
      ].join(" "),
      glass: [
        "bg-background/50 backdrop-blur-md border border-border/30 shadow-lg",
        "hover:bg-background/70 hover:shadow-xl hover:border-primary/50 hover:shadow-primary/10",
        "data-[state=on]:bg-primary/30 data-[state=on]:text-foreground data-[state=on]:border-primary/50 data-[state=on]:shadow-primary/20"
      ].join(" "),
    },
    size: {
      default: "h-9 px-3 min-w-9",
      sm: "h-8 px-2.5 min-w-8 text-xs",
      lg: "h-10 px-4 min-w-10 text-base",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof toggleVariants> {}

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
