/* ============================================================
   DOPAMINE DIGITAL WIKI — SHARED JS
   v2.0 — Mar 2026
   ============================================================ */

// ===== THEME =====
function toggleTheme(){
  const t=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',t);
  document.getElementById('theme-icon').textContent=t==='dark'?'\u{1F319}':'\u2600\uFE0F';
  document.getElementById('theme-label').textContent=t==='dark'?'Dark':'Light';
  localStorage.setItem('wiki-theme',t);
}
(function initTheme(){
  const t=localStorage.getItem('wiki-theme')||'light';
  document.documentElement.setAttribute('data-theme',t);
  const icon=document.getElementById('theme-icon');
  const label=document.getElementById('theme-label');
  if(icon)icon.textContent=t==='dark'?'\u{1F319}':'\u2600\uFE0F';
  if(label)label.textContent=t==='dark'?'Dark':'Light';
})();

// ===== CARD MOUSE GLOW (rAF throttled) =====
let glowRAF=0;
document.addEventListener('mousemove',e=>{
  cancelAnimationFrame(glowRAF);
  glowRAF=requestAnimationFrame(()=>{
    document.querySelectorAll('.card').forEach(c=>{
      const r=c.getBoundingClientRect();
      c.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
      c.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
    });
  });
});

// ===== COPY AI PROMPTS =====
function copyPrompt(el){
  const text=el.textContent.replace(/^click to copy|^tap to copy|^copied!/i,'').trim();
  if(navigator.clipboard){
    navigator.clipboard.writeText(text).then(()=>showCopied(el));
  }else{
    const ta=document.createElement('textarea');
    ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();document.execCommand('copy');
    document.body.removeChild(ta);showCopied(el);
  }
}
function showCopied(el){el.classList.add('copied');setTimeout(()=>el.classList.remove('copied'),2000);}

// ===== COPY BUTTON ICONS (auto-created for .cp-text and .template) =====
(function initCopyButtons(){
  const SVG='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  function addBtn(container,textEl){
    if(container.querySelector('.cp-copy-btn')||container.querySelector('.copy-btn'))return;
    var btn=document.createElement('div');
    btn.className='cp-copy-btn';
    var span=document.createElement('span');
    span.innerHTML=SVG;
    span.title='Copy to clipboard';
    span.addEventListener('click',function(e){
      e.stopPropagation();
      var text=textEl.textContent.replace(/^click to copy|^tap to copy|^copied!/i,'').trim();
      navigator.clipboard.writeText(text).then(function(){
        span.classList.add('copied');
        span.innerHTML='\u2713';
        setTimeout(function(){span.classList.remove('copied');span.innerHTML=SVG},2000);
      });
    });
    btn.appendChild(span);
    textEl.appendChild(btn);
  }
  document.querySelectorAll('.claude-prompt .cp-text').forEach(function(el){
    addBtn(el.closest('.claude-prompt'),el);
  });
  document.querySelectorAll('.template').forEach(function(el){
    var textEl=el.querySelector('p')||el;
    addBtn(el,el);
  });
})();

// ===== CHECKLIST RESET (called from SOP pages) =====
function resetChecklist(sopKey){
  if(!confirm('Reset all checklist progress?'))return;
  localStorage.removeItem(sopKey);
  document.querySelectorAll('.step-check').forEach(s=>{
    s.classList.remove('checked');
    s.querySelector('.check-box').innerHTML='';
  });
  if(typeof updateProgress==='function')updateProgress();
}

// ===== SCROLL FADE-IN =====
const fadeObserver=new IntersectionObserver((entries)=>{
  entries.forEach((entry,i)=>{
    if(entry.isIntersecting){
      setTimeout(()=>entry.target.classList.add('visible'),i*60);
      fadeObserver.unobserve(entry.target);
    }
  });
},{threshold:.1,rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.fade-in').forEach(el=>fadeObserver.observe(el));

// ===== SCROLL HANDLER (combined for performance) =====
const progressBar=document.querySelector('.reading-progress');
const topbar=document.querySelector('.topbar');
let scrollRAF=0;
window.addEventListener('scroll',()=>{
  cancelAnimationFrame(scrollRAF);
  scrollRAF=requestAnimationFrame(()=>{
    const y=window.scrollY;
    if(progressBar){
      const h=document.documentElement.scrollHeight-window.innerHeight;
      if(h>0)progressBar.style.width=(y/h*100)+'%';
    }
    if(topbar)topbar.style.boxShadow='none';
  });
},{passive:true});

// ===== TOC ACTIVE STATE =====
// Exported as function so wiki-ai.js can re-init after DOM transform
window.initTocScrollSpy=function(){
  // Only run scroll-spy on detail pages (SOPs, docs) -- not on index/home/subpages
  var p=location.pathname;
  var isIndex=p==='/'||p==='/index.html'||p.match(/\/[^/]+\/$/)||p.match(/\/[^/]+\/index\.html$/);
  if(isIndex)return;
  const tocLinks=document.querySelectorAll('.toc-link');
  if(!tocLinks.length)return;
  const tocSections=document.querySelectorAll('.step, .quick-ref, [id]');
  const tocObserver=new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting&&entry.target.id){
        tocLinks.forEach(link=>{
          link.classList.toggle('active',link.getAttribute('href')==='#'+entry.target.id);
        });
      }
    });
  },{threshold:0,rootMargin:'-80px 0px -60% 0px'});
  tocSections.forEach(s=>{if(s.id)tocObserver.observe(s)});
};
// Auto-init on detail pages
window.initTocScrollSpy();

// ===== LOGO → HOME =====
document.querySelectorAll('.topbar-logo,.topbar-title').forEach(el=>{
  el.style.cursor='pointer';
  el.addEventListener('click',()=>window.location.href='/');
});

// ===== SEARCH MODAL =====
(function initSearchModal(){
  var overlay=document.getElementById('searchOverlay');
  var existingOverlay=!!overlay;

  // Build search index from page content
  var items=[];
  // Index cards (homepage, client portals)
  document.querySelectorAll('.card').forEach(function(c){
    var title=(c.querySelector('h3')||{}).textContent||'';
    var desc=(c.querySelector('p')||{}).textContent||'';
    var icon=(c.querySelector('.card-icon')||{}).textContent||'';
    var href=c.getAttribute('href')||'';
    var tags='';
    c.querySelectorAll('.meta-tag').forEach(function(t){tags+=' '+t.textContent});
    items.push({title:title,desc:desc,icon:icon,href:href,tags:tags,text:(title+' '+desc+' '+tags).toLowerCase()});
  });
  // Index section headers
  document.querySelectorAll('.section-header h2').forEach(function(h){
    items.push({title:h.textContent,desc:'Section',icon:'',href:'#',tags:'',text:h.textContent.toLowerCase()});
  });
  // Index SOP steps/sections (for pages with .toc-link anchors)
  document.querySelectorAll('.toc-link[href^="#"]').forEach(function(a){
    var href=a.getAttribute('href').slice(1);
    var title=a.textContent.trim();
    var phase='';
    var sec=a.closest('.toc-section');
    if(sec){var lab=sec.querySelector('.toc-section-label');if(lab)phase=lab.textContent.replace(/Phase \d+:\s*/i,'');}
    items.push({title:title,desc:phase,icon:'',href:'#'+href,tags:'',text:(title+' '+phase).toLowerCase()});
  });

  if(!items.length&&!existingOverlay)return;

  // Create overlay if page doesn't already have one
  if(!existingOverlay){
    overlay=document.createElement('div');
    overlay.className='search-overlay';
    overlay.id='searchOverlay';
    overlay.innerHTML='<div class="search-modal"><input type="text" id="searchInput" placeholder="Search docs..." autocomplete="off"><div class="search-results" id="searchResults"></div><div class="search-footer"><kbd>\u2191\u2193</kbd> navigate <kbd>\u23CE</kbd> open <kbd>esc</kbd> close</div></div>';
    document.body.appendChild(overlay);
  }

  overlay.onclick=function(e){if(e.target===overlay)closeSearch()};
  var input=document.getElementById('searchInput');
  var results=document.getElementById('searchResults');
  var idx=-1;

  function highlight(text,q){
    if(!q)return text;
    var i=text.toLowerCase().indexOf(q);
    if(i===-1)return text;
    return text.slice(0,i)+'<mark>'+text.slice(i,i+q.length)+'</mark>'+text.slice(i+q.length);
  }
  function render(){
    var q=input.value.toLowerCase().trim();
    var matches=q?items.filter(function(it){return it.text.includes(q)}):items;
    idx=-1;
    if(!matches.length){results.innerHTML='<div class="search-empty">No results found</div>';return}
    results.innerHTML=matches.map(function(m,i){
      return '<a href="'+m.href+'" class="search-result" data-idx="'+i+'" onclick="closeSearch()"><div>'+(m.icon?'<div class="sr-icon">'+m.icon+'</div>':'')+'<div class="sr-title">'+highlight(m.title,q)+'</div>'+(m.desc?'<div class="sr-desc">'+highlight(m.desc,q)+'</div>':'')+'</div></a>';
    }).join('');
  }
  function nav(e){
    var links=results.querySelectorAll('.search-result');
    if(!links.length)return;
    if(e.key==='ArrowDown'){e.preventDefault();idx=Math.min(idx+1,links.length-1)}
    else if(e.key==='ArrowUp'){e.preventDefault();idx=Math.max(idx-1,0)}
    else if(e.key==='Enter'&&idx>=0){e.preventDefault();links[idx].click();closeSearch();return}
    else if(e.key==='Escape'){closeSearch();return}
    else return;
    links.forEach(function(l,i){l.classList.toggle('active',i===idx)});
    if(idx>=0)links[idx].scrollIntoView({block:'nearest'});
  }
  input.addEventListener('input',render);
  input.addEventListener('keydown',nav);
  window.openSearch=function(){
    overlay.classList.add('open');
    input.value='';
    render();
    input.focus();
  };
  window.closeSearch=function(){
    overlay.classList.remove('open');
    idx=-1;
  };
})();

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key==='k'){
    e.preventDefault();
    if(typeof openSearch==='function')openSearch();
  }
  if(e.key==='Escape'){
    if(typeof closeSearch==='function')closeSearch();
    if(typeof closeMobileMenu==='function')closeMobileMenu();
  }
});

// ===== MOBILE HAMBURGER MENU =====
(function initMobileMenu(){
  var topbar=document.querySelector('.topbar');
  var topbarRight=document.querySelector('.topbar-right');
  if(!topbar||!topbarRight)return;

  // Create hamburger button
  var burger=document.createElement('button');
  burger.className='mobile-burger';
  burger.setAttribute('aria-label','Open menu');
  burger.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  topbar.appendChild(burger);

  // Create overlay
  var overlay=document.createElement('div');
  overlay.className='mobile-menu-overlay';
  document.body.appendChild(overlay);

  // Create slide-out panel
  var panel=document.createElement('div');
  panel.className='mobile-menu-panel';

  // Panel header
  var header=document.createElement('div');
  header.className='mobile-menu-header';
  header.innerHTML='<span>Menu</span>';
  var closeBtn=document.createElement('button');
  closeBtn.className='mobile-menu-close';
  closeBtn.setAttribute('aria-label','Close menu');
  closeBtn.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  header.appendChild(closeBtn);
  panel.appendChild(header);

  // Panel body — clone topbar-right items
  var body=document.createElement('div');
  body.className='mobile-menu-body';

  // Search button
  var searchBtn=document.createElement('button');
  searchBtn.className='mobile-menu-item';
  searchBtn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg><span>Search docs</span>';
  searchBtn.addEventListener('click',function(){closeMobileMenu();if(typeof openSearch==='function')openSearch()});
  body.appendChild(searchBtn);

  // Theme toggle
  var themeBtn=document.createElement('button');
  themeBtn.className='mobile-menu-item';
  var themeIcon=document.documentElement.getAttribute('data-theme')==='dark'?'\u{1F319}':'\u2600\uFE0F';
  var themeLabel=document.documentElement.getAttribute('data-theme')==='dark'?'Dark Mode':'Light Mode';
  themeBtn.innerHTML='<span class="mm-theme-icon">'+themeIcon+'</span><span>'+themeLabel+'</span>';
  themeBtn.addEventListener('click',function(){
    toggleTheme();
    var t=document.documentElement.getAttribute('data-theme');
    themeBtn.querySelector('.mm-theme-icon').textContent=t==='dark'?'\u{1F319}':'\u2600\uFE0F';
    themeBtn.querySelector('span:last-child').textContent=t==='dark'?'Dark Mode':'Light Mode';
  });
  body.appendChild(themeBtn);

  // Demo/Showcase toggle (if exists on page)
  var demoToggle=document.getElementById('demoToggle');
  if(demoToggle){
    var demoBtn=document.createElement('button');
    demoBtn.className='mobile-menu-item';
    demoBtn.innerHTML='<span class="demo-dot" style="width:6px;height:6px;border-radius:50%;background:var(--text-dim)"></span><span>Showcase Mode</span>';
    demoBtn.addEventListener('click',function(){if(typeof toggleDemo==='function')toggleDemo();closeMobileMenu()});
    body.appendChild(demoBtn);
  }

  // TOC toggle (if sidebar exists)
  var tocSidebar=document.querySelector('.toc-sidebar');
  if(tocSidebar){
    var tocBtn=document.createElement('button');
    tocBtn.className='mobile-menu-item';
    tocBtn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="16" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="12" y2="18"/></svg><span>Table of Contents</span>';
    tocBtn.addEventListener('click',function(){
      closeMobileMenu();
      tocSidebar.classList.toggle('open');
    });
    body.appendChild(tocBtn);
  }

  // Home link
  var homeBtn=document.createElement('a');
  homeBtn.className='mobile-menu-item';
  homeBtn.href='/';
  homeBtn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Wiki Home</span>';
  body.appendChild(homeBtn);

  panel.appendChild(body);
  document.body.appendChild(panel);

  // Toggle handlers
  burger.addEventListener('click',function(){
    panel.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow='hidden';
  });
  window.closeMobileMenu=function(){
    panel.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow='';
  };
  closeBtn.addEventListener('click',closeMobileMenu);
  overlay.addEventListener('click',closeMobileMenu);
})();

// ===== SIDEBAR TOGGLE =====
function toggleSidebar(){
  const collapsed=document.body.classList.toggle('sidebar-collapsed');
  localStorage.setItem('wiki-sidebar-collapsed',collapsed?'1':'0');
}
(function initSidebarState(){
  if(!document.body.classList.contains('has-toc'))return;
  if(localStorage.getItem('wiki-sidebar-collapsed')==='1'){
    document.body.classList.add('sidebar-collapsed');
  }
  document.documentElement.classList.remove('sidebar-collapsed-pending');
  // Enable transitions after sidebar state is applied (double rAF ensures paint)
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    document.documentElement.classList.remove('sidebar-no-transition');
  })});
})();

// Remove faint divider line immediately before footer on all pages
document.querySelectorAll('footer.footer').forEach(function(f){
  var prev=f.previousElementSibling;
  if(prev&&prev.classList.contains('divider'))prev.style.display='none';
});
