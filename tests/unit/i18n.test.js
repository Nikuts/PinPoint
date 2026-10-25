const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { createDOMEnvironment } = require('../helpers/dom_env.js');

describe('Unit: Internationalization (I18N)', () => {
  const { app } = createDOMEnvironment();
  const htmlPath = path.resolve(__dirname, '../../index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  it('has identical keys in Ukrainian (uk) and English (en)', () => {
    const ukKeys = Object.keys(app.I18N.uk).sort();
    const enKeys = Object.keys(app.I18N.en).sort();

    const missingInEn = ukKeys.filter(k => !enKeys.includes(k));
    const missingInUk = enKeys.filter(k => !ukKeys.includes(k));

    assert.deepStrictEqual(missingInEn, [], 'No keys should be missing in EN');
    assert.deepStrictEqual(missingInUk, [], 'No keys should be missing in UK');
    assert.strictEqual(ukKeys.length, enKeys.length);
  });

  it('provides translations for all data-i18n attributes present in DOM', () => {
    const regex = /data-i18n="([^"]+)"/g;
    const matches = [...html.matchAll(regex)].map(m => m[1]);
    const uniqueKeys = [...new Set(matches)];

    const missing = uniqueKeys.filter(k => !app.I18N.uk[k] || !app.I18N.en[k]);
    assert.deepStrictEqual(missing, [], 'All data-i18n tags must exist in I18N');
  });

  it('provides translations for all data-i18n-title attributes present in DOM', () => {
    const regex = /data-i18n-title="([^"]+)"/g;
    const matches = [...html.matchAll(regex)].map(m => m[1]);
    const uniqueKeys = [...new Set(matches)];

    const missing = uniqueKeys.filter(k => !app.I18N.uk[k] || !app.I18N.en[k]);
    assert.deepStrictEqual(missing, [], 'All data-i18n-title tags must exist in I18N');
  });

  it('correctly switches language dynamically via setLanguage', () => {
    app.setLanguage('en');
    assert.strictEqual(app.state.lang, 'en');

    app.setLanguage('uk');
    assert.strictEqual(app.state.lang, 'uk');
  });
});
