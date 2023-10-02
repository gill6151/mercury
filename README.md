# Mercury

Simple & Customisable RSS Client for IRC.

This bot is not completed, expect bugs/crashes/errors. Use in production is disadvised at this stage.

![m!feed Example](/.screens/1.png?raw=true "m!feed Example")

## Commands

The listed prefixes here and throughout this clients documentation assume the default prefix (`m!`) has been left unchanged. The help command will show information with the correct prefix as per your installation.

- `m!feed [USER/FEED/ALIAS] [ENTRIES]` - Return the last x amount of entries from any RSS feed or your own saved feeds (if you have saved feeds)
- `m!opt [CATEGORY] [OPTION] [VALUE]` - Control bot options, see wiki for info on usage.
- `m!help` - Bring up the clients in-built help menu. Help submenus coming soon.

## The m!feed command

The m!feed command is all inclusive. Majority of you will want to do with this client is done through this command

### URL entry

- `m!feed [URL] [ENTRIES (opt)]` - This brings up the last x amount of entries in an RSS feed of your choosing, you must provide a full valid RSS feed url (example: https://github.com/torvalds/linux/commits.atom)

### Predefined Feeds

There are some pre-made aliases you can use to easily pull up feeds without requiring a full feed URL. I will be focusing on adding more of these in the future.

#### Twitter

- `m!feed twitter/[USERNAME] [ENTRIES (opt)]` - This one brings up the last x amount of tweets by any user on X/Twitter using Nitter (a privacy focused frontend for X/Twitter)

#### Git

- `m!feed github/[USER]/[REPO]/[MODE (opt)] [ENTRIES (opt)]` - This brings up the last x amount of commits or releases from any repository on GitHub. The mode option is optional, valid entires are `commits` and `releases`, if this option is undefined, it will default to commits.

### Your personalised feed

This client does support personalised feeds, as I presume you might come to expect from an RSS client, however right now while it does show entries chronologically, they are seperated by feed which is not ideal, this will be tweaked soon to exhibit the usual behaviour you might expect from other RSS clients.

- `m!feed me` or `m!feed [NICK]` - This brings up your own (or other) user feeds.

#### Configuring your feed

- `m!opt feed add [URL]` - Adds a RSS URL to your feed, must be valid.
- `m!opt feed list` - Lists all of your set RSS feeds, if you have any.
- At this very moment there is no functionality to remove feeds.

### Aliases

- `m!feed [ALIAS] [ENTRIES (opt)]` - Bring up the feed associated with a set alias (see below on setting aliases)

#### Configuring aliases

- `m!opt alias add [ALIAS] [URL]` - Adds an alias for an associated valid RSS feed.
- `m!opt alias del [ALIAS]` - Deletes an alias.
- `m!opt alias list` - Lists all of your configured aliases

Configuring aliases is known to be buggy right now, so things may not work right. You can set an alias with the same name as any of the predefined feeds but it will not work as of yet.

## Deployment

1. Install Docker (required) and Docker Compose (optional, but strongly recommended, this guide assumes you have it)
2. Rename `config/example.default.json` to `config/default.json` and modify it accordingly. A list of variables and their descriptions can be found in this repos wiki. You do not need to do anything with `example.usersettings.json` unless you wish to predefine settings prior to the bots first start, the usersettings file will be made on the first run if it does not exist.
3. Run `docker compose up` to begin. Append `-d` to start in the background and `--build` if you make any changes to any files.

## Support

If you need assistance with installation or usage, join #5000 on `irc.supernets.org`

## TODO

Once the following are completed, I will consider this project functional and ready to use in production.

- [x] Grab RSS feeds via URL
- [x] Allow users to save feeds and easily grab them all at once (needs tweaking still but mostly done)
- [x] Alias support
- [ ] Grab feeds at set intervals and post new content in a set channel
- [ ] Migrate from a JSON file to a DB for user settings
- [ ] Extensive testing and applicable error handling, also more descriptive error messages
- [ ] Ensure wiki is updated
- [ ] Publish Docker image so the client does not need to be built by end users

## License

This software is licensed under the ISC License, its full text can be found [here](/LICENSE).

Some required packages may be using licenses other than the ISC License. A full 
list of packages can be found in `package-lock.json` and their licenses can be 
found on their respective homepages/repositories.