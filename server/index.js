require('dotenv').config();

var express = require('express'),
	bodyParser = require('body-parser'),
	app = express();

// Firebase stuff, setup the DB and add the different "children"
var Firebase = require('firebase'),
	rootRef = new Firebase('https://' + process.env.FIREBASE_URL+ '/web/data'),
	userRef = rootRef.child("users"),
	companyRef = rootRef.child("companies"),
	eventRef = rootRef.child("events");

// Superagent to get the event data from the eventbrite webhook
var request = require('superagent');

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/../views'));
app.use(bodyParser.json());

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/../public'));

// Start up the server
app.get('/', function(request, response){
  response.render('index', {env: process.env});
});

// Route for intercom webhook
app.post('/user', function(request, response) {
	// For the new user
	if (request.body.topic == "user.created") {
		var user = request.body.data.item;
		console.log(user);
		var firebaseData = {
				"id": user.id,
				"user_id": user.user_id,
				"email": user.email,
				"name": user.name,
				"location_data": user.location_data,
				"created_at": user.created_at,
				"signed_up_at": user.signed_up_at,
				"companies": user.companies,
				"last_request_at": user.last_request_at,
				"last_seen_ip": user.last_seen_ip,
				"remote_created_at": user.remote_created_at,
				"updated_at": user.updated_at,
				"social_profiles": user.social_profiles
		}

		userRef.child(user.user_id).set(firebaseData);
	}
	// For new company
	if (request.body.topic == "company.created") {
		var company = request.body.data.item;
		console.log("company: ", company);
		var firebaseData = {
			"id": company.id,
			"company_id": company.company_id,
			"app_id": company.app_id,
			"name": company.name,
			"plan_id": company.plan_id,
			"remote_created_at": company.remote_created_at,
			"created_at": company.created_at,
			"updated_at": company.updated_at,
			"last_request_at": company.last_request_at,
		};

		companyRef.child(company.company_id).set(firebaseData);
	};
});

// Webhook for eventbrite
app.post('/events', function(request, response) {
  if(request.body.config.action == "event.published") {
    // Eventbrite doesn't acutally send the event details so
    // you need to make a seperate call to the api sent through
    // the webhook to get the actual event data
    var url = '',
        ev,
        venue,
        firebaseData;

    url = request.body.api_url;

    if (!url) {
      console.log("No url in the request body.");
      return;
    }

    makeEventbriteRequest(url);

    return;
  }
});

// Just making the api call for eventbrite and return the response body
function makeEventbriteRequest(url) {
  var venue = null,
      venue_id,
      ev;

  request
  .get(url)
  .set('Authorization', 'Bearer ' + process.env.EVENTBRITE_KEY)
  .set('Accept', 'application/json')
  .end(function(error, response) {
    if (error) {
      console.log("Error: " + error);
    }
    else {
      ev = response.body;

      venue_id = ev.venue_id;
      venue_url = "https://www.eventbriteapi.com/v3/venues/" + String(venue_id);

      request
      .get(venue_url)
      .set('Authorization', 'Bearer ' + process.env.EVENTBRITE_KEY)
      .set('Accept', 'application/json')
      .end(function(error, response) {
        if (error) {
          console.log("Error getting venue: " + error);
        } else {
          venue = response.body;

          firebaseData = {
            "name": ev.name.text,
            "id": ev.id,
            "url": ev.url,
            "description": ev.description,
            "start": ev.start,
            "end": ev.end,
            "created": ev.created,
            "venue": venue,
            "organizer_id": ev.organizer_id
          };

          eventRef.child(ev.id).set(firebaseData);

          return;
        }
      });
    }
  });
}


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
