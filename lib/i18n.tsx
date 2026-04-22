'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Lang = 'ja' | 'en'

const translations = {
  ja: {
    // 共通
    loading: '読み込み中...',
    back: '← 戻る',
    error: 'エラーが発生しました。もう一度お試しください。',

    // メインページ
    appTitle: 'ゴルフキャディ',
    settings: '⚙️ 設定',
    hole: 'HOLE',
    shots: '打',
    editScore: '📝 スコアを修正',
    enterScore: '📝 スコアを入力',
    total: 'トータル',
    checkDistance: '🗺️ 距離を確認',
    setPin: '🚩 ピンをセット',
    fetching: '取得中...',
    thinking: '考え中...',
    askCaddy: '🏌️ キャディに聞く',
    endRound: 'ラウンドを終了する',
    noRound: 'ラウンドを開始してください',
    noRoundSub: 'スコア記録・ピン管理ができます',
    startRound: 'Par設定してラウンド開始',
    noPinError: 'ピンがセットされていません。先に「ピンをセット」してください。',
    noClubError: '番手設定がありません。セットアップを完了してください。',
    suggestError: '提案の取得に失敗しました',
    clubFetchError: 'クラブ取得エラー: ',

    // ピンページ
    checkDistanceTitle: '距離を確認',
    changePinTitle: 'ピンを変更できます',
    setPinTitle: 'ピンをタップしてセット',
    gettingGps: 'GPS取得中...',
    backBtn: '戻る',
    setComplete: 'セット完了',
    tapToSetPin: 'マップをタップしてピンを置く',

    // 設定ページ
    setupTitle: '初期設定',
    setupSub: 'あなたのデータを入力してください',
    headSpeedLabel: 'ヘッドスピード (m/s)',
    headSpeedHint: 'AIが振り幅・力加減のアドバイスに使用します',
    driverDistanceLabel: 'ドライバー平均飛距離 (ヤード)',
    driverDistanceHint: '標準番手を選んだとき飛距離を自動入力します',
    bagClubs: 'バッグのクラブ',
    clubStats: '📊 番手別実績',
    times: '回',
    saving: '保存中...',
    saveStart: '保存して始める',
    headSpeedRequired: 'ヘッドスピードを入力してください',
    driverDistanceRequired: 'ドライバー平均飛距離を入力してください',
    clubRequired: 'クラブを1本以上追加してください',
    language: '言語 / Language',

    // ログインページ
    loginTagline: 'AIがクラブ選択をサポートします',
    lineWarningTitle: 'LINEのブラウザではログインできません',
    lineWarningBody1: '画面右下の',
    lineWarningBody2: 'をタップして',
    lineWarningBody3: '「ブラウザで開く」を選択してください',
    webviewWarningTitle: 'このブラウザではログインできません',
    webviewWarningBody: 'SafariまたはChromeでこのページを開いてください',
    copyUrl: 'URLをコピーする',
    signInGoogle: 'Googleでログイン',
    privacyPre: 'ログインすることで',
    privacyLink: 'プライバシーポリシー',
    privacyPost: 'に同意したものとみなします',

    // SuggestCard
    caddyAdvice: '🏌️ キャディのアドバイス',
    readAloud: '🔊 読み上げる',
    saved: '✅ 記録しました',
    recordClub: '実際に使った番手を記録',

    // ScoreModal
    scoreLabel: 'スコア',
    puttsLabel: 'パット数（任意）',
    clear: 'クリア',
    saveNextHole: '保存して次のホールへ',
    skipNextHole: 'スコアを入力せず次へ',
    holeScore: 'ホール',
    holeScoreSuffix: 'スコア',

    // ClubSetup
    clubNameHeader: '番手',
    loftHeader: 'ロフト (°)',
    distanceHeader: '飛距離 (yd)',
    noClubs: 'クラブを追加してください',
    clubNamePlaceholder: '番手名（例: 7I, 4U, 52°）',
    loftPlaceholder: 'ロフト°',
    distancePlaceholder: '飛距離',
    addClub: '追加',
    removeClubLabel: 'を外す',

    // ParSetupModal
    parSetupTitle: '各ホールのParを設定',
    parSetupHint: 'タップで 3 → 4 → 5 と切り替えられます',
    frontNine: '前半 (1〜9H)',
    backNine: '後半 (10〜18H)',
    totalPar: 'トータルPar',
    startRoundBtn: 'ラウンド開始',
  },
  en: {
    // Common
    loading: 'Loading...',
    back: '← Back',
    error: 'An error occurred. Please try again.',

    // Main page
    appTitle: 'Golf Caddy',
    settings: '⚙️ Settings',
    hole: 'HOLE',
    shots: ' shots',
    editScore: '📝 Edit Score',
    enterScore: '📝 Enter Score',
    total: 'Total',
    checkDistance: '🗺️ Check Distance',
    setPin: '🚩 Set Pin',
    fetching: 'Loading...',
    thinking: 'Thinking...',
    askCaddy: '🏌️ Ask Caddy',
    endRound: 'End Round',
    noRound: 'Start a round to begin',
    noRoundSub: 'Record scores and manage pins',
    startRound: 'Set Par & Start Round',
    noPinError: 'Pin not set. Please set the pin first.',
    noClubError: 'No club settings. Please complete setup.',
    suggestError: 'Failed to get suggestion',
    clubFetchError: 'Club fetch error: ',

    // Pin page
    checkDistanceTitle: 'Check Distance',
    changePinTitle: 'You can change the pin',
    setPinTitle: 'Tap map to set pin',
    gettingGps: 'Getting GPS...',
    backBtn: 'Back',
    setComplete: 'Set Complete',
    tapToSetPin: 'Tap the map to set pin',

    // Setup page
    setupTitle: 'Settings',
    setupSub: 'Enter your player data',
    headSpeedLabel: 'Head Speed (m/s)',
    headSpeedHint: 'Used by AI for swing advice',
    driverDistanceLabel: 'Driver Average Distance (yards)',
    driverDistanceHint: 'Auto-fills distance when selecting standard clubs',
    bagClubs: 'Clubs in Bag',
    clubStats: '📊 Club Stats',
    times: 'x',
    saving: 'Saving...',
    saveStart: 'Save & Start',
    headSpeedRequired: 'Please enter head speed',
    driverDistanceRequired: 'Please enter driver distance',
    clubRequired: 'Please add at least one club',
    language: '言語 / Language',

    // Login page
    loginTagline: 'AI-powered club selection assistant',
    lineWarningTitle: 'Cannot log in from LINE browser',
    lineWarningBody1: 'Tap',
    lineWarningBody2: 'at the bottom right',
    lineWarningBody3: 'and select "Open in Browser"',
    webviewWarningTitle: 'Cannot log in from this browser',
    webviewWarningBody: 'Please open this page in Safari or Chrome',
    copyUrl: 'Copy URL',
    signInGoogle: 'Sign in with Google',
    privacyPre: 'By logging in, you agree to our',
    privacyLink: 'Privacy Policy',
    privacyPost: '',

    // SuggestCard
    caddyAdvice: '🏌️ Caddy Advice',
    readAloud: '🔊 Read Aloud',
    saved: '✅ Saved',
    recordClub: 'Record the club you used',

    // ScoreModal
    scoreLabel: 'Score',
    puttsLabel: 'Putts (optional)',
    clear: 'Clear',
    saveNextHole: 'Save & Next Hole',
    skipNextHole: 'Skip & Next Hole',
    holeScore: 'Hole',
    holeScoreSuffix: 'Score',

    // ClubSetup
    clubNameHeader: 'Club',
    loftHeader: 'Loft (°)',
    distanceHeader: 'Distance (yd)',
    noClubs: 'Add clubs to your bag',
    clubNamePlaceholder: 'Club name (e.g. 7I, 4U, 52°)',
    loftPlaceholder: 'Loft°',
    distancePlaceholder: 'Distance',
    addClub: 'Add',
    removeClubLabel: ' Remove',

    // ParSetupModal
    parSetupTitle: 'Set Par for Each Hole',
    parSetupHint: 'Tap to cycle 3 → 4 → 5',
    frontNine: 'Front 9 (1–9)',
    backNine: 'Back 9 (10–18)',
    totalPar: 'Total Par',
    startRoundBtn: 'Start Round',
  },
} as const

export type TranslationKey = keyof typeof translations.ja

type LangContextType = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
}

const LangContext = createContext<LangContextType>({
  lang: 'ja',
  setLang: () => {},
  t: (key) => translations.ja[key],
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ja')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null
    if (saved === 'ja' || saved === 'en') {
      setLangState(saved)
    } else if (!navigator.language.startsWith('ja')) {
      // ブラウザ言語が日本語以外なら英語をデフォルトに
      setLangState('en')
    }
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: (key) => translations[lang][key] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LangContext)
}
