'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { BarsInnerGardenImportPayload } from '@/lib/inner-garden/bridge'

type Props = {
  importPayload: BarsInnerGardenImportPayload | null
}

type BridgeState = 'loading' | 'ready' | 'imported' | 'completed' | 'error'
type ShellOverlay = 'system' | 'seed' | null
type SemanticControl = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start' | 'select' | 'back'

const CHOICE_CONTROLS = [
  ['1', '1'],
  ['2', '2'],
  ['3', '3'],
  ['Enter', 'Enter'],
] as const

function sendRawKey(iframe: HTMLIFrameElement | null, action: 'press' | 'release' | 'tap', key: string) {
  iframe?.contentWindow?.postMessage(
    { schemaVersion: 'inner-garden-control.v1', action, key },
    window.location.origin
  )
}

function sendControl(
  iframe: HTMLIFrameElement | null,
  action: 'press' | 'release' | 'tap',
  control: SemanticControl
) {
  iframe?.contentWindow?.postMessage(
    { schemaVersion: 'inner-garden-control.v2', action, control },
    window.location.origin
  )
}

export function InnerGardenPlayClient({ importPayload }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [bridgeState, setBridgeState] = useState<BridgeState>('loading')
  const [notice, setNotice] = useState('Loading Inner Garden...')
  const [overlay, setOverlay] = useState<ShellOverlay>(null)

  const gameUrl = useMemo(() => '/inner-garden-game/index.html?embedded=1', [])

  const postImport = useCallback(() => {
    if (!importPayload || !iframeRef.current?.contentWindow) return
    iframeRef.current.contentWindow.postMessage(importPayload, window.location.origin)
  }, [importPayload])

  function tapControl(control: SemanticControl) {
    sendControl(iframeRef.current, 'tap', control)
  }

  function handleStart() {
    setOverlay((current) => (current === 'system' ? null : 'system'))
  }

  function handleSelect() {
    setOverlay((current) => (current === 'seed' ? null : 'seed'))
  }

  function handleBack() {
    if (overlay) {
      setOverlay(null)
      return
    }
    tapControl('back')
  }

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
    <section className="relative mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col bg-[#0f1715] text-zinc-100">
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

        {overlay && (
          <div className="absolute inset-x-3 top-20 z-20 rounded border border-emerald-700/70 bg-[#09110d]/95 p-4 shadow-2xl shadow-black/50 sm:inset-x-auto sm:right-6 sm:w-80">
            {overlay === 'system' ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    System
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Inner Garden paused</h2>
                </div>
                <p className="text-sm leading-relaxed text-emerald-100/70">
                  Use the D-pad to move, A to interact, B to act, Select for BAR seed options, and
                  Back to close or cancel.
                </p>
                <button
                  type="button"
                  className="min-h-11 rounded border border-emerald-800/70 bg-emerald-950/80 px-3 text-sm font-semibold text-emerald-50"
                  onClick={() => setOverlay(null)}
                >
                  Resume
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    BAR Seed
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white">Seed options</h2>
                </div>
                <p className="text-sm leading-relaxed text-emerald-100/70">
                  Direct BAR imports still work through the current bridge. The full seed picker
                  moves here in the cartridge-lobby phase.
                </p>
                <button
                  type="button"
                  className="min-h-11 rounded border border-emerald-800/70 bg-emerald-950/80 px-3 text-sm font-semibold text-emerald-50"
                  onClick={() => setOverlay(null)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}

        <div className="touch-none border-t border-emerald-950/80 bg-[#101511] p-3 sm:hidden">
          <div className="mx-auto grid max-w-md grid-cols-[112px_1fr] gap-3">
            <div className="grid h-28 w-28 grid-cols-3 grid-rows-3 gap-1">
              <div />
              <ControlHold label="Up" control="up" iframeRef={iframeRef} />
              <div />
              <ControlHold label="Left" control="left" iframeRef={iframeRef} />
              <div className="rounded bg-emerald-950/70" />
              <ControlHold label="Right" control="right" iframeRef={iframeRef} />
              <div />
              <ControlHold label="Down" control="down" iframeRef={iframeRef} />
              <div />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <ControlTap label="A" caption="Interact" onPress={() => tapControl('a')} />
              <ControlTap label="B" caption="Act" onPress={() => tapControl('b')} />
              <ControlTap label="Start" caption="Menu" onPress={handleStart} />
              <ControlTap label="Select" caption="Seed" onPress={handleSelect} />
              <ControlTap label="Back" caption="Esc" onPress={handleBack} />
              {CHOICE_CONTROLS.map(([label, keyName]) => (
                <ControlTap
                  key={`${label}-${keyName}`}
                  label={label}
                  caption="Choice"
                  onPress={() => sendRawKey(iframeRef.current, 'tap', keyName)}
                />
              ))}
              <ControlHold label="Meditate" control="start" rawKey="m" iframeRef={iframeRef} wide />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ControlHold({
  label,
  control,
  iframeRef,
  rawKey,
  wide = false,
}: {
  label: string
  control: SemanticControl
  iframeRef: RefObject<HTMLIFrameElement | null>
  rawKey?: string
  wide?: boolean
}) {
  return (
    <button
      type="button"
      className={`${wide ? 'col-span-4' : ''} rounded border border-emerald-800/70 bg-emerald-950/80 px-2 text-xs font-semibold text-emerald-50`}
      onPointerDown={(event) => {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        if (rawKey) sendRawKey(iframeRef.current, 'press', rawKey)
        else sendControl(iframeRef.current, 'press', control)
      }}
      onPointerUp={(event) => {
        event.preventDefault()
        if (rawKey) sendRawKey(iframeRef.current, 'release', rawKey)
        else sendControl(iframeRef.current, 'release', control)
      }}
      onPointerCancel={() => {
        if (rawKey) sendRawKey(iframeRef.current, 'release', rawKey)
        else sendControl(iframeRef.current, 'release', control)
      }}
      onPointerLeave={() => {
        if (rawKey) sendRawKey(iframeRef.current, 'release', rawKey)
        else sendControl(iframeRef.current, 'release', control)
      }}
    >
      {label}
    </button>
  )
}

function ControlTap({
  label,
  caption,
  onPress,
}: {
  label: string
  caption: string
  onPress: () => void
}) {
  return (
    <button
      type="button"
      className="min-h-12 rounded border border-emerald-800/70 bg-emerald-950/80 px-2 text-xs font-semibold text-emerald-50"
      onPointerDown={(event) => {
        event.preventDefault()
        onPress()
      }}
    >
      <span className="block text-sm">{label}</span>
      <span className="block text-[10px] font-normal text-emerald-200/70">{caption}</span>
    </button>
  )
}
