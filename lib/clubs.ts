// 13番手のデフォルトロフト角プリセット
export const DEFAULT_LOFTS: { name: string; loft: number }[] = [
  { name: 'ドライバー',    loft: 10.5 },
  { name: '3W',           loft: 15   },
  { name: '5W',           loft: 18   },
  { name: 'UT',           loft: 21   },
  { name: '5I',           loft: 25   },
  { name: '6I',           loft: 28   },
  { name: '7I',           loft: 32   },
  { name: '8I',           loft: 36   },
  { name: '9I',           loft: 40   },
  { name: 'PW',           loft: 44   },
  { name: 'AW',           loft: 50   },
  { name: 'SW',           loft: 56   },
  { name: 'LW',           loft: 60   },
]

export type ClubDistance = {
  name: string
  loft: number
  distance: number // フルショット飛距離（ヤード）
}

/**
 * ヘッドスピードとドライバー飛距離から全番手の飛距離テーブルを生成する
 * 補正係数 = 実測ドライバー飛距離 ÷ (ヘッドスピード × 6)
 */
export function generateClubTable(
  headSpeed: number,
  driverDistance: number
): ClubDistance[] {
  const baseFactor = driverDistance / (headSpeed * 6)

  return DEFAULT_LOFTS.map(({ name, loft }) => {
    // ロフト係数: ドライバーを基準に、ロフトが増えるほど飛距離が短くなる
    const loftFactor = DEFAULT_LOFTS[0].loft / loft
    const distance = Math.round(headSpeed * 6 * loftFactor * baseFactor)
    return { name, loft, distance }
  })
}

/**
 * DB形式（ClubSetting[]）をUI形式（ClubDistance[]）に変換する
 */
export function dbClubsToClubDistances(
  clubs: { clubName: string; loft: number; distance: number }[]
): ClubDistance[] {
  return clubs.map(({ clubName, loft, distance }) => ({
    name: clubName,
    loft,
    distance,
  }))
}
