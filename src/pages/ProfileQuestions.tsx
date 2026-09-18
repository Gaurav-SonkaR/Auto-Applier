import { useMemo, useState } from 'react'
import { RefreshButton } from '../components/common/RefreshButton'
import { ProfileTabs } from '../components/profile/ProfileTabs'
import {
  useDeleteQuestion,
  useQuestionBank,
  useSaveQuestionAnswer,
} from '../hooks/useProfile'
import type { AnswerMode, BankQuestion } from '../types'

type Filter = 'all' | 'unanswered' | 'review'

/**
 * The questions job portals ask on application forms, answered once.
 *
 * During a portal application the applier types these answers whenever a form
 * asks the same question in any of its usual wordings. Questions not answered
 * here are drafted from the profile and the job description, then show up
 * below marked for review — with the company and role already swapped for
 * {company} and {role}, so a draft written for one employer never reaches
 * another.
 */
export function ProfileQuestions() {
  const { data, isLoading, refetch, isFetching } = useQuestionBank()
  const [filter, setFilter] = useState<Filter>('all')

  const grouped = useMemo(() => {
    if (!data) return []
    const visible = data.items.filter((item) =>
      filter === 'review' ? item.needs_review
        : filter === 'unanswered' ? !item.answer.trim()
          : true,
    )
    return data.categories
      .map((category) => ({
        category,
        items: visible.filter((item) => item.category === category),
      }))
      .filter((group) => group.items.length > 0)
  }, [data, filter])

  return (
    <div className="space-y-5 max-w-4xl pb-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Profile</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Answers typed into job-portal application forms. Career-site jobs are applied to by
            hand, so these are used for portal applications only.
          </p>
        </div>
        <RefreshButton onRefresh={refetch} isRefreshing={isFetching} />
      </div>

      <ProfileTabs />

      {isLoading || !data ? (
        <div className="card animate-pulse h-64" />
      ) : (
        <>
          <section className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {data.answered} of {data.total} answered
                </p>
                <div className="mt-1 h-1.5 w-64 max-w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-brand-500"
                    style={{ width: `${data.total ? (data.answered / data.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="flex gap-1" role="tablist" aria-label="Filter questions">
                {([
                  ['all', 'All'],
                  ['unanswered', 'Unanswered'],
                  ['review', `Needs review${data.needs_review ? ` (${data.needs_review})` : ''}`],
                ] as [Filter, string][]).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={filter === value}
                    onClick={() => setFilter(value)}
                    className={`px-2.5 py-1 rounded text-xs ${
                      filter === value
                        ? 'bg-brand-100 text-brand-800 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <ul className="text-xs text-gray-500 space-y-1 list-disc pl-4">
              <li>
                <strong className="text-gray-700">Used as written</strong> answers are typed exactly;
                write <code className="text-gray-700">{'{company}'}</code> or{' '}
                <code className="text-gray-700">{'{role}'}</code> where the employer or job title
                should go.
              </li>
              <li>
                <strong className="text-gray-700">Adapted per company</strong> answers keep what you
                wrote and are reworded for each job description — nothing is added to them.
              </li>
              <li>
                Left blank, a question is drafted from your profile when a form asks it, and appears
                here for review. Yes/no and dropdown questions are only ever answered from what you
                wrote yourself.
              </li>
            </ul>
          </section>

          {data.needs_review > 0 && filter !== 'review' && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              {data.needs_review} answer{data.needs_review === 1 ? ' was' : 's were'} drafted during
              applications and {data.needs_review === 1 ? 'has' : 'have'} not been checked.{' '}
              <button type="button" className="underline" onClick={() => setFilter('review')}>
                Review {data.needs_review === 1 ? 'it' : 'them'}
              </button>
            </p>
          )}

          {grouped.length === 0 ? (
            <p className="card text-xs text-gray-500 text-center py-8">Nothing here.</p>
          ) : (
            grouped.map((group) => (
              <section key={group.category} className="card space-y-4">
                <h2 className="font-semibold text-gray-800 text-sm">{group.category}</h2>
                <div className="divide-y divide-gray-100">
                  {group.items.map((item) => (
                    <QuestionRow key={item.key} item={item} />
                  ))}
                </div>
              </section>
            ))
          )}

          <AddQuestion categories={data.categories} />
        </>
      )}
    </div>
  )
}

function QuestionRow({ item }: { item: BankQuestion }) {
  const save = useSaveQuestionAnswer()
  const remove = useDeleteQuestion()
  const [answer, setAnswer] = useState(item.answer)
  const [mode, setMode] = useState<AnswerMode>(item.mode)

  // A save elsewhere replaces `item`; follow it unless this row has edits.
  const [seen, setSeen] = useState(item)
  if (seen !== item) {
    setSeen(item)
    if (answer === seen.answer && mode === seen.mode) {
      setAnswer(item.answer)
      setMode(item.mode)
    }
  }

  const dirty = answer !== item.answer || mode !== item.mode
  const busy = save.isPending || remove.isPending
  const rowId = `q-${item.key.replace(/\s+/g, '-')}`

  return (
    <div className="py-3 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <label htmlFor={rowId} className="text-sm text-gray-800 flex-1 min-w-[14rem]">
          {item.question}
        </label>
        <div className="flex items-center gap-1.5 shrink-0">
          {item.needs_review && (
            <span className="badge bg-amber-100 text-amber-800" title="Drafted during an application">
              Review
            </span>
          )}
          {item.used_count > 0 && (
            <span className="badge bg-gray-100 text-gray-600">Used {item.used_count}×</span>
          )}
        </div>
      </div>

      {item.hint && <p className="text-xs text-gray-500">{item.hint}</p>}

      <textarea
        id={rowId}
        className="input min-h-[3.5rem] resize-y"
        value={answer}
        placeholder={item.mode === 'tailor' ? 'What you would say — it is adapted to each job' : 'Your answer'}
        onChange={(e) => setAnswer(e.target.value)}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          aria-label={`How "${item.question}" is used`}
          className="input w-auto text-xs py-1"
          value={mode}
          onChange={(e) => setMode(e.target.value as AnswerMode)}
        >
          <option value="fixed">Used as written</option>
          <option value="tailor">Adapted per company</option>
        </select>

        <div className="flex gap-1.5">
          {save.isError && (
            <span className="text-xs text-red-600 self-center">{(save.error as Error).message}</span>
          )}
          {item.catalogue_id === null && item.qa_id !== null && (
            <button
              type="button"
              className="btn-secondary text-xs px-2 py-1 text-red-600"
              disabled={busy}
              onClick={() => remove.mutate(item.qa_id as number)}
            >
              Delete
            </button>
          )}
          {item.needs_review && !dirty && (
            <button
              type="button"
              className="btn-secondary text-xs px-2 py-1"
              disabled={busy}
              onClick={() => save.mutate({ question: item.question, answer, mode })}
              title="Keep this draft as your own answer"
            >
              Looks right
            </button>
          )}
          {dirty && (
            <>
              <button
                type="button"
                className="btn-secondary text-xs px-2 py-1"
                disabled={busy}
                onClick={() => {
                  setAnswer(item.answer)
                  setMode(item.mode)
                }}
              >
                Discard
              </button>
              <button
                type="button"
                className="btn-primary text-xs px-3 py-1"
                disabled={busy}
                onClick={() => save.mutate({ question: item.question, answer, mode, category: item.category })}
              >
                {save.isPending ? 'Saving…' : answer.trim() ? 'Save' : 'Clear answer'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** A question a portal asked that isn't in the catalogue. */
function AddQuestion({ categories }: { categories: string[] }) {
  const save = useSaveQuestionAnswer()
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [category, setCategory] = useState('Other')
  const [mode, setMode] = useState<AnswerMode>('fixed')

  return (
    <section className="card space-y-3">
      <div>
        <h2 className="font-semibold text-gray-800 text-sm">Add your own question</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          For a question a portal asked that isn&apos;t listed above. Matching ignores case,
          punctuation and the company&apos;s name, so write it once.
        </p>
      </div>
      <input
        aria-label="Question"
        className="input"
        placeholder="e.g. Do you contribute to open source?"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <textarea
        aria-label="Answer"
        className="input min-h-[3.5rem] resize-y"
        placeholder="Your answer"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <select aria-label="Category" className="input w-auto text-xs py-1" value={category}
                  onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select aria-label="How it is used" className="input w-auto text-xs py-1" value={mode}
                  onChange={(e) => setMode(e.target.value as AnswerMode)}>
            <option value="fixed">Used as written</option>
            <option value="tailor">Adapted per company</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {save.isError && <span className="text-xs text-red-600">{(save.error as Error).message}</span>}
          <button
            type="button"
            className="btn-primary text-xs px-3 py-1.5"
            disabled={save.isPending || question.trim().length < 2 || !answer.trim()}
            onClick={() =>
              save.mutate(
                { question, answer, mode, category },
                { onSuccess: () => { setQuestion(''); setAnswer('') } },
              )
            }
          >
            {save.isPending ? 'Adding…' : 'Add question'}
          </button>
        </div>
      </div>
    </section>
  )
}
