// npm start

!function(){

    // Initalize mapbox
    L.mapbox.accessToken = keys.mapbox.access_token;

    var map = L.mapbox.map('map', 'elof.map-6s2qv4cc')
              .setView([31.203, 5.449], 2);

    // Used to send data to firebase from the browser for user created events
    var ref = new Firebase('https://' + keys.firebase.url + '/web/data/userCreatedEvents');

    // keeps all GeoJson available so we don't have to reload the page after playing with data
    var allUserGeoJSON = [];

    // Keep our place markers organized in a nice group.
    var eventPlaces = L.mapbox.featureLayer().addTo(map),
        userCreatedEventPlaces = L.mapbox.featureLayer().addTo(map),
        userPlaces = new L.MarkerClusterGroup(),
        cluster = map.addLayer(userPlaces);

    var RADIUS = 80500;

    // Set radius for when clicking on an event
    var eventRadiusCircle = L.circle(new L.LatLng(37.78, 122.41), RADIUS, {
        opacity: 0,
        weight: 1,
        fillOpacity: 0
      });

    // set variables to be used for unbinding functions
    var currentEvent,
        addCustomEventOn,
        introductionIsActive;

    // listen to clickes that happen on various events
    eventPlaces.on('click', onEventClicked);
    userCreatedEventPlaces.on('click', onEventClicked);

    // listen for clicks to add a custom event to map
    $(document).ready(function() {
      $("button").click(function(){
        $("<div>You can now add an event to the map by clicking on the events location!</div>").dialog();
          addCustomEventOn = true;
          addCustomEventToMap();
      });
    });

    // listen for clicks to close custom event form without sending a custom event
    $(document).ready(function() {
      $("#exit_popup").click(function(){
        document.getElementById('event_form').style.display = "none";
        document.getElementById("form").reset();
        addCustomEventOn = false;
      });
    });

    // listen for clicks to close intro message
    $(document).ready(function() {
      $("#get_started").click(function(){
        $('.loading-overlay').hide();
      });
    });

    if( !introductionIsActive ) {
      $('#get_started').hide();
    }

    init();

    function callIntercomApi(){
        // Get a database reference to our users
        var ref = new Firebase('https://' + keys.firebase.url + '/web/data/users');

        // Attach an asynchronous callback to read the data at our posts reference
        ref.once("value", function(snapshot) {
          snapshot.forEach(function(data){
              addUserToMap(data.val());
          });

          userPlaces.addLayer(L.geoJson({
            type: "FeatureCollection",
            features: allUserGeoJSON
          }, {
            pointToLayer: L.mapbox.marker.style,
            style: function(feature) { return feature.properties; }
          }));

          // return map to origional settings after an event has been clicked
          MapInteraction.resetUserSignups(map, userPlaces, allUserGeoJSON);

          // Done getting data, reveal get started button
          $('#get_started').show();

        }, function (errorObject) {
          console.log("The read failed: " + errorObject.code);
        });
    }

    function callCompanyApi(){

        var ref = new Firebase('https://' + keys.firebase.url + '/web/data/companies');
    }

    function callEventbriteApi(){

      var ref = new Firebase('https://' + keys.firebase.url + '/web/data/events');

        ref.on("value", function(snapshot) {
          snapshot.forEach(function(data){
              addEventToMap(data.val());
          });
        }, function (errorObject) {
          console.log("The read failed: " + errorObject.code);
        });
    }

    function callUserAddedEventApi(){

        ref.on("value", function(snapshot) {
          snapshot.forEach(function(data){
              addUserAddedEventToMap(data.val());
          });
        }, function (errorObject) {
          console.log("The read failed: " + errorObject.code);
        });
    }

    function addUserToMap(user){

      if(typeof(user.location_data) === 'undefined'){
        return
      }
      if(typeof(user.location_data.latitude) === 'undefined'){
        return
      }
      if(typeof(user.location_data.longitude) === 'undefined'){
        return
      }

        var lat = user.location_data.latitude;
        var lng = user.location_data.longitude;

        var properties = {
            'name': user.name,
            'email': user.email,
            'signup-date': user.signed_up_at * 1000,
            'marker-color': '#00AFD7',
            'marker-size': 'small',
            "marker-symbol": "star-stroked"
        };

        var geojson =
                {
                  type: 'Feature',
                  properties: properties,
                  geometry: {
                      type: 'Point',
                      coordinates: [lng, lat]
                }
            };

        if(typeof(user.companies.companies) !== 'undefined') {
          properties.company = user.companies.companies['0'].name;
        }

        allUserGeoJSON.push(geojson);

    }

    function addEventToMap(ev){

      if(typeof(ev.venue.address) === 'undefined'){
        return
      }
        var lat = ev.venue.address.latitude;
        var lng = ev.venue.address.longitude;

        var geojson =
                {
                type: 'Feature',
                features: [{
                    type: 'Feature',
                    properties: {
                        'name': ev.name,
                        'date': new Date(ev.end.utc).getTime(),
                        'marker-color': '#F35757',
                        'marker-size': 'small',
                        "marker-symbol": "star"
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    }
                }]
            };

        var oldGeoJson = eventPlaces.getGeoJSON();

        if(typeof(oldGeoJson) === 'undefined') {
            eventPlaces.setGeoJSON(geojson);
        } else {
            if(typeof(oldGeoJson.length) !== 'number') {
                eventPlaces.setGeoJSON([geojson, oldGeoJson]);
            } else {
                oldGeoJson.push(geojson);
                eventPlaces.setGeoJSON(oldGeoJson);
            }
        }
    }

    function addUserAddedEventToMap(ev){

      if(typeof(ev.latlng) === 'undefined'){
        return
      }

      var lat = ev.latlng.lat;
      var lng = ev.latlng.lng;

      var geojson =
              {
              type: 'Feature',
              features: [{
                  type: 'Feature',
                  properties: {
                      'name': ev.name,
                      'date': new Date(ev.date).getTime(),
                      'marker-color': '#F35757',
                      'marker-size': 'small',
                      "marker-symbol": "star"
                  },
                  geometry: {
                      type: 'Point',
                      coordinates: [lng, lat]
                  }
              }]
          };

          userCreatedEventPlaces.setGeoJSON(geojson);
    }

    function init(){
        callIntercomApi();
        callCompanyApi();
        callEventbriteApi();
        callUserAddedEventApi();
    }

    // function to clone all users before we clear the map to be used to return to original state without refresh
    function clone(obj) {
        if (null == obj || "object" != typeof obj) return obj;
        var copy = obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
        }
        return copy;
    }

    // set radius around the event that was clicked on
    function onEventClicked(ev) {
      currentEvent = ev;
      map.addLayer(eventRadiusCircle);
      eventRadiusCircle.setLatLng(ev.latlng)
      eventRadiusCircle.setStyle({
        opacity: 1,
        fillOpacity: 0.2
      });

      // set the view to be zoomed onto event location
      map.setView(ev.latlng, 9);

      // clear the map of user pins
      userPlaces.clearLayers();

      // create variables to hold our different user types
      var usersWithinDistance =[];
      var usersBeforeEvent = [];
      var usersAfterEvent = [];

        // iterate through all users to find the ones that are located within the radius
        for(var i=0,max=allUserGeoJSON.length; i<max; i++) {
          // Create a clone so we don't permanently modify the original
          var user = clone(allUserGeoJSON[i]);
          var userLatLng = new L.LatLng(user.geometry.coordinates[1], user.geometry.coordinates[0]);
          if(ev.latlng.distanceTo(userLatLng) <= RADIUS) {
            if( user.properties["signup-date"] < ev.layer.feature.properties.date ) {
                user.properties['marker-color'] = '#000000';
              usersBeforeEvent.push(user);
            } else {
              user.properties['marker-color'] = '#008000';
              usersAfterEvent.push(user);
            }
           }
         }

      // grabs date of event that was clicked on to iterate through users in radius
      var date = new Date(ev.layer.feature.properties.date);

      // sets popup tooltip for event that is clicked on
      var popup = L.popup()
      	.setLatLng(ev.latlng)
          .setContent('<p>name: ' + ev.layer.feature.properties.name + '<br \/>' +
          'date: ' + date + '<br \/>' +
          'signups before: ' + usersBeforeEvent.length + '<br \/>' +
          'signups after: ' + usersAfterEvent.length)
      	.openOn(map);
      // adds users who signed up before event to one layer
      userPlaces.addLayer(L.geoJson({
        type: "FeatureCollection",
        features: usersBeforeEvent
      }, {
        pointToLayer: L.mapbox.marker.style
      }));
      // adds users who signed up after an event to one layer
      userPlaces.addLayer(L.geoJson({
          type: "FeatureCollection",
          features: usersAfterEvent
        }, {
          pointToLayer: L.mapbox.marker.style
      }));

    }

    function addCustomEventToMap() {
    // allows for clicking on map to drop a pin for an event that wasn't in Eventbrite
    map.on('click', function(ev) {

      if (!addCustomEventOn) return;

      div_show();

      var eventLatLng = new L.LatLng(ev.latlng.lat, ev.latlng.lng);

      window.check_empty = function() {

        // Creat an object to send to Firebase if the form is validated
        var firebaseData = {
          "latlng": eventLatLng,
          "name": document.getElementById('name').value,
          "date": document.getElementById('datepicker').value,
          "description": document.getElementById('msg').value
        }
        // Validating Empty Fields
        if (document.getElementById('name').value == "" || document.getElementById('datepicker').value == "" || document.getElementById('msg').value == "") {
          $("<div>Fill all fields please!</div>").dialog();
        } else {
              div_hide();
              ref.push(firebaseData);
              document.getElementById("form").reset();
              addCustomEventOn = false;
              }
        }
        //Function To Display Popup
        function div_show() {
        document.getElementById('event_form').style.display = "block";
        }
        //Function to Hide Popup
        function div_hide(){
        document.getElementById('event_form').style.display = "none";
        }
      });
    }

    // Tooltip pop up to show user information
    userPlaces.on('click', function(ev) {
      var date = new Date(ev.layer.feature.properties['signup-date']);
      var popup = L.popup()
      	.setLatLng(ev.latlng)
          .setContent('<p>name: ' + ev.layer.feature.properties.name + '<br \/>' +
          'company: ' + ev.layer.feature.properties.company + '<br \/>' +
          'email: ' + ev.layer.feature.properties.email + '<br \/>' +
          'date signed up: ' + date)
      	.openOn(map);
    });

    // click outside of event radius to return to origional view
    map.on("click", function(ev) {
    map.removeLayer(eventRadiusCircle);
    MapInteraction.resetUserSignups(map, userPlaces, allUserGeoJSON);
    });

}();
