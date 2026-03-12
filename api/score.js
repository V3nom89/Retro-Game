import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  // GET /api/score?username=XXX  → restituisce il record dell'utente
  if (req.method === "GET") {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: "username mancante" });
    const rows = await sql`
      SELECT high_score FROM users WHERE LOWER(username) = LOWER(${username})
    `;
    return res.status(200).json({ high_score: rows[0]?.high_score ?? 0 });
  }

  // POST /api/score  { username, score } → aggiorna solo se il nuovo score è maggiore
  if (req.method === "POST") {
    const { username, score } = req.body;
    if (!username || score == null) return res.status(400).json({ error: "dati mancanti" });
    const rows = await sql`
      UPDATE users
      SET high_score = GREATEST(high_score, ${Math.floor(score)})
      WHERE LOWER(username) = LOWER(${username})
      RETURNING high_score
    `;
    if (!rows.length) return res.status(404).json({ error: "utente non trovato" });
    return res.status(200).json({ high_score: rows[0].high_score });
  }

  return res.status(405).end();
}
