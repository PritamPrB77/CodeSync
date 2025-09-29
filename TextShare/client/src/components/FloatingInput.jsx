import React from 'react'

export default function FloatingInput({ label, type = 'text', value, onChange, placeholder = ' ', ...props }) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="peer w-full px-3 pt-5 pb-2 rounded-xl border border-gray-300/70 dark:border-gray-700/70 bg-white/70 dark:bg-gray-900/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 transition"
        {...props}
      />
      <label className="absolute left-3 top-2 text-gray-500 dark:text-gray-400 text-xs tracking-wide transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs">
        {label}
      </label>
    </div>
  )
}
