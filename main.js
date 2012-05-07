function progress(str) {
    $('#progress').text(str);
}

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

function debug(str) {
    // $('#log').append(str + '\n');
}

function log(str) {
    $('#log').append(str + '\n');
}

function friends(user) {
    progress('Getting repos for ' + user + '...');
    getUserRepos(user, function(r) {
        progress('Getting contributors for ' + user + '/' + r.name);
        getRepoContributors(r.owner.login, r.name, function(c) {
            progress('Getting details for ' + c.login);
            getUser(c.login, function(c) {
                if(c.location) {
                    log(c.login + ' (' + c.name + ') @ ' + c.location);
                }
            });
        });
    });
}

$(document).ready(function() {

    $('#login').submit(function() {
        var user = $('#login-login').val();
        friends(user);
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
