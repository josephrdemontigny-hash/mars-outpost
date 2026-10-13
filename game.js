import * as THREE from 'three';
const N=24;
const B={
 pad:{n:'Landing Pad',c:300,s:2,ic:'🛬',col:0x999999,d:'Ships land here'},
 hab:{n:'Habitat',c:120,s:1,ic:'🏠',house:6,pw:-1,d:'Houses 6'},
 solar:{n:'Solar Array',c:80,s:1,ic:'☀️',pw:5,d:'+5 power'},
 farm:{n:'Farm Dome',c:150,s:1,ic:'🌱',food:1.2,pw:-1,wat:-0.3,d:'+food'},
 ice:{n:'Ice Extractor',c:130,s:1,ic:'🧊',wat:1.2,pw:-2,d:'+water'},
 fuel:{n:'Fuel Plant',c:250,s:1,ic:'⛽',fuel:0.8,pw:-3,wat:-0.6,d:'Methane/LOX'},
 bigfarm:{n:'Biome Farm',c:600,s:2,ic:'🌳',food:6,pw:-3,wat:-1.2,unl:30,d:'Big food'},
 refin:{n:'Fuel Refinery',c:900,s:2,ic:'🏭',fuel:4,pw:-8,wat:-2.5,unl:50,d:'Lots of fuel'},
 mega:{n:'Mega Habitat',c:1000,s:2,ic:'🏙️',house:40,pw:-4,unl:60,d:'Houses 40'},
 reactor:{n:'Fission Plant',c:1200,s:2,ic:'⚛️',pw:30,unl:40,d:'+30 power'},
 dozer:{n:'Bulldoze',c:0,s:1,ic:'🚜',d:'50% refund'}
};
let S;
function fresh(){return{cr:600,food:30,wat:30,fuel:0,pop:0,hap:80,t:0,b:[],earned:0};}
// ---------- three setup
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;document.body.prepend(R.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xd9a07a);scene.fog=new THREE.Fog(0xd9a07a,60,110);
let zoom=8,rot=0,rotT=0;const tgt=new THREE.Vector3(N/2,0,N/2);
const cam=new THREE.OrthographicCamera(-1,1,1,-1,0.1,300);
function camUp(){const a=innerWidth/innerHeight;cam.left=-zoom*a;cam.right=zoom*a;cam.top=zoom;cam.bottom=-zoom;cam.updateProjectionMatrix();
 const ang=Math.PI/4+rot;cam.position.set(tgt.x+Math.sin(ang)*50,40,tgt.z+Math.cos(ang)*50);cam.lookAt(tgt);}
scene.add(new THREE.HemisphereLight(0xffe0c0,0x8a3a1a,0.9));
const sun=new THREE.DirectionalLight(0xfff0dd,1.6);sun.position.set(N/2+20,35,N/2+10);sun.target.position.set(N/2,0,N/2);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25,far:100});scene.add(sun,sun.target);
// terrain
const tg=new THREE.PlaneGeometry(N+40,N+40,64,64);tg.rotateX(-Math.PI/2);
{const p=tg.attributes.position,cols=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);const d=Math.max(Math.abs(x),Math.abs(z));
 let h=d>N/2+1?(Math.sin(x*.3)*Math.cos(z*.25)+1)*(d-N/2)*.25:0;p.setY(i,h-0.01);const k=0.85+Math.random()*.15;cols.push(0.72*k,0.33*k,0.18*k);}
 tg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));tg.computeVertexNormals();}
const ground=new THREE.Mesh(tg,new THREE.MeshLambertMaterial({vertexColors:true}));ground.position.set(N/2,0,N/2);ground.receiveShadow=true;scene.add(ground);
const grid=new THREE.GridHelper(N,N,0x7a2f12,0x7a2f12);grid.position.set(N/2,0.01,N/2);grid.material.opacity=.25;grid.material.transparent=true;scene.add(grid);
for(let i=0;i<40;i++){const r=new THREE.Mesh(new THREE.DodecahedronGeometry(.15+Math.random()*.4,0),new THREE.MeshLambertMaterial({color:0x6a2a14}));
 const a=Math.random()*6.28,d=N/2+2+Math.random()*12;r.position.set(N/2+Math.cos(a)*d,0.1,N/2+Math.sin(a)*d);r.castShadow=true;scene.add(r);}
// ---------- models
const M=c=>new THREE.MeshStandardMaterial({color:c,roughness:.7,metalness:.1});
const glass=new THREE.MeshStandardMaterial({color:0xaee8ff,transparent:true,opacity:.55,roughness:.1});
function mesh(g,m,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;return o;}
function model(t){const g=new THREE.Group(),s=B[t].s,h=s/2;
 const base=mesh(new THREE.BoxGeometry(s*.95,.08,s*.95),M(0x8a8178),h,.04,h);g.add(base);
 if(t==='pad'){base.material=M(0x777777);g.add(mesh(new THREE.CylinderGeometry(.7,.7,.02,24),M(0xffcc33),1,.09,1));
  g.add(mesh(new THREE.CylinderGeometry(.55,.55,.03,24),M(0x777777),1,.1,1));}
 else if(t==='hab'){g.add(mesh(new THREE.SphereGeometry(.42,16,10,0,6.3,0,1.6),M(0xeeeeee),.5,.08,.5));g.add(mesh(new THREE.BoxGeometry(.2,.25,.2),M(0x4a6fa5),.5,.2,.9));}
 else if(t==='mega'){[[.6,.6],[1.4,.6],[1,1.4]].forEach(([x,z],i)=>g.add(mesh(new THREE.CylinderGeometry(.35,.4,1.2+i*.5,10),M(0xdddddd),x,.6+i*.25,z)));
  g.add(mesh(new THREE.SphereGeometry(.5,14,8,0,6.3,0,1.6),glass,1,.08,1));}
 else if(t==='solar'){for(let i=0;i<2;i++){const p=mesh(new THREE.BoxGeometry(.8,.03,.35),M(0x1a2a6a),.5,.35,.27+i*.45);p.material.metalness=.6;p.rotation.x=-.4;g.add(p);
  g.add(mesh(new THREE.CylinderGeometry(.03,.03,.3),M(0x999999),.5,.2,.27+i*.45));}}
 else if(t==='farm'||t==='bigfarm'){const r=s*.45;g.add(mesh(new THREE.SphereGeometry(r,18,10,0,6.3,0,1.6),glass,h,.08,h));
  for(let i=0;i<s*4;i++)g.add(mesh(new THREE.ConeGeometry(.08*s,.25*s,6),M(0x3aaa4a),h+(Math.random()-.5)*r*1.2,.2*s,h+(Math.random()-.5)*r*1.2));}
 else if(t==='ice'){g.add(mesh(new THREE.BoxGeometry(.5,.4,.5),M(0x5a8ab0),.5,.28,.5));const d=mesh(new THREE.CylinderGeometry(.05,.05,.9),M(0xaaaaaa),.5,.75,.5);d.name='spin';g.add(d);
  g.add(mesh(new THREE.BoxGeometry(.2,.2,.2),M(0xddeeff),.5,1.15,.5));}
 else if(t==='fuel'||t==='refin'){const k=s;g.add(mesh(new THREE.CylinderGeometry(.18*k,.18*k,.7*k,12),M(0xe8e8e8),.3*k,.43*k,.35*k));
  g.add(mesh(new THREE.CylinderGeometry(.15*k,.15*k,.55*k,12),M(0xff8833),.68*k,.35*k,.4*k));g.add(mesh(new THREE.BoxGeometry(.4*k,.25*k,.25*k),M(0x666666),.5*k,.2*k,.78*k));
  g.add(mesh(new THREE.CylinderGeometry(.04*k,.04*k,.6*k),M(0x444444),.75*k,.6*k,.78*k));}
 else if(t==='reactor'){g.add(mesh(new THREE.CylinderGeometry(.5,.7,1.4,16,1,true),M(0xcccccc),.7,.75,.7));g.add(mesh(new THREE.BoxGeometry(.6,.5,.6),M(0x557755),1.4,.3,1.4));}
 return g;}
function rocket(){const g=new THREE.Group();const st=M(0xd8d8de);st.metalness=.7;st.roughness=.3;
 g.add(mesh(new THREE.CylinderGeometry(.22,.22,1.6,16),st,0,.8,0));g.add(mesh(new THREE.ConeGeometry(.22,.45,16),st,0,1.82,0));
 for(let i=0;i<4;i++){const f=mesh(new THREE.BoxGeometry(.04,.35,.18),st);const a=i*Math.PI/2;f.position.set(Math.cos(a)*.24,.25,Math.sin(a)*.24);f.rotation.y=-a;g.add(f);}
 const fl=new THREE.Mesh(new THREE.ConeGeometry(.16,.7,10),new THREE.MeshBasicMaterial({color:0xffaa33,transparent:true,opacity:.85}));fl.rotation.x=Math.PI;fl.position.y=-.35;fl.name='flame';g.add(fl);return g;}
// ---------- state helpers
let occ=[];const objs=new Map();
function rebuildOcc(){occ=Array.from({length:N},()=>Array(N).fill(null));S.b.forEach(b=>{for(let i=0;i<B[b.t].s;i++)for(let j=0;j<B[b.t].s;j++)occ[b.x+i][b.z+j]=b;});}
function free(t,x,z){const s=B[t].s;if(x<0||z<0||x+s>N||z+s>N)return false;for(let i=0;i<s;i++)for(let j=0;j<s;j++)if(occ[x+i][z+j])return false;return true;}
let uid=1;
function addB(t,x,z,silent){const b={t,x,z,id:uid++,ship:null};S.b.push(b);const o=model(t);o.position.set(x,0,z);scene.add(o);objs.set(b.id,o);
 if(!silent){o.scale.set(1,.01,1);o.userData.grow=0;}if(t==='pad')b.timer=8+Math.random()*6;rebuildOcc();return b;}
function delB(b){S.b=S.b.filter(x=>x!==b);const o=objs.get(b.id);scene.remove(o);objs.delete(b.id);if(b.ship){scene.remove(b.ship.m);}rebuildOcc();}
function clearAll(){objs.forEach(o=>scene.remove(o));objs.clear();S&&S.b.forEach(b=>b.ship&&scene.remove(b.ship.m));dots.forEach(d=>scene.remove(d.m));dots=[];}
function stats(){let pw=0,pu=0,house=0,food=0,wat=0,fuel=0,pads=0;S.b.forEach(b=>{const d=B[b.t];if(d.pw>0)pw+=d.pw;else if(d.pw)pu-=d.pw;house+=d.house||0;if(b.t==='pad')pads++;});
 const eff=pu?Math.min(1,pw/pu):1;S.b.forEach(b=>{const d=B[b.t];food+=(d.food>0?d.food*eff:d.food||0);wat+=(d.wat>0?d.wat*eff:d.wat||0);fuel+=(d.fuel||0)*eff;});
 food-=S.pop*0.12;wat-=S.pop*0.1;return{pw,pu,eff,house,food,wat,fuel,pads};}
// ---------- UI
const $=id=>document.getElementById(id);let sel=null,speed=1;
function toast(m,w){const d=document.createElement('div');d.className='t'+(w?' w':'');d.textContent=m;$('toasts').prepend(d);setTimeout(()=>d.remove(),4000);while($('toasts').children.length>5)$('toasts').lastChild.remove();}
function menu(){const m=$('menu');m.innerHTML='';Object.entries(B).forEach(([k,d])=>{const e=document.createElement('div');const lock=d.unl&&S.pop<d.unl;
 e.className='b'+(sel===k?' sel':'')+(lock?' lock':'');e.innerHTML=`${d.ic} ${d.n}<small>${lock?'🔒 '+d.unl+' pop':(d.c?'¢'+d.c:'')+' '+d.d}</small>`;
 e.onclick=()=>{if(lock){toast(`Unlocks at ${d.unl} colonists`);return;}sel=sel===k?null:k;menu();};m.appendChild(e);});}
let lastLock='';
function hud(st){const f=v=>(v>=0?'+':'')+v.toFixed(1);
 const items=[['💰',Math.floor(S.cr)],['👩‍🚀',`${S.pop}/${st.house}`],['⚡',`${st.pw}/${st.pu}`,st.pw<st.pu],['🍞',`${Math.floor(S.food)} (${f(st.food)})`,S.food<5&&st.food<0],
 ['💧',`${Math.floor(S.wat)} (${f(st.wat)})`,S.wat<5&&st.wat<0],['⛽',Math.floor(S.fuel)],['😊',Math.round(S.hap)+'%',S.hap<40],['📅','Sol '+Math.floor(S.t/30+1)]];
 $('hud').innerHTML=items.map(([i,v,b])=>`<span class="r${b?' bad':''}">${i} ${v}</span>`).join('');
 const l=Object.keys(B).filter(k=>B[k].unl&&S.pop>=B[k].unl).join();if(l!==lastLock){if(lastLock!==''&&l.length>lastLock.length)toast('🔓 New building unlocked!');lastLock=l;menu();}}
// ---------- input
const ray=new THREE.Raycaster(),mv=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
let hover=null;const prev=new THREE.Mesh(new THREE.BoxGeometry(1,.1,1),new THREE.MeshBasicMaterial({color:0x00ff00,transparent:true,opacity:.45}));scene.add(prev);prev.visible=false;
function cell(cx,cy){mv.set(cx/innerWidth*2-1,-cy/innerHeight*2+1);ray.setFromCamera(mv,cam);const p=new THREE.Vector3();if(!ray.ray.intersectPlane(plane,p))return null;return{x:Math.floor(p.x),z:Math.floor(p.z),p};}
function updPrev(){if(!sel||!hover){prev.visible=false;$('info').textContent=sel?'':'Pick a building below. Ships land on pads.';return;}
 const d=B[sel];let x=hover.x,z=hover.z;if(d.s===2){x=Math.round(hover.p.x-1);z=Math.round(hover.p.z-1);}hover.bx=x;hover.bz=z;
 prev.visible=true;prev.scale.set(d.s,1,d.s);prev.position.set(x+d.s/2,.06,z+d.s/2);
 let ok;if(sel==='dozer'){const b=occ[x]?.[z];ok=!!b;prev.scale.set(b?B[b.t].s:1,1,b?B[b.t].s:1);if(b)prev.position.set(b.x+B[b.t].s/2,.06,b.z+B[b.t].s/2);$('info').textContent=b?`Bulldoze ${B[b.t].n} (+¢${Math.floor(B[b.t].c/2)})`:'';}
 else{ok=free(sel,x,z)&&S.cr>=d.c;$('info').textContent=`${d.n} ¢${d.c}${S.cr<d.c?' — not enough credits':''}`;}
 prev.material.color.set(ok?0x33ff55:0xff3333);}
function click(){if(!sel||!hover)return;updPrev();const d=B[sel],x=hover.bx,z=hover.bz;
 if(sel==='dozer'){const b=occ[x]?.[z];if(!b)return;if(b.t==='pad'&&S.b.filter(q=>q.t==='pad').length===1){toast('Keep at least one landing pad!',1);return;}S.cr+=Math.floor(B[b.t].c/2);delB(b);}
 else{if(!free(sel,x,z))return;if(S.cr<d.c){toast('Not enough credits',1);return;}S.cr-=d.c;addB(sel,x,z);}updPrev();}
const ptrs=new Map();let drag=null,moved=0,pinch0=0;
R.domElement.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(e.button===2){sel=null;menu();updPrev();return;}
 drag={x:e.clientX,y:e.clientY};moved=0;if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);}});
addEventListener('pointermove',e=>{if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(ptrs.size===2){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0){zoom=Math.max(5,Math.min(30,zoom*pinch0/d));pinch0=d;camUp();}moved=99;return;}
 if(drag&&ptrs.size===1){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);if(moved>6){pan(-dx,-dy);}drag={x:e.clientX,y:e.clientY};}
 hover=cell(e.clientX,e.clientY);updPrev();});
addEventListener('pointerup',e=>{ptrs.delete(e.pointerId);if(drag&&moved<=6&&e.target===R.domElement){hover=cell(e.clientX,e.clientY);click();}if(ptrs.size===0)drag=null;pinch0=0;});
R.domElement.addEventListener('contextmenu',e=>e.preventDefault());
R.domElement.addEventListener('wheel',e=>{zoom=Math.max(5,Math.min(30,zoom*(e.deltaY>0?1.1:.9)));camUp();e.preventDefault();},{passive:false});
function pan(dx,dy){const k=zoom*2/innerHeight,ang=Math.PI/4+rot;const rx=Math.cos(ang),rz=-Math.sin(ang),fx=-Math.sin(ang),fz=-Math.cos(ang);
 tgt.x+=(dx*rx-dy*fx*1.4)*k;tgt.z+=(dx*rz-dy*fz*1.4)*k;tgt.x=Math.max(0,Math.min(N,tgt.x));tgt.z=Math.max(0,Math.min(N,tgt.z));camUp();}
const keys={};addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=1;if(e.key==='Escape'){sel=null;menu();updPrev();}if(e.key==='q')rotT-=Math.PI/2;if(e.key==='e')rotT+=Math.PI/2;});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);
$('rotL').onclick=()=>rotT-=Math.PI/2;$('rotR').onclick=()=>rotT+=Math.PI/2;
document.querySelectorAll('#ctl [data-s]').forEach(b=>b.onclick=()=>{speed=+b.dataset.s;document.querySelectorAll('#ctl [data-s]').forEach(x=>x.classList.toggle('on',x===b));});
function save(){localStorage.setItem('marsOutpost',JSON.stringify({...S,b:S.b.map(({t,x,z,timer})=>({t,x,z,timer}))}));}
$('save').onclick=()=>{save();toast('💾 Saved');};
$('newg').onclick=()=>{if(confirm('Start a new colony? Unsaved progress is lost.'))start(false);};
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);camUp();});
// ---------- colonist dots
let dots=[];const dotG=new THREE.SphereGeometry(.07,6,4);
function syncDots(){const want=Math.min(60,Math.ceil(S.pop/2));const bs=S.b.filter(b=>b.t!=='pad');
 while(dots.length<want&&bs.length){const m=mesh(dotG,M([0xffffff,0xff7733,0x33aaff][dots.length%3]));const b=bs[Math.random()*bs.length|0];m.position.set(b.x+.5,.12,b.z+.5);scene.add(m);dots.push({m,to:null});}
 while(dots.length>want)scene.remove(dots.pop().m);}
function moveDots(dt){const bs=S.b;dots.forEach(d=>{if(!d.to||d.m.position.distanceTo(d.to)<.1){const b=bs[Math.random()*bs.length|0];if(!b)return;const s=B[b.t].s;d.to=new THREE.Vector3(b.x+Math.random()*s,.12,b.z+(Math.random()<.5?-0.15:s+.15));}
 const v=d.to.clone().sub(d.m.position);const l=v.length();d.m.position.add(v.multiplyScalar(Math.min(1,dt*.8/l)));d.m.position.y=.12+Math.abs(Math.sin(performance.now()/120+d.m.id))*.04;});}
// ---------- ships
function shipTick(b,dt,st){const o=objs.get(b.id);if(!o)return;
 if(!b.ship){b.timer-=dt;if(b.timer<=0){const m=rocket();m.position.set(b.x+1,25,b.z+1);scene.add(m);b.ship={m,ph:'land',t:0};}return;}
 const sh=b.ship,m=sh.m,fl=m.getObjectByName('flame');sh.t+=dt;
 if(sh.ph==='land'){const y=Math.max(.1,25*Math.pow(1-sh.t/5,2));m.position.y=y;fl.visible=true;fl.scale.y=1+Math.random()*.5;
  if(sh.t>=5){m.position.y=.1;fl.visible=false;sh.ph='ground';sh.t=0;
   const room=st.house-S.pop;const want=Math.round((3+Math.random()*4)*(S.hap/100+.3)*(1+S.pop/60));const n=Math.max(0,Math.min(room,want));
   S.pop+=n;S.cr+=n*15;toast(n?`🚀 Ship landed — ${n} colonists arrived!`:room<=0?'🚀 Ship landed but no housing — colonists stayed aboard!':'🚀 Ship landed — nobody wanted to stay 😕',!n);}}
 else if(sh.ph==='ground'){if(sh.t>=4){sh.ph='up';sh.t=0;const buy=Math.min(Math.floor(S.fuel),20+Math.floor(S.pop/3));if(buy>0){S.fuel-=buy;S.cr+=buy*12;toast(`⛽ Sold ${buy} fuel to departing ship: +¢${buy*12}`);}}}
 else{m.position.y=.1+Math.pow(sh.t,2)*1.6;fl.visible=true;fl.scale.y=1.5+Math.random();if(sh.t>4){scene.remove(m);b.ship=null;b.timer=Math.max(14,40-S.pop/4)+Math.random()*10;}}}
// ---------- sim
let warnT=0;
function sim(dt){S.t+=dt;const st=stats();S.food=Math.max(0,S.food+st.food*dt);S.wat=Math.max(0,S.wat+st.wat*dt);S.fuel+=st.fuel*dt;
 let tgtH=85;if(st.house<S.pop)tgtH-=30;if(S.food<=0)tgtH-=40;if(S.wat<=0)tgtH-=40;if(st.pw<st.pu)tgtH-=25;
 S.hap+=(Math.max(0,tgtH)-S.hap)*dt*.08;S.cr+=S.pop*0.25*(S.hap/100)*dt;
 warnT-=dt;if(warnT<=0&&S.pop>0){const w=[];if(S.food<=0)w.push('food');if(S.wat<=0)w.push('water');if(st.pw<st.pu)w.push('power');if(w.length){toast('⚠️ Shortage: '+w.join(', ')+'!',1);warnT=12;}}
 if(S.hap<25&&S.pop>0&&Math.random()<dt*.05){const l=Math.min(S.pop,1+Math.floor(S.pop*.05));S.pop-=l;toast(`😠 ${l} unhappy colonist(s) left on a ship home`,1);}
 S.b.forEach(b=>b.t==='pad'&&shipTick(b,dt,st));return st;}
// ---------- loop
let last=performance.now(),acc=0,saveT=0;
function loop(now){const rdt=Math.min(.1,(now-last)/1000);last=now;
 if(Math.abs(rotT-rot)>.001){rot+=(rotT-rot)*Math.min(1,rdt*8);camUp();}
 const kp=8*zoom/14*rdt*40;if(keys.w||keys.arrowup)pan(0,-kp);if(keys.s||keys.arrowdown)pan(0,kp);if(keys.a||keys.arrowleft)pan(-kp,0);if(keys.d||keys.arrowright)pan(kp,0);
 if(S){const dt=rdt*speed;let st=dt?sim(dt):stats();acc+=rdt;if(acc>.25){hud(st);syncDots();acc=0;}if(dt)moveDots(dt);
  objs.forEach(o=>{if(o.userData.grow!==undefined){o.userData.grow+=rdt*3;o.scale.y=Math.min(1,o.userData.grow);if(o.userData.grow>=1)delete o.userData.grow;}const sp=o.getObjectByName('spin');if(sp&&speed)sp.rotation.y+=rdt*4;});
  saveT+=rdt;if(saveT>20){save();saveT=0;}}
 R.render(scene,cam);requestAnimationFrame(loop);}
function start(load){clearAll();uid=1;const sv=load&&localStorage.getItem('marsOutpost');
 if(sv){const d=JSON.parse(sv);S={...fresh(),...d,b:[]};rebuildOcc();d.b.forEach(b=>{const n=addB(b.t,b.x,b.z,1);if(b.timer)n.timer=b.timer;});toast('Welcome back, Commander');}
 else{S=fresh();rebuildOcc();addB('pad',10,10,1);addB('hab',13,10,1);addB('solar',13,11,1);S.b[0].timer=6;toast('Welcome to Mars! Build farms, ice extractors and power.');toast('First ship arrives soon…');}
 lastLock='';menu();$('title').style.display='none';}
if(localStorage.getItem('marsOutpost'))$('cont').style.display='';
$('play').onclick=()=>start(false);$('cont').onclick=()=>start(true);
camUp();S=null;requestAnimationFrame(loop);window.__start=start;window.__S=()=>S;
