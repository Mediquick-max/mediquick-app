import { useMemo, useState } from "react";
import {
  getGetCareActivityQueryKey,
  useCreateConsultation,
  useCreateLabBooking,
  useCreateMedicineOrder,
  useGetCareActivity,
  useGetCareOptions,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarCheck,
  ClipboardList,
  FlaskConical,
  Loader2,
  PackageCheck,
  PhoneCall,
  Stethoscope,
  Truck,
  Video,
} from "lucide-react";

type CareMode = "doctor" | "lab" | "medicine";

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

export function CareServices() {
  const { data: options, isLoading: optionsLoading } = useGetCareOptions();
  const { data: activity } = useGetCareActivity();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [mode, setMode] = useState<CareMode>("doctor");
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [concern, setConcern] = useState("");
  const [dateSlot, setDateSlot] = useState(tomorrow);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedLabId, setSelectedLabId] = useState("");
  const [selectedMedicineId, setSelectedMedicineId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const selectedDoctor = useMemo(
    () => options?.doctors.find((doctor) => doctor.id === selectedDoctorId) ?? options?.doctors[0],
    [options, selectedDoctorId],
  );
  const selectedLab = useMemo(
    () => options?.labTests.find((test) => test.id === selectedLabId) ?? options?.labTests[0],
    [options, selectedLabId],
  );
  const selectedMedicine = useMemo(
    () => options?.medicines.find((medicine) => medicine.id === selectedMedicineId) ?? options?.medicines[0],
    [options, selectedMedicineId],
  );

  const onSuccess = (title: string, description: string) => {
    queryClient.invalidateQueries({ queryKey: getGetCareActivityQueryKey() });
    toast({ title, description });
  };

  const consultation = useCreateConsultation({
    mutation: {
      onSuccess: () => onSuccess("Doctor booked", "Your consultation is confirmed."),
      onError: (error) =>
        toast({
          title: "Booking failed",
          description: error.error || "Please check the details and try again.",
          variant: "destructive",
        }),
    },
  });

  const labBooking = useCreateLabBooking({
    mutation: {
      onSuccess: () => onSuccess("Lab test booked", "Home sample collection is confirmed."),
      onError: (error) =>
        toast({
          title: "Booking failed",
          description: error.error || "Please check the details and try again.",
          variant: "destructive",
        }),
    },
  });

  const medicineOrder = useCreateMedicineOrder({
    mutation: {
      onSuccess: () => onSuccess("Medicine order placed", "Your delivery request is confirmed."),
      onError: (error) =>
        toast({
          title: "Order failed",
          description: error.error || "Please check the details and try again.",
          variant: "destructive",
        }),
    },
  });

  const disabled = !patientName.trim() || phone.trim().length < 10;
  const isPending = consultation.isPending || labBooking.isPending || medicineOrder.isPending;

  const submit = () => {
    if (mode === "doctor" && selectedDoctor) {
      consultation.mutate({
        data: {
          doctorId: selectedDoctor.id,
          patientName,
          phone,
          concern: concern || "General health concern",
          mode: selectedDoctor.mode === "video" ? "video" : "clinic",
          dateSlot,
        },
      });
    }

    if (mode === "lab" && selectedLab) {
      labBooking.mutate({
        data: {
          testId: selectedLab.id,
          patientName,
          phone,
          address: address || "Home address to be confirmed by call",
          dateSlot,
        },
      });
    }

    if (mode === "medicine" && selectedMedicine) {
      medicineOrder.mutate({
        data: {
          medicineId: selectedMedicine.id,
          patientName,
          phone,
          address: address || "Delivery address to be confirmed by call",
          quantity,
        },
      });
    }
  };

  const activityItems = [
    ...(activity?.consultations ?? []),
    ...(activity?.labBookings ?? []),
    ...(activity?.medicineOrders ?? []),
  ].slice(0, 5);

  if (optionsLoading) {
    return <Card className="h-80 rounded-[2rem] animate-pulse bg-secondary/50 border-transparent" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-3">
        <ServiceButton active={mode === "doctor"} onClick={() => setMode("doctor")} icon={<Stethoscope className="w-5 h-5" />} label="Doctor Consult" />
        <ServiceButton active={mode === "lab"} onClick={() => setMode("lab")} icon={<FlaskConical className="w-5 h-5" />} label="Lab Tests" />
        <ServiceButton active={mode === "medicine"} onClick={() => setMode("medicine")} icon={<Truck className="w-5 h-5" />} label="Medicines" />
      </div>

      <Card className="rounded-[2rem] border-transparent shadow-sm overflow-hidden">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-5 sm:p-6 space-y-5 bg-card">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">MediQuick Care</p>
              <h3 className="text-2xl font-bold mt-1">
                {mode === "doctor" && "Book trusted doctors"}
                {mode === "lab" && "Book home lab tests"}
                {mode === "medicine" && "Order medicines fast"}
              </h3>
              <p className="text-muted-foreground mt-1">
                {mode === "doctor" && "Video or clinic consultations with verified specialists."}
                {mode === "lab" && "Choose a package and schedule home sample pickup."}
                {mode === "medicine" && "Request doorstep delivery from nearby pharmacy partners."}
              </p>
            </div>

            {mode === "doctor" && options?.doctors.map((doctor) => (
              <OptionCard
                key={doctor.id}
                active={(selectedDoctor?.id ?? "") === doctor.id}
                onClick={() => setSelectedDoctorId(doctor.id)}
                title={doctor.name}
                subtitle={`${doctor.speciality} · ${doctor.experienceYears} yrs · ${doctor.rating} rating`}
                meta={`₹${doctor.fee} · ${doctor.nextSlot}`}
                badge={doctor.mode === "video" ? "Video" : "Clinic"}
              />
            ))}

            {mode === "lab" && options?.labTests.map((test) => (
              <OptionCard
                key={test.id}
                active={(selectedLab?.id ?? "") === test.id}
                onClick={() => setSelectedLabId(test.id)}
                title={test.name}
                subtitle={test.includes}
                meta={`₹${test.price} · Reports in ${test.reportTime}`}
                badge="Home collection"
              />
            ))}

            {mode === "medicine" && options?.medicines.map((medicine) => (
              <OptionCard
                key={medicine.id}
                active={(selectedMedicine?.id ?? "") === medicine.id}
                onClick={() => setSelectedMedicineId(medicine.id)}
                title={medicine.name}
                subtitle={medicine.prescriptionRequired ? "Prescription required before dispatch" : "No prescription required"}
                meta={`₹${medicine.price} · ${medicine.deliveryEta}`}
                badge="Delivery"
              />
            ))}
          </div>

          <div className="p-5 sm:p-6 bg-primary/5 border-t lg:border-t-0 lg:border-l border-primary/10 space-y-4">
            <h4 className="font-bold text-lg flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary" />
              Confirm details
            </h4>
            <Input value={patientName} onChange={(event) => setPatientName(event.target.value)} placeholder="Patient name" className="h-12 rounded-2xl bg-background" />
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Mobile number" className="h-12 rounded-2xl bg-background" />
            {mode !== "medicine" && (
              <Input type="datetime-local" value={dateSlot} onChange={(event) => setDateSlot(event.target.value)} className="h-12 rounded-2xl bg-background" />
            )}
            {mode === "doctor" && (
              <Input value={concern} onChange={(event) => setConcern(event.target.value)} placeholder="Health concern" className="h-12 rounded-2xl bg-background" />
            )}
            {mode !== "doctor" && (
              <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Address" className="h-12 rounded-2xl bg-background" />
            )}
            {mode === "medicine" && (
              <Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} className="h-12 rounded-2xl bg-background" />
            )}
            <Button onClick={submit} disabled={disabled || isPending} className="w-full h-12 rounded-2xl font-semibold shadow-md">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
            </Button>
            <div className="rounded-2xl bg-background/80 p-4 text-sm text-muted-foreground flex gap-3">
              <PhoneCall className="w-5 h-5 text-primary shrink-0" />
              A care coordinator will call to verify details. Payment is collected only after confirmation.
            </div>
          </div>
        </div>
      </Card>

      <Card className="rounded-[2rem] p-5 sm:p-6 border-transparent shadow-sm">
        <h3 className="font-bold text-xl flex items-center gap-2 mb-4">
          <ClipboardList className="w-5 h-5 text-primary" />
          My care activity
        </h3>
        {activityItems.length === 0 ? (
          <p className="text-muted-foreground">No consultations, lab tests, or medicine orders yet.</p>
        ) : (
          <div className="space-y-3">
            {activityItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="flex items-start gap-3 p-3 rounded-2xl bg-secondary/40">
                <PackageCheck className="w-5 h-5 text-primary mt-1 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.status} · ₹{item.amount} · {item.dateSlot}</p>
                </div>
                <Badge variant="outline" className="capitalize">{item.type}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ServiceButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl p-4 text-left border transition-all flex items-center gap-3 ${
        active ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-card border-border/60 hover:border-primary/30"
      }`}
    >
      {icon}
      <span className="font-semibold">{label}</span>
    </button>
  );
}

function OptionCard({ active, onClick, title, subtitle, meta, badge }: { active: boolean; onClick: () => void; title: string; subtitle: string; meta: string; badge: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-3xl border p-4 text-left transition-all ${
        active ? "bg-primary/10 border-primary/40" : "bg-secondary/30 border-transparent hover:bg-secondary/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          <p className="text-sm font-semibold text-primary mt-2">{meta}</p>
        </div>
        <Badge variant={active ? "default" : "secondary"}>{badge}</Badge>
      </div>
    </button>
  );
}