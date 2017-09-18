let player;
let title = $('#title');
let minQual = false;
let currVidMinQual = false;
let IDList;
let index = 0;
let max;

function resize() {
    let plr = $('#player');
    let w = Math.min(document.documentElement.clientWidth, 768);
    let h = Math.floor(w * 9 / 16);
    plr.attr('width', w);
    plr.attr('height', h);
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
    window.addEventListener('orientationchange', function () {
        window.setTimeout(resize, 640);
    });
}

function playerChanged(event) {
    switch (event.data) {
        case 0:
            next();
            title.html("ID List Player");
            break;
        case 1:
            title.html(player.getVideoData().title);
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
    $('#labelMinquality').toggleClass('disabled');
    quality();
}

function enableBtns() {
    $('#previous').prop('disabled', false);
    $('#next').prop('disabled', false);
    $('#skipTo').prop('disabled', false);
    $('#shuffle').prop('disabled', false);
    $('#labelPrevious').removeClass('disabled');
    $('#labelNext').removeClass('disabled');
    $('#labelSkipTo').removeClass('disabled');
    $('#labelShuffle').removeClass('disabled');
}

let reader = new FileReader();
reader.onloadend = function (event) {
    let error = event.target.error;
    if (error !== null) {
        $('#errow').show();
        console.error("FileReader error code " + error.code);
    } else {
        readIDs(event.target.result);
        enableBtns();
        setIndex(0);
        player.cueVideoById(IDList[0]);
    }
};

function ready() {
    let IDstxt = $('#fileInput').prop('files')[0];
    reader.readAsText(IDstxt);
}

function readIDs(fileIDs) {
    IDList = fileIDs.split('~');
    max = IDList.length - 1;
    $('#fileInput').val(null);
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
    $('#index').html(index + 1);
}

function save() {
    let IDs = IDList.join('~');
    let blob = new Blob([IDs], {
        type: 'text/plain'
    });
    let url = window.URL.createObjectURL(blob);
    let a = $('#download');
    a.attr('href', url);
    a.attr('download', 'ShuffledIDs.txt');
    a.attr('onclick', "downloaded('" + url + "')");
    a.show();
}

function downloaded(url) {
    window.setTimeout(function () {
        window.URL.revokeObjectURL(url);
    }, 500);
    $('#download').hide();
}
