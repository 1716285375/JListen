import { createElement, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
const loaders={
 button:()=>import('../../vendor/sakuga/button.js'),toggle:()=>import('../../vendor/sakuga/toggle.js'),slider:()=>import('../../vendor/sakuga/slider.js'),checkbox:()=>import('../../vendor/sakuga/checkbox.js'),radio:()=>import('../../vendor/sakuga/radio.js'),input:()=>import('../../vendor/sakuga/input.js'),tabs:()=>import('../../vendor/sakuga/tabs.js'),progress:()=>import('../../vendor/sakuga/progress.js'),toast:()=>import('../../vendor/sakuga/toast.js'),tooltip:()=>import('../../vendor/sakuga/tooltip.js')
};
export type SakugaElement=HTMLElement&{value:string|number;checked:boolean;selected:number;set:(value:number,immediate?:boolean)=>void;show:(message:string)=>void;done:()=>void};
type Props={kind:'button'|'toggle'|'slider'|'checkbox'|'radio'|'input'|'tabs'|'progress'|'toast'|'tooltip';panelId?:string;notice?:{id:number;text:string};label?:string;disabled?:boolean;text?:string;value?:string|number;checked?:boolean;selected?:number;progress?:number;min?:number;max?:number;step?:number;unit?:string;variant?:string;placeholder?:string;className?:string;children?:ReactNode;onValue?:(value:string)=>void;onToggle?:(value:boolean)=>void;onAction?:(element:SakugaElement)=>void;options?:{value:string;label:string}[]};
export function SakugaControl(props:Props){return <SakugaInstance key={props.kind} {...props}/>;}
function SakugaInstance({kind,value,checked,selected,progress,panelId,notice,onValue,onToggle,onAction,options,children,...attributes}:Props){
 const initialValue=useRef(value);
 const ref=useRef<SakugaElement>(null);const [ready,setReady]=useState(()=>!!customElements.get(`sakuga-${kind}`));const [failed,setFailed]=useState(false);
 useEffect(()=>{let active=true;void loaders[kind]().then(()=>{if(active)setReady(true);}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[kind]);
 useLayoutEffect(()=>{const el=ref.current;if(!el)return;if(value!==undefined&&String(el.value)!==String(value))el.value=value;if(checked!==undefined&&el.checked!==checked)el.checked=checked;if(selected!==undefined&&el.selected!==selected)el.selected=selected;if(progress!==undefined)el.set(progress);},[ready,value,checked,selected,progress]);
 useLayoutEffect(()=>{if(!ready||!panelId)return;ref.current?.shadowRoot?.querySelectorAll('[role=tab]').forEach((tab,index)=>{tab.id=`${panelId}-tab-${index}`;tab.setAttribute('aria-controls',panelId);});},[ready,panelId,selected]);
 useEffect(()=>{if(ready&&notice)ref.current?.show(notice.text);},[ready,notice]);
 useLayoutEffect(()=>{const el=ref.current;if(!el)return;const change=()=>{onValue?.(String(el.value));onToggle?.(el.checked);};const click=()=>onAction?.(el);el.addEventListener(kind==='input'?'input':'change',change);if(kind==='slider')el.addEventListener('input',change);el.addEventListener('click',click);return()=>{el.removeEventListener(kind==='input'?'input':'change',change);if(kind==='slider')el.removeEventListener('input',change);el.removeEventListener('click',click);};},[ready,kind,onValue,onToggle,onAction]);
 if(!ready)return createElement('span',{className:'sakuga-loading',role:failed?'status':undefined},failed?attributes.label:undefined);
 return createElement(`sakuga-${kind}`,{...attributes,ref,...(initialValue.current!==undefined?{value:initialValue.current}:{})},options?options.map(o=>createElement('option',{value:o.value,key:o.value},o.label)):children);
}
