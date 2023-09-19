const fs = require('fs');

const Prompts = require('./prompts');

const prompts = Prompts()

const { getRandBotAccount, replyToTwitterAccount, timeout, setupBrowser, twitterLogin } = require('./utils')

const config = JSON.parse(fs.readFileSync('./config.json'))

const processInfo = JSON.parse(fs.readFileSync('./caesar-bot-process-info.json'))

async function run() {
	const [browser, page] = await setupBrowser()

	const campaignDescription = processInfo.campaignDescription
	const strategyStatement = processInfo.strategyStatement
	const account = getRandBotAccount()
	await twitterLogin(page, account)
	// first make a tweet with the strategy statement and the previous tweets
	// generate the tweet
	await page.goto('https://twitter.com/'+account.username+"/with_replies")
	await page.waitForSelector("section[role=\"region\"] article [data-testid=\"tweetText\"]", { timeout: 0 })

	const engagementScores = await page.evaluate((accountUsername) => {
		const parseDisplayTextAsNumber = (displayText) => {
			if (displayText.trim().length === 0) {
				return 0
			}
			if (displayText.indexOf("M") === displayText.length-1) {
				return parseFloat(displayText) * 1000000
			} else if (displayText.indexOf("K") === displayText.length-1) {
				return parseFloat(displayText) * 1000
			} else {
				return parseInt(displayText.split(",").join(""))
			}
		}
		const engagementScore = (repliesCount, likesCount, viewsCount) => {
			const replyCoef = 2;
			const likesCoef = 1;
			const replyScore = replyCoef * (repliesCount/viewsCount)
			const likesScore = likesCoef * (likesCount/viewsCount)
			return replyScore + likesScore
		}

		const tweets = Array.from(document.querySelectorAll("section[role=\"region\"] article"))
		const engagementScores = [];
		for (let i = 0; i < tweets.length; i++) {
			const tweet = tweets[i]
			if (tweet.querySelector("[data-testid=\"User-Name\"]").innerText.indexOf(accountUsername) === -1) {
				continue;
			}
			const viewsCount = parseDisplayTextAsNumber(tweet.querySelector("[aria-label*=\"View post analytics\"] [data-testid=\"app-text-transition-container\"]").innerText);
			const likesCount = parseDisplayTextAsNumber(tweet.querySelector("[data-testid=\"like\"] [data-testid=\"app-text-transition-container\"]").innerText);
			const repliesCount = parseDisplayTextAsNumber(tweet.querySelector("[data-testid=\"reply\"] [data-testid=\"app-text-transition-container\"]").innerText);
			const score = engagementScore(repliesCount, likesCount, viewsCount);
			engagementScores.push(score);
		}
		return engagementScores;
		
	}, account.username)
 	const passThreshhold = 0.10;
	const sum = engagementScores.reduce((a, b) => {
		return a + b
	})
	const average = sum/engagementScores.length;
	console.log("Average:", average, "\nPASS THRESHOLD:", passThreshhold)
	const pass = average > passThreshhold;
	console.log("PASS:", pass);
	if (!pass) {
		console.log("Strategy is not working...generating new goals and strategy")
		// get a new strategy statement
		const rewriteStrategyStatementPrompt = prompts.rewriteStrategyStatementPrompt(campaignDescription, strategyStatement)

		const response = await fetch(config.api_url + "/generate", {
			method: "POST",
			headers: {
			  "Content-Type": "application/json"
			},
			body: JSON.stringify({
			  'prompt': rewriteStrategyStatementPrompt
			})
		});

		const result = await response.json();
		const output = result['output'];
		console.log("\n\n-------NEW STRATEGY-------\n\n",output,"\n\n-------------------\n\n")
		processInfo.strategyStatement = output
		fs.writeFileSync('./caesar-bot-process-info.json', JSON.stringify(processInfo))
	} else {
		console.log("Engagement is still good!")
	}

	return;
}

run()