'use client'

import { useState } from 'react'
import type { ClubDistance } from '@/lib/clubs'

/**
 * バッグに入れる番手と飛距離を管理するコンポーネント。
 *
 * - 初期状態は空。ユーザーが1本ずつ追加していく
 * - 名前入力はテキスト自由入力＋datalistで標準番手をサジェスト
 * - 標準番手を選ぶと飛距離が自動入力される（上書き可）
 * - 各行の ✕ でバッグから外せる
 */

type Props = {
  /** 現在バッグにある番手リスト */
  clubs: ClubDistance[]
  /** 標準番手テンプレート（名前サジェストと飛距離自動入力に使用） */
  allClubs: ClubDistance[]
  /** バッグの内容が変わったときに呼ばれるコールバック */
  onChange: (clubs: ClubDistance[]) => void
}

export default function ClubSetup({ clubs, allClubs, onChange }: Props) {
  const [newName, setNewName] = useState('')
  const [newDistance, setNewDistance] = useState('')
  const [newLoft, setNewLoft] = useState('')

  /** 番手名が変わったとき、標準番手ならば飛距離とロフトを自動入力する */
  function handleNameInput(name: string) {
    setNewName(name)
    const template = allClubs.find((c) => c.name === name)
    if (template) {
      setNewDistance(String(template.distance))
      setNewLoft(String(template.loft))
    }
  }

  /** フォームの内容をバッグに追加する */
  function handleAdd() {
    const distance = parseInt(newDistance, 10)
    if (!newName.trim() || isNaN(distance) || distance <= 0) return

    // 同名クラブが既にある場合はスキップ
    if (clubs.some((c) => c.name === newName.trim())) return

    const loft = parseFloat(newLoft)
    const newClub: ClubDistance = {
      name: newName.trim(),
      loft: isNaN(loft) ? 0 : loft,
      distance,
    }
    onChange([...clubs, newClub])
    setNewName('')
    setNewDistance('')
    setNewLoft('')
  }

  /** 指定インデックスの飛距離を更新する */
  function handleDistanceChange(index: number, value: string) {
    const distance = parseInt(value, 10)
    if (isNaN(distance)) return
    onChange(clubs.map((club, i) => (i === index ? { ...club, distance } : club)))
  }

  /** 指定インデックスのロフトを更新する */
  function handleLoftChange(index: number, value: string) {
    const loft = parseFloat(value)
    if (isNaN(loft)) return
    onChange(clubs.map((club, i) => (i === index ? { ...club, loft } : club)))
  }

  /** 番手をバッグから外す */
  function handleRemove(name: string) {
    onChange(clubs.filter((c) => c.name !== name))
  }

  return (
    <div className="space-y-3">
      {/* バッグ一覧テーブル */}
      {clubs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4 font-medium">番手</th>
                <th className="pb-2 pr-2 font-medium">ロフト (°)</th>
                <th className="pb-2 font-medium">飛距離 (yd)</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {clubs.map((club, i) => (
                <tr key={club.name} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium text-gray-800">{club.name}</td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      value={club.loft || ''}
                      onChange={(e) => handleLoftChange(i, e.target.value)}
                      className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-gray-800 focus:border-green-500 focus:outline-none"
                      min={0}
                      max={70}
                      step={0.5}
                      placeholder="—"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={club.distance}
                      onChange={(e) => handleDistanceChange(i, e.target.value)}
                      className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-center text-gray-800 focus:border-green-500 focus:outline-none"
                      min={0}
                      max={400}
                    />
                  </td>
                  <td className="py-2 pl-2">
                    <button
                      type="button"
                      onClick={() => handleRemove(club.name)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                      aria-label={`${club.name}を外す`}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-sm text-gray-400 py-3">
          クラブを追加してください
        </p>
      )}

      {/* 番手追加フォーム */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="flex-1 min-w-32">
          <input
            type="text"
            list="club-suggestions"
            value={newName}
            onChange={(e) => handleNameInput(e.target.value)}
            placeholder="番手名（例: 7I, 4U, 52°）"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
          {/* 標準番手をサジェストとして表示（自由入力も可） */}
          <datalist id="club-suggestions">
            {allClubs
              .filter((c) => !clubs.some((b) => b.name === c.name))
              .map((c) => (
                <option key={c.name} value={c.name} />
              ))}
          </datalist>
        </div>
        <input
          type="number"
          value={newLoft}
          onChange={(e) => setNewLoft(e.target.value)}
          placeholder="ロフト°"
          className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-sm text-center focus:border-green-500 focus:outline-none"
          min={0}
          max={70}
          step={0.5}
        />
        <input
          type="number"
          value={newDistance}
          onChange={(e) => setNewDistance(e.target.value)}
          placeholder="飛距離"
          className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-sm text-center focus:border-green-500 focus:outline-none"
          min={0}
          max={400}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 active:bg-green-800 transition-colors"
        >
          追加
        </button>
      </div>
    </div>
  )
}
