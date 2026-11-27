// Terrain shaders, generalised from sanNchari's Karnataka relief for any state:
// the projection, height scale, coast and climate come in as uniforms and textures
// instead of Karnataka constants. Everything is procedural ("simulated imagery").
//
// Textures: uH height (16-bit in R/G, 0..uHMax m), uN noise, uR random tile,
// uM mask (R inside the state, G district borders, B sea), uF fade (R wide, G tight),
// uC climate (R wet, G arid, B dark soil).

export const COMMON = `
  uniform sampler2D uH,uN,uR,uM,uF,uC;uniform vec4 uG,uProj;uniform vec2 uGN;uniform float uEx,uLift,uHMax;
  vec2 ll(vec2 xz){return vec2(xz.x/uProj.z+uProj.x,-xz.y/uProj.w+uProj.y);}
  vec2 muv(vec2 p){return (p-uG.xy)/uG.zw;}
  float inK(vec2 p){return smoothstep(0.42,0.58,texture2D(uM,muv(p)).r);}
  float hT(vec2 ij){vec4 t=texture2D(uH,(ij+0.5)/uGN);return (t.r*65280.0+t.g*255.0)/65535.0*uHMax;}
  float baseH(vec2 p){vec2 f=clamp(muv(p)*(uGN-1.0),vec2(0.0),uGN-1.001);vec2 i=floor(f),u=f-i;return mix(mix(hT(i),hT(i+vec2(1.,0.)),u.x),mix(hT(i+vec2(0.,1.)),hT(i+vec2(1.,1.)),u.x),u.y);}
  float nz(vec2 p){return texture2D(uN,p).r;}
  vec3 clim(vec2 p){return texture2D(uC,muv(p)).rgb;}
  float fullH(vec2 p,float fine){float h=baseH(p);float w=clim(p).r;float rg=clamp((h-150.0)/800.0,0.0,1.0)*(w*0.8+0.2)*0.88+0.12;
    float d=(nz(p/0.5)-0.5)*240.0+(nz(p/0.12+0.37)-0.5)*90.0+(nz(p/0.03+0.71)-0.5)*28.0;
    if(fine>0.5)d+=(nz(p/0.008+0.13)-0.5)*9.0+(nz(p/0.002+0.57)-0.5)*3.0;
    float sea=smoothstep(0.3,0.7,texture2D(uM,muv(p)).b);return max(0.0,h+d*rg)*(1.0-sea);}`;

export const VERT = `
  uniform vec3 uPatch;uniform float uCoarse;varying vec2 vXZ;varying float vIn;
  void main(){vec2 xz=uCoarse>0.5?position.xz:position.xz*uPatch.z+uPatch.xy;vXZ=xz;vIn=inK(ll(xz));float y=(fullH(ll(xz),0.0)+vIn*uLift)*uEx-uCoarse*0.03;gl_Position=projectionMatrix*viewMatrix*vec4(xz.x,y,xz.y,1.0);}`;

export const FRAG = `
  uniform vec3 uHole,uCity[12],uCam;uniform float uCoarse,uEps,uLine,uRel,uLight,uExB,uSnow;varying vec2 vXZ;varying float vIn;
  void main(){
    if(uCoarse>0.5&&uHole.z>0.0&&all(lessThan(abs(vXZ-uHole.xy),vec2(uHole.z*0.97))))discard;
    vec2 p=ll(vXZ);vec3 m=texture2D(uM,muv(p)).rgb;vec3 cl=clim(p);float e=uEps;
    float h=fullH(p,1.0),hx=fullH(p+vec2(e,0.0),1.0),hy=fullH(p+vec2(0.0,e),1.0);
    vec3 n=normalize(vec3(-(hx-h)*uExB/(e*uProj.z)*uRel,1.0,(hy-h)*uExB/(e*uProj.w)*uRel));
    float slope=1.0-n.y,w=cl.r,ar=cl.g,lowf=nz(p/0.3),midf=nz(p/0.05+0.2);
    vec2 q=p+(vec2(nz(p/0.05),nz(p/0.05+0.5))-0.5)*0.0016;
    /* farmland patchwork */
    float fa=1.0-smoothstep(0.06,0.3,e/0.004),fa2=(1.0-smoothstep(0.06,0.3,e/0.024))*0.22;
    vec2 fg=q/0.004;vec4 r0=texture2D(uR,(floor(fg)+0.5)/256.0);if(r0.a>0.5)fg.x*=2.0;else fg.y*=2.0;vec2 fc=floor(fg),ff=fract(fg);vec4 fr=texture2D(uR,(fc+0.5)/256.0+0.31);
    vec3 soil=mix(vec3(.50,.38,.28),vec3(.30,.27,.24),cl.b);
    vec3 crop=mix(vec3(.34,.44,.24),vec3(.44,.52,.29),fr.g),fallow=vec3(.68,.62,.45);
    vec3 fld=(fr.r<0.33?soil:(fr.r<0.7?crop:fallow))*(0.86+0.28*fr.b);
    float bund=1.0-smoothstep(0.0,0.06,min(min(ff.x,1.0-ff.x),min(ff.y,1.0-ff.y)));fld=mix(fld,vec3(.33,.30,.22),bund*0.6);
    vec3 dryAvg=(soil*0.33+vec3(.39,.48,.26)*0.37+fallow*0.30)*1.12*(0.86+0.28*midf);
    vec4 r2=texture2D(uR,(floor(q/0.024)+0.5)/256.0+0.17);dryAvg*=mix(1.0,0.8+0.4*r2.r,fa2);
    vec3 dry=mix(dryAvg,mix(dryAvg,fld,0.8),fa);
    dry=mix(dry,vec3(.36,.39,.24)*(0.8+0.4*nz(p/0.004)),smoothstep(0.03,0.10,slope));
    dry=mix(dry,vec3(.55,.50,.43)*(0.8+0.4*nz(p/0.0015)),smoothstep(0.10,0.22,slope));
    /* desert: sand with dune streaks and thin scrub; cold desert is grey-brown */
    float dune=nz(vec2(p.x*0.6+p.y*0.25,p.y)/0.004);
    vec3 sand=mix(vec3(.84,.72,.50),vec3(.74,.60,.40),dune)*(0.92+0.16*nz(p/0.001));
    sand=mix(sand,vec3(.56,.50,.44)*(0.85+0.3*midf),smoothstep(2500.0,3500.0,h));
    sand=mix(sand,vec3(.58,.55,.36),smoothstep(0.55,0.8,nz(p/0.002))*0.35*(1.0-smoothstep(2500.0,3500.0,h)));
    dry=mix(dry,sand,smoothstep(0.25,0.8,ar));
    /* forest canopy */
    vec3 can=mix(vec3(.10,.24,.11),vec3(.23,.39,.17),nz(p/0.006))*(0.74+0.52*nz(p/0.0011));
    float tl=mix(1450.0,3600.0,smoothstep(27.0,30.0,p.y));
    can=mix(can,vec3(.43,.50,.27)*(0.85+0.3*midf),smoothstep(tl,tl+300.0,h)*(1.0-smoothstep(0.02,0.08,slope)));
    float fo=smoothstep(0.35,0.62,w*1.1+(lowf-0.5)*0.55+smoothstep(950.0,1400.0,h)*0.6*(1.0-ar))*(1.0-smoothstep(tl+200.0,tl+700.0,h));
    vec3 paddy=mix(vec3(.32,.50,.22),vec3(.16,.33,.15),step(0.55,fr.r))*(0.86+0.28*fr.b);paddy=mix(vec3(.24,.42,.19)*(0.85+0.3*midf),mix(paddy,vec3(.2,.3,.16),bund*0.5),fa);
    float lowl=(1.0-smoothstep(30.0,130.0,h))*smoothstep(0.5,0.8,w);
    vec3 col=mix(dry,can,fo);col=mix(col,paddy,lowl*0.8);
    /* high mountains: bare rock, then snow */
    float rk=smoothstep(tl+300.0,tl+1100.0,h);col=mix(col,vec3(.50,.46,.42)*(0.8+0.4*nz(p/0.003)),rk);
    float sn=smoothstep(uSnow-250.0,uSnow+250.0,h+(midf-0.5)*700.0)*(1.0-smoothstep(0.35,0.6,slope));col=mix(col,vec3(.94,.95,.97),sn);
    /* towns */
    float ub=0.0;for(int i=0;i<12;i++){vec3 c=uCity[i];if(c.z<=0.0)continue;float d=length((p-c.xy)*vec2(0.966,1.0))/c.z+(midf-0.5)*0.8;ub=max(ub,1.0-smoothstep(0.45,1.05,d));}
    if(ub>0.01){vec2 bg=(p+(q-p)*0.2)/0.0007,bc=floor(bg),bf=fract(bg);vec4 br=texture2D(uR,(bc+0.5)/256.0+0.63);vec3 blk=br.r<0.2?vec3(.22,.36,.20):(br.r<0.45?vec3(.62,.44,.36):mix(vec3(.56,.55,.53),vec3(.84,.82,.78),br.g));
      float stt=1.0-smoothstep(0.0,0.09,min(min(bf.x,1.0-bf.x),min(bf.y,1.0-bf.y)));blk=mix(blk,vec3(.30,.30,.31),stt);
      float ua=1.0-smoothstep(0.25,1.2,e/0.0007);col=mix(col,mix(vec3(.58,.56,.53)*(0.85+0.3*nz(p/0.01)),blk,ua),ub*0.92);}
    float diff=clamp(dot(n,normalize(vec3(-0.55,0.62,-0.42))),0.0,1.0);col*=0.62+0.74*diff;
    /* coast and sea */
    float beach=smoothstep(0.06,0.3,m.b)*(1.0-smoothstep(40.0,90.0,h));col=mix(col,vec3(.82,.76,.60),beach*0.85);
    float sea=smoothstep(0.42,0.55,m.b);vec3 sc=mix(vec3(.16,.44,.52),vec3(.07,.25,.42),smoothstep(0.55,1.0,m.b))+(nz(p/0.02)-0.5)*0.03;col=mix(col,sc,sea);
    float inS=smoothstep(0.42,0.58,m.r);
    float g=dot(col,vec3(.3,.59,.11));vec3 rich=clamp(mix(vec3(g),col,1.32)*1.06+vec3(.015,.008,-.01),0.0,1.0);
    vec3 fF=texture2D(uF,muv(p)).rgb;vec3 dim=mix(vec3(g),col,0.3+0.55*sea)*mix(0.4,0.75,sea)*(1.0-0.55*fF.g*smoothstep(0.0,0.9,uLift*uEx));
    dim=mix(dim,(mix(vec3(g),col,0.45)*0.45+vec3(0.5,0.53,0.52))*(1.0-0.28*fF.g),uLight);
    col=mix(dim,rich,inS);
    col=mix(col,vec3(1.0),m.g*0.34*uLine*inS);
    float ed=1.0-abs(m.r-0.5)*2.0;col=mix(col,vec3(1.0,.88,.42),smoothstep(0.5,1.0,ed)*(0.5+0.4*uLine));
    /* the plinth wall: yellow over red */
    float wall=smoothstep(0.02,0.12,vIn)*(1.0-smoothstep(0.9,0.99,vIn))*smoothstep(0.13,0.66,uLift*uEx);
    vec3 wc=mix(vec3(.80,.12,.20),vec3(1.0,.76,.10),smoothstep(0.35,0.65,vIn));
    col=mix(col,wc*(0.75+0.35*diff),wall);
    float dist=length(vec3(vXZ.x,(h+vIn*uLift)*uEx,vXZ.y)-uCam);col=mix(col,vec3(.60,.70,.78),(1.0-exp(-dist/(uCam.y*14.0+20.0)))*0.1);
    float a=max(inS,smoothstep(0.0,0.4,fF.r));vec2 eg=min(muv(p),1.0-muv(p))*uG.zw;a*=smoothstep(0.0,0.06*max(uG.z,uG.w),min(eg.x,eg.y));
    gl_FragColor=vec4(col,max(a,inS));}`;
