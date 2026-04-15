'use client';

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

import BottomNavigation from '@/components/layout/BottomNavigation';
import { AnimatePresence, motion } from 'framer-motion';

const screenMap: Record<PageName, React.ComponentType> = {
  welcome: WelcomeScreen,
  'auth-role': AuthRoleScreen,
  'auth-phone': AuthPhoneScreen,
  'auth-login': AuthLoginScreen,
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
};

// Pages that show bottom navigation
const pagesWithNav: PageName[] = ['home', 'send', 'withdraw', 'deposit', 'history', 'ussd', 'marketplace', 'marketplace-detail', 'barter', 'barter-detail', 'barter-create', 'notifications', 'settings', 'profile', 'agent-dashboard', 'agent-deposit', 'agent-withdraw-validate', 'agent-activity'];

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function TraitApp() {
  const { currentPage, user } = useAppStore();
  const Screen = screenMap[currentPage];

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

  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      <div className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </div>
      {showNav && <BottomNavigation />}
    </div>
  );
}
