import { useEffect, useRef } from 'react'
import { detectPinterestEmbed } from '../lib/pinterest'

declare global {
  interface Window {
    PinUtils?: { build?: () => void }
  }
}

let scriptPromise: Promise<void> | null = null
function loadPinterestScript(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve) => {
    if (document.getElementById('pinterest-pinit-js')) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.id = 'pinterest-pinit-js'
    script.src = 'https://assets.pinterest.com/js/pinit.js'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    document.body.appendChild(script)
  })
  return scriptPromise
}

/** Embeda um Pin (foto/vídeo único) ou Board (pasta, grade rolável) do Pinterest usando o widget oficial deles. */
export default function PinterestEmbed({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const type = detectPinterestEmbed(url)

  useEffect(() => {
    if (!type || !containerRef.current) return
    const container = containerRef.current
    container.innerHTML = ''
    const anchor = document.createElement('a')
    anchor.setAttribute('data-pin-do', type === 'pin' ? 'embedPin' : 'embedBoard')
    if (type === 'board') anchor.setAttribute('data-pin-board-width', '400')
    anchor.href = url
    container.appendChild(anchor)

    loadPinterestScript().then(() => {
      window.PinUtils?.build?.()
    })
  }, [url, type])

  if (!type) return null

  return <div ref={containerRef} className="flex justify-center overflow-hidden rounded-2xl" />
}
