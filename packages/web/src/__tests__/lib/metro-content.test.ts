import { METRO_CONTENT, MetroContent, getMetroContentBySlug, getAllMetroSlugs } from '@/lib/metro-content';

describe('metro-content', () => {
  describe('METRO_CONTENT array', () => {
    describe('array length and structure', () => {
      test('should have exactly 10 entries', () => {
        expect(METRO_CONTENT).toHaveLength(10);
      });

      test('all entries should be MetroContent objects', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro).toBeDefined();
          expect(typeof metro).toBe('object');
        });
      });
    });

    describe('required fields presence', () => {
      const requiredFields = [
        'slug',
        'city',
        'state',
        'stateCode',
        'metroArea',
        'headline',
        'description',
        'population',
        'indianPopulation',
        'highlights',
        'neighborhoods',
        'culturalLandmarks',
        'topCuisines',
        'communityOrgs',
        'seoTitle',
        'seoDescription',
      ];

      test('every metro should have all required fields', () => {
        METRO_CONTENT.forEach((metro) => {
          requiredFields.forEach((field) => {
            expect(metro).toHaveProperty(field);
            expect((metro as any)[field]).toBeDefined();
          });
        });
      });

      test('every metro should have non-empty slug', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.slug).toBeTruthy();
          expect(typeof metro.slug).toBe('string');
        });
      });

      test('every metro should have non-empty city', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.city).toBeTruthy();
          expect(typeof metro.city).toBe('string');
        });
      });

      test('every metro should have non-empty state', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.state).toBeTruthy();
          expect(typeof metro.state).toBe('string');
        });
      });

      test('every metro should have non-empty stateCode', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.stateCode).toBeTruthy();
          expect(typeof metro.stateCode).toBe('string');
        });
      });

      test('every metro should have non-empty headline', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.headline).toBeTruthy();
          expect(typeof metro.headline).toBe('string');
        });
      });

      test('every metro should have non-empty description', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.description).toBeTruthy();
          expect(typeof metro.description).toBe('string');
        });
      });

      test('every metro should have non-empty population', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.population).toBeTruthy();
          expect(typeof metro.population).toBe('string');
        });
      });

      test('every metro should have non-empty indianPopulation', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.indianPopulation).toBeTruthy();
          expect(typeof metro.indianPopulation).toBe('string');
        });
      });

      test('every metro should have non-empty seoTitle', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.seoTitle).toBeTruthy();
          expect(typeof metro.seoTitle).toBe('string');
        });
      });

      test('every metro should have non-empty seoDescription', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.seoDescription).toBeTruthy();
          expect(typeof metro.seoDescription).toBe('string');
        });
      });
    });

    describe('slug validation', () => {
      test('all slugs should be unique', () => {
        const slugs = METRO_CONTENT.map((m) => m.slug);
        const uniqueSlugs = new Set(slugs);
        expect(uniqueSlugs.size).toBe(slugs.length);
        expect(slugs.length).toBe(10);
      });

      test('all slugs should be lowercase', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.slug).toBe(metro.slug.toLowerCase());
        });
      });

      test('all slugs should be URL-safe (only alphanumeric and hyphens)', () => {
        const urlSafePattern = /^[a-z0-9-]+$/;
        METRO_CONTENT.forEach((metro) => {
          expect(metro.slug).toMatch(urlSafePattern);
        });
      });

      test('all slugs should not contain spaces', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.slug).not.toMatch(/\s/);
        });
      });

      test('known slugs should be present in correct order', () => {
        const expectedSlugs = ['nyc', 'bay-area', 'dallas', 'chicago', 'atlanta', 'houston', 'seattle', 'los-angeles', 'new-jersey', 'dc'];
        const actualSlugs = METRO_CONTENT.map((m) => m.slug);
        expect(actualSlugs).toEqual(expectedSlugs);
      });
    });

    describe('state code validation', () => {
      test('all state codes should be exactly 2 characters', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.stateCode).toHaveLength(2);
        });
      });

      test('all state codes should be uppercase', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.stateCode).toBe(metro.stateCode.toUpperCase());
        });
      });

      test('all state codes should be alphabetic', () => {
        const alphabeticPattern = /^[A-Z]{2}$/;
        METRO_CONTENT.forEach((metro) => {
          expect(metro.stateCode).toMatch(alphabeticPattern);
        });
      });
    });

    describe('arrays validation', () => {
      test('all highlights arrays should be non-empty', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(Array.isArray(metro.highlights)).toBe(true);
          expect(metro.highlights.length).toBeGreaterThan(0);
        });
      });

      test('all neighborhoods arrays should be non-empty', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(Array.isArray(metro.neighborhoods)).toBe(true);
          expect(metro.neighborhoods.length).toBeGreaterThan(0);
        });
      });

      test('all culturalLandmarks arrays should be non-empty', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(Array.isArray(metro.culturalLandmarks)).toBe(true);
          expect(metro.culturalLandmarks.length).toBeGreaterThan(0);
        });
      });

      test('all topCuisines arrays should be non-empty', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(Array.isArray(metro.topCuisines)).toBe(true);
          expect(metro.topCuisines.length).toBeGreaterThan(0);
        });
      });

      test('all communityOrgs arrays should be non-empty', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(Array.isArray(metro.communityOrgs)).toBe(true);
          expect(metro.communityOrgs.length).toBeGreaterThan(0);
        });
      });

      test('array elements should all be strings', () => {
        METRO_CONTENT.forEach((metro) => {
          [...metro.highlights, ...metro.neighborhoods, ...metro.culturalLandmarks, ...metro.topCuisines, ...metro.communityOrgs].forEach(
            (item) => {
              expect(typeof item).toBe('string');
              expect(item).toBeTruthy();
            }
          );
        });
      });
    });

    describe('SEO validation', () => {
      test('all seoTitle should contain "Desi Connect USA"', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.seoTitle).toContain('Desi Connect USA');
        });
      });

      test('all seoDescription should be non-empty', () => {
        METRO_CONTENT.forEach((metro) => {
          expect(metro.seoDescription).toBeTruthy();
          expect(metro.seoDescription.length).toBeGreaterThan(0);
        });
      });
    });

    describe('specific metro validations', () => {
      test('NYC metro should exist with correct city name', () => {
        const nyc = METRO_CONTENT.find((m) => m.slug === 'nyc');
        expect(nyc).toBeDefined();
        expect(nyc?.city).toBe('New York City');
        expect(nyc?.stateCode).toBe('NY');
      });

      test('Bay Area metro should exist with correct city name', () => {
        const bayArea = METRO_CONTENT.find((m) => m.slug === 'bay-area');
        expect(bayArea).toBeDefined();
        expect(bayArea?.city).toBe('Bay Area');
        expect(bayArea?.stateCode).toBe('CA');
      });

      test('Dallas metro should exist with correct city name', () => {
        const dallas = METRO_CONTENT.find((m) => m.slug === 'dallas');
        expect(dallas).toBeDefined();
        expect(dallas?.city).toBe('Dallas-Fort Worth');
        expect(dallas?.stateCode).toBe('TX');
      });

      test('Chicago metro should exist with correct city name', () => {
        const chicago = METRO_CONTENT.find((m) => m.slug === 'chicago');
        expect(chicago).toBeDefined();
        expect(chicago?.city).toBe('Chicago');
        expect(chicago?.stateCode).toBe('IL');
      });

      test('Atlanta metro should exist with correct city name', () => {
        const atlanta = METRO_CONTENT.find((m) => m.slug === 'atlanta');
        expect(atlanta).toBeDefined();
        expect(atlanta?.city).toBe('Atlanta');
        expect(atlanta?.stateCode).toBe('GA');
      });

      test('Houston metro should exist with correct city name', () => {
        const houston = METRO_CONTENT.find((m) => m.slug === 'houston');
        expect(houston).toBeDefined();
        expect(houston?.city).toBe('Houston');
        expect(houston?.stateCode).toBe('TX');
      });

      test('Seattle metro should exist with correct city name', () => {
        const seattle = METRO_CONTENT.find((m) => m.slug === 'seattle');
        expect(seattle).toBeDefined();
        expect(seattle?.city).toBe('Seattle');
        expect(seattle?.stateCode).toBe('WA');
      });

      test('Los Angeles metro should exist with correct city name', () => {
        const losAngeles = METRO_CONTENT.find((m) => m.slug === 'los-angeles');
        expect(losAngeles).toBeDefined();
        expect(losAngeles?.city).toBe('Los Angeles');
        expect(losAngeles?.stateCode).toBe('CA');
      });

      test('New Jersey metro should exist with correct city name', () => {
        const nj = METRO_CONTENT.find((m) => m.slug === 'new-jersey');
        expect(nj).toBeDefined();
        expect(nj?.city).toBe('New Jersey');
        expect(nj?.stateCode).toBe('NJ');
      });

      test('DC metro should exist with correct city name', () => {
        const dc = METRO_CONTENT.find((m) => m.slug === 'dc');
        expect(dc).toBeDefined();
        expect(dc?.city).toBe('Washington DC');
        expect(dc?.stateCode).toBe('DC');
      });
    });
  });

  describe('getMetroContentBySlug()', () => {
    test('should return correct metro for "nyc" slug', () => {
      const result = getMetroContentBySlug('nyc');
      expect(result).toBeDefined();
      expect(result?.city).toBe('New York City');
      expect(result?.slug).toBe('nyc');
    });

    test('should return correct metro for "bay-area" slug', () => {
      const result = getMetroContentBySlug('bay-area');
      expect(result).toBeDefined();
      expect(result?.city).toBe('Bay Area');
      expect(result?.slug).toBe('bay-area');
    });

    test('should return correct metro for "dallas" slug', () => {
      const result = getMetroContentBySlug('dallas');
      expect(result).toBeDefined();
      expect(result?.city).toBe('Dallas-Fort Worth');
      expect(result?.slug).toBe('dallas');
    });

    test('should return correct metro for "chicago" slug', () => {
      const result = getMetroContentBySlug('chicago');
      expect(result).toBeDefined();
      expect(result?.city).toBe('Chicago');
      expect(result?.slug).toBe('chicago');
    });

    test('should return correct metro for "atlanta" slug', () => {
      const result = getMetroContentBySlug('atlanta');
      expect(result).toBeDefined();
      expect(result?.city).toBe('Atlanta');
      expect(result?.slug).toBe('atlanta');
    });

    test('should return correct metro for "houston" slug', () => {
      const result = getMetroContentBySlug('houston');
      expect(result).toBeDefined();
      expect(result?.city).toBe('Houston');
      expect(result?.slug).toBe('houston');
    });

    test('should return correct metro for "seattle" slug', () => {
      const result = getMetroContentBySlug('seattle');
      expect(result).toBeDefined();
      expect(result?.city).toBe('Seattle');
      expect(result?.slug).toBe('seattle');
    });

    test('should return correct metro for "los-angeles" slug', () => {
      const result = getMetroContentBySlug('los-angeles');
      expect(result).toBeDefined();
      expect(result?.city).toBe('Los Angeles');
      expect(result?.slug).toBe('los-angeles');
    });

    test('should return correct metro for "new-jersey" slug', () => {
      const result = getMetroContentBySlug('new-jersey');
      expect(result).toBeDefined();
      expect(result?.city).toBe('New Jersey');
      expect(result?.slug).toBe('new-jersey');
    });

    test('should return correct metro for "dc" slug', () => {
      const result = getMetroContentBySlug('dc');
      expect(result).toBeDefined();
      expect(result?.city).toBe('Washington DC');
      expect(result?.slug).toBe('dc');
    });

    test('should return undefined for unknown slug', () => {
      const result = getMetroContentBySlug('unknown-city');
      expect(result).toBeUndefined();
    });

    test('should return undefined for empty string slug', () => {
      const result = getMetroContentBySlug('');
      expect(result).toBeUndefined();
    });

    test('should be case-sensitive and return undefined for uppercase slug', () => {
      const result = getMetroContentBySlug('NYC');
      expect(result).toBeUndefined();
    });

    test('should be case-sensitive and return undefined for mixed-case slug', () => {
      const result = getMetroContentBySlug('Bay-Area');
      expect(result).toBeUndefined();
    });

    test('should return undefined for partial slug match', () => {
      const result = getMetroContentBySlug('york');
      expect(result).toBeUndefined();
    });

    test('should return the full MetroContent object with all fields', () => {
      const result = getMetroContentBySlug('nyc');
      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('city');
      expect(result).toHaveProperty('state');
      expect(result).toHaveProperty('stateCode');
      expect(result).toHaveProperty('metroArea');
      expect(result).toHaveProperty('headline');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('population');
      expect(result).toHaveProperty('indianPopulation');
      expect(result).toHaveProperty('highlights');
      expect(result).toHaveProperty('neighborhoods');
      expect(result).toHaveProperty('culturalLandmarks');
      expect(result).toHaveProperty('topCuisines');
      expect(result).toHaveProperty('communityOrgs');
      expect(result).toHaveProperty('seoTitle');
      expect(result).toHaveProperty('seoDescription');
    });
  });

  describe('getAllMetroSlugs()', () => {
    test('should return an array', () => {
      const result = getAllMetroSlugs();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should return exactly 10 slugs', () => {
      const result = getAllMetroSlugs();
      expect(result).toHaveLength(10);
    });

    test('should return all known metro slugs', () => {
      const result = getAllMetroSlugs();
      const expectedSlugs = ['nyc', 'bay-area', 'dallas', 'chicago', 'atlanta', 'houston', 'seattle', 'los-angeles', 'new-jersey', 'dc'];
      expect(result).toEqual(expectedSlugs);
    });

    test('should return slugs in correct order', () => {
      const result = getAllMetroSlugs();
      expect(result[0]).toBe('nyc');
      expect(result[1]).toBe('bay-area');
      expect(result[2]).toBe('dallas');
      expect(result[3]).toBe('chicago');
      expect(result[4]).toBe('atlanta');
      expect(result[5]).toBe('houston');
      expect(result[6]).toBe('seattle');
      expect(result[7]).toBe('los-angeles');
      expect(result[8]).toBe('new-jersey');
      expect(result[9]).toBe('dc');
    });

    test('should return only strings', () => {
      const result = getAllMetroSlugs();
      result.forEach((slug) => {
        expect(typeof slug).toBe('string');
      });
    });

    test('should not return MetroContent objects', () => {
      const result = getAllMetroSlugs();
      result.forEach((slug) => {
        expect(typeof slug).not.toBe('object');
      });
    });

    test('should match slugs from METRO_CONTENT', () => {
      const result = getAllMetroSlugs();
      const metroSlugs = METRO_CONTENT.map((m) => m.slug);
      expect(result).toEqual(metroSlugs);
    });

    test('all returned slugs should be URL-safe', () => {
      const result = getAllMetroSlugs();
      const urlSafePattern = /^[a-z0-9-]+$/;
      result.forEach((slug) => {
        expect(slug).toMatch(urlSafePattern);
      });
    });

    test('all returned slugs should be unique', () => {
      const result = getAllMetroSlugs();
      const uniqueSlugs = new Set(result);
      expect(uniqueSlugs.size).toBe(result.length);
    });
  });

  describe('data consistency across functions', () => {
    test('getMetroContentBySlug should work for all slugs returned by getAllMetroSlugs', () => {
      const slugs = getAllMetroSlugs();
      slugs.forEach((slug) => {
        const result = getMetroContentBySlug(slug);
        expect(result).toBeDefined();
        expect(result?.slug).toBe(slug);
      });
    });

    test('all metros in METRO_CONTENT should be accessible via getMetroContentBySlug', () => {
      METRO_CONTENT.forEach((metro) => {
        const result = getMetroContentBySlug(metro.slug);
        expect(result).toEqual(metro);
      });
    });
  });
});
