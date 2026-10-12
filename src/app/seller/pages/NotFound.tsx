import { LinkButton } from '../../components/ui'

export default function SellerNotFound() {
  return (
    <div className="grid place-items-center py-20 text-center">
      <div>
        <p className="eyebrow text-mute">404</p>
        <h1 className="mt-3 text-3xl font-extrabold">That seller page does not exist</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-mute">Check the address, or head back to your overview.</p>
        <div className="mt-6 flex justify-center gap-2"><LinkButton to="/seller" variant="dark">Seller overview</LinkButton></div>
      </div>
    </div>
  )
}
