// When the DOM is loaded, but before all page assets are loaded.
document.addEventListener("DOMContentLoaded", function(event) {

    function reqListener() {

        console.log(this);

        // Get components to "Latest Push" box.
        var avatar = document.getElementById("avatar");
        var date = document.getElementById("date");
        var action = document.getElementById("action");

        // Grab the first (latest) event and parse as Json.
        var response_json = JSON.parse(this.response)[0];

        // Create anchor.
        var anchor = document.createElement("a");
        anchor.href = "https://github.com/" + response_json.actor.login;
        anchor.target = "_blank";

        // Put text within anchor.
        var name = document.createTextNode(response_json.actor.login);
        anchor.appendChild(name);

        // Put anchor within "action" dialogue area.
        action.appendChild(anchor);

        // Add src attribute to avatar image element.
        avatar.src = response_json.actor.avatar_url;

        // Assemble action string.
        var type = response_json.type;
        var verbs = { PushEvent: "pushed" };
        var type_as_verb = verbs[type];
        var action_string = document.createTextNode(" " + type_as_verb);
        action.appendChild(action_string);
    }

    // Create a new XMLHttpRequest and send it to GitHub.
    var request = new XMLHttpRequest();
    request.addEventListener("load", reqListener);
    request.open("GET", "https://api.github.com/users/travishohl/events");
    request.setRequestHeader("Accept", "application/vnd.github.v3+json");
    request.send();
});

/*
insert_response_into_dom = (response) ->
	# Find the latest "PushEvent"
	i = 0
	i++ while response[i].type isnt "PushEvent"
	latest_event = response[i]

	# Pick out and massage data from GitHub
	date = new Date(latest_event.created_at)
	date = date.toLocaleString()
	actor_name = latest_event.actor.login
	avatar_url = latest_event.actor.avatar_url

	type = latest_event.type
	verbs = { PushEvent: "pushed" }
	type = verbs[type] # Convert the "type" to a human-readable verb

	payload_size = latest_event.payload.size
	commit_s = if (payload_size > 1) then "commits" else "commit" # good grammar
	repo_name = latest_event.repo.name

	# Generate action string
	action = "<a href=\"https://github.com/#{actor_name}\" target=\"_blank\">#{actor_name}</a> #{type} #{payload_size} #{commit_s} to <a href=\"https://github.com/#{repo_name}\" target=\"_blank\">#{repo_name}</a>."

	# Insert the latest_event into the DOM
	jQuery("div.github_feed img#avatar").attr src: avatar_url
	jQuery("div.github_feed small#date").html date
	jQuery("div.github_feed div#action").html action
	return
*/
