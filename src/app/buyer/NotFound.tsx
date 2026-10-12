import { LinkButton } from '../components/ui'

export default function NotFound({ title = 'Page not found', body = "We couldn't find the page you were looking for." }: { title?: string; body?: string }) {
  return (
    <div className="mx-auto grid max-w-xl place-items-center px-4 py-28 text-center">
      <p className="eyebrow mb-4 text-mute">404</p>
      <h1 className="text-4xl font-extrabold">{title}</h1>
      <p className="mt-3 text-mute">{body}</p>
      <div className="mt-8 flex gap-3"><LinkButton to="/" variant="dark">Back home</LinkButton><LinkButton to="/shop" variant="outline">Shop hair</LinkButton></div>
    </div>
  )
}
