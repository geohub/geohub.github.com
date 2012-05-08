////////////////////////////////////////////////////////////////////////////////
// Utility

function progress(str) {
    $('#progress').text(str);
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
        progress('Getting contributors for ' + user + '/' + r.name);
        github.getRepoContributors(r.owner.login, r.name, function(c) {
            /* Not ourselves. */
            if(c.login != user) {
                progress('Getting details for ' + c.login);
                github.getUser(c.login, function(c) {
                    addRepo(friends, c, r.owner.login + '/' + r.name);
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
