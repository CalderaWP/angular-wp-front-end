var ngWP = ngWP || {};

// ngWP.wp_site = 'INSERT YOUR SITE HERE';
// ngWP.wp_api_url = 'INSERT YOUR API URL HERE';
ngWP.wp_site = 'http://local.wordpress.dev';
ngWP.wp_api_url = 'http://local.wordpress.dev/wp-json/';


ngWP.app = angular.module( 'angular-front-end', ['ngResource', 'ui.router', 'LocalStorageModule'] )
    .run(function( $rootScope ){
        console.log('app init');
    })
    .config(['localStorageServiceProvider', function( localStorageServiceProvider ) {
        localStorageServiceProvider.setPrefix('wp');
    }])
    .filter( 'to_trusted', function( $sce ){
        return function( text ){
            return $sce.trustAsHtml( text );
        }
    })
    .factory('Posts',function($resource){
        return $resource( ngWP.wp_api_url + 'wp/v2/posts/:ID' , {
            ID:'@id'
        });
    })
    .factory( 'LocalPosts', function( $http, $resource, localStorageService, Posts ) {
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
            }
        };

        return localPostObj;
    })
    .config(function($stateProvider,$urlRouterProvider){
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
    })
    .controller('listView', ['$scope', '$http', 'LocalPosts', 'localStorageService', function( $scope, $http, LocalPosts, localStorageService ){
        $scope.posts = LocalPosts.query();
    }])
    .controller('singleView', ['$scope', '$http', 'Posts', '$stateParams', 'localStorageService', function( $scope, $http, Posts, $stateParams, localStorageService ){

        Posts.query({slug:$stateParams.slug}, function(res){
            $scope.post = res[0];
            $http.get(ngWP.wp_api_url + 'wp/v2/users/' + $scope.post.author ).then(function(res){
                $scope.author = res.data;
            });
        });
    }]);
