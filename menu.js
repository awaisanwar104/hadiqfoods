// Makes the approved menu.html design interactive on top of cart.js:
// Add buttons, portion toggles, filter chips and the "Your Feast" summary panel.
(function () {
  var Cart = window.HadiqCart;
  if (!Cart) return;

  var left = document.querySelector('.lg\\:col-span-8');
  var TOGGLE_ON = ['bg-inverse-surface', 'text-inverse-on-surface', 'font-semibold', 'shadow-xs'];
  var TOGGLE_OFF = ['text-on-surface-variant', 'hover:text-on-surface'];
  // Price multipliers for portion options; anything not listed uses the card's price.
  var PORTION_FACTOR = { '1.0 kg': 2 };

  // A dish card is the nearest ancestor holding both the dish name and its button(s).
  function cardOf(el) {
    while (el && el !== left && !(el.querySelector('h3, h4') && el.querySelector('button'))) el = el.parentElement;
    return el === left ? null : el;
  }
  function listedPrice(card) {
    var walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    for (var n = walker.nextNode(); n; n = walker.nextNode()) {
      var m = n.nodeValue.match(/Rs\.\s?([\d,]+)/);
      if (m && !n.parentElement.closest('.line-through')) return { node: n, value: Number(m[1].replace(/,/g, '')) };
    }
    return null;
  }
  function toggleGroup(card) {
    var btns = Array.prototype.filter.call(card.querySelectorAll('button'), function (b) {
      return /^(Half kg|1\.0 kg|Single|Double Smash)$/.test(b.textContent.trim());
    });
    return btns.length ? btns : null;
  }
  function selected(group) {
    return group.find(function (b) { return b.classList.contains('bg-inverse-surface'); }) || group[0];
  }

  // Remember each card's base price so portion changes can update the label.
  left.querySelectorAll('h3, h4').forEach(function (h) {
    var card = cardOf(h);
    var p = listedPrice(card);
    if (p) card.dataset.basePrice = p.value;
  });

  // Karahi cards list both portions ("Half kg / 1.0 kg · Rs. 980 | Rs. 1,850"):
  // tapping the price block switches which portion is selected and shown large.
  left.querySelectorAll('span').forEach(function (label) {
    if (label.textContent.trim().toLowerCase() !== 'half kg / 1.0 kg') return;
    var block = label.parentElement;
    var price = block.querySelector('span.font-bold.text-primary');
    var m = price && price.textContent.match(/Rs\.\s?([\d,]+)\s*\|\s*Rs\.\s?([\d,]+)/);
    if (!m) return;
    var portions = [['Half kg', Number(m[1].replace(/,/g, ''))], ['1.0 kg', Number(m[2].replace(/,/g, ''))]];
    var card = cardOf(block);
    card.dataset.portion = '0';
    block.style.cursor = 'pointer';
    block.title = 'Tap to switch between Half kg and 1.0 kg';
    function show() {
      var i = Number(card.dataset.portion), sel = portions[i], other = portions[1 - i];
      label.innerHTML = i ? 'Half kg / <u>1.0 kg</u>' : '<u>Half kg</u> / 1.0 kg';
      price.firstChild.nodeValue = Cart.rs(sel[1]) + ' ';
      price.querySelector('span').textContent = '| ' + Cart.rs(other[1]);
    }
    block.addEventListener('click', function () { card.dataset.portion = String(1 - Number(card.dataset.portion)); show(); });
    card.portions = portions;
    show();
  });

  left.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn || !left.contains(btn)) return;
    var card = cardOf(btn);
    if (!card) return;
    var group = toggleGroup(card);

    // Portion / patty toggle
    if (group && group.indexOf(btn) !== -1) {
      group.forEach(function (b) {
        TOGGLE_ON.forEach(function (c) { b.classList.toggle(c, b === btn); });
        TOGGLE_OFF.forEach(function (c) { b.classList.toggle(c, b !== btn); });
      });
      var p = listedPrice(card);
      var price = Number(card.dataset.basePrice) * (PORTION_FACTOR[btn.textContent.trim()] || 1);
      if (p) p.node.nodeValue = p.node.nodeValue.replace(/Rs\.\s?[\d,]+/, Cart.rs(price));
      var unit = p && p.node.parentElement.querySelector('span');
      if (unit && /kg/.test(unit.textContent)) unit.textContent = btn.textContent.trim() === '1.0 kg' ? '/ 1kg' : '/ 0.5kg';
      return;
    }

    // Any other button in a dish card adds that dish
    var name = card.querySelector('h3, h4').textContent.trim();
    var base = Number(card.dataset.basePrice);
    if (!base) return;
    if (card.portions) {
      var sel = card.portions[Number(card.dataset.portion)];
      Cart.add(name, sel[1], sel[0]);
    } else if (group) {
      var opt = selected(group).textContent.trim();
      Cart.add(name, base * (PORTION_FACTOR[opt] || 1), opt);
    } else {
      Cart.add(name, base);
    }
  });

  // Filter chips: All / Halal show everything; Spicy = BBQ & karahi; Midnight = deals & fast food.
  var chips = Array.prototype.slice.call(document.querySelectorAll('.sticky button')).slice(0, 4);
  var CHIP_ON = ['bg-primary', 'text-on-primary', 'shadow-sm'];
  var CHIP_OFF = ['bg-surface-container', 'text-on-surface', 'hover:bg-surface-container-high'];
  var FILTERS = [null, null, ['bbq-section', 'karahi-section'], ['deals-section', 'burgers-section']];
  chips.forEach(function (chip, i) {
    chip.type = 'button';
    chip.addEventListener('click', function () {
      chips.forEach(function (c) {
        CHIP_ON.forEach(function (k) { c.classList.toggle(k, c === chip); });
        CHIP_OFF.forEach(function (k) { c.classList.toggle(k, c !== chip); });
      });
      left.querySelectorAll(':scope > section').forEach(function (sec) {
        sec.style.display = !FILTERS[i] || FILTERS[i].indexOf(sec.id) !== -1 ? '' : 'none';
      });
      window.scrollTo({ top: left.getBoundingClientRect().top + window.scrollY - 230, behavior: 'smooth' });
    });
  });

  // "Your Feast" panel
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
    subEl.textContent = Cart.rs(Cart.total());
    totalEl.textContent = Cart.rs(Cart.total());
    if (!lines.length) {
      items.innerHTML = '<div class="py-6 text-center text-body-md text-on-surface-variant">Your cart is empty — tap <strong>Add</strong> on any dish.</div>';
      return;
    }
    items.innerHTML = lines.map(function (l) {
      var id = Cart.esc(l.id);
      return '<div class="py-3 flex items-start justify-between gap-2"><div class="flex-1">' +
        '<div class="font-label-md text-label-md font-bold text-on-surface">' + id + '</div>' +
        '<div class="text-[12px] text-tertiary">' + l.qty + ' × ' + Cart.rs(l.price) + '</div>' +
        '<div class="text-label-md font-label-md font-bold text-primary mt-1">' + Cart.rs(l.qty * l.price) + '</div></div>' +
        '<div class="flex items-center bg-surface-container rounded-lg p-1 gap-2 flex-shrink-0">' +
        '<button type="button" data-qty="-1" data-id="' + id + '" aria-label="Remove one" class="w-6 h-6 flex items-center justify-center text-on-surface hover:bg-surface-container-highest rounded text-sm font-bold">−</button>' +
        '<span class="text-label-md font-label-md font-bold w-4 text-center">' + l.qty + '</span>' +
        '<button type="button" data-qty="1" data-id="' + id + '" aria-label="Add one" class="w-6 h-6 flex items-center justify-center text-on-surface hover:bg-surface-container-highest rounded text-sm font-bold">+</button>' +
        '</div></div>';
    }).join('');
  }
  function renderAddress() {
    addrEl.textContent = Cart.form.address || 'Add your address';
  }

  document.querySelector('[data-feast-change]').addEventListener('click', function () {
    var a = window.prompt('Delivery address', Cart.form.address);
    if (a !== null) { Cart.form.address = a.trim(); Cart.form.type = 'Delivery'; renderAddress(); }
  });
  note.addEventListener('input', function () { Cart.form.notes = note.value; });

  document.addEventListener('hadiq:cart', renderFeast);
  renderFeast();
  renderAddress();
})();
