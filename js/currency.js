(function () {
  'use strict';
  const format = value => 'Rp ' + new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(value) || 0);
  const convertText = text => text.replace(/\$\s*([\d,.]+)/g, (_match, raw) => {
    const value = Number(raw.replace(/,/g, ''));
    return format(value);
  });
  document.addEventListener('DOMContentLoaded', () => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const parent = walker.currentNode.parentElement;
      if (parent && !['SCRIPT', 'STYLE'].includes(parent.tagName) && /\$\s*[\d,.]+/.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
    }
    nodes.forEach(node => { node.nodeValue = convertText(node.nodeValue); });
    document.querySelectorAll('.header-links a').forEach(link => {
      if (link.textContent.trim() === 'USD') link.textContent = 'Rupiah (Rp)';
    });
  });
}());
