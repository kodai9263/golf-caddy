type LatLng = { lat: number; lng: number }

/**
 * OpenTopoData (SRTM30m) から複数地点の標高（メートル）を取得する
 * 失敗した場合は null を返す
 */
export async function getElevations(
  points: LatLng[]
): Promise<(number | null)[]> {
  const locations = points.map(p => `${p.lat},${p.lng}`).join('|')
  const res = await fetch(
    `https://api.opentopodata.org/v1/srtm30m?locations=${locations}`
  )
  if (!res.ok) throw new Error('標高データの取得に失敗しました')
  const data = await res.json()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.results.map((r: any) => r.elevation as number | null)
}
