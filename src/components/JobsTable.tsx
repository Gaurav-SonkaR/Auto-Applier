import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useJobs, useRetryJob } from '../hooks/useJobs'
import { resumeDownloadUrl } from '../api/client'
import type { JobStatus } from '../types'

const STATUS_COLORS: Record<JobStatus, string> = {
  SCRAPED:           'bg-slate-600 text-slate-200',
  PARSED:            'bg-blue-900 text-blue-300',
  RESUME_READY:      'bg-indigo-900 text-indigo-300',
  APPLIED:           'bg-emerald-900 text-emerald-300',
  FAILED:            'bg-red-900 text-red-300',
  FLAGGED:           'bg-amber-900 text-amber-300',
  WAITING_CAPTCHA:   'bg-amber-900 text-amber-300',
  WAITING_LOGIN:     'bg-sky-900 text-sky-300',
  WAITING_OTP:       'bg-purple-900 text-purple-300',
  NEED_HUMAN_ACTION: 'bg-rose-900 text-rose-300',
  DUPLICATE:         'bg-slate-700 text-slate-400',
  SKIPPED:           'bg-slate-700 text-slate-400',
  BLACKLISTED:       'bg-slate-800 text-slate-500',
}

const STATUSES: JobStatus[] = [
  'SCRAPED', 'PARSED', 'RESUME_READY', 'APPLIED', 'FAILED', 'FLAGGED',
  'WAITING_CAPTCHA', 'WAITING_LOGIN', 'WAITING_OTP', 'NEED_HUMAN_ACTION',
  'DUPLICATE', 'SKIPPED', 'BLACKLISTED',
]
const PORTALS = ['all', 'linkedin', 'naukri', 'indeed', 'wellfound', 'cutshort', 'web']

const RETRYABLE: JobStatus[] = [
  'FAILED', 'FLAGGED', 'WAITING_CAPTCHA', 'WAITING_LOGIN', 'WAITING_OTP', 'NEED_HUMAN_ACTION',
]

interface Props {
  source?: 'portal' | 'career_site'
}

export function JobsTable({ source }: Props) {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [portalFilter, setPortalFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const { data: jobs = [], isLoading } = useJobs({
    status: statusFilter || undefined,
    portal: portalFilter || undefined,
    source,
    limit: 200,
  })

  const retryMut = useRetryJob()

  const paginated = jobs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(jobs.length / PAGE_SIZE)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select className="input w-auto" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {!source && (
          <select className="input w-auto" value={portalFilter} onChange={(e) => { setPortalFilter(e.target.value); setPage(0) }}>
            {PORTALS.map((p) => (
              <option key={p} value={p === 'all' ? '' : p}>{p[0].toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        )}
        <span className="text-xs text-slate-500 self-center">{jobs.length} jobs</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-800/70">
              <th className="px-3 py-2 text-left text-xs text-slate-400 font-medium w-12">ID</th>
              <th className="px-3 py-2 text-left text-xs text-slate-400 font-medium">Title</th>
              <th className="px-3 py-2 text-left text-xs text-slate-400 font-medium">Portal</th>
              <th className="px-3 py-2 text-left text-xs text-slate-400 font-medium">Status</th>
              <th className="px-3 py-2 text-left text-xs text-slate-400 font-medium w-14">ATS</th>
              <th className="px-3 py-2 text-left text-xs text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-3 py-2">
                      <div className="h-4 bg-slate-700 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-500 text-xs">
                  No jobs found
                </td>
              </tr>
            ) : (
              paginated.map((job) => (
                <tr key={job.job_id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-3 py-2 text-slate-500">
                    <Link to={`/jobs/${job.job_id}`} className="hover:text-indigo-400">{job.job_id}</Link>
                  </td>
                  <td className="px-3 py-2 max-w-xs">
                    <Link
                      to={`/jobs/${job.job_id}`}
                      className="text-indigo-400 hover:text-indigo-300 truncate block"
                      title={job.title}
                    >
                      {job.title || job.url}
                    </Link>
                    {job.company && (
                      <span className="text-xs text-slate-500">{job.company}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-400 capitalize">{job.portal === 'web' ? 'Career Site' : job.portal}</td>
                  <td className="px-3 py-2">
                    <span className={`badge ${STATUS_COLORS[job.status]}`}>{job.status}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-400">
                    {job.ats_score !== null ? `${job.ats_score}%` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {RETRYABLE.includes(job.status) && (
                        <button
                          className="btn-secondary text-xs px-2 py-1"
                          disabled={retryMut.isPending}
                          onClick={() => retryMut.mutate(job.job_id)}
                        >
                          Retry
                        </button>
                      )}
                      {job.resume_path && (
                        <a
                          href={resumeDownloadUrl(job.job_id)}
                          className="btn-secondary text-xs px-2 py-1"
                          download
                        >
                          PDF
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button
            className="btn-secondary px-3 py-1"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>
          <span className="text-slate-400">{page + 1} / {totalPages}</span>
          <button
            className="btn-secondary px-3 py-1"
            disabled={page === totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
