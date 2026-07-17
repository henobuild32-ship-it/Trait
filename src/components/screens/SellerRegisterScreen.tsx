'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft, Store, Check, Eye, EyeOff } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

const countryCodes = [
  { code: '+228', label: '+228', country: 'Togo' },
  { code: '+229', label: '+229', country: 'Bénin' },
  { code: '+225', label: '+225', country: "Côte d'Ivoire" },
  { code: '+224', label: '+224', country: 'Guinée' },
  { code: '+237', label: '+237', country: 'Cameroun' },
  { code: '+243', label: '+243', country: 'RDC' },
  { code: '+221', label: '+221', country: 'Sénégal' },
  { code: '+223', label: '+223', country: 'Mali' },
  { code: '+226', label: '+226', country: 'Burkina Faso' },
  { code: '+234', label: '+234', country: 'Nigeria' },
  { code: '+233', label: '+233', country: 'Ghana' },
  { code: '+1', label: '+1', country: 'US/CA' },
  { code: '+33', label: '+33', country: 'France' },
]

const cities = [
  'Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kisangani', 'Bukavu',
  'Goma', 'Kolwezi', 'Likasi', 'Boma', 'Tshikapa',
  'Lomé', 'Cotonou', 'Abidjan', 'Douala', 'Yaoundé',
  'Dakar', 'Bamako', 'Ouagadougou', 'Conakry', 'Abuja',
  'Accra', 'Lagos', 'Paris', 'New York',
]

const businessTypes = [
  { value: 'vetements', label: 'Vêtements & Mode' },
  { value: 'electronique', label: 'Électronique' },
  { value: 'alimentation', label: 'Alimentation & Épicerie' },
  { value: 'services', label: 'Services (coiffure, réparation, etc.)' },
  { value: 'artisanat', label: 'Artisanat & Création' },
  { value: 'agriculture', label: 'Agriculture & Produits frais' },
  { value: 'immobilier', label: 'Immobilier & Logement' },
  { value: 'transport', label: 'Transport & Livraison' },
  { value: 'sante', label: 'Santé & Bien-être' },
  { value: 'education', label: 'Éducation & Formation' },
  { value: 'restauration', label: 'Restauration & Alimentation' },
  { value: 'technologie', label: 'Technologie & IT' },
  { value: 'autre', label: 'Autre' },
]

export default function SellerRegisterScreen() {
  const { setUser, navigateTo, goBack } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    countryCode: '+243',
    phone: '',
    city: '',
    address: '',
    businessName: '',
    businessType: '',
    location: '',
    password: '',
    confirmPassword: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanedPhone = formData.phone.replace(/\s/g, '')

    if (!formData.name.trim()) {
      toast.error('Veuillez entrer votre nom complet')
      return
    }
    if (!formData.email.trim()) {
      toast.error('Veuillez entrer votre adresse email')
      return
    }
    if (!cleanedPhone || cleanedPhone.length < 6) {
      toast.error('Veuillez entrer un numéro de téléphone valide')
      return
    }
    if (!formData.businessName.trim()) {
      toast.error('Veuillez entrer le nom de votre commerce')
      return
    }
    if (!formData.businessType) {
      toast.error('Veuillez sélectionner le type de produits')
      return
    }
    if (!formData.city.trim()) {
      toast.error('Veuillez sélectionner votre ville')
      return
    }
    if (!formData.location.trim()) {
      toast.error('Veuillez entrer votre localisation (marché/quartier)')
      return
    }
    if (!formData.password.trim() || formData.password.trim().length < 4) {
      toast.error('Le mot de passe doit contenir au moins 4 caractères')
      return
    }
    if (formData.password.trim() !== formData.confirmPassword.trim()) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    if (!acceptTerms) {
      toast.error('Veuillez accepter les conditions d\'utilisation')
      return
    }

    const fullPhone = `${formData.countryCode}${cleanedPhone}`

    setLoading(true)
    try {
      const res = await fetch('/api/seller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: fullPhone,
          city: formData.city,
          address: formData.address.trim(),
          businessName: formData.businessName.trim(),
          businessType: formData.businessType,
          location: formData.location.trim(),
          password: formData.password.trim(),
        }),
      })

      const data = await res.json()
      if (data.success) {
        if (data.user) setUser(data.user)
        toast.success('Inscription réussie ! En attente de validation par l\'administrateur.')
        navigateTo('seller-pending')
      } else {
        toast.error(data.message || 'Erreur lors de l\'inscription')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center px-4 py-4"
      >
        <Button variant="ghost" size="icon" onClick={() => navigateTo('auth')} className="rounded-full cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="ml-3">
          <h1 className="text-lg font-bold text-foreground">Devenir fournisseur</h1>
          <p className="text-xs text-muted-foreground">Inscription Service / Vendeur</p>
        </div>
      </motion.header>

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 flex flex-col px-6 pb-8 overflow-y-auto"
      >
        {/* Info card */}
        <div className="mb-6 bg-gradient-to-r from-pink-50 to-pink-100/50 border border-pink-200 rounded-xl px-4 py-3.5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center shrink-0 mt-0.5">
            <Store className="w-5 h-5 text-pink-600" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-pink-800 font-semibold">Validation requise</p>
            <ul className="text-xs text-pink-700 space-y-0.5">
              <li>• Les comptes Service doivent être validés manuellement par les administrateurs.</li>
              <li>• Après validation, vous pourrez gérer vos produits et recevoir des paiements.</li>
              <li>• Remplissez tous les champs pour faciliter votre validation.</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Identity section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-pink-500 rounded-full inline-block" />
              Identité
            </h3>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-foreground font-medium">Nom complet <span className="text-red-500">*</span></Label>
                <Input id="name" name="name" required value={formData.name} onChange={handleChange} placeholder="Ex: Jean Dupont" className="h-12 text-base" disabled={loading} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-foreground font-medium">Adresse email <span className="text-red-500">*</span></Label>
                <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="Ex: fournisseur@email.com" className="h-12 text-base" disabled={loading} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="phone" className="text-foreground font-medium">Téléphone <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Select value={formData.countryCode} onValueChange={(v) => setFormData(prev => ({...prev, countryCode: v}))}>
                    <SelectTrigger className="w-[100px] shrink-0">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map((item) => (
                        <SelectItem key={item.code + item.country} value={item.code}>
                          <span className="text-xs">{item.code} {item.country}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="Ex: 810000001" className="flex-1 h-12 text-base" disabled={loading} />
                </div>
              </div>
            </div>
          </div>

          {/* Business section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-pink-500 rounded-full inline-block" />
              Informations du commerce
            </h3>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="businessName" className="text-foreground font-medium">Nom du commerce <span className="text-red-500">*</span></Label>
                <Input id="businessName" name="businessName" required value={formData.businessName} onChange={handleChange} placeholder="Ex: Boutique La Grâce" className="h-12 text-base" disabled={loading} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="businessType" className="text-foreground font-medium">Type de produits vendus <span className="text-red-500">*</span></Label>
                <Select onValueChange={(v) => setFormData(prev => ({...prev, businessType: v}))} required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((bt) => (
                      <SelectItem key={bt.value} value={bt.value}>{bt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-pink-500 rounded-full inline-block" />
              Localisation
            </h3>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="city" className="text-foreground font-medium">Ville <span className="text-red-500">*</span></Label>
                <Select onValueChange={(v) => setFormData(prev => ({...prev, city: v}))} required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Sélectionnez votre ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="location" className="text-foreground font-medium">Marché / Quartier / Adresse <span className="text-red-500">*</span></Label>
                <Input id="location" name="location" required value={formData.location} onChange={handleChange} placeholder="Ex: Marché Central, Avenue de la Libération" className="h-12 text-base" disabled={loading} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="address" className="text-foreground font-medium">Adresse complète (optionnelle)</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Ex: 15, Avenue Kabila, Commune de la Gombe" className="h-12 text-base" disabled={loading} />
              </div>
            </div>
          </div>

          {/* Password section */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-pink-500 rounded-full inline-block" />
              Sécurité
            </h3>

            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-foreground font-medium">Mot de passe <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={formData.password} onChange={handleChange} placeholder="Minimum 4 caractères" className="w-full h-12 text-base pr-12" disabled={loading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirmer le mot de passe <span className="text-red-500">*</span></Label>
                <Input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} required value={formData.confirmPassword} onChange={handleChange} placeholder="Retapez votre mot de passe" className="h-12 text-base" disabled={loading} />
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3 mt-1 p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/30 rounded-lg">
            <button
              type="button"
              onClick={() => setAcceptTerms(!acceptTerms)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                acceptTerms ? 'bg-pink-500 border-pink-500' : 'border-gray-300 hover:border-pink-500/50'
              }`}
            >
              {acceptTerms && <Check className="w-3 h-3 text-white" />}
            </button>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-foreground font-medium">
                J&apos;accepte les{' '}
                <button type="button" onClick={(e) => { e.preventDefault(); window.open('/terms', '_blank') }} className="text-pink-500 hover:underline font-semibold cursor-pointer">
                  Conditions Générales d&apos;Utilisation
                </button>
              </p>
              <p className="text-[11px] text-muted-foreground">En cochant cette case, vous reconnaissez avoir lu et accepté nos conditions.</p>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading || !formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.businessName.trim() || !formData.businessType || !formData.city.trim() || !formData.location.trim() || !formData.password.trim() || !formData.confirmPassword.trim() || !acceptTerms}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl shadow-lg shadow-pink-500/20 disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Inscription en cours...</>
            ) : (
              'Créer mon compte service'
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Vous avez déjà un compte ?{' '}
          <button type="button" onClick={() => navigateTo('auth')} className="font-semibold text-pink-500 hover:underline cursor-pointer">
            Se connecter
          </button>
        </p>
      </motion.main>
    </div>
  )
}
