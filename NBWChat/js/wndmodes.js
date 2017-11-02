function fnCancelmodes()
{
	window.parent.$('#modesContainer').fadeOut();
}
function getModes() {
	var cModes = window.parent.Modes[0].replace("null","");	
	var cModes = cModes + window.parent.Modes[1] + window.parent.Modes[2];
	var cModesShow = cModes + " " + window.parent.Modes[3] + " " + window.parent.Modes[4] ;
	var rLimit = window.parent.Modes[3].trim();
	var rKey = window.parent.Modes[4].trim();	
	$('#cmodes').text("+" + cModesShow);
	if (cModes.indexOf("i") >= 0) { $( "#invitebox" ).prop( "checked", true ); }
	else { $( "#invitebox" ).prop( "checked", false ); }
	if (cModes.indexOf("f") >= 0) { $( "#filterbox" ).prop( "checked", true ); }
	else { $( "#filterbox" ).prop( "checked", false ); }
	if (cModes.indexOf("m") >= 0) { $( "#moderatedbox" ).prop( "checked", true ); }
	else { $( "#moderatedbox" ).prop( "checked", false ); }
	if (cModes.indexOf("p") >= 0) { $( "#privatebox" ).prop( "checked", true ); }
	else { $( "#privatebox" ).prop( "checked", false ); }
	if (cModes.indexOf("t") >= 0) { $( "#topicbox" ).prop( "checked", true ); }
	else { $( "#topicbox" ).prop( "checked", false ); }
	if (cModes.indexOf("u") >= 0) { $( "#knockbox" ).prop( "checked", true ); }
	else { $( "#knockbox" ).prop( "checked", false ); }
	if (cModes.indexOf("w") >= 0) { $( "#whispersbox" ).prop( "checked", true ); }
	else { $( "#whispersbox" ).prop( "checked", false ); }
	if (cModes.indexOf("P") >= 0) { $( "#floodbox" ).prop( "checked", true ); }
	else { $( "#floodbox" ).prop( "checked", false ); }
	if (cModes.indexOf("W") >= 0) { $( "#whisperguestbox" ).prop( "checked", true ); }
	else { $( "#whisperguestbox" ).prop( "checked", false ); }	
	$("#rlimitnum").val(rLimit);
	$("#rkey").val(rKey);
	$("#modeboxes :input").prop("disabled", false);
}
$(document).ready(function(){
	var cRN = $("#txChan",parent.document).text();
	var cRNb = window.parent.m_sChan;
	$('#crname').text(cRN);	
	$("#modeboxes :input").prop("disabled", false);
	getModes();	
	$(document).on('change', '#invitebox', function(event){
		if ($(this).is(':checked')) { window.parent.NBChatController.sendToServer("mode " + cRNb + " +i");  }
		else { window.parent.NBChatController.sendToServer("mode " + cRNb + " -i"); }
		$("#modeboxes :input").prop("disabled", true);
		setTimeout(getModes, 1000);
	});
	$(document).on('change', '#filterbox', function(event){
		if ($(this).is(':checked')) { window.parent.NBChatController.sendToServer("mode " + cRNb + " +f");  }
		else { window.parent.NBChatController.sendToServer("mode " + cRNb + " -f"); }
		$("#modeboxes :input").prop("disabled", true);
		setTimeout(getModes, 1000);
	});
	$(document).on('change', '#moderatedbox', function(event){
		if ($(this).is(':checked')) { window.parent.NBChatController.sendToServer("mode " + cRNb + " +m");  }
		else { window.parent.NBChatController.sendToServer("mode " + cRNb + " -m"); }
		$("#modeboxes :input").prop("disabled", true);
		setTimeout(getModes, 1000);
	});
	$(document).on('change', '#privatebox', function(event){
		if ($(this).is(':checked')) { window.parent.NBChatController.sendToServer("mode " + cRNb + " +p");  }
		else { window.parent.NBChatController.sendToServer("mode " + cRNb + " -p"); }
		$("#modeboxes :input").prop("disabled", true);
		setTimeout(getModes, 1000);
	});
	$(document).on('change', '#topicbox', function(event){
		if ($(this).is(':checked')) { window.parent.NBChatController.sendToServer("mode " + cRNb + " +t");  }
		else { window.parent.NBChatController.sendToServer("mode " + cRNb + " -t"); }
		$("#modeboxes :input").prop("disabled", true);
		setTimeout(getModes, 1000);
	});
	$(document).on('change', '#knockbox', function(event){
		if ($(this).is(':checked')) { window.parent.NBChatController.sendToServer("mode " + cRNb + " +u");  }
		else { window.parent.NBChatController.sendToServer("mode " + cRNb + " -u"); }
		$("#modeboxes :input").prop("disabled", true);
		setTimeout(getModes, 1000);
	});
	$(document).on('change', '#whispersbox', function(event){
		if ($(this).is(':checked')) { window.parent.NBChatController.sendToServer("mode " + cRNb + " +w");  }
		else { window.parent.NBChatController.sendToServer("mode " + cRNb + " -w"); }
		$("#modeboxes :input").prop("disabled", true);
		setTimeout(getModes, 1000);
	});
	$(document).on('change', '#floodbox', function(event){
		if ($(this).is(':checked')) { window.parent.NBChatController.sendToServer("mode " + cRNb + " +P");  }
		else { window.parent.NBChatController.sendToServer("mode " + cRNb + " -P"); }
		$("#modeboxes :input").prop("disabled", true);
		setTimeout(getModes, 1000);
	});
	$(document).on('change', '#whisperguestbox', function(event){
		if ($(this).is(':checked')) { window.parent.NBChatController.sendToServer("mode " + cRNb + " +W");  }
		else { window.parent.NBChatController.sendToServer("mode " + cRNb + " -W"); }
		$("#modeboxes :input").prop("disabled", true);
		setTimeout(getModes, 1000);
	});
	$(document).on('click', '#setlimit', function(event){
		var lnum = $('#rlimitnum').val();
		if (lnum != '') { 
			window.parent.NBChatController.sendToServer("mode " + cRNb + " +l " + lnum); 
			$("#modeboxes :input").prop("disabled", true);
			setTimeout(getModes, 1000);
		}
	});
	$(document).on('click', '#setkey', function(event){
		var rkey = $('#rkey').val();
		if (rkey != '') { 
			window.parent.NBChatController.sendToServer("mode " + cRNb + " +k " + rkey); 
			$("#modeboxes :input").prop("disabled", true);
			setTimeout(getModes, 1000);
		}
	});
	$(document).on('click', '#unsetkey', function(event){
		var rkey = $('#rkey').val();
		if (rkey != '') { 
			window.parent.NBChatController.sendToServer("mode " + cRNb + " -k " + rkey); 
			$("#modeboxes :input").prop("disabled", true);
			setTimeout(getModes, 1000);
		}
	});
});	
