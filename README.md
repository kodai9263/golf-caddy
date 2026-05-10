# Golf Caddy

AIがクラブ選択をサポートする、スマートフォン向けゴルフキャディPWAです。現在地・ピン位置・風速/風向・ユーザーごとのクラブ飛距離をもとに、ラウンド中の番手選び、スコア記録、ショット実績の蓄積を行います。

## 主な機能

- Googleログインによるユーザー認証
- ヘッドスピード、ドライバー飛距離、バッグ内クラブの登録
- GPSと地図タップによるピン位置設定
- Open-Meteoの風速/風向データを使った距離補正
- Groq APIによるAIキャディ提案のストリーミング表示
- オフライン時のルールベース番手提案
- 18ホールのラウンド開始、Par設定、スコア/パット記録
- PWA対応とマップタイル/天気APIキャッシュ
- 日本語/英語の表示切り替え

## 技術構成

- Next.js 16.2 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth / Database
- Prisma 7
- Leaflet / React Leaflet
- Groq SDK
- Resend
- next-pwa

## セットアップ

Node.js 20.9以上が必要です。Next.js 16ではTurbopackがデフォルトの開発/ビルドバンドラーとして使われます。

```bash
npm install
npm run dev
```

起動後、ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 環境変数

ルート直下に `.env` を作成し、以下を設定します。`.env` はコミットしないでください。

```bash
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GROQ_API_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_GA_ID=
GA4_PROPERTY_ID=
GOOGLE_APPLICATION_CREDENTIALS=
```

必須度の目安:

- アプリ起動/認証: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`
- DB/Prisma: `DATABASE_URL`, `DIRECT_URL`
- AIキャディ提案: `GROQ_API_KEY`
- フィードバック送信: `RESEND_API_KEY`
- 計測: `NEXT_PUBLIC_GA_ID`, `GA4_PROPERTY_ID`, `GOOGLE_APPLICATION_CREDENTIALS`

`NEXT_PUBLIC_` 付きの値はブラウザに公開されます。秘密鍵やサーバー専用トークンには使わないでください。

## Supabase

このアプリはSupabase AuthのGoogleログインを使います。Supabase側でGoogle Providerを有効化し、開発環境では以下のようなリダイレクトURLを許可してください。

```text
http://localhost:3000/api/auth/callback
```

本番環境では `NEXT_PUBLIC_SITE_URL` を本番URLに変更し、同じく `/api/auth/callback` を許可します。

## Database / Prisma

Prismaスキーマは [prisma/schema.prisma](/Users/yabekoudai/golf-caddy/prisma/schema.prisma) にあります。主なテーブルは以下です。

- `user_profiles`: ユーザーのヘッドスピード/ドライバー飛距離
- `club_settings`: ユーザーごとのクラブ構成と飛距離
- `rounds`: ラウンド
- `holes`: ホールごとのPar、スコア、ピン位置
- `shots`: 使用クラブ実績
- `subscriptions`: プラン情報

Prisma Clientの出力先は `app/generated/prisma` です。

```bash
npx prisma generate
npx prisma migrate dev
```

マイグレーションには `DIRECT_URL` が使われます。

## 開発コマンド

```bash
npm run dev      # 開発サーバー
npm run build    # 本番ビルド
npm run start    # 本番サーバー
npm run lint     # ESLint
```

## 主要ルート

- `/login`: Googleログイン
- `/`: ラウンド中のキャディ提案、ホール移動、スコア入力
- `/setup`: プレイヤー情報とクラブ設定
- `/pin`: ピン位置設定、目標地点までの距離確認
- `/privacy`: プライバシーポリシー

## API

- `GET /api/round`: 進行中ラウンド取得
- `POST /api/round`: ラウンド開始
- `PATCH /api/round`: ラウンド終了
- `POST /api/hole`: ホール情報保存
- `GET /api/shot`: 番手実績取得
- `POST /api/shot`: ショット実績保存
- `GET /api/weather`: Open-Meteoから風速/風向を取得
- `POST /api/suggest`: GroqでAIキャディ提案を生成
- `GET /api/auth/google-url`: GoogleログインURL生成
- `GET /api/auth/callback`: Supabase Auth callback
- `POST /api/feedback`: フィードバック送信

## PWA

[next.config.ts](/Users/yabekoudai/golf-caddy/next.config.ts) でPWAを有効化しています。

- ArcGISの衛星写真マップタイルをCache Firstで最大30日キャッシュ
- Open-Meteoの天気APIをNetwork Firstで5分キャッシュ
- マニフェストは [app/manifest.ts](/Users/yabekoudai/golf-caddy/app/manifest.ts) で定義

## 注意点

- 位置情報を使うため、ブラウザ側でGPS許可が必要です。
- `/`, `/setup`, `/pin` はログイン必須です。
- LINE内ブラウザや一部WebViewではGoogleログインが制限されるため、ログイン画面で外部ブラウザ利用を案内します。
- Next.js関連の実装を変更する場合は、`node_modules/next/dist/docs/` の該当ガイドを確認してください。
