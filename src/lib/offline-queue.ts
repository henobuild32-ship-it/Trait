const DB_NAME = 'trait-offline'
const DB_VERSION = 1
const STORE_NAME = 'pending-transactions'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export interface PendingTransaction {
  id?: number
  url: string
  method: string
  body: string
  headers: Record<string, string>
  createdAt: number
  retries: number
}

export async function savePendingTransaction(data: Omit<PendingTransaction, 'id' | 'createdAt' | 'retries'>) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.add({ ...data, createdAt: Date.now(), retries: 0 })
    return true
  } catch {
    return false
  }
}

export async function getPendingTransactions(): Promise<PendingTransaction[]> {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    return new Promise((resolve) => {
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

export async function removePendingTransaction(id: number) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(id)
  } catch {}
}

export async function syncPendingTransactions(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingTransactions()
  let synced = 0
  let failed = 0

  for (const ptx of pending) {
    try {
      const res = await fetch(ptx.url, {
        method: ptx.method,
        headers: { 'Content-Type': 'application/json', ...ptx.headers },
        body: ptx.body,
      })
      if (res.ok) {
        await removePendingTransaction(ptx.id!)
        synced++
      } else {
        failed++
      }
    } catch {
      failed++
    }
  }

  return { synced, failed }
}
