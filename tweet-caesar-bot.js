const fs = require('fs');

const Prompts = require('./prompts');

const prompts = Prompts()

const { getRandBotAccount, replyToTwitterAccount, timeout, setupBrowser, twitterLogin } = require('./utils')

const config = JSON.parse(fs.readFileSync('./config.json'))
const processInfo = JSON.parse(fs.readFileSync('./caesar-bot-process-info.json'))
async function findReplyTweet(page) {
	// parse out a 1 or 2 word topic that represents the campaign
	if (!processInfo.topic) {
		const topicPrompt = prompts.topicFromCampaignDescPrompt(processInfo.campaignDescription)

		const response = await fetch(config.api_url + "/generate", {
			method: "POST",
			headers: {
			  "Content-Type": "application/json"
			},
			body: JSON.stringify({
			  'prompt': topicPrompt
			})
		});

		const result = await response.json();
		const output = result['output'];

		const topic = output 

		processInfo.topic = topic	
	}

	await page.goto(`https://twitter.com/search?q=${encodeURIComponent(processInfo.topic)}&src=typed_query&f=top`)
	await page.waitForSelector("section[role=\"region\"] article [data-testid=\"tweetText\"]", { timeout: 0 })
	processInfo.pastTweetPages = processInfo.pastTweetPages || [];

	let [tweetText, tweetPageToRespondTo] = await page.evaluate((pastTweetPages) => {
		const tweets = Array.from(document.querySelectorAll("section[role=\"region\"] article"))
		for (let i = 0; i < tweets.length; i++) {
			try {
				const tweetLink = Array.from(tweets[i].querySelectorAll("a")).filter((el) => {
					const link = el.getAttribute('href')
					return link.indexOf("/status/") > -1
				}).map((el) => {
					const link = `${window.location.origin}${el.getAttribute('href')}`
					return link
				})[0]
				if (pastTweetPages.includes(tweetLink)) {
					continue;
				}


				const tweetText = tweets[i].querySelector("[data-testid=\"tweetText\"]").innerText
				return [tweetText, tweetLink];
			} catch(e) {
				console.log(e);
			}
			
		}
		return [null, null]
	}, processInfo.pastTweetPages)

	if (!tweetPageToRespondTo) {
		return;
	}

	processInfo.pastTweetPages.push(tweetPageToRespondTo)
	fs.writeFileSync('./caesar-bot-process-info.json', JSON.stringify(processInfo))

	return [tweetText, tweetPageToRespondTo]
}

async function run() {
	const [browser, page] = await setupBrowser()

	const campaignDescription = processInfo.campaignDescription
	const strategyStatement = processInfo.strategyStatement
	const account = getRandBotAccount()
	await twitterLogin(page, account)
	const tweetHistory = processInfo.tweetHistory
	// first make a tweet with the strategy statement and the previous tweets
	// generate the tweet
	const tweetPrompt = prompts.tweetPrompt(campaignDescription, strategyStatement, tweetHistory)
	await page.goto('https://twitter.com/compose/tweet')

	const response = await fetch(config.api_url + "/generate", {
		method: "POST",
		headers: {
		  "Content-Type": "application/json"
		},
		body: JSON.stringify({
		  'prompt': tweetPrompt
		})
	});

	const result = await response.json();
	let output = result['output'];

	console.log("\n\n--------NEW TWEET-------\n\n", output, "\n\n------------------\n\n")
	output = output.split("TWEET:").join("");
	await page.waitForSelector("[data-testid=\"tweetTextarea_0_label\"]")
	const messageInput = await page.$("[data-testid=\"tweetTextarea_0_label\"]")
	await messageInput.click();
	await timeout(1000);
	await page.keyboard.type(output.slice(0, 250), {delay: 10});

	console.log("Clicking post button")
	await timeout(2000)
	const postBtn = await page.$("[role=\"dialog\"] [data-testid=\"tweetButton\"]");
	await postBtn.click();

	await timeout(5000);
	try {
		await postBtn.click();
	} catch(e) {

	}
	processInfo.tweetHistory.push(output)

	const [tweetText, tweetPageToRespondTo] = await findReplyTweet(page)


	processInfo.pastTweetPages = processInfo.pastTweetPages || []
	processInfo.pastTweetPages.push(tweetPageToRespondTo)
	fs.writeFileSync('./caesar-bot-process-info.json', JSON.stringify(processInfo))

	if (tweetPageToRespondTo) {
		// randomly choose to reply to retweet

		// reply
		const replyPrompt = prompts.replyPrompt(processInfo.campaignDescription, processInfo.strategyStatement, tweetText)
		await page.goto(tweetPageToRespondTo)
		await replyToTwitterAccount(page, config.api_url, replyPrompt)

	}
	return;
}

run()