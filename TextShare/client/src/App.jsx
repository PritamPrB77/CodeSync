import React, { useMemo, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Sender from './pages/Sender.jsx'
import Receiver from './pages/Receiver.jsx'
import View from './pages/View.jsx'
import Collab from './pages/Collab.jsx'
import Header from './components/Header.jsx'
import { ToastProvider } from './components/ToastProvider.jsx'

export default function App() {
  const [dark, setDark] = useState(true)

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <ToastProvider>
          <Header dark={dark} setDark={setDark} />
          <main className="px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/send" element={<Sender />} />
              <Route path="/sender" element={<Sender />} />
              <Route path="/receive" element={<Receiver />} />
              <Route path="/receiver" element={<Receiver />} />
              <Route path="/view/:code" element={<View />} />
              <Route path="/collab" element={<Collab />} />
              <Route path="/collab/:sessionId" element={<Collab />} />
              <Route path="*" element={<Landing />} />
            </Routes>
          </main>
        </ToastProvider>
      </div>
    </div>
  )
}
