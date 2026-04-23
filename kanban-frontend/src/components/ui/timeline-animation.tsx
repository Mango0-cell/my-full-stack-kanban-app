"use client"

import { cn } from "@/lib/utils"
import { motion, type Variants } from "motion/react"
import { type ElementType, type RefObject, forwardRef } from "react"

interface TimelineContentProps {
  children: React.ReactNode
  animationNum: number
  timelineRef: RefObject<HTMLDivElement | null>
  customVariants?: Variants
  className?: string
  as?: ElementType
}

export const TimelineContent = forwardRef<HTMLDivElement, TimelineContentProps>(
  ({ children, animationNum, customVariants, className, as: Tag = "div", timelineRef: _timelineRef, ...props }, ref) => {
    const defaultVariants: Variants = {
      hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { delay: i * 0.15, duration: 0.5 },
      }),
    }

    const variants = customVariants || defaultVariants

    const MotionTag = motion.create(Tag)

    return (
      <MotionTag
        ref={ref}
        custom={animationNum}
        initial="hidden"
        animate="visible"
        variants={variants}
        className={cn(className)}
        {...props}
      >
        {children}
      </MotionTag>
    )
  }
)

TimelineContent.displayName = "TimelineContent"
