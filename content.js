(() => {
  'use strict';
  const USER = '[data-message-author-role="user"]';
  const ASSISTANT = '[data-message-author-role="assistant"]';
  const KEY = 'quoteBackV1';
  let records = {}, candidate = null, returnPoint = null, ready = false;
  let route = location.pathname;
  const seen = new WeakSet();
  const normalize = s => s.replace(/\s+/g, ' ').trim();
  const textOf = el => {
    const copy = el.cloneNode(true);
    copy.querySelectorAll('.qb-control').forEach(n => n.remove());
    return copy.textContent || '';
  };
  const messageId = el => el.getAttribute('data-message-id') ||
    el.closest('[data-message-id]')?.getAttribute('data-message-id') || '';
  const messageKey = el => messageId(el) || ('text:' + normalize(textOf(el)));
  const list = () => [...document.querySelectorAll(ASSISTANT)];
  const panel = document.createElement('div');
  panel.className = 'qb-control qb-panel';
  panel.hidden = true;
  const back = document.createElement('button');
  back.type = 'button'; back.textContent = '返回回答 ↓';
  const notice = document.createElement('span');
  const close = document.createElement('button');
  close.type = 'button'; close.textContent = '×'; close.setAttribute('aria-label', '关闭回跳提示');
  panel.append(back, notice, close);
  document.body.append(panel);
  close.onclick = () => { panel.hidden = true; };
  back.onclick = () => {
    if (returnPoint?.isConnected) returnPoint.scrollIntoView({block: 'center', behavior: 'smooth'});
    else document.querySelector('main')?.lastElementChild?.scrollIntoView({block: 'end', behavior: 'smooth'});
    panel.hidden = true;
  };
  function status(text) { notice.textContent = text; panel.hidden = false; }
  async function save() {
    try { await chrome.storage.local.set({[KEY]: records}); }
    catch { status('位置暂时无法保存；当前页面仍可回跳。'); }
  }
  function capture() {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const start = range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement;
    const end = range.endContainer.nodeType === 1 ? range.endContainer : range.endContainer.parentElement;
    const message = start?.closest(ASSISTANT);
    if (!message || end?.closest(ASSISTANT) !== message) return;
    const quote = range.toString();
    if (!normalize(quote)) return;
    const prefix = document.createRange();
    prefix.selectNodeContents(message); prefix.setEnd(range.startContainer, range.startOffset);
    const offset = prefix.toString().length;
    candidate = {
      quote, offset, id: messageId(message), index: list().indexOf(message),
      before: textOf(message).slice(Math.max(0, offset - 80), offset),
      after: textOf(message).slice(offset + quote.length, offset + quote.length + 80),
      sourceText: normalize(textOf(message)), path: location.pathname,
      created: Date.now(), intentional: false
    };
  }
  document.addEventListener('mouseup', capture);
  document.addEventListener('keyup', event => { if (event.key === 'Shift') capture(); });
  document.addEventListener('click', event => {
    const button = event.target.closest?.('button,[role="button"]');
    if (!button || button.closest('.qb-control') || !candidate) return;
    const label = [button.textContent, button.getAttribute('aria-label'), button.getAttribute('data-testid'), button.getAttribute('title')].filter(Boolean).join(' ');
    if (/quote|引用|reply to|回复选中|询问 ChatGPT|ask chatgpt/i.test(label)) candidate.intentional = true;
  }, true);
  function locate(anchor) {
    const messages = list();
    let source = anchor.id && messages.find(el => messageId(el) === anchor.id);
    if (!source) source = messages.find(el => normalize(textOf(el)) === anchor.sourceText);
    if (!source) {
      const atIndex = messages[anchor.index];
      if (atIndex && textOf(atIndex).includes(anchor.quote)) source = atIndex;
    }
    if (!source) return null;
    const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
    const nodes = []; let node, text = '';
    while ((node = walker.nextNode())) { nodes.push({node, start: text.length}); text += node.data; }
    let offset = -1;
    if (text.slice(anchor.offset, anchor.offset + anchor.quote.length) === anchor.quote) offset = anchor.offset;
    else {
      const hits = []; let at = text.indexOf(anchor.quote);
      while (at >= 0) { hits.push(at); at = text.indexOf(anchor.quote, at + 1); }
      offset = hits.find(at => (!anchor.before || text.slice(Math.max(0, at - anchor.before.length), at) === anchor.before) && (!anchor.after || text.slice(at + anchor.quote.length, at + anchor.quote.length + anchor.after.length) === anchor.after)) ?? (hits.length === 1 ? hits[0] : -1);
    }
    if (offset < 0) return {source};
    const first = nodes.find(n => n.start + n.node.length > offset);
    const last = nodes.find(n => n.start + n.node.length >= offset + anchor.quote.length);
    if (!first || !last) return {source};
    const range = document.createRange();
    range.setStart(first.node, offset - first.start);
    range.setEnd(last.node, offset + anchor.quote.length - last.start);
    return {source, range};
  }
  function jump(anchor, from) {
    returnPoint = from;
    const found = locate(anchor);
    if (!found) { status('原文尚未加载或已变更，请先向上加载较早的消息，再点击回跳。'); return; }
    const target = found.range?.startContainer.parentElement || found.source;
    target.scrollIntoView({block: 'center', behavior: 'smooth'});
    if (found.range && globalThis.Highlight && CSS.highlights) {
      CSS.highlights.set('qb-original', new Highlight(found.range));
      setTimeout(() => CSS.highlights.delete('qb-original'), 3500);
    } else {
      target.classList.add('qb-flash');
      setTimeout(() => target.classList.remove('qb-flash'), 3500);
    }
    status(found.range ? '已回到引用原文' : '已回到原消息；文字可能已变更');
  }
  function attach(el, anchor) {
    if (el.querySelector('.qb-link')) return;
    const button = document.createElement('button');
    button.className = 'qb-control qb-link'; button.type = 'button';
    button.textContent = '↩ 返回引用原文';
    button.title = anchor.quote.slice(0, 180);
    button.onclick = () => {
      const turn = el.closest('[data-testid^="conversation-turn-"]') || el.closest('article');
      const following = turn?.nextElementSibling;
      jump(anchor, following || el);
    };
    el.append(button);
  }
  function scan() {
    if (!ready) return;
    if (route !== location.pathname) { route = location.pathname; candidate = null; returnPoint = null; panel.hidden = true; }
    for (const el of document.querySelectorAll(USER)) {
      const key = route + '|' + messageKey(el);
      if (records[key]) { attach(el, records[key]); seen.add(el); continue; }
      if (seen.has(el)) continue;
      if (!candidate || candidate.path !== route || Date.now() - candidate.created > 30 * 60 * 1000) continue;
      const userText = normalize(textOf(el));
      if (!userText) continue;
      const contains = userText.includes(normalize(candidate.quote));
      if (!contains && !candidate.intentional) continue;
      seen.add(el);
      const anchor = {...candidate};
      delete anchor.intentional;
      records[key] = anchor; candidate = null;
      // Keep local storage bounded to the most recent 500 references.
      const keys = Object.keys(records).sort((a,b) => records[a].created - records[b].created);
      for (const old of keys.slice(0, Math.max(0, keys.length - 500))) delete records[old];
      attach(el, anchor); void save();
    }
  }
  let timer;
  const observer = new MutationObserver(() => {
    clearTimeout(timer); timer = setTimeout(scan, 150);
  });
  (async () => {
    try { records = (await chrome.storage.local.get(KEY))[KEY] || {}; } catch { records = {}; }
    document.querySelectorAll(USER).forEach(el => seen.add(el));
    ready = true; scan();
    observer.observe(document.body, {childList: true, subtree: true});
  })();
})();
