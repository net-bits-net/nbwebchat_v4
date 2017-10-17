function fnCancelaccess()
{
    window.parent.$('#accessContainer').fadeOut();
}
function getAccess() {
	var arRNb = window.parent.m_sChan;
	window.parent.NBChatController.sendToServer("access " + arRNb + " list");
}
$(document).ready(function(){	
	var arRN = $("#txChan",parent.document).text();
	$('#arname').text(arRN);
	var cRNb = window.parent.m_sChan;
	getAccess();
	$(document).on('click', '#reloadaccess', function(event){
		$("#accessBody").empty();
		getAccess();
		return false;
	});
	$(document).on('click', '#showaddaccess', function(event){
		$("#reloadaccess").fadeOut('fast');
		$("#showaddaccess").fadeOut('fast', function() {			
			$("#showlistaccess").fadeIn('fast');			
			$("#accesslistholder").fadeOut('fast', function() {
				$("#accesslistadder").fadeIn('fast');
			});
		});
		return false;
	});
	$(document).on('click', '#showlistaccess', function(event){
		$("#showlistaccess").fadeOut('fast', function() {
			$("#reloadaccess").fadeIn('fast');
			$("#showaddaccess").fadeIn('fast');			
			$("#accesslistadder").fadeOut('fast', function() {
				$("#accesslistholder").fadeIn('fast');
			});
		});
		return false;
	});
	$(document).on('click', '#submitaddaccess', function(event){
		var addaccessType = $("#a-type").val();
		var addaccessTime = $("#a-time").val();
		var addaccessEntry = $("#a-entry").val();
		var addaccessNotes = $("#a-notes").val();
		if (addaccessEntry == '') { alert('Please fill in the entry first.'); return false; }
		window.parent.NBChatController.sendToServer("ACCESS " + cRNb + " ADD " + addaccessType + " " + addaccessEntry + " " + addaccessTime + " :" + addaccessNotes);
		$("#a-type").val('DENY');
		$("#a-time").val('1440');
		$("#a-entry").val('');
		$("#a-notes").val('');
		$("#accessBody").empty();
		$("#showlistaccess").fadeOut('fast', function() {
			$("#reloadaccess").fadeIn('fast');
			$("#showaddaccess").fadeIn('fast');			
			$("#accesslistadder").fadeOut('fast', function() {
				$("#accesslistholder").fadeIn('fast', function() {
					
				});
			});
		});		
		return false;
	});
	
	$(document).on('click', '[id^="accessdelete_"]', function(event){
		var getid = $(this).attr("id").split("_");
		var id = getid[1];
		var answer = confirm("Are you sure you want to delete this entry?");
		if (answer) {
			var atype = $("#accesstype_" + id).text();
			var amask = $("#accessmask_" + id).text();
			$("#accessholder_" + id).fadeOut('', function(){
				$("#accessholder_" + id).empty();
				window.parent.NBChatController.sendToServer("ACCESS " + cRNb + " DELETE " + atype + " " + amask);	
			});
		};	
		return false;
	});
	
	
	
	
	
});
