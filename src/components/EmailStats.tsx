import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getColdEmailStats, uploadColdEmailFile, startColdEmail } from '../api/client'
import type { ColdEmailImportResponse, ColdEmailStartRequest } from '../types'

export function EmailStats() {
  const qc = useQueryClient()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['cold-email-stats'],
    queryFn: getColdEmailStats,
    refetchInterval: 30_000,
  })

  const [uploadedFile, setUploadedFile] = useState<ColdEmailImportResponse | null>(null)
  const [form, setForm] = useState<Omit<ColdEmailStartRequest, 'excel_path'>>({
    role: '',
    batch_size: 10,
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
      startColdEmail({ ...form, excel_path: uploadedFile!.saved_path }),
    onSuccess: (data) => {
      setSuccess(`Campaign started — Run #${data.run_id}`)
      setError(null)
      qc.invalidateQueries({ queryKey: ['cold-email-stats'] })
    },
    onError: (e: Error) => setError(e.message),
  })

  const percentUsed = stats ? Math.min(100, Math.round((stats.sent / (stats.sent + stats.remaining_today)) * 100)) : 0

  return (
    <div className="space-y-5">
      {/* Today's quota bar */}
      {isLoading ? (
        <div className="card animate-pulse h-24" />
      ) : stats ? (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold">Cold Email Quota</h3>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Sent today: <strong className="text-violet-400">{stats.sent}</strong></span>
            <span>Remaining: {stats.remaining_today}</span>
            <span>Total: {stats.total}</span>
            <span>Failed: {stats.failed}</span>
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

        {error && <p className="text-xs text-red-400">{error}</p>}
        {success && <p className="text-xs text-emerald-400">{success}</p>}

        <button
          type="button"
          className="btn-primary w-full"
          disabled={!uploadedFile || startMut.isPending}
          onClick={() => startMut.mutate()}
        >
          {startMut.isPending ? 'Starting…' : 'Send Emails'}
        </button>
      </div>
    </div>
  )
}
