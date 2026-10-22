import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const N=384,NW=96,CS=.25,OFF=96,DAY=120,LV=[1,1.8,2.6,3.4,4.2],LVUNL=[0,0,20,40,70];
// ===== TUNING (easy to tweak) =====
const TUNE={CONS_WAIT:15,
 SHIP_EVERY_SOL:1.5,   // average Sols between supply ships per landing pad (1 Sol = DAY seconds at 1x)
 PAD_LVL_BONUS:.3,     // each pad level above 1 makes ships this much more frequent
 FIRST_SHIP_AFTER:35,  // seconds after the first pad is built until the first supply ship
 PAD_STAY:90,          // seconds a supply ship waits on the pad for you to refuel/load it before leaving empty
 SHIP_MAT:60,          // building materials every supply ship brings
 SHIP_CREW:[2,5],      // crew per supply ship (min,max) — more with happiness & colony size
 RETURN_FUEL:80,      // fuel needed for a return flight to Earth
 RETURN_PAY:350,       // base payment for a completed return flight
 FLIGHT_TIME:45,       // seconds until a returning ship reaches Earth and cargo is sold
 HOLD_MAX:200,         // cargo hold size (units)
 ORDER_QTY:100,ORDER_PRICE:3, // material shipment you can order: qty, ¢ per unit
 TRUCK_LOAD:20,        // ore per Cybertruck trip
 DAY_SPLIT:.75,        // fraction of each Sol that is daylight
 START_CREW:6,LAND_GAP:75,  // min seconds between any two Starship landings (ships never arrive together)
 START_SHIPS:1
};
const PRICE={mat:6,ore:2,rare:30}; // Earth base prices (¢ per unit), market multiplier drifts each Sol
const B={
 pad:{n:'Landing Pad',c:300,m:150,s:2,ic:'🛬',cat:'b',jobs:2,d:'Supply ships land here'},
 hab:{n:'Habitat',c:120,m:40,s:1,ic:'🏠',cat:'b',house:6,pw:-1,d:'Houses 6 · built-in roof solar + battery power it'},
 solar:{n:'Solar Array',c:80,m:25,s:1,ic:'☀️',cat:'b',pw:5,d:'+5 power (day)'},
 battery:{n:'Battery Farm',c:150,m:50,s:1,ic:'🔋',cat:'b',bat:150,d:'Stores power for night (habitats have their own)'},
 farm:{n:'Farm Dome',c:150,m:40,s:1,ic:'🌱',cat:'b',food:1.2,pw:-1,wat:-.3,jobs:3,d:'+food'},
 ice:{n:'Ice Extractor',c:100,m:35,s:1,ic:'🧊',cat:'b',wat:2,pw:-2,jobs:2,d:'+water'},
 wtank:{n:'Water Tank',c:90,m:30,s:1,ic:'💧',cat:'b',wcap:250,d:'+250 water storage'},
 recyc:{n:'Water Recycler',c:140,m:45,s:1,ic:'🚰',cat:'b',wat:1.5,pw:-1,jobs:1,d:'+water, recycles'},
 mine:{n:'Regolith Mine',c:160,m:30,s:1,ic:'⛏️',cat:'b',ore:.6,pw:-2,jobs:2,d:'Digs ore (trucks haul it)'},
 proc:{n:'Material Processor',c:300,m:60,s:2,ic:'🏗️',cat:'b',conv:.8,pw:-3,jobs:3,d:'Ore → building materials'},
 fuel:{n:'Fuel Plant',c:250,m:70,s:1,ic:'⛽',cat:'b',fuel:1.2,pw:-3,wat:-.6,jobs:3,d:'Methane/LOX (water+power)'},
 waste:{n:'Waste Management',c:350,m:90,s:1,ic:'♻️',cat:'b',waste:30,pw:-2,jobs:2,unl:15,d:'Keeps 30 clean'},
 med:{n:'Medical Bay',c:400,m:100,s:1,ic:'🩺',cat:'b',med:30,pw:-2,jobs:3,unl:20,d:'Health for 30'},
 bigfarm:{n:'Biome Farm',c:600,m:160,s:2,ic:'🌳',cat:'b',food:6,pw:-3,wat:-1.2,jobs:8,unl:30,d:'Big food'},
 hydro:{n:'Hydroponics Tower',c:220,m:60,s:1,ic:'🥬',cat:'b',food:2,pw:-2,wat:-.4,jobs:3,d:'Stacked grow rings under LED light: food from one tile'},
 gdome:{n:'Greenhouse Dome',c:450,m:120,s:2,ic:'🍅',cat:'b',food:4.5,pw:-2,wat:-.9,jobs:5,d:'Glass dome of tomatoes, beans and potatoes in sunlight'},
 algae:{n:'Algae Bioreactor',c:260,m:70,s:1,ic:'🧪',cat:'b',food:2.4,pw:-2,wat:-.6,jobs:2,d:'Spirulina vats: protein + a little oxygen'},
 insect:{n:'Insect Protein Farm',c:500,m:120,p:8,s:1,ic:'🦗',cat:'b',food:3.2,pw:-2,wat:-.2,jobs:3,d:'Cricket & mealworm modules: dense protein, little water'},
 aqua:{n:'Aquaponics Tanks',c:700,m:180,p:15,s:2,ic:'🐟',cat:'b',food:6,pw:-3,wat:-1.4,jobs:6,d:'Tilapia tanks feed the grow beds; beds clean the water'},
 bigdome:{n:'Grand Greenhouse',c:1600,m:420,p:40,s:3,ic:'🌿',cat:'b',food:14,pw:-6,wat:-3,jobs:14,ent:8,d:'3×3 crop dome — a green park under glass (+a little fun)'},
 ent:{n:'Entertainment Hub',c:700,m:180,s:2,ic:'🎭',cat:'b',ent:25,pw:-3,jobs:4,unl:30,d:'Fun for 25'},
 reactor:{n:'Fission Plant',c:1200,m:300,s:2,ic:'⚛️',cat:'b',pw:30,jobs:6,unl:40,d:'+30 power'},
 refin:{n:'Fuel Refinery',c:900,m:240,s:2,ic:'🏭',cat:'b',fuel:4,pw:-8,wat:-2.5,jobs:8,unl:50,d:'Lots of fuel'},
 mega:{n:'Mega Habitat',c:1000,m:260,s:2,ic:'🏙️',cat:'b',house:40,pw:-4,unl:60,d:'Houses 40'},
 complex:{n:'Habitat Complex',c:2200,m:520,p:50,s:3,ic:'🏘️',cat:'b',house:90,pw:-6,d:'3×3 block of linked habitat modules · houses 90 · roof solar'},
 arco:{n:'Arcology',c:5000,m:1200,p:150,s:4,ic:'🌆',cat:'b',house:220,ent:20,pw:-12,jobs:10,d:'4×4 terraced mega-structure for a chartered town · houses 220'},
 sec:{n:'Security Outpost',c:900,m:220,s:2,ic:'🛡️',cat:'b',sec:40,pw:-3,jobs:5,unl:60,d:'Safety for 40'},
 robot:{n:'Optimus Bay',c:400,m:120,s:1,ic:'🤖',cat:'b',bots:2,pw:-4,jobs:2,unl:10,d:'Assembles Optimus robots from shipped kits (they need power, not food)'},ship:{n:'Starship',c:0,m:0,s:2,ic:'🚀',cat:'z',pw:15,d:'Landed Starship'},
 garage:{n:'Rover Garage',c:600,m:160,s:2,ic:'🚙',cat:'b',pw:-2,jobs:3,d:'Builds pressurized rovers for exploration missions'},
 lab:{n:'Research Lab',c:700,m:180,s:2,ic:'🔬',cat:'b',rp:.12,pw:-3,jobs:4,d:'Generates research points for tech upgrades'},
 lpad:{n:'Launch Pad',c:900,m:240,s:2,ic:'🛰️',cat:'b',pw:-2,jobs:3,d:'Call Earth: request a ship of materials, parts or colonists'},
 factory:{n:'Parts Factory',c:800,m:200,s:2,ic:'⚙️',cat:'b',parts:.25,pw:-5,jobs:6,d:'2 🧱 → 1 ⚙️ part (advanced buildings need parts)'},
 medc:{n:'Med Center',c:900,m:220,p:20,s:2,ic:'🏥',cat:'b',med:90,pw:-3,jobs:6,d:'Health for 90 · makes families safer'},
 school:{n:'School',c:500,m:140,p:10,s:1,ic:'🏫',cat:'b',rp:.03,ent:10,pw:-2,jobs:3,d:'Kids learn, colony is happier (+research)'},
 drill:{n:'Deep Drill Rig',c:1100,m:260,p:40,s:2,ic:'🛢️',cat:'b',ore:3,pw:-6,jobs:4,site:['iron','rare'],d:'Huge ore yield — must sit on a surveyed iron/rare deposit'},
 icefield:{n:'Remote Ice Rig',c:900,m:200,p:30,s:2,ic:'❄️',cat:'b',rstock:1.6,pw:-3,jobs:3,site:['ice'],d:'Mines a remote ice field; rovers haul the water home'},
 kilo:{n:'Kilopower Reactor',c:1300,m:200,p:60,s:1,ic:'☢️',cat:'b',pw:12,d:'+12 steady fission power, day & night, storms or not'},
 outpost:{n:'Satellite Outpost',c:1500,m:300,p:50,s:2,ic:'🏕️',cat:'b',house:10,rp:.05,pw:-2,jobs:4,site:['hab'],d:'A small second base on a surveyed site, linked by rover runs'},
 path:{n:'Footpath',c:0,m:0,ic:'🚶',cat:'p',d:'Free — drag to paint a 1-tile footpath'},
 road:{n:'Road (2-wide)',c:0,m:0,ic:'🛣️',cat:'p',d:'Free — drag to paint a 2-tile road'},
 bench:{n:'Bench',c:8,m:2,s:1,ic:'🪑',cat:'d',d:'Rest stop'},
 planter:{n:'Planter',c:12,m:3,s:1,ic:'🪴',cat:'d',d:'A bit of green'},
 flag:{n:'Flag',c:15,m:2,s:1,ic:'🚩',cat:'d',d:'Colony pride'},
 sign:{n:'Signpost',c:6,m:1,s:1,ic:'🪧',cat:'d',d:'This way →'},
 antenna:{n:'Radio Mast',c:20,m:4,s:1,ic:'📡',cat:'d',d:'Ham-radio mast with a little turning dish'},
 crates:{n:'Supply Crates',c:10,m:3,s:1,ic:'📦',cat:'d',d:'Stacked cargo crates — lived-in look'},
 rockg:{n:'Rock Garden',c:18,m:2,s:1,ic:'🪨',cat:'d',d:'Raked regolith and hand-picked stones'},
 bannr:{n:'Colony Banner',c:16,m:2,s:1,ic:'🎏',cat:'d',d:'Orange-and-teal banner on a mast'},
 statue:{n:'Pioneer Statue',c:60,m:12,s:1,ic:'🗿',cat:'d',d:'Basalt statue of the first crew'},
 obelisk:{n:'Memorial Obelisk',c:80,m:15,s:1,ic:'🏛️',cat:'d',d:'A plaque for everyone who made it here'},
 dozer:{n:'Bulldoze',c:0,ic:'🚜',cat:'x',d:'Tap/drag · 50% refund'}
};
const NEWS={pad:8,hab:4,solar:2,battery:2,farm:4,ice:4,wtank:2,recyc:4,mine:6,proc:6,fuel:4,waste:4,med:4,bigfarm:8,ent:8,reactor:8,refin:8,mega:8,sec:8,robot:4,ship:8,garage:8,lab:8,lpad:8,factory:6,medc:8,school:4,drill:6,icefield:8,kilo:4,outpost:8,hydro:4,gdome:6,algae:4,insect:4,aqua:6,bigdome:12,complex:10,arco:14,bench:2,planter:1,flag:2,sign:1,antenna:1,rockg:2,statue:2,crates:1,bannr:1,obelisk:2,road:1};
for(const k in B){B[k].s=B[k].s||1;B[k].s0=B[k].s;if(NEWS[k])B[k].s=NEWS[k];B[k].m=B[k].m||0;if(B[k].cat==='b')B[k].up=1;}
let S;
const DIFF={relaxed:{cr:1900,mat:380,dem:.8,n:'Relaxed'},standard:{cr:1500,mat:320,dem:1,n:'Standard'},hard:{cr:1100,mat:280,dem:1.25,n:'Hard'}};
function fresh(diff='standard',name='Olympus Base'){return{v:6,lvl:1,lvBase:{},botsLanded:0,ship2:'done',ship2T:240,lastLandT:-999,cr:DIFF[diff].cr,mat:DIFF[diff].mat,ore:0,rare:0,bat:0,food:120,wat:80,fuel:0,hap:80,t:0,diff,name,tiles:{},cols:[],bots:[],warned:{},b:[],tf:0,
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
const R=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(pointer:coarse)').matches?1.5:2));R.setSize(innerWidth,innerHeight);R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;R.outputColorSpace=THREE.SRGBColorSpace;
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;document.body.prepend(R.domElement);
const scene=new THREE.Scene();const W=new THREE.Group();W.scale.setScalar(.25);scene.add(W);const SKY_D=new THREE.Color(0xd9a07a),SKY_N=new THREE.Color(0x3a2c52),SKY_DUSK=new THREE.Color(0x8a5a6a);
scene.background=SKY_D.clone();scene.fog=new THREE.Fog(0xd9a07a,90,220);
// Mars sky environment for reflections: butterscotch sky, bright hazy horizon + sun glow, rust ground
const ENV=(()=>{const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');
 const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#6f86a8');g.addColorStop(.22,'#c9b39a');g.addColorStop(.44,'#f2d6b4');g.addColorStop(.5,'#fff1dc');g.addColorStop(.53,'#a8644a');g.addColorStop(.75,'#6a3422');g.addColorStop(1,'#3a1c12');
 x.fillStyle=g;x.fillRect(0,0,512,256);const sg=x.createRadialGradient(150,70,2,150,70,70);sg.addColorStop(0,'rgba(255,250,235,1)');sg.addColorStop(.25,'rgba(255,230,190,.65)');sg.addColorStop(1,'rgba(255,220,180,0)');x.fillStyle=sg;x.fillRect(0,0,512,256);
 for(let i=0;i<40;i++){x.fillStyle=`rgba(255,255,255,${.04+Math.random()*.06})`;x.beginPath();x.ellipse(Math.random()*512,40+Math.random()*60,30+Math.random()*60,4+Math.random()*6,0,0,6.28);x.fill();}
 const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.colorSpace=THREE.SRGBColorSpace;const pm=new THREE.PMREMGenerator(R);const e=pm.fromEquirectangular(t).texture;t.dispose();return e;})();
scene.environment=ENV;scene.environmentIntensity=.55;
const SENV=(()=>{const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,256);
 g.addColorStop(0,'#8ea6c4');g.addColorStop(.3,'#d8dee6');g.addColorStop(.48,'#ffffff');g.addColorStop(.52,'#c8c0b8');g.addColorStop(.7,'#9a8a80');g.addColorStop(1,'#5a524e');x.fillStyle=g;x.fillRect(0,0,512,256);
 const sg=x.createRadialGradient(150,80,2,150,80,80);sg.addColorStop(0,'rgba(255,255,250,1)');sg.addColorStop(1,'rgba(255,250,240,0)');x.fillStyle=sg;x.fillRect(0,0,512,256);
 for(let i=0;i<6;i++){x.fillStyle='rgba(255,255,255,.55)';x.fillRect(i*85+20,95,22,60);}
 const t=new THREE.CanvasTexture(c);t.mapping=THREE.EquirectangularReflectionMapping;t.colorSpace=THREE.SRGBColorSpace;const pm=new THREE.PMREMGenerator(R);const e=pm.fromEquirectangular(t).texture;t.dispose();return e;})();
const skyTex=(()=>{const c=document.createElement('canvas');c.width=4;c.height=256;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'#c99574');g.addColorStop(.6,'#e2b48e');g.addColorStop(1,'#f0caa2');x.fillStyle=g;x.fillRect(0,0,4,256);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;})();
let zoom=9,rot=0,rotT=0;const tgt=new THREE.Vector3(N/2,0,N/2);
const cam=new THREE.OrthographicCamera(-1,1,1,-1,0.1,400);
function camUp(){const a=innerWidth/innerHeight;cam.left=-zoom*a;cam.right=zoom*a;cam.top=zoom;cam.bottom=-zoom;cam.updateProjectionMatrix();
 const ang=Math.PI/4+rot,tw=tgt.clone().multiplyScalar(CS);cam.position.set(tw.x+Math.sin(ang)*80,tw.y+64,tw.z+Math.cos(ang)*80);cam.lookAt(tw);}
const hemi=new THREE.HemisphereLight(0xffe6cc,0x7a3a22,1.0);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1e0,2.6);sun.castShadow=true;sun.shadow.mapSize.set(matchMedia('(pointer:coarse)').matches?1024:2048,matchMedia('(pointer:coarse)').matches?1024:2048);sun.shadow.bias=-.0005;sun.shadow.normalBias=.03;sun.shadow.radius=3;scene.add(sun,sun.target);
// ---------- terrain
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const CR=[];
// v20 biomes: deterministic regions (same map for every save, so old saves need no migration)
const BIO={rust:{n:'Rust Plains',ic:'🟠',c:[1,.95,.92],r:0x8a4428,d:'Iron-oxide dust over basalt — standard ground'},
 basalt:{n:'Basalt Fields',ic:'⬛',c:[.42,.4,.42],r:0x2c2828,d:'Dark volcanic rock — ⛏️ +40% ore from mines & drills'},
 ice:{n:'Polar Permafrost',ic:'🧊',c:[1.6,1.64,1.8],r:0x9c8f8a,d:'Ice just under the soil — 💧 +40% from ice extractors & rigs'},
 canyon:{n:'Canyon Badlands',ic:'🏜️',c:[1.12,.8,.66],r:0xa45a34,d:'Layered sediment mesas — 🔬 +25% research from labs'},
 dunes:{n:'Dune Sea',ic:'🌬️',c:[1.28,1.1,.86],r:0xb07a50,d:'Wind-blown sand — ☀️ solar −20% (dust)'},
 clay:{n:'Hematite Clay Basin',ic:'🧱',c:[.8,.5,.52],r:0x6c2e2c,d:'Clay & hematite — 🧱 +30% materials from processors'}};
const BIOP=(()=>{const R=mulberry(20261018),P=[],ks=['basalt','canyon','dunes','clay','basalt','dunes','canyon','clay'];let j=0;
 for(let i=0;i<22;i++){const x=-20+R()*(NW+40),z=-20+R()*(NW+40);let k=z<NW*.22?'ice':ks[j++%ks.length];if(Math.hypot(x-NW/2,z-NW/2)<20)k='rust';P.push({x,z,k});}
 P.push({x:NW/2,z:NW/2,k:'rust'},{x:NW/2+9,z:NW/2-7,k:'rust'},{x:NW/2-8,z:NW/2+8,k:'rust'});return P;})();
function bio2(x,z){const wx=x+Math.sin(z*.11)*4+Math.sin(z*.31+x*.07)*1.5,wz=z+Math.cos(x*.09)*4+Math.cos(x*.27)*1.5;let a=null,b=null,da=1e9,db=1e9;
 for(const p of BIOP){let d=Math.hypot(wx-p.x,wz-p.z);if(p.k==='rust'&&Math.hypot(p.x-NW/2,p.z-NW/2)<12)d-=6;if(d<da){db=da;b=a;da=d;a=p;}else if(d<db){db=d;b=p;}}return{a:a.k,b:b?b.k:a.k,t:Math.min(1,(db-da)/5)};}
const _bioC=new Map();function bioAt(x,z){x=(x*CS)|0;z=(z*CS)|0;const k=x+','+z;let v=_bioC.get(k);if(!v){v=bio2(x+.5,z+.5).a;_bioC.set(k,v);}return v;}
function bioCol(x,z){const q=bio2(x,z),A=BIO[q.a].c,Bc=BIO[q.b].c,w=.5+.5*q.t;let c=[A[0]*w+Bc[0]*(1-w),A[1]*w+Bc[1]*(1-w),A[2]*w+Bc[2]*(1-w)];
 const n=Math.sin(x*.7+Math.sin(z*.5))*Math.cos(z*.6);if(q.a==='ice'&&n>.3){c=c.map(v=>v+.55);}if(q.a==='canyon'){const st=Math.sin((x*.3+z*.12)*2.2);c=c.map((v,i)=>v*(1+st*.07));}if(q.a==='basalt'&&n>.5)c=c.map(v=>v*.85);return c;}
const BIOMUL={basalt:{mine:1.4,drill:1.4},ice:{ice:1.4,icefield:1.4,recyc:1.15},canyon:{lab:1.25},dunes:{solar:.8},clay:{proc:1.3,factory:1.15}};
const bioOf=b=>bioAt(b.x+B[b.t].s/2,b.z+B[b.t].s/2),bioMul=b=>(BIOMUL[bioOf(b)]||{})[b.t]||1;
const bioTxt=(x,z,t)=>{const k=bioAt(x,z),m=t&&(BIOMUL[k]||{})[t];return `${BIO[k].ic} ${BIO[k].n}${m&&m!==1?` (${m>1?'+':''}${Math.round((m-1)*100)}%)`:''}`;};
function hgtW(x,z){const N=NW;const d=Math.max(Math.abs(x-N/2),Math.abs(z-N/2));if(d>N/2+2){const k=bio2(x,z);if(k.a==='canyon'){const e=Math.min(1,(d-N/2-2)/4)*Math.min(1,k.t*2);const v=(Math.sin(x*.21)*Math.cos(z*.17)+Math.sin(x*.07-z*.05))*.5+.5;return Math.floor(v*4)*.32*e-.01;}if(k.a==='dunes'){const e=Math.min(1,(d-N/2-2)/4)*Math.min(1,k.t*2);return Math.pow(Math.abs(Math.sin(x*.32+z*.12+Math.sin(z*.08)*2)),2.2)*.75*e-.01;}}return d>N/2+1?(Math.sin(x*.3)*Math.cos(z*.25)+1)*Math.min(8,d-N/2)*.25+Math.pow(Math.abs(Math.sin(x*.55+z*.22+Math.sin(z*.13)*1.5)),3)*.22*Math.min(1,(d-N/2-1)/5)-.01:0;}
const hgt=(x,z)=>hgtW(x*CS,z*CS)/CS;
const blocked=Array.from({length:N},()=>Array(N).fill(false));
{const tg=new THREE.PlaneGeometry(NW+60,NW+60,170,170);tg.rotateX(-Math.PI/2);tg.translate(NW/2,0,NW/2);const p=tg.attributes.position,cols=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,hgtW(x,z)-.01);const n=Math.sin(x*.21)*Math.cos(z*.17)*.04+Math.sin(x*.05+z*.07)*.05;const k=1+n+Math.random()*.05,bc=bioCol(x,z);cols.push(bc[0]*k,bc[1]*k,bc[2]*k);}
 tg.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));tg.computeVertexNormals();
 const gtex=(()=>{const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#b8775a';x.fillRect(0,0,512,512);
  for(let i=0;i<9000;i++){const v=Math.random();x.fillStyle=v<.5?`rgba(90,40,22,${Math.random()*.18})`:`rgba(240,190,150,${Math.random()*.14})`;const r=Math.random()*2.4+.4;x.fillRect(Math.random()*512,Math.random()*512,r,r);}
  for(let i=0;i<140;i++){x.fillStyle=`rgba(70,30,15,${.05+Math.random()*.08})`;x.beginPath();x.ellipse(Math.random()*512,Math.random()*512,4+Math.random()*16,3+Math.random()*10,Math.random()*3,0,6.28);x.fill();}
  for(let i=0;i<46;i++){const y0=Math.random()*512,ph=Math.random()*6,a=.05+Math.random()*.05;for(const[dy,col]of[[0,`rgba(80,34,16,${a})`],[2,`rgba(250,205,165,${a*.8})`]]){x.strokeStyle=col;x.lineWidth=1.4;x.beginPath();for(let xx=-8;xx<=520;xx+=8){const yy=y0+dy+Math.sin(xx*.045+ph)*5+Math.sin(xx*.11)*1.5;xx<0?x.moveTo(xx,yy):x.lineTo(xx,yy);}x.stroke();}}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(26,26);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;})();
 const ground=new THREE.Mesh(tg,new THREE.MeshStandardMaterial({vertexColors:true,map:gtex,roughness:.96,metalness:0,envMapIntensity:.25}));ground.receiveShadow=true;scene.add(ground);}
const grid=new THREE.GridHelper(N,N/2,0x7a2f12,0x7a2f12);grid.position.set(N/2,0.04,N/2);grid.material.opacity=.13;grid.material.transparent=true;W.add(grid);
{const rg=new THREE.DodecahedronGeometry(1,0),rm=new THREE.MeshLambertMaterial({color:0x6a2a14}),im=new THREE.InstancedMesh(rg,rm,120),d=new THREE.Object3D();im.castShadow=true;rm.color.setHex(0xffffff);const _c=new THREE.Color();
 for(let i=0;i<120;i++){const a=Math.random()*6.28,dd=NW/2+2+Math.random()*16,x=NW/2+Math.cos(a)*dd,z=NW/2+Math.sin(a)*dd;d.position.set(x,hgtW(x,z)+.1,z);d.scale.setScalar(.15+Math.random()*.4);d.updateMatrix();im.setMatrixAt(i,d.matrix);im.setColorAt(i,_c.setHex(BIO[bio2(x,z).a].r));}W.add(im);}
const BOUL=new Map();let IGB=false;const TK0=(x,z)=>x+','+z;
// v20 terrain detail: decorative rocks + craters on the build grid (hidden under buildings/paths), instanced
const TD=(()=>{const Rn=mulberry(7331),rocks=[],cr=[];
 for(let i=0;i<560;i++){const big=Rn()<.07;rocks.push({x:Rn()*N,z:Rn()*N,s:big?.68+Rn()*.72:.16+Rn()*.32,ry:Rn()*6.28,sq:.45+Rn()*.4,sx:.8+Rn()*.5});}
 rocks.forEach(r=>{const k=bioAt(r.x,r.z);if((k==='dunes'&&Rn()<.65)||(k==='ice'&&Rn()<.4))r.gone=1;if(k==='basalt')r.s*=1.25;});
 rocks.forEach((r,i)=>{if(r.s>=.68&&!r.gone&&r.x>8&&r.z>8&&r.x<N-8&&r.z<N-8){r.b=1;const e=Math.max(0,Math.round(r.s*.8)-1);for(let a=-e;a<=e;a++)for(let c=-e;c<=e;c++)BOUL.set(TK0((r.x|0)+a,(r.z|0)+c),i);}});
 for(let i=0;i<48;i++){const big=i<5;cr.push({x:24+Rn()*(N-48),z:24+Rn()*(N-48),r:4*(big?1.8+Rn()*1.4:.3+Rn()*.7),ry:Rn()*6.28});}
 const ri=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,flatShading:true,envMapIntensity:.2}),rocks.length);ri.castShadow=true;ri.receiveShadow=true;
 const pr=[[0,.004],[.5,.004],[.72,.012],[.88,.045],[1,.07],[1.1,.045],[1.25,.012],[1.45,.002]].map(([a,b])=>new THREE.Vector2(a,b));
 const cg=new THREE.LatheGeometry(pr,28);{const p=cg.attributes.position,c=[];for(let i=0;i<p.count;i++){const r=Math.hypot(p.getX(i),p.getZ(i));const k=r<.5?.6:r<1?.6+(r-.5)*1.1:r<1.1?1.18:1.18-(r-1.1)*.5;c.push(k,k,k);}cg.setAttribute('color',new THREE.Float32BufferAttribute(c,3));cg.computeVertexNormals();}
 const ci=new THREE.InstancedMesh(cg,new THREE.MeshStandardMaterial({color:0xb4734f,vertexColors:true,roughness:.97,envMapIntensity:.2,polygonOffset:true,polygonOffsetFactor:-1}),cr.length);ci.receiveShadow=true;
 {const c=new THREE.Color();rocks.forEach((r,i)=>{const k=bioAt(r.x,r.z);c.setHex(BIO[k].r).offsetHSL(0,0,(Rn()-.5)*.06);ri.setColorAt(i,c);});ri.instanceColor.needsUpdate=true;}
 W.add(ri,ci);return{rocks,cr,ri,ci,key:''};})();
function tdecoSync(){if(!S||!occ.length)return;const d=new THREE.Object3D(),busy=(x,z)=>{x|=0;z|=0;if(x<0||z<0||x>=N||z>=N)return false;return!!(occ[x][z]||tile(x,z));};
 const cl=new Set(S.bcl||[]);TD.rocks.forEach((r,i)=>{const h=busy(r.x,r.z)||cl.has(i)||r.gone;d.position.set(r.x,r.s*r.sq*.35,r.z);d.rotation.set(0,r.ry,0);d.scale.set(h?0:r.s*r.sx,h?0:r.s*r.sq,h?0:r.s);d.updateMatrix();TD.ri.setMatrixAt(i,d.matrix);});
 TD.cr.forEach((c,i)=>{let h=false;const e=c.r*1.3;for(let x=c.x-e;x<=c.x+e&&!h;x+=2)for(let z=c.z-e;z<=c.z+e;z+=2)if(busy(x,z)){h=true;break;}d.position.set(c.x,0,c.z);d.rotation.set(0,c.ry,0);d.scale.set(h?0:c.r,h?0:2*Math.sqrt(c.r),h?0:c.r);d.updateMatrix();TD.ci.setMatrixAt(i,d.matrix);});
 TD.ri.instanceMatrix.needsUpdate=TD.ci.instanceMatrix.needsUpdate=true;}
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
function modelNew(t,lvl=1){const g=new THREE.Group(),s=B[t].s0,h=s/2,L=lvl;
 if(t==='pad'){g.add(mesh(cyl(.95,1,.1,32),MAT.concrete,1,.03,1));g.add(mesh(torus(.62,.03,32),MAT.yellow,1,.09,1,false));g.add(mesh(cyl(.5,.5,.005,32),M(0x6a6560,.95),1,.085,1,false));
  for(let i=0;i<6;i++){const a=i/6*6.28;g.add(mesh(new THREE.SphereGeometry(.035,8,6),lampMat,1+Math.cos(a)*.88,.1,1+Math.sin(a)*.88,false));}}
 else if(t==='hab'&&L<=1){const ax=.6,ca=Math.cos(ax),sa=Math.sin(ax);g.add(mesh(new THREE.CapsuleGeometry(.17,.36,6,16).rotateZ(Math.PI/2).rotateY(ax),MAT.white,.5,.19,.5));
  for(let i=-1;i<=1;i++){const r=mesh(new THREE.TorusGeometry(.174,.013,8,20),MAT.dark,.5+ca*i*.14,.19,.5-sa*i*.14,false);r.rotation.y=ax+Math.PI/2;g.add(r);}
  g.add(mesh(cyl(.075,.075,.12,12).rotateZ(Math.PI/2).rotateY(ax),MAT.steel,.5+ca*.4,.12,.5-sa*.4));[-.07,.07].forEach(d=>{const w=mesh(new THREE.BoxGeometry(.07,.05,.02),winMat,.5+ca*d+sa*.165,.24,.5-sa*d+ca*.165,false);w.rotation.y=ax;g.add(w);});
  g.add(mesh(new THREE.SphereGeometry(.07,10,8),MAT.white,.2,.07,.78));g.add(mesh(cyl(.008,.008,.3,5),MAT.dark,.62,.48,.42,false));}
 else if(t==='hab'&&L===2){g.add(mesh(cyl(.3,.32,.34,22),MAT.white,.5,.17,.5));g.add(mesh(torus(.312,.02,24),winMat,.5,.22,.5,false));g.add(mesh(torus(.31,.016,24),MAT.dark,.5,.345,.5,false));
  g.add(mesh(cyl(.23,.25,.24,22),MAT.white,.5,.46,.5));g.add(mesh(torus(.242,.018,24),winMat,.5,.5,.5,false));g.add(mesh(dome(.23,20),MAT.white,.5,.58,.5));
  g.add(mesh(new THREE.BoxGeometry(.03,.6,.05),MAT.steel,.83,.3,.5));g.add(mesh(cyl(.008,.008,.3,5),MAT.dark,.5,.9,.5,false));g.add(mesh(new THREE.SphereGeometry(.025,8,6),MAT.red,.5,1.05,.5,false));}
 else if(t==='hab'){habDome(g,.5,.5,.37);if(L>=3){habDome(g,.2,.2,.2);g.add(mesh(new THREE.CylinderGeometry(.05,.05,.3,10).rotateZ(Math.PI/2).rotateY(-.8),MAT.white,.36,.06,.34));}
  if(L>=3){habDome(g,.8,.22,.18);g.add(mesh(cyl(.01,.01,.35,6),MAT.dark,.5,.5,.5,false));g.add(mesh(new THREE.SphereGeometry(.03,8,6),MAT.red,.5,.68,.5,false));}
  if(L>=4){habDome(g,.22,.8,.17);g.add(mesh(cyl(.13,.15,.08,18),MAT.white,.5,.36,.5));g.add(mesh(torus(.14,.012,18),winMat,.5,.38,.5,false));}if(L>=5)habDome(g,.8,.8,.15);}
 else if(t==='mega'){const tw=[[.55,.6],[1.4,.6],[1,1.4]];tw.forEach(([x,z],i)=>{const H=(1.1+i*.4)*(1+.3*(L-1));g.add(mesh(cyl(.3,.36,H,20),MAT.white,x,H/2,z));
   for(let k=1;k<H/.22;k++)g.add(mesh(torus(.305+.06*(1-k*.22/H),.012,20),winMat,x,k*.22,z,false));g.add(mesh(dome(.3),glass,x,H,z,false));});
  g.add(mesh(new THREE.CylinderGeometry(.05,.05,.9,8).rotateZ(Math.PI/2),glass,.97,.7,.6,false));g.add(mesh(torus(.95,.03,32),MAT.concrete,1,.01,1,false));}
 else if(t==='solar'){const rows=1+L;for(let i=0;i<rows;i++){const z=.5+(i-(rows-1)/2)*(.8/rows);const p=mesh(rbox(L>=3?.96:.8,.025,.8/rows*.85,.01),MAT.panel,.5,L>=3?.4:.32,z);p.rotation.x=-.45;p.name='trk';g.add(p);
  g.add(mesh(cyl(.018,.025,L>=3?.4:.3,8),MAT.steel,.5,L>=3?.2:.15,z));}if(L>=3)g.add(mesh(rbox(.12,.12,.1,.01),MAT.white,.92,.06,.08));}
 else if(t==='farm'&&L<=1){g.add(mesh(rbox(.8,.02,.5,.01),MAT.soil,.5,.01,.5,false));plants(g,.5,.5,.22,8,.1);
  g.add(mesh(new THREE.CylinderGeometry(.25,.25,.72,18,1,true,0,Math.PI).rotateZ(Math.PI/2),glass,.5,.01,.5,false));
  for(let i=0;i<4;i++){const r=mesh(new THREE.TorusGeometry(.25,.012,6,16,Math.PI),MAT.steel,.15+i*.233,.01,.5,false);r.rotation.y=Math.PI/2;g.add(r);}
  g.add(mesh(new THREE.BoxGeometry(.08,.08,.08),MAT.white,.9,.04,.84));}
 else if(t==='farm'||t==='bigfarm'){const r=(s===2?.88:L>=3?.47:.4)*(L>=2&&s===2?1.06:1);if(s===1&&L>=3){g.add(mesh(cyl(.06,.06,.5,10),glass,.9,.25,.1));g.add(mesh(dome(.06,10),MAT.white,.9,.5,.1,false));}g.add(mesh(cyl(r,r,.02,28),MAT.soil,h,.01,h,false));plants(g,h,h,r*.85,s===2?40+L*12:9+L*4,s===2?.22:.12);
  if(s===2){for(let i=0;i<4+L*2;i++){const a=Math.random()*6.28,d=Math.random()*r*.6,x=h+Math.cos(a)*d,z=h+Math.sin(a)*d;g.add(mesh(cyl(.02,.03,.3,6),MAT.trunk,x,.15,z));g.add(mesh(new THREE.IcosahedronGeometry(.13,0),MAT.leaf,x,.36,z));}}
  g.add(mesh(dome(r,28),glass,h,0,h,false));g.add(mesh(torus(r,.03,32),MAT.steel,h,.02,h,false));if(L>=3)g.add(mesh(torus(r*.72,.012,32),MAT.steel,h,r*.7,h,false));}
 else if(t==='ice'){g.add(mesh(cyl(.24,.27,.22,18),MAT.blue,.5,.11,.5));for(let i=0;i<3;i++){const a=i*2.09,l=mesh(cyl(.015,.015,.95,6),MAT.steel,.5+Math.cos(a)*.13,.5,.5+Math.sin(a)*.13);l.rotation.set(Math.sin(a)*.25,0,-Math.cos(a)*.25);g.add(l);}
  const d=mesh(cyl(.035,.035,.8+.2*L,8),MAT.dark,.5,.5,.5);d.name='spin';g.add(d);g.add(mesh(new THREE.SphereGeometry(.07,10,8),MAT.white,.5,.95+.1*L,.5));
  for(let i=0;i<L;i++)g.add(mesh(new THREE.SphereGeometry(.11,14,10),MAT.white,.18+i*.0,.11,.18+i*.3));
  if(L>=3){g.add(mesh(cyl(.13,.13,.42,14),MAT.blue,.82,.21,.82));g.add(mesh(dome(.13,14),MAT.white,.82,.42,.82,false));g.add(mesh(cyl(.3,.3,.06,20),MAT.blue,.5,.03,.5,false));}}
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
  g.add(mesh(torus(.305,.012,24),MAT.steel,.5,H*.5,.5,false));g.add(mesh(torus(.305,.012,24),MAT.steel,.5,H*.85,.5,false));g.add(mesh(new THREE.BoxGeometry(.03,H,.03),MAT.steel,.82,H/2+.06,.5));if(L>=3){const h2=H*.7;g.add(mesh(cyl(.15,.15,h2,16),M(0x5a8fc8,.4,.3),.16,h2/2+.04,.84));g.add(mesh(dome(.15,16),M(0x5a8fc8,.4,.3),.16,h2+.04,.84));}}
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
 else if(t==='robot'){g.add(mesh(rbox(.78,.42,.6,.06),M(0xe8e8e6,.45,.1),.5,.21,.44));g.add(mesh(rbox(.36,.3,.02,.02),M(0x16171a,.3,.4),.5,.17,.75,false));
  g.add(mesh(rbox(.3,.03,.03,.01),M(0x3a6aff,.3,0,{emissive:0x3a6aff,emissiveIntensity:1.5}),.5,.36,.755,false));g.add(mesh(cyl(.012,.012,.3,6),MAT.dark,.2,.55,.25,false));
  for(let i=0;i<Math.min(3,L);i++){const o=optimus();o.scale.setScalar(.9);o.position.set(.2+i*.3,0,.86);g.add(o);}}
 else if(t==='lamp'){g.add(mesh(cyl(.015,.022,.55,8),MAT.dark,.5,.275,.5));g.add(mesh(rbox(.16,.02,.03,.008),MAT.dark,.56,.55,.5));g.add(mesh(new THREE.SphereGeometry(.035,10,8),lampMat,.62,.52,.5,false));
  const sp=new THREE.Sprite(glowMat);sp.scale.set(.7,.7,.7);sp.position.set(.62,.52,.5);g.add(sp);const pool=new THREE.Mesh(new THREE.CircleGeometry(.65,20).rotateX(-Math.PI/2),poolMat);pool.position.set(.6,.03,.5);g.add(pool);}
 else if(t==='bench'){g.add(mesh(rbox(.45,.04,.14,.015),MAT.trunk,.5,.13,.5));g.add(mesh(rbox(.45,.12,.03,.012),MAT.trunk,.5,.21,.43));[.32,.68].forEach(x=>g.add(mesh(rbox(.03,.12,.12,.008),MAT.dark,x,.06,.5)));}
 else if(t==='planter'){g.add(mesh(cyl(.17,.13,.14,16),MAT.concrete,.5,.07,.5));plants(g,.5,.5,.1,5,.16);g.children.slice(1).forEach(c=>c.position.y+=.12);}
 else if(t==='flag'){g.add(mesh(cyl(.012,.012,.7,6),MAT.steel,.5,.35,.5));const c=mesh(new THREE.PlaneGeometry(.28,.17,6,1),M(0xd23a2a,.8,0,{side:THREE.DoubleSide}),.64,.6,.5,false);c.name='cloth';g.add(c);}
 else if(t==='sign'){g.add(mesh(cyl(.015,.015,.4,6),MAT.trunk,.5,.2,.5));const s1=mesh(rbox(.26,.08,.02,.01),MAT.yellow,.58,.36,.5);g.add(s1);const s2=mesh(rbox(.22,.07,.02,.01),MAT.blue,.43,.27,.5);s2.rotation.y=.6;g.add(s2);}
 return g;}
const SH_H=5.6,SH_K=SH_H/52.1,SH_R=4.5*SH_K,SH_SK=.15; // true-proportion Starship: 52.1 m x 9 m, scaled so astronauts (~.38) are ~1.8 m
const SH_NOSE=36*SH_K; // nose cone starts 36 m up (tangent ogive, ~31% of height)
function shipR(y){const r=SH_R,L=SH_H-SH_NOSE;if(y<=SH_NOSE)return r;const t=y-SH_NOSE,rho=(r*r+L*L)/(2*r);const v=Math.sqrt(Math.max(0,rho*rho-t*t))+r-rho;
 const tip=.05;if(L-t<tip*1.4){const k=(L-t)/(tip*1.4);return Math.max(.002,Math.min(v,tip*Math.sqrt(Math.max(0,k*(2-k)))));}return Math.max(v,.002);}
const hexTex=(()=>{const W=512,c=document.createElement('canvas');c.width=W;c.height=W;const x=c.getContext('2d');x.fillStyle='#55585e';x.fillRect(0,0,W,W);
 const n=16,r=W/n/Math.sqrt(3),w=Math.sqrt(3)*r;for(let row=-1;row<=Math.ceil(W/(r*1.5))+1;row++)for(let col=-1;col<=n+1;col++){const cx=col*w+(row%2?w/2:0),cy=row*r*1.5;
  x.beginPath();for(let k=0;k<6;k++){const a=Math.PI/3*k+Math.PI/6;x.lineTo(cx+Math.cos(a)*(r-1.8),cy+Math.sin(a)*(r-1.8));}x.closePath();
  const v=16+Math.random()*12+(Math.random()<.04?18:0);const gr=x.createLinearGradient(cx,cy-r,cx,cy+r);gr.addColorStop(0,`rgb(${v+10},${v+10},${v+13})`);gr.addColorStop(1,`rgb(${v},${v},${v+3})`);x.fillStyle=gr;x.fill();}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;})();
// brushed stainless with weld rings every 1.83 m (the 9 m rings Starship is stacked from)
const steelMaps=(()=>{const H=1024,Wd=128,rings=Math.round(52.1/1.83);
 const mk=(fill,line,streak)=>{const c=document.createElement('canvas');c.width=Wd;c.height=H;const x=c.getContext('2d');x.fillStyle=fill;x.fillRect(0,0,Wd,H);
  for(let i=0;i<1600;i++){const v=streak[0]+Math.random()*streak[1]|0;x.fillStyle=`rgba(${v},${v},${v+3},.25)`;x.fillRect(Math.random()*Wd,Math.random()*H,1,4+Math.random()*12);}
  for(let k=1;k<rings;k++){const y=H-k*H/rings;x.fillStyle=line;x.fillRect(0,y-1,Wd,2);}
  for(let k=0;k<rings;k++){const y=H-(k+.5)*H/rings,sx=(k*37)%Wd;x.fillStyle=line;x.fillRect(sx,y-H/rings/2,1.2,H/rings);} // vertical seam per ring
  return c;};
 const col=new THREE.CanvasTexture(mk('#d9dde1','rgba(120,124,132,.55)',[200,50]));col.colorSpace=THREE.SRGBColorSpace;
 const rough=new THREE.CanvasTexture(mk('#4d4d4d','rgba(150,150,150,1)',[60,40]));
 const bump=new THREE.CanvasTexture(mk('#808080','rgba(30,30,30,1)',[120,16]));
 [col,rough,bump].forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;});return{col,rough,bump};})();
const SHIPMAT={steel:new THREE.MeshStandardMaterial({color:0xf2f5f8,map:steelMaps.col,roughnessMap:steelMaps.rough,bumpMap:steelMaps.bump,bumpScale:.6,metalness:1,roughness:.85,envMap:SENV,envMapIntensity:1.35}),
 tile:new THREE.MeshStandardMaterial({color:0xffffff,map:hexTex,roughness:.82,metalness:.05,side:THREE.DoubleSide,envMap:SENV,envMapIntensity:.3,polygonOffset:true,polygonOffsetFactor:-2}),
 flapS:new THREE.MeshStandardMaterial({color:0xd4d8dc,metalness:1,roughness:.32,side:THREE.DoubleSide,envMap:SENV,envMapIntensity:1.25}),
 flapT:new THREE.MeshStandardMaterial({color:0xffffff,map:hexTex,roughness:.82,metalness:.05,side:THREE.DoubleSide,envMap:SENV,envMapIntensity:.3,polygonOffset:true,polygonOffsetFactor:-2}),
 bayIn:new THREE.MeshStandardMaterial({color:0x2c2a28,metalness:.6,roughness:.6,side:THREE.DoubleSide,envMap:SENV,envMapIntensity:.4}),
 chine:new THREE.MeshStandardMaterial({color:0x2a2b2e,roughness:.7,metalness:.3,envMap:SENV,envMapIntensity:.5}),
 bell:new THREE.MeshStandardMaterial({color:0x3a3632,metalness:.8,roughness:.45,side:THREE.DoubleSide,envMap:SENV,envMapIntensity:.6}),
 bellIn:new THREE.MeshStandardMaterial({color:0x8a5a3a,metalness:.7,roughness:.35,side:THREE.BackSide,envMap:SENV,envMapIntensity:.6}),
 glow:new THREE.MeshBasicMaterial({color:0xffd9a0,side:THREE.DoubleSide,toneMapped:false}),
 fl:new THREE.MeshBasicMaterial({color:0xff9a3c,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}),
 fl2:new THREE.MeshBasicMaterial({color:0xd8ecff,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false})};
function rocket(){const outer=new THREE.Group(),g=new THREE.Group();outer.add(g); // g centred at ship mid-height; tiles face -z (windward/belly)
 const H=SH_H,y0=-H/2,r=SH_R,tw=Math.PI*r/9; // texture tile size so ~9 hex columns span the tiled half... ×16 per texture
 // hull profile (lathe): straight barrel + tangent ogive nose
 const prof=[];for(let i=0;i<=120;i++){const y=i/120*H;prof.push(new THREE.Vector2(shipR(y),y));}
 const hull=new THREE.LatheGeometry(prof,64);{const uv=hull.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*4,uv.getY(i));}
 g.add(mesh(hull,SHIPMAT.steel,0,y0,0));
 // heat shield: windward half (-z) of the same profile, slightly proud, hex tiles ~1 m
 const tp=prof.map(v=>new THREE.Vector2(v.x>.003?v.x+.006:v.x,v.y));const tg=new THREE.LatheGeometry(tp,48,Math.PI/2,Math.PI);
 {const uv=tg.attributes.uv,ps=tg.attributes.position;const tile=1.05*SH_K*16;for(let i=0;i<uv.count;i++){uv.setXY(i,uv.getX(i)*Math.PI*r/tile,ps.getY(i)/tile*1.15);}}
 g.add(mesh(tg,SHIPMAT.tile,0,y0,0,false));
 // chines: raised dark strips along both tile edges, up the barrel and the nose
 for(const sd of[-1,1]){const pts=[];for(let i=0;i<=40;i++){const y=i/40*(H-.18);pts.push(new THREE.Vector3(sd*(shipR(y)+.014),y0+y,-.004));}
  const cv=new THREE.CatmullRomCurve3(pts);const tube=new THREE.TubeGeometry(cv,60,.016,6,false);g.add(mesh(tube,SHIPMAT.chine,0,0,0,false));}
 // flaps (rounded trapezoids, thick, steel leeward face + tiled windward face), hinged on the chine, angled 15° windward
 const flap=(rootY0,rootY1,tipY0,tipY1,span,side,yBase,xHinge)=>{const P=[[0,rootY0],[span,tipY0],[span,tipY1],[0,rootY1]].map(([a,b])=>new THREE.Vector2(a,b));
  const sh=new THREE.Shape();sh.moveTo(P[0].x,P[0].y);for(let k=1;k<=P.length;k++){const a=P[k-1],b=P[k%P.length],c=P[(k+1)%P.length];const m1=a.clone().lerp(b,.82),m2=b.clone().lerp(c,.18);sh.lineTo(m1.x,m1.y);sh.quadraticCurveTo(b.x,b.y,m2.x,m2.y);}
  const th=.045,grp=new THREE.Group();const st=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:th,bevelEnabled:true,bevelThickness:.01,bevelSize:.012,bevelSegments:2,curveSegments:8}),SHIPMAT.flapS);st.position.z=-th/2;st.castShadow=true;grp.add(st);
  const fg=new THREE.ShapeGeometry(sh,8);{const uv=fg.attributes.uv,ps=fg.attributes.position,tile=1.05*SH_K*16;for(let i=0;i<uv.count;i++)uv.setXY(i,ps.getX(i)/tile,ps.getY(i)/tile*1.15);}
  const tl=new THREE.Mesh(fg,SHIPMAT.flapT);tl.position.z=-th/2-.013;grp.add(tl);
  // hinge aerocover fairing along the root (leeward) + small dark root seal
  const hl=rootY1-rootY0;const fair=mesh(new THREE.CapsuleGeometry(.03,hl*.8,4,10),SHIPMAT.flapS,.01,(rootY0+rootY1)/2,.035,true);grp.add(fair);
  grp.add(mesh(new THREE.BoxGeometry(.02,hl*.95,.06),SHIPMAT.chine,.005,(rootY0+rootY1)/2,-.02,false));
  grp.position.set(side*xHinge,y0+yBase,-.02);grp.scale.x=side;grp.rotation.order='YXZ';grp.rotation.y=side*.26;grp.userData.fb=side*.26;(g.userData.flaps||(g.userData.flaps=[])).push(grp);g.add(grp);return grp;};
 // forward flaps on the nose (38.6–45.8 m), swept back
 const fyb=38.6*SH_K,fyt=45.8*SH_K;for(const sd of[-1,1])flap(0,fyt-fyb,-.06,(fyt-fyb)*.55,3.2*SH_K*1.0+.02,sd,fyb,shipR((fyb+fyt)/2)+.004);
 // aft flaps at the base (0.3–14.2 m), ~0.45× diameter
 const ayb=.3*SH_K,ayt=14.2*SH_K;for(const sd of[-1,1])flap(0,ayt-ayb,.02,(ayt-ayb)*.62,SH_R*2*.45,sd,ayb,SH_R+.004);
 // header-tank hint: vents + ring band at the nose base, small dome cap ring near the tip
 g.add(mesh(new THREE.TorusGeometry(SH_R+.003,.006,6,64).rotateX(Math.PI/2),SHIPMAT.chine,0,y0+SH_NOSE,0,false));
 const hy=H-1.3;for(const sd of[-1,1])g.add(mesh(new THREE.CylinderGeometry(.012,.012,.03,8).rotateX(Math.PI/2),SHIPMAT.chine,sd*shipR(hy)*.55,y0+hy,shipR(hy)*.82,false));
 g.add(mesh(new THREE.TorusGeometry(shipR(H-.55)+.002,.004,6,40).rotateX(Math.PI/2),SHIPMAT.chine,0,y0+H-.55,0,false));
 // frost on the propellant tanks (LOX lower / CH4 upper, gap at the common dome); leeward steel half only, opacity per ship
 {const ft=(()=>{const c=document.createElement('canvas');c.width=64;c.height=256;const x=c.getContext('2d');x.fillStyle='#000';x.fillRect(0,0,64,256);
   for(let i=0;i<900;i++){const yy=Math.random()*256;if(yy>112&&yy<124)continue;const a=.35+Math.random()*.65;x.fillStyle=`rgba(255,255,255,${a})`;x.fillRect(Math.random()*64,yy,1+Math.random()*2,4+Math.random()*16);}
   const g=x.createLinearGradient(0,0,0,256);g.addColorStop(0,'rgba(0,0,0,.9)');g.addColorStop(.08,'rgba(0,0,0,0)');g.addColorStop(.9,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.9)');x.fillStyle=g;x.fillRect(0,0,64,256);
   const t=new THREE.CanvasTexture(c);t.wrapS=THREE.RepeatWrapping;t.repeat.set(4,1);return t;})();
  const y1=SH_NOSE*.93,y0f=.12,fp=[];for(let i=0;i<=8;i++){const y=y0f+(y1-y0f)*i/8;fp.push(new THREE.Vector2(shipR(y)+.009,y));}
  const fg=new THREE.LatheGeometry(fp,40,-Math.PI/2,Math.PI);const fm=new THREE.MeshStandardMaterial({color:0xf3f7ff,roughness:.95,metalness:0,transparent:true,opacity:0,alphaMap:ft,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,envMapIntensity:.4});
  const fr=new THREE.Mesh(fg,fm);fr.position.y=y0;fr.name='frost';fr.visible=false;g.add(fr);}
 // aft skirt and engine bay
 {const sk=SHIPMAT.steel.clone();sk.side=THREE.DoubleSide;g.add(mesh(new THREE.CylinderGeometry(SH_R,SH_R*1.01,SH_SK,64,1,true),sk,0,y0-SH_SK/2,0));g.add(mesh(new THREE.CylinderGeometry(SH_R*.985,SH_R*.995,SH_SK,48,1,true),SHIPMAT.bayIn,0,y0-SH_SK/2,0,false));g.add(mesh(new THREE.CircleGeometry(SH_R*1.0,48).rotateX(Math.PI/2),SHIPMAT.bell,0,y0-.003,0,false));}
 g.add(mesh(new THREE.TorusGeometry(SH_R*1.005,.008,6,64).rotateX(Math.PI/2),SHIPMAT.chine,0,y0-SH_SK,0,false));
 g.add(mesh(new THREE.CircleGeometry(SH_R*.99,48).rotateX(Math.PI/2),SHIPMAT.bell,0,y0+.01,0,false));
 const bell=(rt,re,h)=>{const b=new THREE.Group();const pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push(new THREE.Vector2(rt+(re-rt)*Math.pow(t,.6),-t*h));}
  const lg=new THREE.LatheGeometry(pts,28);b.add(mesh(lg,SHIPMAT.bell,0,0,0,false));b.add(mesh(lg,SHIPMAT.bellIn,0,0,0,false));
  b.add(mesh(new THREE.CylinderGeometry(rt*.9,rt*1.1,h*.35,12),SHIPMAT.chine,0,h*.17,0,false));
  const gl=mesh(new THREE.CircleGeometry(re*.85,24).rotateX(Math.PI/2),SHIPMAT.glow,0,-h+.004,0,false);gl.name='bglow';gl.visible=false;b.add(gl);return b;};
 const sl=.65*SH_K*1.4,rv=1.15*SH_K*1.25;
 for(let i=0;i<3;i++){const a=i*2.094,b=bell(sl*.45,sl,.11);b.position.set(Math.cos(a)*.82*SH_K*1.2,y0-.005,Math.sin(a)*.82*SH_K*1.2);b.rotation.z=.05;g.add(b);} // 3 sea-level Raptors, gimballed
 for(let i=0;i<3;i++){const a=i*2.094+1.047,b=bell(rv*.42,rv,.13);b.position.set(Math.cos(a)*3.15*SH_K,y0-.005,Math.sin(a)*3.15*SH_K);g.add(b);} // 3 RVac, bigger bells
 const fl=new THREE.Mesh(new THREE.CylinderGeometry(.42,.3,1.6,24,1,true),SHIPMAT.fl);fl.rotation.x=Math.PI;fl.position.y=y0-SH_SK-.8;fl.name='flame';g.add(fl);
 const fl2=new THREE.Mesh(new THREE.ConeGeometry(.2,1.1,16),SHIPMAT.fl2);fl2.rotation.x=Math.PI;fl2.position.y=y0-SH_SK-.55;fl2.name='flame2';g.add(fl2);fl.visible=fl2.visible=false;
 g.traverse(o=>{if(o.isMesh&&o.material!==SHIPMAT.fl&&o.material!==SHIPMAT.fl2&&o.material!==SHIPMAT.glow)o.castShadow=true;});
 outer.userData.g=g;return outer;}
const FIRE=new Set(),plumeL=new THREE.PointLight(0xffa860,0,26,1.4);scene.add(plumeL);const _fp=new THREE.Vector3();
function flameFx(T){let lit=null;for(const m of FIRE){if(!m.parent){FIRE.delete(m);continue;}lit=m;break;}
 if(!lit){plumeL.intensity=0;return;}const f=lit.getObjectByName('flame2');f.getWorldPosition(_fp);plumeL.position.copy(_fp);plumeL.position.y=Math.max(.6,_fp.y-.3);plumeL.intensity=(26+Math.random()*14)*(lit.userData.fireK||1);
 SHIPMAT.fl2.opacity=.8+Math.random()*.2;SHIPMAT.fl.opacity=.55+Math.random()*.25;}
function setFrost(m,v){const f=m.getObjectByName('frost');if(f){f.material.opacity=v*.9;f.visible=v>.02;}}
function setFire(m,on){if(on)FIRE.add(m);else FIRE.delete(m);const f=m.getObjectByName('flame'),f2=m.getObjectByName('flame2');f.visible=f2.visible=on;m.traverse(o=>{if(o.name==='bglow')o.visible=on;});}
let puffs=[];const puffG=new THREE.SphereGeometry(.3,7,5);
function dust(x,z,y0=0,n=14){n=Math.min(n,130-puffs.length);for(let i=0;i<n;i++){const m=new THREE.Mesh(puffG,new THREE.MeshLambertMaterial({color:0xc07a50,transparent:true,opacity:.7}));
 const a=Math.random()*6.28;m.position.set(x,y0+.8,z);m.userData.v=new THREE.Vector3(Math.cos(a)*(1.5+Math.random()*2),.3+Math.random()*.6,Math.sin(a)*(1.5+Math.random()*2)).multiplyScalar(4);m.userData.life=m.userData.L0=1.6;W.add(m);puffs.push(m);}}
function dustRing(x,z,n=28){n=Math.min(n,130-puffs.length);for(let i=0;i<n;i++){const m=new THREE.Mesh(puffG,new THREE.MeshLambertMaterial({color:0xc58a60,transparent:true,opacity:.75,depthWrite:false}));const a=i/n*6.283+Math.random()*.2,v=3+Math.random()*2.5;
 m.position.set(x+Math.cos(a)*3.2,.6,z+Math.sin(a)*3.2);m.userData.v=new THREE.Vector3(Math.cos(a)*v,.12+Math.random()*.25,Math.sin(a)*v).multiplyScalar(4);m.userData.life=m.userData.L0=2.6;W.add(m);puffs.push(m);}}
function tickPuffs(dt){puffs=puffs.filter(m=>{m.userData.life-=dt;m.position.addScaledVector(m.userData.v,dt);m.userData.v.multiplyScalar(1-dt*1.5);const L0=m.userData.L0||1.6;m.scale.setScalar(4*(1+(L0-m.userData.life)*1.5));
 m.material.opacity=Math.max(0,m.userData.life/L0*.7);if(m.userData.life<=0){W.remove(m);m.material.dispose();return false;}return true;});}
// ship pose: y = bottom height, tilt 0 upright .. PI/2 horizontal
const _tv=new THREE.Vector3();
function tileSign(m){if(m.userData.ts)return m.userData.ts;const g=m.userData.g,o=m.rotation.x;m.rotation.x=Math.PI/2;m.updateMatrixWorld(true);_tv.set(0,0,-1).transformDirection(g.matrixWorld);m.rotation.x=o;m.userData.ts=_tv.y<0?1:-1;return m.userData.ts;}
function pose(m,y,tilt){const g=m.userData.g;m.rotation.x=tilt*(tilt?tileSign(m):1);g.position.y=0;m.position.y=y+(SH_H/2+SH_SK)*Math.cos(tilt)+(SH_R+.05)*Math.sin(tilt);}
// Starship landing profile (like the real thing): belly-flop falling horizontal (tiles down) with flap corrections,
// high-altitude relight + flip through vertical with a small overshoot, then a slow powered vertical descent.
const PADL={T:11,Y0:72,YF:30},INTROL={T:17,Y0:150,YF:54};
function landPose(m,t,P=PADL){const T=P.T,tb=T*.42,tf=Math.min(2.6,T*.2),td=T-tb-tf;let y,tilt,fire=false,ph;
 if(t<tb){const u=t/tb;y=P.Y0+(P.YF+3-P.Y0)*u;tilt=Math.PI/2+Math.sin(t*1.7)*.035+Math.sin(t*4.3)*.012;ph=0;}
 else if(t<tb+tf){const u=(t-tb)/tf;y=P.YF+3-3*u;const c1=1.9,c3=c1+1,e=1+c3*Math.pow(u-1,3)+c1*Math.pow(u-1,2);tilt=Math.PI/2*(1-e);fire=true;ph=1;}
 else{const u=Math.min(1,(t-tb-tf)/td);y=P.YF*Math.pow(1-u,2.2);tilt=(1-Math.min(1,u*4))*Math.sin((t-tb-tf)*5)*.04;fire=u<1;ph=2;}
 pose(m,y,tilt);const fl=m.getObjectByName('flame'),f2=m.getObjectByName('flame2');setFire(m,fire);
 const big=ph===1?1.8:ph===2?1.2+.6*(y/P.YF):1;const w=Math.min(1.1,big);if(fl.userData.y0===undefined){fl.userData.y0=fl.position.y+.8;f2.userData.y0=f2.position.y+.55;}const sy=(1+Math.random()*.5)*big,sy2=(1+Math.random()*.3)*big;fl.scale.set(w,sy,w);fl.position.y=fl.userData.y0-.8*sy;f2.scale.set(w,sy2,w);f2.position.y=f2.userData.y0-.55*sy2;
 const fls=m.userData.g.userData.flaps||[];fls.forEach((f,i)=>{const tw=ph===0?Math.sin(t*(5+i*1.3)+i)*.22+Math.sin(t*11+i*2)*.06:ph===1?.35*(i<2?1:-1):0;f.rotation.y=f.userData.fb+tw*Math.sign(f.userData.fb||1);});
 return{k:Math.min(1,t/T),y,ph};}
const AG={body:new THREE.BoxGeometry(.11,.13,.07),helm:new THREE.SphereGeometry(.065,10,8),visor:new THREE.SphereGeometry(.05,10,6,-.9,1.8,.9,1.1),
 pack:new THREE.BoxGeometry(.09,.11,.05),limb:new THREE.BoxGeometry(.035,.1,.035)};AG.limb.translate(0,-.05,0);
const AM={suit:new THREE.MeshStandardMaterial({color:0xf2f2f2,roughness:.6}),visor:new THREE.MeshStandardMaterial({color:0xd4a017,metalness:1,roughness:.12}),
 pack:new THREE.MeshStandardMaterial({color:0xbfc4c9,roughness:.5}),boot:new THREE.MeshStandardMaterial({color:0x555555})};
const ACC=[0xff7733,0x33aaff,0x55cc55,0xffcc33].map(c=>new THREE.MeshStandardMaterial({color:c}));
const HVM={suit:new THREE.MeshStandardMaterial({color:0xff8a12,emissive:0x6a2a00,emissiveIntensity:.35,roughness:.55}),strip:new THREE.MeshStandardMaterial({color:0xe8eef4,metalness:.9,roughness:.18,envMap:SENV,envMapIntensity:1.6,emissive:0x888888,emissiveIntensity:.35})};
const HVG={band:new THREE.BoxGeometry(.116,.013,.074),cuff:new THREE.BoxGeometry(.039,.011,.039)};
// small hi-vis astronaut / Optimus icons (canvas), shared by build bars and the HUD
function drawHV(x,cx,cy,k){x.save();x.translate(cx,cy);x.scale(k,k);x.fillStyle='#ff8a12';x.fillRect(-5,-2,10,9);x.fillRect(-8,-1,3,7);x.fillRect(5,-1,3,7);x.fillRect(-4.5,7,3.5,7);x.fillRect(1,7,3.5,7);
 x.fillStyle='#dfe8f0';x.fillRect(-5,1,10,1.6);x.fillRect(-5,4,10,1.6);x.fillRect(-8,3,3,1.4);x.fillRect(5,3,3,1.4);x.fillRect(-4.5,10.5,3.5,1.4);x.fillRect(1,10.5,3.5,1.4);
 x.fillStyle='#f4f4f4';x.beginPath();x.arc(0,-6,4.6,0,6.3);x.fill();x.fillStyle='#d4a017';x.beginPath();x.ellipse(.8,-6,2.8,2.1,0,0,6.3);x.fill();x.restore();}
function drawBot(x,cx,cy,k){x.save();x.translate(cx,cy);x.scale(k,k);x.fillStyle='#eeeeec';x.fillRect(-4.5,-2,9,9);x.fillRect(-7,-1,2.4,7);x.fillRect(4.6,-1,2.4,7);x.fillRect(-4,7,3,7);x.fillRect(1,7,3,7);
 x.fillStyle='#16171a';x.fillRect(-4.5,4,9,2);x.beginPath();x.ellipse(0,-6,3.6,4,0,0,6.3);x.fill();x.fillStyle='#4af';x.fillRect(-2.4,-6.5,4.8,1);x.restore();}
const ICONS=(()=>{const mk=f=>{const c=document.createElement('canvas');c.width=c.height=36;const x=c.getContext('2d');f(x,18,16,1.6);return c.toDataURL();};return{hv:mk(drawHV),bot:mk(drawBot)};})();
const hvImg=(k='hv')=>`<img class="hvi" src="${ICONS[k]}" alt="">`;
function astro(i){const g=new THREE.Group();const p=(geo,mat,x,y,z,sh)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(sh)m.castShadow=true;g.add(m);return m;};
 p(AG.body,AM.suit,0,.2,0,1);p(AG.helm,AM.suit,0,.32,0,1);const v=p(AG.visor,AM.visor,0,.322,.018);p(AG.pack,AM.pack,0,.21,-.055);
 p(new THREE.BoxGeometry(.112,.02,.072),ACC[i%4],0,.24,0);
 const ll=p(AG.limb,AM.boot,-.03,.135,0),lr=p(AG.limb,AM.boot,.03,.135,0),al=p(AG.limb,AM.suit,-.075,.255,0),ar=p(AG.limb,AM.suit,.075,.255,0);
 const bodyM=g.children[0],hv=[];const st=(par,geo,x,y,z)=>{const m=new THREE.Mesh(geo,HVM.strip);m.position.set(x,y,z);m.visible=false;par.add(m);hv.push(m);};
 st(g,HVG.band,0,.175,0);st(g,HVG.band,0,.215,0);for(const l of[al,ar,ll,lr])st(l,HVG.cuff,0,-.06,0);
 g.userData={ll,lr,al,ar,bodyM,hv,ph:Math.random()*6};return g;}
function setHV(m,on){const u=m.userData;if(!u.hv||u.hvOn===!!on)return;u.hvOn=!!on;const s=on?HVM.suit:AM.suit;u.bodyM.material=s;u.al.material=s;u.ar.material=s;u.ll.material=on?HVM.suit:AM.boot;u.lr.material=on?HVM.suit:AM.boot;u.hv.forEach(x=>x.visible=!!on);}
function limbs(u,w){const a=Math.sin(u.ph)*.6*w;u.ll.rotation.x=a;u.lr.rotation.x=-a;u.al.rotation.x=-a;u.ar.rotation.x=a;}
function modelV2(t){const g=new THREE.Group(),s=B[t].s0,h=s/2;
 if(t==='pad'){g.add(mesh(new THREE.BoxGeometry(s*.95,.06,s*.95),M(0x777777),h,.03,h));g.add(mesh(new THREE.CylinderGeometry(.7,.7,.02,24),M(0xffcc33),1,.07,1));
  g.add(mesh(new THREE.CylinderGeometry(.55,.55,.03,24),M(0x777777),1,.08,1));}
 else if(t==='hab'){[[.18,.18],[.82,.18],[.18,.82],[.82,.82]].forEach(([x,z])=>g.add(mesh(new THREE.CylinderGeometry(.025,.035,.07,6),M(0x666666),x,.035,z)));g.add(mesh(new THREE.SphereGeometry(.42,16,10,0,6.3,0,1.6),M(0xeeeeee),.5,.12,.5));g.add(mesh(new THREE.BoxGeometry(.2,.25,.2),M(0x4a6fa5),.5,.24,.9));}
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
function shipModel(){const g=new THREE.Group();const rk=rocket();rk.name='rk';rk.position.set(1,0,1);rk.rotation.order='YXZ';rk.rotation.y=Math.PI/4+.85;pose(rk,0,0);g.add(rk);
 const sh=new THREE.Mesh(new THREE.CircleGeometry(.5,20).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x5a2a14,transparent:true,opacity:.35,depthWrite:false}));sh.position.set(1,.012,1);g.add(sh);return g;}
function model(t,lvl=1){if(t==='ship')return shipModel();let g;if(V2.has(t))g=modelV2(t);else if(NEWM[t])g=NEWM[t](lvl);else g=modelNew(t,lvl);
 if(lvl>1&&B[t].cat==='b'){const s=B[t].s;for(let i=1;i<lvl;i++){const x=s*.15+i*.12,z=s*.12;g.add(mesh(new THREE.CylinderGeometry(.012,.012,.45,6),M(0x999999),x,.25,z));g.add(mesh(new THREE.SphereGeometry(.04,8,6),MAT.yellow,x,.5,z,false));}
  g.children.forEach(c=>{if(c.position.y>.06){c.scale.y*=1+.15*(lvl-1);c.position.y*=1+.15*(lvl-1);}});
  const s2=B[t].s,rc=[0,0x9ad0ff,0x66ff99,0xffd166,0xff7aff][lvl-1];g.add(mesh(new THREE.TorusGeometry(s2*.46,.025,6,32).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:rc,emissive:rc,emissiveIntensity:.5}),s2/2,.09,s2/2,false));
  if(lvl>=5){const st=mesh(new THREE.OctahedronGeometry(.09,0),MAT.gold,s2/2,s2*.6+1,s2/2,false);st.name='spin';g.add(st);}}
 if(B[t].cat==='b'){const s=B[t].s;[[.06,.06],[s-.06,s-.06]].forEach(([x,z])=>{g.add(mesh(new THREE.SphereGeometry(.03,8,6),lampMat,x,.1,z,false));const sp=new THREE.Sprite(glowMat);sp.scale.set(.45,.45,.45);sp.position.set(x,.12,z);g.add(sp);});
  g.add(mesh(new THREE.BoxGeometry(s*.5,.025,.01),winMat,s/2,.06,s*.476+.002,false));const pool=new THREE.Mesh(new THREE.CircleGeometry(s*.75,20).rotateX(-Math.PI/2),poolMat);pool.position.set(s/2,.015,s/2);g.add(pool);}
 return g;}
// ---------- state helpers
let occ=[],occV=0;const objs=new Map();let uid=1,cid=1;const D4=[[1,0],[-1,0],[0,1],[0,-1]];
const TK=(x,z)=>x+','+z;const tile=(x,z)=>S.tiles[TK(x,z)]||0;const walk=(x,z)=>tile(x,z)>0;const isRoad=()=>false;
function rebuildOcc(){occ=Array.from({length:N},()=>Array(N).fill(null));S.b.forEach(b=>{for(let i=0;i<B[b.t].s;i++)for(let j=0;j<B[b.t].s;j++)if(occ[b.x+i])occ[b.x+i][b.z+j]=b;});occV++;tdecoSync();}
function free(t,x,z,ign){const s=B[t].s;if(x<0||z<0||x+s>N||z+s>N)return false;for(let i=0;i<s;i++)for(let j=0;j<s;j++){const o=occ[x+i][z+j];if((o&&o!==ign)||blocked[x+i][z+j]||tile(x+i,z+j)||boulderAt(x+i,z+j))return false;}return true;}
function boulderAt(x,z){if(IGB||!S||S.demo)return false;const i=BOUL.get(TK0(x|0,z|0));return i!==undefined&&!(S.bcl||[]).includes(i);}
// boulders: an Optimus walks over, breaks it up (time ∝ size) and brings back bricks 🧱
let miners=[];
function mineBoulder(i){if(miners.some(m=>m.i===i))return 0;if(!(S.bots||[]).length){toast('🤖 Boulder in the way — you need an Optimus robot to break it up (Optimus Bay)',1);return 0;}
 const r=TD.rocks[i],srcB=S.b.find(b=>b.t==='robot'&&!(b.cons>0))||S.b.find(b=>b.t==='ship')||S.b.find(b=>b.t==='pad');const c=srcB?bc(srcB):{x:r.x+12,z:r.z+12};
 const m=optimus();m.scale.setScalar(2.6);m.position.set(c.x,0,c.z);m.visible=false;W.add(m);miners.push({i,m,st:'wait',x0:c.x,z0:c.z,w:5+r.s*30,y:Math.round(10+r.s*110)});return 1;}
function tickMiners(dt){if(!miners.length)return;const cap=Math.min(3,(S.bots||[]).length);let act=0;miners=miners.filter(q=>{const r=TD.rocks[q.i],p=q.m.position;
 if(q.st==='wait'){if(act>=cap)return true;q.st='go';q.m.visible=true;}act++;const walk=(tx,tz)=>{const dx=tx-p.x,dz=tz-p.z,l=Math.hypot(dx,dz);const sp=dt*4.4;q.m.rotation.y=Math.atan2(dx,dz);const a=Math.sin(performance.now()/90)*.5;const lL=q.m.getObjectByName('legL'),lR=q.m.getObjectByName('legR');if(lL)lL.rotation.x=a;if(lR)lR.rotation.x=-a;if(l<=sp){p.x=tx;p.z=tz;return true;}p.x+=dx/l*sp;p.z+=dz/l*sp;return false;};
 if(q.st==='go'){const dx=r.x-q.x0,dz=r.z-q.z0,l=Math.hypot(dx,dz)||1;if(walk(r.x-dx/l*(r.s+.9),r.z-dz/l*(r.s+.9)))q.st='work';}
 else if(q.st==='work'){q.w-=dt;const aR=q.m.getObjectByName('armR'),aL=q.m.getObjectByName('armL'),k=Math.sin(performance.now()/110);if(aR)aR.rotation.x=-1.2+k*.9;if(aL)aL.rotation.x=-1.2-k*.9;if(Math.random()<dt*2)dust(r.x,r.z,0,1);
  if(q.w<=0){(S.bcl||(S.bcl=[])).push(q.i);S.mat+=q.y;floatText(`+${q.y} 🧱`);toast(`🪨 Boulder broken up: +${q.y} 🧱 — the spot is clear`);dust(r.x,r.z,0,6);tdecoSync();updPrev();q.st='back';}}
 else if(q.st==='back'){if(walk(q.x0,q.z0)){W.remove(q.m);return false;}}return true;});}
function tapBoulder(h){if(!h)return false;const i=BOUL.get(TK0(h.x,h.z));if(i===undefined||(S.bcl||[]).includes(i)||occ[h.x]?.[h.z])return false;if(miners.some(m=>m.i===i)){toast('🤖 An Optimus is already on it');return true;}if(mineBoulder(i))toast(`🤖 Optimus dispatched to break up the boulder (+🧱 when done)`);return true;}
const bc=b=>({x:b.x+B[b.t].s/2,z:b.z+B[b.t].s/2});
const by=b=>0;const by_old=b=>{const c=bc(b);const s=B[b.t].s;let m=1e9;for(const[dx,dz]of[[0,0],[-.4,-.4],[.4,.4],[-.4,.4],[.4,-.4]])m=Math.min(m,hgt(c.x+dx*s,c.z+dz*s));return m-.02;};
const cap=b=>Math.round((B[b.t].house||0)*LV[b.lvl-1]*(b.spec==='barracks'?1.5:b.spec==='science'?.8:1));const jobs=b=>Math.round((B[b.t].jobs||0)*LV[b.lvl-1]);
const isDeco=t=>B[t].cat==='d';
function defName(t){let n=1;const used=new Set(S.b.filter(b=>b.t===t).map(b=>b.name));while(used.has(B[t].n+' '+n))n++;return B[t].n+' '+n;}
function rmObj(o){if(!o)return;const P=o.parent&&o.parent.userData.pv?o.parent:o;if(P.parent)P.parent.remove(P);if(o.userData.doorG)W.remove(o.userData.doorG);}
function pivotPos(b,P,y){const d=B[b.t];P.position.set(b.x+d.s/2,y??by(b),b.z+d.s/2);}
function placeObj(b){const old=objs.get(b.id);if(old)rmObj(old);const o=model(b.t,b.lvl);o.userData.bt=b.t;if(b.spec)specParts(o,b.spec);details(o,b);{const d=B[b.t],P=new THREE.Group();P.userData.pv=1;P.add(o);o.position.set(-d.s0/2,0,-d.s0/2);P.scale.setScalar(d.s/d.s0);P.rotation.y=-(b.r||0)*Math.PI/2;pivotPos(b,P);W.add(P);}objs.set(b.id,o);
 if(!isDeco(b.t)&&b.t!=='ship'){const w=new THREE.Sprite(warnMat);w.scale.set(.45,.45,.45);w.position.set(B[b.t].s0/2,1.1+B[b.t].s0*.3,B[b.t].s0/2);w.renderOrder=9;w.name='warn';w.visible=false;o.add(w);}
 doorModel(b);return o;}
function addB(t,x,z,silent,extra={}){const b={t,x,z,r:extra.r||0,id:extra.id||uid++,lvl:extra.lvl||1,name:extra.name||null,wave:extra.wave||0,ship:null,timer:extra.timer,hold:extra.hold,stock:extra.stock||0};uid=Math.max(uid,b.id+1);if(!b.name)b.name=defName(t);
 S.b.push(b);rebuildOcc();if(t==='pad'&&b.timer==null)b.timer=S.b.filter(q=>q.t==='pad').length>1?shipInterval(b):TUNE.FIRST_SHIP_AFTER;const o=placeObj(b);if(!silent){o.scale.set(1,.01,1);o.userData.grow=0;}refreshDoors();return b;}
function delB(b){S.b=S.b.filter(x=>x!==b);const o=objs.get(b.id);rmObj(o);objs.delete(b.id);if(b.ship)W.remove(b.ship.F||b.ship.m);
 S.cols.forEach(c=>{if(c.home===b.id)c.home=null;if(c.work===b.id)c.work=null;});agents.forEach(a=>{if(a.at===b.id||a.dest===b.id){a.st='in';a.at=null;a.m.visible=false;}});rebuildOcc();refreshDoors();}
const byId=id=>S.b.find(b=>b.id===id);
// ---------- doors / connectivity
function perim(b){const s=B[b.t].s,o=[];for(let i=0;i<s;i++){o.push([b.x+i,b.z+s],[b.x+s,b.z+i],[b.x+i,b.z-1],[b.x-1,b.z+i]);}return o.filter(([x,z])=>x>=0&&z>=0&&x<N&&z<N);}
function near2(b){const s=B[b.t].s,o=[];for(let i=-3;i<s+3;i++)for(let j=-3;j<s+3;j++){if(i>=0&&i<s&&j>=0&&j<s)continue;const x=b.x+i,z=b.z+j;if(x<0||z<0||x>=N||z>=N)continue;
 const d=Math.max(i<0?-i:i>=s?i-s+1:0,j<0?-j:j>=s?j-s+1:0)+(i<0||i>=s)*(j<0||j>=s)*.5;o.push([x,z,d]);}return o.sort((a,c)=>a[2]-c[2]);}
function refreshDoors(){S.b.forEach(b=>{if(isDeco(b.t))return;const p=near2(b);const prevD=b.door;let d=p.find(([x,z])=>prevD&&x===prevD.x&&z===prevD.z&&walk(x,z));
 if(!d)d=p.find(([x,z])=>walk(x,z));b.door=d?{x:d[0],z:d[1]}:null;b.rdoor=null;
 if(!prevD!==!b.door||(prevD&&b.door&&(prevD.x!==b.door.x||prevD.z!==b.door.z)))doorModel(b);const o=objs.get(b.id);const w=o&&o.getObjectByName('warn');if(w)w.visible=!b.door;});pathsDirty=true;}
function doorModel(b){const o=objs.get(b.id);if(!o)return;const old=o.userData.doorG;if(old){W.remove(old);o.userData.doorG=null;}if(!b.door||b.t==='pad'||b.t==='solar'||b.t==='ship'||b.t==='battery'||b.t==='wtank'||isDeco(b.t))return;
 const s=B[b.t].s,c={x:s/2,z:s/2};let dx=b.door.x+.5-b.x-c.x,dz=b.door.z+.5-b.z-c.z;const S0=B[b.t].s0;if(Math.abs(dx)>Math.abs(dz)){dx=Math.sign(dx);dz=0;}else{dz=Math.sign(dz);dx=0;}
 const g=new THREE.Group();g.name='door';const tube=mesh(cyl(.085,.085,.28,14),MAT.white,0,.085,0);tube.rotation.set(dz?Math.PI/2:0,0,dx?Math.PI/2:0);g.add(tube);
 const dr=mesh(cyl(.06,.06,.01,14),MAT.dark,dx*.14,.085,dz*.14,false);dr.rotation.copy(tube.rotation);g.add(dr);
 const lt=mesh(new THREE.SphereGeometry(.018,6,4),lampMat,dx*.1,.18,dz*.1,false);g.add(lt);g.scale.setScalar(4*Math.min(1.4,Math.max(.7,S0*.9)));g.position.set(b.x+c.x+dx*(s/2-.5),0,b.z+c.z+dz*(s/2-.5));o.userData.doorG=g;W.add(g);}
// ---------- paths mesh (auto-connect)
let pathMesh=null,pathsDirty=true;const pathMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.92,envMapIntensity:.25,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
function rebuildPaths(){pathsDirty=false;tdecoSync();if(pathMesh){W.remove(pathMesh);pathMesh.geometry.dispose();}const P=[],C=[],I=[];
 const quad=(x0,z0,x1,z1,off,c)=>{const n=P.length/3;for(const[x,z]of[[x0,z0],[x1,z0],[x1,z1],[x0,z1]]){P.push(x,hgt(x,z)+off,z);C.push(...c);}I.push(n,n+2,n+1,n,n+3,n+2);};
 const doors=new Map();S.b.forEach(b=>{if(b.door){const k=TK(b.door.x,b.door.z);if(!doors.has(k))doors.set(k,[]);doors.get(k).push(b);}});
 for(const k in S.tiles){const [x,z]=k.split(',').map(Number),t=S.tiles[k],cx=x+.5,cz=z+.5,w=.5;const v=.92+((x*7+z*13)%5)*.02;
  const col=t===2?[.34*v,.3*v,.28*v]:[.86*v,.7*v,.54*v];quad(cx-w,cz-w,cx+w,cz+w,.035,col);
  const nb=D4.map(([dx,dz])=>walk(x+dx,z+dz)||(doors.get(k)||[]).some(b=>{const s=B[b.t].s;return x+dx>=b.x&&x+dx<b.x+s&&z+dz>=b.z&&z+dz<b.z+s;}));
  nb.forEach((on,i)=>{if(!on)return;const[dx,dz]=D4[i];const ww=t===2&&isRoad(x+dx,z+dz)?w:.2;
   if(dx===1)quad(cx+w,cz-ww,x+1,cz+ww,.035,col);if(dx===-1)quad(x,cz-ww,cx-w,cz+ww,.035,col);if(dz===1)quad(cx-ww,cz+w,cx+ww,z+1,.035,col);if(dz===-1)quad(cx-ww,z,cx+ww,cz-w,.035,col);});
  if(t===2){const y=[.85,.75,.35];const ns=D4.map(([dx,dz])=>isRoad(x+dx,z+dz));
   
   const e=[.55,.5,.45];if(!ns[2]&&!walk(x,z+1))quad(cx-.45,z+.93,cx+.45,z+.96,.05,e);if(!ns[3]&&!walk(x,z-1))quad(cx-.45,z+.04,cx+.45,z+.07,.05,e);
   if(!ns[0]&&!walk(x+1,z))quad(x+.93,cz-.45,x+.96,cz+.45,.05,e);if(!ns[1]&&!walk(x-1,z))quad(x+.04,cz-.45,x+.07,cz+.45,.05,e);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();
 pathMesh=new THREE.Mesh(g,pathMat);pathMesh.receiveShadow=true;W.add(pathMesh);}
function hpush(h,v){h.push(v);let i=h.length-1;while(i>0){const p=(i-1)>>1;if(h[p][0]<=h[i][0])break;[h[p],h[i]]=[h[i],h[p]];i=p;}}
function hpop(h){const top=h[0],l=h.pop();if(h.length){h[0]=l;let i=0;for(;;){const a=2*i+1,b=a+1;let m=i;if(a<h.length&&h[a][0]<h[m][0])m=a;if(b<h.length&&h[b][0]<h[m][0])m=b;if(m===i)break;[h[m],h[i]]=[h[i],h[m]];i=m;}}return top;}
// ---------- A* pathfinding on path/road tiles
function astar(s,t,ok,cf){if(!s||!t)return null;const K=(x,z)=>x*N+z,tk=K(t.x,t.z),g=new Map(),from=new Map(),open=[[0,s.x,s.z]];g.set(K(s.x,s.z),0);let it=0;
 while(open.length&&it++<40000){const[,x,z]=hpop(open);const k=K(x,z);
  if(k===tk){const p=[];let c=k;while(c!==undefined){p.push({x:(c/N)|0,z:c%N});c=from.get(c);}return p.reverse();}
  const gc=g.get(k);for(const[dx,dz]of D4){const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=N||nz>=N||!ok(nx,nz))continue;const nk=K(nx,nz),ng=gc+(cf?cf(nx,nz):(isRoad(nx,nz)?.9:1));if(g.has(nk)&&g.get(nk)<=ng)continue;g.set(nk,ng);from.set(nk,k);hpush(open,[ng+Math.abs(nx-t.x)+Math.abs(nz-t.z),nx,nz]);}}
 return null;}
// ---------- colonists
function assign(){const ids=new Set(S.b.map(b=>b.id));const res={},wk={};S.b.forEach(b=>{b.res=0;b.wk=0;});
 S.cols.forEach(c=>{if(c.home&&!ids.has(c.home))c.home=null;if(c.work&&!ids.has(c.work))c.work=null;if(c.home)res[c.home]=(res[c.home]||0)+1;if(c.work&&!c.build)wk[c.work]=(wk[c.work]||0)+1;});
 const hs=S.b.filter(b=>cap(b)>0).sort((a,b)=>!!b.door-!!a.door),ws=S.b.filter(b=>jobs(b)>0).sort((a,b)=>!!b.door-!!a.door);
 S.cols.forEach(c=>{if(!c.home){const h=hs.find(b=>(res[b.id]||0)<cap(b));if(h){c.home=h.id;res[h.id]=(res[h.id]||0)+1;}}
  else{const hb=byId(c.home);if(!hb.door){const h=hs.find(b=>b.door&&(res[b.id]||0)<cap(b));if(h){res[c.home]--;c.home=h.id;res[h.id]=(res[h.id]||0)+1;}}}
  if(!c.work&&!c.kid&&!c.build){const w=ws.find(b=>(wk[b.id]||0)<jobs(b));if(w){c.work=w.id;wk[w.id]=(wk[w.id]||0)+1;}}});
 S.b.forEach(b=>{b.res=res[b.id]||0;b.wk=wk[b.id]||0;});}
function newCol(){const c={id:cid++,n:rname(),home:null,work:null,mood:Math.random()*10-5};S.cols.push(c);return c;}
function colHap(c){let h=S.hap+c.mood;const hb=c.home&&byId(c.home);if(!hb)h-=30;else if(!hb.door)h-=10;if(!c.work)h-=10;return Math.max(0,Math.min(100,Math.round(h)));}

// ---------- Optimus robots: power-only workers that speed up construction & mining
let bots=[];const OPT={w:M(0xeeeeec,.35,.1),k:M(0x16171a,.3,.5),v:new THREE.MeshStandardMaterial({color:0x0b0c10,metalness:.6,roughness:.15,emissive:0x3a6aff,emissiveIntensity:.25})};
function optimus(){const g=new THREE.Group(),b=new THREE.Group();g.add(b);const cap=(r,l)=>new THREE.CapsuleGeometry(r,l,4,8);
 const leg=sd=>{const p=new THREE.Group();p.position.set(sd*.035,.2,0);p.add(mesh(cap(.022,.07),OPT.w,0,-.05,0));p.add(mesh(new THREE.SphereGeometry(.024,8,6),OPT.k,0,-.1,0,false));p.add(mesh(cap(.019,.07),OPT.w,0,-.15,0));p.add(mesh(rbox(.04,.02,.06,.008),OPT.k,0,-.195,.01,false));p.name='leg'+(sd>0?'R':'L');return p;};
 const arm=sd=>{const p=new THREE.Group();p.position.set(sd*.075,.33,0);p.add(mesh(new THREE.SphereGeometry(.024,8,6),OPT.w,0,0,0,false));p.add(mesh(cap(.016,.07),OPT.w,0,-.055,0));p.add(mesh(cap(.014,.06),OPT.k,0,-.13,0,false));p.name='arm'+(sd>0?'R':'L');return p;};
 b.add(leg(-1),leg(1),arm(-1),arm(1));b.add(mesh(rbox(.11,.1,.07,.025),OPT.w,0,.3,0));b.add(mesh(rbox(.085,.05,.06,.02),OPT.k,0,.225,0,false));
 b.add(mesh(rbox(.06,.035,.005,.004),OPT.k,0,.32,.036,false));b.add(mesh(cyl(.015,.018,.02,8),OPT.k,0,.36,0,false));
 const h=mesh(new THREE.SphereGeometry(.033,14,10),OPT.w,0,.395,0);h.scale.set(1,1.1,1.05);b.add(h);const v=mesh(new THREE.SphereGeometry(.031,14,10,-.9,1.8,.7,1.3),OPT.v,0,.395,.006,false);v.rotation.y=0;v.scale.set(1,1.1,1.1);b.add(v);
 const cr=mesh(rbox(.09,.06,.07,.01),M(0x9a6a3a,.8),0,.33,.06,false);cr.name='crate';cr.visible=false;b.add(cr);g.scale.setScalar(.72);return g;}
function botsWant(){if(!S||S.demo)return 0;let n=S.botsLanded===undefined?2:Math.min(2,S.botsLanded);S.b.forEach(b=>{if(b.t==='robot'&&!(b.cons>0))n+=Math.round(B.robot.bots*LV[b.lvl-1]);});return Math.min(40,n);}
function botsAt(id,kind){let n=0;for(const t of bots)if(t.st==='work'&&t.job&&t.job.id===id&&t.kind===kind)n++;return n;}
function syncBots(){const want=botsWant();if(!S.bots)S.bots=[];while(S.bots.length<want){S.bots.push(1);if(bots.length>=2&&!S.demo)toast('🤖 A new Optimus robot rolled out of the bay');}while(S.bots.length>want)S.bots.pop();
 while(bots.length>S.bots.length)W.remove(bots.pop().m);
 while(bots.length<S.bots.length){const home=S.b.find(b=>b.t==='robot'&&!(b.cons>0))||S.b.find(b=>b.t==='pad')||S.b.find(b=>b.t==='ship');if(!home)break;const c=bc(home),m=optimus(),a=Math.random()*6.28,r=B[home.t].s*.5+1.6;m.scale.setScalar(2.8);
  m.position.set(c.x+Math.cos(a)*r,hgt(c.x+Math.cos(a)*r,c.z+Math.sin(a)*r),c.z+Math.sin(a)*r);W.add(m);bots.push({m,st:'idle',wait:Math.random(),ph:Math.random()*6});}
 // job assignment: construction (≤3 per site) > mines (≤2) > haul crates
 const load=new Map();bots.forEach(t=>{if(t.job&&(isSite(t.job)||t.kind!=='build')&&S.b.includes(t.job))load.set(t.job.id,(load.get(t.job.id)||0)+1);else if(t.st!=='idle'&&t.kind==='build'){t.st='idle';t.job=null;}});
 bots.forEach(t=>{if(t.st!=='idle'&&t.kind!=='haul')return;const site=S.b.find(b=>isSite(b)&&(b._arr||0)>0&&(load.get(b.id)||0)<3);
  if(site){if(t.job)load.set(t.job.id,(load.get(t.job.id)||1)-1);t.job=site;t.kind='build';t.st='go';load.set(site.id,(load.get(site.id)||0)+1);return;}
  if(t.st!=='idle')return;{const procs=S.b.filter(b=>b.t==='proc'&&!(b.cons>0));const full=S.b.filter(b=>b.t==='mine'&&!(b.cons>0)&&(b.stock||0)>=6&&!bots.some(o=>o!==t&&o.job===b&&o.kind==='ore'));
  if(procs.length&&full.length){t.job=full.sort((a,b)=>(b.stock||0)-(a.stock||0))[0];t.kind='ore';t.st='go';t.load=0;return;}}const mine=S.b.find(b=>b.t==='mine'&&!(b.cons>0)&&(load.get(b.id)||0)<2);if(mine){t.job=mine;t.kind='mine';t.st='go';load.set(mine.id,(load.get(mine.id)||0)+1);return;}
  const procs=S.b.filter(b=>b.t==='proc'&&!(b.cons>0));const full=S.b.filter(b=>b.t==='mine'&&!(b.cons>0)&&(b.stock||0)>=6&&!bots.some(o=>o!==t&&o.job===b&&o.kind==='ore'));
  if(procs.length&&full.length){t.job=full.sort((a,b)=>(b.stock||0)-(a.stock||0))[0];t.kind='ore';t.st='go';t.load=0;return;}
  const pr=S.b.filter(b=>!(b.cons>0)&&b.t!=='ship');if(pr.length){t.job=pr[Math.random()*pr.length|0];t.kind='haul';t.st='go';}});}
function botWalk(t,b,dt){const p=t.m.position,c=bc(b),dx=c.x-p.x,dz=c.z-p.z,d=Math.hypot(dx,dz),stop=B[b.t].s*.5+1;if(d<stop)return true;
 let want=Math.atan2(dx,dz);for(const o of[0,.6,-.6,1.2,-1.2,1.8,-1.8]){const a=want+o;const q=occ[(p.x+Math.sin(a)*1.4)|0]?.[(p.z+Math.cos(a)*1.4)|0];if(!q||q===b||isDeco(q.t)){want=a;break;}}
 let da=want-t.m.rotation.y;da=Math.atan2(Math.sin(da),Math.cos(da));t.m.rotation.y+=da*Math.min(1,dt*8);const sp=Math.min(d,3.6*dt);
 p.x+=Math.sin(t.m.rotation.y)*sp;p.z+=Math.cos(t.m.rotation.y)*sp;p.y=hgt(p.x,p.z);t.stuck=(t.stuck||0)+dt;if(t.stuck>25){const e=edgeTo(b,{x:p.x,z:p.z});p.x=e.x;p.z=e.z;}return false;}
function tickBots(dt){bots.forEach(t=>{const g=t.m.children[0],A=n=>g.getObjectByName(n);t.ph+=dt*9;const cr=g.getObjectByName('crate');cr.visible=(t.kind==='haul'||t.kind==='ore'&&t.load>0)&&t.st==='go';
 if(t.job&&!S.b.includes(t.job)){t.st='idle';t.job=null;}
 let walk=0,swing=0;if(t.st==='go'&&t.job){t.wait=0;walk=1;if(botWalk(t,t.job,dt)){t.stuck=0;if(t.kind==='ore'){if(t.job.t==='mine'){const n=Math.min(t.job.stock||0,12);t.job.stock-=n;t.load=n;const pr=S.b.filter(b=>b.t==='proc'&&!(b.cons>0));if(!pr.length||!n){t.st='idle';t.job=null;}else{t.job=nearestB(pr,t.m.position);t.st='go';}}
   else{deliverOre(t.job,t.load);t.load=0;t.st='idle';t.job=null;}}else{t.st='work';t.wait=t.kind==='haul'?2:t.kind==='mine'?8:999;}}}
 else if(t.st==='work'){swing=1;t.wait-=dt;const c=bc(t.job);t.m.rotation.y=Math.atan2(c.x-t.m.position.x,c.z-t.m.position.z);if(t.kind==='build'&&!isSite(t.job)||t.wait<=0){t.st='idle';t.job=null;}}
 const sL=walk?Math.sin(t.ph)*.6:0;A('legL').rotation.x=sL;A('legR').rotation.x=-sL;
 A('armL').rotation.x=walk?(cr.visible?-1.1:-sL*.8):swing?-1.2+Math.sin(t.ph*1.3)*.5:0;A('armR').rotation.x=walk?(cr.visible?-1.1:sL*.8):swing?-1.2-Math.sin(t.ph*1.3)*.5:0;
 g.position.y=walk?Math.abs(Math.sin(t.ph))*.012:0;g.rotation.x=swing?.25:0;});}

// ---------- Starship cargo/crew elevator: everything on the surface came down this lift
let unloads=[];
function startUnload(o){// o:{sid,cx,cz,gy,items:[{k:'crew',n}|{k:'bot'}|{k:'truck'}|{k:'cargo',mat}],onCrew,pad}
 const ang=Math.PI/4+rot,dx=Math.sin(ang),dz=Math.cos(ang),R0=SH_R+.36,HY=2.35;const g=new THREE.Group();g.position.set(o.cx,o.gy,o.cz);g.scale.setScalar(4);g.rotation.y=Math.atan2(dx,dz);W.add(g);
 const hatch=mesh(rbox(.5,.42,.05,.02),M(0x14161a,.4,.5),0,HY+.12,SH_R-.005,false);hatch.scale.y=.05;g.add(hatch);const lit=mesh(new THREE.BoxGeometry(.44,.36,.01),M(0xffe7b0,.5,0,{emissive:0xffd890,emissiveIntensity:1.1}),0,HY+.12,SH_R-.02,false);lit.visible=false;g.add(lit);
 g.add(mesh(rbox(.9,.04,.06,.01),MAT.steel,0,HY+.36,R0-.05,false));const plat=new THREE.Group();g.add(plat);plat.position.set(0,HY,R0);
 plat.add(mesh(rbox(1.25,.04,.62,.015),M(0x8a8e94,.5,.6),0,0,0));plat.add(mesh(new THREE.BoxGeometry(1.25,.12,.012),MAT.yellow,0,.06,.31,false));
 const cab=[];for(const sx of[-.58,.58]){const c=mesh(cyl(.006,.006,1,4),MAT.dark,sx,0,R0-.05,false);g.add(c);cab.push(c);}
 unloads.push({...o,g,plat,hatch,lit,cab,HY,R0,dx,dz,ph:'open',t:0,pay:null,i:0});}
function unloadPayload(u,it){const p=new THREE.Group();u.plat.add(p);if(it.k==='crew'){for(let i=0;i<it.n;i++){const a=astro(cid+i);a.scale.setScalar(.8);a.position.set((i-(it.n-1)/2)*.22,.02,0);a.rotation.y=0;p.add(a);}}
 else if(it.k==='bot'){const b=optimus();b.position.y=.02;p.add(b);}else if(it.k==='truck'){const t=truckModel();t.rotation.y=Math.PI/2;t.position.y=.02;p.add(t);}
 else{for(let i=0;i<3;i++)p.add(mesh(rbox(.26,.2,.26,.02),M(0x9a6a3a,.8),(i-1)*.3,.12,0));}return p;}
function landItem(u,it){const ox=u.cx+u.dx*u.R0*4,oz=u.cz+u.dz*u.R0*4,gx=u.cx+u.dx*(u.R0+.9)*4,gz=u.cz+u.dz*(u.R0+.9)*4;const tx=-u.dz,tz=u.dx;
 if(it.k==='crew'){for(let i=0;i<it.n;i++){const c=newCol();c.spawn=u.sid;if(S.crewPending)S.crewPending--;syncAgents();const a=agents.get(c.id);if(a){const off=(i-(it.n-1)/2)*.88;a.m.position.set(ox+tx*off,u.gy+.02,oz+tz*off);a.m.visible=true;a.st='out';a.at=u.sid;a.gp=new THREE.Vector3(gx+tx*off*1.6+(Math.random()-.5)*1.2,0,gz+tz*off*1.6+(Math.random()-.5)*1.2);}}assign();}
 else if(it.k==='bot'){S.botsLanded=(S.botsLanded||0)+1;syncBots();const t=bots[bots.length-1];if(t){t.m.position.set(ox,u.gy,oz);t.m.rotation.y=Math.atan2(u.dx,u.dz);t.st='idle';t.wait=1.5;}if(!S.demo)toast('🤖 An Optimus robot stepped off the cargo lift');}
 else if(it.k==='truck'){S.truckIn=1;syncTrucks();const t=trucks[trucks.length-1];if(t){t.m.position.set(ox,u.gy,oz);t.m.rotation.y=Math.atan2(u.dx,u.dz);t.wait=2;}if(!S.demo)toast('🛻 The Cybertruck was lowered from the cargo bay');}
 else if(it.parts){S.parts=(S.parts||0)+it.parts;if(!S.demo){floatText(`+${it.parts} ⚙️`);toast(`📦 Parts crate down the lift: +${it.parts} ⚙️`);}}else{S.mat+=it.mat;if(!S.demo){floatText(`+${it.mat} 🧱`);toast(`📦 Materials pallet down the lift: +${it.mat} 🧱`);}}}
const palletN=()=>100+Math.floor(Math.random()*101);
function finishUnload(u){for(;u.i<u.items.length;u.i++)landItem(u,u.items[u.i]);u.done=1;}
function tickUnloads(dt){unloads=unloads.filter(u=>{if(u.done||!S.b.some(b=>b.id===u.sid)){if(!u.done)finishUnload(u);W.remove(u.g);return false;}u.t+=dt;const p=u.plat;
 const setCab=()=>u.cab.forEach(c=>{const L=Math.max(.01,u.HY+.36-p.position.y);c.scale.y=L;c.position.y=p.position.y+L/2;});
 if(u.ph==='open'){const k=Math.min(1,u.t/.7);u.hatch.scale.y=1-k*.95;u.hatch.position.y=u.HY+.12+k*.2;u.lit.visible=k>.3;if(k>=1){u.ph='load';u.t=0;}}
 else if(u.ph==='load'){if(u.i>=u.items.length){u.ph='close';u.t=0;}else{u.pay=unloadPayload(u,u.items[u.i]);u.ph='down';u.t=0;}}
 else if(u.ph==='down'){p.position.y=Math.max(0,p.position.y-dt*1.3);if(p.position.y<=0){u.ph='off';u.t=0;}}
 else if(u.ph==='off'){if(u.t>.35){p.remove(u.pay);u.pay=null;landItem(u,u.items[u.i]);u.i++;u.ph='up';u.t=0;}}
 else if(u.ph==='up'){p.position.y=Math.min(u.HY,p.position.y+dt*1.6);if(p.position.y>=u.HY){u.ph='load';u.t=0;}}
 else if(u.ph==='close'){const k=Math.min(1,u.t/.7);u.hatch.scale.y=.05+k*.95;u.hatch.position.y=u.HY+.32-k*.2;u.lit.visible=k<.7;if(k>=1){if(u.onDone)u.onDone();W.remove(u.g);return false;}}
 setCab();return true;});}
// ---------- astronaut agents
let agents=new Map();const MAXA=90;
function syncAgents(){const want=new Set(S.cols.slice(0,MAXA).map(c=>c.id));agents.forEach((a,id)=>{if(!want.has(id)){W.remove(a.m);agents.delete(id);}});
 S.cols.slice(0,MAXA).forEach((c,i)=>{if(!agents.has(c.id)){const m=astro(c.id);m.scale.setScalar(c.kid?1.4:2.3);m.visible=false;W.add(m);m.userData.cid=c.id;
  agents.set(c.id,{c,m,st:'in',at:c.spawn||c.home,wait:c.spawn?0.5:Math.random()*8,off:(Math.random()-.5)*.3});delete c.spawn;}});}
function edgeTo(b,o){const c=bc(b),dx=o.x-c.x,dz=o.z-c.z,l=Math.hypot(dx,dz)||1,r=B[b.t].s*.5+.4;return new THREE.Vector3(c.x+dx/l*r,0,c.z+dz/l*r);}
function edgePos(b,door){const c=bc(b);return new THREE.Vector3((c.x+door.x+.5)/2,0,(c.z+door.z+.5)/2);}
function leisure(){const l=S.b.filter(b=>b.door&&(b.t==='ent'||b.t==='farm'||b.t==='bigfarm'||b.t==='med'||b.t==='pad'));return l.length?l[Math.random()*l.length|0]:null;}
function crewRoute(a,c,sb){const at=a.at&&byId(a.at),cs=bc(sb),st=a.st==='in'&&at?edgeTo(at,cs):a.m.position.clone();const s=B[sb.t].s;let best=null,bd=1e9;
 for(let i=-1;i<=s;i++)for(let j=-1;j<=s;j++){if(i>=0&&i<s&&j>=0&&j<s)continue;const x=sb.x+i,z=sb.z+j;if(x<0||z<0||x>=N||z>=N||occ[x][z])continue;const d=Math.hypot(x+.5-st.x,z+.5-st.z);if(d<bd){bd=d;best={x,z};}}
 const ab=at?[at,sb]:[sb];const p=best?routeC(st.x,st.z,best.x+.5,best.z+.5,ab).slice(0,-1).map(q=>({x:Math.floor(q.x),z:Math.floor(q.z)})):null;
 a.path=p||[];a.pi=0;a.fp=1;a.bld=1;a.dest=sb.id;a.st='walk';a.m.position.set(st.x,hgt(st.x,st.z),st.z);a.m.visible=true;const e=best?{x:best.x+.5,z:best.z+.5}:edgeTo(sb,st);a.endp=new THREE.Vector3(e.x,0,e.z);setHV(a.m,1);}
function tickAgents(dt){agents.forEach(a=>{const u=a.m.userData,c=a.c;setHV(a.m,!!c.build);
 if(a.st==='bld'){const sb=c.build&&byId(c.build);if(!sb||c.build!==a.dest){onSite.delete(c.id);a.st='in';a.at=a.dest;a.wait=.5;a.fp=0;return;}const cs=bc(sb),p=a.m.position;a.m.rotation.y=Math.atan2(cs.x-p.x,cs.z-p.z);u.ph+=dt*7;u.al.rotation.x=-1.1+Math.sin(u.ph)*.6;u.ar.rotation.x=-1.1-Math.sin(u.ph)*.6;u.ll.rotation.x=u.lr.rotation.x=0;return;}
 if(c.build&&a.st==='in'){const sb=byId(c.build);if(sb&&onSite.get(c.id)!==sb.id){crewRoute(a,c,sb);return;}}
 if(a.st==='out'){const p=a.m.position,vx=a.gp.x-p.x,vz=a.gp.z-p.z,d=Math.hypot(vx,vz),sp=2.4*dt;if(d<=sp){a.st='in';a.wait=1.5+Math.random()*2.5;limbs(u,0);}else{p.x+=vx/d*sp;p.z+=vz/d*sp;a.m.rotation.y=Math.atan2(vx,vz);u.ph+=dt*9;limbs(u,1);p.y=hgt(p.x,p.z)+.02;}return;}
 if(a.st==='in'){a.m.visible=!!a.gp;a.wait-=dt;if(a.wait>0)return;const at=a.at&&byId(a.at);const home=c.home&&byId(c.home);if(!at){a.at=c.home;a.wait=3;return;}
  let dest=at.id!==c.home?home:(c.work&&c.work!==c.home&&Math.random()<.8?byId(c.work):leisure());if(!dest||dest===at||(dest.cons>0)){a.wait=4+Math.random()*4;return;}
  const p=at.door&&dest.door?astar(at.door,dest.door,walk):null;const ca=bc(at),cd=bc(dest);if(!p&&Math.hypot(ca.x-cd.x,ca.z-cd.z)>30){a.wait=6;return;}
  a.path=p||[];a.pi=0;a.dest=dest.id;a.st='walk';let e=p?edgePos(at,at.door):edgeTo(at,cd);if(a.gp){if(!p)e=a.gp;delete a.gp;}a.m.position.set(e.x,hgt(e.x,e.z),e.z);a.m.visible=true;a.endp=p?edgePos(dest,dest.door):edgeTo(dest,ca);return;}
 const last=a.pi>=a.path.length;let tx,tz;if(last){tx=a.endp.x;tz=a.endp.z;}else{const n=a.path[a.pi];if(!a.fp&&!walk(n.x,n.z)){a.path=[];a.pi=0;return;}
  const prv=a.pi>0?a.path[a.pi-1]:n,nx=a.path[a.pi+1]||n;let dx=nx.x-prv.x,dz=nx.z-prv.z;const l=Math.hypot(dx,dz)||1;tx=n.x+.5-dz/l*a.off;tz=n.z+.5+dx/l*a.off;}
 const p=a.m.position,vx=tx-p.x,vz=tz-p.z,d=Math.hypot(vx,vz),sp=3*dt;
 if(d<=sp){p.x=tx;p.z=tz;if(last&&a.bld){a.bld=0;a.fp=0;a.st='bld';onSite.set(c.id,a.dest);const sb=byId(a.dest);if(sb)sb._arr=(sb._arr||0)+1;}else if(last){a.st='in';a.at=a.dest;a.fp=0;a.wait=a.at===c.home?5+Math.random()*8:7+Math.random()*10;}else a.pi++;}
 else{p.x+=vx/d*sp;p.z+=vz/d*sp;a.m.rotation.y=Math.atan2(vx,vz);}u.ph+=dt*9;limbs(u,1);p.y=hgt(p.x,p.z)+.08+Math.abs(Math.sin(u.ph))*.08;});}
// ---------- Cybertrucks
let trucks=[];
// Cybertruck from the owner's-manual numbers: L 5683, W 2032, H 1796, wheelbase 3635, overhangs 878 / 1170 mm, 35" tyres.
// k = units per metre, matched to the people (1.8 m astronaut ≈ .31 units).
const CT_K=.172,CTM={body:new THREE.MeshStandardMaterial({color:0xc4c7cb,metalness:.92,roughness:.34,envMap:SENV,envMapIntensity:1.3,flatShading:true}),
 glass:new THREE.MeshStandardMaterial({color:0x0c0e12,metalness:.6,roughness:.12,envMap:SENV,envMapIntensity:.8,side:THREE.DoubleSide}),clad:new THREE.MeshStandardMaterial({color:0x26282b,roughness:.8,metalness:.1,side:THREE.DoubleSide}),
 tonneau:new THREE.MeshStandardMaterial({color:0x3a3d42,roughness:.55,metalness:.4,envMap:SENV,envMapIntensity:.5}),tyre:new THREE.MeshStandardMaterial({color:0x151515,roughness:.9}),
 hub:new THREE.MeshStandardMaterial({color:0x8a8e94,metalness:.8,roughness:.4,envMap:SENV}),front:new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:2.2}),
 rear:new THREE.MeshStandardMaterial({color:0xff2222,emissive:0xff1a1a,emissiveIntensity:1.8})};
let CTG=null;
function ctGeoms(){if(CTG)return CTG;const k=CT_K,L=5.683,W=2.032,cx=L/2;const P=(x,y)=>new THREE.Vector2((x-cx)*k,y*k);
 // side profile (front = +x): bumper, low nose, one straight hood/windscreen line to the roof apex, one straight sail line down to the tailgate
 const sh=new THREE.Shape([P(0,.5),P(0,1.2),P(2.95,1.796),P(5.683,1.0),P(5.683,.62),P(5.35,.5),P(5.30,.5),P(4.805+.6,.5),P(4.805+.47,.95),P(4.805-.47,.95),P(4.805-.6,.5),P(1.17+.6,.5),P(1.17+.47,.95),P(1.17-.47,.95),P(1.17-.6,.5)]);
 const body=new THREE.ExtrudeGeometry(sh,{depth:W*k,bevelEnabled:false});body.translate(0,0,-W*k/2);body.rotateY(-Math.PI/2);body.computeVertexNormals();
 const arch=x=>{const a=new THREE.Shape([P(x-.66,.42),P(x-.5,1.02),P(x+.5,1.02),P(x+.66,.42),P(x+.54,.42),P(x+.42,.9),P(x-.42,.9),P(x-.54,.42)]);return new THREE.ShapeGeometry(a);};
 const win=new THREE.ShapeGeometry(new THREE.Shape([P(4.02,1.47),P(2.98,1.765),P(1.78,1.6),P(1.86,1.36),P(3.85,1.36)]));
 const slope=(x0,y0,x1,y1,w,t)=>{const g=new THREE.BoxGeometry(Math.hypot(x1-x0,y1-y0)*k,t*k,w*k);g.rotateZ(Math.atan2(y1-y0,x1-x0));g.translate(((x0+x1)/2-cx)*k,(y0+y1)/2*k,0);g.rotateY(-Math.PI/2);return g;};
 const shield=slope(4.02,1.47,3.0,1.77,W-.22,.03),ton=slope(1.85,1.585,.08,1.215,W-.16,.03);
 const lbF=new THREE.BoxGeometry(W*.92*k,.05*k,.03*k);lbF.translate(0,.99*k,(L/2-.005)*k);const lbT=new THREE.BoxGeometry(W*.9*k,.03*k,.06*k);lbT.translate(0,1.0*k,(L/2-.06)*k);
 const lbR=new THREE.BoxGeometry(W*.92*k,.05*k,.03*k);lbR.translate(0,1.16*k,(-L/2+.005)*k);
 const tyre=new THREE.CylinderGeometry(.445*k,.445*k,.3*k,16);tyre.rotateZ(Math.PI/2);const hub=new THREE.CylinderGeometry(.27*k,.27*k,.31*k,6);hub.rotateZ(Math.PI/2);
 CTG={body,arch,win,shield,ton,lbF,lbT,lbR,tyre,hub,k,L,W,cx};return CTG;}
function truckModel(){const G=ctGeoms(),k=G.k,g=new THREE.Group();const add=(geo,mat,sh)=>{const m=new THREE.Mesh(geo,mat);if(sh)m.castShadow=true;g.add(m);return m;};
 add(G.body,CTM.body,1);add(G.shield,CTM.glass);add(G.ton,CTM.tonneau);add(G.lbF,CTM.front);add(G.lbT,CTM.front);add(G.lbR,CTM.rear);
 for(const sd of[-1,1]){const w=add(G.win,CTM.glass);w.rotation.y=-Math.PI/2;w.position.x=sd*(G.W/2+.004)*k;if(sd<0)w.scale.z=-1;
  for(const ax of[1.17,4.805]){const a=add(G.arch(ax),CTM.clad);a.rotation.y=-Math.PI/2;a.position.x=sd*(G.W/2+.006)*k;
   const z=(ax-G.cx)*k;const t=add(G.tyre,CTM.tyre,1);t.position.set(sd*(G.W/2-.17)*k,.445*k,z);const h=add(G.hub,CTM.hub);h.position.set(sd*(G.W/2-.16)*k,.445*k,z);}}
 const cr=mesh(rbox(.22,.07,.2,.012),M(0x9a6a3a,.8),0,1.38*k,-1.6*k,false);cr.name='crate';cr.visible=false;g.add(cr);return g;}
// Cybertrucks drive freely over the terrain (no roads), steering around buildings.
const TRUCKSRC=['proc','pad','ship'];
function nearestB(list,p){let best=null,bd=1e9;list.forEach(b=>{const c=bc(b),d=Math.hypot(c.x-p.x,c.z-p.z);if(d<bd){bd=d;best=b;}});return best;}
function syncTrucks(){while(trucks.length)W.remove(trucks.pop().m);return;const procs=S.b.filter(b=>b.t==='proc').length,pads=S.b.filter(b=>b.t==='pad').length,ships=S.b.some(b=>b.t==='ship');
 const want=Math.min(8,((ships||pads)&&S.truckIn!==0?1:0)+procs*2+pads);while(trucks.length>want)W.remove(trucks.pop().m);
 while(trucks.length<want){const home=S.b.find(b=>b.t==='proc')||S.b.find(b=>b.t==='pad')||S.b.find(b=>b.t==='ship');if(!home)break;const c=bc(home);const m=truckModel();
  const a=Math.random()*6.28,r=B[home.t].s*.5+.7;m.position.set(c.x+Math.cos(a)*r,0,c.z+Math.sin(a)*r);m.rotation.y=a;W.add(m);trucks.push({m,st:'idle',wait:Math.random()*2,load:0});}}
function clearAt(x,z,t){if(x<0||z<0||x>=N||z>=N)return false;const o=occ[x|0]?.[z|0];return!o||o===t.src||o===t.dst||isDeco(o.t);}
function drive(t,b,dt){const p=t.m.position,c=bc(b),dx=c.x-p.x,dz=c.z-p.z,d=Math.hypot(dx,dz);if(d<B[b.t].s*.5+.55)return true;
 const want=Math.atan2(dx,dz),side=t.side||1;let head=null;
 for(const o of[0,.45,-.45,.9,-.9,1.35,-1.35,1.9,-1.9,2.6,-2.6]){const a=want+o*side;if(clearAt(p.x+Math.sin(a)*.75,p.z+Math.cos(a)*.75,t)&&clearAt(p.x+Math.sin(a)*.4,p.z+Math.cos(a)*.4,t)){head=a;if(o!==0)t.side=Math.sign(o*side)||1;break;}}
 if(head===null){head=t.m.rotation.y+Math.PI*.5;}
 // separation + yielding: never drive through other trucks, robots or people
 let sx=0,sz=0,block=0;const fx=Math.sin(t.m.rotation.y),fz=Math.cos(t.m.rotation.y),me=trucks.indexOf(t);
 const look=(q,r0,isT,j)=>{const ox=q.x-p.x,oz=q.z-p.z,od=Math.hypot(ox,oz);if(od<1e-4)return;if(od<r0){sx-=ox/od*(r0-od);sz-=oz/od*(r0-od);}
  const ahead=(ox*fx+oz*fz),lat=Math.abs(ox*fz-oz*fx);if(ahead>0&&ahead<(isT?1.15:.75)&&lat<(isT?.42:.3)){if(!isT||j<me||(t.yT||0)<2.5)block=Math.max(block,isT&&j>me?.5:1);}};
 trucks.forEach((o,j)=>{if(o!==t)look(o.m.position,.62,1,j);});agents.forEach(a=>{if(a.m.visible)look(a.m.position,.32,0);});bots.forEach(b=>look(b.m.position,.32,0));
 if(block>=1){t.yT=(t.yT||0)+dt;if(t.yT>2.5){head+=.9*(t.side||1);}}else t.yT=0;
 let da=head-t.m.rotation.y;da=Math.atan2(Math.sin(da),Math.cos(da));t.m.rotation.y+=da*Math.min(1,dt*6);
 const v0=(Math.abs(da)>1.2?.8:1.8)*(block>=1&&t.yT<=2.5?0:block?.45:1);const sp=Math.min(d,v0*dt);const nx=p.x+Math.sin(t.m.rotation.y)*sp+sx*dt*3,nz=p.z+Math.cos(t.m.rotation.y)*sp+sz*dt*3;
 if(clearAt(nx,nz,t)||!clearAt(p.x,p.z,t)){p.x=nx;p.z=nz;}p.y=hgt(p.x,p.z);
 t.stuck=(t.stuck||0)+dt;if(t.stuck>40){const e=edgeTo(b,{x:p.x,z:p.z});p.x=e.x;p.z=e.z;}return false;}
function deliverOre(pr,n){const cap=120*LV[pr.lvl-1];pr.stock=(pr.stock||0)+n;if(pr.stock>cap){S.ore+=pr.stock-cap;pr.stock=cap;}
 if(Math.random()<.12){const r=1+(Math.random()*3|0);S.rare+=r;toast(`💎 Rare ore found in a robot’s crate: +${r}`);}}
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
let sunK=1,SUNANG=1.5,DAYK=1;const CONS_T=4;
function dayPhase(t){return((t/DAY)+.02)%1;}
function dayK(t){const p=dayPhase(t),D=TUNE.DAY_SPLIT,f=.07;if(p>=D)return 0;return Math.max(0,Math.min(1,p/f,(D-p)/f));}
function eff(b){return eff0(b)*bioMul(b);}
function eff0(b){if(b.cons>0)return 0;const j=jobs(b);if(!j)return 1;return b.door?.35+.65*Math.min(1,(b.wk||0)/j):.3;}
let decoBonus=0;
function stats(dt=0){let pw=0,pu=0,house=0,food=0,wat=0,fuel=0,waste=0,med=0,ent=0,sec=0,wcap=120,bcap=0;
 S.b.forEach(b=>{const d=B[b.t],m=LV[b.lvl-1],e=eff(b),on=!(b.cons>0);if(b.t==='ship'&&objs.get(b.id)?.userData.land)return;if(!on)return;if(d.pw>0)pw+=(b.wave?3:d.pw)*m*e*(b.t==='solar'?sunK*stormMul()*(T('solar2')?1.3:1):1);else if(d.pw){if(SELFP[b.t])pu+=habSelf(b,dt);else pu-=d.pw*m;}});pu+=(S.bots||[]).length*.4;S.b.forEach(b=>{const d=B[b.t],m=LV[b.lvl-1],e=eff(b),on=!(b.cons>0);if(on){house+=cap(b);if(d.wcap)wcap+=d.wcap*m;if(d.bat)bcap+=d.bat*m*(T('bat2')?1.6:1);}});
 const raw=pw;let batUse=0;if(pw<pu&&S.bat>0){batUse=Math.min(pu-pw,dt?S.bat/dt:pu-pw);pw+=batUse;}
 if(dt){if(batUse)S.bat=Math.max(0,S.bat-batUse*dt);else S.bat=Math.min(bcap,S.bat+Math.max(0,pw-pu)*dt*.6);}S.bat=Math.max(0,Math.min(S.bat,bcap));
 const pe=pu?Math.min(1,pw/pu):1;
 S.b.forEach(b=>{const d=B[b.t],m=LV[b.lvl-1],e=eff(b)*pe;food+=d.food>0?d.food*m*e*(T('farm2')?1.25:1):(d.food||0)*m*(b.cons>0?0:1);wat+=d.wat>0?d.wat*m*e:(d.wat||0)*m*(b.cons>0?0:1);fuel+=(d.fuel||0)*m*e*(S.wat>1?1:0);
  waste+=(d.waste||0)*m*e;med+=(d.med||0)*m*e;ent+=(d.ent||0)*m*e;sec+=(d.sec||0)*m*e;});
 const pop=S.cols.length,dem=DIFF[S.diff||'standard'].dem*(S.tut?.5:1);food-=pop*.12*dem;wat-=pop*.1*dem;
 const clean=pop<15?1:Math.min(1,waste/pop),health=pop<20?1:Math.min(1,med/pop),fun=pop?Math.min(1,ent/pop):0,safe=pop<60?1:Math.min(1,sec/pop);
 return{pw:Math.round(pw*10)/10,pu:Math.round(pu*10)/10,raw,pe,house,food,wat,fuel,clean,health,fun,safe,pop,wcap,bcap,batUse};}
function calcDeco(){let n=0;S.b.forEach(b=>{if(!isDeco(b.t))return;for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)if(walk(b.x+i,b.z+j)){n++;return;}});decoBonus=Math.min(10,n*25/(S.cols.length+10));}
// ---------- costs
const costTxt=(c,m,p)=>`${c?'¢'+c:''}${m?' 🧱'+m:''}${p?' ⚙️'+p:''}`||'free';
function afford(c,m,quiet){if(S.cr<c||S.mat<m){if(!quiet){toast(S.cr<c?`Not enough credits (need ¢${c})`:`Not enough materials (need 🧱${m}) — build a Mine + Processor or order a shipment`,1);beep(160,.15,'sawtooth',.04);}return false;}return true;}
function pay(c,m){S.cr-=c;S.mat-=m;}
// v21 builder crews: every build/upgrade needs colonists on site for real time; Optimus robots speed it up (−20% each, max 3), never replace the 1st colonist
const SMALLB={solar:15,battery:25,wtank:20};
function buildSpec(t,lvl=1){const d=B[t],s=d.s0||1;let T,n;if(d.cat==='d'){T=6;n=1;}else if(t==='hab'){T=S&&S.b.filter(b=>b.t==='hab').length<=1&&lvl===1?30:40;n=1;}else if(SMALLB[t]){T=SMALLB[t];n=1;}
 else if(s===1){T=t==='kilo'?110:80;n=2;}else if(s===2){T=150;n=3;}else if(s===3){T=220;n=4;}else{T=290;n=4;}if(lvl>1)T=Math.round(T*(.4+.2*lvl));return{T,n};}
const fmtT=v=>{v=Math.max(0,Math.ceil(v));return Math.floor(v/60)+':'+String(v%60).padStart(2,'0');};
const isSite=b=>b.cons>0||b.upT>0;const onSite=new Map();
function crewPool(){const ad=S.cols.filter(c=>!c.kid);return{ad,pool:ad.length?Math.max(1,Math.ceil(ad.length*.5)):0};}
function crewSync(){if(!S||S.demo)return;const ids=new Map(S.b.map(b=>[b.id,b]));const{ad,pool}=crewPool();let ch=false;
 S.cols.forEach(c=>{if(c.build){const b=ids.get(c.build);if(c.kid||!b||!isSite(b)){c.build=null;onSite.delete(c.id);ch=true;}}});
 let busy=ad.filter(c=>c.build).length;const sites=S.b.filter(isSite);
 for(const b of sites){let need=(b.crewN||1)-ad.filter(c=>c.build===b.id).length;while(need>0&&busy<pool){const c=ad.find(c=>!c.build&&!c.work)||ad.find(c=>!c.build);if(!c)break;c.build=b.id;c.work=null;c.bT=S.t+8;onSite.delete(c.id);busy++;need--;ch=true;}}
 if(ch)assign();
 sites.forEach(b=>{const cr=ad.filter(c=>c.build===b.id);b._crew=cr.length;b._arr=cr.filter(c=>onSite.get(c.id)===b.id||(!agents.has(c.id)&&(c.bT??0)<=S.t)).length;siteBar(b);});
 S.crewFree=pool-busy;S.crewPool=pool;}
function buildRate(b){const a=b._arr||0;if(!a)return 0;const k=Math.min(3,botsAt(b.id,'build'));return Math.min(1,a/(b.crewN||1))/(1-.2*k);}
function siteBar(b){const o=objs.get(b.id);if(!o)return;let sp=o.getObjectByName('cbar');if(!sp){const c=document.createElement('canvas');c.width=256;c.height=72;const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;
  sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,depthTest:false,transparent:true}));sp.name='cbar';sp.renderOrder=10;sp.userData.c=c;o.add(sp);}
 const s0=B[b.t].s0;sp.position.set(s0/2,1.25+s0*.32,s0/2);const sc=o.scale.y||1;const bk=2.6/(B[b.t].s/s0)*(B[b.t].cat==="d"?.6:1);sp.scale.set(1.5*bk*.7,.42*bk*.7/sc,1);
 const x=sp.userData.c.getContext('2d'),up=b.upT>0,tot=up?b.upN:b.consN||CONS_T,left=up?b.upT:b.cons,p=Math.max(0,Math.min(1,1-left/tot)),r=buildRate(b),wait=!b._crew;
 x.clearRect(0,0,256,72);x.fillStyle='rgba(20,8,3,.86)';x.beginPath();x.roundRect(2,2,252,68,12);x.fill();x.strokeStyle=wait?'#ffcc33':'#ff8a12';x.lineWidth=3;x.stroke();
 x.fillStyle='#3a1a0a';x.fillRect(12,42,232,16);x.fillStyle=wait?'#8a6a2a':'#ffb020';x.fillRect(12,42,232*p,16);x.strokeStyle='#e8eef4';x.lineWidth=1.5;x.strokeRect(12,42,232,16);
 x.font='bold 22px system-ui,sans-serif';x.textBaseline='middle';x.fillStyle='#fff';
 if(wait){x.fillText(up?'⏳ Upgrade: waiting for crew':'⏳ Waiting for crew',14,22);}else{let cx=20;for(let i=0;i<(b.crewN||1);i++){x.globalAlpha=i<b._crew?(i<b._arr?1:.55):.2;drawHV(x,cx,20,1.15);cx+=22;}x.globalAlpha=1;const k=Math.min(3,botsAt(b.id,'build'));for(let i=0;i<k;i++){drawBot(x,cx+4,20,1.1);cx+=20;}
  x.textAlign='right';x.fillText(r>0?fmtT(left/r):(b._arr?'…':'walking'),244,22);x.textAlign='left';}
 sp.material.map.needsUpdate=true;}
function dropBar(o){const sp=o&&o.getObjectByName('cbar');if(sp){o.remove(sp);sp.material.map.dispose();sp.material.dispose();}}
function addScaf(o,b){if(!o||o.getObjectByName('scaf'))return;const d=B[b.t],S0=d.s0;const sc=new THREE.Mesh(new THREE.BoxGeometry(S0*.98,.9,S0*.98),new THREE.MeshBasicMaterial({color:0xffa040,wireframe:true,transparent:true,opacity:.55}));sc.position.set(S0/2,.45,S0/2);sc.name='scaf';o.add(sc);}
function finishCons(b){b.cons=0;b.delivered=b.claimed=0;const o=objs.get(b.id);dropBar(o);if(o){const sc=o.getObjectByName('scaf');if(sc)o.remove(sc);o.userData.grow=o.scale.y;}setTimeout(crewSync,0);assign();refreshDoors();if(!S.demo)beep(660,.06,'triangle',.05);}
function floatText(txt){const d=document.createElement('div');d.className='ft';d.textContent=txt;document.body.appendChild(d);setTimeout(()=>d.remove(),2200);}
function shipInterval(b){return TUNE.SHIP_EVERY_SOL*DAY*(.8+Math.random()*.4)/(1+TUNE.PAD_LVL_BONUS*((b?b.lvl:1)-1));}
// ---------- UI
const $=id=>document.getElementById(id);let sel=null,speed=1,tab='b';
function toast(m,w){if(S&&S.demo)return;const d=document.createElement('div');d.className='t'+(w?' w':'');d.textContent=m;$('toasts').prepend(d);setTimeout(()=>d.remove(),4000);while($('toasts').children.length>5)$('toasts').lastChild.remove();}
function tip(k,el){const d=B[k],t=$('tip'),f=(v,u)=>v?`<div>${v>0?'+':''}${v} ${u}</div>`:'';
 t.innerHTML=`<b>${d.ic} ${d.n}</b> — ${d.c||d.m?costTxt(d.c,d.m):'free'}${d.ore?`<div>⛏️ +${d.ore} ore/s</div>`:''}${d.conv?`<div>🧱 makes ${d.conv} materials/s from ore</div>`:''}${d.wcap?`<div>💧 +${d.wcap} water storage</div>`:''}${d.bat?`<div>🔋 stores ${d.bat} power</div>`:''}${f(d.pw,'⚡ power')}${f(d.food,'🍞 food/s')}${f(d.wat,'💧 water/s')}${f(d.fuel,'⛽ fuel/s')}${d.house?`<div>🏠 houses ${d.house}</div>`:''}${d.jobs?`<div>👷 ${d.jobs} jobs</div>`:''}${d.waste?`<div>♻️ cleans for ${d.waste}</div>`:''}${d.med?`<div>🩺 care for ${d.med}</div>`:''}${d.ent?`<div>🎭 fun for ${d.ent}</div>`:''}${d.sec?`<div>🛡️ safety for ${d.sec}</div>`:''}
 <div style="opacity:.8">${d.d}${d.cat==='b'?` · ${d.s}×${d.s}`:''}${d.up?' · upgradable to L5':''}${lvOf(k)>1?` · unlocks at Lv ${lvOf(k)}`:''}</div><div style="opacity:.6;font-size:11px">${d.cat==='b'?'Needs a path next to it · hold a building to move it':d.cat==='d'?'Next to paths: boosts happiness':d.cat==='p'?'Drag across the ground to paint':''}</div>`;
 const r=el.getBoundingClientRect();t.style.display='block';t.style.left=Math.max(4,Math.min(innerWidth-224,r.left))+'px';t.style.bottom=(innerHeight-r.top+6)+'px';}
let menuOpen=false;
function setMenu(on){menuOpen=!!on;setTimeout(()=>typeof dockSync==='function'&&dockSync(),0);const m=$('menu');if(!m)return;m.classList.toggle('closed',!menuOpen);document.body.classList.toggle('menuopen',menuOpen);const bb=$('buildb');if(bb)bb.classList.toggle('on',menuOpen);if(!menuOpen){sel=null;$('tip').style.display='none';if(typeof updPrev==='function')updPrev();}menu();gridLines.visible=!!sel;}
function menu(){const host=$('mtools')||$('menu');if(!host)return;host.innerHTML='';if(!menuOpen&&host.id==='mtools'){gridLines.visible=false;return;}const pop=S?S.cols.length:0;
 dozeSync();host.classList.toggle('list',!!tab);if(!tab){[['b','🏗️','Buildings'],['p','🚶','Paths'],['d','🌷','Decorations']].forEach(([k,i,l])=>{const e=document.createElement('div');e.className='cat';e.dataset.cat=k;e.innerHTML=`<span>${i}</span>${l}`;e.onclick=()=>{tab=k;beep(650,.03);menu();};host.appendChild(e);});gridLines.visible=false;return;}
 {const e=document.createElement('div');e.className='back';e.textContent='←';e.title='Categories';e.onclick=()=>{tab=null;if(sel&&sel!=='dozer')sel=null;beep(600,.03);menu();updPrev();};host.appendChild(e);const h=document.createElement('div');h.className='tab on';h.textContent={b:'🏗️ Buildings',p:'🚶 Paths',d:'🌷 Decor'}[tab];host.appendChild(h);}
 Object.entries(B).filter(([k,d])=>d.cat===tab).forEach(([k,d])=>{const e=document.createElement('div');const lock=lvLocked(k);
  const hl=tutWants(k);e.className='b'+(sel===k?' sel':'')+(lock?' lock':'')+(hl?' hl':'');e.dataset.k=k;e.innerHTML=`<span class="ic">${d.ic}</span><span class="nm">${d.n}</span><small>${lock?'🔒 Lv '+lvOf(k):(d.c||d.m?(o=>costTxt(o.c,o.m,o.p))(bcost(d)):'free')}</small>`;
  e.onpointerenter=()=>tip(k,e);e.onpointerleave=()=>$('tip').style.display='none';
  e.onclick=()=>{beep(700,.04);tip(k,e);if(lock){toast(`🔒 Unlocks at colony Lv ${lvOf(k)} · ${LEVELS[lvOf(k)].n}`);return;}sel=sel===k?null:k;closePanel();menu();updPrev();};host.appendChild(e);});
 gridLines.visible=!!sel;}
let lastLock='';
function clock(){const p=dayPhase(S.t),D=TUNE.DAY_SPLIT;let h=p<D?6+p/D*14:20+(p-D)/(1-D)*10;h%=24;const hh=Math.floor(h),mm=Math.floor((h-hh)*6)*10;return`${p<D?'☀️':'🌙'} ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;}
function terraPct(){const pop=S.cols.length,bots=(S.bots||[]).length,late=S.b.filter(b=>['reactor','mega','ent','bigfarm','refin'].includes(b.t)&&!(b.cons>0)).length;return Math.min(100,Math.round(pop*1.1+bots*.8+late*4+(S.tf||0)));}
function hud(st){if(S.demo)return;const f=v=>(v>=0?'+':'')+v.toFixed(1);const pop=st.pop,hl=S.cols.filter(c=>!c.home).length,un=S.cols.filter(c=>!c.work).length;const tf=terraPct();
 const nar=innerWidth<560,k=v=>v>=10000?(v/1000).toFixed(0)+'k':v>=1000?(v/1000).toFixed(1)+'k':Math.floor(v);
 const items=nar?[['💰',k(S.cr)],['👩‍🚀',`${pop}/${st.house}`],['⚡',`${Math.round(st.pw)}/${Math.round(st.pu)}`,st.pw<st.pu],['🍞',k(S.food),S.food<5&&st.food<0],
 ['💧',k(S.wat),S.wat<5&&st.wat<0],['🧱',k(S.mat),S.mat<20],['⛽',k(S.fuel)],['😊',Math.round(S.hap)+'%',S.hap<40]]:[['🏴',S.name],['💰',Math.floor(S.cr)],['👩‍🚀',`${pop}/${st.house}`],['⚡',`${st.pw}/${st.pu}`,st.pw<st.pu],['🍞',`${Math.floor(S.food)} (${f(st.food)})`,S.food<5&&st.food<0],
 ['💧',`${Math.floor(S.wat)}/${st.wcap} (${f(st.wat)})`,S.wat<5&&st.wat<0],['🧱',Math.floor(S.mat),S.mat<20],['⛽',Math.floor(S.fuel)],['😊',Math.round(S.hap)+'%',S.hap<40]];
 items.unshift(lvChip());if(S.rp>0||cntB('lab'))items.push(['🔬',Math.floor(S.rp)]);if(S.parts>0||cntB('factory'))items.push(['⚙️',Math.floor(S.parts)]);if(S.storm)items.push(['🌪️','storm',true]);items.push([hvImg(),`${Math.max(0,S.crewFree??0)}/${S.crewPool??0}`,S.crewFree===0&&S.b.some(b=>isSite(b)&&!b._crew)]);if((S.bots||[]).length)items.push([hvImg('bot'),S.bots.length]);items.push(['🌍',`<span class="tf">${tf}%<span class="bar"><i style="width:${tf}%"></i></span></span>`]);
 if(st.bcap)items.splice(4,0,['🔋',Math.round(S.bat/st.bcap*100)+'%'+(st.batUse?' ⬇':''),S.bat<1&&st.batUse===0&&st.raw<st.pu]);if(S.ore>=1||S.b.some(b=>b.t==='mine'))items.push(['⛏️',Math.floor(S.ore)]);if(S.rare>0)items.push(['💎',Math.floor(S.rare)]);
 if(S.flights.length)items.push(['🛸',S.flights.length+' en route']);
 if(pop>=10&&(!nar||st.clean<.7))items.push(['♻️',Math.round(st.clean*100)+'%',st.clean<.7]);if(pop>=20&&(!nar||st.health<.7))items.push(['🩺',Math.round(st.health*100)+'%',st.health<.7]);
 if(pop>=25&&!nar)items.push(['🎭',Math.round(st.fun*100)+'%']);if(pop>=55&&(!nar||st.safe<.7))items.push(['🛡️',Math.round(st.safe*100)+'%',st.safe<.7]);
 if(hl)items.push(['🏚️',nar?hl:hl+' homeless',1]);if(un>2&&!nar)items.push(['💼',un+' jobless']);items.push(['📅',nar?`S${Math.floor(S.t/DAY+1)} ${clock()}`:`Sol ${Math.floor(S.t/DAY+1)} ${clock()}`]);
 $('hud').innerHTML=items.map(([i,v,b])=>`<span class="r${b?' bad':''}${i==='🏴'?' nm':''}${i==='⭐'?' lv':''}">${i} ${v}</span>`).join('');
 const l=''+(S.lvl||1);if(l!==lastLock){lastLock=l;menu();}renderLv();}
// ---------- info panels
let panel=null,panelHover=false;$('panel').onpointerenter=()=>panelHover=true;$('panel').onpointerleave=()=>panelHover=false;const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.62,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffd166,transparent:true,opacity:.9,depthTest:false}));ring.renderOrder=8;ring.visible=false;W.add(ring);
function closePanel(){document.body.classList.remove('pan');panel=null;panelHover=false;$('panel').style.display='none';ring.visible=false;follow=null;}
function openB(b){document.body.classList.add('pan');panel={b};const p=$('panel');p.style.display='block';
 p.innerHTML=`<div class="ph"><span>${B[b.t].ic}</span><input id="bname" maxlength="28"><button id="pclose">✕</button></div><div id="pbody"></div><div class="pbtn">${B[b.t].up?'<button id="pup"></button>':''}${(b.t!=='pad'||!b.ship)&&b.t!=='ship'?'<button id="prot">🔄 Rotate</button><button id="pdoz">🚜 Bulldoze</button>':''}</div><div class="hint">${bioTxt(b.x+B[b.t].s/2,b.z+B[b.t].s/2,b.t)} — ${BIO[bioOf(b)].d}</div><div class="hint">✋ Press &amp; hold the building to move it</div>`;
 $('bname').value=b.name;$('bname').oninput=e=>{b.name=e.target.value.slice(0,28)||defName(b.t);};$('bname').onkeydown=e=>e.stopPropagation();$('pclose').onclick=()=>{closePanel();beep(500,.03);};
 if($('pup'))$('pup').onclick=()=>upgrade(b);if($('prot'))$('prot').onclick=()=>rotateAct();$('pbody').onclick=e=>{const el=e.target.closest('button,input[data-x]');if(!el)return;if(el.dataset.a)cargoAct(b,el);else if(el.dataset.x)settleAct(b,el);};if($('pdoz'))$('pdoz').onclick=()=>{bulldoze(b);closePanel();};
 const s=B[b.t].s;ring.geometry.dispose();ring.geometry=new THREE.RingGeometry(s*.62,s*.62+.07,40).rotateX(-Math.PI/2);ring.position.set(b.x+s/2,by(b)+.06,b.z+s/2);ring.visible=true;renderPanel(true);}
let panelTouchT=0;$("panel").addEventListener("pointerdown",()=>panelTouchT=performance.now(),true);
function renderPanel(force){if(!panel)return;if((panelHover||performance.now()-panelTouchT<1500)&&!force)return;if(panel.mkt){const ar=k=>S.mkt[k]>S.mktPrev[k]+.005?'<span style="color:#7f7">▲</span>':S.mkt[k]<S.mktPrev[k]-.005?'<span style="color:#f77">▼</span>':'▬';const oc=Math.round(TUNE.ORDER_QTY*TUNE.ORDER_PRICE*S.mkt.mat);
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
 if(isSite(b)){const up=b.upT>0,left=up?b.upT:b.cons,r=buildRate(b);L.push(`<div>🏗️ ${up?`Upgrading to L${b.lvl+1}`:'Under construction'} — ${b._crew?`${hvImg()}×${b._arr||0}/${b.crewN||1} on site${r>0?` · ${fmtT(left/r)} left`:''}`:'⏳ waiting for a free crew'}${botsAt(b.id,'build')?` · ${hvImg('bot')}×${botsAt(b.id,'build')} helping (−${20*Math.min(3,botsAt(b.id,'build'))}%)`:''}</div>`);}
 if(b.t==='mine')L.push(`<div>⛏️ Ore waiting: ${Math.floor(b.stock||0)}/${60*m} ${S.b.some(q=>q.t==='proc')?'— Optimus robots carry it to the processor':'— build a 🏗️ Material Processor'}</div>`);
 if(b.t==='proc')L.push(`<div>⛏️ Ore in hopper: ${Math.floor(b.stock||0)} → 🧱 ${(d.conv*m*e).toFixed(2)}/s</div>`);
 if(b.t==='pad')L.push(`<div>${b.ship?(b.ship.ph==='ground'?`🚀 Ship waiting — leaves in ${Math.ceil(b.ship.stay)}s`:'🚀 Ship in flight'):S.tut?'Ships start after the tutorial':`Next supply ship in ~${Math.max(0,Math.ceil(b.timer))}s`}</div>`);
 L.push(settleHTML(b));const h=holdOf(b);if(h)L.push(cargoHTML(h));
 $('pbody').innerHTML=L.join('');$('pbody').querySelectorAll('.cn').forEach(el=>el.onclick=()=>{const a=agents.get(+el.dataset.c);openC(S.cols.find(c=>c.id===+el.dataset.c));});
 const u=$('pup');if(u){if(b.upT>0){u.textContent='🏗️ Upgrading…';u.disabled=true;}else if(b.lvl>=5){u.textContent='⭐ Max level';u.disabled=true;}else if(upLock(b)){u.innerHTML=`🔒 L${b.lvl+1} unlocks at colony Lv ${upLock(b)}<small style="display:block;opacity:.8">You are Lv ${S.lvl||1} — follow the ⭐ checklist</small>`;u.disabled=true;}else{const c=upCost(b),mm=upMat(b);u.innerHTML=`⬆️ Upgrade to L${b.lvl+1} — ${costTxt(c,mm)}<small style="display:block;opacity:.85">${upBoosts(b)}</small>`;u.disabled=S.cr<c||S.mat<mm||b.cons>0;}}}
 else if(panel.c){const c=panel.c;if(!S.cols.includes(c)){closePanel();return;}const h=c.home&&byId(c.home),w=c.work&&byId(c.work),st=lastSt||stats(),a=agents.get(c.id);
  $('pbody').innerHTML=`<div class="sub">Colonist #${c.id}</div><div>🏠 ${h?h.name+(h.door?'':' ⚠️ no path'):'<b style="color:#f66">Homeless</b>'}</div><div>💼 ${w?w.name:'<i>Unemployed</i>'}</div>
   <div>😊 Happiness ${colHap(c)}%</div><div class="stats">🍞 Food ${S.food>0?'✅':'❌'} · 💧 Water ${S.wat>0?'✅':'❌'} · ⚡ Power ${st.pw>=st.pu?'✅':'❌'}<br>♻️ Clean ${Math.round(st.clean*100)}% · 🩺 Health ${Math.round(st.health*100)}%</div>
   <div>${a?(a.st==='walk'?`🚶 Walking to ${byId(a.dest)?.name||'…'}`:`📍 Inside ${byId(a.at)?.name||'…'}`):'(not shown on map)'}</div>`;}}
const GOOD={mat:'🧱 Materials',ore:'⛏️ Ore',rare:'💎 Rare ore'},STOCK={mat:'mat',ore:'ore',rare:'rare'};
const price=k=>PRICE[k]*S.mkt[k];const cargoValue=h=>Math.round(h.mat*price('mat')+h.ore*price('ore')+h.rare*price('rare'));
function holdOf(b){if(b.t==='ship')return b.hold||(b.hold={fuel:0,mat:0,ore:0,rare:0});if((b.t==='pad'||b.t==='lpad')&&b.ship&&b.ship.ph==='ground')return b.ship.hold;return null;}
function cargoHTML(h){const v=cargoValue(h),tot=h.mat+h.ore+h.rare;const lv=S.demo?99:(S.lvl||1);if(lv<9)return`<div class="cargo"><b>🚀 Return flight to Earth</b><div class="sub">🔒 Refuelling & cargo loading unlock at Lv 9 · return flights at Lv 10</div></div>`;
 return`<div class="cargo"><b>🚀 Return flight to Earth</b><div>⛽ Fuel ${Math.floor(h.fuel)}/${TUNE.RETURN_FUEL} <button data-a="fuel" ${S.fuel>=1&&h.fuel<TUNE.RETURN_FUEL?'':'disabled'}>Refuel (${Math.floor(S.fuel)} in stock)</button></div>
 <div class="sub">Cargo hold ${tot}/${TUNE.HOLD_MAX} — sells on Earth at market price</div>
 ${Object.keys(GOOD).map(k=>`<div class="crow"><span>${GOOD[k]} <b>${h[k]}</b></span><span class="pr">¢${price(k).toFixed(1)}</span><button data-a="u" data-k="${k}" ${h[k]?'':'disabled'}>−10</button><button data-a="l" data-k="${k}" data-n="10" ${S[STOCK[k]]>=1&&tot<TUNE.HOLD_MAX?'':'disabled'}>+10</button><button data-a="l" data-k="${k}" data-n="50" ${S[STOCK[k]]>=1&&tot<TUNE.HOLD_MAX?'':'disabled'}>+50</button></div>`).join('')}
 <div>Payout on arrival: <b>¢${v+TUNE.RETURN_PAY}</b> <span class="sub">(flight ¢${TUNE.RETURN_PAY} + cargo ¢${v})</span></div>
 <button data-a="launch" class="go" ${h.fuel>=TUNE.RETURN_FUEL&&lv>=10?'':'disabled'}>${lv<10?'🔒 Return flights unlock at Lv 10':h.fuel>=TUNE.RETURN_FUEL?'🚀 Launch return flight':`Needs ${TUNE.RETURN_FUEL} ⛽ to launch`}</button></div>`;}
function cargoAct(b,el){const h=holdOf(b);if(!h)return;const lv=S.demo?99:(S.lvl||1);if(lv<9||(el.dataset.a==='launch'&&lv<10)){toast('🔒 Not unlocked yet — see the ⭐ checklist');return;}const a=el.dataset.a,k=el.dataset.k,tot=h.mat+h.ore+h.rare;
 if(a==='fuel'){const n=Math.min(Math.floor(S.fuel),TUNE.RETURN_FUEL-h.fuel);S.fuel-=n;h.fuel+=n;beep(500,.05,'triangle');}
 else if(a==='l'){const n=Math.min(+el.dataset.n,Math.floor(S[STOCK[k]]),TUNE.HOLD_MAX-tot);if(n>0){S[STOCK[k]]-=n;h[k]+=n;beep(600,.04);}}
 else if(a==='u'){const n=Math.min(10,h[k]);S[STOCK[k]]+=n;h[k]-=n;beep(400,.04);}
 else if(a==='launch')launchReturn(b);renderPanel(true);}
let flyers=[];
function launchReturn(b){const h=holdOf(b);if(!h||h.fuel<TUNE.RETURN_FUEL)return;const pay=TUNE.RETURN_PAY+cargoValue(h),name=b.t==='ship'?b.name:'Supply ship from '+b.name;
 S.flights.push({t:S.t+TUNE.FLIGHT_TIME,pay,name});S.launches=(S.launches||0)+1;toast(`🚀 ${name} launched for Earth! Payout ¢${pay} on arrival (~${TUNE.FLIGHT_TIME}s)`);floatText(`🚀 ¢${pay} on the way`);
 if(b.t==='ship'){const o=objs.get(b.id),rk=o.getObjectByName('rk');const m=rocket();m.rotation.order='YXZ';m.rotation.y=rk.rotation.y;const F=new THREE.Group();F.scale.setScalar(4);F.position.set(bc(b).x,0,bc(b).z);m.position.set(0,0,0);pose(m,0,0);F.add(m);W.add(F);flyers.push({m,F,t:0,cx:bc(b).x,cz:bc(b).z});
  closePanel();delB(b);syncTrucks();}else{b.ship.ph='up';b.ship.t=0;b.ship.launched=1;closePanel();}
 rumble(4,.25);}
function tickFlyers(dt){flyers=flyers.filter(f=>{f.t+=dt;if(!f.d){f.d=1;dustRing(f.cx,f.cz,30);setFrost(f.m,1);f.m.userData.fireK=1.6;}if(f.t<1.2&&Math.random()<.3)dust(f.cx,f.cz,0,2);pose(f.m,Math.pow(f.t,2)*1.6,0);const fl=f.m.getObjectByName('flame'),f2=f.m.getObjectByName('flame2');setFire(f.m,true);fl.scale.y=1.5+Math.random();
 if(f.t>5){W.remove(f.F||f.m);return false;}return true;});}
function openM(){document.body.classList.add('pan');panel={mkt:1};const p=$('panel');p.style.display='block';ring.visible=false;p.innerHTML=`<div class="ph"><span>🌍</span><b style="flex:1">Earth Market</b><button id="pclose">✕</button></div><div id="pbody"></div>`;
 $('pclose').onclick=closePanel;$('pbody').onclick=e=>{const el=e.target.closest('button');if(!el)return;if(el.dataset.a==='order'){const c=Math.round(TUNE.ORDER_QTY*TUNE.ORDER_PRICE*S.mkt.mat);if(S.cr<c){toast('Not enough credits',1);return;}S.cr-=c;S.order+=TUNE.ORDER_QTY;toast(`📦 Ordered ${TUNE.ORDER_QTY} 🧱 — arrives with the next supply ship`);beep(700,.06);renderPanel(true);}};renderPanel(true);}
function openC(c){document.body.classList.add('pan');if(!c)return;panel={c};const p=$('panel');p.style.display='block';ring.visible=false;
 p.innerHTML=`<div class="ph"><span>👩‍🚀</span><b style="flex:1">${c.n}</b><button id="pclose">✕</button></div><div id="pbody"></div><div class="pbtn"><button id="pfol">🎥 Follow</button></div>`;
 $('pclose').onclick=closePanel;$('pfol').onclick=()=>{const a=agents.get(c.id);if(a){follow=a;zoom=Math.min(zoom,5);camUp();$('pfol').textContent='🎥 Following…';}};renderPanel();}
const upCost=b=>Math.round(B[b.t].c*(.8+.6*b.lvl));const upMat=b=>Math.round(B[b.t].m*(.6+.5*b.lvl));const upLock=b=>{if(S.demo||b.lvl+1<=TIERMAX[S.lvl||1])return 0;let l=S.lvl||1;while(l<LVMAX&&TIERMAX[l]<b.lvl+1)l++;return l;};
function upBoosts(b){const d=B[b.t],m0=LV[b.lvl-1],m1=LV[Math.min(4,b.lvl)];const bits=[];
 if(d.house)bits.push(`🏠 ${Math.round(d.house*m0)}→${Math.round(d.house*m1)}`);
 if(d.food>0)bits.push(`🍞 ${+(d.food*m0).toFixed(1)}→${+(d.food*m1).toFixed(1)}/s`);
 if(d.wat>0)bits.push(`💧 ${+(d.wat*m0).toFixed(1)}→${+(d.wat*m1).toFixed(1)}/s`);
 if(d.pw>0)bits.push(`⚡ ${+(d.pw*m0).toFixed(1)}→${+(d.pw*m1).toFixed(1)}`);
 if(d.fuel)bits.push(`⛽ ${+(d.fuel*m0).toFixed(1)}→${+(d.fuel*m1).toFixed(1)}/s`);
 if(d.ore)bits.push(`⛏️ ${+(d.ore*m0).toFixed(1)}→${+(d.ore*m1).toFixed(1)}/s`);
 if(d.conv)bits.push(`🧱 ${+(d.conv*m0).toFixed(1)}→${+(d.conv*m1).toFixed(1)}/s`);
 if(d.wcap)bits.push(`💧cap ${Math.round(d.wcap*m0)}→${Math.round(d.wcap*m1)}`);
 if(d.bat)bits.push(`🔋 ${Math.round(d.bat*m0)}→${Math.round(d.bat*m1)}`);
 if(d.bots)bits.push(`🤖 ${Math.round(d.bots*m0)}→${Math.round(d.bots*m1)}`);
 return bits.join(' · ')||'+15% output';}
function upgrade(b){if(b.lvl>=5)return;if(upLock(b)){toast(`🔒 L${b.lvl+1} unlocks at colony Lv ${upLock(b)}`,1);return;}if(b.cons>0||b.upT>0){toast('Still under construction',1);return;}const c=upCost(b),mm=upMat(b);if(!afford(c,mm))return;pay(c,mm);const sp=buildSpec(b.t,b.lvl+1);b.upT=b.upN=sp.T;b.crewN=sp.n;addScaf(objs.get(b.id),b);crewSync();toast(`🏗️ Upgrading ${b.name} to L${b.lvl+1} — needs ${sp.n} builder${sp.n>1?'s':''}, ~${fmtT(sp.T)}`);beep(520,.08,'triangle',.07);renderPanel(true);}
function finishUp(b){b.upT=0;const prev=b.lvl;b.lvl++;const o=placeObj(b);o.scale.set(1,.25,1);o.userData.grow=.25;
 const ring=new THREE.Mesh(new THREE.TorusGeometry(B[b.t].s0*.55,.04,8,32).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:0xffd166,transparent:true,opacity:.9}));ring.position.set(B[b.t].s0/2,.2,B[b.t].s0/2);o.add(ring);setTimeout(()=>{try{o.remove(ring);}catch(e){}},900);
 const w=o.getObjectByName('warn');if(w)w.visible=!b.door;assign();if(typeof syncBots==='function')syncBots();floatText(`⬆️ L${b.lvl}`);toast(`⬆️ ${b.name} → Level ${b.lvl}! ${upBoosts({t:b.t,lvl:prev})}`);beep(520,.08,'triangle',.07);setTimeout(()=>beep(780,.1,'triangle',.07),90);renderPanel(true);setTimeout(crewSync,0);}
function bulldoze(b){if(b.t==='ship'){toast('Refuel and launch Starships home instead of bulldozing them',1);return false;}if(b.ship){toast("Can't bulldoze a pad with a ship on it",1);return false;}
 S.cr+=Math.floor(B[b.t].c*(1+(b.lvl-1)*.6)/2);S.mat+=Math.floor(B[b.t].m*(1+(b.lvl-1)*.5)/2);delB(b);beep(200,.12,'sawtooth',.05);return true;}
// ---------- input
const ray=new THREE.Raycaster(),mv=new THREE.Vector2();
// v20 building details: dust drifts against walls, vent fans, beacons on tall structures, processor gears
const DRM=new THREE.MeshStandardMaterial({color:0xc08560,roughness:1,envMapIntensity:.2}),driftG={};
function driftGeo(L){if(driftG[L])return driftG[L];const sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(0,.05);sh.quadraticCurveTo(.05,.045,.2,0);sh.lineTo(0,0);
 const g=new THREE.ExtrudeGeometry(sh,{depth:L,bevelEnabled:true,bevelThickness:.04,bevelSize:.012,bevelSegments:2,curveSegments:5});return driftG[L]=g;}
const beaconMat=new THREE.MeshBasicMaterial({color:0xff2a1a,toneMapped:false}),bcG=new THREE.SphereGeometry(.03,8,6),fanG=new THREE.BoxGeometry(.16,.008,.03),gearG=new THREE.TorusGeometry(.07,.022,4,10);
function details(o,b){const t=b.t;if(t==='ship'||isDeco(t))return;const s=B[t].s0,L=b.lvl||1;
 if(t!=='pad'&&t!=='lpad'){const l=s*.8;const a=mesh(driftGeo(l),DRM,s,0,(s-l)/2,false);a.receiveShadow=true;o.add(a);const c=mesh(driftGeo(l*.7),DRM,(s+l*.7)/2,0,s,false);c.rotation.y=-Math.PI/2;c.receiveShadow=true;o.add(c);}
 if(t==='proc'){for(let i=0;i<2;i++){const g=mesh(gearG,MAT.dark,1.415,.22+i*.05,.72+i*.15,false);g.rotation.y=Math.PI/2;g.name='gear';g.userData.dir=i?-1.4:1;o.add(g);}}
 if(L>=2&&!['solar','farm','bigfarm','pad','lpad','wtank','battery'].includes(t)){const n=L>=4?2:1;for(let k=0;k<n;k++){const x=s-.14-k*.24,z=.14;const hs=mesh(rbox(.18,.12,.18,.02),MAT.steel,x,.06,z);o.add(hs);
  const f=new THREE.Group();f.position.set(x,.125,z);f.name='fan';for(let j=0;j<3;j++){const bl=new THREE.Mesh(fanG,MAT.dark);bl.rotation.y=j*2.094;f.add(bl);}o.add(f);}}
 o.updateMatrixWorld(true);const bb=new THREE.Box3();let top=null,ty=0;o.traverse(m=>{if(!m.isMesh||m.name==='fan')return;bb.setFromObject(m);if(bb.max.y>ty){ty=bb.max.y;top=bb.getCenter(new THREE.Vector3());}});
 const H=ty-o.position.y;if(top&&H>.95){const bc=new THREE.Mesh(bcG,beaconMat);bc.position.set(top.x-o.position.x,H+.03,top.z-o.position.z);bc.name='bcn';o.add(bc);}}
let placeRot=0,ghost=null,ghostK='';const ghostMat=new THREE.MeshStandardMaterial({color:0xa8ffc0,transparent:true,opacity:.45,depthWrite:false,emissive:0x1a5a2a,emissiveIntensity:.5});
function ghostSync(x,z,ok){const d=sel&&B[sel];if(!d||!(d.cat==='b'||d.cat==='d')||x==null){if(ghost)ghost.visible=false;return;}const k=sel+placeRot;
 if(ghostK!==k){if(ghost)W.remove(ghost);const o=model(sel,1);o.traverse(m=>{if(m.isMesh){m.material=ghostMat;m.castShadow=false;}if(m.isSprite)m.visible=false;});const P=new THREE.Group();P.add(o);o.position.set(-d.s0/2,0,-d.s0/2);P.scale.setScalar(d.s/d.s0);P.rotation.y=-placeRot*Math.PI/2;ghost=P;ghostK=k;W.add(P);}
 ghost.visible=true;ghost.position.set(x+d.s/2,0,z+d.s/2);ghostMat.color.set(ok?0xa8ffc0:0xff8a8a);ghostMat.emissive.set(ok?0x1a5a2a:0x5a1a1a);}
function rotateAct(){if(panel&&panel.b&&!S.demo){const b=panel.b;if(b.t==='ship'||(b.t==='pad'&&b.ship)){toast("Ships can't be rotated",1);return;}b.r=((b.r||0)+1)%4;const o=placeObj(b);if(isSite(b)){addScaf(o,b);if(b.cons>0){delete o.userData.grow;o.scale.y=.25+.75*Math.max(0,1-b.cons/(b.consN||CONS_T));}}refreshDoors();beep(700,.04);return;}
 if(sel&&B[sel]&&(B[sel].cat==='b'||B[sel].cat==='d')){placeRot=(placeRot+1)%4;beep(700,.04);updPrev();return;}toast('🔄 Pick something to build, or tap a building, then rotate it',0);}
let hover=null;const prev=new THREE.Mesh(new THREE.BoxGeometry(1,.12,1),new THREE.MeshBasicMaterial({color:0x00ff00,transparent:true,opacity:.42,depthWrite:false}));W.add(prev);prev.visible=false;
function cell(cx,cy){mv.set(cx/innerWidth*2-1,-cy/innerHeight*2+1);ray.setFromCamera(mv,cam);const o=ray.ray.origin,d=ray.ray.direction;let y=0,p;
 for(let i=0;i<4;i++){const t=(y-o.y)/d.y;p=o.clone().addScaledVector(d,t);y=hgtW(p.x,p.z);}p.multiplyScalar(1/CS);return{x:Math.floor(p.x),z:Math.floor(p.z),p};}
function updPrev(){if(moving)return;if(!sel||!hover){prev.visible=false;ghostSync(null);$('info').textContent=sel?'':'Tap a building or colonist for info · pick a tool below';return;}
 const d=B[sel];let x=hover.x,z=hover.z;if(d.s>1){x=Math.round(hover.p.x-d.s/2);z=Math.round(hover.p.z-d.s/2);}hover.bx=x;hover.bz=z;
 prev.visible=true;prev.scale.set(d.s,1,d.s);prev.position.set(x+d.s/2,hgt(x+d.s/2,z+d.s/2)+.05,z+d.s/2);let ok;
 if(sel==='dozer'){const b=occ[x]?.[z];ok=!!b||walk(x,z);if(b){prev.scale.set(B[b.t].s,1,B[b.t].s);prev.position.set(b.x+B[b.t].s/2,by(b)+.05,b.z+B[b.t].s/2);}$('info').textContent=b?`Bulldoze ${b.name}`:walk(x,z)?'Drag to remove paths':'';}
 else if(d.cat==='p'){ok=x>=0&&z>=0&&x<N&&z<N&&!occ[x][z]&&!blocked[x][z];$('info').textContent=`${d.n} — free! Drag to paint (two fingers / WASD to pan)`;}
 else{const cq=bcost(d),af=S.cr>=cq.c&&S.mat>=cq.m&&(S.parts||0)>=cq.p;ok=free(sel,x,z)&&af&&(!d.site||!!siteNear(x+d.s/2,z+d.s/2,d.site));const adj=ok&&near2({t:sel,x,z}).some(([a,c])=>walk(a,c));$('info').textContent=`${d.n} ${costTxt(d.c,d.m)}${S.cr<d.c?' — not enough credits':S.mat<d.m?' — not enough materials 🧱':!free(sel,x,z)?' — blocked':d.cat==='b'&&!adj?' — ⚠️ no path within 2 tiles yet':' — ✅ connected'}`;}
 if(d.cat==='b'&&x>=0&&z>=0&&x<N&&z<N)$('info').textContent+=' · '+bioTxt(x+d.s/2,z+d.s/2,sel);ghostSync(x,z,ok);
 prev.material.color.set(ok?0x33ff55:0xff3333);}
function paint(x,z){if(x<0||z<0||x>=N||z>=N)return;const k=TK(x,z);
 if(sel==='dozer'){if(S.tiles[k]){delete S.tiles[k];changed();}return;}
 if(S.tiles[k]||occ[x][z]||blocked[x][z])return;S.tiles[k]=1;changed();const n=performance.now();if(n-(paint.bt||0)>70){paint.bt=n;beep(300+Math.random()*80,.025,'triangle',.03);}}
let doorsDirty=false;function changed(){doorsDirty=true;}
function click(){if(!sel||!hover)return;updPrev();const d=B[sel],x=hover.bx,z=hover.bz;if(lvLocked(sel)){toast(`🔒 ${d.n} unlocks at colony Lv ${lvOf(sel)} · ${LEVELS[lvOf(sel)].n}`);return;}
 if(sel==='dozer'){const b=occ[x]?.[z];if(b)bulldoze(b);}
 else if(d.cat==='b'||d.cat==='d'){if(!S.demo&&!explored(x+d.s/2,z+d.s/2)){toast('🌫️ Unexplored ground — send a rover to scout it before building',1);return;}if(!free(sel,x,z)){IGB=true;const okNB=free(sel,x,z);IGB=false;if(okNB&&!painting){let n=0,busy=0;for(let i=0;i<d.s;i++)for(let j=0;j<d.s;j++)if(boulderAt(x+i,z+j)){const bi=BOUL.get(TK0(x+i,z+j));if(miners.some(m=>m.i===bi))busy++;else n+=mineBoulder(bi);}if(n)toast(`🤖 Optimus dispatched to break up ${n} boulder${n>1?'s':''} — build here once it's clear (+🧱)`);else if(busy)toast('🤖 Robots are already clearing this spot');return;}if(!painting){toast("Can't build there — pick a clear spot (green outline)",1);beep(160,.12,'sawtooth',.04);}return;}const st_=d.site?siteNear(x+d.s/2,z+d.s/2,d.site):null;if(d.site&&!st_){toast(`${d.ic} ${d.n} must sit on a surveyed ${d.site.map(k=>SITEK[k].n.toLowerCase()).join(' / ')} — send a rover to find one`,1);beep(160,.12,'sawtooth',.04);return;}const cc_=bcost(d);if(cc_.p&&(S.parts||0)<cc_.p){toast(`Needs ⚙️ ${cc_.p} parts — build a Parts Factory or Call Earth`,1);return;}if(!afford(cc_.c,cc_.m))return;pay(cc_.c,cc_.m);S.parts=(S.parts||0)-cc_.p;const b=addB(sel,x,z,0,{r:placeRot});if(st_){b.rich=st_.rich;b.siteId=st_.id;st_.used=1;if(st_.k==='rare')b.rareK=st_.rich;syncSites();}else if(sel==='mine'){const r_=siteNear(x+.5,z+.5,['rare'],3.2);if(r_)b.rareK=r_.rich;}
  {const sp=buildSpec(sel,1);b.cons=b.consN=sp.T;b.crewN=sp.n;b.consT=0;const o=objs.get(b.id);delete o.userData.grow;o.scale.y=.25;addScaf(o,b);crewSync();}
  assign();beep(520,.07,'triangle',.07);if(d.cat==='b'&&!b.door)toast('⚠️ No path within 2 tiles — paths are free, drag one nearby');}updPrev();}
function pick(cx,cy){let best=null,bd=22;const v=new THREE.Vector3();agents.forEach(a=>{if(!a.m.visible)return;a.m.getWorldPosition(v);v.y+=.05;v.project(cam);const sx=(v.x+1)/2*innerWidth,sy=(1-v.y)/2*innerHeight,d=Math.hypot(sx-cx,sy-cy);if(d<bd){bd=d;best=a;}});
 if(best){openC(best.c);beep(800,.04);return;}const c=cell(cx,cy);const b=c&&occ[c.x]?.[c.z];if(b){if(menuOpen&&!sel)setMenu(false);openB(b);beep(700,.04);}else{closePanel();if(menuOpen&&!sel)setMenu(false);}}
const ptrs=new Map();let drag=null,moved=0,pinch0=0,mid0=null,lp=null,moving=null,painting=false,lastPaint=null,follow=null;
function moveCell(c){const s=B[moving.b.t].s;return s>1?{x:Math.round(c.p.x-s/2),z:Math.round(c.p.z-s/2)}:{x:c.x,z:c.z};}
function startMove(b){if(b.t==='pad'&&b.ship){toast("Can't move a pad while a ship is on it",1);return;}closePanel();moving={b,ok:true,x:b.x,z:b.z};navigator.vibrate&&navigator.vibrate(30);beep(880,.08,'sine',.06);
 const o=objs.get(b.id);o.parent.position.y=by(b)+.35;prev.visible=true;$('info').textContent=`Moving ${b.name} — drop on a green spot`;}
function dragMove(c){if(!c)return;const{x,z}=moveCell(c),b=moving.b,s=B[b.t].s;moving.x=x;moving.z=z;moving.ok=free(b.t,x,z,b);const o=objs.get(b.id);o.parent.position.set(x+s/2,hgt(x+s/2,z+s/2)+.35,z+s/2);
 prev.visible=true;prev.scale.set(s,1,s);prev.position.set(x+s/2,hgt(x+s/2,z+s/2)+.05,z+s/2);prev.material.color.set(moving.ok?0x33ff55:0xff3333);}
function endMove(){const b=moving.b,o=objs.get(b.id);if(moving.ok&&!(b.t==='pad'&&b.ship)){b.x=moving.x;b.z=moving.z;beep(440,.08,'sine',.06);}else{beep(160,.15,'sawtooth',.04);toast('Invalid spot — returned',1);}
 pivotPos(b,o.parent);rebuildOcc();moving=null;doorModel(b);prev.visible=false;$('info').textContent='';refreshDoors();agents.forEach(a=>{if(a.dest===b.id||a.at===b.id){if(a.st==='walk'){a.st='in';a.at=a.dest;a.wait=1;}}});}
function line(a,b,f){if(!a||!b||![a.x,a.z,b.x,b.z].every(Number.isFinite))return;let x=a.x,z=a.z,guard=0;f(x,z);while((x!==b.x||z!==b.z)&&guard++<N*4){if(Math.abs(b.x-x)>=Math.abs(b.z-z))x+=Math.sign(b.x-x);else z+=Math.sign(b.z-z);f(x,z);}}
const paintTool=()=>sel==='path'||sel==='road'||sel==='dozer';
let stroke=null,gest=false,lastStroke=null;
const strokeMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.96,.07,.96),new THREE.MeshBasicMaterial({color:0x33ff88,transparent:true,opacity:.55,depthWrite:false}),600);strokeMesh.count=0;strokeMesh.frustumCulled=false;W.add(strokeMesh);
const _m4=new THREE.Matrix4();
function strokeAdd(x,z){if(stroke&&stroke.tool==='road'&&!stroke._r){stroke._r=1;for(let i=0;i<2;i++)for(let j=0;j<2;j++)strokeAdd(x+i,z+j);stroke._r=0;return;}if(x<0||z<0||x>=N||z>=N)return;const k=TK(x,z);if(stroke.set.has(k))return;const dz=stroke.tool==='dozer';if(dz?!S.tiles[k]:(S.tiles[k]||occ[x][z]||blocked[x][z]))return;
 stroke.set.add(k);stroke.cells.push([x,z]);if(strokeMesh.count<600){_m4.makeTranslation(x+.5,hgt(x+.5,z+.5)+.06,z+.5);strokeMesh.setMatrixAt(strokeMesh.count++,_m4);strokeMesh.instanceMatrix.needsUpdate=true;}
 const n=performance.now();if(n-(paint.bt||0)>70){paint.bt=n;beep(dz?220:300+Math.random()*80,.02,'triangle',.025);}}
function strokeClear(){strokeMesh.count=0;stroke=null;}
function strokeCancel(){if(stroke){strokeClear();}painting=false;}
function strokeCommit(){const st=stroke;strokeClear();painting=false;if(!st||!st.cells.length)return;const done=[];
 st.cells.forEach(([x,z])=>{const k=TK(x,z);if(st.tool==='dozer'){if(S.tiles[k]){delete S.tiles[k];done.push(k);}}else if(!S.tiles[k]&&!occ[x][z]&&!blocked[x][z]){S.tiles[k]=st.tool==='road'?2:1;done.push(k);}});
 if(done.length){changed();lastStroke={tool:st.tool,keys:done};undoSync();beep(st.tool==='dozer'?260:520,.06,'triangle',.05);}}
function undoStroke(){const l=lastStroke;if(!l)return;l.keys.forEach(k=>{if(l.tool==='dozer'){const[x,z]=k.split(',').map(Number);if(!occ[x]?.[z])S.tiles[k]=1;}else delete S.tiles[k];});changed();lastStroke=null;undoSync();beep(400,.06,'triangle',.05);toast(`↶ Undid last ${l.tool==='dozer'?'bulldoze':'path'} stroke (${l.keys.length} tiles)`);}
function undoSync(){const u=$('undob');if(u)u.style.display=lastStroke?'':'none';}
function dozeSync(){const d=$('dozeb');if(d)d.classList.toggle('active',sel==='dozer');document.body.classList.toggle('dozing',sel==='dozer');}
R.domElement.addEventListener('pointerdown',e=>{ac();ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});if(e.button===2){sel=null;menu();updPrev();dozeSync();return;}
 clearTimeout(lp);
 if(ptrs.size>=2){gest=true;strokeCancel();const[a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);mid0={x:(a.x+b.x)/2,y:(a.y+b.y)/2};moved=99;return;}
 drag={x:e.clientX,y:e.clientY};moved=0;gest=false;
 if(!S||S.demo)return;const c=cell(e.clientX,e.clientY);
 if(paintTool()){painting=true;stroke={tool:sel,t0:performance.now(),x0:e.clientX,y0:e.clientY,live:false,set:new Set(),cells:[],start:{x:c.x,z:c.z},onB:sel==='dozer'&&!!occ[c.x]?.[c.z]};lastPaint={x:c.x,z:c.z};return;}
 const b=c&&occ[c.x]?.[c.z];if(b&&!sel)lp=setTimeout(()=>{if(moved<=8&&ptrs.size===1&&!gest)startMove(b);},450);});
addEventListener('pointermove',e=>{if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(moving){dragMove(cell(e.clientX,e.clientY));return;}
 if(ptrs.size>=2){clearTimeout(lp);const[a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};if(pinch0){zoom=Math.max(3,Math.min(48,zoom*pinch0/d));pinch0=d;pan(mid0.x-mid.x,mid0.y-mid.y);mid0=mid;camUp();}moved=99;return;}
 if(gest)return;
 hover=cell(e.clientX,e.clientY);
 if(painting&&stroke&&ptrs.size===1){const px=Math.hypot(e.clientX-stroke.x0,e.clientY-stroke.y0);moved=Math.max(moved,px);
  if(!stroke.live&&(px>6||performance.now()-stroke.t0>120)){stroke.live=true;strokeAdd(stroke.start.x,stroke.start.z);}
  if(stroke.live&&(hover.x!==lastPaint.x||hover.z!==lastPaint.z)){line(lastPaint,{x:hover.x,z:hover.z},strokeAdd);lastPaint={x:hover.x,z:hover.z};}updPrev();return;}
 if(drag&&ptrs.size===1){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);if(moved>8){clearTimeout(lp);pan(-dx,-dy);}drag={x:e.clientX,y:e.clientY};}
 updPrev();});
addEventListener('pointerup',e=>{const had=ptrs.has(e.pointerId);ptrs.delete(e.pointerId);clearTimeout(lp);if(moving){endMove();drag=null;return;}
 if(gest){if(ptrs.size===0){gest=false;drag=null;pinch0=0;}return;}
 if(!had)return;
 if(painting&&stroke){const st=stroke;if(!st.live&&moved<6&&e.target===R.domElement){if(st.onB){strokeClear();painting=false;hover=cell(e.clientX,e.clientY);click();drag=null;return;}strokeAdd(st.start.x,st.start.z);}strokeCommit();drag=null;return;}
 if(drag&&moved<=8&&e.target===R.domElement&&S&&!S.demo){hover=cell(e.clientX,e.clientY);if(sel)click();else if(!tapBoulder(hover))pick(e.clientX,e.clientY);}if(ptrs.size===0)drag=null;pinch0=0;});
addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);clearTimeout(lp);if(moving)endMove();strokeCancel();if(ptrs.size===0){gest=false;}drag=null;});
R.domElement.addEventListener('contextmenu',e=>e.preventDefault());
R.domElement.addEventListener('wheel',e=>{zoom=Math.max(3,Math.min(48,zoom*(e.deltaY>0?1.1:.9)));camUp();e.preventDefault();},{passive:false});
function pan(dx,dy){follow=null;const k=zoom*2/innerHeight/CS,ang=Math.PI/4+rot;const rx=Math.cos(ang),rz=-Math.sin(ang),fx=-Math.sin(ang),fz=-Math.cos(ang);
 tgt.x+=(dx*rx-dy*fx*1.4)*k;tgt.z+=(dx*rz-dy*fz*1.4)*k;tgt.x=Math.max(0,Math.min(N,tgt.x));tgt.z=Math.max(0,Math.min(N,tgt.z));camUp();}
const keys={};addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;keys[e.key.toLowerCase()]=1;if(e.key==='Escape'){sel=null;closePanel();if(menuOpen)setMenu(false);else menu();updPrev();dozeSync();}if(S&&S.demo)return;if(e.key==='r')rotateAct();if(e.key==='q')rotT-=Math.PI/2;if(e.key==='e')rotT+=Math.PI/2;});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);
$('rotb').onclick=()=>rotateAct();$('rotL').onclick=()=>rotT-=Math.PI/2;$('rotR').onclick=()=>rotT+=Math.PI/2;
document.querySelectorAll('#ctl [data-s]').forEach(b=>b.onclick=()=>{speed=speed?0:1;b.classList.toggle('on',!speed);b.textContent=speed?'⏸':'▶';});
// ---------- v14 save system: autosave, rotating backups, never clobber, export/import
const SK='marsOutpost22',SV=22,SLOTS=['marsOutpost22.old','marsOutpost22.bak0','marsOutpost22.bak1','marsOutpost22.bak2'];
try{if(!localStorage.getItem('marsV22wipe')){['marsOutpost','marsOutpost.old','marsOutpost.bak0','marsOutpost.bak1','marsOutpost.bak2'].forEach(k=>localStorage.removeItem(k));localStorage.setItem('marsV22wipe','1');}}catch(e){}
let saveBlocked=false,lastSaved=0,lastBak=0,saveErrT=0;
const SAVE_KEYS=['cr','mat','ore','rare','bat','food','wat','fuel','hap','t','diff','name','tiles','warned','cols','mkt','mktPrev','order','flights','tut','lastSol','launches','crewPending','botsLanded','ship2','ship2T','lastLandT','lvl','lvBase','made','supplyN','flightsDone','tradeEarned','arrivals','nextArr','waveLanded','waveQueued','eraDone','lvOpen',
 'bots','rovers','rovId','sites','fog','tech','rp','parts','partsMade','scouts','surveys','techN','births','oreDug','roverWater','storms','storm','nextStorm','nightPow','outRuns','lastMeteor','town','tutBonus','safeT','tf'];
function saveData(){const d={v:SV,N,saved:Date.now()};SAVE_KEYS.forEach(k=>{if(S[k]!==undefined)d[k]=S[k];});
 d.b=S.b.map(({id,t,x,z,r,lvl,name,timer,hold,stock,wave,cons,consN,crewN,upT,upN,frostT,spec,hb,auto,call,cool,rich,siteId,rareK})=>({id,t,x,z,r,lvl,name,timer,hold,stock,wave,cons,consN,crewN,upT,upN,frostT,spec,hb,auto,call,cool,rich,siteId,rareK}));d.pop=S.cols.length;return d;}
function rotateBak(js){try{for(let i=2;i>0;i--){const v=localStorage.getItem('marsOutpost.bak'+(i-1));if(v)localStorage.setItem('marsOutpost.bak'+i,v);}localStorage.setItem('marsOutpost.bak0',js);}catch(e){console.warn('backup rotate failed',e);}}
function save(){if(!S||S.demo||saveBlocked||intro)return false;try{const js=JSON.stringify(saveData());const prev=localStorage.getItem(SK);
  if(prev&&Date.now()-lastBak>180000){rotateBak(prev);lastBak=Date.now();}localStorage.setItem(SK,js);lastSaved=Date.now();saveUI();return true;}
 catch(e){console.warn('save failed',e);if(Date.now()-saveErrT>60000){saveErrT=Date.now();toast(`⚠️ Save failed (${e.name==='QuotaExceededError'?'browser storage full':e.message}) — open 💾 and Export a backup code`,1);}return false;}}
function saveUI(){const b=$('save');if(!b)return;const s=lastSaved?Math.round((Date.now()-lastSaved)/1000):-1;b.innerHTML=`💾<small class="sv">${saveBlocked?'off':s<0?'—':s<60?s+'s':Math.round(s/60)+'m'}</small>`;b.title=lastSaved?`Last saved ${new Date(lastSaved).toLocaleTimeString()}`:'Not saved yet';}
setInterval(()=>{if(S&&!S.demo&&$('ui').style.display!=='none')save();saveUI();},20000);setInterval(saveUI,5000);
addEventListener('pagehide',()=>save());document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});addEventListener('beforeunload',()=>save());
function askPersist(){try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist().then(ok=>{S&&(S.persisted=ok);});}catch(e){}}
function slotInfo(k){try{const v=localStorage.getItem(k);if(!v)return null;const d=JSON.parse(v);return{k,name:d.name||'Colony',sol:Math.floor((d.t||0)/DAY+1),pop:d.cols?d.cols.length:d.pop||0,lvl:d.lvl||'?',saved:d.saved,size:v.length};}catch(e){return{k,bad:1};}}
const encSave=js=>'MARS1:'+btoa(unescape(encodeURIComponent(js)));
function decSave(code){code=(code||'').trim();let js=code;if(code.startsWith('MARS1:'))js=decodeURIComponent(escape(atob(code.slice(6).replace(/\s+/g,''))));const d=JSON.parse(js);if(!d||!Array.isArray(d.b)||typeof d.t!=='number')throw new Error('not a MARS save');return JSON.stringify(d);}
function importJS(js,from){const cur=localStorage.getItem(SK);if(cur)rotateBak(cur);localStorage.setItem(SK,js);toast(`📥 Save ${from||'imported'} — loading…`,1);closeSaveBox();start(true);}
function openSaveBox(inGame){let o=$('savebox');if(!o){o=document.createElement('div');o.id='savebox';document.body.appendChild(o);}
 const cur=slotInfo(SK),slots=SLOTS.map(slotInfo).filter(Boolean),ago=t=>t?new Date(t).toLocaleString():'unknown time';
 o.innerHTML=`<div class="card"><div class="h">💾 SAVES</div>${inGame?`<div>Last saved: <b>${lastSaved?Math.round((Date.now()-lastSaved)/1000)+'s ago':'not yet'}</b> · autosaves every 20 s and when you leave the page${cur?` · ${Math.round(cur.size/1024)} KB`:''}</div><button data-s="now">💾 Save now</button>`:''}
 ${cur&&!cur.bad?`<div class="sub">Current: <b>${cur.name}</b> · Sol ${cur.sol} · ${cur.pop} colonists · Lv ${cur.lvl}</div><div class="row2"><button data-s="ren">✏️ Rename colony</button><button data-s="del" class="dangerl">🗑️ Delete colony</button></div>`:''}
 <div class="row2"><button data-s="copy" ${cur?'':'disabled'}>📋 Copy save code</button><button data-s="file" ${cur?'':'disabled'}>⬇️ Download file</button></div>
 <textarea id="svcode" placeholder="Paste a save code here to import"></textarea><div class="row2"><button data-s="paste">📋 Paste &amp; import</button><button data-s="imp">📥 Import code</button><label class="fbtn">📂 Import file<input type="file" id="svfile" accept=".json,.txt,.mars"></label></div>
 ${slots.length?`<div class="h2">Backups (kept automatically)</div>${slots.map(s=>s.bad?`<div class="sub">${s.k}: unreadable</div>`:`<div class="slot"><span><b>${s.name}</b> · Sol ${s.sol} · ${s.pop} col · Lv ${s.lvl}<br><span class="sub">${s.k.endsWith('.old')?'Previous colony (before New colony)':'Autosave backup'} · ${ago(s.saved)}</span></span><span class="sb"><button data-s="res" data-k="${s.k}">Restore</button><button data-s="sdel" data-k="${s.k}" title="Delete backup">🗑️</button></span></div>`).join('')}`:''}
 ${(()=>{const P=window.__pwa||{};return P.STAND?`<div class="move">📲 <b>Coming from Safari?</b> In Safari open 💾 Saves → <b>Copy save code</b>, then come back here and tap <b>📋 Paste &amp; import</b>.</div>`:`<div class="move">📲 <b>Moving to the home screen app?</b> The app has its own storage. Tap <b>📋 Copy save code</b> here in Safari, then open the MARS app → 💾 Saves → <b>📋 Paste &amp; import</b>.</div>`;})()}<div class="sub">Tip: iPhone Safari can wipe website data after 7 days without a visit, and Private tabs lose it on close — Export a code now and then (or add MARS to your Home Screen).</div>
 <button data-s="close" class="cl">Close</button></div>`;o.style.display='flex';
 o.onclick=e=>{const b=e.target.closest('button');if(e.target===o){closeSaveBox();return;}if(!b)return;const a=b.dataset.s;
  if(a==='close')closeSaveBox();else if(a==='ren')renameColony();else if(a==='del')deleteColony();else if(a==='sdel')deleteSlot(b.dataset.k);else if(a==='now'){if(save())toast('💾 Saved');openSaveBox(true);}
  else if(a==='copy'){if(inGame)save();const c=encSave(localStorage.getItem(SK));$('svcode').value=c;$('svcode').select();(navigator.clipboard?navigator.clipboard.writeText(c):Promise.reject()).then(()=>toast('📋 Save code copied — paste it somewhere safe')).catch(()=>toast('Select the code in the box and copy it'));}
  else if(a==='file'){if(inGame)save();const blob=new Blob([localStorage.getItem(SK)],{type:'application/json'});const u=URL.createObjectURL(blob);const l=document.createElement('a');l.href=u;l.download=`MARS-${(S&&!S.demo?S.name:cur.name).replace(/\W+/g,'_')}-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);}
  else if(a==='paste'){(navigator.clipboard&&navigator.clipboard.readText?navigator.clipboard.readText():Promise.reject()).then(t=>{$('svcode').value=t;const js=decSave(t);if(confirm(`Load "${JSON.parse(js).name||'colony'}"? Your current colony (if any) is kept as a backup.`))importJS(js,'imported');}).catch(()=>{toast('Paste the code into the box (long-press → Paste), then tap 📥 Import code',1);$('svcode').focus();});}
  else if(a==='imp'){try{const js=decSave($('svcode').value);if(confirm('Load this save? Your current colony is kept as a backup.'))importJS(js);}catch(err){toast('❌ That is not a valid MARS save code',1);}}
  else if(a==='res'){const v=localStorage.getItem(b.dataset.k);if(v&&confirm('Restore this backup? Your current save is kept as a backup.'))importJS(v,'restored');}};
 $('svfile').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const js=decSave(t);if(confirm(`Load "${JSON.parse(js).name||'colony'}" from file? Your current colony is kept as a backup.`))importJS(js,'loaded from file');}catch(err){toast('❌ That file is not a MARS save',1);}});};}
// ---------- v19 styled dialogs + rename/delete colony
function mDialog(o){return new Promise(res=>{let d=$('mdlg');if(!d){d=document.createElement('div');d.id='mdlg';document.body.appendChild(d);}
 d.innerHTML=`<div class="card"><div class="h">${o.title}</div>${o.body?`<div class="b">${o.body}</div>`:''}${o.input!=null?`<input id="mdin" maxlength="${o.max||24}" value="${String(o.input).replace(/"/g,'&quot;')}"><div class="sub" id="mdcnt"></div>`:''}<div class="btns">${o.buttons.map((b,i)=>`<button data-i="${i}" class="${b.cls||''}">${b.t}</button>`).join('')}</div></div>`;d.style.display='flex';
 const inp=$('mdin'),cnt=$('mdcnt');if(inp){const up=()=>cnt.textContent=`${inp.value.length}/${o.max||24}`;inp.oninput=up;up();inp.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')fin(o.buttons.findIndex(b=>b.ok));if(e.key==='Escape')fin(-1);};setTimeout(()=>{inp.focus();inp.select();},50);}
 const fin=i=>{const b=o.buttons[i];if(b&&b.keep){b.keep(inp&&inp.value);return;}d.style.display='none';res({v:b?b.v:null,text:inp?inp.value.trim():null});};
 d.onclick=e=>{if(e.target===d){fin(-1);return;}const b=e.target.closest('button[data-i]');if(b)fin(+b.dataset.i);};});}
function exportFile(){const js=localStorage.getItem(SK);if(!js)return;let nm='colony';try{nm=JSON.parse(js).name||nm;}catch(e){}const blob=new Blob([js],{type:'application/json'});const u=URL.createObjectURL(blob);const l=document.createElement('a');l.href=u;l.download=`MARS-${nm.replace(/\W+/g,'_')}-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);toast('⬇️ Save file exported');}
const inGameNow=()=>S&&!S.demo&&$('ui').style.display!=='none';
async function renameColony(){const g=inGameNow();let cur=g?S.name:(slotInfo(SK)||{}).name;if(!cur)return;
 const r=await mDialog({title:'✏️ RENAME COLONY',input:cur,max:24,buttons:[{t:'Cancel',v:0},{t:'Rename',cls:'go',v:1,ok:1}]});if(!r.v)return;const n=r.text.slice(0,24);if(!n){toast('Name can’t be empty',1);return;}
 if(g){S.name=n;save();}else{try{const d=JSON.parse(localStorage.getItem(SK));d.name=n;localStorage.setItem(SK,JSON.stringify(d));}catch(e){toast('Couldn’t rename that save',1);return;}showTitle();}
 toast(`✏️ Colony renamed to ${n}`);if($('savebox')&&$('savebox').style.display==='flex')openSaveBox(g);}
async function deleteColony(){const info=slotInfo(SK);const nm=inGameNow()?S.name:info&&info.name;if(!nm)return;
 const r=await mDialog({title:'🗑️ DELETE COLONY',body:`Delete <b>${nm}</b>? This can't be undone.<br><span class="sub">The save, all automatic backups and the “previous colony” slot are erased.</span>`,buttons:[{t:'⬇️ Export a copy first',v:'exp',keep:()=>{if(inGameNow())save();exportFile();}},{t:'Cancel',v:0},{t:'Delete',cls:'danger',v:1}]});
 if(r.v!==1)return;saveBlocked=true;[SK,...SLOTS].forEach(k=>{try{localStorage.removeItem(k);}catch(e){}});lastSaved=0;closeSaveBox();closePanel&&closePanel();showTitle();saveBlocked=false;toast(`🗑️ ${nm} was deleted`,1);beep(200,.15,'sawtooth',.04);}
async function deleteSlot(k){const s=slotInfo(k);const r=await mDialog({title:'🗑️ DELETE BACKUP',body:`Delete this backup${s&&s.name?` of <b>${s.name}</b> (Sol ${s.sol})`:''}? This can't be undone.`,buttons:[{t:'Cancel',v:0},{t:'Delete',cls:'danger',v:1}]});if(r.v!==1)return;localStorage.removeItem(k);toast('🗑️ Backup deleted');openSaveBox(inGameNow());}
window.__mSave=()=>save();
function closeSaveBox(){const o=$('savebox');if(o)o.style.display='none';}
function loadFail(e){console.error('load failed',e);saveBlocked=true;showTitle();const m=$('loaderr');if(m){m.style.display='block';m.innerHTML=`⚠️ Your saved colony couldn't be loaded (${String(e&&e.message||e).slice(0,80)}). It has <b>not</b> been touched — open <b>💾 Saves</b> to export it or restore a backup.`;}}

$('mktb').onclick=()=>openM();$('save').onclick=()=>{save();openSaveBox(true);};$('newg').onclick=()=>{save();showTitle();};
$('buildb').onclick=()=>{if(!menuOpen&&!(S&&S.tut))tab=null;if(sel==='dozer')sel=null;setMenu(!menuOpen);dozeSync();};$('dozeb').onclick=()=>{sel=sel==='dozer'?null:'dozer';beep(sel?300:500,.06,'square',.04);menu();updPrev();dozeSync();if(sel)toast('🚜 Bulldoze mode — tap a building or drag over paths. Tap 🚜 again to stop.');};$('undob').onclick=()=>undoStroke();$('mclose').onclick=()=>setMenu(false);
addEventListener('resize',()=>{R.setSize(innerWidth,innerHeight);camUp();});
// ---------- ships
function shipTick(b,dt,st){const o=objs.get(b.id);if(!o||b.cons>0)return;const base=by(b)+.36,cx=bc(b).x,cz=bc(b).z;
 if(b.t==='lpad'&&!b.ship){if(!b.call||S.t<b.call.due)return;if(!b.call.go){b.call.go=1;b.timer=0;}}if(!b.ship){b.timer-=dt;if(b.timer<=0&&!S.demo&&S.t-(S.lastLandT??-999)<TUNE.LAND_GAP){b.timer=TUNE.LAND_GAP-(S.t-S.lastLandT)+5+Math.random()*10;}if(b.timer<=0){S.lastLandT=S.t;const m=rocket();m.rotation.order="YXZ";m.rotation.y=Math.PI/4+.85+rot+(Math.random()-.5)*.2;const F=new THREE.Group();F.scale.setScalar(4);F.position.set(cx,0,cz);F.add(m);W.add(F);b.ship={m,F,ph:'land',t:0};if(!S.demo)rumble(6,.2);}return;}
 const sh=b.ship,m=sh.m,fl=m.getObjectByName('flame'),fl2=m.getObjectByName('flame2');sh.t+=dt;m.position.x=0;m.position.z=0;
 if(sh.ph==='land'){const r=landPose(m,sh.t,PADL);m.position.y+=base/4;if(r.ph===2&&r.y<5){sh.dT=(sh.dT||0)-dt;if(sh.dT<=0){sh.dT=.35;dust(cx,cz,base,r.y<1.5?10:5);}}
  if(sh.t>=PADL.T){pose(m,0,0);m.position.y+=base;setFire(m,false);sh.ph='ground';sh.t=0;if(!S.demo)S.supplyN=(S.supplyN||0)+1;sh.stay=S.demo?6:TUNE.PAD_STAY;sh.hold={fuel:0,mat:0,ore:0,rare:0};
   const room=st.house-S.cols.length;const want=Math.round((TUNE.SHIP_CREW[0]+Math.random()*(TUNE.SHIP_CREW[1]-TUNE.SHIP_CREW[0]))*(S.hap/100+.3)*(1+S.cols.length/60));const call=b.t==='lpad'?b.call:null;const crewed=call?call.k==='crew':Math.random()<((S.births||0)>0?.22:.4);const n=call?(call.k==='crew'?Math.max(0,Math.min(room,8)):0):crewed?Math.max(0,Math.min(room,want)):0;
   const pal=palletN(),mats=pal+S.order;const ord=S.order;S.order=0;{const items=[];for(let k=n;k>0;k-=3)items.push({k:'crew',n:Math.min(3,k)});if(!call||call.k!=='parts')items.push({k:'cargo',mat:mats});if((!crewed&&!call)||(call&&call.k==='mat'))items.push({k:'cargo',mat:palletN()});if(call&&call.k==='parts')items.push({k:'cargo',mat:0,parts:50});b.call=null;startUnload({sid:b.id,cx,cz,gy:base,items,pad:1});sh.unl=unloads[unloads.length-1];}
   if(!S.demo){toast(`🚀 Supply ship landed at ${b.name} — unloading ${n?n+' crew':crewed?'no crew (need housing!)':'cargo only'} + ${mats} 🧱${ord?` (incl. your ${ord} order)`:''}`,!n);toast(`⛽ Refuel it & load cargo within ${TUNE.PAD_STAY}s for a paid return flight (tap the pad)`);}}}
 else if(sh.ph==='ground'){sh.stay-=dt;if(sh.stay<=0){if(sh.unl&&!sh.unl.done)finishUnload(sh.unl);const h=sh.hold;S.fuel+=h.fuel;S.mat+=h.mat;S.ore+=h.ore;S.rare+=h.rare;sh.ph='up';sh.t=0;if(!S.demo)toast(`🛫 Supply ship left ${b.name} empty — refuel ships for return-flight income`);if(panel&&panel.b===b)renderPanel(true);}}
 else{if(!sh.lift){sh.lift=1;dust(cx,cz,base,10);if(!S.demo)rumble(3,.25);}pose(m,Math.pow(sh.t,2)*1.6,0);m.position.y+=base/4;setFire(m,true);fl.scale.y=1.5+Math.random();if(sh.t>4.5){W.remove(m);b.ship=null;b.timer=shipInterval(b);}}}
// ---------- opening: Starships land on the soil
const SHIP_SPOTS=[[176,176],[188,168],[200,176],[168,188],[208,188]];
function frostSync(){S.b.forEach(b=>{if(b.t!=='ship')return;const o=objs.get(b.id);if(!o)return;const rk=o.getObjectByName('rk');if(!rk)return;let f;if(o.userData.land)f=1;else{f=Math.max(0,1-(S.t-(b.frostT??-1e9))/(DAY*1.5));const h=b.hold;if(h&&h.fuel>0)f=Math.max(f,.35+.6*Math.min(1,h.fuel/TUNE.RETURN_FUEL));}setFrost(rk,f);});}
function tickLandings(dt){let any=false;objs.forEach((o,id)=>{const L=o.userData.land;if(!L)return;any=true;L.t+=dt;const rk=o.getObjectByName('rk');if(L.t<0){rk.visible=false;return;}
 rk.visible=true;if(!L.r){L.r=1;if(!S.demo)rumble(6,.15);}const P=L.P||PADL;const r=landPose(rk,L.t,P);const b=byId(id);if(b&&r.ph===2&&r.y<6){L.dT=(L.dT||0)-dt;if(L.dT<=0){L.dT=.3;dust(bc(b).x,bc(b).z,0,r.y<1.5?12:6);if(!L.r2&&r.y<2){L.r2=1;if(!S.demo)rumble(4,.12);}}}
 if(L.t>=P.T){pose(rk,0,0);setFire(rk,false);delete o.userData.land;if(b){b.frostT=S.t;dustRing(bc(b).x,bc(b).z,S.demo?14:30);}if(L.arr&&b)landedArrival(b,L.arr);if(L.second&&b){S.ship2='done';assign();refreshDoors();startUnload({sid:b.id,cx:bc(b).x,cz:bc(b).z,gy:0,items:[{k:'cargo',mat:150}],onDone:()=>toast('📦 Serenity unloaded +150 🧱 — and its power systems join the grid (+15 ⚡)')});}}});
 if(!S.demo)arrivalsTick();if(!any&&!S.demo&&!S.unloadStarted&&(S.crewPending||(S.botsLanded||0)<2)){S.unloadStarted=1;const ships=S.b.filter(b=>b.t==='ship');let crew=S.crewPending,bq=2-(S.botsLanded||0);
  ships.forEach((b,i)=>{const items=[];const n=Math.ceil(crew/(ships.length-i));crew-=n;for(let k=n;k>0;k-=3)items.push({k:'crew',n:Math.min(3,k)});if(bq>0){items.push({k:'bot'});bq--;}
   if(i===ships.length-1)while(bq-->0)items.push({k:'bot'});if(items.length)startUnload({sid:b.id,cx:bc(b).x,cz:bc(b).z,gy:0,items,onDone:()=>{if(!S.crewPending&&!unloads.some(u=>u.sid!==b.id&&!u.done)&&!S.tut)toast(`👩‍🚀 Your crew is on the surface. Welcome to Mars!`);}});});
  if(!S.tut)toast('🚪 Cargo lifts lowering — the crew is disembarking');}}

// ---------- the second start ship arrives on its own, minutes after the first
function freeShipSpot(){const s0=S.b.find(b=>b.t==='ship');const cx=s0?s0.x:176,cz=s0?s0.z:176;
 for(let r=16;r<64;r+=2)for(let k=0;k<24;k++){const a=k/24*6.283+.4,x=Math.round(cx+Math.cos(a)*r),z=Math.round(cz+Math.sin(a)*r);let ok=free('ship',x,z);
  if(ok)for(let i=-4;i<=11&&ok;i++)for(let j=-4;j<=11;j++){const o=occ[x+i]?.[z+j];if(o){ok=false;break;}}if(ok)return[x,z];}return null;}
function ship2Tick(){if(S.demo||S.ship2!=='pending'||S.crewPending||(S.botsLanded||0)<2||unloads.length)return;
 const due=S.t>=S.ship2T||(S.tut&&S.tut.step>=3&&S.t>=S.ship2T*.5);if(!due||S.t-(S.lastLandT??-999)<TUNE.LAND_GAP)return;const p=freeShipSpot();if(!p)return;
 S.ship2='landing';S.lastLandT=S.t;const b=addB('ship',p[0],p[1],1);b.name='Serenity';const o=objs.get(b.id);o.userData.land={t:0,P:INTROL,second:1};o.getObjectByName('rk').visible=false;
 toast('🚀 Second Starship "Serenity" is on final approach — watch the sky!',1);}
// ---------- tutorial (the early game, told as a story)
const has=k=>S.b.some(b=>b.t===k&&!(b.cons>0));
// ---------- colony levels (milestones, not XP). Data-driven: later eras append to LEVELS.
const cntB=k=>S.b.filter(b=>b.t===k&&!(b.cons>0)).length;
const housedN=()=>S.cols.filter(c=>c.home).length;
const sinceLv=k=>Math.floor((S[k]||0)-((S.lvBase||{})[k]||0));
const TIERMAX=[0,2,2,2,3,3,3,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5];
const ERAS=[{n:'Outpost',from:1,to:10},{n:'Settlement',from:11,to:20}];
const LEVELS=[null,
 {n:'Landing',unlock:['hab','farm','ice','solar','wtank','battery','path','road','antenna','crates','bench','planter','flag','sign','dozer'],perk:'Buildings up to L2',goals:[
  {t:'Build a 🏠 Habitat',v:()=>cntB('hab'),need:1},
  {t:'Connect ship & habitat with 🚶 paths',v:()=>S.b.some(b=>b.t==='hab'&&b.door)&&S.b.some(b=>b.t==='ship'&&b.door)?1:0,need:1},
  {t:'Build a 🌱 Farm Dome',v:()=>cntB('farm'),need:1},
  {t:'Build an 🧊 Ice Extractor',v:()=>cntB('ice'),need:1},
  {t:'Upgrade a farm to L2',v:()=>S.b.some(b=>b.t==='farm'&&b.lvl>=2)?1:0,need:1},
  {t:'Build 💧 Tank, ☀️ Solar & 🔋 Battery',v:()=>['wtank','solar','battery'].filter(k=>cntB(k)).length,need:3}]},
 {n:'First Wave',unlock:[],perk:'Two Starships of colonists inbound',onReach:()=>queueWave(),goals:[
  {t:'Welcome 2 Starships of colonists',v:()=>S.waveLanded||0,need:2},
  {t:'House 14 colonists',v:housedN,need:14},
  {t:'Food production positive',v:()=>lastSt&&lastSt.food>0?1:0,need:1},
  {t:'Water production positive',v:()=>lastSt&&lastSt.wat>0?1:0,need:1},
  {t:'Power everyone (no shortage)',v:()=>lastSt&&lastSt.pu>0&&lastSt.pw>=lastSt.pu?1:0,need:1}]},
 {n:'Industry',unlock:['mine','proc','rockg'],perk:'Regolith mining',goals:[
  {t:'Build a ⛏️ Regolith Mine',v:()=>cntB('mine'),need:1},
  {t:'Build a 🏗️ Material Processor',v:()=>cntB('proc'),need:1},
  {t:'Process 100 🧱 materials',v:()=>sinceLv('made'),need:100},
  {t:'Grow to 16 colonists',v:()=>S.cols.length,need:16}]},
 {n:'Landing Pad',unlock:['pad','bannr'],perk:'Recurring supply ships · L3 upgrades',goals:[
  {t:'Build a 🛬 Landing Pad',v:()=>cntB('pad'),need:1},
  {t:'Receive 2 supply ships',v:()=>sinceLv('supplyN'),need:2},
  {t:'Grow to 22 colonists',v:()=>S.cols.length,need:22}]},
 {n:'Optimus Bay',unlock:['robot'],perk:'Build Optimus robots',goals:[
  {t:'Build an 🤖 Optimus Bay',v:()=>cntB('robot'),need:1},
  {t:'Field 5 robots',v:()=>(S.bots||[]).length,need:5},
  {t:'Stockpile 300 🧱',v:()=>Math.floor(S.mat),need:300},
  {t:'Grow to 26 colonists',v:()=>S.cols.length,need:26}]},
 {n:'Comfort',unlock:['ent','med','waste','statue','hydro'],perk:'Morale buildings',goals:[
  {t:'Build an Entertainment Hub',v:()=>cntB('ent'),need:1},
  {t:'Build a Medical Bay',v:()=>cntB('med'),need:1},
  {t:'Upgrade a 🏠 Habitat to L3 (dome block)',v:()=>S.b.some(b=>b.t==='hab'&&b.lvl>=3)?1:0,need:1},
  {t:'Happiness 70% or more',v:()=>Math.round(S.hap),need:70},
  {t:'Grow to 32 colonists',v:()=>S.cols.length,need:32}]},
 {n:'Water & Ice',unlock:['recyc','bigfarm','gdome'],perk:'L4 upgrades',goals:[
  {t:'Water storage 600+',v:()=>lastSt?Math.floor(lastSt.wcap):0,need:600},
  {t:'Run 2 Water Recyclers',v:()=>cntB('recyc'),need:2},
  {t:'Run 3 🧊 Ice Extractors',v:()=>cntB('ice'),need:3},
  {t:'Grow to 38 colonists',v:()=>S.cols.length,need:38}]},
 {n:'Fuel Depot',unlock:['fuel','algae'],perk:'Methane fuel production',goals:[
  {t:'Build 2 ⛽ Fuel Plants',v:()=>cntB('fuel'),need:2},
  {t:'Store 200 ⛽ fuel',v:()=>Math.floor(S.fuel),need:200},
  {t:'Grow to 44 colonists',v:()=>S.cols.length,need:44}]},
 {n:'Ready to Launch',unlock:[],perk:'Refuel ships & load cargo · L5 upgrades',goals:[
  {t:`Fuel a ship to ${TUNE.RETURN_FUEL} ⛽`,v:()=>Math.floor(Math.max(0,...holds().map(h=>h.fuel))),need:TUNE.RETURN_FUEL},
  {t:'Load 60 cargo into one ship',v:()=>Math.max(0,...holds().map(h=>h.mat+h.ore+h.rare)),need:60},
  {t:'Grow to 50 colonists',v:()=>S.cols.length,need:50}]},
 {n:'Return Flights',unlock:['refin','reactor','mega','sec','obelisk'],perk:'Return flights & full trade',goals:[
  {t:'Launch a return flight',v:()=>sinceLv('launches'),need:1},
  {t:'Get paid on Earth (flight lands)',v:()=>sinceLv('flightsDone'),need:1},
  {t:'Earn ¢1500 from trade',v:()=>sinceLv('tradeEarned'),need:1500},
  {t:'Grow to 60 colonists',v:()=>S.cols.length,need:60}]},
 {n:'Rover Garage',era:'Settlement',unlock:['garage'],perk:'Pressurized rovers & scout missions · habitat specializations',goals:[
  {t:'Build a 🚙 Rover Garage',v:()=>cntB('garage'),need:1},
  {t:'Assemble a rover',v:()=>(S.rovers||[]).length,need:1},
  {t:'Complete 2 scout missions',v:()=>sinceLv('scouts'),need:2},
  {t:'Grow to 70 colonists',v:()=>S.cols.length,need:70}]},
 {n:'Research Lab',unlock:['lab','lpad','insect'],perk:'Tech upgrades · Launch Pad (Call Earth)',goals:[
  {t:'Build a 🔬 Research Lab',v:()=>cntB('lab'),need:1},
  {t:'Research 2 technologies',v:()=>Object.keys(S.tech||{}).length,need:2},
  {t:'Build a 🛰️ Launch Pad',v:()=>cntB('lpad'),need:1},
  {t:'Grow to 78 colonists',v:()=>S.cols.length,need:78}]},
 {n:'Survey Missions',unlock:['aqua'],perk:'Rovers can survey sites for deposits',goals:[
  {t:'Survey 3 sites',v:()=>sinceLv('surveys'),need:3},
  {t:'Find an ice deposit',v:()=>(S.sites||[]).some(s=>s.surv&&s.k==='ice')?1:0,need:1},
  {t:'Find an iron or rare deposit',v:()=>(S.sites||[]).some(s=>s.surv&&(s.k==='iron'||s.k==='rare'))?1:0,need:1},
  {t:'Grow to 86 colonists',v:()=>S.cols.length,need:86}]},
 {n:'Factories',unlock:['factory'],perk:'⚙️ Parts for advanced buildings',goals:[
  {t:'Build a ⚙️ Parts Factory',v:()=>cntB('factory'),need:1},
  {t:'Make 80 ⚙️ parts',v:()=>sinceLv('partsMade'),need:80},
  {t:'Grow to 94 colonists',v:()=>S.cols.length,need:94}]},
 {n:'Healthcare & Families',unlock:['medc','school','bigdome'],perk:'Babies are born when colonists are happy & housed',goals:[
  {t:'Build a 🏥 Med Center',v:()=>cntB('medc'),need:1},
  {t:'Build a 🏫 School',v:()=>cntB('school'),need:1},
  {t:'Specialize a Family Hab',v:()=>S.b.filter(b=>b.spec==='family').length,need:1},
  {t:'Welcome 5 babies',v:()=>sinceLv('births'),need:5},
  {t:'Grow to 102 colonists',v:()=>S.cols.length,need:102}]},
 {n:'Deep Mining',unlock:['drill','complex'],perk:'Deep drill rigs on deposits',goals:[
  {t:'Build a 🛢️ Deep Drill on a deposit',v:()=>cntB('drill'),need:1},
  {t:'Dig 600 ore',v:()=>sinceLv('oreDug'),need:600},
  {t:'Grow to 110 colonists',v:()=>S.cols.length,need:110}]},
 {n:'Ice Mining Expedition',unlock:['icefield'],perk:'Remote ice rigs & rover supply runs',goals:[
  {t:'Build a ❄️ Remote Ice Rig on an ice site',v:()=>cntB('icefield'),need:1},
  {t:'Haul 300 💧 home by rover',v:()=>sinceLv('roverWater'),need:300},
  {t:'Grow to 118 colonists',v:()=>S.cols.length,need:118}]},
 {n:'Nuclear Power',unlock:['kilo'],perk:'Kilopower fission · ⚠️ dust storms begin',onReach:()=>{S.nextStorm=S.t+DAY*.6;},goals:[
  {t:'Build 2 ☢️ Kilopower reactors',v:()=>cntB('kilo'),need:2},
  {t:'Ride out a dust storm',v:()=>sinceLv('storms'),need:1},
  {t:'Power surplus at night',v:()=>S.nightPow?1:0,need:1},
  {t:'Grow to 128 colonists',v:()=>S.cols.length,need:128}]},
 {n:'Satellite Outpost',unlock:['outpost'],perk:'A second base on a surveyed site',goals:[
  {t:'Build a 🏕️ Satellite Outpost on a site',v:()=>cntB('outpost'),need:1},
  {t:'Run 3 rover supply runs to it',v:()=>sinceLv('outRuns'),need:3},
  {t:'Grow to 138 colonists',v:()=>S.cols.length,need:138}]},
 {n:'Settlement Charter',unlock:['arco'],perk:'Become a town',goals:[
  {t:'Grow to 150 colonists',v:()=>S.cols.length,need:150},
  {t:'Happiness 65% or more',v:()=>Math.round(S.hap),need:65},
  {t:'Research 5 technologies',v:()=>Object.keys(S.tech||{}).length,need:5}]},
];
const LVMAX=LEVELS.length-1;
const LVOF={};LEVELS.forEach((L,i)=>L&&L.unlock.forEach(k=>LVOF[k]=i));
const lvOf=k=>LVOF[k]||1,lvLocked=k=>!!S&&!S.demo&&lvOf(k)>(S.lvl||1);
function holds(){const r=[];S.b.forEach(b=>{if(b.t==='ship'&&b.hold)r.push(b.hold);if(b.t==='pad'&&b.ship&&b.ship.hold)r.push(b.ship.hold);});return r;}
function lvGoals(){const L=LEVELS[S.lvl||1];return L?L.goals.map(g=>{const v=Math.max(0,g.v()||0);return{t:g.t,v:Math.min(v,g.need),need:g.need,ok:v>=g.need};}):[];}
function lvPct(gs){if(!gs.length)return 100;return Math.round(gs.reduce((a,g)=>a+Math.min(1,g.v/g.need),0)/gs.length*100);}
function lvSnap(){S.lvBase={};['made','supplyN','launches','flightsDone','tradeEarned','scouts','surveys','partsMade','births','oreDug','roverWater','storms','outRuns'].forEach(k=>S.lvBase[k]=S[k]||0);}
function lvTick(){if(!S||S.demo||S.lvlFx)return;if((S.lvl||1)>=LVMAX){if(S.eraDone!==LVMAX&&lvGoals().every(g=>g.ok)){S.eraDone=LVMAX;S.town=1;celebrate(LVMAX,true);save();}return;}
 const gs=lvGoals();if(gs.length&&gs.every(g=>g.ok))levelUp();}
function levelUp(){S.lvl=(S.lvl||1)+1;lvSnap();const L=LEVELS[S.lvl];if(L.onReach)L.onReach();if(S.lvl>=2&&S.tut)endTut();menu();celebrate(S.lvl);save();}
function lvUnlockTxt(i){const L=LEVELS[i];const a=L.unlock.filter(k=>B[k]).map(k=>`${B[k].ic} ${B[k].n}`);if(L.perk)a.push('✨ '+L.perk);return a;}
// Lv2: the first colonist wave — two Starships, never landing together
function queueWave(){if(S.waveQueued)return;S.waveQueued=1;S.ship2='done';S.arrivals=[{name:'Serenity',crew:6},{name:'Endurance',crew:6}];S.nextArr=S.t+12;toast('📡 Mission Control: the First Wave launched from Earth — 2 Starships of colonists inbound. Get habitats ready!',1);}
function arrivalsTick(){if(S.demo||!S.arrivals||!S.arrivals.length||S.crewPending||S.t<(S.nextArr||0))return;
 if(S.t-(S.lastLandT??-999)<TUNE.LAND_GAP)return;let busy=false;objs.forEach(o=>{if(o.userData.land)busy=true;});if(busy)return;const p=freeShipSpot();if(!p)return;
 const a=S.arrivals.shift();S.lastLandT=S.t;const b=addB('ship',p[0],p[1],1);b.name=a.name;b.wave=1;const o=objs.get(b.id);o.userData.land={t:0,P:INTROL,arr:a};o.getObjectByName('rk').visible=false;
 toast(`🚀 Starship "${a.name}" on final approach with ${a.crew} colonists + a materials pallet — watch the sky!`,1);}
function landedArrival(b,a){a.mat=palletN();S.waveLanded=(S.waveLanded||0)+1;assign();refreshDoors();const items=[];for(let k=a.crew;k>0;k-=3)items.push({k:'crew',n:Math.min(3,k)});items.push({k:'cargo',mat:a.mat});
 startUnload({sid:b.id,cx:bc(b).x,cz:bc(b).z,gy:0,items,onDone:()=>toast(`👩‍🚀 ${a.crew} colonists from ${a.name} are on the surface (+${a.mat} 🧱)`)});}
function oldSaveLevel(){let l=1;const t=new Set(S.b.map(b=>b.t));if(S.b.some(b=>b.t!=='ship'&&B[b.t]&&B[b.t].cat==='b'))l=2;
 t.forEach(k=>{if(B[k]&&B[k].cat==='b')l=Math.max(l,lvOf(k));});if((S.launches||0)>0||t.has('fuel')||t.has('refin'))l=LVMAX;
 const mx=Math.max(1,...S.b.map(b=>b.lvl||1));while(l<LVMAX&&TIERMAX[l]<mx)l++;return l;}
// ===================== v14: Settlement era systems =====================
const TECH={solar2:{n:'Thin-film solar',d:'+30% solar output',c:40},mine2:{n:'Bucket-wheel excavators',d:'+40% ore from mines & drills',c:60},
 cheap:{n:'Regolith 3D printing',d:'−20% build cost',c:80},bat2:{n:'Solid-state batteries',d:'+60% battery storage',c:60},farm2:{n:'LED hydroponics',d:'+25% food',c:70},
 drive:{n:'Rover drivetrain',d:'+50% rover speed & cargo',c:50},fab:{n:'Robotic assembly',d:'+40% parts output',c:90},med2:{n:'Bio-medicine',d:'+30% births, healthier colony',c:100}};
const T=k=>!!(S&&S.tech&&S.tech[k]);
const bcost=d=>{const k=T('cheap')?.8:1;return{c:Math.round((d.c||0)*k),m:Math.round((d.m||0)*k),p:d.p||0};};
const ROVER_NAMES=['Opportunity II','Spirit','Curiosity','Perseverance II','Sojourner','Zhurong II','Endeavour','Pathfinder'];
const SITEK={ice:{ic:'🧊',n:'Ice deposit',c:0x7fe0ff},iron:{ic:'🔩',n:'Iron deposit',c:0xd0603a},rare:{ic:'💎',n:'Rare-metal deposit',c:0xc77dff},hab:{ic:'🏕️',n:'Outpost site',c:0x6fe08a}};
const CENTER={x:184,z:184};
// ---------- fog of war
const fogC=document.createElement('canvas');fogC.width=fogC.height=192;const fogX=fogC.getContext('2d');const fogTex=new THREE.CanvasTexture(fogC);fogTex.colorSpace=THREE.SRGBColorSpace;
const fogMesh=new THREE.Mesh(new THREE.PlaneGeometry(N,N).rotateX(-Math.PI/2).translate(N/2,.035,N/2),new THREE.MeshBasicMaterial({map:fogTex,transparent:true,depthWrite:false}));fogMesh.renderOrder=2;W.add(fogMesh);
function drawFog(){const k=fogC.width/N;fogX.globalCompositeOperation='source-over';fogX.clearRect(0,0,fogC.width,fogC.height);fogX.fillStyle='rgba(28,8,2,.62)';fogX.fillRect(0,0,fogC.width,fogC.height);
 fogX.globalCompositeOperation='destination-out';(S.fog||[]).forEach(f=>{const g=fogX.createRadialGradient(f.x*k,f.z*k,f.r*k*.75,f.x*k,f.z*k,f.r*k);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');fogX.fillStyle=g;fogX.beginPath();fogX.arc(f.x*k,f.z*k,f.r*k,0,7);fogX.fill();});
 fogTex.needsUpdate=true;fogMesh.visible=!S.demo&&(S.lvl||1)>=11;}
const explored=(x,z)=>(S.fog||[]).some(f=>Math.hypot(x-f.x,z-f.z)<f.r*.85);
function reveal(x,z,r){S.fog.push({x,z,r});const f=[];(S.sites||[]).forEach(s=>{if(!s.found&&Math.hypot(s.x-x,s.z-z)<r*.9){s.found=1;f.push(s);}});drawFog();syncSites();return f;}
function genSites(){const ks=['ice','ice','ice','iron','iron','iron','rare','rare','hab','hab','hab'];const out=[];let id=1;
 ks.forEach(k=>{for(let tr=0;tr<80;tr++){const a=Math.random()*6.283,d=96+Math.random()*80,x=Math.round(CENTER.x+Math.cos(a)*d),z=Math.round(CENTER.z+Math.sin(a)*d);
  if(x<16||z<16||x>N-24||z>N-24||occ[x]?.[z]||explored(x,z)||out.some(s=>Math.hypot(s.x-x,s.z-z)<36))continue;out.push({id:id++,k,x,z,found:0,surv:0,rich:+(0.8+Math.random()*.7).toFixed(2)});break;}});return out;}
function initSettle(){S.fog=S.fog||null;if(!S.fog){S.fog=[{x:CENTER.x,z:CENTER.z,r:88}];const bs=S.b.filter(b=>b.t!=='ship'||true);if(bs.length){let r=0;bs.forEach(b=>r=Math.max(r,Math.hypot(b.x-CENTER.x,b.z-CENTER.z)));if(r>64)S.fog[0].r=Math.min(240,r+32);}}
 if(!S.sites)S.sites=genSites();S.rovers=S.rovers||[];S.tech=S.tech||{};S.rp=S.rp||0;S.parts=S.parts||0;drawFog();syncSites();syncRovers();}
// ---------- site markers
let siteObjs=new Map();
function siteModel(s){const g=new THREE.Group();const c=s.surv?SITEK[s.k].c:0xffffff;const mat=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.8});
 g.add(mesh(new THREE.RingGeometry(1.1,1.25,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.7,side:THREE.DoubleSide}),0,.05,0,false));
 g.add(mesh(cyl(.02,.02,1.1,6),MAT.steel,0,.55,0,false));const bl=mesh(new THREE.SphereGeometry(.12,12,10),mat,0,1.15,0,false);bl.name='blink';g.add(bl);
 if(s.surv&&s.k!=='hab')for(let i=0;i<5;i++)g.add(mesh(new THREE.DodecahedronGeometry(.12+Math.random()*.1,0),new THREE.MeshStandardMaterial({color:c,roughness:.5,metalness:s.k==='ice'?.1:.6}),Math.cos(i*1.3)*.55,.06,Math.sin(i*1.3)*.55));
 if(s.meteor){g.add(mesh(new THREE.RingGeometry(.5,1.6,40).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x3a1a0a,transparent:true,opacity:.75}),0,.03,0,false));const r=mesh(new THREE.DodecahedronGeometry(.32,1),new THREE.MeshStandardMaterial({color:0x2a2420,metalness:.8,roughness:.35}),0,.2,0);r.scale.y=.7;g.add(r);}
 g.position.set(s.x+.5,0,s.z+.5);return g;}
function syncSites(){siteObjs.forEach(o=>W.remove(o));siteObjs.clear();if(S.demo)return;(S.sites||[]).forEach(s=>{if(!s.found||s.used)return;const o=siteModel(s);o.scale.setScalar(4);W.add(o);siteObjs.set(s.id,o);});}
const siteNear=(x,z,kinds,r=10.4)=>(S.sites||[]).find(s=>s.surv&&!s.used&&(!kinds||kinds.includes(s.k))&&Math.hypot(s.x+.5-x,s.z+.5-z)<r);
// ---------- rovers
function roverModel(){const g=new THREE.Group(),t=truckModel(),G=ctGeoms();const cr=t.getObjectByName('crate');if(cr)t.remove(cr);t.rotation.y=Math.PI/2;t.traverse(m=>{if(m.geometry===G.tyre||m.geometry===G.hub){m.scale.set(1.35,1.12,1.12);}});t.position.y=.06*G.k;g.add(t);return g;}
function roverModelOld(){const g=new THREE.Group();const body=new THREE.Group();g.add(body);
 body.add(mesh(rbox(.62,.1,.34,.03),MAT.steel,0,.16,0));body.add(mesh(new THREE.CapsuleGeometry(.13,.3,6,12).rotateZ(Math.PI/2),MAT.white,-.03,.3,0));
 body.add(mesh(new THREE.BoxGeometry(.16,.06,.27),winMat,.17,.33,0,false));body.add(mesh(cyl(.006,.006,.25,5),MAT.dark,-.2,.5,.08,false));
 body.add(mesh(new THREE.BoxGeometry(.03,.03,.05),new THREE.MeshBasicMaterial({color:0xfff6d0}),.32,.2,.1,false));body.add(mesh(new THREE.BoxGeometry(.03,.03,.05),new THREE.MeshBasicMaterial({color:0xfff6d0}),.32,.2,-.1,false));
 for(const x of[-.22,0,.22])for(const z of[-.19,.19])g.add(mesh(cyl(.075,.075,.06,12).rotateX(Math.PI/2),MAT.dark,x,.075,z));g.scale.setScalar(1.3);return g;}
let rovObjs=new Map();
function garageOf(r){return S.b.find(b=>b.id===r.g&&b.t==='garage')||S.b.find(b=>b.t==='garage'&&!(b.cons>0));}
function syncRovers(){const ids=new Set((S.rovers||[]).map(r=>r.id));rovObjs.forEach((m,id)=>{if(!ids.has(id)){W.remove(m);rovObjs.delete(id);}});
 (S.rovers||[]).forEach((r,i)=>{let m=rovObjs.get(r.id);if(!m){m=roverModel();m.scale.setScalar(4);W.add(m);rovObjs.set(r.id,m);}if(r.st==='home'){const g=garageOf(r);if(g){r.x=g.x+B.garage.s+2;r.z=g.z+2+i%3*2.8;}}m.position.set(r.x,0,r.z);});}
function buildRover(g){const max=1+g.lvl;const mine=S.rovers.filter(r=>r.g===g.id).length;if(mine>=Math.min(4,max)){toast(`This garage holds ${Math.min(4,max)} rovers — upgrade it for more`,1);return;}
 if(!afford(400,80))return;pay(400,80);const used=new Set(S.rovers.map(r=>r.name));const nm=ROVER_NAMES.find(n=>!used.has(n))||('Rover '+(S.rovers.length+1));
 S.rovers.push({id:(S.rovId=(S.rovId||0)+1),name:nm,g:g.id,st:'home',x:g.x+B.garage.s+2,z:g.z+2});syncRovers();beep(620,.08,'triangle',.06);toast(`🚙 Rover "${nm}" rolled out of ${g.name} — tap the garage to rename it or send it out`);}
function roverSpeed(){return 9.6*(T('drive')?1.5:1);}
function sendRover(r,type,tgtSite){if(r.st!=='home')return;const g=garageOf(r);if(!g)return;let tx,tz,site=null;
 if(type==='scout'){const hid=S.sites.filter(s=>!s.found);let best=null;for(let tr=0;tr<40;tr++){let a,d;if(hid.length&&Math.random()<.65){const h=hid[Math.random()*hid.length|0];a=Math.atan2(h.z-g.z,h.x-g.x)+(Math.random()-.5)*.5;d=Math.hypot(h.x-g.x,h.z-g.z)+(Math.random()-.5)*16;}else{a=Math.random()*6.283;d=72+Math.random()*72;}
   const x=g.x+Math.cos(a)*d,z=g.z+Math.sin(a)*d;if(x<12||z<12||x>N-12||z>N-12)continue;if(!explored(x,z)){best={x,z};break;}if(!best)best={x,z};}if(!best){toast('Nothing left to scout nearby',1);return;}tx=best.x;tz=best.z;}
 else{site=tgtSite;if(!site){toast('Pick a target first',1);return;}tx=site.x+.5;tz=site.z+.5;}
 r.st='out';r.mis={type,tx,tz,site:site&&site.id,bid:site&&site.bid,w:0,fx:g.x+B.garage.s+2,fz:g.z+2};toast(`🚙 ${r.name} heads out on a ${type==='scout'?'scouting':type==='survey'?'survey':'supply'} mission`);beep(500,.06,'triangle',.05);}
// rovers route around building footprints with A* (paths are cheaper), re-plan when buildings change, and yield to each other
const rovPath=new Map();let cNav=null,cNavV=-1;const CN=N/4;
function navC(){if(cNavV===occV&&cNav)return cNav;cNav=Array.from({length:CN},()=>Array(CN).fill(null));for(let x=0;x<N;x++){const col=occ[x];if(!col)continue;for(let z=0;z<N;z++){const o=col[z];if(o&&!isDeco(o.t))cNav[x>>2][z>>2]=o;}}cNavV=occV;return cNav;}
function routeC(sx,sz,tx,tz,allow){const nc=navC(),cl=v=>Math.max(0,Math.min(CN-1,Math.floor(v/4)));const s={x:cl(sx),z:cl(sz)},t={x:cl(tx),z:cl(tz)};const K=(x,z)=>x*CN+z,tk=K(t.x,t.z),g=new Map(),from=new Map(),open=[[0,s.x,s.z]];g.set(K(s.x,s.z),0);let it=0,found=false;
 const ok=(x,z)=>{const o=nc[x][z];return!o||allow.includes(o)||(x===s.x&&z===s.z)||(x===t.x&&z===t.z);};
 while(open.length&&it++<12000){const[,x,z]=hpop(open);const k=K(x,z);if(k===tk){found=true;break;}const gc=g.get(k);for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=CN||nz>=CN||!ok(nx,nz))continue;if(dx&&dz&&(!ok(x+dx,z)||!ok(x,z+dz)))continue;let ng=gc+(dx&&dz?1.414:1);let pt=0;for(let a=0;a<4&&!pt;a++)for(let b=0;b<4;b++)if(tile(nx*4+a,nz*4+b)){pt=1;break;}if(pt)ng-=.35;const nk=K(nx,nz);if(g.has(nk)&&g.get(nk)<=ng)continue;g.set(nk,ng);from.set(nk,k);hpush(open,[ng+Math.hypot(nx-t.x,nz-t.z)*.7,nx,nz]);}}
 if(!found)return[{x:tx,z:tz}];const p=[];let c=tk;while(c!==undefined){p.push({x:(c/CN|0)*4+2,z:(c%CN)*4+2});c=from.get(c);}p.reverse();const w=[];for(let i=1;i<p.length-1;i++){const a=p[i-1],b=p[i],q=p[i+1];if((b.x-a.x)!==(q.x-b.x)||(b.z-a.z)!==(q.z-b.z))w.push(b);}w.push({x:tx,z:tz});return w;}
function rovRoute(r,tx,tz){const cl0=v=>Math.max(0,Math.min(N-1,Math.floor(v)));{const gB=occ[cl0(tx)]?.[cl0(tz)],sB=occ[cl0(r.x)]?.[cl0(r.z)];return routeC(r.x,r.z,tx,tz,[gB,sB].filter(Boolean));}const cl=v=>Math.max(0,Math.min(N-1,Math.floor(v)));const s={x:cl(r.x),z:cl(r.z)},t={x:cl(tx),z:cl(tz)};
 const gB=occ[t.x]?.[t.z],sB=occ[s.x]?.[s.z];const ok=(x,z)=>{const o=occ[x][z];return!o||o===gB||o===sB;};
 const p=astar(s,t,ok,(x,z)=>tile(x,z)?.55:1);if(!p)return[{x:tx,z:tz}];const w=[];for(let i=1;i<p.length-1;i++){const a=p[i-1],b=p[i],c=p[i+1];if((b.x-a.x)!==(c.x-b.x)||(b.z-a.z)!==(c.z-b.z))w.push({x:b.x+.5,z:b.z+.5});}w.push({x:tx,z:tz});return w;}
function tickRovers(dt){if(!S.rovers||!S.rovers.length)return;const sp=roverSpeed()*dt;
 S.rovers.forEach(r=>{const m=rovObjs.get(r.id);if(!m||r.st==='home')return;const M=r.mis;if(!M){r.st='home';return;}
  const go=(tx,tz)=>{const dx=tx-r.x,dz=tz-r.z,l=Math.hypot(dx,dz);if(l<sp){r.x=tx;r.z=tz;return true;}r.x+=dx/l*sp;r.z+=dz/l*sp;m.rotation.y=Math.atan2(-dz,dx);return false;};
  const goR=(tx,tz)=>{let P=rovPath.get(r.id);if(!P||P.tx!==tx||P.tz!==tz||P.v!==occV){P={tx,tz,v:occV,w:rovRoute(r,tx,tz),i:0};rovPath.set(r.id,P);}const w=P.w[P.i];
   for(const q of S.rovers){if(q===r||q.st==='home')continue;const dx=q.x-r.x,dz=q.z-r.z;if(dx*dx+dz*dz<12&&dx*(w.x-r.x)+dz*(w.z-r.z)>0&&(q.id<r.id||(r._w||0)<1.5)){r._w=(r._w||0)+dt;if(r._w<4)return false;}}r._w=0;
   if(go(w.x,w.z)){P.i++;if(P.i>=P.w.length){rovPath.delete(r.id);return true;}}return false;};
  if(r.st==='out'){if(goR(M.tx,M.tz)){r.st='work';M.w=M.type==='scout'?8:M.type==='survey'?12:5;}}
  else if(r.st==='work'){M.w-=dt;m.rotation.y+=dt*.6;if(M.w<=0){roverArrive(r);r.st='back';}}
  else if(r.st==='back'){if(goR(M.fx,M.fz)){roverHome(r);r.st='home';r.mis=null;}}
  m.position.set(r.x,Math.abs(Math.sin(S.t*9+r.id))*.08,r.z);if(Math.random()<dt*1.2&&r.st!=='work')dust(r.x-Math.cos(m.rotation.y)*1.6,r.z+Math.sin(m.rotation.y)*1.6,0,1);});}
function roverArrive(r){const M=r.mis;
 if(M.type==='scout'){const f=reveal(M.tx,M.tz,40);S.scouts=(S.scouts||0)+1;const bz_=BIO[bioAt(M.tx,M.tz)];toast(f.length?`📡 ${r.name} (${bz_.ic} ${bz_.n}) picked up ${f.length} unknown signal${f.length>1?'s':''} — ${S.lvl>=13?'send a survey mission':'surveys unlock at Lv 13'}`:`🗺️ ${r.name} mapped new terrain — ${bz_.ic} ${bz_.n}, no signals here`,!!f.length);}
 else if(M.type==='survey'){const s=S.sites.find(q=>q.id===M.site);if(s&&!s.surv){s.surv=1;S.surveys=(S.surveys||0)+1;syncSites();toast(`🧭 Survey report from ${r.name}: ${SITEK[s.k].ic} ${SITEK[s.k].n}${s.k!=='hab'?` (richness ×${s.rich})`:' — flat, stable ground for a second base'}`,1);}}
 else if(M.type==='supply'){const b=byId(M.bid);if(b&&b.t==='icefield'){const n=Math.min(b.stock||0,60*(T('drive')?1.5:1));b.stock-=n;M.cargo=n;}else M.cargo=0;}}
function roverHome(r){const M=r.mis;if(M&&M.type==='supply'){const b=byId(M.bid);if(b&&b.t==='icefield'&&M.cargo){const n=Math.floor(M.cargo);S.wat=Math.min((lastSt?lastSt.wcap:500),S.wat+n);S.roverWater=(S.roverWater||0)+n;floatText(`+${n} 💧`);toast(`❄️ ${r.name} hauled ${n} 💧 home from ${b.name}`);}
  else if(b&&b.t==='outpost'){S.outRuns=(S.outRuns||0)+1;toast(`🏕️ ${r.name} completed a supply run to ${b.name}`);}}
 const g=garageOf(r);if(g&&g.auto&&M&&M.type==='supply'){const b=byId(M.bid);if(b)setTimeout(()=>{if(r.st==='home')sendRover(r,'supply',{x:b.x+.5,z:b.z+.5,bid:b.id});},800);}}
// ---------- research, parts, babies, storms, meteors (called from sim)
function settleTick(dt,st){if(S.demo)return;
 let rp=0;S.b.forEach(b=>{if(b.cons>0)return;const d=B[b.t],m=LV[b.lvl-1],e=eff(b)*st.pe;if(d.rp)rp+=d.rp*m*e;if(b.spec==='science')rp+=.05*m;
  if(d.parts){const k=d.parts*m*e*(T('fab')?1.4:1)*dt;const u=Math.min(k,S.mat/2);S.mat-=u*2;S.parts=(S.parts||0)+u;S.partsMade=(S.partsMade||0)+u;}
  if(d.rstock){const cap=200*m;b.stock=Math.min(cap,(b.stock||0)+d.rstock*m*e*dt);}});S.rp=(S.rp||0)+rp*dt;S.rpRate=rp;
 if(st.pw>=st.pu&&dayK(S.t)<.15&&st.pu>0)S.nightPow=1;
 // storms
 if((S.lvl||1)>=18){if(S.storm){if(S.t>S.storm.end){S.storm=null;S.storms=(S.storms||0)+1;toast('🌤️ The dust storm has passed — solar output back to normal');stormFx(0);}}
  else if(S.t>(S.nextStorm||0)){S.nextStorm=S.t+DAY*(2.5+Math.random()*3);S.storm={end:S.t+40+Math.random()*35};toast('🌪️ DUST STORM! Solar output drops to ~25% — reactors & Kilopower keep running',1);stormFx(1);rumble(3,.1);}}}
let stormK=1;function stormFx(on){document.body.classList.toggle('storm',!!on);}
function stormMul(){return S&&S.storm?.25:1;}
function birthsTick(st){if(S.demo||(S.lvl||1)<15)return;const pop=S.cols.length;S.cols.forEach(c=>{if(c.kid&&S.t-c.born>DAY*3){c.kid=0;}});
 if(pop<10||S.hap<60||st.house<=pop||S.food<=0||st.food<0)return;const fam=S.b.filter(b=>b.spec==='family'&&!(b.cons>0)).length;
 const rate=pop*.00018*(1+fam*.25)*(T('med2')?1.3:1)*(cntB('medc')?1.2:.8);if(Math.random()<rate){const c=newCol();c.kid=1;c.born=S.t;const fn=c.n.split(' ')[0];S.births=(S.births||0)+1;assign();
  const n=performance.now();if(n-(birthsTick.t||0)>15000){birthsTick.t=n;toast(`👶 A baby was born in ${S.name}: welcome, ${fn}!`);beep(1047,.08,'triangle',.05);}}}
function meteorCheck(){if(S.demo||(S.lvl||1)<5)return;if(S.t-(S.lastMeteor||0)<DAY*12||Math.random()>.1)return;meteorStrike();}
function meteorStrike(){let p=null;for(let tr=0;tr<120&&!p;tr++){const x=4+Math.floor(Math.random()*(N-8)),z=4+Math.floor(Math.random()*(N-8));
  if(S.b.some(b=>Math.hypot(b.x-x,b.z-z)<36))continue;let ok=true;for(let i=-16;i<=16&&ok;i+=2)for(let j=-16;j<=16;j+=2)if(S.tiles[TK(x+i,z+j)]){ok=false;break;}if(ok&&!S.sites.some(s=>Math.hypot(s.x-x,s.z-z)<20))p={x,z};}
 if(!p)return false;S.lastMeteor=S.t;const fb=mesh(new THREE.SphereGeometry(.35,12,10),new THREE.MeshBasicMaterial({color:0xffc070}),0,0,0,false);const tr=mesh(new THREE.ConeGeometry(.3,6,10,1,true),new THREE.MeshBasicMaterial({color:0xff7a2a,transparent:true,opacity:.6}),0,0,0,false);
 const g=new THREE.Group();g.add(fb);tr.position.y=3;g.add(tr);const s0=new THREE.Vector3(p.x-112,240,p.z-72),s1=new THREE.Vector3(p.x+.5,0,p.z+.5);g.scale.setScalar(4);g.lookAt(s1);W.add(g);
 const dir=s1.clone().sub(s0).normalize();g.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),dir);const t0=performance.now();let t=0;toast('☄️ Meteor incoming! Impact well away from the colony…',1);
 const step=()=>{t=(performance.now()-t0)/1000;const k=Math.min(1,t/2.2);g.position.lerpVectors(s0,s1,k*k);if(k<1){requestAnimationFrame(step);return;}W.remove(g);
  dust(p.x+.5,p.z+.5,0,40);rumble(10,.5);beep(70,.6,'sawtooth',.08);const fl=new THREE.PointLight(0xffa040,60,30);fl.position.set(p.x+.5,2,p.z+.5);W.add(fl);setTimeout(()=>W.remove(fl),350);
  const s={id:(S.sites.reduce((m,q)=>Math.max(m,q.id),0)+1),k:'rare',x:p.x,z:p.z,found:1,surv:1,rich:2,meteor:1};S.sites.push(s);if(!explored(p.x,p.z))S.fog.push({x:p.x,z:p.z,r:6});drawFog();syncSites();
  toast('💎 Meteorite impact! It left a rare-metal deposit — a Mine (or Deep Drill) beside it digs 💎 rare ore',1);};step();return true;}
// ---------- habitat self-power (built-in solar roof + battery)
const SELFP={hab:1,mega:1,outpost:1,complex:1,arco:1};
function habSelf(b,dt){const d=B[b.t],m=LV[b.lvl-1];const use=-(d.pw||0)*m;const gen=2.4*m*sunK*(T('solar2')?1.3:1)*stormMul()*(b.t==='mega'?1.6:b.t==='complex'?3.5:b.t==='arco'?8:1);const cap=34*m*(T('bat2')?1.6:1)*(b.t==='mega'?1.6:1);
 if(b.hb==null)b.hb=cap*.6;let hb=b.hb+(gen-use)*dt;let draw=0;if(hb<0){draw=dt?-hb/dt:use-gen;hb=0;}else if(!dt&&b.hb<=.01&&gen<use)draw=use-gen;hb=Math.min(cap,hb);if(dt)b.hb=hb;b.hbCap=cap;b.gen=gen;return draw;}
// ---------- Launch Pad: Call Earth
const CALLS={mat:{n:'Materials',ic:'🧱',fuel:50,cr:450,d:'2 pallets (~300 🧱)'},parts:{n:'Parts',ic:'⚙️',fuel:70,cr:900,d:'50 ⚙️ parts'},crew:{n:'Colonists',ic:'👩‍🚀',fuel:70,cr:600,d:'8 colonists (needs beds)'}};
function callSuggest(st){const free=st.house-S.cols.length;if(S.mat<200)return'mat';if((S.lvl||1)>=14&&(S.parts||0)<40)return'parts';if(free>=8&&S.hap>60)return'crew';return S.mat<600?'mat':'parts';}
function callEarth(b,k){const c=CALLS[k];if(b.call){toast('A ship is already on its way to this pad',1);return;}if((b.cool||0)>S.t){toast(`Launch window closed — next in ${Math.ceil(b.cool-S.t)}s`,1);return;}
 if(S.fuel<c.fuel){toast(`Needs ${c.fuel} ⛽ to book the flight`,1);return;}if(!afford(c.cr,0))return;S.fuel-=c.fuel;pay(c.cr,0);b.call={k,due:S.t+45};b.cool=S.t+240;toast(`📞 Earth confirmed: a ${c.n} ship launches for ${b.name} — ETA ~45s`,1);beep(880,.08,'triangle',.06);}
function settleHTML(b){const L=[];
 if(b.t==='garage'){const rs=S.rovers.filter(r=>r.g===b.id||(!garageOf(r)||garageOf(r)===b));const found=S.sites.filter(s=>s.found&&!s.surv);const sup=S.b.filter(q=>(q.t==='icefield'||q.t==='outpost')&&!(q.cons>0));
  L.push(`<div class="cargo"><b>🚙 Rovers (${rs.length}/${Math.min(4,1+b.lvl)})</b>${rs.map(r=>`<div class="crow"><span><b>${r.name}</b> · ${r.st==='home'?'parked':r.st==='work'?'working on site':r.st==='out'?'driving out':'returning'}</span><button data-x="ren" data-r="${r.id}">✏️</button>${r.st==='home'?`<button data-x="scout" data-r="${r.id}">📡 Scout</button>${S.lvl>=13&&found.length?`<button data-x="survey" data-r="${r.id}">🧭 Survey</button>`:''}${sup.length?`<button data-x="supply" data-r="${r.id}">📦 Supply</button>`:''}`:''}</div>`).join('')||'<div class="sub">No rovers yet</div>'}
  <button data-x="rover">🔧 Assemble rover — ¢400 🧱80</button>${sup.length?`<label class="sub"><input type="checkbox" data-x="auto" ${b.auto?'checked':''}> 🔁 Auto-repeat supply runs</label>`:''}
  <div class="sub">Sites: ${S.sites.filter(s=>s.found).length} found · ${S.sites.filter(s=>s.surv).length} surveyed · ${S.sites.filter(s=>!s.found).length} still hidden in the fog</div></div>`);}
 if(b.t==='lab'||(b.t==='hab'&&b.spec==='science')||b.t==='school'){L.push(`<div class="cargo"><b>🔬 Research — ${Math.floor(S.rp)} pts</b> <span class="sub">(+${(S.rpRate||0).toFixed(2)}/s)</span>${Object.entries(TECH).map(([k,t])=>`<div class="crow"><span>${T(k)?'✅':'⬜'} <b>${t.n}</b><br><span class="sub">${t.d}</span></span>${T(k)?'':`<button data-x="tech" data-k="${k}" ${S.rp>=t.c?'':'disabled'}>🔬 ${t.c}</button>`}</div>`).join('')}</div>`);}
 if(b.t==='lpad'){const sg=callSuggest(lastSt||stats());L.push(`<div class="cargo"><b>📞 Call Earth</b><div class="sub">${b.call?`🚀 ${CALLS[b.call.k].n} ship ${S.t<b.call.due?`launching — lands in ~${Math.ceil(b.call.due-S.t)}s`:'on approach'}`:(b.cool||0)>S.t?`Next launch window in ${Math.ceil(b.cool-S.t)}s`:'Launch window open'}</div>
  ${Object.entries(CALLS).map(([k,c])=>`<div class="crow"><span>${c.ic} <b>${c.n}</b>${k===sg?' <span style="color:#7f7">★ suggested</span>':''}<br><span class="sub">${c.d} · ⛽${c.fuel} ¢${c.cr}</span></span><button data-x="call" data-k="${k}" ${b.call||(b.cool||0)>S.t?'disabled':''}>Request</button></div>`).join('')}</div>`);}
 if(b.t==='icefield')L.push(`<div>❄️ Ice stockpile: <b>${Math.floor(b.stock||0)}</b> / ${200*LV[b.lvl-1]} — send a rover on a 📦 Supply run from the garage</div>`);
 if(SELFP[b.t]&&b.hbCap)L.push(`<div>☀️🔋 Built-in roof solar +${(b.gen||0).toFixed(1)} · battery ${Math.round((b.hb||0)/b.hbCap*100)}% <span class="sub">(powers itself — main grid stays free)</span></div>`);
 if(b.t==='hab'&&(S.lvl||1)>=11){if(!b.spec&&b.lvl>=2)L.push(`<div class="cargo"><b>Specialize this habitat</b> <span class="sub">(¢150, permanent)</span>
  <div class="crow"><span>👨‍👩‍👧 <b>Family Hab</b><br><span class="sub">+happiness, more babies</span></span><button data-x="spec" data-k="family">Pick</button></div>
  <div class="crow"><span>🛏️ <b>Worker Barracks</b><br><span class="sub">+50% beds, less comfort</span></span><button data-x="spec" data-k="barracks">Pick</button></div>
  <div class="crow"><span>🔭 <b>Science Quarters</b><br><span class="sub">fewer beds, +research</span></span><button data-x="spec" data-k="science">Pick</button></div></div>`);
  else if(!b.spec)L.push('<div class="sub">Upgrade to L2 to specialize (Family / Barracks / Science)</div>');else L.push(`<div>Specialization: <b>${{family:'👨‍👩‍👧 Family Hab',barracks:'🛏️ Worker Barracks',science:'🔭 Science Quarters'}[b.spec]}</b></div>`);}
 return L.join('');}
function settleAct(b,el){const x=el.dataset.x,r=S.rovers.find(q=>q.id===+el.dataset.r);
 if(x==='rover')buildRover(b);else if(x==='ren'&&r){const n=prompt('Name this rover',r.name);if(n&&n.trim())r.name=n.trim().slice(0,24);}
 else if(x==='scout'&&r)sendRover(r,'scout');else if(x==='survey'&&r){const g=garageOf(r);const s=S.sites.filter(q=>q.found&&!q.surv).sort((a,c)=>Math.hypot(a.x-g.x,a.z-g.z)-Math.hypot(c.x-g.x,c.z-g.z))[0];sendRover(r,'survey',s);}
 else if(x==='supply'&&r){const sup=S.b.filter(q=>(q.t==='icefield'||q.t==='outpost')&&!(q.cons>0)).sort((a,c)=>(a.t==='icefield'?-(a.stock||0):0)-(c.t==='icefield'?-(c.stock||0):0));const q=sup[0];if(q)sendRover(r,'supply',{x:q.x+.5,z:q.z+.5,bid:q.id,id:null});}
 else if(x==='auto'){b.auto=el.checked;}
 else if(x==='tech'){const t=TECH[el.dataset.k];if(t&&S.rp>=t.c&&!T(el.dataset.k)){S.rp-=t.c;S.tech[el.dataset.k]=1;S.techN=(S.techN||0)+1;toast(`🔬 Breakthrough: ${t.n} — ${t.d}`,1);beep(988,.1,'triangle',.06);menu();}}
 else if(x==='call')callEarth(b,el.dataset.k);
 else if(x==='spec'){if(!afford(150,0))return;pay(150,0);b.spec=el.dataset.k;placeObj(b);assign();toast(`🏠 ${b.name} is now a ${{family:'Family Hab',barracks:'Worker Barracks',science:'Science Quarters'}[b.spec]}`);beep(660,.08,'triangle',.06);}
 renderPanel(true);}
// ---------- v14 building models
const GLS=new THREE.MeshStandardMaterial({color:0xa8dcff,transparent:true,opacity:.26,roughness:.06,metalness:.2,depthWrite:false,envMap:SENV,envMapIntensity:1.1});
const ALG=new THREE.MeshStandardMaterial({color:0x2f9a4a,emissive:0x0e4a1c,emissiveIntensity:.6,transparent:true,opacity:.85,roughness:.2});
const WAT=new THREE.MeshStandardMaterial({color:0x1d5f7a,roughness:.08,metalness:.3,envMap:SENV,envMapIntensity:1});
function gdomeAt(g,x,z,r,n){g.add(mesh(cyl(r*1.02,r*1.04,.06,28),MAT.steel,x,.03,z));plants(g,x,z,r*.75,n,.12);const d=mesh(dome(r,22),GLS,x,.06,z,false);d.renderOrder=2;g.add(d);
 const fr=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(r,1)),new THREE.LineBasicMaterial({color:0xdfe6ea,transparent:true,opacity:.55}));fr.position.set(x,.06,z);fr.scale.y=1;const cl=new THREE.Plane(new THREE.Vector3(0,1,0),-.06);g.add(fr);
 g.add(mesh(torus(r*1.01,.015,28),MAT.dark,x,.07,z,false));}
const STONE=new THREE.MeshStandardMaterial({color:0x4a4442,roughness:.85,metalness:.05});
const NEWM={
 antenna:L=>{const g=new THREE.Group();for(let i=0;i<3;i++){const a=i*2.09,l=mesh(cyl(.012,.012,.5,5),MAT.steel,.5+Math.cos(a)*.12,.22,.5+Math.sin(a)*.12);l.rotation.set(Math.sin(a)*.25,0,-Math.cos(a)*.25);g.add(l);}
  g.add(mesh(cyl(.018,.022,1.7,6),MAT.steel,.5,.85,.5));for(let k=0;k<4;k++)g.add(mesh(cyl(.006,.006,.3-k*.05,4).rotateZ(Math.PI/2),MAT.steel,.5,1.1+k*.15,.5,false));
  const d=new THREE.Group();d.position.set(.5,1.72,.5);d.name='spin';const dish=mesh(new THREE.SphereGeometry(.14,12,6,0,6.3,0,.9),MAT.white,0,0,.06);dish.rotation.x=1.3;d.add(dish);g.add(d);
  g.add(mesh(new THREE.SphereGeometry(.03,8,6),beaconMat,.5,1.72+.2,.5,false));return g;},
 crates:L=>{const g=new THREE.Group(),cm=[M(0x9a6a3a,.85),M(0xd98a2a,.7),M(0x5d7a80,.7)];[[.32,.32,.36,0],[.68,.34,.32,1],[.42,.68,.3,2],[.38,.36,.28,1,.36]].forEach(([x,z,w,c,y])=>{const b=mesh(rbox(w,w*.8,w,.02),cm[c],x,(y||0)+w*.4,z);b.rotation.y=x*3;g.add(b);g.add(mesh(new THREE.BoxGeometry(w*1.02,.02,w*.12),MAT.dark,x,(y||0)+w*.4,z,false).rotateY(x*3));});return g;},
 rockg:L=>{const g=new THREE.Group();g.add(mesh(cyl(.46,.46,.02,24),M(0xd8a888,.95),.5,.01,.5,false));for(let i=0;i<5;i++)g.add(mesh(torus(.12+i*.07,.006,24),M(0xb88262,.95),.5,.025,.5,false));
  const rc=[0x3a3432,0x8a4428,0x6c2e2c,0x9c8f8a];for(let i=0;i<7;i++){const a=i*.9,r=i?.22+(i%3)*.08:0,sz=i?.05+(i%3)*.025:.13;const m=mesh(new THREE.DodecahedronGeometry(sz,0),M(rc[i%4],.9),.5+Math.cos(a)*r,sz*.6,.5+Math.sin(a)*r);m.scale.y=.7;g.add(m);}return g;},
 bannr:L=>{const g=new THREE.Group();g.add(mesh(cyl(.02,.025,1.3,6),MAT.steel,.3,.65,.5));g.add(mesh(cyl(.008,.008,.42,4).rotateZ(Math.PI/2),MAT.steel,.51,1.28,.5,false));
  const c=document.createElement('canvas');c.width=32;c.height=64;const x=c.getContext('2d');x.fillStyle='#e8701a';x.fillRect(0,0,32,64);x.fillStyle='#1f8a8a';x.fillRect(0,22,32,20);x.fillStyle='#fff';x.beginPath();x.arc(16,32,6,0,6.3);x.fill();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  const cl=new THREE.Group();cl.position.set(.31,1.27,.5);cl.name='cloth';const bn=mesh(new THREE.PlaneGeometry(.38,.7),new THREE.MeshStandardMaterial({map:t,side:THREE.DoubleSide,roughness:.8}),.2,-.36,0,false);cl.add(bn);g.add(cl);return g;},
 statue:L=>{const g=new THREE.Group();g.add(mesh(rbox(.5,.3,.5,.03),M(0x8a8582,.8),.5,.15,.5));g.add(mesh(new THREE.BoxGeometry(.3,.06,.01),MAT.yellow,.5,.17,.755,false));
  const a=astro(3);a.traverse(m=>{if(m.isMesh)m.material=STONE;});a.scale.setScalar(2.1);a.position.set(.5,.3,.5);g.add(a);const fl=mesh(cyl(.008,.008,.5,4),STONE,.66,.8,.5);g.add(fl);return g;},
 obelisk:L=>{const g=new THREE.Group();g.add(mesh(rbox(.56,.08,.56,.02),M(0x8a8582,.8),.5,.04,.5));g.add(mesh(new THREE.CylinderGeometry(.08,.15,1.5,4,1).rotateY(Math.PI/4),STONE,.5,.83,.5));
  g.add(mesh(new THREE.ConeGeometry(.08*1.414/1.414,.14,4).rotateY(Math.PI/4),MAT.yellow,.5,1.65,.5));g.add(mesh(new THREE.BoxGeometry(.14,.1,.01),MAT.yellow,.5,.35,.5+.13,false));return g;},
 hydro:L=>{const g=new THREE.Group(),H=.55+.14*L;g.add(mesh(cyl(.3,.32,.05,18),MAT.steel,.5,.025,.5));const t=new THREE.Group();t.position.set(.5,0,.5);t.name='spin';
  for(let i=0;i<Math.round(H/.12);i++){t.add(mesh(cyl(.22,.22,.04,14),MAT.white,0,.1+i*.12,0,false));t.add(mesh(cyl(.235,.235,.035,14),MAT.green,0,.135+i*.12,0,false));}g.add(t);
  g.add(mesh(cyl(.27,.27,H,18,1,true),GLS,.5,H/2+.05,.5,false));g.add(mesh(cyl(.28,.28,.05,18),winMat,.5,H+.07,.5,false));g.add(mesh(dome(.27,16),MAT.white,.5,H+.09,.5));return g;},
 algae:L=>{const g=new THREE.Group(),n=Math.min(4,1+L);g.add(mesh(rbox(.9,.05,.9,.02),MAT.concrete,.5,.025,.5,false));
  for(let i=0;i<n;i++){const x=n<3?.3+i*.4:.3+(i%2)*.4,z=n<3?.5:.3+(i>>1)*.4,h=.36+.05*L;g.add(mesh(cyl(.14,.14,h,14,1,true),GLS,x,h/2+.05,z,false));g.add(mesh(cyl(.125,.125,h*.9,14),ALG,x,h*.45+.05,z,false));g.add(mesh(dome(.14,12),MAT.steel,x,h+.05,z));}
  g.add(mesh(cyl(.02,.02,.8,6).rotateZ(Math.PI/2),MAT.steel,.5,.12,.08,false));return g;},
 insect:L=>{const g=new THREE.Group();const mods=L>=3?2:1;for(let i=0;i<mods;i++){const z=mods>1?.28+i*.44:.5,w=mods>1?.38:.6;g.add(mesh(rbox(.86,.32,w,.05),M(0xd9d2c4,.7),.5,.16,z));
   for(let k=0;k<5;k++)g.add(mesh(new THREE.BoxGeometry(.02,.03,w*.95),MAT.dark,.18+k*.16,.33,z,false));g.add(mesh(new THREE.BoxGeometry(.14,.05,.02),winMat,.5,.2,z+w/2+.005,false));}
  g.add(mesh(cyl(.05,.05,.2,10),MAT.steel,.85,.42,.5));const sp=mesh(new THREE.TorusGeometry(.05,.012,4,10).rotateX(Math.PI/2),MAT.dark,.85,.53,.5,false);sp.name='spin';g.add(sp);return g;},
 aqua:L=>{const g=new THREE.Group(),n=Math.min(4,1+Math.ceil(L/2));for(let i=0;i<n;i++){const x=.5+(i%2)*.75,z=.5+(i>>1)*.75;g.add(mesh(cyl(.3,.3,.32,22,1,true),MAT.white,x,.16,z));g.add(mesh(new THREE.CircleGeometry(.29,22).rotateX(-Math.PI/2),WAT,x,.29,z,false));g.add(mesh(torus(.3,.018,22),MAT.steel,x,.32,z,false));}
  g.add(mesh(rbox(.5,.16,1.4,.03),MAT.soil,1.7,.08,1,false));plants(g,1.7,1,.22,10,.12);const gh=mesh(new THREE.CylinderGeometry(.28,.28,1.45,16,1,true,0,Math.PI).rotateX(Math.PI/2),GLS,1.7,.12,1,false);gh.rotation.z=0;gh.rotation.x=0;g.add(gh);return g;},
 gdome:L=>{const g=new THREE.Group();gdomeAt(g,1,1,.62+.06*L,10+3*L);g.add(mesh(rbox(.3,.22,.24,.03),MAT.white,1,.11,1.8));if(L>=3){gdomeAt(g,.3,1.72,.24,4);}if(L>=5)gdomeAt(g,1.72,.3,.24,4);return g;},
 bigdome:L=>{const g=new THREE.Group();gdomeAt(g,1.5,1.5,1.05+.07*L,26+5*L);for(let i=0;i<Math.min(4,L);i++){const a=i*Math.PI/2+.78,x=1.5+Math.cos(a)*1.35,z=1.5+Math.sin(a)*1.35;g.add(mesh(rbox(.26,.22,.26,.03),MAT.white,x,.11,z));g.add(mesh(new THREE.BoxGeometry(.12,.06,.02),winMat,x,.15,z+.135,false));}
  g.add(mesh(cyl(.02,.02,.5,6),MAT.white,1.5,1.2+.07*L+.2,1.5));return g;},
 complex:L=>{const g=new THREE.Group(),H=.9+.25*(L-1);g.add(mesh(rbox(2.8,.08,2.8,.03),MAT.concrete,1.5,.04,1.5,false));
  g.add(mesh(cyl(.42,.46,H,24),MAT.white,1.5,H/2,1.5));for(let k=1;k<H/.2;k++)g.add(mesh(torus(.44,.012,24),winMat,1.5,k*.2,1.5,false));g.add(mesh(dome(.42,20),MAT.white,1.5,H,1.5));
  const wings=Math.min(4,1+L);for(let i=0;i<wings;i++){const a=i*Math.PI/2,x=1.5+Math.cos(a)*.95,z=1.5+Math.sin(a)*.95,h=.45+.08*L;const w=mesh(rbox(.62,h,.62,.08),MAT.white,x,h/2,z);g.add(w);
   g.add(mesh(new THREE.BoxGeometry(.5,.05,.64),winMat,x,h*.6,z,false));g.add(mesh(new THREE.BoxGeometry(.64,.05,.5),winMat,x,h*.6,z,false));g.add(mesh(cyl(.07,.07,.4,10).rotateZ(Math.PI/2).rotateY(-a),MAT.steel,1.5+Math.cos(a)*.55,.12,1.5+Math.sin(a)*.55));}
  if(L>=3)for(const[x,z]of[[.4,.4],[2.6,2.6]])habDome(g,x,z,.3);return g;},
 arco:L=>{const g=new THREE.Group();g.add(mesh(rbox(3.8,.1,3.8,.04),MAT.concrete,2,.05,2,false));const tiers=1+Math.ceil(L/2);let y=.1;
  for(let i=0;i<tiers;i++){const w=3.4-i*.62,h=.42;g.add(mesh(rbox(w,h,w,.1),MAT.white,2,y+h/2,2));for(const sd of[-1,1]){g.add(mesh(new THREE.BoxGeometry(w*.9,.07,.02),winMat,2,y+h*.55,2+sd*(w/2+.005),false));g.add(mesh(new THREE.BoxGeometry(.02,.07,w*.9),winMat,2+sd*(w/2+.005),y+h*.55,2,false));}
   plants(g,2,2+w/2-.12,.08,0);y+=h;if(i<tiers-1)for(let k=0;k<6;k++)g.add(mesh(new THREE.SphereGeometry(.07,6,5),MAT.green,2-w/2+.15+k*(w-.3)/5,y+.04,2+w/2-.12,false));}
  const tH=.8+.35*L;g.add(mesh(cyl(.28,.36,tH,22),MAT.white,2,y+tH/2,2));for(let k=1;k<tH/.18;k++)g.add(mesh(torus(.3,.01,22),winMat,2,y+k*.18,2,false));g.add(mesh(dome(.29,18),GLS,2,y+tH,2,false));g.add(mesh(cyl(.012,.012,.5,6),MAT.dark,2,y+tH+.4,2));return g;},
 garage:L=>{const g=new THREE.Group();g.add(mesh(rbox(1.5,.5,1.1,.06),MAT.white,.9,.25,1));g.add(mesh(new THREE.CylinderGeometry(.55,.55,1.5,20,1,false,0,Math.PI).rotateZ(Math.PI/2).rotateY(Math.PI/2),MAT.white,.9,.5,1));
  g.add(mesh(new THREE.BoxGeometry(.06,.42,.8),MAT.dark,1.66,.21,1,false));for(let i=0;i<4;i++)g.add(mesh(new THREE.BoxGeometry(.02,.4,.8),MAT.steel,1.68,.22,1,false).translateY(0));g.add(mesh(new THREE.BoxGeometry(.5,.03,.9),MAT.yellow,1.95,.02,1,false));
  g.add(mesh(cyl(.01,.01,.5,6),MAT.dark,.4,1.25,.7,false));g.add(mesh(torus(.56,.02,24),winMat,.9,.5,1,false).rotateZ(Math.PI/2));return g;},
 lab:L=>{const g=new THREE.Group();habDome(g,.8,.9,.55);g.add(mesh(rbox(.6,.4,.5,.05),MAT.white,1.45,.2,1.35));g.add(mesh(torus(.31,.02,20),winMat,1.45,.28,1.35,false));
  const dish=mesh(new THREE.SphereGeometry(.28,16,8,0,Math.PI*2,0,1.1),MAT.white,1.5,1.0,.45);dish.rotation.x=-.9;g.add(dish);g.add(mesh(cyl(.03,.04,.8,8),MAT.steel,1.5,.4,.45));
  g.add(mesh(new THREE.SphereGeometry(.04,8,6),MAT.red,.8,.62,.9,false));return g;},
 lpad:L=>{const g=new THREE.Group();g.add(mesh(cyl(.95,1,.12,32),MAT.concrete,1,.04,1));g.add(mesh(torus(.7,.035,32),MAT.yellow,1,.11,1,false));g.add(mesh(torus(.45,.02,32),M(0xff6b35),1,.11,1,false));
  g.add(mesh(new THREE.BoxGeometry(.14,2.2,.14),MAT.steel,1.82,1.1,.25));for(let i=1;i<6;i++)g.add(mesh(new THREE.BoxGeometry(.18,.02,.18),MAT.dark,1.82,i*.38,.25,false));g.add(mesh(new THREE.BoxGeometry(.5,.05,.06),MAT.steel,1.6,1.8,.3,false));
  g.add(mesh(new THREE.SphereGeometry(.16,14,10),MAT.white,.2,.16,1.8));g.add(mesh(new THREE.SphereGeometry(.16,14,10),MAT.white,.5,.16,1.85));return g;},
 factory:L=>{const g=new THREE.Group();g.add(mesh(rbox(1.6,.55,1.1,.04),M(0xb8b2a8,.6,.2),1,.28,1.1));g.add(mesh(rbox(1.6,.08,1.15,.02),M(0xe77d11,.5),1,.58,1.1));
  for(const x of[.5,1.5]){g.add(mesh(cyl(.08,.1,.7,10),MAT.steel,x,.9,.7));const st=mesh(new THREE.SphereGeometry(.13,10,8),new THREE.MeshBasicMaterial({color:0xf0e6dc,transparent:true,opacity:.55}),x,1.35,.7,false);st.name='steam';g.add(st);}
  g.add(mesh(new THREE.BoxGeometry(1.7,.05,.18),MAT.dark,1,.03,.3,false));for(let i=0;i<5;i++)g.add(mesh(new THREE.BoxGeometry(.12,.1,.12),M(0xd2a679),.3+i*.35,.1,.3));return g;},
 medc:L=>{const g=new THREE.Group();g.add(mesh(cyl(.72,.75,.5,28),MAT.white,1,.25,1));g.add(mesh(dome(.72,28),MAT.white,1,.5,1));g.add(mesh(torus(.73,.03,28),winMat,1,.32,1,false));
  g.add(mesh(rbox(.42,.06,.12,.02),MAT.red,1,1.3,1,false));g.add(mesh(rbox(.12,.06,.42,.02),MAT.red,1,1.3,1,false));g.add(mesh(rbox(.5,.3,.3,.04),MAT.white,1.6,.15,1.65));return g;},
 school:L=>{const g=new THREE.Group();g.add(mesh(rbox(.8,.35,.6,.05),MAT.white,.5,.18,.5));const rf=mesh(new THREE.CylinderGeometry(.34,.34,.82,3,1).rotateZ(Math.PI/2),M(0xffd166,.5),.5,.45,.5);rf.rotation.x=Math.PI/6;g.add(rf);
  g.add(mesh(new THREE.BoxGeometry(.6,.06,.02),winMat,.5,.22,.81,false));g.add(mesh(cyl(.01,.01,.6,5),MAT.steel,.88,.3,.12,false));g.add(mesh(new THREE.BoxGeometry(.18,.1,.01),M(0x3fa9ff),.97,.55,.12,false));return g;},
 drill:L=>{const g=new THREE.Group();g.add(mesh(cyl(.8,.85,.12,24),MAT.concrete,1,.06,1));const H=2.2+.3*L;for(let i=0;i<4;i++){const a=i*Math.PI/2+.785,l=mesh(cyl(.03,.04,H*1.02,6),M(0xe77d11,.5,.4),1+Math.cos(a)*.3,H/2,1+Math.sin(a)*.3);l.rotation.set(Math.sin(a)*.12,0,-Math.cos(a)*.12);g.add(l);}
  for(let k=1;k<5;k++)g.add(mesh(torus(.5-.08*k,.015,4),MAT.steel,1,k*H/5,1,false));const d=mesh(cyl(.06,.06,H*.9,8),MAT.dark,1,H*.45,1);d.name='spin';g.add(d);g.add(mesh(rbox(.35,.3,.3,.03),MAT.white,1,H,1));
  g.add(mesh(new THREE.ConeGeometry(.35,.3,10),M(0x8a5a3a),1.6,.15,1.55));return g;},
 icefield:L=>{const g=new THREE.Group();for(const[x,z]of[[.5,.5],[1.5,.5],[.5,1.5]]){g.add(mesh(new THREE.SphereGeometry(.28,16,12),M(0x9ad8ff,.3,.2),x,.3,z));g.add(mesh(torus(.29,.015,20),MAT.steel,x,.3,z,false));}
  g.add(mesh(cyl(.05,.07,1.6,8),MAT.steel,1.4,.8,1.4));const d=mesh(cyl(.04,.04,1.2,8),MAT.dark,1.4,.6,1.4);d.name='spin';g.add(d);g.add(mesh(new THREE.BoxGeometry(.3,.25,.3),MAT.blue,1.4,1.6,1.4));return g;},
 kilo:L=>{const g=new THREE.Group();g.add(mesh(cyl(.13,.15,.55,16),M(0x888c94,.4,.7),.5,.3,.5));g.add(mesh(dome(.13,14),M(0x888c94,.4,.7),.5,.58,.5));
  for(let i=0;i<8;i++){const a=i/8*6.283,f=mesh(new THREE.BoxGeometry(.02,.5,.26),MAT.white,.5+Math.cos(a)*.27,.35,.5+Math.sin(a)*.27);f.rotation.y=-a;g.add(f);}
  g.add(mesh(torus(.15,.025,16),new THREE.MeshStandardMaterial({color:0x40e0ff,emissive:0x40e0ff,emissiveIntensity:1.6}),.5,.45,.5,false));g.add(mesh(cyl(.42,.44,.04,24),MAT.concrete,.5,.02,.5,false));return g;},
 outpost:L=>{const g=new THREE.Group();habDome(g,.8,.8,.42);habDome(g,1.4,1.3,.28);g.add(mesh(new THREE.CylinderGeometry(.06,.06,.5,10).rotateZ(Math.PI/2).rotateY(-.7),MAT.white,1.1,.08,1.05));
  const p=mesh(rbox(.6,.03,.35,.01),MAT.panel,1.4,.35,.4);p.rotation.x=-.5;g.add(p);g.add(mesh(cyl(.01,.01,.9,5),MAT.dark,.4,.7,1.5,false));const bl=mesh(new THREE.SphereGeometry(.05,8,6),new THREE.MeshStandardMaterial({color:0x6fe08a,emissive:0x6fe08a,emissiveIntensity:2}),.4,1.17,1.5,false);bl.name='blink';g.add(bl);return g;}
};
function specParts(g,spec){if(spec==='family'){g.add(mesh(dome(.14,14),glass,.18,0,.82,false));g.add(mesh(cyl(.13,.13,.02,14),MAT.leaf,.18,.01,.82,false));
  for(const x of[.68,.92])g.add(mesh(cyl(.008,.008,.24,5),M(0xff6b35),x,.12,.86,false));g.add(mesh(new THREE.BoxGeometry(.26,.012,.012),M(0xff6b35),.8,.24,.86,false));g.add(mesh(new THREE.BoxGeometry(.05,.01,.04),M(0x3fa9ff),.8,.1,.86,false));}
 else if(spec==='barracks'){for(let i=0;i<2;i++)g.add(mesh(rbox(.34,.16,.2,.03),M(0x8fa3b8,.5,.3),.78,.08+i*.17,.16));g.add(mesh(new THREE.BoxGeometry(.3,.025,.01),winMat,.78,.1,.265,false));g.add(mesh(new THREE.BoxGeometry(.3,.025,.01),winMat,.78,.27,.265,false));}
 else if(spec==='science'){g.add(mesh(cyl(.02,.025,.4,6),MAT.steel,.15,.2,.15));const d=mesh(new THREE.SphereGeometry(.14,14,8,0,Math.PI*2,0,1.1),MAT.white,.15,.45,.15);d.rotation.x=-.8;g.add(d);
  g.add(mesh(dome(.13,14),M(0x2a2e38,.3,.6),.85,0,.85));g.add(mesh(new THREE.BoxGeometry(.03,.12,.2),MAT.yellow,.85,.08,.85,false));}
 const rc={family:0x6fe08a,barracks:0x8fa3b8,science:0x3ff3ff}[spec];if(rc)g.add(mesh(new THREE.TorusGeometry(.5,.02,6,32).rotateX(Math.PI/2),new THREE.MeshStandardMaterial({color:rc,emissive:rc,emissiveIntensity:.8}),.5,.03,.5,false));}

// ---------- level UI: HUD chip, checklist, celebration
let lvOpen=null;
function lvEl(){let e=document.getElementById('lvl');if(!e){e=document.createElement('div');e.id='lvl';$('ui').appendChild(e);e.onclick=ev=>{if(ev.target.closest('.lvh')){lvOpen=!lvOpen;S.lvOpen=lvOpen;renderLv(true);beep(700,.04,'triangle');}};}return e;}
let lvKey='';
function renderLv(force){if(!S||S.demo)return;const e=lvEl();if(lvOpen===null)lvOpen=S.lvOpen??innerWidth>700;const gs=lvGoals(),p=lvPct(gs),lv=S.lvl||1,L=LEVELS[lv];
 const done=lv>=LVMAX&&S.eraDone===LVMAX;const key=lv+'|'+lvOpen+'|'+gs.map(g=>g.v).join()+done;if(key===lvKey&&!force){lvPos();return;}lvKey=key;
 e.className=lvOpen?'open':'';document.body.classList.toggle('lvopen',!!lvOpen);
 e.innerHTML=`<div class="lvh"><span class="lvn">LV ${lv}</span><span class="lvt">${done?'Settlement charter granted':L.n}</span><span class="lvc">${gs.filter(g=>g.ok).length}/${gs.length} ${lvOpen?'▾':'▸'}</span></div><div class="lvbar"><i style="width:${done?100:p}%"></i></div>`+
 (lvOpen?`<div class="lvb">${gs.map(g=>`<div class="g${g.ok?' ok':''}"><span>${g.ok?'✅':'⬜'}</span><span class="gt">${g.t}</span><span class="gv">${g.need>1?`${g.v}/${g.need}`:''}</span></div>`).join('')}
 <div class="lvf">${done?'🏁 More eras coming: City → Terraforming':lv<LVMAX?`Next: <b>Lv ${lv+1} · ${LEVELS[lv+1].n}</b> — ${lvUnlockTxt(lv+1).join(', ')||'new challenges'}`:'Final Outpost level — complete it to finish the era'}</div></div>`:'');lvPos();}
function lvPos(){const e=document.getElementById('lvl');if(!e)return;const hb=$('hud').getBoundingClientRect().bottom;let top=hb+6;const ph=innerWidth<=700;
 if(!ph){const t=$('tut');if(t&&t.style.display==='block'){const r=t.getBoundingClientRect();top=Math.max(top,r.bottom+8);}}
 e.style.top=top+'px';document.documentElement.style.setProperty('--lvB',(top+e.offsetHeight+6)+'px');}
function lvChip(){const gs=lvGoals();return['⭐',`Lv ${S.lvl||1}<span class="lvpb"><i style="width:${S.eraDone===LVMAX&&(S.lvl||1)>=LVMAX?100:lvPct(gs)}%"></i></span>`];}
let confetti=null;
function celebrate(lv,era){S.lvlFx=1;const L=LEVELS[lv];let o=document.getElementById('lvup');if(!o){o=document.createElement('div');o.id='lvup';document.body.appendChild(o);}
 const un=era?[]:lvUnlockTxt(lv),nx=LEVELS[lv+1];
 o.innerHTML=`<canvas id="conf"></canvas><div class="card"><div class="k1">${era?'ERA COMPLETE!':ERAS.some(e=>e.from===lv&&lv>1)?'NEW ERA!':'LEVEL UP!'}</div><div class="big">${era?'🏁':'⭐'} ${era?'TOWN':'LV '+lv}</div><div class="nm">${era?`${S.name} is now a chartered town!`:(ERAS.find(e=>e.from===lv&&lv>1)?ERAS.find(e=>e.from===lv).n+' era · ':'')+L.n}</div>
 ${un.length?`<div class="un"><div class="h">UNLOCKED</div>${un.map(u=>`<div>${u}</div>`).join('')}</div>`:''}
 <div class="nx">${era?'Next era: <b>City</b> — coming soon':nx?`Next: <b>Lv ${lv+1} · ${nx.n}</b>`:`Final goal: complete <b>${L.n}</b>`}</div><button id="lvok">${era?'ONWARD':'CONTINUE'}</button></div>`;
 o.style.display='flex';const close=()=>{o.style.display='none';S.lvlFx=0;confetti=null;};$('lvok').onclick=close;clearTimeout(o._t);o._t=setTimeout(close,9000);
 [523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>beep(f,.14,'square',.05),i*110));setTimeout(()=>{beep(784,.5,'triangle',.06);beep(1047,.5,'triangle',.05);beep(1319,.6,'triangle',.04);},600);
 const c=$('conf'),x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;const C=['#c1440e','#e77d11','#fda600','#f6e3c5','#8a2a0c','#ffd166','#ff6b35'];
 const P=[...Array(innerWidth<700?110:190)].map(()=>({x:Math.random()*c.width,y:Math.random()*c.height*.75-c.height*.3,vx:(Math.random()-.5)*3,vy:2+Math.random()*3,r:Math.random()*6.3,vr:(Math.random()-.5)*.3,w:6+Math.random()*7,h:3+Math.random()*5,c:C[Math.random()*C.length|0]}));
 const tok={};confetti=tok;let n=0;const step=()=>{if(confetti!==tok||n++>420)return;x.clearRect(0,0,c.width,c.height);P.forEach(p=>{p.x+=p.vx+Math.sin(n*.05+p.r)*.6;p.y+=p.vy;p.vy=Math.min(p.vy+.03,5);p.r+=p.vr;
  x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.w/2,-p.h/2,p.w,p.h*Math.abs(Math.cos(p.r*2)));x.restore();});requestAnimationFrame(step);};step();}

const TUT=[
 {t:'Touchdown!',x:`Your first Starship just landed on untouched Martian soil with ${TUNE.START_CREW} crew, 2 Optimus robots and the start kit. Its onboard power runs the camp for now. Watch the cargo lift bring everyone down.`,done:()=>!S.crewPending&&S.tut.t>3},
 {t:'Home sweet dome',x:'Your crew is living in the cramped ship. Place your first 🏠 Habitat (4×4 tiles) near them from the Build tab — tap 🔄 or press R to rotate it first. One crew member suits up in hi-vis and builds it in about 30 seconds; every build needs builders and time.',k:'hab',done:()=>has('hab')},
 {t:'Paths are free',x:'Open the 🚶 Paths tab and drag a 🚶 Footpath (1 tile) or 🛣️ Road (2 tiles) from the ship to the habitat. Anything within 3 tiles of a path counts as connected.',k:'path',tab:'p',done:()=>S.b.some(b=>b.t==='hab'&&b.door)&&S.b.some(b=>b.t==='ship'&&b.door)},
 {t:'Hungry crew',x:'The ration packs won\'t last forever. Build a 🌱 Farm Dome next to your path.',k:'farm',done:()=>has('farm')},
 {t:'Thirsty plants',x:'Farms (and people) drink a lot. Dig an 🧊 Ice Extractor to melt subsurface ice into water.',k:'ice',done:()=>has('ice')},
 {t:'Grow the farm',x:'One small dome won\'t feed a colony. Tap your farm and press ⬆️ Upgrade to level 2.',arrow:'farm',done:()=>S.b.some(b=>b.t==='farm'&&b.lvl>=2)},
 {t:'Survive the night',x:'Build a 💧 Water Tank for storage, a ☀️ Solar Array, and a 🔋 Battery Farm — solar sleeps at night, batteries don\'t.',k:['wtank','solar','battery'],done:()=>has('wtank')&&has('solar')&&has('battery'),
  leave:()=>{S.mat+=150;S.cr+=300;toast('📦 The crew unpacked the last starter cargo: +150 🧱 +¢300');}},
];
function tutWants(k){if(!S||!S.tut)return false;const st=TUT[S.tut.step];if(!st||!st.k)return false;return Array.isArray(st.k)?st.k.includes(k)&&!has(k):st.k===k;}
const tutArrow=(()=>{const g=new THREE.Group();const c=mesh(new THREE.ConeGeometry(.22,.45,12),new THREE.MeshStandardMaterial({color:0xff3fa4,emissive:0xff3fa4,emissiveIntensity:.8}),0,0,0,false);c.rotation.x=Math.PI;g.add(c);g.scale.setScalar(4);g.visible=false;W.add(g);return g;})();
function tutTick(dt){const T=S.tut;T.t+=dt||.016;const st=TUT[T.step];if(!st){endTut();return;}
 if(st.done()){if(st.leave)st.leave();T.step++;T.t=0;beep(880,.08,'triangle',.06);setTimeout(()=>beep(1320,.1,'triangle',.06),90);const nx=TUT[T.step];if(!nx){endTut();return;}tab=nx.tab||'b';menu();renderTut();}}
function endTut(){S.tut=null;$('tut').style.display='none';tutArrow.visible=false;S.b.filter(b=>b.t==='pad').forEach(b=>b.timer=Math.min(b.timer,TUNE.FIRST_SHIP_AFTER));menu();
 if(!S.tutBonus){S.tutBonus=1;S.mat+=120;S.cr+=200;}toast(`🎉 Tutorial complete! Mission bonus +120 🧱 +¢200. Follow the ⭐ level checklist to grow your colony.`);toast('🏠 Build more Habitats — arriving crew only stay if there is room.');}
function renderTut(){const T=S&&S.tut,el=$('tut');if(!T||S.demo){el.style.display='none';tutArrow.visible=false;return;}const st=TUT[T.step];if(!st)return;el.style.display='block';
 const list=Array.isArray(st.k)?`<div class="tl">${st.k.map(k=>`${has(k)?'✅':'⬜'} ${B[k].ic} ${B[k].n}`).join(' &nbsp; ')}</div>`:'';
 const ks=[].concat(st.k||st.arrow||[]),bc0=S.b.find(b=>ks.includes(b.t)&&b.cons>0);const cn=bc0?`<p class="tl">🏗️ ${B[bc0.t].n} under construction — ${bc0._crew?'builders at work':'waiting for a free crew'}…</p>`:'';
 el.innerHTML=`<div class="tt">MISSION ${T.step+1}/${TUT.length}</div><b>${st.t}</b><p>${st.x}</p>${list}${cn}<button id="tutskip">Skip tutorial</button>`;$('tutskip').onclick=()=>{if(T.step<=6){S.mat+=150;S.cr+=300;}endTut();};
 const ab=st.arrow&&S.b.find(b=>b.t===st.arrow);tutArrow.visible=!!ab;if(ab){const c=bc(ab);tutArrow.position.set(c.x,6.4,c.z);tutArrow.userData.base=6.4;}}
// ---------- sim
let warnT=0,slow=0,lastSt=null;
function sim(dt){S.t+=dt;if(!S.demo){if(S.mat<45&&S.cr<350&&!S.flights.length){S.safeT=(S.safeT||0)+dt;if(S.safeT>45){S.safeT=-240;S.cr+=200;{const n=palletN(),sh=S.b.find(b=>b.t==='ship'&&!objs.get(b.id)?.userData.land);if(sh)startUnload({sid:sh.id,cx:sh.x+1,cz:sh.z+1,gy:0,items:[{k:'cargo',mat:n}]});else S.mat+=n;toast(`🆘 Emergency resupply: a ${n} 🧱 pallet is coming down the lift, +¢200. Tip: a ⛏️ Mine + 🏗️ Processor makes materials for free.`,1);}}}else if(S.safeT>0)S.safeT=0;}sunK=.08+.92*dayK(S.t);slow-=dt;if(slow<=0){slow=1;lvTick();if(lastSt)birthsTick(lastSt);agents.forEach(a=>a.m.scale.setScalar(a.c.kid?.5:.8));assign();calcDeco();syncTrucks();syncBots();}const st=stats(dt);lastSt=st;settleTick(dt,st);tickRovers(dt);S.food=Math.max(0,S.food+st.food*dt);S.wat=Math.min(st.wcap,Math.max(0,S.wat+st.wat*dt));S.fuel+=st.fuel*dt;
 S.b.forEach(b=>{const d=B[b.t],m=LV[b.lvl-1];if(b.cons>0){b.consT=(b.consT||0)+dt;b.cons-=dt*buildRate(b);const o=objs.get(b.id);if(o)o.scale.y=.25+.75*Math.max(0,1-b.cons/(b.consN||CONS_T));if(b.cons<=0)finishCons(b);return;}
  if(b.upT>0){b.upT-=dt*buildRate(b);if(b.upT<=0)finishUp(b);}
  const e=eff(b)*st.pe;if(d.ore&&!bots.length&&b.stock>1){const pr=S.b.find(q=>q.t==='proc'&&!(q.cons>0));if(pr){const n=Math.min(b.stock,dt*1.5);b.stock-=n;deliverOre(pr,n);}}if(d.ore){const capS=60*m*(b.t==='drill'?3:1);const dg=d.ore*m*e*(T('mine2')?1.4:1)*(b.rich||1)*(1+.35*Math.min(3,botsAt(b.id,'mine')))*dt;b.stock=(b.stock||0)+dg;S.oreDug=(S.oreDug||0)+dg;if(b.rareK)S.rare+=(b.t==='drill'?.06:.015)*m*e*b.rareK*dt;if(b.stock>capS){S.ore+=(b.stock-capS)*.5;b.stock=capS;}}
  if(d.conv){const c=Math.min(b.stock||0,d.conv*m*e*dt);b.stock=(b.stock||0)-c;S.mat+=c;S.made=(S.made||0)+c;}});
 const sol=Math.floor(S.t/DAY);if(sol!==S.lastSol){S.lastSol=sol;meteorCheck();S.mktPrev={...S.mkt};for(const k in S.mkt)S.mkt[k]=Math.max(.6,Math.min(1.6,S.mkt[k]*(1+(Math.random()-.5)*.3)+(1-S.mkt[k])*.1));}
 S.flights=S.flights.filter(f=>{if(S.t<f.t)return true;S.cr+=f.pay;S.flightsDone=(S.flightsDone||0)+1;S.tradeEarned=(S.tradeEarned||0)+f.pay;toast(`🌍 ${f.name} reached Earth — cargo & flight paid +¢${f.pay}`);floatText(`+¢${f.pay}`);beep(880,.12,'triangle',.07);setTimeout(()=>beep(1175,.15,'triangle',.07),110);return false;});
 if(S.tut){S.hap=Math.max(S.hap,75);tutTick(dt);}
 const pop=st.pop,hl=pop?S.cols.filter(c=>!c.home).length/pop:0,un=pop?S.cols.filter(c=>!c.work).length/pop:0,nc=pop?S.cols.filter(c=>{const h=c.home&&byId(c.home);return h&&!h.door;}).length/pop:0;
 let th=82-40*hl-15*un-12*nc;if(S.food<=0)th-=40;if(S.wat<=0)th-=40;if(st.pw<st.pu)th-=25;th-=20*(1-st.clean)+12*(1-st.health)+15*(1-st.safe);th+=12*st.fun+decoBonus+Math.min(10,S.b.filter(b=>b.spec==='family').length*1.5)-Math.min(8,S.b.filter(b=>b.spec==='barracks').length);
 S.hap+=(Math.max(0,Math.min(100,th))-S.hap)*dt*.08;const emp=pop-Math.round(un*pop);S.cr+=(emp*.35+(pop-emp)*.12)*(S.hap/100)*dt;
 warnT-=dt;if(!S.demo&&warnT<=0&&pop>0){const w=[];if(S.food<=0)w.push('food');if(S.wat<=0)w.push('water');if(st.pw<st.pu)w.push('power');if(w.length){toast('⚠️ Shortage: '+w.join(', ')+'!',1);warnT=12;}}
 const W=S.warned;if(!S.demo){if(pop>=15&&st.clean<.8&&!W.cl){W.cl=1;toast('♻️ The colony is getting messy — build Waste Management',1);}if(pop>=20&&st.health<.8&&!W.md){W.md=1;toast('🩺 Colonists need a Medical Bay',1);}
  if(pop>=60&&st.safe<.8&&!W.sc){W.sc=1;toast('🛡️ A growing colony needs a Security Outpost',1);}}
 if(!S.demo&&!S.tut&&S.hap<25&&pop>0&&Math.random()<dt*.05){const l=Math.min(pop,1+Math.floor(pop*.05));for(let i=0;i<l;i++){const k=Math.random()*S.cols.length|0;S.cols.splice(k,1);}toast(`😠 ${l} unhappy colonist(s) left on a ship home`,1);}
 S.b.forEach(b=>(b.t==='pad'||b.t==='lpad')&&shipTick(b,dt,st));return st;}
// ---------- day / night
function dayNight(){const t=S?S.t:0,p=dayPhase(t),k=dayK(t),D=TUNE.DAY_SPLIT;
 sun.intensity=.35+1.25*k;hemi.intensity=.42+.48*k;const sky=SKY_N.clone().lerp(SKY_DUSK,Math.min(1,k*2)).lerp(SKY_D,Math.max(0,k*2-1));
 if(k>.55){scene.background=skyTex;}else{if(!scene.background||!scene.background.isColor)scene.background=new THREE.Color();scene.background.copy(sky);}scene.fog.color.copy(sky);sun.color.setHex(0xfff0dd).lerp(new THREE.Color(0x9aa4d8),(1-k)*.7);
 const ang=p<D?(p/D)*Math.PI:Math.PI+(p-D)/(1-D)*Math.PI;const e=Math.sin(ang);SUNANG=ang;DAYK=k;
 const dir=new THREE.Vector3(Math.cos(ang)*.8,Math.max(.45,e)+.2,.45).normalize();sun.position.copy(tgt).multiplyScalar(CS).addScaledVector(dir,45);sun.target.position.copy(tgt).multiplyScalar(CS);
 const n=1-k;const sc=sun.shadow.camera,w=Math.min(60,zoom*2.2);if(sc.right!==w){sc.left=-w;sc.right=w;sc.top=w;sc.bottom=-w;sc.far=120;sc.updateProjectionMatrix();}
 glowMat.opacity=n*.85;poolMat.opacity=n*.4;lampMat.emissiveIntensity=.3+2.5*n;winMat.emissiveIntensity=.05+2.2*Math.min(1,n*1.6);}

// ---------- cinematic intro (once per new game)
let intro=null;
function startIntro(){intro={t:0,done:0};document.body.classList.add('intro');let sk=$('skipintro');if(!sk){sk=document.createElement('button');sk.id='skipintro';sk.textContent='Skip intro ⏭';document.body.appendChild(sk);}
 sk.style.display='';sk.onclick=e=>{e.stopPropagation();endIntro(true);};setTimeout(()=>{addEventListener('pointerdown',introTap,{once:true,capture:true});},400);}
function introTap(e){if(intro&&e.target.id!=='skipintro')endIntro(true);}
function endIntro(skip){if(!intro)return;if(skip){objs.forEach(o=>{const L=o.userData.land;if(L&&L.P===INTROL)L.t=Math.max(L.t,INTROL.T-.01);});}
 intro=null;document.body.classList.remove('intro');const sk=$('skipintro');if(sk)sk.style.display='none';removeEventListener('pointerdown',introTap,{capture:true});
 const p=S.b.find(b=>b.t==='ship');if(p){const c=bc(p);tgt.set(c.x,0,c.z);}zoom=7*(innerWidth<innerHeight?1.7:1);camUp();}
function tickIntro(rdt){if(!intro)return;intro.t+=rdt;const ships=S.b.filter(b=>b.t==='ship');const lead=ships[0],last=ships[ships.length-1];if(!lead){endIntro();return;}
 const L1=objs.get(lead.id).userData.land,L2=objs.get(last.id).userData.land;const ph=innerWidth<innerHeight?1.6:1;
 if(L1||L2){const sh=L1?lead:last,rk=objs.get(sh.id).getObjectByName('rk');const p=new THREE.Vector3();rk.getWorldPosition(p);p.multiplyScalar(1/CS);
  const alt=p.y*CS,zt=(alt>40?6.5:alt>12?7.5-(alt-12)/28:7.5)*ph;zoom+=(zt-zoom)*Math.min(1,rdt*1.6);
  if(!intro.s){intro.s=1;zoom=zt;}const ty=(L1?alt:Math.max(2,alt*.6))/CS;tgt.lerp(new THREE.Vector3(p.x,ty,p.z),Math.min(1,rdt*(intro.t<.3?60:9)));camUp();}
 else{intro.out=(intro.out||0)+rdt;const k=Math.min(1,intro.out/2.2),e=k*k*(3-2*k);const c0=bc(lead),c=new THREE.Vector3(c0.x,0,c0.z),zt=7*ph;
  tgt.lerp(c,e*.2+.02);zoom+=(zt-zoom)*(e*.25+.02);camUp();if(k>=1)endIntro();}}
// ---------- loop
let last=performance.now(),acc=0,saveT=0;
let loopErr=0;function loop(now){try{loopBody(now);}catch(e){if(loopErr++<3)console.error('frame error',e);}requestAnimationFrame(loop);}
function loopBody(now){const rdt=Math.min(.1,(now-last)/1000);last=now;
 if(Math.abs(rotT-rot)>.001){rot+=(rotT-rot)*Math.min(1,rdt*8);camUp();}
 const kp=8*zoom/14*rdt*40;if(!S||S.demo)keys.w=keys.a=keys.s=keys.d=0;if(keys.w||keys.arrowup)pan(0,-kp);if(keys.s||keys.arrowdown)pan(0,kp);if(keys.a||keys.arrowleft)pan(-kp,0);if(keys.d||keys.arrowright)pan(kp,0);
 if(S&&S.demo){rot+=rdt*.06;rotT=rot;camUp();}
 if(S){if(intro)tickIntro(rdt);const dt=rdt*(S.demo?1:(intro?1:speed));tickPuffs(dt);let st=dt?sim(dt):stats();if(S.demo){S.food=S.wat=50;S.hap=90;}
  acc+=rdt;if(acc>.5){frostSync();crewSync();hud(st);syncAgents();renderPanel();renderTut();acc=0;}if(doorsDirty){doorsDirty=false;refreshDoors();}if(pathsDirty)rebuildPaths();if(dt){tickAgents(dt);tickTrucks(dt);tickBots(dt);tickUnloads(dt);tickFlyers(dt);tickLandings(dt);tickMiners(dt);}if(tutArrow.visible)tutArrow.position.y=6.4+Math.abs(Math.sin(performance.now()/300))*1.4;
  if(follow){if(!follow.m.visible&&follow.st!=='walk'){}else{tgt.lerp(new THREE.Vector3(follow.m.position.x,0,follow.m.position.z),Math.min(1,rdt*4));camUp();}}
  const T=performance.now()/1000;objs.forEach(o=>{if(o.userData.grow!==undefined){o.userData.grow+=rdt*3;o.scale.y=Math.min(1,o.userData.grow);if(o.userData.grow>=1){o.scale.y=1;delete o.userData.grow;}}
   if(!speed&&!S.demo)return;let A=o.userData.anim;if(!A||A.n!==o.children.length){A=o.userData.anim={n:o.children.length,sp:o.getObjectByName('spin'),cl:o.getObjectByName('cloth'),stm:o.getObjectByName('steam'),fl:o.getObjectByName('flare'),trk:[],fan:[],gear:[]};o.traverse(c=>{if(A[c.name]&&Array.isArray(A[c.name]))A[c.name].push(c);});if(A.sp&&o.userData.bt&&/^(mine|ice|deep)/.test(o.userData.bt))A.bob=A.sp.position.y;}
   if(A.sp)A.sp.rotation.y+=rdt*2;if(A.cl)A.cl.rotation.y=Math.sin(T*3+o.id)*.25;if(A.stm)A.stm.scale.setScalar(1+.3*Math.sin(T*2));if(A.fl)A.fl.scale.y=.8+Math.random()*.5;if(A.bob!==undefined)A.sp.position.y=A.bob+Math.sin(T*3.2+o.id)*.06;for(const f of A.fan)f.rotation.y+=rdt*14;for(const g of A.gear)g.rotation.z+=rdt*2*g.userData.dir;if(A.trk.length){const tz=DAYK>.05?-Math.max(-.7,Math.min(.7,Math.cos(SUNANG)*.9)):0;for(const p of A.trk)p.rotation.z+=(tz-p.rotation.z)*Math.min(1,rdt*.8);}});
  beaconMat.color.setHex(Math.sin(T*3.5)>.6?0xff3a22:0x3a0805);flameFx(T);
  dayNight();}
 R.render(scene,window.__camOverride||cam);perfTick(rdt);}
let pfT=0,pfN=0,pfLow=0;function perfTick(dt){pfT+=dt;pfN++;if(pfT>4){const f=pfN/pfT;pfT=pfN=0;if(f<28&&pfLow<2){pfLow++;if(pfLow===1)R.setPixelRatio(1);else{sun.shadow.mapSize.set(1024,1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}}}}
// ---------- setup / title
function clearAll(){if(typeof intro!=='undefined'&&intro){intro=null;document.body.classList.remove('intro');const k=document.getElementById('skipintro');if(k)k.style.display='none';}objs.forEach(o=>rmObj(o));objs.clear();S&&S.b.forEach(b=>b.ship&&W.remove(b.ship.F||b.ship.m));agents.forEach(a=>W.remove(a.m));agents.clear();trucks.forEach(t=>W.remove(t.m));trucks=[];bots.forEach(t=>W.remove(t.m));bots=[];unloads.forEach(u=>W.remove(u.g));unloads=[];
 puffs.forEach(p=>W.remove(p));puffs=[];miners.forEach(q=>W.remove(q.m));miners=[];if(typeof rovObjs!=='undefined'){rovObjs.forEach(m=>W.remove(m));rovObjs.clear();siteObjs.forEach(m=>W.remove(m));siteObjs.clear();}document.body.classList.remove('storm');if(pathMesh){W.remove(pathMesh);pathMesh=null;}closePanel();}
function roadsLine(x0,z0,x1,z1,t){const f=v=>(v+24)*4+1;line({x:f(x0),z:f(z0)},{x:f(x1),z:f(z1)},(x,z)=>{for(let i=0;i<2;i++)for(let j=0;j<2;j++)S.tiles[TK(x+i,z+j)]=2;});}
function seedCols(n){for(let i=0;i<n;i++)newCol();assign();}
function demo(){clearAll();S=fresh();S.demo=1;S.truckIn=1;S.botsLanded=2;uid=1;cid=1;rebuildOcc();
 roadsLine(14,24,34,24,1);roadsLine(24,15,24,33,1);roadsLine(21,25,21,28,1);roadsLine(18,28,23,28,1);roadsLine(27,26,27,30,1);
 [['pad',20,22],['pad',28,25],['hab',22,23],['hab',22,25],['hab',25,23],['mega',30,22],['solar',16,23],['solar',17,23],['solar',16,25],['solar',17,25],['farm',19,25],['farm',20,25],['bigfarm',25,20],
  ['ice',23,27],['ice',25,27],['fuel',23,29],['refin',25,29],['ent',25,17],['reactor',21,19],['med',22,26],['mine',27,19],['mine',28,21],['proc',29,17],['wtank',23,19],['battery',18,23],['solar',16,21],['ship',30,26],['bench',20,27],['planter',22,27],['flag',23,22],['sign',26,25],['planter',19,23],['waste',26,31]
 ].forEach(([t,x,z])=>{x=(x+24)*4+(t==='mine'||t==='proc'?-1:0);z=(z+24)*4+(t==='mine'||t==='proc'?-1:0);rebuildOcc();if(free(t,x,z))addB(t,x,z,1);});
 S.b.filter(b=>b.t==='hab'||b.t==='mega').forEach(b=>b.lvl=b.t==='hab'?2:1);S.b.forEach(b=>placeObj(b));refreshDoors();seedCols(40);syncTrucks();syncAgents();
 agents.forEach(a=>a.wait=Math.random()*3);S.b.filter(b=>b.t==='pad').forEach((b,i)=>b.timer=1+i*8);S.b.filter(b=>b.t==='mine').forEach(b=>b.stock=30);S.t=DAY*.1;}
function migrate(d){if(d.v>=3){const sN=d.N||48,o=(N-sN)/2;if(o>0){d.b.forEach(b=>{b.x+=o;b.z+=o;});const t={};for(const k in d.tiles){const[x,z]=k.split(',').map(Number);t[TK(x+o,z+o)]=d.tiles[k];}d.tiles=t;d.grown=1;}return d;}const OO=(N-24)/2;const o=fresh(d.diff||'standard',d.name||'Olympus Base');Object.assign(o,{cr:d.cr+400,food:d.food,wat:d.wat,fuel:d.fuel,hap:d.hap,t:d.t*4});
 o.b=d.b.map(b=>({t:b.t,x:b.x+OO,z:b.z+OO,lvl:1,timer:b.timer}));o.migratedPop=d.pop||0;o.migrated=1;return o;}
function migrate4(d){if(d.v>=5)return d;const t={};for(const k in d.tiles||{})t[k]=1;d.tiles=t;const lamps=(d.b||[]).filter(b=>b.t==='lamp').length;
 d.b=(d.b||[]).filter(b=>B[b.t]&&b.t!=='lamp');d.mat=(d.mat||0)+300+d.b.length*6;d.ore=d.ore||0;d.rare=d.rare||0;d.bat=0;d.mkt={mat:1,ore:1,rare:1};d.mktPrev={...d.mkt};d.order=0;d.flights=[];d.tut=null;
 d.lastSol=Math.floor((d.t||0)/DAY);d.v=5;d.up4={lamps,roads:Object.keys(t).length};return d;}
function start(load,skipTut){saveBlocked=false;try{startInner(load,skipTut);askPersist();if(!load)lastSaved=0;saveUI();}catch(e){if(load){loadFail(e);}else throw e;}}
function startInner(load,skipTut){speed=1;{const p=document.querySelector('#ctl [data-s]');if(p){p.classList.remove('on');p.textContent='⏸';}}clearAll();uid=1;cid=1;const sv=load&&localStorage.getItem(SK);
 if(sv){const d=migrate4(migrate(JSON.parse(sv)));if(!(d.v>=6)){d.bots=[1,1];d.tf=d.tf||0;d.v=6;d.up6=1;}S={...fresh(),...d,b:[],demo:0};if(d.botsLanded===undefined)S.botsLanded=2;delete S.truckIn;if(d.ship2===undefined)S.ship2='done';S.ship2='done';if(d.lvl===undefined)S.lvl=null;S.unloadStarted=0;S.cols=d.cols||[];S.warned=d.warned||{};S.tiles=d.tiles||{};cid=S.cols.reduce((m,c)=>Math.max(m,c.id+1),1);rebuildOcc();
  d.b.forEach(b=>{rebuildOcc();if(!B[b.t])return;const nb=addB(b.t,b.x,b.z,1,b);['cons','consN','crewN','upT','upN','frostT','spec','hb','auto','call','cool','rich','siteId','rareK'].forEach(k=>{if(b[k]!=null)nb[k]=b[k];});if(nb.cons>0&&!nb.consN){const sp=buildSpec(nb.t,1);nb.consN=sp.T;nb.crewN=sp.n;nb.cons=Math.max(1,nb.cons/CONS_T*sp.T);}if(nb.upT>0)addScaf(objs.get(nb.id),nb);if(nb.spec)placeObj(nb);const o=objs.get(nb.id);if(nb.cons>0&&o){delete o.userData.grow;o.scale.y=.25+.75*Math.max(0,1-nb.cons/(nb.consN||CONS_T));addScaf(o,nb);}});if(d.migrated){seedCols(d.migratedPop);toast('🆕 Save upgraded! Your map grew — connect buildings with 🚶 paths',1);S.cr+=0;}
  else toast(d.grown?'🗺️ Your colony map is now 4× bigger — room to expand!':`Welcome back to ${S.name}, Commander`);
  if(d.up4)toast(`🆕 Big update! Roads became free paths, light poles were removed (buildings are lit now), and you got +${300+S.b.length*6} 🧱 materials`,1);S.mkt=S.mkt||{mat:1,ore:1,rare:1};S.mktPrev=S.mktPrev||{...S.mkt};S.flights=S.flights||[];if(d.up6)toast('🤖 Welcome to MARS! Two Optimus robots joined your colony — build an 🤖 Optimus Bay for more',1);}
 else{S=fresh(selDiff,($('cname').value||'').trim().slice(0,24)||'Olympus Base');rebuildOcc();S.t=DAY*.03;
  SHIP_SPOTS.slice(0,TUNE.START_SHIPS).forEach(([x,z],i)=>{const b=addB('ship',x,z,1);b.name=['Heart of Gold','Serenity','Red Dawn','Endurance','Tranquility'][i]||('Starship '+(i+1));objs.get(b.id).userData.land={t:-i*2.6,P:INTROL};});if(!S.demo)startIntro();
  S.crewPending=TUNE.START_CREW;if(skipTut){S.mat+=150;S.cr+=300;toast('Tutorial skipped — good luck, Commander!');}else{S.tut={step:0,t:0};}
  toast(`🚀 Starship inbound to ${S.name}…`);}
 if(!S.demo&&S.lvl==null){S.lvl=oldSaveLevel();lvSnap();if(S.lvl===2)queueWave();if(S.lvl>2)S.waveQueued=1;if(load)toast(`⭐ Colony levels are here! ${S.name} starts at Lv ${S.lvl} · ${LEVELS[S.lvl].n} — tap the ⭐ badge for goals`,1);}
 if(S.demo)S.lvl=LVMAX;initSettle();if(S.storm)stormFx(1);lvOpen=null;lvKey='';
 refreshDoors();assign();syncTrucks();lastLock='';sel=null;tab='b';menu();$('title').style.display='none';$('ui').style.display='';rot=rotT=0;{const p=S.b.find(b=>b.t==='pad')||S.b.find(b=>b.t==='ship');const c=p?bc(p):{x:N/2,z:N/2};tgt.set(c.x,0,c.z);}zoom=(load?9:7)*(innerWidth<innerHeight?1.7:1);camUp();renderTut();beep(600,.1,'triangle',.07);}
const NAMES=['Olympus Base','Red Rock Station','Valles Hub','Dusty Acres','Phobos View','Jezero Junction','Rusty Ridge','Crater Cove','Tharsis Town','Ares Landing','Hellas Haven','Elon Gulch'];
let selDiff='standard';
function showTitle(){$('ui').style.display='none';$('title').style.display='flex';$('cname').value=NAMES[Math.random()*NAMES.length|0];
 let sv=localStorage.getItem(SK),d0=null;try{d0=sv&&JSON.parse(sv);}catch(e){sv=null;}if(sv){const d=d0;const sol=d.v>=3?Math.floor(d.t/DAY+1):Math.floor(d.t/30+1);$('cont').style.display='';$('slotops').style.display='';$('cont').innerHTML=`Continue: <b>${d.name||'Colony'}</b><small>Sol ${sol} · ${d.cols?d.cols.length:d.pop} colonists · ${DIFF[d.diff||'standard'].n}${d.v>=3?'':' · will be upgraded'}</small>`;}else{$('cont').style.display='none';$('slotops').style.display='none';if((window.__pwa||{}).STAND){const m=$('loaderr');if(m&&!saveBlocked){m.style.display='block';m.innerHTML='📲 Welcome to the MARS app! Have a colony in Safari? Copy its save code there (💾 Saves), then tap <b>💾 Saves</b> below → <b>Paste &amp; import</b>.';}}}
 demo();zoom=8;tgt.set(49*4,0,48*4);camUp();}
document.querySelectorAll('#diff button').forEach(b=>b.onclick=()=>{selDiff=b.dataset.d;beep(700,.04);document.querySelectorAll('#diff button').forEach(x=>x.classList.toggle('on',x===b));});
$('reroll').onclick=()=>{$('cname').value=NAMES[Math.random()*NAMES.length|0];beep(800,.04);};
const muteUI=()=>{$('mute').textContent=$('mute2').textContent=muted?'🔇':'🔊';};
$('mute').onclick=$('mute2').onclick=()=>{muted=!muted;localStorage.setItem('marsMute',muted?'1':'0');muteUI();beep(700,.05);};muteUI();
$('howb').onclick=()=>{$('how').style.display=$('how').style.display==='block'?'none':'block';beep(700,.04);};
$('play').onclick=()=>{$('play').blur();const cur=slotInfo(SK);if(cur&&!cur.bad&&!saveBlocked){if(!confirm(`Start a NEW colony?\n\n"${cur.name}" (Sol ${cur.sol}, ${cur.pop} colonists) will be moved to a backup slot — you can restore it from 💾 Saves.`))return;}if(cur&&localStorage.getItem(SK)){try{localStorage.setItem('marsOutpost.old',localStorage.getItem(SK));}catch(e){}}start(false,$('skiptut').checked);};$('savesb').onclick=()=>openSaveBox(false);$('renb').onclick=()=>renameColony();$('delb').onclick=()=>deleteColony();$('cont').onclick=()=>start(true);
camUp();showTitle();requestAnimationFrame(loop);
Object.assign(window,{__S:()=>S,__cam:cam,__THREE:THREE,__agents:agents,__trucks:()=>trucks,__start:start,__sel:k=>{sel=k;menu();},__hgt:hgt,__zoom:(z,x,c)=>{zoom=z;tgt.set(x,0,c);camUp();}});

;(()=>{const l=document.getElementById('loading');if(!l)return;const bar=document.getElementById('lbar'),msg=document.getElementById('lmsg');const steps=['GENERATING TERRAIN...','FUELLING STARSHIPS...','WAKING CREW...','READY!'];let i=0;const iv=setInterval(()=>{i++;bar.style.width=(i/steps.length*100)+'%';msg.textContent=steps[Math.min(i,steps.length)-1];if(i>=steps.length){clearInterval(iv);setTimeout(()=>{l.style.opacity=0;setTimeout(()=>l.remove(),600);},250);}},220);})();
window.__flyers=typeof flyers!=='undefined'?flyers:null;window.__TUT=TUT;window.__tutTick=tutTick;
Object.defineProperty(window,'__S',{get:()=>S,configurable:true});window.__cam=cam;window.__THREE=THREE;Object.defineProperty(window,"__trucks",{get:()=>trucks});Object.defineProperty(window,"__agents",{get:()=>agents});window.__start=start;window.__addB=addB;window.__objs=objs;window.__launch=launchReturn;window.__save=save;window.__setZoom=z=>{zoom=z;camUp();};window.__tgt=tgt;window.__setSel=k=>{sel=k;};
window.__build=(k,x,z,r=0)=>{placeRot=r;const n0=S.b.length;sel=k;hover={x,z,bx:x,bz:z,p:new THREE.Vector3(x+.5,0,z+.5)};try{click();}finally{sel=null;hover=null;placeRot=0;updPrev();}return S.b.length>n0;};
window.__paint=(x0,z0,x1,z1)=>{sel='path';line({x:x0,z:z0},{x:x1,z:z1},(x,z)=>paint(x,z));sel=null;refreshDoors();};window.__upgrade=b=>upgrade(b);
window.__rot=v=>{rot=rotT=v;camUp();};window.__DAY=DAY;window.__rocket=rocket;window.__pose=pose;window.__landPose=landPose;window.__scene=scene;
{const _t=tip;tip=function(k,el){_t(k,el);clearTimeout(window._tt);window._tt=setTimeout(()=>{$('tip').style.display='none';},3500);};}
window.__B=B;

function dockSync(){const d=$('dock');if(!d)return;document.documentElement.style.setProperty('--dockH',d.offsetHeight+'px');}
addEventListener('resize',dockSync);setInterval(dockSync,500);
Object.defineProperty(window,"__bots",{get:()=>bots});window.__optimus=optimus;

window.__R=R;Object.defineProperty(window,'__unloads',{get:()=>unloads});
window.__inp={get stroke(){return stroke},get gest(){return gest},get last(){return lastStroke},undoStroke,get tab(){return tab},get sel(){return sel},get menuOpen(){return menuOpen}};window.__stats=()=>stats();window.__dlg={renameColony,deleteColony,deleteSlot};window.__bio={bioAt,BIO,bio2};window.__td={TD,tdecoSync,BOUL,mineBoulder,get miners(){return miners}};window.__set={meteorStrike,sendRover,buildRover,reveal,callEarth,saveData,slotInfo,openSaveBox,get saveBlocked(){return saveBlocked}};window.__lv={levelUp,lvGoals,LEVELS,lvLocked,renderLv,celebrate,oldSaveLevel};
window.__ghost=(k,x,z,r)=>{sel=k;placeRot=r;hover={x,z,bx:x,bz:z,p:new THREE.Vector3(x+.5,0,z+.5)};updPrev();};
window.__fin=()=>S.b.forEach(b=>{if(b.cons>0)finishCons(b);});
