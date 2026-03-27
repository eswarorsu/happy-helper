import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Locate, MapPin, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Fix default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const selectedPinIcon = L.divIcon({
  className: "location-picker-pin",
  html: `<div style="
    width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#EFBF04,#F5C518);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 4px 14px rgba(239,191,4,0.5);border:3px solid white;
  "><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

// ── Component that handles map clicks ──
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ── Component that flies to a position ──
function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 1.2 });
  }, [center[0], center[1]]);
  return null;
}

export default function LocationPicker({ lat, lng, onChange, className }: LocationPickerProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const hasLocation = lat !== null && lng !== null;

  // Default center: India
  const center: [number, number] = hasLocation ? [lat!, lng!] : [20.5937, 78.9629];
  const zoom = hasLocation ? 14 : 5;

  const handleDetect = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        onChange(newLat, newLng);
        setFlyTarget([newLat, newLng]);
        setIsDetecting(false);
      },
      () => {
        setIsDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange]);

  const handleMapClick = useCallback((clickLat: number, clickLng: number) => {
    onChange(clickLat, clickLng);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(0, 0); // parent should treat 0,0 as null
  }, [onChange]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-yellow" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Pin Your Company Location
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasLocation && lat !== 0 && (
            <button
              onClick={handleClear}
              className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDetect}
            disabled={isDetecting}
            className="h-7 text-[11px] font-semibold rounded-lg border-slate-200 text-slate-600 hover:text-brand-yellow hover:border-brand-yellow gap-1.5"
          >
            {isDetecting ? (
              <>
                <div className="w-3 h-3 border-2 border-slate-300 border-t-brand-yellow rounded-full animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Locate className="w-3.5 h-3.5" />
                Auto-Detect
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: "220px" }}>
        <MapContainer
          center={center}
          zoom={zoom}
          className="w-full h-full z-0"
          zoomControl={false}
          attributionControl={false}
          style={{ background: "#f8fafc" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OSM &copy; CARTO'
          />
          <ClickHandler onClick={handleMapClick} />
          {flyTarget && <FlyTo center={flyTarget} />}
          {hasLocation && lat !== 0 && lng !== 0 && (
            <Marker position={[lat!, lng!]} icon={selectedPinIcon} />
          )}
        </MapContainer>

        {/* Coordinates badge */}
        <AnimatePresence>
          {hasLocation && lat !== 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-sm rounded-lg border border-emerald-200 shadow-md px-3 py-1.5 flex items-center gap-2"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-semibold text-slate-700">
                {lat!.toFixed(4)}, {lng!.toFixed(4)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay instruction */}
        {(!hasLocation || lat === 0) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[300]">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-600 text-center">
                📍 Tap on the map or use Auto-Detect
              </p>
              <p className="text-[10px] text-slate-400 text-center mt-0.5">
                This helps investors discover your startup
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Leaflet CSS overrides */}
      <style>{`
        .location-picker-pin {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
