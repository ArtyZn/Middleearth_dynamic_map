



function map_init () {
    myMap = new ymaps.Map("map", {
        center: [48.856929, 15.341198],
        zoom: 2,
        controls: []
    }, {suppressMapOpenBlock: true, minZoom: 2});
    
    var placemarkColors = [
            '#FF1F1F', '#1F44FF', '#1FFF8E', '#FF1FF5',
            '#FFEF1F', '#FF931F', '#AE6961', '#6193AE'
        ];
    
    function getRandomColor() {
        var color = placemarkColors[Math.round(Math.random() * placemarkColors.length)];
        return color;
    }

    // Ограничение просмотра карты по вертикали
    // Копипаста отсюда: https://yandex.ru/blog/mapsapi/36558/56a9547cb15b79e31e0d08a6
    // проверка передвижения экрана, не пускает выше и ниже карты (там, где уже нет тайлов)
    myMap.action.setCorrection(function (tick) {
        var projection = myMap.options.get('projection');
        var mapSize = myMap.container.getSize();
        var tickCenter = projection.fromGlobalPixels(tick.globalPixelCenter, tick.zoom);
        var top = [tick.globalPixelCenter[0], tick.globalPixelCenter[1] - mapSize[1] / 2];
        var bot = [tick.globalPixelCenter[0], tick.globalPixelCenter[1] + mapSize[1] / 2];
        var tickTop = projection.fromGlobalPixels(top, tick.zoom);
        var tickBot = projection.fromGlobalPixels(bot, tick.zoom);
        if (tickTop[0] > 85) {
            tick.globalPixelCenter = projection.toGlobalPixels(
                [85, tickCenter[1]],
                tick.zoom
            );
            tick.globalPixelCenter = [tick.globalPixelCenter[0], tick.globalPixelCenter[1] + mapSize[1] / 2];
            tick.duration = 0;
        }
        if (tickBot[0] < -85) {
            tick.globalPixelCenter = projection.toGlobalPixels(
                [-85, tickCenter[1]],
                tick.zoom
            );
            tick.globalPixelCenter = [tick.globalPixelCenter[0], tick.globalPixelCenter[1] - mapSize[1] / 2];
            tick.duration = 0;
        }
        return tick;
    });

    //Список с категориями. На карте.
    var item_military_conflict = new ymaps.control.ListBoxItem(
                {
                    data: {
                        type: 'military_conflict',
                        content: 'military_conflict',
                        select: true,
                    },
                }
            );
    var item_building = new ymaps.control.ListBoxItem(
                {
                    data: {
                        type: 'building',
                        content: 'building',
                        select: true,
                    },
                }
            );
    var category_list = new ymaps.control.ListBox({
        data: {
            content: 'Категории'
        },
        items: [
            item_military_conflict,
			item_building,
        ]
    });
    item_military_conflict.select();
	item_building.select();
    myMap.controls.add(category_list);
    '<p><input type="text" maxlength="25" size="20"></p>'
    $jq('#log').toggle();

    var open_by_id;
    create_countries = function(finish_callback) {
        var url = BaseURL + '/countries' + '?year_from=' + year_from + '&year_to=' + year_to + '&counter=true';
        console.log('create_countries -- ' + url);
        $jq.ajax({
            url: url,
            dataType: 'json',
        }).done(
            function(data){
                console.log('create_countries -- data from ' + url + ' loaded');
                var country_list = [];
                for (var country in data){
                    country_list.push({id: data[country][1], text:data[country][0] +' '+ data[country][1]})
                }
                $("select.countries").select2('destroy').empty().select2({
                    data: country_list
                });
                $('#country-selector select').val(chosen).trigger("change");
                if (finish_callback) {
                    console.log('Run create countries callback');
                    finish_callback();
                }
            }
        )
    }
    $("select.countries").select2();
    create_countries();

    set_placemark_content = function(placemark, data) {
        var link_html = '<a href="' + data['url'] + '" target="_blank">см. Википедию</a>';
        var information = "<b>" + data["title"] + "</b><br><br>" + "<i>Information:</i> " + data["comment"] + "<br>" + "<i>Sides:</i>" + data["data"]["sides"] + "<br>" + "<i>Date:</i>" + " from " + data["period"]["from_date"]["day"] + "." + data["period"]["from_date"]["month"] + "." + data["period"]["from_date"]["year"] + " to " + data["period"]["to_date"]["day"] + "." + data["period"]["to_date"]["month"] + "." + data["period"]["to_date"]["year"] + "<br>" + "<i>Ref:</i> " + link_html;
        placemark.properties.set('full_info_loaded', true);
        placemark.properties.set('hintContent', data["title"]);
        placemark.properties.set('balloonContentBody', information);
        placemark.properties.set('balloonContentHeader', data["title"] );
    }

    //Начинка. Формирование запроса.
    create_request = function(url
    
    
    ) {
        console.log('create_request -- ' + url);
        $jq.ajax({
            url: url,
            dataType: 'json',
        }).done(
            function(data) {
                console.log('create request -- data from ' + url + ' loaded');
                myGeoObjects = [];
                for (var i in data){
                    // Add placemark
                    fn = function(j){
                        myGeoObjects[j] = new ymaps.Placemark([data[j]["coord"]["lat"], data[j]["coord"]["lng"]], {
                            hintContent: data[j]["coord"]["comment"],
                            ID: data[j]["eventId"]
                        },{
                            iconColor: types_colors[data[j]["type"]],
                            openBalloonOnClick: true,
                        });
						// console.log(data[j]["type"]);
                    };
                    fn(i);
                    // myMap.geoObjects.add(myPlacemark)
                };


                //Кластеризация.
                //clusterer.options.set('geoObjectOpenBalloonOnClick', true)
                var clusterer = new ymaps.Clusterer({
                    clusterIconLayout: 'default#pieChart',
                    clusterIconPieChartRadius: 30,
                    // Радиус центральной части макета.
                    clusterIconPieChartCoreRadius: 20,
                    // Ширина линий-разделителей секторов и внешней обводки диаграммы.
                    clusterIconPieChartStrokeWidth: 2,
                    gridSize: 64,
                    hasBalloon: true,
                    margin: 10,
                    showInAlphabeticalOrder: true,
                    zoomMargin: 0,
                    clusterDisableClickZoom: true,
                });
                clusterer.add(myGeoObjects);
                myMap.geoObjects.add(clusterer);
                // Load info on click to a cluster
                clusterer.events.add('click', function(event) {
                    console.log('create_request, cluster click triggered');
                    console.log('clicked_type ' + event.get('target').options.get('id'));
                    var placemark_ids_to_load = [];
                    var placemark_by_id = {};
                    var cluster_placemarks;
                    if ((event.get('target')) instanceof ymaps.Placemark == false) {
                        cluster_placemarks = event.get('target').getGeoObjects();
                    } else {
                        cluster_placemarks = [event.get('target')];
                    }

                    for (var placemark_index in cluster_placemarks) {
                        var placemark = cluster_placemarks[placemark_index];
                        var placemark_id = placemark.properties.get('ID');
                        placemark_by_id[placemark_id] = placemark;
                        if (! placemark.properties.get('full_info_loaded')) {
                          placemark_ids_to_load.push(placemark_id);
                        }
                    }

                    if (placemark_ids_to_load.length > 0) {
                        var cluster_url = BaseURL + "/by_id?id=" + placemark_ids_to_load.join(',');
                        console.log('create_request, cluster click -- ' + cluster_url);
                        $jq.ajax({
                            url: cluster_url,
                            dataType: 'json',
                        }).done(
                            function(data) {
                                console.log('create_request, cluster click -- data from ' + cluster_url + ' loaded');
                                for (var j in data){
                                    var eventId = data[j]['eventId'];
                                    set_placemark_content(placemark_by_id[eventId], data[j])
                                }
                            }
                        );
                        //Балун метки может загрузиться только с информацией, если её нет во время клика, надо вызывать балун отдельно.
                        if ((event.get('target')) instanceof ymaps.Placemark == true){
                            console.log('create_request, singular placemark forced to open');
                            var geoObject = event.get('target'),
                            position = event.get('globalPixels'),
                            balloon = geoObject.balloon.open(position);
                        }
                    }

                });
            }
        );
    }

    category_list.events.add('click', function (e) {
        console.log('Category selector clicked');
        var item = e.get('target');
        if (item.data.get('type') !== undefined) {
            if (item.isSelected()) { // unselect category
                types.splice(find(types, item.data.get('type')), 1);
                console.log('Category selector -- event removal ' + types);
                    myMap.geoObjects.removeAll();
                create_request(get_events_url(year_from, year_to, types, countries, priority));
            } else {
                myMap.geoObjects.removeAll();
                types.push(item.data.get('type'));
                console.log('Category selector -- request for events');
                create_request(get_events_url(year_from, year_to, types, countries, priority));
            }
        }
    });

    console.log('Request for events on initial page load');
    create_request(get_events_url(year_from, year_to, types, [], priority));
    
}

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
        PIC_WIDTH = 10000, //7473,
        PIC_HEIGHT = 6000;//5523;

    /**
     * Конструктор, создающий собственный слой.
     */
    var Layer = function () {
        var layer = new ymaps.Layer(TILES_PATH + '/%z/tile-%x-%y.jpg', {
            // Если есть необходимость показать собственное изображение в местах неподгрузившихся тайлов,
            // раскомментируйте эту строчку и укажите ссылку на изображение.
            // notFoundTile: 'url'
        });
        // Указываем доступный диапазон масштабов для данного слоя.
        layer.getZoomRange = function () {
            return ymaps.vow.resolve([-100, 100]);
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
    var worldSize = Math.pow(2, MAX_ZOOM) * 256,
        /**
         * Создаем карту, указав свой новый тип карты.
         */
        map = new ymaps.Map('map', {
            center: [0, 0],
            zoom: -10,
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


}

$(function(){
    $(".js-example-basic-multiple").select2();
    ymaps.ready(init);
});
