import Link from 'next/link';
import { Job } from '@/lib/api-client';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  // Format salary
  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) {
      return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`;
    }
    if (min) return `$${(min / 1000).toFixed(0)}K+`;
    if (max) return `Up to $${(max / 1000).toFixed(0)}K`;
    return null;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const salaryRange = formatSalary(job.salary_min, job.salary_max);

  return (
    <Link href={`/jobs/${job.job_id}`}>
      <div className="card cursor-pointer">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex-1">
            {/* Company */}
            <p className="text-xs font-medium text-gray-500 uppercase">
              {job.company}
            </p>
            {/* Job Title */}
            <h3 className="font-heading text-lg font-bold text-gray-900 line-clamp-2 hover:text-saffron-600">
              {job.title}
            </h3>
          </div>
        </div>

        {/* Job Type Badge */}
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="badge bg-blue-100 text-blue-800 text-xs">
            {job.job_type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </span>

          {/* H-1B Sponsor Badge */}
          {job.h1b_sponsor && (
            <span className="badge-saffron text-xs">
              H-1B Sponsor
            </span>
          )}

          {/* OPT Friendly Badge */}
          {job.opt_friendly && (
            <span className="badge-forest text-xs">
              OPT Friendly
            </span>
          )}
        </div>

        {/* Location */}
        <p className="text-sm text-gray-600">
          {job.location}
        </p>
        <p className="text-xs text-gray-500">
          {job.city}, {job.state}
        </p>

        {/* Salary Range */}
        {salaryRange && (
          <p className="mt-2 text-sm font-semibold text-saffron-600">
            {salaryRange}
          </p>
        )}

        {/* Experience Level */}
        <p className="mt-2 text-xs text-gray-600">
          <span className="font-medium">Level:</span> {job.experience_level}
        </p>

        {/* Posted Date */}
        <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
          Posted {formatDate(job.posted_date)}
        </p>

        {/* Apply Button or Link */}
        {job.apply_url && (
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.preventDefault()}
            className="mt-3 inline-block w-full text-center text-sm font-semibold text-saffron-600 transition-colors hover:text-saffron-700"
          >
            View & Apply
          </a>
        )}
      </div>
    </Link>
  );
}
