/**
 * ReferralWidget Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ReferralWidget from '@/components/giveaway/ReferralWidget';
import type { GiveawayCampaign } from '@desi-connect/shared';

// Mock giveaway-utils
jest.mock('@/lib/giveaway/giveaway-utils', () => ({
  buildReferralUrl: jest.fn(
    (baseUrl: string, campaignId: string, code: string) =>
      `${baseUrl}/giveaways/${campaignId}?ref=${code}`
  ),
  buildGiveawayShareUrls: jest.fn(() => ({
    facebook: 'https://facebook.com/share?u=test',
    twitter: 'https://twitter.com/intent/tweet?text=test',
    linkedin: 'https://linkedin.com/sharing?url=test',
    whatsapp: 'https://wa.me/?text=test',
    email: 'mailto:?subject=test&body=test',
  })),
}));

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
    ...overrides,
  } as GiveawayCampaign;
}

describe('ReferralWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders data-testid attribute', () => {
    render(
      <ReferralWidget
        campaign={makeCampaign()}
        referralCode="ABC123"
        baseUrl="http://localhost:3000"
      />
    );
    expect(screen.getByTestId('referral-widget')).toBeDefined();
  });

  it('renders the heading', () => {
    render(
      <ReferralWidget
        campaign={makeCampaign()}
        referralCode="ABC123"
        baseUrl="http://localhost:3000"
      />
    );
    expect(screen.getByText('Share & Earn More Entries')).toBeDefined();
  });

  it('renders referral count', () => {
    render(
      <ReferralWidget
        campaign={makeCampaign()}
        referralCode="ABC123"
        referralCount={5}
        baseUrl="http://localhost:3000"
      />
    );
    const countEl = screen.getByTestId('referral-count');
    expect(countEl.textContent).toBe('5');
  });

  it('renders 0 referral count by default', () => {
    render(
      <ReferralWidget
        campaign={makeCampaign()}
        referralCode="ABC123"
        baseUrl="http://localhost:3000"
      />
    );
    const countEl = screen.getByTestId('referral-count');
    expect(countEl.textContent).toBe('0');
  });

  it('renders the referral code', () => {
    render(
      <ReferralWidget
        campaign={makeCampaign()}
        referralCode="XYZ789"
        baseUrl="http://localhost:3000"
      />
    );
    const codeEl = screen.getByTestId('referral-code');
    expect(codeEl.textContent).toBe('XYZ789');
  });

  it('renders the referral URL input', () => {
    render(
      <ReferralWidget
        campaign={makeCampaign()}
        referralCode="ABC123"
        baseUrl="http://localhost:3000"
      />
    );
    const urlInput = screen.getByTestId('referral-url') as HTMLInputElement;
    expect(urlInput.value).toBe('http://localhost:3000/giveaways/camp-1?ref=ABC123');
    expect(urlInput.readOnly).toBe(true);
  });

  it('renders copy button', () => {
    render(
      <ReferralWidget
        campaign={makeCampaign()}
        referralCode="ABC123"
        baseUrl="http://localhost:3000"
      />
    );
    const copyButton = screen.getByTestId('copy-button');
    expect(copyButton.textContent).toBe('Copy');
  });

  it('copies referral URL to clipboard when copy button is clicked', async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(
      <ReferralWidget
        campaign={makeCampaign()}
        referralCode="ABC123"
        baseUrl="http://localhost:3000"
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('copy-button'));
    });

    expect(writeTextMock).toHaveBeenCalledWith(
      'http://localhost:3000/giveaways/camp-1?ref=ABC123'
    );
  });

  it('shows "Copied!" text after successful copy', async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(
      <ReferralWidget
        campaign={makeCampaign()}
        referralCode="ABC123"
        baseUrl="http://localhost:3000"
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('copy-button'));
    });

    expect(screen.getByTestId('copy-button').textContent).toBe('Copied!');
  });

  it('reverts "Copied!" back to "Copy" after 2 seconds', async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(
      <ReferralWidget
        campaign={makeCampaign()}
        referralCode="ABC123"
        baseUrl="http://localhost:3000"
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('copy-button'));
    });

    expect(screen.getByTestId('copy-button').textContent).toBe('Copied!');

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('copy-button').textContent).toBe('Copy');
  });

  it('falls back to execCommand when clipboard API fails', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockRejectedValue(new Error('fail')) },
    });

    const mockExecCommand = jest.fn();
    document.execCommand = mockExecCommand;

    render(
      <ReferralWidget
        campaign={makeCampaign()}
        referralCode="ABC123"
        baseUrl="http://localhost:3000"
      />
    );

    // Spy on appendChild/removeChild AFTER render so React DOM mounting isn't affected
    const appendChildSpy = jest
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node) => node as any);
    const removeChildSpy = jest
      .spyOn(document.body, 'removeChild')
      .mockImplementation((node) => node as any);

    await act(async () => {
      fireEvent.click(screen.getByTestId('copy-button'));
    });

    expect(mockExecCommand).toHaveBeenCalledWith('copy');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('renders all 5 social share buttons', () => {
    render(
      <ReferralWidget
        campaign={makeCampaign()}
        referralCode="ABC123"
        baseUrl="http://localhost:3000"
      />
    );
    const shareButtons = screen.getByTestId('share-buttons');
    expect(shareButtons).toBeDefined();

    expect(screen.getByTestId('share-facebook')).toBeDefined();
    expect(screen.getByTestId('share-twitter')).toBeDefined();
    expect(screen.getByTestId('share-linkedin')).toBeDefined();
    expect(screen.getByTestId('share-whatsapp')).toBeDefined();
    expect(screen.getByTestId('share-email')).toBeDefined();
  });

  it('renders platform labels', () => {
    render(
      <ReferralWidget
        campaign={makeCampaign()}
        referralCode="ABC123"
        baseUrl="http://localhost:3000"
      />
    );
    expect(screen.getByText('Facebook')).toBeDefined();
    expect(screen.getByText('Twitter')).toBeDefined();
    expect(screen.getByText('LinkedIn')).toBeDefined();
    expect(screen.getByText('WhatsApp')).toBeDefined();
    expect(screen.getByText('Email')).toBeDefined();
  });

  it('sets share links to open in new tab', () => {
    render(
      <ReferralWidget
        campaign={makeCampaign()}
        referralCode="ABC123"
        baseUrl="http://localhost:3000"
      />
    );
    const fbLink = screen.getByTestId('share-facebook');
    expect(fbLink.getAttribute('target')).toBe('_blank');
    expect(fbLink.getAttribute('rel')).toContain('noopener');
  });

  it('sets correct share URLs from buildGiveawayShareUrls', () => {
    render(
      <ReferralWidget
        campaign={makeCampaign()}
        referralCode="ABC123"
        baseUrl="http://localhost:3000"
      />
    );
    expect(screen.getByTestId('share-facebook').getAttribute('href')).toBe(
      'https://facebook.com/share?u=test'
    );
    expect(screen.getByTestId('share-twitter').getAttribute('href')).toBe(
      'https://twitter.com/intent/tweet?text=test'
    );
  });
});
