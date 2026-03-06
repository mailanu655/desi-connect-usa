import React from 'react';
import { render, screen } from '@testing-library/react';
import JobCard from '@/components/cards/JobCard';
import { Job } from '@/lib/api-client';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <div data-href={href}>{children}</div>
  );
});

describe('JobCard', () => {
  const mockJob: Job = {
    job_id: '1',
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    description: 'We are looking for a senior engineer with 5+ years of experience.',
    location: 'Remote',
    city: 'San Francisco',
    state: 'CA',
    job_type: 'full_time',
    experience_level: 'Senior',
    salary_min: 150000,
    salary_max: 200000,
    h1b_sponsor: true,
    opt_friendly: true,
    apply_url: 'https://techcorp.com/apply/1',
    posted_date: '2024-02-15',
    expiry_date: '2024-03-15',
    status: 'active',
  };

  it('renders job title', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
  });

  it('renders company name', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
  });

  it('renders location', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('Remote')).toBeInTheDocument();
  });

  it('shows job type badge', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('Full Time')).toBeInTheDocument();
  });

  it('shows salary range when min and max provided', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('$150K - $200K')).toBeInTheDocument();
  });

  it('shows H-1B Sponsor badge when h1b_sponsor is true', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('H-1B Sponsor')).toBeInTheDocument();
  });

  it('shows OPT Friendly badge when opt_friendly is true', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('OPT Friendly')).toBeInTheDocument();
  });

  it('hides H-1B badge when h1b_sponsor is false', () => {
    const jobNoH1B: Job = {
      ...mockJob,
      h1b_sponsor: false,
    };
    render(<JobCard job={jobNoH1B} />);
    expect(screen.queryByText('H-1B Sponsor')).not.toBeInTheDocument();
  });

  it('hides OPT Friendly badge when opt_friendly is false', () => {
    const jobNoOPT: Job = {
      ...mockJob,
      opt_friendly: false,
    };
    render(<JobCard job={jobNoOPT} />);
    expect(screen.queryByText('OPT Friendly')).not.toBeInTheDocument();
  });

  it('shows apply link when apply_url provided', () => {
    render(<JobCard job={mockJob} />);
    const applyLink = screen.getByText('View & Apply');
    expect(applyLink).toBeInTheDocument();
    expect(applyLink).toHaveAttribute('href', 'https://techcorp.com/apply/1');
  });

  it('hides apply link when apply_url not provided', () => {
    const jobNoApplyUrl: Job = {
      ...mockJob,
      apply_url: undefined,
    };
    render(<JobCard job={jobNoApplyUrl} />);
    expect(screen.queryByText('View & Apply')).not.toBeInTheDocument();
  });

  it('shows city and state', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });

  it('shows experience level', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText('Level:')).toBeInTheDocument();
  });

  it('handles missing salary_min', () => {
    const jobNoMin: Job = {
      ...mockJob,
      salary_min: undefined,
    };
    render(<JobCard job={jobNoMin} />);
    expect(screen.getByText('Up to $200K')).toBeInTheDocument();
  });

  it('handles missing salary_max', () => {
    const jobNoMax: Job = {
      ...mockJob,
      salary_max: undefined,
    };
    render(<JobCard job={jobNoMax} />);
    expect(screen.getByText('$150K+')).toBeInTheDocument();
  });

  it('handles missing both salary_min and salary_max', () => {
    const jobNoSalary: Job = {
      ...mockJob,
      salary_min: undefined,
      salary_max: undefined,
    };
    render(<JobCard job={jobNoSalary} />);
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it('shows posted date in formatted text', () => {
    render(<JobCard job={mockJob} />);
    expect(screen.getByText(/Posted/)).toBeInTheDocument();
  });

  it('formats full_time job type correctly', () => {
    const fullTimeJob: Job = {
      ...mockJob,
      job_type: 'full_time',
    };
    render(<JobCard job={fullTimeJob} />);
    expect(screen.getByText('Full Time')).toBeInTheDocument();
  });

  it('formats part_time job type correctly', () => {
    const partTimeJob: Job = {
      ...mockJob,
      job_type: 'part_time',
    };
    render(<JobCard job={partTimeJob} />);
    expect(screen.getByText('Part Time')).toBeInTheDocument();
  });

  it('formats contract job type correctly', () => {
    const contractJob: Job = {
      ...mockJob,
      job_type: 'contract',
    };
    render(<JobCard job={contractJob} />);
    expect(screen.getByText('Contract')).toBeInTheDocument();
  });
});
