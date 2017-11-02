/*
 * Copyright (C) 2006-2017  Net-Bits.Net
 * All rights reserved.
 *
 * Contact: nucleusae@gmail.com
 *
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 */
function IsEmptyString(s) {
    "use strict";
    if (IsUndefinedOrNull(s))
        return true;
    if (s.length === 0)
        return true;
    return false;
}
function IsUndefinedOrNull(object) {
    "use strict";
    if (object === undefined || object === null) {
        return true;
    }
    return false;
}
var NBChatCore;
(function (NBChatCore) {
    "use strict";
    // </variables and function pointers>
    // <classes>
    var AccessNRelatedRepliesCls = /** @class */ (function () {
        function AccessNRelatedRepliesCls() {
        }
        return AccessNRelatedRepliesCls;
    }());
    NBChatCore.AccessNRelatedRepliesCls = AccessNRelatedRepliesCls;
    var AwayCls = /** @class */ (function () {
        function AwayCls() {
        }
        return AwayCls;
    }());
    NBChatCore.AwayCls = AwayCls;
    var ChanModeCls = /** @class */ (function () {
        function ChanModeCls(SenderUserStr, IrcmChannelName, sModes) {
            this.SenderUserStr = SenderUserStr;
            this.IrcmChannelName = IrcmChannelName;
            this.sModes = sModes;
        }
        return ChanModeCls;
    }());
    NBChatCore.ChanModeCls = ChanModeCls;
    var ChanModeWParamsCls = /** @class */ (function () {
        function ChanModeWParamsCls(SenderUserStr, IrcmChannelName, ModesOpList) {
            this.SenderUserStr = SenderUserStr;
            this.IrcmChannelName = IrcmChannelName;
            this.ModesOpList = ModesOpList;
        }
        return ChanModeWParamsCls;
    }());
    NBChatCore.ChanModeWParamsCls = ChanModeWParamsCls;
    var DataServerCls = /** @class */ (function () {
        //ServerName: string;
        //NickBy: string;
        //DataType: string;
        //Data: string; //data starts with colon, so it is in message format.
        function DataServerCls(ServerName, NickBy, DataType, Data) {
            this.ServerName = ServerName;
            this.NickBy = NickBy;
            this.DataType = DataType;
            this.Data = Data;
        }
        return DataServerCls;
    }());
    NBChatCore.DataServerCls = DataServerCls;
    var DataWhispersCls = /** @class */ (function () {
        //SenderUserStr: string;
        //IrcmChannelName: string;
        //TargetNick: string;
        //Tag: string;
        //Message: string;
        function DataWhispersCls(SenderUserStr, IrcmChannelName, TargetNick, Tag, Message) {
            this.SenderUserStr = SenderUserStr;
            this.IrcmChannelName = IrcmChannelName;
            this.TargetNick = TargetNick;
            this.Tag = Tag;
            this.Message = Message;
        }
        return DataWhispersCls;
    }());
    NBChatCore.DataWhispersCls = DataWhispersCls;
    var InviteCls = /** @class */ (function () {
        function InviteCls() {
        }
        return InviteCls;
    }());
    NBChatCore.InviteCls = InviteCls;
    var IRCmUser = /** @class */ (function () {
        function IRCmUser() {
            this.ilevel = 0;
            this.iprofile = 0;
            this.away = false;
            this.awaymsg = "";
            this.voice = false;
            this.ignore = false;
        }
        return IRCmUser;
    }());
    NBChatCore.IRCmUser = IRCmUser;
    var Item301 = /** @class */ (function () {
        function Item301() {
        }
        return Item301;
    }());
    NBChatCore.Item301 = Item301;
    var JoinCls = /** @class */ (function () {
        function JoinCls() {
        }
        return JoinCls;
    }());
    NBChatCore.JoinCls = JoinCls;
    var KickCls = /** @class */ (function () {
        function KickCls() {
        }
        return KickCls;
    }());
    NBChatCore.KickCls = KickCls;
    var KnockCls = /** @class */ (function () {
        function KnockCls() {
        }
        return KnockCls;
    }());
    NBChatCore.KnockCls = KnockCls;
    var ModeOp = /** @class */ (function () {
        function ModeOp() {
        }
        return ModeOp;
    }());
    NBChatCore.ModeOp = ModeOp;
    var NameslistUsers = /** @class */ (function () {
        function NameslistUsers() {
        }
        return NameslistUsers;
    }());
    NBChatCore.NameslistUsers = NameslistUsers;
    var NickCls = /** @class */ (function () {
        function NickCls() {
        }
        return NickCls;
    }());
    NBChatCore.NickCls = NickCls;
    var NoticeBaseCls = /** @class */ (function () {
        function NoticeBaseCls() {
        }
        return NoticeBaseCls;
    }());
    NBChatCore.NoticeBaseCls = NoticeBaseCls;
    var Numric302 = /** @class */ (function () {
        function Numric302() {
        }
        return Numric302;
    }());
    NBChatCore.Numric302 = Numric302;
    var Num324ChannelModesCls = /** @class */ (function () {
        function Num324ChannelModesCls() {
        }
        return Num324ChannelModesCls;
    }());
    NBChatCore.Num324ChannelModesCls = Num324ChannelModesCls;
    var Numric332ChannelTopicCls = /** @class */ (function () {
        function Numric332ChannelTopicCls() {
        }
        return Numric332ChannelTopicCls;
    }());
    NBChatCore.Numric332ChannelTopicCls = Numric332ChannelTopicCls;
    var Num433NickErrorCls = /** @class */ (function () {
        function Num433NickErrorCls() {
        }
        return Num433NickErrorCls;
    }());
    NBChatCore.Num433NickErrorCls = Num433NickErrorCls;
    var PartCls = /** @class */ (function () {
        function PartCls() {
        }
        return PartCls;
    }());
    NBChatCore.PartCls = PartCls;
    var PrivmsgCls = /** @class */ (function () {
        function PrivmsgCls() {
        }
        return PrivmsgCls;
    }());
    NBChatCore.PrivmsgCls = PrivmsgCls;
    var PropCls = /** @class */ (function () {
        function PropCls() {
        }
        return PropCls;
    }());
    NBChatCore.PropCls = PropCls;
    var PropRepliesCls = /** @class */ (function () {
        function PropRepliesCls() {
        }
        return PropRepliesCls;
    }());
    NBChatCore.PropRepliesCls = PropRepliesCls;
    var Rpl001Welcome = /** @class */ (function () {
        function Rpl001Welcome() {
        }
        return Rpl001Welcome;
    }());
    NBChatCore.Rpl001Welcome = Rpl001Welcome;
    var UnawayCls = /** @class */ (function () {
        function UnawayCls() {
        }
        return UnawayCls;
    }());
    NBChatCore.UnawayCls = UnawayCls;
    var UnhandledIRCwxMessageCls = /** @class */ (function () {
        function UnhandledIRCwxMessageCls() {
        }
        return UnhandledIRCwxMessageCls;
    }());
    NBChatCore.UnhandledIRCwxMessageCls = UnhandledIRCwxMessageCls;
    var UserModeCls = /** @class */ (function () {
        function UserModeCls(SenderUserStr, IrcmChannelName, ModesOpList) {
            this.SenderUserStr = SenderUserStr;
            this.IrcmChannelName = IrcmChannelName;
            this.ModesOpList = ModesOpList;
        }
        return UserModeCls;
    }());
    NBChatCore.UserModeCls = UserModeCls;
    var WhisperCls = /** @class */ (function () {
        function WhisperCls() {
        }
        return WhisperCls;
    }());
    NBChatCore.WhisperCls = WhisperCls;
    var CommonParserReturnItem = /** @class */ (function () {
        function CommonParserReturnItem() {
        }
        return CommonParserReturnItem;
    }());
    NBChatCore.CommonParserReturnItem = CommonParserReturnItem;
    var NBTickerFlags;
    (function (NBTickerFlags) {
        NBTickerFlags[NBTickerFlags["Stop"] = 0] = "Stop";
        NBTickerFlags[NBTickerFlags["Continue"] = 1] = "Continue";
    })(NBTickerFlags = NBChatCore.NBTickerFlags || (NBChatCore.NBTickerFlags = {}));
    var NBTicker = /** @class */ (function () {
        function NBTicker(ticker_name) {
            //*WARNING*: ticker name does not check name for uniqueness, so programmer has to make sure ticker names are unique. And ticker names should be one word in camel casing with ticker in end.
            //Note: ticker name is helpful during debugging.
            //ToDo:
            //1) Check for tickername uniqueness.
            //2) Add ticker naming convention constraint.
            this.StopConditionFn = null;
            this.ticker_name_ = null;
            this.tickerHandle_ = 0;
            this.tick_internval_ms_ = 500; //default 0.5 seconds.
            this.ticker_name_ = ticker_name;
        }
        NBTicker.prototype.Start = function () {
            if (this.tickerHandle_ === 0) {
                //Note: used timeout become don't want to call the callback function again while it is not finished.
                this.tickerHandle_ = setTimeout(this.internalTickerCallback, this.tick_internval_ms_, this);
            }
        };
        NBTicker.prototype.Stop = function () {
            clearInterval(this.tickerHandle_);
            this.tickerHandle_ = 0;
        };
        NBTicker.prototype.SetTickerInterval = function (ms) {
            if (ms < 100) {
                //ToDo: move text messages to external langage (en, etc...) file.
                throw new Error("Ticker intervel cannot be less than 100 milliseconds.");
            }
            this.tick_internval_ms_ = ms;
        };
        NBTicker.prototype.internalTickerCallback = function (instance) {
            if (instance.StopConditionFn instanceof Function) {
                if (instance.StopConditionFn() === NBTickerFlags.Stop) {
                    instance.Stop();
                }
                else {
                    instance.tickerHandle_ = 0;
                    instance.Start();
                }
            }
        };
        return NBTicker;
    }());
    NBChatCore.NBTicker = NBTicker;
    // </classes>
    //handy function to fill missing fields in javascript object. e.g. missing chat option fields from default chat options.
    function FillMissingFields(source, target) {
        var target_has_changed = false;
        for (var f in source) {
            if (IsUndefinedOrNull(target[f])) {
                target[f] = source[f];
                target_has_changed = true;
            }
            else {
                if (typeof source[f] === 'object') {
                    if (FillMissingFields(source[f], target[f]))
                        target_has_changed = true;
                }
            }
        }
        return target_has_changed;
    }
    NBChatCore.FillMissingFields = FillMissingFields;
    function GenerateRandomPassword() {
        var result = '';
        for (var i = 0; i <= 16; i++) {
            result += String.fromCharCode(Math.floor(Math.random() * 100) + 33);
        }
        return result;
    }
    NBChatCore.GenerateRandomPassword = GenerateRandomPassword;
    function RandomNumber(upper_bound) {
        return Math.floor(Math.random() * upper_bound) + 1;
    }
    NBChatCore.RandomNumber = RandomNumber;
    function TrimLeadingColon(s) {
        if (IsUndefinedOrNull(s))
            return s;
        if (s.length === 0)
            return s;
        return s[0] === ":" ? s.substr(1) : s;
    }
    NBChatCore.TrimLeadingColon = TrimLeadingColon;
})(NBChatCore || (NBChatCore = {}));
//# sourceMappingURL=nbchat_core.js.map