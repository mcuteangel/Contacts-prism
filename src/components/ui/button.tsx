"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 backdrop-blur-sm border", // Added backdrop-blur-sm and border to base styles
  {
    variants: {
      variant: {
        default: "bg-primary/70 text-primary-foreground hover:bg-primary/80 border-primary/50", // Modified for glassmorphism
        destructive:
          "bg-destructive/70 text-destructive-foreground hover:bg-destructive/80 border-destructive/50", // Modified for glassmorphism
        outline:
          "border-input/50 bg-background/70 hover:bg-accent/80 hover:text-accent-foreground", // Modified for glassmorphism (border is now in base)
        secondary:
          "bg-secondary/70 text-secondary-foreground hover:bg-secondary/80 border-secondary/50", // Modified for glassmorphism
        ghost: "hover:bg-accent/70 hover:text-accent-foreground border-transparent", // Modified for glassmorphism, transparent border
        link: "text-primary underline-offset-4 hover:underline border-transparent", // Added transparent border
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };