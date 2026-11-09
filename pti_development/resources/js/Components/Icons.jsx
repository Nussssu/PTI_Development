const s = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' };

export const Arrow = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" {...s} strokeWidth="1.6"><path d="M3 13L13 3M13 3H5M13 3V11" /></svg>
);
export const ArrowRight = () => (
    <svg width="18" height="18" viewBox="0 0 18 18" {...s} strokeWidth="1.6"><path d="M2 9h14m0 0l-5-5m5 5l-5 5" /></svg>
);
export const Pin = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" {...s} strokeWidth="1.8"><path d="M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="10" r="2.6" /></svg>
);
export const Units = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" {...s} strokeWidth="1.8"><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" /></svg>
);
export const Check = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" {...s}><circle cx="8" cy="8" r="7.2" strokeWidth="1.2" /><path d="M5 8.2l2 2 4-4.4" strokeWidth="1.5" /></svg>
);
export const Phone = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" {...s} strokeWidth="1.7"><path d="M5 3h3l2 5-2.5 1.5a11 11 0 006 6L15 13l5 2v3a2 2 0 01-2 2A16 16 0 013 5a2 2 0 012-2z" /></svg>
);
export const Mail = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" {...s} strokeWidth="1.7"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3.5 6l8.5 7 8.5-7" /></svg>
);
export const Office = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" {...s} strokeWidth="1.7"><path d="M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 8h2M14 8h2M8 12h2M14 12h2" /></svg>
);
export const WhatsApp = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.1-1.2c0-.1-.2-.2-.5-.3z" /></svg>
);
export const Facebook = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 8V6c0-1 .5-1.5 1.5-1.5H17V1h-3c-3 0-4 2-4 4.5V8H7.5v3.5H10V23h4V11.5h3l.5-3.5H14z" /></svg>
);
export const Instagram = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" {...s} strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" /></svg>
);
export const LinkedIn = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.01 5 2.5 2.5 0 01.01-5zM3 9h4v12H3zM9 9h3.8v1.7h.1a4.2 4.2 0 013.8-2c4 0 4.8 2.7 4.8 6.1V21h-4v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21H9z" /></svg>
);
export const Spark = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.2 9.8L24 12l-9.8 2.2L12 24l-2.2-9.8L0 12l9.8-2.2z" /></svg>
);
export const Play = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z" /></svg>
);
