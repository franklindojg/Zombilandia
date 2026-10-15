// Solo para validación de carga: simulación de clases Three.js, NO es parte del juego entregado.
export class Vector3 {
 constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}
 setY(y){this.y=y;return this}
 set(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return this}
 copy(v){return this.set(v.x,v.y,v.z)} clone(){return new Vector3(this.x,this.y,this.z)}
 add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this}
 sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this}
 addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this}
 multiplyScalar(v){this.x*=v;this.y*=v;this.z*=v;return this}
 length(){return Math.hypot(this.x,this.y,this.z)} lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}
 distanceToSquared(v){return this.clone().sub(v).lengthSq()}
 normalize(){let l=this.length()||1;return this.multiplyScalar(1/l)}
 dot(v){return this.x*v.x+this.y*v.y+this.z*v.z}
 lerp(v,t){return this.addScaledVector(v.clone().sub(this),t)}
 setScalar(s){return this.set(s,s,s)}
 applyAxisAngle(v,a){const x=this.x,z=this.z;this.x=x*Math.cos(a)+z*Math.sin(a);this.z=z*Math.cos(a)-x*Math.sin(a);return this}
 project(){return this}
}
export class Object3D{
 constructor(){this.children=[];this.position=new Vector3();this.rotation=new Vector3();this.quaternion={copy(){return this}};this.scale=new Vector3(1,1,1);this.userData={};this.matrix={set(){return this}};this.visible=true;this.castShadow=false;this.receiveShadow=false}
 add(...ns){this.children.push(...ns);return this}
 remove(n){this.children=this.children.filter(c=>c!==n);return this}
 clear(){this.children=[]} traverse(fn){fn(this);for(const c of this.children)c.traverse(fn)}
 updateMatrix(){} updateMatrixWorld(){} lookAt(){} setMatrixAt(){} updateProjectionMatrix(){}
}
export class Scene extends Object3D{}
export class Group extends Object3D{}
export class PerspectiveCamera extends Object3D{}
class Geo{constructor(){this.attributes={position:{count:4,getX(){return 1},getY(){return 1},getZ(){return 1},setY(){}},uv:{count:4,getX(){return 0},getY(){return 0},setXY(){}}};this.parameters={}} setAttribute(n,a){this.attributes[n]=a;return this} setIndex(i){this.index=i;return this} clone(){return new Geo()} applyMatrix4(){return this} rotateX(){return this} rotateZ(){return this} rotateY(){return this} scale(){return this} computeVertexNormals(){} dispose(){} }
export class BufferGeometry extends Geo{setDrawRange(start,count){this.drawRange={start,count};return this}}
export class Float32BufferAttribute {constructor(values,itemSize){this.array=new Float32Array(values);this.itemSize=itemSize;this.count=this.array.length/itemSize;this.updateRanges=[]}clearUpdateRanges(){this.updateRanges.length=0}addUpdateRange(start,count){this.updateRanges.push({start,count})}}
export class Sphere {constructor(center=new Vector3(),radius=1){this.center=center;this.radius=radius}}
export class BoxGeometry extends Geo{}
export class PlaneGeometry extends Geo{}
export class CylinderGeometry extends Geo{}
export class SphereGeometry extends Geo{}
export class TorusGeometry extends Geo{}
export class ConeGeometry extends Geo{}
export class OctahedronGeometry extends Geo{}
export class RingGeometry extends Geo{}
class ColorBase{constructor(hex){this.set(hex)}setHex(h){return this.set(h)}set(v){this.hex=v;const h=typeof v==='string'?parseInt(v.slice(1),16):v;this.r=((h>>16)&255)/255;this.g=((h>>8)&255)/255;this.b=(h&255)/255;return this}clone(){return new ColorBase(this.hex)}}
export class Color extends ColorBase{}
export class FogExp2{constructor(color,density){this.color=new ColorBase(color);this.density=density}}
class Mat{constructor(cfg={}){Object.assign(this,cfg);this.color=new ColorBase(cfg.color??0xffffff);this.opacity=cfg.opacity??1}clone(){return new Mat(this)}dispose(){}}
export class MeshBasicMaterial extends Mat{}
export class MeshLambertMaterial extends Mat{}
export class MeshStandardMaterial extends Mat{}
export class SpriteMaterial extends Mat{}
export class Mesh extends Object3D{constructor(geo,mat){super();this.geometry=geo;this.material=mat;this.isMesh=true}}
export class Sprite extends Object3D{constructor(mat){super();this.material=mat;this.isSprite=true}}
export class InstancedMesh extends Mesh{constructor(geo,mat,n){super(geo,mat);this.count=n;this.isInstancedMesh=true;this.instanceMatrix={needsUpdate:false}}}
export class AmbientLight extends Object3D{constructor(c,i){super();this.color=new ColorBase(c);this.intensity=i}}
export class DirectionalLight extends AmbientLight{constructor(c,i){super(c,i);this.target=new Object3D();this.shadow={mapSize:{},camera:{}}}}
export class CanvasTexture {constructor(c){this.canvas=c;this.repeat={set(){}}}dispose(){}}
export class TextureLoader {load(){return {repeat:{set(){}},dispose(){}}}}
export class WebGLRenderer {constructor(){this.domElement=document.createElement('canvas');this.shadowMap={};this.info={render:{calls:5,triangles:120},memory:{textures:6}}}setPixelRatio(){}setSize(){}render(){}}
export class Clock{getDelta(){return .033}}
export const MathUtils={clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),lerp:(a,b,t)=>a+(b-a)*t};
export const SRGBColorSpace='sRGB';export const NearestFilter=100;export const NearestMipmapNearestFilter=101;export const RepeatWrapping=200;
export const PCFShadowMap=400;export const DoubleSide=2;export const AdditiveBlending=10;
export const NormalBlending=1;
export const BackSide=1;export const LinearFilter=102;
