'use client'

import { useState } from 'react'
import type { ClubDistance } from '@/lib/clubs'
import { useLanguage } from '@/lib/i18n'

type Props = {
  clubs: ClubDistance[]
  allClubs: ClubDistance[]
  onChange: (clubs: ClubDistance[]) => void
}

export default function ClubSetup({ clubs, allClubs, onChange }: Props) {
  const { t } = useLanguage()
  const [newName, setNewName] = useState('')
  const [newDistance, setNewDistance] = useState('')
  const [newLoft, setNewLoft] = useState('')

  function handleNameInput(name: string) {
    setNewName(name)
    const template = allClubs.find((c) => c.name === name)
    if (template) {
      setNewDistance(String(template.distance))
      setNewLoft(String(template.loft))
    }
  }

  function handleAdd() {
    const distance = parseInt(newDistance, 10)
    if (!newName.trim() || isNaN(distance) || distance <= 0) return
    if (clubs.some((c) => c.name === newName.trim())) return

    const loft = parseFloat(newLoft)
    const newClub: ClubDistance = {
      name: newName.trim(),
      loft: isNaN(loft) ? 0 : loft,
      distance,
    }
    onChange([...clubs, newClub])
    setNewName('')
    setNewDistance('')
    setNewLoft('')
  }

  function handleDistanceChange(index: number, value: string) {
    const distance = parseInt(value, 10)
    if (isNaN(distance)) return
    onChange(clubs.map((club, i) => (i === index ? { ...club, distance } : club)))
  }

  function handleLoftChange(index: number, value: string) {
    const loft = parseFloat(value)
    if (isNaN(loft)) return
    onChange(clubs.map((club, i) => (i === index ? { ...club, loft } : club)))
  }

  function handleRemove(name: string) {
    onChange(clubs.filter((c) => c.name !== name))
  }

  return (
    <div className="space-y-3">
      {clubs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4 font-medium">{t('clubNameHeader')}</th>
                <th className="pb-2 pr-2 font-medium">{t('loftHeader')}</th>
                <th className="pb-2 font-medium">{t('distanceHeader')}</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {clubs.map((club, i) => (
                <tr key={club.name} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium text-gray-800">{club.name}</td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      value={club.loft || ''}
                      onChange={(e) => handleLoftChange(i, e.target.value)}
                      className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-gray-800 focus:border-green-500 focus:outline-none"
                      min={0}
                      max={70}
                      step={0.5}
                      placeholder="—"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={club.distance}
                      onChange={(e) => handleDistanceChange(i, e.target.value)}
                      className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-center text-gray-800 focus:border-green-500 focus:outline-none"
                      min={0}
                      max={400}
                    />
                  </td>
                  <td className="py-2 pl-2">
                    <button
                      type="button"
                      onClick={() => handleRemove(club.name)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                      aria-label={`${club.name}${t('removeClubLabel')}`}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-sm text-gray-400 py-3">
          {t('noClubs')}
        </p>
      )}

      {/* 番手追加フォーム */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="flex-1 min-w-32">
          <input
            type="text"
            list="club-suggestions"
            value={newName}
            onChange={(e) => handleNameInput(e.target.value)}
            placeholder={t('clubNamePlaceholder')}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
          <datalist id="club-suggestions">
            {allClubs
              .filter((c) => !clubs.some((b) => b.name === c.name))
              .map((c) => (
                <option key={c.name} value={c.name} />
              ))}
          </datalist>
        </div>
        <input
          type="number"
          value={newLoft}
          onChange={(e) => setNewLoft(e.target.value)}
          placeholder={t('loftPlaceholder')}
          className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-sm text-center focus:border-green-500 focus:outline-none"
          min={0}
          max={70}
          step={0.5}
        />
        <input
          type="number"
          value={newDistance}
          onChange={(e) => setNewDistance(e.target.value)}
          placeholder={t('distancePlaceholder')}
          className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-sm text-center focus:border-green-500 focus:outline-none"
          min={0}
          max={400}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 active:bg-green-800 transition-colors"
        >
          {t('addClub')}
        </button>
      </div>
    </div>
  )
}
