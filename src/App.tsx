import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { queryClient } from './lib/queryClient'
import { useThemeStore, applyTheme } from './lib/themeStore'
import PassphraseGate from './features/auth/PassphraseGate'
import Layout from './components/Layout'
import TodayScreen from './features/medications/TodayScreen'
import MedicationsScreen from './features/medications/MedicationsScreen'
import MoodCheckIn from './features/mood/MoodCheckIn'
import CalendarScreen from './features/calendar/CalendarScreen'
import ProfileScreen from './features/profile/ProfileScreen'
import AchievementsScreen from './features/achievements/AchievementsScreen'
import MeasurementsScreen from './features/measurements/MeasurementsScreen'
import LabsScreen from './features/labs/LabsScreen'
import OnboardingScreen from './features/onboarding/OnboardingScreen'
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
        <Route path="medications" element={<MedicationsScreen />} />
        <Route path="mood" element={<MoodCheckIn />} />
        <Route path="calendar" element={<CalendarScreen />} />
        <Route path="achievements" element={<AchievementsScreen />} />
        <Route path="measurements" element={<MeasurementsScreen />} />
        <Route path="labs" element={<LabsScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      <BrowserRouter>
        <PassphraseGate>
          <RootGate />
        </PassphraseGate>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
