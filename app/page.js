"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rememberedUser, setRememberedUser] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("g360_last_user");
      if (saved) setRememberedUser(JSON.parse(saved));
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      try {
        localStorage.setItem("g360_last_user", JSON.stringify({
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }));
      } catch (_) {}
      router.push("https://www.gestion360ia.com.ar/main.html");
    }
  }, [status, session]);

  const handleLogin = async () => {
    setLoading(true);
    await signIn("google", { redirect: false, callbackUrl: "/" });
    setLoading(false);
  };

  const handleForgetUser = () => {
    localStorage.removeItem("g360_last_user");
    setRememberedUser(null);
  };

  return (
    <>
      <div id="splash" className={showSplash ? "" : "splash-hide"}>
        <div className="splash-logo-mark">
          <G360SVG size="lg" />
        </div>
        <div className="splash-name">Gestión 360 iA</div>
        <div className="splash-sub">Software Modular Integrado con iA</div>
        <div className="splash-dots">
          <div className="splash-dot" />
          <div className="splash-dot" style={{ animationDelay: ".2s" }} />
          <div className="splash-dot" style={{ animationDelay: ".4s" }} />
        </div>
      </div>

      <div className={`main-wrap ${showSplash ? "" : "main-show"}`}>
        <div className="card">
          <div className="logo">
            <div className="logo-mark">
              <G360SVG size="sm" />
            </div>
            <div>
              <div className="logo-name">Gestión 360 <span className="gold">iA</span></div>
              <div className="logo-sub-card">Software Modular Integrado con iA</div>
            </div>
          </div>

          <div className="divider" />

          {rememberedUser ? (
            <div className="remembered-wrap">
              <div className="remembered-row">
                {rememberedUser.image ? (
                  <img src={rememberedUser.image} alt="" className="avatar" referrerPolicy="no-referrer" />
                ) : (
                  <div className="avatar-placeholder">{rememberedUser.name?.[0] ?? "?"}</div>
                )}
                <div className="remembered-info">
                  <span className="remembered-name">{rememberedUser.name}</span>
                  <span className="remembered-email">{rememberedUser.email}</span>
                </div>
              </div>
              <button className="btn-primary" onClick={handleLogin} disabled={loading}>
                {loading ? "Conectando..." : "Continuar con esta cuenta"}
              </button>
              <button className="btn-ghost" onClick={handleForgetUser}>
                Usar otra cuenta
              </button>
            </div>
          ) : (
            <div className="login-wrap">
              <p className="login-hint">Ingresá con tu cuenta de Google autorizada.</p>
              <button className="btn-primary" onClick={handleLogin} disabled={loading}>
                <GoogleIcon />
                {loading ? "Conectando..." : "Acceder con Google"}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; background: #F2F4F6; min-height: 100vh; }

        #splash {
          position: fixed; inset: 0; background: #F2F4F6;
          display: flex; align-items: center; justify-content: center;
          flex-direction: column; gap: 1.1rem; z-index: 100;
          transition: opacity .5s ease;
        }
        #splash.splash-hide { opacity: 0; pointer-events: none; }

        .splash-logo-mark {
          width: 72px; height: 72px; background: #506886; border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          animation: splashPop .5s cubic-bezier(.34,1.56,.64,1) forwards;
        }
        .splash-name { font-size: 1.2rem; font-weight: 600; color: #1F2937; opacity: 0; animation: fadeUp .4s ease .3s forwards; }
        .splash-sub { font-size: 0.72rem; color: #9CA3AF; letter-spacing: .08em; text-transform: uppercase; opacity: 0; animation: fadeUp .4s ease .5s forwards; }
        .splash-dots { display: flex; gap: 6px; opacity: 0; animation: fadeUp .4s ease .7s forwards; }
        .splash-dot { width: 6px; height: 6px; border-radius: 50%; background: #C5CDD6; animation: dotPulse 1.2s ease infinite; }

        .main-wrap {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          padding: 2rem; opacity: 0; transform: translateY(20px);
          transition: opacity .5s ease, transform .5s ease; pointer-events: none;
        }
        .main-wrap.main-show { opacity: 1; transform: translateY(0); pointer-events: all; }

        .card {
          background: #fff; border: 1px solid #E5E7EB; border-radius: 16px;
          padding: 28px 28px 24px; width: 100%; max-width: 420px;
          box-shadow: 0 4px 24px rgba(15,23,42,.08);
        }

        .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .logo-mark {
          width: 44px; height: 44px; background: #506886; border-radius: 11px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .logo-name { font-size: 1.05rem; font-weight: 600; color: #1F2937; }
        .gold { color: #B08A55; }
        .logo-sub-card { font-size: 0.68rem; color: #9CA3AF; letter-spacing: .05em; text-transform: uppercase; margin-top: 2px; }
        .divider { height: 1px; background: #F3F4F6; margin-bottom: 20px; }

        .login-wrap { display: flex; flex-direction: column; gap: 14px; }
        .login-hint { font-size: 0.85rem; color: #6B7280; line-height: 1.5; }

        .remembered-wrap { display: flex; flex-direction: column; gap: 10px; }
        .remembered-row {
          display: flex; align-items: center; gap: 12px;
          background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px;
          padding: 12px 14px; margin-bottom: 4px;
        }
        .avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .avatar-placeholder {
          width: 40px; height: 40px; border-radius: 50%; background: #506886; color: white;
          display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0;
        }
        .remembered-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .remembered-name { font-size: 0.88rem; font-weight: 600; color: #1F2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .remembered-email { font-size: 0.75rem; color: #6B7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .btn-primary {
          width: 100%; background: #506886; color: white; border: none; border-radius: 10px;
          padding: 13px 18px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: opacity .15s, transform .1s; font-family: inherit;
        }
        .btn-primary:hover { opacity: .9; }
        .btn-primary:active { transform: scale(.98); }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }

        .btn-ghost {
          width: 100%; background: transparent; border: 1px solid #E5E7EB; color: #6B7280;
          border-radius: 10px; padding: 11px 18px; font-size: 0.85rem;
          cursor: pointer; transition: background .15s, color .15s; font-family: inherit;
        }
        .btn-ghost:hover { background: #F9FAFB; color: #374151; }

        @keyframes splashPop {
          from { transform: scale(.5); opacity: 0; }
          to   { transform: scale(1);  opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%,100% { background: #C5CDD6; transform: scale(1); }
          50%     { background: #506886; transform: scale(1.3); }
        }
      `}</style>
    </>
  );
}

function G360SVG({ size }) {
  const lg = size === "lg";
  const w = lg ? 36 : 22;
  const h = lg ? 30 : 18;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" width={w} height={h}>
      <rect x="0"  y="10" width="6" height="6" rx="1.5" fill="white" opacity=".35"/>
      <rect x="0"  y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
      <rect x="0"  y="0"  width="6" height="6" rx="1.5" fill="white"/>
      <rect x="8"  y="0"  width="6" height="6" rx="1.5" fill="white"/>
      <rect x="8"  y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
      <rect x="16" y="0"  width="6" height="6" rx="1.5" fill="#B08A55"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.292C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
