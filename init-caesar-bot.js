const fs = require('fs');

const Prompts = require('./prompts');
const prompts = Prompts()

const config = JSON.parse(fs.readFileSync('./config.json'))
const processInfo = JSON.parse(fs.readFileSync('./caesar-bot-process-info.json'))

async function run() {
	const campaignDescription = processInfo.campaignDescription;
	const goalStrategyPrompt = prompts.goalStrategyPrompt(campaignDescription)
	
	const response = await fetch(config.api_url + "/generate", {
		method: "POST",
		headers: {
		  "Content-Type": "application/json"
		},
		body: JSON.stringify({
		  'prompt': goalStrategyPrompt
		})
	});
	
	const result = await response.json();
	const output = result['output'];
		
	console.log("\n\n-----STRATEGY STATEMENT-----\n\n", output, "\n\n----------------------------\n\n")
	processInfo.strategyStatement = output

	fs.writeFileSync('./caesar-bot-process-info.json', JSON.stringify(processInfo))
}

run()