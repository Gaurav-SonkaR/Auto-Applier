import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/profile', label: 'Master data', end: true },
  { to: '/profile/questions', label: 'Application questions', end: false },
]

/** Switches between the two halves of a profile: what resumes are written
 *  from, and what application forms are answered from. */
export function ProfileTabs() {
  return (
    <nav className="flex gap-1 border-b border-gray-200" aria-label="Profile sections">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `px-3 py-2 text-sm -mb-px border-b-2 transition-colors ${
              isActive
                ? 'border-brand-600 text-brand-700 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
