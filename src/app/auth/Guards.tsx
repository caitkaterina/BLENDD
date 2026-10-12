import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { ShieldAlert } from 'lucide-react'
import { useStore } from '../store/store'
import type { Permission } from '../lib/types'
import { LinkButton } from '../components/ui'

/**
 * UX-level route guards for the client-only demo. In production the same
 * checks MUST be enforced by the API (role claims on every request).
 */
function Denied({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div className="max-w-sm">
        <ShieldAlert className="mx-auto mb-4" size={36} />
        <h1 className="text-3xl font-extrabold">{title}</h1>
        <p className="mt-3 text-sm text-mute">{body}</p>
        <div className="mt-6 flex justify-center gap-2"><LinkButton to="/" variant="dark">Back to shop</LinkButton></div>
      </div>
    </div>
  )
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useStore()
  const loc = useLocation()
  if (!user) return <Navigate to="/signin" state={{ from: loc.pathname }} replace />
  return <>{children}</>
}

export function RequireSeller({ children }: { children: ReactNode }) {
  const { user } = useStore()
  const loc = useLocation()
  if (!user) return <Navigate to="/signin" state={{ from: loc.pathname }} replace />
  if (!user.roles.includes('seller') || !user.sellerId)
    return <Denied title="Seller access only" body="This workspace is for approved sellers. Apply to sell on BLENDD, or sign in with a seller account." />
  return <>{children}</>
}

export function RequireAdmin({ permission, children }: { permission?: Permission; children: ReactNode }) {
  const { user, can } = useStore()
  const loc = useLocation()
  if (!user) return <Navigate to="/signin" state={{ from: loc.pathname }} replace />
  if (!user.roles.includes('admin')) return <Denied title="Not found" body="You do not have access to this area." />
  if (permission && !can(permission)) return <Denied title="Permission required" body={`Your admin role (${user.adminRole?.replace('_', ' ')}) does not include the “${permission}” permission.`} />
  return <>{children}</>
}

export { Link }
