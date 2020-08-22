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

$(function() {
    $( "#slider-range" ).slider({
      range: false,
      min: new Date('3018.01.01').getTime() / 1000,
      max: new Date('3022.01.01').getTime() / 1000,
      step: 86400,
      values: [ new Date('3018.01.01').getTime() / 1000],
      slide: function( event, ui ) {
        $( "#amount" ).val( (new Date(ui.values[ 0 ] *1000).toDateString() )  );
      }
    });
    $( "#amount" ).val( (new Date($( "#slider-range" ).slider( "values", 0 )*1000).toDateString()));
  });



function init()
{


        var LAYER_NAME = 'user#layer',
        MAP_TYPE_NAME = 'user#customMap',
    // Директория с тайлами.
        TILES_PATH = 'images\\tiles',
    /* Для того чтобы вычислить координаты левого нижнего и правого верхнего углов прямоугольной координатной
     * области, нам необходимо знать максимальный зум, ширину и высоту изображения в пикселях на максимальном зуме.
     */
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

        map.events.add('click', function (e) {
            var coords = e.get('coords');
            
            $("#x").val(coords[0].toPrecision(6));
            $("#y").val(coords[1].toPrecision(6));
            $("#xy").text("["+coords[0].toPrecision(6) +" , " +coords[1].toPrecision(6) +"]")
        });
       
        points.forEach(p => {
            var point = new ymaps.Placemark(p.chords, {
                balloonContent: p.content
            }, {
                preset: 'islands#darkOrangeDotIcon'
            });
        
            map.geoObjects.add(point);
        });
        

}

$(function(){
    $(".js-example-basic-multiple").select2();
    ymaps.ready(init);
});
