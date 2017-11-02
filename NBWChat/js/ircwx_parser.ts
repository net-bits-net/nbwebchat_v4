/*
 * Copyright (C) 2006-2017  Net-Bits.Net
 * All rights reserved.
 *
 * Contact: nucleusae@gmail.com
 *
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 */

namespace IRCwxParser {
    "use strict";

    import IRCmUser = NBChatCore.IRCmUser;
    import UserProfileIcons = NBChatCore.UserProfileIcons;
    import UserLevels = NBChatCore.UserLevels;
    import ParserReturnTypes = NBChatCore.ParserReturnItemTypes;

    export function ExtractHost(s: string): string {
        const idxHostStart: number = s.indexOf("@") + 1;
        return (s.substr(idxHostStart));
    }

    export function ExtractNick(dat: string): string {
        //Note: this not in core because it maybe protocol dependent, hence in ircwx parser module. -- 7-Jul-2017 HY
        return (dat.slice(0, dat.indexOf("!")));
    }

    export function IsSameUser(user: IRCmUser, user_to: IRCmUser): boolean {
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

    //Test function
    export function ircmParserTestFun(): boolean {
        return true;
    }

    function parse324(sChan: string, sModes: string, sParam: null | string, aModes: string[]): NBChatCore.Num324ChannelModesCls {
        let sNModes: string = "";
        let s_l_Mode: null | string = null;
        let s_k_Mode: null | string = null;

        let result: null | NBChatCore.Num324ChannelModesCls = null;

        if ((sParam == null) || (sParam.length === 0)) {
            sModes = sModes.split("l").join("");
            sModes = sModes.split("k").join("");

            if (sModes.length > 1) {
                result = { IrcmChannelName: sChan, sNModes: sModes.substr(1), s_l_Mode: null, s_k_Mode: null };
            } else {
                result = { IrcmChannelName: sChan, sNModes: "", s_l_Mode: null, s_k_Mode: null };
            }
        } else {
            for (let i: number = 0; i < sModes.length; i++) {
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
            } else {
                result = { IrcmChannelName: sChan, sNModes: "", s_l_Mode: s_l_Mode, s_k_Mode: s_k_Mode };
            }
        }

        return result;
    }

    function parseData(toks: string[]): null | NBChatCore.DataWhispersCls | NBChatCore.DataServerCls {
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
        } else {
            //server data item.
            return new NBChatCore.DataServerCls(toks[0], toks[2], toks[3], NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")));
        }
    }

    function parseJoin(userstr: string, flags: string, chan: string): NBChatCore.JoinCls {

        let oUser: IRCmUser = new IRCmUser();
        let pos1: number = -1;
        let pos2: number = -1;

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
                oUser.iprofile = UserProfileIcons.NoProfile;
                break;
            case "UP":
                oUser.iprofile = UserProfileIcons.NoGenderWPic;
                break;
            case "FN":
                oUser.iprofile = UserProfileIcons.Female;
                break;
            case "MN":
                oUser.iprofile = UserProfileIcons.Male;
                break;
            case "FP":
                oUser.iprofile = UserProfileIcons.FemaleWPic;
                break;
            case "MP":
                oUser.iprofile = UserProfileIcons.MaleWPic;
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
            oUser.ilevel = UserLevels.Staff;
        }

        return { user: oUser, ircmChannelName: NBChatCore.TrimLeadingColon(chan.substr(1)) };
    }

    function parseMode(sFrom: string, sChan: string, sModes: string, sParam: string, aModes: string[])
        : NBChatCore.ChanModeWParamsCls | NBChatCore.ChanModeCls | NBChatCore.UserModeCls {

        let bIsChanModeWParams: boolean = false;

        if (sModes === "-k") {
            let modeoplist: NBChatCore.ModeOp[];
            let oModeParams: NBChatCore.ModeOp = { op: null, mode: null, param: null };

            oModeParams.op = "-";
            oModeParams.mode = "k";
            modeoplist.push(oModeParams);

            return new NBChatCore.ChanModeWParamsCls(sFrom, sChan, modeoplist);
        } else if (IsEmptyString(sParam)) {
            return new NBChatCore.ChanModeCls(sFrom, sChan, sModes);
        } else {
            for (const mode of sModes) {
                if ((mode === "l") || (mode === "k")) {
                    bIsChanModeWParams = true;
                    break;
                }
            }

            let m: number = 0;
            let i: number = 4;
            let bSignAdd: boolean = true;
            let modeoplist: NBChatCore.ModeOp[] = new Array<NBChatCore.ModeOp>();

            if (bIsChanModeWParams === false) {
                while ((i < aModes.length) || (m < sModes.length)) {
                    let oModeParams: NBChatCore.ModeOp = { op: null, mode: null, param: null };

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
            } else {
                while ((i < aModes.length) || (m < sModes.length)) {
                    let oModeParams: NBChatCore.ModeOp = { op: null, mode: null, param: null };

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

    function parseNamesListItem(nl_user_str: string): IRCmUser | null {

        let oUser: IRCmUser = new IRCmUser();

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
                oUser.iprofile = UserProfileIcons.NoProfile;
                break;
            case "UP":
                oUser.iprofile = UserProfileIcons.NoGenderWPic;
                break;
            case "FN":
                oUser.iprofile = UserProfileIcons.Female;
                break;
            case "MN":
                oUser.iprofile = UserProfileIcons.Male;
                break;
            case "FP":
                oUser.iprofile = UserProfileIcons.FemaleWPic;
                break;
            case "MP":
                oUser.iprofile = UserProfileIcons.MaleWPic;
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
                oUser.ilevel = UserLevels.Staff;
                break;
            case "'":
                oUser.ilevel = UserLevels.Superowner;
                break;
            case ".":
                oUser.ilevel = UserLevels.Owner;
                break;
            case "@":
                oUser.ilevel = UserLevels.Host;
                break;
            case "%":
                oUser.ilevel = UserLevels.Helpop;
                break;
            case "+":
                oUser.voice = true;
                break;
            default:
                oUser.ilevel = 0;
        }

        oUser.nick = (oUser.ilevel > 0) ? nl_user_str.substr(6) : nl_user_str.substr(5);
        if (oUser.nick.charAt(0) === "^") {
            oUser.ilevel = UserLevels.Staff;
        }

        return oUser;
    }

    function parseNamesList(ircmsg_numric353: string): IRCmUser[] {
        let ArrayNLpre: string[];
        let ArrayNLpost: IRCmUser[] = new Array<IRCmUser>();

        ArrayNLpre = ircmsg_numric353.substr(ircmsg_numric353.indexOf(":", 2) + 1).split(" ");

        //NB NamesList Protocol Formant: UFPN,'nickname :: [ (U|A)(F|M|U)(P|N)(N|Y),(+|%|@|.|'|^)nickname ]

        for (let i: number = 0; i < ArrayNLpre.length; i++) {
            if (!IsEmptyString(ArrayNLpre[i])) {
                const ircm_user: IRCmUser = parseNamesListItem(ArrayNLpre[i]);
                if (!IsUndefinedOrNull(ircm_user)) {
                    ArrayNLpost.push(ircm_user);
                }
            }
        }

        return ArrayNLpost;
    }

    // **Important Note: kept "NBChatCore." to show which one is used from core modules/namespace. -- HY 26-Dec-2016
    export function parse(ircmsg: string): NBChatCore.CommonParserReturnItem | null {

        if (ircmsg.length > 0) {
            let toks: string[] = [];

            toks = ircmsg.split(" ");

            switch (toks[0].toUpperCase()) {
                case "ERROR":
                    return { type: ParserReturnTypes.IRCwxError, rval: toks.join(" ") };

                case "PING":
                    return { type: ParserReturnTypes.PingReply, rval: pingReply(toks[1]) };

                case "PONG":
                    return { type: ParserReturnTypes.Pong, rval: NBChatCore.TrimLeadingColon(toks[1]) };
            }
            // End of switch

            switch (toks[1].toUpperCase()) {
                case "001": // Welcome to the Internet Relay Network
                    return {
                        type: ParserReturnTypes.RPL_001_WELCOME,
                        rval: { serverName: toks[0], userName: toks[2] } as NBChatCore.Rpl001Welcome,
                    };

                case "251":
                    return { type: ParserReturnTypes.RPL_251_LUSERCLIENT, rval: toks.slice(3).join(" ").substr(1) };

                case "265":
                    return { type: ParserReturnTypes.RPL_265_LOCALUSERS, rval: toks.slice(3).join(" ").substr(1) };

                case "JOIN":
                    return { type: ParserReturnTypes.Join, rval: parseJoin(toks[0], toks[2], toks[3]) };

                case "QUIT":
                    return {
                        type: ParserReturnTypes.Quit,
                        rval: ExtractNick(toks[0]),
                    };

                case "PART":
                    return {
                        type: ParserReturnTypes.Part,
                        rval: { nick: ExtractNick(toks[0]), ircmChannelName: toks[2] } as NBChatCore.PartCls,
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
                            type: ParserReturnTypes.Notice,
                            rval: { t0: toks[0], t1: toks[2], t2: toks[3], t3: toks.slice(4).join(" ") } as NBChatCore.NoticeBaseCls,
                        };
                    } else if (toks.length > 3) {
                        return {
                            type: ParserReturnTypes.Notice,
                            rval: { t0: toks[0], t1: toks[2], t2: toks.slice(3).join(" ") } as NBChatCore.NoticeBaseCls,
                        };
                    }

                case "KICK":
                    return {
                        type: ParserReturnTypes.Kick,
                        rval: {
                            KickerUserStr: toks[0],
                            IrcmChannelName: toks[2],
                            KickedNick: toks[3], KickMessage: NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")),
                        } as NBChatCore.KickCls,
                    };

                case "PRIVMSG":
                    if (toks[3][0] === ":") {
                        return {
                            type: ParserReturnTypes.Privmsg,
                            rval: {
                                SenderUserStr: toks[0],
                                IrcmChannelName: toks[2],
                                Message: NBChatCore.TrimLeadingColon(toks.slice(3).join(" ")),
                            } as NBChatCore.PrivmsgCls,
                        };

                    } else {
                        return {
                            type: ParserReturnTypes.Privmsg,
                            rval: {
                                SenderUserStr: toks[0],
                                IrcmChannelName: toks[2],
                                Reciver: toks[3], Message: NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")),
                            } as NBChatCore.PrivmsgCls,
                        };
                    }

                case "WHISPER":
                    //Format> :>Test!0092132f753fba195ff8ce4f53704f74c8@masked WHISPER %#Test >Test2 :message
                    return {
                        type: ParserReturnTypes.Whisper,
                        rval: {
                            SenderUserStr: toks[0],
                            IrcmChannelName: toks[2], Reciver: toks[3],
                            Message: NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")),
                        } as NBChatCore.WhisperCls,
                    };

                case "821": //unaway message
                    /*
                        Formats>
                            Personal> 	(:)<user> 821 :User unaway
                            Channel> 	(:)<user> 821 <chan> :User unaway
                    */
                    if (toks[2][0] === "%") {
                        return {
                            type: ParserReturnTypes.Unaway,
                            rval: {
                                SenderUserStr: toks[0],
                                IrcmChannelName: toks[2],
                                Message: NBChatCore.TrimLeadingColon(toks.slice(3).join(" ")),
                            } as NBChatCore.UnawayCls,
                        };
                    } else {
                        return {
                            type: ParserReturnTypes.Unaway,
                            rval: {
                                SenderUserStr: toks[0],
                                Message: NBChatCore.TrimLeadingColon(toks.slice(2).join(" ")),
                            } as NBChatCore.UnawayCls,
                        };
                    }

                case "822": //away message
                    /*
                        Formats>
                            Personal> 	(:)<user> 822 :<user message>
                            Channel> 	(:)<user> 822 <chan> :<user message>
                    */

                    if (toks[2].indexOf("%") === 0) {
                        return {
                            type: ParserReturnTypes.Away,
                            rval: {
                                SenderUserStr: toks[0],
                                IrcmChannelName: toks[2],
                                Message: NBChatCore.TrimLeadingColon(toks.slice(3).join(" ")),
                            } as NBChatCore.AwayCls,
                        };
                    } else {
                        return {
                            type: ParserReturnTypes.Away,
                            rval: {
                                SenderUserStr: toks[0],
                                Message: NBChatCore.TrimLeadingColon(toks.slice(2).join(" ")),
                            } as NBChatCore.AwayCls,
                        };
                    }

                case "301":
                    return {
                        type: ParserReturnTypes.Item301,
                        rval: {
                            SenderUserStr: toks[3],
                            Message: NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")),
                        } as NBChatCore.Item301,
                    };

                case "302":
                    return {
                        type: ParserReturnTypes.Numric302,
                        rval: { SenderUserStr: toks[2], Message: NBChatCore.TrimLeadingColon(toks[3]) } as NBChatCore.Numric302,
                    };

                case "353": //names list reply
                    return {
                        type: ParserReturnTypes.Numric353,
                        rval: { Users: parseNamesList(ircmsg) } as NBChatCore.NameslistUsers,
                    };

                case "366": //names list end reply
                    return { type: ParserReturnTypes.Numric366, rval: null };

                case "324": //channel modes reply
                    return {
                        type: ParserReturnTypes.Num324ChannelModes,
                        rval: parse324(toks[3], toks[4], toks[5], toks),
                    };

                case "433": //nick already in use error
                    //Format> (:)ChatDriveIrcServer.1 433 >Test >Test :Nickname is already in use

                    return {
                        type: ParserReturnTypes.Num433NickError,
                        rval: {
                            sCurrentNick: toks[2],
                            sNewNick: toks[3],
                            sMessage: NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")),
                        } as NBChatCore.Num433NickErrorCls,
                    };

                case "NICK":
                    //Format> (:)>Test!0092132f753fba195ff8ce4f53704f74c8@masked NICK :>Test10555

                    return {
                        type: ParserReturnTypes.Nick,
                        rval: {
                            sCurrentUserName: toks[0],
                            sNewNick: NBChatCore.TrimLeadingColon(toks[2]),
                        } as NBChatCore.NickCls,
                    };

                case "AUTHUSER":
                    return { type: ParserReturnTypes.AuthUser, rval: null };

                case "MODE":
                    return {
                        type: ParserReturnTypes.Mode,
                        rval: parseMode(toks[0], toks[2], toks[3], toks[4], toks),
                    };

                case "341": //invite confirmation
                    //Note: at the moment not used.
                    return { type: ParserReturnTypes.Numric341InviteConfirmation, rval: null };

                case "INVITE":
                    return {
                        type: ParserReturnTypes.Invite,
                        rval: {
                            SenderUserStr: toks[0],
                            IrcmChannelName: toks[2],
                            TargetNick: NBChatCore.TrimLeadingColon(toks[3]),
                        } as NBChatCore.InviteCls,
                    };

                case "DATA":
                    return { type: ParserReturnTypes.Data, rval: parseData(toks) };

                case "KNOCK":
                    return {
                        type: ParserReturnTypes.Knock,
                        rval: {
                            SenderUserStr: toks[0],
                            IrcmChannelName: toks[2],
                            Message: NBChatCore.TrimLeadingColon(toks.slice(3).join(" ")),
                        } as NBChatCore.KnockCls,
                    };

                case "PROP":
                    return {
                        type: ParserReturnTypes.Prop,
                        rval: {
                            SenderUserStr: toks[0],
                            IrcmChannelName: toks[2],
                            PropType: toks[3],
                            Message: NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")),
                        } as NBChatCore.PropCls,
                    };

                case "332":
                    return {
                        type: ParserReturnTypes.Numric332ChannelTopic,
                        rval: {
                            IrcmChannelName: toks[3],
                            Topic: NBChatCore.TrimLeadingColon(toks.slice(4).join(" ")),
                        } as NBChatCore.Numric332ChannelTopicCls,
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
                case "916": //IRCERR_TOOMANYACCESSES
                    return {
                        type: ParserReturnTypes.AccessNRelatedReplies,
                        rval: { AccessNumric: toks[1], IrcMsg: ircmsg } as NBChatCore.AccessNRelatedRepliesCls,
                    };

                case "900": //IRCERR_BADCOMMAND
                case "901": //IRCERR_TOOMANYARGUMENTS
                case "925": //IRCERR_TOOMANYARGUMENTS
                    return {
                        type: ParserReturnTypes.AccessNRelatedReplies,
                        rval: { AccessNumric: toks[1], IrcMsg: ircmsg } as NBChatCore.AccessNRelatedRepliesCls,
                    };

                case "818":
                case "819":
                    return {
                        type: ParserReturnTypes.PropReplies,
                        rval: { PropNumric: toks[1], IrcmChannelName: toks[3], IrcMsg: ircmsg } as NBChatCore.PropRepliesCls,
                    };

                default:
                    return {
                        type: ParserReturnTypes.UnhandledIRCwxMessage,
                        rval: { IrcMsg: ircmsg, toks: toks } as NBChatCore.UnhandledIRCwxMessageCls,
                    };
            }
            // End of switch
        }
        // end if

        return null;
    }

    //Note: Ping reply is part of ircwx protocol, keep it here.
    function pingReply(s: string): string { //-- Function converstion completed 25-Dec-2016 HY
        return "PONG " + s;
    }

}