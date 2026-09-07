import { useId } from 'react'

export type ChatPromptEntry = {
  id: string
  text: string
}

type ChatPromptRailProps = {
  prompts: readonly ChatPromptEntry[]
  onJump: (promptId: string) => void
}

function truncatePrompt(text: string, max = 52): string {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (compact.length <= max) return compact
  return `${compact.slice(0, max - 1).trimEnd()}…`
}

export function promptAnchorId(promptId: string): string {
  return `prompt-${promptId}`
}

export function ChatPromptRail({ prompts, onJump }: ChatPromptRailProps) {
  const labelId = useId()

  if (prompts.length === 0) return null

  return (
    <nav className="chat-prompt-rail" aria-labelledby={labelId}>
      <p id={labelId} className="sr-only">
        Jump to earlier questions
      </p>
      <div className="chat-prompt-rail-ticks" aria-hidden="true">
        {prompts.map((prompt) => (
          <span key={prompt.id} className="chat-prompt-rail-tick" />
        ))}
      </div>
      <ul className="chat-prompt-rail-menu">
        {prompts.map((prompt) => (
          <li key={prompt.id}>
            <button
              type="button"
              title={prompt.text}
              onClick={() => onJump(prompt.id)}
            >
              {truncatePrompt(prompt.text)}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
