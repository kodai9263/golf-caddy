'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// SSR無効でPinMapを読み込む（Leafletはブラウザ専用のため）
const PinMap = dynamic(() => import('@/components/PinMap'), { ssr: false })

type LatLng = { lat: number; lng: number }

const DEFAULT_POSITION: LatLng = { lat: 35.6812, lng: 139.7671 } // 東京（フォールバック）

export default function PinPage() {
  const router = useRouter()
  const [position, setPosition] = useState<LatLng>(DEFAULT_POSITION)
  const [pinPosition, setPinPosition] = useState<LatLng | null>(null)
  const [gpsLoading, setGpsLoading] = useState(true)

  // 現在地を取得してマップの初期位置に設定
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setGpsLoading(false)
      },
      () => {
        setGpsLoading(false) // GPS取得失敗時はデフォルト位置を使用
      }
    )
  }, [])

  function handleComplete() {
    if (!pinPosition) return
    localStorage.setItem('pinLat', String(pinPosition.lat))
    localStorage.setItem('pinLng', String(pinPosition.lng))
    router.push('/')
  }

  return (
    <main className="flex h-screen flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between bg-green-700 px-4 py-3 text-white">
        <button onClick={() => router.back()} className="text-sm">
          ← 戻る
        </button>
        <h1 className="font-bold">ピンをタップしてセット</h1>
        <div className="w-12" />
      </div>

      {/* マップ */}
      <div className="flex-1 relative">
        {gpsLoading ? (
          <div className="flex h-full items-center justify-center bg-gray-100">
            <p className="text-gray-500">GPS取得中...</p>
          </div>
        ) : (
          <PinMap initialPosition={position} onPinSet={setPinPosition} />
        )}
      </div>

      {/* セット完了ボタン */}
      <div className="bg-white p-4 shadow-lg">
        <button
          onClick={handleComplete}
          disabled={!pinPosition}
          className="w-full rounded-2xl bg-green-600 py-4 text-lg font-bold text-white shadow transition hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500"
        >
          {pinPosition ? 'セット完了' : 'マップをタップしてピンを置く'}
        </button>
      </div>
    </main>
  )
}
