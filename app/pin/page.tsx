'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

// SSR無効でPinMapを読み込む（Leafletはブラウザ専用のため）
const PinMap = dynamic(() => import('@/components/PinMap'), { ssr: false })

type LatLng = { lat: number; lng: number }

const DEFAULT_POSITION: LatLng = { lat: 35.6812, lng: 139.7671 } // 東京（フォールバック）

export default function PinPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-400">読み込み中...</div>}>
      <PinPageInner />
    </Suspense>
  )
}

function PinPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // mode=new: 新しいピンをセット / mode=check: 現在のピンで距離確認
  const mode = searchParams.get('mode') ?? 'new'
  const roundId = searchParams.get('roundId')
  const holeNumber = searchParams.get('hole') ? parseInt(searchParams.get('hole')!) : null

  const [position, setPosition] = useState<LatLng>(DEFAULT_POSITION)
  const [pinPosition, setPinPosition] = useState<LatLng | null>(null)
  const [gpsLoading, setGpsLoading] = useState(true)

  useEffect(() => {
    // checkモードは前回のピンを復元する
    if (mode === 'check') {
      const prevLat = localStorage.getItem('pinLat')
      const prevLng = localStorage.getItem('pinLng')
      if (prevLat && prevLng) {
        setPinPosition({ lat: parseFloat(prevLat), lng: parseFloat(prevLng) })
      }
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsLoading(false)
      },
      () => {
        setGpsLoading(false)
      }
    )
  }, [mode])

  async function handleComplete() {
    if (!pinPosition) return
    // localStorageに保存
    localStorage.setItem('pinLat', String(pinPosition.lat))
    localStorage.setItem('pinLng', String(pinPosition.lng))
    // ラウンド中ならDBのholeにも保存
    if (roundId && holeNumber) {
      await fetch('/api/hole', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roundId,
          holeNumber,
          pinLat: pinPosition.lat,
          pinLng: pinPosition.lng,
        }),
      })
    }
    router.push('/')
  }

  const isCheckMode = mode === 'check'

  return (
    <main className="flex h-screen flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between bg-green-700 px-4 py-3 text-white">
        <button onClick={() => router.back()} className="text-sm">
          ← 戻る
        </button>
        <h1 className="font-bold">
          {isCheckMode ? '距離を確認' : pinPosition ? 'ピンを変更できます' : 'ピンをタップしてセット'}
        </h1>
        <div className="w-12" />
      </div>

      {/* マップ */}
      <div className="flex-1 relative">
        {gpsLoading ? (
          <div className="flex h-full items-center justify-center bg-gray-100">
            <p className="text-gray-500">GPS取得中...</p>
          </div>
        ) : (
          <PinMap
            initialPosition={pinPosition ?? position}
            currentPosition={position}
            initialPin={isCheckMode ? pinPosition : null}
            onPinSet={setPinPosition}
          />
        )}
      </div>

      {/* ボタン */}
      <div className="bg-white p-4 shadow-lg">
        {isCheckMode ? (
          // 距離確認モード: 戻るだけ
          <button
            onClick={() => router.push('/')}
            className="w-full rounded-2xl bg-green-600 py-4 text-lg font-bold text-white shadow transition hover:bg-green-700"
          >
            戻る
          </button>
        ) : (
          // ホール変更モード: セット完了
          <button
            onClick={handleComplete}
            disabled={!pinPosition}
            className="w-full rounded-2xl bg-green-600 py-4 text-lg font-bold text-white shadow transition hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500"
          >
            {pinPosition ? 'セット完了' : 'マップをタップしてピンを置く'}
          </button>
        )}
      </div>
    </main>
  )
}
