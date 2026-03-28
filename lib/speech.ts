/**
 * Web Speech APIで日本語テキストを読み上げる
 * ブラウザ非対応時はボタン側で非表示にするだけ（テキスト表示は常に存在するため問題なし）
 */
export function speak(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  utterance.rate = 1.0

  window.speechSynthesis.cancel() // 前の読み上げを止める
  window.speechSynthesis.speak(utterance)
}

/**
 * 現在のブラウザがSpeech Synthesis APIに対応しているか返す
 */
export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
