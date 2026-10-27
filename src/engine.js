import * as pdfjsLib from 'pdfjs-dist';
import workerURL from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc=workerURL;
const SIZE=/\b(?:W|S|M|HP|C|MC)\s*\d{1,2}(?:\.\d+)?\s*[X×x]\s*\d{1,3}(?:\.\d+)?\b|\bHSS\s*\d+(?:\.\d+)?\s*[X×x]\s*\d+(?:\.\d+)?\s*[X×x]\s*(?:\d+(?:\.\d+)?|\d+\/\d+)\b/gi;
const MARK=/\b(?:BM|BEAM|GR|GIRDER|B|G)[- ]?\d{1,4}[A-Z]?\b/gi;
const normalize=s=>s.toUpperCase().replace(/\s+/g,'').replace(/×/g,'X');
export function getLevel(text){
 const s=text.toUpperCase();
 if(/\bROOF\s+(?:FRAMING|ERECTION)\s+PLAN\b|\bROOF\s+PLAN\b/.test(s))return 'ROOF';
 const m=s.match(/\b(?:LEVEL|LVL|FLOOR|L)\s*[-:]?\s*0?(\d{1,2})\b/);
 if(m)return 'L'+Number(m[1]);
 const b=s.match(/\b(?:BASEMENT|B)\s*[-:]?\s*0?(\d{1,2})\b/);
 return b?'B'+Number(b[1]):null;
}
export function parseLines(items){
 const rows=new Map();
 for(const item of items){
  const s=(item.str||'').trim(); if(!s)continue;
  const y=Math.round((item.transform?.[5]||0)/4)*4;
  if(!rows.has(y))rows.set(y,[]);
  rows.get(y).push({x:item.transform?.[4]||0,s});
 }
 return [...rows.values()].map(row=>row.sort((a,b)=>a.x-b.x).map(v=>v.s).join(' '));
}
export async function readPdf(file,onProgress=()=>{}){
 const doc=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
 const pages=[];
 try{
  for(let n=1;n<=doc.numPages;n++){
   const page=await doc.getPage(n),tc=await page.getTextContent();
   const lines=parseLines(tc.items),text=lines.join('\n');
   const level=getLevel(text)||getLevel(file.name)||null;
   const candidates=[];
   for(const line of lines){
    const sizes=[...line.matchAll(SIZE)].map(x=>normalize(x[0]));
    const marks=[...line.matchAll(MARK)].map(x=>normalize(x[0]));
    if(sizes.length===1&&marks.length===1)candidates.push({mark:marks[0],size:sizes[0]});
   }
   pages.push({page:n,level,textLength:text.length,candidates,shapes:[...new Set([...text.matchAll(SIZE)].map(m=>normalize(m[0])))]});
   page.cleanup();onProgress(n,doc.numPages);
   if(n%5===0)await new Promise(r=>setTimeout(r,0));
  }
 }finally{await doc.destroy();}
 return {name:file.name,pages};
}
export function compare(design,shop){
 const index=pages=>{
  const map=new Map();
  for(const p of pages)for(const item of p.candidates){
   const key=(p.level||'?')+'|'+item.mark;
   map.set(key,[...(map.get(key)||[]),{...item,page:p.page,level:p.level}]);
  }
  return map;
 };
 const d=index(design.pages),s=index(shop.pages),issues=[],ambiguous=[],matches=[];
 for(const [key,ds] of d){
  const ss=s.get(key);if(!ss)continue;
  if(ds.length!==1||ss.length!==1||!ds[0].level){ambiguous.push({key,reason:'Ambiguous or unknown location'});continue;}
  const a=ds[0],b=ss[0];
  const record={key,mark:a.mark,level:a.level,designSize:a.size,shopSize:b.size,designPage:a.page,shopPage:b.page};
  (a.size===b.size?matches:issues).push(record);
 }
 return {issues,matches,ambiguous,designCount:[...d.values()].reduce((n,x)=>n+x.length,0),shopCount:[...s.values()].reduce((n,x)=>n+x.length,0)};
}
