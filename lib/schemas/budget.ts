import * as z from "zod";

export const monthlyBudgetSchema = z.object({
    monthlyBudget: z
        .string()
        .min(1, "Enter a starting balance.")
        .refine((value) => {
            const parsed = parseFloat(value.replace(/,/g, ""));
            return !Number.isNaN(parsed) && parsed > 0;
        }, "Enter a valid number."),
})

export type MonthlyBudgetFormData = z.infer<typeof monthlyBudgetSchema>;