# ゴルフキャディPWA - MVP実装プラン

## コンセプト

- ホール開始時：マップタップでピン位置を登録（1回だけ）
- 打つ前：ボタン1つで GPS距離・風速を自動取得 → Claudeがテキスト+任意音声でアドバイス
- スコア管理・コースDBは楽天GORAに任せ、AIキャディ部分で差別化

## 競合課題と対応方針

| 競合の不満 | 本アプリの対応 |
|---|---|
| Watch必須・接続不安定 | スマホのみで完結 |
| タップ反応が遅くスロープレー | ワンボタン全自動 + マップタイルをSWキャッシュ |
| 音声が聞こえない（屋外・風） | テキスト表示をデフォルト、音声は「読み上げる」ボタンで任意 |
| 異常値が飛距離平均に混入 | 初回HS入力ベースで番手距離を決定するため影響なし |
| 初期設定が複雑 | 「このまま使う」パスで即完了、詳細調整は任意 |
| 4万円払って使えない | 無料〜低価格 |

---

## 前提：手動作業（コーディング前）

### 1. Google Cloud Console
1. APIとサービス → 認証情報 → OAuthクライアントID作成（Webアプリケーション）
2. 承認済みリダイレクトURIに `https://<supabase-project-id>.supabase.co/auth/v1/callback` を追加
3. クライアントID・シークレットをコピー

### 2. Supabase ダッシュボード
1. Authentication → Providers → Google を有効化してクライアントID/シークレットを設定

### 3. `.env` への追加
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## ステップ0: Supabase テーブル作成

```sql
-- user_profiles
CREATE TABLE public.user_profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  head_speed       NUMERIC,
  driver_distance  NUMERIC,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自身のプロファイルのみ参照" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "自身のプロファイルのみ挿入" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "自身のプロファイルのみ更新" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- club_settings
CREATE TABLE public.club_settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  club_name  TEXT NOT NULL,
  loft       NUMERIC NOT NULL,
  distance   NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.club_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自身の番手設定のみ参照" ON public.club_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "自身の番手設定のみ挿入" ON public.club_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "自身の番手設定のみ更新" ON public.club_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "自身の番手設定のみ削除" ON public.club_settings FOR DELETE USING (auth.uid() = user_id);

-- subscriptions（将来の課金用）
CREATE TABLE public.subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  plan       TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status     TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "自身のサブスクリプションのみ参照" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
```

---

## 実装ファイル一覧と順序

### ステップ1: Supabase クライアント

**`lib/supabase/server.ts`** — Server Components / Route Handlers 用

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

**`lib/supabase/client.ts`** — Client Components 用シングルトン

```typescript
import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (client) return client
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return client
}
```

---

### ステップ2: `proxy.ts`

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl
  const isProtectedRoute = pathname === '/' || pathname.startsWith('/setup') || pathname.startsWith('/pin')

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
```

---

### ステップ3: 認証フロー

**`app/api/auth/callback/route.ts`** — Google OAuthコールバック。初回は `/setup`、既存ユーザーは `/` へ。

**`app/login/page.tsx`** — Server Action で `signInWithOAuth({ provider: 'google' })` を呼び出し。

---

### ステップ4: PWA設定

**`public/manifest.json`**

```json
{
  "name": "ゴルフキャディ",
  "short_name": "キャディ",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#16a34a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**`next.config.ts`** — `@ducanh2912/next-pwa` を使ってService Worker自動生成。

`runtimeCaching` に以下を追加：
- **マップタイル** (`tile.openstreetmap.org`, `server.arcgisonline.com`): `CacheFirst` + 最大500エントリ・30日保存
  → 電波が弱いコースでもキャッシュ済みタイルを表示し、/pin の読み込み遅延を防ぐ
- **Open-Meteo API** (`api.open-meteo.com`): `NetworkFirst` + 5分キャッシュ
  → オフライン時は直近の風速データで代用

---

### ステップ5: ビジネスロジック

**`lib/clubs.ts`**
- `DEFAULT_LOFTS`: 13番手のデフォルトロフト角プリセット
- `generateClubTable(headSpeed, driverDistance)`: 補正係数 = 実測÷(HS×6)
- `dbClubsToClubDistances()`: DB取得データをUI用形式に変換
- 振り幅: full×1.0 / ×0.90 / ×0.85 / ×0.75

**`lib/wind.ts`**
- `applyWindCorrection(distance, wind)`: 向かい風+2y/m/s、追い風-1.5y/m/s

**`lib/distance.ts`** ★NEW
- `calcDistance(lat1, lng1, lat2, lng2)`: Haversine公式でメートル→ヤード変換
- ピン座標（localStorage）と現在地GPSから距離を自動計算

**`lib/speech.ts`** ★NEW
- `speak(text)`: Web Speech API (SpeechSynthesis) で日本語音声読み上げ
- 音声の発火は `SuggestCard.tsx` の「読み上げる」ボタンからのみ（自動読み上げなし）
- ブラウザ非対応時はボタンを非表示にするだけ（テキスト表示は常に存在するため問題なし）

---

### ステップ6: API Routes

**`app/api/weather/route.ts`** — `GET ?lat=&lon=` → Open-Meteo APIから風速・風向を返す。5分キャッシュ。

**`app/api/suggest/route.ts`** — `POST` → Anthropic SDK の `stream: true` でSSEストリーミング。モデル: `claude-opus-4-5`

---

### ステップ7: ページ・コンポーネント

**`app/pin/page.tsx`** (Client Component) ★NEW
1. Leaflet + Esri衛星タイルでゴルフ場を表示
2. マップタップでピン位置を指定
3. 座標を localStorage に保存
4. 「セット完了」→ `/` へ遷移
- タイルはSWキャッシュ済みのため初回以降はオフラインでも表示可能

**`app/setup/page.tsx`** (Client Component)
1. ヘッドスピード・ドライバー飛距離を入力
2. `generateClubTable()` でリアルタイム計算
3. **「このまま使う（推奨）」ボタンを最上部に表示** → タップで即DB保存 → `/` へ
4. 「詳細を調整する」アコーディオンで `ClubSetup` を展開 → 13本テーブル手動調整
5. どちらのパスも `user_profiles` upsert → `club_settings` insert

**`app/page.tsx`** (Client Component) ★大幅更新
- 「ピンをセット」ボタン → `/pin` へ遷移
  - **ボタン表示と同時に `PinMap` を `dynamic import` でプリロード開始**（遷移後の待ち時間を削減）
- 「キャディに聞く」ボタン1つ
  1. Geolocation APIで現在地取得
  2. `/api/weather` で風速・風向取得
  3. localStorage のピン座標と現在地から `calcDistance()` で距離計算
  4. `/api/suggest` にPOST → SSEストリーミング
  5. `SuggestCard` にテキスト表示（音声は手動）

**`components/PinMap.tsx`** ★NEW — Leafletマップ・ピンタップUI
**`components/ClubSetup.tsx`** — 番手テーブルの確認・調整フォーム（アコーディオン内）
**`components/SuggestCard.tsx`** — ストリーミング提案結果の表示 + 「読み上げる」ボタン
- アドバイスは**常時テキスト表示**（屋外・風音でも確実に読める）
- ストリーミング完了後に「読み上げる」ボタンが有効化 → タップで `speak()` 呼び出し
- `speak()` 非対応ブラウザではボタン自体を非表示

**`app/layout.tsx`** — manifest.json のリンク・メタデータ更新

---

## 最終ディレクトリ構成

```
golf-caddy/
├── proxy.ts
├── public/
│   ├── manifest.json                 # NEW
│   ├── icon-192.png                  # NEW
│   └── icon-512.png                  # NEW
├── app/
│   ├── layout.tsx                    # UPDATE
│   ├── page.tsx                      # UPDATE（ワンボタンUI）
│   ├── globals.css
│   ├── login/page.tsx                # NEW
│   ├── setup/page.tsx                # NEW
│   ├── pin/page.tsx                  # NEW ★
│   └── api/
│       ├── auth/callback/route.ts    # NEW
│       ├── weather/route.ts          # NEW
│       └── suggest/route.ts          # NEW
├── components/
│   ├── PinMap.tsx                    # NEW ★
│   ├── SuggestCard.tsx               # NEW
│   └── ClubSetup.tsx                 # NEW
└── lib/
    ├── clubs.ts                      # NEW
    ├── wind.ts                       # NEW
    ├── distance.ts                   # NEW ★
    ├── speech.ts                     # NEW ★
    └── supabase/
        ├── server.ts                 # NEW
        └── client.ts                 # NEW
```

---

## ユーザーフロー

```
初回
  Googleログイン → /setup
    ├─「このまま使う」→ / （HS入力だけで即完了・推奨）
    └─「詳細を調整する」→ 13本テーブル手動編集 → /

各ホール開始時
  / → 「ピンをセット」（← 同時にPinMapをプリロード開始）
    → /pin（タイルはSWキャッシュ済み・即表示）
    → マップタップ → /

打つ前（毎回）
  「キャディに聞く」ボタン
  → GPS取得 → 風速取得 → 距離計算
  → Claude提案をテキスト表示（ストリーミング）
  → 任意で「読み上げる」ボタンをタップ → 音声再生
```

---

## スケーリング考慮事項

### Anthropic APIのレート制限

利用金額に応じてティアが自動で上がり、上限も引き上がる。

| ティア | 条件 | RPM |
|---|---|---|
| Tier 1 | $5支払い後 | 50 |
| Tier 2 | $40支払い後 | 1,000 |
| Tier 4 | $5,000支払い後 | 4,000 |

**MVP段階（数十人規模）は問題なし。**
1ユーザーが1ラウンドで「キャディに聞く」は最大50回程度、かつゴルフは時間帯に分散するため同時アクセスが集中しにくい。

### ユーザーが増えてきたときの対策（優先順）

1. **ユーザーごとのレート制限** — `app/api/suggest/route.ts` 内で1時間あたりのリクエスト数をSupabaseで管理
2. **Vercel AI Gateway導入** — Claudeが上限に達した際にOpenAI等へ自動フォールバック。マークアップなしのリスト価格で利用可能
3. **Anthropicへ増枠申請** — 企業プランで対応

---

## 検証手順

1. `npm run dev` で起動
2. `http://localhost:3000` → `/login` にリダイレクトされることを確認
3. Googleログイン → `/setup` にリダイレクトされることを確認
4. HSと飛距離を入力 → 番手テーブルが自動計算されることを確認
5. 保存 → メイン画面へ
6. 「ピンをセット」→ マップタップ → ピン座標がlocalStorageに保存されることを確認
7. 「キャディに聞く」→ GPS・風速が自動取得され、アドバイスがテキストで表示されることを確認
8. 「読み上げる」ボタンをタップ → 音声が再生されることを確認
9. オフライン状態で /pin を開く → キャッシュ済みタイルが表示されることを確認
