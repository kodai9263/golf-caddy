'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { generateClubTable, type ClubDistance } from '@/lib/clubs'
import { createClient } from '@/lib/supabase/client'
import ClubSetup from '@/components/ClubSetup'

export default function SetupPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [headSpeed, setHeadSpeed] = useState<string>('40')
  const [driverDistance, setDriverDistance] = useState<string>('200')
  // allClubs: 標準番手テンプレート（サジェスト・飛距離自動入力に使用）
  const [allClubs, setAllClubs] = useState<ClubDistance[]>(() => generateClubTable(200))
  // clubs: ユーザーが実際にバッグに追加した番手（初期は空）
  const [clubs, setClubs] = useState<ClubDistance[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)
  const [shotStats, setShotStats] = useState<{ club: string; count: number; avg: number; min: number; max: number }[]>([])

  // ショット実績を取得
  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/shot')
    const data = await res.json()
    if (data.stats) setShotStats(data.stats)
  }, [])

  // 既存の設定を読み込む（再設定時に前回の内容を復元）
  useEffect(() => {
    fetchStats()
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profile }, { data: clubData }] = await Promise.all([
        supabase.from('user_profiles').select('headSpeed, driverDistance').eq('id', user.id).single(),
        supabase.from('club_settings').select('clubName, loft, distance').eq('userId', user.id).order('distance', { ascending: false }),
      ])

      if (profile?.headSpeed) setHeadSpeed(String(profile.headSpeed))
      if (profile?.driverDistance) {
        setDriverDistance(String(profile.driverDistance))
        setAllClubs(generateClubTable(profile.driverDistance))
      }
      if (clubData && clubData.length > 0) {
        setClubs(clubData.map((c: { clubName: string; loft: number; distance: number }) => ({
          name: c.clubName, loft: c.loft, distance: c.distance,
        })))
      }
    }
    load()
  }, [])

  // ドライバー飛距離が変わったらテンプレートを再計算する
  // （バッグに追加済みの番手は変更しない）
  function handleDriverDistanceChange(value: string) {
    setDriverDistance(value)
    const ddNum = parseFloat(value)
    if (!isNaN(ddNum) && ddNum > 0) {
      setAllClubs(generateClubTable(ddNum))
    }
  }

  async function saveAndRedirect() {
    const hs = parseFloat(headSpeed)
    const dd = parseFloat(driverDistance)
    if (isNaN(hs) || hs <= 0) {
      setSaveError('ヘッドスピードを入力してください')
      return
    }
    if (isNaN(dd) || dd <= 0) {
      setSaveError('ドライバー平均飛距離を入力してください')
      return
    }
    if (clubs.length === 0) {
      setSaveError('クラブを1本以上追加してください')
      return
    }
    setSaveError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // user_profiles を upsert（headSpeed・driverDistance を保存）
    const { error: profileError } = await supabase.from('user_profiles').upsert({
      id: user.id,
      headSpeed: parseFloat(headSpeed),
      driverDistance: parseFloat(driverDistance),
      updatedAt: new Date().toISOString(),
    })
    if (profileError) {
      setSaveError(`プロフィール保存エラー: ${profileError.message}`)
      return
    }

    // バッグのクラブをまるごと入れ替え
    const { error: deleteError } = await supabase.from('club_settings').delete().eq('userId', user.id)
    if (deleteError) {
      setSaveError(`クラブ削除エラー: ${deleteError.message}`)
      return
    }

    const { error: insertError } = await supabase.from('club_settings').insert(
      clubs.map((c) => ({
        userId: user.id,
        clubName: c.name,
        loft: c.loft,
        distance: c.distance,
      }))
    )
    if (insertError) {
      setSaveError(`クラブ保存エラー: ${insertError.message}`)
      return
    }

    router.push('/')
  }

  return (
    <main className="min-h-screen bg-green-50 p-4">
      <div className="mx-auto max-w-md space-y-6">
        <div className="text-center pt-4">
          <div className="text-4xl mb-2">⛳</div>
          <h1 className="text-xl font-bold text-green-800">初期設定</h1>
          <p className="text-sm text-gray-500 mt-1">あなたのデータを入力してください</p>
        </div>

        {/* プレイヤー情報 */}
        <div className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ヘッドスピード (m/s)
            </label>
            <input
              type="number"
              value={headSpeed}
              onChange={(e) => setHeadSpeed(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-green-500 focus:outline-none"
              min={20}
              max={60}
              step={0.5}
            />
            <p className="mt-1 text-xs text-gray-400">AIが振り幅・力加減のアドバイスに使用します</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ドライバー平均飛距離 (ヤード)
            </label>
            <input
              type="number"
              value={driverDistance}
              onChange={(e) => handleDriverDistanceChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 focus:border-green-500 focus:outline-none"
              min={100}
              max={400}
              step={5}
            />
            <p className="mt-1 text-xs text-gray-400">標準番手を選んだとき飛距離を自動入力します</p>
          </div>
        </div>

        {/* クラブセッティング */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-medium text-gray-700 mb-3">バッグのクラブ</h2>
          <ClubSetup
            clubs={clubs}
            allClubs={allClubs}
            onChange={setClubs}
          />
        </div>

        {/* 番手実績 */}
        {shotStats.length > 0 && (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-sm font-medium text-gray-700 mb-3">📊 番手別実績</h2>
            <div className="space-y-2">
              {shotStats
                .sort((a, b) => b.avg - a.avg)
                .map(s => (
                  <div key={s.club} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 w-28">{s.club}</span>
                    <span className="text-green-700 font-bold">{s.avg} yd</span>
                    <span className="text-gray-400 text-xs">{s.min}〜{s.max} yd</span>
                    <span className="text-gray-300 text-xs">{s.count}回</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* バリデーションエラー */}
        {saveError && (
          <p className="text-sm text-red-600 text-center">{saveError}</p>
        )}

        {/* 保存ボタン */}
        <button
          onClick={() => startTransition(saveAndRedirect)}
          disabled={isPending}
          className="w-full rounded-2xl bg-green-600 py-4 text-lg font-bold text-white shadow-md transition hover:bg-green-700 active:bg-green-800 disabled:opacity-60"
        >
          {isPending ? '保存中...' : '保存して始める'}
        </button>
      </div>
    </main>
  )
}
