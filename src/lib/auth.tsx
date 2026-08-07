import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from './supabase';
import type { Profile, UserRole, Department } from './types';

const ADMIN_EMAIL = 'ahmedforkan26@gmail.com';
const ADMIN_PASSWORD = '01641526137@#$';

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  login: (email: string, departmentId: string, password?: string) => Promise<{ error: string | null }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'sysmobyte_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Profile;
        setProfile(parsed);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, departmentId: string, password?: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if admin email
    if (normalizedEmail === ADMIN_EMAIL) {
      if (password !== ADMIN_PASSWORD) {
        return { error: 'Incorrect admin password' };
      }
    }

    // Look up existing profile by email
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    let userProfile: Profile;

    if (existing) {
      // Update department if changed
      if (departmentId && existing.department_id !== departmentId) {
        await supabase.from('profiles').update({ department_id: departmentId }).eq('id', existing.id);
        existing.department_id = departmentId;
      }
      userProfile = existing as Profile;
    } else {
      // Create new profile
      const isAdmin = normalizedEmail === ADMIN_EMAIL;
      const fullName = normalizedEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const newProfile: Partial<Profile> = {
        email: normalizedEmail,
        full_name: fullName,
        role: isAdmin ? 'admin' : 'employee' as UserRole,
        department_id: departmentId || null,
      };
      const { data: created, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select('*')
        .single();
      if (error) return { error: error.message };
      userProfile = created as Profile;
    }

    setProfile(userProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
    return { error: null };
  }, []);

  const logout = useCallback(() => {
    setProfile(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', profile.id).maybeSingle();
    if (data) {
      setProfile(data as Profile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [profile]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!profile?.id) return;
    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id);
    if (!error) {
      const updated = { ...profile, ...updates };
      setProfile(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }, [profile]);

  return (
    <AuthContext.Provider value={{ profile, loading, login, logout, refreshProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { ADMIN_EMAIL };
export type { Department };
