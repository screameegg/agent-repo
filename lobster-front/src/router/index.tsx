import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AuthGuard from './AuthGuard';

import Landing from '../pages/Landing';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/agent/Dashboard';
import AgentDetail from '../pages/agent/Detail';
import SkillMarket from '../pages/skill/Market';
import SkillDetail from '../pages/skill/Detail';
import ImportExport from '../pages/transfer/ImportExport';
import Profile from '../pages/user/Profile';
import PublishedSkills from '../pages/user/Profile/PublishedSkills';
import InstalledSkills from '../pages/user/Profile/InstalledSkills';
import Tokens from '../pages/user/Profile/Tokens';
import NotificationCenter from '../pages/notifications';
import AdminAnnouncements from '../pages/admin/Announcements';
import AdminFeedbackManagement from '../pages/admin/FeedbackManagement';
import AdminSkillManagement from '../pages/admin/SkillManagement';
import AdminUserManagement from '../pages/admin/UserManagement';

import SkillEditor from '../pages/skill/Editor';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/app/profile/skill-editor/:id',
    element: (
      <AuthGuard>
        <SkillEditor />
      </AuthGuard>
    ),
  },
  {
    path: '/app',
    element: (
      <AuthGuard>
        <Layout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'agent/:id',
        element: <AgentDetail />,
      },
      {
        path: 'market',
        element: <SkillMarket />,
      },
      {
        path: 'market/:id',
        element: <SkillDetail />,
      },
      {
        path: 'transfer',
        element: <ImportExport />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'profile/published-skills',
        element: <PublishedSkills />,
      },
      {
        path: 'profile/installed-skills',
        element: <InstalledSkills />,
      },
      {
        path: 'profile/tokens',
        element: <Tokens />,
      },
      {
        path: 'notifications',
        element: <NotificationCenter />,
      },
      {
        path: 'admin',
        element: <Navigate to="/app/admin/skills" replace />,
      },
      {
        path: 'admin/users',
        element: (
          <AuthGuard requiredRole="admin">
            <AdminUserManagement />
          </AuthGuard>
        ),
      },
      {
        path: 'admin/skills',
        element: (
          <AuthGuard requiredRole="admin">
            <AdminSkillManagement />
          </AuthGuard>
        ),
      },
      {
        path: 'admin/feedback',
        element: (
          <AuthGuard requiredRole="admin">
            <AdminFeedbackManagement />
          </AuthGuard>
        ),
      },
      {
        path: 'admin/announcements',
        element: (
          <AuthGuard requiredRole="admin">
            <AdminAnnouncements />
          </AuthGuard>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
