/* Rasel's Archive — automatic visual watermark for photos and videos.
   The overlay is rendered over media throughout the site; original uploads remain untouched. */
(() => {
  'use strict';

  const MARKUP = `
    <span class="ra-archive-watermark" aria-label="Rasel's Archive">
      <span class="ra-archive-wordmark">Rasel's Archive</span>
    </span>`;

  const style = document.createElement('style');
  style.id = 'ra-archive-watermark-style';
  style.textContent = `
    .ra-media-watermark-shell{
      display:block!important;position:relative!important;max-width:100%;
      overflow:hidden;border-radius:inherit;isolation:isolate;
    }
    .ra-media-watermark-shell>img,
    .ra-media-watermark-shell>video{display:block;max-width:100%}
    .ra-archive-watermark{
      position:absolute;right:10px;bottom:9px;z-index:8;
      display:inline-block;max-width:calc(100% - 20px);
      padding:0;margin:0;background:transparent;border:0;border-radius:0;
      box-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;
      color:rgba(255,255,255,.94);pointer-events:none;user-select:none;
      opacity:.86;white-space:nowrap;line-height:1.1;
      text-shadow:0 1px 4px rgba(0,0,0,.58);
    }
    .ra-archive-wordmark{
      font-family:"Cormorant Garamond", "Baskerville", "Palatino Linotype", Georgia, serif;
      font-size:clamp(11px,1.05vw,14px);font-style:italic;font-weight:400;
      letter-spacing:.015em;line-height:1.1;
    }
    @media(max-width:600px){
      .ra-archive-watermark{right:7px;bottom:7px}
      .ra-archive-wordmark{font-size:10px}
    }
    @media(prefers-reduced-motion:no-preference){
      .ra-archive-watermark{transition:opacity .2s ease}
      .ra-media-watermark-shell:hover .ra-archive-watermark{opacity:1}
    }
  `;
  document.head.appendChild(style);

  function shouldWatermark(media) {
    if (!media || media.dataset.raWatermarked === 'true') return false;
    if (media.closest('[data-no-archive-watermark],.no-archive-watermark')) return false;
    if (!media.closest('main')) return false;
    const src = media.getAttribute('src') || '';
    if (!src && media.tagName === 'IMG') return false;
    if (media.tagName === 'IMG' && (media.alt || '').toLowerCase().includes('icon')) return false;
    return true;
  }

  function decorate(media) {
    if (!shouldWatermark(media)) return;
    const parent = media.parentElement;
    if (!parent) return;
    const shell = document.createElement('span');
    shell.className = 'ra-media-watermark-shell';
    shell.dataset.raWatermarkShell = 'true';
    // Preserve the media element's existing sizing and card layout.
    const computed = getComputedStyle(media);
    if (computed.width && computed.width !== 'auto') shell.style.width = computed.width;
    if (computed.height && computed.height !== 'auto') shell.style.height = computed.height;
    if (computed.flex) shell.style.flex = computed.flex;
    parent.insertBefore(shell, media);
    shell.appendChild(media);
    media.dataset.raWatermarked = 'true';
    shell.insertAdjacentHTML('beforeend', MARKUP);
  }

  function scan(root = document) {
    if (root.matches?.('img,video') && root.closest('main')) decorate(root);
    if (root === document || root === document.body || root.matches?.('main') || root.closest?.('main')) {
      root.querySelectorAll?.('img,video').forEach(decorate);
    }
  }

  const start = () => {
    scan();
    const observer = new MutationObserver(records => {
      for (const record of records) {
        record.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) scan(node);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // Re-scan after lazy media sources are populated by gallery renderers.
    document.addEventListener('load', e => {
      if (e.target?.matches?.('img,video')) decorate(e.target);
    }, true);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
