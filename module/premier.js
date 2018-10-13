var builder = require('botbuilder');


module.exports = [
    function (session) {

        session.send('Премьер');
        session.endDialog();

    },
]