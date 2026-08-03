function printAlertSuccess(msg){
    var div = document.createElement("div");
    div.className = "alert alert-dismissible alert-success notice responsive_font_size";
    div.innerHTML = '<i class="icon-thumbs-up"></i><strong>Congratulazioni!</strong> ' + msg + '</div><button type="button" class="btn-close btn-sm" data-bs-dismiss="alert" aria-hidden="true"></button>';
    document.body.appendChild(div);
}

function printAlertInfo(msg){
    var div = document.createElement("div");
    div.className = "alert alert-dismissible alert-info notice responsive_font_size";
    div.innerHTML = '<i class="icon-warning-sign"></i><strong>Informazioni importanti!</strong> ' + msg + '</div><button type="button" class="btn-close btn-sm" data-bs-dismiss="alert" aria-hidden="true"></button>';
    document.body.appendChild(div);
}

function printAlertWarning(msg){
    var div = document.createElement("div");
    div.className = "alert alert-dismissible alert-warning notice responsive_font_size";
    div.innerHTML = '<i class="icon-warning-sign"></i><strong>Attenzione!!!</strong> ' + msg + '</div><button type="button" class="btn-close btn-sm" data-bs-dismiss="alert" aria-hidden="true"></button>';
    document.body.appendChild(div);
}

function printAlertDanger(msg){
    var div = document.createElement("div");
    div.className = "alert alert-dismissible alert-danger notice responsive_font_size";
    div.innerHTML = '<i class="icon-remove"></i><strong>Attenzione!!!</strong> ' + msg + '</div><button type="button" class="btn-close btn-sm" data-bs-dismiss="alert" aria-hidden="true"></button>';
    document.body.appendChild(div);
}

function moreThanOneInArray(value, array) {
    var c = 0;
    for(var i = 0; i < array.length; i++) {
        if(array[i] == value)
            c++;
    }
    if(c > 1)
        return true;
    else
        return false;
}