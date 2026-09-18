/**
 * A list of sentences — resume bullets, achievements.
 *
 * Textareas rather than inputs: bullets run to ~25 words and wrapping matters
 * when checking them against the length limits the resume prompt enforces.
 */
export function LineList({
  label, hint, items, onChange, placeholder,
}: {
  label: string
  hint?: string
  items: string[]
  onChange: (items: string[]) => void
  placeholder?: string
}) {
  return (
    <div>
      {label && <span className="label">{label}</span>}
      {hint && <p className="text-xs text-gray-500 mb-1">{hint}</p>}

      <div className="space-y-2">
        {items.length === 0 && <p className="text-xs text-gray-400">None yet</p>}
        {items.map((item, index) => (
          <div key={index} className="flex gap-2 items-start">
            <textarea
              className="input flex-1 min-h-[3.5rem] resize-y"
              value={item}
              placeholder={placeholder}
              onChange={(e) =>
                onChange(items.map((v, i) => (i === index ? e.target.value : v)))
              }
            />
            <button
              type="button"
              aria-label="Remove line"
              className="text-xs text-gray-400 hover:text-red-600 border border-gray-200 rounded px-1.5 py-1 mt-0.5"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn-secondary text-xs px-3 py-1 mt-2"
        onClick={() => onChange([...items, ''])}
      >
        + Add line
      </button>
    </div>
  )
}
