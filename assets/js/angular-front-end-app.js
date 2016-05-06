var ngWP = ngWP || {};

// ngWP.wp_site = 'INSERT YOUR SITE HERE';
// ngWP.wp_api_url = 'INSERT YOUR API URL HERE';
ngWP.wp_site = 'http://local.wordpress.dev';
ngWP.wp_api_url = 'http://local.wordpress.dev/wp-json/';


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
        return $resource( ngWP.wp_api_url + 'wp/v2/posts/:ID?filter[posts_per_page]=30' , {
            ID:'@id'
        });
    })
    .factory( 'LocalPosts', function( $http, $resource, localStorageService, Posts, $q ) {
        localPostObj = {
            query: function( data ) {
                if( localStorageService.get('posts') ) {
                    return localStorageService.get('posts');
                } else {
                    return Posts.query(data, function(res){
                        localStorageService.set( 'posts', res );
                        return res;
                    });
                }
            },
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
        $scope.posts = LocalPosts.query();
        $scope.pagination = {
            current: 1
        };

        $scope.pageChanged = function( newPage ) {
            $scope.total_pages = $scope.posts.length / 10;
            if (newPage == $scope.total_pages) {
                LocalPosts.getPage({page: 2}).then(function (new_posts) {
                    console.log(new_posts);
                    angular.forEach(new_posts, function (value, key) {
                        console.log(value);
                        $scope.posts.push(value);
                    });
                });
            };
        };
    }])
    .controller('singleView', ['$scope', '$http', 'Posts', '$stateParams', 'localStorageService', function( $scope, $http, Posts, $stateParams, localStorageService ){

        Posts.query({slug:$stateParams.slug}, function(res){
            $scope.post = res[0];
            $http.get(ngWP.wp_api_url + 'wp/v2/users/' + $scope.post.author ).then(function(res){
                $scope.author = res.data;
            });
        });
    }]);
