"use client"

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Minus } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn(
      "disabled:cursor-not-allowed transition-all duration-200",
      "[&_div:has(>div:focus)]:ring-2 [&_div:has(>div:focus)]:ring-primary/50 [&_div:has(>div:focus)]:ring-offset-2 [&_div:has(>div:focus)]:ring-offset-background/80",
      className
    )}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "flex items-center gap-1.5 p-0.5 rounded-lg bg-white/5 backdrop-blur-sm",
      "border border-white/10 shadow-sm transition-all duration-200",
      className
    )} 
    {...props} 
  />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-12 w-12 items-center justify-center text-lg font-medium transition-all duration-200",
        "bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg shadow-sm",
        "focus-within:ring-2 focus-within:ring-primary/50 focus-within:ring-offset-2 focus-within:ring-offset-background/80",
        "hover:bg-white/10 hover:shadow-md",
        isActive && "ring-2 ring-primary/50 bg-white/10 shadow-md",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-0.5 animate-caret-blink bg-primary duration-1000 rounded-full" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    role="separator" 
    className={cn("text-foreground/30 px-1", className)}
    {...props}
  >
    <Minus className="h-4 w-4" />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
