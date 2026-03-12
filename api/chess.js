import { neon } from "@neondatabase/serverless";
import { Chess } from "chess.js";

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  // GET /api/chess?room=ABCD12
  if (req.method === "GET") {
    const { room } = req.query;
    if (!room) return res.status(400).json({ error: "ROOM RICHIESTA" });

    const rows = await sql`
      SELECT room_code, white_player, black_player, fen, status
      FROM chess_games WHERE room_code = ${room.toUpperCase()}
    `;
    if (!rows.length) return res.status(404).json({ error: "STANZA NON TROVATA" });
    return res.status(200).json(rows[0]);
  }

  if (req.method !== "POST") return res.status(405).end();

  const { action, username, room, from, to, promotion } = req.body || {};
  if (!action || !username) return res.status(400).json({ error: "PARAMETRI MANCANTI" });

  try {
    // CREATE
    if (action === "create") {
      // Remove old waiting rooms by this user
      await sql`
        DELETE FROM chess_games
        WHERE white_player = ${username} AND status = 'waiting'
      `;
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await sql`
        INSERT INTO chess_games (room_code, white_player)
        VALUES (${code}, ${username})
      `;
      return res.status(200).json({ room_code: code });
    }

    // JOIN
    if (action === "join") {
      if (!room) return res.status(400).json({ error: "ROOM RICHIESTA" });
      const rows = await sql`
        SELECT * FROM chess_games WHERE room_code = ${room.toUpperCase()}
      `;
      if (!rows.length) return res.status(404).json({ error: "STANZA NON TROVATA" });
      const game = rows[0];
      if (game.status !== "waiting") return res.status(400).json({ error: "PARTITA GIA' INIZIATA" });
      if (game.white_player.toLowerCase() === username.toLowerCase()) {
        return res.status(400).json({ error: "NON PUOI GIOCARE CONTRO TE STESSO" });
      }
      await sql`
        UPDATE chess_games
        SET black_player = ${username}, status = 'playing', updated_at = NOW()
        WHERE room_code = ${room.toUpperCase()}
      `;
      return res.status(200).json({ ok: true, color: "black" });
    }

    // MOVE
    if (action === "move") {
      if (!room || !from || !to) return res.status(400).json({ error: "PARAMETRI MANCANTI" });
      const rows = await sql`
        SELECT * FROM chess_games WHERE room_code = ${room.toUpperCase()}
      `;
      if (!rows.length) return res.status(404).json({ error: "STANZA NON TROVATA" });
      const game = rows[0];
      if (game.status !== "playing") return res.status(400).json({ error: "PARTITA NON IN CORSO" });

      const chess = new Chess(game.fen);
      const turn = chess.turn(); // 'w' or 'b'
      const isWhite = game.white_player.toLowerCase() === username.toLowerCase();
      const isBlack = game.black_player && game.black_player.toLowerCase() === username.toLowerCase();

      if ((turn === "w" && !isWhite) || (turn === "b" && !isBlack)) {
        return res.status(400).json({ error: "NON E' IL TUO TURNO" });
      }

      let result;
      try {
        result = chess.move({ from, to, promotion: promotion || "q" });
      } catch {
        return res.status(400).json({ error: "MOSSA NON VALIDA" });
      }
      if (!result) return res.status(400).json({ error: "MOSSA NON VALIDA" });

      const newFen = chess.fen();
      let newStatus = "playing";
      if (chess.isCheckmate()) {
        newStatus = turn === "w" ? "white_wins" : "black_wins";
      } else if (chess.isDraw()) {
        newStatus = "draw";
      }

      await sql`
        UPDATE chess_games
        SET fen = ${newFen}, status = ${newStatus}, updated_at = NOW()
        WHERE room_code = ${room.toUpperCase()}
      `;
      return res.status(200).json({ fen: newFen, status: newStatus });
    }

    // RESIGN
    if (action === "resign") {
      if (!room) return res.status(400).json({ error: "ROOM RICHIESTA" });
      const rows = await sql`
        SELECT * FROM chess_games WHERE room_code = ${room.toUpperCase()}
      `;
      if (!rows.length) return res.status(404).json({ error: "STANZA NON TROVATA" });
      const game = rows[0];
      const isWhite = game.white_player.toLowerCase() === username.toLowerCase();
      const newStatus = isWhite ? "black_wins" : "white_wins";
      await sql`
        UPDATE chess_games
        SET status = ${newStatus}, updated_at = NOW()
        WHERE room_code = ${room.toUpperCase()}
      `;
      return res.status(200).json({ ok: true, status: newStatus });
    }

    return res.status(400).json({ error: "AZIONE NON VALIDA" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "ERRORE DEL SERVER" });
  }
}
