import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {join} from "node:path";
import {inflateSync,deflateSync} from "node:zlib";

// Gera os ícones PWA a partir da logo original já existente no repositório.
function decodePNG(buf) {
  if (!buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw Error("A logo original não é PNG.");
  let offset=8,width=0,height=0,depth=0,type=0,interlace=0,palette=null,transparency=null;
  const idats=[];
  while(offset<buf.length) {
    const len=buf.readUInt32BE(offset),kind=buf.toString("ascii",offset+4,offset+8);
    const data=buf.subarray(offset+8,offset+8+len);offset+=len+12;
    if(kind==="IHDR"){width=data.readUInt32BE(0);height=data.readUInt32BE(4);depth=data[8];type=data[9];interlace=data[12];}
    if(kind==="PLTE")palette=data;
    if(kind==="tRNS")transparency=data;
    if(kind==="IDAT")idats.push(data);
    if(kind==="IEND")break;
  }
  if(!width||!height||width>8192||height>8192||interlace!==0||![8,16].includes(depth)||![0,2,3,4,6].includes(type))throw Error("Formato PNG original não suportado.");
  const channels={0:1,2:3,3:1,4:2,6:4}[type],sampleBytes=depth/8,bpp=channels*sampleBytes,stride=width*bpp;
  const data=inflateSync(Buffer.concat(idats)),rgba=Buffer.alloc(width*height*4);
  if(data.length<height*(stride+1))throw Error("Logo PNG truncada.");
  let previous=Buffer.alloc(stride),p=0;
  for(let y=0;y<height;y++){
    const filter=data[p++],current=Buffer.from(data.subarray(p,p+stride));p+=stride;
    for(let x=0;x<stride;x++){
      const a=x>=bpp?current[x-bpp]:0,b=previous[x],c=x>=bpp?previous[x-bpp]:0;
      let predictor=0;
      if(filter===1)predictor=a;
      else if(filter===2)predictor=b;
      else if(filter===3)predictor=Math.floor((a+b)/2);
      else if(filter===4){
        const d=a+b-c,da=Math.abs(d-a),db=Math.abs(d-b),dc=Math.abs(d-c);
        predictor=da<=db&&da<=dc?a:db<=dc?b:c;
      }else if(filter!==0)throw Error("Filtro PNG não suportado.");
      current[x]=(current[x]+predictor)&255;
    }
    for(let x=0;x<width;x++){
      const i=x*bpp,o=(y*width+x)*4,t=k=>current[i+k*sampleBytes];
      if(type===6){rgba[o]=t(0);rgba[o+1]=t(1);rgba[o+2]=t(2);rgba[o+3]=t(3);}
      else if(type===2){rgba[o]=t(0);rgba[o+1]=t(1);rgba[o+2]=t(2);rgba[o+3]=255;}
      else if(type===0||type===4){rgba[o]=rgba[o+1]=rgba[o+2]=t(0);rgba[o+3]=type===4?t(1):255;}
      else{const k=current[i];rgba[o]=palette?.[k*3]??0;rgba[o+1]=palette?.[k*3+1]??0;rgba[o+2]=palette?.[k*3+2]??0;rgba[o+3]=transparency?.[k]??255;}
    }
    previous=current;
  }
  return {width,height,rgba};
}
const table=Uint32Array.from({length:256},(_,i)=>{
 let c=i;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;
});
function chunk(name,data){
 const label=Buffer.from(name),length=Buffer.alloc(4),crc=Buffer.alloc(4);
 length.writeUInt32BE(data.length);
 let c=0xffffffff;
 for(const b of Buffer.concat([label,data]))c=table[(c^b)&255]^(c>>>8);
 crc.writeUInt32BE((c^0xffffffff)>>>0);
 return Buffer.concat([length,label,data,crc]);
}
function encode(size,pixels){
 const h=Buffer.alloc(13);h.writeUInt32BE(size,0);h.writeUInt32BE(size,4);h[8]=8;h[9]=6;
 const scan=Buffer.alloc(size*(size*4+1));
 for(let y=0;y<size;y++)pixels.copy(scan,y*(size*4+1)+1,y*size*4,(y+1)*size*4);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",h),chunk("IDAT",deflateSync(scan,{level:9})),chunk("IEND",Buffer.alloc(0))]);
}
function makeIcon(source,size){
 const out=Buffer.alloc(size*size*4,255);
 const ratio=Math.min(size*.9/source.width,size*.9/source.height);
 const w=Math.round(source.width*ratio),h=Math.round(source.height*ratio);
 const left=Math.floor((size-w)/2),top=Math.floor((size-h)/2);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const sx=Math.min(source.width-1,Math.floor((x+.5)/ratio));
   const sy=Math.min(source.height-1,Math.floor((y+.5)/ratio));
   const a=(sy*source.width+sx)*4,b=((top+y)*size+left+x)*4,alpha=source.rgba[a+3]/255;
   for(let k=0;k<3;k++)out[b+k]=Math.round(source.rgba[a+k]*alpha+255*(1-alpha));
   out[b+3]=255;
 }
 return encode(size,out);
}
const source=decodePNG(readFileSync(join("public","logo-ebd-manager.png")));
mkdirSync(join("public","icons"),{recursive:true});
for(const size of [180,192,512]){
 const file=join("public","icons","ebd-original-"+size+".png");
 writeFileSync(file,makeIcon(source,size));
 console.log("[EBD PWA] Logo original "+size+"x"+size+" pronta.");
}
