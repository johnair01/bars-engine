'use client'

/**
 * Renders plain text with http(s) URLs turned into external links.
 * Used on BAR face/back so owners see the same link affordance as readers who read full body.
 */
export function LinkifiedDescription({ text, className = '' }: { text: string; className?: string }) {
  if (!text) return null
  const re = /(https?:\/\/[^\s<>"']+)/gi
  const parts = text.split(re)
  return (
    <span className={className}>
      {parts.map((part, i) =>
        /^https?:\/\//i.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline-offset-2 hover:underline break-all"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  )
}
