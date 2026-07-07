const tls = require('tls'), fs = require('fs'), WebSocket = require('ws'), l = console.log, S = JSON.stringify;

const CONFIG = {
    larp: '',
    targetGuild: '1512780170837364790',
    webhook: ''
};

let MT = '';
try {
    MT = fs.readFileSync('mfa.txt', 'utf8').trim();
    if (!MT) throw new Error('MFA token boş!');
} catch (e) {
    l(`\x1b[31m[HATA] mfa.txt okunamadı: ${e.message}\x1b[0m`);
    process.exit(1);
}

const TC = { host: 'canary.discord.com', port: 443, servername: 'canary.discord.com', rejectUnauthorized: true, allowEarlyData: true, minVersion: 'TLSv1.3', maxVersion: 'TLSv1.3' };
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const XSP = 'eyJicm93c2VyIjoiQ2hyb21lIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiQ2hyb21lIiwiY2xpZW50X2J1aWxkX251bWJlciI6MzU1NjI0LCJkZXZpY2UiOiJhbnRoZWwifQ==';

const BASE_HEADERS = `Host: canary.discord.com\r\nUser-Agent: ${UA}\r\nAuthorization: ${CONFIG.larp}\r\nX-Super-Properties: ${XSP}\r\nX-Discord-MFA-Authorization: ${MT}\r\n`;

const HB_BUF = Buffer.from('{"op":1,"d":null}');
const P_GUILD_MEMBER_UPDATE = Buffer.from('"t":"GUILD_MEMBER_UPDATE"');
const P_READY = Buffer.from('"t":"READY"');
const P_OP10 = Buffer.from('"op":10');
const P_HB_INTERVAL = Buffer.from('"heartbeat_interval":');

const vanityMap = Object.create(null);
const active = Object.create(null);
let botUserId = null;

function buildPatch(vanity) {
    const body = S({ code: vanity });
    const cl = Buffer.byteLength(body);
    return Buffer.from(
        `PATCH /api/v9/guilds/${CONFIG.targetGuild}/vanity-url HTTP/1.1\r\n` +
        `${BASE_HEADERS}` +
        `Content-Type: application/json\r\n` +
        `Content-Length: ${cl}\r\n` +
        `Connection: close\r\n` +
        `\r\n` +
        `${body}`
    );
}

function buildDelete(vanity) {
    return Buffer.from(
        `DELETE /api/v9/invites/${vanity} HTTP/1.1\r\n` +
        `${BASE_HEADERS}` +
        `Connection: close\r\n` +
        `\r\n`
    );
}

function parseJson(body) {
    try {
        const m = body.match(/\{[\s\S]*\}/);
        if (!m) return null;
        return JSON.parse(m[0]);
    } catch { return null; }
}

function logResponse(prefix, data) {
    const body = data.toString();
    const json = parseJson(body);
    if (json && (json.code !== undefined || json.message !== undefined)) {
        l(`\x1b[36m[${prefix}]\x1b[0m code=${json.code} message=${json.message}`);
        return json;
    }
    return null;
}

function doSwap(vanity) {
    if (active[vanity]) return;
    active[vanity] = true;
    l(`\x1b[33m[SWAP] ${vanity} -> targetGuild: ${CONFIG.targetGuild}\x1b[0m`);

    const del = tls.connect(TC, () => del.write(buildDelete(vanity)));

    let delDone = false;
    del.on('data', data => {
        const json = logResponse('DELETE', data);
        if (!delDone) {
            delDone = true;
            l(`\x1b[35m[DELETE] done, firing patches for ${vanity}\x1b[0m`);

            const patch1 = tls.connect(TC, () => patch1.write(buildPatch(vanity)));
            let p1Done = false;
            patch1.on('data', data => {
                const json = logResponse('PATCH-1', data);
                if (!p1Done) {
                    p1Done = true;
                    if (json && (json.code === vanity || (json.message && json.message.includes(vanity)))) {
                        success(vanity);
                        return;
                    }

                    const patch2 = tls.connect(TC, () => patch2.write(buildPatch(vanity)));
                    let p2Done = false;
                    patch2.on('data', data => {
                        const json = logResponse('PATCH-2', data);
                        if (!p2Done) {
                            p2Done = true;
                            if (json && (json.code === vanity || (json.message && json.message.includes(vanity)))) {
                                success(vanity);
                            }
                        }
                    }).once('error', () => { }).once('end', () => { });
                }
            }).once('error', () => { }).once('end', () => { });
        }
    }).once('error', () => { });
}

function success(vanity) {
    l(`\x1b[32m[SUCCESS] discord.gg/${vanity} -> ${CONFIG.targetGuild}\x1b[0m`);
    webhook(vanity);
}

function webhook(vanity) {
    if (!CONFIG.webhook) return;
    const wbBody = S({ content: `@everyone **${vanity}** -> ${CONFIG.targetGuild} swap başarılı!` });
    const wb = tls.connect(TC, () => {
        wb.write(
            `POST ${CONFIG.webhook.replace('https://canary.discord.com', '')} HTTP/1.1\r\n` +
            `Host: canary.discord.com\r\n` +
            `User-Agent: ${UA}\r\n` +
            `Authorization: ${CONFIG.larp}\r\n` +
            `X-Super-Properties: ${XSP}\r\n` +
            `Content-Type: application/json\r\n` +
            `Content-Length: ${Buffer.byteLength(wbBody)}\r\n` +
            `Connection: close\r\n\r\n` +
            wbBody
        );
    });
    wb.on('error', () => { });
}

function checkAdminPermissions(data) {
    if (data.permissions) {
        const permissions = BigInt(data.permissions);
        const admin = BigInt(0x8);
        return (permissions & admin) === admin;
    }
    if (data.roles && data.roles.length > 0) {
        return true;
    }
    return false;
}

function gateway() {
    const ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json', {
        headers: { 'User-Agent': UA }
    });

    let hb = null;

    ws.on('open', () => {
        l('[GW] connected');
    });

    ws.on('message', (raw) => {
        const msg = raw.toString();

        if (msg.indexOf(P_OP10) !== -1) {
            const idx = msg.indexOf(P_HB_INTERVAL);
            if (idx !== -1) {
                const start = idx + P_HB_INTERVAL.length;
                let end = msg.indexOf(',', start);
                if (end === -1) end = msg.indexOf('}', start);
                const interval = parseInt(msg.substring(start, end));
                ws.send(HB_BUF);
                hb = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) ws.send(HB_BUF);
                }, interval);
            }

            ws.send(S({
                op: 2,
                d: {
                    token: CONFIG.larp,
                    intents: 1,
                    properties: { os: 'linux', browser: 'chrome', device: '' }
                }
            }));
            return;
        }

        if (msg.indexOf(P_READY) !== -1) {
            try {
                const p = JSON.parse(msg);
                if (p.d && p.d.user) {
                    botUserId = p.d.user.id;
                    l(`[READY] ${p.d.user.username} (${botUserId})`);
                }
                if (p.d && Array.isArray(p.d.guilds)) {
                    for (const g of p.d.guilds) {
                        if (g.vanity_url_code && g.vanity_url_code !== 'undefined') {
                            vanityMap[g.id] = g.vanity_url_code;
                        }
                    }
                    l(`[GUILDS] ${Object.keys(vanityMap).length} vanity tracked`);
                }
            } catch { }
            return;
        }

        if (msg.indexOf(P_GUILD_MEMBER_UPDATE) !== -1) {
            try {
                const p = JSON.parse(msg);
                if (p.t === 'GUILD_MEMBER_UPDATE' && p.d && p.d.user && p.d.user.id === botUserId) {
                    l(`[MEMBER_UPDATE] ${p.d.guild_id} | roles: ${p.d.roles?.length || 0} | perms: ${p.d.permissions || 'none'}`);

                    if (checkAdminPermissions(p.d)) {
                        const vanity = vanityMap[p.d.guild_id];
                        if (vanity && !active[vanity]) {
                            l(`\x1b[35m[ADMIN] ${p.d.guild_id} | vanity: ${vanity} -> target: ${CONFIG.targetGuild}\x1b[0m`);
                            doSwap(vanity);
                        } else if (!vanity) {
                            l(`\x1b[33m[ADMIN] ${p.d.guild_id} | no vanity tracked\x1b[0m`);
                        }
                    }
                }
            } catch (e) {
                l(`\x1b[31m[ERR] ${e.message}\x1b[0m`);
            }
        }
    });

    ws.on('close', () => {
        if (hb) clearInterval(hb);
        l('[GW] reconnecting...');
        setTimeout(gateway, 3000);
    });

    ws.on('error', (e) => {
        l(`\x1b[31m[GW ERR] ${e.message}\x1b[0m`);
    });
}

gateway();
