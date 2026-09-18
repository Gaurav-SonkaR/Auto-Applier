import { JobsTable } from '../components/jobs/JobsTable'

interface Props {
  /** Omit for all jobs; set to scope the page to one source. */
  source?: 'portal' | 'career_site'
}

const COPY = {
  portal: {
    title: 'Portal Jobs',
    blurb: 'Scraped from LinkedIn, Naukri, Indeed, Wellfound, Cutshort and Instahyre. These are applied to automatically.',
  },
  career_site: {
    title: 'Company Career Jobs',
    blurb: 'Found by Smart Job Apply on company career pages. A tailored resume is generated, then you apply yourself.',
  },
  all: {
    title: 'All Jobs',
    blurb: 'Every discovered job, from both portal scraping and Smart Job Apply.',
  },
} as const

export function JobList({ source }: Props) {
  const { title, blurb } = COPY[source ?? 'all']

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-500 mt-0.5">{blurb}</p>
      </div>
      <JobsTable source={source} />
    </div>
  )
}
