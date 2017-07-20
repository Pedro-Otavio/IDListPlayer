var player;

function onYouTubeIframeAPIReady() {
    window.setTimeout(function () {
        player = new YT.Player('player', {
            events: {
                'onStateChange': playerChanged,
                'onPlaybackQualityChange': quality
            }
        });
    }, 1500);
}

function quality() {
    player.setPlaybackQuality("small");
    player.setPlaybackQuality("tiny");
}

function playerChanged(event) {
    switch (event.data) {
        case 0:
            next();
            break;
        case 3:
            quality();
            break;
    }
}

var rnd = Math.random;
function shuffle(arr,len,i,k){len = arr.length;while(len)i=rnd()*len--|0,k=arr[len],arr[len]=arr[i],arr[i]=k;}

var IDList;
var index;
var max;

var reader = new FileReader();
reader.onloadend = function (event) {
    var error = event.target.error;
    if (error !== null) {
        document.getElementById("errow").hidden = false;
        console.error("FileReader error code " + error.code);
    } else {
        readIDs(event.target.result);
        document.getElementById("shuffle").disabled = false;
        document.getElementById("labelShuffle").setAttribute("class", "btn");
    }
};

function ready() {
    var IDstxt = document.getElementById("fileInput").files.item(0);
    reader.readAsText(IDstxt);
}

function readIDs(fileIDs) {
    IDList = fileIDs.split('~');
    max = IDList.length;
}

function start() {
    shuffle(IDList);
    index = 0;
    next();
}

function next() {
    player.loadVideoById(IDList[index]);
    index++;
    if (index >= max)
        index = 0;
}
