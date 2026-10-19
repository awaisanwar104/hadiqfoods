"""Regenerate the <main> section of menu.html from MENU below.

Run from the repo root:  python3 tools/build_menu.py
Prices come from Hadiq Foods' own online menu listings; edit them here, then re-run.
"""
import html
import re
from pathlib import Path

PIZZA_SIZES = [("Small", 650), ("Medium", 1100), ("Large", 1600), ("Extra Large", 1800), ("Family", 2800)]

# (anchor id, emoji, title, items)
# item: (name, price or [(option, price), ...], note)
MENU = [
    ("pizza-section", "🍕", "Pizza", [
        ("Hadiq Special Pizza", PIZZA_SIZES, ""),
        ("Italian Pizza", PIZZA_SIZES, ""),
        ("Supreme Pizza", PIZZA_SIZES, ""),
        ("Chicken Tikka Pizza", PIZZA_SIZES, ""),
        ("Hot & Spicy Pizza", PIZZA_SIZES, ""),
        ("Cheese Lover Pizza", PIZZA_SIZES, ""),
        ("Beef Kabab Pizza", PIZZA_SIZES, ""),
        ("Chicken Kabab Pizza", PIZZA_SIZES, ""),
    ]),
    ("burgers-section", "🍔", "Burgers", [
        ("Shami Burger", 200, ""),
        ("Zinger Burger", 460, ""),
        ("Beef Boti Burger", 460, ""),
        ("Zinger Cheese Burger", 500, ""),
        ("Double Decker Burger", 750, ""),
        ("Tower Burger", 750, ""),
        ("Zinger Jumbo Deal", 750, "With a half-litre drink"),
    ]),
    ("shawarma-section", "🌯", "Shawarma & Sandwiches", [
        ("Jumbo Shawarma", 350, ""),
        ("Hadiq Special Shawarma", 400, ""),
        ("Zinger Shawarma", 400, ""),
        ("Platter Shawarma", [("Single", 700), ("Double", 800)], ""),
        ("Hadiq Special Sandwich", 430, ""),
        ("Zinger Sandwich", 480, ""),
    ]),
    ("rolls-section", "🫔", "Paratha Rolls", [
        ("Twister Roll", 450, ""),
        ("Shapata Roll", 500, ""),
        ("Dhamaka Roll", 600, ""),
    ]),
    ("bbq-section", "🔥", "Bar-B-Q", [
        ("Chicken Boti", 190, ""),
        ("Kastori Boti with Cheese", 290, ""),
        ("Chicken Tikka Piece", [("Leg", 400), ("Breast", 400)], ""),
        ("Special BBQ Platter", 2800, ""),
    ]),
    ("karahi-section", "🥘", "Karahi & Desi", [
        ("Chicken White Karahi", 1200, "Starting price"),
        ("Chicken Tikka Masala", 1400, "Starting price"),
        ("Mutton White Karahi", 2200, "Starting price"),
        ("Bannu Beef Pulao", 500, ""),
    ]),
    ("tandoor-section", "🫓", "Naan, Sides & Drinks", [
        ("Roghni Naan", 80, ""),
        ("Raita", 130, ""),
        ("Coke (Half Litre)", 100, ""),
        ("Mineral Water (Small)", 50, ""),
    ]),
]


def rs(n):
    return f"Rs. {n:,}"


def card(name, price, note):
    e = html.escape
    if isinstance(price, list):
        opts = "".join(
            f'<option value="{e(o)}" data-price="{p}">{e(o)} – {rs(p)}</option>' for o, p in price
        )
        choose = (
            f'<select data-option aria-label="{e(name)} option" class="mt-3 w-full h-10 px-3 bg-surface-container-low '
            f'rounded-lg text-on-surface text-body-md border-0 focus:ring-2 focus:ring-primary">{opts}</select>'
        )
        shown = price[0][1]
        add = f'data-add data-name="{e(name)}"'
    else:
        choose = ""
        shown = price
        add = f'data-add data-name="{e(name)}" data-price="{price}"'
    note_html = f'<div class="text-[11px] text-on-surface-variant mt-0.5">{e(note)}</div>' if note else ""
    return (
        f'<div class="bg-surface-container-lowest p-space-md rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between" data-item>\n'
        f'<div>\n<h4 class="font-title-md text-title-md font-bold text-on-surface">{e(name)}</h4>\n{note_html}{choose}\n</div>\n'
        f'<div class="flex items-center justify-between gap-3 mt-4">\n'
        f'<span class="font-headline-sm text-headline-sm font-bold text-primary" data-price-label>{rs(shown)}</span>\n'
        f'<button type="button" {add} class="px-3 py-2 bg-primary text-on-primary font-label-md text-label-md rounded-lg shadow-sm hover:bg-primary-container transition-all flex items-center gap-1">'
        f'<span class="material-symbols-outlined text-[16px]">add</span><span>Add</span></button>\n'
        f'</div>\n</div>\n'
    )


def build():
    nav = "".join(
        f'<a class="bg-surface-container text-on-surface hover:bg-surface-container-high px-3.5 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors" href="#{sid}">'
        f'<span>{emoji}</span> {html.escape(title)} <span class="bg-surface-container-highest px-1.5 py-0.5 rounded text-[11px] text-tertiary">{len(items)}</span></a>\n'
        for sid, emoji, title, items in MENU
    )
    sections = "".join(
        f'<section class="scroll-mt-48" id="{sid}">\n'
        f'<h2 class="font-headline-md text-headline-md font-bold text-on-surface flex items-center gap-2 mb-space-md"><span>{emoji}</span> {html.escape(title)}</h2>\n'
        f'<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">\n'
        + "".join(card(*it) for it in items)
        + "</div>\n</section>\n"
        for sid, emoji, title, items in MENU
    )
    return f"""<main class="w-full pt-28 bg-background">
<!-- Menu search and category bar (generated by tools/build_menu.py) -->
<div class="sticky top-28 z-40 bg-surface/95 backdrop-blur-md shadow-sm border-b border-surface-container-high">
<div class="max-w-7xl mx-auto px-4 md:px-margin py-3 flex flex-col gap-2.5">
<div class="relative w-full sm:max-w-md">
<input class="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/70 text-body-md font-body-md pl-10 pr-4 py-2 rounded-xl border-0 focus:ring-2 focus:ring-primary shadow-inner" id="menuSearchInput" placeholder="Search pizza, burger, shawarma, karahi..." type="search"/>
<span class="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">search</span>
</div>
<nav class="flex items-center gap-2 overflow-x-auto pb-1 text-label-md font-label-md scrollbar-none" id="categoryNav">
{nav}</nav>
</div>
</div>
<div class="max-w-7xl mx-auto px-4 md:px-margin py-space-md w-full">
<div class="bg-secondary-fixed/40 rounded-2xl p-space-sm mb-space-lg flex flex-wrap items-center justify-between gap-3 text-body-md font-body-md">
<div class="flex items-center gap-2 text-on-secondary-fixed">
<span class="material-symbols-outlined text-secondary text-[22px]">shopping_bag</span>
<span>Add dishes to your cart, then send your order to us on WhatsApp. Delivery, takeaway &amp; dine-in.</span>
</div>
<a class="text-label-md font-label-md bg-primary text-on-primary px-3 py-1.5 rounded-full" href="#cart">View cart (<span data-cart-count>0</span>)</a>
</div>
<p class="text-xs text-on-surface-variant -mt-space-sm mb-space-lg">Prices may change; we confirm your final total on WhatsApp.</p>
<div class="flex flex-col gap-space-xl pb-space-xl">
{sections}</div>
</div>
<script>
  // Menu search: hide dishes and empty categories that don't match.
  document.getElementById('menuSearchInput').addEventListener('input', function (e) {{
    var q = e.target.value.toLowerCase().trim();
    document.querySelectorAll('main section').forEach(function (sec) {{
      var shown = 0;
      sec.querySelectorAll('[data-item]').forEach(function (card) {{
        var hit = !q || card.textContent.toLowerCase().indexOf(q) !== -1;
        card.style.display = hit ? '' : 'none';
        if (hit) shown++;
      }});
      sec.style.display = shown ? '' : 'none';
    }});
  }});
</script>
</main>"""


def main():
    path = Path(__file__).resolve().parent.parent / "menu.html"
    with open(path, encoding="utf-8", newline="") as f:
        s = f.read()
    s, n = re.subn(r"<main\b.*?</main>", lambda m: build(), s, flags=re.S)
    assert n == 1
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(s)
    print("menu.html:", sum(len(items) for *_, items in MENU), "dishes in", len(MENU), "categories")


if __name__ == "__main__":
    main()
