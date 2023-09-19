![0_2](https://github.com/jawerty/CaesarBot/assets/1999719/641bebd0-c7f4-4c87-b275-191e8672b150)# CaesarBot
An LLM agent that pushes any sort of political campaign on *Twitter (X)* you wish while continuously managing the campaign with an engagement tracking feedback loop

![0_2](https://github.com/jawerty/CaesarBot/assets/1999719/df7ec571-dcf1-4195-9bfb-46a628d341e0)

*Note: This is a twitter (x) bot*

Example usage
```
$ node caesar-bot.js "poltical campaign pushing americans to eat caesar salad" -t 60 -e 600
```

I built CaesarBot in about 5.5 hours on this [this live stream](https://www.youtube.com/live/zkpB3Wmxj60) on my Youtube. Many more bot builds on the channel if you're interested (heaven banning bot, karen bot, jordan peterson bot, etc.).

# How it works
1) Creates a Goal / Strategy Plan
First CaesarBot creates a goal and strategy for the social media marketing plan. This plan is saved locally in the `caesar-bot-process-info.json` which has all the shared info the Agent uses to prompt

2) Runs two loops
	- Tweet Loop: Every x seconds it will generate tweets (using the goals / strategy plan) and actually tweet it. It will also find users to reply to who are talking about the topics around the campaign and tweet at them

	- Engagement Loop: Every x seconds it will re-evaluate the engagement of the previous tweets on the accounts and rewrite the goals / strategy plan based on the performance 

3) The Colab
CaesarBot currently using a flask api running from a [Google Colab](https://colab.research.google.com/drive/1Q3PI9Vt4IEiUQKXvLnRJyOOjZdWmrmSR?usp=sharing) to prompt Llama. If you want to change this to use llama.cpp please create an issue and I'll try to address it.

![Screen Shot 2023-09-19 at 11 02 50 AM](https://github.com/jawerty/CaesarBot/assets/1999719/9e73446e-4799-45fc-9c45-c0727f1a4676)

# How to use it
1) Set up the Google Colab 
Go to the [Google Colab](https://colab.research.google.com/drive/1Q3PI9Vt4IEiUQKXvLnRJyOOjZdWmrmSR?usp=sharing) and run the server and copy the ngrok url

Your colab should look similar to the one below
![Screen Shot 2023-09-06 at 10 15 14 PM](https://github.com/jawerty/CaesarBot/assets/1999719/d0e19fef-d201-46e9-a1d9-5359557cb1c3)

2) Create a config.json
- Add your bot account info
All the ngrok url from the colab to the config
```
{
	"bot_accounts": [{ "username": "everydaytechbro" , "password": "**********" }],
	"api_url": "http://f535-34-32-241-160.ngrok.io"
}

```
First install the node modules
```

$ npm install

```

The arguments/options
```
$ node caesar-bot.js --help

Arguments:
  campaign_description                 Caesar Bot Campaign

Options:
  -t, --tweet-interval <numbers>
  -e, --engagement-interval <numbers>
  -h, --help                           display help for command

```

Example command
```
$ node caesar-bot.js "poltical campaign pushing americans to eat caesar salad" -t 60 -e 600
```


# Have fun!
