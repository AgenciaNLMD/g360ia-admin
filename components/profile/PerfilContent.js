"use client";
// components/profile/PerfilContent.js
// Contenido del popup "Mi perfil"

import { useSession } from "next-auth/react";

export default function PerfilContent() {
  const { data: session } = useSession();
  const name    = session?.user?.name  ?? "Usuario";
  const email   = session?.user?.email ?? "";
  const image   = session?.user?.image ?? null;
  const initial = name[0]?.toUpperCase() ?? "U";

  return (
    <div className="prof-content">
      <div className="prof-avatar-row">
        {image ? (
          <img src={image} alt="" referrerPolicy="no-referrer" className="prof-avatar-lg" />
        ) : (
          <div className="prof-avatar-lg prof-avatar-lg--text">{initial}</div>
        )}
        <div>
          <div className="prof-name">{name}</div>
          <div className="prof-email">{email}</div>
        </div>
      </div>
      <div className="prof-divider" />
      <div className="prof-field">
        <div className="prof-field__label">Nombre completo</div>
        <div className="prof-field__value">{name}</div>
      </div>
      <div className="prof-field">
        <div className="prof-field__label">Correo electrónico</div>
        <div className="prof-field__value">{email}</div>
      </div>
      <div className="prof-field">
        <div className="prof-field__label">Rol</div>
        <div className="prof-field__value">Administrador</div>
      </div>
    </div>
  );
}
