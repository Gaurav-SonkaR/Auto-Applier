import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getColdEmailStats, uploadColdEmailFile, startColdEmail } from '../api/client'
import type { ColdEmailStartRequest, UploadResponse } from '../types'

export function EmailStats() {
  const qc = useQueryClient()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['cold-email-stats'],
    queryFn: getColdEmailStats,
    refetchInterval: 30_000,
  })

  const [uploadedFile, setUploadedFile] = useState<UploadResponse | null>(null)
  const [form, setForm] = useState<Omit<ColdEmailStartRequest, 'file_path'>>({
    role: '',
    batch_size: 10,
    gmail_address: '',
    gmail_app_password: '',
    resume_per_tech_stack: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadMut = useMutation({
    mutationFn: uploadColdEmailFile,
    onSuccess: (data) => setUploadedFile(data),
    onError: (e: Error) => setError(e.message),
  })

  const startMut = useMutation({
    mutationFn: () =>
      startColdEmail({ ...form, file_path: uploadedFile!.file_path }),
    onSuccess: (data) => {
      setSuccess(`Campaign started — Run #${data.run_id}`)
      setError(null)
      qc.invalidateQueries({ queryKey: ['cold-email-stats'] })
    },
    onError: (e: Error) => setError(e.message),
  })

  const percentUsed = stats ? Math.min(100, Math.round((stats.sent_today / stats.daily_limit) * 100)) : 0

  return (
    <div className="space-y-5">
      {/* Today's quota bar */}
      {isLoading ? (
        <div className="card animate-pulse h-24" />
      ) : stats ? (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold">Cold Email Quota</h3>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Sent today: <strong className="text-violet-400">{stats.sent_today}</strong></span>
            <span>Limit: {stats.daily_limit}</span>
            <span>Total: {stats.sent_total}</span>
            <span>Failed: {stats.failed_total}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${percentUsed >= 90 ? 'bg-red-500' : 'bg-violet-500'}`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">{percentUsed}% of daily limit used</p>
        </div>
      ) : null}

      {/* Launch form */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold">Launch Campaign</h3>

        <div>
          <label className="label">Excel / CSV File</label>
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileRef}
              accept=".xlsx,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadMut.mutate(file)
              }}
            />
            <button
              type="button"
              className="btn-secondary text-xs flex-1"
              onClick={() => fileRef.current?.click()}
              disabled={uploadMut.isPending}
            >
              {uploadMut.isPending ? 'Uploading…' : uploadedFile ? `✓ ${uploadedFile.row_count} rows loaded` : 'Choose file…'}
            </button>
          </div>
          {uploadedFile && (
            <p className="text-xs text-slate-500 mt-1">
              Columns: {uploadedFile.columns.join(', ')}
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
            <label className="label">Batch Size</label>
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

        <div>
          <label className="label">Gmail Address</label>
          <input
            className="input"
            type="email"
            placeholder="you@gmail.com"
            value={form.gmail_address}
            onChange={(e) => setForm({ ...form, gmail_address: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Gmail App Password</label>
          <input
            className="input"
            type="password"
            placeholder="xxxx xxxx xxxx xxxx"
            value={form.gmail_app_password}
            onChange={(e) => setForm({ ...form, gmail_app_password: e.target.value })}
          />
          <p className="text-xs text-slate-500 mt-1">
            Use an App Password, not your regular password.
            <a className="text-indigo-400 ml-1 hover:underline" href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">
              Generate →
            </a>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="resume_per_stack"
            type="checkbox"
            className="accent-indigo-500 w-4 h-4"
            checked={form.resume_per_tech_stack}
            onChange={(e) => setForm({ ...form, resume_per_tech_stack: e.target.checked })}
          />
          <label htmlFor="resume_per_stack" className="text-xs text-slate-400 cursor-pointer">
            Generate separate resume per tech stack
          </label>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
        {success && <p className="text-xs text-emerald-400">{success}</p>}

        <button
          type="button"
          className="btn-primary w-full"
          disabled={!uploadedFile || !form.gmail_address || !form.gmail_app_password || startMut.isPending}
          onClick={() => startMut.mutate()}
        >
          {startMut.isPending ? 'Starting…' : 'Send Emails'}
        </button>
      </div>
    </div>
  )
}
