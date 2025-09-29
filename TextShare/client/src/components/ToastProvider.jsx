import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ToastCtx = createContext({ toast: { success: () => {}, error: () => {}, info: () => {} } })

function Toasts({ items, remove }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {items.map(item => (
        <div key={item.id} className={`px-4 py-2 rounded-xl shadow-lg text-white ${item.type==='success'?'bg-emerald-600':item.type==='error'?'bg-rose-600':'bg-gray-800'}`}>
          <div className="flex items-center gap-2">
            <span>{item.type==='success'?'✅':item.type==='error'?'❌':'ℹ️'}</span>
            <span>{item.msg}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((type, msg) => {
    const id = Math.random().toString(36).slice(2)
    setItems(prev => [...prev, { id, type, msg }])
    setTimeout(() => {
      setItems(prev => prev.filter(x => x.id !== id))
    }, 2500)
  }, [])

  const toast = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <Toasts items={items} />
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
