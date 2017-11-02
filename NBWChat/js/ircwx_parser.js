/*
 * Copyright (C) 2006-2017  Net-Bits.Net
 * All rights reserved.
 *
 * Contact: nucleusae@gmail.com
 *
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 */
var IRCwxParser;
(function (IRCwxParser) {
    "use strict";
    var IRCmUser = NBChatCore.IRCmUser;
    function ExtractHost(s) {
        var idxHostStart = s.indexOf("@") + 1;
        return (s.substr(idxHostStart));
    }
    IRCwxParser.ExtractHost = ExtractHost;
    function ExtractNick(dat) {
        //Note: this not in core because it maybe protocol dependent, hence in ircwx parser module. -- 7-Jul-2017 HY
        return (dat.slice(0, dat.indexOf("!")));
    }
    IRCwxParser.ExtractNick = ExtractNick;
    function IsSameUser(user, user_to) {
        //ToDo: not finished yet. Currently code is using nick to nick which is string comparision, to replace to user object will require lot of code changes, so it will be done later.
        //Rational: IRCwx supports unicode for nick names and nicks are supposed to be case insenstive. For example abc and aBc is same nick and should match.
        // But case insensitive comparision is not simple in Unicode and some characters are difficult to reliabily match, hence, protocol needs to support better mechanism than
        // simply doing case insenstive compare of nick names to check if ircwx message was from the same user. Unique ident based on channel instance will be more reliable method.
        //
        // Currently, I believe this is not an issue as nick names are matched on the server and server sends the exact nick of the user, hence, even binary comparision is ok.
        // However, it is better to keep a single function to match user incase this server side behavior changes in the future.
        // -- HY (08-Oct-2017)
        //binary compare is ok currently, see the explaination above.
        if (user.nick === user_to.nick) {
            return true;
        }
        return false;
    }
    IRCwxParser.IsSameUser = IsSameUser;
    //Test function
    function ircmParserTestFun() {
        return true;
    }
    IRCwxParser.ircmParserTestFun = ircmParserTestFun;
    function parse324(sChan, sModes, sParam, aModes) {
        var sNModes = "";
        var s_l_Mode = null;
        var s_k_Mode = null;
        var result = null;
        if ((sParam == null) || (sParam.length === 0)) {
            sModes = sModes.split("l").join("");
            sModes = sModes.split("k").join("");
            if (sModes.length > 1) {
                result = { IrcmChannelName: sChan, sNModes: sModes.substr(1), s_l_Mode: null, s_k_Mode: null };
            }
            else {
                result = { IrcmChannelName: sChan, sNModes: "", s_l_Mode: null, s_k_Mode: null };
            }
        }
        else {
            for (var i = 0; i < sModes.length; i++) {
                switch (sModes[i]) {
                    case "l":
                        if (!IsUndefinedOrNull(aModes[5])) {
                            s_l_Mode = aModes[5];
                        }
                        break;
                    case "k":
                        if (!IsUndefinedOrNull(aModes[6])) {
                            s_k_Mode = aModes[6];
                        }
                        break;
                    default:
                        sNModes += sModes[i];
                        break;
                }
            }
            if (sNModes.length > 1) {
                result = { IrcmChannelName: sChan, sNModes: sModes.substr(1), s_l_Mode: s_l_Mode, s_k_Mode: s_k_Mode };
            }
            else {
                result = { IrcmChannelName: sChan, sNModes: "", s_l_Mode: s_l_Mode, s_k_Mode: s_k_Mode };
            }
        }
        return result;
    }
    function parseData(toks) {
        /*
            :<servername> DATA <nickby> <type> :<message>
            :<servername> DATA <nickby> PID :<nickof> <pid>
            :user@masked DATA <channel> <userto> <tag> :<message>
        */
        if (toks.length < 5) {
            return null;
        }
        if (toks[0].indexOf("@") >= 3) {
            //whispers
            return new NBChatCore.DataWhispersCls(toks[0], toks[2], toks[3], toks[4], NBChatCore.TrimLeadingColon(toks.slice(5).join(" ")));
        }
        else {
            //server data item.
            return new NBChatCore.DataServerCls(toks[0], toks[2], toks[3], NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")));
        }
    }
    function parseJoin(userstr, flags, chan) {
        var oUser = new IRCmUser();
        var pos1 = -1;
        var pos2 = -1;
        pos1 = userstr.indexOf("!");
        oUser.nick = userstr.substr(0, pos1);
        pos1++;
        pos2 = userstr.indexOf("@", pos1);
        oUser.fullident = userstr.substr(pos1, (pos2 - pos1));
        pos1 = oUser.fullident.lastIndexOf(".") + 1;
        oUser.ident = oUser.fullident.substr(pos1);
        pos2++;
        oUser.host = userstr.substr(pos2);
        oUser.ilevel = 0;
        switch (flags.charAt(0)) {
            case "A":
                oUser.away = true;
                break;
            case "U":
                oUser.away = false;
                break;
        }
        switch (flags.substr(1, 2)) {
            case "UN":
                oUser.iprofile = 0 /* NoProfile */;
                break;
            case "UP":
                oUser.iprofile = 2 /* NoGenderWPic */;
                break;
            case "FN":
                oUser.iprofile = 3 /* Female */;
                break;
            case "MN":
                oUser.iprofile = 5 /* Male */;
                break;
            case "FP":
                oUser.iprofile = 4 /* FemaleWPic */;
                break;
            case "MP":
                oUser.iprofile = 6 /* MaleWPic */;
                break;
        }
        switch (flags.charAt(3)) {
            case "V":
                oUser.voice = true;
                break;
            case "N":
                oUser.voice = false;
                break;
        }
        if (oUser.nick.charAt(0) === "^") {
            oUser.ilevel = 128 /* Staff */;
        }
        return { user: oUser, ircmChannelName: NBChatCore.TrimLeadingColon(chan.substr(1)) };
    }
    function parseMode(sFrom, sChan, sModes, sParam, aModes) {
        var bIsChanModeWParams = false;
        if (sModes === "-k") {
            var modeoplist = void 0;
            var oModeParams = { op: null, mode: null, param: null };
            oModeParams.op = "-";
            oModeParams.mode = "k";
            modeoplist.push(oModeParams);
            return new NBChatCore.ChanModeWParamsCls(sFrom, sChan, modeoplist);
        }
        else if (IsEmptyString(sParam)) {
            return new NBChatCore.ChanModeCls(sFrom, sChan, sModes);
        }
        else {
            for (var _i = 0, sModes_1 = sModes; _i < sModes_1.length; _i++) {
                var mode = sModes_1[_i];
                if ((mode === "l") || (mode === "k")) {
                    bIsChanModeWParams = true;
                    break;
                }
            }
            var m = 0;
            var i = 4;
            var bSignAdd = true;
            var modeoplist = new Array();
            if (bIsChanModeWParams === false) {
                while ((i < aModes.length) || (m < sModes.length)) {
                    var oModeParams = { op: null, mode: null, param: null };
                    switch (sModes.charAt(m)) {
                        case "-":
                            bSignAdd = false;
                            break;
                        case "+":
                            bSignAdd = true;
                            break;
                        default:
                            oModeParams.op = (bSignAdd === true) ? "+" : "-";
                            oModeParams.mode = sModes.charAt(m);
                            oModeParams.param = aModes[i];
                            modeoplist.push(oModeParams);
                            i++;
                            break;
                    }
                    m++;
                }
                return new NBChatCore.UserModeCls(sFrom, sChan, modeoplist);
            }
            else {
                while ((i < aModes.length) || (m < sModes.length)) {
                    var oModeParams = { op: null, mode: null, param: null };
                    switch (sModes.charAt(m)) {
                        case "-":
                            bSignAdd = false;
                            break;
                        case "+":
                            bSignAdd = true;
                            break;
                        default:
                            oModeParams.op = (bSignAdd === true) ? "+" : "-";
                            oModeParams.mode = sModes.charAt(m);
                            oModeParams.param = aModes[i];
                            modeoplist.push(oModeParams);
                            i++;
                            break;
                    }
                    m++;
                }
                return new NBChatCore.ChanModeWParamsCls(sFrom, sChan, modeoplist);
            }
        }
    }
    function parseNamesListItem(nl_user_str) {
        var oUser = new IRCmUser();
        switch (nl_user_str[0]) {
            case "A":
                oUser.away = true;
                break;
            case "U":
                oUser.away = false;
                break;
        }
        switch (nl_user_str.substr(1, 2)) {
            case "UN":
                oUser.iprofile = 0 /* NoProfile */;
                break;
            case "UP":
                oUser.iprofile = 2 /* NoGenderWPic */;
                break;
            case "FN":
                oUser.iprofile = 3 /* Female */;
                break;
            case "MN":
                oUser.iprofile = 5 /* Male */;
                break;
            case "FP":
                oUser.iprofile = 4 /* FemaleWPic */;
                break;
            case "MP":
                oUser.iprofile = 6 /* MaleWPic */;
                break;
        }
        switch (nl_user_str[3]) {
            case "V":
                oUser.voice = true;
                break;
            case "N":
                oUser.voice = false;
                break;
        }
        switch (nl_user_str[5]) {
            case "^":
                oUser.ilevel = 128 /* Staff */;
                break;
            case "'":
                oUser.ilevel = 64 /* Superowner */;
                break;
            case ".":
                oUser.ilevel = 32 /* Owner */;
                break;
            case "@":
                oUser.ilevel = 16 /* Host */;
                break;
            case "%":
                oUser.ilevel = 8 /* Helpop */;
                break;
            case "+":
                oUser.voice = true;
                break;
            default:
                oUser.ilevel = 0;
        }
        oUser.nick = (oUser.ilevel > 0) ? nl_user_str.substr(6) : nl_user_str.substr(5);
        if (oUser.nick.charAt(0) === "^") {
            oUser.ilevel = 128 /* Staff */;
        }
        return oUser;
    }
    function parseNamesList(ircmsg_numric353) {
        var ArrayNLpre;
        var ArrayNLpost = new Array();
        ArrayNLpre = ircmsg_numric353.substr(ircmsg_numric353.indexOf(":", 2) + 1).split(" ");
        //NB NamesList Protocol Formant: UFPN,'nickname :: [ (U|A)(F|M|U)(P|N)(N|Y),(+|%|@|.|'|^)nickname ]
        for (var i = 0; i < ArrayNLpre.length; i++) {
            if (!IsEmptyString(ArrayNLpre[i])) {
                var ircm_user = parseNamesListItem(ArrayNLpre[i]);
                if (!IsUndefinedOrNull(ircm_user)) {
                    ArrayNLpost.push(ircm_user);
                }
            }
        }
        return ArrayNLpost;
    }
    // **Important Note: kept "NBChatCore." to show which one is used from core modules/namespace. -- HY 26-Dec-2016
    function parse(ircmsg) {
        if (ircmsg.length > 0) {
            var toks = [];
            toks = ircmsg.split(" ");
            switch (toks[0].toUpperCase()) {
                case "ERROR":
                    return { type: 6 /* IRCwxError */, rval: toks.join(" ") };
                case "PING":
                    return { type: 22 /* PingReply */, rval: pingReply(toks[1]) };
                case "PONG":
                    return { type: 23 /* Pong */, rval: NBChatCore.TrimLeadingColon(toks[1]) };
            }
            // End of switch
            switch (toks[1].toUpperCase()) {
                case "001":// Welcome to the Internet Relay Network
                    return {
                        type: 28 /* RPL_001_WELCOME */,
                        rval: { serverName: toks[0], userName: toks[2] },
                    };
                case "251":
                    return { type: 29 /* RPL_251_LUSERCLIENT */, rval: toks.slice(3).join(" ").substr(1) };
                case "265":
                    return { type: 30 /* RPL_265_LOCALUSERS */, rval: toks.slice(3).join(" ").substr(1) };
                case "JOIN":
                    return { type: 8 /* Join */, rval: parseJoin(toks[0], toks[2], toks[3]) };
                case "QUIT":
                    return {
                        type: 27 /* Quit */,
                        rval: ExtractNick(toks[0]),
                    };
                case "PART":
                    return {
                        type: 21 /* Part */,
                        rval: { nick: ExtractNick(toks[0]), ircmChannelName: toks[2] },
                    };
                case "NOTICE":
                    //server warning
                    //:SrvNamePanther01 NOTICE WARNING :If you do not auth/register yourself/join a chatroom or you will be disconnected.
                    //channel broadcast
                    //:nick!ident@domain NOTICE %#Channel %#Channel :message.
                    //server broadcast
                    //0                     1       2               3
                    //:nick!ident@domain NOTICE SrvNamePanther01 :message.
                    //private notice
                    //:nick!ident@domain NOTICE %#Channel nick_target :message.
                    //normal notice
                    //:nick!ident@domain NOTICE %#Channel :message.
                    //0: ServerName | Nick
                    //1: not needed
                    //2: server_name | notice_keyword | chan_name
                    //3: chan_name | nick
                    if (toks.length > 4) {
                        return {
                            type: 13 /* Notice */,
                            rval: { t0: toks[0], t1: toks[2], t2: toks[3], t3: toks.slice(4).join(" ") },
                        };
                    }
                    else if (toks.length > 3) {
                        return {
                            type: 13 /* Notice */,
                            rval: { t0: toks[0], t1: toks[2], t2: toks.slice(3).join(" ") },
                        };
                    }
                case "KICK":
                    return {
                        type: 9 /* Kick */,
                        rval: {
                            KickerUserStr: toks[0],
                            IrcmChannelName: toks[2],
                            KickedNick: toks[3], KickMessage: NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")),
                        },
                    };
                case "PRIVMSG":
                    if (toks[3][0] === ":") {
                        return {
                            type: 24 /* Privmsg */,
                            rval: {
                                SenderUserStr: toks[0],
                                IrcmChannelName: toks[2],
                                Message: NBChatCore.TrimLeadingColon(toks.slice(3).join(" ")),
                            },
                        };
                    }
                    else {
                        return {
                            type: 24 /* Privmsg */,
                            rval: {
                                SenderUserStr: toks[0],
                                IrcmChannelName: toks[2],
                                Reciver: toks[3], Message: NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")),
                            },
                        };
                    }
                case "WHISPER":
                    //Format> :>Test!0092132f753fba195ff8ce4f53704f74c8@masked WHISPER %#Test >Test2 :message
                    return {
                        type: 33 /* Whisper */,
                        rval: {
                            SenderUserStr: toks[0],
                            IrcmChannelName: toks[2], Reciver: toks[3],
                            Message: NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")),
                        },
                    };
                case "821"://unaway message
                    /*
                        Formats>
                            Personal> 	(:)<user> 821 :User unaway
                            Channel> 	(:)<user> 821 <chan> :User unaway
                    */
                    if (toks[2][0] === "%") {
                        return {
                            type: 31 /* Unaway */,
                            rval: {
                                SenderUserStr: toks[0],
                                IrcmChannelName: toks[2],
                                Message: NBChatCore.TrimLeadingColon(toks.slice(3).join(" ")),
                            },
                        };
                    }
                    else {
                        return {
                            type: 31 /* Unaway */,
                            rval: {
                                SenderUserStr: toks[0],
                                Message: NBChatCore.TrimLeadingColon(toks.slice(2).join(" ")),
                            },
                        };
                    }
                case "822"://away message
                    /*
                        Formats>
                            Personal> 	(:)<user> 822 :<user message>
                            Channel> 	(:)<user> 822 <chan> :<user message>
                    */
                    if (toks[2].indexOf("%") === 0) {
                        return {
                            type: 2 /* Away */,
                            rval: {
                                SenderUserStr: toks[0],
                                IrcmChannelName: toks[2],
                                Message: NBChatCore.TrimLeadingColon(toks.slice(3).join(" ")),
                            },
                        };
                    }
                    else {
                        return {
                            type: 2 /* Away */,
                            rval: {
                                SenderUserStr: toks[0],
                                Message: NBChatCore.TrimLeadingColon(toks.slice(2).join(" ")),
                            },
                        };
                    }
                case "301":
                    return {
                        type: 7 /* Item301 */,
                        rval: {
                            SenderUserStr: toks[3],
                            Message: NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")),
                        },
                    };
                case "302":
                    return {
                        type: 14 /* Numric302 */,
                        rval: { SenderUserStr: toks[2], Message: NBChatCore.TrimLeadingColon(toks[3]) },
                    };
                case "353"://names list reply
                    return {
                        type: 18 /* Numric353 */,
                        rval: { Users: parseNamesList(ircmsg) },
                    };
                case "366"://names list end reply
                    return { type: 19 /* Numric366 */, rval: null };
                case "324"://channel modes reply
                    return {
                        type: 15 /* Num324ChannelModes */,
                        rval: parse324(toks[3], toks[4], toks[5], toks),
                    };
                case "433"://nick already in use error
                    //Format> (:)ChatDriveIrcServer.1 433 >Test >Test :Nickname is already in use
                    return {
                        type: 20 /* Num433NickError */,
                        rval: {
                            sCurrentNick: toks[2],
                            sNewNick: toks[3],
                            sMessage: NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")),
                        },
                    };
                case "NICK":
                    //Format> (:)>Test!0092132f753fba195ff8ce4f53704f74c8@masked NICK :>Test10555
                    return {
                        type: 12 /* Nick */,
                        rval: {
                            sCurrentUserName: toks[0],
                            sNewNick: NBChatCore.TrimLeadingColon(toks[2]),
                        },
                    };
                case "AUTHUSER":
                    return { type: 3 /* AuthUser */, rval: null };
                case "MODE":
                    return {
                        type: 11 /* Mode */,
                        rval: parseMode(toks[0], toks[2], toks[3], toks[4], toks),
                    };
                case "341"://invite confirmation
                    //Note: at the moment not used.
                    return { type: 17 /* Numric341InviteConfirmation */, rval: null };
                case "INVITE":
                    return {
                        type: 5 /* Invite */,
                        rval: {
                            SenderUserStr: toks[0],
                            IrcmChannelName: toks[2],
                            TargetNick: NBChatCore.TrimLeadingColon(toks[3]),
                        },
                    };
                case "DATA":
                    return { type: 4 /* Data */, rval: parseData(toks) };
                case "KNOCK":
                    return {
                        type: 10 /* Knock */,
                        rval: {
                            SenderUserStr: toks[0],
                            IrcmChannelName: toks[2],
                            Message: NBChatCore.TrimLeadingColon(toks.slice(3).join(" ")),
                        },
                    };
                case "PROP":
                    return {
                        type: 25 /* Prop */,
                        rval: {
                            SenderUserStr: toks[0],
                            IrcmChannelName: toks[2],
                            PropType: toks[3],
                            Message: NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")),
                        },
                    };
                case "332":
                    return {
                        type: 16 /* Numric332ChannelTopic */,
                        rval: {
                            IrcmChannelName: toks[3],
                            Topic: NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")),
                        },
                    };
                case "801": //IRCRPL_ACCESSADD
                case "802": //IRCRPL_ACCESSDELETE
                case "803": //IRCRPL_ACCESSSTART
                case "804": //IRCRPL_ACCESSLIST
                case "805": //IRCRPL_ACCESSEND
                case "820": //IRCRPL_ACCESSEND
                case "903": //IRCERR_BADLEVEL
                case "913": //IRCERR_NOACCESS
                case "914": //IRCERR_DUPACCESS
                case "915": //IRCERR_MISACCESS
                case "916"://IRCERR_TOOMANYACCESSES
                    return {
                        type: 1 /* AccessNRelatedReplies */,
                        rval: { AccessNumric: toks[1], IrcMsg: ircmsg },
                    };
                case "900": //IRCERR_BADCOMMAND
                case "901": //IRCERR_TOOMANYARGUMENTS
                case "925"://IRCERR_TOOMANYARGUMENTS
                    return {
                        type: 1 /* AccessNRelatedReplies */,
                        rval: { AccessNumric: toks[1], IrcMsg: ircmsg },
                    };
                case "818":
                case "819":
                    return {
                        type: 26 /* PropReplies */,
                        rval: { PropNumric: toks[1], IrcmChannelName: toks[3], IrcMsg: ircmsg },
                    };
                default:
                    return {
                        type: 32 /* UnhandledIRCwxMessage */,
                        rval: { IrcMsg: ircmsg, toks: toks },
                    };
            }
            // End of switch
        }
        // end if
        return null;
    }
    IRCwxParser.parse = parse;
    //Note: Ping reply is part of ircwx protocol, keep it here.
    function pingReply(s) {
        return "PONG " + s;
    }
})(IRCwxParser || (IRCwxParser = {}));
//# sourceMappingURL=ircwx_parser.js.map