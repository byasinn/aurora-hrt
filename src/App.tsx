import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { queryClient } from './lib/queryClient'
import { useThemeStore, applyTheme } from './lib/themeStore'
import AuthGate from './features/auth/AuthGate'
import Layout from './components/Layout'
import TodayScreen from './features/medications/TodayScreen'
import MoodCheckIn from './features/mood/MoodCheckIn'
import CalendarScreen from './features/calendar/CalendarScreen'
import ProfileScreen from './features/profile/ProfileScreen'
import PublicProfileScreen from './features/profile/PublicProfileScreen'
import MessagesScreen from './features/messages/MessagesScreen'
import RoutinesScreen from './features/routines/RoutinesScreen'
import AchievementsScreen from './features/achievements/AchievementsScreen'
import MeasurementsScreen from './features/measurements/MeasurementsScreen'
import LabsScreen from './features/labs/LabsScreen'
import TipsScreen from './features/tips/TipsScreen'
import FeedScreen from './features/feed/FeedScreen'
import SettingsScreen from './features/settings/SettingsScreen'
import OnboardingScreen from './features/onboarding/OnboardingScreen'
import GradientBlobs from './components/GradientBlobs'
import { useProfile } from './api/profile'

function ThemeInitializer() {
  const { mode, accent, accent2 } = useThemeStore()
  useEffect(() => {
    applyTheme(mode, accent, accent2)
  }, [mode, accent, accent2])
  return null
}

function RootGate() {
  const { data: profile, isLoading, refetch } = useProfile()

  if (isLoading || !profile) return null

  if (!profile.onboardingCompleted) {
    return <OnboardingScreen onComplete={() => refetch()} />
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TodayScreen />} />
        <Route path="mood" element={<MoodCheckIn />} />
        <Route path="calendar" element={<CalendarScreen />} />
        <Route path="achievements" element={<AchievementsScreen />} />
        <Route path="measurements" element={<MeasurementsScreen />} />
        <Route path="labs" element={<LabsScreen />} />
        <Route path="tips" element={<TipsScreen />} />
        <Route path="feed" element={<FeedScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
        <Route path="perfil" element={<PublicProfileScreen />} />
        <Route path="messages" element={<MessagesScreen />} />
        <Route path="routines" element={<RoutinesScreen />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      <GradientBlobs />
      <BrowserRouter>
        <AuthGate>
          <RootGate />
        </AuthGate>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
