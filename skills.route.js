(function(){
	'use strict';

	angular.module('app.skills')
		.config(routerConfig);

	/** @ngInject */
	function routerConfig($stateProvider){
		$stateProvider.state('skills',{
			url: '/skills',
			security: true,
			templateUrl: 'app/components/skills/skills.tmpl.html',
			controller: 'MainSkillsCtrl',
			controllerAs: 'mySkills',
			data: {
				title: 'work_select_skills_title'
			}
		})
	}

})();

