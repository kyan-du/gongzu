/**
 * Shared environment bindings for Cloudflare Pages Functions
 */
export interface Env {
  // Database
  DB: D1Database;

  // Storage
  R2: R2Bucket;

  // Authentication
  ADMIN_API_KEY: string;
  FAMILY_PASSPHRASE: string;

  // Webhooks
  WEBHOOK_URL: string;
  WEBHOOK_TOKEN: string;

  // AI Service
  AI_PROXY_KEY: string;
  AI_BASE_URL?: string;
  AI_MODEL?: string;
  AI_VISION_MODEL?: string;
}
