'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Beaker,
  Key,
  Code2,
  Webhook,
  Shield,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Smartphone,
  Globe,
  Server,
  Wallet,
  Database,
  Mail,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Percent,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

type SectionId =
  | 'overview'
  | 'getting-started'
  | 'authentication'
  | 'sandbox'
  | 'endpoints'
  | 'testing'
  | 'webhooks'
  | 'fees'
  | 'production'

const SECTIONS: { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: BookOpen },
  { id: 'getting-started', label: 'Premiers pas', icon: Rocket },
  { id: 'authentication', label: 'Authentification', icon: Key },
  { id: 'sandbox', label: 'Bac à sable (Sandbox)', icon: Beaker },
  { id: 'endpoints', label: 'Endpoints API', icon: Server },
  { id: 'testing', label: 'Tester l\'API', icon: Code2 },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'fees', label: 'Frais (1,5%)', icon: Percent },
  { id: 'production', label: 'Passer en production', icon: Shield },
]

function Rocket({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative group">
      {label && <p className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</p>}
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-md bg-slate-700/50 hover:bg-slate-600 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => {
            navigator.clipboard.writeText(code)
            setCopied(true)
            toast.success('Copié !')
            setTimeout(() => setCopied(false), 2000)
          }}
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
      <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs leading-relaxed font-mono overflow-x-auto border border-slate-800">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function IntegrationGuideScreen() {
  const { navigateTo } = useAppStore()
  const [activeSection, setActiveSection] = useState<SectionId>('overview')
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [testAmount, setTestAmount] = useState('2500')
  const [testCurrency, setTestCurrency] = useState('FC')

  const scrollToSection = (id: SectionId) => {
    setActiveSection(id)
    const el = document.getElementById(`section-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const runTestPayment = async () => {
    setTestLoading(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/developers/test-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(testAmount) || 2500,
          currency: testCurrency,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setTestResult(JSON.stringify(data, null, 2))
        toast.success('Test réussi !')
      } else {
        setTestResult(JSON.stringify({ error: data.message || 'Erreur' }, null, 2))
        toast.error(data.message || 'Échec du test')
      }
    } catch {
      setTestResult(JSON.stringify({ error: 'Erreur réseau' }, null, 2))
      toast.error('Erreur réseau')
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigateTo('developer-register')}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Guide d&apos;intégration</h1>
            <p className="text-xs text-muted-foreground">TRAIT API v2.0</p>
          </div>
        </div>
        {/* Section tabs (horizontal scroll) */}
        <div className="flex gap-1 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollToSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeSection === s.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <s.icon className="size-3.5" />
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-6 pb-20 max-w-3xl mx-auto space-y-6">
        {/* ─── VUE D'ENSEMBLE ─── */}
        <section id="section-overview">
          <Card className="border-emerald-200 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50 to-slate-50 dark:from-emerald-950/30 dark:to-slate-900/50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40">
                  <BookOpen className="size-7 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Intégrer TRAIT à votre application</h2>
                  <p className="text-sm text-muted-foreground">Guide complet — du test à la production</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: Beaker, label: '1. Tester en sandbox', desc: 'Environnement de test gratuit' },
                  { icon: Code2, label: '2. Intégrer l\'API', desc: 'Documentation et exemples' },
                  { icon: Shield, label: '3. Production', desc: 'Clés live par email' },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-white dark:bg-slate-900 rounded-xl p-3 border border-border/50">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                      <step.icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{step.label}</p>
                      <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── PREMIERS PAS ─── */}
        <section id="section-getting-started">
          <Card className="border-border/70">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                  <Rocket className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Premiers pas</h3>
                  <p className="text-xs text-muted-foreground">Ce dont vous avez besoin pour commencer</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { n: '1', t: 'Créez votre compte développeur', d: 'Remplissez le formulaire d\'inscription développeur avec vos informations professionnelles.' },
                  { n: '2', t: 'Attendez la validation', d: 'L\'équipe TRAIT examine votre demande et approuve votre compte.' },
                  { n: '3', t: 'Recevez vos clés API', d: 'Une fois approuvé, l\'administrateur génère vos clés et vous les envoie par email.' },
                  { n: '4', t: 'Testez en sandbox', d: 'Utilisez les clés de test pour intégrer et valider vos appels API sans risque.' },
                  { n: '5', t: 'Passez en production', d: 'Remplacez les clés de test par les clés live pour traiter des transactions réelles.' },
                ].map((step) => (
                  <div key={step.n} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{step.n}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{step.t}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── AUTHENTIFICATION ─── */}
        <section id="section-authentication">
          <Card className="border-border/70">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                  <Key className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Authentification</h3>
                  <p className="text-xs text-muted-foreground">Comment sécuriser vos requêtes API</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>Chaque requête API doit inclure votre clé secrète dans l&apos;en-tête HTTP :</p>
                <CodeBlock code={`Authorization: Bearer sk_live_xxxxxxxxxxxxx`} label="En-tête d'authentification" />
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 space-y-2">
                  <p className="font-semibold text-foreground text-xs">Type de clés</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span><code className="font-mono bg-white dark:bg-slate-700 px-1 rounded">pk_</code> — Clé publique (côté client, sans risque)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span><code className="font-mono bg-white dark:bg-slate-700 px-1 rounded">sk_</code> — Clé secrète (jamais exposée côté client)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── SANDBOX ─── */}
        <section id="section-sandbox">
          <Card className="border-amber-200 dark:border-amber-800/40 bg-gradient-to-br from-amber-50 to-slate-50 dark:from-amber-950/30 dark:to-slate-900/50">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-600 flex items-center justify-center shrink-0">
                  <Beaker className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Bac à sable (Sandbox)</h3>
                  <p className="text-xs text-muted-foreground">Environnement de test isolé et gratuit</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>Le sandbox vous permet de tester toutes les fonctionnalités de l&apos;API sans utiliser d&apos;argent réel. Les transactions sont simulées.</p>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-border/50 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Clés de test Sandbox</p>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Clé publique test</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg p-2 font-mono">pk_test_a1b2c3d4e5f6g7h8i9j0k1l2</code>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { navigator.clipboard.writeText('pk_test_a1b2c3d4e5f6g7h8i9j0k1l2'); toast.success('Copié !'); }}>
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Clé secrète test</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg p-2 font-mono">sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { navigator.clipboard.writeText('sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'); toast.success('Copié !'); }}>
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-200 dark:border-amber-800/30">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <span>Les transactions sandbox utilisent des fonds fictifs. Activez le mode <code className="bg-white dark:bg-slate-800 px-1 rounded text-xs font-mono">sandbox: true</code> dans votre SDK.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── ENDPOINTS ─── */}
        <section id="section-endpoints">
          <Card className="border-border/70">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center shrink-0">
                  <Server className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Endpoints API</h3>
                  <p className="text-xs text-muted-foreground">Tous les endpoints disponibles</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { method: 'POST', path: '/v1/payments', desc: 'Créer un paiement', color: 'emerald' },
                  { method: 'GET', path: '/v1/payments/:id', desc: 'Récupérer un paiement', color: 'blue' },
                  { method: 'POST', path: '/v1/withdrawals', desc: 'Effectuer un retrait', color: 'emerald' },
                  { method: 'POST', path: '/v1/deposits', desc: 'Initier un dépôt', color: 'emerald' },
                  { method: 'POST', path: '/v1/transfers', desc: 'Transfert', color: 'emerald' },
                  { method: 'POST', path: '/v1/transfers/qr', desc: 'Paiement QR', color: 'emerald' },
                  { method: 'GET', path: '/v1/balance', desc: 'Consulter le solde', color: 'blue' },
                  { method: 'POST', path: '/v1/webhooks', desc: 'Configurer un webhook', color: 'purple' },
                ].map((ep) => (
                  <div key={ep.path} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 border border-border/50">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                      ep.method === 'POST' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                    }`}>{ep.method}</span>
                    <code className="text-xs font-mono text-foreground flex-1">{ep.path}</code>
                    <span className="text-xs text-muted-foreground">{ep.desc}</span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 space-y-1">
                <p className="text-xs font-semibold text-foreground">URL de base</p>
                <p className="text-xs"><span className="font-mono text-emerald-600">https://sandbox.trait.cd/api</span> <span className="text-muted-foreground">— Sandbox</span></p>
                <p className="text-xs"><span className="font-mono text-blue-600">https://api.trait.cd/v1</span> <span className="text-muted-foreground">— Production</span></p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── TESTER L'API ─── */}
        <section id="section-testing">
          <Card className="border-blue-200 dark:border-blue-800/40 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/30 dark:to-slate-900/50">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                  <Code2 className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Tester l&apos;API en direct</h3>
                  <p className="text-xs text-muted-foreground">Effectuez un appel de test vers le sandbox</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Montant</Label>
                  <Input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    className="h-10 text-sm mt-1"
                    placeholder="2500"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Devise</Label>
                  <select
                    value={testCurrency}
                    onChange={(e) => setTestCurrency(e.target.value)}
                    className="h-10 w-full mt-1 rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="FC">FC (Francs congolais)</option>
                    <option value="USD">USD (Dollars)</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={runTestPayment}
                disabled={testLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl gap-2"
              >
                {testLoading ? (
                  <><svg className="animate-spin size-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4" strokeDasharray="80" strokeDashoffset="60"/></svg> Test en cours...</>
                ) : (
                  <><Beaker className="size-4" /> Lancer le test</>
                )}
              </Button>
              {testResult && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">Résultat</p>
                  <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono overflow-x-auto max-h-48 border border-slate-800">
                    <code>{testResult}</code>
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="mt-4">
            <CodeBlock
              label="Exemple cURL"
              code={`curl -X POST https://sandbox.trait.cd/api/v1/payments \\
  -H "Authorization: Bearer sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 2500,
    "currency": "FC",
    "description": "Paiement test",
    "customer": { "email": "client@email.com" }
  }'`}
            />
          </div>
        </section>

        {/* ─── WEBHOOKS ─── */}
        <section id="section-webhooks">
          <Card className="border-border/70">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center shrink-0">
                  <Webhook className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Webhooks</h3>
                  <p className="text-xs text-muted-foreground">Recevez les notifications en temps réel</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>Configurez une URL de webhook pour recevoir les événements de paiement automatiquement.</p>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Événements disponibles</p>
                  <div className="space-y-1 text-xs">
                    <p><code className="text-emerald-600 font-mono bg-white dark:bg-slate-700 px-1 rounded">payment.completed</code> — Paiement réussi</p>
                    <p><code className="text-red-600 font-mono bg-white dark:bg-slate-700 px-1 rounded">payment.failed</code> — Paiement échoué</p>
                    <p><code className="text-blue-600 font-mono bg-white dark:bg-slate-700 px-1 rounded">withdrawal.completed</code> — Retrait effectué</p>
                    <p><code className="text-purple-600 font-mono bg-white dark:bg-slate-700 px-1 rounded">transfer.received</code> — Transfert reçu</p>
                  </div>
                </div>
                <CodeBlock
                  label="Exemple de payload webhook"
                  code={`{
  "event": "payment.completed",
  "data": {
    "id": "pay_abc123",
    "amount": 2500,
    "currency": "FC",
    "status": "completed",
    "customer": { "email": "client@email.com" },
    "timestamp": "2026-06-30T12:00:00Z"
  }
}`}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── FRAIS ─── */}
        <section id="section-fees">
          <Card className="border-amber-200 dark:border-amber-800/40">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-600 flex items-center justify-center shrink-0">
                  <Percent className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Frais d&apos;intégration</h3>
                  <p className="text-xs text-muted-foreground">Commission prélevée sur chaque transaction</p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border-2 border-amber-200 dark:border-amber-800/40 text-center space-y-2">
                <div className="text-5xl font-bold text-amber-600">1,5%</div>
                <p className="text-sm text-muted-foreground">par transaction traitée via votre intégration</p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <DollarSign className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span><strong>Exemple :</strong> Pour un paiement de 10 000 FC, la commission est de <strong>150 FC</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Wallet className="size-4 shrink-0 mt-0.5 text-blue-600" />
                  <span>La commission est prélevée automatiquement sur chaque transaction et versée sur votre compte développeur.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>Aucun frais caché. Pas d&apos;abonnement mensuel. Pas de frais d&apos;installation.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── PRODUCTION ─── */}
        <section id="section-production">
          <Card className="border-emerald-200 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50 to-slate-50 dark:from-emerald-950/30 dark:to-slate-900/50">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                  <Shield className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Passer en production</h3>
                  <p className="text-xs text-muted-foreground">Obtenez vos clés API de production</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>Une fois votre intégration testée et validée en sandbox, vous pouvez demander le passage en production.</p>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-border/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                      <Mail className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Réception des clés par email</p>
                      <p className="text-xs text-muted-foreground">L&apos;administrateur TRAIT vous envoie vos clés de production à l&apos;adresse email que vous avez fournie dans le formulaire d&apos;inscription.</p>
                    </div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 flex items-start gap-2">
                    <Shield className="size-4 shrink-0 mt-0.5 text-emerald-600" />
                    <div className="text-xs">
                      <p className="font-semibold text-foreground">Sécurisé</p>
                      <p className="text-muted-foreground">Les clés sont transmises de manière sécurisée. Ne les partagez jamais publiquement.</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800/30">
                  <Globe className="size-4 shrink-0 mt-0.5" />
                  <span>Après réception des clés, remplacez l&apos;URL de l&apos;API par <code className="bg-white dark:bg-slate-800 px-1 rounded font-mono">https://api.trait.cd/v1</code> et activez le mode production.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs text-muted-foreground">
            TRAIT API <span className="font-bold">v2.0</span> — Guide d&apos;intégration
          </p>
          <Button
            variant="link"
            className="text-xs text-[#14888F] mt-1"
            onClick={() => navigateTo('developer-register')}
          >
            ← Retour à l&apos;inscription développeur
          </Button>
        </div>
      </main>
    </div>
  )
}
