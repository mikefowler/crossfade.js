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

	function Cover (el, options) {
		console.group('Crossfade#init');
		console.debug('Element: ', el);
		console.debug('Options: ', options);
		console.groupEnd();

		var self = this;

		self.el = $(el);
		self.options = options;
		self.width = self.el.width();
		self.height = self.el.height();
		self.canvas = $('<canvas>').appendTo(self.el);
		self.paintbrush = self.canvas[0].getContext('2d');

		self.getSources(function () {
			$(window).on('scroll', $.proxy(self.onScroll, self));
			$(window).on('resize', $.proxy(self.onResize, self));
			$(window).trigger('scroll');
		});
		
	}

	Cover.prototype.getSources = function (callback) {
		var start = this.options.image || this.el.data('image-start');
		var end = this.options.imageBlurred || this.el.data('image-end');

		if (!start || !end) {
			throw new Error('Crossfade requires two images');
		}

		this.start = $('<img>').attr({ src: start });
		this.end = $('<img>').attr({ src: end });

		var sources = [this.start, this.end];
		var remaining = sources.length;

		for (var i = 0; i < sources.length; i++) {
			sources[i].on('load', function() {
	    	remaining--;
	      if (remaining === 0) {
	      	if (typeof callback === 'function') {
	      		callback();
	      	}
	      }
	    });
	  }

	};

	Cover.prototype.resize = function () {
		this.canvas[0].width = this.el.width();
		this.canvas[0].height = this.el.height();
		this.canvas.css({
			position: 'absolute',
			top: '0',
			left: '0',
			width: this.el.width(),
			height: this.el.height()
		});
	};

	Cover.prototype.draw = function (mix) {
		this.ticking = false;

		this.resize();

		var drawWidth;
		var drawHeight;

		var image = {
			width: this.start[0].width,
			height: this.start[0].height
		};

		var container = {
			width: this.width,
			height: this.height
		};

		var imageRatio = image.height / image.width;
		var containerRatio = container.height / container.width;

		if (containerRatio > imageRatio) {
			drawWidth = container.height / imageRatio;
			drawHeight = container.height;
		} else {
			drawWidth = container.width;
			drawHeight = container.width * imageRatio;
		}

		console.group('Draw Canvas');
		console.debug('Width: ', drawWidth);
		console.debug('Height: ', drawHeight);
		console.groupEnd();

		this.paintbrush.drawImage(this.start[0], 0, 0, drawWidth, drawHeight);
		this.paintbrush.globalAlpha = this.visibility;
		this.paintbrush.drawImage(this.end[0], 0, 0, drawWidth, drawHeight);
		this.paintbrush.globalAlpha = 1;
	};

	Cover.prototype.onScroll = function () {
		this.visibility = Math.max(0, Math.min(1, $(window).scrollTop() / (this.height * 0.5)));
		this.requestTick();
	};

	Cover.prototype.onResize = function () {
		this.width = this.el.width();
		this.height = this.el.height();
		this.requestTick();
	};

	Cover.prototype.requestTick = function () {
		var self = this;

		if (!this.ticking) {
			requestAnimationFrame(function () {
				self.draw();
			});
		}

		this.ticking = true;
	};

	$.extend($.fn, {

		crossfade: function (options) {

			var opts = $.extend({}, $.fn.crossfade.defaults, options);

			return this.each(function () {

				$(this).data('crossfade', new Cover(this, opts));
				return this;

			});

		}

	});

	$.fn.crossfade.defaults = {

	};

}));