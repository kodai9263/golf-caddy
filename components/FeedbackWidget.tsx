'use client'

import { useState } from 'react'

const CATEGORIES = ['改善要望', 'バグ報告', '使ってみたい機能', 'その他'] as const
type Category = typeof CATEGORIES[number]

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [category, setCategory] = useState<Category>('改善要望')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setStatus('submitting')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message, email }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setTimeout(() => {
        setIsOpen(false)
        setMessage('')
        setEmail('')
        setCategory('改善要望')
        setStatus('idle')
      }, 2000)
    } catch {
      setStatus('error')
    }
  }

  function handleClose() {
    setIsOpen(false)
    setMessage('')
    setEmail('')
    setCategory('改善要望')
    setStatus('idle')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-4 z-40 flex items-center gap-2 rounded-full bg-green-700 px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-green-800"
      >
        💬 フィードバック
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
          <div className="relative w-full sm:max-w-md mx-4 bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">フィードバックを送る</h2>
              <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {status === 'success' ? (
              <div className="py-8 text-center">
                <div className="text-4xl mb-3">🙏</div>
                <p className="font-medium text-green-700">ありがとうございます！</p>
                <p className="text-sm text-gray-500 mt-1">フィードバックを受け取りました</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`rounded-lg border-2 px-3 py-2 text-sm transition ${
                          category === cat
                            ? 'border-green-600 bg-green-50 text-green-800 font-medium'
                            : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メッセージ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="ご意見・ご要望をお聞かせください"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm resize-none focus:border-green-600 focus:outline-none"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    返信先メール <span className="text-gray-400 font-normal">（任意）</span>
                  </label>
                  <input
                    type="email"
                    placeholder="reply@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
                  />
                </div>

                {status === 'error' && (
                  <p className="mb-3 text-sm text-red-500">送信に失敗しました。もう一度お試しください。</p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting' || !message.trim()}
                  className="w-full rounded-xl bg-green-600 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  {status === 'submitting' ? '送信中...' : '送信する'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
