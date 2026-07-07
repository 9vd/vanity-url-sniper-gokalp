// çöp
"use strict";
process.env.UV_THREADPOOL_SIZE = "128";
process.env.UV_USE_IO_URING = "1";
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
const net = require("net");
const tls = require("tls");
const http2 = require("http2");
const fs = require("fs");
const os = require("os");
const { exec } = require("child_process");
os.setPriority(os.constants.priority.PRIORITY_HIGHEST);
if (process.platform === "linux") {
    exec(`chrt -f 99 -p ${process.pid} && taskset -cp 0 ${process.pid}`, () => { });
    try { require("child_process").execSync(`mlockall -p ${process.pid}`); } catch { }
}
if (process.platform === "win32") {
    exec(`powershell -Command "$p = Get-Process -Id ${process.pid}; $p.PriorityClass = 'RealTime'"`, () => { });
}
function preWriteAll() {
}
preWriteAll();
const token = "";
const DISCORD_HOST = "canary.discord.com";
const GUILD = "1512780170837364790";
const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const sp = 'eyJicm93c2VyIjoiQ2hyb21lIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiQ2hyb21lIiwiY2xpZW50YnVpbGRfbnVtYmVyIjozNTU2MjR9';
const API_VERSIONS = ["v6", "v7", "v8", "v9", "v10"];
const wsTokens = fs.readFileSync("list.txt", "utf-8").split(/\r?\n/).map(t => t.trim()).filter(Boolean);
if (!wsTokens.length) { console.error("list.txt bos"); process.exit(1); }
const MFA_FILE = "mfa.txt";
let mfaTok = "";
const h1Headers = new Map();
const h2Headers = new Map();
function buildHdrs() {
    for (const ver of API_VERSIONS) {
        const h1Base = `PATCH /api/${ver}/guilds/${GUILD}/vanity-url HTTP/1.1\r\nHost: ${DISCORD_HOST}\r\nAuthorization: ${token}\r\nUser-Agent: ${ua}\r\nX-Super-Properties: ${sp}\r\nContent-Type: application/json\r\n`;
        const h1Mfa = mfaTok ? `X-Discord-MFA-Authorization: ${mfaTok}\r\n` : "";
        h1Headers.set(ver, Buffer.from(`${h1Base}${h1Mfa}Connection: keep-alive\r\nContent-Length: `));
        h2Headers.set(ver, Object.freeze({
            ":method": "PATCH",
            ":path": `/api/${ver}/guilds/${GUILD}/vanity-url`,
            ":authority": DISCORD_HOST,
            "authorization": token,
            "content-type": "application/json",
            "user-agent": ua,
            "x-super-properties": sp,
            ...(mfaTok && { "x-discord-mfa-authorization": mfaTok })
        }));
    }
}
function readMfa() {
    try {
        const val = fs.readFileSync(MFA_FILE, "utf-8").trim();
        if (val && val !== mfaTok) { mfaTok = val; buildHdrs(); }
    } catch { }
}
if (fs.existsSync(MFA_FILE)) fs.watch(MFA_FILE, () => readMfa());
readMfa();
buildHdrs();
const vanityMap = new Map();
const SESSION_COUNT = 1;
const STREAMS_PER_SESSION = 1;
const tlsSessionTicket = { buffer: null, ts: 0 };
const secureContext = tls.createSecureContext({
    minVersion: "TLSv1.3",
    maxVersion: "TLSv1.3",
    ciphers: "TLS_AES_128_GCM_SHA256",
    ecdhCurve: "X25519"
});
let bestIP = "162.159.137.232";
const DISCORD_IPS = [
    "162.159.128.233", "162.159.128.234", "162.159.129.233", "162.159.129.234",
    "162.159.130.233", "162.159.130.234", "162.159.131.233", "162.159.131.234",
    "162.159.132.233", "162.159.132.234", "162.159.133.233", "162.159.133.234",
    "162.159.134.233", "162.159.134.234", "162.159.135.233", "162.159.135.234",
    "162.159.136.233", "162.159.137.233", "162.159.138.233", "162.159.140.233",
    "104.16.124.0", "104.16.125.0", "104.16.126.0", "104.16.127.0",
    "104.16.11.231", "104.16.12.231", "104.16.13.231", "104.16.14.231",
    "104.16.15.231", "104.16.16.231"
];
function pingIP(ip) {
    return new Promise((resolve) => {
        const start = process.hrtime.bigint();
        const socket = net.createConnection({ host: ip, port: 443, family: 4 });
        let resolved = false;
        const done = (ms) => { if (resolved) return; resolved = true; socket.destroy(); resolve({ ip, ms }); };
        socket.on("connect", () => done(Number(process.hrtime.bigint() - start) / 1e6));
        socket.on("error", () => done(9999));
        setTimeout(() => done(9999), 800);
    });
}
async function resolveBestIP() {
    let best = { ip: bestIP, ms: 9999 };
    for (let i = 0; i < DISCORD_IPS.length; i += 5) {
        const batch = DISCORD_IPS.slice(i, i + 5);
        const results = await Promise.all(batch.map(pingIP));
        for (const r of results) if (r.ms < best.ms) best = r;
    }
    bestIP = best.ms === 9999 ? "162.159.137.232" : best.ip;
}
const PRE_ALLOCATED_SIZE = 43;
const payloadPool = Array.from({ length: 4096 }, () => Buffer.allocUnsafe(PRE_ALLOCATED_SIZE));
let payloadPoolIdx = 0;
function buildPayload(codeBuf) {
    const b = payloadPool[payloadPoolIdx];
    payloadPoolIdx = (payloadPoolIdx + 1) % 4096;
    b.write('{"code":"', 0);
    codeBuf.copy(b, 9);
    b.write('"}', 9 + codeBuf.length);
    return b.subarray(0, 9 + codeBuf.length + 2);
}
const pkts = new Map();
function getPkt(code) {
    let pkt = pkts.get(code);
    if (!pkt) {
        const payload = buildPayload(code);
        const len = Buffer.from(String(payload.length));
        const crlf = Buffer.from("\r\n\r\n");
        pkt = { payload, body: Buffer.concat([len, crlf, payload]) };
        pkts.set(code, pkt);
    }
    return pkt;
}
const noop = () => { };
const RLD = Buffer.from("x-ratelimit-reset-after:");
const HEX = new Uint8Array(256);
for (let i = 0; i < 10; i++) HEX[0x30 + i] = i;
for (let i = 0; i < 6; i++) {
    HEX[0x41 + i] = 10 + i;
    HEX[0x61 + i] = 10 + i;
}
function rlParse(buf, hs) {
    const dl = RLD.length;
    for (let i = 0, s = hs - dl; i < s; i++) {
        let ok = true;
        for (let j = 0; j < dl; j++) {
            const c = buf[i + j];
            const p = RLD[j];
            if (c !== p && !(c >= 65 && c <= 90 && c + 32 === p)) {
                ok = false;
                break;
            }
        }
        if (!ok) continue;
        let c = i + dl;
        while (c < hs && buf[c] === 32) c++;
        let v = 0, dot = false, sc = 1;
        while (c < hs && buf[c] !== 13) {
            const r = buf[c];
            if (r >= 48 && r <= 57) {
                if (dot) {
                    sc *= 10;
                    v += (r - 48) / sc;
                } else {
                    v = v * 10 + (r - 48);
                }
            } else if (r === 46) {
                dot = true;
            } else {
                break;
            }
            c++;
        }
        return v > 0 ? v : -1;
    }
    return -1;
}
class FastParser {
    constructor() {
        this.buf = Buffer.allocUnsafe(16384);
        this.ofs = 0;
        this.hs = -1;
        this.cl = -1;
        this.chunked = false;
        this.st = 0;
        this.rl = -1;
    }
    feed(chunk, cb) {
        if (this.ofs + chunk.length > this.buf.length) {
            const nb = Buffer.allocUnsafe((this.ofs + chunk.length) << 1);
            this.buf.copy(nb, 0, 0, this.ofs);
            this.buf = nb;
        }
        chunk.copy(this.buf, this.ofs);
        this.ofs += chunk.length;
        this.parse(cb);
    }
    parse(cb) {
        for (; ;) {
            if (this.hs < 0) {
                for (let i = 0, s = this.ofs - 3; i < s; i++) {
                    if (this.buf[i] === 13 && this.buf[i + 1] === 10 && this.buf[i + 2] === 13 && this.buf[i + 3] === 10) {
                        this.hs = i;
                        break;
                    }
                }
                if (this.hs < 0) return;
                this.st = (this.buf[0] === 72) ? (this.buf[9] - 48) * 100 + (this.buf[10] - 48) * 10 + (this.buf[11] - 48) : 0;
                this.rl = rlParse(this.buf, this.hs);
                this.chunked = false;
                for (let i = 0, s = this.hs - 6; i < s; i++) {
                    if (this.buf[i] === 99 && this.buf[i + 1] === 104 && this.buf[i + 2] === 117 && this.buf[i + 3] === 110 && this.buf[i + 4] === 107 && this.buf[i + 5] === 101 && this.buf[i + 6] === 100) {
                        this.chunked = true;
                        break;
                    }
                }
                if (!this.chunked) {
                    this.cl = -1;
                    for (let i = 0, s = this.hs - 15; i < s; i++) {
                        if ((this.buf[i] === 67 || this.buf[i] === 99) && this.buf[i + 7] === 45 && (this.buf[i + 8] === 76 || this.buf[i + 8] === 108)) {
                            let j = i + 15;
                            while (j < this.hs && this.buf[j] === 32) j++;
                            let v = 0;
                            while (j < this.hs && this.buf[j] >= 48 && this.buf[j] <= 57) {
                                v = v * 10 + (this.buf[j] - 48);
                                j++;
                            }
                            this.cl = v;
                            break;
                        }
                    }
                    if (this.cl < 0) this.cl = (this.st === 204 || this.st === 304 || (this.st > 0 && this.st < 200)) ? 0 : -1;
                }
            }
            const bs = this.hs + 4;
            if (this.chunked) {
                let pos = bs, fb = -1, fl = 0, one = true, parts = null;
                for (; ;) {
                    let le = -1;
                    for (let i = pos, s = this.ofs - 1; i < s; i++) {
                        if (this.buf[i] === 13 && this.buf[i + 1] === 10) {
                            le = i;
                            break;
                        }
                    }
                    if (le < 0) return;
                    let cs = 0;
                    for (let i = pos; i < le; i++) cs = (cs << 4) | HEX[this.buf[i]];
                    const ds = le + 2, de = ds + cs;
                    if (this.ofs < de + 2) return;
                    if (cs === 0) {
                        let te = -1;
                        for (let i = le, s = this.ofs - 3; i < s; i++) {
                            if (this.buf[i] === 13 && this.buf[i + 1] === 10 && this.buf[i + 2] === 13 && this.buf[i + 3] === 10) {
                                te = i;
                                break;
                            }
                        }
                        if (te < 0) return;
                        const rem = this.ofs - (te + 4);
                        if (rem > 0) this.buf.copy(this.buf, 0, te + 4, this.ofs);
                        this.ofs = rem;
                        this.hs = -1;
                        this.cl = -1;
                        this.chunked = false;
                        cb(one && fb >= 0 ? this.buf.toString("utf8", fb, fb + fl) : (parts ? parts.join("") : ""), this.st, this.rl);
                        break;
                    }
                    if (one && fb < 0) {
                        fb = ds;
                        fl = cs;
                    } else if (one) {
                        one = false;
                        parts = [this.buf.toString("utf8", fb, fb + fl), this.buf.toString("utf8", ds, de)];
                    } else {
                        parts.push(this.buf.toString("utf8", ds, de));
                    }
                    pos = de + 2;
                }
            } else {
                if (this.cl < 0 || this.ofs - bs < this.cl) return;
                const g = this.cl > 0 ? this.buf.toString("utf8", bs, bs + this.cl) : "";
                const tk = bs + this.cl, rem = this.ofs - tk;
                if (rem > 0) this.buf.copy(this.buf, 0, tk, this.ofs);
                this.ofs = rem;
                this.hs = -1;
                this.cl = -1;
                this.chunked = false;
                cb(g, this.st, this.rl);
            }
        }
    }
    reset() {
        this.ofs = 0;
        this.hs = -1;
        this.cl = -1;
        this.chunked = false;
        this.st = 0;
        this.rl = -1;
    }
}

function applySocketOpts(s) {
    s.setNoDelay(true);
    s.setKeepAlive(true, 0);
    try { s.setMaxSendFragment(16384); } catch { }
    try {
        s._handle?.setSendBufferSize?.(256 * 1024);
        s._handle?.setRecvBufferSize?.(256 * 1024);
    } catch { }
}

const sess = new Map();

const TOPT = {
    port: 443,
    servername: "canary.discord.com",
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined,
    ALPNProtocols: ["http/1.1"],
    highWaterMark: 1024,
    minVersion: "TLSv1.3",
    maxVersion: "TLSv1.3",
    ciphers: "TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_256_GCM_SHA384",
    ecdhCurve: "X25519"
};

class FastSocket {
    constructor(iIdx) {
        this.ip = bestIP;
        this.parser = new FastParser();
        this.QM = 63;
        this.QV = new Array(64);
        this.QC = new Array(64);
        this.qB = 0;
        this.qS = 0;
        this.sok = null;
        this.busy = false;
        this.cb = null;
        this.cv = null;
        this.gen = 0;
        this.at = 0;
        this.connect();
    }
    connect() {
        if (this.sok && !this.sok.destroyed) return;
        const n = ++this.gen;
        this.parser.reset();
        this.sok = tls.connect({
            ...TOPT,
            host: this.ip,
            secureContext,
            session: sess.get(this.ip) || null
        });
        applySocketOpts(this.sok);

        preWriteAll();

        this.sok.once("session", s => sess.set(this.ip, s));
        this.sok.once("secureConnect", () => {
            this.at = Date.now();
        });
        this.sok.on("data", c => {
            if (n !== this.gen) return;
            this.parser.feed(c, (g, s, r) => this.done(g, s, r));
        });
        this.sok.on("error", noop);
        this.sok.on("close", () => {
            if (n !== this.gen) return;
            const pCb = this.cb, pV = this.cv;
            this.busy = false;
            this.cb = null;
            this.cv = null;
            this.at = 0;
            this.qB = this.qS = 0;
            process.nextTick(() => {
                this.connect();
                if (pCb && pV) setTimeout(() => this.send(pV, pCb), 80);
            });
        });
    }
    done(g, s, r) {
        this.busy = false;
        this.cv = null;
        const c2 = this.cb;
        this.cb = null;
        if (c2) c2(g, s, r);
        if (this.qB !== this.qS) {
            const i = this.qB & this.QM;
            const v = this.QV[i];
            const x = this.QC[i];
            this.QV[i] = this.QC[i] = null;
            this.qB++;
            this.send(v, x);
        }
    }
    send(data, cb2) {
        if (!this.sok || this.sok.destroyed) {
            const i = this.qS & this.QM;
            this.QV[i] = data;
            this.QC[i] = cb2;
            this.qS++;
            this.connect();
            return;
        }
        if (this.busy) {
            const i = this.qS & this.QM;
            this.QV[i] = data;
            this.QC[i] = cb2;
            this.qS++;
            return;
        }
        this.busy = true;
        this.cb = cb2;
        this.cv = data;
        this.sok.write(data);
    }
    kill() {
        this.gen++;
        this.at = 0;
        if (this.sok && !this.sok.destroyed) this.sok.destroy();
        this.sok = null;
        this.busy = false;
        this.cb = null;
        this.qB = this.qS = 0;
    }
    age() {
        return this.at > 0 ? Date.now() - this.at : 0;
    }
}

class H2Conn {
    constructor() {
        this.session = null;
        this.connect();
    }
    connect() {
        const session = http2.connect(`https://${DISCORD_HOST}`, {
            settings: {
                enablePush: false,
                initialWindowSize: 1 << 24,
                maxFrameSize: 1 << 14,
                headerTableSize: 65536,
                maxConcurrentStreams: 1000
            },
            createConnection: () => {
                const s = new net.Socket({
                    allowHalfOpen: true,
                    readableHighWaterMark: 256 * 1024,
                    writableHighWaterMark: 256 * 1024
                });
                s.connect({ port: 443, host: bestIP, family: 4, lookup: (_h, _o, cb) => cb(null, bestIP, 4) });
                s.setNoDelay(true);
                s.setKeepAlive(true, 5000);
                s.setTimeout(0);

                preWriteAll();

                const t = tls.connect({
                    socket: s,
                    servername: "canary.discord.com",
                    rejectUnauthorized: false,
                    ALPNProtocols: ["h2"],
                    secureContext,
                    session: tlsSessionTicket.buffer && (Date.now() - tlsSessionTicket.ts) < 3600000
                        ? tlsSessionTicket.buffer
                        : undefined
                });
                t.setNoDelay(true);
                t.setKeepAlive(true, 5000);
                t.setTimeout(0);

                t.once("session", (sess) => { tlsSessionTicket.buffer = sess; tlsSessionTicket.ts = Date.now(); });
                t.on("error", noop);
                return t;
            }
        });

        this.session = session;
        session.once("error", () => this.reconnect());
        session.once("close", () => this.reconnect());
        session.once("connect", () => this.warmUp());
    }
    reconnect() {
        if (this.session) { this.session.removeAllListeners(); this.session.destroy(); }
        setTimeout(() => this.connect(), 10);
    }
    warmUp() {
        try {
            const req = this.session.request({
                ":method": "GET",
                ":path": "/api/v10/users/@me",
                ":authority": DISCORD_HOST,
                ":scheme": "https",
                "user-agent": ua,
                "authorization": token
            });
            req.on("error", noop);
            req.on("response", noop);
            req.on("data", noop);
            req.end();
        } catch { }
    }
}

const h1Pool = [];
const h2Pool = [];
const H = SESSION_COUNT;

function initPools() {
    h1Pool.length = 0;
    h2Pool.length = 0;
    for (let i = 0; i < SESSION_COUNT; i++) {
        h1Pool.push(new FastSocket(i));
        h2Pool.push(new H2Conn());
    }
}

function fireAll(code) {
    const pkt = getPkt(code);
    if (!pkt) return;

    for (let i = 0; i < H; i++) {
        const s = h1Pool[i];
        for (const ver of API_VERSIONS) {
            const hdr = h1Headers.get(ver);
            const full = Buffer.concat([hdr, pkt.body]);
            s.send(full, (body, st, rl) => {
                if (body && body.length > 200 && (body.charCodeAt(0) === 60 || body.includes("sentry") || body.includes("cf-ray"))) return;
                console.log(`[H1 RESP ${ver}] ${st} ${(body || "").substring(0, 80)}`);
            });
        }

        const h2 = h2Pool[i];
        for (const ver of API_VERSIONS) {
            const hdr = h2Headers.get(ver);
            for (let j = 0; j < STREAMS_PER_SESSION; j++) {
                try {
                    const req = h2.session.request(hdr);
                    req.end(pkt.payload);
                    req.on("error", noop);
                    req.on("response", (headers) => {
                        const status = headers[":status"];
                        console.log(`[H2 RESP ${ver}] status: ${status}`);
                    });
                    req.on("data", (chunk) => {
                        console.log(`[H2 RESP ${ver}] body: ${chunk.toString().substring(0, 200)}`);
                    });
                    req.on("end", noop);
                } catch { }
            }
        }
    }
}

const GATEWAYS = [
    "wss://gateway.discord.gg/?v=10",
    "gateway-us-east1-b.discord.gg",
    "gateway-us-east1-c.discord.gg",
    "gateway-us-east1-d.discord.gg"
];

const wsConnections = [];
const heartbeatIntervals = [];
const reconnectTimeouts = [];
const wsConnectedFlags = [];
const wsReconnectAttempts = [];
const HB_BUF = Buffer.from('{"op":1,"d":null}');

function clearHB(i) {
    if (heartbeatIntervals[i]) { clearInterval(heartbeatIntervals[i]); heartbeatIntervals[i] = null; }
}

const P_GUILD_UPDATE = Buffer.from('"t":"GUILD_UPDATE"');
const P_ID = Buffer.from('"id":"');
const P_VANITY = Buffer.from('"vanity_url_code":"');
const P_OP10 = Buffer.from('"op":10');
const P_OP7 = Buffer.from('"op":7');
const P_HB_INTERVAL = Buffer.from('"heartbeat_interval":');
const P_READY = Buffer.from('"t":"READY"');

function connectWS(wsToken, gwIdx, wsIdx) {
    if (wsConnectedFlags[wsIdx]) return;
    clearHB(wsIdx);

    const WebSocket = require("ws");
    const ws = new WebSocket(`wss://${GATEWAYS[gwIdx]}/?v=10`, {
        perMessageDeflate: false,
        handshakeTimeout: 15000,
        agent: new (require("https").Agent)({
            keepAlive: true,
            keepAliveMsecs: 5000,
            maxSockets: Infinity,
            createConnection: (opts, cb) => {
                const s = new net.Socket({
                    allowHalfOpen: true,
                    readableHighWaterMark: 256 * 1024,
                    writableHighWaterMark: 256 * 1024
                });
                s.connect({ port: opts.port || 443, host: bestIP, family: 4, lookup: (_h, _o, c) => c(null, bestIP, 4) });
                s.setNoDelay(true);
                s.setKeepAlive(true, 5000);
                s.setTimeout(0);

                preWriteAll();

                const t = tls.connect({
                    socket: s,
                    servername: "canary.discord.com",
                    rejectUnauthorized: false,
                    secureContext,
                    session: tlsSessionTicket.buffer && (Date.now() - tlsSessionTicket.ts) < 3600000
                        ? tlsSessionTicket.buffer
                        : undefined
                });
                t.setNoDelay(true);
                t.setKeepAlive(true, 5000);
                t.setTimeout(0);
                t.once("session", (sess) => { tlsSessionTicket.buffer = sess; tlsSessionTicket.ts = Date.now(); });
                t.on("error", (e) => cb(e));
                t.on("secureConnect", () => cb(null, t));
            }
        })
    });
    wsConnections[wsIdx] = ws;

    ws.on("open", () => {
        wsConnectedFlags[wsIdx] = true;
        wsReconnectAttempts[wsIdx] = 0;
        ws.send(JSON.stringify({
            op: 2,
            d: {
                token: wsToken,
                intents: 1,
                compress: false,
                large_threshold: 0,
                properties: { os: "Windows", browser: "Chrome", device: "" }
            }
        }));
    });

    ws.on("message", (raw) => {
        if (raw.indexOf(P_GUILD_UPDATE) !== -1) {
            const idIdx = raw.indexOf(P_ID);
            if (idIdx === -1) return;
            const idStart = idIdx + P_ID.length;
            const idEnd = raw.indexOf(0x22, idStart);
            if (idEnd === -1) return;

            const id = raw.toString("utf8", idStart, idEnd);

            const vanityIdx = raw.indexOf(P_VANITY);
            let next = null;
            if (vanityIdx !== -1) {
                const vanityStart = vanityIdx + P_VANITY.length;
                const vanityEnd = raw.indexOf(0x22, vanityStart);
                if (vanityEnd !== -1) next = raw.subarray(vanityStart, vanityEnd);
            }

            const prev = vanityMap.get(id);

            if (prev && (!next || !prev.equals(next))) {
                fireAll(prev);
            }

            if (next) {
                const stored = Buffer.allocUnsafe(next.length);
                next.copy(stored);
                vanityMap.set(id, stored);
            } else {
                vanityMap.delete(id);
            }
            return;
        }

        if (raw.indexOf(P_READY) !== -1) {
            const msg = JSON.parse(raw.toString());
            if (Array.isArray(msg.d?.guilds)) {
                for (const g of msg.d.guilds) {
                    if (g.vanity_url_code && g.vanity_url_code !== "undefined") {
                        vanityMap.set(g.id, Buffer.from(g.vanity_url_code));
                    }
                }
            }
            for (const [gid, vbuf] of vanityMap) {
                console.log(`  ${gid}: ${vbuf.toString()}`);
            }
            return;
        }

        if (raw.indexOf(P_OP10) !== -1) {
            const hbIdx = raw.indexOf(P_HB_INTERVAL);
            if (hbIdx !== -1) {
                const hbStart = hbIdx + P_HB_INTERVAL.length;
                let hbEnd = raw.indexOf(0x2C, hbStart);
                if (hbEnd === -1) hbEnd = raw.indexOf(0x7D, hbStart);
                if (hbEnd !== -1) {
                    const interval = parseInt(raw.toString("utf8", hbStart, hbEnd));
                    ws.send(HB_BUF);
                    clearHB(wsIdx);
                    heartbeatIntervals[wsIdx] = setInterval(() => {
                        if (ws && ws.readyState === WebSocket.OPEN) ws.send(HB_BUF);
                    }, interval);
                }
            }
            return;
        }
        if (raw.indexOf(P_OP7) !== -1) { ws.close(); return; }
    });

    ws.on("close", () => {
        wsConnectedFlags[wsIdx] = false;
        clearHB(wsIdx);
        wsReconnectAttempts[wsIdx]++;
        const delay = Math.min(30000, 1000 * Math.pow(2, wsReconnectAttempts[wsIdx]) + Math.random() * 1000);
        if (reconnectTimeouts[wsIdx]) clearTimeout(reconnectTimeouts[wsIdx]);
        reconnectTimeouts[wsIdx] = setTimeout(() => connectWS(wsToken, gwIdx, wsIdx), delay);
    });

    ws.on("error", () => { });
}

function h1WarmUp() {
    const wh = Buffer.from(`GET /api/v10/users/@me HTTP/1.1\r\nHost: ${DISCORD_HOST}\r\nAuthorization: ${token}\r\nUser-Agent: ${ua}\r\nX-Super-Properties: ${sp}\r\nConnection: keep-alive\r\n\r\n`);
    for (const c of h1Pool) {
        try {
            c.send(wh, noop);
        } catch { }
    }
}

function h2WarmUp() {
    for (const c of h2Pool) {
        try {
            const req = c.session.request({
                ":method": "GET",
                ":path": "/api/v10/users/@me",
                ":authority": DISCORD_HOST,
                ":scheme": "https",
                "user-agent": ua,
                "authorization": token
            });
            req.on("error", noop);
            req.on("response", noop);
            req.on("data", noop);
            req.end();
        } catch { }
    }
}

setInterval(() => {
    h1WarmUp();
    h2WarmUp();
}, 15000);

let currentBestIP = null;
setInterval(async () => {
    await resolveBestIP();
    if (bestIP !== currentBestIP) {
        currentBestIP = bestIP;
        for (const c of h1Pool) c.kill();
        for (const c of h2Pool) c.reconnect();
    }
}, 2 * 60 * 1000);

resolveBestIP().then(() => {
    currentBestIP = bestIP;
    initPools();
    let wsIdx = 0;
    for (const wsTok of wsTokens) {
        for (let g = 0; g < GATEWAYS.length; g++) {
            wsConnections[wsIdx] = null;
            heartbeatIntervals[wsIdx] = null;
            reconnectTimeouts[wsIdx] = null;
            wsConnectedFlags[wsIdx] = false;
            wsReconnectAttempts[wsIdx] = 0;
            setTimeout(() => connectWS(wsTok, g, wsIdx), g * 300);
            wsIdx++;
        }
    }
});

process.on("SIGINT", () => {
    for (let i = 0; i < heartbeatIntervals.length; i++) clearHB(i);
    for (let i = 0; i < reconnectTimeouts.length; i++) {
        if (reconnectTimeouts[i]) clearTimeout(reconnectTimeouts[i]);
    }
    for (const c of h1Pool) {
        if (c.sok) c.kill();
    }
    for (const c of h2Pool) {
        if (c.session) c.session.destroy();
    }
    for (let i = 0; i < wsConnections.length; i++) {
        if (wsConnections[i]) { wsConnections[i].removeAllListeners(); wsConnections[i].terminate(); }
    }
    process.exit(0);
}); 
// çöp
