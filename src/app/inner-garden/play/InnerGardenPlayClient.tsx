'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { BarsInnerGardenImportPayload } from '@/lib/inner-garden/bridge'

type Props = {
  importPayload: BarsInnerGardenImportPayload | null
}

type BridgeState = 'loading' | 'ready' | 'imported' | 'completed' | 'error'

const TAP_CONTROLS = [
  ['Interact', 'e'],
  ['Act', ' '],
  ['BAR', 'j'],
  ['Menu', 'i'],
  ['1', '1'],
  ['2', '2'],
  ['3', '3'],
  ['Enter', 'Enter'],
] as const

function sendControl(iframe: HTMLIFrameElement | null, action: 'press' | 'release' | 'tap', key: string) {
  iframe?.contentWindow?.postMessage(
    { schemaVersion: 'inner-garden-control.v1', action, key },
    window.location.origin
  )
}

export function InnerGardenPlayClient({ importPayload }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [bridgeState, setBridgeState] = useState<BridgeState>('loading')
  const [notice, setNotice] = useState('Loading Inner Garden...')

  const gameUrl = useMemo(() => '/inner-garden-game/index.html?embedded=1', [])

  const postImport = useCallback(() => {
    if (!importPayload || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage(importPayload, window.location.origin)
  }, [importPayload])

  useEffect(() => {
    async function saveCompletion(payload: unknown) {
      const response = await fetch('/api/inner-garden/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Completion failed' }))
        throw new Error(body.error || 'Completion failed')
      }

      return response.json() as Promise<{ resultBarId: string }>
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      const data = event.data
      if (!data || typeof data !== 'object') return

      if (data.schemaVersion === 'inner-garden-ready.v1') {
        setBridgeState('ready')
        setNotice(importPayload ? 'Importing BAR into the garden...' : 'Inner Garden is ready.')
        postImport()
      }

      if (data.schemaVersion === 'inner-garden-imported.v1') {
        setBridgeState('imported')
        setNotice('BAR imported as a seed and witness card.')
      }

      if (data.schemaVersion === 'inner-garden-bars.v1') {
        setBridgeState('completed')
        setNotice('Saving harvested result...')
        saveCompletion(data)
          .then((result) => {
            setNotice(`Harvest saved to Vault: ${result.resultBarId}`)
          })
          .catch((error: Error) => {
            setBridgeState('error')
            setNotice(error.message)
          })
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [importPayload, postImport])

  return (
    <section className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col bg-[#0f1715] text-zinc-100">
      <div className="flex items-center justify-between gap-3 border-b border-emerald-950/80 px-3 py-2 text-xs text-emerald-100 sm:px-4">
        <div>
          <p className="font-semibold">Inner Garden</p>
          <p className="text-[11px] text-emerald-200/65">{notice}</p>
        </div>
        <div
          className="rounded border border-emerald-800/60 px-2 py-1 text-[10px] uppercase tracking-wider text-emerald-200/80"
          data-bridge-state={bridgeState}
        >
          {bridgeState}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 items-center justify-center bg-[#151f1b] p-2">
          <iframe
            ref={iframeRef}
            src={gameUrl}
            title="Inner Garden playable island"
            className="aspect-[3/2] h-auto max-h-full w-full max-w-[960px] border-0 bg-black shadow-2xl shadow-black/40"
            allow="clipboard-write"
            onLoad={() => postImport()}
          />
        </div>

        <div className="touch-none border-t border-emerald-950/80 bg-[#101511] p-3 sm:hidden">
          <div className="mx-auto grid max-w-md grid-cols-[112px_1fr] gap-3">
            <div className="grid h-28 w-28 grid-cols-3 grid-rows-3 gap-1">
              <div />
              <ControlHold label="Up" keyName="ArrowUp" iframeRef={iframeRef} />
              <div />
              <ControlHold label="Left" keyName="ArrowLeft" iframeRef={iframeRef} />
              <div className="rounded bg-emerald-950/70" />
              <ControlHold label="Right" keyName="ArrowRight" iframeRef={iframeRef} />
              <div />
              <ControlHold label="Down" keyName="ArrowDown" iframeRef={iframeRef} />
              <div />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {TAP_CONTROLS.map(([label, keyName]) => (
                <button
                  key={`${label}-${keyName}`}
                  type="button"
                  className="min-h-12 rounded border border-emerald-800/70 bg-emerald-950/80 px-2 text-xs font-semibold text-emerald-50"
                  onPointerDown={(event) => {
                    event.preventDefault()
                    sendControl(iframeRef.current, 'tap', keyName)
                  }}
                >
                  {label}
                </button>
              ))}
              <ControlHold label="Meditate" keyName="m" iframeRef={iframeRef} wide />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ControlHold({
  label,
  keyName,
  iframeRef,
  wide = false,
}: {
  label: string
  keyName: string
  iframeRef: RefObject<HTMLIFrameElement | null>
  wide?: boolean
}) {
  return (
    <button
      type="button"
      className={`${wide ? 'col-span-4' : ''} rounded border border-emerald-800/70 bg-emerald-950/80 px-2 text-xs font-semibold text-emerald-50`}
      onPointerDown={(event) => {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        sendControl(iframeRef.current, 'press', keyName)
      }}
      onPointerUp={(event) => {
        event.preventDefault()
        sendControl(iframeRef.current, 'release', keyName)
      }}
      onPointerCancel={() => sendControl(iframeRef.current, 'release', keyName)}
      onPointerLeave={() => sendControl(iframeRef.current, 'release', keyName)}
    >
      {label}
    </button>
  )
}
