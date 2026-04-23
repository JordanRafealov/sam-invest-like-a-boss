/* wiki-nav.js — Contextual sidebar navigation
   Loaded AFTER wiki.js and wiki-ai.js on every page.
   - Pages with data-keep-nav on <body> keep their own sidebar content
   - Client sub-pages → client deliverables + related SOPs + tools
   - SOP pages → category siblings + other categories + navigation
   - Demo pages → all demos + navigation
   - Everything else → homepage navigation */
(function(){
  if (document.body.hasAttribute('data-keep-nav')) return;

  var path = location.pathname;
  var P = '/sops/';
  var navHTML;

  /* ── Helper to build a link ── */
  function lnk(href, text, ext) {
    if (ext) return '<a href="' + href + '" target="_blank" rel="noopener" class="toc-link dash-ext">' + text + ' <span class="ext-arrow">&#8599;</span></a>';
    return '<a href="' + href + '" class="toc-link">' + text + '</a>';
  }
  function dot(href, text) {
    return '<a href="' + href + '" class="toc-link"><span class="sb-dot sb-green"></span>' + text + '</a>';
  }
  function sec(label, color, links) {
    var h = '<div class="toc-section"><div class="toc-section-label" style="color:var(--' + color + ')">' + label + '</div>';
    h += links;
    return h + '</div>';
  }

  /* ═══════════════════════════════════════
     CLIENT PAGES
     ═══════════════════════════════════════ */
  var clients = {
    jamie: {
      name: 'Jamie - Unstuck', hub: '/clients/jamie/', portal: 'https://jamie.dopaminedigital.io',
      deliverables: [
        {h:'lead-playbook.html', t:'Lead Playbook'},
        {h:'campaign-playbook.html', t:'Campaign Playbook'},
        {h:'https://jamie.dopaminedigital.io/lead-intelligence-report', t:'Lead Intelligence Report', e:1}
      ],
      sops: ['podcast-guest-booking','inbox-lead-management','cold-email-copywriting','instantly-campaign-setup','heyreach-linkedin-campaign'],
      tools: ['Instantly','HeyReach','Sales Navigator','Apollo']
    },
    phellos: {
      name: 'Phellos', hub: '/clients/phellos/', portal: 'https://phellos.dopaminedigital.io',
      deliverables: [
        {h:'lead-scraping-and-enrichment-sop.html', t:'Lead Scraping & Enrichment SOP'},
        {h:'progress-report.html', t:'Progress Report'},
        {h:'sales-nav-review.html', t:'Sales Nav Review'},
        {h:'value-proposition-workshop.html', t:'Value Proposition Workshop'},
        {h:'https://phellos.dopaminedigital.io/lead-intelligence-report', t:'Lead Intelligence Report', e:1}
      ],
      sops: ['podcast-guest-booking','inbox-lead-management','cold-email-copywriting','instantly-campaign-setup','heyreach-linkedin-campaign'],
      tools: ['Instantly','HeyReach','Sales Navigator','Apollo']
    },
    odf: {
      name: 'ODF', hub: '/clients/odf/',
      deliverables: [
        {h:'podcast-strategy-report.html', t:'Podcast Strategy Report'},
        {h:'prospect-list.html', t:'Prospect List'},
        {h:'sales-nav-segments.html', t:'Sales Nav Segments'},
        {h:'proposals/growth-plan.html', t:'Growth Plan'},
        {h:'proposals/partner-program.html', t:'Partner Program'}
      ],
      sops: ['podcast-guest-booking','inbox-lead-management','cold-email-copywriting','instantly-campaign-setup','heyreach-linkedin-campaign'],
      tools: ['Instantly','HeyReach','Sales Navigator','Apollo']
    },
    ocon: {
      name: 'Ocon', hub: '/clients/ocon/',
      deliverables: [
        {h:'30-day-cross-sell-playbook.html', t:'30-Day Cross-Sell Playbook'},
        {h:'90-day-execution-plan.html', t:'90-Day Execution Plan'},
        {h:'dashboard.html', t:'Dashboard'},
        {h:'cross-sell-playbook.html', t:'Cross-Sell Playbook'},
        {h:'scanstation-playbook.html', t:'ScanStation 300 Playbook'},
        {h:'contracts/contract.html', t:'Contract'},
        {h:'proposals/partnership-review.html', t:'Partnership Review'}
      ],
      sops: ['cold-email-copywriting','instantly-campaign-setup','heyreach-linkedin-campaign','inbox-lead-management','domain-health-monitoring'],
      tools: ['Instantly','HeyReach','Sales Navigator','HubSpot']
    },
    ripple: {
      name: 'Ripple', hub: '/clients/ripple/',
      deliverables: [
        {h:'offer-ladder.html', t:'Cold Traffic Offer Ladder'},
        {h:'ai-playbook.html', t:'AI Logistics Playbook'},
        {h:'lead-magnet-framework.html', t:'Lead Magnet Framework'},
        {h:'linkedin-live-plan.html', t:'LinkedIn Live Plan'},
        {h:'sales-nav-review.html', t:'Sales Nav Review'},
        {h:'proposals/growth-plan.html', t:'Growth Plan'}
      ],
      sops: ['podcast-guest-booking','inbox-lead-management','cold-email-copywriting','instantly-campaign-setup','heyreach-linkedin-campaign'],
      tools: ['Instantly','HeyReach','Sales Navigator','Apollo']
    },
    'dopamine-digital': {
      name: 'Dopamine Digital', hub: '/clients/dopamine-digital/',
      deliverables: [
        {h:'lead-playbook.html', t:'B2B SaaS Lead Playbook'}
      ],
      sops: ['daily-operations-checklist','cold-email-copywriting','cold-email-infrastructure','signal-lead-sourcing','instantly-campaign-setup'],
      tools: ['ClickUp','Slack','n8n','Instantly','HeyReach']
    },
    paul: {
      name: 'Paul - OpEx Global', hub: '/clients/paul/',
      deliverables: [
        {h:'offer-ladder.html', t:'Cold Traffic Offer Ladder'},
        {h:'business-audit.html', t:'Business Audit'},
        {h:'growth-plan.html', t:'Growth Plan'},
        {h:'value-proposition-workshop.html', t:'Value Proposition Workshop'},
        {h:'dossier-kate-swann.html', t:'Dossier: Kate Swann (EQT)'},
        {h:'dossier-patrick-fox.html', t:'Dossier: Patrick Fox (Bridgepoint)'},
        {h:'dossier-bruno-schick.html', t:'Dossier: Bruno Schick (Cinven)'}
      ],
      sops: ['discovery-call-prep','growth-plan-build','cold-email-copywriting','instantly-campaign-setup'],
      tools: ['Sales Navigator','ClickUp']
    }
  };

  var toolURLs = {
    'Instantly':'https://app.instantly.ai','HeyReach':'https://app.heyreach.io',
    'Sales Navigator':'https://www.linkedin.com/sales','Apollo':'https://app.apollo.io',
    'MillionVerifier':'https://app.millionverifier.com',
    'ClickUp':'https://app.clickup.com','Slack':'https://app.slack.com',
    'n8n':'https://n8n.dopaminedigital.io','Riverside':'https://riverside.fm',
    'Crunchbase':'https://www.crunchbase.com','Prospeo':'https://app.prospeo.io'
  };

  /* SOP slug → short display name */
  var sopNames = {
    'ai-agent-fleet-management':'AI Agent Fleet Mgmt',
    'automation-monitoring':'Automation Monitoring',
    'clickup-task-management':'ClickUp Task Mgmt',
    'client-onboarding':'Client Onboarding',
    'client-reporting-review':'Client Reporting Review',
    'client-reporting':'Client Reporting',
    'ai-outbound-os':'AI Outbound OS Install',
    'closer-playbook':'Closer Playbook',
    'cold-email-copywriting':'Cold Email Copywriting',
    'content-repurposing':'Content Repurposing',
    'contract-proposal':'Contract & Proposal',
    'daily-operations-checklist':'Daily Ops Checklist',
    'deliverability-testing':'Deliverability Testing',
    'discovery-call-prep':'Discovery Call Prep',
    'domain-health-monitoring':'Domain Health',
    'cold-email-infrastructure':'Cold Email Infrastructure',
    'domain-infrastructure-setup':'Domain Infrastructure',
    'financial-tracking-invoicing':'Financial & Invoicing',
    'follow-up-sequence':'Follow-Up Sequences',
    'growth-plan-build':'Growth Plan Build',
    'growth-plan-presentation':'Growth Plan Presentation',
    'post-close-handoff':'Post-Close Handoff',
    'revenue-sprint-rhythm':'Revenue Sprint Rhythm',
    'heyreach-linkedin-campaign':'HeyReach LinkedIn',
    'hot-lead-escalation':'Hot Lead Escalation',
    'inbox-lead-management':'Inbox & Lead Mgmt',
    'linkedin-outreach-reply':'LinkedIn Reply SOP',
    'instantly-campaign-setup':'Instantly Campaign Setup',
    'active-linkedin-founder-method':'Active LinkedIn Founder Method',
    'lead-sourcing-enrichment':'Lead Sourcing & Enrichment',
    'signal-lead-sourcing':'Signal-Based Lead Sourcing',
    'icp-research-guide':'ICP Research SOP',
    '100m-offer-cold-traffic':'$100M Offer for Cold Traffic',

    'n8n-workflow-development':'n8n Workflow Dev',
    'new-hire-onboarding':'New Hire Onboarding',
    'new-va-onboarding':'New VA Onboarding',
    'pipeline-management':'Pipeline Management',
    'podcast-guest-booking':'Podcast Guest Booking',
    'podcast-recording-production':'Podcast Recording',
    'sales-navigator-research':'Sales Nav Research',
    'sales-navigator-search':'Sales Nav Search',
    'slack-communication-standards':'Slack Standards',
    'tool-access-management':'Tool Access Mgmt',
    'video-editing-workflow':'Video Editing',
    'weekly-delivery-report':'Weekly Delivery Report',
    'weekly-pipeline-review':'Weekly Pipeline Review',
    'wiki-maintenance-publishing':'Wiki Publishing',
    'github-client-hub':'GitHub Client Hub',
    'google-sheets-airtable-migration':'Sheets to Airtable Migration',
    'campaign-monitoring':'Campaign Monitoring',
    'lead-verification-hygiene':'Lead Verification',
    'client-health-retention':'Client Health & Retention',
    'follow-up-sequence':'Follow-Up Sequences'
  };

  /* SOP categories */
  var sopCategories = [
    {name:'Lead Generation', color:'cyan', slugs:[
      'active-linkedin-founder-method','lead-sourcing-enrichment','lead-verification-hygiene','sales-navigator-search','icp-research-guide','signal-lead-sourcing','cold-email-copywriting'
    ]},
    {name:'Outreach', color:'green', slugs:[
      'cold-email-infrastructure','domain-health-monitoring','campaign-monitoring','instantly-campaign-setup','heyreach-linkedin-campaign','inbox-lead-management','hot-lead-escalation','linkedin-outreach-reply','deliverability-testing'
    ]},
    {name:'Podcast', color:'purple', slugs:[
      'podcast-guest-booking','podcast-recording-production','content-repurposing','video-editing-workflow'
    ]},
    {name:'Content', color:'pink', slugs:[
      'youtube-script-miro-board'
    ]},
    {name:'Sales', color:'blue', slugs:[
      'revenue-sprint-rhythm','discovery-call-prep','growth-plan-build','post-close-handoff','contract-proposal','pipeline-management','100m-offer-cold-traffic','dd-outbound-playbook'
    ]},
    {name:'Client Delivery', color:'amber', slugs:[
      'client-onboarding','client-health-retention','client-reporting-review','weekly-delivery-report','weekly-pipeline-review'
    ]},
    {name:'Operations', color:'red', slugs:[
      'daily-operations-checklist','clickup-task-management','slack-communication-standards',
      'new-va-onboarding','financial-tracking-invoicing'
    ]},
    {name:'Technology', color:'dim', slugs:[
      'ai-agent-fleet-management','automation-monitoring','n8n-workflow-development','wiki-maintenance-publishing','github-client-hub'
    ]}
  ];

  var sopNoSuffix = {'daily-operations-checklist':1,'instantly-campaign-setup':1};
  function sopLink(slug) {
    var suffix = sopNoSuffix[slug] ? '' : '-sop';
    return P + slug + suffix + '.html';
  }

  /* ── Route: Client sub-pages ── */
  var clientMatch = path.match(/^\/clients\/([^/]+)\//);
  if (clientMatch && clients[clientMatch[1]]) {
    var c = clients[clientMatch[1]];
    var slug = clientMatch[1];
    var h = '';

    // Deliverables
    var dLinks = lnk(c.hub, c.name + ' Hub');
    c.deliverables.slice(0, 5).forEach(function(d){
      dLinks += d.e ? lnk(d.h, d.t, true) : lnk(c.hub + d.h, d.t);
    });
    h += sec('Deliverables', 'green', dLinks);

    // Related SOPs
    var sLinks = '';
    c.sops.slice(0, 6).forEach(function(s){ sLinks += lnk(sopLink(s), sopNames[s] || s); });
    h += sec('Related SOPs', 'purple', sLinks);

    // Tools
    var tLinks = '';
    c.tools.slice(0, 6).forEach(function(t){ tLinks += lnk(toolURLs[t], t, true); });
    h += sec('Tools', 'cyan', tLinks);

    // Navigation
    var nLinks = lnk('/', 'Wiki Home') + lnk('/sops/', 'SOP Library');
    if (c.portal) nLinks += lnk(c.portal, 'Client Portal', true);
    h += sec('Navigation', 'blue', nLinks);

    navHTML = h;

  /* ── Route: n8n index + flow pages — keep per-page TOC in HTML ── */
  } else if (path.indexOf('/n8n/') === 0) {
    if (typeof window.initTocScrollSpy === 'function') window.initTocScrollSpy();
    return;

  /* ── Route: Internal pages — keep per-page TOC in HTML ── */
  } else if (path.indexOf('/internal/') === 0) {
    if (typeof window.initTocScrollSpy === 'function') window.initTocScrollSpy();
    return;

  /* ── Route: Skill detail pages — keep per-skill TOC in HTML ── */
  } else if (path.indexOf('/skills/') === 0 && path !== '/skills/' && path !== '/skills/index.html') {
    if (typeof window.initTocScrollSpy === 'function') window.initTocScrollSpy();
    return;

  /* ── Route: SOP pages — keep per-page TOC for phase/step navigation + scroll-spy ── */
  } else if (path.indexOf('/sops/') === 0 && path !== '/sops/' && path !== '/sops/index.html') {
    // Don't replace — the page already has its own phase/step TOC in the HTML.
    // wiki-ai.js wraps it into the Navigate tab, wiki.js provides scroll-spy.
    // Just re-init scroll-spy in case wiki-ai.js cloned the DOM.
    if (typeof window.initTocScrollSpy === 'function') window.initTocScrollSpy();
    return;

  /* ── Route: Team tracker pages ── */
  } else if (path.indexOf('/team/trackers/') === 0 && path !== '/team/trackers/') {
    // Team tracker pages use data-keep-nav, so this won't fire for them.
    // This handles the /team/trackers/ index if one exists.
    return;

  /* ── Route: Demo pages ── */
  } else if (path.indexOf('/demo/') === 0) {
    var demoLinks = lnk('/demo/client-apex.html', 'Client Portal Demo')
      + lnk('/demo/sop-onboarding.html', 'SOP Demo')
      + lnk('/demo/team-ops-playbook.html', 'Team Ops Playbook')
      + lnk('/demo/tool-pipeline.html', 'Tool Pipeline');
    var h = sec('Demos', 'purple', demoLinks);

    // SOPs (top picks)
    h += sec('SOPs', 'cyan',
      lnk('/sops/', 'SOP Library')
      + lnk(P + 'daily-operations-checklist.html', 'Daily Ops Checklist')
      + lnk(P + 'inbox-lead-management-sop.html', 'Inbox & Lead Mgmt')
      + lnk(P + 'podcast-guest-booking-sop.html', 'Podcast Booking')
    );

    h += sec('Navigation', 'blue', lnk('/', 'Wiki Home'));
    navHTML = h;

  /* ── Route: SOP Library index ── */
  } else if (path === '/sops/' || path === '/sops/index.html') {
    var h = '';
    sopCategories.forEach(function(cat){
      var catLinks = '';
      cat.slugs.forEach(function(s){ catLinks += lnk(sopLink(s), sopNames[s] || s); });
      h += sec(cat.name, cat.color, catLinks);
    });

    h += sec('Navigation', 'blue', lnk('/', 'Wiki Home'));

    navHTML = h;

  /* ── Route: Skool pages ── */
  } else if (path.indexOf('/skool/') === 0) {
    var h = '';
    h += sec('AI Systems Society', 'purple',
      lnk('/skool/', 'Skool Hub')
      + lnk('/skool/playbook.html', 'Skool Playbook')
      + lnk('/skool/curriculum.html', '100-Day Curriculum')
      + lnk('/internal/ai-systems-society-curriculum.html', 'Curriculum -- Full Reference')
      + lnk('/skool/ai-systems-society.html', 'AI Systems Society')
      + lnk('/skool/brand-design.html', 'Brand & Design Brief')
      + lnk('/skool/launch-playbook.html', 'Launch Sale Playbook')
      + lnk('/skool/win-back-campaign.html', 'Win-Back Campaign')
    );
    h += sec('Ship It OS', 'cyan',
      lnk('https://github.com/JordanRafealov/ai-systems-society', 'GitHub Repo', true)
      + lnk('/skool/ship-it-os-skills.html', 'Skill Files Reference')
      + lnk('/skool/niche-packs.html', 'Niche Packs')
    );
    h += sec('Curriculum Phases', 'green',
      lnk('/skool/curriculum.html#phase-0', 'Phase 0: Launch Pad (1-7)')
      + lnk('/skool/curriculum.html#phase-1', 'Phase 1: Who & What (8-21)')
      + lnk('/skool/curriculum.html#phase-2', 'Phase 2: Infrastructure (22-35)')
      + lnk('/skool/curriculum.html#phase-3', 'Phase 3: Lead Gen (36-63)')
      + lnk('/skool/curriculum.html#phase-4', 'Phase 4: Sales & Close (64-77)')
      + lnk('/skool/curriculum.html#phase-5', 'Phase 5: Delivery (78-91)')
      + lnk('/skool/curriculum.html#phase-6', 'Phase 6: Scale (92-100)')
    );
    h += sec('Navigation', 'blue', lnk('/', 'Wiki Home') + lnk('/sops/', 'SOP Library'));
    navHTML = h;

  /* ── Route: Pipeline pages (podcast research, etc.) ── */
  } else if (path.indexOf('/pipeline/') === 0 && path !== '/pipeline/' && path !== '/pipeline/index.html') {
    // Pipeline sub-pages (e.g., podcast research briefs) use data-keep-nav
    // so their own sidebar is preserved. Just init scroll-spy.
    if (typeof window.initTocScrollSpy === 'function') window.initTocScrollSpy();
    return;

  } else if (path === '/pipeline/' || path === '/pipeline/index.html') {
    var h = '';
    h += sec('Podcast Research', 'green',
      lnk('/pipeline/podcast-guests/arran-kirkup.html', 'Arran Kirkup - Indiespring')
      + lnk('/pipeline/podcast-guests/james-smith.html', 'James Smith - Lean Dimensions')
      + lnk('/pipeline/podcast-guests/douglas-mccormick.html', 'Douglas McCormick - Pegasus Group')
      + lnk('/pipeline/podcast-guests/ian-kerr.html', 'Ian Kerr - Insight Delivered')
      + lnk('/pipeline/podcast-guests/tom-emery.html', 'Tom Emery - HEX Development')
      + lnk('/pipeline/podcast-guests/bhas-kalangi.html', 'Bhas Kalangi - Grafterr')
      + lnk('/pipeline/podcast-guests/rob-salter.html', 'Rob Salter - Saltant / Action Gap')
      + lnk('/pipeline/podcast-guests/rob-nicholls.html', 'Rob Nicholls - Fractional CFO')
      + lnk('/pipeline/podcast-guests/simon-cuthbert.html', 'Simon Cuthbert - Arthurian Labs')
      + lnk('/pipeline/podcast-guests/lee-lam.html', 'Lee Lam - Your Startup Partner')
    );
    h += sec('Navigation', 'blue', lnk('/', 'Wiki Home') + lnk('/sops/', 'SOP Library'));
    navHTML = h;

  /* ── Route: AI Prompt Library ── */
  } else if (path.indexOf('/prompts/') === 0) {
    var h = '';
    h += sec('AI Prompts', 'purple',
      lnk('/prompts/', 'Prompt Library')
      + lnk('/prompts/revenue-priority-matrix.html', 'Revenue Priority Matrix')
      + lnk('/prompts/growth-funnel-architect.html', 'Growth Funnel Architect')
      + lnk('/prompts/market-signal-detector.html', 'Market Signal Detector')
    );
    h += sec('Categories', 'cyan',
      lnk('/prompts/', 'Marketing Strategy')
      + lnk('/prompts/', 'Market Research')
    );
    h += sec('Navigation', 'blue',
      lnk('/', 'Wiki Home')
      + lnk('/sops/', 'SOP Library')
      + lnk('/skills/', 'Skills Library')
    );
    if (typeof window.initTocScrollSpy === 'function') window.initTocScrollSpy();
    navHTML = h;

  /* ── Route: Default (homepage, 404, etc.) ── */
  } else {
    var cLinks = '';
    Object.keys(clients).forEach(function(k){
      cLinks += '<a href="' + clients[k].hub + '" class="toc-link dash-client"><span class="sb-dot sb-green"></span>' + clients[k].name + '</a>';
    });
    var h = '';
    h += '<div class="toc-section" id="sidebarFavs" style="display:none"><div class="toc-section-label sb-label-amber">Favorites</div><div id="sidebarFavsList"></div></div>';
    /* SOPs section — placeholder, filled by syncSidebarSOPs after initRecentSOPs */
    h += '<div id="sidebar-sops-section"></div>';
    /* Auto-sync ALL sections from page content -- dynamic, no hardcoded list */
    var sectionColors = {clients:'green', sops:'cyan', skills:'cyan', pipeline:'pink', offers:'purple', team:'purple', dashboards:'amber', tools:'cyan', skool:'purple', internal:'purple', n8n:'blue', prompts:'purple'};
    var allSectionEls = document.querySelectorAll('[data-section]');
    [].slice.call(allSectionEls).forEach(function(secEl){
      var secKey = secEl.getAttribute('data-section');
      if (secKey === 'sops') return; /* handled separately above */
      var heading = secEl.querySelector('h2');
      if (!heading) return;
      var cards = secEl.querySelectorAll('.card');
      if (!cards.length) return;
      var links = '';
      [].slice.call(cards).forEach(function(card){
        if (card.style.display === 'none') return;
        var href = card.getAttribute('href');
        var h3 = card.querySelector('h3');
        if (href && h3) links += lnk(href, h3.textContent.replace(/ SOP$/,''));
      });
      if (links) h += sec(heading.textContent, sectionColors[secKey] || 'blue', links);
    });
    h += sec('Operations', 'blue',
      lnk('https://app.clickup.com', 'ClickUp', true)
      + lnk('https://app.slack.com', 'Slack', true)
      + lnk('https://n8n.dopaminedigital.io', 'n8n', true)
      + lnk('https://drive.google.com', 'Google Drive', true)
      + lnk('https://airtable.com', 'Airtable', true)
      + lnk('https://www.notion.so', 'Notion', true)
    );
    h += sec('Lead Gen', 'cyan',
      lnk('https://www.linkedin.com/sales', 'Sales Navigator', true)
      + lnk('https://app.apollo.io', 'Apollo', true)
      + lnk('https://www.crunchbase.com', 'Crunchbase', true)
      + lnk('https://app.prospeo.io', 'Prospeo', true)
      + lnk('https://exa.ai', 'Exa', true)
      + lnk('https://www.firecrawl.dev', 'FireCrawl', true)
      + lnk('https://app.millionverifier.com', 'MillionVerifier', true)
    );
    h += sec('Outreach', 'amber',
      lnk('https://app.instantly.ai', 'Instantly', true)
      + lnk('https://app.heyreach.io', 'HeyReach', true)
      + lnk('https://app.expandi.io', 'Expandi', true)
    );
    h += sec('Content', 'red',
      lnk('https://riverside.fm', 'Riverside', true)
      + lnk('https://claude.ai', 'Claude AI', true)
    );
    navHTML = h;
  }

  /* ── Inject into sidebar ── */
  var tocTab = document.querySelector('.ai-tab-toc');
  var tocBody = document.querySelector('.toc-body');
  var target = tocTab || tocBody;
  if (!target) return;

  target.innerHTML = navHTML;

  /* ── Highlight active link ── */
  target.querySelectorAll('.toc-link').forEach(function(a) {
    var href = a.getAttribute('href');
    if (!href || href.startsWith('http')) return;
    if (path === href || path === href + 'index.html' || (href.endsWith('/') && path.startsWith(href) && href !== '/')) {
      a.classList.add('active');
    }
  });

  if (typeof initFavorites === 'function') initFavorites();
})();

/* ── Sync sidebar SOPs from visible cards (called after initRecentSOPs) ── */
function syncSidebarSOPs(){
  var container = document.getElementById('sidebar-sops-section');
  if (!container) return;
  var grid = document.getElementById('grid-sops');
  if (!grid) return;
  var links = '';
  [].slice.call(grid.querySelectorAll('.card')).forEach(function(card){
    if (card.style.display === 'none') return;
    var href = card.getAttribute('href');
    var h3 = card.querySelector('h3');
    if (href && h3) links += '<a href="' + href + '" class="toc-link">' + h3.textContent.replace(/ SOP$/,'') + '</a>';
  });
  container.innerHTML = '<div class="toc-section" style="margin:0 12px;border-bottom:1px solid var(--border)"><div class="toc-section-label" style="color:var(--purple)">SOPs</div>' + links + '</div>';
}
