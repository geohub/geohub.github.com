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

function getUser(user, cont) {
    var uri = 'https://api.github.com/users/' + user + '?callback=?';
    github(uri, cont);
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

function Model() {
    this.listeners = [];
}

Model.prototype.addChangeListener = function(listener) {
    this.listeners.push(listener);
}

Model.prototype.triggerChange = function() {
    for(var i in this.listeners) {
        this.listeners[i].onChange(this);
    }
}


Friend.prototype = new Model();
Friend.prototype.constructor = Friend;

function Friend(login, name, location) {
    Model.call(this);
    this.login = login;
    this.name = name;
    this.location = location;
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
    this.element.text(this.model.name + ' (' + this.model.location + ')' +
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

function main(user) {

    friends = {};

    progress('Getting repos for ' + user + '...');
    getUserRepos(user, function(r) {
        progress('Getting contributors for ' + user + '/' + r.name);
        getRepoContributors(r.owner.login, r.name, function(c) {
            progress('Getting details for ' + c.login);
            getUser(c.login, function(c) {
                if(c.login && c.location) {
                    if(!friends[c.login]) {
                        friends[c.login] = new Friend(
                                c.login, c.name, c.location);
                        friendView = new FriendView(friends[c.login]);
                        $('body').append(friendView.element);
                    }

                    friends[c.login].addRepo(r.owner.login + '/' + r.name);
                }
                /*
                if(c.location) {
                    log(c.login + ' (' + c.name + ') @ ' + c.location);
                }
                */
            });
        });
    });
}

$(document).ready(function() {

    $('#login').submit(function() {
        var user = $('#login-login').val();
        main(user);
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
