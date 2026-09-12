'use client';

import { useCallback, useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'author' | 'user';
  locale: string;
  createdAt: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const json = (await res.json()) as { ok: boolean; data?: { user: AuthUser } };
      setUser(json.ok && json.data ? json.data.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial session load
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }, []);

  return { user, loading, refresh, logout, isAdmin: user?.role === 'admin' };
}
