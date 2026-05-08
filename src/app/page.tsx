'use client';

import { useEffect } from 'react';
import { useAppStore, PageName } from '@/lib/store';

// Auth screens
import WelcomeScreen from '@/components/screens/WelcomeScreen';
import AuthRoleScreen from '@/components/screens/AuthRoleScreen';
import AuthPhoneScreen from '@/components/screens/AuthPhoneScreen';
import AuthLoginScreen from '@/components/screens/AuthLoginScreen';
import AuthOtpScreen from '@/components/screens/AuthOtpScreen';
import AuthProfileScreen from '@/components/screens/AuthProfileScreen';
import PinSetupScreen from '@/components/screens/PinSetupScreen';
import PinVerifyScreen from '@/components/screens/PinVerifyScreen';
import OnboardingScreen from '@/components/screens/OnboardingScreen';

// Main screens
import HomeScreen from '@/components/screens/HomeScreen';
import SendScreen from '@/components/screens/SendScreen';
import WithdrawScreen from '@/components/screens/WithdrawScreen';
import DepositScreen from '@/components/screens/DepositScreen';
import HistoryScreen from '@/components/screens/HistoryScreen';
import USSDScreen from '@/components/screens/USSDScreen';
import MarketplaceScreen from '@/components/screens/MarketplaceScreen';
import MarketplaceDetailScreen from '@/components/screens/MarketplaceDetailScreen';
import BarterScreen from '@/components/screens/BarterScreen';
import BarterDetailScreen from '@/components/screens/BarterDetailScreen';
import BarterCreateScreen from '@/components/screens/BarterCreateScreen';
import NotificationsScreen from '@/components/screens/NotificationsScreen';
import SettingsScreen from '@/components/screens/SettingsScreen';
import ProfileScreen from '@/components/screens/ProfileScreen';

// Agent screens
import AgentDashboardScreen from '@/components/screens/AgentDashboardScreen';
import AgentDepositScreen from '@/components/screens/AgentDepositScreen';
import AgentWithdrawValidateScreen from '@/components/screens/AgentWithdrawValidateScreen';
import AgentActivityScreen from '@/components/screens/AgentActivityScreen';

// Admin screens
import AdminLoginScreen from '@/components/admin/AdminLoginScreen';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminUsersScreen from '@/components/admin/AdminUsersScreen';
import AdminAgentsScreen from '@/components/admin/AdminAgentsScreen';
import AdminTransactionsScreen from '@/components/admin/AdminTransactionsScreen';
import AdminMarketScreen from '@/components/admin/AdminMarketScreen';
import AdminBarterScreen from '@/components/admin/AdminBarterScreen';
import AdminNotificationsScreen from '@/components/admin/AdminNotificationsScreen';
import AdminActivityLogScreen from '@/components/admin/AdminActivityLogScreen';

import BottomNavigation from '@/components/layout/BottomNavigation';
import { PWAInstallBanner } from '@/components/layout/PWAInstallBanner';

const screenMap: Record<PageName, React.ComponentType> = {
  welcome: WelcomeScreen,
  'auth-role': AuthRoleScreen,
  'auth-phone': AuthPhoneScreen,
  'auth-login': AuthLoginScreen,
  'admin-login': AdminLoginScreen,
  'auth-otp': AuthOtpScreen,
  'auth-profile': AuthProfileScreen,
  'pin-setup': PinSetupScreen,
  'pin-verify': PinVerifyScreen,
  onboarding: OnboardingScreen,
  home: HomeScreen,
  send: SendScreen,
  withdraw: WithdrawScreen,
  deposit: DepositScreen,
  history: HistoryScreen,
  ussd: USSDScreen,
  marketplace: MarketplaceScreen,
  'marketplace-detail': MarketplaceDetailScreen,
  barter: BarterScreen,
  'barter-detail': BarterDetailScreen,
  'barter-create': BarterCreateScreen,
  notifications: NotificationsScreen,
  settings: SettingsScreen,
  profile: ProfileScreen,
  'agent-dashboard': AgentDashboardScreen,
  'agent-deposit': AgentDepositScreen,
  'agent-withdraw-validate': AgentWithdrawValidateScreen,
  'agent-activity': AgentActivityScreen,
  // Admin pages
  'admin-dashboard': AdminDashboard,
  'admin-users': AdminUsersScreen,
  'admin-agents': AdminAgentsScreen,
  'admin-transactions': AdminTransactionsScreen,
  'admin-market': AdminMarketScreen,
  'admin-barter': AdminBarterScreen,
  'admin-notifications': AdminNotificationsScreen,
  'admin-activity-log': AdminActivityLogScreen,
};

// Pages that show bottom navigation
const pagesWithNav: PageName[] = ['home', 'send', 'withdraw', 'deposit', 'history', 'ussd', 'marketplace', 'marketplace-detail', 'barter', 'barter-detail', 'barter-create', 'notifications', 'settings', 'profile', 'agent-dashboard', 'agent-deposit', 'agent-withdraw-validate', 'agent-activity'];

// Admin pages that don't show bottom nav
const adminPages: PageName[] = ['admin-login', 'admin-dashboard', 'admin-users', 'admin-agents', 'admin-transactions', 'admin-market', 'admin-barter', 'admin-notifications', 'admin-activity-log'];

export default function TraitApp() {
  const { currentPage, user, admin, navigateTo } = useAppStore();
  const Screen = screenMap[currentPage];

  // Auto-redirect: if user is logged in but on welcome, go to correct home
  useEffect(() => {
    if (user && currentPage === 'welcome') {
      navigateTo(user.role === 'agent' ? 'agent-dashboard' : 'home');
    }
    // If admin is logged in and on admin-login, go to dashboard
    if (admin && currentPage === 'admin-login') {
      navigateTo('admin-dashboard');
    }
  }, [user, admin, currentPage, navigateTo]);

  if (!Screen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-2xl mb-2">🚧</p>
          <p className="text-sm text-muted-foreground">
            Page &quot;{currentPage}&quot; en construction
          </p>
        </div>
      </div>
    );
  }

  const showNav = user && pagesWithNav.includes(currentPage);
  const isAdminPage = adminPages.includes(currentPage);

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      <div className={`flex-1 ${showNav ? 'pb-16' : ''}`}>
        <Screen />
      </div>
      {showNav && <BottomNavigation />}
      {!isAdminPage && <PWAInstallBanner />}
    </div>
  );
}
