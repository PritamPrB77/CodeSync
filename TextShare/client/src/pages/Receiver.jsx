import React, { useEffect, useMemo, useState } from 'react'
import FloatingInput from '../components/FloatingInput.jsx'
import Skeleton from '../components/Skeleton.jsx'
import FileIcon from '../components/FileIcon.jsx'
import { useToast } from '../components/ToastProvider.jsx'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function classNames(...xs){return xs.filter(Boolean).join(' ')}

export default function Receiver() {
  const { toast } = useToast()
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initial = params.get('code')
    if (initial) setCode(initial)
  }, [])

  const [text, setText] = useState('')
  const [fileMeta, setFileMeta] = useState(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

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

  async function handleFetch() {
    setError('')
    setLoading(true)
    setText('')
    setFileMeta(null)
    try {
      // Try text first
      toast.info('Fetching…')
      const url = new URL(`${API_BASE_URL}/api/text/${code}`)
      if (password) url.searchParams.set('password', password)
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setText(data.text)
        toast.success('Text loaded ✅')
        return
      }
      // Try file metadata
      const url2 = new URL(`${API_BASE_URL}/api/file/${code}`)
      if (password) url2.searchParams.set('password', password)
      const res2 = await fetch(url2)
      const data2 = await res2.json()
      if (!res2.ok) throw new Error(data2?.error || 'Code not found')
      setFileMeta(data2)
      toast.success('File ready ✅')
    } catch (err) {
      setError(err.message || 'Error')
      toast.error(err.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] grid place-items-center py-8">
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <a href="/" className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">← Back to Home</a>
        </div>
        <div className="rounded-2xl p-6 bg-white/60 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-800/60 shadow-2xl backdrop-blur">
        <h2 className="text-2xl font-semibold text-center">Retrieve Content</h2>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6">Enter the code and password if required</p>

        <div className="grid sm:grid-cols-2 gap-3">
          <FloatingInput label="Share Code" value={code} onChange={e => setCode(e.target.value)} />
          <FloatingInput label="Password (if required)" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <button
          onClick={handleFetch}
          disabled={loading || !code.trim()}
          className={classNames(
            'mt-6 w-full py-3 rounded-2xl text-white shadow-lg hover:shadow-xl active:scale-[0.99] transition',
            loading ? 'bg-gray-500' : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600'
          )}
        >
          {loading ? 'Fetching...' : 'Fetch'}
        </button>

        {/* Result */}
        <div className="mt-6">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}
          {text && (
            <textarea
              readOnly
              value={text}
              className="w-full h-64 p-4 rounded-2xl border border-gray-300/70 dark:border-gray-700/70 bg-white/70 dark:bg-gray-900/70"
            />
          )}

          {fileMeta && (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {fileMeta.filename} ({(fileMeta.size/1024/1024).toFixed(2)} MB)
              </div>
              {fileMeta.isImage ? (
                <div>
                  <img
                    src={inlineUrl}
                    alt={fileMeta.filename}
                    onClick={() => setLightboxOpen(true)}
                    className="max-h-96 rounded-2xl border border-gray-300/70 dark:border-gray-700/70 cursor-zoom-in"
                  />
                  {lightboxOpen && (
                    <div className="fixed inset-0 z-40 grid place-items-center">
                      <div className="absolute inset-0 bg-black/70" onClick={() => setLightboxOpen(false)} />
                      <img src={inlineUrl} alt={fileMeta.filename} className="relative z-50 max-h-[85vh] rounded-2xl shadow-2xl" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <FileIcon filename={fileMeta.filename} mimeType={fileMeta.mimeType} />
                  <span>This file type cannot be previewed. Download it instead.</span>
                </div>
              )}
              <a href={downloadUrl} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" download>
                <span>⬇️</span>
                <span>Download</span>
              </a>
            </div>
       
         
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
