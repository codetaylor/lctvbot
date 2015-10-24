## What is this?

This is the code that powers my stream overlay. The more that I work on this, the more specific to my needs it becomes. It isn't really meant to be used as-is because all of the graphics are missing and like I mentioned, it is very specific to my needs. However, it can still be educational in that you can go into the code and see how I accomplished different things.

Missing images; cause, you know, copyright.

I don't plan on maintaining this or providing support - I just don't have the time. I only plan on updating this when I need a new feature specific to my use case.

If you want to maintain this or clean it up or whatever, fork it. Just give me some credit, k? Thanks. :)

## Features

  * kick
  * temporary/permanent ban
  * greeting
  * proxy account
  * follower recognition (via RSS)
  * control view
  * focus timer
  * overlay images and text
  * overlay chat
  * OBS scene switching
  * revolving door flood protection with escalating ban duration
  * message repeat protection with escalating ban duration
  * message flood protection with escalating ban duration
  * message length protection with escalating ban duration

## Commands

  Parameters are delimited by `<>` as in `<parameter>`.

  Keywords are delimited by `''` as in `'keyword'` and must be entered exactly as seen.

  Optional parameters are delimited by `[]` as in `[<optional>]`.

  For all commands, `nick` may be prefixed with `@`.

  Commands that are available in chat are marked with `chat`.

  Commands that are available in the console are marked with `console`.

### Admin Commands

#### AFK/Back

```
!afk
```

`chat` `console`

Enables the OBS source titled `AFK`.

```
!back
```

`chat` `console`

Disables the OBS source titled `AFK`.

#### Task

```
!task <'set'|'clear'> [<task>]
```

`chat` `console`

Sets or clears the task display in the visual overlay. If used with `set` the `task` parameter is required. If used without `set` the `task` parameter is not needed.

Note: This is also accessible via the Control View.

#### Focus

```
!focus [<minutes|'off'>]
```

`chat` `console`

Starts the Focus timer if used with a numeric `minutes` parameter. `off` will disable the timer. If no parameter is passed a default pomodoro time of 25 minutes will be assumed.

Note: This is also accessible via the Control View.

#### Ban-Hammer

```
!kick <nick> [<reason>]
```

`chat` `console`

Kicks user `nick` from your room for optional `reason`. The user is free to immediately re-enter.

```
!ban <nick> <minutes> [<reason>]
```

`chat` `console`

Bans user `nick` from your room for `minutes` and optional `reason`. If the `minutes` parameter is omitted, or `*` is used, user `nick` will be banned permanently.

```
!uban <nick>
```

`chat` `console`

Lifts a ban on user `nick`.

#### User

```
!user <nick> <'get'|'set'> <variable> [<value>]
```

`chat` `console`

Arbitrary data can be stored on user `nick` with the `set` command, requiring the `value` parameter. The data can be retrieved using `get` and doesn't require `value`.

```
!user <nick>
```

`chat` `console`

Using the command with only the `nick` parameter will dump the entire user object to the console.

#### Settings

```
!greeting <'true'|'false'>
```

`chat` `console`

Turns the bot's greeting on and off.

### Follower Commands

#### Popouts

`chat` `console`

The file `config/popout.json` contains an example configuration. You'll probably want to make your own commands and use your own images.

If the `message` is assigned an array instead of a string, one of the messages in the array will be randomly chosen when the popout is displayed.

Images have been tested up to `600 x 600`.

### Donor / Founder Commands

####

```
!view
```

`chat` `console`

Switches viewed desktops.

## License

Copyright (C) 2014 Jason Taylor. Released as open-source under [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html).