---
layout:			post
title:			"Understanding Rails Sessions"
date:				2014-11-15 09:34:00
published:	false
categories:	rails http session
---

The Gist
--------

Summary of HTTP
---------------

Hypertext Transfer Protocol ("HTTP") functions as a request-response protocol for communication between clients and servers. The client submits an HTTP request (which is just text) to the server, and the server returns a response (which can consist of text, images, and video) to the client.

Sessions are necessary so that servers can identify clients.

Define Session
--------------
An HTTP session is a sequence of network request-response transactions. A session is typically, but not always, stateful, meaning that at least one of the communicating parts needs to save information about the session history in order to be able to communicate, as opposed to stateless communication, where the communication consists of independent requests with responses.

Common Session Problems and Solutions
-------------------------------------
