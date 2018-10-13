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
                sendProactiveMessage(address,'Информация по жалобам обновилась');
                return session.endDialog();
            }
        }

        var zap = func.tipZapros(session.message.text);
        session.sendTyping();
        session.dialogData.zap = zap;

        if (zap.type=='vsp') {
            
            var vspLabels = [];
            var result = await func.findVSP(zap.text);

            if  (result.length>0) {
                for (let item of result) {
                    session.send('№'+item.num+': '+item.sbj+'/'+item.s_sbj+' '+item.opis)
                }
            }
            else {
                session.send('Информации по жалобам в ВСП '+zap.text+' не найдено');
                return session.endDialog();
            }
        }
        if (zap.type=='fio') {
            session.send('По вашему запросу ничего не смог найти :(');
            return session.endDialog();
        }  
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

