import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/lib/i18n';

// ─── Type Definitions ────────────────────────────────────────────────

export type PageName =
  | 'welcome'
  | 'auth-role'
  | 'auth-phone'
  | 'auth-otp'
  | 'auth-profile'
  | 'pin-setup'
  | 'auth-login'
  | 'admin-login'
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
  | 'agent-activity'
  | 'agent-messages'
  // Admin pages
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-agents'
  | 'admin-transactions'
  | 'admin-market'
  | 'admin-barter'
  | 'admin-notifications'
  | 'admin-activity-log'
  | 'admin-seller-validation'
  | 'admin-sellers'
  // Admin bonus pages
  | 'admin-bonus'
  | 'admin-bonus-adjust'
  | 'admin-bonus-history'
  | 'admin-bonus-campaigns'
  | 'admin-agent-validation'
  | 'admin-messages'
  | 'admin-developers'
  | 'developer-register'
  | 'international-transfer'
  | 'agent-register'
  | 'agent-pending'
  | 'support'
  | 'kyc-verification'
  // Card system pages
  | 'card-request'
  | 'card-payment'
  | 'card'
  // Admin card pages
  | 'admin-card-requests'
  | 'admin-cards'
  | 'admin-client-messages'
  // Seller pages
  | 'seller-register'
  | 'seller-pending'
  | 'seller-dashboard'
  | 'seller-products'
  | 'seller-qr-scanner';

export type UserRole = 'client' | 'agent' | 'seller';

export interface User {
  id: string;
  phone: string;
  name: string;
  pseudo: string;
  email: string | null;
  gender: string | null;
  city: string | null;
  country: string;
  role: UserRole;
  agentCode: string | null;
  agentNumber: string | null;
  validationStatus: string;
  validationRejectReason: string | null;
  businessName?: string | null;
  businessType?: string | null;
  location?: string | null;
  suspensionReason?: string | null;
  realBalance: number;
  realBalanceFC: number;
  bonusBalance: number;
  bonusBalanceFC: number;
  pin: string;
  isVerified: boolean;
  suspended: boolean;
  hasCompletedOnboarding: boolean;
  createdAt?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'transfer_received' | 'transfer_sent' | 'withdrawal_validated' | 'purchase' | 'barter_accepted' | 'general' | 'security' | 'promo' | 'system' | 'announcement' | 'alert' | 'maintenance';
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
  admin: AdminUser | null;
  selectedRole: UserRole;
  setUser: (user: User | null) => void;
  setAdmin: (admin: AdminUser | null) => void;
  setSelectedRole: (role: UserRole) => void;
  logout: () => void;
  adminLogout: () => void;
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

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

// ─── Combined Store Interface ───────────────────────────────────────

export interface AppStore extends NavigationState, AuthState, AuthFormState, PinState, NotificationState, ThemeState, LanguageState {}

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

        // Don't push duplicate entries
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
      admin: null,
      selectedRole: 'client',

      setUser: (user) => set({ user }),
      setAdmin: (admin) => set({ admin }),
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

      adminLogout: () =>
        set({
          admin: null,
          currentPage: 'admin-login',
          pageParams: {},
          navigationStack: [],
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

      // ── Language ───────────────────────────────────────────────
      language: 'fr' as Language,

      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'trait-app-storage',
      partialize: (state) => ({
        user: state.user,
        // admin is NOT persisted - password required on every login
        isDarkMode: state.isDarkMode,
        selectedRole: state.selectedRole,
        language: state.language,
      }),
    },
  ),
);
