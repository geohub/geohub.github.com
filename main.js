////////////////////////////////////////////////////////////////////////////////
// Utility

function progress(str) {
    $('#progress').text(str);
}


////////////////////////////////////////////////////////////////////////////////
// Models

Friend.prototype = new Model();
Friend.prototype.constructor = Friend;

function Friend(login, name, loc, url, avatar) {
    Model.call(this);
    this.login = login;
    this.name = name;
    this.loc = loc;
    this.url = url;
    this.avatar = avatar;
    this.repos = [];
}

Friend.prototype.addRepo = function(repo) {
    for(var i in this.repos) {
        if(repo.equals(this.repos[i])) return;
    }

    this.repos.push(repo);
};


function Repo(owner, name, url) {
    this.owner = owner;
    this.name = name;
    this.url = url;
}

Repo.prototype.getFullName = function() {
    if(this.owner) return this.owner + '/' + this.name;
    else return this.name;
};

Repo.prototype.equals = function(repo) {
    return this.owner == repo.owner &&
            this.name == repo.name;
};


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
            var avatar = 'http://www.gravatar.com/avatar/' +
                    user.gravatar_id + '?s=32';

            friend = new Friend(user.login, user.name, user.location,
                    user.url, avatar);
            friends[user.login] = friend;

            map.addFriendMarker(friend, function(marker) {
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
    github.getUserRepos(user, function(r) {
        /* Pass owner as null when it's our own repo */
        var owner = r.owner.login == user ? null : r.owner.login;
        repo = new Repo(owner, r.name, r.url);

        progress('Getting contributors for ' + user + '/' + r.name);
        github.getRepoContributors(r.owner.login, r.name, function(c) {
            /* Not ourselves. */
            if(c.login != user) {
                progress('Getting details for ' + c.login);
                github.getUser(c.login, function(c) {
                    addRepo(friends, c, repo);
                });
            }
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

    selection = new Selection();
    selectionView = new SelectionView(selection);
    $('#info').append(selectionView.element);

    map = new Map('map', selection);

    $('#login').submit(function() {
        /* Fancy animation to show info div and hide banner */
        if($('#banner').css('display') != 'none') {
            $('#banner').hide(1000);
            $('#info').show(1000);
        }

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
