import type { Seller, SellerType } from '../../lib/types'

export type Overrides = Partial<Record<SellerType, number>>
/** Effective fee percent for a seller: the lowest override across their types, else the global percent. */
export function effectivePercent(seller: Pick<Seller, 'types'>, overrides: Overrides, global: number) {
  const vals = seller.types.map((t) => overrides[t]).filter((v): v is number => typeof v === 'number')
  return vals.length ? Math.min(...vals) : global
}
