var ngWP = ngWP || {};

ngWP.wp_site = 'http://local.wordpress.dev';
ngWP.wp_api_url = 'http://local.wordpress.dev/wp-json/';


ngWP.app = angular.module( 'angular-front-end', ['ngResource', 'ui.router'] )
    .run(function( $rootScope ){
        console.log('here');
    })
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
    .controller('listView', ['$scope', '$http', 'Posts', function( $scope, $http, Posts ){
        console.log('List View');

        Posts.query(function(res){
            $scope.posts = res;
        });
    }])
    .controller('singleView', ['$scope', '$http', 'Posts', '$stateParams', function( $scope, $http, Posts, $stateParams ){
        Posts.query({slug:$stateParams.slug}, function(res){
            $scope.post = res[0];
            $http.get(ngWP.wp_api_url + 'wp/v2/users/' + $scope.post.author ).then(function(res){
                $scope.author = res.data;
            });
        });
    }]);
