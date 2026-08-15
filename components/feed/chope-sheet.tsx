'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Listing } from '@/lib/types'
import type { Listing as DBListing } from '@/lib/db'
import { createChope, updateListingQuantity, getChopesByUserAndListing } from '@/lib/db'
import { cn } from '@/lib/utils'
import { Check, Hand, Minus, Plus } from 'lucide-react'

interface ChopeSheetProps {
  listing: Listing | DBListing
  userId: string
  trigger?: React.ReactNode
  onChopeSuccess?: (listingId: string, newQuantityRemaining: number) => void
}

function getListingGiverId(listing: Listing | DBListing): string | undefined {
  if ('giver_id' in listing) return listing.giver_id
  return listing.giver?.id
}

export function ChopeSheet({ listing, userId, trigger, onChopeSuccess }: ChopeSheetProps) {
  const [message, setMessage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [duplicateSummary, setDuplicateSummary] = useState({
    reservationCount: 0,
    priorTotalQty: 0,
  })
  
  // Handle both old Listing type and new DBListing type
  const isDBListing = 'quantity_remaining' in listing
  const quantityRemaining = isDBListing ? listing.quantity_remaining : listing.quantityRemaining
  const media = isDBListing ? listing.media : listing.media
  
  const isFullyChoped = quantityRemaining <= 0
  const isOwnListing = getListingGiverId(listing) === userId
  const maxQuantity = quantityRemaining

  const disabledButtonClass = cn(
    'w-full rounded-xl font-semibold',
    trigger ? 'h-9' : 'h-12 text-base'
  )

  const incrementQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity(q => q + 1)
    }
  }
  
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1)
    }
  }
  
  const performCreate = async (): Promise<boolean> => {
    const chope = await createChope(userId, listing.id, message || null, quantity)

    if (!chope) {
      setIsSubmitting(false)
      return false
    }

    const newQty = quantityRemaining - quantity
    const updated = await updateListingQuantity(listing.id, newQty)

    if (!updated) {
      setIsSubmitting(false)
      return false
    }

    setIsSubmitted(true)
    setTimeout(() => {
      setIsOpen(false)
      onChopeSuccess?.(listing.id, newQty)
      setTimeout(() => {
        setIsSubmitted(false)
        setIsSubmitting(false)
        setMessage('')
        setQuantity(1)
      }, 300)
    }, 1500)
    return true
  }

  const handleSubmit = async () => {
    if (isFullyChoped || isOwnListing) return

    setIsSubmitting(true)
    try {
      const existing = await getChopesByUserAndListing(userId, listing.id)
      if (existing.length > 0) {
        const priorTotalQty = existing.reduce((s, r) => s + r.quantity, 0)
        setDuplicateSummary({
          reservationCount: existing.length,
          priorTotalQty,
        })
        setDuplicateDialogOpen(true)
        setIsSubmitting(false)
        return
      }

      await performCreate()
    } catch {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDuplicateChope = () => {
    setDuplicateDialogOpen(false)
    setIsSubmitting(true)
    void performCreate()
  }
  
  if (isFullyChoped) {
    return (
      <Button
        disabled
        size={trigger ? 'sm' : 'default'}
        className={disabledButtonClass}
        variant="secondary"
      >
        Fully choped
      </Button>
    )
  }

  if (isOwnListing) {
    return (
      <Button
        disabled
        size={trigger ? 'sm' : 'default'}
        className={disabledButtonClass}
        variant="secondary"
      >
        Your listing
      </Button>
    )
  }

  const listingId = listing.id

  return (
    <>
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          setIsSubmitted(false)
          setIsSubmitting(false)
        }
      }}
    >
      <SheetTrigger asChild>
        {trigger || (
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base h-12 rounded-xl">
            <Hand className="size-5 mr-2" />
            Chope!
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="bg-card gap-0 overflow-y-auto rounded-t-xl p-0 [&>button]:hidden"
      >
        <SheetHeader className="text-left p-4 pb-0">
          <SheetTitle className="text-xl">
            {isSubmitted ? 'Steady!' : 'Confirm your chope'}
          </SheetTitle>
          <SheetDescription>
            {isSubmitted
              ? 'You got it! The item is yours.'
              : 'Reserve this item now. First come, first served!'}
          </SheetDescription>
        </SheetHeader>
        
        <div className="px-4 pb-4">
          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="size-16 rounded-full bg-success/20 flex items-center justify-center">
                <Check className="size-8 text-success" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground mb-1">
                  {quantity} {quantity === 1 ? 'item' : 'items'} choped!
                </p>
                <p className="text-muted-foreground text-sm">
                  Contact the giver to arrange collection.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Item preview */}
              <div className="flex gap-3 p-3 bg-muted/50 rounded-xl mb-4">
                <img
                  src={media?.[0]?.url}
                  alt={listing.title}
                  className="size-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{listing.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-3">{listing.location}</p>
                  <p className="text-xs text-primary font-medium">
                    {quantityRemaining} left
                  </p>
                </div>
              </div>
              
              {/* Quantity selector - only show if more than 1 available */}
              {maxQuantity > 1 && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    How many you want?
                  </label>
                  <div className="flex items-center justify-center gap-4 p-3 bg-muted/50 rounded-xl">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className={cn(
                        'size-10 rounded-full flex items-center justify-center transition-colors',
                        quantity <= 1
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/20 text-primary hover:bg-primary/30'
                      )}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-5" />
                    </button>
                    <span className="text-2xl font-bold text-foreground w-12 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQuantity}
                      disabled={quantity >= maxQuantity}
                      className={cn(
                        'size-10 rounded-full flex items-center justify-center transition-colors',
                        quantity >= maxQuantity
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/20 text-primary hover:bg-primary/30'
                      )}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-5" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Message input */}
              <div className="space-y-2">
                <label htmlFor={`chope-message-${listingId}`} className="text-sm font-medium text-foreground">
                  Drop a short note (optional)
                </label>
                <Textarea
                  id={`chope-message-${listingId}`}
                  placeholder="e.g., Hi! Can collect this weekend?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[80px] bg-background resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/200
                </p>
              </div>
            </>
          )}
        </div>
        
        {!isSubmitted && (
          <SheetFooter className="p-4 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                'w-full h-12 text-base font-semibold rounded-xl',
                'bg-primary hover:bg-primary/90 text-primary-foreground'
              )}
            >
              <Hand className="size-5 mr-2" />
              {isSubmitting
                ? 'Hold on…'
                : `Chope ${quantity > 1 ? `${quantity} items` : 'Now'}!`}
            </Button>
            <SheetClose asChild>
              <Button variant="outline" className="w-full h-11 rounded-xl">
                Cancel lah
              </Button>
            </SheetClose>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>

      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chope this listing again?</AlertDialogTitle>
            <AlertDialogDescription>
              You already have {duplicateSummary.reservationCount}{' '}
              {duplicateSummary.reservationCount === 1 ? 'chope' : 'chopes'} on this listing (
              {duplicateSummary.priorTotalQty} item
              {duplicateSummary.priorTotalQty === 1 ? '' : 's'} total). Add another reservation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button type="button" onClick={handleConfirmDuplicateChope}>
              Continue
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
