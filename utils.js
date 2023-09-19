const puppeteer = require('puppeteer');
const fs = require('fs');

function timeout(miliseconds) {
  return new Promise((resolve) => {
    setTimeout(() => {resolve()}, miliseconds)
  })
}

async function setupBrowser() {
  const viewportHeight = 800;
  const viewportWidth = 1080;
  const browser = await puppeteer.launch({ headless: false });

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0); 
  await page.setViewport({width: viewportWidth, height: viewportHeight});
  
  page.on('console', async (msg) => {
	const msgArgs = msg.args();
	for (let i = 0; i < msgArgs.length; ++i) {
	  try {
		console.log(await msgArgs[i].jsonValue());
	  } catch(e) {
	  	console.log(e);
	  }
    }
  });

  return [browser, page]
}

async function twitterLogin(page, account) {
  await page.goto('https://twitter.com/i/flow/login')

  if (fs.existsSync('./cookies.json')) {
    return await loadCookies(page);
  } 

  await page.waitForSelector("[autocomplete=\"username\"]");
  await page.focus("[autocomplete=\"username\"]")

  await timeout(1000)
  await page.keyboard.type(account.username)
  const buttons = await page.$$("[role=\"button\"]");
  let nextButton;
  for (let button of buttons) {
    const buttonText = await page.evaluate((el) => el.innerText, button)
    if (buttonText.indexOf("Next") > -1) {
      nextButton = button
      break;
    }
  }

  nextButton.click()

  await timeout(2000)

  // press enter
  await page.waitForSelector("[autocomplete=\"current-password\"]");
  await page.keyboard.type(account.password)
  await page.keyboard.press('Enter');
  await timeout(5000)
  
  await page.goto('https://twitter.com')

  const cookies = await page.cookies();
  fs.writeFileSync('./cookies.json', JSON.stringify(cookies, null, 2));
  console.log("Logged in and saved cookies");
}

async function loadCookies(page) {
  const cookiesString = fs.readFileSync('./cookies.json');
  const cookies = JSON.parse(cookiesString);
  await page.setCookie(...cookies);
}

async function gotoTwitterDM(page) {
  await page.waitForSelector('[data-testid="sendDMFromProfile"]')
  const dmButton = await page.$('[data-testid="sendDMFromProfile"]')
  await dmButton.click();
  await timeout(1000);
  await page.waitForSelector('[data-testid="dmComposerTextInput"]')
}

async function sendTwitterDM(page, message) {
  const messageInput = await page.$("[data-testid=\"dmComposerTextInput\"]")
  await messageInput.click()
  await timeout(1000)
  await page.keyboard.type(message, {delay: 50});
  await page.keyboard.press('Enter');
  await timeout(1000)
}

function getRandBotAccount() {
  const config = JSON.parse(fs.readFileSync('./config.json'))
  return config.bot_accounts[Math.floor(Math.random() * config.bot_accounts.length)]
}

async function replyToTwitterAccount(page, apiUrl, prompt) {
  const response = await fetch(apiUrl + "/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      'prompt': prompt
    })
  });

  const result = await response.json();
  const debateBroAnswer = result['output'];
  console.log("Responding with:", debateBroAnswer)
  await page.waitForSelector("[data-testid=\"tweetTextarea_0_label\"]")
  const messageInput = await page.$("[data-testid=\"tweetTextarea_0_label\"]")
  await messageInput.click();
  await timeout(1000);
  await page.keyboard.type(debateBroAnswer.slice(0,250), {delay: 50});

  console.log("Clicking reply button")
  await timeout(2000);
  const replyBtn = await page.$("[data-testid=\"tweetButtonInline\"]");
  await replyBtn.click();
  try {
    await timeout(1000);
    await replyBtn.click();
  } catch(e) {
  }
  await timeout(1000);
}

module.exports = {
  setupBrowser,
  twitterLogin,
  timeout,
  getRandBotAccount,
  replyToTwitterAccount
}