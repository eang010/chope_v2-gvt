import { Listing, Chope, User } from './types'
import { addHours, addDays, subDays, subHours } from 'date-fns'

const now = new Date()

export const mockUser: User = {
  id: 'user-1',
  name: 'Aloysius',
  avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ahbeng',
  givenCount: 12,
  chopedCount: 8,
}

export const mockListings: Listing[] = [
  {
    id: '1',
    title: 'Leftover Catering - Sandwiches & Pastries',
    description: 'Event just ended. Got about 15 sandwiches and some pastries left. Please help take, dont want to waste food!',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&h=800&fit=crop' },
    ],
    category: 'Food & Snacks',
    condition: 'new',
    location: 'Level 12, Pantry',
    endsAt: addHours(now, 2),
    giver: {
      id: 'giver-1',
      name: 'Mei Ling',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=meiling',
    },
    quantity: 5,
    quantityRemaining: 4,
    chopeCount: 15,
    createdAt: subHours(now, 1),
  },
  {
    id: '2',
    title: 'Assorted Biscuits & Cookies',
    description: 'CNY leftovers. Still sealed, expiry still far. Got love letters, pineapple tarts, kueh bangkit.',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=800&h=800&fit=crop' },
    ],
    category: 'Food & Snacks',
    condition: 'new',
    location: 'Level 8, Reception',
    endsAt: addDays(now, 2),
    giver: {
      id: 'giver-2',
      name: 'Kumar',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=kumar',
    },
    quantity: 3,
    quantityRemaining: 3,
    chopeCount: 3,
    createdAt: subDays(now, 2),
  },
  {
    id: '3',
    title: 'Notebooks & Pens Bundle',
    description: 'Clearing desk. Got branded notebooks from conferences, some new pens. All still can use!',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&h=800&fit=crop' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&h=800&fit=crop' },
    ],
    category: 'Office Essentials',
    condition: 'like-new',
    location: 'Level 7, Pantry',
    giver: {
      id: 'giver-3',
      name: 'Sarah Tan',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=sarah',
    },
    quantity: 5,
    quantityRemaining: 3,
    chopeCount: 8,
    createdAt: subHours(now, 5),
  },
  {
    id: '4',
    title: 'Extra Bubble Tea - Brown Sugar Fresh Milk',
    description: 'Ordered too many for team. 3 cups extra. Must collect within 1 hour, ice melting already!',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=800&h=800&fit=crop' },
    ],
    category: 'Food & Snacks',
    condition: 'new',
    location: 'Level 10, Lobby',
    endsAt: addHours(now, 1),
    giver: {
      id: 'giver-4',
      name: 'Uncle Lim',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=unclelim',
    },
    quantity: 3,
    quantityRemaining: 2,
    chopeCount: 5,
    createdAt: subHours(now, 0.5),
  },
  {
    id: '5',
    title: 'Anyone want lunch together? Hawker run!',
    description: 'Going to Maxwell Food Centre at 12pm. Can help tabao if you want. Min 3 pax then I go.',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=800&fit=crop' },
    ],
    category: 'Open Jio',
    condition: 'new',
    location: 'Level 5, Lobby',
    endsAt: addHours(now, 3),
    giver: {
      id: 'giver-5',
      name: 'Wei Jie',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=weijie',
    },
    quantity: 5,
    quantityRemaining: 4,
    chopeCount: 5,
    createdAt: subHours(now, 1),
  },
  {
    id: '6',
    title: 'Monitor Stand - Adjustable',
    description: 'Got new standing desk, dont need this anymore. Still working fine, can adjust height.',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&h=800&fit=crop' },
    ],
    category: 'Office Essentials',
    condition: 'used',
    location: 'Level 9, Hot Desk Area',
    giver: {
      id: 'giver-6',
      name: 'Amanda',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=amanda',
    },
    quantity: 1,
    quantityRemaining: 1,
    chopeCount: 7,
    createdAt: subHours(now, 8),
  },
  {
    id: '7',
    title: 'Instant Coffee Sachets - Assorted',
    description: 'Switching to proper coffee. Got Nescafe 3-in-1, kopi-o, some Milo packets too.',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&h=800&fit=crop' },
    ],
    category: 'Food & Snacks',
    condition: 'new',
    location: 'Level 6, Pantry',
    giver: {
      id: 'giver-7',
      name: 'Jason',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=jason',
    },
    quantity: 10,
    quantityRemaining: 8,
    chopeCount: 4,
    createdAt: subDays(now, 1),
  },
  {
    id: '8',
    title: 'Desk Plants - Small Succulents',
    description: 'Propagated too many. Easy to take care, water once a week can already.',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800&h=800&fit=crop' },
    ],
    category: 'Others',
    condition: 'new',
    location: 'Level 11, Near Lift',
    giver: {
      id: 'giver-8',
      name: 'Priya',
      avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=priya',
    },
    quantity: 4,
    quantityRemaining: 4,
    chopeCount: 6,
    createdAt: subHours(now, 3),
  },
]

export const mockChopes: Chope[] = [
  {
    id: 'chope-1',
    listing: mockListings[0],
    message: 'Hi! Can I collect now?',
    quantity: 1,
    createdAt: subHours(now, 0.5),
  },
  {
    id: 'chope-2',
    listing: mockListings[2],
    message: 'Interested in the notebooks!',
    quantity: 2,
    createdAt: subHours(now, 3),
  },
  {
    id: 'chope-3',
    listing: mockListings[6],
    quantity: 2,
    createdAt: subDays(now, 1),
  },
]

export const mockMyListings: Listing[] = [
  {
    id: 'my-1',
    title: 'Keyboard Wrist Rest',
    description: 'Switched to standing desk. This gel wrist rest is still in good condition.',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=800&fit=crop' },
    ],
    category: 'Office Essentials',
    condition: 'used',
    location: 'Level 7, Hot Desk Area',
    endsAt: addDays(now, 3),
    giver: mockUser,
    quantity: 1,
    quantityRemaining: 1,
    chopeCount: 0,
    chopers: [],
    createdAt: subDays(now, 2),
  },
  {
    id: 'my-2',
    title: 'Snack Box - Chips & Crackers',
    description: 'Going on diet. Got Pringles, Twisties, and some crackers. All still sealed!',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=800&h=800&fit=crop' },
    ],
    category: 'Food & Snacks',
    condition: 'new',
    location: 'Level 7, Pantry',
    giver: mockUser,
    quantity: 3,
    quantityRemaining: 1,
    chopeCount: 2,
    chopers: [
      {
        id: 'choper-1',
        name: 'Mei Ling',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=meiling',
        quantity: 1,
        chopedAt: subHours(now, 2),
      },
      {
        id: 'choper-2',
        name: 'Kumar',
        avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=kumar',
        quantity: 1,
        chopedAt: subHours(now, 5),
      },
    ],
    createdAt: subDays(now, 1),
  },
]

export const mockArchivedListings: Listing[] = [
  {
    id: 'archived-1',
    title: 'Old Mouse Pad',
    description: 'Gave away last week. Still usable.',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&h=800&fit=crop' },
    ],
    category: 'Office Essentials',
    condition: 'used',
    location: 'Level 7, Pantry',
    giver: mockUser,
    quantity: 1,
    quantityRemaining: 0,
    chopeCount: 5,
    createdAt: subDays(now, 14),
    isArchived: true,
  },
  {
    id: 'archived-2',
    title: 'Instant Noodles Bundle',
    description: 'All choped and collected!',
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=800&h=800&fit=crop' },
    ],
    category: 'Food & Snacks',
    condition: 'new',
    location: 'Level 7, Pantry',
    giver: mockUser,
    quantity: 5,
    quantityRemaining: 0,
    chopeCount: 8,
    createdAt: subDays(now, 21),
    isArchived: true,
  },
]

export const categories = [
  'All',
  'Food & Snacks',
  'Office Essentials',
  'Open Jio',
  'SOS',
  'Others',
]
