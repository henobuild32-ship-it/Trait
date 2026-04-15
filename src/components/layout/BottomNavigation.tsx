'use client';

import { useAppStore, PageName } from '@/lib/store';
import { Home, ArrowLeftRight, Store, Settings, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  page: PageName;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const clientNavItems: NavItem[] = [
  { page: 'home', label: 'Accueil', icon: Home },
  { page: 'ussd', label: 'USSD', icon: Phone },
  { page: 'barter', label: 'Troc', icon: ArrowLeftRight },
  { page: 'marketplace', label: 'Market', icon: Store },
  { page: 'settings', label: 'Plus', icon: Settings },
];

const agentNavItems: NavItem[] = [
  { page: 'agent-dashboard', label: 'Accueil', icon: Home },
  { page: 'agent-deposit', label: 'Dépôt', icon: Store },
  { page: 'agent-withdraw-validate', label: 'Retrait', icon: ArrowLeftRight },
  { page: 'ussd', label: 'USSD', icon: Phone },
  { page: 'settings', label: 'Plus', icon: Settings },
];

export default function BottomNavigation() {
  const { currentPage, navigateTo, unreadCount, user } = useAppStore();

  const isAgent = user?.role === 'agent';
  const navItems = isAgent ? agentNavItems : clientNavItems;

  const clientSubPages = ['send', 'withdraw', 'deposit', 'history', 'notifications', 'profile', 'marketplace-detail', 'barter-detail', 'barter-create'];
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
                  ? 'text-emerald-600'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                {item.page === 'home' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-0 h-0.5 w-8 rounded-full bg-emerald-600" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
