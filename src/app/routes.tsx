import { createBrowserRouter, Navigate, Outlet, ScrollRestoration, type RouteObject } from 'react-router'
import { StoreProvider } from './store/store'
import { Toasts } from './components/ui'
import { RequireAuth } from './auth/Guards'
import BuyerLayout from './buyer/BuyerLayout'
import Home from './buyer/Home'
import Listing from './buyer/Listing'
import ProductPage from './buyer/Product'
import Cart from './buyer/Cart'
import Checkout, { OrderConfirmation } from './buyer/Checkout'
import SignIn from './buyer/SignIn'
import StorePage from './buyer/StorePage'
import Wholesale from './buyer/Wholesale'
import Help from './buyer/Help'
import NotFound from './buyer/NotFound'
import Categories from './buyer/Categories'
import { AccountLayout, Addresses, MyQuestions, MyReviews, Messages, Notifications, OrderDetail, Orders, Payments, Preferences, Privacy, Profile, Returns, Security, Wishlist } from './buyer/Account'
import { sellerRoutes } from './seller/routes'
import SellLanding from './seller/SellLanding'
import Onboarding from './seller/Onboarding'
import { adminRoutes } from './admin/routes'

function Root() {
  return (
    <StoreProvider>
      <Outlet />
      <Toasts />
      <ScrollRestoration />
    </StoreProvider>
  )
}

const buyer: RouteObject[] = [
  { index: true, element: <Home /> },
  { path: 'shop', element: <Listing mode="shop" /> },
  { path: 'shop/:category', element: <Listing mode="shop" /> },
  { path: 'search', element: <Listing mode="search" /> },
  { path: 'top-rated', element: <Listing mode="top" /> },
  { path: 'new', element: <Listing mode="new" /> },
  { path: 'categories', element: <Categories /> },
  { path: 'product/:id', element: <ProductPage /> },
  { path: 'cart', element: <Cart /> },
  { path: 'checkout', element: <Checkout /> },
  { path: 'order/confirmation/:id', element: <OrderConfirmation /> },
  { path: 'signin', element: <SignIn /> },
  { path: 'store/:handle', element: <StorePage /> },
  { path: 'wholesale', element: <Wholesale /> },
  { path: 'help', element: <Help /> },
  { path: 'sell', element: <SellLanding /> },
  { path: 'sell/apply', element: <Onboarding /> },
  {
    path: 'account',
    element: <RequireAuth><AccountLayout /></RequireAuth>,
    children: [
      { index: true, element: <Profile /> },
      { path: 'orders', element: <Orders /> },
      { path: 'orders/:id', element: <OrderDetail /> },
      { path: 'wishlist', element: <Wishlist /> },
      { path: 'messages', element: <Messages /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'addresses', element: <Addresses /> },
      { path: 'payments', element: <Payments /> },
      { path: 'returns', element: <Returns /> },
      { path: 'reviews', element: <MyReviews /> },
      { path: 'questions', element: <MyQuestions /> },
      { path: 'preferences', element: <Preferences /> },
      { path: 'security', element: <Security /> },
      { path: 'privacy', element: <Privacy /> },
      { path: 'help', element: <Navigate to="/help" replace /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]

export const router = createBrowserRouter([
  { path: '/', element: <Root />, children: [{ element: <BuyerLayout />, children: buyer }, ...sellerRoutes, ...adminRoutes] },
])
