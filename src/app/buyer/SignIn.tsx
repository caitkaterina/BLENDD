import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Shield, Store, User as UserIcon, Headset } from 'lucide-react'
import { useStore } from '../store/store'
import { Button, DemoBadge, Field, inputCls } from '../components/ui'
import { Logo } from '../components/Logo'

const PERSONAS = [
  { id: 'buyer', icon: UserIcon, title: 'Buyer', body: 'Thandi Mokoena. Has past orders.', to: '/account' },
  { id: 'seller', icon: Store, title: 'Seller', body: 'Owner of Lumi Hair Co. Opens the seller dashboard.', to: '/seller' },
  { id: 'admin', icon: Shield, title: 'Super admin', body: 'Full platform permissions.', to: '/admin' },
  { id: 'support', icon: Headset, title: 'Support agent', body: 'Limited admin permissions.', to: '/admin' },
] as const

export default function SignIn() {
  const { signIn, signUp } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const from = (loc.state as { from?: string } | null)?.from
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [e, setE] = useState<Record<string, string>>({})

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 lg:grid-cols-2 lg:px-8">
      <section>
        <div className="mb-6 inline-block rounded-lg bg-ink p-3"><Logo size={28} /></div>
        <div className="flex items-center gap-3"><h1 className="text-3xl font-extrabold">Sign in</h1><DemoBadge /></div>
        <p className="mt-2 text-sm text-mute">This prototype has no real accounts. Pick a sample persona to explore each experience.</p>
        <div className="mt-6 space-y-3">
          {PERSONAS.map((p) => (
            <button key={p.id} onClick={() => { signIn(p.id); nav(from && p.id === 'buyer' ? from : from && p.id !== 'buyer' && !from.startsWith('/account') ? from : p.to, { replace: true }) }} className="flex w-full items-center gap-4 rounded-xl border border-line p-4 text-left transition hover:border-ink hover:bg-fog">
              <span className="grid size-11 place-items-center rounded-full bg-ink text-pink"><p.icon size={18} /></span>
              <span><span className="block font-bold">{p.title}</span><span className="text-sm text-mute">{p.body}</span></span>
            </button>
          ))}
        </div>
      </section>
      <section className="rounded-2xl bg-fog p-6 lg:p-8">
        <h2 className="text-xl font-extrabold">Create a demo account</h2>
        <form noValidate className="mt-5 space-y-4" onSubmit={(ev) => {
          ev.preventDefault()
          const er: Record<string, string> = {}
          if (f.name.trim().length < 2) er.name = 'Enter your name'
          if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email'
          if (f.password.length < 8) er.password = 'At least 8 characters (not stored)'
          setE(er)
          if (Object.keys(er).length) return
          signUp(f.name.trim(), f.email.trim()); nav(from ?? '/account', { replace: true })
        }}>
          <Field label="Full name" error={e.name}><input value={f.name} onChange={(x) => setF({ ...f, name: x.target.value })} autoComplete="name" className={inputCls(!!e.name)} /></Field>
          <Field label="Email" error={e.email}><input type="email" value={f.email} onChange={(x) => setF({ ...f, email: x.target.value })} autoComplete="email" className={inputCls(!!e.email)} /></Field>
          <Field label="Password" error={e.password}><input type="password" value={f.password} onChange={(x) => setF({ ...f, password: x.target.value })} autoComplete="new-password" className={inputCls(!!e.password)} /></Field>
          <Button type="submit" variant="dark" full size="lg">Create account</Button>
          <p className="text-xs text-mute">Nothing is sent anywhere. Your details stay in this browser only.</p>
        </form>
      </section>
    </div>
  )
}
