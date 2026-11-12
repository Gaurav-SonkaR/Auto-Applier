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
import type { DashboardStats } from '../../types'

interface Props {
  stats: DashboardStats
}

// Recharts needs literal colours, so these can't come from Tailwind classes.
// Keep FUNNEL_COLOR in step with `brand` in tailwind.config.js.
const FUNNEL_COLOR = '#ea580c' // brand-600 (orange)
const SOURCE_COLORS = ['#0284c7', '#7c3aed'] // sky-600 (portal), violet-600 (career site)

// Light-theme chart chrome.
const AXIS_TICK = { fill: '#6b7280', fontSize: 11 } // gray-500
const TOOLTIP_STYLE = {
  background: '#ffffff',
  border: '1px solid #e5e7eb', // gray-200
  borderRadius: 8,
  boxShadow: '0 1px 3px rgb(0 0 0 / 0.1)',
}
const TOOLTIP_TEXT = { color: '#111827' } // gray-900

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
          <p className="text-xs text-gray-600 mb-2">Pipeline Funnel</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 4, right: 16 }}>
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={118}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={TOOLTIP_STYLE}
                labelStyle={TOOLTIP_TEXT}
                itemStyle={TOOLTIP_TEXT}
              />
              <Bar dataKey="count" fill={FUNNEL_COLOR} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-xs text-gray-600 mb-2">Portal vs. Career Site</p>
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
                <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_TEXT} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-xs text-gray-500">
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
