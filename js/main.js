/**
 * Created by joshuakulas on 1/22/17.
 */

var pred_labels;
var true_labels;
var valueline;
var EEGY;
var EEGX;
var color;
var area;
var EEG = {1:[], 2:[], 3:[], 4:[], 5:[], 6:[]};
var EEGList = [];

var EEGLine;
var confidence_data;

var brush;
var x;
var y;
var stairXScale;
var stairYScale;

var xAxis, yAxis;

var EEG_Domain;

var margin = {top: 10, right: 20, bottom:10, left: 10},
    width = $(window).width() * .8 - margin.left - margin.right,
    chartHeight =  200 - margin.top - margin.bottom;

var spect_data;
var spect_colors = ["#a50026","#d73027","#f46d43","#fdae61","#fee08b","#ffffbf","#d9ef8b","#a6d96a","#66bd63","#1a9850","#006837"];

//var zoom = d3.zoom()
//    .scaleExtent([1, Infinity])
//    .translateExtent([[0,0], [width, chartHeight]])
//    .extent([[0,0], [width, chartHeight]])
//    .on('zoom', zoomed);
$(window).on("load", function() {
    var h = $(window).height();
    var w = $(window).width();
    gen_scales();
    $('.chartDiv').height(200).width(.8 * w);

    d3.csv('data/1_PredLabels_1_23.csv', function(data) {
        var time = 0;
        pred_labels = [];
        for (var i = 0; i < data.length - 1; i++) {
            data[i]['Time'] = time;
            data[i]['Label'] = +data[i]['Label']
            pred_labels.push(data[i]);
            if (data[i] !== data[i + 1]) {
                pred_labels.push({
                    'Label' : +data[i]['Label'],
                    'Time' : time + 30
                })
            }
            time += 30
        }
        data[data.length - 1]['Time'] = time;
        data[data.length - 1]['Label'] = +data[data.length - 1]['Label'];
        pred_labels.push(data[data.length - 1]);
        gen_pred_chart();
        refresh_pred_chart(pred_labels);
        d3.csv('data/1_200_sleepStates.csv', function(data) {
            var time = 0;
            true_labels = [];
            for (var i = 0; i < data.length - 1; i++) {
                data[i]['Time'] = time;
                data[i]['Label'] = +data[i]['Label']
                true_labels.push(data[i]);
                if (isNaN(data[i]['Label'])) {data[i]['Label'] = -1}
                if (data[i] !== data[i + 1]) {
                    true_labels.push({
                        'Label' : +data[i]['Label'],
                        'Time' : time + 30
                    })
                }
                time += 30
            }
            data[data.length - 1]['Time'] = time;
            data[data.length - 1]['Label'] = +data[data.length - 1]['Label']
            true_labels.push(data[data.length - 1]);
            gen_true_chart();
            refresh_true_chart(true_labels);
            add_differential_shading();


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
                EEG_Domain = [0, data.length];
                gen_EEG_chart();
                refresh_EEG_chart(EEGList);
                d3.csv('data/spect_data_1.csv', function(data) {
                    spect_data = data;
                    gen_spectrogram(spect_data);
                    d3.csv('data/probabilities.csv', function(data) {
                        console.log(data);
                        confidence_data = data;
                        add_confidence_shading(data)
                    })

                })

            })

        });
    });
});


function gen_scales() {
    stairXScale = d3.scaleLinear().domain([-100,24260]).range([margin.left, width]);
    stairYScale = d3.scaleLinear().domain([0,5]).range([chartHeight -margin.bottom, margin.top]);
    x = d3.scaleLinear().domain([-100, 24210]).range([margin.left, width]);
    y = d3.scaleLinear().domain([5,0]).range([margin.top, chartHeight - margin.bottom]);

    valueline = d3.line()
        .x(function(d) { return x(d.Time); })
        .y(function(d) { return y(d.Label); })
        .defined(function(d) {return d.Label !== -1});

    xAxis = d3.axisBottom(stairXScale)
        .tickValues([0, 5000, 10000, 15000, 20000])
        .tickFormat(d3.format(".0f"));

    yAxis = d3.axisLeft(stairYScale)
        .tickValues([1,2,3,4,5])
        .tickFormat(d3.format('.0f'));
}

function gen_pred_chart() {
    var parentDiv = d3.select('#predictedLabelChartDiv');


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
    EEGY =  d3.scalePoint()
        .domain(d3.range(6))
        .range([20,160]);
    color =  d3.scaleOrdinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56"]);

    EEGX = d3.scaleLinear()
        .domain(EEG_Domain)
        .range([margin.left, width - margin.right]);
    EEGLine = d3.area()
        .x(function(d, i) { return EEGX(i); })
        .y0(function(d) {return -d / 12})
        .y1(function(d) { return d / 12; });

    var svg = d3.select('#EEGChartDiv').append('svg')
        .attr('class', 'EEGChart')
        .attr("width", width + margin.left + margin.right)
        .attr("height", chartHeight + margin.top + margin.bottom)


}


function gen_spectrogram(data) {

    var svg = d3.select('#spectrogramDiv').append('svg')
        .attr('class', 'spectrogramSVG')
        .attr('width', width + margin.left + margin.right)
        .attr('height', chartHeight + margin.top + margin.bottom);



    var svgCanvas = document.getElementsByClassName('spectrogramSVG')[0];
    console.log(svgCanvas);
    var newNode = document.createElement('canvas');
    newNode.setAttribute('id', 'spectrogram');
    svgCanvas.appendChild(newNode);
    d3.select('#spectrogram')
        .call(drawImage)
}


function drawImage(canvas) {
    var dy = spect_data.length;
    var dx = 141;
    console.log(spect_data);
    d3.select('#testCanvas')
        .attr('width', dx)
        .attr('height', chartHeight)
        .attr('width', width + 25 + 'px')
        .attr('height', chartHeight + 'px');

    var context = document.getElementById('testCanvas').getContext('2d'),
        image = context.createImageData(dy, dx);
    var spectColor =  d3.scaleLinear()
        .domain([0,.2,.4,.6,1,2])
        .range(["##0543a8", "#16e9f4", "#46e038", "#f6ff00", "#ff8c00", "#ff0000"])

    // format data for image
    for (var x = dx - 1, p = -1; x > -1; --x) {
        for (var y = dy - 1; y > -1; --y) {
            var c = d3.rgb(spectColor(+spect_data[y][x]));
            //if ((x + y) % 100 === 0) {
            //    console.log(spect_data[y][x]);
            //    console.log(x);
            //    console.log(y);
            //    console.log(c)
            //    console.log('---------------');
            //}
            image.data[++p] = c.r;
            image.data[++p] = c.g;
            image.data[++p] = c.b;
            image.data[++p] = 255;
        }
    }

    console.log(image);
    context.putImageData(image, 25, 0);
}

function refresh_EEG_chart(data) {

    d3.select('.EEGChart').selectAll('path')
        .data(data)
        .enter().append('path')
        .attr('transform', function(d,i) {return "translate(" + margin.left + "," + EEGY(i) + ")";})
        .style('fill', function(d, i) {return color(i); })
        .attr('d', EEGLine)

}

function refresh_true_chart(data) {

    var svg = d3.select('#trueChart > g')
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1)
        .attr('d', valueline)
        .attr("transform", 'translate(0,0)');
}

function refresh_pred_chart(data) {

    var svg = d3.select('#predictedChart > g')
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1)
        .attr('d', valueline)
        .attr("transform", 'translate(0,0)');
}

// function to add backgrounds where there is a mismatch
function add_differential_shading() {
    var mismatches = calc_mismatches();
    d3.select('#trueChart > g').selectAll('rect')
        .data(mismatches)
        .enter()
        .append('rect')
        .attr('x', function(d) {return x(d)})
        .attr('y', margin.top)
        .attr('class',function(d) {return 'shade_rect ' + d})
        .attr('width', (30 * width / 24310))
        .attr('height', chartHeight - margin.top - margin.bottom)
        .style('fill', 'red');
}

function add_confidence_shading() {
    var g = d3.select('#predictedChart > g');
    var confidenceScale = d3.scaleLinear()
        .domain([.5,1])
        .range(['#ff0a0e','#50f442'])
    g.selectAll('.bar')
        .data(confidence_data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', function(d, i) {return x(i * 30)})
        .attr('y', function(d) {return y(+d.probability)})
        .attr('width', 1.2)
        .attr('height', function(d) {return chartHeight - y(+d.probability)})
        .style('fill', function(d) {return confidenceScale(+d.probability)});
}

// function to calculate mismatched
function calc_mismatches() {
    var mismatches = [];
    var numMismatches = 0;
    // find all mismatches
    for (var i = 0; i < pred_labels.length; i++) {
        if (pred_labels[i]['Label'] !== true_labels[i]['Label']) {
            numMismatches += 1;
            mismatches.push(pred_labels[i]['Time']);
        }
    }
    // calculate unique
    var unique_mismatches = [];
    $.each(mismatches, function(i, el) {
        if ($.inArray(el, unique_mismatches) === -1) unique_mismatches.push(el);
    });
    return unique_mismatches;
}

function zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return
    var t = d3.event.transform;
    x.domain(t.rescaleX())
}