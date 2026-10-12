import type { RouteObject } from 'react-router'
import { RequireSeller } from '../auth/Guards'
import SellerLayout from './SellerLayout'
import Overview from './pages/Overview'
import MyProducts from './pages/MyProducts'
import ProductForm from './ProductForm'
import Orders from './pages/Orders'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import Messages from './pages/Messages'
import Reviews from './pages/Reviews'
import Promotions from './pages/Promotions'
import Storefront from './pages/Storefront'
import Wholesale from './pages/Wholesale'
import Earnings from './pages/Earnings'
import Analytics from './pages/Analytics'
import Shipping from './pages/Shipping'
import Returns from './pages/Returns'
import Settings from './pages/Settings'
import Help from './pages/Help'
import SellerNotFound from './pages/NotFound'

export const sellerRoutes: RouteObject[] = [
  {
    path: 'seller',
    element: (
      <RequireSeller>
        <SellerLayout />
      </RequireSeller>
    ),
    children: [
      { index: true, Component: Overview },
      { path: 'products', Component: MyProducts },
      { path: 'products/new', Component: ProductForm },
      { path: 'products/:id/edit', Component: ProductForm },
      { path: 'orders', Component: Orders },
      { path: 'inventory', Component: Inventory },
      { path: 'customers', Component: Customers },
      { path: 'messages', Component: Messages },
      { path: 'reviews', Component: Reviews },
      { path: 'promotions', Component: Promotions },
      { path: 'storefront', Component: Storefront },
      { path: 'wholesale', Component: Wholesale },
      { path: 'earnings', Component: Earnings },
      { path: 'analytics', Component: Analytics },
      { path: 'shipping', Component: Shipping },
      { path: 'returns', Component: Returns },
      { path: 'settings', Component: Settings },
      { path: 'help', Component: Help },
      { path: '*', Component: SellerNotFound },
    ],
  },
]
