const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createDOMEnvironment } = require('../helpers/dom_env.js');

describe('UI: Full End-to-End User Journeys', () => {

  it('Journey 1: Badge creation flow from image upload to mobile sheet preview', (t, done) => {
    const { app, elements, presetChips, mobileNavTabs } = createDOMEnvironment();

    const editorPanel = elements.get('editorPanel');
    const sheetPanel = elements.get('sheetPanel');
    const mobSheetBadge = elements.get('mobileSheetBadge');
    const tabSheet = mobileNavTabs.find(tab => tab.getAttribute('data-tab') === 'sheet');

    // Step 1: Initial state verification
    assert.ok(editorPanel.classList.contains('mobile-active'), 'Editor panel must be active by default');
    assert.strictEqual(app.state.queue.length, 0);
    assert.strictEqual(mobSheetBadge.style.display, 'none');

    // Step 2: User uploads an image via file input
    const fileInput = elements.get('fileInput');
    const mockFile = { name: 'hero_badge.png', type: 'image/png', size: 102400 };

    fileInput.dispatchEvent({
      type: 'change',
      target: { files: [mockFile] }
    });

    setTimeout(() => {
      assert.ok(app.state.image, 'Image must be loaded into editor state');
      assert.strictEqual(app.state.imgName, 'hero_badge');

      // Step 3: User picks 58mm preset
      const chip58 = presetChips.find(c => c.getAttribute('data-preset') === '58');
      chip58.click();
      assert.strictEqual(app.state.badgePreset, '58');
      assert.strictEqual(app.state.visibleMm, 58);
      assert.strictEqual(app.state.cutMm, 70);

      // Step 4: User clicks Fit Face button
      const fitFaceBtn = elements.get('fitFaceBtn');
      fitFaceBtn.click();
      const expectedFitScale = parseFloat((58 / 70).toFixed(2));
      assert.strictEqual(app.state.zoom, expectedFitScale);

      // Step 5: User rotates image by 90 degrees
      const rot90Btn = elements.get('rotate90Btn');
      rot90Btn.click();
      assert.strictEqual(app.state.rotation, 90);

      // Step 6: User centers image
      const centerBtn = elements.get('centerImgBtn');
      centerBtn.click();
      assert.strictEqual(app.state.imgX, 0);
      assert.strictEqual(app.state.imgY, 0);

      // Step 7: User increments copies to 3
      const incBtn = elements.get('copyIncBtn');
      incBtn.click(); // copies = 2
      incBtn.click(); // copies = 3
      assert.strictEqual(app.state.copies, 3);

      // Step 8: User adds badge to sheet
      const addBtn = elements.get('addToSheetBtn');
      addBtn.click();

      setTimeout(() => {
        assert.strictEqual(app.state.queue.length, 1);
        assert.strictEqual(app.state.queue[0].count, 3);
        assert.strictEqual(app.state.queue[0].visibleMm, 58);

        // Step 9: User taps "Sheet" tab in bottom navigation
        tabSheet.click();
        assert.ok(sheetPanel.classList.contains('mobile-active'), 'Sheet panel must become mobile-active');
        assert.ok(!editorPanel.classList.contains('mobile-active'), 'Editor panel must hide');
        assert.strictEqual(mobSheetBadge.textContent, 3);
        assert.strictEqual(mobSheetBadge.style.display, 'inline-block');

        done();
      }, 20);
    }, 20);
  });

  it('Journey 2: Multi-size badge packing, paper layout configuration, and pagination', (t, done) => {
    const { app, elements, presetChips, mobileNavTabs } = createDOMEnvironment();

    // Prepare initial image
    app.state.image = new Image();
    app.state.imgName = 'badge_sample.png';

    // Badge 1: 58mm x 4 copies
    const chip58 = presetChips.find(c => c.getAttribute('data-preset') === '58');
    chip58.click();
    app.state.copies = 4;
    elements.get('addToSheetBtn').click();

    setTimeout(() => {
      // Badge 2: 32mm x 16 copies
      const chip32 = presetChips.find(c => c.getAttribute('data-preset') === '32');
      chip32.click();
      app.state.copies = 16;
      elements.get('addToSheetBtn').click();

      setTimeout(() => {
        assert.strictEqual(app.state.queue.length, 2);
        const totalItems = app.state.queue.reduce((s, it) => s + it.count, 0);
        assert.strictEqual(totalItems, 20);

        // User switches to sheet tab
        const tabSheet = mobileNavTabs.find(tab => tab.getAttribute('data-tab') === 'sheet');
        tabSheet.click();
        assert.ok(elements.get('sheetPanel').classList.contains('mobile-active'));

        // User changes orientation to Landscape
        const landBtn = elements.get('orientLandBtn');
        const portBtn = elements.get('orientPortBtn');
        landBtn.click();
        assert.strictEqual(app.state.orientation, 'landscape');
        assert.ok(landBtn.classList.contains('active'));
        assert.ok(!portBtn.classList.contains('active'));

        // User stars/unstars favorite paper format
        const starBtn = elements.get('starPaperBtn');
        const origFavCount = app.state.favorites.length;
        starBtn.click(); // Toggle current paper
        // Should toggle cleanly without crashing
        assert.ok(Array.isArray(app.state.favorites));

        // User adjusts margins and inter-badge spacing
        const marginInput = elements.get('marginInput');
        marginInput.value = '8';
        marginInput.dispatchEvent({ type: 'input', target: { value: '8' } });
        assert.strictEqual(app.state.marginMm, 8);

        const gapInput = elements.get('gapInput');
        gapInput.value = '3.5';
        gapInput.dispatchEvent({ type: 'input', target: { value: '3.5' } });
        assert.strictEqual(app.state.gapMm, 3.5);

        // Check packed pages capacity
        assert.ok(app.state.packedPages.length >= 1);

        // Test pagination buttons
        const prevBtn = elements.get('prevPageBtn');
        const nextBtn = elements.get('nextPageBtn');

        if (app.state.packedPages.length > 1) {
          assert.strictEqual(app.state.currentPageIdx, 0);
          nextBtn.click();
          assert.strictEqual(app.state.currentPageIdx, 1);
          prevBtn.click();
          assert.strictEqual(app.state.currentPageIdx, 0);
        }

        // User clicks back to editor button
        const backBtn = elements.get('sheetBackToEditorBtn');
        backBtn.click();
        assert.ok(elements.get('editorPanel').classList.contains('mobile-active'));

        done();
      }, 20);
    }, 20);
  });

  it('Journey 3: Document item management & modal confirmation lifecycle', (t, done) => {
    const { app, elements } = createDOMEnvironment();

    // Populate queue with 2 badges
    app.state.queue = [
      { id: 'badge_1', name: 'Badge Alpha', visibleMm: 58, cutMm: 70, count: 5, thumbUrl: 'data:img1', highResUrl: 'data:img1' },
      { id: 'badge_2', name: 'Badge Beta', visibleMm: 25, cutMm: 35, count: 2, thumbUrl: 'data:img2', highResUrl: 'data:img2' }
    ];
    app.renderQueueList();
    app.recalculatePackingAndRender();

    const listContainer = elements.get('docBadgesListContainer');
    assert.strictEqual(listContainer.children.length, 2);

    // Card 1 mini stepper: User increments count
    const card1 = listContainer.children[0];
    const incBtn1 = card1.querySelector('.inc-btn');
    assert.ok(incBtn1, 'Card 1 inc button must exist');
    incBtn1.click();
    assert.strictEqual(app.state.queue[0].count, 6);

    // Card 1 mini stepper: User decrements count
    const decBtn1 = card1.querySelector('.dec-btn');
    assert.ok(decBtn1, 'Card 1 dec button must exist');
    decBtn1.click();
    assert.strictEqual(app.state.queue[0].count, 5);

    // User clicks thumbnail to reload badge into editor
    const thumbWrap = card1.querySelector('.queue-thumb-wrap');
    thumbWrap.click();
    assert.strictEqual(app.state.visibleMm, 58);
    assert.strictEqual(app.state.cutMm, 70);
    assert.strictEqual(app.state.copies, 5);

    // Card 2: User clicks delete button
    const card2 = listContainer.children[1];
    const delBtn2 = card2.querySelector('.queue-del-btn');
    assert.ok(delBtn2, 'Card 2 delete button must exist');
    delBtn2.click();
    assert.strictEqual(app.state.queue.length, 1);
    assert.strictEqual(app.state.queue[0].id, 'badge_1');

    // User attempts to clear sheet: Opens modal
    const clearDocBtn = elements.get('sheetClearDocBtn');
    const modal = elements.get('confirmModal');
    clearDocBtn.click();
    assert.ok(modal.classList.contains('open'), 'Confirmation modal must open');

    // User cancels deletion
    const cancelBtn = elements.get('modalCancelBtn');
    cancelBtn.click();
    assert.ok(!modal.classList.contains('open'), 'Modal must close on cancel');
    assert.strictEqual(app.state.queue.length, 1, 'Queue must remain intact after cancel');

    // User clears again via desktop toolbar button and confirms
    const clearAllBtn = elements.get('sheetClearAllBtn');
    clearAllBtn.click();
    assert.ok(modal.classList.contains('open'));

    const confirmBtn = elements.get('modalConfirmBtn');
    confirmBtn.click();
    assert.ok(!modal.classList.contains('open'), 'Modal must close on confirm');
    assert.strictEqual(app.state.queue.length, 0, 'Queue must be empty after confirm');
    assert.strictEqual(app.state.packedPages.length, 0);

    done();
  });

  it('Journey 4: Export to PDF, Image, and Direct Fast Print', async () => {
    const { app, elements, window } = createDOMEnvironment();

    // 1. Empty document fast print test
    const printBtn = elements.get('printSheetBtn');
    printBtn.click();
    assert.strictEqual(window.printCalls, 0, 'Print must not fire on empty document');

    // 2. Add badges to sheet
    app.state.queue = [
      { id: 'b1', name: 'Print Badge', visibleMm: 44, cutMm: 54, count: 4, radius: 27, thumbUrl: 'data:img', highResUrl: 'data:img' }
    ];
    app.recalculatePackingAndRender();
    assert.ok(app.state.packedPages.length > 0);

    // 3. Fast print with badges present
    printBtn.click();
    await new Promise(r => setTimeout(r, 90));
    assert.strictEqual(window.printCalls, 1, 'Print dialog must be triggered');

    // 4. Download PDF
    const pdfBtn = elements.get('downloadPdfBtn');
    await app.downloadPdf();
    assert.strictEqual(pdfBtn.disabled, false);

    // 5. Download PNG Image
    const imgBtn = elements.get('downloadImageBtn');
    await app.downloadSheetImage();
    assert.strictEqual(imgBtn.disabled, false);
  });

  it('Journey 5: App settings, language localization, and PWA installation lifecycle', () => {
    const { app, elements, window, windowListeners } = createDOMEnvironment();

    // 1. Language Toggle
    const langBtn = elements.get('langToggleBtn');
    const langLabel = elements.get('langLabel');
    const langFlag = elements.get('langFlag');
    const initialLang = app.state.lang;
    const toggledLang = initialLang === 'uk' ? 'en' : 'uk';

    langBtn.click();
    assert.strictEqual(app.state.lang, toggledLang);
    assert.strictEqual(langLabel.textContent, toggledLang.toUpperCase());
    assert.strictEqual(langFlag.textContent, toggledLang === 'uk' ? '🇺🇦' : '🇬🇧');

    langBtn.click();
    assert.strictEqual(app.state.lang, initialLang);
    assert.strictEqual(langLabel.textContent, initialLang.toUpperCase());
    assert.strictEqual(langFlag.textContent, initialLang === 'uk' ? '🇺🇦' : '🇬🇧');

    // 2. PWA Install lifecycle
    const pwaBtn = elements.get('pwaInstallBtn');

    let promptTriggered = false;
    const fakeInstallEvent = {
      preventDefault: () => {},
      prompt: () => { promptTriggered = true; }
    };

    // Browser fires beforeinstallprompt
    const beforeInstallHandlers = windowListeners['beforeinstallprompt'] || [];
    assert.ok(beforeInstallHandlers.length > 0, 'beforeinstallprompt listener must be registered');
    beforeInstallHandlers.forEach(fn => fn(fakeInstallEvent));

    // Install button becomes visible
    assert.strictEqual(pwaBtn.style.display, 'block');

    // User clicks Install
    pwaBtn.click();
    assert.strictEqual(promptTriggered, true, 'User prompt() must be triggered');
    assert.strictEqual(pwaBtn.style.display, 'none', 'Install button must hide after click');
  });

});
