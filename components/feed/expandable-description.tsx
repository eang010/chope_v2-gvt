'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface ExpandableDescriptionProps {
  description: string | null | undefined
  className?: string
}

export function ExpandableDescription({
  description,
  className,
}: ExpandableDescriptionProps) {
  const text = description?.trim()
  const [expanded, setExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const paragraphRef = useRef<HTMLParagraphElement>(null)

  const checkTruncation = useCallback(() => {
    const el = paragraphRef.current
    if (!el || expanded) return
    setIsTruncated(el.scrollHeight > el.clientHeight + 1)
  }, [expanded])

  useEffect(() => {
    setExpanded(false)
  }, [text])

  useEffect(() => {
    checkTruncation()
  }, [text, expanded, checkTruncation])

  useEffect(() => {
    window.addEventListener('resize', checkTruncation)
    return () => window.removeEventListener('resize', checkTruncation)
  }, [checkTruncation])

  if (!text) return null

  const showToggle = expanded || isTruncated

  return (
    <div className={cn('space-y-1', className)}>
      <p
        ref={paragraphRef}
        className={cn(
          'text-muted-foreground text-sm',
          !expanded && 'line-clamp-2'
        )}
      >
        {text}
      </p>
      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="text-sm text-primary font-medium hover:underline"
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}
