"use strict";
// SUBMARINE GAME: arrows/WASD move, SPACE shoots torpedoes at underwater trash.
(()=>{
const cv=document.getElementById('game'),ctx=cv.getContext('2d'),W=cv.width,H=cv.height;
const keys={};let sub,torps,trash,bubbles,score,lives,running=false,last=0,spawn=0,cool=0,best=0;
const kinds=[{n:'bottle',w:16,h:34,c:'#7cc4e8'},{n:'can',w:22,h:26,c:'#c9c9c9'},{n:'bag',w:36,h:30,c:'#f2f2f2'},{n:'tire',w:34,h:34,c:'#222'}];
function reset(){sub={x:70,y:H/2,w:90,h:38};torps=[];trash=[];bubbles=[];score=0;lives=3;spawn=0;cool=0;hud()}
function hud(){document.getElementById('g-score').textContent='Score: '+score;document.getElementById('g-lives').textContent='Lives: '+'♥'.repeat(Math.max(lives,0));document.getElementById('g-best').textContent='Best: '+best}
function shoot(){if(!running||cool>0)return;torps.push({x:sub.x+sub.w,y:sub.y+4});cool=.35}
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)&&running)e.preventDefault();keys[e.key.toLowerCase()]=true;if(e.key===' ')shoot()});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
for(const b of document.querySelectorAll('[data-hold]')){const k=b.dataset.hold;const on=e=>{e.preventDefault();keys[k]=true};const off=e=>{e.preventDefault();keys[k]=false};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointerleave',off)}
document.getElementById('g-fire').addEventListener('pointerdown',e=>{e.preventDefault();shoot()});
function start(){reset();running=true;document.getElementById('g-start').hidden=true;document.getElementById('g-msg').textContent='';last=performance.now();requestAnimationFrame(loop)}
document.getElementById('g-start').addEventListener('click',start);
function update(dt){const s=230;
if(keys.arrowup||keys.w)sub.y-=s*dt;if(keys.arrowdown||keys.s)sub.y+=s*dt;if(keys.arrowleft||keys.a)sub.x-=s*dt;if(keys.arrowright||keys.d)sub.x+=s*dt;
sub.x=Math.max(0,Math.min(W*.6,sub.x));sub.y=Math.max(0,Math.min(H-sub.h,sub.y));cool-=dt;
spawn-=dt;if(spawn<=0){const k=kinds[Math.random()*kinds.length|0];trash.push({...k,x:W+20,y:20+Math.random()*(H-60),v:70+Math.random()*60+score*1.5,r:0});spawn=Math.max(.45,1.3-score/120)}
for(const t of torps)t.x+=480*dt;torps=torps.filter(t=>t.x<W+20);
for(const t of trash){t.x-=t.v*dt;t.r+=dt}
for(const t of trash)for(const p of torps)if(!t.dead&&!p.dead&&p.x+18>t.x&&p.x<t.x+t.w&&p.y+6>t.y&&p.y<t.y+t.h){t.dead=p.dead=true;score+=10;for(let i=0;i<8;i++)bubbles.push({x:t.x+t.w/2,y:t.y+t.h/2,vx:(Math.random()-.5)*120,vy:(Math.random()-.5)*120,l:.6})}
for(const t of trash)if(!t.dead&&t.x<sub.x+sub.w&&t.x+t.w>sub.x&&t.y<sub.y+sub.h&&t.y+t.h>sub.y){t.dead=true;lives--}
for(const t of trash)if(!t.dead&&t.x+t.w<0){t.dead=true;lives--}
trash=trash.filter(t=>!t.dead);torps=torps.filter(t=>!t.dead);
if(Math.random()<.2)bubbles.push({x:sub.x-4,y:sub.y+sub.h/2,vx:-30,vy:-20,l:1});
for(const b of bubbles){b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt}bubbles=bubbles.filter(b=>b.l>0);
hud();if(lives<=0){running=false;best=Math.max(best,score);hud();document.getElementById('g-msg').textContent='Game over! You cleaned '+score/10+' pieces of trash.';const b=document.getElementById('g-start');b.hidden=false;b.textContent='Play again ↻'}}
function draw(){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#2a8fb8');g.addColorStop(1,'#08283d');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
ctx.fillStyle='#0b3b2e';ctx.fillRect(0,H-14,W,14);
for(const b of bubbles){ctx.globalAlpha=Math.max(b.l,0);ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,3,0,7);ctx.stroke()}ctx.globalAlpha=1;
for(const t of trash){ctx.save();ctx.translate(t.x+t.w/2,t.y+t.h/2);ctx.rotate(Math.sin(t.r*2)*.3);ctx.fillStyle=t.c;if(t.n==='tire'){ctx.beginPath();ctx.arc(0,0,t.w/2,0,7);ctx.fill();ctx.fillStyle='#08283d';ctx.beginPath();ctx.arc(0,0,t.w/5,0,7);ctx.fill()}else if(t.n==='bag'){ctx.beginPath();ctx.ellipse(0,0,t.w/2,t.h/2,0,0,7);ctx.fill()}else ctx.fillRect(-t.w/2,-t.h/2,t.w,t.h);ctx.restore()}
ctx.fillStyle='#ff6b4a';for(const p of torps){ctx.fillRect(p.x,p.y,18,7);ctx.fillStyle='#ffd166';ctx.fillRect(p.x-6,p.y+2,6,3);ctx.fillStyle='#ff6b4a'}
if(sub){ctx.fillStyle='#f4c430';ctx.beginPath();ctx.ellipse(sub.x+sub.w/2,sub.y+sub.h/2,sub.w/2,sub.h/2,0,0,7);ctx.fill();ctx.fillRect(sub.x+30,sub.y-10,24,14);ctx.fillRect(sub.x+44,sub.y-16,3,8);ctx.fillStyle='#08283d';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(sub.x+30+i*16,sub.y+sub.h/2,5,0,7);ctx.fill()}ctx.fillStyle='#c79a0a';ctx.fillRect(sub.x-8,sub.y+sub.h/2-9,10,18)}}
function loop(t){const dt=Math.min((t-last)/1000,.05);last=t;if(running)update(dt);draw();if(running)requestAnimationFrame(loop)}
reset();draw();
})();
