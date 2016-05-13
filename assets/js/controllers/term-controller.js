ngWP.app.controller('termView', ['$scope', '$http', 'LocalPosts', 'localStorageService', '$stateParams',
    function( $scope, $http, LocalPosts, localStorageService, $stateParams ) {

        $scope.posts = [];
        $scope.next_page = 2;
        var cats = localStorageService.get('cats');
        $scope.term = {};

        angular.forEach( cats, function( value, key ) {
            if( value.slug == $stateParams.term ) {
                $scope.term = value;
            }
        });
        LocalPosts.query({per_page: [ngWP.config.posts_per_page * 3], categories: $scope.term.id}).then(function(res){
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
            $scope.total_available_pages = Math.ceil( $scope.total_posts / ngWP.config.posts_per_page );

            if (newPage == $scope.total_current_pages && $scope.total_current_pages < $scope.total_available_pages ) {
                LocalPosts.getPage({page: $scope.next_page, per_page: ngWP.config.posts_per_page * 3, post_type: $scope.post_type, categories: $scope.term.id}).then(function (new_posts) {
                    angular.forEach(new_posts.posts, function (value, key) {
                        $scope.posts.push(value);
                    });
                });
                $scope.next_page++;
            };
        };
}]);