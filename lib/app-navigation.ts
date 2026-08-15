import type { NavItem } from '@/lib/types'

export type AppNavState = {
  nav: NavItem
  urgentOnly: boolean
  focusListingId: string | null
}

const NAV_ITEMS: NavItem[] = ['home', 'lobang', 'give-away', 'my-stuff']

export function isNavItem(value: string): value is NavItem {
  return (NAV_ITEMS as string[]).includes(value)
}

export function defaultAppNavState(): AppNavState {
  return { nav: 'home', urgentOnly: false, focusListingId: null }
}

export function appNavStateFromSearch(search: string): AppNavState {
  const params = new URLSearchParams(search)
  const tab = params.get('tab')
  return {
    nav: tab && isNavItem(tab) ? tab : 'home',
    urgentOnly: params.get('urgent') === '1',
    focusListingId: params.get('focus'),
  }
}

export function appNavStatesEqual(a: AppNavState, b: AppNavState): boolean {
  return (
    a.nav === b.nav &&
    a.urgentOnly === b.urgentOnly &&
    a.focusListingId === b.focusListingId
  )
}

export function urlForAppNavState(state: AppNavState, pathname = '/'): string {
  const params = new URLSearchParams()
  if (state.nav !== 'home') params.set('tab', state.nav)
  if (state.urgentOnly) params.set('urgent', '1')
  if (state.focusListingId) params.set('focus', state.focusListingId)
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

export function historyStatePayload(state: AppNavState): { chope: AppNavState } {
  return { chope: state }
}

export function appNavStateFromHistoryState(data: unknown): AppNavState | null {
  if (!data || typeof data !== 'object' || !('chope' in data)) return null
  const raw = (data as { chope: AppNavState }).chope
  if (!raw || !isNavItem(raw.nav)) return null
  return {
    nav: raw.nav,
    urgentOnly: Boolean(raw.urgentOnly),
    focusListingId: raw.focusListingId ?? null,
  }
}

export function readAppNavStateFromWindow(): AppNavState {
  if (typeof window === 'undefined') return defaultAppNavState()
  return (
    appNavStateFromHistoryState(window.history.state) ??
    appNavStateFromSearch(window.location.search)
  )
}
