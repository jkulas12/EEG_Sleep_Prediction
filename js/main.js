/**
 * Created by joshuakulas on 1/22/17.
 */

var pred_labels;
var true_labels;

var raw_pred_labels;
var raw_true_labels;
var valueline;
var EEGY;
var EEGX;
var color;
var area;
var EEG = {1:[], 2:[], 3:[], 4:[], 5:[], 6:[]};
var EEGList = [];
var zoom;
var dy;
var dx = 141;

var EEGLine;
var confidence_data;
var sleep_name_list = ['N3', 'N2', 'N1', 'R', 'W']

var brush;
var x;
var y;
var stairXScale;
var stairYScale;
var overviewSprectData;
var xAxis, yAxis;
var spectX;
var spectXScale;
var EEG_Domain;
var spectXAxis;
var trap_points;
var margin = {top: 15, right: 20, bottom:10, left: 15},
    chartWidth = $(window).width() * .7 - margin.left - margin.right,
    chartHeight =  180 - margin.top - margin.bottom;
var EEG_Channels = ['F3M2','F4M1','C3M2','C4M1','O1M2','O2M1'];
var spect_data;

var input_data_directory;
var context = document.getElementById('spectCanvas').getContext('2d');
var patientID;
var data_directory;
var HUMAN_LABELS;

var num_seconds;
var start_seconds;
$(window).on("load", function() {
    var h = $(window).height();
    var w = $(window).width();

    $('.chartDiv').height(180).width(.7 * w);

    $('#EEGInfoDiv').height(180).width(.15 * w).css({'left' :.71 * w});
    $('#EEGChartDiv').height(180).width(.97 * w);
    $('#patientInfoDiv').height(210).width(.28 * w).css({'left' :.71 * w});
    patientID = getParameterByName('patientID');
    if (patientID == null) {
        alert('Provide patientID... defaulting to patient 0');
        patientID = 0;
    }
    data_directory = 'data/patient' + patientID + '/processed/';
    input_data_directory = 'data/patient' + patientID + '/input/';
    gen_stats_panel();
    d3.csv(data_directory + patientID + '_Pred_Labels.csv', function(data) {
        var time = 0;
        pred_labels = [];
        raw_pred_labels = [];
        for (var i = 0; i < data.length - 1; i++) {
            data[i]['Time'] = time;
            data[i]['Label'] = +data[i]['Label'];
            pred_labels.push(data[i]);
            raw_pred_labels.push(data[i]);
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
        num_seconds = raw_pred_labels.length * 30;
        gen_scales();


        d3.csv(data_directory + patientID + '_sleepStates.csv', function(error, data) {
            if (error) {
                HUMAN_LABELS = false;
                $('#trueLabelChartDiv').css({'display' : 'none'})
            } else {
                HUMAN_LABELS = true;
                var time = 0;
                true_labels = [];
                raw_true_labels = [];
                for (var i = 0; i < data.length - 1; i++) {
                    data[i]['Time'] = time;
                    data[i]['Label'] = +data[i]['Label']
                    true_labels.push(data[i]);
                    raw_true_labels.push(data[i]);
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
                gen_pred_chart();
                refresh_pred_chart(pred_labels);
                gen_true_chart();
                refresh_true_chart(true_labels);
                add_differential_shading();
            }
            d3.csv(data_directory + patientID + '_EEG.csv', function( data) {
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

                EEG_Domain = [0, data.length * 25];
                gen_EEG_chart();
                refresh_EEG_chart(EEGList,EEG_Domain[0], EEG_Domain[1]);
                d3.csv(data_directory + patientID + '_spect_data.csv', function(data) {
                    overviewSprectData = data;
                    dy = data.length;
                    spect_data = data;
                    gen_spectrogram(overviewSprectData);
                    d3.csv(data_directory + 'probabilities.csv', function(data) {
                        confidence_data = data;
                        add_confidence_shading(data)

                    })

                })

            })

        });
    });
});


function gen_stats_panel() {
    var stat_data;
    var stat_map = {}
    d3.text(input_data_directory + 'sleep_stats.txt', function(data) {
        stat_data = data.split('\n');
        stat_data = stat_data.map(function(d) {
            var split_obj = d.split(':');
            if (split_obj[0] !== "start_time") {
                split_obj[1] = split_obj[1].replace('[','').replace(']','');

            split_obj[1] = split_obj[1].split(',').map(function(e) {
                return +e;
            });
            }
            stat_map[split_obj[0]] = split_obj[1]
        });
        start_seconds = stat_map['start_time'].split('.').map(function(e) {return +e});
        start_seconds = start_seconds[0] * 3600 + start_seconds[1] * 60 + start_seconds[2];
        // Add EEG_Channel labels
        d3.select('#EEGInfoDiv').selectAll('.textDiv')
            .data(EEG_Channels)
            .enter().append('div')
            .attr('class', 'textDiv')
            .style('y', function(d,i) {return 10 + i * 30})
            .text(function(d) {return d});

        // add aggreagate statistics
        var sleepStageHeader = d3.select('#sleepStageDiv')
            .append('div')
            .attr('class', 'sleepStageHeader');

        sleepStageHeader.append('div')
            .attr('class', 'sleepStageHeaderText')
            .text('Sleep Stage');
        sleepStageHeader.append('div')
            .attr('class', 'sleepStageHeaderNum')
            .text('1');
        sleepStageHeader.append('div')
            .attr('class', 'sleepStageHeaderNum')
            .text('2');
        sleepStageHeader.append('div')
            .attr('class', 'sleepStageHeaderNum')
            .text('3');
        sleepStageHeader.append('div')
            .attr('class', 'sleepStageHeaderNum')
            .text('4');
        sleepStageHeader.append('div')
            .attr('class', 'sleepStageHeaderNum')
            .text('5');

        var mins = stat_map['mins_in_each_stage'];
        var sleepMins = d3.select('#sleepStageDiv')
            .append('div')
            .attr('class', 'sleepStageMins');

        sleepMins.append('div')
            .text('Minutes')
            .attr('class', 'sleepStageMinsTitle');
        sleepMins.selectAll('sleepMinSpan')
            .data(mins).enter()
            .append('div')
            .attr('class', 'sleepMinSpan')
            .text(function(d) {return d});

        var avgStatsDiv = d3.select('#aggregateStatsDiv');

        var total_mins = stat_map['total_mins'][0];

        avgStatsDiv.append('div')
            .text('Total Minutes of Sleep:    ' + total_mins)
            .attr('class', 'avgStatsRow totSleepMins')

        var sleep_efficiency = stat_map['sleep_efficiency'][0];
        avgStatsDiv.append('div')
            .text('Sleep Efficiency(%):    ' + Math.round(sleep_efficiency * 10000) / 100)
            .attr('class', 'avgStatsRow');

        var sleep_to_wake = stat_map['number_of_sleep_to_wake_transitions'][0];
        avgStatsDiv.append('div')
            .text('Sleep to Wake Transitions: ' + sleep_to_wake)
            .attr('class', 'avgStatsRow');

        var sleep_to_wake_per_hr = stat_map['number_of_sleep_to_wake_transitions_per_hour'][0];
        avgStatsDiv.append('div')
            .text(function (d) {return 'Sleep to Wake Transitions per hr.:  ' + Math.round(sleep_to_wake_per_hr * 10) / 10})
            .attr('class', 'avgStatsRow');

        var sleep_to_sleep = stat_map['number_of_sleep_to_sleep_transitions'][0];
        avgStatsDiv.append('div')
            .text('Sleep to Sleep Transitions: ' + sleep_to_sleep)
            .attr('class', 'avgStatsRow');

        var sleep_to_sleep_per_hr = stat_map['number_of_sleep_to_sleep_transitions_per_hour'][0];
        avgStatsDiv.append('div')
            .text(function(d) {return 'Sleep to Sleep Transitions per hr.: ' + Math.round(sleep_to_sleep_per_hr * 10) / 10})
            .attr('class', 'avgStatsRow');


        // percentages
        var pcts = stat_map['pecentage_of_min_in_each_stage'];
        var sleepMinPct = d3.select('#sleepStageDiv')
            .append('div')
            .attr('class', 'sleepStagePcts');
        sleepMinPct.append('div')
            .text('%/Stage')
            .attr('class', 'sleepStagePctHeader');

        sleepMinPct.selectAll('sleepPctSpan')
            .data(pcts).enter()
            .append('div')
            .attr('class', 'sleepPctSpan')
            .text(function(d) {return Math.round(d * 10000) / 100});
    })


}

function gen_scales() {
    stairXScale = d3.scaleLinear().domain([-100,num_seconds]).range([margin.left, chartWidth]);
    stairYScale = d3.scaleLinear().domain([0,5]).range([chartHeight -margin.bottom, margin.top]);
    x = d3.scaleLinear().domain([-100, num_seconds]).range([margin.left, chartWidth]);
    y = d3.scaleLinear().domain([5,0]).range([margin.top, chartHeight - margin.bottom]);

    spectX = d3.scaleLinear().domain([-100, num_seconds]).range([margin.left, chartWidth]);
    spectXScale = d3.scaleLinear().domain([-100,num_seconds]).range([margin.left, chartWidth]);
    valueline = d3.line()
        .x(function(d) { return x(d.Time); })
        .y(function(d) { return y(d.Label); })
        .defined(function(d) {return d.Label !== -1});


    xAxis = d3.axisBottom(stairXScale)
        .tickValues([0, 7200, 14400, 21600])
        .tickFormat(function(d) {
            d = d + start_seconds;
            var hours = String(Math.floor(d / 3600));
            var display_hours = String(+hours % 23);
            if (display_hours.length < 2) {display_hours = '0' + String(display_hours)}
            if (hours.length < 2) {hours = '0' + String(hours)}
            var hour_remainder = d - (3600 * hours);
            var minutes = String(Math.floor(hour_remainder / 60));
            if (minutes.length < 2) {minutes = '0' + String(minutes)}
            var minute_remainder = hour_remainder - (60 * minutes);
            var seconds = String(minute_remainder);
            if (seconds.length < 2) {seconds = '0' + String(seconds)}
            return display_hours + ':' + minutes + ":" + seconds;
        });

    yAxis = d3.axisLeft(stairYScale)
        .ticks(4)
        .tickFormat(function(d) {
            return sleep_name_list[+d - 1];
        })

    spectXAxis = d3.axisBottom(spectXScale)
        .ticks(4)
        .tickFormat(function(d) {
            d = (d / 2) + start_seconds;
            var hours = String(Math.floor(d / 3600));
            var display_hours = String(+hours % 23);
            if (display_hours.length < 2) {display_hours = '0' + String(display_hours)}
            if (hours.length < 2) {hours = '0' + String(hours)}
            var hour_remainder = d - (3600 * hours);
            var minutes = String(Math.floor(hour_remainder / 60));
            if (minutes.length < 2) {minutes = '0' + String(minutes)}
            var minute_remainder = hour_remainder - (60 * minutes);
            var seconds = String(minute_remainder);
            if (seconds.length < 2) {seconds = '0' + String(seconds)}
            return display_hours + ':' + minutes + ":" + seconds;
            //return d / 2;
        });
}

function gen_pred_chart() {
    var parentDiv = d3.select('#predictedLabelChartDiv');


    var svg = parentDiv
        .append("svg")
        .attr("class", "chart")
        .attr("id", "predictedChart")
        .attr("width", chartWidth + margin.left + margin.right)
        .attr("height", chartHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + (margin.top - margin.bottom)  + ")");
    svg.append("svg:g")
        .attr("transform", "translate(0," + (chartHeight - margin.bottom +5) + ")")
        .call(xAxis);

    svg.append("svg:g")
        .attr("transform", "translate(" + (margin.left) + ",0)")
        .call(yAxis);

    svg.append("text")
        .attr('x', chartWidth / 2)
        .attr('y', margin.top / 2)
        .attr('text-anchor', 'middle')
        .text("Predicted Labels");
}



function gen_true_chart() {
    var parentDiv = d3.select('#trueLabelChartDiv');
    var svg = parentDiv
        .append("svg")
        .attr("class", "chart")
        .attr("id", "trueChart")
        .attr("width", chartWidth + margin.left + margin.right)
        .attr("height", chartHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + (margin.top - margin.bottom) + ")");
    svg.append("svg:g")
        .attr("transform", "translate(0," + (chartHeight - margin.bottom+5) + ")")
        .call(xAxis);

    svg.append("svg:g")
        .attr("transform", "translate(" + (margin.left) + ",0)")
        .call(yAxis);
    svg.append("text")
        .attr('x', chartWidth / 2)
        .attr('y', margin.top / 2)
        .attr('text-anchor', 'middle')
        .text("Human Labels");
}

function gen_EEG_chart() {
    EEGY =  d3.scalePoint()
        .domain(d3.range(6))
        .range([20,160]);
    color =  d3.scaleOrdinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56"]);

    EEGX = d3.scaleLinear()
        .domain(EEG_Domain)
        .range([margin.left, chartWidth + margin.right]);
    EEGLine = d3.line()
        .x(function(d, i) { return EEGX(i); })
        .y(function(d) { return d / 20; });

    var svg = d3.select('#EEGChartDiv').append('svg')
        .attr('class', 'EEGChart')
        .attr("width", chartWidth + margin.left + margin.right)
        .attr("height", chartHeight + margin.top + margin.bottom)


}


function gen_spectrogram() {
    d3.select('#spectrogramDiv').append('svg')
        .attr('width', chartWidth)
        .attr('height', 20)
        .append("svg:g")
        .attr('class', 'spectrogramAxis')
        .attr("transform", "translate(15,0)")
        .call(spectXAxis);


    var svgCanvas = document.getElementsByClassName('spectrogramSVG')[0];
    var newNode = document.createElement('canvas');
    newNode.setAttribute('id', 'spectrogram');
    d3.select('#spectrogram')
        .call(drawImage)
}


function drawImage() {

    context.clearRect(0,0,dy, dx);

    dy = spect_data.length;
    dx = 139;
    console.log(dx);
    console.log(dy);
    d3.select('#spectCanvas')
        .attr('width', dx)
        .attr('height', 139)
        .attr('width', chartWidth + 25 + 'px')
        .attr('height', 140 + 'px');

    var image = context.createImageData(dy, dx);
    var spectColor =  d3.scaleLinear()
        .domain([-6, -3.6, -1.2, 1.2, 3.6, 6])
        .range(["#0543a8", "#16e9f4", "#46e038", "#f6ff00", "#ff8c00", "#ff0000"])

    // format data for image
    for (var x = dx - 1, p = -1; x > -1; --x) {
        for (var y = 0; y < dy; ++y) {
            var c = d3.rgb(spectColor(Math.log(+spect_data[y][x])));
            image.data[++p] = c.r;
            image.data[++p] = c.g;
            image.data[++p] = c.b;
            image.data[++p] = 255;
        }
    }
    context.putImageData(image, 0, 0);
    context.scale(chartWidth/ spect_data.length, 1);
    context.drawImage($('#spectCanvas')[0],0,0)

}

function refresh_EEG_chart(data, start, end) {
    console.log(start);
    console.log(end);
    d3.selectAll('.EEGChart > path').remove();

    EEGX.domain([0, data[0].length]);
    spectXScale.domain([start * 2, end * 2]);

    d3.select('.spectrogramAxis')
        //.attr("transform", "translate(0,"")")
        .call(spectXAxis);
    d3.select('.EEGChart').selectAll('path')
        .data(data)
        .enter().append('path')
        .attr('transform', function(d,i) {
            return "translate(" + margin.left + "," + EEGY(i) + ")";})
        .attr('d', EEGLine)
    draw_trapezoid(start, end);

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
    var selector;
    if (HUMAN_LABELS) {
        selector = '#trueChart > g';
    } else {
        selector = '#predictedChart > g';
    }
    d3.select(selector).selectAll('rect')
        .data(mismatches)
        .enter()
        .append('rect')
        .attr('x', function(d) {
            return x(d['start'])})
        .attr('y', margin.top)
        .attr('class',function(d) {return 'shade_rect ' + d})
        .attr('width',function(d) {
            return  (d['width'] * chartWidth / num_seconds)})
        .attr('height', chartHeight - margin.top - margin.bottom)
        .style('fill', 'red')
        .on('click', function(d) {
            var start = d['start'];
            var width = d['width'];
            d3.json(data_directory + 'mismatches/mismatch_' + (start + 45) + '.json', function(d)  {
                console.log(d);
                //EEGX.range([margin.left, 300 + margin.left])
                var EEG_data = d['EEG_data'];
                //var spect_data = d['']
                refresh_EEG_chart(EEG_data, start, start + 30);
                spect_data = d['sprect_data'];
                drawImage();
                var topPos = 2 * margin.top + 3 * chartHeight + 2 * margin.bottom;
                $('#selectedRectTrueMarker').width(chartWidth * (width) / num_seconds);
                $('#selectedRectTrueMarker').height(chartHeight + 2 * margin.bottom + margin.top)
                $('#selectedRectTrueMarker').css({top : topPos, left: x(start) +margin.left});
                $('#selectedRectTrueMarker').css({background : 'gray', opacity : .4});
            })

        });
}

function add_confidence_shading() {
    var g = d3.select('#predictedChart > g');
    var confidenceScale = d3.scaleLinear()
        .domain([.3,1])
        .range(['#ff0a0e','#50f442']);


    g.selectAll('.bar')
        .data(confidence_data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', function(d, i) {return x(i * 30)})
        .attr('y', function(d) {return y(+d.probability)})
        .attr('width', 1.2)
        .attr('height', function(d) {return chartHeight - y(+d.probability)})
        .style('fill', function(d,i) {
            if (raw_pred_labels[i]['Label'] === raw_true_labels[i]['Label']) {
                return '#50f442';
            } else {
                return '#ff0a0e';
            }})
}

// function to calculate mismatched
function calc_mismatches() {
    var mismatches = [];
    var currentMismatch = false;
    var consecutive = 0;
    var start = 0;

    var comparison_len = raw_pred_labels.length > raw_true_labels.length ? raw_true_labels.length : raw_pred_labels.length;
    for (var i = 0; i < comparison_len; i++) {
        if ((raw_true_labels[i]['Label'] !== raw_pred_labels[i]['Label'])) {
            // continue current mismatch
            if (currentMismatch) {
                consecutive += 1;
            } else {
                // start new mismatch
                consecutive = 1;
                start = raw_true_labels[i]['Time'];
                currentMismatch = true;
            }
        } else {
            if (currentMismatch) {
                // there was a previous mismatch so we have to add to list
                mismatches.push({
                    'start' : start - 15,
                    'width' : consecutive * 30
                });
                consecutive = 0;
                start = 0;
                currentMismatch = false;
            }
        }
    }
    return mismatches;
}

function resetZoom() {
    spect_data = overviewSprectData;
    drawImage();
    $('#selectedRectTrueMarker').width(0)
    EEG_Domain = [0, EEGList[0].length * 25];
    console.log(EEG_Domain);
    console.log(EEGList)
    refresh_EEG_chart(EEGList,EEG_Domain[0], EEG_Domain[1]);

}

function draw_trapezoid(start, stop) {
    $('.trapezoid').remove();


    var svg = d3.select('#spectrogramDiv')
        .append('svg')
        .attr('class', 'trapezoid')
        .attr('width', chartWidth)
        .attr('height', 70);

    $('.trapezoid').css({'top' : 2 * chartHeight, left : 2 * margin.left, 'z-index' : -20, 'opacity':.4})
    var trap_line = d3.line()
        .x(function(d) {
            return d.x;
        })
        .y(function(d) {
            return d.y;
        });

    var start_pos = start * chartWidth / num_seconds;
    var end_pos = stop * chartWidth / num_seconds;
     trap_points = [{
        x: -10, y: 0
    },{
        x: chartWidth + 10, y: 0
    },{
        x: end_pos, y: 70
    },{
        x:start_pos, y: 70
    }];
    svg.append('path')
        .attr("d", trap_line(trap_points) + 'Z')
        .style("fill", "gray");
}

function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}