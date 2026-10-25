const { describe, it } = require('node:test');
const assert = require('node:assert');
const { createDOMEnvironment } = require('../helpers/dom_env.js');

describe('UI: Persistence & LocalStorage Safeguards', () => {
  it('saves and restores paper settings and orientation', () => {
    const { app, storage, storageMap } = createDOMEnvironment();

    app.state.lang = 'en';
    app.state.paperKey = '10x15';
    app.state.orientation = 'landscape';
    app.state.marginMm = 7.5;
    app.state.gapMm = 3.0;

    app.saveState();

    assert.strictEqual(storage.getItem('pinpoint_lang'), 'en');
    assert.strictEqual(storage.getItem('pinpoint_paper'), '10x15');
    assert.strictEqual(storage.getItem('pinpoint_orient'), 'landscape');
    assert.strictEqual(storage.getItem('pinpoint_margin'), '7.5');
    assert.strictEqual(storage.getItem('pinpoint_gap'), '3');

    // Create a new instance sharing the same storage
    const env2 = createDOMEnvironment({ storage: storageMap });
    env2.app.loadSavedState();

    assert.strictEqual(env2.app.state.paperKey, '10x15');
    assert.strictEqual(env2.app.state.orientation, 'landscape');
    assert.strictEqual(env2.app.state.marginMm, 7.5);
    assert.strictEqual(env2.app.state.gapMm, 3.0);
  });

  it('omits heavy highResUrl when serializing queue to localStorage', () => {
    const { app, storage } = createDOMEnvironment();

    const heavyDataUrl = 'data:image/png;base64,' + 'A'.repeat(50000); // 50KB mock string
    app.state.queue = [
      {
        id: 'pin_1',
        name: 'Badge 1',
        visibleMm: 58,
        cutMm: 70,
        count: 2,
        thumbUrl: 'data:image/png;base64,thumb',
        highResUrl: heavyDataUrl
      }
    ];

    app.saveState();

    const savedQueueRaw = storage.getItem('pinpoint_queue');
    assert.ok(savedQueueRaw);
    const parsed = JSON.parse(savedQueueRaw);

    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].id, 'pin_1');
    assert.strictEqual(parsed[0].thumbUrl, 'data:image/png;base64,thumb');
    assert.strictEqual(parsed[0].highResUrl, undefined, 'highResUrl must be omitted from localStorage to prevent quota overflow');
  });

  it('restores fallback highResUrl from thumbUrl if missing on reload', () => {
    const { app, storage } = createDOMEnvironment();

    const mockSaved = [
      {
        id: 'pin_saved',
        name: 'Saved Badge',
        visibleMm: 32,
        cutMm: 44,
        count: 1,
        thumbUrl: 'data:image/png;base64,thumb123'
      }
    ];
    storage.setItem('pinpoint_queue', JSON.stringify(mockSaved));

    app.loadSavedState();

    assert.strictEqual(app.state.queue.length, 1);
    assert.strictEqual(app.state.queue[0].highResUrl, 'data:image/png;base64,thumb123');
  });
});
