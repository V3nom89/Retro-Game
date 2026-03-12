import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, password } = req.body;

  if (!username || username.trim().length < 3) {
    return res.status(400).json({ error: "NOME UTENTE TROPPO CORTO (MIN. 3 CARATTERI)" });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
    return res.status(400).json({ error: "SOLO LETTERE, NUMERI E _ CONSENTITI" });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ error: "PASSWORD TROPPO CORTA (MIN. 4 CARATTERI)" });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    const existing = await sql`
      SELECT id FROM users WHERE LOWER(username) = LOWER(${username.trim()})
    `;
    if (existing.length > 0) {
      return res.status(409).json({ error: "NOME UTENTE GIÀ IN USO" });
    }

    const hash = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (username, password_hash)
      VALUES (${username.trim().toUpperCase()}, ${hash})
      RETURNING username
    `;

    return res.status(201).json({ username: rows[0].username });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "ERRORE DEL SERVER — RIPROVA" });
  }
}
