const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createDOMEnvironment } = require('../helpers/dom_env.js');

describe('UI: Editor & Cropper Flow', () => {
  it('switches badge presets when chip buttons are clicked', () => {
    const { app, presetChips } = createDOMEnvironment();

    // Click on 44mm chip
    const chip44 = presetChips.find(c => c.getAttribute('data-preset') === '44');
    assert.ok(chip44, 'Preset 44mm button must exist');
    chip44.click();

    assert.strictEqual(app.state.badgePreset, '44');
    assert.strictEqual(app.state.visibleMm, 44);
    assert.strictEqual(app.state.cutMm, 54);
    assert.ok(chip44.classList.contains('active'));

    // Click on 25mm chip
    const chip25 = presetChips.find(c => c.getAttribute('data-preset') === '25');
    assert.ok(chip25, 'Preset 25mm button must exist');
    chip25.click();

    assert.strictEqual(app.state.badgePreset, '25');
    assert.strictEqual(app.state.visibleMm, 25);
    assert.strictEqual(app.state.cutMm, 35);
    assert.ok(chip25.classList.contains('active'));
    assert.ok(!chip44.classList.contains('active'));
  });

  it('updates custom size when custom inputs change', () => {
    const { app, elements } = createDOMEnvironment();

    const customVisInput = elements.get('customVisibleInput');
    const customCutInput = elements.get('customCutInput');

    customVisInput.value = '40';
    customVisInput.dispatchEvent({ type: 'input', target: { value: '40' } });

    customCutInput.value = '52';
    customCutInput.dispatchEvent({ type: 'input', target: { value: '52' } });

    assert.strictEqual(app.state.visibleMm, 40);
    assert.strictEqual(app.state.cutMm, 52);
  });

  it('adjusts zoom via slider and resets to 1x via resetZoomBtn', () => {
    const { app, elements } = createDOMEnvironment();

    const zoomRange = elements.get('zoomRange');
    const resetZoomBtn = elements.get('resetZoomBtn');

    zoomRange.value = '2.5';
    zoomRange.dispatchEvent({ type: 'input', target: { value: '2.5' } });
    assert.strictEqual(app.state.zoom, 2.5);

    resetZoomBtn.click();
    assert.strictEqual(app.state.zoom, 1.0);
  });

  it('adjusts rotation via slider, 0° reset button, and +90° button', () => {
    const { app, elements } = createDOMEnvironment();

    const rotRange = elements.get('rotRange');
    const resetRotBtn = elements.get('resetRotBtn');
    const rotate90Btn = elements.get('rotate90Btn');

    rotRange.value = '45';
    rotRange.dispatchEvent({ type: 'input', target: { value: '45' } });
    assert.strictEqual(app.state.rotation, 45);

    rotate90Btn.click();
    assert.strictEqual(app.state.rotation, 135);

    resetRotBtn.click();
    assert.strictEqual(app.state.rotation, 0);
  });

  it('centers image when centerImgBtn is clicked', () => {
    const { app, elements } = createDOMEnvironment();

    app.state.imgX = 40;
    app.state.imgY = -30;

    const centerBtn = elements.get('centerImgBtn');
    centerBtn.click();

    assert.strictEqual(app.state.imgX, 0);
    assert.strictEqual(app.state.imgY, 0);
  });

  it('calculates and sets correct Fit Face scale when fitFaceBtn is clicked', () => {
    const { app, elements } = createDOMEnvironment();

    // Mock loaded image
    app.state.image = new Image();
    app.state.visibleMm = 58;
    app.state.cutMm = 70;
    app.state.zoom = 2.0;

    const fitBtn = elements.get('fitFaceBtn');
    fitBtn.click();

    assert.strictEqual(app.state.imgX, 0);
    assert.strictEqual(app.state.imgY, 0);
    assert.strictEqual(app.state.zoom, 0.83); // 58 / 70 = 0.828... rounded to 0.83
  });

  it('increments and decrements copies count using steppers', () => {
    const { app, elements } = createDOMEnvironment();

    const incBtn = elements.get('copyIncBtn');
    const decBtn = elements.get('copyDecBtn');
    const copiesInput = elements.get('copiesInput');

    copiesInput.value = '1';
    app.state.copies = 1;

    incBtn.click();
    assert.strictEqual(app.state.copies, 2);

    incBtn.click();
    assert.strictEqual(app.state.copies, 3);

    decBtn.click();
    assert.strictEqual(app.state.copies, 2);

    decBtn.click();
    assert.strictEqual(app.state.copies, 1);

    // Cannot decrease below 1
    decBtn.click();
    assert.strictEqual(app.state.copies, 1);
  });

  it('resets editor state when discardPhotoBtn is clicked', () => {
    const { app, elements } = createDOMEnvironment();

    app.state.image = new Image();
    app.state.imgName = 'custom.png';
    app.state.zoom = 2.5;
    app.state.rotation = 90;

    const discardBtn = elements.get('discardPhotoBtn');
    discardBtn.click();

    assert.strictEqual(app.state.image, null);
    assert.strictEqual(app.state.imgX, 0);
    assert.strictEqual(app.state.imgY, 0);
    assert.strictEqual(app.state.zoom, 1.0);
    assert.strictEqual(app.state.rotation, 0);
  });
});
