'use client'

import { useState } from 'react'

type Props = {
  onStart: (pars: number[]) => void
  onClose: () => void
}

export default function ParSetupModal({ onStart, onClose }: Props) {
  // 18ホール分、デフォルトはすべてPar4
  const [pars, setPars] = useState<number[]>(Array(18).fill(4))

  function cyclePar(index: number) {
    setPars(prev => {
      const next = [...prev]
      // 3 → 4 → 5 → 3 とサイクル
      next[index] = next[index] === 3 ? 4 : next[index] === 4 ? 5 : 3
      return next
    })
  }

  const totalPar = pars.reduce((sum, p) => sum + p, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">各ホールのParを設定</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>
        <p className="text-xs text-gray-400">タップで 3 → 4 → 5 と切り替えられます</p>

        {/* 前半・後半に分けて表示 */}
        {[0, 9].map(offset => (
          <div key={offset}>
            <p className="text-xs font-bold text-gray-500 mb-2">{offset === 0 ? '前半 (1〜9H)' : '後半 (10〜18H)'}</p>
            <div className="grid grid-cols-9 gap-1">
              {pars.slice(offset, offset + 9).map((par, i) => {
                const hole = offset + i + 1
                return (
                  <button
                    key={hole}
                    onClick={() => cyclePar(offset + i)}
                    className={`flex flex-col items-center rounded-xl py-2 transition active:scale-95 ${
                      par === 3 ? 'bg-red-50 text-red-600' :
                      par === 5 ? 'bg-blue-50 text-blue-600' :
                      'bg-green-50 text-green-700'
                    }`}
                  >
                    <span className="text-[10px] text-gray-400">{hole}</span>
                    <span className="text-lg font-bold">{par}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* トータルPar */}
        <div className="flex justify-between items-center rounded-xl bg-gray-50 px-4 py-2 text-sm">
          <span className="text-gray-500">トータルPar</span>
          <span className="font-bold text-gray-800">{totalPar}</span>
        </div>

        <button
          onClick={() => onStart(pars)}
          className="w-full rounded-2xl bg-green-600 py-4 text-lg font-bold text-white shadow"
        >
          ラウンド開始
        </button>
      </div>
    </div>
  )
}
