import { z } from 'zod';

// Email validation
export const emailSchema = z
  .string()
  .email('Enter a valid email')
  .min(1, 'Email is required');

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one digit');

// Signup schema
export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Business details schema
export const businessSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  country: z.enum(['US', 'BR']),
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name must contain only letters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name must contain only letters'),
});

// Address schema
export const addressSchema = z.object({
  line1: z.string().min(5, 'Address must be at least 5 characters'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  phone: z.string().min(1, 'Phone number is required'),
  timezone: z.string().min(1, 'Timezone is required'),
});

// Selling method schema
export const sellingSchema = z
  .object({
    sellingMethod: z.enum(['hosted_store', 'integration']),
    integrationTypes: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.sellingMethod === 'integration') {
        return data.integrationTypes && data.integrationTypes.length > 0;
      }
      return true;
    },
    {
      message: 'Please select at least one integration type',
      path: ['integrationTypes'],
    }
  );

export type SignupFormData = z.infer<typeof signupSchema>;
export type BusinessFormData = z.infer<typeof businessSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type SellingFormData = z.infer<typeof sellingSchema>;