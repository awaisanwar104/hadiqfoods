// Reads the restaurant's menu from its Google Sheet; shared by the menu page and the home page.
//
// The sheet has two tabs, read by name: "Menu" (one row per dish) and "Categories".
// HadiqMenu.load(callback) calls back with { dishes, categories }: first with the menu this
// browser saw last time (if any) so pages render instantly, then again with the fresh sheet.
// menu-data.json is the fallback when neither is available; callback(null) if nothing loads.
(function () {
  var SHEET_ID = '1PNL5b2Qzfl7m1DxCXHavSzkez84Lcp0oKluZXymbZC4';
  var CACHE_KEY = 'hadiq_menu_v1';

  function sheetUrl(tab) {
    return 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&headers=1&sheet=' + encodeURIComponent(tab);
  }
  function fetchText(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    });
  }
  function parseCsv(text) {
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    var head = (rows.shift() || []).map(function (h) { return h.trim(); });
    return rows.map(function (r) {
      var o = {};
      head.forEach(function (h, i) { o[h] = (r[i] || '').trim(); });
      return o;
    });
  }
  function fetchSheet() {
    return Promise.all([fetchText(sheetUrl('Menu')), fetchText(sheetUrl('Categories'))])
      .then(function (t) {
        var data = { Menu: parseCsv(t[0]), Categories: parseCsv(t[1]) };
        if (!data.Menu.length || !('Name' in data.Menu[0])) throw new Error('unexpected sheet format');
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
        return data;
      });
  }
  function cachedMenu() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) { return null; }
  }

  function num(v) { return Number(String(v || '').replace(/[^\d.]/g, '')) || 0; }
  function yes(v) { return /^(yes|y|true|1)$/i.test(String(v).trim()); }
  function slug(s) { return 'cat-' + s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  // "Small: 650, Medium: 1100"  ->  [{label:'Small', price:650}, ...]
  function parseOptions(s) {
    return String(s || '').split(',').map(function (part) {
      var i = part.lastIndexOf(':');
      if (i < 0) return null;
      var label = part.slice(0, i).trim(), price = num(part.slice(i + 1));
      return label && price ? { label: label, price: price } : null;
    }).filter(Boolean);
  }

  // Cloudinary photos are requested resized; Google Drive share links become direct image links.
  function photo(url) {
    url = String(url || '').trim();
    if (!/^https?:\/\//.test(url)) return '';
    var m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/);
    if (m) return 'https://lh3.googleusercontent.com/d/' + m[1] + '=w800';
    if (/res\.cloudinary\.com\/.+\/image\/upload\//.test(url) && !/\/upload\/[a-z]_[^/]*\//.test(url)) {
      return url.replace('/image/upload/', '/image/upload/f_auto,q_auto,c_limit,w_800/');
    }
    return url;
  }

  function prepare(data) {
    var categories = (data.Categories || []).filter(function (c) { return c.Category; })
      .map(function (c, i) {
        return { name: c.Category, emoji: c.Emoji || '', subtitle: c.Subtitle || '', order: num(c.Order) || 100 + i };
      });
    var dishes = (data.Menu || []).filter(function (d) { return d.Name && yes(d.Available); })
      .map(function (d) {
        var options = parseOptions(d.Options);
        return {
          category: d.Category || 'Menu',
          name: d.Name,
          description: d.Description || '',
          price: num(d['Price (Rs)']) || (options[0] && options[0].price) || 0,
          options: options,
          oldPrice: num(d['Old Price (Rs)']),
          badge: d.Badge || '',
          note: d.Note || '',
          photo: photo(d['Photo URL']),
          featured: yes(d.Featured),
          selected: 0
        };
      })
      .filter(function (d) { return d.price > 0; });
    dishes.forEach(function (d, i) { d.id = i; });
    // Categories used on the Menu tab but missing from the Categories tab still get a section.
    dishes.forEach(function (d) {
      if (!categories.some(function (c) { return c.name === d.category; })) {
        categories.push({ name: d.category, emoji: '', subtitle: '', order: 1000 + categories.length });
      }
    });
    categories.sort(function (a, b) { return a.order - b.order; });
    return { dishes: dishes, categories: categories };
  }

  function load(callback) {
    var shown = false;
    function show(data) { shown = true; callback(prepare(data)); }
    var cached = cachedMenu();
    if (cached) show(cached);
    fetchSheet().then(show).catch(function () {
      if (shown) return;
      fetchText('menu-data.json').then(JSON.parse).then(show).catch(function () { callback(null); });
    });
  }

  window.HadiqMenu = { load: load, slug: slug };
})();
