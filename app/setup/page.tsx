'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateClubTable, DEFAULT_LOFTS, type ClubDistance } from '@/lib/clubs'
import { createClient } from '@/lib/supabase/client'
import ClubSetup from '@/components/ClubSetup'

// デフォルトで使用する番手（全番手を有効にする）
const ALL_CLUB_NAMES = new Set(DEFAULT_LOFTS.map((c) => c.name))

export default function SetupPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [headSpeed, setHeadSpeed] = useState<string>('40')
  const [driverDistance, setDriverDistance] = useState<string>('200')
  const [clubs, setClubs] = useState<ClubDistance[]>(() => generateClubTable(200))
  const [enabledClubs, setEnabledClubs] = useState<Set<string>>(ALL_CLUB_NAMES)
  const [showDetail, setShowDetail] = useState(false)

  // ドライバー飛距離変更時にリアルタイムで番手テーブルを更新
  function handleDriverDistanceChange(value: string) {
    setDriverDistance(value)
    const ddNum = parseFloat(value)
    if (!isNaN(ddNum) && ddNum > 0) {
      setClubs(generateClubTable(ddNum))
    }
  }

  async function saveAndRedirect() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // user_profiles を upsert（headSpeed も保存）
    await supabase.from('user_profiles').upsert({
      id: user.id,
      headSpeed: parseFloat(headSpeed),
      driverDistance: parseFloat(driverDistance),
    })

    // 有効な番手だけ絞り込んで保存
    const enabledClubList = clubs.filter((c) => enabledClubs.has(c.name))

    await supabase.from('club_settings').delete().eq('userId', user.id)
    await supabase.from('club_settings').insert(
      enabledClubList.map((c) => ({
        userId: user.id,
        clubName: c.name,
        loft: c.loft,
        distance: c.distance,
      }))
    )

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

        {/* 入力フォーム */}
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
          </div>
        </div>

        {/* このまま使うボタン（推奨） */}
        <button
          onClick={() => startTransition(saveAndRedirect)}
          disabled={isPending}
          className="w-full rounded-2xl bg-green-600 py-4 text-lg font-bold text-white shadow-md transition hover:bg-green-700 active:bg-green-800 disabled:opacity-60"
        >
          {isPending ? '保存中...' : 'このまま使う（推奨）'}
        </button>

        {/* 詳細調整アコーディオン */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-gray-700"
          >
            番手・飛距離を詳細設定する
            <span>{showDetail ? '▲' : '▼'}</span>
          </button>
          {showDetail && (
            <div className="border-t px-5 pb-5 pt-4">
              <p className="mb-3 text-xs text-gray-500">使う番手にチェックを入れ、飛距離を調整してください</p>
              <ClubSetup
                clubs={clubs}
                enabledClubs={enabledClubs}
                onChange={setClubs}
                onEnabledChange={setEnabledClubs}
              />
              <button
                onClick={() => startTransition(saveAndRedirect)}
                disabled={isPending}
                className="mt-4 w-full rounded-xl bg-green-600 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-60"
              >
                {isPending ? '保存中...' : '調整して保存'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
