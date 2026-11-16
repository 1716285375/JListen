import { useEffect } from 'react';
import '../../vendor/sakuga/core.js';
type Effects = {
 calm:boolean;
 at:(element:HTMLElement)=>{x:number;y:number;w:number;h:number};
 ticks:(x:number,y:number,options?:Record<string,number>)=>void;
 puff:(x:number,y:number,options?:Record<string,number>)=>void;
 shards:(x:number,y:number,options?:Record<string,number>)=>void;
 sfx:(name:string,x:number,y:number,options?:Record<string,number>)=>void;
};
export function SakugaEffects(){
 useEffect(()=>{
  const fx=(window as Window & {SakugaFX?:Effects}).SakugaFX;if(!fx)return;
  const media=matchMedia('(prefers-reduced-motion: reduce)');const animations=new Map<HTMLElement,Animation>();let last=0;
  const control=(event:Event)=>event.target instanceof Element?event.target.closest<HTMLElement>('.button,.hero-cta,.text-mode button,.filter-tabs button,.exam-chips button,.pronunciation-button,.stroke-choices button'):null;
  const enabled=(element:HTMLElement|null):element is HTMLElement=>!!element&&!element.matches(':disabled,[aria-disabled=true]')&&!media.matches;
  const bounce=(element:HTMLElement,pressed=false)=>{
   animations.get(element)?.cancel();const animation=element.animate(pressed?[{transform:'scale(1)'},{transform:'scale(1.06,.82)'}]:[{transform:'scale(1.06,.82)'},{transform:'scale(.96,1.1)',offset:.4},{transform:'scale(1)'}],{duration:pressed?90:420,easing:'cubic-bezier(.2,.8,.25,1)'});
   animations.set(element,animation);animation.onfinish=()=>{if(animations.get(element)===animation)animations.delete(element);};
  };
  const down=(event:Event)=>{const el=control(event);if(enabled(el))bounce(el,true);};
  const click=(event:Event)=>{
   const el=control(event);if(!enabled(el))return;bounce(el);
   if(performance.now()-last<100)return;last=performance.now();const c=fx.at(el);
   const primary=el.matches('.hero-cta,.play-button,.button-primary');
   fx.ticks(c.x+c.w/2,c.y-c.h/2,{n:3,r:4,len:primary?16:10,dir:-1,life:.4});
   if(primary){fx.puff(c.x-c.w/2,c.y,{n:4,size:10,vx:-24,life:.6});fx.shards(c.x,c.y,{n:5,size:4,speed:100,life:.5});fx.sfx('don',c.x,c.y-c.h/2-24,{size:60,life:.55});}
   else if(el.closest('.text-mode,.filter-tabs'))fx.puff(c.x-c.w/2,c.y,{n:3,size:6,vx:-14,life:.45});
  };
  let lastSlider=0;
  const input=(event:Event)=>{const el=event.target;if(media.matches||!(el instanceof HTMLInputElement)||el.type!=='range'||performance.now()-lastSlider<100)return;lastSlider=performance.now();const r=el.getBoundingClientRect();const min=Number(el.min)||0,max=Number(el.max)||100,ratio=(Number(el.value)-min)/(max-min||1);fx.puff(r.left+scrollX+r.width*ratio,r.top+scrollY+r.height/2,{n:2,size:4,vx:-12,life:.35});};
  const clear=()=>{for(const animation of animations.values())animation.cancel();animations.clear();};
  document.addEventListener('pointerdown',down);document.addEventListener('click',click);document.addEventListener('input',input);media.addEventListener('change',clear);
  return()=>{document.removeEventListener('pointerdown',down);document.removeEventListener('click',click);document.removeEventListener('input',input);media.removeEventListener('change',clear);clear();};
 },[]);
 return null;
}
