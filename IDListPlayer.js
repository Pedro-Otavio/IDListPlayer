let player;
let fileReaderObject = new FileReader();
let fileData;
let titleArray;
let titleIndex = 0;
let minQuality = false;
let currVidMinQuality = false;
let indexArray;
let index = 0;
let max;

function onYouTubeIframeAPIReady() { //eslint-disable-line no-unused-vars
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
        window.setTimeout(resize, 256);
    });

    window.setInterval(titleSwitch, 1500);

    $('#fileInput').change(readFile);
    $('#shuffle').click(shufflePlaylist);
    $('#next').click(next);
    $('#previous').click(previous);
    $('#skipTo').click(function () {
        skipTo(Number($('#indexInput').val()) + 1);
    });
    $('#minQualityToggle').click(toggleMinQuality);
    $('#save').click(save);
}

fileReaderObject.onerror = function (event) {
    $('#errow').show();
    $('#errorMsg').text("\nFileReader error code " + event.target.error.code + "\n");
};

fileReaderObject.onload = function (event) {
    fileData = JSON.parse(event.target.result);
    ready();
};

function readFile() {
    fileReaderObject.readAsText($('#fileInput').prop('files')[0]);
}

function ready() {
    indexArray = [...Array(fileData.length).keys()];
    max = indexArray.length - 1;
    enableBtns();
    setIndex(0);
    player.cueVideoById(fileData[0].id);
    $('#fileInput').val(null);
}

function playerChanged(event) {
    switch (event.data) {
        case 0:
            next();
            break;
        case 1:
            if (titleArray == null) {
                titleArray = splitArtistSong(player.getVideoData().title);
                document.title = titleArray[0];
            }
            break;
        case 3:
            quality();
            break;
    }
}

function shufflePlaylist() {
    shuffleArray(indexArray);
    skipTo(0);
}

function play() {
    currVidMinQuality = false;
    titleArray = null;
    player.loadVideoById(fileData[indexArray[index]].id);
}

function skipTo(i) {
    setIndex(i);
    play();
}

function next() {
    skipTo(index + 1);
}

function previous() {
    skipTo(index - 1);
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
    let dataArr = [];
    for (let i = 0, len = max + 1; i < len; i++) {
        dataArr.push(fileData[indexArray[i]]);
    }
    let data = JSON.stringify(dataArr);
    let blob = new Blob([data], {
        type: 'application/json'
    });
    let url = window.URL.createObjectURL(blob);
    $('#download').attr('href', url).attr('download', 'ShuffledIDs.json').click(function () {
        downloaded(url);
    }).removeClass('hidden');
}

function downloaded(url) {
    window.setTimeout(function () {
        window.URL.revokeObjectURL(url);
    }, 500);
    $('#download').addClass('hidden').off();
}

function toggleMinQuality() {
    minQuality = !minQuality;
    $('#labelMinquality').toggleClass('disabled');
    quality();
}

function quality() {
    if (minQuality && !currVidMinQuality) {
        player.setPlaybackQuality('small');
        player.setPlaybackQuality('tiny');
        currVidMinQuality = true;
    }
}

function titleSwitch() {
    if (titleArray) {
        document.title = titleArray[titleIndex];
        titleIndex = (titleIndex < (titleArray.length - 1)) ? titleIndex + 1 : 0;
    } else {
        document.title = "ID List Player";
    }
}

function resize() {
    let plr = $('#player');
    let w = Math.max(Math.min(document.documentElement.clientWidth, 768), 232);
    let h = Math.floor(w * 9 / 16);
    plr.attr('width', w);
    plr.attr('height', h);
}

function splitArtistSong(title) {
    let separator = title.indexOf(" - ");
    if (separator != -1) {
        return [title.substring(0, separator), title.substring(separator + 3)];
    } else {
        return [title];
    }
}

let rnd = Math.random;

function shuffleArray(arr, len = arr.length, i, k) {
    while (len) i = rnd() * len-- | 0, k = arr[len], arr[len] = arr[i], arr[i] = k;
}

function enableBtns() {
    $('#previous').prop('disabled', false);
    $('#next').prop('disabled', false);
    $('#skipTo').prop('disabled', false);
    $('#shuffle').prop('disabled', false);
    $('#save').prop('disabled', false);
    $('#labelPrevious').removeClass('disabled');
    $('#labelNext').removeClass('disabled');
    $('#labelSkipTo').removeClass('disabled');
    $('#labelShuffle').removeClass('disabled');
    $('#labelSave').removeClass('disabled');
}