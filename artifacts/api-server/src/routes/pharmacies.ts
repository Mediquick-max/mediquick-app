import { Router, type IRouter } from "express";
import { SearchPharmaciesQueryParams, SearchPharmaciesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const defaultCenter = { lat: 28.6139, lng: 77.209 };

function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const earthRadiusKm = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((earthRadiusKm * c).toFixed(1));
}

const pharmacies = [
  {
    id: "apollo-connaught",
    name: "Apollo Pharmacy Connaught Place",
    address: "Block A, Connaught Place, New Delhi",
    phone: "+91 11 4012 2201",
    lat: 28.6315,
    lng: 77.2167,
    distanceKm: 1.8,
    openNow: true,
    medicines: ["Paracetamol", "Ibuprofen", "Cetirizine", "Metformin", "Amlodipine"],
  },
  {
    id: "medplus-janpath",
    name: "MedPlus Janpath",
    address: "Janpath Road, New Delhi",
    phone: "+91 11 4100 7788",
    lat: 28.6226,
    lng: 77.2186,
    distanceKm: 1.2,
    openNow: true,
    medicines: ["Paracetamol", "Azithromycin", "Vitamin D3", "Atorvastatin", "Omeprazole"],
  },
  {
    id: "wellness-india-gate",
    name: "Wellness Medicos India Gate",
    address: "Pandara Road Market, New Delhi",
    phone: "+91 11 2338 4545",
    lat: 28.6094,
    lng: 77.2295,
    distanceKm: 2.1,
    openNow: false,
    medicines: ["Insulin", "Metformin", "Losartan", "Cetirizine", "ORS"],
  },
  {
    id: "careplus-karol-bagh",
    name: "CarePlus Pharmacy Karol Bagh",
    address: "Ajmal Khan Road, Karol Bagh, New Delhi",
    phone: "+91 11 4506 1190",
    lat: 28.6507,
    lng: 77.1907,
    distanceKm: 4.6,
    openNow: true,
    medicines: ["Paracetamol", "Amoxicillin", "Pantoprazole", "Dolo 650", "Cough Syrup"],
  },
  {
    id: "citymed-lajpat",
    name: "CityMed Lajpat Nagar",
    address: "Central Market, Lajpat Nagar II, New Delhi",
    phone: "+91 11 2983 5520",
    lat: 28.5677,
    lng: 77.2433,
    distanceKm: 6.2,
    openNow: true,
    medicines: ["Insulin", "Thyroxine", "Vitamin B12", "Azithromycin", "ORS"],
  },
];

router.get("/pharmacies/search", (req, res): void => {
  const parsed = SearchPharmaciesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const medicine = parsed.data.medicine.trim();
  if (!medicine) {
    res.status(400).json({ error: "Medicine is required" });
    return;
  }

  const center = {
    lat: parsed.data.lat ?? defaultCenter.lat,
    lng: parsed.data.lng ?? defaultCenter.lng,
  };
  const normalized = medicine.toLowerCase();
  const ranked = pharmacies
    .map((pharmacy) => ({
      ...pharmacy,
      distanceKm: distanceKm(center, pharmacy),
      hasMedicine: pharmacy.medicines.some((item) => item.toLowerCase().includes(normalized)),
    }))
    .sort((a, b) => {
      if (a.hasMedicine !== b.hasMedicine) {
        return a.hasMedicine ? -1 : 1;
      }
      return a.distanceKm - b.distanceKm;
    });
  const results = ranked.map(({ hasMedicine: _hasMedicine, ...pharmacy }) => pharmacy);
  const mapUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${medicine} pharmacy near me`)}/@${center.lat},${center.lng},14z`;

  res.json(
    SearchPharmaciesResponse.parse({
      medicine,
      center,
      pharmacies: results,
      mapUrl,
    }),
  );
});

export default router;