'use client'

import { useEffect, useState } from 'react'
import { differenceInSeconds } from 'date-fns'
import { cn } from '@/lib/utils'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  endsAt: Date
  className?: string
}

function formatTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return 'Ended'
  
  const days = Math.floor(totalSeconds / (24 * 60 * 60))
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60)
  const seconds = totalSeconds % 60
  
  if (days > 0) {
    return `${days}d ${hours}h`
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }
  return `${seconds}s`
}

export function CountdownTimer({ endsAt, className }: CountdownTimerProps) {
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  
  useEffect(() => {
    setMounted(true)
    setTimeLeft(differenceInSeconds(endsAt, new Date()))
  }, [endsAt])
  
  useEffect(() => {
    if (!mounted) return
    
    const interval = setInterval(() => {
      const remaining = differenceInSeconds(endsAt, new Date())
      setTimeLeft(remaining)
      
      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [endsAt, mounted])
  
  const isUrgent = timeLeft > 0 && timeLeft < 24 * 60 * 60 // Less than 24 hours
  const isCritical = timeLeft > 0 && timeLeft < 60 * 60 // Less than 1 hour
  const hasEnded = timeLeft <= 0
  
  // Show loading state before hydration to prevent mismatch
  if (!mounted) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-card/90 text-foreground',
          className
        )}
      >
        <Clock className="size-3" />
        <span>Loading...</span>
      </div>
    )
  }
  
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm',
        hasEnded && 'bg-muted/90 text-muted-foreground',
        !hasEnded && !isUrgent && 'bg-card/90 text-foreground',
        isUrgent && !isCritical && 'bg-accent/90 text-accent-foreground',
        isCritical && 'bg-destructive/90 text-destructive-foreground animate-pulse',
        className
      )}
    >
      <Clock className="size-3" />
      <span>{formatTime(timeLeft)}</span>
    </div>
  )
}
