export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'luma.theme'

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

export function systemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(stored) ? stored : null
  } catch {
    return null
  }
}

/**
 * The inline bootstrap script in index.html resolves the theme before paint.
 * React reads that decision back so the toggle starts in the rendered state.
 */
export function resolveInitialTheme(): Theme {
  if (typeof document !== 'undefined') {
    const applied = document.documentElement.dataset.theme
    if (isTheme(applied)) return applied
  }
  return readStoredTheme() ?? systemTheme()
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // A blocked storage quota must never break the toggle itself.
  }
}
