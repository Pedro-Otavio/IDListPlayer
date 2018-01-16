var YTPlayer = {};
var PLData = {
    playlist: [],
    indexArray: [],
    index: 0,
    time: -1
};
let initialized = false;
var TSInfo = {
    id: -1,
    a_s: [],
    s: false
};
var title = $('title');
var max = 0;
var playlistVisibility = false;
var fileReaderObject = new FileReader();
var qualityOption = false;
var currentVideoMimumQuality = false;
var options = {
    autoSaving: true,
    autoLoading: false
};

let x;

(function () {
    let op = JSON.parse(window.localStorage.getItem('options'));
    if ($.isEmptyObject(JSON.parse(window.localStorage.getItem('options'))))
        return;
    options = op;
    if (options.autoSaving == false)
        $('#autoSaveToggle').toggleClass('off');
    if (options.autoLoading == true)
        $('#autoLoadToggle').toggleClass('off');
})();

function toggleAutoSaving() {
    options.autoSaving = !options.autoSaving;
    $('#autoSaveToggle').toggleClass('off');
}

function toggleAutoLoading() {
    options.autoLoading = !options.autoLoading;
    $('#autoLoadToggle').toggleClass('off');
}

function onYouTubeIframeAPIReady() { //eslint-disable-line no-unused-vars

    YTPlayer = new YT.Player('YTPlayer', {
        events: {
            'onStateChange': playerChanged,
            'onPlaybackQualityChange': quality
        }
    });

    resize();

    addListeners();

    if (!options.autoLoading) {
        return;
    } else {
        let auto = window.localStorage.getItem('autoPLData');
        if (!$.isEmptyObject(auto))
            window.setTimeout(function () {
                ready(JSON.parse(auto));
            }, 1000);
    }
}

function resize() {
    let w = Math.max(Math.min(document.documentElement.clientWidth, 768), 232);
    let h = Math.floor(w * 9 / 16);
    $('#YTPlayer').attr('width', w).attr('height', h);
}

window.onbeforeunload = function () {
    window.localStorage.setItem('options', JSON.stringify(options));
    if (!options.autoSaving || !initialized)
        return;
    PLData.time = YTPlayer.getCurrentTime();
    window.localStorage.setItem('autoPLData', JSON.stringify(PLData));
    if (x)
        event.returnValue = YTPlayer.getCurrentTime();
};

function addListeners() {
    $(window).resize(resize);
    $('#storageLoad').click(storageLoad);
    $('#fileInput').change(readFile);
    $('#autoSaveToggle').click(toggleAutoSaving);
    $('#autoLoadToggle').click(toggleAutoLoading);
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

function ready(newPLData) {
    initialized = false;
    if ($.isEmptyObject(newPLData))
        return;
    PLData = newPLData;
    PLData.indexArray = PLData.indexArray.length != PLData.playlist.length ? [...Array(PLData.playlist.length).keys()] : PLData.indexArray;
    max = PLData.playlist.length - 1;
    $('.dataDisabled').prop('disabled', false);
    skipTo(PLData.index);
    YTPlayer.seekTo(PLData.time != -1 ? PLData.time : 0);
    $('#fileInput').val(null);
    initialized = true;
}

fileReaderObject.onerror = function (event) {
    alert("\nFileReader error \"" + event.target.error.code + "\"\n");
};

fileReaderObject.onload = function (event) {
    ready(JSON.parse(event.target.result));
};

function readFile() {
    fileReaderObject.readAsText($('#fileInput').prop('files')[0]);
}

function skipTo(i) {
    if (typeof i === "string") {
        i = (i === 'R' || i === 'r' ? Math.floor(Math.random() * max) : (Number(i) - 1));
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
    window.clearInterval(TSInfo.id);
    currentVideoMimumQuality = false;
    YTPlayer.loadVideoById(vidObj.id);
    TSInfo.a_s = splitArtistSong(vidObj.title);
    title.text(TSInfo.a_s[0]);
    TSInfo.s = false;
    TSInfo.id = window.setInterval(switchTitle, 1280);
}

function splitArtistSong(title = ["<Missing title>"]) {
    let separator = title.indexOf(" - ");
    if (separator !== -1) {
        return [title.substring(0, separator), title.substring(separator + 3)];
    } else {
        return [title];
    }
}

function switchTitle() {
    title.text(TSInfo.a_s[TSInfo.s ? 0 : 1]);
    TSInfo.s = !TSInfo.s;
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
    if (term.indexOf("\\") === 0) {
        let pattern = new RegExp(term.substring(1), 'i');
        match = function (str) {
            return pattern.test(str);
        };
    } else {
        match = function (str) {
            return str.includes(term.toLowerCase());
        };
    }
    let vidObj = {};
    for (let i = 0, len = PLData.playlist.length; i < len; ++i) {
        vidObj = PLData.playlist[PLData.indexArray[i]];
        vidObj.title = vidObj.title || "<Missing title>";
        if (match(vidObj.title.toLowerCase())) {
            $('#playlistTable').append(`
                <tr>
                    <td>
                        <h4>${((String)(i + 1)).padStart(3,"00")}</h4>
                    </td>
                    <td>
                        <h4>${vidObj.title}</h4>
                    </td>
                    <td>
                        <button id="play${vidObj.id}" title="Play now" class="btn">
                            <span class="glyphicon glyphicon-play"></span>
                        </button>
                    </td>
                </tr>
            `);
            $('#play' + vidObj.id).click(function () {
                play(PLData.playlist[PLData.indexArray[i]]);
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
    if (!initialized)
        return;
    PLData.time = YTPlayer.getCurrentTime();
    window.localStorage.setItem('PLData', JSON.stringify(PLData));
}

function saveFile() {
    if (!initialized)
        return;
    PLData.time = YTPlayer.getCurrentTime();
    let blob = new Blob([JSON.stringify(PLData)], {
        type: 'application/json'
    });
    let url = window.URL.createObjectURL(blob);
    $('#hiddenLink').attr('target', '_blank').attr('href', url).attr('download', 'CurrentPlaylist.json').click(
        function () {
            window.URL.revokeObjectURL(url);
        }
    );
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
