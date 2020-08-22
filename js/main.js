var map;


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
        strokeColor: ch.color,
        // Ширина линии.
        strokeWidth: 5
    });
    ch.pathGeo = myGeoObject;
    show_path(ch);
}

function hide_path(ch) {
    map.geoObjects.remove(ch.pathGeo);
}

function show_path(ch) {
    map.geoObjects.add(ch.pathGeo);
}

var clusterer;
function new_time(date)
{
    var heroes = [];
    characters.forEach(ch =>
        {
     
            if(ch.placemark == null)
            {
                ch.placemark =  new ymaps.Placemark([ch.movements[0].points[0][0], ch.movements[0].points[0][1]], {
                    balloonContentHeader: ch.name,
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
                        balloonContentHeader: ch.name,
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
                            heroes.push(ch.placemark);
                            map.geoObjects.add(ch.placemark);
                        }
                    }
                }
            }
        });
        
        if(clusterer != null){
            map.geoObjects.remove(clusterer);
        }

        clusterer = new ymaps.Clusterer({
            preset: 'islands#invertedDarkOrangeClusterIcons',
            groupByCoordinates: false,
            clusterDisableClickZoom: true,
            clusterHideIconOnBalloonOpen: false,
            geoObjectHideIconOnBalloonOpen: false,
            gridSize: 32,
            clusterDisableClickZoom: true
        });

        //добавление кластеризатора
        clusterer.add(heroes);
        map.geoObjects.add(clusterer);
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
            $("#log-x")[0].innerHTML = coords[0].toPrecision(6);
            $("#log-y")[0].innerHTML = coords[1].toPrecision(6);
        });


        //добавление меток городов стран и тд
        map.events.add('click', function (e) {
            var coords = e.get('coords');
            $("#log-xy")[0].innerHTML = "[" + coords[0].toPrecision(6) + ", " + coords[1].toPrecision(6) + "]";
            console.log("[" + coords[0].toPrecision(6) + ", " + coords[1].toPrecision(6) + "]");
        });
       
        points.forEach(p => {
            var point = new ymaps.Placemark(p.chords, {
                iconContent: p.content
            }, {
                preset: 'islands#lightBlueStretchyIcon'
            });
            map.geoObjects.add(point);
        });

        //отображение путей героев
        characters.forEach(ch => draw_path(ch));
}

$(function(){
    $(".js-example-basic-multiple").select2();
    ymaps.ready(init);

    $("#slider-range").slider({
        range: false,
        min: new Date(3018, 0, 1).getTime() / 1000,
        max: new Date(3019, 2, 25).getTime() / 1000,
        step: 86400,
        values: [ new Date(3018, 1, 1).getTime() / 1000],
        slide: function( event, ui ) {
            $( "#cur-date" )[0].innerHTML = new Date(ui.values[ 0 ] *1000).toDateString();
            new_time(new Date(ui.values[ 0 ] *1000));
        }
    });
    $("#tabs").tabs();
    $("#show-paths-checkbox").on("change", function (e) {
        if ($("#show-paths-checkbox").get(0).checked) {
            characters.forEach(ch => show_path(ch));
        } else {
            characters.forEach(ch => hide_path(ch));
        }
        
    });
    /*
    characters.forEach(ch => {
        if ($('.show-path-checkbox[char="' + ch.name + '"]').get(0).checked) {
            show_path(ch);
        }
    });
    */
});
