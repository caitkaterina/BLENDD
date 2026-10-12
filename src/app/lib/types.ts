export type CategoryId =
  | 'wigs'
  | 'bundles'
  | 'closures'
  | 'frontals'
  | 'ponytails'
  | 'accessories'
  | 'wholesale'

export type SellerType = 'reseller' | 'retailer' | 'wholesaler' | 'manufacturer'
export type HairType = 'human' | 'synthetic' | 'blended'
export type ListingStatus = 'published' | 'draft' | 'archived' | 'pending_review' | 'rejected'

export interface ShippingRate {
  fee: number
  days: [number, number]
  freeOver?: number
}

export interface Seller {
  id: string
  handle: string
  name: string
  types: SellerType[]
  /** Only true when the (demo) verification record is confirmed by an admin. */
  verified: boolean
  verificationStatus: 'verified' | 'pending' | 'not_submitted' | 'rejected'
  rating?: number
  reviewCount: number
  city: string
  province: string
  showLocation: boolean
  dispatch: string
  cover: string
  about: string
  joined: string
  returnsPolicy: string
  shippingPolicy: string
  acceptsEnquiries: boolean
  shipping: { standard: ShippingRate; express?: ShippingRate; collect?: boolean }
  status: 'active' | 'suspended' | 'applicant'
}

export interface OptionDef {
  key: string
  label: string
  values: { value: string; priceDelta?: number }[]
}

export interface WholesaleInfo {
  moq: number
  tiers: { min: number; price: number }[]
  leadTime: string
  processing: string
  samples: boolean
  customisation: boolean
  acceptsEnquiries: boolean
  retailAlso: boolean
}

export interface Product {
  id: string
  title: string
  category: CategoryId
  sellerId: string
  images: string[]
  /** Retail base price in ZAR (rand). For wholesale-only listings, the first tier price. */
  price: number
  compareAt?: number
  sku: string
  stock: number
  lowStockAt: number
  hairType?: HairType
  texture?: string
  construction?: string
  lace?: string
  origin?: string
  processing?: string
  density?: string
  colors: string[]
  lengths: number[]
  options: OptionDef[]
  description: string
  specs: Record<string, string>
  wholesale?: WholesaleInfo
  status: ListingStatus
  createdAt: string
  popularity: number
  rating?: number
  reviewCount: number
  demo?: boolean
}

export interface Review {
  id: string
  productId?: string
  sellerId: string
  author: string
  rating: number
  title: string
  body: string
  date: string
  verifiedPurchase: boolean
  images?: string[]
  sellerResponse?: string
  moderation: 'published' | 'pending' | 'removed'
  reported?: boolean
}

export interface CartLine {
  key: string
  productId: string
  qty: number
  selection: Record<string, string>
  saved?: boolean
}

export type GroupStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'return_requested'
  | 'refunded'

export interface OrderLine {
  productId: string
  title: string
  image: string
  qty: number
  unit: number
  selection: Record<string, string>
}

export interface OrderGroup {
  sellerId: string
  lines: OrderLine[]
  methodLabel: string
  shipping: number
  etaLabel: string
  status: GroupStatus
  tracking?: { carrier: string; number: string }
  history: { status: GroupStatus; at: string; note?: string }[]
}

export interface Address {
  id: string
  label: string
  name: string
  phone: string
  street: string
  suburb: string
  city: string
  province: string
  postalCode: string
  country: string
}

export interface Order {
  id: string
  ref: string
  userId: string
  placedAt: string
  groups: OrderGroup[]
  address: Address
  subtotal: number
  shipping: number
  discount: number
  vatIncluded: number
  total: number
  promo?: string
  payment: { method: string; mode: 'demo'; status: 'paid_demo' | 'pending' | 'failed' }
  demo?: boolean
}

export interface Notification {
  id: string
  audience: 'buyer' | 'seller' | 'admin'
  /** Buyer notifications are addressed to one account. */
  userId?: string
  kind: string
  title: string
  body: string
  at: string
  read: boolean
  href?: string
}

export interface Conversation {
  id: string
  buyerName: string
  sellerId: string
  productId?: string
  unread: number
  messages: { from: 'buyer' | 'seller'; text: string; at: string }[]
  reported?: boolean
  blocked?: boolean
}

export interface Enquiry {
  id: string
  sellerId: string
  productId?: string
  buyerName: string
  email: string
  qty: number
  message: string
  at: string
  status: 'new' | 'quoted' | 'declined'
  response?: string
  quotedPrice?: number
}

export type AdminRole = 'super_admin' | 'moderator' | 'support' | 'finance'
export type Permission =
  | 'users'
  | 'sellers'
  | 'listings'
  | 'catalogue'
  | 'orders'
  | 'disputes'
  | 'reviews'
  | 'merchandising'
  | 'fees'
  | 'payouts'
  | 'fraud'
  | 'support'
  | 'content'
  | 'audit'
  | 'settings'

export interface User {
  id: string
  name: string
  email: string
  roles: ('buyer' | 'seller' | 'admin')[]
  sellerId?: string
  adminRole?: AdminRole
  emailVerified: boolean
  phoneVerified: boolean
  phone: string
}

export interface AuditEntry {
  id: string
  at: string
  actor: string
  action: string
  target: string
}
