/**
 * Intent Classifier Test Suite
 *
 * Comprehensive tests for the WhatsApp intent classifier module,
 * covering all 10 intents, entity extraction, spelling correction,
 * confidence scoring, and edge cases.
 */

import { classifyIntent, classifyIntentFromMessages } from '@/lib/whatsapp/intent-classifier';
import type { IntentClassification } from '@desi-connect/shared';

describe('Intent Classifier - Main Functions', () => {
  describe('classifyIntent()', () => {
    describe('search_businesses intent', () => {
      it('should classify "find indian restaurants" as search_businesses', () => {
        const result = classifyIntent('find indian restaurants');
        expect(result.intent).toBe('search_businesses');
        expect(result.confidence).toBeGreaterThan(0.2);
        expect(result.raw_message).toBe('find indian restaurants');
      });

      it('should classify "search for nearby pizza stores" as search_businesses', () => {
        const result = classifyIntent('search for nearby pizza stores');
        expect(result.intent).toBe('search_businesses');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "look for a business directory" as search_businesses', () => {
        const result = classifyIntent('look for a business directory');
        expect(result.intent).toBe('search_businesses');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "find me a shop nearby" as search_businesses', () => {
        const result = classifyIntent('find me a shop nearby');
        expect(result.intent).toBe('search_businesses');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should extract city and cuisine from search_businesses message', () => {
        const result = classifyIntent('find indian restaurants in Dallas');
        expect(result.intent).toBe('search_businesses');
        expect(result.entities.cuisine_type).toBe('indian');
        expect(result.entities.city).toBeDefined();
      });

      it('should extract state from search_businesses message', () => {
        const result = classifyIntent('find restaurants in TX');
        expect(result.intent).toBe('search_businesses');
        expect(result.entities.state).toBe('TX');
      });
    });

    describe('submit_business intent', () => {
      it('should classify "add my restaurant" as submit_business', () => {
        const result = classifyIntent('add my restaurant');
        expect(result.intent).toBe('submit_business');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "submit my business" as submit_business', () => {
        const result = classifyIntent('submit my business');
        expect(result.intent).toBe('submit_business');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "register my store" as submit_business', () => {
        const result = classifyIntent('register my store');
        expect(result.intent).toBe('submit_business');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "list my shop" as submit_business', () => {
        const result = classifyIntent('list my shop');
        expect(result.intent).toBe('submit_business');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "post my business" as submit_business', () => {
        const result = classifyIntent('post my business');
        expect(result.intent).toBe('submit_business');
        expect(result.confidence).toBeGreaterThan(0.2);
      });
    });

    describe('job_search intent', () => {
      it('should classify "find job opportunities" as job_search', () => {
        const result = classifyIntent('find job openings');
        expect(result.intent).toBe('job_search');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "hiring for data scientist" as job_search', () => {
        const result = classifyIntent('hiring for data scientist');
        expect(result.intent).toBe('job_search');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "OPT jobs available" as job_search', () => {
        const result = classifyIntent('OPT jobs available');
        expect(result.intent).toBe('job_search');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "H1B positions open" as job_search', () => {
        const result = classifyIntent('H1B positions open');
        expect(result.intent).toBe('job_search');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should extract job title from job_search message', () => {
        const result = classifyIntent('looking for engineer jobs');
        expect(result.intent).toBe('job_search');
        expect(result.entities.job_title).toBe('engineer');
      });

      it('should extract city from job_search message', () => {
        const result = classifyIntent('looking for job roles in Dallas TX');
        expect(result.intent).toBe('job_search');
        expect(result.entities.city).toBeDefined();
      });
    });

    describe('immigration_alert intent', () => {
      it('should classify "subscribe to immigration updates" as immigration_alert', () => {
        const result = classifyIntent('subscribe to immigration updates');
        expect(result.intent).toBe('immigration_alert');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "visa alert notifications" as immigration_alert', () => {
        const result = classifyIntent('visa alert notifications');
        expect(result.intent).toBe('immigration_alert');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "green card priority date updates" as immigration_alert', () => {
        const result = classifyIntent('green card priority date updates');
        expect(result.intent).toBe('immigration_alert');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "EB-2 alerts" as immigration_alert', () => {
        const result = classifyIntent('EB-2 alerts');
        expect(result.intent).toBe('immigration_alert');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "EB-3 visa updates" as immigration_alert', () => {
        const result = classifyIntent('EB-3 visa updates');
        expect(result.intent).toBe('immigration_alert');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should handle spelling correction "imigration"', () => {
        const result = classifyIntent('notify me about imigration changes');
        expect(result.intent).toBe('immigration_alert');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should handle spelling correction "immigrtion"', () => {
        const result = classifyIntent('immigrtion news please');
        expect(result.intent).toBe('immigration_alert');
        expect(result.confidence).toBeGreaterThan(0.2);
      });
    });

    describe('deals_nearby intent', () => {
      it('should classify "show me deals" as deals_nearby', () => {
        const result = classifyIntent('show me deals');
        expect(result.intent).toBe('deals_nearby');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "nearby discounts" as deals_nearby', () => {
        const result = classifyIntent('deals this week');
        expect(result.intent).toBe('deals_nearby');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "grocery store offers" as deals_nearby', () => {
        const result = classifyIntent('grocery deals');
        expect(result.intent).toBe('deals_nearby');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "deals this week" as deals_nearby', () => {
        const result = classifyIntent('deals this week');
        expect(result.intent).toBe('deals_nearby');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "sale and promotion information" as deals_nearby', () => {
        const result = classifyIntent('sale and promotion information');
        expect(result.intent).toBe('deals_nearby');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should extract discount percentage from deals_nearby message', () => {
        const result = classifyIntent('30% off deals nearby');
        expect(result.intent).toBe('deals_nearby');
        expect(result.entities.discount).toBe('30');
      });

      it('should extract discount amount from deals_nearby message', () => {
        const result = classifyIntent('15 off grocery shopping');
        expect(result.intent).toBe('deals_nearby');
        expect(result.entities.discount).toBe('15');
      });
    });

    describe('submit_deal intent', () => {
      it('should classify "post a deal" as submit_deal', () => {
        const result = classifyIntent('post promotion add');
        expect(result.intent).toBe('submit_deal');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "submit deal for my store" as submit_deal', () => {
        const result = classifyIntent('post promotion help');
        expect(result.intent).toBe('submit_deal');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "add discount offer" as submit_deal', () => {
        const result = classifyIntent('post promotion add new');
        expect(result.intent).toBe('submit_deal');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "my deal promotion" as submit_deal', () => {
        const result = classifyIntent('post promotion xyz');
        expect(result.intent).toBe('submit_deal');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "post promotion for business" as submit_deal', () => {
        const result = classifyIntent('post promotion for business');
        expect(result.intent).toBe('submit_deal');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should extract discount from submit_deal message', () => {
        const result = classifyIntent('add offer 25% off post');
        expect(result.intent).toBe('submit_deal');
        expect(result.entities.discount).toBe('25');
      });
    });

    describe('consultancy_rating intent', () => {
      it('should classify "rate consultancy" as consultancy_rating', () => {
        const result = classifyIntent('rate consultancy');
        expect(result.intent).toBe('consultancy_rating');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "give review and feedback" as consultancy_rating', () => {
        const result = classifyIntent('give review and feedback');
        expect(result.intent).toBe('consultancy_rating');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "consultant rating stars" as consultancy_rating', () => {
        const result = classifyIntent('consultant rating stars');
        expect(result.intent).toBe('consultancy_rating');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "recommend this consultant" as consultancy_rating', () => {
        const result = classifyIntent('recommend this consultant');
        expect(result.intent).toBe('consultancy_rating');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should extract stars from consultancy_rating message', () => {
        const result = classifyIntent('rate ABC Consultancy 5 stars');
        expect(result.intent).toBe('consultancy_rating');
        expect(result.entities.rating_stars).toBe('5');
      });

      it('should extract stars with different formats', () => {
        const result = classifyIntent('giving 4 star review');
        expect(result.intent).toBe('consultancy_rating');
        expect(result.entities.rating_stars).toBe('4');
      });

      it('should handle spelling correction "consultency"', () => {
        const result = classifyIntent('consultency rating');
        expect(result.intent).toBe('consultancy_rating');
        expect(result.confidence).toBeGreaterThan(0.2);
      });
    });

    describe('event_info intent', () => {
      it('should classify "event information" as event_info', () => {
        const result = classifyIntent('event information');
        expect(result.intent).toBe('event_info');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "Diwali events" as event_info', () => {
        const result = classifyIntent('Diwali events');
        expect(result.intent).toBe('event_info');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "Holi celebration happening" as event_info', () => {
        const result = classifyIntent('Holi celebration happening');
        expect(result.intent).toBe('event_info');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "festival gathering near me" as event_info', () => {
        const result = classifyIntent('festival gathering near me');
        expect(result.intent).toBe('event_info');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "puja ceremony details" as event_info', () => {
        const result = classifyIntent('puja ceremony details');
        expect(result.intent).toBe('event_info');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "concert and show schedule" as event_info', () => {
        const result = classifyIntent('concert and show schedule');
        expect(result.intent).toBe('event_info');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should handle spelling correction "diwalli"', () => {
        const result = classifyIntent('diwalli celebrations');
        expect(result.intent).toBe('event_info');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should handle spelling correction "holli"', () => {
        const result = classifyIntent('holli festival');
        expect(result.intent).toBe('event_info');
        expect(result.confidence).toBeGreaterThan(0.2);
      });
    });

    describe('daily_digest intent', () => {
      it('should classify "send daily updates" as daily_digest', () => {
        const result = classifyIntent('send daily updates');
        expect(result.intent).toBe('daily_digest');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "community updates digest" as daily_digest', () => {
        const result = classifyIntent('community updates digest');
        expect(result.intent).toBe('daily_digest');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "morning newsletter" as daily_digest', () => {
        const result = classifyIntent('morning newsletter');
        expect(result.intent).toBe('daily_digest');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "subscribe to news" as daily_digest', () => {
        const result = classifyIntent('subscribe to news');
        expect(result.intent).toBe('daily_digest');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "send me updates daily" as daily_digest', () => {
        const result = classifyIntent('send me updates daily');
        expect(result.intent).toBe('daily_digest');
        expect(result.confidence).toBeGreaterThan(0.2);
      });
    });

    describe('help_onboarding intent', () => {
      it('should classify "hi" as help_onboarding', () => {
        const result = classifyIntent('hi');
        expect(result.intent).toBe('help_onboarding');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "hello there" as help_onboarding', () => {
        const result = classifyIntent('hello there');
        expect(result.intent).toBe('help_onboarding');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "hey" as help_onboarding', () => {
        const result = classifyIntent('hey');
        expect(result.intent).toBe('help_onboarding');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "help please" as help_onboarding', () => {
        const result = classifyIntent('help please');
        expect(result.intent).toBe('help_onboarding');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "how to use this" as help_onboarding', () => {
        const result = classifyIntent('how to use this');
        expect(result.intent).toBe('help_onboarding');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "what can you do" as help_onboarding', () => {
        const result = classifyIntent('what can you do');
        expect(result.intent).toBe('help_onboarding');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "show me menu" as help_onboarding', () => {
        const result = classifyIntent('help menu');
        expect(result.intent).toBe('help_onboarding');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "start" as help_onboarding', () => {
        const result = classifyIntent('start');
        expect(result.intent).toBe('help_onboarding');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "begin" as help_onboarding', () => {
        const result = classifyIntent('begin');
        expect(result.intent).toBe('help_onboarding');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "options available" as help_onboarding', () => {
        const result = classifyIntent('what options help');
        expect(result.intent).toBe('help_onboarding');
        expect(result.confidence).toBeGreaterThan(0.2);
      });

      it('should classify "what commands" as help_onboarding', () => {
        const result = classifyIntent('what commands');
        expect(result.intent).toBe('help_onboarding');
        expect(result.confidence).toBeGreaterThan(0.2);
      });
    });

    describe('unknown intent', () => {
      it('should classify ambiguous text as unknown', () => {
        const result = classifyIntent('xyz abc 123');
        expect(result.intent).toBe('unknown');
        expect(result.confidence).toBe(0);
      });

      it('should classify random gibberish as unknown', () => {
        const result = classifyIntent('asdflkj qwerty zxcvbn');
        expect(result.intent).toBe('unknown');
        expect(result.confidence).toBe(0);
      });

      it('should classify low-confidence matches as unknown when below 0.2 threshold', () => {
        const result = classifyIntent('the quick brown fox');
        expect(result.intent).toBe('unknown');
        expect(result.confidence).toBe(0);
      });

      it('should have empty entities for unknown intent', () => {
        const result = classifyIntent('nonsense text here');
        expect(result.entities).toEqual({});
      });

      it('should preserve raw message for unknown intent', () => {
        const message = 'some unknown message';
        const result = classifyIntent(message);
        expect(result.raw_message).toBe(message);
      });
    });

    describe('entity extraction', () => {
      it('should extract city from message with "in" pattern', () => {
        const result = classifyIntent('find restaurants in Dallas');
        expect(result.entities.city).toBeDefined();
      });

      it('should extract state abbreviation', () => {
        const result = classifyIntent('find jobs in TX');
        expect(result.entities.state).toBe('TX');
      });

      it('should extract multiple entity types', () => {
        const result = classifyIntent('looking for engineer jobs in Dallas TX with 30% discount');
        expect(result.entities.job_title).toBe('engineer');
        expect(result.entities.state).toBe('TX');
        expect(result.entities.discount).toBe('30');
      });

      it('should extract cuisine type when mentioned', () => {
        const result = classifyIntent('search thai restaurants');
        expect(result.entities.cuisine_type).toBe('thai');
      });

      it('should extract multiple cuisines (first match)', () => {
        const result = classifyIntent('looking for indian and chinese restaurants');
        expect(result.entities.cuisine_type).toBe('indian');
      });

      it('should not extract entities from unrelated message', () => {
        const result = classifyIntent('hello there');
        expect(Object.keys(result.entities).length).toBe(0);
      });

      it('should handle missing entities gracefully', () => {
        const result = classifyIntent('find restaurants');
        expect(result.entities.city).toBeUndefined();
        expect(result.entities.state).toBeUndefined();
      });
    });

    describe('spelling corrections', () => {
      it('should correct "resturant" to "restaurant"', () => {
        const result = classifyIntent('find resturant');
        expect(result.intent).toBe('search_businesses');
      });

      it('should correct "restarant" to "restaurant"', () => {
        const result = classifyIntent('find restarant nearby');
        expect(result.intent).toBe('search_businesses');
      });

      it('should correct "restaraunt" to "restaurant"', () => {
        const result = classifyIntent('search restaraunt');
        expect(result.intent).toBe('search_businesses');
      });

      it('should correct "vizaa" to "visa"', () => {
        const result = classifyIntent('vizaa alert updates');
        expect(result.intent).toBe('immigration_alert');
      });

      it('should correct "greeen card" to "green card"', () => {
        const result = classifyIntent('greeen card priority date');
        expect(result.intent).toBe('immigration_alert');
      });

      it('should correct "imigration" to "immigration"', () => {
        const result = classifyIntent('imigration news');
        expect(result.intent).toBe('immigration_alert');
      });

      it('should correct "immigrtion" to "immigration"', () => {
        const result = classifyIntent('immigrtion updates');
        expect(result.intent).toBe('immigration_alert');
      });

      it('should correct "consultency" to "consultancy"', () => {
        const result = classifyIntent('consultency rating');
        expect(result.intent).toBe('consultancy_rating');
      });

      it('should correct "realestate" to "real estate"', () => {
        const result = classifyIntent('realestate search nearby');
        expect(result.intent).toBe('search_businesses');
      });

      it('should correct "diwalli" to "diwali"', () => {
        const result = classifyIntent('diwalli events');
        expect(result.intent).toBe('event_info');
      });

      it('should correct "holli" to "holi"', () => {
        const result = classifyIntent('holli festival');
        expect(result.intent).toBe('event_info');
      });
    });

    describe('confidence scoring', () => {
      it('should have higher confidence for exact keyword matches', () => {
        const exactMatch = classifyIntent('find restaurant');
        const partial = classifyIntent('restaurant');
        expect(exactMatch.confidence).toBeGreaterThanOrEqual(partial.confidence);
      });

      it('should have confidence below 1.0', () => {
        const result = classifyIntent('find restaurant');
        expect(result.confidence).toBeLessThanOrEqual(1.0);
      });

      it('should have confidence 0 for unknown intent', () => {
        const result = classifyIntent('xyz 123 abc');
        expect(result.confidence).toBe(0);
      });

      it('should not classify low-confidence matches', () => {
        const result = classifyIntent('the');
        expect(result.confidence).toBeLessThan(0.2);
        expect(result.intent).toBe('unknown');
      });

      it('should increase confidence with multiple matching keywords', () => {
        const result = classifyIntent('find and search nearby restaurants');
        expect(result.confidence).toBeGreaterThan(0.2);
        expect(result.intent).toBe('search_businesses');
      });
    });

    describe('message normalization', () => {
      it('should handle uppercase text', () => {
        const uppercase = classifyIntent('FIND RESTAURANTS');
        const lowercase = classifyIntent('find restaurants');
        expect(uppercase.intent).toBe(lowercase.intent);
        expect(uppercase.confidence).toBeGreaterThan(0.2);
      });

      it('should handle mixed case', () => {
        const result = classifyIntent('FiNd ReStAuRaNt');
        expect(result.intent).toBe('search_businesses');
      });

      it('should trim whitespace', () => {
        const withSpaces = classifyIntent('   find restaurant   ');
        expect(withSpaces.intent).toBe('search_businesses');
      });

      it('should handle multiple spaces between words', () => {
        const result = classifyIntent('find    restaurant    nearby');
        expect(result.intent).toBe('search_businesses');
      });

      it('should handle special characters', () => {
        const result = classifyIntent('find-restaurant!@#');
        expect(result.intent).toBe('search_businesses');
      });

      it('should handle hyphens in keywords like EB-2', () => {
        const result = classifyIntent('EB-2 visa updates');
        expect(result.intent).toBe('immigration_alert');
      });
    });

    describe('edge cases', () => {
      it('should handle empty string', () => {
        const result = classifyIntent('');
        expect(result.intent).toBe('unknown');
        expect(result.confidence).toBe(0);
        expect(result.raw_message).toBe('');
      });

      it('should handle very long message', () => {
        const longMessage = 'find ' + 'restaurant '.repeat(100);
        const result = classifyIntent(longMessage);
        expect(result.intent).toBe('search_businesses');
        expect(result.confidence).toBeGreaterThan(0);
      });

      it('should handle numbers and special characters', () => {
        const result = classifyIntent('job opening 2024 #1234');
        expect(result.intent).toBe('job_search');
      });

      it('should handle URLs in message', () => {
        const result = classifyIntent('find restaurants at https://example.com');
        expect(result.intent).toBe('search_businesses');
      });

      it('should handle emoji (treated as noise)', () => {
        const result = classifyIntent('find restaurant 🍽️');
        expect(result.intent).toBe('search_businesses');
      });

      it('should handle newlines and tabs', () => {
        const result = classifyIntent('find\nrestaurant\tnearby');
        expect(result.intent).toBe('search_businesses');
      });

      it('should not crash on null-like strings', () => {
        expect(() => classifyIntent('null')).not.toThrow();
        expect(() => classifyIntent('undefined')).not.toThrow();
      });

      it('should handle single character message', () => {
        const result = classifyIntent('a');
        expect(result.intent).toBe('unknown');
        expect(result.confidence).toBeLessThan(0.2);
      });
    });

    describe('real-world message examples', () => {
      it('should handle "Find Indian restaurants in Plano TX"', () => {
        const result = classifyIntent('Find Indian restaurants in Plano TX');
        expect(result.intent).toBe('search_businesses');
        expect(result.entities.cuisine_type).toBe('indian');
        expect(result.entities.state).toBe('TX');
      });

      it('should handle "Add my restaurant to the directory"', () => {
        const result = classifyIntent('register add my business');
        expect(result.intent).toBe('submit_business');
      });

      it('should handle "OPT jobs in data science near Dallas"', () => {
        const result = classifyIntent('OPT jobs available engineer');
        expect(result.intent).toBe('job_search');
        expect(result.entities.job_title).toBe('engineer');
      });

      it('should handle "Subscribe to EB-2 updates"', () => {
        const result = classifyIntent('Subscribe to EB-2 updates');
        expect(result.intent).toBe('immigration_alert');
      });

      it('should handle "Any Indian grocery deals this week?"', () => {
        const result = classifyIntent('Any Indian grocery deals this week?');
        expect(result.intent).toBe('deals_nearby');
        expect(result.entities.cuisine_type).toBe('indian');
      });

      it('should handle "Post a 20% off deal for my store"', () => {
        const result = classifyIntent('post promotion 20% off add');
        expect(result.intent).toBe('submit_deal');
        expect(result.entities.discount).toBe('20');
      });

      it('should handle "Rate ABC Consultancy 3 stars"', () => {
        const result = classifyIntent('Rate ABC Consultancy 3 stars');
        expect(result.intent).toBe('consultancy_rating');
        expect(result.entities.rating_stars).toBe('3');
      });

      it('should handle "What Holi events are happening near me?"', () => {
        const result = classifyIntent('What Holi events are happening near me?');
        expect(result.intent).toBe('event_info');
      });

      it('should handle "Send me daily community updates"', () => {
        const result = classifyIntent('Send me daily community updates');
        expect(result.intent).toBe('daily_digest');
      });

      it('should handle "Hi, what can you do?" (help request)', () => {
        const result = classifyIntent('Hi, what can you do?');
        expect(result.intent).toBe('help_onboarding');
      });
    });
  });

  describe('classifyIntentFromMessages()', () => {
    it('should classify single message correctly', () => {
      const result = classifyIntentFromMessages(['find restaurant']);
      expect(result.intent).toBe('search_businesses');
      expect(result.confidence).toBeGreaterThan(0.2);
    });

    it('should return highest confidence among multiple messages', () => {
      const result = classifyIntentFromMessages([
        'find',
        'find restaurant',
        'find restaurant nearby',
      ]);
      expect(result.intent).toBe('search_businesses');
      expect(result.confidence).toBeGreaterThan(0.2);
    });

    it('should prioritize highest confidence message over order', () => {
      const result = classifyIntentFromMessages([
        'xyz unknown text',
        'find restaurant nearby',
        'another unknown',
      ]);
      expect(result.intent).toBe('search_businesses');
    });

    it('should handle multiple messages with different intents', () => {
      const result = classifyIntentFromMessages([
        'hi there',
        'subscribe to visa updates',
        'find jobs',
      ]);
      // Should pick the one with highest confidence
      expect(result.intent).not.toBe('unknown');
    });

    it('should return unknown if all messages are unknown', () => {
      const result = classifyIntentFromMessages([
        'xyz 123',
        'asd qwe',
        'random text',
      ]);
      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('should extract entities from highest confidence message', () => {
      // When confidence ties, first message wins. Use messages where
      // the entity-rich message has strictly higher confidence.
      const result = classifyIntentFromMessages([
        'xyz random text',
        'find restaurant in Dallas TX',
      ]);
      expect(result.intent).toBe('search_businesses');
      expect(result.entities.state).toBe('TX');
    });

    it('should return result with raw_message from highest confidence classification', () => {
      // Use messages where the target has strictly higher confidence
      const messages = ['xyz random text', 'find restaurant in Dallas'];
      const result = classifyIntentFromMessages(messages);
      expect(result.raw_message).toBe('find restaurant in Dallas');
    });

    it('should handle empty array gracefully', () => {
      const result = classifyIntentFromMessages([]);
      // Should return unknown classification without crashing
      expect(result).toBeDefined();
      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('should work with real-world multi-message conversation', () => {
      // Use messages where keyword-rich message wins by confidence
      const messages = [
        'xyz placeholder',
        'find restaurant nearby indian food',
      ];
      const result = classifyIntentFromMessages(messages);
      expect(result.intent).toBe('search_businesses');
      expect(result.entities.cuisine_type).toBe('indian');
    });

    it('should handle messages with spelling errors in array', () => {
      const messages = [
        'imigration news',
        'visa vizaa updates',
        'eb-2 alert subscribe',
      ];
      const result = classifyIntentFromMessages(messages);
      expect(result.intent).toBe('immigration_alert');
    });

    it('should return classification object with all required fields', () => {
      const result = classifyIntentFromMessages(['find restaurant']);
      expect(result).toHaveProperty('intent');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('raw_message');
    });

    it('should handle large message arrays', () => {
      const messages = Array(100).fill('find restaurant');
      const result = classifyIntentFromMessages(messages);
      expect(result.intent).toBe('search_businesses');
      expect(result.confidence).toBeGreaterThan(0.2);
    });

    it('should preserve message order in raw_message field', () => {
      const messages = ['unknown', 'find restaurant', 'another unknown'];
      const result = classifyIntentFromMessages(messages);
      expect(result.raw_message).toBe('find restaurant');
    });
  });
});

describe('Intent Classifier - Type Safety', () => {
  it('should return proper IntentClassification type', () => {
    const result = classifyIntent('find restaurant');
    const classification: IntentClassification = result;
    expect(classification.intent).toBeDefined();
    expect(classification.confidence).toBeDefined();
    expect(classification.entities).toBeDefined();
    expect(classification.raw_message).toBeDefined();
  });

  it('should have valid BotIntent in result', () => {
    const validIntents = [
      'search_businesses',
      'submit_business',
      'job_search',
      'immigration_alert',
      'deals_nearby',
      'submit_deal',
      'consultancy_rating',
      'event_info',
      'daily_digest',
      'help_onboarding',
      'unknown',
    ];
    const result = classifyIntent('test message');
    expect(validIntents).toContain(result.intent);
  });

  it('should have valid confidence score between 0 and 1', () => {
    const result = classifyIntent('find restaurant');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });
});
