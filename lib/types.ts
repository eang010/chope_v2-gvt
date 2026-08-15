export interface Choper {
  id: string
  name: string
  avatar: string
  quantity: number
  chopedAt: Date
}

export interface Listing {
  id: string
  title: string
  description: string
  media: { type: 'image' | 'video'; url: string }[]
  category: string
  condition: 'new' | 'like-new' | 'used' | 'well-loved'
  location: string
  endsAt?: Date
  giver: {
    id: string
    name: string
    avatar: string
    email?: string
    agency?: string
    officeFloor?: string
  }
  quantity: number
  quantityRemaining: number
  chopeCount: number
  chopers?: Choper[]
  createdAt: Date
  isArchived?: boolean
}

export interface Chope {
  id: string
  listing: Listing
  message?: string
  quantity: number
  createdAt: Date
}

export interface User {
  id: string
  name: string
  avatar: string
  email?: string
  agency?: string
  officeFloor?: string
  givenCount: number
  chopedCount: number
}

export type NavItem = 'home' | 'lobang' | 'give-away' | 'my-stuff'

export type NavigateOptions = {
  urgentOnly?: boolean
  focusListingId?: string
}
