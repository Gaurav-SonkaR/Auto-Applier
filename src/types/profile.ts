/** The master data every generated resume is built from — one per account. */

export interface ProfilePersonal {
  name: string
  email: string
  phone: string
  linkedin: string
  github: string
  kaggle: string
  location: string
  /** Somewhere public the resume can be read. Cold email links to this instead
   *  of attaching a PDF, which is the loudest spam signal a first email to a
   *  stranger can carry. */
  resume_url: string
}

/** What portal application forms ask on every posting. Answered from here
 *  rather than by a model — they are facts, and a model asked a factual
 *  question answers it anyway. */
export interface ProfilePreferences {
  total_experience_years: string
  willing_to_relocate: string
  preferred_locations: string[]
  notice_period: string
  current_ctc: string
  expected_ctc: string
  needs_visa_sponsorship: string
}

export interface ProfileExperience {
  title: string
  company?: string
  client?: string
  location?: string
  start_date?: string
  end_date?: string
  bullets?: string[]
}

export interface ProfileProject {
  name: string
  tech_stack?: string[]
  bullets?: string[]
}

export interface ProfileEducation {
  degree: string
  institution: string
  start_date?: string
  end_date?: string
  relevant_courses?: string[]
}

export interface MasterProfile {
  personal: ProfilePersonal
  preferences: ProfilePreferences
  primary_skills: string[]
  secondary_skills: string[]
  experience: ProfileExperience[]
  projects: ProfileProject[]
  education: ProfileEducation
  achievements: string[]
  /** Guardrails for the resume LLM. Not edited here — passed back unchanged so
   *  saving the profile can never wipe them. */
  llm_rules?: Record<string, unknown>
}

export interface ProfileResponse {
  profile: MasterProfile
  /** Has enough (name, email, and skills or experience) to generate a resume. */
  is_complete: boolean
  updated_at: string | null
}

/** fixed: typed as written. tailor: adapted to each company without new claims. */
export type AnswerMode = 'fixed' | 'tailor'

/** One question in the account's question bank. */
export interface BankQuestion {
  key: string
  question: string
  category: string
  mode: AnswerMode
  answer: string
  /** catalogue = not answered yet; generated = drafted during an application. */
  source: 'catalogue' | 'user' | 'generated'
  needs_review: boolean
  used_count: number
  qa_id: number | null
  catalogue_id: string | null
  hint: string
}

export interface QuestionBankResponse {
  items: BankQuestion[]
  categories: string[]
  answered: number
  total: number
  needs_review: number
}

