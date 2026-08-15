import Image from 'next/image'
import { cn } from '@/lib/utils'

export function ChopeBrand({
  className,
  size = 'header',
}: {
  className?: string
  size?: 'header' | 'hero'
}) {
  const hero = size === 'hero'

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Image
        src="/images/chope-logo.png"
        alt="Chope"
        width={hero ? 240 : 180}
        height={hero ? 80 : 48}
        className={cn('object-contain', hero ? 'h-16 w-auto sm:h-20' : 'h-8 w-auto sm:h-12')}
        priority
      />
      <span
        className={cn(
          'rounded-full bg-primary/10 font-semibold uppercase tracking-wide text-primary',
          hero ? 'px-2.5 py-0.5 text-[11px]' : 'px-1.5 py-0.5 text-[9px] sm:px-2 sm:text-[11px]'
        )}
      >
        Beta
      </span>
    </div>
  )
}
