/* =========================================================
   RISING TOWER
   A tower that is constructed floor-by-floor as the visitor
   scrolls. Every <section data-floor="Label"> becomes one floor.
   A crane hoists each new floor into place, its windows light up,
   and when the last section is reached the roof, beacon and
   PTI crown complete the building.
   ========================================================= */
import { gsap } from 'gsap';

const NS = 'http://www.w3.org/2000/svg';
const VB_W = 200, VB_H = 640;
const GROUND = 620, FOUND_TOP = 606;
const TX = 34, TW = 104;
const MAST_X = 166, JIB_Y = 70;
const TROLLEY_HOME = 146, TROLLEY_X = TX + TW / 2;
const HOOK_REST = 92;

const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
};
const pad = (n) => String(n).padStart(2, '0');

export default class RisingTower {
    constructor(sections, { onFloorClick } = {}) {
        this.sections = sections;
        this.N = sections.length;
        this.built = 0;
        this.target = 0;
        this.tl = null;
        this.started = false;
        this.isComplete = false;
        this.onFloorClick = onFloorClick;
        this.floorH = Math.max(22, Math.min(54, (FOUND_TOP - 140) / this.N));
        this.render();
        this.bind();
    }

    floorTop(i) { return FOUND_TOP - (i + 1) * this.floorH; }

    render() {
        const root = document.createElement('div');
        root.className = 'tower';
        root.setAttribute('aria-hidden', 'true');
        const svg = el('svg', { viewBox: `0 0 ${VB_W} ${VB_H}`, preserveAspectRatio: 'xMidYMax meet' }, root);

        // ground + foundation
        el('line', { class: 'tw-ground', x1: -10, y1: GROUND, x2: VB_W + 6, y2: GROUND }, svg);
        for (let x = -6; x < VB_W; x += 10) el('line', { class: 'tw-ground', x1: x, y1: GROUND, x2: x - 6, y2: GROUND + 6, 'stroke-opacity': 0.5 }, svg);
        el('rect', { class: 'tw-found', x: TX - 8, y: FOUND_TOP, width: TW + 16, height: GROUND - FOUND_TOP }, svg);

        // blueprint ghost of the finished tower
        const ghost = el('g', { class: 'tw-ghost' }, svg);
        for (let i = 0; i < this.N; i++) el('rect', { x: TX, y: this.floorTop(i), width: TW, height: this.floorH }, ghost);
        el('rect', { x: TX - 4, y: this.floorTop(this.N - 1) - 8, width: TW + 8, height: 8 }, ghost);

        // floors
        this.floors = [];
        const floorsG = el('g', {}, svg);
        for (let i = 0; i < this.N; i++) {
            const y = this.floorTop(i), h = this.floorH;
            const g = el('g', { class: 'tw-floor', 'data-i': i }, floorsG);
            el('rect', { class: 'body', x: TX, y: y + 3, width: TW, height: h - 3 }, g);
            el('rect', { class: 'slab', x: TX - 4, y, width: TW + 8, height: 3 }, g);
            const cols = 4, gap = 6, ww = (TW - gap * (cols + 1)) / cols;
            const wh = Math.max(6, h - 3 - 12);
            const wins = [];
            for (let c = 0; c < cols; c++) {
                wins.push(el('rect', { class: 'win', x: TX + gap + c * (ww + gap), y: y + 3 + (h - 3 - wh) / 2, width: ww, height: wh, rx: 1 }, g));
            }
            el('title', {}, g).textContent = this.sections[i].dataset.floor;
            g.style.opacity = 0;
            this.floors.push({ g, wins });
        }

        // roof crown
        const topY = this.floorTop(this.N - 1);
        this.roof = el('g', { class: 'tw-roof' }, svg);
        el('rect', { class: 'parapet', x: TX - 4, y: topY - 7, width: TW + 8, height: 7 }, this.roof);
        el('rect', { class: 'parapet', x: TX + 30, y: topY - 24, width: TW - 60, height: 17, rx: 2 }, this.roof);
        const brand = el('text', { x: TX + TW / 2, y: topY - 12, 'text-anchor': 'middle' }, this.roof);
        brand.textContent = 'PTI';
        brand.style.fill = 'var(--ink)';
        brand.style.fontSize = '10px';
        el('line', { class: 'mast-a', x1: TX + TW / 2, y1: topY - 24, x2: TX + TW / 2, y2: topY - 54 }, this.roof);
        this.beacon = el('circle', { class: 'beacon', cx: TX + TW / 2, cy: topY - 56, r: 3.2 }, this.roof);

        // crane
        const crane = el('g', { class: 'tw-crane' }, svg);
        this.crane = crane;
        let lattice = `M${MAST_X - 4} ${GROUND} L${MAST_X - 4} ${JIB_Y} M${MAST_X + 4} ${GROUND} L${MAST_X + 4} ${JIB_Y}`;
        for (let y = GROUND; y > JIB_Y + 8; y -= 16) lattice += ` M${MAST_X - 4} ${y} L${MAST_X + 4} ${y - 8} L${MAST_X - 4} ${y - 16}`;
        el('path', { class: 'mast', d: lattice }, crane);
        el('path', { class: 'jib', d: `M${TX - 16} ${JIB_Y} L${VB_W + 4} ${JIB_Y} M${TX - 16} ${JIB_Y + 5} L${VB_W + 4} ${JIB_Y + 5} M${MAST_X} ${JIB_Y - 26} L${TX - 16} ${JIB_Y} M${MAST_X} ${JIB_Y - 26} L${VB_W + 4} ${JIB_Y} M${MAST_X - 4} ${JIB_Y} L${MAST_X} ${JIB_Y - 26} L${MAST_X + 4} ${JIB_Y}` }, crane);
        el('rect', { class: 'cab', x: MAST_X - 9, y: JIB_Y + 6, width: 14, height: 10, rx: 1.5 }, crane);
        el('rect', { class: 'weight', x: VB_W - 12, y: JIB_Y + 5, width: 14, height: 12 }, crane);
        this.blink = el('circle', { class: 'blink', cx: MAST_X, cy: JIB_Y - 28, r: 2 }, crane);
        this.trolley = el('g', {}, crane);
        el('rect', { class: 'cab', x: -5, y: JIB_Y + 4, width: 10, height: 4 }, this.trolley);
        this.cable = el('line', { class: 'cable', x1: 0, y1: JIB_Y + 8, x2: 0, y2: HOOK_REST }, this.trolley);
        this.hook = el('path', { class: 'hook', d: 'M0 0 L0 5 Q0 10 -4 9' }, this.trolley);

        // section label (desktop)
        this.label = el('g', { class: 'tw-label-svg' }, svg);
        el('line', { x1: -6, y1: 0, x2: TX - 2, y2: 0 }, this.label);
        this.labelText = el('text', { x: -12, y: 4, 'text-anchor': 'end' }, this.label);

        this.prog = document.createElement('div');
        this.prog.className = 'tw-progress';
        root.appendChild(this.prog);

        this.root = root;
        document.body.appendChild(root);
        this.setHook(TROLLEY_HOME, HOOK_REST);
        this.updateLabel(0, true);
    }

    setHook(x, y) {
        this.hookState = { x, y };
        this.trolley.setAttribute('transform', `translate(${x} 0)`);
        this.cable.setAttribute('y2', y);
        this.hook.setAttribute('transform', `translate(0 ${y})`);
    }

    bind() {
        this.floors.forEach(({ g }, i) => {
            g.addEventListener('click', () => this.onFloorClick && this.onFloorClick(this.sections[i]));
        });
        let ticking = false;
        this.onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => { ticking = false; this.check(); });
        };
        window.addEventListener('scroll', this.onScroll, { passive: true });
        window.addEventListener('resize', this.onScroll);
        this.blinkTimer = setInterval(() => {
            this.blink.style.opacity = this.blink.style.opacity === '0' ? '1' : '0';
        }, 800);
    }

    /** Find the active section and the theme behind the tower. */
    check() {
        if (!this.root) return;
        const line = window.innerHeight * 0.6;
        let idx = 0;
        this.sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= line) idx = i; });
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = this.N - 1;
        this.setTarget(idx + 1);

        const r = this.root.getBoundingClientRect();
        const probe = r.top + r.height * 0.6;
        let theme = 'dark';
        document.querySelectorAll('[data-theme]').forEach((s) => {
            const b = s.getBoundingClientRect();
            if (b.top <= probe && b.bottom > probe) theme = s.dataset.theme;
        });
        this.root.classList.toggle('on-light', theme !== 'dark');
    }

    start() { this.started = true; this.check(); }

    setTarget(t) {
        if (!this.started || t === this.target) return;
        this.target = t;
        if (this.tl) { this.tl.progress(1); this.tl.kill(); this.tl = null; }

        if (t > this.built) {
            for (let i = this.built; i < t - 1; i++) this.showFloor(i);
            this.hoist(t - 1);
        } else {
            for (let i = this.built - 1; i >= t; i--) this.hideFloor(i);
        }
        this.built = t;
        this.floors.forEach((f, i) => f.g.classList.toggle('is-current', i === t - 1));
        this.updateLabel(t - 1);
        this.complete(t === this.N);
    }

    showFloor(i) {
        const { g, wins } = this.floors[i];
        g.classList.remove('is-hoisting');
        gsap.killTweensOf(g);
        gsap.set(g, { y: 0, x: 0, opacity: 1 });
        wins.forEach((w) => w.classList.add('lit'));
    }

    hideFloor(i) {
        const { g, wins } = this.floors[i];
        wins.forEach((w) => w.classList.remove('lit'));
        gsap.to(g, { opacity: 0, y: -14, duration: 0.35, ease: 'power2.in' });
    }

    hoist(i) {
        const { g, wins } = this.floors[i];
        const top = this.floorTop(i);
        const hs = { x: this.hookState.x, y: this.hookState.y };
        wins.forEach((w) => w.classList.remove('lit'));
        g.classList.add('is-hoisting');
        gsap.set(g, { opacity: 1, x: TROLLEY_HOME - TROLLEY_X, y: HOOK_REST + 8 - top });

        const tl = gsap.timeline({ onUpdate: () => this.setHook(hs.x, hs.y) });
        tl.set(hs, { x: TROLLEY_HOME, y: HOOK_REST })
            .to(hs, { x: TROLLEY_X, duration: 0.55, ease: 'power2.inOut' }, 0)
            .to(g, { x: 0, duration: 0.55, ease: 'power2.inOut' }, 0)
            .to(hs, { y: top - 8, duration: 0.7, ease: 'power3.inOut' }, 0.5)
            .to(g, { y: 0, duration: 0.7, ease: 'power3.inOut' }, 0.5)
            .add(() => g.classList.remove('is-hoisting'), 1.2)
            .to(g, { y: 1.5, duration: 0.08, yoyo: true, repeat: 1 }, 1.2);
        wins.forEach((w, k) => tl.add(() => w.classList.add('lit'), 1.3 + k * 0.09));
        tl.to(hs, { y: HOOK_REST, duration: 0.6, ease: 'power2.inOut' }, 1.35)
            .to(hs, { x: TROLLEY_HOME, duration: 0.6, ease: 'power2.inOut' }, 1.8);
        tl.eventCallback('onComplete', () => { this.tl = null; });
        this.tl = tl;
    }

    complete(on) {
        if (on === this.isComplete) return;
        this.isComplete = on;
        this.root.classList.toggle('is-complete', on);
        gsap.to(this.roof, { opacity: on ? 1 : 0, y: on ? 0 : -10, duration: 0.7, ease: 'power3.out', delay: on ? 0.9 : 0 });
        gsap.to(this.crane, { opacity: on ? 0.25 : 1, duration: 0.8, delay: on ? 1.4 : 0 });
        if (on) gsap.fromTo(this.beacon, { attr: { r: 2 } }, { attr: { r: 4.5 }, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.4 });
        else gsap.killTweensOf(this.beacon);
    }

    updateLabel(i, instant) {
        i = Math.max(0, i);
        const y = this.floorTop(i) + this.floorH / 2;
        const name = (this.sections[i] && this.sections[i].dataset.floor) || '';
        this.labelText.textContent = '';
        const a = el('tspan', { class: 'lb' }, this.labelText);
        a.textContent = 'L' + pad(i + 1);
        const b = el('tspan', { dx: 6 }, this.labelText);
        b.textContent = name;
        if (instant) this.label.setAttribute('transform', `translate(0 ${y})`);
        else gsap.to(this.label, { y, duration: 0.8, ease: 'power3.inOut' });
        this.prog.textContent = `${pad(Math.max(1, this.target))} / ${pad(this.N)}`;
    }

    destroy() {
        window.removeEventListener('scroll', this.onScroll);
        window.removeEventListener('resize', this.onScroll);
        clearInterval(this.blinkTimer);
        if (this.tl) this.tl.kill();
        gsap.killTweensOf([this.roof, this.crane, this.beacon, this.label, ...this.floors.map((f) => f.g)]);
        this.root.remove();
        this.root = null;
    }
}
