"use client"

import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface CommandProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive> {
  variant?: 'default' | 'glass';
}

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  CommandProps
>(({ className, variant = 'default', ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-xl text-popover-foreground transition-all duration-300",
      variant === 'glass' 
        ? "bg-background/60 backdrop-blur-lg border border-border/30 shadow-xl"
        : "bg-popover",
      className
    )}
    data-variant={variant}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

interface CommandInputProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> {
  variant?: 'default' | 'glass';
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  CommandInputProps
>(({ className, variant = 'default', ...props }, ref) => (
  <div 
    className={cn(
      "flex items-center px-3 transition-colors duration-300",
      variant === 'glass' 
        ? "border-b border-border/30 bg-background/30" 
        : "border-b"
    )} 
    cmdk-input-wrapper=""
  >
    <Search className={cn(
      "ltr:mr-2 rtl:ml-2 h-4 w-4 shrink-0 transition-opacity duration-300",
      variant === 'glass' ? "opacity-70" : "opacity-50"
    )} />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
        variant === 'glass' ? "rounded-lg" : "rounded-md",
        className
      )}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

interface CommandListProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.List> {
  variant?: 'default' | 'glass';
}

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  CommandListProps
>(({ className, variant = 'default', ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      "max-h-[300px] overflow-y-auto overflow-x-hidden transition-all duration-300",
      // استایل‌های ریسپانسیو برای موبایل
      "max-h-[60vh] sm:max-h-[300px]",
      variant === 'glass' ? "p-2 space-y-1" : "",
      className
    )}
    data-variant={variant}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> & { variant?: 'default' | 'glass' }
>(({ className, variant = 'default', ...props }, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn(
      "py-6 text-center text-sm text-muted-foreground/80 transition-colors duration-300",
      variant === 'glass' && "bg-background/30 mx-2 rounded-lg py-4",
      className
    )}
    data-variant={variant}
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

interface CommandGroupProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group> {
  variant?: 'default' | 'glass';
}

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  CommandGroupProps
>(({ className, variant = 'default', ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden text-foreground transition-all duration-300",
      variant === 'glass' 
        ? "rounded-lg bg-background/40 backdrop-blur-sm p-1.5 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-foreground/80 [&_[cmdk-group-heading]]:bg-background/30 [&_[cmdk-group-heading]]:rounded-md [&_[cmdk-group-heading]]:mb-1.5 [&_[cmdk-group-heading]]:mx-0.5 [&_[cmdk-group-heading]]:shadow-sm"
        : "p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    data-variant={variant}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

interface CommandItemProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> {
  variant?: 'default' | 'glass';
}

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  CommandItemProps
>(({ className, variant = 'default', ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-md px-3 py-2.5 text-sm outline-none transition-all duration-200 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      variant === 'glass' 
        ? "mx-1 my-0.5 aria-selected:bg-background/70 aria-selected:shadow-sm aria-selected:border aria-selected:border-border/50"
        : "aria-selected:bg-accent aria-selected:text-accent-foreground",
      className
    )}
    data-variant={variant}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ltr:ml-auto rtl:mr-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}