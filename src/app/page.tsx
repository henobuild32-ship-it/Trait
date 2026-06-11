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
import AdminBonusScreen from '@/components/admin/AdminBonusScreen';
import AdminBonusAdjustScreen from '@/components/admin/AdminBonusAdjustScreen';
import AdminBonusHistoryScreen from '@/components/admin/AdminBonusHistoryScreen';
import AdminBonusCampaignsScreen from '@/components/admin/AdminBonusCampaignsScreen';
import AdminAgentValidationScreen from '@/components/admin/AdminAgentValidationScreen';
import AdminMessagesScreen from '@/components/admin/AdminMessagesScreen';
import AgentMessagesScreen from '@/components/screens/AgentMessagesScreen';
import InternationalTransferScreen from '@/components/screens/InternationalTransferScreen';
import DeveloperRegisterScreen from '@/components/screens/DeveloperRegisterScreen';
import AgentRegisterScreen from '@/components/screens/AgentRegisterScreen';
import AgentPendingScreen from '@/components/screens/AgentPendingScreen';
import SupportScreen from '@/components/screens/SupportScreen';
import KYCVerificationScreen from '@/components/screens/KYCVerificationScreen';
import CardRequestScreen from '@/components/screens/CardRequestScreen';
import CardPaymentScreen from '@/components/screens/CardPaymentScreen';
import CardScreen from '@/components/screens/CardScreen';

// Seller screens
import { SellerRegisterScreen } from '@/components/screens/SellerRegisterScreen';
import { SellerPendingScreen } from '@/components/screens/SellerPendingScreen';
import { SellerDashboard } from '@/components/screens/SellerDashboard';
import { SellerProductsScreen } from '@/components/screens/SellerProductsScreen';
import { SellerQRScannerScreen } from '@/components/screens/SellerQRScannerScreen';

// Admin screens continued
import AdminDevelopersScreen from '@/components/admin/AdminDevelopersScreen';
import AdminCardRequestsScreen from '@/components/admin/AdminCardRequestsScreen';
import AdminCardsScreen from '@/components/admin/AdminCardsScreen';
import AdminClientMessagesScreen from '@/components/admin/AdminClientMessagesScreen';
import AdminSellerValidationScreen from '@/components/admin/AdminSellerValidationScreen';
import AdminSellersScreen from '@/components/admin/AdminSellersScreen';
import AdminChildrenScreen from '@/components/admin/AdminChildrenScreen';
import ChildSponsorshipScreen from '@/components/screens/ChildSponsorshipScreen';

import BottomNavigation from '@/components/layout/BottomNavigation';
import { PWAInstallBanner } from '@/components/layout/PWAInstallBanner';
import { UpdateNotice } from '@/components/layout/UpdateNotice';

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
  'admin-bonus': AdminBonusScreen,
  'admin-bonus-adjust': AdminBonusAdjustScreen,
  'admin-bonus-history': AdminBonusHistoryScreen,
  'admin-bonus-campaigns': AdminBonusCampaignsScreen,
  'admin-agent-validation': AdminAgentValidationScreen,
  'admin-messages': AdminMessagesScreen,
  'admin-developers': AdminDevelopersScreen,
  'agent-messages': AgentMessagesScreen,
  'international-transfer': InternationalTransferScreen,
  'developer-register': DeveloperRegisterScreen,
  'agent-register': AgentRegisterScreen,
  'agent-pending': AgentPendingScreen,
  'support': SupportScreen,
  'kyc-verification': KYCVerificationScreen,
  // Card system pages
  'card-request': CardRequestScreen,
  'card-payment': CardPaymentScreen,
  'card': CardScreen,
  // Admin card & client messaging pages
  'admin-card-requests': AdminCardRequestsScreen,
  'admin-cards': AdminCardsScreen,
  'admin-client-messages': AdminClientMessagesScreen,
  'admin-seller-validation': AdminSellerValidationScreen,
  'admin-sellers': AdminSellersScreen,
  'admin-children': AdminChildrenScreen,
  'child-sponsorship': ChildSponsorshipScreen,
  // Seller pages
  'seller-register': SellerRegisterScreen,
  'seller-pending': SellerPendingScreen,
  'seller-dashboard': SellerDashboard,
  'seller-products': SellerProductsScreen,
  'seller-qr-scanner': SellerQRScannerScreen,
};

// Pages that show bottom navigation
const pagesWithNav: PageName[] = ['home', 'send', 'withdraw', 'deposit', 'history', 'ussd', 'marketplace', 'marketplace-detail', 'barter', 'barter-detail', 'barter-create', 'notifications', 'settings', 'profile', 'agent-dashboard', 'agent-deposit', 'agent-withdraw-validate', 'agent-activity', 'agent-messages', 'card-request', 'card-payment', 'card', 'kyc-verification', 'seller-dashboard', 'child-sponsorship'];

// Admin pages that don't show bottom nav
const adminPages: PageName[] = ['admin-login', 'admin-dashboard', 'admin-users', 'admin-agents', 'admin-transactions', 'admin-market', 'admin-barter', 'admin-notifications', 'admin-activity-log', 'admin-bonus', 'admin-bonus-adjust', 'admin-bonus-history', 'admin-bonus-campaigns', 'admin-agent-validation', 'admin-messages', 'admin-developers', 'admin-card-requests', 'admin-cards', 'admin-client-messages', 'admin-seller-validation', 'admin-sellers', 'admin-children', 'agent-register', 'agent-pending'];

export default function TraitApp() {
  const { currentPage, user, admin, navigateTo } = useAppStore();
  const Screen = screenMap[currentPage];

  // Auto-redirect: if user is logged in but on welcome, go to correct home
  useEffect(() => {
    if (user && currentPage === 'welcome') {
      if (user.role === 'agent') navigateTo('agent-dashboard');
      else if (user.role === 'seller') navigateTo('seller-dashboard');
      else navigateTo('home');
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
      <UpdateNotice />
    </div>
  );
}
