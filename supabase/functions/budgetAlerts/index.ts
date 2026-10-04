import { wrapEmail } from "../_shared/emailLayout.ts";
import { sendEmail } from "../_shared/resend.ts";
import { createSupabaseAdmin } from "../_shared/supabaseAdmin.ts";

const THRESHOLDS = [100, 80];

function startOfMonth() {
  const d = new Date();
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
  ).toISOString();
}

function isSameMonth(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth()
  );
}

Deno.serve(async () => {
  const supabase = createSupabaseAdmin();
  let sent = 0;
  const now = new Date();

  const { data: budgets, error: budgetsError } = await supabase
    .from("budgets")
    .select("id, user_id, amount, last_alert_sent, last_alert_threshold")
  if (budgetsError) throw budgetsError;

  for (const budget of budgets ?? []) {
    if (!budget || budget.amount <= 0) continue;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("name, email, currency")
      .eq("clerk_id", budget.user_id)
      .single()
    if (userError) throw userError;

    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("amount")
      .gte("created_at", startOfMonth())
      .eq("user_id", budget.user_id)
      .eq("type", "EXPENSE")
    if (transactionsError) throw transactionsError;

    if (transactions?.length === 0) continue;
    const spent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
    const spentPercentage = (spent / budget.amount) * 100

    const alertedThisMonth = budget.last_alert_sent && isSameMonth(
      new Date(budget.last_alert_sent), now) ? budget.last_alert_threshold : null;

    const threshold = THRESHOLDS.find(
      (threshold) => spentPercentage >= threshold && (alertedThisMonth === null || alertedThisMonth < threshold)
    );
    if (!threshold) continue;

    const currency = user.currency
    const remaining = budget.amount - spent;
    const monthLabel = now.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

    const subject =
      threshold >= 100
        ? "Wealthy Budget Alert: You've reached your monthly limit"
        : `Wealthy Budget Alert: ${threshold}% of your ${monthLabel} budget used`;

    const htmlEmail = wrapEmail(`
      <p style="margin:0 0 16px;">Hi ${user.name ?? "there"},</p>
      <p style="margin:0 0 20px;">
        ${threshold >= 100
        ? `You've reached your <strong>${monthLabel}</strong> budget. Here's where things stand:`
        : `You've used <strong>${threshold}%</strong> of your <strong>${monthLabel}</strong> budget — sending this early so you can pace the rest of the month.`
      }
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:10px 0;border-top:1px solid #E8E6DF;color:#5C5F68;">Spent so far</td>
          <td style="padding:10px 0;border-top:1px solid #E8E6DF;text-align:right;font-weight:600;">${spent.toFixed(2)} ${currency}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-top:1px solid #E8E6DF;color:#5C5F68;">Monthly budget</td>
          <td style="padding:10px 0;border-top:1px solid #E8E6DF;text-align:right;font-weight:600;">${budget.amount.toFixed(2)} ${currency}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-top:1px solid #E8E6DF;color:#5C5F68;">${remaining >= 0 ? "Remaining" : "Over by"}</td>
          <td style="padding:10px 0;border-top:1px solid #E8E6DF;text-align:right;font-weight:600;color:${remaining >= 0 ? "#1A1D26" : "#FF6B4A"};">${Math.abs(remaining).toFixed(2)} ${currency}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-top:1px solid #E8E6DF;color:#5C5F68;">Used</td>
          <td style="padding:10px 0;border-top:1px solid #E8E6DF;text-align:right;font-weight:600;">${spentPercentage.toFixed(0)}%</td>
        </tr>
      </table>
      <p style="margin:0;color:#5C5F68;">
        ${threshold >= 100
        ? "Take a look at your recent transactions in Welth to see what pushed you over, and consider adjusting your budget if it no longer fits your spending."
        : "You're on track for now — keep an eye on your spending for the rest of the month to stay within budget."
      }
      </p>
    `);

    await sendEmail({
      to: user.email,
      subject,
      html: htmlEmail
    })

    const { error: updateError } = await supabase
      .from("budget")
      .update({
        last_alert_sent: now,
        last_alert_threshold: threshold
      })
      .eq("id", budget.id)
    if (budgetsError) throw updateError;

    sent++
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { "Content-Type": "application/json" },
  });
})