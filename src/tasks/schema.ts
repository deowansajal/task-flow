import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string({ error: "Enter a title." }).trim()
    .min(1, "Enter a title.")
    .max(120, "Use 120 characters or fewer for the title."),
  description: z.string({ error: "Enter a plain-text description." })
    .transform((value) => value.replace(/\r\n?/g, "\n"))
    .pipe(z.string().max(1000, "Use 1,000 characters or fewer for the description."))
    .optional().transform((value) => value?.trim() ? value : null),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"], { error: "Choose a valid status." }).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"], { error: "Choose a valid priority." }).default("MEDIUM"),
});

