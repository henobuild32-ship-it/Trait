'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Headphones,
  Mail,
  User,
  MessageSquare,
  Send,
  Clock,
  ChevronDown,
  ChevronUp,
  Shield,
  CheckCircle,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';

// ─── FAQ Data ──────────────────────────────────────────────────
interface FAQItem {
  questionKey: string;
  answerKey: string;
}

const faqItems: FAQItem[] = [
  { questionKey: 'support.faq_q1', answerKey: 'support.faq_a1' },
  { questionKey: 'support.faq_q2', answerKey: 'support.faq_a2' },
  { questionKey: 'support.faq_q3', answerKey: 'support.faq_a3' },
];

// ─── Animation Variants ───────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
};

const faqContentVariants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeInOut' },
  },
};

// ─── Form Errors Interface ────────────────────────────────────
interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

// ─── Component ────────────────────────────────────────────────
export default function SupportScreen() {
  const { goBack, navigateTo } = useAppStore();
  const { t } = useTranslation();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [sending, setSending] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // FAQ state
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  // ── Validate a single field ────────────────────────────────
  const validateField = useCallback(
    (field: keyof FormErrors, value: string): string | undefined => {
      if (!value.trim()) {
        const errorMap: Record<keyof FormErrors, string> = {
          name: t('support.name_required'),
          email: t('support.email_required'),
          subject: t('support.subject_required'),
          message: t('support.message_required'),
        };
        return errorMap[field];
      }
      if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return t('support.email_required');
      }
      return undefined;
    },
    [t],
  );

  // ── Validate all fields ────────────────────────────────────
  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {
      name: validateField('name', name),
      email: validateField('email', email),
      subject: validateField('subject', subject),
      message: validateField('message', message),
    };
    setErrors(newErrors);
    setTouched({ name: true, email: true, subject: true, message: true });
    return !Object.values(newErrors).some(Boolean);
  }, [name, email, subject, message, validateField]);

  // ── Handle field blur ──────────────────────────────────────
  const handleBlur = useCallback(
    (field: keyof FormErrors, value: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [validateField],
  );

  // ── Handle send ────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!validateAll()) return;

    setSending(true);

    // Small delay for the loading animation
    await new Promise((resolve) => setTimeout(resolve, 800));

    const fullMessage = `Nom: ${name}\nEmail: ${email}\n\n${message}`;
    const mailtoLink = `mailto:trait137@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullMessage)}`;

    window.open(mailtoLink, '_blank');

    setSending(false);
    toast.success(t('support.success'), {
      description: t('support.available'),
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    });

    // Reset form
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setErrors({});
    setTouched({});
  }, [validateAll, name, email, subject, message, t]);

  // ── Toggle FAQ ─────────────────────────────────────────────
  const toggleFAQ = useCallback((index: number) => {
    setOpenFAQ((prev) => (prev === index ? null : index));
  }, []);

  // ── Direct email shortcut ──────────────────────────────────
  const handleDirectEmail = useCallback(() => {
    const mailtoLink = 'mailto:trait137@gmail.com';
    window.open(mailtoLink, '_blank');
  }, []);

  // ── Inline error renderer ──────────────────────────────────
  const renderError = (field: keyof FormErrors) => {
    if (!touched[field] || !errors[field]) return null;
    return (
      <motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-red-500 mt-1.5 pl-1"
      >
        {errors[field]}
      </motion.p>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center shadow-md shadow-blue-500/20">
              <Headphones className="w-4.5 h-4.5 text-white" />
            </div>
            <h1 className="text-lg font-semibold">{t('support.title')}</h1>
          </div>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────── */}
      <motion.div
        className="flex-1 px-4 py-5 space-y-5 pb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Support Info Card ────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-[#1E40AF] to-[#2563EB] px-6 py-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <Headphones className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base">
                      {t('support.title')}
                    </h2>
                    <p className="text-blue-100 text-xs mt-0.5">
                      {t('support.subtitle')}
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30 hover:bg-emerald-500/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                  {t('support.available')}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-2.5 bg-white/10 rounded-xl px-3.5 py-2.5">
                  <Mail className="w-4 h-4 text-blue-200 shrink-0" />
                  <span className="text-white text-sm font-medium truncate">
                    {t('support.email_to')}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 bg-white/10 rounded-xl px-3.5 py-2.5">
                  <Clock className="w-4 h-4 text-blue-200 shrink-0" />
                  <span className="text-white text-sm font-medium">
                    {t('support.response_time')}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Contact Form ─────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-5 h-5 text-[#1E40AF]" />
                <h3 className="font-semibold text-base">{t('support.send')}</h3>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  {t('support.name')}
                </label>
                <Input
                  type="text"
                  placeholder={t('support.name_placeholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleBlur('name', name)}
                  aria-invalid={!!(touched.name && errors.name)}
                  className="h-11 rounded-xl bg-muted/40 border-muted-foreground/15 focus-visible:border-[#1E40AF] focus-visible:ring-[#1E40AF]/20 transition-colors"
                />
                {renderError('name')}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  {t('support.email')}
                </label>
                <Input
                  type="email"
                  placeholder={t('support.email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email', email)}
                  aria-invalid={!!(touched.email && errors.email)}
                  className="h-11 rounded-xl bg-muted/40 border-muted-foreground/15 focus-visible:border-[#1E40AF] focus-visible:ring-[#1E40AF]/20 transition-colors"
                />
                {renderError('email')}
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  {t('support.subject')}
                </label>
                <Input
                  type="text"
                  placeholder={t('support.subject_placeholder')}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onBlur={() => handleBlur('subject', subject)}
                  aria-invalid={!!(touched.subject && errors.subject)}
                  className="h-11 rounded-xl bg-muted/40 border-muted-foreground/15 focus-visible:border-[#1E40AF] focus-visible:ring-[#1E40AF]/20 transition-colors"
                />
                {renderError('subject')}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  {t('support.message')}
                </label>
                <Textarea
                  placeholder={t('support.message_placeholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onBlur={() => handleBlur('message', message)}
                  aria-invalid={!!(touched.message && errors.message)}
                  rows={4}
                  className="rounded-xl bg-muted/40 border-muted-foreground/15 focus-visible:border-[#1E40AF] focus-visible:ring-[#1E40AF]/20 transition-colors resize-none min-h-[100px]"
                />
                {renderError('message')}
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={sending}
                className="w-full h-12 bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-semibold rounded-xl cursor-pointer mt-2 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2.5"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                      className="w-5 h-5 border-2.5 border-white border-t-transparent rounded-full"
                    />
                    <span>{t('support.sending')}</span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2.5"
                  >
                    <Send className="w-4.5 h-4.5" />
                    <span>{t('support.send')}</span>
                  </motion.div>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── FAQ Section ───────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Shield className="w-5 h-5 text-[#1E40AF]" />
              <h3 className="font-semibold text-base">{t('support.faq')}</h3>
            </div>

            <Card>
              <CardContent className="p-0">
                {faqItems.map((faq, index) => {
                  const isOpen = openFAQ === index;
                  return (
                    <div
                      key={index}
                      className={index > 0 ? 'border-t' : ''}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFAQ(index)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors cursor-pointer"
                        aria-expanded={isOpen}
                      >
                        <span className="text-sm font-medium text-foreground leading-snug">
                          {t(faq.questionKey)}
                        </span>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="shrink-0"
                        >
                          <ChevronDown className="w-4.5 h-4.5 text-muted-foreground" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{
                              height: 'auto',
                              opacity: 1,
                              transition: { duration: 0.25, ease: 'easeInOut' },
                            }}
                            exit={{
                              height: 0,
                              opacity: 0,
                              transition: { duration: 0.2, ease: 'easeInOut' },
                            }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4 pt-0">
                              <p className="text-sm text-muted-foreground leading-relaxed pl-1 border-l-2 border-[#1E40AF]/20">
                                {t(faq.answerKey)}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* ── Quick Contact Buttons ────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* Direct Email */}
              <Button
                variant="outline"
                onClick={handleDirectEmail}
                className="w-full h-11 rounded-xl border-[#1E40AF]/20 text-[#1E40AF] hover:bg-[#1E40AF]/5 cursor-pointer font-medium transition-all"
              >
                <Mail className="w-4.5 h-4.5" />
                <span className="flex-1 text-left">{t('support.email_to')}</span>
                <ChevronUp className="w-3.5 h-3.5 -rotate-90 text-muted-foreground" />
              </Button>

              {/* Back to Home */}
              <Button
                variant="outline"
                onClick={() => navigateTo('home')}
                className="w-full h-11 rounded-xl cursor-pointer font-medium transition-all"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
                <span className="flex-1 text-left">{t('common.cancel')}</span>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Footer ────────────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="mt-auto pt-4"
        >
          <p className="text-center text-xs text-muted-foreground">
            &copy; 2025 TRAIT &mdash; {t('support.available')}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
