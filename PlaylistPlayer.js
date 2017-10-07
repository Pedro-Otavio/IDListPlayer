let player = {};
let index = 0;
let indexArray = [];
let playlist = [];
let fileReaderObject = new FileReader();
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

    addButtonListeners();
}

function resize() {
    let w = Math.max(Math.min(document.documentElement.clientWidth, 768), 232);
    let h = Math.floor(w * 9 / 16);
    $('#player').attr('width', w).attr('height', h);
}

function addButtonListeners() {
    $('#loadCookie').click(loadCookie);
    $('#fileInput').change(readFile);
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
    $('#saveCookie').click(saveCookie);
    $('#download').click(saveFile);
}

function loadCookie() {
    let playerData = JSON.parse(window.localStorage.getItem('playerData'));
    ready(playerData);
}

function ready(playerData) {
    playlist = playerData.playlist;
    indexArray = playerData.indexArray.length != playerData.playlist.length ? [...Array(playlist.length).keys()] : playerData.indexArray;
    max = playerData.playlist.length - 1;
    $('.dataDisabled').prop('disabled', false);
    skipTo(playerData.index);
    $('#fileInput').val(null);
}

fileReaderObject.onerror = function (event) {
    $('#errorMsg').text("\nFileReader error code " + event.target.error.code + "\n");
    $('#errow').show();
};

fileReaderObject.onload = function (event) {
    let playerData = JSON.parse(event.target.result);
    ready(playerData);
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
    play(playlist[indexArray[index]]);
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

function play(vidObj) {
    $('#searchResultContainer').hide();
    tSwitcher.halt();
    currentVideoMimumQuality = false;
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

function search(term) {
    $('#searchResultTable').empty();
    $('#searchResultContainer').show();
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
    for (let i = 0, len = playlist.length; i < len; ++i) {
        let title = playlist[i].title;
        let id = playlist[i].id;
        if (title == null) {
            title = "Error, missing title";
        }
        if (match(title.toLowerCase())) {
            $('#searchResultTable').append(`
                <tr>
                    <td>
                        <div style="width: 5.5em;">
                            <h4 title="index in source file">${(i + 1)}</h4>
                            <h4>-</h4>
                            <h4 title="index in current playlist">${(indexArray.indexOf(i) + 1)}</h4>
                        </div>
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
                play(playlist[i]);
            });
        }
    }
}

function shufflePlaylist() {
    shuffleArray(indexArray);
    index = (max + 1);
    $('#index').text("0 (Playlist shuffled)");
}

let rnd = Math.random;

function shuffleArray(arr, len = arr.length, i, k) {
    while (len) i = rnd() * len-- | 0, k = arr[len], arr[len] = arr[i], arr[i] = k;
}

function unshufflePlaylist() {
    indexArray = [...Array(playlist.length).keys()];
    index = (max + 1);
    $('#index').text("0 (Playlist unshuffled)");
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
    $('#minQualityToggle').toggleClass('off');
    quality();
}

function saveCookie() {
    let playerData = {
        index: index,
        indexArray: indexArray,
        Playlist: playlist
    };
    window.localStorage.setItem('playerData', JSON.stringify(playerData));
}

function saveFile() {
    let dataArr = [];
    for (let i = 0, len = max + 1; i < len; ++i) {
        dataArr.push(playlist[indexArray[i]]);
    }
    let data = JSON.stringify(dataArr);
    let blob = new Blob([data], {
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
            ++(self.i);
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
        self.artistSongArray = ["Playlist Player"];
        self.switchArtistSong();
    };
}

function splitArtistSong(title = ["Error"]) {
    let separator = title.indexOf(" - ");
    if (separator != -1) {
        return [title.substring(0, separator), title.substring(separator + 3)];
    } else {
        return [title];
    }
}