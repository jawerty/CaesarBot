const spawn = require('child_process').spawn;
const fs = require('fs');

const { program } = require('commander');

program
  .argument('<campaign_description>', 'Caesar Bot Campaign')
  .option('-t, --tweet-interval <numbers>')
  .option('-e, --engagement-interval <numbers>');

program.parse(process.argv);

const _arguments = program.args
const options = program.opts()

const tweetInterval = (options.tweetInterval) ? parseInt(options.tweetInterval) : 60;
const engagementInterval = (options.engagementInterval) ? parseInt(options.engagementInterval) : 60;
const campaignDescription = _arguments[0]

function spawnBot(botFileName) {
	return new Promise((resolve) => {
		console.log("Running", botFileName)
		const time = new Date();

		const botLog = `./logs/${botFileName.split('.')[0]}.log`;
		
		try {
		    fs.utimesSync(botLog, time, time);
		} catch (e) {
		    let fd = fs.openSync(botLog, 'a');
		    fs.closeSync(fd);
		}

		const child = spawn('node', [botFileName, '>', botLog]);
		
		child.stdout.on('data', (data) => {
			console.log(data+"");
		})

		child.stderr.on('data', (data) => {
			console.log(data+"");
		});

		child.stderr.on('data', (data) => {
			console.log(data+"");
		});

		child.on('close', (code) => {
		    // read the file
		    console.log(botFileName, "process closing")
		    resolve()
		});
	})
}

function intervalPromise(cb, interval) {
	return new Promise(() => {
		console.log("interval", interval)
		cb()
		setInterval(() => {
			cb()
		}, interval * 1000);
	});
}

async function run() {
	// run
	fs.writeFileSync("./caesar-bot-process-info.json", JSON.stringify({
		strategyStatement: "",
		campaignDescription,
		tweetHistory: []
	}));

	await spawnBot('init-caesar-bot.js');

	await Promise.all([
		 intervalPromise(spawnBot.bind(null, 'tweet-caesar-bot.js'), tweetInterval),
		 intervalPromise(spawnBot.bind(null, 'engagement-routine.js'), engagementInterval)
	])

	console.log("Finished")
}

run()