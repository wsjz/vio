/// <reference types="vite/client" />

declare module '*.css' {
  const content: string;
  export default content;
}

interface Window {
  __TAURI_INTERNALS__?: {
    metadata: {
      currentWindow: { label: string };
    };
    invoke: unknown;
    convertFileSrc: unknown;
    transformCallback: unknown;
  };
}
