import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem('pwa-install-dismissed')) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === 'accepted') {
      setShow(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    sessionStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!show) return null

  return (
    <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-50 p-4">
      <div
        className="max-w-lg mx-auto bg-cast-iron text-cream rounded-t-xl rounded-b-xl lg:rounded-b-none
          p-4 shadow-lg flex items-center gap-4"
      >
        <Download className="w-6 h-6 text-honey shrink-0" />
        <p className="flex-1 text-sm font-body">
          Add Sunday Dinner Memories to your home screen for the full experience
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="bg-sienna text-flour px-4 py-2 rounded-lg text-sm font-body font-semibold
              hover:bg-sienna/90 transition-colors"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-cream/50 hover:text-cream hover:bg-white/10 transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
