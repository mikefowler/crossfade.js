$(function () {
		
	// Initialize both crossfade examples
	$('.js-example-1').crossfade({
		threshold: 0.2,
	});

	$('.js-example-2').crossfade({
		threshold: 0.5,
		backgroundPosition: 'top left'
	});

	// Set the height of the sections based on the viewport height
	$('.js-section').css({
		height: $(window).height() * 1.2
	});

});