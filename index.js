const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({
    path: path.join(__dirname, 'credentials.env')
});

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const log = (msg) => {
    return console.log(`[WEB SCRAPER] ${msg}`);
};

// clear console
console.clear();

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        log("Opening obchoduj.na.krizikovi's profile...");
        await page.goto('https://www.instagram.com/obchoduj.na.krizikovi');
        
        await page.waitForSelector('article');
        
        log("Checking and skiping cookies & login...");
        await page.click('button._a9--._ap36._a9_1'); // decline cookies

        await sleep(5000);
        
        if ((await page.$('div._ab8w._ab94._ab99._ab9f._ab9m._ab9p._ab9z._aba9._abch._abck.x1vjfegm._abcm')).getProperties())
            await page.click('div._ab8w._ab94._ab99._ab9f._ab9m._ab9p._ab9z._aba9._abch._abck.x1vjfegm._abcm'); // click on x on login form
        
        await sleep(1000);
        
        // Scroll to the bottom of the page until no more content loads
        let lastHeight = await page.evaluate('document.body.scrollHeight');
        let newHeight;
        
        log("Getting to the bottom of the page to load all posts...");
        while (true) {
            // Break the loop if no new content loaded
            if (newHeight === lastHeight) {
                break;
            }
            
            // Scroll to bottom
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            
            // Wait for new content to load
            await sleep(2000);
            
            // Calculate new scroll height
            newHeight = await page.evaluate('document.body.scrollHeight');
            
            lastHeight = newHeight;
        }        

        log("Collecting data...");
        let data = await page.evaluate(() => {

            const postList = document.querySelectorAll('a[href*="/obchoduj.na.krizikovi/p/"]');

            return Array.from(postList).map(post => {

                const src = post.querySelector('div._aagu > div._aagv > img').getAttribute('src');
                const url = "https://www.instagram.com" + post.getAttribute('href');

                return { src, url };

            });

        });

        log("Data collected...");
        await browser.close();

        log("Saving data locally...");
        if (!fs.existsSync(path.join(__dirname, 'out')))
            fs.mkdirSync(path.join(__dirname, 'out'));

        fs.writeFileSync(path.join(__dirname, 'out', 'data.json'), JSON.stringify(data, null, 2));

        log(`Saved ${data.length} posts to /out/data.json`);

    } catch (error) {
        console.error('An error occurred:', error);
    }
})();
