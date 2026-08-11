import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ToastProvider } from '@/lib/toast';
import { LoginPage } from '@/pages/LoginPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!profile) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (profile) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!profile || profile.role !== 'admin') return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
