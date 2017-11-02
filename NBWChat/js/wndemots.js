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
            //document.body.innerHTML += '&nbsp;<img border="0" src="' + sEmotsDir + tmpArray[taCounter].imgsrc + '" onclick="insertEmotCode(\'' + tmpArray[taCounter].eico.replace("'", "\\'") + '\');" style="cursor:pointer;" />';
			$('#renderbox').append('<img style="padding:5px;" border="0" src="' + sEmotsDir + tmpArray[taCounter].imgsrc + '" onclick="insertEmotCode(\'' + tmpArray[taCounter].eico.replace("'", "\\'") + '\');" style="cursor:pointer;" />');
			taCounter++;
        }
    }
}
