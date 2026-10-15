/* Vigilante Kart 8: nucleo fisico real en WebAssembly (sin librerias externas).
 * Los indices de este buffer double[40] se comparten con js/wasm-physics.js.
 * ABI: vk_step(double*); memoria exportada por WASM. No contiene renderizado.
 */
extern double sin(double);
extern double cos(double);
extern double exp(double);

static double clampd(double a, double lo, double hi) { return a < lo ? lo : a > hi ? hi : a; }
static double mind(double a, double b) { return a < b ? a : b; }
static double maxd(double a, double b) { return a > b ? a : b; }
static double absv(double a) { return a < 0.0 ? -a : a; }
static double sqrtd(double a) { return __builtin_sqrt(a); }

static double terrain(double x, double z, double radius, double amp) {
    double r = sqrtd(x*x + z*z);
    double ratio = mind(1.2, r / radius);
    double waves = sin(x*0.012) * cos(z*0.012) * amp * 0.65 +
                   sin((x+z)*0.006) * amp * 0.35;
    return waves * mind(1.0, ratio*1.35);
}

/* s[0..17]: estado; s[24..33]: entradas y parámetros. */
__attribute__((export_name("vk_step")))
void vk_step(double *s) {
    double x=s[0], z=s[1], vx=s[2], vz=s[3];
    double heading=s[4], steerAngle=s[5], charge=s[6], drifting=s[7];
    double driftDir=s[8], boost=s[9], pitch=s[10], roll=s[11];
    double verticalY=s[13], verticalVel=s[14];
    double driftBlend=s[17];
    double dt=s[24], throttle=s[25], steering=s[26], wantDrift=s[27];
    double force=s[28], topSpeed=s[29], baseGrip=s[30], drag=s[31];
    double arenaRadius=s[32], heightAmp=s[33];

    double fx=sin(heading), fz=cos(heading);
    double rx=cos(heading), rz=-sin(heading);
    double forwardSpeed=vx*fx + vz*fz;
    double lateralSpeed=vx*rx + vz*rz;

    int grounded=verticalY<=0.1 && verticalVel<=0.0;
    double driftSpeed=drifting>0.5?9.0:12.0;
    double driftSteer=drifting>0.5?0.08:0.15;
    if (wantDrift > 0.5 && grounded && forwardSpeed > driftSpeed && absv(steering) > driftSteer) {
        if (drifting < 0.5) { drifting=1.0; driftDir=steering > 0 ? 1.0 : -1.0; }
        charge=mind(100.0, charge + dt*52.0);
    } else {
        if (drifting > 0.5 && charge >= 50.0 && wantDrift<=0.5 && grounded && forwardSpeed>9.0) boost=1.25;
        drifting=0.0; charge=0.0;
    }
    driftBlend += ((drifting>0.5?1.0:0.0)-driftBlend)*(1.0-exp(-dt*(drifting>0.5?10.0:7.0)));

    double speedFactor=clampd(absv(forwardSpeed)/95.0,0.0,1.0);
    double targetSteer=steering*(1.0-speedFactor*0.3);
    steerAngle += (targetSteer-steerAngle)*dt*10.0;
    if (absv(forwardSpeed) > 0.8) {
        double turnRate=1.85+driftBlend*0.35;
        heading += steerAngle*turnRate*(forwardSpeed>=0?1.0:-1.0)*dt;
    }

    fx=sin(heading); fz=cos(heading);
    rx=cos(heading); rz=-sin(heading);
    double prevForward=forwardSpeed;
    forwardSpeed += throttle*force*dt;
    forwardSpeed -= forwardSpeed*drag*dt;
    forwardSpeed = clampd(forwardSpeed,-42.0,topSpeed);
    double grip=baseGrip*(1.0-driftBlend*0.48);
    lateralSpeed *= exp(-grip*8.5*dt);
    if (drifting>0.5) lateralSpeed += -driftDir*forwardSpeed*2.0*driftBlend*dt;

    vx=fx*forwardSpeed + rx*lateralSpeed;
    vz=fz*forwardSpeed + rz*lateralSpeed;
    x+=vx*dt;
    z+=vz*dt;

    double dist=sqrtd(x*x+z*z);
    double maxR=arenaRadius-6.0;
    if (dist>maxR && dist>0.000001) {
        double pushX=-x/dist, pushZ=-z/dist;
        x=-pushX*maxR; z=-pushZ*maxR;
        vx+=pushX*35.0; vz+=pushZ*35.0;
    }

    if (verticalY>0.0 || verticalVel>0.0) {
        verticalY+=verticalVel*dt;
        verticalVel-=38.0*dt;
        if (verticalY<=0.0) { verticalY=0.0; verticalVel=0.0; }
    }
    double y=terrain(x,z,arenaRadius,heightAmp)+verticalY;
    double longitudinalAccel=(forwardSpeed-prevForward)/maxd(dt,0.001);
    double targetPitch=clampd(-longitudinalAccel*0.0018,-0.14,0.14);
    double targetRoll=clampd(-steerAngle*(forwardSpeed/95.0)*0.2,-0.24,0.24);
    pitch+=(targetPitch-pitch)*dt*10.0;
    roll+=(targetRoll-roll)*dt*10.0;

    s[0]=x; s[1]=z; s[2]=vx; s[3]=vz;
    s[4]=heading; s[5]=steerAngle; s[6]=charge; s[7]=drifting;
    s[8]=driftDir; s[9]=boost; s[10]=pitch; s[11]=roll;
    s[12]=grip; s[13]=verticalY; s[14]=verticalVel; s[15]=y;
    s[16]=forwardSpeed;
    s[17]=driftBlend;
}

/* Colisiones con obstáculos, procesadas en un único cruce JS/WASM.
 * Vehículos: [x,z,vx,vz,alive] por cada uno.
 * Obstáculos: [x,z,radius] por cada uno. Misma respuesta que la versión JS.
 */
__attribute__((export_name("vk_obstacles")))
void vk_obstacles(double *cars, int carCount, const double *obstacles, int obstacleCount) {
    if (carCount<0 || carCount>8 || obstacleCount<0 || obstacleCount>128) return;
    for (int o=0;o<obstacleCount;o++) {
        double ox=obstacles[o*3], oz=obstacles[o*3+1], radius=obstacles[o*3+2];
        for (int k=0;k<carCount;k++) {
            double *v=&cars[k*5];
            if (v[4]<0.5) continue;
            double dx=v[0]-ox, dz=v[1]-oz;
            double dist=sqrtd(dx*dx+dz*dz);
            if (dist<radius && dist>0.001) {
                double nx=dx/dist, nz=dz/dist;
                v[0]=ox+nx*radius;
                v[1]=oz+nz*radius;
                v[2]*=0.55;
                v[3]*=0.55;
            }
        }
    }
}
