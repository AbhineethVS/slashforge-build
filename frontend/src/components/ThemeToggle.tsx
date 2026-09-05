import { useState } from 'react'

import { applyTheme, resolveInitialTheme, type Theme } from '../lib/theme'
import { Icon } from './Icon'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(() => resolveInitialTheme())
  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  const label = `Switch to ${next} theme`

  return (
    <button
      className={`icon-button theme-toggle ${className}`.trim()}
      type="button"
      onClick={() => {
        setTheme(next)
        applyTheme(next)
      }}
      aria-label={label}
      title={label}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  )
}
