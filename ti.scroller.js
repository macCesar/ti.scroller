class Scroller {
	constructor(_args) {
		if (!_args) return false;

		// Testing Some Events
		this.event = {
			paused: (source) => { },
			resumed: (source) => { },
			complete: (source) => { },
		}

		// Device values
		this.platformWidth = Ti.Platform.displayCaps.platformWidth;
		this.logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
		this.deviceWidth = (OS_IOS) ? this.platformWidth : Math.round(this.platformWidth / this.logicalDensityFactor);

		// Aattributes
		this.name = _args.name ?? '';
		this.random = _args.random ?? false;
		this.speed = _args.speed ? _args.speed * 10 : 30;
		this.delay = _args.delay ? _args.delay * 1000 : 0;
		this.messages = Array.isArray(_args.messages) ? _args.messages : _args.messages ? [_args.messages] : [];
		if (_args.message) {
			this.messages = Array.isArray(_args.message) ? _args.message : [_args.message];
		}

		// Local settings
		this.paused = false;
		this.currentMessage = -1;
		this.defaultBackgroundColor = '#BF000000';
		this.backgroundColor = _args.backgroundColor ?? this.defaultBackgroundColor;

		// The main Animation
		this.animation = Ti.UI.createAnimation({
			curve: Ti.UI.ANIMATION_CURVE_LINEAR
		});

		this.animation.addEventListener('complete', () => {
			this.event.complete(this);

			if (!this.paused) {
				setTimeout(() => {
					this.animate();
				}, this.delay);
			}
		});

		// Main View
		this.scrollerView = Ti.UI.createView({
			width: Ti.UI.FILL,
			height: Ti.UI.SIZE
		});

		if (_args.shadow) {
			this.scrollerView.applyProperties({
				viewShadowOffset: { x: 0, y: 2 }, viewShadowRadius: 4, viewShadowColor: this.defaultBackgroundColor
			});
		}

		this.scrollerLabel = Ti.UI.createLabel({
			height: Ti.UI.SIZE,
			right: this.deviceWidth
		});

		this.scrollerView.add(this.scrollerLabel);

		// More Properties
		if (this.random) {
			this.messages = this.messages.sort(() => Math.random() - 0.5);
		}

		// Optional sidelabel
		if (_args.label) {
			this.addSidelabel(_args);
		}

		this.applyPropertiesToScroller(_args);

		this.applyPropertiesToScrollerLabel(_args);

		Ti.Gesture.addEventListener('orientationchange', (e) => {
			if (e.orientation === Ti.UI.PORTRAIT || e.orientation === Ti.UI.UPSIDE_PORTRAIT || e.orientation === Ti.UI.LANDSCAPE_LEFT || e.orientation === Ti.UI.LANDSCAPE_RIGHT) {
				if (e.orientation === Ti.UI.PORTRAIT || e.orientation === Ti.UI.UPSIDE_PORTRAIT) {
					this.platformWidth = Ti.Platform.displayCaps.platformWidth;
				} else if (e.orientation === Ti.UI.LANDSCAPE_LEFT || e.orientation === Ti.UI.LANDSCAPE_RIGHT) {
					this.platformWidth = (OS_IOS) ? Ti.Platform.displayCaps.platformWidth : Ti.Platform.displayCaps.platformHeight;
				}
				this.deviceWidth = (OS_IOS) ? this.platformWidth : Math.round(this.platformWidth / this.logicalDensityFactor);
			}
		});
	}

	// Events
	on(eventName, callback) {
		this.event[eventName] = callback;
	}

	// Methods
	getView() {
		return this.scrollerView;
	}

	animate() {
		(this.currentMessage < this.messages.length - 1) ? this.currentMessage++ : this.currentMessage = 0;

		// Just to recalculate the width of the new text
		let _label = Ti.UI.createLabel({
			height: Ti.UI.SIZE,
			text: this.messages[this.currentMessage],
			font: { fontFamily: this.scrollerLabel.font.fontFamily ?? undefined, fontSize: this.scrollerLabel.font.fontSize ?? '14dp', fontWeight: this.scrollerLabel.font.fontWeight ?? 'normal' }
		});

		let width = Math.round(1 + _label.toImage().width / this.logicalDensityFactor);

		this.scrollerLabel.applyProperties({
			width: width,
			left: this.deviceWidth,
			text: this.messages[this.currentMessage],
		});

		this.animation.applyProperties({
			left: -parseInt(width),
			duration: width * this.speed,
		});

		// timeout in order to prevent this Warning:
		// [WARN]  New layout set while view [object TiUILabel] animating: Will relayout after animation.
		setTimeout(() => {
			this.scrollerLabel.animate(this.animation);
		}, 100);
	}

	pause() {
		this.paused = true;
		this.event.paused(this);
	}

	resume() {
		if (this.paused) {
			this.paused = false;
			this.animate();
			this.event.resumed(this);
		}
	}

	update(_args) {
		// Reset Background Color
		this.backgroundColor = _args.backgroundColor ?? this.scrollerView.backgroundColor;

		// Update Messages
		if (_args.messages) {
			this.updateMessages(_args.messages);
		}
		if (_args.message) {
			this.updateMessages(_args.message);
		}

		// Update Random
		if (_args.random) {
			this.random = true;
			this.messages = this.messages.sort(() => Math.random() - 0.5);
		}

		// Update Delay
		if (_args.delay >= 0) {
			this.delay = _args.delay * 1000;
		}

		// Update Scroller View Properties
		this.applyPropertiesToScroller(_args, 250);

		// Update Scroller Label Properties
		this.applyPropertiesToScrollerLabel(_args);

		// Update Side Label Properties
		this.applyPropertiesToSideLabel(_args, 250);
	}

	updateMessages(_messages) {
		this.currentMessage = -1;
		this.messages = Array.isArray(_messages) ? _messages : [_messages];

		if (this.random) {
			this.messages = this.messages.sort(() => Math.random() - 0.5);
		}
	}

	updateBackground(_backgroundColor) {
		this.backgroundColor = _backgroundColor;

		if (this.sideLabel) {
			this.sideLabel.animate({
				duration: 250,
				backgroundColor: this.colorLuminance(this.backgroundColor, -0.20)
			});
		}

		this.scrollerView.animate({
			duration: 250,
			backgroundColor: this.backgroundColor
		});
	};

	updateLabel(_label) {
		if (_label && this.sideLabel) {
			this.sideLabel.applyProperties({
				text: `  ${_label}  `,
			});
		}
	}

	// Helper Functions
	addSidelabel(_args) {
		this.sideLabel = Ti.UI.createLabel({
			left: 0,
			width: Ti.UI.SIZE,
			verticalAlign: Ti.UI.TEXT_VERTICAL_ALIGNMENT_CENTER,
			viewShadowOffset: { x: 4, y: 0 }, viewShadowRadius: 4, viewShadowColor: this.defaultBackgroundColor
		});

		this.applyPropertiesToSideLabel(_args);

		this.scrollerView.add(this.sideLabel);
	}

	applyPropertiesToScroller(_args, duration = 0) {
		if (duration) {
			this.scrollerView.animate({
				duration: duration,
				height: _args.height ?? 28,
				top: _args.top ?? undefined,
				bottom: _args.bottom ?? undefined,
				backgroundColor: this.backgroundColor
			});
		} else {
			this.scrollerView.applyProperties({
				height: _args.height ?? 28,
				top: _args.top ?? undefined,
				bottom: _args.bottom ?? undefined,
				backgroundColor: this.backgroundColor
			});
		}
	}

	applyPropertiesToScrollerLabel(_args) {
		this.scrollerLabel.applyProperties({
			height: _args.height ?? 28,
			color: _args.color ?? '#fff',
			font: { fontFamily: (_args.font && _args.font.fontFamily) ?? undefined, fontSize: (_args.font && _args.font.fontSize) ?? '14dp', fontWeight: (_args.font && _args.font.fontWeight) ?? 'normal' }
		});
	}

	applyPropertiesToSideLabel(_args, duration = 0) {
		if (this.sideLabel) {
			if (duration) {
				this.applyPropertiesToSideLabelWithAnimation(_args, duration);
			} else {
				this.sideLabel.applyProperties({
					height: _args.height ?? 28,
					color: _args.color ?? '#fff',
					backgroundColor: this.colorLuminance(this.backgroundColor, -0.20),
					text: _args.label === '' ? '' : (_args.label === undefined) ? this.sideLabel.text : `  ${_args.label}  `,
					font: { fontFamily: (_args.font && _args.font.fontFamily) ?? undefined, fontSize: (_args.font && _args.font.fontSize) ?? '14dp', fontWeight: 'bold' },
				});
			}
		} else {
			this.addSidelabel(_args);
		}
	}

	applyPropertiesToSideLabelWithAnimation(_args, duration = 0) {
		this.sideLabel.applyProperties({
			text: _args.label === '' ? '' : (_args.label === undefined) ? this.sideLabel.text : `  ${_args.label}  `,
			font: { fontFamily: (_args.font && _args.font.fontFamily) ?? undefined, fontSize: (_args.font && _args.font.fontSize) ?? '14dp', fontWeight: 'bold' }
		});

		this.sideLabel.animate({
			duration: duration,
			height: _args.height ?? 28,
			color: _args.color ?? '#fff',
			backgroundColor: this.colorLuminance(this.backgroundColor, -0.20),
		});
	}

	colorLuminance(_hex, _lum) {
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
}
module.exports = Scroller;
