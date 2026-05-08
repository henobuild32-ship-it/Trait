'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';

export default function AuthRoleScreen() {
  const { navigateTo, setSelectedRole, selectedRole } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center px-4 py-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateTo('welcome')}
          className="rounded-full hover:bg-emerald-50 cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Button>
      </motion.header>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 flex flex-col px-6 pt-4 pb-8"
      >
        <div className="flex flex-col items-center gap-2 mb-8">
          <h1 className="text-2xl font-bold text-foreground">Bienvenue</h1>
          <p className="text-muted-foreground text-center">Choisissez votre type de compte</p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Client option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedRole === 'client'
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-200'
                  : ' hover:border-emerald-200'
              }`}
              onClick={() => setSelectedRole('client')}
            >
              <CardContent className="p-6 flex flex-col items-center gap-3">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  selectedRole === 'client'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <User className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">Client</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Envoyez, recevez et gérez votre argent
                  </p>
                </div>
                {selectedRole === 'client' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"
                  >
                    <span className="text-white text-xs font-bold">✓</span>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Agent option */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedRole === 'agent'
                  ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-200'
                  : ' hover:border-amber-200'
              }`}
              onClick={() => setSelectedRole('agent')}
            >
              <CardContent className="p-6 flex flex-col items-center gap-3">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  selectedRole === 'agent'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-100 text-amber-600'
                }`}>
                  <Building2 className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">Agent</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Déposez et validez pour vos clients
                  </p>
                </div>
                {selectedRole === 'agent' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"
                  >
                    <span className="text-white text-xs font-bold">✓</span>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Continue button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Button
            onClick={() => navigateTo('auth-phone')}
            className="w-full h-13 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 cursor-pointer"
            size="lg"
          >
            Continuer
          </Button>
        </motion.div>

        {/* Login link */}
        <div className="mt-4 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Vous avez déjà un compte ?{' '}
            <button
              onClick={() => navigateTo('auth-login')}
              className="font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-2 cursor-pointer"
            >
              Se connecter
            </button>
          </p>
        </div>
      </motion.main>
    </div>
  );
}
