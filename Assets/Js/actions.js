// to do
/*
- getUVData function has repeating code that can be DRYer

*/
// UI elements
const body = document.querySelector('.body');
const singleUvIndex = document.querySelector('.uv-index-now_number');
const clothesSlider = document.getElementById('clothes-slider');
const cloudCoverageSlider = document.getElementById('cloud-coverage-slider');
const cloudCoverageGraphic = document.querySelector('.factor-cloud-coverage');
const ageSlider = document.getElementById('age-slider');
const spfSlider = document.getElementById('spf-slider');
const bmiSlider = document.getElementById('bmi-slider');
const ageNumber = document.querySelector('.factor-age_number');
const spfNumber = document.querySelector('.factor-spf_number');
const bmiNumber = document.querySelector('.factor-bmi_number');
const clothes1 = document.querySelector('.clothes-1');
const clothes2 = document.querySelector('.clothes-2');
const clothes3 = document.querySelector('.clothes-3');
const clothes4 = document.querySelector('.clothes-4');
const clothes5 = document.querySelector('.clothes-5');
const profileButton = document.querySelector('.profile-button');
const uvApp = document.querySelector('.uv-app');

const signupPage = document.getElementById('signup-page');
const signupForm = document.getElementById('signup-form');
const signupFormEmail = document.getElementById('signup-form__email');
const signupFormPassword = document.getElementById('signup-form__password');

// OpenUV API
const urlGetCurrentUv = 'https://api.openuv.io/api/v1/uv?lat=52.07&lng=4.28';
const urlGetForecastUv = 'https://api.openuv.io/api/v1/forecast?lat=52.07&lng=4.28';
const token = 'a4919b716dbadd90a2b85094147fadb7';

// Custom Endpoints
const userDataUrl = 'http://paweldebik.com/vitamindashboard/endpoints/create_user.php';

// Charts
let timeChart = '';

// vars for calculations
let forecast = [];
let uvIndexes = [];
let uvTimes = [];
let uvNumber = '';
let roundedUvNumber = '';
let now = new Date();
let forecastDate  = '';
let multiplierMin = { age : 1, spf : 1, clothes : 1, clouds : 1, bmi : 1 };
let multiplierMax = { age : 1, spf : 1, clothes : 1, clouds : 1, bmi : 1 };
let resizeTimeout;


/* * * * * * * * * * * * * * * * * * * */
/* SERVICEWORKER                       */
/* * * * * * * * * * * * * * * * * * * */
window.onload = () => {
	'use strict';

	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('../../sw.js');
	}
}



/* * * * * * * * * * * * * * * * * * * */
/* CHARTJS                             */
/* * * * * * * * * * * * * * * * * * * */
function renderUvChart(data, labels) {
	const ctx = document.getElementById("uv-chart").getContext('2d');
	
	Chart.defaults.global.defaultFontColor = "#fff";
	Chart.defaults.global.responsive = true;
	Chart.defaults.global.maintainAspectRatio = false;

	
	// ctx.canvas.height = 300; // this changes the height of the chart
	var gradientStroke = ctx.createLinearGradient(500, 0, 100, 0);
	gradientStroke.addColorStop(0, "#b37bda");
	gradientStroke.addColorStop(0.5, "#d83d83");
	gradientStroke.addColorStop(1, "#b37bda");

	const uvChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: labels,
			datasets: [{
				label: 'UV Index',
				borderColor: gradientStroke,
				backgroundColor: "#d83d8315",
				borderWidth: 6,
				pointBorderWidth: 0,
				data: data,
				}]
		},
		options: {
			maintainAspectRatio: false,
			legend: {
				display: false
			}
		}
	});


	


	window.addEventListener('resize', function(event){
		if(!!resizeTimeout){ clearTimeout(resizeTimeout); }
		resizeTimeout = setTimeout(function(){
			let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
			let height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

			let uVcanvas = document.getElementById('uv-chart');
			// uVcanvas.style.height = "450px"; this jus stretches it, which looks bad
			
			console.log('test');
			// ctx.canvas.height = 210; // this changes the height of the chart
			// uvChart.update();

			// let bla = document.getElementById("uv-chart");
			// bla.style.height = 444;
			uvChart.update();
			uvChart.resize(444, 444);
			// How do I get the UV chart to update in height when window is of a certain size?
	/*
			ctx.canvas.height = 300; 
			uvChart.update();
			uvChart.resize();

	*/
		}, 10);
	});
}

function renderTimeChart(minimumExposure, maximumExposure) {
	const ctx = document.getElementById("time-chart").getContext('2d');
	timeChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: ['Light', 'Fair', 'Medium', 'Olive', 'Dark', 'Very dark'],
			datasets: [{
				label: 'Minimum exposure to reach 4000 IU',
				borderColor: '#fff',
				backgroundColor: "#d83d8315",
				borderWidth: 3,
					data: minimumExposure,
				},{
				label: 'Maximum exposure to reach 4000 IU',
				borderColor: '#fff',
				backgroundColor: "#d83d8315",
				borderWidth: 3,
					data: maximumExposure
				}]
		},
		options: {
			legend: {
				display: false
			},
			scales: {
				yAxes: [{
					ticks: {
						max: 180
					},
					scaleLabel: {
						display: true,
						labelString: 'Minutes',
					}
				}],
				xAxes: [{
					ticks: {
						   display: false
					}
				  }]
			}
		}
	});
}




  

function getUVData(url){
	console.log('Getting uv data from local or api resource');
	const localData = window.localStorage.getItem('uv_forecast');

	if ( localData ) {
		console.log('localData does exist, so getting data locally');
		forecast.push(JSON.parse(localData));
		forecastDate = new Date(forecast[0].result[forecast[0].result.length -1].uv_time);

		if ( now.getDate() > forecastDate.getDate() ){
			getUVDataFromExternal(url, function(){
				runLoop();
			});
		}

		runLoop(localData);
	} else {
		getUVDataFromExternal(url, function(uvData){
			runLoop(uvData);
		});
	}
}

function runLoop(uvData){
	console.log('running loop, and at this point something should have been written to localstorage');

	if(uvData){forecast.push(JSON.parse(uvData))};

	console.log(forecast);

	for ( i = 0; i < forecast[0].result.length; i++ ){
		let uvHour = new Date(forecast[0].result[i].uv_time);
		uvIndexes.push(forecast[0].result[i].uv);
		uvTimes.push(forecast[0].result[i].uv_time.substring(11, 16));

		if ( now.getHours() === uvHour.getHours() ){
			uvNumber = forecast[0].result[i].uv;
			roundedUvNumber = Math.round((uvNumber + Number.EPSILON) * 10) / 10;
		}
	}

	renderUvChart(uvIndexes, uvTimes);
	renderTimeChart(minimumExposure(roundedUvNumber), maximumExposure(roundedUvNumber));
	renderTimeNumber(roundedUvNumber);
}


function renderTimeNumber(uvNumber){
	singleUvIndex.innerHTML = Math.round((uvNumber + Number.EPSILON) * 10) / 10;
}

/* * * * * * * * * * * * * * * * * * * */
/* EVENTS                              */
/* * * * * * * * * * * * * * * * * * * */

clothesSlider.oninput = function() { // I could add onchange for IE10 support spfSlider.onchange = function() { }
	// change this into a loop in V2
	if ( clothesSlider.value == 1 ) {
		clothes1.classList.add('active')
	} else {
		clothes1.classList.remove('active')
	}

	if ( clothesSlider.value == 2 ) {
		clothes2.classList.add('active')
	} else {
		clothes2.classList.remove('active')
	}

	if ( clothesSlider.value == 3 ) {
		clothes3.classList.add('active')
	} else {
		clothes3.classList.remove('active')
	}

	if ( clothesSlider.value == 4 ) {
		clothes4.classList.add('active')
	} else {
		clothes4.classList.remove('active')
	}

	if ( clothesSlider.value == 5 ) {
		clothes5.classList.add('active')
	} else {
		clothes5.classList.remove('active')
	}

	recalculate('clothes', clothesSlider.value);
}

spfSlider.oninput = function() {
	spfNumber.textContent = spfSlider.value;
	recalculate('spf', spfSlider.value);
}

cloudCoverageSlider.oninput = function() {
	const cloudClass = "factor factor-cloud-coverage cloud-coverage-" + cloudCoverageSlider.value;
	cloudCoverageGraphic.className = cloudClass;
	recalculate('clouds', cloudCoverageSlider.value);
}

ageSlider.oninput = function() {
	ageNumber.textContent = ageSlider.value;
	recalculate('age', ageSlider.value);
}

bmiSlider.oninput = function() {
	bmiNumber.textContent = bmiSlider.value;
	recalculate('bmi', bmiSlider.value);
}

function recalculate(type, value){
	let outputMultiplierMin = '';
	let outputMultiplierMax = '';

	if ( type === 'clothes' ) {
		if ( value <= 5 && value > 4 ) { multiplierMin.clothes = 8; multiplierMax.clothes = 8; }
		if ( value <= 4 && value > 3 ) { multiplierMin.clothes = 5; multiplierMax.clothes = 5; }
		if ( value <= 3 && value > 2 ) { multiplierMin.clothes = 3; multiplierMax.clothes = 3; }
		if ( value <= 2 && value > 1 ) { multiplierMin.clothes = 1.5; multiplierMax.clothes = 1.5; }
		if ( value <= 1 ) { multiplierMin.clothes = 1; multiplierMax.clothes = 1; }
	}

	if ( type === 'bmi' ) {
		if ( value <= 99 && value > 30 ) { multiplierMin.bmi = 2; multiplierMax.bmi = 1; }
		if ( value <= 30 && value > 15 ) { multiplierMin.bmi = 1.5; multiplierMax.bmi = 1; }
		if ( value <= 15 ) { multiplierMin.bmi = 0.7; multiplierMax.bmi = 1; }
	}

	if ( type === 'clouds' ) {
		if ( value <= 5 && value > 4 ) { multiplierMin.clouds = 5; multiplierMax.clouds = 5; }
		if ( value <= 4 && value > 3 ) { multiplierMin.clouds = 4; multiplierMax.clouds = 4; }
		if ( value <= 3 && value > 2 ) { multiplierMin.clouds = 3; multiplierMax.clouds = 3; }
		if ( value <= 2 && value > 1 ) { multiplierMin.clouds = 2; multiplierMax.clouds = 2; }
		if ( value <= 1 ) { multiplierMin.clouds = 1; multiplierMax.clouds = 1; }
	}

	if ( type === 'spf' ) {
		if ( value <= 60 && value > 50 ) { multiplierMin.spf = 6; multiplierMax.spf = 6; }
		if ( value <= 50 && value > 40 ) { multiplierMin.spf = 5; multiplierMax.spf = 5; }
		if ( value <= 40 && value > 30 ) { multiplierMin.spf = 4; multiplierMax.spf = 4; }
		if ( value <= 30 && value > 20 ) { multiplierMin.spf = 3; multiplierMax.spf = 3; }
		if ( value <= 20 && value > 10 ) { multiplierMin.spf = 2; multiplierMax.spf = 2; }
		if ( value <= 10 && value > 0 ) { multiplierMin.spf = 1; multiplierMax.spf = 1; }
	}

	if ( type === 'age' ) {
		if ( value <= 99 && value > 80 ) { multiplierMin.age = 2; multiplierMax.age = 1; }
		if ( value <= 80 && value > 70 ) { multiplierMin.age = 1.7; multiplierMax.age = 1; }
		if ( value <= 70 && value > 60 ) { multiplierMin.age = 1.6; multiplierMax.age = 1; }
		if ( value <= 60 && value > 50 ) { multiplierMin.age = 1.5; multiplierMax.age = 1; }
		if ( value <= 50 && value > 50 ) { multiplierMin.age = 1.4; multiplierMax.age = 1; }
		if ( value <= 40 && value > 30 ) { multiplierMin.age = 1.2; multiplierMax.age = 1; }
		if ( value <= 30 && value > 20 ) { multiplierMin.age = 1; multiplierMax.age = 1; }
		if ( value <= 10 && value > 5 ) { multiplierMin.age = 0.8; multiplierMax.age = 1; }
		if ( value <= 5 ) { multiplierMin.age = 0.5; multiplierMax.age = 1; }
	}

	// count up all the multyplying factors
	outputMultiplierMin = Number( multiplierMin.age + multiplierMin.spf + multiplierMin.clothes + multiplierMin.clouds + multiplierMin.bmi ) / 5;
	outputMultiplierMax = Number( multiplierMax.age + multiplierMax.spf + multiplierMax.clothes + multiplierMax.clouds + multiplierMax.bmi ) / 5;
	
	updateChart(outputMultiplierMin, outputMultiplierMax);
}

let originalChartArray = [['undefined'],['undefined']];
let newChartArray = [['undefined'],['undefined']];

function updateChart(outputMultiplierMin, outputMultiplierMax) {
	let outputMultiplier = '';

	timeChart.data.datasets.forEach((dataset, i) => {
		
		// reset
		if ( dataset.data == newChartArray[i] ){
			dataset.data = originalChartArray[i] 
		}

		// assign multiplierMin for first loop and multiplierMax for second loop
		if ( i == 1 ) {
			// console.log('min: ', outputMultiplierMin);
			outputMultiplier = outputMultiplierMin;
		} else if ( i == 0 ) {
			// console.log('max: ', outputMultiplierMax);
			outputMultiplier = outputMultiplierMax;
		}

		dataset.data.forEach(function(value, index){

			if ( originalChartArray[i][index] === undefined || originalChartArray[i][index] === 'undefined' ) {
				if ( newChartArray[i].length < dataset.data.length ) {
					if ( newChartArray[i][index] == 'undefined') {
						newChartArray[i].pop();
						originalChartArray[i].pop();
					}

					newChartArray[i].push(dataset.data[index] * outputMultiplier);
					originalChartArray[i].push(dataset.data[index]);
				}
			} else {
				originalChartArray[i][index] = dataset.data[index];
				newChartArray[i][index] = dataset.data[index] * outputMultiplier;
			}

// console.log(i, 
// 			'data',dataset.data[index], 
// 			'multiplier',multiplier, 
// 			'orig',originalChartArray[i][index], 
// 			'new',newChartArray[i][index]);

		});
		dataset.data = newChartArray[i];
	});
	timeChart.update();
}

profileButton.addEventListener('click', function(e){
	if ( body.classList.contains('account') ) {
		body.classList.add('homepage');
		body.classList.remove('account');
	} else {
		body.classList.remove('homepage');
		body.classList.add('account');
	}
	setTimeout(function(){
		uvApp.classList.toggle('hidden');
		signupPage.classList.toggle('hidden');
	}, 300);
});


/* * * * * * * * * * * * * * * * * * * */
/* API CALL                            */
/* * * * * * * * * * * * * * * * * * * */
function getUVDataFromExternal(url, callback){
	// console.log('getting data from url: ' , url);

	var getUv = new XMLHttpRequest();

	getUv.open('GET', url);
	
	getUv.setRequestHeader('x-access-token', token);

	getUv.onload = function(){
		const uvData = (getUv.responseText);
		// console.log('uvData from API : ', uvData);
		window.localStorage.setItem('uv_forecast', uvData);
		console.log('got some data from api just now');
		callback(uvData);
	}

	getUv.send();
}
getUVData(urlGetForecastUv);

console.log('xs');

function log(xhr, evType, info) {
    var evInfo = evType;
    if (info)
        evInfo += " - " + info ;
    evInfo += " - readyState: " + xhr.readyState + ", status: " + xhr.status;
    alert(evInfo);
}


/* * * * * * * * * * * * * * * * * * * */
/* GET USER DATA                       */
/* * * * * * * * * * * * * * * * * * * */
function getUserFromExternal(url, requestData, callback){
	var xhr = new XMLHttpRequest();
    // xhr.addEventListener("readystatechange", function() { log(xhr, "readystatechange") });
    // xhr.addEventListener("loadstart", function(ev) { log(xhr, "loadstart", ev.loaded + " of " + ev.total) });
    // xhr.addEventListener("progress", function(ev) { log(xhr, "progress", ev.loaded + " of " + ev.total) });
    // xhr.addEventListener("abort", function() { log(xhr, "abort") });
    // xhr.addEventListener("error", function() { log(xhr, "error") });
    // xhr.addEventListener("load", function() { log(xhr, "load") });
    // xhr.addEventListener("timeout", function(ev) { log(xhr, "timeout", ev.loaded + " of " + ev.total) });
    // xhr.addEventListener("loadend", function(ev) { log(xhr, "loadend", ev.loaded + " of " + ev.total) });
	
	xhr.onload = function(){
		const userData = (xhr.responseText)
		callback(userData);
	}
	
	xhr.open('POST', url);

	// xhr.setRequestHeader('Content-Type', 'application/json');
	// xhr.send(form);
	
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhr.send(requestData);
}

signupForm.addEventListener('submit', function(e){
	e.preventDefault();
	requestData = `email=${signupFormEmail.value}& password=${signupFormPassword.value}& age=${ageSlider.value}& bmi=${bmiSlider.value}& skintype=3& daily_vitamin_d_IU_goal=4000`;

	getUserFromExternal(userDataUrl, requestData, function(userData){
		alert(userData);
	});
});




/* * * * * * * * * * * * * * * * * * * */
/* UV REQUIREMENT CALCULATION          */
/* * * * * * * * * * * * * * * * * * * */

function minimumExposure(uvi, bmi, skinType, age, spf, skin){
	let output = [];
	let skinTypeMultiplier = 0;
	let uviStart = 0;
	let i = 1;

	if ( uvi <= 15 ) { uviStart = 0.5; }
	if ( uvi <= 14 ) { uviStart = 0.6; }
	if ( uvi <= 13 ) { uviStart = 0.7; }
	if ( uvi <= 12 ) { uviStart = 0.8; }
	if ( uvi <= 11 ) { uviStart = 0.9; }
	if ( uvi <= 10 ) { uviStart = 1; }
	if ( uvi <= 9 ) { uviStart = 1.2; }
	if ( uvi <= 8 ) { uviStart = 1.7; }
	if ( uvi <= 7 ) { uviStart = 1.8; }
	if ( uvi <= 6 ) { uviStart = 2; }
	if ( uvi <= 5 ) { uviStart = 3; }
	if ( uvi <= 4 ) { uviStart = 4; }
	if ( uvi <= 3 ) { uviStart = 5; }
	if ( uvi <= 2 ) { uviStart = 8; }
	if ( uvi <= 1 ) { uviStart = 20; }

	while ( i <= 6 ) {
		let skinType = i;

		if ( skinType === 1 ) { skinTypeMultiplier = 0.5; }
		if ( skinType === 2 ) { skinTypeMultiplier = 1; }
		if ( skinType === 3 ) { skinTypeMultiplier = 2; }
		if ( skinType === 4 ) { skinTypeMultiplier = 3; }
		if ( skinType === 5 ) { skinTypeMultiplier = 4; }
		if ( skinType === 6 ) { skinTypeMultiplier = 7; }

		output.push(uviStart * skinTypeMultiplier);
		// console.log('uviStart: ', uviStart, 'skinTypeMultiplier: ', skinTypeMultiplier, 'calc: ', uviStart * skinTypeMultiplier);
		i++;
	}

	// console.log('uvi', uvi);
	// console.log('uviStart', uviStart);
	// console.log('skinTypeMultiplier in min exp', skinTypeMultiplier);
	// console.log('output', output);
	return output;
}

function maximumExposure(uvi, bmi, skinType, age, spf, skin){
	let output = [];
	let skinTypeMultiplier = 0;
	let uviStart = 0;
	let i = 1;

	// console.log('uvi', uvi);

	if ( uvi <= 1 ) { uviStart = 200; }
	if ( uvi <= 2 ) { uviStart = 80; }
	if ( uvi <= 3 ) { uviStart = 42; }
	if ( uvi <= 4 ) { uviStart = 30; }
	if ( uvi <= 5 ) { uviStart = 25; }
	if ( uvi <= 6 ) { uviStart = 20; }
	if ( uvi <= 7 ) { uviStart = 18; }
	if ( uvi <= 8 ) { uviStart = 17; }
	if ( uvi <= 9 ) { uviStart = 16; }
	if ( uvi <= 10 ) { uviStart = 15; }
	if ( uvi <= 11 ) { uviStart = 14; }
	if ( uvi <= 12 ) { uviStart = 13; }
	if ( uvi <= 13 ) { uviStart = 12; }
	if ( uvi <= 14 ) { uviStart = 11; }
	if ( uvi <= 15 ) { uviStart = 10; }

	while ( i <= 6 ) {
		let skinType = i;

		if ( skinType === 1 ) { skinTypeMultiplier = 0.5; }
		if ( skinType === 2 ) { skinTypeMultiplier = 1; }
		if ( skinType === 3 ) { skinTypeMultiplier = 2; }
		if ( skinType === 4 ) { skinTypeMultiplier = 3; }
		if ( skinType === 5 ) { skinTypeMultiplier = 4; }
		if ( skinType === 6 ) { skinTypeMultiplier = 7; }

		output.push(uviStart * skinTypeMultiplier);
		i++;
	}

	// console.log('skinTypeMultiplier in max exp', skinTypeMultiplier);
	return output;
}