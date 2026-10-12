import { Link } from 'react-router'
import { useStore } from '../store/store'
import { CATEGORIES } from '../lib/config'
import { IMG } from '../lib/data'
import { Img } from '../components/ui'

const CAT_IMG: Record<string, string> = { wigs: IMG.shelfWigs, bundles: IMG.bundleOrange, closures: IMG.blackTop, frontals: IMG.blackSide, ponytails: IMG.braidHair, accessories: IMG.careShelf, wholesale: IMG.warehouse }

export default function Categories() {
  const { products } = useStore()
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 lg:px-8">
      <h1 className="text-5xl font-extrabold">Categories</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => {
          const n = products.filter((p) => p.status === 'published' && p.category === c.id).length
          return (
            <Link key={c.id} to={`/shop/${c.id}`} className="group relative block aspect-[16/10] overflow-hidden rounded-xl bg-ink">
              <Img id={CAT_IMG[c.id]} w={700} h={440} alt="" className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/85 to-transparent" />
              <div className="absolute inset-x-5 bottom-5 text-white"><p className="text-2xl font-extrabold">{c.label}</p><p className="text-sm text-white/75">{c.blurb} · {n} product{n !== 1 && 's'}</p></div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
