'use client'

import { useRef, useState } from 'react'
import { ArrowLeft, Download, Share2, Copy, Check, Smartphone, QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export default function MyQrCodeScreen() {
  const { user, goBack } = useAppStore()
  const svgRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [qrSize, setQrSize] = useState(240)

  const qrValue = user?.phone || user?.id || 'trait-user'

  const getDisplayName = () => {
    if (user?.pseudo) return user.pseudo
    if (user?.name) return user.name
    return user?.phone || 'Utilisateur'
  }

  const downloadQR = async () => {
    if (!svgRef.current) return
    const svgEl = svgRef.current.querySelector('svg')
    if (!svgEl) return

    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    canvas.width = qrSize * 2
    canvas.height = qrSize * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)

      canvas.toBlob((blob) => {
        if (!blob) return
        const link = document.createElement('a')
        link.download = `trait-qr-${user?.phone || user?.id}.png`
        link.href = URL.createObjectURL(blob)
        link.click()
        URL.revokeObjectURL(link.href)
        toast.success('QR Code téléchargé')
      }, 'image/png')
    }

    img.src = url
  }

  const handleShare = async () => {
    if (!svgRef.current) return
    const svgEl = svgRef.current.querySelector('svg')
    if (!svgEl) return

    const svgData = new XMLSerializer().serializeToString(svgEl)
    const canvas = document.createElement('canvas')
    canvas.width = qrSize * 2
    canvas.height = qrSize * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)

      canvas.toBlob(async (blob) => {
        if (!blob) return
        if (navigator.share && navigator.canShare({ files: [new File([blob], 'qrcode.png', { type: 'image/png' })] })) {
          await navigator.share({
            title: 'Mon QR Code TRAIT',
            text: `Scannez mon QR Code TRAIT pour m'envoyer de l'argent`,
            files: [new File([blob], 'qrcode.png', { type: 'image/png' })],
          })
        } else {
          await navigator.clipboard.writeText(qrValue)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
          toast.success('Identifiant copié !')
        }
      }, 'image/png')
    }
    img.src = url
  }

  const copyId = () => {
    navigator.clipboard.writeText(qrValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Identifiant copié !')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D5C63] to-[#083A3E]">
      <div className="flex items-center gap-3 p-4 pb-2">
        <button onClick={goBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white text-lg font-bold">Mon QR Code</h1>
      </div>

      <div className="flex flex-col items-center px-6 mt-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-4">
          <div ref={svgRef} className="bg-white rounded-xl p-4">
            <QRCodeSVG
              value={qrValue}
              size={qrSize}
              level="M"
              includeMargin
              fgColor="#0D5C63"
            />
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-white text-xl font-bold">{getDisplayName()}</p>
          <p className="text-white/60 text-sm mt-1">{user?.phone}</p>
          <button
            onClick={copyId}
            className="inline-flex items-center gap-1.5 text-xs text-[#14888F] mt-2 hover:underline"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié !' : 'Copier mon identifiant'}
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 w-full max-w-sm mb-6">
          <p className="text-white/60 text-xs text-center">
            Scannez ce QR Code avec l&apos;application TRAIT pour m&apos;envoyer de l&apos;argent instantanément
          </p>
        </div>
      </div>

      <div className="bg-white rounded-t-3xl mt-auto p-6 space-y-3">
        <Button
          className="w-full h-13 bg-[#0D5C63] hover:bg-[#083A3E] text-white rounded-xl shadow-lg text-base font-semibold flex items-center justify-center gap-2"
          onClick={downloadQR}
        >
          <Download className="w-5 h-5" />
          Télécharger le QR Code
        </Button>

        <Button
          variant="outline"
          className="w-full h-13 rounded-xl border-gray-200 text-gray-700 text-base font-semibold flex items-center justify-center gap-2"
          onClick={handleShare}
        >
          <Share2 className="w-5 h-5" />
          Partager le QR Code
        </Button>

        <div className="pt-2">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              Comment ça marche ?
            </p>
            <ol className="text-xs text-gray-500 space-y-1.5 list-decimal list-inside">
              <li>La personne ouvre l&apos;application TRAIT</li>
              <li>Elle clique sur &quot;Envoyer&quot; puis &quot;Scanner QR&quot;</li>
              <li>Elle scanne votre QR Code</li>
              <li>Le montant est directement envoyé sur votre compte</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
