"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ExternalToast } from "sonner"
import { cn } from "@/lib/utils"

type ToastAction = ExternalToast["action"]

type ToasterProps = React.ComponentProps<typeof Sonner> & {
  variant?: 'default' | 'glass';
}

const Toaster = ({ variant = 'default', ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={cn("toaster group", variant === 'glass' && "glass-toaster")}
      toastOptions={{
        classNames: {
          toast: cn(
            "group toast transition-all duration-300",
            variant === 'glass' 
              ? "group-[.toaster]:bg-background/80 group-[.toaster]:backdrop-blur-xl group-[.toaster]:border group-[.toaster]:border-border/30 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:overflow-hidden"
              : "group-[.toaster]:bg-background group-[.toaster]:border-border group-[.toaster]:shadow-lg"
          ),
          title: cn(
            "font-medium",
            variant === 'glass' && "text-foreground/90"
          ),
          description: cn(
            "text-sm",
            variant === 'glass' 
              ? "text-foreground/70" 
              : "text-muted-foreground"
          ),
          actionButton: cn(
            variant === 'glass'
              ? "bg-background/80 hover:bg-background/100 text-foreground border border-border/30 hover:border-primary/50 transition-colors duration-200"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          ),
          cancelButton: cn(
            variant === 'glass'
              ? "bg-transparent hover:bg-background/50 text-foreground/70 border border-border/20 hover:border-border/40 transition-colors duration-200"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          ),
          closeButton: cn(
            "top-3.5 right-3.5",
            variant === 'glass' 
              ? "text-foreground/50 hover:text-foreground/80 hover:bg-background/50" 
              : "text-foreground/30 hover:text-foreground/50"
          ),
          icon: cn(
            variant === 'glass' && "mt-0.5"
          ),
          loader: cn(
            variant === 'glass' 
              ? "[--track-color:transparent] [--fill-color:var(--foreground)]" 
              : ""
          )
        },
      }}
      {...props}
    />
  )
}

export { Toaster, type ToastAction }
