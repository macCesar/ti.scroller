function main() {
	const scroller = this;

	const platformWidth = Ti.Platform.displayCaps.platformWidth;
	const logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
	const deviceWidth = (OS_IOS) ? platformWidth : Math.round(platformWidth / logicalDensityFactor);

	let messages;
	let duration;
	let _stop = false;
	let currentMessage = -1;

	let animation = Ti.UI.createAnimation({
		curve: Ti.UI.ANIMATION_CURVE_LINEAR
	});
	animation.addEventListener('complete', function() {
		if (!_stop) {
			scroller.animate();
		}
	});

	let scrollerView = Ti.UI.createView({
		width: Ti.UI.FILL,
		height: Ti.UI.SIZE
	});

	let scrollerLabel = Ti.UI.createLabel({
		top: 4,
		bottom: 4,
		right: deviceWidth,
		height: Ti.UI.SIZE,
	});

	scrollerView.add(scrollerLabel);

	scroller.view = function() {
		return scrollerView;
	}

	scroller.init = function(_args) {
		duration = _args.duration ?? 30;
		messages = Array.isArray(_args.messages) ? _args.messages : [_args.messages];

		scrollerView.applyProperties({
			top: _args.top ?? undefined,
			backgroundColor: _args.backgroundColor ?? '#80000000'
		});

		scrollerLabel.applyProperties({
			color: _args.color ?? '#fff',
			font: { fontSize: _args.fontSize ?? 14, fontWeight: _args.fontWeight ?? 'normal' }
		});
	};

	scroller.updateMessage = function(_messages) {
		currentMessage = -1;
		messages = Array.isArray(_messages) ? _messages : [_messages];
	};

	scroller.updateBackground = function(_backgroundColor) {
		scrollerView.applyProperties({
			backgroundColor: _backgroundColor ?? '#80000000'
		});
	};

	scroller.animate = function() {
		(currentMessage < messages.length - 1) ? currentMessage++ : currentMessage = 0;

		// Just to recalculate the width of the new text
		let _label = Ti.UI.createLabel({
			top: 4,
			bottom: 4,
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
