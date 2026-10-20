// Home page "Customer Favourites": four dishes from the Google Sheet (menu-source.js).
// Picks one Bestseller per category (in the Categories tab order); if fewer than four
// categories have one, the rest are filled with Featured dishes, then other dishes,
// still preferring categories not shown yet.
(function () {
  var COUNT = 4;
  var grid = document.getElementById('homeFavourites');
  var Cart = window.HadiqCart;
  if (!grid || !Cart || !window.HadiqMenu) return;
  var esc = Cart.esc, rs = Cart.rs, slug = window.HadiqMenu.slug;

  function isBestseller(d) { return /best\s*-?\s*seller/i.test(d.badge); }

  function pick(dishes, categories) {
    var picks = [], used = {};
    function take(d) { picks.push(d); used[d.category] = true; }
    function fill(test, oncePerCategory) {
      categories.forEach(function (c) {
        if (picks.length >= COUNT || (oncePerCategory && used[c.name])) return;
        var d = dishes.find(function (x) { return x.category === c.name && picks.indexOf(x) === -1 && test(x); });
        if (d) take(d);
      });
    }
    fill(isBestseller, true);
    fill(function (d) { return d.featured; }, true);
    fill(function () { return true; }, true);
    while (picks.length < COUNT) {
      var before = picks.length;
      fill(isBestseller, false);
      fill(function (d) { return d.featured; }, false);
      fill(function () { return true; }, false);
      if (picks.length === before) break;
    }
    return picks.slice(0, COUNT);
  }

  var STICKERS = ['bg-primary text-on-primary', 'bg-secondary-container text-on-secondary-container'];

  function card(d, i, emoji) {
    var hasOptions = d.options.length > 0;
    var price = hasOptions ? 'from ' + rs(Math.min.apply(null, d.options.map(function (o) { return o.price; }))) : rs(d.price);
    var tag = d.note || (hasOptions ? d.options.length + ' options' : '');
    var image = d.photo
      ? '<img alt="' + esc(d.name) + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="' + esc(d.photo) + '"/>'
      : '<div class="w-full h-full flex items-center justify-center text-stone-500"><span class="material-symbols-outlined text-[56px]">restaurant</span></div>';
    var action = hasOptions
      ? '<a href="menu.html#' + slug(d.category) + '" class="px-3 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-lg shadow-sm hover:bg-primary-container transition-all flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">tune</span><span>Choose</span></a>'
      : '<button type="button" data-add data-name="' + esc(d.name) + '" data-price="' + d.price + '" class="px-3 py-1.5 bg-primary text-on-primary font-label-md text-label-md rounded-lg shadow-sm hover:bg-primary-container transition-all flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">add</span><span>Add</span></button>';
    return '<div class="bg-surface-container-lowest rounded-2xl p-space-sm border border-outline-variant/40 shadow-[0_4px_16px_rgba(26,26,30,0.06)] flex flex-col justify-between group hover:-translate-y-1 hover:border-primary/50 transition-all relative">' +
      '<div class="absolute -top-3 left-4 ' + STICKERS[i % 2] + ' font-label-sticker text-[10px] px-2.5 py-1 rounded-md uppercase font-bold shadow-sm z-10">' + esc(d.badge || d.category) + '</div>' +
      '<div class="relative w-full h-48 bg-stone-900 rounded-xl overflow-hidden mt-1 mb-space-sm">' + image +
        (tag ? '<div class="absolute bottom-2 right-2 bg-black/75 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[11px] font-semibold">' + esc(tag) + '</div>' : '') +
      '</div>' +
      '<div class="flex flex-col flex-1 justify-between"><div>' +
        '<div class="flex items-center gap-1 mb-1 text-secondary"><span class="text-[13px]">' + esc(emoji) + '</span><span class="font-label-sticker text-[11px] font-bold uppercase">' + esc(d.category) + '</span></div>' +
        '<h3 class="font-title-md text-title-md text-on-surface leading-snug">' + esc(d.name) + '</h3>' +
        (d.description ? '<p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-1">' + esc(d.description) + '</p>' : '') +
      '</div>' +
      '<div class="mt-space-md pt-2 border-t border-outline-variant/20 flex items-center justify-between gap-2">' +
        '<span class="font-headline-sm text-headline-sm text-primary font-bold">' + price + '</span>' + action +
      '</div></div></div>';
  }

  window.HadiqMenu.load(function (menu) {
    if (!menu || !menu.dishes.length) {
      grid.innerHTML = '<div class="col-span-full py-10 text-center text-on-surface-variant">See all our dishes on the <a class="text-primary font-bold" href="menu.html">menu</a>.</div>';
      return;
    }
    var emojis = {};
    menu.categories.forEach(function (c) { emojis[c.name] = c.emoji; });
    grid.innerHTML = pick(menu.dishes, menu.categories).map(function (d, i) { return card(d, i, emojis[d.category] || ''); }).join('');
  });
})();
