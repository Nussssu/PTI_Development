/* =========================================================
   Real-time "living photo" flowers for the concept page.
   createFlora(canvas, { src, anchor, pads, reduce }) -> destroy()
   - the photographed cluster (cut out of the reference, see tools/botanical/concept_cutout.py) is laid on a finely
     subdivided 3D sheet; a vertex shader bends it like a plant: fixed where it is attached (top edge for a hanging
     cascade, bottom edge for a rising bush), freer the further a spray reaches
   - wind: a slow sway, a second gust wave, and small independent flutter so every spray moves on its own
   - scroll: the page's speed drives a damped spring, so the tips lag behind, swing back past centre and settle,
     and a fast scroll briefly shakes every spray
   ========================================================= */
import * as THREE from 'three';

const VERT = /* glsl */ `
uniform float uTime, uAmp, uPush, uGust, uAr, uHang, uSide;
varying vec2 vUv;
varying float vShade;
void main() {
    vUv = uv;
    vec3 p = position;
    /* how free this point is: 0 where the plant is attached, 1 at the far tips */
    float reach = uSide > 0.0 ? uv.x : 1.0 - uv.x;
    float free = uHang > 0.5
        ? max(1.0 - uv.y, reach * 0.85)                       // cascade hanging from the top edge, a branch reaching sideways
        : max(uv.y * 1.05, abs(uv.x - 0.53) * 1.15);          // bush rising from the bottom edge, sprays reaching out
    free = clamp(free, 0.0, 1.0);
    float w = pow(free, 1.5);                                  // stem barely moves, middle ~40%, tips swing fully
    float t = uTime;
    /* wind, timed like ERA's bougainvillea films: one slow swing on a ~10 s cycle that travels down the plant (the
       tips lag behind the stem), a softer second gust, and a light per-spray flutter so neighbours never move as one */
    float lagp = free * 1.4 + p.x * 1.6;
    float swing = sin(t * 0.63 - lagp) * 0.75 + sin(t * 1.31 - lagp * 1.3 + 1.7) * 0.25;
    float flutter = sin(t * 2.9 + p.x * 23.0 + p.y * 17.0) * 0.5 + sin(t * 4.1 - p.x * 31.0 + p.y * 13.0) * 0.3;
    float shake = sin(t * 13.0 + p.x * 27.0 + p.y * 21.0);
    float amp = uHang > 0.5 ? 0.055 : 0.036;                   // ~5-7 % of the plant's length at the tips
    vec2 d;
    d.x = (swing * amp + flutter * 0.0036) * uAmp * w + uPush * 0.045 * pow(w, 1.4) + shake * 0.004 * uGust * w;
    /* the tips ride a pendulum arc: they rise a little with the swing (about a quarter of the sideways travel) */
    d.y = (abs(swing) * amp * 0.25 * (uHang > 0.5 ? 1.0 : -1.0) + flutter * 0.002) * uAmp * w + cos(t * 11.0 + p.y * 25.0) * 0.0025 * uGust * w;
    /* a swinging spray rises a little on its arc (hanging) / dips a little as it bends (rising) */
    d.y += (uHang > 0.5 ? 1.0 : -1.0) * abs(uPush) * 0.014 * w * w;
    /* depth: sprays turn toward and away from the viewer, which shifts their light */
    float z = (swing * 0.6 + flutter * 0.25) * w * uAmp + uPush * w * 0.6;
    p.xy += d;
    p.z += z * 0.02;
    vShade = 1.0 + z * 0.05;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

const FRAG = /* glsl */ `
uniform sampler2D uMap;
varying vec2 vUv;
varying float vShade;
void main() {
    vec4 c = texture2D(uMap, vUv);              // premultiplied on upload: clean, fringe-free edges
    if (c.a < 0.003) discard;
    gl_FragColor = vec4(c.rgb * vShade, c.a);
}`;

/**
 * anchor 'top' (hangs from the top edge) or 'bottom' (rises from the bottom edge).
 * pads = { l, r, t, b }: empty room around the photo, in photo widths, so a swaying tip is never clipped.
 * The canvas's CSS box must be (1 + l + r) photo widths by (ar + t + b) photo widths.
 */
export function createFlora(canvas, { src, anchor = 'top', side = 1, pads = {}, reduce = false } = {}) {
    const { l = 0, r = 0, t = 0, b = 0 } = pads;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-l, 1 + r, 1, 0, -10, 10);
    camera.position.z = 5;

    const uniforms = {
        uMap: { value: null }, uTime: { value: 0 }, uAmp: { value: reduce ? 0 : 1 }, uPush: { value: 0 }, uGust: { value: 0 },
        uAr: { value: 1 }, uHang: { value: anchor === 'top' ? 1 : 0 }, uSide: { value: side < 0 ? -1 : 1 },
    };
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, depthTest: false });
    let mesh = null, ready = false, ar = 1;

    const tex = new THREE.TextureLoader().load(src, (tx) => {
        ar = tx.image.height / tx.image.width;
        uniforms.uAr.value = ar;
        /* the photo spans x 0..1 and y 0..ar; dense grid so the bends stay smooth */
        const g = new THREE.PlaneGeometry(1, ar, 160, Math.round(160 * ar));
        g.translate(0.5, ar / 2, 0);
        mesh = new THREE.Mesh(g, mat);
        mesh.frustumCulled = false;
        scene.add(mesh);
        camera.top = ar + t;
        camera.bottom = -b;
        camera.updateProjectionMatrix();
        ready = true;
        resize();
        frame();
    });
    tex.premultiplyAlpha = true;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    uniforms.uMap.value = tex;

    const resize = () => {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (w && h) renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0, running = false, visible = false;
    const push = { pos: 0, vel: 0 };
    const clock = new THREE.Clock();
    const seed = Math.random() * 100;
    function frame() {
        if (!ready) return;
        uniforms.uTime.value = clock.getElapsedTime() + seed;
        if (!reduce) {
            /* scroll speed -> a damped spring: tips lag behind the movement, overshoot, swing back and settle */
            const v = window.__lenis?.velocity || 0;
            const target = Math.max(-1, Math.min(1, v / 40));
            push.vel += (target - push.pos) * 0.05;
            push.vel *= 0.9;
            push.pos += push.vel;
            uniforms.uPush.value = push.pos;
            const g = Math.min(1, Math.abs(v) / 30);
            uniforms.uGust.value += (g - uniforms.uGust.value) * (g > uniforms.uGust.value ? 0.25 : 0.03);
        }
        renderer.render(scene, camera);
        if (running) raf = requestAnimationFrame(frame);
    }
    const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !running) { running = !reduce; frame(); }
        else if (!visible) { running = false; cancelAnimationFrame(raf); }
    });
    io.observe(canvas);

    return () => {
        running = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
        mesh?.geometry.dispose(); mat.dispose(); tex.dispose(); renderer.dispose();
    };
}
