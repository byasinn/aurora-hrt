import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { queryClient } from './lib/queryClient'
import { useThemeStore, applyTheme } from './lib/themeStore'
import AuthGate from './features/auth/AuthGate'
import Layout from './components/Layout'
import TodayScreen from './features/medications/TodayScreen'
import MedicationsScreen from './features/medications/MedicationsScreen'
import SaudeScreen from './features/health/SaudeScreen'
import CommunityScreen from './features/community/CommunityScreen'
import TopicPageScreen from './features/explore/TopicPageScreen'
import CommunityMembersScreen from './features/community/CommunityMembersScreen'
import CommunitiesScreen from './features/community/CommunitiesScreen'
import MoodCheckIn from './features/mood/MoodCheckIn'
import CalendarScreen from './features/calendar/CalendarScreen'
import DayLogScreen from './features/calendar/DayLogScreen'
import ProfileScreen from './features/profile/ProfileScreen'
import PublicProfileScreen from './features/profile/PublicProfileScreen'
import MaisInformacoesScreen from './features/profile/MaisInformacoesScreen'
import OQueTomoScreen from './features/profile/OQueTomoScreen'
import ExternalLinksScreen from './features/profile/ExternalLinksScreen'
import UserProfileScreen from './features/profile/UserProfileScreen'
import ConnectionsScreen from './features/profile/ConnectionsScreen'
import InboxScreen from './features/inbox/InboxScreen'
import ConversationScreen from './features/dm/ConversationScreen'
import RoutinesScreen from './features/routines/RoutinesScreen'
import WorkoutsScreen from './features/workouts/WorkoutsScreen'
import WorkoutDayScreen from './features/workouts/WorkoutDayScreen'
import WorkoutHistoryScreen from './features/workouts/WorkoutHistoryScreen'
import PointsScreen from './features/points/PointsScreen'
import BrilhoScreen from './features/points/BrilhoScreen'
import ColecaoScreen from './features/points/ColecaoScreen'
import MeasurementsScreen from './features/measurements/MeasurementsScreen'
import LabsScreen from './features/labs/LabsScreen'
import TipsScreen from './features/tips/TipsScreen'
import FeedScreen from './features/feed/FeedScreen'
import SettingsScreen from './features/settings/SettingsScreen'
import AccountSettingsScreen from './features/settings/AccountSettingsScreen'
import ProfileSettingsScreen from './features/settings/ProfileSettingsScreen'
import PrivacySettingsScreen from './features/settings/PrivacySettingsScreen'
import NotificationsSettingsScreen from './features/settings/NotificationsSettingsScreen'
import SecuritySettingsScreen from './features/settings/SecuritySettingsScreen'
import AppearanceSettingsScreen from './features/settings/AppearanceSettingsScreen'
import LanguageSettingsScreen from './features/settings/LanguageSettingsScreen'
import DataLegalScreen from './features/settings/DataLegalScreen'
import AdminSettingsScreen from './features/settings/AdminSettingsScreen'
import AdminModerationScreen from './features/settings/AdminModerationScreen'
import AdminAnnouncementsScreen from './features/settings/AdminAnnouncementsScreen'
import AdminTopicsScreen from './features/settings/AdminTopicsScreen'
import AboutScreen from './features/settings/AboutScreen'
import BlockedUsersScreen from './features/settings/BlockedUsersScreen'
import InstallGuideScreen from './features/settings/InstallGuideScreen'
import OnboardingScreen from './features/onboarding/OnboardingScreen'
import GradientBlobs from './components/GradientBlobs'
import ToastContainer from './components/ToastContainer'
import LoadingScreen from './components/LoadingScreen'
import { useProfile } from './api/profile'

function ThemeInitializer() {
  const { mode, accent, accent2, accent3 } = useThemeStore()
  useEffect(() => {
    applyTheme(mode, accent, accent2, accent3)
  }, [mode, accent, accent2, accent3])
  return null
}

function RootGate() {
  const { data: profile, isLoading, refetch } = useProfile()

  if (isLoading || !profile) return <LoadingScreen />

  if (!profile.onboardingCompleted) {
    return <OnboardingScreen onComplete={() => refetch()} />
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TodayScreen />} />
        <Route path="medications" element={<MedicationsScreen />} />
        <Route path="saude" element={<SaudeScreen />} />
        <Route path="comunidades" element={<CommunitiesScreen />} />
        <Route path="comunidade/:id" element={<CommunityScreen />} />
        <Route path="topico/:slug" element={<TopicPageScreen />} />
        <Route path="comunidade/:id/membros" element={<CommunityMembersScreen />} />
        <Route path="mood" element={<MoodCheckIn />} />
        <Route path="calendar" element={<CalendarScreen />} />
        <Route path="dia" element={<DayLogScreen />} />
        <Route path="pontos" element={<PointsScreen />} />
        <Route path="pontos/brilho" element={<BrilhoScreen />} />
        <Route path="pontos/colecao" element={<ColecaoScreen />} />
        <Route path="measurements" element={<MeasurementsScreen />} />
        <Route path="labs" element={<LabsScreen />} />
        <Route path="tips" element={<TipsScreen />} />
        <Route path="feed" element={<FeedScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="settings/conta" element={<AccountSettingsScreen />} />
        <Route path="settings/perfil" element={<ProfileSettingsScreen />} />
        <Route path="settings/privacidade" element={<PrivacySettingsScreen />} />
        <Route path="settings/notificacoes" element={<NotificationsSettingsScreen />} />
        <Route path="settings/seguranca" element={<SecuritySettingsScreen />} />
        <Route path="settings/aparencia" element={<AppearanceSettingsScreen />} />
        <Route path="settings/idioma" element={<LanguageSettingsScreen />} />
        <Route path="settings/dados" element={<DataLegalScreen />} />
        <Route path="settings/admin" element={<AdminSettingsScreen />} />
        <Route path="settings/admin/moderacao" element={<AdminModerationScreen />} />
        <Route path="settings/admin/avisos" element={<AdminAnnouncementsScreen />} />
        <Route path="settings/admin/topicos" element={<AdminTopicsScreen />} />
        <Route path="settings/sobre" element={<AboutScreen />} />
        <Route path="settings/bloqueios" element={<BlockedUsersScreen />} />
        <Route path="settings/instalar" element={<InstallGuideScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
        <Route path="perfil" element={<PublicProfileScreen />} />
        <Route path="perfil/mais-informacoes" element={<MaisInformacoesScreen />} />
        <Route path="perfil/mais-informacoes/o-que-tomo" element={<OQueTomoScreen />} />
        <Route path="perfil/mais-informacoes/links" element={<ExternalLinksScreen />} />
        <Route path="u/:username" element={<UserProfileScreen />} />
        <Route path="conexoes/:userId/:type" element={<ConnectionsScreen />} />
        <Route path="inbox" element={<InboxScreen />} />
        <Route path="conversas/:userId" element={<ConversationScreen />} />
        <Route path="routines" element={<RoutinesScreen />} />
        <Route path="treinos" element={<WorkoutsScreen />} />
        <Route path="treinos/historico" element={<WorkoutHistoryScreen />} />
        <Route path="treinos/dia/:id" element={<WorkoutDayScreen />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      <GradientBlobs />
      <ToastContainer />
      <BrowserRouter>
        <AuthGate>
          <RootGate />
        </AuthGate>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
