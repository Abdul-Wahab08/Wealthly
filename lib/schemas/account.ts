import * as z from "zod";

export const accountSchema = z.object({
    name: z.string().min(1, "Enter an account name."),
    type: z.enum(["CASH", "BANK", "SAVINGS", "CREDIT_CARD"]),
})

export type AccountFormData = z.infer<typeof accountSchema>;