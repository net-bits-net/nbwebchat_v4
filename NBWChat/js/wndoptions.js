var ptxSample = null;
var pselFont = null, pselColor = null, pchBold = null, pchItalic = null;
var pselFontSize = null, pchCorpText = null, pchEmotsOff = null, pchbTextFrmtOff = null;
var pchShowArrivals = true, pchShowStatusChg = true, pchShowDeparts = true;
var pchSndArrival = true, pchSndKick = true, pchSndTagged = true, pchSndInvite = true, pchSndWhisp = true, pchConfirmOnLeaveOff = false;
var oEventsNotifySnd = null;
var oOPtions = new Object();
var cie = (function () {

	var undef,
		v = 3,
		div = document.createElement('div'),
		all = div.getElementsByTagName('i');

	while (
		div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
		all[0]
	);

	return v > 4 ? v : undef;

}());
function getHexFromRGB(rgb) {
	try {
		var rergb = /\d{1,3}/g;
		var retvals = rgb.match(rergb);

		if (retvals.length == 3) {
			var r = parseInt(retvals[0], 10).toString(16);;
			var g = parseInt(retvals[1], 10).toString(16);
			var b = parseInt(retvals[2], 10).toString(16);

			if (r.length == 1) r = '0' + r;
			if (g.length == 1) g = '0' + g;
			if (b.length == 1) b = '0' + b;

			return "#" + r + g + b;
		}
	}
	catch (e) {
	}

	return "#000000";
}
function selectSelColor(psel, color) {
	/*if (window.parent.isFF || window.parent.isWK) selectSelItem(psel, getHexFromRGB(color));
	else selectSelItem(psel, color);*/
	if (window.parent.isFF || window.parent.isWK) {
		pselColor.value = getHexFromRGB(color);
		var cstr = getHexFromRGB(color);
		var cres = cstr.replace("#", "");
		pselColor.color.fromString(cres);
	}
	else {
		pselColor.value = color;
		var cstr = getHexFromRGB(color);
		var cres = cstr.replace("#", "");
		if (cie < 9) { }
		else {
			pselColor.color.fromString(cres);
		}

	}
}
function selectSelItem(psel, val, remValSingleQuote) {

	if (remValSingleQuote) {
		val = val.toString().replace(/^\x27|\x27$/g, '');
		val = val.replace(/"/g, "");
	}
	for (var i = 0; i < psel.options.length; i++) {
		if (psel.options[i].value.toLowerCase() == val.toLowerCase()) {
			psel.selectedIndex = i;
			return;
		}
	}
}
function fnDecodeFrmtCode(str) {
	try {
		str = str.replace('ff:', 'font-family:');
		str = str.replace('co:', 'color:');
		str = str.replace('b;', 'font-weight:bold;');
		str = str.replace('i;', 'font-style:italic;');
	}
	catch (ex) {
		return "";
	}

	return str;
}
function fnOnLoad() {
	ptxSample = document.getElementById('txSample');
	pselFont = document.getElementById('selFont');
	pselColor = document.getElementById('selColor');
	pchBold = document.getElementById('chBold');
	pchItalic = document.getElementById('chItalic');

	pselFontSize = document.getElementById('selFontSize');
	pchCorpText = document.getElementById('chCorpText');
	pchEmotsOff = document.getElementById('chEmotsOff');
	pchbTextFrmtOff = document.getElementById('chbTextFrmtOff');

	pchWhispOff = document.getElementById('chWhispOff');
	//pchTimeStamp = document.getElementById('chTimeStamp');
	pchInvite = document.getElementById('chInvite');
	pchPicons = document.getElementById('chPicons');
	pchUnotice = document.getElementById('chUnotice');

	pchShowArrivals = document.getElementById('chShowArrivals');
	pchShowStatusChg = document.getElementById('chShowStatusChg');
	pchShowDeparts = document.getElementById('chShowDeparts');

	pchSndArrival = document.getElementById('chSndArrival');
	pchSndKick = document.getElementById('chSndKick');
	pchSndTagged = document.getElementById('chSndTagged');
	pchSndInvite = document.getElementById('chSndInvite');
	pchSndWhisp = document.getElementById('chSndWhisp');
	pchConfirmOnLeaveOff = document.getElementById('chConfirmOnLeaveOff');

	ptxSample.style.cssText = fnDecodeFrmtCode(window.parent.sDspFrmt);
	if (window.parent.isWK == true) selectSelItem(pselFont, ptxSample.style.fontFamily, true);
	else selectSelItem(pselFont, ptxSample.style.fontFamily, false);
	selectSelColor(pselColor, ptxSample.style.color);
	pchBold.checked = (ptxSample.style.fontWeight == 'bold') ? true : false;
	pchItalic.checked = (ptxSample.style.fontStyle == 'italic') ? true : false;

	if (window.parent._pcpbody.style.fontSize.length > 0) pselFontSize.value = window.parent._pcpbody.style.fontSize;
	pchCorpText.checked = window.parent.bCorpText;
	pchEmotsOff.checked = window.parent.bEmotsOff;
	pchbTextFrmtOff.checked = window.parent.bTextFrmtOff;

	pchWhispOff.checked = window.parent.bWhispOff;
	//pchTimeStamp.checked = window.parent.bTimeStampOn;
	pchInvite.checked = window.parent.bInviteOn;
	pchPicons.checked = window.parent.bPiconsOn;
	pchUnotice.checked = window.parent.bUnoticeOn;
	pchShowArrivals.checked = window.parent.bDspArrivals;
	pchShowStatusChg.checked = window.parent.bDspStatusChg;
	pchShowDeparts.checked = window.parent.bDspDeparts;

	pchSndArrival.checked = window.parent.bSndArrival;
	pchSndKick.checked = window.parent.bSndKick;
	pchSndTagged.checked = window.parent.bSndTagged;
	pchSndInvite.checked = window.parent.bSndInvites;
	pchSndWhisp.checked = window.parent.bSndWhisp;
	pchConfirmOnLeaveOff.checked = window.parent.bConfirmOnLeaveOff;

	//
	oOPtions.color = pselColor.value;
	oOPtions.font = pselFont.value;
	oOPtions.bold = pchBold.checked;
	oOPtions.italic = pchItalic.checked;

	oOPtions.fontSize = pselFontSize.value;
	oOPtions.corpText = pchCorpText.checked;
	oOPtions.bEmotsOff = pchEmotsOff.checked;
	oOPtions.bTextFrmtOff = pchbTextFrmtOff.checked;
	oOPtions.bWhispOff = pchWhispOff.checked;
	//oOPtions.bTimeStampOn = pchTimeStamp.checked;
	oOPtions.bInviteOn = pchInvite.checked;
	oOPtions.bPiconsOn = pchPicons.checked;
	oOPtions.bUnoticeOn = pchUnotice.checked;

	oOPtions.showArrivals = pchShowArrivals.checked;
	oOPtions.showStatusChg = pchShowStatusChg.checked;
	oOPtions.showDeparts = pchShowDeparts.checked;

	oOPtions.sndArrival = pchSndArrival.checked;
	oOPtions.sndKick = pchSndKick.checked;
	oOPtions.sndTagged = pchSndTagged.checked;
	oOPtions.sndInvite = pchSndInvite.checked;
	oOPtions.sndWhisp = pchSndWhisp.checked;
	oOPtions.bConfirmOnLeaveOff = pchConfirmOnLeaveOff.checked;

	if (window.parent.bYoutubeUrl >= 1) { oOPtions.bYoutubeUrl = window.parent.bYoutubeUrl }
	else { oOPtions.bYoutubeUrl = 1; }
	if (oOPtions.bYoutubeUrl >= 1) { var selYToption = oOPtions.bYoutubeUrl - 1; }
	document.getElementById("utubeurl").selectedIndex = selYToption;
	if (window.parent.bUrlOn) { oOPtions.bUrlOn = true; document.getElementById("urlmanageoff").checked = true; document.getElementById("urlm").disabled = false; document.getElementById("utubeurl").disabled = true; }
	else { oOPtions.bUrlOn = false; document.getElementById("urlmanageon").checked = true; document.getElementById("urlm").disabled = true; document.getElementById("utubeurl").disabled = false; }
	/*
	if (window.parent.bSafeUrlCheckOn) { oOPtions.bSafeUrlCheckOn = true; document.getElementById("urlm").selectedIndex = 1; }
	else {
	*/
	oOPtions.bSafeUrlCheckOn = false; document.getElementById("urlm").selectedIndex = 0;


}

function fnOnTextColorChange() {
	ptxSample.style.color = pselColor.value;
	oOPtions.color = pselColor.value;
}
function fnOnFontFamilyChange() {
	ptxSample.style.fontFamily = pselFont.value;
	oOPtions.font = pselFont.value;
}
function fnOnBoldCheckChange() {
	ptxSample.style.fontWeight = (pchBold.checked) ? 'bold' : 'normal';
	oOPtions.bold = pchBold.checked;
}
function fnOnItalicCheckChange() {
	ptxSample.style.fontStyle = (pchItalic.checked) ? 'italic' : 'normal';
	oOPtions.italic = pchItalic.checked;
}

//Display options
function fnOnFontSizeChange() {
	oOPtions.fontSize = pselFontSize.value;
}
function fnOnCropCheckChange() {
	oOPtions.corpText = pchCorpText.checked;
}

function fnOnEmotsOffChange() {
	oOPtions.bEmotsOff = pchEmotsOff.checked;
}

function fnOnbTextFrmtOffChange() {
	oOPtions.bTextFrmtOff = pchbTextFrmtOff.checked;
}

function fnOnWhispOffChange() {
	oOPtions.bWhispOff = pchWhispOff.checked;
}

//function fnOnbTimeStampChange() {
//	oOPtions.bTimeStampOn = pchTimeStamp.checked;
//}
// Update Aug 12 2015 Extra Settings
function fnOnbInviteChange() {
	oOPtions.bInviteOn = pchInvite.checked;
	if (pchInvite.checked == true) { pchSndInvite.checked = false; }
	else { pchSndInvite.checked = true; }
	oOPtions.sndInvite = pchSndInvite.checked;

}
function fnOnbPiconsChange() {
	oOPtions.bPiconsOn = pchPicons.checked;

}
function fnOnbUnoticeChange() {
	oOPtions.bUnoticeOn = pchUnotice.checked;

}
//Events options
function fnOnChShowArrivals() {
	oOPtions.showArrivals = pchShowArrivals.checked;

	if (pchShowArrivals.checked == false) pchSndArrival.checked = false;
}
function fnOnChShowStatusChange() {
	oOPtions.showStatusChg = pchShowStatusChg.checked;
}
function fnOnChShowDepartures() {
	oOPtions.showDeparts = pchShowDeparts.checked;
}

function fnOnChSndArrivals() {
	oOPtions.sndArrival = pchSndArrival.checked;
}
function fnOnChSndKick() {
	oOPtions.sndKick = pchSndKick.checked;
}
function fnOnChSndTagged() {
	oOPtions.sndTagged = pchSndTagged.checked;
}
function fnOnChSndInvite() {
	oOPtions.sndInvite = pchSndInvite.checked;
}
function fnOnChSndWhisp() {
	oOPtions.sndWhisp = pchSndWhisp.checked;
}
function fnOnLeavePage() {
	oOPtions.bConfirmOnLeaveOff = pchConfirmOnLeaveOff.checked;
}
function fnOnUrlOn() {
	oOPtions.bUrlOn = false;
	document.getElementById("urlm").disabled = true;
	document.getElementById("utubeurl").disabled = false;
}
function fnOnUrlOff() {
	oOPtions.bUrlOn = true;
	document.getElementById("urlm").disabled = false;
	document.getElementById("utubeurl").disabled = true;
}
function fnOnUrlManageChange() {
	var select = document.getElementById("urlm");
	var selectedString = select.options[select.selectedIndex].value;
	if (selectedString == 2) { oOPtions.bSafeUrlCheckOn = true; }
	else { oOPtions.bSafeUrlCheckOn = false; }
	oOPtions.bSafeUrlCheckOn = false;
}
function fnOnUtubeManageChange() {
	var select = document.getElementById("utubeurl");
	var selectedString = select.options[select.selectedIndex].value;
	if (selectedString == 2) { oOPtions.bYoutubeUrl = 2; }
	else if (selectedString == 3) { oOPtions.bYoutubeUrl = 3; }
	else { oOPtions.bYoutubeUrl = 1; }
}
//
function fnSave() {
	window.parent.saveOptions(oOPtions);
	window.parent.resetToChatPane();
	//window.parent.$('#optionsContainer').fadeOut();
	//window.parent.$('#optionsPane').attr('src', sFUIDIR + '/iframes/blank.htm');
}
function fnSaveClose() {
	window.parent.saveOptions(oOPtions);
	window.parent.resetToChatPane();	
	window.parent.closeTopTab('options');
	window.parent.resetToChatPane();
}
function fnCancel() {
	window.parent.closeTopTab('options');
	window.parent.resetToChatPane();
	//window.parent.$('#optionsPane').attr('src', sFUIDIR + '/iframes/blank.htm')
}

function fnReset() {
}
