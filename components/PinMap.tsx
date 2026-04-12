'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { calcDistance, calcEffectiveDistance } from '@/lib/distance'
import { getElevations } from '@/lib/elevation'

// ピンアイコン（旗）
const pinIcon = L.divIcon({
  className: '',
  html: '<div style="font-size:28px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.6))">🚩</div>',
  iconSize: [28, 28],
  iconAnchor: [4, 28],
})

// 目標地点アイコン（白丸）
const targetIcon = L.divIcon({
  className: '',
  html: '<div style="width:20px;height:20px;background:white;border:3px solid #ccc;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.5)"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// 現在地アイコン（赤い丸）
const currentIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;background:#dc2626;border:3px solid white;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.5)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

type LatLng = { lat: number; lng: number }

// フェーズ: 'pin' = ピンセット中, 'target' = 目標地点確認中
type Phase = 'pin' | 'target'

type Props = {
  initialPosition: LatLng
  currentPosition?: LatLng | null
  initialPin?: LatLng | null  // 前回のピン座標（復元用）
  onPinSet: (position: LatLng) => void
  onAskCaddy?: (distance: number) => void  // 目標地点でキャディに聞く
}

function TapHandler({ onTap }: { onTap: (pos: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onTap({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

export default function PinMap({ initialPosition, currentPosition, initialPin, onPinSet, onAskCaddy }: Props) {
  const [phase, setPhase] = useState<Phase>(initialPin ? 'target' : 'pin')
  const [pinPosition, setPinPosition] = useState<LatLng | null>(initialPin ?? null)
  const [targetPosition, setTargetPosition] = useState<LatLng | null>(null)

  // 標高データ（メートル）
  const [elevCurrent, setElevCurrent] = useState<number | null>(null)
  const [elevPin, setElevPin] = useState<number | null>(null)
  const [elevTarget, setElevTarget] = useState<number | null>(null)
  const [elevLoading, setElevLoading] = useState(false)

  // ピンと現在地が揃ったタイミングで標高を取得
  useEffect(() => {
    if (!currentPosition || !pinPosition) return
    setElevLoading(true)
    getElevations([currentPosition, pinPosition])
      .then(([ec, ep]) => {
        setElevCurrent(ec)
        setElevPin(ep)
      })
      .catch(() => { /* 標高取得失敗時は無視して水平距離のみ表示 */ })
      .finally(() => setElevLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinPosition])

  // 自分→ターゲット距離
  const distToTarget = currentPosition && targetPosition
    ? calcDistance(currentPosition.lat, currentPosition.lng, targetPosition.lat, targetPosition.lng)
    : null

  // ターゲット→ピン距離
  const distTargetToPin = targetPosition && pinPosition
    ? calcDistance(targetPosition.lat, targetPosition.lng, pinPosition.lat, pinPosition.lng)
    : null

  // 自分→ピン距離（ピンセット直後に表示）
  const distToPin = currentPosition && pinPosition && phase === 'pin'
    ? calcDistance(currentPosition.lat, currentPosition.lng, pinPosition.lat, pinPosition.lng)
    : null

  // 傾斜考慮の実効距離（自分→ピン）
  const effectiveDistToPin =
    distToPin !== null && elevCurrent !== null && elevPin !== null
      ? calcEffectiveDistance(distToPin, elevPin - elevCurrent)
      : null

  // 傾斜考慮の実効距離（自分→ターゲット）
  const effectiveDistToTarget =
    distToTarget !== null && elevCurrent !== null && elevTarget !== null
      ? calcEffectiveDistance(distToTarget, elevTarget - elevCurrent)
      : null

  function handleTap(pos: LatLng) {
    if (phase === 'pin' && !pinPosition) {
      // ピン未セット時のみピンを置く
      setPinPosition(pos)
      onPinSet(pos)
    } else {
      // ピンセット済み or target フェーズ: 目標地点を更新
      if (phase === 'pin') setPhase('target')
      setTargetPosition(pos)
      if (currentPosition) {
        getElevations([pos])
          .then(([et]) => setElevTarget(et))
          .catch(() => {})
      }
    }
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[initialPosition.lat, initialPosition.lng]}
        zoom={17}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri"
          maxZoom={19}
        />
        <TapHandler onTap={handleTap} />

        {/* 現在地マーカー */}
        {currentPosition && (
          <Marker position={[currentPosition.lat, currentPosition.lng]} icon={currentIcon} />
        )}

        {/* ピンマーカー */}
        {pinPosition && (
          <Marker position={[pinPosition.lat, pinPosition.lng]} icon={pinIcon} />
        )}

        {/* 目標地点マーカー */}
        {targetPosition && (
          <Marker position={[targetPosition.lat, targetPosition.lng]} icon={targetIcon} />
        )}

        {/* 自分→ピンの直線（ピンセット後、目標地点なし） */}
        {currentPosition && pinPosition && !targetPosition && (
          <Polyline
            positions={[
              [currentPosition.lat, currentPosition.lng],
              [pinPosition.lat, pinPosition.lng],
            ]}
            color="white"
            weight={2}
            dashArray="6, 6"
          />
        )}

        {/* 自分→目標地点→ピンの折れ線 */}
        {currentPosition && targetPosition && pinPosition && (
          <Polyline
            positions={[
              [currentPosition.lat, currentPosition.lng],
              [targetPosition.lat, targetPosition.lng],
              [pinPosition.lat, pinPosition.lng],
            ]}
            color="white"
            weight={2}
            dashArray="6, 6"
          />
        )}
      </MapContainer>

      {/* フェーズ切り替えボタン（ピンセット後に表示） */}
      {pinPosition && phase === 'pin' && (
        <button
          onClick={() => setPhase('target')}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] rounded-xl bg-white/90 px-4 py-2 text-sm font-bold text-gray-700 shadow-lg"
        >
          目標地点を確認する
        </button>
      )}

      {/* 目標地点確認フェーズ → ピン距離表示に戻る */}
      {phase === 'target' && (
        <button
          onClick={() => { setPhase('pin'); setTargetPosition(null) }}
          className="absolute top-4 left-4 z-[1000] rounded-xl bg-white/90 px-3 py-2 text-sm font-bold text-gray-700 shadow-lg"
        >
          ← ピン距離
        </button>
      )}

      {/* 自分→ピンの距離（ピンセット直後） */}
      {distToPin !== null && phase === 'pin' && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] rounded-2xl bg-black/70 px-6 py-3 text-white shadow-lg text-center">
          <div className="text-2xl font-bold">
            {effectiveDistToPin !== null ? effectiveDistToPin : distToPin} yd
          </div>
          {elevLoading && (
            <div className="text-xs text-white/60 mt-0.5">傾斜計算中…</div>
          )}
          {effectiveDistToPin !== null && effectiveDistToPin !== distToPin && (
            <div className="text-xs text-white/70 mt-0.5">
              水平 {distToPin} yd
              {elevPin !== null && elevCurrent !== null && (
                <span className="ml-1">
                  ({elevPin - elevCurrent > 0 ? '▲' : '▼'}{Math.abs(Math.round(elevPin - elevCurrent))}m)
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 目標地点確認フェーズの距離表示 */}
      {phase === 'target' && distToTarget !== null && (
        <>
          {/* ターゲット→ピンの残り距離（上） */}
          {distTargetToPin !== null && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] text-white text-2xl font-bold" style={{textShadow:'0 1px 4px rgba(0,0,0,0.8)'}}>
              残り {distTargetToPin} yd
            </div>
          )}
          {/* 自分→ターゲットの距離（下）・傾斜考慮あり */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] text-center">
            <div className="text-white text-2xl font-bold" style={{textShadow:'0 1px 4px rgba(0,0,0,0.8)'}}>
              {effectiveDistToTarget !== null ? effectiveDistToTarget : distToTarget} yd
            </div>
            {effectiveDistToTarget !== null && effectiveDistToTarget !== distToTarget && (
              <div className="text-white/70 text-xs mt-0.5" style={{textShadow:'0 1px 3px rgba(0,0,0,0.9)'}}>
                水平 {distToTarget} yd
                {elevTarget !== null && elevCurrent !== null && (
                  <span className="ml-1">
                    ({elevTarget - elevCurrent > 0 ? '▲' : '▼'}{Math.abs(Math.round(elevTarget - elevCurrent))}m)
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* target フェーズ: キャディに聞くボタン */}
      {phase === 'target' && distToTarget !== null && onAskCaddy && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-64">
          <button
            onClick={() => onAskCaddy(effectiveDistToTarget ?? distToTarget)}
            className="w-full rounded-2xl bg-green-600 py-3 text-base font-bold text-white shadow-lg"
          >
            🏌️ この地点でキャディに聞く
          </button>
        </div>
      )}

      {/* 目標地点確認中のヒント */}
      {phase === 'target' && !targetPosition && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] rounded-xl bg-black/60 px-4 py-2 text-sm text-white shadow">
          距離を確認したい地点をタップ
        </div>
      )}
    </div>
  )
}
