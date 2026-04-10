'use client'

import { useEffect, useState } from 'react'

type BrowserType = 'line' | 'webview' | 'pwa' | 'browser'

function detectBrowser(): BrowserType {
  const ua = navigator.userAgent
  if (/Line\//i.test(ua)) return 'line'
  if (/iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua)) return 'webview'
  if (/Android/.test(ua) && /; wv\)/.test(ua)) return 'webview'
  if (
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
    return 'pwa'
  return 'browser'
}

function WebViewWarning({ type, siteUrl }: { type: BrowserType; siteUrl: string }) {
  if (type === 'line') {
    return (
      <div className="mb-6 rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
        <p className="font-bold mb-1">LINEのブラウザではログインできません</p>
        <p>画面右下の <span className="font-mono font-bold">・・・</span> をタップして</p>
        <p>「<span className="font-semibold">ブラウザで開く</span>」を選択してください</p>
      </div>
    )
  }
  if (type === 'webview' || type === 'pwa') {
    return (
      <div className="mb-6 rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
        <p className="font-bold mb-1">このブラウザではログインできません</p>
        <p className="mb-2">SafariまたはChromeでこのページを開いてください</p>
        <button
          onClick={() => navigator.clipboard?.writeText(siteUrl)}
          className="text-xs underline text-yellow-700"
        >
          URLをコピーする
        </button>
        <p className="mt-1 text-xs text-yellow-600 break-all">{siteUrl}</p>
      </div>
    )
  }
  return null
}

async function handleGoogleLogin() {
  const res = await fetch('/api/auth/google-url')
  const { url } = await res.json()
  window.location.href = url
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [browserType, setBrowserType] = useState<BrowserType>('browser')
  const [siteUrl, setSiteUrl] = useState('')

  useEffect(() => {
    setBrowserType(detectBrowser())
    setSiteUrl(window.location.origin + '/login')
  }, [])

  const isBlocked = browserType === 'line' || browserType === 'webview'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-green-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">⛳</div>
          <h1 className="text-2xl font-bold text-green-800">ゴルフキャディ</h1>
          <p className="mt-2 text-sm text-gray-500">AIがクラブ選択をサポートします</p>
        </div>

        <WebViewWarning type={browserType} siteUrl={siteUrl} />

        <button
          onClick={handleGoogleLogin}
          disabled={isBlocked}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Googleでログイン
        </button>
      </div>
    </main>
  )
}
