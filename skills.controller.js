(function(){
	'use strict';

	angular
		.module('app.skills')
		.controller('MainSkillsCtrl', MainSkillsCtrl);

	function MainSkillsCtrl($scope, $rootScope, workerSkills, $localstorage, ProfileService, $state, toastr, $filter, IntercomService){

		var vm = this;

		// init skills data variable
		vm.SkillsData = {
			id: $localstorage.getObject('currentUserToken').uid,
			skills: [],
			skillId: [],
			selectedSkills: [],
			skillsArray: {},
			userSkills: []
		}

		/* init functions */
		vm.selectSkill = selectSkill;
		vm.isSkillChecked = isSkillChecked;
		vm.activeButton = activeButton;

		getAllSkills();

		// get all skills
		function getAllSkills() {
			workerSkills.getWorkerSkillsByLanguage()
				.then(function(data){
				vm.SkillsData.skills = data;
				ProfileService.getUserProfileByUID(vm.SkillsData.id)
					.then(function(data){

					checkSkill(vm.SkillsData.skills, data.skills);

					for (var i = 0; i < data.skills.length; i++) {
						vm.SkillsData.userSkills.push(parseInt(data.skills[i]));
						vm.SkillsData.skillId.push(parseInt(data.skills[i]));
					};

				}, function (httpResponse) {
			        toastr.error($filter('translate')('no_connection_with_server'));
			    });

			}, function (httpResponse) {
		        toastr.error($filter('translate')('no_connection_with_server'));
		    });
		}

		/**
		 *	Give two arrays. First, array which contain all skills, second, user skills(if they are)
		 *  And set checked user skills in all array skills.
		 */
		function checkSkill(allSkills, userSkills){
			angular.forEach(allSkills, function(value, key){
				angular.forEach(value.subcategories, function(val, k){
					for (var i = 0; i < userSkills.length; i++) {
						if(val.id == userSkills[i]){
							val.checked = true;
							if(!val.hidden){
								if(!vm.SkillsData.skillsArray.hasOwnProperty(val.parent)){
									vm.SkillsData.skillsArray[val.parent] = [];
									vm.SkillsData.skillsArray[val.parent].push(val.id);
								}else{
									if(vm.SkillsData.skillsArray[val.parent].indexOf(val.id) == -1){
										vm.SkillsData.skillsArray[val.parent].push(val.id);
									}
								}
							}
						}
					};
				});
			});
		}

		// select skill after click on it
		function selectSkill(item){
			var id = parseInt(item.id);
			var parentID = parseInt(item.parent);

			if(vm.SkillsData.skillsArray[parentID] !== undefined){
				if(vm.SkillsData.skillsArray[parentID].indexOf(id) == -1){
						vm.SkillsData.skillsArray[parentID].push(id);
					}else{
						if(vm.SkillsData.userSkills.indexOf(id) == -1){
							vm.SkillsData.skillsArray[parentID].splice(vm.SkillsData.skillsArray[parentID].indexOf(id), 1);
							if(vm.SkillsData.skillsArray[parentID].length == 0){
								delete vm.SkillsData.skillsArray[parentID];
							}
						}
					}
			}else{
				if(Object.keys(vm.SkillsData.skillsArray).length < 2){
					vm.SkillsData.skillsArray[parentID] = [];
					vm.SkillsData.skillsArray[parentID].push(id);
				}else{
					toastr.error($filter('translate')('you_can_select_any_skills'));
				}
			}

			if(vm.SkillsData.userSkills.indexOf(id) != -1){
				toastr.error($filter('translate')('cannot_deselect_skill'));
			}

			activeButton();

			getUserSkills(vm.SkillsData.skillsArray);
			
			// get selected skills
			selectedSkills(id, parentID, item.skillName);

		};

		// get selected skills to send a server
		function getUserSkills(array){
			vm.SkillsData.skillId = [];

			for (var key in array) {
				if(vm.SkillsData.skillId.indexOf(array[key]) == -1){
					vm.SkillsData.skillId.push(array[key]);
				}
			};

		}

		//get title skill category by id, to showing in page
		function selectedSkills(id, parentId, title){
			if(vm.SkillsData.userSkills.indexOf(id) == -1 && vm.SkillsData.skillsArray[parentId] !== undefined){
				if(vm.SkillsData.selectedSkills.indexOf(title) == -1){
		    		vm.SkillsData.selectedSkills.push(title);
		    	}else{
		    		vm.SkillsData.selectedSkills.splice(vm.SkillsData.selectedSkills.indexOf(title), 1);
		    	}
		    }else if(vm.SkillsData.selectedSkills.indexOf(title) != -1){
		    	vm.SkillsData.selectedSkills.splice(vm.SkillsData.selectedSkills.indexOf(title), 1);
		    }
		}

		// check checked skills
		function isSkillChecked(key, parent) {
	      if(Object.keys(vm.SkillsData.skillsArray).length > 0 && vm.SkillsData.skillsArray[parent] !== undefined){
	      	if(vm.SkillsData.skillsArray[parent].indexOf(key) != -1) return true;
	      }
	    };

	    // check how many skills is active and enable/disabled button 'next'
	    function activeButton() {
	    	if(Object.keys( vm.SkillsData.skillsArray ).length > 0 || Object.keys( vm.SkillsData.userSkills ).length > 0) return true;
	    }

	    // Set user skills
	    vm.setSkills = function (e) {
	    	e.preventDefault();

			workerSkills.setWorkerSkills(vm.SkillsData.skillId.toString())
			    .then(function(data) {

			        if (data.status == '1') {

			            IntercomService.trackEvent('added_skills', {
			                'skills_count': vm.SkillsData.skillId.length,
			                'skills': vm.SkillsData.skillId.toString()
			            });
			            
			            toastr.success($filter('translate')('skills_updated'));

			            $rootScope.GlobalCurrentUserData.ProfileData.skills = vm.SkillsData.skillId.toString().split(',').sort();

			            $state.go('offers-list');

			        } else {

			            toastr.error($filter('translate')('internal_server_error'));

			        }

			    }, function(httpResponse) {

			        toastr.error($filter('translate')('no_connection_with_server'));

			    });
	    }
	}

})();