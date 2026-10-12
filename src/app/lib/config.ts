import type { AdminRole, CategoryId, Permission } from './types'

/**
 * Platform configuration. In production these values come from the admin
 * settings service — nothing here is a real rate, tax or exchange rate.
 */
export const REGION = {
  code: 'ZA',
  country: 'South Africa',
  currency: 'ZAR',
  locale: 'en-ZA',
  timeZone: 'Africa/Johannesburg',
  phoneHint: '082 123 4567',
  postalHint: '2196',
  provinces: [
    'Eastern Cape',
    'Free State',
    'Gauteng',
    'KwaZulu-Natal',
    'Limpopo',
    'Mpumalanga',
    'North West',
    'Northern Cape',
    'Western Cape',
  ],
}

export const TAX = { label: 'VAT', rate: 0.15, includedInPrices: true }

export const MARKETPLACE_FEE = { percent: 10, label: 'Marketplace fee (demo setting)' }

export const DELIVERY_METHODS = [
  { id: 'standard', label: 'Standard courier' },
  { id: 'express', label: 'Express courier' },
  { id: 'collect', label: 'Collect from seller' },
] as const

export const PAYMENT_METHODS = [
  { id: 'card', label: 'Card via payment provider', note: 'You would be redirected to a hosted, PCI-compliant payment page. No provider is connected in demo mode.' },
  { id: 'eft', label: 'Instant EFT', note: 'Bank-hosted flow through a payment provider. Not connected in demo mode.' },
  { id: 'voucher', label: 'Store credit / voucher', note: 'Demo only.' },
] as const

export const PROMO_CODES: Record<string, { label: string; percent?: number; flat?: number; minSpend: number }> = {
  WELCOME10: { label: '10% off first order (demo code)', percent: 10, minSpend: 500 },
  BLENDD100: { label: 'R100 off orders over R1,500 (demo code)', flat: 100, minSpend: 1500 },
}

export const CATEGORIES: { id: CategoryId; label: string; short: string; blurb: string }[] = [
  { id: 'wigs', label: 'Wigs', short: 'Wigs', blurb: 'Lace fronts, glueless, bobs and full lace.' },
  { id: 'bundles', label: 'Hair bundles', short: 'Bundles', blurb: 'Wefted hair by texture, length and origin.' },
  { id: 'closures', label: 'Closures', short: 'Closures', blurb: '4x4, 5x5 and 6x6 closures.' },
  { id: 'frontals', label: 'Frontals', short: 'Frontals', blurb: '13x4 and 13x6 lace frontals.' },
  { id: 'ponytails', label: 'Clip-ins & ponytails', short: 'Clip-ins', blurb: 'Quick, damage-free length and volume.' },
  { id: 'accessories', label: 'Accessories & tools', short: 'Tools', blurb: 'Caps, glue, brushes, stands, bonnets.' },
  { id: 'wholesale', label: 'Wholesale & bulk', short: 'Wholesale', blurb: 'Volume pricing from verified suppliers.' },
]

export const TEXTURES = ['Straight', 'Body wave', 'Loose wave', 'Deep wave', 'Water wave', 'Curly', 'Kinky curly', 'Coily', 'Yaki']
export const LACE_TYPES = ['4x4', '5x5', '6x6', '13x4', '13x6', 'Full lace']
export const CONSTRUCTIONS = ['Lace front', 'Full lace', 'Closure wig', 'Glueless', 'Headband wig']

export const PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: ['users', 'sellers', 'listings', 'catalogue', 'orders', 'disputes', 'reviews', 'merchandising', 'fees', 'payouts', 'fraud', 'support', 'content', 'audit', 'settings'],
  moderator: ['sellers', 'listings', 'catalogue', 'reviews', 'fraud', 'content'],
  support: ['users', 'orders', 'disputes', 'support', 'reviews'],
  finance: ['orders', 'disputes', 'fees', 'payouts', 'fraud', 'audit'],
}

export const ANNOUNCEMENT = 'Welcome to the BLENDD marketplace preview — a demo with seeded sample data. Delivery times and fees are set by each seller.'
