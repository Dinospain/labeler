import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().default('8080'),
  DATABASE_URL: z.string().url(),
  TEMPLATE_PATH: z.string().default('./templates/default.html'),
  CLOUD_DOMAIN: z.string().optional()
});

export const env = EnvSchema.parse(process.env);
