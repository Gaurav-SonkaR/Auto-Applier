import { useEffect, useRef, useState, useCallback } from 'react'
import type { FlowEvent } from '../types'

type WSState = 'connecting' | 'open' | 'closed' | 'error'

const RECONNECT_DELAY_MS = 3000
const MAX_EVENTS = 200

export function useWebSocket(runId: number | null) {
  const [events, setEvents] = useState<FlowEvent[]>([])
  const [wsState, setWsState] = useState<WSState>('closed')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRunId = useRef<number | null>(null)

  const clearEvents = useCallback(() => setEvents([]), [])

  const connect = useCallback((id: number) => {
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close()
    }

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${window.location.host}/ws/runs/${id}`)
    wsRef.current = ws
    setWsState('connecting')

    ws.onopen = () => setWsState('open')

    ws.onmessage = (ev) => {
      try {
        const event: FlowEvent = JSON.parse(ev.data as string)
        setEvents((prev) => {
          const next = [...prev, event]
          return next.length > MAX_EVENTS ? next.slice(-MAX_EVENTS) : next
        })
      } catch {
        // ignore malformed frames
      }
    }

    ws.onerror = () => setWsState('error')

    ws.onclose = () => {
      setWsState('closed')
      if (activeRunId.current !== null) {
        reconnectTimer.current = setTimeout(() => {
          if (activeRunId.current !== null) connect(activeRunId.current)
        }, RECONNECT_DELAY_MS)
      }
    }
  }, [])

  useEffect(() => {
    activeRunId.current = runId
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current)

    if (runId !== null) {
      connect(runId)
    } else {
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
      setWsState('closed')
    }

    return () => {
      activeRunId.current = null
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [runId, connect])

  return { events, wsState, clearEvents }
}
