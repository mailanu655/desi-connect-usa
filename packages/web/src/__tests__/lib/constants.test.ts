import {
  SITE_NAME,
  SITE_DESCRIPTION,
  SITE_URL,
  METRO_AREAS,
  BUSINESS_CATEGORIES,
  NEWS_CATEGORIES,
  JOB_TYPES,
  NAV_LINKS,
  WHATSAPP_BOT_URL,
  DEFAULT_PAGE_SIZE,
} from '@/lib/constants';

describe('Constants', () => {
  describe('SITE_NAME', () => {
    it('should equal "Desi Connect USA"', () => {
      expect(SITE_NAME).toBe('Desi Connect USA');
    });
  });

  describe('SITE_DESCRIPTION', () => {
    it('should be a non-empty string', () => {
      expect(typeof SITE_DESCRIPTION).toBe('string');
      expect(SITE_DESCRIPTION.length).toBeGreaterThan(0);
    });

    it('should describe the site purpose', () => {
      expect(SITE_DESCRIPTION).toContain('Indian diaspora');
    });
  });

  describe('SITE_URL', () => {
    it('should have proper URL format', () => {
      const urlPattern = /^https?:\/\/.+/;
      expect(SITE_URL).toMatch(urlPattern);
    });

    it('should be a valid URL', () => {
      expect(() => new URL(SITE_URL)).not.toThrow();
    });
  });

  describe('METRO_AREAS', () => {
    it('should have 10 entries', () => {
      expect(METRO_AREAS).toHaveLength(10);
    });

    it('should have all required properties for each entry', () => {
      METRO_AREAS.forEach((area) => {
        expect(area).toHaveProperty('slug');
        expect(area).toHaveProperty('name');
        expect(area).toHaveProperty('state');
        expect(typeof area.slug).toBe('string');
        expect(typeof area.name).toBe('string');
        expect(typeof area.state).toBe('string');
      });
    });

    it('should have unique slugs', () => {
      const slugs = METRO_AREAS.map((area) => area.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(METRO_AREAS.length);
    });

    it('should have valid 2-letter state codes', () => {
      const statePattern = /^[A-Z]{2}$/;
      METRO_AREAS.forEach((area) => {
        expect(area.state).toMatch(statePattern);
      });
    });

    it('should contain specific metro areas', () => {
      const slugs = METRO_AREAS.map((area) => area.slug);
      expect(slugs).toContain('nyc');
      expect(slugs).toContain('bay-area');
      expect(slugs).toContain('chicago');
    });
  });

  describe('BUSINESS_CATEGORIES', () => {
    it('should have entries with value, label, and icon', () => {
      BUSINESS_CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty('value');
        expect(category).toHaveProperty('label');
        expect(category).toHaveProperty('icon');
        expect(typeof category.value).toBe('string');
        expect(typeof category.label).toBe('string');
        expect(typeof category.icon).toBe('string');
      });
    });

    it('should have non-empty values and labels', () => {
      BUSINESS_CATEGORIES.forEach((category) => {
        expect(category.value.length).toBeGreaterThan(0);
        expect(category.label.length).toBeGreaterThan(0);
      });
    });

    it('should have unique values', () => {
      const values = BUSINESS_CATEGORIES.map((category) => category.value);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(BUSINESS_CATEGORIES.length);
    });

    it('should contain common business categories', () => {
      const values = BUSINESS_CATEGORIES.map((category) => category.value);
      expect(values).toContain('restaurant');
      expect(values).toContain('medical');
      expect(values).toContain('legal');
    });
  });

  describe('NEWS_CATEGORIES', () => {
    it('should have entries with value, label, and color', () => {
      NEWS_CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty('value');
        expect(category).toHaveProperty('label');
        expect(category).toHaveProperty('color');
        expect(typeof category.value).toBe('string');
        expect(typeof category.label).toBe('string');
        expect(typeof category.color).toBe('string');
      });
    });

    it('should have non-empty values, labels, and colors', () => {
      NEWS_CATEGORIES.forEach((category) => {
        expect(category.value.length).toBeGreaterThan(0);
        expect(category.label.length).toBeGreaterThan(0);
        expect(category.color.length).toBeGreaterThan(0);
      });
    });

    it('should contain important news categories', () => {
      const values = NEWS_CATEGORIES.map((category) => category.value);
      expect(values).toContain('immigration');
      expect(values).toContain('community');
      expect(values).toContain('business');
    });
  });

  describe('JOB_TYPES', () => {
    it('should have exactly 5 entries', () => {
      expect(JOB_TYPES).toHaveLength(5);
    });

    it('should include all standard job types', () => {
      const values = JOB_TYPES.map((jobType) => jobType.value);
      expect(values).toContain('full_time');
      expect(values).toContain('part_time');
      expect(values).toContain('contract');
      expect(values).toContain('internship');
      expect(values).toContain('freelance');
    });

    it('should have value and label properties', () => {
      JOB_TYPES.forEach((jobType) => {
        expect(jobType).toHaveProperty('value');
        expect(jobType).toHaveProperty('label');
        expect(typeof jobType.value).toBe('string');
        expect(typeof jobType.label).toBe('string');
      });
    });
  });

  describe('NAV_LINKS', () => {
    it('should have proper href and label structure', () => {
      NAV_LINKS.forEach((link) => {
        expect(link).toHaveProperty('href');
        expect(link).toHaveProperty('label');
        expect(typeof link.href).toBe('string');
        expect(typeof link.label).toBe('string');
      });
    });

    it('should have hrefs that start with "/"', () => {
      NAV_LINKS.forEach((link) => {
        expect(link.href).toMatch(/^\//);
      });
    });

    it('should have non-empty labels', () => {
      NAV_LINKS.forEach((link) => {
        expect(link.label.length).toBeGreaterThan(0);
      });
    });

    it('should contain key navigation links', () => {
      const hrefs = NAV_LINKS.map((link) => link.href);
      expect(hrefs).toContain('/');
      expect(hrefs).toContain('/businesses');
      expect(hrefs).toContain('/jobs');
      expect(hrefs).toContain('/news');
    });
  });

  describe('DEFAULT_PAGE_SIZE', () => {
    it('should equal 20', () => {
      expect(DEFAULT_PAGE_SIZE).toBe(20);
    });

    it('should be a positive integer', () => {
      expect(typeof DEFAULT_PAGE_SIZE).toBe('number');
      expect(DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
      expect(Number.isInteger(DEFAULT_PAGE_SIZE)).toBe(true);
    });
  });

  describe('WHATSAPP_BOT_URL', () => {
    it('should start with "https://wa.me/"', () => {
      expect(WHATSAPP_BOT_URL).toMatch(/^https:\/\/wa\.me\//);
    });

    it('should be a valid URL', () => {
      expect(() => new URL(WHATSAPP_BOT_URL)).not.toThrow();
    });
  });
});
