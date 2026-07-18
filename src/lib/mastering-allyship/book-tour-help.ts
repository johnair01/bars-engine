export const BOOK_TOUR_HELP_SOURCE = 'webinar-book-tour-help'
export const BOOK_TOUR_HELP_HREF = '/mastering-allyship/book-tour/help'
export const BOOK_TOUR_HELP_OPTIONS = [
  { key: 'host', label: 'Host a gathering or connect a venue' },
  { key: 'connect', label: 'Introduce a community, organization, or collaborator' },
  { key: 'promote', label: 'Help invite people or share the tour' },
  { key: 'produce', label: 'Help with event production, accessibility, or logistics' },
  { key: 'resource', label: 'Offer financial or material support' },
  { key: 'attend', label: 'Attend a future stop or bring someone with me' },
] as const
export type BookTourHelpKey = (typeof BOOK_TOUR_HELP_OPTIONS)[number]['key']
export const BOOK_TOUR_HELP_KEYS = new Set<string>(BOOK_TOUR_HELP_OPTIONS.map((option) => option.key))
