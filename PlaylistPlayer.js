var YTPlayer = {};
var PLData = {
    playlist: [],
    indexArray: [],
    index: 0,
    time: 0
};
var max = 0;
var playlistVisibility = false;
var fileReaderObject = new FileReader();
var qualityOption = false;
var currentVideoMimumQuality = false;

function onYouTubeIframeAPIReady() { //eslint-disable-line no-unused-vars
    YTPlayer = new YT.Player('YTPlayer', {
        events: {
            'onStateChange': playerChanged,
            'onPlaybackQualityChange': quality
        }
    });

    resize();

    window.addEventListener('orientationchange', function () {
        window.setTimeout(resize, 256);
    });

    addButtonListeners();

    if (window.localStorage.getItem('autoPLData') !== null) {
        window.setTimeout(storageLoad, 1000);
    }
}

function resize() {
    let w = Math.max(Math.min(document.documentElement.clientWidth, 768), 232);
    let h = Math.floor(w * 9 / 16);
    $('#player').attr('width', w).attr('height', h);
}

window.onbeforeunload = function () {
    if (PLData !== null)
        window.localStorage.setItem('autoPLData', JSON.stringify(PLData));
};

function addButtonListeners() {
    $('#storageLoad').click(storageLoad);
    $('#fileInput').change(readFile);
    $('#togglePlaylistVisibility').click(togglePlaylistVisibility);
    $('#refresh').click(function () {
        search("");
    });
    $('#minQualityToggle').click(toggleMinQuality);
    $('#shuffle').click(shufflePlaylist);
    $('#unshuffle').click(unshufflePlaylist);
    $('#next').click(next);
    $('#previous').click(previous);
    $('#indexInput').on('keypress', function (e) {
        if (e.which == 13) {
            $(this).prop('disabled', true);
            skipTo($(this).val());
            $(this).prop('disabled', false).focus();
        }
    });
    $('#skipTo').click(function () {
        skipTo($('#indexInput').val());
    });
    $('#searchInput').on('keypress', function (e) {
        if (e.which == 13) {
            $(this).prop('disabled', true);
            search($(this).val());
            $(this).prop('disabled', false).focus();
        }
    });
    $('#search').click(function () {
        search($('#searchInput').val());
    });
    $('#storageSave').click(storageSave);
    $('#download').click(saveFile);
}

function storageLoad() {
    ready(JSON.parse(window.localStorage.getItem('PLData')));
}

function ready(PLData) {
    if (this.PLData === null)
        return;
    PLData.playlist = this.PLData.playlist;
    PLData.indexArray = this.PLData.indexArray.length != PLData.playlist.length ? [...Array(PLData.playlist.length).keys()] : PLData.indexArray;
    max = PLData.playlist.length - 1;
    $('.dataDisabled').prop('disabled', false);
    skipTo(PLData.index);
    $('#fileInput').val(null);
}

fileReaderObject.onerror = function (event) {
    $('#errorMsg').text("\nFileReader error code " + event.target.error.code + "\n");
    $('#errow').show();
};

fileReaderObject.onload = function (event) {
    ready(JSON.parse(event.target.result));
};

function readFile() {
    fileReaderObject.readAsText($('#fileInput').prop('files')[0]);
}

function skipTo(i) {
    if (typeof i == "string") {
        i = (i == 'R' || i == 'r' ? Math.floor(Math.random() * max) : (Number(i) - 1));
        if (-2 < i && i < 0)
            i = 0;
    }
    setIndex(i);
    play(PLData.playlist[PLData.indexArray[PLData.index]]);
}

function setIndex(i) {
    PLData.index = i;
    if (PLData.index < 0) {
        PLData.index = max;
    } else if (PLData.index > max) {
        PLData.index = 0;
    }
    $('#index').text(PLData.index + 1);
}

function play(vidObj) {
    tSwitcher.halt();
    currentVideoMimumQuality = false;
    YTPlayer.loadVideoById(vidObj.id);
    tSwitcher.artistSongArray = splitArtistSong(vidObj.title);
    tSwitcher.begin();
}

function next() {
    skipTo(PLData.index + 1);
}

function previous() {
    skipTo(PLData.index - 1);
}

function togglePlaylistVisibility() {
    playlistVisibility = !playlistVisibility;
    if (playlistVisibility) {
        showPlaylist();
    } else {
        hidePlaylist();
    }
}

function showPlaylist() {
    $('#playlistContainer').show();
    $('#togglePlaylistVisibility').addClass('off');
}

function search(term) {
    $('#playlistTable').empty();
    if (!playlistVisibility) {
        togglePlaylistVisibility();
    }
    let match;
    if (term.indexOf("/") == 0) {
        let pattern = new RegExp(term.substring(1), 'i');
        match = function (str) {
            return pattern.test(str);
        };
    } else {
        match = function (str) {
            return str.includes(term.toLowerCase());
        };
    }
    for (let i = 0, len = PLData.playlist.length; i < len; ++i) {
        let title = PLData.playlist[i].title;
        let id = PLData.playlist[i].id;
        if (title == null) {
            title = "Error, missing title";
        }
        if (match(title.toLowerCase())) {
            $('#playlistTable').append(`
                <tr>
                    <td>
                        <h4>${((String)(PLData.indexArray.indexOf(i) + 1)).padStart(3,"00")}</h4>
                    </td>
                    <td>
                        <h4>${title}</h4>
                    </td>
                    <td>
                        <button id="play-${id}" title="Play now" class="btn">
                            <span class="glyphicon glyphicon-play"></span>
                        </button>
                    </td>
                </tr>
            `);
            $(`#play-${id}`).click(function () {
                play(PLData.playlist[i]);
            });
        }
    }
}

function hidePlaylist() {
    $('#playlistContainer').hide();
    $('#togglePlaylistVisibility').removeClass('off');
}

function shufflePlaylist() {
    shuffleArray(PLData.indexArray);
    PLData.index = (max + 1);
    $('#index').text("0 (Playlist shuffled)");
}

let rnd = Math.random;

function shuffleArray(arr) {
    let i, k, len = arr.length;
    while (len) {
        i = rnd() * len-- | 0;
        k = arr[len];
        arr[len] = arr[i];
        arr[i] = k;
    }
}

function unshufflePlaylist() {
    PLData.indexArray = [...Array(PLData.playlist.length).keys()];
    PLData.index = (max + 1);
    $('#index').text("0 (Playlist unshuffled)");
}

function quality() {
    if (qualityOption && !currentVideoMimumQuality) {
        YTPlayer.setPlaybackQuality('small');
        YTPlayer.setPlaybackQuality('tiny');
        currentVideoMimumQuality = true;
    }
}

function toggleMinQuality() {
    qualityOption = !qualityOption;
    $('#minQualityToggle').toggleClass('off');
    quality();
}

function storageSave() {
    window.localStorage.setItem('PLData', JSON.stringify(PLData));
}

function saveFile() {
    let blob = new Blob([JSON.stringify(PLData)], {
        type: 'application/json'
    });
    let url = window.URL.createObjectURL(blob);
    $('#hiddenLink').attr('href', url).attr('download', 'ShuffledPlaylist.json').click(function () {
        window.URL.revokeObjectURL(url);
    });
    document.querySelector('#hiddenLink').click(); //jQuery bug
}

function playerChanged(event) {
    switch (event.data) {
        case YT.PlayerState.UNSTARTED:
            YTPlayer.playVideo();
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


function splitArtistSong(title = ["Error"]) {
    let separator = title.indexOf(" - ");
    if (separator != -1) {
        return [title.substring(0, separator), title.substring(separator + 3)];
    } else {
        return [title];
    }
}

class TitleSwitcher {
    constructor() {
        this.artistSongArray = [0];
        this.i = 0;
        this.t = 0;
        this.titleIs0 = false;
        this.title = $('title');
    }
    switchArtistSong() {
        if (this.artistSongArray.length > 1) {
            this.title.text(this.artistSongArray[this.i]);
            ++(this.i);
            if (this.i >= this.artistSongArray.length) {
                this.i = 0;
            }
        } else {
            this.title.text(this.artistSongArray[0]);
            window.clearInterval(this.t);
        }
        this.titleIs0 = !this.titleIs0;
    }
    begin() {
        this.title.text(this.artistSongArray[0]);
        this.t = window.setInterval(function () {
            this.switchArtistSong();
        }, 1280);
    }
    halt() {
        this.artistSongArray = ["Playlist Player"];
        this.title.text(this.artistSongArray[0]);
        window.clearInterval(this.t);
    }
}
var tSwitcher = new TitleSwitcher();