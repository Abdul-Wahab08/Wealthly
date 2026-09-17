import * as z from "zod";

export const signUpSchema = z.object({
    firstName: z.string().trim().min(1).max(50),
    lastName: z.string().trim().min(1).max(50),
    email: z.email("Please enter a valid email address").min(1, "Email is required."),
    password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
    email: z.email("Enter a valid email.").trim().min(1, "Email is required."),
    password: z.string().min(1, "Password is required."),
});

export type SignInFormData = z.infer<typeof signInSchema>;

export const codeSchema = z.object({
    code: z.string().min(1, "Enter the verification code."),
});

export type CodeFormData = z.infer<typeof codeSchema>;