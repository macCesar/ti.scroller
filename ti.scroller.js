function Scroller(_args) {
	let scroller = this;

	if (!_args) return false;

	// Testing Some Events
	let event = {
		paused: (source) => { },
		resumed: (source) => { },
		complete: (source) => { },
	}

	// Device values
	let platformWidth = Ti.Platform.displayCaps.platformWidth;
	let logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
	let deviceWidth = (OS_IOS) ? platformWidth : Math.round(platformWidth / logicalDensityFactor);

	// Attributes
	let name = _args.name ?? '';
	let random = _args.random ?? false;
	let speed = _args.speed ? _args.speed * 10 : 50;
	let delay = _args.delay ? _args.delay * 1000 : 0;
	let messages = Array.isArray(_args.messages) ? _args.messages : _args.messages ? [_args.messages] : [];

	if (_args.message) {
		messages = Array.isArray(_args.message) ? _args.message : [_args.message];
	}

	if (messages.length === 0) {
		let defaultMessage = ':: ti.scroller :: You need to set at least one text message when creating the scroller!';
		messages = [defaultMessage];
		Ti.API.error(defaultMessage);
	}

	// Local settings
	let sideLabel;
	let paused = false;
	let currentMessage = -1;
	let defaultBackgroundColor = '#BF000000';
	let backgroundColor = _args.backgroundColor ?? defaultBackgroundColor;

	// The main Animation
	let animation = Ti.UI.createAnimation({
		curve: Ti.UI.ANIMATION_CURVE_LINEAR
	});

	animation.addEventListener('complete', () => {
		event.complete(this);

		if (!paused) {
			setTimeout(() => {
				scroller.animate();
			}, delay);
		}
	});

	// Methods
	scroller.update = function(_args) {
		// Reset Background Color
		backgroundColor = _args.backgroundColor ?? mainScrollerView.backgroundColor;

		// Update Messages
		if (_args.messages) {
			scroller.updateMessages(_args.messages);
		} else if (_args.message) {
			scroller.updateMessages(_args.message);
		}

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

		// height
		_args.height = _args.height ?? mainScrollerView.height;

		// fontSize
		if (!_args.font) {
			_args.font = {
				fontSize: scrollerLabel.font.fontSize,
				fontFamily: scrollerLabel.font.fontFamily,
				fontWeight: scrollerLabel.font.fontWeight,
			}
		} else {
			_args.font.fontSize = _args.font.fontSize ?? scrollerLabel.font.fontSize;
			_args.font.fontFamily = _args.font.fontFamily ?? scrollerLabel.font.fontFamily;
			_args.font.fontWeight = _args.font.fontWeight ?? scrollerLabel.font.fontWeight;
		}

		// Update Scroller View Properties
		applyPropertiesToScroller(_args, 250);

		// Update Scroller Label Properties
		applyPropertiesToScrollerLabel(_args);

		// Update Side Label Properties
		applyPropertiesToSideLabel(_args, 250);
	}

	scroller.updateMessages = function(_messages) {
		currentMessage = -1;
		messages = Array.isArray(_messages) ? _messages : [_messages];

		if (random) {
			messages = messages.sort(() => Math.random() - 0.5);
		}
	}

	scroller.updateBackground = function(_backgroundColor) {
		backgroundColor = _backgroundColor;

		if (sideLabel) {
			sideLabel.animate({
				duration: 250,
				backgroundColor: colorLuminance(backgroundColor, -0.20)
			});
		}

		mainScrollerView.animate({
			duration: 250,
			backgroundColor: backgroundColor
		});
	};

	scroller.updateLabel = function(_label) {
		if (_label && sideLabel) {
			sideLabel.applyProperties({
				text: `  ${_label}  `,
			});
		}
	}

	scroller.getView = function() {
		return mainScrollerView;
	}

	scroller.animate = function() {
		(currentMessage < messages.length - 1) ? currentMessage++ : currentMessage = 0;

		// Just to recalculate the width of the new text
		let _label = Ti.UI.createLabel({
			height: Ti.UI.SIZE,
			text: messages[currentMessage],
			font: { fontFamily: scrollerLabel.font.fontFamily ?? undefined, fontSize: scrollerLabel.font.fontSize ?? '14dp', fontWeight: scrollerLabel.font.fontWeight ?? 'normal' }
		});

		let width = Math.round(1 + _label.toImage().width / logicalDensityFactor);

		scrollerLabel.applyProperties({
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
			scrollerLabel.animate(animation);
		}, 100);
	}

	scroller.pause = function() {
		paused = true;
		event.paused(this);
	}

	scroller.resume = function() {
		if (paused) {
			paused = false;
			scroller.animate();
			event.resumed(this);
		}
	}

	// Main View
	let mainScrollerView = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.SIZE
	});

	// Expose Methods for Alloy Projets
	mainScrollerView.pause = scroller.pause;
	mainScrollerView.resume = scroller.resume;
	mainScrollerView.update = scroller.update;
	mainScrollerView.updateLabel = scroller.updateLabel;
	mainScrollerView.updateMessages = scroller.updateMessages;
	mainScrollerView.updateBackground = scroller.updateBackground;

	if (_args.shadow) {
		mainScrollerView.applyProperties({
			viewShadowOffset: { x: 0, y: 2 }, viewShadowRadius: 4, viewShadowColor: defaultBackgroundColor
		});
	}

	let scrollerLabel = Ti.UI.createLabel({
		height: Ti.UI.SIZE,
		right: deviceWidth
	});

	mainScrollerView.add(scrollerLabel);

	// More Properties
	if (random) {
		messages = messages.sort(() => Math.random() - 0.5);
	}

	// Optional sidelabel
	if (_args.label) {
		addSidelabel(_args);
	}

	applyPropertiesToScroller(_args);

	applyPropertiesToScrollerLabel(_args);

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

	// Helper Functions
	function addSidelabel(_args) {
		sideLabel = Ti.UI.createLabel({
			left: 0,
			width: Ti.UI.SIZE,
			verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
			viewShadowOffset: { x: 4, y: 0 }, viewShadowRadius: 4, viewShadowColor: defaultBackgroundColor
		});

		applyPropertiesToSideLabel(_args);

		mainScrollerView.add(sideLabel);
	}

	function applyPropertiesToScroller(_args, duration = 0) {
		if (duration) {
			mainScrollerView.animate({
				duration: duration,
				height: _args.height ?? 28,
				top: _args.top ?? undefined,
				bottom: _args.bottom ?? undefined,
				backgroundColor: backgroundColor
			});
		} else {
			mainScrollerView.applyProperties({
				height: _args.height ?? 28,
				top: _args.top ?? undefined,
				bottom: _args.bottom ?? undefined,
				backgroundColor: backgroundColor
			});
		}
	}

	function applyPropertiesToScrollerLabel(_args) {
		scrollerLabel.applyProperties({
			height: _args.height ?? 28,
			color: _args.color ?? '#fff',
			font: { fontFamily: (_args.font && _args.font.fontFamily) ?? undefined, fontSize: (_args.font && _args.font.fontSize) ?? '14dp', fontWeight: (_args.font && _args.font.fontWeight) ?? 'normal' }
		});
	}

	function applyPropertiesToSideLabel(_args, duration = 0) {
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

	return scroller;
}
module.exports = Scroller;

module.exports.createView = (args) => {
	if (args.message) {
		args.message = args.message.split('|');
	} else if (args.messages) {
		args.messages = args.messages.split('|');
	} else {
		args.message = ':: ti.scroller :: You need to set at least one text message when creating the scroller!';
		Ti.API.error(args.message);
	}

	let alloyScrollerView = new Scroller(args);

	alloyScrollerView.animate();

	return alloyScrollerView.getView();
};
