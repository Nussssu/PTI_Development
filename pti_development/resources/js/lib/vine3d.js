/* =========================================================
   Real-time 3D purple-wreath vine (Petrea) for a page corner.
   createVine(canvas, { seed, flip }) -> destroy()
   - true 3D geometry: curved lance petals, folded leaves, buds, tube stems
   - physically based materials (velvety petals with sheen, glossy leaves), studio environment light
   - wind runs in the vertex shader: the further a vertex hangs below the stem, the more it sways
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/* deterministic random so every load looks the same */
function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const PETAL_BASE = new THREE.Color('#4f34c8');
const PETAL_TIP = new THREE.Color('#8f78ee');
const PETAL_EDGE = new THREE.Color('#4128b0');
const LEAF_BASE = new THREE.Color('#3f6b2a');
const LEAF_TIP = new THREE.Color('#77a24a');

/* lance-shaped petal, length 1 along +Y, cupped and curled, vertex-coloured base -> tip */
function petalGeometry() {
    const g = new THREE.PlaneGeometry(1, 1, 8, 18);
    const p = g.attributes.position;
    const col = [];
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
        const u = p.getX(i) + 0.5;                 // 0..1 across
        const t = p.getY(i) + 0.5;                 // 0..1 base -> tip
        const width = 0.34 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.04)), 0.75) * (1 - 0.15 * t);
        const x = (u - 0.5) * width;
        const z = 0.18 * t * t + 0.9 * x * x - 0.05 * Math.sin(t * Math.PI);   // cup + transverse curl
        p.setXYZ(i, x, t, z);
        const edge = Math.abs(u - 0.5) * 2;
        c.copy(PETAL_BASE).lerp(PETAL_TIP, Math.pow(t, 0.8)).lerp(PETAL_EDGE, Math.max(0, edge - 0.7) * 1.4);
        col.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
}

/* ovate leaf folded along the midrib, length 1 along +Y */
function leafGeometry() {
    const g = new THREE.PlaneGeometry(1, 1, 10, 16);
    const p = g.attributes.position;
    const col = [];
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
        const u = p.getX(i) + 0.5, t = p.getY(i) + 0.5;
        const width = 0.5 * Math.pow(Math.sin(Math.PI * t), 0.62) * (1 - 0.3 * t);
        const x = (u - 0.5) * width;
        const z = Math.abs(x) * 0.55 - 0.12 * Math.sin(t * Math.PI) + 0.06 * t * t;     // V-fold + gentle arch
        p.setXYZ(i, x, t, z);
        const vein = Math.exp(-Math.pow((u - 0.5) * 18, 2));
        c.copy(LEAF_BASE).lerp(LEAF_TIP, t * 0.7 + 0.15).lerp(new THREE.Color('#a9c77a'), vein * 0.45);
        col.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
}

/* inject wind into a material: world-space sway that grows with the hang below uTop */
function windify(mat, uniforms) {
    mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, uniforms);
        sh.vertexShader = 'uniform float uTime; uniform float uTop; uniform float uSpan; uniform float uAmp; uniform float uGust; uniform float uPush;\n' + sh.vertexShader.replace(
            '#include <project_vertex>',
            `
            #ifdef USE_INSTANCING
              vec4 wp = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
            #else
              vec4 wp = modelMatrix * vec4(transformed, 1.0);
            #endif
            float hang = clamp((uTop - wp.y) / uSpan, 0.0, 1.0);
            float h2 = hang * hang;
            wp.x += (sin(uTime * 1.25 + wp.y * 0.9 + wp.x * 0.35) * 0.18 + sin(uTime * 3.1 + wp.x * 1.7 + wp.y) * 0.035) * h2 * uAmp;
            wp.z += cos(uTime * 0.85 + wp.y * 0.7) * 0.10 * h2 * uAmp;
            wp.y += sin(uTime * 1.6 + wp.x) * 0.012 * hang * uAmp;
            /* scroll 'shake': the whole cluster is pushed with the scroll and every spray jiggles quickly,
               like a branch that was just shaken, then it settles back into the breeze */
            float j = sin(uTime * 11.0 + wp.x * 3.1 + wp.y * 2.3) * 0.5 + sin(uTime * 17.0 + wp.y * 4.7) * 0.3;
            wp.x += (j * 0.10 * uGust + uPush * 0.22) * h2;
            wp.y += (uPush * 0.30 + j * 0.05 * uGust) * h2;
            wp.z += cos(uTime * 9.0 + wp.x * 2.0) * 0.08 * uGust * h2;
            vec4 mvPosition = viewMatrix * wp;
            gl_Position = projectionMatrix * mvPosition;
            `,
        );
    };
    return mat;
}

/* canvas size relative to the vine's design frame (CSS sizes the canvas PAD x larger) */
export const PAD = 1.5;

export function createVine(canvas, { seed = 7, flip = false, shape = 'corner', reduce = false } = {}) {
    const rand = rng(seed);
    const R = (a, b) => a + (b - a) * rand();

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.45;

    /* soft warm key light from the top-left, cool sky fill */
    scene.add(new THREE.HemisphereLight(0xf1ecff, 0x6b5a48, 0.55));
    const key = new THREE.DirectionalLight(0xfff1e0, 2.8);
    key.position.set(-3, 5, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc9b8ff, 0.8);
    rim.position.set(4, -2, -3);
    scene.add(rim);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 13.5);
    if (flip) camera.up.set(0, -1, 0);       // bottom-right copy: same vine seen upside down (rising)
    camera.lookAt(0, 0, 0);

    const uniforms = { uTime: { value: 0 }, uTop: { value: 3.2 }, uSpan: { value: 6.5 }, uAmp: { value: reduce ? 0 : 2.2 }, uGust: { value: 0 }, uPush: { value: 0 } };

    /* ---- the vine layout (world units; top-left corner sits at about x -5.3, y 3.6) ---- */
    /* corner: stems enter from the left edge; center: a self-contained arch of stems (no edge to cut) */
    const stems = shape === 'center' ? [
        new THREE.CatmullRomCurve3([new THREE.Vector3(-3.7, 3.1, 0), new THREE.Vector3(-1.8, 3.62, 0.3), new THREE.Vector3(0.4, 3.7, 0.1), new THREE.Vector3(2.4, 3.45, -0.1), new THREE.Vector3(3.7, 2.95, 0)]),
        new THREE.CatmullRomCurve3([new THREE.Vector3(-2.6, 2.95, 0.4), new THREE.Vector3(-0.9, 3.3, 0.5), new THREE.Vector3(1.1, 3.25, 0.3), new THREE.Vector3(2.5, 2.7, 0.2)]),
    ] : [
        new THREE.CatmullRomCurve3([new THREE.Vector3(-6.2, 3.0, 0), new THREE.Vector3(-3.6, 3.55, 0.3), new THREE.Vector3(-0.8, 3.2, 0.1), new THREE.Vector3(1.2, 2.2, -0.2), new THREE.Vector3(2.0, 0.7, 0)]),
        new THREE.CatmullRomCurve3([new THREE.Vector3(-6.2, 2.1, 0.4), new THREE.Vector3(-4.2, 2.2, 0.6), new THREE.Vector3(-2.6, 1.2, 0.3), new THREE.Vector3(-2.0, -0.6, 0.2)]),
    ];
    const stemMat = windify(new THREE.MeshStandardMaterial({ color: 0x4a3a30, roughness: 0.75, metalness: 0 }), uniforms);
    const group = new THREE.Group();
    scene.add(group);
    stems.forEach((c, i) => group.add(new THREE.Mesh(new THREE.TubeGeometry(c, 120, i ? 0.035 : 0.05, 8, false), stemMat)));

    /* racemes: thin hanging stems; flowers + buds placed along them */
    const flowers = [];      // {pos, quat, scale}
    const buds = [];
    const leaves = [];
    const racemeCurves = [];
    /* dense, like a real cascade: a spray every few cm along both stems */
    const hangFrom = [[0, Array.from({ length: 24 }, (_, k) => 0.02 + 0.98 * k / 23)], [1, Array.from({ length: 13 }, (_, k) => 0.08 + 0.92 * k / 12)]];
    const up = new THREE.Vector3(0, 1, 0);
    hangFrom.forEach(([si, ts]) => ts.forEach((t) => {
        const a = stems[si].getPoint(t);
        const len = R(1.6, 3.6) * (t > 0.6 ? 1.15 : 1);
        const sw = R(-0.5, 0.5);
        const c = new THREE.CatmullRomCurve3([a, new THREE.Vector3(a.x + sw * 0.3, a.y - len * 0.35, a.z + R(-0.3, 0.3)), new THREE.Vector3(a.x + sw * 0.8, a.y - len * 0.72, a.z + R(-0.4, 0.4)), new THREE.Vector3(a.x + sw, a.y - len, a.z + R(-0.4, 0.4))]);
        racemeCurves.push(c);
        group.add(new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.022, 5, false), stemMat));
        const n = Math.round(R(18, 25));
        for (let k = 0; k < n; k++) {
            const tt = 0.04 + 0.84 * Math.pow(k / (n - 1), 1.25);     // denser near the top of each spray
            const p = c.getPoint(tt);
            const side = k % 2 ? 1 : -1;
            const off = new THREE.Vector3(side * R(0.1, 0.32), R(-0.08, 0.05), R(-0.25, 0.3));
            const pos = p.clone().add(off);
            /* flowers face mostly toward the viewer, tilted at random (real 3D orientation variety) */
            const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(R(-0.7, 0.5), R(-0.8, 0.8), R(0, Math.PI * 2)));
            flowers.push({ pos, q, s: R(0.55, 0.74) * (1 - 0.34 * tt) });
        }
        for (let k = 0; k < Math.round(R(3, 6)); k++) {
            const p = c.getPoint(0.9 + 0.1 * k / 5);
            buds.push({ pos: p.clone().add(new THREE.Vector3(R(-0.12, 0.12), R(-0.1, 0), R(-0.1, 0.1))), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(R(-0.4, 0.4), R(-0.4, 0.4), Math.PI + R(-0.5, 0.5))), s: R(0.09, 0.14) });
        }
    }));
    /* leaves alternate along the main stems, pointing outward/down */
    stems.forEach((c, si) => {
        const n = si ? 12 : 22;
        for (let k = 0; k < n; k++) {
            const t = 0.03 + 0.95 * (k / (n - 1));
            const p = c.getPoint(t);
            const tan = c.getTangent(t);
            const side = k % 2 ? 1 : -1;
            const ang = Math.atan2(tan.y, tan.x) + side * R(0.9, 1.4) - Math.PI / 2;
            const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(R(-0.6, 0.3), R(-0.5, 0.5), ang));
            leaves.push({ pos: p, q, s: R(1.15, 1.55) * (1 - 0.25 * t) });
        }
    });

    /* ---- instanced meshes ---- */
    const petalMat = windify(new THREE.MeshPhysicalMaterial({
        vertexColors: true, side: THREE.DoubleSide, roughness: 0.55, metalness: 0,
        sheen: 0.7, sheenRoughness: 0.5, sheenColor: new THREE.Color('#b9a8ff'), clearcoat: 0.05,
    }), uniforms);
    const leafMat = windify(new THREE.MeshPhysicalMaterial({
        vertexColors: true, side: THREE.DoubleSide, roughness: 0.42, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.5,
    }), uniforms);
    const budMat = windify(new THREE.MeshPhysicalMaterial({ color: 0x5b40c2, roughness: 0.45, sheen: 0.8, sheenColor: new THREE.Color('#b8a8ff') }), uniforms);
    const eyeMat = windify(new THREE.MeshStandardMaterial({ color: 0xf2eeff, roughness: 0.5 }), uniforms);

    const petals = new THREE.InstancedMesh(petalGeometry(), petalMat, flowers.length * 5);
    const eyes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 12, 8), eyeMat, flowers.length);
    const budMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 10), budMat, buds.length);
    const leafMesh = new THREE.InstancedMesh(leafGeometry(), leafMat, leaves.length);
    const m = new THREE.Matrix4(), q2 = new THREE.Quaternion(), sv = new THREE.Vector3(), tint = new THREE.Color();
    let pi = 0;
    flowers.forEach((f, i) => {
        const a0 = R(0, Math.PI * 2);
        for (let k = 0; k < 5; k++) {
            const a = a0 + k * (Math.PI * 2 / 5) + R(-0.12, 0.12);
            q2.setFromEuler(new THREE.Euler(R(-0.25, -0.05), 0, a));        // petals open slightly forward
            const q = f.q.clone().multiply(q2);
            sv.setScalar(f.s * R(0.92, 1.06));
            m.compose(f.pos, q, sv);
            petals.setMatrixAt(pi, m);
            tint.setHSL(0.72 + R(-0.015, 0.015), 1, 0.5 + R(-0.06, 0.06));
            petals.setColorAt(pi, new THREE.Color(1, 1, 1).lerp(tint, 0.12));
            pi++;
        }
        m.compose(f.pos.clone().add(new THREE.Vector3(0, 0, 0.03).applyQuaternion(f.q)), f.q, sv.setScalar(f.s));
        eyes.setMatrixAt(i, m);
    });
    buds.forEach((b, i) => { m.compose(b.pos, b.q, new THREE.Vector3(b.s * 0.38, b.s, b.s * 0.38)); budMesh.setMatrixAt(i, m); });
    leaves.forEach((l, i) => { m.compose(l.pos, l.q, sv.setScalar(l.s)); leafMesh.setMatrixAt(i, m); });
    [petals, eyes, budMesh, leafMesh].forEach((im) => { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.frustumCulled = false; group.add(im); });

    /* frame the vine so the corner of the scene meets the corner of the canvas */
    group.position.set(shape === 'center' ? 0 : 1.4, -0.15, 0);

    /* ---- sizing + loop (only renders while on screen) ---- */
    const resize = () => {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        /* the canvas is PAD x larger than the vine's original frame: widen the view the same way (off-axis, so
           the anchored corner/edge stays put and the vine keeps its size) and every petal fits, nothing is cut */
        const top = camera.near * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / PAD;
        const wd = top * camera.aspect, ext = PAD - 1;
        const [l, r, t, b] = shape === 'center'
            ? [-wd * (1 + ext), wd * (1 + ext), top * (1 + 2 * ext), -top]      // anchored on the bottom edge, grows up and sideways
            : [-wd, wd * (1 + 2 * ext), top, -top * (1 + 2 * ext)];             // anchored top-left, grows right and down
        camera.projectionMatrix.makePerspective(l, r, t, b, camera.near, camera.far);
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0, running = false;
    const push = { pos: 0, vel: 0 };
    const clock = new THREE.Clock();
    const frame = () => {
        uniforms.uTime.value = clock.getElapsedTime() + seed;
        /* scroll speed -> gust strength (eases in fast, dies out slowly) and a springy push that swings back */
        const v = reduce ? 0 : (window.__lenis?.velocity || 0);
        const target = Math.min(1, Math.abs(v) / 35);
        uniforms.uGust.value += (target - uniforms.uGust.value) * (target > uniforms.uGust.value ? 0.25 : 0.035);
        push.vel += (Math.max(-1, Math.min(1, -v / 40)) - push.pos) * 0.06;
        push.vel *= 0.86;
        push.pos += push.vel;
        uniforms.uPush.value = push.pos * (flip ? -1 : 1);
        renderer.render(scene, camera);
        if (running) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !running) { running = !reduce; frame(); }
        else if (!e.isIntersecting) { running = false; cancelAnimationFrame(raf); }
    });
    io.observe(canvas);

    return () => {
        running = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
        scene.traverse((o) => { o.geometry?.dispose(); });
        [stemMat, petalMat, leafMat, budMat, eyeMat].forEach((x) => x.dispose());
        envTex.dispose(); pmrem.dispose(); renderer.dispose();
    };
}
