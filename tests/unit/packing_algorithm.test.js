const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createDOMEnvironment } = require('../helpers/dom_env.js');

describe('Unit: 2D Circle Packing Algorithm (packCircles)', () => {
  const { app } = createDOMEnvironment();

  it('returns empty pages array when packing an empty queue', () => {
    const pages = app.packCircles([], 210, 297, 5.0, 2.5);
    assert.deepStrictEqual(pages, []);
  });

  it('places a single circle strictly within margins', () => {
    const item = { id: 'p1', radius: 35, cutMm: 70 }; // 58mm badge (70mm cut -> R=35)
    const margin = 5.0;
    const gap = 2.5;
    const pages = app.packCircles([item], 210, 297, margin, gap);

    assert.strictEqual(pages.length, 1);
    assert.strictEqual(pages[0].length, 1);
    const placed = pages[0][0];

    assert.ok(placed.x - placed.radius >= margin - 0.01, 'Left boundary respected');
    assert.ok(placed.y - placed.radius >= margin - 0.01, 'Top boundary respected');
    assert.ok(placed.x + placed.radius <= 210 - margin + 0.01, 'Right boundary respected');
    assert.ok(placed.y + placed.radius <= 297 - margin + 0.01, 'Bottom boundary respected');
  });

  it('ensures placed circles never overlap and respect inter-badge gaps', () => {
    const items = [];
    for (let i = 0; i < 8; i++) {
      items.push({ id: `p_${i}`, radius: 35, cutMm: 70 });
    }
    const margin = 5.0;
    const gap = 2.5;
    const pages = app.packCircles(items, 210, 297, margin, gap);

    assert.ok(pages.length >= 1);
    const page1 = pages[0];

    for (let i = 0; i < page1.length; i++) {
      for (let j = i + 1; j < page1.length; j++) {
        const c1 = page1[i];
        const c2 = page1[j];
        const dist = Math.hypot(c1.x - c2.x, c1.y - c2.y);
        const minDist = c1.radius + c2.radius + gap;
        assert.ok(dist >= minDist - 0.05, `Circles ${i} and ${j} must not overlap! dist=${dist}, minDist=${minDist}`);
      }
    }
  });

  it('correctly creates new pages when items exceed page capacity', () => {
    // A4 is 210 x 297 mm. With 70mm diameter + 2.5mm gap:
    // Max circles per A4 is typically ~8 to 9.
    // Packing 20 badges must create at least 3 pages.
    const items = [];
    for (let i = 0; i < 20; i++) {
      items.push({ id: `p_${i}`, radius: 35, cutMm: 70 });
    }
    const pages = app.packCircles(items, 210, 297, 5.0, 2.5);
    assert.ok(pages.length >= 3, `Expected at least 3 pages for 20 large badges, got ${pages.length}`);

    const totalPlaced = pages.reduce((sum, p) => sum + p.length, 0);
    assert.strictEqual(totalPlaced, 20, 'All 20 items must be placed across pages');
  });

  it('packs mixed-size badges without overlapping', () => {
    const items = [
      { id: 'b75', radius: 43, cutMm: 86 },
      { id: 'b58', radius: 35, cutMm: 70 },
      { id: 'b44', radius: 27, cutMm: 54 },
      { id: 'b32', radius: 22, cutMm: 44 },
      { id: 'b25', radius: 17.5, cutMm: 35 }
    ];
    const pages = app.packCircles(items, 210, 297, 5.0, 2.5);
    assert.strictEqual(pages.length, 1);
    const page = pages[0];
    assert.strictEqual(page.length, 5);

    for (let i = 0; i < page.length; i++) {
      for (let j = i + 1; j < page.length; j++) {
        const c1 = page[i];
        const c2 = page[j];
        const dist = Math.hypot(c1.x - c2.x, c1.y - c2.y);
        const minDist = c1.radius + c2.radius + 2.5;
        assert.ok(dist >= minDist - 0.05);
      }
    }
  });
});
