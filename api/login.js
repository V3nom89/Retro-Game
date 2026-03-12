import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "INSERISCI NOME UTENTE E PASSWORD" });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT * FROM users WHERE LOWER(username) = LOWER(${username.trim()})
    `;
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "CREDENZIALI NON VALIDE — RIPROVA" });
    }

    return res.status(200).json({ username: user.username.toUpperCase() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "ERRORE DEL SERVER — RIPROVA" });
  }
}
