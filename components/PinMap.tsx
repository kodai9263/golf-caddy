'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Leafletのデフォルトアイコン修正（Next.js環境での画像パス問題）
const pinIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

type LatLng = { lat: number; lng: number }

type Props = {
  initialPosition: LatLng
  onPinSet: (position: LatLng) => void
}

// マップタップでピンを設置するコンポーネント
function TapHandler({ onTap }: { onTap: (pos: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onTap({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

export default function PinMap({ initialPosition, onPinSet }: Props) {
  const [pinPosition, setPinPosition] = useState<LatLng | null>(null)

  function handleTap(pos: LatLng) {
    setPinPosition(pos)
    onPinSet(pos)
  }

  return (
    <MapContainer
      center={[initialPosition.lat, initialPosition.lng]}
      zoom={17}
      className="h-full w-full"
      zoomControl={false}
    >
      {/* Esri衛星写真タイル（無料・高解像度） */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri"
        maxZoom={19}
      />
      <TapHandler onTap={handleTap} />
      {pinPosition && (
        <Marker position={[pinPosition.lat, pinPosition.lng]} icon={pinIcon} />
      )}
    </MapContainer>
  )
}
