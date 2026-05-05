import { z } from "zod";

/**
 * Matches any valid .edu email address.
 * Accepts subdomains (e.g. student.pace.edu) but the TLD must be exactly ".edu".
 */
const eduEmailRegex = /^[^\s@]+@[^\s@]+\.edu$/i;

export const signupSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be at most 80 characters."),
  email: z
    .string()
    .email("Please enter a valid email address.")
    .regex(eduEmailRegex, "Only .edu email addresses are accepted."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters."),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address.")
    .regex(eduEmailRegex, "Only .edu email addresses are accepted."),
  password: z.string().min(1, "Password is required."),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address.")
    .regex(eduEmailRegex, "Only .edu email addresses are accepted."),
});

export const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .length(64, "Reset token is invalid.")
      .regex(/^[a-f0-9]+$/i, "Reset token is invalid."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be at most 128 characters.")
      .regex(/[a-z]/, "Password must include a lowercase letter.")
      .regex(/[A-Z]/, "Password must include an uppercase letter.")
      .regex(/[0-9]/, "Password must include a number."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match.",
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
