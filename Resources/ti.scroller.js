function main() {
	const scroller = this;

	let platformWidth = Ti.Platform.displayCaps.platformWidth;
	const logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
	let deviceWidth = (OS_IOS) ? platformWidth : Math.round(platformWidth / logicalDensityFactor);

	let random;
	let messages;
	let duration;
	let _delay = 0;
	let _stop = false;
	let currentMessage = -1;

	let animation = Ti.UI.createAnimation({
		curve: Ti.UI.ANIMATION_CURVE_LINEAR
	});
	animation.addEventListener('complete', function() {
		if (!_stop) {
			setTimeout(() => {
				scroller.animate();
			}, _delay);
		}
	});

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

	let scrollerView = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.SIZE
	});

	let scrollerLabel = Ti.UI.createLabel({
		right: deviceWidth,
		height: Ti.UI.SIZE,
	});

	let sideLabel = Ti.UI.createLabel({
		left: 0,
		width: Ti.UI.SIZE,
		verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
	});

	scrollerView.add(scrollerLabel);

	scroller.view = function() {
		return scrollerView;
	}

	scroller.init = function(_args) {
		random = _args.random ?? false;
		_delay = _args.delay ? _args.delay * 1000 : 0;
		duration = _args.duration ? _args.duration * 10 : 30;
		messages = Array.isArray(_args.messages) ? _args.messages : [_args.messages];

		if (random) {
			messages = messages.sort(() => Math.random() - 0.5);
		}

		if (_args.label) {
			sideLabel.applyProperties({
				left: 0,
				width: Ti.UI.SIZE,
				text: `  ${_args.label}  `,
				height: _args.height ?? 28,
				color: _args.color ?? '#fff',
				verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
				font: { fontSize: _args.fontSize ?? 14, fontWeight: 'bold' },
				backgroundColor: ColorLuminance(_args.backgroundColor, -0.15),
				viewShadowOffset: { x: 3, y: 0 }, viewShadowRadius: 3, viewShadowColor: '#80000000'
			});

			scrollerView.add(sideLabel);
		}

		scrollerView.applyProperties({
			top: _args.top ?? undefined,
			height: _args.height ?? 28,
			backgroundColor: _args.backgroundColor ?? '#53606b'
		});

		scrollerLabel.applyProperties({
			color: _args.color ?? '#fff',
			height: _args.height ?? 28,
			font: { fontSize: _args.fontSize ?? 14, fontWeight: _args.fontWeight ?? 'normal' }
		});
	};

	scroller.updateMessage = function(_messages) {
		currentMessage = -1;
		messages = Array.isArray(_messages) ? _messages : [_messages];

		if (random) {
			messages = messages.sort(() => Math.random() - 0.5);
		}
	};

	scroller.updateBackground = function(_backgroundColor) {
		scrollerView.animate({
			duration: 250,
			backgroundColor: _backgroundColor ?? '#53606b'
		});

		sideLabel.animate({
			duration: 250,
			backgroundColor: ColorLuminance(_backgroundColor ?? '#53606b', -0.15)
		});
	};

	scroller.animate = function() {
		(currentMessage < messages.length - 1) ? currentMessage++ : currentMessage = 0;

		// Just to recalculate the width of the new text
		let _label = Ti.UI.createLabel({
			height: Ti.UI.SIZE,
			text: messages[currentMessage],
			font: { fontSize: scrollerLabel.font.fontSize ?? 14, fontWeight: scrollerLabel.font.fontWeight ?? 'normal' }
		});

		let width = Math.round(1 + _label.toImage().width / logicalDensityFactor);

		scrollerLabel.applyProperties({
			width: width,
			left: deviceWidth,
			text: messages[currentMessage],
		});

		animation.applyProperties({
			left: -parseInt(width),
			duration: width * duration,
		});

		scrollerLabel.animate(animation);
	};

	scroller.resume = function() {
		if (_stop) {
			_stop = false;
			scroller.animate();
		}
	}

	scroller.stop = function() {
		_stop = true;
	};
}
module.exports = main;

// !	http://www.sitepoint.com/javascript-generate-lighter-darker-color/
/*
|-------------------------------------------------------------------------------
|	ColorLuminance(hex, lum)
|-------------------------------------------------------------------------------
*/
function ColorLuminance(hex, lum) {
	// validate hex string
	hex = String(hex).replace(/[^0-9a-f]/gi, '');
	if (hex.length < 6) {
		hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
	}
	lum = lum || 0;
	// convert to decimal and change luminosity
	let rgb = '#',
		c, i;
	for (i = 0; i < 3; i++) {
		c = parseInt(hex.substr(i * 2, 2), 16);
		c = Math.round(Math.min(Math.max(0, c + c * lum), 255)).toString(16);
		rgb += ('00' + c).substr(c.length);
	}
	return rgb;
}
