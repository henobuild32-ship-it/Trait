'use client';

import { useAppStore, PageName } from '@/lib/store';
import { Home, ArrowLeftRight, Store, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  page: PageName;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { page: 'home', label: 'Accueil', icon: Home },
  { page: 'barter', label: 'Troc', icon: ArrowLeftRight },
  { page: 'marketplace', label: 'Market', icon: Store },
  { page: 'settings', label: 'Paramètres', icon: Settings },
];

export default function BottomNavigation() {
  const { currentPage, navigateTo, unreadCount } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md safe-area-bottom">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive =
            currentPage === item.page ||
            (item.page === 'home' &&
              ['send', 'withdraw', 'deposit', 'history', 'ussd', 'notifications', 'profile', 'marketplace-detail', 'barter-detail', 'barter-create'].includes(currentPage));

          return (
            <button
              key={item.page}
              onClick={() => navigateTo(item.page)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 transition-all duration-200 min-w-[60px]',
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
