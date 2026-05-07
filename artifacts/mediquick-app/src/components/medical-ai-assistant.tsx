import { useMemo, useState } from "react";
import {
  useAskHealthAi,
  useCheckSymptoms,
  useSpeakHealthAiAnswer,
} from "@workspace/api-client-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Bot,
  Building2,
  ChevronRight,
  Hospital,
  Loader2,
  MapPin,
  Mic,
  Pill,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Volume2,
} from "lucide-react";

const sampleQuestions = [
  "Fever hai kya karun?",
  "Sugar control kaise kare?",
  "Dengue ke symptoms?",
  "Pregnancy care tips?",
  "Headache kyun hota hai?",
  "Cold me kaunsi general care?",
];

const symptomOptions = ["Fever", "Cough", "Weakness", "Vomiting", "Headache", "Body pain"];

const emergencyPrompts = ["Chest pain", "Breathing issue", "Unconscious", "Heavy bleeding"];

const nearbyHelp = [
  { label: "Hospital", query: "nearby hospital", icon: Hospital },
  { label: "Clinic", query: "nearby clinic", icon: Stethoscope },
  { label: "Pharmacy", query: "nearby pharmacy", icon: Pill },
  { label: "Ambulance", query: "ambulance service near me", icon: ShieldAlert },
];

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { error?: string } }).data;
    if (data?.error) {
      return data.error;
    }
  }

  return fallback;
}

function getSpeechRecognition() {
  const browserWindow = window as typeof window & {
    SpeechRecognition?: new () => any;
    webkitSpeechRecognition?: new () => any;
  };

  return browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
}

export function MedicalAiAssistant() {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [emergency, setEmergency] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(["Fever", "Weakness"]);
  const [notes, setNotes] = useState("");
  const [listening, setListening] = useState(false);
  const [autoSpeakNextAnswer, setAutoSpeakNextAnswer] = useState(false);

  const recommendedMapUrl = useMemo(() => {
    const query = emergency ? "nearest emergency hospital" : "nearby hospital clinic pharmacy";
    return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  }, [emergency]);

  const speak = useSpeakHealthAiAnswer({
    mutation: {
      onSuccess: async (blob) => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => URL.revokeObjectURL(url);
        audio.play().catch(() => {
          URL.revokeObjectURL(url);
          toast({
            title: "Tap Listen again",
            description: "Browser ne autoplay block kiya. Listen button dobara press karein.",
          });
        });
      },
      onError: (error) =>
        toast({
          title: "Voice unavailable",
          description: getErrorMessage(error, "Text answer ready hai, voice abhi nahi chal payi."),
          variant: "destructive",
        }),
    },
  });

  const askAi = useAskHealthAi({
    mutation: {
      onSuccess: (response) => {
        setAnswer(response.answer);
        setEmergency(response.emergency);
        if (autoSpeakNextAnswer) {
          setAutoSpeakNextAnswer(false);
          speak.mutate({ data: { text: response.answer } });
        }
      },
      onError: (error) =>
        toast({
          title: "AI assistant unavailable",
          description: getErrorMessage(error, "Thodi der baad dobara try karein."),
          variant: "destructive",
        }),
    },
  });

  const checkSymptoms = useCheckSymptoms({
    mutation: {
      onSuccess: (response) => {
        setAnswer(response.answer);
        setEmergency(response.emergency);
      },
      onError: (error) =>
        toast({
          title: "Symptom checker unavailable",
          description: getErrorMessage(error, "Thodi der baad dobara try karein."),
          variant: "destructive",
        }),
    },
  });

  const submitQuestion = (value = question) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    setQuestion(trimmed);
    askAi.mutate({ data: { question: trimmed } });
  };

  const submitSymptoms = () => {
    if (selectedSymptoms.length === 0) {
      toast({ title: "Select symptoms", description: "Kam se kam ek symptom select karein." });
      return;
    }

    checkSymptoms.mutate({ data: { symptoms: selectedSymptoms, notes } });
  };

  const askWithVoice = () => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      toast({
        title: "Voice input unavailable",
        description: "Is browser me mic-to-text support nahi mila. Aap question type kar sakte hain.",
      });
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? "";
      setListening(false);
      if (transcript) {
        setAutoSpeakNextAnswer(true);
        submitQuestion(transcript);
      }
    };
    recognition.onerror = () => {
      setListening(false);
      toast({
        title: "Voice input failed",
        description: "Mic permission ya browser support issue ho sakta hai. Question type karke try karein.",
      });
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom],
    );
  };

  const busy = askAi.isPending || checkSymptoms.isPending;

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <QuickTool icon={MapPin} title="Search hospitals" href="https://www.google.com/maps/search/nearby+hospitals" />
        <QuickTool icon={ShieldAlert} title="Emergency SOS" href="tel:112" urgent />
        <QuickTool icon={Building2} title="Ambulance tracker" href="https://www.google.com/maps/search/ambulance+service+near+me" />
        <QuickTool icon={Pill} title="Medicine reminder" href="#schedule" />
        <QuickTool icon={Bot} title="AI Health Chat" href="#ai-health-chat" highlighted />
        <QuickTool icon={Sparkles} title="Reports locker" href="#care-services" />
      </div>

      <Card id="ai-health-chat" className="rounded-[2rem] border-transparent shadow-sm overflow-hidden">
        <div className="grid xl:grid-cols-[1.05fr_0.95fr]">
          <div className="p-5 sm:p-6 bg-card space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <Badge className="rounded-full mb-2">Medi AI Assistant</Badge>
                <h3 className="text-2xl font-bold">Ask Health Question</h3>
                <p className="text-muted-foreground">
                  Simple Hindi me general care, symptoms aur next steps samjhein.
                </p>
              </div>
            </div>

            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Example: Mujhe bukhar hai kya karu?"
              className="min-h-28 rounded-3xl bg-secondary/40 border-transparent resize-none text-base"
            />

            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => submitQuestion(item)}
                  className="rounded-full bg-secondary px-3 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => submitQuestion()} disabled={busy || !question.trim()} className="h-12 rounded-2xl font-semibold flex-1">
                {askAi.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ask AI"}
              </Button>
              <Button type="button" variant="outline" onClick={askWithVoice} disabled={busy || listening} className="h-12 rounded-2xl font-semibold">
                {listening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                {listening ? "Listening..." : "Voice Question"}
              </Button>
            </div>

            <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-4">
              <p className="font-bold text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Emergency AI Mode
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {emergencyPrompts.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => submitQuestion(item)}
                    className="rounded-full bg-background px-3 py-2 text-sm font-semibold text-destructive border border-destructive/20"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 bg-primary/5 border-t xl:border-t-0 xl:border-l border-primary/10 space-y-5">
            <div>
              <h4 className="text-xl font-bold">Smart Symptom Checker</h4>
              <p className="text-muted-foreground text-sm mt-1">
                Symptoms select karke possible causes, precautions aur doctor timing dekhein.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {symptomOptions.map((symptom) => (
                <button
                  key={symptom}
                  type="button"
                  onClick={() => toggleSymptom(symptom)}
                  className={`rounded-2xl p-3 text-left font-semibold border transition-all ${
                    selectedSymptoms.includes(symptom)
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background border-border/70"
                  }`}
                >
                  {selectedSymptoms.includes(symptom) ? "☑" : "☐"} {symptom}
                </button>
              ))}
            </div>

            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional: fever kitna hai, kitne din se hai, age, etc."
              className="min-h-20 rounded-2xl bg-background resize-none"
            />

            <Button onClick={submitSymptoms} disabled={busy} variant="secondary" className="w-full h-12 rounded-2xl font-semibold">
              {checkSymptoms.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check Symptoms"}
            </Button>

            <div className="rounded-3xl bg-background/80 p-4">
              <p className="font-bold flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-primary" />
                Nearby Help Map
              </p>
              <div className="grid grid-cols-2 gap-2">
                {nearbyHelp.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={`https://www.google.com/maps/search/${encodeURIComponent(item.query)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl bg-secondary/70 p-3 text-sm font-semibold flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {answer && (
        <Alert className={`rounded-[2rem] p-5 ${emergency ? "border-destructive/30 bg-destructive/10" : "border-primary/20 bg-primary/5"}`}>
          <Bot className={emergency ? "text-destructive" : "text-primary"} />
          <AlertTitle className="text-xl font-bold flex items-center justify-between gap-3">
            {emergency ? "Emergency guidance" : "AI Health Answer"}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => speak.mutate({ data: { text: answer } })}
              disabled={speak.isPending}
              className="rounded-full"
            >
              {speak.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
              Listen
            </Button>
          </AlertTitle>
          <AlertDescription className="mt-3 space-y-4">
            <div className="whitespace-pre-wrap leading-relaxed text-foreground">{answer}</div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={recommendedMapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
              >
                Open nearby help map
                <ChevronRight className="w-4 h-4" />
              </a>
              <span className="rounded-2xl bg-background px-4 py-3 text-sm font-semibold">
                General information only. Serious problem me doctor se consult karein.
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function QuickTool({
  icon: Icon,
  title,
  href,
  urgent,
  highlighted,
}: {
  icon: typeof MapPin;
  title: string;
  href: string;
  urgent?: boolean;
  highlighted?: boolean;
}) {
  return (
    <a
      href={href}
      className={`rounded-3xl p-4 border flex flex-col gap-3 min-h-28 transition-all ${
        urgent
          ? "bg-destructive text-destructive-foreground border-destructive shadow-md"
          : highlighted
            ? "bg-primary text-primary-foreground border-primary shadow-md"
            : "bg-card border-border/60 hover:border-primary/40"
      }`}
    >
      <Icon className="w-6 h-6" />
      <span className="font-bold text-sm leading-tight">{title}</span>
    </a>
  );
}