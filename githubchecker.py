import random
import requests
import json
import time
import os
import sys
import datetime
import string
import threading
import asyncio
import aiohttp
import itertools
import warnings
import re
import sqlite3
import shutil
from colorama import Fore, Style, init
from bs4 import BeautifulSoup
from urllib.parse import unquote, quote

import logging
logging.getLogger("asyncio").setLevel(logging.CRITICAL)
logging.getLogger("aiohttp").setLevel(logging.CRITICAL)
warnings.filterwarnings("ignore")

if os.name == 'nt':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# ================================================================
#  RSTORE  —  GLOBAL CONFIG
# ================================================================
if os.name == 'nt':
    CONFIG_DIR = os.path.join(os.environ.get('APPDATA', ''), 'RSTORE')
else:
    CONFIG_DIR = os.path.join(os.path.expanduser('~'), '.config', 'RSTORE')

os.makedirs(CONFIG_DIR, exist_ok=True)
DB_FILE = os.path.join(CONFIG_DIR, 'rstore.db')

LANG = "en"

TRANSLATIONS = {
    "tr": {
        "proxies_loaded":       "proxy yuklendi",
        "proxy_file_not_found": "proxies.txt bulunamadi! Bos dosya olusturuluyor...",
        "proxy_error":          "Proxy okuma hatasi",
        "proxy_refreshed":      "Proxy listesi yenilendi. Toplam",
        "cookie_grabbing":      "GitHub cookie grabbing basliyor...",
        "cookie_success":       "Cookie basariyla alindi!",
        "cookie_failed":        "Cookie alinamadi!",
        "cookie_saved":         "Cookie kaydedildi",
        "login_page":           "GitHub login sayfasi yukleniyor...",
        "csrf_found":           "CSRF token alindi",
        "logging_in":           "ile login yapiliyor...",
        "login_success":        "Login basarili!",
        "login_failed":         "Login basarisiz!",
        "2fa_active":           "2FA aktif - Manuel verify gerekli!",
        "webhook_saved":        "Webhook kaydedildi!",
        "webhook_invalid":      "Gecersiz webhook formati!",
        "webhook_prompt":       "Discord Webhook URL girin",
        "webhook_optional":     "Webhook olmadan bildirim alamazsiniz",
        "check_started":        "CHECK BASLADI",
        "sniper_started":       "SNIPER BASLADI",
        "available":            "MUSAIT",
        "taken":                "ALINMIS",
        "rate_limit":           "RATE LIMIT",
        "error":                "HATA",
        "claiming":             "claim ediliyor...",
        "claim_success":        "BASARILI! hesaba kapildi!",
        "claim_failed":         "Claim basarisiz!",
        "enter_username":       "Kullanici Adi",
        "enter_password":       "Sifre",
        "manual_cookie":        "Manuel cookie girisi",
        "cookie_paste":         "Cookie string yapistirin",
        "select_mode":          "Mod secin",
        "manual_mode":          "Manuel Checker",
        "sniper_mode":          "Sniper Modu",
        "checker_mode":         "Multi-Thread Checker",
        "focused_mode":         "Focused Sniper",
        "async_mode":           "Async Checker",
        "exit":                 "Cikis",
        "back":                 "Geri",
        "enter_target":         "Hedef kullanici adi",
        "enter_length":         "Kac hane",
        "char_mode":            "Karakter modu",
        "threads":              "Thread sayisi",
        "concurrency":          "Concurrency",
        "invalid_choice":       "Gecersiz secim!",
        "press_enter":          "Devam icin Enter...",
        "stopped":              "Durduruldu",
        "proxy_status":         "Proxy",
        "webhook_status":       "Webhook",
        "cookie_status":        "Cookie",
        "active":               "AKTIF",
        "inactive":             "PASIF",
        "main_menu":            "ANA MENU",
        "refresh_proxy":        "Proxy Yenile",
        "set_webhook":          "Webhook Ayarla",
        "refresh_cookie":       "Cookie Yenile",
        "language_select":      "Dil Secimi",
        "current_language":     "Mevcut dil",
        "check_single":         "Tekli Kontrol",
        "checking":             "Kontrol ediliyor",
        "attempt":              "deneme",
        "stop_ctrl_c":          "Durdurmak icin Ctrl+C",
        "ready":                "HAZIR",
        "rstore_welcome":       "RSTORE'a hosgeldiniz",
        "select_language":      "Dil secin",
        "english":              "Ingilizce",
        "turkish":              "Turkce",
        "save_success":         "Ayarlar kaydedildi!",
        "db_created":           "Veritabani olusturuldu",
        "db_error":             "Veritabani hatasi",
    },
    "en": {
        "proxies_loaded":       "proxies loaded",
        "proxy_file_not_found": "proxies.txt not found! Creating empty file...",
        "proxy_error":          "Proxy read error",
        "proxy_refreshed":      "Proxy list refreshed. Total",
        "cookie_grabbing":      "Starting GitHub cookie grab...",
        "cookie_success":       "Cookie successfully grabbed!",
        "cookie_failed":        "Failed to grab cookie!",
        "cookie_saved":         "Cookies saved",
        "login_page":           "Loading GitHub login page...",
        "csrf_found":           "CSRF token obtained",
        "logging_in":           "logging in...",
        "login_success":        "Login successful!",
        "login_failed":         "Login failed!",
        "2fa_active":           "2FA active - Manual verification required!",
        "webhook_saved":        "Webhook saved!",
        "webhook_invalid":      "Invalid webhook format!",
        "webhook_prompt":       "Enter your Discord Webhook URL",
        "webhook_optional":     "You won't receive notifications without a webhook",
        "check_started":        "CHECK STARTED",
        "sniper_started":       "SNIPER STARTED",
        "available":            "AVAILABLE",
        "taken":                "TAKEN",
        "rate_limit":           "RATE LIMIT",
        "error":                "ERROR",
        "claiming":             "claiming...",
        "claim_success":        "SUCCESS! Claimed to account!",
        "claim_failed":         "Claim failed!",
        "enter_username":       "Username",
        "enter_password":       "Password",
        "manual_cookie":        "Manual cookie entry",
        "cookie_paste":         "Paste cookie string",
        "select_mode":          "Select mode",
        "manual_mode":          "Manual Checker",
        "sniper_mode":          "Sniper Mode",
        "checker_mode":         "Multi-Thread Checker",
        "focused_mode":         "Focused Sniper",
        "async_mode":           "Async Checker",
        "exit":                 "Exit",
        "back":                 "Back",
        "enter_target":         "Target username",
        "enter_length":         "Length",
        "char_mode":            "Character mode",
        "threads":              "Thread count",
        "concurrency":          "Concurrency",
        "invalid_choice":       "Invalid choice!",
        "press_enter":          "Press Enter to continue...",
        "stopped":              "Stopped",
        "proxy_status":         "Proxy",
        "webhook_status":       "Webhook",
        "cookie_status":        "Cookie",
        "active":               "ACTIVE",
        "inactive":             "INACTIVE",
        "main_menu":            "MAIN MENU",
        "refresh_proxy":        "Refresh Proxies",
        "set_webhook":          "Set Webhook",
        "refresh_cookie":       "Refresh Cookie",
        "language_select":      "Language Selection",
        "current_language":     "Current language",
        "check_single":         "Single Check",
        "checking":             "Checking",
        "attempt":              "attempt",
        "stop_ctrl_c":          "Press Ctrl+C to stop",
        "ready":                "READY",
        "rstore_welcome":       "Welcome to RSTORE",
        "select_language":      "Select language",
        "english":              "English",
        "turkish":              "Turkish",
        "save_success":         "Settings saved!",
        "db_created":           "Database created",
        "db_error":             "Database error",
    }
}

def t(key):
    return TRANSLATIONS[LANG].get(key, key)

def cls():
    os.system('cls' if os.name == 'nt' else 'clear')


# ================================================================
#  CONSOLE UI  —  center-locked, no emojis, clean log format
# ================================================================
TERM_W   = shutil.get_terminal_size((120, 40)).columns
CONTENT  = 68          # all content renders inside this width
MARGIN   = max(0, (TERM_W - CONTENT) // 2)
PAD      = ' ' * MARGIN

R   = Style.RESET_ALL
B   = Style.BRIGHT
DIM = Style.DIM

CA  = Fore.CYAN    + B    # accent / info
CG  = Fore.GREEN   + B    # success / available
CR  = Fore.RED     + B    # error / taken
CY  = Fore.YELLOW  + B    # warn / rate-limit
CM  = Fore.MAGENTA + B    # sniper / claim
CW  = Fore.WHITE          # body text
CD  = Fore.WHITE   + DIM  # muted / timestamps / borders

W = CONTENT

def _strip(s):
    return re.sub(r'\x1b\[[0-9;]*m', '', s)

def _rpad(s, w):
    return s + ' ' * max(0, w - len(_strip(s)))

def _center_in(s, w=CONTENT):
    pl  = _strip(s)
    pad = max(0, w - len(pl))
    return ' ' * (pad // 2) + s + ' ' * (pad - pad // 2)

def p(line=''):
    """Every print goes through here — applies the global left margin."""
    print(PAD + line)

def _bar(ch='─', color=None):
    return (color or CD) + ch * (TERM_W - MARGIN * 2) + R

def _box_top(): return CD + '╔' + '═' * (W - 2) + '╗' + R
def _box_bot(): return CD + '╚' + '═' * (W - 2) + '╝' + R
def _box_div(): return CD + '╠' + '═' * (W - 2) + '╣' + R

def _box_row(content, width=W - 4):
    return CD + '║ ' + _rpad(content, width) + CD + ' ║' + R

def _tag(label, color=CA):
    return color + f'[{label}]' + R

def prompt(label):
    return input(PAD + '  ' + _tag('>') + '  ' + CW + f'{label}: ' + R).strip()


# ── Matrix rain intro + banner ────────────────────────────────────
RSTORE_LOGO = [
    "  ████   ████ █████  ███  ████  █████ ",
    "  █   █ █       █   █   █ █   █ █     ",
    "  ████   ███    █   █   █ ████  ████  ",
    "  █  █     █    █   █   █ █  █  █     ",
    "  █   █ ████    █    ███  █   █ █████ ",
]

MATRIX_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789@#$%&*<>[]{}|~"

def _matrix_rain_logo():
    """Reveal the RSTORE logo through matrix-style rain, column by column."""
    logo      = RSTORE_LOGO
    rows      = len(logo)
    cols      = max(len(l) for l in logo)
    revealed  = [[False] * cols for _ in range(rows)]
    logo_padded = [l.ljust(cols) for l in logo]

    # pad each line to same width
    def _render(col_revealed):
        lines = []
        for r in range(rows):
            line = PAD + "  "
            for c in range(cols):
                ch = logo_padded[r][c]
                if col_revealed[c]:
                    if ch != ' ':
                        line += CA + ch + R
                    else:
                        line += ' '
                else:
                    # still raining — show random matrix char or space
                    if ch != ' ':
                        line += Fore.GREEN + DIM + random.choice(MATRIX_CHARS) + R
                    else:
                        line += ' '
            lines.append(line)
        return lines

    # drop rain per column with a staggered start
    col_order = list(range(cols))
    random.shuffle(col_order)

    col_revealed = [False] * cols

    # Phase 1 — rain falls column by column
    for col in col_order:
        col_revealed[col] = True
        # move cursor up `rows` lines and redraw
        if col != col_order[0]:
            sys.stdout.write(f"\033[{rows}A")
        lines = _render(col_revealed)
        for line in lines:
            sys.stdout.write(line + "\n")
        sys.stdout.flush()
        time.sleep(0.018)

    # Phase 2 — brief flicker, then lock to cyan
    for _ in range(3):
        time.sleep(0.07)
        sys.stdout.write(f"\033[{rows}A")
        for r in range(rows):
            line = PAD + "  "
            for c in range(cols):
                ch = logo_padded[r][c]
                if ch != ' ':
                    # alternate between green noise and real char
                    if random.random() < 0.25:
                        line += Fore.GREEN + random.choice(MATRIX_CHARS) + R
                    else:
                        line += CA + ch + R
                else:
                    line += ' '
            sys.stdout.write(line + "\n")
        sys.stdout.flush()

    # Phase 3 — final lock, solid cyan
    time.sleep(0.08)
    sys.stdout.write(f"\033[{rows}A")
    for r in range(rows):
        line = PAD + "  "
        for c in range(cols):
            ch = logo_padded[r][c]
            line += (CA + ch + R) if ch != ' ' else ' '
        sys.stdout.write(line + "\n")
    sys.stdout.flush()


def print_huge_rstore():
    sub = "USERNAME SNIPER & CHECKER  -  VERSION 2.0 PRO"

    p()
    # print empty placeholder lines so the cursor is positioned correctly
    for _ in RSTORE_LOGO:
        print()
    _matrix_rain_logo()
    p()
    p(CD + _center_in(sub) + R)
    p()


# ── Log functions — no emojis, typed tags, aligned ───────────────
def _ts():
    return CD + time.strftime('%H:%M:%S') + R

def log_info(msg):
    p(f"  {_ts()}  {CA}[ .. ]{R}  {CW}{msg}{R}")

def log_success(msg):
    p(f"  {_ts()}  {CG}[ OK ]{R}  {CW}{msg}{R}")

def log_error(msg):
    p(f"  {_ts()}  {CR}[ !! ]{R}  {CW}{msg}{R}")

def log_warn(msg):
    p(f"  {_ts()}  {CY}[ ?? ]{R}  {CW}{msg}{R}")

def log_sniper(msg):
    p(f"  {_ts()}  {CM}[ >> ]{R}  {CW}{msg}{R}")

def log_claim(msg):
    p()
    p(_bar('=', CG))
    p(_center_in(CG + msg + R))
    p(_bar('=', CG))
    p()

# ── Result line — one aligned row per check ───────────────────────
def log_result(status, username, code=None, extra=""):
    code_colors = {200: CG, 429: CY}
    stat_colors = {
        "AVAILABLE": CG, "MUSAIT":   CG,
        "TAKEN":     CR, "ALINMIS":  CR,
        "RATE LIMIT": CY,
        "ERROR":     CR,
    }
    code_str = (code_colors.get(code, CR) + f'[{code}]' + R + '  ') if code else '        '
    sc       = stat_colors.get(status, CD)
    line = (
        f"  {_ts()}  "
        f"{code_str}"
        f"{_rpad(sc + f'{status:<11}' + R, 20)}"
        f"  {CD}@{R}{CW}{username}{R}"
        + (f"  {CD}{extra}{R}" if extra else "")
    )
    p(line)


# ── Section dividers ──────────────────────────────────────────────
def print_check_started(label="CHECK STARTED"):
    p()
    p(_bar('=', CG))
    p(_center_in(CG + f'  >>  {label}  <<  ' + R))
    p(_bar('=', CG))
    p()

def print_hit(username, platform="GitHub"):
    p()
    p(_bar('=', CG))
    p(_center_in(CG + f'  AVAILABLE  ->  @{username}  [{platform}]  ' + R))
    p(_bar('=', CG))
    p()

def print_section(title):
    p()
    p(_bar('-', CA))
    p(CA + '  ' + title + R)
    p(_bar('-', CA))
    p()


# ── Box builder ───────────────────────────────────────────────────
def print_box(title, rows):
    p()
    p(_box_top())
    p(_box_row(_center_in(CA + title + R, W - 4)))
    p(_box_div())
    for row in rows:
        p(_box_row(row))
    p(_box_bot())
    p()


# ── Main menu ─────────────────────────────────────────────────────
def print_menu():
    cls()
    print_huge_rstore()

    proxy_str   = (CG + f"ACTIVE  ({len(proxies_list)})") if USE_PROXY and proxies_list else (CR + "INACTIVE")
    webhook_str = (CG + "ACTIVE") if WEBHOOK_URL              else (CR + "INACTIVE")
    cookie_str  = (CG + "ACTIVE") if db_get("github_cookies") else (CR + "INACTIVE")

    items = [
        ('1', t('check_single')),
        ('2', t('sniper_mode')),
        ('3', t('checker_mode')),
        ('4', t('focused_mode')),
        ('5', t('async_mode')),
        ('6', t('refresh_proxy')),
        ('7', t('set_webhook')),
        ('8', t('refresh_cookie')),
        ('9', t('language_select')),
        ('0', t('exit')),
    ]

    p(_box_top())
    p(_box_row(_center_in(CA + '  RSTORE  -  ' + t('main_menu') + R, W - 4)))
    p(_box_div())
    for k, label in items:
        p(_box_row(f"  {_tag(k)}  {CW}{label}"))
    p(_box_div())
    status_row = (
        f"  {CD}Proxy{R}   {proxy_str}{R}   "
        f"{CD}Webhook{R}  {webhook_str}{R}   "
        f"{CD}Cookie{R}  {cookie_str}{R}"
    )
    p(_box_row(status_row))
    p(_box_bot())
    p()


# ================================================================
#  DATABASE
# ================================================================
def init_db():
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='config'")
        existed = c.fetchone()[0] > 0
        c.execute("""
            CREATE TABLE IF NOT EXISTS config (
                key        TEXT PRIMARY KEY,
                value      TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS logs (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                username  TEXT,
                status    TEXT,
                platform  TEXT DEFAULT 'GitHub',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()
        if not existed:
            log_success(t('db_created'))
    except Exception as e:
        log_error(f"{t('db_error')}: {e}")

def db_get(key, default=None):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("SELECT value FROM config WHERE key = ?", (key,))
        row = c.fetchone()
        conn.close()
        return row[0] if row else default
    except:
        return default

def db_set(key, value):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("""
            INSERT INTO config (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET
                value      = excluded.value,
                updated_at = CURRENT_TIMESTAMP
        """, (key, value))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        log_error(f"DB write error: {e}")
        return False

def db_delete(key):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("DELETE FROM config WHERE key = ?", (key,))
        conn.commit()
        conn.close()
        return True
    except:
        return False

def db_log_check(username, status, platform="GitHub"):
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute(
            "INSERT INTO logs (username, status, platform) VALUES (?, ?, ?)",
            (username, status, platform)
        )
        conn.commit()
        conn.close()
    except:
        pass


# ================================================================
#  LANGUAGE SELECTION
# ================================================================
def select_language():
    global LANG
    cls()
    print_huge_rstore()
    print_box(
        'SELECT LANGUAGE  /  DIL SECIMI',
        [
            f"  {_tag('1')}  {CW}English",
            f"  {_tag('2')}  {CW}Turkce",
        ]
    )
    choice = prompt('Choice')
    LANG = 'tr' if choice == '2' else 'en'
    db_set('language', LANG)
    log_success(f"{t('save_success')}  |  {t('current_language')}: {LANG.upper()}")

def check_language():
    global LANG
    saved = db_get('language', '')
    if not saved:
        select_language()
    else:
        LANG = saved
        log_success(f"{t('current_language')}: {LANG.upper()}")


# ================================================================
#  PROXY SYSTEM
# ================================================================
proxies_list    = []
proxy_lock      = threading.Lock()
proxy_cycle_obj = [None]
USE_PROXY       = True

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
]

def parse_proxy_line(line):
    line = line.strip()
    if not line or line.startswith('#'):
        return None
    line = re.sub(r'^(https?|socks[45])://', '', line)
    if '@' in line:
        auth, addr = line.split('@', 1)
        ap, hp = auth.split(':'), addr.split(':')
        if len(ap) == 2 and len(hp) == 2:
            return f"{hp[0]}:{hp[1]}:{ap[0]}:{ap[1]}"
    parts = re.split(r'[ \t:]+', line)
    if len(parts) == 2:
        try:
            if 1 <= int(parts[1]) <= 65535:
                return f"{parts[0]}:{parts[1]}"
        except:
            pass
    if len(parts) == 4:
        try:
            if 1 <= int(parts[1]) <= 65535:
                return ':'.join(parts)
        except:
            pass
    return None

def load_proxies_from_file():
    loaded = set()
    try:
        if os.path.exists('proxies.txt'):
            with open('proxies.txt', 'r', encoding='utf-8') as f:
                for line in f:
                    px = parse_proxy_line(line)
                    if px:
                        loaded.add(px)
            log_success(f"{len(loaded)} {t('proxies_loaded')}")
        else:
            log_warn(t('proxy_file_not_found'))
            with open('proxies.txt', 'w', encoding='utf-8') as f:
                f.write("# Supported formats:\n# ip:port\n# ip:port:user:pass\n# user:pass@ip:port\n")
    except Exception as e:
        log_error(f"{t('proxy_error')}: {e}")
    return loaded

def refresh_proxies():
    global proxies_list
    found = load_proxies_from_file()
    proxies_list = list(found)
    with proxy_lock:
        if proxies_list:
            proxy_cycle_obj[0] = itertools.cycle(proxies_list)
    log_info(f"{t('proxy_refreshed')}: {len(proxies_list)}")

def get_proxy():
    if not USE_PROXY or not proxies_list or not proxy_cycle_obj[0]:
        return None
    with proxy_lock:
        return next(proxy_cycle_obj[0])

def format_proxy(proxy_str):
    if not proxy_str:
        return None, None, None
    parts = proxy_str.strip().split(':')
    if len(parts) == 4:
        h, port, u, pw = parts
        px = {
            "http":  f"http://{u}:{pw}@{h}:{port}",
            "https": f"http://{u}:{pw}@{h}:{port}",
        }
        return px, f"http://{h}:{port}", aiohttp.BasicAuth(u, pw)
    if len(parts) == 2:
        r = f"http://{proxy_str}"
        return {"http": r, "https": r}, r, None
    return None, None, None

def proxy_refresher():
    while True:
        time.sleep(300)
        refresh_proxies()


# ================================================================
#  GITHUB COOKIE GRABBER
# ================================================================
class GitHubCookieGrabber:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent":                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
            "Accept":                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language":           "en-US,en;q=0.9",
            "Accept-Encoding":           "gzip, deflate, br",
            "Sec-Fetch-Dest":            "document",
            "Sec-Fetch-Mode":            "navigate",
            "Sec-Fetch-Site":            "none",
            "Upgrade-Insecure-Requests": "1",
            "Connection":                "keep-alive",
        })

    def grab_with_login(self, username, password):
        log_info(t('cookie_grabbing'))
        try:
            log_info(t('login_page'))
            r = self.session.get("https://github.com/login", timeout=15)
            if r.status_code != 200:
                log_error(f"Status: {r.status_code}")
                return None

            soup       = BeautifulSoup(r.text, 'html.parser')
            csrf_token = None
            meta       = soup.find('meta', {'name': 'csrf-token'})
            if meta:
                csrf_token = meta.get('content')
            if not csrf_token:
                inp = soup.find('input', {'name': 'authenticity_token'})
                if inp:
                    csrf_token = inp.get('value')
            if not csrf_token:
                m = re.search(r'authenticity_token[^>]+value="([^"]+)"', r.text)
                if m:
                    csrf_token = m.group(1)
            if not csrf_token:
                log_error("CSRF token not found")
                return None

            log_success(f"{t('csrf_found')}: {csrf_token[:20]}...")

            login_data = {
                'commit':             'Sign in',
                'authenticity_token': csrf_token,
                'login':              username,
                'password':           password,
                'return_to':          '',
                'trusted_device':     '',
                'webauthn-support':   'supported',
                'timestamp':          '',
                'timestamp_secret':   '',
            }

            log_info(f"@{username} {t('logging_in')}")
            r = self.session.post(
                "https://github.com/session",
                data=login_data, allow_redirects=True, timeout=15
            )

            if "Verify using" in r.text or "Two-factor authentication" in r.text:
                log_warn(t('2fa_active'))
                return None

            if r.status_code == 200 and "Sign in" not in r.text:
                log_success(t('login_success'))
                cookie_string = self._build_cookie_string()
                if cookie_string:
                    self._save_cookies(username, cookie_string)
                    return cookie_string
                log_error(t('cookie_failed'))
                return None
            else:
                log_error(f"{t('login_failed')}  Status: {r.status_code}")
                return None
        except Exception as e:
            log_error(f"Error: {e}")
            return None

    def _build_cookie_string(self):
        if not self.session.cookies:
            return None
        return "; ".join(f"{k}={quote(v, safe='')}" for k, v in self.session.cookies.items())

    def _save_cookies(self, username, cookie_string):
        db_set("github_cookies", cookie_string)
        db_set("github_username", username)
        db_set("cookie_grabbed_at", datetime.datetime.now().isoformat())
        log_success(t('cookie_saved'))


def setup_github_cookies_auto():
    cookies = db_get("github_cookies", "")
    if cookies:
        log_info("Saved GitHub cookies found")
        print_box('GITHUB COOKIE SETUP', [
            f"  {_tag('1')}  {CW}Use saved cookies",
            f"  {_tag('2')}  {CW}Login and grab new cookies",
            f"  {_tag('3')}  {CW}Manual cookie entry",
        ])
        choice = prompt('Choice')
        if choice == "1":   return cookies
        elif choice == "2": return _grab_new_cookies()
        elif choice == "3": return _manual_cookie_input()
    else:
        log_warn("No saved cookies found")
        print_box('GITHUB COOKIE SETUP', [
            f"  {_tag('1')}  {CW}Login and grab cookies",
            f"  {_tag('2')}  {CW}Manual cookie entry",
        ])
        choice = prompt('Choice')
        if choice == "1":   return _grab_new_cookies()
        elif choice == "2": return _manual_cookie_input()
    return None

def _grab_new_cookies():
    grabber  = GitHubCookieGrabber()
    username = prompt(t('enter_username'))
    password = prompt(t('enter_password'))
    if username and password:
        return grabber.grab_with_login(username, password)
    return None

def _manual_cookie_input():
    print_section(f"{t('manual_cookie')} — {t('cookie_paste')} (blank line to finish)")
    lines = []
    while True:
        line = input(PAD + '  ')
        if not line:
            break
        lines.append(line)
    cookie_string = " ".join(lines).strip()
    if cookie_string:
        db_set("github_cookies", cookie_string)
        db_set("cookie_grabbed_at", datetime.datetime.now().isoformat())
        log_success(t('cookie_saved'))
        return cookie_string
    return None


# ================================================================
#  WEBHOOK SYSTEM
# ================================================================
WEBHOOK_URL = None

def setup_webhook():
    wh = db_get("discord_webhook", "")
    if wh and '/api/webhooks/' in wh and not wh.startswith('http'):
        wh = 'https://discord.com' + wh
        db_set("discord_webhook", wh)
    if wh:
        log_info("Saved webhook found")
        print_box('WEBHOOK SETUP', [
            f"  {_tag('1')}  {CW}Use saved webhook",
            f"  {_tag('2')}  {CW}Enter new webhook",
            f"  {_tag('3')}  {CW}Remove webhook",
        ])
        choice = prompt('Choice')
        if choice == "1":   return wh
        elif choice == "2": return _input_webhook()
        elif choice == "3":
            db_delete("discord_webhook")
            log_info("Webhook removed")
            return None
    else:
        log_info(t('webhook_prompt'))
        log_warn(t('webhook_optional'))
        return _input_webhook()

def _input_webhook():
    wh = prompt('Webhook URL')
    if not wh:
        return None
    if '/api/webhooks/' in wh and not wh.startswith('http'):
        wh = 'https://discord.com' + wh
    if '/api/webhooks/' in wh:
        db_set("discord_webhook", wh)
        log_success(t('webhook_saved'))
        return wh
    log_warn(t('webhook_invalid'))
    return None

def send_discord_webhook(username, status_text, platform="GitHub"):
    if not WEBHOOK_URL:
        log_warn(f"Webhook not set — skipping notify for @{username} [{status_text}]")
        return
    dt           = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    is_claimed   = "CLAIM"     in status_text.upper()
    is_available = "AVAILABLE" in status_text.upper()

    if is_claimed:
        color  = 0xFFD700
        status = "Claimed"
    elif is_available:
        color  = 0x9B59B6
        status = "Available"
    else:
        log_warn(f"Webhook: unknown status '{status_text}' — skipping")
        return

    payload = {
        "username":   "RStore",
        "avatar_url": "https://cdn.discordapp.com/attachments/1515015717836165346/1520905869150257293/5FD82CA9-615B-4F28-A0BB-8DAE33975BAB.png?ex=6a42e578&is=6a4193f8&hm=b1e2ad5da29ea2a922aa352b99caff8097c9185b10b2919d31dba91692028e2f&",
        "embeds": [
            {
                "title": "RStore Github Sniper",
                "color": color,
                "thumbnail": {
                    "url": "https://cdn.discordapp.com/attachments/1515015717836165346/1520905869150257293/5FD82CA9-615B-4F28-A0BB-8DAE33975BAB.png?ex=6a42e578&is=6a4193f8&hm=b1e2ad5da29ea2a922aa352b99caff8097c9185b10b2919d31dba91692028e2f&"
                },
                "fields": [
                    {"name": "Username",    "value": f"`{username}`", "inline": False},
                    {"name": "Status",    "value": f"`{status}`",   "inline": False},
                ],
                "footer":    {"text": "https://discord.gg/rstore"},
                "timestamp": datetime.datetime.utcnow().isoformat(),
            }
        ],
    }
    try:
        r = requests.post(WEBHOOK_URL, json=payload, timeout=5)
        if r.status_code in [200, 204]:
            log_success(f"Webhook sent  [{status}]  @{username}")
        else:
            log_error(f"Webhook failed  HTTP {r.status_code}  {r.text[:80]}")
    except Exception as e:
        log_error(f"Webhook error: {e}")


# ================================================================
#  GITHUB SESSION & CLAIM
# ================================================================
def setup_github_session():
    cookie_string = db_get("github_cookies", "")
    if not cookie_string:
        log_error("No GitHub cookies — grab cookies first")
        return None
    COOKIES = {}
    for item in cookie_string.split('; '):
        if '=' in item:
            k, v = item.split('=', 1)
            COOKIES[k.strip()] = unquote(unquote(v.strip()))
    session = requests.Session()
    session.cookies.update(COOKIES)
    session.headers.update({
        "User-Agent": random.choice(USER_AGENTS),
        "Accept":     "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })
    return session

def github_get_form_data(session):
    try:
        r = session.get("https://github.com/settings/admin", timeout=10)
        if r.status_code != 200 or "Sign in" in r.text:
            log_error("GitHub session invalid — refresh cookies")
            return None
        soup        = BeautifulSoup(r.text, 'html.parser')
        rename_form = next(
            (f for f in soup.find_all('form') if 'rename' in f.get('action', '')), soup
        )
        def get_val(name):
            inp = rename_form.find('input', {'name': name}) or soup.find('input', {'name': name})
            return inp.get('value', '') if inp else None
        return {
            'authenticity_token': get_val('authenticity_token'),
            'timestamp':          get_val('timestamp'),
            'timestamp_secret':   get_val('timestamp_secret'),
        }
    except Exception as e:
        log_error(f"Form data error: {e}")
        return None

def claim_github_username(target):
    session = setup_github_session()
    if not session:
        return False
    current = session.cookies.get("dotcom_user")
    if not current:
        log_error("dotcom_user cookie not found")
        return False
    log_sniper(f"@{target}  {t('claiming')}")
    form = github_get_form_data(session)
    if not form or not form.get('authenticity_token'):
        log_error("Form data unavailable")
        return False
    payload = {"authenticity_token": form['authenticity_token'], "login": target}
    if form.get('timestamp'):        payload['timestamp']        = form['timestamp']
    if form.get('timestamp_secret'): payload['timestamp_secret'] = form['timestamp_secret']
    session.headers.update({
        "Content-Type": "application/x-www-form-urlencoded",
        "Referer":      "https://github.com/settings/admin",
        "Origin":       "https://github.com",
    })
    resp = session.post(
        f"https://github.com/users/{current}/rename",
        data=payload, allow_redirects=False, timeout=15
    )
    if resp.status_code in [200, 301, 302]:
        log_claim(f"{t('claim_success')}  @{target}")
        send_discord_webhook(target, "CLAIMED", "GitHub")
        return True
    log_error(f"{t('claim_failed')}  HTTP {resp.status_code}")
    return False


# ================================================================
#  CHECKER FUNCTIONS
# ================================================================
def generate_custom_username(length, mode):
    chars = {'l': string.ascii_lowercase, 'n': string.digits}.get(
        mode, string.ascii_lowercase + string.digits
    )
    return ''.join(random.choices(chars, k=length))

def check_github_username_availability(username):
    url = f"https://github.com/signup_check/username?value={username}"
    headers = {
        "User-Agent":       random.choice(USER_AGENTS),
        "Accept":           "application/json, text/javascript, */*; q=0.01",
        "Accept-Language":  "en-US,en;q=0.9",
        "Referer":          "https://github.com/signup",
        "Origin":           "https://github.com",
        "X-Requested-With": "XMLHttpRequest",
        "Sec-Fetch-Dest":   "empty",
        "Sec-Fetch-Mode":   "cors",
        "Sec-Fetch-Site":   "same-origin",
        "Connection":       "keep-alive",
    }
    req_proxies, _, _ = format_proxy(get_proxy())
    try:
        r = requests.get(url, headers=headers, proxies=req_proxies, timeout=10)
        if r.status_code == 200:
            if "not available" not in r.text.lower():
                log_result(t('available'), username, 200)
                db_log_check(username, "AVAILABLE")
                claimed = claim_github_username(username)
                if not claimed:
                    send_discord_webhook(username, "Available", "GitHub")
                return True
            else:
                log_result(t('taken'), username, 200)
                db_log_check(username, "TAKEN")
                return False
        elif r.status_code == 429:
            log_result(t('rate_limit'), username, 429)
            db_log_check(username, "RATE_LIMIT")
            return "rate_limit"
        else:
            log_result(t('error'), username, r.status_code, r.text.strip()[:30])
            db_log_check(username, f"ERROR_{r.status_code}")
            return False
    except Exception as e:
        log_error(f"Check error: {e}")
        db_log_check(username, "ERROR")
        return "error"

async def async_check_github_username(session, username, proxy=None):
    url = f"https://github.com/signup_check/username?value={username}"
    headers = {
        "User-Agent":       random.choice(USER_AGENTS),
        "Accept":           "application/json, text/javascript, */*; q=0.01",
        "Accept-Language":  "en-US,en;q=0.9",
        "Referer":          "https://github.com/signup",
        "Origin":           "https://github.com",
        "X-Requested-With": "XMLHttpRequest",
        "Sec-Fetch-Dest":   "empty",
        "Sec-Fetch-Mode":   "cors",
        "Sec-Fetch-Site":   "same-origin",
        "Connection":       "keep-alive",
    }
    kwargs = {"headers": headers, "timeout": aiohttp.ClientTimeout(total=8)}
    _, aio_px, aio_auth = format_proxy(proxy)
    if aio_px:
        kwargs["proxy"] = aio_px
        if aio_auth:
            kwargs["proxy_auth"] = aio_auth
    try:
        async with session.get(url, **kwargs) as response:
            text = await response.text()
            if response.status == 200:
                if "not available" not in text.lower():
                    db_log_check(username, "AVAILABLE")
                    loop = asyncio.get_event_loop()
                    def _claim_and_notify():
                        claimed = claim_github_username(username)
                        if not claimed:
                            send_discord_webhook(username, "Available", "GitHub")
                    loop.run_in_executor(None, _claim_and_notify)
                    return True
                db_log_check(username, "TAKEN")
                return False
            elif response.status == 429:
                db_log_check(username, "RATE_LIMIT")
                return "rate_limit"
            else:
                db_log_check(username, f"ERROR_{response.status}")
                return "error"
    except Exception:
        db_log_check(username, "ERROR")
        return "error"


# ================================================================
#  FOCUSED CHECKER
# ================================================================
def focused_checker(target_username):
    p()
    log_sniper(f"Focused on  @{target_username}")
    log_warn(t('stop_ctrl_c'))
    print_check_started(f"FOCUSED  |  @{target_username}")
    attempt = 1
    try:
        while True:
            result = check_github_username_availability(target_username)
            if result is True:
                print_hit(target_username)
                break
            elif result == "rate_limit":
                time.sleep(30)
            elif result == "error":
                log_warn("Error — retrying in 10s")
                time.sleep(10)
            attempt += 1
            time.sleep(3)
    except KeyboardInterrupt:
        p()
        log_warn(f"{t('stopped')}  |  {attempt - 1} {t('attempt')}")


# ================================================================
#  MAIN
# ================================================================
def main():
    global WEBHOOK_URL, LANG

    init(autoreset=True)

    # DB first — log functions depend on it
    # (log_success calls p() which is safe before db is up)
    init_db()

    check_language()
    time.sleep(0.4)

    cls()
    print_huge_rstore()
    print_section("STARTUP")
    log_info("Loading proxies...")
    refresh_proxies()
    threading.Thread(target=proxy_refresher, daemon=True).start()

    WEBHOOK_URL = setup_webhook()

    print_section("GITHUB COOKIE SETUP")
    setup_github_cookies_auto()

    while True:
        print_menu()
        choice = prompt('Select')

        if choice == "1":
            name = prompt(t('enter_target'))
            if name:
                print_check_started("SINGLE CHECK")
                check_github_username_availability(name)
                input(PAD + f"  {CD}{t('press_enter')}{R}")

        elif choice == "2":
            name = prompt(t('enter_target'))
            if name:
                log_sniper(f"{t('sniper_started')}: @{name}")
                print_check_started("SNIPER MODE")
                try:
                    while True:
                        result = check_github_username_availability(name)
                        if result is True:
                            print_hit(name)
                            break
                        elif result == "rate_limit":
                            time.sleep(30)
                        else:
                            time.sleep(5)
                except KeyboardInterrupt:
                    p()
                    log_warn(t('stopped'))
                input(PAD + f"  {CD}{t('press_enter')}{R}")

        elif choice == "3":
            while True:
                try:
                    length = int(prompt(f"{t('enter_length')} (3-15)"))
                    if 3 <= length <= 15: break
                    log_error("Must be between 3 and 15")
                except:
                    log_error("Enter a valid number")
            while True:
                char_mode = prompt(f"{t('char_mode')}  [L] Letters  [N] Numbers  [A] Alphanumeric").lower()
                if char_mode in ['l', 'n', 'a']: break
                log_error("Enter L, N, or A")
            try:
                thread_count = int(prompt(t('threads')))
            except:
                thread_count = 5

            def worker():
                while True:
                    check_github_username_availability(generate_custom_username(length, char_mode))
                    time.sleep(2)

            log_info(f"Starting {thread_count} threads  |  Ctrl+C to stop")
            print_check_started("MULTI-THREAD")
            try:
                for _ in range(thread_count):
                    threading.Thread(target=worker, daemon=True).start()
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                p()
                log_warn(t('stopped'))
                time.sleep(1)

        elif choice == "4":
            target = prompt(t('enter_target'))
            if target:
                focused_checker(target)
                input(PAD + f"  {CD}{t('press_enter')}{R}")

        elif choice == "5":
            async def run_async_checker(length, char_mode, concurrency=10):
                log_info(f"Async mode  |  concurrency: {concurrency}")
                conn = aiohttp.TCPConnector(ssl=False)
                async with aiohttp.ClientSession(connector=conn) as sess:
                    done = [0]

                    async def worker():
                        while True:
                            username = generate_custom_username(length, char_mode)
                            proxy    = get_proxy()
                            res      = await async_check_github_username(sess, username, proxy)
                            done[0] += 1
                            n = done[0]
                            if res is True:
                                log_result(t('available'),   username, 200, f"#{n}")
                            elif res == "rate_limit":
                                log_result(t('rate_limit'),  username, 429, f"#{n}")
                            elif res is False:
                                log_result(t('taken'),       username, 200, f"#{n}")

                    workers = [asyncio.create_task(worker()) for _ in range(concurrency)]
                    try:
                        await asyncio.gather(*workers)
                    except asyncio.CancelledError:
                        pass

            try:
                l   = int(prompt(t('enter_length')))
                m   = prompt(f"{t('char_mode')} (L/N/A)").lower()
                con = int(prompt(t('concurrency')))
                print_check_started("ASYNC MODE")
                try:
                    asyncio.run(run_async_checker(l, m, con))
                except KeyboardInterrupt:
                    p()
                    log_warn(t('stopped'))
                input(PAD + f"  {CD}{t('press_enter')}{R}")
            except Exception as e:
                log_error(f"Input error: {e}")
                time.sleep(2)

        elif choice == "6":
            print_section("PROXY REFRESH")
            refresh_proxies()
            input(PAD + f"  {CD}{t('press_enter')}{R}")

        elif choice == "7":
            WEBHOOK_URL = setup_webhook()
            input(PAD + f"  {CD}{t('press_enter')}{R}")

        elif choice == "8":
            setup_github_cookies_auto()
            input(PAD + f"  {CD}{t('press_enter')}{R}")

        elif choice == "9":
            select_language()
            input(PAD + f"  {CD}{t('press_enter')}{R}")

        elif choice == "0":
            p()
            log_info("RSTORE  |  Shutting down")
            break

        else:
            log_error(t('invalid_choice'))
            time.sleep(1)


if __name__ == "__main__":
    main()
