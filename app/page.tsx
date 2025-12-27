"use client"

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    window.location.href = '/login'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-blue-400">正在跳转...</div>
    </div>
  )
}
