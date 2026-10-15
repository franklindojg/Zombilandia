import assert from 'node:assert/strict';
import { MEADOW_MODELS, buildMeadowModelBatch } from '../js/meadow-model-geometry.js';
import { resolveObstacleContact } from '../js/collision.js';

let triangles = 0;
for (const [kind, variants] of Object.entries(MEADOW_MODELS)) {
  assert.equal(variants.length, 4);
  for (const model of variants) {
    const { positions: p, uvs, indices } = model;
    assert.ok(p.every(Number.isFinite));assert.ok(uvs.every(v=>v>=0&&v<=1));
    assert.equal(uvs.length,p.length/3*2);
    assert.ok(model.halfWidth>0&&model.halfDepth>0&&model.height>0);
    assert.ok(Math.abs(Math.min(...p.filter((_,i)=>i%3===1)))<1e-8,'El modelo debe apoyar en y=0');
    let volume = 0;const edges=new Map();
    const key=i=>p.slice(i*3,i*3+3).map(v=>Math.round(v*1e8)).join(',');
    for(let i=0;i<indices.length;i+=3){
      const [a,b,c]=indices.slice(i,i+3).map(j=>p.slice(j*3,j*3+3));
      const ab=b.map((v,j)=>v-a[j]),ac=c.map((v,j)=>v-a[j]);
      const cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
      assert.ok(Math.hypot(...cross)>1e-10,'Triángulo sin superficie');
      volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
      for(const [u,v] of [[0,1],[1,2],[2,0]]){const edge=[key(indices[i+u]),key(indices[i+v])].sort().join('|');edges.set(edge,(edges.get(edge)||0)+1)}
    }
    assert.ok(volume>0,'El modelo debe tener volumen y caras exteriores');
    assert.ok([...edges.values()].every(v=>v%2===0),'Malla abierta');
    triangles+=indices.length/3;
    const layout=[{kind,variant:variants.indexOf(model),x:13,y:2,z:-7,width:5,heading:.7,slopeX:.05,slopeZ:-.04}];
    const batch=buildMeadowModelBatch(kind,layout);assert.equal(batch.positions.length,p.length);assert.ok(batch.positions.every(Number.isFinite));
  }
}

for(const heading of [0,Math.PI/4,Math.PI/2,2.4]){
 const cs=Math.cos(heading),sn=Math.sin(heading),obs={position:{x:10,y:0,z:-5},shape:'box',heading,halfWidth:3,halfDepth:1.5,radius:4,height:5};
 const kart=(x,z,y=0)=>({position:{x:10+cs*x+sn*z,y,z:-5-sn*x+cs*z},velocity:{x:-40*cs,z:40*sn},alive:true,collisionRadius:1.85});
 const local=k=>{const x=k.position.x-10,z=k.position.z+5;return {x:cs*x-sn*z,z:sn*x+cs*z}};
 for(const [x,z] of [[3.5,0],[-3.5,0],[0,2],[0,-2],[3.5,2],[-3.5,-2],[0,0]]){
  const k=kart(x,z);assert.equal(resolveObstacleContact(k,obs),true);
  const p=local(k),dx=p.x-Math.max(-3,Math.min(3,p.x)),dz=p.z-Math.max(-1.5,Math.min(1.5,p.z));
  assert.ok(Math.abs(Math.hypot(dx,dz)-1.85)<1e-8);assert.equal(resolveObstacleContact(k,obs)&&Math.hypot(dx,dz)<1.85-1e-8,false);
 }
 assert.equal(resolveObstacleContact(kart(5,0),obs),false);
 assert.equal(resolveObstacleContact(kart(0,0,6),obs),false);
 const outward=kart(3.5,0);outward.velocity={x:cs*10,z:-sn*10};resolveObstacleContact(outward,obs);
 assert.ok(Math.abs(outward.velocity.x-cs*10)<1e-8,'No añadir rebote al separarse');
}
console.log(`OK: ocho modelos 3D cerrados con volumen, ${triangles} triángulos, UVs válidas y colisión en caras/esquinas a cuatro ángulos.`);
