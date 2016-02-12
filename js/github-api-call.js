/**
 *  github-api-call.js
 *
 *  Gets the latest GitHub event for user travishohl and caches it
 *  in a localStorage object. For a set amount of time, all page
 *  reloads use the cached object to populate the "Latest Push"
 *  box on the homepage.
 */


function get_github_data() {
    console.log(parseInt(localStorage.getItem('github-event-latest-expires'), 10));
    var date = Date.now();
    console.log(date);
    console.log(parseInt(localStorage.getItem('github-event-latest-expires'), 10) - date);

    // Get the cache expiration date (or undefined) and convert it to Int.
    var cache_expiration_date = parseInt(localStorage.getItem('github-event-latest-expires'), 10);

    // If a cached response exists and the cache hasn't expired.
    if (cache_expiration_date > Date.now()) {
        console.log("Time to load from cache...");
        insert_data_into_dom(JSON.parse(localStorage.getItem('github-event-latest')));
    } else {
        console.log("Time to make a new request...");
        localStorage.clear();
        api_request_to_github();
    }
}


/**
 *  Load the latest response from cache.
 */
function insert_data_into_dom(latest_event) {

    // Get components to "Latest Push" box.
    var avatar_element = document.getElementById("avatar");
    var date_element = document.getElementById("date");
    var action_element = document.getElementById("action");

    // Format event date and add it to the date element.
    var date_value = new Date(latest_event.created_at);
    date_value = date_value.toLocaleString();
    date_text_node = document.createTextNode(date_value);
    date_element.appendChild(date_text_node);

    // Add src attribute to avatar image element.
    avatar_element.src = latest_event.actor.avatar_url;

    // Assemble action string -- create link to GitHub user.
    var anchor = document.createElement("a");
    anchor.href = "https://github.com/" + latest_event.actor.login;
    anchor.target = "_blank";

    // Assemble action string -- put text within link.
    var name = document.createTextNode(latest_event.actor.login);
    anchor.appendChild(name);

    // Assemble action string -- put link within "action" dialogue area.
    action_element.appendChild(anchor);

    // Assemble action string -- associate verbs with events.
    var type = latest_event.type;
    var verbs = { PushEvent: "pushed" };
    var type_as_verb = verbs[type];

    // Assemble action string -- get payload size and commit or commits?
    var payload_size = latest_event.payload.size;
    var commit_s = (payload_size > 1) ? "commits" : "commit";

    // Assemble action string.
    var action_string = document.createTextNode(" " + type_as_verb + " " + payload_size + " " + commit_s + " to ");
    action_element.appendChild(action_string);

    // Assemble action string -- create link to GitHub repo.
    var anchor = document.createElement("a");
    anchor.href = "https://github.com/" + latest_event.repo.name;
    anchor.target = "_blank";

    // Assemble action string -- put text within link.
    var name = document.createTextNode(latest_event.repo.name);
    anchor.appendChild(name);

    // Assemble action string -- put link within "action" dialogue area.
    action_element.appendChild(anchor);
}


/**
 *  A function that creates and sends the API request.
 */
function api_request_to_github() {

    // Create a new XMLHttpRequest and send it to GitHub.
    var request = new XMLHttpRequest();
    request.addEventListener("load", request_listener_success);
    request.addEventListener("error", request_listener_fail);
    request.open("GET", "https://api.github.com/users/travishohl/events");
    request.setRequestHeader("Accept", "application/vnd.github.v3+json");
    request.send();
}


/**
 *  A function to handle the case when the API request succeeds.
 */
function request_listener_success() {

    // Grab the first (latest) event and parse as Json.
    var response_json = JSON.parse(this.response)[0];

    // Insert github data into the dom.
    insert_data_into_dom(response_json);

    // Cache the latest event in localStorage, if available.
    if (storage_available('localStorage')) {
        localStorage.setItem('github-event-latest', JSON.stringify(response_json));
        localStorage.setItem('github-event-latest-expires', Date.now() + 180000); // Cache for three minutes
    }
}


/**
 *  A function to handle the case when the API request fails.
 */
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


/**
 *  Detect whether localStorage is both supported and available.
 *
 *  @link https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API#Testing_for_support_vs_availability
 */
function storage_available(type) {
    try {
        var storage = window[type],
            x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return false;
    }
}
