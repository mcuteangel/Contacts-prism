"use client"

import * as React from "react"
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"
import { cn } from "@/lib/utils"

interface AspectRatioProps 
  extends React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root> {
  variant?: 'default' | 'glass'
}

const AspectRatio = React.forwardRef<
  React.ElementRef<typeof AspectRatioPrimitive.Root>,
  AspectRatioProps
>(({ className, variant = 'default', ...props }, ref) => (
  <div className={cn(
    "relative w-full overflow-hidden",
    variant === 'glass' && [
      "rounded-xl border border-border/30 bg-background/60 backdrop-blur-md",
      "shadow-lg transition-all duration-300"
    ],
    className
  )}>
    <AspectRatioPrimitive.Root
      ref={ref}
      className={cn(
        "relative w-full h-full",
        variant === 'glass' && "p-4"
      )}
      {...props}
    />
  </div>
))
AspectRatio.displayName = AspectRatioPrimitive.Root.displayName

export { AspectRatio }
