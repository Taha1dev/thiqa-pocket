import { cn } from "@/lib/utils"

interface BrandMarkProps {
  readonly className?: string
  readonly imageClassName?: string
}

export function BrandMark({ className, imageClassName }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-xl bg-white",
        className
      )}
    >
      <img
        alt=""
        className={cn(
          "absolute inset-0 size-full scale-125",
          imageClassName
        )}
        src="/thiqa-default-icon.png"
      />
    </span>
  )
}
