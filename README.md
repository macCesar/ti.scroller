# ti.scroller

## Description
A simple library to create a marquee-like elements in your Appcelerator Titanium Apps for both Classic and Alloy projects.

- You can create multiple scrolling views and customize them separately
- Each scrolling view can display one or multiple messages, cicle between them or display them in random order
- You can update its content at any time ( messages, color, position, delay, etc. )
- Works with Android & iOS

## Breaking changes in v1.1.0
### Autoplaying scrolling views
Each scrolling view will start playing immediately after initialization if either `message` or `messages` properties are set.

### This means that you no longer need to call the `animate()` method ( now deprecated ) after initialization.

They won't `autoplay` if there is no message set at initialization, this is useful when you need to get the data from the internet. They will start playing the moment you set a new message(s) with `update()` or `updateMessage/Messages()` methods.

If you set the `message(s)` property and still don't want the scrolling views to start playing immediately, set the new `autoplay` property to `false`.

Then use the `resume()` method or the new `play()` method to start playing the scrolling view when needed. *Just remember to set the `autoplay` property back to `true`*.

### New `<ScrollingView />` Alloy element
In order to be more like a native Ti element in Alloy projects, you now create your scrolling views with the `<ScrollingView>` element provided by `ti.scroller.js`

```xml
<ScrollingView module='ti.scroller' ... />
```

### `pause` and `resume` Events
This App Events have been added to the library, so you no longer need to add them manually. They will `pause/resume` every scrolling view created in your app.

### `animate()` method Deprecated
The `animate()` method is deprecated and will be deleted in the future.

## Installation in Classic Apps
For Classic Apps, put `ti.scroller.js` file inside the `Resources` folder.

## Basic usage
```javascript
let ScrollingView = require('ti.scroller')

let win = Ti.UI.createWindow({
    title: 'ti.scroller lib',
    backgroundColor: '#fff'
});

let scrollingMessage = new ScrollingView({
    message: 'Appcelerator Titanium: Everything you need to create great, native mobile apps — All from a single JavaScript code base.'
});

win.add(scrollingMessage.getView());

win.open();
```

## Result
<img src="assets/images/scrollingMessage.gif" width="375" alt="iOS Screen - Example">

***\* low framerate gif***

## Advanzed usage
```javascript
let ScrollingView = require('ti.scroller')

let win = Ti.UI.createWindow({
    title: 'ti.scroller',
    backgroundColor: '#fff'
});

let container = Ti.UI.createView({
    layout: 'vertical',
    height: Ti.UI.SIZE
});

let famousPeopleQuotes = new ScrollingView({
    top: 8,
    speed: 7,
    random: true,
    color: '#dddfe1',
    label: 'Famous People:',
    backgroundColor: '#53606b',
    messages: [
        "The greatest glory in living lies not in never falling, but in rising every time we fall. - Nelson Mandela",
        "The way to get started is to quit talking and begin doing. - Walt Disney",
        "Your time is limited, so don't waste it living someone else's life. Don't be trapped by dogma – which is living with the results of other people's thinking. - Steve Jobs",
        "If life were predictable it would cease to be life, and be without flavor. - Eleanor Roosevelt",
        "If you look at what you have in life, you'll always have more. If you look at what you don't have in life, you'll never have enough. - Oprah Winfrey",
        "If you set your goals ridiculously high and it's a failure, you will fail above everyone else's success. - James Cameron",
        "Life is what happens when you're busy making other plans. - John Lennon"
    ]
});

let bestQuotesOfAllTimes = new ScrollingView({
    top: 8,
    speed: 6,
    label: 'Best Quotes:',
    backgroundColor: '#79a342',
    messages: [
        "Whoever is happy will make others happy too. - Anne Frank",
        "It is during our darkest moments that we must focus to see the light. - Aristotle",
        "Always remember that you are absolutely unique. Just like everyone else. - Margaret Mead",
        "Spread love everywhere you go. Let no one ever come to you without leaving happier. - Mother Teresa",
        "When you reach the end of your rope, tie a knot in it and hang on. - Franklin D. Roosevelt",
        "Don't judge each day by the harvest you reap but by the seeds that you plant. - Robert Louis Stevenson",
        "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
        "Tell me and I forget. Teach me and I remember. Involve me and I learn. - Benjamin Franklin",
        "The best and most beautiful things in the world cannot be seen or even touched — they must be felt with the heart. - Helen Keller",
        "Do not go where the path may lead, go instead where there is no path and leave a trail. - Ralph Waldo Emerson"
    ]
});

let marketStocks = new ScrollingView({
    top: 8,
    speed: 8,
    height: 36,
    debug: true,
    label: 'Market:',
    name: 'Market Stocks',
    message: 'Loading data...',
    backgroundColor: '#F3650C'
});

// Simulated API response
setTimeout(() => {
    // Just set the new message(s) with `updateMessages` method
    marketStocks.updateMessages("EUR/USD 1.18664 0 0% · USD/JPY 110.399 0.06 0.05% · GBP/USD 1.38902 0 0% · EUR/JPY 130.9959 0.109 0.08% · GBP/JPY 153.3323 0.116 0.08% · USD/CAD 1.24481 -0.001 -0.08% · XAU/USD 1806.7484 -0.684 -0.04% · AUD/USD 0.74878 0.001 0.13% · USD/CHF 0.91462 -0.001 -0.11% · NZD/USD 0.69921 0.001 0.14%");
}, 3000);

container.add(famousPeopleQuotes.getView());
container.add(bestQuotesOfAllTimes.getView());
container.add(marketStocks.getView());

win.add(container);

win.open();
```

## Result
<img src="assets/images/more-samples.gif" width="375" alt="iOS Screen - Example">

***\* low framerate gif***

## Installation in Alloy Apps
For Alloy projects drop `ti.scroller` in `/app/lib` folder.

```bash
app
└─ lib
   └─ ti.scroller.js
```

In your `View` file, create a `ScrollingView` Alloy element and add a module attribute like this `module="ti.scroller"`.

You can set any of the supported attributes directly in the `ScrollingView`.

**IMPORTANT: For multiple `messages` you'll need to separate them with the `|` symbol like shown below.**

```xml
<Alloy>
    <NavigationWindow>
        <Window title="ti.scroller">
            <ScrollingView id="scrollingMessage" module='ti.scroller' backgroundColor="#c91326" label="Famous Quotes:" speed="4" delay="2" height="32" random="true" top="0" font.fontFamily="Gill Sans" font.fontWeight="semibold" font.fontSize="16" message="Whoever is happy will make others happy too. - Anne Frank|It is during our darkest moments that we must focus to see the light. - Aristotle|Always remember that you are absolutely unique. Just like everyone else. - Margaret Mead" />
        </Window>
    </NavigationWindow>
</Alloy>
```

## Result
<img src="assets/images/alloy-example.gif" width="375" alt="iOS Screen - Example">

***\* low framerate gif***

In your `controller` you can call any of the available methods: `update`, `udpateLabel`, `updateMessage/updateMessages`, `updateBackground`, `pause` or `resume` at anytime.

```javascript
$.scrollingMessage.update({
    top: 48,
    delay: 3,
    label: 'Appcelerator:',
    message: 'Build great mobile experiences faster - Native apps. Mobile APIs. Real-time analytics. One Platform'
});
```

## Important consideration
To prevent unexpected behaviors, the following events have been added to the library:
- `paused` event: In order to pause the scrolling effect while the app is in the background
- `resume` event: To resume scrolling when in the foreground.

They will handle every scrolling view created in your app.

```javascript
Ti.App.addEventListener('paused', function() {
    // Automatically `pauses` every scrolling view created
    // when your app goes to the background
});

Ti.App.addEventListener('resume', function() {
    // Automatically `resumes` every scrolling view created
    // when your app comes to the foreground
});
```

## Customization
You can customize the text color, background color, vertical position, font size, font weight, font family, scrolling speed, delay between messages, autoplay messages, random order display, side label text, name and debug mode with the following `properties`:

- `name`
- `color`
- `label`
- `delay`
- `speed`
- `debug`
- `height`
- `random`
- `autoplay`
- `top`/`bottom`
- `backgroundColor`
- `message`/`messages`
- `font` object with `fontSize`, `fontWeight`, `fontFamily`


## Content Properties

### message/messages : `array`
The text to display can be set with `message` or `messages` property using an array ( for a single message you can set it using a string ).

```javascript
let scrollingMessage = new ScrollingView({
    messages: [
        'Every moment is a fresh beginning. – T.S Eliot',
        'Change the world by being yourself. – Amy Poehler',
        'Love For All, Hatred For None. – Khalifatul Masih III'
    ],
    ...
});
```

### label : `string`
To display a left-side label set the `label` property.

**Defaults to: `null`**

```javascript
let scrollingMessage = new ScrollingView({
    label: 'Breaking News:',
    ...
});
```

## Design Properties

### color : `string`
Color for the text message(s) and side label in `hex` value.

**Defaults to: `#fff`**

```javascript
let scrollingMessage = new ScrollingView({
    color: '#79a342',
    ...
});
```

### backgroundColor : `string`
Background color for the scrolling view, as a hex triplet.

**Defaults to: `#BF000000`**

```javascript
let scrollingMessage = new ScrollingView({
    backgroundColor: '#53606b',
    ...
});
```

### height : `number/string`
ScrollingView height, in platform-specific units.

**Defaults to: `28dp`**

```javascript
let scrollingMessage = new ScrollingView({
    height: 44
    ...
});
```

## Font Object
Set a `font` object to set the following properties:

### fontFamily: `string`
Specifies the font family or specific font to use.

**Defaults: Uses the default system font**

### fontSize: `Number/String`
Font size, in platform-dependent units.

**Defaults: `14dp`**

### fontWeight: `string`
Font weight. Valid values are "bold", "semibold", "normal", "thin", "light" and "ultralight".

The "semibold", "thin", "light" and "ultralight" weights are recognized on iOS only. "thin", "light" and "ultralight" are only available on iOS 8.2 and later.

**Defaults: `normal`**

```javascript
let scrollingMessage = new ScrollingView({
    font: {
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Gill Sans'
    }
    ...
});
```

## Positioning Properties

### top or bottom : `number/string`
The scrolling view's top OR bottom position. This position is relative to the scrolling view's parent.

You can use `px`, `%` or `dp` values.

**Defaults to: `undefined`**

```javascript
let scrollingMessage = new ScrollingView({
    top: 44,
    // OR
    bottom: 0
    ...
});
```

## Behavior properties

### autoplay : `boolean`
You can turn off automatic playing by setting the `autoplay` property to false.

**Defaults to: `true`**

```javascript
let scrollingMessage = new ScrollingView({
    autoplay: false,
    ...
});
```

### delay : `number`
Pause the animation between messages in seconds.

**Defaults to: `0`**

```javascript
let scrollingMessage = new ScrollingView({
    delay: 3,
    ...
});
```

### speed : `number`
The speed of the scrolling text, a constant speed no matter the text length, the higher the number the faster the scrolling speed.

**Defaults to: `5`**

```javascript
let scrollingMessage = new ScrollingView({
    speed: 7,
    ...
});
```

### random : `boolean`
To display the messages in random order set `random` to `true`.

**Defaults to: `false`**

```javascript
let scrollingMessage = new ScrollingView({
    random: true,
    ...
});
```

## Update Methods
There are 4 `methods` to update the content and properties at any time.

- `update()`
- `updateLabel()`
- `updateBackground()`
- `updateMessage()` or `updateMessages()`

### update
Is a **general purpose** method to change any or all of the following properties:

- name
- color
- label
- delay
- speed
- debug
- height
- random
- autoplay
- top or bottom
- backgroundColor
- message or messages
- fontFamily, FontSize, fontWeight

When updating the message ( or messages ), the text will be shown after completing the currently running message.

```javascript
scrollingMessage.update({
    top: 0,
    delay: 0,
    speed: 10,
    label: 'Appcelerator:',
    message: 'Build great mobile experiences faster - Native apps. Mobile APIs. Real-time analytics. One Platform',
    font: {
        fontWeight: 'bold'
    }
});
```

### updateMessage/updateMessages
If you need to update only the message or messages, you can use the `updateMessage` or `updateMessages` methods.

You can use either of them with a `string` or an `array`.

The updated text will be shown after completing the currently running message.

```javascript
scrollingMessage.updateMessage('Build great mobile experiences faster - Native apps. Mobile APIs. Real-time analytics. One Platform');

scrollingMessage.updateMessages( [
    'Build: Write in JavaScript, run native on any device and OS',
    'Connect: Get mobile-optimized access to any data source',
    'Measure: See usage & adoption, detect crashes, tune performance'
]);
```

### updateLabel
This method will instantly update the `label` property.

If the scrolling view does not originally contained a `label`, it will be add it automatically.

```javascript
scrollingMessage.updateLabel('Breaking News:');
```

### updateBackground
Use it to change the scrolling view's background color, including the `label` property if available.

```javascript
scrollingMessage.updateBackground('#79a342');
```

## Debug Mode
### name : `string`
In order to identify each Scrolling View while debuging, you can set the `name` property at initialization.

```javascript
let scrollingMessage = new ScrollingView({
    name: 'My Scrolling View',
    ...
});
```

```xml
<ScrollingView id="scrollingMessage" module='ti.scroller' name="My Scrolling View" />
```

When you enable `debug` mode you'll see multiple outputs with the name of the Scrolling View.

```console
[WARN]  :: ti.scroller :: My Scrolling View: Add side label
[WARN]  :: ti.scroller :: My Scrolling View: Apply properties to side label
[WARN]  :: ti.scroller :: My Scrolling View: Apply properties to scrolling view’s label
[WARN]  :: ti.scroller :: My Scrolling View: Apply properties to scrolling view
[WARN]  :: ti.scroller :: My Scrolling View: Play method
[WARN]  :: ti.scroller :: My Scrolling View: Update messages method
[WARN]  :: ti.scroller :: My Scrolling View: Complete event
[WARN]  :: ti.scroller :: My Scrolling View: Play method
```

*If no `name` is set, the output will be its `id`, and if none is set, it will generate an internal one.*

### debug : `bollean`
You can debug the scrolling view by setting the `debug` property to `true` at initialization or with the `update()` method.

**Defaults to: `false`**

```javascript
let scrollingMessage = new ScrollingView({
    debug: true,
    ...
});

// OR
scrollingMessage.update({
    debug: true
});
```

```xml
<ScrollingView id="scrollingMessage" module='ti.scroller' debug="true" />
```

To turn it off
```javascript
scrollingMessage.update({
    debug: false
});

// OR
$.scrollingMessage.update({
    debug: false
});
```

## License
<pre>
Copyright 2020-2021 César Estrada

Licensed under the Apache License, Version 2.0 (the “License”); you may not use this file except in compliance with the License.

You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an “AS IS” BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

See the License for the specific language governing permissions and limitations under the License.
</pre>
