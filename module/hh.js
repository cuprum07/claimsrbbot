webshot('<html><body>Hello, World!</body></html>', optionsImg, function (err, renderStream) {
    console.log('start renderStream'); //printed  
    console.log(err); //null
    var bufArr = [];
    renderStream.on('data', function(data) {
        console.log('data render'); //Not printed in console Azure
        bufArr.push(data);
    });

    renderStream.on('end', function() {
        console.log('render end'); //Not printed in console Azure
        var buf = Buffer.concat(bufArr);
        var base64 = Buffer.from(buf).toString('base64');
        var contentType = 'image/png';
        var msg = new builder.Message(session)
            .addAttachment({
                contentUrl: util.format('data:%s;base64,%s', contentType, base64),
                contentType: contentType
            });  
        console.log(msg);             
        session.send(msg);
        session.endDialog();          
    });	
}); 