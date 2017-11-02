/*
 * Copyright (C) 2006-2017  Net-Bits.Net
 * All rights reserved.
 *
 * Contact: nucleusae@gmail.com
 *
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 */


function IsEmptyString(s: string): boolean {
    "use strict";

    if (IsUndefinedOrNull(s)) return true;

    if (s.length === 0) return true;

    return false;
}

function IsUndefinedOrNull(object: any): boolean {
    "use strict";
    if (object === undefined || object === null) { return true; }
    return false;
}

namespace NBChatCore {
    "use strict";

    // <enums>

    export const enum ParserReturnItemTypes {
        Undefined = 0, //its at the top because of value zero. This is exception to the rule of alphabetical ordering.
        AccessNRelatedReplies,
        Away,
        AuthUser,
        Data,
        Invite,
        IRCwxError,
        Item301,
        Join,
        Kick,
        Knock,
        Mode,
        Nick,
        Notice,
        Numric302,
        Num324ChannelModes,
        Numric332ChannelTopic,
        Numric341InviteConfirmation,
        Numric353,
        Numric366,
        Num433NickError,
        Part,
        PingReply,
        Pong,
        Privmsg,
        Prop,
        PropReplies,
        Quit,
        RPL_001_WELCOME,
        RPL_251_LUSERCLIENT,
        RPL_265_LOCALUSERS,
        Unaway,
        UnhandledIRCwxMessage,
        Whisper,
    }

    export const enum UserLevels {
        Staff = 128,
        Superowner = 64,
        Owner = 32,
        Host = 16,
        Helpop = 8,
    }

    export const enum UserProfileIcons {
        NoProfile = 0,
        NoGender,
        NoGenderWPic,
        Female,
        FemaleWPic,
        Male,
        MaleWPic,
    }

    // </enums>

    // <variables and function pointers>

    export type fnWriteToPresenterDef = (s: string) => void;

    // </variables and function pointers>

    // <classes>

    export class AccessNRelatedRepliesCls {
        public AccessNumric: string;
        public IrcMsg: string;
    }

    export class AwayCls {
        public SenderUserStr: string;
        public IrcmChannelName: string;
        public Message: string;
    }

    export class ChanModeCls {
        public SenderUserStr: string;
        public IrcmChannelName: string;
        public sModes: string;

        constructor(SenderUserStr: string, IrcmChannelName: string, sModes: string) {
            this.SenderUserStr = SenderUserStr;
            this.IrcmChannelName = IrcmChannelName;
            this.sModes = sModes;
        }
    }

    export class ChanModeWParamsCls {
        public SenderUserStr: string;
        public IrcmChannelName: string;
        public ModesOpList: NBChatCore.ModeOp[];

        constructor(SenderUserStr: string, IrcmChannelName: string, ModesOpList: NBChatCore.ModeOp[]) {
            this.SenderUserStr = SenderUserStr;
            this.IrcmChannelName = IrcmChannelName;
            this.ModesOpList = ModesOpList;
        }
    }

    export class DataServerCls {
        //ServerName: string;
        //NickBy: string;
        //DataType: string;
        //Data: string; //data starts with colon, so it is in message format.

        constructor(public ServerName: string, public NickBy: string, public DataType: string, public Data: string) {

        }
    }

    export class DataWhispersCls {
        //SenderUserStr: string;
        //IrcmChannelName: string;
        //TargetNick: string;
        //Tag: string;
        //Message: string;

        constructor(public SenderUserStr: string, public IrcmChannelName: string, public TargetNick: string, public Tag: string, public Message: string) {

        }
    }

    export class InviteCls {
        public SenderUserStr: string;
        public IrcmChannelName: string;
        public TargetNick: string;
    }

    export class IRCmUser {
        public nick: string;
        public fullident: string;
        public ident: string;
        public host: string;
        public ilevel: number = 0;
        public iprofile: number = 0;
        public away: boolean = false;
        public awaymsg: string = "";
        public voice: boolean = false;
        public ignore: boolean = false;
    }

    export class Item301 {
        public SenderUserStr: string;
        public Message: string;
    }

    export class JoinCls {
        public user: IRCmUser;
        public ircmChannelName: string;
    }

    export class KickCls {
        public KickerUserStr: string;
        public IrcmChannelName: string;
        public KickedNick: string;
        public KickMessage: string;
    }

    export class KnockCls {
        public SenderUserStr: string;
        public IrcmChannelName: string;
        public Message: string;
    }

    export class ModeOp {
        public op: null | string;
        public mode: null | string;
        public param: null | string;
    }

    export class NameslistUsers {
        public Users: IRCmUser[];
    }

    export class NickCls {
        public sCurrentUserName: string;
        public sNewNick: string;
    }

    export class NoticeBaseCls {
        public t0: string;
        public t1: string;
        public t2: string;
        public t3: string;
    }

    export class Numric302 {
        public SenderUserStr: string;
        public Message: string;
    }

    export class Num324ChannelModesCls {
        public IrcmChannelName: string;
        public sNModes: string;
        public s_l_Mode: null | string;
        public s_k_Mode: null | string;
    }

    export class Numric332ChannelTopicCls {
        public IrcmChannelName: string;
        public Topic: string;
    }

    export class Num433NickErrorCls {
        public sCurrentNick: string;
        public sNewNick: string;
        public sMessage: string;
    }

    export class PartCls {
        public nick: string;
        public ircmChannelName: string;
    }

    export class PrivmsgCls {
        public SenderUserStr: string;
        public IrcmChannelName: string;
        public Reciver: string;
        public Message: string;
    }

    export class PropCls {
        public SenderUserStr: string;
        public IrcmChannelName: string;
        public PropType: string;
        public Message: string;
    }

    export class PropRepliesCls {
        public PropNumric: string;
        public IrcmChannelName: string;
        public IrcMsg: string;
    }

    export class Rpl001Welcome {
        public serverName: string;
        public userName: string;
    }

    export class UnawayCls {
        public SenderUserStr: string;
        public IrcmChannelName: string;
        public Message: string;
    }

    export class UnhandledIRCwxMessageCls {
        public IrcMsg: string;
        public toks: string[];
    }

    export class UserModeCls {
        public SenderUserStr: string;
        public IrcmChannelName: string;
        public ModesOpList: NBChatCore.ModeOp[];

        constructor(SenderUserStr: string, IrcmChannelName: string, ModesOpList: NBChatCore.ModeOp[]) {
            this.SenderUserStr = SenderUserStr;
            this.IrcmChannelName = IrcmChannelName;
            this.ModesOpList = ModesOpList;
        }
    }

    export class WhisperCls {
        public SenderUserStr: string;
        public IrcmChannelName: string;
        public Reciver: string;
        public Message: string;
    }

    export class CommonParserReturnItem {
        public type: ParserReturnItemTypes;

        // Returned value
        public rval: null | string | Rpl001Welcome | JoinCls | PartCls | NoticeBaseCls | KickCls | PrivmsgCls | WhisperCls | UnawayCls | AwayCls | Item301 | Numric302
        | NameslistUsers | Num324ChannelModesCls | Num433NickErrorCls | NickCls | NBChatCore.ChanModeWParamsCls | NBChatCore.ChanModeCls | InviteCls
        | DataServerCls | DataWhispersCls | KnockCls | PropCls | Numric332ChannelTopicCls | AccessNRelatedRepliesCls | PropRepliesCls | UnhandledIRCwxMessageCls;
    }

    export enum NBTickerFlags {
        Stop,
        Continue,
    }

    export class NBTicker {
        //*WARNING*: ticker name does not check name for uniqueness, so programmer has to make sure ticker names are unique. And ticker names should be one word in camel casing with ticker in end.

        //Note: ticker name is helpful during debugging.

        //ToDo:
        //1) Check for tickername uniqueness.
        //2) Add ticker naming convention constraint.

        public StopConditionFn: () => NBTickerFlags = null;

        private ticker_name_: string = null;
        private tickerHandle_: number = 0;
        private tick_internval_ms_: number = 500; //default 0.5 seconds.

        constructor(ticker_name: string) {
            this.ticker_name_ = ticker_name;
        }

        public Start(): void {
            if (this.tickerHandle_ === 0) {
                //Note: used timeout become don't want to call the callback function again while it is not finished.
                this.tickerHandle_ = setTimeout(this.internalTickerCallback, this.tick_internval_ms_, this);
            }
        }

        public Stop(): void {
            clearInterval(this.tickerHandle_);
            this.tickerHandle_ = 0;
        }

        public SetTickerInterval(ms: number): void {
            if (ms < 100) {
                //ToDo: move text messages to external langage (en, etc...) file.
                throw new Error("Ticker intervel cannot be less than 100 milliseconds.");
            }

            this.tick_internval_ms_ = ms;
        }

        private internalTickerCallback(instance: NBTicker): void {
            if (instance.StopConditionFn instanceof Function) {
                if (instance.StopConditionFn() === NBTickerFlags.Stop) {
                    instance.Stop();
                } else {
                    instance.tickerHandle_ = 0;
                    instance.Start();
                }
            }
        }
    }

    // </classes>

    //handy function to fill missing fields in javascript object. e.g. missing chat option fields from default chat options.
    export function FillMissingFields(source: object, target: object): boolean {
        let target_has_changed: boolean = false;

        for (const f in source) {
            if (IsUndefinedOrNull(target[f])) {
                target[f] = source[f];
                target_has_changed = true;
            } else {
                if (typeof source[f] === 'object') {
                    if (FillMissingFields(source[f], target[f])) target_has_changed = true;
                }
            }
        }

        return target_has_changed;
    }

    export function GenerateRandomPassword(): string {
        var result: string = '';

        for (var i: number = 0; i <= 16; i++) {
            result += String.fromCharCode(Math.floor(Math.random() * 100) + 33);
        }

        return result;
    }

    export function RandomNumber(upper_bound: number): number {
        return Math.floor(Math.random() * upper_bound) + 1;
    }

    export function TrimLeadingColon(s: string): string {
        if (IsUndefinedOrNull(s)) return s;
        if (s.length === 0) return s;
        return s[0] === ":" ? s.substr(1) : s;
    }
}