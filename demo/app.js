$(function () {
		
	// Initialize both crossfade examples
	$('.js-example-1').crossfade({
		threshold: 0.2
	});

	$('.js-example-2').crossfade({
    start: 'demo/02.jpg',
    end: 'demo/02-blur.jpg',
		threshold: 0.5,
		backgroundPosition: 'center center'
	});

});