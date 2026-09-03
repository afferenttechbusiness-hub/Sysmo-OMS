import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { Profile, UserRole } from './types';

const TENANT_SESSION_KEY = 'sysmobyte_tenant_session';

interface TenantAuthContextValue {
  profile: Profile | null;
  tenantId: string | null;
  tenantSlug: string | null;
  loading: boolean;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const TenantAuthContext = createContext<TenantAuthContextValue | undefined>(undefined);

interface TenantSession extends Profile {
  tenant_slug: string;
  tenant_id: string;
}

export function TenantAuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TENANT_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TenantSession;
        setProfile(parsed);
        setTenantId(parsed.tenant_id);
        setTenantSlug(parsed.tenant_slug);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    setProfile(null);
    setTenantId(null);
    setTenantSlug(null);
    localStorage.removeItem(TENANT_SESSION_KEY);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).maybeSingle();
    if (data) {
      const session: TenantSession = { ...(data as Profile), tenant_id: tenantId!, tenant_slug: tenantSlug! };
      setProfile(data as Profile);
      localStorage.setItem(TENANT_SESSION_KEY, JSON.stringify(session));
    }
  }, [profile, tenantId, tenantSlug]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!profile?.id) return;
    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
    if (!error) {
      const updated = { ...profile, ...updates };
      setProfile(updated);
      const session: TenantSession = { ...updated, tenant_id: tenantId!, tenant_slug: tenantSlug! };
      localStorage.setItem(TENANT_SESSION_KEY, JSON.stringify(session));
    }
  }, [profile, tenantId, tenantSlug]);

  return (
    <TenantAuthContext.Provider value={{ profile, tenantId, tenantSlug, loading, logout, refreshProfile, updateProfile }}>
      {children}
    </TenantAuthContext.Provider>
  );
}

export function useTenantAuth() {
  const ctx = useContext(TenantAuthContext);
  if (!ctx) throw new Error('useTenantAuth must be used within TenantAuthProvider');
  return ctx;
}
