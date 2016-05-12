ngWP.app = angular.module( 'angular-front-end', ['ngResource', 'ui.router', 'LocalStorageModule', 'angularUtils.directives.dirPagination'] )
    .run(function( $rootScope, localStorageService, $http ){
        console.log('app init');
        $rootScope.posts_per_page = ngWP.config.posts_per_page;

        /** Localize Categories **/
        $http.get(ngWP.config.api + 'wp/v2/categories' ).then(function(res){
            var cats = [];
            angular.forEach( res.data, function( value, key ) {
                cats.push(value);
            });
            localStorageService.set( 'cats', cats );
        });

        /** State Change Logging **/
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options){
            //console.log( 'from ',fromState );
            //console.log( 'to ', toState );
        });
    })
    .config(
        ['localStorageServiceProvider', 'paginationTemplateProvider', '$stateProvider', '$urlRouterProvider',
        function( localStorageServiceProvider, paginationTemplateProvider, $stateProvider,$urlRouterProvider ) {
        localStorageServiceProvider.setPrefix('wp');
        paginationTemplateProvider.setPath('./templates/pagination.tpl.html');

        $urlRouterProvider.otherwise('/');
        $stateProvider
            .state('archive',{
                url:'/:post_type',
                controller:'listView',
                templateUrl: 'templates/list.html'
            })
            .state('author',{
                url:'/author/:author',
                controller:'authorView',
                templateUrl: 'templates/list.html'
            })
            .state('category',{
                url:'/category/:term',
                controller: 'termView',
                templateUrl: 'templates/list.html'
            })
            .state('single',{
                url:'/:cpt/:slug',
                controller:'singleView',
                templateUrl: 'templates/single.html'
            })
    }])
    .filter( 'to_trusted', function( $sce ){
        return function( text ){
            return $sce.trustAsHtml( text );
        }
    })
    /**
     * Single Post View
     */
    .controller('singleView', ['$scope', '$http', 'LocalPosts', '$stateParams', 'localStorageService',
        function( $scope, $http, LocalPosts, $stateParams, localStorageService ){

        LocalPosts.getSingle({slug:$stateParams.slug, post_type:$stateParams.cpt}).then(function(res){
            $scope.post = res;
            $http.get(ngWP.config.api + 'wp/v2/users/' + $scope.post.author ).then(function(res){
                $scope.author = res.data;
            });
            if( $scope.post.categories.length ) {
                var cats = localStorageService.get('cats');
                $scope.cats = [];
                angular.forEach( cats, function( value, key ) {
                    if( $scope.post.categories.indexOf( value.id ) > -1 ) {
                        $scope.cats.push( value );
                    }
                });
            }
        });

    }])
    .controller('authorView', ['$scope', '$http', '$stateParams', 'Posts', 'LocalPosts', 'localStorageService',
        function( $scope, $http, $stateParams, Posts, LocalPosts, localStorageService ){
            console.log( 'loading author ' + $stateParams.author );

        $scope.posts = [];
        $scope.next_page = 2;
        $http.get( ngWP.config.api + 'wp/v2/posts/?filter[posts_per_page]=' + ngWP.config.posts_per_page*3 + '&filter[post_author]=' + $stateParams.author ).then(function(res){
            $scope.total_posts = res.headers();
            $scope.total_posts = $scope.total_posts['x-wp-total']
            $scope.posts = res.data;
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
                $http.get(ngWP.config.api + 'wp/v2/posts/?page=' + $scope.next_page + '&filter[posts_per_page]=' + ngWP.config.posts_per_page*3 + '&filter[post_author]=' + $stateParams.author )
                    .then(function(new_posts){
                    angular.forEach(new_posts.data, function (value, key) {
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
