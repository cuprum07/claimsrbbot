var builder = require('botbuilder');
var db = require('./db');
var func = require('./func');
var util = require('util');
var grabzit = require('grabzit');

module.exports = [
    //async function (session) {
    async function (session) {
        console.log('typing');
        var html='<table class="table"><thead> <tr> <td>Место </td> <td>ГОСБ</td> <td>CSI на 15.04.2018 </td> <td>CSI на 21.04.2018 </td> <td>CSI на 23.04.2018 </td> <td>CSI на 05.05.2018 </td> <td>CSI на 13.05.2018 </td> <td>Динамика </td> </tr></thead><tbody> <tr> <td>1 </td> <td>Брянское </td> <td>9,919 </td> <td>9,946 </td> <td>9,953 </td> <td>9,882 </td> <td>9,825 </td> <td style="color: red;">-0,057 </td> </tr> <tr> <td>2 </td> <td>Костромское </td> <td>9,929 </td> <td>9,875 </td> <td>9,846 </td> <td>9,868 </td> <td>9,721 </td> <td style="color: red;">-0,147 </td> </tr> <tr> <td>3 </td> <td>Ярославское </td> <td>9,519 </td> <td>9,688 </td> <td>9,710 </td> <td>9,709 </td> <td>9,702 </td> <td style="color: red;">-0,007 </td> </tr> <tr> <td>4 </td> <td>Ивановское </td> <td>9,048 </td> <td>9,306 </td> <td>9,375 </td> <td>9,578 </td> <td>9,649 </td> <td style="color: #00b050;">0,071 </td> </tr> <tr> <td>5 </td> <td>Смоленское </td> <td>9,607 </td> <td>9,857 </td> <td>9,780 </td> <td>9,704 </td> <td>9,621 </td> <td style="color: red;">-0,083 </td> </tr> <tr> <td>6 </td> <td>Восточное </td> <td>9,672 </td> <td>9,690 </td> <td>9,622 </td> <td>9,614 </td> <td>9,614 </td> <td style="color: red;">0,000 </td> </tr> <tr> <td>7 </td> <td>Тульское </td> <td>9,071 </td> <td>9,514 </td> <td>9,545 </td> <td>9,400 </td> <td>9,500 </td> <td style="color: #00b050;">0,100 </td> </tr> <tr> <td>8 </td> <td>Тверское </td> <td>9,242 </td> <td>9,288 </td> <td>9,362 </td> <td>9,475 </td> <td>9,453 </td> <td style="color: red;">-0,022 </td> </tr> <tr> <td>9 </td> <td>Калужское </td> <td>9,059 </td> <td>9,261 </td> <td>9,320 </td> <td>9,319 </td> <td>9,395 </td> <td style="color: #00b050;">0,076 </td> </tr> <tr> <td>10 </td> <td>Северное </td> <td>9,565 </td> <td>9,677 </td> <td>9,232 </td> <td>9,271 </td> <td>9,388 </td> <td style="color: #00b050;">0,118 </td> </tr> <tr> <td>11 </td> <td>Западное </td> <td>9,029 </td> <td>9,241 </td> <td>9,108 </td> <td>9,273 </td> <td>9,342 </td> <td style="color: #00b050;">0,069 </td> </tr> <tr> <td>12 </td> <td>Рязанское </td> <td>8,895 </td> <td>9,113 </td> <td>9,136 </td> <td>9,337 </td> <td>9,301 </td> <td style="color: red;">-0,036 </td> </tr> <tr> <td>13 </td> <td>Южное </td> <td>9,652 </td> <td>9,649 </td> <td>9,262 </td> <td>9,197 </td> <td>9,286 </td> <td style="color: #00b050;">0,089 </td> </tr> </tbody> </table>';
        
        session.sendTyping();
        var msg = await func.imgToHtml(html,session,'Рейтинг ГОСБ');

        session.send(msg);
        session.endDialog();

        /*var customMessage = new builder.Message(session)
            .text("**Диалог DSA** *text italic*")
            .textFormat("xml");
        session.send(customMessage);*/
        
        //session.replaceDialog('main', { reprompt: true });
    },
]