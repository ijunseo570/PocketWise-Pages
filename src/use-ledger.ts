import { useEffect, useState } from 'react'
import type { Ledger } from './finance.ts'
import { localLedgerKey, readLocalLedger, saveLocalLedger } from './storage.ts'

type State = { ledger: Ledger; error: null } | { ledger: null; error: string }
export type Commit = (update: (current: Ledger) => Ledger, message: string) => Promise<string | null>

const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error)

function readState(): State {
  try {
    return { ledger: readLocalLedger(), error: null }
  } catch (error) {
    return { ledger: null, error: errorMessage(error) }
  }
}

export function useLedger() {
  const [state, setState] = useState(readState)
  const [notice, setNotice] = useState('')

  function refresh() {
    setState(readState())
  }

  useEffect(() => {
    function syncLocal(event: StorageEvent) {
      if (event.key === null || event.key === localLedgerKey) refresh()
    }
    window.addEventListener('storage', syncLocal)
    return () => window.removeEventListener('storage', syncLocal)
  }, [])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(''), 2800)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const commit: Commit = async (update, message) => {
    try {
      const save = () => {
        const ledger = update(readLocalLedger())
        saveLocalLedger(ledger)
        setState({ ledger, error: null })
      }
      if (navigator.locks) await navigator.locks.request(localLedgerKey, save)
      else save()
      setNotice(message)
      return null
    } catch (error) {
      return errorMessage(error)
    }
  }
  return { ...state, notice, commit, refresh }
}
