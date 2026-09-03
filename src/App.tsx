import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SaaSAuthProvider } from '@/lib/saas-auth';
import { AuthProvider as TenantAuthProvider, useAuth } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { TasksPage } from '@/pages/TasksPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { TeamPage } from '@/pages/TeamPage';
import { DepartmentPage } from '@/pages/DepartmentPage';
import { SchedulePage } from '@/pages/SchedulePage';
import { NoticePage } from '@/pages/NoticePage';
import { MessengerPage } from '@/pages/MessengerPage';
import { TransactionPage } from '@/pages/TransactionPage';
import { ApplicationPage } from '@/pages/ApplicationPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminPage } from '@/pages/AdminPage';
import { TenantLoginPage } from '@/pages/TenantLoginPage';
import { SaaSLanding } from '@/pages/saas/SaaSLanding';
import { SaaSSignIn } from '@/pages/saas/SaaSSignIn';
import { SaaSSignUp } from '@/pages/saas/SaaSSignUp';
import { SaaSDashboard } from '@/pages/saas/SaaSDashboard';
import { SaaSSubscribe } from '@/pages/saas/SaaSSubscribe';
import { SaaSAdmin } from '@/pages/saas/SaaSAdmin';

function TenantProtectedRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!profile) return <Navigate to=".." replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!profile || profile.role !== 'admin') return <Navigate to="dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <SaaSAuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* SaaS platform routes */}
            <Route path="/saas" element={<SaaSLanding />} />
            <Route path="/saas/signin" element={<SaaSSignIn />} />
            <Route path="/saas/signup" element={<SaaSSignUp />} />
            <Route path="/saas/dashboard" element={<SaaSDashboard />} />
            <Route path="/saas/subscribe/:planId" element={<SaaSSubscribe />} />
            <Route path="/saas/admin" element={<SaaSAdmin />} />

            {/* Tenant-scoped OMS routes */}
            <Route path="/t/:slug" element={<TenantLoginPage />} />
            <Route path="/t/:slug/app" element={<TenantAuthProvider><TenantProtectedRoute><AppLayout /></TenantProtectedRoute></TenantAuthProvider>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="department" element={<DepartmentPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="notice" element={<NoticePage />} />
              <Route path="messenger" element={<MessengerPage />} />
              <Route path="transaction" element={<TransactionPage />} />
              <Route path="application" element={<ApplicationPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="profile/:id" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
            </Route>

            {/* Legacy fallback */}
            <Route path="/" element={<Navigate to="/saas" replace />} />
            <Route path="*" element={<Navigate to="/saas" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </SaaSAuthProvider>
  );
}
