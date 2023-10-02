# Mercury

Simple & Customisable RSS Client for IRC.

This bot is not completed, expect bugs/crashes/errors. Use in production is disadvised at this stage.

![m!feed Example](/.screens/1.png?raw=true "m!feed Example")

## Commands

- `m!feed [USER/FEED] [ENTRIES]` - Return the last x amount of entries from any RSS feed or your own saved feeds (if you have saved feeds)
- `m!twitter [USER] [ENTRIES]` - Return the last x amount of tweets from a particular user.
- `m!opt [CATEGORY] [OPTION] [VALUE]` - Control bot options, see wiki for info on usage.

## Deployment

1. Install Docker (required) and Docker Compose (optional, but strongly recommended, this guide assumes you have it)
2. Rename `config/example.default.json` to `config/default.json` and modify it accordingly. A list of variables and their descriptions can be found in this repos wiki.
3. Run `docker compose up` to begin. Append `-d` to start in the background and `--build` if you make any changes to any files.

## Support

If you need assistance with installation or usage, join #5000 on `irc.supernets.org`

## License

This software is licensed under the ISC License, its full text can be found [here](/LICENSE).

Some required packages may be using licenses other than the ISC License. A full 
list of packages can be found in `package-lock.json` and their licenses can be 
found on their respective homepages/repositories.