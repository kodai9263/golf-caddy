type Club = { name: string; distance: number }

/**
 * オフライン時のルールベースクラブ推薦
 * 外部APIを使わずにローカルで計算する
 *
 * @param distanceYd - 風補正済みの目標距離（ヤード）
 * @param clubs      - ユーザーの番手設定
 */
export function localSuggest(distanceYd: number, clubs: Club[]): string {
  if (clubs.length === 0) {
    return '番手設定がありません。セットアップを完了してください。'
  }

  // 目標距離に近い順にソート
  const sorted = [...clubs].sort(
    (a, b) => Math.abs(a.distance - distanceYd) - Math.abs(b.distance - distanceYd)
  )
  const best = sorted[0]
  const diff = Math.round(distanceYd - best.distance)

  const lines: string[] = []
  lines.push(`📡 オフラインモード`)
  lines.push('')
  lines.push(`**推奨クラブ: ${best.name}**`)
  lines.push(`設定飛距離 ${best.distance}yd ／ 目標 ${distanceYd}yd`)
  lines.push('')

  if (Math.abs(diff) <= 5) {
    lines.push(`ちょうど${best.name}の距離です。通常通りに打ちましょう。`)
  } else if (diff > 0) {
    // 目標の方が遠い → 1番手上も候補
    const longer = sorted.find(c => c.distance > best.distance)
    lines.push(`設定距離より ${diff}yd 遠いです。やや強めに振るか、1番手上を検討してください。`)
    if (longer) {
      lines.push(`（参考: ${longer.name} = ${longer.distance}yd）`)
    }
  } else {
    // 目標の方が近い → 1番手下も候補
    const shorter = sorted.find(c => c.distance < best.distance)
    lines.push(`設定距離より ${Math.abs(diff)}yd 近いです。抑えて打つか、1番手下を検討してください。`)
    if (shorter) {
      lines.push(`（参考: ${shorter.name} = ${shorter.distance}yd）`)
    }
  }

  return lines.join('\n')
}
