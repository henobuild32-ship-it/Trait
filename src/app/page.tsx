'use client';

import { useAppStore, PageName } from '@/lib/store';

// Auth screens
import WelcomeScreen from '@/components/screens/WelcomeScreen';
import AuthPhoneScreen from '@/components/screens/AuthPhoneScreen';
import AuthOtpScreen from '@/components/screens/AuthOtpScreen';
import AuthProfileScreen from '@/components/screens/AuthProfileScreen';

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

import BottomNavigation from '@/components/layout/BottomNavigation';
import { AnimatePresence, motion } from 'framer-motion';

const screenMap: Record<PageName, React.ComponentType> = {
  welcome: WelcomeScreen,
  'auth-phone': AuthPhoneScreen,
  'auth-otp': AuthOtpScreen,
  'auth-profile': AuthProfileScreen,
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
};

// Pages that show bottom navigation
const pagesWithNav: PageName[] = ['home', 'send', 'withdraw', 'deposit', 'history', 'ussd', 'marketplace', 'marketplace-detail', 'barter', 'barter-detail', 'barter-create', 'notifications', 'settings', 'profile'];

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
