// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

angular.module('followKeyword', ['starter'])


    .controller("followKeyword", function ($scope, $rootScope, $twitterApi, $timeout, $window, ngToast) {

        // Default probablity percentage
        $scope.probCalculator = 60;
        // Init array for search keywords
        $scope.searchwords = [];
        // Users followed - For the view
        $scope.follows = [];
        // Users followed IDs
        $scope.followsIDs = [];
        // Declare lastuser variable - Global
        var lastuser;
        // Declare searchOptions variable - Global
        var searchOptions;


        // =====================================================
        // Start Following Users
        // =====================================================
        $scope.startFollowing = function () {
            $scope.run = true;
            $scope.timerIds = [];
            $scope.searchTweets();
            $rootScope.loading = true;
            $scope.followButton = true;
            $scope.stopFollowButton = false;
            $rootScope.disableAllButActiveTab("tab4");

        };

        // =====================================================
        // Stop Following Users
        // =====================================================

        $scope.stopFollowing = function () {
            // Clear all timeouts
            $scope.timerIds.forEach(function (id) {
                clearTimeout(id);
            });
            $scope.run = false;
            $rootScope.loading = false;
            $scope.followButton = false;
            $scope.stopFollowButton = true;
            $scope.$emit('toast', "Stopped Following Users");
            $rootScope.enableAllTabs();

        };

        // =====================================================
        // Check if no tweets returned
        // =====================================================

        $scope.noResults = function (data) {
            if (data.statuses.length === 0) {
                $scope.stopFollowing();
                $scope.$emit('toast', "Stopped Following Users");
            }
        };


        // =====================================================
        // Build Search String and Options - Exclude Retweets
        // =====================================================

        $scope.buildSearchString = function () {

            // Build Options depending if loop
            if (lastuser === undefined || lastuser === "") {
                searchOptions = {
                    q: encodeURIComponent("'" + $scope.searchwords.join("' OR '") + "'") + "%20AND%20-filter%3Aretweets'",
                    result_type: "recent",
                    count: 3
                };
            } else {
                searchOptions = {
                    q: encodeURIComponent("'" + $scope.searchwords.join("' OR '") + "'") + "%20AND%20-filter%3Aretweets'",
                    result_type: "recent",
                    count: 3,
                    max_id: lastuser
                };
            }
            return searchOptions;

        };



        // =====================================================
        // Search for keyword tweets
        // =====================================================
        // Rate Limit = 180 req per 15min
        // =====================================================

        $scope.searchTweets = function () {
            return new Promise(function (resolve, reject) {


                // Send request to Twitter
                $twitterApi.getRequest("https://api.twitter.com/1.1/search/tweets.json", $scope.buildSearchString()).then(function (data) {
                        // Check for results
                        $scope.noResults(data);
                        //Loop through each status
                        data.statuses.forEach(function (result, i) {
                                if ($scope.run === true) {

                                    $scope.timerIds.push(setTimeout(function () {
                                        console.log($scope.followsIDs);
                                        console.log("CHECKING FOR: " + JSON.stringify(result.user.screen_name));
                                        console.log("INCLUDES: " + $scope.followsIDs.indexOf(result.user.screen_name));
                                        console.log("BOOLEAN: " + $scope.followsIDs.indexOf(result.user.screen_name) <= -1);

                                        // Have we already tried following? Check API and recently followed array
                                        if ($scope.followsIDs.indexOf(result.user.screen_name) <= -1 && result.user.following === false) {


                                            // Calculate Probability of followback
                                            var probCalculation = Math.round(result.user.friends_count / result.user.followers_count * 100);
                                            if (probCalculation >= $scope.probCalculator) {
                                                console.log("ADDED TO ARRAY: " + result.user.screen_name);
                                                $scope.followsIDs.push(result.user.screen_name);
                                                $scope.followKeyStep1 = true;
                                                $scope.followKeyStep2 = true;
                                                $scope.$apply();
                                                $scope.followUser(result);
                                            } else {
                                                // User did not meet requirements
                                                $scope.$emit('toast', "@" + result.user.screen_name + " did not meet requirements");
                                                $scope.$apply();
                                            }


                                        } else {
                                            // Already following this user
                                            $scope.$emit('toast', "Already followed @" + result.user.screen_name);
                                            $scope.$apply();
                                        }
                                        // Check for last entry
                                        if (i === data.statuses.length - 1) {
                                            lastuser = data.statuses[data.statuses.length - 1].id_str;
                                            console.log("NEXT PERSON");
                                            $scope.searchTweets();
                                            resolve();
                                        }

                                    }, 5000 * (i + 1)));
                                }

                            },
                            function (error) {
                                reject();
                                $scope.$emit('toast', 'err: ' + error);
                                console.log('err: ' + error);
                            });

                    },
                    function (error) {
                        reject();
                        $scope.$emit('toast', 'err: ' + error);
                        console.log('err: ' + error);
                    });
            });

        };


        // =====================================================
        // Follow users 
        // =====================================================
        // Rate Limit = ??? Unkown
        // =====================================================

        $scope.followUser = function (result) {

            $twitterApi.postRequest("https://api.twitter.com/1.1/friendships/create.json", {
                screen_name: result.user.screen_name
            }).then(function (data) {
                $scope.follows.push(result);
                $scope.$emit('toast', "Followed: @" + result.user.screen_name);
            }, function (error) {
                console.log('err: ' + error);
            });

        };

    }); // End Controller