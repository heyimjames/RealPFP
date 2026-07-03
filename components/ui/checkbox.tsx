"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"

// A checkbox tuned to the charcoal/cream palette. Unchecked is a crisp white
// chip with a hairline border; checked fills charcoal with layered soft shadow
// (depth from shadow, not a hard border) and the tick *draws itself in* via
// stroke-dashoffset — the detail that makes it read as considered rather than
// default. All motion is gated behind motion-safe.
function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "group/cb relative flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[6px]",
        "border-[1.5px] border-[color-mix(in_srgb,var(--charcoal)_22%,transparent)] bg-card",
        "shadow-[inset_0_1px_1.5px_rgba(16,15,15,0.05)] outline-none",
        "transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out",
        "motion-safe:active:scale-95",
        "fine-hover:hover:border-[color-mix(in_srgb,var(--charcoal)_42%,transparent)]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-[checked]:border-charcoal data-[checked]:bg-charcoal",
        "data-[checked]:shadow-[0_1px_2px_rgba(16,15,15,0.28),0_2px_6px_rgba(16,15,15,0.14)]",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        keepMounted
        className="flex size-full items-center justify-center text-white"
      >
        <svg
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden
          className="size-[68%]"
        >
          <path
            d="M3 7.4 L5.9 10.2 L11 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            className={cn(
              "[stroke-dasharray:1] [stroke-dashoffset:0]",
              "motion-safe:transition-[stroke-dashoffset] motion-safe:duration-200",
              "motion-safe:[transition-timing-function:cubic-bezier(0.2,0,0,1)]",
              "group-data-[unchecked]/cb:[stroke-dashoffset:1]"
            )}
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
