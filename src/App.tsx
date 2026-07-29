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

function ThemeInitializer() {
  const { mode, accent, accent2 } = useThemeStore()
  useEffect(() => {
    applyTheme(mode, accent, accent2)
  }, [mode, accent, accent2])
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      <BrowserRouter>
        <PassphraseGate>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<TodayScreen />} />
              <Route path="medications" element={<MedicationsScreen />} />
              <Route path="mood" element={<MoodCheckIn />} />
              <Route path="calendar" element={<CalendarScreen />} />
              <Route path="achievements" element={<AchievementsScreen />} />
              <Route path="measurements" element={<MeasurementsScreen />} />
              <Route path="profile" element={<ProfileScreen />} />
            </Route>
          </Routes>
        </PassphraseGate>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
