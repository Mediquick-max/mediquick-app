import { useEffect, useMemo, useState } from "react";
import { useSearchPharmacies, getSearchPharmaciesQueryKey } from "@workspace/api-client-react";
import { Search, MapPin, Navigation, Phone, LocateFixed, Loader2, Pill, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useGeolocation } from "@/lib/use-geolocation";

export function PharmacySearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const geo = useGeolocation();

  const location = geo.location ? { lat: geo.location.lat, lng: geo.location.lng } : null;

  const locationMessage = geo.loading
    ? "Detecting your location..."
    : geo.location
    ? `Showing pharmacies near ${geo.location.displayName}`
    : geo.permissionDenied
    ? "Location access denied. Using default Delhi location."
    : "Using default Delhi location. Tap to use your exact location.";

  const searchParams = useMemo(
    () => ({
      medicine: activeSearch,
      ...(location ? { lat: location.lat, lng: location.lng } : {}),
    }),
    [activeSearch, location],
  );

  const { data: searchResult, isLoading, error } = useSearchPharmacies(
    searchParams,
    { query: { enabled: !!activeSearch, queryKey: getSearchPharmaciesQueryKey(searchParams) } }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setActiveSearch(searchTerm.trim());
    }
  };

  const quickMedicines = ["Paracetamol", "Metformin", "Insulin", "Cetirizine"];
  const embedMapUrl = searchResult
    ? `https://maps.google.com/maps?q=${encodeURIComponent(`${searchResult.medicine} pharmacy near me`)}&ll=${searchResult.center.lat},${searchResult.center.lng}&z=13&output=embed`
    : null;

  return (
    <div className="space-y-6" data-testid="section-pharmacy-search">
      <div className="rounded-[2rem] bg-card p-4 shadow-sm border border-border/50 space-y-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search medicine..."
            className="h-14 pl-12 pr-24 rounded-full bg-secondary/50 shadow-none border-transparent focus-visible:ring-primary focus-visible:border-transparent text-base"
            data-testid="input-pharmacy-search"
          />
          <Button 
            type="submit" 
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full h-11 px-6 shadow-sm"
            disabled={!searchTerm.trim() || isLoading}
            data-testid="button-pharmacy-search"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find"}
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {quickMedicines.map((medicine) => (
            <Button
              key={medicine}
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full"
              onClick={() => {
                setSearchTerm(medicine);
                setActiveSearch(medicine);
              }}
            >
              <Pill className="w-3.5 h-3.5 mr-1.5" />
              {medicine}
            </Button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm text-muted-foreground">
          <p className={geo.location ? "text-emerald-600 font-medium" : ""}>{locationMessage}</p>
          {!geo.location && !geo.permissionDenied && (
            <Button type="button" variant="outline" size="sm" className="rounded-full gap-2 shrink-0" onClick={geo.detectLocation} disabled={geo.loading}>
              {geo.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
              {geo.loading ? "Detecting..." : "Use my location"}
            </Button>
          )}
          {geo.location && (
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs shrink-0">
              <CheckCircle2 className="w-4 h-4" /> Location active
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 rounded-lg" />
          {[1, 2].map(i => (
            <Card key={i} className="p-5 rounded-3xl">
              <Skeleton className="h-6 w-3/4 mb-3 rounded" />
              <Skeleton className="h-4 w-1/2 mb-4 rounded" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card className="p-6 bg-destructive/5 border-destructive/20 text-destructive rounded-3xl">
          <p className="font-medium text-center">Could not find pharmacies right now.</p>
        </Card>
      )}

      {searchResult && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Pharmacies with {searchResult.medicine}
            </h3>
            {searchResult.mapUrl && (
              <Button variant="outline" size="sm" className="rounded-full gap-2" asChild data-testid="link-view-map">
                <a href={searchResult.mapUrl} target="_blank" rel="norenoopener noreferrer">
                  <Navigation className="w-4 h-4" />
                  Map View
                </a>
              </Button>
            )}
          </div>

          {embedMapUrl && (
            <Card className="overflow-hidden rounded-3xl border-transparent shadow-sm">
              <iframe
                title={`Map for ${searchResult.medicine}`}
                src={embedMapUrl}
                className="h-72 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Card>
          )}
          
          {searchResult.pharmacies.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground rounded-3xl border-dashed">
              No nearby pharmacies found with this medicine currently in stock.
            </Card>
          ) : (
            <div className="grid gap-4">
              {searchResult.pharmacies.map(pharmacy => (
                <Card key={pharmacy.id} className="p-5 rounded-3xl shadow-sm border-transparent hover:shadow-md transition-shadow" data-testid={`card-pharmacy-${pharmacy.id}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{pharmacy.name}</h4>
                      <p className="text-muted-foreground flex items-center gap-1.5 text-sm mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {pharmacy.distanceKm.toFixed(1)} km away • {pharmacy.address}
                      </p>
                    </div>
                    {pharmacy.openNow ? (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 shadow-none border-transparent">Open Now</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Closed</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <Button variant="secondary" size="sm" className="rounded-full bg-secondary/60 hover:bg-secondary flex-1" asChild>
                      <a href={`tel:${pharmacy.phone.replace(/\D/g, '')}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </a>
                    </Button>
                    <Button variant="secondary" size="sm" className="rounded-full bg-secondary/60 hover:bg-secondary flex-1" asChild>
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(pharmacy.name + ' ' + pharmacy.address)}`} target="_blank" rel="noopener noreferrer">
                        <Navigation className="w-4 h-4 mr-2" />
                        Directions
                      </a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
