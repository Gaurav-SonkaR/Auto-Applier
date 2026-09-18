import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { libraryDownloadUrl } from '../api/resumes'
import {
  useDeleteResume,
  useResumeLibrary,
  useSetMasterResume,
  useUploadResume,
} from '../hooks/useResumes'
import { AccountsPanel } from '../components/common/AccountsPanel'
import { RefreshButton } from '../components/common/RefreshButton'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../utils/formatters'
import type { Resume } from '../types'

/**
 * Resume library management.
 *
 * The master resume is what portal job search uses when no keyword is typed —
 * its extracted title and top skills become the query. Any uploaded resume can
 * also be attached to an application when resume tailoring fails.
 */
export function Settings() {
  const { isAdmin } = useAuth()
  const { data, isLoading, refetch, isFetching } = useResumeLibrary()
  const upload = useUploadResume()
  const setMaster = useSetMasterResume()
  const remove = useDeleteResume()

  const fileInput = useRef<HTMLInputElement>(null)
  const [label, setLabel] = useState('')

  const resumes = data?.items ?? []
  const hasMaster = data?.master_resume_id != null

  function handleUpload() {
    const file = fileInput.current?.files?.[0]
    if (!file) return
    upload.mutate(
      { file, label },
      {
        onSuccess: () => {
          setLabel('')
          if (fileInput.current) fileInput.current.value = ''
        },
      },
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Settings</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage the resumes AutoApply uses to search and to apply.
          </p>
        </div>
        <RefreshButton onRefresh={refetch} isRefreshing={isFetching} />
      </div>

      <section className="card space-y-4">
        <div>
          <h2 className="font-semibold text-gray-800 text-sm">Resume library</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            The <strong className="text-gray-700">master</strong> resume drives portal job
            search: leave the job title blank when starting a run and its title and top skills
            become the search query.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[12rem]">
            <label className="block text-xs text-gray-600 mb-1" htmlFor="resume-file">
              PDF file
            </label>
            <input
              id="resume-file"
              ref={fileInput}
              type="file"
              accept="application/pdf,.pdf"
              className="input text-xs file:mr-2 file:rounded file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-gray-800"
            />
          </div>
          <div className="flex-1 min-w-[10rem]">
            <label className="block text-xs text-gray-600 mb-1" htmlFor="resume-label">
              Label (optional)
            </label>
            <input
              id="resume-label"
              className="input"
              placeholder="e.g. Backend-focused"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <button
            className="btn-primary text-xs px-4 py-2"
            disabled={upload.isPending}
            onClick={handleUpload}
          >
            {upload.isPending ? 'Uploading…' : 'Upload'}
          </button>
        </div>

        {upload.isError && (
          <p className="text-xs text-red-600">{(upload.error as Error).message}</p>
        )}
        {upload.isSuccess && (
          <p className="text-xs text-emerald-600">{upload.data.message}</p>
        )}

        {isLoading ? (
          <div className="h-20 bg-gray-200 rounded animate-pulse" />
        ) : resumes.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center">
            No resumes uploaded yet. The first one you upload becomes the master automatically.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {resumes.map((resume) => (
              <ResumeRow
                key={resume.resume_id}
                resume={resume}
                busy={setMaster.isPending || remove.isPending}
                onMakeMaster={() => setMaster.mutate(resume.resume_id)}
                onDelete={() => remove.mutate(resume.resume_id)}
              />
            ))}
          </ul>
        )}

        {!hasMaster && resumes.length > 0 && (
          <p className="text-xs text-amber-600">
            No master resume set — portal search will fall back to your{' '}
            <Link to="/profile" className="underline">profile</Link>.
          </p>
        )}
      </section>

      {isAdmin && <AccountsPanel />}

      <section className="card space-y-2">
        <h2 className="font-semibold text-gray-800 text-sm">Master data</h2>
        <p className="text-xs text-gray-500">
          Your name, skills, experience and projects live on the{' '}
          <Link to="/profile" className="text-brand-600 underline">Profile</Link> page. Every
          tailored resume is rewritten from that — it is per-account, so nobody else can read
          or edit it.
        </p>
      </section>

      <section className="card space-y-2">
        <h2 className="font-semibold text-gray-800 text-sm">Configuration</h2>
        <p className="text-xs text-gray-500">
          API keys, portal credentials and limits are read from the backend&apos;s{' '}
          <code className="text-gray-600">.env</code> file and are never sent to the browser.
          Edit that file and restart the backend to change them.
        </p>
      </section>
    </div>
  )
}

interface RowProps {
  resume: Resume
  busy: boolean
  onMakeMaster: () => void
  onDelete: () => void
}

function ResumeRow({ resume, busy, onMakeMaster, onDelete }: RowProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <li className="py-3 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-800 truncate">{resume.label || resume.filename}</span>
          {resume.is_master && (
            <span className="badge bg-emerald-100 text-emerald-800">Master</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {resume.extracted_title ?? 'Unknown role'} · {resume.skills.length} skills ·{' '}
          {resume.page_count ?? '?'} page{resume.page_count === 1 ? '' : 's'} ·{' '}
          {formatDate(resume.uploaded_at)}
        </p>
        {resume.skills.length > 0 && (
          <p className="text-xs text-gray-400 mt-1 truncate" title={resume.skills.join(', ')}>
            {resume.skills.slice(0, 8).join(' · ')}
            {resume.skills.length > 8 && ` +${resume.skills.length - 8} more`}
          </p>
        )}
      </div>

      <div className="flex gap-1 shrink-0">
        {!resume.is_master && (
          <button
            className="btn-secondary text-xs px-2 py-1"
            disabled={busy}
            onClick={onMakeMaster}
          >
            Make master
          </button>
        )}
        <a
          href={libraryDownloadUrl(resume.resume_id)}
          className="btn-secondary text-xs px-2 py-1"
          download
        >
          PDF
        </a>
        {confirming ? (
          <>
            <button
              className="btn-secondary text-xs px-2 py-1 text-red-600"
              disabled={busy}
              onClick={onDelete}
            >
              Confirm
            </button>
            <button
              className="btn-secondary text-xs px-2 py-1"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            className="btn-secondary text-xs px-2 py-1 text-gray-500"
            onClick={() => setConfirming(true)}
          >
            Delete
          </button>
        )}
      </div>
    </li>
  )
}
