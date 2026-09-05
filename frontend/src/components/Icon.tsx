import type { ReactElement, SVGProps } from 'react'

/**
 * One hand-authored 24px stroke icon family for the whole product.
 * Icons are always decorative: every control keeps a readable text label or an
 * explicit accessible name, so each glyph is rendered aria-hidden.
 */
export type IconName =
  | 'plus'
  | 'file'
  | 'sparkle'
  | 'cards'
  | 'check-circle'
  | 'teach'
  | 'chart'
  | 'audio'
  | 'mic'
  | 'stop'
  | 'send'
  | 'arrow-right'
  | 'arrow-left'
  | 'sun'
  | 'moon'
  | 'close'
  | 'refresh'
  | 'trash'
  | 'shield'
  | 'target'
  | 'play'
  | 'pause'
  | 'download'
  | 'alert'
  | 'quote'
  | 'panel-left'
  | 'panel-right'
  | 'book'
  | 'check'
  | 'spark-small'

const paths: Record<IconName, ReactElement> = {
  plus: <path d="M12 5v14M5 12h14" />,
  file: (
    <>
      <path d="M13.5 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z" />
      <path d="M13.5 3v5.5H19" />
    </>
  ),
  sparkle: (
    <>
      <path d="M11 4.5 12.6 9 17 10.6 12.6 12.2 11 16.7 9.4 12.2 5 10.6 9.4 9z" />
      <path d="M17.8 15.4l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
    </>
  ),
  cards: (
    <>
      <rect x="3" y="7" width="13" height="13" rx="2.5" />
      <path d="M8 4h10a2.5 2.5 0 0 1 2.5 2.5v10" />
    </>
  ),
  'check-circle': (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
    </>
  ),
  teach: (
    <>
      <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9.5L5 20v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 20.5h17" />
      <path d="M6.5 20.5V13M11 20.5V5.5M15.5 20.5v-5M20 20.5v-9" />
    </>
  ),
  audio: (
    <>
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      <path d="M4 14.5h2.2a1 1 0 0 1 1 1v3.2a1 1 0 0 1-1 1H5.6A1.6 1.6 0 0 1 4 18.1z" />
      <path d="M20 14.5h-2.2a1 1 0 0 0-1 1v3.2a1 1 0 0 0 1 1h.6a1.6 1.6 0 0 0 1.6-1.6z" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18v3M9 21h6" />
    </>
  ),
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2" />,
  send: <path d="M4.5 12h13M12.5 6.5 18.5 12l-6 5.5" />,
  'arrow-right': <path d="M4.5 12h14M13 6l6 6-6 6" />,
  'arrow-left': <path d="M19.5 12h-14M11 6l-6 6 6 6" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </>
  ),
  moon: <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.5 8.5 0 1 0 20 14.2z" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4.5V10h-5.5" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.5h15M9.5 6.5V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.7" />
      <path d="M6.5 6.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.2 19 6v5.4c0 4.2-2.8 7.6-7 9.4-4.2-1.8-7-5.2-7-9.4V6z" />
      <path d="m9 12 2.2 2.2L15.4 10" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </>
  ),
  play: <path d="M8.5 5.5 18 12l-9.5 6.5z" />,
  pause: <path d="M9.5 5.5v13M14.5 5.5v13" />,
  download: (
    <>
      <path d="M12 3.5v11M7.5 10.5l4.5 4.5 4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4.2 21 19.5H3z" />
      <path d="M12 10v4M12 16.7v.1" />
    </>
  ),
  quote: (
    <path d="M9.5 6.5C6.9 7.7 5.5 9.9 5.5 13v4.5h5V12H8c0-1.9.7-3.2 2.2-4zm9 0C15.9 7.7 14.5 9.9 14.5 13v4.5h5V12H17c0-1.9.7-3.2 2.2-4z" />
  ),
  'panel-left': (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M10 4.5v15" />
    </>
  ),
  'panel-right': (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M14 4.5v15" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.2A2.2 2.2 0 0 1 6.2 3H19v14.5H6.2A2.2 2.2 0 0 0 4 19.7z" />
      <path d="M4 19.7A2.2 2.2 0 0 1 6.2 17.5H19V21H6.2A2.2 2.2 0 0 1 4 18.8z" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  'spark-small': (
    <path d="M12 4.5 13.6 10 19 11.6 13.6 13.2 12 18.7 10.4 13.2 5 11.6 10.4 10z" />
  ),
}

type IconProps = {
  name: IconName
  size?: number
} & Omit<SVGProps<SVGSVGElement>, 'name'>

export function Icon({ name, size = 18, ...rest }: IconProps) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}
