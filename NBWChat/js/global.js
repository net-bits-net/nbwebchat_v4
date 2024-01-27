var flashconfig = {
    id: 'nbwchat', src: 'nbflashconnectionv4.swf?update=20,35', version: [9, 115], width: '105', height: '16', allowScriptAccess: 'always', wmode: 'transparent',
    onFail: function () {
        WriteNBFlashsocketComponentCode();
    }
};


var protocolc = window.location.protocol;
console.log('Protocol = ' + protocolc);
if (protocolc == 'https:') { 
	var gsServerConnections = [
		"r-wx-01.ircwx.com:7843", // 149.56.38.226:7778 149.56.38.226:7843
	];
}	
else {
	var gsServerConnections = [
		"149.56.38.226:7778", // 149.56.38.226:7778 149.56.38.226:7843
	];
}	
console.log('Using ' + gsServerConnections + ' to connect');