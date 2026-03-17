import db from "../../../lib/db";
export async function POST(req) {
  try {
    const { nombre, email } = await req.json();

    // Verificar si ya existe
    const [existing] = await db.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return Response.json({ ok: false, error: "Usuario ya existe" });
    }

    // Crear usuario pendiente
    await db.query(
      "INSERT INTO usuarios (nombre, email, status) VALUES (?, ?, ?)",
      [nombre, email, "pending"]
    );

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error.message });
  }
}
