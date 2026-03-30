'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { calcDistance } from '@/lib/distance'
import { applyWindCorrection } from '@/lib/wind'
import { createClient } from '@/lib/supabase/client'
import SuggestCard from '@/components/SuggestCard'

// PinMapをプリロード（/pin への遷移後の待ち時間を削減）
const PinMap = dynamic(() => import('@/components/PinMap'), { ssr: false })

type Wind = { speed: number; direction: number }

export default function HomePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [suggestText, setSuggestText] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleAskCaddy() {
    setIsLoading(true)
    setError(null)
    setSuggestText('')

    try {
      // 1. 現在地を取得
      const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          reject,
          { timeout: 10000 }
        )
      })

      // 2. 風速・風向を取得
      const weatherRes = await fetch(
        `/api/weather?lat=${coords.latitude}&lon=${coords.longitude}`
      )
      const wind: Wind = await weatherRes.json()

      // 3. ピン座標を取得
      const pinLat = localStorage.getItem('pinLat')
      const pinLng = localStorage.getItem('pinLng')
      if (!pinLat || !pinLng) {
        setError('ピンがセットされていません。先に「ピンをセット」してください。')
        return
      }

      // 4. 距離を計算
      const rawDistance = calcDistance(
        coords.latitude,
        coords.longitude,
        parseFloat(pinLat),
        parseFloat(pinLng)
      )
      const distance = applyWindCorrection(rawDistance, wind)

      // 5. クラブ設定とヘッドスピードを並行取得
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: clubData }, { data: profileData }] = await Promise.all([
        supabase
          .from('club_settings')
          .select('clubName, distance')
          .eq('userId', user.id)
          .order('distance', { ascending: false }),
        supabase
          .from('user_profiles')
          .select('headSpeed')
          .eq('id', user.id)
          .single(),
      ])

      if (!clubData || clubData.length === 0) {
        setError('番手設定がありません。セットアップを完了してください。')
        return
      }

      // 6. AI提案をSSEで受信
      setIsLoading(false)
      setIsStreaming(true)
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distance,
          windSpeed: wind.speed,
          windDirection: wind.direction,
          clubs: clubData.map((c: { clubName: string; distance: number }) => ({ name: c.clubName, distance: c.distance })),
          headSpeed: profileData?.headSpeed ?? null,
        }),
      })

      if (!res.ok || !res.body) {
        setError('提案の取得に失敗しました')
        setIsStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setSuggestText((prev) => prev + decoder.decode(value))
      }
    } catch {
      setError('エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  return (
    <main className="min-h-screen bg-green-50 p-4">
      <div className="mx-auto max-w-md space-y-4">
        <div className="text-center pt-6 pb-2">
          <div className="text-5xl mb-2">⛳</div>
          <h1 className="text-2xl font-bold text-green-800">ゴルフキャディ</h1>
        </div>

        {/* ピンをセット */}
        <button
          onClick={() => router.push('/pin')}
          className="w-full rounded-2xl border-2 border-green-600 bg-white py-4 text-lg font-bold text-green-700 shadow-sm transition hover:bg-green-50 active:bg-green-100"
        >
          📍 ピンをセット
        </button>

        {/* キャディに聞く */}
        <button
          onClick={handleAskCaddy}
          disabled={isLoading || isStreaming}
          className="w-full rounded-2xl bg-green-600 py-5 text-xl font-bold text-white shadow-lg transition hover:bg-green-700 active:bg-green-800 disabled:opacity-60"
        >
          {isLoading ? '取得中...' : isStreaming ? '考え中...' : '🏌️ キャディに聞く'}
        </button>

        {/* エラー表示 */}
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* AI提案表示 */}
        <SuggestCard text={suggestText} isStreaming={isStreaming} />

        {/* プリロード用（非表示） */}
        <div className="hidden">
          <PinMap
            initialPosition={{ lat: 35.6812, lng: 139.7671 }}
            onPinSet={() => {}}
          />
        </div>
      </div>
    </main>
  )
}
