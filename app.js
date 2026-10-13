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
  selected: new Set(JSON.parse(localStorage.getItem("tdl27_selected") || "[]")),
  assign: JSON.parse(localStorage.getItem("tdl27_assign") || "{}")
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const CATALOG_LOGIN = "degust-literatura-102023";
const COPY_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
const CHECK_ICON = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';
const credHtml = (label,value) => `<span class="cred-item"><small>${label}</small><code>${esc(value)}</code><button type="button" class="cred-copy" data-copy="${escAttr(value)}" title="Copiar ${label.toLowerCase()}" aria-label="Copiar ${label.toLowerCase()}">${COPY_ICON}</button></span>`;

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
  localStorage.setItem("tdl27_assign", JSON.stringify(state.assign));
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
  arr.forEach(b=>chosenSeries(b).forEach(s=>counts[s]=(counts[s]||0)+1));
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
function toggleSelected(event,k){ event.stopPropagation(); pickSelect(k); }
const seriesShort=x=>String(x).replace("Educação Infantil ","EI ");
const chosenSeries=b=>{const a=state.assign[key(b)];return a&&a.length?a:effSeries(b);};
function pickSelect(k){
  if(state.selected.has(k)){state.selected.delete(k);delete state.assign[k];persist();render();return;}
  const b=getBook(k), opts=effSeries(b);
  if(opts.length<=1){state.selected.add(k); if(opts.length) state.assign[k]=[opts[0]]; persist();render();return;}
  askSeries(k);
}
function askSeries(k){
  const b=getBook(k), opts=effSeries(b), cur=(state.assign[k]||[])[0]||opts.find(x=>state.sel.series.has(x))||"";
  $("#seriesDialogContent").innerHTML=`<div class="dialog-inner"><div class="dialog-kicker">ESCOLHER SÉRIE</div>
    <h2 class="dialog-title" style="font-size:26px">${esc(b.titulo)}</h2>
    <p class="series-ask">Para qual série você está escolhendo este livro?</p>
    <div class="series-opts">${opts.map(x=>`<label class="series-opt"><input type="radio" name="serieEsc" value="${escAttr(x)}" ${x===cur?"checked":""}><span>${esc(x)}</span></label>`).join("")}</div>
    <div class="dialog-actions"><button class="primary" id="serieOk" ${cur?"":"disabled"}>Confirmar</button><button id="serieCancel">Cancelar</button></div></div>`;
  const dlg=$("#seriesDialog");
  dlg.querySelectorAll('input[name="serieEsc"]').forEach(i=>i.onchange=()=>{$("#serieOk").disabled=false;});
  $("#serieCancel").onclick=()=>dlg.close();
  $("#serieOk").onclick=()=>{const v=dlg.querySelector('input[name="serieEsc"]:checked');if(!v)return;state.selected.add(k);state.assign[k]=[v.value];persist();dlg.close();render();};
  dlg.showModal();
}
window.reassign=function(k){askSeries(k);};
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
    ${b.capaUrl?`<div class="dialog-cover"><img src="${escAttr(b.capaUrl)}" alt="Capa do livro ${escAttr(b.titulo)}" onerror="this.closest('.dialog-inner').classList.remove('with-cover');this.parentElement.remove()"></div>`:""}
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
      ${b.isbn?`<div class="detail-box"><small>ISBN</small><span>${esc(b.isbn)}</span></div>`:""}
      <div class="detail-box"><small>Extensão</small><span>${b.paginas?b.paginas+" páginas":"Não informado"}</span></div>
      <div class="detail-box"><small>Indicação confessional</small><span>${esc(b.indicacaoConfessional||"Não informado")}</span></div>
      ${b.letraBastao?`<div class="detail-box"><small>Letra bastão</small><span>${esc(b.letraBastao)}</span></div>`:""}
    </div>
    <div class="dialog-actions">
      <button class="primary" onclick="dialogSelect('${jsq(k)}')">${selected?'✓ Remover da seleção':'+ Selecionar livro'}</button>
      <button onclick="dialogFavorite('${jsq(k)}')">${fav?'♥ Favoritado':'♡ Favoritar'}</button>
      ${b.linkModerna?`<a href="${escAttr(b.linkModerna)}" target="_blank" rel="noopener">Ver na Moderna ↗</a>`:""}
      ${b.videoAutor?`<a class="video-btn" href="${escAttr(b.videoAutor)}" target="_blank" rel="noopener">▶ Vídeo do autor</a>`:""}
      <a href="${escAttr(b.catalogoUrl)}" target="_blank" rel="noopener">Abrir catálogo digital ↗</a>
      <div class="cred" aria-label="Acesso ao catálogo digital">${credHtml("Login",CATALOG_LOGIN)}</div>
    </div>
    </div>
  </div>`;
  $("#bookDialog").showModal();
}
window.openBook=openBook;
window.dialogSelect=function(k){$("#bookDialog").close();pickSelect(k);};
window.dialogFavorite=function(k){state.favorites.has(k)?state.favorites.delete(k):state.favorites.add(k);persist();$("#bookDialog").close();render();};

function renderDrawer(){
  const arr=state.books.filter(b=>state.selected.has(key(b)));
  $("#drawerBody").innerHTML=arr.length?arr.map(b=>`<div class="drawer-item">
    <div class="mini-cover">${b.capaUrl?`<img src="${escAttr(b.capaUrl)}" alt="" loading="lazy" onerror="this.remove()">`:esc(b.titulo.slice(0,2).toUpperCase())}</div>
    <div><b>${esc(b.titulo)}</b><small>${esc(segmentLabels[b.segmento]||b.segmento)} · ${chosenSeries(b).map(seriesShort).join(", ")}</small></div>
    <button class="remove-btn" onclick="removeSelected('${jsq(key(b))}')">×</button>
  </div>`).join(""):`<div class="empty" style="padding:60px 0"><div class="empty-icon">♡</div><h2>Nenhum livro ainda</h2><p>Selecione títulos no catálogo para montar a lista da escola.</p></div>`;
}
window.removeSelected=function(k){state.selected.delete(k);delete state.assign[k];persist();render();};

function exportRows(){
  return state.books.filter(b=>state.selected.has(key(b))).map(b=>({
    "Segmento":segmentLabels[b.segmento]||b.segmento,
    "Série(s)":chosenSeries(b).join(", "),
    "Título":b.titulo,
    "Autor":b.autor,
    "ISBN":b.isbn||"",
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

function exportExcelSimples(){
  if(!state.selected.size)return;
  const rows=exportRows();
  const ws=XLSX.utils.json_to_sheet(rows);
  ws["!cols"]=[{wch:20},{wch:22},{wch:40},{wch:30},{wch:18},{wch:55},{wch:35},{wch:22},{wch:10},{wch:22},{wch:15},{wch:15},{wch:35},{wch:30},{wch:20},{wch:45},{wch:14}];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"Minha seleção");
  XLSX.writeFile(wb,"Territorio_da_Leitura_2027.xlsx");
}


/* ===== Exportação no modelo oficial de adoção (modelo_adocao.xlsx) ===== */
const rng=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
const ADOCAO=[
  {name:"Educação Infantil",slots:{"Maternal":rng(12,15),"Educação Infantil 1":rng(17,20),"Educação Infantil 2":rng(22,25),"Educação Infantil 3":rng(27,30)}},
  {name:"Ensino Fundamental Anos Iniciai",slots:{"1º ano":rng(12,15),"2º ano":rng(17,20),"3º ano":rng(22,25),"4º ano":rng(27,30),"5º ano":rng(32,35)}},
  {name:"Ensino Fundamental Anos Finais",slots:{"6º ano":rng(12,15),"7º ano":rng(17,20),"8º ano":rng(22,25),"9º ano":rng(27,30)}}
];
const SERIE_T={"Maternal":"Maternal","Educação Infantil 1":"Infantil I","Educação Infantil 2":"Infantil II","Educação Infantil 3":"Infantil III","1º ano":"1º","2º ano":"2º","3º ano":"3º","4º ano":"4º","5º ano":"5º","6º ano":"6º","7º ano":"7º","8º ano":"8º","9º ano":"9º"};
const SEG_R={"EDUCAÇÃO INFANTIL":"Infantil","FUND 1":"Anos Iniciais","FUND 2":"Anos Finais"};
const exportSerie=b=>{const a=state.assign[key(b)];return (a&&a[0])||effSeries(b)[0]||"";};
function buildAdocao(){
  const sel=state.books.filter(b=>state.selected.has(key(b))).sort((a,b)=>localeSort(a.titulo,b.titulo));
  const pend=sel.filter(b=>!(state.assign[key(b)]||[]).length&&effSeries(b).length>1).length;
  const sheets=ADOCAO.map(s=>({name:s.name,slots:s.slots,cells:[]})), used={}, extras=[];
  sel.forEach(b=>{
    const ser=exportSerie(b), sh=sheets.find(s=>s.slots[ser]), pos=used[ser]||0;
    if(!sh||pos>=sh.slots[ser].length){extras.push({b,ser});return;}
    used[ser]=pos+1; const r=sh.slots[ser][pos];
    sh.cells.push({a:`E${r}`,v:b.isbn?Number(String(b.isbn).replace(/\D/g,"")):null},{a:`F${r}`,v:b.titulo},{a:`M${r}`,v:b.autor||""},{a:`R${r}`,v:SEG_R[b.segmento]},{a:`T${r}`,v:SERIE_T[ser]});
  });
  return {sheets,extras,pend};
}
async function exportExcel(){
  if(!state.selected.size)return;
  const {sheets,extras,pend}=buildAdocao();
  if(pend && !confirm(`${pend} livro(s) ainda não têm série escolhida e serão colocados na primeira série possível.\n\nPara corrigir, use a aba "Escolhas por série" e o botão ↔.\n\nExportar mesmo assim?`)) return;
  const escola=(prompt("Nome da escola (opcional):","")||"").trim();
  const simm=(prompt("Código SIMMWEB (opcional):","")||"").trim();
  try{
    if(!window.ExcelJS) throw new Error("biblioteca ExcelJS não carregou");
    const wb=new ExcelJS.Workbook(); await wb.xlsx.load(modeloBuffer());
    const THIN={top:{style:"thin"},left:{style:"thin"},bottom:{style:"thin"},right:{style:"thin"}};
    sheets.forEach(s=>{
      const ws=wb.getWorksheet(s.name); if(!ws) throw new Error("aba não encontrada: "+s.name);
      if(escola) ws.getCell("E10").value="NOME DA ESCOLA: "+escola;
      if(simm) ws.getCell("O10").value="SIMMWEB: "+simm;
      s.cells.forEach(c=>{ if(c.v!==null&&c.v!=="") ws.getCell(c.a).value=c.v; });
      if(s.cells.some(c=>c.a==="F20")&&s.name.includes("Iniciai")) ["F20","M20","T20"].forEach(a=>{ws.getCell(a).border=THIN;});
    });
    if(extras.length){
      const ex=wb.addWorksheet("Excedentes");
      ex.addRow(["Livros além das linhas disponíveis no modelo"]); ex.addRow([]);
      ex.addRow(["ISBN","Título","Autor","Segmento","Ano/Série"]);
      extras.forEach(({b,ser})=>ex.addRow([b.isbn?Number(String(b.isbn).replace(/\D/g,"")):"",b.titulo,b.autor||"",SEG_R[b.segmento],SERIE_T[ser]||ser]));
      ex.columns=[{width:18},{width:48},{width:30},{width:16},{width:14}];
    }
    const buf=await wb.xlsx.writeBuffer();
    const blob=new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    const url=URL.createObjectURL(blob), a=document.createElement("a");
    a.href=url; a.download=`${(escola||"Nome da Escola").replace(/[\\/:*?"<>|]/g,"")} - SIM - Território da Leitura.xlsx`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),3000);
    if(extras.length) alert(`${extras.length} livro(s) não couberam nas linhas do modelo e foram para a aba "Excedentes".`);
  }catch(err){
    console.error(err);
    alert("Não foi possível gerar a planilha no modelo ("+err.message+"). Vou baixar a versão simples.");
    exportExcelSimples();
  }
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
$("#clearSelection").onclick=()=>{state.selected.clear();state.assign={};persist();render()};
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeDrawer();if($("#bookDialog").open)$("#bookDialog").close()}});


const VIEW_TABS=[["Maternal","Maternal"],["Educação Infantil 1","EI 1"],["Educação Infantil 2","EI 2"],["Educação Infantil 3","EI 3"],["1º ano","1º ano"],["2º ano","2º ano"],["3º ano","3º ano"],["4º ano","4º ano"],["5º ano","5º ano"],["AF","Anos Finais"]];
const inSeries=(b,s)=>s==="AF"?b.segmento==="FUND 2":chosenSeries(b).includes(s);
const pending=b=>!(state.assign[key(b)]||[]).length&&effSeries(b).length>1;
const S_AF=b=>b.segmento==="FUND 2"&&(state.assign[key(b)]||[])[0]?` <small>· ${esc(state.assign[key(b)][0])}</small>`:"";
function chipHtml(b){
  const k=key(b);
  return `<span class="chip ${pending(b)?'pending':''}"><button class="chip-t" onclick="openBook('${jsq(k)}')">${b.capaUrl?`<img src="${escAttr(b.capaUrl)}" alt="" loading="lazy" onerror="this.remove()">`:""}${esc(b.titulo)}${S_AF(b)}</button><button class="chip-s" title="Trocar de série" onclick="reassign('${jsq(k)}')">↔</button><button class="chip-x" title="Remover da seleção" onclick="removeSelected('${jsq(k)}')">×</button></span>`;
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
    if(todos.length) rows+=`<tr class="has"><th>Socioemocional</th><td>${todos.map(chipHtml).join("")}</td></tr>`;
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
  ${sel.some(pending)?`<p class="st-warn">Alguns livros ainda aparecem em mais de uma série (os destacados). Clique em ↔ para escolher a série de cada um.</p>`:""}<p class="st-note">Cada livro aparece só na série escolhida. Para trocar, use ↔; para escolher mais livros, volte ao Catálogo e use “Selecionar”.</p>`;
}
document.addEventListener("click",e=>{const t=e.target.closest("#stTabs .st"); if(t){state.viewSeries=t.dataset.s;renderChoices();}});

document.addEventListener("click",async e=>{
  const btn=e.target.closest("[data-copy]"); if(!btn)return;
  const text=btn.dataset.copy;
  try{ await navigator.clipboard.writeText(text); }
  catch(err){ const t=document.createElement("textarea"); t.value=text; t.style.position="fixed"; t.style.opacity="0"; document.body.appendChild(t); t.select(); try{document.execCommand("copy")}catch(_){} t.remove(); }
  btn.innerHTML=CHECK_ICON; btn.classList.add("done");
  setTimeout(()=>{btn.innerHTML=COPY_ICON; btn.classList.remove("done");},1600);
});

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

/* Modelo oficial de adoção embutido (não depende de arquivo externo) */
function modeloBuffer(){
  const bin=atob(MODELO_B64.replace(/\s+/g,"")); const u=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
  return u.buffer;
}
const MODELO_B64=`
UEsDBBQABgAIAAAAIQCNf7HqugEAAD4JAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAACAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADMVstu2zAQvBfoPwi8Fhad9IEisJxD2h7bAEk/gCHX
EmGKJLibxP77LhnHKALHriID9UUPUjszOyJ3Obtc9a56gIQ2+Eac1VNRgdfBWN824vftj8lXUSEpb5QLHhqxBhSX8/fvZrfrCFhx
tMdGdETxQkrUHfQK6xDB88wipF4Rv6ZWRqWXqgV5Pp1+kTp4Ak8TyhhiPvsGC3XvqPq+4uEnJXfWi+rq6btM1QgVo7NaEQuVD968
IJmExcJqMEHf9wxdY0ygDHYA1Ls6JsuM6QaIODEUcidn9O0LTttnzXl8d0QCh8NkbnyoObKkgp2N+IHNeoUhz7zuwybuF//AZA1U
1yrRT9WzW3Ll5GNIy7sQlvV+kKFmFlPrXln/rHsPf/kYZbmdHVlIzq8AD9RxfiI6Pp6Ijk8nouPzf9JBXLVAluv4JVpgDixIpLUD
PPa2LKCHmDuVwNwQ18P26AL+xj6gwyT1mCXIzcN43zdAA3nHl4K38Y7f+v/Gq5XTVx2X6iMvti3uPr+5GV+nEJH7fYLhAp5bZY6e
RAaCRBa2zXJX09ky8mFhdMaQTyMGzA5uWU4/8z8AAAD//wMAUEsDBBQABgAIAAAAIQC1VTAj9AAAAEwCAAALAAgCX3JlbHMvLnJl
bHMgogQCKKAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArJJN
T8MwDIbvSPyHyPfV3ZAQQkt3QUi7IVR+gEncD7WNoyQb3b8nHBBUGoMDR3+9fvzK2908jerIIfbiNKyLEhQ7I7Z3rYaX+nF1Byom
cpZGcazhxBF21fXV9plHSnkodr2PKqu4qKFLyd8jRtPxRLEQzy5XGgkTpRyGFj2ZgVrGTVneYviuAdVCU+2thrC3N6Dqk8+bf9eW
pukNP4g5TOzSmRXIc2Jn2a58yGwh9fkaVVNoOWmwYp5yOiJ5X2RswPNEm78T/XwtTpzIUiI0Evgyz0fHJaD1f1q0NPHLnXnENwnD
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
ABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0Mi54bWy0ndty2zi2hu931X4Hb9Vcjm2dTxV7yjYjieejGN+qbTlWxbY8ktJJz9S80zzD
PNleJAFiET/itnrSXW0b+bAAgvixQHAJpD787fvz08mv691+s325aHXO2q2T9cvd9n7z8vmitcxmp+PWyf6werlfPW1f1het39b7
1t8u//d/Pnzb7r7sH9frwwnV8LK/aD0eDq/T8/P93eP6ebU/276uXyjnYbt7Xh3on7vP5/vX3Xp1XxZ6fjrvttvD8+fV5qVV1TDd
vaeO7cPD5m5tbe++Pq9fDlUlu/XT6kDt3z9uXveytue791T3vNp9+fp6erd9fqUqftk8bQ6/lZW2Tp7vpvbnl+1u9csTnff3Tn91
d/J9R/936acnD1NyONLz5m633W8fDmdU83nVZjz9yfnkfHVX14Tn/65qOv3z3frXTSGgqqr7x5rUGdR1dVVlvT9Y2bCurOiu3fTr
5v6i9c/eTXsyG/WGp72PV8PTfm8yOr2ajW9OrevBcNJuX88Gw6t/tS4/3G9I4eKsTnbrh4vWTWd6O+q0zi8/lAMo36y/7Vn6ZP+4
/Tbfbe69zcuaRiON41/J5KL1uvq8vqZx9yUqemn9rXXyj+32Ob1bFaqOB+yfQTFUnzSYFkPcW/22/XooDlnlFmP/l+32S0FsOqc2
NXe/flrfFaPwZEV/fl3frJ+oLr9Dp77/e3kGlJ7G9G86hfP6HHhans+s9Jlod3K/flh9fTrcbJ8+be4PjxetyVmn3x52qdUiK9l+
W6w3nx8P5LvjsxFllANyev+btd7fkYdQ487KQ95tn6h++n3yvCk8nQb46vtFi2T+VtXdPRuM2r1OUfn+8FvRO2Rz93V/2D6Lo5e9
X9dAJ1bWQH9FDZ2zUac96RWteFcNfVED/ZU1tM+640FnUJ6iqINqe6MVlFu2gv7K82ifjQeD/nDM2vF2HUNRR2fyXzSkSyOu6lFK
yNMZHHs63VoXSshaRtCvb59Pl0StmqLU7Rzds10pcFfp0z3rdwej8fsHSTGayqZ0hr2xqkeN43qgFF5RjdHSN6zVYXX5Ybf9dkLT
IvXF/nVVXGR606I1xjFOg7uwvalGaZG0inLFEKe6y7yPOpjpYK6DhQ5sHTg6cHXg6cDXQaCDUAeRDmIdJDpIdZDpYKmDXAefVG/e
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
8CgqbE9IokXifBStW7ZM24qWRA9Jt907Me80zzBPtgkgC5VVf5lttd0b2yP4Q1YBqD8rq5AogC///vXx4ei39XZ3v3l6dey96B0f
rZ/uNu/unz68Or6prk/Ojo92+9XTu9XD5mn96vj39e7476//+79eftlsf919XK/3R1TD0+7V8cf9/tP56enu7uP6cbV7sfm0fqI9
7zfbx9We/rn9cLr7tF2v3jWFHh9O+73e+PRxdf903NZwvv2eOjbv39/frWebu8+P66d9W8l2/bDa0/nvPt5/2qnaHu++p7rH1fbX
z59O7jaPn6iKX+4f7ve/N5UeHz3enfsfnjbb1S8PdN1fveHq7ujrlv6/T/8N1GEaDkd6vL/bbnab9/sXVPNpe854+dPT6enqrqsJ
r/+7qvGGp9v1b/e1gLqq/p87JW/U1dXXlQ3+ZGXjrrK6ubbnn+/fvTr+Z28yvr4YTPon/Vn/8mQ47c1OLmcXg5PL8dXV8HLUH06u
Rv86fv3y3T0pXF/V0Xb9/tXxhXd+O5kcn75+2TjQ8n79ZSe2j3YfN1/m2/t30f3TmryR/Pg3Mnl1/Gn1YX1JfvdrVrfS+svx0f9t
No/l3apW9Wwk/pnUrvpgwbJ28Wj1++bzvj5ku7f2/V82m19r4tM19eh0d+uH9V3thUcr+vPb+mr9QHXNPGrH3T+aK6i36fRPu/OX
2+parpv+km2P3q3frz4/7K82D2/v3+0/vjqevvCGvXGfzph3FZsvi/X9h4976rdnLya0o3HG83e/z9a7O+oddGIvBvUh7zYPVD/9
79Hjfd3LyblXX18d06l9aevuvxhNegOvrny3/71uGbK5+7zbbx756B7X09ZAejY10F+uwXsx8XrTQX0W31XDkGugv6qG3ov+2cgb
NZfIdVBtB86C9jZnQX/VddBpf1fRMRf1aONPH9+bqFpog2sZYEPQ6f2y3u2v72uhDl6QR8G2uSJv+gOn1Sffb/WlDX1xw/5ociYl
npL+B1q337kJbahqJihz7/A19eko7dlod/OeLXVfeVxfO0z/BVzSH5yKchhvPDjT9eiO1Xlu3U3bTtN01tlqv3r9crv5ckQxunax
T6t6xBuc12fj7HTU22rbq7bb1Juzulzd5+r+WIM3Nri2wdwGCxv4NghsENogskFsg8QGqQ0yG+Q2KGxQ2qBqwdm4a5Cblgw7sLTL
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
B/tojzNSUpwqnWUKioflN+IheaGzdegX3ckPmvBvXU9BPaR09pCC+kHp9nbvjPa49CkofpTO+EE/u0Vn7Wod+t0l2uM8tz6dmzPq
0e9s0B53T6Rza33ntLvU3euX72j8Wq4e7unv/eapG776NHqZu472v39avzp+uN/tj49WDw+bL5cPq6dfm2+W7T5uvvhPnz7v4/Vu
t/pAZnUqjOCb7XazNeA/mpGQ7k7Oab57RO+ondMy8aOK+kk1PKO/3hF9IvG8+XbX1+355/t3r47/Obv0hpPx5ejk6tLrnwzHZ72T
i96sd9LrvZlMh8PLYW80+Red8PvN9vHzw8p7fez959//26f/BvTfkP4b/effxy9Pu/0vT81r+0uvle7Xzmn+f0Tv7J3TsvkjegHz
iL5fdkQfVaK/4/PmG4Tdtfau+hf0rGx4cjaezk6GZ9fDk8tB//JkMvWG3ng0Hk3H1rX6yfVFUvnR/17fJLOL+E1SXUSHL9a6evKC
TyRavNp+uCcPeFi/p/lL78XI8848+kU8uqPe3n+o798Ntq+/V9d7MTmbDHveaDKctv9HE+BfNvv95vEbOz+uV+/W23rnwBtOx71x
v8f/R4mj95vN/ls7KXzUZ1mu958/He3uVg/kZfVXZDbb+/XTvvHeV8efNtv9dnVPHro9r11n679rQt+77erL/dMHTZvhcv11H+32
r1/S36PP23vytKurN+OL0WhyMp1cXp0MfzmbnlzMLscns+nVdHB1cXE5mF3/6/jo6+PD0+6cFsy+Ov643386Pz3d3X1cP652Lx7v
77ab3eb9/sXd5vF08/79/d36dPdpS1fdTBcfH07pgqen09PH1f0T+SxVcv7NPqgORI35PcdZf71bN/WPv137z+nGnbt6vTeDoXdB
/jk6uzgZTnvTkzP66YGTydlocDUcTWaTs1ndNevL1N3v6+P5+9cZhY/h//zt8m/Tc/ofjz4S0WD6Y9vu6qDxuo5t9PMOR4VHc2Vv
TH/p3336d5/G8j71JRqfKWrTv5u5NP2lf/fp3+1smP7Svwej5jBtje2h7FCAivzkNru4GlLE8kYnZwOvdzK8nF2dnE36w5Pp6M3l
1Dvrvzm7uPyjNqOxgRqtTx/kOdxoFTVK9R0X3TS65Yf0hVnqGe3/Nv3k9Mtm+2vjxq//HwAA//8DAFBLAwQUAAYACAAAACEAgSMk
9bcBAACUAwAAGAAAAHhsL3dvcmtzaGVldHMvc2hlZXQ0LnhtbJyT32vbMBDH3wf7H4Tebfln05g4Za0b1ofBGGvfFflsi1iSkZQm
Yex/39kh7iAvoWCDzjp97nu6r1cPR9WTd7BOGl3SOIwoAS1MLXVb0tffm+CeEue5rnlvNJT0BI4+rL9+WR2M3bkOwBMkaFfSzvuh
YMyJDhR3oRlA405jrOIeQ9syN1jg9XRI9SyJojumuNT0TCjsLQzTNFJAZcRegfZniIWee9TvOjm4C02JW3CK291+CIRRAyK2spf+
NEEpUaJ4abWxfNtj38c444IcLT4JvumlzPT9qpKSwhpnGh8imZ01X7e/ZEvGxUy67v8mTJwxC+9yHOAHKvmcpDifWckHLP0k7G6G
jddli72sS/onXT4/JYvkOUizvAqyzWMcLJPFJkgW8VOW3OfVY57+petVLXHCY1fEQlPSbzFl69VknjcJB/ffmoxe3BqzGzdesEY0
prKr3M3kxZ+W1NDwfe9/mcN3kG3n0fg5KhxHXNSnCpxAbyEmTPK5aMU9R+rAW/jBbSu1Iz00U9aCEnvGRCGuvRnGswtEbo33Rl2i
Dt0POOUoxPtojPGXYFQ7/0/rfwAAAP//AwBQSwMEFAAGAAgAAAAhAEx4lid4GwAA3ZIAABgAAAB4bC93b3Jrc2hlZXRzL3NoZWV0
NS54bWy0ndty2zi2hu931X4Hb9Vcjm1RJ1uq2FNOaEk8H6X4Vm3LsSqS5ZGU057qd5pnmCfbiyRALOBn3FbvdLodIx8WQAA/TlwC
qXf/+L5Zn3xd7var7fNVyzprt06Wz/fbh9Xzp6vWLB+fXrZO9ofF88NivX1eXrV+LPetf1z/93+9+7bdfd4/LZeHE8rheX/Vejoc
Xkbn5/v7p+VmsT/bviyfKeZxu9ssDvTP3afz/ctuuXgoE23W5512e3C+WayeW1UOo91b8tg+Pq7ul/b2/stm+XyoMtkt14sDlX//
tHrZy9w292/JbrPYff7ycnq/3bxQFr+t1qvDjzLT1snmfuR8et7uFr+tqd7frd7i/uT7jv7v0E9XXqbkcKXN6n633W8fD2eU83lV
Zqz+8Hx4vrivc8L6vykbq3e+W35dFQKqrDp/rkhWv86rozLr/snMBnVmRXPtRl9WD1etf7XFn1P6bRV/tU/b3eIv9uf31vW7sp/E
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
LbFhQ/genet3lbwYG7aUjBgd0Ol+iR505TxPlRwVWnLI1tCwYM2ymgYCyt4KW0SeDG+APIQbG7R4KFGGwrc22vg5FK6ZqZcsBadY
1PkswAu5p1JZm3rR5l97/LHJ3Tu88YPewfHOa2+9XzQfkPinWWpx49RVHN0txiCzcyI9qKtrwA1x/emUMfSLH2UMAU0/ufu9J6/+
mTd++MNi13JNGn3oHkDhuVnOypaEd3DvwH33rtZQRNmluuR9sn1o8ROrVHH01lvw/sW2suonl00eO+7t3XOfTE2UMt7eTz996w0Q
wI1xd+kPr/KOn/iop/cpO7V/w+ihba88izyT/KUJKtfzg+97Bw7u27zhdtPY99obyPNPR9c/1NZy8LW/TB47vOI3P7mvpQk04731
zou28+7Df3pWQzmXO2XO2/bBsaMTfT/6wRqRHt/0ysGd22+whdf6M4ffeu0FWXizq9cbn3z5wgUPzkl7x455B4+svvm6gxuHvI/e
z1528UpN7E/b3TKci9whM3021200ovqs0UhhhQHJxsWshOqglKsD8ZNkxJ3wAXBAXiRDEWLR0m5CgQgny2vjvm0ooEDcRLt9MkMm
6FSUT67PoPJx6QmV2TMw6B04euztv954Qbt34NOnm5qXzWC7JbgjNucIeY0fsLVRSR9RhGWGOL5y6e08dWL/jiNv/aVXV5f/8qrj
+/e8s+X1ExMn/rps6QO69vHGkYkP37l/et3SVIt34EDhnlt7XGGlLS25YIG3/3Dn3fcu1owdpf5Dr73ZYdv563955MjE+9muvGsu
bpz5oBB77YXHvcnxD8aGJ7d/4E1MTO7/dHwHROj+obtuWAtnaKo94CdHWOqq3s6dk8f2Hz2wyxvfe/TgvhPjhybHD3hHjxybGP9L
15rdr77iTZzwPti26PLvewc/7prXlNXEPtMYf/2vR8cP3K1LLyTNw2+/d/Tw+Aebi97h7Zvvu3uVbR3f9v7kex8sUfkXLgKSJlbe
cPND9PSnYo1PSUrm17868eGrT89JLE8YT+lq3rIHBHYoCQPClBIqnMWQLfYqjYOumJFieQuVFD5TKY+7lKFAtmRmVcqo4o0zlESI
QIFMDH0XUIiXbJS02KCt9io8rN1yR97WtRrlvP/e+8Hb3Tf9xvvo9T9zjes0NaPKQ6baJfMvqMrI7369pm32Ok0cuON3kwc+WXvf
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
AAD//wMAUEsDBBQABgAIAAAAIQCiOxGtsAEAADQVAAAnAAAAeGwvcHJpbnRlclNldHRpbmdzL3ByaW50ZXJTZXR0aW5nczEuYmlu
7JTLSsNAFIb/Nl6KLlQQ3LiQLqUFS+NtZ2larTSmNK10W2yEgCYlTSkqLsSHEMRXEfoIfQDXrsQHcKP/xIooKkXcCGfCybnMmTMz
H8Mx4eIAAXx0KIcIsYQKfRdeZIeMqoiBIr4asTFt4g6NeS0dg/qup/VEi3oGjXicuhHX+M9B/3L174Kx4TKl4xSlnzm2S/aHbYzS
Xj2JAVJaau7q1t78abfxaHItqvWHR5VS/4jA27sa5cgDJtlmbVflzqKPM6xgg6+8SJ3hP4c0ClhDlrE0xcA6vzRzsowXaK3Q1+ln
qPP0sliNvHNWrBZso1xG3XMDp6OsSrPtBLZ76iCnwwpcxwuboet7qFjVWjVXqqHqdPyjbhSjabWVlUHeP/ID0285r9b3N0vNAfu6
Yb4xuJlqJxeZ/kDRKE8xK6Hf98zLx8mdhf7qhbp/eTiHxHtdlav85aFW/hZlX/mzIAef/aaLYzhRh6mz7zjsNxU0aXXQ43yAFpM/
Z1qc80bMzbPGCdrsYDZXqP1URwsZkyEEhIAQEAJCQAgIASEgBISAEBACQkAICIFRCLwAAAD//wMAUEsDBBQABgAIAAAAIQCiOxGt
sAEAADQVAAAnAAAAeGwvcHJpbnRlclNldHRpbmdzL3ByaW50ZXJTZXR0aW5nczIuYmlu7JTLSsNAFIb/Nl6KLlQQ3LiQLqUFS+Nt
Z2larTSmNK10W2yEgCYlTSkqLsSHEMRXEfoIfQDXrsQHcKP/xIooKkXcCGfCybnMmTMzH8Mx4eIAAXx0KIcIsYQKfRdeZIeMqoiB
Ir4asTFt4g6NeS0dg/qup/VEi3oGjXicuhHX+M9B/3L174Kx4TKl4xSlnzm2S/aHbYzSXj2JAVJaau7q1t78abfxaHItqvWHR5VS
/4jA27sa5cgDJtlmbVflzqKPM6xgg6+8SJ3hP4c0ClhDlrE0xcA6vzRzsowXaK3Q1+lnqPP0sliNvHNWrBZso1xG3XMDp6OsSrPt
BLZ76iCnwwpcxwuboet7qFjVWjVXqqHqdPyjbhSjabWVlUHeP/ID0285r9b3N0vNAfu6Yb4xuJlqJxeZ/kDRKE8xK6Hf98zLx8md
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
AAA=
`;
