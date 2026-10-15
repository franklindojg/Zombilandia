import assert from 'node:assert/strict';
import { FixedSimulation } from '../js/simulation.js';
import { resolveKartContact, resolveObstacleContact, segmentDistanceSquared } from '../js/collision.js';

const kart = (x, vx, mass = 1, y = 0) => ({ position: { x, y, z: 0 }, velocity: { x: vx, z: 0 }, alive: true, mass, collisionRadius: 1.85 });
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
// El mismo tiempo transcurrido debe dar los mismos pasos a cualquier render FPS.
for (const fps of [24, 30, 60, 90, 120]) {
  const simulation = new FixedSimulation();
  let time = 0, position = 0, speed = 0;
  for (let i = 0; i < fps * 5; i++) simulation.advance(1 / fps, dt => { time += dt; speed += 10 * dt; position += speed * dt; });
  near(time, 5); near(speed, 50); near(position, 125.41666666666667);
}
const stalled = new FixedSimulation();
let steps = 0;
stalled.advance(15, () => steps++);
assert.equal(steps, 8, 'No debe simular 15 segundos tras volver de otra app');
stalled.reset(); near(stalled.accumulator, 0);

let a = kart(-1, 50), b = kart(1, -30, 1.5);
const momentum = a.mass * a.velocity.x + b.mass * b.velocity.x;
assert.equal(resolveKartContact(a, b), 80);
near(a.mass * a.velocity.x + b.mass * b.velocity.x, momentum);
near(b.position.x - a.position.x, 3.7);
assert.ok(a.velocity.x < b.velocity.x, 'Deben separarse después del impacto');
a = kart(-1, -4); b = kart(1, 4);
assert.equal(resolveKartContact(a, b), 0);
near(a.velocity.x, -4); near(b.velocity.x, 4);
a = kart(0, 0); b = kart(0, 0);
resolveKartContact(a, b); near(Math.abs(a.position.x - b.position.x), 3.7);
a = kart(0, 20, 1, 8); b = kart(0, 0);
assert.equal(resolveKartContact(a, b), 0, 'No chocar con un kart debajo del salto');

const obstacle = { position: { x: 0, y: 0, z: 0 }, radius: 8, height: 22 };
a = kart(2, -50); a.velocity.z = 12;
assert.equal(resolveObstacleContact(a, obstacle), true);
near(a.position.x, 9.85); near(a.velocity.x, 11); near(a.velocity.z, 12);
a = kart(0, 0); assert.equal(resolveObstacleContact(a, obstacle), true);
assert.ok(Number.isFinite(a.position.x));
near(segmentDistanceSquared(-10, 1, 0, 10, 1, 0, 0, 1, 0), 0);
near(segmentDistanceSquared(-10, 1, 8, 10, 1, 8, 0, 1, 0), 64);
console.log('OK: tiempo igual a 24/30/60/90/120 FPS; choques con masa, separación, altura, obstáculos y balas rápidas.');

// Rampas: superficie real, paredes sólidas y despegue exclusivamente al salir.
const { RAMP_WIDTH, RAMP_LENGTH, RAMP_HEIGHT, rampSurfaceHeight, resolveRampContacts } = await import('../js/ramp-physics.js');
const ramp = { position: { x: 0, y: 0, z: 0 }, width: RAMP_WIDTH, length: RAMP_LENGTH,
  height: RAMP_HEIGHT, forwardX: 0, forwardZ: 1, forwardSlope: 0, sideSlope: 0 };
const rampKart = (x, z, previousX, previousZ, speedX = 0, speedZ = 80) => ({
 position: { x, y: 0, z }, previousPosition: { x: previousX, y: 0, z: previousZ },
 velocity: { x: speedX, z: speedZ }, alive: true, collisionRadius: 1.85,
 heading: Math.atan2(speedX, speedZ), verticalY: 0, verticalVel: 0, rampCooldown: 0,
 boostTimer: 0, rampContact: null, rampPitch: 0, rampRoll: 0
});
near(rampSurfaceHeight(ramp,0,-9),0);near(rampSurfaceHeight(ramp,0,0),2.1);near(rampSurfaceHeight(ramp,0,9),4.2);
assert.equal(rampSurfaceHeight(ramp,8,0),null);
let k=rampKart(0,-8,0,-10);
assert.equal(resolveRampContacts(k,[ramp],1/60,0),'supported');
near(k.position.y,RAMP_HEIGHT/18);near(k.verticalVel,0);assert.ok(k.rampPitch<0);
assert.equal(k.boostTimer,0,'No disparar el salto ni turbo al entrar');
for(const z of [-5,0,4,8.8]){
 Object.assign(k.previousPosition,k.position);k.position.z=z;k.position.y-=.1;
 assert.equal(resolveRampContacts(k,[ramp],1/60,0),'supported');
 near(k.position.y,rampSurfaceHeight(ramp,0,z));near(k.verticalVel,0);
}
Object.assign(k.previousPosition,k.position);k.position.z=10;
assert.equal(resolveRampContacts(k,[ramp],1/60,0),'launched');
assert.ok(k.verticalY>=4.2);assert.ok(k.verticalVel>20);assert.equal(k.rampContact,null);
const exitVelocity=k.verticalVel;
k.previousPosition={...k.position};k.position.z=12;
assert.equal(resolveRampContacts(k,[ramp],1/60,0),null);near(k.verticalVel,exitVelocity);

k=rampKart(0,8,0,13,0,-80);
assert.equal(resolveRampContacts(k,[ramp],1/60,0),'blocked');
assert.ok(k.position.z>10.85);assert.ok(k.velocity.z>=0);near(k.verticalVel,0);
k=rampKart(6,0,12,0,-100,0);
assert.equal(resolveRampContacts(k,[ramp],1/60,0),'blocked');assert.ok(k.position.x>8.85);assert.ok(k.velocity.x>=0);
k=rampKart(0,0,15,0,-900,0);
assert.equal(resolveRampContacts(k,[ramp],1/60,0),'blocked','Bloquear un cruce rápido por un lateral');
assert.ok(k.position.x>8.85);
k=rampKart(0,0,0,0,0,0);
assert.equal(resolveRampContacts(k,[ramp],1/60,0),'blocked');assert.ok(Number.isFinite(k.position.x));
k=rampKart(0,0,0,-2);k.position.y=7;k.previousPosition.y=7;k.verticalY=7;
assert.equal(resolveRampContacts(k,[ramp],1/60,0),null,'Pasar volando no vuelve a activar la rampa');
k=rampKart(0,0,0,0,0,10);k.position.y=1.9;k.previousPosition.y=2.4;k.verticalY=1.9;k.verticalVel=-12;
assert.equal(resolveRampContacts(k,[ramp],1/60,0),'supported');near(k.position.y,2.1);near(k.verticalVel,0);
k=rampKart(8,0,6,0,20,0);k.previousPosition.y=k.position.y=2.1;k.verticalY=2.1;k.rampContact=ramp;
assert.equal(resolveRampContacts(k,[ramp],1/60,0),'left');assert.equal(k.rampContact,null);near(k.verticalVel,0);
k=rampKart(0,-10,0,-8,0,-10);k.previousPosition.y=k.position.y=RAMP_HEIGHT/18;k.rampContact=ramp;
assert.equal(resolveRampContacts(k,[ramp],1/60,0),'left');near(k.verticalVel,0);

// Misma respuesta con cualquier orientación y con la base sobre una pendiente.
for(const heading of [Math.PI/2,Math.PI,-.7]){
 const rotated={...ramp,forwardX:Math.sin(heading),forwardZ:Math.cos(heading),forwardSlope:.03,sideSlope:-.02};
 k=rampKart(rotated.forwardX*-8,rotated.forwardZ*-8,rotated.forwardX*-10,rotated.forwardZ*-10,
   rotated.forwardX*80,rotated.forwardZ*80);
 k.previousPosition.y=-.3;k.position.y=-.24;
 assert.equal(resolveRampContacts(k,[rotated],1/60,-.24),'supported');
 near(k.position.y,rampSurfaceHeight(rotated,k.position.x,k.position.z));
 near(k.rampPitch,-Math.atan(RAMP_HEIGHT/RAMP_LENGTH+.03));
}
console.log('OK: rampas, ascenso, despegue al borde, entrada baja, laterales, espalda, barrido, aterrizaje, caída y orientación.');

// La interpolación debe usar el triángulo real, no una altura bilineal/analítica.
const { DriveSurface, fitGroundPose, wheelSuspensionOffset, WHEEL_CLEARANCE } = await import('../js/surface-physics.js');
const gridPositions=new Float32Array([-1,0,-1, 1,2,-1, -1,4,1, 1,10,1]);
const drive=new DriveSurface({size:2,segments:1,groundPositions:gridPositions,roadInner:1,roadOuter:2});
near(drive.groundHeight(-.5,-.5),1.5);near(drive.groundHeight(.5,.5),6.5);near(drive.groundHeight(0,0),3);
const flatGrid=new Float32Array([-4,0,-4, 4,0,-4, -4,0,4, 4,0,4]);
const roadVertices=new Float32Array(30);
for(let row=0;row<2;row++)for(let sector=0;sector<=4;sector++){
 const radius=row+1,angle=sector*Math.PI/2,x=radius*Math.cos(angle),z=-radius*Math.sin(angle),i=(row*5+sector)*3;
 roadVertices.set([x,10+2*x-3*z,z],i);
}
const roadSurface=new DriveSurface({size:8,segments:1,groundPositions:flatGrid,roadInner:1,roadOuter:2,
 roadPositions:roadVertices,angularSegments:4,radialSegments:1});
near(roadSurface.roadHeight(.75,-.75),13.75);near(roadSurface.heightAt(.75,-.75),13.75);
assert.equal(roadSurface.roadHeight(0,0),-Infinity);assert.equal(roadSurface.roadHeight(3,0),-Infinity);
near(roadSurface.heightAt(0,0),0);
const wheelSpecs=[{x:-1.42,z:1.42,y:.48,radius:.48,width:.56,isFront:true},
 {x:1.42,z:1.42,y:.48,radius:.48,width:.56,isFront:true},
 {x:-1.56,z:-1.32,y:.62,radius:.62,width:.82,isFront:false},
 {x:1.56,z:-1.32,y:.62,radius:.62,width:.82,isFront:false}];
const plane=(x,z)=>2+.2*x-.15*z;
for(const heading of [0,Math.PI/2,.7]){
 const pose=fitGroundPose({},15,-25,heading,wheelSpecs,plane,.3);
 for(const w of wheelSpecs){
  const x=15+pose.rightX*w.x+pose.forwardX*w.z,z=-25+pose.rightZ*w.x+pose.forwardZ*w.z;
  const y=pose.height+pose.rightY*w.x+pose.forwardY*w.z;
  near(y-plane(x,z),WHEEL_CLEARANCE);
  near(wheelSuspensionOffset(pose,15,pose.height,-25,w,plane,.3),0);
 }
}
console.log('OK: altura de triángulos, carretera elevada, plano de las cuatro llantas y suspensión en varias orientaciones.');
// El hombro exterior de la llanta trasera cruza la carretera antes que su centro.
const edgeSurface=(x,z)=>x>=279?.45:0;
const edgePose=fitGroundPose({},277,0,0,wheelSpecs,edgeSurface,0);
assert.ok(edgePose.height>.3,'El cilindro central solo no detecta el hombro del neumático');
const rearRight=wheelSpecs[3],outerX=277+rearRight.x+rearRight.width*.36+rearRight.radius*.24;
const outerY=edgePose.height+rearRight.y-rearRight.radius*.76;
assert.ok(outerY>=edgeSurface(outerX,0)+WHEEL_CLEARANCE-1e-8);
console.log('OK: hombros de las llantas completos y borde elevado de carretera.');
