let scrollingViewCount = 1;
let scrollingViewsArray = [];

// Device values
let platformWidth = Ti.Platform.displayCaps.platformWidth;
let logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
let deviceWidth = (OS_IOS) ? platformWidth : Math.round(platformWidth / logicalDensityFactor);

function ScrollingView(_args) {
	let _scrollingView = this;

	if (!_args) return false;

	// !Testing Some Events: EXPERIMENTAL
	let event = {
		paused: (source) => { },
		resumed: (source) => { },
		complete: (source) => { },
	}

	// Attributes
	let debug = _args.debug ?? false;
	let random = _args.random ?? false;
	let autoplay = _args.autoplay ?? true;
	let speed = _args.speed ? _args.speed * 10 : 50;
	let id = _args.id ?? '__tiScrollingViewId' + scrollingViewCount++;
	let delay = _args.delay ? _args.delay * 1000 : 0;
	let name = _args.name ?? id;
	let messages = Array.isArray(_args.messages) ? _args.messages : _args.messages ? [_args.messages] : [];

	if (_args.message) {
		messages = Array.isArray(_args.message) ? _args.message : _args.message ? [_args.message] : [];
	}

	// Local settings
	let sideLabel;
	let paused = false;
	let currentMessage = -1;
	let animationStatus = 'completed';
	let defaultBackgroundColor = '#BF000000';
	let backgroundColor = _args.backgroundColor ?? defaultBackgroundColor;

	// The main Animation
	let animation = Ti.UI.createAnimation({
		curve: Ti.UI.ANIMATION_CURVE_LINEAR
	});

	animation.addEventListener('complete', () => {
		logger('Complete event');
		event.complete(this);

		animationStatus = 'completed';

		if (!paused) {
			setTimeout(() => {
				_scrollingView.play();
			}, delay);
		}
	});

	animation.addEventListener('start', () => {
		animationStatus = 'playing';
	});

	// Methods
	_scrollingView.update = function(_args) {
		logger('Update method');

		// Reset Background Color
		backgroundColor = _args.backgroundColor ?? mainScrollingView.backgroundColor;

		// Update Random
		if (_args.random) {
			random = true;
			messages = messages.sort(() => Math.random() - 0.5);
		}

		// Update Delay
		if (_args.delay >= 0) {
			delay = _args.delay * 1000;
		}

		// Update Speed
		if (_args.speed >= 0) {
			speed = _args.speed * 10;
		}

		// debug mode
		debug = _args.debug ?? debug;

		// name
		name = _args.name ?? name;

		autoplay = _args.autoplay ?? autoplay;

		// height
		_args.height = _args.height ?? mainScrollingView.height;

		// fontSize
		if (!_args.font) {
			_args.font = {
				fontSize: scrollingLabel.font.fontSize,
				fontFamily: scrollingLabel.font.fontFamily,
				fontWeight: scrollingLabel.font.fontWeight,
			}
		} else {
			_args.font.fontSize = _args.font.fontSize ?? scrollingLabel.font.fontSize;
			_args.font.fontFamily = _args.font.fontFamily ?? scrollingLabel.font.fontFamily;
			_args.font.fontWeight = _args.font.fontWeight ?? scrollingLabel.font.fontWeight;
		}

		// Update Scrolling View Label Properties
		applyPropertiesToScrollingLabel(_args);

		// Update Side Label Properties
		applyPropertiesToSideLabel(_args, 250);

		// Update Scrolling View Properties
		applyPropertiesToMainScrollingView(_args, 250);

		// Update Messages
		if (_args.messages) {
			_scrollingView.updateMessages(_args.messages);
		} else if (_args.message) {
			_scrollingView.updateMessages(_args.message);
		}
	}

	_scrollingView.updateMessages = function(_messages) {
		if (_messages === undefined || _messages === '') return false;

		logger('Update messages method');

		currentMessage = -1;
		messages = Array.isArray(_messages) ? _messages : [_messages];

		if (random) {
			messages = messages.sort(() => Math.random() - 0.5);
		}

		if (autoplay && !paused) {
			_scrollingView.play();
		}
	}

	_scrollingView.updateMessage = _scrollingView.updateMessages;

	_scrollingView.updateBackground = function(_backgroundColor) {
		logger('Update backgorund method');

		backgroundColor = _backgroundColor;

		if (sideLabel) {
			sideLabel.animate({
				duration: 250,
				backgroundColor: colorLuminance(backgroundColor, -0.20)
			});
		}

		mainScrollingView.animate({
			duration: 250,
			backgroundColor: backgroundColor
		});
	};

	_scrollingView.updateLabel = function(_label) {
		if (_label && sideLabel) {
			sideLabel.applyProperties({
				text: `  ${_label}  `,
			});
		}
	}

	_scrollingView.getView = function() {
		return mainScrollingView;
	}

	_scrollingView.play = function() {
		if (animationStatus === 'completed') {
			paused = false;
			play();
		}
	}

	_scrollingView.animate = function() {
		logger('`animate()` method is DEPRECATED: Will be deleted in v.2.0.0', true);
	}

	_scrollingView.pause = function() {
		logger('Pause method');
		event.paused(this);

		paused = true;
	}

	_scrollingView.resume = function() {
		logger('Resume method');
		event.resumed(this);

		paused = false;

		_scrollingView.play();
	}

	// Main View
	let mainScrollingView = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.SIZE
	});

	let scrollingLabel = Ti.UI.createLabel({
		height: Ti.UI.SIZE,
		right: deviceWidth
	});

	mainScrollingView.add(scrollingLabel);

	// Expose Methods for Alloy Projects
	mainScrollingView.play = _scrollingView.play;
	mainScrollingView.pause = _scrollingView.pause;
	mainScrollingView.resume = _scrollingView.resume;
	mainScrollingView.update = _scrollingView.update;
	mainScrollingView.updateLabel = _scrollingView.updateLabel;
	mainScrollingView.updateMessage = _scrollingView.updateMessage;
	mainScrollingView.updateMessages = _scrollingView.updateMessages;
	mainScrollingView.updateBackground = _scrollingView.updateBackground;

	// !DEPRECATED: Will be deleted in v.2.0.0
	mainScrollingView.animate = _scrollingView.animate;

	if (_args.shadow) {
		mainScrollingView.applyProperties({
			viewShadowOffset: { x: 0, y: 2 }, viewShadowRadius: 4, viewShadowColor: defaultBackgroundColor
		});
	}

	// More Properties
	if (random) {
		messages = messages.sort(() => Math.random() - 0.5);
	}

	// Optional sidelabel
	if (_args.label) {
		addSidelabel(_args);
	}

	applyPropertiesToScrollingLabel(_args);

	applyPropertiesToMainScrollingView(_args);

	if (_args.autoplay || _args.message || _args.messages) {
		_scrollingView.play();
	}

	// !Helper Functions
	function play() {
		if (messages.length && autoplay) {
			logger('Play method');

			(currentMessage < messages.length - 1) ? currentMessage++ : currentMessage = 0;

			// Just to recalculate the width of the new text
			let _label = Ti.UI.createLabel({
				height: Ti.UI.SIZE,
				text: messages[currentMessage],
				font: { fontFamily: scrollingLabel.font.fontFamily ?? undefined, fontSize: scrollingLabel.font.fontSize ?? '14dp', fontWeight: scrollingLabel.font.fontWeight ?? 'normal' }
			});

			let width = Math.round(1 + _label.toImage().width / logicalDensityFactor);

			scrollingLabel.applyProperties({
				width: width,
				left: deviceWidth,
				text: messages[currentMessage],
			});

			animation.applyProperties({
				left: -parseInt(width),
				duration: 1000 * ((width + deviceWidth) / speed),
			});

			// timeout in order to prevent this Warning:
			// [WARN]  New layout set while view [object TiUILabel] animating: Will relayout after animation.
			setTimeout(() => {
				scrollingLabel.animate(animation);
			}, 500);
		}
	}

	function addSidelabel(_args) {
		logger('Add side label');

		sideLabel = Ti.UI.createLabel({
			left: 0,
			width: Ti.UI.SIZE,
			verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
			viewShadowOffset: { x: 4, y: 0 }, viewShadowRadius: 4, viewShadowColor: defaultBackgroundColor
		});

		applyPropertiesToSideLabel(_args);

		mainScrollingView.add(sideLabel);
	}

	function applyPropertiesToMainScrollingView(_args, duration = 0) {
		logger('Apply properties to scrolling view');

		if (duration) {
			mainScrollingView.animate({
				duration: duration,
				height: _args.height ?? 28,
				top: _args.top ?? undefined,
				backgroundColor: backgroundColor,
				bottom: _args.bottom ?? undefined
			});
		} else {
			mainScrollingView.applyProperties({
				height: _args.height ?? 28,
				top: _args.top ?? undefined,
				backgroundColor: backgroundColor,
				bottom: _args.bottom ?? undefined
			});
		}
	}

	function applyPropertiesToScrollingLabel(_args) {
		logger('Apply properties to scrolling view’s label');

		scrollingLabel.applyProperties({
			height: _args.height ?? 28,
			color: _args.color ?? '#fff',
			font: { fontFamily: (_args.font && _args.font.fontFamily) ?? undefined, fontSize: (_args.font && _args.font.fontSize) ?? '14dp', fontWeight: (_args.font && _args.font.fontWeight) ?? 'normal' }
		});
	}

	function applyPropertiesToSideLabel(_args, duration = 0) {
		logger('Apply properties to side label');

		if (sideLabel) {
			if (duration) {
				applyPropertiesToSideLabelWithAnimation(_args, duration);
			} else {
				sideLabel.applyProperties({
					height: _args.height ?? 28,
					color: _args.color ?? '#fff',
					backgroundColor: colorLuminance(backgroundColor, -0.20),
					text: _args.label === '' ? '' : (_args.label === undefined) ? sideLabel.text : `  ${_args.label}  `,
					font: { fontFamily: (_args.font && _args.font.fontFamily) ?? undefined, fontSize: (_args.font && _args.font.fontSize) ?? '14dp', fontWeight: 'bold' },
				});
			}
		} else {
			addSidelabel(_args);
		}
	}

	function applyPropertiesToSideLabelWithAnimation(_args, duration = 0) {
		logger('Apply properties to side label with animation');

		sideLabel.applyProperties({
			text: _args.label === '' ? '' : (_args.label === undefined) ? sideLabel.text : `  ${_args.label}  `,
			font: { fontFamily: (_args.font && _args.font.fontFamily) ?? undefined, fontSize: (_args.font && _args.font.fontSize) ?? '14dp', fontWeight: 'bold' }
		});

		sideLabel.animate({
			duration: duration,
			height: _args.height ?? 28,
			color: _args.color ?? '#fff',
			backgroundColor: colorLuminance(backgroundColor, -0.20),
		});
	}

	function logger(_message, forceLog = false) {
		if (debug || forceLog) console.warn(`:: ti.scroller :: ${name}: ${_message}`);
	}

	scrollingViewsArray.push(mainScrollingView);

	return _scrollingView;
}
module.exports = ScrollingView;

// !Event Orientation Change Listener
Ti.Gesture.addEventListener('orientationchange', (e) => {
	if (e.orientation === Ti.UI.PORTRAIT || e.orientation === Ti.UI.UPSIDE_PORTRAIT || e.orientation === Ti.UI.LANDSCAPE_LEFT || e.orientation === Ti.UI.LANDSCAPE_RIGHT) {
		if (e.orientation === Ti.UI.PORTRAIT || e.orientation === Ti.UI.UPSIDE_PORTRAIT) {
			platformWidth = Ti.Platform.displayCaps.platformWidth;
		} else if (e.orientation === Ti.UI.LANDSCAPE_LEFT || e.orientation === Ti.UI.LANDSCAPE_RIGHT) {
			platformWidth = (OS_IOS) ? Ti.Platform.displayCaps.platformWidth : Ti.Platform.displayCaps.platformHeight;
		}

		deviceWidth = (OS_IOS) ? platformWidth : Math.round(platformWidth / logicalDensityFactor);
	}
});

Ti.App.addEventListener('paused', function() {
	scrollingViewsArray.forEach(_scrollingView => {
		_scrollingView.pause();
	});
});

Ti.App.addEventListener('resume', function() {
	scrollingViewsArray.forEach(_scrollingView => {
		_scrollingView.resume();
	});
});

function colorLuminance(_hex, _lum) {
	// validate _hex string
	_hex = String(_hex).replace(/[^0-9a-f]/gi, '');
	if (_hex.length < 6) {
		_hex = _hex[0] + _hex[0] + _hex[1] + _hex[1] + _hex[2] + _hex[2];
	}
	_lum = _lum || 0;
	// convert to decimal and change luminosity
	let rgb = '#',
		c, i;
	for (i = 0; i < 3; i++) {
		c = parseInt(_hex.substr(i * 2, 2), 16);
		c = Math.round(Math.min(Math.max(0, c + c * _lum), 255)).toString(16);
		rgb += ('00' + c).substr(c.length);
	}
	return rgb;
}

// ScrollingView Component for Alloy Projects
module.exports.createScrollingView = (args) => {
	return new ScrollingView(args).getView();
};
