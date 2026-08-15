'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { Textarea } from '@/components/ui/textarea'
import { categoryOptions } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { Gift, ImagePlus, X, MapPin, Clock, Check } from 'lucide-react'
import { createListing, uploadListingImage } from '@/lib/db'
import { buildEndsAtIsoInSingapore, todayInSingapore } from '@/lib/singapore-time'

function useUnlockOnLeave(
  ref: React.RefObject<HTMLElement | null>,
  canUnlock: boolean,
  unlocked: boolean,
  setUnlocked: (value: boolean) => void,
) {
  useEffect(() => {
    if (!canUnlock) {
      if (unlocked) setUnlocked(false)
      return
    }
    if (unlocked) return

    const node = ref.current
    if (!node) return

    const onPointerDown = (event: PointerEvent) => {
      if (node.contains(event.target as Node)) return
      setUnlocked(true)
    }

    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget
      if (next instanceof Node && node.contains(next)) return
      setUnlocked(true)
    }

    document.addEventListener('pointerdown', onPointerDown)
    node.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      node.removeEventListener('focusout', onFocusOut)
    }
  }, [canUnlock, unlocked, ref, setUnlocked])
}

interface GiveAwayViewProps {
  userId: string
  onNavigate: (nav: 'home') => void
  onListingCreated?: () => void
}

export function GiveAwayView({ userId, onNavigate, onListingCreated }: GiveAwayViewProps) {
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [hasEndDate, setHasEndDate] = useState(false)
  const [endDate, setEndDate] = useState(todayInSingapore)
  const [endTime, setEndTime] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [quantityUnlocked, setQuantityUnlocked] = useState(false)
  const [collectUnlocked, setCollectUnlocked] = useState(false)

  const addImageFiles = (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList).filter((file) => file.type.startsWith('image/'))
    const newFiles = incoming.slice(0, 5 - images.length)
    if (newFiles.length === 0) return
    setImages((prev) => [...prev, ...newFiles])
    setImagePreviews((prev) => [...prev, ...newFiles.map((file) => URL.createObjectURL(file))])
  }

  const handleSubmit = async () => {
    const trimmedLocation = location.trim()
    if (!title || !category || !trimmedLocation || images.length === 0 || quantity < 1) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const endsAt = buildEndsAtIsoInSingapore(hasEndDate, endDate, endTime)

      const uploadedUrls: string[] = []
      for (const file of images) {
        const url = await uploadListingImage(file)
        if (url) {
          uploadedUrls.push(url)
        }
      }

      if (uploadedUrls.length === 0) {
        alert('Failed to upload images')
        setIsSubmitting(false)
        return
      }

      const listingData = {
        giver_id: userId,
        title,
        description: description.trim() || null,
        category,
        condition: 'new',
        location: trimmedLocation,
        quantity,
        quantity_remaining: quantity,
        ends_at: endsAt,
        is_archived: false,
      }

      const media = uploadedUrls.map((url, index) => ({
        type: 'image' as const,
        url,
        display_order: index,
      }))

      const result = await createListing(listingData, media)

      if (result) {
        onListingCreated?.()
        setIsSubmitted(true)
        setTimeout(() => {
          onNavigate('home')
        }, 1500)
      } else {
        alert('Failed to create listing. Please try again.')
      }
    } catch (error) {
      console.error('Error creating listing:', error)
      alert('Error creating listing. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addImageFiles(e.target.files)
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    const newPreviews = imagePreviews.slice()
    URL.revokeObjectURL(newPreviews[index])
    newPreviews.splice(index, 1)
    setImagePreviews(newPreviews)
  }

  const showWhat = images.length > 0
  const whatReady = Boolean(category && title.trim())
  const showQuantity = showWhat && whatReady && quantityUnlocked
  const showCollect = showQuantity && collectUnlocked && quantity >= 1
  const showSubmit = showCollect && Boolean(location.trim())
  const isValid = showSubmit

  const whatRef = useRef<HTMLElement>(null)
  const quantityRef = useRef<HTMLElement>(null)
  const collectRef = useRef<HTMLElement>(null)
  const submitRef = useRef<HTMLDivElement>(null)
  const revealedRef = useRef({ what: false, quantity: false, collect: false, submit: false })

  useUnlockOnLeave(whatRef, showWhat && whatReady, quantityUnlocked, setQuantityUnlocked)

  useEffect(() => {
    if (!showQuantity) {
      setCollectUnlocked(false)
      return
    }
    const timer = window.setTimeout(() => setCollectUnlocked(true), 400)
    return () => window.clearTimeout(timer)
  }, [showQuantity])

  useEffect(() => {
    const revealed = revealedRef.current
    const scrollTo = (el: HTMLElement | null) => {
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    if (showWhat && !revealed.what) {
      revealed.what = true
      scrollTo(whatRef.current)
    }
    if (showQuantity && !revealed.quantity) {
      revealed.quantity = true
      scrollTo(quantityRef.current)
    }
    if (showCollect && !revealed.collect) {
      revealed.collect = true
      scrollTo(collectRef.current)
    }
    if (showSubmit && !revealed.submit) {
      revealed.submit = true
      scrollTo(submitRef.current)
    }
    if (!showWhat) revealed.what = false
    if (!showQuantity) revealed.quantity = false
    if (!showCollect) revealed.collect = false
    if (!showSubmit) revealed.submit = false
  }, [showWhat, showQuantity, showCollect, showSubmit])

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="size-20 rounded-full bg-success/20 flex items-center justify-center mb-4">
          <Check className="size-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Steady!</h2>
        <p className="text-muted-foreground mb-6">
          Your item has been listed. People can now chope it!
        </p>
        <Button onClick={() => onNavigate('home')} className="bg-primary hover:bg-primary/90">
          Back to Home
        </Button>
      </div>
    )
  }

  const fileInput = (
    <input
      type="file"
      multiple
      accept="image/*"
      onChange={handleImageUpload}
      className="hidden"
    />
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5 pt-4 pb-8">
      <PageHeader
        icon={<Gift className="size-6 text-primary shrink-0" />}
        title="Got something to share?"
        description="Snap it, tap a category, and list it — the office will chope it up."
      />

      <div className="px-4 md:px-6 space-y-4">
        <div className="space-y-2">
        <label
          className={cn(
            'block cursor-pointer rounded-2xl border-2 border-dashed transition-colors overflow-hidden',
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60',
            images.length === 0 && 'bg-muted/40'
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            if (e.dataTransfer.files.length) addImageFiles(e.dataTransfer.files)
          }}
        >
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
              <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                <ImagePlus className="size-7 text-primary" />
              </div>
              <p className="font-semibold text-foreground">Drop a photo or tap to add</p>
              <p className="text-sm text-muted-foreground">First one is the cover. Up to 5 photos.</p>
              {fileInput}
            </div>
          ) : (
            <div className="relative aspect-[16/10] bg-muted">
              <img
                src={imagePreviews[0]}
                alt="Cover"
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-3 left-3 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                Cover
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  removeImage(0)
                }}
                className="absolute top-3 right-3 size-8 rounded-full bg-card/90 flex items-center justify-center shadow-sm"
                aria-label="Remove cover photo"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
        </label>

        {images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {imagePreviews.slice(1).map((preview, i) => {
              const index = i + 1
              return (
                <div key={preview} className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <img src={preview} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 size-5 rounded-full bg-card/90 flex items-center justify-center"
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )
            })}
            {images.length < 5 && (
              <label className="size-16 shrink-0 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
                <ImagePlus className="size-5" />
                {fileInput}
              </label>
            )}
          </div>
        )}
        </div>

        {showWhat && (
        <section
          ref={whatRef}
          className="rounded-2xl border border-border bg-card p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div>
            <h2 className="font-semibold text-foreground">What is it?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Pick a vibe, then name it.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {categoryOptions.map((option) => {
              const Icon = option.icon
              const selected = category === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCategory(option.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors',
                    selected
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  )}
                  aria-pressed={selected}
                >
                  <span
                    className={cn(
                      'flex size-10 items-center justify-center rounded-full',
                      selected ? 'bg-primary text-primary-foreground' : 'bg-card'
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="text-xs font-medium leading-tight">{option.label}</span>
                </button>
              )
            })}
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              placeholder="e.g., Desk plant looking for a new home"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="Optional — anything they should know?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              className="min-h-[88px]"
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
          </div>
        </section>
        )}

        {showQuantity && (
        <section
          ref={quantityRef}
          className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div>
            <h2 className="font-semibold text-foreground">How many?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">How many can people chope?</p>
          </div>
          <QuantityStepper
            aria-labelledby="quantity-label"
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={99}
            disabled={isSubmitting}
          />
          <span id="quantity-label" className="sr-only">
            Quantity available
          </span>
        </section>
        )}

        {showCollect && (
        <section
          ref={collectRef}
          className="rounded-2xl border border-border bg-card p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div>
            <h2 className="font-semibold text-foreground">How to collect?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Tell them where to find you.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="collection-instructions" className="text-sm font-medium text-foreground flex items-center gap-2">
              <MapPin className="size-4" />
              Collection instructions <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="collection-instructions"
              placeholder="e.g. Level 7 pantry, weekdays after 3pm — ping me on Teams!"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={250}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground text-right">{location.length}/250</p>
          </div>

          <button
            type="button"
            onClick={() => setHasEndDate(!hasEndDate)}
            className={cn(
              'w-full p-3 rounded-xl border flex items-center gap-3 transition-colors',
              hasEndDate ? 'border-primary bg-primary/10' : 'border-border'
            )}
          >
            <Clock className={cn('size-5', hasEndDate ? 'text-primary' : 'text-muted-foreground')} />
            <div className="text-left flex-1">
              <p className="font-medium text-sm text-foreground">Set end date</p>
              <p className="text-xs text-muted-foreground">Create urgency with a deadline</p>
            </div>
            <div
              className={cn(
                'size-5 rounded-full border-2 flex items-center justify-center',
                hasEndDate ? 'border-primary bg-primary' : 'border-muted-foreground'
              )}
            >
              {hasEndDate && <Check className="size-3 text-primary-foreground" />}
            </div>
          </button>

          {hasEndDate && (
            <div className="datetime-fields">
              <div className="space-y-1 min-w-0 w-full">
                <label htmlFor="end-date" className="text-xs text-muted-foreground">Date (SGT)</label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-11 w-full min-w-0"
                />
              </div>
              <div className="space-y-1 min-w-0 w-full">
                <label htmlFor="end-time" className="text-xs text-muted-foreground">Time (SGT)</label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-11 w-full min-w-0"
                />
              </div>
            </div>
          )}
        </section>
        )}

        {showSubmit && (
        <div ref={submitRef} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={cn(
            'w-full h-12 text-base font-semibold rounded-xl',
            'bg-primary hover:bg-primary/90 text-primary-foreground'
          )}
        >
          <Gift className="size-5 mr-2" />
          {isSubmitting ? 'Creating...' : 'List it, lah!'}
        </Button>
        </div>
        )}
      </div>
    </div>
  )
}
