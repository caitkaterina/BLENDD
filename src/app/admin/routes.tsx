import type { ReactNode } from 'react'
import type { RouteObject } from 'react-router'
import { RequireAdmin } from '../auth/Guards'
import type { Permission } from '../lib/types'
import AdminLayout from './AdminLayout'
import Overview from './pages/Overview'
import Users from './pages/Users'
import Sellers from './pages/Sellers'
import Listings from './pages/Listings'
import Catalogue from './pages/Catalogue'
import Orders from './pages/Orders'
import Disputes from './pages/Disputes'
import Refunds from './pages/Refunds'
import Reviews from './pages/Reviews'
import Merchandising from './pages/Merchandising'
import Fees from './pages/Fees'
import Payouts from './pages/Payouts'
import Fraud from './pages/Fraud'
import Support from './pages/Support'
import Content from './pages/Content'
import Audit from './pages/Audit'
import Settings from './pages/Settings'
import { Link } from 'react-router'

const guard = (permission: Permission | undefined, el: ReactNode) => <RequireAdmin permission={permission}>{el}</RequireAdmin>

function NotFound() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-center">
      <div>
        <h1 className="text-3xl font-extrabold">Page not found</h1>
        <p className="mt-2 text-sm text-mute">That admin page does not exist.</p>
        <Link to="/admin" className="mt-5 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-semibold text-white">Back to overview</Link>
      </div>
    </div>
  )
}

export const adminRoutes: RouteObject[] = [
  {
    path: 'admin',
    element: <RequireAdmin><AdminLayout /></RequireAdmin>,
    children: [
      { index: true, element: guard(undefined, <Overview />) },
      { path: 'users', element: guard('users', <Users />) },
      { path: 'sellers', element: guard('sellers', <Sellers />) },
      { path: 'listings', element: guard('listings', <Listings />) },
      { path: 'catalogue', element: guard('catalogue', <Catalogue />) },
      { path: 'orders', element: guard('orders', <Orders />) },
      { path: 'disputes', element: guard('disputes', <Disputes />) },
      { path: 'refunds', element: guard('disputes', <Refunds />) },
      { path: 'reviews', element: guard('reviews', <Reviews />) },
      { path: 'merchandising', element: guard('merchandising', <Merchandising />) },
      { path: 'fees', element: guard('fees', <Fees />) },
      { path: 'payouts', element: guard('payouts', <Payouts />) },
      { path: 'fraud', element: guard('fraud', <Fraud />) },
      { path: 'support', element: guard('support', <Support />) },
      { path: 'content', element: guard('content', <Content />) },
      { path: 'audit', element: guard('audit', <Audit />) },
      { path: 'settings', element: guard('settings', <Settings />) },
      { path: '*', element: <NotFound /> },
    ],
  },
]
