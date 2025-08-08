import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-sm border shadow-sm",
  {
    variants: {
      variant: {
        default:
          "bg-primary/80 text-primary-foreground border-primary/30 hover:bg-primary/90 hover:shadow-primary/10 hover:border-primary/50",
        secondary:
          "bg-secondary/80 text-secondary-foreground border-secondary/30 hover:bg-secondary/90 hover:shadow-secondary/10 hover:border-secondary/50",
        destructive:
          "bg-destructive/80 text-destructive-foreground border-destructive/30 hover:bg-destructive/90 hover:shadow-destructive/10 hover:border-destructive/50",
        outline: 
          "bg-background/60 text-foreground border-border/40 hover:bg-background/80 hover:border-primary/50 shadow-sm hover:shadow-md",
        glass:
          "bg-background/50 text-foreground border-border/30 hover:bg-background/70 hover:border-primary/50 shadow-sm hover:shadow-md backdrop-blur-lg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
