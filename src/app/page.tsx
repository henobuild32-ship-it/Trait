'use client';

import { useEffect, Suspense, lazy } from 'react';
import { useAppStore, PageName } from '@/lib/store';
import { Skeleton } from '@/components/ui/skeleton';

// Auth screens
const WelcomeScreen = lazy(() => import('@/components/screens/WelcomeScreen'));
const AuthRoleScreen = lazy(() => import('@/components/screens/AuthRoleScreen'));
const AuthPhoneScreen = lazy(() => import('@/components/screens/AuthPhoneScreen'));
const AuthLoginScreen = lazy(() => import('@/components/screens/AuthLoginScreen'));
const AuthOtpScreen = lazy(() => import('@/components/screens/AuthOtpScreen'));
const AuthProfileScreen = lazy(() => import('@/components/screens/AuthProfileScreen'));
const PinSetupScreen = lazy(() => import('@/components/screens/PinSetupScreen'));
const PinVerifyScreen = lazy(() => import('@/components/screens/PinVerifyScreen'));
const OnboardingScreen = lazy(() => import('@/components/screens/OnboardingScreen'));

// Main screens
const HomeScreen = lazy(() => import('@/components/screens/HomeScreen'));
const SendScreen = lazy(() => import('@/components/screens/SendScreen'));
const WithdrawScreen = lazy(() => import('@/components/screens/WithdrawScreen'));
const DepositScreen = lazy(() => import('@/components/screens/DepositScreen'));
const HistoryScreen = lazy(() => import('@/components/screens/HistoryScreen'));
const USSDScreen = lazy(() => import('@/components/screens/USSDScreen'));
const MarketplaceScreen = lazy(() => import('@/components/screens/MarketplaceScreen'));
const MarketplaceDetailScreen = lazy(() => import('@/components/screens/MarketplaceDetailScreen'));
const BarterScreen = lazy(() => import('@/components/screens/BarterScreen'));
const BarterDetailScreen = lazy(() => import('@/components/screens/BarterDetailScreen'));
const BarterCreateScreen = lazy(() => import('@/components/screens/BarterCreateScreen'));
const NotificationsScreen = lazy(() => import('@/components/screens/NotificationsScreen'));
const SettingsScreen = lazy(() => import('@/components/screens/SettingsScreen'));
const ProfileScreen = lazy(() => import('@/components/screens/ProfileScreen'));

// Agent screens
const AgentDashboardScreen = lazy(() => import('@/components/screens/AgentDashboardScreen'));
const AgentDepositScreen = lazy(() => import('@/components/screens/AgentDepositScreen'));
const AgentWithdrawValidateScreen = lazy(() => import('@/components/screens/AgentWithdrawValidateScreen'));
const AgentActivityScreen = lazy(() => import('@/components/screens/AgentActivityScreen'));

// Admin screens
const AdminLoginScreen = lazy(() => import('@/components/admin/AdminLoginScreen'));
const AdminDashboard = lazy(() => import('@/components/admin/AdminDashboard'));
const AdminUsersScreen = lazy(() => import('@/components/admin/AdminUsersScreen'));
const AdminAgentsScreen = lazy(() => import('@/components/admin/AdminAgentsScreen'));
const AdminTransactionsScreen = lazy(() => import('@/components/admin/AdminTransactionsScreen'));
const AdminMarketScreen = lazy(() => import('@/components/admin/AdminMarketScreen'));
const AdminBarterScreen = lazy(() => import('@/components/admin/AdminBarterScreen'));
const AdminNotificationsScreen = lazy(() => import('@/components/admin/AdminNotificationsScreen'));
const AdminActivityLogScreen = lazy(() => import('@/components/admin/AdminActivityLogScreen'));
const AdminBonusScreen = lazy(() => import('@/components/admin/AdminBonusScreen'));
const AdminBonusAdjustScreen = lazy(() => import('@/components/admin/AdminBonusAdjustScreen'));
const AdminBonusHistoryScreen = lazy(() => import('@/components/admin/AdminBonusHistoryScreen'));
const AdminBonusCampaignsScreen = lazy(() => import('@/components/admin/AdminBonusCampaignsScreen'));
const AdminAgentValidationScreen = lazy(() => import('@/components/admin/AdminAgentValidationScreen'));
const AdminMessagesScreen = lazy(() => import('@/components/admin/AdminMessagesScreen'));
const AgentMessagesScreen = lazy(() => import('@/components/screens/AgentMessagesScreen'));
const InternationalTransferScreen = lazy(() => import('@/components/screens/InternationalTransferScreen'));
const DeveloperDashboardScreen = lazy(() => import('@/components/screens/DeveloperDashboardScreen'));
const DeveloperRegisterScreen = lazy(() => import('@/components/screens/DeveloperRegisterScreen'));
const AgentRegisterScreen = lazy(() => import('@/components/screens/AgentRegisterScreen'));
const AgentPendingScreen = lazy(() => import('@/components/screens/AgentPendingScreen'));
const SupportScreen = lazy(() => import('@/components/screens/SupportScreen'));
const KYCVerificationScreen = lazy(() => import('@/components/screens/KYCVerificationScreen'));
const CardRequestScreen = lazy(() => import('@/components/screens/CardRequestScreen'));
const CardPaymentScreen = lazy(() => import('@/components/screens/CardPaymentScreen'));
const CardScreen = lazy(() => import('@/components/screens/CardScreen'));

// Seller screens
const SellerRegisterScreen = lazy(() => import('@/components/screens/SellerRegisterScreen'));
const SellerPendingScreen = lazy(() => import('@/components/screens/SellerPendingScreen'));
const SellerDashboard = lazy(() => import('@/components/screens/SellerDashboard'));
const SellerProductsScreen = lazy(() => import('@/components/screens/SellerProductsScreen'));
const SellerQRScannerScreen = lazy(() => import('@/components/screens/SellerQRScannerScreen'));

// Admin screens continued
const AdminDevelopersScreen = lazy(() => import('@/components/admin/AdminDevelopersScreen'));
const AdminCardRequestsScreen = lazy(() => import('@/components/admin/AdminCardRequestsScreen'));
const AdminCardsScreen = lazy(() => import('@/components/admin/AdminCardsScreen'));
const AdminClientMessagesScreen = lazy(() => import('@/components/admin/AdminClientMessagesScreen'));
const AdminSellerValidationScreen = lazy(() => import('@/components/admin/AdminSellerValidationScreen'));
const AdminSellersScreen = lazy(() => import('@/components/admin/AdminSellersScreen'));
const AdminChildrenScreen = lazy(() => import('@/components/admin/AdminChildrenScreen'));
const ChildSponsorshipScreen = lazy(() => import('@/components/screens/ChildSponsorshipScreen'));

const BottomNavigation = lazy(() => import('@/components/layout/BottomNavigation'));
const PWAInstallBanner = lazy(() => import('@/components/layout/PWAInstallBanner').then(m => ({ default: m.PWAInstallBanner })));
const UpdateNotice = lazy(() => import('@/components/layout/UpdateNotice').then(m => ({ default: m.UpdateNotice })));

function ScreenLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Skeleton className="h-12 w-12 rounded-full mx-auto mb-3" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
}

const screenMap: Record<PageName, React.LazyExoticComponent<React.ComponentType>> = {
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
  'developer-dashboard': DeveloperDashboardScreen,
  'developer-register': DeveloperRegisterScreen,
  'agent-register': AgentRegisterScreen,
  'agent-pending': AgentPendingScreen,
  support: SupportScreen,
  'kyc-verification': KYCVerificationScreen,
  'card-request': CardRequestScreen,
  'card-payment': CardPaymentScreen,
  card: CardScreen,
  'admin-card-requests': AdminCardRequestsScreen,
  'admin-cards': AdminCardsScreen,
  'admin-client-messages': AdminClientMessagesScreen,
  'admin-seller-validation': AdminSellerValidationScreen,
  'admin-sellers': AdminSellersScreen,
  'admin-children': AdminChildrenScreen,
  'child-sponsorship': ChildSponsorshipScreen,
  'seller-register': SellerRegisterScreen,
  'seller-pending': SellerPendingScreen,
  'seller-dashboard': SellerDashboard,
  'seller-products': SellerProductsScreen,
  'seller-qr-scanner': SellerQRScannerScreen,
};

const pagesWithNav: PageName[] = ['home', 'send', 'withdraw', 'deposit', 'history', 'ussd', 'marketplace', 'marketplace-detail', 'barter', 'barter-detail', 'barter-create', 'notifications', 'settings', 'profile', 'agent-dashboard', 'agent-deposit', 'agent-withdraw-validate', 'agent-activity', 'agent-messages', 'card-request', 'card-payment', 'card', 'kyc-verification', 'seller-dashboard', 'child-sponsorship'];

const adminPages: PageName[] = ['admin-login', 'admin-dashboard', 'admin-users', 'admin-agents', 'admin-transactions', 'admin-market', 'admin-barter', 'admin-notifications', 'admin-activity-log', 'admin-bonus', 'admin-bonus-adjust', 'admin-bonus-history', 'admin-bonus-campaigns', 'admin-agent-validation', 'admin-messages', 'admin-developers', 'admin-card-requests', 'admin-cards', 'admin-client-messages', 'admin-seller-validation', 'admin-sellers', 'admin-children', 'agent-register', 'agent-pending'];

export default function TraitApp() {
  const { currentPage, user, admin, navigateTo } = useAppStore();
  const Screen = screenMap[currentPage];

  useEffect(() => {
    if (user && currentPage === 'welcome') {
      if (user.role === 'agent') navigateTo('agent-dashboard');
      else if (user.role === 'seller') navigateTo('seller-dashboard');
      else navigateTo('home');
    }
    if (admin && currentPage === 'admin-login') {
      navigateTo('admin-dashboard');
    }
  }, [user, admin, currentPage, navigateTo]);

  if (!Screen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-2xl mb-2">🚧</p>
          <p className="text-sm text-muted-foreground">Page &quot;{currentPage}&quot; en construction</p>
        </div>
      </div>
    );
  }

  const showNav = user && pagesWithNav.includes(currentPage);
  const isAdminPage = adminPages.includes(currentPage);

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      <div className={`flex-1 ${showNav ? 'pb-16' : ''}`}>
        <Suspense fallback={<ScreenLoader />}>
          <Screen />
        </Suspense>
      </div>
      {showNav && (
        <Suspense fallback={null}>
          <BottomNavigation />
        </Suspense>
      )}
      {!isAdminPage && (
        <Suspense fallback={null}>
          <PWAInstallBanner />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <UpdateNotice />
      </Suspense>
    </div>
  );
}
