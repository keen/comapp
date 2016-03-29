require('dotenv').config();

var superagent = require('superagent'),
    bodyParser = require('body-parser');

var Firebase = require('firebase'),
	userRef = new Firebase('https://' + process.env.FIREBASE_URL + '/web/data/users');

!function(){

    var INTERCOM_URL = 'https://api.intercom.io/users';

    init();

    function callIntercomApi(url){
        superagent
          .get(authUrl(url))
          .set('Accept', 'application/json')
          .end(function(err, res){
            // res.body:
            // type, pages, users, total_count
              //  console.log(res.body);
              intercomResults(res.body);
          });
    }

    function intercomResults(data){
        // console.log(data);
        for (var i = 0; i < data.users.length; i++) {
            addUserToFirebase(data.users[i]);
        }
        console.log(data.pages.next);
        if (data.pages.next) {
            callIntercomApi(data.pages.next);
        }
    }


    function addUserToFirebase(request, response){
        console.log(request.user_id);

        var user = request;
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
        if(typeof(user.user_id) === 'object'){
          return
        } else {
          userRef.child(user.user_id).set(firebaseData);
        }
        // console.log(firebaseData);
    }

    function authUrl(url) {
      var urlParts = url.split("://");

      return urlParts[0] + "://" + process.env.INTERCOM_APP_ID + ':' + process.env.INTERCOM_API_KEY + "@" + urlParts[1];
    }

    function init(){
        callIntercomApi(INTERCOM_URL);
    }

}();
