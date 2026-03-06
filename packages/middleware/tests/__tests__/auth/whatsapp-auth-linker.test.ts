import {
  WhatsAppAuthLinker,
  InMemoryLinkStore,
} from '../../../src/auth/whatsapp-auth-linker';
import type { LinkStore } from '../../../src/auth/whatsapp-auth-linker';

// ── Helpers ──────────────────────────────────────────────────

function createLinker(config = {}) {
  const store = new InMemoryLinkStore();
  const linker = new WhatsAppAuthLinker(store, config);
  return { linker, store };
}

// ── InMemoryLinkStore ────────────────────────────────────────

describe('InMemoryLinkStore', () => {
  let store: InMemoryLinkStore;

  beforeEach(() => {
    store = new InMemoryLinkStore();
  });

  it('should return null for missing key', async () => {
    expect(await store.get('+14155551234')).toBeNull();
  });

  it('should set and get a pending link', async () => {
    const link = {
      phone: '+14155551234',
      userId: 'user_1',
      code: '123456',
      attempts: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
    };
    await store.set('+14155551234', link);
    const result = await store.get('+14155551234');
    expect(result).toEqual(link);
  });

  it('should return null for expired links', async () => {
    const link = {
      phone: '+14155551234',
      userId: 'user_1',
      code: '123456',
      attempts: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(), // already expired
    };
    await store.set('+14155551234', link);
    expect(await store.get('+14155551234')).toBeNull();
  });

  it('should delete a key', async () => {
    const link = {
      phone: '+14155551234',
      userId: 'user_1',
      code: '123456',
      attempts: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
    };
    await store.set('+14155551234', link);
    await store.delete('+14155551234');
    expect(await store.get('+14155551234')).toBeNull();
  });

  it('should clear all entries', async () => {
    const makeLink = (phone: string) => ({
      phone,
      userId: 'user_1',
      code: '123456',
      attempts: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
    });
    await store.set('+1', makeLink('+1'));
    await store.set('+2', makeLink('+2'));
    store.clear();
    expect(await store.get('+1')).toBeNull();
    expect(await store.get('+2')).toBeNull();
  });
});

// ── WhatsAppAuthLinker ───────────────────────────────────────

describe('WhatsAppAuthLinker', () => {
  describe('initiateLinking', () => {
    it('should generate a 6-digit OTP code by default', async () => {
      const { linker } = createLinker();
      const { code } = await linker.initiateLinking('+14155551234', 'user_1');

      expect(code).toMatch(/^\d{6}$/);
    });

    it('should respect custom code length', async () => {
      const { linker } = createLinker({ codeLength: 4 });
      const { code } = await linker.initiateLinking('+14155551234', 'user_1');

      expect(code).toMatch(/^\d{4}$/);
    });

    it('should store the pending link', async () => {
      const { linker } = createLinker();
      await linker.initiateLinking('+14155551234', 'user_1');

      expect(await linker.hasPendingLink('+14155551234')).toBe(true);
    });

    it('should throw when max attempts exceeded and still in lockout', async () => {
      const { linker, store } = createLinker({ maxAttempts: 3, lockoutSec: 900 });

      // Manually set a locked-out pending link
      const now = new Date();
      await store.set('+14155551234', {
        phone: '+14155551234',
        userId: 'user_1',
        code: '123456',
        attempts: 3,
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 300_000).toISOString(),
      });

      await expect(
        linker.initiateLinking('+14155551234', 'user_1'),
      ).rejects.toThrow('Too many verification attempts');
    });

    it('should allow re-initiation after lockout expires', async () => {
      const { linker, store } = createLinker({ maxAttempts: 3, lockoutSec: 1 });

      // Set a locked-out link with lockout already expired
      const pastDate = new Date(Date.now() - 5000);
      await store.set('+14155551234', {
        phone: '+14155551234',
        userId: 'user_1',
        code: '123456',
        attempts: 3,
        createdAt: pastDate.toISOString(),
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
      });

      const { code } = await linker.initiateLinking('+14155551234', 'user_1');
      expect(code).toMatch(/^\d{6}$/);
    });
  });

  describe('verifyCode', () => {
    it('should succeed with correct code', async () => {
      const { linker } = createLinker();
      const { code } = await linker.initiateLinking('+14155551234', 'user_42');
      const result = await linker.verifyCode('+14155551234', code);

      expect(result.success).toBe(true);
      expect(result.userId).toBe('user_42');
      expect(result.error).toBeUndefined();
    });

    it('should clean up pending link after successful verification', async () => {
      const { linker } = createLinker();
      const { code } = await linker.initiateLinking('+14155551234', 'user_42');
      await linker.verifyCode('+14155551234', code);

      expect(await linker.hasPendingLink('+14155551234')).toBe(false);
    });

    it('should return not_found for unknown phone', async () => {
      const { linker } = createLinker();
      const result = await linker.verifyCode('+14155559999', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('not_found');
    });

    it('should return invalid_code for wrong code', async () => {
      const { linker } = createLinker();
      await linker.initiateLinking('+14155551234', 'user_1');
      const result = await linker.verifyCode('+14155551234', '000000');

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_code');
    });

    it('should return max_attempts after too many wrong tries', async () => {
      const { linker } = createLinker({ maxAttempts: 2 });
      await linker.initiateLinking('+14155551234', 'user_1');

      await linker.verifyCode('+14155551234', '000001');
      const result = await linker.verifyCode('+14155551234', '000002');

      expect(result.success).toBe(false);
      expect(result.error).toBe('max_attempts');
    });

    it('should handle code with whitespace', async () => {
      const { linker } = createLinker();
      const { code } = await linker.initiateLinking('+14155551234', 'user_1');
      const result = await linker.verifyCode('+14155551234', ` ${code} `);

      expect(result.success).toBe(true);
    });

    it('should return expired for timed-out OTP', async () => {
      // Use a raw Map-backed store that does NOT pre-filter expired links,
      // so verifyCode's own expiry check (not the store's) is exercised.
      const rawStore = new Map<string, string>();
      const noFilterStore: LinkStore = {
        async get(phone: string) {
          const val = rawStore.get(phone);
          return val ? JSON.parse(val) : null;
        },
        async set(phone: string, link: any, _ttlSec: number) {
          rawStore.set(phone, JSON.stringify(link));
        },
        async delete(phone: string) {
          rawStore.delete(phone);
        },
      };

      const linker = new WhatsAppAuthLinker(noFilterStore, { otpTtlSec: 1 });

      // Manually create an expired link
      await noFilterStore.set('+14155551234', {
        phone: '+14155551234',
        userId: 'user_1',
        code: '123456',
        attempts: 0,
        createdAt: new Date(Date.now() - 10_000).toISOString(),
        expiresAt: new Date(Date.now() - 5_000).toISOString(),
      }, 300);

      const result = await linker.verifyCode('+14155551234', '123456');
      expect(result.success).toBe(false);
      expect(result.error).toBe('expired');
    });
  });

  describe('cancelLinking', () => {
    it('should remove the pending link', async () => {
      const { linker } = createLinker();
      await linker.initiateLinking('+14155551234', 'user_1');
      await linker.cancelLinking('+14155551234');

      expect(await linker.hasPendingLink('+14155551234')).toBe(false);
    });

    it('should not throw for non-existent phone', async () => {
      const { linker } = createLinker();
      await expect(linker.cancelLinking('+14155559999')).resolves.not.toThrow();
    });
  });

  describe('hasPendingLink', () => {
    it('should return false when no link exists', async () => {
      const { linker } = createLinker();
      expect(await linker.hasPendingLink('+14155551234')).toBe(false);
    });

    it('should return true when link exists', async () => {
      const { linker } = createLinker();
      await linker.initiateLinking('+14155551234', 'user_1');
      expect(await linker.hasPendingLink('+14155551234')).toBe(true);
    });
  });
});
