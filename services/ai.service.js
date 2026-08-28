const createError = require("http-errors");

const messageSent = async (payload) => {
    if (!payload) {
        throw createError.BadRequest("Payload is missing.");
    }

    const MAX_MESSAGE_LENGTH = 1000;
    const MAX_HISTORY_MESSAGES = 15;

    const rawHistory = Array.isArray(payload.chatHistory) ? payload.chatHistory : [];
    const chatHistory = rawHistory.slice(-MAX_HISTORY_MESSAGES).map((msg) => ({
        sender: msg.sender === "coach" ? "coach" : "user",
        text: String(msg.text || "").slice(0, MAX_MESSAGE_LENGTH),
    }));

    const rawMessage = payload.message;
    const rawText = (rawMessage && typeof rawMessage === "object") ? rawMessage.text : rawMessage;

    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
        throw createError.BadRequest("Message is required.");
    }

    const newMessage = rawText.trim().slice(0, MAX_MESSAGE_LENGTH);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw createError.InternalServerError("Missing GEMINI_API_KEY in server environment.");
    }

    const geminiPrompt = `You are the Fithub AI Coach. Help the user with workout routines, nutrition tips, exercise form, and wellness. Keep your answers short-to-medium length and match their vibe. IMPORTANT: If the user asks questions completely unrelated to fitness, health, nutrition, or wellness, politely decline and steer them back to their fitness goals.`;

    const contents = chatHistory.map(msg => ({
        role: msg.sender === "coach" ? "model" : "user",
        parts: [{
            text: msg.text
        }]
    }));

    contents.push({
        role: "user",
        parts: [{
            text: newMessage
        }]
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents,
            systemInstruction: {
                parts: [{ text: geminiPrompt }]
            },
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
                responseMimeType: "text/plain",
            }
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || response.statusText || "Gemini API request failed";
        throw createError(response.status || 500, errorMessage);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
        throw createError.InternalServerError("Failed to get response from Gemini API.");
    }
    return reply;
};

// ── Token-Efficient AI Workout Plan Generator ─────────────────────────────────
const generateWorkoutPlan = async ({ target, difficulty, duration, intensity, equipment, specialFocus, prompt, exerciseCount }) => {
    const desiredCount = Math.max(3, Math.min(8, Number(exerciseCount) || 5));
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        // Fallback default exercises
        return {
            workoutName: `${target ? target.toUpperCase() : "Custom"} Power Routine`,
            description: `A targeted ${difficulty || "intermediate"} routine for ${target || "hypertrophy"}.`,
            exercises: ["Bench Press", "Incline Dumbbell Press", "Lateral Raise", "Triceps Pushdown", "Cable Fly"].slice(0, desiredCount)
        };
    }

    const systemPrompt = `You are an elite strength & conditioning coach. Generate a structured JSON workout routine with exactly ${desiredCount} exercises.
Output MUST be valid JSON with this exact schema:
{
  "workoutName": "string",
  "description": "string (1-2 sentences)",
  "exercises": ["Array of exactly ${desiredCount} exact exercise names standard in fitness databases like Bench Press, Squat, Lat Pulldown, etc."]
}`;

    const userPrompt = `Target: ${target || "Full Body"}, Desired Exercise Count: ${desiredCount}, Difficulty: ${difficulty || "Intermediate"}, Duration: ${duration || "45"} minutes, Equipment: ${equipment || "Gym"}, Intensity: ${intensity || "Moderate"}, Focus: ${specialFocus || "Hypertrophy"}, Extra: ${prompt || "None"}`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 400,
                    responseMimeType: "application/json",
                }
            })
        });

        if (!response.ok) throw new Error("Gemini API error");
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return JSON.parse(jsonText);
    } catch (err) {
        console.warn("AI workout generation failed, using intelligent template:", err.message);
        return {
            workoutName: `${target ? target.toUpperCase() : "Hypertrophy"} Split`,
            description: `Dynamic ${difficulty || "intermediate"} session focused on progressive overload.`,
            exercises: ["Barbell Bench Press", "Lat Pulldown", "Barbell Squat", "Overhead Press"]
        };
    }
};

// ── Ultra-Low-Token AI Post-Workout Performance Coach Debrief ────────────────
const generateAICoachDebrief = async ({ workoutName, duration, totalVolume, completedSets, prsCount = 0, weightUnit = "kg" }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return `🔥 Outstanding workout! You moved ${Number(totalVolume).toLocaleString()} ${weightUnit} across ${completedSets} sets in ${duration}. Focus on hitting your protein target and aim to add 1 extra rep on your first compound set next time.`;
    }

    const systemPrompt = `You are a motivating, elite fitness coach. Analyze the user's completed workout and give a punchy 2-sentence performance evaluation + 1 specific progressive overload recommendation for their next session. Keep it under 50 words. Do not use filler greetings.`;

    const userPrompt = `Workout: "${workoutName}", Duration: ${duration}, Total Volume: ${Number(totalVolume).toLocaleString()} ${weightUnit}, Completed Sets: ${completedSets}, New PRs: ${prsCount}.`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    temperature: 0.5,
                    maxOutputTokens: 150,
                    responseMimeType: "text/plain",
                }
            })
        });

        if (!response.ok) throw new Error("Gemini API error");
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    } catch (err) {
        return `🔥 Great session on ${workoutName}! You pushed through ${completedSets} sets with ${Number(totalVolume).toLocaleString()} ${weightUnit} total volume. Next workout, aim for +2.5% load or 1 extra rep on your top set!`;
    }
};

// ── In-Memory Cache for Instant AI Biomechanics Advice (<5ms) ──────────────────
const aiMuscleAnalysisCache = new Map();

// ── AI Muscle Biomechanics & Hypertrophy Analysis ─────────────────────────────
const generateAIMuscleAnalysis = async ({ muscle, recoveryPercent = 100, userLevel = "intermediate", userGoal = "hypertrophy" }) => {
    const cacheKey = `${(muscle || "").toLowerCase()}_${recoveryPercent}_${userLevel}_${userGoal}`;
    if (aiMuscleAnalysisCache.has(cacheKey)) {
        return aiMuscleAnalysisCache.get(cacheKey);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        const fallback = {
            verdict: `${muscle} is currently at ${recoveryPercent}% readiness. Focus on high mechanical tension and controlled 3-second eccentrics to maximize motor unit recruitment.`,
            activationCue: "Initiate each repetition by bracing your core and actively squeezing the muscle at full peak contraction.",
            repScheme: "3-4 sets of 8-12 reps @ 1-2 RIR (Reps in Reserve)",
            injuryPrevention: "Avoid aggressive joint lockout and keep scapular stabilizers retracted.",
            targetExercises: ["Compound Anchor Movement", "Cable Stretch Isolation", "High-Tension Finisher"]
        };
        aiMuscleAnalysisCache.set(cacheKey, fallback);
        return fallback;
    }

    const systemPrompt = `You are an elite biomechanics PhD and hypertrophy coach. Output a concise JSON object analyzing target muscle training and recovery.
Output format JSON:
{
  "verdict": "string (1-2 punchy sentences assessing training readiness and fatigue)",
  "activationCue": "string (1 actionable mind-muscle cue for maximal motor unit recruitment)",
  "repScheme": "string (e.g. 3 sets of 8-12 reps @ 2 RIR)",
  "injuryPrevention": "string (1 key joint safety note)",
  "targetExercises": ["array of 3-4 top exercise names"]
}`;

    const userPrompt = `Muscle: ${muscle}, Recovery Status: ${recoveryPercent}%, Goal: ${userGoal}, Training Level: ${userLevel}`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 220,
                    responseMimeType: "application/json",
                }
            })
        });

        if (!response.ok) throw new Error("Gemini API error");
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(jsonText);
        aiMuscleAnalysisCache.set(cacheKey, parsed);
        return parsed;
    } catch (err) {
        const fallback = {
            verdict: `${muscle} is primed for training. Prioritize full active range of motion with a 2-second loaded stretch.`,
            activationCue: "Initiate each rep with the target muscle rather than relying on momentum.",
            repScheme: "3-4 sets of 8-12 reps @ 1-2 RIR",
            injuryPrevention: "Control the eccentric phase for 3 seconds to protect tendons and joints.",
            targetExercises: ["Heavy Compound", "Mid-Range Driver", "Stretch-Focused Isolation"]
        };
        aiMuscleAnalysisCache.set(cacheKey, fallback);
        return fallback;
    }
};

module.exports = {
    messageSent,
    generateWorkoutPlan,
    generateAICoachDebrief,
    generateAIMuscleAnalysis,
};
