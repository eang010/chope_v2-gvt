'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MediaCarouselProps {
  media: { type: 'image' | 'video'; url: string }[]
  alt: string
  className?: string
}

export function MediaCarousel({ media, alt, className }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  const hasMultiple = media.length > 1

  const updateIndexFromScroll = useCallback(() => {
    const track = trackRef.current
    if (!track || !hasMultiple) return

    const index = Math.round(track.scrollLeft / track.clientWidth)
    setCurrentIndex(Math.min(Math.max(0, index), media.length - 1))
  }, [hasMultiple, media.length])

  useEffect(() => {
    const track = trackRef.current
    if (!track || !hasMultiple) return

    updateIndexFromScroll()
    track.addEventListener('scroll', updateIndexFromScroll, { passive: true })
    return () => track.removeEventListener('scroll', updateIndexFromScroll)
  }, [hasMultiple, media.length, updateIndexFromScroll])

  const scrollToIndex = (index: number) => {
    slideRefs.current[index]?.scrollIntoView({
      inline: 'start',
      behavior: 'smooth',
      block: 'nearest',
    })
  }

  const goToPrevious = () => {
    if (currentIndex > 0) scrollToIndex(currentIndex - 1)
  }

  const goToNext = () => {
    if (currentIndex < media.length - 1) scrollToIndex(currentIndex + 1)
  }

  if (media.length === 0) return null

  return (
    <div className={cn('relative aspect-square bg-muted overflow-hidden', className)}>
      <div
        ref={trackRef}
        className={cn(
          'flex h-full w-full',
          hasMultiple &&
            'overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide overscroll-x-contain'
        )}
      >
        {media.map((item, index) => (
          <div
            key={index}
            ref={(el) => {
              slideRefs.current[index] = el
            }}
            className="h-full w-full shrink-0 flex-[0_0_100%] snap-start overflow-hidden"
          >
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={`${alt} - Image ${index + 1}`}
                className="w-full h-full object-cover select-none"
                draggable={false}
              />
            ) : (
              <video
                src={item.url}
                className="w-full h-full object-cover"
                controls
                playsInline
              />
            )}
          </div>
        ))}
      </div>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-card/80 backdrop-blur-sm items-center justify-center text-foreground hover:bg-card transition-colors hidden md:flex',
              currentIndex === 0 && 'opacity-40 pointer-events-none'
            )}
            aria-label="Previous image"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={goToNext}
            disabled={currentIndex === media.length - 1}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-card/80 backdrop-blur-sm items-center justify-center text-foreground hover:bg-card transition-colors hidden md:flex',
              currentIndex === media.length - 1 && 'opacity-40 pointer-events-none'
            )}
            aria-label="Next image"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
            {media.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => scrollToIndex(index)}
                className={cn(
                  'pointer-events-auto size-1.5 rounded-full transition-all',
                  index === currentIndex
                    ? 'bg-primary-foreground w-4'
                    : 'bg-primary-foreground/50 hover:bg-primary-foreground/70'
                )}
                aria-label={`Go to image ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
