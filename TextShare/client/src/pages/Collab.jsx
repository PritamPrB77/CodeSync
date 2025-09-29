import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useToast } from '../components/ToastProvider.jsx'
import Skeleton from '../components/Skeleton.jsx'
import FloatingInput from '../components/FloatingInput.jsx'
import FileIcon from '../components/FileIcon.jsx'
import { Editor } from '@monaco-editor/react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const LANGUAGES = [
  { key: 'javascript', label: 'JavaScript' },
  { key: 'python', label: 'Python' },
  { key: 'java', label: 'Java' },
  { key: 'cpp', label: 'C++' },
]

function TopBar({ language, setLanguage, onRun, onInvite, running }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/60 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-800/60 backdrop-blur">
      <div className="text-sm text-gray-600 dark:text-gray-300">Language</div>
      <select value={language} onChange={e => setLanguage(e.target.value)} className="px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-300/70 dark:border-gray-700/70">
        {LANGUAGES.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
      </select>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={onInvite} className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">Invite</button>
        <button onClick={onRun} disabled={running} className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
          {running ? 'Running…' : 'Run'}
        </button>
      </div>
    </div>
  )
}

function Terminal({ logs }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [logs])
  return (
    <div ref={ref} className="h-64 overflow-auto rounded-2xl p-3 font-mono text-sm bg-black text-green-200 border border-gray-800">
      {logs.length === 0 ? <div className="text-gray-400">No output yet</div> : logs.map((l, i) => (
        <div key={i} className="whitespace-pre-wrap">{l}</div>
      ))}
    </div>
  )
}

export default function Collab() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [id, setId] = useState(sessionId || '')
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState('')
  const [logs, setLogs] = useState([])
  const [running, setRunning] = useState(false)

  const socketRef = useRef(null)
  const myColor = useRef(`#${Math.floor(Math.random()*16777215).toString(16)}`)
  const clientId = useRef(Math.random().toString(36).slice(2))
  const lastRemote = useRef(0)

  // Create or fetch session
  useEffect(() => {
    (async () => {
      try {
        if (!id) {
          const res = await fetch(`${API_BASE_URL}/api/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
          const data = await res.json()
          if (!res.ok) throw new Error(data?.error || 'Failed to create session')
          setId(data.id)
          navigate(`/collab/${data.id}`, { replace: true })
          toast.success('Session created ✅')
          return
        }
        // load existing
        const r = await fetch(`${API_BASE_URL}/api/session/${id}`)
        const d = await r.json()
        if (!r.ok) throw new Error(d?.error || 'Session not found')
        setLanguage(d.language || 'javascript')
        setCode(d.code || '')
        setLoading(false)
      } catch (e) {
        toast.error(e.message || 'Error')
      }
    })()
  }, [id])

  // Connect socket
  useEffect(() => {
    if (!id || loading) return
    const s = io(API_BASE_URL, { transports: ['websocket'] })
    socketRef.current = s
    s.emit('join-session', { sessionId: id })
    s.on('session-init', ({ language: lng, code: c }) => {
      setLanguage(lng || 'javascript')
      setCode(c || '')
      toast.info('Joined session')
    })
    s.on('user-joined', () => toast.info('A collaborator joined'))
    s.on('code-change', ({ code: c }) => {
      // prevent echo loops: apply remote code
      lastRemote.current = Date.now()
      setCode(c)
    })
    s.on('cursor-change', () => {/* reserved for future; would render remote cursors via Monaco decorations */})
    s.on('execution-result', ({ result }) => {
      const { stdout, stderr, compile_output, status } = result || {}
      if (stdout) setLogs(prev => [...prev, stdout])
      if (compile_output) setLogs(prev => [...prev, compile_output])
      if (stderr) setLogs(prev => [...prev, stderr])
    })
    return () => s.disconnect()
  }, [id, loading])

  const onInvite = () => {
    const link = `${window.location.origin}/collab/${id}`
    navigator.clipboard.writeText(link)
    toast.success('Invite link copied ✅')
  }

  const onRun = async () => {
    try {
      setRunning(true)
      setLogs(prev => [...prev, `> Running ${language}...`])
      const res = await fetch(`${API_BASE_URL}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code, sessionId: id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Execution failed')
      // Do not append logs here; rely on 'execution-result' socket event to avoid duplicates
      toast.success('Execution finished ✅')
    } catch (e) {
      toast.error(e.message || 'Execution failed')
    } finally {
      setRunning(false)
    }
  }

  // editor change
  const onChange = (value) => {
    setCode(value ?? '')
    // if recent remote update, avoid re-broadcasting
    if (Date.now() - lastRemote.current < 100) return
    socketRef.current?.emit('code-change', { sessionId: id, code: value ?? '' })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Collaborative Coding</div>
        <div className="text-sm text-gray-500">Session: <span className="font-mono">{id || '—'}</span></div>
      </div>

      <TopBar language={language} setLanguage={setLanguage} onRun={onRun} onInvite={onInvite} running={running} />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[50vh] w-full" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 overflow-hidden bg-white/60 dark:bg-gray-900/60">
            <Editor
              height="60vh"
              language={language === 'cpp' ? 'cpp' : language}
              theme={document.documentElement.classList.contains('dark') ? 'vs-dark' : 'light'}
              value={code}
              onChange={onChange}
              options={{ fontSize: 14, minimap: { enabled: false } }}
            />
          </div>
          <div className="space-y-3">
            <Terminal logs={logs} />
            <div className="text-xs text-gray-500">Tip: Share the invite link with collaborators to edit together in real time.</div>
          </div>
        </div>
      )}
    </div>
  )
}
