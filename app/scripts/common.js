// Defines visualization for a track
var wavesurfer = (function () {
	var wavesurfer = Object.create(WaveSurfer);

	// initialization of visual bar of music player
	wavesurfer.init({
		container: $('.waveform')[0],
		waveColor: '#3cd2ce',
		progressColor: '#30a8a4',
		cursorColor: '#ccc'
	});

	// bind events
	wavesurfer.on('ready', wavesurferOnReady);
	wavesurfer.on('finish', wavesurferOnFinish);

	function wavesurferOnReady () {
		$(window).on('resize', windowOnResize);
		player.displayTrackTime();
		$('.track__btn_type_remove').removeClass('track__btn_type_unclickable');
		wavesurfer.play();
	}

	function wavesurferOnFinish() {
		player.next();
	}

	function windowOnResize () {
		wavesurfer.drawer.containerWidth = wavesurfer.drawer.container.clientWidth;
		wavesurfer.drawBuffer();
	}

	return wavesurfer;
})();

// Defines Drag`n`Drop behaviour
var dropzone = (function () {
	'use strict';

	// add the dataTransfer property for use with the native `drop` event
	// to capture information about files dropped into the browser window
	jQuery.event.props.push( "dataTransfer" );

	// cache DOM
	var $player = $('.player'),
			$dropzone = $('.dropzone');

	// bind events
	$player.on('dragover', playerOnDragOver);
	$player.on('dragleave', playerOnDragLeave);
	$player.on('drop', playerOnDrop);

	function cancelDefaultBehaviour (e) {
		e.stopPropagation();
		e.preventDefault();
	}

	function playerOnDragOver (e) {
		cancelDefaultBehaviour(e);
		$dropzone.addClass('dropzone_state_open');
	}

	function playerOnDragLeave (e) {
		cancelDefaultBehaviour(e);
		$dropzone.removeClass('dropzone_state_open');
	}

	function playerOnDrop (e) {
		cancelDefaultBehaviour(e);
		$dropzone.removeClass('dropzone_state_open');

		var files = e.dataTransfer.files;

		for (var i = files.length - 1; i >= 0; i--) {
			if (files[i].type.match('audio.*')) {
				playlist.addTrack(files[i]);
			}
		}
	}
}());

// Defines player behaviour like play, pause, shuffle, etc.
var player = (function () {
	function load (track) {
		wavesurfer.loadBlob(track);
		player.displayBigCover(track);
		player.makeTrackActive(track);
	}

	function play (track) {

	}

	function pause () {
	}

	function stop () {
		wavesurfer.stop();
	}

	function next () {
		var activeTrack = $('.playlist__item_state_active'),
				nextTrackId = +activeTrack.attr('data-id') + 1,
				nextTrack = playlist.getTracks()[nextTrackId];

		if(nextTrack) {
			player.load(nextTrack);
		}
	}

	function previous () {
		var activeTrack = $('.playlist__item_state_active'),
		previousTrackId = +activeTrack.attr('data-id') - 1,
		previousTrack = playlist.getTracks()[previousTrackId];

		if(previousTrack) {
			player.load(previousTrack);
		}
	}

	function repeat () {

	}

	function eq () {

	}

	function setVolume () {

	}

	function setInitialState () {
		$('.playlist').addClass('playlist_empty');
		$('.waveform').removeClass('waveform_state_active');
		$('.player__cover').attr('src', 'assets/images/default.png');
		$('.time__item_type_current').html('-');
		$('.time__item_type_total').html('-');
	}

	function displayTrackTime () {
		var duration = getFormattedTime( wavesurfer.getDuration() );
		$('.time__item_type_total').html(duration);

		wavesurfer.backend.on('audioprocess', function (time) {
			$('.time__item_type_current').html( getFormattedTime(time) );
		});
	}

	function getFormattedTime(time) {
		var seconds = Math.floor(time);
		var minutes = 0;
		var hours = 0;

		if (seconds > 60) {
			minutes = Math.floor(seconds / 60);
			seconds = seconds % 60;

			if (minutes > 60) {
				hours = Math.floor(minutes / 60);
				minutes = hours % 60;
			}
		}

		seconds = seconds < 10 ? "0" + seconds : seconds;
		minutes = minutes < 10 ? "0" + minutes : minutes;
		hours = hours < 10 ? "0" + hours : hours;

		return hours + ":" + minutes + ":" + seconds;
	}

	function displayBigCover (track) {
		if (track.cover) {
			$('.player__cover').attr('src', track.cover);
		}
	}

	function makeTrackActive (track) {
		$('.playlist__item').removeClass('playlist__item_state_active');
		$('.playlist__item[data-id=' + track.id + ']')
		.addClass('playlist__item_state_active');
	}

	var api = {
		load: load,
		play: play,
		pause: pause,
		stop: stop,
		next: next,
		previous: previous,
		repeat: repeat,
		eq: eq,
		setVolume: setVolume,
		setInitialState: setInitialState,
		displayTrackTime: displayTrackTime,
		displayBigCover: displayBigCover,
		makeTrackActive: makeTrackActive
	};

	return api;
})();

// Defines Playlist
var playlist = (function () {
	'use strict';

	var tracks = [];
	var trackId = 0;

	function onRemoveButtonClick (event) {
		$('.track__btn_type_remove').addClass('track__btn_type_unclickable');
		var $trackToRemove = $(this).parents('.playlist__item');
		var tracks = playlist.getTracks();

		if ( $trackToRemove.hasClass('playlist__item_state_active') ) {
			if (tracks.length == 1) {
					player.stop();
			} else if ($trackToRemove.attr('data-id') == 0) {
					player.next();
				} else {
					player.previous();
				}
		}

		$trackToRemove.remove();
		removeTrack( $trackToRemove.attr('data-id') );
		updateDataIdAttributes();

		if (tracks.length == 0) {
			player.setInitialState();
		}
	}

	function onPlayListItemClick (event) {
		player.load( tracks[$(this).attr('data-id')] );
	}

	function addTrack (track) {

		// get info about track (title, artist, cover, duration)
		ID3.loadTags(track.name, function () {
			// add track to tracks array
			tracks.push(track);

			var tags = ID3.getAllTags(track.name);

			track.id = trackId++;
			track.title = tags.title || 'Unknown';
			track.artist = tags.artist || 'Unknown Artist';

			// converts id3 image tag to base64Url
			var image = tags.picture;

			if (image) {
				var base64String = "";

				for (var i = 0; i < image.data.length; i++) {
						base64String += String.fromCharCode(image.data[i]);
				}

				var base64Url = "data:" + image.format + ";base64," + window.btoa(base64String);
				track.cover = base64Url;
			} else {
				track.cover = 'assets/images/default.png';
			}

			playlist.render(track);

			if (tracks.length === 1) {
				player.load(track);
				$('.playlist').removeClass('playlist_empty');
				$('.waveform').addClass('waveform_state_active');
			}
		},{
			tags: ['title', 'artist', 'picture'],
			dataReader: FileAPIReader(track)
		});
	}

	function removeTrack (id) {
		playlist.getTracks().splice(id, 1);
		trackId--;
	}

	function updateDataIdAttributes () {
		var $tracks = $('.playlist__item');

		tracks.forEach(function(value,index) {
			$tracks.eq(index).attr('data-id', index);
			value.id = index;
		});
	}

	function isEmpty () {
		return tracks.length === 0;
	}

	function getTracks () {
		return tracks;
	}

	function fillTemplate (sourceId, data) {
		var source = $(sourceId).html(),
		template = Handlebars.compile(source);
		return(template(data));
	}

	function render (track) {
		var html = fillTemplate('#playlist-item', track);
		var $track = $(html);
		var $removeButton = $track.find('.track__btn_type_remove');

		$track.on('click', onPlayListItemClick);
		$removeButton.on('click', onRemoveButtonClick);


		$('.playlist__content').append($track);
	}

	var api = {
		addTrack: addTrack,
		removeTrack: removeTrack,
		isEmpty: isEmpty,
		getTracks: getTracks,
		render: render
	};

	return api;

})();
