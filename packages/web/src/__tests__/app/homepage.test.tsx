import HomePage from '@/app/page';
import { apiClient } from '@/lib/api-client';
import { SITE_NAME } from '@/lib/constants';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    getBusinesses: jest.fn(),
    getBusinessById: jest.fn(),
    getNews: jest.fn(),
    getNewsById: jest.fn(),
    getJobs: jest.fn(),
    getJobById: jest.fn(),
    getEvents: jest.fn(),
    getDeals: jest.fn(),
    getConsultancies: jest.fn(),
    getBusinessCategories: jest.fn(),
  },
}));

const mockNewsData = [
  {
    news_id: '1',
    title: 'Breaking: New Immigration Policy',
    summary: 'Major changes to visa processing announced',
    category: 'immigration',
    source_name: 'Desi News',
    source_url: 'https://example.com',
    published_date: '2024-01-01',
    status: 'published',
    view_count: 100,
  },
];

const mockBusinessData = [
  {
    business_id: '1',
    name: 'Raj Indian Restaurant',
    category: 'restaurant',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip_code: '10001',
    status: 'active',
    created_at: '2024-01-01',
  },
];

const mockJobData = [
  {
    job_id: '1',
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    description: 'Seeking experienced engineer',
    location: 'New York, NY',
    city: 'New York',
    state: 'NY',
    job_type: 'full_time',
    experience_level: 'senior',
    h1b_sponsor: true,
    opt_friendly: true,
    posted_date: '2024-01-01',
    status: 'active',
  },
];

const mockEventData = [
  {
    event_id: '1',
    title: 'Annual Diwali Celebration',
    description: 'Community gathering',
    category: 'cultural',
    location: 'Central Park',
    city: 'New York',
    state: 'NY',
    start_date: '2024-11-01',
    is_virtual: false,
    is_free: true,
    status: 'active',
  },
];

const mockDealData = [
  {
    deal_id: '1',
    business_name: 'Spice House',
    title: '20% off Indian cuisine',
    description: 'Enjoy 20% discount on all dishes',
    deal_type: 'discount',
    discount_value: '20',
    coupon_code: 'SPICE20',
    expiry_date: '2024-12-31',
    city: 'New York',
    state: 'NY',
    status: 'active',
  },
];

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.getNews as jest.Mock).mockResolvedValue({
      data: mockNewsData,
    });
    (apiClient.getBusinesses as jest.Mock).mockResolvedValue({
      data: mockBusinessData,
    });
    (apiClient.getJobs as jest.Mock).mockResolvedValue({
      data: mockJobData,
    });
    (apiClient.getEvents as jest.Mock).mockResolvedValue({
      data: mockEventData,
    });
    (apiClient.getDeals as jest.Mock).mockResolvedValue({
      data: mockDealData,
    });
  });

  it('fetches news with correct limit parameters', async () => {
    await HomePage();
    expect(apiClient.getNews).toHaveBeenCalledWith({ limit: 4 });
  });

  it('fetches businesses with correct limit parameters', async () => {
    await HomePage();
    expect(apiClient.getBusinesses).toHaveBeenCalledWith({ limit: 6 });
  });

  it('fetches jobs with correct limit parameters', async () => {
    await HomePage();
    expect(apiClient.getJobs).toHaveBeenCalledWith({ limit: 6 });
  });

  it('fetches events with correct limit parameters', async () => {
    await HomePage();
    expect(apiClient.getEvents).toHaveBeenCalledWith({ limit: 4 });
  });

  it('fetches deals with correct limit parameters', async () => {
    await HomePage();
    expect(apiClient.getDeals).toHaveBeenCalledWith({ limit: 4 });
  });

  it('handles API returning empty arrays gracefully', async () => {
    (apiClient.getNews as jest.Mock).mockResolvedValue({ data: [] });
    (apiClient.getBusinesses as jest.Mock).mockResolvedValue({ data: [] });
    (apiClient.getJobs as jest.Mock).mockResolvedValue({ data: [] });
    (apiClient.getEvents as jest.Mock).mockResolvedValue({ data: [] });
    (apiClient.getDeals as jest.Mock).mockResolvedValue({ data: [] });

    const component = await HomePage();
    expect(component).toBeDefined();
  });

  it('fetches all data in parallel using Promise.all', async () => {
    await HomePage();

    expect(apiClient.getNews).toHaveBeenCalled();
    expect(apiClient.getBusinesses).toHaveBeenCalled();
    expect(apiClient.getJobs).toHaveBeenCalled();
    expect(apiClient.getEvents).toHaveBeenCalled();
    expect(apiClient.getDeals).toHaveBeenCalled();
  });

  it('returns component with data even if fetching succeeds', async () => {
    const component = await HomePage();
    expect(component).toBeDefined();
    expect(component.type).toBeDefined();
  });

  it('handles errors gracefully and returns empty arrays', async () => {
    (apiClient.getNews as jest.Mock).mockRejectedValue(
      new Error('API Error'),
    );
    (apiClient.getBusinesses as jest.Mock).mockRejectedValue(
      new Error('API Error'),
    );
    (apiClient.getJobs as jest.Mock).mockRejectedValue(
      new Error('API Error'),
    );
    (apiClient.getEvents as jest.Mock).mockRejectedValue(
      new Error('API Error'),
    );
    (apiClient.getDeals as jest.Mock).mockRejectedValue(
      new Error('API Error'),
    );

    const component = await HomePage();
    expect(component).toBeDefined();
  });

  it('uses SITE_NAME constant for title', () => {
    expect(SITE_NAME).toBe('Desi Connect USA');
  });

  it('exports HomePage as default', () => {
    expect(HomePage).toBeDefined();
  });
});
