'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { categories } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { Gift, ImagePlus, X, MapPin, Clock, Check } from 'lucide-react'
import { createListing, uploadListingImage } from '@/lib/db'
import { buildEndsAtIsoInSingapore, todayInSingapore } from '@/lib/singapore-time'

const conditions = [
  { value: 'new', label: 'New', description: 'Never used, still in packaging' },
  { value: 'like-new', label: 'Like New', description: 'Used once or twice, perfect condition' },
  { value: 'used', label: 'Used', description: 'Visible signs of use but works perfectly' },
  { value: 'well-loved', label: 'Well Loved', description: 'Shows wear but still has life left' },
]

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
  const [condition, setCondition] = useState('')
  const [location, setLocation] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [hasEndDate, setHasEndDate] = useState(false)
  const [endDate, setEndDate] = useState(todayInSingapore)
  const [endTime, setEndTime] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    const trimmedLocation = location.trim()
    if (!title || !category || !condition || !trimmedLocation || images.length === 0 || quantity < 1) {
      alert('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const endsAt = buildEndsAtIsoInSingapore(hasEndDate, endDate, endTime)

      // Upload images to Supabase Storage
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
        description,
        category,
        condition,
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
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files).slice(0, 5 - images.length)
      setImages([...images, ...newFiles])
      
      // Create previews for display
      const newPreviews = newFiles.map(file => URL.createObjectURL(file))
      setImagePreviews([...imagePreviews, ...newPreviews])
    }
    // Reset input
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    const newPreviews = imagePreviews.slice()
    URL.revokeObjectURL(newPreviews[index])
    newPreviews.splice(index, 1)
    setImagePreviews(newPreviews)
  }

  const isValid =
    title && description && category && condition && location.trim() && images.length > 0 && quantity >= 1

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

  return (
    <div className="space-y-6 pt-4 pb-8">
      <PageHeader
        icon={<Gift className="size-6 text-primary shrink-0" />}
        title="List Away"
        description="Share anything and everything with the community"
      />

      <div className="px-4 space-y-6">
        {/* Image upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Photos <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground">
            Add up to 5 photos. First photo will be the cover.
          </p>
          <div className="flex gap-2 flex-wrap">
            {images.map((img, index) => (
              <div key={index} className="relative size-20 rounded-lg overflow-hidden bg-muted">
                <img src={imagePreviews[index]} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 size-5 rounded-full bg-card/90 flex items-center justify-center"
                >
                  <X className="size-3" />
                </button>
                {index === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground text-[10px] text-center py-0.5">
                    Cover
                  </span>
                )}
              </div>
            ))}
            {images.length < 5 && (
              <>
                <label className="size-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
                  <ImagePlus className="size-6 mb-1" />
                  <span className="text-xs">Add</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium text-foreground">
            Title <span className="text-destructive">*</span>
          </label>
          <Input
            id="title"
            placeholder="e.g., Desk plant"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-foreground">
            Description <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="description"
            placeholder="My plants are growing too fast, looking for a new home!"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <label id="quantity-label" className="text-sm font-medium text-foreground">
            Quantity available <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground">
            How many of this items?
          </p>
          <QuantityStepper
            aria-labelledby="quantity-label"
            value={quantity}
            onChange={setQuantity}
            min={1}
            max={99}
            disabled={isSubmitting}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Category <span className="text-destructive">*</span>
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full h-11">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.filter(c => c !== 'All').map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Condition */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Condition <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {conditions.map((cond) => (
              <button
                key={cond.value}
                onClick={() => setCondition(cond.value)}
                className={cn(
                  'p-3 rounded-xl border text-left transition-colors',
                  condition === cond.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <p className="font-medium text-sm text-foreground">{cond.label}</p>
                <p className="text-xs text-muted-foreground">{cond.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Collection instructions */}
        <div className="space-y-2">
          <label htmlFor="collection-instructions" className="text-sm font-medium text-foreground flex items-center gap-2">
            <MapPin className="size-4" />
            Collection instructions <span className="text-destructive">*</span>
          </label>
          <p className="text-xs text-muted-foreground">
            Where and how to collect (time, contact, etc.)
          </p>
          <Textarea
            id="collection-instructions"
            placeholder="e.g. Level 7 pantry, weekdays after 3pm - ping me on Teams if you're coming by!"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={250}
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground text-right">{location.length}/250</p>
        </div>

        {/* End date toggle */}
        <div className="space-y-3">
          <button
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
            <div className={cn(
              'size-5 rounded-full border-2 flex items-center justify-center',
              hasEndDate ? 'border-primary bg-primary' : 'border-muted-foreground'
            )}>
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
        </div>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={cn(
            'w-full h-12 text-base font-semibold rounded-xl',
            'bg-primary hover:bg-primary/90 text-primary-foreground'
          )}
        >
          <Gift className="size-5 mr-2" />
          {isSubmitting ? 'Creating...' : 'List Item'}
        </Button>
      </div>
    </div>
  )
}
