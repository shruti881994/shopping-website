/* All page content (text, products, prices, images) now lives in the HTML files for SEO.
   This file only adds behaviour: cart, filters, slider, checkout and WhatsApp ordering. */
const CONFIG = {
    whatsapp: '918722827574' // <-- REPLACE with your WhatsApp business number (country code + number, no + or spaces).
    // Also replace 918722827574 inside the HTML files (search for it in your editor).
};
const $ = (s, r = document) => r.querySelector(s),
    $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => '₹' + Number(n).toLocaleString('en-IN');
const pct = (a, b) => a > 0 ? Math.round((a - b) / a * 100) : 0;
const qs = k => new URLSearchParams(location.search).get(k);
const num = t => +String(t || '').replace(/[^\d.]/g, '') || 0;
/* Reads a saree's name, prices and image from what is VISIBLE on the card / product page.
   So sorting, discount % and the cart always match the prices you see. You only need data-id (and data-cat if you like). */
function info(el) {
    const o = $('.pr b,.big', el),
        w = $('.pr s,s', el),
        h = $('h3 a,h3,h1', el),
        i = $('img', el),
        sw = $('.sw .on', el),
        c = sw ? sw.dataset.colour : '',
        t = ((h && h.textContent) || el.dataset.name || '').trim().replace(/\s+/g, ' ');
    /* with colour swatches: the cart key and name include the selected colour */
    return {
        id: el.dataset.id + (sw ? '-' + sw.dataset.key : ''),
        name: t + (c ? ' – ' + c : ''),
        colour: c,
        offer: num(o && o.textContent) || +el.dataset.offer || 0,
        price: num(w && w.textContent) || +el.dataset.price || 0,
        img: (i && i.getAttribute('src')) || el.dataset.img,
        cat: el.dataset.cat || '',
        isNew: +el.dataset.new || 0
    }
}
const getCart = () => {
    try {
        return JSON.parse(localStorage.getItem('raga_cart')) || []
    } catch (e) {
        return []
    }
};
const setCart = c => {
    try {
        localStorage.setItem('raga_cart', JSON.stringify(c))
    } catch (e) {}
    badge()
};
const totals = () => getCart().reduce((t, l) => ({
    sub: t.sub + l.price * l.qty,
    pay: t.pay + l.offer * l.qty,
    n: t.n + l.qty
}), {
    sub: 0,
    pay: 0,
    n: 0
});
const badge = () => {
    $('#bd').textContent = totals().n
};

function toast(m) {
    const t = $('#toast');
    t.textContent = m;
    t.classList.add('s');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('s'), 2200)
}
const qtyOf = id => (getCart().find(x => x.id == id) || {}).qty || 0;
/* Sets a product's cart quantity. 0 removes it from the cart. */
function setQty(el, q) {
    const d = info(el),
        was = qtyOf(d.id);
    let c = getCart();
    const l = c.find(x => x.id == d.id);
    if (q <= 0) c = c.filter(x => x.id != d.id);
    else if (l) l.qty = Math.min(20, q);
    else c.push({
        id: d.id,
        name: d.name,
        price: d.price,
        offer: d.offer,
        img: d.img,
        qty: q
    });
    setCart(c);
    sync();
    toast(q <= 0 ? 'Removed from cart' : was ? 'Cart updated' : 'Added to cart ✓')
}
/* The - qty + stepper is always visible and shows the real cart quantity (0 if not in cart).
   The Add to Cart button always stays visible too. */
function sync() {
    $$('[data-product]').forEach(el => {
        const a = $('[data-add]', el);
        if (!a) return;
        const q = qtyOf(info(el).id);
        let s = $('.qty', el);
        if (!s) {
            s = document.createElement('div');
            s.className = 'qty';
            s.innerHTML = '<button type="button" data-s="-1" aria-label="Remove one">−</button><span></span><button type="button" data-s="1" aria-label="Add one">+</button>';
            a.after(s)
        }
        $('span', s).textContent = q;
        a.hidden = false
    })
}
const wa = t => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t)}`;

/* Discount % is written in the HTML; this keeps it in sync if you edit data-price / data-offer */
$$('[data-product]').forEach(p => {
    const b = $('.js-pct', p),
        d = info(p);
    if (b && d.price > d.offer) b.textContent = pct(d.price, d.offer) + '% OFF'
});
badge();
sync();
addEventListener('pageshow', sync);
addEventListener('storage', () => {
    badge();
    sync()
});
$('#mb').onclick = () => $('#nav').classList.toggle('open');
$$('[data-note]').forEach(a => a.onclick = e => {
    e.preventDefault();
    alert(a.dataset.note)
});
document.addEventListener('click', e => {
    const s = e.target.closest('[data-s]');
    if (s) {
        const p = s.closest('[data-product]'),
            n = qtyOf(info(p).id) + +s.dataset.s;
        if (n >= 0) setQty(p, n);
        return
    }
    const a = e.target.closest('[data-add],[data-buy]');
    if (!a) return;
    const p = a.closest('[data-product]'),
        q = qtyOf(info(p).id);
    if (a.hasAttribute('data-buy')) {
        if (!q) setQty(p, 1);
        location = 'checkout.html'
    } // Buy Now: add one only if not in cart, then go to checkout
    else setQty(p, q + 1)
}); // Add to Cart: adds one more each click
const nl = $('#nlf');
if (nl) nl.onsubmit = e => {
    e.preventDefault();
    toast('Thanks! (Connect this form to your email tool)');
    nl.reset()
};

/* ---- Hero slider ---- */
if ($('.sld')) {
    const sl = $$('.sl'),
        ds = $$('.dots button');
    let i = 0,
        h;
    const go = k => {
        i = (k + sl.length) % sl.length;
        sl.forEach((x, j) => x.classList.toggle('on', j == i));
        ds.forEach((x, j) => x.classList.toggle('on', j == i));
        rs()
    };
    const rs = () => {
        clearInterval(h);
        if (!matchMedia('(prefers-reduced-motion:reduce)').matches) h = setInterval(() => go(i + 1), 6000)
    };
    ds.forEach((b, k) => b.onclick = () => go(k));
    $('.ar.l').onclick = () => go(i - 1);
    $('.ar.r').onclick = () => go(i + 1);
    $('.sld').onmouseenter = () => clearInterval(h);
    $('.sld').onmouseleave = rs;
    go(0)
}

/* ---- Shop filters (cards are already in the HTML; this only shows/hides/sorts) ---- */
if ($('#g')) {
    const g = $('#g'),
        cs = $('#cat'),
        all = $$('.card', g),
        v = x => info(x);
    const want = qs('cat');
    if (want && ![...cs.options].some(o => o.value.toLowerCase() == want.toLowerCase())) {
        const o = document.createElement('option');
        o.textContent = want;
        cs.appendChild(o)
    } // e.g. footer link ?cat=Ilkal
    cs.value = want || '';
    $('#srt').value = qs('sort') || '';
    $('#q').value = qs('q') || '';
    /* A saree matches a category if its data-cat equals it OR its visible name contains it (so "Kasuti", "Viscose Silk" etc. work) */
    const hit = (x, c) => !c || v(x).cat.toLowerCase() == c.toLowerCase() || v(x).name.toLowerCase().includes(c.toLowerCase());
    const run = () => {
        const q = $('#q').value.toLowerCase().trim(),
            c = cs.value,
            s = $('#srt').value;
        let l = [...all];
        if (s == 'new') l.sort((a, b) => v(b).isNew - v(a).isNew);
        if (s == 'lo') l.sort((a, b) => v(a).offer - v(b).offer);
        if (s == 'hi') l.sort((a, b) => v(b).offer - v(a).offer);
        if (s == 'off') l.sort((a, b) => pct(v(b).price, v(b).offer) - pct(v(a).price, v(a).offer));
        let n = 0;
        l.forEach(x => {
            const ok = hit(x, c) && v(x).name.toLowerCase().includes(q);
            x.hidden = !ok;
            n += ok;
            g.appendChild(x)
        });
        $('#none').hidden = n > 0
    };
    ['input', 'change'].forEach(e => $$('#q,#cat,#srt').forEach(x => x.addEventListener(e, run)));
    run();
    if (location.hash == '#search') $('#q').focus()
}

/* ---- Product page: thumbnails, zoom, colour swatches ---- */
if ($('#mi')) {
    const pd = $('[data-product]'),
        bind = () => $$('.th img').forEach(i => i.onclick = () => {
            $('#mm').src = i.src;
            $$('.th img').forEach(x => x.classList.remove('on'));
            i.classList.add('on')
        });
    bind();
    $$('.sw button').forEach(b => b.onclick = () => {
        $$('.sw button').forEach(x => {
            x.classList.remove('on');
            x.setAttribute('aria-pressed', 'false')
        });
        b.classList.add('on');
        b.setAttribute('aria-pressed', 'true');
        const im = b.dataset.imgs.split('|'),
            o = +b.dataset.offer,
            p = +b.dataset.price,
            nm = $('h1').textContent + ' – ' + b.dataset.colour;
        $('#mm').src = im[0];
        $('#mm').alt = nm;
        $('.th').innerHTML = im.length > 1 ? im.map((x, k) => `<img src="${x}" alt="${nm} view ${k+1}" class="${k?'':'on'}" width="72" height="90">`).join('') : '';
        bind();
        $('.big', pd).textContent = fmt(o);
        $('s', pd).textContent = fmt(p);
        $('.js-pct', pd).textContent = pct(p, o) + '% OFF';
        $('#cn').textContent = b.dataset.colour;
        sync();
        if (location.hash !== '#' + b.dataset.key) history.replaceState(null, '', '#' + b.dataset.key)
    });
    const f = $$('.sw button').find(b => b.dataset.key == location.hash.slice(1));
    if (f && !f.classList.contains('on')) f.click(); // e.g. page.html#royal-blue opens that colour
    $('#mi').onmousemove = e => {
        const r = e.currentTarget.getBoundingClientRect();
        $('#mm').style.transformOrigin = `${(e.clientX-r.left)/r.width*100}% ${(e.clientY-r.top)/r.height*100}%`
    }
}

/* ---- Cart page (user-specific, so it is rendered from localStorage) ---- */
function drawTotals() {
    const t = totals();
    $('#tSub').textContent = fmt(t.sub);
    $('#tDisc').textContent = '− ' + fmt(t.sub - t.pay);
    $('#tPay').textContent = fmt(t.pay)
}

function drawCart() {
    const c = getCart();
    $('#cartEmpty').hidden = c.length > 0;
    $('#cartFull').hidden = !c.length;
    if (!c.length) return;
    $('#lines').innerHTML = c.map(l => `<div class="ln"><img src="${l.img}" alt="${l.name}"><div><h3>${l.name}</h3><span class="pr"><b>${fmt(l.offer)}</b> <s>${fmt(l.price)}</s></span><br><small>${pct(l.price,l.offer)}% off</small></div><div><div class="qty"><button aria-label="Less" data-d="-1" data-id="${l.id}">−</button><span>${l.qty}</span><button aria-label="More" data-d="1" data-id="${l.id}">+</button></div><p><b>${fmt(l.offer*l.qty)}</b></p><a class="lnk" href="#" data-rm="${l.id}">Remove</a></div></div>`).join('');
    drawTotals()
}
if ($('#cartFull')) {
    drawCart();
    $('#lines').addEventListener('click', e => {
        const b = e.target.closest('[data-d],[data-rm]');
        if (!b) return;
        e.preventDefault();
        let c = getCart();
        if (b.dataset.rm) {
            c = c.filter(x => x.id != b.dataset.rm);
            toast('Removed from cart')
        } else {
            const l = c.find(x => x.id == b.dataset.id),
                nq = l.qty + +b.dataset.d;
            if (nq < 1) {
                c = c.filter(x => x != l);
                toast('Removed from cart')
            } else l.qty = Math.min(20, nq)
        }
        setCart(c);
        drawCart()
    })
}

/* ---- Checkout + WhatsApp order ---- */
if ($('#coFull')) {
    const c = getCart();
    $('#coEmpty').hidden = c.length > 0;
    $('#coFull').hidden = !c.length;
    if (c.length) {
        $('#coLines').innerHTML = c.map(l => `<p><span>${l.name} × ${l.qty}<br><small>${fmt(l.offer)} each</small></span><span>${fmt(l.offer*l.qty)}</span></p>`).join('');
        drawTotals()
    }
    const rules = {
        name: v => v.trim().length >= 2 || 'Enter your full name',
        mobile: v => /^[6-9]\d{9}$/.test(v) || 'Enter a valid 10-digit mobile number',
        wa: v => /^[6-9]\d{9}$/.test(v) || 'Enter a valid 10-digit WhatsApp number',
        email: v => !v || /^\S+@\S+\.\S+$/.test(v) || 'Enter a valid email',
        addr: v => v.trim().length >= 10 || 'Enter your complete address',
        city: v => v.trim().length >= 2 || 'Enter your city',
        state: v => v.trim().length >= 2 || 'Enter your state',
        pin: v => /^\d{6}$/.test(v) || 'Enter a valid 6-digit PIN code'
    };
    const chk = k => {
        const e = $('#' + k),
            r = rules[k](e.value),
            ok = r === true;
        $('#e_' + k).textContent = ok ? '' : r;
        e.classList.toggle('bad', !ok);
        return ok
    };
    Object.keys(rules).forEach(k => $('#' + k).addEventListener('blur', () => chk(k)));
    $('#f').onsubmit = e => {
        e.preventDefault();
        const bad = Object.keys(rules).filter(k => !chk(k));
        if (bad.length) {
            $('#' + bad[0]).focus();
            return
        }
        const L = getCart(),
            t = totals(),
            v = k => $('#' + k).value.trim();
        let n = +(localStorage.getItem('raga_order') || 1000) + 1;
        try {
            localStorage.setItem('raga_order', n)
        } catch (x) {}
        const id = 'RAGA' + n;
        const msg = `NEW ORDER - RAGA ILKAL SAREES\n\nOrder ID: ${id}\n\nCUSTOMER DETAILS:\nName: ${v('name')}\nPhone: ${v('mobile')}\nWhatsApp: ${v('wa')}\n${v('email')?'Email: '+v('email')+'\n':''}Address: ${v('addr')}, ${v('city')}, ${v('state')} - ${v('pin')}\n\nORDER DETAILS:\n${L.map((l,i)=>`${i+1}. ${l.name}\nQuantity: ${l.qty}\nPrice: ${fmt(l.offer)} each`).join('\n')}\n\nSubtotal: ${fmt(t.sub)}\nDiscount: ${fmt(t.sub-t.pay)}\nTotal: ${fmt(t.pay)}\n${v('ins')?'\nNotes: '+v('ins')+'\n':''}\nPlease confirm my order.`;
        const url = wa(msg);
        window.open(url, '_blank');
        $('#sent').innerHTML = `<div class="note"><b>Order ${id} is not complete yet.</b><br>WhatsApp should now be open with your order message. Please press <b>Send</b> in WhatsApp to place your order. We will confirm it with you there.<br><br><a class="btn g" href="${url}" target="_blank" rel="noopener">Open WhatsApp again</a> <button type="button" class="btn o" id="clr">I've sent it – clear cart</button></div>`;
        $('#clr').onclick = () => {
            setCart([]);
            location = 'index.html'
        }
    }
}

/* ---- Contact form ---- */
const cf = $('#cf');
if (cf) cf.onsubmit = e => {
    e.preventDefault();
    window.open(wa(`Hello, I'm ${$('#cn').value.trim()}.\n${$('#cm').value.trim()}`), '_blank')
};


/* ---- Card hover image swap: saree -> pallu -> blouse ... (first image is the main photo).
   Desktop: shows the next photo(s) while the mouse is over the card image. Phones: swipe left/right (dots show how many). ---- */
function hover(box) {
    box.onmouseenter = box.onmouseleave = box.ontouchstart = box.ontouchend = box.onclick = null;
    clearInterval(box._t);
    $$('.cd', box).forEach(x => x.remove());
    box.classList.remove('hv');
    const im = $$('img', box);
    if (im.length < 2) return;
    let i = 0,
        x0 = null;
    box.classList.add('hv');
    const dots = document.createElement('div');
    dots.className = 'cd';
    dots.innerHTML = im.map(() => '<i></i>').join('');
    box.append(dots);
    const show = k => {
        i = (k + im.length) % im.length;
        im.forEach((x, j) => x.classList.toggle('on', j == i));
        $$('i', dots).forEach((x, j) => x.classList.toggle('on', j == i))
    };
    show(0);
    box.onmouseenter = () => {
        show(1);
        if (im.length > 2) {
            clearInterval(box._t);
            box._t = setInterval(() => show(i + 1), 1200)
        }
    };
    box.onmouseleave = () => {
        clearInterval(box._t);
        show(0)
    };
    box.ontouchstart = e => {
        x0 = e.touches[0].clientX
    };
    box.ontouchend = e => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        x0 = null;
        if (Math.abs(dx) > 40) {
            show(i + (dx < 0 ? 1 : -1));
            box._sw = 1
        }
    };
    box.onclick = e => {
        if (box._sw) {
            e.preventDefault();
            box._sw = 0
        }
    }
}
$$('.im').forEach(hover);

/* ---- Colour swatches on cards: choosing a colour swaps that card's photos, price, badge and links.
   Add to Cart on the card then adds the selected colour. ---- */
document.addEventListener('click', e => {
    const b = e.target.closest('.card .sw button');
    if (!b) return;
    const c = b.closest('.card');
    $$('.sw button', c).forEach(x => {
        x.classList.remove('on');
        x.setAttribute('aria-pressed', 'false')
    });
    b.classList.add('on');
    b.setAttribute('aria-pressed', 'true');
    const o = +b.dataset.offer,
        p = +b.dataset.price,
        box = $('.im', c),
        nm = $('h3 a', c).textContent.trim();
    $$('img', box).forEach(x => x.remove());
    b.dataset.imgs.split('|').forEach((src, k) => box.insertBefore(Object.assign(document.createElement('img'), {
        src,
        alt: nm + ' – ' + b.dataset.colour + (k ? ' pallu close-up' : ''),
        loading: 'lazy',
        width: 600,
        height: 800
    }), $('.badge', box)));
    $('.pr b', c).textContent = fmt(o);
    $('.pr s', c).textContent = fmt(p);
    $('.js-pct', c).textContent = pct(p, o) + '% OFF';
    $('.cn b', c).textContent = b.dataset.colour;
    $$('a[href]', c).forEach(a => a.setAttribute('href', a.getAttribute('href').split('#')[0] + '#' + b.dataset.key)); // links open this colour on the product page
    hover(box);
    sync()
});