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

    // Append the user's latest message to the contents array so Gemini receives the active turn
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

module.exports = {
    messageSent,
};
