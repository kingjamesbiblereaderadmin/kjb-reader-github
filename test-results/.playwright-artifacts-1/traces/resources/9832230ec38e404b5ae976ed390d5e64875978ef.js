import{c as n}from"./index-BA24TJaf.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=[["path",{d:"M12 10v6",key:"1bos4e"}],["path",{d:"M9 13h6",key:"1uhe8q"}],["path",{d:"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",key:"1kt360"}]],g=n("FolderPlus",l);/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=[["path",{d:"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",key:"1kt360"}]],v=n("Folder",f),c="kjb-saved-verses";function i(){try{return JSON.parse(localStorage.getItem(c)||"[]")}catch{return[]}}function d(){try{const e=JSON.parse(localStorage.getItem("kjb-saved-folders")||'["Favorites"]');return e.includes("Favorites")||e.unshift("Favorites"),e}catch{return["Favorites"]}}function h(e){const t=d();t.includes(e)||(t.push(e),localStorage.setItem("kjb-saved-folders",JSON.stringify(t)))}function u(e,t,s){return i().some(r=>r.abbr===e&&r.chapter===t&&r.verse===s)}function p(e){const t=i();u(e.abbr,e.chapter,e.verse)||(t.unshift({...e,folder:e.folder||"Favorites"}),localStorage.setItem(c,JSON.stringify(t)))}function F(e,t,s,r){const a=i().map(o=>o.abbr===e&&o.chapter===t&&o.verse===s?{...o,folder:r}:o);localStorage.setItem(c,JSON.stringify(a))}function b(e,t,s){const r=i().filter(a=>!(a.abbr===e&&a.chapter===t&&a.verse===s));localStorage.setItem(c,JSON.stringify(r))}function m(e){if(e==="Favorites")return;const t=d().filter(r=>r!==e);localStorage.setItem("kjb-saved-folders",JSON.stringify(t));const s=i().map(r=>r.folder===e?{...r,folder:"Favorites"}:r);localStorage.setItem(c,JSON.stringify(s))}export{v as F,g as a,i as b,h as c,m as d,d as g,u as i,b as r,p as s,F as u};
