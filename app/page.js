"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [rememberedUser, setRememberedUser] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 7200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("g360_last_user");
      if (saved) setRememberedUser(JSON.parse(saved));
    } catch (_) {}
  }, []);

  const handleLogin = () => {
    setLoading(true);
    signIn("google", { callbackUrl: "https://www.gestion360ia.com.ar/main.html" });
  };

  const handleContinue = () => {
    if (status === "authenticated") {
      try {
        localStorage.setItem("g360_last_user", JSON.stringify({
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }));
      } catch (_) {}
      window.location.href = "/dashboard";
      return;
    }
    handleLogin();
  };

  const handleForgetUser = () => {
    localStorage.removeItem("g360_last_user");
    setRememberedUser(null);
  };

  return (
    <>
      <div id="g360splash" style={{
        position:"fixed",inset:0,background:"#F2F4F6",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        gap:18,zIndex:99999,transition:"opacity .5s ease",
      }}>
        <canvas id="g360canvas" width="120" height="100" style={{display:"block"}} />
        <div id="g360splashName" style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:22,fontWeight:700,color:"#1F2937",letterSpacing:"-.3px",opacity:0,transition:"opacity .6s ease"}}>
          Gestión 360 <span style={{color:"#B08A55"}}>iA</span>
        </div>
        <div id="g360splashSub" style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:11,fontWeight:600,color:"#9CA3AF",letterSpacing:2,textTransform:"uppercase",opacity:0,transition:"opacity .6s ease"}}>
          Software Modular Integrado con iA
        </div>
        <div id="g360splashDots" style={{display:"flex",gap:7,opacity:0,transition:"opacity .6s ease"}}>
          <div className="g360dot" /><div className="g360dot" /><div className="g360dot" />
        </div>
      </div>

      <div className={`main-wrap ${visible ? "main-show" : ""}`}>
        <div className="card">
          <div className="logo">
            <div className="logo-mark"><G360SVG /></div>
            <div>
              <div className="logo-name">Gestión 360 <span className="gold">iA</span></div>
              <div className="logo-sub">Software Modular Integrado con iA</div>
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
              <button className="btn-primary" onClick={handleContinue} disabled={loading}>
                {loading ? <><Spinner /> Conectando...</> : "Continuar con esta cuenta"}
              </button>
              <button className="btn-ghost" onClick={handleForgetUser}>Usar otra cuenta</button>
            </div>
          ) : (
            <div className="login-wrap">
              <p className="login-hint">Ingresá con tu cuenta de Google autorizada.</p>
              <button className="btn-primary" onClick={handleLogin} disabled={loading}>
                {loading ? <><Spinner /> Conectando...</> : <><GoogleIcon /> Acceder con Google</>}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes sdp{0%,100%{background:#D1D5DB;transform:scale(1)}50%{background:#506886;transform:scale(1.4)}}
        .g360dot{width:8px;height:8px;border-radius:50%;background:#D1D5DB;animation:sdp 1.2s ease infinite;}
        .g360dot:nth-child(2){animation-delay:.2s;}
        .g360dot:nth-child(3){animation-delay:.4s;}
        .main-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;opacity:0;transform:translateY(20px);transition:opacity .5s ease,transform .5s ease;pointer-events:none;}
        .main-wrap.main-show{opacity:1;transform:translateY(0);pointer-events:all;}
        .card{background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:28px 28px 24px;width:100%;max-width:420px;box-shadow:0 4px 24px rgba(15,23,42,.08);}
        .logo{display:flex;align-items:center;gap:12px;margin-bottom:20px;}
        .logo-mark{width:44px;height:44px;background:#506886;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .logo-name{font-size:1.05rem;font-weight:600;color:#1F2937;}
        .gold{color:#B08A55;}
        .logo-sub{font-size:0.68rem;color:#9CA3AF;letter-spacing:.05em;text-transform:uppercase;margin-top:2px;}
        .divider{height:1px;background:#F3F4F6;margin-bottom:20px;}
        .login-wrap{display:flex;flex-direction:column;gap:14px;}
        .login-hint{font-size:0.85rem;color:#6B7280;line-height:1.5;}
        .remembered-wrap{display:flex;flex-direction:column;gap:10px;}
        .remembered-row{display:flex;align-items:center;gap:12px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:12px 14px;margin-bottom:4px;}
        .avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;}
        .avatar-placeholder{width:40px;height:40px;border-radius:50%;background:#506886;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0;}
        .remembered-info{display:flex;flex-direction:column;gap:2px;min-width:0;}
        .remembered-name{font-size:0.88rem;font-weight:600;color:#1F2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .remembered-email{font-size:0.75rem;color:#6B7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .btn-primary{width:100%;background:#506886;color:white;border:none;border-radius:10px;padding:13px 18px;font-size:0.9rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:opacity .15s,transform .1s;font-family:inherit;}
        .btn-primary:hover{opacity:.9;}.btn-primary:active{transform:scale(.98);}.btn-primary:disabled{opacity:.6;cursor:not-allowed;}
        .btn-ghost{width:100%;background:transparent;border:1px solid #E5E7EB;color:#6B7280;border-radius:10px;padding:11px 18px;font-size:0.85rem;cursor:pointer;transition:background .15s,color .15s;font-family:inherit;}
        .btn-ghost:hover{background:#F9FAFB;color:#374151;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .7s linear infinite;}
      `}</style>

      <script dangerouslySetInnerHTML={{ __html: `
(function(){
  var canvas=document.getElementById('g360canvas');
  if(!canvas) return;
  var ctx=canvas.getContext('2d');
  var S=28,G=6,R=5;
  var squares=[
    {col:0,row:2,color:'#506886',opacity:.30},
    {col:0,row:1,color:'#506886',opacity:.60},
    {col:0,row:0,color:'#506886',opacity:1},
    {col:1,row:0,color:'#506886',opacity:1},
    {col:1,row:1,color:'#506886',opacity:.60},
    {col:2,row:0,color:'#B08A55',opacity:1},
  ];
  var behaviors=[
    {dx:-10, dy:-260,dur:1800,delay:0,   ease:'bounce'},
    {dx:-280,dy:20,  dur:1700,delay:180, ease:'over'},
    {dx:200, dy:-200,dur:1800,delay:80,  ease:'smooth'},
    {dx:5,   dy:300, dur:1900,delay:260, ease:'bounce'},
    {dx:240, dy:180, dur:1700,delay:350, ease:'over'},
    {dx:320, dy:-60, dur:2100,delay:500, ease:'smooth'},
  ];
  var totalW=3*(S+G)-G;
  var offX=(canvas.width-totalW)/2,offY=(canvas.height-(3*(S+G)-G))/2;
  function tx(c){return offX+c*(S+G);}
  function ty(r){return offY+r*(S+G);}
  function eSmooth(t){return t<.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1;}
  function eBounce(t){if(t<1/2.75)return 7.5625*t*t;if(t<2/2.75){t-=1.5/2.75;return 7.5625*t*t+.75;}if(t<2.5/2.75){t-=2.25/2.75;return 7.5625*t*t+.9375;}t-=2.625/2.75;return 7.5625*t*t+.984375;}
  function eOver(t){var c=2.70158;return 1+c*Math.pow(t-1,3)+(c-1)*Math.pow(t-1,2);}
  function applyEase(type,t){return type==='bounce'?eBounce(t):type==='over'?eOver(t):eSmooth(t);}
  function hexRgb(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
  function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
  var particles=squares.map(function(sq,i){var b=behaviors[i];return{sq:sq,b:b,sx:tx(sq.col)+b.dx,sy:ty(sq.row)+b.dy};});
  var startTime=null,textShown=false;
  function draw(ts){
    if(!startTime) startTime=ts;
    var elapsed=ts-startTime;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(function(p){
      var raw=Math.max(0,elapsed-p.b.delay);
      var t=Math.min(1,raw/p.b.dur);
      var e=applyEase(p.b.ease,t);
      var cx=p.sx+(tx(p.sq.col)-p.sx)*e;
      var cy=p.sy+(ty(p.sq.row)-p.sy)*e;
      var rot=(1-e)*(p.b.ease==='over'?0.5:p.b.ease==='bounce'?-0.35:0.25);
      var sc=0.12+0.88*e;
      var al=Math.min(1,raw/350)*p.sq.opacity;
      var rgb=hexRgb(p.sq.color);
      ctx.save();
      ctx.globalAlpha=al;
      ctx.translate(cx+S/2,cy+S/2);
      ctx.rotate(rot);
      ctx.scale(sc,sc);
      ctx.translate(-S/2,-S/2);
      ctx.fillStyle='rgb('+rgb[0]+','+rgb[1]+','+rgb[2]+')';
      roundRect(0,0,S,S,R);
      ctx.fill();
      ctx.restore();
    });
    if(!textShown && elapsed>2900){
      textShown=true;
      var n=document.getElementById('g360splashName');
      var s=document.getElementById('g360splashSub');
      var d=document.getElementById('g360splashDots');
      if(n) n.style.opacity='1';
      if(s) setTimeout(function(){s.style.opacity='1';},400);
      if(d) setTimeout(function(){d.style.opacity='1';},800);
    }
    if(elapsed<7200){
      requestAnimationFrame(draw);
    } else {
      var splash=document.getElementById('g360splash');
      if(splash){splash.style.opacity='0';setTimeout(function(){if(splash.parentNode)splash.parentNode.removeChild(splash);},500);}
    }
  }
  requestAnimationFrame(draw);
})();
      `}} />
    </>
  );
}

function G360SVG() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18" width="22" height="18">
      <rect x="0" y="10" width="6" height="6" rx="1.5" fill="white" opacity=".35"/>
      <rect x="0" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
      <rect x="0" y="0"  width="6" height="6" rx="1.5" fill="white"/>
      <rect x="8" y="0"  width="6" height="6" rx="1.5" fill="white"/>
      <rect x="8" y="5"  width="6" height="6" rx="1.5" fill="white" opacity=".6"/>
      <rect x="16" y="0" width="6" height="6" rx="1.5" fill="#B08A55"/>
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

function Spinner() {
  return <div className="spinner" />;
}
