// Modelos 3D reales: cajas y cilindros de baja poligonización con UV por cara.
// La geometría queda fija en el mundo; no se orienta hacia la cámara.
function buildModel(kind, width, parts) {
  const positions = [], uvs = [], indices = [];
  const inset = 0.002;
  function uv(tile, u, v) {
    return [(tile % 2) * 0.5 + inset + u * (0.5 - inset * 2),
      0.5 - Math.floor(tile / 2) * 0.5 + inset + v * (0.5 - inset * 2)];
  }
  function point(part, p) {
    const cx = Math.cos(part.rx || 0), sx = Math.sin(part.rx || 0);
    const cz = Math.cos(part.rz || 0), sz = Math.sin(part.rz || 0);
    const y = p[1] * cx - p[2] * sx, z = p[1] * sx + p[2] * cx;
    return [p[0] * cz - y * sz + part.x, p[0] * sz + y * cz + part.y, z + (part.z || 0)];
  }
  function quad(part, corners, tile, rotateUV = false) {
    const first = positions.length / 3;
    for (let i = 0; i < 4; i++) {
      positions.push(...point(part, corners[i]));
      const u = i % 2, v = i < 2 ? 0 : 1;
      uvs.push(...uv(tile, rotateUV ? v : u, rotateUV ? u : v));
    }
    indices.push(first, first + 1, first + 2, first + 2, first + 1, first + 3);
  }
  function triangle(part, a, b, c, tile, coords) {
    const first = positions.length / 3;
    positions.push(...point(part, a), ...point(part, b), ...point(part, c));
    for (const pair of coords) uvs.push(...uv(tile, ...pair));
    indices.push(first, first + 1, first + 2);
  }
  for (const p of parts) {
    if (p.type === 'box') {
      const x = p.w / 2, y = p.h / 2, z = p.d / 2;
      quad(p, [[-x,-y,z],[x,-y,z],[-x,y,z],[x,y,z]], 0);
      quad(p, [[x,-y,-z],[-x,-y,-z],[x,y,-z],[-x,y,-z]], 0);
      quad(p, [[x,-y,z],[x,-y,-z],[x,y,z],[x,y,-z]], 3);
      quad(p, [[-x,-y,-z],[-x,-y,z],[-x,y,-z],[-x,y,z]], 3);
      quad(p, [[-x,y,z],[x,y,z],[-x,y,-z],[x,y,-z]], 2, true);
      quad(p, [[-x,-y,-z],[x,-y,-z],[-x,-y,z],[x,-y,z]], 2, true);
    } else {
      const sides = kind === 'hay' ? 10 : 8;
      const sideTile = kind === 'hay' ? 2 : (p.light ? 2 : 0);
      const capTile = kind === 'hay' ? 1 : (p.light ? 3 : 1);
      for (let i = 0; i < sides; i++) {
        const a = i / sides * Math.PI * 2 - Math.PI / 2, b = (i + 1) / sides * Math.PI * 2 - Math.PI / 2;
        const ax = Math.cos(a) * p.r, ay = Math.sin(a) * p.r;
        const bx = Math.cos(b) * p.r, by = Math.sin(b) * p.r, z = p.length / 2;
        const first = positions.length / 3;
        for (const q of [[ax,ay,-z],[bx,by,-z],[ax,ay,z],[bx,by,z]]) positions.push(...point(p,q));
        for (const q of [[i/sides,0],[(i+1)/sides,0],[i/sides,1],[(i+1)/sides,1]]) uvs.push(...uv(sideTile,...q));
        indices.push(first,first+1,first+2,first+2,first+1,first+3);
        const ua = [ax / p.r * 0.5 + 0.5, ay / p.r * 0.5 + 0.5];
        const ub = [bx / p.r * 0.5 + 0.5, by / p.r * 0.5 + 0.5];
        triangle(p,[0,0,z],[ax,ay,z],[bx,by,z],capTile,[[0.5,0.5],ua,ub]);
        triangle(p,[0,0,-z],[bx,by,-z],[ax,ay,-z],capTile,[[0.5,0.5],ub,ua]);
      }
    }
  }
  let halfWidth = 0, halfDepth = 0, height = 0;
  for (let i = 0; i < positions.length; i += 3) {
    halfWidth = Math.max(halfWidth, Math.abs(positions[i]));
    halfDepth = Math.max(halfDepth, Math.abs(positions[i + 2]));
    height = Math.max(height, positions[i + 1]);
  }
  return { width, positions, uvs, indices, halfWidth, halfDepth, height, radius: Math.hypot(halfWidth, halfDepth) };
}
const box = (x,y,z,w,h,d) => ({type:'box',x,y,z,w,h,d});
const cylinder = (x,y,r,length,extras={}) => ({type:'cylinder',x,y,z:0,r,length,...extras});
const top = Math.sqrt(3) * 0.25 + 0.25;
export const MEADOW_MODELS = {
  hay: [
    buildModel('hay',5.8,[box(0,0.3,0,1,0.6,0.6)]),
    buildModel('hay',6.2,[box(0,0.25,0,1,0.5,0.65),box(0.04,0.725,-0.02,0.84,0.45,0.58)]),
    buildModel('hay',5.6,[cylinder(0,0.48,0.48,0.68)]),
    buildModel('hay',6.5,[cylinder(-0.25,0.25,0.25,0.56),cylinder(0.25,0.25,0.25,0.56),cylinder(0,top,0.25,0.56)])
  ],
  logs: [
    buildModel('logs',6.1,[cylinder(-0.25,0.25,0.25,0.75),cylinder(0.25,0.25,0.25,0.75,{light:true}),cylinder(0,top,0.25,0.75)]),
    buildModel('logs',7.2,[-0.34,0,0.34].map(x=>cylinder(x,0.17,0.17,0.8)).concat([-0.17,0.17].map(x=>cylinder(x,0.17+Math.sqrt(3)*0.17,0.17,0.8,{light:true})))),
    buildModel('logs',6.4,[cylinder(0,0.3,0.3,0.95),cylinder(0.1,0.62,0.075,0.42,{z:0.1,rx:-Math.PI/2,rz:-0.5,light:true})]),
    buildModel('logs',6.6,[cylinder(-0.23,0.23,0.23,0.88),cylinder(0.23,0.23,0.23,0.88,{z:0.06,light:true})])
  ]
};

export function buildMeadowModelBatch(kind, layout) {
  const positions = [], uvs = [], indices = [];
  for (const p of layout) {
    if (p.kind !== kind) continue;
    const model = MEADOW_MODELS[kind][p.variant], first = positions.length / 3;
    const cs = Math.cos(p.heading), sn = Math.sin(p.heading);
    for (let i = 0; i < model.positions.length; i += 3) {
      const x = model.positions[i] * p.width, y = model.positions[i+1] * p.width, z = model.positions[i+2] * p.width;
      const wx = cs * x + sn * z, wz = -sn * x + cs * z;
      positions.push(p.x + wx, p.y + y + p.slopeX * wx + p.slopeZ * wz, p.z + wz);
    }
    uvs.push(...model.uvs);
    for (const index of model.indices) indices.push(first + index);
  }
  return { positions, uvs, indices };
}
