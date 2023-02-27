'use strict';

const HELPER_BASE = process.env.HELPER_BASE || "/opt/";
const Response = require(HELPER_BASE + 'response');
const TextResponse = require(HELPER_BASE + 'textresponse');

const base_url = "https://api.yamareco.com/api/v1";
const base_url_gpx = "https://www.yamareco.com/modules/yamareco/";

const fetch = require('node-fetch');
const Headers = fetch.Headers;

exports.handler = async (event, context, callback) => {
    if (event.path == '/yamareco-get-list') {
        var body = JSON.parse(event.body);
        console.log(body);

        var counter = 1;
        var userId = body.userId;
        var response = await do_get(base_url + "/getReclist/user/" + userId + '/' + counter++);
        console.log(response);
        if (response.err != 0)
            throw response.errcode;
        var reclist = response.reclist;
        try {
            while (true) {
                var response = await do_get(base_url + "/getReclist/user/" + userId + '/' + counter++);
                console.log(response);
                if (response.err != 0)
                    throw response.errcode;
                reclist = reclist.concat(response.reclist);
            }
        } catch (error) {}
        return new Response(reclist);
    } else
    if (event.path == '/yamareco-get-user') {
        var body = JSON.parse(event.body);
        console.log(body);

        var userId = body.userId;
        var response = await do_get(base_url + "/getUserInfo/" + userId);
        console.log(response);
        if (response.err != 0)
            throw response.errcode;
        return new Response(response.userinfo);
    } else
    if (event.path == '/yamareco-get-gpx') {
        var qs = event.queryStringParameters;
        console.log(qs);
        var recId = qs.recId;
        var response = await do_get_text(base_url_gpx + "track-" + recId + '.gpx');
        return new TextResponse("application/gpx+xml", response);
    }
};

function do_get(url, qs) {
    console.log(url);
    var params = new URLSearchParams(qs);

    var params_str = params.toString();
    var postfix = (params_str == "") ? "" : ((url.indexOf('?') >= 0) ? ('&' + params_str) : ('?' + params_str));
    return fetch(url + postfix, {
            method: 'GET',
        })
        .then((response) => {
            if (!response.ok)
                throw new Error('status is not 200');
            return response.json();
        });
}

function do_get_text(url, qs) {
    var params = new URLSearchParams(qs);

    var params_str = params.toString();
    var postfix = (params_str == "") ? "" : ((url.indexOf('?') >= 0) ? ('&' + params_str) : ('?' + params_str));
    return fetch(url + postfix, {
            method: 'GET',
        })
        .then((response) => {
            if (!response.ok)
                throw new Error('status is not 200');
            return response.text();
        });
}
