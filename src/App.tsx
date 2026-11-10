import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { queryClient } from './lib/queryClient'
import { useThemeStore, applyTheme } from './lib/themeStore'
import AuthGate from './features/auth/AuthGate'
import Layout from './components/Layout'
import TodayScreen from './features/medications/TodayScreen'
import MedicationsScreen from './features/medications/MedicationsScreen'
import SaudeScreen from './features/health/SaudeScreen'
import TopicPageScreen from './features/explore/TopicPageScreen'
import ForumScreen from './features/forum/ForumScreen'
import NewTopicScreen from './features/forum/NewTopicScreen'
import TopicScreen from './features/forum/TopicScreen'
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
import ShopScreen from './features/shop/ShopScreen'
import ShopDepartmentScreen from './features/shop/ShopDepartmentScreen'
import MyItemsScreen from './features/shop/MyItemsScreen'
import AuroraHubScreen from './features/hub/AuroraHubScreen'
import FeedScreen from './features/feed/FeedScreen'
import SettingsScreen from './features/settings/SettingsScreen'
import AccountSettingsScreen from './features/settings/AccountSettingsScreen'
import ProfileSettingsScreen from './features/settings/ProfileSettingsScreen'
import PreferencesSettingsScreen from './features/settings/PreferencesSettingsScreen'
import PrivacySettingsScreen from './features/settings/PrivacySettingsScreen'
import NotificationsSettingsScreen from './features/settings/NotificationsSettingsScreen'
import CustomizeScreen from './features/hub/CustomizeScreen'
import MissionsScreen from './features/hub/MissionsScreen'
import LanguageSettingsScreen from './features/settings/LanguageSettingsScreen'
import DataLegalScreen from './features/settings/DataLegalScreen'
import AdminLayout from './features/admin/AdminLayout'
import AdminOverview from './features/admin/AdminOverview'
import AdminUsers from './features/admin/AdminUsers'
import AdminQuarantine from './features/admin/AdminQuarantine'
import AdminContent from './features/admin/AdminContent'
import AdminMissions from './features/admin/AdminMissions'
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
import { useIconStyle } from './components/AppIcon'
import { THEMES } from './lib/shopVisuals'
import { DEFAULT_THEME } from '../shared/shopCatalog'

function ThemeInitializer() {
  const { mode, accent, accent2, accent3 } = useThemeStore()
  const visual = useIconStyle((s) => s.style)
  useEffect(() => {
    applyTheme(mode, accent, accent2, accent3)
  }, [mode, accent, accent2, accent3])
  // visual 8-bit ou Clean — o CSS usa isso pra desligar a fonte pixel no Clean (src/index.css)
  useEffect(() => {
    document.documentElement.setAttribute('data-visual', visual === 'pixel' ? '8bit' : 'clean')
  }, [visual])
  return null
}

function RootGate() {
  const { data: profile, isLoading, refetch } = useProfile()
  const equippedTheme = profile?.equippedTheme ?? null

  // O tema equipado (lojinha) manda no modo, nas cores e no fundo. Sem tema escolhido, fica a Aurora
  // clara ou escura conforme o modo que a pessoa já usava — as cores livres saíram de Aparência.
  useEffect(() => {
    if (!profile) return
    const store = useThemeStore.getState()
    const key = equippedTheme && THEMES[equippedTheme] ? equippedTheme : DEFAULT_THEME[store.mode]
    const visual = THEMES[key]
    if (store.mode !== visual.mode) store.setMode(visual.mode)
    if (store.accent !== visual.accent || store.accent2 !== visual.accent2) store.setAccent(visual.accent, visual.accent2)
    if (store.accent3 !== visual.accent3) store.setAccent3(visual.accent3)
    const root = document.documentElement
    if (visual.skin) root.setAttribute('data-skin', visual.skin)
    else root.removeAttribute('data-skin')
  }, [profile, equippedTheme])

  if (isLoading || !profile) return <LoadingScreen />

  if (!profile.onboardingCompleted) {
    return <OnboardingScreen onComplete={() => refetch()} />
  }

  return (
    <Routes>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="usuarios" element={<AdminUsers />} />
        <Route path="denuncias" element={<AdminModerationScreen />} />
        <Route path="quarentena" element={<AdminQuarantine />} />
        <Route path="conteudo" element={<AdminContent />} />
        <Route path="missoes" element={<AdminMissions />} />
        <Route path="registro" element={<AdminModerationScreen initialTab="log" />} />
        <Route path="avisos" element={<AdminAnnouncementsScreen />} />
        <Route path="topicos" element={<AdminTopicsScreen />} />
      </Route>
      <Route element={<Layout />}>
        <Route index element={<TodayScreen />} />
        <Route path="medications" element={<MedicationsScreen />} />
        <Route path="saude" element={<SaudeScreen />} />
        <Route path="comunidades" element={<ForumScreen />} />
        <Route path="comunidades/novo" element={<NewTopicScreen />} />
        <Route path="comunidades/t/:id" element={<TopicScreen />} />
        {/* as comunidades antigas (grupos) viraram o fórum */}
        <Route path="comunidade/*" element={<Navigate to="/comunidades" replace />} />
        <Route path="topico/:slug" element={<TopicPageScreen />} />
        <Route path="mood" element={<MoodCheckIn />} />
        <Route path="calendar" element={<CalendarScreen />} />
        <Route path="dia" element={<DayLogScreen />} />
        <Route path="pontos" element={<PointsScreen />} />
        <Route path="pontos/brilho" element={<BrilhoScreen />} />
        <Route path="pontos/colecao" element={<ColecaoScreen />} />
        <Route path="measurements" element={<MeasurementsScreen />} />
        <Route path="labs" element={<LabsScreen />} />
        <Route path="aurora" element={<AuroraHubScreen />} />
        <Route path="loja" element={<ShopScreen />} />
        <Route path="loja/:slug" element={<ShopDepartmentScreen />} />
        <Route path="meus-itens" element={<MyItemsScreen />} />
        {/* Dicas saiu — a Lojinha entrou no lugar; link antigo salvo cai lá */}
        <Route path="tips" element={<Navigate to="/loja" replace />} />
        <Route path="feed" element={<FeedScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="settings/conta" element={<AccountSettingsScreen />} />
        <Route path="settings/perfil" element={<ProfileSettingsScreen />} />
        <Route path="settings/privacidade" element={<PrivacySettingsScreen />} />
        <Route path="settings/notificacoes" element={<NotificationsSettingsScreen />} />
        <Route path="settings/preferencias" element={<PreferencesSettingsScreen />} />
        <Route path="settings/seguranca" element={<Navigate to="/settings/privacidade" replace />} />
        <Route path="settings/aparencia" element={<Navigate to="/personalizar" replace />} />
        <Route path="personalizar" element={<CustomizeScreen />} />
        <Route path="missoes" element={<MissionsScreen />} />
        <Route path="settings/idioma" element={<LanguageSettingsScreen />} />
        <Route path="settings/dados" element={<DataLegalScreen />} />
        {/* admin mudou pro painel em /admin — links antigos caem lá */}
        <Route path="settings/admin" element={<Navigate to="/admin" replace />} />
        <Route path="settings/admin/moderacao" element={<Navigate to="/admin/denuncias" replace />} />
        <Route path="settings/admin/avisos" element={<Navigate to="/admin/avisos" replace />} />
        <Route path="settings/admin/topicos" element={<Navigate to="/admin/topicos" replace />} />
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
