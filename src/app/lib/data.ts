import type {
  AdminRole,
  AuditEntry,
  CategoryId,
  Conversation,
  Enquiry,
  Notification,
  OptionDef,
  Order,
  Product,
  Review,
  Seller,
  User,
  WholesaleInfo,
} from './types'

/** All data in this file is illustrative demo data. Photos are stock imagery, not the listed products. */
export const IMG = {
  wigs1: '1754327748419-715068469357',
  wigsBlack: '1570570525340-cc356a1383fb',
  wigs3: '1515172371186-85d50c9f1fc1',
  pinkWigs: '1787220674717-5f44f30d1ae1',
  brush: '1527799820374-dcf8d9d4a388',
  mannequin: '1730504858561-84a01cbb7039',
  longhair: '1663582816168-916ea1456edc',
  comb: '1747398690600-ffe8ecda9df1',
  shelfWigs: '1763771444803-64684b6cae65',
  bwWindow: '1770321118667-f53114e87c65',
  redMannequins: '1754327544411-c139d3bb5d80',
  salonHead: '1693562236117-501b738dbaa1',
  neonWigs: '1654470800030-1f44b4793a37',
  silverWigs: '1633686120492-c52f9665a2a6',
  extWall: '1782364743035-5666762e249a',
  colorWigs: '1634315775834-3e1ac73de6b6',
  wigShelves: '1700219212623-77aebb917034',
  glassWigs: '1535911974356-3748cdc9d2f5',
  bobFlowers: '1570464678671-953f859952c4',
  honeyBack: '1663582816182-15cf69d87665',
  honeyBack2: '1663582815412-665909d70e01',
  blackSide: '1663582815337-52558dc2f9fd',
  blackTop: '1663582816158-42354522fe15',
  curlyMannequin: '1710020492920-e22d37ebe1b1',
  bundleOrange: '1685157713304-977307f78ef7',
  bundleOmbre: '1677746617354-be4c65563b89',
  braidHair: '1677319378211-06f6a50b49bd',
  careShelf: '1673241073904-686d244b62e3',
  shopStock: '1774273177345-ff6a25515a3c',
  marketStock: '1787547286615-171e4320153c',
  warehouse: '1782948603191-065fb15e2e8e',
  spoolRows: '1760818072388-4604d5cb39ac',
  spinHall: '1636986056375-184676d8ca14',
}

export function imgUrl(id: string, w = 600, h?: number) {
  if (/^(https?:|data:|blob:)/.test(id)) return id
  return `https://images.unsplash.com/photo-${id}?w=${w}${h ? `&h=${h}` : ''}&fit=crop&auto=format&q=75`
}

export const SELLERS: Seller[] = [
  {
    id: 's-lumi', handle: 'lumi-hair-co', name: 'Lumi Hair Co.', types: ['reseller', 'retailer'], verified: true, verificationStatus: 'verified',
    rating: 4.8, reviewCount: 182, city: 'Johannesburg', province: 'Gauteng', showLocation: true, dispatch: 'Dispatches in 1–2 business days',
    cover: IMG.neonWigs, about: 'Curated human-hair wigs and bundles for everyday and event looks. Every unit is photographed before dispatch.', joined: '2025-11-04',
    returnsPolicy: 'Unworn, uncut and unaltered units can be returned within 7 days of delivery. Return courier is paid by the buyer unless the item is faulty.',
    shippingPolicy: 'Ships Monday–Friday from Johannesburg with tracked courier.', acceptsEnquiries: true,
    shipping: { standard: { fee: 85, days: [2, 4], freeOver: 2500 }, express: { fee: 140, days: [1, 2] }, collect: true }, status: 'active',
  },
  {
    id: 's-cape', handle: 'cape-weave-house', name: 'Cape Weave House', types: ['retailer'], verified: true, verificationStatus: 'verified',
    rating: 4.6, reviewCount: 96, city: 'Cape Town', province: 'Western Cape', showLocation: true, dispatch: 'Dispatches in 2–3 business days',
    cover: IMG.wigShelves, about: 'Silky straight and wave textures, with colour-matched closures and frontals. Based in the Mother City.', joined: '2025-12-12',
    returnsPolicy: 'Returns accepted within 5 days for unopened bundles and unaltered wigs. Colour-treated hair is final sale.',
    shippingPolicy: 'Courier to major centres; outlying areas may take longer.', acceptsEnquiries: true,
    shipping: { standard: { fee: 95, days: [3, 5], freeOver: 3000 }, express: { fee: 160, days: [1, 3] } }, status: 'active',
  },
  {
    id: 's-ubuntu', handle: 'ubuntu-bulk-hair', name: 'Ubuntu Bulk Hair', types: ['wholesaler', 'manufacturer'], verified: true, verificationStatus: 'verified',
    rating: 4.7, reviewCount: 64, city: 'Durban', province: 'KwaZulu-Natal', showLocation: true, dispatch: 'Wholesale orders ship in 3–5 business days',
    cover: IMG.warehouse, about: 'Supplier of bundles and closures in volume for salons and resellers. Quote requests answered within the working week.', joined: '2025-10-02',
    returnsPolicy: 'Wholesale orders: faults must be reported within 48 hours of delivery with photos. Opened bundles cannot be returned.',
    shippingPolicy: 'Freight priced per consignment; see the quote.', acceptsEnquiries: true,
    shipping: { standard: { fee: 180, days: [3, 6], freeOver: 8000 }, collect: true }, status: 'active',
  },
  {
    id: 's-kasi', handle: 'kasi-crown-wigs', name: 'Kasi Crown Wigs', types: ['reseller'], verified: false, verificationStatus: 'pending',
    rating: undefined, reviewCount: 0, city: 'Pretoria', province: 'Gauteng', showLocation: true, dispatch: 'Dispatches in 2 business days',
    cover: IMG.bwWindow, about: 'New store: ready-to-wear glueless wigs and bobs. Verification in progress.', joined: '2026-09-18',
    returnsPolicy: 'Returns within 7 days, unworn units only.', shippingPolicy: 'Courier nationwide.', acceptsEnquiries: false,
    shipping: { standard: { fee: 75, days: [2, 5] } }, status: 'active',
  },
  {
    id: 's-orient', handle: 'orient-strand', name: 'Orient Strand Manufacturing', types: ['manufacturer', 'wholesaler'], verified: true, verificationStatus: 'verified',
    rating: 4.5, reviewCount: 41, city: 'Johannesburg', province: 'Gauteng', showLocation: true, dispatch: 'Made-to-order lead time 7–10 days',
    cover: IMG.spinHall, about: 'Brand and manufacturer of caps, wigs and ponytails. Private-label and custom colours available on bulk orders.', joined: '2026-01-20',
    returnsPolicy: 'Custom and private-label orders are non-returnable except for manufacturing faults.', shippingPolicy: 'Freight quoted per order.', acceptsEnquiries: true,
    shipping: { standard: { fee: 150, days: [4, 7], freeOver: 6000 } }, status: 'active',
  },
  {
    id: 's-nene', handle: 'nenes-curls', name: "Nene's Curl Closet", types: ['reseller'], verified: false, verificationStatus: 'not_submitted',
    rating: 4.3, reviewCount: 18, city: 'Bloemfontein', province: 'Free State', showLocation: false, dispatch: 'Dispatches in 3–4 business days',
    cover: IMG.extWall, about: 'Curly, kinky and coily textures plus braided ponytails. A small independent reseller.', joined: '2026-03-08',
    returnsPolicy: 'Exchanges within 5 days if unworn.', shippingPolicy: 'Courier nationwide.', acceptsEnquiries: false,
    shipping: { standard: { fee: 90, days: [3, 6] }, collect: true }, status: 'active',
  },
]

const len = (lengths: number[], step = 90, base = lengths[0]): OptionDef => ({
  key: 'length', label: 'Length (inches)',
  values: lengths.map((l) => ({ value: `${l}"`, priceDelta: Math.round(((l - base) / 2) * step) })),
})
const opt = (key: string, label: string, vals: string[]): OptionDef => ({ key, label, values: vals.map((value) => ({ value })) })

const wh = (moq: number, tiers: [number, number][], extra: Partial<WholesaleInfo> = {}): WholesaleInfo => ({
  moq, tiers: tiers.map(([min, price]) => ({ min, price: Math.round(price) })), leadTime: '3–5 business days', processing: '1–2 business days',
  samples: false, customisation: false, acceptsEnquiries: true, retailAlso: false, ...extra,
})

type P = Partial<Product> & Pick<Product, 'id' | 'title' | 'category' | 'sellerId' | 'images' | 'price'>
const mk = (p: P, i: number): Product => ({
  sku: `BL-${p.id.toUpperCase()}`, stock: 20, lowStockAt: 5, colors: ['Natural black'], lengths: [], options: [], description: '', specs: {},
  status: 'published', createdAt: `2026-10-${String(10 - (i % 9)).padStart(2, '0')}`, popularity: 100 - i * 2, reviewCount: 0, demo: true, ...p,
})

const bundleDesc = 'Machine-weft bundle sold per piece. Length shown is the stretched length; curl patterns appear shorter when relaxed. Sold by the seller named on this page, not by BLENDD.'
const wigDesc = 'Ready-to-wear unit with pre-plucked hairline and adjustable straps. Colour and density as listed by the seller. Photos are illustrative stock imagery in this demo.'

export const PRODUCTS: Product[] = (
  [
    { id: 'bw20', title: 'Brazilian body wave bundle', category: 'bundles', sellerId: 's-lumi', images: [IMG.bundleOrange, IMG.blackTop], price: 749, compareAt: 899, hairType: 'human', texture: 'Body wave', origin: 'Brazilian', processing: 'Virgin', density: '—', lengths: [12, 14, 16, 18, 20, 22, 24, 26], options: [len([12, 14, 16, 18, 20, 22, 24, 26], 70), opt('color', 'Colour', ['Natural black', 'Dark brown'])], stock: 34, rating: 4.8, reviewCount: 74, popularity: 98, description: bundleDesc, specs: { 'Hair type': 'Human hair', Origin: 'Brazilian (as stated by seller)', Weight: '100g per bundle', Texture: 'Body wave', Weft: 'Double machine weft' } },
    { id: 'st18', title: 'Silky straight bundle, 100g', category: 'bundles', sellerId: 's-cape', images: [IMG.honeyBack, IMG.bundleOmbre], price: 689, hairType: 'human', texture: 'Straight', origin: 'Vietnamese', processing: 'Raw', lengths: [14, 16, 18, 20, 22, 24, 26, 28], options: [len([14, 16, 18, 20, 22, 24, 26, 28], 65), opt('color', 'Colour', ['Natural black', '#2 darkest brown'])], stock: 28, rating: 4.7, reviewCount: 52, popularity: 94, description: bundleDesc, specs: { 'Hair type': 'Human hair', Origin: 'Vietnamese (as stated by seller)', Weight: '100g per bundle', Texture: 'Straight' } },
    { id: 'dw16', title: 'Deep wave bundle deal, 3 pieces', category: 'bundles', sellerId: 's-lumi', images: [IMG.blackSide, IMG.bundleOrange], price: 1990, compareAt: 2390, hairType: 'human', texture: 'Deep wave', origin: 'Peruvian', processing: 'Virgin', lengths: [14, 16, 18, 20, 22], options: [len([14, 16, 18, 20, 22], 180)], stock: 12, rating: 4.9, reviewCount: 39, popularity: 91, description: bundleDesc, specs: { 'Hair type': 'Human hair', Pieces: '3 bundles', Texture: 'Deep wave' } },
    { id: 'kc14', title: 'Kinky curly clip-in set, 7 pieces', category: 'ponytails', sellerId: 's-nene', images: [IMG.braidHair, IMG.careShelf], price: 899, hairType: 'human', texture: 'Kinky curly', lengths: [14, 16, 18, 20], options: [len([14, 16, 18, 20], 100), opt('color', 'Colour', ['Natural black', '1B', 'Dark brown'])], stock: 9, lowStockAt: 5, rating: 4.4, reviewCount: 14, popularity: 80, description: 'Seven-piece clip-in set with silicone-lined clips. Blends with 3C–4A natural textures.', specs: { 'Hair type': 'Human hair', Pieces: '7', Clips: 'Silicone-lined' } },
    { id: 'wg13', title: '13x4 lace front body wave wig, 180% density', category: 'wigs', sellerId: 's-lumi', images: [IMG.wigsBlack, IMG.silverWigs], price: 3490, compareAt: 3990, hairType: 'human', texture: 'Body wave', construction: 'Lace front', lace: '13x4', density: '180%', origin: 'Brazilian', processing: 'Virgin', lengths: [18, 20, 22, 24, 26], options: [len([18, 20, 22, 24, 26], 220), opt('lace', 'Lace type', ['HD lace', 'Transparent lace']), opt('capSize', 'Cap size', ['Small', 'Medium', 'Large']), opt('density', 'Density', ['150%', '180%'])], stock: 7, lowStockAt: 5, rating: 4.9, reviewCount: 61, popularity: 99, description: wigDesc, specs: { Construction: 'Lace front', Lace: '13x4 HD / transparent', Density: '150% or 180%', 'Cap size': 'S / M / L', 'Hair type': 'Human hair' } },
    { id: 'gl20', title: 'Glueless 5x5 closure wig, straight', category: 'wigs', sellerId: 's-cape', images: [IMG.wigs1, IMG.honeyBack2], price: 2790, hairType: 'human', texture: 'Straight', construction: 'Glueless', lace: '5x5', density: '150%', lengths: [16, 18, 20, 22, 24], options: [len([16, 18, 20, 22, 24], 160), opt('capSize', 'Cap size', ['Medium', 'Large'])], stock: 11, rating: 4.6, reviewCount: 33, popularity: 93, description: wigDesc, specs: { Construction: 'Glueless, pre-cut lace', Lace: '5x5', Density: '150%' } },
    { id: 'bob12', title: 'Human hair bob wig, blunt cut 12"', category: 'wigs', sellerId: 's-kasi', images: [IMG.bobFlowers, IMG.redMannequins], price: 1650, hairType: 'human', texture: 'Straight', construction: 'Lace front', lace: '13x4', density: '150%', lengths: [10, 12, 14], options: [len([10, 12, 14], 120), opt('capSize', 'Cap size', ['Medium'])], stock: 6, popularity: 70, description: wigDesc, specs: { Construction: 'Lace front', Density: '150%' } },
    { id: 'syn24', title: 'Heat-safe synthetic wig, loose wave', category: 'wigs', sellerId: 's-kasi', images: [IMG.pinkWigs, IMG.colorWigs], price: 599, compareAt: 799, hairType: 'synthetic', texture: 'Loose wave', construction: 'Headband wig', density: '130%', lengths: [20, 24], options: [len([20, 24], 60)], stock: 25, popularity: 66, description: 'Synthetic fibre rated heat-safe to the temperature stated by the seller (180°C). Not suitable for repeated high-heat styling.', specs: { 'Hair type': 'Synthetic (heat-safe)', Construction: 'Headband' } },
    { id: 'hdb', title: 'Headband wig, curly 3B', category: 'wigs', sellerId: 's-nene', images: [IMG.curlyMannequin, IMG.wigs3], price: 1790, hairType: 'blended', texture: 'Curly', construction: 'Headband wig', density: '200%', lengths: [14, 16, 18], options: [len([14, 16, 18], 130)], stock: 0, rating: 4.2, reviewCount: 9, popularity: 62, description: 'Beginner-friendly headband wig, no glue or lace. Currently out of stock — use back-in-stock alerts.', specs: { 'Hair type': 'Blended', Construction: 'Headband' } },
    { id: 'fr13', title: '13x4 HD lace frontal, ear to ear', category: 'frontals', sellerId: 's-cape', images: [IMG.blackTop, IMG.blackSide], price: 1190, hairType: 'human', texture: 'Body wave', lace: '13x4', lengths: [14, 16, 18, 20, 22], options: [len([14, 16, 18, 20, 22], 80), opt('lace', 'Lace type', ['HD lace', 'Transparent lace'])], stock: 19, rating: 4.7, reviewCount: 27, popularity: 88, description: 'Pre-plucked HD lace frontal with baby hairs. Sold individually.', specs: { Lace: '13x4 HD', Origin: 'Brazilian (as stated by seller)' } },
    { id: 'fr136', title: '13x6 lace frontal, straight', category: 'frontals', sellerId: 's-lumi', images: [IMG.longhair, IMG.blackTop], price: 1490, hairType: 'human', texture: 'Straight', lace: '13x6', lengths: [14, 16, 18, 20, 22], options: [len([14, 16, 18, 20, 22], 90), opt('lace', 'Lace type', ['HD lace', 'Transparent lace'])], stock: 14, rating: 4.8, reviewCount: 22, popularity: 85, description: 'Deeper parting space with the 13x6 construction.', specs: { Lace: '13x6' } },
    { id: 'cl44', title: '4x4 transparent lace closure, deep wave', category: 'closures', sellerId: 's-cape', images: [IMG.salonHead, IMG.blackTop], price: 790, hairType: 'human', texture: 'Deep wave', lace: '4x4', lengths: [12, 14, 16, 18], options: [len([12, 14, 16, 18], 60), opt('part', 'Parting', ['Free', 'Middle'])], stock: 22, rating: 4.5, reviewCount: 31, popularity: 86, description: 'Free-part 4x4 closure, bleached knots.', specs: { Lace: '4x4 transparent' } },
    { id: 'cl55', title: '5x5 HD closure, body wave', category: 'closures', sellerId: 's-lumi', images: [IMG.glassWigs, IMG.blackTop], price: 990, compareAt: 1190, hairType: 'human', texture: 'Body wave', lace: '5x5', lengths: [12, 14, 16, 18, 20], options: [len([12, 14, 16, 18, 20], 70)], stock: 4, lowStockAt: 5, rating: 4.7, reviewCount: 18, popularity: 84, description: 'Larger parting space than a 4x4. Low stock.', specs: { Lace: '5x5 HD' } },
    { id: 'pt22', title: 'Braided ponytail, 28" jumbo', category: 'ponytails', sellerId: 's-nene', images: [IMG.colorWigs, IMG.braidHair], price: 349, hairType: 'synthetic', texture: 'Straight', lengths: [28], options: [opt('color', 'Colour', ['Black', '1B/30 ombre'])], stock: 40, rating: 4.1, reviewCount: 7, popularity: 72, description: 'Pre-braided drawstring ponytail, easy to attach.', specs: { 'Hair type': 'Synthetic' } },
    { id: 'pt23', title: 'Drawstring wave ponytail, human hair', category: 'ponytails', sellerId: 's-orient', images: [IMG.honeyBack2, IMG.blackSide], price: 899, hairType: 'human', texture: 'Body wave', lengths: [16, 20, 24], options: [len([16, 20, 24], 80)], stock: 18, rating: 4.4, reviewCount: 12, popularity: 76, description: 'Made in the seller\'s own workshop.', specs: { 'Hair type': 'Human hair' } },
    { id: 'ac1', title: 'Wig grip band, 2-pack', category: 'accessories', sellerId: 's-orient', images: [IMG.comb, IMG.careShelf], price: 129, stock: 120, lowStockAt: 20, rating: 4.6, reviewCount: 40, popularity: 82, options: [opt('color', 'Colour', ['Black', 'Beige'])], description: 'Velvet-lined adjustable grip bands.', specs: { Material: 'Velvet / elastic' } },
    { id: 'ac2', title: 'Detangling brush for wigs and bundles', category: 'accessories', sellerId: 's-lumi', images: [IMG.brush, IMG.comb], price: 189, stock: 55, rating: 4.5, reviewCount: 23, popularity: 78, description: 'Flexible bristles to minimise shedding when detangling.', specs: { Material: 'Nylon bristle' } },
    { id: 'ac3', title: 'Wig display stand, collapsible', category: 'accessories', sellerId: 's-orient', images: [IMG.mannequin, IMG.wigs1], price: 249, stock: 60, popularity: 55, description: 'Holds units while styling and storing.', specs: { Material: 'ABS plastic' } },
    { id: 'ac4', title: 'Satin sleep bonnet, adjustable', category: 'accessories', sellerId: 's-nene', images: [IMG.careShelf, IMG.brush], price: 99, stock: 80, rating: 4.7, reviewCount: 31, popularity: 74, options: [opt('color', 'Colour', ['Black', 'Pink'])], description: 'Double-layer satin bonnet.', specs: { Material: 'Satin' } },
    { id: 'wb1', title: 'Bulk straight bundles, 20" (10+ pcs)', category: 'wholesale', sellerId: 's-ubuntu', images: [IMG.warehouse, IMG.bundleOmbre], price: 520, hairType: 'human', texture: 'Straight', origin: 'Vietnamese', processing: 'Raw', lengths: [18, 20, 22, 24], options: [opt('length', 'Length', ['18"', '20"', '22"', '24"'])], stock: 600, rating: 4.7, reviewCount: 19, popularity: 90, description: 'Wholesale bundles for salons and resellers. Pricing steps down as quantity rises.', specs: { 'Hair type': 'Human hair', Weight: '100g per bundle' }, wholesale: wh(10, [[10, 520], [25, 485], [50, 450], [100, 420]], { samples: true, retailAlso: false }) },
    { id: 'wb2', title: 'Wholesale body wave bundle, 18"', category: 'wholesale', sellerId: 's-ubuntu', images: [IMG.shopStock, IMG.bundleOrange], price: 540, hairType: 'human', texture: 'Body wave', processing: 'Virgin', lengths: [16, 18, 20], options: [opt('length', 'Length', ['16"', '18"', '20"'])], stock: 420, rating: 4.6, reviewCount: 11, popularity: 87, description: 'Bulk body wave in a limited length range.', specs: { 'Hair type': 'Human hair' }, wholesale: wh(10, [[10, 540], [30, 500], [60, 465]], { samples: true }) },
    { id: 'wb3', title: 'Private-label lace front wigs (min. 6)', category: 'wholesale', sellerId: 's-orient', images: [IMG.shelfWigs, IMG.wigsBlack], price: 1950, hairType: 'human', construction: 'Lace front', texture: 'Body wave', lace: '13x4', lengths: [20, 24], options: [opt('length', 'Length', ['20"', '24"'])], stock: 90, popularity: 83, description: 'Manufactured to order with your label and packaging. Lead time applies.', specs: { Construction: 'Lace front 13x4' }, wholesale: wh(6, [[6, 1950], [12, 1790], [24, 1650]], { leadTime: '7–10 business days', processing: '3 business days', customisation: true, samples: false }) },
    { id: 'wb4', title: 'Wholesale 4x4 closures (min. 5)', category: 'wholesale', sellerId: 's-ubuntu', images: [IMG.marketStock, IMG.blackTop], price: 430, hairType: 'human', lace: '4x4', texture: 'Deep wave', lengths: [12, 14, 16], options: [opt('length', 'Length', ['12"', '14"', '16"'])], stock: 240, popularity: 79, description: 'Closures for resale. Retail quantities are also available.', specs: { Lace: '4x4' }, wholesale: wh(5, [[5, 430], [20, 395], [50, 360]], { retailAlso: true }) },
    { id: 'wb5', title: 'Ponytail extension case (24 units)', category: 'wholesale', sellerId: 's-orient', images: [IMG.spoolRows, IMG.braidHair], price: 210, hairType: 'synthetic', lengths: [28], options: [], stock: 300, popularity: 64, description: 'Mixed colours, boxed in sets of 24 for resale.', specs: { 'Units per case': '24' }, wholesale: wh(1, [[1, 210 * 24 * 0.85], [3, 210 * 24 * 0.8]], { leadTime: '7 days' }) },
    { id: 'wb6', title: 'Salon bundle pack: 20 mixed textures', category: 'wholesale', sellerId: 's-ubuntu', images: [IMG.careShelf, IMG.extWall], price: 9400, hairType: 'human', stock: 25, popularity: 60, options: [], description: 'Starter pack for new resellers: five textures, four lengths each.', specs: { Pack: '20 bundles' }, wholesale: wh(1, [[1, 9400], [3, 8900]], { samples: false, customisation: false }) },
    { id: 'cu16', title: 'Coily 4C clip-in set, 9 pieces', category: 'ponytails', sellerId: 's-nene', images: [IMG.extWall, IMG.curlyMannequin], price: 1190, hairType: 'human', texture: 'Coily', lengths: [14, 16, 18], options: [len([14, 16, 18], 110)], stock: 15, rating: 4.3, reviewCount: 8, popularity: 69, description: 'Fuller 9-piece set for 4C textures.', specs: { Pieces: '9' } },
    { id: 'ww', title: 'Water wave bundle, 3-pack', category: 'bundles', sellerId: 's-cape', images: [IMG.bundleOmbre, IMG.blackSide], price: 2190, hairType: 'human', texture: 'Water wave', origin: 'Cambodian', processing: 'Raw', lengths: [16, 18, 20, 22], options: [len([16, 18, 20, 22], 160)], stock: 10, rating: 4.6, reviewCount: 17, popularity: 81, description: bundleDesc, specs: { Texture: 'Water wave', Pieces: '3' } },
    { id: 'yk', title: 'Yaki straight bundle, relaxed texture', category: 'bundles', sellerId: 's-lumi', images: [IMG.honeyBack2, IMG.honeyBack], price: 640, hairType: 'blended', texture: 'Yaki', lengths: [12, 14, 16, 18, 20], options: [len([12, 14, 16, 18, 20], 60)], stock: 31, rating: 4.4, reviewCount: 15, popularity: 73, description: bundleDesc, specs: { Texture: 'Yaki straight', 'Hair type': 'Blended' } },
    { id: 'fw', title: 'Full lace wig, loose wave 22"', category: 'wigs', sellerId: 's-lumi', images: [IMG.redMannequins, IMG.wigs1], price: 5200, hairType: 'human', texture: 'Loose wave', construction: 'Full lace', lace: 'Full lace', density: '150%', processing: 'Virgin', lengths: [20, 22, 24], options: [len([20, 22, 24], 300), opt('capSize', 'Cap size', ['Medium', 'Large'])], stock: 3, lowStockAt: 5, rating: 4.9, reviewCount: 12, popularity: 89, description: wigDesc, specs: { Construction: 'Full lace', Density: '150%' } },
    { id: 'fr-d', title: '13x4 frontal (draft listing)', category: 'frontals', sellerId: 's-lumi', images: [IMG.wigs1], price: 1290, hairType: 'human', texture: 'Straight', lace: '13x4', stock: 0, status: 'draft', popularity: 0, description: 'Draft — not visible to buyers.', specs: {} },
  ] as P[]
).map(mk)

export const REVIEWS: Review[] = [
  { id: 'r1', productId: 'bw20', sellerId: 's-lumi', author: 'Naledi M.', rating: 5, title: 'Soft and full', body: 'Arrived well packed. Little shedding after the first wash and the wave held up.', date: '2026-09-28', verifiedPurchase: true, images: [IMG.bundleOrange], sellerResponse: 'Thank you Naledi — enjoy!', moderation: 'published' },
  { id: 'r2', productId: 'bw20', sellerId: 's-lumi', author: 'Ayanda K.', rating: 4, title: 'Good, slightly lighter than photos', body: 'Colour was a touch warmer than shown. Quality is good.', date: '2026-09-12', verifiedPurchase: true, moderation: 'published' },
  { id: 'r3', productId: 'wg13', sellerId: 's-lumi', author: 'Zinhle D.', rating: 5, title: 'Lace melted beautifully', body: 'The HD lace blended into my skin and the density feels natural at 180%.', date: '2026-10-02', verifiedPurchase: true, images: [IMG.blackTop], moderation: 'published' },
  { id: 'r4', productId: 'st18', sellerId: 's-cape', author: 'Lerato P.', rating: 5, title: 'Silky and tangle-free', body: 'Dispatch took 3 days but the hair was worth it.', date: '2026-09-20', verifiedPurchase: true, sellerResponse: 'Thanks Lerato!', moderation: 'published' },
  { id: 'r5', productId: 'wb1', sellerId: 's-ubuntu', author: 'Salon Studio 27', rating: 5, title: 'Consistent across the batch', body: 'Ordered 25 pieces. Length and weight were consistent. Quote came back the same day.', date: '2026-09-05', verifiedPurchase: true, moderation: 'published' },
  { id: 'r6', productId: 'kc14', sellerId: 's-nene', author: 'Thando S.', rating: 4, title: 'Blends well', body: 'Matches my 4A twist-out nicely.', date: '2026-08-30', verifiedPurchase: false, moderation: 'published' },
  { id: 'r7', productId: 'gl20', sellerId: 's-cape', author: 'Megan V.', rating: 4, title: 'Glueless is genuinely easy', body: 'Cap fits snugly; hairline needed a little plucking.', date: '2026-09-14', verifiedPurchase: true, moderation: 'published' },
  { id: 'r8', productId: 'ac2', sellerId: 's-lumi', author: 'Sipho N.', rating: 2, title: 'Not as described', body: 'Bristles felt stiff. [Reported — pending moderator review]', date: '2026-10-06', verifiedPurchase: true, moderation: 'pending', reported: true },
  { id: 'r9', sellerId: 's-lumi', author: 'Palesa R.', rating: 5, title: 'Great communication', body: 'Seller answered all my questions before I bought.', date: '2026-09-02', verifiedPurchase: true, moderation: 'published' },
]

export const QUESTIONS = [
  { productId: 'bw20', q: 'Can this be coloured?', a: 'Yes, the seller states it can be lightened to a #4 with a professional.', by: 'Lumi Hair Co.' },
  { productId: 'wg13', q: 'Is a wig cap included?', a: 'A stocking cap is included. Combs and an adjustable strap are built in.', by: 'Lumi Hair Co.' },
  { productId: 'wb1', q: 'Do you ship to Namibia?', a: 'Not in the demo configuration. International shipping is planned.', by: 'Ubuntu Bulk Hair' },
]

export const USERS: Record<string, User> = {
  buyer: { id: 'u-buyer', name: 'Thandi Mokoena', email: 'thandi@example.co.za', roles: ['buyer'], emailVerified: true, phoneVerified: false, phone: '082 555 0142' },
  seller: { id: 'u-seller', name: 'Lumi Owner', email: 'hello@lumihair.example', roles: ['buyer', 'seller'], sellerId: 's-lumi', emailVerified: true, phoneVerified: true, phone: '071 555 0188' },
  admin: { id: 'u-admin', name: 'Platform Admin', email: 'admin@blendd.example', roles: ['admin'], adminRole: 'super_admin', emailVerified: true, phoneVerified: true, phone: '' },
  support: { id: 'u-support', name: 'Support Agent', email: 'support@blendd.example', roles: ['admin'], adminRole: 'support' as AdminRole, emailVerified: true, phoneVerified: true, phone: '' },
}

const addr = (name: string, city: string, province: string) => ({ id: 'a-' + name, label: 'Home', name, phone: '082 555 0100', street: '12 Jacaranda Street', suburb: 'Sunninghill', city, province, postalCode: '2191', country: 'South Africa' })
const line = (productId: string, qty: number, selection: Record<string, string> = {}) => {
  const p = PRODUCTS.find((x) => x.id === productId)!
  return { productId, title: p.title, image: p.images[0], qty, unit: p.price, selection }
}

export const SEED_ORDERS: Order[] = [
  {
    id: 'o1', ref: 'BL-260918-4821', userId: 'u-buyer', placedAt: '2026-09-18T10:12:00', demo: true, address: addr('Thandi Mokoena', 'Johannesburg', 'Gauteng'),
    subtotal: 749 * 2 + 189, shipping: 85, discount: 0, vatIncluded: 0, total: 749 * 2 + 189 + 85, payment: { method: 'Card via payment provider', mode: 'demo', status: 'paid_demo' },
    groups: [{ sellerId: 's-lumi', lines: [line('bw20', 2, { length: '18"' }), line('ac2', 1)], methodLabel: 'Standard courier', shipping: 85, etaLabel: '2–4 business days after dispatch', status: 'delivered', tracking: { carrier: 'Demo Courier', number: 'DC-77120934' }, history: [{ status: 'paid', at: '2026-09-18T10:13:00' }, { status: 'processing', at: '2026-09-18T15:00:00' }, { status: 'shipped', at: '2026-09-19T09:30:00', note: 'Handed to courier' }, { status: 'delivered', at: '2026-09-22T13:05:00' }] }],
  },
  {
    id: 'o2', ref: 'BL-261004-1907', userId: 'u-buyer', placedAt: '2026-10-04T18:40:00', demo: true, address: addr('Thandi Mokoena', 'Johannesburg', 'Gauteng'),
    subtotal: 1190 + 349, shipping: 95 + 90, discount: 0, vatIncluded: 0, total: 1190 + 349 + 185, payment: { method: 'Instant EFT', mode: 'demo', status: 'paid_demo' },
    groups: [
      { sellerId: 's-cape', lines: [line('fr13', 1, { length: '16"' })], methodLabel: 'Standard courier', shipping: 95, etaLabel: '3–5 business days after dispatch', status: 'shipped', tracking: { carrier: 'Demo Courier', number: 'DC-77213300' }, history: [{ status: 'paid', at: '2026-10-04T18:41:00' }, { status: 'processing', at: '2026-10-05T08:00:00' }, { status: 'shipped', at: '2026-10-06T11:20:00' }] },
      { sellerId: 's-nene', lines: [line('pt22', 1, { color: 'Black' })], methodLabel: 'Standard courier', shipping: 90, etaLabel: '3–6 business days after dispatch', status: 'processing', history: [{ status: 'paid', at: '2026-10-04T18:41:00' }, { status: 'processing', at: '2026-10-06T10:00:00' }] },
    ],
  },
  {
    id: 'o3', ref: 'BL-261008-3355', userId: 'u-other1', placedAt: '2026-10-08T09:05:00', demo: true, address: addr('Zodwa Khumalo', 'Durban', 'KwaZulu-Natal'),
    subtotal: 3490, shipping: 85, discount: 0, vatIncluded: 0, total: 3575, payment: { method: 'Card via payment provider', mode: 'demo', status: 'paid_demo' },
    groups: [{ sellerId: 's-lumi', lines: [line('wg13', 1, { length: '22"', lace: 'HD lace', capSize: 'Medium', density: '180%' })], methodLabel: 'Standard courier', shipping: 85, etaLabel: '2–4 business days after dispatch', status: 'paid', history: [{ status: 'paid', at: '2026-10-08T09:06:00' }] }],
  },
  {
    id: 'o4', ref: 'BL-261009-6120', userId: 'u-other2', placedAt: '2026-10-09T14:22:00', demo: true, address: addr('Megan van Wyk', 'Cape Town', 'Western Cape'),
    subtotal: 990 + 189, shipping: 85, discount: 0, vatIncluded: 0, total: 1264, payment: { method: 'Instant EFT', mode: 'demo', status: 'paid_demo' },
    groups: [{ sellerId: 's-lumi', lines: [line('cl55', 1, { length: '14"' }), line('ac2', 1)], methodLabel: 'Express courier', shipping: 85, etaLabel: '1–2 business days after dispatch', status: 'return_requested', history: [{ status: 'paid', at: '2026-10-09T14:23:00' }, { status: 'delivered', at: '2026-10-10T16:00:00' }, { status: 'return_requested', at: '2026-10-10T19:00:00', note: 'Buyer reports a colour mismatch' }] }],
  },
  {
    id: 'o5', ref: 'BL-261010-2288', userId: 'u-other3', placedAt: '2026-10-10T08:10:00', demo: true, address: addr('Salon Studio 27', 'Pretoria', 'Gauteng'),
    subtotal: 520 * 25, shipping: 180, discount: 0, vatIncluded: 0, total: 13180, payment: { method: 'Instant EFT', mode: 'demo', status: 'paid_demo' },
    groups: [{ sellerId: 's-ubuntu', lines: [line('wb1', 25, { length: '20"' })], methodLabel: 'Standard courier', shipping: 180, etaLabel: '3–6 business days after dispatch', status: 'paid', history: [{ status: 'paid', at: '2026-10-10T08:11:00' }] }],
  },
]

export const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'n1', audience: 'buyer', userId: 'u-buyer', kind: 'order', title: 'Order shipped', body: 'Cape Weave House has shipped part of order BL-261004-1907.', at: '2026-10-06T11:21:00', read: false, href: '/account/orders/o2' },
  { id: 'n2', audience: 'buyer', userId: 'u-buyer', kind: 'message', title: 'New message from Lumi Hair Co.', body: 'Yes, that length is available in natural black.', at: '2026-10-07T09:00:00', read: false, href: '/account/messages' },
  { id: 'n3', audience: 'buyer', userId: 'u-buyer', kind: 'wishlist', title: 'Price change on your wishlist', body: 'Deep wave bundle deal is now R1,990 (was R2,390).', at: '2026-10-05T07:30:00', read: true, href: '/product/dw16' },
  { id: 'n4', audience: 'seller', kind: 'order', title: 'New order to fulfil', body: 'Order BL-261008-3355 is paid and waiting to be processed.', at: '2026-10-08T09:06:00', read: false, href: '/seller/orders' },
  { id: 'n5', audience: 'seller', kind: 'stock', title: 'Low stock', body: '5x5 HD closure, body wave has 4 units left.', at: '2026-10-09T12:00:00', read: false, href: '/seller/inventory' },
  { id: 'n6', audience: 'seller', kind: 'payout', title: 'Payout status (demo)', body: 'Payouts are not connected in demo mode.', at: '2026-10-01T08:00:00', read: true, href: '/seller/earnings' },
  { id: 'n7', audience: 'admin', kind: 'seller', title: 'Seller application waiting', body: 'Kasi Crown Wigs submitted verification documents.', at: '2026-10-09T10:00:00', read: false, href: '/admin/sellers' },
]

export const SEED_CONVERSATIONS: Conversation[] = [
  { id: 'c1', buyerName: 'Thandi Mokoena', sellerId: 's-lumi', productId: 'bw20', unread: 1, messages: [{ from: 'buyer', text: 'Hi! Is the 20" bundle available in natural black?', at: '2026-10-07T08:41:00' }, { from: 'seller', text: 'Yes, that length is available in natural black.', at: '2026-10-07T09:00:00' }] },
  { id: 'c2', buyerName: 'Thandi Mokoena', sellerId: 's-cape', productId: 'fr13', unread: 0, messages: [{ from: 'buyer', text: 'Do you bleach the knots?', at: '2026-10-01T12:00:00' }, { from: 'seller', text: 'Knots are lightly bleached, and the frontal is pre-plucked.', at: '2026-10-01T13:10:00' }] },
  { id: 'c3', buyerName: 'Megan van Wyk', sellerId: 's-lumi', productId: 'cl55', unread: 2, messages: [{ from: 'buyer', text: 'The closure colour looks different to the listing photos.', at: '2026-10-10T19:05:00' }] },
]

export const SEED_ENQUIRIES: Enquiry[] = [
  { id: 'e1', sellerId: 's-ubuntu', productId: 'wb1', buyerName: 'Salon Studio 27', email: 'orders@studio27.example', qty: 60, message: 'Can you do R430/unit at 60 pieces with a mixed length order?', at: '2026-10-09T11:00:00', status: 'new' },
  { id: 'e2', sellerId: 's-orient', productId: 'wb3', buyerName: 'Kgomotso Beauty', email: 'k@kgomotso.example', qty: 12, message: 'Interested in private label wigs. Do you have a sample?', at: '2026-10-07T15:30:00', status: 'quoted', response: 'Sample unavailable for private label; quote attached for 12 units.', quotedPrice: 1790 },
]

export const SEED_AUDIT: AuditEntry[] = [
  { id: 'a1', at: '2026-10-09T10:05:00', actor: 'Platform Admin', action: 'Approved listing', target: 'Wholesale 4x4 closures (min. 5)' },
  { id: 'a2', at: '2026-10-08T16:40:00', actor: 'Support Agent', action: 'Issued demo refund', target: 'Order BL-260801-7712' },
  { id: 'a3', at: '2026-10-07T09:12:00', actor: 'Platform Admin', action: 'Verified seller', target: 'Orient Strand Manufacturing' },
]

export const SEED_CATEGORY_ATTRS: Record<CategoryId, string[]> = {
  wigs: ['Texture', 'Length', 'Construction', 'Lace', 'Cap size', 'Density', 'Colour', 'Hair type'],
  bundles: ['Texture', 'Length', 'Colour', 'Origin', 'Processing', 'Hair type'],
  closures: ['Texture', 'Length', 'Lace', 'Parting', 'Hair type'],
  frontals: ['Texture', 'Length', 'Lace', 'Hair type'],
  ponytails: ['Texture', 'Length', 'Colour', 'Pieces', 'Hair type'],
  accessories: ['Material', 'Colour'],
  wholesale: ['MOQ', 'Tiers', 'Lead time', 'Texture', 'Length'],
}
