var builder = require('botbuilder');
var db = require('./db');
var fs = require('fs');
var util = require('util');


module.exports = {
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
        var query="select * from claim_users where channel='"+address.channelId+"' and user_id=N'"+address.user.id+"'";
        var result = await db.executeQueryData(query);
        return result;
    },
    update_user: async function (address) {
        var result = await this.user_info(address);
        var query = '';
        if (result.length) {
            var query = "update claim_users set dat=GETDATE() where id='"+result[0].id+"'";
        }
        else {
            var query = "insert into claim_users (channel, user_id,addr, dat) VALUES ('"+address.channelId+"', '"+address.user.id+"',N'"+JSON.stringify(address)+"',GETDATE())";
        }
        db.executeQueryData(query);
    },
    user_addres: async function(){
        var query = "select addr from claim_users";
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
    findVSP: async function(text){
        var mas = {};
        var result = [];
            var query = "SELECT "+ 
                    "[Во#Номер] as num, "+
                    "[Тематика] as sbj, "+
                    "[Подтематика] as s_sbj, "+
                    "[Описание] as opis "+
                "FROM [dbo].[claim] "+
                    "where "+
                    "[ATR]='"+text+"'";
            console.log(query);
            result = await db.executeQueryData(query);
            console.log(result);
            return result;

        //return result;
    }
}