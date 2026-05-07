import { Router, type IRouter } from "express";
import { db, conversations, messages } from "@workspace/db";
import {
  AskHealthAiBody,
  AskHealthAiResponse,
  CheckSymptomsBody,
  CheckSymptomsResponse,
  SpeakHealthAiAnswerBody,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";

const router: IRouter = Router();

const safetyNote =
  "General information only. Serious problem me doctor se consult karein.";

const emergencyPatterns = [
  /chest\s*pain/i,
  /breath(ing)?\s*(issue|problem|difficulty|shortness)/i,
  /unconscious/i,
  /heavy\s*bleeding/i,
  /severe\s*bleeding/i,
  /heart\s*attack/i,
  /stroke/i,
  /seizure/i,
  /not\s*breathing/i,
  /saans/i,
  /seene\s*(me|mein)\s*dard/i,
  /behosh/i,
  /bahut\s*(zyada|jyada)\s*bleeding/i,
];

function isEmergency(text: string) {
  return emergencyPatterns.some((pattern) => pattern.test(text));
}

function emergencyResponse() {
  return {
    answer:
      "🚨 Yeh emergency ho sakti hai. Turant nearest hospital/ER jao ya ambulance call karo. Patient ko akela na chhodein, breathing aur consciousness check karte rahein, aur delay na karein.",
    emergency: true,
    safetyNote,
    recommendedActions: [
      "Ambulance ya local emergency number par call karein",
      "Nearest hospital/ER ke liye directions open karein",
      "Patient ko safe position me rakhein aur akela na chhodein",
    ],
  };
}

async function askMedicalAi(prompt: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content:
          "You are Medi AI Assistant inside a healthcare app for users in India. Answer in simple Hindi/Hinglish. Do not diagnose definitively. Do not prescribe prescription medicines or dosages. For emergencies, tell the user to seek immediate emergency care. Use short sections: Possible causes, Basic precautions, Doctor kab dikhana hai. End with the exact safety note: General information only. Serious problem me doctor se consult karein.",
      },
      { role: "user", content: prompt },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || "Is question ka answer abhi generate nahi ho paya. Kripya dobara try karein.";
}

async function persistExchange(title: string, userContent: string, assistantContent: string) {
  const [conversation] = await db
    .insert(conversations)
    .values({ title })
    .returning();

  if (!conversation) {
    return;
  }

  await db.insert(messages).values([
    {
      conversationId: conversation.id,
      role: "user",
      content: userContent,
    },
    {
      conversationId: conversation.id,
      role: "assistant",
      content: assistantContent,
    },
  ]);
}

router.post("/ai/health-chat", async (req, res): Promise<void> => {
  const parsed = AskHealthAiBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const question = parsed.data.question.trim();
  try {
    if (isEmergency(question)) {
      const response = emergencyResponse();
      await persistExchange("Emergency health question", question, response.answer);
      res.json(AskHealthAiResponse.parse(response));
      return;
    }

    const answer = await askMedicalAi(question);
    const response = {
      answer,
      emergency: false,
      safetyNote,
      recommendedActions: [
        "Symptoms ko note karein aur hydration/rest maintain karein",
        "Agar symptoms badh rahe hain to doctor consultation book karein",
        "Nearby pharmacy ya hospital help section use karein",
      ],
    };

    await persistExchange(`Medi AI: ${question.slice(0, 60)}`, question, answer);
    res.json(AskHealthAiResponse.parse(response));
  } catch (error) {
    req.log.error({ error }, "AI health chat failed");
    res.status(500).json({ error: "AI assistant abhi unavailable hai. Thodi der baad dobara try karein." });
  }
});

router.post("/ai/symptom-check", async (req, res): Promise<void> => {
  const parsed = CheckSymptomsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const symptomsText = parsed.data.symptoms.join(", ");
  const notes = parsed.data.notes?.trim();
  const prompt = `Symptoms selected: ${symptomsText}${notes ? `. Extra notes: ${notes}` : ""}. Give basic guidance, possible causes, precautions, and when to show a doctor.`;

  try {
    if (isEmergency(`${symptomsText} ${notes ?? ""}`)) {
      const response = emergencyResponse();
      await persistExchange("Emergency symptom check", prompt, response.answer);
      res.json(CheckSymptomsResponse.parse(response));
      return;
    }

    const answer = await askMedicalAi(prompt);
    const response = {
      answer,
      emergency: false,
      safetyNote,
      recommendedActions: [
        "Temperature, BP, sugar ya related vitals available hon to monitor karein",
        "Rest, fluids, aur light food maintain karein jab tak doctor alag advice na de",
        "High fever, dehydration, severe pain, breathlessness, bleeding ya worsening symptoms me urgent doctor/ER jao",
      ],
    };

    await persistExchange("Symptom checker", prompt, answer);
    res.json(CheckSymptomsResponse.parse(response));
  } catch (error) {
    req.log.error({ error }, "AI symptom check failed");
    res.status(500).json({ error: "Symptom checker abhi unavailable hai. Thodi der baad dobara try karein." });
  }
});

router.post("/ai/health-speech", async (req, res): Promise<void> => {
  const parsed = SpeakHealthAiAnswerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const audio = await textToSpeech(parsed.data.text.slice(0, 2000), "alloy", "mp3");
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(audio);
  } catch (error) {
    req.log.error({ error }, "AI speech failed");
    res.status(500).json({ error: "Voice response abhi unavailable hai. Text answer use karein." });
  }
});

export default router;