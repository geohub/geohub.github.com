var github = {};

github.github = function(uri, cont, page) {
    if(page) uri += '&page=' + page;
    else page = 1;

    debug('Call ' + uri);
    $.getJSON(uri, function(response) {
        var meta = response.meta;
        var data = response.data;

        debug(meta.status + ' for ' + uri);

        /* Check if we have a next page */
        var haveNextPage = false;
        for(var i in meta.Link) {
            var link = meta.Link[i];
            if(link[1].rel == "next") haveNextPage = true;
        }

        /* Call callback */
        cont(data, haveNextPage);
        if(haveNextPage) {
            github.github(uri, cont, page + 1);
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

/* Get all repositories for a user.
 *
 * The repositories which were created by the user (i.e., non-forks) are listed
 * first.
 */
github.getUserRepos = function(user, cont) {
    var uri = 'https://api.github.com/users/' + user + '/repos?callback=?';
    var repos = [];
    github.github(uri, function(rs, haveNextPage) {
        console.log('Got ' + rs.length + ' new repos');
        repos = repos.concat(rs);
        console.log('Now at ' + repos.length + ' repos');
        if(!haveNextPage) {
            repos.sort(function(x, y) {return Number(x.fork) - Number(y.fork)});
            console.log('No next page');
            for(var i in repos) {
                console.log(repos[i].name);
                cont(repos[i]);
            }
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
