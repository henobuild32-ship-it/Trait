import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Type Definitions ────────────────────────────────────────────────

export type PageName =
  | 'welcome'
  | 'auth-role'
  | 'auth-phone'
  | 'auth-otp'
  | 'auth-profile'
  | 'pin-setup'
  | 'auth-login'
  | 'pin-verify'
  | 'onboarding'
  | 'home'
  | 'send'
  | 'withdraw'
  | 'deposit'
  | 'history'
  | 'ussd'
  | 'marketplace'
  | 'marketplace-detail'
  | 'barter'
  | 'barter-detail'
  | 'barter-create'
  | 'notifications'
  | 'settings'
  | 'profile'
  | 'agent-dashboard'
  | 'agent-deposit'
  | 'agent-withdraw-validate'
  | 'agent-activity';

export type UserRole = 'client' | 'agent';

export interface User {
  id: string;
  phone: string;
  name: string;
  pseudo: string;
  country: string;
  role: UserRole;
  agentCode: string | null;
  realBalance: number;
  bonusBalance: number;
  pin: string;
  isVerified: boolean;
  hasCompletedOnboarding: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'transfer_received' | 'transfer_sent' | 'withdrawal_validated' | 'purchase' | 'barter_accepted' | 'general' | 'security' | 'promo' | 'system';
  read: boolean;
  createdAt: string;
}

// ─── Store Slice Interfaces ─────────────────────────────────────────

interface NavigationState {
  currentPage: PageName;
  pageParams: Record<string, any>;
  navigationStack: Array<{ page: PageName; params?: Record<string, any> }>;
  navigateTo: (page: PageName, params?: Record<string, any>) => void;
  goBack: () => void;
}

interface AuthState {
  user: User | null;
  selectedRole: UserRole;
  setUser: (user: User | null) => void;
  setSelectedRole: (role: UserRole) => void;
  logout: () => void;
}

interface AuthFormState {
  phoneNumber: string;
  registrationPassword: string;
  otpCode: string;
  otpVerified: boolean;
  setPhoneNumber: (phone: string) => void;
  setRegistrationPassword: (password: string) => void;
  setOtpCode: (code: string) => void;
  setOtpVerified: (verified: boolean) => void;
}

interface PinState {
  pendingPinAction: (() => void) | null;
  setPendingPinAction: (action: (() => void) | null) => void;
  clearPendingPinAction: () => void;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifs: Notification[]) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// ─── Combined Store Interface ───────────────────────────────────────

export interface AppStore extends NavigationState, AuthState, AuthFormState, PinState, NotificationState, ThemeState {}

// ─── The Store ──────────────────────────────────────────────────────

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ── Navigation ─────────────────────────────────────────────
      currentPage: 'welcome',
      pageParams: {},
      navigationStack: [],

      navigateTo: (page, params) => {
        const { currentPage, pageParams, navigationStack } = get();

        // Don't push duplicate entries if navigating to the same page with same params
        if (currentPage !== page) {
          set({
            navigationStack: [
              ...navigationStack,
              { page: currentPage, params: pageParams },
            ],
          });
        }

        set({
          currentPage: page,
          pageParams: params ?? {},
        });
      },

      goBack: () => {
        const { navigationStack } = get();

        if (navigationStack.length === 0) {
          // Nothing to go back to – stay on welcome
          set({ currentPage: 'welcome', pageParams: {} });
          return;
        }

        const previous = navigationStack[navigationStack.length - 1];
        set({
          currentPage: previous.page,
          pageParams: previous.params ?? {},
          navigationStack: navigationStack.slice(0, -1),
        });
      },

      // ── Auth ───────────────────────────────────────────────────
      user: null,
      selectedRole: 'client',

      setUser: (user) => set({ user }),
      setSelectedRole: (role) => set({ selectedRole: role }),

      logout: () =>
        set({
          user: null,
          selectedRole: 'client',
          currentPage: 'welcome',
          pageParams: {},
          navigationStack: [],
          pendingPinAction: null,
        }),

      // ── Auth Form ────────────────────────────────────────────
      phoneNumber: '',
      registrationPassword: '',
      otpCode: '',
      otpVerified: false,

      setPhoneNumber: (phone) => set({ phoneNumber: phone }),
      setRegistrationPassword: (password) => set({ registrationPassword: password }),
      setOtpCode: (code) => set({ otpCode: code }),
      setOtpVerified: (verified) => set({ otpVerified: verified }),

      // ── PIN ────────────────────────────────────────────────────
      pendingPinAction: null,

      setPendingPinAction: (action) => set({ pendingPinAction: action }),
      clearPendingPinAction: () => set({ pendingPinAction: null }),

      // ── Notifications ──────────────────────────────────────────
      notifications: [],
      unreadCount: 0,

      setNotifications: (notifs) =>
        set({
          notifications: notifs,
          unreadCount: notifs.filter((n) => !n.read).length,
        }),

      markAsRead: (id) => {
        const { notifications } = get();
        const updated = notifications.map((n) =>
          n.id === id ? { ...n, read: true as const } : n,
        );
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.read).length,
        });
      },

      clearNotifications: () =>
        set({ notifications: [], unreadCount: 0 }),

      // ── Theme ──────────────────────────────────────────────────
      isDarkMode: false,

      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    {
      name: 'trait-app-storage',
      // Only persist auth and theme to localStorage
      partialize: (state) => ({
        user: state.user,
        isDarkMode: state.isDarkMode,
        selectedRole: state.selectedRole,
      }),
    },
  ),
);
