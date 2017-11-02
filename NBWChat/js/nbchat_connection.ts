/*
 * Copyright (C) 2006-2017  Net-Bits.Net
 * All rights reserved.
 *
 * Contact: nucleusae@gmail.com
 *
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 */

let flashObj: any; //design: should be declared here only, so no calls outside of this module.
let NBSocketGlobalInstance: NBChatConnection.INBClientSocket = null;
declare let HasWebsocketSupport: boolean;

function NBFlashConnectionEvent(event_type: string, data: string): void {

    //Note: debug code.
    //if (IsEmptyString(data)) {
    //    console.log(event_type + "::(NBFlashConnectionEvent)::");
    //} else {
    //    console.log(event_type + "::(NBFlashConnectionEvent)::" + data);
    //}

    function parseOnConnectMessage(s: string): { success: boolean, address: string } {
        //SUCCESS 167.114.203.99:7778

        const sa: string[] = s.split(" ", 2);

        if (sa.length > 1) {
            if (sa[0] === "SUCCESS") {
                return { success: true, address: sa[1] };
            } else {
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

                if (NBSocketGlobalInstance.SocketType() !== NBChatConnection.NBSocketType.FlashSocket) {
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

namespace NBChatConnection {
    "use strict";

    export const enum NBSocketType  {
        NotSet = 0, //not really needed but just in case can be default value.
        FlashSocket = "Flashsocket",
        Websocket   = "Websocket",
    }

    export type fnWriteToConnectionDef = (s: string) => void;

    export interface INBClientSocket {
        //ToDo: move to its own file.

        OnClose(message: string): void;
        OnConnect({ success: boolean, address: string }): void;
        OnData(s: string): void;
        OnDebugData(debug_data: string): void;
        OnError(error_message: string): void;
        OnReady(): void;

        CanConnect(): boolean;
        Close(reason: string): void;
        Connect(ip: string, port: number): void;
        Send(s: string): void;
        IsReady(): boolean;
        SocketType(): NBSocketType;
    }

    export let OnClose: (message: string) => void = null;
    export let OnConnect: ({ success: boolean, address: string }) => void = null;
    export let OnData: (s: string) => void = null;
    export let OnDebugData: (debug_data: string) => void = null;
    export let OnError: (error_message: string) => void = null;
    export let OnReady: () => void = null;

    export let CanConnect: () => boolean = null;
    export let Close: (reason: string) => void = null;
    export let Connect: (ip: string, port: number) => void = null;
    export let Send: fnWriteToConnectionDef = null;
    export let SocketType: () => string = null;
    export let IsReady: () => boolean = (): boolean => false;

    const send_time_limit_ms: number = 1000;
    const sendq_ticker_interval_ms: number = 250;
    const send_count_max_limit: number = 9;
    let last_sent_time: Date = new Date();
    let execute_sendq_call_iteration_count: number = 0;
    let send_count: number = 0;
    let send_q: string[] = new Array<string>();
    let sendDirect: fnWriteToConnectionDef = null;
    let ircsendq_ticker: NBChatCore.NBTicker = new NBChatCore.NBTicker("IrcSendQueueTicker");

    //ToDo: is it better to move all initialization in single initialization function?
    //initializing send queue variables.
    // <init>
    Send = (s: string): void => {
        send_q.push(s);
        executeSendQ();
    };

    last_sent_time.setMinutes(last_sent_time.getMinutes() - 10);
    ircsendq_ticker.StopConditionFn = executeSendQ;
    ircsendq_ticker.SetTickerInterval(sendq_ticker_interval_ms);
    // </init>

    function dataBufferAndCurrentMessageProcessing(s: string, b: string): { s: string, b: string } {
        //Note: xml socket doesn't send \0 or \r\n

        //ToDo: implement bad case protection.
        //this is not possible in our server since buffer getting too large is protected on the server side,
        //but in general case, an attacker can construct an attack that will not have end of message character(s) and buffer will keep growning until webclient runs out of memory.

        if (!(s[s.length - 1] === "\n" && s[s.length - 2] === "\r")) {
            let pos: number = s.lastIndexOf("\r\n");

            if (pos === -1) {
                //copy whole
                b += s;
            } else {
                if (s[pos + 2] === "\0") {
                    pos += 2;
                } else {
                    pos++;
                }

                if (b.length > 0) {
                    let str_temp: string = b + s.substring(0, pos);
                    b = s.substr(pos + 1);
                    s = str_temp;
                } else {
                    b = s.substr(pos + 1);
                    s = s.substring(0, pos);
                }
            }
        } else {
            if (b.length > 0) {
                s = b + s;
                b = "";
            }
        }

        return { s: s, b: b };
    }

    function executeSendQ(): NBChatCore.NBTickerFlags {
        const current_time: Date = new Date();
        const diff_ms: number = current_time.getTime() - last_sent_time.getTime();

        if (diff_ms > send_time_limit_ms) {
            send_count = 0;
        }

        if (diff_ms > send_time_limit_ms || send_count <= send_count_max_limit) {
            while (send_q.length > 0 && send_count <= send_count_max_limit) {
                send_count++;
                last_sent_time = new Date();
                const s: string = send_q.shift();
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
        } else {
            execute_sendq_call_iteration_count++;
            ircsendq_ticker.Start();
        }

        return NBChatCore.NBTickerFlags.Continue;
    }

    //<NBFlashSock>
    //ToDo: move to its own file.
    class NBFlashsocket implements INBClientSocket {

        //variables
        private socket_subtype_: NBSocketType = NBSocketType.FlashSocket;
        private is_ready_: boolean = false;
        private str_buffer_: string = "";
        private connecting_: boolean = false;
        private readonly XmlNullChar: string = "$1a2XMLNULL2a1$"; //this is only related to flash sending messages, it has a problem sending null. Null converts to empty string,
                                                                    //and there is no when to differtiate null and empty string when required, hence, this method is used.

        constructor() {
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
        public OnClose(message: string): void {
            this.connecting_ = false;

            if (message === this.XmlNullChar) {
                message = null;
            }

            if (NBChatConnection.OnClose !== null) {
                NBChatConnection.OnClose(message);
            }
        }

        public OnConnect(connection_result: { success: boolean, address: string }): void {

            this.connecting_ = false;

            if (NBChatConnection.OnConnect !== null) {
                NBChatConnection.OnConnect(connection_result);
            }
        }

        public OnData(s: string): void {
            //let controller set 'NBChatConnection.OnData', here just check if it is not null.

            if (s === this.XmlNullChar) {
                s = null;
            }

            if (NBChatConnection.OnData !== null) {

                if (!IsEmptyString(s)) {
                    const result = dataBufferAndCurrentMessageProcessing(s, this.str_buffer_);
                    this.str_buffer_ = result.b;
                    s = result.s;

                    const sa: string[] = s.split("\r\n");

                    for (let i: number = 0; i < sa.length; i++) {
                        if (!IsEmptyString(sa[i])) {
                            NBChatConnection.OnData(sa[i]);
                        }
                    }
                }
            }
        }

        public OnDebugData(debug_data: string): void {

            if (debug_data === this.XmlNullChar) {
                debug_data = null;
            }

            if (NBChatConnection.OnDebugData !== null) {
                NBChatConnection.OnDebugData(debug_data);
            }
        }

        public OnError(error_message: string): void {

            if (error_message === this.XmlNullChar) {
                error_message = null;
            }

            if (NBChatConnection.OnError !== null) {
                NBChatConnection.OnError(error_message);
            }
        }

        public OnReady(): void {
            this.is_ready_ = true;
            //design: 'flashObj' should be declared in this module only, so no calls to it from outside of this module.
            flashObj.stopLoadNotification();

            if (NBChatConnection.OnReady !== null) {
                NBChatConnection.OnReady();
            }
        }

        //functions

        public CanConnect(): boolean {
            return !(this.connecting_ || flashObj.sckIsConnected());
        }

        public Close(reason: string): void {

            if (reason === null) {
                reason = this.XmlNullChar;
            }

            flashObj.sckDisconnect();
        }

        public Connect(ip: string, port: number): void {
            flashObj.sckConnect(ip, port);
        }

        public IsReady(): boolean {
            return this.is_ready_;
        }

        public Send(s: string): void {

            if (s === null) {
                s = this.XmlNullChar;
            }

            //debug code
            if (gsLogRawsToBrowserConsole === true) console.log(">>" + s);
            flashObj.sockSend(s + "\r\n");
        }

        public SocketType(): NBSocketType {
            return this.socket_subtype_;
        }
    }
    //</NBFlashSock>

    //<NBWebsock>
    //ToDo: move to its own file.
    class NBWebsocket implements INBClientSocket {

        private socket_subtype_: NBSocketType = NBSocketType.Websocket;
        private is_ready_: boolean = false;
        private str_buffer_: string = "";
        private wsocket_: WebSocket = null;
        private connecting_: boolean = false;
        private ip_: string;
        private port_: number;

        constructor() {
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
        public OnClose(message: string): void {

            let is_connecting: boolean = this.connecting_; //OnClose can throw exception so save it in temp variable.

            this.connecting_ = false;

            if (is_connecting) {
                this.OnConnect({ success: false, address: this.ip_ + ":" + this.port_ });
            } else {
                if (NBChatConnection.OnClose !== null) {
                    NBChatConnection.OnClose(message);
                }
            }
        }

        public OnConnect(connection_result: { success: boolean, address: string }): void {
            this.connecting_ = false;

            if (NBChatConnection.OnConnect !== null) {
                NBChatConnection.OnConnect(connection_result);
            }
        }

        public OnData(s: string): void {
            //let controller set 'NBChatConnection.OnData', here just check if it is not null.

            if (NBChatConnection.OnData !== null) {

                if (!IsEmptyString(s)) {

                    const result = dataBufferAndCurrentMessageProcessing(s, this.str_buffer_);
                    this.str_buffer_ = result.b;
                    s = result.s;

                    const sa: string[] = s.split("\r\n");

                    for (let i: number = 0; i < sa.length; i++) {
                        if (!IsEmptyString(sa[i])) {
                            NBChatConnection.OnData(sa[i]);
                        }
                    }
                }
            }
        }

        public OnDebugData(debug_data: string): void {
            if (NBChatConnection.OnDebugData !== null) {
                NBChatConnection.OnDebugData(debug_data);
            }
        }

        public OnError(error_message: string): void {
            if (NBChatConnection.OnError !== null) {
                NBChatConnection.OnError(error_message);
            }
        }

        public OnReady(): void {
            this.is_ready_ = true;

            if (NBChatConnection.OnReady !== null) {
                NBChatConnection.OnReady();
            }
        }

        //functions

        public CanConnect(): boolean {
            if (!this.is_ready_ || this.connecting_) return false;

            if (!IsUndefinedOrNull(this.wsocket_)) {
                return !(this.connecting_ || this.wsocket_.readyState == this.wsocket_.CONNECTING || this.wsocket_.readyState == this.wsocket_.OPEN || this.wsocket_.readyState == this.wsocket_.CONNECTING);
            }

            return true;
        }

        public Close(reason: string): void {
            //ToDo: test sending reason with close.

            this.wsocket_.close();
        }

        public Connect(ip: string, port: number): void {
            if (!this.CanConnect()) {
                throw new Error("Socket is connecting or connected. Should use 'NBChatConnection.CanConnect() before trying to connect.");
            }

            this.ip_ = ip;
            this.port_ = port;

            this.wsocket_ = new WebSocket("ws://" + this.ip_ + ":" + this.port_ + "/");

            this.connecting_ = true;

            this.wsocket_.onopen = function(this: WebSocket, ev: Event): any {
                //this.ip_ doesn't exist here.
                //ToDo: see best approach for accessing parent properties here?

                if (NBSocketGlobalInstance !== null) {
                    NBSocketGlobalInstance.OnConnect({ success: true, address: ip + ":" + port });
                }
            };

            this.wsocket_.onmessage = function(this: WebSocket, ev: MessageEvent): any {
                if (NBSocketGlobalInstance !== null) {
                    NBSocketGlobalInstance.OnData(ev.data);
                }
            };

            this.wsocket_.onerror = function(this: WebSocket, ev: Event): any {
                //note: onerror event of websocket doesn't contain any data message.
            };

            this.wsocket_.onclose = function(this: WebSocket, ev: CloseEvent): any {
                if (NBSocketGlobalInstance !== null) {
                    NBSocketGlobalInstance.OnClose(null);
                }
            };
        }

        public IsReady(): boolean {
            return this.is_ready_;
        }

        public Send(s: string): void {
            //debug code.
            if (gsLogRawsToBrowserConsole === true) console.log(">>" + s);
            this.wsocket_.send(s + "\r\n");
        }

        public SocketType(): NBSocketType {
            return this.socket_subtype_;
        }
    }

    //</NBWebsock>

    const SockMain: INBClientSocket = (HasWebsocketSupport) ? new NBWebsocket() : new NBFlashsocket();
}