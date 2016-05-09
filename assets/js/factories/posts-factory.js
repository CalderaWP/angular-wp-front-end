ngWP.app
    .factory('Posts',function($resource){
        return $resource( ngWP.config.api + 'wp/v2/:post_type/:ID?filter[posts_per_page]=:per_page&filter[post_author]=:author', {
            /**
             * without @ is default value
             */
            post_type: 'posts',
            ID:'@id',
            per_page: ngWP.config.posts_per_page,
            author: '@author'
        });
    })
    .factory( 'LocalPosts', function( $http, $resource, localStorageService, Posts, $q ) {
        localPostObj = {
            query: function( data ) {
                var deferred = $q.defer();
                var more_data = {},
                    posts_res = {};
                if( !data.post_type ) {
                    data.post_type = 'posts';
                }
                Posts.query(data, function(res, status, headers, config){
                    var posts_res = res,
                        more_data = status();
                    /**
                     * Check localStorage first
                     */
                    if( localStorageService.get('posts[' + data.post_type + ']') ) {
                        deferred.resolve({
                            posts: localStorageService.get('posts[' + data.post_type + ']'),
                            total_posts: more_data['x-wp-total']
                        });
                    } else {
                        localStorageService.set( 'posts[' + data.post_type + ']', posts_res );
                        deferred.resolve({
                            posts: posts_res,
                            total_posts: more_data['x-wp-total']
                        });
                    }
                });
                return deferred.promise;
            },
            /**
             * Get a specific page number based on per_page
             * @param data
             * @returns {*}
             */
            getPage: function( data ) {
                if( !data || !data.page ) {
                    return false;
                }
                if( !data.post_type ) {
                    data.post_type = 'posts';
                }
                var deferred = $q.defer();

                Posts.query(data, function(res){
                    var current_posts = localStorageService.get('posts[' + data.post_type + ']');
                    angular.forEach( res, function( value, key ) {
                        current_posts.push( value );
                    });
                    localStorageService.set('posts[' + data.post_type + ']', current_posts );
                    deferred.resolve( res );
                });
                return deferred.promise;
            },

            getSingle: function( data ) {
                if( !data || !data.slug ) {
                    return false;
                }
                var deferred = $q.defer();
                var current_posts = localStorageService.get( 'posts.posts' );
                data.per_page = 1;
                for( var i = 0; i < current_posts.length; i++ ) {
                    if( current_posts[i].slug == data.slug ) {
                        deferred.resolve( current_posts[i] );
                        break;
                    }
                };
                return deferred.promise;
            }
        };

        return localPostObj;
    })