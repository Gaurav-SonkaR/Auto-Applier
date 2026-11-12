/** A labelled text input. Exists so the profile editor's ~20 fields don't each
 *  repeat the same label/input/class trio. */
export function Field({
  label, id, value, onChange, type = 'text', placeholder,
}: {
  label: string
  id: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        className="input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
