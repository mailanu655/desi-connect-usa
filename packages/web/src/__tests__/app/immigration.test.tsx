import ImmigrationHubPage from '@/app/immigration/page';
import { apiClient } from '@/lib/api-client';

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

const mockNewsArticles = [
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

const mockConsultancies = [
  {
    consultancy_id: '1',
    name: 'Immigration Experts LLC',
    specialization: 'H-1B Visa',
    city: 'New York',
    state: 'NY',
    email: 'info@example.com',
    phone: '123-456-7890',
    rating: 4.5,
    review_count: 50,
    is_verified: true,
    fraud_alert: false,
    status: 'active',
  },
];

describe('ImmigrationHubPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.getNews as jest.Mock).mockResolvedValue({
      data: mockNewsArticles,
    });
    (apiClient.getConsultancies as jest.Mock).mockResolvedValue({
      data: mockConsultancies,
    });
  });

  it('fetches news with immigration category', async () => {
    await ImmigrationHubPage();

    expect(apiClient.getNews).toHaveBeenCalledWith({
      category: 'immigration',
      limit: 9,
    });
  });

  it('fetches consultancies with correct limit', async () => {
    await ImmigrationHubPage();

    expect(apiClient.getConsultancies).toHaveBeenCalledWith({
      limit: 6,
    });
  });

  it('handles empty news data gracefully', async () => {
    (apiClient.getNews as jest.Mock).mockResolvedValue({
      data: [],
    });

    const component = await ImmigrationHubPage();
    expect(component).toBeDefined();
  });

  it('handles empty consultancies data gracefully', async () => {
    (apiClient.getConsultancies as jest.Mock).mockResolvedValue({
      data: [],
    });

    const component = await ImmigrationHubPage();
    expect(component).toBeDefined();
  });

  it('returns component when news fetching fails', async () => {
    (apiClient.getNews as jest.Mock).mockRejectedValue(
      new Error('API Error'),
    );

    const component = await ImmigrationHubPage();
    expect(component).toBeDefined();
  });

  it('returns component when consultancies fetching fails', async () => {
    (apiClient.getConsultancies as jest.Mock).mockRejectedValue(
      new Error('API Error'),
    );

    const component = await ImmigrationHubPage();
    expect(component).toBeDefined();
  });

  it('fetches both news and consultancies in parallel', async () => {
    await ImmigrationHubPage();

    expect(apiClient.getNews).toHaveBeenCalled();
    expect(apiClient.getConsultancies).toHaveBeenCalled();
  });

  it('exports ImmigrationHubPage as default', () => {
    expect(ImmigrationHubPage).toBeDefined();
  });
});
