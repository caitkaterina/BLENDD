import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router'
import { Bell, CreditCard, Heart, HelpCircle, Lock, MapPin, MessageSquare, Package, RotateCcw, Send, Settings, ShieldCheck, Star, User as UserIcon, HelpCircle as QA } from 'lucide-react'
import { useExtra, useStore } from '../store/store'
import { fmtDate, money, orderStatus, selectionLabel, STATUS_LABEL } from '../lib/format'
import { uid } from '../lib/format'
import type { Address } from '../lib/types'
import ProductCard from '../components/ProductCard'
import { Badge, Button, ConfirmDialog, Empty, Field, Img, LinkButton, Modal, StatusBadge, Stars, Toggle, inputCls, textareaCls, cx } from '../components/ui'
import { AddressForm, blankAddress, validateAddress } from './Checkout'
import NotFound from './NotFound'

const NAV = [
  ['', 'Profile', UserIcon], ['orders', 'My orders', Package], ['wishlist', 'Wishlist', Heart], ['messages', 'Messages', MessageSquare], ['notifications', 'Notifications', Bell],
  ['addresses', 'Addresses', MapPin], ['payments', 'Payment methods', CreditCard], ['returns', 'Returns & refunds', RotateCcw], ['reviews', 'My reviews', Star], ['questions', 'My questions', QA],
  ['preferences', 'Preferences', Settings], ['security', 'Security', Lock], ['privacy', 'Privacy & data', ShieldCheck],
] as const

export function AccountLayout() {
  const { user } = useStore()
  return (
    <div className="mx-auto grid max-w-[1300px] gap-8 px-4 py-8 lg:grid-cols-[250px_1fr] lg:px-8">
      <nav aria-label="Account" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:block lg:space-y-1 lg:px-0">
        <p className="mb-3 hidden px-3 text-sm lg:block"><span className="text-mute">Signed in as</span><br /><strong>{user?.name}</strong></p>
        {NAV.map(([to, label, Icon]) => (
          <NavLink key={to} to={to ? `/account/${to}` : '/account'} end={to === ''} className={({ isActive }) => cx('flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold lg:rounded-lg', isActive ? 'bg-ink text-white' : 'hover:bg-fog')}><Icon size={16} />{label}</NavLink>
        ))}
        <Link to="/help" className="flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-fog lg:rounded-lg"><HelpCircle size={16} />Help & support</Link>
      </nav>
      <div className="min-w-0"><Outlet /></div>
    </div>
  )
}

const H = ({ children, sub }: { children: React.ReactNode; sub?: string }) => <div className="mb-6"><h1 className="text-3xl font-extrabold">{children}</h1>{sub && <p className="mt-1 text-sm text-mute">{sub}</p>}</div>

export function Profile() {
  const { user, updateUser, products, recent, toast } = useStore()
  const [f, setF] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' })
  const [photo, setPhoto] = useExtra<string>('avatar', '')
  const rec = recent.map((id) => products.find((p) => p.id === id)).filter(Boolean).slice(0, 4) as typeof products
  if (!user) return null
  return (
    <div>
      <H sub="Manage your personal details.">Profile</H>
      <div className="flex items-center gap-5">
        <div className="grid size-20 place-items-center overflow-hidden rounded-full bg-ink text-2xl font-extrabold text-pink">{photo ? <img src={photo} alt="Profile" className="size-full object-cover" /> : user.name[0]}</div>
        <label className="cursor-pointer rounded-full border border-ink px-4 py-2 text-sm font-semibold hover:bg-ink hover:text-white">Change photo
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const r = new FileReader(); r.onload = () => setPhoto(String(r.result)); r.readAsDataURL(file) }} /></label>
      </div>
      <form className="mt-6 grid max-w-xl gap-4" onSubmit={(e) => { e.preventDefault(); if (f.name.trim().length < 2) return toast('Enter a display name', 'error'); updateUser({ name: f.name.trim(), phone: f.phone }); toast('Profile saved') }}>
        <Field label="Display name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls()} /></Field>
        <Field label="Email" hint="Email changes need verification in a live version."><input value={user.email} disabled className={inputCls()} /></Field>
        <Field label="Phone"><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={inputCls()} /></Field>
        <div className="flex flex-wrap gap-3 text-sm"><Badge tone={user.emailVerified ? 'ok' : 'warn'}>Email {user.emailVerified ? 'verified' : 'not verified'}</Badge><Badge tone={user.phoneVerified ? 'ok' : 'warn'}>Phone {user.phoneVerified ? 'verified' : 'not verified'}</Badge>
          {!user.phoneVerified && <button type="button" className="underline" onClick={() => { updateUser({ phoneVerified: true }); toast('Marked verified (demo, no SMS sent)', 'info') }}>Verify (demo)</button>}</div>
        <Button type="submit" variant="dark" className="w-fit">Save changes</Button>
      </form>
      <h2 className="mb-4 mt-12 text-xl font-extrabold">Recently viewed</h2>
      {rec.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{rec.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <p className="text-sm text-mute">Nothing viewed yet.</p>}
    </div>
  )
}

export function Orders() {
  const { orders, user, sellers } = useStore()
  const mine = orders.filter((o) => o.userId === user?.id)
  return (
    <div>
      <H sub="Track and manage your purchases.">My orders</H>
      {mine.length === 0 ? <Empty icon={<Package size={22} />} title="No orders yet" body="Your orders will appear here after checkout." action={<LinkButton to="/shop" variant="dark">Shop hair</LinkButton>} /> : (
        <ul className="space-y-4">
          {mine.map((o) => (
            <li key={o.id} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-bold">{o.ref}</p><p className="text-xs text-mute">{fmtDate(o.placedAt)} · {money(o.total)}</p></div><StatusBadge status={orderStatus(o)} /></div>
              <div className="mt-3 flex items-center gap-2">{o.groups.flatMap((g) => g.lines).slice(0, 5).map((l, i) => <Img key={i} id={l.image} w={100} h={125} alt={l.title} className="h-14 w-11 rounded" />)}</div>
              <p className="mt-2 text-xs text-mute">Sold by {o.groups.map((g) => sellers.find((s) => s.id === g.sellerId)?.name).join(', ')}</p>
              <Link to={`/account/orders/${o.id}`} className="mt-3 inline-block text-sm font-semibold link-pink">View order & tracking</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function OrderDetail() {
  const { id } = useParams()
  const { orders, user, sellers, requestReturn, startConversation, toast } = useStore()
  const nav = useNavigate()
  const o = orders.find((x) => x.id === id && x.userId === user?.id)
  const [ret, setRet] = useState<{ sellerId: string; reason: string } | null>(null)
  if (!o) return <NotFound title="Order not found" body="We couldn't find that order in your account." />
  return (
    <div>
      <Link to="/account/orders" className="text-sm underline">← All orders</Link>
      <h1 className="mt-3 text-3xl font-extrabold">Order {o.ref}</h1>
      <p className="mt-1 text-sm text-mute">Placed {fmtDate(o.placedAt, true)} · {o.payment.method} (demo)</p>
      <div className="mt-6 space-y-6">
        {o.groups.map((g) => {
          const s = sellers.find((x) => x.id === g.sellerId)
          const canReturn = g.status === 'delivered' || g.status === 'completed'
          return (
            <section key={g.sellerId} className="rounded-xl border border-line">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-fog p-4"><div><Link to={`/store/${s?.handle}`} className="font-bold hover:underline">{s?.name}</Link><p className="text-xs text-mute">{g.methodLabel} · {g.etaLabel}</p></div><StatusBadge status={g.status} /></header>
              <ul className="divide-y divide-line">{g.lines.map((l, i) => (
                <li key={i} className="flex gap-4 p-4"><Img id={l.image} w={120} h={150} alt="" className="h-20 w-16 rounded" /><div className="min-w-0 flex-1"><Link to={`/product/${l.productId}`} className="line-clamp-2 text-sm font-semibold hover:underline">{l.title}</Link><p className="text-xs text-mute">{selectionLabel(l.selection)}</p><p className="mt-1 text-xs">Qty {l.qty}</p></div><p className="text-sm font-bold">{money(l.unit * l.qty)}</p></li>
              ))}</ul>
              <div className="grid gap-6 border-t border-line p-4 md:grid-cols-2">
                <div><h3 className="mb-3 text-sm font-bold">Tracking</h3>
                  {g.tracking && <p className="mb-3 text-xs text-mute">{g.tracking.carrier} · {g.tracking.number}</p>}
                  <ol className="space-y-3 border-l-2 border-line pl-4">{[...g.history].reverse().map((h, i) => <li key={i} className="relative text-sm"><span className={cx('absolute -left-[22px] top-1.5 size-2.5 rounded-full', i === 0 ? 'bg-pink ring-2 ring-ink' : 'bg-line')} /><strong>{STATUS_LABEL[h.status]}</strong><span className="block text-xs text-mute">{fmtDate(h.at, true)}{h.note && ` · ${h.note}`}</span></li>)}</ol></div>
                <div className="flex flex-col items-start gap-2 text-sm"><p className="text-mute">Delivery fee: {g.shipping === 0 ? 'Free' : money(g.shipping)}</p>
                  <Button size="sm" variant="outline" onClick={() => { const cid = startConversation(g.sellerId, undefined, `Hi, I have a question about order ${o.ref}.`, user!.name); toast('Conversation started'); nav('/account/messages?c=' + cid) }}>Message seller</Button>
                  {canReturn ? <Button size="sm" variant="outline" onClick={() => setRet({ sellerId: g.sellerId, reason: '' })}>Request a return</Button> : <p className="text-xs text-mute">Returns can be requested once delivered.</p>}
                  {s && <details className="text-xs text-mute"><summary className="cursor-pointer font-semibold text-ink">Seller returns policy</summary>{s.returnsPolicy}</details>}</div>
              </div>
            </section>
          )
        })}
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl bg-fog p-4 text-sm"><h3 className="mb-2 font-bold">Delivery address</h3>{o.address.name}<br />{o.address.street}, {o.address.suburb}<br />{o.address.city}, {o.address.province} {o.address.postalCode}<br />{o.address.phone}</div>
        <dl className="space-y-1.5 rounded-xl bg-fog p-4 text-sm"><div className="flex justify-between"><dt>Items</dt><dd>{money(o.subtotal)}</dd></div><div className="flex justify-between"><dt>Delivery</dt><dd>{money(o.shipping)}</dd></div>{o.discount > 0 && <div className="flex justify-between"><dt>Discount {o.promo}</dt><dd>−{money(o.discount)}</dd></div>}<div className="flex justify-between border-t border-line pt-2 font-extrabold"><dt>Total</dt><dd>{money(o.total)}</dd></div></dl>
      </div>
      <Modal open={!!ret} onClose={() => setRet(null)} title="Request a return" footer={<Button variant="dark" full disabled={!ret?.reason.trim()} onClick={() => { requestReturn(o.id, ret!.sellerId, ret!.reason.trim()); toast('Return requested. The seller will respond.'); setRet(null) }}>Submit request</Button>}>
        <p className="mb-3 text-sm text-mute">Eligibility follows the seller's returns policy. Describe the issue.</p>
        <textarea aria-label="Reason" rows={4} className={textareaCls()} value={ret?.reason ?? ''} onChange={(e) => ret && setRet({ ...ret, reason: e.target.value })} />
      </Modal>
    </div>
  )
}

export function Wishlist() {
  const { wishlist, products } = useStore()
  const items = wishlist.map((id) => products.find((p) => p.id === id)).filter((p) => p && p.status === 'published') as typeof products
  return <div><H sub={`${items.length} saved`}>Wishlist</H>{items.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <Empty icon={<Heart size={22} />} title="Your wishlist is empty" body="Tap the heart on any product to save it." action={<LinkButton to="/shop" variant="dark">Browse</LinkButton>} />}</div>
}

export function Messages() {
  const { conversations, user, sellers, products, sendMessage, readConversation } = useStore()
  const mine = conversations.filter((c) => c.buyerName === user?.name)
  const [active, setActive] = useState<string | undefined>(() => new URLSearchParams(location.search).get('c') ?? undefined)
  const [text, setText] = useState('')
  const cur = mine.find((c) => c.id === active) ?? (typeof window !== 'undefined' && window.innerWidth >= 768 ? mine[0] : undefined)
  useEffect(() => { if (cur && cur.unread) readConversation(cur.id) }, [cur?.id, cur?.unread]) // eslint-disable-line
  return (
    <div>
      <H sub="Conversations with sellers. Keep payments and personal details on BLENDD.">Messages</H>
      {mine.length === 0 ? <Empty icon={<MessageSquare size={22} />} title="No messages yet" body="Use 'Message seller' on a product or order to start a conversation." /> : (
        <div className="grid min-h-[480px] overflow-hidden rounded-xl border border-line md:grid-cols-[280px_1fr]">
          <ul className={cx('divide-y divide-line border-r border-line', cur && 'hidden md:block')}>{mine.map((c) => { const s = sellers.find((x) => x.id === c.sellerId); return <li key={c.id}><button onClick={() => setActive(c.id)} className={cx('w-full p-4 text-left hover:bg-fog', cur?.id === c.id && 'bg-fog')}><p className="flex justify-between text-sm font-bold">{s?.name}{c.unread > 0 && <span className="size-2 rounded-full bg-pink ring-1 ring-ink" aria-label="unread" />}</p><p className="truncate text-xs text-mute">{c.messages[c.messages.length - 1]?.text}</p></button></li> })}</ul>
          {cur ? (
            <div className="flex min-h-0 flex-col">
              <div className="flex items-center gap-2 border-b border-line p-4 text-sm font-bold"><button className="md:hidden" onClick={() => setActive('none')} aria-label="Back">←</button>{sellers.find((x) => x.id === cur.sellerId)?.name}{cur.productId && <span className="font-normal text-mute">· {products.find((p) => p.id === cur.productId)?.title}</span>}</div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">{cur.messages.map((m, i) => <div key={i} className={cx('max-w-[80%] rounded-2xl px-4 py-2.5 text-sm', m.from === 'buyer' ? 'ml-auto bg-ink text-white' : 'bg-fog')}>{m.text}<span className="mt-1 block text-[10px] opacity-60">{fmtDate(m.at, true)}</span></div>)}</div>
              {cur.blocked ? <p className="border-t border-line p-4 text-sm text-mute">This conversation is blocked.</p> : (
                <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; sendMessage(cur.id, 'buyer', text.trim()); setText('') }}>
                  <input aria-label="Message" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…" className={inputCls()} /><Button type="submit" aria-label="Send"><Send size={16} /></Button></form>)}
            </div>
          ) : <p className="hidden place-items-center p-10 text-sm text-mute md:grid">Select a conversation</p>}
        </div>
      )}
    </div>
  )
}

export function Notifications() {
  const { notifications, markRead, markAllRead, user } = useStore()
  const list = notifications.filter((n) => n.audience === 'buyer' && (!n.userId || n.userId === user?.id))
  const nav = useNavigate()
  return (
    <div>
      <H>Notifications</H>
      {list.length === 0 ? <Empty icon={<Bell size={22} />} title="You're all caught up" /> : <>
        <Button variant="outline" size="sm" className="mb-4" onClick={() => markAllRead('buyer')}>Mark all as read</Button>
        <ul className="divide-y divide-line rounded-xl border border-line">{list.map((n) => <li key={n.id}><button onClick={() => { markRead(n.id); n.href && nav(n.href) }} className={cx('flex w-full gap-3 p-4 text-left hover:bg-fog', !n.read && 'bg-pink/20')}>{!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-pink ring-1 ring-ink" />}<span><strong className="block text-sm">{n.title}</strong><span className="text-sm text-mute">{n.body}</span><span className="block text-xs text-mute">{fmtDate(n.at, true)}</span></span></button></li>)}</ul></>}
    </div>
  )
}

export function Addresses() {
  const { addresses, saveAddress, removeAddress, toast } = useStore()
  const [edit, setEdit] = useState<Address | null>(null)
  const [del, setDel] = useState<string | null>(null)
  const [errs, setErrs] = useState<ReturnType<typeof validateAddress>>({})
  return (
    <div>
      <H sub="Used at checkout.">Addresses</H>
      <Button variant="dark" className="mb-5" onClick={() => { setErrs({}); setEdit(blankAddress()) }}>Add address</Button>
      {addresses.length === 0 ? <Empty icon={<MapPin size={22} />} title="No saved addresses" /> : <ul className="grid gap-4 md:grid-cols-2">{addresses.map((a) => <li key={a.id} className="rounded-xl border border-line p-4 text-sm"><p className="font-bold">{a.label}</p><p className="mt-1 text-mute">{a.name}<br />{a.street}, {a.suburb}<br />{a.city}, {a.province} {a.postalCode}<br />{a.phone}</p><div className="mt-3 flex gap-4"><button className="font-semibold underline" onClick={() => { setErrs({}); setEdit(a) }}>Edit</button><button className="font-semibold text-bad underline" onClick={() => setDel(a.id)}>Delete</button></div></li>)}</ul>}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit address' : 'New address'} wide footer={<Button variant="dark" full onClick={() => { const e = validateAddress(edit!); setErrs(e); if (Object.keys(e).length) return; saveAddress({ ...edit!, id: edit!.id || uid('a') }); toast('Address saved'); setEdit(null) }}>Save address</Button>}>
        {edit && <AddressForm value={edit} onChange={setEdit} errors={errs} />}
      </Modal>
      <ConfirmDialog open={!!del} title="Delete address?" body="This can't be undone." danger confirmLabel="Delete" onConfirm={() => { removeAddress(del!); setDel(null) }} onClose={() => setDel(null)} />
    </div>
  )
}

export function Payments() {
  return <div><H sub="Payment details are held by a payment provider, never by BLENDD.">Payment methods</H><Empty icon={<CreditCard size={22} />} title="No saved payment methods" body="In a live version, tokens from your payment provider would be listed here. Demo mode stores no payment information." /></div>
}

export function Returns() {
  const { orders, user, sellers } = useStore()
  const rows = orders.filter((o) => o.userId === user?.id).flatMap((o) => o.groups.filter((g) => ['return_requested', 'refunded'].includes(g.status)).map((g) => ({ o, g })))
  return <div><H>Returns & refunds</H>{rows.length === 0 ? <Empty icon={<RotateCcw size={22} />} title="No returns" body="Request a return from a delivered order." action={<LinkButton to="/account/orders" variant="dark">View orders</LinkButton>} /> : <ul className="space-y-3">{rows.map(({ o, g }) => <li key={o.id + g.sellerId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4 text-sm"><div><p className="font-bold">{o.ref} · {sellers.find((s) => s.id === g.sellerId)?.name}</p><p className="text-mute">{g.history[g.history.length - 1].note}</p></div><div className="flex items-center gap-3"><StatusBadge status={g.status} /><Link to={`/account/orders/${o.id}`} className="underline">Open</Link></div></li>)}</ul>}</div>
}

export function MyReviews() {
  const { reviews, user, products } = useStore()
  const mine = reviews.filter((r) => r.author === user?.name)
  return <div><H sub="Reviews are moderated before appearing publicly.">My reviews</H>{mine.length === 0 ? <Empty icon={<Star size={22} />} title="No reviews yet" body="Open a product you've bought and share what you think." /> : <ul className="space-y-4">{mine.map((r) => <li key={r.id} className="rounded-xl border border-line p-4"><div className="flex items-center justify-between"><Stars value={r.rating} /><StatusBadge status={r.moderation} /></div><p className="mt-2 font-bold">{r.title}</p><p className="text-sm text-mute">{r.body}</p><Link className="mt-2 inline-block text-xs underline" to={`/product/${r.productId}`}>{products.find((p) => p.id === r.productId)?.title}</Link></li>)}</ul>}</div>
}

export function MyQuestions() {
  const { conversations, user, products } = useStore()
  const qs = conversations.filter((c) => c.buyerName === user?.name && c.productId)
  return <div><H sub="Questions you've asked sellers about products.">My questions</H>{qs.length === 0 ? <Empty icon={<QA size={22} />} title="No questions yet" body="Ask a seller from any product page." /> : <ul className="space-y-3">{qs.map((c) => <li key={c.id} className="rounded-xl border border-line p-4 text-sm"><p className="font-bold">{products.find((p) => p.id === c.productId)?.title}</p><p className="mt-1">“{c.messages[0].text}”</p><Link to={`/account/messages?c=${c.id}`} className="mt-2 inline-block underline">{c.messages.length > 1 ? 'See reply' : 'Awaiting reply'}</Link></li>)}</ul>}</div>
}

export function Preferences() {
  const [p, setP] = useExtra('prefs', { orders: true, promos: false, messages: true, newsletter: false })
  const row = (k: keyof typeof p, l: string, d: string) => <div key={k} className="flex items-center justify-between gap-4 border-b border-line py-4"><div><p className="font-semibold">{l}</p><p className="text-sm text-mute">{d}</p></div><Toggle checked={p[k]} onChange={(v) => setP({ ...p, [k]: v })} label={l} /></div>
  return <div><H sub="Choose how BLENDD contacts you. Marketing is opt-in.">Preferences</H><div className="max-w-xl">{row('orders', 'Order updates', 'Dispatch and delivery notifications.')}{row('messages', 'Seller messages', 'Alerts when a seller replies.')}{row('promos', 'Promotions', 'Offers and collections.')}{row('newsletter', 'Newsletter', 'Occasional editorial email.')}</div></div>
}

export function Security() {
  const { toast } = useStore()
  const [f, setF] = useState({ cur: '', next: '', again: '' })
  const [e, setE] = useState('')
  return <div><H sub="Demo mode: no password is actually stored.">Security</H>
    <form className="grid max-w-md gap-4" onSubmit={(ev) => { ev.preventDefault(); if (f.next.length < 8) return setE('New password needs at least 8 characters.'); if (f.next !== f.again) return setE('Passwords do not match.'); setE(''); setF({ cur: '', next: '', again: '' }); toast('Password updated (demo)') }}>
      <Field label="Current password"><input type="password" value={f.cur} onChange={(x) => setF({ ...f, cur: x.target.value })} className={inputCls()} autoComplete="current-password" /></Field>
      <Field label="New password"><input type="password" value={f.next} onChange={(x) => setF({ ...f, next: x.target.value })} className={inputCls()} autoComplete="new-password" /></Field>
      <Field label="Repeat new password" error={e}><input type="password" value={f.again} onChange={(x) => setF({ ...f, again: x.target.value })} className={inputCls(!!e)} autoComplete="new-password" /></Field>
      <Button type="submit" variant="dark" className="w-fit">Update password</Button></form>
    <div className="mt-8 max-w-md rounded-xl bg-fog p-4 text-sm"><p className="font-bold">Two-factor authentication</p><p className="text-mute">Not available in the prototype.</p><Button size="sm" variant="outline" disabled className="mt-3">Set up (unavailable)</Button></div></div>
}

export function Privacy() {
  const { signOut, toast, user, orders } = useStore()
  const [p, setP] = useExtra('privacy', { profilePublic: false, reviewsName: true })
  const [del, setDel] = useState(false)
  const [requested, setRequested] = useExtra('deleteRequested', false)
  const nav = useNavigate()
  const exportData = () => { const blob = new Blob([JSON.stringify({ user, orders: orders.filter((o) => o.userId === user?.id) }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'blendd-demo-data.json'; a.click(); URL.revokeObjectURL(a.href) }
  return <div><H sub="Control your information.">Privacy & data</H>
    <div className="max-w-xl"><div className="flex items-center justify-between gap-4 border-b border-line py-4"><div><p className="font-semibold">Show my first name on reviews</p></div><Toggle checked={p.reviewsName} onChange={(v) => setP({ ...p, reviewsName: v })} label="Show name on reviews" /></div>
      <div className="flex items-center justify-between gap-4 border-b border-line py-4"><div><p className="font-semibold">Public profile</p><p className="text-sm text-mute">Off by default.</p></div><Toggle checked={p.profilePublic} onChange={(v) => setP({ ...p, profilePublic: v })} label="Public profile" /></div></div>
    <div className="mt-6 flex flex-wrap gap-3"><Button variant="outline" onClick={exportData}>Download my demo data</Button><Button variant="outline" onClick={() => { signOut(); nav('/') }}>Log out</Button></div>
    <div className="mt-10 max-w-xl rounded-xl border border-bad/40 p-5"><h2 className="font-bold text-bad">Delete account</h2>{requested ? <p className="mt-2 text-sm">Deletion requested. In a live version this would be reviewed and completed within the legally required period. <button className="underline" onClick={() => setRequested(false)}>Cancel request</button></p> : <><p className="mt-2 text-sm text-mute">Submit a request to delete your account and personal data. Open orders may delay completion.</p><Button variant="danger" size="sm" className="mt-3" onClick={() => setDel(true)}>Request deletion</Button></>}</div>
    <ConfirmDialog open={del} title="Request account deletion?" body="You can cancel the request before it is processed." danger confirmLabel="Submit request" onConfirm={() => { setRequested(true); setDel(false); toast('Deletion request recorded (demo)', 'info') }} onClose={() => setDel(false)} /></div>
}

