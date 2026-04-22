'use client'

import { useState } from 'react'
import { isSpeechSupported, speak } from '@/lib/speech'
import { useLanguage } from '@/lib/i18n'

type Props = {
  text: string
  isStreaming: boolean
  distance?: number
  recommendedClub?: string
  clubs?: string[]
  holeId?: string | null
}

export default function SuggestCard({ text, isStreaming, distance, clubs, holeId }: Props) {
  const { t } = useLanguage()
  const [shotSaved, setShotSaved] = useState(false)
  const [savingClub, setSavingClub] = useState<string | null>(null)

  if (!text) return null

  // AIテキストから推奨番手を抽出（「〇〇番アイアン」「ドライバー」「PW」等）
  const extractRecommended = (t: string): string => {
    const match = t.match(/[「『]([^」』]+(?:アイアン|ウッド|ドライバー|ウェッジ|PW|AW|SW|HW|UT|FW|\d+W|\d+I))[」』]|(\S+(?:アイアン|ウッド|ドライバー|ウェッジ|PW|AW|SW|HW|UT|FW|\d+W|\d+I))/)
    return match ? (match[1] ?? match[2]) : ''
  }
  const recommended = extractRecommended(text)

  async function handleSaveShot(usedClub: string) {
    if (!distance) return
    setSavingClub(usedClub)
    await fetch('/api/shot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        holeId: holeId ?? null,
        distance,
        recommendedClub: recommended || usedClub,
        usedClub,
      }),
    })
    setShotSaved(true)
    setSavingClub(null)
  }

  return (
    <div className="rounded-2xl bg-green-50 p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-green-800">{t('caddyAdvice')}</span>
      </div>

      {/* アドバイス本文 */}
      <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
        {text}
        {isStreaming && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-green-600" />
        )}
      </p>

      {/* ストリーミング完了後に操作ボタンを表示 */}
      {!isStreaming && (
        <>
          {/* 読み上げボタン */}
          {isSpeechSupported() && (
            <button
              onClick={() => speak(text)}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700"
            >
              {t('readAloud')}
            </button>
          )}

          {/* 使った番手の記録 */}
          {distance && clubs && clubs.length > 0 && (
            <div className="border-t border-green-100 pt-3">
              {shotSaved ? (
                <p className="text-sm text-green-700 font-medium">{t('saved')}</p>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-2">{t('recordClub')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {clubs.map(club => (
                      <button
                        key={club}
                        onClick={() => handleSaveShot(club)}
                        disabled={savingClub !== null}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                          recommended === club
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-green-200 text-green-700 hover:bg-green-50'
                        } disabled:opacity-50`}
                      >
                        {club}
                        {recommended === club && ' ★'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
