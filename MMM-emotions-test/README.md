# MagicMirror² - LetheCalendar Module
This is a module for `MagicMirror²`; the purpose of this module is to show the calendar entries of the LETHE studies' participant.

## Installation
1. Insert custom css file into the MagicMirror css folder.
2. Copy the MMM-LetheCalendar Folder to MagicMirror `modules`.
3. Edit the MagicMirror configuration file under `config/config.js` with the following configuration.
```
{
			module: "MMM-LetheCalendar",
			header: "Lethe Calendar",
			position: "top_left",
			config: {
				limitdays: "50",
				dateoptions:{
					day: "2-digit",
					month: "short",
					year: "numeric",
					hour: "numeric",
					minute: "numeric",
				},
				durationformat: "min",
				datelocales: "de-AT",
				umail: "mirror.dummy@fhjoanneum.at",
				timeout: "10000",
				url: "http://athen.technikum.fh-joanneum.local:5000/graphql"
			}
		}
```

### Preview
![Screenshot](lethe_cal.png)



## Configuration options

| Option                 | Description
|------------------------|-----------
| `limitdays` | Value in days until the module shows calendar entries.<br><br> **Type:** `integer` <br>**Default value:** `50`
| `dateoptions`| Formatting options for the dates displayed in this module.<br><br> **Type:** `dict of Intl.DateTimeFormat Options` <br>**Default value:** <br>`dateoptions: { timeZone:"Europe/Vienna", hour12:"false", hourCycle:"h24", weekday:"long", year:"numeric", month:"numeric", day:"numeric", hour:"numeric", minute:"numeric", second:"numeric", timeZoneName:"long" }`
| `durationformat` | Unit of measure for the duration displayed.<br><br> **Type:** `text` <br>**Default value:** `min`<br>
| `datelocales` | Localized date format for the dates displayed in this module.<br><br> **Type:** `string of Intl.Locale` <br>**Default value:** `de-AT`
| `umail` | Patient email used in the LETHE database.<br><br> **Type:** `text` <br>**Default value:** `mirror.dummy@fhjoanneum.at`
| `timeout` | Max time in ms that a query is allowed to take until a timeout exception is thrown<br><br> **Type:** `integer` <br>**Default value:** `8000`
| `url` | The GraphQL endpoints' address<br><br> **Type:** `text` <br>**Default value:** `http://athen.technikum.fh-joanneum.local:5000/graphql`

## Possible values

| Option                 | Description
|------------------------|-----------
| `dateoptions`| **timeZone**: `Europe/Andorra` `Asia/Dubai` `Asia/Kabul` `Europe/Tirane` `Asia/Yerevan` `Antarctica/Casey` `etc. ` <br><br>a full list of values can be found by executing `Intl.supportedValuesOf('timeZone')` <br>or on [MDN web docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)<br><br>**hour12**: `true`, `false`<br> **hourCycle**:`h11` `h12` `h23` `h24`<br>**weekday**:`long` `short` `narrow`<br>**year**:`2-digit` `numeric`<br>**month**:`2-digit` `numeric` `long` `narrow` `short`<br>**day**:`2-digit` `numeric`<br>**hour**:`2-digit` `numeric`<br>**minute**:`2-digit` `numeric`<br>**second**:`2-digit` `numeric`<br>**timeZoneName**:`long` `short`<br>
| `durationformat` | `sec`, `min`, `hour`
| `datelocales`| `af-ZA`, `am-ET`, `ar-AE`, `ar-BH`, `ar-DZ`, `ar-EG`, ... <br><br>a full list of values can be found on [Stack Overflow](https://stackoverflow.com/questions/3191664/list-of-all-locales-and-their-short-codes)


#### Credits
MagicMirror²:   [MagicMirror²](https://github.com/MichMich/MagicMirror)

