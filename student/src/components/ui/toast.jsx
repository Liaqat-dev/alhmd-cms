import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[400px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  cn(
    "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden",
    "rounded-xl border p-4 pr-8 shadow-lg shadow-gray-200/60 dark:shadow-black/30",
    "transition-all duration-200",
    "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
    "data-[state=open]:slide-in-from-bottom-full"
  ),
  {
    variants: {
      variant: {
        default:
          "border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-900 text-gray-800 dark:text-dark-100",
        success:
          "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
        destructive:
          "border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-300",
        warning:
          "border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
))
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border px-3 text-sm font-medium",
      "bg-transparent transition-colors duration-150",
      "border-gray-200 dark:border-dark-600 text-gray-700 dark:text-dark-200",
      "hover:bg-gray-100 dark:hover:bg-dark-800",
      "focus:outline-none focus:ring-2 focus:ring-primary-500/30",
      "disabled:pointer-events-none disabled:opacity-50",
      "group-[.destructive]:border-red-300/40 group-[.destructive]:hover:bg-red-500 group-[.destructive]:hover:text-white",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1",
      "text-gray-400 dark:text-dark-500 opacity-70",
      "transition-all duration-150",
      "hover:text-gray-600 dark:hover:text-dark-200 hover:opacity-100",
      "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30",
      "group-hover:opacity-100",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-3.5 w-3.5" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-80 mt-0.5 leading-snug", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
