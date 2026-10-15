// Prueba de integración simulada (NO sustituye prueba gráfica real en Android).
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {URL,fileURLToPath}=require('node:url');
const ROOT=path.resolve(__dirname,'..');
const jsMode = process.argv.includes('--js');
function fakeElement(tag='div'){
 const el={tagName:tag.toUpperCase(),style:{},className:'',value:'',textContent:'',innerHTML:'',dataset:{},children:[],
 classList:{add(){},remove(){},contains(){return false}},addEventListener(){},removeEventListener(){},setPointerCapture(){},
 appendChild(c){this.children.push(c)},removeChild(c){this.children=this.children.filter(a=>a!==c)},click(){},getContext(){return ctx2d}};
 return el;
}
const ctx2d=new Proxy({},{get(t,k){return t[k]||(()=>{})},set(t,k,v){t[k]=v;return true}});
const elems=new Map();
const document={hidden:false,body:fakeElement('body'),createElement:fakeElement,getElementById(id){if(!elems.has(id))elems.set(id,fakeElement());return elems.get(id)},querySelectorAll(){return []},addEventListener(){}};
const window={innerWidth:1280,innerHeight:720,devicePixelRatio:1,addEventListener(){},matchMedia(){return {matches:false}}};
const sandbox={document,window,navigator:{userAgent:'Desktop'},performance:{now(){return 1000}},location:{search:jsMode?'?wasm=0':''},
 URL,URLSearchParams,WebAssembly,requestAnimationFrame(){},setTimeout(){return 1},clearTimeout(){},setInterval(){return 1},
 fetch:async (uri)=>({ok:true,arrayBuffer:async()=>fs.readFileSync(fileURLToPath(uri))}),
 console,Blob:class{},Math,Uint8Array};
const context=vm.createContext(sandbox);
const cache=new Map();
function load(id){
 if(cache.has(id))return cache.get(id);
 let source;
 if(id==='three')source=fs.readFileSync(path.join(__dirname,'mock-three.mjs'),'utf8');
 else if(id==='three/addons/exporters/GLTFExporter.js')source='export class GLTFExporter { parse() {} }';
 else if(id==='three/addons/utils/BufferGeometryUtils.js')source='export function mergeGeometries(geometries) { return geometries[0].clone(); }';
 else source=fs.readFileSync(id,'utf8');
 const mod=new vm.SourceTextModule(source,{context,identifier:id,initializeImportMeta(meta,module){meta.url=module.identifier.startsWith('/') ? 'file://'+module.identifier : module.identifier}});
 cache.set(id,mod);return mod;
}
function resolve(spec,ref){if(spec==='three'||spec.startsWith('three/addons/'))return spec;return path.resolve(path.dirname(ref.identifier),spec)}
async function main(){
 const entry=load(path.join(ROOT,'js/main.js'));
 await entry.link((spec,ref)=>load(resolve(spec,ref)));await entry.evaluate();
 const get=(module)=>cache.get(path.join(ROOT,'js',module)).namespace;
 const match=get('match.js'),state=get('state.js').state,core=get('wasm-physics.js');
 await core.initializeWasmPhysics();
 if(jsMode && core.wasmPhysics.ready) throw Error('Fallback JS no se activó');
 if(!jsMode && !core.wasmPhysics.ready) throw Error('WASM no se activó');
 // Cambiar a un sector bloqueado no debe lanzar el nivel anterior de pradera.
 const initialUnlocked=state.unlockedMaxLevel;
 state.unlockedMaxLevel=1;
 state.selectedCupIndex=1;state.selectedLevelNumber=1;
 if(match.startCombatArena()!==false||state.activeArena!==null||state.gameState!=='MENU')throw Error('Se lanzó una arena desde un sector bloqueado');
 if(state.selectedLevelNumber!==5||!elems.get('btn-start-race').disabled)throw Error('El menú conserva un nivel de otro sector');
 state.unlockedMaxLevel=initialUnlocked;
 // Volver a Pradera debe corregir también una selección antigua de Desierto.
 state.selectedCupIndex=0;state.selectedLevelNumber=5;
 match.startCombatArena();
 if(state.activeArena.levelObj.level!==1||state.activeArena.cupData.biomeKey!=='meadow')throw Error('Pradera no carga Arena 1');
 if(state.combatants.length!==5) throw Error('El combate no tiene cinco carros');
 const arena=state.activeArena, weapons=get('weapons.js');
 const driver=state.combatants[0],controls=get('state.js').keys;
 function driveCase({speed=13,drifting=false,charge=0,blend=0,air=0,rising=0,button=true,steer=true}={}){
   driver.position.set(0,0,0);driver.velocity.set(0,0,speed);driver.heading=driver.steerAngle=0;
   driver.isDrifting=drifting;driver.driftCharge=charge;driver.driftBlend=blend;driver.driftDirection=1;
   driver.verticalY=air;driver.verticalVel=rising;driver.boostTimer=0;
   driver.rampContact=driver._lastSupportRamp=null;
   controls.forward=controls.backward=controls.right=false;controls.left=steer;controls.drift=button;
   driver.updateCombatPhysics(1/60,arena);
 }
 driveCase();
 if(!driver.isDrifting||driver.driftBlend<=0||driver.driftBlend>=.3)throw Error('Entrada del derrape no progresiva a 31 km/h');
 driveCase({speed:11});if(driver.isDrifting)throw Error('Entrada por debajo del umbral');
 driveCase({speed:11,drifting:true,blend:1});if(!driver.isDrifting)throw Error('Histéresis del derrape perdida');
 driveCase({speed:8,drifting:true,charge:80,blend:1});if(driver.isDrifting||driver.boostTimer>0)throw Error('Derrape o turbo al quedar sin velocidad');
 driveCase({speed:40,drifting:true,charge:80,blend:1,button:false});
 if(driver.isDrifting||driver.boostTimer!==1.25||driver.driftBlend<=.8||driver.driftBlend>=1)throw Error('Salida sin turbo o recuperación brusca de agarre');
 for(const props of [{speed:-40},{air:2},{rising:8}]){
   driveCase({...props,drifting:true,charge:80,blend:1});
   if(driver.isDrifting||driver.driftCharge||driver.boostTimer>0)throw Error('Derrape/turbo en reversa o salto');
 }
 controls.left=controls.drift=false;
 console.log('OK: umbral, histéresis, agarre progresivo, turbo al soltar y rechazo en reversa/salto.');
 for(let i=0;i<180;i++){
   if(state.gameState!=='COMBAT')break;
   for(const c of state.combatants)c.updateCombatPhysics(1/30,arena);
   weapons.updateArenaInteractions(1/30);
 }
 weapons.spawnExplosion(state.combatants[0].position.clone(),3,0xf43f5e);
 weapons.updateArenaInteractions(0.5);
 if(state.explosions.length!==0)throw Error('La explosión debería devolverse al pool');
 const pool=get('graphics.js').poolExplosions;
 if(!pool.length)throw Error('No se almacenó la explosión reutilizable');
 const effects=get('effects.js'),player=state.combatants[0],camera=get('graphics.js').camera;
 effects.resetEffects();player.syncVisual(1);camera.position.copy(player.mesh.position);
 player.alive=true;player.velocity.set(0,0,60);player.isDrifting=false;player.verticalY=player.verticalVel=0;
 effects.emitKartEffects(player,.12,'meadow');
 if(effects.getEffectStats().smoke!==0)throw Error('Humo al conducir recto');
 player.isDrifting=true;player.driftCharge=80;player.verticalY=2;
 effects.emitKartEffects(player,.12,'meadow');
 if(effects.getEffectStats().smoke!==0)throw Error('Humo de llantas en el aire');
 player.verticalY=0;effects.emitKartEffects(player,.12,'meadow');
 if(effects.getEffectStats().smoke!==2)throw Error('Falta humo en las dos llantas traseras');
 if(!effects.getEffectStats().particles)throw Error('Se perdieron las chispas del derrape cargado');
 for(let i=0;i<60;i++)effects.emitKartEffects(player,.12,'meadow');
 if(effects.getEffectStats().smoke>effects.getEffectStats().smokeLimit)throw Error('Pool de humo sin límite');
 effects.updateEffects(2);
 if(effects.getEffectStats().smoke!==0)throw Error('El humo no se disipa');
 effects.resetEffects();
 if(effects.getEffectStats().particles||effects.getEffectStats().smokeVisible)throw Error('Efectos activos después del reinicio');
 console.log('OK: humo en ambas llantas, derrape cargado, rechazo en el aire, límite y disipación.');
 match.returnToMenu();match.startCombatArena();
 if(state.combatants.length!==5)throw Error('Fallo reiniciar la arena');
 for(let level=1;level<=4;level++){
   match.returnToMenu();state.selectedCupIndex=0;state.selectedLevelNumber=level;match.startCombatArena();
   const group=get('graphics.js').worldGroup.children.find(g=>g.name==='Objetos_pradera_modelos_3D');
   if(!group||group.children.length!==3)throw Error('Faltan lotes rurales en pradera');
   const props=group.userData.layout, expected=32+(level-1)*4;
   if(props.length!==expected||state.arenaObstacles.length!==expected)throw Error('Cantidad de obstáculos rurales incorrecta');
   if(new Set(props.map(p=>p.kind+':'+p.variant)).size!==8)throw Error('Faltan variantes de pacas/troncos');
   for(const p of props){
     for(const item of [...state.weaponCrates,...state.repairWrenches]){
       if(Math.hypot(p.x-item.basePos.x,p.z-item.basePos.z)<p.radius+12)throw Error('Objeto rural bloquea un pickup');
     }
     for(const k of state.combatants){
       if(Math.hypot(p.x-k.position.x,p.z-k.position.z)<p.radius+13)throw Error('Objeto rural bloquea una salida');
     }
   }
   const obs=state.arenaObstacles[0], k=state.combatants[0],resolve=get('collision.js').resolveObstacleContact;
   k.position.copy(obs.position);k.velocity.set(-50,0,0);
   if(!resolve(k,obs)||Math.hypot(k.position.x-obs.position.x,k.position.z-obs.position.z)<Math.min(obs.halfWidth,obs.halfDepth)+k.collisionRadius-1e-6)throw Error('Se atraviesa el modelo de la paca');
   k.position.copy(obs.position);k.position.y+=obs.height+1;
   if(resolve(k,obs))throw Error('Choque con objeto rural por encima de su altura');
 }
 console.log('OK: pacas/troncos en las cuatro praderas, ocho variantes, salidas y pickups libres, colisión y salto.');
 state.unlockedMaxLevel=20;
 for(let cup=0;cup<5;cup++){
   match.returnToMenu();state.selectedCupIndex=cup;state.selectedLevelNumber=cup===0?20:1;
   match.startCombatArena();
   if(state.activeArena.levelObj.cup!==cup||state.activeArena.levelObj.level!==cup*4+1)throw Error('Sector y arena no coinciden');
   if(cup>0&&(state.arenaObstacles.length!==34||state.arenaObstacles.some(o=>o.kind)))throw Error('Objetos rurales fuera de pradera');
 }
 console.log('OK: selección de los cinco sectores, rechazo de sectores bloqueados y regreso a pradera.');
 console.log('OK: motor '+(jsMode?'JavaScript de respaldo':'WebAssembly')+', cinco carros, 180 frames de IA/física/armas, explosión reciclada, regreso al hangar y reinicio');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1});
