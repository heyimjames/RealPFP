"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[6px]",
        "border border-input bg-card text-primary-foreground",
        "shadow-[inset_0_1px_1px_rgba(0,0,0,0.04)] outline-none",
        "transition-[background-color,border-color,box-shadow] duration-150 ease-out",
        "fine-hover:hover:border-charcoal/45",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-[checked]:border-charcoal data-[checked]:bg-charcoal data-[checked]:shadow-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        keepMounted
        className={cn(
          "flex items-center justify-center text-current",
          "motion-safe:transition-[transform,opacity] motion-safe:duration-150 ease-out",
          "data-[unchecked]:scale-50 data-[unchecked]:opacity-0"
        )}
      >
        <CheckIcon className="size-[70%]" strokeWidth={3.25} aria-hidden />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
