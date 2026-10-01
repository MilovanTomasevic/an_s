/* advanexus cube: standalone WebGL; transparent scene, optional official logo image.
 * Synthetic example, not a live integration. No runtime dependencies. */
(function (global) {
    'use strict';
    const PI = Math.PI, TAU = PI * 2, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const mix = (a, b, t) => a + (b - a) * t, smooth = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
    const STORY = Object.freeze({ cycle: 7, question: .55, thinking: 2.55, answer: 3.25, visual: 4, fade: 6.72 });
    const LABEL_OVERLAY_WIDTH = 800;
    const FLOW_STAGES = { input: [0, 8], control: [8, 10], context: [10, 13], output: [13, 16], result: [21, 26] };
    const STORY_BEATS = [[0, 0], [STORY.question, 5], [STORY.thinking, 16], [STORY.answer, 20], [STORY.visual, 26], [STORY.cycle, 26]];
    function storyPhase(cycle) {
        for (let i = 1; i < STORY_BEATS.length; i++) {
            const [end, value] = STORY_BEATS[i];
            if (cycle <= end) {
                const [start, previous] = STORY_BEATS[i - 1];
                return mix(previous, value, (cycle - start) / (end - start));
            }
        }
        return 26;
    }
    function phaseTime(phase) {
        for (let i = 1; i < STORY_BEATS.length; i++) {
            const [end, value] = STORY_BEATS[i], [start, previous] = STORY_BEATS[i - 1];
            if (phase <= value) return mix(start, end, (phase - previous) / (value - previous));
        }
        return STORY.visual;
    }
    const vec = { sub: (a, b) => a.map((v, i) => v - b[i]), dot: (a, b) => a.reduce((s, v, i) => s + v * b[i], 0), cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm: a => { const n = Math.hypot(...a) || 1; return a.map(v => v / n); } };
    function identity() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
    function multiply(a, b) { const o = new Float32Array(16); for (let c = 0; c < 4; c++)
        for (let r = 0; r < 4; r++)
            for (let k = 0; k < 4; k++)
                o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o; }
    function compose(p = [0, 0, 0], s = [1, 1, 1], r = [0, 0, 0]) { const x = r[0] || 0, y = r[1] || 0, z = r[2] || 0, cx = Math.cos(x), sx = Math.sin(x), cy = Math.cos(y), sy = Math.sin(y), cz = Math.cos(z), sz = Math.sin(z); let a = new Float32Array([cy, 0, -sy, 0, 0, 1, 0, 0, sy, 0, cy, 0, 0, 0, 0, 1]); let b = new Float32Array([1, 0, 0, 0, 0, cx, sx, 0, 0, -sx, cx, 0, 0, 0, 0, 1]); let c = new Float32Array([cz, sz, 0, 0, -sz, cz, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); let o = multiply(multiply(a, b), c); for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            o[i * 4 + j] *= s[i]; o[12] = p[0]; o[13] = p[1]; o[14] = p[2]; return o; }
    function perspective(fov, aspect, near, far) { const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far); return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]); }
    function lookAt(eye, target) { const z = vec.norm(vec.sub(eye, target)), x = vec.norm(vec.cross([0, 1, 0], z)), y = vec.cross(z, x); return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -vec.dot(x, eye), -vec.dot(y, eye), -vec.dot(z, eye), 1]); }
    function rgb(hex) { let h = (hex || '#33e6a7').replace('#', ''); if (h.length === 3)
        h = h.split('').map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255); }
    function pointTransform(m, p) { return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]]; }
    const VERT = `attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUV;uniform mat4 uModel,uView,uProjection;uniform mat3 uNormal;varying vec3 vNormal,vWorld;varying vec2 vUV;void main(){vec4 w=uModel*vec4(aPosition,1.);vWorld=w.xyz;vNormal=normalize(uNormal*aNormal);vUV=aUV;gl_Position=uProjection*uView*w;}`;
    const FRAG = `precision mediump float;varying vec3 vNormal,vWorld;varying vec2 vUV;uniform vec3 uColor,uCamera;uniform float uOpacity,uEmission,uLit,uGloss;uniform sampler2D uTexture;void main(){vec4 tx=texture2D(uTexture,vUV);float a=tx.a*uOpacity;if(a<.008)discard;vec3 n=normalize(vNormal);vec3 view=normalize(uCamera-vWorld);float diffuse=.27+.47*max(dot(n,normalize(vec3(-.6,1.,.7))),0.)+.22*max(dot(n,normalize(vec3(.7,.4,-.2))),0.);float spec=pow(max(dot(reflect(-normalize(vec3(-.5,1.,.8)),n),view),0.),48.)*uGloss;float fres=pow(1.-abs(dot(n,view)),3.)*uGloss*.12;vec3 col=uColor*tx.rgb*(mix(1.,diffuse,uLit)+uEmission)+vec3(.6,.9,.78)*(spec+fres);col=mix(col,pow(max(col,vec3(0.)),vec3(.82)),uLit);gl_FragColor=vec4(clamp(col,0.,1.),a);}`;
    const PVERT = `attribute vec3 aPosition,aColor;attribute float aSize;uniform mat4 uView,uProjection;uniform float uRatio;varying vec3 vColor;void main(){vec4 p=uView*vec4(aPosition,1.);gl_Position=uProjection*p;gl_PointSize=clamp(aSize*uRatio*(18./max(1.,-p.z)),1.,36.);vColor=aColor;}`;
    const PFRAG = `precision mediump float;varying vec3 vColor;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float a=exp(-r*r*4.)*(1.-smoothstep(.65,1.,r));gl_FragColor=vec4(vColor,a);}`;
    const FVERT = `attribute vec2 aPosition;varying vec2 vUV;void main(){vUV=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
    const BFRAG = `precision mediump float;varying vec2 vUV;uniform sampler2D uTexture;uniform vec2 uDirection;uniform float uExtract;void main(){vec3 c=texture2D(uTexture,vUV).rgb*.227027;c+=texture2D(uTexture,vUV+uDirection*1.384615).rgb*.316216;c+=texture2D(uTexture,vUV-uDirection*1.384615).rgb*.316216;c+=texture2D(uTexture,vUV+uDirection*3.230769).rgb*.070270;c+=texture2D(uTexture,vUV-uDirection*3.230769).rgb*.070270;float b=max(c.r,max(c.g,c.b));c*=mix(1.,smoothstep(.58,.86,b),uExtract);gl_FragColor=vec4(c,1.);}`;
    const CFRAG = `precision mediump float;varying vec2 vUV;uniform sampler2D uTexture,uBloom;uniform float uGlow;void main(){vec4 scene=texture2D(uTexture,vUV);vec3 c=scene.rgb+texture2D(uBloom,vUV).rgb*uGlow;float a=max(scene.a,max(c.r,max(c.g,c.b)));gl_FragColor=vec4(c,a);}`;
    class Engine {
        constructor(canvas) { this.canvas = canvas; const opt = { alpha: true, antialias: true, depth: true, stencil: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }; this.gl = canvas.getContext('webgl2', opt); this.isWebGL2 = !!this.gl; if (!this.gl)
            this.gl = canvas.getContext('webgl', opt) || canvas.getContext('experimental-webgl', opt); if (!this.gl)
            throw new Error('WebGL nije dostupan u ovom pregledaču.'); this.resources = { buffers: [], textures: [], programs: [], fbos: [], rbos: [] }; this.meshProgram = this.program(VERT, FRAG, ['aPosition', 'aNormal', 'aUV'], ['uModel', 'uView', 'uProjection', 'uNormal', 'uColor', 'uCamera', 'uOpacity', 'uEmission', 'uLit', 'uGloss', 'uTexture']); this.pointProgram = this.program(PVERT, PFRAG, ['aPosition', 'aColor', 'aSize'], ['uView', 'uProjection', 'uRatio']); this.blurProgram = this.program(FVERT, BFRAG, ['aPosition'], ['uTexture', 'uDirection', 'uExtract']); this.compositeProgram = this.program(FVERT, CFRAG, ['aPosition'], ['uTexture', 'uBloom', 'uGlow']); this.quad = this.buffer(new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])); this.pointBuffer = this.buffer(new Float32Array(40000), true); const w = document.createElement('canvas'); w.width = w.height = 2; const c = w.getContext('2d'); c.fillStyle = 'white'; c.fillRect(0, 0, 2, 2); this.white = this.texture(w); this.frameCount = 0; this.drawCalls = 0; this.effects = true; }
        program(v, f, attributes, uniforms) { const gl = this.gl; if (this.isWebGL2) {
            v = '#version 300 es\n' + v.replace(/\battribute\b/g, 'in').replace(/\bvarying\b/g, 'out');
            f = '#version 300 es\nprecision mediump float;\nout vec4 outColor;\n' + f.replace('precision mediump float;', '').replace(/\bvarying\b/g, 'in').replace(/\btexture2D\b/g, 'texture').replace(/\bgl_FragColor\b/g, 'outColor');
        } const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
            throw new Error(gl.getShaderInfoLog(s)); return s; }; const vs = compile(gl.VERTEX_SHADER, v), fs = compile(gl.FRAGMENT_SHADER, f), p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p); gl.deleteShader(vs); gl.deleteShader(fs); if (!gl.getProgramParameter(p, gl.LINK_STATUS))
            throw new Error(gl.getProgramInfoLog(p)); this.resources.programs.push(p); const out = { p }; attributes.forEach(k => out[k] = gl.getAttribLocation(p, k)); uniforms.forEach(k => out[k] = gl.getUniformLocation(p, k)); return out; }
        buffer(data, dynamic = false) { const gl = this.gl, b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW); this.resources.buffers.push(b); return b; }
        geometry(vertices, indices = null, mode = null) { const gl = this.gl; const g = { buffer: this.buffer(new Float32Array(vertices)), count: vertices.length / 8, mode: mode || gl.TRIANGLES }; if (indices) {
            g.index = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.index);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
            this.resources.buffers.push(g.index);
            g.count = indices.length;
        } return g; }
        texture(image) { const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); this.resources.textures.push(t); return t; }
        updateTexture(t, canvas) { const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas); }
        target(w, h, depth) { const gl = this.gl, t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); let r = null; if (depth) {
            r = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, r);
            gl.renderbufferStorage(gl.RENDERBUFFER, this.isWebGL2 ? gl.DEPTH_COMPONENT24 : gl.DEPTH_COMPONENT16, w, h);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, r);
        } const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE; return { t, f, r, w, h, ok }; }
        deleteTarget(t) { if (!t)
            return; const g = this.gl; g.deleteTexture(t.t); g.deleteFramebuffer(t.f); if (t.r)
            g.deleteRenderbuffer(t.r); if (t.c)
            g.deleteRenderbuffer(t.c); }
        multisample(w, h) { const gl = this.gl, f = gl.createFramebuffer(), c = gl.createRenderbuffer(), r = gl.createRenderbuffer(), samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES)); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.bindRenderbuffer(gl.RENDERBUFFER, c); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, w, h); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, c); gl.bindRenderbuffer(gl.RENDERBUFFER, r); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, w, h); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, r); return { f, c, r, t: null, w, h, ok: gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE }; }
        resize(w, h, ratio) { this.ratio = ratio; this.w = Math.max(2, Math.round(w * ratio)); this.h = Math.max(2, Math.round(h * ratio)); this.canvas.width = this.w; this.canvas.height = this.h; [this.main, this.blurA, this.blurB, this.msaa].forEach(t => this.deleteTarget(t)); this.main = this.target(this.w, this.h, true); this.blurA = this.target(Math.max(2, Math.round(this.w / 3)), Math.max(2, Math.round(this.h / 3)), false); this.blurB = this.target(this.blurA.w, this.blurA.h, false); this.effects = this.main.ok && this.blurA.ok && this.blurB.ok; this.msaa = this.isWebGL2 ? this.multisample(this.w, this.h) : null; this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null); }
        mesh(m, view, projection, eye) { if (m.opacity < .002 || m.hidden)
            return; const gl = this.gl, p = this.meshProgram, g = m.geo; gl.useProgram(p.p); gl.bindBuffer(gl.ARRAY_BUFFER, g.buffer); gl.enableVertexAttribArray(p.aPosition); gl.enableVertexAttribArray(p.aNormal); gl.enableVertexAttribArray(p.aUV); gl.vertexAttribPointer(p.aPosition, 3, gl.FLOAT, false, 32, 0); gl.vertexAttribPointer(p.aNormal, 3, gl.FLOAT, false, 32, 12); gl.vertexAttribPointer(p.aUV, 2, gl.FLOAT, false, 32, 24); gl.uniformMatrix4fv(p.uView, false, view); gl.uniformMatrix4fv(p.uProjection, false, projection); gl.uniformMatrix4fv(p.uModel, false, m.model); const a = m.model, n = new Float32Array(9); for (let i = 0; i < 3; i++) {
            const l = a[i * 4] ** 2 + a[i * 4 + 1] ** 2 + a[i * 4 + 2] ** 2 || 1;
            for (let j = 0; j < 3; j++)
                n[i * 3 + j] = a[i * 4 + j] / l;
        } gl.uniformMatrix3fv(p.uNormal, false, n); gl.uniform3fv(p.uCamera, eye); gl.uniform3fv(p.uColor, m.color); gl.uniform1f(p.uOpacity, m.opacity); gl.uniform1f(p.uEmission, m.emission || 0); gl.uniform1f(p.uLit, m.lit === false ? 0 : 1); gl.uniform1f(p.uGloss, m.gloss || 0); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, m.texture || this.white); gl.uniform1i(p.uTexture, 0); gl.depthMask(!m.transparent); gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, m.additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA, gl.ONE, m.additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA); if (g.index) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.index);
            gl.drawElements(g.mode, g.count, gl.UNSIGNED_SHORT, 0);
        }
        else
            gl.drawArrays(g.mode, 0, g.count); this.drawCalls++; }
        points(data, view, projection) { if (!data.length)
            return; const gl = this.gl, p = this.pointProgram; gl.useProgram(p.p); gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(p.aPosition); gl.enableVertexAttribArray(p.aColor); gl.enableVertexAttribArray(p.aSize); gl.vertexAttribPointer(p.aPosition, 3, gl.FLOAT, false, 28, 0); gl.vertexAttribPointer(p.aColor, 3, gl.FLOAT, false, 28, 12); gl.vertexAttribPointer(p.aSize, 1, gl.FLOAT, false, 28, 24); gl.uniformMatrix4fv(p.uView, false, view); gl.uniformMatrix4fv(p.uProjection, false, projection); gl.uniform1f(p.uRatio, this.ratio); gl.depthMask(false); gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE); gl.drawArrays(gl.POINTS, 0, data.length / 7); this.drawCalls++; }
        fullscreen(p, target, source, dir, extract, glow, bloom) { const gl = this.gl; gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.f : null); gl.viewport(0, 0, target ? target.w : this.w, target ? target.h : this.h); gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(false); gl.useProgram(p.p); gl.bindBuffer(gl.ARRAY_BUFFER, this.quad); gl.enableVertexAttribArray(p.aPosition); gl.vertexAttribPointer(p.aPosition, 2, gl.FLOAT, false, 8, 0); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, source); gl.uniform1i(p.uTexture, 0); if (dir) {
            gl.uniform2fv(p.uDirection, dir);
            gl.uniform1f(p.uExtract, extract);
        } if (bloom) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, bloom);
            gl.uniform1i(p.uBloom, 1);
            gl.uniform1f(p.uGlow, glow);
        } gl.drawArrays(gl.TRIANGLES, 0, 6); }
        render(meshes, points, view, projection, eye, glow) { const gl = this.gl; this.drawCalls = 0; const sceneTarget = this.effects ? (this.msaa?.ok ? this.msaa.f : this.main.f) : null; gl.bindFramebuffer(gl.FRAMEBUFFER, sceneTarget); gl.viewport(0, 0, this.w, this.h); gl.clearColor(0, 0, 0, 0); gl.depthMask(true); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); const opaque = [], transparent = [], crisp = []; meshes.forEach(m => (m.crisp ? crisp : m.transparent ? transparent : opaque).push(m)); const byDistance = (a, b) => { const dist = m => (m.model[12] - eye[0]) ** 2 + (m.model[13] - eye[1]) ** 2 + (m.model[14] - eye[2]) ** 2; return dist(b) - dist(a); }; opaque.forEach(m => this.mesh(m, view, projection, eye)); transparent.sort(byDistance).forEach(m => this.mesh(m, view, projection, eye)); this.points(points, view, projection); const resolve = () => { if (!this.msaa?.ok) return; gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.msaa.f); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.main.f); gl.blitFramebuffer(0, 0, this.w, this.h, 0, 0, this.w, this.h, gl.COLOR_BUFFER_BIT, gl.NEAREST); }; if (this.effects) {
            resolve();
            this.fullscreen(this.blurProgram, this.blurA, this.main.t, [2 / this.w, 0], 1);
            this.fullscreen(this.blurProgram, this.blurB, this.blurA.t, [0, 2 / this.blurA.h], 0);
            this.fullscreen(this.blurProgram, this.blurA, this.blurB.t, [1.5 / this.blurA.w, 0], 0);
        }
        // Labels and logos render after bloom to retain sharp edges.
        gl.bindFramebuffer(gl.FRAMEBUFFER, sceneTarget);
        gl.viewport(0, 0, this.w, this.h);
        gl.enable(gl.DEPTH_TEST);
        crisp.sort(byDistance).forEach(m => this.mesh(m, view, projection, eye));
        if (this.effects) {
            resolve();
            this.fullscreen(this.compositeProgram, null, this.main.t, null, 0, glow, this.blurA.t);
        } gl.depthMask(true); this.frameCount++; }
        dispose() { const g = this.gl; [this.main, this.blurA, this.blurB, this.msaa].forEach(t => this.deleteTarget(t)); this.resources.buffers.forEach(x => g.deleteBuffer(x)); this.resources.textures.forEach(x => g.deleteTexture(x)); this.resources.programs.forEach(x => g.deleteProgram(x)); }
    }
    function boxData() { const v = [], ix = []; const faces = [[[1, 0, 0], [[.5, -.5, .5], [.5, -.5, -.5], [.5, .5, -.5], [.5, .5, .5]]], [[-1, 0, 0], [[-.5, -.5, -.5], [-.5, -.5, .5], [-.5, .5, .5], [-.5, .5, -.5]]], [[0, 1, 0], [[-.5, .5, .5], [.5, .5, .5], [.5, .5, -.5], [-.5, .5, -.5]]], [[0, -1, 0], [[-.5, -.5, -.5], [.5, -.5, -.5], [.5, -.5, .5], [-.5, -.5, .5]]], [[0, 0, 1], [[-.5, -.5, .5], [.5, -.5, .5], [.5, .5, .5], [-.5, .5, .5]]], [[0, 0, -1], [[.5, -.5, -.5], [-.5, -.5, -.5], [-.5, .5, -.5], [.5, .5, -.5]]]]; faces.forEach(([n, pts], f) => { pts.forEach((p, i) => v.push(...p, ...n, ...[[0, 0], [1, 0], [1, 1], [0, 1]][i])); ix.push(f * 4, f * 4 + 1, f * 4 + 2, f * 4, f * 4 + 2, f * 4 + 3); }); return [v, ix]; }
    function planeData() { return [[-.5, -.5, 0, 0, 0, 1, 0, 0, .5, -.5, 0, 0, 0, 1, 1, 0, .5, .5, 0, 0, 0, 1, 1, 1, -.5, .5, 0, 0, 0, 1, 0, 1], [0, 1, 2, 0, 2, 3]]; }
    function cylinderData(sides = 40) { const v = [], ix = []; for (let i = 0; i <= sides; i++) {
        let a = i / sides * TAU, x = Math.cos(a), z = Math.sin(a);
        v.push(x * .5, -.5, z * .5, x, 0, z, i / sides, 0, x * .5, .5, z * .5, x, 0, z, i / sides, 1);
        if (i < sides) {
            let b = i * 2;
            ix.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
        }
    } for (const y of [-.5, .5]) {
        let start = v.length / 8;
        v.push(0, y, 0, 0, y > 0 ? 1 : -1, 0, .5, .5);
        for (let i = 0; i <= sides; i++) {
            let a = i / sides * TAU;
            v.push(Math.cos(a) * .5, y, Math.sin(a) * .5, 0, y > 0 ? 1 : -1, 0, .5 + .5 * Math.cos(a), .5 + .5 * Math.sin(a));
            if (i < sides)
                ix.push(start, start + i + 1, start + i + 2);
        }
    } return [v, ix]; }
    function icoData() { const t = (1 + Math.sqrt(5)) / 2; let vertices = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(vec.norm); let faces = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]]; const cache = new Map(), mid = (a, b) => { const k = [a, b].sort((a, b) => a - b).join(':'); if (cache.has(k))
        return cache.get(k); const n = vertices.length; vertices.push(vec.norm(vertices[a].map((v, i) => (v + vertices[b][i]) / 2))); cache.set(k, n); return n; }; faces = faces.flatMap(([a, b, c]) => { let d = mid(a, b), e = mid(b, c), f = mid(c, a); return [[a, d, f], [b, e, d], [c, f, e], [d, e, f]]; }); const edges = [], seen = new Set(); faces.forEach(f => { for (let i = 0; i < 3; i++) {
        let a = f[i], b = f[(i + 1) % 3], k = [a, b].sort((a, b) => a - b).join(':');
        if (!seen.has(k)) {
            seen.add(k);
            edges.push([vertices[a], vertices[b]]);
        }
    } }); return { vertices, edges }; }
    function pathLength(pts) { let sum = 0; const distances = [0]; for (let i = 1; i < pts.length; i++) {
        sum += Math.hypot(...vec.sub(pts[i], pts[i - 1]));
        distances.push(sum);
    } return { sum, distances }; }
    function onPath(pts, t, lengths) { const { sum, distances } = lengths || pathLength(pts), d = clamp(t, 0, 1) * sum; for (let i = 1; i < pts.length; i++)
        if (d <= distances[i]) {
            const x = (d - distances[i - 1]) / (distances[i] - distances[i - 1] || 1);
            return pts[i].map((v, k) => mix(pts[i - 1][k], v, x));
        } return pts.at(-1); }
    function rr(c, x, y, w, h, r = 12) { c.beginPath(); if (c.roundRect)
        c.roundRect(x, y, w, h, r);
    else
        c.rect(x, y, w, h); }
    function drawLogo(c, x, y, size, image) { if (image) {
        const ratio = (image.naturalWidth || image.width) / (image.naturalHeight || image.height) || 1, ww = ratio >= 1 ? size : size * ratio, hh = ratio >= 1 ? size / ratio : size;
        c.drawImage(image, x + (size - ww) / 2, y + (size - hh) / 2, ww, hh);
        return;
    } }
    function drawIcon(c, name, x, y, size, color) { c.save(); c.translate(x, y); c.scale(size / 64, size / 64); c.strokeStyle = color; c.fillStyle = color; c.lineWidth = 2.7; c.lineJoin = 'round'; c.lineCap = 'round'; const line = points => { c.beginPath(); points.forEach((p, i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.stroke(); }; const circle = (x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); }; switch (name) {
        case 'database':
            for (let j = 0; j < 3; j++) {
                c.beginPath();
                c.ellipse(32, 16 + j * 14, 18, 7, 0, 0, TAU);
                c.stroke();
            }
            line([[14, 16], [14, 44]]);
            line([[50, 16], [50, 44]]);
            break;
        case 'file':
            line([[19, 7], [38, 7], [49, 18], [49, 56], [15, 56], [15, 7], [19, 7]]);
            line([[37, 8], [37, 20], [48, 20]]);
            for (let j = 0; j < 3; j++)
                line([[24, 30 + j * 7], [41, 30 + j * 7]]);
            break;
        case 'api':
            c.font = 'bold 21px Arial';
            c.textAlign = 'center';
            c.fillText('API', 32, 40);
            break;
        case 'table':
            rr(c, 10, 10, 44, 44, 2);
            c.stroke();
            for (let j = 1; j < 3; j++) {
                line([[10, 10 + j * 14.7], [54, 10 + j * 14.7]]);
                line([[10 + j * 14.7, 10], [10 + j * 14.7, 54]]);
            }
            break;
        case 'cloud':
            c.beginPath();
            c.moveTo(15, 47);
            c.bezierCurveTo(0, 47, 0, 27, 16, 26);
            c.bezierCurveTo(17, 5, 45, 4, 49, 25);
            c.bezierCurveTo(65, 25, 66, 48, 48, 48);
            c.lineTo(15, 48);
            c.stroke();
            break;
        case 'network':
            line([[16, 32], [43, 14]]);
            line([[16, 32], [43, 51]]);
            circle(13, 32, 7);
            circle(47, 11, 6);
            circle(47, 54, 6);
            break;
        case 'server':
            for (let j = 0; j < 3; j++) {
                rr(c, 12, 7 + j * 18, 40, 12, 2);
                c.stroke();
                circle(20, 13 + j * 18, 1);
                line([[29, 13 + j * 18], [44, 13 + j * 18]]);
            }
            break;
        case 'shield':
            line([[32, 5], [51, 12], [49, 34], [41, 49], [32, 57], [23, 49], [15, 34], [13, 12], [32, 5]]);
            line([[23, 29], [30, 37], [42, 22]]);
            break;
        case 'check':
            rr(c, 10, 10, 44, 44, 7);
            c.stroke();
            line([[20, 32], [29, 41], [44, 22]]);
            break;
        case 'gear':
            circle(32, 32, 15);
            circle(32, 32, 6);
            for (let j = 0; j < 8; j++) {
                let a = j * TAU / 8;
                line([[32 + 16 * Math.cos(a), 32 + 16 * Math.sin(a)], [32 + 24 * Math.cos(a), 32 + 24 * Math.sin(a)]]);
            }
            break;
        case 'brain':
            line([[28, 12], [22, 7], [13, 13], [12, 22], [6, 28], [9, 42], [17, 45], [20, 54], [29, 53], [29, 13]]);
            line([[36, 12], [42, 7], [51, 13], [52, 22], [58, 28], [55, 42], [47, 45], [44, 54], [35, 53], [35, 13]]);
            line([[14, 24], [22, 27], [22, 35], [15, 39]]);
            line([[49, 23], [42, 28], [42, 37], [49, 40]]);
            break;
        case 'agents':
            circle(32, 19, 8);
            circle(13, 26, 6);
            circle(51, 26, 6);
            c.beginPath();
            c.arc(32, 48, 13, PI, 0);
            c.stroke();
            line([[19, 48], [19, 55], [45, 55], [45, 48]]);
            c.beginPath();
            c.arc(12, 46, 9, PI, 0);
            c.stroke();
            c.beginPath();
            c.arc(52, 46, 9, PI, 0);
            c.stroke();
            break;
        case 'bars':
            for (let j = 0; j < 4; j++) {
                c.fillRect(12 + j * 11, 45 - j * 9, 6, 12 + j * 9);
            }
            break;
        case 'receipt':
            rr(c, 16, 6, 33, 50, 3);
            c.stroke();
            for (let j = 0; j < 5; j++)
                line([[24, 17 + j * 7], [41, 17 + j * 7]]);
            break;
    } c.restore(); }
    class Cube {
        static mount(root, config) { if (typeof root === 'string')
            root = document.querySelector(root); if (!root)
            throw new Error('AdvanexusCube: mount element nije pronađen.'); if (root.__advanexusCube)
            return root.__advanexusCube; const cube = new Cube(root, config); root.__advanexusCube = cube; return cube; }
        constructor(root, config = {}) {
            this.root = root;
            this.config = Object.assign({ accent: '#33e6a7', autoPlay: true, autoRotate: true, pixelRatio: 1.75, glow: .22, logoUrl: '', labels: ['Sources', 'advanexus', 'AI / LLM', 'AI agents'] }, config);
            this.scenario = this.config.scenario;
            this.accent = rgb(this.config.accent);
            this.root.style.setProperty('--ax-accent', this.config.accent);
            this.listeners = [];
            this.timers = [];
            this.meshes = [];
            this.lines = new Map();
            this.flows = [];
            this.resultCards = [];
            this.labels = [];
            this.textures = new Map();
            this.logoImage = null;
            this.logoRequest = 0;
            this.time = 0;
            this.yaw = .66;
            this.screenYaw = this.yaw;
            this.pitch = .28;
            this.zoom = 1;
            this.yawGoal = this.yaw;
            this.pitchGoal = this.pitch;
            this.zoomGoal = 1;
            this.explode = 0;
            this.explodeGoal = 0;
            this.visible = true;
            this.lost = false;
            this.disposed = false;
            this.lastFrame = 0;
            this.pointers = new Map();
            this.homeYaw = this.yaw;
            this.manualView = false;
            this.idleSeconds = 0;
            this.returnView = null;
            this.lastPinch = 0;
            this.motion = matchMedia('(prefers-reduced-motion: reduce)');
            this.reduced = this.motion.matches;
            if (this.reduced) this.time = STORY.visual + .5;
            this.running = Boolean(this.config.autoPlay && !this.reduced);
            this.autoRotate = Boolean(this.config.autoRotate && !this.reduced);
            this.glow = this.config.glow;
            this.stage = root.querySelector('[data-stage]');
            this.canvas = document.createElement('canvas');
            this.canvas.tabIndex = 0;
            this.canvas.setAttribute('role', 'img');
            this.canvas.setAttribute('aria-label', this.config.accessibleLabel || '3D illustration');
            this.canvas.setAttribute('aria-describedby', 'axc-description');
            this.stage.append(this.canvas);
            try {
                this.engine = new Engine(this.canvas);
                this.build();
                this.mobileLabels = document.createElement('div');
                this.mobileLabels.className = 'axc-mobile-labels';
                this.mobileLabels.setAttribute('aria-hidden', 'true');
                this.config.labels.forEach((text, i) => { const label = document.createElement('span'); label.className = 'axc-mobile-label'; label.textContent = text; label.dataset.layer = i; this.mobileLabels.append(label); });
                this.root.append(this.mobileLabels);
                this.ready = true;
                this.bind();
                this.resize();
                this.root.querySelector('[data-fallback]').hidden = true;
                this.updateButtons();
                this.schedule();
                if (this.config.logoUrl)
                    this.setLogo(this.config.logoUrl).catch(() => this.logoMessage('Logo nije učitan. Početni znak ostaje prikazan.'));
            }
            catch (e) {
                this.showFallback(this.config.accessibleLabel || this.root.dataset.cubeDescription || '');
                this.error = e.message;
                this.running = false;
                this.autoRotate = false;
                this.root.querySelectorAll('button,input').forEach(e => e.disabled = true);
                this.updateButtons();
                console.error('AdvanexusCube:', e);
            }
        }
        listen(el, event, handler, options) { el.addEventListener(event, handler, options); this.listeners.push(() => el.removeEventListener(event, handler, options)); }
        mesh(geo, p, s, r, mat = {}, layer = 0) { const m = Object.assign({ geo, p: p || [0, 0, 0], s: s || [1, 1, 1], r: r || [0, 0, 0], color: rgb('#244137'), opacity: 1, lit: true, gloss: .25, layer, transparent: false }, mat); m.model = compose(m.p, m.s, m.r); this.meshes.push(m); return m; }
        box(p, s, mat = {}, layer = 0) { return this.mesh(this.boxGeo, p, s, [0, 0, 0], mat, layer); }
        plane(p, s, r, mat = {}, layer = 0) { return this.mesh(this.planeGeo, p, [s[0], s[1], 1], r, mat, layer); }
        line(a, b, color = '#729f8e', opacity = .28, layer = 0, key = '') { const k = key || `${color}|${opacity}|${layer}`; if (!this.lines.has(k))
            this.lines.set(k, { v: [], color: rgb(color), opacity, layer, key: k }); this.lines.get(k).v.push(...a, 0, 1, 0, 0, 0, ...b, 0, 1, 0, 0, 0); }
        outline(p, s, color = '#6c9987', opacity = .35, layer = 0, key = '') { let [x, y, z] = p, [w, h, d] = s, w2 = w / 2, h2 = h / 2, d2 = d / 2; const v = [[-w2, -h2, -d2], [w2, -h2, -d2], [w2, -h2, d2], [-w2, -h2, d2], [-w2, h2, -d2], [w2, h2, -d2], [w2, h2, d2], [-w2, h2, d2]].map(v => [v[0] + x, v[1] + y, v[2] + z]); [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => this.line(v[a], v[b], color, opacity, layer, key)); }
        ring(p, r, color, opacity, layer = 0, key = '', segments = 90) { for (let i = 0; i < segments; i++) {
            const a = i / segments * TAU, b = (i + 1) / segments * TAU;
            this.line([p[0] + Math.cos(a) * r, p[1], p[2] + Math.sin(a) * r], [p[0] + Math.cos(b) * r, p[1], p[2] + Math.sin(b) * r], color, opacity, layer, key);
        } }
        canvasTexture(key, w, h, draw) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const texture = this.engine.texture(cv); this.textures.set(key, { texture, canvas: cv, draw }); return texture; }
        iconTexture(name) { const key = 'icon-' + name; if (this.textures.has(key))
            return this.textures.get(key).texture; return this.canvasTexture(key, 256, 256, c => drawIcon(c, name, 43, 43, 170, '#d4eee2')); }
        logoTexture() { return this.canvasTexture('logo', 512, 512, c => drawLogo(c, 30, 30, 452, this.logoImage)); }
        labelTexture(index) { return this.canvasTexture('label-' + index, 1024, 160, c => { if (index !== 1)
            drawIcon(c, ['database', 'gear', 'brain', 'agents'][index], 18, 33, 86, '#a8e9d1'); c.font = `${index === 1 ? '600' : '450'} 76px Arial`; c.fillStyle = this.config.labelColor || (index === 1 ? '#d2ffee' : '#e4f2ec'); c.textBaseline = 'middle'; c.fillText(this.config.labels[index], index === 1 ? 24 : 140, 84); }); }
        setLabelColor(color) {
            if (!this.ready || this.disposed || color === this.config.labelColor) return;
            this.config.labelColor = color;
            for (let i = 0; i < 4; i++) {
                const item = this.textures.get('label-' + i), c = item.canvas.getContext('2d');
                c.clearRect(0, 0, item.canvas.width, item.canvas.height);
                item.draw(c);
                this.engine.updateTexture(item.texture, item.canvas);
            }
            this.schedule();
        }
        roundedRoute(pts) { const out = [pts[0]]; for (let i = 1; i < pts.length - 1; i++) {
            const a = pts[i - 1], b = pts[i], c = pts[i + 1], ab = Math.hypot(...vec.sub(b, a)), bc = Math.hypot(...vec.sub(c, b)), r = Math.min(.14, ab * .32, bc * .32);
            const p = b.map((v, k) => v + (a[k] - v) * r / ab), q = b.map((v, k) => v + (c[k] - v) * r / bc);
            out.push(p);
            for (let j = 1; j <= 5; j++) {
                const t = j / 5;
                out.push(p.map((v, k) => (1 - t) * (1 - t) * v + 2 * (1 - t) * t * b[k] + t * t * q[k]));
            }
        } out.push(pts.at(-1)); return out; }
        routeTubes(points, radius, pattern = 'solid') { const v = []; for (let j = 1; j < points.length; j++) {
            const a = points[j - 1], b = points[j];
            if (Math.hypot(...vec.sub(b, a)) < 1e-7)
                continue;
            if (pattern === 'event' || pattern === 'file') {
                const segments = pattern === 'event' ? 8 : 5;
                for (let k = 0; k < segments; k++) {
                    if (pattern === 'event' && k % 2) continue;
                    if (pattern === 'file' && k % 3 === 2) continue;
                    const point = share => a.map((value, index) => value + (b[index] - value) * share);
                    v.push(...this.routeTubes([point(k / segments), point((k + .62) / segments)], radius));
                }
                continue;
            }
            const t = vec.norm(vec.sub(b, a)), axis = Math.abs(t[1]) > .9 ? [1, 0, 0] : [0, 1, 0], u = vec.norm(vec.cross(t, axis)), w = vec.cross(t, u);
            for (let i = 0; i < 6; i++) {
                const aa = i / 6 * TAU, bb = (i + 1) / 6 * TAU, n = u.map((x, k) => x * Math.cos(aa) + w[k] * Math.sin(aa)), m = u.map((x, k) => x * Math.cos(bb) + w[k] * Math.sin(bb));
                const p = a.map((x, k) => x + n[k] * radius), q = a.map((x, k) => x + m[k] * radius), r = b.map((x, k) => x + n[k] * radius), s = b.map((x, k) => x + m[k] * radius);
                [[p, n], [q, m], [r, n], [q, m], [s, m], [r, n]].forEach(([p, n]) => v.push(...p, ...n, 0, 0));
            }
        } return v; }
        routeLines(points) { const vertices = []; for (let i = 1; i < points.length; i++)
            vertices.push(...points[i - 1], 0, 1, 0, 0, 0, ...points[i], 0, 1, 0, 0, 0); return vertices; }
        flow(pts, type, offset = 0, color = this.config.accent, options = {}) { pts = pts.filter((p, i) => i === 0 || Math.hypot(...vec.sub(p, pts[i - 1])) > 1e-6); pts = this.roundedRoute(pts); const stage = FLOW_STAGES[type.split('-')[0]] || [0, 26]; const f = { pts, type, offset, color: rgb(color), lengths: pathLength(pts), radius: options.radius || .018, particleSize: options.particleSize || 11, trail: options.trail || 2, opacity: .9, start: options.start ?? stage[0], end: options.end ?? stage[1] }; this.flows.push(f); for (let i = 1; i < pts.length; i++)
            this.line(pts[i - 1], pts[i], color, f.opacity, 0, 'route-' + type); return f; }
        build() {
            const E = this.engine;
            this.boxGeo = E.geometry(...boxData());
            this.planeGeo = E.geometry(...planeData());
            this.cylinderGeo = E.geometry(...cylinderData());
            this.logo = this.logoTexture();
            this.glowTex = this.canvasTexture('glow', 128, 128, (c, w, h) => { let g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(82,255,189,.72)'); g.addColorStop(.2, 'rgba(30,220,139,.20)'); g.addColorStop(.5, 'rgba(15,150,95,.045)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
            const W = 7.15, D = 5.8, H = 1.55;
            this.W = W;
            this.D = D;
            this.H = H;
            const baseOpacity = Number.isFinite(this.config.baseOpacity) ? clamp(this.config.baseOpacity, 0, 1) : 1;
            this.box([0, -.06, 0], [W + .06, .12, D + .06], { color: rgb('#0f1c16'), opacity: baseOpacity, transparent: baseOpacity < 1, gloss: .65 });
            this.outline([0, -.03, 0], [W + .06, .15, D + .06], '#8eb5a1', .43);
            // Five floors enclose four transparent chambers.
            for (let level = 0; level < 5; level++) {
                const y = level * H, main = level === 1 || level === 2;
                this.box([0, y, 0], [W, .032, D], { color: rgb(main ? '#26674c' : '#3d6152'), opacity: main ? .10 : .055, transparent: true, lit: false, gloss: 0, crisp: true }, level);
                this.outline([0, y, 0], [W, .038, D], main ? '#67efb6' : '#98bfae', main ? .80 : .48, level, 'tray-' + level);
                if (level < 4) {
                    for (let s = 0; s < 4; s++) {
                        const front = s % 2 === 0;
                        const pos = s === 0 ? [0, y + H / 2, D / 2] : s === 1 ? [W / 2, y + H / 2, 0] : s === 2 ? [0, y + H / 2, -D / 2] : [-W / 2, y + H / 2, 0];
                        this.plane(pos, [front ? W : D, H - .06], [0, s * PI / 2, 0], { color: rgb(level === 1 ? '#329869' : '#84ad97'), opacity: level === 1 ? .038 : .021, transparent: true, lit: false, gloss: .18 }, level);
                    }
                    for (const x of [-W / 2, W / 2])
                        for (const z of [-D / 2, D / 2]) {
                            if (level === 1)
                                this.outline([x, y + H / 2, z], [.045, H - .06, .045], '#67efb6', .58, level, 'posts-1');
                            else
                                this.line([x, y + .03, z], [x, y + H - .03, z], '#aad6c1', .48, level, 'posts-' + level);
                        }
                    const texture = this.labelTexture(level);
                    for (let s = 0; s < 4; s++) {
                        const p = this.layerLabelPosition(level, s);
                        const label = this.plane(p, [3.35, .525], [0, s * PI / 2, 0], { texture, color: [1, 1, 1], opacity: s === 0 ? 1 : 0, transparent: true, lit: false, gloss: 0 }, level);
                        label.side = s;
                        label.crisp = true;
                        this.labels.push(label);
                    }
                }
            }
            // Source icons represent infrastructure, not vendors.
            this.sourcePositions = [];
            this.selectedSources = new Set();
            const sourceTypes = ['database', 'file', 'api', 'table', 'network', 'cloud', 'server'];
            for (let i = 0; i < 7; i++) {
                let x = -2.82 + i * .94, z = 2.10, y = .13;
                this.sourcePositions.push([x, .83, z]);
                this.box([x, y, z], [.79, .19, .76], { color: rgb('#1a2b23'), gloss: .65 });
                this.outline([x, y + .04, z], [.78, .16, .75], '#668575', .27);
                if (i === 0) {
                    this.mesh(this.cylinderGeo, [x, .53, z], [.56, .69, .56], [], { color: rgb('#718880'), gloss: .8 });
                    for (let j = 0; j < 4; j++)
                        this.ring([x, .27 + j * .19, z], .282, '#b5ccbd', .55, 0, 'database-rims');
                }
                else {
                    const h = i === 6 ? .92 : .65;
                    this.box([x, .26 + h / 2, z], [.59, h, .33], { color: rgb('#42594e'), gloss: .7 });
                    this.outline([x, .26 + h / 2, z], [.6, h, .34], '#6f9b83', .35);
                    this.plane([x, .26 + h / 2, z + .215], [.51, .51], [0, 0, 0], { texture: this.iconTexture(sourceTypes[i]), color: [1, 1, 1], lit: false, opacity: .88, transparent: true });
                    this.plane([x + .34, .26 + h / 2, z], [.29, .38], [0, PI / 2, 0], { texture: this.iconTexture(sourceTypes[i]), color: rgb('#9bbfa9'), lit: false, opacity: .6, transparent: true });
                }
            }
            for (let row = 0; row < 2; row++)
                for (let i = 0; i < 6; i++) {
                    const x = -2.6 + i * 1.04, z = .58 - row * 1.76, h = .28 + ((i + row) % 3) * .09;
                    this.box([x, .11, z], [.66, .16, .66], { color: rgb('#12261b'), gloss: .5 });
                    this.box([x, .24 + h / 2, z], [.46, h, .43], { color: rgb('#294537'), gloss: .55 });
                    this.outline([x, .24 + h / 2, z], [.47, h, .44], '#416e57', .3);
                    this.plane([x, .25 + h / 2, z + .262], [.30, .30], [0, 0, 0], { texture: this.iconTexture(sourceTypes[(i + row * 2) % 7]), color: rgb('#8cae9b'), opacity: .65, transparent: true, lit: false });
                    this.sourcePositions.push([x, .24 + h, z]);
                }
            // The official symbol floats at the centre; processing rings carry the control story.
            const hubY = 2.48;
            this.hubY = hubY;
            this.hubPosition = [0, hubY, 0];
            this.box([0, 1.71, 0], [1.82, .17, 1.62], { color: rgb('#153725'), gloss: .7 }, 1);
            this.outline([0, 1.77, 0], [1.84, .19, 1.64], '#88ffd0', .82, 1, 'hub-frame');
            this.hubLogos = [this.plane([0, hubY, 0], [1.35, 1.35], [0, 0, 0], { texture: this.logo, color: [1, 1, 1], lit: false, transparent: true }, 1)];
            this.hubLogos[0].billboard = true;
            this.hubLogos[0].crisp = true;
            this.ring([0, 1.83, 0], 1.25, '#42dc9f', .25, 1, 'hub-circuit');
            this.ring([0, 2.08, 0], .94, '#67efb6', .40, 1, 'hub-circuit');
            this.ring([0, 2.48, 0], .88, '#42dc9f', .42, 1, 'hub-circuit');
            this.ring([0, 2.88, 0], .58, '#b2ffdc', .5, 1, 'hub-circuit');
            this.hubGlow = this.plane([0, hubY, 0], [3.3, 3.3], [0, 0, 0], { texture: this.glowTex, color: [.6, 1, .78], opacity: .24, lit: false, transparent: true, additive: true }, 1);
            this.hubGlow.billboard = true;
            const controls = [[-2.38, 2.40, .30, 'shield'], [2.39, 2.40, .35, 'gear'], [-1.8, 2.34, -1.65, 'check'], [1.95, 2.46, -1.67, 'receipt']];
            this.controlTiles = [];
            for (const [x, y, z, name] of controls) {
                const b = this.box([x, y, z], [.69, .81, .08], { color: rgb('#143528'), opacity: .88, transparent: true, gloss: .5 }, 1);
                this.outline([x, y, z], [.71, .83, .095], '#82bda0', .66, 1, 'controls');
                this.plane([x, y, z + .055], [.52, .57], [0, 0, 0], { texture: this.iconTexture(name), color: [.76, 1, .86], lit: false, transparent: true }, 1);
                this.controlTiles.push(b);
                this.flow([this.hubPosition, [x, hubY, 0], [x, hubY, z], [x, y, z]], 'control', 0, this.config.accent, { particleSize: 8 });
            }
            this.evidenceTile = this.controlTiles[3];
            // Selected inputs animate only on their routes.
            this.sourcePositions.slice(0, sourceTypes.length).forEach((p, i) => {
                const pathY = 1.67 + (i % 4) * .065, x = p[0], z = p[2];
                const sx = (i % 2 ? 1 : -1) * (.38 + (i % 3) * .06);
                const pts = [p, [x, pathY, z], [x, pathY, z * .40], [sx, pathY, z * .40], [sx, pathY, 0], [sx, hubY, 0], this.hubPosition];
                const styles = {
                    database: { name: 'batch' },
                    table: { name: 'batch' },
                    cloud: { name: 'stream' },
                    api: { name: 'api' },
                    network: { name: 'event' },
                    server: { name: 'event' },
                    file: { name: 'file' }
                };
                const style = styles[sourceTypes[i % sourceTypes.length]];
                const chosen = this.scenario?.participating_sources;
                if (!Array.isArray(chosen) || chosen.includes(sourceTypes[i]) || chosen.includes(style.name)) {
                    this.selectedSources.add(i);
                    this.flow(pts, 'input-' + style.name, 0, this.config.accent, { particleSize: 6.5 });
                }
            });
            // The exact live HERO wave surrounds the model.
            this.orbPosition = [0, 3.96, 0];
            this.flow([this.hubPosition, this.orbPosition], 'context', 0, this.config.accent, { particleSize: 8 });
            this.ico = icoData();
            const orbVerts = [];
            this.ico.edges.forEach(([a, b]) => orbVerts.push(...a, 0, 1, 0, 0, 0, ...b, 0, 1, 0, 0, 0));
            this.orb = this.mesh(E.geometry(orbVerts, null, E.gl.LINES), this.orbPosition, [.55, .55, .55], [0, 0, 0], { color: rgb('#86e4bd'), opacity: .7, lit: false, transparent: true, emission: .25 }, 2);
            this.orbGlow = this.plane(this.orbPosition, [2.0, 2.0], [0, 0, 0], { texture: this.glowTex, color: [.8, 1, .9], opacity: .27, transparent: true, lit: false, additive: true }, 2);
            this.orbGlow.billboard = true;
            this.waveMesh = this.mesh(E.geometry([], null, E.gl.LINES), [0, 0, 0], [1, 1, 1], [], { color: rgb('#419e7c'), opacity: .19, lit: false, transparent: true }, 2);
            // Agent screens stay inside the upper chamber.
            const agentSlots = [-2.55, 0, 2.55];
            for (let i = 0; i < 3; i++) {
                const slot = agentSlots[i];
                const x = Math.cos(this.screenYaw) * slot, z = -Math.sin(this.screenYaw) * slot;
                this.box([x, 4.82, z], [1.2, .1, 1.1], { color: rgb('#193d2b'), opacity: .7, transparent: true, gloss: .6 }, 3).screenGroup = true;
                this.outline([x, 4.83, z], [1.22, .11, 1.12], '#5d9f7a', .35, 3, 'agent-pads');
                this.plane([x, 4.884, z], [.7, .7], [-PI / 2, 0, 0], { texture: this.iconTexture('agents'), color: rgb('#6ceab0'), opacity: .62, lit: false, transparent: true }, 3).screenGroup = true;
            }
            this.makeConversationScreen();
            this.flow([this.orbPosition, [0, 4.92, 0]], 'output', 0, this.config.accent, { particleSize: 8 });
            // Answer and charts share the upper chamber.
            this.makeResultCard(-2.55, 5.39, 'donut');
            this.makeResultCard(2.55, 5.39, 'bars');
            for (const card of this.resultCards) {
                const flow = this.flow([[0, 5.15, 0], card.panel.p], 'result', 0, this.config.accent, { particleSize: 8 });
                flow.panel = card.panel;
                flow.slot = card.slot;
            }
            // Batch routes separately for consistent expansion.
            this.inputRoutes = [];
            this.lines.forEach(batch => { if (batch.key.startsWith('route-')) {
                batch.v = batch.key.startsWith('route-input-') ? [] : this.flows.filter(f => ('route-' + f.type) === batch.key).flatMap(f => this.routeLines(f.pts));
                batch.tubular = false;
            }
            else if (batch.opacity >= .32) {
                const v = [];
                for (let i = 0; i < batch.v.length; i += 16)
                    v.push(...this.routeTubes([batch.v.slice(i, i + 3), batch.v.slice(i + 8, i + 11)], batch.key.startsWith('tray-') || batch.key === 'posts-1' ? .010 : .008));
                batch.v = v;
                batch.tubular = true;
            } const m = this.mesh(E.geometry(batch.v, null, batch.tubular ? E.gl.TRIANGLES : E.gl.LINES), [0, 0, 0], [1, 1, 1], [0, 0, 0], { color: batch.color, opacity: batch.opacity, lit: false, transparent: true, gloss: 0, crisp: /^(tray|posts|route)-/.test(batch.key) }, batch.layer); m.lineKey = batch.key; m.originalVertices = batch.v; m.screenGroup = batch.key === 'agent-pads'; if (batch.key === 'route-result') this.resultRoute = m; if (batch.key === 'route-output') this.outputRoute = m; if (batch.key.startsWith('route-input-')) { m.inputRoute = true; this.inputRoutes.push(m); } if (batch.key.startsWith('route-')) {
                m.isRoute = true;
                m.emission = .10;
                m.opacity = .90;
            } });
        }
        drawConversationScreen(ctx, width, height, questionChars, answerChars, thinkingFrame) {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(6, 23, 18, .98)';
            rr(ctx, 8, 8, width - 16, height - 16, 26);
            ctx.fill();
            ctx.strokeStyle = '#4f9b77';
            ctx.lineWidth = 5;
            rr(ctx, 8, 8, width - 16, height - 16, 26);
            ctx.stroke();
            ctx.fillStyle = '#286247';
            ctx.fillRect(40, 38, width - 80, 7);
            const rtl = document.documentElement.dir === 'rtl';
            const row = (text, y, answer, visibleChars) => {
                const right = answer !== rtl;
                const iconX = right ? width - 75 : 75;
                ctx.fillStyle = answer ? '#69e7ad' : '#c9e5d6';
                ctx.beginPath();
                ctx.arc(iconX, y, 32, 0, TAU);
                ctx.fill();
                ctx.fillStyle = '#0a261c';
                ctx.font = 'bold 45px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(answer ? '✓' : '?', iconX, y + 15);
                ctx.fillStyle = '#edf9f2';
                ctx.direction = rtl ? 'rtl' : 'ltr';
                ctx.textAlign = rtl ? 'right' : 'left';
                const words = String(text).trim().split(/\s+/);
                let lines = [], size = 48;
                for (; size >= 30; size -= 2) {
                    ctx.font = `600 ${size}px Arial`;
                    lines = [];
                    let line = '';
                    for (const word of words) {
                        const next = line ? `${line} ${word}` : word;
                        if (line && ctx.measureText(next).width > width - 205) {
                            lines.push(line);
                            line = word;
                        } else line = next;
                    }
                    if (line) lines.push(line);
                    if (lines.length <= 3 &&
                        lines.every(item => ctx.measureText(item).width <= width - 205)) break;
                }
                const x = rtl ? width - 145 : 145;
                let remaining = visibleChars;
                const displayed = lines.slice(0, 3);
                if (lines.length > 3) {
                    let last = displayed[2];
                    while (last && ctx.measureText(`${last}…`).width > width - 205) last = last.slice(0, -1);
                    displayed[2] = `${last}…`;
                }
                displayed.forEach((line, index) => {
                    const letters = Array.from(line);
                    const visible = letters.slice(0, Math.max(0, remaining)).join('');
                    const baseline = displayed.length === 1 ? y + 15 : displayed.length === 2 ? y - 15 + index * 58 : y - 48 + index * 48;
                    if (visible) ctx.fillText(visible, x, baseline, width - 205);
                    remaining -= letters.length + 1;
                });
                ctx.strokeStyle = answer ? '#3f9e72' : '#527d65';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(46, y + 82);
                ctx.lineTo(width - 46, y + 82);
                ctx.stroke();
            };
            row(this.config.question, 128, false, questionChars);
            if (thinkingFrame >= 0) {
                ctx.fillStyle = '#69e7ad';
                for (let index = 0; index < 3; index++) {
                    ctx.globalAlpha = index === thinkingFrame ? 1 : .32;
                    ctx.beginPath();
                    ctx.arc(145 + index * 38, 340, 10, 0, TAU);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            } else if (answerChars > 0) row(this.config.answer, 340, true, answerChars);
        }
        makeConversationScreen() {
            const texture = this.canvasTexture('conversation', 1024, 486,
                (ctx, width, height) => this.drawConversationScreen(ctx, width, height, 0, 0, -1));
            const bubble = this.plane([0, 5.56, 0], [3.25, 1.32], [-.28, this.screenYaw, 0], {
                texture, color: [1, 1, 1], opacity: 1, lit: false, transparent: true, gloss: 0
            }, 3);
            bubble.conversationScreen = true;
            bubble.screenGroup = true;
            this.conversationMesh = bubble;
            bubble.crisp = true;
            this.conversationStateKey = '';
        }
        drawResultCard(ctx, width, height, kind, progress) {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = '#102b21';
            rr(ctx, 5, 5, width - 10, height - 10, 28);
            ctx.fill();
            ctx.strokeStyle = '#79b99b';
            ctx.lineWidth = 4;
            rr(ctx, 5, 5, width - 10, height - 10, 28);
            ctx.stroke();
            ctx.fillStyle = '#e9f6ef';
            ctx.font = 'bold 42px Arial';
            if (kind === 'donut') {
                ctx.fillText(`${this.scenario.passed} / ${this.scenario.review}`, 34, 70);
                ctx.strokeStyle = '#315544';
                ctx.lineWidth = 28;
                ctx.beginPath();
                ctx.arc(width / 2, 216, 102, 0, TAU);
                ctx.stroke();
                const start = -PI / 2;
                const passedAngle = TAU * this.scenario.passed / this.scenario.total;
                ctx.strokeStyle = '#55e2a5';
                ctx.beginPath();
                ctx.arc(width / 2, 216, 102, start, start + passedAngle * progress);
                ctx.stroke();
                ctx.strokeStyle = '#c1ffe0';
                ctx.beginPath();
                ctx.arc(width / 2, 216, 102, start + passedAngle * progress, start + TAU * progress);
                ctx.stroke();
            } else {
                ctx.fillText(String(this.scenario.review), 34, 70);
                const parts = [this.scenario.missing, this.scenario.mismatch];
                parts.forEach((value, index) => {
                    const x = index === 0 ? 125 : 335;
                    const barHeight = value / this.scenario.review * 210 * progress;
                    ctx.fillStyle = index === 0 ? '#55e2a5' : '#c1ffe0';
                    ctx.fillRect(x, 310 - barHeight, 60, barHeight);
                    ctx.fillStyle = '#e9f6ef';
                    ctx.font = 'bold 38px Arial';
                    ctx.fillText(`${value} ${index === 0 ? '?' : '≠'}`, x - 14, 365);
                });
            }
        }
        makeResultCard(slot, height, kind) {
            const key = 'result-' + kind;
            const texture = this.canvasTexture(key, 512, 384, (ctx, width, height) => this.drawResultCard(ctx, width, height, kind, 0));
            const panel = this.plane([Math.cos(this.screenYaw) * slot, height, -Math.sin(this.screenYaw) * slot],
                [1.40, 1.0], [-.28, this.screenYaw, 0], {
                texture, color: [1, 1, 1], opacity: 1, lit: false, transparent: true, gloss: 0
            }, 3);
            panel.resultPanel = true;
            panel.screenGroup = true;
            panel.crisp = true;
            this.resultCards.push({ kind, texture: this.textures.get(key), progress: 0, panel, slot });
        }
        shift(y, layer) { return y + this.explode * (layer === 4 ? 3 : layer); }
        expandPoint(p) { const offset = [1.55, 3.1, 4.65].reduce((s, y) => s + smooth(y - .17, y + .17, p[1]), 0); return [p[0], p[1] + this.explode * offset, p[2]]; }
        updateStoryOpacity(mesh, cycle, phase, dominant) {
            const endFade = 1 - smooth(STORY.fade, STORY.cycle, cycle);
            const enabled = this.selectedSources?.size !== 0;
            if (mesh.conversationScreen) mesh.opacity = smooth(0, .22, cycle) * endFade;
            if (mesh.resultPanel) mesh.opacity = enabled ? smooth(21, 24, phase) * endFade : 0;
            const stage = FLOW_STAGES[mesh.lineKey?.split('-')[1]];
            if (stage) {
                const start = phaseTime(stage[0]), end = phaseTime(stage[1]);
                mesh.opacity = enabled ? .5 * smooth(start - .06, start + .06, cycle) * (1 - smooth(end, end + .18, cycle)) : 0;
            }
            if (mesh.side !== undefined) mesh.opacity = mesh.side === dominant && this.width >= LABEL_OVERLAY_WIDTH ? 1 : 0;
            // Structural material opacity stays fixed.
        }
        updateScene(dt) {
            const t = this.time, cycle = t % STORY.cycle, phase = storyPhase(cycle);
            this.root.dataset.storyPhase = cycle < STORY.question ? 'question' : cycle < STORY.answer ? 'answer' : 'visual';
            const visibleChars = (text, start, duration) => {
                const length = Array.from(text).length;
                const progress = clamp((cycle - start) / duration, 0, 1);
                return progress >= 1 ? length : Math.floor(progress * length / 2) * 2;
            };
            const questionChars = visibleChars(this.config.question, 0, STORY.question);
            const answerChars = visibleChars(this.config.answer, STORY.thinking, STORY.answer - STORY.thinking);
            const thinkingFrame = cycle >= STORY.question && cycle < STORY.thinking ? Math.floor((cycle - STORY.question) * 6) % 3 : -1;
            const stateKey = `${questionChars}:${answerChars}:${thinkingFrame}`;
            if (stateKey !== this.conversationStateKey) {
                this.conversationStateKey = stateKey;
                const { canvas, texture } = this.textures.get('conversation');
                this.drawConversationScreen(canvas.getContext('2d'), canvas.width, canvas.height,
                    questionChars, answerChars, thinkingFrame);
                const gl = this.engine.gl;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
            }
            const hasInput = this.selectedSources?.size !== 0;
            const processing = hasInput ? smooth(8, 9, phase) * (1 - smooth(10, 11, phase)) : 0;
            const output = hasInput ? smooth(21, 24, phase) : 0;
            let dominant = Math.round(this.yaw / (PI / 2));
            dominant = ((dominant % 4) + 4) % 4;
            for (const m of this.meshes) {
                let p = [...m.p];
                p[1] = this.shift(p[1], m.layer);
                let s = [...m.s], r = [...m.r];
                if (m === this.orb)
                    r = [.1 * Math.sin(t * .15), t * .19, t * .085];
                if (m.billboard)
                    r = [-this.pitch, this.yaw, 0];
                if (m === this.hubGlow)
                    m.opacity = .18 + .08 * processing + .04 * (1 + Math.sin(t * 2.8)) / 2;
                if (m === this.orbGlow)
                    m.opacity = .20 + .09 * (hasInput ? smooth(10, 13, phase) : 0);
                this.updateStoryOpacity(m, cycle, phase, dominant);
                if (m.lineKey === 'ground-grid' || m === this.floor)
                    m.hidden = this.config.ground === false || this.pitch < -.05;
                if (m.screenGroup) {
                    p = this.screenPoint(p);
                    r[1] = (r[1] || 0) + this.yaw - this.screenYaw;
                    if (m.resultPanel || m.conversationScreen) r[0] = -this.pitch;
                }
                m.model = compose(p, s, r);
            }
            this.updateResultRoutes();
            const cardProgress = Math.round(output * 30) / 30;
            for (const card of this.resultCards) {
                if (card.progress === cardProgress) continue;
                card.progress = cardProgress;
                const { canvas, texture } = card.texture;
                this.drawResultCard(canvas.getContext('2d'), canvas.width, canvas.height, card.kind, cardProgress);
                const gl = this.engine.gl;
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
            }
            const particles = [], inputVertices = new Map(), push = (p, col, size, layer = null) => { const q = layer === null ? this.expandPoint(p) : [p[0], this.shift(p[1], layer), p[2]]; particles.push(...q, ...col, size); };
            // Point wave grid. Its motion pauses with the same scene clock.
            const waveVertices = [];
            const waveGrid = [];
            const waveResponse = .62 + .38 * smooth(14, 18, phase);
            for (let ix = 0; ix < 63; ix++)
                for (let iz = 0; iz < 25; iz++) {
                    const x = -3.32 + ix * .107, z = -2.33 + iz * .184;
                    const radius = Math.hypot(x, z);
                    const y = 3.89 + .33 * Math.sin(x * 2.1 + t * .77) + .18 * Math.sin(z * 2.6 - x * .83 + t * .63);
                    const b = waveResponse * (.6 + .4 * Math.sin(ix * .11 + iz * .06 + t * .15));
                    waveGrid[ix * 25 + iz] = [x, y, z];
                    if (radius >= .72)
                        push([x, y, z], [.19 * b, .55 * b, .42 * b], 1.8, 2);
                }
            for (let x = 1; x < 63; x++)
                for (let z = 0; z < 25; z += 2) {
                    const a = waveGrid[(x - 1) * 25 + z], b = waveGrid[x * 25 + z];
                    if (Math.hypot(a[0], a[2]) > .72 && Math.hypot(b[0], b[2]) > .72)
                        waveVertices.push(...a, 0, 1, 0, 0, 0, ...b, 0, 1, 0, 0, 0);
                }
            const gl = this.engine.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.waveMesh.geo.buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(waveVertices), gl.DYNAMIC_DRAW);
            this.waveMesh.geo.count = waveVertices.length / 8;
            for (const v of this.ico.vertices) {
                const p = pointTransform(this.orb.model, v);
                particles.push(...p, .57, .98, .76, 4.4);
            }
            for (const p of this.sourcePositions)
                push(p, [.12, .55, .32], 3.2, 0);
            // Additional low-level inflow around the source layer makes data feel generated from below.
            this.sourcePositions.forEach((p, i) => {
                const swirlCount = this.width < 640 ? 5 : 8;
                for (let j = 0; j < swirlCount; j++) {
                    const angle = t * (.72 + i * .04) + j / swirlCount * TAU + i * .5;
                    const radius = .14 + (j % 3) * .08;
                    const x = p[0] + Math.cos(angle) * radius;
                    const z = p[2] + .08 + Math.sin(angle) * radius * .86;
                    const y = .06 + ((t * (.55 + j * .03) + i * .2 + j * .17) % 1) * .82;
                    const glow = .65 + .35 * Math.sin(t * 2 + j + i);
                    push([x, y, z], [.24 * glow, .94 * glow, .73 * glow], this.width < 640 ? 2.8 : 3.4, 0);
                }
                for (let j = 0; j < 4; j++) {
                    const rise = ((t * (.42 + j * .06) + i * .16 + j * .2) % 1);
                    const x = p[0] + (j - 1.5) * .07;
                    const z = p[2] + .68 - rise * .62;
                    const y = -.36 + rise * 1.15;
                    push([x, y, z], [.18, .74, .55], 2.6 + j * .15, 0);
                }
            });
            // Dots on the floors establish endpoints even when no data packet is in transit.
            for (let k = 0; k < 18; k++) {
                const x = -3 + (k % 6) * 1.2, z = -2 + Math.floor(k / 6) * 1.85;
                push([x, 6.24, z], [.08, .35, .23], 2.8, 3);
            }
            this.flows.forEach(f => {
                const kind = f.type.split('-')[0], start = f.start, end = f.end;
                if (!hasInput || cycle < phaseTime(start) || cycle >= phaseTime(end)) return;
                const pos = clamp((phase - start) / (end - start), 0, 1);
                if (kind === 'input') {
                    const key = 'route-' + f.type;
                    if (!inputVertices.has(key)) inputVertices.set(key, []);
                    inputVertices.get(key).push(...this.routeLines(f.pts.map(p => this.expandPoint(p))));
                    push(onPath(f.pts, pos, f.lengths), f.color, f.particleSize);
                    return;
                }
                const layer = kind === 'result' || kind === 'output' ? 0 : null;
                push(onPath(f.pts, pos, f.lengths), f.color, f.particleSize, layer);
                if (phase <= end) for (let trail = 1; trail <= f.trail; trail++)
                    if (pos > trail * .025)
                        push(onPath(f.pts, pos - trail * .025, f.lengths), f.color.map(c => c * (.45 / trail)), f.particleSize - trail * 2, layer);
            });
            for (const mesh of this.inputRoutes || []) {
                const vertices = inputVertices.get(mesh.lineKey) || [];
                gl.bindBuffer(gl.ARRAY_BUFFER, mesh.geo.buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
                mesh.geo.count = vertices.length / 8;
            }
            if (this.hubPosition && hasInput) push(this.hubPosition, [.04, .65, .48], phase >= FLOW_STAGES.input[1] ? 15 : 4, 1);
            // Persistent evidence belongs to the platform layer.
            push([1.95, 2.83, -1.62], [.35, .86, .57], phase > 13 ? 6.5 : 2.4, 1);
            this.pointData = particles;
        }
        screenPoint(p) {
            const angle = this.yaw - this.screenYaw, c = Math.cos(angle), s = Math.sin(angle);
            return [p[0] * c + p[2] * s, p[1], p[2] * c - p[0] * s];
        }
        updateResultRoutes() {
            if (!this.resultRoute) return;
            const gl = this.engine.gl;
            for (const [type, mesh] of [['output', this.outputRoute], ['result', this.resultRoute]]) {
                const vertices = [];
                this.flows.filter(f => f.type === type).forEach(f => {
                    f.pts = type === 'output'
                        ? [pointTransform(this.orb.model, [0, 0, 0]), pointTransform(this.conversationMesh.model, [0, -.5, 0])]
                        : [pointTransform(this.conversationMesh.model, [Math.sign(f.slot) * .45, -.31, 0]), pointTransform(f.panel.model, [0, 0, 0])];
                    f.lengths = pathLength(f.pts);
                    vertices.push(...this.routeLines(f.pts));
                });
                gl.bindBuffer(gl.ARRAY_BUFFER, mesh.geo.buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
                mesh.geo.count = vertices.length / 8;
            }
        }
        layerLabelPosition(level, side) {
            const y = level * this.H + (level === 3 ? .28 : 1.03);
            return side === 0 ? [-1.69, y, this.D / 2 + .035]
                : side === 1 ? [this.W / 2 + .035, y, 1.14]
                : side === 2 ? [1.69, y, -this.D / 2 - .035]
                : [-this.W / 2 - .035, y, -1.14];
        }
        updateMobileLabels() {
            if (!this.mobileLabels) return;
            this.mobileLabels.hidden = this.width >= LABEL_OVERLAY_WIDTH;
            if (this.mobileLabels.hidden) return;
            const m = multiply(this.projection, this.view);
            const dominant = ((Math.round(this.yaw / (PI / 2)) % 4) + 4) % 4;
            for (let i = 0; i < 4; i++) {
                const p = this.layerLabelPosition(i, dominant);
                p[1] = this.shift(p[1], i);
                const q = pointTransform(m, p);
                const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
                const label = this.mobileLabels.children[i];
                if (!Number.isFinite(w) || w <= 0) { label.hidden = true; continue; }
                const centerY = (-.5 * q[1] / w + .5) * this.height;
                // Off-screen anchors stay off-screen; never clamp labels onto other floors.
                label.hidden = centerY < 0 || centerY > this.height;
                if (label.hidden) continue;
                const labelWidth = label.offsetWidth, labelHeight = label.offsetHeight;
                const x = clamp((q[0] / w * .5 + .5) * this.width - labelWidth / 2,
                    8, Math.max(8, this.width - labelWidth - 8));
                label.style.transform = `translate(${x}px,${centerY - labelHeight / 2}px)`;
            }
        }
        rebuildRoutes() { const gl = this.engine.gl; this.meshes.filter(m => m.isRoute && !m.inputRoute && m !== this.resultRoute && m !== this.outputRoute).forEach(m => { const data = [...m.originalVertices]; for (let i = 0; i < data.length; i += 8) {
            const p = this.expandPoint(data.slice(i, i + 3));
            data[i + 1] = p[1];
        } gl.bindBuffer(gl.ARRAY_BUFFER, m.geo.buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW); }); }
        fittedDistance(yaw = this.yaw, pitch = this.pitch, spread = this.explode || 0) {
            // Fit perspective bounds at the actual view angle.
            const sy = Math.sin(yaw), cy = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
            const centerY = this.H * 2 + spread * 1.5;
            let distance = 3;
            for (const x of [-this.W / 2 - .12, this.W / 2 + .12])
                for (const y of [-.15, this.H * 4 + .15 + spread * 3])
                    for (const z of [-this.D / 2 - .12, this.D / 2 + .12]) {
                        const dy = y - centerY;
                        const depth = x * sy * cp + dy * sp + z * cy * cp;
                        const horizontal = x * cy - z * sy;
                        const vertical = -x * sy * sp + dy * cp - z * cy * sp;
                        distance = Math.max(distance, depth + 2.6,
                            depth + Math.abs(horizontal) * this.projection[0] / .94,
                            depth + Math.abs(vertical) * this.projection[5] / .94);
                    }
            return distance;
        }
        resize() {
            if (!this.engine || this.disposed) return;
            const rect = this.root.getBoundingClientRect();
            if (rect.width < 2 || rect.height < 2) return;
            this.width = Math.max(2, rect.width);
            this.height = Math.max(2, rect.height);
            const mobile = this.width < 640;
            const ratio = Math.min(global.devicePixelRatio || 1, this.config.pixelRatio, this.width < 600 ? 1.65 : 1.75);
            this.engine.resize(this.width, this.height, ratio);
            const aspect = this.width / this.height;
            const vertical = (mobile ? 33 : 35) * PI / 360;
            this.projection = perspective(vertical * 2, aspect, 2.5, 160);
            this.baseDistance = this.fittedDistance();
            if (mobile && this.zoomGoal < 1) this.zoomGoal = 1;
            this.schedule();
        }
        schedule() { if (!this.ready || !this.projection || this.disposed || this.lost || !this.visible || document.hidden || this.raf)
            return; this.raf = requestAnimationFrame(ts => this.frame(ts)); }
        interact() {
            this.manualView = true;
            this.idleSeconds = 0;
            this.returnView = null;
        }
        advanceMotion(dt) {
            if (this.reduced) return;
            if (this.manualView) {
                if (this.pointers.size) return;
                this.idleSeconds += dt;
                if (this.idleSeconds < 3) return;
                if (!this.returnView) {
                    // Return via the nearest home angle.
                    this.homeYaw = .66 + Math.round((this.yaw - .66) / TAU) * TAU;
                    this.returnView = { elapsed: 0, yaw: this.yaw, pitch: this.pitch, zoom: this.zoom };
                }
                const view = this.returnView;
                view.elapsed += dt;
                const progress = smooth(0, 2, view.elapsed);
                this.yaw = this.yawGoal = mix(view.yaw, this.homeYaw, progress);
                this.pitch = this.pitchGoal = mix(view.pitch, .28, progress);
                this.zoom = this.zoomGoal = mix(view.zoom, 1, progress);
                if (view.elapsed >= 2) {
                    this.manualView = false;
                    this.returnView = null;
                    this.time = 0;
                }
                return;
            }
            if (!this.running) return;
            this.time += dt;
            if (this.autoRotate) {
                // One gentle out-and-back arc per story.
                const arc = (1 - Math.cos(TAU * (this.time % STORY.cycle) / STORY.cycle)) / 2;
                this.yawGoal = this.homeYaw + .24 * arc;
                this.pitchGoal = .28 + .025 * arc;
            }
        }
        frame(ts) { this.raf = 0; if (this.disposed || this.lost || !this.visible || document.hidden) {
            this.lastFrame = 0;
            return;
        } const dt = this.lastFrame ? Math.min((ts - this.lastFrame) / 1000, .25) : 0; this.lastFrame = ts; const priorSpread = this.explode; const ease = this.reduced ? 1 : 1 - Math.exp(-dt * 11);
            this.advanceMotion(dt);
            this.yaw = mix(this.yaw, this.yawGoal, ease); this.pitch = mix(this.pitch, this.pitchGoal, ease); this.zoom = mix(this.zoom, this.zoomGoal, ease); this.explode = mix(this.explode, this.explodeGoal, ease); if (Math.abs(this.explode - this.explodeGoal) < .0005)
            this.explode = this.explodeGoal; if (Math.abs(priorSpread - this.explode) > .00001)
            this.rebuildRoutes(); const target = [0, this.H * 2 + this.explode * 1.5, 0], dist = this.fittedDistance() * this.zoom; this.eye = [Math.sin(this.yaw) * Math.cos(this.pitch) * dist, target[1] + Math.sin(this.pitch) * dist, Math.cos(this.yaw) * Math.cos(this.pitch) * dist]; this.view = lookAt(this.eye, target); this.updateMobileLabels(); this.updateScene(dt); this.engine.render(this.meshes, this.pointData, this.view, this.projection, this.eye, this.glow); const moving = Math.abs(this.yawGoal - this.yaw) > .00005 || Math.abs(this.pitchGoal - this.pitch) > .00005 || Math.abs(this.zoomGoal - this.zoom) > .00005 || Math.abs(this.explodeGoal - this.explode) > .00005; if (this.running || moving || this.pointers.size || (this.manualView && !this.reduced))
            this.schedule();
        else
            this.lastFrame = 0; }
        bind() {
            this.listen(this.canvas, 'pointerdown', e => { if (e.button !== 0 && e.pointerType === 'mouse')
                return; this.canvas.setPointerCapture(e.pointerId); this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); this.interact(); this.updateButtons(); this.clearViews(); this.canvas.focus({ preventScroll: true }); this.schedule(); });
            this.listen(this.canvas, 'pointermove', e => { if (!this.pointers.has(e.pointerId))
                return; const before = this.pointers.get(e.pointerId); this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (this.pointers.size === 1) {
                this.yawGoal -= (e.clientX - before.x) * .007;
                this.pitchGoal = clamp(this.pitchGoal + (e.clientY - before.y) * .0045, -1.1, 1.46);
            }
            else {
                const p = [...this.pointers.values()], distance = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
                if (this.lastPinch)
                    this.zoomGoal = clamp(this.zoomGoal * this.lastPinch / distance, .62, 1.62);
                this.lastPinch = distance;
            } this.schedule(); });
            const release = e => { this.pointers.delete(e.pointerId); this.lastPinch = 0; if (this.canvas.hasPointerCapture(e.pointerId))
                this.canvas.releasePointerCapture(e.pointerId); this.schedule(); };
            this.listen(this.canvas, 'pointerup', release);
            this.listen(this.canvas, 'pointercancel', release);
            this.listen(this.canvas, 'lostpointercapture', e => { this.pointers.delete(e.pointerId); this.lastPinch = 0; this.schedule(); });
            this.listen(this.canvas, 'wheel', e => { e.preventDefault(); this.interact(); this.zoomGoal = clamp(this.zoomGoal * Math.exp(clamp(e.deltaY, -90, 90) * .0016), .62, 1.62); this.schedule(); }, { passive: false });
            this.listen(this.canvas, 'keydown', e => { const actions = { ArrowLeft: () => this.yawGoal -= .15, ArrowRight: () => this.yawGoal += .15, ArrowUp: () => this.pitchGoal = clamp(this.pitchGoal + .12, -1.1, 1.46), ArrowDown: () => this.pitchGoal = clamp(this.pitchGoal - .12, -1.1, 1.46), '+': () => this.zoomGoal = clamp(this.zoomGoal * .92, .62, 1.62), '=': () => this.zoomGoal = clamp(this.zoomGoal * .92, .62, 1.62), '-': () => this.zoomGoal = clamp(this.zoomGoal / .92, .62, 1.62), Home: () => this.reset(), ' ': () => this.togglePlay() }; if (actions[e.key]) {
                e.preventDefault();
                e.stopPropagation();
                actions[e.key]();
                if (e.key !== ' ') {
                    this.interact();
                    this.clearViews();
                }
                this.updateButtons();
                this.schedule();
            } });
            this.root.querySelectorAll('[data-action]').forEach(b => this.listen(b, 'click', () => { switch (b.dataset.action) {
                case 'play':
                    this.togglePlay();
                    break;
                case 'autorotate':
                    this.autoRotate = !this.autoRotate;
                    this.updateButtons();
                    this.schedule();
                    break;
                case 'reset':
                    this.reset();
                    break;
                case 'explode':
                    this.explodeGoal = this.explodeGoal ? 0 : .48;
                    b.setAttribute('aria-pressed', String(!!this.explodeGoal));
                    this.schedule();
                    break;
                case 'settings':
                    this.toggleSettings();
                    break;
                case 'close-settings':
                    this.toggleSettings(false);
                    break;
                case 'defaultlogo':
                    this.setLogo(null);
                    this.root.querySelector('[data-logo-input]').value = '';
                    this.logoMessage('Vraćen je početni konceptualni znak.');
                    break;
            } }));
            this.root.querySelectorAll('[data-view]').forEach(b => this.listen(b, 'click', () => this.setView(b.dataset.view)));
            this.listen(this.root.querySelector('[data-glow]'), 'input', e => { this.glow = Number(e.target.value); this.schedule(); });
            this.listen(document, 'pointerdown', e => { const panel = this.root.querySelector('.axc-panel'); if (!panel.hidden && !panel.contains(e.target) && !this.root.querySelector('[data-action=settings]').contains(e.target))
                this.toggleSettings(false, false); });
            this.listen(this.root, 'keydown', e => { if (e.key === 'Escape' && !this.root.querySelector('.axc-panel').hidden) {
                e.preventDefault();
                this.toggleSettings(false);
            } });
            this.listen(document, 'visibilitychange', () => { this.lastFrame = 0; if (document.hidden) {
                cancelAnimationFrame(this.raf);
                this.raf = 0;
            }
            else
                this.schedule(); });
            this.listen(this.motion, 'change', () => { this.reduced = this.motion.matches; if (this.reduced) {
                this.running = false;
                this.autoRotate = false;
                this.time = STORY.visual + .5;
            } this.updateButtons(); this.schedule(); });
            this.listen(this.canvas, 'webglcontextlost', e => { e.preventDefault(); this.lost = true; cancelAnimationFrame(this.raf); this.raf = 0; this.showFallback(this.config.accessibleLabel || this.root.dataset.cubeDescription || ''); });
            this.listen(this.canvas, 'webglcontextrestored', () => { this.showFallback(this.config.accessibleLabel || this.root.dataset.cubeDescription || ''); });
            this.resizeObserver = new ResizeObserver(() => this.resize());
            this.resizeObserver.observe(this.root);
            this.intersectionObserver = new IntersectionObserver(entries => { const v = entries[0].isIntersecting; this.visible = v; this.lastFrame = 0; if (v)
                this.resize();
            else {
                cancelAnimationFrame(this.raf);
                this.raf = 0;
            } }, { threshold: .05 });
            this.intersectionObserver.observe(this.root);
        }
        clearViews() { this.root.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', 'false')); }
        setView(name) { const views = { iso: [.66, .28, 1], front: [0, .15, .96], top: [.40, 1.37, 1.02] }; if (!views[name])
            return; const v = views[name]; this.yawGoal = v[0] + Math.round((this.yawGoal - v[0]) / TAU) * TAU; this.pitchGoal = v[1]; this.zoomGoal = v[2]; this.autoRotate = false; this.clearViews(); const b = this.root.querySelector(`[data-view="${name}"]`); if (b)
            b.setAttribute('aria-pressed', 'true'); this.updateButtons(); this.schedule(); }
        reset() { this.setView('iso'); this.explodeGoal = 0; this.root.querySelector('[data-action=explode]').setAttribute('aria-pressed', 'false'); }
        togglePlay() { if (this.reduced) return; this.running = !this.running; this.lastFrame = 0; this.updateButtons(); this.schedule(); }
        play() { if (!this.running)
            this.togglePlay(); }
        pause() { if (this.running)
            this.togglePlay(); }
        seek(seconds) { this.time = Math.max(0, Number(seconds) || 0); this.schedule(); }
        updateButtons() { const b = this.root.querySelector('[data-action=play]'), s = this.root.querySelector('[data-play-icon]'); b.disabled = this.reduced || Boolean(this.error); b.setAttribute('aria-pressed', String(this.running)); const txt = this.running ? (this.config.pauseLabel || 'Pause motion') : (this.config.resumeLabel || 'Resume motion'); b.setAttribute('aria-label', txt); b.title = txt; while (s.firstChild)
            s.removeChild(s.firstChild); const path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', this.running ? 'M8 5v14M16 5v14' : 'M8 5 19 12 8 19Z'); s.append(path); this.root.querySelector('[data-action=autorotate]').setAttribute('aria-pressed', String(this.autoRotate)); this.root.querySelector('[data-status]').textContent = this.reduced || this.running ? '' : (this.config.resumeLabel || 'Paused'); }
        toggleSettings(force, restoreFocus = true) { const p = this.root.querySelector('.axc-panel'), btn = this.root.querySelector('[data-action=settings]'), open = force === undefined ? p.hidden : force; p.hidden = !open; btn.setAttribute('aria-expanded', String(open)); if (open)
            this.root.querySelector('[data-logo-input]').focus();
        else if (restoreFocus)
            btn.focus(); }
        logoMessage(msg) { this.root.querySelector('[data-logo-status]').textContent = msg; }
        async setLogo(url) { const request = ++this.logoRequest; let image = null; if (url) {
            // Only reuse reviewed page-declared images; never fetch config URLs.
            image = Array.from(this.root.querySelectorAll('[data-cube-symbol-image]')).find(image => image.getAttribute('src') === url);
            if (!image)
                throw new Error('Logo must be the image declared in this page.');
            await image.decode();
            if (!image.naturalWidth || !image.naturalHeight)
                throw new Error('Invalid logo dimensions.');
            if (image.naturalWidth > 8192 || image.naturalHeight > 8192)
                throw new Error('Logo je prevelik.');
        } if (this.disposed || request !== this.logoRequest)
            return false; this.logoImage = image;
            const item = this.textures.get('logo');
            item.canvas.getContext('2d').clearRect(0, 0, item.canvas.width, item.canvas.height);
            item.draw(item.canvas.getContext('2d'), item.canvas.width, item.canvas.height);
            this.engine.updateTexture(item.texture, item.canvas);
        this.schedule(); return true; }
        getState() { return { renderer: this.engine?.isWebGL2 ? 'WebGL2' : 'WebGL', running: this.running, autoRotate: this.autoRotate, reducedMotion: this.reduced, visible: this.visible, time: this.time, yaw: this.yaw, pitch: this.pitch, zoom: this.zoom, expanded: this.explode, frames: this.engine?.frameCount || 0, drawCalls: this.engine?.drawCalls || 0, meshes: this.meshes.length, paths: this.flows.length, logoCustom: !!this.logoImage, webglLost: this.lost, error: this.error || null }; }
        showFallback() { this.root.dataset.storyPhase = 'visual'; const f = this.root.querySelector('[data-fallback]'); f.hidden = false; }
        dispose() { if (this.disposed)
            return; this.disposed = true; this.logoRequest++; cancelAnimationFrame(this.raf); this.listeners.forEach(remove => remove()); this.timers.forEach(clearTimeout); this.resizeObserver?.disconnect(); this.intersectionObserver?.disconnect(); this.engine?.dispose(); this.canvas.remove(); this.mobileLabels?.remove(); delete this.root.__advanexusCube; }
    }
    global.AdvanexusCube = Cube;
}(window));
