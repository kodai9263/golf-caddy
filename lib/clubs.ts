// 番手プリセット（datalistのサジェスト用。ロフト昇順で並べる）
export const DEFAULT_LOFTS: { name: string; loft: number }[] = [
  // ウッド
  { name: '1W',         loft: 10.5 },
  { name: '2W',         loft: 13   },
  { name: '3W',         loft: 15   },
  { name: '4W',         loft: 17   },
  { name: '5W',         loft: 18   },
  { name: '7W',         loft: 21   },
  { name: '9W',         loft: 24   },
  // ユーティリティ
  { name: '2UT',        loft: 17   },
  { name: '3UT',        loft: 19   },
  { name: '4UT',        loft: 22   },
  { name: '5UT',        loft: 25   },
  { name: '6UT',        loft: 28   },
  // アイアン
  { name: '2I',         loft: 17   },
  { name: '3I',         loft: 20   },
  { name: '4I',         loft: 23   },
  { name: '5I',         loft: 25   },
  { name: '6I',         loft: 28   },
  { name: '7I',         loft: 32   },
  { name: '8I',         loft: 36   },
  { name: '9I',         loft: 40   },
  // ウェッジ
  { name: 'PW',         loft: 44   },
  { name: '46°',        loft: 46   },
  { name: '48°',        loft: 48   },
  { name: 'AW',         loft: 50   },
  { name: '52°',        loft: 52   },
  { name: '54°',        loft: 54   },
  { name: 'SW',         loft: 56   },
  { name: '58°',        loft: 58   },
  { name: 'LW',         loft: 60   },
  { name: '62°',        loft: 62   },
  { name: '64°',        loft: 64   },
]

export type ClubDistance = {
  name: string
  loft: number
  distance: number // フルショット飛距離（ヤード）
}

/**
 * ドライバー飛距離から全番手の飛距離テーブルを生成する
 * 各番手の飛距離 = ドライバー飛距離 × (ドライバーロフト / 各番手ロフト)
 */
export function generateClubTable(driverDistance: number): ClubDistance[] {
  return DEFAULT_LOFTS.map(({ name, loft }) => {
    // ロフト係数: ドライバーを基準に、ロフトが増えるほど飛距離が短くなる
    const loftFactor = DEFAULT_LOFTS[0].loft / loft
    const distance = Math.round(driverDistance * loftFactor)
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
