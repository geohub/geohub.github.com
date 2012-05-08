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
