'use client';
import {UiIcon} from './UiIcon';
const strong=text=>text.split(/(\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith('**')?<strong key={i} className="text-white font-extrabold">{part.slice(2,-2)}</strong>:part);
export function FAQExplanation({text,probability=false}){
 return <div className="faq-explanation">{String(text).split('\n\n').map((paragraph,i)=><div key={i}>{paragraph.split('\n').map((line,j)=><p key={j} className={line.startsWith('•')?'faq-explanation-point':undefined}>{line.startsWith('•')&&<UiIcon name={j?'shield':'calendar'} tone="inherit"/>}<span>{strong(line.replace(/^•\s*/,''))}</span></p>)}</div>)}{probability&&<div className="faq-probability" aria-label="Ejemplo de pesos del sorteo"><span><UiIcon name="disc" tone="inherit"/>Propuesta reciente<strong>1.00×</strong></span><i/><span><UiIcon name="clock" tone="inherit"/>Mayor espera<strong>Hasta 1.05×</strong></span><small>El peso aumenta hasta 5%; no suma cinco puntos porcentuales de probabilidad.</small></div>}</div>;
}
