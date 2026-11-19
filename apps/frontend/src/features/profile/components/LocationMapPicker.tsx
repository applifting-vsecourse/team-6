import { useCallback, useEffect, useRef, useState } from "react"
import L from "leaflet"
import { LocateFixed, MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { formatNumber } from "@/lib/date"

import "leaflet/dist/leaflet.css"

import { DEFAULT_RADIUS_KM } from "@/features/profile/lib/onboardingDraft"

export const DEFAULT_EUROPE_LAT = 50.0
export const DEFAULT_EUROPE_LNG = 15.0

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

  // null until the user picks a place; the Europe default is only the map's initial view
  const [currentLat, setCurrentLat] = useState<number | null>(latitude)
  const [currentLng, setCurrentLng] = useState<number | null>(longitude)
  const [currentRadius, setCurrentRadius] = useState<number>(
    radiusKm > 0 ? radiusKm : DEFAULT_RADIUS_KM,
  )
  const [isLocating, setIsLocating] = useState(false)
  const [locationNote, setLocationNote] = useState<string | null>(null)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)

  const radiusRef = useRef<number>(currentRadius)
  const latLngRef = useRef<{ lat: number; lng: number } | null>(
    latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null,
  )

  useEffect(() => {
    radiusRef.current = currentRadius
  }, [currentRadius])

  // Figma B2c: four presets. The slider below reaches the longer ones.
  const presetRadii = [5, 10, 25, 50]

  const updateLocation = useCallback(
    (lat: number, lng: number, rad: number) => {
      const roundedLat = Math.round(lat * 10000) / 10000
      const roundedLng = Math.round(lng * 10000) / 10000
      setCurrentLat(roundedLat)
      setCurrentLng(roundedLng)
      setCurrentRadius(rad)
      radiusRef.current = rad
      latLngRef.current = { lat: roundedLat, lng: roundedLng }
      onChange({ latitude: roundedLat, longitude: roundedLng, radiusKm: rad })
    },
    [onChange],
  )

  // Creates the draggable marker and radius circle on first use, then just moves them.
  const showPin = useCallback(
    (lat: number, lng: number) => {
      const map = mapInstanceRef.current
      if (!map) return
      if (markerRef.current && circleRef.current) {
        markerRef.current.setLatLng([lat, lng])
        circleRef.current.setLatLng([lat, lng])
        circleRef.current.setRadius(radiusRef.current * 1000)
        return
      }

      // Leaflet draws the circle as SVG, which needs real colours: read the theme's accent.
      const accent =
        getComputedStyle(document.documentElement).getPropertyValue("--highlight").trim() ||
        "#2f5bd3"

      const customIcon = L.divIcon({
        className: "kvinted-map-pin",
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="position: relative; width: 16px; height: 16px; border-radius: 50%; background: var(--highlight); border: 2.5px solid var(--card); box-shadow: 0 1px 4px rgba(0,0,0,0.35);"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      const marker = L.marker([lat, lng], { draggable: true, icon: customIcon }).addTo(map)
      const circle = L.circle([lat, lng], {
        radius: radiusRef.current * 1000,
        color: accent,
        fillColor: accent,
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map)

      marker.on("drag", (e: L.LeafletEvent) => {
        circle.setLatLng((e.target as L.Marker).getLatLng())
      })

      marker.on("dragend", (e: L.LeafletEvent) => {
        const pos = (e.target as L.Marker).getLatLng()
        circle.setLatLng(pos)
        circle.setRadius(radiusRef.current * 1000)
        updateLocation(pos.lat, pos.lng, radiusRef.current)
      })

      markerRef.current = marker
      circleRef.current = circle
    },
    [updateLocation],
  )

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return
    // Guard against re-initialization
    if (mapInstanceRef.current) return

    try {
      const map = L.map(mapContainerRef.current, {
        center: [latitude ?? DEFAULT_EUROPE_LAT, longitude ?? DEFAULT_EUROPE_LNG],
        zoom: radiusRef.current > 50 ? 8 : 10,
        scrollWheelZoom: false,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map)

      mapInstanceRef.current = map

      map.on("click", (e: L.LeafletMouseEvent) => {
        showPin(e.latlng.lat, e.latlng.lng)
        updateLocation(e.latlng.lat, e.latlng.lng, radiusRef.current)
      })

      if (latitude != null && longitude != null) showPin(latitude, longitude)
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

  const handleUseCurrentLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setLocationNote(t("onboarding.place.geolocationUnavailable"))
      return
    }

    setIsLocating(true)
    setLocationNote(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const activeRadius = radiusRef.current
        updateLocation(lat, lng, activeRadius)
        showPin(lat, lng)
        mapInstanceRef.current?.setView([lat, lng], 11)
      },
      (err) => {
        setIsLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocationNote(t("onboarding.place.geolocationDenied"))
        } else {
          setLocationNote(t("onboarding.place.geolocationUnavailable"))
        }
      },
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 300000 },
    )
  }, [t, updateLocation, showPin])

  const handleRadiusChange = (newRadius: number) => {
    setCurrentRadius(newRadius)
    radiusRef.current = newRadius
    // Nothing picked yet: the radius is reported together with the first pick.
    if (latLngRef.current) {
      updateLocation(latLngRef.current.lat, latLngRef.current.lng, newRadius)
    }

    if (circleRef.current) {
      circleRef.current.setRadius(newRadius * 1000)
    }
    if (mapInstanceRef.current && circleRef.current) {
      const bounds = circleRef.current.getBounds()
      mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 })
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <Button
        type="button"
        variant="outline"
        onClick={handleUseCurrentLocation}
        disabled={isLocating}
        className="h-auto w-fit shrink-0 border-input bg-card px-3 py-2 text-small font-normal text-highlight"
      >
        <LocateFixed className="size-3.5" />
        {isLocating ? t("onboarding.place.locating") : t("onboarding.place.useCurrentLocation")}
      </Button>

      {locationNote && <p className="text-small text-muted-foreground">{locationNote}</p>}

      <div
        ref={mapContainerRef}
        data-testid="location-map-container"
        className="relative h-65 w-full overflow-hidden rounded-[10px] border border-border bg-secondary"
        style={{ zIndex: 0 }}
      />

      {currentLat != null && currentLng != null && (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span className="flex items-center gap-1 font-mono text-meta tracking-meta text-muted-foreground uppercase">
            <MapPin className="size-3 text-destructive" />
            {formatNumber(currentLat, {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}
            °,{" "}
            {formatNumber(currentLng, {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}
            °
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between">
          <Label
            htmlFor="radius-slider"
            className="text-compact font-medium text-foreground"
          >
            {t("onboarding.place.radiusSliderLabel")}
          </Label>
          {presetRadii.includes(currentRadius) ? null : (
            <span className="font-mono text-meta tracking-meta text-highlight uppercase">
              {t("onboarding.place.radiusOption", { count: formatNumber(currentRadius) })}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {presetRadii.map((rad) => (
            <Button
              key={rad}
              type="button"
              variant={currentRadius === rad ? "default" : "outline"}
              aria-pressed={currentRadius === rad}
              size="sm"
              onClick={() => handleRadiusChange(rad)}
              className="h-auto rounded-full px-2.5 py-1 text-small font-normal"
            >
              {t("onboarding.place.radiusOption", { count: formatNumber(rad) })}
            </Button>
          ))}
        </div>

        <Slider
          id="radius-slider"
          min={5}
          max={200}
          step={5}
          value={[currentRadius]}
          onValueChange={([val]) => val !== undefined && handleRadiusChange(val)}
          aria-label={t("onboarding.place.radiusSliderLabel")}
        />
      </div>
    </div>
  )
}
