import { useState, useEffect } from "react";
import { Star, MapPin, Stethoscope, FlaskConical, Clock, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "wouter";

const API = import.meta.env.BASE_URL.replace(/\/$/, "");

interface FeaturedDoctor {
  id: number; name: string; specialization: string; city: string;
  fee: number; rating: number; imageUrl: string; consultationType: string;
  languages: string; qualifications: string; hospitalName: string;
}

interface FeaturedLab {
  id: number; name: string; centerType: string; city: string;
  accreditation: string; phone: string; address: string;
}

export function FeaturedToday() {
  const [doctors, setDoctors] = useState<FeaturedDoctor[]>([]);
  const [labs, setLabs] = useState<FeaturedLab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/featured/today`)
      .then(r => r.json())
      .then(d => { setDoctors(d.doctors ?? []); setLabs(d.labs ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (doctors.length === 0 && labs.length === 0) {
    return (
      <div className="bg-secondary/30 rounded-3xl p-6 text-center space-y-2">
        <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto" />
        <p className="text-sm font-semibold text-muted-foreground">Aaj koi featured doctor ya lab center nahi hai</p>
        <p className="text-xs text-muted-foreground">Doctors aur lab centers har roz subah <strong>7 AM – 9 AM</strong> mein featured spot le sakte hain (₹499/din)</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {doctors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base">Aaj Ke Featured Doctors</h3>
                <p className="text-xs text-muted-foreground">Inhe aaj ke liye specially featured kiya gaya hai</p>
              </div>
            </div>
            <Link href="/consult" className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline">
              Sab dekho <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map(doc => (
              <div key={doc.id} className="bg-white rounded-3xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-all hover:scale-[1.01] group">
                <div className="h-1.5 bg-gradient-to-r from-primary to-orange-400" />
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <img src={doc.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.name)}&background=d95f2b&color=fff`}
                        alt={doc.name}
                        className="w-12 h-12 rounded-2xl object-cover bg-primary/10" />
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm leading-tight truncate">Dr. {doc.name}</div>
                      <div className="text-xs text-primary font-semibold">{doc.specialization}</div>
                      {doc.qualifications && <div className="text-xs text-muted-foreground truncate">{doc.qualifications}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{doc.city || "—"}</span>
                    </div>
                    {doc.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{doc.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="text-sm font-black text-foreground">₹{doc.fee}</div>
                      <div className="text-xs text-muted-foreground">per consult</div>
                    </div>
                    <Link href="/consult"
                      className="text-xs bg-primary text-white px-3 py-1.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1">
                      Book Now <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {labs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-violet-100 flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-base">Aaj Ke Featured Lab Centers</h3>
                <p className="text-xs text-muted-foreground">Aaj ke liye specially featured labs</p>
              </div>
            </div>
            <Link href="/lab-tests" className="flex items-center gap-1 text-xs text-violet-600 font-semibold hover:underline">
              Sab dekho <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {labs.map(lab => (
              <div key={lab.id} className="bg-white rounded-3xl border border-border/50 overflow-hidden shadow-sm hover:shadow-md transition-all hover:scale-[1.01]">
                <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-600" />
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
                        <FlaskConical className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm leading-tight truncate">{lab.name}</div>
                      <div className="text-xs text-violet-600 font-semibold">{lab.centerType}</div>
                      {lab.accreditation && <div className="text-xs text-muted-foreground">{lab.accreditation}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{lab.city || lab.address || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs text-muted-foreground">Lab Tests Available</div>
                    <Link href="/lab-tests"
                      className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-xl font-semibold hover:bg-violet-700 transition-colors flex items-center gap-1">
                      Book Test <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
