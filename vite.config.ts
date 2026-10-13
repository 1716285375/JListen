import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { cpSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
export default defineConfig(({command,mode})=>{
  const remoteAudio=process.env.VITE_AUDIO_BASE_URL??loadEnv(mode,process.cwd(),'VITE_').VITE_AUDIO_BASE_URL;
  let publicRoot='',outputRoot='';
  return {
    publicDir:command==='build'&&remoteAudio?false:'public',
    plugins: [react(), tailwindcss(), ...(command==='build'&&remoteAudio?[{
      name:'external-audio-public-assets',
      configResolved(config){publicRoot=resolve(config.root,'public');outputRoot=resolve(config.root,config.build.outDir);},
      closeBundle(){cpSync(publicRoot,outputRoot,{recursive:true,filter:source=>relative(publicRoot,source).split(sep)[0]!=='audio'});},
    } satisfies import('vite').Plugin]:[])],
    test: { environment: 'jsdom', include: ['tests/unit/**/*.test.{ts,tsx}'], setupFiles: ['tests/setup.ts'] },
  };
});
