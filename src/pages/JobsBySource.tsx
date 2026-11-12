import { JobsTable } from '../components/JobsTable'

interface Props {
  source: 'portal' | 'career_site'
}

export function JobsBySource({ source }: Props) {
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-bold text-slate-100">
        {source === 'portal' ? 'Portal Jobs' : 'Company Career Jobs'}
      </h1>
      <p className="text-xs text-slate-500">
        {source === 'portal'
          ? 'Scraped directly from LinkedIn, Naukri, Indeed, Wellfound, and Cutshort.'
          : 'Discovered via Google Search (Serper) on company career pages.'}
      </p>
      <JobsTable source={source} />
    </div>
  )
}
