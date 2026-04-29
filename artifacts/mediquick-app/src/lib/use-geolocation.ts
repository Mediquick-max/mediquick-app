import { useState, useEffect } from "react";

export interface LocationData {
  lat: number;
  lng: number;
  city: string;
  area: string;
  state: string;
  pincode: string;
  displayName: string;
}

interface GeolocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  detectLocation: () => void;
}

const CACHE_KEY = "mq_user_location";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

function getCachedLocation(): LocationData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function setCachedLocation(data: LocationData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

async function reverseGeocode(lat: number, lng: number): Promise<LocationData> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data = await res.json();
  const addr = data.address ?? {};

  const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.state_district ?? "Your City";
  const area = addr.suburb ?? addr.neighbourhood ?? addr.road ?? "";
  const state = addr.state ?? "";
  const pincode = addr.postcode ?? "";
  const displayName = area ? `${area}, ${city}` : city;

  return { lat, lng, city, area, state, pincode, displayName };
}

export function useGeolocation(): GeolocationState {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  async function detectLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;
          const loc = await reverseGeocode(lat, lng);
          setCachedLocation(loc);
          setLocation(loc);
          setPermissionDenied(false);
        } catch {
          setError("Could not determine city from your location");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
          setError("Location permission denied");
        } else {
          setError("Could not detect your location");
        }
        setLoading(false);
      },
      { timeout: 8000, maximumAge: 0 }
    );
  }

  useEffect(() => {
    const cached = getCachedLocation();
    if (cached) {
      setLocation(cached);
      return;
    }

    if (navigator.geolocation) {
      navigator.permissions?.query({ name: "geolocation" }).then(result => {
        if (result.state === "granted") {
          detectLocation();
        }
      }).catch(() => {});
    }
  }, []);

  return { location, loading, error, permissionDenied, detectLocation };
}
