import logo from '../../assets/blendd-logo.png'

/** The B symbol is cropped from the supplied brand board (square image) so its proportions stay exact. */
export function Mark({ size = 36 }: { size?: number }) {
  return (
    <span
      role="img"
      aria-label="BLENDD symbol"
      className="inline-block shrink-0 bg-ink"
      style={{
        width: size,
        height: size * (145 / 165),
        backgroundImage: `url(${logo})`,
        backgroundSize: '760% auto',
        backgroundPosition: '23.4% 9%',
        mixBlendMode: 'lighten',
      }}
    />
  )
}

export function Logo({ size = 34, tag = false, className = '' }: { size?: number; tag?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark size={size} />
      <span className="flex flex-col leading-none">
        <span className="font-wide text-pink" style={{ fontSize: size * 0.4, letterSpacing: '0.34em' }}>BLENDD</span>
        {tag && <span className="mt-1.5 text-[8px] tracking-[0.3em] text-white/60">HAIR SUPPLY MARKETPLACE</span>}
      </span>
    </span>
  )
}
