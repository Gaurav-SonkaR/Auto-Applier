import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { useAuth } from './hooks/useAuth'
import { Dashboard } from './pages/Dashboard'
import { HumanQueue } from './pages/HumanQueue'
import { JobDetail } from './pages/JobDetail'
import { JobList } from './pages/JobList'
import { Login } from './pages/Login'
import { Profile } from './pages/Profile'
import { ProfileQuestions } from './pages/ProfileQuestions'
import { ReadyToApply } from './pages/ReadyToApply'
import { Settings } from './pages/Settings'

export default function App() {
  const { isAuthenticated } = useAuth()

  // The whole app is behind the gate rather than per-route guards: there is no
  // page here that means anything to a signed-out visitor, and a single check
  // can't be forgotten on a route added later.
  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ready-to-apply" element={<ReadyToApply />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />
          <Route path="/portal-jobs" element={<JobList source="portal" />} />
          <Route path="/career-jobs" element={<JobList source="career_site" />} />
          <Route path="/human-queue" element={<HumanQueue />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/questions" element={<ProfileQuestions />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
