Progress.prototype = new Model();
Progress.prototype.constructor = Progress;

function Progress() {
    Model.call(this);
    this.done = 0;
    this.queued = 0;
}

Progress.prototype.push = function() {
    this.queued++;
    this.triggerChange();
}

Progress.prototype.pop = function() {
    this.queued--;
    this.done++;
    this.triggerChange();
}

Progress.prototype.isStarted = function() {
    return this.queued > 0;
}


ProgressView = function(model) {
    this.model = model;
    this.element = $(document.createElement('div')).text('Hang on...');

    this.model.addChangeListener(this);
    this.onChange();
}

ProgressView.prototype.onChange = function() {
    this.element.text('Getting neighbour information: ' +
            this.model.done + ' done, ' +
            this.model.queued + ' queued');
}


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

function addRepo(map, friends, user, repo, progress) {
    console.log('Adding ' + user.login + ' for repo ' + repo.name);

    if(user.login && user.location) {
        var friend;

        if(!friends[user.login]) {
            var avatar = 'http://www.gravatar.com/avatar/' +
                    user.gravatar_id + '?s=32';

            friend = new Friend(user.login, user.name, user.location,
                    user.url, avatar);
            friends[user.login] = friend;

            map.addFriendMarker(friend, function(marker) {
                progress.pop();
            });
        } else {
            friend = friends[user.login];
            progress.pop();
        }

        friend.addRepo(repo);
    } else {
        progress.pop();
    }
}

function main(user) {
    var selection = new Selection();
    var selectionView = new SelectionView(selection);
    $('#info').empty().append(selectionView.element);

    var map = new Map('map', selection);

    var friends = {};
    var progress = new Progress();
    var progressView = new ProgressView(progress);
    $('#progress').empty().append(progressView.element);

    /* First get some info on the current user */
    github.getUser(user, function(userInfo) {
        github.getUserRepos(user, function(r) {
            /* Pass owner as null when it's our own repo */
            var owner = r.owner.login == userInfo.login ? null : r.owner.login;
            var repo = new Repo(owner, r.name, r.url);

            github.getRepoContributors(r.owner.login, r.name, function(c) {
                /* Not ourselves. */
                if(c.login != userInfo.login) {
                    progress.push();
                    github.getUser(c.login, function(c) {
                        addRepo(map, friends, c, repo, progress);
                    });
                }
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

    $('#login').submit(function() {
        /* Fancy animation to show info div and hide banner */
        if($('#banner').css('display') != 'none') {
            $('#banner').slideUp(1000);
            $('#info').slideDown(1000);
            $('#map').show();
        }

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
