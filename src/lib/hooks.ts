import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';
import type { Project, Task, Notice, Schedule, Profile, Department, TeamGroup, Wallet, Transaction } from './types';

export function useDashboardData() {
  const { profile } = useAuth();
  const tenantId = (profile as Profile & { tenant_id?: string })?.tenant_id;
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const tq = tenantId ? supabase.from('projects').select('*').eq('tenant_id', tenantId) : supabase.from('projects').select('*');
    const [projRes, taskRes, noticeRes, schedRes] = await Promise.all([
      tq.order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('assigned_to', profile.id).order('created_at', { ascending: false }),
      supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('schedules').select('*').gte('start_time', new Date().toISOString()).order('start_time', { ascending: true }).limit(10),
    ]);
    setProjects(projRes.data as Project[] || []);
    setTasks(taskRes.data as Task[] || []);
    setNotices(noticeRes.data as Notice[] || []);
    setSchedules(schedRes.data as Schedule[] || []);
    setLoading(false);
  }, [profile, tenantId]);

  useEffect(() => { load(); }, [load]);
  return { projects, tasks, notices, schedules, loading, reload: load };
}

export function useProfiles() {
  const { profile } = useAuth();
  const tenantId = (profile as Profile & { tenant_id?: string })?.tenant_id;
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = supabase.from('profiles').select('*');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('full_name', { ascending: true });
    setProfiles((data as Profile[]) || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);
  return { profiles, loading, reload: load };
}

export function useDepartments() {
  const { profile } = useAuth();
  const tenantId = (profile as Profile & { tenant_id?: string })?.tenant_id;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = supabase.from('departments').select('*');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('name', { ascending: true });
    setDepartments((data as Department[]) || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);
  return { departments, loading, reload: load };
}

export function useProjects() {
  const { profile } = useAuth();
  const tenantId = (profile as Profile & { tenant_id?: string })?.tenant_id;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = supabase.from('projects').select('*');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('created_at', { ascending: false });
    setProjects((data as Project[]) || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);
  return { projects, loading, reload: load };
}

export function useTasks() {
  const { profile } = useAuth();
  const tenantId = (profile as Profile & { tenant_id?: string })?.tenant_id;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = supabase.from('tasks').select('*, project:projects(*)');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('created_at', { ascending: false });
    setTasks((data as (Task & { project: Project })[]) || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);
  return { tasks, loading, reload: load };
}

export function useTeams() {
  const { profile } = useAuth();
  const tenantId = (profile as Profile & { tenant_id?: string })?.tenant_id;
  const [teams, setTeams] = useState<TeamGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = supabase.from('team_groups').select('*, project:projects(*)');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('created_at', { ascending: false });
    setTeams((data as (TeamGroup & { project: Project })[]) || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);
  return { teams, loading, reload: load };
}

export function useWallet() {
  const { profile } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', profile.id).maybeSingle();
    setWallet(walletData as Wallet | null);
    const { data: txnData } = await supabase.from('transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
    setTransactions((txnData as Transaction[]) || []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);
  return { wallet, transactions, loading, reload: load };
}

export function useNotices() {
  const { profile } = useAuth();
  const tenantId = (profile as Profile & { tenant_id?: string })?.tenant_id;
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = supabase.from('notices').select('*, author:profiles(*)');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('created_at', { ascending: false });
    setNotices((data as (Notice & { author: Profile })[]) || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);
  return { notices, loading, reload: load };
}

export interface SiteBranding {
  name: string;
  subtitle: string;
  logoUrl: string | null;
}

const DEFAULT_BRANDING: SiteBranding = { name: 'Sysmobyte', subtitle: 'OMS Platform', logoUrl: null };

export function useSiteBranding() {
  const [branding, setBranding] = useState<SiteBranding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('site_settings').select('*').in('key', ['logo', 'branding']);
    let logoUrl: string | null = null;
    let name = 'Sysmobyte';
    let subtitle = 'OMS Platform';
    for (const row of (data || [])) {
      if (row.key === 'logo' && row.value?.url) logoUrl = row.value.url;
      if (row.key === 'branding') {
        if (row.value?.name) name = row.value.name;
        if (row.value?.subtitle) subtitle = row.value.subtitle;
      }
    }
    setBranding({ name, subtitle, logoUrl });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  return { branding, loading, reload: load };
}

export function useSchedules() {
  const { profile } = useAuth();
  const tenantId = (profile as Profile & { tenant_id?: string })?.tenant_id;
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    let q = supabase.from('schedules').select('*');
    if (tenantId) q = q.eq('tenant_id', tenantId);
    const { data } = await q.order('start_time', { ascending: true });
    setSchedules((data as Schedule[]) || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);
  return { schedules, loading, reload: load };
}
