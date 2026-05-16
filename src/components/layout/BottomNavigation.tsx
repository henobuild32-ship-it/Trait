'use client';

import { useAppStore, PageName } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { Home, ArrowLeftRight, Store, Settings, Phone, MessageSquare, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  page: PageName;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const clientNavItems: NavItem[] = [
  { page: 'home', labelKey: 'nav.home', icon: Home },
  { page: 'send', labelKey: 'nav.send', icon: ArrowLeftRight },
  { page: 'international-transfer', labelKey: 'nav.intl', icon: Globe },
  { page: 'marketplace', labelKey: 'nav.market', icon: Store },
  { page: 'settings', labelKey: 'nav.more', icon: Settings },
];

const agentNavItems: NavItem[] = [
  { page: 'agent-dashboard', labelKey: 'nav.home', icon: Home },
  { page: 'agent-deposit', labelKey: 'nav.deposit', icon: Store },
  { page: 'agent-withdraw-validate', labelKey: 'nav.withdraw', icon: ArrowLeftRight },
  { page: 'agent-messages', labelKey: 'nav.messages', icon: MessageSquare },
  { page: 'settings', labelKey: 'nav.more', icon: Settings },
];

export default function BottomNavigation() {
  const { currentPage, navigateTo, unreadCount, user } = useAppStore();
  const { t } = useTranslation();

  const isAgent = user?.role === 'agent';
  const navItems = isAgent ? agentNavItems : clientNavItems;

  const clientSubPages = ['send', 'withdraw', 'deposit', 'history', 'notifications', 'profile', 'marketplace-detail', 'barter-detail', 'barter-create', 'ussd', 'international-transfer'];
  const agentSubPages = ['agent-activity'];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md safe-area-bottom">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
        {navItems.map((item) => {
          const isHomeOrDash = item.page === 'home' || item.page === 'agent-dashboard';
          const isActive =
            currentPage === item.page ||
            (isHomeOrDash && [...clientSubPages, ...agentSubPages].includes(currentPage));

          return (
            <button
              key={item.page}
              onClick={() => navigateTo(item.page)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 transition-all duration-200 min-w-[52px]',
                isActive
                  ? 'text-[#1E40AF]'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                {item.page === 'home' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                {t(item.labelKey)}
              </span>
              {isActive && (
                <div className="absolute -bottom-0 h-0.5 w-8 rounded-full bg-[#1E40AF]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
