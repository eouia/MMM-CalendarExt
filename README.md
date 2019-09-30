# MMM-CalendarExt
Alternative calendar module for [MagicMirror](https://magicmirror.builders/)

## Screenshots
![](https://github.com/eouia/MMM-CalendarExt/blob/master/screencaptures/monthly_home.png)
![](https://github.com/eouia/MMM-CalendarExt/blob/master/screencaptures/screen.jpg)

## Features
- `daily`, `weekly`, `monthly`, `month`, `weeks`, `upcoming`, `current` views are supported.
- All/any views in any regions.
- Profiles are supported (`MMM-ProfileSwitcher` or any modules which use `CHANGED_PROFILE` notification)
- Configuration can be changed by profile.
- Runtime-Configuration available.
- Your other module can add, update and remove `instant events`.
- Your other module can ask events and get answers.
- Almost everything customizable with configuration and CSS.

## For RPI zero or RPI 1 users
- For RPI zero or RPI 1 users, use the branch `forRPI1`(https://github.com/eouia/MMM-CalendarExt/tree/forRPI1)

## Install
```
cd ~/MagicMirror/modules
git clone https://github.com/eouia/MMM-CalendarExt.git
```

## Configuration
See the page about [Configuration](https://github.com/eouia/MMM-CalendarExt/wiki/Configuration).

## Plugins
- [MMM-CalendarExtTimeline](https://github.com/eouia/MMM-CalendarExtTimeline)
- [MMM-CalendarExtMinimonth](https://github.com/eouia/MMM-CalendarExtMinimonth)

## Manipulation of looks
See the page about [Looks](https://github.com/eouia/MMM-CalendarExt/wiki/Manipulation-of-looks).

## How to use with profiles
See the page about [How to use with profile](https://github.com/eouia/MMM-CalendarExt/wiki/How-to-use-with-profiles).

## Use Notification (for module developers)
See the page about [Use Notification](https://github.com/eouia/MMM-CalendarExt/wiki/Use-Notification-(for-module-developers))

## Performance Issues
See the [Performance Issues](https://github.com/eouia/MMM-CalendarExt/wiki/Performance-Issues) page. 

## Possible bugs
This module is not yet tested enough.
- locale issues could be. (this module use `moment.js`, so some issues could be caused by version or settings of  `moment.js`)
- profile related issues could be. (not fully tested. I have not used MMM-ProfileSwitcher severely.)
- or any of my mistakes. I'm an old-school amateur programmer and not familiar with Javascript. Please report any issues on `Github`.

## These are not bugs, But...
- `month` view is too big to be displayed on a low-resolution screen.
- No animation effect is supported when MM shows and hides modules. Because this module uses tricks of fake module DOM for showing views out of region limits. So, MM cannot show and hide views of this module directly. Therefore, this module control showing and hiding views by itself.  
- For example, in the United States, Sunday is the first day of the week. The week with January 1st in it is the first week of the year. In France, Monday is the first day of the week, and the week with January 4th is the first week of the year. So if you are an alien in a foreign country, this cultural difference could cause some inconveniences by the setting of locale.

Thank you.

@eouia
