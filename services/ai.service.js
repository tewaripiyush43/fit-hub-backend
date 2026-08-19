const createError = require("http-errors");

const messageSent = async (payload) => {
    if (!payload) {
        throw createError.BadRequest("Payload is missing.");
    }

    const chatHistory = (payload.chatHistory || []).slice(-15);
    const rawMessage = payload.message;
    const newMessage = (rawMessage && typeof rawMessage === "object") ? rawMessage.text : rawMessage;

    if (!newMessage) {
        throw createError.BadRequest("Message is required.");
    }

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
const generateWorkoutPlan = async ({ target, difficulty, duration, intensity, equipment, specialFocus, prompt }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        // Fallback default exercises
        return {
            workoutName: `${target ? target.toUpperCase() : "Custom"} Power Routine`,
            description: `A targeted ${difficulty || "intermediate"} routine for ${target || "hypertrophy"}.`,
            exercises: ["Bench Press", "Incline Dumbbell Press", "Lateral Raise", "Triceps Pushdown"]
        };
    }

    const systemPrompt = `You are an elite strength & conditioning coach. Generate a structured JSON workout routine.
Output MUST be valid JSON with this exact schema:
{
  "workoutName": "string",
  "description": "string (1-2 sentences)",
  "exercises": ["Array of 4 to 7 exact exercise names standard in fitness databases like Bench Press, Squat, Lat Pulldown, etc."]
}`;

    const userPrompt = `Target: ${target || "Full Body"}, Difficulty: ${difficulty || "Intermediate"}, Duration: ${duration || "45"} minutes, Equipment: ${equipment || "Gym"}, Intensity: ${intensity || "Moderate"}, Focus: ${specialFocus || "Hypertrophy"}, Extra: ${prompt || "None"}`;

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

module.exports = {
    messageSent,
    generateWorkoutPlan,
    generateAICoachDebrief,
};
