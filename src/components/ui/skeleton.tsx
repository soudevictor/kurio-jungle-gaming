import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("skeleton-shimmer motion-reduce:animate-none rounded-md bg-surface-dark", className)}
      {...props}
    />
  )
}

export { Skeleton }
