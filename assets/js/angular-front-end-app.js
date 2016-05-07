

ngWP.app = angular.module( 'angular-front-end', ['ngResource', 'ui.router', 'LocalStorageModule', 'angularUtils.directives.dirPagination'] )
    .run(function( $rootScope ){
        console.log('app init');
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
    }])
    .filter( 'to_trusted', function( $sce ){
        return function( text ){
            return $sce.trustAsHtml( text );
        }
    })
    .factory('Posts',function($resource){
        return $resource( ngWP.config.api + 'wp/v2/posts/:ID?filter[posts_per_page]=:per_page' , {
            ID:'@id',
            per_page: '@per_page'
        });
    })
    .factory( 'LocalPosts', function( $http, $resource, localStorageService, Posts, $q ) {
        localPostObj = {
            query: function( data ) {
                /**
                 * Check localStorage first
                 */
                if( localStorageService.get('posts') ) {
                    return localStorageService.get('posts');
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
                    return Posts.query(data, function(res){
                        localStorageService.set( 'posts', res );
                        return res;
                    });
                }
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
            }
        };

        return localPostObj;
    })
    .controller('listView', ['$scope', '$http', 'LocalPosts', 'localStorageService', function( $scope, $http, LocalPosts, localStorageService ){
        /**
         * Set Posts Per Page (Pagination)
         * @type {number}
         */
        $scope.posts_per_page = 5;

        $scope.next_page = 2;
        $scope.posts = LocalPosts.query({per_page: [$scope.posts_per_page * 3]});
        $scope.pagination = {
            current: 1
        };

        /**
         * Page Change
         * Find total pages, if on last page, query next page
         * Next page query is next 3 pages
         * @param newPage
         */
        $scope.pageChanged = function( newPage ) {
            $scope.total_pages = $scope.posts.length / $scope.posts_per_page;
            if (newPage == $scope.total_pages) {
                LocalPosts.getPage({page: $scope.next_page, per_page: $scope.posts_per_page * 3}).then(function (new_posts) {
                    angular.forEach(new_posts, function (value, key) {
                        $scope.posts.push(value);
                    });
                });
                $scope.next_page++;
            };
        };
    }])
    .controller('singleView', ['$scope', '$http', 'Posts', '$stateParams', 'localStorageService', function( $scope, $http, Posts, $stateParams, localStorageService ){

        Posts.query({slug:$stateParams.slug}, function(res){
            $scope.post = res[0];
            $http.get(ngWP.config.api + 'wp/v2/users/' + $scope.post.author ).then(function(res){
                $scope.author = res.data;
            });
        });
    }]);
