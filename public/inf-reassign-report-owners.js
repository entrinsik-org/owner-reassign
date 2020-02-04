(function () {
    'use strict';

    function ReassignReportOwnersCtrl ($scope, $log, $mdDialog, monitor, api) {
        this.monitor = monitor;
        this.api = api;
        this.$mdDialog = $mdDialog;
        this.log = $log;

    }

    ReassignReportOwnersCtrl.prototype.$onInit = function () {
        var self = this;
        this.fileCtrl.doSave = this.save.bind(this);
        this.api.get('inf:reassign-report-owners-options')
            .then(function (domains) {
                self.domains = domains;
            })
            .catch(function(err) {
                self.log.error(['domains'], 'Unable to load domains list for domain dropdown', err);
            });
    };

    ReassignReportOwnersCtrl.prototype.save = function (progress) {
        var self = this;
        var $file = this.fileCtrl.$file;
        return this.monitor('Reassigning Owners')
            .handler(function (channel) {
                return self.api.link('inf:reassign-report-owners').post({
                    upload: $file.uniqueIdentifier,
                    progress: channel,
                    createUsers: self.createUsers,
                    domain: _.get(self, 'domain.id')
                });
            })
            .execute(function (message) {
                self.$progress.show(message);
            })
            .then(function (result) {
                self.$mdDialog.hide(result);
            })
            .catch(function (err) {
                self.log.error(['file'], 'Unable to parse file', err);
                self.$progress.error('Unable to parse file.', err);
            });
    };

    function infReassignReportOwners () {
        return {
            restrict: 'E',
            controller: ReassignReportOwnersCtrl,
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                fileCtrl: '=ngModel'
            },
            require: {
                $progress: '^infProgress'
            },
            templateUrl: '/assets/reassign/inf-reassign-report-owners-tpl.html'
        };
    }

    angular.module('informer')
        .directive('infReassignReportOwners', infReassignReportOwners);
})();

