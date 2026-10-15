import fs from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bytes = fs.readFileSync(path.join(ROOT, 'wasm/physics-core.wasm'));
const { instance } = await WebAssembly.instantiate(bytes, {env: {sin: Math.sin, cos: Math.cos, exp: Math.exp}});
const s = new Float64Array(instance.exports.memory.buffer, 8192, 40);
const cars = new Float64Array(instance.exports.memory.buffer, 16384, 8*5);
const obstacles = new Float64Array(instance.exports.memory.buffer, 20480, 128*3);
const near = (a,b,epsilon=1e-8) => assert.ok(Math.abs(a-b) <= epsilon, `Esperado ${b}, recibido ${a} (diferencia=${a-b})`);
const jsTerrain = (x,z,radius,heightAmp) => {
 const ratio=Math.min(1.2,Math.hypot(x,z)/radius);
 return (Math.sin(x*.012)*Math.cos(z*.012)*heightAmp*.65+Math.sin((x+z)*.006)*heightAmp*.35)*Math.min(1,ratio*1.35);
};
function originalJS(a) {
 let [x,z,vx,vz,heading,steerAngle,charge,drifting,driftDir,boost,pitch,roll,grip,verticalY,verticalVel] = a;
 let driftBlend=a[17];
 const [dt,throttle,steer,wantDrift,force,topSpeed,baseGrip,drag,radius,heightAmp] = Array.from(a.slice(24,34));
 let forwardX=Math.sin(heading), forwardZ=Math.cos(heading),rightX=Math.cos(heading),rightZ=-Math.sin(heading);
 let forwardSpeed=vx*forwardX+vz*forwardZ;
 let lateralSpeed=vx*rightX+vz*rightZ;
 const grounded=verticalY<=.1 && verticalVel<=0;
 if(wantDrift && grounded && forwardSpeed>(drifting?9:12) && Math.abs(steer)>(drifting?.08:.15)){
   if(!drifting){drifting=1;driftDir=Math.sign(steer)}
   charge=Math.min(100,charge+dt*52);
 }else{if(drifting && charge>=50 && !wantDrift && grounded && forwardSpeed>9)boost=1.25;drifting=0;charge=0;}
 driftBlend+=((drifting?1:0)-driftBlend)*(1-Math.exp(-dt*(drifting?10:7)));
 const speedFactor=Math.min(1,Math.max(0,Math.abs(forwardSpeed)/95));
 const targetSteer=steer*(1-speedFactor*.3);
 steerAngle+=(targetSteer-steerAngle)*dt*10;
 if(Math.abs(forwardSpeed)>.8) heading+=steerAngle*(1.85+driftBlend*.35)*(forwardSpeed>=0?1:-1)*dt;
 forwardX=Math.sin(heading); forwardZ=Math.cos(heading);rightX=Math.cos(heading);rightZ=-Math.sin(heading);
 const prevForward=forwardSpeed;
 forwardSpeed+=throttle*force*dt;
 forwardSpeed-=forwardSpeed*drag*dt;
 forwardSpeed=Math.min(topSpeed,Math.max(-42,forwardSpeed));
 grip=baseGrip*(1-driftBlend*.48);
 lateralSpeed*=Math.exp(-grip*8.5*dt);
 if(drifting) lateralSpeed+=-driftDir*forwardSpeed*2*driftBlend*dt;
 vx=forwardX*forwardSpeed+rightX*lateralSpeed;
 vz=forwardZ*forwardSpeed+rightZ*lateralSpeed;
 x+=vx*dt;z+=vz*dt;
 const dist=Math.hypot(x,z), maxR=radius-6;
 if(dist>maxR){ const px=-x/dist,pz=-z/dist; x=-px*maxR;z=-pz*maxR; vx+=px*35; vz+=pz*35;}
 if(verticalY>0 || verticalVel>0){verticalY+=verticalVel*dt;verticalVel-=38*dt;if(verticalY<=0){verticalY=0;verticalVel=0;}}
 const y=jsTerrain(x,z,radius,heightAmp)+verticalY;
 const accel=(forwardSpeed-prevForward)/Math.max(dt,.001);
 const targetPitch=Math.min(.14,Math.max(-.14,-accel*.0018));
 const targetRoll=Math.min(.24,Math.max(-.24,-steerAngle*(forwardSpeed/95)*.2));
 pitch+=(targetPitch-pitch)*dt*10;
 roll+=(targetRoll-roll)*dt*10;
 return [x,z,vx,vz,heading,steerAngle,charge,drifting,driftDir,boost,pitch,roll,grip,verticalY,verticalVel,y,forwardSpeed,driftBlend];
}
for(let i=0;i<1500;i++){
 s.fill(0);
 const rand=(min,max)=>min+(max-min)*Math.random();
 s[0]=rand(-900,900);s[1]=rand(-900,900);s[2]=rand(-100,100);s[3]=rand(-100,100);
 s[4]=rand(-20,20);s[5]=rand(-1,1);s[6]=rand(0,100);s[7]=Math.random()<.5?1:0;s[8]=Math.random()<.5?1:-1;s[9]=rand(0,1.25);
 s[10]=rand(-.2,.2);s[11]=rand(-.2,.2);s[13]=Math.random()<.5?0:rand(0,10);s[14]=s[13]===0?0:rand(-25,25);s[17]=rand(0,1);
 s[24]=rand(.005,.05);s[25]=rand(-.75,1);s[26]=rand(-1,1);s[27]=Math.random()<.5?1:0;
 s[28]=rand(95,130);s[29]=rand(80,120);s[30]=rand(.5,1.2);s[31]=rand(.38,.7);s[32]=rand(560,1020);s[33]=rand(10,44);
 const expected=originalJS(s);
 instance.exports.vk_step(8192);
 for(let j=0;j<expected.length;j++) near(s[j],expected[j],1e-7);
}
cars.fill(0); obstacles.fill(0);
// Primera colisión, solo el primer carro está dentro del radio y vivo.
cars.set([2,0,10,4,1, 20,0,10,0,1],0);
obstacles.set([0,0,8],0);
instance.exports.vk_obstacles(16384,2,20480,1);
near(cars[0],8);near(cars[1],0);near(cars[2],5.5);near(cars[3],2.2);near(cars[5],20);
console.log('OK: 1500 escenarios comparados JS/WASM con tolerancia 1e-7 + colisiones de obstáculos');
