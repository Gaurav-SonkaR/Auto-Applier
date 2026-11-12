import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DashboardStats } from '../types'

interface Props {
  stats: DashboardStats
}

const FUNNEL_COLOR = '#6366f1' // indigo-500, matches existing accent convention
const SOURCE_COLORS = ['#0ea5e9', '#a78bfa'] // sky-500 (portal), violet-400 (career site)

export function PipelineFunnel({ stats }: Props) {
  const funnelData = stats.funnel.map((f) => ({ name: f.stage, count: f.count }))
  const sourceData = [
    { name: 'Portal Jobs', value: stats.source_breakdown.portal_jobs },
    { name: 'Career Site Jobs', value: stats.source_breakdown.career_site_jobs },
  ]
  const hasSourceData = sourceData.some((d) => d.value > 0)

  return (
    <div className="card">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <p className="text-xs text-slate-400 mb-2">Pipeline Funnel</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="count" fill={FUNNEL_COLOR} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-xs text-slate-400 mb-2">Portal vs. Career Site</p>
          {hasSourceData ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={sourceData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={35}
                  outerRadius={60}
                  paddingAngle={2}
                >
                  {sourceData.map((_, i) => (
                    <Cell key={i} fill={SOURCE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-xs text-slate-500">
              No jobs yet
            </div>
          )}
          <div className="flex justify-center gap-4 text-xs mt-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: SOURCE_COLORS[0] }} />
              Portal ({stats.source_breakdown.portal_jobs})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: SOURCE_COLORS[1] }} />
              Career Site ({stats.source_breakdown.career_site_jobs})
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
