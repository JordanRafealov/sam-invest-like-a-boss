/* ============================================================
   WIKI AI ASSISTANT — Chat Panel + Text Selection
   v3.0 — Mar 2026
   Works on: sidebar pages (tab in TOC) + all other pages (floating button)
   Features: markdown rendering, resizable sidebar
   ============================================================ */

const WIKI_AI_ENDPOINT = 'https://wiki-ai.jordan-619.workers.dev';

// ===== STATE =====
let wikiAiMessages = [];
let wikiAiStreaming = false;
let wikiAiPageContext = '';
let wikiAiClientId = '';

// ===== SHARED CHAT HTML =====
const AI_CHAT_HTML = `
  <div class="ai-chat-messages" id="aiMessages">
    <div class="ai-welcome">
      <div class="ai-welcome-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
          <path d="M19 13l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"/>
          <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z"/>
        </svg>
      </div>
      <div class="ai-welcome-title">AI Assistant</div>
      <div class="ai-welcome-text">Trained on all your business data — clients, SOPs, campaigns, and deliverables. Ask anything or highlight text and click "Ask AI."</div>
    </div>
  </div>
  <div class="ai-chat-input-wrap">
    <textarea class="ai-chat-input" id="aiInput" placeholder="Ask AI about this page..." rows="1"></textarea>
    <button class="ai-chat-send" id="aiSend" aria-label="Send">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    </button>
  </div>
`;

// ===== SIMPLE MARKDOWN RENDERER =====
function renderMarkdown(raw) {
  if (!raw) return '';
  // Escape HTML first
  let text = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks (```...```)
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic (single * not preceded/followed by space for safety)
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // Split into lines for block-level processing
  const lines = text.split('\n');
  let html = '';
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.+)/);
    const numberedMatch = line.match(/^(\s*)\d+\.\s+(.+)/);

    if (bulletMatch) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += '<li>' + bulletMatch[2] + '</li>';
    } else if (numberedMatch) {
      if (!inList) { html += '<ol>'; inList = true; }
      html += '<li>' + numberedMatch[2] + '</li>';
    } else {
      if (inList) { html += inList === true ? '</ul>' : '</ol>'; inList = false; }
      // Headings (### etc) — render as bold
      const headingMatch = line.match(/^#{1,4}\s+(.+)/);
      if (headingMatch) {
        html += '<strong>' + headingMatch[1] + '</strong><br>';
      } else if (line.trim() === '') {
        html += '<br>';
      } else {
        html += line + '<br>';
      }
    }
  }
  if (inList) html += '</ul>';

  // Clean up trailing <br>
  html = html.replace(/(<br>)+$/, '');

  return html;
}

// ===== INIT =====
function initWikiAi() {
  // Detect clientId from meta tag or hostname
  const metaClient = document.querySelector('meta[name="client-id"]');
  if (metaClient) {
    wikiAiClientId = metaClient.content;
  } else {
    // Derive from hostname: jamie.dopaminedigital.io -> jamie
    const host = window.location.hostname;
    const match = host.match(/^([a-z]+)\.dopaminedigital\.io$/);
    if (match && match[1] !== 'docs') {
      wikiAiClientId = match[1];
    } else if (host === 'docs.dopaminedigital.io' || host === 'localhost') {
      wikiAiClientId = 'dd-internal';
    }
  }

  // Extract FULL page text for context (no truncation — worker handles limits)
  const main = document.querySelector('main') || document.querySelector('.content') || document.body;
  if (main) {
    wikiAiPageContext = main.innerText;
  }

  const sidebar = document.querySelector('.toc-sidebar');
  if (sidebar) {
    initSidebarMode(sidebar);
    initSidebarResize(sidebar);
  } else {
    initFloatingMode();
  }

  // Text selection tooltip (works on all pages)
  initSelectionTooltip();
}

// ===== SIDEBAR MODE (pages with TOC) =====
function initSidebarMode(sidebar) {
  const tocBody = sidebar.querySelector('.toc-body');
  if (!tocBody) return;

  // Remove "On This Page" title
  const tocTitle = tocBody.querySelector('.toc-title');
  if (tocTitle) tocTitle.remove();

  // Check which tab should be active on load
  const startOnAi = localStorage.getItem('wiki-sidebar-tab') === 'ai';

  // Wrap existing TOC body content
  const tocContent = document.createElement('div');
  tocContent.className = 'ai-tab-content ai-tab-toc' + (startOnAi ? '' : ' active');
  tocContent.innerHTML = tocBody.innerHTML;
  tocBody.innerHTML = '';

  // Create tab bar
  const tabBar = document.createElement('div');
  tabBar.className = 'ai-tabs';
  tabBar.innerHTML = `
    <button class="ai-tab${startOnAi ? '' : ' active'}" data-tab="toc">Navigate</button>
    <button class="ai-tab${startOnAi ? ' active' : ''}" data-tab="ai"><span class="ai-tab-dot"></span>Ask AI</button>
  `;

  // Create AI panel
  const aiPanel = document.createElement('div');
  aiPanel.className = 'ai-tab-content ai-tab-ai' + (startOnAi ? ' active' : '');
  aiPanel.innerHTML = AI_CHAT_HTML;

  // Assemble
  tocBody.appendChild(tabBar);
  tocBody.appendChild(tocContent);
  tocBody.appendChild(aiPanel);

  // Tab switching (persisted via localStorage)
  tabBar.querySelectorAll('.ai-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabBar.querySelectorAll('.ai-tab').forEach(t => t.classList.toggle('active', t === tab));
      tocBody.querySelectorAll('.ai-tab-content').forEach(c => {
        c.classList.toggle('active', c.classList.contains('ai-tab-' + target));
      });
      localStorage.setItem('wiki-sidebar-tab', target);
      if (target === 'ai') {
        document.getElementById('aiInput').focus();
      }
    });
  });

  bindChatEvents();

  // Remove pre-render hiding class now that tabs are built
  document.documentElement.classList.remove('ai-tab-pending');

  // Re-init scroll-spy — innerHTML cloned the TOC, destroying original DOM refs
  if (typeof window.initTocScrollSpy === 'function') window.initTocScrollSpy();
}

// ===== SIDEBAR RESIZE =====
function initSidebarResize(sidebar) {
  const handle = document.createElement('div');
  handle.className = 'toc-resize-handle';
  sidebar.appendChild(handle);

  let isResizing = false;
  let startX = 0;
  let startWidth = 0;

  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    isResizing = true;
    startX = e.clientX;
    startWidth = sidebar.offsetWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    sidebar.style.transition = 'none';
  });

  document.addEventListener('mousemove', e => {
    if (!isResizing) return;
    const newWidth = Math.min(Math.max(startWidth + (e.clientX - startX), 200), 560);
    sidebar.style.width = newWidth + 'px';
    document.body.style.paddingLeft = newWidth + 'px';
    const topbar = document.querySelector('.topbar');
    if (topbar) topbar.style.left = newWidth + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    sidebar.style.transition = '';
  });
}

// ===== FLOATING MODE (pages without TOC) =====
function initFloatingMode() {
  // Floating button
  const fab = document.createElement('button');
  fab.className = 'ai-fab';
  fab.setAttribute('aria-label', 'Ask AI');
  fab.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
      <path d="M19 13l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"/>
    </svg>
  `;
  document.body.appendChild(fab);

  // Slide-out panel
  const panel = document.createElement('div');
  panel.className = 'ai-float-panel';
  panel.innerHTML = `
    <div class="ai-float-header">
      <span class="ai-float-title">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
          <path d="M19 13l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"/>
        </svg>
        AI Assistant
      </span>
      <button class="ai-float-close" aria-label="Close">&times;</button>
    </div>
    ${AI_CHAT_HTML}
  `;
  document.body.appendChild(panel);

  // Toggle panel
  fab.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('open');
    fab.classList.toggle('hidden', isOpen);
    if (isOpen) document.getElementById('aiInput').focus();
  });

  panel.querySelector('.ai-float-close').addEventListener('click', () => {
    panel.classList.remove('open');
    fab.classList.remove('hidden');
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      panel.classList.remove('open');
      fab.classList.remove('hidden');
    }
  });

  bindChatEvents();
}

// ===== BIND CHAT EVENTS =====
function bindChatEvents() {
  const input = document.getElementById('aiInput');
  const sendBtn = document.getElementById('aiSend');

  sendBtn.addEventListener('click', () => sendMessage());
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });
}

// ===== SEND MESSAGE =====
async function sendMessage(prefill) {
  const input = document.getElementById('aiInput');
  const text = prefill || input.value.trim();
  if (!text || wikiAiStreaming) return;

  input.value = '';
  input.style.height = 'auto';

  wikiAiMessages.push({ role: 'user', content: text });
  appendChatBubble('user', text);

  wikiAiStreaming = true;
  const aiMsgEl = appendChatBubble('assistant', '');
  const textEl = aiMsgEl.querySelector('.ai-msg-text');

  try {
    const res = await fetch(WIKI_AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: wikiAiMessages,
        pageContext: wikiAiPageContext,
        clientId: wikiAiClientId,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      textEl.textContent = 'Error: ' + (err.error || 'Something went wrong');
      wikiAiStreaming = false;
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            fullText += parsed.delta.text;
            textEl.innerHTML = renderMarkdown(fullText);
            scrollChat();
          }
        } catch (e) {}
      }
    }

    wikiAiMessages.push({ role: 'assistant', content: fullText });
  } catch (err) {
    textEl.textContent = 'Connection error. Check your network and try again.';
  }

  wikiAiStreaming = false;
}

// ===== CHAT UI HELPERS =====
function appendChatBubble(role, text) {
  const container = document.getElementById('aiMessages');
  const welcome = container.querySelector('.ai-welcome');
  if (welcome) {
    welcome.remove();
  }

  const msg = document.createElement('div');
  msg.className = 'ai-msg ai-msg-' + role;

  const rendered = role === 'user' ? escapeHtml(text) : renderMarkdown(text);
  msg.innerHTML = `
    <div class="ai-msg-avatar">${role === 'user' ? 'You' : 'AI'}</div>
    <div class="ai-msg-text">${rendered}</div>
  `;
  container.appendChild(msg);
  scrollChat();
  return msg;
}

function scrollChat() {
  const container = document.getElementById('aiMessages');
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ===== TEXT SELECTION TOOLTIP =====
function initSelectionTooltip() {
  const tooltip = document.createElement('button');
  tooltip.className = 'ai-select-tooltip';
  tooltip.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
    </svg>
    Ask AI
  `;
  tooltip.style.display = 'none';
  document.body.appendChild(tooltip);

  let hideTimeout;

  document.addEventListener('mouseup', () => {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      const sel = window.getSelection();
      const text = sel.toString().trim();

      if (text.length > 5 && text.length < 2000) {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        tooltip.style.display = 'flex';
        tooltip.style.top = (rect.top + window.scrollY - 38) + 'px';
        tooltip.style.left = (rect.left + rect.width / 2) + 'px';
      } else {
        tooltip.style.display = 'none';
      }
    }, 200);
  });

  tooltip.addEventListener('mousedown', e => {
    e.preventDefault();
    const sel = window.getSelection();
    const text = sel.toString().trim();
    if (!text) return;

    tooltip.style.display = 'none';

    // Open floating panel if in floating mode
    const floatPanel = document.querySelector('.ai-float-panel');
    if (floatPanel && !floatPanel.classList.contains('open')) {
      floatPanel.classList.add('open');
      const fab = document.querySelector('.ai-fab');
      if (fab) fab.classList.add('hidden');
    }

    // Switch to AI tab if in sidebar mode
    const aiTab = document.querySelector('.ai-tab[data-tab="ai"]');
    if (aiTab) aiTab.click();

    sendMessage('Explain this: "' + text.slice(0, 500) + '"');
  });

  document.addEventListener('mousedown', e => {
    if (e.target !== tooltip && !tooltip.contains(e.target)) {
      tooltip.style.display = 'none';
    }
  });
}

// ===== BOOT =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWikiAi);
} else {
  initWikiAi();
}
