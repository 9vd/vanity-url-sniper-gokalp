const { FastBoomber } = require('./src/index');

const fastBoomber = new FastBoomber({
    target: 'sms atılacak numara',
    amount: 1000,
});

fastBoomber.start();
