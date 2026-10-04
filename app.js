const state = {
  books: [],
  segment: "TODOS",
  sel: {series:new Set(),temas:new Set(),temaEI:new Set(),gEF1:new Set(),gEF2:new Set()},
  open: "",
  view: "catalogo",
  viewSeries: "Maternal",
  extra: "",
  search: "",
  favoritesOnly: false,
  selectedOnly: false,
  sort: "relevance",
  favorites: new Set(JSON.parse(localStorage.getItem("tdl27_favorites") || "[]")),
  selected: new Set(JSON.parse(localStorage.getItem("tdl27_selected") || "[]"))
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const segmentLabels = {
  "EDUCAÇÃO INFANTIL": "Educação Infantil",
  "FUND 1": "Anos Iniciais",
  "FUND 2": "Anos Finais"
};

const segClass = {
  "EDUCAÇÃO INFANTIL": "seg-ei",
  "FUND 1": "seg-f1",
  "FUND 2": "seg-f2"
};

const palettes = {
  "EDUCAÇÃO INFANTIL": ["#c64d36","#e07a45"],
  "FUND 1": ["#6c4fc4","#b05cc8"],
  "FUND 2": ["#1c8f8b","#3276a7"]
};

async function init(){
  try {
    const response = await fetch("livros.json");
    const payload = await response.json();
    state.books = payload.livros || [];
    $("#heroTotal").textContent = state.books.length;
    renderSegmentCounts();
    populateFilters();
    render();
  } catch (error) {
    $("#bookGrid").innerHTML = `<div class="empty"><div class="empty-icon">!</div><h2>Não foi possível carregar o catálogo</h2><p>Publique os quatro arquivos juntos no GitHub Pages ou Netlify.</p></div>`;
    console.error(error);
  }
}

function persist(){
  localStorage.setItem("tdl27_favorites", JSON.stringify([...state.favorites]));
  localStorage.setItem("tdl27_selected", JSON.stringify([...state.selected]));
}

function key(book){ return `${book.segmento}::${book.id}`; }

function renderSegmentCounts(){
  $$("#segmentTabs .segment").forEach(btn=>{
    const seg = btn.dataset.segment;
    const n = seg === "TODOS" ? state.books.length : state.books.filter(b=>b.segmento===seg).length;
    btn.querySelector("span").textContent = n;
  });
}

const EI_SERIES=["Maternal","Educação Infantil 1","Educação Infantil 2","Educação Infantil 3"];
const EI_TABLE={
"Maternal":["O livro e eu","Movimentação","A família de dedoches","O meu fantoche","Os animais","A floresta","Observação","Hoje o dia está..."],
"Educação Infantil 1":["Já vai começar a história","É um prazer conhecer-se","Do que é feita uma história?","Quando eu crescer, quero ser...","O que eu sinto quando","Os animais","Os meios de transporte","Livro: para viajar sem sair do lugar"],
"Educação Infantil 2":["Minhas histórias","O que tem na capa dos livros?","O que tem dentro do livro?","Formas e personagens","Nosso conto de fadas","Histórias cantadas","Observar e registrar","O começo e o fim"],
"Educação Infantil 3":["Quem conta um conto...","O que eu sinto quando leio?","Eu super-herói","Tá na mão","Com quantas imagens se faz uma história?","Começo, meio e fim","Em que lugar as histórias acontecem?","Se eu fosse um escritor..."]};
const EF1_TABLE={
"1º ano":["Adivinhas","Quadrinhas","Poemas","Parlendas e trava-línguas","Contos de fadas","Contos infantis","Fábulas","Livros-imagens com ou sem texto","Livros-imagens sem texto","Livros bem diferentes"],
"2º ano":["Poemas","Quadrinhas","Cantigas","Jogos verbais","Contos de fadas","Contos infantis","Cultura popular","Informativo com parte ficcional","Informativo","Livros bem diferentes"],
"3º ano":["Cordel","Poemas","Poema narrativo","Contos infantis","Contos de fadas","Contos de fadas ao contrário","Novelas infantis","Informativo com parte ficcional","Informativo","Livros bem diferentes"],
"4º ano":["Poemas","Contos infantis","Novelas infantis","Contos de fadas","Lendas","Cultura popular","HQ informativo","Informativo com parte ficcional","Informativo","Livros bem diferentes"],
"5º ano":["Poemas","Cordel","Contos de fadas","Novelas infantis","Cultura popular","Informativo com parte ficcional","Informativo","Livros bem diferentes"]};
const effSeries=b=>(b.series||[]).includes("Todos")?EI_SERIES:(b.series||[]);
const FILTERS={
  series:{label:"Séries",get:effSeries},
  temas:{label:"Temas",get:b=>b.temas||[]},
  temaEI:{label:"Tema do Caderno · Ed. Infantil",get:b=>b.temaEI||[],segs:["TODOS","EDUCAÇÃO INFANTIL"],table:EI_TABLE},
  gEF1:{label:"Gênero do Caderno · Anos Iniciais",get:b=>b.generoEF1||[],segs:["TODOS","FUND 1"],table:EF1_TABLE},
  gEF2:{label:"Gênero · Anos Finais",get:b=>b.generoEF2||[],segs:["TODOS","FUND 2"]}
};
function segBooks(){return state.segment==="TODOS"?state.books:state.books.filter(b=>b.segmento===state.segment);}
function msOptions(fid){
  const f=FILTERS[fid]; let arr=segBooks();
  if(fid!=="series" && state.sel.series.size) arr=arr.filter(b=>effSeries(b).some(x=>state.sel.series.has(x)));
  const count={}; arr.forEach(b=>f.get(b).forEach(v=>count[v]=(count[v]||0)+1));
  let vals;
  if(f.table){
    const ser=state.sel.series.size?[...state.sel.series].filter(x=>f.table[x]):Object.keys(f.table);
    vals=[...new Set(ser.flatMap(x=>f.table[x]))];
    Object.keys(count).filter(v=>!vals.includes(v)&&state.sel.series.size===0).forEach(v=>vals.push(v));
  } else {
    vals=Object.keys(count); vals.sort(fid==="series"?seriesSort:localeSort);
  }
  return vals.map(v=>({v,n:count[v]||0}));
}
function visibleFilters(){return Object.keys(FILTERS).filter(id=>!FILTERS[id].segs||FILTERS[id].segs.includes(state.segment));}
function populateFilters(){
  Object.keys(state.sel).forEach(fid=>{
    const ok=new Set(visibleFilters().includes(fid)?msOptions(fid).map(o=>o.v):[]);
    [...state.sel[fid]].forEach(v=>{if(!ok.has(v))state.sel[fid].delete(v)});
  });
  renderMs();
  const extra=[{value:"confessional",label:"Indicação confessional"}];
  if(["EDUCAÇÃO INFANTIL","TODOS"].includes(state.segment)){extra.push({value:"bastao",label:"Letra bastão"},{value:"socio",label:"Socioemocional"});}
  const ef=$("#extraFilter");
  ef.innerHTML='<option value="">Outros filtros</option>'+extra.map(x=>`<option value="${x.value}">${x.label}</option>`).join("");
  if(extra.some(x=>x.value===state.extra)) ef.value=state.extra; else {ef.value="";state.extra="";}
}
function renderMs(){
  $("#msBar").innerHTML=visibleFilters().map(fid=>{
    const f=FILTERS[fid],set=state.sel[fid],opts=msOptions(fid),open=state.open===fid;
    return `<div class="ms ${open?'open':''}"><button type="button" class="ms-btn ${set.size?'has':''}" data-ms="${fid}">${esc(f.label)}${set.size?` <b>${set.size}</b>`:""} ▾</button>
    <div class="ms-panel" ${open?"":"hidden"}>${opts.map(o=>`<label class="ms-opt ${o.n?'':'zero'}"><input type="checkbox" data-fid="${fid}" value="${escAttr(o.v)}" ${set.has(o.v)?"checked":""}><span>${esc(o.v)}</span><em>${o.n}</em></label>`).join("")||'<p class="ms-none">Sem opções</p>'}
    <div class="ms-foot"><button type="button" data-clearms="${fid}">Limpar seleção</button></div></div></div>`;
  }).join("");
}

function splitCategories(value){
  if(!value) return [];
  return value.split(/\s*;\s*|\s*\/\s*/).map(x=>x.trim()).filter(Boolean);
}

function localeSort(a,b){return a.localeCompare(b,"pt-BR",{sensitivity:"base"});}
function seriesSort(a,b){
  const rank={"Maternal":0,"Educação Infantil 1":1,"Educação Infantil 2":2,"Educação Infantil 3":3,"1º ano":10,"2º ano":11,"3º ano":12,"4º ano":13,"5º ano":14,"6º ano":15,"7º ano":16,"8º ano":17,"9º ano":18};
  return (rank[a]??99)-(rank[b]??99) || localeSort(a,b);
}

function filteredBooks(){
  let arr=[...state.books];
  if(state.segment!=="TODOS") arr=arr.filter(b=>b.segmento===state.segment);
  visibleFilters().forEach(fid=>{const set=state.sel[fid]; if(set.size) arr=arr.filter(b=>FILTERS[fid].get(b).some(v=>set.has(v)));});
  if(state.extra==="confessional") arr=arr.filter(b=>b.indicacaoConfessional==="SIM");
  if(state.extra==="bastao") arr=arr.filter(b=>b.letraBastao==="SIM");
  if(state.extra==="socio") arr=arr.filter(b=>b.socioemocional==="SIM");
  if(state.search){
    const q=state.search.toLocaleLowerCase("pt-BR");
    arr=arr.filter(b=>[b.titulo,b.autor,b.temas?.join(" "),b.categoria,b.faixaEscolar,b.resumo].join(" ").toLocaleLowerCase("pt-BR").includes(q));
  }
  if(state.favoritesOnly) arr=arr.filter(b=>state.favorites.has(key(b)));
  if(state.selectedOnly) arr=arr.filter(b=>state.selected.has(key(b)));
  if(state.sort==="title") arr.sort((a,b)=>localeSort(a.titulo,b.titulo));
  if(state.sort==="author") arr.sort((a,b)=>localeSort(a.autor,b.autor));
  if(state.sort==="pagesAsc") arr.sort((a,b)=>(a.paginas||0)-(b.paginas||0));
  if(state.sort==="pagesDesc") arr.sort((a,b)=>(b.paginas||0)-(a.paginas||0));
  return arr;
}

function render(){
  const arr=filteredBooks();
  $("#resultCount").textContent=arr.length;
  renderSeriesSummary();
  $("#bookGrid").innerHTML=arr.map(cardHtml).join("");
  $("#emptyState").hidden=arr.length!==0;
  updateCounts();
  renderChoices();
}

function cardHtml(book){
  const k=key(book), fav=state.favorites.has(k), selected=state.selected.has(k);
  const p=palettes[book.segmento]||["#6c4fc4","#d54f80"];
  const initials=book.titulo.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  const tags=[...(book.temas||[]).slice(0,3)];
  return `<article class="card ${segClass[book.segmento]||""}" data-key="${escAttr(k)}" onclick="openBook('${jsq(k)}')">
    <div class="cover ${book.capaUrl?'has-img':''}" data-title="${escAttr(book.titulo)}" style="background:linear-gradient(135deg,${p[0]},${p[1]})">
      ${book.capaUrl?`<img class="cover-img" src="${escAttr(book.capaUrl)}" alt="Capa do livro ${escAttr(book.titulo)}" loading="lazy" onerror="coverFallback(this)">`:""}
      <span class="cover-tag">${esc(segmentLabels[book.segmento]||book.segmento)}</span>
      <button class="heart ${fav?'on':''}" aria-label="Favoritar" onclick="toggleFavorite(event,'${jsq(k)}')">${fav?'♥':'♡'}</button>
      ${book.capaUrl?"":`<div class="cover-title">${esc(book.titulo)}</div>
      <div style="position:absolute;right:12px;bottom:12px;font:800 12px Inter;color:#fff9">${initials}</div>`}
    </div>
    <div class="card-body">
      <p class="card-author">${esc(book.autor || "Autor não informado")}</p>
      <div class="card-meta">${tags.map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div>
      <div class="card-footer">
        <span class="pages">${book.paginas?book.paginas+" páginas":"—"}</span>
        <button class="select-btn ${selected?'on':''}" onclick="toggleSelected(event,'${jsq(k)}')">${selected?'✓ Selecionado':'+ Selecionar'}</button>
      </div>
    </div>
  </article>`;
}

function renderSeriesSummary(){
  const arr=state.books.filter(b=>state.selected.has(key(b)));
  if(!arr.length){$("#seriesSummary").innerHTML="";return;}
  const counts={};
  arr.forEach(b=>effSeries(b).forEach(s=>counts[s]=(counts[s]||0)+1));
  $("#seriesSummary").innerHTML=Object.entries(counts).sort((a,b)=>seriesSort(a[0],b[0])).map(([s,n])=>`<span class="series-chip"><strong>${esc(s)}</strong> · ${n} selecionado${n===1?"":"s"}</span>`).join("");
}

function updateCounts(){
  $("#favoriteCount").textContent=state.favorites.size;
  $("#selectionCount").textContent=state.selected.size;
  $("#selectionStripCount").textContent=state.selected.size;
  const disabled=state.selected.size===0;
  $("#exportExcel").disabled=disabled; $("#exportPdf").disabled=disabled;
  $("#drawerExcel").disabled=disabled; $("#drawerPdf").disabled=disabled;
  renderDrawer();
}

function toggleFavorite(event,k){
  event.stopPropagation();
  state.favorites.has(k)?state.favorites.delete(k):state.favorites.add(k);
  persist(); render();
}
function toggleSelected(event,k){
  event.stopPropagation();
  state.selected.has(k)?state.selected.delete(k):state.selected.add(k);
  persist(); render();
}
window.toggleFavorite=toggleFavorite; window.toggleSelected=toggleSelected;

function cleanText(v){return String(v||"").replace(/\s+\?\s*$/,"").replace(/\s+/g," ").trim();}
window.coverFallback=function(img){
  const c=img.parentElement; if(!c)return;
  c.classList.remove("has-img"); img.remove();
  c.insertAdjacentHTML("beforeend",`<div class="cover-title">${esc(c.dataset.title||"")}</div>`);
};

function getBook(k){return state.books.find(b=>key(b)===k);}

function openBook(k){
  const b=getBook(k); if(!b)return;
  const selected=state.selected.has(k), fav=state.favorites.has(k);
  const resumo=cleanText(b.resumo);
  $("#dialogContent").innerHTML=`<div class="dialog-inner ${b.capaUrl?'with-cover':''}">
    ${b.capaUrl?`<div class="dialog-cover"><img src="${escAttr(b.capaUrl)}" alt="Capa do livro ${escAttr(b.titulo)}" onerror="this.parentElement.remove()"></div>`:""}
    <div class="dialog-main">
    <div class="dialog-kicker">${esc(segmentLabels[b.segmento]||b.segmento)}</div>
    <h2 class="dialog-title">${esc(b.titulo)}</h2>
    <div class="dialog-author">${esc(b.autor||"Autor não informado")}</div>
    <div class="dialog-tags">${(b.temas||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div>
    ${resumo?`<p class="dialog-summary">${esc(resumo)}</p>`:""}
    <div class="dialog-grid">
      <div class="detail-box"><small>Série</small><span>${esc((b.series||[]).join(", ")||"Não informado")}</span></div>
      <div class="detail-box"><small>Tema / gênero</small><span>${esc(b.categoria||"Não informado")}</span></div>
      <div class="detail-box"><small>Faixa escolar</small><span>${esc(b.faixaEscolar||"Não informado")}</span></div>
      <div class="detail-box"><small>Extensão</small><span>${b.paginas?b.paginas+" páginas":"Não informado"}</span></div>
      <div class="detail-box"><small>Indicação confessional</small><span>${esc(b.indicacaoConfessional||"Não informado")}</span></div>
      ${b.letraBastao?`<div class="detail-box"><small>Letra bastão</small><span>${esc(b.letraBastao)}</span></div>`:""}
    </div>
    <div class="dialog-actions">
      <button class="primary" onclick="dialogSelect('${jsq(k)}')">${selected?'✓ Remover da seleção':'+ Selecionar livro'}</button>
      <button onclick="dialogFavorite('${jsq(k)}')">${fav?'♥ Favoritado':'♡ Favoritar'}</button>
      ${b.linkModerna?`<a href="${escAttr(b.linkModerna)}" target="_blank" rel="noopener">Ver na Moderna ↗</a>`:""}
      <a href="${escAttr(b.catalogoUrl)}" target="_blank" rel="noopener">Abrir catálogo digital ↗</a>
    </div>
    </div>
  </div>`;
  $("#bookDialog").showModal();
}
window.openBook=openBook;
window.dialogSelect=function(k){state.selected.has(k)?state.selected.delete(k):state.selected.add(k);persist();$("#bookDialog").close();render();};
window.dialogFavorite=function(k){state.favorites.has(k)?state.favorites.delete(k):state.favorites.add(k);persist();$("#bookDialog").close();render();};

function renderDrawer(){
  const arr=state.books.filter(b=>state.selected.has(key(b)));
  $("#drawerBody").innerHTML=arr.length?arr.map(b=>`<div class="drawer-item">
    <div class="mini-cover">${b.capaUrl?`<img src="${escAttr(b.capaUrl)}" alt="" loading="lazy" onerror="this.remove()">`:esc(b.titulo.slice(0,2).toUpperCase())}</div>
    <div><b>${esc(b.titulo)}</b><small>${esc(segmentLabels[b.segmento]||b.segmento)} · ${(b.series||[]).join(", ")}</small></div>
    <button class="remove-btn" onclick="removeSelected('${jsq(key(b))}')">×</button>
  </div>`).join(""):`<div class="empty" style="padding:60px 0"><div class="empty-icon">♡</div><h2>Nenhum livro ainda</h2><p>Selecione títulos no catálogo para montar a lista da escola.</p></div>`;
}
window.removeSelected=function(k){state.selected.delete(k);persist();render();};

function exportRows(){
  return state.books.filter(b=>state.selected.has(key(b))).map(b=>({
    "Segmento":segmentLabels[b.segmento]||b.segmento,
    "Série(s)":(b.series||[]).join(", "),
    "Título":b.titulo,
    "Autor":b.autor,
    "Tema(s)":(b.temas||[]).join("; "),
    "Tema/Gênero":b.categoria,
    "Faixa escolar":b.faixaEscolar,
    "Páginas":b.paginas||"",
    "Indicação confessional":b.indicacaoConfessional||"",
    "Letra bastão":b.letraBastao||"",
    "Socioemocional":b.socioemocional||"",
    "Tema do Caderno (EI)":(b.temaEI||[]).join("; "),
    "Gênero do Caderno (EF1)":(b.generoEF1||[]).join("; "),
    "Gênero (EF2)":(b.generoEF2||[]).join("; "),
    "Link Moderna":b.linkModerna||"",
    "Item":b.id
  }));
}

function exportExcel(){
  if(!state.selected.size)return;
  const rows=exportRows();
  const ws=XLSX.utils.json_to_sheet(rows);
  ws["!cols"]=[{wch:20},{wch:22},{wch:40},{wch:30},{wch:55},{wch:35},{wch:22},{wch:10},{wch:22},{wch:15},{wch:15},{wch:35},{wch:30},{wch:20},{wch:45},{wch:14}];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"Minha seleção");
  XLSX.writeFile(wb,"Territorio_da_Leitura_2027.xlsx");
}

function exportPdf(){
  if(!state.selected.size)return;
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
  const rows=exportRows();
  doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.text("Território da Leitura 2027",14,16);
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.text(`Minha seleção · ${rows.length} livro(s)`,14,22);
  doc.autoTable({
    startY:28,
    head:[["Segmento","Série(s)","Título","Autor","Tema/Gênero","Páginas"]],
    body:rows.map(r=>[r["Segmento"],r["Série(s)"],r["Título"],r["Autor"],r["Tema/Gênero"],r["Páginas"]]),
    styles:{fontSize:7,cellPadding:2},
    headStyles:{fillColor:[32,28,40],textColor:255},
    alternateRowStyles:{fillColor:[246,244,241]},
    margin:{left:10,right:10}
  });
  doc.save("Territorio_da_Leitura_2027.pdf");
}

function clearFilters(){
  Object.values(state.sel).forEach(x=>x.clear());state.extra="";state.search="";state.favoritesOnly=false;state.selectedOnly=false;
  $("#searchInput").value="";$("#favoritesOnly").checked=false;$("#selectedOnly").checked=false;
  populateFilters();render();
}

function openDrawer(){
  $("#drawer").classList.add("open");$("#drawer").setAttribute("aria-hidden","false");$("#backdrop").classList.add("show");
}
function closeDrawer(){
  $("#drawer").classList.remove("open");$("#drawer").setAttribute("aria-hidden","true");$("#backdrop").classList.remove("show");
}

$("#segmentTabs").addEventListener("click",e=>{
  const btn=e.target.closest(".segment"); if(!btn)return;
  state.segment=btn.dataset.segment;
  $$(".segment").forEach(x=>x.classList.toggle("active",x===btn));
  Object.values(state.sel).forEach(x=>x.clear());state.extra="";
  populateFilters();render();
});
$("#searchInput").addEventListener("input",e=>{state.search=e.target.value;render()});
$("#msBar").addEventListener("click",e=>{
  const c=e.target.closest("[data-clearms]"); if(c){state.sel[c.dataset.clearms].clear();populateFilters();render();return;}
  const b=e.target.closest("[data-ms]"); if(b){state.open=state.open===b.dataset.ms?"":b.dataset.ms;renderMs();}
});
$("#msBar").addEventListener("change",e=>{
  const i=e.target; if(!i.dataset.fid)return;
  i.checked?state.sel[i.dataset.fid].add(i.value):state.sel[i.dataset.fid].delete(i.value);
  populateFilters();render();
});
document.addEventListener("click",e=>{if(state.open&&!e.target.closest(".ms")){state.open="";renderMs();}});
$("#viewTabs").addEventListener("click",e=>{
  const b=e.target.closest(".vt"); if(!b)return;
  state.view=b.dataset.view; $$(".vt").forEach(x=>x.classList.toggle("active",x===b));
  $("#catalogView").hidden=state.view!=="catalogo"; $("#choicesView").hidden=state.view!=="escolhas";
  renderChoices();
});
$("#extraFilter").addEventListener("change",e=>{state.extra=e.target.value;render()});
$("#sortSelect").addEventListener("change",e=>{state.sort=e.target.value;render()});
$("#favoritesOnly").addEventListener("change",e=>{state.favoritesOnly=e.target.checked;render()});
$("#selectedOnly").addEventListener("change",e=>{state.selectedOnly=e.target.checked;render()});
$("#clearFilters").onclick=clearFilters;$("#emptyClear").onclick=clearFilters;
$("#selectionBtn").onclick=openDrawer;$("#favoritesBtn").onclick=()=>{$("#favoritesOnly").checked=true;state.favoritesOnly=true;render()};
$("#closeDrawer").onclick=closeDrawer;$("#backdrop").onclick=closeDrawer;
$("#dialogClose").onclick=()=>$("#bookDialog").close();
$("#exportExcel").onclick=exportExcel;$("#drawerExcel").onclick=exportExcel;
$("#exportPdf").onclick=exportPdf;$("#drawerPdf").onclick=exportPdf;
$("#clearSelection").onclick=()=>{state.selected.clear();persist();render()};
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeDrawer();if($("#bookDialog").open)$("#bookDialog").close()}});


const VIEW_TABS=[["Maternal","Maternal"],["Educação Infantil 1","EI 1"],["Educação Infantil 2","EI 2"],["Educação Infantil 3","EI 3"],["1º ano","1º ano"],["2º ano","2º ano"],["3º ano","3º ano"],["4º ano","4º ano"],["5º ano","5º ano"],["AF","Anos Finais"]];
const inSeries=(b,s)=>s==="AF"?b.segmento==="FUND 2":effSeries(b).includes(s);
function chipHtml(b){
  const k=key(b);
  return `<span class="chip"><button class="chip-t" onclick="openBook('${jsq(k)}')">${b.capaUrl?`<img src="${escAttr(b.capaUrl)}" alt="" loading="lazy" onerror="this.remove()">`:""}${esc(b.titulo)}</button><button class="chip-x" title="Remover da seleção" onclick="removeSelected('${jsq(k)}')">×</button></span>`;
}
function renderChoices(){
  const box=$("#choicesView"); const sel=state.books.filter(b=>state.selected.has(key(b)));
  $("#choiceCount").textContent=sel.length;
  if(state.view!=="escolhas")return;
  const tabs=VIEW_TABS.map(([id,l])=>{const n=sel.filter(b=>inSeries(b,id)).length;return `<button class="st ${id===state.viewSeries?'active':''}" data-s="${escAttr(id)}">${l}<span>${n}</span></button>`}).join("");
  const S=state.viewSeries, mine=sel.filter(b=>inSeries(b,S));
  const table=EI_TABLE[S]||EF1_TABLE[S]; let rows="", used=new Set();
  const meta=S==="AF"?"":`<span class="goal ${mine.length>=3&&mine.length<=4?'ok':mine.length>4?'over':'low'}">${mine.length} de 3–4 livros</span>`;
  if(table){
    const getI=b=>S in EI_TABLE?(b.temaEI||[]):(b.generoEF1||[]);
    rows=table.map(t=>{const bs=mine.filter(b=>!(b.series||[]).includes("Todos")&&getI(b).includes(t));bs.forEach(b=>used.add(key(b)));
      return `<tr class="${bs.length?'has':''}"><th>${esc(t)}</th><td>${bs.map(chipHtml).join("")||'<span class="none">—</span>'}</td></tr>`}).join("");
    const todos=mine.filter(b=>(b.series||[]).includes("Todos")); todos.forEach(b=>used.add(key(b)));
    if(todos.length) rows+=`<tr class="has"><th>Socioemocional · todos os anos</th><td>${todos.map(chipHtml).join("")}</td></tr>`;
  } else {
    const g={}; mine.forEach(b=>((b.generoEF2||[]).length?b.generoEF2:["Sem gênero"]).forEach(x=>(g[x]=g[x]||[]).push(b)));
    rows=Object.keys(g).sort(localeSort).map(t=>`<tr class="has"><th>${esc(t)}</th><td>${g[t].map(chipHtml).join("")}</td></tr>`).join(""); mine.forEach(b=>used.add(key(b)));
  }
  const out=mine.filter(b=>!used.has(key(b)));
  if(out.length) rows+=`<tr class="has"><th>Fora da tabela do caderno</th><td>${out.map(chipHtml).join("")}</td></tr>`;
  const head=S in EI_TABLE?"Tema do Caderno":S==="AF"?"Gênero":"Gênero do Caderno";
  box.innerHTML=`<div class="st-tabs" id="stTabs">${tabs}</div>
  <div class="st-head"><h2>${esc((VIEW_TABS.find(x=>x[0]===S)||[0,S])[1])}</h2>${meta}</div>
  ${mine.length||table?`<table class="choice-table"><thead><tr><th>${head}</th><th>Livros escolhidos</th></tr></thead><tbody>${rows}</tbody></table>`:'<p class="none">Nenhum livro escolhido ainda.</p>'}
  <p class="st-note">Um livro aparece em todas as séries a que pertence. Para escolher mais livros, volte ao Catálogo e use “Selecionar”.</p>`;
}
document.addEventListener("click",e=>{const t=e.target.closest("#stTabs .st"); if(t){state.viewSeries=t.dataset.s;renderChoices();}});

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function escAttr(v){return esc(v);}
function jsq(v){return String(v).replace(/\\/g,"\\\\").replace(/'/g,"\\'");}

function applyTheme(t){
  document.documentElement.setAttribute("data-theme",t);
  try{localStorage.setItem("tdl27_theme",t)}catch(e){}
  $("#themeBtn").textContent = t==="light" ? "☾ Escuro" : "☀ Claro";
  $("#themeColor").setAttribute("content", t==="light" ? "#f6f4f0" : "#111318");
}
(function initTheme(){
  const cur = document.documentElement.getAttribute("data-theme")==="light" ? "light" : "dark";
  applyTheme(cur);
  $("#themeBtn").onclick = () => applyTheme(document.documentElement.getAttribute("data-theme")==="light" ? "dark" : "light");
})();

init();
