import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { pb } from '@/integrations/pocketbase/client';

export interface SsoUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  roles?: string[];
  uid?: string;
}

export interface WhoamiResponse extends SsoUser {
  pbToken?: string;
  pbAuthExpiresAt?: string;
}

interface AuthContextType {
  user: SsoUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  signOut: async () => {},
});

interface PocketBaseLike {
  authStore: {
    isValid: boolean;
    record: unknown;
    save: (token: string, record?: unknown) => void;
    clear: () => void;
  };
}

function buildAuthRecordFromWhoami(data: WhoamiResponse) {
  return {
    id: data.id || '',
    email: data.email || '',
    name: data.name || data.email || '',
    role: data.role || 'user',
    uid: data.uid || '',
    collectionName: 'users',
    collectionId: '_pb_users_auth_',
  };
}

export async function resolveAuthState(params: {
  whoamiUrl: string;
  enableAdminLogin: boolean;
  fetchImpl?: typeof fetch;
  pocketbase?: PocketBaseLike;
}): Promise<{ user: SsoUser | null; isAdmin: boolean }> {
  const fetchImpl = params.fetchImpl || fetch;
  const pocketbase = params.pocketbase || (pb as unknown as PocketBaseLike);

  if (params.enableAdminLogin && pocketbase.authStore.isValid && pocketbase.authStore.record) {
    const record = pocketbase.authStore.record as any;
    const roles = record?.role ? [record.role] : [];
    return {
      user: {
        id: record.id,
        email: record.email,
        name: record.name,
        role: record.role,
        roles,
      },
      isAdmin: roles.includes('admin'),
    };
  }

  try {
    const response = await fetchImpl(params.whoamiUrl, { credentials: 'include' });
    if (!response.ok) {
      pocketbase.authStore.clear();
      return { user: null, isAdmin: false };
    }

    const data = (await response.json()) as WhoamiResponse;
    if (!data.pbToken) {
      console.warn('Missing pbToken in /whoami response; user will remain unauthenticated.');
      pocketbase.authStore.clear();
      return { user: null, isAdmin: false };
    }

    pocketbase.authStore.save(data.pbToken, buildAuthRecordFromWhoami(data));
    const roles = data.roles || (data.role ? [data.role] : []);
    return {
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        roles,
        uid: data.uid,
      },
      isAdmin: roles.includes('admin'),
    };
  } catch (error) {
    console.error('Failed to resolve auth state from /whoami:', error);
    pocketbase.authStore.clear();
    return { user: null, isAdmin: false };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SsoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isActive = true;
    const whoamiUrl = import.meta.env.VITE_WHOAMI_URL || '/whoami';
    const enableAdminLogin = import.meta.env.VITE_ENABLE_ADMIN_LOGIN === 'true';

    const loadUser = async () => {
      try {
        if (!isActive) return;
        const resolved = await resolveAuthState({ whoamiUrl, enableAdminLogin });
        if (!isActive) return;
        setUser(resolved.user);
        setIsAdmin(resolved.isAdmin);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadUser();

    return () => {
      isActive = false;
    };
  }, []);

  const signOut = async () => {
    // Clear PocketBase auth on sign-out (set during provisioning or admin login)
    if (pb.authStore.isValid) {
      pb.authStore.clear();
    }
    const logoutBase = import.meta.env.VITE_SSO_LOGOUT_URL || '/mellon/logout';
    window.location.href = `${logoutBase}?ReturnTo=${encodeURIComponent(window.location.origin + '/')}`;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
