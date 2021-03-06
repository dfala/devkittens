angular.module('devKittens')

.config(function ($routeProvider) {

	$routeProvider
	.when('/', {
		templateUrl: '/public/templates/home.html',
		controller: 'HomeController'
	})

	.when('/course/:courseId?', {
		templateUrl: '/public/templates/course.html',
		controller: 'CourseController',
		resolve: {
			currentCourseData: function($route, $q, $location, infoStorage, courseServices, cohortServices) {
				var deferred = $q.defer();

				courseServices.getCourse($route.current.params.courseId)
				.then(function (response) {
					infoStorage.saveCalendarId(response._id);
					infoStorage.setCurrentCourse(response);
					var data = infoStorage.getCurrentCourse();
					deferred.resolve(data);
				})
				.catch(function (err) {
					console.error(err);
					$location.path('/dashboard');
					deferred.reject(err);
				});
				return deferred.promise;
			},
			dayOfWeek: function(infoStorage) {
				return infoStorage.getDayOfWeek();
			},
			user: getAuth
		}
	})

	.when('/cohort/:cohortId?', {
		templateUrl: '/public/templates/cohort.html',
		controller: 'CohortController',
		resolve: {
			currentCohortData: function($route, $q, $location, infoStorage, cohortServices) {
			var deferred = $q.defer();

			cohortServices.getCohort($route.current.params.cohortId)
			.then(function(response) {
				infoStorage.saveCalendarId(response._id);
				infoStorage.setCurrentCohort(response);
				var data = infoStorage.getCurrentCohort();
				deferred.resolve(data); 
			})
			.catch(function(err) {
				console.error(err);
				$location.path('/dashboard');
				deferred.reject(err);
			});
			return deferred.promise;
			},
			dayOfWeek: function(infoStorage) {
				return infoStorage.getDayOfWeek();
			},
			openToCurrentDay: function(infoStorage) {
				var cohortData = infoStorage.getCurrentCohort();
				var currentSegment = 0;
				if(cohortData) {
					var curriculum = cohortData.curriculum;
					var today = new Date();
					today = today.setHours(0, 0, 0, 0);

					// Loops through the curriculum to find the current Day and sets the currentSegment accordingly
					for(var i = 0; i < curriculum.length; i++) {
						for(var j = 0; j < curriculum[i].length; j++) {
							if(today === Date.parse(curriculum[i][j].day)) {
								currentSegment = i;
							}
						}
					}
				}

				return currentSegment;
				
			},
			user: getAuth
		}
	})

	// the type parameter should specify cohort or course; the type id is the _id of that course/cohort
	.when('/day/:type/:typeId/:dayId', {
		templateUrl: '/public/templates/day.html',
		controller: 'DayController',
		resolve: {
			dayId: function($route) {
				return $route.current.params.dayId;
			},
			activeLesson: function (lessonService, cohortServices, $route) {
				if ($route.current.params.type == "course") {
					return lessonService.getLesson($route.current.params.typeId, $route.current.params.dayId);
				}
				if ($route.current.params.type == "cohort") {
					return cohortServices.getCohortLesson($route.current.params.typeId, $route.current.params.dayId);
				}
			},
			typeId: function ($route) {
				return $route.current.params.typeId;
			},
			typeRef: function($route) {
				return $route.current.params.type;
			},
			dayIndex: function (infoStorage, $location, $route) {
				if ($route.current.params.type == 'cohort') {
					var index = infoStorage.serveDayIndex();
					if (index < 0) return $location.path('/dashboard');
					return index;
				} else {
					return null;
				}
			},
			user: getAuth
		}
	})


	.when('/dashboard', {
		templateUrl: '/public/templates/dashboard.html',
		controller: 'DashboardController',
		resolve: {
			cohortData: function (cohortServices) {
				return cohortServices.getAllCohorts();
			},
			courseData: function (courseServices) {
				return courseServices.getAllCourses();
			},
			usersData: function (dashboardService, $q) {
				var dfd = $q.defer();
				dashboardService.getUsers().then(function(response) {
					dfd.resolve(response.data);
				}, function(err) {
					console.log('Houston... ', err);
				})
				return dfd.promise;
			},
			instructorData: function(infoStorage) {
				
			},
			user: getBlockedAuth
		}
	})

	.when('/registration/:userType', {
		templateUrl: '/public/templates/registration.html',
		controller: 'registrationController',
		resolve: {
			userType: function ($route) {
				return $route.current.params.userType;
			},
			cohortId: function ($route) {
				return null;
			}
		}
	})

	.when('/registration/mentor/:cohortId', {
		templateUrl: '/public/templates/registration.html',
		controller: 'registrationController',
		resolve: {
			userType: function ($route) {
				return "mentor";
			},
			cohortId: function ($route) {
				return $route.current.params.cohortId;
			}
		}
	})

	.when('/registration/instructor/:cohortId', {
		templateUrl: '/public/templates/registration.html',
		controller: 'registrationController',
		resolve: {
			userType: function ($route) {
				return "instructor";
			},
			cohortId: function ($route) {
				return $route.current.params.cohortId;
			}
		}
	})

	.when('/user-settings', {
		templateUrl: '/public/templates/userSettings.html',
		controller: 'UserSettingsController',
		resolve: {
			user: getAuth
		}
	})

	.otherwise('/');
})


// Heavy lifting
function getAuth ($http, $location, $q, userService, infoStorage) {
	var dfd = $q.defer();

	$http.get('/api/auth')
	.success(function (response) {

		userService.getTypeData(response.userType, response._id)
		.then(function (result) {
			response.typeData = result[0];
			// store user client side
			infoStorage.saveUser(response);
			dfd.resolve(response);
		})
		.catch(function (err) {
			console.error(err);
			dfd.reject(err);
		})

	})
	.error(function (err) {
		$location.path('/');
	});

	return dfd.promise;
}


function getBlockedAuth ($http, $location, $q, userService, infoStorage) {
	var dfd = $q.defer();

	$http.get('/api/auth')
	.success(function (response) {

		userService.getTypeData(response.userType, response._id)
		.then(function (result) {
			response.typeData = result[0];
			// store user client side
			infoStorage.saveUser(response);

			// Prevent student to login on protected page
			if (response.userType.student)
				return $location.path('/cohort/' + response.typeData.cohortId);

			dfd.resolve(response);
		})
		.catch(function (err) {
			console.error(err);
			dfd.reject(err);
		})

	})
	.error(function (err) {
		$location.path('/');
	});

	return dfd.promise;
};
