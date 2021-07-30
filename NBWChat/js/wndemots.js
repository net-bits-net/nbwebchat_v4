function insertEmotCode(sCode) {
    //alert(sCode);
    window.parent.document.getElementById("txSend").value += sCode;
}

function loadEmoticons() {
    //alert('loadEmoticons()');
    var arrEmots = window.parent.colRepl;
    var sEmotsDir = 'images/emots/'; //window.parent.sEmotsDir; //ToDo: ref changed here
    var imgsrc = '';
    //document.body.innerHTML = '';

    var tmpArray = new Array();
    var taCounter = 0;
    var intEmotsLoad = 0;

    for (eico in arrEmots) {
        if (arrEmots[eico] != imgsrc) {
            imgsrc = arrEmots[eico];

            var taobj = new Object();
            taobj.eico = eico;
            taobj.imgsrc = imgsrc;

            tmpArray.push(taobj);
            taCounter++;
        }
    }

    taCounter = 0;
    if (tmpArray.length > 0) intEmotsLoad = setInterval(fnLoadEmots, 50);

    function fnLoadEmots() {
        for (var i = 0; i < 10; i++) {
            if (taCounter >= tmpArray.length || taCounter >= 300) {
                clearInterval(intEmotsLoad);
                delete tmpArray;
                return;
            }
            var n = tmpArray[taCounter].imgsrc.indexOf("doline");
            if (n >= 0) { 
            	if (tmpArray[taCounter].imgsrc == "doline_smile") { $('#renderbox').append('<a name="smiley"></a><div style="color:#666;font-size:12px;text-align:center;margin:8px 0 2px 0;">Smiley Emoticons</div>'); }
            	if (tmpArray[taCounter].imgsrc == "doline_animal") { $('#renderbox').append('<a name="animal"></a><div style="color:#666;font-size:12px;text-align:center;margin:8px 0 2px 0;">Animal Emoticons</div>'); }
   				if (tmpArray[taCounter].imgsrc == "doline_food") { $('#renderbox').append('<a name="food"></a><div style="color:#666;font-size:12px;text-align:center;margin:8px 0 2px 0;">Food and Drink Emoticons</div>'); }
				if (tmpArray[taCounter].imgsrc == "doline_misc") { $('#renderbox').append('<a name="misc"></a><div style="color:#666;font-size:12px;text-align:center;margin:8px 0 2px 0;">Misc Emoticons</div>'); }
				if (tmpArray[taCounter].imgsrc == "doline_new") { $('#renderbox').append('<a name="new"></a><div style="color:#666;font-size:12px;text-align:center;margin:8px 0 2px 0;">New Emoticons</div>'); }
				if (tmpArray[taCounter].imgsrc == "doline_holiday") { $('#renderbox').append('<a name="holiday"></a><div style="color:#666;font-size:12px;text-align:center;margin:8px 0 2px 0;">Holiday Emoticons</div>'); }
	
				$('#renderbox').append('<div style="margin-bottom:8px 0;height:1px;border-bottom:1px solid #CCC;"></div>');
            }
            else {
			$('#renderbox').append('<img style="padding:5px;" border="0" src="' + sEmotsDir + tmpArray[taCounter].imgsrc + '" onclick="insertEmotCode(\'' + tmpArray[taCounter].eico.replace("'", "\\'") + '\');" style="cursor:pointer;" />');
					//document.body.innerHTML += '';
            }	
			taCounter++;
        }
    }
}
