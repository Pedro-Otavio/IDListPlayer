var player;
var title = document.getElementsByTagName("TITLE")[0];
var minQual = false;
var IDList;
var index = 0;
var max;

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

function playerChanged(event) {
    switch (event.data) {
        case 0:
            next();
            break;
        case 1:
            setTitle();
            break;
        case 3:
            quality();
            break;
    }
}

function quality() {
    if (minQual) {
        player.setPlaybackQuality("small");
        player.setPlaybackQuality("tiny");
    }
}

function toggleMinQuality() {
    minQual = !minQual;
    document.getElementById("labelMinquality").classList.toggle("disabled");
    quality();
}

function setTitle() {
    title.innerHTML = "ID List Player";
    title.innerHTML = player.getVideoData().title;
}

function enableBtns() {
	document.getElementById("previous").disabled = false;
    document.getElementById("next").disabled = false;
	document.getElementById("jumpTo").disabled = false;
	document.getElementById("shuffle").disabled = false;
    document.getElementById("labelPrevious").classList.remove("disabled");
	document.getElementById("labelNext").classList.remove("disabled");
	document.getElementById("labelJumpTo").classList.remove("disabled");
	document.getElementById("labelShuffle").classList.remove("disabled");
}

var reader = new FileReader();
reader.onloadend = function (event) {
    var error = event.target.error;
    if (error !== null) {
        document.getElementById("errow").hidden = false;
        console.error("FileReader error code " + error.code);
    } else {
        readIDs(event.target.result);
		enableBtns();
		setIndex(0);
		player.cueVideoById(IDList[0]);
    }
};

function ready() {
    var IDstxt = document.getElementById("fileInput").files.item(0);
    reader.readAsText(IDstxt);
}

function readIDs(fileIDs) {
    IDList = fileIDs.split('~');
    max = IDList.length - 1;
}

var rnd = Math.random;
function shuffle(arr,len,i,k){len = arr.length;while(len)i=rnd()*len--|0,k=arr[len],arr[len]=arr[i],arr[i]=k;}

function shuffleList() {
    shuffle(IDList);
	jumpTo(0);
}

function next() {
    setIndex(index + 1);
    player.loadVideoById(IDList[index]);
}

function previous() {
    setIndex(index - 1);
    player.loadVideoById(IDList[index]);
}

function jumpTo(i) {
    setIndex(i);
    player.loadVideoById(IDList[index]);
}

function setIndex(i) {
	index = i;
	if (index < 0) {
        index = max;
    } else if (index > max) {
        index = 0;
    }
	document.getElementById("index").innerHTML = index + 1;
}

function save() {
	var IDs = IDList.join('~');
	var blob = new Blob([IDs], {type: "text/plain"});
    var url = window.URL.createObjectURL(blob);
	var a = document.getElementById("download");
	
	a.setAttribute("href", url);
    a.setAttribute("download", "ShuffledIDs.txt");
    a.setAttribute("onclick", "downloaded('" + url + "')");
	a.classList.remove("hidden");
}

function downloaded(url) {
    window.setTimeout(function () {
        window.URL.revokeObjectURL(url);
    }, 500);
	document.getElementById("download").classList.add("hidden");
}
