import{r as i,j as t}from"./index-D3fv15Yl.js";import{o as y,p as f,q as x,r as S,_ as w,t as a,M as j,L as k,O as g,S as M}from"./components-DF02m5MT.js";/**
 * @remix-run/react v2.17.4
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */let l="positions";function v({getKey:r,...c}){let{isSpaMode:h}=y(),o=f(),p=x();S({getKey:r,storageKey:l});let u=i.useMemo(()=>{if(!r)return null;let e=r(o,p);return e!==o.key?e:null},[]);if(h)return null;let d=((e,m)=>{if(!window.history.state||!window.history.state.key){let s=Math.random().toString(32).slice(2);window.history.replaceState({key:s},"")}try{let n=JSON.parse(sessionStorage.getItem(e)||"{}")[m||window.history.state.key];typeof n=="number"&&window.scrollTo(0,n)}catch(s){console.error(s),sessionStorage.removeItem(e)}}).toString();return i.createElement("script",w({},c,{suppressHydrationWarning:!0,dangerouslySetInnerHTML:{__html:`(${d})(${a(JSON.stringify(l))}, ${a(JSON.stringify(u))})`}}))}const O="/assets/workstation-BNwXvRHo.css",L=()=>[{rel:"stylesheet",href:O},{rel:"stylesheet",href:"https://cdn.shopify.com/static/fonts/inter/v4/styles.css"}];function N(){return t.jsxs("html",{children:[t.jsxs("head",{children:[t.jsx("meta",{charSet:"utf-8"}),t.jsx("meta",{name:"viewport",content:"width=device-width,initial-scale=1"}),t.jsx("link",{rel:"preconnect",href:"https://cdn.shopify.com/"}),t.jsx(j,{}),t.jsx(k,{})]}),t.jsxs("body",{children:[t.jsx(g,{}),t.jsx(v,{}),t.jsx(M,{})]})]})}export{N as default,L as links};
