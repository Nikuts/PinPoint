const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createDOMEnvironment } = require('../helpers/dom_env.js');

describe('UI: Document & Badges Flow', () => {
  it('prevents adding badge to document if no image is loaded', () => {
    const { app, elements } = createDOMEnvironment();

    app.state.image = null;
    const addBtn = elements.get('addToSheetBtn');
    addBtn.click();

    assert.strictEqual(app.state.queue.length, 0);
  });

  it('adds badge to document and updates badges list when image is present', (t, done) => {
    const { app, elements } = createDOMEnvironment();

    app.state.image = new Image();
    app.state.visibleMm = 58;
    app.state.cutMm = 70;
    app.state.copies = 5;

    const addBtn = elements.get('addToSheetBtn');
    addBtn.click();

    setTimeout(() => {
      assert.strictEqual(app.state.queue.length, 1);
      assert.strictEqual(app.state.queue[0].count, 5);
      assert.strictEqual(app.state.queue[0].visibleMm, 58);
      assert.strictEqual(app.state.queue[0].cutMm, 70);

      const countBadge = elements.get('docBadgesCountBadge');
      assert.ok(countBadge.textContent.includes('5'));
      done();
    }, 10);
  });

  it('loads badge back into editor when card is clicked (loadBadgeIntoEditor)', () => {
    const { app } = createDOMEnvironment();

    const testItem = {
      id: 'pin_test',
      name: 'Logo Badge',
      visibleMm: 44,
      cutMm: 54,
      count: 3,
      thumbUrl: 'data:image/png;base64,123',
      highResUrl: 'data:image/png;base64,123'
    };

    app.loadBadgeIntoEditor(testItem);

    assert.strictEqual(app.state.visibleMm, 44);
    assert.strictEqual(app.state.cutMm, 54);
    assert.strictEqual(app.state.badgePreset, '44');
    assert.strictEqual(app.state.imgName, 'Logo Badge');
    assert.strictEqual(app.state.copies, 3);
  });

  it('updates packed pages when badges are added', () => {
    const { app } = createDOMEnvironment();

    app.state.queue = [
      { id: '1', name: 'B1', visibleMm: 58, cutMm: 70, count: 4, radius: 35 },
      { id: '2', name: 'B2', visibleMm: 32, cutMm: 44, count: 6, radius: 22 }
    ];

    app.recalculatePackingAndRender();

    assert.ok(app.state.packedPages.length >= 1);
    const totalPlaced = app.state.packedPages.reduce((sum, p) => sum + p.length, 0);
    assert.strictEqual(totalPlaced, 10);
  });

  it('clears document when confirmed', () => {
    const { app, elements } = createDOMEnvironment();

    app.state.queue = [
      { id: '1', name: 'B1', visibleMm: 58, cutMm: 70, count: 3, radius: 35 }
    ];
    app.recalculatePackingAndRender();
    assert.strictEqual(app.state.queue.length, 1);

    const okBtn = elements.get('modalConfirmBtn');
    okBtn.click();

    assert.strictEqual(app.state.queue.length, 0);
    assert.strictEqual(app.state.packedPages.length, 0);
  });

  it('prevents fast print and shows warning toast when document has no badges', () => {
    const { app, elements, window } = createDOMEnvironment();

    app.state.queue = [];
    app.state.packedPages = [];
    const printBtn = elements.get('printSheetBtn');
    assert.ok(printBtn, 'printSheetBtn must exist');

    printBtn.click();
    assert.strictEqual(window.printCalls, 0, 'window.print must not be called when queue is empty');
  });

  it('triggers fast print when document contains packed badges', (t, done) => {
    const { app, elements, window } = createDOMEnvironment();

    app.state.queue = [
      { id: '1', name: 'B1', visibleMm: 58, cutMm: 70, count: 2, radius: 35 }
    ];
    app.recalculatePackingAndRender();
    assert.ok(app.state.packedPages.length > 0);

    const printBtn = elements.get('printSheetBtn');
    printBtn.click();

    setTimeout(() => {
      assert.strictEqual(window.printCalls, 1, 'window.print must be invoked after print timeout');
      done();
    }, 100);
  });

  it('opens and closes paper catalog modal and selects paper format', () => {
    const { app, elements } = createDOMEnvironment();

    const openBtn = elements.get('openPaperCatalogBtn');
    const modal = elements.get('paperPickerModal');
    assert.ok(openBtn, 'openPaperCatalogBtn must exist');
    assert.ok(modal, 'paperPickerModal must exist');

    openBtn.click();
    assert.ok(modal.classList.contains('active'), 'Modal must have active class when opened');

    app.closePaperPickerModal();
    assert.ok(!modal.classList.contains('active'), 'Modal must not have active class when closed');

    // Select format
    app.selectPaperFormat('10x15');
    assert.strictEqual(app.state.paperKey, '10x15');
    const dims = app.getEffectivePaperDimensions();
    assert.strictEqual(dims.w, 101.6);
    assert.strictEqual(dims.h, 152.4);
  });

  it('renders favorite chips with full non-truncated labels', () => {
    const { app, elements } = createDOMEnvironment();

    app.state.favorites = ['A4', '10x15', '13x18'];
    app.renderFavoriteChips();

    const favBar = elements.get('favChipsBar');
    assert.ok(favBar, 'favChipsBar must exist');
    assert.strictEqual(favBar.children.length, 3);
    assert.ok(favBar.children[1].textContent.includes('10×15 cm'), 'Chip must include full "10×15 cm"');
    assert.ok(favBar.children[2].textContent.includes('13×18 cm'), 'Chip must include full "13×18 cm"');
  });

  it('contains zero emojis across UI button and navigation tags', () => {
    const fs = require('fs');
    const path = require('path');
    const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

    // Extract all button and nav tags
    const buttonTags = [...html.matchAll(/<(?:button|nav)[^>]*>([\s\S]*?)<\/(?:button|nav)>/g)].map(m => m[1]);
    const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]/;

    buttonTags.forEach((content) => {
      // Exclude star characters or triangle notch
      const cleanContent = content.replace(/[★☆▲]/g, '');
      assert.ok(!emojiRegex.test(cleanContent), `Content should not have emojis: ${cleanContent.slice(0, 40)}`);
    });
  });

  it('updates existing queue item when re-edited instead of creating duplicates', async () => {
    const { app, elements } = createDOMEnvironment();

    const mockItem = {
      id: 'pin_edit_test',
      name: 'Badge To Edit',
      visibleMm: 44,
      cutMm: 54,
      count: 3,
      thumbUrl: 'data:image/png;base64,t1',
      highResUrl: 'data:image/png;base64,h1',
      sourceUrl: 'data:image/png;base64,s1',
      transform: { imgX: 10, imgY: 20, zoom: 1.2, rotation: 45 }
    };

    app.state.queue = [mockItem];
    app.loadBadgeIntoEditor(mockItem);
    await new Promise(r => setTimeout(r, 20));

    assert.strictEqual(app.state.editingBadgeId, 'pin_edit_test');
    assert.strictEqual(app.state.visibleMm, 44);
    assert.strictEqual(app.state.cutMm, 54);
    assert.strictEqual(app.state.copies, 3);
    assert.strictEqual(app.state.imgX, 10);
    assert.strictEqual(app.state.imgY, 20);
    assert.strictEqual(app.state.zoom, 1.2);
    assert.strictEqual(app.state.rotation, 45);

    // Modify copies and re-save
    app.state.copies = 5;
    const addBtn = elements.get('addToSheetBtn');
    addBtn.click();
    await new Promise(r => setTimeout(r, 20));

    assert.strictEqual(app.state.queue.length, 1, 'Queue length must remain 1 (updated in place)');
    assert.strictEqual(app.state.queue[0].id, 'pin_edit_test');
    assert.strictEqual(app.state.queue[0].count, 5);
    assert.strictEqual(app.state.editingBadgeId, null, 'Editing badge ID must reset after updating');
  });

  it('cancels active badge editing mode when cancelEditBtn is clicked', async () => {
    const { app, elements } = createDOMEnvironment();

    const mockItem = {
      id: 'pin_cancel_test',
      name: 'Badge To Cancel',
      visibleMm: 58,
      cutMm: 70,
      count: 2,
      thumbUrl: 'data:image/png;base64,t1',
      highResUrl: 'data:image/png;base64,h1'
    };

    app.loadBadgeIntoEditor(mockItem);
    await new Promise(r => setTimeout(r, 20));

    const banner = elements.get('editingBadgeBanner');
    const cancelBtn = elements.get('cancelEditBtn');
    const addBtn = elements.get('addToSheetBtn');

    assert.strictEqual(app.state.editingBadgeId, 'pin_cancel_test');
    assert.ok(!banner.classList.contains('hidden'), 'Banner should be visible during editing');
    assert.ok(addBtn.classList.contains('editing-mode'), 'Add button should have editing-mode class');

    cancelBtn.click();
    assert.strictEqual(app.state.editingBadgeId, null, 'Editing badge ID should be cleared');
    assert.ok(banner.classList.contains('hidden'), 'Banner should be hidden after cancel');
    assert.ok(!addBtn.classList.contains('editing-mode'), 'Add button should not have editing-mode class');
  });

  it('closes modals on Escape key', () => {
    const { app, elements, windowListeners } = createDOMEnvironment();

    app.openPaperPickerModal();
    const modal = elements.get('paperPickerModal');
    assert.ok(modal.classList.contains('active'));

    const keydownHandlers = windowListeners['keydown'] || [];
    assert.ok(keydownHandlers.length > 0, 'Must register keydown handler');
    keydownHandlers.forEach(fn => fn({ key: 'Escape' }));

    assert.ok(!modal.classList.contains('active'), 'Modal must close on Escape');
  });
});
