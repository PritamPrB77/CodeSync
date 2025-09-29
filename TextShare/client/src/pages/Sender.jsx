import React, { useMemo, useState } from 'react'
import FloatingInput from '../components/FloatingInput.jsx'
import Modal from '../components/Modal.jsx'
import Dropzone from '../components/Dropzone.jsx'
import { useToast } from '../components/ToastProvider.jsx'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

export default function Sender() {
  const { toast } = useToast()
  const [mode, setMode] = useState('text') // 'text' | 'file'
  const [text, setText] = useState('')
  const [password, setPassword] = useState('')
  const [expirationDays, setExpirationDays] = useState('')
  const [shareCode, setShareCode] = useState('')
  const [shareLoading, setShareLoading] = useState(false)
  const [shareError, setShareError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [file, setFile] = useState(null)
  const [successOpen, setSuccessOpen] = useState(false)

  const shareUrl = useMemo(() => {
    if (!shareCode) return ''
    const base = window.location.origin
    const u = new URL(base)
    u.pathname = '/receiver'
    u.searchParams.set('code', shareCode)
    return u.toString()
  }, [shareCode])

  const viewUrl = useMemo(() => {
    if (!shareCode) return ''
    const base = window.location.origin
    return `${base}/view/${shareCode}`
  }, [shareCode])

  async function handleShare() {
    setShareError('')
    setShareLoading(true)
    setShareCode('')
    setUploadProgress(0)
    try {
      const days = parseInt(expirationDays, 10)
      if (mode === 'file') {
        if (!file) throw new Error('Please choose a file to upload')
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          const form = new FormData()
          form.append('file', file)
          if (password) form.append('password', password)
          if (!isNaN(days) && days > 0) form.append('expirationDays', String(days))
          xhr.open('POST', `${API_BASE_URL}/api/upload`)
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
          xhr.onload = () => {
            try {
              const data = JSON.parse(xhr.responseText || '{}')
              if (xhr.status >= 200 && xhr.status < 300) {
                setShareCode(data.code)
                toast.success('Upload complete ✅')
                resolve()
              } else {
                reject(new Error(data?.error || 'Upload failed'))
              }
            } catch (e) {
              reject(new Error('Upload failed'))
            }
          }
          xhr.onerror = () => reject(new Error('Network error during upload'))
          xhr.send(form)
        })
      } else {
        const body = { text }
        if (password) body.password = password
        if (!isNaN(days) && days > 0) body.expirationDays = days

        const res = await fetch(`${API_BASE_URL}/api/text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed to share')
        setShareCode(data.code)
        toast.success('Shared successfully ✅')
      }
      setSuccessOpen(true)
    } catch (err) {
      setShareError(err.message || 'Error')
      toast.error(err.message || 'Error')
    } finally {
      setShareLoading(false)
    }
  }

  function copyUrl() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    toast.success('Copied ✅')
  }
  function copyViewUrl() {
    if (!viewUrl) return
    navigator.clipboard.writeText(viewUrl)
    toast.success('Copied ✅')
  }

  return (
    <div className="max-w-6xl mx-auto mt-4">
      <div className="mb-4">
        <a href="/" className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">← Back to Home</a>
      </div>
      <div className="grid lg:grid-cols-2 gap-8">
      <div className="rounded-2xl p-6 bg-white/70 dark:bg-gray-900/70 border border-gray-200/60 dark:border-gray-800/60 shadow-xl backdrop-blur">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold">Share</h2>
          <div className="ml-auto flex gap-2 text-sm">
            <button onClick={() => setMode('text')} className={`px-3 py-1 rounded-xl border transition ${mode==='text'?'bg-indigo-600 text-white border-indigo-600':'border-gray-300 dark:border-gray-700'}`}>Text</button>
            <button onClick={() => setMode('file')} className={`px-3 py-1 rounded-xl border transition ${mode==='file'?'bg-indigo-600 text-white border-indigo-600':'border-gray-300 dark:border-gray-700'}`}>File/Image</button>
          </div>
        </div>

        {mode === 'text' ? (
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your text here..."
            className="w-full h-64 p-4 rounded-2xl border border-gray-300/70 dark:border-gray-700/70 bg-white/70 dark:bg-gray-900/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition"
          />
        ) : (
          <Dropzone file={file} setFile={setFile} />
        )}

        {mode === 'file' && shareLoading && (
          <div className="mt-4">
            <div className="h-2 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <div className="text-xs mt-1">{uploadProgress}%</div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          <FloatingInput label="Password (optional)" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <FloatingInput label="Expires in days (optional)" type="number" value={expirationDays} onChange={e => setExpirationDays(e.target.value)} />
        </div>

        {shareError && <p className="text-red-500 text-sm mt-3">{shareError}</p>}

        <button
          onClick={handleShare}
          disabled={shareLoading || (mode==='text' ? !text.trim() : !file)}
          className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl active:scale-[0.99] transition"
        >
          {shareLoading ? (mode==='file' ? 'Uploading...' : 'Sharing...') : 'Generate Share Code'}
        </button>
      </div>

      <div className="rounded-2xl p-6 bg-white/50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-800/60 shadow-xl backdrop-blur min-h-[12rem] flex items-center justify-center text-center">
        <div>
          <div className="text-5xl mb-4">✨</div>
          <p className="text-gray-600 dark:text-gray-300">Keep your data secure with optional passwords and auto-expiry.</p>
        </div>
      </div>

      </div>

      <Modal open={successOpen} onClose={() => setSuccessOpen(false)}>
        <h3 className="text-xl font-semibold">Share code generated</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Give this link or code to your recipient.</p>
        {shareUrl && (
          <div className="mt-4 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200/70 dark:border-gray-700/70 font-mono break-all">
            {shareUrl}
          </div>
        )}
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Receiver Deep Link</div>
            <button onClick={copyUrl} className="w-full px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition">Copy /receiver Link</button>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Read-only View</div>
            <button onClick={copyViewUrl} className="w-full px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition">Copy /view Link</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
