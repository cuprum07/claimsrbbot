var builder = require('botbuilder');
var db = require('./db');
var func = require('./func');

var DialogLabels = {
    rgo: 'Рейтинг РГО',
    vsp: 'Динамика ВСП'
};

module.exports = [
    async function (session) {

        session.sendTyping();

        var data = await func.vsp_gosb_rating();
        //session.send(JSON.stringify(data));
        var html = func.data_to_html(data);
        //console.log(html);
        var msg = await func.imgToHtml(html,session,'Рейтинг ГОСБ');
        session.send(msg);

        session.sendTyping();

        data = await func.vsp_gosb_dynamic();
        //session.send(JSON.stringify(data));
        html = func.data_to_html(data);
        //console.log(html);
        msg = await func.imgToHtml(html,session,'Динамика ГОСБ');
        session.send(msg);

        builder.Prompts.choice(
            session,
            'Смотреть глубже',
            [DialogLabels.vsp, DialogLabels.rgo],
            {
                maxRetries: 3,
                retryPrompt: 'Not a valid option',
                listStyle: 3
            });

        //session.endDialog();
        //session.replaceDialog('main', { reprompt: true });
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
                return session.beginDialog('vsp_vsp');
            case DialogLabels.rgo:
                return session.beginDialog('vsp_rgo');     
        }

    }    
]
