
/*
 * Copyright (C) 2006-2017  Net-Bits.Net
 * All rights reserved.
 *
 * Contact: nucleusae@gmail.com
 *
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 */

/*
 *** NOTES ***
(1) Connection object and presenter ready states are handled in controller.

ToDos:
    1) XmlNull fix.
    2) nicks are case insensitive so case insensitive nick comparisions.
    3) Ping timeout reconnection.
    4) socket already connected check.
    5) disconnect command. [done]
    6) binary socket.
*/

declare let gsPresenterInitialized: boolean;
declare let gsChannelName: string;
declare let gsAuthPass: string;

let gsSocketIsReady: boolean = false;

namespace NBChatController {
    "use strict";

    //Note: currently using namespace, when all major browsers have support for module loading then it can be changed to module here. --HY 26-Dec-2016.
    // <imports>
    import ParserWx = IRCwxParser;
    // </imports>

    // <variables>
    let debugArray: string[] = [];

    let ServerName: string, UserName: string, IsAuthRequestSent: boolean, bConnectionRegistered: boolean, bInitialPropChange: boolean = true, bIsKicked: boolean;
    let bInviteFlood: boolean = false;
    let ChannelName: string, CategoryId: string, Topic: string, Wel: string, Lang: string, Lang2: string, AuthTypeCode: string, AuthPass: string;
    let connectionStarterTicker_: NBChatCore.NBTicker = null;
    let reconnectionDelayedTicker_: NBChatCore.NBTicker = null;
    let user_me: NBChatCore.IRCmUser = null;

    let start_new_nameslist: boolean = true;

    //connection vars
    let first_connection: boolean = true;

    // </variables>

    // <function_pointers>

    let fnWriteToPresenter: NBChatCore.fnWriteToPresenterDef;
    let IRCSend: NBChatConnection.fnWriteToConnectionDef;

    let onTest: (string: string) => void;

    declare let on301: Function;
    declare let on302: Function;
    declare let on324: Function;
    declare let on332: Function;
    declare let on821Chan: Function;
    declare let on821Pr: Function;
    declare let on822Chan: Function;
    declare let on822Pr: Function;
    declare let onAccessNRelatedReplies: Function;
    declare let onChanMode: Function;
    declare let onChanModeWParams: Function;
    declare let onChanPrivmsg: Function;
    declare let onDataIRC: Function;
    declare let onDataIRC2: Function;
    declare let onEndofNamesList: Function;
    declare let onErrorReplies: Function;
    declare let onInvite: Function;
    declare let onJoin: Function;
    declare let onKick: Function;
    declare let onKnock: Function;
    //declare let onNameslist: Function;
    declare let onNick: Function;
    declare let onNotice: Function;
    declare let onNoticeChanBroadcast: Function;
    declare let onNoticeServerBroadcast: Function;
    declare let onNoticeServerMessage: Function;
    declare let onNoticePrivate: Function;
    //declare let onPart: Function;
    declare let onPrivmsg: (sNickFrom: string, sChan: string, sMessage: string) => void;
    declare let onPrivmsgPr: Function;
    declare let onProp: Function;
    declare let onPropReplies: Function;
    //declare let onQuit: Function;
    declare let onSetNick: Function;
    declare let onUserMode: Function;
    declare let onWhisper: Function;

    declare let ViewMessageConnecting: Function;
    declare let ViewMessageReconnectDelayed: Function;
    declare let ViewMessageReconnectImmediate: Function;
    declare let ViewMessageDisconnected: Function;

    //this should be removed?:
    declare let onIniLocalUser: Function;
    declare let onJoinMe: Function;
    declare let onClearUserList: Function;
    declare let onNameslistMe: Function;
    declare let onAddUser: Function;
    declare let UpdateUserCount: Function;
    declare let onFlashSocketLoad: Function;
    declare let onRemoveUserByNick: Function;
    declare let onNickMe: Function;

    // </function_pointers>

    //Call to main to start
    Main();

    function onTestImpl(s: string): void {
        alert(s);
    }

    onTest = onTestImpl;

    function testCaller(): void {
        console.log("testCaller() called.");
        onTest("Message from controller.");
    }

    IRCSend = NBChatConnection.IRCSend;

    NBChatConnection.OnReady = function (): void {
        console.log("::(NBChatController.NBSock.OnReady)");

        gsSocketIsReady = true; //ToDo: use NBChatConnection.IsReady() but it doesn't work now, try to make it singleton.

        if (AuthTypeCode === "") {
            AuthPass = gsAuthPass = flashObj.GetGuestuserPass();
        }
    };

    NBChatConnection.OnConnect = function (connection_result: { success: boolean, address: string }): void {
        console.log("::(NBChatController.NBSock.OnConnect)::" + connection_result.success + ", address: " + connection_result.address);

        if (connection_result.success) {
            IRCSend("ISFLASHSOCKET\r\nAUTHTYPE ircwx1\r\nCLIENTMODE CD1"); //ToDo: change it to IRCWX2
            IRCSend("NICK " + UserName);
            IRCSend("USER anon \"anon.com\" \"0.0.0.0\" :anon");
        } else {
            //ToDo: try to reconnect later.
        }
    };

    NBChatConnection.OnData = function (s: string): void {
        console.log("<<" + s);

        if (IsEmptyString(s)) return;

        onNbConnectionData(s);
    };

    NBChatConnection.OnError = function (error_message: string): void {
        console.log("::(NBChatController.NBSock.OnError)::" + error_message);
    };

    NBChatConnection.OnDebugData = function (debug_data: string): void {
        console.log("::(NBChatController.NBSock.OnDebugData)::" + debug_data);
    };

    NBChatConnection.OnClose = function (message: string): void {
        console.log("::(NBChatController.NBSock.OnClose)::" + message);

        ViewMessageReconnectDelayed();
        reconnectionDelayedTicker_.Start();
    };

    function ClearUserList() {
        start_new_nameslist = true;
        onClearUserList();
    }

    function addToDebugArray(s: string): void { // -- Function converstion completed 25-Dec-2016 HY
        debugArray.push(s);
        if (debugArray.length > 50) {
            debugArray.splice(0, 1);
        }
    }

    // ToDo: function DebugArrayPrint()

    function GotoChannel(): void {
        if (!IsEmptyString(ChannelName)) {
            IRCSend("CREATE " + ChannelName);
        }
    }

    function handleError(sError: string): void { // -- Function converstion completed 25-Dec-2016 HY
        // ToDo: move out presentation logic from parser.
        WriteToPresenter("<font color='#FF0000'>Error: " + sError + "</font>");
    }

    function connectionStarterCallbackImpl(): boolean {
        if (gsSocketIsReady && gsPresenterInitialized) {
            user_me = new NBChatCore.IRCmUser();
            onIniLocalUser(user_me);
            onFlashSocketLoad();
            Connect();
            return true;
        }
        return false;
    }

    function reconnectionDelayedTickerCallbackImpl(): boolean {
        Connect();
        return true;
    }

    export function SetNick(nick: string): void {
        UserName = nick;
    }

    //connect
    export function Connect(reconnection_immediate: boolean = false) {

        if (reconnection_immediate && !first_connection) {
            ViewMessageReconnectImmediate();
        }

        ViewMessageConnecting("167.114.203.99", 7778);

        NBChatConnection.Connect("167.114.203.99", 7778);

        first_connection = false;
    }

    //disconnect
    export function Disconnect(reason: string): void {
        NBChatConnection.Close(reason);
        ViewMessageDisconnected(reason);
    }

    export function InviteFlood(bFlooding: boolean): void {
        bInviteFlood = bFlooding;
    }

    export function GetGuestuserPass(): string {
        //ToDo: move to storage class or namespace.
        return flashObj.GetGuestuserPass();
    }

    export function SaveGuestuserPass(pw: string): void {
        //ToDo: move to storage class or namespace.
        flashObj.SaveGuestuserPass(pw);
        AuthPass = gsAuthPass = pw;
    }

    export function addTag(nick: string): void {
        //ToDo: move to storage class or namespace.
        flashObj.addTag(nick);
    }

    export function removeTag(nick: string): void {
        //ToDo: move to storage class or namespace.
        flashObj.removeTag(nick);
    }

    export function LoadChatOptions(): object {
        //ToDo: move to storage class or namespace.
        return flashObj.LoadChatOptions();
    }

    export function SaveChatOptions(options: object): void {
        //ToDo: move to storage class or namespace.
        flashObj.SaveChatOptions(options);
    }

    export function GetExtraOptions(): object {
        //ToDo: move to storage class or namespace.
        return flashObj.GetExtraOptions();
    }

    export function SetExtraOptions(extra_options: object): void {
        //ToDo: move to storage class or namespace.
        flashObj.SetExtraOptions();
    }

    export function playKickSnd(): void {
        flashObj.playKickSnd();
    }

    export function playWhispSnd(): void {
        flashObj.playWhispSnd();
    }

    export function SaveSingleOption(option_name: string, option_val: object): void {
        flashObj.SaveSingleOption(option_name, option_val);
    }

    export function Main(): number {
        // ToDo:
        // Comment: what this is for? - HY 13-Sep-2017

        AuthTypeCode = "";
        UserName = ">Guest";
        AuthPass = gsAuthPass;

        //Note: used global name with gs to separate names clearly to avoid conflicts, maybe there is better way than this. 23-Sep-17
        ChannelName = gsChannelName;

        if (IsUndefinedOrNull(ChannelName)) ChannelName = "";
        if (IsUndefinedOrNull(AuthPass)) AuthPass = "";

        connectionStarterTicker_ = new NBChatCore.NBTicker();
        connectionStarterTicker_.StopConditionFn = connectionStarterCallbackImpl;
        connectionStarterTicker_.Start();

        reconnectionDelayedTicker_ = new NBChatCore.NBTicker();
        reconnectionDelayedTicker_.StopConditionFn = reconnectionDelayedTickerCallbackImpl;

        return 0;
    }

    function onNbConnectionData(raw_str: string): void {

        raw_str = (raw_str.charAt(0) === ":") ? raw_str.substr(1) : raw_str;

        // trace incoming
        // Write("received: " + raw_str);
        addToDebugArray("<<:" + raw_str);

        const parser_item: NBChatCore.CommonParserReturnItem | null = ParserWx.parse(raw_str);

        if (parser_item != null) {

            switch (parser_item.type) {
                case NBChatCore.ParserReturnItemTypes.PingReply:
                    IRCSend(parser_item.rval as string);
                    break;

                case NBChatCore.ParserReturnItemTypes.IRCwxError:
                    handleError(parser_item.rval as string);
                    break;

                case NBChatCore.ParserReturnItemTypes.RPL_001_WELCOME:
                    {
                        const rpl_001 = parser_item.rval as NBChatCore.Rpl001Welcome;
                        ServerName = rpl_001.serverName;
                        UserName = rpl_001.userName;
                        onSetNick(UserName);
                        bConnectionRegistered = true;
                        GotoChannel();
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.RPL_251_LUSERCLIENT:
                case NBChatCore.ParserReturnItemTypes.RPL_265_LOCALUSERS:
                    onNoticeServerMessage(parser_item.rval as string);
                    break;

                case NBChatCore.ParserReturnItemTypes.Join:
                    {
                        let join_item = parser_item.rval as NBChatCore.JoinCls;

                        if (join_item.user.nick !== UserName) {
                            onJoin(join_item.user, join_item.ircmChannelName);
                        } else {
                            user_me = join_item.user;
                            ChannelName = join_item.ircmChannelName;
                            onJoinMe(user_me, ChannelName);
                            IRCSend("MODE " + ChannelName);
                        }
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Quit:
                    {
                        //onQuit(parser_item.rval as string);

                        let quit_nick: string = parser_item.rval as string;

                        if (quit_nick !== UserName) {
                            onRemoveUserByNick(quit_nick);

                            //ToDo:
                            //if (oEventSndOptions.bTagged != false) if (aaTagged[sNick] == true) sndTag.start();
                        } else {
                            ClearUserList();
                        }
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Part:
                    {
                        let part_item = parser_item.rval as NBChatCore.PartCls;
                        //onPart(part_item.nick, part_item.ircmChannelName);

                        if (part_item.nick !== UserName) {
                            onRemoveUserByNick(part_item.nick);

                            //ToDo:
                            //if (oEventSndOptions.bTagged != false) if (aaTagged[sNick] == true) sndTag.start();
                        } else {
                            ClearUserList();
                        }
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Notice:
                    {
                        let notice_item = parser_item.rval as NBChatCore.NoticeBaseCls;
                        let text_message = NBChatCore.TrimLeadingColon((notice_item.t3.length === 0) ? notice_item.t2 : notice_item.t3);
                        //t0: server_name | nick
                        //t1: server_name | notice_keyword | chan_name
                        //t2: chan_name | nick | text_message
                        //t3: text_message
                        if (notice_item.t0 === ServerName) {
                            //server message
                            if (!bIsKicked) {
                                if (notice_item.t1 === "WARNING" && text_message.indexOf("join a chatroom") > 0) GotoChannel();
                            }
                            onNoticeServerMessage(notice_item.t1 + " " + text_message);
                        } else if (notice_item.t2.indexOf("%") === 0) {
                            //channel broadcast
                            onNoticeChanBroadcast(ParserWx.ExtractNick(notice_item.t0), notice_item.t1, text_message);
                        } else if (notice_item.t1.indexOf("%") < 0) {
                            //server broadcast
                            if (bConnectionRegistered) onNoticeServerBroadcast(ParserWx.ExtractNick(notice_item.t0), text_message);
                            else onNoticeServerMessage(notice_item.t1 + " " + text_message);
                        } else if (notice_item.t3.indexOf(":") < 0) {
                            //private notice
                            onNoticePrivate(ParserWx.ExtractNick(notice_item.t0), notice_item.t1, text_message);

                            //ToDo:
                            //if (oEventSndOptions.bTagged != false) if (aaTagged[sNickFrom] == true) sndTag.start();
                        } else {
                            //notice message general handler
                            onNotice(ParserWx.ExtractNick(notice_item.t0), notice_item.t1, text_message);

                            //ToDo:
                            //if (oEventSndOptions.bTagged != false) if (aaTagged[sNickFrom] == true) sndTag.start();
                        }
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Kick:
                    {
                        let kick_item = parser_item.rval as NBChatCore.KickCls;

                        //use same case because server is case-insensitve for nicks.
                        if (kick_item.KickedNick.toLowerCase() === UserName.toLowerCase()) {
                            bIsKicked = true;
                        }

                        onKick(ParserWx.ExtractNick(kick_item.KickerUserStr), kick_item.IrcmChannelName, kick_item.KickedNick, kick_item.KickMessage);
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Privmsg:
                    {
                        let privmsg_item = parser_item.rval as NBChatCore.PrivmsgCls;

                        if (privmsg_item.SenderUserStr[0] === "%") {
                            onChanPrivmsg(privmsg_item.SenderUserStr, privmsg_item.IrcmChannelName, privmsg_item.Message);
                        } else if (IsEmptyString(privmsg_item.Reciver)) {
                            onPrivmsg(ParserWx.ExtractNick(privmsg_item.SenderUserStr), privmsg_item.IrcmChannelName, privmsg_item.Message);

                            //ToDo:
                            //if (oEventSndOptions.bTagged != false) if (aaTagged[sNickFrom] == true) sndTag.start();
                        } else {
                            onPrivmsgPr(ParserWx.ExtractNick(privmsg_item.SenderUserStr), privmsg_item.IrcmChannelName, privmsg_item.Reciver, privmsg_item.Message);
                        }
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Whisper:
                    {
                        let whisp_item = parser_item.rval as NBChatCore.WhisperCls;
                        onWhisper(ParserWx.ExtractNick(whisp_item.SenderUserStr), whisp_item.IrcmChannelName, whisp_item.Reciver, whisp_item.Message);
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Unaway:
                    {
                        let unaway_item = parser_item.rval as NBChatCore.UnawayCls;

                        if (unaway_item.IrcmChannelName.length > 0) on821Chan(ParserWx.ExtractNick(unaway_item.SenderUserStr), unaway_item.IrcmChannelName, unaway_item.Message);
                        else on821Pr(ParserWx.ExtractNick(unaway_item.SenderUserStr), unaway_item.Message);
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Away:
                    {
                        let away_item = parser_item.rval as NBChatCore.AwayCls;

                        if (away_item.IrcmChannelName.length > 0) on822Chan(ParserWx.ExtractNick(away_item.SenderUserStr), away_item.IrcmChannelName, away_item.Message);
                        else on822Pr(ParserWx.ExtractNick(away_item.SenderUserStr), away_item.Message);
                    }

                case NBChatCore.ParserReturnItemTypes.Item301:
                    {
                        let item_301 = parser_item.rval as NBChatCore.Item301;
                        on301(item_301.SenderUserStr, item_301.Message);
                    }

                case NBChatCore.ParserReturnItemTypes.Numric302:
                    {
                        let item_302 = parser_item.rval as NBChatCore.Numric302;
                        on302(item_302.SenderUserStr, item_302.Message);
                    }

                case NBChatCore.ParserReturnItemTypes.Numric353:
                    {
                        let nameslist_353_result = parser_item.rval as NBChatCore.NameslistUsers;

                        if (start_new_nameslist) {
                            start_new_nameslist = false;
                            onClearUserList();
                        }

                        //onNameslist(nameslist_353_result.Users);

                        for (let user of nameslist_353_result.Users) {

                            if (user.nick === UserName) {
                                user_me = user;
                                //if ((uMe.ilevel & _global.IsSuperOwner) == _global.IsSuperOwner) SetChanProps();
                                onNameslistMe(user_me, ChannelName);
                                continue;
                            }

                            onAddUser(user);
                        }

                        UpdateUserCount();
                    }

                case NBChatCore.ParserReturnItemTypes.Numric366:
                    {
                        start_new_nameslist = true;
                    }

                case NBChatCore.ParserReturnItemTypes.Num324ChannelModes:
                    {
                        let r = parser_item.rval as NBChatCore.Num324ChannelModesCls;
                        on324(r.IrcmChannelName, r.sNModes, r.s_l_Mode, r.s_k_Mode);
                    }

                case NBChatCore.ParserReturnItemTypes.Num433NickError:
                    {
                        let r = parser_item.rval as NBChatCore.Num433NickErrorCls;

                        onErrorReplies("433", r.sCurrentNick, r.sNewNick, r.sMessage);

                        if (UserName.length < 40) UserName = UserName + NBChatCore.RandomNumber(20000);
                        else {
                            UserName = UserName.substr(0, 32);
                            UserName = UserName + NBChatCore.RandomNumber(20000);
                        }

                        if (bConnectionRegistered === false) onSetNick(UserName);

                        IRCSend("NICK " + UserName);

                        if (IsAuthRequestSent) sendAuthInfo();
                    }

                case NBChatCore.ParserReturnItemTypes.Nick:
                    {
                        let r = parser_item.rval as NBChatCore.NickCls;

                        let current_nick: string = ParserWx.ExtractNick(r.sCurrentUserName);

                        if (current_nick !== UserName) {
                            onNick(current_nick, r.sNewNick);
                        } else {
                            UserName = user_me.nick = r.sNewNick;
                            onNickMe(UserName);
                        }
                    }

                case NBChatCore.ParserReturnItemTypes.AuthUser:
                    {
                        IsAuthRequestSent = true;
                        sendAuthInfo();
                    }

                case NBChatCore.ParserReturnItemTypes.Mode:
                    {
                        let r = parser_item.rval;

                        if (r instanceof NBChatCore.UserModeCls) {
                            //onUserMode(sFrom, modeoplist, sChan);
                            onUserMode(ParserWx.ExtractNick(r.SenderUserStr), r.ModesOpList, r.IrcmChannelName);
                        } else if (r instanceof NBChatCore.ChanModeCls) {
                            //onChanMode(sFrom, sModes, sChan);
                            onChanMode(ParserWx.ExtractNick(r.SenderUserStr), r.sModes, r.IrcmChannelName);
                        } else if (r instanceof NBChatCore.ChanModeWParamsCls) {
                            //onChanModeWParams(sFrom, modeoplist, sChan);
                            onChanModeWParams(ParserWx.ExtractNick(r.SenderUserStr), r.ModesOpList, r.IrcmChannelName);
                        }
                    }

                case NBChatCore.ParserReturnItemTypes.Numric341InviteConfirmation:
                    {
                        //on341(toks[2], toks[3], toks[4]);
                        //Note: at the moment not used.
                    }

                case NBChatCore.ParserReturnItemTypes.Invite:
                    {
                        let r = parser_item.rval as NBChatCore.InviteCls;

                        onInvite(ParserWx.ExtractNick(r.SenderUserStr), r.TargetNick, r.IrcmChannelName);

                        //ToDo: sound.
                        //if (oEventSndOptions.bInvite == true && bInviteFlood == false) sndInvt.start();
                    }

                case NBChatCore.ParserReturnItemTypes.Data:
                    {
                        let r = parser_item.rval;

                        if (r instanceof NBChatCore.DataWhispersCls) {
                            onDataIRC2(ParserWx.ExtractNick(r.SenderUserStr), r.IrcmChannelName, r.TargetNick, r.Tag, r.Message);
                        } else if (r instanceof NBChatCore.DataServerCls) {
                            onDataIRC(r.NickBy, r.DataType, r.Data);
                        }
                    }

                case NBChatCore.ParserReturnItemTypes.Knock:
                    {
                        let r = parser_item.rval as NBChatCore.KnockCls;
                        //Note: onknock function requires full user string.
                        onKnock(r.SenderUserStr, r.IrcmChannelName, r.Message);
                    }

                case NBChatCore.ParserReturnItemTypes.Prop:
                    {
                        let r = parser_item.rval as NBChatCore.PropCls;

                        let sender_nick = ParserWx.ExtractNick(r.SenderUserStr);

                        if (sender_nick === UserName && r.PropType.toUpperCase() === "LOCKED" && bInitialPropChange === true) {

                            if (!IsEmptyString(CategoryId)) sendToQ("PROP " + ChannelName + " CATEGORY :" + CategoryId);
                            if (!IsEmptyString(Topic)) sendToQ("PROP " + ChannelName + " TOPIC :" + Topic);
                            if (!IsEmptyString(Wel)) sendToQ("PROP " + ChannelName + " ONJOIN :" + Wel);
                            if (!IsEmptyString(Lang)) sendToQ("PROP " + ChannelName + " LANGUAGE :" + Lang);
                            if (!IsEmptyString(Lang2)) sendToQ("PROP " + ChannelName + " LANGUAGE2 :" + Lang2);

                            bInitialPropChange = false;
                            //ToDo: add timer to lock again these props
                            //Comment: Is it really needed? --HY 13-Sep-2017
                        } else {
                            //if (sMessage == null) sMessage = '';
                            onProp(sender_nick, r.IrcmChannelName, r.PropType, r.Message);
                        }
                    }

                case NBChatCore.ParserReturnItemTypes.Numric332ChannelTopic:
                    {
                        let r = parser_item.rval as NBChatCore.Numric332ChannelTopicCls;
                        on332(r.IrcmChannelName, r.Topic);
                    }

                case NBChatCore.ParserReturnItemTypes.AccessNRelatedReplies:
                    {
                        let r = parser_item.rval as NBChatCore.AccessNRelatedRepliesCls;
                        onAccessNRelatedReplies(r.AccessNumric, r.IrcMsg);
                    }

                case NBChatCore.ParserReturnItemTypes.PropReplies:
                    {
                        let r = parser_item.rval as NBChatCore.PropRepliesCls;
                        onPropReplies(r.PropNumric, r.IrcmChannelName, r.IrcMsg);
                    }

                case NBChatCore.ParserReturnItemTypes.UnhandledIRCwxMessage:
                    {
                        let r = parser_item.rval as NBChatCore.UnhandledIRCwxMessageCls;

                        if (isNaN(r.toks[1] as any) === false) {
                            if (r.toks[1] === "432" && bConnectionRegistered) {
                                if (this.UserName[0] !== ">") break;
                            }
                            onErrorReplies(r.toks[1], r.toks[2], r.toks[3], NBChatCore.TrimLeadingColon(r.toks.slice(4).join(" ")));
                        }

                        unhandledCommand(r.IrcMsg);
                    }
            }
        }
    }

    function sendAuthInfo(): void {

        if (AuthTypeCode === "T") {
            IRCSend("UTICKET " + AuthPass);
        } else if (AuthTypeCode === "T2") {
            IRCSend("UTICKET2 " + AuthPass);
        } else {
            IRCSend("LOGIN guest " + AuthPass);
            //Comment: remove following code?
            //IRCSend("NICK " + UserName);
            //IRCSend("USER anon \"anon.com\" \"0.0.0.0\" :anon");
        }

    }

    function sendToChan(chan: string, msg: string): void {
        IRCSend("PRIVMSG " + chan + " :" + msg);
    }

    function sendToQ(s: string): void {
        //ToDo:
        //setSendQueTimer();

        IRCSend(s);
    }

    function unhandledCommand(ircmsg: string): void {
        WriteToPresenter("Unhandled Command:" + ircmsg);
    }

    function WriteToPresenter(s: string): void { //-- Function converstion completed 25-Dec-2016 HY
        fnWriteToPresenter(s);
    }
}