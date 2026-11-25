"use strict";
// SUBMARINE GAME v2: arrows/WASD = move (with inertia), SPACE = torpedo, HOLD SPACE 2 s = SUPER BEAM (5 s).
(()=>{
const cv=document.getElementById('game'),ctx=cv.getContext('2d'),W=cv.width,H=cv.height,$=id=>document.getElementById(id);
const keys={};let fireHeld=false,sub,torps,trash,parts,fish,score,lives,running=false,last=0,spawn=0,cool=0,best=0,charge=0,beamT=0,beamCd=0,shake=0,time=0,hurt=0,ac=null;
const BEAM_H=140,CHARGE=2,BEAM_LEN=5,BEAM_CD=8;
const kinds=[{n:'bottle',w:16,h:36},{n:'can',w:22,h:28},{n:'bag',w:42,h:34},{n:'tire',w:38,h:38}];
function snd(f,d,type,v,slide){if(!ac)return;try{const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);g.gain.setValueAtTime(v||.05,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d)}catch(e){}}
function reset(){sub={x:80,y:H/2-20,w:100,h:40,vx:0,vy:0,tilt:0};torps=[];trash=[];parts=[];score=0;lives=3;spawn=1;cool=0;charge=0;beamT=0;beamCd=0;shake=0;hurt=0;time=0;fish=[];for(let i=0;i<9;i++)fish.push({x:Math.random()*W,y:40+Math.random()*(H-140),s:.5+Math.random()*.9,v:20+Math.random()*40,c:`hsl(${180+Math.random()*60},60%,${45+Math.random()*20}%)`});hud()}
function hud(){$('g-score').textContent='Score: '+score;$('g-lives').textContent='Lives: '+'♥'.repeat(Math.max(lives,0));$('g-best').textContent='Best: '+best}
function shoot(){if(!running||cool>0)return;cool=.4;torps.push({x:sub.x+sub.w-4,y:sub.y+sub.h/2-3,t:0});snd(300,.25,'sawtooth',.05,90);for(let i=0;i<5;i++)parts.push({x:sub.x+sub.w,y:sub.y+sub.h/2,vx:-40+Math.random()*60,vy:(Math.random()-.5)*40,l:.7,m:.7,r:2+Math.random()*3,k:'b'})}
function boom(x,y,big){shake=Math.max(shake,big?.3:.15);snd(big?120:180,.35,'sawtooth',.07,40);parts.push({x,y,vx:0,vy:0,l:.35,m:.35,r:big?50:34,k:'ring'});for(let i=0;i<(big?18:12);i++){const a=Math.random()*6.28,s=40+Math.random()*160;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:.8,m:.8,r:2+Math.random()*4,k:i%3?'b':'d'})}}
function kill(t){t.dead=true;score+=10;boom(t.x+t.w/2,t.y+t.h/2,false)}
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(running&&['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(k===' '){if(!e.repeat){fireHeld=true;shoot()}}else keys[k]=true});
addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(k===' ')fireHeld=false;else keys[k]=false});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;fireHeld=false});
for(const b of document.querySelectorAll('[data-hold]')){const k=b.dataset.hold;const on=e=>{e.preventDefault();keys[k]=true},off=e=>{e.preventDefault();keys[k]=false};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off);b.addEventListener('pointercancel',off)}
const fb=$('g-fire');fb.addEventListener('pointerdown',e=>{e.preventDefault();fireHeld=true;shoot()});for(const ev of['pointerup','pointerleave','pointercancel'])fb.addEventListener(ev,()=>fireHeld=false);
function start(){try{ac=ac||new (window.AudioContext||window.webkitAudioContext)()}catch(e){}reset();running=true;$('g-start').hidden=true;$('g-msg').textContent='';last=performance.now();requestAnimationFrame(loop)}
$('g-start').addEventListener('click',start);
function update(dt){time+=dt;
const ax=(keys.arrowright||keys.d?1:0)-(keys.arrowleft||keys.a?1:0),ay=(keys.arrowdown||keys.s?1:0)-(keys.arrowup||keys.w?1:0);
sub.vx+=ax*700*dt;sub.vy+=ay*700*dt;const dr=Math.exp(-3.2*dt);sub.vx*=dr;sub.vy*=dr;
sub.x+=sub.vx*dt;sub.y+=sub.vy*dt+Math.sin(time*2)*.12;
if(sub.x<0){sub.x=0;sub.vx=0}if(sub.x>W*.6){sub.x=W*.6;sub.vx=0}if(sub.y<0){sub.y=0;sub.vy=0}if(sub.y>H-sub.h-18){sub.y=H-sub.h-18;sub.vy=0}
sub.tilt+=((sub.vy/260)*.3-sub.tilt)*Math.min(1,6*dt);cool-=dt;hurt-=dt;shake=Math.max(0,shake-dt);
// super beam: hold SPACE 2 s
beamCd-=dt;
if(beamT>0){beamT-=dt;charge=0}
else if(fireHeld&&beamCd<=0){charge=Math.min(CHARGE,charge+dt);if(charge>=CHARGE){beamT=BEAM_LEN;beamCd=BEAM_LEN+BEAM_CD;charge=0;shake=.5;snd(90,BEAM_LEN,'sawtooth',.05,70)}}
else charge=Math.max(0,charge-dt*2);
// spawn
spawn-=dt;if(spawn<=0){const k=kinds[Math.random()*kinds.length|0];trash.push({...k,x:W+30,y:30+Math.random()*(H-110),v:70+Math.random()*50+score*.8,ph:Math.random()*6,r:Math.random()*6,sp:(Math.random()-.5)*2});spawn=Math.max(.5,1.4-score/150)}
for(const t of torps){t.t+=dt;t.x+=520*dt;parts.push({x:t.x-4,y:t.y+3,vx:-30,vy:(Math.random()-.5)*20,l:.5,m:.5,r:2+Math.random()*2,k:'b'})}torps=torps.filter(t=>t.x<W+30);
for(const t of trash){t.x-=t.v*dt;t.y+=Math.sin(time*1.6+t.ph)*22*dt;t.r+=t.sp*dt}
for(const t of trash)for(const p of torps)if(!t.dead&&!p.dead&&p.x+22>t.x&&p.x<t.x+t.w&&p.y+8>t.y&&p.y<t.y+t.h){p.dead=true;kill(t)}
if(beamT>0){const by=sub.y+sub.h/2;for(const t of trash)if(!t.dead&&t.x+t.w>sub.x+sub.w&&t.y+t.h>by-BEAM_H/2&&t.y<by+BEAM_H/2)kill(t)}
for(const t of trash)if(!t.dead&&t.x<sub.x+sub.w-6&&t.x+t.w>sub.x+6&&t.y<sub.y+sub.h&&t.y+t.h>sub.y){t.dead=true;lives--;hurt=.6;shake=.4;boom(t.x,t.y,true);snd(80,.4,'square',.08,40)}
for(const t of trash)if(!t.dead&&t.x+t.w<0){t.dead=true;lives--;hurt=.4;snd(110,.3,'triangle',.06,60)}
trash=trash.filter(t=>!t.dead);torps=torps.filter(t=>!t.dead);
if(Math.random()<.5)parts.push({x:sub.x-2,y:sub.y+sub.h/2+(Math.random()-.5)*8,vx:-50-Math.random()*30,vy:-10+Math.random()*-20,l:1,m:1,r:1.5+Math.random()*2.5,k:'b'});
if(Math.random()<.06)parts.push({x:Math.random()*W,y:H-20,vx:0,vy:-30-Math.random()*30,l:6,m:6,r:1+Math.random()*3,k:'b'});
for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt;if(p.k==='b')p.vy-=10*dt;else p.vy+=60*dt}parts=parts.filter(p=>p.l>0);
for(const f of fish){f.x-=f.v*dt;if(f.x<-40){f.x=W+40;f.y=40+Math.random()*(H-140)}}
hud();if(lives<=0){running=false;best=Math.max(best,score);hud();$('g-msg').textContent='Game over! You destroyed '+score/10+' pieces of trash.';const b=$('g-start');b.hidden=false;b.textContent='Play again ↻'}}
// ---------- drawing ----------
function seabed(base,col,sp,amp){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,H);const o=time*sp;for(let x=0;x<=W;x+=16)ctx.lineTo(x,base+Math.sin((x+o)*.011)*amp+Math.sin((x+o)*.029)*amp*.4);ctx.lineTo(W,H);ctx.fill()}
function weed(x,y,h,s){ctx.strokeStyle='#2f8f55';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);const sw=Math.sin(time*1.5+x*.05)*10;ctx.bezierCurveTo(x+sw,y-h*.4,x-sw,y-h*.7,x+sw*1.4,y-h);ctx.stroke()}
function drawFish(f){ctx.save();ctx.translate(f.x,f.y);ctx.scale(-f.s,f.s);ctx.fillStyle=f.c;ctx.globalAlpha=.65;ctx.beginPath();ctx.ellipse(0,0,16,8,0,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(-24,-8+Math.sin(time*8+f.x)*3);ctx.lineTo(-24,8);ctx.fill();ctx.restore()}
function drawTrash(t){ctx.save();ctx.translate(t.x+t.w/2,t.y+t.h/2);ctx.rotate(t.r);const w=t.w,h=t.h;
if(t.n==='bottle'){ctx.fillStyle='rgba(150,215,240,.85)';ctx.fillRect(-w/2,-h/2+8,w,h-8);ctx.fillRect(-w/4,-h/2,w/2,10);ctx.fillStyle='#e34';ctx.fillRect(-w/4-1,-h/2-3,w/2+2,5);ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(-w/2+3,-h/2+10,3,h-16)}
else if(t.n==='can'){const g=ctx.createLinearGradient(-w/2,0,w/2,0);g.addColorStop(0,'#888');g.addColorStop(.4,'#eee');g.addColorStop(1,'#777');ctx.fillStyle=g;ctx.fillRect(-w/2,-h/2,w,h);ctx.fillStyle='#d33';ctx.fillRect(-w/2,-4,w,8);ctx.fillStyle='#555';ctx.fillRect(-w/2,-h/2,w,3);ctx.fillRect(-w/2,h/2-3,w,3)}
else if(t.n==='bag'){ctx.fillStyle='rgba(240,240,245,.7)';ctx.beginPath();ctx.moveTo(-w/2,-h/2);for(let i=0;i<=6;i++)ctx.lineTo(-w/2+i*w/6,-h/2+Math.sin(time*5+i)*3+(i%2?6:0));ctx.lineTo(w/2-4,h/2);ctx.quadraticCurveTo(0,h/2+8,-w/2+4,h/2);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-h/2,8,3.3,6.1);ctx.stroke()}
else{ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.arc(0,0,w/2,0,7);ctx.fill();ctx.fillStyle='#333';for(let i=0;i<10;i++){const a=i*.628;ctx.fillRect(Math.cos(a)*w/2-2,Math.sin(a)*w/2-2,4,4)}ctx.fillStyle='#777';ctx.beginPath();ctx.arc(0,0,w/4,0,7);ctx.fill();ctx.fillStyle='#0b3350';ctx.beginPath();ctx.arc(0,0,w/6,0,7);ctx.fill()}
ctx.restore()}
function drawSub(){const cx=sub.x+sub.w/2,cy=sub.y+sub.h/2;ctx.save();ctx.translate(cx,cy);ctx.rotate(sub.tilt);if(hurt>0&&Math.floor(hurt*20)%2)ctx.globalAlpha=.4;
ctx.fillStyle='#a37700';ctx.beginPath();ctx.moveTo(-44,-4);ctx.lineTo(-62,-20);ctx.lineTo(-56,-2);ctx.lineTo(-62,18);ctx.lineTo(-44,6);ctx.fill();
ctx.save();ctx.translate(-56,8);ctx.scale(1,Math.sin(time*40));ctx.fillStyle='#555';ctx.fillRect(-2,-13,4,26);ctx.restore();
const g=ctx.createLinearGradient(0,-20,0,20);g.addColorStop(0,'#ffe680');g.addColorStop(.5,'#f0b800');g.addColorStop(1,'#a37700');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,50,20,0,0,7);ctx.fill();
ctx.fillStyle='#d99f00';ctx.fillRect(-10,-30,30,14);ctx.fillStyle=g;ctx.fillRect(-8,-30,26,12);ctx.fillStyle='#333';ctx.fillRect(10,-40,3,12);ctx.fillRect(10,-40,10,3);
ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(-40,6,80,3);
for(let i=0;i<3;i++){ctx.fillStyle='#0a2a40';ctx.beginPath();ctx.arc(-22+i*18,-2,5.5,0,7);ctx.fill();ctx.fillStyle='#7fe3ff';ctx.beginPath();ctx.arc(-22+i*18-1,-3,3,0,7);ctx.fill()}
ctx.fillStyle='#333';ctx.fillRect(44,-5,8,10);
if(charge>0||beamT>0){const r=beamT>0?16:charge/CHARGE*14;ctx.globalCompositeOperation='lighter';const gg=ctx.createRadialGradient(52,0,0,52,0,r+6);gg.addColorStop(0,'rgba(255,255,255,.95)');gg.addColorStop(1,'rgba(0,200,255,0)');ctx.fillStyle=gg;ctx.beginPath();ctx.arc(52,0,r+6,0,7);ctx.fill();ctx.globalCompositeOperation='source-over'}
ctx.restore()}
function drawBeam(){const sx=sub.x+sub.w+4,cy=sub.y+sub.h/2,a=Math.min(1,(BEAM_LEN-beamT)/.25,beamT/.5),h=BEAM_H*(.92+Math.sin(time*40)*.05);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;
let g=ctx.createLinearGradient(0,cy-h/2,0,cy+h/2);g.addColorStop(0,'rgba(0,120,255,0)');g.addColorStop(.35,'rgba(0,200,255,.55)');g.addColorStop(.5,'rgba(180,255,255,.9)');g.addColorStop(.65,'rgba(0,200,255,.55)');g.addColorStop(1,'rgba(0,120,255,0)');ctx.fillStyle=g;ctx.fillRect(sx,cy-h/2,W-sx,h);
ctx.fillStyle='rgba(255,255,255,.95)';ctx.beginPath();ctx.moveTo(sx,cy-6);for(let x=sx;x<=W;x+=18)ctx.lineTo(x,cy-8-Math.abs(Math.sin(time*30+x*.1))*7);for(let x=W;x>=sx;x-=18)ctx.lineTo(x,cy+8+Math.abs(Math.sin(time*27+x*.13))*7);ctx.fill();
ctx.strokeStyle='rgba(120,230,255,.8)';ctx.lineWidth=2;for(let i=0;i<4;i++){ctx.beginPath();let y=cy+(i-1.5)*h/4;ctx.moveTo(sx,y);for(let x=sx;x<W;x+=30)ctx.lineTo(x,y+Math.sin(time*20+x*.05+i)*10);ctx.stroke()}ctx.restore()}
function draw(){ctx.save();if(shake>0)ctx.translate((Math.random()-.5)*shake*22,(Math.random()-.5)*shake*22);
const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#3aa6cf');g.addColorStop(.5,'#12668f');g.addColorStop(1,'#041b2c');ctx.fillStyle=g;ctx.fillRect(-20,-20,W+40,H+40);
ctx.fillStyle='rgba(255,255,255,.06)';for(let i=0;i<6;i++){const x=((i*170+time*14)%(W+240))-120;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+50,0);ctx.lineTo(x-60+Math.sin(time*.5+i)*20,H);ctx.lineTo(x-130,H);ctx.fill()}
for(const f of fish)drawFish(f);
seabed(H-70,'#0a3a4a',20,16);seabed(H-40,'#0b3b2e',45,10);for(let i=-1;i<11;i++){const x=(((i*90-time*45)%(W+90))+W+90)%(W+90)-45;weed(x,H-30,40+(i&3)*12)}seabed(H-16,'#06231f',80,4);
for(const p of parts){const a=Math.max(0,p.l/p.m);if(p.k==='ring'){ctx.strokeStyle=`rgba(255,220,150,${a})`;ctx.lineWidth=4*a;ctx.beginPath();ctx.arc(p.x,p.y,p.r*(1-a)+6,0,7);ctx.stroke()}else{ctx.fillStyle=p.k==='b'?`rgba(255,255,255,${a*.5})`:`rgba(255,170,60,${a})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill()}}
for(const t of trash)drawTrash(t);
for(const p of torps){ctx.fillStyle='#8a8f98';ctx.fillRect(p.x,p.y,22,7);ctx.fillStyle='#d33';ctx.beginPath();ctx.moveTo(p.x+22,p.y);ctx.lineTo(p.x+30,p.y+3.5);ctx.lineTo(p.x+22,p.y+7);ctx.fill();ctx.fillStyle='#555';ctx.fillRect(p.x-4,p.y-2,5,11)}
if(sub){if(beamT>0)drawBeam();drawSub()}
ctx.restore();
if(hurt>0){ctx.fillStyle=`rgba(255,0,0,${hurt*.3})`;ctx.fillRect(0,0,W,H)}
// HUD
if(sub){ctx.font='bold 13px sans-serif';ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(10,H-34,200,24);let txt,col='#9fe',fill=0;
if(beamT>0){txt='SUPER BEAM '+beamT.toFixed(1)+'s';col='#fff';fill=beamT/BEAM_LEN}else if(beamCd>0){txt='Recharging '+Math.ceil(beamCd)+'s';col='#789';fill=1-beamCd/BEAM_CD}else if(charge>0){txt='CHARGING...';col='#7ff';fill=charge/CHARGE}else{txt='Hold SPACE 2s: SUPER BEAM';col='#cf8';fill=1}
ctx.fillStyle=beamT>0?'#2cf':'#2a7';ctx.fillRect(12,H-32,196*Math.max(0,Math.min(1,fill)),20);ctx.fillStyle=col;ctx.fillText(txt,18,H-17)}}
function loop(t){const dt=Math.min((t-last)/1000,.05);last=t;if(running)update(dt);draw();if(running)requestAnimationFrame(loop)}
reset();draw();
})();
