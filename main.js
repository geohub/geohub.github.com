////////////////////////////////////////////////////////////////////////////////
// Utility

function progress(str) {
    $('#progress').text(str);
}


////////////////////////////////////////////////////////////////////////////////
// Github API

function github(uri, cont, page) {
    if(page) uri += '&page=' + page;
    else page = 1;

    debug('Call ' + uri);
    $.getJSON(uri, function(response) {
        var meta = response.meta;
        var data = response.data;

        debug(meta.status + ' for ' + uri);

        cont(data);

        /* Pagination */
        for(var i in meta.Link) {
            var link = meta.Link[i];
            if(link[1].rel == "next") {
                github(uri, cont, page + 1);
            }
        }
    });
}

var getUserCache = {};

function getUser(user, cont) {
    if(getUserCache[user]) {
        cont(getUserCache[user]);
    } else {
        var uri = 'https://api.github.com/users/' + user + '?callback=?';
        github(uri, function(data) {
            getUserCache[user] = data;
            cont(data);
        });
    }
}

function getUserRepos(user, cont) {
    var uri = 'https://api.github.com/users/' + user + '/repos?callback=?';
    github(uri, function(repos) {
        for(var i in repos) {
            cont(repos[i]);
        }
    });
}

function getRepoContributors(user, repo, cont) {
    var uri = 'https://api.github.com/repos/' + user + '/' + repo +
            '/contributors?callback=?';
    github(uri, function(contributors) {
        for(var i in contributors) {
            cont(contributors[i]);
        }
    });
}


////////////////////////////////////////////////////////////////////////////////
// Models

Friend.prototype = new Model();
Friend.prototype.constructor = Friend;

function Friend(login, name, loc) {
    Model.call(this);
    this.login = login;
    this.name = name;
    this.loc = loc;
    this.repos = [];
}

Friend.prototype.addRepo = function(repo) {
    if(this.repos.indexOf(repo) < 0) {
        this.repos.push(repo);
        this.triggerChange();
    }
}


////////////////////////////////////////////////////////////////////////////////
// Views

function FriendView(model) {
    this.model = model;
    this.element = $(document.createElement('p'));

    this.model.addChangeListener(this);
    this.onChange(this.model);
}

FriendView.prototype.onChange = function() {
    this.element.text(this.model.name + ' (' + this.model.loc + ')' +
            ' worked with you on ' +
            this.model.repos.join(', ') +
            ' (' + this.model.repos.length + ')' + '.');
}


////////////////////////////////////////////////////////////////////////////////
// Main

function debug(str) {
    // $('#log').append(str + '\n');
}

function log(str) {
    $('#log').append(str + '\n');
}

function addRepo(friends, user, repo) {
    if(user.login && user.location) {
        var friend;

        if(!friends[user.login]) {
            friend = new Friend(user.login, user.name, user.location);
            friends[user.login] = friend;

            view = new FriendView(friend);
            $('body').append(view.element);
            map.addMarker(friend.login, friend.loc, function(marker) {
                // view.marker = marker;
                google.maps.event.addListener(marker, 'click', function() {
                    alert(user.login);
                });
            });
        } else {
            friend = friends[user.login];
        }

        friend.addRepo(repo);
    }
}

function main(map, user) {
    friends = {};

    progress('Getting repos for ' + user + '...');
    getUserRepos(user, function(r) {
        progress('Getting contributors for ' + user + '/' + r.name);
        getRepoContributors(r.owner.login, r.name, function(c) {
            progress('Getting details for ' + c.login);
            getUser(c.login, function(c) {
                addRepo(friends, c, r.owner.login + '/' + r.name);
            });
        });
    });

    /*
    progress('Getting contributors for jaspervdj/blaze-html');
    getRepoContributors('jaspervdj', 'blaze-html', function(c) {
        progress('Getting details for ' + c.login);
        getUser(c.login, function(c) {
            addRepo(friends, c, 'jaspervdj/blaze-html');
        });
    });
    */
}

$(document).ready(function() {

    map = new Map('map');

    $('#login').submit(function() {
        var user = $('#login-login').val();
        main(map, user);
        return false;
    });

    /*
    var user = 'jaspervdj';
    getUserRepos('jaspervdj', function(r) {
        getRepoContributors(user, r.name, function(c) {
            getUser(c.login, function(c) {
                if(c.location) {
                    log(c.login + ' (' + c.name + ') @ ' + c.location);
                }
            });
        });
    });
    */
});
