import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex w-full rounded-lg border px-3 py-2 text-sm transition-colors duration-150",
        "border-gray-200 dark:border-dark-700",
        "bg-white dark:bg-dark-900",
        "text-gray-900 dark:text-dark-100",
        "placeholder:text-gray-400 dark:placeholder:text-dark-500",
        "focus:outline-none focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-dark-850",
        "min-h-[80px] resize-y",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
