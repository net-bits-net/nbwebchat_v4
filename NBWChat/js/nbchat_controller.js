/*
 * Copyright (C) 2006-2017  Net-Bits.Net
 * All rights reserved.
 *
 * Contact: nucleusae@gmail.com
 *
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 */
var NBChatController;
(function (NBChatController) {
    "use strict";
    var chat_options_default = {
        sndArrival: true, sndKick: true, sndTagged: true, sndInvite: true, sndWhisp: true,
        sDspFrmt: "", fontSize: "", corpText: true, sAwayMsg: "", bConfirmOnLeaveOff: false,
        bEmotsOff: false, bTextFrmtOff: false, bWhispOff: false, bTimeStampOn: true,
        oEventShowNotifys: { bDspArrivals: true, bDspStatusChg: true, bDspDeparts: true }
    };
    //Note: currently using namespace, when all major browsers have support for module loading then it can be changed to module here. --HY 26-Dec-2016.
    // <imports>
    var ParserWx = IRCwxParser;
    var NBTickerFlags = NBChatCore.NBTickerFlags;
    //Note: Shouldn't be called directly, so nested inside controller. (Storage name is easy to mistake for making direct call.)
    var NBStorage;
    (function (NBStorage) {
        "use strict";
        //ToDo: HTML5 local storage availibility check.
        /*
        ** Net-Bits.Net IRCWX Storage Specification **

        - Storage items are timestamped in ISO date format.
        - NBStorage module adds or strips timestamps; timestamps should be handled only in storage module.
        - Online storage operations can fail, so local storage might be newer than online storage.
           -- NBStorage first checks the timestamps between online and local storage, which ever is newer it uses that.
           -- If online storage is older then it updates the online storage with the latest.
           -- In the abense of timestamp on local storage item, it will use online storage.
        - Local storage may store items from multiple accounts, so prefix each item with user id.
        - Guests do not have id so guest_ prefix is used.
        - Guests do not have online storage, so guest storage operations does not make online storage calls.
        - Not all storage items are suitable to pass online like guest password, there should be an option to limit a storage item to local storage only.

        - Online storage operations possible failures:
        -- size of storage has exceeded online storage limit. Online storage has only 4K characters limit,
            and whole storage is stored in json format. Recommended to keep the total size of characters in local and online storage is 2K characters.
        -- Session may have timed out. In that cause, user would have to sign in again on the site for the online storage to work again. This is one of the case when online storage might be stale.

        - Local storage operations possible failures:
        -- Exceeded the size of local storage. See maximum limit for local storage.

        - HY 19-Oct-2017.

        ** Note: implementation is of spec is complete, above is for reference. -HY 19-Oct-2017.

        */
        function updateOnlineUserStorage(k, v) {
            if (IsUndefinedOrNull(gsOnlineUserStorage)) {
                return;
            }
            //WARNING: this will block subsequent ajax update, but if ajax call fails then online storage is not updated.
            //ToDo: handle above issue gracefully.
            gsOnlineUserStorage[k] = v;
            $.ajax({
                url: "/Chatui/UpdateUserOnlineStorage",
                type: "POST",
                data: { k: k, v: v },
                success: function (response) {
                    console.log(response);
                },
                error: function (response) {
                    console.log(response);
                    //ToDo: handle error, right now may not be needed due to update logic. See specification above.
                }
            });
        }
        function splitTimestampAndValue(s) {
            if (IsEmptyString(s))
                return null;
            var result = { ts: null, v: "" };
            //WARNING: not all items stored are in json format so '{' may not be there.
            var ts_endpos = -1;
            var iso_date_regex_pat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/;
            if (iso_date_regex_pat.test(s)) {
                ts_endpos = s.indexOf("Z");
            }
            try {
                if (ts_endpos < 1) {
                    result.v = s;
                }
                else {
                    var temp_ts_str = s.substring(0, ts_endpos);
                    var temp_ts = new Date(temp_ts_str.trim());
                    if (!isNaN(temp_ts.getDate()))
                        result.ts = temp_ts;
                    result.v = s.substring(ts_endpos + 1);
                }
            }
            catch (_a) {
                return null;
            }
            return result;
        }
        function getLatestVersionOfItemSubFn(item_local, item_online) {
            var result = { latest_item: "", online_version_is_stale: false };
            var r_local = splitTimestampAndValue(item_local);
            var r_online = splitTimestampAndValue(item_online);
            if (IsUndefinedOrNull(r_local)) {
                if (!IsUndefinedOrNull(r_online)) {
                    result.latest_item = r_online.v;
                    return result;
                }
                else {
                    return null;
                }
            }
            if (IsUndefinedOrNull(r_online)) {
                if (!IsUndefinedOrNull(r_local)) {
                    result.latest_item = r_local.v;
                    result.online_version_is_stale = true;
                    return result;
                }
                else {
                    return null;
                }
            }
            if (r_online.ts > r_local.ts) {
                result.latest_item = r_online.v;
            }
            else {
                result.latest_item = r_local.v;
                result.online_version_is_stale = true;
            }
            return result;
        }
        function getLocalStorageUserKey(key) {
            if (IsEmptyString(gsUserId)) {
                return { local_key: "guest_" + key, is_guest: true };
            }
            else {
                return { local_key: "userid_" + gsUserId + "_" + key, is_guest: false };
            }
        }
        function getLatestVersionOfItem(key) {
            var _a = getLocalStorageUserKey(key), local_key = _a.local_key, is_guest = _a.is_guest;
            //wts stands for with timestamp.
            var item_local_wts = localStorage.getItem(local_key);
            var temp_online_wts = onlineStorageGetItem(key);
            //WARNING: specific local and online location might create mistakes, maybe there is better alternative?
            var r = getLatestVersionOfItemSubFn(item_local_wts, temp_online_wts);
            if (r === null)
                return null;
            if (r.latest_item != null && r.online_version_is_stale && !is_guest) {
                updateOnlineUserStorage(key, item_local_wts);
            }
            return r.latest_item;
        }
        function setLatestItemAndUpdateBothStorages(key, value, save_to_user_account) {
            var _a = getLocalStorageUserKey(key), local_key = _a.local_key, is_guest = _a.is_guest;
            var value_wts = (new Date()).toISOString() + value; //ToDo: check if iso date works exactly same in all major browsers?
            localStorage.setItem(local_key, value_wts); //ToDo: handle failure.
            if (save_to_user_account && !is_guest)
                updateOnlineUserStorage(key, value_wts);
        }
        function onlineStorageGetItem(key) {
            var result = null;
            if (!IsUndefinedOrNull(gsOnlineUserStorage)) {
                result = gsOnlineUserStorage[key];
            }
            return result;
        }
        function GetExtraOptions() {
            var extra_options = null;
            var latest_item = getLatestVersionOfItem("$EXTRAOPTIONS" /* EXTRAOPTIONS */);
            if (!IsEmptyString(latest_item)) {
                extra_options = JSON.parse(latest_item);
            }
            //alert(JSON.stringify(extra_options));
            return extra_options;
        }
        NBStorage.GetExtraOptions = GetExtraOptions;
        function GetItem(k) {
            return getLatestVersionOfItem(k);
        }
        NBStorage.GetItem = GetItem;
        function GetChatOptions() {
            var options = null;
            var latest_item = getLatestVersionOfItem("$CHATOPTIONS" /* CHATOPTIONS */); //string type is must here, hence, added type to the latest_item (issue is only relevant in typescript file).
            if (!IsEmptyString(latest_item)) {
                options = JSON.parse(latest_item);
                //alert(JSON.stringify(options));
                if (NBChatCore.FillMissingFields(chat_options_default, options))
                    SaveChatOptions(options);
            }
            return options;
        }
        NBStorage.GetChatOptions = GetChatOptions;
        function SaveChatOptions(options) {
            //ToDo: test with missing fields/properties.
            NBChatCore.FillMissingFields(chat_options_default, options);
            setLatestItemAndUpdateBothStorages("$CHATOPTIONS" /* CHATOPTIONS */, JSON.stringify(options), true);
        }
        NBStorage.SaveChatOptions = SaveChatOptions;
        function SetExtraOptions(extra_options) {
            setLatestItemAndUpdateBothStorages("$EXTRAOPTIONS" /* EXTRAOPTIONS */, JSON.stringify(extra_options), true);
        }
        NBStorage.SetExtraOptions = SetExtraOptions;
        function SaveItem(k, v, save_to_user_account) {
            var e = null;
            //Note: 'save_to_user_account' feature is not available at the moment, but it is still good for planning early which items should be saved online to user account.
            save_to_user_account = false;
            //ToDo: check if key doesn't match any predefined keys.
            setLatestItemAndUpdateBothStorages(k, v, save_to_user_account);
            return e;
        }
        NBStorage.SaveItem = SaveItem;
    })(NBStorage || (NBStorage = {}));
    // </imports>
    // <variables>
    var debugArray = [];
    var taggedUsers = {}; //ToDo: change nick tagging to ident tagging.
    var options_controller_instance = chat_options_default;
    var ServerName, nick_me, IsAuthRequestSent, bConnectionRegistered, bInitialPropChange = true, bIsKicked;
    var bInviteFlood = false;
    var ChannelName, CategoryId, Topic, Wel, Lang, Lang2, AuthTypeCode, AuthPass;
    var connectionStarterTicker_ = null;
    var reconnectionDelayedTicker_ = null;
    var connectionChecker_ = null;
    var connection_idle_count = 0;
    var user_me = null;
    var i_have_joined_channel = false;
    var start_new_nameslist = true;
    //connection vars
    var first_connection = true;
    var current_socket_num = -1;
    var reconnect_delay_ms = 2500;
    var fnWriteToPresenter = null;
    var IRCSend;
    var onTest;
    // </function_pointers>
    // Sounds
    var JoinSnd = new Audio("/NBWChat/default/sounds/ChatJoin.mp3"); // buffers automatically when created
    var KickSnd = new Audio("/NBWChat/default/sounds/ChatKick.mp3");
    var WhispSnd = new Audio("/NBWChat/default/sounds/ChatWhsp.mp3");
    var InviteSnd = new Audio("/NBWChat/default/sounds/ChatInvt.mp3");
    var TagSnd = new Audio("/NBWChat/default/sounds/ChatTag.mp3");
    function onTestImpl(s) {
        alert(s);
    }
    onTest = onTestImpl;
    function testCaller() {
        console.log("testCaller() called.");
        onTest("Message from controller.");
    }
    //Initialize
    IRCSend = NBChatConnection.Send;
    Main();
    // <NBChatConnection Events>
    NBChatConnection.OnConnect = function (connection_result) {
        var socket_type = "NA";
        if (NBChatConnection.SocketType != null)
            socket_type = NBChatConnection.SocketType();
        if (gsLogRawsToBrowserConsole === true)
            console.log("::(NBChatController.NBSock.OnConnect[" + socket_type + "])::" + connection_result.success + ", address: " + connection_result.address);
        if (connection_result.success) {
            IRCSend("AUTHTYPE ircwx1\r\nCLIENTMODE CD1"); //ToDo: change it to IRCWX2
            IRCSend("NICK " + nick_me);
            IRCSend("USER anon \"anon.com\" \"0.0.0.0\" :anon");
        }
        else {
            ViewMessageCouldNotConnect(connection_result.address);
            reconnectDelayed();
        }
    };
    NBChatConnection.OnClose = function (message) {
        if (gsLogRawsToBrowserConsole === true)
            console.log("::(NBChatController.NBSock.OnClose)::" + message);
        i_have_joined_channel = false;
        ViewMessageDisconnected(message);
        ViewMessageReconnectDelayed();
        if (!bIsKicked)
            reconnectDelayed();
    };
    NBChatConnection.OnData = function (s) {
        if (gsLogRawsToBrowserConsole === true)
            console.log("<<" + s);
        if (IsEmptyString(s))
            return;
        onNbConnectionData(s);
    };
    NBChatConnection.OnDebugData = function (debug_data) {
        console.log("::(NBChatController.NBSock.OnDebugData)::" + debug_data);
    };
    NBChatConnection.OnError = function (error_message) {
        console.log("::(NBChatController.NBSock.OnError)::" + error_message);
    };
    NBChatConnection.OnReady = function () {
        //*WARNING*: This can fire before controller sets 'NBChatConnection.OnReady'.
        console.log("::(NBChatController.NBSock.OnReady)");
    };
    // </NBChatConnection Events>
    function addTag(nick) {
        taggedUsers[nick] = true;
    }
    NBChatController.addTag = addTag;
    function addToDebugArray(s) {
        debugArray.push(s);
        if (debugArray.length > 50) {
            debugArray.splice(0, 1);
        }
    }
    function ClearUserList() {
        start_new_nameslist = true;
        onClearUserList();
    }
    function Close() {
        //clean up code here if any.
        bIsKicked = true; //to avoid reconnection if instance is in browser memory.
        NBChatConnection.Close(null);
    }
    NBChatController.Close = Close;
    //connect
    function Connect(reconnection_immediate) {
        if (reconnection_immediate === void 0) { reconnection_immediate = false; }
        if (bIsKicked) {
            bIsKicked = false;
        }
        if (NBChatConnection.CanConnect()) {
            if (reconnection_immediate && !first_connection) {
                ViewMessageReconnectImmediate();
            }
            var socket_info = GetServerIPAndPortRandomly();
            ViewMessageConnecting(socket_info.ip, socket_info.port);
            NBChatConnection.Connect(socket_info.ip, socket_info.port);
            first_connection = false;
        }
    }
    NBChatController.Connect = Connect;
    function connectionCheckerTickerCallbackImpl() {
        if (bIsKicked) {
            return NBTickerFlags.Stop;
        }
        connection_idle_count++;
        if (connection_idle_count >= 3 && connection_idle_count < 14) {
            if (connection_idle_count % 3 === 0) {
                IRCSend("PING :0001");
            }
        }
        else if (connection_idle_count >= 14) {
            //ToDo: move formatting to css.
            WriteToPresenter("<font color='#FF0000'>Client Debug Alert: I'm closing connection. Reason: Ping timeout.</font>");
            connection_idle_count = 0;
            NBChatConnection.Close(null);
            reconnectionDelayedTicker_.Start();
        }
        return NBTickerFlags.Continue;
    }
    function connectionStarterCallbackImpl() {
        if (NBChatConnection.IsReady() && gsPresenterInitialized) {
            fnWriteToPresenter = fnAppendText;
            if (IsEmptyString(gsAuthPass))
                AuthPass = gsAuthPass = GetGuestuserPass();
            user_me = new NBChatCore.IRCmUser();
            onIniLocalUser(user_me);
            onFlashSocketLoad();
            Connect();
            return NBTickerFlags.Stop;
        }
        return NBTickerFlags.Continue;
    }
    // ToDo: function DebugArrayPrint()
    function DebugPrint() {
        //ToDo:
    }
    NBChatController.DebugPrint = DebugPrint;
    //disconnect
    function Disconnect(reason) {
        bIsKicked = true; //to avoid reconnection if instance is in browser memory.
        NBChatConnection.Close(reason);
        //ViewMessageDisconnected(reason);
    }
    NBChatController.Disconnect = Disconnect;
    function GetExtraOptions() {
        var extra_options = null;
        extra_options = NBStorage.GetExtraOptions();
        if (IsUndefinedOrNull(extra_options))
            extra_options = new Object();
        return extra_options;
    }
    NBChatController.GetExtraOptions = GetExtraOptions;
    function GetGuestuserPass() {
        var result = NBStorage.GetItem("$GUESTPASS" /* GUESTPASS */);
        if (IsEmptyString(result)) {
            result = NBChatCore.GenerateRandomPassword();
            SaveGuestuserPass(result);
        }
        return result;
    }
    NBChatController.GetGuestuserPass = GetGuestuserPass;
    function GetMyDateTime() {
        return new Date().toString();
    }
    NBChatController.GetMyDateTime = GetMyDateTime;
    function GetServerIPAndPortRandomly() {
        var result = null;
        if (IsUndefinedOrNull(gsServerConnections) || gsServerConnections.length === 0) {
            throw new Error("Server connection ip or port is not in correct format.");
        }
        //start randomly then round robin.
        if (current_socket_num === -1) {
            current_socket_num = Math.floor((Math.random() * gsServerConnections.length));
        }
        else {
            current_socket_num++;
            if (current_socket_num >= gsServerConnections.length) {
                current_socket_num = 0;
            }
        }
        var connection = gsServerConnections[current_socket_num];
        var connection_parts = connection.split(":", 2);
        if (connection_parts.length > 1) {
            result = { ip: connection_parts[0], port: parseInt(connection_parts[1], 10) };
        }
        else {
            throw new Error("Server connection ip or port is not in correct format.");
        }
        return result;
    }
    function GotoChannel() {
        if (!IsEmptyString(ChannelName)) {
            IRCSend("CREATE " + ChannelName);
        }
    }
    function handleError(sError) {
        // ToDo: move out presentation logic from parser.
        WriteToPresenter("<font color='#FF0000'>Error: " + sError + "</font>");
    }
    function IHaveJoinedTheChannel() {
        return i_have_joined_channel;
    }
    NBChatController.IHaveJoinedTheChannel = IHaveJoinedTheChannel;
    function InviteFlood(bFlooding) {
        bInviteFlood = bFlooding;
    }
    NBChatController.InviteFlood = InviteFlood;
    function IsChanProps() {
        if (!IsEmptyString(CategoryId))
            return true;
        if (!IsEmptyString(Topic))
            return true;
        if (!IsEmptyString(Wel))
            return true;
        if (!IsEmptyString(Lang))
            return true;
        if (!IsEmptyString(Lang2))
            return true;
        return false;
    }
    function LoadChatOptions() {
        var options = null;
        options = NBStorage.GetChatOptions();
        if (!IsUndefinedOrNull(options)) {
            options_controller_instance = options;
        }
        else {
            options = options_controller_instance;
        }
        return options;
    }
    NBChatController.LoadChatOptions = LoadChatOptions;
    function Main() {
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
        if (IsEmptyString(AuthPass)) {
            AuthPass = "";
        }
        else {
            AuthTypeCode = "T";
        }
        if (IsUndefinedOrNull(ChannelName)) {
            ChannelName = "";
        }
        else {
            //NOTE: not needed after recent js string escaping update on the website.
            //ChannelName = ChannelName.split("\b").join("\\b"); //Javascript replace doesn't replace all. Regex version of replace might work.
            //NOTE: Handled here but perhaps should be handled on the website.
            ChannelName = ChannelName.split(" ").join("\\b");
        }
        connectionStarterTicker_ = new NBChatCore.NBTicker("ConnectionStarterTicker");
        connectionStarterTicker_.StopConditionFn = connectionStarterCallbackImpl;
        connectionStarterTicker_.SetTickerInterval(reconnect_delay_ms / 2);
        connectionStarterTicker_.Start();
        reconnectionDelayedTicker_ = new NBChatCore.NBTicker("ReconnectionDelayedTicker");
        reconnectionDelayedTicker_.StopConditionFn = reconnectionDelayedTickerCallbackImpl;
        reconnectionDelayedTicker_.SetTickerInterval(reconnect_delay_ms);
        connectionChecker_ = new NBChatCore.NBTicker("ConnectionCheckerTicker");
        connectionChecker_.StopConditionFn = connectionCheckerTickerCallbackImpl;
        connectionChecker_.SetTickerInterval(55000);
        connectionChecker_.Start();
        LoadChatOptions();
        return 0;
    }
    NBChatController.Main = Main;
    function onNbConnectionData(raw_str) {
        connection_idle_count = 0;
        raw_str = (raw_str.charAt(0) === ":") ? raw_str.substr(1) : raw_str;
        // trace incoming
        addToDebugArray("<<:" + raw_str);
        var parser_item = ParserWx.parse(raw_str);
        if (parser_item != null) {
            switch (parser_item.type) {
                case 22 /* PingReply */:
                    IRCSend(parser_item.rval);
                    break;
                case 23 /* Pong */:
                    //Note: no need to put anything here, connection_idle_count is reset to 0 on every server message.
                    break;
                case 6 /* IRCwxError */:
                    handleError(parser_item.rval);
                    break;
                case 28 /* RPL_001_WELCOME */:
                    {
                        var rpl_001 = parser_item.rval;
                        ServerName = rpl_001.serverName;
                        nick_me = rpl_001.userName;
                        onSetNick(nick_me);
                        bConnectionRegistered = true;
                        GotoChannel();
                    }
                    break;
                case 29 /* RPL_251_LUSERCLIENT */:
                case 30 /* RPL_265_LOCALUSERS */:
                    onNoticeServerMessage(parser_item.rval);
                    break;
                case 8 /* Join */:
                    {
                        var join_item = parser_item.rval;
                        if (join_item.user.nick !== nick_me) {
                            onJoin(join_item.user, join_item.ircmChannelName);
                            if (options_controller_instance.sndArrival)
                                playJoinSnd();
                        }
                        else {
                            i_have_joined_channel = true;
                            user_me = join_item.user;
                            ChannelName = join_item.ircmChannelName;
                            onJoinMe(user_me, ChannelName);
                            IRCSend("MODE " + ChannelName);
                        }
                    }
                    break;
                case 27 /* Quit */:
                    {
                        var quit_nick = parser_item.rval;
                        if (quit_nick !== nick_me) {
                            onRemoveUserByNick(quit_nick);
                            if (options_controller_instance.sndTagged !== false) {
                                if (taggedUsers[quit_nick] === true)
                                    playTagSnd();
                            }
                        }
                        else {
                            ClearUserList();
                        }
                    }
                    break;
                case 21 /* Part */:
                    {
                        var part_item = parser_item.rval;
                        if (part_item.nick !== nick_me) {
                            onRemoveUserByNick(part_item.nick);
                            if (options_controller_instance.sndTagged !== false) {
                                if (taggedUsers[part_item.nick] === true)
                                    playTagSnd();
                            }
                        }
                        else {
                            ClearUserList();
                        }
                    }
                    break;
                case 13 /* Notice */:
                    {
                        var notice_item = parser_item.rval;
                        //t0: server_name | nick
                        //t1: server_name | notice_keyword | chan_name
                        //t2: chan_name | nick | text_message
                        //t3: text_message
                        if (notice_item.t0 === ServerName) {
                            var text_message = NBChatCore.TrimLeadingColon((IsUndefinedOrNull(notice_item.t3)) ? notice_item.t2 : notice_item.t2 + " " + notice_item.t3);
                            //server message
                            if (!bIsKicked) {
                                if (notice_item.t1 === "WARNING" && text_message.indexOf("join a chatroom") > 0)
                                    GotoChannel();
                                return;
                            }
                            onNoticeServerMessage(notice_item.t1 + " " + text_message);
                        }
                        else if (notice_item.t2.indexOf("%") === 0) {
                            //channel broadcast
                            var text_message = NBChatCore.TrimLeadingColon(notice_item.t3);
                            onNoticeChanBroadcast(ParserWx.ExtractNick(notice_item.t0), notice_item.t1, text_message);
                        }
                        else if (notice_item.t1.indexOf("%") < 0) {
                            //server broadcast
                            var text_message = NBChatCore.TrimLeadingColon((IsUndefinedOrNull(notice_item.t3)) ? notice_item.t2 : notice_item.t2 + " " + notice_item.t3);
                            if (bConnectionRegistered)
                                onNoticeServerBroadcast(ParserWx.ExtractNick(notice_item.t0), text_message);
                            else
                                onNoticeServerMessage(notice_item.t1 + " " + text_message); //it tags server name to the message, do not remember why I used this format for server broadcast if connection is not registered. Perhaps it seemed best approach at the time. -HY 21-Oct-2017
                        }
                        else if (!IsUndefinedOrNull(notice_item.t3) && notice_item.t2 === nick_me) {
                            //*WARNING*: This could be a problem if controller switchs to handling multipe channels in single connection.
                            //private notice
                            var text_message = NBChatCore.TrimLeadingColon(notice_item.t3);
                            var nick = ParserWx.ExtractNick(notice_item.t0);
                            onNoticePrivate(nick, notice_item.t1, text_message);
                            if (options_controller_instance.sndTagged !== false)
                                if (taggedUsers[nick] === true)
                                    playTagSnd();
                        }
                        else {
                            //notice message general handler
                            var text_message = NBChatCore.TrimLeadingColon((IsUndefinedOrNull(notice_item.t3)) ? notice_item.t2 : notice_item.t2 + " " + notice_item.t3);
                            var nick = ParserWx.ExtractNick(notice_item.t0);
                            onNotice(nick, notice_item.t1, text_message);
                            if (options_controller_instance.sndTagged !== false)
                                if (taggedUsers[nick] === true)
                                    playTagSnd();
                        }
                    }
                    break;
                case 9 /* Kick */:
                    {
                        var kick_item = parser_item.rval;
                        //server is case-insensitve for nicks, but currently server sends exact nick used on the server so binary comparision will match.
                        //Warning: futhermore, it is difficult reliability do case insensitive unicode nick comparision.
                        if (kick_item.KickedNick === nick_me) {
                            bIsKicked = true;
                            NBChatConnection.Close(null);
                        }
                        onKick(ParserWx.ExtractNick(kick_item.KickerUserStr), kick_item.IrcmChannelName, kick_item.KickedNick, kick_item.KickMessage);
                    }
                    break;
                case 24 /* Privmsg */:
                    {
                        var privmsg_item = parser_item.rval;
                        if (privmsg_item.SenderUserStr[0] === "%") {
                            onChanPrivmsg(privmsg_item.SenderUserStr, privmsg_item.IrcmChannelName, privmsg_item.Message);
                        }
                        else if (IsEmptyString(privmsg_item.Reciver)) {
                            var nick = ParserWx.ExtractNick(privmsg_item.SenderUserStr);
                            onPrivmsg(nick, privmsg_item.IrcmChannelName, privmsg_item.Message);
                            if (options_controller_instance.sndTagged !== false) {
                                if (taggedUsers[nick] === true)
                                    playTagSnd();
                            }
                        }
                        else {
                            onPrivmsgPr(ParserWx.ExtractNick(privmsg_item.SenderUserStr), privmsg_item.IrcmChannelName, privmsg_item.Reciver, privmsg_item.Message);
                        }
                    }
                    break;
                case 33 /* Whisper */:
                    {
                        var whisp_item = parser_item.rval;
                        onWhisper(ParserWx.ExtractNick(whisp_item.SenderUserStr), whisp_item.IrcmChannelName, whisp_item.Reciver, whisp_item.Message);
                    }
                    break;
                case 31 /* Unaway */:
                    {
                        var unaway_item = parser_item.rval;
                        if (unaway_item.IrcmChannelName.length > 0)
                            on821Chan(ParserWx.ExtractNick(unaway_item.SenderUserStr), unaway_item.IrcmChannelName, unaway_item.Message);
                        else
                            on821Pr(ParserWx.ExtractNick(unaway_item.SenderUserStr), unaway_item.Message);
                    }
                    break;
                case 2 /* Away */:
                    {
                        var away_item = parser_item.rval;
                        if (away_item.IrcmChannelName.length > 0)
                            on822Chan(ParserWx.ExtractNick(away_item.SenderUserStr), away_item.IrcmChannelName, away_item.Message);
                        else
                            on822Pr(ParserWx.ExtractNick(away_item.SenderUserStr), away_item.Message);
                    }
                    break;
                case 7 /* Item301 */:
                    {
                        var item_301 = parser_item.rval;
                        on301(item_301.SenderUserStr, item_301.Message);
                    }
                    break;
                case 14 /* Numric302 */:
                    {
                        var item_302 = parser_item.rval;
                        on302(item_302.SenderUserStr, item_302.Message);
                    }
                    break;
                case 18 /* Numric353 */:
                    {
                        var nameslist_353_result = parser_item.rval;
                        if (start_new_nameslist) {
                            start_new_nameslist = false;
                            onClearUserList();
                        }
                        for (var _i = 0, _a = nameslist_353_result.Users; _i < _a.length; _i++) {
                            var user = _a[_i];
                            if (user.nick === nick_me) {
                                user_me = user;
                                //did it here instead of join because ilevel is set in names list.
                                if ((user_me.ilevel & 64 /* Superowner */) === 64 /* Superowner */) {
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
                case 19 /* Numric366 */:
                    {
                        start_new_nameslist = true;
                    }
                    break;
                case 15 /* Num324ChannelModes */:
                    {
                        var r = parser_item.rval;
                        on324(r.IrcmChannelName, r.sNModes, r.s_l_Mode, r.s_k_Mode);
                    }
                    break;
                case 20 /* Num433NickError */:
                    {
                        var r = parser_item.rval;
                        onErrorReplies("433", r.sCurrentNick, r.sNewNick, r.sMessage);
                        if (nick_me.length < 40) {
                            nick_me = nick_me + NBChatCore.RandomNumber(20000);
                        }
                        else {
                            nick_me = nick_me.substr(0, 32);
                            nick_me = nick_me + NBChatCore.RandomNumber(20000);
                        }
                        if (bConnectionRegistered === false)
                            onSetNick(nick_me);
                        IRCSend("NICK " + nick_me);
                        //nick must be set first to authenticate, hence following code is needed in current version of ircwx protocol ircwx v2.
                        if (IsAuthRequestSent)
                            sendAuthInfo();
                        if (!i_have_joined_channel && bConnectionRegistered == true)
                            GotoChannel();
                    }
                    break;
                case 12 /* Nick */:
                    {
                        var r = parser_item.rval;
                        var current_nick = ParserWx.ExtractNick(r.sCurrentUserName);
                        if (current_nick !== nick_me) {
                            onNick(current_nick, r.sNewNick);
                        }
                        else {
                            nick_me = user_me.nick = r.sNewNick;
                            onNickMe(nick_me);
                        }
                    }
                    break;
                case 3 /* AuthUser */:
                    {
                        IsAuthRequestSent = true;
                        sendAuthInfo();
                    }
                    break;
                case 11 /* Mode */:
                    {
                        var r = parser_item.rval;
                        if (r instanceof NBChatCore.UserModeCls) {
                            onUserMode(ParserWx.ExtractNick(r.SenderUserStr), r.ModesOpList, r.IrcmChannelName);
                        }
                        else if (r instanceof NBChatCore.ChanModeCls) {
                            onChanMode(ParserWx.ExtractNick(r.SenderUserStr), r.sModes, r.IrcmChannelName);
                        }
                        else if (r instanceof NBChatCore.ChanModeWParamsCls) {
                            onChanModeWParams(ParserWx.ExtractNick(r.SenderUserStr), r.ModesOpList, r.IrcmChannelName);
                        }
                    }
                    break;
                case 17 /* Numric341InviteConfirmation */:
                    {
                        //Note: at the moment not used.
                    }
                    break;
                case 5 /* Invite */:
                    {
                        var r = parser_item.rval;
                        onInvite(ParserWx.ExtractNick(r.SenderUserStr), r.TargetNick, r.IrcmChannelName);
                        if (options_controller_instance.sndInvite === true && bInviteFlood === false)
                            playInviteSnd();
                    }
                    break;
                case 4 /* Data */:
                    {
                        var r = parser_item.rval;
                        if (r instanceof NBChatCore.DataWhispersCls) {
                            onDataIRC2(ParserWx.ExtractNick(r.SenderUserStr), r.IrcmChannelName, r.TargetNick, r.Tag, r.Message);
                        }
                        else if (r instanceof NBChatCore.DataServerCls) {
                            onDataIRC(r.NickBy, r.DataType, r.Data);
                        }
                    }
                    break;
                case 10 /* Knock */:
                    {
                        var r = parser_item.rval;
                        //Note: onknock function requires full user string.
                        onKnock(r.SenderUserStr, r.IrcmChannelName, r.Message);
                    }
                    break;
                case 25 /* Prop */:
                    {
                        var r = parser_item.rval;
                        var sender_nick = ParserWx.ExtractNick(r.SenderUserStr);
                        if (sender_nick === nick_me && r.PropType.toUpperCase() === "LOCKED" && bInitialPropChange === true) {
                            if (!IsEmptyString(CategoryId))
                                sendToQ("PROP " + ChannelName + " CATEGORY :" + CategoryId);
                            if (!IsEmptyString(Topic))
                                sendToQ("PROP " + ChannelName + " TOPIC :" + Topic);
                            if (!IsEmptyString(Wel))
                                sendToQ("PROP " + ChannelName + " ONJOIN :" + Wel);
                            if (!IsEmptyString(Lang))
                                sendToQ("PROP " + ChannelName + " LANGUAGE :" + Lang);
                            if (!IsEmptyString(Lang2))
                                sendToQ("PROP " + ChannelName + " LANGUAGE2 :" + Lang2);
                            bInitialPropChange = false;
                            //ToDo: add timer to lock again these props
                            //Comment: Is it really needed? --HY 13-Sep-2017
                        }
                        else {
                            onProp(sender_nick, r.IrcmChannelName, r.PropType, r.Message);
                        }
                    }
                    break;
                case 16 /* Numric332ChannelTopic */:
                    {
                        var r = parser_item.rval;
                        on332(r.IrcmChannelName, r.Topic);
                    }
                    break;
                case 1 /* AccessNRelatedReplies */:
                    {
                        var r = parser_item.rval;
                        onAccessNRelatedReplies(r.AccessNumric, r.IrcMsg);
                    }
                    break;
                case 26 /* PropReplies */:
                    {
                        var r = parser_item.rval;
                        onPropReplies(r.PropNumric, r.IrcmChannelName, r.IrcMsg);
                    }
                    break;
                case 32 /* UnhandledIRCwxMessage */:
                    {
                        var r = parser_item.rval;
                        if (isNaN(r.toks[1]) === false) {
                            if (r.toks[1] === "432" && bConnectionRegistered) {
                                if (nick_me[0] !== ">")
                                    break;
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
    function playJoinSnd() {
        JoinSnd.play();
    }
    NBChatController.playJoinSnd = playJoinSnd;
    function playInviteSnd() {
        InviteSnd.play();
    }
    NBChatController.playInviteSnd = playInviteSnd;
    function playKickSnd() {
        KickSnd.play();
    }
    NBChatController.playKickSnd = playKickSnd;
    function playWhispSnd() {
        WhispSnd.play();
    }
    NBChatController.playWhispSnd = playWhispSnd;
    function playTagSnd() {
        TagSnd.play();
    }
    function printError(s) {
        //ToDo: move formatting to css.
        WriteToPresenter("<font color='#FF0000' > Error: " + s + " </font>");
    }
    function reconnectDelayed() {
        ViewMessageReconnectDelayed();
        reconnectionDelayedTicker_.Start();
    }
    function reconnectionDelayedTickerCallbackImpl() {
        Connect();
        return NBTickerFlags.Stop;
    }
    function removeTag(nick) {
        if (taggedUsers[nick])
            delete taggedUsers[nick];
    }
    NBChatController.removeTag = removeTag;
    function SaveChatOptions(options) {
        if (IsUndefinedOrNull(options)) {
            throw new Error("SaveChatOptions function: options paratmeter cannot be null.");
        }
        options_controller_instance = options;
        NBStorage.SaveChatOptions(options_controller_instance);
    }
    NBChatController.SaveChatOptions = SaveChatOptions;
    function SaveGuestuserPass(pw) {
        if (IsEmptyString(AuthTypeCode)) {
            AuthPass = gsAuthPass = pw;
        }
        var e = NBStorage.SaveItem("$GUESTPASS" /* GUESTPASS */, pw, false);
        if (e != null) {
            //ToDo: handle error.
        }
    }
    NBChatController.SaveGuestuserPass = SaveGuestuserPass;
    function SaveSingleOption(option_name, option_val) {
        switch (option_name) {
            case "awaymsg":
                if (typeof (option_val) === 'string') {
                    options_controller_instance.sAwayMsg = option_val;
                    NBStorage.SaveChatOptions(options_controller_instance);
                }
                else {
                    console.log("SaveSingleOption:: error: option_val should be string for away message.");
                }
                break;
            default:
                console.log("SaveSingleOption:: error: this option name is not implemented.");
                break;
        }
    }
    NBChatController.SaveSingleOption = SaveSingleOption;
    function sendAuthInfo() {
        if (AuthTypeCode === "T") {
            IRCSend("UTICKET " + AuthPass);
        }
        else if (AuthTypeCode === "T2") {
            IRCSend("UTICKET2 " + AuthPass);
        }
        else {
            IRCSend("LOGIN guest " + AuthPass);
        }
    }
    function sendToChan(chan, msg) {
        IRCSend("PRIVMSG " + chan + " :" + msg);
    }
    function sendToQ(s) {
        IRCSend(s);
    }
    function sendToServer(s) {
        NBChatConnection.Send(s);
    }
    NBChatController.sendToServer = sendToServer;
    function sendToServerQue(s) {
        //Note: everything is send to queue now, this only for legacy code support.
        NBChatConnection.Send(s);
    }
    NBChatController.sendToServerQue = sendToServerQue;
    function SetExtraOptions(extra_options) {
        NBStorage.SetExtraOptions(extra_options);
    }
    NBChatController.SetExtraOptions = SetExtraOptions;
    function SetChanProps() {
        if (IsChanProps() === true && bInitialPropChange === true) {
            if (!IsEmptyString(CategoryId))
                sendToQ("PROP " + ChannelName + " UNLOCK :CATEGORY");
            if (!IsEmptyString(Topic))
                sendToQ("PROP " + ChannelName + " UNLOCK :TOPIC");
            if (!IsEmptyString(Wel))
                sendToQ("PROP " + ChannelName + " UNLOCK :ONJOIN");
            if (!IsEmptyString(Lang))
                sendToQ("PROP " + ChannelName + " UNLOCK :LANGUAGE");
            if (!IsEmptyString(Lang2))
                sendToQ("PROP " + ChannelName + " UNLOCK :LANGUAGE2");
        }
        else {
            bInitialPropChange = false;
        }
    }
    NBChatController.SetChanProps = SetChanProps;
    function SetNick(nick) {
        nick_me = nick;
    }
    NBChatController.SetNick = SetNick;
    function unhandledCommand(ircmsg) {
        WriteToPresenter("Unhandled Command:" + ircmsg);
    }
    function Version() {
        if (NBChatConnection.SocketType != null) {
            return sVersion + "(" + NBChatConnection.SocketType() + ")";
        }
        else {
            return sVersion + "(socket type is n/a).";
        }
    }
    NBChatController.Version = Version;
    function WriteToPresenter(s) {
        fnWriteToPresenter(s);
    }
})(NBChatController || (NBChatController = {}));
//# sourceMappingURL=nbchat_controller.js.map