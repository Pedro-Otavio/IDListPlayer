let player;
let title = document.getElementById('title');
let minQual = false;
let currVidMinQual = false;
let IDList;
let index = 0;
let max;

function resize() {
    let plr = document.getElementById('player');
    let w = Math.min(document.documentElement.clientWidth, 768);
    let h = Math.floor(w * 9 / 16);
    plr.setAttribute('width', w);
    plr.setAttribute('height', h);
}

function onYouTubeIframeAPIReady() {
    window.setTimeout(function () {
        player = new YT.Player('player', {
            events: {
                'onStateChange': playerChanged,
                'onPlaybackQualityChange': quality
            }
        });
    }, 1500);
    resize();
    window.addEventListener('orientationchange', next);
}

function playerChanged(event) {
    switch (event.data) {
        case 0:
            next();
            title.innerHTML = "ID List Player";
            break;
        case 1:
            title.innerHTML = player.getVideoData().title;
            break;
        case 3:
            quality();
            break;
    }
}

function quality() {
    if (minQual && !currVidMinQual) {
        player.setPlaybackQuality('small');
        player.setPlaybackQuality('tiny');
        currVidMinQual = true;
    }
}

function toggleMinQuality() {
    minQual = !minQual;
    document.getElementById('labelMinquality').classList.toggle('disabled');
    quality();
}

function enableBtns() {
    document.getElementById('previous').disabled = false;
    document.getElementById('next').disabled = false;
    document.getElementById('skipTo').disabled = false;
    document.getElementById('shuffle').disabled = false;
    document.getElementById('labelPrevious').classList.remove('disabled');
    document.getElementById('labelNext').classList.remove('disabled');
    document.getElementById('labelJumpTo').classList.remove('disabled');
    document.getElementById('labelShuffle').classList.remove('disabled');
}

let reader = new FileReader();
reader.onloadend = function (event) {
    let error = event.target.error;
    if (error !== null) {
        document.getElementById('errow').hidden = false;
        console.error("FileReader error code " + error.code);
    } else {
        readIDs(event.target.result);
        enableBtns();
        setIndex(0);
        player.cueVideoById(IDList[0]);
    }
};

function ready() {
    let IDstxt = document.getElementById('fileInput').files.item(0);
    reader.readAsText(IDstxt);
}

function readIDs(fileIDs) {
    IDList = fileIDs.split('~');
    max = IDList.length - 1;
}

let rnd = Math.random;

function shuffle(arr, len = arr.length, i, k) {
    while (len) i = rnd() * len-- | 0, k = arr[len], arr[len] = arr[i], arr[i] = k;
}

function shuffleList() {
    shuffle(IDList);
    skipTo(0);
}

function next() {
    skipTo(index + 1);
}

function previous() {
    skipTo(index - 1);
}

function skipTo(i) {
    setIndex(i);
    player.loadVideoById(IDList[index]);
    currVidMinQual = false;
}

function setIndex(i) {
    index = i;
    if (index < 0) {
        index = max;
    } else if (index > max) {
        index = 0;
    }
    document.getElementById('index').innerHTML = index + 1;
}

function save() {
    let IDs = IDList.join('~');
    let blob = new Blob([IDs], {
        type: 'text/plain'
    });
    let url = window.URL.createObjectURL(blob);
    let a = document.getElementById('download');

    a.setAttribute('href', url);
    a.setAttribute('download', 'ShuffledIDs.txt');
    a.setAttribute('onclick', "downloaded('" + url + "')");
    a.classList.remove('hidden');
}

function downloaded(url) {
    window.setTimeout(function () {
        window.URL.revokeObjectURL(url);
    }, 500);
    document.getElementById('download').classList.add('hidden');
}
