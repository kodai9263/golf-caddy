export type Wind = {
  speed: number      // 風速 (m/s)
  direction: number  // 風向 (度: 0=北, 90=東, 180=南, 270=西)
}

/**
 * 風補正後の飛距離を返す
 * - 向かい風: +2ヤード/m/s
 * - 追い風:   -1.5ヤード/m/s
 * playerBearing: プレイヤーの打球方向（度）
 */
export function applyWindCorrection(
  distance: number,
  wind: Wind,
  playerBearing: number = 0
): number {
  // 打球方向に対する風の成分を計算
  const angleDiff = ((wind.direction - playerBearing + 180 + 360) % 360) - 180
  const headwindComponent = Math.cos((angleDiff * Math.PI) / 180) * wind.speed

  // 向かい風(正)なら飛距離増加、追い風(負)なら飛距離減少
  const correction =
    headwindComponent >= 0
      ? headwindComponent * 2       // 向かい風: +2y/m/s
      : headwindComponent * 1.5     // 追い風: -1.5y/m/s

  return Math.round(distance + correction)
}
