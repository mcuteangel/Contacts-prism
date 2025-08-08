"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        glass: "bg-background/60 backdrop-blur-sm border border-border/30 rounded-md px-3 py-1.5 text-foreground shadow-sm hover:bg-background/80 hover:border-primary/50 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
