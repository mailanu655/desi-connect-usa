import {
  ApiClient,
  apiClient,
  ApiError,
  ApiResponse,
  Business,
  NewsArticle,
  Job,
  DesiEvent,
  Deal,
  Consultancy,
} from '@/lib/api-client';

// Mock global fetch
global.fetch = jest.fn();

describe('ApiClient', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('should construct with default config', () => {
      const client = new ApiClient();
      expect(client).toBeInstanceOf(ApiClient);
    });

    it('should construct with custom config', () => {
      const customConfig = {
        noCodeBackendUrl: 'https://custom-backend.com',
        teableUrl: 'https://custom-teable.com',
        teableApiKey: 'custom-key',
      };
      const client = new ApiClient(customConfig);
      expect(client).toBeInstanceOf(ApiClient);
    });

    it('should accept partial config overrides', () => {
      const partialConfig = {
        noCodeBackendUrl: 'https://custom-backend.com',
      };
      const client = new ApiClient(partialConfig);
      expect(client).toBeInstanceOf(ApiClient);
    });
  });

  describe('getBusinesses', () => {
    it('should call correct endpoint with params', async () => {
      const mockData: ApiResponse<Business[]> = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getBusinesses({
        category: 'restaurant',
        city: 'nyc',
        state: 'NY',
        search: 'pizza',
        page: 1,
        limit: 20,
      });

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/businesses');
      expect(call[0]).toContain('category=restaurant');
      expect(call[0]).toContain('city=nyc');
      expect(call[0]).toContain('state=NY');
      expect(call[0]).toContain('search=pizza');
      expect(call[0]).toContain('page=1');
      expect(call[0]).toContain('limit=20');
    });

    it('should call correct endpoint with no params', async () => {
      const mockData: ApiResponse<Business[]> = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getBusinesses();

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/businesses');
    });

    it('should use readGet and noCodeBackendUrl', async () => {
      const mockData: ApiResponse<Business[]> = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient({
        noCodeBackendUrl: 'https://backend.example.com',
      });
      await client.getBusinesses();

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('https://backend.example.com');
    });

    it('should include ISR revalidate in fetch options', async () => {
      const mockData: ApiResponse<Business[]> = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getBusinesses();

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      const options = call[1] as RequestInit;
      expect(options.next).toEqual({ revalidate: 60 });
    });
  });

  describe('getBusinessById', () => {
    it('should call /businesses/{id}', async () => {
      const mockBusiness: Business = {
        business_id: '123',
        name: 'Test Business',
        category: 'restaurant',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip_code: '10001',
        status: 'active',
        created_at: '2024-01-01',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusiness,
      } as Response);

      const client = new ApiClient();
      await client.getBusinessById('123');

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/businesses/123');
    });
  });

  describe('getBusinessCategories', () => {
    it('should call /businesses/categories', async () => {
      const mockCategories = ['restaurant', 'grocery', 'temple'];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      } as Response);

      const client = new ApiClient();
      await client.getBusinessCategories();

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/businesses/categories');
    });
  });

  describe('getNews', () => {
    it('should call correct endpoint with params', async () => {
      const mockData: ApiResponse<NewsArticle[]> = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getNews({
        category: 'immigration',
        city: 'nyc',
        search: 'visa',
        page: 2,
        limit: 10,
      });

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/news');
      expect(call[0]).toContain('category=immigration');
      expect(call[0]).toContain('city=nyc');
      expect(call[0]).toContain('search=visa');
    });
  });

  describe('getNewsById', () => {
    it('should call /news/{id}', async () => {
      const mockArticle: NewsArticle = {
        news_id: '456',
        title: 'Test Article',
        summary: 'A test article',
        category: 'immigration',
        source_name: 'Test Source',
        source_url: 'https://example.com',
        view_count: 100,
        published_date: '2024-01-01',
        status: 'published',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockArticle,
      } as Response);

      const client = new ApiClient();
      await client.getNewsById('456');

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/news/456');
    });
  });

  describe('getJobs', () => {
    it('should call correct endpoint with all filter params', async () => {
      const mockData: ApiResponse<Job[]> = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getJobs({
        type: 'full_time',
        city: 'san_francisco',
        h1b_sponsor: true,
        opt_friendly: true,
        search: 'engineer',
        page: 1,
        limit: 20,
      });

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/jobs');
      expect(call[0]).toContain('type=full_time');
      expect(call[0]).toContain('city=san_francisco');
      expect(call[0]).toContain('h1b_sponsor=true');
      expect(call[0]).toContain('opt_friendly=true');
      expect(call[0]).toContain('search=engineer');
    });

    it('should handle boolean params correctly', async () => {
      const mockData: ApiResponse<Job[]> = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getJobs({
        h1b_sponsor: false,
        opt_friendly: false,
      });

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('h1b_sponsor=false');
      expect(call[0]).toContain('opt_friendly=false');
    });
  });

  describe('getJobById', () => {
    it('should call /jobs/{id}', async () => {
      const mockJob: Job = {
        job_id: '789',
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: 'Looking for engineers',
        location: 'San Francisco, CA',
        city: 'san_francisco',
        state: 'CA',
        job_type: 'full_time',
        experience_level: 'senior',
        h1b_sponsor: true,
        opt_friendly: true,
        posted_date: '2024-01-01',
        status: 'active',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockJob,
      } as Response);

      const client = new ApiClient();
      await client.getJobById('789');

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/jobs/789');
    });
  });

  describe('getEvents', () => {
    it('should call correct endpoint with params', async () => {
      const mockData: ApiResponse<DesiEvent[]> = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getEvents({
        category: 'cultural',
        city: 'nyc',
        page: 1,
        limit: 10,
      });

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/events');
      expect(call[0]).toContain('category=cultural');
      expect(call[0]).toContain('city=nyc');
    });
  });

  // ─── getEventById (Phase 2) ──────────────────────────────────

  describe('getEventById', () => {
    it('should call /events/{id}', async () => {
      const mockEvent: DesiEvent = {
        event_id: 'evt-001',
        title: 'Diwali Celebration',
        description: 'Annual Diwali celebration with food and fireworks',
        category: 'cultural',
        location: 'Central Park',
        city: 'New York',
        state: 'NY',
        start_date: '2024-11-01',
        end_date: '2024-11-01',
        is_virtual: false,
        is_free: true,
        organizer: 'NYC Indian Association',
        status: 'active',
        rsvp_count: 150,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvent,
      } as Response);

      const client = new ApiClient();
      const result = await client.getEventById('evt-001');

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/events/evt-001');
      expect(result).toEqual(mockEvent);
      expect(result.event_id).toBe('evt-001');
      expect(result.rsvp_count).toBe(150);
    });

    it('should throw ApiError when event not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const client = new ApiClient();

      await expect(client.getEventById('nonexistent')).rejects.toThrow(ApiError);
      try {
        await client.getEventById('nonexistent');
      } catch (error) {
        // Already thrown above, this is just for completeness
      }
    });

    it('should use noCodeBackendUrl for event detail read', async () => {
      const mockEvent: DesiEvent = {
        event_id: 'evt-002',
        title: 'Holi Festival',
        description: 'Color festival',
        category: 'cultural',
        location: 'Brooklyn Park',
        city: 'New York',
        state: 'NY',
        start_date: '2024-03-25',
        is_virtual: false,
        is_free: false,
        status: 'active',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvent,
      } as Response);

      const client = new ApiClient({
        noCodeBackendUrl: 'https://read-api.example.com',
      });
      await client.getEventById('evt-002');

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('https://read-api.example.com/events/evt-002');
    });
  });

  describe('getDeals', () => {
    it('should call correct endpoint with params', async () => {
      const mockData: ApiResponse<Deal[]> = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getDeals({
        city: 'chicago',
        page: 1,
        limit: 20,
      });

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/deals');
      expect(call[0]).toContain('city=chicago');
    });
  });

  describe('getConsultancies', () => {
    it('should call correct endpoint with params', async () => {
      const mockData: ApiResponse<Consultancy[]> = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getConsultancies({
        specialization: 'eb1c',
        city: 'nyc',
        page: 1,
        limit: 20,
      });

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/consultancies');
      expect(call[0]).toContain('specialization=eb1c');
      expect(call[0]).toContain('city=nyc');
    });
  });

  describe('Error handling', () => {
    it('should throw ApiError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const client = new ApiClient();

      await expect(client.getBusinesses()).rejects.toThrow(ApiError);
    });

    it('should have correct statusCode in ApiError', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const client = new ApiClient();

      try {
        await client.getBusinesses();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(404);
      }
    });

    it('should have name "ApiError"', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const client = new ApiClient();

      try {
        await client.getBusinesses();
        fail('Should have thrown');
      } catch (error) {
        expect((error as ApiError).name).toBe('ApiError');
      }
    });

    it('should throw on different status codes', async () => {
      const statusCodes = [400, 401, 403, 404, 500, 502, 503];

      for (const statusCode of statusCodes) {
        mockFetch.mockClear();
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: statusCode,
        } as Response);

        const client = new ApiClient();

        try {
          await client.getBusinesses();
          fail('Should have thrown');
        } catch (error) {
          expect((error as ApiError).statusCode).toBe(statusCode);
        }
      }
    });
  });

  describe('URL construction', () => {
    it('should use noCodeBackendUrl for read operations', async () => {
      const backendUrl = 'https://custom-backend.example.com';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      const client = new ApiClient({ noCodeBackendUrl: backendUrl });
      await client.getBusinesses();

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain(backendUrl);
    });

    it('should include query parameters in URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      const client = new ApiClient();
      await client.getBusinesses({ city: 'NYC', search: 'pizza' });

      const call = mockFetch.mock.calls[0];
      const urlString = call[0] as string;
      const url = new URL(urlString);
      expect(url.searchParams.get('city')).toBe('NYC');
      expect(url.searchParams.get('search')).toBe('pizza');
    });
  });

  describe('Singleton export', () => {
    it('should export singleton apiClient instance', () => {
      expect(apiClient).toBeInstanceOf(ApiClient);
    });

    it('should be usable for API calls', async () => {
      const mockData: ApiResponse<Business[]> = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      await apiClient.getBusinesses();
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Response parsing', () => {
    it('should parse business response correctly', async () => {
      const mockBusiness: Business = {
        business_id: '123',
        name: 'Test Restaurant',
        category: 'restaurant',
        address: '123 Main St',
        city: 'NYC',
        state: 'NY',
        zip_code: '10001',
        status: 'active',
        created_at: '2024-01-01',
        phone: '555-1234',
        email: 'test@example.com',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusiness,
      } as Response);

      const client = new ApiClient();
      const result = await client.getBusinessById('123');

      expect(result).toEqual(mockBusiness);
      expect(result.business_id).toBe('123');
      expect(result.name).toBe('Test Restaurant');
    });

    it('should parse paginated response correctly', async () => {
      const mockData: ApiResponse<Business[]> = {
        data: [
          {
            business_id: '1',
            name: 'Business 1',
            category: 'restaurant',
            address: '123 Main St',
            city: 'NYC',
            state: 'NY',
            zip_code: '10001',
            status: 'active',
            created_at: '2024-01-01',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 100,
          totalPages: 5,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      const result = await client.getBusinesses({ page: 1 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
      });
    });

    it('should parse event response with Phase 2 fields', async () => {
      const mockEvent: DesiEvent = {
        event_id: 'evt-100',
        title: 'Navratri Garba',
        description: 'Nine nights of dance',
        category: 'cultural',
        location: 'Convention Center',
        city: 'Houston',
        state: 'TX',
        start_date: '2024-10-03',
        end_date: '2024-10-12',
        is_virtual: false,
        is_free: false,
        status: 'active',
        rsvp_count: 500,
        venue_name: 'George R. Brown Convention Center',
        address: '1001 Avenida De Las Americas',
        price: '$25',
        ticket_url: 'https://tickets.example.com',
        organizer_contact: 'info@garba.org',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEvent,
      } as Response);

      const client = new ApiClient();
      const result = await client.getEventById('evt-100');

      expect(result.rsvp_count).toBe(500);
      expect(result.venue_name).toBe('George R. Brown Convention Center');
      expect(result.address).toBe('1001 Avenida De Las Americas');
      expect(result.price).toBe('$25');
      expect(result.ticket_url).toBe('https://tickets.example.com');
      expect(result.organizer_contact).toBe('info@garba.org');
    });
  });

  describe('Fetch options', () => {
    it('should set correct headers for read operations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response);

      const client = new ApiClient();
      await client.getBusinesses();

      const call = mockFetch.mock.calls[0];
      const options = call[1] as RequestInit;
      expect(options.method).toBe('GET');
      expect(options.headers).toHaveProperty('Content-Type', 'application/json');
    });
  });

  describe('getUserProfile', () => {
    it('should call /users/profile endpoint', async () => {
      const mockProfile = {
        user_id: 'user-123',
        display_name: 'John Doe',
        email: 'john@example.com',
        phone_number: '555-1234',
        city: 'New York',
        state: 'NY',
        preferred_channel: 'web',
        identity_linked: true,
        auth_provider: 'google',
        is_verified: true,
        created_via: 'web',
        created_at: '2024-01-01',
        updated_at: '2024-01-15',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      } as Response);

      const client = new ApiClient();
      const result = await client.getUserProfile();

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/users/profile');
      expect(result.user_id).toBe('user-123');
      expect(result.display_name).toBe('John Doe');
    });

    it('should use readGet and noCodeBackendUrl', async () => {
      const mockProfile = {
        user_id: 'user-456',
        display_name: 'Jane Smith',
        email: 'jane@example.com',
        phone_number: null,
        preferred_channel: 'whatsapp',
        identity_linked: false,
        auth_provider: 'whatsapp',
        is_verified: false,
        created_via: 'whatsapp',
        created_at: '2024-02-01',
        updated_at: '2024-02-01',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      } as Response);

      const client = new ApiClient({
        noCodeBackendUrl: 'https://backend.example.com',
      });
      await client.getUserProfile();

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('https://backend.example.com/users/profile');
    });

    it('should throw ApiError when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      const client = new ApiClient();

      await expect(client.getUserProfile()).rejects.toThrow(ApiError);
    });
  });

  describe('updateUserProfile', () => {
    it('should call /users/profile endpoint with POST method', async () => {
      const updateData = {
        display_name: 'John Updated',
        city: 'Los Angeles',
        state: 'CA',
      };

      const mockResponse = {
        user_id: 'user-123',
        display_name: 'John Updated',
        email: 'john@example.com',
        phone_number: '555-1234',
        city: 'Los Angeles',
        state: 'CA',
        preferred_channel: 'web',
        identity_linked: true,
        auth_provider: 'google',
        is_verified: true,
        created_via: 'web',
        created_at: '2024-01-01',
        updated_at: '2024-03-02',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new ApiClient({
        teableUrl: 'http://test-write.com/api',
        teableApiKey: 'test-key',
      });
      const result = await client.updateUserProfile(updateData);

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toBe('http://test-write.com/api/users/profile');
      expect(result.display_name).toBe('John Updated');
      expect(result.city).toBe('Los Angeles');
    });

    it('should send correct headers and body', async () => {
      const updateData = {
        preferred_channel: 'both',
      };

      const mockResponse = {
        user_id: 'user-123',
        display_name: 'John Doe',
        email: 'john@example.com',
        phone_number: '555-1234',
        preferred_channel: 'both',
        identity_linked: true,
        auth_provider: 'google',
        is_verified: true,
        created_via: 'web',
        created_at: '2024-01-01',
        updated_at: '2024-03-02',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new ApiClient({
        teableUrl: 'http://test-write.com/api',
        teableApiKey: 'test-key',
      });
      await client.updateUserProfile(updateData);

      const call = mockFetch.mock.calls[0];
      const options = call[1] as RequestInit;
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual(
        expect.objectContaining({
          Authorization: 'Bearer test-key',
        })
      );
      expect(options.body).toBe(JSON.stringify(updateData));
    });

    it('should throw ApiError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      const client = new ApiClient({
        teableApiKey: 'test-key',
      });

      await expect(
        client.updateUserProfile({ display_name: 'Invalid' })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getUserSubmissions', () => {
    it('should call /users/submissions endpoint', async () => {
      const mockData = {
        data: [
          {
            submission_id: 'sub-001',
            user_id: 'user-123',
            content_type: 'business',
            content_id: 'bus-001',
            title: 'My Restaurant',
            status: 'approved',
            submitted_at: '2024-01-01',
            updated_at: '2024-01-15',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      const result = await client.getUserSubmissions();

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/users/submissions');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].submission_id).toBe('sub-001');
    });

    it('should pass content_type filter parameter', async () => {
      const mockData = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getUserSubmissions({ content_type: 'job' });

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('content_type=job');
    });

    it('should pass status filter parameter', async () => {
      const mockData = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getUserSubmissions({ status: 'pending' });

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('status=pending');
    });

    it('should pass pagination parameters', async () => {
      const mockData = {
        data: [],
        pagination: { page: 2, limit: 10, total: 50, totalPages: 5 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getUserSubmissions({ page: 2, limit: 10 });

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('page=2');
      expect(call[0]).toContain('limit=10');
    });

    it('should pass multiple filter parameters', async () => {
      const mockData = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getUserSubmissions({
        content_type: 'business',
        status: 'approved',
        page: 1,
        limit: 25,
      });

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('content_type=business');
      expect(call[0]).toContain('status=approved');
      expect(call[0]).toContain('page=1');
      expect(call[0]).toContain('limit=25');
    });
  });

  describe('getSavedItems', () => {
    it('should call /users/saved endpoint', async () => {
      const mockData = {
        data: [
          {
            saved_id: 'saved-001',
            user_id: 'user-123',
            item_type: 'business',
            item_id: 'bus-001',
            item_title: 'Favorite Restaurant',
            item_subtitle: 'Italian Cuisine',
            saved_at: '2024-01-15',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      const result = await client.getSavedItems();

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/users/saved');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].saved_id).toBe('saved-001');
    });

    it('should pass item_type filter parameter', async () => {
      const mockData = {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getSavedItems({ item_type: 'job' });

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('item_type=job');
    });

    it('should pass pagination parameters', async () => {
      const mockData = {
        data: [],
        pagination: { page: 3, limit: 15, total: 45, totalPages: 3 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getSavedItems({ page: 3, limit: 15 });

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('page=3');
      expect(call[0]).toContain('limit=15');
    });

    it('should pass multiple filter parameters', async () => {
      const mockData = {
        data: [],
        pagination: { page: 2, limit: 10, total: 20, totalPages: 2 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new ApiClient();
      await client.getSavedItems({ item_type: 'event', page: 2, limit: 10 });

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('item_type=event');
      expect(call[0]).toContain('page=2');
      expect(call[0]).toContain('limit=10');
    });
  });

  describe('saveItem', () => {
    it('should call /users/saved endpoint with POST method', async () => {
      const mockResponse = {
        saved_id: 'saved-002',
        user_id: 'user-123',
        item_type: 'business',
        item_id: 'bus-002',
        item_title: 'New Favorite',
        saved_at: '2024-03-02',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new ApiClient({
        teableUrl: 'http://test-write.com/api',
        teableApiKey: 'test-key',
      });
      const result = await client.saveItem('business', 'bus-002');

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toBe('http://test-write.com/api/users/saved');
      expect(result.saved_id).toBe('saved-002');
    });

    it('should send correct headers and body', async () => {
      const mockResponse = {
        saved_id: 'saved-003',
        user_id: 'user-123',
        item_type: 'job',
        item_id: 'job-001',
        item_title: 'Software Engineer Position',
        saved_at: '2024-03-02',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new ApiClient({
        teableUrl: 'http://test-write.com/api',
        teableApiKey: 'test-key',
      });
      await client.saveItem('job', 'job-001');

      const call = mockFetch.mock.calls[0];
      const options = call[1] as RequestInit;
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual(
        expect.objectContaining({
          Authorization: 'Bearer test-key',
        })
      );
      expect(options.body).toBe(JSON.stringify({ item_type: 'job', item_id: 'job-001' }));
    });

    it('should throw ApiError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const client = new ApiClient({
        teableApiKey: 'test-key',
      });

      await expect(client.saveItem('business', 'invalid-id')).rejects.toThrow(ApiError);
    });
  });

  describe('removeSavedItem', () => {
    it('should call /users/saved/{id} endpoint with DELETE method', async () => {
      const mockResponse = { success: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new ApiClient({
        teableUrl: 'http://test-write.com/api',
        teableApiKey: 'test-key',
      });
      const result = await client.removeSavedItem('saved-001');

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toBe('http://test-write.com/api/users/saved/saved-001');
      expect(result.success).toBe(true);
    });

    it('should use DELETE HTTP method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const client = new ApiClient({
        teableUrl: 'http://test-write.com/api',
        teableApiKey: 'test-key',
      });
      await client.removeSavedItem('saved-002');

      const call = mockFetch.mock.calls[0];
      const options = call[1] as RequestInit;
      expect(options.method).toBe('DELETE');
    });

    it('should include authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const client = new ApiClient({
        teableUrl: 'http://test-write.com/api',
        teableApiKey: 'test-key',
      });
      await client.removeSavedItem('saved-003');

      const call = mockFetch.mock.calls[0];
      const options = call[1] as RequestInit;
      expect(options.headers).toEqual(
        expect.objectContaining({
          Authorization: 'Bearer test-key',
        })
      );
    });

    it('should throw ApiError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const client = new ApiClient({
        teableApiKey: 'test-key',
      });

      await expect(client.removeSavedItem('nonexistent')).rejects.toThrow(ApiError);
    });

    it('should throw ApiError with correct status code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
      } as Response);

      const client = new ApiClient({
        teableApiKey: 'test-key',
      });

      try {
        await client.removeSavedItem('saved-forbidden');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(403);
      }
    });
  });

  describe('getNotificationPreferences', () => {
    it('should call /users/notifications endpoint', async () => {
      const mockPreferences = {
        user_id: 'user-123',
        preferences: [
          {
            type: 'email_digest',
            label: 'Email Digest',
            description: 'Weekly digest of new listings',
            enabled: true,
            frequency: 'weekly',
            channels: ['email'],
          },
          {
            type: 'whatsapp_alerts',
            label: 'WhatsApp Alerts',
            description: 'Real-time alerts on WhatsApp',
            enabled: true,
            frequency: 'real-time',
            channels: ['whatsapp'],
          },
        ],
        updated_at: '2024-02-01',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreferences,
      } as Response);

      const client = new ApiClient();
      const result = await client.getNotificationPreferences();

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('/users/notifications');
      expect(result.preferences).toHaveLength(2);
      expect(result.preferences[0].type).toBe('email_digest');
    });

    it('should use readGet and noCodeBackendUrl', async () => {
      const mockPreferences = {
        user_id: 'user-456',
        preferences: [],
        updated_at: '2024-03-02',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreferences,
      } as Response);

      const client = new ApiClient({
        noCodeBackendUrl: 'https://backend.example.com',
      });
      await client.getNotificationPreferences();

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('https://backend.example.com/users/notifications');
    });

    it('should throw ApiError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const client = new ApiClient();

      await expect(client.getNotificationPreferences()).rejects.toThrow(ApiError);
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should call /users/notifications endpoint with POST method', async () => {
      const updateData = [
        {
          type: 'email_digest',
          label: 'Email Digest',
          description: 'Weekly digest',
          enabled: false,
          frequency: 'weekly',
          channels: ['email'],
        },
      ];

      const mockResponse = {
        user_id: 'user-123',
        preferences: updateData,
        updated_at: '2024-03-02',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new ApiClient({
        teableUrl: 'http://test-write.com/api',
        teableApiKey: 'test-key',
      });
      const result = await client.updateNotificationPreferences(updateData);

      expect(mockFetch).toHaveBeenCalled();
      const call = mockFetch.mock.calls[0];
      expect(call[0]).toBe('http://test-write.com/api/users/notifications');
      expect(result.preferences).toHaveLength(1);
      expect(result.preferences[0].enabled).toBe(false);
    });

    it('should send correct headers and body', async () => {
      const updateData = [
        {
          type: 'whatsapp_alerts',
          label: 'WhatsApp Alerts',
          description: 'Real-time alerts',
          enabled: true,
          frequency: 'real-time',
          channels: ['whatsapp'],
        },
      ];

      const mockResponse = {
        user_id: 'user-123',
        preferences: updateData,
        updated_at: '2024-03-02',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new ApiClient({
        teableUrl: 'http://test-write.com/api',
        teableApiKey: 'test-key',
      });
      await client.updateNotificationPreferences(updateData);

      const call = mockFetch.mock.calls[0];
      const options = call[1] as RequestInit;
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual(
        expect.objectContaining({
          Authorization: 'Bearer test-key',
        })
      );
      expect(options.body).toBe(JSON.stringify({ preferences: updateData }));
    });

    it('should throw ApiError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as Response);

      const client = new ApiClient({
        teableApiKey: 'test-key',
      });

      await expect(
        client.updateNotificationPreferences([
          {
            type: 'invalid',
            label: 'Invalid',
            description: 'Invalid',
            enabled: true,
            frequency: 'never',
            channels: [],
          },
        ])
      ).rejects.toThrow(ApiError);
    });
  });
});
