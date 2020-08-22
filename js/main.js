var map;

var char_movement = {
    "Test": {
        points: [
            [0, 0], 
            [-1280.00, 1082.00]
        ],
        timeStart: new Date(),
        timeEnd: new Date(),
        placemarks: [],
        visible: false
    },
    "Test2": {
        points: [
            [0, 0], 
            [-1300, 1090]
        ],
        timeStart: new Date(),
        timeEnd: new Date(),
        placemarks: [],
        visible: false
    }
}

var curData = {
    positions: [
        {
            name: "Gandalf",
            placemark: null,
            road: "Test",
            point: []
        }
    ],
    date: new Date(),
    redraw: function (date) {
        this.date = date;
        this.positions.forEach(char => {
            char.point = [char_movement[char.road].points[0][0], char_movement[char.road].points[0][1]];
            if (char.point) map.geoObjects.remove(char.point);
            let point = new ymaps.Placemark(p, {
                balloonContent: char
            }, {
                preset: 'islands#nightDotIcon'
            });
            char.placemark = point;
            map.geoObjects.add(point);
        })
    }
}

function toggle_char_visibility(char) {
    if (!char_movement[char].visible) {
        char_movement[char].visible = true;
        char_movement[char].points.forEach(p => {
            let point = new ymaps.Placemark(p, {
                balloonContent: char
            }, {
                preset: 'islands#darkBlueDotIcon'
            });
            char_movement[char].placemarks.push(point);
            map.geoObjects.add(point);
        });
    } else {
        char_movement[char].visible = false;
        char_movement[char].placemarks.forEach(p => {
            map.geoObjects.remove(p);
        });
        char_movement[char].placemarks = [];
    }
}

$(document).ready(function() {
    $( "#slider-range" ).slider({
        range: false,
        min: new Date(3018, 1, 1).getTime() / 1000,
        max: new Date(3022, 1, 1).getTime() / 1000,
        step: 86400,
        values: [ new Date(3018, 1, 1).getTime() / 1000],
        slide: function( event, ui ) {
            $( "#cur-date" )[0].innerHTML = new Date(ui.values[ 0 ] *1000).toDateString();
            new_time(new Date(ui.values[ 0 ] *1000));
        }
    });
    $( "#amount" ).val( (new Date($( "#slider-range" ).slider( "values", 0 )*1000).toDateString()));
});
function getDistance(p1, p2)
{
    return Math.sqrt((p1[0] - p2[0])*(p1[0] - p2[0]) + (p1[1] - p2[1])*(p1[1] - p2[1]));
}

function draw_path(ch) {

    var chords = [];

    ch.movements.forEach(mov => {
        mov.points.forEach(pt => chords.push(pt))
    });

    var myGeoObject = new ymaps.GeoObject({
        geometry: {
            type: "LineString",
            coordinates: chords
        }
    }, {
        strokeColor: "#000000",
        // Ширина линии.
        strokeWidth: 5
    });
    map.geoObjects.add(myGeoObject);
}


function new_time(date)
{
    characters.forEach(ch =>
        {
     
            if(ch.placemark == null)
            {
                ch.placemark =  new ymaps.Placemark([ch.movements[0].points[0][0], ch.movements[0].points[0][1]], {
                    iconContent: ch.name,
                    balloonContent: ''
                }, {
                    preset: 'islands#darkOrangeStretchyIcon'
                });
            }
            for(var i = 0; i < ch.movements.length; i++)
            {
                var start = new Date(ch.movements[i].start);
                var end =  new Date(ch.movements[i].end);
               // alert(start +"  " + date+ " " + end);
                
                if(start <= date &&  date <=  end)
                {
                    //изменение описания метки
                    ch.placemark.properties.set({
                        iconContent: ch.name,
                        balloonContent : ch.movements[i].description
                    });


                    var totalDist = 0;
                    for(var j = 0; j < ch.movements[i].points.length - 1; j++)
                    {
                        p1 = ch.movements[i].points[j];
                        p2 = ch.movements[i].points[j+1];
                        totalDist += getDistance(p1, p2);
                    }
                    
                    var t1 = date.getTime() - start.getTime();
                    var t2 = end.getTime() - start.getTime();
                    var persents = t1 * 1.0 / t2;
                    var dist = totalDist*persents;
                    var curDist=0;
                 
                    for(var j = 0; j < ch.movements[i].points.length - 1; j++)
                    {
                        p1 = ch.movements[i].points[j];
                        p2 = ch.movements[i].points[j+1];
                        prev =  curDist;
                        curDist += getDistance(p1, p2);
                        //alert(prev + " " + dist +"  " + curDist )
                        if(prev<=dist && dist<= curDist)
                        {
                            var a = dist - prev;
                            var b = curDist - prev;
                            var pers = a * 1.0 / b;
                            //alert(pers);
                           // alert(p1 + " " + p2 + "  " + pers);
                            var x = p1[0] + (p2[0] - p1[0])*pers;
                            var y = p1[1] + (p2[1] - p1[1])*pers;
                        
                            ch.placemark.geometry.setCoordinates([x,y]);
                            map.geoObjects.add(ch.placemark);
                        }
                    }
                }


            }

        })

}



function init()
{

    var LAYER_NAME = 'user#layer',
    MAP_TYPE_NAME = 'user#customMap',
    TILES_PATH = 'images\\tiles',


    MAX_ZOOM = 23,
    PIC_WIDTH = 8192, //,
    PIC_HEIGHT = 6144;//;

    /**
     * Конструктор, создающий собственный слой.
     */
    var Layer = function () {
        var layer = new ymaps.Layer(TILES_PATH + '/%z/tile-%x-%y.jpg', {
            // Если есть необходимость показать собственное изображение в местах неподгрузившихся тайлов,
            // раскомментируйте эту строчку и укажите ссылку на изображение.
             notFoundTile: TILES_PATH+'\\0\\tile-0-0.jpg'
        });
        // Указываем доступный диапазон масштабов для данного слоя.
        layer.getZoomRange = function () {
            return ymaps.vow.resolve([1, 23]);
        };
        // Добавляем свои копирайты.
        layer.getCopyrights = function () {
            return ymaps.vow.resolve('©');
        };
        return layer;
    };
    // Добавляем в хранилище слоев свой конструктор.
    ymaps.layer.storage.add(LAYER_NAME, Layer);

    /**
     * Создадим новый тип карты.
     * MAP_TYPE_NAME - имя нового типа.
     * LAYER_NAME - ключ в хранилище слоев или функция конструктор.
     */
    var mapType = new ymaps.MapType(MAP_TYPE_NAME, [LAYER_NAME]);
    // Сохраняем тип в хранилище типов.
    ymaps.mapType.storage.add(MAP_TYPE_NAME, mapType);

    // Вычисляем размер всех тайлов на максимальном зуме.
    var worldSize = Math.pow(2, MAX_ZOOM) * 256;
        /**
         * Создаем карту, указав свой новый тип карты.
         */
        map = new ymaps.Map('map', {
            center: [0, 0],
            zoom: 1,
            controls: ['zoomControl'],
            type: MAP_TYPE_NAME
        }, {

            // Задаем в качестве проекции Декартову. При данном расчёте центр изображения будет лежать в координатах [0, 0].
            projection: new ymaps.projection.Cartesian([[PIC_HEIGHT / 2 - worldSize, -PIC_WIDTH / 2], [PIC_HEIGHT / 2, worldSize - PIC_WIDTH / 2]], [false, false]),
            // Устанавливаем область просмотра карты так, чтобы пользователь не смог выйти за пределы изображения.
            restrictMapArea: [[-PIC_HEIGHT / 2, -PIC_WIDTH / 2], [PIC_HEIGHT / 2, PIC_WIDTH / 2]]

            // При данном расчёте, в координатах [0, 0] будет находиться левый нижний угол изображения,
            // правый верхний будет находиться в координатах [PIC_HEIGHT, PIC_WIDTH].
            // projection: new ymaps.projection.Cartesian([[PIC_HEIGHT - worldSize, 0], [PIC_HEIGHT, worldSize]], [false, false]),
            // restrictMapArea: [[0, 0], [PIC_HEIGHT, PIC_WIDTH]]
        });

        map.events.add('mousemove', function (e) {
            var coords = e.get('coords');
            console.log(coords[0].toPrecision(6));
            $("#log-x")[0].innerHTML = coords[0].toPrecision(6);
            $("#log-y")[0].innerHTML = coords[1].toPrecision(6);
        });
       
        points.forEach(p => {
            var point = new ymaps.Placemark(p.chords, {
                balloonContent: p.content
            }, {
                preset: 'islands#darkOrangeDotIcon'
            });
        
            map.geoObjects.add(point);
        });
        
        characters.forEach(ch => draw_path(ch));
}

$(function(){
    $(".js-example-basic-multiple").select2();
    ymaps.ready(init);
});
