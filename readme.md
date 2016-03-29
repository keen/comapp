Hi.

To get going you will need to `npm install`

There is a heroku instance running and firebase instance holding the data. You can view the map by opening index.html in your browser.


### Secret Keys

You need to set the following secret keys in a `.env` file:

```
EVENTBRITE_KEY=

INTERCOM_APP_ID=
INTERCOM_API_KEY=

KEEN_PROJECT_ID=
KEEN_WRITE_KEY=

MAPBOX_ACCESS_TOKEN=

FIREBASE_URL=
```

### Starting

**Client Server**
```
node server/index.js
```

**Webhook Server**
```
`node webhooks/index.js
```

**Initial Data Pull**
```
node scripts/data.js
```