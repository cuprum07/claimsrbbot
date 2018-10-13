var builder = require('botbuilder');
var db = require('./db');


var DialogLabels = {
    vsp: 'ВСП',
    dsa: 'DSA',
    premier: 'Премьер',
    sm: 'СМ',
    appeal: 'Аппеляция'
};

module.exports = [
    function (session) {

        // prompt for search option
        builder.Prompts.choice(
            session,
            'Выберите канал',
            [DialogLabels.vsp, DialogLabels.dsa, DialogLabels.premier, DialogLabels.sm, DialogLabels.appeal],
            {
                maxRetries: 3,
                retryPrompt: 'Not a valid option',
                listStyle: 3
            });
    },

    function (session, result) {

        if (!result.response) {
            // exhausted attemps and no selection, start over
            session.send('Ooops! Too many attemps :( But don\'t worry, I\'m handling that exception and you can try again!');
            return session.endDialog();
        }

        // on error, start over

        session.on('error', function (err) {

            session.send('Ошибка в сообщении: %s', err.message);

            session.endDialog();

        });

        // continue on proper dialog

        var selection = result.response.entity;
        switch (selection) {
            case DialogLabels.vsp:
                return session.beginDialog('vsp');
            case DialogLabels.dsa:
                return session.beginDialog('dsa');
            case DialogLabels.premier:
                return session.beginDialog('premier');  
            case DialogLabels.sm:
                return session.beginDialog('sm');      
            case DialogLabels.appeal:
                return session.beginDialog('appeal');      
        }

    }
]