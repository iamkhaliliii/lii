import { neon } from "@neondatabase/serverless";
import { AppSettings } from "@/types";

function getSQL() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(databaseUrl);
}

export async function getUserSettings(email: string): Promise<AppSettings | null> {
  const sql = getSQL();
  const rows = await sql`
    SELECT settings FROM user_settings WHERE email = ${email}
  `;
  if (rows.length === 0) return null;
  return rows[0].settings as AppSettings;
}

export async function upsertUserSettings(
  email: string,
  settings: AppSettings
): Promise<void> {
  const sql = getSQL();
  await sql`
    INSERT INTO user_settings (email, settings, updated_at)
    VALUES (${email}, ${JSON.stringify(settings)}::jsonb, NOW())
    ON CONFLICT (email)
    DO UPDATE SET
      settings = ${JSON.stringify(settings)}::jsonb,
      updated_at = NOW()
  `;
}
