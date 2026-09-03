import{g as p}from"./publicOrigin-DLiAwV89.js";function $({abbr:e,chapter:t,verse:n,verseEnd:a,from:c}={}){if(!e||!t)return"";let r=`${p()}/read?book=${e}&chapter=${t}`;n&&(r+=`&verse=${n}`),a&&a>n&&(r+=`&verseEnd=${a}`),c&&(r+=`&from=${c}`);try{const i=localStorage.getItem("kjb-a11y-font");(i==="dyslexic"||i==="hyperlegible")&&(r+=`&font=${i}`)}catch{}return r}function f(e=""){return String(e).replace(new RegExp("(\\p{L})\\uFFFD","gu"),"$1'").replace(/\uFFFD/g,"¶").replace(/\s+/g," ").trim()}function l(e=""){return`¶ ${f(e).replace(/^[\u00B6\uFFFD]\s*/,"")}`}function g(e=""){return String(e).replace(/\s*¶\s*/g,`

¶ `).replace(/^\n+\s*/,"").trim()}function F({text:e,ref:t,url:n,title:a,subscript:c,heading:u,colophon:r}={}){const i=g(f(e)),s=[];a&&s.push(a);const o=[];return u&&o.push(f(u)),c&&o.push(l(c)),o.push(i),r&&o.push(l(r)),s.push(`“${o.join(`

`)}” - ${t} (KJB)`),n&&s.push(`Read more: <${n}>`),s.join(`

`)}function m(e,t=40){const n=Math.max(0,Math.floor((t-e.length)/2));return" ".repeat(n)+e}export{m as a,$ as b,f as c,F as f};
