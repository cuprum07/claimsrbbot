var builder = require('botbuilder');


module.exports = [
    function (session) {

        session.send('СМ');
        session.endDialog();

    },
]