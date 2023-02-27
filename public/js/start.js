'use strict';

//const vConsole = new VConsole();
//const remoteConsole = new RemoteConsole("http://[remote server]/logio-post");
//window.datgui = new dat.GUI();

let map;

var vue_options = {
    el: "#top",
    mixins: [mixins_bootstrap],
    store: vue_store,
    data: {
        userId: "",
        rec_list: [],
        gpx_list: [],
        rec_selected: "",
        rec_index: -1,
        rec_loaded: false,
        gpx_current: null,
        userinfo: null,
    },
    computed: {
    },
    methods: {
        yamareco_load: async function(){
            this.progress_open();
            try{
                this.rec_list = await do_post("/yamareco-get-list", { userId: this.userId });
                console.log(this.rec_list);

                this.userinfo = await do_post("/yamareco-get-user", { userId: this.userId });
                console.log(this.userinfo);

                map = L.map('mapcontainer', {
                    zoomControl: true,
                });
                map.setView([35.40, 136], 5);
                L.control.scale({
                    imperial: false
                }).addTo(map);
                L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', {
                    attribution: "<a href='https://maps.gsi.go.jp/development/ichiran.html' target='_blank' rel='noopener noreferrer'>地理院タイル</a>"
                }).addTo(map);

                for( let i = 0 ; i < this.rec_list.length ; i++ ){
                    let item = this.rec_list[i];

                    if( item.is_track != "1" )
                        continue;
                    
                    this.gpx_list[i] = await new Promise((resolve, reject) =>{
                        const recId = item.rec_id;
                        const gpx_url = "/yamareco-get-gpx?recId=" + recId;
                        new L.GPX(gpx_url, {
                            async: true,
                            marker_options: {
                                startIconUrl: 'img/pin-icon-start.png',
                                endIconUrl: 'img/pin-icon-end.png',
                                shadowUrl: 'img/pin-shadow.png'
                            },
                            polyline_options: {
                                color: 'blue',
                                opacity: 0.75,
                                weight: 5,
                                lineCap: 'round'
                            }
                        }).on('loaded', (e) => {
    //                        map.fitBounds(e.target.getBounds());
                            resolve(e.target);
                        }).on('error', (e) => {
                            reject(e);
                        }).on('addpoint', (e) => {
                            e.point.bindTooltip(" <h3>(" + (i + 1) + ") " + item.place + "</h3> ");
                        }).addTo(map);
                    });
                }
                this.rec_loaded = true;
            }catch(error){
                console.error(error);
                alert(error);
            }finally{
                this.progress_close();
            }
        },
        yamareco_select: function(rec_id){
            this.rec_index = this.rec_list.findIndex(item => item.rec_id == rec_id );
            if( this.rec_index >= 0 && this.rec_list[this.rec_index].is_track == '1' ){
                map.fitBounds(this.gpx_list[this.rec_index].getBounds());
                this.gpx_current = this.gpx_list[this.rec_index];
            }
        },
    },
    created: function(){
    },
    mounted: function(){
        proc_load();
    }
};
vue_add_data(vue_options, { progress_title: '' }); // for progress-dialog
vue_add_global_components(components_bootstrap);
vue_add_global_components(components_utils);

/* add additional components */
  
window.vue = new Vue( vue_options );

function do_get(url, qs) {
    var params = new URLSearchParams(qs);
  
    var params_str = params.toString();
    var postfix = (params_str == "") ? "" : ((url.indexOf('?') >= 0) ? ('&' + params_str) : ('?' + params_str));
    return fetch(url + postfix, {
        method: 'GET',
      })
      .then((response) => {
        if (!response.ok)
          throw new Error('status is not 200');
        return response.text();
      });
  }