import { CATEGORY_KEYS_EXPENSE, CATEGORY_KEYS_INCOME } from "@/constants/categories";
import { ExtractedTransaction } from "@/types";

const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

const RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        type: { type: "string", enum: ["EXPENSE", "INCOME"], nullable: true },
        amount: { type: "number", nullable: true },
        category: {
            type: "string",
            enum: [...CATEGORY_KEYS_EXPENSE, ...CATEGORY_KEYS_INCOME],
            nullable: true,
        },
        description: { type: "string", nullable: true },
        date: { type: "string", nullable: true },
        transcript: { type: "string", nullable: true },
    },
    required: ["type", "amount", "category", "description", "date", "transcript"],
};

async function askGemini(prompt: string, inlineData: { mimeType: string; data: string }) {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY
    if (!apiKey) throw new Error('Missing Google Gemini API key');

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        { inlineData }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA,
            }
        }),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini request failed: ${errorText}`)
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as ExtractedTransaction;
}

export async function exportTransactionFromReceipt(base64Image: string, mimeType: string): Promise<ExtractedTransaction> {
    const prompt = `You are reading a receipt photo for a personal finance app. Extract the transaction details.

- "type" is always "EXPENSE" for a receipt.
- "amount" is the final total paid (a plain number, no currency symbols).
- "category" must be exactly one of: ${CATEGORY_KEYS_EXPENSE.join(", ")}.
- "description" is a short label, ideally the merchant/store name.
- "date" is the receipt date in YYYY-MM-DD format, if visible.
- "transcript" should be null.
- If any field can't be confidently determined from the image, set it to null. Do not guess.`;

    return await askGemini(prompt, { mimeType, data: base64Image });
}

export async function exportTransactionFromAudio(base64Audio: string, mimeType: string): Promise<ExtractedTransaction> {
    const today = new Date().toISOString().slice(0, 10);
    const prompt = `You are transcribing a short voice note for a personal finance app where the user is logging a transaction (e.g. "I spent 400 on groceries yesterday" or "Got 5000 rupees freelance payment today"). Today's date is ${today}. Extract the transaction details.

- "type" is "EXPENSE" or "INCOME" based on what the user said.
- "amount" is the amount mentioned (a plain number, no currency symbols).
- "category" must be exactly one of: ${CATEGORY_KEYS_EXPENSE.join(", ")}, ${CATEGORY_KEYS_INCOME.join(", ")} (pick from the expense list if type is EXPENSE, income list if INCOME).
- "description" is a short label summarizing what it was for.
- "date" should be null unless the user clearly mentioned a specific date (e.g. "yesterday", "on Monday") — resolve relative dates to YYYY-MM-DD using ${today} as today's date.
- "transcript" is the verbatim transcription of what was said.
- If any field can't be confidently determined, set it to null. Do not guess.`;

    return await askGemini(prompt, { mimeType, data: base64Audio });
}