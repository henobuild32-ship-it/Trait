'use client';

import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionReceiptProps {
  transaction: {
    id: string;
    type: string;
    amount: number;
    fee: number;
    currency: string;
    status: string;
    description: string;
    createdAt: string;
    sender?: { name?: string; phone?: string };
    receiver?: { name?: string; phone?: string };
  };
  userName?: string;
}

function formatCurrency(amount: number, currency: string) {
  return currency === 'FC' ? `${amount.toLocaleString('fr-FR')} FC` : `$${amount.toFixed(2)}`;
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    send: 'Envoi',
    receive: 'Réception',
    deposit: 'Dépôt',
    withdrawal: 'Retrait',
    qr_payment: 'Paiement QR',
    international_transfer: 'Transfert International',
    barter: 'Barter',
    card_payment: 'Paiement Carte',
  };
  return labels[type] || type;
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    completed: 'Terminé',
    pending: 'En attente',
    failed: 'Échoué',
    processing: 'En cours',
  };
  return labels[status] || status;
}

export function TransactionReceipt({ transaction, userName }: TransactionReceiptProps) {
  const [generating, setGenerating] = useState(false);

  function generateReceipt() {
    setGenerating(true);

    const receiptHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reçu TRAIT - ${transaction.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #f5f5f5; padding: 20px; }
    .receipt { max-width: 400px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0; }
    .logo { font-size: 28px; font-weight: 800; color: #0D5C63; letter-spacing: -1px; }
    .subtitle { font-size: 12px; color: #888; margin-top: 4px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 12px; }
    .status.completed { background: #ECFDF5; color: #059669; }
    .status.pending { background: #FFFBEB; color: #D97706; }
    .status.failed { background: #FEF2F2; color: #DC2626; }
    .amount-section { text-align: center; margin: 24px 0; }
    .amount-label { font-size: 13px; color: #888; margin-bottom: 4px; }
    .amount { font-size: 36px; font-weight: 800; color: #111; }
    .amount.negative { color: #DC2626; }
    .amount.positive { color: #059669; }
    .details { margin-top: 20px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
    .row:last-child { border-bottom: none; }
    .label { font-size: 13px; color: #888; }
    .value { font-size: 13px; font-weight: 600; color: #333; text-align: right; max-width: 60%; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 2px solid #f0f0f0; text-align: center; }
    .footer-text { font-size: 11px; color: #aaa; }
    .footer-id { font-size: 10px; color: #ccc; margin-top: 4px; word-break: break-all; }
    @media print { body { background: white; padding: 0; } .receipt { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo">TRAIT</div>
      <div class="subtitle">Reçu de transaction</div>
      <div class="status ${transaction.status}">${getStatusLabel(transaction.status)}</div>
    </div>

    <div class="amount-section">
      <div class="amount-label">${getTypeLabel(transaction.type)}</div>
      <div class="amount ${['send', 'withdrawal', 'qr_payment'].includes(transaction.type) ? 'negative' : 'positive'}">
        ${['send', 'withdrawal', 'qr_payment'].includes(transaction.type) ? '-' : '+'}${formatCurrency(transaction.amount, transaction.currency)}
      </div>
    </div>

    <div class="details">
      <div class="row">
        <span class="label">Type</span>
        <span class="value">${getTypeLabel(transaction.type)}</span>
      </div>
      <div class="row">
        <span class="label">Montant</span>
        <span class="value">${formatCurrency(transaction.amount, transaction.currency)}</span>
      </div>
      ${transaction.fee > 0 ? `
      <div class="row">
        <span class="label">Frais</span>
        <span class="value">${formatCurrency(transaction.fee, transaction.currency)}</span>
      </div>` : ''}
      <div class="row">
        <span class="label">Devise</span>
        <span class="value">${transaction.currency}</span>
      </div>
      ${transaction.sender ? `
      <div class="row">
        <span class="label">Expéditeur</span>
        <span class="value">${transaction.sender.name || transaction.sender.phone || 'N/A'}</span>
      </div>` : ''}
      ${transaction.receiver ? `
      <div class="row">
        <span class="label">Bénéficiaire</span>
        <span class="value">${transaction.receiver.name || transaction.receiver.phone || 'N/A'}</span>
      </div>` : ''}
      <div class="row">
        <span class="label">Date</span>
        <span class="value">${new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeStyle: 'short' }).format(new Date(transaction.createdAt))}</span>
      </div>
      ${transaction.description ? `
      <div class="row">
        <span class="label">Description</span>
        <span class="value">${transaction.description}</span>
      </div>` : ''}
    </div>

    <div class="footer">
      <div class="footer-text">Merci d'utiliser TRAIT</div>
      <div class="footer-id">ID: ${transaction.id}</div>
    </div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.print();
    }

    setGenerating(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1 text-xs"
      onClick={generateReceipt}
      disabled={generating}
    >
      <FileText className="h-3.5 w-3.5" />
      Reçu
    </Button>
  );
}
