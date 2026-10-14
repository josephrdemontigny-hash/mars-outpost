import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const N=96,OFF=24,DAY=120,LV=[1,1.8,2.6,3.4,4.2],LVUNL=[0,0,20,40,70];
// ===== TUNING (easy to tweak) =====
const TUNE={CONS_WAIT:15,
 SHIP_EVERY_SOL:1.5,   // average Sols between supply ships per landing pad (1 Sol = DAY seconds at 1x)
 PAD_LVL_BONUS:.3,     // each pad level above 1 makes ships this much more frequent
 FIRST_SHIP_AFTER:35,  // seconds after the first pad is built until the first supply ship
 PAD_STAY:90,          // seconds a supply ship waits on the pad for you to refuel/load it before leaving empty
 SHIP_MAT:60,          // building materials every supply ship brings
 SHIP_CREW:[2,5],      // crew per supply ship (min,max) — more with happiness & colony size
 RETURN_FUEL:120,      // fuel needed for a return flight to Earth
 RETURN_PAY:350,       // base payment for a completed return flight
 FLIGHT_TIME:45,       // seconds until a returning ship reaches Earth and cargo is sold
 HOLD_MAX:200,         // cargo hold size (units)
 ORDER_QTY:100,ORDER_PRICE:3, // material shipment you can order: qty, ¢ per unit
 TRUCK_LOAD:20,        // ore per Cybertruck trip
 DAY_SPLIT:.75,        // fraction of each Sol that is daylight
 START_CREW:6,START_SHIPS:5
};
const PRICE={mat:6,ore:2,rare:30}; // Earth base prices (¢ per unit), market multiplier drifts each Sol
const B={
 pad:{n:'Landing Pad',c:300,m:150,s:2,ic:'🛬',cat:'b',jobs:2,d:'Supply ships land here'},
 hab:{n:'Habitat',c:120,m:40,s:1,ic:'🏠',cat:'b',house:6,pw:-1,d:'Houses 6'},
 solar:{n:'Solar Array',c:80,m:25,s:1,ic:'☀️',cat:'b',pw:5,d:'+5 power (day)'},
 battery:{n:'Battery Farm',c:150,m:50,s:1,ic:'🔋',cat:'b',bat:60,d:'Stores power for night'},
 farm:{n:'Farm Dome',c:150,m:40,s:1,ic:'🌱',cat:'b',food:1.2,pw:-1,wat:-.3,jobs:3,d:'+food'},
 ice:{n:'Ice Extractor',c:100,m:35,s:1,ic:'🧊',cat:'b',wat:2,pw:-2,jobs:2,d:'+water'},
 wtank:{n:'Water Tank',c:90,m:30,s:1,ic:'💧',cat:'b',wcap:250,d:'+250 water storage'},
 recyc:{n:'Water Recycler',c:140,m:45,s:1,ic:'🚰',cat:'b',wat:1.5,pw:-1,jobs:1,d:'+water, recycles'},
 mine:{n:'Regolith Mine',c:160,m:30,s:1,ic:'⛏️',cat:'b',ore:.6,pw:-2,jobs:2,d:'Digs ore (trucks haul it)'},
 proc:{n:'Material Processor',c:300,m:60,s:2,ic:'🏗️',cat:'b',conv:.8,pw:-3,jobs:3,d:'Ore → building materials'},
 fuel:{n:'Fuel Plant',c:250,m:70,s:1,ic:'⛽',cat:'b',fuel:.8,pw:-3,wat:-.6,jobs:3,d:'Methane/LOX (water+power)'},
 waste:{n:'Waste Management',c:350,m:90,s:1,ic:'♻️',cat:'b',waste:30,pw:-2,jobs:2,unl:15,d:'Keeps 30 clean'},
 med:{n:'Medical Bay',c:400,m:100,s:1,ic:'🩺',cat:'b',med:30,pw:-2,jobs:3,unl:20,d:'Health for 30'},
 bigfarm:{n:'Biome Farm',c:600,m:160,s:2,ic:'🌳',cat:'b',food:6,pw:-3,wat:-1.2,jobs:8,unl:30,d:'Big food'},
 ent:{n:'Entertainment Hub',c:700,m:180,s:2,ic:'🎭',cat:'b',ent:25,pw:-3,jobs:4,unl:30,d:'Fun for 25'},
 reactor:{n:'Fission Plant',c:1200,m:300,s:2,ic:'⚛️',cat:'b',pw:30,jobs:6,unl:40,d:'+30 power'},
 refin:{n:'Fuel Refinery',c:900,m:240,s:2,ic:'🏭',cat:'b',fuel:4,pw:-8,wat:-2.5,jobs:8,unl:50,d:'Lots of fuel'},
 mega:{n:'Mega Habitat',c:1000,m:260,s:2,ic:'🏙️',cat:'b',house:40,pw:-4,unl:60,d:'Houses 40'},
 sec:{n:'Security Outpost',c:900,m:220,s:2,ic:'🛡️',cat:'b',sec:40,pw:-3,jobs:5,unl:60,d:'Safety for 40'},
 ship:{n:'Starship',c:0,m:0,s:2,ic:'🚀',cat:'z',pw:3,d:'Landed Starship'},
 path:{n:'Footpath',c:0,m:0,ic:'🚶',cat:'p',d:'Free — drag to paint'},
 bench:{n:'Bench',c:8,m:2,s:1,ic:'🪑',cat:'d',d:'Rest stop'},
 planter:{n:'Planter',c:12,m:3,s:1,ic:'🪴',cat:'d',d:'A bit of green'},
 flag:{n:'Flag',c:15,m:2,s:1,ic:'🚩',cat:'d',d:'Colony pride'},
 sign:{n:'Signpost',c:6,m:1,s:1,ic:'🪧',cat:'d',d:'This way →'},
 dozer:{n:'Bulldoze',c:0,ic:'🚜',cat:'x',d:'Tap/drag · 50% refund'}
};
for(const k in B){B[k].s=B[k].s||1;B[k].m=B[k].m||0;if(B[k].cat==='b')B[k].up=1;}
let S;
const DIFF={relaxed:{cr:1900,mat:380,dem:.8,n:'Relaxed'},standard:{cr:1500,mat:320,dem:1,n:'Standard'},hard:{cr:1100,mat:280,dem:1.25,n:'Hard'}};
function fresh(diff='standard',name='Olympus Base'){return{v:4,cr:DIFF[diff].cr,mat:DIFF[diff].mat,ore:0,rare:0,bat:0,food:120,wat:80,fuel:0,hap:80,t:0,diff,name,tiles:{},cols:[],warned:{},b:[],
 mkt:{mat:1,ore:1,rare:1},mktPrev:{mat:1,ore:1,rare:1},order:0,flights:[],tut:null,lastSol:0};}
const FIRST=['Ava','Leo','Maya','Kai','Zara','Omar','Lena','Theo','Nia','Ravi','Iris','Jonas','Sofia','Mateo','Yuki','Amara','Felix','Priya','Hugo','Elena','Dev','Ingrid','Tariq','Lucia','Arjun','Freya','Malik','Chloe','Kenji','Noor','Elias','Hana','Diego','Mila','Sven','Aisha','Bruno','Tessa','Rohan','Juno'];
const LAST=['Okafor','Nakamura','Silva','Novak','Haddad','Larsen','Chen','Reyes','Kowalski','Patel','Moreau','Ivanova','Mensah','Fischer','Tanaka','Duarte','Bjork','Rahman','Costa','Lindqvist','Abara','Kim','Volkov','Murphy','Santos','Oyelaran','Weiss','Quinn','Aldana','Petrov','Hart','Sato','Nkemelu','Ruiz','Varga','Steele','Ito','Mbeki','Laurent','Gale'];
const rname=()=>FIRST[Math.random()*FIRST.length|0]+' '+LAST[Math.random()*LAST.length|0];
// ---------- audio
let AC=null,muted=localStorage.getItem('marsMute')==='1';
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC;}
function beep(f=660,d=.06,type='square',v=.05){if(muted)return;const a=ac();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;
 g.gain.setValueAtTime(v,a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+d);}
function rumble(d=4,v=.25){if(muted)return;const a=ac();if(!a)return;const len=a.sampleRate*d,buf=a.createBuffer(1,len,a.sampleRate),ch=buf.getChannelData(0);
 for(let i=0;i<len;i++)ch[i]=(Math.random()*2-1);const src=a.createBufferSource();src.buffer=buf;const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=180;
 const g=a.createGain();g.gain.setValueAtTime(.0001,a.currentTime);g.gain.exponentialRampToValueAtTime(v,a.currentTime+d*.4);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);
 src.connect(f).connect(g).connect(a.destination);src.start();}
// ---------- three setup
const R=new THREE.WebGLRenderer({antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setSize(innerWidth,innerHeight);
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;document.body.prepend(R.domElement);
const scene=new THREE.Scene();const SKY_D=new THREE.Color(0xd9a07a),SKY_N=new THREE.Color(0x3a2c52),SKY_DUSK=new THREE.Color(0x8a5a6a);
scene.background=SKY_D.clone();scene.fog=new THREE.Fog(0xd9a07a,70,190);
const ENV=(()=>{const pm=new THREE.PMREMGenerator(R);return pm.fromScene(new RoomEnvironment(),.04).texture;})();
let zoom=9,rot=0,rotT=0;const tgt=new THREE.Vector3(N/2,0,N/2);
const cam=new THREE.OrthographicCamera(-1,1,1,-1,0.1,400);
function camUp(){const a=innerWidth/innerHeight;cam.left=-zoom*a;cam.right=zoom*a;cam.top=zoom;cam.bottom=-zoom;cam.updateProjectionMatrix();
 const ang=Math.PI/4+rot;cam.position.set(tgt.x+Math.sin(ang)*80,64,tgt.z+Math.cos(ang)*80);cam.lookAt(tgt);}
const hemi=new THREE.HemisphereLight(0xffe0c0,0x8a3a1a,.9);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0dd,1.6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0006;sun.shadow.normalBias=.02;scene.add(sun,sun.target);
// ---------- terrain
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const CR=[];
function hgt(x,z){const d=Math.max(Math.abs(x-N/2),Math.abs(z-N/2));return d>N/2+1?(Math.sin(x*.3)*Math.cos(z*.25)+1)*Math.min(8,d-N/2)*.25-.01:0;}
const blocked=Array.from({length:N},()=>Array(N).fill(false));
{const tg=new THREE.PlaneGeometry(N+60,N+60,120,120);tg.rotateX(-Math.PI/2);tg.translate(N/2,0,N/2);const p=tg.attributes.position,cols=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,hgt(x,z)-.01);const k=0.85+Math.random()*.15;cols.push(0.72*k,0.33*k,0.18*k);}
 tg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));tg.computeVertexNormals();
 const ground=new THREE.Mesh(tg,new THREE.MeshLambertMaterial({vertexColors:true}));ground.receiveShadow=true;scene.add(ground);}
const grid=new THREE.GridHelper(N,N,0x7a2f12,0x7a2f12);grid.position.set(N/2,0.01,N/2);grid.material.opacity=.25;grid.material.transparent=true;scene.add(grid);
{const rg=new THREE.DodecahedronGeometry(1,0),rm=new THREE.MeshLambertMaterial({color:0x6a2a14}),im=new THREE.InstancedMesh(rg,rm,120),d=new THREE.Object3D();im.castShadow=true;
 for(let i=0;i<120;i++){const a=Math.random()*6.28,dd=N/2+2+Math.random()*16,x=N/2+Math.cos(a)*dd,z=N/2+Math.sin(a)*dd;d.position.set(x,hgt(x,z)+.1,z);d.scale.setScalar(.15+Math.random()*.4);d.updateMatrix();im.setMatrixAt(i,d.matrix);}scene.add(im);}
const gridLines={visible:false};
// (unused)
// ---------- materials & models
const M=(c,r=.7,m=.05,e={})=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,envMapIntensity:.45,...e});
const MAT={white:M(0xeeeae4,.5,.05),steel:M(0xc8ccd2,.3,.5),dark:M(0x3a3a3e,.6,.3),orange:M(0xe0782e,.55,.1),green:M(0x3fae4d,.8),leaf:M(0x2f8a3c,.85),
 trunk:M(0x6b4a2e,.9),concrete:M(0x8c857e,.9),panel:M(0x1b2c6e,.25,.6,{envMapIntensity:1.2}),blue:M(0x4a6fa5,.5,.2),red:M(0xd23a2a,.6),yellow:M(0xf2c230,.6),gold:M(0xd4a017,.25,.9),soil:M(0x5a3a22,1)};
const glass=new THREE.MeshStandardMaterial({color:0xaee8ff,transparent:true,opacity:.55,roughness:.1});
const winMat=M(0x334455,.3,.2,{emissive:0xffc070,emissiveIntensity:0});
const lampMat=new THREE.MeshStandardMaterial({color:0xfff2cc,emissive:0xffd88a,emissiveIntensity:.2});
const neon=[0xff3fa4,0x3fd0ff,0xa4ff3f].map(c=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:1.2}));
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,220,150,1)');g.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);})();
const glowMat=new THREE.SpriteMaterial({map:glowTex,blending:THREE.AdditiveBlending,transparent:true,opacity:0,depthWrite:false});
const poolMat=new THREE.MeshBasicMaterial({map:glowTex,blending:THREE.AdditiveBlending,transparent:true,opacity:0,depthWrite:false});
const warnTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#ffcc00';x.beginPath();x.moveTo(32,4);x.lineTo(60,58);x.lineTo(4,58);x.closePath();x.fill();x.fillStyle='#000';x.font='bold 40px sans-serif';x.textAlign='center';x.fillText('!',32,54);return new THREE.CanvasTexture(c);})();
const warnMat=new THREE.SpriteMaterial({map:warnTex,depthTest:false});
function mesh(g,m,x=0,y=0,z=0,cs=true){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=cs;o.receiveShadow=true;return o;}
const dome=(r,seg=20)=>new THREE.SphereGeometry(r,seg,Math.max(8,seg/2),0,Math.PI*2,0,Math.PI/2);
const cyl=(rt,rb,h,s=18)=>new THREE.CylinderGeometry(rt,rb,h,s);
const rbox=(w,h,d,r=.03)=>new RoundedBoxGeometry(w,h,d,2,r);
const torus=(r,t,s=24)=>{const g=new THREE.TorusGeometry(r,t,8,s);g.rotateX(Math.PI/2);return g;};
function plants(g,cx,cz,r,n,h=.12){for(let i=0;i<n;i++){const a=Math.random()*6.28,d=Math.sqrt(Math.random())*r;const x=cx+Math.cos(a)*d,z=cz+Math.sin(a)*d;
 if(Math.random()<.5)g.add(mesh(new THREE.ConeGeometry(h*.4,h,6),MAT.leaf,x,h/2+.02,z,false));else g.add(mesh(new THREE.SphereGeometry(h*.35,6,5),MAT.green,x,h*.35,z,false));}}
function habDome(g,x,z,r){g.add(mesh(dome(r),MAT.white,x,0,z));g.add(mesh(torus(r*.99,.018),MAT.dark,x,r*.32,z,false));g.add(mesh(torus(r*.97,.022),winMat,x,r*.12,z,false));
 g.add(mesh(torus(r*1.01,.03),MAT.concrete,x,.01,z,false));}
function modelNew(t,lvl=1){const g=new THREE.Group(),s=B[t].s,h=s/2,L=lvl;
 if(t==='pad'){g.add(mesh(cyl(.95,1,.1,32),MAT.concrete,1,.03,1));g.add(mesh(torus(.62,.03,32),MAT.yellow,1,.09,1,false));g.add(mesh(cyl(.5,.5,.005,32),M(0x6a6560,.95),1,.085,1,false));
  for(let i=0;i<6;i++){const a=i/6*6.28;g.add(mesh(new THREE.SphereGeometry(.035,8,6),lampMat,1+Math.cos(a)*.88,.1,1+Math.sin(a)*.88,false));}}
 else if(t==='hab'){habDome(g,.5,.5,.33);if(L>=2){habDome(g,.22,.2,.2);g.add(mesh(new THREE.CylinderGeometry(.05,.05,.3,10).rotateZ(Math.PI/2).rotateY(-.8),MAT.white,.36,.06,.34));}
  if(L>=3){habDome(g,.78,.22,.18);g.add(mesh(cyl(.01,.01,.35,6),MAT.dark,.5,.45,.5,false));g.add(mesh(new THREE.SphereGeometry(.03,8,6),MAT.red,.5,.63,.5,false));}}
 else if(t==='mega'){const tw=[[.55,.6],[1.4,.6],[1,1.4]];tw.forEach(([x,z],i)=>{const H=(1.1+i*.4)*(1+.3*(L-1));g.add(mesh(cyl(.3,.36,H,20),MAT.white,x,H/2,z));
   for(let k=1;k<H/.22;k++)g.add(mesh(torus(.305+.06*(1-k*.22/H),.012,20),winMat,x,k*.22,z,false));g.add(mesh(dome(.3),glass,x,H,z,false));});
  g.add(mesh(new THREE.CylinderGeometry(.05,.05,.9,8).rotateZ(Math.PI/2),glass,.97,.7,.6,false));g.add(mesh(torus(.95,.03,32),MAT.concrete,1,.01,1,false));}
 else if(t==='solar'){const rows=1+L;for(let i=0;i<rows;i++){const z=.5+(i-(rows-1)/2)*(.8/rows);const p=mesh(rbox(.8,.025,.8/rows*.85,.01),MAT.panel,.5,.32,z);p.rotation.x=-.45;g.add(p);
  g.add(mesh(cyl(.018,.025,.3,8),MAT.steel,.5,.15,z));}}
 else if(t==='farm'||t==='bigfarm'){const r=(s===2?.88:.4)*(L>=2?1.06:1);g.add(mesh(cyl(r,r,.02,28),MAT.soil,h,.01,h,false));plants(g,h,h,r*.85,s===2?40+L*12:9+L*4,s===2?.22:.12);
  if(s===2){for(let i=0;i<4+L*2;i++){const a=Math.random()*6.28,d=Math.random()*r*.6,x=h+Math.cos(a)*d,z=h+Math.sin(a)*d;g.add(mesh(cyl(.02,.03,.3,6),MAT.trunk,x,.15,z));g.add(mesh(new THREE.IcosahedronGeometry(.13,0),MAT.leaf,x,.36,z));}}
  g.add(mesh(dome(r,28),glass,h,0,h,false));g.add(mesh(torus(r,.03,32),MAT.steel,h,.02,h,false));if(L>=3)g.add(mesh(torus(r*.72,.012,32),MAT.steel,h,r*.7,h,false));}
 else if(t==='ice'){g.add(mesh(cyl(.24,.27,.22,18),MAT.blue,.5,.11,.5));for(let i=0;i<3;i++){const a=i*2.09,l=mesh(cyl(.015,.015,.95,6),MAT.steel,.5+Math.cos(a)*.13,.5,.5+Math.sin(a)*.13);l.rotation.set(Math.sin(a)*.25,0,-Math.cos(a)*.25);g.add(l);}
  const d=mesh(cyl(.035,.035,.8+.2*L,8),MAT.dark,.5,.5,.5);d.name='spin';g.add(d);g.add(mesh(new THREE.SphereGeometry(.07,10,8),MAT.white,.5,.95+.1*L,.5));
  for(let i=0;i<L;i++)g.add(mesh(new THREE.SphereGeometry(.11,14,10),MAT.white,.18+i*.0,.11,.18+i*.3));}
 else if(t==='fuel'||t==='refin'){const k=s;const n=s===2?3+L:1+L;for(let i=0;i<n;i++){const x=(.25+(i%3)*.27)*k,z=(.28+Math.floor(i/3)*.42)*k;
   if(i%2===0)g.add(mesh(new THREE.SphereGeometry(.13*k,16,12),MAT.white,x,.13*k+.02,z));else{g.add(mesh(cyl(.11*k,.11*k,.45*k,16),MAT.orange,x,.225*k,z));g.add(mesh(dome(.11*k,16),MAT.orange,x,.45*k,z));}}
  g.add(mesh(cyl(.03*k,.035*k,(.7+.15*L)*k,8),MAT.dark,.82*k,(.35+.075*L)*k,.8*k));g.add(mesh(torus(.32*k,.015*k),MAT.steel,.5*k,.06,.5*k,false));
  const fl=mesh(new THREE.ConeGeometry(.04*k,.15*k,8),new THREE.MeshBasicMaterial({color:0xffa040}),.82*k,(.77+.15*L)*k,.8*k,false);fl.name='flare';g.add(fl);}
 else if(t==='recyc'){g.add(mesh(cyl(.17,.17,.4,16),MAT.blue,.32,.24,.35));g.add(mesh(dome(.17,16),MAT.blue,.32,.44,.35));g.add(mesh(cyl(.12,.12,.28,14),MAT.white,.7,.18,.65));
  g.add(mesh(new THREE.CylinderGeometry(.03,.03,.5,8).rotateZ(Math.PI/2).rotateY(-.8),MAT.steel,.5,.2,.5));g.add(mesh(torus(.13,.02),M(0x66ccff),.7,.33,.65,false));}
 else if(t==='mine'){g.add(mesh(cyl(.26,.3,.06,16),MAT.dark,.42,.07,.42,false));for(let i=0;i<3;i++){const a=i*2.09,l=mesh(cyl(.015,.015,.8,6),MAT.yellow,.42+Math.cos(a)*.14,.42,.42+Math.sin(a)*.14);l.rotation.set(Math.sin(a)*.3,0,-Math.cos(a)*.3);g.add(l);}
  const w=mesh(new THREE.TorusGeometry(.1,.02,6,16),MAT.dark,.42,.8,.42);w.name='spin';g.add(w);const pile=mesh(new THREE.DodecahedronGeometry(.16,0),M(0x7a3a1c,.95),.75,.1,.75);pile.scale.y=.6;g.add(pile);
  g.add(mesh(rbox(.2,.14,.14,.02),MAT.orange,.78,.14,.28));}
 else if(t==='proc'){g.add(mesh(rbox(1.1,.5,.8,.04),M(0xb8b0a4,.7),.85,.29,.9));for(let i=0;i<3;i++){const p=mesh(new THREE.CylinderGeometry(.2,.2,.8,3).rotateX(Math.PI/2).rotateZ(Math.PI/2*0),M(0x8a8178),.5+i*.35,.6,.9);p.rotation.z=Math.PI/6*3;g.add(p);}
  g.add(mesh(cyl(.07,.08,1+.15*L,10),MAT.dark,1.6,.55,.45));const st=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35,depthWrite:false}));st.position.set(1.6,1.15+.15*L,.45);st.name='steam';g.add(st);
  g.add(mesh(rbox(.9,.06,.14,.02),MAT.dark,.75,.12,1.6));for(let i=0;i<4;i++)g.add(mesh(new THREE.DodecahedronGeometry(.05,0),M(0x9a9aa0,.5,.4),.4+i*.22,.19,1.6));
  for(let i=0;i<5;i++)g.add(mesh(new THREE.BoxGeometry(.12,.06,.02),winMat,.45+i*.2,.35,1.31,false));}
 else if(t==='wtank'){const H=.5+.08*L;g.add(mesh(cyl(.3,.3,H,20),M(0x5a8fc8,.4,.3),.5,H/2+.06,.5));g.add(mesh(dome(.3,20),M(0x5a8fc8,.4,.3),.5,H+.06,.5));
  g.add(mesh(torus(.305,.012,24),MAT.steel,.5,H*.5,.5,false));g.add(mesh(torus(.305,.012,24),MAT.steel,.5,H*.85,.5,false));g.add(mesh(new THREE.BoxGeometry(.03,H,.03),MAT.steel,.82,H/2+.06,.5));}
 else if(t==='battery'){const n=2+Math.min(2,L-1);for(let i=0;i<n;i++)for(let j=0;j<2;j++){g.add(mesh(rbox(.16,.26,.3,.02),M(0xf0f0ec,.5),.2+i*.2*(3/n),.19,.3+j*.4));g.add(mesh(new THREE.BoxGeometry(.1,.02,.02),M(0x33ff77,.4,0,{emissive:0x33ff77,emissiveIntensity:1.2}),.2+i*.2*(3/n),.27,.46+j*.4-.0,false));}
  g.add(mesh(cyl(.012,.012,.5,6),MAT.dark,.88,.3,.12));}
 else if(t==='med'){const H=.3+.1*L;g.add(mesh(cyl(.32,.34,H,24),MAT.white,.5,H/2,.5));g.add(mesh(dome(.32,24),MAT.white,.5,H,.5));g.add(mesh(torus(.33,.02),winMat,.5,H*.6,.5,false));
  g.add(mesh(rbox(.24,.04,.07,.01),MAT.red,.5,H+.3,.5,false));g.add(mesh(rbox(.07,.04,.24,.01),MAT.red,.5,H+.3,.5,false));}
 else if(t==='waste'){g.add(mesh(rbox(.5,.28,.38,.06),M(0x6a7a5a),.38,.14,.42));g.add(mesh(dome(.2,16),MAT.steel,.38,.28,.42));
  for(let i=0;i<1+L;i++)g.add(mesh(cyl(.08,.07,.2,12),MAT.green,.8,.1,.2+i*.22));g.add(mesh(cyl(.02,.02,.5,6),MAT.dark,.2,.4,.2));}
 else if(t==='ent'){const r=.75;g.add(mesh(dome(r,28),MAT.white,1,0,1));for(let i=0;i<L+1;i++)g.add(mesh(torus(r*Math.cos(.35+i*.3)+.005,.02,32),neon[i%3],1,r*Math.sin(.35+i*.3),1,false));
  g.add(mesh(rbox(.6,.35,.05,.02),M(0x111122,.2,.3,{emissive:0x3355ff,emissiveIntensity:.8}),1,.75+.1*L,1.55));g.add(mesh(cyl(.02,.02,.75,6),MAT.dark,1,.37,1.55));}
 else if(t==='reactor'){const H=1.2+.25*(L-1);const pts=[];for(let i=0;i<=10;i++){const y=i/10;pts.push(new THREE.Vector2(.42-.18*Math.sin(y*Math.PI*.85),y*H));}
  const ct=new THREE.LatheGeometry(pts,24);g.add(mesh(ct,M(0xd0ccc4,.85),.65,0,.65));g.add(mesh(dome(.4,20),MAT.white,1.45,0,1.4));g.add(mesh(torus(.4,.03),MAT.yellow,1.45,.05,1.4,false));
  const st=new THREE.Mesh(new THREE.SphereGeometry(.3,8,6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35,depthWrite:false}));st.position.set(.65,H+.15,.65);st.name='steam';g.add(st);}
 else if(t==='sec'){const H=.9+.25*(L-1);g.add(mesh(cyl(.32,.4,H,6),M(0x5a6a5a,.6,.3),.7,H/2,.7));g.add(mesh(cyl(.42,.42,.08,6),MAT.dark,.7,H,.7));
  const d=new THREE.Group();d.position.set(.7,H+.1,.7);d.name='spin';const dish=mesh(new THREE.SphereGeometry(.22,16,8,0,6.3,0,.9),MAT.white,0,.15,0);dish.rotation.x=1.2;d.add(dish);g.add(d);
  g.add(mesh(dome(.3,16),MAT.white,1.5,0,1.5));g.add(mesh(cyl(.012,.012,.8,6),MAT.dark,1.6,.4,.5));const fl=mesh(new THREE.PlaneGeometry(.25,.15),M(0x2a5ad2,.8,0,{side:THREE.DoubleSide}),1.725,.72,.5,false);fl.name='cloth';g.add(fl);}
 else if(t==='lamp'){g.add(mesh(cyl(.015,.022,.55,8),MAT.dark,.5,.275,.5));g.add(mesh(rbox(.16,.02,.03,.008),MAT.dark,.56,.55,.5));g.add(mesh(new THREE.SphereGeometry(.035,10,8),lampMat,.62,.52,.5,false));
  const sp=new THREE.Sprite(glowMat);sp.scale.set(.7,.7,.7);sp.position.set(.62,.52,.5);g.add(sp);const pool=new THREE.Mesh(new THREE.CircleGeometry(.65,20).rotateX(-Math.PI/2),poolMat);pool.position.set(.6,.03,.5);g.add(pool);}
 else if(t==='bench'){g.add(mesh(rbox(.45,.04,.14,.015),MAT.trunk,.5,.13,.5));g.add(mesh(rbox(.45,.12,.03,.012),MAT.trunk,.5,.21,.43));[.32,.68].forEach(x=>g.add(mesh(rbox(.03,.12,.12,.008),MAT.dark,x,.06,.5)));}
 else if(t==='planter'){g.add(mesh(cyl(.17,.13,.14,16),MAT.concrete,.5,.07,.5));plants(g,.5,.5,.1,5,.16);g.children.slice(1).forEach(c=>c.position.y+=.12);}
 else if(t==='flag'){g.add(mesh(cyl(.012,.012,.7,6),MAT.steel,.5,.35,.5));const c=mesh(new THREE.PlaneGeometry(.28,.17,6,1),M(0xd23a2a,.8,0,{side:THREE.DoubleSide}),.64,.6,.5,false);c.name='cloth';g.add(c);}
 else if(t==='sign'){g.add(mesh(cyl(.015,.015,.4,6),MAT.trunk,.5,.2,.5));const s1=mesh(rbox(.26,.08,.02,.01),MAT.yellow,.58,.36,.5);g.add(s1);const s2=mesh(rbox(.22,.07,.02,.01),MAT.blue,.43,.27,.5);s2.rotation.y=.6;g.add(s2);}
 return g;}
const SH_H=3.6;
const hexTex=(()=>{const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');x.fillStyle='#2a2a2e';x.fillRect(0,0,256,256);
 const r=9,w=Math.sqrt(3)*r;for(let row=0;row<20;row++)for(let col=0;col<18;col++){const cx=col*w+(row%2?w/2:0),cy=row*r*1.5;x.beginPath();for(let k=0;k<6;k++){const a=Math.PI/3*k+Math.PI/6;x.lineTo(cx+Math.cos(a)*(r-1.2),cy+Math.sin(a)*(r-1.2));}
 x.closePath();const v=12+Math.random()*14;x.fillStyle=`rgb(${v},${v},${v+2})`;x.fill();}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,6);return t;})();
const SHIPMAT={steel:new THREE.MeshStandardMaterial({color:0xdfe3e8,metalness:.92,roughness:.22,envMap:ENV,envMapIntensity:1.5}),
 tile:new THREE.MeshStandardMaterial({color:0xffffff,map:hexTex,roughness:.8,metalness:.1}),flap:new THREE.MeshStandardMaterial({color:0x222226,map:hexTex,roughness:.75,side:THREE.DoubleSide}),
 bell:new THREE.MeshStandardMaterial({color:0x3a3530,metalness:.7,roughness:.4,side:THREE.DoubleSide,envMap:ENV}),
 fl:new THREE.MeshBasicMaterial({color:0xffb347,transparent:true,opacity:.8,depthWrite:false}),fl2:new THREE.MeshBasicMaterial({color:0xaaddff,transparent:true,opacity:.9,depthWrite:false})};
function rocket(){const outer=new THREE.Group(),g=new THREE.Group();outer.add(g); // g centred at ship mid-height; tiles face -z (windward/belly)
 const H=SH_H,r=.2,bodyH=H*.8,noseH=H*.2,y0=-H/2;
 g.add(mesh(new THREE.CylinderGeometry(r,r,bodyH,32,1,true),SHIPMAT.steel,0,y0+bodyH/2,0));
 const tileG=new THREE.CylinderGeometry(r+.006,r+.006,bodyH*.97,32,1,true,Math.PI/2,Math.PI);g.add(mesh(tileG,SHIPMAT.tile,0,y0+bodyH/2+bodyH*.015,0));
 const og=(rr,n=16)=>{const p=[];for(let i=0;i<=n;i++){const t=i/n;p.push(new THREE.Vector2(rr*Math.sqrt(1-t*t*.98)*(1-.12*t)+.0001,t*noseH));}return p;}; // ogive profile
 g.add(mesh(new THREE.LatheGeometry(og(r),32),SHIPMAT.steel,0,y0+bodyH,0));g.add(mesh(new THREE.LatheGeometry(og(r+.006),32,Math.PI/2,Math.PI),SHIPMAT.tile,0,y0+bodyH,0));
 // flaps: hinge on the body side, leaning toward the tiled (-z) side
 const flap=(w,h,top,bot,y,side)=>{const sh=new THREE.Shape();sh.moveTo(0,-h/2);sh.lineTo(w*bot,-h/2);sh.lineTo(w*top,h/2);sh.lineTo(0,h/2*.8);sh.closePath();
  const geo=new THREE.ExtrudeGeometry(sh,{depth:.018,bevelEnabled:false});const f=new THREE.Mesh(geo,SHIPMAT.flap);f.castShadow=true;
  f.position.set(side*(r-.01),y,-r*.55);f.rotation.y=side>0?0:Math.PI;f.scale.z=1;g.add(f);};
 flap(.17,.42,.45,1,y0+bodyH+noseH*.25,1);flap(.17,.42,.45,1,y0+bodyH+noseH*.25,-1); // forward flaps up by the nose
 flap(.26,.68,.55,1,y0+.48,1);flap(.26,.68,.55,1,y0+.48,-1); // aft flaps at the base
 g.add(mesh(new THREE.CylinderGeometry(r,r*.96,.08,32,1,true),SHIPMAT.steel,0,y0-.03,0)); // skirt
 const sl=new THREE.CylinderGeometry(.03,.05,.1,14,1,true),vac=new THREE.CylinderGeometry(.035,.085,.16,16,1,true);
 for(let i=0;i<3;i++){const a=i*2.094;g.add(mesh(sl,SHIPMAT.bell,Math.cos(a)*.05,y0-.07,Math.sin(a)*.05,false));} // 3 sea-level Raptors (centre)
 for(let i=0;i<3;i++){const a=i*2.094+1.047;g.add(mesh(vac,SHIPMAT.bell,Math.cos(a)*.115,y0-.09,Math.sin(a)*.115,false));} // 3 vacuum Raptors (outer, bigger bells)
 const fl=new THREE.Mesh(new THREE.ConeGeometry(.17,1.1,14),SHIPMAT.fl);fl.rotation.x=Math.PI;fl.position.y=y0-.7;fl.name='flame';g.add(fl);
 const fl2=new THREE.Mesh(new THREE.ConeGeometry(.08,.55,10),SHIPMAT.fl2);fl2.rotation.x=Math.PI;fl2.position.y=y0-.4;fl2.name='flame2';g.add(fl2);fl.visible=fl2.visible=false;
 outer.userData.g=g;return outer;}
let puffs=[];const puffG=new THREE.SphereGeometry(.3,7,5);
function dust(x,z,y0=0,n=14){for(let i=0;i<n;i++){const m=new THREE.Mesh(puffG,new THREE.MeshLambertMaterial({color:0xc07a50,transparent:true,opacity:.7}));
 const a=Math.random()*6.28;m.position.set(x,y0+.2,z);m.userData.v=new THREE.Vector3(Math.cos(a)*(1.5+Math.random()*2),.3+Math.random()*.6,Math.sin(a)*(1.5+Math.random()*2));m.userData.life=1.6;scene.add(m);puffs.push(m);}}
function tickPuffs(dt){puffs=puffs.filter(m=>{m.userData.life-=dt;m.position.addScaledVector(m.userData.v,dt);m.userData.v.multiplyScalar(1-dt*1.5);m.scale.setScalar(1+(1.6-m.userData.life)*1.5);
 m.material.opacity=Math.max(0,m.userData.life/1.6*.7);if(m.userData.life<=0){scene.remove(m);m.material.dispose();return false;}return true;});}
// ship pose: y = bottom height, tilt 0 upright .. PI/2 horizontal
function pose(m,y,tilt){const g=m.userData.g;m.rotation.x=-tilt;g.position.y=0;m.position.y=y+(SH_H/2+.12)*Math.cos(tilt)+0.25*Math.sin(tilt);}
function landPose(m,t,T=6){const k=Math.min(1,t/T);const y=30*Math.pow(1-k,1.6);const fk=Math.min(1,Math.max(0,(k-.68)/.17));
 const tilt=Math.PI/2*(1-fk*fk*(3-2*fk))+(fk<1?Math.sin(t*3)*.05:0);pose(m,y,tilt);const fl=m.getObjectByName('flame'),f2=m.getObjectByName('flame2');
 fl.visible=f2.visible=k>.66&&k<1;fl.scale.y=1+Math.random()*.5;f2.scale.y=1+Math.random()*.3;return{k,y};}
const AG={body:new THREE.BoxGeometry(.11,.13,.07),helm:new THREE.SphereGeometry(.065,10,8),visor:new THREE.SphereGeometry(.05,10,6,-.9,1.8,.9,1.1),
 pack:new THREE.BoxGeometry(.09,.11,.05),limb:new THREE.BoxGeometry(.035,.1,.035)};AG.limb.translate(0,-.05,0);
const AM={suit:new THREE.MeshStandardMaterial({color:0xf2f2f2,roughness:.6}),visor:new THREE.MeshStandardMaterial({color:0xd4a017,metalness:1,roughness:.12}),
 pack:new THREE.MeshStandardMaterial({color:0xbfc4c9,roughness:.5}),boot:new THREE.MeshStandardMaterial({color:0x555555})};
const ACC=[0xff7733,0x33aaff,0x55cc55,0xffcc33].map(c=>new THREE.MeshStandardMaterial({color:c}));
function astro(i){const g=new THREE.Group();const p=(geo,mat,x,y,z,sh)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(sh)m.castShadow=true;g.add(m);return m;};
 p(AG.body,AM.suit,0,.2,0,1);p(AG.helm,AM.suit,0,.32,0,1);const v=p(AG.visor,AM.visor,0,.322,.018);p(AG.pack,AM.pack,0,.21,-.055);
 p(new THREE.BoxGeometry(.112,.02,.072),ACC[i%4],0,.24,0);
 const ll=p(AG.limb,AM.boot,-.03,.135,0),lr=p(AG.limb,AM.boot,.03,.135,0),al=p(AG.limb,AM.suit,-.075,.255,0),ar=p(AG.limb,AM.suit,.075,.255,0);
 g.userData={ll,lr,al,ar,ph:Math.random()*6};return g;}
function limbs(u,w){const a=Math.sin(u.ph)*.6*w;u.ll.rotation.x=a;u.lr.rotation.x=-a;u.al.rotation.x=-a;u.ar.rotation.x=a;}
function modelV2(t){const g=new THREE.Group(),s=B[t].s,h=s/2;
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

const V2=new Set(['pad','hab','mega','solar','farm','bigfarm','ice','fuel','refin','reactor']);
function shipModel(){const g=new THREE.Group();const rk=rocket();rk.name='rk';rk.position.set(1,0,1);rk.rotation.order='YXZ';rk.rotation.y=Math.PI*.75;pose(rk,0,0);g.add(rk);
 const sh=new THREE.Mesh(new THREE.CircleGeometry(.5,20).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x5a2a14,transparent:true,opacity:.35,depthWrite:false}));sh.position.set(1,.012,1);g.add(sh);return g;}
function model(t,lvl=1){if(t==='ship')return shipModel();let g;if(V2.has(t))g=modelV2(t);else{g=modelNew(t,lvl);if(B[t].cat==='b'){const s=B[t].s;g.add(mesh(new THREE.BoxGeometry(s*.95,.08,s*.95),M(0x8a8178),s/2,.04,s/2));}}
 if(lvl>1&&B[t].cat==='b'){const s=B[t].s;for(let i=1;i<lvl;i++){const x=s*.15+i*.12,z=s*.12;g.add(mesh(new THREE.CylinderGeometry(.012,.012,.45,6),M(0x999999),x,.25,z));g.add(mesh(new THREE.SphereGeometry(.04,8,6),MAT.yellow,x,.5,z,false));}
  g.children.forEach(c=>{if(c.position.y>.06){c.scale.y*=1+.15*(lvl-1);c.position.y*=1+.15*(lvl-1);}});
  const s2=B[t].s,rc=[0,0x9ad0ff,0x66ff99,0xffd166,0xff7aff][lvl-1];g.add(mesh(new THREE.TorusGeometry(s2*.46,.025,6,32).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:rc,emissive:rc,emissiveIntensity:.5}),s2/2,.09,s2/2,false));
  if(lvl>=5){const st=mesh(new THREE.OctahedronGeometry(.09,0),MAT.gold,s2/2,s2*.6+1,s2/2,false);st.name='spin';g.add(st);}}
 if(B[t].cat==='b'){const s=B[t].s;[[.06,.06],[s-.06,s-.06]].forEach(([x,z])=>{g.add(mesh(new THREE.SphereGeometry(.03,8,6),lampMat,x,.1,z,false));const sp=new THREE.Sprite(glowMat);sp.scale.set(.45,.45,.45);sp.position.set(x,.12,z);g.add(sp);});
  g.add(mesh(new THREE.BoxGeometry(s*.5,.025,.01),winMat,s/2,.06,s*.476+.002,false));const pool=new THREE.Mesh(new THREE.CircleGeometry(s*.75,20).rotateX(-Math.PI/2),poolMat);pool.position.set(s/2,.015,s/2);g.add(pool);}
 return g;}
// ---------- state helpers
let occ=[];const objs=new Map();let uid=1,cid=1;const D4=[[1,0],[-1,0],[0,1],[0,-1]];
const TK=(x,z)=>x+','+z;const tile=(x,z)=>S.tiles[TK(x,z)]||0;const walk=(x,z)=>tile(x,z)>0;const isRoad=()=>false;
function rebuildOcc(){occ=Array.from({length:N},()=>Array(N).fill(null));S.b.forEach(b=>{for(let i=0;i<B[b.t].s;i++)for(let j=0;j<B[b.t].s;j++)if(occ[b.x+i])occ[b.x+i][b.z+j]=b;});}
function free(t,x,z,ign){const s=B[t].s;if(x<0||z<0||x+s>N||z+s>N)return false;for(let i=0;i<s;i++)for(let j=0;j<s;j++){const o=occ[x+i][z+j];if((o&&o!==ign)||blocked[x+i][z+j]||tile(x+i,z+j))return false;}return true;}
const bc=b=>({x:b.x+B[b.t].s/2,z:b.z+B[b.t].s/2});
const by=b=>0;const by_old=b=>{const c=bc(b);const s=B[b.t].s;let m=1e9;for(const[dx,dz]of[[0,0],[-.4,-.4],[.4,.4],[-.4,.4],[.4,-.4]])m=Math.min(m,hgt(c.x+dx*s,c.z+dz*s));return m-.02;};
const cap=b=>Math.round((B[b.t].house||0)*LV[b.lvl-1]);const jobs=b=>Math.round((B[b.t].jobs||0)*LV[b.lvl-1]);
const isDeco=t=>B[t].cat==='d';
function defName(t){let n=1;const used=new Set(S.b.filter(b=>b.t===t).map(b=>b.name));while(used.has(B[t].n+' '+n))n++;return B[t].n+' '+n;}
function placeObj(b){const old=objs.get(b.id);if(old)scene.remove(old);const o=model(b.t,b.lvl);o.position.set(b.x,by(b),b.z);scene.add(o);objs.set(b.id,o);
 if(!isDeco(b.t)&&b.t!=='ship'){const w=new THREE.Sprite(warnMat);w.scale.set(.45,.45,.45);w.position.set(B[b.t].s/2,1.1+B[b.t].s*.3,B[b.t].s/2);w.renderOrder=9;w.name='warn';w.visible=false;o.add(w);}
 doorModel(b);return o;}
function addB(t,x,z,silent,extra={}){const b={t,x,z,id:extra.id||uid++,lvl:extra.lvl||1,name:extra.name||null,ship:null,timer:extra.timer,hold:extra.hold,stock:extra.stock||0};uid=Math.max(uid,b.id+1);if(!b.name)b.name=defName(t);
 S.b.push(b);rebuildOcc();if(t==='pad'&&b.timer==null)b.timer=S.b.filter(q=>q.t==='pad').length>1?shipInterval(b):TUNE.FIRST_SHIP_AFTER;const o=placeObj(b);if(!silent){o.scale.set(1,.01,1);o.userData.grow=0;}refreshDoors();return b;}
function delB(b){S.b=S.b.filter(x=>x!==b);const o=objs.get(b.id);scene.remove(o);objs.delete(b.id);if(b.ship)scene.remove(b.ship.m);
 S.cols.forEach(c=>{if(c.home===b.id)c.home=null;if(c.work===b.id)c.work=null;});agents.forEach(a=>{if(a.at===b.id||a.dest===b.id){a.st='in';a.at=null;a.m.visible=false;}});rebuildOcc();refreshDoors();}
const byId=id=>S.b.find(b=>b.id===id);
// ---------- doors / connectivity
function perim(b){const s=B[b.t].s,o=[];for(let i=0;i<s;i++){o.push([b.x+i,b.z+s],[b.x+s,b.z+i],[b.x+i,b.z-1],[b.x-1,b.z+i]);}return o.filter(([x,z])=>x>=0&&z>=0&&x<N&&z<N);}
function near2(b){const s=B[b.t].s,o=[];for(let i=-2;i<s+2;i++)for(let j=-2;j<s+2;j++){if(i>=0&&i<s&&j>=0&&j<s)continue;const x=b.x+i,z=b.z+j;if(x<0||z<0||x>=N||z>=N)continue;
 const d=Math.max(i<0?-i:i>=s?i-s+1:0,j<0?-j:j>=s?j-s+1:0)+(i<0||i>=s)*(j<0||j>=s)*.5;o.push([x,z,d]);}return o.sort((a,c)=>a[2]-c[2]);}
function refreshDoors(){S.b.forEach(b=>{if(isDeco(b.t))return;const p=near2(b);const prevD=b.door;let d=p.find(([x,z])=>prevD&&x===prevD.x&&z===prevD.z&&walk(x,z));
 if(!d)d=p.find(([x,z])=>walk(x,z));b.door=d?{x:d[0],z:d[1]}:null;b.rdoor=null;
 if(!prevD!==!b.door||(prevD&&b.door&&(prevD.x!==b.door.x||prevD.z!==b.door.z)))doorModel(b);const o=objs.get(b.id);const w=o&&o.getObjectByName('warn');if(w)w.visible=!b.door;});pathsDirty=true;}
function doorModel(b){const o=objs.get(b.id);if(!o)return;const old=o.getObjectByName('door');if(old)o.remove(old);if(!b.door||b.t==='pad'||b.t==='solar'||b.t==='ship'||b.t==='battery'||b.t==='wtank'||isDeco(b.t))return;
 const s=B[b.t].s,c={x:s/2,z:s/2};let dx=b.door.x+.5-b.x-c.x,dz=b.door.z+.5-b.z-c.z;if(Math.abs(dx)>Math.abs(dz)){dx=Math.sign(dx);dz=0;}else{dz=Math.sign(dz);dx=0;}
 const g=new THREE.Group();g.name='door';const tube=mesh(cyl(.085,.085,.28,14),MAT.white,0,.085,0);tube.rotation.set(dz?Math.PI/2:0,0,dx?Math.PI/2:0);g.add(tube);
 const dr=mesh(cyl(.06,.06,.01,14),MAT.dark,dx*.14,.085,dz*.14,false);dr.rotation.copy(tube.rotation);g.add(dr);
 const lt=mesh(new THREE.SphereGeometry(.018,6,4),lampMat,dx*.1,.18,dz*.1,false);g.add(lt);g.position.set(c.x+dx*(s/2-.14),0,c.z+dz*(s/2-.14));o.add(g);}
// ---------- paths mesh (auto-connect)
let pathMesh=null,pathsDirty=true;const pathMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,envMapIntensity:.25,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
function rebuildPaths(){pathsDirty=false;if(pathMesh){scene.remove(pathMesh);pathMesh.geometry.dispose();}const P=[],C=[],I=[];
 const quad=(x0,z0,x1,z1,off,c)=>{const n=P.length/3;for(const[x,z]of[[x0,z0],[x1,z0],[x1,z1],[x0,z1]]){P.push(x,hgt(x,z)+off,z);C.push(...c);}I.push(n,n+2,n+1,n,n+3,n+2);};
 const doors=new Map();S.b.forEach(b=>{if(b.door){const k=TK(b.door.x,b.door.z);if(!doors.has(k))doors.set(k,[]);doors.get(k).push(b);}});
 for(const k in S.tiles){const [x,z]=k.split(',').map(Number),t=S.tiles[k],cx=x+.5,cz=z+.5,w=t===2?.43:.2;const v=.92+((x*7+z*13)%5)*.02;
  const col=t===2?[.2*v,.16*v,.14*v]:[.86*v,.7*v,.54*v];quad(cx-w,cz-w,cx+w,cz+w,.035,col);
  const nb=D4.map(([dx,dz])=>walk(x+dx,z+dz)||(doors.get(k)||[]).some(b=>{const s=B[b.t].s;return x+dx>=b.x&&x+dx<b.x+s&&z+dz>=b.z&&z+dz<b.z+s;}));
  nb.forEach((on,i)=>{if(!on)return;const[dx,dz]=D4[i];const ww=t===2&&isRoad(x+dx,z+dz)?w:.2;
   if(dx===1)quad(cx+w,cz-ww,x+1,cz+ww,.035,col);if(dx===-1)quad(x,cz-ww,cx-w,cz+ww,.035,col);if(dz===1)quad(cx-ww,cz+w,cx+ww,z+1,.035,col);if(dz===-1)quad(cx-ww,z,cx+ww,cz-w,.035,col);});
  if(t===2){const y=[.85,.75,.35];const ns=D4.map(([dx,dz])=>isRoad(x+dx,z+dz));
   if((ns[0]||ns[1])&&!ns[2]&&!ns[3])quad(cx-.18,cz-.02,cx+.18,cz+.02,.045,y);else if((ns[2]||ns[3])&&!ns[0]&&!ns[1])quad(cx-.02,cz-.18,cx+.02,cz+.18,.045,y);
   const e=[.55,.5,.45];if(!ns[2]&&!walk(x,z+1))quad(cx-.45,z+.93,cx+.45,z+.96,.05,e);if(!ns[3]&&!walk(x,z-1))quad(cx-.45,z+.04,cx+.45,z+.07,.05,e);
   if(!ns[0]&&!walk(x+1,z))quad(x+.93,cz-.45,x+.96,cz+.45,.05,e);if(!ns[1]&&!walk(x-1,z))quad(x+.04,cz-.45,x+.07,cz+.45,.05,e);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();
 pathMesh=new THREE.Mesh(g,pathMat);pathMesh.receiveShadow=true;scene.add(pathMesh);}
function hpush(h,v){h.push(v);let i=h.length-1;while(i>0){const p=(i-1)>>1;if(h[p][0]<=h[i][0])break;[h[p],h[i]]=[h[i],h[p]];i=p;}}
function hpop(h){const top=h[0],l=h.pop();if(h.length){h[0]=l;let i=0;for(;;){const a=2*i+1,b=a+1;let m=i;if(a<h.length&&h[a][0]<h[m][0])m=a;if(b<h.length&&h[b][0]<h[m][0])m=b;if(m===i)break;[h[m],h[i]]=[h[i],h[m]];i=m;}}return top;}
// ---------- A* pathfinding on path/road tiles
function astar(s,t,ok){if(!s||!t)return null;const K=(x,z)=>x*N+z,tk=K(t.x,t.z),g=new Map(),from=new Map(),open=[[0,s.x,s.z]];g.set(K(s.x,s.z),0);let it=0;
 while(open.length&&it++<40000){const[,x,z]=hpop(open);const k=K(x,z);
  if(k===tk){const p=[];let c=k;while(c!==undefined){p.push({x:(c/N)|0,z:c%N});c=from.get(c);}return p.reverse();}
  const gc=g.get(k);for(const[dx,dz]of D4){const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=N||nz>=N||!ok(nx,nz))continue;const nk=K(nx,nz),ng=gc+(isRoad(nx,nz)?.9:1);if(g.has(nk)&&g.get(nk)<=ng)continue;g.set(nk,ng);from.set(nk,k);hpush(open,[ng+Math.abs(nx-t.x)+Math.abs(nz-t.z),nx,nz]);}}
 return null;}
// ---------- colonists
function assign(){const ids=new Set(S.b.map(b=>b.id));const res={},wk={};S.b.forEach(b=>{b.res=0;b.wk=0;});
 S.cols.forEach(c=>{if(c.home&&!ids.has(c.home))c.home=null;if(c.work&&!ids.has(c.work))c.work=null;if(c.home)res[c.home]=(res[c.home]||0)+1;if(c.work)wk[c.work]=(wk[c.work]||0)+1;});
 const hs=S.b.filter(b=>cap(b)>0).sort((a,b)=>!!b.door-!!a.door),ws=S.b.filter(b=>jobs(b)>0).sort((a,b)=>!!b.door-!!a.door);
 S.cols.forEach(c=>{if(!c.home){const h=hs.find(b=>(res[b.id]||0)<cap(b));if(h){c.home=h.id;res[h.id]=(res[h.id]||0)+1;}}
  else{const hb=byId(c.home);if(!hb.door){const h=hs.find(b=>b.door&&(res[b.id]||0)<cap(b));if(h){res[c.home]--;c.home=h.id;res[h.id]=(res[h.id]||0)+1;}}}
  if(!c.work){const w=ws.find(b=>(wk[b.id]||0)<jobs(b));if(w){c.work=w.id;wk[w.id]=(wk[w.id]||0)+1;}}});
 S.b.forEach(b=>{b.res=res[b.id]||0;b.wk=wk[b.id]||0;});}
function newCol(){const c={id:cid++,n:rname(),home:null,work:null,mood:Math.random()*10-5};S.cols.push(c);return c;}
function colHap(c){let h=S.hap+c.mood;const hb=c.home&&byId(c.home);if(!hb)h-=30;else if(!hb.door)h-=10;if(!c.work)h-=10;return Math.max(0,Math.min(100,Math.round(h)));}
// ---------- astronaut agents
let agents=new Map();const MAXA=90;
function syncAgents(){const want=new Set(S.cols.slice(0,MAXA).map(c=>c.id));agents.forEach((a,id)=>{if(!want.has(id)){scene.remove(a.m);agents.delete(id);}});
 S.cols.slice(0,MAXA).forEach((c,i)=>{if(!agents.has(c.id)){const m=astro(c.id);m.scale.setScalar(1.25);m.visible=false;scene.add(m);m.userData.cid=c.id;
  agents.set(c.id,{c,m,st:'in',at:c.spawn||c.home,wait:c.spawn?0.5:Math.random()*8,off:(Math.random()-.5)*.22});delete c.spawn;}});}
function edgeTo(b,o){const c=bc(b),dx=o.x-c.x,dz=o.z-c.z,l=Math.hypot(dx,dz)||1,r=B[b.t].s*.5+.1;return new THREE.Vector3(c.x+dx/l*r,0,c.z+dz/l*r);}
function edgePos(b,door){const c=bc(b);return new THREE.Vector3((c.x+door.x+.5)/2,0,(c.z+door.z+.5)/2);}
function leisure(){const l=S.b.filter(b=>b.door&&(b.t==='ent'||b.t==='farm'||b.t==='bigfarm'||b.t==='med'||b.t==='pad'));return l.length?l[Math.random()*l.length|0]:null;}
function tickAgents(dt){agents.forEach(a=>{const u=a.m.userData,c=a.c;
 if(a.st==='in'){a.m.visible=false;a.wait-=dt;if(a.wait>0)return;const at=a.at&&byId(a.at);const home=c.home&&byId(c.home);if(!at){a.at=c.home;a.wait=3;return;}
  let dest=at.id!==c.home?home:(c.work&&c.work!==c.home&&Math.random()<.8?byId(c.work):leisure());if(!dest||dest===at||(dest.cons>0)){a.wait=4+Math.random()*4;return;}
  const p=at.door&&dest.door?astar(at.door,dest.door,walk):null;const ca=bc(at),cd=bc(dest);if(!p&&Math.hypot(ca.x-cd.x,ca.z-cd.z)>30){a.wait=6;return;}
  a.path=p||[];a.pi=0;a.dest=dest.id;a.st='walk';const e=p?edgePos(at,at.door):edgeTo(at,cd);a.m.position.set(e.x,hgt(e.x,e.z),e.z);a.m.visible=true;a.endp=p?edgePos(dest,dest.door):edgeTo(dest,ca);return;}
 const last=a.pi>=a.path.length;let tx,tz;if(last){tx=a.endp.x;tz=a.endp.z;}else{const n=a.path[a.pi];if(!walk(n.x,n.z)){a.path=[];a.pi=0;return;}
  const prv=a.pi>0?a.path[a.pi-1]:n,nx=a.path[a.pi+1]||n;let dx=nx.x-prv.x,dz=nx.z-prv.z;const l=Math.hypot(dx,dz)||1;tx=n.x+.5-dz/l*a.off;tz=n.z+.5+dx/l*a.off;}
 const p=a.m.position,vx=tx-p.x,vz=tz-p.z,d=Math.hypot(vx,vz),sp=.75*dt;
 if(d<=sp){p.x=tx;p.z=tz;if(last){a.st='in';a.at=a.dest;a.wait=a.at===c.home?5+Math.random()*8:7+Math.random()*10;}else a.pi++;}
 else{p.x+=vx/d*sp;p.z+=vz/d*sp;a.m.rotation.y=Math.atan2(vx,vz);}u.ph+=dt*9;limbs(u,1);p.y=hgt(p.x,p.z)+.02+Math.abs(Math.sin(u.ph))*.02;});}
// ---------- Cybertrucks
let trucks=[];
function truckModel(){const g=new THREE.Group();const sh=new THREE.Shape();sh.moveTo(-.46,.07);sh.lineTo(.46,.07);sh.lineTo(.48,.17);sh.lineTo(.06,.33);sh.lineTo(-.46,.23);sh.lineTo(-.46,.07);
 const geo=new THREE.ExtrudeGeometry(sh,{depth:.36,bevelEnabled:false});geo.translate(0,0,-.18);geo.rotateY(-Math.PI/2);geo.computeVertexNormals();
 const body=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0xc9ccd0,metalness:.9,roughness:.32,envMap:ENV,envMapIntensity:1.2,flatShading:true}));body.castShadow=true;g.add(body);
 const gl=new THREE.Mesh(new THREE.PlaneGeometry(.34,.2),M(0x111418,.1,.6,{side:THREE.DoubleSide}));gl.position.set(0,.262,.27);gl.rotation.x=-Math.PI/2+.36;g.add(gl);
 const wg=cyl(.075,.075,.06,12);wg.rotateZ(Math.PI/2);[[.17,.3],[-.17,.3],[.17,-.29],[-.17,-.29]].forEach(([x,z])=>g.add(mesh(wg,MAT.dark,x,.075,z,false)));
 g.add(mesh(new THREE.BoxGeometry(.34,.012,.012),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:2}),0,.17,.475,false));
 g.add(mesh(new THREE.BoxGeometry(.34,.012,.012),new THREE.MeshStandardMaterial({color:0xff2020,emissive:0xff2020,emissiveIntensity:1.5}),0,.2,-.465,false));
 const cr=mesh(rbox(.26,.1,.3,.02),M(0x9a6a3a,.8),0,.27,-.22,false);cr.name='crate';cr.visible=false;g.add(cr);g.scale.setScalar(.85);return g;}
// Cybertrucks drive freely over the terrain (no roads), steering around buildings.
const TRUCKSRC=['proc','pad','ship'];
function nearestB(list,p){let best=null,bd=1e9;list.forEach(b=>{const c=bc(b),d=Math.hypot(c.x-p.x,c.z-p.z);if(d<bd){bd=d;best=b;}});return best;}
function syncTrucks(){const procs=S.b.filter(b=>b.t==='proc').length,pads=S.b.filter(b=>b.t==='pad').length,ships=S.b.some(b=>b.t==='ship');
 const want=Math.min(8,(ships||pads?1:0)+procs*2+pads);while(trucks.length>want)scene.remove(trucks.pop().m);
 while(trucks.length<want){const home=S.b.find(b=>b.t==='proc')||S.b.find(b=>b.t==='pad')||S.b.find(b=>b.t==='ship');if(!home)break;const c=bc(home);const m=truckModel();
  const a=Math.random()*6.28,r=B[home.t].s*.5+.7;m.position.set(c.x+Math.cos(a)*r,0,c.z+Math.sin(a)*r);m.rotation.y=a;scene.add(m);trucks.push({m,st:'idle',wait:Math.random()*2,load:0});}}
function clearAt(x,z,t){if(x<0||z<0||x>=N||z>=N)return false;const o=occ[x|0]?.[z|0];return!o||o===t.src||o===t.dst||isDeco(o.t);}
function drive(t,b,dt){const p=t.m.position,c=bc(b),dx=c.x-p.x,dz=c.z-p.z,d=Math.hypot(dx,dz);if(d<B[b.t].s*.5+.55)return true;
 const want=Math.atan2(dx,dz),side=t.side||1;let head=null;
 for(const o of[0,.45,-.45,.9,-.9,1.35,-1.35,1.9,-1.9,2.6,-2.6]){const a=want+o*side;if(clearAt(p.x+Math.sin(a)*.75,p.z+Math.cos(a)*.75,t)&&clearAt(p.x+Math.sin(a)*.4,p.z+Math.cos(a)*.4,t)){head=a;if(o!==0)t.side=Math.sign(o*side)||1;break;}}
 if(head===null){head=t.m.rotation.y+Math.PI*.5;}
 // separation from other trucks
 let sx=0,sz=0;for(const o of trucks){if(o===t)continue;const ox=p.x-o.m.position.x,oz=p.z-o.m.position.z,od=Math.hypot(ox,oz);if(od<.6&&od>0){sx+=ox/od*(.6-od);sz+=oz/od*(.6-od);}}
 let da=head-t.m.rotation.y;da=Math.atan2(Math.sin(da),Math.cos(da));t.m.rotation.y+=da*Math.min(1,dt*6);
 const sp=Math.min(d,(Math.abs(da)>1.2?1:2.2)*dt);p.x+=Math.sin(t.m.rotation.y)*sp+sx*dt*2;p.z+=Math.cos(t.m.rotation.y)*sp+sz*dt*2;p.y=hgt(p.x,p.z);
 t.stuck=(t.stuck||0)+dt;if(t.stuck>40){const e=edgeTo(b,{x:p.x,z:p.z});p.x=e.x;p.z=e.z;}return false;}
function deliverOre(pr,n){const cap=120*LV[pr.lvl-1];pr.stock=(pr.stock||0)+n;if(pr.stock>cap){S.ore+=pr.stock-cap;pr.stock=cap;}
 if(Math.random()<.12){const r=1+(Math.random()*3|0);S.rare+=r;toast(`💎 Rare ore found in a truckload: +${r}`);}}
function tickTrucks(dt){trucks.forEach(t=>{const cr=t.m.getObjectByName('crate');cr.visible=t.st==='toDst';
 if(t.st==='idle'){t.wait-=dt;if(t.wait>0)return;t.wait=1.5;t.stuck=0;
  const job=S.b.find(b=>b.cons>0&&!b.delivered&&!b.claimed);
  if(job){const src=nearestB(S.b.filter(b=>TRUCKSRC.includes(b.t)&&!b.cons&&b!==job),bc(job));if(src){job.claimed=1;t.job=job;t.src=src;t.dst=job;t.kind='build';t.st='toSrc';return;}}
  const procs=S.b.filter(b=>b.t==='proc'&&!b.cons),mines=S.b.filter(b=>b.t==='mine'&&!b.cons&&(b.stock||0)>=4&&!trucks.some(o=>o!==t&&o.src===b&&o.st==='toSrc')).sort((a,b)=>b.stock-a.stock);
  if(procs.length&&mines.length){t.src=mines[0];t.dst=nearestB(procs,bc(mines[0]));t.kind='ore';t.st='toSrc';}return;}
 const g=t.st==='toSrc'?t.src:t.dst;if(!S.b.includes(g)){if(t.job)t.job.claimed=0;t.st='idle';t.job=null;t.load=0;return;}
 if(t.pause>0){t.pause-=dt;return;}
 if(drive(t,g,dt)){t.stuck=0;if(t.st==='toSrc'){if(t.kind==='ore'){t.load=Math.min(t.src.stock||0,TUNE.TRUCK_LOAD);t.src.stock-=t.load;}t.st='toDst';t.pause=1;}
  else{if(t.kind==='ore')deliverOre(t.dst,t.load);else{t.job.delivered=1;}t.load=0;t.st='idle';t.job=null;t.wait=.8;t.pause=.8;}}});}
// ---------- stats
let sunK=1;const CONS_T=4;
function dayPhase(t){return((t/DAY)+.02)%1;}
function dayK(t){const p=dayPhase(t),D=TUNE.DAY_SPLIT,f=.07;if(p>=D)return 0;return Math.max(0,Math.min(1,p/f,(D-p)/f));}
function eff(b){if(b.cons>0)return 0;const j=jobs(b);if(!j)return 1;return b.door?.35+.65*Math.min(1,(b.wk||0)/j):.3;}
let decoBonus=0;
function stats(dt=0){let pw=0,pu=0,house=0,food=0,wat=0,fuel=0,waste=0,med=0,ent=0,sec=0,wcap=120,bcap=0;
 S.b.forEach(b=>{const d=B[b.t],m=LV[b.lvl-1],e=eff(b),on=!(b.cons>0);if(d.pw>0)pw+=d.pw*m*e*(b.t==='solar'?sunK:1);else if(d.pw&&on)pu-=d.pw*m;if(on){house+=cap(b);if(d.wcap)wcap+=d.wcap*m;if(d.bat)bcap+=d.bat*m;}});
 const raw=pw;let batUse=0;if(pw<pu&&S.bat>0){batUse=Math.min(pu-pw,dt?S.bat/dt:pu-pw);pw+=batUse;}
 if(dt){if(batUse)S.bat=Math.max(0,S.bat-batUse*dt);else S.bat=Math.min(bcap,S.bat+(pw-pu)*dt*.6);}S.bat=Math.min(S.bat,bcap);
 const pe=pu?Math.min(1,pw/pu):1;
 S.b.forEach(b=>{const d=B[b.t],m=LV[b.lvl-1],e=eff(b)*pe;food+=d.food>0?d.food*m*e:(d.food||0)*m*(b.cons>0?0:1);wat+=d.wat>0?d.wat*m*e:(d.wat||0)*m*(b.cons>0?0:1);fuel+=(d.fuel||0)*m*e*(S.wat>1?1:0);
  waste+=(d.waste||0)*m*e;med+=(d.med||0)*m*e;ent+=(d.ent||0)*m*e;sec+=(d.sec||0)*m*e;});
 const pop=S.cols.length,dem=DIFF[S.diff||'standard'].dem*(S.tut?.5:1);food-=pop*.12*dem;wat-=pop*.1*dem;
 const clean=pop<15?1:Math.min(1,waste/pop),health=pop<20?1:Math.min(1,med/pop),fun=pop?Math.min(1,ent/pop):0,safe=pop<60?1:Math.min(1,sec/pop);
 return{pw:Math.round(pw*10)/10,pu:Math.round(pu*10)/10,raw,pe,house,food,wat,fuel,clean,health,fun,safe,pop,wcap,bcap,batUse};}
function calcDeco(){let n=0;S.b.forEach(b=>{if(!isDeco(b.t))return;for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)if(walk(b.x+i,b.z+j)){n++;return;}});decoBonus=Math.min(10,n*25/(S.cols.length+10));}
// ---------- costs
const costTxt=(c,m)=>`${c?'¢'+c:''}${m?' 🧱'+m:''}`||'free';
function afford(c,m,quiet){if(S.cr<c||S.mat<m){if(!quiet){toast(S.cr<c?`Not enough credits (need ¢${c})`:`Not enough materials (need 🧱${m}) — build a Mine + Processor or order a shipment`,1);beep(160,.15,'sawtooth',.04);}return false;}return true;}
function pay(c,m){S.cr-=c;S.mat-=m;}
function finishCons(b){b.cons=0;b.delivered=b.claimed=0;const o=objs.get(b.id);if(o){const sc=o.getObjectByName('scaf');if(sc)o.remove(sc);o.userData.grow=o.scale.y;}assign();refreshDoors();if(!S.demo)beep(660,.06,'triangle',.05);}
function floatText(txt){const d=document.createElement('div');d.className='ft';d.textContent=txt;document.body.appendChild(d);setTimeout(()=>d.remove(),2200);}
function shipInterval(b){return TUNE.SHIP_EVERY_SOL*DAY*(.8+Math.random()*.4)/(1+TUNE.PAD_LVL_BONUS*((b?b.lvl:1)-1));}
// ---------- UI
const $=id=>document.getElementById(id);let sel=null,speed=1,tab='b';
function toast(m,w){if(S&&S.demo)return;const d=document.createElement('div');d.className='t'+(w?' w':'');d.textContent=m;$('toasts').prepend(d);setTimeout(()=>d.remove(),4000);while($('toasts').children.length>5)$('toasts').lastChild.remove();}
function tip(k,el){const d=B[k],t=$('tip'),f=(v,u)=>v?`<div>${v>0?'+':''}${v} ${u}</div>`:'';
 t.innerHTML=`<b>${d.ic} ${d.n}</b> — ${d.c||d.m?costTxt(d.c,d.m):'free'}${d.ore?`<div>⛏️ +${d.ore} ore/s</div>`:''}${d.conv?`<div>🧱 makes ${d.conv} materials/s from ore</div>`:''}${d.wcap?`<div>💧 +${d.wcap} water storage</div>`:''}${d.bat?`<div>🔋 stores ${d.bat} power</div>`:''}${f(d.pw,'⚡ power')}${f(d.food,'🍞 food/s')}${f(d.wat,'💧 water/s')}${f(d.fuel,'⛽ fuel/s')}${d.house?`<div>🏠 houses ${d.house}</div>`:''}${d.jobs?`<div>👷 ${d.jobs} jobs</div>`:''}${d.waste?`<div>♻️ cleans for ${d.waste}</div>`:''}${d.med?`<div>🩺 care for ${d.med}</div>`:''}${d.ent?`<div>🎭 fun for ${d.ent}</div>`:''}${d.sec?`<div>🛡️ safety for ${d.sec}</div>`:''}
 <div style="opacity:.8">${d.d}${d.cat==='b'?` · ${d.s}×${d.s}`:''}${d.up?' · upgradable to L5':''}${d.unl?` · unlocks at ${d.unl} pop`:''}</div><div style="opacity:.6;font-size:11px">${d.cat==='b'?'Needs a path next to it · hold a building to move it':d.cat==='d'?'Next to paths: boosts happiness':d.cat==='p'?'Drag across the ground to paint':''}</div>`;
 const r=el.getBoundingClientRect();t.style.display='block';t.style.left=Math.max(4,Math.min(innerWidth-224,r.left))+'px';t.style.bottom=(innerHeight-r.top+6)+'px';}
function menu(){const m=$('menu');m.innerHTML='';const pop=S?S.cols.length:0;
 [['b','🏗️ Build'],['p','🚶 Paths'],['d','🌷 Decor']].forEach(([k,l])=>{const e=document.createElement('div');e.className='tab'+(tab===k?' on':'');e.textContent=l;e.onclick=()=>{tab=k;beep(650,.03);menu();};m.appendChild(e);});
 Object.entries(B).filter(([k,d])=>d.cat===tab||(d.cat==='x'&&tab!=='b')).forEach(([k,d])=>{const e=document.createElement('div');const lock=d.unl&&pop<d.unl;
  const hl=tutWants(k);e.className='b'+(sel===k?' sel':'')+(lock?' lock':'')+(hl?' hl':'');e.dataset.k=k;e.innerHTML=`${d.ic} ${d.n}<small>${lock?'🔒 '+d.unl+' pop':(d.c||d.m?costTxt(d.c,d.m):'free')}</small>`;
  e.onpointerenter=()=>tip(k,e);e.onpointerleave=()=>$('tip').style.display='none';
  e.onclick=()=>{beep(700,.04);tip(k,e);if(lock){toast(`Unlocks at ${d.unl} colonists`);return;}sel=sel===k?null:k;closePanel();menu();updPrev();};m.appendChild(e);});
 gridLines.visible=!!sel;}
let lastLock='';
function clock(){const p=dayPhase(S.t),D=TUNE.DAY_SPLIT;let h=p<D?6+p/D*14:20+(p-D)/(1-D)*10;h%=24;const hh=Math.floor(h),mm=Math.floor((h-hh)*6)*10;return`${p<D?'☀️':'🌙'} ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;}
function hud(st){if(S.demo)return;const f=v=>(v>=0?'+':'')+v.toFixed(1);const pop=st.pop,hl=S.cols.filter(c=>!c.home).length,un=S.cols.filter(c=>!c.work).length;
 const items=[['🏴',S.name],['💰',Math.floor(S.cr)],['👩‍🚀',`${pop}/${st.house}`],['⚡',`${st.pw}/${st.pu}`,st.pw<st.pu],['🍞',`${Math.floor(S.food)} (${f(st.food)})`,S.food<5&&st.food<0],
 ['💧',`${Math.floor(S.wat)}/${st.wcap} (${f(st.wat)})`,S.wat<5&&st.wat<0],['🧱',Math.floor(S.mat),S.mat<20],['⛽',Math.floor(S.fuel)],['😊',Math.round(S.hap)+'%',S.hap<40]];
 if(st.bcap)items.splice(4,0,['🔋',Math.round(S.bat/st.bcap*100)+'%'+(st.batUse?' ⬇':''),S.bat<1&&st.batUse===0&&st.raw<st.pu]);if(S.ore>=1||S.b.some(b=>b.t==='mine'))items.push(['⛏️',Math.floor(S.ore)]);if(S.rare>0)items.push(['💎',Math.floor(S.rare)]);
 if(S.flights.length)items.push(['🛸',S.flights.length+' en route']);
 if(pop>=10)items.push(['♻️',Math.round(st.clean*100)+'%',st.clean<.7]);if(pop>=20)items.push(['🩺',Math.round(st.health*100)+'%',st.health<.7]);
 if(pop>=25)items.push(['🎭',Math.round(st.fun*100)+'%']);if(pop>=55)items.push(['🛡️',Math.round(st.safe*100)+'%',st.safe<.7]);
 if(hl)items.push(['🏚️',hl+' homeless',1]);if(un>2)items.push(['💼',un+' jobless']);items.push(['📅',`Sol ${Math.floor(S.t/DAY+1)} ${clock()}`]);
 $('hud').innerHTML=items.map(([i,v,b])=>`<span class="r${b?' bad':''}${i==='🏴'?' nm':''}">${i} ${v}</span>`).join('');
 const l=Object.keys(B).filter(k=>B[k].unl&&pop>=B[k].unl).join();if(l!==lastLock){if(lastLock!==''&&l.length>lastLock.length)toast('🔓 New building unlocked!');lastLock=l;menu();}}
// ---------- info panels
let panel=null,panelHover=false;$('panel').onpointerenter=()=>panelHover=true;$('panel').onpointerleave=()=>panelHover=false;const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.62,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffd166,transparent:true,opacity:.9,depthTest:false}));ring.renderOrder=8;ring.visible=false;scene.add(ring);
function closePanel(){panel=null;panelHover=false;$('panel').style.display='none';ring.visible=false;follow=null;}
function openB(b){panel={b};const p=$('panel');p.style.display='block';
 p.innerHTML=`<div class="ph"><span>${B[b.t].ic}</span><input id="bname" maxlength="28"><button id="pclose">✕</button></div><div id="pbody"></div><div class="pbtn">${B[b.t].up?'<button id="pup"></button>':''}${(b.t!=='pad'||!b.ship)&&b.t!=='ship'?'<button id="pdoz">🚜 Bulldoze</button>':''}</div><div class="hint">✋ Press &amp; hold the building to move it</div>`;
 $('bname').value=b.name;$('bname').oninput=e=>{b.name=e.target.value.slice(0,28)||defName(b.t);};$('bname').onkeydown=e=>e.stopPropagation();$('pclose').onclick=()=>{closePanel();beep(500,.03);};
 if($('pup'))$('pup').onclick=()=>upgrade(b);$('pbody').onclick=e=>{const el=e.target.closest('button');if(el&&el.dataset.a)cargoAct(b,el);};if($('pdoz'))$('pdoz').onclick=()=>{bulldoze(b);closePanel();};
 const s=B[b.t].s;ring.geometry.dispose();ring.geometry=new THREE.RingGeometry(s*.62,s*.62+.07,40).rotateX(-Math.PI/2);ring.position.set(b.x+s/2,by(b)+.06,b.z+s/2);ring.visible=true;renderPanel(true);}
function renderPanel(force){if(!panel)return;if(panelHover&&!force)return;if(panel.mkt){const ar=k=>S.mkt[k]>S.mktPrev[k]+.005?'<span style="color:#7f7">▲</span>':S.mkt[k]<S.mktPrev[k]-.005?'<span style="color:#f77">▼</span>':'▬';const oc=Math.round(TUNE.ORDER_QTY*TUNE.ORDER_PRICE*S.mkt.mat);
  $('pbody').innerHTML=`<div class="sub">Prices change every Sol. Load cargo onto a landed Starship and launch it home to sell.</div><div class="stats">${Object.keys(GOOD).map(k=>`${GOOD[k]}: ¢${price(k).toFixed(1)}/u ${ar(k)} · you have ${Math.floor(S[STOCK[k]])}`).join('<br>')}</div>
  <div><b>Order materials</b><br><button data-a="order">📦 Order ${TUNE.ORDER_QTY} 🧱 for ¢${oc}</button>${S.order?`<div class="sub">Pending: ${S.order} 🧱 on the next supply ship${S.b.some(b=>b.t==='pad')?'':' (needs a 🛬 Landing Pad!)'}</div>`:''}</div>
  <div><b>Ships en route to Earth</b><br>${S.flights.map(f=>`🛸 ${f.name} — ¢${f.pay} in ${Math.ceil(f.t-S.t)}s`).join('<br>')||'<i>none</i>'}</div><div class="sub">Return flights so far: ${S.launches||0}</div>`;return;}
 if(panel.b){const b=panel.b;if(!S.b.includes(b)){closePanel();return;}const d=B[b.t],m=LV[b.lvl-1],e=eff(b),L=[];
 L.push(`<div class="sub">${d.n}${d.up?` · Level ${b.lvl}/5 ${'★'.repeat(b.lvl)}`:''} · ${b.door?'✅ Connected':isDeco(b.t)?'🌷 Decoration':'<b style="color:#ffcc33">⚠️ Not connected — build a path next to it</b>'}</div>`);
 const out=[];if(d.pw>0)out.push(`⚡ +${(d.pw*m*e).toFixed(1)} power`);if(d.pw<0)out.push(`⚡ uses ${(-d.pw*m).toFixed(1)}`);if(d.food>0)out.push(`🍞 +${(d.food*m*e).toFixed(2)}/s`);if(d.wat>0)out.push(`💧 +${(d.wat*m*e).toFixed(2)}/s`);
 if(d.wat<0)out.push(`💧 uses ${(-d.wat*m).toFixed(1)}/s`);if(d.fuel)out.push(`⛽ +${(d.fuel*m*e).toFixed(2)}/s`);['waste','med','ent','sec'].forEach(k=>{if(d[k])out.push(`${B[k==='waste'?'waste':k].ic} serves ${Math.round(d[k]*m*e)}`);});
 if(jobs(b))out.push(`📈 efficiency ${Math.round(e*100)}%`);if(out.length)L.push(`<div class="stats">${out.join('<br>')}</div>`);
 const lst=(arr,max)=>arr.slice(0,max).map(c=>`<span class="cn" data-c="${c.id}">${c.n}</span>`).join(', ')+(arr.length>max?` +${arr.length-max} more`:'');
 if(cap(b)){const r=S.cols.filter(c=>c.home===b.id);L.push(`<div><b>Residents ${r.length}/${cap(b)}</b><br>${lst(r,10)||'<i>empty</i>'}</div>`);}
 if(jobs(b)){const w=S.cols.filter(c=>c.work===b.id);L.push(`<div><b>Workers ${w.length}/${jobs(b)}</b><br>${lst(w,10)||'<i>none yet</i>'}</div>`);}
 if(b.cons>0)L.push(`<div>🏗️ Under construction${b.delivered||!trucks.length?` — ${Math.ceil(b.cons)}s`:' — waiting for a Cybertruck delivery'}</div>`);
 if(b.t==='mine')L.push(`<div>⛏️ Ore waiting: ${Math.floor(b.stock||0)}/${60*m} ${S.b.some(q=>q.t==='proc')?'— trucks haul it to the processor':'— build a 🏗️ Material Processor'}</div>`);
 if(b.t==='proc')L.push(`<div>⛏️ Ore in hopper: ${Math.floor(b.stock||0)} → 🧱 ${(d.conv*m*e).toFixed(2)}/s</div>`);
 if(b.t==='pad')L.push(`<div>${b.ship?(b.ship.ph==='ground'?`🚀 Ship waiting — leaves in ${Math.ceil(b.ship.stay)}s`:'🚀 Ship in flight'):S.tut?'Ships start after the tutorial':`Next supply ship in ~${Math.max(0,Math.ceil(b.timer))}s`}</div>`);
 const h=holdOf(b);if(h)L.push(cargoHTML(h));
 $('pbody').innerHTML=L.join('');$('pbody').querySelectorAll('.cn').forEach(el=>el.onclick=()=>{const a=agents.get(+el.dataset.c);openC(S.cols.find(c=>c.id===+el.dataset.c));});
 const u=$('pup');if(u){if(b.lvl>=5){u.textContent='⭐ Max level';u.disabled=true;}else if(upLock(b)){u.textContent=`🔒 L${b.lvl+1} at ${upLock(b)} pop`;u.disabled=true;}else{const c=upCost(b),mm=upMat(b);u.textContent=`⬆️ Upgrade to L${b.lvl+1} — ${costTxt(c,mm)}`;u.disabled=S.cr<c||S.mat<mm||b.cons>0;}}}
 else if(panel.c){const c=panel.c;if(!S.cols.includes(c)){closePanel();return;}const h=c.home&&byId(c.home),w=c.work&&byId(c.work),st=lastSt||stats(),a=agents.get(c.id);
  $('pbody').innerHTML=`<div class="sub">Colonist #${c.id}</div><div>🏠 ${h?h.name+(h.door?'':' ⚠️ no path'):'<b style="color:#f66">Homeless</b>'}</div><div>💼 ${w?w.name:'<i>Unemployed</i>'}</div>
   <div>😊 Happiness ${colHap(c)}%</div><div class="stats">🍞 Food ${S.food>0?'✅':'❌'} · 💧 Water ${S.wat>0?'✅':'❌'} · ⚡ Power ${st.pw>=st.pu?'✅':'❌'}<br>♻️ Clean ${Math.round(st.clean*100)}% · 🩺 Health ${Math.round(st.health*100)}%</div>
   <div>${a?(a.st==='walk'?`🚶 Walking to ${byId(a.dest)?.name||'…'}`:`📍 Inside ${byId(a.at)?.name||'…'}`):'(not shown on map)'}</div>`;}}
const GOOD={mat:'🧱 Materials',ore:'⛏️ Ore',rare:'💎 Rare ore'},STOCK={mat:'mat',ore:'ore',rare:'rare'};
const price=k=>PRICE[k]*S.mkt[k];const cargoValue=h=>Math.round(h.mat*price('mat')+h.ore*price('ore')+h.rare*price('rare'));
function holdOf(b){if(b.t==='ship')return b.hold||(b.hold={fuel:0,mat:0,ore:0,rare:0});if(b.t==='pad'&&b.ship&&b.ship.ph==='ground')return b.ship.hold;return null;}
function cargoHTML(h){const v=cargoValue(h),tot=h.mat+h.ore+h.rare;
 return`<div class="cargo"><b>🚀 Return flight to Earth</b><div>⛽ Fuel ${Math.floor(h.fuel)}/${TUNE.RETURN_FUEL} <button data-a="fuel" ${S.fuel>=1&&h.fuel<TUNE.RETURN_FUEL?'':'disabled'}>Refuel (${Math.floor(S.fuel)} in stock)</button></div>
 <div class="sub">Cargo hold ${tot}/${TUNE.HOLD_MAX} — sells on Earth at market price</div>
 ${Object.keys(GOOD).map(k=>`<div class="crow"><span>${GOOD[k]} <b>${h[k]}</b></span><span class="pr">¢${price(k).toFixed(1)}</span><button data-a="u" data-k="${k}" ${h[k]?'':'disabled'}>−10</button><button data-a="l" data-k="${k}" data-n="10" ${S[STOCK[k]]>=1&&tot<TUNE.HOLD_MAX?'':'disabled'}>+10</button><button data-a="l" data-k="${k}" data-n="50" ${S[STOCK[k]]>=1&&tot<TUNE.HOLD_MAX?'':'disabled'}>+50</button></div>`).join('')}
 <div>Payout on arrival: <b>¢${v+TUNE.RETURN_PAY}</b> <span class="sub">(flight ¢${TUNE.RETURN_PAY} + cargo ¢${v})</span></div>
 <button data-a="launch" class="go" ${h.fuel>=TUNE.RETURN_FUEL?'':'disabled'}>${h.fuel>=TUNE.RETURN_FUEL?'🚀 Launch return flight':`Needs ${TUNE.RETURN_FUEL} ⛽ to launch`}</button></div>`;}
function cargoAct(b,el){const h=holdOf(b);if(!h)return;const a=el.dataset.a,k=el.dataset.k,tot=h.mat+h.ore+h.rare;
 if(a==='fuel'){const n=Math.min(Math.floor(S.fuel),TUNE.RETURN_FUEL-h.fuel);S.fuel-=n;h.fuel+=n;beep(500,.05,'triangle');}
 else if(a==='l'){const n=Math.min(+el.dataset.n,Math.floor(S[STOCK[k]]),TUNE.HOLD_MAX-tot);if(n>0){S[STOCK[k]]-=n;h[k]+=n;beep(600,.04);}}
 else if(a==='u'){const n=Math.min(10,h[k]);S[STOCK[k]]+=n;h[k]-=n;beep(400,.04);}
 else if(a==='launch')launchReturn(b);renderPanel(true);}
let flyers=[];
function launchReturn(b){const h=holdOf(b);if(!h||h.fuel<TUNE.RETURN_FUEL)return;const pay=TUNE.RETURN_PAY+cargoValue(h),name=b.t==='ship'?b.name:'Supply ship from '+b.name;
 S.flights.push({t:S.t+TUNE.FLIGHT_TIME,pay,name});S.launches=(S.launches||0)+1;toast(`🚀 ${name} launched for Earth! Payout ¢${pay} on arrival (~${TUNE.FLIGHT_TIME}s)`);floatText(`🚀 ¢${pay} on the way`);
 if(b.t==='ship'){const o=objs.get(b.id),rk=o.getObjectByName('rk');const m=rocket();m.rotation.order='YXZ';m.rotation.y=rk.rotation.y;m.position.set(b.x+1,0,b.z+1);pose(m,0,0);scene.add(m);flyers.push({m,t:0,cx:b.x+1,cz:b.z+1});
  closePanel();delB(b);syncTrucks();}else{b.ship.ph='up';b.ship.t=0;b.ship.launched=1;closePanel();}
 rumble(4,.25);}
function tickFlyers(dt){flyers=flyers.filter(f=>{f.t+=dt;if(!f.d){f.d=1;dust(f.cx,f.cz,0,12);}pose(f.m,Math.pow(f.t,2)*1.6,0);const fl=f.m.getObjectByName('flame'),f2=f.m.getObjectByName('flame2');fl.visible=f2.visible=true;fl.scale.y=1.5+Math.random();
 if(f.t>5){scene.remove(f.m);return false;}return true;});}
function openM(){panel={mkt:1};const p=$('panel');p.style.display='block';ring.visible=false;p.innerHTML=`<div class="ph"><span>🌍</span><b style="flex:1">Earth Market</b><button id="pclose">✕</button></div><div id="pbody"></div>`;
 $('pclose').onclick=closePanel;$('pbody').onclick=e=>{const el=e.target.closest('button');if(!el)return;if(el.dataset.a==='order'){const c=Math.round(TUNE.ORDER_QTY*TUNE.ORDER_PRICE*S.mkt.mat);if(S.cr<c){toast('Not enough credits',1);return;}S.cr-=c;S.order+=TUNE.ORDER_QTY;toast(`📦 Ordered ${TUNE.ORDER_QTY} 🧱 — arrives with the next supply ship`);beep(700,.06);renderPanel(true);}};renderPanel(true);}
function openC(c){if(!c)return;panel={c};const p=$('panel');p.style.display='block';ring.visible=false;
 p.innerHTML=`<div class="ph"><span>👩‍🚀</span><b style="flex:1">${c.n}</b><button id="pclose">✕</button></div><div id="pbody"></div><div class="pbtn"><button id="pfol">🎥 Follow</button></div>`;
 $('pclose').onclick=closePanel;$('pfol').onclick=()=>{const a=agents.get(c.id);if(a){follow=a;zoom=Math.min(zoom,5);camUp();$('pfol').textContent='🎥 Following…';}};renderPanel();}
const upCost=b=>Math.round(B[b.t].c*(.8+.6*b.lvl));const upMat=b=>Math.round(B[b.t].m*(.6+.5*b.lvl));const upLock=b=>LVUNL[b.lvl]&&S.cols.length<LVUNL[b.lvl]?LVUNL[b.lvl]:0;
function upgrade(b){if(b.lvl>=5)return;if(upLock(b)){toast(`Level ${b.lvl+1} unlocks at ${upLock(b)} colonists`,1);return;}if(b.cons>0){toast('Still under construction',1);return;}const c=upCost(b),mm=upMat(b);if(!afford(c,mm))return;pay(c,mm);b.lvl++;const o=placeObj(b);o.scale.set(1,.3,1);o.userData.grow=.3;
 const w=o.getObjectByName('warn');if(w)w.visible=!b.door;assign();toast(`⬆️ ${b.name} upgraded to level ${b.lvl}`);beep(520,.08,'triangle',.07);setTimeout(()=>beep(780,.1,'triangle',.07),90);renderPanel();}
function bulldoze(b){if(b.t==='ship'){toast('Refuel and launch Starships home instead of bulldozing them',1);return false;}if(b.ship){toast("Can't bulldoze a pad with a ship on it",1);return false;}
 S.cr+=Math.floor(B[b.t].c*(1+(b.lvl-1)*.6)/2);S.mat+=Math.floor(B[b.t].m*(1+(b.lvl-1)*.5)/2);delB(b);beep(200,.12,'sawtooth',.05);return true;}
// ---------- input
const ray=new THREE.Raycaster(),mv=new THREE.Vector2();
let hover=null;const prev=new THREE.Mesh(new THREE.BoxGeometry(1,.12,1),new THREE.MeshBasicMaterial({color:0x00ff00,transparent:true,opacity:.42,depthWrite:false}));scene.add(prev);prev.visible=false;
function cell(cx,cy){mv.set(cx/innerWidth*2-1,-cy/innerHeight*2+1);ray.setFromCamera(mv,cam);const o=ray.ray.origin,d=ray.ray.direction;let y=0,p;
 for(let i=0;i<4;i++){const t=(y-o.y)/d.y;p=o.clone().addScaledVector(d,t);y=hgt(p.x,p.z);}return{x:Math.floor(p.x),z:Math.floor(p.z),p};}
function updPrev(){if(moving)return;if(!sel||!hover){prev.visible=false;$('info').textContent=sel?'':'Tap a building or colonist for info · pick a tool below';return;}
 const d=B[sel];let x=hover.x,z=hover.z;if(d.s===2){x=Math.round(hover.p.x-1);z=Math.round(hover.p.z-1);}hover.bx=x;hover.bz=z;
 prev.visible=true;prev.scale.set(d.s,1,d.s);prev.position.set(x+d.s/2,hgt(x+d.s/2,z+d.s/2)+.05,z+d.s/2);let ok;
 if(sel==='dozer'){const b=occ[x]?.[z];ok=!!b||walk(x,z);if(b){prev.scale.set(B[b.t].s,1,B[b.t].s);prev.position.set(b.x+B[b.t].s/2,by(b)+.05,b.z+B[b.t].s/2);}$('info').textContent=b?`Bulldoze ${b.name}`:walk(x,z)?'Drag to remove paths':'';}
 else if(d.cat==='p'){ok=x>=0&&z>=0&&x<N&&z<N&&!occ[x][z]&&!blocked[x][z];$('info').textContent=`${d.n} — free! Drag to paint (two fingers / WASD to pan)`;}
 else{const af=S.cr>=d.c&&S.mat>=d.m;ok=free(sel,x,z)&&af;const adj=ok&&near2({t:sel,x,z}).some(([a,c])=>walk(a,c));$('info').textContent=`${d.n} ${costTxt(d.c,d.m)}${S.cr<d.c?' — not enough credits':S.mat<d.m?' — not enough materials 🧱':!free(sel,x,z)?' — blocked':d.cat==='b'&&!adj?' — ⚠️ no path within 2 tiles yet':' — ✅ connected'}`;}
 prev.material.color.set(ok?0x33ff55:0xff3333);}
function paint(x,z){if(x<0||z<0||x>=N||z>=N)return;const k=TK(x,z);
 if(sel==='dozer'){if(S.tiles[k]){delete S.tiles[k];changed();}return;}
 if(S.tiles[k]||occ[x][z]||blocked[x][z])return;S.tiles[k]=1;changed();beep(300+Math.random()*80,.025,'triangle',.03);}
function changed(){refreshDoors();}
function click(){if(!sel||!hover)return;updPrev();const d=B[sel],x=hover.bx,z=hover.bz;
 if(sel==='dozer'){const b=occ[x]?.[z];if(b)bulldoze(b);}
 else if(d.cat==='b'||d.cat==='d'){if(!free(sel,x,z))return;if(!afford(d.c,d.m))return;pay(d.c,d.m);const b=addB(sel,x,z);
  if(d.cat==='b'){b.cons=CONS_T;b.consT=0;const o=objs.get(b.id);delete o.userData.grow;o.scale.y=.25;const sc=new THREE.Mesh(new THREE.BoxGeometry(d.s*.98,.9,d.s*.98),new THREE.MeshBasicMaterial({color:0xffa040,wireframe:true,transparent:true,opacity:.55}));sc.position.set(d.s/2,.45,d.s/2);sc.name='scaf';o.add(sc);}
  assign();beep(520,.07,'triangle',.07);if(d.cat==='b'&&!b.door)toast('⚠️ No path within 2 tiles — paths are free, drag one nearby');}updPrev();}
function pick(cx,cy){let best=null,bd=22;const v=new THREE.Vector3();agents.forEach(a=>{if(!a.m.visible)return;v.copy(a.m.position);v.y+=.3;v.project(cam);const sx=(v.x+1)/2*innerWidth,sy=(1-v.y)/2*innerHeight,d=Math.hypot(sx-cx,sy-cy);if(d<bd){bd=d;best=a;}});
 if(best){openC(best.c);beep(800,.04);return;}const c=cell(cx,cy);const b=c&&occ[c.x]?.[c.z];if(b){openB(b);beep(700,.04);}else closePanel();}
const ptrs=new Map();let drag=null,moved=0,pinch0=0,mid0=null,lp=null,moving=null,painting=false,lastPaint=null,follow=null;
function moveCell(c){const s=B[moving.b.t].s;return s===2?{x:Math.round(c.p.x-1),z:Math.round(c.p.z-1)}:{x:c.x,z:c.z};}
function startMove(b){if(b.t==='pad'&&b.ship){toast("Can't move a pad while a ship is on it",1);return;}closePanel();moving={b,ok:true,x:b.x,z:b.z};navigator.vibrate&&navigator.vibrate(30);beep(880,.08,'sine',.06);
 const o=objs.get(b.id);o.position.y=by(b)+.35;prev.visible=true;$('info').textContent=`Moving ${b.name} — drop on a green spot`;}
function dragMove(c){if(!c)return;const{x,z}=moveCell(c),b=moving.b,s=B[b.t].s;moving.x=x;moving.z=z;moving.ok=free(b.t,x,z,b);const o=objs.get(b.id);o.position.set(x,hgt(x+s/2,z+s/2)+.35,z);
 prev.visible=true;prev.scale.set(s,1,s);prev.position.set(x+s/2,hgt(x+s/2,z+s/2)+.05,z+s/2);prev.material.color.set(moving.ok?0x33ff55:0xff3333);}
function endMove(){const b=moving.b,o=objs.get(b.id);if(moving.ok&&!(b.t==='pad'&&b.ship)){b.x=moving.x;b.z=moving.z;beep(440,.08,'sine',.06);}else{beep(160,.15,'sawtooth',.04);toast('Invalid spot — returned',1);}
 o.position.set(b.x,by(b),b.z);rebuildOcc();moving=null;prev.visible=false;$('info').textContent='';refreshDoors();agents.forEach(a=>{if(a.dest===b.id||a.at===b.id){if(a.st==='walk'){a.st='in';a.at=a.dest;a.wait=1;}}});}
function line(a,b,f){let x=a.x,z=a.z;f(x,z);while(x!==b.x||z!==b.z){if(Math.abs(b.x-x)>=Math.abs(b.z-z))x+=Math.sign(b.x-x);else z+=Math.sign(b.z-z);f(x,z);}}
const paintTool=()=>sel==='path'||sel==='dozer';
R.domElement.addEventListener('pointerdown',e=>{ac();ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(e.button===2){sel=null;menu();updPrev();return;}
 drag={x:e.clientX,y:e.clientY};moved=0;clearTimeout(lp);
 if(ptrs.size===2){painting=false;const[a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);mid0={x:(a.x+b.x)/2,y:(a.y+b.y)/2};return;}
 if(!S||S.demo)return;const c=cell(e.clientX,e.clientY);
 if(paintTool()){painting=true;paint.warn=0;lastPaint={x:c.x,z:c.z};if(sel!=='dozer'||!occ[c.x]?.[c.z])paint(c.x,c.z);return;}
 const b=c&&occ[c.x]?.[c.z];if(b&&!sel)lp=setTimeout(()=>{if(moved<=8&&ptrs.size===1)startMove(b);},450);});
addEventListener('pointermove',e=>{if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(moving){dragMove(cell(e.clientX,e.clientY));return;}
 if(ptrs.size===2){clearTimeout(lp);const[a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};if(pinch0){zoom=Math.max(3,Math.min(48,zoom*pinch0/d));pinch0=d;pan(mid0.x-mid.x,mid0.y-mid.y);mid0=mid;camUp();}moved=99;return;}
 hover=cell(e.clientX,e.clientY);
 if(painting&&ptrs.size===1){moved+=1;if(hover.x!==lastPaint.x||hover.z!==lastPaint.z){line(lastPaint,{x:hover.x,z:hover.z},paint);lastPaint={x:hover.x,z:hover.z};}updPrev();return;}
 if(drag&&ptrs.size===1){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);if(moved>8){clearTimeout(lp);pan(-dx,-dy);}drag={x:e.clientX,y:e.clientY};}
 updPrev();});
addEventListener('pointerup',e=>{ptrs.delete(e.pointerId);clearTimeout(lp);if(moving){endMove();drag=null;return;}
 if(painting){painting=false;if(sel==='dozer'&&moved<3&&e.target===R.domElement){hover=cell(e.clientX,e.clientY);click();}drag=null;return;}
 if(drag&&moved<=8&&e.target===R.domElement&&S&&!S.demo){hover=cell(e.clientX,e.clientY);if(sel)click();else pick(e.clientX,e.clientY);}if(ptrs.size===0)drag=null;pinch0=0;});
addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);clearTimeout(lp);if(moving)endMove();painting=false;drag=null;});
R.domElement.addEventListener('contextmenu',e=>e.preventDefault());
R.domElement.addEventListener('wheel',e=>{zoom=Math.max(3,Math.min(48,zoom*(e.deltaY>0?1.1:.9)));camUp();e.preventDefault();},{passive:false});
function pan(dx,dy){follow=null;const k=zoom*2/innerHeight,ang=Math.PI/4+rot;const rx=Math.cos(ang),rz=-Math.sin(ang),fx=-Math.sin(ang),fz=-Math.cos(ang);
 tgt.x+=(dx*rx-dy*fx*1.4)*k;tgt.z+=(dx*rz-dy*fz*1.4)*k;tgt.x=Math.max(0,Math.min(N,tgt.x));tgt.z=Math.max(0,Math.min(N,tgt.z));camUp();}
const keys={};addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;keys[e.key.toLowerCase()]=1;if(e.key==='Escape'){sel=null;closePanel();menu();updPrev();}if(S&&S.demo)return;if(e.key==='q')rotT-=Math.PI/2;if(e.key==='e')rotT+=Math.PI/2;});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);
$('rotL').onclick=()=>rotT-=Math.PI/2;$('rotR').onclick=()=>rotT+=Math.PI/2;
document.querySelectorAll('#ctl [data-s]').forEach(b=>b.onclick=()=>{speed=+b.dataset.s;document.querySelectorAll('#ctl [data-s]').forEach(x=>x.classList.toggle('on',x===b));});
function save(){if(!S||S.demo)return;const d={v:5,N};['cr','mat','ore','rare','bat','food','wat','fuel','hap','t','diff','name','tiles','warned','cols','mkt','mktPrev','order','flights','tut','lastSol','launches','crewPending'].forEach(k=>d[k]=S[k]);
 d.b=S.b.map(({id,t,x,z,lvl,name,timer,hold,stock})=>({id,t,x,z,lvl,name,timer,hold,stock}));d.pop=S.cols.length;localStorage.setItem('marsOutpost',JSON.stringify(d));}
$('mktb').onclick=()=>openM();$('save').onclick=()=>{save();toast('💾 Saved');};$('newg').onclick=()=>{save();showTitle();};
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);camUp();});
// ---------- ships
function shipTick(b,dt,st){const o=objs.get(b.id);if(!o||b.cons>0)return;const base=by(b)+.09,cx=b.x+1,cz=b.z+1;
 if(!b.ship){if(S.tut)return;b.timer-=dt;if(b.timer<=0){const m=rocket();m.position.set(cx,30,cz);m.rotation.order="YXZ";m.rotation.y=Math.PI*.75+rot+(Math.random()-.5)*.6;scene.add(m);b.ship={m,ph:'land',t:0};if(!S.demo)rumble(6,.2);}return;}
 const sh=b.ship,m=sh.m,fl=m.getObjectByName('flame'),fl2=m.getObjectByName('flame2');sh.t+=dt;m.position.x=cx;m.position.z=cz;
 if(sh.ph==='land'){const r=landPose(m,sh.t);m.position.y+=base;if(r.k>.85&&!sh.dusted&&r.y<3){sh.dusted=1;dust(cx,cz,base);}
  if(sh.t>=6){pose(m,0,0);m.position.y+=base;fl.visible=fl2.visible=false;sh.ph='ground';sh.t=0;sh.stay=S.demo?6:TUNE.PAD_STAY;sh.hold={fuel:0,mat:0,ore:0,rare:0};
   const room=st.house-S.cols.length;const want=Math.round((TUNE.SHIP_CREW[0]+Math.random()*(TUNE.SHIP_CREW[1]-TUNE.SHIP_CREW[0]))*(S.hap/100+.3)*(1+S.cols.length/60));const n=Math.max(0,Math.min(room,want));
   for(let i=0;i<n;i++){const c=newCol();c.spawn=b.id;}assign();const mats=TUNE.SHIP_MAT+S.order;S.mat+=mats;const ord=S.order;S.order=0;
   if(!S.demo){toast(`🚀 Supply ship landed at ${b.name}: ${n?n+' crew':'no crew (need housing!)'} + ${mats} 🧱${ord?` (incl. your ${ord} order)`:''}`,!n);toast(`⛽ Refuel it & load cargo within ${TUNE.PAD_STAY}s for a paid return flight (tap the pad)`);}}}
 else if(sh.ph==='ground'){sh.stay-=dt;if(sh.stay<=0){const h=sh.hold;S.fuel+=h.fuel;S.mat+=h.mat;S.ore+=h.ore;S.rare+=h.rare;sh.ph='up';sh.t=0;if(!S.demo)toast(`🛫 Supply ship left ${b.name} empty — refuel ships for return-flight income`);if(panel&&panel.b===b)renderPanel(true);}}
 else{if(!sh.lift){sh.lift=1;dust(cx,cz,base,10);if(!S.demo)rumble(3,.25);}pose(m,Math.pow(sh.t,2)*1.6,0);m.position.y+=base;fl.visible=fl2.visible=true;fl.scale.y=1.5+Math.random();if(sh.t>4.5){scene.remove(m);b.ship=null;b.timer=shipInterval(b);}}}
// ---------- opening: Starships land on the soil
const SHIP_SPOTS=[[44,44],[47,42],[50,44],[42,47],[52,47]];
function tickLandings(dt){let any=false;objs.forEach((o,id)=>{const L=o.userData.land;if(!L)return;any=true;L.t+=dt;const rk=o.getObjectByName('rk');if(L.t<0){rk.visible=false;return;}
 rk.visible=true;if(!L.r){L.r=1;if(!S.demo)rumble(6,.15);}const r=landPose(rk,L.t);const b=byId(id);if(r.k>.85&&!L.d&&r.y<3&&b){L.d=1;dust(b.x+1,b.z+1,0);}
 if(L.t>=6){pose(rk,0,0);rk.getObjectByName('flame').visible=rk.getObjectByName('flame2').visible=false;delete o.userData.land;}});
 if(!any&&S.crewPending){const ships=S.b.filter(b=>b.t==='ship');for(let i=0;i<S.crewPending;i++){const c=newCol();c.spawn=ships[i%ships.length]?.id;}S.crewPending=0;assign();if(!S.tut)toast(`👩‍🚀 ${TUNE.START_CREW} crew stepped onto Mars!`);}}
// ---------- tutorial (the early game, told as a story)
const has=k=>S.b.some(b=>b.t===k&&!(b.cons>0));
const TUT=[
 {t:'Touchdown!',x:`${TUNE.START_SHIPS} Starships just landed on the Martian soil with your crew and a bare-bones start kit. Their reactors power the camp for now.`,done:()=>!S.crewPending&&S.tut.t>3},
 {t:'Home sweet dome',x:'Your crew is living in cramped ships. Place your first 🏠 Habitat near them (Build tab) and they\'ll move in.',k:'hab',done:()=>has('hab')},
 {t:'Paths are free',x:'Open the 🚶 Paths tab and drag a path from the ships to the habitat. Anything within 2 tiles of a path counts as connected.',k:'path',tab:'p',done:()=>S.b.some(b=>b.t==='hab'&&b.door)&&S.b.some(b=>b.t==='ship'&&b.door)},
 {t:'Hungry crew',x:'The ration packs won\'t last forever. Build a 🌱 Farm Dome next to your path.',k:'farm',done:()=>has('farm')},
 {t:'Thirsty plants',x:'Farms (and people) drink a lot. Dig an 🧊 Ice Extractor to melt subsurface ice into water.',k:'ice',done:()=>has('ice')},
 {t:'Grow the farm',x:'One small dome won\'t feed a colony. Tap your farm and press ⬆️ Upgrade to level 2.',arrow:'farm',done:()=>S.b.some(b=>b.t==='farm'&&b.lvl>=2)},
 {t:'Survive the night',x:'Build a 💧 Water Tank for storage, a ☀️ Solar Array, and a 🔋 Battery Farm — solar sleeps at night, batteries don\'t.',k:['wtank','solar','battery'],done:()=>has('wtank')&&has('solar')&&has('battery'),
  leave:()=>{S.mat+=150;S.cr+=300;toast('📦 The crew unpacked the last starter cargo: +150 🧱 +¢300');}},
 {t:'Open the skies',x:'Time for reinforcements. Build a 🛬 Landing Pad — supply ships will start arriving with crew and materials.',k:'pad',done:()=>has('pad')},
];
function tutWants(k){if(!S||!S.tut)return false;const st=TUT[S.tut.step];if(!st||!st.k)return false;return Array.isArray(st.k)?st.k.includes(k)&&!has(k):st.k===k;}
const tutArrow=(()=>{const g=new THREE.Group();const c=mesh(new THREE.ConeGeometry(.22,.45,12),new THREE.MeshStandardMaterial({color:0xff3fa4,emissive:0xff3fa4,emissiveIntensity:.8}),0,0,0,false);c.rotation.x=Math.PI;g.add(c);g.visible=false;scene.add(g);return g;})();
function tutTick(){const T=S.tut;T.t+=.016;const st=TUT[T.step];if(!st){endTut();return;}
 if(st.done()){if(st.leave)st.leave();T.step++;T.t=0;beep(880,.08,'triangle',.06);setTimeout(()=>beep(1320,.1,'triangle',.06),90);const nx=TUT[T.step];if(!nx){endTut();return;}tab=nx.tab||'b';if(nx.k)sel=null;menu();renderTut();}}
function endTut(){S.tut=null;$('tut').style.display='none';tutArrow.visible=false;S.b.filter(b=>b.t==='pad').forEach(b=>b.timer=Math.min(b.timer,TUNE.FIRST_SHIP_AFTER));menu();
 toast(`🎉 Tutorial complete! A supply ship arrives about every ${TUNE.SHIP_EVERY_SOL} Sols per pad.`);toast('💡 Next: ⛏️ Mine + 🏗️ Processor for materials, ⛽ Fuel Plant to refuel Starships for paid return flights (🌍 Market).');}
function renderTut(){const T=S&&S.tut,el=$('tut');if(!T||S.demo){el.style.display='none';tutArrow.visible=false;return;}const st=TUT[T.step];if(!st)return;el.style.display='block';
 const list=Array.isArray(st.k)?`<div class="tl">${st.k.map(k=>`${has(k)?'✅':'⬜'} ${B[k].ic} ${B[k].n}`).join(' &nbsp; ')}</div>`:'';
 el.innerHTML=`<div class="tt">MISSION ${T.step+1}/${TUT.length}</div><b>${st.t}</b><p>${st.x}</p>${list}<button id="tutskip">Skip tutorial</button>`;$('tutskip').onclick=()=>{if(T.step<6){S.mat+=150;S.cr+=300;}endTut();};
 const ab=st.arrow&&S.b.find(b=>b.t===st.arrow);tutArrow.visible=!!ab;if(ab){const c=bc(ab);tutArrow.position.set(c.x,1.6,c.z);tutArrow.userData.base=1.6;}}
// ---------- sim
let warnT=0,slow=0,lastSt=null;
function sim(dt){S.t+=dt;sunK=.08+.92*dayK(S.t);slow-=dt;if(slow<=0){slow=1;assign();calcDeco();syncTrucks();}const st=stats(dt);lastSt=st;S.food=Math.max(0,S.food+st.food*dt);S.wat=Math.min(st.wcap,Math.max(0,S.wat+st.wat*dt));S.fuel+=st.fuel*dt;
 S.b.forEach(b=>{const d=B[b.t],m=LV[b.lvl-1];if(b.cons>0){b.consT=(b.consT||0)+dt;if(b.delivered||!trucks.length||b.consT>TUNE.CONS_WAIT){b.cons-=dt;const o=objs.get(b.id);if(o)o.scale.y=.25+.75*Math.max(0,1-b.cons/CONS_T);if(b.cons<=0)finishCons(b);}return;}
  const e=eff(b)*st.pe;if(d.ore){const capS=60*m;b.stock=(b.stock||0)+d.ore*m*e*dt;if(b.stock>capS){S.ore+=(b.stock-capS)*.5;b.stock=capS;}}
  if(d.conv){const c=Math.min(b.stock||0,d.conv*m*e*dt);b.stock=(b.stock||0)-c;S.mat+=c;}});
 const sol=Math.floor(S.t/DAY);if(sol!==S.lastSol){S.lastSol=sol;S.mktPrev={...S.mkt};for(const k in S.mkt)S.mkt[k]=Math.max(.6,Math.min(1.6,S.mkt[k]*(1+(Math.random()-.5)*.3)+(1-S.mkt[k])*.1));}
 S.flights=S.flights.filter(f=>{if(S.t<f.t)return true;S.cr+=f.pay;toast(`🌍 ${f.name} reached Earth — cargo & flight paid +¢${f.pay}`);floatText(`+¢${f.pay}`);beep(880,.12,'triangle',.07);setTimeout(()=>beep(1175,.15,'triangle',.07),110);return false;});
 if(S.tut){S.hap=Math.max(S.hap,75);tutTick();}
 const pop=st.pop,hl=pop?S.cols.filter(c=>!c.home).length/pop:0,un=pop?S.cols.filter(c=>!c.work).length/pop:0,nc=pop?S.cols.filter(c=>{const h=c.home&&byId(c.home);return h&&!h.door;}).length/pop:0;
 let th=82-40*hl-15*un-12*nc;if(S.food<=0)th-=40;if(S.wat<=0)th-=40;if(st.pw<st.pu)th-=25;th-=20*(1-st.clean)+12*(1-st.health)+15*(1-st.safe);th+=12*st.fun+decoBonus;
 S.hap+=(Math.max(0,Math.min(100,th))-S.hap)*dt*.08;const emp=pop-Math.round(un*pop);S.cr+=(emp*.35+(pop-emp)*.12)*(S.hap/100)*dt;
 warnT-=dt;if(!S.demo&&warnT<=0&&pop>0){const w=[];if(S.food<=0)w.push('food');if(S.wat<=0)w.push('water');if(st.pw<st.pu)w.push('power');if(w.length){toast('⚠️ Shortage: '+w.join(', ')+'!',1);warnT=12;}}
 const W=S.warned;if(!S.demo){if(pop>=15&&st.clean<.8&&!W.cl){W.cl=1;toast('♻️ The colony is getting messy — build Waste Management',1);}if(pop>=20&&st.health<.8&&!W.md){W.md=1;toast('🩺 Colonists need a Medical Bay',1);}
  if(pop>=60&&st.safe<.8&&!W.sc){W.sc=1;toast('🛡️ A growing colony needs a Security Outpost',1);}}
 if(!S.demo&&!S.tut&&S.hap<25&&pop>0&&Math.random()<dt*.05){const l=Math.min(pop,1+Math.floor(pop*.05));for(let i=0;i<l;i++){const k=Math.random()*S.cols.length|0;S.cols.splice(k,1);}toast(`😠 ${l} unhappy colonist(s) left on a ship home`,1);}
 S.b.forEach(b=>b.t==='pad'&&shipTick(b,dt,st));return st;}
// ---------- day / night
function dayNight(){const t=S?S.t:0,p=dayPhase(t),k=dayK(t),D=TUNE.DAY_SPLIT;
 sun.intensity=.35+1.25*k;hemi.intensity=.42+.48*k;const sky=SKY_N.clone().lerp(SKY_DUSK,Math.min(1,k*2)).lerp(SKY_D,Math.max(0,k*2-1));
 scene.background.copy(sky);scene.fog.color.copy(sky);sun.color.setHex(0xfff0dd).lerp(new THREE.Color(0x9aa4d8),(1-k)*.7);
 const ang=p<D?(p/D)*Math.PI:Math.PI+(p-D)/(1-D)*Math.PI;const e=Math.sin(ang);
 const dir=new THREE.Vector3(Math.cos(ang)*.8,Math.max(.45,e)+.2,.45).normalize();sun.position.copy(tgt).addScaledVector(dir,45);sun.target.position.copy(tgt);
 const n=1-k;const sc=sun.shadow.camera,w=Math.min(60,zoom*2.2);if(sc.right!==w){sc.left=-w;sc.right=w;sc.top=w;sc.bottom=-w;sc.far=120;sc.updateProjectionMatrix();}
 glowMat.opacity=n*.85;poolMat.opacity=n*.4;lampMat.emissiveIntensity=.3+2.5*n;winMat.emissiveIntensity=.15+1.6*n;}
// ---------- loop
let last=performance.now(),acc=0,saveT=0;
function loop(now){const rdt=Math.min(.1,(now-last)/1000);last=now;
 if(Math.abs(rotT-rot)>.001){rot+=(rotT-rot)*Math.min(1,rdt*8);camUp();}
 const kp=8*zoom/14*rdt*40;if(!S||S.demo)keys.w=keys.a=keys.s=keys.d=0;if(keys.w||keys.arrowup)pan(0,-kp);if(keys.s||keys.arrowdown)pan(0,kp);if(keys.a||keys.arrowleft)pan(-kp,0);if(keys.d||keys.arrowright)pan(kp,0);
 if(S&&S.demo){rot+=rdt*.06;rotT=rot;camUp();}
 if(S){const dt=rdt*(S.demo?1:speed);tickPuffs(dt);let st=dt?sim(dt):stats();if(S.demo){S.food=S.wat=50;S.hap=90;}
  acc+=rdt;if(acc>.5){hud(st);syncAgents();renderPanel();renderTut();acc=0;}if(pathsDirty)rebuildPaths();if(dt){tickAgents(dt);tickTrucks(dt);tickFlyers(dt);tickLandings(dt);}if(tutArrow.visible)tutArrow.position.y=1.6+Math.abs(Math.sin(performance.now()/300))*.35;
  if(follow){if(!follow.m.visible&&follow.st!=='walk'){}else{tgt.lerp(new THREE.Vector3(follow.m.position.x,0,follow.m.position.z),Math.min(1,rdt*4));camUp();}}
  const T=performance.now()/1000;objs.forEach(o=>{if(o.userData.grow!==undefined){o.userData.grow+=rdt*3;o.scale.y=Math.min(1,o.userData.grow);if(o.userData.grow>=1){o.scale.y=1;delete o.userData.grow;}}
   if(!speed&&!S.demo)return;const sp=o.getObjectByName('spin');if(sp)sp.rotation.y+=rdt*2;const cl=o.getObjectByName('cloth');if(cl)cl.rotation.y=Math.sin(T*3+o.id)*.25;
   const stm=o.getObjectByName('steam');if(stm){stm.scale.setScalar(1+.3*Math.sin(T*2));}const fl=o.getObjectByName('flare');if(fl)fl.scale.y=.8+Math.random()*.5;});
  dayNight();saveT+=rdt;if(saveT>20&&!S.demo){save();saveT=0;}}
 R.render(scene,cam);requestAnimationFrame(loop);}
// ---------- setup / title
function clearAll(){objs.forEach(o=>scene.remove(o));objs.clear();S&&S.b.forEach(b=>b.ship&&scene.remove(b.ship.m));agents.forEach(a=>scene.remove(a.m));agents.clear();trucks.forEach(t=>scene.remove(t.m));trucks=[];
 puffs.forEach(p=>scene.remove(p));puffs=[];if(pathMesh){scene.remove(pathMesh);pathMesh=null;}closePanel();}
function roadsLine(x0,z0,x1,z1,t){x0+=OFF;z0+=OFF;x1+=OFF;z1+=OFF;line({x:x0,z:z0},{x:x1,z:z1},(x,z)=>{S.tiles[TK(x,z)]=t;});}
function seedCols(n){for(let i=0;i<n;i++)newCol();assign();}
function demo(){clearAll();S=fresh();S.demo=1;uid=1;cid=1;rebuildOcc();
 roadsLine(14,24,34,24,1);roadsLine(24,15,24,33,1);roadsLine(21,25,21,28,1);roadsLine(18,28,23,28,1);roadsLine(27,26,27,30,1);
 [['pad',20,22],['pad',28,25],['hab',22,23],['hab',22,25],['hab',25,23],['mega',30,22],['solar',16,23],['solar',17,23],['solar',16,25],['solar',17,25],['farm',19,25],['farm',20,25],['bigfarm',25,20],
  ['ice',23,27],['ice',25,27],['fuel',23,29],['refin',25,29],['ent',25,17],['reactor',21,19],['med',22,26],['mine',27,19],['mine',28,21],['proc',29,17],['wtank',23,19],['battery',18,23],['solar',16,21],['ship',30,26],['bench',20,27],['planter',22,27],['flag',23,22],['sign',26,25],['planter',19,23],['waste',26,31]
 ].forEach(([t,x,z])=>{x+=OFF;z+=OFF;rebuildOcc();if(free(t,x,z))addB(t,x,z,1);});
 S.b.filter(b=>b.t==='hab'||b.t==='mega').forEach(b=>b.lvl=b.t==='hab'?2:1);S.b.forEach(b=>placeObj(b));refreshDoors();seedCols(40);syncTrucks();syncAgents();
 agents.forEach(a=>a.wait=Math.random()*3);S.b.filter(b=>b.t==='pad').forEach((b,i)=>b.timer=1+i*8);S.b.filter(b=>b.t==='mine').forEach(b=>b.stock=30);S.t=DAY*.1;}
function migrate(d){if(d.v>=3){const sN=d.N||48,o=(N-sN)/2;if(o>0){d.b.forEach(b=>{b.x+=o;b.z+=o;});const t={};for(const k in d.tiles){const[x,z]=k.split(',').map(Number);t[TK(x+o,z+o)]=d.tiles[k];}d.tiles=t;d.grown=1;}return d;}const OO=(N-24)/2;const o=fresh(d.diff||'standard',d.name||'Olympus Base');Object.assign(o,{cr:d.cr+400,food:d.food,wat:d.wat,fuel:d.fuel,hap:d.hap,t:d.t*4});
 o.b=d.b.map(b=>({t:b.t,x:b.x+OO,z:b.z+OO,lvl:1,timer:b.timer}));o.migratedPop=d.pop||0;o.migrated=1;return o;}
function migrate4(d){if(d.v>=5)return d;const t={};for(const k in d.tiles||{})t[k]=1;d.tiles=t;const lamps=(d.b||[]).filter(b=>b.t==='lamp').length;
 d.b=(d.b||[]).filter(b=>B[b.t]&&b.t!=='lamp');d.mat=(d.mat||0)+300+d.b.length*6;d.ore=d.ore||0;d.rare=d.rare||0;d.bat=0;d.mkt={mat:1,ore:1,rare:1};d.mktPrev={...d.mkt};d.order=0;d.flights=[];d.tut=null;
 d.lastSol=Math.floor((d.t||0)/DAY);d.v=5;d.up4={lamps,roads:Object.keys(t).length};return d;}
function start(load,skipTut){clearAll();uid=1;cid=1;const sv=load&&localStorage.getItem('marsOutpost');
 if(sv){const d=migrate4(migrate(JSON.parse(sv)));S={...fresh(),...d,b:[],demo:0};S.cols=d.cols||[];S.warned=d.warned||{};S.tiles=d.tiles||{};cid=S.cols.reduce((m,c)=>Math.max(m,c.id+1),1);rebuildOcc();
  d.b.forEach(b=>{rebuildOcc();addB(b.t,b.x,b.z,1,b);});if(d.migrated){seedCols(d.migratedPop);toast('🆕 Save upgraded! Your map grew — connect buildings with 🛣️ paths & roads',1);S.cr+=0;}
  else toast(d.grown?'🗺️ Your colony map is now 4× bigger — room to expand!':`Welcome back to ${S.name}, Commander`);
  if(d.up4)toast(`🆕 Big update! Roads became free paths, light poles were removed (buildings are lit now), and you got +${300+S.b.length*6} 🧱 materials`,1);S.mkt=S.mkt||{mat:1,ore:1,rare:1};S.mktPrev=S.mktPrev||{...S.mkt};S.flights=S.flights||[];}
 else{S=fresh(selDiff,($('cname').value||'').trim().slice(0,24)||'Olympus Base');rebuildOcc();S.t=DAY*.03;
  SHIP_SPOTS.slice(0,TUNE.START_SHIPS).forEach(([x,z],i)=>{const b=addB('ship',x,z,1);b.name=['Heart of Gold','Serenity','Red Dawn','Endurance','Tranquility'][i]||('Starship '+(i+1));objs.get(b.id).userData.land={t:-i*1.4};});
  S.crewPending=TUNE.START_CREW;if(skipTut){S.mat+=150;S.cr+=300;toast('Tutorial skipped — good luck, Commander!');}else{S.tut={step:0,t:0};}
  toast(`🚀 ${TUNE.START_SHIPS} Starships inbound to ${S.name}…`);}
 refreshDoors();assign();syncTrucks();lastLock='';sel=null;tab='b';menu();$('title').style.display='none';$('ui').style.display='';rot=rotT=0;{const p=S.b.find(b=>b.t==='pad')||S.b.find(b=>b.t==='ship')||{x:N/2,z:N/2};tgt.set(p.x+2,0,p.z+2);}zoom=load?9:7;camUp();renderTut();beep(600,.1,'triangle',.07);}
const NAMES=['Olympus Base','Red Rock Station','Valles Hub','Dusty Acres','Phobos View','Jezero Junction','Rusty Ridge','Crater Cove','Tharsis Town','Ares Landing','Hellas Haven','Elon Gulch'];
let selDiff='standard';
function showTitle(){$('ui').style.display='none';$('title').style.display='flex';$('cname').value=NAMES[Math.random()*NAMES.length|0];
 const sv=localStorage.getItem('marsOutpost');if(sv){const d=JSON.parse(sv);const sol=d.v>=3?Math.floor(d.t/DAY+1):Math.floor(d.t/30+1);$('cont').style.display='';$('cont').innerHTML=`Continue: <b>${d.name||'Colony'}</b><small>Sol ${sol} · ${d.cols?d.cols.length:d.pop} colonists · ${DIFF[d.diff||'standard'].n}${d.v>=3?'':' · will be upgraded'}</small>`;}else $('cont').style.display='none';
 demo();zoom=8;tgt.set(25+OFF,0,24+OFF);camUp();}
document.querySelectorAll('#diff button').forEach(b=>b.onclick=()=>{selDiff=b.dataset.d;beep(700,.04);document.querySelectorAll('#diff button').forEach(x=>x.classList.toggle('on',x===b));});
$('reroll').onclick=()=>{$('cname').value=NAMES[Math.random()*NAMES.length|0];beep(800,.04);};
const muteUI=()=>{$('mute').textContent=$('mute2').textContent=muted?'🔇':'🔊';};
$('mute').onclick=$('mute2').onclick=()=>{muted=!muted;localStorage.setItem('marsMute',muted?'1':'0');muteUI();beep(700,.05);};muteUI();
$('howb').onclick=()=>{$('how').style.display=$('how').style.display==='block'?'none':'block';beep(700,.04);};
$('play').onclick=()=>{$('play').blur();start(false,$('skiptut').checked);};$('cont').onclick=()=>start(true);
camUp();showTitle();requestAnimationFrame(loop);
Object.assign(window,{__S:()=>S,__cam:cam,__THREE:THREE,__agents:agents,__trucks:()=>trucks,__start:start,__sel:k=>{sel=k;menu();},__hgt:hgt,__zoom:(z,x,c)=>{zoom=z;tgt.set(x,0,c);camUp();}});

;(()=>{const l=document.getElementById('loading');if(!l)return;const bar=document.getElementById('lbar'),msg=document.getElementById('lmsg');const steps=['GENERATING TERRAIN...','FUELLING STARSHIPS...','WAKING CREW...','READY!'];let i=0;const iv=setInterval(()=>{i++;bar.style.width=(i/steps.length*100)+'%';msg.textContent=steps[Math.min(i,steps.length)-1];if(i>=steps.length){clearInterval(iv);setTimeout(()=>{l.style.opacity=0;setTimeout(()=>l.remove(),600);},250);}},220);})();
window.__flyers=typeof flyers!=='undefined'?flyers:null;window.__TUT=TUT;window.__tutTick=tutTick;
Object.defineProperty(window,'__S',{get:()=>S,configurable:true});window.__cam=cam;window.__THREE=THREE;Object.defineProperty(window,"__trucks",{get:()=>trucks});Object.defineProperty(window,"__agents",{get:()=>agents});window.__start=start;window.__addB=addB;window.__objs=objs;window.__launch=launchReturn;window.__save=save;window.__setZoom=z=>{zoom=z;camUp();};window.__tgt=tgt;window.__setSel=k=>{sel=k;};
window.__build=(k,x,z)=>{const n0=S.b.length;sel=k;hover={x,z,bx:x,bz:z,p:new THREE.Vector3(x+.5,0,z+.5)};try{click();}finally{sel=null;hover=null;updPrev();}return S.b.length>n0;};
window.__paint=(x0,z0,x1,z1)=>{sel='path';line({x:x0,z:z0},{x:x1,z:z1},(x,z)=>paint(x,z));sel=null;refreshDoors();};window.__upgrade=b=>upgrade(b);
