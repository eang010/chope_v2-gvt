'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Bug,
  CircleHelp,
  Heart,
  ImagePlus,
  Lightbulb,
  MessageCircleHeart,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024

const FEEDBACK_TYPES = [
  {
    id: 'bug',
    label: 'Bug Report',
    hint: "Something's broken",
    descriptionPlaceholder: 'What happened?',
    icon: Bug,
  },
  {
    id: 'feature',
    label: 'Feature Request',
    hint: 'I have an idea',
    descriptionPlaceholder: "Describe the feature you'd like to see..",
    icon: Lightbulb,
  },
  {
    id: 'feedback',
    label: 'Feedback',
    hint: 'General thoughts',
    descriptionPlaceholder: 'Share your thoughts..',
    icon: Heart,
  },
  {
    id: 'question',
    label: 'Question',
    hint: 'I need help',
    descriptionPlaceholder: 'What do you need help with?',
    icon: CircleHelp,
  },
] as const

type FeedbackTypeId = (typeof FEEDBACK_TYPES)[number]['id']

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Could not read image'))
    }
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.readAsDataURL(file)
  })
}

export function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [type, setType] = useState<FeedbackTypeId | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [screenshotName, setScreenshotName] = useState<string | null>(null)
  const [screenshotData, setScreenshotData] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    authClient.getSession().then(({ data }) => {
      if (cancelled) return
      setEmail(data?.user?.email ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const resetForm = () => {
    setRating(null)
    setHoverRating(null)
    setType(null)
    setTitle('')
    setDescription('')
    setScreenshotName(null)
    setScreenshotData(null)
    setError(null)
    setIsDragging(false)
  }

  const addScreenshot = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      setError('Screenshot must be 5MB or smaller')
      return
    }
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setScreenshotData(dataUrl)
      setScreenshotName(file.name)
      setError(null)
    } catch {
      setError('Could not read that image')
    }
  }

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please rate your experience')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          type,
          title: title.trim(),
          description: description.trim(),
          screenshot: screenshotData,
        }),
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        setError(data?.error || 'Could not send feedback. Please try again.')
        return
      }

      setOpen(false)
      resetForm()
      toast({
        title: 'Thanks for your feedback! 🙂',
        variant: 'success',
        duration: 4000,
      })
    } catch {
      setError('Could not send feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 mx-auto flex h-[3.75rem] w-full max-w-lg items-center justify-end px-4 md:max-w-3xl md:px-8 lg:max-w-5xl lg:px-10 xl:max-w-6xl">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-primary bg-primary text-sm font-medium text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90 md:w-auto md:px-4"
          aria-label="Send feedback"
        >
          <MessageCircleHeart className="size-5 shrink-0" />
          <span className="hidden md:inline">Feedback</span>
        </button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) resetForm()
        }}
      >
        <DialogContent
          className="max-h-[min(90dvh,40rem)] gap-0 overflow-y-auto rounded-2xl p-5 sm:max-w-md"
          showCloseButton
        >
          <DialogHeader className="pr-6 text-left">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-5 text-primary" />
              We&apos;d love to hear from you!
            </DialogTitle>
            <DialogDescription>
              Your feedback helps us make Chope better for everyone.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-1 text-sm font-medium text-foreground">Rate your experience</p>
              <p className="mb-3 text-xs text-muted-foreground">
                From 1 (poor) to 5 (excellent).
              </p>
              <div
                className="flex items-center justify-center gap-1.5"
                onMouseLeave={() => setHoverRating(null)}
              >
                {[1, 2, 3, 4, 5].map((value) => {
                  const active = (hoverRating ?? rating ?? 0) >= value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        if (rating !== value) {
                          setType(null)
                          setTitle('')
                          setDescription('')
                          setScreenshotName(null)
                          setScreenshotData(null)
                          setError(null)
                        }
                        setRating(value)
                      }}
                      onMouseEnter={() => setHoverRating(value)}
                      className="rounded-full p-1 transition-transform hover:scale-110"
                      aria-label={`Rate ${value} out of 5`}
                      aria-pressed={rating === value}
                    >
                      <Heart
                        className={cn(
                          'size-8',
                          active ? 'fill-primary text-primary' : 'text-muted-foreground'
                        )}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {rating != null && (
              <>
            <div>
              <p className="mb-1 text-sm font-medium text-foreground">Any feedback? (Optional)</p>
              <div className="grid grid-cols-2 gap-2">
                {FEEDBACK_TYPES.map((option) => {
                  const Icon = option.icon
                  const selected = type === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setType(option.id)}
                      className={cn(
                        'flex items-start gap-2.5 rounded-xl border p-3 text-left transition-colors',
                        selected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-muted/60 hover:border-primary/40'
                      )}
                    >
                      <Icon
                        className={cn(
                          'mt-0.5 size-4 shrink-0',
                          selected ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      <span>
                        <span className="block text-sm font-medium text-foreground">
                          {option.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">{option.hint}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {type != null && (
              <>
            <div className="space-y-1.5">
              <Label htmlFor="feedback-title">Title</Label>
              <Input
                id="feedback-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of your feedback"
                className="rounded-xl bg-muted border-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="feedback-description">Description</Label>
              <Textarea
                id="feedback-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  FEEDBACK_TYPES.find((option) => option.id === type)?.descriptionPlaceholder
                }
                className="min-h-24 rounded-xl bg-muted border-transparent"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Screenshot (optional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void addScreenshot(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
              {screenshotData ? (
                <div className="relative overflow-hidden rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element -- preview is a local data URL */}
                  <img src={screenshotData} alt="Screenshot preview" className="max-h-36 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotData(null)
                      setScreenshotName(null)
                    }}
                    className="absolute top-2 right-2 rounded-full bg-background/90 p-1 shadow"
                    aria-label="Remove screenshot"
                  >
                    <X className="size-4" />
                  </button>
                  {screenshotName && (
                    <p className="truncate px-3 py-1.5 text-xs text-muted-foreground">{screenshotName}</p>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    void addScreenshot(e.dataTransfer.files[0])
                  }}
                  className={cn(
                    'flex w-full flex-col items-center gap-1 rounded-xl border border-dashed px-4 py-6 text-center transition-colors',
                    isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/40'
                  )}
                >
                  <ImagePlus className="size-6 text-muted-foreground" />
                  <span className="text-sm text-foreground">Drop an image or click to upload</span>
                  <span className="text-xs text-muted-foreground">Max 5MB</span>
                </button>
              )}
            </div>
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {email && (
              <p className="text-center text-xs text-muted-foreground">Submitting as {email}</p>
            )}

            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="h-11 w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="size-4" />
              {isSubmitting ? 'Sending…' : type ? 'Send Feedback' : 'Submit rating'}
            </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
