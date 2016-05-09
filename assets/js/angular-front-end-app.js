

ngWP.app = angular.module( 'angular-front-end', ['ngResource', 'ui.router', 'LocalStorageModule', 'angularUtils.directives.dirPagination'] )
    .run(function( $rootScope ){
        console.log('app init');
        $rootScope.posts_per_page = ngWP.config.posts_per_page;
    })
    .config(
        ['localStorageServiceProvider', 'paginationTemplateProvider', '$stateProvider', '$urlRouterProvider',
        function( localStorageServiceProvider, paginationTemplateProvider, $stateProvider,$urlRouterProvider ) {
        localStorageServiceProvider.setPrefix('wp');
        paginationTemplateProvider.setPath('./build/js/pagination.tpl.html');

        $urlRouterProvider.otherwise('/');
        $stateProvider
            .state('list',{
                url:'/',
                controller:'listView',
                templateUrl: 'templates/list.html'
            })
            .state('single',{
                url:'/post/:slug',
                controller:'singleView',
                templateUrl: 'templates/single.html'
            })
            .state('author',{
                url:'/author/:author',
                controller:'authorView',
                templateUrl: 'templates/list.html'
            })
    }])
    .filter( 'to_trusted', function( $sce ){
        return function( text ){
            return $sce.trustAsHtml( text );
        }
    })
    .factory('Posts',function($resource){
        return $resource( ngWP.config.api + 'wp/v2/posts/:ID?filter[posts_per_page]=:per_page&filter[post_author]=:author' , {
            ID:'@id',
            per_page: '@per_page',
            author: '@author'
        });
    })
    .factory( 'LocalPosts', function( $http, $resource, localStorageService, Posts, $q ) {
        localPostObj = {
            query: function( data ) {
                var deferred = $q.defer();
                var more_data = {},
                    posts_res = {};
                Posts.query(data, function(res, status, headers, config){
                    var posts_res = res,
                        more_data = status();
                    /**
                     * Check localStorage first
                     */
                    if( localStorageService.get('posts') ) {
                        deferred.resolve({
                            posts: localStorageService.get('posts'),
                            total_posts: more_data['x-wp-total']
                        });
                    } else {
                        /**
                         * If no per_page set, default to 30
                         */
                        if( data && !data.per_page ) {
                            data.per_page = 30;
                        }
                        if( !data ) {
                            data = {
                                per_page: 30
                            };
                        }
                        localStorageService.set( 'posts', posts_res );
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
                var deferred = $q.defer();

                Posts.query(data, function(res){
                    var current_posts = localStorageService.get('posts');
                    angular.forEach( res, function( value, key ) {
                        current_posts.push( value );
                    });
                    localStorageService.set( 'posts', current_posts );
                    deferred.resolve( res );
                });
                return deferred.promise;
            },

            getSingle: function( data ) {
                if( !data || !data.slug ) {
                    return false;
                }
                var deferred = $q.defer();
                var current_posts = localStorageService.get( 'posts' );
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
    /**
     * List Posts View
     */
    .controller('listView', ['$scope', '$http', 'LocalPosts', 'localStorageService', function( $scope, $http, LocalPosts, localStorageService ){

        $scope.posts = [];
        $scope.next_page = 2;
        $scope.posts = LocalPosts.query({per_page: [ngWP.config.posts_per_page * 3]}).then(function(res){
            $scope.total_posts = res.total_posts;
            $scope.posts = res.posts;
            $scope.pagination = {
                current: 1
            };
        });

        /**
         * Page Change
         * Find total pages, if on last page, query next page
         * Next page query is next 3 pages
         * @param newPage
         */
        $scope.pageChanged = function( newPage ) {
            /**
             * How many pages based on current amount of posts
             * @type {number}
             */
            $scope.total_current_pages = $scope.posts.length / ngWP.config.posts_per_page;
            /**
             * How many total available pages
             * @type {number}
             */
            $scope.total_available_pages = $scope.total_posts / ngWP.config.posts_per_page;

            if (newPage == $scope.total_current_pages && $scope.total_current_pages < $scope.total_available_pages ) {
                LocalPosts.getPage({page: $scope.next_page, per_page: ngWP.config.posts_per_page * 3}).then(function (new_posts) {
                    angular.forEach(new_posts, function (value, key) {
                        $scope.posts.push(value);
                    });
                });
                $scope.next_page++;
            };
        };
    }])
    /**
     * Single Post View
     */
    .controller('singleView', ['$scope', '$http', 'Posts', 'LocalPosts', '$stateParams', 'localStorageService',
        function( $scope, $http, Posts, LocalPosts, $stateParams, localStorageService ){

        LocalPosts.getSingle({slug:$stateParams.slug}).then(function(res){
            $scope.post = res;
            $http.get(ngWP.config.api + 'wp/v2/users/' + $scope.post.author ).then(function(res){
                $scope.author = res.data;
            });
        });

    }])
    .controller('authorView', ['$scope', '$http', '$stateParams', 'Posts', 'LocalPosts', 'localStorageService',
        function( $scope, $http, $stateParams, Posts, LocalPosts, localStorageService ){

        $scope.posts = [];
        $scope.next_page = 2;
        $scope.posts = LocalPosts.query({per_page: [ngWP.config.posts_per_page * 3], author: $stateParams.author}).then(function(res){
            $scope.total_posts = res.total_posts;
            $scope.posts = res.posts;
            $scope.pagination = {
                current: 1
            };
        });

        /**
         * Page Change
         * Find total pages, if on last page, query next page
         * Next page query is next 3 pages
         * @param newPage
         */
        $scope.pageChanged = function( newPage ) {
            /**
             * How many pages based on current amount of posts
             * @type {number}
             */
            $scope.total_current_pages = $scope.posts.length / ngWP.config.posts_per_page;
            /**
             * How many total available pages
             * @type {number}
             */
            $scope.total_available_pages = $scope.total_posts / ngWP.config.posts_per_page;

            if (newPage == $scope.total_current_pages && $scope.total_current_pages < $scope.total_available_pages ) {
                LocalPosts.getPage({page: $scope.next_page, per_page: ngWP.config.posts_per_page * 3}).then(function (new_posts) {
                    angular.forEach(new_posts, function (value, key) {
                        $scope.posts.push(value);
                    });
                });
                $scope.next_page++;
            };
        };
    }])
    .controller('header', ['$scope', '$http', function ($scope, $http ) {

        $http({
            url: ngWP.config.api
        } ).success( function( res ){
            $scope.site = {};
            $scope.site.name = res.name;
            $scope.site.desc = res.description;
        });

    }])
;
