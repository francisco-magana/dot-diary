// A deliberately small markdown renderer for journal entries.
// Supports: # headings (1–3), **bold**, *italic*, `code`, [links](https://…),
// - lists, 1. numbered lists, - [ ] checklists and > quotes.

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

export function renderMarkdown(source) {
  const out = [];
  let paragraph = [];
  let list = null; // { tag: 'ul' | 'ol', items: [] }

  const flushParagraph = () => {
    if (paragraph.length) out.push(`<p>${paragraph.map(inline).join('<br>')}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.join('')}</${list.tag}>`);
    list = null;
  };
  const addListItem = (tag, html) => {
    flushParagraph();
    if (!list || list.tag !== tag) {
      flushList();
      list = { tag, items: [] };
    }
    list.items.push(html);
  };

  for (const line of source.split('\n')) {
    let m;

    if (!line.trim()) {
      flushParagraph();
      flushList();
    } else if ((m = line.match(/^(#{1,3})\s+(.*)/))) {
      flushParagraph();
      flushList();
      out.push(`<div class="h${m[1].length}">${inline(m[2])}</div>`);
    } else if ((m = line.match(/^>\s?(.*)/))) {
      flushParagraph();
      flushList();
      out.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else if ((m = line.match(/^[-*]\s+\[( |x)\]\s+(.*)/i))) {
      const box = m[1].trim() ? 'check_box' : 'check_box_outline_blank';
      addListItem('ul', `<li class="task"><span class="icon">${box}</span>${inline(m[2])}</li>`);
    } else if ((m = line.match(/^[-*]\s+(.*)/))) {
      addListItem('ul', `<li>${inline(m[1])}</li>`);
    } else if ((m = line.match(/^\d+\.\s+(.*)/))) {
      addListItem('ol', `<li>${inline(m[1])}</li>`);
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();

  return out.join('') || '<p class="empty">Nothing written yet.</p>';
}
