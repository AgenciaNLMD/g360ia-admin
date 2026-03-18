import Providers from "./providers";

export const metadata = {
  title: "G360 Admin — Gestión 360 iA",
  description: "Panel de administración de Gestión 360 iA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
          body{font-family:'Inter','Segoe UI',system-ui,sans-serif;background:#F2F4F6;min-height:100vh;}
          #g360splash{
            position:fixed;inset:0;background:#F2F4F6;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            gap:18px;z-index:99999;
            transition:opacity .5s ease,visibility .5s ease;
          }
          #g360splash.hide{opacity:0;visibility:hidden;pointer-events:none;}
          #g360splashName{
            font-family:'Inter',system-ui,sans-serif;
            font-size:22px;font-weight:700;color:#1F2937;letter-spacing:-.3px;
            opacity:0;transition:opacity .6s ease;
          }
          #g360splashSub{
            font-family:'Inter',system-ui,sans-serif;
            font-size:11px;font-weight:600;color:#9CA3AF;
            letter-spacing:2px;text-transform:uppercase;
            opacity:0;transition:opacity .6s ease;
          }
          #g360splashDots{display:flex;gap:7px;opacity:0;transition:opacity .6s ease;}
          @keyframes sdp{0%,100%{background:#D1D5DB;transform:scale(1)}50%{background:#506886;transform:scale(1.4)}}
          .g360dot{width:8px;height:8px;border-radius:50%;background:#D1D5DB;animation:sdp 1.2s ease infinite;}
          .g360dot:nth-child(2){animation-delay:.2s;}
          .g360dot:nth-child(3){animation-delay:.4s;}
        `}} />
      </head>
      <body>
        <div id="g360splash">
          <canvas id="g360canvas" width="120" height="100" />
          <div id="g360splashName">Gestión 360 <span style={{color:'#B08A55'}}>iA</span></div>
          <div id="g360splashSub">Software Modular Integrado con iA</div>
          <div id="g360splashDots">
            <div className="g360dot" />
            <div className="g360dot" />
            <div className="g360dot" />
          </div>
        </div>

        <Providers>{children}</Providers>

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
  var totalW=3*(S+G)-G, totalH=3*(S+G)-G;
  var offX=(canvas.width-totalW)/2, offY=(canvas.height-totalH)/2;
  function tx(c){return offX+c*(S+G);}
  function ty(r){return offY+r*(S+G);}
  function eSmooth(t){return t<.5?4*t*t*t:(t-1)*(2*t-2)*(2*t-2)+1;}
  function eBounce(t){if(t<1/2.75)return 7.5625*t*t;if(t<2/2.75){t-=1.5/2.75;return 7.5625*t*t+.75;}if(t<2.5/2.75){t-=2.25/2.75;return 7.5625*t*t+.9375;}t-=2.625/2.75;return 7.5625*t*t+.984375;}
  function eOver(t){var c=2.70158;return 1+c*Math.pow(t-1,3)+(c-1)*Math.pow(t-1,2);}
  function applyEase(type,t){return type==='bounce'?eBounce(t):type==='over'?eOver(t):eSmooth(t);}
  function hexRgb(h){return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
  function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
  var particles=squares.map(function(sq,i){var b=behaviors[i];return{sq:sq,b:b,sx:tx(sq.col)+b.dx,sy:ty(sq.row)+b.dy};});
  var startTime=null,textShown=false,rafId;
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
    if(elapsed < 4200){
      rafId=requestAnimationFrame(draw);
    } else {
      var splash=document.getElementById('g360splash');
      if(splash){
        splash.style.transition='opacity .5s ease';
        splash.style.opacity='0';
        setTimeout(function(){
          if(splash.parentNode) splash.parentNode.removeChild(splash);
        },500);
      }
    }
  }
  rafId=requestAnimationFrame(draw);
})();
        `}} />
      </body>
    </html>
  );
}
