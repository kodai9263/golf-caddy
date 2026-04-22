'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n'

type Props = {
  holeNumber: number
  initialPar: number
  initialScore: number | null
  initialPutts: number | null
  onSave: (score: number, putts: number | null, par: number) => void
  onSkip: () => void
  onClose: () => void
}

export default function ScoreModal({
  holeNumber,
  initialPar,
  initialScore,
  initialPutts,
  onSave,
  onSkip,
  onClose,
}: Props) {
  const { t } = useLanguage()
  const [par, setPar] = useState(initialPar)
  const [score, setScore] = useState<number>(initialScore ?? initialPar)
  const [putts, setPutts] = useState<number | null>(initialPutts)

  const diff = score - par

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">{t('holeScore')} {holeNumber} {t('holeScoreSuffix')}</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">×</button>
        </div>

        {/* Par選択 */}
        <div>
          <p className="text-sm text-gray-500 mb-2">Par</p>
          <div className="flex gap-2">
            {[3, 4, 5].map(p => (
              <button
                key={p}
                onClick={() => setPar(p)}
                className={`flex-1 py-2 rounded-xl font-bold text-sm transition ${par === p ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* スコア入力 */}
        <div>
          <p className="text-sm text-gray-500 mb-2">{t('scoreLabel')}</p>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setScore(s => Math.max(1, s - 1))}
              className="w-12 h-12 rounded-full bg-green-50 text-green-700 text-2xl font-bold flex items-center justify-center"
            >
              −
            </button>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-800">{score}</div>
              <div className={`text-sm font-bold mt-1 ${diff < 0 ? 'text-red-500' : diff > 0 ? 'text-blue-500' : 'text-gray-500'}`}>
                {diff === 0 ? 'Even' : diff === -1 ? 'Birdie' : diff === -2 ? 'Eagle' : diff === 1 ? 'Bogey' : diff === 2 ? 'Double' : diff > 0 ? `+${diff}` : `${diff}`}
              </div>
            </div>
            <button
              onClick={() => setScore(s => s + 1)}
              className="w-12 h-12 rounded-full bg-green-50 text-green-700 text-2xl font-bold flex items-center justify-center"
            >
              ＋
            </button>
          </div>
        </div>

        {/* パット数（任意） */}
        <div>
          <p className="text-sm text-gray-500 mb-2">{t('puttsLabel')}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPutts(p => p != null ? Math.max(0, p - 1) : 2)}
              className="w-10 h-10 rounded-full bg-green-50 text-green-700 text-xl font-bold flex items-center justify-center"
            >
              −
            </button>
            <div className="flex-1 text-center text-2xl font-bold text-gray-700">
              {putts ?? '−'}
            </div>
            <button
              onClick={() => setPutts(p => p != null ? p + 1 : 2)}
              className="w-10 h-10 rounded-full bg-green-50 text-green-700 text-xl font-bold flex items-center justify-center"
            >
              ＋
            </button>
            {putts != null && (
              <button
                onClick={() => setPutts(null)}
                className="text-xs text-gray-400 underline"
              >
                {t('clear')}
              </button>
            )}
          </div>
        </div>

        {/* 保存ボタン */}
        <button
          onClick={() => onSave(score, putts, par)}
          className="w-full rounded-2xl bg-green-600 py-4 text-lg font-bold text-white shadow"
        >
          {t('saveNextHole')}
        </button>

        {/* スキップ */}
        <button
          onClick={onSkip}
          className="w-full text-sm text-gray-400 hover:text-gray-600"
        >
          {t('skipNextHole')}
        </button>
      </div>
    </div>
  )
}
