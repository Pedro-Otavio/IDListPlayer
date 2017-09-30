let player = {};
let fileReaderObject = new FileReader();
let fileData = {};
let indexArray = [];
let index = 0;
let max = 0;
let tSwitcher = new TitleSwitcher(null);
let qualityOption = false;
let currentVideoMimumQuality = false;

function onYouTubeIframeAPIReady() { //eslint-disable-line no-unused-vars
    player = new YT.Player('player', {
        events: {
            'onStateChange': playerChanged,
            'onPlaybackQualityChange': quality
        }
    });

    resize();

    window.addEventListener('orientationchange', function () {
        window.setTimeout(resize, 256);
    });

    addListeners();
}

function resize() {
    let w = Math.max(Math.min(document.documentElement.clientWidth, 768), 232);
    let h = Math.floor(w * 9 / 16);
    $('#player').attr('width', w).attr('height', h);
}

function addListeners() {
    $('#fileInput').change(readFile);
    $('.disabled').hover(
        function () {
            $(this).children('.glyphicon').addClass('hidden');
            $(this).append("<span class='glyphicon glyphicon-ban-circle'></span>");
        },
        function () {
            $(this).children('.glyphicon-ban-circle').remove();
            $(this).children('.glyphicon').removeClass('hidden');
        });
    $('#shuffle').click(shufflePlaylist);
    $('#unshuffle').click(unshufflePlaylist);
    $('#next').click(next);
    $('#previous').click(previous);
    $('#indexInput').on('keypress', function (e) {
        if (e.which == 13) {
            $(this).prop('disabled', true);
            skipTo($(this).val());
            $(this).prop('disabled', false);
        }
    });
    $('#skipTo').click(function () {
        skipTo($('#indexInput').val());
    });
    $('#minQualityToggle').click(toggleMinQuality);
    $('#save').click(save);
}

fileReaderObject.onerror = function (event) {
    $('#errorMsg').text("\nFileReader error code " + event.target.error.code + "\n");
    $('#errow').show();
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
    skipTo(0);
    $('#fileInput').val(null);
}

function enableBtns() {
    $('.propDataDisabled').prop('disabled', false);
    $('.classDataDisabled').removeClass('disabled').off('mouseenter').off('mouseleave').children('.glyphicon-ban-circle').remove();
    $('.classDataDisabled').children('.glyphicon').removeClass('hidden');
}

function skipTo(i) {
    if (typeof i == "string") {
        i = (i.toLowerCase() == 'r' ? Math.floor(Math.random() * max) : (Number(i) - 1));
    }
    setIndex(i);
    play();
}

function setIndex(i) {
    index = i;
    if (index < 0) {
        index = max;
    } else if (index > max) {
        index = 0;
    }
    $('#index').text(index + 1);
}

function play() {
    tSwitcher.halt();
    currentVideoMimumQuality = false;
    let vidObj = fileData[indexArray[index]];
    player.loadVideoById(vidObj.id);
    tSwitcher.artistSongArray = splitArtistSong(vidObj.title);
    tSwitcher.begin();
}

function next() {
    skipTo(index + 1);
}

function previous() {
    skipTo(index - 1);
}

function shufflePlaylist() {
    shuffleArray(indexArray);
    skipTo(0);
}

let rnd = Math.random;

function shuffleArray(arr, len = arr.length, i, k) {
    while (len) i = rnd() * len-- | 0, k = arr[len], arr[len] = arr[i], arr[i] = k;
}

function unshufflePlaylist() {
    indexArray = [...Array(fileData.length).keys()];
    skipTo(0);
}

function quality() {
    if (qualityOption && !currentVideoMimumQuality) {
        player.setPlaybackQuality('small');
        player.setPlaybackQuality('tiny');
        currentVideoMimumQuality = true;
    }
}

function toggleMinQuality() {
    qualityOption = !qualityOption;
    $('#labelMinquality').toggleClass('off');
    quality();
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
        window.URL.revokeObjectURL(url);
        $(this).addClass('hidden').off();
    }).removeClass('hidden');
}

function playerChanged(event) {
    switch (event.data) {
        case YT.PlayerState.UNSTARTED:
            player.playVideo();
            break;
        case YT.PlayerState.ENDED:
            videoFinished();
            break;
        case YT.PlayerState.PLAYING:
            videoPlaying();
            break;
        case YT.PlayerState.PAUSED:
            //videoPaused();
            break;
        case YT.PlayerState.BUFFERING:
            //videoBuffering();
            break;
    }
}

function videoFinished() {
    next();
}

function videoPlaying() {
    quality();
}

function TitleSwitcher() {
    let self = this;
    this.id = null;
    this.artistSongArray = [0];
    this.i = 0;
    this.switchArtistSong = function () {
        if (self.artistSongArray.length > 1) {
            $('title').text(self.artistSongArray[self.i]);
            self.i++;
            if (self.i >= self.artistSongArray.length) {
                self.i = 0;
            }
        } else {
            $('title').text(self.artistSongArray[0]);
            window.clearInterval(self.t);
        }
        self.titleIs0 = !self.titleIs0;
    };
    this.begin = function () {
        $('title').text(self.artistSongArray[0]);
        self.t = window.setInterval(function () {
            self.switchArtistSong();
        }, 1280);
    };
    this.halt = function () {
        self.artistSongArray = ["ID List Player"];
        self.switchArtistSong();
    };
}

function splitArtistSong(title) {
    let separator = title.indexOf(" - ");
    if (separator != -1) {
        return [title.substring(0, separator), title.substring(separator + 3)];
    } else {
        return [title];
    }
}