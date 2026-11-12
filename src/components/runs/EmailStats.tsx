import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  getColdEmailPreview,
  getColdEmailStats,
  startColdEmail,
  uploadColdEmailFile,
} from '../../api/dashboard'
import { RefreshButton } from '../common/RefreshButton'
import type { ColdEmailImportResponse, ColdEmailPreview } from '../../types'

/**
 * Cold email campaigns.
 *
 * This form previously did not match the API at all: it posted `file_path`
 * where /cold-email/start requires `excel_path` (422 on every submit), read
 * four stat fields the endpoint does not return (NaN in the quota bar), and
 * collected a Gmail address and App Password that the backend never reads —
 * SMTP credentials come from the server's .env, and a credential field that
 * goes nowhere is worse than no field at all.
 *
 * The body itself is composed from the account's Profile, so the preview below
 * is the real message — this is the only feature in the app that writes to
 * strangers under the user's own name, and a bad send costs them their sending
 * reputation, not just a failed run.
 */
export function EmailStats() {
  const qc = useQueryClient()
  const { data: stats, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['cold-email-stats'],
    queryFn: getColdEmailStats,
  })

  const preview = useQuery({
    queryKey: ['cold-email-preview'],
    queryFn: getColdEmailPreview,
  })

  const [uploaded, setUploaded] = useState<ColdEmailImportResponse | null>(null)
  const [form, setForm] = useState({ role: '', batch_size: 10 })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadMut = useMutation({
    mutationFn: uploadColdEmailFile,
    onSuccess: (data) => {
      setUploaded(data)
      setError(null)
    },
    onError: (e: Error) => setError(e.message),
  })

  const startMut = useMutation({
    mutationFn: () =>
      startColdEmail({
        excel_path: uploaded!.saved_path,
        role: form.role,
        batch_size: form.batch_size,
      }),
    onSuccess: (data) => {
      setSuccess(`Campaign started — Run #${data.run_id}`)
      setError(null)
      qc.invalidateQueries({ queryKey: ['cold-email-stats'] })
    },
    onError: (e: Error) => setError(e.message),
  })

  return (
    <div className="space-y-5">
      {isLoading ? (
        <div className="card animate-pulse h-24" />
      ) : stats ? (
        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Cold Email Status</h3>
            <RefreshButton onRefresh={refetch} isRefreshing={isFetching} label="" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            <Stat label="Remaining today" value={stats.remaining_today} color="text-violet-600" />
            <Stat label="Sent" value={stats.sent} color="text-emerald-600" />
            <Stat label="Pending" value={stats.pending} color="text-sky-600" />
            <Stat label="Failed" value={stats.failed} color="text-red-600" />
            <Stat label="Total" value={stats.total} color="text-gray-700" />
          </div>
        </div>
      ) : null}

      {preview.data && <EmailPreview preview={preview.data} />}

      <div className="card space-y-3">
        <h3 className="text-sm font-semibold">Launch Campaign</h3>

        <div>
          <label className="label">Contact list (Excel or CSV)</label>
          <input
            type="file"
            ref={fileRef}
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) uploadMut.mutate(file)
            }}
          />
          <button
            type="button"
            className="btn-secondary text-xs w-full"
            onClick={() => fileRef.current?.click()}
            disabled={uploadMut.isPending}
          >
            {uploadMut.isPending
              ? 'Uploading…'
              : uploaded
                ? `✓ ${uploaded.row_count} rows loaded`
                : 'Choose file…'}
          </button>
          {uploaded && (
            <p className="text-xs text-gray-500 mt-1 truncate" title={uploaded.columns.join(', ')}>
              Columns: {uploaded.columns.join(', ')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Role (optional)</label>
            <input
              className="input"
              placeholder="Software Engineer"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Batch size</label>
            <input
              type="number"
              className="input"
              min={1}
              max={40}
              value={form.batch_size}
              onChange={(e) => setForm({ ...form, batch_size: Number(e.target.value) })}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Sending uses the Gmail address and App Password configured in the backend&apos;s{' '}
          <code className="text-gray-600">.env</code>. Credentials are never entered here or
          sent from the browser.
        </p>

        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-emerald-600">{success}</p>}

        <button
          type="button"
          className="btn-primary w-full"
          disabled={!uploaded || startMut.isPending || preview.data?.can_send === false}
          onClick={() => startMut.mutate()}
        >
          {startMut.isPending ? 'Starting…' : 'Send Emails'}
        </button>
      </div>
    </div>
  )
}

/**
 * The message itself, shown in full rather than described.
 *
 * Everything in it comes from the Profile page, so when something reads wrong
 * the fix is there — hence the link rather than an editor here.
 */
function EmailPreview({ preview }: { preview: ColdEmailPreview }) {
  const [open, setOpen] = useState(false)

  if (!preview.can_send) {
    return (
      <div className="card space-y-2 border-amber-200 bg-amber-50">
        <h3 className="text-sm font-semibold text-amber-800">Profile incomplete</h3>
        <p className="text-xs text-gray-700">
          Cold emails are written from your profile and signed with your name. Still missing:{' '}
          {preview.missing.join(', ')}.
        </p>
        <Link to="/profile" className="btn-primary text-xs px-3 py-1.5 inline-block w-fit">
          Open Profile
        </Link>
      </div>
    )
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">What recipients will see</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Composed from your{' '}
            <Link to="/profile" className="text-brand-600 underline">Profile</Link>. Wording
            varies per company; the facts never do.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary text-xs px-3 py-1 shrink-0"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Hide' : 'Show sample'}
        </button>
      </div>

      {open && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Subject: <span className="text-gray-800">{preview.subject}</span>
          </p>
          <pre className="text-xs bg-gray-100 border border-gray-200 rounded p-3 whitespace-pre-wrap overflow-x-auto text-gray-800">
            {preview.body}
          </pre>
        </div>
      )}

      {preview.warnings.length > 0 && (
        <ul className="space-y-1">
          {preview.warnings.map((w) => (
            <li key={w} className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              {w}
            </li>
          ))}
        </ul>
      )}

      {preview.daily_limit < preview.configured_limit && (
        <p className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1.5">
          Warming up: {preview.daily_limit} emails today, rising to{' '}
          {preview.configured_limit}/day over {preview.warmup_days} days. A new sending
          address that starts at full volume gets filtered before anyone replies.
        </p>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="text-xs text-gray-600">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  )
}
