/** Flat re-export so existing `from '../types'` imports keep working while
 *  each domain lives in its own module (per the folder-structure spec). */
export type {
  Job,
  JobFilters,
  JobListResponse,
  JobOutcome,
  JobStageEvent,
  JobStatus,
  JobTimeline,
  ManualJobStatus,
} from './job'

export type {
  Resume,
  ResumeListResponse,
  ResumeMatch,
  ResumeMatchList,
  ResumeUploadResponse,
} from './resume'

export type {
  DiscoveryQuota,
  FlowEvent,
  Portal,
  RunLog,
  RunStartRequest,
  RunStartResponse,
  RunStatus,
} from './run'

export type {
  ColdEmailImportResponse,
  ColdEmailStartRequest,
  ColdEmailPreview,
  ColdEmailStats,
  DashboardStats,
  FunnelStage,
  SourceBreakdown,
} from './dashboard'

export type {
  AnswerMode,
  BankQuestion,
  MasterProfile,
  ProfileEducation,
  ProfileExperience,
  ProfilePersonal,
  ProfilePreferences,
  ProfileProject,
  ProfileResponse,
  QuestionBankResponse,
} from './profile'
