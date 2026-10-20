// Menu page: renders the dishes from the Google Sheet (menu-source.js) in the approved menu
// design, then wires them to the cart (cart.js).
(function () {
  var Cart = window.HadiqCart;
  var root = document.getElementById('menuRoot');
  var nav = document.getElementById('categoryNav');
  var search = document.getElementById('menuSearchInput');
  if (!Cart || !root || !window.HadiqMenu) return;

  var esc = Cart.esc, rs = Cart.rs;
  var dishes = [], categories = [];
  var filter = 0, query = '';

  var slug = window.HadiqMenu.slug;

  // ---------- Rendering (markup follows the approved design) ----------
  var TOGGLE_ON = 'bg-inverse-surface text-inverse-on-surface font-semibold shadow-xs';
  var TOGGLE_OFF = 'text-on-surface-variant hover:text-on-surface';

  function priceOf(d) { return d.options.length ? d.options[d.selected].price : d.price; }

  function toggles(d) {
    if (!d.options.length) return '';
    return '<div class="flex flex-wrap items-center bg-surface-container-lowest rounded-lg p-0.5 text-label-sm font-label-sm gap-0.5">' +
      d.options.map(function (o, i) {
        return '<button type="button" data-opt="' + i + '" class="px-2.5 py-1 rounded-md ' + (i === d.selected ? TOGGLE_ON : TOGGLE_OFF) + '">' + esc(o.label) + '</button>';
      }).join('') + '</div>';
  }
  function placeholder(size) {
    return '<div class="w-full h-full flex items-center justify-center text-outline"><span class="material-symbols-outlined ' + size + '">restaurant</span></div>';
  }
  function img(d, cls, size) {
    return d.photo
      ? '<img alt="' + esc(d.name) + '" class="' + cls + '" loading="lazy" src="' + esc(d.photo) + '" onerror="this.outerHTML=\'' + placeholder(size).replace(/"/g, '&quot;') + '\'"/>'
      : placeholder(size);
  }
  function oldPrice(d) {
    return d.oldPrice > priceOf(d) ? '<span class="line-through text-on-surface-variant/70 text-body-md">' + rs(d.oldPrice) + '</span>' : '';
  }

  function featuredCard(d) {
    return '<div class="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group" data-dish="' + d.id + '">' +
      '<div class="relative h-56 w-full overflow-hidden bg-surface-container">' +
        img(d, 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500', 'text-[48px]') +
        (d.badge ? '<div class="absolute top-3 left-3"><span class="bg-primary text-on-primary text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">' + esc(d.badge) + '</span></div>' : '') +
        (d.note ? '<div class="absolute bottom-3 right-3 bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-label-sm font-label-sm text-on-surface font-bold shadow-sm">' + esc(d.note) + '</div>' : '') +
      '</div>' +
      '<div class="p-space-md flex flex-col flex-1 justify-between"><div>' +
        '<div class="flex items-center justify-between gap-3"><h3 class="font-title-md text-title-md font-bold text-on-surface">' + esc(d.name) + '</h3>' +
        '<span class="text-label-md font-label-md text-primary font-bold whitespace-nowrap" data-price>' + rs(priceOf(d)) + '</span></div>' +
        (d.description ? '<p class="font-body-md text-body-md text-on-surface-variant mt-1.5 leading-relaxed">' + esc(d.description) + '</p>' : '') +
      '</div>' +
      '<div class="mt-space-md pt-space-sm bg-surface-container-low p-2.5 rounded-xl flex items-center justify-between gap-2">' +
        (toggles(d) || '<span>' + oldPrice(d) + '</span>') +
        '<button type="button" data-add-dish class="bg-primary text-on-primary px-3.5 py-2 rounded-lg font-label-md text-label-md flex items-center gap-1.5 shadow-sm hover:bg-primary-container active:scale-95 transition-all flex-shrink-0"><span class="material-symbols-outlined text-[18px]">add</span> Add to Order</button>' +
      '</div></div></div>';
  }

  function dishCard(d) {
    return '<div class="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm hover:shadow-md transition-shadow flex gap-space-md justify-between items-start" data-dish="' + d.id + '">' +
      '<div class="flex-1 min-w-0">' +
        '<h4 class="font-title-md text-title-md font-bold text-on-surface">' + esc(d.name) + '</h4>' +
        (d.description ? '<p class="font-body-md text-body-md text-on-surface-variant mt-1 line-clamp-2">' + esc(d.description) + '</p>' : '') +
        (d.options.length ? '<div class="mt-2.5 bg-surface-container-low p-1 rounded-lg w-fit max-w-full">' + toggles(d) + '</div>' : '') +
        '<div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">' +
          '<span class="font-headline-sm text-headline-sm font-bold text-primary" data-price>' + rs(priceOf(d)) + '</span>' + oldPrice(d) +
          (d.note ? '<span class="text-[11px] font-semibold bg-surface-container text-tertiary px-2 py-0.5 rounded">' + esc(d.note) + '</span>' : '') +
          (d.badge ? '<span class="text-[11px] font-semibold bg-secondary-container/30 text-on-secondary-container px-2 py-0.5 rounded">' + esc(d.badge) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="flex flex-col items-end gap-3 flex-shrink-0">' +
        '<div class="w-20 h-20 rounded-xl overflow-hidden bg-surface-container">' + img(d, 'w-full h-full object-cover', 'text-[28px]') + '</div>' +
        '<button type="button" data-add-dish aria-label="Add ' + esc(d.name) + '" class="bg-surface-container text-on-surface hover:bg-primary hover:text-on-primary w-9 h-9 rounded-xl flex items-center justify-center transition-colors shadow-xs"><span class="material-symbols-outlined text-[20px]">add</span></button>' +
      '</div></div>';
  }

  function sectionHead(kicker, title, right) {
    return '<div class="flex items-center justify-between mb-space-sm gap-3"><div>' +
      (kicker ? '<span class="text-label-sm font-label-sm uppercase tracking-wider text-secondary font-bold">' + esc(kicker) + '</span>' : '') +
      '<h2 class="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">' + title + '</h2></div>' +
      (right ? '<span class="text-label-sm font-label-sm text-tertiary whitespace-nowrap">' + esc(right) + '</span>' : '') + '</div>';
  }

  var SPICY = /spic|hot|chil|karahi|b-?b-?q|tikka|boti|masala/i;
  var MIDNIGHT = /deal|combo|midnight|late|platter/i;
  function matches(d) {
    var text = [d.name, d.description, d.badge, d.note, d.category].join(' ');
    if (query && text.toLowerCase().indexOf(query) === -1) return false;
    if (filter === 2) return SPICY.test(text);
    if (filter === 3) return MIDNIGHT.test(text);
    return true;
  }

  function render() {
    var shown = dishes.filter(matches);
    var html = '';
    var featured = shown.filter(function (d) { return d.featured; });
    if (featured.length && !query && filter < 2) {
      html += '<section class="scroll-mt-48" id="featured-section">' +
        sectionHead('Chef\'s Signature', 'Featured Favourites', '') +
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-space-md mt-space-sm">' + featured.map(featuredCard).join('') + '</div></section>';
    }
    categories.forEach(function (c) {
      var list = shown.filter(function (d) { return d.category === c.name && !(d.featured && !query && filter < 2); });
      if (!list.length) return;
      html += '<section class="scroll-mt-48" id="' + slug(c.name) + '">' +
        sectionHead(c.subtitle, (c.emoji ? c.emoji + ' ' : '') + esc(c.name), list.length + (list.length === 1 ? ' item' : ' items')) +
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-space-md mt-space-sm">' + list.map(dishCard).join('') + '</div></section>';
    });
    root.innerHTML = html || '<div class="py-16 text-center text-on-surface-variant">No dishes match. Try a different search or filter.</div>';
  }

  var NAV_ON = 'bg-inverse-surface text-inverse-on-surface px-4 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap shadow-sm';
  var NAV_OFF = 'bg-surface-container text-on-surface hover:bg-surface-container-high px-3.5 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors';
  function renderNav() {
    if (!nav) return;
    var links = [];
    if (dishes.some(function (d) { return d.featured; })) links.push(['featured-section', '⚡', 'Featured', 0]);
    categories.forEach(function (c) {
      var n = dishes.filter(function (d) { return d.category === c.name && !d.featured; }).length;
      if (n) links.push([slug(c.name), c.emoji, c.name, n]);
    });
    nav.innerHTML = links.map(function (l, i) {
      return '<a class="' + (i ? NAV_OFF : NAV_ON) + '" href="#' + l[0] + '">' + (l[1] ? '<span>' + l[1] + '</span> ' : '') + esc(l[2]) +
        (l[3] ? ' <span class="bg-surface-container-highest px-1.5 py-0.5 rounded text-[11px] text-tertiary">' + l[3] + '</span>' : '') + '</a>';
    }).join('');
  }
  if (nav) nav.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    nav.querySelectorAll('a').forEach(function (x) { x.className = x === a ? NAV_ON : NAV_OFF; });
  });

  // ---------- Interaction ----------
  root.addEventListener('click', function (e) {
    var card = e.target.closest('[data-dish]');
    if (!card) return;
    var d = dishes[Number(card.dataset.dish)];
    var opt = e.target.closest('[data-opt]');
    if (opt) {
      d.selected = Number(opt.dataset.opt);
      card.querySelectorAll('[data-opt]').forEach(function (b) {
        b.className = 'px-2.5 py-1 rounded-md ' + (Number(b.dataset.opt) === d.selected ? TOGGLE_ON : TOGGLE_OFF);
      });
      card.querySelector('[data-price]').textContent = rs(priceOf(d));
      return;
    }
    if (e.target.closest('[data-add-dish]')) {
      Cart.add(d.name, priceOf(d), d.options.length ? d.options[d.selected].label : undefined);
    }
  });

  if (search) search.addEventListener('input', function () {
    query = search.value.toLowerCase().trim();
    render();
  });

  // Filter chips: All / Halal show everything; Spicy = BBQ, karahi & spicy dishes; Midnight Deals = deals & combos.
  var chips = Array.prototype.slice.call(document.querySelectorAll('.sticky button')).slice(0, 4);
  var CHIP_ON = ['bg-primary', 'text-on-primary', 'shadow-sm'];
  var CHIP_OFF = ['bg-surface-container', 'text-on-surface', 'hover:bg-surface-container-high'];
  chips.forEach(function (chip, i) {
    chip.type = 'button';
    chip.addEventListener('click', function () {
      chips.forEach(function (c) {
        CHIP_ON.forEach(function (k) { c.classList.toggle(k, c === chip); });
        CHIP_OFF.forEach(function (k) { c.classList.toggle(k, c !== chip); });
      });
      filter = i;
      render();
      window.scrollTo({ top: root.getBoundingClientRect().top + window.scrollY - 230, behavior: 'smooth' });
    });
  });

  // ---------- "Your Feast" panel ----------
  var items = document.querySelector('[data-feast-items]');
  var countEl = document.querySelector('[data-feast-count]');
  var subEl = document.querySelector('[data-feast-subtotal]');
  var totalEl = document.querySelector('[data-feast-total]');
  var fees = document.querySelectorAll('[data-feast-fee]');
  var addrEl = document.querySelector('[data-feast-address]');
  var note = document.querySelector('[data-feast-note]');

  // Delivery charges aren't fixed, so they are confirmed on WhatsApp rather than added here.
  if (fees[0]) fees[0].textContent = 'Confirmed on WhatsApp';
  if (fees[1]) fees[1].parentElement.style.display = 'none';

  function renderFeast() {
    var lines = Cart.items();
    var n = Cart.count();
    countEl.textContent = n + (n === 1 ? ' Item' : ' Items');
    subEl.textContent = rs(Cart.total());
    totalEl.textContent = rs(Cart.total());
    if (!lines.length) {
      items.innerHTML = '<div class="py-6 text-center text-body-md text-on-surface-variant">Your cart is empty — tap <strong>Add</strong> on any dish.</div>';
      return;
    }
    items.innerHTML = lines.map(function (l) {
      var id = esc(l.id);
      return '<div class="py-3 flex items-start justify-between gap-2"><div class="flex-1">' +
        '<div class="font-label-md text-label-md font-bold text-on-surface">' + id + '</div>' +
        '<div class="text-[12px] text-tertiary">' + l.qty + ' × ' + rs(l.price) + '</div>' +
        '<div class="text-label-md font-label-md font-bold text-primary mt-1">' + rs(l.qty * l.price) + '</div></div>' +
        '<div class="flex items-center bg-surface-container rounded-lg p-1 gap-2 flex-shrink-0">' +
        '<button type="button" data-qty="-1" data-id="' + id + '" aria-label="Remove one" class="w-6 h-6 flex items-center justify-center text-on-surface hover:bg-surface-container-highest rounded text-sm font-bold">−</button>' +
        '<span class="text-label-md font-label-md font-bold w-4 text-center">' + l.qty + '</span>' +
        '<button type="button" data-qty="1" data-id="' + id + '" aria-label="Add one" class="w-6 h-6 flex items-center justify-center text-on-surface hover:bg-surface-container-highest rounded text-sm font-bold">+</button>' +
        '</div></div>';
    }).join('');
  }
  function renderAddress() { addrEl.textContent = Cart.form.address || 'Add your address'; }

  document.querySelector('[data-feast-change]').addEventListener('click', function () {
    var a = window.prompt('Delivery address', Cart.form.address);
    if (a !== null) { Cart.form.address = a.trim(); Cart.form.type = 'Delivery'; renderAddress(); }
  });
  note.addEventListener('input', function () { Cart.form.notes = note.value; });
  document.addEventListener('hadiq:cart', renderFeast);
  renderFeast();
  renderAddress();

  // ---------- Go ----------
  var jumped = false;
  // The skeleton loader in menu.html stays until the first render.
  window.HadiqMenu.load(function (menu) {
    if (!menu) {
      root.innerHTML = '<div class="py-16 text-center text-on-surface-variant">Sorry, the menu could not be loaded. Please refresh, or order on WhatsApp: <a class="text-primary font-bold" href="https://wa.me/923000341185">0300-0341185</a>.</div>';
      if (nav) nav.innerHTML = '';
      return;
    }
    dishes = menu.dishes;
    categories = menu.categories;
    renderNav();
    render();
    // Links like menu.html#cat-pizza: sections only exist now, so jump to it after the first render.
    var target = !jumped && location.hash && document.getElementById(location.hash.slice(1));
    if (target) target.scrollIntoView();
    jumped = true;
  });
})();
