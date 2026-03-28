'use client'

import { isSpeechSupported, speak } from '@/lib/speech'

type Props = {
  text: string        // ストリーミング中のテキスト
  isStreaming: boolean // ストリーミング中かどうか
}

export default function SuggestCard({ text, isStreaming }: Props) {
  if (!text) return null

  return (
    <div className="rounded-2xl bg-green-50 p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">🏌️</span>
        <span className="text-sm font-medium text-green-800">キャディのアドバイス</span>
      </div>

      {/* アドバイス本文（常時テキスト表示） */}
      <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
        {text}
        {/* ストリーミング中のカーソル点滅 */}
        {isStreaming && (
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-green-600" />
        )}
      </p>

      {/* 読み上げボタン（ストリーミング完了後 & Speech API対応時のみ表示） */}
      {!isStreaming && isSpeechSupported() && (
        <button
          onClick={() => speak(text)}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700 active:bg-green-800"
        >
          🔊 読み上げる
        </button>
      )}
    </div>
  )
}
