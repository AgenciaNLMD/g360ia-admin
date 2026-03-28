"use client";
// components/profile/DocumentosContent.js

import { useState } from "react";
import { DOCUMENTOS } from "../../lib/documentos";

function DocViewer({ doc, onClose }) {
  return (
    <div
      className="pmodal-backdrop"
      style={{ zIndex: 1100 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="pmodal">
        <div className="pmodal__header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <i className={`bi ${doc.icon}`} style={{ fontSize: "16px", color: "var(--pr)" }} />
            <span className="pmodal__title">{doc.label}</span>
          </div>
          <button className="pmodal__close" onClick={onClose} title="Cerrar">
            <i className="bi bi-x" />
          </button>
        </div>

        <div className="pmodal__body">
          {doc.url ? (
            <iframe
              src={doc.url}
              style={{ width: "100%", height: "60vh", border: "none" }}
              title={doc.label}
            />
          ) : (
            <div className="ui-empty">
              <i className="bi bi-file-earmark-x ui-empty__icon" />
              <div className="ui-empty__text">Documento no disponible aún</div>
              <div className="ui-empty__sub">
                {doc.version
                  ? `${doc.version} · Será cargado próximamente`
                  : "Será cargado próximamente"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DocumentosContent() {
  const [openDoc, setOpenDoc] = useState(null);

  return (
    <>
      <div className="prof-content">
        {DOCUMENTOS.map((doc) => (
          <div
            key={doc.id}
            className="prof-doc-row"
            onClick={() => setOpenDoc(doc)}
          >
            <div className="prof-doc-icon">
              <i className={`bi ${doc.icon}`} />
            </div>
            <div className="prof-doc-info">
              <div className="prof-doc-label">{doc.label}</div>
              <div className="prof-doc-sub">{doc.desc}</div>
            </div>
            <i className="bi bi-arrow-up-right prof-doc-arrow" />
          </div>
        ))}
      </div>

      {openDoc && (
        <DocViewer doc={openDoc} onClose={() => setOpenDoc(null)} />
      )}
    </>
  );
}
