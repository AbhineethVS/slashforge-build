type BrandMarkProps = {
  /** Rendered edge length of the mark in pixels. */
  size?: number
  /** Show the LUMA wordmark beside the mark. */
  withWordmark?: boolean
  tagline?: string
}

export function BrandMark({
  size = 30,
  withWordmark = true,
  tagline,
}: BrandMarkProps) {
  return (
    <span className="brand">
      <img
        className="brand-mark"
        src="/luma-mark.png"
        width={size}
        height={size}
        alt=""
        decoding="async"
      />
      {withWordmark && (
        <span className="brand-text">
          <span className="brand-wordmark">LUMA</span>
          {tagline && <span className="brand-tagline">{tagline}</span>}
        </span>
      )}
    </span>
  )
}
