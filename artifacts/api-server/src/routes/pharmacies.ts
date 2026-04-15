import { Router, type IRouter } from "express";
import { SearchPharmaciesQueryParams, SearchPharmaciesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const defaultCenter = { lat: 28.6139, lng: 77.209 };

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
  const exactMatches = pharmacies.filter((pharmacy) =>
    pharmacy.medicines.some((item) => item.toLowerCase().includes(normalized)),
  );
  const results = exactMatches.length > 0 ? exactMatches : pharmacies;
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