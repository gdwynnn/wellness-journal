import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Place {
  id: number;
  name: string;
  type: string;
  lat: number;
  lon: number;
}

export default function MapPage() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        toast.error("Location access denied. Using default location.");
        setLocation({ lat: 40.7128, lon: -74.006 }); // NYC fallback
      }
    );
  }, []);

  useEffect(() => {
    if (!location) return;

    const fetchPlaces = async () => {
      setLoading(true);
      const radius = 5000; // 5km
      const query = `
        [out:json][timeout:25];
        (
          node["leisure"="park"](around:${radius},${location.lat},${location.lon});
          node["amenity"="hospital"](around:${radius},${location.lat},${location.lon});
          node["amenity"="clinic"](around:${radius},${location.lat},${location.lon});
          node["amenity"="doctors"](around:${radius},${location.lat},${location.lon});
          node["leisure"="fitness_centre"](around:${radius},${location.lat},${location.lon});
          node["amenity"="theatre"](around:${radius},${location.lat},${location.lon});
          node["amenity"="community_centre"](around:${radius},${location.lat},${location.lon});
        );
        out body 30;
      `;

      try {
        const resp = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: `data=${encodeURIComponent(query)}`,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        const data = await resp.json();
        const results: Place[] = data.elements
          .filter((el: any) => el.tags?.name)
          .map((el: any) => ({
            id: el.id,
            name: el.tags.name,
            type: el.tags.amenity || el.tags.leisure || "place",
            lat: el.lat,
            lon: el.lon,
          }));
        setPlaces(results);
      } catch {
        toast.error("Failed to load nearby places");
      }
      setLoading(false);
    };

    fetchPlaces();
  }, [location]);

  // Dynamic import for Leaflet (avoid SSR issues)
  useEffect(() => {
    if (!location || mapReady) return;

    import("leaflet").then((L) => {
      // Fix default icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const container = document.getElementById("wellness-map");
      if (!container || (container as any)._leaflet_id) return;

      const map = L.map(container).setView([location.lat, location.lon], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      // User location
      L.circleMarker([location.lat, location.lon], {
        radius: 8,
        fillColor: "hsl(210, 70%, 55%)",
        color: "#fff",
        weight: 2,
        fillOpacity: 1,
      })
        .addTo(map)
        .bindPopup("You are here");

      // Place markers
      places.forEach((p) => {
        L.marker([p.lat, p.lon])
          .addTo(map)
          .bindPopup(`<b>${p.name}</b><br/>${p.type}`);
      });

      setMapReady(true);
    });
  }, [location, places, mapReady]);

  return (
    <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
      <h1 className="font-display text-xl font-bold text-foreground">Wellness Map</h1>
      <p className="text-xs text-muted-foreground">Nearby parks, clinics, and wellness centers</p>

      {/* Map */}
      <div className="glass rounded-2xl overflow-hidden shadow-soft" style={{ height: 300 }}>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
        {!location ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div id="wellness-map" style={{ height: "100%", width: "100%" }} />
        )}
      </div>

      {/* Places List */}
      {loading ? (
        <div className="text-center py-6">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
          <p className="text-xs text-muted-foreground mt-2">Finding nearby places...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {places.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-3 shadow-soft flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{p.type.replace(/_/g, " ")}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto shrink-0"
                onClick={() => window.open(`https://www.openstreetmap.org/directions?from=${location?.lat},${location?.lon}&to=${p.lat},${p.lon}`, "_blank")}
              >
                <Navigation className="w-3 h-3" />
              </Button>
            </motion.div>
          ))}
          {places.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">No places found nearby.</p>
          )}
        </div>
      )}
    </div>
  );
}
