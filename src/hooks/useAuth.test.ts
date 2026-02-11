import { describe, expect, it, vi } from 'vitest';
import { resolveAuthState } from './useAuth';

function createPocketBaseMock() {
  const authStore = {
    isValid: false,
    record: null as unknown,
    save: vi.fn((token: string, record?: unknown) => {
      authStore.isValid = Boolean(token);
      authStore.record = record ?? null;
    }),
    clear: vi.fn(() => {
      authStore.isValid = false;
      authStore.record = null;
    }),
  };

  return { authStore };
}

describe('resolveAuthState', () => {
  it('hydrates user + PocketBase auth from whoami pbToken', async () => {
    const pbMock = createPocketBaseMock();
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        uid: 'uid-1',
        pbToken: 'user-token',
        pbAuthExpiresAt: '2026-02-11T00:00:00Z',
      }),
    });

    const result = await resolveAuthState({
      whoamiUrl: '/whoami',
      enableAdminLogin: false,
      fetchImpl,
      pocketbase: pbMock,
    });

    expect(fetchImpl).toHaveBeenCalledWith('/whoami', { credentials: 'include' });
    expect(pbMock.authStore.save).toHaveBeenCalledWith(
      'user-token',
      expect.objectContaining({
        email: 'admin@example.com',
        role: 'admin',
      })
    );
    expect(result.user?.email).toBe('admin@example.com');
    expect(result.isAdmin).toBe(true);
  });

  it('clears auth and returns unauthenticated when whoami has no pbToken', async () => {
    const pbMock = createPocketBaseMock();
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'user-2',
        email: 'user@example.com',
        role: 'user',
      }),
    });

    const result = await resolveAuthState({
      whoamiUrl: '/whoami',
      enableAdminLogin: false,
      fetchImpl,
      pocketbase: pbMock,
    });

    expect(pbMock.authStore.clear).toHaveBeenCalled();
    expect(result.user).toBeNull();
    expect(result.isAdmin).toBe(false);
  });

  it('clears auth and returns unauthenticated on whoami 401', async () => {
    const pbMock = createPocketBaseMock();
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    const result = await resolveAuthState({
      whoamiUrl: '/whoami',
      enableAdminLogin: false,
      fetchImpl,
      pocketbase: pbMock,
    });

    expect(pbMock.authStore.clear).toHaveBeenCalled();
    expect(result.user).toBeNull();
    expect(result.isAdmin).toBe(false);
  });
});
