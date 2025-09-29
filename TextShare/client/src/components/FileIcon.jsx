import React from 'react'

function extFromName(filename = '') {
  const i = filename.lastIndexOf('.')
  return i >= 0 ? filename.slice(i+1).toLowerCase() : ''
}

export default function FileIcon({ filename, mimeType }) {
  const ext = extFromName(filename)
  let label = 'FILE'
  if ((mimeType||'').startsWith('image/')) label = 'IMG'
  else if (ext === 'pdf') label = 'PDF'
  else if (['doc','docx'].includes(ext)) label = 'DOC'
  else if (['xls','xlsx','csv'].includes(ext)) label = 'XLS'
  else if (['ppt','pptx'].includes(ext)) label = 'PPT'
  else if (['zip','rar','7z','tar','gz'].includes(ext)) label = 'ZIP'
  else if (['txt','md','log'].includes(ext)) label = 'TXT'

  const colors = {
    IMG: 'from-blue-500 to-cyan-500',
    PDF: 'from-rose-500 to-pink-500',
    DOC: 'from-indigo-500 to-purple-500',
    XLS: 'from-emerald-500 to-teal-500',
    PPT: 'from-amber-500 to-orange-500',
    ZIP: 'from-slate-500 to-gray-600',
    TXT: 'from-violet-500 to-fuchsia-500',
    FILE: 'from-slate-500 to-gray-600'
  }

  return (
    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-white text-xs font-bold bg-gradient-to-br ${colors[label]}`}>{label}</div>
  )
}
