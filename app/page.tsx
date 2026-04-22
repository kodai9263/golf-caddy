'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { calcDistance } from '@/lib/distance'
import { applyWindCorrection } from '@/lib/wind'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n'
import SuggestCard from '@/components/SuggestCard'
import ScoreModal from '@/components/ScoreModal'
import ParSetupModal from '@/components/ParSetupModal'

// PinMapをプリロード（/pin への遷移後の待ち時間を削減）
const PinMap = dynamic(() => import('@/components/PinMap'), { ssr: false })

type Wind = { speed: number; direction: number }

type Hole = {
  id: string
  holeNumber: number
  par: number
  score: number | null
  putts: number | null
  pinLat: number | null
  pinLng: number | null
}

type Round = {
  id: string
  courseName: string | null
  date: string
  isActive: boolean
  holes: Hole[]
}

export default function HomePage() {
  const router = useRouter()
  const { lang, t } = useLanguage()
  const [round, setRound] = useState<Round | null>(null)
  const [currentHole, setCurrentHole] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [suggestText, setSuggestText] = useState('')
  const [suggestDistance, setSuggestDistance] = useState<number | undefined>()
  const [suggestClubs, setSuggestClubs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [showParSetup, setShowParSetup] = useState(false)
  const [roundLoading, setRoundLoading] = useState(true)

  // 進行中ラウンドを取得
  const fetchRound = useCallback(async () => {
    const res = await fetch('/api/round')
    const data = await res.json()
    setRound(data.round)
    if (data.round) {
      // 最後に未入力のホールに移動
      const holes: Hole[] = data.round.holes
      const lastScored = holes.filter((h: Hole) => h.score !== null)
      const nextHole = lastScored.length + 1
      setCurrentHole(Math.min(nextHole, 18))
    }
    setRoundLoading(false)
  }, [])

  useEffect(() => { fetchRound() }, [fetchRound])

  // 現在ホールのデータ
  const currentHoleData = round?.holes.find(h => h.holeNumber === currentHole) ?? null

  // ピン座標（DBのhole > localStorageの優先順）
  const pinLat = currentHoleData?.pinLat ?? (typeof window !== 'undefined' ? parseFloat(localStorage.getItem('pinLat') ?? '') || null : null)
  const pinLng = currentHoleData?.pinLng ?? (typeof window !== 'undefined' ? parseFloat(localStorage.getItem('pinLng') ?? '') || null : null)
  const hasPrevPin = !!(pinLat && pinLng)

  // ParSetupModalの「ラウンド開始」ボタンから呼ばれる
  async function handleStartRound(pars: number[]) {
    setShowParSetup(false)
    setRoundLoading(true)
    const res = await fetch('/api/round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseName: null, pars }),
    })
    const data = await res.json()
    setRound(data.round)
    setCurrentHole(1)
    setRoundLoading(false)
  }

  // ラウンド終了
  async function handleEndRound() {
    if (!round) return
    await fetch('/api/round', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId: round.id }),
    })
    setRound(null)
    setCurrentHole(1)
    setSuggestText('')
  }

  // ホール移動
  function handleChangeHole(dir: 1 | -1) {
    const next = currentHole + dir
    if (next < 1 || next > 18) return
    // 前のホールのスコアが未入力なら入力を促す
    if (dir === 1 && round && currentHoleData?.score == null) {
      setShowScoreModal(true)
      return
    }
    setCurrentHole(next)
    setSuggestText('')
  }

  // スコア保存
  async function handleSaveScore(score: number, putts: number | null, par: number) {
    if (!round) return
    await fetch('/api/hole', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roundId: round.id,
        holeNumber: currentHole,
        par,
        score,
        putts,
      }),
    })
    await fetchRound()
    setShowScoreModal(false)
    // スコア保存後に次のホールへ
    setCurrentHole(h => Math.min(h + 1, 18))
    setSuggestText('')
  }

  async function handleAskCaddy() {
    setIsLoading(true)
    setError(null)
    setSuggestText('')
    setSuggestDistance(undefined)
    setSuggestClubs([])

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
      if (!pinLat || !pinLng) {
        setError(t('noPinError'))
        return
      }

      // 4. 距離を計算
      const rawDistance = calcDistance(
        coords.latitude,
        coords.longitude,
        pinLat,
        pinLng
      )
      const distance = applyWindCorrection(rawDistance, wind)

      // 5. クラブ設定とヘッドスピードを並行取得
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: clubData, error: clubError }, { data: profileData }] = await Promise.all([
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

      if (clubError) {
        setError(`${t('clubFetchError')}${clubError.message}`)
        return
      }
      if (!clubData || clubData.length === 0) {
        setError(t('noClubError'))
        return
      }

      // 6. AI提案をSSEで受信
      setSuggestDistance(distance)
      setSuggestClubs(clubData.map((c: { clubName: string }) => c.clubName))
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
          lang,
        }),
      })

      if (!res.ok || !res.body) {
        setError(t('suggestError'))
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
      setError(t('error'))
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  // スコア合計（現在まで）
  const totalScore = round?.holes.reduce((sum, h) => sum + (h.score ?? 0), 0) ?? 0
  const totalPar = round?.holes.filter(h => h.score !== null).reduce((sum, h) => sum + h.par, 0) ?? 0
  const scoreDiff = totalScore - totalPar

  return (
    <main className="min-h-screen bg-green-50 p-4">
      <div className="mx-auto max-w-md space-y-4">
        {/* ヘッダー */}
        <div className="flex items-start justify-between pt-6 pb-2">
          <div className="flex-1 text-center">
            <div className="text-5xl mb-2">⛳</div>
            <h1 className="text-2xl font-bold text-green-800">{t('appTitle')}</h1>
          </div>
          <button
            onClick={() => router.push('/setup')}
            className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-gray-500 shadow-sm hover:text-green-600 transition-colors"
            aria-label={t('settings')}
          >
            {t('settings')}
          </button>
        </div>

        {roundLoading ? (
          <div className="text-center text-gray-400 py-8">{t('loading')}</div>
        ) : round ? (
          <>
            {/* ホール情報 */}
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleChangeHole(-1)}
                  disabled={currentHole <= 1}
                  className="w-10 h-10 rounded-full bg-green-50 text-green-700 font-bold text-lg disabled:opacity-30 flex items-center justify-center"
                >
                  ‹
                </button>
                <div className="text-center">
                  <div className="text-xs text-gray-400 font-medium">{t('hole')}</div>
                  <div className="text-4xl font-bold text-green-800">{currentHole}</div>
                  <div className="text-sm text-gray-500">
                    Par {currentHoleData?.par ?? 4}
                    {currentHoleData?.score != null && (
                      <span className={`ml-2 font-bold ${currentHoleData.score - currentHoleData.par < 0 ? 'text-red-500' : currentHoleData.score - currentHoleData.par > 0 ? 'text-blue-500' : 'text-gray-600'}`}>
                        {currentHoleData.score}{t('shots')}
                        ({currentHoleData.score - currentHoleData.par > 0 ? '+' : ''}{currentHoleData.score - currentHoleData.par})
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleChangeHole(1)}
                  disabled={currentHole >= 18}
                  className="w-10 h-10 rounded-full bg-green-50 text-green-700 font-bold text-lg disabled:opacity-30 flex items-center justify-center"
                >
                  ›
                </button>
              </div>

              {/* スコア入力ボタン */}
              <button
                onClick={() => setShowScoreModal(true)}
                className="mt-3 w-full rounded-xl border border-green-200 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
              >
                {currentHoleData?.score != null ? t('editScore') : t('enterScore')}
              </button>
            </div>

            {/* スコア合計 */}
            {totalPar > 0 && (
              <div className="rounded-xl bg-white px-4 py-2 shadow-sm flex justify-between items-center text-sm">
                <span className="text-gray-500">{t('total')}</span>
                <span className={`font-bold ${scoreDiff < 0 ? 'text-red-500' : scoreDiff > 0 ? 'text-blue-500' : 'text-gray-700'}`}>
                  {totalScore}{t('shots')} ({scoreDiff > 0 ? '+' : ''}{scoreDiff})
                </span>
              </div>
            )}

            {/* マップ操作ボタン */}
            {hasPrevPin ? (
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/pin?mode=check')}
                  className="flex-1 rounded-2xl border-2 border-green-600 bg-white py-4 text-base font-bold text-green-700 shadow-sm transition hover:bg-green-50 active:bg-green-100"
                >
                  {t('checkDistance')}
                </button>
                <button
                  onClick={() => router.push(`/pin?mode=new&roundId=${round.id}&hole=${currentHole}`)}
                  className="flex-1 rounded-2xl border-2 border-green-600 bg-white py-4 text-base font-bold text-green-700 shadow-sm transition hover:bg-green-50 active:bg-green-100"
                >
                  {t('setPin')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push(`/pin?mode=new&roundId=${round.id}&hole=${currentHole}`)}
                className="w-full rounded-2xl border-2 border-green-600 bg-white py-4 text-lg font-bold text-green-700 shadow-sm transition hover:bg-green-50 active:bg-green-100"
              >
                {t('setPin')}
              </button>
            )}

            {/* キャディに聞く */}
            <button
              onClick={handleAskCaddy}
              disabled={isLoading || isStreaming}
              className="w-full rounded-2xl bg-green-600 py-5 text-xl font-bold text-white shadow-lg transition hover:bg-green-700 active:bg-green-800 disabled:opacity-60"
            >
              {isLoading ? t('fetching') : isStreaming ? t('thinking') : t('askCaddy')}
            </button>

            {/* ラウンド終了 */}
            <button
              onClick={handleEndRound}
              className="w-full rounded-xl py-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              {t('endRound')}
            </button>
          </>
        ) : (
          /* ラウンド未開始 */
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm text-center text-gray-500 text-sm">
              <div className="text-4xl mb-3">🏌️</div>
              <p>{t('noRound')}</p>
              <p className="text-xs mt-1 text-gray-400">{t('noRoundSub')}</p>
            </div>
            <button
              onClick={() => setShowParSetup(true)}
              className="w-full rounded-2xl bg-green-600 py-5 text-xl font-bold text-white shadow-lg transition hover:bg-green-700"
            >
              {t('startRound')}
            </button>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* AI提案表示 */}
        <SuggestCard
          text={suggestText}
          isStreaming={isStreaming}
          distance={suggestDistance}
          clubs={suggestClubs}
          holeId={currentHoleData?.id ?? null}
        />

        {/* プリロード用（非表示） */}
        <div className="hidden">
          <PinMap
            initialPosition={{ lat: 35.6812, lng: 139.7671 }}
            onPinSet={() => {}}
          />
        </div>
      </div>

      {/* Par設定モーダル */}
      {showParSetup && (
        <ParSetupModal
          onStart={handleStartRound}
          onClose={() => setShowParSetup(false)}
        />
      )}

      {/* スコア入力モーダル */}
      {showScoreModal && round && (
        <ScoreModal
          holeNumber={currentHole}
          initialPar={currentHoleData?.par ?? 4}
          initialScore={currentHoleData?.score ?? null}
          initialPutts={currentHoleData?.putts ?? null}
          onSave={handleSaveScore}
          onSkip={() => {
            setShowScoreModal(false)
            setCurrentHole(h => Math.min(h + 1, 18))
            setSuggestText('')
          }}
          onClose={() => setShowScoreModal(false)}
        />
      )}
    </main>
  )
}
