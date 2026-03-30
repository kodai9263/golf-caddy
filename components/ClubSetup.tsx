'use client'

import type { ClubDistance } from '@/lib/clubs'

type Props = {
  clubs: ClubDistance[]
  enabledClubs: Set<string>
  onChange: (clubs: ClubDistance[]) => void
  onEnabledChange: (enabled: Set<string>) => void
}

export default function ClubSetup({ clubs, enabledClubs, onChange, onEnabledChange }: Props) {
  function handleDistanceChange(index: number, value: string) {
    const distance = parseInt(value, 10)
    if (isNaN(distance)) return
    const updated = clubs.map((club, i) =>
      i === index ? { ...club, distance } : club
    )
    onChange(updated)
  }

  function handleEnabledChange(name: string, checked: boolean) {
    const next = new Set(enabledClubs)
    if (checked) next.add(name)
    else next.delete(name)
    onEnabledChange(next)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="pb-2 pr-3 font-medium">使用</th>
            <th className="pb-2 pr-4 font-medium">番手</th>
            <th className="pb-2 pr-4 font-medium">ロフト</th>
            <th className="pb-2 font-medium">飛距離 (yd)</th>
          </tr>
        </thead>
        <tbody>
          {clubs.map((club, i) => {
            const enabled = enabledClubs.has(club.name)
            return (
              <tr key={club.name} className={`border-b last:border-0 transition-opacity ${!enabled ? 'opacity-40' : ''}`}>
                <td className="py-2 pr-3">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handleEnabledChange(club.name, e.target.checked)}
                    className="h-4 w-4 accent-green-600"
                  />
                </td>
                <td className="py-2 pr-4 font-medium text-gray-800">{club.name}</td>
                <td className="py-2 pr-4 text-gray-500">{club.loft}°</td>
                <td className="py-2">
                  <input
                    type="number"
                    value={club.distance}
                    onChange={(e) => handleDistanceChange(i, e.target.value)}
                    disabled={!enabled}
                    className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-center text-gray-800 focus:border-green-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                    min={0}
                    max={400}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
