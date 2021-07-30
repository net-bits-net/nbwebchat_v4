var flashconfig = {
    id: 'nbwchat', src: 'nbflashconnectionv4.swf?update=20,35', version: [9, 115], width: '105', height: '16', allowScriptAccess: 'always', wmode: 'transparent',
    onFail: function () {
        WriteNBFlashsocketComponentCode();
    }
};

var gsServerConnections = [
    "149.56.38.226:7778",
];
