function fnAllowBackSpace(e) {
    if (isIE){
        if (e.srcElement.tagName.toUpperCase() == 'INPUT') return true;
    }
    else if (isFF) {
        if (e.target.nodeName.toUpperCase() == 'INPUT') return true;
    }
    return false;
}
function fnKeyInterupt(e) {
	if (e == null) e = window.event;
    if (e.keyCode == 8 && fnAllowBackSpace(e) !=  true)	{
	    e.cancelBubble = true;
        e.returnValue = false;
		return false;
	}	
	if (e.ctrlKey == true && e.shiftKey == true) {
	    fnCheckKey(e);
	}
}
if (typeof(window.event) == 'undefined') {
	document.onkeypress = fnKeyInterupt;
}
else {
    document.onkeydown = fnKeyInterupt;
}

