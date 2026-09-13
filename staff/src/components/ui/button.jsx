import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary-600 text-white shadow-sm shadow-primary-600/25 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600",
        destructive:
          "bg-red-500 text-white shadow-sm shadow-red-500/25 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700",
        outline:
          "border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 text-gray-700 dark:text-dark-200 hover:bg-gray-50 dark:hover:bg-dark-800 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400",
        secondary:
          "bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-dark-200 hover:bg-gray-200 dark:hover:bg-dark-700",
        ghost:
          "text-gray-600 dark:text-dark-300 hover:bg-primary-500/8 hover:text-primary-700 dark:hover:bg-primary-500/10 dark:hover:text-primary-400",
        link:
          "text-primary-600 dark:text-primary-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-xl px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
