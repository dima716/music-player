// Defines visual bar of music player
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

	function wavesurferOnReady () {
		$(window).on('resize', windowOnResize);
		wavesurfer.play();
	}

	function windowOnResize () {
		wavesurfer.drawer.containerWidth = wavesurfer.drawer.container.clientWidth;
		wavesurfer.drawBuffer();
	}

	return wavesurfer;
})();

// Drag`n`Drop behaviour
var dropzone = (function () {
	'use strict';

	// add the dataTransfer property for use with the native `drop` event
	// to capture information about files dropped into the browser window
	jQuery.event.props.push( "dataTransfer" );

	// cache DOM
	var $player = $('.player'),
			$dropzone = $('.dropzone'),
			$waveform = $('.waveform');

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
		wavesurfer.loadBlob(e.dataTransfer.files[0]);
		$waveform.addClass('waveform_state_active');
	}
}());

