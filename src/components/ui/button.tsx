"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border",
  {
    variants: {
      variant: {
        default: "bg-primary/80 text-primary-foreground hover:bg-primary/90 border-primary/30 shadow-lg hover:shadow-primary/20 backdrop-blur-md",
        destructive: "bg-destructive/80 text-destructive-foreground hover:bg-destructive/90 border-destructive/30 shadow-lg hover:shadow-destructive/20 backdrop-blur-md",
        outline: "border-2 border-border/30 bg-background/60 hover:bg-background/80 text-foreground hover:border-primary/50 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-md",
        secondary: "bg-secondary/80 text-secondary-foreground hover:bg-secondary/90 border-secondary/30 shadow-lg hover:shadow-secondary/20 backdrop-blur-md",
        ghost: "bg-transparent hover:bg-accent/30 text-foreground border-transparent hover:border-accent/50 shadow-sm hover:shadow-accent/10 backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline border-transparent bg-transparent shadow-none hover:bg-transparent",
        glass: "bg-background/60 backdrop-blur-lg border border-border/30 shadow-lg hover:shadow-xl hover:bg-background/80 text-foreground transition-all duration-300 hover:border-primary/50",
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