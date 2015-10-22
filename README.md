Missing images; cause, you know, copyright.

I don't plan on maintaining this or providing support - I just don't have the time.

If you want to maintain this or clean it up or whatever, fork it. Just give me some credit, k? Thanks. :)

## Features

  * kick
  * temporary/permanent ban
  * proxy account
  * follower recognition (via RSS)
  * control view
  * focus timer
  * overlay images and text
  * overlay chat
  * OBS scene switching
  * message repeat protection with escalating ban duration
  * message flood protection with escalating ban duration
  * message length protection with escalating ban duration

## Commands

  Parameters are delimited by `<>` as in `<parameter>`.

  Keywords are delimited by `''` as in `'keyword'` and must be entered exactly as seen.

  Optional parameters are delimited by `[]` as in `[<optional>]`.

  For all commands, `nick` may be prefixed with `@`.

### Admin Commands

#### Task

```
!task <'set'|'clear'> [<task>]
```

Sets or clears the task display in the visual overlay. If used with `set` the `task` parameter is required. If used without `set` the `task` parameter is not needed.

Note: This is also accessible via the Control View.

#### Focus

```
!focus [<minutes|'off'>]
```

Starts the Focus timer if used with a numeric `minutes` parameter. `off` will disable the timer. If no parameter is passed a default pomodoro time of 25 minutes will be assumed.

Note: This is also accessible via the Control View.

#### Ban-Hammer

```
!kick <nick> [<reason>]
```

Kicks user `nick` from your room for optional `reason`. The user is free to immediately re-enter.

```
!ban <nick> <minutes> [<reason>]
```

Bans user `nick` from your room for `minutes` and optional `reason`. If the `minutes` parameter is omitted, or `*` is used, user `nick` will be banned permanently.

```
!uban <nick>
```

Lifts a ban on user `nick`.

#### User

```
!user <nick> <'get'|'set'> <variable> [<value>]
```

Arbitrary data can be stored on user `nick` with the `set` command, requiring the `value` parameter. The data can be retrieved using `get` and doesn't require `value`.

#### Settings

```
!greeting <'true'|'false'>
```

Turns the bot's greeting on and off.

### Follower Commands

#### Popouts

The file `config/popout.json` contains an example configuration. You'll probably want to make your own commands and use your own images.

If the `message` is assigned an array instead of a string, one of the messages in the array will be randomly chosen when the popout is displayed.

Images have been tested up to `600 x 600`.

### Donor / Founder Commands

####

```
!view
```

Switches viewed desktops.

## License

Copyright (C) 2014 Jason Taylor. Released as open-source under [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html).