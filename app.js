const C={"Logement":"#000","Temple / Culture":"#8e44ad","Parc / Nature":"#27ae60","Voitures":"#c0392b","Pokémon / Anime":"#e1b100","Football / Sport":"#2980b9","Café":"#795548","Marché / Food":"#e67e22","Quartier":"#16a085","Transport":"#7f8c8d"};
const $=id=>document.getElementById(id);
const LS=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')}catch(e){return {}}},SV=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){toast('⚠️ Mémoire du téléphone pleine')}};
const done=LS('jp26done'),costA=LS('jp26costA'),costT=LS('jp26costT'),booked=LS('jp26booked');let rate=+(localStorage.getItem('jp26rate')||170);
const ca=i=>costA[i]!==undefined?+costA[i]:D[i][8],ct=d=>costT[d]!==undefined?+costT[d]:(J[d]?J[d][3]:0);
const yen=n=>Math.round(n).toLocaleString('fr-FR')+' ¥',eur=n=>Math.round(n/rate).toLocaleString('fr-FR')+' €';
const ADDR={75:"1-178 Setogawa-cho, Owariasahi-shi, Aichi"};
const qd=i=>ADDR[i]?encodeURIComponent(ADDR[i]):`${D[i][5]},${D[i][6]}`;
const gmu=d=>`https://www.google.com/maps/search/?api=1&query=${qd(D.indexOf(d))}`,gm=d=>`<a target=_blank href="${gmu(d)}">📍</a>`;
const gdir=i=>`https://www.google.com/maps/dir/?api=1&destination=${qd(i)}&travelmode=transit`;
function frDate(dd){const [j,m]=dd.split('/');return new Date(2026,m-1,j).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
function toast(t,ms){const e=$('toast');e.textContent=t;e.style.display='block';clearTimeout(e._t);e._t=setTimeout(()=>e.style.display='none',ms||3500)}
const days=[...new Set(D.map(d=>d[0]))],zones=[...new Set(D.map(d=>d[2]))];
function dayCost(dd){const a=D.reduce((s,d,i)=>s+(d[0]==dd?ca(i):0),0),t=ct(dd);return {a,t,tot:a+t}}
const isMobile=()=>window.matchMedia('(max-width:899px)').matches;
// ---- Réservations
const needRes=i=>RES[i]&&RES[i][0]!='L';
function rBadge(i){const r=RES[i];if(!r)return '';const ok=booked[i];const l=RL[r[0]];return `<span class="rb${ok?' ok':''}" style="background:${l[1]}" title="${r[1]}">${ok?'✅ Réservé':'🎟️ '+l[0].slice(2).trim()}</span>`}
function rLinks(i){const r=RES[i];if(!r||!r[3].length)return '';return `<span class="rlinks">${r[3].map(x=>`<a target=_blank href="${x[1]}">🔗 ${x[0]}${x[2]?'':' *'}</a>`).join('')}</span>`}
function rBox(i){const r=RES[i];if(!r)return '';const l=RL[r[0]];return `<div class="rbox" style="border-color:${l[1]};background:${l[1]}14">🎟️ <b>${l[0]} :</b> ${r[1]}. <small>${r[2]}</small><br>${rLinks(i)||'<small>Pas de lien de réservation en ligne : contact direct.</small>'} ${r[0]=='L'?'':`<label style="font-size:12px;white-space:nowrap"><input type="checkbox" data-bk="${i}" ${booked[i]?'checked':''}> Réservé ✓</label>`}</div>`}
function renderResa(){const ids=Object.keys(RES).map(Number).sort((a,b)=>a-b),need=ids.filter(needRes);
 const cnt=k=>ids.filter(i=>RES[i][0]==k).length,nb=need.filter(i=>booked[i]).length;
 $('resa').innerHTML=`<div class="rkpi"><div><b style="color:#c0392b">${cnt('U')}</b>🔴 Urgentes</div><div><b style="color:#e67e22">${cnt('O')}</b>🟠 Obligatoires</div><div><b style="color:#d4a017">${cnt('C')}</b>🟡 Conseillées</div><div><b style="color:#27ae60">${nb} / ${need.length}</b>✅ Réservées</div></div>
<p class="note">Coche « Réservé ✓ » au fur et à mesure : c'est sauvegardé sur l'appareil et repris partout. Les liens marqués * sont à vérifier.</p>`+
 ids.map(i=>{const r=RES[i],l=RL[r[0]],d=D[i];return `<div class="rcard" style="border-left:5px solid ${l[1]};${booked[i]?'background:#eefaf1':''}"><span class="rb" style="background:${l[1]};margin:0">${l[0]}</span> <a href="#" data-go="${d[0]}">${d[0]}</a> · ${d[1]}<br><b>${d[3]}</b><br><b>${r[1]}</b><br><small>${r[2]}</small><br>${rLinks(i)||'<small>Contact direct</small>'}${r[0]=='L'?'':`<br><label><input type="checkbox" data-bk="${i}" ${booked[i]?'checked':''}> Réservé ✓</label>`}</div>`}).join('')}
// ---- Trajets
function hav(a,b){const R=6371000,r=Math.PI/180,dl=(b[0]-a[0])*r,dg=(b[1]-a[1])*r,x=Math.sin(dl/2)**2+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dg/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
const fd=m=>m<1000?Math.round(m/10)*10+' m':(m/1000).toFixed(m<10000?1:0).replace('.',',')+' km';
const fm=s=>{const m=Math.round(s/60);return m<60?m+' min':Math.floor(m/60)+' h '+String(m%60).padStart(2,'0')};
function origin(i){const d=D[i],p=D[i-1];if(p&&p[0]==d[0])return [p[5],p[6],p[3]];const s=START[d[0]];return s?s:null}
function pieces(i){const t=TR[i];if(!t)return null;const o=origin(i);if(!o)return null;
 const segs=typeof t[0]==='string'?[t[0]]:t[0],dest=[D[i][5],D[i][6]];let cur=[o[0],o[1]],pend=null;const out=[];
 const conn=to=>{if(pend||hav(cur,to)>150)out.push({m:pend||'w',a:cur,b:to,k:out.length});pend=null};
 segs.forEach(s=>{if(typeof s==='string'){pend=s;return}const pts=s.slice(2).map(n=>ST[n]);conn(pts[0]);out.push({m:s[0],line:s[1],names:s.slice(2),pts,k:out.length});cur=pts[pts.length-1]});
 conn(dest);return out}
const RC=LS('jp26route');
function rkey(p){return p.m+':'+p.a.map(v=>v.toFixed(4))+':'+p.b.map(v=>v.toFixed(4))}
async function osrm(p){const k=rkey(p);if(RC[k])return RC[k];if(hav(p.a,p.b)<30)return null;if(!navigator.onLine)return null;
 const q=`${p.a[1]},${p.a[0]};${p.b[1]},${p.b[0]}?overview=full&geometries=geojson`;
 const urls=p.m=='w'?['https://routing.openstreetmap.de/routed-foot/route/v1/driving/'+q]:['https://routing.openstreetmap.de/routed-car/route/v1/driving/'+q,'https://router.project-osrm.org/route/v1/driving/'+q];
 for(const u of urls){try{const r=await fetch(u);if(!r.ok)continue;const j=await r.json();if(!j.routes||!j.routes[0])continue;
  let c=j.routes[0].geometry.coordinates.map(x=>[+x[1].toFixed(5),+x[0].toFixed(5)]);if(c.length>300){const n=Math.ceil(c.length/300);c=c.filter((_,i)=>i%n==0||i==c.length-1)}
  const res={c,d:Math.round(j.routes[0].distance),t:Math.round(p.m=='w'?j.routes[0].distance/1.25:j.routes[0].duration)};RC[k]=res;SV('jp26route',RC);return res}catch(e){}}
 return null}
function railLen(p){let s=0;for(let k=1;k<p.pts.length;k++)s+=hav(p.pts[k-1],p.pts[k]);return s}
function legHTML(i){const ps=pieces(i);if(!ps)return '';const t=TR[i];
 const segs=ps.map(p=>{const M=MODE[p.m]||MODE.w;
  if(p.names)return `<span class="seg"><span class="mchip" style="background:${M[2]}"></span>${M[0]} <b>${p.line}</b> : ${p.names.join(' → ')} <span class="ld">· ~${fd(railLen(p))}</span></span>`;
  const k=rkey(p),r=RC[k],est=hav(p.a,p.b)*(p.m=='w'?1.3:1.4);
  return `<span class="seg"><span class="mchip" style="background:${M[2]}"></span>${M[0]} ${M[1]} <span class="ld" data-rk="${k}">· ${r?fd(r.d)+' · '+fm(r.t):'~'+fd(est)+' (estimé)'}</span></span>`}).join('');
 return `<div class="leg" data-leg="${i}">${segs}${t[1]?`<span class="door">${t[1]}</span>`:''}</div>`}
// ---- Carte
const TILE='https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
const HASMAP=typeof L!=='undefined';let map=null,markers=[],legLayer=null,legGroups={},drawTok=0,meM=null,meC=null,watchId=null,firstFix=false;
if(HASMAP){map=L.map('map',{zoomControl:!isMobile(),tap:true}).setView([35.6,138.2],7);
const fonds={"Plan (Esri)":L.tileLayer(TILE,{maxZoom:19,attribution:'Tiles © Esri'}),
"Topographique (Esri)":L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles © Esri'}),
"Satellite (Esri)":L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles © Esri'})};
fonds["Plan (Esri)"].addTo(map);L.control.layers(fonds,null,{position:'topright'}).addTo(map);
L.control.scale({metric:true,imperial:false,position:'bottomleft',maxWidth:160}).addTo(map);
legLayer=L.layerGroup().addTo(map);
const lg=L.control({position:'bottomright'});lg.onAdd=()=>{const d=L.DomUtil.create('div','mapleg'+(isMobile()?' min':''));
 d.innerHTML='<span class="tg">🧭 Légende ▾</span><div class="full">'+Object.values(MODE).map(m=>`<i style="background:${m[2]}"></i>${m[0]} ${m[1]}`).join('<br>')+'<br><small>Pied / voiture : itinéraire réel<br>Rail : tracé gare à gare</small><br>🎟️ = réservation à faire</div>';
 d.querySelector('.tg').onclick=()=>d.classList.toggle('min');L.DomEvent.disableClickPropagation(d);return d};lg.addTo(map);
const loc=L.control({position:'topleft'});loc.onAdd=()=>{const b=L.DomUtil.create('button','mbtn');b.id='locBtn';b.title='Ma position';b.innerHTML='📍';
 L.DomEvent.disableClickPropagation(b);b.onclick=toggleLoc;return b};loc.addTo(map);}
else $('map').innerHTML='<div style="padding:30px"><h3>⚠️ Carte indisponible</h3>Ouvre l\'appli une première fois avec une connexion Internet pour qu\'elle soit mise en mémoire.</div>';
function toggleLoc(){const b=$('locBtn');
 if(watchId!==null){navigator.geolocation.clearWatch(watchId);watchId=null;b.classList.remove('on');if(meM){map.removeLayer(meM);map.removeLayer(meC);meM=meC=null}return}
 if(!navigator.geolocation){toast('Géolocalisation non disponible');return}
 b.classList.add('on');firstFix=true;toast('📍 Recherche de ta position…');
 watchId=navigator.geolocation.watchPosition(p=>{const ll=[p.coords.latitude,p.coords.longitude];
  if(!meM){meC=L.circle(ll,{radius:p.coords.accuracy,color:'#1a73e8',weight:1,fillOpacity:.12}).addTo(map);meM=L.marker(ll,{icon:L.divIcon({html:'<div class="me"></div>',className:'',iconSize:[18,18],iconAnchor:[9,9]}),zIndexOffset:2000}).bindPopup('Tu es ici').addTo(map)}
  else{meM.setLatLng(ll);meC.setLatLng(ll).setRadius(p.coords.accuracy)}
  if(firstFix){firstFix=false;setView('map');map.setView(ll,Math.max(map.getZoom(),16))}},
 e=>{toast('Position refusée ou indisponible : autorise la localisation pour l\'appli.');b.classList.remove('on');watchId=null},{enableHighAccuracy:true,maximumAge:5000,timeout:20000})}
function icon(c,lodg,n,res){const s=lodg?24:20;const b=res?`<div style="position:absolute;top:-10px;right:-12px;font-size:14px;line-height:1">${res}</div>`:'';return L.divIcon({html:`<div style="position:relative;background:${c};width:${s}px;height:${s}px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 3px #000;color:#fff;font-size:10.5px;font-weight:bold;display:flex;align-items:center;justify-content:center">${n||''}${b}</div>`,className:'',iconSize:[s,s],iconAnchor:[s/2,s/2]})}
function styleOf(m){const c=(MODE[m]||MODE.w)[2];return m=='w'?{color:c,weight:4,dashArray:'2 7',lineCap:'round'}:m=='S'?{color:c,weight:6}:{color:c,weight:5,opacity:.9}}
async function drawLegs(idxs){const tok=++drawTok;legLayer.clearLayers();legGroups={};const todo=[];
 idxs.forEach(i=>{const ps=pieces(i);if(!ps)return;const g=L.featureGroup().addTo(legLayer);legGroups[i]=g;
  ps.forEach(p=>{if(p.names){L.polyline(p.pts,styleOf(p.m)).bindTooltip(`${MODE[p.m][0]} ${p.line}`,{sticky:true}).addTo(g);
    p.pts.forEach((pt,k)=>L.circleMarker(pt,{radius:k==0||k==p.pts.length-1?6:4,color:'#fff',weight:2,fillColor:MODE[p.m][2],fillOpacity:1}).bindTooltip(p.names[k],{className:'stlab',permanent:k==0||k==p.pts.length-1,direction:'top',offset:[0,-6]}).addTo(g))}
   else{const k=rkey(p),r=RC[k];const ln=L.polyline(r?r.c:[p.a,p.b],r?styleOf(p.m):{...styleOf(p.m),opacity:.5}).bindTooltip(`${MODE[p.m][0]} ${MODE[p.m][1]}${r?' · '+fd(r.d)+' · '+fm(r.t):''}`,{sticky:true}).addTo(g);if(!r)todo.push([p,ln])}})});
 for(const [p,ln] of todo){if(tok!==drawTok)return;const r=await osrm(p);if(tok!==drawTok)return;
  if(r){ln.setLatLngs(r.c);ln.setStyle({...styleOf(p.m),opacity:.9});ln.setTooltipContent(`${MODE[p.m][0]} ${MODE[p.m][1]} · ${fd(r.d)} · ${fm(r.t)}`);
   document.querySelectorAll(`[data-rk="${rkey(p)}"]`).forEach(e=>e.textContent='· '+fd(r.d)+' · '+fm(r.t))}
  await new Promise(s=>setTimeout(s,250))}}
// ---- Filtres
$('day').innerHTML='<option value="">Tous les jours</option>'+days.map(d=>`<option value="${d}">${d} – ${J[d]?J[d][0]:''}</option>`).join('');
$('zone').innerHTML='<option value="">Toutes les zones</option>'+zones.map(z=>`<option>${z}</option>`).join('');
const todayKey=(()=>{const n=new Date();return String(n.getDate()).padStart(2,'0')+'/'+String(n.getMonth()+1).padStart(2,'0')})();
function renderChips(){const v=$('day').value;$('chips').innerHTML=`<span class="chip ${v?'':'on'}" data-day="">Tous</span>`+days.map(d=>{const [j,m]=d.split('/');const w=new Date(2026,m-1,j).toLocaleDateString('fr-FR',{weekday:'short'}).replace('.','');return `<span class="chip ${v==d?'on':''} ${d==todayKey?'today':''}" data-day="${d}">${w} ${+j}/${+m}</span>`}).join('');
 const on=$('chips').querySelector('.chip.on');if(on)on.scrollIntoView({inline:'center',block:'nearest'})}
$('chips').onclick=e=>{const c=e.target.closest('.chip');if(!c)return;$('day').value=c.dataset.day;render()};
let off=new Set();
$('legend').innerHTML=Object.entries(C).map(([k,v])=>`<span class="tag" style="background:${v}" data-k="${k}">${k}</span>`).join('');
$('legend').onclick=e=>{const k=e.target.dataset.k;if(!k)return;off.has(k)?off.delete(k):off.add(k);e.target.classList.toggle('off');render()};
function filtered(){const q=$('q').value.toLowerCase();return D.map((d,i)=>[d,i]).filter(([d,i])=>(!$('day').value||d[0]==$('day').value)&&(!$('zone').value||d[2]==$('zone').value)&&!off.has(d[4])&&(!$('gemOnly').checked||d[10])&&(!$('resOnly').checked||needRes(i))&&d.join(' ').toLowerCase().includes(q))}
function render(){const rows=filtered();renderChips();
if(HASMAP){markers.forEach(m=>map.removeLayer(m));legLayer.clearLayers();drawTok++}markers=[];
$('tb').innerHTML=rows.map(([d,i])=>`<tr data-i="${i}" class="${done[i]?'done':''}"><td><input type="checkbox" data-c="${i}" ${done[i]?'checked':''}></td><td>${d[0]}</td><td>${d[1]}</td><td>${d[2]}</td><td>${d[10]?'<span class=gem>⭐ </span>':''}<b>${d[3]}</b></td><td><span class="tag" style="background:${C[d[4]]}">${d[4]}</span></td><td>${d[7]}</td><td><input class="ce" type="number" inputmode="numeric" step="100" data-ca="${i}" value="${ca(i)}"></td><td>${RES[i]?rBadge(i)+'<br>'+rLinks(i):'—'}</td><td>${d[9]} ${gm(d)}</td></tr>`).join('');
const by={};rows.forEach(r=>(by[r[0][0]]=by[r[0][0]]||[]).push(r));
$('prog').innerHTML=Object.keys(by).map(dd=>{const j=J[dd]||["","","",0,"",""],c=dayCost(dd);let n=0;
const nr=by[dd].filter(([d,i])=>needRes(i)&&!booked[i]).length;
const steps=by[dd].map(([d,i])=>`${legHTML(i)}<div class="step" data-i="${i}"><span class="hr">${d[1]}</span><span class="num" style="background:${C[d[4]]}">${++n}</span><div style="flex:1;min-width:0">${d[10]?'⭐ ':''}<b>${d[3]}</b><span class="pill">⏱ ${d[7]}</span>${ca(i)?`<span class="pill">💴 ${yen(ca(i))}</span>`:''}${rBadge(i)}<br><small>${d[2]} · ${d[9]} ${gm(d)} <a target=_blank href="${gdir(i)}">🧭 Y aller</a></small>${rBox(i)}</div></div>`).join('');
return `<div class="dcard"><div class="dhead" data-d="${dd}"><div><b>${frDate(dd)}</b>${dd==todayKey?' <span class="cost">AUJOURD\'HUI</span>':''}<br><small>${j[0]}</small></div><div style="text-align:right"><span class="cost">≈ ${yen(c.tot)}</span><br><small>${nr?`🎟️ ${nr} à réserver · `:''}<span data-mapday="${dd}" style="text-decoration:underline">🗺️ Carte du jour</span></small></div></div><div class="dbody">
<div class="meta"><div>🏠 <b>Nuit :</b> ${j[1]}</div><div>💰 <b>Activités :</b> ${yen(c.a)} · <b>Transport :</b> ${yen(c.t)} <small>(${eur(c.tot)})</small></div></div>
<div class="meta" style="grid-template-columns:1fr"><div>🚆 <b>Itinéraire :</b> ${j[2]}</div></div>
<div class="mom">📍 Déroulé de la journée</div><p class="note">🏁 Départ : ${(START[dd]||[,,'—'])[2]} · Blocs bleus = trajet vers l'étape suivante (touche-les pour les voir sur la carte).</p>${steps}
<div class="tr">🚆 <b>Conseil de l'expert transport :</b> ${j[4]}</div>
${j[5]?`<div class="tip">💡 <b>Le conseil du guide :</b> ${j[5]}</div>`:''}</div></div>`}).join('')||'<p>Aucune activité pour ces filtres.</p>';
if(HASMAP){const num={};rows.forEach(([d,i])=>{num[d[0]]=(num[d[0]]||0)+1;
const r=RES[i],rk=r&&r[0]!='L'?(booked[i]?'✅':'🎟️'):'';
const pop=`<b>${d[3]}</b><br>${frDate(d[0])} · ${d[1]} · ${d[7]}<br>💴 ${yen(ca(i))}<br><i>${d[9]}</i>${r?`<div style="margin-top:4px">${rBadge(i)}<br><small>${r[1]}</small><br>${rLinks(i)}</div>`:''}<br><a target=_blank href="${gdir(i)}">🧭 Y aller (Google Maps)</a> · <a target=_blank href="${gmu(d)}">📍 Lieu</a>`;
const m=L.marker([d[5],d[6]],{icon:icon(C[d[4]],d[4]=='Logement',$('day').value?num[d[0]]:'',rk),zIndexOffset:500}).bindPopup(pop,{maxWidth:280}).addTo(map);m.i=i;markers.push(m)});
if($('day').value)drawLegs(rows.map(r=>r[1]));fitAll(rows)}
renderResa();renderBudget();renderTransp();}
function fitAll(rows){if(!HASMAP||!markers.length)return;const b=L.featureGroup(markers).getBounds();if($('day').value){const s=START[$('day').value];if(s&&rows.length&&rows[0][1]>0&&D[rows[0][1]-1][0]!=$('day').value)b.extend([s[0],s[1]])}map.fitBounds(b.pad(.15),{maxZoom:15})}
function renderBudget(){const list=days.map(d=>({d,...dayCost(d)})),tot=list.reduce((s,x)=>s+x.tot,0),ta=list.reduce((s,x)=>s+x.a,0),tt=list.reduce((s,x)=>s+x.t,0),mx=Math.max(...list.map(x=>x.tot)),top=list.slice().sort((a,b)=>b.tot-a.tot)[0];
$('budget').innerHTML=`<div class="kpi"><div>Total voyage<b>${yen(tot)}</b>${eur(tot)}</div><div>Activités<b>${yen(ta)}</b>${eur(ta)}</div><div>Transports<b>${yen(tt)}</b>${eur(tt)}</div><div>Moyenne / jour<b>${yen(tot/list.length)}</b>${eur(tot/list.length)}</div></div>
<p class="note">Taux : 1 € = <input class="ce" type="number" inputmode="decimal" id="rate" value="${rate}" style="width:64px"> ¥ · Jour le plus cher : <b>${top.d}</b> (${yen(top.tot)}). Estimations 2026 par personne, hors logement, repas classiques, location de voiture et achats. Les coûts de transport sont modifiables.</p>
<p class="note"><span class="tag" style="background:#bc002d">Activités</span> <span class="tag" style="background:#2980b9">Transport</span></p>
<div class="tw"><table><thead><tr><th>Date</th><th class="hide-m">Thème</th><th style="width:30%">Répartition</th><th>Activ.</th><th>Transp. ¥</th><th>Total</th></tr></thead><tbody>${list.map(x=>`<tr><td><a href="#" data-go="${x.d}">${x.d}</a></td><td class="hide-m">${J[x.d]?J[x.d][0]:''}</td><td><div class="bar" style="width:${Math.max(4,x.tot/mx*100)}%"><i style="background:#bc002d;width:${x.tot?x.a/x.tot*100:0}%"></i><i style="background:#2980b9;width:${x.tot?x.t/x.tot*100:0}%"></i></div></td><td>${yen(x.a)}</td><td><input class="ce" type="number" inputmode="numeric" step="100" data-ct="${x.d}" value="${x.t}" style="width:72px"></td><td><b>${yen(x.tot)}</b><br><small>${eur(x.tot)}</small></td></tr>`).join('')}</tbody></table></div>`}
function renderTransp(){$('transp').innerHTML=`<div class="dcard"><div class="dhead"><b>🚆 Les règles d'or de l'expert transport</b></div><div class="dbody">
<b>1. Le JR Pass n'est plus rentable pour toi.</b> Depuis la hausse de 2023 (environ 50 000 ¥ pour 7 jours), tes gros trajets (Odawara → Kyoto, Kyoto ↔ Nagoya, Osaka → Tokyo) coûtent moins cher en billets à l'unité. Fais le calcul avec l'onglet Budget.<br>
<b>2. Suica partout.</b> Trains, métro, bus, konbini et casiers. Recharge en espèces aux bornes ou depuis l'app Wallet sur iPhone.<br>
<b>3. Réserve tes Shinkansen sur SmartEX</b> (app en anglais, paiement par carte, embarquement par QR code). Siège E côté Fuji.<br>
<b>4. Voyage léger avec le takkyubin</b> (Yamato, ~2 000 à 3 000 ¥ par valise) : envoie ta grosse valise d'un hôtel à l'autre, surtout autour de Nikko, Kamakura et Hakone, où tu enchaînes les nuits courtes.<br>
<b>5. Les passes locaux à connaître :</b> Tobu Nikko, Enoden Noriorikun, Tokyo Subway Ticket, Yurikamome.<br>
<b>6. Les bonnes applis :</b> Google Maps (horaires et quais), Japan Transit Planner, GO (taxis).<br>
<b>7. Évite l'heure de pointe</b> de 7h30 à 9h30 dans Tokyo, et les bus de Kyoto en automne.</div></div>
<div class="dcard"><div class="dhead"><b>🚃 Où se placer dans la rame pour sortir vite</b></div><div class="dbody">
<b>1. Au sol du quai,</b> chaque porte porte un numéro de voiture et de porte (ex. « 4-2 »). Les files d'attente se font sur ces marques.<br>
<b>2. Panneaux « 乗換・出口案内 »</b> (correspondances / sorties) : affichés sur les piliers du quai, ils indiquent quelle voiture arrive au pied de chaque escalier, sortie ou correspondance. Regarde-les au départ, pas à l'arrivée.<br>
<b>3. Applis :</b> dans Google Maps, la sortie conseillée est indiquée à la fin du trajet ; les applis japonaises (Navitime, Japan Transit Planner) peuvent aussi afficher la voiture la plus proche de la sortie.<br>
<b>4. Les positions données dans le programme sont indicatives</b> (🚃) : elles reposent sur la configuration habituelle des gares et peuvent changer selon le quai ou la longueur du train. Vérifie toujours le panneau du quai.<br>
<b>5. Shinkansen :</b> voitures non réservées en tête vers Tokyo (1 à 3 sur Nozomi, davantage sur Hikari), « Green » au milieu. Le n° de voiture est imprimé sur ton billet et peint au sol.<br>
<b>6. Lignes « Local » :</b> à Inari, Gotokuji, Daikanyama ou Sako, seuls les trains omnibus (普通 / Local) s'arrêtent.</div></div>`+
days.map(d=>{const j=J[d]||[];const legs=D.map((x,i)=>[x,i]).filter(([x,i])=>x[0]==d&&TR[i]).map(([x,i])=>`<div class="mom" style="margin-top:6px">➡️ ${x[1]} · ${x[3]}</div>${legHTML(i)}`).join('');
return `<div class="dcard"><div class="dhead" data-d="${d}"><div><b>${frDate(d)}</b><br><small>${j[0]||''}</small></div><span class="cost">🚆 ${yen(ct(d))}</span></div><div class="dbody"><div>🗺️ <b>Itinéraire :</b> ${j[2]||''}</div><p class="note">🏁 Départ : ${(START[d]||[,,'—'])[2]}</p>${legs}<div class="tr">💡 ${j[4]||''}</div></div></div>`}).join('')}
// ---- Navigation (téléphone : une vue à la fois)
let curView='prog';
function setView(v){curView=v;document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.v==v));
 if(v=='map'){document.body.classList.remove('v-side');if(HASMAP)setTimeout(()=>map.invalidateSize(),60)}
 else{document.body.classList.add('v-side');showTab(v)}}
$('nav').onclick=e=>{const b=e.target.closest('button');if(b)setView(b.dataset.v)};
function showTab(t){document.querySelectorAll('#tabs button[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t==t));document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id==t))}
function toMap(){if(isMobile())setView('map')}
function focusI(i){if(!HASMAP)return;toMap();setTimeout(()=>{const m=markers.find(m=>m.i==i);if(m){map.setView(m.getLatLng(),16);m.openPopup()}},120)}
function focusLeg(i){if(!HASMAP)return;const d=D[i][0];if($('day').value!=d){$('day').value=d;render()}toMap();
 setTimeout(()=>{const g=legGroups[i];if(g&&g.getLayers().length)map.fitBounds(g.getBounds().pad(.2),{maxZoom:16})},200)}
function goDay(d){$('day').value=d;render();if(isMobile()){if(curView=='map')return;setView('prog')}else showTab('prog');$('side').scrollTop=0}
$('side').addEventListener('click',e=>{const md=e.target.closest('[data-mapday]');if(md){e.stopPropagation();$('day').value=md.dataset.mapday;render();toMap();setTimeout(()=>fitAll(filtered()),150);return}
if(e.target.closest('a')&&!e.target.dataset.go)return;
if(e.target.dataset.go){e.preventDefault();goDay(e.target.dataset.go);return}
if(e.target.tagName==='INPUT'||e.target.tagName==='LABEL')return;
const lgd=e.target.closest('.leg');if(lgd){focusLeg(+lgd.dataset.leg);return}
const h=e.target.closest('.dhead');if(h&&h.dataset.d){goDay(h.dataset.d);return}
const st=e.target.closest('.step,#tb tr');if(st)focusI(st.dataset.i)});
$('side').addEventListener('change',e=>{const t=e.target;
if(t.dataset.c!==undefined){done[t.dataset.c]=t.checked;SV('jp26done',done);t.closest('tr').classList.toggle('done')}
else if(t.dataset.bk!==undefined){booked[t.dataset.bk]=t.checked;SV('jp26booked',booked);const sc=$('side').scrollTop;render();$('side').scrollTop=sc;toast(t.checked?'Réservation cochée ✅':'Réservation décochée')}
else if(t.dataset.ca!==undefined){costA[t.dataset.ca]=+t.value;SV('jp26costA',costA);const sc=$('side').scrollTop;render();$('side').scrollTop=sc;toast('Coût mis à jour')}
else if(t.dataset.ct!==undefined){costT[t.dataset.ct]=+t.value;SV('jp26costT',costT);render();toast('Coût transport mis à jour')}
else if(t.id=='rate'){rate=+t.value||170;localStorage.setItem('jp26rate',rate);render()}});
$('tabs').onclick=e=>{if(e.target.dataset.p){window.print();return}if(e.target.dataset.t)showTab(e.target.dataset.t)};
['day','zone','gemOnly','resOnly'].forEach(id=>$(id).onchange=render);$('q').oninput=render;
$('reset').onclick=()=>{$('day').value=$('zone').value=$('q').value='';$('gemOnly').checked=$('resOnly').checked=false;off.clear();$('legend').querySelectorAll('span').forEach(s=>s.classList.remove('off'));render()};
$('fBtn').onclick=()=>{$('filters').classList.toggle('open');$('fBtn').classList.toggle('on')};
$('todayBtn').onclick=()=>{if(days.includes(todayKey)){goDay(todayKey);toast('Programme du jour : '+frDate(todayKey))}else toast('Aujourd\'hui ('+todayKey+') ne fait pas partie du voyage : choisis un jour dans la barre.')};
// ---- Réseau
function netUI(){const n=$('net');n.classList.toggle('off',!navigator.onLine);n.textContent=navigator.onLine?'● En ligne':'● Hors ligne'}
addEventListener('online',netUI);addEventListener('offline',netUI);netUI();
// ---- Hors ligne : préchargement carte & itinéraires
function lon2x(l,z){return Math.floor((l+180)/360*2**z)}function lat2y(l,z){const r=l*Math.PI/180;return Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*2**z)}
function tilesAround(lat,lng,z,rm,set){const dLat=rm/111320,dLng=rm/(111320*Math.cos(lat*Math.PI/180));
 const x0=lon2x(lng-dLng,z),x1=lon2x(lng+dLng,z),y0=lat2y(lat+dLat,z),y1=lat2y(lat-dLat,z);
 for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)set.add(TILE.replace('{z}',z).replace('{y}',y).replace('{x}',x))}
function tilesForPoints(pts,set){pts.forEach(p=>{tilesAround(p[0],p[1],11,9000,set);tilesAround(p[0],p[1],12,5000,set);tilesAround(p[0],p[1],13,2500,set);tilesAround(p[0],p[1],14,1500,set);tilesAround(p[0],p[1],15,900,set);tilesAround(p[0],p[1],16,600,set)})}
function overview(set){for(let z=5;z<=9;z++){const x0=lon2x(135.3,z),x1=lon2x(140.5,z),y0=lat2y(36.9,z),y1=lat2y(34.5,z);for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)set.add(TILE.replace('{z}',z).replace('{y}',y).replace('{x}',x))}}
let busy=false;
async function prefetch(urls,label){if(busy){toast('Un téléchargement est déjà en cours');return}if(!('caches' in window)){toast('Cache non disponible : installe l\'appli depuis son adresse https');return}
 if(!navigator.onLine){toast('Pas de connexion : fais-le en Wi-Fi');return}
 busy=true;const cache=await caches.open('jp26-tiles');let ok=0,skip=0,err=0,i=0;const list=[...urls];
 const step=()=>{$('offBar').style.width=Math.round((ok+skip+err)/list.length*100)+'%';$('offInfo').textContent=`${label} : ${ok+skip+err} / ${list.length} tuiles (${skip} déjà en mémoire${err?`, ${err} échecs`:''})`};
 async function worker(){while(i<list.length){const u=list[i++];try{if(await cache.match(u)){skip++}else{const r=await fetch(u,{mode:'no-cors'});await cache.put(u,r);ok++}}catch(e){err++}step()}}
 await Promise.all(Array.from({length:6},worker));busy=false;toast(`✅ ${label} disponible hors ligne`);
 if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}
$('offDay').onclick=()=>{const d=$('day').value;if(!d){toast('Choisis d\'abord un jour dans la barre des jours');return}
 const pts=D.filter(x=>x[0]==d).map(x=>[x[5],x[6]]);if(START[d])pts.push(START[d]);
 D.forEach((x,i)=>{if(x[0]==d){const ps=pieces(i);if(ps)ps.forEach(p=>{if(p.names)p.pts.forEach(q=>pts.push(q))})}});
 const s=new Set();overview(s);tilesForPoints(pts,s);prefetch(s,'Carte du '+d)};
$('offAll').onclick=()=>{const s=new Set();overview(s);tilesForPoints(D.map(x=>[x[5],x[6]]),s);
 if(confirm(`Télécharger la carte autour de toutes les étapes (~${s.size} tuiles, environ ${Math.round(s.size*0.02)} Mo) ? À faire en Wi-Fi.`))prefetch(s,'Carte du voyage')};
$('offRoutes').onclick=async()=>{if(!navigator.onLine){toast('Pas de connexion');return}const all=[];D.forEach((x,i)=>{const ps=pieces(i);if(ps)ps.forEach(p=>{if(!p.names&&!RC[rkey(p)]&&hav(p.a,p.b)>=30)all.push(p)})});
 if(!all.length){toast('✅ Tous les itinéraires sont déjà en mémoire');return}let n=0,ok=0;
 for(const p of all){const r=await osrm(p);n++;if(r)ok++;$('offBar').style.width=Math.round(n/all.length*100)+'%';$('offInfo').textContent=`Itinéraires : ${n} / ${all.length} (${ok} calculés)`;await new Promise(s=>setTimeout(s,300))}
 toast(`✅ ${ok} itinéraires enregistrés pour le hors ligne`);render()};
// ---- Sauvegarde / transfert des données
const KEYS=['jp26done','jp26costA','jp26costT','jp26booked','jp26rate'];
$('bkExp').onclick=async()=>{const o={app:'japon2026',date:new Date().toISOString()};KEYS.forEach(k=>o[k]=localStorage.getItem(k));
 const blob=new Blob([JSON.stringify(o)],{type:'application/json'}),name='Japon2026_mes_donnees.json',file=new File([blob],name,{type:'application/json'});
 if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'Japon 2026 – mes données'});return}catch(e){}}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();toast('Fichier de sauvegarde téléchargé')};
$('bkImp').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(o.app!=='japon2026')throw 0;
 KEYS.forEach(k=>{if(o[k]!=null)localStorage.setItem(k,o[k])});toast('✅ Données importées : rechargement…');setTimeout(()=>location.reload(),900)}catch(x){toast('⚠️ Fichier non reconnu')}};r.readAsText(f)};
// ---- Export Excel / Sheets
const HA=["Date","Jour","Heure","Zone","Activité","Type","Durée","Coût activité (¥)","Pépite","Fait","Conseil","Google Maps","Réservation","À réserver / règle","Lien(s) de réservation","Réservé","Mon avis / À challenger","Priorité (1-3)"];
function actRows(rows){return rows.map(([d,i])=>{const r=RES[i];return [d[0],frDate(d[0]),d[1],d[2],d[3],d[4],d[7],ca(i),d[10]?"⭐":"",done[i]?"Oui":"",d[9],gmu(d),r?RL[r[0]][0].slice(2).trim():"",r?r[1]+" – "+r[2]:"",r?r[3].map(x=>x[1]).join(" | "):"",r&&r[0]!='L'?(booked[i]?"Oui":"Non"):"","",""]})}
$('xl').onclick=()=>{const rows=D.map((d,i)=>[d,i]);
if(typeof XLSX==='undefined'){const csv='\ufeff'+[HA,...actRows(rows)].map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='Japon_2026_Programme.csv';a.click();toast('Export CSV (ouvrable dans Excel/Sheets)');return}
const wb=XLSX.utils.book_new();
const ws1=XLSX.utils.aoa_to_sheet([HA,...actRows(rows)]);ws1['!cols']=[8,22,7,22,45,16,9,12,7,6,60,30,14,60,50,8,30,10].map(w=>({wch:w}));ws1['!autofilter']={ref:`A1:R${rows.length+1}`};
XLSX.utils.book_append_sheet(wb,ws1,"Activités");
const n=rows.length+1,HB=["Date","Jour","Thème","Nuit","Itinéraire","Coût transport (¥)","Coût activités (¥)","Total jour (¥)","Total jour (€)","Conseil transport","Conseil du guide","Mon avis / À challenger"];
const B=[HB,...days.map((d,k)=>{const j=J[d],r=k+2;return [d,frDate(d),j[0],j[1],j[2],ct(d),{f:`SUMIF('Activités'!$A$2:$A$${n},A${r},'Activités'!$H$2:$H$${n})`},{f:`F${r}+G${r}`},{f:`ROUND(H${r}/$B$${days.length+3},0)`},j[4],j[5],""]})];
const tr=days.length+2;B.push(["TOTAL","","","","",{f:`SUM(F2:F${tr-1})`},{f:`SUM(G2:G${tr-1})`},{f:`SUM(H2:H${tr-1})`},{f:`SUM(I2:I${tr-1})`}]);
B.push(["Taux 1 € =",rate,"¥ (modifiable : tous les totaux € se recalculent)"]);
const ws2=XLSX.utils.aoa_to_sheet(B);ws2['!cols']=[8,22,30,22,60,14,14,14,12,70,50,30].map(w=>({wch:w}));
XLSX.utils.book_append_sheet(wb,ws2,"Budget par jour");
const R=[["Statut","Date","Heure","Activité","À réserver","Règle / ouverture","Lien 1","Lien 2","Lien 3","Réservé"],...Object.keys(RES).map(Number).sort((a,b)=>a-b).map(i=>{const r=RES[i],d=D[i];return [RL[r[0]][0].slice(2).trim(),d[0],d[1],d[3],r[1],r[2],...[0,1,2].map(k=>r[3][k]?r[3][k][1]:""),r[0]=='L'?"—":(booked[i]?"Oui":"Non")]})];
const ws3=XLSX.utils.aoa_to_sheet(R);ws3['!cols']=[16,8,7,40,45,70,45,45,45,9].map(w=>({wch:w}));XLSX.utils.book_append_sheet(wb,ws3,"Réservations");
XLSX.writeFile(wb,'Japon_2026_Programme.xlsx');toast('Excel exporté : Activités + Budget par jour + Réservations')};
$('gs').onclick=()=>{const rows=filtered(),tsv=[HA,...actRows(rows)].map(r=>r.map(v=>String(v).replace(/[\t\n]/g,' ')).join('\t')).join('\n');
const ok=()=>toast(`${rows.length} lignes copiées : colle-les dans une feuille Google Sheets`);
if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(tsv).then(ok,fb);else fb();
function fb(){const t=document.createElement('textarea');t.value=tsv;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();ok()}};
// ---- Installation (PWA)
let deferred=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('instBtn').style.display=''});
$('instBtn').onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;$('instBtn').style.display='none'};
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
// ---- Démarrage
if(days.includes(todayKey))$('day').value=todayKey;
render();if(isMobile())setView('prog');
addEventListener('resize',()=>{if(HASMAP)map.invalidateSize();if(!isMobile())document.body.classList.remove('v-side');else if(curView!='map')document.body.classList.add('v-side')});
