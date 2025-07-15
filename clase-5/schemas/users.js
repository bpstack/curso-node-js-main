import { z } from 'zod'

const userSchema = z.object({
  name: z.string({
    required_error: 'Name is required',
    invalid_type_error: 'Name must be a string',
  }),
  email: z.string().email({
    message: 'Invalid email address',
  }),
  created_at: z.string().optional(),
  is_active: z.boolean().optional(),
  role: z.string({
    required_error: 'Role is required',
  }),
})

export function validateUser(input) {
  return userSchema.safeParse(input)
}
export function validatePartialUser(input) {
  return userSchema.partial().safeParse(input)
}
