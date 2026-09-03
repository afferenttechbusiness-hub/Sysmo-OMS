import { useTenantAuth } from './tenant-auth';
import type { Profile } from './types';

// Compatibility wrapper: the old useAuth() API now delegates to TenantAuthProvider.
// This lets all existing OMS pages work without code changes — they get the
// tenant-scoped profile from the local session.
export function useAuth() {
  const ctx = useTenantAuth();
  return {
    profile: ctx.profile,
    loading: ctx.loading,
    login: async () => ({ error: 'Use tenant login page' }),
    logout: ctx.logout,
    refreshProfile: ctx.refreshProfile,
    updateProfile: ctx.updateProfile,
  };
}

export { TenantAuthProvider as AuthProvider } from './tenant-auth';
export type { Profile };
