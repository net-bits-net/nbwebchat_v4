
/*
 * Copyright (C) 2006-2017  Net-Bits.Net
 * All rights reserved.
 *
 * Contact: nucleusae@gmail.com
 *
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 */

declare let flashObj; //design: should be declared here only, so no calls outside of this module.
let NBFlashSocketGlobalInstance: NBChatConnection.INBSocket = null;

function NBFlashConnectionEvent(event_type: string, data: string): void {

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
            if (NBFlashSocketGlobalInstance !== null) {
                //Comment: Raising socket event. Needs better approach?
                NBFlashSocketGlobalInstance.OnReady();
            }
            break;

        case "ONCONNECT":
            if (NBFlashSocketGlobalInstance !== null) {
                NBFlashSocketGlobalInstance.OnConnect(parseOnConnectMessage(data));
            }
            break;

        case "ONDATA":
            if (NBFlashSocketGlobalInstance !== null) {
                NBFlashSocketGlobalInstance.OnData(data);
            }
            break;

        case "ONERROR":
            if (NBFlashSocketGlobalInstance !== null) {
                NBFlashSocketGlobalInstance.OnError(data);
            }
            break;

        case "ONCLOSE":
            if (NBFlashSocketGlobalInstance !== null) {
                NBFlashSocketGlobalInstance.OnClose(data);
            }
            break;

        case "ONDEBUGDATA":
            if (NBFlashSocketGlobalInstance !== null) {
                NBFlashSocketGlobalInstance.OnDebugData(data);
            }
            break;
    }

}

namespace NBChatConnection {
    "use strict";

    export type fnWriteToConnectionDef = (s: string) => void;

    export interface INBSocket {
        OnClose(message: string): void;
        OnConnect({ success: boolean, address: string }): void;
        OnData(s: string): void;
        OnDebugData(debug_data: string): void;
        OnError(error_message: string): void;
        OnReady(): void;

        Close(reason: string): void;
        Connect(ip: string, port: number): void;
        IRCSend(s: string): void;
        IsReady(): boolean;
    }

    export let OnClose: (message: string) => void = null;
    export let OnConnect: ({ success: boolean, address: string }) => void = null;
    export let OnData: (s: string) => void = null;
    export let OnDebugData: (debug_data: string) => void = null;
    export let OnError: (error_message: string) => void = null;
    export let OnReady: () => void = null;

    export let Close: (reason: string) => void = null;
    export let Connect: (ip: string, port: number) => void = null;
    export let IRCSend: fnWriteToConnectionDef = null;
    export let IsReady: () => boolean = function (): boolean { return false; };

    class NBSock implements INBSocket {

        //variables
        private is_ready_: boolean = false;

        constructor() {
            //NBFlashConnectionDataPoster = this.OnData;
            NBFlashSocketGlobalInstance = this;

            NBChatConnection.Close = this.Close;
            NBChatConnection.Connect = this.Connect;
            NBChatConnection.IRCSend = this.IRCSend;
            NBChatConnection.IsReady = this.IsReady;
        }

        //events
        public OnClose(message: string): void {
            if (NBChatConnection.OnClose !== null) {
                NBChatConnection.OnClose(message);
            }
        }

        public OnConnect(connection_result: { success: boolean, address: string }): void {
            if (NBChatConnection.OnConnect !== null) {
                NBChatConnection.OnConnect(connection_result);
            }
        }

        public OnData(s: string): void {
            //let controller set it, here just check if it is not null.
            if (NBChatConnection.OnData !== null) {

                const sa: string[] = s.split("\r\n");

                for (let i:number = 0; i < sa.length; i++) {
                    if (!IsEmptyString(sa[i])) {
                        NBChatConnection.OnData(sa[i]);
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
            //design: 'flashObj' should be declared in this module only, so no calls to it from outside of this module.
            flashObj.stopLoadNotification();

            if (NBChatConnection.OnReady !== null) {
                NBChatConnection.OnReady();
            }
        }

        //functions

        public Close(reasong: string): void {
            //ToDo:
        }

        public Connect(ip: string, port: number): void {
            flashObj.sckConnect(ip, port);
        }

        public IRCSend(s: string): void {
            console.log(">>" + s);

            flashObj.sockSend(s + "\r\n");
        }

        public IsReady(): boolean {
            return this.is_ready_;
        }
    }

    const SockMain: INBSocket = new NBSock();

}