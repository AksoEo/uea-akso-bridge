if (!window.define) {
    // AMD define
    var ownSrc = document.currentScript.getAttribute('src');
    var srcDir = ownSrc.split('/');
    srcDir.pop();
    srcDir = srcDir.join('/');

    var modules = {};

    var loadAsScript = function loadAsScript(id) {
        return new Promise(resolve => {
            var script = document.createElement('script');
            script.src = srcDir + '/' + id + '.js';
            script.dataset.id = id;
            script.onload = resolve;
            document.head.appendChild(script);
        });
    };

    var modLoad = function modLoad(id) {
        if (modules[id]) return Promise.resolve(modules[id]);
        return loadAsScript(id).then(function() {
            if (!modules[id]) throw new Error('Failed to load ' + id + ': no module defined?');
            return modules[id];
        });
    };

    var modLoadAll = function modLoadAll(ids) {
        var result = [];
        for (const id of ids) {
            result.push(modLoad(id));
        }
        return Promise.all(result);
    };

    var require = function require(ids, cb) {
        modLoadAll(ids).then(mods => {
            if (mods.length === 1) cb(mods[0]);
            else cb(mods);
        });
    };

    window.define = function(reqs, run) {
        var id = document.currentScript.dataset.id;
        if (modules[id]) return;
        var exports = {};
        modules[id] = Promise.resolve().then(function() {
            var toLoad = [];
            for (var i = 0; i < reqs.length; i++) {
                var id = reqs[i];
                if (id === 'require') toLoad.push(Promise.resolve(require));
                else if (id === 'exports') toLoad.push(Promise.resolve(exports));
                else toLoad.push(modLoad(id));
            }
            return Promise.all(toLoad);
        }).then(function(loaded) {
            var result = run.apply(window, loaded);
            if (!exports.default) exports.default = result;
            return exports;
        });
    };
}
define(['exports', './index'], function (exports, index) { 'use strict';

  var countriesList = {"ad":"Andoro","ae":"Un. Arabaj Emirlandoj","af":"Afganio","ag":"Antigvo kaj Barbudo","ai":"Angvilo (Brit.)","al":"Albanio","am":"Armenio","ao":"Angolo","ar":"Argentino","at":"Aŭstrio","au":"Aŭstralio","aw":"Arubo (NL)","az":"Azerbajĝano","ba":"Bosnio-Hercegovino","bb":"Barbado","bd":"Bangladeŝo","be":"Belgio","bf":"Burkina-Faso","bg":"Bulgario","bh":"Barejno","bi":"Burundo","bj":"Benino","bm":"Bermudo","bn":"Brunejo","bo":"Bolivio","br":"Brazilo","bs":"Bahamoj","bt":"Butano","bw":"Bocvano","by":"Belarusio","bz":"Belizo","ca":"Kanado","cd":"Kongo, DR","cf":"Centr-Afrika Resp.","cg":"Kongo, PR","ch":"Svislando","ci":"Ebur-Bordo","ck":"Kukinsuloj","cl":"Ĉilio","cm":"Kameruno","cn":"Ĉinio","co":"Kolombio","cr":"Kostariko","cu":"Kubo","cv":"Kaboverdo","cw":"Kuracao (NL)","cy":"Kipro","cz":"Ĉeĥio","de":"Germanio","dj":"Ĝibutio","dk":"Danio","dm":"Dominiko","do":"Dominika Resp.","dz":"Alĝerio","ec":"Ekvadoro","ee":"Estonio","eg":"Egiptio","er":"Eritreo","es":"Hispanio","et":"Etiopio","fi":"Finnlando","fj":"Fiĝioj","fm":"Mikronezio","fr":"Francio","ga":"Gabono","gb":"Britio","gd":"Grenado","ge":"Kartvelio","gh":"Ganao","gi":"Ĝibraltaro (Brit.)","gl":"Gronlando (Dan.)","gm":"Gambio","gn":"Gvineo","gp":"Gvadelupo","gq":"Ekvatora Gvineo","gr":"Grekio","gt":"Gvatemalo","gw":"Gvineo-Bisaŭo","gy":"Gvajano","hk":"Honkongo (Ĉin.)","hn":"Honduro","hr":"Kroatio","ht":"Haitio","hu":"Hungario","id":"Indonezio","ie":"Irlando","il":"Israelo","in":"Hinda Unio (Barato)","iq":"Irako","ir":"Irano","is":"Islando","it":"Italio","jm":"Jamajko","jo":"Jordanio","jp":"Japanio","ke":"Kenjo","kg":"Kirgizio","kh":"Kamboĝo","ki":"Kiribato","km":"Komoroj","kn":"Sankta Kristoforo kaj Neviso","kp":"Korea Popola DR","kr":"Korea Resp.","kw":"Kuvajto","ky":"Kajmana Insularo (Brit.)","kz":"Kazaĥio","la":"Laoso","lb":"Libano","lc":"Sankta Lucio","li":"Liĥtenŝtejno","lk":"Srilanko","lr":"Liberio","ls":"Lesoto","lt":"Litovio","lu":"Luksemburgo","lv":"Latvio","ly":"Libio","ma":"Maroko","mc":"Monako","md":"Moldavio","me":"Montenegro","mg":"Madagaskaro","mh":"Marŝaloj","mk":"Nord-Makedonio","ml":"Malio","mm":"Birmo","mn":"Mongolio","mo":"Makao (Ĉin.)","mq":"Martiniko","mr":"Maŭritanio","ms":"Moncerato (Brit.)","mt":"Malto","mu":"Maŭricio","mv":"Maldivoj","mw":"Malavio","mx":"Meksiko","my":"Malajzio","mz":"Mozambiko","na":"Namibio","nc":"Nov-Kaledonio (Fr.)","ne":"Niĝero","ng":"Niĝerio","ni":"Nikaragvo","nl":"Nederlando","no":"Norvegio","np":"Nepalo","nr":"Nauro","nz":"Nov-Zelando","om":"Omano","pa":"Panamo","pe":"Peruo","pf":"Franca Polinezio (Fr.)","pg":"Papuo-Nov-Gvineo","ph":"Filipinoj","pk":"Pakistano","pl":"Pollando","pr":"Portoriko","ps":"Palestino","pt":"Portugalio","pw":"Palaŭo","py":"Paragvajo","qa":"Kataro","re":"Reunio (Fr.)","ro":"Rumanio","rs":"Serbio","ru":"Rusio","rw":"Ruando","sa":"Sauda Arabio","sb":"Salomonoj","sc":"Sejŝeloj","sd":"Sudano","se":"Svedio","sg":"Singapuro","si":"Slovenio","sk":"Slovakio","sl":"Sieraleono","sm":"San-Marino","sn":"Senegalo","so":"Somalio","sr":"Surinamo","ss":"Sud-Sudano","st":"Santomeo kaj Principeo","sv":"Salvadoro","sy":"Sirio","sz":"Svazilando","tc":"Turkoj kaj Kajkoj (Brit.)","td":"Ĉado","tg":"Togolando","th":"Tajlando","tj":"Taĝikio","tl":"Orienta Timoro","tm":"Turkmenio","tn":"Tunizio","to":"Tongo","tr":"Turkio","tt":"Trinidado kaj Tobago","tv":"Tuvalo","tw":"Tajvano","tz":"Tanzanio","ua":"Ukrainio","ug":"Ugando","us":"Usono","uy":"Urugvajo","uz":"Uzbekio","va":"Vatikano","vc":"Sankta Vincento kaj Grenadinoj","ve":"Venezuelo","vn":"Vjetnamio","vu":"Vanuatuo","ws":"Samoo","ye":"Jemeno","za":"Sud-Afriko","zm":"Zambio","zw":"Zimbabvo"};

  //! DO NOT LOAD DIRECTLY from main chunk

  index.stdlibExt.getCountryName = function (name) {
    return countriesList[name] || null;
  }; /// Overrides getCountryName. Should return a country name for a given lowercase ISO 639-1 code, and
  /// must return null otherwise.


  function setGetCountryName(f) {
    index.stdlibExt.getCountryName = f;
  }

  exports.setGetCountryName = setGetCountryName;

});
