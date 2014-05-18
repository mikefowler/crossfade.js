/* global define */
(function (factory) {

	'use strict';

	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else {
		factory(window.jQuery || window.Zepto);
	}

}(function ($) {

	'use strict';

	function Crossfade (el, options) {
		var self = this;

		if (options.debug === true) {
			console.groupCollapsed('Crossfade#init');
			console.debug('Element: ', el);
			console.debug('Options: ', options);
			console.groupEnd();
		}

		self.el = $(el).css({ position: 'relative' });
		self.options = options;
		self.width = self.el.width();
		self.height = self.el.height();
		self.canvas = $('<canvas>').appendTo(self.el);
		self.paintbrush = self.canvas[0].getContext('2d');

		if (self.options.backgroundPosition) {
			var position = self.options.backgroundPosition.split(' ');
			self.options.backgroundPositionX = position[0];
			self.options.backgroundPositionY = position[1];
			delete self.options.backgroundPosition;
		}

		self.getSources(function () {
			$(window).on('scroll', $.proxy(self.onScroll, self));
			$(window).on('resize', $.proxy(self.onResize, self));

			self.resize();
			$(window).trigger('scroll');
		});
		
	}

	Crossfade.prototype.getSources = function (callback) {
		var start = this.options.image || this.el.data('image-start');
		var end = this.options.imageBlurred || this.el.data('image-end');

		if (!start || !end) {
			throw new Error('Crossfade requires two images');
		}

		// Create DOM elements (but don't insert them) in
		// order to facilitate preloading the images
		this.start = $('<img>').attr({ src: start });
		this.end = $('<img>').attr({ src: end });

		var sources = [this.start, this.end];
		var remaining = sources.length;

		// For each of the source images…
		for (var i = 0; i < sources.length; i++) {
			
			// Listen for the load event and call the
			// callback if both images have loaded.
			sources[i].on('load', function() {
	    	remaining--;
	      if (remaining === 0) {
	      	if (typeof callback === 'function') {
	      		callback();
	      	}
	      }
	    });

	    // If any of the images are cached, force trigger a load event
	    if (sources[i].prop('complete')) {
	    	sources[i].trigger('load');
	    }
	  }

	};

	Crossfade.prototype.resize = function () {
		this.needsResize = false;
		this.canvas[0].width = this.width;
		this.canvas[0].height = this.height;
		this.canvas.css({
			position: 'absolute',
			top: '0',
			left: '0',
			width: this.width,
			height: this.height
		});
	};

	Crossfade.prototype.draw = function (mix) {
		var dimensions;

		// If the dimensions of the viewport have changed since
		// the last draw then trigger a resize
		if (this.needsResize) {
			this.resize();
		}

		// Get the size at which to draw the image into the canvas
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

		// Indicate that the draw loops has completed and allow more to be requested
		this.ticking = false;
	};

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

		dimensions.offset = {
			x: 0,
			y: 0
		};

		if (this.options.backgroundPositionY && dimensions.height > containerHeight) {
			switch (this.options.backgroundPositionY) {
				case 'center':
					dimensions.offset.y = (dimensions.height - containerHeight) / -2;
					break;
				case 'bottom':
					dimensions.offset.y = (dimensions.height - containerHeight) * -1;
					break;
			}
		}

		if (this.options.backgroundPositionX && dimensions.width > containerWidth) {
			switch (this.options.backgroundPositionX) {
				case 'center': 
					dimensions.offset.x = (dimensions.width - containerWidth) / -2;
					break;
				case 'right':
					dimensions.offset.x = (dimensions.width - containerWidth) * -1;
					break;
			}
		}

		if (this.options.debug === true) {
			console.groupCollapsed('Crossfade#getDrawSize', this.el[0]);
			console.debug('Width: ', dimensions.width);
			console.debug('Height: ', dimensions.height);
			console.debug('Offset X: ', dimensions.offset.x);
			console.debug('Offset Y: ', dimensions.offset.y);
			console.groupEnd();
		}

		return dimensions;
	};

	Crossfade.prototype.onScroll = function () {
		var scrollTop = $(window).scrollTop();
    var elementOffsetTop = this.el.offset().top;
    var elementHeight = this.el.height();
    var percentage;

    if (elementOffsetTop > scrollTop) {
    	percentage = 0;
    } else if ((elementOffsetTop + elementHeight) < scrollTop) {
    	percentage = 1;
    } else {
      percentage = (scrollTop - elementOffsetTop) / (elementHeight * this.options.distance);
    }

		this.visibility = percentage;
		
		if (this.options.debug === true) {
			console.group('Crossfade#onScroll');
			console.debug('visibility: ', this.visibility);
			console.groupEnd();
		}

		this.requestTick();
	};

	Crossfade.prototype.onResize = function () {
		this.needsResize = true;
		this.width = this.el.width();
		this.height = this.el.height();
		this.requestTick();
	};

	Crossfade.prototype.requestTick = function () {
		var self = this;

		// If there isn't already a request out for a frame
		if (!this.ticking) {
			requestAnimationFrame(function () {
				self.draw();
			});
		}

		// Indicate that we have now put out a request for a frame
		this.ticking = true;
	};

	$.extend($.fn, {

		crossfade: function (options) {

			var opts = $.extend({}, $.fn.crossfade.defaults, options);

			return this.each(function () {

				$(this).data('crossfade', new Crossfade(this, opts));
				return this;

			});

		}

	});

	$.fn.crossfade.defaults = {

	};

}));