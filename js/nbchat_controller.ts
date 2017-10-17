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
    1) nicks are case insensitive so case insensitive nick comparisions. [pending]
    2) Ping timeout got an exception. [tested could not reproduce.]
    3) Escape ircwx special characters.
    4) Add all the options fields to IChatOptions. [done, but there could be few properties/fields missing]
    5) better socket error handling and display messages e.g. there is no couldn't connect, bad ip error is not show to name few issues.
    6) Debug print implementation.

*/

declare let gsPresenterInitialized: boolean;
declare let gsChannelName: string;
declare let gsAuthPass: string;
declare let gsCategoryId: string;
declare let gsTopic: string;
declare let gsWel: string;
declare let gsLang: string;
declare let gsLang2: string;
declare let gsServerConnections: string[];
declare let sVersion: string; // gs is not used because variable may have been used in nbchat_v4.js

namespace NBChatController {
    "use strict";

    const enum NBStorageItemsKeys {
        GUESTPASS = "$GUESTPASS", //$ to differtiate predefined keys.
        CHATOPTIONS = "$CHATOPTIONS",
        EXTRAOPTIONS = "$EXTRAOPTIONS",
    }

    interface IEventShowNotifys {
        bDspArrivals: boolean;
        bDspStatusChg: boolean;
        bDspDeparts: boolean;
    }

    interface IChatOptions {
        sndArrival: boolean;
        sndInvite: boolean;
        sndKick: boolean;
        sndTagged: boolean;
        sndWhisp: boolean;

        sDspFrmt: string;
        fontSize: string;
        corpText: boolean;
        sAwayMsg: string;

        bEmotsOff: boolean;
        bTextFrmtOff: boolean;
        bWhispOff: boolean;
        bTimeStampOn: boolean;

        oEventShowNotifys: IEventShowNotifys;
    }

    const chat_options_default: IChatOptions = {
        sndArrival: true, sndKick: true, sndTagged: true, sndInvite: true, sndWhisp: true,
        sDspFrmt: "", fontSize: "", corpText: true, sAwayMsg: "",
        bEmotsOff: false, bTextFrmtOff: false, bWhispOff: false, bTimeStampOn: true,

        oEventShowNotifys: { bDspArrivals: true, bDspStatusChg: true, bDspDeparts: true }
    };

    //Note: currently using namespace, when all major browsers have support for module loading then it can be changed to module here. --HY 26-Dec-2016.
    // <imports>
    import ParserWx = IRCwxParser;
    import NBTickerFlags = NBChatCore.NBTickerFlags;

    //Note: Shouldn't be called directly, so nested inside controller. (Storage name is easy to mistake for making direct call.)
    namespace NBStorage { //ToDo: own module file.
        "use strict";

        //ToDo: HTML5 local storage availibility check.

        export function GetExtraOptions(): object {
            let extra_options: object = null;

            const temp: string = localStorage.getItem(NBStorageItemsKeys.EXTRAOPTIONS);

            if (!IsEmptyString(temp)) {
                extra_options = JSON.parse(temp);
            }

            //alert(JSON.stringify(extra_options));

            return extra_options;
        }

        export function GetItem(k: string): string {
            return localStorage.getItem(k);
        }

        export function GetChatOptions(): IChatOptions {
            let options: IChatOptions = null;

            const temp: string = localStorage.getItem(NBStorageItemsKeys.CHATOPTIONS);

            if (!IsEmptyString(temp)) {
                options = JSON.parse(temp);

                //alert(JSON.stringify(options));

                if (NBChatCore.FillMissingFields(chat_options_default, options)) SaveChatOptions(options);
            }

            return options;
        }

        export function SaveChatOptions(options: IChatOptions): void {
            //ToDo: test with missing fields/properties.
            NBChatCore.FillMissingFields(chat_options_default, options);
            localStorage.setItem(NBStorageItemsKeys.CHATOPTIONS, JSON.stringify(options));
        }

        export function SetExtraOptions(extra_options: object): void {
            localStorage.setItem(NBStorageItemsKeys.EXTRAOPTIONS, JSON.stringify(extra_options));
        }

        export function SaveItem(k: string, v: string, save_to_user_account: boolean): Error {
            let e: Error = null;
            //Note: 'save_to_user_account' feature is not available at the moment, but it is still good for planning early which items should be saved online to user account.

            //ToDo: check if key doesn't match any predefined keys.

            localStorage.setItem(k, v);

            return e;
        }

    }

    // </imports>

    // <variables>

    let debugArray: string[] = [];
    let taggedUsers: { [nick: string]: boolean; } = {}; //ToDo: change nick tagging to ident tagging.
    let options_controller_instance: IChatOptions = chat_options_default;

    let ServerName: string, nick_me: string, IsAuthRequestSent: boolean, bConnectionRegistered: boolean, bInitialPropChange: boolean = true, bIsKicked: boolean;
    let bInviteFlood: boolean = false;
    let ChannelName: string, CategoryId: string, Topic: string, Wel: string, Lang: string, Lang2: string, AuthTypeCode: string, AuthPass: string;
    let connectionStarterTicker_: NBChatCore.NBTicker = null;
    let reconnectionDelayedTicker_: NBChatCore.NBTicker = null;
    let connectionChecker_: NBChatCore.NBTicker = null; let connection_idle_count: number = 0;
    let user_me: NBChatCore.IRCmUser = null;

    let start_new_nameslist: boolean = true;

    //connection vars
    let first_connection: boolean = true;
    let current_socket_num: number = -1;
    const reconnect_delay_ms: number = 2500;

    // </variables>

    // <function_pointers>
    declare let fnAppendText: NBChatCore.fnWriteToPresenterDef;
    let fnWriteToPresenter: NBChatCore.fnWriteToPresenterDef = null;
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
    declare let onNick: Function;
    declare let onNotice: Function;
    declare let onNoticeChanBroadcast: Function;
    declare let onNoticeServerBroadcast: Function;
    declare let onNoticeServerMessage: Function;
    declare let onNoticePrivate: Function;
    declare let onPrivmsg: (sNickFrom: string, sChan: string, sMessage: string) => void;
    declare let onPrivmsgPr: Function;
    declare let onProp: Function;
    declare let onPropReplies: Function;
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

    // Sounds
    const JoinSnd: HTMLAudioElement = new Audio("/NBWChat/default/sounds/ChatJoin.mp3"); // buffers automatically when created
    const KickSnd: HTMLAudioElement = new Audio("/NBWChat/default/sounds/ChatKick.mp3");
    const WhispSnd: HTMLAudioElement = new Audio("/NBWChat/default/sounds/ChatWhsp.mp3");
    const InviteSnd: HTMLAudioElement = new Audio("/NBWChat/default/sounds/ChatInvt.mp3");
    const TagSnd: HTMLAudioElement = new Audio("/NBWChat/default/sounds/ChatTag.mp3");

    function onTestImpl(s: string): void {
        alert(s);
    }

    onTest = onTestImpl;

    function testCaller(): void {
        console.log("testCaller() called.");
        onTest("Message from controller.");
    }

    //Initialize
    IRCSend = NBChatConnection.Send;
    Main();

    // <NBChatConnection Events>
    NBChatConnection.OnConnect = (connection_result: { success: boolean, address: string }): void => {
        let socket_type: string = "NA";

        if (NBChatConnection.SocketType != null) socket_type = NBChatConnection.SocketType();

        console.log("::(NBChatController.NBSock.OnConnect[" + socket_type + "])::" + connection_result.success + ", address: " + connection_result.address);

        if (connection_result.success) {
            IRCSend("AUTHTYPE ircwx1\r\nCLIENTMODE CD1"); //ToDo: change it to IRCWX2
            IRCSend("NICK " + nick_me);
            IRCSend("USER anon \"anon.com\" \"0.0.0.0\" :anon");
        } else {
            reconnectDelayed();
        }
    };

    NBChatConnection.OnClose = (message: string): void => {
        console.log("::(NBChatController.NBSock.OnClose)::" + message);

        if (!bIsKicked) reconnectDelayed();
    };

    NBChatConnection.OnData = (s: string): void => {
        console.log("<<" + s);

        if (IsEmptyString(s)) return;

        onNbConnectionData(s);
    };

    NBChatConnection.OnDebugData = (debug_data: string): void => {
        console.log("::(NBChatController.NBSock.OnDebugData)::" + debug_data);
    };

    NBChatConnection.OnError = (error_message: string): void => {
        console.log("::(NBChatController.NBSock.OnError)::" + error_message);
    };

    NBChatConnection.OnReady = (): void => {
        //*WARNING*: This can fire before controller sets 'NBChatConnection.OnReady'.

        console.log("::(NBChatController.NBSock.OnReady)");
    };
    // </NBChatConnection Events>

    export function addTag(nick: string): void {
        taggedUsers[nick] = true;
    }

    function addToDebugArray(s: string): void { // -- Function converstion completed 25-Dec-2016 HY
        debugArray.push(s);
        if (debugArray.length > 50) {
            debugArray.splice(0, 1);
        }
    }

    function ClearUserList(): void {
        start_new_nameslist = true;
        onClearUserList();
    }

    //connect
    export function Connect(reconnection_immediate: boolean = false): void {
        if (NBChatConnection.CanConnect()) {
            if (reconnection_immediate && !first_connection) {
                ViewMessageReconnectImmediate();
            }

            const socket_info = GetServerIPAndPortRandomly();

            ViewMessageConnecting(socket_info.ip, socket_info.port);

            NBChatConnection.Connect(socket_info.ip, socket_info.port);

            first_connection = false;
        }
    }

    function connectionCheckerTickerCallbackImpl(): NBTickerFlags {

        if (bIsKicked) {
            return NBTickerFlags.Stop;
        }

        connection_idle_count++;

        if (connection_idle_count >= 3 && connection_idle_count < 14) {
            if (connection_idle_count % 3 === 0) {
                IRCSend("PING :0001");
            }
        } else if (connection_idle_count >= 14) {
            //ToDo: move formatting to css.
            WriteToPresenter("<font color='#FF0000'>Client Debug Alert: I'm closing connection. Reason: Ping timeout.</font>");
            connection_idle_count = 0;
            NBChatConnection.Close(null);
            reconnectionDelayedTicker_.Start();
        }

        return NBTickerFlags.Continue;
    }

    function connectionStarterCallbackImpl(): NBTickerFlags {

        if (NBChatConnection.IsReady() && gsPresenterInitialized) {

            fnWriteToPresenter = fnAppendText;

            if (IsEmptyString(gsAuthPass)) AuthPass = gsAuthPass = GetGuestuserPass();
            user_me = new NBChatCore.IRCmUser();
            onIniLocalUser(user_me);
            onFlashSocketLoad();
            Connect();

            return NBTickerFlags.Stop;
        }

        return NBTickerFlags.Continue;
    }

    // ToDo: function DebugArrayPrint()

    export function DebugPrint(): void {
        //ToDo:
    }

    //disconnect
    export function Disconnect(reason: string): void {
        NBChatConnection.Close(reason);
        ViewMessageDisconnected(reason);
    }

    export function GetExtraOptions(): object {
        let extra_options: object = null;
        extra_options = NBStorage.GetExtraOptions();
        if (IsUndefinedOrNull(extra_options)) extra_options = new Object();
        return extra_options;
    }

    export function GetGuestuserPass(): string {
        let result: string = NBStorage.GetItem(NBStorageItemsKeys.GUESTPASS);

        if (IsEmptyString(result)) {
            result = NBChatCore.GenerateRandomPassword();
        }

        return result;
    }

    export function GetMyDateTime(): string {
        return new Date().toString();
    }

    function GetServerIPAndPortRandomly(): { ip: string, port: number } {
        let result: { ip: string, port: number } = null;

        if (IsUndefinedOrNull(gsServerConnections) || gsServerConnections.length === 0) {
            throw new Error("Server connection ip or port is not in correct format.");
        }

        //start randomly then round robin.
        if (current_socket_num === -1) {
            current_socket_num = Math.floor((Math.random() * gsServerConnections.length));
        } else {
            current_socket_num++;
            if (current_socket_num >= gsServerConnections.length) {
                current_socket_num = 0;
            }
        }

        const connection: string = gsServerConnections[current_socket_num];

        const connection_parts: string[] = connection.split(":", 2);

        if (connection_parts.length > 1) {
            result = { ip: connection_parts[0], port: parseInt(connection_parts[1], 10) };
        } else {
            throw new Error("Server connection ip or port is not in correct format.");
        }

        return result;
    }

    function GotoChannel(): void {
        if (!IsEmptyString(ChannelName)) {
            IRCSend("CREATE " + ChannelName);
        }
    }

    function handleError(sError: string): void { // -- Function converstion completed 25-Dec-2016 HY
        // ToDo: move out presentation logic from parser.
        WriteToPresenter("<font color='#FF0000'>Error: " + sError + "</font>");
    }

    export function InviteFlood(bFlooding: boolean): void {
        bInviteFlood = bFlooding;
    }

    function IsChanProps(): boolean {
        if (!IsEmptyString(CategoryId)) return true;
        if (!IsEmptyString(Topic)) return true;
        if (!IsEmptyString(Wel)) return true;
        if (!IsEmptyString(Lang)) return true;
        if (!IsEmptyString(Lang2)) return true;

        return false;
    }

    export function LoadChatOptions(): IChatOptions {

        let options: IChatOptions = null;

        options = NBStorage.GetChatOptions();

        if (!IsUndefinedOrNull(options)) {
            options_controller_instance = options;
        } else {
            options = options_controller_instance;
        }

        return options;
    }

    export function Main(): number {
        //Note: used global name with gs to separate names clearly to avoid conflicts, maybe there is better way than this. 23-Sep-17
        //WARNING: never modify gs variables.

        AuthTypeCode = "";
        nick_me = ">Guest";
        AuthPass = gsAuthPass;

        ChannelName = (IsUndefinedOrNull(gsChannelName)) ? "" : gsChannelName;
        CategoryId = (IsUndefinedOrNull(gsCategoryId)) ? "" : gsCategoryId;
        Topic = (IsUndefinedOrNull(gsTopic)) ? "" : gsTopic;
        Wel = (IsUndefinedOrNull(gsWel)) ? "" : gsWel;
        Lang = (IsUndefinedOrNull(gsLang)) ? "" : gsLang;
        Lang2 = (IsUndefinedOrNull(gsLang2)) ? "" : gsLang2;

        if (IsEmptyString(AuthPass)) { //Takes care of 2 issues: (1) covers null and (2) on empty string T shouldn't be set.
            AuthPass = "";
        } else {
            AuthTypeCode = "T";
        }

        if (IsUndefinedOrNull(ChannelName)) {
            ChannelName = "";
        } else {
            ChannelName = ChannelName.replace("\b", "\\b");
        }

        connectionStarterTicker_ = new NBChatCore.NBTicker("ConnectionStarterTicker");
        connectionStarterTicker_.StopConditionFn = connectionStarterCallbackImpl;
        connectionStarterTicker_.Start();

        reconnectionDelayedTicker_ = new NBChatCore.NBTicker("ReconnectionDelayedTicker");
        reconnectionDelayedTicker_.StopConditionFn = reconnectionDelayedTickerCallbackImpl;
        reconnectionDelayedTicker_.SetTickerInterval(reconnect_delay_ms);

        connectionChecker_ = new NBChatCore.NBTicker("ConnectionCheckerTicker");
        connectionChecker_.StopConditionFn = connectionCheckerTickerCallbackImpl;
        connectionChecker_.SetTickerInterval(55000);
        connectionChecker_.Start();

        return 0;
    }

    function onNbConnectionData(raw_str: string): void {
        connection_idle_count = 0;

        raw_str = (raw_str.charAt(0) === ":") ? raw_str.substr(1) : raw_str;

        // trace incoming
        addToDebugArray("<<:" + raw_str);

        const parser_item: NBChatCore.CommonParserReturnItem | null = ParserWx.parse(raw_str);

        if (parser_item != null) {

            switch (parser_item.type) {
                case NBChatCore.ParserReturnItemTypes.PingReply:
                    IRCSend(parser_item.rval as string);
                    break;

                case NBChatCore.ParserReturnItemTypes.Pong:
                    //Note: no need to put anything here, connection_idle_count is reset to 0 on every server message.
                    break;

                case NBChatCore.ParserReturnItemTypes.IRCwxError:
                    handleError(parser_item.rval as string);
                    break;

                case NBChatCore.ParserReturnItemTypes.RPL_001_WELCOME:
                    {
                        const rpl_001 = parser_item.rval as NBChatCore.Rpl001Welcome;
                        ServerName = rpl_001.serverName;
                        nick_me = rpl_001.userName;
                        onSetNick(nick_me);
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
                        const join_item = parser_item.rval as NBChatCore.JoinCls;

                        if (join_item.user.nick !== nick_me) {
                            onJoin(join_item.user, join_item.ircmChannelName);
                            if (options_controller_instance.sndArrival) playJoinSnd();
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
                        const quit_nick: string = parser_item.rval as string;

                        if (quit_nick !== nick_me) {
                            onRemoveUserByNick(quit_nick);

                            if (options_controller_instance.sndTagged !== false) {
                                if (taggedUsers[quit_nick] === true) playTagSnd();
                            }
                        } else {
                            ClearUserList();
                        }
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Part:
                    {
                        const part_item = parser_item.rval as NBChatCore.PartCls;

                        if (part_item.nick !== nick_me) {
                            onRemoveUserByNick(part_item.nick);
                            if (options_controller_instance.sndTagged !== false) {
                                if (taggedUsers[part_item.nick] === true) playTagSnd();
                            }
                        } else {
                            ClearUserList();
                        }
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Notice:
                    {
                        const notice_item = parser_item.rval as NBChatCore.NoticeBaseCls;
                        const text_message = NBChatCore.TrimLeadingColon((notice_item.t3.length === 0) ? notice_item.t2 : notice_item.t3);
                        //t0: server_name | nick
                        //t1: server_name | notice_keyword | chan_name
                        //t2: chan_name | nick | text_message
                        //t3: text_message
                        if (notice_item.t0 === ServerName) {
                            //server message
                            if (!bIsKicked) {
                                if (notice_item.t1 === "WARNING" && text_message.indexOf("join a chatroom") > 0) GotoChannel();
                                return;
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
                            const nick: string = ParserWx.ExtractNick(notice_item.t0);
                            onNoticePrivate(nick, notice_item.t1, text_message);

                            if (options_controller_instance.sndTagged !== false) if (taggedUsers[nick] === true) playTagSnd();
                        } else {
                            //notice message general handler
                            const nick: string = ParserWx.ExtractNick(notice_item.t0);
                            onNotice(nick, notice_item.t1, text_message);

                            if (options_controller_instance.sndTagged !== false) if (taggedUsers[nick] === true) playTagSnd();
                        }
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Kick:
                    {
                        const kick_item = parser_item.rval as NBChatCore.KickCls;

                        //server is case-insensitve for nicks, but currently server sends exact nick used on the server so binary comparision will match.
                        //Warning: futhermore, it is difficult reliability do case insensitive unicode nick comparision.
                        if (kick_item.KickedNick === nick_me) {
                            bIsKicked = true;
                            NBChatConnection.Close(null);
                        }

                        onKick(ParserWx.ExtractNick(kick_item.KickerUserStr), kick_item.IrcmChannelName, kick_item.KickedNick, kick_item.KickMessage);
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Privmsg:
                    {
                        const privmsg_item = parser_item.rval as NBChatCore.PrivmsgCls;

                        if (privmsg_item.SenderUserStr[0] === "%") {
                            onChanPrivmsg(privmsg_item.SenderUserStr, privmsg_item.IrcmChannelName, privmsg_item.Message);
                        } else if (IsEmptyString(privmsg_item.Reciver)) {
                            let nick: string = ParserWx.ExtractNick(privmsg_item.SenderUserStr);
                            onPrivmsg(nick, privmsg_item.IrcmChannelName, privmsg_item.Message);

                            if (options_controller_instance.sndTagged !== false) {
                                if (taggedUsers[nick] === true) playTagSnd();
                            }
                        } else {
                            onPrivmsgPr(ParserWx.ExtractNick(privmsg_item.SenderUserStr), privmsg_item.IrcmChannelName, privmsg_item.Reciver, privmsg_item.Message);
                        }
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Whisper:
                    {
                        const whisp_item = parser_item.rval as NBChatCore.WhisperCls;
                        onWhisper(ParserWx.ExtractNick(whisp_item.SenderUserStr), whisp_item.IrcmChannelName, whisp_item.Reciver, whisp_item.Message);
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Unaway:
                    {
                        const unaway_item = parser_item.rval as NBChatCore.UnawayCls;

                        if (unaway_item.IrcmChannelName.length > 0) on821Chan(ParserWx.ExtractNick(unaway_item.SenderUserStr), unaway_item.IrcmChannelName, unaway_item.Message);
                        else on821Pr(ParserWx.ExtractNick(unaway_item.SenderUserStr), unaway_item.Message);
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Away:
                    {
                        const away_item = parser_item.rval as NBChatCore.AwayCls;

                        if (away_item.IrcmChannelName.length > 0) on822Chan(ParserWx.ExtractNick(away_item.SenderUserStr), away_item.IrcmChannelName, away_item.Message);
                        else on822Pr(ParserWx.ExtractNick(away_item.SenderUserStr), away_item.Message);
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Item301:
                    {
                        const item_301 = parser_item.rval as NBChatCore.Item301;
                        on301(item_301.SenderUserStr, item_301.Message);
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Numric302:
                    {
                        const item_302 = parser_item.rval as NBChatCore.Numric302;
                        on302(item_302.SenderUserStr, item_302.Message);
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Numric353:
                    {
                        const nameslist_353_result = parser_item.rval as NBChatCore.NameslistUsers;

                        if (start_new_nameslist) {
                            start_new_nameslist = false;
                            onClearUserList();
                        }

                        for (const user of nameslist_353_result.Users) {

                            if (user.nick === nick_me) {
                                user_me = user;
                                //did it here instead of join because ilevel is set in names list.
                                if ((user_me.ilevel & NBChatCore.UserLevels.Superowner) === NBChatCore.UserLevels.Superowner) {
                                    SetChanProps();
                                }
                                onNameslistMe(user_me, ChannelName);
                                continue;
                            }

                            onAddUser(user);
                        }

                        UpdateUserCount();
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Numric366:
                    {
                        start_new_nameslist = true;
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Num324ChannelModes:
                    {
                        const r = parser_item.rval as NBChatCore.Num324ChannelModesCls;
                        on324(r.IrcmChannelName, r.sNModes, r.s_l_Mode, r.s_k_Mode);
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Num433NickError:
                    {
                        const r = parser_item.rval as NBChatCore.Num433NickErrorCls;

                        onErrorReplies("433", r.sCurrentNick, r.sNewNick, r.sMessage);

                        if (nick_me.length < 40) {
                            nick_me = nick_me + NBChatCore.RandomNumber(20000);
                        } else {
                            nick_me = nick_me.substr(0, 32);
                            nick_me = nick_me + NBChatCore.RandomNumber(20000);
                        }

                        if (bConnectionRegistered === false) onSetNick(nick_me);

                        IRCSend("NICK " + nick_me);

                        if (IsAuthRequestSent) sendAuthInfo();
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Nick:
                    {
                        const r = parser_item.rval as NBChatCore.NickCls;
                        const current_nick: string = ParserWx.ExtractNick(r.sCurrentUserName);

                        if (current_nick !== nick_me) {
                            onNick(current_nick, r.sNewNick);
                        } else {
                            nick_me = user_me.nick = r.sNewNick;
                            onNickMe(nick_me);
                        }
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.AuthUser:
                    {
                        IsAuthRequestSent = true;
                        sendAuthInfo();
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Mode:
                    {
                        const r = parser_item.rval;

                        if (r instanceof NBChatCore.UserModeCls) {
                            onUserMode(ParserWx.ExtractNick(r.SenderUserStr), r.ModesOpList, r.IrcmChannelName);
                        } else if (r instanceof NBChatCore.ChanModeCls) {
                            onChanMode(ParserWx.ExtractNick(r.SenderUserStr), r.sModes, r.IrcmChannelName);
                        } else if (r instanceof NBChatCore.ChanModeWParamsCls) {
                            onChanModeWParams(ParserWx.ExtractNick(r.SenderUserStr), r.ModesOpList, r.IrcmChannelName);
                        }
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Numric341InviteConfirmation:
                    {
                        //Note: at the moment not used.
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Invite:
                    {
                        const r = parser_item.rval as NBChatCore.InviteCls;
                        onInvite(ParserWx.ExtractNick(r.SenderUserStr), r.TargetNick, r.IrcmChannelName);
                        if (options_controller_instance.sndInvite === true && bInviteFlood === false) playInviteSnd();
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Data:
                    {
                        const r = parser_item.rval;

                        if (r instanceof NBChatCore.DataWhispersCls) {
                            onDataIRC2(ParserWx.ExtractNick(r.SenderUserStr), r.IrcmChannelName, r.TargetNick, r.Tag, r.Message);
                        } else if (r instanceof NBChatCore.DataServerCls) {
                            onDataIRC(r.NickBy, r.DataType, r.Data);
                        }
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Knock:
                    {
                        const r = parser_item.rval as NBChatCore.KnockCls;
                        //Note: onknock function requires full user string.
                        onKnock(r.SenderUserStr, r.IrcmChannelName, r.Message);
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Prop:
                    {
                        const r = parser_item.rval as NBChatCore.PropCls;
                        const sender_nick = ParserWx.ExtractNick(r.SenderUserStr);

                        if (sender_nick === nick_me && r.PropType.toUpperCase() === "LOCKED" && bInitialPropChange === true) {

                            if (!IsEmptyString(CategoryId)) sendToQ("PROP " + ChannelName + " CATEGORY :" + CategoryId);
                            if (!IsEmptyString(Topic)) sendToQ("PROP " + ChannelName + " TOPIC :" + Topic);
                            if (!IsEmptyString(Wel)) sendToQ("PROP " + ChannelName + " ONJOIN :" + Wel);
                            if (!IsEmptyString(Lang)) sendToQ("PROP " + ChannelName + " LANGUAGE :" + Lang);
                            if (!IsEmptyString(Lang2)) sendToQ("PROP " + ChannelName + " LANGUAGE2 :" + Lang2);

                            bInitialPropChange = false;
                            //ToDo: add timer to lock again these props
                            //Comment: Is it really needed? --HY 13-Sep-2017
                        } else {
                            onProp(sender_nick, r.IrcmChannelName, r.PropType, r.Message);
                        }
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.Numric332ChannelTopic:
                    {
                        const r = parser_item.rval as NBChatCore.Numric332ChannelTopicCls;
                        on332(r.IrcmChannelName, r.Topic);
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.AccessNRelatedReplies:
                    {
                        const r = parser_item.rval as NBChatCore.AccessNRelatedRepliesCls;
                        onAccessNRelatedReplies(r.AccessNumric, r.IrcMsg);
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.PropReplies:
                    {
                        const r = parser_item.rval as NBChatCore.PropRepliesCls;
                        onPropReplies(r.PropNumric, r.IrcmChannelName, r.IrcMsg);
                    }
                    break;

                case NBChatCore.ParserReturnItemTypes.UnhandledIRCwxMessage:
                    {
                        const r = parser_item.rval as NBChatCore.UnhandledIRCwxMessageCls;

                        if (isNaN(r.toks[1] as any) === false) {
                            if (r.toks[1] === "432" && bConnectionRegistered) {
                                if (nick_me[0] !== ">") break;
                            }

                            onErrorReplies(r.toks[1], r.toks[2], r.toks[3], NBChatCore.TrimLeadingColon(r.toks.slice(4).join(" ")));
                            break;
                        }

                        unhandledCommand(r.IrcMsg);
                    }
                    break;
            }
        }
    }

    export function playJoinSnd(): void {
        JoinSnd.play();
    }

    export function playInviteSnd(): void {
        InviteSnd.play();
    }

    export function playKickSnd(): void {
        KickSnd.play();
    }

    export function playWhispSnd(): void {
        WhispSnd.play();
    }

    function playTagSnd(): void {
        TagSnd.play();
    }

    function printError(s: string): void {
        //ToDo: move formatting to css.
        WriteToPresenter("<font color='#FF0000' > Error: " + s + " </font>");
    }

    function reconnectDelayed(): void {
        ViewMessageReconnectDelayed();
        reconnectionDelayedTicker_.Start();
    }

    function reconnectionDelayedTickerCallbackImpl(): NBTickerFlags {
        Connect();
        return NBTickerFlags.Stop;
    }

    export function removeTag(nick: string): void {
        if (taggedUsers[nick]) delete taggedUsers[nick];
    }

    export function SaveChatOptions(options: IChatOptions): void {
        if (IsUndefinedOrNull(options)) {
            throw new Error("SaveChatOptions function: options paratmeter cannot be null.");
        }

        options_controller_instance = options;

        NBStorage.SaveChatOptions(options_controller_instance);
    }

    export function SaveGuestuserPass(pw: string): void {
        AuthPass = gsAuthPass = pw;

        const e: Error = NBStorage.SaveItem(NBStorageItemsKeys.GUESTPASS, pw, false);

        if (e != null) {
            //ToDo: handle error.
        }
    }

    export function SaveSingleOption(option_name: string, option_val: object): void {

        switch (option_name) {
            case "awaymsg":
                if (typeof (option_val) === 'string') {
                    options_controller_instance.sAwayMsg = option_val;
                } else {
                    console.log("SaveSingleOption:: error: option_val should be string for away message.");
                }
                break;
            default:
                console.log("SaveSingleOption:: error: this option name is not implemented.");
                break;
        }
    }

    function sendAuthInfo(): void {

        if (AuthTypeCode === "T") {
            IRCSend("UTICKET " + AuthPass);
        } else if (AuthTypeCode === "T2") {
            IRCSend("UTICKET2 " + AuthPass);
        } else {
            IRCSend("LOGIN guest " + AuthPass);
        }

    }

    function sendToChan(chan: string, msg: string): void {
        IRCSend("PRIVMSG " + chan + " :" + msg);
    }

    function sendToQ(s: string): void {
        IRCSend(s);
    }

    export function sendToServer(s: string): void {
        NBChatConnection.Send(s);
    }

    export function sendToServerQue(s: string): void {
        //Note: everything is send to queue now, this only for legacy code support.
        NBChatConnection.Send(s);
    }

    export function SetExtraOptions(extra_options: object): void {
        NBStorage.SetExtraOptions(extra_options);
    }

    export function SetChanProps(): void {
        if (IsChanProps() === true && bInitialPropChange === true) {
            if (!IsEmptyString(CategoryId)) sendToQ("PROP " + ChannelName + " UNLOCK :CATEGORY");
            if (!IsEmptyString(Topic)) sendToQ("PROP " + ChannelName + " UNLOCK :TOPIC");
            if (!IsEmptyString(Wel)) sendToQ("PROP " + ChannelName + " UNLOCK :ONJOIN");
            if (!IsEmptyString(Lang)) sendToQ("PROP " + ChannelName + " UNLOCK :LANGUAGE");
            if (!IsEmptyString(Lang2)) sendToQ("PROP " + ChannelName + " UNLOCK :LANGUAGE2");
        } else {
            bInitialPropChange = false;
        }
    }

    export function SetNick(nick: string): void {
        nick_me = nick;
    }

    function unhandledCommand(ircmsg: string): void {
        WriteToPresenter("Unhandled Command:" + ircmsg);
    }

    export function Version(): string {
        if (NBChatConnection.SocketType != null) {
            return sVersion + "(" + NBChatConnection.SocketType() + ")";
        } else {
            return sVersion + "(socket type is n/a).";
        }
    }

    function WriteToPresenter(s: string): void { //-- Function converstion completed 25-Dec-2016 HY
        fnWriteToPresenter(s);
    }
}