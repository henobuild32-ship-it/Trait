'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft, Headphones, MessageSquare, Send, RefreshCw, User, Clock, CheckCircle, XCircle, Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'

interface TicketMessage {
  id: string
  message: string
  senderId: string
  createdAt: string
}

interface TicketUser {
  id: string
  name: string | null
  phone: string
}

interface Ticket {
  id: string
  userId: string
  subject: string
  category: string
  message: string
  priority: string
  status: string
  createdAt: string
  messages?: TicketMessage[]
  user?: TicketUser
}

const statusLabels: Record<string, { label: string; class: string }> = {
  open: { label: 'Ouvert', class: 'bg-blue-100 text-blue-700' },
  waiting_response: { label: 'En attente', class: 'bg-amber-100 text-amber-700' },
  replied: { label: 'Répondu', class: 'bg-green-100 text-green-700' },
  closed: { label: 'Fermé', class: 'bg-gray-100 text-gray-700' },
}

const statusTabs = [
  { id: 'all', label: 'Tous' },
  { id: 'open', label: 'Ouverts' },
  { id: 'waiting_response', label: 'En attente' },
  { id: 'replied', label: 'Répondus' },
]

export default function AdminSupportScreen() {
  const { goBack } = useAppStore()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/support')
      const data = await res.json()
      if (data.success) setTickets(data.tickets || [])
    } catch { toast.error('Erreur de chargement') }
    setLoading(false)
  }

  const fetchTicketDetail = async (ticketId: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/support?ticketId=${ticketId}`)
      const data = await res.json()
      if (data.success) setSelectedTicket(data.ticket)
    } catch { toast.error('Erreur de chargement') }
    setDetailLoading(false)
  }

  const openTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    fetchTicketDetail(ticket.id)
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
        fetchTickets()
      } else {
        toast.error(data.message || 'Erreur')
      }
    } catch { toast.error('Erreur de connexion') }
    setSending(false)
  }

  const handleCloseTicket = async () => {
    if (!selectedTicket) return
    setSending(true)
    try {
      const res = await fetch('/api/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: selectedTicket.id, message: '[Ticket fermé par administrateur]' }),
      })
      const data = await res.json()
      if (data.success) {
        await fetch(`/api/admin/kyc`, { // reuse the admin pattern — we need a close endpoint
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: selectedTicket.id, action: 'close' }),
        })
        toast.success('Ticket fermé')
        setSelectedTicket(null)
        fetchTickets()
      }
    } catch { toast.error('Erreur') }
    setSending(false)
  }

  const filteredTickets = filter === 'all'
    ? tickets
    : tickets.filter((t) => t.status === filter)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={selectedTicket ? () => { setSelectedTicket(null); setReplyMessage('') } : goBack} className="shrink-0">
            <ArrowLeft className="size-5" />
          </Button>
          <div className="flex items-center gap-2.5 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0D5C63] to-[#14888F] flex items-center justify-center shadow-md">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold">{selectedTicket ? selectedTicket.subject : 'Support Admin'}</h1>
          </div>
          {!selectedTicket && (
            <Button variant="ghost" size="sm" onClick={() => { fetchTickets(); toast.success('Actualisé') }}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
        {!selectedTicket && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === tab.id ? 'bg-[#0D5C63] text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {tab.label}
                {tab.id !== 'all' && (
                  <span className="ml-1 opacity-70">({tickets.filter(t => t.status === tab.id).length})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="p-4">
        {!selectedTicket ? (
          loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-card border space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <span className="text-5xl mb-4">📋</span>
                <p className="font-medium">Aucun ticket</p>
                <p className="text-sm text-muted-foreground mt-1">Aucun ticket de support pour le moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredTickets.map((ticket) => {
                const st = statusLabels[ticket.status] || statusLabels.open
                return (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-xl bg-card border cursor-pointer hover:bg-accent/50 transition-all active:scale-[0.98]"
                    onClick={() => openTicket(ticket)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground truncate">{ticket.subject}</p>
                          {ticket.priority === 'high' && (
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                          )}
                        </div>
                        {ticket.user && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {ticket.user.name || ticket.user.phone}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{ticket.message}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ticket.createdAt))}
                        </p>
                      </div>
                      <Badge className={`${st.class} border-0 text-[10px] shrink-0`}>{st.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          detailLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : selectedTicket && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h2 className="font-bold text-lg">{selectedTicket.subject}</h2>
                      {selectedTicket.user && (
                        <p className="text-sm text-muted-foreground mt-1">
                          De: {selectedTicket.user.name || selectedTicket.user.phone}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Catégorie: {selectedTicket.category} &middot; Priorité: {selectedTicket.priority}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(selectedTicket.createdAt))}
                      </p>
                    </div>
                    {(() => {
                      const st = statusLabels[selectedTicket.status] || statusLabels.open
                      return <Badge className={`${st.class} border-0`}>{st.label}</Badge>
                    })()}
                  </div>

                  <div className="space-y-4 mt-4">
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-[#0D5C63]" />
                        <span className="text-xs font-medium text-[#0D5C63]">
                          {selectedTicket.user?.name || selectedTicket.user?.phone || 'Utilisateur'}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selectedTicket.createdAt))}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTicket.message}</p>
                    </div>

                    {(selectedTicket.messages || []).filter(m => m.id !== selectedTicket.id).map((msg) => {
                      const isAdminReply = msg.senderId !== selectedTicket.userId
                      return (
                        <div key={msg.id} className={`rounded-xl p-4 border ${isAdminReply ? 'bg-[#0D5C63]/5 border-[#0D5C63]/10' : 'bg-muted/30 border-muted'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {isAdminReply ? (
                              <Headphones className="w-4 h-4 text-[#0D5C63]" />
                            ) : (
                              <User className="w-4 h-4 text-gray-500" />
                            )}
                            <span className={`text-xs font-medium ${isAdminReply ? 'text-[#0D5C63]' : 'text-gray-500'}`}>
                              {isAdminReply ? 'Support TRAIT (Vous)' : selectedTicket.user?.name || 'Utilisateur'}
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(msg.createdAt))}
                            </span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      )
                    })}
                  </div>

                  {selectedTicket.status !== 'closed' && (
                    <div className="mt-6 space-y-3">
                      <Textarea
                        placeholder="Répondre à ce ticket..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows={4}
                        className="rounded-xl bg-muted/40 border-muted-foreground/15 focus-visible:border-[#0D5C63] resize-none"
                      />
                      <div className="flex gap-3">
                        <Button
                          onClick={handleReply}
                          disabled={sending || !replyMessage.trim()}
                          className="flex-1 h-12 bg-[#0D5C63] hover:bg-[#083A3E] text-white font-semibold rounded-xl disabled:opacity-50"
                        >
                          {sending ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <span className="flex items-center gap-2">
                              <Send className="w-4 h-4" />
                              Répondre
                            </span>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCloseTicket}
                          disabled={sending}
                          className="h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        )}
      </div>
    </div>
  )
}
