import * as z from "zod";

export const addTransactionSchema = z.object({
    type: z.enum(["EXPENSE", "INCOME"]),
    amount: z
        .string()
        .min(1, "Enter an amount.")
        .refine((value) => {
            const parsed = parseFloat(value.replace(/,/g, ""));
            return !Number.isNaN(parsed) && parsed > 0;
        }, "Enter a valid number."),
    category: z.string().min(1, "Select a category."),
    account: z.string().min(1, "Select an account."),
    date: z.date(),
    description: z.string().optional()
});

export type AddTransactionFormData = z.infer<typeof addTransactionSchema>;