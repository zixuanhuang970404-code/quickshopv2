import React,{useState} from 'react';
import{createRoot}from'react-dom/client';
import{readPdf,compare}from'./engine.js';
import './style.css';
function App(){
 const[design,setDesign]=useState(null),[shop,setShop]=useState(null),[status,setStatus]=useState(''),[results,setResults]=useState(null),[busy,setBusy]=useState(false);
 const[filter,setFilter]=useState('issues');
 const[selected,setSelected]=useState(null);
 async function run(){
  if(!design||!shop)return;
  setBusy(true);setResults(null);setStatus('Reading structural drawings...');
  try{
   const a=await readPdf(design,(n,t)=>setStatus('Structural PDF: page '+n+' / '+t));
   const b=await readPdf(shop,(n,t)=>setStatus('Shop PDF: page '+n+' / '+t));
   setResults(compare(a,b));setStatus('Comparison complete.');
  }catch(e){setStatus('Error: '+e.message)}finally{setBusy(false)}
 }
 function csv(){
  if(!results)return;
  const rows=[['Level','Member mark','Structural size','Shop size','Structural PDF page','Shop PDF page','Review comment'],...results.issues.map(x=>[x.level,x.mark,x.designSize,x.shopSize,x.designPage,x.shopPage,'VERIFY '+x.mark+' SIZE. SHOP SHOWS '+x.shopSize+'; STRUCTURAL DRAWING SHOWS '+x.designSize+'.'])];
  const data=rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
  const u=URL.createObjectURL(new Blob(['\uFEFF'+data],{type:'text/csv'}));const a=document.createElement('a');a.href=u;a.download='framing-size-review.csv';a.click();URL.revokeObjectURL(u);
 }
 const rows=results?(filter==='issues'?results.issues:filter==='matches'?results.matches:results.ambiguous):[];
 return <main>
  <header className="hero"><div><p className="eyebrow">STRUCTURAL ENGINEERING · SHOP DRAWING QA</p><h1>Steel Framing Checker</h1><p>Compare framing sizes between engineer-issued structural drawings and steel shop drawings.</p></div><div className="pill">Prototype · Engineer verification required</div></header>
  <section className="uploadgrid"><label className="upload"><strong>01 · Structural drawings</strong><span>Engineer of Record PDF</span><input type="file" accept=".pdf,application/pdf" onChange={e=>{setDesign(e.target.files[0]||null);setResults(null)}}/><em>{design?.name||'Choose structural PDF'}</em></label><label className="upload"><strong>02 · Steel shop drawings</strong><span>Fabricator PDF</span><input type="file" accept=".pdf,application/pdf" onChange={e=>{setShop(e.target.files[0]||null);setResults(null)}}/><em>{shop?.name||'Choose shop PDF'}</em></label></section>
  <section className="panel controls"><div><h2>Automatic framing-size review</h2><p>Levels and member marks are extracted automatically. No manual floor selection.</p></div><button disabled={!design||!shop||busy} onClick={run}>{busy?'Analyzing…':'Compare PDFs'}</button></section>
  {status&&<p className="status" role="status">{status}</p>}
  {results&&<><section className="stats"><article><b>{results.issues.length}</b><span>Size mismatch candidates</span></article><article><b>{results.matches.length}</b><span>Matching marked members</span></article><article><b>{results.ambiguous.length}</b><span>Unresolved mark matches</span></article></section>
  <section className="panel"><div className="resultbar"><div><h2>Review findings</h2><p>Only matched level + uniquely identified member mark pairs can produce size candidates.</p></div><button className="light" onClick={csv}>Export mismatch CSV</button></div><div className="tabs">{[['issues','Size mismatches'],['matches','Matches'],['ambiguous','Needs verification']].map(([id,label])=><button key={id} className={filter===id?'active':''} onClick={()=>setFilter(id)}>{label}</button>)}</div><div className="tablewrap"><table><thead><tr>{filter==='ambiguous'?<><th>Member key</th><th>Issue</th></>:<><th>Level</th><th>Member mark</th><th>Design size</th><th>Shop size</th><th>PDF pages</th><th>Action</th></>}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.key+i}>{filter==='ambiguous'?<><td>{r.key}</td><td>{r.reason}</td></>:<><td>{r.level}</td><td><strong>{r.mark}</strong></td><td>{r.designSize}</td><td className={filter==='issues'?'bad':''}>{r.shopSize}</td><td>Design {r.designPage} / Shop {r.shopPage}</td><td><button className="textbutton" onClick={()=>setSelected(r)}>View comment</button></td></>}</tr>)}{!rows.length&&<tr><td colSpan="6" className="empty">No findings in this category. This is not proof that all framing is correct.</td></tr>}</tbody></table></div></section></>}
  {selected&&<div className="overlay" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}>✕</button><h2>Framing size review comment</h2><p>VERIFY MEMBER {selected.mark} SIZE AT {selected.level}. STRUCTURAL DRAWING INDICATES {selected.designSize}; SHOP DRAWING INDICATES {selected.shopSize}. REFER TO STRUCTURAL PDF PAGE {selected.designPage} AND SHOP PDF PAGE {selected.shopPage}. CONFIRM MEMBER LOCATION AND MARK BEFORE ISSUING COMMENT.</p><button onClick={()=>navigator.clipboard?.writeText('VERIFY MEMBER '+selected.mark+' SIZE. STRUCTURAL: '+selected.designSize+'; SHOP: '+selected.shopSize+'.')}>Copy comment</button></div></div>}
  <footer>Browser-only PDF processing; no drawings uploaded to a server. Text-based PDF prototype: scanned drawings, nonmatching member marks, and geometry-based grid matching are not supported. A zero-mismatch result does not certify the drawings.</footer>
 </main>
}
createRoot(document.getElementById('root')).render(<App/>);
