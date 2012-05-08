var github = {};

github.github = function(uri, cont, page) {
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
};

github.userCache = {};

github.getUser = function(user, cont) {
    if(github.userCache[user]) {
        cont(github.userCache[user]);
    } else {
        var uri = 'https://api.github.com/users/' + user + '?callback=?';
        github.github(uri, function(data) {
            github.userCache[user] = data;
            cont(data);
        });
    }
};

github.getUserRepos = function(user, cont) {
    var uri = 'https://api.github.com/users/' + user + '/repos?callback=?';
    github.github(uri, function(repos) {
        for(var i in repos) {
            cont(repos[i]);
        }
    });
};

github.getRepoContributors = function(user, repo, cont) {
    var uri = 'https://api.github.com/repos/' + user + '/' + repo +
            '/contributors?callback=?';
    github.github(uri, function(contributors) {
        for(var i in contributors) {
            cont(contributors[i]);
        }
    });
};
