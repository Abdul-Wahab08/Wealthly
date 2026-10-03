import { Budget, Transaction } from "@/types";
import { formatPrice } from "../formatPrice";
import { getCategoryConfig } from "@/constants/categories";
import { format, isSameMonth, subDays } from "date-fns";

const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

function createContext(transactions: Transaction[], budget: Budget | null, currency: string) {
    const now = new Date();
    const cutoff = subDays(now, 30);
    const recent = transactions.filter((tx) => new Date(tx.date) >= cutoff);
    const thisMonth = transactions.filter((tx) => isSameMonth(new Date(tx.date), now));

    const thisMonthExpense = thisMonth
        .filter((tx) => tx.type === "EXPENSE" && isSameMonth(new Date(tx.date), now))
        .reduce((sum, tx) => sum + tx.amount, 0);

    const spentByCategory: Record<string, number> = {};
    let income = 0;
    let expense = 0;

    recent.forEach((tx) => {
        if (tx.type === "EXPENSE") {
            expense += tx.amount;
        } else {
            income += tx.amount;
        }
    });

    thisMonth.forEach((tx) => {
        if (tx.type === "EXPENSE") {
            spentByCategory[tx.category] = (spentByCategory[tx.category] ?? 0) + tx.amount;
        }
    });

    const categoryLines = Object.entries(spentByCategory)
        .sort((a, b) => b[1] - a[1])
        .map(
            ([category, amount]) =>
                `- ${getCategoryConfig(category as any).label}: ${formatPrice(amount, currency)}`
        )
        .join("\n");

    const budgetLine = budget
        ? `${formatPrice(thisMonthExpense, currency)} spent of ${formatPrice(
            budget.amount,
            currency
        )} monthly budget`
        : "No monthly budget set.";

    const txLines = recent
        .map(
            (tx) =>
                `- ${format(new Date(tx.date), "d MMM yyyy")} | ${tx.type} | ${getCategoryConfig(tx.category).label
                } | ${formatPrice(tx.amount, currency)}${tx.description ? ` | ${tx.description}` : ""
                }`
        )
        .join("\n");

    return `Last 30 days summary:
Total income: ${formatPrice(income, currency)}
Total expense: ${formatPrice(expense, currency)}

Spending by category:
${categoryLines || "No expenses recorded."}

Monthly budget:
${budgetLine}

Recent transactions: (last 30 days)
${txLines || "No transactions recorded."}`;
}

export async function askAssistant(
    promptUser: string,
    transactions: Transaction[],
    budget: Budget | null,
    currency: string) {

    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY
    if (!apiKey) throw new Error('Missing Google Gemini API key');

    const context = createContext(transactions, budget, currency);
    const prompt = `You are a helpful personal finance assistant inside the Welth app. 

Rules:
- Answer in plain text only. No markdown, no asterisks, no bold, no bullet symbols.
- Be concise. 2-4 sentences max unless the user asks for details.
- Use numbers and specifics from the data provided.
- If the data doesn't answer the question, say so briefly.
- Never explain what you're about to do, just answer directly.

Financial data:
${context}

User question: ${promptUser}`; 

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ]
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini request failed: ${errorText}`);
    }

    const data = await response.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("No response from Gemini");

    return content as string;
}