const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createDOMEnvironment } = require('../helpers/dom_env.js');

describe('UI: Mobile Navigation & Tab Switching', () => {
  it('switches between editor and sheet tabs and updates active classes', () => {
    const { app, elements, mobileNavTabs } = createDOMEnvironment();

    const editorPanel = elements.get('editorPanel');
    const sheetPanel = elements.get('sheetPanel');
    const tabEditor = mobileNavTabs.find(t => t.getAttribute('data-tab') === 'editor');
    const tabSheet = mobileNavTabs.find(t => t.getAttribute('data-tab') === 'sheet');

    assert.ok(tabEditor, 'Editor tab button must exist');
    assert.ok(tabSheet, 'Sheet tab button must exist');

    // Switch to sheet
    app.switchMobileTab('sheet', false);
    assert.ok(sheetPanel.classList.contains('mobile-active'));
    assert.ok(!editorPanel.classList.contains('mobile-active'));
    assert.ok(tabSheet.classList.contains('active'));
    assert.ok(!tabEditor.classList.contains('active'));

    // Switch back to editor
    app.switchMobileTab('editor', false);
    assert.ok(editorPanel.classList.contains('mobile-active'));
    assert.ok(!sheetPanel.classList.contains('mobile-active'));
    assert.ok(tabEditor.classList.contains('active'));
    assert.ok(!tabSheet.classList.contains('active'));
  });

  it('navigates back to editor when sheetBackToEditorBtn is clicked', () => {
    const { app, elements } = createDOMEnvironment();

    const editorPanel = elements.get('editorPanel');
    const sheetPanel = elements.get('sheetPanel');
    const backBtn = elements.get('sheetBackToEditorBtn');

    // Start on sheet
    app.switchMobileTab('sheet', false);
    assert.ok(sheetPanel.classList.contains('mobile-active'));

    backBtn.click();
    assert.ok(editorPanel.classList.contains('mobile-active'));
    assert.ok(!sheetPanel.classList.contains('mobile-active'));
  });

  it('updates mobile sheet badge pill count and toggles visibility', () => {
    const { app, elements } = createDOMEnvironment();

    const mobSheetBadge = elements.get('mobileSheetBadge');

    // Initially 0 items -> display none
    app.state.queue = [];
    app.renderQueueList();
    assert.strictEqual(mobSheetBadge.style.display, 'none');

    // Add items -> badge shows total count
    app.state.queue = [
      { id: '1', name: 'B1', visibleMm: 58, cutMm: 70, count: 4, thumbUrl: '' },
      { id: '2', name: 'B2', visibleMm: 32, cutMm: 44, count: 3, thumbUrl: '' }
    ];
    app.renderQueueList();
    assert.strictEqual(mobSheetBadge.textContent, 7);
    assert.strictEqual(mobSheetBadge.style.display, 'inline-block');
  });
});
