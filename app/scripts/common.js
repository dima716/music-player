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
	wavesurfer.on('seek', wavesurferOnSeek);
	wavesurfer.backend.on('audioprocess', wavesurferOnAudioProcess);

	function wavesurferOnAudioProcess(time) {
		$('.time__item_type_current').html(utils.getFormattedTime(time));
	}

	function wavesurferOnReady() {
		$('.waveform__loader').removeClass('waveform__loader_state_active');
		$('.track__btn_type_remove,' +
			'.controls__item_type_next,' +
			'.controls__item_type_previous').removeClass('btn_type_unclickable');

		player.displayTrackDuration();
		player.play();
	}

	function wavesurferOnSeek() {
		var currentTime = utils.getFormattedTime(wavesurfer.getCurrentTime());
		$('.time__item_type_current').html(currentTime);
	}

	function wavesurferOnFinish() {
		player.stop();

		var currentTrackIndex = $('.playlist__item_state_active').attr('data-index'),
			tracks = playlist.getTracks(),
			lastIndex = tracks.length - 1,
			randomTrackIndex = Math.floor(Math.random() * tracks.length);

		if (player.isShuffled() && tracks.length !== 1) {
			while (currentTrackIndex == randomTrackIndex) {
				randomTrackIndex = Math.floor(Math.random() * tracks.length);
			}
			player.load(tracks[randomTrackIndex]);
		} else if (player.isLooped() && currentTrackIndex == lastIndex) {
			player.load(tracks[0]);
		} else {
			player.next();
		}
	}

	return wavesurfer;
})();

var dropzone = (function () {
	'use strict';

	// add the dataTransfer property for use with the native `drop` event
	// to capture information about files dropped into the browser window
	jQuery.event.props.push('dataTransfer');

	// cache DOM
	var $player = $('.player'),
			$dropzone = $('.dropzone');

	// bind events
	$player.on('dragover', playerOnDragOver);
	$player.on('dragleave', playerOnDragLeave);
	$player.on('drop', playerOnDrop);

	function cancelDefaultBehaviour(e) {
		e.stopPropagation();
		e.preventDefault();
	}

	function playerOnDragOver(e) {
		cancelDefaultBehaviour(e);
		$dropzone.addClass('dropzone_state_open');
	}

	function playerOnDragLeave(e) {
		cancelDefaultBehaviour(e);
		$dropzone.removeClass('dropzone_state_open');
	}

	function playerOnDrop(e) {
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

var player = (function () {
	var looped = false,
		shuffled = false;

	// cache DOM
	var $playPauseControl = $('.controls__item_type_play-pause'),
		$playPauseControlIcon = $playPauseControl.find('.controls__icon'),
		$nextTrackControl = $('.controls__item_type_next'),
		$previousTrackControl = $('.controls__item_type_previous'),
		$volumeControl = $('.controls__item_type_volume > input'),
		$loopControl = $('.controls__item_type_loop'),
		$shuffleControl = $('.controls__item_type_shuffle'),
		$trackArtist = $('.player__track').find('.track__artist'),
		$trackTitle = $('.player__track').find('.track__title'),
		$equalizerControl = $('.controls__item_type_equalizer'),
		$equalizerElement = $('.equalizer');

	// bind events
	$playPauseControl.on('click', playPause);
	$nextTrackControl.on('click', next);
	$previousTrackControl.on('click', previous);
	$volumeControl.on('input', setVolume);
	$loopControl.on('click', loop);
	$shuffleControl.on('click', shuffle);
	$equalizerControl.on('click', toggleEqualizer);

	function setVolume(value) {
		var newVolume,
			volumeUi = $volumeControl.next('span');

		if (typeof value === 'object') {
			newVolume =  $volumeControl.val();
		} else if (typeof value === 'number') {
			newVolume = value;
			$volumeControl.val(newVolume);
		} else {
			newVolume = 100;
			$volumeControl.val(newVolume);
		}

		wavesurfer.setVolume(newVolume / 100);
		volumeUi.html(newVolume);
	}

	function load(track) {
		wavesurfer.loadBlob(track);
		$('.waveform__loader').addClass('waveform__loader_state_active');
		player.displayBigCover(track);
		player.makeTrackActive(track);
	}

	function playPause() {
		if (!$('.playlist__content').is(':empty')) {
			wavesurfer.playPause();
			changePlayPauseIcon('toggle');
		}
	}

	function stop() {
		wavesurfer.stop();
		changePlayPauseIcon('play');
	}

	function play() {
		wavesurfer.play();
		changePlayPauseIcon('pause');
	}

	function changePlayPauseIcon(icon) {
		switch (icon) {
			case 'play':
				$playPauseControlIcon.addClass('controls__icon_type_play3');
				$playPauseControlIcon.removeClass('controls__icon_type_pause2');
				break;
			case 'pause':
				$playPauseControlIcon.addClass('controls__icon_type_pause2');
				$playPauseControlIcon.removeClass('controls__icon_type_play3');
				break;
			case 'toggle':
				$playPauseControlIcon.toggleClass('controls__icon_type_play3');
				$playPauseControlIcon.toggleClass('controls__icon_type_pause2');
				break;
		}
	}

	function next() {
		var activeTrack = $('.playlist__item_state_active'),
				nextTrackIndex = Number(activeTrack.attr('data-index')) + 1,
				nextTrack = playlist.getTracks()[nextTrackIndex];

		if (nextTrack) {
			$('.controls__item_type_next').addClass('btn_type_unclickable');
			player.load(nextTrack);
		}
	}

	function previous() {
		var activeTrack = $('.playlist__item_state_active'),
				previousTrackIndex = Number(activeTrack.attr('data-index')) - 1,
				previousTrack = playlist.getTracks()[previousTrackIndex];

		if (previousTrack) {
			$('.controls__item_type_previous').addClass('btn_type_unclickable');
			player.load(previousTrack);
		}
	}

	function loop() {
		looped = looped ? false : true;
		$loopControl.toggleClass('controls__item_state_active');
	}

	function isLooped() {
		return looped;
	}

	function shuffle() {
		shuffled = shuffled ? false : true;
		$shuffleControl.toggleClass('controls__item_state_active');
	}

	function isShuffled() {
		return shuffled;
	}

	function toggleEqualizer() {
		$(this).toggleClass('controls__item_state_active');
		$equalizerElement.toggleClass('equalizer_state_active');
	}

	function setInitialState() {
		$('.playlist').addClass('playlist_empty');
		$('.waveform').removeClass('waveform_state_active');
		$('.player__cover').attr('src', 'assets/images/default.png');
		$('.controls__item_type_next,.controls__item_type_previous').removeClass('btn_type_unclickable');
		$('.time__item_type_current').html('-');
		$('.time__item_type_total').html('-');
		$trackTitle.html('');
		$trackArtist.html('');
		$(window).off('resize');
	}

	function displayTrackDuration() {
		var duration = utils.getFormattedTime(wavesurfer.getDuration());
		$('.time__item_type_total').html(duration);
	}

	function displayBigCover(track) {
		if (track.cover) {
			$('.player__cover').attr('src', track.cover);
		}
	}

	function makeTrackActive(track) {
		$('.playlist__item').removeClass('playlist__item_state_active');
		$('.playlist__item[data-index=' + track.index + ']')
		.addClass('playlist__item_state_active');
		$trackTitle.html(track.title);
		$trackArtist.html(track.artist);
	}

	function init() {
		setVolume(Number($volumeControl.val()));
		equalizer.init();
	}

	var api = {
		init: init,
		load: load,
		play: play,
		stop: stop,
		next: next,
		previous: previous,
		loop: loop,
		isLooped: isLooped,
		shuffle: shuffle,
		isShuffled: isShuffled,
		setVolume: setVolume,
		setInitialState: setInitialState,
		displayTrackDuration: displayTrackDuration,
		displayBigCover: displayBigCover,
		makeTrackActive: makeTrackActive
	};

	return api;
})();

var playlist = (function () {
	'use strict';

	var tracks = [],
		trackIndex = 0;

	function onRemoveButtonClick() {
		var $trackToRemove = $(this).closest('.playlist__item'),
			tracks = playlist.getTracks();

		if ($trackToRemove.hasClass('playlist__item_state_active')) {
			$('.track__btn_type_remove').addClass('btn_type_unclickable');

			if ($trackToRemove.attr('data-index') == tracks.length - 1) {
				player.previous();
			} else {
				player.next();
			}
		}

		$trackToRemove.remove();
		removeTrack($trackToRemove.attr('data-index'));
		updateDataIndexAttributes();

		if (tracks.length === 0) {
			player.stop();
			player.setInitialState();
		}
	}

	function onPlayListItemClick() {
		player.load(tracks[$(this).attr('data-index')]);
	}

	function addTrack(track) {
		ID3.loadTags(track.name, function () {
			// add track to tracks array
			tracks.push(track);

			var tags = ID3.getAllTags(track.name);

			track.index = trackIndex++;
			track.title = tags.title || 'Unknown';
			track.artist = tags.artist || 'Unknown Artist';

			// converts id3 image tag to base64Url
			var image = tags.picture;

			if (image) {
				var base64String = '';

				for (var i = 0; i < image.data.length; i++) {
						base64String += String.fromCharCode(image.data[i]);
				}

				var base64Url = 'data:' + image.format + ';base64,' + window.btoa(base64String);
				track.cover = base64Url;
			} else {
				track.cover = 'assets/images/default.png';
			}

			playlist.render(track);

			if (tracks.length === 1) {
				player.load(track);
				$('.playlist').removeClass('playlist_empty');
				$(window).on('resize',function () {
					wavesurfer.drawer.containerWidth = wavesurfer.drawer.container.clientWidth;
					wavesurfer.drawBuffer();
				});
				$('.waveform').addClass('waveform_state_active');
			}
		},
		{
			tags: ['title', 'artist', 'picture'],
			dataReader: FileAPIReader(track)
		});
	}

	function removeTrack(index) {
		playlist.getTracks().splice(index, 1);
		trackIndex--;
	}

	function updateDataIndexAttributes() {
		var $tracks = $('.playlist__item');

		tracks.forEach(function (value, index) {
			$tracks.eq(index).attr('data-index', index);
			value.index = index;
		});
	}

	function isEmpty() {
		return tracks.length === 0;
	}

	function getTracks() {
		return tracks;
	}

	function fillTemplate(sourceId, data) {
		var source = $(sourceId).html(),
		template = Handlebars.compile(source);
		return (template(data));
	}

	function render(track) {
		var html = fillTemplate('#playlist-item', track),
			$track = $(html),
			$removeButton = $track.find('.track__btn_type_remove');

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

var equalizer = (function () {
	var equalizerSettings = [
		{
			f: 32,
			type: 'lowshelf'
		},
		{
			f: 64,
			type: 'peaking'
		},
		{
			f: 125,
			type: 'peaking'
		},
		{
			f: 250,
			type: 'peaking'
		},
		{
			f: 500,
			type: 'peaking'
		},
		{
			f: 1000,
			type: 'peaking'
		},
		{
			f: 2000,
			type: 'peaking'
		},
		{
			f: 4000,
			type: 'peaking'
		},
		{
			f: 8000,
			type: 'peaking'
		},
		{
			f: 16000,
			type: 'highshelf'
		}
	],
	equalizerPresets = {
		pop: [-2, -1, 0, 2, 4, 3, 1, 0, -1, -2],
		rock: [5, 3, 1, 0, -1, -1, 0, 2, 3, 4],
		jazz: [4, 2, 1, 2, -1, -1, 0, 1, 2, 3],
		classic: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4],
		normal: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	},
	equalizerFilters;

	// cache DOM
	var $equalizerControls = $('.equalizer__input'),
		$presetItem = $('.presets__item');

	// bind events
	$presetItem.on('click', onPresetItemClick);

	function onPresetItemClick() {
		setPreset($(this).attr('data-preset'));
		$presetItem.removeClass('presets__item_state_active');
		$(this).addClass('presets__item_state_active');
	}

	function init() {
		// Create filters
		equalizerFilters = equalizerSettings.map(function (band) {
			var filter = wavesurfer.backend.ac.createBiquadFilter();
			filter.type = band.type;
			filter.gain.value = 0;
			filter.Q.value = 1;
			filter.frequency.value = band.f;
			return filter;
		});

		// Connect filters to wavesurfer
		wavesurfer.backend.setFilters(equalizerFilters);

		// Bind filters to vertical range sliders
		equalizerFilters.forEach(function (filter, index) {
			$equalizerControls.eq(index).on('input', onInput);

			function onInput(e) {
				filter.gain.value = e.target.value;
			}
		});
	}

	function setPreset(preset) {
		var gains = equalizerPresets[preset];

		equalizerFilters.forEach(function (filter, index) {
			filter.gain.value = gains[index];
			$equalizerControls.eq(index).val(gains[index]);
		});
	}

	var api = {
		init: init,
		setPreset: setPreset
	};

	return api;
})();

var utils = (function () {
	function getFormattedTime(time) {
		var seconds = Math.floor(time),
			minutes = 0,
			hours = 0;

		if (seconds > 60) {
			minutes = Math.floor(seconds / 60);
			seconds = seconds % 60;

			if (minutes > 60) {
				hours = Math.floor(minutes / 60);
				minutes = hours % 60;
			}
		}

		seconds = seconds < 10 ? '0' + seconds : seconds;
		minutes = minutes < 10 ? '0' + minutes : minutes;
		hours = hours < 10 ? '0' + hours : hours;

		if (hours === '00') {
			return minutes + ':' + seconds;
		}

		return hours + ':' + minutes + ':' + seconds;
	}

	var api = {
		getFormattedTime: getFormattedTime
	};

	return api;
})();

player.init();

