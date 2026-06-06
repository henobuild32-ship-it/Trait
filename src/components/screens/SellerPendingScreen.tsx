'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Clock, XCircle, AlertOctagon, Headphones, LogOut, ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

export function SellerPendingScreen() {
  const { user, setUser, navigateTo, logout } = useAppStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/auth/profile?userId=${user.id}`)
      const data = await res.json()
      if (data.success && data.user) {
        setUser({ ...user, ...data.user })
        if (data.user.validationStatus === 'validated') {
          toast({ title: 'Félicitations !', description: 'Votre compte vendeur a été validé.' })
          navigateTo('seller-dashboard' as any)
        } else if (data.user.validationStatus === 'rejected') {
          toast({ title: 'Demande refusée', description: 'Votre demande vendeur a été rejetée.', variant: 'destructive' })
        } else if (data.user.suspended) {
          toast({ title: 'Compte suspendu', description: 'Votre compte vendeur est suspendu.', variant: 'destructive' })
        } else {
          toast({ title: 'En attente', description: 'Votre demande est toujours en cours de validation.' })
        }
      }
    } catch (e) {
      toast({ title: 'Erreur', description: 'Impossible de rafraîchir le statut', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // If validation status is already validated on load, go straight to dashboard
  useEffect(() => {
    if (user && user.validationStatus === 'validated' && !user.suspended) {
      navigateTo('seller-dashboard' as any)
    }
  }, [user, navigateTo])

  if (!user) return null

  // Render Rejected State
  if (user.validationStatus === 'rejected') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-auto border border-red-100 text-center mt-20 space-y-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <XCircle className="w-10 h-10 text-red-650" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">
            Demande Refusée
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Votre demande de compte vendeur a été rejetée par l'administration.
          </p>
        </div>

        {user.validationRejectReason && (
          <div className="w-full p-4 bg-red-50 text-red-800 text-sm rounded-xl border border-red-200 text-left">
            <p className="font-bold mb-1">Motif du refus :</p>
            <p className="italic">{user.validationRejectReason}</p>
          </div>
        )}

        <div className="w-full space-y-2.5 pt-2">
          <Button 
            onClick={() => navigateTo('support')}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-6 flex items-center justify-center gap-2"
          >
            <Headphones className="w-5 h-5" />
            Contacter le support
          </Button>
          <Button 
            variant="outline"
            onClick={() => logout()}
            className="w-full border-gray-200 rounded-xl py-6 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <LogOut className="w-5 h-5" />
            Se déconnecter
          </Button>
        </div>
      </div>
    )
  }

  // Render Suspended State
  if (user.suspended) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-auto border border-amber-100 text-center mt-20 space-y-6">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
          <AlertOctagon className="w-10 h-10 text-amber-650" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-wide">
            Compte Suspendu
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Votre accès vendeur a été temporairement désactivé.
          </p>
        </div>

        {user.suspensionReason && (
          <div className="w-full p-4 bg-amber-50 text-amber-800 text-sm rounded-xl border border-amber-200 text-left">
            <p className="font-bold mb-1">Motif de suspension :</p>
            <p className="italic">{user.suspensionReason}</p>
          </div>
        )}

        <div className="w-full space-y-2.5 pt-2">
          <Button 
            onClick={() => navigateTo('support')}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-6 flex items-center justify-center gap-2"
          >
            <Headphones className="w-5 h-5" />
            Contacter le support
          </Button>
          <Button 
            variant="outline"
            onClick={() => logout()}
            className="w-full border-gray-200 rounded-xl py-6 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <LogOut className="w-5 h-5" />
            Se déconnecter
          </Button>
        </div>
      </div>
    )
  }

  // Render Normal Pending / On Hold State
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-auto border border-yellow-100 text-center mt-20">
      <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
        <Clock className="w-10 h-10 text-yellow-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 mb-4 uppercase tracking-wide">
        Attente de Validation Admin
      </h2>
      
      <p className="text-gray-600 mb-6 leading-relaxed">
        Votre demande de compte vendeur est en cours de vérification par l'administration Trait.
        L'accès peut prendre un moment. Veuillez actualiser pour voir si l'accès est autorisé.
      </p>

      {/* Admin Remarque/Comment if request is put on hold (pending but has validationRejectReason) */}
      {user.validationRejectReason && (
        <div className="w-full p-4 bg-amber-50 text-amber-800 text-xs border border-amber-200 rounded-xl mb-6 text-left">
          <p className="font-bold mb-1">Remarque de l'administrateur :</p>
          <p className="italic">{user.validationRejectReason}</p>
        </div>
      )}

      <div className="w-full space-y-2.5">
        <Button 
          onClick={handleRefresh}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser le statut
        </Button>
        <Button 
          variant="ghost"
          onClick={() => logout()}
          className="w-full rounded-xl py-6 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </Button>
      </div>
    </div>
  )
}
