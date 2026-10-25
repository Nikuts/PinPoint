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

  it('switches tabs when mobile bottom navigation buttons are clicked via event listeners', () => {
    const { elements, mobileNavTabs } = createDOMEnvironment();

    const editorPanel = elements.get('editorPanel');
    const sheetPanel = elements.get('sheetPanel');
    const tabEditor = mobileNavTabs.find(t => t.getAttribute('data-tab') === 'editor');
    const tabSheet = mobileNavTabs.find(t => t.getAttribute('data-tab') === 'sheet');

    assert.ok(tabEditor, 'Editor tab button must exist');
    assert.ok(tabSheet, 'Sheet tab button must exist');

    // Simulate clicking Sheet tab button in bottom nav
    tabSheet.click();
    assert.ok(sheetPanel.classList.contains('mobile-active'), 'Sheet panel must be mobile-active after clicking sheet tab');
    assert.ok(!editorPanel.classList.contains('mobile-active'), 'Editor panel must not be active');
    assert.ok(tabSheet.classList.contains('active'), 'Sheet tab button must have active class');
    assert.ok(!tabEditor.classList.contains('active'), 'Editor tab button must not have active class');

    // Simulate clicking Editor tab button in bottom nav
    tabEditor.click();
    assert.ok(editorPanel.classList.contains('mobile-active'), 'Editor panel must be mobile-active after clicking editor tab');
    assert.ok(!sheetPanel.classList.contains('mobile-active'), 'Sheet panel must not be active');
    assert.ok(tabEditor.classList.contains('active'), 'Editor tab button must have active class');
    assert.ok(!tabSheet.classList.contains('active'), 'Sheet tab button must not have active class');
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
