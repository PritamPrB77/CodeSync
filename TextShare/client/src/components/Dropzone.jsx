import React from 'react'

export default function Dropzone({ file, setFile }) {
  function onChoose(e) {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }
  function onDrop(e) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) setFile(f)
  }
  function onDragOver(e) {
    e.preventDefault()
  }
  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className="border-2 border-dashed rounded-2xl p-8 text-center border-gray-300/70 dark:border-gray-700/70 bg-white/50 dark:bg-gray-900/50 hover:border-indigo-400 transition"
      >
        <p className="mb-2 font-medium">Drag & drop a file here</p>
        <p className="text-sm text-gray-500">or</p>
        <label className="mt-2 inline-block">
          <span className="mt-2 inline-block px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 cursor-pointer transition">Choose File</span>
          <input type="file" className="hidden" onChange={onChoose} />
        </label>
      </div>
      {file && (
        <div className="mt-3 text-sm">
          <div><strong>Name:</strong> {file.name}</div>
          <div><strong>Type:</strong> {file.type || 'n/a'}</div>
          <div><strong>Size:</strong> {(file.size/1024/1024).toFixed(2)} MB</div>
        </div>
      )}
    </div>
  )
}
