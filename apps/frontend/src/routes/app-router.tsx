import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { DashboardLayout } from '@/layouts/dashboard-layout';
import { GuestRoute } from '@/modules/auth/components/guest-route';
import { ProtectedRoute } from '@/modules/auth/components/protected-route';
import { SignInPage } from '@/modules/auth/pages/sign-in-page';
import { SignUpPage } from '@/modules/auth/pages/sign-up-page';
import { DashboardDraftsPage } from '@/pages/dashboard/drafts-page';
import { DashboardOverviewPage } from '@/pages/dashboard/overview-page';
import { DashboardSchedulesPage } from '@/pages/dashboard/schedules-page';
import { DashboardHolidaysPage } from '@/pages/dashboard/holidays-page';
import { DashboardShiftsPage } from '@/pages/dashboard/shifts-page';
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
            <Route path="schedules" element={<DashboardSchedulesPage />} />
            <Route path="workers" element={<DashboardWorkersPage />} />
            <Route path="holidays" element={<DashboardHolidaysPage />} />
            <Route path="shifts" element={<DashboardShiftsPage />} />
            <Route path="settings" element={<DashboardSettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
