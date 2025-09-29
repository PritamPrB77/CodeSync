import React from 'react'
import { Link } from 'react-router-dom'

export default function Header({ dark, setDark }) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/60 dark:border-gray-800/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group select-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform" />
          <span className="text-lg font-bold tracking-tight">ShareIt</span>
        </Link>
        <button
          onClick={() => setDark(d => !d)}
          className="px-3 py-2 rounded-xl border border-gray-300/70 dark:border-gray-700/70 hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition"
          aria-label="Toggle theme"
        >
          {dark ? '🌞 Light' : '🌙 Dark'}
        </button>
      </div>
    </header>
  )
}
