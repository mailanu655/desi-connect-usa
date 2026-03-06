/**
 * GiveawayEntryForm Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GiveawayEntryForm from '@/components/giveaway/GiveawayEntryForm';
import type { GiveawayCampaign, EntryMethod, EntryMethodConfig } from '@desi-connect/shared';

// Mock giveaway-utils
jest.mock('@/lib/giveaway/giveaway-utils', () => ({
  getEntryMethodLabel: jest.fn((method: string) => {
    const labels: Record<string, string> = {
      email_signup: 'Email Signup',
      social_share: 'Social Share',
      referral: 'Referral',
      website_visit: 'Website Visit',
    };
    return labels[method] || method;
  }),
  getEntryMethodIcon: jest.fn(() => '📧'),
}));

const defaultEntryMethods: EntryMethodConfig[] = [
  { method: 'email_signup' as EntryMethod, label: 'Email Signup', points: 10 },
  { method: 'social_share' as EntryMethod, label: 'Social Share', points: 5 },
  { method: 'referral' as EntryMethod, label: 'Refer a Friend', points: 15 },
];

function makeCampaign(overrides: Partial<GiveawayCampaign> = {}): GiveawayCampaign {
  return {
    campaign_id: 'camp-1',
    title: 'Win a Prize',
    description: 'Enter to win!',
    prize_description: '$500 Gift Card',
    sponsor_name: 'Test Corp',
    start_date: '2025-01-01',
    end_date: '2030-12-31',
    status: 'active',
    entry_methods: defaultEntryMethods,
    ...overrides,
  } as GiveawayCampaign;
}

describe('GiveawayEntryForm', () => {
  const mockOnEntry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnEntry.mockResolvedValue(undefined);
  });

  it('renders data-testid attribute', () => {
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={[]}
      />
    );
    expect(screen.getByTestId('giveaway-entry-form')).toBeDefined();
  });

  it('renders "Ways to Enter" heading', () => {
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={[]}
      />
    );
    expect(screen.getByText('Ways to Enter')).toBeDefined();
  });

  it('renders entry method buttons for each method', () => {
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={[]}
      />
    );
    expect(screen.getByTestId('entry-method-email_signup')).toBeDefined();
    expect(screen.getByTestId('entry-method-social_share')).toBeDefined();
    expect(screen.getByTestId('entry-method-referral')).toBeDefined();
  });

  it('shows points for each entry method', () => {
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={[]}
      />
    );
    expect(screen.getByText('+10 points')).toBeDefined();
    expect(screen.getByText('+5 points')).toBeDefined();
    expect(screen.getByText('+15 points')).toBeDefined();
  });

  it('renders email input when email_signup method is available', () => {
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={[]}
      />
    );
    expect(screen.getByTestId('email-input')).toBeDefined();
    expect(screen.getByText('Email Address')).toBeDefined();
  });

  it('does not render email input when no email_signup method', () => {
    const methods: EntryMethodConfig[] = [
      { method: 'social_share' as EntryMethod, label: 'Social Share', points: 5 },
    ];
    render(
      <GiveawayEntryForm
        campaign={makeCampaign({ entry_methods: methods } as any)}
        onEntry={mockOnEntry}
        completedMethods={[]}
      />
    );
    expect(screen.queryByTestId('email-input')).toBeNull();
  });

  it('renders referral code input', () => {
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={[]}
      />
    );
    expect(screen.getByTestId('referral-input')).toBeDefined();
  });

  it('marks completed methods as "Completed"', () => {
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={['email_signup' as EntryMethod]}
      />
    );
    const emailButton = screen.getByTestId('entry-method-email_signup');
    expect(emailButton.textContent).toContain('Completed');
    expect(emailButton).toBeDisabled();
  });

  it('disables all buttons when disabled prop is true', () => {
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={[]}
        disabled={true}
      />
    );
    const emailButton = screen.getByTestId('entry-method-email_signup');
    expect(emailButton).toBeDisabled();
  });

  it('calls onEntry with method when button is clicked', async () => {
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={[]}
      />
    );
    fireEvent.click(screen.getByTestId('entry-method-social_share'));
    await waitFor(() => {
      expect(mockOnEntry).toHaveBeenCalledWith('social_share', undefined, undefined);
    });
  });

  it('shows error when email_signup clicked without email', async () => {
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={[]}
      />
    );
    fireEvent.click(screen.getByTestId('entry-method-email_signup'));
    await waitFor(() => {
      expect(screen.getByTestId('entry-error')).toBeDefined();
      expect(screen.getByText('Please enter your email address')).toBeDefined();
    });
    expect(mockOnEntry).not.toHaveBeenCalled();
  });

  it('passes email to onEntry for email_signup method', async () => {
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={[]}
      />
    );
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByTestId('entry-method-email_signup'));
    await waitFor(() => {
      expect(mockOnEntry).toHaveBeenCalledWith('email_signup', 'test@example.com', undefined);
    });
  });

  it('passes referral code to onEntry', async () => {
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={[]}
      />
    );
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('referral-input'), {
      target: { value: 'REF123' },
    });
    fireEvent.click(screen.getByTestId('entry-method-email_signup'));
    await waitFor(() => {
      expect(mockOnEntry).toHaveBeenCalledWith('email_signup', 'test@example.com', 'REF123');
    });
  });

  it('shows success message after successful entry', async () => {
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={[]}
      />
    );
    fireEvent.click(screen.getByTestId('entry-method-social_share'));
    await waitFor(() => {
      expect(screen.getByTestId('entry-success')).toBeDefined();
    });
  });

  it('shows error message when onEntry throws', async () => {
    mockOnEntry.mockRejectedValue(new Error('Campaign full'));
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={[]}
      />
    );
    fireEvent.click(screen.getByTestId('entry-method-social_share'));
    await waitFor(() => {
      expect(screen.getByTestId('entry-error')).toBeDefined();
      expect(screen.getByText('Campaign full')).toBeDefined();
    });
  });

  it('shows generic error message when non-Error is thrown', async () => {
    mockOnEntry.mockRejectedValue('something bad');
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={[]}
      />
    );
    fireEvent.click(screen.getByTestId('entry-method-social_share'));
    await waitFor(() => {
      expect(screen.getByText('Failed to submit entry')).toBeDefined();
    });
  });

  it('renders entry-methods container', () => {
    render(
      <GiveawayEntryForm
        campaign={makeCampaign()}
        onEntry={mockOnEntry}
        completedMethods={[]}
      />
    );
    expect(screen.getByTestId('entry-methods')).toBeDefined();
  });
});
