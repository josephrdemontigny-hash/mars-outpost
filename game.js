import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
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
const DIFF={relaxed:{cr:900,dem:.8,n:'Relaxed'},standard:{cr:600,dem:1,n:'Standard'},hard:{cr:400,dem:1.25,n:'Hard'}};
function fresh(diff='standard',name='Olympus Base'){return{cr:DIFF[diff].cr,food:30,wat:30,fuel:0,pop:0,hap:80,t:0,b:[],earned:0,diff,name};}
// ---------- audio
let AC=null,muted=localStorage.getItem('marsMute')==='1';
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC;}
function beep(f=660,d=.06,type='square',v=.05){if(muted)return;const a=ac();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;
 g.gain.setValueAtTime(v,a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+d);}
function rumble(d=4,v=.25){if(muted)return;const a=ac();if(!a)return;const len=a.sampleRate*d,buf=a.createBuffer(1,len,a.sampleRate),ch=buf.getChannelData(0);
 for(let i=0;i<len;i++)ch[i]=(Math.random()*2-1);const src=a.createBufferSource();src.buffer=buf;const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=180;
 const g=a.createGain();g.gain.setValueAtTime(.0001,a.currentTime);g.gain.exponentialRampToValueAtTime(v,a.currentTime+d*.4);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);
 src.connect(f).connect(g).connect(a.destination);src.start();}
const DEMAND=()=>DIFF[S&&S.diff||'standard'].dem;
// ---------- three setup
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;document.body.prepend(R.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xd9a07a);scene.fog=new THREE.Fog(0xd9a07a,60,110);
let zoom=8,rot=0,rotT=0;const tgt=new THREE.Vector3(N/2,0,N/2);
const cam=new THREE.OrthographicCamera(-1,1,1,-1,0.1,300);
function camUp(){const a=innerWidth/innerHeight;cam.left=-zoom*a;cam.right=zoom*a;cam.top=zoom;cam.bottom=-zoom;cam.updateProjectionMatrix();
 const ang=Math.PI/4+rot;cam.position.set(tgt.x+Math.sin(ang)*50,40,tgt.z+Math.cos(ang)*50);cam.lookAt(tgt);}
{const pm=new THREE.PMREMGenerator(R);const env=pm.fromScene(new RoomEnvironment(),.04).texture;scene.userData.env=env;}
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
const SH_H=3.4;
function rocket(){const outer=new THREE.Group(),g=new THREE.Group();outer.add(g);g.position.y=0; // g centered at ship middle
 const st=new THREE.MeshStandardMaterial({color:0xe4e7ec,metalness:.9,roughness:.25,envMap:scene.userData.env,envMapIntensity:1.4});const blk=M(0x1a1a1a);const H=SH_H,r=.32;
 const body=mesh(new THREE.CylinderGeometry(r,r,H*.78,24),st,0,-H*.11,0);g.add(body);
 const pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push(new THREE.Vector2(r*Math.sqrt(1-t*t)*(1-t*.15),t*H*.22));}
 g.add(mesh(new THREE.LatheGeometry(pts,24),st,0,H*.28,0));
 // heat shield tiles: half cylinder on -z side
 g.add(mesh(new THREE.CylinderGeometry(r+.012,r+.012,H*.78,24,1,true,Math.PI/2,Math.PI),blk,0,-H*.11,0));
 const nosT=[];for(let i=0;i<=12;i++){const t=i/12;nosT.push(new THREE.Vector2((r+.012)*Math.sqrt(1-t*t)*(1-t*.15),t*H*.22));}
 g.add(mesh(new THREE.LatheGeometry(nosT,24,Math.PI/2,Math.PI),blk,0,H*.28,0));
 const flap=(w,h,y,side)=>{const f=mesh(new THREE.BoxGeometry(w,h,.05),blk,side*(r+w/2),y,-.12);g.add(f);};
 flap(.22,.42,H*.3,1);flap(.22,.42,H*.3,-1);flap(.36,.75,-H*.38,1);flap(.36,.75,-H*.38,-1);
 const bell=new THREE.CylinderGeometry(.06,.11,.2,10,1,true);const bm=M(0x333333);bm.side=THREE.DoubleSide;
 [[0,0],[.13,0],[-.065,.11],[-.065,-.11],[.2,.15],[.2,-.15]].forEach(([x,z])=>g.add(mesh(bell,bm,x*.9,-H/2-.08,z*.9)));
 for(let i=0;i<3;i++){const a=i*2.09;const l=mesh(new THREE.BoxGeometry(.04,.35,.04),M(0x888888),Math.cos(a)*r*.9,-H/2-.05,Math.sin(a)*r*.9);l.rotation.z=Math.cos(a)*.3;l.rotation.x=-Math.sin(a)*.3;g.add(l);}
 const fl=new THREE.Mesh(new THREE.ConeGeometry(.22,1.1,12),new THREE.MeshBasicMaterial({color:0xffb347,transparent:true,opacity:.8}));fl.rotation.x=Math.PI;fl.position.y=-H/2-.7;fl.name='flame';g.add(fl);
 const fl2=new THREE.Mesh(new THREE.ConeGeometry(.1,.6,10),new THREE.MeshBasicMaterial({color:0xaaddff,transparent:true,opacity:.9}));fl2.rotation.x=Math.PI;fl2.position.y=-H/2-.45;fl2.name='flame2';g.add(fl2);
 outer.userData.g=g;return outer;}
let puffs=[];const puffG=new THREE.SphereGeometry(.3,7,5);
function dust(x,z,n=14){for(let i=0;i<n;i++){const m=new THREE.Mesh(puffG,new THREE.MeshLambertMaterial({color:0xc07a50,transparent:true,opacity:.7}));
 const a=Math.random()*6.28;m.position.set(x,.2,z);m.userData.v=new THREE.Vector3(Math.cos(a)*(1.5+Math.random()*2),.3+Math.random()*.6,Math.sin(a)*(1.5+Math.random()*2));m.userData.life=1.6;scene.add(m);puffs.push(m);}}
function tickPuffs(dt){puffs=puffs.filter(m=>{m.userData.life-=dt;m.position.addScaledVector(m.userData.v,dt);m.userData.v.multiplyScalar(1-dt*1.5);m.scale.setScalar(1+(1.6-m.userData.life)*1.5);
 m.material.opacity=Math.max(0,m.userData.life/1.6*.7);if(m.userData.life<=0){scene.remove(m);m.material.dispose();return false;}return true;});}
// ship pose: y = bottom height, tilt 0 upright .. PI/2 horizontal
function pose(m,y,tilt){const g=m.userData.g;m.rotation.x=-tilt;g.position.y=0;m.position.y=y+SH_H/2*Math.cos(tilt)+0.3*Math.sin(tilt)+.1;}
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
 food-=S.pop*0.12*DEMAND();wat-=S.pop*0.1*DEMAND();return{pw,pu,eff,house,food,wat,fuel,pads};}
// ---------- UI
const $=id=>document.getElementById(id);let sel=null,speed=1;
function toast(m,w){const d=document.createElement('div');d.className='t'+(w?' w':'');d.textContent=m;$('toasts').prepend(d);setTimeout(()=>d.remove(),4000);while($('toasts').children.length>5)$('toasts').lastChild.remove();}
function tip(k,el){const d=B[k],t=$('tip'),f=(v,u)=>v?`<div>${v>0?'+':''}${v} ${u}</div>`:'';
 t.innerHTML=`<b>${d.ic} ${d.n}</b>${d.c?` — ¢${d.c}`:''}${f(d.pw,'⚡ power')}${f(d.food,'🍞 food/s')}${f(d.wat,'💧 water/s')}${f(d.fuel,'⛽ fuel/s')}${d.house?`<div>🏠 houses ${d.house}</div>`:''}<div style="opacity:.8">${k==='pad'?'More pads = more ships':k==='dozer'?'Refunds 50%':d.s===2?'2×2 tiles':'1×1 tile'}${d.unl?` · unlocks at ${d.unl} pop`:''}</div><div style="opacity:.6;font-size:11px">Tip: press & hold a building to move it</div>`;
 const r=el.getBoundingClientRect();t.style.display='block';t.style.left=Math.max(4,Math.min(innerWidth-224,r.left))+'px';t.style.bottom=(innerHeight-r.top+6)+'px';}
function menu(){const m=$('menu');m.innerHTML='';Object.entries(B).forEach(([k,d])=>{const e=document.createElement('div');const lock=d.unl&&S.pop<d.unl;
 e.className='b'+(sel===k?' sel':'')+(lock?' lock':'');e.innerHTML=`${d.ic} ${d.n}<small>${lock?'🔒 '+d.unl+' pop':(d.c?'¢'+d.c:'')+' '+d.d}</small>`;
 e.onpointerenter=()=>tip(k,e);e.onpointerleave=()=>$('tip').style.display='none';
 e.onclick=()=>{beep(700,.04);tip(k,e);if(lock){toast(`Unlocks at ${d.unl} colonists`);return;}sel=sel===k?null:k;menu();};m.appendChild(e);});}
let lastLock='';
function hud(st){const f=v=>(v>=0?'+':'')+v.toFixed(1);
 if(S.demo)return;const items=[['💰',Math.floor(S.cr)],['👩‍🚀',`${S.pop}/${st.house}`],['⚡',`${st.pw}/${st.pu}`,st.pw<st.pu],['🍞',`${Math.floor(S.food)} (${f(st.food)})`,S.food<5&&st.food<0],
 ['💧',`${Math.floor(S.wat)} (${f(st.wat)})`,S.wat<5&&st.wat<0],['⛽',Math.floor(S.fuel)],['😊',Math.round(S.hap)+'%',S.hap<40],['📅','Sol '+Math.floor(S.t/30+1)]];
 $('hud').innerHTML=`<span class="r" style="background:#a8481e">🏴 ${S.name||'Colony'}</span>`+items.map(([i,v,b])=>`<span class="r${b?' bad':''}">${i} ${v}</span>`).join('');
 const l=Object.keys(B).filter(k=>B[k].unl&&S.pop>=B[k].unl).join();if(l!==lastLock){if(lastLock!==''&&l.length>lastLock.length)toast('🔓 New building unlocked!');lastLock=l;menu();}}
// ---------- input
const ray=new THREE.Raycaster(),mv=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
let hover=null;const prev=new THREE.Mesh(new THREE.BoxGeometry(1,.1,1),new THREE.MeshBasicMaterial({color:0x00ff00,transparent:true,opacity:.45}));scene.add(prev);prev.visible=false;
function cell(cx,cy){mv.set(cx/innerWidth*2-1,-cy/innerHeight*2+1);ray.setFromCamera(mv,cam);const p=new THREE.Vector3();if(!ray.ray.intersectPlane(plane,p))return null;return{x:Math.floor(p.x),z:Math.floor(p.z),p};}
function updPrev(){if(moving)return;if(!sel||!hover){prev.visible=false;$('info').textContent=sel?'':'Pick a building below. Ships land on pads.';return;}
 const d=B[sel];let x=hover.x,z=hover.z;if(d.s===2){x=Math.round(hover.p.x-1);z=Math.round(hover.p.z-1);}hover.bx=x;hover.bz=z;
 prev.visible=true;prev.scale.set(d.s,1,d.s);prev.position.set(x+d.s/2,.06,z+d.s/2);
 let ok;if(sel==='dozer'){const b=occ[x]?.[z];ok=!!b;prev.scale.set(b?B[b.t].s:1,1,b?B[b.t].s:1);if(b)prev.position.set(b.x+B[b.t].s/2,.06,b.z+B[b.t].s/2);$('info').textContent=b?`Bulldoze ${B[b.t].n} (+¢${Math.floor(B[b.t].c/2)})`:'';}
 else{ok=free(sel,x,z)&&S.cr>=d.c;$('info').textContent=`${d.n} ¢${d.c}${S.cr<d.c?' — not enough credits':''}`;}
 prev.material.color.set(ok?0x33ff55:0xff3333);}
function click(){if(!sel||!hover)return;updPrev();const d=B[sel],x=hover.bx,z=hover.bz;
 if(sel==='dozer'){const b=occ[x]?.[z];if(!b)return;if(b.t==='pad'&&S.b.filter(q=>q.t==='pad').length===1){toast('Keep at least one landing pad!',1);return;}if(b.ship){toast("Can't bulldoze a pad with a ship on it",1);return;}S.cr+=Math.floor(B[b.t].c/2);delB(b);beep(200,.12,'sawtooth',.05);}
 else{if(!free(sel,x,z))return;if(S.cr<d.c){toast('Not enough credits',1);beep(160,.15,'sawtooth',.04);return;}S.cr-=d.c;addB(sel,x,z);beep(520,.07,'triangle',.07);}updPrev();}
const ptrs=new Map();let drag=null,moved=0,pinch0=0,lp=null,moving=null;
function freeIgnore(b,x,z){const s=B[b.t].s;for(let i=0;i<s;i++)for(let j=0;j<s;j++)occ[b.x+i][b.z+j]=null;const ok=free(b.t,x,z);rebuildOcc();return ok;}
function moveCell(c){const s=B[moving.b.t].s;return s===2?{x:Math.round(c.p.x-1),z:Math.round(c.p.z-1)}:{x:c.x,z:c.z};}
function startMove(b){if(b.t==='pad'&&b.ship){toast("Can't move a pad while a ship is on it",1);return;}moving={b,ok:true,x:b.x,z:b.z};navigator.vibrate&&navigator.vibrate(30);beep(880,.08,'sine',.06);
 const o=objs.get(b.id);o.position.y=.35;prev.visible=true;$('info').textContent=`Moving ${B[b.t].n} — drop on a green spot`;}
function dragMove(c){if(!c)return;const {x,z}=moveCell(c),b=moving.b,s=B[b.t].s;moving.x=x;moving.z=z;moving.ok=freeIgnore(b,x,z);const o=objs.get(b.id);o.position.set(x,.35,z);
 prev.visible=true;prev.scale.set(s,1,s);prev.position.set(x+s/2,.06,z+s/2);prev.material.color.set(moving.ok?0x33ff55:0xff3333);}
function endMove(){const b=moving.b,o=objs.get(b.id);if(moving.ok&&!(b.t==='pad'&&b.ship)){b.x=moving.x;b.z=moving.z;beep(440,.08,'sine',.06);}else{beep(160,.15,'sawtooth',.04);toast('Invalid spot — returned',1);}
 o.position.set(b.x,0,b.z);rebuildOcc();moving=null;prev.visible=false;$('info').textContent='';}
R.domElement.addEventListener('pointerdown',e=>{ac();ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(e.button===2){sel=null;menu();updPrev();return;}
 drag={x:e.clientX,y:e.clientY};moved=0;clearTimeout(lp);
 if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);return;}
 const c=cell(e.clientX,e.clientY);const b=c&&occ[c.x]?.[c.z];if(b&&sel!=='dozer'&&S&&!S.demo)lp=setTimeout(()=>{if(moved<=8&&ptrs.size===1)startMove(b);},450);});
addEventListener('pointermove',e=>{if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(moving){dragMove(cell(e.clientX,e.clientY));return;}
 if(ptrs.size===2){clearTimeout(lp);const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0){zoom=Math.max(4,Math.min(30,zoom*pinch0/d));pinch0=d;camUp();}moved=99;return;}
 if(drag&&ptrs.size===1){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);if(moved>8){clearTimeout(lp);pan(-dx,-dy);}drag={x:e.clientX,y:e.clientY};}
 hover=cell(e.clientX,e.clientY);updPrev();});
addEventListener('pointerup',e=>{ptrs.delete(e.pointerId);clearTimeout(lp);if(moving){endMove();drag=null;return;}
 if(drag&&moved<=8&&e.target===R.domElement){hover=cell(e.clientX,e.clientY);click();}if(ptrs.size===0)drag=null;pinch0=0;});
addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);clearTimeout(lp);if(moving)endMove();drag=null;});
R.domElement.addEventListener('contextmenu',e=>e.preventDefault());
R.domElement.addEventListener('wheel',e=>{zoom=Math.max(5,Math.min(30,zoom*(e.deltaY>0?1.1:.9)));camUp();e.preventDefault();},{passive:false});
function pan(dx,dy){const k=zoom*2/innerHeight,ang=Math.PI/4+rot;const rx=Math.cos(ang),rz=-Math.sin(ang),fx=-Math.sin(ang),fz=-Math.cos(ang);
 tgt.x+=(dx*rx-dy*fx*1.4)*k;tgt.z+=(dx*rz-dy*fz*1.4)*k;tgt.x=Math.max(0,Math.min(N,tgt.x));tgt.z=Math.max(0,Math.min(N,tgt.z));camUp();}
const keys={};addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=1;if(e.key==='Escape'){sel=null;menu();updPrev();}if(S&&S.demo)return;if(e.key==='q')rotT-=Math.PI/2;if(e.key==='e')rotT+=Math.PI/2;});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);
$('rotL').onclick=()=>rotT-=Math.PI/2;$('rotR').onclick=()=>rotT+=Math.PI/2;
document.querySelectorAll('#ctl [data-s]').forEach(b=>b.onclick=()=>{speed=+b.dataset.s;document.querySelectorAll('#ctl [data-s]').forEach(x=>x.classList.toggle('on',x===b));});
function save(){if(!S||S.demo)return;localStorage.setItem('marsOutpost',JSON.stringify({...S,b:S.b.map(({t,x,z,timer})=>({t,x,z,timer}))}));}
$('save').onclick=()=>{save();toast('💾 Saved');};
$('newg').onclick=()=>{save();showTitle();};
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);camUp();});
// ---------- astronauts (shared geometry/materials)
let dots=[];const AG={body:new THREE.BoxGeometry(.11,.13,.07),helm:new THREE.SphereGeometry(.065,10,8),visor:new THREE.SphereGeometry(.05,10,6,-.9,1.8,.9,1.1),
 pack:new THREE.BoxGeometry(.09,.11,.05),limb:new THREE.BoxGeometry(.035,.1,.035)};AG.limb.translate(0,-.05,0);
const AM={suit:new THREE.MeshStandardMaterial({color:0xf2f2f2,roughness:.6}),visor:new THREE.MeshStandardMaterial({color:0xd4a017,metalness:1,roughness:.12}),
 pack:new THREE.MeshStandardMaterial({color:0xbfc4c9,roughness:.5}),boot:new THREE.MeshStandardMaterial({color:0x555555})};
const ACC=[0xff7733,0x33aaff,0x55cc55,0xffcc33].map(c=>new THREE.MeshStandardMaterial({color:c}));
function astro(i){const g=new THREE.Group();const p=(geo,mat,x,y,z,sh)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(sh)m.castShadow=true;g.add(m);return m;};
 p(AG.body,AM.suit,0,.2,0,1);p(AG.helm,AM.suit,0,.32,0,1);const v=p(AG.visor,AM.visor,0,.322,.018);p(AG.pack,AM.pack,0,.21,-.055);
 p(new THREE.BoxGeometry(.112,.02,.072),ACC[i%4],0,.24,0);
 const ll=p(AG.limb,AM.boot,-.03,.135,0),lr=p(AG.limb,AM.boot,.03,.135,0),al=p(AG.limb,AM.suit,-.075,.255,0),ar=p(AG.limb,AM.suit,.075,.255,0);
 g.userData={ll,lr,al,ar,ph:Math.random()*6};return g;}
function syncDots(){const want=Math.min(60,Math.ceil(S.pop/2));const bs=S.b.filter(b=>b.t!=='pad');
 while(dots.length<want&&bs.length){const m=astro(dots.length);m.scale.setScalar(1.3);const b=bs[Math.random()*bs.length|0];m.position.set(b.x+.5,0,b.z+1.1);scene.add(m);dots.push({m,to:null});}
 while(dots.length>want)scene.remove(dots.pop().m);}
function moveDots(dt){const bs=S.b;dots.forEach(d=>{const u=d.m.userData;if(!d.to||d.m.position.distanceTo(d.to)<.1){if(d.wait>0){d.wait-=dt;limbs(u,0);return;}const b=bs[Math.random()*bs.length|0];if(!b)return;const s=B[b.t].s;
  d.to=new THREE.Vector3(b.x+Math.random()*s,0,b.z+(Math.random()<.5?-0.2:s+.2));d.wait=Math.random()*2;}
 const v=d.to.clone().sub(d.m.position);const l=v.length();if(l<.1)return;d.m.rotation.y=Math.atan2(v.x,v.z);d.m.position.add(v.multiplyScalar(Math.min(1,dt*.6/l)));
 u.ph+=dt*9;limbs(u,1);d.m.position.y=Math.abs(Math.sin(u.ph))*.02;});}
function limbs(u,w){const a=Math.sin(u.ph)*.6*w;u.ll.rotation.x=a;u.lr.rotation.x=-a;u.al.rotation.x=-a;u.ar.rotation.x=a;}
// ---------- ships
function shipTick(b,dt,st){const o=objs.get(b.id);if(!o)return;
 if(!b.ship){b.timer-=dt;if(b.timer<=0){const m=rocket();m.position.set(b.x+1,30,b.z+1);m.rotation.order="YXZ";m.rotation.y=Math.PI/4+rot+(Math.random()-.5)*.6;scene.add(m);b.ship={m,ph:'land',t:0};if(!S.demo)rumble(6,.2);}return;}
 const sh=b.ship,m=sh.m,fl=m.getObjectByName('flame'),fl2=m.getObjectByName('flame2');sh.t+=dt;m.position.x=b.x+1;m.position.z=b.z+1;
 const fv=v=>{fl.visible=fl2.visible=v;fl.scale.y=1+Math.random()*.5;fl2.scale.y=1+Math.random()*.3;};
 if(sh.ph==='land'){const T=6,k=Math.min(1,sh.t/T);const y=30*Math.pow(1-k,1.6);
  // belly flop: horizontal until k>.68, flip upright by k=.85
  const fk=Math.min(1,Math.max(0,(k-.68)/.17));const tilt=Math.PI/2*(1-fk*fk*(3-2*fk))+(fk<1?Math.sin(sh.t*3)*.05:0);
  pose(m,y,tilt);fv(k>.66);if(k>.85&&!sh.dusted&&y<3){sh.dusted=1;dust(b.x+1,b.z+1);}
  if(sh.t>=T){pose(m,0,0);fv(false);sh.ph='ground';sh.t=0;
   const room=st.house-S.pop;const want=Math.round((3+Math.random()*4)*(S.hap/100+.3)*(1+S.pop/60));const n=Math.max(0,Math.min(room,want));
   S.pop+=n;S.cr+=n*15;if(!S.demo)toast(n?`🚀 Ship landed — ${n} colonists arrived!`:room<=0?'🚀 Ship landed but no housing — colonists stayed aboard!':'🚀 Ship landed — nobody wanted to stay 😕',!n);}}
 else if(sh.ph==='ground'){if(sh.t>=4){sh.ph='up';sh.t=0;const buy=Math.min(Math.floor(S.fuel),20+Math.floor(S.pop/3));if(buy>0&&!S.demo){S.fuel-=buy;S.cr+=buy*12;toast(`⛽ Sold ${buy} fuel to departing ship: +¢${buy*12}`);}}}
 else{if(!sh.lift){sh.lift=1;dust(b.x+1,b.z+1,10);if(!S.demo)rumble(3,.25);}pose(m,Math.pow(sh.t,2)*1.6,0);fv(true);fl.scale.y=1.5+Math.random();if(sh.t>4){scene.remove(m);b.ship=null;b.timer=Math.max(14,40-S.pop/4)+Math.random()*10;}}}
// ---------- sim
let warnT=0;
function sim(dt){S.t+=dt;const st=stats();S.food=Math.max(0,S.food+st.food*dt);S.wat=Math.max(0,S.wat+st.wat*dt);S.fuel+=st.fuel*dt;
 let tgtH=85;if(st.house<S.pop)tgtH-=30;if(S.food<=0)tgtH-=40;if(S.wat<=0)tgtH-=40;if(st.pw<st.pu)tgtH-=25;
 S.hap+=(Math.max(0,tgtH)-S.hap)*dt*.08;S.cr+=S.pop*0.25*(S.hap/100)*dt;
 warnT-=dt;if(!S.demo&&warnT<=0&&S.pop>0){const w=[];if(S.food<=0)w.push('food');if(S.wat<=0)w.push('water');if(st.pw<st.pu)w.push('power');if(w.length){toast('⚠️ Shortage: '+w.join(', ')+'!',1);warnT=12;}}
 if(!S.demo&&S.hap<25&&S.pop>0&&Math.random()<dt*.05){const l=Math.min(S.pop,1+Math.floor(S.pop*.05));S.pop-=l;toast(`😠 ${l} unhappy colonist(s) left on a ship home`,1);}
 S.b.forEach(b=>b.t==='pad'&&shipTick(b,dt,st));return st;}
// ---------- loop
let last=performance.now(),acc=0,saveT=0;
function loop(now){const rdt=Math.min(.1,(now-last)/1000);last=now;
 if(Math.abs(rotT-rot)>.001){rot+=(rotT-rot)*Math.min(1,rdt*8);camUp();}
 if(!S||S.demo)keys.w=keys.a=keys.s=keys.d=0;const kp=8*zoom/14*rdt*40;if(keys.w||keys.arrowup)pan(0,-kp);if(keys.s||keys.arrowdown)pan(0,kp);if(keys.a||keys.arrowleft)pan(-kp,0);if(keys.d||keys.arrowright)pan(kp,0);
 if(S&&S.demo){rot+=rdt*.08;rotT=rot;camUp();}tickPuffs(rdt*(S&&!S.demo?speed||0:1));
 if(S){const dt=rdt*(S.demo?1:speed);let st=dt?sim(dt):stats();if(S.demo){S.food=S.wat=50;S.hap=90;}acc+=rdt;if(acc>.25){hud(st);syncDots();acc=0;}if(dt)moveDots(dt);
  objs.forEach(o=>{if(o.userData.grow!==undefined){o.userData.grow+=rdt*3;o.scale.y=Math.min(1,o.userData.grow);if(o.userData.grow>=1)delete o.userData.grow;}const sp=o.getObjectByName('spin');if(sp&&speed)sp.rotation.y+=rdt*4;});
  saveT+=rdt;if(saveT>20&&!S.demo){save();saveT=0;}}
 R.render(scene,cam);requestAnimationFrame(loop);}
function demo(){clearAll();S=fresh();S.demo=1;S.pop=24;rebuildOcc();
 [['pad',10,10],['pad',14,14],['hab',13,10],['hab',13,11],['mega',8,13],['solar',9,9],['solar',10,9],['solar',11,9],['farm',13,12],['bigfarm',15,10],['ice',12,13],['fuel',11,13],['refin',16,12]].forEach(a=>addB(...a,1));
 S.b.filter(b=>b.t==='pad').forEach((b,i)=>b.timer=1+i*5);}
function start(load){clearAll();uid=1;const sv=load&&localStorage.getItem('marsOutpost');
 if(sv){const d=JSON.parse(sv);S={...fresh(),...d,b:[],demo:0};rebuildOcc();d.b.forEach(b=>{const n=addB(b.t,b.x,b.z,1);if(b.timer)n.timer=b.timer;});toast(`Welcome back to ${S.name}, Commander`);}
 else{S=fresh(selDiff,($('cname').value||'').trim().slice(0,24)||'Olympus Base');rebuildOcc();addB('pad',10,10,1);addB('hab',13,10,1);addB('solar',13,11,1);S.b[0].timer=6;toast('Welcome to Mars! Build farms, ice extractors and power.');toast('First ship arrives soon…');}
 lastLock='';menu();$('title').style.display='none';$('ui').style.display='';rot=rotT=0;tgt.set(N/2,0,N/2);zoom=8;camUp();beep(600,.1,'triangle',.07);}
const NAMES=['Olympus Base','Red Rock Station','Valles Hub','Dusty Acres','Phobos View','Jezero Junction','Rusty Ridge','Crater Cove','Tharsis Town','Ares Landing','Hellas Haven','Elon Gulch'];
let selDiff='standard';
function showTitle(){$('ui').style.display='none';$('title').style.display='flex';$('cname').value=NAMES[Math.random()*NAMES.length|0];
 const sv=localStorage.getItem('marsOutpost');if(sv){const d=JSON.parse(sv);$('cont').style.display='';$('cont').innerHTML=`Continue: <b>${d.name||'Colony'}</b><small>Sol ${Math.floor(d.t/30+1)} · ${d.pop} colonists · ${DIFF[d.diff||'standard'].n}</small>`;}else $('cont').style.display='none';
 demo();zoom=7;tgt.set(14,0,12);}
document.querySelectorAll('#diff button').forEach(b=>b.onclick=()=>{selDiff=b.dataset.d;beep(700,.04);document.querySelectorAll('#diff button').forEach(x=>x.classList.toggle('on',x===b));});
$('reroll').onclick=()=>{$('cname').value=NAMES[Math.random()*NAMES.length|0];beep(800,.04);};
const muteUI=()=>{$('mute').textContent=$('mute2').textContent=muted?'🔇':'🔊';};
$('mute').onclick=$('mute2').onclick=()=>{muted=!muted;localStorage.setItem('marsMute',muted?'1':'0');muteUI();beep(700,.05);};muteUI();
$('howb').onclick=()=>{$('how').style.display=$('how').style.display==='block'?'none':'block';beep(700,.04);};
$('play').onclick=()=>start(false);$('cont').onclick=()=>start(true);
camUp();showTitle();requestAnimationFrame(loop);window.__start=start;window.__S=()=>S;window.__objs=objs;window.__cam=cam;window.__THREE=THREE;
