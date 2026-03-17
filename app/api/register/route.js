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
      `INSERT INTO usuarios 
      (tenant_id, nombre, email, password_hash, rol, status, activo, creado_en) 
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        null,       // tenant_id
        nombre,
        email,
        "",         // password_hash (porque usaremos Google)
        "usuario",  // rol default
        "pending",  // status correcto
        true        // activo
      ]
    );

    return Response.json({ ok: true });

  } catch (error) {
    return Response.json({ ok: false, error: error.message });
  }
}
