'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft } from 'lucide-react'

import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

export default function SellerRegisterScreen() {
  const { setUser, navigateTo, goBack } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    phone: '',
    location: '',
    businessType: '',
    password: '',
    confirmPassword: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.phone.startsWith('+243')) {
      toast.error("Erreur", { description: "Le numéro doit commencer par +243" })
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Erreur", { description: "Les mots de passe ne correspondent pas" })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/seller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
        toast("Succès", { description: "Inscription réussie! En attente de validation." })
        navigateTo('seller-pending')
      } else {
        toast.error("Erreur", { description: data.message })
      }
    } catch (error) {
      toast.error("Erreur", { description: "Une erreur s'est produite" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => goBack()} className="mr-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Devenir un fournisseur de services Trait
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom complet</Label>
          <Input id="name" name="name" required value={formData.name} onChange={handleChange} placeholder="Ex: Jean Dupont" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="businessName">Nom du commerce</Label>
          <Input id="businessName" name="businessName" required value={formData.businessName} onChange={handleChange} placeholder="Ex: Boutique La Grâce" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Numéro de téléphone (+243 obligatoire)</Label>
          <Input id="phone" name="phone" required value={formData.phone} onChange={handleChange} placeholder="+243..." />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Localisation (marché / ville)</Label>
          <Input id="location" name="location" required value={formData.location} onChange={handleChange} placeholder="Ex: Marché Central, Kinshasa" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessType">Type de produits vendus</Label>
          <Select onValueChange={(v) => setFormData(prev => ({...prev, businessType: v}))} required>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vetements">Vêtements & Mode</SelectItem>
              <SelectItem value="electronique">Électronique</SelectItem>
              <SelectItem value="alimentation">Alimentation</SelectItem>
              <SelectItem value="services">Services</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe sécurisé</Label>
          <Input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} />
        </div>

        <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-6 mt-4 hover:shadow-lg transition-all" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Créer mon compte service'}
        </Button>
      </form>
    </div>
  )
}
