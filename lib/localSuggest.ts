import type { Lang } from './i18n'

type Club = { name: string; distance: number }

/**
 * オフライン時のルールベースクラブ推薦
 * 外部APIを使わずにローカルで計算する
 */
export function localSuggest(distanceYd: number, clubs: Club[], lang: Lang = 'ja'): string {
  if (clubs.length === 0) {
    return lang === 'en'
      ? 'No club settings. Please complete setup.'
      : '番手設定がありません。セットアップを完了してください。'
  }

  const sorted = [...clubs].sort(
    (a, b) => Math.abs(a.distance - distanceYd) - Math.abs(b.distance - distanceYd)
  )
  const best = sorted[0]
  const diff = Math.round(distanceYd - best.distance)

  if (lang === 'en') {
    const lines: string[] = []
    lines.push(`📡 Offline Mode`)
    lines.push('')
    lines.push(`**Recommended Club: ${best.name}**`)
    lines.push(`Set distance ${best.distance}yd / Target ${distanceYd}yd`)
    lines.push('')

    if (Math.abs(diff) <= 5) {
      lines.push(`This is right at ${best.name} distance. Swing normally.`)
    } else if (diff > 0) {
      const longer = sorted.find(c => c.distance > best.distance)
      lines.push(`Target is ${diff}yd farther than set distance. Swing slightly harder or consider one club up.`)
      if (longer) lines.push(`(Reference: ${longer.name} = ${longer.distance}yd)`)
    } else {
      const shorter = sorted.find(c => c.distance < best.distance)
      lines.push(`Target is ${Math.abs(diff)}yd closer than set distance. Ease off or consider one club down.`)
      if (shorter) lines.push(`(Reference: ${shorter.name} = ${shorter.distance}yd)`)
    }
    return lines.join('\n')
  }

  const lines: string[] = []
  lines.push(`📡 オフラインモード`)
  lines.push('')
  lines.push(`**推奨クラブ: ${best.name}**`)
  lines.push(`設定飛距離 ${best.distance}yd ／ 目標 ${distanceYd}yd`)
  lines.push('')

  if (Math.abs(diff) <= 5) {
    lines.push(`ちょうど${best.name}の距離です。通常通りに打ちましょう。`)
  } else if (diff > 0) {
    const longer = sorted.find(c => c.distance > best.distance)
    lines.push(`設定距離より ${diff}yd 遠いです。やや強めに振るか、1番手上を検討してください。`)
    if (longer) lines.push(`（参考: ${longer.name} = ${longer.distance}yd）`)
  } else {
    const shorter = sorted.find(c => c.distance < best.distance)
    lines.push(`設定距離より ${Math.abs(diff)}yd 近いです。抑えて打つか、1番手下を検討してください。`)
    if (shorter) lines.push(`（参考: ${shorter.name} = ${shorter.distance}yd）`)
  }

  return lines.join('\n')
}
