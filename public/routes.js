angular.module('devKittens')

.config(function ($routeProvider) {

	$routeProvider
	.when('/', {
		templateUrl: '/public/templates/home.html',
		controller: 'HomeController'
	})

	.when('/calendar', {
		templateUrl: '/public/templates/calendar.html',
		controller: 'CalendarController'
	})

	.when('/dashboard-mentors', {
		templateUrl: '/public/templates/dashboard-mentors.html',
		controller: 'MentorController',
		resolve: {
			mentorData: function(dashboardService) {
				return dashboardService.getMentorData();
				// console.log('mentorData ', mentorData);
				
			},
			optionsData: function (dashboardService) {
				return dashboardService.getOptions();
			},
			usersData: function(dashboardService, $q) {
				var dfd = $q.defer();
				dashboardService.getUsers().then(function(response) {
					dfd.resolve(response.data);
				}, function(err) {
					console.log('Houston... ', err);
				})
				return dfd.promise;
			}
		}
	})

	.when('/dashboard', {
		templateUrl: '/public/templates/dashboard.html',
		controller: 'DashboardController',
		resolve: {
			cohortData: function(dashboardService) {
				var cohortData = dashboardService.getCohortData();
				console.log('resolve ', cohortData);
				return cohortData;
			},
			courseData: function(courseServices) {
				return courseServices.getAllCourses();
			}
		}
	})

	.when('/curriculum/:courseId?', {
		templateUrl: '/public/templates/curriculum.html',
		controller: 'CurriculumController',
		resolve: {
			courseRef: function(courseServices, $route) {
				return courseServices.getCourse($route.current.params.courseId);
			}
		}
	})

	.otherwise('/');
})