import { useEffect, useRef } from 'react';
import type { Container } from '@tsparticles/engine';
export function HeroMotion(){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed=false,cleanup=()=>{};
    const start=async()=>{
      cleanup();if(media.matches||disposed)return;
      const [{animate,stagger},{tsParticles},{loadSlim}]=await Promise.all([import('animejs'),import('@tsparticles/engine'),import('@tsparticles/slim')]);
      if(disposed||media.matches||!ref.current)return;
      const animation=animate(ref.current.parentElement!.querySelectorAll('.hero-waves i'),{scaleY:[.6,1],duration:1500,delay:stagger(65),alternate:true,loop:true,ease:'inOutSine'});
      let particles:Container|undefined;
      cleanup=()=>{animation.revert();particles?.destroy();};
      await loadSlim(tsParticles);
      if(disposed||media.matches)return;
      particles=await tsParticles.load({element:ref.current,options:{fullScreen:{enable:false},fpsLimit:24,pauseOnBlur:true,pauseOnOutsideViewport:true,particles:{number:{value:16},color:{value:'#78916d'},opacity:{value:.25},size:{value:{min:1,max:3}},move:{enable:true,speed:.3},links:{enable:false}},detectRetina:false}});
      if(disposed||media.matches)particles?.destroy();
    };
    const change=()=>{void start().catch(()=>cleanup());};change();media.addEventListener('change',change);
    return()=>{disposed=true;media.removeEventListener('change',change);cleanup();};
  },[]);
  return <div ref={ref} className="hero-particles" aria-hidden="true"/>;
}
