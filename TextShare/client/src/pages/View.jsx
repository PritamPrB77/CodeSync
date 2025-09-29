import React, { useEffect, useMemo, useState } from 'react'
import Skeleton from '../components/Skeleton.jsx'
import FileIcon from '../components/FileIcon.jsx'
import { useToast } from '../components/ToastProvider.jsx'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export default function View() {
  const { toast } = useToast()
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [fileMeta, setFileMeta] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const passwd = params.get('password') || ''
    setPassword(passwd)
  }, [])

  useEffect(() => {
    const m = window.location.pathname.match(/\/view\/(.+)$/)
    const c = m?.[1] || ''
    setCode(c)
  }, [])

  useEffect(() => {
    if (!code) return
    ;(async () => {
      setLoading(true)
      setError('')
      setText('')
      setFileMeta(null)
      try {
        // Try text
        const u1 = new URL(`${API_BASE_URL}/api/text/${code}`)
        if (password) u1.searchParams.set('password', password)
        const r1 = await fetch(u1)
        if (r1.ok) {
          const d1 = await r1.json()
          setText(d1.text)
          toast.success('Text loaded ✅')
          setLoading(false)
          return
        }
        // Try file
        const u2 = new URL(`${API_BASE_URL}/api/file/${code}`)
        if (password) u2.searchParams.set('password', password)
        const r2 = await fetch(u2)
        const d2 = await r2.json()
        if (!r2.ok) throw new Error(d2?.error || 'Code not found')
        setFileMeta(d2)
        toast.success('File ready ✅')
      } catch (e) {
        setError(e.message || 'Error')
        toast.error(e.message || 'Error')
      } finally {
        setLoading(false)
      }
    })()
  }, [code, password])

  const downloadUrl = useMemo(() => {
    if (!fileMeta) return ''
    const url = new URL(`${API_BASE_URL}/api/file/${fileMeta.code}/download`)
    if (password) url.searchParams.set('password', password)
    return url.toString()
  }, [fileMeta, password])

  const inlineUrl = useMemo(() => {
    if (!fileMeta) return ''
    const url = new URL(`${API_BASE_URL}/api/file/${fileMeta.code}/download`)
    url.searchParams.set('inline', '1')
    if (password) url.searchParams.set('password', password)
    return url.toString()
  }, [fileMeta, password])

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-4">
        <a href="/" className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">← Back to Home</a>
      </div>
      <div className="rounded-2xl p-6 bg-white/70 dark:bg-gray-900/70 border border-gray-200/60 dark:border-gray-800/60 shadow-xl backdrop-blur">
        <h2 className="text-xl font-semibold">Viewing {code}</h2>
        {loading && (
          <div className="mt-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}
        {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
        {text && (
          <textarea readOnly value={text} className="mt-4 w-full h-72 p-4 rounded-2xl border border-gray-300/70 dark:border-gray-700/70 bg-white/70 dark:bg-gray-900/70" />
        )}
        {fileMeta && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <FileIcon filename={fileMeta.filename} mimeType={fileMeta.mimeType} />
              <span>{fileMeta.filename} ({(fileMeta.size/1024/1024).toFixed(2)} MB)</span>
            </div>
            {fileMeta.isImage ? (
              <img src={inlineUrl} alt={fileMeta.filename} className="max-h-[70vh] rounded-2xl border border-gray-300/70 dark:border-gray-700/70" />
            ) : (
              <div className="text-sm">This file type cannot be previewed. Download it instead.</div>
            )}
            <a href={downloadUrl} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" download>
              <span>⬇️</span>
              <span>Download</span>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
