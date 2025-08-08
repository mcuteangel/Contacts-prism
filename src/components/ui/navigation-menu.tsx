import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

interface NavigationMenuProps extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root> {
  variant?: 'default' | 'glass';
}

// Create a context to pass down the variant
const NavigationMenuContext = React.createContext<{ variant?: 'default' | 'glass' }>({ variant: 'default' });

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  NavigationMenuProps
>(({ className, children, variant = 'default', ...props }, ref) => {
  return (
    <NavigationMenuContext.Provider value={{ variant }}>
      <NavigationMenuPrimitive.Root
        ref={ref}
        className={cn(
          "relative z-10 flex max-w-max flex-1 items-center justify-center",
          variant === 'glass' && "backdrop-blur-lg",
          className
        )}
        data-variant={variant}
        {...props}
      >
        {children}
        <NavigationMenuViewport variant={variant} />
      </NavigationMenuPrimitive.Root>
    </NavigationMenuContext.Provider>
  )
})
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

interface NavigationMenuListProps extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List> {
  variant?: 'default' | 'glass';
}

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  NavigationMenuListProps
>(({ className, variant = 'default', ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      variant === 'glass' && "bg-background/60 backdrop-blur-md rounded-full p-1 border border-border/30 shadow-lg",
      className
    )}
    data-variant={variant}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[state=open]:text-accent-foreground data-[state=open]:bg-accent/50 data-[state=open]:hover:bg-accent data-[state=open]:focus:bg-accent",
        glass: "bg-background/60 hover:bg-background/80 hover:text-foreground focus:bg-background/80 focus:text-foreground data-[state=open]:text-foreground data-[state=open]:bg-background/80 data-[state=open]:shadow-inner data-[state=open]:border data-[state=open]:border-border/50"
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

interface NavigationMenuTriggerProps extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger> {
  variant?: 'default' | 'glass';
}

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  NavigationMenuTriggerProps
>(({ className, children, variant = 'default', ...props }, ref) => {
  const context = React.useContext(NavigationMenuContext);
  const currentVariant = variant === 'glass' ? 'glass' : context?.variant || 'default';
  
  return (
    <NavigationMenuPrimitive.Trigger
      ref={ref}
      className={cn(
        navigationMenuTriggerStyle({ variant: currentVariant }), 
        "group", 
        className
      )}
      data-variant={currentVariant}
      {...props}
    >
      {children}{" "}
      <ChevronDown
        className={cn(
          "relative top-[1px] ml-1 h-3 w-3 transition-all duration-300 group-data-[state=open]:rotate-180",
          currentVariant === 'glass' ? "opacity-70" : "opacity-60"
        )}
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  )
})
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

interface NavigationMenuContentProps extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content> {
  variant?: 'default' | 'glass';
}

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  NavigationMenuContentProps
>(({ className, variant = 'default', ...props }, ref) => {
  const context = React.useContext(NavigationMenuContext);
  const currentVariant = variant === 'glass' ? 'glass' : context?.variant || 'default';
  
  return (
    <NavigationMenuPrimitive.Content
      ref={ref}
      className={cn(
        "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto",
        currentVariant === 'glass' && "backdrop-blur-xl bg-background/80 border border-border/30 shadow-2xl rounded-xl p-1.5",
        className
      )}
      data-variant={currentVariant}
      {...props}
    />
  )
})
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

const NavigationMenuLink = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Link>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link> & {
    variant?: 'default' | 'glass';
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const context = React.useContext(NavigationMenuContext);
  const currentVariant = variant === 'glass' ? 'glass' : context?.variant || 'default';
  
  return (
    <NavigationMenuPrimitive.Link
      ref={ref}
      className={cn(
        "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        currentVariant === 'glass' && "hover:bg-background/60 hover:shadow-sm hover:border hover:border-border/30",
        className
      )}
      data-variant={currentVariant}
      {...props}
    />
  )
})

interface NavigationMenuViewportProps extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport> {
  variant?: 'default' | 'glass';
}

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  NavigationMenuViewportProps
>(({ className, variant = 'default', ...props }, ref) => {
  const context = React.useContext(NavigationMenuContext);
  const currentVariant = variant === 'glass' ? 'glass' : context?.variant || 'default';
  
  return (
    <div className={cn(
      "absolute left-0 top-full flex justify-center",
      currentVariant === 'glass' && "backdrop-blur-lg"
    )}>
      <NavigationMenuPrimitive.Viewport
        className={cn(
          "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden bg-popover text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)] transition-all duration-300",
          currentVariant === 'glass' 
            ? "rounded-xl border border-border/30 bg-background/80 backdrop-blur-xl shadow-2xl"
            : "rounded-md border bg-popover shadow",
          className
        )}
        ref={ref}
        data-variant={currentVariant}
        {...props}
      />
    </div>
  )
})
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName



const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
  </NavigationMenuPrimitive.Indicator>
))
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}
