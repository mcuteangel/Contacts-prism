"use client"

import * as React from "react"
import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

interface ResizablePanelGroupProps extends React.ComponentProps<typeof ResizablePrimitive.PanelGroup> {
  variant?: 'default' | 'glass';
}

// Create a context to pass down the variant
const ResizableContext = React.createContext<{ variant?: 'default' | 'glass' }>({ variant: 'default' });

const ResizablePanelGroup = ({
  className,
  variant = 'default',
  children,
  ...props
}: ResizablePanelGroupProps) => (
  <ResizableContext.Provider value={{ variant }}>
    <ResizablePrimitive.PanelGroup
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col transition-all duration-300",
        variant === 'glass' && "rounded-xl overflow-hidden border border-border/30 bg-background/60 backdrop-blur-lg shadow-lg",
        className
      )}
      data-variant={variant}
      {...props}
    >
      {children}
    </ResizablePrimitive.PanelGroup>
  </ResizableContext.Provider>
)

interface ResizablePanelProps extends React.ComponentProps<typeof ResizablePrimitive.Panel> {
  variant?: 'default' | 'glass';
}

const ResizablePanel = React.forwardRef<
  React.ElementRef<typeof ResizablePrimitive.Panel>,
  ResizablePanelProps
>(({ className, variant = 'default', ...props }, ref) => {
  return (
    <ResizablePrimitive.Panel
      ref={ref}
      className={cn(
        "overflow-hidden transition-all duration-300",
        variant === 'glass' && "first:rounded-l-xl last:rounded-r-xl first:data-[panel-group-direction=vertical]:rounded-t-xl first:data-[panel-group-direction=vertical]:rounded-bl-none last:data-[panel-group-direction=vertical]:rounded-b-xl last:data-[panel-group-direction=vertical]:rounded-tr-none",
        className
      )}
      data-variant={variant}
      {...props}
    />
  )
})



interface ResizableHandleProps extends React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> {
  withHandle?: boolean;
  variant?: 'default' | 'glass';
}

const ResizableHandle = ({
  withHandle,
  className,
  variant = 'default',
  ...props
}: ResizableHandleProps) => {
  const context = React.useContext(ResizableContext);
  const currentVariant = variant === 'glass' ? 'glass' : context?.variant || 'default';
  
  return (
    <ResizablePrimitive.PanelResizeHandle
      className={cn(
        "relative flex items-center justify-center transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
        currentVariant === 'glass' 
          ? "w-0.5 bg-transparent hover:bg-primary/30 active:bg-primary/50 after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2 after:bg-transparent hover:after:bg-primary/20 active:after:bg-primary/40 data-[panel-group-direction=vertical]:h-0.5 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:top-1/2 data-[panel-group-direction=vertical]:after:h-2 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90"
          : "w-px bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        className
      )}
      data-variant={currentVariant}
      {...props}
    >
      {withHandle && (
        <div className={cn(
          "z-10 flex items-center justify-center rounded-md transition-colors duration-300",
          currentVariant === 'glass'
            ? "h-5 w-1.5 bg-background/80 border border-border/30 shadow-sm hover:bg-background/100 hover:border-border/50 active:bg-background/90 active:border-border/40"
            : "h-4 w-3 rounded-sm border bg-border"
        )}>
          <GripVertical className={cn(
            "transition-opacity duration-300",
            currentVariant === 'glass' 
              ? "h-3 w-3 opacity-50 group-hover:opacity-80 group-active:opacity-100" 
              : "h-2.5 w-2.5"
          )} />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
