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
bestQuotesOfAllTimes.animate();
win.open();
