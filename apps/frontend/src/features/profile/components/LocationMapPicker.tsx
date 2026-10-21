import { useCallback, useEffect, useRef, useState } from "react"
import L from "leaflet"
import { LocateFixed, MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import "leaflet/dist/leaflet.css"

export const DEFAULT_EUROPE_LAT = 50.0
export const DEFAULT_EUROPE_LNG = 15.0
export const DEFAULT_RADIUS_KM = 25

type LocationMapPickerProps = {
  latitude: number | null
  longitude: number | null
  radiusKm: number
  onChange: (location: { latitude: number; longitude: number; radiusKm: number }) => void
}

export function LocationMapPicker({
  latitude,
  longitude,
  radiusKm,
  onChange,
}: LocationMapPickerProps) {
  const { t } = useTranslation()

  const initialLat = latitude ?? DEFAULT_EUROPE_LAT
  const initialLng = longitude ?? DEFAULT_EUROPE_LNG

  const [currentLat, setCurrentLat] = useState<number>(initialLat)
  const [currentLng, setCurrentLng] = useState<number>(initialLng)
  const [currentRadius, setCurrentRadius] = useState<number>(
    radiusKm > 0 ? radiusKm : DEFAULT_RADIUS_KM,
  )
  const [isLocating, setIsLocating] = useState(false)
  const [locationNote, setLocationNote] = useState<string | null>(null)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)

  const presetRadii = [5, 10, 25, 50, 100, 150]

  const updateLocation = useCallback(
    (lat: number, lng: number, rad: number) => {
      const roundedLat = Math.round(lat * 10000) / 10000
      const roundedLng = Math.round(lng * 10000) / 10000
      setCurrentLat(roundedLat)
      setCurrentLng(roundedLng)
      setCurrentRadius(rad)
      onChange({ latitude: roundedLat, longitude: roundedLng, radiusKm: rad })
    },
    [onChange],
  )

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return
    // Guard against re-initialization
    if (mapInstanceRef.current) return

    try {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: currentRadius > 50 ? 8 : 10,
        scrollWheelZoom: false,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      const customIcon = L.divIcon({
        className: "kvinted-map-pin",
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(34, 197, 94, 0.35);"></div>
            <div style="position: relative; width: 14px; height: 14px; border-radius: 50%; background: #16a34a; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      const marker = L.marker([currentLat, currentLng], {
        draggable: true,
        icon: customIcon,
      }).addTo(map)

      const circle = L.circle([currentLat, currentLng], {
        radius: currentRadius * 1000,
        color: "#16a34a",
        fillColor: "#22c55e",
        fillOpacity: 0.18,
        weight: 2,
      }).addTo(map)

      marker.on("drag", (e: L.LeafletEvent) => {
        const target = e.target as L.Marker
        const pos = target.getLatLng()
        circle.setLatLng(pos)
      })

      marker.on("dragend", (e: L.LeafletEvent) => {
        const target = e.target as L.Marker
        const pos = target.getLatLng()
        circle.setLatLng(pos)
        updateLocation(pos.lat, pos.lng, currentRadius)
      })

      map.on("click", (e: L.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng)
        circle.setLatLng(e.latlng)
        updateLocation(e.latlng.lat, e.latlng.lng, currentRadius)
      })

      mapInstanceRef.current = map
      markerRef.current = marker
      circleRef.current = circle
    } catch {
      // In non-DOM or JSDOM environments, map creation may fail silently
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch {
          // ignore cleanup errors
        }
        mapInstanceRef.current = null
        markerRef.current = null
        circleRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Request user's current location on initial mount if not previously saved
  useEffect(() => {
    if (latitude !== null && longitude !== null) return

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          updateLocation(lat, lng, currentRadius)

          if (mapInstanceRef.current && markerRef.current && circleRef.current) {
            markerRef.current.setLatLng([lat, lng])
            circleRef.current.setLatLng([lat, lng])
            mapInstanceRef.current.setView([lat, lng], 10)
          }
        },
        () => {
          // Fallback location already defaulted to Middle of Europe
        },
        { timeout: 5000, enableHighAccuracy: false },
      )
    }
  }, [latitude, longitude]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleUseCurrentLocation = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationNote(t("onboarding.step2.geolocationUnavailable"))
      return
    }

    setIsLocating(true)
    setLocationNote(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        updateLocation(lat, lng, currentRadius)

        if (mapInstanceRef.current && markerRef.current && circleRef.current) {
          markerRef.current.setLatLng([lat, lng])
          circleRef.current.setLatLng([lat, lng])
          mapInstanceRef.current.setView([lat, lng], 11)
        }
      },
      () => {
        setIsLocating(false)
        setLocationNote(t("onboarding.step2.geolocationDenied"))
      },
      { timeout: 8000, enableHighAccuracy: true },
    )
  }

  const handleRadiusChange = (newRadius: number) => {
    setCurrentRadius(newRadius)
    updateLocation(currentLat, currentLng, newRadius)

    if (circleRef.current) {
      circleRef.current.setRadius(newRadius * 1000)
    }
    if (mapInstanceRef.current && circleRef.current) {
      const bounds = circleRef.current.getBounds()
      mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <Label className="text-label font-semibold text-foreground">
            {t("onboarding.step2.mapTitle")}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="h-8 gap-1.5 text-xs font-medium text-primary hover:text-primary/90"
          >
            <LocateFixed className="h-3.5 w-3.5" />
            {isLocating ? t("onboarding.step2.locating") : t("onboarding.step2.useCurrentLocation")}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{t("onboarding.step2.mapHint")}</p>
      </div>

      {locationNote && <p className="text-xs text-muted-foreground">{locationNote}</p>}

      <div
        ref={mapContainerRef}
        data-testid="location-map-container"
        className="relative h-72 w-full overflow-hidden rounded-lg border border-border bg-muted/40 shadow-inner sm:h-80"
        style={{ zIndex: 0 }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 font-mono">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {currentLat.toFixed(4)}°, {currentLng.toFixed(4)}°
        </span>
        <span className="font-medium text-foreground">
          {t("onboarding.step2.selectedRadius", { count: currentRadius })}
        </span>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between text-sm">
          <Label
            htmlFor="radius-slider"
            className="text-label font-semibold text-foreground"
          >
            {t("onboarding.step2.radiusSliderLabel")}
          </Label>
          <span className="font-mono font-semibold text-primary">{currentRadius} km</span>
        </div>

        <input
          id="radius-slider"
          type="range"
          min={5}
          max={200}
          step={5}
          value={currentRadius}
          onChange={(e) => handleRadiusChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer accent-primary"
          aria-label={t("onboarding.step2.radiusSliderLabel")}
        />

        <div className="flex flex-wrap gap-1.5 pt-1">
          {presetRadii.map((rad) => (
            <button
              key={rad}
              type="button"
              onClick={() => handleRadiusChange(rad)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                currentRadius === rad
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {rad} km
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
