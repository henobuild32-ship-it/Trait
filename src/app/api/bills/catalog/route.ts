import { NextResponse } from 'next/server'

const billers = [
  {
    id: 'snel',
    name: 'SNEL (Électricité)',
    operator: 'SNEL',
    fields: [
      { key: 'contractNumber', label: 'Numéro de contrat', type: 'text' },
      { key: 'amount', label: 'Montant (FC)', type: 'number' },
    ],
  },
  {
    id: 'regideso',
    name: 'REGIDESO (Eau)',
    operator: 'REGIDESO',
    fields: [
      { key: 'meterNumber', label: 'Numéro de compteur', type: 'text' },
      { key: 'amount', label: 'Montant (FC)', type: 'number' },
    ],
  },
  {
    id: 'internet',
    name: 'Internet / FAI',
    operator: 'FAI',
    fields: [
      {
        key: 'provider',
        label: 'Fournisseur',
        type: 'select',
        options: ['Orange Home', 'Airtel Home', 'Africell', 'RagaTech', 'Microlink'],
      },
      { key: 'clientCode', label: 'Code client', type: 'text' },
      { key: 'amount', label: 'Montant (FC)', type: 'number' },
    ],
  },
  {
    id: 'school',
    name: 'Frais scolaires',
    operator: 'École',
    fields: [
      { key: 'schoolName', label: "Nom de l'école", type: 'text' },
      { key: 'studentName', label: "Nom de l'élève", type: 'text' },
      { key: 'class', label: 'Classe', type: 'text' },
      { key: 'amount', label: 'Montant (FC)', type: 'number' },
    ],
  },
]

export async function GET() {
  try {
    return NextResponse.json({ success: true, billers })
  } catch (error) {
    console.error('Bills catalog error:', error)
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur' }, { status: 500 })
  }
}
