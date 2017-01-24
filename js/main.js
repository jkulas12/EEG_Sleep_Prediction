/**
 * Created by joshuakulas on 1/22/17.
 */

var pred_labels;
var valueline;
var EEGY;
var EEGX;
var color;
var area;
var EEG = {1:[], 2:[], 3:[], 4:[], 5:[], 6:[]};
var EEGList = []
$(window).on("load", function() {
    var h = $(window).height();
    var w = $(window).width();

    $('.chartDiv').height(200).width(.8 * w);
    d3.csv('data/1_PredLabels_1_23.csv', function(data) {
        var time = 0;
        data.forEach(function(d) {
            d['Time'] = time;
            time += 30;
            d['Label'] = +d['Label'];
        });
        gen_pred_chart();
        refresh_pred_chart(data);
    });

    d3.csv('data/1_200_sleepStates.csv', function(data) {
        var time = 0;
        data.forEach(function(d) {
            d['Time'] = time;
            time += 30;
            if (d['Label'] === 'nan') {
                d['Label'] = -1;
            } else {
                d['Label'] = +d['Label'];
            }
        });
        gen_true_chart();
        refresh_true_chart(data);
    });

    d3.csv('data/1_200_EEG.csv', function(data) {
        data.forEach(function(d) {
            EEG[1].push(+d[1]);
            EEG[2].push(+d[2]);
            EEG[3].push(+d[3]);
            EEG[4].push(+d[4]);
            EEG[5].push(+d[5]);
            EEG[6].push(+d[6]);
        });
        for (var eeg in EEG) {
            EEGList.push(EEG[eeg]);
        }
        gen_EEG_chart();
        refresh_EEG_chart(EEGList);
    })

});


function gen_pred_chart() {
    var parentDiv = d3.select('#predictedLabelChartDiv');
    var margin = {top: 10, right: 20, bottom:20, left: 20},
        width = 1120 - margin.left - margin.right,
        chartHeight =  200 - margin.top - margin.bottom;

    var xScale = d3.scale.linear().range([margin.left, width + margin.right]).domain([-100,24210]);
    var yScale = d3.scale.linear().range([chartHeight -margin.bottom, margin.top]).domain([0,5]);
    var lineGen = d3.svg.line()
        .x(function(d) {
            return xScale(parseInt(d.Time));
        })
        .y(function(d) {
            return yScale(d.Label);
        })
        .defined(function(d) {return d !== -1});

    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([margin.top, chartHeight - margin.bottom]);
    x.domain([-100,24210]);
    y.domain([5, 0]);

    var xAxis = d3.svg.axis().scale(xScale)
        .orient("bottom").tickValues([0, 5000, 10000, 15000, 20000])
        .tickFormat(d3.format(".0f"));

    var yAxis = d3.svg.axis().scale(yScale)
        .orient("left").tickValues([1,2,3,4,5])
        .tickFormat(d3.format('.0f'));

    valueline = d3.svg.line()
        .x(function(d) { return x(d.Time); })
        .y(function(d) { return y(d.Label); });

    var svg = parentDiv
        .append("svg")
        .attr("class", "chart")
        .attr("id", "predictedChart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", chartHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + 0 + ")");
    svg.append("svg:g")
        .attr("transform", "translate(0," + (chartHeight - margin.bottom +5) + ")")
        .call(xAxis);

    svg.append("svg:g")
        .attr("transform", "translate(" + (margin.left) + ",0)")
        .call(yAxis);
}



function gen_true_chart() {
    var parentDiv = d3.select('#trueLabelChartDiv');
    var margin = {top: 10, right: 20, bottom: 20, left: 20},
        width = 1120 - margin.left - margin.right,
        chartHeight =  200 - margin.top - margin.bottom;

    var xScale = d3.scale.linear().range([margin.left, width + margin.right]).domain([-100,24210]);
    var yScale = d3.scale.linear().range([chartHeight -margin.bottom, margin.top]).domain([0,5]);
    var lineGen = d3.svg.line()
        .x(function(d) {
            return xScale(parseInt(d.Time));
        })
        .y(function(d) {
            return yScale(d.Label);
        })
        .defined(function(d) {
            console.log(d);
            return d !== -1});

    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([margin.top, chartHeight - margin.bottom]);
    x.domain([-100,24210]);
    y.domain([5, 0]);

    var xAxis = d3.svg.axis().scale(xScale)
        .orient("bottom").tickValues([0, 5000, 10000, 15000, 20000])
        .tickFormat(d3.format(".0f"));

    var yAxis = d3.svg.axis().scale(yScale)
        .orient("left").tickValues([1,2,3,4,5])
        .tickFormat(d3.format('.0f'));

    valueline = d3.svg.line()
        .x(function(d) { return x(d.Time); })
        .y(function(d) { return y(d.Label); })
        .defined(function(d) {
            console.log(d);
            return d.Label !== -1});

    var svg = parentDiv
        .append("svg")
        .attr("class", "chart")
        .attr("id", "trueChart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", chartHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + 0 + ")");
    svg.append("svg:g")
        .attr("transform", "translate(0," + (chartHeight - margin.bottom+5) + ")")
        .call(xAxis);

    svg.append("svg:g")
        .attr("transform", "translate(" + (margin.left) + ",0)")
        .call(yAxis);
}

function gen_EEG_chart() {
    EEGY =  d3.scale.ordinal()
        .domain(d3.range(6))
        .rangePoints([0, 200], 1);

    color =  d3.scale.ordinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56"]);

    EEGX = d3.scale.linear()
        .domain([0, 24360])
        .range([0, 1100]);


    area = d3.svg.area()
        .interpolate("basis")
        .x(function(d, i) { return EEGX(i); })
        .y0(function(d) { return -d / 2; })
        .y1(function(d) { return d / 2; });

    var svg = d3.select('#EEGChartDiv').append('svg')
        .attr('class', 'EEGChart')
        .attr('height', 200)
        .attr('width', 1100)
}

function refresh_EEG_chart(data) {
    console.log("EEG")
    console.log(data);
    d3.select('.EEGChart').selectAll('path')
        .data(data)
        .enter().append('path')
        .attr('transform', function(d,i) {return "translate(0," + EEGY(i) + ")";})
        .style('fill', function(d, i) {return color(i); })
        .attr('d', area)
}

function refresh_true_chart(data) {
    console.log("true:")
    console.log(data)
    var svg = d3.select('#trueChart > g')
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('d', valueline)
        .attr("transform", 'translate(20,0)');
}

function refresh_pred_chart(data) {
    console.log("predicted");
    console.log(data);
    var svg = d3.select('#predictedChart > g')
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('d', valueline)
        .attr("transform", 'translate(20,0)');
}




