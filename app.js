require('dotenv').config();
var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var db = require('./module/db')
var func = require('./module/func');
var fs = require('fs');
var util = require('util');

// Setup Restify Server
var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
   console.log('server', process.env.msSqlServer); 
});

server.get('/img/*', restify.plugins.serveStatic({
    directory: __dirname,
    default: 'index.html'
  }));

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
	appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
/*var bot = new builder.UniversalBot(connector, async function (session) {
    console.log('fff dkfhkhgksghw')
    var query = "select * from test"
    var result = await db.executeQueryData(query)
    console.log(result)
    session.send("You said ещё добавил текста бла бла ЕЕЕ: %s", session.message.text+' '+JSON.stringify(result));
	
	
});*/

var inMemoryStorage = new builder.MemoryBotStorage();
var fioLabels = {};

var bot = new builder.UniversalBot(connector, [
    async function(session){
        //console.log(session)
        func.update_user(session.message.address);

        console.log(session.message.text);
        if (session.message.text=='update') {
            var user = await func.user_info(session.message.address);
            console.log(user);
            if ((user.length)&&(user[0].admin=='1')) {
                var address = await func.user_addres();
                console.log(address);
                sendProactiveMessage(address,'CSI обновился!');
                return session.endDialog();
            }
        }

        if ((session.message.text=='сивакова')||(session.message.text=='Сивакова')){
            fs.readFile('img/smile.jpg', function (err, data) {
                var base64 = Buffer.from(data).toString('base64');
                var contentType = 'image/jpg';
                var msg = new builder.Message(session)
                    .addAttachment({
                        contentUrl: util.format('data:%s;base64,%s', contentType, base64),
                        contentType: contentType
                    });
                session.send(msg);  
            });
            return session.endDialog();
        }

        /*if (session.message.text=='Подписаться') {
            console.log(JSON.stringify(session.dialogData.zap));
            session.send(JSON.stringify(session.dialogData.zap));  
            session.send(JSON.stringify(session.dialogData.channel));
            return session.endDialog();
        }*/


        var zap = func.tipZapros(session.message.text);
        session.sendTyping();
        session.dialogData.zap = zap;

        if (zap.type=='vsp') {
            
            var vspLabels = [];
            var result = await func.findVSP(zap.text,session);
            var kolvo = Object.keys(result).length;
            if (typeof result['vsp'] !== "undefined") {
                session.send('CSI для ВСП '+zap.text+' (канал ВСП) на '+result.vsp.dat+': '+result.vsp.sr);
                vspLabels.push('ВСП');
                /*if (kolvo==1) {
                    builder.Prompts.choice(session, "Подробная информация:", ['Смотреть'],
                    {
                        listStyle: 3
                    });
                }*/

            }
            if (typeof result['premier'] !== "undefined") {
                session.send('CSI для ВСП '+zap.text+' (канал Премьер) на '+result.premier.dat+': '+result.premier.sr);
                vspLabels.push('Премьер');
                /*if (kolvo==1) {
                    builder.Prompts.choice(session, "Подробная информация:", ['Смотреть'],
                    {
                        listStyle: 3
                    });
                }*/
            }
            if  (kolvo>0) {
                builder.Prompts.choice(session, "Подробная информация о канале:", vspLabels,
                {
                    listStyle: 3
                });
            }
            else {
                session.send('Я приложил все усилия, но информации по данному ВСП не нашел :( Попробуйте другое.');
                return session.endDialog();
            }
        }
        if (zap.type=='fio') {
            var result = await func.findFio(zap.text,session);
            console.log('res '+JSON.stringify(result)+' '+Object.keys(result).length)
            //var kolvo = JSON.stringify(result).match(/"type":/g).length;
            var kolvo = Object.keys(result).length;
            if (kolvo==0) {
                session.send('По вашему запросу ничего не смог найти :(');
                return session.endDialog();
            }
            if (kolvo==1) {

                var keys = Object.keys(result);
                console.log(JSON.stringify(keys));
                zap = result[keys[0]];
                var channel = zap.channel;

                console.log(JSON.stringify(zap)+' '+channel);

                //session.dialogData.zap = zap;
                //session.dialogData.channel = channel;

                result = await func.moreData(zap,channel);
                
                //session.send(JSON.stringify(result)+' '+results.response.entity)
                for (let i in result) {
                    session.send(result[i])
                }

                /*builder.Prompts.choice(session, "Вы можете подписаться на эту информацию. При обновлении CSI будете получать эти данные.", 'Подписаться',
                {
                    listStyle: 3
                });*/
                return session.endDialog();

            }
            if (kolvo>1) {
                fioLabels = result;
                var labelMas = [];
                for (var key in fioLabels) {
                    labelMas.push(key);
                }
                builder.Prompts.choice(session, "Уточните запрос:", labelMas,
                {
                    listStyle: 3
                });
            }
            //session.send(JSON.stringify(result));
        }  
        
        
        //session.send(JSON.stringify(result)+' '+JSON.stringify(result).match(/"sr":/g).length);


/*        var card = new builder.HeroCard(session)
.title('BotFramework Hero Card')
.subtitle('Your bots — wherever your users are talking')
.text('Build and connect intelligent bots to interact with your users naturally wherever they are, from text/sms to Skype, Slack, Office 365 mail and other popular services.')
.images([
builder.CardImage.create(session, 'https://sec.ch9.ms/ch9/7ff5/e07cfef0-aa3b-40bb-9baa-7c9ef8ff7ff5/buildreactionbotframework_960.jpg')
])
.buttons([
builder.CardAction.openUrl(session, 'https://docs.microsoft.com/bot-framework/', 'Get Started')
]);
var msg = new builder.Message(session).addAttachment(card);
session.send(msg);

        session.send("Приветствую вас! Я CSI бот Среднерусского банка.");
        session.beginDialog("main");*/
    },
    async function (session, results){
        if (results.response) {
            session.sendTyping();

            var channel = results.response.entity;
            var zap = session.dialogData.zap;

            if (typeof fioLabels[results.response.entity]!=='undefined') {
                var zap = fioLabels[results.response.entity];
                channel = zap.channel;
            }

            var result = await func.moreData(zap,channel);
            //session.send(JSON.stringify(result)+' '+results.response.entity)
            for (let i in result) {
                session.send(result[i])
            }
            return session.endDialog();
        }    
    }

]).set('storage', inMemoryStorage); // Register in memory storage

bot.dialog('main', require('./module/main'));
bot.dialog('vsp', require('./module/vsp'));
bot.dialog('premier', require('./module/premier'));
bot.dialog('sm', require('./module/sm'));
bot.dialog('dsa', require('./module/dsa'));
bot.dialog('appeal', require('./module/appeal'));


bot.dialog('vsp_vsp', [
    function (session) {
        
        session.send('Динамика ВСП');
        return session.endDialog();
    },
    /*function (session, results) {
        session.endDialog(`Hello ${results.response}!`);
    }*/
]);

bot.dialog('vsp_rgo', [
    function (session) {
        session.send('Рейтинг РГВСП');
        return session.endDialog();
    },
    /*function (session, results) {
        session.endDialog(`Hello ${results.response}!`);
    }*/
]);

// log any bot errors into the console

bot.on('error', function (e) {
    console.log('And error ocurred', e);
});

function sendProactiveMessage(address,text) {
    //console.log('adress '+JSON.stringify(address))
    for (var i in address) {
        console.log('adress '+address)
        var addr = JSON.parse(address[i]);
        var msg = new builder.Message().address(addr);
        msg.text(text);
        msg.textLocale('ru-RU');
        bot.send(msg);
    }
}