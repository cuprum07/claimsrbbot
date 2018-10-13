var builder = require('botbuilder');
var db = require('./db');
var fs = require('fs');
var util = require('util');
var grabzit = require('grabzit');
var pdfcrowd = require("pdfcrowd");

var optionsImg = {
    "browserWidth":1024, 
    "browserHeight":-1,
    /*"width":-1, 
    "height":-1,*/
    "format":"png"
};

var style = "<style>"+
    "body {font-family: arial;}"+
    "table {width: 100%;border-collapse:separator; border:solid black 1px; border-radius:15px;-moz-border-radius:15px;}"+
    "td, th {border-left:solid black 1px; border-top:solid black 1px; border-bottom:none; border-right:none; padding: 10px 3px; text-align: center;}"+
    "th {background-color: #4682B4; color: #fff; font-weight: normal;}"+
    "th:first-child {border-top: none;}"+
    "td:first-child, th:first-child {border-left: none;}"+
    ".align-left {text-align: left;}"+
    ".green {color: green;}"+
    ".red {color: red;}"+
"</style>"

module.exports = {
    imgToHtml: function(html,session,text){
        return new Promise (function(resolve,reject){
            var client = new grabzit(process.env.grabzitKey, process.env.grabzitSecret);
            
            var imgName = 'res'+(Math.floor(Math.random() * 9999999) + 1)+'.png';
            var pathImg = "img/"+imgName;

            client.html_to_image('<html>'+style+'<body>'+html+'</body></html>',optionsImg); 

            client.save_to(pathImg, function (error, id){
                console.log('id '+id+' error '+error );
                if (error != null){
                    return session.send('Ошибка при конвертировании в картинку '+error);
                }
                else {
                    if (session.message.source=='msteams') {
                        fs.readFile(pathImg, function (err, data) {
                            if (err) {
                                return session.send('Ошибка при чтении картинки '+err);
                            }
                            var base64 = Buffer.from(data).toString('base64');
                            var contentType = 'image/png';
                            var msg = new builder.Message(session)
                                .text(text)
                                .addAttachment({
                                    contentUrl: util.format('data:%s;base64,%s', contentType, base64),
                                    contentType: contentType
                                });
                            resolve(msg);     
                        });
                    }
                    else {
                        var card = new builder.HeroCard(session)
                            .title(text)
                            /*.subtitle('subtitle fdfdfdf')
                            .text('text text text')*/
                            .images([
                                builder.CardImage.create(session, process.env.pathStaticImg+imgName)
                            ])
                        //.buttons([
                        //    builder.CardAction.openUrl(session, 'https://docs.microsoft.com/bot-framework', 'Get Started')
                        //]);
                        var msg = new builder.Message(session).addAttachment(card);
                        resolve(msg);
                    }                         
                }
            }); 		
        })
    },
    imgToHtmlPdf: function(html,session,text){
        return new Promise (function(resolve,reject){
            var client = new pdfcrowd.HtmlToImageClient(process.env.pdfcrowdLogin, process.env.pdfcrowdKey);
            
            var imgName = 'res'+(Math.floor(Math.random() * 9999999) + 1)+'.png';
            var pathImg = "img/"+imgName;

            // configure the conversion
            try {
                client.setOutputFormat("png");
            } catch(why) {
                console.error("Pdfcrowd Error: " + why);
                console.error("Pdfcrowd Error Code: " + why.getCode());
                console.error("Pdfcrowd Error Message: " + why.getMessage());
                process.exit(1);
            }

            // run the conversion and write the result to a file
            client.convertStringToFile(
                '<html>'+style+'<body>'+html+'</body></html>',
                pathImg,
                function(err, fileName) {
                    if (err) return session.send('Ошибка при конвертировании в картинку '+error);

                    console.log("Success: the file was created " + fileName);
                    if (session.message.source=='msteams') {
                        fs.readFile(pathImg, function (err, data) {
                            if (err) {
                                return session.send('Ошибка при чтении картинки '+err);
                            }
                            var base64 = Buffer.from(data).toString('base64');
                            var contentType = 'image/png';
                            var msg = new builder.Message(session)
                                .text(text)
                                .addAttachment({
                                    contentUrl: util.format('data:%s;base64,%s', contentType, base64),
                                    contentType: contentType
                                });
                            resolve(msg);     
                        });
                    }
                    else {
                        var card = new builder.HeroCard(session)
                            .title(text)
                            /*.subtitle('subtitle fdfdfdf')
                            .text('text text text')*/
                            .images([
                                builder.CardImage.create(session, process.env.pathStaticImg+imgName)
                            ])
                        //.buttons([
                        //    builder.CardAction.openUrl(session, 'https://docs.microsoft.com/bot-framework', 'Get Started')
                        //]);
                        var msg = new builder.Message(session).addAttachment(card);
                        resolve(msg);

                    }        
            });	
        })
    },
    vsp_gosb_rating: async function(){
        var query = "SELECT "+ 
                "[ГОСБ2] as gosb, "+
                "Format([Date_create], 'dd.MM.yyyy') as dat, "+
                "count([Оценка1]) as kolvo, "+
                "ROUND(AVG ([Оценка1]),3) as sr "+
            "FROM [dbo].[VSP] "+
                "where [Date_create]=(select max([Date_create]) from [dbo].[VSP]) "+
                "group by [ГОСБ2],[Date_create] "+
                "order by [Date_create] desc, sr desc";
        var result = await db.executeQueryData(query);
        return result;
        //JSON.stringify(result)
    },
    vsp_gosb_dynamic: async function(){
        var query = "SELECT "+ 
                "[ГОСБ2] as gosb, "+
                "Format([Date_create], 'dd.MM.yyyy') as dat, "+
                "count([Оценка1]) as kolvo, "+
                "ROUND(AVG ([Оценка1]),3) as sr "+
            "FROM [dbo].[VSP] "+
                "where [Date_create] in (select top 3 [Date_create] from [dbo].[VSP] group by [Date_create] order by [Date_create] desc) "+
                "and [ГОСБ2]!=N'НЕ ОПРЕДЕЛЕНО' "+
                "group by [ГОСБ2],[Date_create] "+
                "order by [Date_create] desc, sr desc";
        var result = await db.executeQueryData(query);
        return result;
        //JSON.stringify(result)
    },    
    user_info: async function(address) {
        var query="select * from users where channel='"+address.channelId+"' and user_id=N'"+address.user.id+"'";
        var result = await db.executeQueryData(query);
        return result;
    },
    update_user: async function (address) {
        var result = await this.user_info(address);
        var query = '';
        if (result.length) {
            var query = "update users set dat=GETDATE() where id='"+result[0].id+"'";
        }
        else {
            var query = "insert into users (channel, user_id,addr, dat) VALUES ('"+address.channelId+"', '"+address.user.id+"',N'"+JSON.stringify(address)+"',GETDATE())";
        }
        db.executeQueryData(query);
    },
    user_addres: async function(){
        var query = "select addr from users";
        var result = await db.executeQueryData(query);
        var mas=[];
        for(var i in result) {
            mas.push(result[i].addr);
        }
        return mas;
    },
    data_to_html: function(data){
        var header_dat=[];
        var gosb=[];
        for (i in data) {
            if (!header_dat.includes(data[i].dat)) header_dat.push(data[i].dat); 
            if (!gosb.includes(data[i].gosb)) gosb.push(data[i].gosb);
        }
        header_dat=header_dat.reverse();
        var kol_dat = header_dat.length;

        var html = '<table><thead><tr><th rowspan="2">Место</th><th rowspan="2">ГОСБ</th>';

        for (var i in header_dat) {
            html+='<th colspan="2">'+header_dat[i]+'</th>'
        }

        if(kol_dat>1){
            html+='<th rowspan="2">Динамика</th>';
        }
        html+='</tr><tr>';
        for (var i in header_dat) {
            html+='<th>Кол-во оценок</th><th>CSI</th>';
        }
        html+='</tr>';
        for (var i in gosb) {
            html+='<tr><td>'+(parseInt(i)+1)+'</td><td class="align-left">'+gosb[i]+'</td>';
            for (j in header_dat) {
                //html+='<td></td><td></td>';
                html+='<td>'+this.find_value(data,gosb[i],header_dat[j],'kolvo')+'</td>';
                html+='<td>'+this.find_value(data,gosb[i],header_dat[j],'sr')+'</td>';
            }
            if(kol_dat>1){
                html+='<td>'+this.dynamic(data,gosb[i],header_dat[kol_dat-1],header_dat[kol_dat-2])+'</td>';
            }
            html+='</tr>';
        }
        html+='</table>';
        return html;
    },
    find_value: function(data,gosb,dat,tip){
        var value='';
        for (var i in data) {
            if ((data[i].gosb==gosb)&&(data[i].dat==dat)) {
                console.log(data[i].kolvo+' '+data[i].sr+' '+gosb+' '+dat);
                if (tip=='kolvo') value = data[i].kolvo;
                if (tip=='sr') value = data[i].sr;
            }
        }
        return value;
    },
    dynamic: function(data,gosb,dat_new,dat_old){
        var sr_new = 0;
        var sr_old = 0;
        var dynamic = 0;
        var clas="green";
        for (var i in data) {
            if ((data[i].gosb==gosb)&&(data[i].dat==dat_new)) {
                sr_new=data[i].sr;
            }
            if ((data[i].gosb==gosb)&&(data[i].dat==dat_old)) {
                sr_old=data[i].sr;
            }
        }
        dynamic = sr_new - sr_old;
        dynamic = dynamic.toFixed(3);
        if(dynamic<0) clas="red";
        return '<span class="'+clas+'">'+dynamic+'</span>';
    },
    tipZapros: function(text){
        var mas_gosb = [17,8604,8605,8606,8607,8608,8609,8639,8640,9040];
        //console.log('start '+text);
        var text = text.trim();
        text = text.replace(/  /g, ' ');
        text = text.replace(/ё/g, 'е');
        //console.log('enddd '+text);
        var tip = 'fio';
        var mas = text.split(/[\s|,_\-!#/]+/);
        var gosb = parseInt(mas[0]);

        if (mas_gosb.indexOf(gosb) != -1) {
            tip = 'vsp';
            text = gosb+'/0'+parseInt(mas[1])
        }

        var res = {
            type: tip,
            text: text
        }
        return res;
    },
    smallButton: function(text,session){
        if (session.message.source=='telegram') {
            return text.substring(0,32);
        }
        else return text;
    },
    initialy: function(text){
        var arr = text.split(" ");
        var answer = arr[0];
        for (var i = 1; i < arr.length; i++)
        {
            console.log(i+' '+arr[i]);
            answer+=" ";
            answer+=arr[i].substring(0,1);
            answer+=".";
        }
        return answer;
    },
    dinamicCsi: function(mas){
        var din = 0;
        var kol = mas.length;
        var text = 'За последний период CSI не изменился.'
        var csi_akt = parseFloat(mas[kol-1].sr);
        din = Math.round((csi_akt - parseFloat(mas[kol-2].sr))*1000)/1000;
        if (din<0) {
            text = 'За последний период CSI уменьшился на '+din+'. Эх :(';
            if ((csi_akt>=9.5)&&(csi_akt<9.6)) text = text + ' Но вы выполняете план :) Отлично!';
            if (csi_akt>=9.6) text = text + ' Но вы перевыполняете план :) Вы великолепны! Так держать!';
        }
        if (din>0) {
            text = 'За последний период CSI увеличился на '+din+'. Супер!';
            if ((csi_akt>=9.5)&&(csi_akt<9.6)) text = text + 'Вы ещё выполняете план :) Отлично!';
            if (csi_akt>=9.6) text = text + ' Вы ещё и перевыполняете план :) Вы великолепны! Так держать!';
        } 
        if (din==0) {
            if (csi_akt<9.5) text = text + ' Вы не выполняете план, эх :( ';
            if ((csi_akt>=9.5)&&(csi_akt<9.6)) text = text + ' Вы выполняете план :) Отлично!';
            if (csi_akt>=9.6) text = text + ' Вы перевыполняете план :) Вы великолепны! Так держать!';
        }
        return text;
    },
    findVSP: async function(text,session){
        var mas = {};
        var result = [];
            var query = "SELECT "+ 
                    "ROUND(AVG ([Оценка1]),3) as sr, "+
                    "Format([date_create], 'dd.MM.yyyy') as dat "+
                "FROM [dbo].[VSP] "+
                    "where [date_create]=(select max([date_create]) from [dbo].[VSP]) "+
                    "and [ВСП2]='"+text+"'"+
                    "group by [ВСП2],date_create ";
            console.log(query);
            result = await db.executeQueryData(query);

            if (result.length>0) {
                mas['vsp'] = result[0];
                /*session.send('CSI для ВСП '+text+' на '+result[0].dat+': '+result[0].sr);

                */
            }

            query = "SELECT "+ 
                    "ROUND(AVG ([CRM_NPS_REPLY1]),3) as sr, "+
                    "Format([date_create], 'dd.MM.yyyy') as dat "+
                "FROM [dbo].[Premier] "+
                    "where [date_create]=(select max([date_create]) from [dbo].[Premier]) "+
                    "and [ВСП]='"+text+"'"+
                    "group by [ВСП],date_create ";
            console.log(query);
            result = await db.executeQueryData(query);

            

            if (result.length>0) {
                mas['premier'] = result[0];
            }    
            return mas;

        //return result;
    },
    findFio: async function(text,session){
        var mas = {};
        var key = '';

            var query = "SELECT "+ 
                    "ROUND(AVG ([Оценка_1]),3) as sr, "+
                    "UPPER(REPLACE([ФИО_СМ], '  ', ' ')) as sotr,"+
                    "[ВСП] as vsp, "+
                    "Format([date_create], 'dd.MM.yyyy') as dat "+
                "FROM [dbo].[SM] "+
                    "where [Date_create]=(select max([date_create]) from [dbo].[SM]) "+
                    "and [ФИО_СМ] LIKE N'"+text+"%'"+
                    "group by UPPER(REPLACE([ФИО_СМ], '  ', ' ')),[ВСП],date_create ";
            console.log(query);
            var result = await db.executeQueryData(query);
            console.log('lenght '+result.length);
            if (result.length>0) {
                for (let i in result) {
                    key = this.smallButton('СМ: '+result[i].sotr+', '+result[i].vsp+', CSI - '+result[i].sr,session);
                    mas[key] = {
                        text: result[i].sotr,
                        vsp: result[i].vsp,
                        channel: 'sm',
                        type: 'fio'
                    }
                }
            }  

            query = "SELECT "+ 
                    "ROUND(AVG ([Оценка1]),3) as sr, "+
                    "UPPER(REPLACE([РГВСП], '  ', ' ')) as sotr,"+
                    "[ГОСБ2] as vsp, "+
                    "Format([date_create], 'dd.MM.yyyy') as dat "+
                "FROM [dbo].[VSP] "+
                    "where [date_create]=(select max([date_create]) from [dbo].[VSP]) "+
                    "and [РГВСП] LIKE N'"+text+"%'"+
                    "group by UPPER(REPLACE([РГВСП], '  ', ' ')), [ГОСБ2], date_create ";
            console.log(query);
            result = await db.executeQueryData(query);

            if (result.length>0) {
                for (let i in result) {
                    key = this.smallButton('РГВСП: '+this.initialy(result[i].sotr)+', '+result[i].vsp+', CSI - '+result[i].sr,session);
                    mas[key] = {
                        text: result[i].sotr,
                        vsp: result[i].vsp,
                        channel: 'rgvsp',
                        type: 'fio'
                    }
                }
            }            
            
            query = "SELECT "+ 
                    "ROUND(AVG ([Оценка]),3) as sr, "+
                    "UPPER(REPLACE([Логин_сотрудника], '  ', ' ')) as sotr,"+
                    "[ГОСБ] as vsp, "+
                    "Format([date_create], 'dd.MM.yyyy') as dat "+
                "FROM [dbo].[DSA] "+
                    "where [Date_create]=(select max([date_create]) from [dbo].[DSA]) "+
                    "and [Логин_сотрудника] LIKE N'"+text+"%'"+
                    "group by UPPER(REPLACE([Логин_сотрудника], '  ', ' ')),[ГОСБ],date_create ";
            console.log(query);
            result = await db.executeQueryData(query);
            console.log('lenght '+result.length);
            if (result.length>0) {
                for (let i in result) {
                    key = this.smallButton('DSA: '+this.initialy(result[i].sotr)+', '+result[i].vsp+', CSI - '+result[i].sr,session);
                    mas[key] = {
                        text: result[i].sotr,
                        vsp: result[i].vsp,
                        channel: 'dsa',
                        type: 'fio'
                    }
                }
            }       
            
            query = "SELECT "+ 
                    "ROUND(AVG ([Оценка]),3) as sr, "+
                    "UPPER(REPLACE([РГСПП], '  ', ' ')) as sotr,"+
                    "[ГОСБ] as vsp, "+
                    "Format([date_create], 'dd.MM.yyyy') as dat "+
                "FROM [dbo].[DSA] "+
                    "where [Date_create]=(select max([date_create]) from [dbo].[DSA]) "+
                    "and [РГСПП] LIKE N'"+text+"%'"+
                    "group by UPPER(REPLACE([РГСПП], '  ', ' ')),[ГОСБ],date_create ";
            console.log(query);
            result = await db.executeQueryData(query);
            console.log('lenght '+result.length);
            if (result.length>0) {
                for (let i in result) {
                    key = this.smallButton('РГСПП DSA: '+this.initialy(result[i].sotr)+', '+result[i].vsp+', CSI - '+result[i].sr,session);
                    mas[key] = {
                        text: result[i].sotr,
                        vsp: result[i].vsp,
                        channel: 'rgdsa',
                        type: 'fio'
                    }
                }
            }      
            
            query = "SELECT "+ 
                    "ROUND(AVG ([Оценка1]),3) as sr, "+
                    "UPPER(REPLACE([Сотрудник], '  ', ' ')) as sotr,"+
                    "[ВСП2] as vsp, "+
                    "Format([date_create], 'dd.MM.yyyy') as dat "+
                "FROM [dbo].[VSP] "+
                    "where [date_create]=(select max([date_create]) from [dbo].[VSP]) "+
                    "and [Сотрудник] LIKE N'"+text+"%'"+
                    "group by UPPER(REPLACE([Сотрудник], '  ', ' ')), [ВСП2], date_create ";
            console.log(query);

            result = await db.executeQueryData(query);

            if (result.length>0) {
                for (let i in result) {
                    key = this.smallButton('ВСП: '+this.initialy(result[i].sotr)+', '+result[i].vsp+', CSI - '+result[i].sr,session);
                    mas[key] = {
                        text: result[i].sotr,
                        vsp: result[i].vsp,
                        channel: 'vsp',
                        type: 'fio'
                    }
                }
            }

        return mas;
    },
    moreData: async function(zap,channel){
        var query='';
        var result = [];
        var msg_mas = [];
        var msg = '';
        var din=0;
        if ((zap.type=='vsp')&&((channel=='ВСП')||(channel=='Смотреть'))){

            query = "SELECT "+ 
            "[ВСП2] as gosb, "+
            "Format([date_create], 'dd.MM.yyyy') as dat, "+
            "count([Оценка1]) as kolvo, "+
            "ROUND(AVG ([Оценка1]),3) as sr "+
        "FROM [dbo].[VSP] "+
            "where [date_create] in (select top 3 [date_create] from [dbo].[VSP] group by [date_create] order by [date_create] desc) "+
            "and [ВСП2]='"+zap.text+"' "+
            "group by [ВСП2],[Date_create] "+
            "order by [Date_create]";
            
            result = await db.executeQueryData(query);

            if (result.length>0) {
                msg_mas.push('Динамика ВСП '+zap.text+':');
                msg_mas.push('[Дата | Количество оценок | CSI] ');
                for (let i in result) {
                    msg_mas.push(result[i].dat+' | '+result[i].kolvo+' | '+result[i].sr);
                }
                msg_mas.push(this.dinamicCsi(result));
            }


            query = "SELECT "+ 
            "[Оценка1] as sr, "+
            "[Сотрудник] as fio, "+
            "[Продукт] as product, "+
            "[Комментарий] as comment, "+
            "[Уровень1] as ur1, "+
            "[Уровень2] as ur2, "+
            "[Уровень3] as ur3, "+
            "[Уровень4] as ur4 "+
        "FROM [dbo].[VSP] "+
            "where [Date_create]=(select max([date_create]) from [dbo].[VSP]) "+
            "and [ВСП2]='"+zap.text+"' "+
            "and [Оценка1]<7 "+
            "order by [Оценка1] ";
            console.log(query);
            result = await db.executeQueryData(query);
            msg_mas.push('Оценки меньше 7: ');
            if(result.length==0) msg_mas.push('Поздравляю! Нет оценок меньше 7!');
            for (i in result) {
                msg='Оценка '+result[i].sr+': '+result[i].fio+', '+result[i].product+'';
                if ((result[i].comment!==null)&&(result[i].comment!=='')) msg = msg+', '+result[i].comment;
                if ((result[i].ur1!==null)&&(result[i].ur1!=='')) msg = msg+', '+result[i].ur1;
                if ((result[i].ur2!==null)&&(result[i].ur2!=='')) msg = msg+', '+result[i].ur2;
                /*if ((result[i].ur3!==null)&&(result[i].ur3!='')) msg = msg+', '+result[i].ur3;
                if ((result[i].ur4!==null)&&(result[i].ur4!='')) msg = msg+', '+result[i].ur4;*/
                msg_mas.push(msg);
            }
        }
        if ((zap.type=='vsp')&&((channel=='Премьер')||(channel=='Смотреть'))){

            query = "SELECT "+ 
            "[ВСП] as gosb, "+
            "Format([date_create], 'dd.MM.yyyy') as dat, "+
            "count([CRM_NPS_REPLY1]) as kolvo, "+
            "ROUND(AVG ([CRM_NPS_REPLY1]),3) as sr "+
        "FROM [dbo].[Premier] "+
            "where [date_create] in (select top 3 [date_create] from [dbo].[Premier] group by [date_create] order by [date_create] desc) "+
            "and [ВСП]='"+zap.text+"' "+
            "group by [ВСП],[date_create] "+
            "order by [date_create]";
            
            result = await db.executeQueryData(query);

            if (result.length>0) {
                msg_mas.push('Динамика ВСП '+zap.text+':');
                msg_mas.push('[Дата | Количество оценок | CSI] ');
                for (let i in result) {
                    msg_mas.push(result[i].dat+' | '+result[i].kolvo+' | '+result[i].sr);
                }
                msg_mas.push(this.dinamicCsi(result));
            }


            query = "SELECT "+ 
            "[CRM_NPS_REPLY1] as sr, "+
            "[KM_LOGIN] as fio, "+
            "[Классиф# Уровень 1] as ur1, "+
            "[Классиф# Уровень 2] as ur2, "+
            "[Коммент1] as comment1, "+
            "[Коммент2] as comment2 "+
        "FROM [dbo].[Premier] "+
            "where [Date_create]=(select max([date_create]) from [dbo].[Premier]) "+
            "and [ВСП]='"+zap.text+"' "+
            "and [CRM_NPS_REPLY1]<7 "+
            "order by [CRM_NPS_REPLY1] ";
            console.log(query);
            result = await db.executeQueryData(query);
            msg_mas.push('Оценки меньше 7: ');
            if(result.length==0) msg_mas.push('Поздравляю! Нет оценок меньше 7!');
            for (i in result) {
                msg='Оценка '+result[i].sr+': '+result[i].fio+'';
                if ((result[i].ur1!==null)&&(result[i].ur1!=='')) msg = msg+', '+result[i].ur1;
                if ((result[i].ur2!==null)&&(result[i].ur2!=='')) msg = msg+', '+result[i].ur2;
                if ((result[i].comment1!==null)&&(result[i].comment1!=='')) msg = msg+', '+result[i].comment1;
                //if ((result[i].comment2!==null)&&(result[i].comment2!=='')) msg = msg+', '+result[i].comment2;
                msg_mas.push(msg);
            }
        }      
        
        if ((zap.type=='fio')&&(channel=='vsp')){

            query = "SELECT "+ 
            "Format([date_create], 'dd.MM.yyyy') as dat, "+
            "count([Оценка1]) as kolvo, "+
            "ROUND(AVG ([Оценка1]),3) as sr "+
        "FROM [dbo].[VSP] "+
            "where [date_create] in (select top 3 [date_create] from [dbo].[VSP] group by [date_create] order by [date_create] desc) "+
            "and [ВСП2]='"+zap.vsp+"' "+
            "and [Сотрудник] like N'"+zap.text+"%' "+
            "group by [date_create] "+
            "order by [date_create]";

            console.log(query);

            result = await db.executeQueryData(query);

            if (result.length>0) {
                msg_mas.push('Динамика');
                msg_mas.push('[Дата | Количество оценок | CSI] ');
                for (let i in result) {
                    msg_mas.push(result[i].dat+' | '+result[i].kolvo+' | '+result[i].sr);
                }
                msg_mas.push(this.dinamicCsi(result));
            }

            query = "SELECT "+ 
            "[Оценка1] as sr, "+
            "[Сотрудник] as fio, "+
            "[Продукт] as product, "+
            "[Комментарий] as comment, "+
            "[Уровень1] as ur1, "+
            "[Уровень2] as ur2 "+
        "FROM [dbo].[VSP] "+
            "where [Date_create]=(select max([date_create]) from [dbo].[VSP]) "+
            "and [ВСП2]='"+zap.vsp+"' "+
            "and [Сотрудник]=N'"+zap.text+"' "+
            "and [Оценка1]<7 "+
            "order by [Оценка1] ";
            console.log(query);
            result = await db.executeQueryData(query);
            msg_mas.push('Оценки меньше 7: ');
            if(result.length==0) msg_mas.push('Поздравляю! Нет оценок меньше 7!');
            for (i in result) {
                msg='Оценка '+result[i].sr+': '+result[i].fio+', '+result[i].product+'';
                if ((result[i].ur1!==null)&&(result[i].ur1!=='')) msg = msg+', '+result[i].ur1;
                if ((result[i].ur2!==null)&&(result[i].ur2!=='')) msg = msg+', '+result[i].ur2;
                if ((result[i].comment!==null)&&(result[i].comment!=='')) msg = msg+', '+result[i].comment;
                msg_mas.push(msg);
            }
        }  
        
        if ((zap.type=='fio')&&(channel=='sm')){

            query = "SELECT "+ 
            "Format([date_create], 'dd.MM.yyyy') as dat, "+
            "count([Оценка_1]) as kolvo, "+
            "ROUND(AVG ([Оценка_1]),3) as sr "+
        "FROM [dbo].[SM] "+
            "where [date_create] in (select top 3 [date_create] from [dbo].[SM] group by [date_create] order by [date_create] desc) "+
            "and [ВСП]='"+zap.vsp+"' "+
            "and [ФИО_СМ] like N'"+zap.text+"%' "+
            "group by [date_create] "+
            "order by [date_create]";

            console.log(query);

            result = await db.executeQueryData(query);

            if (result.length>0) {
                msg_mas.push('Динамика');
                msg_mas.push('[Дата | Количество оценок | CSI] ');
                for (let i in result) {
                    msg_mas.push(result[i].dat+' | '+result[i].kolvo+' | '+result[i].sr);
                }
                msg_mas.push(this.dinamicCsi(result));
            }

            query = "SELECT "+ 
            "[Оценка_1] as sr, "+
            "[ФИО_СМ] as fio, "+
            "[Подпродукт] as product, "+
            "[Тематика] as tematika, "+
            "[Классификатор_1] as klass1, "+
            "[Классификатор_2] as klass2, "+
            "[Суть_проблемы/недовольства_клиента] as comment "+
        "FROM [dbo].[SM] "+
            "where [date_create]=(select max([date_create]) from [dbo].[SM]) "+
            "and [ВСП]='"+zap.vsp+"' "+
            "and [ФИО_СМ]=N'"+zap.text+"' "+
            "and [Оценка_1]<7 "+
            "order by [Оценка_1] ";
            console.log(query);
            result = await db.executeQueryData(query);
            msg_mas.push('Оценки меньше 7: ');
            if(result.length==0) msg_mas.push('Поздравляю! Нет оценок меньше 7!');
            for (i in result) {
                msg='Оценка '+result[i].sr+': '+result[i].fio+', '+result[i].product+'';
                if ((result[i].tematika!==null)&&(result[i].tematika!=='')) msg = msg+', '+result[i].tematika;
                if ((result[i].klass1!==null)&&(result[i].klass1!=='')) msg = msg+', '+result[i].klass1;
                if ((result[i].klass2!==null)&&(result[i].klass2!=='')) msg = msg+', '+result[i].klass2;
                if ((result[i].comment!==null)&&(result[i].comment!=='')) msg = msg+', '+result[i].comment;
                msg_mas.push(msg);
            }
        }  

        if ((zap.type=='fio')&&(channel=='rgvsp')){

            query = "SELECT "+ 
            "Format([date_create], 'dd.MM.yyyy') as dat, "+
            "count([Оценка1]) as kolvo, "+
            "ROUND(AVG ([Оценка1]),3) as sr "+
        "FROM [dbo].[VSP] "+
            "where [date_create] in (select top 3 [date_create] from [dbo].[VSP] group by [date_create] order by [date_create] desc) "+
            "and [ГОСБ2]=N'"+zap.vsp+"' "+
            "and [РГВСП] like N'"+zap.text+"%' "+
            "group by [date_create] "+
            "order by [date_create]";

            console.log(query);

            result = await db.executeQueryData(query);

            if (result.length>0) {
                msg_mas.push('Динамика');
                msg_mas.push('[Дата | Количество оценок | CSI] ');
                for (let i in result) {
                    msg_mas.push(result[i].dat+' | '+result[i].kolvo+' | '+result[i].sr);
                }
                msg_mas.push(this.dinamicCsi(result));
            }

            query = "SELECT "+ 
            "[Оценка1] as sr, "+
            "[Сотрудник] as fio, "+
            "[ВСП2] as vsp, "+
            "[Продукт] as product, "+
            "[Комментарий] as comment, "+
            "[Уровень1] as ur1, "+
            "[Уровень2] as ur2 "+
        "FROM [dbo].[VSP] "+
            "where [Date_create]=(select max([date_create]) from [dbo].[VSP]) "+
            "and [ГОСБ2]=N'"+zap.vsp+"' "+
            "and [РГВСП]=N'"+zap.text+"' "+
            "and [Оценка1]<7 "+
            "order by [Оценка1] ";
            console.log(query);
            result = await db.executeQueryData(query);
            msg_mas.push('Оценки меньше 7: ');
            if(result.length==0) msg_mas.push('Поздравляю! Нет оценок меньше 7!');
            for (i in result) {
                msg='Оценка '+result[i].sr+': '+result[i].vsp+', '+result[i].fio+', '+result[i].product+'';
                if ((result[i].ur1!==null)&&(result[i].ur1!=='')) msg = msg+', '+result[i].ur1;
                if ((result[i].ur2!==null)&&(result[i].ur2!=='')) msg = msg+', '+result[i].ur2;
                if ((result[i].comment!==null)&&(result[i].comment!=='')) msg = msg+', '+result[i].comment;
                msg_mas.push(msg);
            }
        } 

        if ((zap.type=='fio')&&(channel=='dsa')){

            query = "SELECT "+ 
            "Format([date_create], 'dd.MM.yyyy') as dat, "+
            "count([Оценка]) as kolvo, "+
            "ROUND(AVG ([Оценка]),3) as sr "+
        "FROM [dbo].[DSA] "+
            "where [date_create] in (select top 3 [date_create] from [dbo].[DSA] group by [date_create] order by [date_create] desc) "+
            "and [ГОСБ]=N'"+zap.vsp+"' "+
            "and [Логин_сотрудника] like N'"+zap.text+"%' "+
            "group by [date_create] "+
            "order by [date_create]";

            console.log(query);

            result = await db.executeQueryData(query);

            if (result.length>0) {
                msg_mas.push('Динамика');
                msg_mas.push('[Дата | Количество оценок | CSI] ');
                for (let i in result) {
                    msg_mas.push(result[i].dat+' | '+result[i].kolvo+' | '+result[i].sr);
                }
                msg_mas.push(this.dinamicCsi(result));
            }

            query = "SELECT "+ 
            "[Оценка] as sr, "+
            "[Логин_сотрудника] as fio, "+
            "[Q2 текст] as comment, "+
            "[Событие] as trig, "+
            "[Уровень 1] as ur1, "+
            "[Уровень 2] as ur2 "+
        "FROM [dbo].[DSA] "+
            "where [date_create]=(select max([date_create]) from [dbo].[DSA]) "+
            "and [ГОСБ]=N'"+zap.vsp+"' "+
            "and [Логин_сотрудника]=N'"+zap.text+"' "+
            "and [Оценка]<7 "+
            "order by [Оценка] ";
            console.log(query);
            result = await db.executeQueryData(query);
            msg_mas.push('Оценки меньше 7: ');
            if(result.length==0) msg_mas.push('Поздравляю! Нет оценок меньше 7!');
            for (i in result) {
                msg='Оценка '+result[i].sr+': '+result[i].fio+', '+result[i].trig+'';
                if ((result[i].ur1!==null)&&(result[i].ur1!=='')) msg = msg+', '+result[i].ur1;
                if ((result[i].ur2!==null)&&(result[i].ur2!=='')) msg = msg+', '+result[i].ur2;
                if ((result[i].comment!==null)&&(result[i].comment!=='')) msg = msg+', '+result[i].comment;
                msg_mas.push(msg);
            }
        }       
        
        if ((zap.type=='fio')&&(channel=='rgdsa')){

            query = "SELECT "+ 
            "Format([date_create], 'dd.MM.yyyy') as dat, "+
            "count([Оценка]) as kolvo, "+
            "ROUND(AVG ([Оценка]),3) as sr "+
        "FROM [dbo].[DSA] "+
            "where [date_create] in (select top 3 [date_create] from [dbo].[DSA] group by [date_create] order by [date_create] desc) "+
            "and [ГОСБ]=N'"+zap.vsp+"' "+
            "and [РГСПП] like N'"+zap.text+"%' "+
            "group by [date_create] "+
            "order by [date_create]";

            console.log(query);

            result = await db.executeQueryData(query);

            if (result.length>0) {
                msg_mas.push('Динамика');
                msg_mas.push('[Дата | Количество оценок | CSI] ');
                for (let i in result) {
                    msg_mas.push(result[i].dat+' | '+result[i].kolvo+' | '+result[i].sr);
                }
                msg_mas.push(this.dinamicCsi(result));
            }

            query = "SELECT "+ 
            "[Оценка] as sr, "+
            "[Логин_сотрудника] as fio, "+
            "[Q2 текст] as comment, "+
            "[Событие] as trig, "+
            "[Уровень 1] as ur1, "+
            "[Уровень 2] as ur2 "+
        "FROM [dbo].[DSA] "+
            "where [date_create]=(select max([date_create]) from [dbo].[DSA]) "+
            "and [ГОСБ]=N'"+zap.vsp+"' "+
            "and [РГСПП]=N'"+zap.text+"' "+
            "and [Оценка]<7 "+
            "order by [Оценка] ";
            console.log(query);
            result = await db.executeQueryData(query);
            msg_mas.push('Оценки меньше 7: ');
            if(result.length==0) msg_mas.push('Поздравляю! Нет оценок меньше 7!');
            for (i in result) {
                msg='Оценка '+result[i].sr+': '+result[i].fio+', '+result[i].trig+'';
                if ((result[i].ur1!==null)&&(result[i].ur1!=='')) msg = msg+', '+result[i].ur1;
                if ((result[i].ur2!==null)&&(result[i].ur2!=='')) msg = msg+', '+result[i].ur2;
                if ((result[i].comment!==null)&&(result[i].comment!=='')) msg = msg+', '+result[i].comment;
                msg_mas.push(msg);
            }
        }

        return msg_mas;
    }
}