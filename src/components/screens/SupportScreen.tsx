'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft, Headphones, Mail, User, MessageSquare, Send, Clock, ChevronDown, ChevronUp, Shield, CheckCircle, Globe, Plus, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { useTranslation } from '@/lib/i18n'

interface Ticket {
  id: string
  subject: string
  category: string
  message: string
  priority: string
  status: string
  createdAt: string
  messages?: TicketMessage[]
}

interface TicketMessage {
  id: string
  message: string
  senderId: string
  createdAt: string
}

const statusLabels: Record<string, { label: string; class: string }> = {
  open: { label: 'Ouvert', class: 'bg-blue-100 text-blue-700' },
  waiting_response: { label: 'En attente', class: 'bg-amber-100 text-amber-700' },
  replied: { label: 'Répondu', class: 'bg-green-100 text-green-700' },
  closed: { label: 'Fermé', class: 'bg-gray-100 text-gray-700' },
}

export default function SupportScreen() {
  const { goBack, user, navigateTo } = useAppStore()
  const { t } = useTranslation()
  const [view, setView] = useState<'list' | 'new' | 'detail'>('list')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('general')
  const [message, setMessage] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (view === 'list') fetchTickets()
  }, [view])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/support')
      const data = await res.json()
      if (data.success) setTickets(data.tickets || [])
    } catch { toast.error('Erreur de chargement') }
    setLoading(false)
  }

  const handleCreateTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), category, message: message.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Message envoyé !')
        setSubject('')
        setMessage('')
        setCategory('general')
        setView('list')
        fetchTickets()
      } else {
        toast.error(data.message || 'Erreur')
      }
    } catch { toast.error('Erreur de connexion') }
    setSending(false)
  }

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return
    setSending(true)
    try {
      const res = await fetch('/api/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: selectedTicket.id, message: replyMessage.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Réponse envoyée')
        setReplyMessage('')
        fetchTicketDetail(selectedTicket.id)
      } else {
        toast.error(data.message || 'Erreur')
      }
    } catch { toast.error('Erreur de connexion') }
    setSending(false)
  }

  const fetchTicketDetail = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/support?ticketId=${ticketId}`)
      const data = await res.json()
      if (data.success && data.ticket) {
        setSelectedTicket(data.ticket)
      }
    } catch {}
  }

  const openTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setView('detail')
    fetchTicketDetail(ticket.id)
  }

  const goToList = () => {
    setView('list')
    setSelectedTicket(null)
    fetchTickets()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={view === 'list' ? goBack : view === 'detail' ? goToList : () => setView('list')} className="shrink-0">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0D5C63] to-[#14888F] flex items-center justify-center shadow-md">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold">{view === 'new' ? 'Nouveau ticket' : view === 'detail' ? selectedTicket?.subject || 'Ticket' : 'Support'}</h1>
          </div>
          {view === 'list' && (
            <Button variant="ghost" size="sm" onClick={() => { fetchTickets(); toast.success('Actualisé') }}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 px-4 py-5 pb-8">
        {view === 'list' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Button
              onClick={() => setView('new')}
              className="w-full h-13 bg-[#0D5C63] hover:bg-[#083A3E] text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Nouveau message
            </Button>

            {loading ? (
              <div className="space-y-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl bg-card border space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <Card className="mt-4">
                <CardContent className="flex flex-col items-center py-12">
                  <span className="text-5xl mb-4">💬</span>
                  <p className="font-medium text-foreground">Aucun ticket</p>
                  <p className="text-sm text-muted-foreground mt-1">Créez un ticket pour contacter le support</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 mt-4">
                {tickets.map((ticket) => {
                  const st = statusLabels[ticket.status] || statusLabels.open
                  return (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-xl bg-card border cursor-pointer hover:bg-accent/50 transition-all active:scale-[0.98]"
                      onClick={() => openTicket(ticket)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ticket.message}</p>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ticket.createdAt))}
                          </p>
                        </div>
                        <Badge className={`${st.class} border-0 text-[10px] shrink-0`}>{st.label}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {view === 'new' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Catégorie</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 rounded-xl bg-muted/40 border border-muted-foreground/15 px-3 text-sm focus:border-[#0D5C63] outline-none"
                  >
                    <option value="general">Question générale</option>
                    <option value="transaction">Problème de transaction</option>
                    <option value="account">Problème de compte</option>
                    <option value="card">Problème de carte</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Sujet</label>
                  <Input
                    placeholder="Objet de votre message"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-11 rounded-xl bg-muted/40 border-muted-foreground/15 focus-visible:border-[#0D5C63]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Décrivez votre problème..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="rounded-xl bg-muted/40 border-muted-foreground/15 focus-visible:border-[#0D5C63] resize-none"
                  />
                </div>

                <Button
                  onClick={handleCreateTicket}
                  disabled={sending || !subject.trim() || !message.trim()}
                  className="w-full h-12 bg-[#0D5C63] hover:bg-[#083A3E] text-white font-semibold rounded-xl shadow-lg disabled:opacity-50"
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Envoyer
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {view === 'detail' && selectedTicket && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {(() => {
              const st = statusLabels[selectedTicket.status] || statusLabels.open
              return (
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h2 className="font-bold text-lg">{selectedTicket.subject}</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(selectedTicket.createdAt))}
                        </p>
                      </div>
                      <Badge className={`${st.class} border-0`}>{st.label}</Badge>
                    </div>

                    <div className="space-y-4 mt-4">
                      <div className="bg-muted/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-[#0D5C63]" />
                          <span className="text-xs font-medium text-[#0D5C63]">Vous</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selectedTicket.createdAt))}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTicket.message}</p>
                      </div>

                      {(selectedTicket.messages || []).filter(m => m.id !== selectedTicket.id).map((msg) => (
                        <div key={msg.id} className="bg-[#0D5C63]/5 rounded-xl p-4 border border-[#0D5C63]/10">
                          <div className="flex items-center gap-2 mb-2">
                            <Headphones className="w-4 h-4 text-[#0D5C63]" />
                            <span className="text-xs font-medium text-[#0D5C63]">
                              {msg.senderId === user?.id ? 'Vous' : 'Support TRAIT'}
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(msg.createdAt))}
                            </span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      ))}
                    </div>

                    {selectedTicket.status !== 'closed' && (
                      <div className="mt-6 space-y-3">
                        <Textarea
                          placeholder="Votre réponse..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          rows={3}
                          className="rounded-xl bg-muted/40 border-muted-foreground/15 focus-visible:border-[#0D5C63] resize-none"
                        />
                        <Button
                          onClick={handleReply}
                          disabled={sending || !replyMessage.trim()}
                          className="w-full h-12 bg-[#0D5C63] hover:bg-[#083A3E] text-white font-semibold rounded-xl disabled:opacity-50"
                        >
                          {sending ? 'Envoi...' : 'Répondre'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })()}
          </motion.div>
        )}
      </div>
    </div>
  )
}
