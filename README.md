# Mercury

RSS Parser for IRC

This bot is currently in development and not fully functioning. Do not use in production.

![m!feed Example](/.screens/1.png?raw=true "m!feed Example")

## Commands

- `m!feed [FEED] [ENTRIES]` - Return the last x amount of entries from any RSS feed.
- `m!twitter [USER] [ENTRIES]` - Return the last x amount of tweets from a particular user.

## Deployment

1. Install Docker (required) and Docker Compose (optional, but strongly recommended)
2. Rename `config/example.default.json` to `config/default.json` and modify it accordingly.
3. Run `docker compose up` to begin. Append `-d` to start in the background and `--build` if you make any changes to any files.

## Support

If you need assistance with installation or usage, join #5000 on `irc.supernets.org`

## License

ISC License

Copyright (c) 2023 hogwart7

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.