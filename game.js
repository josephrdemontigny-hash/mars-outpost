import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const N=48,DAY=120,LV=[1,1.9,2.8];
const B={
 pad:{n:'Landing Pad',c:300,s:2,ic:'🛬',cat:'b',jobs:2,d:'Ships land here'},
 hab:{n:'Habitat',c:120,s:1,ic:'🏠',cat:'b',house:6,pw:-1,up:1,d:'Houses 6'},
 solar:{n:'Solar Array',c:80,s:1,ic:'☀️',cat:'b',pw:5,up:1,d:'+5 power'},
 farm:{n:'Farm Dome',c:150,s:1,ic:'🌱',cat:'b',food:1.2,pw:-1,wat:-.3,jobs:3,up:1,d:'+food'},
 ice:{n:'Ice Extractor',c:130,s:1,ic:'🧊',cat:'b',wat:1.2,pw:-2,jobs:2,up:1,d:'+water'},
 fuel:{n:'Fuel Plant',c:250,s:1,ic:'⛽',cat:'b',fuel:.8,pw:-3,wat:-.6,jobs:3,up:1,d:'Methane/LOX'},
 waste:{n:'Waste Management',c:350,s:1,ic:'♻️',cat:'b',waste:30,pw:-2,jobs:2,up:1,unl:15,d:'Keeps 30 clean'},
 med:{n:'Medical Bay',c:400,s:1,ic:'🩺',cat:'b',med:30,pw:-2,jobs:3,up:1,unl:20,d:'Health for 30'},
 bigfarm:{n:'Biome Farm',c:600,s:2,ic:'🌳',cat:'b',food:6,pw:-3,wat:-1.2,jobs:8,up:1,unl:30,d:'Big food'},
 ent:{n:'Entertainment Hub',c:700,s:2,ic:'🎭',cat:'b',ent:25,pw:-3,jobs:4,up:1,unl:30,d:'Fun for 25'},
 reactor:{n:'Fission Plant',c:1200,s:2,ic:'⚛️',cat:'b',pw:30,jobs:6,up:1,unl:40,d:'+30 power'},
 refin:{n:'Fuel Refinery',c:900,s:2,ic:'🏭',cat:'b',fuel:4,pw:-8,wat:-2.5,jobs:8,up:1,unl:50,d:'Lots of fuel'},
 mega:{n:'Mega Habitat',c:1000,s:2,ic:'🏙️',cat:'b',house:40,pw:-4,up:1,unl:60,d:'Houses 40'},
 sec:{n:'Security Outpost',c:900,s:2,ic:'🛡️',cat:'b',sec:40,pw:-3,jobs:5,up:1,unl:60,d:'Safety for 40'},
 path:{n:'Footpath',c:4,ic:'🚶',cat:'p',d:'Drag to paint'},
 road:{n:'Road',c:10,ic:'🛣️',cat:'p',d:'Cybertrucks drive'},
 lamp:{n:'Light Pole',c:12,s:1,ic:'💡',cat:'d',d:'Glows at night'},
 bench:{n:'Bench',c:8,s:1,ic:'🪑',cat:'d',d:'Rest stop'},
 planter:{n:'Planter',c:12,s:1,ic:'🪴',cat:'d',d:'A bit of green'},
 flag:{n:'Flag',c:15,s:1,ic:'🚩',cat:'d',d:'Colony pride'},
 sign:{n:'Signpost',c:6,s:1,ic:'🪧',cat:'d',d:'This way →'},
 dozer:{n:'Bulldoze',c:0,ic:'🚜',cat:'x',d:'Tap/drag · 50% refund'}
};
for(const k in B)B[k].s=B[k].s||1;
let S;
const DIFF={relaxed:{cr:1500,dem:.8,n:'Relaxed'},standard:{cr:1100,dem:1,n:'Standard'},hard:{cr:800,dem:1.25,n:'Hard'}};
function fresh(diff='standard',name='Olympus Base'){return{v:3,cr:DIFF[diff].cr,food:40,wat:40,fuel:0,hap:80,t:0,diff,name,tiles:{},cols:[],warned:{},b:[]};}
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
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;document.body.prepend(R.domElement);
const scene=new THREE.Scene();const SKY_D=new THREE.Color(0xd9a07a),SKY_N=new THREE.Color(0x120e22),SKY_DUSK=new THREE.Color(0x8a5a6a);
scene.background=SKY_D.clone();scene.fog=new THREE.Fog(0xd9a07a,62,135);
{const pm=new THREE.PMREMGenerator(R);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;}
let zoom=9,rot=0,rotT=0;const tgt=new THREE.Vector3(N/2,0,N/2);
const cam=new THREE.OrthographicCamera(-1,1,1,-1,0.1,400);
function camUp(){const a=innerWidth/innerHeight;cam.left=-zoom*a;cam.right=zoom*a;cam.top=zoom;cam.bottom=-zoom;cam.updateProjectionMatrix();
 const ang=Math.PI/4+rot;cam.position.set(tgt.x+Math.sin(ang)*60,48,tgt.z+Math.cos(ang)*60);cam.lookAt(tgt);}
const hemi=new THREE.HemisphereLight(0xffd8b8,0x6a2a10,.7);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0dd,1.6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0006;sun.shadow.normalBias=.02;scene.add(sun,sun.target);
// ---------- terrain
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const rnd=mulberry(7),CR=[];
for(let i=0;i<10;i++){let x,z;do{x=3+rnd()*(N-6);z=3+rnd()*(N-6);}while(Math.hypot(x-N/2,z-N/2)<13);CR.push({x,z,r:1.3+rnd()*2.2,d:.3+rnd()*.3});}
for(let i=0;i<16;i++){const a=rnd()*6.28,dd=N/2+8+rnd()*28;CR.push({x:N/2+Math.cos(a)*dd,z:N/2+Math.sin(a)*dd,r:2+rnd()*5,d:.6+rnd()*.8});}
function hgt(x,z){let h=.22*Math.sin(x*.17+1.3)*Math.cos(z*.13+.4)+.1*Math.sin(x*.41+z*.29)+.05*Math.cos(z*.63-x*.23)+.025*Math.sin(x*1.3+z*.9);
 for(const c of CR){const dx=x-c.x,dz=z-c.z,q=(dx*dx+dz*dz)/(c.r*c.r);if(q>2.6)continue;const d=Math.sqrt(q);
  h+=d<1?c.d*(.35*d**4-(1-d*d)):c.d*.35*Math.max(0,1-(d-1)/.6)**2;}
 const e=Math.max(-x,x-N,-z,z-N);if(e>0)h+=e*e*.012*(1+.5*Math.sin(x*.3)*Math.cos(z*.27));return h;}
const blocked=Array.from({length:N},(_,x)=>Array.from({length:N},(_,z)=>CR.some(c=>Math.hypot(x+.5-c.x,z+.5-c.z)<c.r*1.12)));
{const W=N+100,seg=280,tg=new THREE.PlaneGeometry(W,W,seg,seg);tg.rotateX(-Math.PI/2);tg.translate(N/2,0,N/2);
 const p=tg.attributes.position,cols=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=hgt(x,z);p.setY(i,h);
  const n=.5+.5*Math.sin(x*.9+Math.cos(z*.7)*2)*Math.cos(z*1.1-x*.3),sp=Math.random()*.08;let k=.82+n*.12+sp;
  let r=.58*k,g=.25*k,b=.13*k;if(h<-.08){const f=Math.min(1,-h*1.5);r*=1-.25*f;g*=1-.3*f;b*=1-.2*f;}if(h>.12&&h<.6){r*=1.06;g*=1.08;}
  cols.push(r,g,b);}
 tg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));tg.computeVertexNormals();
 const ground=new THREE.Mesh(tg,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.97,metalness:0,envMapIntensity:.05}));ground.receiveShadow=true;scene.add(ground);}
{const rg=new THREE.DodecahedronGeometry(1,0),rm=new THREE.MeshStandardMaterial({color:0x6e2c16,roughness:.95,envMapIntensity:.3,flatShading:true});
 const peb=new THREE.InstancedMesh(rg,rm,1400),big=new THREE.InstancedMesh(rg,rm,220),d=new THREE.Object3D();big.castShadow=true;big.receiveShadow=true;
 for(let i=0;i<1400;i++){const x=-20+Math.random()*(N+40),z=-20+Math.random()*(N+40);d.position.set(x,hgt(x,z),z);d.rotation.set(Math.random()*3,Math.random()*3,0);d.scale.set(1,.6,1).multiplyScalar(.025+Math.random()*.045);d.updateMatrix();peb.setMatrixAt(i,d.matrix);}
 let i=0;while(i<220){const x=-25+Math.random()*(N+50),z=-25+Math.random()*(N+50);const inMap=x>=0&&z>=0&&x<N&&z<N;if(inMap&&!blocked[x|0][z|0])continue;
  d.position.set(x,hgt(x,z),z);d.rotation.set(Math.random()*3,Math.random()*3,0);d.scale.set(1,.55+Math.random()*.3,1).multiplyScalar(.12+Math.random()*(inMap?.25:.6));d.updateMatrix();big.setMatrixAt(i++,d.matrix);}
 scene.add(peb,big);}
// grid overlay following terrain
const gridLines=(()=>{const pts=[];for(let i=0;i<=N;i++)for(let j=0;j<N*2;j++){const a=j/2,b=(j+1)/2;pts.push(i,hgt(i,a)+.03,a,i,hgt(i,b)+.03,b,a,hgt(a,i)+.03,i,b,hgt(b,i)+.03,i);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x5a1f0a,transparent:true,opacity:.22}));l.visible=false;scene.add(l);return l;})();
// ---------- materials & models
const M=(c,r=.7,m=.05,e={})=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,envMapIntensity:.45,...e});
const MAT={white:M(0xeeeae4,.5,.05),steel:M(0xc8ccd2,.3,.85,{envMapIntensity:1}),dark:M(0x3a3a3e,.6,.3),orange:M(0xe0782e,.55,.1),green:M(0x3fae4d,.8),leaf:M(0x2f8a3c,.85),
 trunk:M(0x6b4a2e,.9),concrete:M(0x8c857e,.9),panel:M(0x1b2c6e,.25,.6,{envMapIntensity:1.2}),blue:M(0x4a6fa5,.5,.2),red:M(0xd23a2a,.6),yellow:M(0xf2c230,.6),gold:M(0xd4a017,.25,.9),soil:M(0x5a3a22,1)};
const glass=new THREE.MeshPhysicalMaterial({color:0xbfe8ff,transparent:true,opacity:.38,roughness:.05,metalness:0,envMapIntensity:1.3,depthWrite:false});
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
function model(t,lvl=1){const g=new THREE.Group(),s=B[t].s,h=s/2,L=lvl;
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
const SH_H=3.4;
function rocket(){const outer=new THREE.Group(),g=new THREE.Group();outer.add(g);g.position.y=0; // g centered at ship middle
 const st=new THREE.MeshStandardMaterial({color:0xe4e7ec,metalness:.9,roughness:.25,envMapIntensity:1.4});const blk=M(0x1a1a1a);const H=SH_H,r=.32;
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
function dust(x,z,y0=0,n=14){for(let i=0;i<n;i++){const m=new THREE.Mesh(puffG,new THREE.MeshLambertMaterial({color:0xc07a50,transparent:true,opacity:.7}));
 const a=Math.random()*6.28;m.position.set(x,y0+.2,z);m.userData.v=new THREE.Vector3(Math.cos(a)*(1.5+Math.random()*2),.3+Math.random()*.6,Math.sin(a)*(1.5+Math.random()*2));m.userData.life=1.6;scene.add(m);puffs.push(m);}}
function tickPuffs(dt){puffs=puffs.filter(m=>{m.userData.life-=dt;m.position.addScaledVector(m.userData.v,dt);m.userData.v.multiplyScalar(1-dt*1.5);m.scale.setScalar(1+(1.6-m.userData.life)*1.5);
 m.material.opacity=Math.max(0,m.userData.life/1.6*.7);if(m.userData.life<=0){scene.remove(m);m.material.dispose();return false;}return true;});}
// ship pose: y = bottom height, tilt 0 upright .. PI/2 horizontal
function pose(m,y,tilt){const g=m.userData.g;m.rotation.x=-tilt;g.position.y=0;m.position.y=y+SH_H/2*Math.cos(tilt)+0.3*Math.sin(tilt)+.1;}
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
// ---------- state helpers
let occ=[];const objs=new Map();let uid=1,cid=1;const D4=[[1,0],[-1,0],[0,1],[0,-1]];
const TK=(x,z)=>x+','+z;const tile=(x,z)=>S.tiles[TK(x,z)]||0;const walk=(x,z)=>tile(x,z)>0;const isRoad=(x,z)=>tile(x,z)===2;
function rebuildOcc(){occ=Array.from({length:N},()=>Array(N).fill(null));S.b.forEach(b=>{for(let i=0;i<B[b.t].s;i++)for(let j=0;j<B[b.t].s;j++)if(occ[b.x+i])occ[b.x+i][b.z+j]=b;});}
function free(t,x,z,ign){const s=B[t].s;if(x<0||z<0||x+s>N||z+s>N)return false;for(let i=0;i<s;i++)for(let j=0;j<s;j++){const o=occ[x+i][z+j];if((o&&o!==ign)||blocked[x+i][z+j]||tile(x+i,z+j))return false;}return true;}
const bc=b=>({x:b.x+B[b.t].s/2,z:b.z+B[b.t].s/2});
const by=b=>{const c=bc(b);const s=B[b.t].s;let m=1e9;for(const[dx,dz]of[[0,0],[-.4,-.4],[.4,.4],[-.4,.4],[.4,-.4]])m=Math.min(m,hgt(c.x+dx*s,c.z+dz*s));return m-.02;};
const cap=b=>Math.round((B[b.t].house||0)*LV[b.lvl-1]);const jobs=b=>Math.round((B[b.t].jobs||0)*LV[b.lvl-1]);
const isDeco=t=>B[t].cat==='d';
function defName(t){let n=1;const used=new Set(S.b.filter(b=>b.t===t).map(b=>b.name));while(used.has(B[t].n+' '+n))n++;return B[t].n+' '+n;}
function placeObj(b){const old=objs.get(b.id);if(old)scene.remove(old);const o=model(b.t,b.lvl);o.position.set(b.x,by(b),b.z);scene.add(o);objs.set(b.id,o);
 if(!isDeco(b.t)){const w=new THREE.Sprite(warnMat);w.scale.set(.45,.45,.45);w.position.set(B[b.t].s/2,1.1+B[b.t].s*.3,B[b.t].s/2);w.renderOrder=9;w.name='warn';w.visible=false;o.add(w);}
 doorModel(b);return o;}
function addB(t,x,z,silent,extra={}){const b={t,x,z,id:extra.id||uid++,lvl:extra.lvl||1,name:extra.name||null,ship:null,timer:extra.timer};uid=Math.max(uid,b.id+1);if(!b.name)b.name=defName(t);
 S.b.push(b);rebuildOcc();if(t==='pad'&&b.timer==null)b.timer=8+Math.random()*6;const o=placeObj(b);if(!silent){o.scale.set(1,.01,1);o.userData.grow=0;}refreshDoors();return b;}
function delB(b){S.b=S.b.filter(x=>x!==b);const o=objs.get(b.id);scene.remove(o);objs.delete(b.id);if(b.ship)scene.remove(b.ship.m);
 S.cols.forEach(c=>{if(c.home===b.id)c.home=null;if(c.work===b.id)c.work=null;});agents.forEach(a=>{if(a.at===b.id||a.dest===b.id){a.st='in';a.at=null;a.m.visible=false;}});rebuildOcc();refreshDoors();}
const byId=id=>S.b.find(b=>b.id===id);
// ---------- doors / connectivity
function perim(b){const s=B[b.t].s,o=[];for(let i=0;i<s;i++){o.push([b.x+i,b.z+s],[b.x+s,b.z+i],[b.x+i,b.z-1],[b.x-1,b.z+i]);}return o.filter(([x,z])=>x>=0&&z>=0&&x<N&&z<N);}
function refreshDoors(){S.b.forEach(b=>{if(isDeco(b.t))return;const p=perim(b);const prevD=b.door;let d=p.find(([x,z])=>prevD&&x===prevD.x&&z===prevD.z&&walk(x,z));
 if(!d)d=p.find(([x,z])=>walk(x,z));b.door=d?{x:d[0],z:d[1]}:null;const r=p.find(([x,z])=>isRoad(x,z));b.rdoor=r?{x:r[0],z:r[1]}:null;
 if(!prevD!==!b.door||(prevD&&b.door&&(prevD.x!==b.door.x||prevD.z!==b.door.z)))doorModel(b);const o=objs.get(b.id);const w=o&&o.getObjectByName('warn');if(w)w.visible=!b.door;});pathsDirty=true;}
function doorModel(b){const o=objs.get(b.id);if(!o)return;const old=o.getObjectByName('door');if(old)o.remove(old);if(!b.door||b.t==='pad'||b.t==='solar'||isDeco(b.t))return;
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
// ---------- A* pathfinding on path/road tiles
function astar(s,t,ok){if(!s||!t)return null;const K=(x,z)=>x*N+z,tk=K(t.x,t.z),g=new Map(),from=new Map(),open=[[0,s.x,s.z]];g.set(K(s.x,s.z),0);let it=0;
 while(open.length&&it++<6000){let mi=0;for(let i=1;i<open.length;i++)if(open[i][0]<open[mi][0])mi=i;const[,x,z]=open[mi];open[mi]=open[open.length-1];open.pop();const k=K(x,z);
  if(k===tk){const p=[];let c=k;while(c!==undefined){p.push({x:(c/N)|0,z:c%N});c=from.get(c);}return p.reverse();}
  const gc=g.get(k);for(const[dx,dz]of D4){const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=N||nz>=N||!ok(nx,nz))continue;const nk=K(nx,nz),ng=gc+(isRoad(nx,nz)?.9:1);if(g.has(nk)&&g.get(nk)<=ng)continue;g.set(nk,ng);from.set(nk,k);open.push([ng+Math.abs(nx-t.x)+Math.abs(nz-t.z),nx,nz]);}}
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
function edgePos(b,door){const c=bc(b);return new THREE.Vector3((c.x+door.x+.5)/2,0,(c.z+door.z+.5)/2);}
function leisure(){const l=S.b.filter(b=>b.door&&(b.t==='ent'||b.t==='farm'||b.t==='bigfarm'||b.t==='med'||b.t==='pad'));return l.length?l[Math.random()*l.length|0]:null;}
function tickAgents(dt){agents.forEach(a=>{const u=a.m.userData,c=a.c;
 if(a.st==='in'){a.m.visible=false;a.wait-=dt;if(a.wait>0)return;const at=a.at&&byId(a.at);const home=c.home&&byId(c.home);if(!at){a.at=c.home;a.wait=3;return;}
  let dest=at.id!==c.home?home:(c.work&&c.work!==c.home&&Math.random()<.8?byId(c.work):leisure());if(!dest||dest===at||!at.door||!dest.door){a.wait=4+Math.random()*4;return;}
  const p=astar(at.door,dest.door,walk);if(!p){a.wait=5;return;}a.path=p;a.pi=0;a.dest=dest.id;a.st='walk';const e=edgePos(at,at.door);a.m.position.set(e.x,hgt(e.x,e.z),e.z);a.m.visible=true;a.endp=edgePos(dest,dest.door);return;}
 const last=a.pi>=a.path.length;let tx,tz;if(last){tx=a.endp.x;tz=a.endp.z;}else{const n=a.path[a.pi];if(!walk(n.x,n.z)){a.st='in';a.at=a.dest;a.wait=2;return;}
  const prv=a.pi>0?a.path[a.pi-1]:n,nx=a.path[a.pi+1]||n;let dx=nx.x-prv.x,dz=nx.z-prv.z;const l=Math.hypot(dx,dz)||1;tx=n.x+.5-dz/l*a.off;tz=n.z+.5+dx/l*a.off;}
 const p=a.m.position,vx=tx-p.x,vz=tz-p.z,d=Math.hypot(vx,vz),sp=.75*dt;
 if(d<=sp){p.x=tx;p.z=tz;if(last){a.st='in';a.at=a.dest;a.wait=a.at===c.home?5+Math.random()*8:7+Math.random()*10;}else a.pi++;}
 else{p.x+=vx/d*sp;p.z+=vz/d*sp;a.m.rotation.y=Math.atan2(vx,vz);}u.ph+=dt*9;limbs(u,1);p.y=hgt(p.x,p.z)+.02+Math.abs(Math.sin(u.ph))*.02;});}
// ---------- Cybertrucks
let trucks=[];
function truckModel(){const g=new THREE.Group();const sh=new THREE.Shape();sh.moveTo(-.46,.07);sh.lineTo(.46,.07);sh.lineTo(.48,.17);sh.lineTo(.06,.33);sh.lineTo(-.46,.23);sh.lineTo(-.46,.07);
 const geo=new THREE.ExtrudeGeometry(sh,{depth:.36,bevelEnabled:false});geo.translate(0,0,-.18);geo.rotateY(-Math.PI/2);geo.computeVertexNormals();
 const body=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0xc9ccd0,metalness:.9,roughness:.32,envMapIntensity:1.2,flatShading:true}));body.castShadow=true;g.add(body);
 const gl=new THREE.Mesh(new THREE.PlaneGeometry(.34,.2),M(0x111418,.1,.6,{side:THREE.DoubleSide}));gl.position.set(0,.262,.27);gl.rotation.x=-Math.PI/2+.36;g.add(gl);
 const wg=cyl(.075,.075,.06,12);wg.rotateZ(Math.PI/2);[[.17,.3],[-.17,.3],[.17,-.29],[-.17,-.29]].forEach(([x,z])=>g.add(mesh(wg,MAT.dark,x,.075,z,false)));
 g.add(mesh(new THREE.BoxGeometry(.34,.012,.012),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:2}),0,.17,.475,false));
 g.add(mesh(new THREE.BoxGeometry(.34,.012,.012),new THREE.MeshStandardMaterial({color:0xff2020,emissive:0xff2020,emissiveIntensity:1.5}),0,.2,-.465,false));return g;}
function roadCount(){let n=0;for(const k in S.tiles)if(S.tiles[k]===2)n++;return n;}
function syncTrucks(){const rc=roadCount(),want=rc>=3?Math.min(6,1+Math.floor(rc/14)):0;
 while(trucks.length>want)scene.remove(trucks.pop().m);
 while(trucks.length<want){const keys=Object.keys(S.tiles).filter(k=>S.tiles[k]===2);const [x,z]=keys[Math.random()*keys.length|0].split(',').map(Number);
  const m=truckModel();m.position.set(x+.5,hgt(x+.5,z+.5),z+.5);scene.add(m);trucks.push({m,path:null,wait:Math.random()*2,cur:{x,z}});}}
function truckTrip(t,goal,cargo){const p=astar(t.cur,goal,isRoad);if(p&&p.length>1){t.path=p;t.pi=1;t.cargo=cargo||null;return true;}return false;}
function tickTrucks(dt){trucks.forEach(t=>{if(!isRoad(t.cur.x,t.cur.z)){const keys=Object.keys(S.tiles).filter(k=>S.tiles[k]===2);if(!keys.length)return;const[x,z]=keys[0].split(',').map(Number);t.cur={x,z};t.m.position.set(x+.5,0,z+.5);t.path=null;}
 if(!t.path){t.wait-=dt;if(t.wait>0)return;t.wait=2+Math.random()*3;const ends=S.b.filter(b=>b.rdoor);
  if(ends.length>=2&&Math.random()<.75){truckTrip(t,ends[Math.random()*ends.length|0].rdoor,Math.random()<.5?'cargo':'crew');}
  else{const keys=Object.keys(S.tiles).filter(k=>S.tiles[k]===2);const[x,z]=keys[Math.random()*keys.length|0].split(',').map(Number);truckTrip(t,{x,z},'patrol');}return;}
 if(t.pi>=t.path.length){t.path=null;t.wait=1.5+Math.random()*3;return;}const n=t.path[t.pi];if(!isRoad(n.x,n.z)){t.path=null;return;}
 const pv=t.path[t.pi-1];const dx=n.x-pv.x,dz=n.z-pv.z;const tx=n.x+.5-dz*.19,tz=n.z+.5+dx*.19;const p=t.m.position;const vx=tx-p.x,vz=tz-p.z,d=Math.hypot(vx,vz);
 let sp=1.7*dt;const hx=Math.sin(t.m.rotation.y),hz=Math.cos(t.m.rotation.y);for(const o of trucks){if(o===t)continue;const ox=o.m.position.x-p.x,oz=o.m.position.z-p.z,od=Math.hypot(ox,oz);if(od<.75&&(ox*hx+oz*hz)/od>.7&&(o.m.position.x*0+1)){sp=0;t.blockT=(t.blockT||0)+dt;if(t.blockT>3){sp=1.7*dt;}break;}}
 if(sp>0&&t.blockT)t.blockT=Math.max(0,t.blockT-dt);
 if(d<=sp||d<.02){t.cur=n;t.pi++;}else{p.x+=vx/d*sp;p.z+=vz/d*sp;let ta=Math.atan2(vx,vz),da=ta-t.m.rotation.y;da=Math.atan2(Math.sin(da),Math.cos(da));t.m.rotation.y+=da*Math.min(1,dt*8);}
 p.y=hgt(p.x,p.z);});}
// ---------- stats
function eff(b){const j=jobs(b);if(!j)return 1;return b.door?.35+.65*Math.min(1,(b.wk||0)/j):.3;}
let decoBonus=0;
function stats(){let pw=0,pu=0,house=0,food=0,wat=0,fuel=0,waste=0,med=0,ent=0,sec=0;
 S.b.forEach(b=>{const d=B[b.t],m=LV[b.lvl-1],e=eff(b);if(d.pw>0)pw+=d.pw*m*e;else if(d.pw)pu-=d.pw*m;house+=cap(b);});
 const pe=pu?Math.min(1,pw/pu):1;
 S.b.forEach(b=>{const d=B[b.t],m=LV[b.lvl-1],e=eff(b)*pe;food+=d.food>0?d.food*m*e:(d.food||0)*m;wat+=d.wat>0?d.wat*m*e:(d.wat||0)*m;fuel+=(d.fuel||0)*m*e;
  waste+=(d.waste||0)*m*e;med+=(d.med||0)*m*e;ent+=(d.ent||0)*m*e;sec+=(d.sec||0)*m*e;});
 const pop=S.cols.length,dem=DIFF[S.diff||'standard'].dem;food-=pop*.12*dem;wat-=pop*.1*dem;
 const clean=pop<15?1:Math.min(1,waste/pop),health=pop<20?1:Math.min(1,med/pop),fun=pop?Math.min(1,ent/pop):0,safe=pop<60?1:Math.min(1,sec/pop);
 return{pw:Math.round(pw*10)/10,pu:Math.round(pu*10)/10,pe,house,food,wat,fuel,clean,health,fun,safe,pop};}
function calcDeco(){let n=0;S.b.forEach(b=>{if(!isDeco(b.t))return;for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)if(walk(b.x+i,b.z+j)){n++;return;}});decoBonus=Math.min(10,n*25/(S.cols.length+10));}
// ---------- UI
const $=id=>document.getElementById(id);let sel=null,speed=1,tab='b';
function toast(m,w){if(S&&S.demo)return;const d=document.createElement('div');d.className='t'+(w?' w':'');d.textContent=m;$('toasts').prepend(d);setTimeout(()=>d.remove(),4000);while($('toasts').children.length>5)$('toasts').lastChild.remove();}
function tip(k,el){const d=B[k],t=$('tip'),f=(v,u)=>v?`<div>${v>0?'+':''}${v} ${u}</div>`:'';
 t.innerHTML=`<b>${d.ic} ${d.n}</b>${d.c?` — ¢${d.c}${d.cat==='p'?'/tile':''}`:''}${f(d.pw,'⚡ power')}${f(d.food,'🍞 food/s')}${f(d.wat,'💧 water/s')}${f(d.fuel,'⛽ fuel/s')}${d.house?`<div>🏠 houses ${d.house}</div>`:''}${d.jobs?`<div>👷 ${d.jobs} jobs</div>`:''}${d.waste?`<div>♻️ cleans for ${d.waste}</div>`:''}${d.med?`<div>🩺 care for ${d.med}</div>`:''}${d.ent?`<div>🎭 fun for ${d.ent}</div>`:''}${d.sec?`<div>🛡️ safety for ${d.sec}</div>`:''}
 <div style="opacity:.8">${d.d}${d.cat==='b'?` · ${d.s}×${d.s}`:''}${d.up?' · upgradable to L3':''}${d.unl?` · unlocks at ${d.unl} pop`:''}</div><div style="opacity:.6;font-size:11px">${d.cat==='b'?'Needs a path next to it · hold a building to move it':d.cat==='d'?'Next to paths: boosts happiness':d.cat==='p'?'Drag across the ground to paint':''}</div>`;
 const r=el.getBoundingClientRect();t.style.display='block';t.style.left=Math.max(4,Math.min(innerWidth-224,r.left))+'px';t.style.bottom=(innerHeight-r.top+6)+'px';}
function menu(){const m=$('menu');m.innerHTML='';const pop=S?S.cols.length:0;
 [['b','🏗️ Build'],['p','🛣️ Paths'],['d','🌷 Decor']].forEach(([k,l])=>{const e=document.createElement('div');e.className='tab'+(tab===k?' on':'');e.textContent=l;e.onclick=()=>{tab=k;beep(650,.03);menu();};m.appendChild(e);});
 Object.entries(B).filter(([k,d])=>d.cat===tab||d.cat==='x').forEach(([k,d])=>{const e=document.createElement('div');const lock=d.unl&&pop<d.unl;
  e.className='b'+(sel===k?' sel':'')+(lock?' lock':'');e.innerHTML=`${d.ic} ${d.n}<small>${lock?'🔒 '+d.unl+' pop':(d.c?'¢'+d.c:'')+' '+(d.cat==='b'?d.d:'')}</small>`;
  e.onpointerenter=()=>tip(k,e);e.onpointerleave=()=>$('tip').style.display='none';
  e.onclick=()=>{beep(700,.04);tip(k,e);if(lock){toast(`Unlocks at ${d.unl} colonists`);return;}sel=sel===k?null:k;closePanel();menu();updPrev();};m.appendChild(e);});
 gridLines.visible=!!sel;}
let lastLock='';
function clock(){const p=((S.t/DAY)+.3)%1;const h=Math.floor(p*24),mm=Math.floor((p*24-h)*60/10)*10;return`${h<6||h>=19?'🌙':'☀️'} ${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;}
function hud(st){if(S.demo)return;const f=v=>(v>=0?'+':'')+v.toFixed(1);const pop=st.pop,hl=S.cols.filter(c=>!c.home).length,un=S.cols.filter(c=>!c.work).length;
 const items=[['🏴',S.name],['💰',Math.floor(S.cr)],['👩‍🚀',`${pop}/${st.house}`],['⚡',`${st.pw}/${st.pu}`,st.pw<st.pu],['🍞',`${Math.floor(S.food)} (${f(st.food)})`,S.food<5&&st.food<0],
 ['💧',`${Math.floor(S.wat)} (${f(st.wat)})`,S.wat<5&&st.wat<0],['⛽',Math.floor(S.fuel)],['😊',Math.round(S.hap)+'%',S.hap<40]];
 if(pop>=10)items.push(['♻️',Math.round(st.clean*100)+'%',st.clean<.7]);if(pop>=20)items.push(['🩺',Math.round(st.health*100)+'%',st.health<.7]);
 if(pop>=25)items.push(['🎭',Math.round(st.fun*100)+'%']);if(pop>=55)items.push(['🛡️',Math.round(st.safe*100)+'%',st.safe<.7]);
 if(hl)items.push(['🏚️',hl+' homeless',1]);if(un>2)items.push(['💼',un+' jobless']);items.push(['📅',`Sol ${Math.floor(S.t/DAY+1)} ${clock()}`]);
 $('hud').innerHTML=items.map(([i,v,b])=>`<span class="r${b?' bad':''}${i==='🏴'?' nm':''}">${i} ${v}</span>`).join('');
 const l=Object.keys(B).filter(k=>B[k].unl&&pop>=B[k].unl).join();if(l!==lastLock){if(lastLock!==''&&l.length>lastLock.length)toast('🔓 New building unlocked!');lastLock=l;menu();}}
// ---------- info panels
let panel=null;const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.62,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffd166,transparent:true,opacity:.9,depthTest:false}));ring.renderOrder=8;ring.visible=false;scene.add(ring);
function closePanel(){panel=null;$('panel').style.display='none';ring.visible=false;follow=null;}
function openB(b){panel={b};const p=$('panel');p.style.display='block';
 p.innerHTML=`<div class="ph"><span>${B[b.t].ic}</span><input id="bname" maxlength="28"><button id="pclose">✕</button></div><div id="pbody"></div><div class="pbtn">${B[b.t].up?'<button id="pup"></button>':''}${b.t!=='pad'||!b.ship?'<button id="pdoz">🚜 Bulldoze</button>':''}</div><div class="hint">✋ Press &amp; hold the building to move it</div>`;
 $('bname').value=b.name;$('bname').oninput=e=>{b.name=e.target.value.slice(0,28)||defName(b.t);};$('bname').onkeydown=e=>e.stopPropagation();$('pclose').onclick=()=>{closePanel();beep(500,.03);};
 if($('pup'))$('pup').onclick=()=>upgrade(b);if($('pdoz'))$('pdoz').onclick=()=>{bulldoze(b);closePanel();};
 const s=B[b.t].s;ring.geometry.dispose();ring.geometry=new THREE.RingGeometry(s*.62,s*.62+.07,40).rotateX(-Math.PI/2);ring.position.set(b.x+s/2,by(b)+.06,b.z+s/2);ring.visible=true;renderPanel();}
function renderPanel(){if(!panel)return;if(panel.b){const b=panel.b;if(!S.b.includes(b)){closePanel();return;}const d=B[b.t],m=LV[b.lvl-1],e=eff(b),L=[];
 L.push(`<div class="sub">${d.n}${d.up?` · Level ${b.lvl}/3`:''} · ${b.door?'✅ Connected':isDeco(b.t)?'🌷 Decoration':'<b style="color:#ffcc33">⚠️ Not connected — build a path next to it</b>'}</div>`);
 const out=[];if(d.pw>0)out.push(`⚡ +${(d.pw*m*e).toFixed(1)} power`);if(d.pw<0)out.push(`⚡ uses ${(-d.pw*m).toFixed(1)}`);if(d.food>0)out.push(`🍞 +${(d.food*m*e).toFixed(2)}/s`);if(d.wat>0)out.push(`💧 +${(d.wat*m*e).toFixed(2)}/s`);
 if(d.wat<0)out.push(`💧 uses ${(-d.wat*m).toFixed(1)}/s`);if(d.fuel)out.push(`⛽ +${(d.fuel*m*e).toFixed(2)}/s`);['waste','med','ent','sec'].forEach(k=>{if(d[k])out.push(`${B[k==='waste'?'waste':k].ic} serves ${Math.round(d[k]*m*e)}`);});
 if(jobs(b))out.push(`📈 efficiency ${Math.round(e*100)}%`);if(out.length)L.push(`<div class="stats">${out.join('<br>')}</div>`);
 const lst=(arr,max)=>arr.slice(0,max).map(c=>`<span class="cn" data-c="${c.id}">${c.n}</span>`).join(', ')+(arr.length>max?` +${arr.length-max} more`:'');
 if(cap(b)){const r=S.cols.filter(c=>c.home===b.id);L.push(`<div><b>Residents ${r.length}/${cap(b)}</b><br>${lst(r,10)||'<i>empty</i>'}</div>`);}
 if(jobs(b)){const w=S.cols.filter(c=>c.work===b.id);L.push(`<div><b>Workers ${w.length}/${jobs(b)}</b><br>${lst(w,10)||'<i>none yet</i>'}</div>`);}
 if(b.t==='pad')L.push(`<div>${b.ship?'🚀 Ship on pad':`Next ship in ~${Math.max(0,Math.ceil(b.timer))}s`}</div>`);
 $('pbody').innerHTML=L.join('');$('pbody').querySelectorAll('.cn').forEach(el=>el.onclick=()=>{const a=agents.get(+el.dataset.c);openC(S.cols.find(c=>c.id===+el.dataset.c));});
 const u=$('pup');if(u){if(b.lvl>=3){u.textContent='⭐ Max level';u.disabled=true;}else{const c=upCost(b);u.textContent=`⬆️ Upgrade to L${b.lvl+1} — ¢${c}`;u.disabled=S.cr<c;}}}
 else if(panel.c){const c=panel.c;if(!S.cols.includes(c)){closePanel();return;}const h=c.home&&byId(c.home),w=c.work&&byId(c.work),st=lastSt||stats(),a=agents.get(c.id);
  $('pbody').innerHTML=`<div class="sub">Colonist #${c.id}</div><div>🏠 ${h?h.name+(h.door?'':' ⚠️ no path'):'<b style="color:#f66">Homeless</b>'}</div><div>💼 ${w?w.name:'<i>Unemployed</i>'}</div>
   <div>😊 Happiness ${colHap(c)}%</div><div class="stats">🍞 Food ${S.food>0?'✅':'❌'} · 💧 Water ${S.wat>0?'✅':'❌'} · ⚡ Power ${st.pw>=st.pu?'✅':'❌'}<br>♻️ Clean ${Math.round(st.clean*100)}% · 🩺 Health ${Math.round(st.health*100)}%</div>
   <div>${a?(a.st==='walk'?`🚶 Walking to ${byId(a.dest)?.name||'…'}`:`📍 Inside ${byId(a.at)?.name||'…'}`):'(not shown on map)'}</div>`;}}
function openC(c){if(!c)return;panel={c};const p=$('panel');p.style.display='block';ring.visible=false;
 p.innerHTML=`<div class="ph"><span>👩‍🚀</span><b style="flex:1">${c.n}</b><button id="pclose">✕</button></div><div id="pbody"></div><div class="pbtn"><button id="pfol">🎥 Follow</button></div>`;
 $('pclose').onclick=closePanel;$('pfol').onclick=()=>{const a=agents.get(c.id);if(a){follow=a;zoom=Math.min(zoom,5);camUp();$('pfol').textContent='🎥 Following…';}};renderPanel();}
const upCost=b=>Math.round(B[b.t].c*(b.lvl===1?1.2:2));
function upgrade(b){if(b.lvl>=3)return;const c=upCost(b);if(S.cr<c){toast('Not enough credits',1);beep(160,.15,'sawtooth',.04);return;}S.cr-=c;b.lvl++;const o=placeObj(b);o.scale.set(1,.3,1);o.userData.grow=.3;
 const w=o.getObjectByName('warn');if(w)w.visible=!b.door;assign();toast(`⬆️ ${b.name} upgraded to level ${b.lvl}`);beep(520,.08,'triangle',.07);setTimeout(()=>beep(780,.1,'triangle',.07),90);renderPanel();}
function bulldoze(b){if(b.ship){toast("Can't bulldoze a pad with a ship on it",1);return false;}if(b.t==='pad'&&S.b.filter(q=>q.t==='pad').length===1){toast('Keep at least one landing pad!',1);return false;}
 S.cr+=Math.floor(B[b.t].c*(1+(b.lvl-1)*.8)/2);delB(b);beep(200,.12,'sawtooth',.05);return true;}
// ---------- input
const ray=new THREE.Raycaster(),mv=new THREE.Vector2();
let hover=null;const prev=new THREE.Mesh(new THREE.BoxGeometry(1,.12,1),new THREE.MeshBasicMaterial({color:0x00ff00,transparent:true,opacity:.42,depthWrite:false}));scene.add(prev);prev.visible=false;
function cell(cx,cy){mv.set(cx/innerWidth*2-1,-cy/innerHeight*2+1);ray.setFromCamera(mv,cam);const o=ray.ray.origin,d=ray.ray.direction;let y=0,p;
 for(let i=0;i<4;i++){const t=(y-o.y)/d.y;p=o.clone().addScaledVector(d,t);y=hgt(p.x,p.z);}return{x:Math.floor(p.x),z:Math.floor(p.z),p};}
function updPrev(){if(moving)return;if(!sel||!hover){prev.visible=false;$('info').textContent=sel?'':'Tap a building or colonist for info · pick a tool below';return;}
 const d=B[sel];let x=hover.x,z=hover.z;if(d.s===2){x=Math.round(hover.p.x-1);z=Math.round(hover.p.z-1);}hover.bx=x;hover.bz=z;
 prev.visible=true;prev.scale.set(d.s,1,d.s);prev.position.set(x+d.s/2,hgt(x+d.s/2,z+d.s/2)+.05,z+d.s/2);let ok;
 if(sel==='dozer'){const b=occ[x]?.[z];ok=!!b||walk(x,z);if(b){prev.scale.set(B[b.t].s,1,B[b.t].s);prev.position.set(b.x+B[b.t].s/2,by(b)+.05,b.z+B[b.t].s/2);}$('info').textContent=b?`Bulldoze ${b.name}`:walk(x,z)?'Drag to remove paths':'';}
 else if(d.cat==='p'){ok=x>=0&&z>=0&&x<N&&z<N&&!occ[x][z]&&!blocked[x][z];$('info').textContent=`${d.n} ¢${d.c}/tile — drag to paint (two fingers / WASD to pan)`;}
 else{ok=free(sel,x,z)&&S.cr>=d.c;const adj=ok&&perim({t:sel,x,z}).some(([a,c])=>walk(a,c));$('info').textContent=`${d.n} ¢${d.c}${S.cr<d.c?' — not enough credits':!free(sel,x,z)?' — blocked':d.cat==='b'&&!adj?' — ⚠️ no path here yet':' — ✅ next to path'}`;}
 prev.material.color.set(ok?0x33ff55:0xff3333);}
function paint(x,z){if(x<0||z<0||x>=N||z>=N)return;const k=TK(x,z);
 if(sel==='dozer'){if(S.tiles[k]){S.cr+=Math.floor(B[S.tiles[k]===2?'road':'path'].c/2);delete S.tiles[k];changed();}return;}
 const t=sel==='road'?2:1;if(S.tiles[k]===t||occ[x][z]||blocked[x][z])return;const c=B[sel].c;if(S.cr<c){if(!paint.warn){toast('Not enough credits',1);paint.warn=1;}return;}S.cr-=c;S.tiles[k]=t;changed();beep(300+Math.random()*80,.025,'triangle',.03);}
function changed(){refreshDoors();syncTrucks();}
function click(){if(!sel||!hover)return;updPrev();const d=B[sel],x=hover.bx,z=hover.bz;
 if(sel==='dozer'){const b=occ[x]?.[z];if(b)bulldoze(b);}
 else if(d.cat==='b'||d.cat==='d'){if(!free(sel,x,z))return;if(S.cr<d.c){toast('Not enough credits',1);beep(160,.15,'sawtooth',.04);return;}S.cr-=d.c;const b=addB(sel,x,z);assign();beep(520,.07,'triangle',.07);if(d.cat==='b'&&!b.door)toast('⚠️ Connect it with a path so colonists can reach it');}updPrev();}
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
const paintTool=()=>sel==='path'||sel==='road'||sel==='dozer';
R.domElement.addEventListener('pointerdown',e=>{ac();ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(e.button===2){sel=null;menu();updPrev();return;}
 drag={x:e.clientX,y:e.clientY};moved=0;clearTimeout(lp);
 if(ptrs.size===2){painting=false;const[a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);mid0={x:(a.x+b.x)/2,y:(a.y+b.y)/2};return;}
 if(!S||S.demo)return;const c=cell(e.clientX,e.clientY);
 if(paintTool()){painting=true;paint.warn=0;lastPaint={x:c.x,z:c.z};if(sel!=='dozer'||!occ[c.x]?.[c.z])paint(c.x,c.z);return;}
 const b=c&&occ[c.x]?.[c.z];if(b&&!sel)lp=setTimeout(()=>{if(moved<=8&&ptrs.size===1)startMove(b);},450);});
addEventListener('pointermove',e=>{if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(moving){dragMove(cell(e.clientX,e.clientY));return;}
 if(ptrs.size===2){clearTimeout(lp);const[a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};if(pinch0){zoom=Math.max(3,Math.min(30,zoom*pinch0/d));pinch0=d;pan(mid0.x-mid.x,mid0.y-mid.y);mid0=mid;camUp();}moved=99;return;}
 hover=cell(e.clientX,e.clientY);
 if(painting&&ptrs.size===1){moved+=1;if(hover.x!==lastPaint.x||hover.z!==lastPaint.z){line(lastPaint,{x:hover.x,z:hover.z},paint);lastPaint={x:hover.x,z:hover.z};}updPrev();return;}
 if(drag&&ptrs.size===1){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);if(moved>8){clearTimeout(lp);pan(-dx,-dy);}drag={x:e.clientX,y:e.clientY};}
 updPrev();});
addEventListener('pointerup',e=>{ptrs.delete(e.pointerId);clearTimeout(lp);if(moving){endMove();drag=null;return;}
 if(painting){painting=false;if(sel==='dozer'&&moved<3&&e.target===R.domElement){hover=cell(e.clientX,e.clientY);click();}drag=null;return;}
 if(drag&&moved<=8&&e.target===R.domElement&&S&&!S.demo){hover=cell(e.clientX,e.clientY);if(sel)click();else pick(e.clientX,e.clientY);}if(ptrs.size===0)drag=null;pinch0=0;});
addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);clearTimeout(lp);if(moving)endMove();painting=false;drag=null;});
R.domElement.addEventListener('contextmenu',e=>e.preventDefault());
R.domElement.addEventListener('wheel',e=>{zoom=Math.max(3,Math.min(30,zoom*(e.deltaY>0?1.1:.9)));camUp();e.preventDefault();},{passive:false});
function pan(dx,dy){follow=null;const k=zoom*2/innerHeight,ang=Math.PI/4+rot;const rx=Math.cos(ang),rz=-Math.sin(ang),fx=-Math.sin(ang),fz=-Math.cos(ang);
 tgt.x+=(dx*rx-dy*fx*1.4)*k;tgt.z+=(dx*rz-dy*fz*1.4)*k;tgt.x=Math.max(0,Math.min(N,tgt.x));tgt.z=Math.max(0,Math.min(N,tgt.z));camUp();}
const keys={};addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;keys[e.key.toLowerCase()]=1;if(e.key==='Escape'){sel=null;closePanel();menu();updPrev();}if(S&&S.demo)return;if(e.key==='q')rotT-=Math.PI/2;if(e.key==='e')rotT+=Math.PI/2;});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);
$('rotL').onclick=()=>rotT-=Math.PI/2;$('rotR').onclick=()=>rotT+=Math.PI/2;
document.querySelectorAll('#ctl [data-s]').forEach(b=>b.onclick=()=>{speed=+b.dataset.s;document.querySelectorAll('#ctl [data-s]').forEach(x=>x.classList.toggle('on',x===b));});
function save(){if(!S||S.demo)return;const d={v:3,cr:S.cr,food:S.food,wat:S.wat,fuel:S.fuel,hap:S.hap,t:S.t,diff:S.diff,name:S.name,tiles:S.tiles,warned:S.warned,cols:S.cols,
 b:S.b.map(({id,t,x,z,lvl,name,timer})=>({id,t,x,z,lvl,name,timer})),pop:S.cols.length};localStorage.setItem('marsOutpost',JSON.stringify(d));}
$('save').onclick=()=>{save();toast('💾 Saved');};$('newg').onclick=()=>{save();showTitle();};
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);camUp();});
// ---------- ships
function shipTick(b,dt,st){const o=objs.get(b.id);if(!o)return;const base=by(b)+.09,cx=b.x+1,cz=b.z+1;
 if(!b.ship){b.timer-=dt;if(b.timer<=0){const m=rocket();m.position.set(cx,30,cz);m.rotation.order="YXZ";m.rotation.y=Math.PI/4+rot+(Math.random()-.5)*.6;scene.add(m);b.ship={m,ph:'land',t:0};if(!S.demo)rumble(6,.2);}return;}
 const sh=b.ship,m=sh.m,fl=m.getObjectByName('flame'),fl2=m.getObjectByName('flame2');sh.t+=dt;m.position.x=cx;m.position.z=cz;
 const fv=v=>{fl.visible=fl2.visible=v;fl.scale.y=1+Math.random()*.5;fl2.scale.y=1+Math.random()*.3;};const P=(y,t)=>{pose(m,y,t);m.position.y+=base;};
 if(sh.ph==='land'){const T=6,k=Math.min(1,sh.t/T);const y=30*Math.pow(1-k,1.6);const fk=Math.min(1,Math.max(0,(k-.68)/.17));const tilt=Math.PI/2*(1-fk*fk*(3-2*fk))+(fk<1?Math.sin(sh.t*3)*.05:0);
  P(y,tilt);fv(k>.66);if(k>.85&&!sh.dusted&&y<3){sh.dusted=1;dust(cx,cz,base);}
  if(sh.t>=T){P(0,0);fv(false);sh.ph='ground';sh.t=0;const room=st.house-S.cols.length;const want=Math.round((3+Math.random()*4)*(S.hap/100+.3)*(1+S.cols.length/60));const n=Math.max(0,Math.min(room,want));
   for(let i=0;i<n;i++){const c=newCol();c.spawn=b.id;}assign();S.cr+=n*15;
   if(n){const hs=S.b.filter(h=>h.rdoor&&cap(h));const tr=trucks.find(t=>!t.path);if(tr&&b.rdoor&&hs.length){const h=hs[Math.random()*hs.length|0];if(truckTrip(tr,b.rdoor,'colonists'))tr.next={goal:h.rdoor,name:h.name};}}
   if(!S.demo)toast(n?`🚀 Ship landed at ${b.name} — ${n} colonists arrived!`:room<=0?'🚀 Ship landed but no housing — colonists stayed aboard!':'🚀 Ship landed — nobody wanted to stay 😕',!n);}}
 else if(sh.ph==='ground'){if(sh.t>=4){sh.ph='up';sh.t=0;const buy=Math.min(Math.floor(S.fuel),20+Math.floor(S.cols.length/3));if(buy>0&&!S.demo){S.fuel-=buy;S.cr+=buy*12;toast(`⛽ Sold ${buy} fuel to departing ship: +¢${buy*12}`);}}}
 else{if(!sh.lift){sh.lift=1;dust(cx,cz,base,10);if(!S.demo)rumble(3,.25);}P(Math.pow(sh.t,2)*1.6,0);fv(true);fl.scale.y=1.5+Math.random();if(sh.t>4){scene.remove(m);b.ship=null;b.timer=Math.max(14,40-S.cols.length/4)+Math.random()*10;}}}
// ---------- sim
let warnT=0,slow=0,lastSt=null;
function sim(dt){S.t+=dt;slow-=dt;if(slow<=0){slow=1;assign();calcDeco();}const st=stats();lastSt=st;S.food=Math.max(0,S.food+st.food*dt);S.wat=Math.max(0,S.wat+st.wat*dt);S.fuel+=st.fuel*dt;
 const pop=st.pop,hl=pop?S.cols.filter(c=>!c.home).length/pop:0,un=pop?S.cols.filter(c=>!c.work).length/pop:0,nc=pop?S.cols.filter(c=>{const h=c.home&&byId(c.home);return h&&!h.door;}).length/pop:0;
 let th=82-40*hl-15*un-12*nc;if(S.food<=0)th-=40;if(S.wat<=0)th-=40;if(st.pw<st.pu)th-=25;th-=20*(1-st.clean)+12*(1-st.health)+15*(1-st.safe);th+=12*st.fun+decoBonus;
 S.hap+=(Math.max(0,Math.min(100,th))-S.hap)*dt*.08;const emp=pop-Math.round(un*pop);S.cr+=(emp*.35+(pop-emp)*.12)*(S.hap/100)*dt;
 warnT-=dt;if(!S.demo&&warnT<=0&&pop>0){const w=[];if(S.food<=0)w.push('food');if(S.wat<=0)w.push('water');if(st.pw<st.pu)w.push('power');if(w.length){toast('⚠️ Shortage: '+w.join(', ')+'!',1);warnT=12;}}
 const W=S.warned;if(!S.demo){if(pop>=15&&st.clean<.8&&!W.cl){W.cl=1;toast('♻️ The colony is getting messy — build Waste Management',1);}if(pop>=20&&st.health<.8&&!W.md){W.md=1;toast('🩺 Colonists need a Medical Bay',1);}
  if(pop>=60&&st.safe<.8&&!W.sc){W.sc=1;toast('🛡️ A growing colony needs a Security Outpost',1);}}
 if(!S.demo&&S.hap<25&&pop>0&&Math.random()<dt*.05){const l=Math.min(pop,1+Math.floor(pop*.05));for(let i=0;i<l;i++){const k=Math.random()*S.cols.length|0;S.cols.splice(k,1);}toast(`😠 ${l} unhappy colonist(s) left on a ship home`,1);}
 S.b.forEach(b=>b.t==='pad'&&shipTick(b,dt,st));return st;}
// ---------- day / night
function dayNight(){const p=((S?S.t:0)/DAY+.3)%1,a=(p-.25)*Math.PI*2,el=Math.sin(a+Math.PI/2*0)*1;const e=Math.sin((p-.25)*Math.PI*2);// e: 1 noon, -1 midnight
 const k=THREE.MathUtils.clamp(e*1.8+.5,0,1);sun.intensity=.05+2*k;hemi.intensity=.12+.6*k;const sky=SKY_N.clone().lerp(SKY_DUSK,Math.min(1,k*2)).lerp(SKY_D,Math.max(0,k*2-1));
 scene.background.copy(sky);scene.fog.color.copy(sky);sun.color.setHSL(.08,.6,.55+.35*k);const ang=p*Math.PI*2;
 const dir=new THREE.Vector3(Math.cos(ang)*.7,Math.max(.35,e)+.2,Math.sin(ang)*.5+.4).normalize();sun.position.copy(tgt).addScaledVector(dir,45);sun.target.position.copy(tgt);
 const sc=sun.shadow.camera,w=zoom*2.2;if(sc.right!==w){sc.left=-w;sc.right=w;sc.top=w;sc.bottom=-w;sc.far=120;sc.updateProjectionMatrix();}
 const n=1-k;glowMat.opacity=n*.9;poolMat.opacity=n*.55;lampMat.emissiveIntensity=.2+3*n;winMat.emissiveIntensity=n*1.6;R.toneMappingExposure=1-.1*n;}
// ---------- loop
let last=performance.now(),acc=0,saveT=0;
function loop(now){const rdt=Math.min(.1,(now-last)/1000);last=now;
 if(Math.abs(rotT-rot)>.001){rot+=(rotT-rot)*Math.min(1,rdt*8);camUp();}
 const kp=8*zoom/14*rdt*40;if(!S||S.demo)keys.w=keys.a=keys.s=keys.d=0;if(keys.w||keys.arrowup)pan(0,-kp);if(keys.s||keys.arrowdown)pan(0,kp);if(keys.a||keys.arrowleft)pan(-kp,0);if(keys.d||keys.arrowright)pan(kp,0);
 if(S&&S.demo){rot+=rdt*.06;rotT=rot;camUp();}
 if(S){const dt=rdt*(S.demo?1:speed);tickPuffs(dt);let st=dt?sim(dt):stats();if(S.demo){S.food=S.wat=50;S.hap=90;}
  acc+=rdt;if(acc>.5){hud(st);syncAgents();renderPanel();acc=0;}if(pathsDirty)rebuildPaths();if(dt){tickAgents(dt);tickTrucks(dt);trucks.forEach(t=>{if(!t.path&&t.next){truckTrip(t,t.next.goal,'colonists');if(!S.demo)toast(`🚙 Cybertruck shuttling new colonists to ${t.next.name}`);t.next=null;}});}
  if(follow){if(!follow.m.visible&&follow.st!=='walk'){}else{tgt.lerp(new THREE.Vector3(follow.m.position.x,0,follow.m.position.z),Math.min(1,rdt*4));camUp();}}
  const T=performance.now()/1000;objs.forEach(o=>{if(o.userData.grow!==undefined){o.userData.grow+=rdt*3;o.scale.y=Math.min(1,o.userData.grow);if(o.userData.grow>=1){o.scale.y=1;delete o.userData.grow;}}
   if(!speed&&!S.demo)return;const sp=o.getObjectByName('spin');if(sp)sp.rotation.y+=rdt*2;const cl=o.getObjectByName('cloth');if(cl)cl.rotation.y=Math.sin(T*3+o.id)*.25;
   const stm=o.getObjectByName('steam');if(stm){stm.scale.setScalar(1+.3*Math.sin(T*2));}const fl=o.getObjectByName('flare');if(fl)fl.scale.y=.8+Math.random()*.5;});
  dayNight();saveT+=rdt;if(saveT>20&&!S.demo){save();saveT=0;}}
 R.render(scene,cam);requestAnimationFrame(loop);}
// ---------- setup / title
function clearAll(){objs.forEach(o=>scene.remove(o));objs.clear();S&&S.b.forEach(b=>b.ship&&scene.remove(b.ship.m));agents.forEach(a=>scene.remove(a.m));agents.clear();trucks.forEach(t=>scene.remove(t.m));trucks=[];
 puffs.forEach(p=>scene.remove(p));puffs=[];if(pathMesh){scene.remove(pathMesh);pathMesh=null;}closePanel();}
function roadsLine(x0,z0,x1,z1,t){line({x:x0,z:z0},{x:x1,z:z1},(x,z)=>{S.tiles[TK(x,z)]=t;});}
function seedCols(n){for(let i=0;i<n;i++)newCol();assign();}
function demo(){clearAll();S=fresh();S.demo=1;uid=1;cid=1;rebuildOcc();
 roadsLine(14,24,34,24,2);roadsLine(24,15,24,33,2);roadsLine(21,25,21,28,1);roadsLine(18,28,23,28,1);roadsLine(27,26,27,30,1);
 [['pad',20,22],['pad',28,25],['hab',22,23],['hab',22,25],['hab',25,23],['mega',30,22],['solar',16,23],['solar',17,23],['solar',16,25],['solar',17,25],['farm',19,25],['farm',20,25],['bigfarm',25,20],
  ['ice',23,27],['ice',25,27],['fuel',23,29],['refin',25,29],['ent',25,17],['reactor',21,19],['med',22,26],['lamp',23,19],['lamp',23,30],['lamp',29,23],['lamp',18,23],['lamp',26,27],['bench',20,27],['planter',22,27],['flag',23,22],['sign',26,25],['planter',19,23],['lamp',15,25],['waste',26,31]
 ].forEach(([t,x,z])=>{rebuildOcc();if(free(t,x,z))addB(t,x,z,1);});
 S.b.filter(b=>b.t==='hab'||b.t==='mega').forEach(b=>b.lvl=b.t==='hab'?2:1);S.b.forEach(b=>placeObj(b));refreshDoors();seedCols(40);syncTrucks();syncAgents();
 agents.forEach(a=>a.wait=Math.random()*3);S.b.filter(b=>b.t==='pad').forEach((b,i)=>b.timer=1+i*6);S.t=DAY*.05;}
function migrate(d){if(d.v>=3)return d;const o=fresh(d.diff||'standard',d.name||'Olympus Base');Object.assign(o,{cr:d.cr+400,food:d.food,wat:d.wat,fuel:d.fuel,hap:d.hap,t:d.t*4});
 o.b=d.b.map(b=>({t:b.t,x:b.x+12,z:b.z+12,lvl:1,timer:b.timer}));o.migratedPop=d.pop||0;o.migrated=1;return o;}
function start(load){clearAll();uid=1;cid=1;const sv=load&&localStorage.getItem('marsOutpost');
 if(sv){const d=migrate(JSON.parse(sv));S={...fresh(),...d,b:[],demo:0};S.cols=d.cols||[];S.warned=d.warned||{};S.tiles=d.tiles||{};cid=S.cols.reduce((m,c)=>Math.max(m,c.id+1),1);rebuildOcc();
  d.b.forEach(b=>{rebuildOcc();addB(b.t,b.x,b.z,1,b);});if(d.migrated){seedCols(d.migratedPop);toast('🆕 Save upgraded! Your map grew — connect buildings with 🛣️ paths & roads',1);S.cr+=0;}
  else toast(`Welcome back to ${S.name}, Commander`);}
 else{S=fresh(selDiff,($('cname').value||'').trim().slice(0,24)||'Olympus Base');rebuildOcc();roadsLine(19,24,28,24,2);roadsLine(25,25,25,27,1);
  addB('pad',21,22,1);addB('hab',24,23,1);addB('solar',26,23,1);addB('lamp',23,25,1);S.b[0].timer=6;S.t=DAY*.05;
  toast('Welcome to Mars! Build next to paths so colonists can reach work.');toast('First ship arrives soon…');}
 refreshDoors();assign();syncTrucks();lastLock='';sel=null;tab='b';menu();$('title').style.display='none';$('ui').style.display='';rot=rotT=0;tgt.set(N/2,0,N/2);zoom=9;camUp();beep(600,.1,'triangle',.07);}
const NAMES=['Olympus Base','Red Rock Station','Valles Hub','Dusty Acres','Phobos View','Jezero Junction','Rusty Ridge','Crater Cove','Tharsis Town','Ares Landing','Hellas Haven','Elon Gulch'];
let selDiff='standard';
function showTitle(){$('ui').style.display='none';$('title').style.display='flex';$('cname').value=NAMES[Math.random()*NAMES.length|0];
 const sv=localStorage.getItem('marsOutpost');if(sv){const d=JSON.parse(sv);const sol=d.v>=3?Math.floor(d.t/DAY+1):Math.floor(d.t/30+1);$('cont').style.display='';$('cont').innerHTML=`Continue: <b>${d.name||'Colony'}</b><small>Sol ${sol} · ${d.cols?d.cols.length:d.pop} colonists · ${DIFF[d.diff||'standard'].n}${d.v>=3?'':' · will be upgraded'}</small>`;}else $('cont').style.display='none';
 demo();zoom=8;tgt.set(25,0,24);camUp();}
document.querySelectorAll('#diff button').forEach(b=>b.onclick=()=>{selDiff=b.dataset.d;beep(700,.04);document.querySelectorAll('#diff button').forEach(x=>x.classList.toggle('on',x===b));});
$('reroll').onclick=()=>{$('cname').value=NAMES[Math.random()*NAMES.length|0];beep(800,.04);};
const muteUI=()=>{$('mute').textContent=$('mute2').textContent=muted?'🔇':'🔊';};
$('mute').onclick=$('mute2').onclick=()=>{muted=!muted;localStorage.setItem('marsMute',muted?'1':'0');muteUI();beep(700,.05);};muteUI();
$('howb').onclick=()=>{$('how').style.display=$('how').style.display==='block'?'none':'block';beep(700,.04);};
$('play').onclick=()=>start(false);$('cont').onclick=()=>start(true);
camUp();showTitle();requestAnimationFrame(loop);
Object.assign(window,{__S:()=>S,__cam:cam,__THREE:THREE,__agents:agents,__trucks:()=>trucks,__start:start,__sel:k=>{sel=k;menu();},__hgt:hgt,__zoom:(z,x,c)=>{zoom=z;tgt.set(x,0,c);camUp();}});
