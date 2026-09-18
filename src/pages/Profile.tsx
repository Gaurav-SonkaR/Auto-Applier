import { useEffect, useRef, useState } from 'react'
import { useProfile, useSaveProfile } from '../hooks/useProfile'
import { RefreshButton } from '../components/common/RefreshButton'
import { ChipList } from '../components/profile/ChipList'
import { LineList } from '../components/profile/LineList'
import { Field } from '../components/profile/Field'
import { ProfileTabs } from '../components/profile/ProfileTabs'
import { formatDateTime } from '../utils/formatters'
import type {
  MasterProfile,
  ProfileExperience,
  ProfileProject,
} from '../types'

/**
 * The master data every generated resume is built from.
 *
 * This is what the LLM rewrites per job description — it does not invent
 * anything, so whatever is missing here is missing from every resume. It is
 * also per-account: the profile is the one part of the app that is pure
 * personal data, and nobody else, admins included, can read or edit it.
 */
export function Profile() {
  const { data, isLoading, refetch, isFetching } = useProfile()
  const save = useSaveProfile()

  const [draft, setDraft] = useState<MasterProfile | null>(null)
  // What the server last gave us, as a string. Comparing against this is what
  // makes "has the user edited anything" answerable without a second copy of
  // the document in state.
  const serverCopy = data ? JSON.stringify(data.profile) : null
  const dirty = draft != null && serverCopy != null && JSON.stringify(draft) !== serverCopy

  // Adopt the server's copy on load, and after a save returns the normalised
  // document — but never on top of unsaved edits. Refresh used to overwrite the
  // draft silently, so a click on it mid-edit threw the work away with no
  // warning and no undo. `dirty` is read through a ref because the effect must
  // not re-run when it flips.
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty

  useEffect(() => {
    if (data?.profile && !dirtyRef.current) setDraft(data.profile)
  }, [data?.profile])

  if (isLoading || !draft) {
    return <div className="card animate-pulse h-96" />
  }

  /** Every editor below funnels through this, so `draft` is only ever replaced
   *  wholesale — no nested mutation that React would miss. */
  function patch(changes: Partial<MasterProfile>) {
    setDraft((current) => (current ? { ...current, ...changes } : current))
  }

  return (
    <div className="space-y-5 max-w-4xl pb-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Profile</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Your master data. Every tailored resume is rewritten <em>from</em> this — nothing
            here means nothing on the resume.
          </p>
        </div>
        <RefreshButton onRefresh={refetch} isRefreshing={isFetching} />
      </div>

      <ProfileTabs />

      {dirty && (
        <p className="text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded px-3 py-2">
          You have unsaved changes, so Refresh will not overwrite them. Use{' '}
          <strong>Discard changes</strong> below to go back to the saved version.
        </p>
      )}

      {data && !data.is_complete && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Incomplete — resume generation needs at least a name, an email, and either some
          skills or one job. Runs will fail with that message until this is filled in.
        </p>
      )}

      <section className="card space-y-3">
        <SectionHeading
          title="Personal details"
          hint="Printed verbatim on the resume and typed into application forms. The LLM is forbidden from changing these."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" id="p-name" value={draft.personal.name}
                 onChange={(v) => patch({ personal: { ...draft.personal, name: v } })} />
          <Field label="Email" id="p-email" type="email" value={draft.personal.email}
                 onChange={(v) => patch({ personal: { ...draft.personal, email: v } })} />
          <Field label="Phone" id="p-phone" value={draft.personal.phone}
                 onChange={(v) => patch({ personal: { ...draft.personal, phone: v } })} />
          <Field label="Location" id="p-location" value={draft.personal.location}
                 onChange={(v) => patch({ personal: { ...draft.personal, location: v } })} />
          <Field label="LinkedIn" id="p-linkedin" value={draft.personal.linkedin}
                 onChange={(v) => patch({ personal: { ...draft.personal, linkedin: v } })} />
          <Field label="GitHub" id="p-github" value={draft.personal.github}
                 onChange={(v) => patch({ personal: { ...draft.personal, github: v } })} />
          <Field label="Kaggle" id="p-kaggle" value={draft.personal.kaggle}
                 onChange={(v) => patch({ personal: { ...draft.personal, kaggle: v } })} />
        </div>
        <Field
          label="Public resume link (optional)"
          id="p-resume-url"
          value={draft.personal.resume_url}
          placeholder="https://drive.google.com/..."
          onChange={(v) => patch({ personal: { ...draft.personal, resume_url: v } })}
        />
        <p className="text-xs text-gray-500">
          Cold emails link to this instead of attaching a PDF. A PDF attached to a first
          email from a stranger is the strongest spam signal you can send, so setting this
          measurably improves whether your mail is read.
        </p>
      </section>

      <section className="card space-y-3">
        <SectionHeading
          title="Application answers"
          hint="Wellfound, Naukri and LinkedIn ask these on every application. Filled in here, they are typed straight from your profile — left blank, the form is left blank rather than guessed at."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Total experience (years)" id="pf-exp"
                 value={draft.preferences.total_experience_years} placeholder="2"
                 onChange={(v) => patch({ preferences: { ...draft.preferences, total_experience_years: v } })} />
          <Field label="Notice period" id="pf-notice"
                 value={draft.preferences.notice_period} placeholder="30 days / Immediate"
                 onChange={(v) => patch({ preferences: { ...draft.preferences, notice_period: v } })} />
          <Field label="Willing to relocate" id="pf-reloc"
                 value={draft.preferences.willing_to_relocate} placeholder="Yes / No"
                 onChange={(v) => patch({ preferences: { ...draft.preferences, willing_to_relocate: v } })} />
          <Field label="Needs visa sponsorship" id="pf-visa"
                 value={draft.preferences.needs_visa_sponsorship} placeholder="No"
                 onChange={(v) => patch({ preferences: { ...draft.preferences, needs_visa_sponsorship: v } })} />
          <Field label="Current CTC" id="pf-cctc"
                 value={draft.preferences.current_ctc} placeholder="12 LPA"
                 onChange={(v) => patch({ preferences: { ...draft.preferences, current_ctc: v } })} />
          <Field label="Expected CTC" id="pf-ectc"
                 value={draft.preferences.expected_ctc} placeholder="20 LPA"
                 onChange={(v) => patch({ preferences: { ...draft.preferences, expected_ctc: v } })} />
        </div>
        <ChipList
          label="Preferred locations"
          items={draft.preferences.preferred_locations}
          onChange={(preferred_locations) => patch({ preferences: { ...draft.preferences, preferred_locations } })}
          placeholder="e.g. Remote"
        />
      </section>

      <section className="card space-y-4">
        <SectionHeading
          title="Skills"
          hint="Primary skills are reordered to match each job. Secondary ones only appear when the job description actually asks for them."
        />
        <ChipList
          label="Primary skills"
          items={draft.primary_skills}
          onChange={(primary_skills) => patch({ primary_skills })}
          placeholder="e.g. FastAPI"
        />
        <ChipList
          label="Secondary skills"
          items={draft.secondary_skills}
          onChange={(secondary_skills) => patch({ secondary_skills })}
          placeholder="e.g. Kubernetes"
        />
      </section>

      <section className="card space-y-4">
        <SectionHeading
          title="Experience"
          hint="Most recent first — the top entry's title also drives resume-based job search when you leave the search box blank."
        />
        <ListEditor
          items={draft.experience}
          onChange={(experience) => patch({ experience })}
          blank={{ title: '', company: '', bullets: [] }}
          addLabel="Add a role"
          empty="No roles yet."
          render={(role, update, rowId) => (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Job title" id={`x-title-${rowId}`} value={role.title}
                       onChange={(title) => update({ title })} />
                <Field label="Company" id={`x-co-${rowId}`} value={role.company ?? ''}
                       onChange={(company) => update({ company })} />
                <Field label="Client (optional)" id={`x-cl-${rowId}`} value={role.client ?? ''}
                       onChange={(client) => update({ client })} />
                <Field label="Location" id={`x-loc-${rowId}`} value={role.location ?? ''}
                       onChange={(location) => update({ location })} />
                <Field label="Start" id={`x-s-${rowId}`} value={role.start_date ?? ''}
                       placeholder="Jun 2025"
                       onChange={(start_date) => update({ start_date })} />
                <Field label="End" id={`x-e-${rowId}`} value={role.end_date ?? ''}
                       placeholder="Present"
                       onChange={(end_date) => update({ end_date })} />
              </div>
              <LineList
                label="Bullets"
                hint="Keep the numbers — the LLM may swap keywords but is told to preserve metrics."
                items={role.bullets ?? []}
                onChange={(bullets) => update({ bullets })}
                placeholder="Reduced API latency by 30% via query tuning and composite indexing"
              />
            </div>
          )}
          titleOf={(role) => role.title || 'Untitled role'}
          subtitleOf={(role) => [role.company, role.start_date && `${role.start_date} – ${role.end_date || 'Present'}`]
            .filter(Boolean).join(' · ')}
        />
      </section>

      <section className="card space-y-4">
        <SectionHeading
          title="Projects"
          hint="Reordered per job so the most relevant comes first."
        />
        <ListEditor
          items={draft.projects}
          onChange={(projects) => patch({ projects })}
          blank={{ name: '', tech_stack: [], bullets: [] }}
          addLabel="Add a project"
          empty="No projects yet."
          render={(project, update, rowId) => (
            <div className="space-y-3">
              <Field label="Name" id={`pr-n-${rowId}`} value={project.name}
                     onChange={(name) => update({ name })} />
              <ChipList
                label="Tech stack"
                items={project.tech_stack ?? []}
                onChange={(tech_stack) => update({ tech_stack })}
                placeholder="e.g. LangGraph"
              />
              <LineList
                label="Bullets"
                items={project.bullets ?? []}
                onChange={(bullets) => update({ bullets })}
                placeholder="Improved retrieval precision from 76% to 92%"
              />
            </div>
          )}
          titleOf={(project) => project.name || 'Untitled project'}
          subtitleOf={(project) => (project.tech_stack ?? []).slice(0, 5).join(' · ')}
        />
      </section>

      <section className="card space-y-3">
        <SectionHeading title="Education" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Degree" id="ed-degree" value={draft.education.degree}
                 onChange={(degree) => patch({ education: { ...draft.education, degree } })} />
          <Field label="Institution" id="ed-inst" value={draft.education.institution}
                 onChange={(institution) => patch({ education: { ...draft.education, institution } })} />
          <Field label="Start" id="ed-start" value={draft.education.start_date ?? ''}
                 placeholder="Oct 2023"
                 onChange={(start_date) => patch({ education: { ...draft.education, start_date } })} />
          <Field label="End" id="ed-end" value={draft.education.end_date ?? ''}
                 placeholder="Jun 2025"
                 onChange={(end_date) => patch({ education: { ...draft.education, end_date } })} />
        </div>
        <ChipList
          label="Relevant courses"
          items={draft.education.relevant_courses ?? []}
          onChange={(relevant_courses) => patch({ education: { ...draft.education, relevant_courses } })}
          placeholder="e.g. Machine Learning"
        />
      </section>

      <section className="card space-y-3">
        <SectionHeading title="Achievements" />
        <LineList
          label=""
          items={draft.achievements}
          onChange={(achievements) => patch({ achievements })}
          placeholder="Promoted from intern to full-time within 4 months"
        />
      </section>

      <SaveBar
        dirty={dirty}
        saving={save.isPending}
        error={save.isError ? (save.error as Error).message : null}
        saved={save.isSuccess && !dirty}
        updatedAt={data?.updated_at ?? null}
        onSave={() => save.mutate(draft)}
        onReset={() => data && setDraft(data.profile)}
      />
    </div>
  )
}

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
      {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
    </div>
  )
}

/**
 * Sticky footer rather than a button at the bottom of a long form — this page
 * scrolls well past a screen, and a save control you have to hunt for is how
 * edits get lost.
 */
function SaveBar({
  dirty, saving, error, saved, updatedAt, onSave, onReset,
}: {
  dirty: boolean
  saving: boolean
  error: string | null
  saved: boolean
  updatedAt: string | null
  onSave: () => void
  onReset: () => void
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur px-4 py-3">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          {error ? (
            <span className="text-red-600">{error}</span>
          ) : dirty ? (
            'Unsaved changes'
          ) : saved ? (
            <span className="text-emerald-600">Saved</span>
          ) : updatedAt ? (
            `Last saved ${formatDateTime(updatedAt)}`
          ) : (
            'Not saved yet'
          )}
        </p>
        <div className="flex gap-2">
          <button
            className="btn-secondary text-xs px-3 py-1.5"
            disabled={!dirty || saving}
            onClick={onReset}
          >
            Discard changes
          </button>
          <button
            className="btn-primary text-xs px-4 py-1.5"
            disabled={!dirty || saving}
            onClick={onSave}
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * A collapsible list of objects (roles, projects) with add / remove / reorder.
 *
 * Generic because experience and projects differ only in their inner fields —
 * two near-identical editors would have been ~150 duplicated lines.
 */
function ListEditor<T extends ProfileExperience | ProfileProject>({
  items, onChange, blank, render, titleOf, subtitleOf, addLabel, empty,
}: {
  items: T[]
  onChange: (items: T[]) => void
  blank: T
  render: (item: T, update: (changes: Partial<T>) => void, rowId: string) => React.ReactNode
  titleOf: (item: T) => string
  subtitleOf: (item: T) => string
  addLabel: string
  empty: string
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function updateAt(index: number, changes: Partial<T>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...changes } : item)))
  }

  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index))
    setOpenIndex(null)
  }

  function move(index: number, by: number) {
    const target = index + by
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
    setOpenIndex(target)
  }

  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="text-xs text-gray-500">{empty}</p>}

      {items.map((item, index) => {
        const open = openIndex === index
        return (
          <div key={index} className="border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <button
                type="button"
                className="text-left min-w-0 flex-1"
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span className="text-sm text-gray-800">{titleOf(item)}</span>
                {subtitleOf(item) && (
                  <span className="block text-xs text-gray-500 truncate">{subtitleOf(item)}</span>
                )}
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <IconButton label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>↑</IconButton>
                <IconButton label="Move down" disabled={index === items.length - 1} onClick={() => move(index, 1)}>↓</IconButton>
                <IconButton label="Remove" onClick={() => removeAt(index)} danger>✕</IconButton>
                <IconButton label={open ? 'Collapse' : 'Expand'} onClick={() => setOpenIndex(open ? null : index)}>
                  {open ? '▴' : '▾'}
                </IconButton>
              </div>
            </div>
            {open && (
              <div className="border-t border-gray-200 px-3 py-3">
                {/* Row position, not row content: ids built from `item.title`
                    collided the moment two rows shared a title — and two
                    freshly added rows both start empty — which pointed every
                    duplicate label at the first matching input. */}
                {render(item, (changes) => updateAt(index, changes), String(index))}
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        className="btn-secondary text-xs px-3 py-1.5"
        onClick={() => {
          onChange([...items, { ...blank }])
          setOpenIndex(items.length)
        }}
      >
        + {addLabel}
      </button>
    </div>
  )
}

function IconButton({
  children, label, onClick, disabled = false, danger = false,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`px-1.5 py-0.5 text-xs rounded border border-gray-200 disabled:opacity-30 ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  )
}
