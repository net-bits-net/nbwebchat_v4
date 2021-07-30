function fnCancelprops()
{
    window.parent.$('#propsContainer').fadeOut();
}
function getProps() {
	var arRNb = window.parent.m_sChan;
	window.parent.NBChatController.sendToServer("prop " + arRNb + " *");
}
function doProps(pstr) {
	var arRNb = window.parent.m_sChan;
	window.parent.NBChatController.sendToServer("prop " + arRNb + " " + pstr);
}
function tellProps(ptstr) {
	var arRNb = window.parent.m_sChan;
	window.parent.fnAppendText("<span class='msgfrmtparent'><span class='modechange'>" + ptstr + "</span></span>");
}
function isEmpty(str) {
  return str.replace(/^\s+|\s+$/g, '').length == 0;
}
function fnCancel() {
	window.parent.closeTopTab('props');
	window.parent.resetToChatPane();
	//window.parent.$('#optionsPane').attr('src', sFUIDIR + '/iframes/blank.htm')
}
$(document).ready(function(){
	var arRN = $("#txChan",parent.document).text();
	$('#arname').text(arRN);
	var cRNb = window.parent.m_sChan;
	
	$(document).on('change', '#topiclock', function(event){
		if ($(this).is(':checked')) { doProps("LOCK TOPIC"); $("#topicset").prop("disabled", true); $("#topicbox").prop("disabled", true); tellProps("TOPIC property now locked! You must unlock to edit."); }
		else { doProps("UNLOCK TOPIC"); $("#topicset").prop("disabled", false); $("#topicbox").prop("disabled", false); tellProps("TOPIC property now unlocked! You can edit this property."); }
	});
	$(document).on('change', '#onjoinlock', function(event){
		if ($(this).is(':checked')) { doProps("LOCK ONJOIN"); $("#onjoinset").prop("disabled", true); $("#onjoinbox").prop("disabled", true); tellProps("ONJOIN property now locked! You must unlock to edit."); }
		else { doProps("UNLOCK ONJOIN"); $("#onjoinset").prop("disabled", false); $("#onjoinbox").prop("disabled", false); tellProps("ONJOIN property now unlocked! You can edit this property."); }
	});
	$(document).on('change', '#ownerkeylock', function(event){
		if ($(this).is(':checked')) { doProps("LOCK OWNERKEY"); $("#ownerkeyset").prop("disabled", true); $("#ownerkeybox").prop("disabled", true); tellProps("OWNERKEY property now locked! You must unlock to edit."); }
		else { doProps("UNLOCK OWNERKEY"); $("#ownerkeyset").prop("disabled", false); $("#ownerkeybox").prop("disabled", false); tellProps("OWNERKEY property now unlocked! You can edit this property."); }
	});
	$(document).on('change', '#hostkeylock', function(event){
		if ($(this).is(':checked')) { doProps("LOCK HOSTKEY"); $("#hostkeyset").prop("disabled", true); $("#hostkeybox").prop("disabled", true); tellProps("HOSTKEY property now locked! You must unlock to edit."); }
		else { doProps("UNLOCK HOSTKEY"); $("#hostkeyset").prop("disabled", false); $("#hostkeybox").prop("disabled", false); tellProps("HOSTKEY property now unlocked! You can edit this property."); }
	});
	$(document).on('change', '#categorylock', function(event){
		if ($(this).is(':checked')) { doProps("LOCK CATEGORY"); $("#categoryset").prop("disabled", true); $("#categoryselect").prop("disabled", true); tellProps("CATEGORY property now locked! You must unlock to edit."); }
		else { doProps("UNLOCK CATEGORY"); $("#categoryset").prop("disabled", false); $("#categoryselect").prop("disabled", false); tellProps("CATEGORY property now unlocked! You can edit this property."); }
	});
	$(document).on('change', '#languagelock', function(event){
		if ($(this).is(':checked')) { doProps("LOCK LANGUAGE"); $("#languageset").prop("disabled", true); $("#languageselect").prop("disabled", true); tellProps("LANGUAGE property now locked! You must unlock to edit."); }
		else { doProps("UNLOCK LANGUAGE"); $("#languageset").prop("disabled", false); $("#languageselect").prop("disabled", false); tellProps("LANGUAGE property now unlocked! You can edit this property."); }
	});
	$(document).on('click', '#topicset', function(event){
		doProps("TOPIC :" + $("#topicbox").val());
	});
	$(document).on('click', '#onjoinset', function(event){
		doProps("ONJOIN :" + $("#onjoinbox").val());
	});
	$(document).on('click', '#ownerkeyset', function(event){
		var okey = $("#ownerkeybox").val();
		doProps("OWNERKEY :" + okey);
		if (isEmpty(okey)) { okey = null; }
		tellProps("OWNERKEY has been set to " + okey);
	});
	$(document).on('click', '#hostkeyset', function(event){
		var hkey = $("#hostkeybox").val();
		doProps("HOSTKEY :" + hkey);
		if (isEmpty(hkey)) { hkey = null; }
		tellProps("HOSTKEY has been set to " + hkey);
	});
	$(document).on('click', '#categoryset', function(event){
		var pcat = $("#categoryselect").val();
		doProps("CATEGORY :" + pcat);
		tellProps("CATEGORY has been set to " + pcat);
	});
	$(document).on('click', '#languageset', function(event){
		var plang = $("#languageselect").val();
		doProps("LANGUAGE :" + plang);
		tellProps("Language has been set to " + plang);
	});
	$.getJSON("../../json.ashx?channelscategories", function(result){
  		var arrayLength = result.length;
		for (var i = 0; i < arrayLength; i++) {
			$('#categoryselect').append('<option value="' + result[i]["CategoryId"].toUpperCase() + '">' + result[i]["CategoryDisplayName"] + '</option>');
		}
	    getProps();
 	});
 	
});
