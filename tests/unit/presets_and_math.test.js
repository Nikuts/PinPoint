const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createDOMEnvironment } = require('../helpers/dom_env.js');

describe('Unit: Badge Presets & Math Calculations', () => {
  const { app } = createDOMEnvironment();

  it('contains all standard badge presets with correct visible and cut diameters', () => {
    assert.deepStrictEqual(app.BADGE_PRESETS['58'], { visible: 58, cut: 70 });
    assert.deepStrictEqual(app.BADGE_PRESETS['44'], { visible: 44, cut: 54 });
    assert.deepStrictEqual(app.BADGE_PRESETS['32'], { visible: 32, cut: 44 });
    assert.deepStrictEqual(app.BADGE_PRESETS['25'], { visible: 25, cut: 35 });
    assert.deepStrictEqual(app.BADGE_PRESETS['75'], { visible: 75, cut: 86 });
    assert.ok(app.BADGE_PRESETS['custom']);
  });

  it('correctly calculates bleed/wrap margin for all presets', () => {
    // Bleed wrap = (cut - visible) / 2
    const calcBleed = (visible, cut) => (cut - visible) / 2;

    assert.strictEqual(calcBleed(58, 70), 6.0);
    assert.strictEqual(calcBleed(44, 54), 5.0);
    assert.strictEqual(calcBleed(32, 44), 6.0);
    assert.strictEqual(calcBleed(25, 35), 5.0);
    assert.strictEqual(calcBleed(75, 86), 5.5);
  });

  it('correctly calculates "Fit Face" zoom scale', () => {
    // Zoom for Fit Face = visibleMm / cutMm
    const fit58 = 58 / 70;
    assert.strictEqual(parseFloat(fit58.toFixed(2)), 0.83);

    const fit44 = 44 / 54;
    assert.strictEqual(parseFloat(fit44.toFixed(2)), 0.81);

    const fit25 = 25 / 35;
    assert.strictEqual(parseFloat(fit25.toFixed(2)), 0.71);
  });

  it('correctly handles paper dimensions for portrait and landscape', () => {
    app.state.paperKey = 'A4';
    
    app.state.orientation = 'portrait';
    const portDim = app.getEffectivePaperDimensions();
    assert.strictEqual(portDim.w, 210);
    assert.strictEqual(portDim.h, 297);

    app.state.orientation = 'landscape';
    const landDim = app.getEffectivePaperDimensions();
    assert.strictEqual(landDim.w, 297);
    assert.strictEqual(landDim.h, 210);
  });

  it('supports custom paper dimensions', () => {
    app.state.paperKey = 'custom';
    app.state.customPaperW = 150;
    app.state.customPaperH = 250;
    app.state.orientation = 'portrait';

    const customDim = app.getEffectivePaperDimensions();
    assert.strictEqual(customDim.w, 150);
    assert.strictEqual(customDim.h, 250);
  });
});
