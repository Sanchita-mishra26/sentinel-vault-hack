// src/vite-env.d.ts OR src/global.d.ts
declare module '*.wav' {
  const src: string;
  export default src;
}