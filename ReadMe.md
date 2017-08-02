`config.js` structure

```JS
{
	module: 'MMM-CalendarExt',
	position: "top_left",
	classes: 'default everyone',
	config: { // Read below
      system:{ ... },
      viewGlobal: { ... },
      calendarDefault: { ... },
      views: [
        daily: { ... },
        upcoming: { ... },
        ...
      ],
      calendars: [
        {
          url: "...",
          ...
        },
        ...
      ],
      profileConfig: {
        "Tom" : { ... },
      }
    },
}
```

** system **

|namespace  | type  |description     |
|---  |---  |---  |
|system     | {} |global values of modules.     |

example and default values: These values will be used automatically when you have not described.
```JS
system: {
  show: ['daily'],
  locale: '', //default value would be your system default locale by moment.js
  showEmptyView: 1,
  fullDayEventLocalize: 1,
  redrawInterval: 30*60*1000, //minimum 60000
  startProfile: '',
  useProfileConfig: 0,
},
```
|name |type| description|
|---  |---  |---  |
|show| Array of String  | Which view to show. <br> `daily`, `weekly`, `monthly`, `month`, `upcoming`, `current` are available. You can use all or some of these values.<br>The order of view in array is important because it decide the order of stack when views are shown in same region. <br> e.g)`['daily', 'upcoming']`|
|locale |String | Language and locale setting for Calendar. This is related with your `moment.js`. I don't know entire codes which are exactly supported. But major locale codes might be supported. <br>e.g)`en`, `en-gb`, `de`, `fr-ca`... |
|showEmptyView |Integer |`1` for showing view frames when there is no event to show. <br> `0` for hiding with no event. |
|fullDayEventLocalize | Integer | This is related with different timezones. If you live in Germany and want to show US Holiday, the fullDay event could be shown with non-sensed time because it is based US timezone. <br> `1` for fix to your timezone locale. <br> `0` for using original time. |
|redrawInterval |Integer  | (milliseconds) minimum values: `60000` <br> Calendar is not a countdown timer or alternative clock. However, You can refresh calendar view with this interval. |
|startProfile| String | if you want module to start with specific profile settings, use this. <br/>e.g) `'daddy'` or `'Party mode'` |
|useProfileConfig| Integer |`1` for using custom configs per each profile. (I don't recommend, see next section.) <br> `0` for using global configs. |

** viewGlobal **

|namespace  | type  |description     |
|---  |---  |---  |
|viewGlobal     | {} |default common values of each views. You can describe common values here, and omit in each view section. |

```JS
viewGlobal: {
  direction: 'row',
  position: 'bottom_bar',
  overflowRolling: 0,
  overflowHeight: 100,
  overflowDuration: 2,
  timeFormat: 'HH:mm',
  dateFormat: "MMM Do",
  fullDayEventDateFormat: "MMM Do",
  ellipsis: 0,
},

```

|name |type| description|
|---  |---  |---  |
|direction  |String | (affected:`daily`, `weekly`, `monthly`) <br> **available values**: `row`, `row-reverse`, `column`, `column-reverse` <br>You can control the `event slots` direction. <br>  `row` and `row-reverse` are good for horizontal region. `column` and `column-reverse` are good for vertical region. This value is meaningless in `upcoming`, `current` and `month` views  |
|position  |String| Where do you want to display calendar views? If you don't describe this in each view section, this value will be common position of views. |
|overflowRolling| Integer | enable too many events rolling.<br>`1` for rolling, <br>`0` for not. <br> `overflowHeight` and `overflowDuration` will be ignored when this value is set with `0` |
|overflowHeight |Integer  |When overflowed events are rolling, set the height of rolling area. <br> **Never append `px` or `%`.**|
|overflowHeight |Float or Integer  |(seconds) <br>When overflowed events are rolling, set the speed of rolling items. |
|timeFormat |String |formatter of event time display. See the `moment.js` formatter.|
|dateFormat |String |formatter of event date display. See the `moment.js` formatter.|
|fullDayEventDateFormat |String |formatter of fullDay event date. See the ...|
