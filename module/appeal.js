var builder = require('botbuilder');


module.exports = [
    function (session) {

        session.send('Аппеляция');
        session.endDialog();
    },
]