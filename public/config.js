(function () {
    'use strict';

    function uploadConfig(componentProvider) {
        componentProvider.component('reassignReportOwners', '<inf-reassign-report-owners ng-model="$component.ngModel"></inf-reassign-report-owners>');
    }

    angular.module('informer')
        .config(uploadConfig);

})();

