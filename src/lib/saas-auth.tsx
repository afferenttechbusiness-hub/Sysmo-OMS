import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { SaaSUser, SaaSSubscription, Tenant, TenantMember } from './types';

interface SaaSAuthContextValue {
  user: SaaSUser | null;
  session: import('@supabase/supabase-js').Session | null;
  loading: boolean;
  subscriptions: SaaSSubscription[];
  tenants: Tenant[];
  memberships: TenantMember[];
  signUp: (email: string, password: string, fullName: string, companyName?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const SaaSAuthContext = createContext<SaaSAuthContextValue | undefined>(undefined);

export function SaaSAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SaaSUser | null>(null);
  const [session, setSession] = useState<import('@supabase/supabase-js').Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<SaaSSubscription[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [memberships, setMemberships] = useState<TenantMember[]>([]);

  const loadData = useCallback(async (userId: string) => {
    const [userRes, subRes, memberRes, tenantRes] = await Promise.all([
      supabase.from('saas_users').select('*').eq('id', userId).maybeSingle(),
      supabase.from('saas_subscriptions').select('*, plan:saas_plans(*)').eq('saas_user_id', userId).order('created_at', { ascending: false }),
      supabase.from('tenant_members').select('*, tenant:tenants(*)').eq('saas_user_id', userId),
      supabase.from('tenants').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
    ]);

    const saasUser = userRes.data as SaaSUser | null;
    setUser(saasUser);
    setSubscriptions((subRes.data as SaaSSubscription[]) || []);
    const members = (memberRes.data as (TenantMember & { tenant: Tenant })[]) || [];
    setMemberships(members);
    const memberTenants = members.map((m) => m.tenant).filter(Boolean) as Tenant[];
    const ownerTenants = (tenantRes.data as Tenant[]) || [];
    // Merge and deduplicate by id
    const tenantMap = new Map<string, Tenant>();
    [...memberTenants, ...ownerTenants].forEach((t) => tenantMap.set(t.id, t));
    setTenants(Array.from(tenantMap.values()));
  }, []);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, sess) => {
      (async () => {
        if (sess?.user) {
          await loadData(sess.user.id);
        } else {
          setUser(null);
          setSubscriptions([]);
          setTenants([]);
          setMemberships([]);
        }
        setLoading(false);
      })();
    });
  }, [loadData]);

  const signUp = useCallback(async (email: string, password: string, fullName: string, companyName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, company_name: companyName } },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSubscriptions([]);
    setTenants([]);
    setMemberships([]);
  }, []);

  const refreshData = useCallback(async () => {
    const { data: { session: sess } } = await supabase.auth.getSession();
    if (sess?.user) await loadData(sess.user.id);
  }, [loadData]);

  return (
    <SaaSAuthContext.Provider value={{ user, session, loading, subscriptions, tenants, memberships, signUp, signIn, signOut, refreshData }}>
      {children}
    </SaaSAuthContext.Provider>
  );
}

export function useSaaSAuth() {
  const ctx = useContext(SaaSAuthContext);
  if (!ctx) throw new Error('useSaaSAuth must be used within SaaSAuthProvider');
  return ctx;
}
