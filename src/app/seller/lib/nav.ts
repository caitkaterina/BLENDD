import { BarChart3, Boxes, Building2, HelpCircle, Home, MessageSquare, Package, PackagePlus, Percent, RotateCcw, Settings, ShoppingBag, Star, Store, Truck, Users, Wallet, type LucideIcon } from 'lucide-react'

export interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: 'orders' | 'messages' | 'wholesale' }
export interface NavGroup { id: string; label: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  { id: 'home', label: 'Dashboard', items: [{ to: '/seller', label: 'Overview', icon: Home, end: true }] },
  {
    id: 'sell',
    label: 'Catalogue & sales',
    items: [
      { to: '/seller/products', label: 'My Products', icon: Package },
      { to: '/seller/products/new', label: 'Add Product', icon: PackagePlus },
      { to: '/seller/orders', label: 'Orders', icon: ShoppingBag, badge: 'orders' },
      { to: '/seller/inventory', label: 'Inventory', icon: Boxes },
      { to: '/seller/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    id: 'grow',
    label: 'Engage',
    items: [
      { to: '/seller/messages', label: 'Messages', icon: MessageSquare, badge: 'messages' },
      { to: '/seller/reviews', label: 'Reviews', icon: Star },
      { to: '/seller/promotions', label: 'Promotions', icon: Percent },
      { to: '/seller/storefront', label: 'Storefront', icon: Store },
      { to: '/seller/wholesale', label: 'Wholesale', icon: Building2, badge: 'wholesale' },
    ],
  },
  {
    id: 'money',
    label: 'Money & insight',
    items: [
      { to: '/seller/earnings', label: 'Earnings & Payouts', icon: Wallet },
      { to: '/seller/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    id: 'ops',
    label: 'Operations',
    items: [
      { to: '/seller/shipping', label: 'Shipping', icon: Truck },
      { to: '/seller/returns', label: 'Returns & Refunds', icon: RotateCcw },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      { to: '/seller/settings', label: 'Settings', icon: Settings },
      { to: '/seller/help', label: 'Help Centre', icon: HelpCircle },
    ],
  },
]
