

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

export const ThinkingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" className="spin-icon">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" opacity=".3" />
        <path d="M20 12h2A10 10 0 0012 2v2a8 8 0 018 8z" />
    </svg>
);

// FIX: Add missing AlertIcon
export const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="alert-icon">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);

export const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 .25a.75.75 0 0 1 .673.418L9.743 3.25l2.579.375a.75.75 0 0 1 .416 1.285l-1.867 1.82.44 2.569a.75.75 0 0 1-1.088.791L8 8.975l-2.302 1.21a.75.75 0 0 1-1.088-.79l.44-2.57-1.867-1.82a.75.75 0 0 1 .416-1.285l2.579-.375L7.327.668A.75.75 0 0 1 8 .25zM4.5 11.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z" />
    </svg>
);

export const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

export const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
);

export const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
);

// FIX: Add missing CopyIcon component
export const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

export const IconPinterest = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.633 7.844 6.305 9.28.02-.18.038-.381.054-.591l.19- .79c.06-.251.11-.428.11-.428s-.03-.06-.03-.235c0-.525.31-.91.69-.91.325 0 .48.245.48.54 0 .33-.21.825-.32 1.28c-.09.385.195.705.57.705.685 0 1.225-.72 1.225-1.75 0-1.425-1.03-2.435-2.58-2.435-1.775 0-2.845 1.31-2.845 2.72 0 .345.12.72.28.9l-.12.485c-.03.12-.11.235-.11.235s-.16.645-.2.82c-.08.345-.055.75-.055.75l.005.015c.16-.07.41-.18.5-.23C9.383 17.5 10.323 16 10.323 16c.36-.61.59-1.29.59-2.015 0-.825-.4-1.515-1.125-1.515-.81 0-1.485.645-1.485 1.485 0 .385.12.63.12.63l- .42 1.775c-.17.72-.675 1.635-.675 1.635l-.005.015c-1.825-1.07-3.03-3.035-3.03-5.32 0-3.325 2.695-6.02 6.02-6.02s6.02 2.695 6.02 6.02c0 2.87-1.685 5.1-3.92 5.1-.75 0-1.455-.385-1.7- .82l-.36 1.45c-.19.78-.57 1.55-.57 1.55l.005.015c.78.23 1.58.35 2.405.35 4.418 0 8-3.582 8-8s-3.582-8-8-8z" /></svg>
);

export const IconMeta = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.023A9.954 9.954 0 0022 12z" /></svg>
);

export const IconTikTok = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-2.43.05-4.84-.95-6.43-2.8-1.59-1.87-2.32-4.35-2.1-6.78.23-2.56 1.84-4.7 3.93-5.73.53-.27 1.1-.48 1.66-.69.02 2.84-.01 5.68.01 8.53.02 1.34.43 2.63 1.15 3.71.97 1.44 2.6 2.28 4.25 2.28 1.65 0 3.28-.84 4.25-2.28.97-1.44 1.39-3.27 1.15-5.04-.24-1.78-1.18-3.35-2.45-4.43-.99-.83-2.2-1.28-3.41-1.39v-3.79c1.24.08 2.48.42 3.58 1.15.13-.13.25-.25.38-.38 1.4-1.4 2.37-3.32 2.47-5.26z" /></svg>
);

export const IconEtsy = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M9.6 18H12v-6h2.4c2.208 0 4-1.792 4-4s-1.792-4-4-4H8.1c-.06 0-.1.04-.1.1v5.5c0 .276.224.5.5.5s.5-.224.5-.5V6h3.9c1.104 0 2 .896 2 2s-.896 2-2 2H10v8h-.4c-2.208 0-4-1.792-4-4s1.792-4 4-4h.4V8.4C7.503 8.903 6 10.765 6 13c0 2.76 2.24 5 5 5h-1.4z" /></svg>
);

export const IconShopify = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 7.3a4.4 4.4 0 00-3.2-3.3c-1.3-.4-2.7-.4-4 0-2.3.7-3.8 2.8-3.8 5.2v.2h12s.3-1 .5-2.1zm-4.6 2.9H8v4.9c0 1.5 1.2 2.7 2.7 2.7h.6c1.5 0 2.7-1.2 2.7-2.7v-5zM12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm2.2 13.1c0 2.6-2.1 4.7-4.7 4.7h-.6c-2.6 0-4.7-2.1-4.7-4.7V9.7c0-3.5 2.8-6.4 6.2-7.1 1.7-.3 3.4-.3 5.1 0 3.3.9 5.5 4 5.5 7.4v.1s-1.2 2.9-2.8 3z" /></svg>
);