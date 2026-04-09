/**
 * Haversine公式で2点間の距離をヤードで返す
 */
export function calcDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // 地球半径（メートル）
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const meters = R * c

  return Math.round(meters * 1.09361) // メートル → ヤード
}

/**
 * 傾斜を考慮した実効距離を返す（ヤード）
 * @param horizontalYd 水平距離（ヤード）
 * @param elevationChangeM 高低差（メートル）: 正=打ち上げ / 負=打ち下ろし
 * ゴルフの経験則: 1mの高低差 ≈ 2ydの実効距離変化
 */
export function calcEffectiveDistance(
  horizontalYd: number,
  elevationChangeM: number
): number {
  return Math.round(horizontalYd + elevationChangeM * 2)
}
