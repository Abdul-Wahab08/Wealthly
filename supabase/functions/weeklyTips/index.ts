import { getCategoryConfig } from "../_shared/categories.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { wrapEmail } from "../_shared/emailLayout.ts";
import { sendEmail } from "../_shared/resend.ts";

const GEMINI_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent";

const RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        tips: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
    },
    required: ["tips"],
};

async function generateWeeklyTips(
    currency: string,
    byCategory: Record<string, number>,
    totalIncome: number,
    totalExpense: number,
) {
    const apiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    const breakdown = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => `${category}: ${amount.toFixed(2)} ${currency}`)
        .join(", ");

    const prompt = `You are a friendly personal finance coach. Based on this user's last 7 days of activity, write 2-4 short, specific, actionable tips (max 20 words each) to help them save money or manage their finances better. Be encouraging, not preachy. Don't repeat generic advice like "make a budget" unless it's clearly relevant.

Total income this week: ${totalIncome.toFixed(2)} ${currency}
Total expenses this week: ${totalExpense.toFixed(2)} ${currency}
Spending by category: ${breakdown || "none"}`;

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
            ],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: RESPONSE_SCHEMA,
            }
        }),
    })

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini request failed: ${errorText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response from Gemini");

    const parsed = JSON.parse(text);

    return parsed.tips as string[] ?? [];
}

Deno.serve(async () => {
    const supabase = createSupabaseAdmin();
    let sent = 0;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: users, error: usersError } = await supabase
        .from("users")
        .select("clerk_id, email, name, currency");
    if (usersError) throw usersError;

    for (const user of users) {
        if (!user.email) continue;

        const { data: transactions, error: txError } = await supabase
            .from("transactions")
            .select("amount, category")
            .eq("user_id", user.clerk_id)
            .gte("created_at", weekAgo.toISOString());
        if (txError) throw txError;
        if (!transactions || transactions.length === 0) continue;

        const totalIncome = transactions.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
        const totalExpense = transactions.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

        const byCategory: Record<string, number> = {};
        for (const tx of transactions) {
            if (!tx.category) continue;
            byCategory[tx.category] = (byCategory[tx.category] || 0) + Math.abs(tx.amount);
        }

        const currency = user.currency || "USD";
        const tips = await generateWeeklyTips(currency, byCategory, totalIncome, totalExpense);
        if (tips.length === 0) continue;

        const netIncome = totalIncome - totalExpense;
        const topCategories = Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([category, amount]) => {
                // deno-lint-ignore no-explicit-any
                const label = getCategoryConfig(category as any)?.label ?? category;
                return `<li style="padding:6px 0;color:#5C5F68;">${label}: <strong style="color:#1A1D26;">${amount.toFixed(2)} ${currency}</strong></li>`;
            })
            .join("");

        const subject = "Your Wealthy weekly recap & money tips";

        const htmlEmail = wrapEmail(`<p style="margin:0 0 16px;">Hi ${user.name ?? "there"},</p>
      <p style="margin:0 0 20px;">Here's your weekly recap from Wealthly — a quick look at the last 7 days, plus a few tips to help you make the most of the week ahead.</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:10px 0;border-top:1px solid #E8E6DF;color:#5C5F68;">Income</td>
          <td style="padding:10px 0;border-top:1px solid #E8E6DF;text-align:right;font-weight:600;color:#3DDC84;">+${totalIncome.toFixed(2)} ${currency}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-top:1px solid #E8E6DF;color:#5C5F68;">Expenses</td>
          <td style="padding:10px 0;border-top:1px solid #E8E6DF;text-align:right;font-weight:600;color:#FF6B4A;">-${totalExpense.toFixed(2)} ${currency}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-top:1px solid #E8E6DF;color:#5C5F68;">Net Income</td>
          <td style="padding:10px 0;border-top:1px solid #E8E6DF;text-align:right;font-weight:600;">${netIncome >= 0 ? "+" : ""}${netIncome.toFixed(2)} ${currency}</td>
        </tr>
      </table>
      ${topCategories
                ? `<p style="margin:0 0 6px;font-weight:600;">Where it went</p>
             <ul style="margin:0 0 20px;padding-left:18px;list-style:none;">${topCategories}</ul>`
                : ""
            }
      <p style="margin:0 0 8px;font-weight:600;">Tips for you</p>
      <ol style="margin:0;padding-left:18px;">
        ${tips.map((tip) => `<li style="padding:4px 0;">${tip}</li>`).join("")}
      </ol>
    `)

        await sendEmail({
            to: user.email,
            subject,
            html: htmlEmail
        })

        sent++;
    }

    return new Response(JSON.stringify({ sent }), {
        headers: { "Content-Type": "application/json" },
    });
})