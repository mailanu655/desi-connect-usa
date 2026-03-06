/**
 * Job Board Model (Section 6.1 - Website Features)
 *
 * Community jobs with H-1B sponsor filter, OPT-friendly tag,
 * desi consultancy jobs. P0 priority, MVP feature.
 */

export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
export type JobStatus = 'active' | 'expired' | 'filled' | 'pending' | 'rejected';

export interface Job {
  job_id: string;
  title: string;
  company_name: string;
  description: string;
  requirements: string;
  city: string;
  state: string;
  is_remote: boolean;
  job_type: JobType;
  experience_level: ExperienceLevel;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;

  /** Key differentiator: H-1B sponsorship filter */
  h1b_sponsor: boolean;

  /** Key differentiator: OPT-friendly for international students */
  opt_friendly: boolean;

  /** Link to the consultancy if it's a consultancy job */
  consultancy_id: string | null;

  apply_url: string | null;
  apply_email: string | null;
  status: JobStatus;
  posted_by: string | null;
  submission_source: 'website' | 'whatsapp' | 'admin' | 'seed';
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateJobInput {
  title: string;
  company_name: string;
  description: string;
  requirements?: string;
  city: string;
  state: string;
  is_remote?: boolean;
  job_type: JobType;
  experience_level?: ExperienceLevel;
  salary_min?: number | null;
  salary_max?: number | null;
  h1b_sponsor?: boolean;
  opt_friendly?: boolean;
  consultancy_id?: string | null;
  apply_url?: string | null;
  apply_email?: string | null;
  posted_by?: string | null;
  submission_source: 'website' | 'whatsapp' | 'admin' | 'seed';
  expires_at?: string | null;
}

export interface JobSearchParams {
  query?: string;
  city?: string;
  state?: string;
  job_type?: JobType;
  experience_level?: ExperienceLevel;
  h1b_sponsor?: boolean;
  opt_friendly?: boolean;
  is_remote?: boolean;
  salary_min?: number;
  page?: number;
  limit?: number;
  sort_by?: 'newest' | 'salary' | 'relevance';
}
