const fs = require('fs');
const path = require('path');

function createDOMEnvironment(options = {}) {
  const htmlPath = path.resolve(__dirname, '../../index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  const elements = new Map();
  const listeners = new Map();
  const storage = options.storage || new Map();

  function mockElement(id, tag = 'div', attributes = {}) {
    const el = {
      id: id || '',
      tagName: tag.toUpperCase(),
      style: {},
      attributes: { ...attributes },
      classes: new Set(),
      listeners: {},
      children: [],
      parentNode: null,

      classList: {
        add: (...c) => c.forEach(cls => el.classes.add(cls)),
        remove: (...c) => c.forEach(cls => el.classes.delete(cls)),
        toggle: (c, v) => (v !== undefined ? (v ? el.classes.add(c) : el.classes.delete(c)) : (el.classes.has(c) ? el.classes.delete(c) : el.classes.add(c))),
        contains: (c) => el.classes.has(c)
      },

      addEventListener: (evt, fn) => {
        el.listeners[evt] = el.listeners[evt] || [];
        el.listeners[evt].push(fn);
      },

      removeEventListener: (evt, fn) => {
        if (!el.listeners[evt]) return;
        el.listeners[evt] = el.listeners[evt].filter(f => f !== fn);
      },

      dispatchEvent: (evt) => {
        const type = typeof evt === 'string' ? evt : evt.type;
        const eObj = typeof evt === 'string' ? { type: evt, target: el, preventDefault: () => {}, stopPropagation: () => {} } : evt;
        if (!eObj.target) eObj.target = el;
        if (!eObj.preventDefault) eObj.preventDefault = () => {};
        if (!eObj.stopPropagation) eObj.stopPropagation = () => {};

        const handlers = el.listeners[type] || [];
        for (const handler of [...handlers]) {
          handler.call(el, eObj);
        }
      },

      click: () => {
        el.dispatchEvent({ type: 'click', target: el });
      },

      getAttribute: (attr) => (el.attributes[attr] !== undefined ? el.attributes[attr] : null),
      setAttribute: (attr, val) => { el.attributes[attr] = String(val); },
      removeAttribute: (attr) => { delete el.attributes[attr]; },

      getBoundingClientRect: () => ({ left: 0, top: 0, width: 440, height: 440 }),
      getContext: () => ({
        save: () => {},
        restore: () => {},
        scale: () => {},
        translate: () => {},
        rotate: () => {},
        clearRect: () => {},
        fillRect: () => {},
        beginPath: () => {},
        arc: () => {},
        rect: () => {},
        fill: () => {},
        stroke: () => {},
        moveTo: () => {},
        lineTo: () => {},
        clip: () => {},
        measureText: (txt) => ({ width: (txt || '').length * 8 }),
        fillText: () => {},
        drawImage: () => {},
        setLineDash: () => {},
        roundRect: () => {}
      }),

      setPointerCapture: () => {},
      releasePointerCapture: () => {},
      hasPointerCapture: () => false,

      toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      toBlob: (cb) => {
        cb({ size: 1000, type: 'image/png' });
      },

      value: '',
      textContent: '',
      innerHTML: '',
      disabled: false,

      appendChild: (child) => {
        if (child) {
          child.parentNode = el;
          el.children.push(child);
        }
      },
      removeChild: (child) => {
        const idx = el.children.indexOf(child);
        if (idx !== -1) {
          child.parentNode = null;
          el.children.splice(idx, 1);
        }
      },
      remove: () => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      },

      querySelector: (sel) => {
        if (sel.startsWith('#')) {
          const id = sel.slice(1);
          return elements.get(id) || null;
        }
        return mockElement('dyn_' + sel.replace(/[^a-zA-Z0-9]/g, '_'));
      },
      querySelectorAll: (sel) => []
    };
    return el;
  }

  // Pre-populate elements with IDs in index.html
  const idMatches = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
  idMatches.forEach(id => {
    elements.set(id, mockElement(id));
  });

  // Extract preset buttons
  const presetChips = [];
  const presetMatches = [...html.matchAll(/class="preset-chip-btn(?:\s+active)?"\s+data-preset="([^"]+)"/g)];
  presetMatches.forEach(m => {
    const preset = m[1];
    const el = mockElement(`presetBtn_${preset}`, 'button', { 'data-preset': preset });
    if (m[0].includes('active')) el.classList.add('active');
    presetChips.push(el);
  });

  // Extract mobile nav tabs
  const mobileNavTabs = [];
  const tabMatches = [...html.matchAll(/class="mobile-nav-tab(?:\s+active)?"\s+data-tab="([^"]+)"/g)];
  tabMatches.forEach(m => {
    const tabKey = m[1];
    const el = mockElement(`tabBtn_${tabKey}`, 'button', { 'data-tab': tabKey });
    if (m[0].includes('active')) el.classList.add('active');
    mobileNavTabs.push(el);
  });

  const mockLocalStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
  };

  const windowListeners = {};
  const mockWindow = {
    addEventListener: (evt, fn) => {
      windowListeners[evt] = windowListeners[evt] || [];
      windowListeners[evt].push(fn);
    },
    removeEventListener: (evt, fn) => {
      if (!windowListeners[evt]) return;
      windowListeners[evt] = windowListeners[evt].filter(f => f !== fn);
    },
    scrollTo: () => {},
    history: { pushState: () => {} },
    devicePixelRatio: 2,
    printCalls: 0,
    print: () => {
      mockWindow.printCalls = (mockWindow.printCalls || 0) + 1;
    }
  };

  const mockDocument = {
    getElementById: (id) => elements.get(id) || null,
    querySelectorAll: (sel) => {
      if (sel === '.preset-chip-btn') return presetChips;
      if (sel === '.mobile-nav-tab') return mobileNavTabs;
      if (sel.includes('[data-i18n]')) return [];
      if (sel.includes('[data-i18n-title]')) return [];
      return [];
    },
    querySelector: (sel) => {
      if (sel.startsWith('#')) return elements.get(sel.slice(1)) || null;
      return mockElement('dyn_' + sel);
    },
    documentElement: { lang: 'uk' },
    title: '',
    createElement: (tag) => mockElement('dyn_' + Math.random().toString(36).slice(2, 6), tag),
    body: mockElement('body'),
    head: mockElement('head')
  };

  const mockNavigator = {
    language: 'uk',
    vibrate: () => true
  };

  class MockImage {
    constructor() {
      this.width = 1200;
      this.height = 800;
      this.naturalWidth = 1200;
      this.naturalHeight = 800;
      this._src = '';
    }
    set src(val) {
      this._src = val;
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
    get src() {
      return this._src;
    }
  }

  class MockFileReader {
    readAsDataURL(file) {
      setTimeout(() => {
        if (this.onload) this.onload({ target: { result: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' } });
      }, 0);
    }
  }

  // Extract application script
  const marker = 'APPLICATION LOGIC & SCRIPTS';
  const markerIdx = html.indexOf(marker);
  const scriptOpen = html.indexOf('<script>', markerIdx);
  const scriptClose = html.indexOf('</script>', scriptOpen);
  const scriptCode = html.slice(scriptOpen + 8, scriptClose);

  // Set globals
  global.window = mockWindow;
  global.document = mockDocument;
  global.localStorage = mockLocalStorage;
  global.navigator = mockNavigator;
  global.Image = MockImage;
  global.FileReader = MockFileReader;

  // Execute application code inside a wrapper function that exports internal scope
  const runCode = new Function(`
    ${scriptCode}
    return {
      state,
      I18N,
      BADGE_PRESETS,
      PAPER_FORMATS,
      updateBleedCalc,
      updatePresetBadgeText,
      getEffectivePaperDimensions,
      packCircles,
      loadSavedState,
      saveState,
      setLanguage,
      selectPaperFormat,
      toggleFavoritePaper,
      loadImageFile,
      drawCropCanvas,
      addBadgeToQueue,
      loadBadgeIntoEditor,
      discardCurrentPhoto,
      renderQueueList,
      recalculatePackingAndRender,
      switchMobileTab,
      showToast,
      printCurrentSheet
    };
  `);

  const app = runCode();

  // Trigger DOMContentLoaded
  if (windowListeners['DOMContentLoaded']) {
    windowListeners['DOMContentLoaded'].forEach(fn => fn());
  }

  return {
    app,
    elements,
    storage: mockLocalStorage,
    storageMap: storage,
    window: mockWindow,
    document: mockDocument,
    presetChips,
    mobileNavTabs
  };
}

module.exports = { createDOMEnvironment };
