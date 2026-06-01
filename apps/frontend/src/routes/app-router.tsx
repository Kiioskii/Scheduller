import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { DashboardLayout } from '@/layouts/dashboard-layout';
import { GuestRoute } from '@/modules/auth/components/guest-route';
import { ProtectedRoute } from '@/modules/auth/components/protected-route';
import { SignInPage } from '@/modules/auth/pages/sign-in-page';
import { SignUpPage } from '@/modules/auth/pages/sign-up-page';
import { DashboardOverviewPage } from '@/pages/dashboard/overview-page';
import { DashboardDraftsPage } from '@/pages/dashboard/drafts-page';
import { DashboardSettingsPage } from '@/pages/dashboard/settings-page';
import { DashboardWorkersPage } from '@/pages/dashboard/workers-page';
import { LandingPage } from '@/pages/landing-page';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<GuestRoute />}>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverviewPage />} />
            <Route path="drafts" element={<DashboardDraftsPage />} />
            <Route path="schedules" element={<Navigate to="/dashboard/drafts" replace />} />
            <Route path="workers" element={<DashboardWorkersPage />} />
            <Route path="settings" element={<DashboardSettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
