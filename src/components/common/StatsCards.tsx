import type { DashboardStats } from '../../types'

interface Props {
  stats: DashboardStats
  isLoading: boolean
}

interface CardDef {
  label: string
  key: keyof DashboardStats
  color: string
  format?: (v: number) => string
}

const CARDS: CardDef[] = [
  { label: 'Total Jobs',      key: 'total_jobs',       color: 'text-gray-700' },
  { label: 'Applied',         key: 'applied',           color: 'text-emerald-600' },
  { label: 'Success Rate',    key: 'success_rate',      color: 'text-emerald-600', format: (v) => `${Math.round(v * 100)}%` },
  { label: 'Ready to Apply',  key: 'ready_to_apply',    color: 'text-brand-600' },
  { label: 'Resume Ready',    key: 'resume_ready',      color: 'text-violet-600' },
  { label: 'Scraped',         key: 'scraped',           color: 'text-sky-600' },
  { label: 'Failed',          key: 'failed',            color: 'text-red-600' },
  { label: 'Waiting CAPTCHA', key: 'waiting_captcha',   color: 'text-amber-600' },
  { label: 'Waiting Login',   key: 'waiting_login',     color: 'text-sky-600' },
  { label: 'Need Action',     key: 'need_human_action', color: 'text-rose-600' },
  { label: 'Emails Sent',     key: 'emails_sent',       color: 'text-violet-600' },
  { label: 'Active Runs',     key: 'active_runs',       color: 'text-teal-600' },
]

export function StatsCards({ stats, isLoading }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {CARDS.map(({ label, key, color, format }) => (
        <div key={key} className="card text-center">
          <p className="text-xs text-gray-600">{label}</p>
          {isLoading ? (
            <div className="mt-1 h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <p className={`text-2xl font-bold mt-1 ${color}`}>
              {format ? format(stats[key] as number) : (stats[key] as number)}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
