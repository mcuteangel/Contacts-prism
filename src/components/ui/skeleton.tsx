import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass';
}

function Skeleton({
  className,
  variant = 'default',
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl",
        variant === 'glass' 
          ? "bg-background/40 backdrop-blur-sm border border-border/30 shadow-inner" 
          : "bg-primary/10",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
