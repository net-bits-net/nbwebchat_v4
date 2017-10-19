/*
 * Copyright (C) 2006-2017  Net-Bits.Net
 * All rights reserved.
 *
 * Contact: nucleusae@gmail.com
 *
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 */
var flashObj; //design: should be declared here only, so no calls outside of this module.
var NBSocketGlobalInstance = null;
function NBFlashConnectionEvent(event_type, data) {
    //Note: debug code.
    //if (IsEmptyString(data)) {
    //    console.log(event_type + "::(NBFlashConnectionEvent)::");
    //} else {
    //    console.log(event_type + "::(NBFlashConnectionEvent)::" + data);
    //}
    function parseOnConnectMessage(s) {
        //SUCCESS 167.114.203.99:7778
        var sa = s.split(" ", 2);
        if (sa.length > 1) {
            if (sa[0] === "SUCCESS") {
                return { success: true, address: sa[1] };
            }
            else {
                return { success: false, address: sa[1] };
            }
        }
        return { success: false, address: null };
    }
    switch (event_type) {
        case "ONREADY":
            flashObj = $("#nbwchat")[0];
            if (NBSocketGlobalInstance !== null) {
                //Comment: Raising socket event. Needs better approach?
                if (NBSocketGlobalInstance.SocketType() !== "Flashsocket" /* FlashSocket */) {
                    flashObj.stopLoadNotification();
                    return;
                }
                NBSocketGlobalInstance.OnReady();
            }
            break;
        case "ONCONNECT":
            if (NBSocketGlobalInstance !== null) {
                NBSocketGlobalInstance.OnConnect(parseOnConnectMessage(data));
            }
            break;
        case "ONDATA":
            if (NBSocketGlobalInstance !== null) {
                NBSocketGlobalInstance.OnData(data);
            }
            break;
        case "ONERROR":
            if (NBSocketGlobalInstance !== null) {
                NBSocketGlobalInstance.OnError(data);
            }
            break;
        case "ONCLOSE":
            if (NBSocketGlobalInstance !== null) {
                NBSocketGlobalInstance.OnClose(data);
            }
            break;
        case "ONDEBUGDATA":
            if (NBSocketGlobalInstance !== null) {
                NBSocketGlobalInstance.OnDebugData(data);
            }
            break;
    }
}
var NBChatConnection;
(function (NBChatConnection) {
    "use strict";
    NBChatConnection.OnClose = null;
    NBChatConnection.OnConnect = null;
    NBChatConnection.OnData = null;
    NBChatConnection.OnDebugData = null;
    NBChatConnection.OnError = null;
    NBChatConnection.OnReady = null;
    NBChatConnection.CanConnect = null;
    NBChatConnection.Close = null;
    NBChatConnection.Connect = null;
    NBChatConnection.Send = null;
    NBChatConnection.SocketType = null;
    NBChatConnection.IsReady = function () { return false; };
    var send_time_limit_ms = 1000;
    var sendq_ticker_interval_ms = 250;
    var send_count_max_limit = 9;
    var last_sent_time = new Date();
    var execute_sendq_call_iteration_count = 0;
    var send_count = 0;
    var send_q = new Array();
    var sendDirect = null;
    var ircsendq_ticker = new NBChatCore.NBTicker("IrcSendQueueTicker");
    //ToDo: is it better to move all initialization in single initialization function?
    //initializing send queue variables.
    // <init>
    NBChatConnection.Send = function (s) {
        send_q.push(s);
        executeSendQ();
    };
    last_sent_time.setMinutes(last_sent_time.getMinutes() - 10);
    ircsendq_ticker.StopConditionFn = executeSendQ;
    ircsendq_ticker.SetTickerInterval(sendq_ticker_interval_ms);
    // </init>
    function dataBufferAndCurrentMessageProcessing(s, b) {
        //Note: xml socket doesn't send \0 or \r\n
        //ToDo: implement bad case protection.
        //this is not possible in our server since buffer getting too large is protected on the server side,
        //but in general case, an attacker can construct an attack that will not have end of message character(s) and buffer will keep growning until webclient runs out of memory.
        if (!(s[s.length - 1] === "\n" && s[s.length - 2] === "\r")) {
            var pos = s.lastIndexOf("\r\n");
            if (pos === -1) {
                //copy whole
                b += s;
            }
            else {
                if (s[pos + 2] === "\0") {
                    pos += 2;
                }
                else {
                    pos++;
                }
                if (b.length > 0) {
                    var str_temp = b + s.substring(0, pos);
                    b = s.substr(pos + 1);
                    s = str_temp;
                }
                else {
                    b = s.substr(pos + 1);
                    s = s.substring(0, pos);
                }
            }
        }
        else {
            if (b.length > 0) {
                s = b + s;
                b = "";
            }
        }
        return { s: s, b: b };
    }
    function executeSendQ() {
        var current_time = new Date();
        var diff_ms = current_time.getTime() - last_sent_time.getTime();
        if (diff_ms > send_time_limit_ms) {
            send_count = 0;
        }
        if (diff_ms > send_time_limit_ms || send_count <= send_count_max_limit) {
            while (send_q.length > 0 && send_count <= send_count_max_limit) {
                send_count++;
                last_sent_time = new Date();
                var s = send_q.shift();
                if (sendDirect != null) {
                    sendDirect(s);
                }
            }
        }
        if (execute_sendq_call_iteration_count > 0) {
            if (send_q.length === 0) {
                execute_sendq_call_iteration_count++;
                //let the calls spin twice so it doesn't miss any messages.
                if (execute_sendq_call_iteration_count >= 2) {
                    execute_sendq_call_iteration_count = 0;
                    return NBChatCore.NBTickerFlags.Stop;
                }
            }
        }
        else {
            execute_sendq_call_iteration_count++;
            ircsendq_ticker.Start();
        }
        return NBChatCore.NBTickerFlags.Continue;
    }
    //<NBFlashSock>
    //ToDo: move to its own file.
    var NBFlashsocket = /** @class */ (function () {
        //and there is no when to differtiate null and empty string when required, hence, this method is used.
        function NBFlashsocket() {
            //variables
            this.socket_subtype_ = "Flashsocket" /* FlashSocket */;
            this.is_ready_ = false;
            this.str_buffer_ = "";
            this.connecting_ = false;
            this.XmlNullChar = "$1a2XMLNULL2a1$"; //this is only related to flash sending messages, it has a problem sending null. Null converts to empty string,
            NBSocketGlobalInstance = this;
            NBChatConnection.CanConnect = this.CanConnect.bind(this);
            NBChatConnection.Close = this.Close.bind(this);
            NBChatConnection.Connect = this.Connect.bind(this);
            sendDirect = this.Send.bind(this); //should be direct here due to queue excution logic on NBChatconnection.Send call.
            NBChatConnection.SocketType = this.SocketType.bind(this);
            NBChatConnection.IsReady = this.IsReady.bind(this); //this one is in last on purpose.
            //binding is not needed for subtype check on global instance.
        }
        //events
        NBFlashsocket.prototype.OnClose = function (message) {
            this.connecting_ = false;
            if (message === this.XmlNullChar) {
                message = null;
            }
            if (NBChatConnection.OnClose !== null) {
                NBChatConnection.OnClose(message);
            }
        };
        NBFlashsocket.prototype.OnConnect = function (connection_result) {
            this.connecting_ = false;
            if (NBChatConnection.OnConnect !== null) {
                NBChatConnection.OnConnect(connection_result);
            }
        };
        NBFlashsocket.prototype.OnData = function (s) {
            //let controller set 'NBChatConnection.OnData', here just check if it is not null.
            if (s === this.XmlNullChar) {
                s = null;
            }
            if (NBChatConnection.OnData !== null) {
                if (!IsEmptyString(s)) {
                    var result = dataBufferAndCurrentMessageProcessing(s, this.str_buffer_);
                    this.str_buffer_ = result.b;
                    s = result.s;
                    var sa = s.split("\r\n");
                    for (var i = 0; i < sa.length; i++) {
                        if (!IsEmptyString(sa[i])) {
                            NBChatConnection.OnData(sa[i]);
                        }
                    }
                }
            }
        };
        NBFlashsocket.prototype.OnDebugData = function (debug_data) {
            if (debug_data === this.XmlNullChar) {
                debug_data = null;
            }
            if (NBChatConnection.OnDebugData !== null) {
                NBChatConnection.OnDebugData(debug_data);
            }
        };
        NBFlashsocket.prototype.OnError = function (error_message) {
            if (error_message === this.XmlNullChar) {
                error_message = null;
            }
            if (NBChatConnection.OnError !== null) {
                NBChatConnection.OnError(error_message);
            }
        };
        NBFlashsocket.prototype.OnReady = function () {
            this.is_ready_ = true;
            //design: 'flashObj' should be declared in this module only, so no calls to it from outside of this module.
            flashObj.stopLoadNotification();
            if (NBChatConnection.OnReady !== null) {
                NBChatConnection.OnReady();
            }
        };
        //functions
        NBFlashsocket.prototype.CanConnect = function () {
            return !(this.connecting_ || flashObj.sckIsConnected());
        };
        NBFlashsocket.prototype.Close = function (reason) {
            if (reason === null) {
                reason = this.XmlNullChar;
            }
            flashObj.sckDisconnect();
        };
        NBFlashsocket.prototype.Connect = function (ip, port) {
            flashObj.sckConnect(ip, port);
        };
        NBFlashsocket.prototype.IsReady = function () {
            return this.is_ready_;
        };
        NBFlashsocket.prototype.Send = function (s) {
            if (s === null) {
                s = this.XmlNullChar;
            }
            //debug code
            console.log(">>" + s);
            flashObj.sockSend(s + "\r\n");
        };
        NBFlashsocket.prototype.SocketType = function () {
            return this.socket_subtype_;
        };
        return NBFlashsocket;
    }());
    //</NBFlashSock>
    //<NBWebsock>
    //ToDo: move to its own file.
    var NBWebsocket = /** @class */ (function () {
        function NBWebsocket() {
            this.socket_subtype_ = "Websocket" /* Websocket */;
            this.is_ready_ = false;
            this.str_buffer_ = "";
            this.wsocket_ = null;
            this.connecting_ = false;
            NBSocketGlobalInstance = this;
            NBChatConnection.CanConnect = this.CanConnect.bind(this);
            NBChatConnection.Close = this.Close.bind(this);
            NBChatConnection.Connect = this.Connect.bind(this);
            sendDirect = this.Send.bind(this); //should be direct here due to queue excution logic on NBChatconnection.Send call.
            NBChatConnection.SocketType = this.SocketType.bind(this);
            NBChatConnection.IsReady = this.IsReady.bind(this); //this one is in last on purpose.
            this.OnReady();
        }
        //events
        NBWebsocket.prototype.OnClose = function (message) {
            var is_connecting = this.connecting_; //OnClose can throw exception so save it in temp variable.
            this.connecting_ = false;
            if (is_connecting) {
                this.OnConnect({ success: false, address: this.ip_ + ":" + this.port_ });
            }
            else {
                if (NBChatConnection.OnClose !== null) {
                    NBChatConnection.OnClose(message);
                }
            }
        };
        NBWebsocket.prototype.OnConnect = function (connection_result) {
            this.connecting_ = false;
            if (NBChatConnection.OnConnect !== null) {
                NBChatConnection.OnConnect(connection_result);
            }
        };
        NBWebsocket.prototype.OnData = function (s) {
            //let controller set 'NBChatConnection.OnData', here just check if it is not null.
            if (NBChatConnection.OnData !== null) {
                if (!IsEmptyString(s)) {
                    var result = dataBufferAndCurrentMessageProcessing(s, this.str_buffer_);
                    this.str_buffer_ = result.b;
                    s = result.s;
                    var sa = s.split("\r\n");
                    for (var i = 0; i < sa.length; i++) {
                        if (!IsEmptyString(sa[i])) {
                            NBChatConnection.OnData(sa[i]);
                        }
                    }
                }
            }
        };
        NBWebsocket.prototype.OnDebugData = function (debug_data) {
            if (NBChatConnection.OnDebugData !== null) {
                NBChatConnection.OnDebugData(debug_data);
            }
        };
        NBWebsocket.prototype.OnError = function (error_message) {
            if (NBChatConnection.OnError !== null) {
                NBChatConnection.OnError(error_message);
            }
        };
        NBWebsocket.prototype.OnReady = function () {
            this.is_ready_ = true;
            if (NBChatConnection.OnReady !== null) {
                NBChatConnection.OnReady();
            }
        };
        //functions
        NBWebsocket.prototype.CanConnect = function () {
            if (!this.is_ready_ || this.connecting_)
                return false;
            if (!IsUndefinedOrNull(this.wsocket_)) {
                return !(this.connecting_ || this.wsocket_.readyState == this.wsocket_.CONNECTING || this.wsocket_.readyState == this.wsocket_.OPEN || this.wsocket_.readyState == this.wsocket_.CONNECTING);
            }
            return true;
        };
        NBWebsocket.prototype.Close = function (reason) {
            //ToDo: test sending reason with close.
            this.wsocket_.close();
        };
        NBWebsocket.prototype.Connect = function (ip, port) {
            if (!this.CanConnect()) {
                throw new Error("Socket is connecting or connected. Should use 'NBChatConnection.CanConnect() before trying to connect.");
            }
            this.ip_ = ip;
            this.port_ = port;
            this.wsocket_ = new WebSocket("ws://" + this.ip_ + ":" + this.port_ + "/");
            this.connecting_ = true;
            this.wsocket_.onopen = function (ev) {
                //this.ip_ doesn't exist here.
                //ToDo: see best approach for accessing parent properties here?
                if (NBSocketGlobalInstance !== null) {
                    NBSocketGlobalInstance.OnConnect({ success: true, address: ip + ":" + port });
                }
            };
            this.wsocket_.onmessage = function (ev) {
                if (NBSocketGlobalInstance !== null) {
                    NBSocketGlobalInstance.OnData(ev.data);
                }
            };
            this.wsocket_.onerror = function (ev) {
                //note: onerror event of websocket doesn't contain any data message.
            };
            this.wsocket_.onclose = function (ev) {
                if (NBSocketGlobalInstance !== null) {
                    NBSocketGlobalInstance.OnClose(null);
                }
            };
        };
        NBWebsocket.prototype.IsReady = function () {
            return this.is_ready_;
        };
        NBWebsocket.prototype.Send = function (s) {
            //debug code.
            console.log(">>" + s);
            this.wsocket_.send(s + "\r\n");
        };
        NBWebsocket.prototype.SocketType = function () {
            return this.socket_subtype_;
        };
        return NBWebsocket;
    }());
    //</NBWebsock>
    var SockMain = (HasWebsocketSupport) ? new NBWebsocket() : new NBFlashsocket();
})(NBChatConnection || (NBChatConnection = {}));
//# sourceMappingURL=nbchat_connection.js.map