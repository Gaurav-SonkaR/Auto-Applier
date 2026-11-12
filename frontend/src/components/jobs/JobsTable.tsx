import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useJobs, useRetryJob } from '../../hooks/useJobs'
import { resumeDownloadUrl } from '../../api/resumes'
import { RefreshButton } from '../common/RefreshButton'
import { STATUS_COLORS, STATUSES } from '../../utils/jobStatus'
import type { JobStatus } from '../../types'

const PORTALS = ['all', 'linkedin', 'naukri', 'indeed', 'wellfound', 'cutshort', 'instahyre', 'web']

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

  const { data: jobs = [], isLoading, refetch, isFetching } = useJobs({
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
        <span className="text-xs text-gray-500 self-center">{jobs.length} jobs</span>
        <RefreshButton onRefresh={refetch} isRefreshing={isFetching} className="ml-auto" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              <th className="px-3 py-2 text-left text-xs text-gray-600 font-medium w-12">ID</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600 font-medium">Title</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600 font-medium">Portal</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600 font-medium">Status</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600 font-medium w-14">ATS</th>
              <th className="px-3 py-2 text-left text-xs text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-3 py-2">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-500 text-xs">
                  No jobs found
                </td>
              </tr>
            ) : (
              paginated.map((job) => (
                <tr key={job.job_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2 text-gray-500">
                    <Link to={`/jobs/${job.job_id}`} className="hover:text-brand-600">{job.job_id}</Link>
                  </td>
                  <td className="px-3 py-2 max-w-xs">
                    <Link
                      to={`/jobs/${job.job_id}`}
                      className="text-brand-600 hover:text-brand-800 truncate block"
                      title={job.title}
                    >
                      {job.title || job.url}
                    </Link>
                    {job.company && (
                      <span className="text-xs text-gray-500">{job.company}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-600 capitalize">{job.portal === 'web' ? 'Career Site' : job.portal}</td>
                  <td className="px-3 py-2">
                    <span className={`badge ${STATUS_COLORS[job.status]}`}>{job.status}</span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">
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
          <span className="text-gray-600">{page + 1} / {totalPages}</span>
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
