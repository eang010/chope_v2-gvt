'use client'

import { Minus, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface QuantityStepperProps {
  value?: number
  onChange: (value: number | undefined) => void
  min?: number
  max?: number
  allowEmpty?: boolean
  disabled?: boolean
  className?: string
  id?: string
  'aria-labelledby'?: string
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  allowEmpty = false,
  disabled = false,
  className,
  id,
  'aria-labelledby': ariaLabelledby,
}: QuantityStepperProps) {
  const empty = value == null
  const atMin = empty || value <= min
  const atMax = !empty && value >= max

  return (
    <div
      id={id}
      role="group"
      aria-labelledby={ariaLabelledby}
      aria-label={ariaLabelledby ? undefined : 'Quantity'}
      className={cn(
        'flex items-center justify-center gap-4 p-3 bg-muted/50 rounded-xl',
        disabled && 'opacity-60 pointer-events-none',
        className
      )}
    >
      <button
        type="button"
        onClick={() => {
          if (empty) return
          if (allowEmpty && value <= min) {
            onChange(undefined)
            return
          }
          onChange(Math.max(min, value - 1))
        }}
        disabled={disabled || empty || (atMin && !allowEmpty)}
        className={cn(
          'size-10 rounded-full flex items-center justify-center transition-colors',
          atMin || disabled
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary/20 text-primary hover:bg-primary/30'
        )}
        aria-label="Decrease quantity"
      >
        <Minus className="size-5" />
      </button>
      <span
        className="text-2xl font-bold text-foreground w-12 text-center tabular-nums"
        aria-live="polite"
      >
        {empty ? 'N/A' : value}
      </span>
      <button
        type="button"
        onClick={() => onChange(empty ? min : Math.min(max, value + 1))}
        disabled={disabled || atMax}
        className={cn(
          'size-10 rounded-full flex items-center justify-center transition-colors',
          atMax || disabled
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary/20 text-primary hover:bg-primary/30'
        )}
        aria-label="Increase quantity"
      >
        <Plus className="size-5" />
      </button>
    </div>
  )
}
