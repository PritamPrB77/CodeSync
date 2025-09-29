import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="max-w-6xl mx-auto py-16 sm:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Share text, images, and files in seconds
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Secure, fast, and beautiful sharing experience.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <Link to="/sender" className="group">
          <div className="relative rounded-2xl p-8 h-72 bg-gradient-to-br from-indigo-500/15 via-purple-500/15 to-pink-500/15 dark:from-indigo-400/10 dark:via-purple-400/10 dark:to-pink-400/10 border border-indigo-300/30 dark:border-indigo-700/30 shadow-xl overflow-hidden transition transform group-hover:scale-[1.02] group-hover:shadow-indigo-500/20">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-purple-500/10 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-lg">
                📤
              </div>
              <h2 className="mt-4 text-2xl font-bold">Sender</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Paste text or upload files/images. Add password and expiration, then share a code.
              </p>
              <div className="mt-6 inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white shadow hover:bg-indigo-700 transition">
                Start Sharing
              </div>
            </div>
          </div>
        </Link>

        <Link to="/receiver" className="group">
          <div className="relative rounded-2xl p-8 h-72 bg-gradient-to-br from-emerald-500/15 via-teal-500/15 to-cyan-500/15 dark:from-emerald-400/10 dark:via-teal-400/10 dark:to-cyan-400/10 border border-emerald-300/30 dark:border-emerald-700/30 shadow-xl overflow-hidden transition transform group-hover:scale-[1.02] group-hover:shadow-emerald-500/20">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-cyan-500/10 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white shadow-lg">
                📥
              </div>
              <h2 className="mt-4 text-2xl font-bold">Receiver</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Enter a code (and password if required) to view or download the shared content.
              </p>
              <div className="mt-6 inline-block px-4 py-2 rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700 transition">
                Retrieve Content
              </div>
            </div>
          </div>
        </Link>

        <Link to="/collab" className="group">
          <div className="relative rounded-2xl p-8 h-72 g-gradient-to-br from-fuchsia-500/15 via-violet-500/15 to-indigo-500/15 dark:from-fuchsia-400/10 dark:via-violet-400/10 dark:to-indigo-400/10 border border-fuchsia-300/30 dark:border-fuchsia-700/30 shadow-xl overflow-hidden transition transform group-hover:scale-[1.02] group-hover:shadow-fuchsia-500/20">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-fuchsia-500/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-fuchsia-600 text-white shadow-lg">💻</div>
              <h2 className="mt-4 text-2xl font-bold">Collaborative Coding</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Code together in real time, run & debug instantly.
              </p>
              <div className="mt-6 inline-block px-4 py-2 rounded-xl bg-fuchsia-600 text-white shadow hover:bg-fuchsia-700 transition">
                Start Coding
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
