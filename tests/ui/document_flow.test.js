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
});
