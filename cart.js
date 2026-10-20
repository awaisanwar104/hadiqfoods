// Hadiq Foods cart: kept in this browser (localStorage); checkout sends the order on WhatsApp.
//
// Add buttons:  <button data-add data-name="Zinger Burger" data-price="460">
// With options: wrap the card in [data-item] containing <select data-option>, where each
//               <option value="Small" data-price="650"> sets the price; [data-price-label]
//               in the same card shows the selected price.
// Cart links:   any a[href="#cart"] or [data-open-cart] opens the cart; [data-cart-count] shows the count.
// Cart bar:     a floating "View order" bar shows at the bottom of every page while the cart has items.
// Open status:  [data-open-status] shows Open now / Closed for 11 AM – 4 AM Lahore time.
(function () {
  var WHATSAPP = '923000341185';
  var KEY = 'hadiq_cart_v1';
  var OPEN_HOUR = 11, CLOSE_HOUR = 4; // 11 AM to 4 AM next day, Pakistan time (UTC+5)

  var cart = load();

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
    render();
    document.dispatchEvent(new CustomEvent('hadiq:cart'));
  }
  function rs(n) { return 'Rs. ' + Number(n).toLocaleString('en-PK'); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function count() { return cart.reduce(function (n, l) { return n + l.qty; }, 0); }
  function total() { return cart.reduce(function (n, l) { return n + l.qty * l.price; }, 0); }

  function add(name, price, option) {
    var id = option ? name + ' (' + option + ')' : name;
    var line = cart.find(function (l) { return l.id === id; });
    if (line) line.qty++;
    else cart.push({ id: id, price: price, qty: 1 });
    save();
    toast(id + ' added to cart');
    bump();
  }
  function setQty(id, qty) {
    cart = cart.map(function (l) { return l.id === id ? { id: l.id, price: l.price, qty: qty } : l; })
               .filter(function (l) { return l.qty > 0; });
    save();
  }

  // ---------- Drawer ----------
  var drawer = document.createElement('div');
  drawer.innerHTML =
    '<div data-cart-overlay class="fixed inset-0 bg-black/40 z-[60]" style="display:none"></div>' +
    '<aside data-cart-panel aria-label="Your order" class="fixed top-0 right-0 h-full w-full max-w-md bg-surface z-[61] shadow-2xl flex flex-col" style="transform:translateX(100%);visibility:hidden;transition:transform .3s,visibility .3s">' +
      '<div class="flex items-center justify-between px-5 py-4 border-b border-surface-container-high">' +
        '<h2 class="font-headline-sm text-headline-sm font-bold text-on-surface">Your Order</h2>' +
        '<button type="button" data-cart-close aria-label="Close cart" class="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center"><span class="material-symbols-outlined">close</span></button>' +
      '</div>' +
      '<div data-cart-body class="flex-1 overflow-y-auto px-5 py-4"></div>' +
    '</aside>' +
    '<div data-cart-toast class="fixed left-1/2 -translate-x-1/2 z-[70] bg-on-surface text-surface px-4 py-2.5 rounded-xl shadow-lg text-body-md" style="display:none;bottom:calc(92px + env(safe-area-inset-bottom))"></div>' +
    '<button type="button" data-open-cart data-cart-bar aria-label="View your order" class="fixed z-[55] bg-primary text-on-primary rounded-2xl px-4 py-3 items-center justify-between gap-3 shadow-[0_10px_30px_rgba(160,0,15,0.4)] hover:bg-primary-container transition-colors" style="display:none;left:16px;right:16px;margin:0 auto;max-width:28rem;bottom:calc(16px + env(safe-area-inset-bottom))">' +
      '<span class="flex items-center gap-3">' +
        '<span class="relative flex"><span class="material-symbols-outlined text-[26px]">shopping_bag</span>' +
        '<span data-cart-count class="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold flex items-center justify-center">0</span></span>' +
        '<span class="text-left leading-tight"><span data-bar-items class="block font-label-lg text-label-lg"></span><span data-bar-total class="block text-xs opacity-90"></span></span>' +
      '</span>' +
      '<span class="flex items-center gap-1 font-label-lg text-label-lg">View order <span class="material-symbols-outlined text-[20px]">arrow_forward</span></span>' +
    '</button>';
  document.body.appendChild(drawer);

  var overlay = drawer.querySelector('[data-cart-overlay]');
  var panel = drawer.querySelector('[data-cart-panel]');
  var body = drawer.querySelector('[data-cart-body]');
  var toastEl = drawer.querySelector('[data-cart-toast]');
  var bar = drawer.querySelector('[data-cart-bar]');
  var form = { name: '', phone: '', type: 'Delivery', address: '', notes: '' };

  function open() {
    render(); // pick up address/notes entered elsewhere on the page
    overlay.style.display = 'block';
    panel.style.transform = 'none';
    panel.style.visibility = 'visible';
    document.body.style.overflow = 'hidden';
  }
  function close() {
    overlay.style.display = 'none';
    panel.style.transform = 'translateX(100%)';
    panel.style.visibility = 'hidden';
    document.body.style.overflow = '';
  }

  // Small "bump" on the cart bar and header badge so customers see the dish was added.
  function bump() {
    if (!bar.animate) return;
    bar.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
    document.querySelectorAll('header [data-cart-count]').forEach(function (el) {
      el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
    });
  }

  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.style.display = 'none'; }, 1800);
  }

  var field = 'w-full px-3 py-2.5 bg-surface-container-low rounded-lg text-on-surface text-body-md border-0 focus:ring-2 focus:ring-primary';

  function render() {
    var n = count();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) { el.textContent = n; });
    bar.style.display = n ? 'flex' : 'none';
    bar.querySelector('[data-bar-items]').textContent = n + (n === 1 ? ' item' : ' items');
    bar.querySelector('[data-bar-total]').textContent = rs(total());
    document.body.style.paddingBottom = n ? '88px' : ''; // keep the footer clear of the bar

    if (!cart.length) {
      body.innerHTML =
        '<div class="h-full flex flex-col items-center justify-center text-center gap-3 py-16">' +
          '<span class="material-symbols-outlined text-[48px] text-outline">shopping_bag</span>' +
          '<p class="text-body-lg text-on-surface-variant">Your cart is empty.</p>' +
          '<a href="menu.html" class="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-label-lg text-label-lg">Browse the menu</a>' +
        '</div>';
      return;
    }

    var lines = cart.map(function (l) {
      return '<li class="flex items-center justify-between gap-3 py-3 border-b border-surface-container-high">' +
        '<div class="min-w-0"><div class="font-label-lg text-label-lg text-on-surface">' + esc(l.id) + '</div>' +
        '<div class="text-xs text-on-surface-variant">' + rs(l.price) + ' each</div></div>' +
        '<div class="flex items-center gap-2 flex-shrink-0">' +
          '<button type="button" data-qty="-1" data-id="' + esc(l.id) + '" aria-label="Remove one" class="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high font-bold">−</button>' +
          '<span class="w-6 text-center font-bold">' + l.qty + '</span>' +
          '<button type="button" data-qty="1" data-id="' + esc(l.id) + '" aria-label="Add one" class="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high font-bold">+</button>' +
        '</div></li>';
    }).join('');

    var types = ['Delivery', 'Takeaway', 'Dine-in'].map(function (t) {
      return '<label class="flex-1"><input type="radio" name="hf-type" value="' + t + '" class="peer sr-only"' + (form.type === t ? ' checked' : '') + '>' +
        '<span class="block text-center px-2 py-2 rounded-lg bg-surface-container text-on-surface text-label-lg font-label-lg cursor-pointer peer-checked:bg-primary peer-checked:text-on-primary">' + t + '</span></label>';
    }).join('');

    body.innerHTML =
      '<ul>' + lines + '</ul>' +
      '<div class="flex items-center justify-between py-4"><span class="font-title-md text-title-md text-on-surface">Total</span>' +
      '<span class="font-headline-sm text-headline-sm font-bold text-primary">' + rs(total()) + '</span></div>' +
      '<p class="text-xs text-on-surface-variant -mt-2 mb-4">Prices as listed on our menu. We confirm your final total (and any delivery charge) on WhatsApp.</p>' +
      '<form data-cart-form class="flex flex-col gap-3">' +
        '<div class="flex gap-2">' + types + '</div>' +
        '<input class="' + field + '" name="name" required placeholder="Your name" value="' + esc(form.name) + '">' +
        '<input class="' + field + '" name="phone" required type="tel" placeholder="Phone number" value="' + esc(form.phone) + '">' +
        '<textarea class="' + field + (form.type === 'Delivery' ? '' : ' hidden') + '" name="address" rows="2" placeholder="Delivery address"' + (form.type === 'Delivery' ? ' required' : '') + '>' + esc(form.address) + '</textarea>' +
        '<textarea class="' + field + '" name="notes" rows="2" placeholder="Notes (optional)">' + esc(form.notes) + '</textarea>' +
        '<button type="submit" class="w-full py-3 bg-[#25D366] hover:brightness-105 text-white rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md">' +
          '<span class="material-symbols-outlined text-[20px]">send</span> Send Order on WhatsApp</button>' +
        '<button type="button" data-cart-clear class="text-xs text-on-surface-variant underline self-center">Clear cart</button>' +
      '</form>';
  }

  function checkout() {
    var msg = ['Hello Hadiq Foods! I would like to place an order:', ''];
    cart.forEach(function (l) { msg.push(l.qty + ' x ' + l.id + ' = ' + rs(l.qty * l.price)); });
    msg.push('', 'Total: ' + rs(total()), '', 'Order type: ' + form.type, 'Name: ' + form.name, 'Phone: ' + form.phone);
    if (form.type === 'Delivery') msg.push('Address: ' + form.address);
    if (form.notes) msg.push('Notes: ' + form.notes);
    window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg.join('\n')), '_blank');
    toast('WhatsApp opened — press send to place your order');
  }

  // ---------- Events ----------
  document.addEventListener('click', function (e) {
    var t = e.target;
    var addBtn = t.closest('[data-add]');
    if (addBtn) {
      var item = addBtn.closest('[data-item]');
      var sel = item && item.querySelector('select[data-option]');
      if (sel) {
        var opt = sel.options[sel.selectedIndex];
        add(addBtn.dataset.name, Number(opt.dataset.price), opt.value);
      } else {
        add(addBtn.dataset.name, Number(addBtn.dataset.price));
      }
      return;
    }
    if (t.closest('a[href="#cart"], [data-open-cart]')) { e.preventDefault(); open(); return; }
    if (t.closest('[data-cart-close]') || t === overlay) { close(); return; }
    var q = t.closest('[data-qty]');
    if (q) {
      var line = cart.find(function (l) { return l.id === q.dataset.id; });
      if (line) setQty(line.id, line.qty + Number(q.dataset.qty));
      return;
    }
    if (t.closest('[data-cart-clear]')) { cart = []; save(); }
  });

  document.addEventListener('change', function (e) {
    var sel = e.target.closest('select[data-option]');
    if (sel) {
      var label = sel.closest('[data-item]').querySelector('[data-price-label]');
      if (label) label.textContent = rs(sel.options[sel.selectedIndex].dataset.price);
    }
    if (e.target.name === 'hf-type') { form.type = e.target.value; render(); }
  });

  body.addEventListener('input', function (e) {
    if (e.target.name in form) form[e.target.name] = e.target.value;
  });
  body.addEventListener('submit', function (e) {
    e.preventDefault();
    checkout();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  // ---------- Open / closed badge ----------
  function isOpen() {
    var now = new Date();
    var h = (now.getUTCHours() + 5) % 24; // Pakistan Standard Time, no DST
    return h >= OPEN_HOUR || h < CLOSE_HOUR;
  }
  document.querySelectorAll('[data-open-status]').forEach(function (el) {
    var open = isOpen();
    el.innerHTML = '<span class="w-2 h-2 rounded-full ' + (open ? 'bg-emerald-600 animate-pulse' : 'bg-stone-400') + '"></span> ' + (open ? 'Open Now' : 'Closed · opens 11 AM');
    el.className = 'inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ' +
      (open ? 'text-emerald-700 bg-emerald-50' : 'text-stone-600 bg-stone-100');
  });

  // Used by pages with their own cart summary (menu.html's "Your Feast" panel).
  window.HadiqCart = {
    items: function () { return cart.slice(); },
    add: add,
    setQty: setQty,
    count: count,
    total: total,
    form: form,
    open: open,
    rs: rs,
    esc: esc
  };

  render();
  if (location.hash === '#cart') open();
})();
