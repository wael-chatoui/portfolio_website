'use client';
import { useState } from 'react';
export default function InvoiceOriginalUpload({name,onFile}:{name?:string;onFile:(data:Record<string,string>)=>void}) {
  const [error,setError]=useState('');
  async function select(file?:File) {
    if(!file)return;
    if(file.size>2000000){setError('Choisis un PDF de moins de 2 Mo.');return;}
    const bytes=new Uint8Array(await file.arrayBuffer());
    if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-'){setError('Ce fichier n’est pas un PDF.');return;}
    let value='';for(let i=0;i<bytes.length;i+=8192)value+=String.fromCharCode(...bytes.subarray(i,i+8192));
    onFile({sourcePdf:btoa(value),sourceName:file.name});setError('');
  }
  return <div className="invoice-original-upload"><label className="invoice-field"><span>PDF original *</span><input type="file" accept="application/pdf,.pdf" onChange={e=>void select(e.target.files?.[0])}/></label>{name&&<p>{name}</p>}{error&&<p role="alert">{error}</p>}</div>;
}
