import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { queryClient } from './lib/queryClient'
import { useThemeStore, applyTheme } from './lib/themeStore'
import PassphraseGate from './features/auth/PassphraseGate'
import Layout from './components/Layout'
import TodayScreen from './features/medications/TodayScreen'
import MoodCheckIn from './features/mood/MoodCheckIn'
import CalendarScreen from './features/calendar/CalendarScreen'
import ProfileScreen from './features/profile/ProfileScreen'

function ThemeInitializer() {
  const { mode, accent } = useThemeStore()
  useEffect(() => {
    applyTheme(mode, accent)
  }, [mode, accent])
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
              <Route path="mood" element={<MoodCheckIn />} />
              <Route path="calendar" element={<CalendarScreen />} />
              <Route path="profile" element={<ProfileScreen />} />
            </Route>
          </Routes>
        </PassphraseGate>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
