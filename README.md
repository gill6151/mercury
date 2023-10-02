# Fascinus (fa-see-nus)

cold hard bot for cold hard chats

## Commands

- $flood [AMOUNT] [TEXT] - Floods the channel with a specific line x amount of times
- $ctcpflood [TARGET] [TEXT (one word)] [AMOUNT] - Sends x amount of CTCP requests to a target.
- $sneed - Pastes the Sneed's Feed and Seed copypasta.
- $rspam [LINES (def=100, max=100000)] - Spams x lines of random characters.
- $uspam [LINES (def=100, max=100000)] - Spams x lines of random unicode characters of varying length.
- $art [IMAGE URL (png/jpg)] - Creates IRC art using a source image.
- $godwords [AMOUNT (def=50, max=100000)] - Generate x amount of random words. Inspired by TempleOS.

## Deployment

1. Install Docker (required) and Docker Compose (optional, but strongly recommended)
2. Modify the info in the config block in `bot.js` to your taste.
3. Run `docker compose up` to begin. Append `-d` to start in the background and `--build` if you make any changes to any files

## Support

If you need assistance with installation or usage, join #5000 on `irc.supernets.org`

## Credits

- [phy1729/banter](https://github.com/phy1729/banter) - $art uses a version of banter modified to allow URLs in place of local image files. These changes will be published upstream once refined.

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

This repository contains a modified version of banter (https://github.com/phy1729/banter) which is licensed under GNU-GPL v3.0 and as such, this license does not apply to the contents of lib/banter.