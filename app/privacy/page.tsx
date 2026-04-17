export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-green-50 p-4">
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <h1 className="text-2xl font-bold text-green-800">プライバシーポリシー</h1>
        <p className="text-sm text-gray-500">最終更新日：2026年4月17日</p>

        <section className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-green-800">1. はじめに</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            ゴルフキャディ（以下「本アプリ」）は、Googleアカウントによる認証、GPS位置情報、およびゴルフラウンドデータを利用してAIによるクラブ選択アドバイスを提供します。
            本ポリシーでは、収集する情報の種類・利用目的・管理方法についてご説明します。
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-green-800">2. 収集する情報</h2>
          <ul className="text-sm text-gray-700 space-y-2 leading-relaxed list-disc list-inside">
            <li><span className="font-medium">Googleアカウント情報：</span>メールアドレス・ユーザーID（認証目的のみ）</li>
            <li><span className="font-medium">GPS位置情報：</span>クラブ選択アドバイス時に現在地を取得します。サーバーには保存しません</li>
            <li><span className="font-medium">クラブ設定：</span>番手名・ロフト角・平均飛距離</li>
            <li><span className="font-medium">プロフィール：</span>ヘッドスピード・ドライバー平均飛距離</li>
            <li><span className="font-medium">ラウンドデータ：</span>スコア・パット数・ホールごとのピン座標</li>
            <li><span className="font-medium">ショットデータ：</span>AIへの入力距離・推奨番手・実際に使用した番手</li>
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-green-800">3. 利用目的</h2>
          <ul className="text-sm text-gray-700 space-y-2 leading-relaxed list-disc list-inside">
            <li>AIキャディによるクラブ選択アドバイスの生成</li>
            <li>ラウンドスコアの記録・管理</li>
            <li>アプリの利用状況に基づく機能改善</li>
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-green-800">4. 外部サービスへのデータ送信</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            本アプリは以下の外部サービスを利用します。各サービスのプライバシーポリシーもご確認ください。
          </p>
          <ul className="text-sm text-gray-700 space-y-2 leading-relaxed list-disc list-inside">
            <li><span className="font-medium">Supabase：</span>ユーザーデータの保存・認証管理</li>
            <li><span className="font-medium">Groq AI：</span>クラブ選択アドバイスの生成（距離・風速・番手情報を送信）</li>
            <li><span className="font-medium">Open-Meteo：</span>現在地の気象情報取得（位置情報を送信）</li>
            <li><span className="font-medium">Google：</span>OAuth認証（Googleのプライバシーポリシーに準拠）</li>
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-green-800">5. データの保管・削除</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            収集したデータはSupabaseのデータベースに保管されます。アカウントを削除された場合、関連するすべてのデータ（ラウンド・クラブ設定・ショット記録等）を削除します。削除希望の場合は下記お問い合わせ先にご連絡ください。
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-green-800">6. 第三者への提供</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            法令に基づく場合を除き、ユーザーの個人情報を第三者に提供・販売することはありません。
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-green-800">7. お問い合わせ</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            プライバシーポリシーに関するご質問・データ削除のご要望は下記までご連絡ください。
          </p>
          <p className="text-sm font-medium text-green-700">
            golfcaddy.support@gmail.com
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm space-y-3">
          <h2 className="text-lg font-bold text-green-800">8. ポリシーの変更</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            本ポリシーを変更する場合は、このページに新しいポリシーを掲載します。重要な変更がある場合は、アプリ内でお知らせします。
          </p>
        </section>
      </div>
    </main>
  )
}
