// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

angular.module('starter', ["directives", "filters", "followKeyword", 'ngTwitter', 'ngMaterial', 'ngToast', 'ngMessages'])


    // ==========================================
    // Configurations for Angular and Misc
    // ==========================================

    // Configure Theme
    .config(function ($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('blue')
            .accentPalette('blue')
            .warnPalette('red')
            .dark();
    })

    // Configure Toast
    .config(['ngToastProvider', function (ngToast) {
        ngToast.configure({
            animation: "slide",
            verticalPosition: 'bottom',
            horizontalPosition: 'right',
            maxNumber: 5

        });
    }])

    // Configure Icons - Still missing
    .config(function ($mdIconProvider) {
        $mdIconProvider
            .iconSet("call", 'img/icons/sets/communication-icons.svg', 24)
            .iconSet("social", 'img/icons/sets/social-icons.svg', 24);
    })



    // ==========================================
    // Global Controller - HTML/Body
    // ==========================================

    .controller("globalCtrl", function ($scope, $twitterApi, $timeout, $mdSidenav, $window, ngToast, $rootScope, $sanitize, $http) {


        // ==========================================
        // Defaults | GLOBAL
        // ==========================================

        $scope.probCalculator = 60;


        // ================================================
        // Get Twitter Ready - Not Included in Repo
        // ================================================
        // Temporary until oAuth & localStorage implemented
        // ================================================

        $http.get('config.json')
            .success(function (data) {
                $twitterApi.configure(data.APIKey, data.APISecret, data.oauthToken);
                $twitterApi.getRequest("https://api.twitter.com/1.1/account/verify_credentials.json", {
                    skip_status: true
                }).then(function (data) {
                    $scope.myProfile = data;
                });
            })
            .error(function () {
                alert("Could not locate config.json, Twitter Tools will now close.")
                var window = remote.getCurrentWindow();
                window.close();
            });


        // ==========================================
        // Toast Function for Notifications | GLOBAL
        // ==========================================

        $scope.$on('toast', function (event, args) {
            ngToast.create({
                dismissOnClick: true,
                content: args,
                animation: "slide",
                timeout: 2000
            });
        });

        // ================================================
        // Disable all tabs if function is running | GLOBAL
        // ================================================

        $rootScope.disableAllButActiveTab = function (active) {
            var allTabs = ['tab1', 'tab2', 'tab3', 'tab4', 'tab5', 'tab6'];
            allTabs.forEach(function (result) {
                if (result !== active) {
                    $rootScope[result] = true;
                }
            });
        };

        // ================================================
        // Enable all tabs | GLOBAL
        // ================================================

        $rootScope.enableAllTabs = function () {
            var allTabs = ['tab1', 'tab2', 'tab3', 'tab4', 'tab5', 'tab6'];
            allTabs.forEach(function (result) {
                $rootScope[result] = false;
            });
        };


        // ==========================================
        // Get Followers
        // ==========================================
        // Rate Limit = 15 req in 15 minutes
        // ==========================================

        var getFollowing = function () {
            return new Promise(function (resolve, reject) {
                $twitterApi.getRequest("https://api.twitter.com/1.1/friends/ids.json", {
                    count: 16
                }).then(function (data) {
                        var userIDs = [];
                        data.ids.forEach(function (entry) {
                            userIDs.push(entry);
                        });

                        // Check followback Function
                        $scope.userIDs = userIDs.toString();
                        resolve();
                    },
                    function (error) {
                        reject();
                        $scope.$emit('toast', 'err: ' + error);
                        console.log('err: ' + error);
                    });
            });
        };


        // ==================================================
        // Check Followback - Return those not following back
        // ==================================================
        // Rate Limit = 15 req in 15 minutes
        // ==================================================

        var checkFollowBack = function () {
            return new Promise(function (resolve, reject) {
                $twitterApi.getRequest("https://api.twitter.com/1.1/friendships/lookup.json", {
                    user_id: $scope.userIDs
                }).then(function (data) {
                    var notFollowingArray = [];
                    data.forEach(function (entry) {
                        if (entry.connections.indexOf("followed_by") === -1) {
                            notFollowingArray.push(entry.id);
                            //console.log(entry.screen_name + " is not following you");
                        }
                    });
                    $scope.notFollowingCollection = notFollowingArray;
                    console.log($scope.notFollowingCollection);
                    resolve();

                }, function (error) {
                    reject();
                    $scope.$emit('toast', 'err: ' + error);
                    console.log('err: ' + error);
                });
            });
        };

        // =====================================================
        // User Lookup - Return data for those not following back
        // =====================================================
        // Rate Limit = 900 req in 15 minutes
        // =====================================================

        var userLookup = function () {
            return new Promise(function (resolve, reject) {
                $twitterApi.getRequest("https://api.twitter.com/1.1/users/lookup.json", {
                    user_id: $scope.notFollowingCollection.toString()
                }).then(function (data) {
                    $scope.notFollowingdata = data;
                    resolve();
                });
            }, function (error) {
                reject();
                $scope.$emit('toast', 'err: ' + error)
                console.log('err: ' + error);
            });
        };


        // =====================================================
        // Unfollow User - Individual 
        // =====================================================
        // Rate Limit = ??? Unknown
        // =====================================================

        $scope.unfollow = function (id, index) {
            return new Promise(function (resolve, reject) {
                $scope.loading = true;

                $twitterApi.postRequest("https://api.twitter.com/1.1/friendships/destroy.json", {
                    screen_name: id
                }).then(function (data) {
                    $scope.$emit('toast', "Unfollowed " + id);
                    $scope.notFollowingdata.splice(index, 1);
                    $scope.loading = false;
                    resolve();
                }, function (error) {
                    reject();
                    console.log('err: ' + error);
                });

            });


        };

        // =====================================================
        // Unfollow Users - Mass Unfollow
        // =====================================================
        // Rate Limit = ??? Unknown
        // =====================================================

        $scope.massUnfollow = function () {
            return new Promise(function (resolve, reject) {

                $scope.notFollowingdata.forEach(function (data, index) {
                    setTimeout(function () {
                        console.log("Unfollowing: " + data.screen_name);
                        resolve();
                        /* $twitterApi.postRequest("https://api.twitter.com/1.1/friendships/destroy.json", {
                           user_id: data
                         }).then(function (data) {
                           $scope.notFollowingdata = data;
                           resolve();
                         }, function (error) {
                           reject();
                           console.log('err: ' + error);
                         }) */
                    }, 5000 * (index + 1));
                });
            });
        };





        // =====================================================
        // Follow users 
        // =====================================================
        // Rate Limit = ??? Unkown
        // =====================================================

        $scope.followUsers = function () {
            return new Promise(function (resolve, reject) {

                $scope.searchTweetData.statuses.forEach(function (data, index) {
                    setTimeout(function () {
                        if (data.user.following === false) {
                            $twitterApi.postRequest("https://api.twitter.com/1.1/friendships/create.json", {
                                screen_name: data.user.screen_name
                            }).then(function (result) {
                                console.log("Following: " + data.user.screen_name);
                                $scope.currentAction = "Following: " + data.user.screen_name;
                                resolve();
                            }, function (error) {
                                reject();
                                console.log('err: ' + error);
                            });
                        } else {
                            console.log("ALREADY FOLLOWING: " + data.user.screen_name);
                            $scope.currentAction = "Already Following: " + data.user.screen_name;
                        }

                    }, 5000 * (index + 1));
                    resolve();
                });

            });
        };


        // =====================================================
        // Cancel Mass Unfollow Page
        // =====================================================

        $scope.cancelUnfollow = function () {
            $scope.unfollowStep2 = true;
            $scope.unfollowStep1 = false;
            $scope.notFollowingdata = [];
        }


        // Sort Results

        $scope.items = [1, 2, 3, 4, 5, 6, 7];
        $scope.selectedItem;
        $scope.getSelectedText = function () {
            if ($scope.selectedItem !== undefined) {
                return "You have selected: Item " + $scope.selectedItem;
            } else {
                return "Please select an item";
            }
        };


        // Tab Click - Scroll Top
        $scope.scrollTop = function () {
            console.log("scroll");
            window.scrollTo(0, 0);
        }



        // Test Sort Array
        $scope.sortArr = function () {
            if ($scope.sortTitle == "Oldest -> Newest") {
                $scope.sortTitle = "Newest -> Oldest"
            } else {
                $scope.sortTitle = "Oldest -> Newest"
            }
            $scope.notFollowingdata.reverse();
        }


        // ==========================================
        // Inititialize
        // ==========================================    

        //hide Unfollow Step 2
        $scope.unfollowStep2 = true;

        $scope.scanUnfollowing = function () {
            $scope.$emit('toast', "Loading...");
            $scope.loading = true;
            $scope.unfollowStep1 = true;
            getFollowing().then(function () {
                checkFollowBack().then(function () {
                    userLookup().then(function () {
                        $scope.unfollowStep2 = false;
                        $scope.loading = false;
                        ngToast.dismiss();




                        //unfollowUsers()
                    });
                });
            });
        }



        // ==========================================
        // Listen for exit click
        // ==========================================    
        var remote = require('electron').remote;
        document.getElementById("close-btn").addEventListener("click", function (e) {
            var window = remote.getCurrentWindow();
            window.close();
        });


    }) // End Controller



    // ==========================================
    // Context Menu Controller
    // ==========================================  
    .controller('contextMenuCtrl', function DemoCtrl($mdDialog) {
        var originatorEv;

        this.openMenu = function ($mdOpenMenu, ev) {
            originatorEv = ev;
            $mdOpenMenu(ev);
        };

        this.notificationsEnabled = true;
        this.toggleNotifications = function () {
            this.notificationsEnabled = !this.notificationsEnabled;
        };

    });