import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { pb } from '@/integrations/pocketbase/client';

interface AuthContextType {
  user: any;
  session: any;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Listen to auth state changes (fire immediately)
    const unsubscribe = pb.authStore.onChange((token, model) => {
      if (pb.authStore.isValid && model) {
        setUser(model);
        setSession(pb.authStore);
        setIsAdmin(model?.role === 'admin');
      } else {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    }, true);

    return unsubscribe;
  }, []);

  const signOut = async () => {
    pb.authStore.clear();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, signOut }}>
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
