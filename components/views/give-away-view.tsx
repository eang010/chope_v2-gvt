'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { Textarea } from '@/components/ui/textarea'
import { categoryOptions } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { MediaCarousel } from '@/components/feed/media-carousel'
import { Gift, ImagePlus, X, MapPin, Clock, Check } from 'lucide-react'
import { createListing, uploadListingImage } from '@/lib/db'
import { prepareListingImageFile } from '@/lib/prepare-listing-image'
import { buildEndsAtIsoInSingapore, todayInSingapore } from '@/lib/singapore-time'

interface GiveAwayViewProps {
  userId: string
  isActive?: boolean
  onNavigate: (nav: 'home') => void
  onListingCreated?: () => void
}

export function GiveAwayView({ userId, isActive = true, onNavigate, onListingCreated }: GiveAwayViewProps) {
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [quantity, setQuantity] = useState<number | undefined>(undefined)
  const [hasEndDate, setHasEndDate] = useState(false)
  const [endDate, setEndDate] = useState(todayInSingapore)
  const [endTime, setEndTime] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [carouselNonce, setCarouselNonce] = useState(0)
  const [collectUnlocked, setCollectUnlocked] = useState(false)
  const [isPreparingPhotos, setIsPreparingPhotos] = useState(false)
  const imagesRef = useRef(images)
  imagesRef.current = images
  const imagePreviewsRef = useRef(imagePreviews)
  imagePreviewsRef.current = imagePreviews

  useEffect(() => {
    if (isActive) return

    imagePreviewsRef.current.forEach((url) => URL.revokeObjectURL(url))
    setImages([])
    setImagePreviews([])
    setTitle('')
    setDescription('')
    setCategory('')
    setLocation('')
    setQuantity(undefined)
    setHasEndDate(false)
    setEndDate(todayInSingapore)
    setEndTime('')
    setIsSubmitted(false)
    setIsSubmitting(false)
    setIsDragging(false)
    setPreviewIndex(0)
    setCarouselNonce((value) => value + 1)
    setCollectUnlocked(false)
    setIsPreparingPhotos(false)
    revealedRef.current = { what: false, quantity: false, collect: false, submit: false }
  }, [isActive])

  const addImageFiles = async (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList).filter(
      (file) =>
        file.type.startsWith('image/') ||
        !file.type ||
        /\.(heic|heif|jpe?g|png|webp|gif)$/i.test(file.name)
    )
    const newFiles = incoming.slice(0, 5 - imagesRef.current.length)
    if (newFiles.length === 0) return

    setIsPreparingPhotos(true)
    try {
      const prepared: File[] = []
      for (const file of newFiles) {
        try {
          prepared.push(await prepareListingImageFile(file))
        } catch (error) {
          console.error('Failed to prepare photo:', error)
        }
      }
      if (prepared.length === 0) {
        alert('Could not use those photos. Try another image or take a new photo.')
        return
      }
      setImages((prev) => [...prev, ...prepared])
      setImagePreviews((prev) => [
        ...prev,
        ...prepared.map((file) => URL.createObjectURL(file)),
      ])
    } finally {
      setIsPreparingPhotos(false)
    }
  }

  const handleSubmit = async () => {
    const trimmedLocation = location.trim()
    const qty = quantity ?? 0
    if (!title || !category || !trimmedLocation || images.length === 0) {
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

      if (uploadedUrls.length !== images.length) {
        alert(
          uploadedUrls.length === 0
            ? 'Failed to upload images'
            : 'Some photos failed to upload. Please try again.'
        )
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
        quantity: qty,
        quantity_remaining: qty,
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
    setPreviewIndex((current) => {
      const nextLen = images.length - 1
      if (nextLen <= 0) return 0
      if (index < current) return current - 1
      if (index === current) return Math.min(current, nextLen - 1)
      return current
    })
  }

  const setCover = (index: number) => {
    if (index <= 0) {
      setPreviewIndex(0)
      setCarouselNonce((value) => value + 1)
      return
    }
    setImages((prev) => {
      const next = [...prev]
      const [picked] = next.splice(index, 1)
      next.unshift(picked)
      return next
    })
    setImagePreviews((prev) => {
      const next = [...prev]
      const [picked] = next.splice(index, 1)
      next.unshift(picked)
      return next
    })
    setPreviewIndex(0)
    setCarouselNonce((value) => value + 1)
  }

  const showWhat = images.length > 0
  const whatReady = Boolean(category && title.trim())
  const showCollect = showWhat && whatReady && collectUnlocked
  const showQuantity = showCollect
  const showSubmit = showCollect && Boolean(location.trim())
  const isValid = showSubmit

  const whatRef = useRef<HTMLElement>(null)
  const quantityRef = useRef<HTMLElement>(null)
  const collectRef = useRef<HTMLElement>(null)
  const submitRef = useRef<HTMLDivElement>(null)
  const revealedRef = useRef({ what: false, quantity: false, collect: false, submit: false })

  useEffect(() => {
    if (!showWhat || !whatReady) {
      setCollectUnlocked(false)
      return
    }
    const timer = window.setTimeout(() => setCollectUnlocked(true), 400)
    return () => window.clearTimeout(timer)
  }, [showWhat, whatReady])

  useEffect(() => {
    const revealed = revealedRef.current
    const scrollTo = (el: HTMLElement | null) => {
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    if (showWhat && !revealed.what) {
      revealed.what = true
      scrollTo(whatRef.current)
    }
    if (showCollect && !revealed.collect) {
      revealed.collect = true
      scrollTo(collectRef.current)
    }
    if (showQuantity && !revealed.quantity) {
      revealed.quantity = true
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
        icon={<Gift className="size-5 text-primary shrink-0 sm:size-6" />}
        title="Got something to share?"
        description="Snap it, tap a category, and list it — let the office chope it up."
      />

      <div className="px-4 md:px-6 space-y-4">
        <div
          className="space-y-2"
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
            <label
              className={cn(
                'block cursor-pointer rounded-2xl border-2 border-dashed transition-colors overflow-hidden bg-muted/40',
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60'
              )}
            >
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
                <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImagePlus className="size-7 text-primary" />
                </div>
                <p className="font-semibold text-foreground">Drop a photo or tap to add</p>
                <p className="text-sm text-muted-foreground">First one is the cover. Up to 5 photos.</p>
                {fileInput}
              </div>
            </label>
          ) : (
            <div
              className={cn(
                'relative overflow-hidden rounded-2xl border-2',
                isDragging ? 'border-primary' : 'border-border'
              )}
            >
              <MediaCarousel
                key={carouselNonce}
                media={imagePreviews.map((url) => ({ type: 'image' as const, url }))}
                alt="Listing photos"
                className="aspect-[16/10]"
                onIndexChange={setPreviewIndex}
              />
              {previewIndex === 0 && (
                <span className="absolute bottom-3 left-3 z-10 rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground pointer-events-none">
                  Cover
                </span>
              )}
            </div>
          )}

          {images.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Tap a photo to make it the cover.</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pt-1 pr-1">
                {imagePreviews.map((preview, index) => {
                  const isCover = index === 0
                  const isActive = index === previewIndex
                  return (
                    <div key={preview} className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setCover(index)}
                        className={cn(
                          'size-16 overflow-hidden rounded-xl bg-muted ring-2 ring-offset-2 ring-offset-background transition-colors',
                          isCover
                            ? 'ring-primary'
                            : isActive
                              ? 'ring-primary/40'
                              : 'ring-transparent hover:ring-border'
                        )}
                        aria-label={isCover ? 'Cover photo' : `Make photo ${index + 1} the cover`}
                      >
                        <img src={preview} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
                      </button>
                      {isCover && (
                        <span className="absolute bottom-1 left-1 rounded bg-primary px-1 py-px text-[9px] font-medium text-primary-foreground pointer-events-none">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 size-5 rounded-full bg-card shadow-sm flex items-center justify-center"
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
                    {isPreparingPhotos ? (
                      <span className="text-[10px] mt-0.5">…</span>
                    ) : null}
                    {fileInput}
                  </label>
                )}
              </div>
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

        {showQuantity && (
        <section
          ref={quantityRef}
          className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div>
            <h2 className="font-semibold text-foreground">How many?</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Optional — leave as N/A if no fixed quantity.</p>
          </div>
          <QuantityStepper
            aria-labelledby="quantity-label"
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={99}
            allowEmpty
            disabled={isSubmitting}
          />
          <span id="quantity-label" className="sr-only">
            Quantity available
          </span>
        </section>
        )}

        {showSubmit && (
        <div ref={submitRef} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting || isPreparingPhotos}
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
