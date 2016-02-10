function api_request_to_github() {

    // Create a new XMLHttpRequest and send it to GitHub.
    var request = new XMLHttpRequest();
    request.addEventListener("load", request_listener_success);
    request.addEventListener("error", request_listener_fail);
    request.open("GET", "https://api.github.com/users/travishohl/events");
    request.setRequestHeader("Accept", "application/vnd.github.v3+json");
    request.send();
}

function request_listener_success() {
    console.log(this);

    // Get components to "Latest Push" box.
    var avatar_element = document.getElementById("avatar");
    var date_element = document.getElementById("date");
    var action_element = document.getElementById("action");

    // Grab the first (latest) event and parse as Json.
    var response_json = JSON.parse(this.response)[0];

    // Format event date and add it to the date element.
    var date_value = new Date(response_json.created_at);
    date_value = date_value.toLocaleString();
    date_text_node = document.createTextNode(date_value);
    date_element.appendChild(date_text_node);

    // Add src attribute to avatar image element.
    avatar_element.src = response_json.actor.avatar_url;

    // Assemble action string -- create link to GitHub user.
    var anchor = document.createElement("a");
    anchor.href = "https://github.com/" + response_json.actor.login;
    anchor.target = "_blank";

    // Assemble action string -- put text within link.
    var name = document.createTextNode(response_json.actor.login);
    anchor.appendChild(name);

    // Assemble action string -- put link within "action" dialogue area.
    action_element.appendChild(anchor);

    // Assemble action string -- associate verbs with events.
    var type = response_json.type;
    var verbs = { PushEvent: "pushed" };
    var type_as_verb = verbs[type];

    // Assemble action string -- get payload size and commit or commits?
    var payload_size = response_json.payload.size;
    var commit_s = (payload_size > 1) ? "commits" : "commit";

    // Assemble action string.
    var action_string = document.createTextNode(" " + type_as_verb + " " + payload_size + " " + commit_s + " to ");
    action_element.appendChild(action_string);

    // Assemble action string -- create link to GitHub repo.
    var anchor = document.createElement("a");
    anchor.href = "https://github.com/" + response_json.repo.name;
    anchor.target = "_blank";

    // Assemble action string -- put text within link.
    var name = document.createTextNode(response_json.repo.name);
    anchor.appendChild(name);

    // Assemble action string -- put link within "action" dialogue area.
    action_element.appendChild(anchor);

    // Set a cookie containing the API response.
    //var cookie = [name, '=', JSON.stringify(json_object), '; domain=.', window.location.host.toString(), '; path=/;'].join('');
    //document.cookie = cookie;
}

function request_listener_fail() {

    console.log(request.statusText);
    // Get components to "Latest Push" box.
    var avatar_element = document.getElementById("avatar");
    var date_element = document.getElementById("date");
    var action_element = document.getElementById("action");

    // Remove the image element.
    avatar_element.parentNode.removeChild(avatar_element);

    // Remove the date element.
    date_element.parentNode.removeChild(date_element);

    // Display and error message.
    var error_message = document.createTextNode("There was a problem fetching data from the GitHub API.");
    action_element.appendChild(error_message);
}
