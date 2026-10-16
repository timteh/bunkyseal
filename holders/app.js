const LABELS={holders_real:"Real holders",holders_total:"Total holders",curve_pct:"Bonding curve %",curve_token_balance:"Tokens left on curve",tg_members:"Telegram members",x_followers:"X followers",bluesky_followers:"Bluesky followers",discord_members:"Discord members"};
const SHOW=Object.keys(LABELS);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const $=s=>document.querySelector(s);
function fail(msg){const b=$("#banner");b.hidden=false;b.textContent=msg;}
function fmt(m,v){if(v==null)return"—";if(m.endsWith("pct"))return Number(v).toFixed(2)+"%";return Math.round(Number(v)).toLocaleString();}
function pt(x){const m=/^(\d{4}-\d\d-\d\d) (\d\d:\d\d(?::\d\d)?) (EDT|EST)$/.exec(String(x||""));return m?Date.parse(m[1]+"T"+m[2]+(m[3]==="EDT"?"-04:00":"-05:00")):NaN;}
function fresh(m,d){if(!m||m.value==null||m.status!=="OK"||m.stale)return false;const t=pt(m.ts_et),g=pt(d&&d.generated_at_et);if(!isFinite(t)||!isFinite(g))return false;const h=Number(d.stale_after_hours)>0?Number(d.stale_after_hours):2;return g-t<=h*3600e3;}
function row(name,m,d){const tr=document.createElement("tr");let val;const H=name.startsWith("holders");
 if(H&&(m==null||m.value==null))val="Holder count unavailable — no free public source yet";else if(H&&!fresh(m,d))val="Holder count unavailable (latest reading not verified or stale)";else val=fmt(name,m&&m.value);
 const u=m&&m.source_url||"";const src=(m==null||m.value==null||m.status==="UNSOURCED")?"no source":/^https:\/\//.test(u)?`<a href="${esc(u)}" rel="noopener nofollow">source</a>`:(u?esc(u):"no source");
 const S=m&&(m.stale||(H&&m.status==="OK"&&m.value!=null&&!fresh(m,d))?"STALE":m.status);const st=S?`<span class="st ${esc(S)}">${esc(S)}</span>`:"";
 tr.innerHTML=`<td>${esc(LABELS[name]||name)}<br><span class="meta">last updated ${esc(m&&m.ts_et||"never")} · ${src}</span> ${st}</td><td class="v">${esc(val)}</td>`;return tr;}
function chart(pts,label,unit){const W=600,H=260;if(pts.length<2){$("#chart").textContent="Not enough data points yet.";return;}
 const cw=$("#chart").clientWidth||W,f=Math.max(12,Math.ceil(11.5*W/cw)),p=f+14,pl=Math.round(f*3.6)+6,pt0=f+8;const sd=x=>String(x).slice(5,16);
 const ys=pts.map(q=>Number(q[1]));const mn=Math.min(...ys),mx=Math.max(...ys),r=mx-mn||1;
 const P=pts.map((q,i)=>[pl+i*(W-pl-12)/(pts.length-1),H-p-(ys[i]-mn)*(H-p-pt0)/r]);
 $("#chart").innerHTML=`<svg viewBox="0 0 ${W} ${H}" font-size="${f}"><polyline fill="none" stroke="#4b5d2a" stroke-width="3" points="${P.map(a=>a.join(",")).join(" ")}"/>${P.map(a=>`<circle cx="${a[0]}" cy="${a[1]}" r="3" fill="#1b1b1b"/>`).join("")}<text x="${pl}" y="${H-4}">${esc(sd(pts[0][0]))}</text><text x="${W-4}" y="${H-4}" text-anchor="end">${esc(sd(pts[pts.length-1][0]))}</text><text x="2" y="${pt0+f/3}">${esc(fmt(unit,mx))}</text><text x="2" y="${H-p+f/3}">${esc(fmt(unit,mn))}</text></svg>`;
 $("#chart-title").textContent=label;
 $("#chart").setAttribute("aria-label",`${label}: ${pts.length} points from ${pts[0][0]} to ${pts[pts.length-1][0]}. Low ${fmt(unit,mn)}, high ${fmt(unit,mx)}, latest ${fmt(unit,ys[ys.length-1])}.`);}
fetch("data.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw 0;return r.json()}).then(d=>{
 $("#gen").textContent=(d.generated_at_et||"unknown");
 if(d.error){fail("Stats are unavailable right now: the metrics log could not be read.");document.body.classList.add("derr");}
 const M=d.metrics||{};const tb=$("#tbl tbody");
 SHOW.forEach(n=>tb.appendChild(row(n,M[n],d)));
 if(SHOW.some(n=>M[n]&&(M[n].stale||M[n].status==="STALE")))fail("Some numbers are more than 2 hours old and marked STALE.");
 const s=d.series||{};const h=(s.holders_real||[]);
 chart(s.curve_pct||[],"Bonding curve % over time","curve_pct");$("#chart-note").textContent="Holder history isn't shown here while holder counts are being verified.";
}).catch(()=>{$("#gen").textContent="Data unavailable";document.body.classList.add("derr");fail("Couldn't load the stats right now. The data file is missing or broken.");$("#chart").textContent="No data.";});
