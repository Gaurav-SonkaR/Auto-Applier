import { useState } from 'react'

/**
 * A list of short strings — skills, tech stacks, courses — as removable chips.
 *
 * Enter or comma commits the current word, so a stack can be typed straight
 * through rather than clicking Add between each one.
 */
export function ChipList({
  label, items, onChange, placeholder,
}: {
  label: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}) {
  const [entry, setEntry] = useState('')

  function commit(raw: string) {
    // Splitting on comma means a pasted "Python, FastAPI, Redis" lands as three
    // chips instead of one long one.
    const additions = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !items.includes(s))
    if (additions.length) onChange([...items, ...additions])
    setEntry('')
  }

  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.length === 0 && <span className="text-xs text-gray-400">None yet</span>}
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 pl-2.5 pr-1 py-0.5 text-xs text-gray-700"
          >
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              className="text-gray-400 hover:text-red-600 px-1"
              onClick={() => onChange(items.filter((i) => i !== item))}
            >
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={entry}
          placeholder={placeholder}
          onChange={(e) => setEntry(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              // Inside a <form> Enter would submit; this field is its own thing.
              e.preventDefault()
              commit(entry)
            }
          }}
          // Committing on blur too, so a typed-but-not-entered value isn't
          // silently dropped when the user clicks Save.
          onBlur={() => entry.trim() && commit(entry)}
        />
        <button
          type="button"
          className="btn-secondary text-xs px-3"
          disabled={!entry.trim()}
          onClick={() => commit(entry)}
        >
          Add
        </button>
      </div>
    </div>
  )
}
