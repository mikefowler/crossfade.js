/* global define, console */
(function (factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else {
		factory(window.jQuery || window.Zepto);
	}

}(function ($) {

	'use strict';

	// --------------------------------------------------------------------------
	// Creates a crossfade.js object
	// 
	// @param {object} el - The DOM element to use as our root
	// @param {object} options - An object of options to use
	// --------------------------------------------------------------------------

	function Crossfade (el, options) {

		this.el = $(el);
		this.options = options || {};

		// The start and end images can be passed in as part
		// of the options object, or defined as data attributes
		// on the element.
		this.options.start = this.options.start || this.el.data('crossfade-start');
		this.options.end = this.options.end || this.el.data('crossfade-end');

		// Without both a start and an end image, this utility won't do much.
		if (!this.options.start || !this.options.end) {
			throw new Error('crossfade.js requires two images.');
		}

		// Split the backgroundPosition option into its two components 
		var position = this.options.backgroundPosition.split(' ');
		this.options.backgroundPositionX = position[0];
		this.options.backgroundPositionY = position[1];

		// Cache the initial width and height of the element
		this.width = this.el.width();
		this.height = this.el.height();

		// Create a <canvas> and append it to our element
		// Also cache a reference to its drawing context.
		this.canvas = $('<canvas>').css({
			position: 'absolute',
			top: '0',
			left: '0',
			width: this.width,
			height: this.height
		});
		this.canvas.appendTo(this.el);
		this.paintbrush = this.canvas[0].getContext('2d');

		// Ensure that our scroll and resize callbacks are
		// called with the proper context
		var onScroll = $.proxy(this.onScroll, this);
		var onResize = $.proxy(this.onResize, this);

		// Preload both of the image sources…
		this.preload(function () {

			// Bind callbacks to the window scroll and
			// resize events and trigger both to kick things off 
			$(window).on('scroll', onScroll).trigger('scroll');
			$(window).on('resize', onResize).trigger('resize');

		});
		
	}

	// --------------------------------------------------------------------------
	// Preload image sources.
	//
	// @param {function} callback - A method to run on completion
	// --------------------------------------------------------------------------

	Crossfade.prototype.preload = function (callback) {
		
		var sources, remaining, loaded;

		// Create DOM elements (but don't insert them).
		this.start = $('<img>').attr({ src: this.options.start });
		this.end = $('<img>').attr({ src: this.options.end });

		// Drop our images into an array, and count that
		// array, to make things easier below. This seems
		// stupid for a fixed number of elements, but so
		// it goes.
		sources = [this.start, this.end];
		remaining = sources.length;

		// Define a callback method to run when an image
		// has finished loading. The callback method decrements
		// a counter and, if the counter has reached zero, runs
		// the callback method, indicating both images have loaded.
		loaded = function() {
  		remaining--;
    	if (remaining === 0) {
    		if (typeof callback === 'function') {
    			callback();
    		}
    	}
    };

		// For each of the source images…
		for (var i = 0; i < sources.length; i++) {
			
			// Listen for the load event and call the
			// callback if both images have loaded.
			sources[i].on('load', loaded);

	    // Account for either of the images being cached, 
	    // and force trigger a load event if so.
	    if (sources[i].prop('complete')) {
	    	sources[i].trigger('load');
	    }
	  }

	};

	// --------------------------------------------------------------------------
	// Resizes the canvas to stay in sync with the root element
	// --------------------------------------------------------------------------

	Crossfade.prototype.resize = function () {
		
		// Unset the resize flag so this method doesn't
		// run unnecessarily.
		this.needsResize = false;
		
		// Set the width and height of the canvas to match
		// the cached width and height. The cached width 
		// and height are updated on window resize events.
		this.canvas[0].width = this.width;
		this.canvas[0].height = this.height;
		this.canvas.css({
			width: this.width,
			height: this.height
		});
		
	};

	// --------------------------------------------------------------------------
	// The draw loop: draws both of our images into the canvas, mixing them
	// together based on the “visibility” of our element in the screen.
	// --------------------------------------------------------------------------

	Crossfade.prototype.draw = function () {
		
		var dimensions;

		// If the dimensions of the element have changed since
		// the last draw loop then trigger a resize.
		if (this.needsResize) {
			this.resize();
		}

		// Get the size at which to draw the image into the canvas. The
		// dimensions are calculated based on the background position options.
		dimensions = this.getDrawDimensions(
			this.start[0].width,
			this.start[0].height,
			this.width,
			this.height
		);

		// Draw the starting image…
		this.paintbrush.drawImage(this.start[0], dimensions.offset.x, dimensions.offset.y, dimensions.width, dimensions.height);
		
		// Set the global opacity based on the visibility of our element…
		this.paintbrush.globalAlpha = this.visibility;
		
		// Draw the ending image over the top, with the opacity
		this.paintbrush.drawImage(this.end[0], dimensions.offset.x, dimensions.offset.y, dimensions.width, dimensions.height);
		
		// And then reset the global opacity
		this.paintbrush.globalAlpha = 1;

		// Indicate that the draw loop has completed and allow more to be requested
		this.ticking = false;

	};

	// --------------------------------------------------------------------------
	// Given the width and height of the images and their container, calculate
	// the positions at which to draw the images in the canvas. This
	// implementation mimics the behavior of the CSS “background-size” property.
	// --------------------------------------------------------------------------

	Crossfade.prototype.getDrawDimensions = function (imageWidth, imageHeight, containerWidth, containerHeight) {
		
		var dimensions = {};
		var imageRatio = imageHeight / imageWidth;
		var containerRatio = containerHeight / containerWidth;

		if (containerRatio > imageRatio) {
			dimensions.width = parseInt(containerHeight / imageRatio);
			dimensions.height = parseInt(containerHeight);
		} else {
			dimensions.width = parseInt(containerWidth);
			dimensions.height = parseInt(containerWidth * imageRatio);
		}

		dimensions.offset = {};

		switch (this.options.backgroundPositionY) {
			case 'top':
				dimensions.offset.y = 0;
				break;
			case 'bottom':
				dimensions.offset.y = (dimensions.height - containerHeight) * -1;
				break;
			case 'center':
				// falls through
			default:
				dimensions.offset.y = (dimensions.height - containerHeight) / -2;
				break;
		}

		switch (this.options.backgroundPositionX) {
			case 'left':
				dimensions.offset.x = 0;
				break;
			case 'right':
				dimensions.offset.x = (dimensions.width - containerWidth) * -1;
				break;
			case 'center':
				// falls through
			default: 
				dimensions.offset.x = (dimensions.width - containerWidth) / -2;
				break;
		}

		return dimensions;

	};

	// --------------------------------------------------------------------------
	// A scroll handler, called whenever a “scroll” event 
	// is triggered on the window element. This method is
	// responsible for calculating the “visibility” of the
	// element on the page, a number from 0 to 1.
	// --------------------------------------------------------------------------

	Crossfade.prototype.onScroll = function () {

		var scrollTop = $(window).scrollTop();
    var elementOffsetTop = this.el.offset().top;
    var elementHeight = this.el.height();
    var percentage;

    // An element is either…

    // a) Off-screen, below the viewport
    if (elementOffsetTop > scrollTop) {
    	percentage = 0;

    // b) Off-screen, above the viewport
    } else if ((elementOffsetTop + elementHeight) < scrollTop) {
    	percentage = 1;

    // c) Somewhere on screen, at least partly. The percentage
		// calculated here is affected by the “threshold” option. The
		// value of “threshold” (0 to 1) determines how much of the element
		// should be offscreen when the crossfade completes. 
    } else {
      percentage = (scrollTop - elementOffsetTop) / (elementHeight * this.options.threshold);
    }

    // With the percentage calculated here, update the
    // “visibility” of our instance.
		this.visibility = percentage;
			
		// Request a draw frame so we can update the crossfade ratio
		this.requestTick();

	};

	// --------------------------------------------------------------------------
	// A resize handler, called whenever a “resize” event
	// is triggered on the window element.
	// -------------------------------------------------------------------------- 
	
	Crossfade.prototype.onResize = function () {
		
		// Mark this instance for resizing on the next draw loop
		this.needsResize = true;

		// Update the cached width and height
		this.width = this.el.width();
		this.height = this.el.height();

		// Request a draw frame so we can update the size of our canvas
		this.requestTick();

	};

	// --------------------------------------------------------------------------
	// Requests another draw loop
	// --------------------------------------------------------------------------

	Crossfade.prototype.requestTick = function () {
		
		var self = this;

		// If we aren't already in the middle of a draw loop,
		// request another frame.
		if (!this.ticking) {
			window.requestAnimFrame(function () {
				self.draw();
			});
		}

		// Indicate that we've requested a frame
		this.ticking = true;

	};

	// --------------------------------------------------------------------------
	// Register plugin with jQuery and set up a constructor
	// --------------------------------------------------------------------------

	$.extend($.fn, {

		crossfade: function (options) {

			var opts = $.extend({}, $.fn.crossfade.defaults, options);

			return this.each(function () {

				$(this).data('crossfade', new Crossfade(this, opts));
				return this;

			});

		}

	});

	// --------------------------------------------------------------------------
	// Define default plugin options. 
	// --------------------------------------------------------------------------
	
	$.fn.crossfade.defaults = {
		backgroundPosition: 'center center',
		threshold: 0.5
	};

	// --------------------------------------------------------------------------
	// Polyfill window.requestAnimationFrame
	// --------------------------------------------------------------------------
	window.requestAnimFrame = (function(){
  	return  window.requestAnimationFrame       ||
          	window.webkitRequestAnimationFrame ||
          	window.mozRequestAnimationFrame    ||
          	function( callback ){
            	window.setTimeout(callback, 1000 / 60);
          	};
	})();

}));