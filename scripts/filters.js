 angular.module('filters', [])

     .filter('fixImage', [function () {
         return function (string) {
             if (!angular.isString(string)) {
                 return string;
             }
             return string.replace(/_normal/g, '');
         };
     }])