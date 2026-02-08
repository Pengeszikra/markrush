tehetetlenelek@proton.me"use strict"; // GravitonZone TCG - CCG card game by Vivo Peter :: nullpoint studio (c) 2015

function GravitonZoneCCG(window, document) {

  const VERSION = 'gravitonzone v: 0.0621.107'; console.log(VERSION)

  const GZ = this

  const isDevServer = true
  const EXTRAINFO = false
  const GSPEED = 1
  const isUNDER = false
  const PLAY_HELP = true
  var SCENEW_FORCE = false

  // font setup 

  const FONT_FACE = ['Qlassik', 'Kenyan'][1] // global font face 
  const FontFace = (size, fontName) => size + 'px ' + (fontName ? fontName : FONT_FACE)
  const BLINE = { MIDDLE: 'middle', HANGING: 'hanging' }
  // var STYLE_CARD_NAME =  // Qlassik
  const STYLE_CARD_NAME = { font: FontFace(20), fill: 'white', lineHeight: 40, sharp: 4, textBaseline: BLINE.MIDDLE } // a middle lesz a megoldás KIHAL!
  const STYLE_F28 = { font: FontFace(28), fill: 'white', lineHeight: 50, fancy: true } // itt még nem működik a sharp 	
  const STYLE_F28_RED = { font: FontFace(28), fill: '#479DF1', lineHeight: 50 } // itt még nem működik a sharp 
  const STYLE_F54 = { font: FontFace(54), fill: 'white', lineHeight: 70 } // hiába állítom a letörést, le van vágva a font teteje 
  const STYLE_F54_LIB = { font: FontFace(54), fill: 'white', lineHeight: 70, textBaseline: BLINE.MIDDLE }
  const STYLE_CARD_DESCRIPT = { font: FontFace(18, 'Qlassik'), fill: 'white', lineHeight: 22, wordWrap: true, wordWrapWidth: 210, sharp: 4 }
  const STYLE_INPLAY_DESCRIPT = { font: FontFace(18, 'Qlassik'), fill: 'white', lineHeight: 22, wordWrap: true, wordWrapWidth: 170, sharp: 4 }
  const STYLE_F36_LIBRARY = { font: FontFace(36), fill: 'white', lineHeight: 60, wordWrap: true, wordWrapWidth: 500, textBaseline: BLINE.MIDDLE } // hanging
  const STYLE_F28_LIBRARY = { font: FontFace(28), fill: 'white', lineHeight: 40, wordWrap: true, wordWrapWidth: 500, textBaseline: BLINE.MIDDLE } // hanging
  const STYLE_F28_MISSION = { font: FontFace(28), fill: 'white', lineHeight: 40, wordWrap: true, wordWrapWidth: 650, textBaseline: BLINE.MIDDLE } // hanging
  const STYLE_F48 = { font: FontFace(48), fill: 'white', lineHeight: 70, textBaseline: BLINE.MIDDLE } // hanging
  const STYLE_F28_ILINE = { font: FontFace(28), fill: 'white', lineHeight: 50, wordWarp: false, textBaseline: BLINE.MIDDLE, width: 1200, maxLines: 1 }
  const STYLE_F28_INPUT = { font: FontFace(28), fill: 'white', lineHeight: 50, wordWarp: false, width: 250, textBaseline: BLINE.MIDDLE, maxLines: 1, fancy: true }
  const STYLE_F28_400 = { font: FontFace(28), fill: 'white', lineHeight: 50, wordWarp: false, textBaseline: BLINE.MIDDLE, width: 400, maxLines: 1 }

  // http://www.w3schools.com/tags/playcanvas.asp?filename=playcanvas_textbaseline&preval=middle
  // font converter https://onlinefontconverter.com/

  var _isLog_ = false // console.log 

  // 身 - body - unique id maker - parseInt('AAAA',32)
  var _432_ = {}; function UID() { do { var uid = (327680 + Math.floor(Math.random() * 720895)).toString(32).toUpperCase() } while (_432_[uid]); _432_[uid] = uid; return uid }
  var _532_ = {}; function U5D() { do { var uid = (parseInt('A0000', 32) + Math.floor(Math.random() * parseInt('L0000', 32))).toString(32).toUpperCase() } while (_532_[uid]); _532_[uid] = uid; return uid }
  // size test new Set( Object.keys(_532_) ).size

  const SHUFFLE = (a, b) => Math.random() - .5
  // Array(35).fill(1).map((e,i)=>Math.PI.toString(i+2)).join('').toUpperCase().replace(/\./g,'')  http://s.codepen.io/Omrega/debug/eJzmqp

  const BRIGHTNESS = (light) => {
    let matrix = [
      1, 0, 0, light, 0,
      0, 1, 0, light, 0,
      0, 0, 1, light, 0
    ]
    let filter = new PIXI.filters.ColorMatrixFilter()
    filter.matrix = matrix
    return filter
  }

  const pixiBOX = (w, h, col, x, y) => new PIXI.Graphics().beginFill(col).drawRect(x || 0, y || 0, w, h).endFill()

  // ------------------- [ communication with SERVER ]

  var server = new WebSocket(isDevServer ? "ws://95.140.35.51:7442/" : "ws://95.140.35.51:7342/")

  server.onmessage = function(data, flags) {
    // console.timeEnd('server')

    if (data.data.slice(0, 2) == '{"') {
      try {

        var msg = JSON.parse(data.data)
        // console.log( msg )
        handleMessage(msg)

      } catch (err) { }
    } else { console.log(data.data) }

  }

  server.onclose = function() { console.log("server :: onclose") }

  server.onerror = function() { console.log("server :: onerror"); server = false }

  server.onopen = function() { console.log("server :: onopen") }

  server.answer = function(msg) { // atob , btoa 	
    try {
      if (msg instanceof Object) { server.send(JSON.stringify(msg)) }
      else if (msg instanceof String) { server.send(msg) }
    } catch (err) { console.error(err) }
  }

  function backdoor(prog) {
    let order = 'code'
    server.answer({ order, prog })

    /// console.dir(document) -- KIHAL -- vegyesen lehet az ACE-ből a konzolra és a szerverre is dolgozni, kicsit még fejleszteni kell tovább és akkor atom lesz. 
    //--  váltás konzolra
    //++  vissza szerverre

    prog.split(CR).filter(l => l.slice(0, 3) == '///').forEach(ll => log = eval(ll.slice(3)))
  }
  // rich text editor ::  http://codepen.io/tinymce/pen/YydQrY
  // ace example http://codepen.io/Reklino/pen/yyBvoG  
  // - a fenti példában van egy átlátszó 3D threejs canvas ami szintén fontos lehet !!
  // http://codepen.io/anon/pen/OMLEgv

  /* // -----------------------[ database ]---------------------

Client.find({},

 (r,d)=>ws.answer( d.map( e=>e.name ).join('|')  )

)

// KIHAL - ezzel tutin lehet majd kezelni a szervert 
// és tesztelni az adatbázist a programon belűlről,
// sőt más lehetőségeket is feldob egy ilyen jól 
// manipulálható editor 

// massive space monsters 
https://www.youtube.com/watch?v=JcD6Ia6o78I

*/

  // simple log 
  Object.defineProperty(window, 'log', { set: p => console.log(p), get: () => 'log = ...' })
  // KIHAL - sokkal egyszerubb hasznalni 
  // for(u of zone.skWalk(skeleton.main)) log = u.keydot

  /*
Object.defineProperty( window , 'eff' , { get:function(){ 
  var estyle = document.getElementById('effect').style
  estyle.display = estyle.display == 'block' ? '' : 'block'
}})
*/

  // Object.defineProperty( window , 'send' , { get:function(){ var s = prompt('chat') ; console.time('server'); server.send(s); return s } }  )

  // debug function time in F12 >> T; something() ;TT
  Object.defineProperty(window, 'T', { get: function() { console.time(':') } }); Object.defineProperty(window, 'TT', { get: function() { console.timeEnd(':') } })

  // ES5 get | set   -- z.z = send 
  //var z = {  } ; Object.defineProperty( z , 'z' , { get:function(){ var s = prompt('chat') ; console.time('server'); server.send(s); return s } }  )

  // Object.defineProperty( window , 'jep' , { get:function(){ server.send(UID()); return '---' } }  )

  // window.onmousedown = function(e){  server.send(UID()) }
  // window.onmousedown = continueGameplay

  // ------------------------------------------[ Database ] --------------------------------------

  var group = { order: "order", chaos: "chaos", combat: "combat", techno: "techno", nature: "nature", mystic: "mystic" }
  var _B_ = "B", _H_ = "H", _C_ = "C", _R_ = "R"
  var rare = { COM: { name: "common", chanche: 1 }, UC: { name: "uncommon", chanche: 0.2 }, RARE: { name: "rare", chanche: 0.06 }, LEG: { name: "legendary", chanche: 0.006 }, FIX: { name: "fix", chanche: 1 }, EPIC: { name: "epic", chanche: 0.025 } }

  var BOOSTER = {
    basic: "COM:4"
    , normal: "COM|UC|RARE:4"
    , alfa: "COM:2,UC:1,RARE:1"
    , legendary: "COM|UC|RARE:3,RARE|LEG:1"
  }

  /* ---------------------------------- EXO PROJECT profession and attributes 

lehetséges exo nevek: exoconflict , exopaths, exoquadrant, exocontrast, exonauta

 KIHAL winner is :: GRAVITONZONE 

// https://drive.google.com/a/innosenses.com/folderview?id=0B4nRt-veGqGgSE1jc1hPNlhHU00&usp=sharing_eid&ts=562e0d7c

action = [spy,explorer,inspector,hacker, pilot/driver ,soldier,activist,agent,smugler ]
social = [leader,celebrity,plebs,manager,politican,priest,artist,lover,elit,  merchant ]
productivity = [scientist ,  doctor,  engineer,  media,  investor,  robot,  developer,  professor ] 

  Indul a graviton zone szövegeinek beépítése a programba { 2015.12.13 }

  js/gravitonDB , hogy ne keveredjen a match.js-el 

  viszont mos kb. 2 óra alatt át kellene állnom GZDB-re

  + skill => pa 

  - szétesett a kirajzolt iconsor ahogy átírtam a skill-t pa-ra! ( pa-t szerencsére nem használok máshol )

  ha a matrixAI-t meg akarom tartani, akkor az abban szereplő késpességeket kell leosztanom az új pa-ra.

*/

  var pa = { // profs and attriburtes 

    // gravitonZone

    // action 

    agent: { name: "agent", root: "action", descript: "B: Kiüt egy kiválasztott főnököt.", exp: 22, isCast: true, id: "EOAQ", hcrb: "B", itp: [2, 0] },
    spy: { name: "spy", root: "action", descript: "H: Megnézheted az ellenfél kezét és a következő jelenetet.", exp: 12, isCast: true, id: "UT3J", hcrb: "H", itp: [11, 1] },
    explorer: { name: "explorer", root: "action", descript: "B: Felső 3 jelenetet átrendezheti.", exp: 12, isCast: true, id: "BFQ7", hcrb: "B", itp: [5, 0] },
    hacker: { name: "hacker", root: "action", descript: "Megváltoztatja a jelenet elsődleges megoldó kasztját.", exp: 12, isCast: true, id: "HC3H", hcrb: "B", itp: [7, 1] },
    driver: { name: "driver", root: "action", descript: "H: Húz 1 lapot.", exp: 12, isCast: true, id: "SMCC", hcrb: "H", itp: [4, 0] },
    inspector: { name: "inspector", root: "action", descript: "H: célpont lap 2. kasztját helyezi előre.", exp: 22, id: "NJLH", hcrb: "H", itp: [7, 0] },
    pilot: { name: "pilot", root: "action", descript: "H: Vesztett csatából is kézbe menekülhet vissza.", exp: 22, id: "PEPE", hcrb: "H", itp: [10, 0] },
    soldier: { name: "soldier", root: "action", descript: "B: Ellenfél jelenet értéke csökken a ha szinteddel és többi harcosaid számával.", exp: 22, id: "B199", hcrb: "B", itp: [6, 0] },
    activist: { name: "activist", root: "action", descript: "H: Kijátszásakor egy karakter főnök (B) képessége törlődik.", exp: 22, id: "QJ8N", hcrb: "H", itp: [4, 1] },
    smugler: { name: "smugler", root: "action", descript: "C: Kivéd egy direkt támadást.", exp: 22, id: "F4VA", hcrb: "C", itp: [14, 1] },

    //social	

    leader: { name: "leader", root: "order", descript: "B: Az aktuális jelenetet kicserélheted a felső 5 jelenet közl az egyikre.", exp: 12, isCast: true, id: "N5LC", hcrb: "B", itp: [13, 0] },
    plebs: { name: "plebs", root: "chaos", descript: "B: A második kaszt értéke duplán számít.", exp: 12, isCast: true, id: "F495", hcrb: "B", itp: [5, 1] },
    manager: { name: "manager", root: "order", descript: "H: Lerakhatsz még egy karaktert, ha van helyed.", exp: 12, isCast: true, id: "GTJQ", hcrb: "H", itp: [3, 0] },
    politician: { name: "politician", root: "order", descript: "H: Meghatározod ki legyen végleg a döntéshozó.", exp: 12, isCast: true, id: "MDRQ", hcrb: "H", itp: [0, 1] },
    priest: { name: "priest", root: "mystic", descript: "B: 2 szereplőt visszakeverhetsz a paklidba a múltból.", exp: 12, isCast: true, id: "CSN7", hcrb: "B", itp: [8, 1] },
    lover: { name: "lover", root: "nature", descript: "B: Egy ellenkező nemű azonos fajú ellenfél átál hozzád.", exp: 22, isCast: true, id: "TFE2", hcrb: "B", itp: [1, 1] },
    merchant: { name: "merchant", root: "order", descript: "B: Kikereshetsz egy felszerelést a paklidból.", exp: 12, isCast: true, id: "RO88", hcrb: "B", itp: [2, 1] },
    artist: { name: "artist", root: "nature", descript: "H: Felső 5 lap közül egy karaktert kézbevehetsz.", exp: 22, isCast: true, id: "EO4S", hcrb: "H", itp: [6, 1] },
    elite: { name: "elite", root: "social", descript: "", exp: 22, id: "FVB7", hcrb: "B", itp: [13, 1] },
    celebrity: { name: "celebrity", root: "social", descript: "B: Ha egyedül van duplázódnak az értékei.", exp: 22, id: "PGEE", hcrb: "B", itp: [1, 0] },

    //productivity 		

    doctor: { name: "doctor", root: "nature", descript: "B: Végül minden szereplőd a pakli aljára kerül.", exp: 12, isCast: true, id: "AKOK", hcrb: "B", itp: [8, 0] },
    scientist: { name: "scientist", root: "techno", descript: "B: Lokkolhat 1 megoldókasztot a jeleneten.", exp: 12, isCast: true, id: "QF02", hcrb: "B", itp: [0, 0] },
    engineer: { name: "engineer", root: "productivity", descript: "B: Kiválasztott tárgy temetőbe kerül.", exp: 22, id: "M9L2", hcrb: "B", itp: [14, 0] },
    media: { name: "media", root: "productivity", descript: "R: Nincsen főnök fázis.", exp: 22, id: "Q87Q", hcrb: "R", itp: [11, 0] },
    investor: { name: "investor", root: "productivity", descript: "B: Kicserélheted egy kézben tartott lapra - használhatod az L képességét.", exp: 22, id: "C1VD", hcrb: "B", itp: [10, 1] },
    robot: { name: "robot", root: "productivity", descript: "H: Kiválasztott ellenfél eldob lapot", exp: 22, id: "U4U2", hcrb: "H", itp: [12, 1] },
    developer: { name: "developer", root: "productivity", descript: "R: Választott karakter nem lehet célpont", exp: 22, id: "JKFG", hcrb: "R", itp: [9, 1] },
    professor: { name: "professor", root: "productivity", descript: "B: Az ellenfél összes karaktere elveszti az utolsó kasztját", exp: 22, id: "QL3G", hcrb: "B", itp: [12, 0] },
    builder: { name: "builder", root: "techno", descript: "B: 1 megoldó kasztot adhat a jelenethez.", exp: 9, isCast: true, id: "P4EM", hcrb: "B", itp: [9, 0] },

    // extra skill

    instantOrder: { name: "instantOrder", descript: "H: Kijátszásakor egy karakter B képessége azonnal érvényesül.", exp: 9, isCast: false, id: "GUE8", hcrb: "H" },
    lockCast: { name: "lockCast", descript: "H: Az adott jeleneten lockol egy megoldókasztot", exp: 1, isCast: false, id: "TKFE", hcrb: "H" },
    boostDriverAlchemist: { name: "boostDriverAlchemist", descript: "R: Míg játékban van minden driver és alchemist pontértéke duplázódik.", exp: 1, isCast: false, id: "AF87", hcrb: "C" },
    counterLH: { name: "counterLH", descript: "C: Semlegesít egy karakter hand vagy boss képességet", exp: 1, isCast: false, id: "U0QO", hcrb: "C" },
    guardActor: { name: "guardActor", descript: "R: Választott karakter nem lehet direkt támadás célpontja", exp: 1, isCast: false, id: "H44N", hcrb: "R" },
    immuneAgainstActors: { name: "immuneAgainstActors", descript: "R: A Keresztet viselő karakterre csak a tárgyak képességei hatnak", exp: 1, isCast: false, id: "DIVL", hcrb: "R" },
    ruleEscalation: { name: "ruleEscalation", descript: "R: Amig a géppisztoly játékban van minden döntetlen eszkalálással végződik", exp: 1, isCast: false, id: "UF1N", hcrb: "R" },
    supportToDeck: { name: "supportToDeck", descript: "B: Célpont játékos nem főnök karaktere, visszakerül a pakliba", exp: 1, isCast: false, id: "HGCF", hcrb: "B" },
    teamToHand: { name: "teamToHand", descript: "B: Az egész csapatod visszakerül a kézbe tárgyakkal együtt a kör végén", exp: 1, isCast: false, id: "RJV1", hcrb: "B" },
    sceneToTop: { name: "sceneToTop", descript: "H: Egy jelenetet a pakli tetejére tehetsz", exp: 1, isCast: false, id: "P08I", hcrb: "H" },
    discardActor: { name: "discardActor", descript: "H: Eldobat egy random karaktert a célpont kezéből", exp: 1, isCast: false, id: "C9U6", hcrb: "H" },
    loseLastCast: { name: "loseLastCast", descript: "B: Az ellenfél összes karaktere elveszti az utolsó kasztját", exp: 1, isCast: false, id: "RQRI", hcrb: "B" },
    youIsUmpire: { name: "youIsUmpire", descript: "B: A kör végén te leszel a döntéshozó", exp: 1, isCast: false, id: "FA2M", hcrb: "B" },
    shadowUmpire: { name: "shadowUmpire", descript: "R: Döntetlen esetén te mondod meg eszkalációt vagy támogatást választ a döntéshozó", exp: 1, isCast: false, id: "CUEU", hcrb: "R" },
    unCountered: { name: "unCountered", descript: "R: A medált viselő karakter képességei nem Counterelhetőek", exp: 1, isCast: false, id: "JJ4I", hcrb: "R" },
    ruleSupport: { name: "ruleSupport", descript: "R: Amíg az öltöny játékban van, minden döntetlen, támogatással ér véget.", exp: 1, isCast: false, id: "DBEN", hcrb: "R" },
    ruleTechnodown: { name: "ruleTechnodown", descript: "R: Minden egyéb tárgy elveszti a képességét (H, B, R , C)", exp: 1, isCast: false, id: "C9UD", hcrb: "R" },
    woundLeader: { name: "woundLeader", descript: "H: Kijátszásakor egy karakter főnök (B) képessége törlődik.", exp: 1, isCast: false, id: "ULVE", hcrb: "H" },
    foundSomething: { name: "foundSomething", descript: "H: Kikereshetsz két tárgyat a paklidból", exp: 1, isCast: false, id: "R1OD", hcrb: "H" },
    boostScientist: { name: "boostScientist", descript: "R: A kutatók kettővel magasabb szintűek amig lent van", exp: 1, isCast: false, id: "LHRK", hcrb: "R" },
    boostOccultOrPriest: { name: "boostOccultOrPriest", descript: "B: Duplázza az occult VAGY priest karakterek szintjét", exp: 1, isCast: false, id: "Q2MO", hcrb: "B" },
    wreck: { name: "wreck", descript: "H: Egy választott tárgy kikerül a játékból", exp: 1, isCast: false, id: "H5I6", hcrb: "H" },
    boostAll: { name: "boostAll", descript: "R: Minden játékban lévő karaktered plusz egy szintet kap", exp: 1, isCast: false, id: "JE8M", hcrb: "R" },
    ruleSceneImmunity: { name: "ruleSceneImmunity", descript: "R: Amíg a lap játékban van sem az aktív jelenet sem a jelenet pakli nem módosítható", exp: 1, isCast: false, id: "GL5B", hcrb: "R" },
    sceneToBottom: { name: "sceneToBottom", descript: "H: A következő jelenet a deck aljára kerül", exp: 1, isCast: false, id: "FBUJ", hcrb: "H" },
    teamToDeckWithoutItems: { name: "teamToDeckWithoutItems", descript: "B: Csapatodból mindenki visszakerül a pakli aljára tárgyak nélkül a kör végén.", exp: 1, isCast: false, id: "T0LB", hcrb: "B" },
    saveSomeone: { name: "saveSomeone", descript: "H: Visszahoz a kezedbe egy pihenő karaktert.", exp: 1, isCast: false, id: "J2NQ", hcrb: "H" },

    // afs 

    /*
  alchemist:{name:"alchemist",root:"mystic",descript:"H: Kicserélheti egy lap elsődleges kasztját egy másodlagosra.",exp:1,isCast:true,id:"JLMK",hcrb:"H"},
  chosen:{name:"chosen",root:"mystic",descript:"B: Kézben lévő bemutatott lap nem C képességét használhatja.",exp:1,isCast:true,id:"C23L",hcrb:"B"},
  detective:{name:"detective",root:"order",descript:"H: Választott karakter nem lehet főnök.",exp:1,isCast:true,id:"E210",hcrb:"H"},	
  fighter:{name:"fighter",root:"combat",descript:"B: Ellenfél jelenet értéke csökken a fighter szinteddel és többi harcosaid számával.",exp:1,isCast:true,id:"R1JF",hcrb:"B"},
  gangster:{name:"gangster",root:"chaos",descript:"B: A főnökön kívül kiüt valakit.",exp:1,isCast:true,id:"JHBI",hcrb:"B"},
  guardian:{name:"guardian",root:"combateeeeeeee",descript:"C: Kivéd egy direkt támadást.",exp:1,isCast:true,id:"OGDB",hcrb:"C"},
  guru:{name:"guru",root:"mystic",descript:"C: Eldöntheti, hogy egy csapatnak ki legyen a főnöke.",exp:1,isCast:true,id:"EIBV",hcrb:"C"},
  headhunter:{name:"headhunter",root:"combat",descript:"B: Kiüt egy kiválasztott főnököt.",exp:1,isCast:true,id:"U1PL",hcrb:"B"},
  hero:{name:"hero",root:"combat",descript:"C: Kivéd egy nem C képességet.",exp:1,isCast:true,id:"CVI8",hcrb:"C"},
  holy:{name:"holy",root:"mystic",descript:"B: Semlegesít egy organikus szereplő képességét.",exp:1,isCast:true,id:"P0E9",hcrb:"B"},			
  nomad:{name:"nomad",root:"nature",descript:"B: Unlokkolhatja a jelenet lokkolt megoldokasztjait / nomad szint.",exp:1,isCast:true,id:"JQ2E",hcrb:"B"},
  occult:{name:"occult",root:"mystic",descript:"B: Kicseréli az egyik karaktert, tulajdonos kézbentartott lapjára.",exp:1,isCast:true,id:"RAEP",hcrb:"B"},	
  preacher:{name:"preacher",root:"nature",descript:"B: Duplázod a jelentért kapott pontjaidat.",exp:1,isCast:true,id:"RPPP",hcrb:"B"},		
  survivor:{name:"survivor",root:"nature",descript:"B: Vesztett csatából is kézbe menekülhet vissza.",exp:1,isCast:true,id:"NR0H",hcrb:"B"},
  tech:{name:"tech",root:"techno",descript:"B: Kiválasztott tárgy temetőbe kerül.",exp:1,isCast:true,id:"AUU5",hcrb:"B"},
  */

    // planed profs and attributes 

    /*
  alien:{name:"alien",root:"mystic",descript:"B: Kicserélheted egy kézben tartott lapra - használhatod az L képességét.",exp:9,isCast:true,id:"L508",hcrb:"B"},
  assasin:{name:"assasin",root:"combat",descript:"B: Kiüt egy ellenfél lényt.",exp:9,isCast:true,id:"TCV7",hcrb:"B"},
  celeb:{name:"celeb",root:"chaos",descript:"H: célpont lap 2. kasztját helyezi előre.",exp:9,isCast:true,id:"J9ES",hcrb:"H"},
  commando:{name:"commando",root:"combat",descript:"",exp:9,isCast:true,id:"JBIR",hcrb:"B"},
  cyborg:{name:"cyborg",root:"techno",descript:"B: Kézben lévő bemutatott lap 1 kiválasztott képességét használhatja.",exp:9,isCast:true,id:"S53H",hcrb:"B"},
  dictator:{name:"dictator",root:"order",descript:"H: Nincsen főnök fázis.",exp:9,isCast:true,id:"RCED",hcrb:"B"},
  drone:{name:"drone",root:"combat",descript:"Eldobatja egy célpont kezét, aki ugyanannyi lapot húz",exp:9,isCast:true,id:"F4RF",hcrb:"B"},
  evil:{name:"evil",root:"chaos",descript:"B: minden más játékos felálldoz 1 lapot ( nem counterelhető ).",exp:9,isCast:true,id:"D7HL",hcrb:"B"},
  genie:{name:"genie",root:"techno",descript:"B: techno kártyák minden kasztra +1.",exp:9,isCast:true,id:"TUM2",hcrb:"B"},	
  infected:{name:"infected",root:"techno",descript:"H: célpont játékos paklijábol, a pástra tesz egy lapot",exp:9,isCast:true,id:"AGFL",hcrb:"B"},
  jester:{name:"jester",root:"chaos",descript:"",exp:9,isCast:true,id:"IM91",hcrb:"B"},	
  media:{name:"media",root:"chaos",descript:"",exp:9,isCast:true,id:"Q87Q",hcrb:"B"},
  mutant:{name:"mutant",root:"chaos",descript:"",exp:9,isCast:true,id:"CDBN",hcrb:"B"},
  noble:{name:"noble",root:"order",descript:"B: Ha egyedül van duplázódnak az értékei.",exp:9,isCast:true,id:"MU9Q",hcrb:"B"},
  pilot:{name:"pilot",root:"techno",descript:"",exp:9,isCast:true,id:"PEPE",hcrb:"B"},
  refugee:{name:"refugee",root:"nature",descript:"",exp:9,isCast:true,id:"G40T",hcrb:"B"},
  rich:{name:"rich",root:"order",descript:"H: húzol egy lapot ( H: amikor kirakod azonnal érvényesül függetlenül, hogy főnök-e )",exp:9,isCast:true,id:"L6MK",hcrb:"H"},
  robot:{name:"robot",root:"techno",descript:"Kiválasztott ellenfél véletlen szerűen eldob egy lapot.",exp:9,isCast:true,id:"QF8R",hcrb:"B"},
  rouge:{name:"rouge",root:"chaos",descript:"Magához másolhat az ellenfél egyik lapjának 1 kasztját.",exp:9,isCast:true,id:"UGAH",hcrb:"B"},
  xenomorf:{name:"xenomorf",root:"chaos",descript:"",exp:9,isCast:true,id:"F9U1",hcrb:"B"},
  */

  } // skill  //  Object.keys(pa).filter( k => k != pa[k].name ) // key/name check !!

  // skill index 
  var Iskill = {}; for (var s in pa) { Iskill[pa[s].id] = pa[s]; _432_[pa[s].id] = pa[s].id }

  var matrixAI = { // lassan helyette is új kell , de azt inkább valami statisztikai kódból kellene generálni, nem így kézzel , és lehet a [pa.fighter] formát is használni 

    JLMK: { play: 1180, JLMK: 0, C23L: 70, E210: 0, AKOK: 10, SMCC: 0, BFQ7: 15, R1JF: 45, JHBI: 75, OGDB: 45, EIBV: 40, U1PL: 90, CVI8: 80, P0E9: 40, N5LC: 60, GTJQ: 0, RO88: 35, JQ2E: 15, RAEP: 25, F495: 25, MDRQ: 0, RPPP: 50, CSN7: 15, QF02: 10, UT3J: 0, NR0H: 5, AUU5: 70, TKFE: 0, AF87: 30, U0QO: 10, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 5, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 65, tactic: 250 }
    , C23L: { play: 1261, JLMK: 0, C23L: 45, E210: 0, AKOK: 20, SMCC: 0, BFQ7: 9, R1JF: 35, JHBI: 55, OGDB: 15, EIBV: 10, U1PL: 70, CVI8: 20, P0E9: 30, N5LC: 50, GTJQ: 0, RO88: 25, JQ2E: 10, RAEP: 20, F495: 17, MDRQ: 0, RPPP: 25, CSN7: 10, QF02: 5, UT3J: 0, NR0H: 3, AUU5: 30, TKFE: 2, AF87: 14, U0QO: 9, H44N: 2, DIVL: 9, UF1N: 15, HGCF: 21, RJV1: 6, P08I: 2, C9U6: 2, RQRI: 15, FA2M: 8, CUEU: 12, JJ4I: 10, DBEN: 15, C9UD: 12, ULVE: 2, R1OD: 2, LHRK: 2, Q2MO: 5, H5I6: 2, JE8M: 26, GL5B: 12, FBUJ: 2, T0LB: 8, J2NQ: 2, any: 40, tactic: 500 }
    , E210: { play: 666, JLMK: 0, C23L: 60, E210: 0, AKOK: 10, SMCC: 0, BFQ7: 10, R1JF: 55, JHBI: 55, OGDB: 0, EIBV: 0, U1PL: 60, CVI8: 0, P0E9: 40, N5LC: 50, GTJQ: 0, RO88: 25, JQ2E: 5, RAEP: 15, F495: 25, MDRQ: 0, RPPP: 50, CSN7: 5, QF02: 5, UT3J: 0, NR0H: 1, AUU5: 80, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 5, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 10, tactic: 100 }
    , AKOK: { play: 315, JLMK: 0, C23L: 0, E210: 0, AKOK: 0, SMCC: 0, BFQ7: 0, R1JF: 0, JHBI: 30, OGDB: 0, EIBV: 0, U1PL: 30, CVI8: 0, P0E9: 0, N5LC: 0, GTJQ: 0, RO88: 0, JQ2E: 0, RAEP: 0, F495: 0, MDRQ: 0, RPPP: 0, CSN7: 0, QF02: 0, UT3J: 0, NR0H: 0, AUU5: 0, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 5, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 250 }
    , SMCC: { play: 577, JLMK: 10, C23L: 10, E210: 5, AKOK: 5, SMCC: 1, BFQ7: 3, R1JF: 12, JHBI: 20, OGDB: 15, EIBV: 10, U1PL: 25, CVI8: 25, P0E9: 10, N5LC: 15, GTJQ: 1, RO88: 5, JQ2E: 2, RAEP: 4, F495: 5, MDRQ: 2, RPPP: 10, CSN7: 5, QF02: 1, UT3J: 1, NR0H: 1, AUU5: 20, TKFE: 1, AF87: 8, U0QO: 5, H44N: 1, DIVL: 5, UF1N: 9, HGCF: 13, RJV1: 4, P08I: 1, C9U6: 1, RQRI: 9, FA2M: 4, CUEU: 7, JJ4I: 8, DBEN: 9, C9UD: 7, ULVE: 1, R1OD: 1, LHRK: 1, Q2MO: 3, H5I6: 1, JE8M: 16, GL5B: 7, FBUJ: 1, T0LB: 5, J2NQ: 1, any: 25, tactic: 200 }
    , BFQ7: { play: 365, JLMK: 0, C23L: 0, E210: 0, AKOK: 0, SMCC: 0, BFQ7: 0, R1JF: 0, JHBI: 0, OGDB: 0, EIBV: 0, U1PL: 0, CVI8: 0, P0E9: 0, N5LC: 0, GTJQ: 0, RO88: 0, JQ2E: 0, RAEP: 0, F495: 0, MDRQ: 0, RPPP: 0, CSN7: 0, QF02: 0, UT3J: 0, NR0H: 0, AUU5: 0, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 30, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 5, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 30, T0LB: 0, J2NQ: 0, any: 0, tactic: 300 }
    , R1JF: { play: 530, JLMK: 0, C23L: 0, E210: 0, AKOK: 0, SMCC: 0, BFQ7: 0, R1JF: 0, JHBI: 0, OGDB: 0, EIBV: 0, U1PL: 0, CVI8: 0, P0E9: 0, N5LC: 0, GTJQ: 0, RO88: 0, JQ2E: 0, RAEP: 0, F495: 0, MDRQ: 0, RPPP: 0, CSN7: 0, QF02: 0, UT3J: 0, NR0H: 0, AUU5: 0, TKFE: 0, AF87: 10, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 10, DBEN: 0, C9UD: 10, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 500 }
    , JHBI: { play: 1003, JLMK: 10, C23L: 10, E210: 10, AKOK: 10, SMCC: 10, BFQ7: 10, R1JF: 10, JHBI: 10, OGDB: 10, EIBV: 10, U1PL: 10, CVI8: 10, P0E9: 10, N5LC: 10, GTJQ: 10, RO88: 10, JQ2E: 10, RAEP: 10, F495: 10, MDRQ: 10, RPPP: 10, CSN7: 10, QF02: 10, UT3J: 10, NR0H: 10, AUU5: 10, TKFE: 3, AF87: 21, U0QO: 13, H44N: 3, DIVL: 13, UF1N: 23, HGCF: 32, RJV1: 10, P08I: 3, C9U6: 3, RQRI: 22, FA2M: 12, CUEU: 18, JJ4I: 10, DBEN: 23, C9UD: 18, ULVE: 3, R1OD: 3, LHRK: 3, Q2MO: 8, H5I6: 3, JE8M: 40, GL5B: 18, FBUJ: 3, T0LB: 12, J2NQ: 3, any: 70, tactic: 350 }
    , OGDB: { play: 395, JLMK: 0, C23L: 0, E210: 0, AKOK: 0, SMCC: 0, BFQ7: 0, R1JF: 0, JHBI: 90, OGDB: 0, EIBV: 0, U1PL: 90, CVI8: 0, P0E9: 0, N5LC: 0, GTJQ: 0, RO88: 0, JQ2E: 0, RAEP: 0, F495: 0, MDRQ: 0, RPPP: 0, CSN7: 0, QF02: 0, UT3J: 0, NR0H: 0, AUU5: 0, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 5, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 10, tactic: 200 }
    , EIBV: { play: 730, JLMK: 0, C23L: 45, E210: 0, AKOK: 15, SMCC: 0, BFQ7: 7, R1JF: 30, JHBI: 45, OGDB: 0, EIBV: 0, U1PL: 55, CVI8: 0, P0E9: 25, N5LC: 50, GTJQ: 0, RO88: 20, JQ2E: 7, RAEP: 10, F495: 20, MDRQ: 0, RPPP: 35, CSN7: 5, QF02: 5, UT3J: 0, NR0H: 1, AUU5: 70, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 15, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 20, tactic: 250 }
    , U1PL: { play: 1311, JLMK: 12, C23L: 55, E210: 12, AKOK: 12, SMCC: 12, BFQ7: 10, R1JF: 55, JHBI: 40, OGDB: 20, EIBV: 35, U1PL: 70, CVI8: 12, P0E9: 30, N5LC: 50, GTJQ: 12, RO88: 25, JQ2E: 15, RAEP: 25, F495: 25, MDRQ: 12, RPPP: 45, CSN7: 10, QF02: 7, UT3J: 12, NR0H: 5, AUU5: 70, TKFE: 2, AF87: 14, U0QO: 9, H44N: 2, DIVL: 9, UF1N: 15, HGCF: 21, RJV1: 6, P08I: 2, C9U6: 2, RQRI: 15, FA2M: 8, CUEU: 12, JJ4I: 6, DBEN: 15, C9UD: 12, ULVE: 2, R1OD: 2, LHRK: 2, Q2MO: 5, H5I6: 2, JE8M: 26, GL5B: 12, FBUJ: 2, T0LB: 8, J2NQ: 2, any: 60, tactic: 350 }
    , CVI8: { play: 1879, JLMK: 80, C23L: 80, E210: 40, AKOK: 15, SMCC: 5, BFQ7: 5, R1JF: 30, JHBI: 75, OGDB: 0, EIBV: 0, U1PL: 85, CVI8: 0, P0E9: 45, N5LC: 70, GTJQ: 20, RO88: 55, JQ2E: 15, RAEP: 35, F495: 15, MDRQ: 25, RPPP: 50, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 80, TKFE: 20, AF87: 35, U0QO: 0, H44N: 15, DIVL: 20, UF1N: 40, HGCF: 55, RJV1: 0, P08I: 25, C9U6: 35, RQRI: 70, FA2M: 20, CUEU: 30, JJ4I: 5, DBEN: 0, C9UD: 30, ULVE: 30, R1OD: 30, LHRK: 7, Q2MO: 0, H5I6: 45, JE8M: 7, GL5B: 0, FBUJ: 25, T0LB: 0, J2NQ: 55, any: 35, tactic: 400 }
    , P0E9: { play: 747, JLMK: 0, C23L: 50, E210: 0, AKOK: 13, SMCC: 0, BFQ7: 6, R1JF: 30, JHBI: 50, OGDB: 40, EIBV: 40, U1PL: 60, CVI8: 0, P0E9: 40, N5LC: 60, GTJQ: 0, RO88: 30, JQ2E: 10, RAEP: 15, F495: 20, MDRQ: 0, RPPP: 40, CSN7: 5, QF02: 5, UT3J: 0, NR0H: 3, AUU5: 75, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 5, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 50, tactic: 100 }
    , N5LC: { play: 1062, JLMK: 35, C23L: 7, E210: 7, AKOK: 7, SMCC: 7, BFQ7: 50, R1JF: 30, JHBI: 7, OGDB: 7, EIBV: 7, U1PL: 7, CVI8: 7, P0E9: 7, N5LC: 50, GTJQ: 7, RO88: 7, JQ2E: 15, RAEP: 7, F495: 25, MDRQ: 7, RPPP: 40, CSN7: 7, QF02: 7, UT3J: 15, NR0H: 7, AUU5: 10, TKFE: 20, AF87: 15, U0QO: 0, H44N: 0, DIVL: 5, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 25, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 5, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 18, GL5B: 0, FBUJ: 15, T0LB: 0, J2NQ: 0, any: 20, tactic: 550 }
    , GTJQ: { play: 660, JLMK: 10, C23L: 10, E210: 10, AKOK: 10, SMCC: 10, BFQ7: 10, R1JF: 10, JHBI: 10, OGDB: 10, EIBV: 10, U1PL: 10, CVI8: 10, P0E9: 10, N5LC: 10, GTJQ: 25, RO88: 10, JQ2E: 10, RAEP: 10, F495: 10, MDRQ: 10, RPPP: 10, CSN7: 2, QF02: 2, UT3J: 5, NR0H: 2, AUU5: 10, TKFE: 1, AF87: 10, U0QO: 6, H44N: 1, DIVL: 6, UF1N: 11, HGCF: 16, RJV1: 5, P08I: 1, C9U6: 1, RQRI: 11, FA2M: 6, CUEU: 9, JJ4I: 5, DBEN: 11, C9UD: 9, ULVE: 1, R1OD: 1, LHRK: 1, Q2MO: 4, H5I6: 1, JE8M: 20, GL5B: 9, FBUJ: 1, T0LB: 6, J2NQ: 1, any: 10, tactic: 250 }
    , RO88: { play: 1086, JLMK: 0, C23L: 0, E210: 0, AKOK: 0, SMCC: 0, BFQ7: 0, R1JF: 0, JHBI: 0, OGDB: 0, EIBV: 0, U1PL: 0, CVI8: 50, P0E9: 0, N5LC: 0, GTJQ: 0, RO88: 0, JQ2E: 0, RAEP: 0, F495: 0, MDRQ: 0, RPPP: 0, CSN7: 0, QF02: 0, UT3J: 5, NR0H: 0, AUU5: 40, TKFE: 5, AF87: 31, U0QO: 20, H44N: 5, DIVL: 20, UF1N: 35, HGCF: 48, RJV1: 15, P08I: 5, C9U6: 5, RQRI: 33, FA2M: 18, CUEU: 27, JJ4I: 15, DBEN: 35, C9UD: 27, ULVE: 5, R1OD: 5, LHRK: 5, Q2MO: 12, H5I6: 5, JE8M: 60, GL5B: 27, FBUJ: 5, T0LB: 18, J2NQ: 5, any: 0, tactic: 500 }
    , JQ2E: { play: 407, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 5, U0QO: 0, H44N: 0, DIVL: 2, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 5, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 5, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 5, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 5, tactic: 250 }
    , RAEP: { play: 1213, JLMK: 0, C23L: 45, E210: 0, AKOK: 15, SMCC: 0, BFQ7: 7, R1JF: 30, JHBI: 45, OGDB: 20, EIBV: 30, U1PL: 55, CVI8: 40, P0E9: 25, N5LC: 50, GTJQ: 0, RO88: 25, JQ2E: 10, RAEP: 45, F495: 20, MDRQ: 0, RPPP: 35, CSN7: 5, QF02: 4, UT3J: 0, NR0H: 2, AUU5: 70, TKFE: 0, AF87: 0, U0QO: 20, H44N: 5, DIVL: 20, UF1N: 35, HGCF: 48, RJV1: 15, P08I: 5, C9U6: 5, RQRI: 33, FA2M: 18, CUEU: 27, JJ4I: 15, DBEN: 35, C9UD: 27, ULVE: 5, R1OD: 5, LHRK: 5, Q2MO: 12, H5I6: 5, JE8M: 60, GL5B: 27, FBUJ: 5, T0LB: 18, J2NQ: 5, any: 30, tactic: 150 }
    , F495: { play: 140, JLMK: 0, C23L: 0, E210: 0, AKOK: 0, SMCC: 0, BFQ7: 0, R1JF: 0, JHBI: 0, OGDB: 0, EIBV: 0, U1PL: 0, CVI8: 0, P0E9: 0, N5LC: 0, GTJQ: 0, RO88: 0, JQ2E: 0, RAEP: 20, F495: 0, MDRQ: 0, RPPP: 0, CSN7: 0, QF02: 0, UT3J: 0, NR0H: 0, AUU5: 0, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 10, DBEN: 0, C9UD: 10, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 100 }
    , MDRQ: { play: 444, JLMK: 0, C23L: 10, E210: 0, AKOK: 10, SMCC: 0, BFQ7: 10, R1JF: 10, JHBI: 10, OGDB: 0, EIBV: 0, U1PL: 10, CVI8: 0, P0E9: 10, N5LC: 10, GTJQ: 0, RO88: 10, JQ2E: 10, RAEP: 10, F495: 5, MDRQ: 0, RPPP: 5, CSN7: 2, QF02: 1, UT3J: 0, NR0H: 1, AUU5: 10, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 5, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 5, tactic: 300 }
    , RPPP: { play: 280, JLMK: 0, C23L: 0, E210: 0, AKOK: 0, SMCC: 0, BFQ7: 0, R1JF: 0, JHBI: 0, OGDB: 0, EIBV: 0, U1PL: 0, CVI8: 0, P0E9: 0, N5LC: 0, GTJQ: 0, RO88: 0, JQ2E: 0, RAEP: 10, F495: 0, MDRQ: 0, RPPP: 0, CSN7: 0, QF02: 0, UT3J: 0, NR0H: 0, AUU5: 0, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 10, DBEN: 0, C9UD: 10, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 250 }
    , CSN7: { play: 335, JLMK: 0, C23L: 0, E210: 0, AKOK: 0, SMCC: 0, BFQ7: 0, R1JF: 0, JHBI: 15, OGDB: 0, EIBV: 0, U1PL: 15, CVI8: 0, P0E9: 0, N5LC: 0, GTJQ: 0, RO88: 0, JQ2E: 0, RAEP: 0, F495: 0, MDRQ: 0, RPPP: 0, CSN7: 0, QF02: 0, UT3J: 0, NR0H: 0, AUU5: 0, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 5, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 300 }
    , QF02: { play: 590, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 10, AF87: 15, U0QO: 0, H44N: 0, DIVL: 5, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 15, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 5, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 10, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 400 }
    , UT3J: { play: 405, JLMK: 30, C23L: 0, E210: 40, AKOK: 0, SMCC: 0, BFQ7: 0, R1JF: 0, JHBI: 0, OGDB: 0, EIBV: 0, U1PL: 0, CVI8: 0, P0E9: 0, N5LC: 0, GTJQ: 30, RO88: 0, JQ2E: 0, RAEP: 0, F495: 0, MDRQ: 15, RPPP: 0, CSN7: 0, QF02: 0, UT3J: 15, NR0H: 0, AUU5: 0, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 5, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 8, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 5, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 7, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 250 }
    , NR0H: { play: 155, JLMK: 0, C23L: 0, E210: 0, AKOK: 0, SMCC: 0, BFQ7: 0, R1JF: 0, JHBI: 0, OGDB: 0, EIBV: 0, U1PL: 0, CVI8: 0, P0E9: 0, N5LC: 0, GTJQ: 0, RO88: 0, JQ2E: 0, RAEP: 0, F495: 0, MDRQ: 0, RPPP: 0, CSN7: 0, QF02: 0, UT3J: 0, NR0H: 0, AUU5: 0, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 5, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 150 }
    , AUU5: { play: 1067, JLMK: 0, C23L: 0, E210: 0, AKOK: 0, SMCC: 0, BFQ7: 0, R1JF: 0, JHBI: 0, OGDB: 0, EIBV: 0, U1PL: 0, CVI8: 0, P0E9: 0, N5LC: 0, GTJQ: 0, RO88: 0, JQ2E: 0, RAEP: 0, F495: 0, MDRQ: 0, RPPP: 0, CSN7: 0, QF02: 0, UT3J: 0, NR0H: 0, AUU5: 0, TKFE: 7, AF87: 42, U0QO: 27, H44N: 7, DIVL: 27, UF1N: 47, HGCF: 65, RJV1: 20, P08I: 7, C9U6: 7, RQRI: 45, FA2M: 24, CUEU: 37, JJ4I: 20, DBEN: 47, C9UD: 37, ULVE: 7, R1OD: 7, LHRK: 7, Q2MO: 17, H5I6: 7, JE8M: 80, GL5B: 37, FBUJ: 7, T0LB: 25, J2NQ: 7, any: 0, tactic: 400 }
    , TKFE: { play: 415, JLMK: 10, C23L: 10, E210: 10, AKOK: 10, SMCC: 10, BFQ7: 10, R1JF: 10, JHBI: 10, OGDB: 10, EIBV: 10, U1PL: 10, CVI8: 10, P0E9: 10, N5LC: 10, GTJQ: 10, RO88: 10, JQ2E: 10, RAEP: 10, F495: 10, MDRQ: 10, RPPP: 10, CSN7: 10, QF02: 10, UT3J: 10, NR0H: 10, AUU5: 10, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 5, tactic: 150 }
    , AF87: { play: 170, JLMK: 0, C23L: 5, E210: 5, AKOK: 5, SMCC: 0, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 50 }
    , U0QO: { play: 480, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 350 }
    , H44N: { play: 530, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 80, OGDB: 5, EIBV: 5, U1PL: 80, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 250 }
    , DIVL: { play: 860, JLMK: 70, C23L: 45, E210: 15, AKOK: 5, SMCC: 30, BFQ7: 5, R1JF: 5, JHBI: 75, OGDB: 20, EIBV: 65, U1PL: 65, CVI8: 40, P0E9: 55, N5LC: 25, GTJQ: 15, RO88: 5, JQ2E: 10, RAEP: 70, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 200 }
    , UF1N: { play: 425, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 0, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 300 }
    , HGCF: { play: 1070, JLMK: 25, C23L: 25, E210: 25, AKOK: 25, SMCC: 25, BFQ7: 25, R1JF: 25, JHBI: 25, OGDB: 25, EIBV: 25, U1PL: 25, CVI8: 25, P0E9: 25, N5LC: 25, GTJQ: 25, RO88: 25, JQ2E: 25, RAEP: 25, F495: 25, MDRQ: 25, RPPP: 25, CSN7: 25, QF02: 25, UT3J: 25, NR0H: 25, AUU5: 25, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 70, tactic: 350 }
    , RJV1: { play: 523, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 2, AF87: 9, U0QO: 4, H44N: 1, DIVL: 5, UF1N: 8, HGCF: 12, RJV1: 3, P08I: 5, C9U6: 2, RQRI: 9, FA2M: 4, CUEU: 6, JJ4I: 7, DBEN: 7, C9UD: 8, ULVE: 2, R1OD: 2, LHRK: 1, Q2MO: 2, H5I6: 2, JE8M: 14, GL5B: 5, FBUJ: 3, T0LB: 3, J2NQ: 0, any: 17, tactic: 250 }
    , P08I: { play: 525, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 0, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 0, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 10, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 35, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 15, T0LB: 0, J2NQ: 0, any: 0, tactic: 350 }
    , C9U6: { play: 380, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 250 }
    , RQRI: { play: 664, JLMK: 9, C23L: 9, E210: 9, AKOK: 9, SMCC: 9, BFQ7: 9, R1JF: 9, JHBI: 9, OGDB: 9, EIBV: 9, U1PL: 9, CVI8: 9, P0E9: 9, N5LC: 9, GTJQ: 9, RO88: 9, JQ2E: 9, RAEP: 9, F495: 9, MDRQ: 9, RPPP: 9, CSN7: 9, QF02: 9, UT3J: 9, NR0H: 9, AUU5: 9, TKFE: 0, AF87: 10, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 10, Q2MO: 10, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 400 }
    , FA2M: { play: 425, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 25, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 25, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 250 }
    , CUEU: { play: 490, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 25, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 40, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 300 }
    , JJ4I: { play: 480, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 350 }
    , DBEN: { play: 480, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 0, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 25, CUEU: 30, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: undefined, J2NQ: undefined, any: 0, tactic: 300 }
    , C9UD: { play: 1317, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 15, AF87: 5, U0QO: 35, H44N: 25, DIVL: 20, UF1N: 30, HGCF: 35, RJV1: 25, P08I: 35, C9U6: 20, RQRI: 40, FA2M: 25, CUEU: 30, JJ4I: 35, DBEN: 30, C9UD: 0, ULVE: 35, R1OD: 40, LHRK: 15, Q2MO: 17, H5I6: 35, JE8M: 45, GL5B: 30, FBUJ: 15, T0LB: 10, J2NQ: 40, any: 0, tactic: 500 }
    , ULVE: { play: 989, JLMK: 5, C23L: 55, E210: 5, AKOK: 12, SMCC: 5, BFQ7: 10, R1JF: 55, JHBI: 40, OGDB: 5, EIBV: 5, U1PL: 70, CVI8: 5, P0E9: 30, N5LC: 50, GTJQ: 5, RO88: 25, JQ2E: 15, RAEP: 25, F495: 25, MDRQ: 5, RPPP: 45, CSN7: 10, QF02: 7, UT3J: 5, NR0H: 5, AUU5: 70, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 45, tactic: 350 }
    , R1OD: { play: 1014, JLMK: 20, C23L: 20, E210: 10, AKOK: 3, SMCC: 1, BFQ7: 1, R1JF: 7, JHBI: 18, OGDB: 15, EIBV: 15, U1PL: 21, CVI8: 25, P0E9: 11, N5LC: 17, GTJQ: 5, RO88: 13, JQ2E: 3, RAEP: 8, F495: 3, MDRQ: 6, RPPP: 12, CSN7: 1, QF02: 1, UT3J: 1, NR0H: 1, AUU5: 20, TKFE: 7, AF87: 2, U0QO: 17, H44N: 12, DIVL: 10, UF1N: 15, HGCF: 17, RJV1: 12, P08I: 17, C9U6: 10, RQRI: 20, FA2M: 12, CUEU: 15, JJ4I: 17, DBEN: 15, C9UD: 0, ULVE: 17, R1OD: 20, LHRK: 7, Q2MO: 8, H5I6: 17, JE8M: 22, GL5B: 15, FBUJ: 7, T0LB: 5, J2NQ: 20, any: 20, tactic: 400 }
    , LHRK: { play: 275, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 0, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 150 }
    , Q2MO: { play: 296, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 3, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 3, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 170 }
    , H5I6: { play: 972, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 5, AF87: 5, U0QO: 35, H44N: 25, DIVL: 20, UF1N: 30, HGCF: 35, RJV1: 25, P08I: 5, C9U6: 5, RQRI: 40, FA2M: 25, CUEU: 30, JJ4I: 35, DBEN: 30, C9UD: 0, ULVE: 5, R1OD: 5, LHRK: 15, Q2MO: 17, H5I6: 5, JE8M: 45, GL5B: 30, FBUJ: 5, T0LB: 10, J2NQ: 5, any: 0, tactic: 350 }
    , JE8M: { play: 580, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 450 }
    , GL5B: { play: 575, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 25, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 50, GTJQ: 5, RO88: 5, JQ2E: 15, RAEP: 5, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 15, UT3J: 15, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 35, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 15, T0LB: 0, J2NQ: 0, any: 0, tactic: 300 }
    , FBUJ: { play: 375, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 20, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 20, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 15, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 35, C9U6: 0, RQRI: 0, FA2M: 5, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 15, T0LB: 0, J2NQ: 0, any: 0, tactic: 150 }
    , T0LB: { play: 230, JLMK: 5, C23L: 5, E210: 5, AKOK: 5, SMCC: 5, BFQ7: 5, R1JF: 5, JHBI: 5, OGDB: 5, EIBV: 5, U1PL: 5, CVI8: 5, P0E9: 5, N5LC: 5, GTJQ: 5, RO88: 5, JQ2E: 5, RAEP: 5, F495: 5, MDRQ: 5, RPPP: 5, CSN7: 5, QF02: 5, UT3J: 5, NR0H: 5, AUU5: 5, TKFE: 0, AF87: 0, U0QO: 0, H44N: 0, DIVL: 0, UF1N: 0, HGCF: 0, RJV1: 0, P08I: 0, C9U6: 0, RQRI: 0, FA2M: 0, CUEU: 0, JJ4I: 0, DBEN: 0, C9UD: 0, ULVE: 0, R1OD: 0, LHRK: 0, Q2MO: 0, H5I6: 0, JE8M: 0, GL5B: 0, FBUJ: 0, T0LB: 0, J2NQ: 0, any: 0, tactic: 100 }
    , J2NQ: { play: 802, JLMK: 7, C23L: 19, E210: 5, AKOK: 6, SMCC: 2, BFQ7: 6, R1JF: 15, JHBI: 24, OGDB: 7, EIBV: 7, U1PL: 28, CVI8: 10, P0E9: 12, N5LC: 20, GTJQ: 4, RO88: 11, JQ2E: 5, RAEP: 10, F495: 8, MDRQ: 3, RPPP: 15, CSN7: 3, QF02: 2, UT3J: 3, NR0H: 2, AUU5: 25, TKFE: 2, AF87: 9, U0QO: 4, H44N: 1, DIVL: 5, UF1N: 8, HGCF: 12, RJV1: 3, P08I: 5, C9U6: 2, RQRI: 9, FA2M: 4, CUEU: 6, JJ4I: 7, DBEN: 7, C9UD: 8, ULVE: 2, R1OD: 2, LHRK: 1, Q2MO: 2, H5I6: 2, JE8M: 14, GL5B: 5, FBUJ: 3, T0LB: 3, J2NQ: 0, any: 17, tactic: 400 }

  } // matrixAI  matrixAI[skill.alchemist.id][skill.guardian.id]

  // js neural network -- az AI -nál esetleg még jól jöhet 
  // nagyon szép a "lények" együtt mozgása 
  // http://synaptic.juancazala.com/#/	
  // http://www.tankonyvtar.hu/hu/tartalom/tamop425/0026_neuralis_4_4/adatok.html
  // http://prog.hu/tarsalgo/6156/neuralis-halok

  // Object.keys(matrixAI["C23L"]).length

  // generate roots DB.actors.map(function(){return ',root:"{..1}"'.insert(UID())}).join('\n')

  var DB = {} // afs data removed at 2016.01.18

  // replace afterSingularity data by gravitonZone database 
  var gzdb = gravitonZoneDatabaseInsert(pa)

  // fix scene prof numbers to 5

  gzdb.scenes.filter(s => s.prof.length != 5).forEach(s => { if (s.prof.length < 5) { s.prof.push(pa.politician) } else { s.prof.pop() } })


  //DB.actors = [...DB.actors,...gzdb.actors.sum,...gzdb.actors.alpha,...gzdb.actors.gaian,...gzdb.actors.neutral,...gzdb.actors.w2,...gzdb.actors.w3]
  //DB.items = [...DB.items,...gzdb.items]
  //DB.scenes = [...DB.scenes,...gzdb.scenes] 
  DB.actors = [...gzdb.actors.sum, ...gzdb.actors.alpha, ...gzdb.actors.gaian, ...gzdb.actors.neutral, ...gzdb.actors.w2, ...gzdb.actors.w3]
  DB.items = [...gzdb.items]
  DB.scenes = [...gzdb.scenes]

  // database 2015.07.05 - maded by sublimetext3 - a legelső db 4 PS : 2015.05.18

  // var var storyLine = [ { date:2024, descript: 'Sun-Tech kínai cég nemzetközi piacra lép. Már ekkor lehet tudni, hogy hatalmas támogatásokat kapott a kínai kormánytól.'} .. move to gravitonDB.js 

  // ------------------------------------------[ Globals ] --------------------------------------

  const CR = '\n', I = "|", BR = "<br>", XX = 'px '
  //var player_names = "".split(I)
  String.prototype.insert = function() { for (var s = this, i = 0; i < arguments.length; i++) { s = s.split('{..' + (parseInt(i, 10) + 1) + '}').join(arguments[i]); } return s; };
  String.prototype.temp = function(o) { return this.replace(/\{\.\..*?\}/g, function(m, c) { if (!o) return "?{o}?"; var v = o[m.slice(3, m.length - 1)]; return (v === null || v === undefined) ? "?" + m + "?" : v }) }
  Object.defineProperty(Array.prototype, 'random', { value: function() { return this[~~(Math.random() * this.length)] }, enumerable: false, writable: false, configurable: false })
  // goal = 7;[5,8,15,22].reduce( (prev, curr) => Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev)});
  // jó kérdés, hogy ezeket szabad-e így ?
  Object.defineProperty(Array.prototype, 'near', { value: function(goal) { return this.reduce((prev, curr) => Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev) }, enumerable: false, writable: false, configurable: false })
  Object.defineProperty(Array.prototype, 'last', { get: function() { return this[this.length - 1] }, enumerable: false, configurable: false })
  function dice(n) { n = n || 6; return n instanceof Array ? ~~(Math.random() * n.length) : ~~(Math.random() * n) } // return random number between 0-5 , 0 - n , 0 - n.length
  //function ObjectReverse(o){r={};Object.keys(o).forEach( k => r[o[k]] = k );return r}
  function ObjectReverse(o) { var r = {}; Object.keys(o).forEach(function(k) { r[o[k]] = k }); return r }

  // de komoly ... 
  // function repeat(n,f){ return Array(n+1).join(1).split('').map(f)  }  // ki kellene szedni .. nem túl hasznos 

  //function randomIndexArray(n){ return Array(n+1).join(1).split('').map(function(f,i){return i}).sort(function(a,b){return Math.random()-.5})}
  // itt az ES6 repeat
  function randomIndexArray(n) { return Array.from({ length: n }, (f, i) => i).sort((a, b) => Math.random() - .5) }

  const BASE_AVATAR = "016"

  const ITEM = 'itm'
  const ACTOR = 'act'
  const SCENE = 'ql'
  const SCENEW = 'qlw2'
  const ALLTYPE = [ACTOR, SCENE, ITEM].join(I)

  // var afs_collection //= new Deck()
  const KKK = {} // mutató az alap kártyákra 

  // ------------------------------------------[ Player & Card ] --------------------------------------

  class Card {  // ES6 - KIHAL csak a nevét kellett eltalálni a constructor -nak és már működik is a class 

    constructor(cdata, serial) {
      //this.debug = JSON.stringify( cdata )
      // cdata @ json card data , serial string 

      if (typeof (cdata) === 'string' && KKK[cdata.slice(0, 4)]) { return this.uniqueSetup(cdata) }

      this.source = cdata
      this.type = cdata.type || "unknown"
      this.name = cdata.name || "--?--"
      this.prof = cdata.prof // ?  this.profmaker(cdata.prof) : []
      //this.fids = this.profmaker() // 
      this.profmaker() // remove fids! + but fill this.plvl
      this.width = cdata.width || 1
      this.skill = this.isActor ? cdata.prof[0] : this.isItem ? cdata.skill : false
      this.descript = cdata.descript || '-- who know --'
      this.serial = cdata.serial  // || UID() 		
      this.attach = false
      this.rarity = cdata.rarity
      this.gmid = cdata.gmid || "99"
      this.texture = false

    }

    // instancot csinál extra adatokkal ( skill level ) - tonképpen szar
    profmaker() {
      this.plvl = {}; // tuti érdemes így tárolni a profokat ?
      var self = this
      try {
        this.prof.forEach(function(p, i) { self.plvl[p.id] = self.isBasic ? 1 : +self.serial.slice(9 + i, 10 + i) })
      } catch (err) { log = self }
      // return Object.keys(self.plvl).join(I) // no fids 
    }

    // rework
    clone() {
      //return JSON.parse(JSON.stringify(this))
      var cl = new Card(this.source)
      cl.root = UID()
      return cl
    }

    move(deck1, deck2) {
      // if(  from instanceof Deck &&  from.foundCard( this ) ){
      if (this.attach && this.owner && deck2 != this.owner.play) { this.attach = false }
      try {
        deck1.removeCard(this)
        deck2.insertCard(this)
      } catch (err) { if (_isLog_) { console.log("!----{{..1}}----{..2}".insert(this.name, err)) } }
      //}
    }

    pl(n) { return n >= this.prof.length ? -1 : this.plvl[this.prof[n].id] }

    improve(pid) {
      if (this.plvl[pid]) {
        this.plvl[pid] = this.plvl[pid] < 3 ? this.plvl[pid] + 1 : this.plvl[pid]
      }
    }

    randomImprove() {
      var pid = this.prof.random().id
      var pre = this.plvl[pid]
      this.plvl[pid] = this.plvl[pid] < 3 ? this.plvl[pid] + 1 : this.plvl[pid]
      return pid
    }

    // test H5BC , REP6 - ok
    // afs_collection.filter(SCENE).forEach( function(s){ var a =afs_collection.filter(ACTOR).random(); if(a.score(s)>1){console.log(s.name,s.ser,a.name,a.ser)}} ) 
    score(scene) {
      if (!scene) { return -1 }
      var sum = 0
      var clvl = this.currentProfsLvl
      for (let j in clvl) { sum += scene.plvl[j] ? clvl[j] : 0 }
      return sum
    }

    // TODO :: prof lvl also need to calculate for finish !! 
    profWithItem() {

      var iprof = [].concat(this.prof)
      // KIHAL -  a.concat(b.filter(function(e){ return a.indexOf(e) < 0  }))
      return this.attach && this.attach.isItem ? iprof.concat(this.attach.prof.filter(function(e) { return iprof.indexOf(e) < 0 })) : iprof

    }

    canAttachItem(item) {
      if (!item.isItem) { return false }
      for (let k in this.plvl) { if (item.plvl[k] > 0 && this.plvl[k] > 0) { return true } }
      return false
    }

    // - new unique serial system :: VVVV.BBBBB.88..   V - card standard serial B - unique number .. 8 - skill improvements   - - Cards.byUnique(  ) - ből generálja le a kártyát
    // Object.keys(KKK).random()+U5D() - véletlen kártya definició 

    // kérdés, hogy nem kellen-e a tulajdonosnak is benne lennie a kódban ?
    uniqueSetup(gserial) {
      var basic = gserial.slice(0, 4)
      var unique = gserial.slice(4, 9) || U5D()
      var lvls = gserial.slice(9)

      if (!KKK[basic]) { return console.log("don't found in card DB ::" + gserial) }

      var cdata = KKK[basic].source

      this.source = cdata
      this.type = cdata.type || "unknown"
      this.name = cdata.name || "--?--"
      this.prof = cdata.prof // ?  this.profmaker(cdata.prof) : []

      var pn = this.prof.length
      lvls = lvls || { [ACTOR]: '1000'.slice(0, pn), [ITEM]: '1000'.slice(0, pn), [SCENE]: '111111'.slice(0, pn) }[this.type]
      //lvls = lvls || {'act':'1000'.slice(0,pn),'itm':'1000'.slice(0,pn),'ql':'111111'.slice(0,pn)}[this.type] // ES5
      this.serial = basic + unique + lvls


      //this.fids = 
      this.profmaker() // also fill plvl  
      this.width = cdata.width || 1
      this.skill = this.isActor ? cdata.prof[0] : this.isItem ? cdata.skill : false

      this.attach = false
      this.rarity = cdata.rarity

      this.gmid = cdata.gmid || "99"
      this.texture = false

    }

    get ser() { return this.serial.slice(0, 4) }

    get isBasic() { return !this.serial || this.serial.length == 4 }

    get profLog() { return this.prof.map(p => p.name).join('/') }

    get canCast() { return this.type == SCENE ? false : this.pl(1) > 0 && this.pl(0) > 0 }

    get isScene() { return this.type == SCENE }

    get isItem() { return this.type == ITEM }

    get isActor() { return this.type == ACTOR }

    get whatIsDo() { return this.skill ? this.skill.descript : " - dont have skill - " }

    get currentProfsLvl() {
      if (!this.attach) { return this.plvl }
      var iplvl = Object.assign({}, this.plvl) // clone 
      var self = this
      this.attach.prof.forEach(function(p, i) { if (iplvl[p.id]) { iplvl[p.id] += self.attach.plvl[p.id] } else { iplvl[p.id] = self.attach.plvl[p.id] } })
      return iplvl
    }

    get currentProfs() {
      var iprof = [].concat(this.prof)
      return this.attach && this.attach.isItem ? iprof.concat(this.attach.prof.filter(function(e) { return iprof.indexOf(e) < 0 })) : iprof
    }

    set width(p) { this._width = p || 1 }
    get width() { return this.type == SCENE && SCENEW_FORCE ? SCENEW_FORCE : this._width }

  } // end Card 

  // TODO :: short serial ES5 gets nem lassítják-e le túlságosan a js-t randomFill -el tudnám ellenőrizni .. a szerveren fontos, hogy gyors nodejs fusson - lehet, hogy ott elég a serialokkal dobálózni ?

  class Deck {

    constructor(player, cards) {

      this.owner = player || false   // false means multi owner deck :: scene deck	
      this.cards = []
      if (cards) { this.insertCard(cards) }

    }

    cloneCards(cards) {

      if (cards instanceof Card) { cards = [cards] } // 1 lapbol is tomb lesz


      // clone each card and setup owner - 	
      cards = cards.map(function(c) {
        var cln = c.clone()
        if (this.owner && cln[i].owner == undefined) { cln[i].owner = this.owner }
        return cln
      })

      this.cards = this.cards.concat(cards)

    }

    insertCard(cards) {

      cards = [].concat(cards)  // 1 lapbol is tomb lesz

      // clone each card and setup owner - 	
      cards = cards.map(function(c) {
        //if( this.owner && c[i].owner == undefined ){c[i].owner = this.owner}
        //if( this.owner && !c[i].owner ){c[i].owner = this.owner}  
        // !A strict állandóan kiakad ezen TODO !! 
        return c
      })

      this.cards = this.cards.concat(cards)

    }

    // insertCard (card){ this.deckSetup( card ) }

    removeCard(rcards) {
      rcards = [].concat(rcards)
      for (var i in rcards) {
        var find = this.foundCard(rcards[i])
        if (find >= 0) { this.cards.splice(find, 1) }
      }
    }

    foundCard(card) {
      for (var i = 0; i < this.cards.length; i++) {
        if (this.cards[i] == card) return i
      }
      return false
    }

    filter(f) {
      if (f instanceof Function) {
        return this.cards.filter(f)
      } else {
        try {
          var tre = new RegExp(f), ff = []
          for (var i = 0; i < this.cards.length; i++) { if (this.cards[i].type.match(tre)) { ff.push(this.cards[i]) } }
          return ff
        } catch (err) { return [err] }
      }
    }

    length() { return this.cards.length }

    // get last(){ return this.cards[this.cards.length-1] }
    get last() { return this.cards.last }

    push(card) { if (card instanceof Card) { this.cards.push(card) } }

    shift() { return this.cards.shift() } // if empty return undef 

    randomPick() { return this.cards[~~(this.cards.length * Math.random())] }

    randomFill(n, typeset) {
      typeset = typeset || ALLTYPE
      var set = afs_collection.filter(typeset)
      this.cards = this.cards.concat(Array(n + 1).join(1).split('').map(function(f) { return set[~~(set.length * Math.random())].clone() })) // de csúnya 
    }

    insertFromDB(dbLine) { this.insertCard(new Card(dbLine)) }

    log(typeset) {
      ll = [this.filter(typeset || ALLTYPE).length + " cards"]
      typeset = new RegExp(typeset || ALLTYPE) //"act|itm|ql"
      for (i in this.cards) { if (this.cards[i].type.match(typeset)) { ll.push(this.cards[i].log()) } }
      return ll.join(CR)
    }

    shuffle() { this.cards = this.cards.sort(function(a, b) { return Math.random() - .5 }) }

    size(typeset) {
      var sizes = !typeset ? this.cards.map(function(c) { return c.width }) : this.filter(typeset).map(function(c) { return c.width })
      return sizes.length ? sizes.reduce(function(a, b) { return a + b }) : 0

    }

    pick(index) {
      if (this.cards[index]) { return this.cards[index] }
      for (var i in this.cards) {
        if (this.cards[i].serial == index) { return this.cards[i] }
      }
      return false
    }

    /*
  statistic (){
    var fix = this.filter(function(c){return c.rarity == rare.FIX }).length
    return "\n{..1} in deck card \n\tcommon:\t\t{..2}\n\tuncommon:\t{..3}\n\trare:\t\t{..4}\n\tepic:\t\t{..5}\n\tlegendary:\t{..6} {..7}".insert( ("000000"+this.length()).slice(-4)
      , this.filter(function(c){return c.rarity == rare.COM }).length
      , this.filter(function(c){return c.rarity == rare.UC }).length
      , this.filter(function(c){return c.rarity == rare.RARE }).length
      , this.filter(function(c){return c.rarity == rare.EPIC }).length
      , this.filter(function(c){return c.rarity == rare.LEG }).length			
      , (fix > 0) ?  "\n\tfix:\t\t"+fix+"\n" : "\n"
    ) 
  }
  */

    fillByCode(codes) {
      // codes.map(function(cc){	console.log( KKK[cc].name )	})
      var deck = this
      //codes.map(function(cc){	deck.insertCard(  KKK[cc] ) })
      codes.map(function(cc) { deck.insertCard(new Card(cc)) })
    }

    get serials() { return this.cards.map(c => c.serial) }

  } // end Deck

  // Object.defineProperty(Array.prototype,'shuffle',{value:function(){ this.sort(function(a,b){return Math.random()-.5}); return this },enumerable:false, writable:false, configurable: false } )

  // generate constant all 4 cards collection
  // for (var i = 0; i < DB.scenes.length; i++) { afs_collection.insertFromDB(DB.scenes[i]) }
  // for (var i = 0; i < DB.actors.length; i++) { afs_collection.insertFromDB(DB.actors[i]) }
  // for (var i = 0; i < DB.items.length; i++) { afs_collection.insertFromDB(DB.items[i]) }

  var afs_collection = new Deck()

  for (let cardData of [...DB.scenes, ...DB.actors, ...DB.items]) { afs_collection.insertFromDB(cardData) } // much nicer !

  // set serials for match throught server - - TODO move to better place 

  for (var i in afs_collection.cards) {
    var serial = afs_collection.cards[i].serial
    afs_collection.cards[i].root = serial
    _432_[serial] = serial
    KKK[serial] = afs_collection.cards[i]
  };

  // afs_collection.filter(SCENE).map( s=>s.width=2)

  window.afs_collection = afs_collection


  // { gathering system removed  }


  // --------------------------------------------------[ Player Card Deck Coroutine ]------------------------------------------------

  class Player {

    constructor(name, isAI, avatar, id) {
      this.name = name || 'p' + UID()
      this.isAI = isAI || false
      this.isViewer = false
      this.isOffline = false
      this.avatar = avatar || BASE_AVATAR
      this.id = id || UID()

      this.collection = new Deck()

      // variables for match 
      this.deck = new Deck()  // az aktuális játékos paklija jelenetekkel és mindennel együtt 
      this.hand = new Deck()
      this.rest = new Deck()
      this.play = new Deck()
      this.fly = []
      this.pass = 0
      this.boss = undefined
      this.resultHistory = []
      this.cash = 0
      this.dimensionit = 0
    }

    clear() {
      this.pass = 0
      this.boss = undefined
    }

    workAsPlayer() { this.isAI = false }

    workAsAI() { this.isAI = true }

    draw5() {

      this.clear()
      this.fly = []
      // nincs már kártya a pakliban		

      if (this.deck.length() < 1) { return }

      while (5 - this.hand.size() - this.deck.cards[0].width >= 0) {
        var draw = this.deck.shift()
        this.hand.cards.unshift(draw) // már ott van a hanben, de nem szabad látszania csak be kell animálódinia ... lehet ez lesz a jó megoldás
        this.fly.push(draw)
        if (this.deck.length() < 1) { break; }
      }

      // console.log('draw5',this.hand.length(), this.hand.size())

    }

    // sacrifice card
    unCollectCard(card) { this.collection.removeCard(card) }

    factoryCard(card, improving) { }

    playebleCardInHands() {
      var space = 3 - this.play.size(ACTOR) // kint csak az Actorok számítanak 
      var possibles = this.hand.filter(function(c) { return c.isActor && c.width <= space })
      return possibles
    }

    // rework
    canAttachItem(actor) {
      // return  this.hand.filter(function(itm){return itm.isItem && actor.fids.match(itm.fids) })
      return this.hand.filter(function(itm) { return itm.isItem && actor.canAttachItem(itm) })
    }

    // score of moment -- rework 
    countScore(scene) { // hack - jobb lenne, ha az utolsó pontot mutatná ha már nincs scene 
      // return scene && scene.fids ? this.play.filter( function(card){return scene.fids.match(card.fids)}).length : -1
      var sum = 0
      this.play.filter(ACTOR).forEach(function(a) { sum += a.score(scene) })
      return sum
    }

    turnScore(co, lostWinOrSupport, bonus) {
      var result = { win: 0, support: 0, loose: 0, bonus: bonus }
      if (lostWinOrSupport == co.resultAs.Winner) { result.win = 1 } else if (lostWinOrSupport == co.resultAs.Looser) { result.support = 1 } else { result.loose = 1 }
      this.resultHistory.push(result)
    }

    matchResult() {
      var result = { win: 0, support: 0, loose: 0, score: 0 }
      this.resultHistory.forEach(function(turn) { result.win += turn.win; result.support += turn.support; result.loose += turn.loose; result.score += turn.bonus })
      return result
    }

    bossToDeck() {
      if (this.boss) {
        var stay = this.play.pick(this.play.foundCard(this.boss))
        if (stay) { stay.move(this.play, this.deck) }
        this.boss = undefined
      }
    }

    playToRest() {
      var pl = this
      this.play.cards.map(function(cc) { return cc }).forEach(function(c) { c.move(pl.play, pl.rest) })
      if (this.play.length() > 0) { console.error(this.play) }
    }

    bossNotToRest() {
      var pl = this
      this.play.cards.filter(function(cc) { return cc != pl.boss }).forEach(function(c) { c.move(pl.play, pl.rest) })
    }

    sog() {
      var res = this.matchResult()
      return "{..1} win:{..2} score:{..3} support:{..4}\n\t\t\tdeck:{..5} hand:{..6} rest:{..7}".insert(this.name, res.win, res.score, res.support, this.deck.length(), this.hand.length(), this.rest.length())
    }

  }// end Player	


  // KIHAL --- eddig jó ( bár az adatszerkezetben vannak meggondolatkanságok )

  // ------------------------------------------[ Match ] --------------------------------------

  var pp = {}  // ez is global, hogy gyosabban el lehessen érni a játékosokat 

  class Allyers {

    constructor() { // all players  
      this.yers = []
      this.ids = {}
      this.active = false
      this.umpire = false
      this.around = []
      this.endround = true
    }

    loginToMatch(who) {
      who = [].concat(who) // js-ben könnyü 1 vagy Array paraméterre számítani 

      for (i in who) {
        pp[who[i].name] = who[i]
        this.ids[who[i].id] = who[i] // this.yers.length  // megkapja a sorszamat is 
        who[i].index = this.yers.length
        this.yers.push(who[i])
      }

    }

    randomPick() {
      return this.yers[~~(this.yers.length * Math.random())]
    }

    pick(n) { return this.yers[n] }

    active(who) {
      if (who instanceof Player) { this.active = who }
      return this.active
    }

    umpire(who) {
      if (who instanceof Player) { this.umpire = who }
      return this.umpire
    }

    length() { return this.yers.length }

    grabOutSceneFromDecks() {
      var scenes = new Deck()
      for (var i in this.yers) {
        var sceneCards = this.yers[i].deck.filter(SCENE)
        this.yers[i].deck.removeCard(sceneCards)
        scenes.insertCard(sceneCards)
      }
      scenes.shuffle()
      return scenes
    }

    next(first) {
      var n = first.index
      return (n + 1 < this.yers.length) ? this.yers[n + 1] : this.yers[0]
    }

    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/from
    // szerintem lehet szebben leírni 
    order(first) {
      var n = first.index
      // var i=0,order = repeat(this.yers.length,function(){return i++})
      var order = Array.from({ length: this.yers.length }, (v, k) => k) // emelkedö szamsor 
      for (var i = 0; i < n; i++) { order.push(order.shift()) }
      return order
    }

    round(first) {
      var order = [first]
      var pl = this.next(first)
      while (pl != first) {
        order.push(pl)
        pl = this.next(pl)
      }
      return order
    }


    others(who) {
      return this.yers.filter(function(pl) { return pl != who })
    }

  } // end Allyers	


  // ----------------------------[ end of core ]-----------------------------------------------

  // { html view is removed 2015.10.19 }

  // ---------------------------------[ PIXI - test section  ] -------------------------------------------------------------

  var renderer, stage, background

  const FORCE_ONE_WIDE = 3
  const ALTERNATE_NAME = 7

  function skeletonCardRender(card, isInPlay, isInfoBox, side, justBake) {

    //  log = 111 -- elég durván sokszor hívom meg teljesen feleslegesen a gameplay alatt a kártya kirajzolót, 
    // csoda, hogy egyáltalán fut. TODO fix hack !!!!

    // side = side || 0 
    // isInPlay @ scene , true , false 
    // side @ isInPlay:false ? scene : 0 , 1 

    /* // szép elképzelés de még nem működik 
  if( card.texture ){ // short way if already baked  

    var bake = new PIXI.Sprite( card.texture )
    stage.addChild(bake)
    bake.serial = card.serial 
    card.texture = bake

  return bake } 
  */

    if (!card) { return console.error("Isin't card!") }

    if (!(card instanceof Card)) { try { card = new Card(card); console.log(card) } catch (err) { return console.log("Isin't card serial") } }

    var r, base = new PIXI.Container()  // r = render 

    var cpl = card.prof.length

    let forcew1 = isInPlay == FORCE_ONE_WIDE
    let alternateName = (typeof isInPlay === 'string') ? isInPlay : false
    log = alternateName
    if (forcew1 || alternateName) isInPlay = false;

    const wforce = (card) => forcew1 ? 1 : card.width || 1
    let aricon = Array.from({ length: cpl }, (e, i) => i) // aricon.fill felülírja szóval csak 2. lehet használni 

    if (isInPlay) { // only actor 

      switch (card.type) {

        case ACTOR:
        case ITEM:

          r = upp(skeleton.card.actor.inPlay)

          r.ui.name.pixi.text = card.name

          r.ui.stand.pixi.addChild(new PIXI.Sprite.fromImage([folder + 'inplay-stand.png', folder + 'card-stand-404x65.png', folder + 'card-stand-606x65.png'][card.width - 1]))

          r.ui.info.descript.pixi.text = hcrbToBack(card.skill.descript)
          r.ui.info.bckg.pixi.height = r.ui.info.descript.pixi.height + 10
          r.ui.info.pixi.y = - r.ui.info.bckg.pixi.height
          r.ui.info.pixi.visible = EXTRAINFO

          var score = isInPlay instanceof Card ? card.score(isInPlay) : 0
          r.ui.score.pixi.text = score > 0 ? '+' + score : ''
          r.ui.score.pixi.x = card.width * 202 - 15
          r.ui.pic.pixi.addChild(new PIXI.Sprite.fromImage('img/actors/' + card.gmid + '.png'))
          r.ui.pic.pixi.children[0].anchor.x = card.width == 1 ? .5 : 0
          r.ui.pic.pixi.children[0].position.x = card.width == 1 ? 144 : 0 // 202/2/.7  		
          if (card.width > 1) { r.ui.pic.pixi.scale.set(.84) }

          // + KIHAL itt a jó fordító kód!! 	
          //else { r.ui.pic.pixi.scale.x = -r.ui.pic.pixi.scale.x ; r.ui.pic.pixi.x += 202  }

          var mask = new PIXI.Graphics(); mask.beginFill(0xFF0000).drawRect(0, 0, 250 * card.width + 20, 220).endFill()
          r.ui.pic.pixi.mask = mask
          mask.position.y = -220
          mask.position.x = -20
          base.addChild(mask)


          // irányba kellene néznie a szereplőknek 
          // if( card.face != side ){ let ipa =r.ui.pic.pixi; ipa.scale.x = -1; ipa.position.x += ipa.width  }

          // vagy item vagy info
          if (card.attach) {
            var item = PIXI.Sprite.fromImage('img/items/itm' + card.attach.gmid + '.png')
            r.ui.item.pic.pixi.addChild(item)
            r.ui.item.pic.pixi.children[0].position.set(card.width * 250 - 100, -400)
          }

          //iconsOnCard( r.ui.icons.pixi , {x:[8,46,84,122,160,198],y:[55,55,55,55,55,55]} ) // ES6 can be better 				
          //iconsOnCard( r.ui.icons.pixi , {x:Array.from({length: cpl }, (e,i) => i*38 +8),y:Array(cpl).fill(55)} ) // sure!
          iconsOnCard(r.ui.icons.pixi, { x: aricon.map(i => i * 38 + 8), y: aricon.fill(55) }) // sure!

            ; break;

      }


    } else {

      switch (card.type) {

        case SCENE: r = upp(wforce(card) > 1 ? skeleton.card.sceneW2 : skeleton.card.scene) // [w1,w2,w3][card.size-1]

          r.ui.name.pixi.text = alternateName ? alternateName : card.name
          var img = PIXI.Sprite.fromImage('img/scenes/ls{..1}.jpg'.insert(card.gmid))
          img.scale.set(0.42)
          img.y += 7 // KIHAL nem kell maszkolni külön 
          img.anchor.x = wforce(card) > 1 ? 0 : .5
          r.ui.pic.pixi.addChild(img)
          //iconsOnCard( r.ui.icons.pixi , wforce(card)>1 ? {x:Array.from({length: cpl }, (e,i) => i*38 + 500 - 11 - 38*cpl ),y:Array(cpl).fill(8)} : {x:Array.from({length: cpl }, (e,i) => i*38 + 10 + (6-cpl)*19 ),y:Array(cpl).fill(265) } )
          if (!alternateName) iconsOnCard(r.ui.icons.pixi, wforce(card) > 1 ? { x: aricon.map(i => i * 38 + 500 - 11 - 38 * cpl), y: aricon.fill(8) } : { x: aricon.map(i => i * 38 + 10 + (6 - cpl) * 19), y: aricon.fill(265) });

          ; break;

        case ITEM: r = upp(skeleton.card.item)

          r.ui.name.pixi.text = card.name
          r.ui.info.descript.pixi.text = card.canCast ? card.profLog + CR + hcrbToBack(card.skill.descript) : card.profLog
          r.ui.info.bckg.pixi.height = r.ui.info.descript.pixi.height + 10
          r.ui.info.pixi.y = 310 - r.ui.info.bckg.pixi.height
          r.ui.info.pixi.visible = 1//card.canCast
          r.ui.pic.pixi.addChild(new PIXI.Sprite.fromImage('img/items/itm' + card.gmid + '.png'))
          //iconsOnCard( r.ui.icons.pixi , {x:Array(cpl).fill(202),y:Array.from({length: cpl }, (e,i) => i*38+8)} ) // kibővítemi 4-re 
          iconsOnCard(r.ui.icons.pixi, { y: aricon.map(i => i * 38 + 8), x: aricon.fill(202) }) // az aricon.fill felülírja az aricont! 

            ; break;

        // TODO actor card on scene as bg test 

        case ACTOR: r = upp([skeleton.card.actor.inHand, skeleton.card.actor.W2inHand, skeleton.card.actor.W3inHand][wforce(card) - 1])

          r.ui.name.pixi.text = card.name
          r.ui.info.descript.pixi.text = card.canCast ? card.profLog + CR + hcrbToBack(card.skill.descript) : card.profLog // card.profLog +CR+card.descript
          r.ui.info.bckg.pixi.height = r.ui.info.descript.pixi.height + 10
          r.ui.info.bckg.pixi.width = wforce(card) * 250 - 22
          r.ui.info.pixi.y = 310 - r.ui.info.bckg.pixi.height
          r.ui.info.pixi.visible = 1 //card.canCast
          r.ui.pic.pixi.addChild(new PIXI.Sprite.fromImage('img/actors/' + card.gmid + '.png'))
          var mask = new PIXI.Graphics(); mask.beginFill(0xFF0000).drawRect(0, 0, 250 * wforce(card), 305).endFill()
          if (wforce(card) > 1) { r.ui.pic.pixi.children[0].scale.set(1.3); r.ui.pic.pixi.children[0].position.set(60, -15) } // KIHAL alakul a W2
          r.ui.pic.pixi.mask = mask
          base.addChild(mask)
          //iconsOnCard( r.ui.icons.pixi , wforce(card) < 2 ? {x:[8,202,8,202],y:[8,8,46,46]} : {x:Array.from({length: cpl }, (e,i) => i*38 + wforce(card)*250 - 11 - 38*cpl ),y:Array(cpl).fill(8)} ) // + kibővítemi 4-re 
          // W1 - nél nem lehet 4 iconnál több !! ++
          //iconsOnCard( r.ui.icons.pixi , wforce(card) < 2 ? {x:Array(cpl).fill(1).map( (c,i)=>i%2?202:8 ),y:Array(cpl).fill(1).map( (c,i)=>8+Math.round((i-.1)/2)*38 )} : {x:Array.from({length: cpl }, (e,i) => i*38 + wforce(card)*250 - 11 - 38*cpl ),y:Array(cpl).fill(8)} ) // + kibővítemi 4-re 
          iconsOnCard(r.ui.icons.pixi, wforce(card) < 2 ? { x: aricon.map(i => i % 2 ? 202 : 8), y: aricon.map(i => 8 + Math.round((i - .1) / 2) * 38) } : { x: aricon.map(i => i * 38 + wforce(card) * 250 - 11 - 38 * cpl), y: aricon.fill(8) }) // + kibővítemi 4-re 




          if (isUNDER && card.width < 2) {
            //log = card.name
            //log = 'hol a hetter'
            let under = PIXI.Sprite.fromImage('img/scenes/ls{..1}.jpg'.insert(("0" + dice(60)).slice(-2)))
            under.scale.set(0.42)
            under.y += 7 // KIHAL nem kell maszkolni külön 
            under.anchor.x = .5
            r.ui.under.pixi.addChild(under)
          }


          ; break;

      }

    }

    function upp(p) { uppdate(p.keydot, base); return p.pixi }
    function iconsOnCard(holder, posObj) {
      // jó lenne, ha kirderülne, hogy elég a plvl - nem elég - mert nem derül ki a sorrend, KIHAL 1.-re
      // for( pk in ( card.attach ? card.plvl : card.currentProfsLvl) ){}
      var profs = card.currentProfs
      var plvls = card.currentProfsLvl
      profs.forEach(function(pf, i) {
        var lvl = plvls[pf.id] // csak 3 icon szint van jelenleg 
        var icon = new PIXI.Sprite(PROT[lvl > 3 ? 3 : lvl][pf.name])
        icon.width = icon.height = 40
        icon.position.set(posObj.x[i], posObj.y[i])
        holder.addChild(icon)
      })

    }
    function hcrbToBack(desc) { return desc.replace(/(^.)..(.*)/, '$2 :$1')  /* ez minden js enginben működik ? */ }

    // bake is a littlebit tricky 	

    if (justBake) { return bakeCardToTexture(base, 250 * wforce(card)) } // don't hold serial 

    var isBake = !isInPlay

    if (isBake) {

      var texture = bakeCardToTexture(base, 250 * wforce(card))
      var bake = new PIXI.Sprite(texture)
      stage.addChild(bake)
      bake.serial = card.serial
      card.texture = bake
      return bake

    } else {

      stage.addChild(base)
      base.serial = card.serial
      return base
    }

  }


  function bakeCardToTexture(complexCardOject, w, h) {

    w = w || 250
    h = h || 320

    var texture = new PIXI.RenderTexture(renderer, w, h) // , PIXI.SCALE_MODES.LINEAR {0} , scale  {1}
    texture.render(complexCardOject)
    // return new PIXI.Sprite( texture )
    return texture

  }


  // var co = new Coroutine();switchMatch(co);switchMatch(co);pixiInit();var il = singlePlayerPixiRender(co)

  var someoneStop = false, walker, centerOfDrag = { x: 1280 / 2, y: 720 / 2 }, lastOne = false, terra = []

  // -------------------------------------[ PIXI interactions ]-----------------------------------------------

  // a PIXI.Container.getBounds - rossz 

  function contGetBounds(cont) {

    // log = cont.getBounds ?  cont.getBounds() : '-'

    // fix by Peter Vivo 

    if (!cont._currentBounds) {

      if (0 === cont.children.length) return cont instanceof PIXI.Container ? PIXI.Rectangle.EMPTY : cont.getBounds()

      for (var bnd, nmaxX, nmaxY, minX = 1 / 0, minY = 1 / 0, maxX = -(1 / 0), maxY = -(1 / 0), h = !1, l = 0, u = cont.children.length; l < u; l++) {

        var c = cont.children[l]
        var bnd = bnd instanceof PIXI.Container ? contGetBounds(c) : c.getBounds()

        c.visible && (bnd.width * bnd.height) && (
          h = true,
          minX = minX < bnd.x ? minX : bnd.x,
          minY = minY < bnd.y ? minY : bnd.y,
          nmaxX = bnd.width + bnd.x,
          nmaxY = bnd.height + bnd.y,
          maxX = maxX > nmaxX ? maxX : nmaxX,
          maxY = maxY > nmaxY ? maxY : nmaxY
        )

        // console.log(bnd)

      }

      if (!h) return n.Rectangle.EMPTY;

      var p = cont._bounds;

      p.x = minX; p.y = minY; p.width = maxX - minX; p.height = maxY - minY; cont._currentBounds = p

      // cont._currentBounds = { x: 11, y:12 , width: 55, height: 55 }
    }

    return cont._currentBounds

  }

  // 1/0 = Infinity , -(1/0) = -Infinity , !0 = true 


  function isCollision(a, b) {
    return (Math.abs(a.x - b.x) * 2 < (a.width + b.width)) &&
      (Math.abs(a.y - b.y) * 2 < (a.height + b.height));
  }

  // global mouse position
  // renderer.plugins.interaction.mouse.global
  // miért nem ezt használom ??

  function animate() {

    // hu de csunya , de működik - KIHAL !  
    if (skeleton) {
      if (skeleton.interaction && skeleton.interaction.length) {

        skeleton.interaction.forEach(function(f) { f.sensorInteraction ? f.sensorInteraction() : f() })

      }
    }

    cardMover()

    renderer.render(stage);
    requestAnimationFrame(animate);

  }

  function isIntersecting(a, b) { return !(b.x > (a.x + a.width) || (b.x + b.width) < a.x || b.y > (a.y + a.height) || (b.y + b.height) < a.y) }

  function underCursor(cursor) { return stage.children.filter(function(s, i) { if (i > 0 && isUnderCursor(s, cursor)) { return s } }) }

  //function isUnderCursor( s , cursor ){ return isIntersecting(  s instanceof PIXI.Container ?  contGetBounds(s)  :  s.getBounds() , { x:cursor.x , y:cursor.y , width: 1, height: 1 } ) }
  function isUnderCursor(s, cursor) { return isIntersecting(contGetBounds(s), { x: cursor.x, y: cursor.y, width: 1, height: 1 }) }

  // -------------------------------------[ PIXI UX ]-----------------------------------------------

  /*

DOC:: 

http://pixijs.github.io/docs/

http://pixijs.github.io/examples/

az ikonokat akár 1 textúrába is be lehet rakni 

var a = pixiCardRender(); a.position.set(500,200)
a.filters = [new PIXI.filters.BlurFilter(2)]
a.filters[0].blur = 8

A memória kezelés azért még küzdelmes lehet 

swipe
http://www.html5gamedevs.com/topic/4637-pixijs-swipe-event/

ha az optimalizálás is jó lessz, akkor igen csak használhatónak tűnik a PIXI 
mert azért HTML/CSS-el bonyolultabb strukturakat kell letrehozni, amit már animáció közben macera fenttartani 

a nagy kérdés mennyi képet, és hogyan lehet előre optimálisan feltölteni. 

HARDWER ACCELERATE

http://blog.ludei.com/cocoonjs-announces-webview-for-ios-8-publish-wkwebview-powered-standalone-apps/

http://tmtg.net/glesjs/  - KIHAL - ennek müködik a megoldása

https://twitter.com/borisvschooten/status/489894378883014656

how to make game in JS 

http://www.awwwards.com/current-state-and-the-future-of-html5-games.html

http://pixijs.github.io/docs/

... talán ezzel a megoldással glesjs alá tudom szuszakolni a történetet 

https://apkstudio.codeplex.com/downloads/get/909466

http://phonegap-tips.com/articles/force-hardware-acceleration-with-translate3d-sometimes.html

.draggable-image { -webkit-transform: translate3d(0px,0px,0px); }

http://coenraets.org/blog/2013/03/hardware-accelerated-page-transitions-for-mobile-web-apps-phonegap-apps/

LOCALHOST 

 make localhost on windows
 https://www.youtube.com/watch?v=Ybn6Q92m4xg
 http://localhost/deckbuilder.html

 már csak a localhost mappát kellene átállítani, vagy itt kezelni a cordova dolgokat is 
 CTRL+R > inetmgr

  http://localhost/afsmenu/www/

// ---------------------------------[ glesjs android speed hack :: Boris van Schooten, 17 July 2014 (boris@13thmonkey.org) ] ---------------------------------------

  http://tmtg.net/glesjs/

  http://localhost/glespixiafs/assets/

  https://apkstudio.codeplex.com/

  https://www.scirra.com/forum/gles-js_t109396

    iOS :: http://impactjs.com/ejecta 

    https://github.com/godmodelabs/ejecta-v8

    http://www.slideshare.net/KevinRead3/presentation-tng

http://hackersome.com/p/andych008/pender-android  ??? ezt is még csak fejlesztik ... de a glejs már működik, csak a szinekkel van a baj 

online regExp tester https://regex101.com/

C:\Users\Germo\AppData\Roaming\npm;%ANT_HOME%\bin;c:\soft\jdk\bin;c:\soft\Android\sdk;%ANDROID_NDK_ROOT%;

a jó kérdés, hogyha az NDK rendesen fel lesz rakva akkor a GC már jól fog-e futni. Illetve, hogy addig is dolgozzak-e a PIXI-vel 

- Multi Touch - 

http://www.sitepoint.com/the-complete-guide-to-building-html5-games-with-canvas-and-svg/

https://github.com/borismus/pointer.js

- sprite sheet solution -

online Sprite Sheet Creator 

http://spritegen.website-performance.org/

https://github.com/pixijs/pixi.js/issues/515

var profSheet  = PIXI.BaseTexture.fromImage("img/icons/professionicons.png");
var profiTexture = new PIXI.Texture(profSheet, new PIXI.Rectangle(0,0,70,70));
var porfi = new PIXI.Sprite( profiTexture )
stage.addChild( profi )

Miután szépen beleástam magam a PIXI-be lehet, hogy kiderül a végén gameclosure-ban leszek kénytelen megoldani a progrmot,
mert az jobban ki van hegyezve arra, hogy kihasználja a mobil GPU-t 

Illetve ha jól láttam a doksijában, akkor még a különböző hírdetési motorok is be vannal építve.
Persze utána kellene nézni, hogy ennek a "motornak" a használata milyen anyagi következményekkel jár. 

Mobil app to store system 
https://software.intel.com/en-us/intel-xdk

C / C++ to asm.js 
https://kripken.github.io/emscripten-site/index.html

fast canvas ??
https://github.com/phonegap/phonegap-plugin-fast-canvas
npm install -g plugman
plugman install --platform android --project /c/cor/afc/platforms/android/ --plugin /c/soft/fast-canvas/phonegap-plugin-fast-canvas/
http://stackoverflow.com/questions/13615964/the-import-org-apache-cordova-cannot-be-resolved

innen tovább

https://github.com/piqnt/fastcontext

- de nem sikerült ezzel se 

akkor jöhet a::

https://www.npmjs.com/package/cocoon-plugin-canvasplus-common
https://github.com/CocoonIO/cocoon-canvasplus

mashova jól jöhet http://codepen.io/Astrak/pen/BoBWPB  webGL galaxy 

http://www.html5gamedevs.com/topic/1047-ejecta-accelerated-canvas-libraries-on-android/

// ----------------------------------[ Cocoon JS ]------------------

cordova create aff com.nullpointstudio.cod CruxOfSilence
cd aff
cordova platform add android
cordova plugin add cocoon-plugin-canvasplus-common
cordova build android

http://www.html5gamedevs.com/topic/1904-cocoonjs-pixijs-example-project/

secure meta tag

<meta http-equiv="Content-Security-Policy" content="default-src *; style-src 'self' 'unsafe-inline' http://fonts.googleapis.com ; script-src 'self' 'unsafe-inline' 'unsafe-eval'">

oké mostmár a Cocoon - aktív már csak az a kérdés, hogyan gyorsítja a kirajzolást 

cocoonjs CLI test 

http://support.ludei.com/hc/en-us/articles/202568973-First-steps-with-CocoonJS-CLI

cocoonjs plugin add com.ludei.webview.plus

-- frankó ... leradíroztam a java-y -- ujraraktam 

 ant release -buildfile C:\cor\test\plugins\com.ludei.webview.plus\android\build.xml

  C:cortestpluginscom.ludei.webview.plusandroidbuild.xml - not exsist

 error:: Unable to resolve project target 'Google Inc.:Google APIs:19'
 https://github.com/ludei/cocoonjs-cli/wiki/How-to-solve-the-compilation-error:-%E2%80%9CUnable-to-resolve-project-target-'Google-Inc.:Google-APIs:19'%E2%80%9D

KIHAL !!! work ! The Webview+ has been installed correctly in your Cordova project :)

browsestack.com -- browser / device test 

http://stackoverflow.com/questions/23449312/running-cordova-sample-project-with-cocoonjs-launcher

dynamicall loading css and scripts 

https://arvinbadiola.wordpress.com/2014/08/16/dynamically-loading-stylesheets-and-scripts-in-cordova-with-ember-js/

pandajs - itt állítólag megvan oldva a cocoonjs kapcsolat ... utánanéz

kiwijs - sokan próbálna erről a cocoonjs-ről lehúzni egy egy bőrt

https://www.reddit.com/r/javascript/comments/1johkr/my_javascript_game_as_native_application_for/

tlán itt leírnak valami használhatót a pixi+cocoon módszerről 

http://www.html5gamedevs.com/topic/15196-in-cocoon-pixiv3-autodetectrenderer-return-canvas-and-webglrenderer-dont-display-sprites/?hl=cocoon

cocoonjs html5 feature list:

http://support.ludei.com/hc/en-us/articles/200807787-HTML5-feature-list

mielőtt az afs-t próbálom cocoon alatt előtte egy demót kellene kipróbálni 

ó már a cloud -os verziónál járok, kellene egy jól használható demó amiből kiderül mennyire működik a cucc 

KIHAL - a three.js-es működik szépen a cocoonjs-el 

mostmár csak egy jó kis teszt PIXI programot kellene összehozni, mert ez azt mutatja, hogy a terv nem lehetetlen. 
legyen deck builder 

Akkor most UI / game builder vagy mi is a pontos cél ??? Szerencsére a lehetőségek száma végtelen

  - 2d elemek pozícionálása mozgatása módosítása
  - interaktív elemek összerakása 
  - 3d elemek beépítésének lehetősége 
  - szövegek megjelenítése
  - online szerkesztés lehetősége 
  - mind work 	
  - vector graphics 

  az lenne a legdurvább, hogyha önmagával lehetne feljleszteni 

ForUI ui prototype építő - majdnem jo	

http://www.gamasutra.com/view/feature/4086/a_circular_wall_reformulating_the_.php


http://lycheejs.org/index.html  - - -  ez cocoonjs nélkül csinál natív speedet ??
Úgy látom ezek is elszálltak eft kicsit. De legalább még oprendszert is lekódoltak vele. 
lehet, hogy van benne ráció. 

KIHAL - így tömbrendezéssel egészen jól el lehet vele játszani 

+ PIXI font teszt

  - - - megint unity ??

GIT ki kellene próbálni a szerveren 

http://guides.beanstalkapp.com/version-control/git-on-windows.html


glesjs on github !!! KIHAL ! { 2015.09.14 }

https://github.com/borisvanschooten/glesjs.git


[ GLESJS - ANDROID ANT BUILD ]

normál cmd-ben !

android create project --target android-14 --name gaf --path ./ --package hu.beyondreason.gaf --activity MyGaf 

azthiszem az --activity-vel van a gond 

winant - hogy működjön az ant

keytool -genkey -v -keystore vpbreason.keystore -alias pvivo -keyalg RSA -keysize 2048 -validity 10000

kulcs készítés 

https://docs.oracle.com/javase/tutorial/security/toolsign/step3.html

{ 2015.09.15 } - - a gaf már jó színekkel fut le, de még a régi pixi.dev.js - t használja 
ami a browserben viszont nem megy 

http://www.javascriptobfuscator.com/Javascript-Obfuscator.aspx
"Non UTF string to hex".split('').map(function(cc){return '\\x'+cc.charCodeAt(0).toString(16)}).join('')

itt munka közben egy ígéretes obfuscator :: http://stunnix.com/prod/jo/

http://codebeautify.org/jsviewer


ant release - 2x pass  Vera


digital painting value planning 	https://www.youtube.com/watch?v=x6BlTEytocc

jól használható cuccnak tűnik 
https://www.codeandweb.com/texturepacker

bakker a föld adatait egy json file-ból veszi ki.  
http://codepen.io/stevepepple/pen/vEJmQM?editors=001

http://codepen.io/stevepepple/blog/javascript-geospatial-examples

itt is találhatok jó kis JS könyvtárakat az explorer játékhoz 
http://techslides.com/50-javascript-libraries-and-plugins-for-maps



valószínűleg itt java felületet lehet létrehozni a react módszerével
https://facebook.github.io/react-native/

REACT funtional programming UI ... érdekes 

itt van egy szép rövid kód, ami jól mutatja az elképzelést. 

https://facebook.github.io/react-native/docs/tutorial.html#content



[ PHASER ] ---------- ki kell próbálni mik az előnyei a sima PIXI-hez képest 

itt egy meggyőző flipper program :: 
http://phaser.io/examples/v2/box2d/pinball
- amihez sajnos kell a fizetős box2d plugin -- ügyes !

{ 2015.09.16 }

  a demóból kiszedett phaser.js-el szintén működött a phaser .. de kékben :( .... pedig ez a könyvtár sokkal kiforrottabbnak tűnik 

  a vicc, hogy a cocoonjs is ugyanezt csinálta 


C:\Users\Vívó Péter\AppData\Roaming\npm;C:\soft\apache-ant-1.9.6\bin;%ANDROID_HOME%;%JAVA_HOME%;%ANDROID_HOME%\tools;%JAVA_HOME%\bin;%ANDROID_HOME%\ndk-r10e;


file upload 

http://www.html5rocks.com/en/tutorials/file/xhr2/



Virtual Server around the world :: http://www.softlayer.com/virtual-servers 


why dont store data in DOM ant about modular programing in JS and other helpfull OOP workflow 

  http://singlepageappbook.com/single-page.html


GUI desing practice for mobil 

  http://www.paladinstudios.com/2012/04/23/the-8-step-guide-to-interface-design-for-iphone-games/

 FOR HONOR - szuper kardforgatós játék
 http://forhonor.ubisoft.com/game/en-US/game-info/samurai/index.aspx
  - responsive website coll main anim problem soultion 2 


devkit a linux szerveren :: 
http://95.140.35.51:9200/

pixi title mapp zoom + drag :: http://www.bhopkins.net/2014/10/08/draggable-zoomable-tile-map-with-pixi-js/

JS OOPinJS2http://phrogz.net/js/classes/OOPinJS2.html


http://dl.google.com/android/android-sdk_r24.3.4-linux.tgz

Ó neee mégegy js game engine  --  ez meg a coccon-t használja 
http://examples.kiwijs.org/

- yeoman - érdekes js modul organizer program 

http://yeoman.io/learning/index.html

JS multiplayer engine 
http://www.isogenicengine.com/get-started.html

JS Game Engine list 
https://developer.mozilla.org/en-US/docs/Games/Tools/Engines_and_tools

Native Script - mobil fejlesztés V8-al ! :D
https://github.com/NativeScript/nativescript-angular



Interaction - Animation beépítése a programba 

  Singleplayer PIXI megjelenítési hiányosságai:

    [statikus]
    - ikon sor amikor tárgy van a szerplőn 
    - szöveg boxok a kártyákon inHand és inPlay módban
    - aktív játékost jelölő vonal 
    - megfelelő szövegek kiírása játék közben
    [dinamikus]
    - ikonok jelzése, melyik lap mennyi pontot hoz képesség nélkül 
    - jelenet kártya beanimálása 
    - A játék menet interaktív és animált részeinek beépítése
        - lap kijátszása a kézből
        - ellenfél lapot játszik ki
        - képesség kijátszása 


- lehetőség a visszatérési érték jelzésére -

[PIXI.Sprite]; function akarmi(){ return new PIXI.Sprite() }


PIXI.Container.prototype.getBoundsOld = function() {

    if (!this._currentBounds) {

        if (0 === this.children.length) return n.Rectangle.EMPTY;

        for (var t, e, r, i = 1/0, o = 1/0, s = -(1/0) , a = -(1/0), h = !1, l = 0, u = this.children.length; u > l; ++l) {
            var c = this.children[l];
            // c.visible && (h = !0, t = this.children[l].getBounds(), i = i < t.x ? i : t.x, o = o < t.y ? o : t.y, e = t.width + t.x, r = t.height + t.y, s = s > e ? s : e, a = a > r ? a : r)


            // de szép megoldás ... majdnem olvashatatlan .. ha nem lenne rossz akkor nem is találkozok ezzel a  megoldással JS-ben s

            c.visible && ( 
              h = true , 
              t = c.getBounds(), 
              i = i < t.x ? i : t.x, 
              o = o < t.y ? o : t.y, 
              e = t.width + t.x, 
              r = t.height + t.y, 
              s = s > e ? s : e, 
              a = a > r ? a : r
            )


        }
        if (!h) return n.Rectangle.EMPTY;
        var p = this._bounds;
        p.x = i, p.y = o, p.width = s - i, p.height = a - o, this._currentBounds = p
    }
    return this._currentBounds

}

SFML - multilanguage C, Go, D, Rust - multimedia application 


-- [ 3D game engines  ] --

http://www.worldofleveldesign.com/categories/level_design_tutorials/recommended-game-engines.php

letöltöttem az Unreal-t .. idővel lua-ban és C++ -ban is meg kell tanulnom programozni az az érzésem 

Alfa Szindikátus 

Alpha Symdicate 


Unreal Engine + javascript : 

http://flathead.gneu.org/

blender to unreal 

http://rowvr.co/2015/01/03/get-from-blender-to-unreal-engine-4-quick-workflow-tips/


Nagyon meggyőző szoba berendezés real time bevilágítással unreal 4-ben. Persze kellenek hozzá a jó modellek  

azért ez elég nagy kihívás lesz, hogy egy jól használható textúrázott 3D modelt csináljak
a rendelkezésre álló tulajdonképpen 1 kép alapján. 

viszont már 2 óra és még 1 centit se haladtam .. van még háta 5 órám .. húzzak bele vagy mi  

egy szep epulet texturazo forum
http://tesrenewal.com/forums/skyrim/skywind-development-forums/environmental-and-architecture-3d-modeling/7688

letöltve, de nem tudtam licencelni .. akkor maradjon inkább a blender + PS végül is abban van tapasztalatom 

ez aztan erdekes lesz ... nem egyszeru a tortenet .. nagyon kívancsi leszek az eredmenyre 


belnder with websocket 
http://www.blendernation.com/2012/02/10/live-3d-stream-from-blender-to-browser/

ezt használja a kommunikációra 

https://github.com/kanaka/websockify

durva lenne, ha így tudnám a modelleket berakni egy játékba ... ennek a módszernek utána kellene járni. 

idővel a blender fejlesztésbe is bekapcsolódhatnék ... volna egy pár ötletem az tuti .. de elsőnek ez a progi jöjjön létre 


texture by Substance Painter  https://www.youtube.com/watch?v=J_42qAOA0W4 - nem fut jól

Nagyon lassan compilolja a shadereket ... de utána rohadt jó a látvány . 

viszont a játék play-ban gyorsan kipróbálható 

viszont 2d-re nem tűnik optimálisnak 

nagy level editornak viszont irdatlanul jónak tűnik .. szuper játék bevilágítás, jól használható item editor 

hogyha a compiling shaders lefut utána már gyönyörű az egész terület .. de azzal sokáig elvackol ( lehet 4Mb memória kevés neki )
közben a memóriát is iszonyatosan eszi ... mellette már nem fut el egy chrome 

ja most nézem 24gB RAM-ra tervezték a programot .. régen a winchesterem nem volt akkora 

http://www.cgtextures.com/

a decal alatt vannak jól használható "koszok"

https://www.youtube.com/watch?v=hh6ZW1njZVA

Real Time Rendering ::

http://www.siliconstudio.co.jp/middleware/mizuchi/en/#6thpage



http://www.cocos2d-x.org/

na mégegy game engine .. ennek is van js verziója !

ki kell próbálni, hátha ezzel jól lehet kis játékokal dolgozni ... C++ és LUA-ban is lehet fejleszteni benne 

Kezd túl sok lenni a gépemen a fejlesztő eszköz ... pedig egy jó kis chrome console + sublime text-nél .. krita, ps, blender nem sokkal kellene több.

sublimetext great moduls https://bufferwall.com/blogs/2015-04-03-the-best-sublime-text-3-extensions/
https://github.com/wuub/SublimeREPL
https://github.com/spadgos/sublime-jsdocs/
http://livestyle.io/


egy kis cég aki csinált egy poén játékot : http://gamesauce.org/news/tag/chartboost/

különböző mobil fejletsztő eszközökről egy összeszedett oldal 
http://www.mobyaffiliates.com/blog/ios-android-mobile-game-development-tools-frameworks-engines-resources/

masik lista 
https://software.intel.com/en-us/android/blogs/2012/03/13/game-engines-for-android

Anyyi mindent kellene csinálni, pld. megtanulni kicsit C++ -ban és GPU-t is programozni és akkor az még csak az alapok, 
hogy egy gyors js alapú fejlesztő rendszert dolgozhassak ki. 
A blendert is lehetne fejleszteni, hogy alkalmasabb legyen játékok fejlesztésére akár js-ben programozva is. 
És a slash-t is fejleszthetném. 

+space ship mániám már megint kiütközött 
http://www.solcommand.com/2013_03_01_archive.html

viszont megvan hogyan lehet gyorsan blenderben starshippet modellezni:

  - edge split : only sharo edge modifier
  - ctrl B
  - w - symmetry 
  - K- al felszabdalni lemezekre és utána I - el  induvidual + amount - al megcsinálni a szép lemez struktúrát


3d laser scanner :

https://www.youtube.com/watch?v=16TtKW5tHGA

bescannelt 3d szoba 

https://sketchfab.com/models/6737a0b96da44c3bba30e173d236fc92

belnder low poly nature

https://www.youtube.com/watch?v=gF6qkByl-_M


vannak gondjaim a blender billentyű beállításokkal ... még kiderül

az U4-el is vannak gondok ma egészen sokszor kifagy 

a belnder --> U4 prot se seamless .. jó kérdés, hogy miként lehet korrektül megadni az éleket 

Az U4 akkor lenne használható ha egyszerű modellekkel gyorsan lehetne benne játékot fejleszteni ... valami low poly cuccot, és az mobilon is működne. 

windows-hoz a visual studio 2013-at kell telepíteni .. nem a 2015-öt .. done 


Magnetic 3D sensor - // lehetne az ujjak mozgasat erzekelni ?? -- 

http://www.infineon.com/cms/en/product/promopages/sensortest/

http://www.infineon.com/dgdl/Infineon-Make+your+Application+Wireless+-+Sub+1GHz+RF+Solutions-BC-v02_00-EN.pdf?fileId=5546d4614cb7ee8c014cbc3c44a50019

itt is van :: 

https://www.youtube.com/watch?v=o4cgpQUW8HI

virtual shared token ( money ) - de a weboldala is egyszerűen jó. 

va benne JS megoldás is - https://github.com/ethereum/go-ethereum/wiki/JavaScript-Console


EJECTA V8 - https://github.com/godmodelabs/ejecta-v8 - ennek ráadásul van iOS verziója is - - - gáz , hogy a gyors mobil js fejletszéshe már hanyadik kódot próbálom ki.  

csak a make nem megy 

make -f /c/soft/Android/ndk-r10e/build/core//build-local.mk

kellene neki még NDK_PROJECT_PATH

hogy ezzel a C-vel mennyi gond van windows gitbash alatt !!!  kicsit útálom ezeket az andrpidos fejlesztéseket ... biztos van ennél jobb módja is a történetnek  
http://stackoverflow.com/questions/14156596/ndk-cant-find-the-application-directory


Ó Uram ! a végén még kénytelen leszek c++ - ban is megtanulni programozni, hogya egy kis jól működő V8 + OpengGL for Android and iOS ( mani more ) applikációt összehozsassak 
ez a sok elbaltázott fejlesztő rendszer ( mintha én jobbat tudnék - persze nem ) .. de totál nem így csinálnám ( azthiszem ) de egyenlőre csináljam PIXI-ben a AFS-t amit utána átalakítunk valami másra 
mondjuk a cpp a blender fejlesztéséhez is jól jönne amúgy 

C++ / 3D programozásról minden :: http://darthasylum.blog.hu/

http://ogldev.atspace.co.uk/ C++



Az oldal tele van hasznos  blender cycle tutorialokkal  http://www.chocofur.com/6-shadersamptextures.html


KIHAL ! vér profi blender cycles leírás anyagokkal meg minden.
http://www.chocofur.com/6-shadersamptextures.html

fight 2D !!i
http://www.cgsociety.org/news/article/1343/fight-2d

itt egy elborult világ .. viszonylag progin megcsnálva : http://degenesis.com/  - német rpg .. kicsit beteg 

skierült egy elég jónak tűnő fémes robot anyagot csinálni minden nélkül apró elemekhez blenderben 

illetve sculptolt figuráknál jól kihozza a formákat, kis átalakítással még terephez is jó. 

el kellene készíteni egy háttér sphere készítő setupot, hogy gyorsabban el lehessen készíteni a scatcheket 

alien coffe matic :: https://video-vie1-1.xx.fbcdn.net/hvideo-xfl1/v/t42.4659-2/11966363_905738032796539_582741483_n.mp4?oh=7e541df9e8f38b42de18322011e27807&oe=5639E125

- nem kell saját oprendszer megírásán törpölnöm - még ha a megjelenítést át is szeretném írni, akkor is jobban járok egy linux variáció átodolgozásával

-  még évekkel ezelőtt is úgy gondoltam, hogy totál egyszerű programozni, de mostmár azt kell mondjam, nem annyira könnyű mint látszik elsőre 7000 sor és még messze van a vége
   mint azt az alábbi lista is mutatja. 		

  http://ariya.ofilabs.com/2013/01/es6-and-array-comprehension.html	

   [33,22,22].map(String).join('-')

   http://es6-features.org/

   sok szép okosság lesz az ES6-ban :)

   "0".repeat(8)

   0.1+0.2 === 0.3 :(

   console.log(Math.abs((0.1 + 0.2) - 0.3) < 2.220446049250313e-16); // true

*/

  // http://m.cdn.blog.hu/da/darthasylum/tutorials/C++/chx_list.html

  /* PIXI + threejs

// http://www.html5gamedevs.com/topic/4488-using-rendertexture-in-threejs/       

 var canvas = document.getElementById( 'game-canvas' );

var texture = new THREE.Texture( canvas );

texture.needsUpdate = true;

requestAnimationFrame(animate);


VAGY EZ KELL ??

http://www.gamefromscratch.com/post/2014/11/16/Adventures-in-Phaser-with-TypeScript-Mixing-2D-and-3D-Graphics-using-Phaser-and-Threejs.aspx

*/



  /*   

  ezt az oldalt többet kellene néznem :: http://www.html5gamedevs.com/index.php? 

  Object.keys(pva.sub).sort().reverse() !! ez se haszntalan 

  online wireframe készítő :: 

    app.moqups.com/

  TODO {2015.11.17} ::

  + Hogyan építsem bele az animációkat és interakciókat a Coroutine switchMatch párosba ?? 

      + animációk beillesztése a switchMatch kliens oldalába 
        + egyszerűsíteni az animáció felrakást 
        + 3. actor animáció bug 
        + topline change when changePlayer 
          + anim this
        + bug: escalation dont draw scene 
        + select actor esetén az actorokat feljebb animálni
        + scene nevének animálása 
        + enemy hand draw
        + hand / enemy hand anim and postition correction 
          - fly hand when card goes to play 
  - szabály szerű játékmenet
        -+ konzekvensen kezelni az animációk végén a .phase .situation értékeket
        + folyamatosan menjen az autoplay 
        + card out from play - in proper order
          + nem látszanak a kimozgások .. főleg az escalation -kor
          + scene
          + to rest
          - to deck bottom
        + hand and inPlay vertical animation
        + who change anim => info line close when change current user
        -+ info line show who win the scene
          - iconok kivilágosodjanak, hogy miért nyerte az adott kört
        + PIXI.Container.fly = anim json 
        - az egész viewert egy szép Classba kellene rendeznem 
        + a játék elején a játékos kezét törölni 
        - a játék végén az uppto ne essen végtelen cikusba 			
        - rejtélyes nem indul a játék megoldása ( nem figyelek az ini-re az ütemezőt kell átdolgozni )

        + prepare battle screen
        + végelszámolás
          - animálni a megszerzett jeleneteket 

        -+ autoplay 
        - kiirni ki a döntéshozó
        - kiirni valahova az aktuális scene nevét
        + a nincs scene színvilágát kitalálni 
        + avatár alatti helyzet csíkok
        + felszerelsnél összesített ikon lista					
        - felszerelés csatolásnál a felszerelés nevének is kint kellene lennie , de lehet hogy csak vagy neve / vagy képe 
          - felszerelés descriptjét az ikonsor alá rakni. 
          - ráklikkre card nézetbe. 
          - animOvera felszereltkaraktereket szélre mozgatni 					
          // nagy kérdés, hogy erre szükség van-e ?


  - jelző pakli méretét is változtani kellene a benne levő lapok mérete alapján 
        + animációk sebességének állíthatósága				
  - inPlay karakterek egymás felé forduljanak
        + jól láthatóan megjelenítani az eredményt, hogy valaki nyert , ki kit támogatott vagy épp eszkalálás volt
        - számpörgetős animációk 

      -+ interakciók beillesztése a switchMatch kliens oldalába 
        + avatar kivjátszása 
        - ha lehet tárgyat hozzárakni akkor annak az eldöntése ( több közül választási opció )
        + more or action 
  - select boss		
    - boss anim to front .. meanwhile hand goes down 
  - escalation / support choice 
  - skillek interakciója -> ES6
    - könnyen beilleszthető legyen 

      + new unique serial system :: VVVV.BBBBB.88..   V - card standard serial B - unique number .. 8 - skill improvements   - - Cards.byUnique(  ) - ből generálja le a kártyát
        - server side too

        Ez egy komoly változtatás lesz a programba, és a szerver oldalhoz is hozzá kell nyúlni, csak akkor van értelme. 

      -+ card rendering optimalizáció 

        e lapok fix részét lehetőleg csak 1x lerenderelni, a felirat részt is külön. Esetleg még alap ikonokkal is, de az már krédés. 
        Az inplay-ból persze kellene egy bal és egy jobb renderelés is.
        Ha a kártya tudná, hogy már megvan-e a lerenderelt alap ( ami a játékos lapjai esetén elég hamar meg fog történni ) akkor elég csak azokat előkapnia, és utána 
        módosítani ha szükséges. 
        - base card bake -- ez egy csúnya hibával leáll, szerencsére az optimalizáció nem TOP PRIORITY 
        + bake when created 
        - SwiperBase érzékelés az optimalizált lapokkal 

  - ütemező hibáját kijavítani -> ES6
    - prepareStacio - - inspect :: why don't start play game time to time 
    - ha megszakítom a játékot a mainba lépéssel akkor utána nem tudom újra indítani. 
      Le kellene követni a folyamatot 
    - A Playernek mindenképpen kell egy sitToTable funkció ami alap helyzetbe hozza a pakliját, pontjait meg minden !

      - detailed info about scene / game stacio on info line click 
      + game play time count 
      + PIXI.Text.setWarp( wide )
      + card with text		
      + card render with skeleton 
  - skillek használata 
    + típusonkénti szűrés ::
      + Object.keys(skill).filter( k => skill[k].hcrb == 'H' )
      + Object.keys(skill).filter( k => skill[k].hcrb == 'B' ).map( k => skill[k].name + '  >  ' + skill[k].descript )
        console.log( Object.keys(skill).filter( k => skill[k].hcrb == 'H' ).map( k => skill[k].name + '  >  ' + skill[k].descript ).join(CR) )
    + skill deploy anim info line 
      - item + actor info line in separate anim 
    - skillek animációja
    - skill és játékmenet szerinti minimálisan gondolkodó AI 
    - skill HBCR egy fel icon jelezze az ikon sorba 

      + gravitonzone DB beépítése a programba 
        - .. a szerverre DB is 
        + gravitomzone.com el van foglalva ?

      - online test version 
        - ingame forum 
      + font change test 
        + 2 font test				
        + beépíteni egy nagy fontkészletet library nevek és scene ninplay nevekhez 
      + middle infoLine test 
      - auto fight view play actor anim 			
  - menet közben is lehessen váltani - player / AI / viewer - között 
  - kijavítani a szerveren az új acc létrehozását - kezdő pakli és collection		

      + optimalizálni a swipe megjelenítését mert 252 lapnál már itt is lassú, csak azt a 4-5 lapot kellene megjeleníteni ami épp a képernyőn van.	
        - további optimalizáció 
        - swiperek működése wheel-re is. 
        - swiper méret jelző csík 
      - library content swipe 
      - library professions and attributes 
      - main page animation and news and valuse 
        - 3 experience bar 
      - library 2W / 3W kártyák megjelenítése 
      -+ 2W / 3W kártyák kidolgozása
        - swiperekbe berakni őket. 
        - ha van 3 lap a kezemben és nem tudom felhúzni a 3 széles lapot akkor >> NEVERENDING ! TODO 
  - online library edit
    - könyvtár összekötás az adatbázissal
      - editor kijavítása 
        - tab
        - focus 
        + password 
        - sorvég ugrás
        - nincs 1 soros maximált karakterszámú verzió
        - end / home ne függjön a textArea méretétől.
        - sor eleji space-ek elvesznek 
        - MINIHTML - iconok / képek beillesztése - szerkeszthető formába egy "szöveg mezőbe - mini HTML"


      - server - client relációban nyomonkövethető játékos aktivitást szimulálhatnak
        - lapokat gyüjthetnek 
        - fejleszthenek
        - vásárolhatnak
        - mission tevékenységük rögzítése és szimulálása 			
        - multiplayer játék szimulálása 
        - valódi multiplayer játék - másik játékos ellen
        - adatbázis kiszervezése a kódból ( kérdéses - simán lehet egy belinkelt DB-ből generált js-t ami úgy módosítás nélkül menne )
        - hack protection 
          http://securityaffairs.co/wordpress/33487/hacking/40000-vulnerable-mongodbonline.html
            + check and don't work 
            server.answer({order:'login',name:{'$gt':''},password:{'$gt':''}})
          https://docs.mongodb.org/manual/administration/security/

          https://github.com/andzdroid/mongo-express
        + backdoor

      - browserversion
        - test on different browser 
              >> http://kangax.github.io/compat-table/es6/ ES6 function by browser 
              >> http://caniuse.com/
              >> https://crossbrowsertesting.com/
          - IE alatt nem megy
        - test at different devices
          - make device check list 
        -+ minify all image element 	
        - legacy text to files 
        - face book beépítési lehetőségek 
          - beépítés szabályai, stb. 
        +- minimize and obfuscate code 
        + http://beta.html5test.com/   browser test site 
          ++ még a telómon is fut - igaz tetü lassan a chrome browserben !! KIHAL 
        - client side security 
          https://developer.mozilla.org/en-US/docs/Web/Security/CSP/CSP_policy_directives

          át kellene nézni nagyon 

          <meta http-equiv="Content-Security-Policy" content="default-src *; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com/css http://fonts.googleapis.com; script-src * 'unsafe-inline' 'unsafe-eval'; img-src 'self' data:">	

  - filter és search funkciók a swiperekhez

  - mission view pontos kialakítása 
    + mission monológok megoldása 
    - mission line ellenfél paklik kibalanszolása 

      - avatar system
      - gatherign system 
      - achivement system 
      - trade - a teljes kereskedelmi rendszer kialakítása, lapok, boostere, egyéb extrák ( pld spéci kártya keretek, avatárok )
      - rival ( 1 vs 1 )
      - global 
        - multiple game play view megtervezése 
      - deck build with server save and load 
      - training 
      - friends
      - server egy játékos játékmenetének a követhetősége - history 
      - team
        - team forum 				
      - ui elemek efektjei és animációi			
        + SCREEN -ek átvezető animációja  // uppto 
        - effektes átvezető animációk			
      - help system
      - popup system ( csak desktopon van értelme )
      - tutorial system			
      - egyetlen szó :: LOCALISATION !! 
      + strict JS code
        -+ ES6 version 
        - ES6 elemek kiszedése a kódból :: babeljs.io - js compiler - és kód ellenőrzésre is jó 
          - csak az off ES6 browserek miatt érdekesk 
        + ES6 képes nodejs telepítése a szerverre 
        - http://ryanmorr.com/understanding-scope-and-context-in-javascript/ 
          + strict módban az alap this != windows !!


      - game graphics
        - a játék grafikai concepciójának kialakítás 
          - kell-e outline a karakterek körül ?
          - kitalálni, hogy a szereolők mögött legyen-e háttér a kártya verzióban
        - grafikai munkák koordinálása és ellenőrzése 
        - grafika megvalósítása
          - actors ( a szereplőket legalább akkora felbontásba kell megrajzolni,  mint Havaska rajzai )
          - scenes
          - items 
          -+ w2 / w3  "actors" megjelenítése 
          - ui
            - typogrphy 
            + sharp test 
            + sharp font size trick ( maybe sharp 3 is fine ) 
          - icon set 
          - cardborders

      - game web page 
        - lore on web page 
        - forum 

      - e-sport functionality 

      - in game chat ?? 

      - skeleton áttekintése - kihagytam-e valamit 

      - server data backup 
      - server stress test 
      - secure server 
      - cutscene
      - game test 
      - gravitonzone logo 
      ----------------------------- minden más ami még nem jutott eszembe --------------------------------------

      - kőkemény swiper optimalizáció

      - Adminisztráció 
      - Statisztika

      + TODO :: 	valahogy minden lapnak egyedinek kell lenni. szükség van a serial melett az id-re is!! Aminek viszont totál egyediknek kell lennie  
            és ami a persze a lapfeljelsztésnek is az alapja kell, hogy legyen. 

      + ki volt az az elvetemült aki kitalálta, hogy 2w és 3w lapok is legyenek a játékban ??? - én, de már kezdenek működni, de azért lesz még velük gond 

      - scene 
        - ahogy a hős távozik utána minden felrobban 

      + console speed test :: T; ;TT 
      + remove fids from Card 		
      + randome improvement + score
      + canCast
      + inPlay icon sorhoz szereplőnként egy kis összesítő grafika, hány pontot hoz a karakter !
      - látványosabb efektel jelölni, ha az egyik fél nyerésre áll a számok alapján. pld, egy scene oldala bevilágítással a szélén 
      - kötelező kirakáskor - csak 1 lerakható van - lehet autómatikusan ki kellene tenni - egy idő után a szereplőt  -
      - az ellenfélnek is beakad a keze, ha csak tárgyai vannak akkor nem tud húzni, és ha ő a döntéshozó tenni se tud. 
      - azt is kezelni kell ha valakinek az aktív hand/deck lapjai már csak itemek 
      - bug :: csak item van a kezemben végtelen escalation - nem passzol 
      - bug :: döntéshozó W3 escalation - nem tud rakni lapot .. passzal kell kezdenie 
      - history of game play 
      + nodejs 5.0.0 uppgrade on server >> KIHAL >> http://askubuntu.com/questions/426750/how-can-i-update-my-nodejs-to-the-latest-version
      - nagy ugrás lesz a szerver oldalon a var VERSION = 'exoserver : 0.0320.60.053'; console.log( VERSION ) ; exports.VERSION után 
      + make dev server, meanwhile other one is work fine
        - change server by server side
      - security >> http://www.html5rocks.com/en/tutorials/security/content-security-policy/

      + Admin konzol, ahol simán tudok a szerveren kódokat futtatni, 
        + ráadásul még a JSON circular error is megoldva, így szépen konzolban nézhetem az adatokat. 
          + KIHAL szépen átjön a db JSON-ja és tudom tesztelni ... látom a "táblákat"
        + vm.Script teszt also
        +++ ACE editor beépítési tapasztalatok 
        + editor.resize()
        ++ önirónia 
        + start extrém kóding :: KIHAL 
        + a gravitonDB létrehozásában volt eddig a legnagyobb segítség a beépített editor, mivel ezt js-ben lehet könnyen alakítani 

      + használhatnánk esetleg karakter graf ötleteknek divat oldal képeket, pld: http://defacto.com.tr/

      - ha minden kártyának lenne egy korrekt ikonja akkor egy full minimal view verziót is lehetne pick-pack csinálni
        persze ahhoz az animációs rendszert is tovább kellene reszelni, hogy könnyebben át lehessen alakítani. 

       + Threejs over in iframe .... elképesztő 
          http://localhost/three.js/examples/#webgl_materials_blending_custom


          Welcome this is handy feature from future..

          never trust in alien thechnology you are traped by dimensionit escalation ... you have 123231239172 sec to hack the system. 

          But probably you can starve in few days so hurru up ... lost identifyed position is ner Andromeda glaxy or her neighborh .... 


          document.getElementById('effect').style.display = 'block'

      + cordova build android JDK könyvtár beállítva ... ismét működik. 

      - hogyan lehet egy kis C++ +V8(ES6) webGL környezettel mindenféle mobilra fejleszteni ?? - http://developer.android.com/reference/android/app/NativeActivity.html

      - hmm. a chrome-nál 4.4 androidtól már jó a webview :: https://developer.chrome.com/multidevice/webview/overview  ++ WebView v36 ki kell próbálni 

      - 3D nem biztos, hogy az átlátszó kártyalap a tuti renderelés szempontjából, egy lekerekített szélű mesh lehet praktikusabb, akár szélessége is lehet
        a szél material úgy is kb. fekete. Valamint bőven elég lenne W1 W2 W3 mesh 

      + http://stackoverflow.com/questions/25098021/securityerror-blocked-a-frame-with-origin-from-accessing-a-cross-origin-frame/25098153#25098153
       !!! ~[2,3,4].indexOf(5) = 0 ;  .indexOf(3) = -2 ... zseniálisan jobb mint a >=0 vagy a !=-1

       +3D w1 card mesh json by blender :: 3d/w1m3.json

       - image uppload js library >>  http://www.dropzonejs.com/  +FRED

       + http://localhost/gaf/assets/ minimal phaser test 

       + spier15  v: 0.0014 - KIHAL lehet, hogy a js totál jó lesz, főleg ha a telómon is elfut a cucc 
                  Utána le kell tesztelni, hogy mi az a legegyszerűbb történet amit még mobillal meg lehet csinálni. 
                  Kellene egy jó kis textúrázott model amivel lehetne kisérletezni,
                  egy jó kis űrhajó lehetne a legjobb. 

      + try2w3wCardsRendering

      - swiperHealing

      ++ editor_FullScreen

      + gravitonZone Logo Instead Of Exosensei

      - modify card on server with ACE

      ++ 3dSimultantTesting

      + cordovaBuildAndroid

      + phoenChromeBrowserTest

      - cardPlayAs3DModelTest

      + tinyACE editor for speed local testing ES6 / three.js aplications 

      + 12 sublimeText tips http://www.hongkiat.com/blog/sublime-text-tips/

      + nem működik a login és a friends gomb 

      - TODO a játék végét le kell tisztázni meg az összesítő animot is megcsinálni 			

      - Egyrészt a Coroutine-ból esetleg kiszervezhetném a funkciókat a switchMatch -ba , de inkább átírom az egész motort yield alapúra 

      + Azért a switchMatch létrehozásánál elég nagyvonalúan bántam a fázisokkal, például nincs még scene out animnak hely ... sőt! 


        Ha jól látom, akkor elérkeztem arra a pontra ahol totál felborítottam a switchMatch programot a co._ nem annyira szabadonválasztott, mert hivatkozok rá. 
        KIHAL - meglett a megoldás valami meghatározhatatlan okból (na jó tudom miért)  a .phase-t és a .situationt egyszerre használom ennek a kettőnek a kombinációja mutatja meg, 
        hogy hol is tart a játék. 



        Napok óta nem fejlesztettem a szervert, ellenben remélem nemsokára már működni fog a játék maga

        bakker :: http://ryanchurch.com/  -- elképesztően sok helyre conceptelt  ... a pureRef meg irtó nagy segítség a képek gyüjtésébe 

        vajon miért működik most máshogy a kártya felhúzás ? amikor a rih-tot adtam a másik játékos lapjainak akkor kezdődött a probléma. 


        fura eddig a co.DETERMINATE() jól működött ... most valami miatt meghülyült - nem ez jól működik máshol van a probléma. Holnap délelőtt utána kell járnom, hogy rendesen működjön a program 

        lehet, hogy a skeleton.game.play -t mielőtt adatokkal feltölteném le kellene klónoznom, hogy utána játék elején az üres vázból tudjak újra kezdeni. 

        a choicePlay more valami miatt rossz 

        a gfx-nek kellene tudnia, hogy hova kell visszajönnie   

        KIHAL ! kezd alakulni a program, a számtalan hibája ellenére. Mondjuk nem gondoltam volna ,hogy ilyen összetett lesz. Hehe 3 hónapos project :D
          - lehet, hogy ezzel a játékrendszerrel is túlgondolkodtatom a játékosokat 

          Kellene egy nagy gyors megoldás színes / világító űrhajók modellezésére. 

            Azért elképszesztő űrcsatákat alkottak már 3D-ben. Ebben eléggé le vagyok maradva.  
            Csak az a bajom velük, hogy mindegyik logikátlan közelharcban mutatja be az űrharcot. 

            Főleg azért, hogy 3D modelleket is ki tudjak próbálni a játékba. 

        {2015.12.20} KIHAL tegnap Lambert és Klau megcsinálta a csapat bemutatkozó videóját ... szerintem nagyon atom lett - igazi csapat munka volt ! 

          Sorrend a legfontosabb feladatokról amit az elkövetkező 2 nap során még meg tudnék oldani 					

            + PIXI.WebGLRenderer testpage for mobil  KIHAL és működik !! 
              - a gameplay néha lehal, de az valószínűleg az optimalizáció teljes hiánya miatt van. 

            + moneyMoneyMoney, eff, send removed !

            + fix SwiperBase
              + fix FactorySwiper	 
              + fix CollectionSwiper  + KIHAL include W2/3 moving upp and down 
              + fix LibrarySwiper
                + item view 
              - fix out of position 

            + ES6 class extend Array test 

            + child-src blob: KIHAL végre nem dob az ACE errort http://stackoverflow.com/questions/32381070/chrome-45-csp-child-src-for-blob

            + hide skeleton.game.play.floating.stepp.pixi.visible = false 

            + try switchMatch ES6 						
              - solve ES6 based game play 

            +- html elment render to PIXI.Texture test  - nem lehet ... jelenleg 

            - setup page 

            - better actual result indicator 
              + funkcionálisan beépítve, de kikapcsoltam, mert így még ronda volt.  

            + kellene egy pozícionáló script 
              - már csak finomítani kellene 
              + eredmény:: 
              // .55  340,319 --> mission  s = PIXI.Sprite.fromImage('img/scenes/ls23.jpg'); stage.addChild(s) 

            + compactMatch.js 4524 line :o  
            + szépen fut is 
            + Card, Deck, Allyers, Coroutine, Player átdolgozása ES6 class -ra 

            - syntax highlight extends  http://docs.sublimetext.info/en/latest/reference/syntaxdefs.html#the-patterns-array

            + profession fix 						

            + a game animban a card go out -nak sokkal informatívabnak kell lennie, mert így nem annyira érthető. 



            - Legyek objektív - szerintem ennek a játéknak nem lesz ennyire költséges a 2d grafikai munkája, legalábbis semmiképpen se annyira, 
            mint ahogy Klau felvázolta Y16-ban, ugyanakkor jelen pillanatban még nagyon garázs cég vagyunk, amivel nincs is semmi baj, 
            viszont szerintem 1 kicsit jobban pörögne a történet, hogyha 1 térben lennénk, napokig. 

            + 4-6 player gameplay setup design 

            {2016.01.06} TODO

            + új icon set legyártása
              + alapfileok átmásolása
              + profNevekKiosztása
              + nagy icon textúra legyártása
              + beépítés

            + actor play help :: PLAY_HELP

            + main screen rework
              + amount reposition
              + add some panel preview graphics 
              + questBar, rivalRunBar, factionBar turn on 
              + simplify loader screen 
                - and make loader bar 
              - info finger -- balról behúzva egy animált kört rávéve a dolgokra ad infót .. mindenhol 
              - middle chat line a panalek szétmozognak, kicsit bedőlnek és közben látszik a chat 

            + forum() + Forum on server side 
              + Forum.find({msg:/Story/},daerr)
              + Forum.find({},daerr).sort({wroteDate:-1}).limit(20)
              + az eredményt visszakapom az editorban ... elég durva megoldás KIHAL 


            - Editor rework 
              + es6 class 
              + line error 
              + starter /s problem 

              - cursor apear just on focus 
              - home / end 
              - tab to another editor
              - single or multi line 
              - #inputbox delete after SCREEN change 
                document.querySelectorAll('textarea')
              - átnézni a PIXI wordWrap -ját line: 18206

            - rework library 
              - fix swipers								
                - porper scene and w2/3 content view 
                - W2/3 as W1 nézet !!! ez a kemény! 
                - content database edit with server 
              - content swipe 
              - conten image change 
                - local save
                - server save 
              - content text edit 

            - show who is the UMPIRE !! 

            - story line data represent 

            + js speed test >> profiles 
              + little html optimalisation 
              - remove three.js 
              + audits megmutatja a feles CSS-eket 
              + a timeline és a profile is nagyon hasznosnak tűnik
              - server oldalt hogyan kössem össze ezekkel ?
              + texture packer teszt :: meg kell venni mindenképpen játék fejlesztéshez alap, és tud titkosítani is!

            - swipererk beépítése a skeltonba ne csak így magukba lézengjenek! 

            - gameplay to full animated es6pve

            - ES6 Desk connect to FISH ! 						

            - make new professionicons.png with new icon graphics too!
            - training ui 

            - game play situation overview Screen 

            - mission ui 
              + scene iconline position 
              + card.descript test ... it is fun 
              - correct work with server 

            - js spreadsheet https://github.com/handsontable/handsontable

              ki kellene próbálni, mert az adminisztrációs feladatokban lehet, hogy sokat segítene. 
              ez a megoldás is a vegyes HTML/PIXI megoldás felé mutat. 

            ++ closure compiler 

             java -jar /e/soft/closure-compiler/compiler.jar --language_out	ECMASCRIPT6_TYPED match.098.js match.min.js

             java -jar /e/soft/closure-compiler/compiler.jar match.js --language_out=ES5 >> match.min.js 
             java -jar /e/soft/closure-compiler/compiler.jar gravitonDB.js --language_out=ES5 >> gravitonDB.min.js

             KIHAL ES6-ra nem tudja fordítani, viszont szépen átteszi ES5-re !! ami még fontosabb!! 


    A rogmor fejlesztés tapasztalatai szerint mostmár nagyon is itt lenne az ideje az online játék adatbázis fejlesztésnek, 
    legalább egy chat vagy egy log beépítésének, mert mindenképpen praktikus lenne, az egésznek az a rákfenéje, hogy 
    PIXI alatt nincs szövegszerkesztő, persze lehet, hogy egyszerűen egy jól pozícionált opaque HTML text area-val lehetne 
    a legkényelmesebben megoldani az egész problémát. Minden esetre vagy az egyikre vagy a másikra el kellene szánnom magamat. 

    + szerver teszt 

      CardDB.find({serial:'PK1A'},(err,d)=> ws.answer(d) )
      var ez ='Uzenet a szervertol'
      ws.answer({ez})

      // minden user adata
      Account.find({},(err,d)=> ws.answer(d))


*/

  /* ------------------------------------------------------------[ ES6 know-how  http://www.2ality.com/2014/08/es6-today.html ]


    var/let aa = [1,343,2,3,44,2324,2]
    Math.max(...aa)

    a = [...aa]  // clone array ?? yes!

    new Date(...[2011, 11, 24])

    '7'.repeat(3)

    new Array(3).fill(7)

    python: [7]*3 

    arr = [5, 1, 5, 7, 7, 5]
    unique = [...new Set(arr)]

    a new Promise .then-t kellene jól kiismerni érzésem szerint 

    - [Symbol.iterator]	

      miért is hasznos ?  http://jsrocks.org/2015/09/javascript-iterables-and-iterators/

      lehet ha jól kiismerem akkor még a switchMatch-ot is át tudom erre írni ... na az kellene csak 
      viszont az, hogy a 

      for( char of "Na igy kell kezelni az iteratorokat ") console.log( char )

      a = [1,2,3,4,5]

      i = a[Symbol.iterator]()

      i.next() // 1
      i.next() // 2

      a.splice(3,1) // [4] remove from a

      i.next() //3
      i.next() //5

      Már nem gyeng!

      Ha szépen végig lehetne lépkedni egy Object -en az lenne a hab a tortán +++ :) nem is akárhogyan 

      http://www.2ality.com/2015/02/es6-iteration.html

    http://www.2ality.com/2015/03/es6-generators.html

      akkor elképzelhető, hogy switchMatch valami hasonlóra lenne lecserélhető ?? for( game of co ){ view(game) }	
      úgy, hogy közben még a logikáját is könnyebb lenne átlátni ?? Akkor mondjuk lenne értelme a generátoroknak meg az iterator -nak 

      hmmm.. lehet egyszerre 2 probléma is megoldódik, főleg ha a promis is működik, ha csak ki nem derül, hogy a "hagyományos" 
      switch -es módszer gyorsabb és jobban átlátható ( az valószínű )

      Ebben konkrét példák vannak a Cooperative multitasking -ra .. ami igen csak érdekes lehet ( ha csak nem tudom ES5-ben könnyebben megoldani )

    KIHAL >> péntek 13 .. harmadnapra feltámad .... A hit és a relatív idő ... totál nem 24 órás napokkal számol a Biblia !
    Miért is hívják fekete pénteknek ... tuti tudjuk ki műve.

    http://www.2ality.com/2014/12/es6-symbols.html

      Hmm.. a Symbol-t is lehet iterálni ... keverem a Set-et a Symbol-al 

      a codepen.io-n könnyebb tesztelni a strict kódot.. 


      https://greensock.com/drawSVG -- + FRED hmmm ?

    https://fitzgen.github.io/wu.js/  van egy bináris fa is a példák között !

    Szép asyncron file request generátorral és hibakezeléssel 

    https://davidwalsh.name/async-generators

    ++ ha minden igaz van modul amivel az URL-ek klikkelhetőek lesznek ... az nagyon hasznos lenne 
    https://github.com/leonid-shevtsov/ClickableUrls_SublimeText
    jobb klikk felső menüpont !!

    {2015.12.21} - Rilla 20 éves .. hihetetlen hogy telik az idő 

    QingCi html5 game editor just not publish 		
    https://twitter.com/sailing8036/status/628922280282734592

    vagy ?
    https://github.com/TheMightyFingers/mightyeditor
    leszedtem .. be kell állítani hozzá a szervert ... nem most játszok vele 
    localhost/mightyeditor/client

    + Igornak valamikor az EVE -ből hogyan lehet kivenni karaktereket tutorial  - megoldotta 

    Nincs kedvem folyamatosan cserélgetni az embereket. 
    Meg a játék sztoriját. Minden esetre ezt az editort is hamarosan pofába kell ráznom, 
    hogyha nem akarok beépíteni egy jó bonyolult külső megoldást ... vagy egy "egyszerű over HTML-t"
    Sok szöveg bevitelhez lehet, hogy az kedvezőbb. De ebből is tanulok, és már félig kész is van, csak ne dolgozzak feleslegesen!

    - Telefonon a font nagyon nem működik!

*/

  const isFound = (arr, value) => arr.indexOf(value) >= 0 // console.log( isFound( [1,2,3,4,5,6,2,4] , 6 ) ,'isFound'  )

  // végtelen iterator http://www.2ality.com/2015/02/es6-iteration.html

  this.naturalNumbers = function() {
    let n = 0;
    return {
      [Symbol.iterator]() {
        return this;
      },
      next() {
        return { value: n++ };
      }
    }
  }

  // this.aa = function(n){let [a,b,c] = n; return [a,b,c]  } // [0,1,2]

  // KIHAL! ez mostmár majdnem jó, csak 

  this.objWalk = function*(po, set) {
    set = set || new Set()
    if (po instanceof Object && !set.has(po)) {
      set.add(po)
      yield po
      for (let k of Object.keys(po, set)) { yield* this.objWalk(po[k], set) }
    }
  }

  this.objFilter = function*(po, fil, set) {
    fil = fil || (() => true)
    set = set || new Set()
    if (po instanceof Object && !set.has(po) && fil(po)) {
      set.add(po)
      yield po
      for (let k of Object.keys(po, set)) { yield* this.objFilter(po[k], fil, set) }
    }
  }

  // T;a = [];for( u of zone.objFilter( skeleton.game.play , p => !!p.keydot ) ) a.push(u);TT 
  // szűréssel már sokkal jobb! 
  // po means parameter object 

  // kicsit talán már túlkonspiráltam , az 5 paraméterből 1 is elég 
  /*

  po 		- object
  fil 	- filter
  kfil 	- key filter
  set 	- skipp this objects
  k 		- actual key 

*/
  Object.walk = function*(po, fil, kfil, set, k) {
    fil = fil || (() => true)
    kfil = kfil || (() => true)
    set = set || new Set()
    if (po instanceof Object && !set.has(po) && fil(po, k)) {
      set.add(po)
      if (kfil(po, k)) { yield po }
      for (let key of Object.keys(po, set)) { yield* Object.walk(po[key], fil, kfil, set, key) }
    }
  }

  // KIHAL , vigyázat nem szabad végtelen for of-ban használni  !!!  
  // v2 :: i @ ha értéket adsz neki akkor az n. elemnél kezd  , sőt nem baj ha túlszámolom 
  this.circular = function*(arr, i) { i = i || 0; while (true) { yield arr[i++ % arr.length] } } // ez is egy szép megoldás: ++% 

  // JSV7 = JS + ES6 + V8

  // https://strongloop.com/strongblog/introduction-to-es6-iterators/


  // greatest help 4 Promise !! 
  // http://www.html5rocks.com/en/tutorials/es6/promises/

  window.wait = (msec) => { // for( i of Array(5)) wait(5000) !!! 

    return new Promise((resolve, reject) => { //log=+new Date()

      setTimeout($ => resolve(), msec * Math.random())
      setTimeout($ => reject(), msec * Math.random())

    }).then($ => log = 'Win').catch($ => log = 'Lost')

  }

  // KIHAL ez szuper! 
  // console.time(123);Promise.all( Array(50).fill(1).map( $=>wait(1000)) ).then( $=>{log='----[ tournament is over ]----';console.timeEnd(123)})


  // for( u of Object.walk( skeleton.main , (o,k)=> k=='backToMain' )) log=u
  // ennek is működnie kellene, de csak így működik :: 
  // sel=[];for( node of Object.walk( skeleton.main , (o,k)=>{ if(k=='backToMain'){sel.push(o)} ;return o.ui } )) 1;sel.map( o=>o.keydot )
  // ezt csak menet közben tudja gyűjteni, mert egyébként nem megy végig, erre még ki kell találni valamit , de nem most 

  // s=new Set(); for( n of Object.walk(skeleton.main, (o,k)=>{ o._k=k ;return o.ui} )) s.add(n._k)
  // for( n of Object.walk(skeleton.main, o=>o.ui , (o,k)=>k && ~(k.indexOf('ard'))  )) log = n.keydot 

  // csináltam belőle gist-et 
  // https://gist.github.com/Pengeszikra/be44f18701eb75f495d2

  /*

T;a=[];for( u of zone.objWalk( skeleton.game.play ) ) a.push(u);TT

szépen végigmegy és talál 2880 elemet ... kicsit durva!

ha több helyen is szűrünk akkor viszont villám gyors! 

T;for( u of Object.walk( skeleton.main , o=>o.keydot )) if(u.img) log = [u.keydot,u.img].join(':');TT

*/


  /*

  for( u of zone.skWalk(skeleton.main)) console.log( u.keydot ) - KIHAL alapvetően jól működik 

  Ez szerintem elég tanulságos az ES6 generátor lehetőségeit illetően

  főleg, hogy így akár: ui-ra is tudok filterezni 

  for( u of zone.skWalk(skeleton.main)) if(u.ui == 'screen') console.log( u.keydot )

  ezt kerestem !! 

  for( u of zone.skWalk(skeleton.main)) if(u.callTo && u.callTo != 'main' && u.callTo.split('.').length == 1 ) console.log( `${u.keydot} - ${u.callTo}` )

  KIHAL! szettel megoldottam, hogy ne essen végtelen ciklusba !

*/

  /*
this.skWalk = function* ( po , set ) {
  set = set || new Set() 	
  if ( po && po.ui && !set.has(po) ){ // csak az ui-kon megy végig 
      set.add( po )
      yield po 
    for(let k of Object.keys( po )){ yield* this.skWalk( po[k] , set ) }
  }
  // else { yield po }
}
*/

  // behelyette ez már univerzálisan használható  ::
  // T;a = [];for( u of zone.objFilter( skeleton.main , p => !!p.keydot ) ) log=u.keydot;TT

  /*

  Az ES6 generator based rule system beépítése ... remélem gyorsan kiderül, hogy mennyire hasznos a 
  skillek kezelésében és az új stabil client/server architecture felépítésében

     --az előző verzió prof számolásának kijavítása 
     + DB.scenes és DB.actors pa összehasonlítás ! trait !!
      s = new Set();DB.actors.map( a => a.prof.map( p=>s.add(p.name) ) )
      ss = new Set();DB.scenes.map( a => a.prof.map( p=>ss.add(p.name) ) )
      for(n of ss) log = n+' : '+s.has(n) 		 	
      traits = {};for(n of ss) traits[n] = { name:n , act: 0 , scen: 0 , itm:0 }
      DB.actors.map( a => a.prof.map( p=> traits[p.name].act++ ) )
      DB.scenes.map( a => a.prof.map( p=> traits[p.name].scen++ ) )
      DB.items.map( a => a.prof.map( p=> traits[p.name].itm++  ) )


    + co with n player 
    - új megjelenítés, ahol nem kell a lapokat újra renderelni, mindegyiket elég 1x // inPlay , inHand 
    - lehetőség egy megadott fázisra ugrani ha kell 
    - interactor cserélhetősége
    - viewer cserélhetősége
    - lehetőség, hogy a szerverről kapjak játék állást, illetve az vezesse a játék menetet 
    - n játékos megjelenítés csak a viewer és az interactor cseréjével 
      + 4 és 6 játékos interface terv 
      - add two complex skeleton element ... hogy csak a módosításokat keljen belerakni a többjátékos skeletonba, ne keljen kopizni az egészet Object.assign 
    - skillek beépítése
    - szükséges skill inetrakciók beépítése 
    - az es6pve használat során az autoplay tudja, hogy nem switmatch generálta a történetet 

    - FISH - Fly, Interaction and Server Handling !

    - THREE + VR :: http://www.sitepoint.com/bringing-vr-to-web-google-cardboard-three-js/

    - stereo GSLG render https://www.shadertoy.com/view/lsSGzh

    - stereo speed up ::  http://benchmarkreviews.com/33851/vr-sli-accelerating-opengl-virtual-reality-with-multi-gpu-rendering/

    KIHAL http://www.manuelbastioni.com/ ez ment meg egy csomó munkától ! 

    http://dmradford.com/tutorials-2/character-creation-in-blender-the-rhino-part-1/

*/

  /* Elite tiers - - 

    // http://mutik.erley.org/

    Butcher		50
    Caster  	100
    Warrior  	100
    Killer		60
    Whisper 	125
    Murderer 	100
    Riders 		150
    Mangler		150
    Malleus 	200
    Cecile 		300
    Fear 		100

  */

  /* Star Citizen 	

  bpy.ops.view.fly3d()

  nagyon durván totlják 

  https://robertsspaceindustries.com/pledge/ships

  https://robertsspaceindustries.com/starmap

  Pontosan mire is gondolok, hogy egyedül mit tudok ezekből a látványokból megvalósítani. ... Jó kérdés ... 
  ráadásul egy 4GB-memóriás géppel. Elég naív elképzelés ... KIHAL viszont megvan, hogyan lehet egyszerűen fényeket 
  és textúra részleteket varázsolni egy sculptolt modelre 

  viszont nincs olyan nagyon sok űrhajókuk, azok viszont szépen ki vannak dolgozva

  textúrákat kellene összegyűjtenem . 


  ez volt ami rávezetett a megoldásra
  http://blender.stackexchange.com/questions/31399/in-cycles-material-how-to-get-stencil-effect-similar-to-blender-internal-materia

  KIHAL ... mostmár tudok összetett layeres anyagot festeni cyclesben ! 

  Blender ::

    - össze kellene szedni egy új mappába a használható textúrákat, vagy csinálni újakat, 
    illetve egy szoba részletet, összetett anyaggal megoldani .. átlátszó köd layerek akár,
    illetve egy normal vektor felszín távolságot tartó editort építeni js-ben. 

  modell .. 10k .. elég minimál .. ezért egy roncs autó, ami még lebeg is. :) 

  Egyszerű játékkal is lenne mit keresni a google store-ban, csak etetnie kellene magát 

  Ki kellene tesztelni, hogy mondjuk 3D-ben mit bír a telóm .. illetve gyors GPU-s apk-t is kellene fordítani. 
  EGy szép modellel. .. körhinta pld. 

  Kispest Okmányiroda :  06-1-896-3538
  1-347 4559 + 1
  1-347-4925 

  http://www.dimo.hu/hu/cegek/10545/Budapest_Fovaros_XIX._kerulet_Onkormanyzat_Okmanyirodaja/Okmanyiroda/Budapest

  06 (1) 347-4902
  06 (1) 347-4903
  06 (1) 347-4904
  06 (1) 347-4906

  06 (1) 896-3536 +++
  06 (1) 896-3533


  kötelező biztosítási kalkulátor 
  https://www.aegon.hu/kotelezo-biztositas/kotelezo-biztositas-kalkulator.html?KNEV=P%C3%A9ter

  ajánlat sorszáma: 
  312794622 - 181220 Ft. 


  Hogyan csináljunk szép játék modelleket ?

    Lassú de precíz módszer. 
    - http://www.cgmasters.net/free-tutorials/what-to-know-when-creating-next-gen-assets/

    Enviroment how to use objects to speed upp process
    - http://www.cgmasters.net/free-tutorials/gamedev-4-modularity-odd-angles-on-blenders-grid/


    - blender random level generator script 
    http://blenderartists.org/forum/showthread.php?389739-Random-Level-Generator	

    Kickstarter ami nem jött össze:  
      https://www.kickstarter.com/projects/1016311142/galactic-insomnia


    AO kellene, hogy jobban kijöjjenek a részletek. 

    http://threejs.org/examples/webgl_postprocessing_ssao.html
    http://alteredqualia.com/three/examples/webgl_postprocessing_ssao.html  - - ez nagyon szép és vannak benne lámpák is. ráadásul fém felület enviroment-el 

    sok minden leírva a bevilágításról 
    https://people.mpi-inf.mpg.de/~ritschel/Papers/SSDO.pdf


*/


  /*	Work with unreal editor UE4


  mobil tapasztalat ( anyag beállítás )
  https://www.unrealengine.com/blog/uppercut-games-talks-mobile-development

  unreal.js !! :D ezt tuti ki kell próbálni. Nem szívesen kukáznám az elmúlt év munkáját. 
  https://github.com/ncsoft/Unreal.js.git

*/

  /* Krisz 

Szia! 

Egy kicsit le kellett, hogy higgadjak és meg kellett emésztenem azt amilyen stílusban írtál az elmúlt napokban. 
Ismersz, hogy nem vagyok egy hirtelen ember és nemet se mondok szívesen, főleg ha egy szerelemgyerek projektről van szó.
Mint a legutóbbi levélből kiderült, te totál nem bízol benne, ha jól vettem ki a szavaidból akkor a 2D-s verzióban 
egyáltalán nem. Én nem így vagyok ezzel, szerintem abban több játék van és szélesebb rétegekhez eljuthatna, szóval nem értelek,
De tudod, hogy észrevettem a változást a befektetőkkel való megbeszélés után, és amikor jöttél már fel is volt vázolva a 3D-s verzió. 
Így nem értem, hogy akkor szeptembertől miért nem kezdtünk valami másba, ami neked is a szívügyed, vagy amitől bevételt remélsz. 
Én magamat jó programozónak és grafikusnak tartom és láttad, hogy milyen szinten értek a 3D-hez ( nem csináltam még játékhoz textúrázott modelleket ),
nem is dolgoztam azokkal a programokkal, amiket a játékipar használ. 
A megbeszélésen az optimizmusom, és a szűkre szabott határidő miatt mondtam 1 hetet a látványterv elkészítésére. 
Viszont ami grafikákat menet közben küldtem azokra nem kaptam tőled semmi érdemi visszajelzést. ... mindegy. 
Az már csak a hab volt a tortán, hogy a tesztek során ( mivel a THREEjs sok mindent tud, de sok mindenre nincsenek bevett megoldásai ), derült ki, 
hogy nagyon gyorsan elérem azt a határt, amikor szó nélkül elszáll a dolog. Tehát megdőlt az, hogy szabadon használhatok high poly dolgokat. 
Illetve vért izzadhatok az anyagokkal. Ekkor döntöttem úgy, hogy a 3D demót nem js-ben csinálom meg, mert akkor még 2 hónap múlva is a render engine 
és a scene editor életre keltésével dolgozhatnák, tudtam erre nincs idő. 
Az amúgy nem lett konkrétan megbeszélve, hogy milyen minőségű cuccot vársz. Csak annyi, hogy meggyőzze a befektetőket ( nem ismerem az ingerküszöbüket ). 
Átgondoltad, hogy egy ilyen munkát hány ember, milyen háttértudással mennyi idő alatt készít el?  Illetve, hogy ez mennyi részfeladatból áll? ( azt vázoltam a pontokban )
A sztori kitalálásán kivül minden rám lett testálva és szerintem nem kell elbagatellizálni a látvány vagy a működés részleteit.
( itt az én hibám,hogy hitből es lelkesedésből elvállalom a dolgokat, még ha azok túl is nőnek rajtam )  
Én most is hiszek amúgy a dologban,de egy óriási nyomást tesz rám, hogy te nem bízol bennem illetve magában a projektben. 
Azért is dolgozom rajta napi 10-12 órát, még hétvégéken is. 
Az Unreal enginre való áttérést a Quixel program hozadéka volt. Az nagyság rendel felgyorsítja a modellek textúrázását. Viszont az így elkészültek már 
nem működtek a js-ben ( ami linket küldtem a PBR renderről az persze azt bizonyítja, hogy nem megoldhatatlan és még talán a babylon.js is tudta volna kezelni, de annak a megismerésével 
már tényleg nem akartam extra időt tölteni ). Maradt a Unity meg az Unreal, kipróbáltam mindkettőt és az UR4 nyert nálam, a Unity lehet, hogy kényelmes meg minden, 
de nekem valahogy nem áll kézre az anyagkezelés, ellenben az UR4-el. Amivel fényévekkel jobb eredményt lehet elérni, mint amit blenderben tudnék produkálni. 

Workflow: A blender megmarad tisztán a modellek elkészítésére. A Quixel a textúráké és az UR4 a jelenet összerakására, az anyagok beállítására és magára a demóra. 

Miközben az egészt ki is kell találni. A lehetőségekhez képest konzekvensen kitalálni. Így született meg az SK. Illetve annak a pontos mérete, és nagyjából a belső elrendezése. 
Elkészült az űrkikötő alapja az ott állomásozó hajókkal. Mindezek js-ben és ur4-ben is bejárhatók ( a folyosó rendszer még nincs kidolgozva ). A végső poénban szereplő űrhajó fülkéjén 
kívül az összes fontos helyszín megvan. Mindezeket persze részletezni kell felszerelni, szobákat, folyosókat, tereket kell kialakítani. Figyelemmel az általános méretarányokra. 

- más -

A kölcsön, akkor amikor kértem fontos lett volna, így 4 napom elúszott, annyit kellett Bp-re rohangálnom ügyet intézni, illetve megkedveltem a zsíros kenyeret. 

Beszéltem Lamberttel: Nem ő iratkozott le a Nullpoint csoportról, nem beszéltél vele! 

A játékfejlesztés szerintem valahol az álomvilág megvalósításáról szól, mindemellett már az első héttől teljes gőzzel azon dolgoztam ( dolgozok ), hogy ezek realizálódjanak. 
Ennél többet nem tudok tenni. Nem én voltam az aki a kártyajáték mellett döntött. Sőt végig igyekeztem követni a "fordulatokat". 

üdv,
P.




szia Krisz!
nem valaszoltam egybol,mert kicsit le kellett hogy nyugodjak,meg kellett emesztenem amit irtal,illetve amilyen stilusban.
en nem vagyok egy hirtelen ember es nehezen mondok nemet is,plane olyan dolgokra,amiket szeretek es lelkesit.
gondolom,hogy neked sem lehet konnyu,de te is bevallaltal vmit,megpedig hogy anyagilag finanszirozod a projektet.
szerintem en sem arultam zsakbamacskat magammal kapcsolatban. elsosorban jo programozonak tartom magam aztan grafikusnak.3d szakember pedig nem vagyok.
ha egy kicsit is belegondolnal a tenyleges munkaba,akkor tudhatnad(es tudnod is kell),hogy ilyen volumenu dolgokat nem egy ember csinal. 
a sztori kitalalason kivul minden ram lett bizva es nem kell elbagatelizalni a latvany vagy a mukodes reszleteit
( itt az en hibam,hogy hitbol es lelkesedesbol elvallalom a dolgokat,meg ha azok tul is nonek rajtam) 
most is hiszek amugy a dologban,de egy oriasi nyomast tesz ram,hogy te nem bizol bennem illetve hogy a 2d-s verzioban pl nem hittel.
hogy mikorra lesz kesz? a heten a latvanyt igyekszem befejezni. a marc 31-i hataridohoz ti ragaszkodtatok,en ehhez merten gondoltam hogy egy het alatt meg kell lennie a latvanynak. nem lett meg,mert tobb problemaba utkoztem, mint gondoltam elsore. egy profi 3d-s lehet hogy kisujjbol kirazza, nem tudom.
nem akartam nemet mondani, mert szeretem csinalni es hiszek benne,es mert szamitottal ram.
te is biztal bennem, en is benned. 
ha hiszed,ha nem,nem 8 oraban dolgozom a projekten es en is azt szeretnem ha jo lenne. 
ha ugy erzed hogy ez nem megfelelo akkor azt mondd. az oszinteseg sokkal kifizetodobb,mint a nagy szavak es mellebeszeles.
hangsulyoznam,hogy megertem a te problemadat is,te viszont ugy tunik az enyemet nem. de ez nem csak a te hibad,az enyem is...rosszul kommunikalok...


azt mondod,nincsenek finanszirozasi problemaid,csak nem akarsz doglott lovat etetni... 
oke.
de akkor mennyire is biztal ebben a dologban egyaltalan? barmikor is...
ereztem en tobbszor,hogy nem minden koser,de akkor miert nem fujtad le a dolgot mar az elejen? 
miert mondtad mindig hogy ilyen-olyan fasza lesz, befekteto lesz, palyazunk, miert porogtunk/porogtem ra akkor? en se szeretek foloslegesen dolgozni, foleg egy ilyen szerelem temaban. akarhogy is,de a sajatomnak erzem. kitartani kene,nem csapongani.
ha meg ennyire nem biztal az egeszben, tenyleg mire volt jo ez az egesz?
vmilyen szinten emberek eletevel jatszadozol(en sem uri passziobol kertem volna kolcson) de ha mar az elejen tiszta lappal inditasz,akkor mar lehetne fix, bejelentett melom is. lehet,nem ilyen elvezetes,de legalabb nem ilyen stresszes. te meg itt dobalozol 20%-okkal...!
szoval doglott lo vagy sem,szerintem te se tudod,hogy mit akarsz.

p.s. lambert keresett,mondta hogy kiraktad a csoportbol,de nem beszeltel vele....

hat hogy mennek igy a dolgok?!

--

Szia!

Van igazad néhány dologban biztosan.
A kérdésem, a februári fizetésemre számíthatok-e mindezek ellenére? Hó elején azt mondtad egy vagy két hónapot fizetsz még. Legyen egy.
Nem lehet így kidobni embereket, ahogy csinálod, ilyen könnyedén....

Kár hogy elveszett az érdeklődésed a projekt iránt, és egy olyan játékban éled ki magad, ami te is tudod töltelékjáték. Az Andrásék hasonló jellegű játékát lehúztad, most nem értem miért nem akarsz egy igazán ütős játékot csinálni. 
Könnyen eltéríthető vagy.
Szerintem te sem tudod, hogy mit akarsz. Csapongsz.
Nem tudok választ adni, mert nagy mértékben függ attól, hogy a februári fizetésemet megkapom-e. Ha igen, akkor foglalkozom vele, megteszem ami tőlem tellik, még ha te ezt már nem is akarod.
Ha nem, akkor viszont búcsút kell intenünk egymásnak, mert nemhogy 2 hónap, de 1 hónap fizetésnélküliséget sem bír el a háztartásunk. 
Apropó. Azt is mondtad szerzel nekem melót. Nos, gondolom ezt ugyanúgy kell értelmeznem mint a 20%-ot, meg a többit, kenjem a hajamra. Nem baj, mert Isten segedelmével hamar lesz munkám, de megintcsak azt tudom mondani, hogy nem dobálózhatsz a szavakkal.

Lambertről nem akarok vitatkozni, nem én hívtam.


Sajnálom, hogy így gondolod a  dolgokat, szerintem egy ilyen kis hebehurgya játék sem fog az elvárásaidnak megfelelni, és pénzt sem hiszem hogy hozna  a konyhára, de ne legyen igazam. Igenis kellene egy nagyobb volumenű játékkal is foglalkozni, mint ahogy biztos Andrásék is teszik  a kis minyonos hülyeség mellett.
Te eleve nem hittél a kártyajátékban....sajnos. Vagy csak azért nem tetszik mert még a régi bandás időszakból van?
Így nem látom értelmét a folytatásnak. Kényszer alatt, egyedül? Nem kösz. Aztán, ha mégis bejön, akkor jó?
Tényleg sajnálom, kívánom, hogy találd meg a számításod. Nem szeretnék haraggal, rossz szájízzel elválni, ha bármiben lehetek későbbiekben a segítségedre, szólhatsz nyugodtan.
A kártyajátékot én megőrzöm magamnak, lehet egyedül befejezem én még mindig szeretem és hiszek benne.
Szeretném, ha nem lenne köztünk harag és ujjal mutogatás, továbbá, hogyha ígéretedhez hűen a februári fizumat azért odaadnád még márc. 10-ig.


Szia! 

Örülök, hogy sikerült tiszta vizet önteni a pohárba. Kár, hogy te kiábrándultál, bennem a játék minden változata kristály tisztán él, és ennek megfelelően látom benne a potenciált. 
Remélem e-tekintetben az idő majd engem igazol. Mert így vagy úgy de mindképpen foglalkozni fogok vele. 
Zárójelben jegyzem meg, hogy Tusánnak se tetszett a kártyajáték forma, ő inkább a sztori lehetősége fogta meg. Bezár. 
Szerintem akkor se lett volna más a helyzet, hogyha szeptembertől unity-ban kezdjük a fejlesztést. JS-ben se a megjelenítés okozta a fő problémát ( a szöveges beviteltől eltekintve ami PIXI-ben = 0 ).
Inkább a játék összetett felülete, illetve az, hogy a legtöbb kód n. játékosra készült. 
Remélem a bulder dash játékod nem ennyire összetett és hamarosan elkészül ( tudsz mutatni valamit belőle ? kíváncsi vagyok a grafikai világára ). 
Akkor tartod magad ahhoz, amit a hónap elején mondtál, hogy ez lesz az utolsó hónap amikor fizetsz és utána váltunk a felálláson ?
Mert akkor részemről rendben van, ezt már akkor is mondtam. 
A Nullpoint studio-val mi a pontos terved? 

üdv,
P.

Tehát akkor ha jól értem az a helyzet, h te hiszel ebben a játékban nagyon is, 
de a saját kontódra nem akarsz semmit sem vállalni, ugye? 
Azaz ha továbbra is finanszírozok mindent, akkor csinálod tovább, ha nem, 
akkor te magadtól nem csinálod tovább, pedig már csak te hiszel benne. Jól értem? 
Mert ha tényleg ez a helyzet, akkor tényleg elszórakoztam pár milliót + jó pár hónapot az életemből, 
ami teljesen felesleges volt.
Ha jól értettem, akkor a pénzt megkapod, s a gépet viszem.

Amit le akarok papírozni, az pontosan az, amiről az előbb írtál, miszerint te így vagy úgy, de folytatni fogod a játékot tovább. 
A jogtulajdonosi viszonyt szeretném lepapírozni. Ha az előbbi dolgot jól értettem, akkor megírom a papírt, s átküldöm.

Mit jelent neked a "saját kontóra" fogalom ?
Mert ha lenne egy fillér pénzem és nem zsíros kenyéren élnék hetek óta, 
akkor lehet, hogy elgondolkodtam volna a 1.-es opción, de nem 
vagyok abban a helyzetben ( bármennyire is szeretném ), hogy azt válasszam. 

És mi véd engem attól, hogy tulajdonképpen így akarsz kirakni a cégből és 
nélkülem megvalósítani az ötletet?

Másképp fogalmazva, ha azt mondod, hogy a februárt kifizeted és utána ahogy a 
hónap elején elmondtad, anélkül dolgozok a GZ-n, hogy a továbbiakban pénzt "ölnél" 
bele, akkor az nekem is egy járható út lenne. Persze ez azt jelentené, hogy 
minél előbb munkát kellene szereznem, mert nem vagyok abban a helyzetben, 
hogy máshonnan lenne bevételem, ellenben az élet pénzbe kerül.
Akkor a munka mellett fejleszthetném tovább a programunkat - saját kontóra. 

Nem én kértem, hogy százalékot ajánlj a cégből. De megtetted, viszont ha jól
látom nem gondoltad komolyan. Mondjuk ezt már akkor is tudtam, amikor 
Lambertnek megígérted ugyanezt a százalékot, amit nekem is, én azon akkor 
nagyon meglepődtem. Tulajdon jogokról beszélsz, de még a társak vagyunk 
a cégben mondatodat se gondolod komolyan. Valamint azért akarod, hogy 
lemondjak a szellemi tulajdonomról, mert te úri passzióból megelégelted, 
hogy anyagilag támogasd a munkát, amit az elején bevállaltál. És amikor 
egy irreális feladattal csúsztam 1 hetet, akkor kitáncolnál a történetből,
a világon nincs ilyen! 


Oké, szerintem jól érted, igen. .....sarkítsunk. Persze!

Igazad van, a projektben csak én hiszek, és igen, ha vki finanszírozná, tovább csinálnám. Finanszírozás nélkül 'sajátkontóra' nem tudom bevállalni, hiszen addig miből fizetem a számláimat. Ezt te sem várhatod, és te sem csinálnád. Ha milliomos lennék, más lenne a helyzet. :)
Azonkívül nem én kértem 20%-ot, azzal te dobálóztál nagyon is könnyedén (Lambertnak is) Már akkor sejtettem, hogy ez így nem okés. Épelméjű vállakozó nem könnyelműsködik. Mirefel? Pár alkalom ismeretség után?
Szóval te főnökként vállaltad a finanszírozást, valami agymenés miatt felajánlottál részesedést a cég bevételéből. 


( 

  ... a nem létező cégből, amiből nem én akartam részesedést, 
  hanem te ajánlottad fel magadtól.
  Erről és az egész munkámról amúgy semmilyen hivatalos papír nem készült. 

)




*/


  /*

  Állás :: Shönhertz 

  Veszprémi-Olaszy Gabriella


  2 - 3 

  Balázsdiák 

  Gravity R&D 

  Index 


*/


  class Desk { // desk = new Desk();for( ply of desk.rule()) log=ply

    constructor(players) { // setup game 

      players = players || ['Robfix', 'Eston', 'Jelly', 'Macera']

      this.co = new Coroutine()

      //this.co.START_MATCH( this.co, ['Robfix','Eston','Jelly','Macera','Derik','Hutch'].join(I) )
      this.co.START_MATCH(this.co, (players).join(I))
      //this.co.START_MATCH( this.co, ['Eston','Jelly'].join(I) )		

    }

    *rule() { // KIHAL így kell megadni ES6 classon belül egy generátort !

      let whenStart = +new Date()

      for (let player of this.sitDownToTable(this.co)) yield player  // ez igy eröltetett 

      while (this.dontOver(this.co)) {
        yield '--{'

        for (let card of this.drawToFullHands(this.co)) yield card

        if (!this.co.scene) { this.co.scene = this.co.sceneDeck.shift(); this.co.gfx = this.co._.scenePlayAnim; yield 'play scene: ' + this.co.scene.name }

        for (let actor of this.playUntilAction(this.co)) yield actor

        for (let boss of this.selectBoss(this.co)) yield boss

        for (let skill of this.useBoss(this.co)) yield skill

        for (let result of this.winOrDecision(this.co)) yield result

        for (let card of this.cardsOutOfPlay(this.co)) yield card

        yield '-- } --'
      }

      // for( let pl of this.co.all.yers ) yield pl.name + ' : ' + pl.matchResult().win 

      console.table(this.co.all.yers.map(pl => pl.matchResult())) // ezt még totál rosszúl számolja 		

      yield `----- game over -----

scene left: ${this.co.sceneDeck.length()}

      `
      yield +new Date() - whenStart

    }

    dontOver(co) {

      return co.all.yers.find(pl => pl.deck.length() || pl.hand.filter(ACTOR).length) && co.sceneDeck.length()
    }

    *sitDownToTable(co) { for (let player of co.all.yers) yield player.name + '...on table' }

    *drawToFullHands(co) {

      for (let pl of co.all.yers) {
        pl.draw5()
        co.gfx = co._.drawAnim // KIHAL ez így most elég egyszerű beépítésnek tűnik 
        yield pl.name + " draw:  " + pl.fly.map(c => c.name).join(I)
        pl.fly = [] // ráadásul felváltva húzzák a kártyát 
      }

    }

    *playUntilAction(co) {
      yield '------ 2 - Play Cards ----------'

      // - who.hand.cards.map( a => a.score( pva.scene ) )  calculate score 

      const isintAction = new Set([co._.MoreActors, co._.FewActors, co._.NoActors, co._.choicePlayMore])
      let pl = co.who

      do {

        pl.fly = []

        var playable = pl.playebleCardInHands()

        let actor = playable.random()

        if (actor) {

          actor.move(pl.hand, pl.play)
          pl.fly.push(actor)
          co.stack.push({ owner: pl, card: actor, play: 0, cast: 0 })
          var item = pl.canAttachItem(actor).random()
          if (item) {
            actor.attach = item
            item.move(pl.hand, pl.play)
            co.stack.push({ owner: pl, card: item, play: 0, cast: 0 })
            co.who.fly.push(item)
          }

          yield pl.name + " play:  " + pl.fly.map(c => c.name).join(I)

          for (let card of pl.fly) {
            switch (card.skill.hcrb) {
              case 'H': yield "[H] :: " + card.skill.descript; break;
              case 'R': yield "deploy [R] :: " + card.skill.descript; break;
              case 'C': yield "deploy [C] :: " + card.skill.descript; break;
            }
          }

        } else {

          pl.pass++
          yield pl.name + " pass"

        }

        co.situation = co.DETERMINATE(co)

        if (isFound([co._.NoActors, co._.FewActors], co.situation)) continue

        // change player 	

        if (co.situation == co._.MoreActors) { co.who = pl = co.all.next(pl) }

        // if( co.situation == co._.AutoAction ){ co.umpire = co.who ; yield 'umpire:'+co.umpire }


        if (co.situation == co._.EvenActors) {
          var playable = co.who.playebleCardInHands()
          if (!playable.length) { co.situation = co._.choiceAction }
          else { co.situation = [co._.choicePlayMore, co._.choiceAction].random() } // idétlen AI 				
        }

      } while (isintAction.has(co.situation))

      // jó kérdés melyik a praktikusabb ?
      //} while( isFound( [ co._.MoreActors , co._.FewActors, co._.NoActors, co._.choicePlayMore ] , co.situation ) ) // action or auto action 

      if (isFound([co._.choiceAction, co._.AutoAction], co.situation)) { co.umpire = co.who; yield 'umpire:' + co.umpire.name }

    }

    *selectBoss(co) {

      yield '--------- 3 - ACTION! ------------'

      var first = co.all.next(co.who)
      for (let pl of co.all.round(first)) {
        pl.boss = pl.play.filter(ACTOR).random()
        // pl.boss = yield pl.play.filter(ACTOR)
        // ezt majd igy kell írni és akkor a next(result)-al kell visszahívni ha jól sejtem!				
        yield pl.name + ((pl.boss) ? ' select boss: ' + pl.boss.name : ' dont have boss')
      }

    }

    *useBoss(co) {
      yield '3/2 - Use Boss skills'

      let first = co.all.next(co.umpire)
      for (let pl of co.all.round(first)) {
        if (pl.boss && pl.boss.skill.hcrb == 'B') yield "[B] :: " + pl.boss.skill.descript
      }

    }

    *winOrDecision(co) {

      yield '---------- 4/1 - DECISION ----------'

      co.roundScore = co.SCORE(co, co.scene)

      co.situation = co.DECISION(co, co.roundScore, co.scene)

      switch (co.situation) {

        case co._.WinSomeone:

          co.winner = co.roundScore[0].who
          co.who = co.winner

          yield ' >> WINNER IS: ' + co.winner.name

          co.winner.turnScore(co, co.resultAs.Winner, co.roundScore[0].score * 2)
          for (let pl of co.all.others(co.winner)) { pl.turnScore(co, co.resultAs.Looser, 0) }

          co.winner.bossToDeck()
          for (let pl of co.all.yers) { pl => pl.playToRest() }

          yield this.sceneOutOfPlay(co)

            ; break;

        case co._.Escalation:

          yield `${co.umpire.name} DECIDE >> ESCALATION`

          for (let pl of co.all.yers) { pl => pl.playToRest() }

          ; break;

        // persze support csak akkor lehettséges, hogyha az umpire-nek legalább 1 pontja van 
        case co._.SupportSomeone:

          var others = co.all.others(co.umpire)
          var someone = others.random() // na ezeket a random döntéseket le kell cserélni 

          yield `${co.umpire.name} DECIDE >> SUPPORT ${co.someone.name}`

          // score 
          co.umpire.turnScore(co, co.resultAs.Supporter, co.umpire.countScore(scene))
          someone.turnScore(co, co.resultAs.Supporter, someone.countScore(scene))
          others.forEach(pl => { if (pl != someone) pl.turnScore(co, co.resultAs.Looser, 0) })

          // out card from play
          co.umpire.bossToDeck()
          someone.bossToDeck()
          for (let pl of co.all.yers) { pl => pl.playToRest() }

          yield this.sceneOutOfPlay(co)

            ; break;

      }

    }

    *cardsOutOfPlay(co) {

      for (let pl of co.all.yers) { pl.playToRest() }

      yield '5/2 - Evaluation, cards go out'

    }

    *deploySkill(who, cards) { yield 'deploy some skill' }

    sceneOutOfPlay(co) {

      let scene = co.scene
      co.sceneRest.push(co.scene)
      co.scene = false
      return 'scene out from play: ' + scene.name

    }

    overAnim(c) { // na ez nem így lesz az tuti. 

      var co = this.co
      var scene = skeleton.game.play.scene.pixi
      let sgp = skeleton.game.play

      /*

    if( flyingCards.length == 1 && flyingCards[0] == c  ){

      // console.log('animOver :: ', co.info() )

      switch( co.gfx ){

        case co._.drawAnim: 

          ;break;

        case  co._.scenePlayAnim: scene.position.set(0,0); scene.scale.set(1);			
        case  co._.playAnim: 		

          co.phase = co.sub.DETERMINATE
          co.situation = co._.playAnim

          ;break; 

        case co._.changePlayer:	

          skeleton.game.play.topinfo.infoLine.txbg.pixi.width = skeleton.game.play.topinfo.infoLine.txbg.box.w

          ;break; 

        case co._.endAnim: 
          ;break;

        case co._.choiceAction:
        case co._.choicePlayMore:

          ;break;

      }

      co.gfx = false // animOver

      //console.log('re stacio', co.sitation , co.phase )		

      stacio( co )

      // nextStepp()

    }

      */
    }



  } // Desk 

  window.Desk = Desk

  class Fish { // F.I.S.H - Fly + Interaction + Server  Handle 



  }

  window.Fish = Fish

  this.es6pve = function() {

    var desk = new Desk(['Umberto', 'Debora'])
    var co = desk.co
    var rule = desk.rule()

    const stepp = val => { log = rule.next(val).value; stacio(co) }
    window.es6stepp = stepp

    uppdate('game.play')

    prepareStacio(co, desk.overAnim)

    stepp(1)
    stepp(1)

    who = co.all.yers[0]

    stepp(1)

    stacio(co)

  }

  window.es6pve = this.es6pve

  // desk = new Desk();for( play of desk.rule()) log=play

  // Elementban --- Sokoban / Builder Dush csak a kockák elemek és összerakva új elemet hoznak létre, és vagy ezeket kell előállítani, vagy csak így lesz elág hely a pályán. 



  /*

Játék szabály 

  0. előkészület 	- a játékosok paklijából a jelenetek egy közös jelenet pakliba kerülnek 
          - játékosok és a jelent paklik megkeverése 
          - a kezdő játékos véletlenszerű kiválasztása 

Fázisok:  	1.	Húzás	2.	Játék	3.	Akció	4.	Döntés		5. Kiértékelés

  1.	Húzás		- minden játékos 5 méretre felhúzza a kezét a pakliból >> 2. fázis 

  2.	Játék		- jelent kijátszása 
          - szereplő kijátszása
            - tárgy csatolása ( választható )

            - szabálymodisító képesség a lerakástól kezdve érvénybe kerül 
            - lerakáskori képesség kijátszása
            - esetleges reakció képesség kijátszása

          - ha több szereplője van az aktuális játékosnak kint ( méret számít ), 
          mint akinél a legkevesebb van, akkor a következő játékosré a lehetőség, hogy tegyen vagy passzoljon 
          ( ha nem tud szereplőt kiranki - nincs a kezében, túl nagy van )
          - ha egyenlő a szereplők mérete ( a pasz is méretnek számít ), akkor ő lesz a döntéshozó.
          Ha a játékosonk nem foglalták még el a rendelkezésre álló 3 helyet, akkor a döntéshozó 
          vagy akciót mond és >> 4. fázis, vagy kirak még 1 szereplőt. 
          - ha mindenki elfolalta a rendelkezésre álló helyet, akkor autómatikusan >> 3. fázis.

  3.	Akció	
          - főnök (boss) kiválasztása - a döntéshozót követő játékostól sorban
          - főnök képességek használata ( tárgy / főnök ) - a döntéshozót követő játékostól sorban
            - eközben esetleges reakció képesség kijátszása	és persze a lentlévő szabályok érvényesülnek				

  4.	Döntés		- döntetlen esetén a döntéshozó dönt: 
            - támogat valakit és a pont feleződik - a támogató és a támogatott főnöke is játékosuk paklijának az aljára kerül,
              a többi lap a használtak közé kerül  >> 5. fázis
            - eszkalál, a főnökök és a jelenet marad >> 1.-es pont,
               a döntéshozó kezdi a kört 1 lap kirakásával.
          - valaki több pontot szerzett a körben az nyer  főnöke a paklija aljára kerül, 
            a többi lap a használtak közé kerül  >> 5. fázis

  5.	Kiértékelés
          - Ha még van lap a jelenet pakliban, vagy nem teljesül speciális 		
            megoldási feltétel, akkor egy új kör kezdődik, a mostani nyertes
            vagy döntéshozó lesz a kezdő játékos.

*/

  // ---------------------------------[ COROUTINES ] -------------------------------------------------------------

  class Coroutine {

    constructor(phase) {

      this.id = UID()
      this.situation = false
      this.scene = false
      this.sceneDeck = false
      this.sceneRest = false
      this.all = false
      this.who = false
      this.umpire = false
      this.winner = false
      this.roundScore = false
      this.birth = + new Date()
      // this.SEQ=false
      this.gfx = false // animation and Interaction
      this.stack = [] // stack for active skills 

      this.resultAs = { Winner: 2, Supporter: 1, Looser: 0 }
      this._ = {

        NoActors: "NoActors",
        FewActors: "FewActors",
        MoreActors: "MoreActors",
        choicePlayMore: "choicePlayMore",
        choiceAction: "choiceAction",

        AutoAction: "AutoAction",
        EvenActors: "EvenActors",
        Undetermined: "Undetermined",

        WinSomeone: "WinSomeone",
        EvenScore: "EvenScore",
        Unsolved: "Unsolved",
        SupportSomeone: "SupportSomeone",
        Escalation: "Escalation",

        // interactions	
        playActorInt: "playActorInt",
        selectTargetInt: "selectTargetInt",
        moreOrAction: "moreOrAction",
        skillDeploy: "skillDeploy",
        castSkill: "castSkill",


        // animations	
        scenePlayAnim: "scenePlayAnim",
        attachAnim: "attachAnim",
        playAnim: "playAnim",
        changePlayer: "changePlayer",
        drawAnim: "drawAnim",
        endAnim: "endAnim"
      }

      this.sub = {

        MATCH_SETUP: 'N7P0'
        , DRAW_TO_5: 'HIOU'
        , SETUP_SCENE: 'R9L9'
        , DETERMINATE: 'SK7B'
        , ACTION: 'VGDA'
        , DECISION: 'ARV0'

        , SCENE_PLAY_ANIM: 'FA9S'
        , ATTACH_ANIM: 'R57L'
        , PLAY_ANIM: 'KBEG'
        , SCENE_PLAY: 'U640'
        , ALL_OUT: 'S2J6'
        , CARDS_OUT: 'N1CF'
        , BOSS_STAY: 'K3BA'

        , PLAY_ACTOR_INT: 'RMG5'
        , SELECT_TARGET_INT: 'QSO4'
        , BEFORE_END: 'KSCE'

        /*	,:'IMMI',:'TLRF',:'FLVK',:'VLUQ',:'SDNF',:'MTJV',:'GG4E',:'LNIR',:'V4EM',:'QFJ0',:'GQ6D',:'HUKB',:'JHKC',:'PC2V'*/

      }

      this.resub = ObjectReverse(this.sub)

      this.phase = phase || this.sub.MATCH_SETUP

      //this.isRender = false  
      //this.isPixi = false 

      // this.eachYers = this.all.yers.forEach
    }

    DETERMINATE(co) {

      var situArray = co.all.yers.map(function(pl) { return pl.play.size(ACTOR) + pl.pass })
      var w = situArray[co.who.index] // w is s[..]
      var s = situArray.sort().reverse()
      // elég komoly feltétel lánc 
      var situation =
        (s[0] == 0) ? co._.NoActors :
          (w < s[0]) ? co._.FewActors :
            (w != 0 && w == s[0] && s[0] > s[s.length - 1]) ? co._.MoreActors :
              (s[0] == s[s.length - 1]) ?
                (s[0] == 3) ? co._.AutoAction
                  : co._.EvenActors
                : co._.AutoAction // co._.Undetermined

      if (_isLog_) { console.log("<{..1}>".insert(situation)) }

      return situation

    } // DETERMINATE

    START_MATCH(co, playersDef) {

      if (playersDef instanceof Allyers) {

        co.all = playersDef

      } else if (typeof playersDef === "string") { // auto local player 

        co.all = new Allyers()
        co.all.loginToMatch(playersDef.split(I).map(function(n) {

          var pl = new Player(n)

          pl.deck.randomFill(20, ACTOR)
          pl.deck.randomFill(6, ITEM)
          pl.deck.randomFill(4, SCENE)
          pl.deck.shuffle()
          pl.isAI = true

          return pl

        }))

      } else { return console.error('wrong player setup: ') }

      // fixen az első az isViewer !! 
      co.all.yers[0].isViewer = true

      co.sceneRest = new Deck() // az elhasznált scene lapoknak egy pakli 

      co.who = co.all.randomPick() // itt dől el ki kezdi a játékot ehez is kapcsolni lehetne egy animációt 

      // console.table(all.yers)
      // if(_isLog_){console.log( "Start player is: "+ co.who.name  )}


      co.sceneDeck = co.all.grabOutSceneFromDecks()

    } // START

    PLAY_ACTOR(co) {   // play 1 Actor with or without item

      co.who.fly = []

      var playable = co.who.playebleCardInHands()

      if (!co.who.isAI && playable.length) {
        co.gfx = co._.playActorInt
        beginActorSelectInteraction(co, playable)
      } else {
        co.PLAY_SELECTED_ACTOR(co, playable.random())
      } // ide jön, hogy az AI választ szereplőt. 

    }

    PLAY_SELECTED_ACTOR(co, actor) {

      // var actor = playable.random() // entellectual of AI = 0

      if (actor) {
        // var skilltype = { H:[], R:[], C:[] , B:[] }
        // skilltype[actor.skill.hcrb].push( actor )

        actor.move(co.who.hand, co.who.play)
        co.who.fly.push(actor)
        co.stack.push({ owner: co.who, card: actor, play: 0, cast: 0 }) // igy egy kicsit bonyolitas 
        // if(_isLog_){console.log("{..1} play card: {..2}".insert(co.who.name,actor.sog()))}
        var item = co.who.canAttachItem(actor).random()  // tárgyválasztás a lehetségesek közül véletlenszerűen
        if (item) {
          actor.attach = item
          //skilltype[item.skill.hcrb].push( item ) // ??
          item.move(co.who.hand, co.who.play)
          co.stack.push({ owner: co.who, card: item, play: 0, cast: 0 })
          co.who.fly.push(item)
          // if(_isLog_){console.log("     with: {..1}".insert(item.sog(),actor.sog()))}
        }

        // co.stack.push( item ? { owner: co.who , actor:actor , item:item } : { owner: co.who , actor:actor } ) 

        actorAnimIntoPlay(co)

        // co.stack.push( skilltype )	

        /*
      if( skilltype.H.length > 0 ){ co.H_SKILL( co, skilltype.H.random() ) }
      if( skilltype.R.length > 0 ){ co.R_DEPLOY( co, skilltype.R ) }
      if( skilltype.C.length > 0 ){ co.C_DEPLOY( co, skilltype.C ) }
        */

      } else {

        co.who.pass++
        // if(_isLog_){console.log("<--{..1} pass -->".insert(co.who.name))}
      }

    } // PLAY_ACTOR

    SCORE(co, scene) {

      return co.all.yers.map(function(pl) { return { name: pl.name, who: pl, score: pl.countScore(scene) } }).sort(function(a, b) { return b.score - a.score })

    } // SCORE

    DECISION(co, roundScore, scene) {

      if (co.umpire && co.umpire.score) { co.umpire.score = co.umpire.countScore(scene) } else { co.umpire = co.who || co.all.yers[0]; co.umpire.score = 0 }

      // umpire.score = umpire.countScore( scene )

      co.situation = (co.roundScore[0].score == co.roundScore[1].score) ? co._.EvenScore : co._.WinSomeone  // _.Unsolved  is also possible !!!

      if (co.situation == co._.EvenScore) {
        co.situation = (co.umpire.score > 0) ? [co._.SupportSomeone, co._.Escalation].random() : co._.Escalation

      } else {
        co.situation = co._.WinSomeone
        co.umpire = co.roundScore[0].name

      }

      return co.situation

    } // DECISION

    info(p) { p = p || ""; return '{..1}:{..2} {..3} {..4}'.insert(p + " " + this.resub[this.phase], this.situation, this.gfx ? this.gfx : '.', this.who ? this.who.name : '-') }

    toJson() {

      var co = this
      // make fake info about 
      return JSON.stringify({
        situation: this.situation
        , sceneSerial: this.scene.serial
        , sceneDeckLength: this.sceneDeck.length()
        , all: {
          yers: this.all.yers.map(function(pl) {
            return {
              name: pl.name
              , hand: pl.hand.cards.map(function(c) { return c.serial })
              , play: pl.play.cards.map(function(c) { return c.serial })
              , restLength: pl.rest.length()
              , deckLength: pl.deck.length()
              , matchResultWin: pl.matchResult().win
              , countScore: pl.countScore(co.scene)
            }
          })
        }
      })
    }

  } // end Coroutine	

  // ------------------------------------------[ main game logic ]

  /*

  Valahogy nagyon korrekt módon kellen a switchMatch -ba beépíteni az animációkat, mert úgy látom, hogy a phase és situation - al való játék csak feleslegesn 
  szészedi a core programot, és átláthatatlanná teszi, rásadásul így nem lehet majd ugyanazt a kódot használni kliens és szerver oldalon is ami pedig 
  alapvetően megkönnyítené a fejlesztést. 

  + gfx - a feladatok nagyrész a gfx-re lettek áttestálva 

  + ki kellene találnom, hogy miként oldjam meg a játék menet lassítását 
    sgp.hand.pixi.y += 400
    .. stb. 

  + scene card from scene image 
  + w2/3 inplay stands 
  + minden skillnek legyen szovege 
  + esetleg megfelelő 2w/3w kártyákat + megfordítasa .. ha az enemynél nem lenne 
  + a felvételhez megfelelő sceneket kivalasztani 
  - font tető levágás hiba kijavítás 
  + a részeredmény animban a kör score értékét írjam ki 
  + az utolsó kör részeredmény animáció is lefusson 
  + icon line less color	
  + megfelelő felvétel

  TODO 

  + icon set rework 
  + scene title shadow 
  + change scene graphics 
  + es6 interaction and animation implement
    + draw cards
    + play scene 
  - scene graphics online change 
  - es6pve 
    + first stepp
    - include animation and interaction 
    - boss select interaction
    - few skill work
    - change items and w2/w3 skill to old items skills 
  - full skill system rework 

  - w3 image to correct spaceship
  - w2 image to right selected ones 
  - halo around charcters and items 
  - enemy card in hands 	
  - new database upp to server
    - ezzel megint meg fogok küzdeni 
  - editable library / database 
    - easy change images 
  - swiper filter 


*/

  function switchMatch(co, isLog, playersDef) {

    // bigloop: do { // ebben a pillanatban 2015.11.22 kérdőjeleztem meg a switchMatch elképzelésemet .. vagy mégse ?

    if (co.gfx) { return console.log('-------------wait for gfx--------------: ' + co.info()) }
    // console.log('--> ' , co.info() ) 

    switch (co.phase) {

      case co.sub.MATCH_SETUP:

        _isLog_ = isLog || false

        // console.time(co.id) 

        playersDef = playersDef || "Bob|Bobek"

        // co.routines = new Phase()

        co.scene = false

        co.umpire = false

        //co.sceneDeck = co.START_MATCH( co, playersDef ) // AZONNAL
        co.START_MATCH(co, playersDef) // AZONNAL

        co.phase = co.sub.DRAW_TO_5; break;


      case co.sub.DRAW_TO_5:

        // console.log('------------DRAW_TO_5--------------')

        co.all.yers.forEach(function(pl) { pl.draw5() })

        co.gfx = co._.drawAnim; break;

      case co.sub.SCENE_PLAY: // TODO remove 

        // console.log('------------SCENE ANIM IN--------------')

        co.scene = co.sceneDeck.shift()

        co.gfx = co._.scenePlayAnim; break;


      case co.sub.DETERMINATE:

        // KIHAL right check skill played 
        // if ( co.situation == co._.playAnim ){ var s = co.stack[co.stack.length-1]; if(s){ console.log( s.owner.name +" : "+s.actor.skill.descript + (s.item ? CR+s.item.skill.descript : '') )}  }
        if (co.situation == co._.playAnim && EXTRAINFO) { deploySkillAnim(co) }

        if (co.situation == co._.choicePlayMore) { co.PLAY_ACTOR(co) }  // ANIM
        if (co.gfx) { /* console.log(co.info('1nd break')); */ break }

        // if ( co.isRender  && co.skillPlay ){ renderSkillPlay( co ); break }

        co.situation = co.DETERMINATE(co) // AZONNAL - IF AI 

        if ([co._.NoActors, co._.FewActors].indexOf(co.situation) >= 0) { co.PLAY_ACTOR(co) } // ANIM
        if (co.gfx) { /* console.log(co.info('2nd break')); */ break }

        if (co.situation == co._.AutoAction) { co.umpire = co.who }

        if (co.situation == co._.MoreActors) {
          co.who = co.all.next(co.who) // ANIM
          // ezzel csak az a baj, hogy most bevarrom az animációkat a corba, ennél elegánsabb megoldást kellene kitalálnom 
          return actualPlayerChange(co)
        }

        if (co.situation == co._.EvenActors) {
          var playable = co.who.playebleCardInHands()
          if (
            !playable.length) {
              co.situation = co._.choiceAction
          } else if (co.who.isAI) {
            co.situation = [co._.choicePlayMore, co._.choiceAction].random()  // a megfontolt AI :)
          } else {
            co.gfx = co._.moreOrAction
            return moreOrAction(co)
          }
        }

        /* error handling */ if (co.situation == co._.Undetermined) { throw new error("Undetermined situation") }


        co.phase = ([co._.MoreActors, co._.FewActors, co._.NoActors, co._.choicePlayMore].indexOf(co.situation) >= 0) ? co.sub.DETERMINATE : co.sub.ACTION

        break;;

      case co.sub.ACTION:

        if (co.situation == co._.choiceAction) { co.umpire = co.who }

        // co.BOSS_SELECT( co ) // ANIM

        var first = co.all.next(co.who)
        co.all.round(first).forEach(function(pl) {
          pl.boss = pl.play.filter(ACTOR).random()
          if (pl.boss && _isLog_) { console.log("{..1} select boss: {..2}".insert(pl.name, pl.boss.name)) }
        })

        if (EXTRAINFO) { bossSkillAnim(co) }

        // co.B_SKILL( co ) // ANIM

        co.roundScore = co.SCORE(co, co.scene)

        co.situation = co.DECISION(co, co.roundScore, co.scene)

        co.phase = co.sub.DECISION; break;

      case co.sub.DECISION:

        // interaction(situation)

        if (co.situation == co._.Escalation) {

          console.log('-- Escalation --')
          // out card from play
          co.all.yers.forEach(function(pl) { pl.bossNotToRest() })

          if (co.sceneDeck.length() > 0) {

            co.all.yers.forEach(function(pl) { pl.draw5() })

            co.gfx = co._.drawAnim

            outOfPlayAnimation(co)

          } else {

            co.phase = co.sub.MATCH_END
            outOfPlayAnimation(co)

          }

          ; break;
        }

        if (co.situation == co._.WinSomeone) {

          co.winner = co.roundScore[0].who
          co.who = co.winner // winner start the next round 			

          // score
          co.winner.turnScore(co, co.resultAs.Winner, co.roundScore[0].score * 2)
          co.all.others(co.winner).forEach(function(pl) { pl.turnScore(co, co.resultAs.Looser, 0) })

          // out card from play
          co.winner.bossToDeck()
          co.all.yers.forEach(function(pl) { pl.playToRest() })

          co.sceneRest.push(co.scene)
          co.scene = false

          co.phase = co.sceneDeck.length() ? co.sub.DRAW_TO_5 : co.sub.MATCH_END

          if (co.phase == co.sub.MATCH_END) {
            log = '------------ MATCH END ------------ 1 -'
            co.phase = co.sub.BEFORE_END
          }

          co.gfx = co._.endAnim
          outOfPlayAnimation(co)

            ; break;

        }

        if (co.situation == co._.SupportSomeone) {

          console.log('-- SupportSomeone --')

          var others = co.all.others(umpire)
          var someone = others.random()

          // score 
          co.umpire.turnScore(co, co.resultAs.Supporter, co.umpire.countScore(scene))
          someone.turnScore(co, co.resultAs.Supporter, someone.countScore(scene))
          others.forEach(function(pl) { if (pl != someone) { pl.turnScore(co, co.resultAs.Looser, 0) } })

          // out card from play
          co.umpire.bossToDeck()
          someone.bossToDeck()
          co.all.yers.forEach(function(pl) { pl.playToRest() })

          co.sceneRest.push(co.scene)
          co.scene = false
          co.phase = co.sceneDeck.length() ? co.sub.DRAW_TO_5 : co.sub.MATCH_END

          if (co.phase == co.sub.MATCH_END) {
            log = '------------ MATCH END ------------ 2 -'
            co.phase = co.sub.BEFORE_END
          }

          co.gfx = co._.endAnim
          outOfPlayAnimation(co)

            ; break;

        }

        ; break;

      case co.sub.MATCH_END:

        // outOfPlayAnimation( co )

        console.log("MATCH_END !", co.info(), new Date(+new Date() - co.birth))

        return false

    }

    //console.log('switchMatch :: ',co.info())
    co.phase = co.phase || co.sub.MATCH_END
    return co.phase

  } // switchMatch 


  function animOver(c) {

    var co = this
    var scene = skeleton.game.play.scene.pixi
    let sgp = skeleton.game.play


    // console.log('animOver', flyingCards.length , flyingCards[0] == c , co.info() )

    if (flyingCards.length == 1 && flyingCards[0] == c) {

      // console.log('animOver :: ', co.info() )

      switch (co.gfx) {

        case co._.drawAnim:
          if (co.phase == co.sub.DRAW_TO_5) {

            co.phase = co.sub.SCENE_PLAY

          } else { // after Escalation

            co.phase = co.sub.DETERMINATE
            co.situation = co._.choicePlayMore
          }

          ; break;

        case co._.scenePlayAnim: scene.position.set(0, 0); scene.scale.set(1);
        case co._.playAnim:

          co.phase = co.sub.DETERMINATE
          co.situation = co._.playAnim

            ; break;

        case co._.changePlayer:

          skeleton.game.play.topinfo.infoLine.txbg.pixi.width = skeleton.game.play.topinfo.infoLine.txbg.box.w

            ; break;

        case co._.endAnim:
          scene.position.set(0, 0); scene.scale.set(1);
          //sgp.hand.pixi.fly = {to:{y:400}}				
          sgp.inPlay.player.pixi.fly = { to: { y: 0 } }
          sgp.inPlay.enemy.pixi.fly = { to: { y: 0 } }
          sgp.topinfo.infoLine.pixi.fly = { from: { a: 0 }, to: { a: 1 }, step: 12 }

          if (co.phase == co.sub.BEFORE_END) {
            log = '--> BEFORE_END'
            co.phase = co.sub.MATCH_END
          }

          ; break;

        case co._.choiceAction:
        case co._.choicePlayMore:

          ; break;

      }

      co.gfx = false // animOver

      //console.log('re stacio', co.situation , co.phase )		

      stacio(co)

      // nextStepp()

    }

    // console.log('-------------animOver --- but !',flyingCards)

  }

  // --------------------------------------------------[ old switchMatch ]-------------------------------------------------

  // ... empty 

  // -----------------------------------------------[ MULTI INSTANCE TEST ]

  /*
Object.defineProperty( window , 'multi' , { get: multi_ping } )
function multi_ping(){
  ccc = ccc || repeat(7,function(){var cor =  new Coroutine(); cor.isRender = false  ;return cor  })	
  var client = ccc.random()	
  switchMatch( client )
}
*/

  /*

.bind 

http://bonsaiden.github.io/JavaScript-Garden/

// Example showing binding some parameters
var sum (a, b) { return a + b; };

var add5 = sum.bind(null, 5);

console.log(add5(10));

browser kompatibilitas

http://kangax.github.io/compat-table/es5/

már csak emiatt is érdekes

Object.keys(myArray).length - KIHAL

minden amit az Object-ről akartam tudni, de sohase mertem megkérdezni

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object

például itt a clone:

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign

.. de csak mozilla alatt müködik .. mostmár chorme alatt is !! 

... viszont az observe

http://www.html5rocks.com/en/tutorials/es7/observe/

azért ha egy nem időben elhúzódó ciklusban futtatom a módosítást, akkor csak 1x reagál az observe 
így azért nem használható teljes magabiztossággal

+ Object.observe test on server side 

+ http://www.html5rocks.com/en/tutorials/es7/observe/
részletes kivesézése a témának 

ami még esetleg játszhat az a promise 

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise

// JS DOM event list http://www.w3schools.com/jsref/dom_obj_event.asp

majd elfelejtettem az álltalános probléma megoldó oldalt ::
http://www.wolframalpha.com/input/?i=49433665


*/

  // document.addEventListener("deviceready", deviceStillWorking , false);

  function isTouchCapable() { return ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch }

  // ---------------------------------------------------[ start of Graviton Zone ]---------------------------------------------------

  this.initZone = function() {

    console.log('.. DOM ready ..', window, document)

    // var gameScreen = document.getElementById('gameScreen')
    // renderer = new PIXI.autoDetectRenderer(1280,720,{view:gameScreen})
    // renderer = new PIXI.WebGLRenderer(1280,720,{view:gameScreen})

    //renderer = PIXI.autoDetectRenderer(1280,720);	
    //document.body.appendChild(renderer.view);	
    //renderer.view.screencanvas = true // lehet, hogy ezzel tolom el ?? IGEN ! 

    var gameScreen = document.createElement('canvas')
    document.body.appendChild(gameScreen)
    renderer = new PIXI.WebGLRenderer(1280, 720, { view: gameScreen })

    console.log(renderer.view)

    stage = new PIXI.Container() // animate :: renderer.render(stage)

    // for export 
    window.stage = stage
    window.renderer = renderer

    // animate() // auto rendering for test 

    // console.log('splash before loader')

    stage.addChild(new PIXI.Sprite.fromImage(folder + 'nullpointstudio314159screen.jpg'))
    requestAnimationFrame(animate)

    //return

    // -------------------------------[ mobil platform  ]

    if (isTouchCapable()) {

      var canv = document.querySelector('canvas')
      canv.onclick = canv.ontouchstart = function() {
        canv.webkitRequestFullscreen()
        preloader()
      }

    } else { // --------------------[ desktop ]

      preloader()

    }

  }

  // -------------------[ grand loader ]

  // http://www.html5gamedevs.com/topic/7674-load-textures-synchronously/ // TODO - el kellene olvasnom 

  function preloader() {

    var GRK = {}

    DB.actors.forEach(function(a) { GRK['img/actors/' + a.gmid + '.png'] = 1 })
    DB.items.forEach(function(a) { GRK['img/items/itm' + a.gmid + '.png'] = 2 })
    DB.scenes.forEach(function(a) { GRK['img/scenes/ls' + a.gmid + '.jpg'] = 3 })

    var AFS_GRAPHICS = ["img/icons/professionicons.png"
      , 'img/pieces/inplay-bckg.png'
      , 'img/pieces/top-avatar-left.png'
      , 'img/pieces/top-avatar-right.png'
      , 'img/pieces/deck0.png'
      , 'img/pieces/deck1.png'
      , 'img/pieces/deck2.png'
      , 'img/pieces/deck3.png'
      , 'img/pieces/deck4.png'
      , 'img/pieces/enemy-hand-bottom.png'
      , 'img/pieces/noscene.jpg'
      , 'img/pieces/card-bckg.png'
      , 'img/pieces/card-border-w1.png'
      , 'img/pieces/card-border-w2.png'
      , 'img/pieces/card-border-w2-alpha.png'
      , 'img/pieces/card-border-w3.png'
      , 'img/pieces/exoMenu.jpg'
      , 'img/pieces/underIndicator.png'
      , 'img/pieces/card-stand-404x65.png'
      , 'img/pieces/card-stand-606x65.png'
      , 'img/pieces/galaxy.jpg'
      , 'img/pieces/card-bckg-gz-w1.png'
      , 'img/pieces/card-bckg-gz-w2.png'
      , 'img/pieces/card-bckg-gz-w3.png'
      , 'img/pieces/rew-bckg-gz-w1.png'
      , 'img/pieces/rew-bckg-gz-w2.png'
      , 'img/pieces/rew-bckg-gz-w3.png'
      //,'img/fonts/magra400.woff2'
      //,'img/fonts/magra700.woff2'
    ].concat(Object.keys(GRK))

    PIXI.loader.add(AFS_GRAPHICS).load(imageLoaded)
    loading()

  }

  function loading() {

    stage.addChild(pixiBOX(790, 5, 0xc6c6c6, 255, 500))
    let loaderLine = pixiBOX(790, 5, 0x314159)
    stage.addChild(loaderLine); loaderLine.position.set(255, 500)
    PIXI.loader.on('progress', function() {
      loaderLine.width = PIXI.loader.progress / 100 * 790
    })

  }

  //var window.PROT = [], window.SKEY = []

  // gravitonZone - át kell dolgozni az új nevekhez 
  function generateProfessionTextures() {

    window.window.PROT = []
    window.SKEY = []

    var profSheet = PIXI.BaseTexture.fromImage("img/icons/professionicons.png");
    window.SKEY = Object.keys(pa).slice(0, 29)  // afs :: 26 
    for (var r = 0; r < 4; r++) {
      var pro = {}
      //window.SKEY.forEach(function(p,i){ pro[p] = new PIXI.Texture(profSheet, new PIXI.Rectangle(i%13*70,(~~(i/13)+(r*2))*70,70,70)); })
      // + TODO nagyobb icon sheetet gyártani !!
      //window.SKEY.forEach(function(p,i){ i=i%26; pro[p] = new PIXI.Texture(profSheet, new PIXI.Rectangle(i%13*70,(~~(i/13)+(r*2))*70,70,70)); })
      window.SKEY.forEach(p => {
        try {
          pro[p] = new PIXI.Texture(profSheet, new PIXI.Rectangle(pa[p].itp[0] * 70, (pa[p].itp[1] + r * 2) * 70, 70, 70))
        } catch (err) { console.log(p, pa[p]) }
      })
      window.PROT.push(pro)
    }

  }

  function imageLoaded() {

    generateProfessionTextures()

    // requestAnimationFrame(animate)	

    console.log('... all image loaded - ' + VERSION)

    userInterface(skeleton)

  }

  /*

function wheelTest () {

  renderer.view.onmousewheel = function (e) {
    var zoom = stage.scale.x 
    var amount = .97
    zoom = e.deltaY > 0 ? zoom * amount : e.deltaY < 0 ? zoom/ amount : zoom
    stage.scale.set(zoom)
    stage.children[0].scale.set(1/zoom)
  }
}

*/

  /* ---------------------[ Secure ]

 komoly gondok vannak az APK - al tulajdonképpen egy sima zip file .. benne van minden program és asset 

 http://www.justbeck.com/three-ways-to-encrypt-phonegap-and-cordova-mobile-applications/

 http://oleksiy.pro/2012/12/27/cordova-ios-security/

 egy closure compiler-t mindenkepenn erdemes raereszteni, mert eltűnteti a kódbol a változó neveket  

 https://closure-compiler.appspot.com/home

a natív kód se megoldás

 https://blog.nraboy.com/2014/11/extract-android-apk-view-source-code/



 http://jatekfejlesztes.hu/forums.php?m=posts&q=1239#bottom

 http://stackoverflow.com/questions/6235290/how-to-make-apk-secure-protecting-from-decompile

  hmmm. bitmap font generátor ... ez is hasznos lehet 

  http://spritesheetpacker.codeplex.com/ -texture atlas

  KIHAL ! ez a legjobb spritesheet generátor, ráadásul van benne content protection is,
  szerintem megéri a 40 €-t főleg, hogy unity alá is tud dolgozni


  https://www.codeandweb.com/texturepacker


szoval ebben kódolok : isomorphic javascript 

http://isomorphic.net/javascript


apk decompile

http://www.decompileandroid.com/

flash dead 

http://kotaku.com/the-death-of-flash-is-coming-and-not-everyones-happy-1717824387


http://webglstudio.org/  

egy js-ben megírt 3d editor a github-on ... ha nagyon kell akkor ebből tovább lehetne fejleszteni egy kényelmes játékeditort is ... nem kis munkával és totál feleslegesen 
viszont akár a saját elképzeléseket is beleépítve. 
Ugyanakkor a forrsából sok mindent tudok tanulni .. szóval egyáltalán nem felesleges a történet 

bakker most esett le, hogy a sublimetext-el meg tudom nézni faszán a png-ket is ha foldert nyitok !

KLHAL még jobb szerkesztő mint azt idáig gondoltam --- nemsokára meg is veszem

csak azt kellene kideríteni, hogy miként lehet onnan a fileneveket egyszerűen átkopizni a kódba ( biztos van rá megoldás )


{2015.10.08} - Megvan végre a szuper anyag blender sculp cycles-hez :: Geometry.pointnes + ColorStamp + diffuse color + light encant :: KIHAL !

Plusz rájöttem, hogy a sky csak kamera nézetben működik rendesen, de akkor lehet vele állítani a nap forgását is. 

2015.11.24 - megvan a wacom táblán hogyan lehet nem lenyomva használni a jobb gombot .. végre ... KIHAL !!


Blender Textures EYES png ++
https://cloud.blender.org/p/textures/#5673ec58c379cf0007b31b88


*/

  /*

TODO {2}

  [game]

    {rendszerterv}

    {ütemterv}

    {programozást érintő külső feladatok}

      {grafika}

      {szövegek}

      {cutscene}

      {reszponzív tervezés}

      {googleplay, facebook, iOS store, stream }

  [client]

    {mechanic}

      - card collecting 
      - card improving ( unlock prof, lock prof, improve prof, change prof order legendary - epic )
      - quest flow test 
      - buy
      - library online editor 

    {UX}

      + ux felépítése PIXI-t használva valami stabil jól használható módszerrel 

        - Main Screen
      - Select Actor
      - Library
      - Card Factory 
      - Deck Builder
      - Trading Post 
        - Buy booster
        - Buy special card
        - Buy solid 
      - Quest Line
      - PvP against 1 enemy :: Rivals{}
      - PvP against 2+ enemy :: Factions
      - W2-3
      - pixi.js
        - responsive és nyelvesíthetően kellene működnie az egész programnak 

        .. --> this in js  // mennyire egyszerű lenne , hogyha a this.valami helyett elég lenne ..valami formulát használni a javascriptben 

        {2015.10.04} -- hetekkel vagyok lemaradva a tervekhez képest. Minél gyorsabban össze kellene raknom vagy Phaser-ben de inkább PIXI-ben a teljes UI-t ++ 
                már lassan nem is emlékszem a program egyes részeira, annyira kiestem a történetből. A switchMatch beli megoldás ugyanakkor azzal 
                kecseget, hogy akár egyetlen vezérlő függvény is képes jól átláthatóan tartalmazni a játék logikát akár cliens akár szerver oldalon,
                mindezt pure js-ben megvalósítva - különössebb trükközések nélkül.

                a moneyMoneyMoney teszt pedig képes illusztrálni a PIXI js-ben rejlő lehetőségeket. Ugyanakkor rávilágít, hogy mennyire nem 
                stabil még a pixi és önmagában még kevés a boldogsághoz. 

                a glesjs jó irányba halad, de lehet, hogy az ejecta V8 lesz az igazi megoldás az ehető sebességű mobil js játékfejlesztés vonalon. 

                nem kellene megfeledkeznem az online fejlesztés lehetőségeiről se, ehhez, vagy html-ben kellene megoldanom a szerkesztőt ( ás akkor az csak desktoppon menne )
                vagy pixi.js alatt megcsinálnék egy szövegszerkesztőt, de mivel erre most nincs idő ezért maradok az a verziónál. 

                [ react like UI  >>  shadow UI ]

                valószínűsítem, hogy a legjobb egy shadow UI alapú játék felület megoldása lenne a legpraktikusabb, ahol a cél, hogy egy minél átláthatóbban és 
                egyszerűen le lehessen írni a játék UI elemeit. Utána annak a megfelelő eseményekkel megvalósított megoldását már ettől függetlenül lehetne megoldani.


                röviden ::  pixi.js / other graphics engine / html5 - ( megjelenítés )  - shadow UI ( interakció logika ) - switchMatch ( játék logika ) - localdb ( cliens database ) :: server {  real switchMatch ( gane logic )  - mongoose,js ( database ) }


        shadowUI 		kezdtem egy skeleton JSON-al, ami az egész alkalmazás vázát tartalmazza, ezen belül fog mozogni a shadowUI. A kérdés mindössze az, hogy ez így nem túl statikus-e ? 
                Ezek után a következő lépcső, hogy minden ui elemnek megadtam a típusát - ami jelenleg eléggé nagyvonalúan egyszerűsítő, de legalább nagyjából jelzi, hogy mivek mit lehet csinálni. 

                De ez még messze csak a váz, fel kellene tölteni működési logikával 

                például:

                  skeleton.setupBtn.callTo = skeleton.setupBtn.setup.goesTo // de ezt autómatikusan tudja, mert a gomb alatt csak 1 screen van és akkor alapvetően azt indítja 

                  más tészta a 

                  skeleton.setupBtn.setup.backToMain.callTo = skeleton.main.goesTo // mert itt egy másik ablakra hivatkozik 

                  ami egy csomó mindent magával hoz ::

                  skeleton.main.goesTo {

                    live { 	
                        ..newsPanel, 
                        ..avatarPanel uppdate { ..avatarPanel.playerNameField }, 
                        ..chatLine, 
                        ..libraryPanel 

                      }

                    uppdate { ..questLinePanel , ..questBar , ..rivalRunBar, ..factionBar }

                  }

                A skeleton alapvetően jónak tűnik, de amikor dinamikusan kezelt elemeket kell benne létrehozni akkor azért kérdések merülhetnek fel.

                még csiszolni kell rajta, és akkor egészen jól használható lesz a történet 

                - fontos lenne aktívan tudni, hogy melyik oldal melyik eleme a fókusz, kik vannak a képernyőn és őket el is kellene érnem


        Tapasztalatok	Úgy tűnik, hogy egészem használható ez a shadow skeleton megoldás, mert jól rendszerezhető lessz a program váza, főleg ha összejön minden hasznos funkció.

                kellenek monitoring és autoplay funkciók amik tökkéletesen jól fognak jönni a felhasználók aktivitásának megfigyelésére.

                Illetve serial-t is kellene rendelni a skeleton pontjaihoz, hogy érthetően el lehessen tárolni a cliens aktivitásait 

                Figyelni kell a mouseup-nál azt is hogy ott volt-e a mouse down is .. és bizonyos esetekben csak akkor kell klikként értelmezni az eseményt 

                mouse verziónál pedig over mouse-ra is lehet rakni eseményeket.

                + auto callTo for SCREEN under PANEL or BUTTON 

                - auto image for screen

                  console.log(travel(skeleton,':screen').map(function(f){return f.keydot.replace(/\./g,'-')}).join(CR))

                + vertical swiper -- kb. 20 perc alatt lehetett átírni a kódot, hogy a horizontal swiper verticálisan is működjön

                - az egész UI felületet 1 objektbe kellene zárnom, hogy tisztábban kezelhető legyen , de az irány feltétlenül jó

                - a swiper ( és a különböző panelek ) szintén korrektebben kezelhetőre kell cserélni 

                Egyre jobban használhatónak tűnik a skeleton - uppdate rendszer, egyrészt a struktúra átlátható marad, valamint nagyon gyorsan létre lehet hozni 
                újabb képernyőket, paneleket, sőt mindjárt a kártya renderelőt is átírom erre. Nem is tudom, hogy ennyi méretet és kooridnátát hogyan tudtam volna 
                átadni Ferixékne ... hetekig csak azon dolgoztam volna, és a folyamat is lassú let volna. De így nagyon gyorsan ki lehet alakítani a szükséges elemeket. 
                Utána meg minden átalakítás nélkül tudom használni a kódba. 

                + a kártyákat is skeletonból rakom össze ennek előnye, hogy az összerakó rutin sokkal egyszerűbb lett, valamint az infoboxokat is meg tudtam oldani, 
                és mostmár a W2 W3 lapok megvolósítása is jóval könnyebb lesz

                Azon is el kellene gondolkodni, hogy a skillek programozott működését is JSON-ban tárolhatnám, persze lehetne function-ban is. Ez hamarosna kiderül. 

        + Szöveg bevitel 	

                Ahhoz, hogy sikeresen meg lehessen oldani a tervezett online játékfejlesztést, mindenképpen szükség lenne egy szöveg beviteli modulra pixijs alá ! 

                Ez elsőre macerássabb mint gondoltam, mert még nem tudom , hogyan olvasom be a megfelelő karaktereket

                találtam egy canvas UI programot mindenféle elemekkel :: http://www.zebkit.com/ - de eléggé bénán néz ki a kódja van mindenféle UI elem benne 

                itt egy másik text editor :  https://github.com/grassator/canvas-text-editor - ebből talán egyszerűbb kiokomulálnom a karakter bevitelt 

                http://www.lutzroeder.com/html5/ - Netron - https://github.com/lutzroeder/netron - ugyan typescript




        Átvezető animációk 

                na ez jó kérdés, honnan veszek olyat , de a rendszernek ezt is kezelnie kell 


        + Kód kigyomlálása

                lecsökkentettem a kódot, mivel kigyomláltam belőle a html megjelenítést és a gathering system-et. ( save: gathering.js )

                a sublimetext ctrl+D -je az egyik legjobb találmánya amivel code editorban találkoztam az utóbbi időben


        minden kártyaforma megjelenítés PIXI-ben 

                Azaz szöveggel / szövegnélkül ... actor, item , scene , inplay , hand , 2w , 3w és ezek kombinációi  

                + scene in hand ( a scene kártyák eleve lehetnének 2W-k? )

                +  megvan a szélességre beállított szöveg is. 

                - szövegbe insertelt ikonok is kellenének, sokat dobna a történeten. 

        optimalizáció								

                a libraryban is probléma, hogy a maszkolt kártyák túlnyúlnak a lapon. De még inkább optimalizációra adna lehetőséget, hogyha a lapot ( szöveggel együtt )
                le tudnám renderelni, hogy ne kelljen minden alkalommal újra összerakni.

                Egyedül a profession ikonokat kellne módosíthatóra rakni, meg még talán a szövegboxot. 

                Ennek kellene adni egy kört.

                Ráadásul kisebb felbontású mobilokon is nyerhetnénk azon, hogyha a képeket a memóriába már megfelő méretben tárolnánk. 


                http://www.goodboydigital.com/the-pixi-js-rendertexture-arrives/

                http://pixijs.github.io/examples/index.html?s=basics&f=render-texture.js&title=Render%20Texture

                KIHAL ::

                  complexCardOject = pixiCardRender(KKK["B0U9"])

                  cardBake = new PIXI.RenderTexture( renderer , 250 , 320  ) // , PIXI.SCALE_MODES.LINEAR {0} , scale  {1}

                  cardBake.render( complexCardOject )

                  sprite = new PIXI.Sprite( cardBake )

                  stage.addChild( sprite )

          3d speed graphics 

                Nem tartozik szorosan a fejlesztéshez, de mostmár látom, hogy hajjal ruhával mozdulatokkal és szép szemekkel .. bőrtónussal sokat lehetne gyorsítani a fejlesztésen.

                Az EVE karakter tervezési részét is lehetne esetleg használni. Mert durván jól sikerült. Sokkal használhatóbb, mint az ESO-é.

          PIXI + Threejs 

                https://github.com/pixijs/pixi.js/issues/1366

                Ki kellene próbálni, mert desktopon lenne értelme 

                vér cuki :: http://codepen.io/Yakudoo/pen/YXxmYR
                space :: http://codepen.io/Xanmia/pen/bAypE
                galaxy + reapers :: http://codepen.io/Astrak/pen/BoBWPB
                earth - bump :: http://codepen.io/qkevinto/pen/EVGrGq
                vidampark + VR :: http://codepen.io/SaschaSigl/pen/XmJMzX

                local examples ami hasznos lehet 
                http://localhost/three.js/examples/#webgl_loader_assimp2json
                http://localhost/three.js/examples/#webgl_materials_texture_anisotropy
                http://localhost/three.js/examples/#webgl_shaders_tonemapping
                http://localhost/three.js/examples/#webgl_shaders_ocean
                http://localhost/three.js/examples/#webgl_shaders_sky
                http://localhost/three.js/examples/#webgl_octree_raycasting
                http://localhost/three.js/examples/#webgl_lights_hemisphere
                http://localhost/three.js/examples/#webgl_helpers
                http://localhost/three.js/examples/#webgl_geometry_colors_blender
                http://localhost/three.js/examples/#webgl_buffergeometry_drawcalls
                http://localhost/three.js/examples/#webgl_postprocessing_dof2
                http://localhost/three.js/examples/#webgl_postprocessing_glitch
                http://localhost/three.js/examples/#webgl_terrain_dynamic
                fly  - - http://localhost/three.js/examples/#misc_controls_fly  
                http://localhost/three.js/examples/#misc_controls_pointerlock
                http://localhost/three.js/examples/#misc_controls_transform
                http://localhost/three.js/examples/#webgl_materials_lightmap
                http://localhost/three.js/examples/webgl_buffergeometry_rawshader.html
                http://localhost/three.js/examples/#webgl_camera_logarithmicdepthbuffer

                skeleton anim - http://localhost/three.js/examples/#webgl_animation_skinning_morph
                        - http://localhost/three.js/examples/#webgl_animation_skinning_blending

                normal vector + paint to surface -- http://localhost/three.js/examples/#webgl_decals

                render to texture -- http://localhost/three.js/examples/#webgl_rtt


                lehet, hogy jobb is ha a threejs-re rakok pixi-t




          Összetetteb UI követelmény rendszer 

                Ugyan a kiindulás az, hogy a játék felülete mobilra készül, de az már most tisztán látszik, hogy számos követelménynek meg kell felelnie, 
                hogy egy igazán használható multiuser / multiDevice felületet lehessen vele létrehoznni. Ami egy ilyen jellegű játéknál alap, 
                sőt szinte a legtöbb játék programjának összerakása ezeken az elemeken múlik.  

                + direktbe elérni az ui elemeket :: skeleton.login.registrationBtn.pixi.position.set(0,0)

                -+ Fontos lenne jól definálható imagebackgrounded szöveges button 

                + secret input 

                - szöveges beviteli mező háttérrel 1 sorral 

                - alakítható panel, ahol könnyen lehet alignolni a hozzá tartozó elmeket. 

                - egyszerre csak 1 curzor legyen aktív = focus kezelés 

                + HTML policy for base64 png >> img-src 'self' data:

                + pos.s :: scale 

                + later bind hack :: avatar 

                - a skeleton megjelenítése mmm node mind app 

                - skeleton field bind ... elég fontos rész, mert sokmindent megkönnyítene 

                - skeleton autó indexelés ... ha valamit 1x megtalál, akkor azt elmenti és elsőre ott nézi meg, ha nem akkor keres 

                - HOLDER , FLOW 

                + // ui:uitype.HOLDER !!

                + moneyMoneyMoney beépítése backToMain gombbal 

                + uppdate( url , base )	 -- néhány hibától eltekintve ez az alapja az animált képernyő váltásoknak 

                - Megvan a legszebb hiba a programban:: Library az oldal lista tetején felfelé görögnek a lapok lassan -- sorba jönnek az új képek,
                  viszont ha nyomva tartom a gombot és a kilépés gombon engedem el, akkor a főmenüben sorra jelennek meg a lapok. VÁÁÁ !

                - nincsenek még modal view-ok					

                Canvas UI elmélet 
                // http://blog.sklambert.com/html5-game-tutorial-game-ui-canvas-vs-dom/		

          Játékmenet 

                { 2015.11.10 } akkor jöjjön az alappakli kiosztás , és ha játszik egy pvp-t vagy egy questet akkor kap 1 új lapot 

                megvan a collection lekérés ... lehet, hogy elsőre nem kellen bonyolítanom a dolgot és elég lenne 1 collection és 1 pakli 

                + most jöhetne a korrekt getAccount 

                + Avatar change ... és már a szerverrel lekommunikálja és szépen látszik is 

                + átjön a pakli is 

                + randomDeck

                + gameplay renderelés átírása skeletonra 

                  Ezt kellene ma letudni. A sekelton váz tulajdonképpen meg is van, csak inteligensen kellene használni, ez itt a nagy kérdés.
                  A lényeg, hogy az eddigi statikus megjelenítésről át kell térnem a dinamikus megjelenítésre, így a co-nak az animációs és az 
                  interakciós részeket is le kell tudni kezelni, ami több részfázissal jár. 
                  Viszont hogyha ez működik, akkor az azt is jelenti, hogy a program interaktív részének egy jelentős része már meg is lesz, 
                  valamint a tervek szerint akkor már a többjátékos verziók megvalósítása is közelebb kerül. 


                - mostmég elég sok helyen csak gyors megoldásokat kódolok a programban, de ez egyenlőre prototype ... viszont szerencsére a refaktor elég gyorsan tud működni. 

                + kliens olfalon számolt avaibleAvatars ! 

                - a deckBuildCode átrendezi a Player.collection sorrendjét 

                + a Coroutine elején meg kellene határozni a résztvevőket ... mert most még csak autó generálódnak 

                  co = new Coroutine()
                  switchMatch(co)

          Multiplayer Mobil game developing 

                https://www.quora.com/Why-arent-there-many-multiplayer-mobile-games-being-developed

                http://www.raywenderlich.com/86040/creating-cross-platform-multiplayer-game-unity-part-1

                http://www.androidcentral.com/talk-mobile/android-vs-blackberry-vs-ios-vs-windows-how-can-mobile-get-its-multiplayer-game

                Ezekből a doksikból egy autó page-t kellene készíteni a játékon belül 

                Nekem elég pörgősnek tűnik ezzel a módszerrel a fejlesztés, főleg ha a skeleton rendszer kibővülne az animációval is. 
                A 2 monitor tuti létfontosságú. A javascript mindkét oldalon jól teljesít, csak a kód kezd túlságosan szétszórt lenni.
                Viszont az is jó, ahogy a konzolból menet közben lehet tesztelnia dolgokat. Nincs fordítási idő. Tulajdonkéépen ezzel a 
                renszerrel egészen sexy lehet a fejlesztés, és ebben a sublimetext és a blender is nagy segítségemre van. 

                Vajon a unity-t hogyan lehetne hasonló módon konzolosan fejleszteni ?? Jó kérdés, valószínűleg az más világ. 

                Mondjuk ez itt még totál desktop fejlesztés, viszont ha meglenne a gyors pixi minden telón akkor simán futhatna ott is a kód. 
                Azért a js-nek hatalmas előnye, hogy mindent lehet 1 file-ba írni és konzol is van hozzá, nem kell a típusokkal szenvedni van 
                benne JSON ... hihetetlen zseni volt Brendan Eich, hogy sikerült az alapokat 10 napa alatt összehoznia 

                https://brendaneich.com/

                // 3D streaming application with js  https://aws.amazon.com/blogs/aws/build-3d-streaming-applications-with-ec2s-new-g2-instance-type/

                Douglas Crockford - a JSON megalkotója  - 2006 - tól van JSON 

                https://en.wikipedia.org/wiki/Douglas_Crockford

                https://dzone.com/articles/json-http-and-the-future-of-iot-protocols REST over JSON ?

                streaming binary data -- később ez lehetne a járható út a fejlesztésben. 

                http://binaryjs.com/							

                .bind  ::  $ ("button").click (user.clickHandler.bind (user));  -- lehet nem kellene self - eket használni ! 

                f = function(){console.log(this)} ; d = {p:'ez az'} ; f.bind(d)()

                http://javascriptissexy.com/javascript-apply-call-and-bind-methods-are-essential-for-javascript-professionals/

                - Azért kíváncsi vagyok végül mekkora lesz a program, jelenleg 5116 / 2099 .. 2015.11.12 

                Így hogy egyszerre haladok a kliens/szerver-db oldallal egészen érdekes a fejlesztés. Néha nehéz megtalálni a fókuszt. 
                Viszont cserébe úgy érzem, hogy controll alatt van a folyamat. A skeleton maholnap bizonyíthat, hogyha a játékmenetet is meg lehet vele viszonylag 
                könnyen csinálni. Tulajdonképpen ez a rész már azt feszegeti, amit a SLASH-al akartam készíteni. 

                - mikor jön el az a pont amikor úgy érzem, hogy a programot szét kell bontanom részekre ? {11.13}

                + kezdetek >>  07.04 >> 08.25  match.1 -> match.27 
                    http://localhost/old-afsmenu/www
                    http://localhost/old-afsmenu/www/match.html

                hmm. ilyen is van .. ez hasznos 
                https://developer.chrome.com/devtools/docs/blackboxing



          Raspberry Pi 

                http://prog.hu/tarsalgo/189695/szuperolcso-5-dollaros-varianst-kapott-a-raspberry-pi#e25

                lehet, hogy idővel beszerezhetnék egy ilyet, csak úgy szórakozásból .. kipróbálni mire képes egy 1500 ft-os gép. Tervezni hozzá 3D printed házat .... 
                js-ben csinálni egy rendszert. 

                http://cylonjs.com/documentation/platforms/raspberry-pi/

                ki lehetne próbálni, hogy milyen egyszerű beviteli és megjelenítő eszközt tudnék használni hozzá, amivel már valami értelmeset csinál.

          GravitonZone 3D !!!

                Tulajdonképpen a view átcserélésével akár 3D game is lehetne belőle, ahogy a játékosok ülnek körbe egy holo asztal körül és kártyáznak

                KIHAL - fejben megvan az elképzelés elég ütős lenne !!

                De legalább ilyen modellek kellenének egy csomó hozzá:

                  https://sketchfab.com/models/847e3c33a0ec4a81bcf8c644406b84d0

                  van 1 oldala .. meg tutorialja Z-Brushoz 


                  Itt a Star Conflict összes űrhajója és még kis figurák is vannak benne !!

                  1-1 ráadásul meg is vannak animálva ! Nem is rosszul 

                  https://sketchfab.com/star_conflict

                  Tanulság a sci-fi-hez fénylő kis cuccok kellenek mint a csillagtérképen 

                  http://stars.chromeexperiments.com/

                  base64 :: atob , btoa .. esetleg használhatnám a kommunkációban !!

          Magamról	
                2 hónappal azelőtt születtem, hogy az emberiség a holdra lépett. Már a általános iskolás koromban is startégiai társas játékokat készítettem papírból,
                a Star Wars mozi és az első videó játék, amivel találkoztam: Scramble  - hatására. 
                Közpsuliban kitanultam a repülőgépszerelést ( mondván a rajzból nem fogok megélni ). Utána szilikát vegyipari gépészetet tanultam ... de nem végeztem el,
                mert egyre jobban érdekelt a számítástechnika meg a szerepjátékok. Az egyik alapító tagaja voltam a Delta Vision Kft-nek .. innen a kapcsolat a kártyajátékokkal. 
                2000 - ben már mint szabadúszó elkészítettem a Master Crok kártyajátékot ( játékrendszer és grafika ), ami egy termék mellé csatolt mondhatni sikeres játék volt, 
                6 kiegészítő és egy társasjáték verzió is jelent meg belőle. A flash megjelenésével ismét többet kezdtem programozni ... idővel a magyarországi Disney-nél 
                kaptam Flash Developer állást. A játékfejlesztés, programozás és a grafika minden szinten érdekel. Világnézetet tekintve pedig logikusan hiszek Istenben és 
                mindazokban amik a Bibliában le vannak írva, és ezen a tükrön keresztül vizsgálom a dolgokat.

                https://sketchfab.com - ra is fel kellene tenni valami 3D modelt + 
                github-ra pedig valami használható kis programot 


          Klau verziója:

                Kezdetben nem volt semmi, csak a csönd, a sötétség és a mozdulatlanság. Majd jött a nagy erő, 
                Isten ki 6 nap alatt megteremtette világunkat, - többek között minket is - és a hetedik napon megpihent. 
                A történet legtöbbször idáig szól, de hacsak körbenézünk világunkban, láthatjuk, az alkotó folyamat sosem szűnt meg. 
                Mi is történt azon a bizonyos nyolcadik napon, amit a történet már nem részletez?  Hát ez: Az ember átvette a teremtő szerepét és megalkotta a JÁTÉKOT!


                  Szia Klau!

                  Enginer ... hmm ezt emésztenem kell, de legyen. 

                  Viszont a 8. napos sztori bár hatásosnak tűnik, de eléggé szembe megy a világnézetemmel. 

                  Persze, kiragadva a Biblia 1 mondatát lehet úgy is értelmezni, hogy Isten 7 földi nap alatt 
                  teremtette meg a világmindenséget, amit tökéletesnek gondolt, de hiba csúszott a számításba, 
                  és idővel megpróbálja helyrehozni ezért elküldi a fiát ...

                  De jól mondod: "...hacsak körbenézünk világunkban, láthatjuk, az alkotó folyamat sosem szűnt meg."

                  De nem csak mi emberek alkotunk,

                  Jézus is ezt mondja: "Az én Atyám mind ez ideig munkálkodik, én is munkálkodom." ( János - 5/17 )

                  Plusz már az elején 2 teremtés történetet ír le, az 1. a 7 nap története, amit így fejez be:

                  "Azután megáldotta és megszentelte Isten a hetedik napot, mivel azon pihent meg Isten egész teremtő és alkotó munkája után."
                  "Ez a menny és föld teremtésének a története."

                  ... majd folytatódik a 2. teremtéstörténettel :: 

                  "Amikor az ÚRisten a földet és a mennyet megalkotta,..."

                  azaz ezzel a félmondattal máris visszaugrottunk időben a 6. napra. Így az egész Bibla, az emberiség története
                  tulajdonképpen a 6. napon történik. A 7. nap pedig nem más mint az a nap - vagy nevezzük korszaknak - 
                  amikor a Teremtő megpihen, mert: "És látta Isten, hogy minden, amit alkotott, igen jó."

                  Azaz a megszentelt 7. nap , - amit minden szombaton ünnepelni kellene ( 4/10 parancsolat ) - 
                  nem más mint az elkövetkező örökké valóság. 

                  Így meglátásom szerint az Isteni idő fogalma teljesen más, mint a mi emberi fogalmunk az időről.
                  Ennek nyomát számos helyen megtalálhatjuk az Írásban. De kb. ez a legtömörebb verziója. 

                  Ebben a meglátásban azért bízok, mert ennek a fényében rengeteg dolog helyére kerül. 
                  Nekem kb. ez volt a kulcs a megtéréshez. 

                  Pld. 

                  Miért van annyi szenvedés: mert a születés - alkotás - teremtés alapvetően egy fájdalommal járó,
                  de egyben felemlő folyamat, és most ennek vagyunk részesei.

                  Hol az Isteni igazságosság?  A 7. napon mindenki feltámad, és örök létet kap.

                  szóval kissé szerényebb felütést választanék magunknak.

                  http://szentiras.hu/KG/J%C3%A1n5

          Talán Arkhimédész	https://hu.wikipedia.org/wiki/Arkhim%C3%A9d%C3%A9sz


          Grafikus Tesztmunka 

                Karakter , jármű és felszerelés illetve háttér concept grafikusokat keresünk. 

                Világ:

                Az emberiség túléli a XXI.-ot. Számos háború és konfliktus után a megosztott nemzetállamok helyét 2 cégóriás foglalja el. 								
                Irányításuk ( és versengésük ) alatt az emberiség átlép a XXII. századba. A földön a természet leamortizálása miatt csak a nagyvárosokban emberi az élet, 
                viszont vannak akik a premvidékre szorulnak, és ott kénytelenek tengetni napjaikat. 
                Közben a technika rohamos fejlődésének köszönhetően elérkezett az idő az űr tényleges meghódítására. Bázisokat építenek a  holdon, a vénuszon és a marson. 
                Ekkor az egyik cég felderítő űrhajóha egy idegen űrhajó jeleit érzékeli. Nem vagyunk egyedül a galaxisban! 

                Ezt a világot jelenítjük meg egy online gyűjthető kártyajátékban - TCG 

                Tetszés szerint rajzolhatsz karaktereket, űrhajókat és/vagy helyszíneket. 

                A csatolt képekhez hasonló minőségű munkákat szeretnénk kapni. 
                A karaktereknél ne zavarjon meg, hogy a példakarakterek legtöbbjénél fegyver van. A mi játékunkban nem lessz ennyire gyakori, nem egy egymást gyilkolászós
                játékról van szó. Fontos, hogy a karakteresek legyenek, közel realista, változatos pózokban ( de ne széles mozdulatokban ), egyedi stílusú ruhákban, esetenként
                jövőbemutató eszközökkel. 
                A robotok inkább cél robotok, jelenleg nem rendelkeznek emberi initeligenciával. 

                A háttereknél a csatoltakhoz hasonló részletességű kül vagy beltereket szeretnénk látni, akár a földön, akár tetszőleges idegen helyen vagy az űrben. 
                Nem nagy titok, hogy a kapcsolat felvétel után a játékosok idegen világokba is el fognak jutni. 



          Nullpoint studio

                + Logo 

                + Névjegykártya 

                Weboldal 

                Fasza, hogy ezzel kell vackolnom amikor még sehol se tart a játék. 

                nyomda online leadás - - - http://copycat.hu/anyagleadas/

                - - akkor jöhet egy háttér kreálása ... PS / Belnder vagy Krita -- Krita egész jónak tűnik a 

          Best of Nightwhish

                - Whishmaster
                - Nemo					
                - She is my sin same as 1
                - Walking in the Air 
                - While your lips are still red 
                - Eva
                - Ever Dream
                - Getshemane
                - Feel For You
                - Deep Silence Complete
                - Swanheart

                // - Wunderlust

          Coming games:

            The Devision 
            Cyberpunk 2077 - egy szépen megcsinált női modellel sokmindent el lehet adni. 
            For Honor 

          C#	
            online test ::
            http://csharppad.com/

          Chrome Experiments 

            https://www.chromeexperiments.com

              ide is el lehet küldeni majd a programot 

            Star Citizen csillagtérkép

            https://robertsspaceindustries.com/starmap

            Nagyon szép klasszikus dungeon bejáró  game
            http://www.playkeepout.com/

            ráadásul böngésző alatt totál jól fut a mobilomon !! KIHAL 
            ha bekapcsolom a full screen-t akkor jó is 

            Nagyon látványos világ gazdasági 
            http://globe.cid.harvard.edu/?mode=productspace&id=3214

            brutál szinti 							github 
            http://nicroto.github.io/viktor/   		https://github.com/nicroto/viktor-nv1-engine

            post apocaliptic filter to streetview 
            http://www.sonorans-valley.com/

            jó az anim az elején .. bár szaggat 					
            http://stuffadventure.com/

            a játék meg egy p.a. dofus-nak tűnik ( közben a fdofus oldala is sokkal "átláthatóbb lett" )

            majdnem frankó hánykolódó vitorlás hajó 
            https://jbouny.github.io/fft-ocean/#sunset

            space sound with some 3d visual 
            http://www.yaranyared.com/

            interstekkar experience  - - a film alapján  --  van benne tuti jó kis űrhajó belső :)) 
            ami tanulságos, mert valós alapokon nyugszik, például mindenhol vanak kapaszkodók !! Plusz rekeszek, panel hegyek !! 
            vezérlő joystic :) emergenci bar .. tuti 
            http://endurance.interstellarmovie.net/

            látványos looper - diszkó zenészeknek 
            http://superlooper.universlabs.co.uk/

            dungeon generátor, később még jól jöhet 
            https://www.chromeexperiments.com/experiment/random-dungeon-generator

            Szép régi verdák tökkéletes a modelek anyag beállítása 
            http://carvisualizer.plus360degrees.com/classics/

            teljes keverő rendszer node editorral 						
            http://app.hya.io/

            szemgolyó varióló program  .. szintén THREEjs 
            http://www.vill.ee/eye/

            lego street view 
            http://brickstreetview.com/streetview/zw4AAcWG1zErfLcZzmRFSg

              ... de ami igazán durva :: https://www.shadertoy.com/view/XtsSWs  

                egy real time működő város shader-ben megírva ... bakker itt a shader kód meg a futó cucc .. irtó durva!! 
                na jó nagy ablakban már egy kicsit .. de nem sokat szaggat 

                ezaz !!! a shadertoy egy shader haven !!

                van itt a felhőktől a rétekig minden 

                      endeles táj 								https://www.shadertoy.com/view/MdBGzG

                      tökkéletes scifi terep 						https://www.shadertoy.com/view/Xtf3Rn

                      napfelszin örvény 							https://www.shadertoy.com/view/MsXGRf

                      tökkéletes graviton zone cloud 				https://www.shadertoy.com/view/Xd23zh

                      táj vízzel fákkal mindennel tökkéletes 		https://www.shadertoy.com/view/4slGD4

                      65 sor csillag térképe  					https://www.shadertoy.com/view/XlfGRj

                      scifi vhiar meg minden  					https://www.shadertoy.com/view/4ts3z2

                      tokyo by night and rain 					https://www.shadertoy.com/view/Xtf3zn

                      color palette 43 line az alapokhoz			https://www.shadertoy.com/view/ll2GD3

                      sf in computer feeling   					https://www.shadertoy.com/view/lss3WS  egyáltalán nem free 

                      szuper stone + orbit 						https://www.shadertoy.com/view/ldSSzV

                      tér görbület 								https://www.shadertoy.com/view/llj3Rz

                      bolygó a viharban 							https://www.shadertoy.com/view/4lf3Rj

                      cave race 									https://www.shadertoy.com/view/MsX3RH

                      standard space travel 						https://www.shadertoy.com/view/Xdl3D2

                      vertex moving 								https://www.shadertoy.com/view/4slGzn

                      ködös folyosó 								https://www.shadertoy.com/view/XsSSRW	

                      underwater eliens 							https://www.shadertoy.com/view/lssGRM

                      eye of twister								https://www.shadertoy.com/view/XlsGRs

                      galaxy forgását		 						https://www.shadertoy.com/view/Xsl3zX	https://www.shadertoy.com/view/MdXSzS

                      cartoon render 								https://www.shadertoy.com/view/4slSWf

                      nice smoke 24 line 							https://www.shadertoy.com/view/MsjSW3

                      rock shader 								https://www.shadertoy.com/view/MsXGzM

                      sf digital brain 							https://www.shadertoy.com/view/4sl3Dr	nem free

                      oblivion droid full  animálva  				https://www.shadertoy.com/view/XtfXDN

                      paint brush experiment 						https://www.shadertoy.com/view/ltj3Wc

                      deformed grid line: 27						https://www.shadertoy.com/view/4sXGzn

                      spectrum loading retro 						https://www.shadertoy.com/view/lsl3Rn

                      oblivion radar 								https://www.shadertoy.com/view/4s2SRt

                      perfect mushroom + env						https://www.shadertoy.com/view/4tBXR1

                      motion blur line:60							https://www.shadertoy.com/view/MdSGDm

                      procedural eye . full working 				https://www.shadertoy.com/view/XsfGWj

                      teljes space race - no controll 			https://www.shadertoy.com/view/XtfGzj

                      machine from lines 							https://www.shadertoy.com/view/Xd2XWR

                      interactive RGB / HSV 						https://www.shadertoy.com/view/lsdGzN

                      painter bas line: 10						https://www.shadertoy.com/view/lt2XRD

                      seascape									https://www.shadertoy.com/view/Ms2SD1



                Talán egy shader alapú rajzoló írása se lenne teljesen hülyeség ezek után 

                Mostmár ki kellene találnom, hogy miként tudom a shadereket felhasználni, ha sikerülne 1 shader-t 
                beépíteni, akkor máris egy új világ tárulna fel előttem. 

                + Meg van az első shader programom  =	../view/lt2XRD  +  ../view/MdSGDm

                https://www.shadertoy.com/view/lsc3DN :D csak, hogy szociális legyek

                itt úgy van a shader mint a webGL-ben
                http://shdr.bkcore.com/

                http://glslsandbox.com/e#29376.1  itt meg fullban megy a háttérben a shader 


                      gravity painter and anim 					http://www.iamnop.com/particles/		Nop Jiarathanakul - nem véletlen már az autodesknél csinál webviewert
                      van egy volumetric renderer-je is 			http://www.iamnop.com/volumetric/

                      WEBGL hírek + shader tutorial				http://learningwebgl.com/blog/

                      Ha jól látom érdemes lesz rájönni, hogyan is kell átkonvertálni a shadertoy-os cuccokat THREE alá
                      és írni egy minimum konfigot, ami interaktív működik a telón is. 
                      No meg persze a tableten is ki kéne próbálni. 

                Mostmár csak össze kellene dobni valamit mert közben a programommal se haladok. 

                http://www.awwwards.com/creative-code-css-javascript-webgl-and-three-js-experiments.html

                      fluid simulation 		http://cake23.de/turing-fluid.html

                      flat surface 			http://matthew.wagerfield.com/flat-surface-shader/

          Na megint a gl és a shader van a soron úgylátszik ezt a témát nem úszom meg. 

          - KUKA !

          + 5 prof icon 

          hugi +0044 7543-192347

          OpenGl Shader functions GLSL
          https://www.opengl.org/sdk/docs/man/					

          BSD / FREE BSD és egyéb jogi kérdések

                https://hu.wikipedia.org/wiki/BSD_licenc											


          Fullscreeb THREEjs a megoldás ezek szerint CHrome alatt ??				

            var elem = document.getElementById("myvideo");
            [ 'requestFullscreen', 'msRequestFullscreen', 'mozRequestFullScreen', 'webkitRequestFullscreen' ]

            + var canv = document.querySelector('canvas') ; e.onclick = function(){ e.webkitRequestFullscreen() }

            presze át kell gondolni a képernyő arányokat, meg a mobil irányát is + közben a programnak is fejlődnie kellene,
            de már megint egyszerre szeretnék mindent. Egy meggyőző mobil teszt viszont fontos kérdéseket vethetne fel hétfőn.

            azért nem kicsit bonyolult a program és csak a weben jön be ... szóval ...

            main = document.getElementsByClassName('main')[0]
            main.style.visibility = 'hidden'

            http://www.iamnop.com/particles/

            fpsdom = document.getElementById('fps');fpsdom.style.visibility = 'hidden';music = document.getElementById('music');	music.muted = 1  
            Mousetrap.bind('esc',function(){ var mstyle = document.getElementsByClassName('main')[0].style ; mstyle.visibility = mstyle.visibility == '' ? 'hidden' : '' },'keyup')

            A Microsoft Expression capture hozza eddig a legjobb eredményt, de egy normál verzió kell belőle. 

            - - - a mai napnak se volt eddig igazán sok értelme - - - 

http://stars.chromeexperiments.com/

// hack the zoom 

function travel(v , t , ease ) {
  t = t || 3000
  ease = ease || Tour.Easing
  camera.easeZooming = new TWEEN.Tween(camera.position)
      .to({
        z: v
      }, t )
      //.easing(Tour.Easing)
      .easing( ease )
      .start()
      .onComplete(function() {
        camera.easeZooming = undefined;
      });

  camera.position.target.pz = camera.position.z;
  camera.position.target.z = v;
  updateMinimap();
}						

function *stepp(){

  yield zoomIn(100)
  yield zoomIn(300)
  yield zoomIn(5000)
  yield zoomIn(500000)

}

travel(1);NN = new stepp()


travel(NN.next(),70000,TWEEN.Easing.Exponential.Out)


travel(500,150000,TWEEN.Easing.Exponential.Out)


window.onkeydown = function(k){ if (k.keyCode == 82 ){ zoomIn(300000) }  }

            {cursor : none;}

            #41642e

            nagy program, de szépen kódol , van benne screen shoot is :D , csak engedélyezni kell a popupokat 

                var _takeScreenshot = function() {
                       _engine.renderer.getImageData(function(dataUrl) {
                        var url = Utils.dataUrlToBlobUrl(dataUrl);
                        Utils.openUrlInNewWindow(url, window.innerWidth, window.innerHeight);
                    });
                };

            illetve tetszetős a keyboard kezelése is 

             Ami emiatt is szuper ::

             Mousetrap.bind('a b d',function(){ console.log('secret combo ABD!')  },'keyup')

             https://craig.is/killing/mice

             KIHAL - ideje használni 



        GitHub 		https://pages.github.com/  lehet érdemes kipróbálni 


        Threejs 2D 

            var frustum = new THREE.Frustum();
            frustum.setFromMatrix(new THREE.Matrix4().multiply(camera.projectionMatrix, camera.matrixWorldInverse));

            for (var i=0; i<objects.length; i++) {
              objects[i].visible = frustum.intersectsObject( objects[i] );
            }

            + megvana THREE 2D teszt ... nézzük mit szól hozzá a mobil. 

            + KIHAL a mobilon is szuper gyorsan fut a tesztverzió

                  http://localhost/gaf/area62/    http://game.nullpointstudio.com/area62.html

                  A hét egyik legjobb híre. 

                + 3d model teszt >> threeSpriteWithModel :) ez is frankón ment, ezek szerint már js-el is tutin meg lehet hajtani a mobil-t,
                legalábbis a telómon, a tableten talán még frissíteni kell a böngészőt, 
                utána már csak az a kérdés, hogy apk-ra fordítva is működik-e a történet, és, hogy konkrétan milyen telókon, na azt szép letesztelni. 
                De az lenne a tuti megoldás. 


            http://www.goodboydigital.com/pixi-js-v2-fastest-2d-webgl-renderer/
            valahogy PIXI-ben is lehet shader-t írni. 

            Illetve THREE - ben hogyan lehetne pixel perfect 2D positioningot csinálni. 				

            THREE text 

            http://japhr.blogspot.hu/2012/09/positioning-canvas-text-on-threejs.html
            http://gamingjs.com/ice/#

            PIXI shader ? http://jsfiddle.net/glafarge/rf6xybm0/


        QT + V8 

          A PureRef Qt framework-öt használ, ami egy cross platform C++ IDE    http://www.qt.io/qt-framework/
          Szintén egy szimpatikus megoldás lehetne, ha egy 

            Qt + V8ES6 progit lehetne csinálni  https://wiki.qt.io/Qt_Script_V8_Port

            chromium project 	http://www.chromium.org/developers/how-tos/install-depot-tools

          Ami szimpatikus benne. hogy a PureRef mindazt amit tud 19mb-ből tudja, és ha tényleg minden eszközre lehet vele komoly 
          programot írni, ráadásul mint látom grafikában egészen jó, akkor lehet, hogy érdemes lenne építkezni rá. 

          van benne HTML5 is 

          https://wiki.qt.io/QtWebEngine

          Az Open verziója LGPL alatt - pw:tm .. kocka elvetve felrakom , legalább lesz lehetőségem C++ is kódolni ha kell, 
          a rendszere meg elég hasonlónak tűnik ahoz, amit itt skeleton-ként csináltam, talán eccer jól jön. A PureRef győzött meg, hogy érdemes használni. 
          jó lassú az instalja az e:/soft/qt -ba rakom. 
          ezt "bírom" a c++ -ban, hogy a fejlesztéshez mindíg akkora körítés kell, ennél már csak a java a durvább .. iszonyú lassú 


          jatekfejlesztes.hu pw:tp

          C# alapok >> https://devportal.hu/download/E-bookok/csharp%20jegyzet/C%23%20programozas%20lepesrol%20lepesre%20-%20Reiter%20Istvan%20(frissitett%20tartalommal%202012.10.15).pdf

        Weboldal látogatottsági lista http://www.easycounter.com/report/google.com


    { játék elnevezés }

      - exosensei
      - exoconflict
      - exotheory
      - lostlings
      - exoarea
      - crux of silence 
      + gravitonzone

    { nullpointstudio.com }

      - Hétfőtől ennek is nekiállhatok .. kíváncsi vagyok a többiek milyen irányba gondolkodnak. 

    { 2015.1108 - process }

      Az avatar kivallasztasra is mar csak 1 gombot kell felrakni meg persze összekötni az adatbázissal. 
      Utána lassan jöhetne az account alap felszerelése: pénz, paripa, fegyver.
      Kezdetben persze elég lesz Kliensenként 1 Account.

    + Utána kell nézni a szervernek, hogy él-e még ... él :D

    :) ebben a sok emailben elveszett egy branch ... szerencsére inkább csak a 

    fix pixi.js   25541

      if(!displayObject.visible) -> if(!displayObject || !displayObject.visible)

    {game play}

     - AI calculate value before play card - instead of random
     - switch at all point where code dont run immediatley
     - Correct implementation of cards skill - B, C , H , R 
     - Interaction for user
     + Animation 
     - Scalable AI

     {security}

      http://www.html5rocks.com/en/tutorials/security/content-security-policy/

      JSON Web Tokens 

      http://jwt.io/introduction/

    { devices }

      browser 

        + chrome 
        firefox
        internet explorer

      mobil 

        + cordova ??
          + android
          - iOS 
        - how to use device GPU ?? 


  [server]

    + {clien server communication test}
      we have good way to translate client side program to server without too much pain ( i hope so )

    + { same code work on server as is browser }

    + {global error handling  .. fake one but works fine }

    {database}

      + root of database 

    {game flow}

      { client/account handling }

      {gathering system}

      {pvp handling}

    {stress test}

    { oneline game editor }

      + Editor // expect home, end 

TODO  {1} { removed }

  https://popping-heat-6608.firebaseio.com/#-Jv9Fdd-AupwaU2zD31n|afb99c7961105f2a6f52f9af0c0a06c2

  Hogyan jelöljem a 3-asnál nagyobb szintű szakmákat ??
    - +4 			?
    - vonalakkal 	?

open source photo to 3D solution 

http://opensourcephotogrammetry.blogspot.co.at/

https://github.com/openMVG/openMVG

http://insight3d.sourceforge.net/
http://insight3d.sourceforge.net/insight3d_tutorial.pdf

már működik a chrome-alatt az Object.assign is , de a pixi.js-ben van egy helyettesítő függvény ha nem futna mindenhol !

object.clone :::

o = { a: 1 , b: 23 };  c = Object.assign( {} , o ) ; c.a = 33; c // KIHAL 

sőt össze is lehet vele rakni objektumokat 

Vannak amik még nem működnek chrome alatt. 

http://babeljs.io/repl/#?experimental=false&evaluate=true&loose=false&spec=false&code=let%20%7B%20name%3A%20n%2C%20age%3Aa%20%7D%20%3D%20%7B%20name%3A'Harold'%2C%20age%3A57%2C%20weight%3A87%20%20%7D

log = (function( a:a='ES6 prameter definition'  ){ return a})()

let { name: n, age:a } = { name:'Harold', age:57, weight:87  } ;; console.log( n,a )


vér profi 3D karakter artist - kicsit hiperrealistában tolja 

http://kollarandor.com/about/

concept art grafikus 

https://www.facebook.com/aronfeboart/

ruha modellezo program 

http://www.marvelousdesigner.com/product/pricing

egy régi ismerős :: Grőb Attila  https://www.facebook.com/attila.grob?fref=ts http://invokerstudios.com/index.php

https://www.youtube.com/watch?v=M-ZmHigjxGw


--- GRAFIKUSOK --- 

  Nóthof Ferenc  http://originalexit.blogspot.hu/ 

  http://mcqueconcept.blogspot.hu/

  Otto Schmidt - szexista , de vannak jó női beállításai - http://www.kaifineart.com/2015/02/otto-schmidt.html



programming languages syntax:
http://rosettacode.org/wiki/Averages/Arithmetic_mean#Brainf.2A.2A.2A


jó konceptek
https://www.facebook.com/profile.php?id=620600957&sk=photos&collection_token=620600957%3A2305272732%3A69&set=a.10153382418370958.1073741846.620600957&type=3&pnref=story

játszva tanuljunk kódolni 
http://codecombat.com/play/dungeon

küdtáblák és a magyar ékezet kezelés bugyrai:  http://web.axelero.hu/lzsiga/ekezet.html#S0008


közben a z-brush is fejlodik .. mar z modeller is van benne ami eddig nagyon hiányzott belőle.

webdesign::

  http://sarifindustries.com/en/#/sarifandyou/sarifindustries/

  http://www.omnetsolution.com/blog/50-best-inspiring-gaming-websites/comment-page-1/

  https://www.pinterest.com/dreamcodesign/video-game-website-designs/

  https://www.destinythegame.com/

  http://www.gengame.net/2013/03/tons-of-concept-art-and-a-character-development-video-for-bungies-destiny/



pure js add/remove CSS class 
  document.getElementById("div1").classList.add("classToBeAdded");
  document.getElementById("div1").classList.remove("classToBeRemoved");

*/



  // http://www.html5rocks.com/en/tutorials/file/xhr2/

  // -------------------------------------------[ ACE development editor ]

  // http://krasimirtsonev.com/blog/article/Chrome-extension-debugging-dev-tools-tab-or-how-to-make-console-log
  // http://stackoverflow.com/questions/13545433/autocompletion-in-ace-editor

  var editor // +1 global
  function createACE() {

    if (!ace) { return }

    var docEdit = document.createElement('div')
    docEdit.id = 'editor'
    document.body.appendChild(docEdit)

    editor = ace.edit("editor")
    window.editor = editor
    editor.setTheme("ace/theme/monokai")
    editor.getSession().setMode("ace/mode/javascript")
    editor.setOption("showPrintMargin", false)
    editor.setFontSize(10)
    editor.doc = docEdit

    editor.$blockScrolling = Infinity // prevent debug message 

    // editor.setValue( createACE.toString() )

    // lehet a skilleknek is valami hasonló módon beépíthetőnek kellene lennia, akkor könnyen lehetne őket fejleszteni 

    //editor.commands.addCommand({
    editor.commands.addCommands([

      {
        name: 'backdoor', bindKey: { win: 'Alt-right', mac: 'Command-Enter' },
        exec: function(editor) {
          var prog = editor.getValue()
          // console.log( prog )	
          backdoor(prog)
        },
        readOnly: false // false if this command should not apply in readOnly mode
      },

      {
        name: 'escape', bindKey: { win: 'Esc' },
        exec: function(editor) {
          var eds = editor.doc.style
          eds.top = 120 + XX
          eds.left = 838 + XX
          eds.width = 430 + XX
          eds.height = 275 + XX
          eds.visibility = 'hidden'
          editor.resize()
        },
        readOnly: true
      },

      {
        name: 'fullScreen', bindKey: { win: 'F2' },
        exec: function(editor) {
          var eds = editor.doc.style
          eds.top = 0 + XX
          eds.left = 0 + XX
          eds.width = 1100 + XX
          eds.height = 720 + XX
          eds.visibility = ''
          editor.resize()
        },
        readOnly: true
      }
    ])

  }

  this.devWorks = function() { // kihal most hidden módba működk - mera callTo ha ráklikkelek !!

    if (editor && editor.doc.style.visibility == '') { return }

    if (!editor) { createACE(); editor.commands.commands.escape.exec(editor) }

    if (here == 'main' && !flyingCards.length) {

      editor.commands.commands.escape.exec(editor)
      editor.doc.style.visibility = ''
    }

  }

  this.fullDev = function() {
    if (!editor) { createACE() }
    editor.commands.commands.fullScreen.exec(editor)
  }




  // -------------------------------------------[ user interface elements ]

  /*

    van vele még némi probléma:

      KIHAL - simán egy kipozícionált befókuszált textarea-al működik a történet - alapaban .. persze van még némi kérdés !!

      + elméletileg nem kell a PIXI.Text-hez hozzányúlni ( mostmég - és csak browserben működik - de szerencsére csak online edithez kell )
        - show cursor
        - show selection 
        - exit with undo
        - exit with save
        - ctrl+s
      - ctrl+v
      - ctrl+x 

      - indításkor oda kellene tenni a kurzort ahova klikkel a user 
      - libraryban autó scroll az itemekre 
      - killkor törölni az area-t 


    Szóval még egy tonna probléma van a történettel 

    vagy a library-t kellene megcsinlnom, vagy a deck build-et.

    a library-nál vagy local de inkább server save megoldás lenehtne az üdvös. 
    mindkettőhöz OO-ba kellene átdolgoznom a swipert , de a library-hoz a szerver oldallal és a 
    szöveg bevitellel is törődnöm kellene. Viszont akkor el lehetne kezdeni az Exocore lapkészlet 
    felépítését. 

    A deck buildhoz viszont elég a swiper finomítása, 2 swiper 1 oldalon ami megmutatná, hogy 
    mennyire jól használható, és ráadásul el lehetne kezdeni a 2W-3W lapok kezelését is. 

    A swipernek mindig tisztában kell lennie az adott search és filter szűkítéssel 

    Illetve a játék rendszerbe lehetne valami interaktivitás tesztet belevinni 	

    A blender - bake - test sun size: 0 - al hihetetlenül jól sikerült, még 7-es render értéknél is nagyon jó eredményt ad, 
    és ráadásul gyorsan! 

    Ha még egy generális rust-ot is rá tudnék tenni a modellekra anélkül, hogy UV-nom kellene őket, akkor 
    igazán fel lehetne gyorsítani a grafika készítését. 

    Persze az lenne a lényg, hogy a lehető legkisebb befektetéssel lehessen a legtöbb változatos karaktert 
    tárgyakat és háttereket létrehozni. 

    de most ideje kódolni 


    A swiperben kezd nagy lenni a gányolás .. KIHAL .. át lett alakítva OOP -ra így már kezelhetőbb lesz ... remélem 

    + a gányolás nagy része megoldva, hogy oop-ba át lett alakítva .. mindjárt fel is gyorsult az interface fejlesztés 
    - a skeleton átalakítasa objektummá szintén sokat lendíthetne a történeten. 

    1144085 - MICROSOFT Sculpt Mobile Bluetooth billentyűzet (T9T-00020) - 

      stop shop 	9999

      arkad 		7500

      budaors		7000

    Na beállítottam a blenderben a panoráma renderrert meg az autó csillagkép hátteret. Azt azért sejtem, hogy egy panoráma háttér renderelés
    mindenképpen lassú és minél nagyobb felbontásba érdemes megcsinálni. 

    Mondjuk egy belső térnél érdekes lehet a történet 

    + Letöltöttem egy tonna alien képet is


      p = skeleton.main.libraryPanel.library.nameOfCard.pixi
      createInputArea(p)
      e = document.getElementById('inputbox')
      console.dir(e)

        érdekes attributumok : 

          - value
          - selectionStart
          - selectionEnd
          - selectionDirection
          - rows

          - onblur, onemptied , onended, onfocus, onpaste, .. many more 


    KIHAL F12 is átkapcsolja a debug panelt 

    - egy jó kis PIXI objektumot lenne érdemes csinálni a rich text editorból ... persze nem tűnik egyszerűnek.
      viszont akkor egy teljesen a saját ölteteim által kezelt editorral tudnék dolgozni, ami hosszú távon még 
      kifizetődő lehetne. És amit még a flash-ből is hiányoltam. 	


    Ha eleve csak sorokkal dolgoznék talán könnyebb dolgom lenne, mert soronként lehetne egy objektum és egy jelző, 
    ami megmutatná a sor tartalmaz-e olyan	sortörést, ami túlcsordulás miatt van, 
    akkor már közel pontosan ki lehetne számítani a cursor pozícióját és csak 2 sor esetében kellene karakterenként számolni a pozíciót, 
    de azt is csak a shiftes jelölésnél		  

    + textbox funkció kizárása az Editor-ból

    Elég lenne annyi, hogy a selection első és hátsó sorának is tudjam a pozícióját mint következő lépés és akkor megint beljebb leszek egy lépéssel. 

    Az is elképzelhető, hogy lerenderelem a teljes sort és akkor jó közelítéssel meg tudom előrre mondani, 
    hogy hol és hány sor törés kellene bele, Míg így szavanként kell eldöntenem hol is vannak a törtések.

    + Víz szerelő !!!

    + Szemét díj !!!

    Befizetések !!!

    - a szerver minden esetre működik  

    Rímelnek a dalunkban a sorvégek.
    Leszünk mi még Dánok is meg Norvégek.

    KIHAL a moneyMoneyMoney + Editor teszt is szuperül működött ... ez legalább ígéretes. 

    Az editor hibái:	


    http://pixijs.github.io/examples/index.html?s=basics&f=text.js&title=Text

    bakker itt van wordWarp és a style-ban kell megadni !!! ÓÓÓÓÓ 

    meg lehet stroke-ot is adni neki 

    t = skeleton.game.setup.start.pixi.children[0]
    t.text = playerVsAIResult.toString()
    t.style.wordWrap = true
    t.style.wordWrapWidth = 120
    t.style = t.style		


    Nos totál hiába dolgoztam azthiszem ezen a szövegszerkesztőn, mert messze nem hozza azt, 
    amit elvártam tőle, lehet meg kellene nézni, hogy HTML elem renderelése vajon milyen erdeményt hoz, 
    illetve mekkora sebességgel működne a történet. 

    Mer ha az sikerülne, akkor az ilyen szövegbevitelek sokkal egyszerűbb feladatot jelentenének...

    nem is emlékszem erre is elment vagy 3 napom. 

    Végülis nem olyan rossz. A katasztrofális és a csapnivaló közé pozícionálnám inkább. 		

    Azt is megnézhetném, hogyha simán HTML elemekkel keverem a szükséges esetben a programot, 
    akkor annak milyen hatása lenne mondjuk mobilon .. de ezt se most 

    vissza az ES6 core tesztre 

    Elméletileg ez egy canvas editor - lehet ez kell nekem 

    https://github.com/danielearwicker/carota  -- ez meg van csinálva, de nekem túl bonyi lesz. 

    canvas font baseline settings: 

    http://www.w3schools.com/tags/playcanvas.asp?filename=playcanvas_textbaseline&preval=alphabetic

    cross browser font rendering issue::

    https://github.com/pixijs/pixi.js/issues/1021


 KIHAL megvan egy canvas szöveg szélessége:: 

    e = new Editor('valami')
    e.inputbox.context.measureText('Hello').width
    e.inputbox.setWarp(500) !! 

    */

  // PIXI rich editor  -- majd eccer !

  // PIXI.Text.prototype.setWarp = function( wide ){ this.style.wordWrap = 1; this.style.wordWrapWidth = wide || 200; this.style = this.style  }

  // redit  inputbox , area 

  /*

  Kell még:

    - selection 
      + second cursor
      - block 
    - PIXI.Text átkapcsolása editor módba
    - scroll by cursor position
    - látszódó sorok :: maxLines
    - home / end 
    - upp / down 


  Array ES6 more 

  http://www.2ality.com/2014/05/es6-array-methods.html	

  for( e of Array.from(a).entries() ) log = e 

  Math.max(...[22,45,77,98])	

  goal = 7;[5,8,15,22].reduce( (prev, curr) => Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev)

*/

  class Editor {

    // constructor( text, wide , style , isPSWD , maxLines ){

    constructor(text, style, inputbox) {

      text = (!text && inputbox) ? inputbox.text : text || ''

      this.isLocalStorage = text.match(/^ls>>(.*)<<$/)
      if (this.isLocalStorage) { text = localStorage.getItem(this.isLocalStorage[1]) || this.isLocalStorage[1] }

      this.style = style || STYLE_F28_LIBRARY //|| style 	
      this.isSecret = this.style.isSecret || false
      this.maxLines = this.isSecret ? 1 : this.style.maxLines ? this.style.maxLines : 5
      this.scroll = 0
      this.origin = text
      this.wide = this.style.width || 400 // wide

      this.inputbox = inputbox || new PIXI.Text('', this.style)

      this.cursor = new PIXI.Graphics(); this.cursor.beginFill(0xAAAAAA).drawRect(0, 6, 3, 32).endFill()
      this.cutend = new PIXI.Graphics(); this.cutend.beginFill(0xFF0000).drawRect(0, 6, 3, 32).endFill()
      this.inputbox.addChild(this.cursor)
      this.inputbox.addChild(this.cutend)
      this.cursor.visible = false
      this.cutend.visible = false


      this.background = (this.style.fancy) ? fancyButton() : (this.style && this.style.bg && this.style.bg instanceof PIXI.Graphics) ? this.style.bg : false

      if (this.background) {
        stage.addChild(this.background)
        this.inputbox.position.set(this.style.fancy ? 8 : 4, 4)
        this.background.addChild(this.inputbox)
      } else {
        stage.addChild(this.inputbox)
        this.inputbox.position.set(10, 10)
      }

      this.area = this.hiddenDOM()

      this.focus = false

      this.inputbox.interactive = true
      this.inputbox.buttonMode = true
      this.inputbox.on('mousedown', this.startEdit.bind(this))

      this.setValue(this.origin)

      // spec char def 

    }

    hiddenDOM() {

      let area = document.createElement('textarea')
      area.className = '_inputbox_'
      area.style.position = 'absolute'
      area.style.top = '-100px'//bounds.y-100+'px'
      area.style.left = '0'  // bounds.x+'px'
      area.style.width = '2000px'
      area.style.overflow = 'hidden'
      area.setAttribute('spellcheck', 'false')
      document.body.appendChild(area)
      return area

    }

    positionSet(x, y) { if (this.background) { this.background.position.set(x, y) } else { this.inputbox.position.set(x, y) } }

    startEdit() {

      this.cursor.visible = true
      this.area.value = this.isSecret ? '' : this.area.value
      this.area.focus()
      this.area.onkeydown = this.area.onkeyup = this.textEditing.bind(this) // KIHAL így a shift-es kijelölés is működik , még az UNDO is működik
      this.focus = true

    }

    lineWidth(n) {

      let lines = this.inputbox.text.split(/\n/)
      return lines.length > n ? this.textWidth(lines[n]) : 0

    }

    get wordWarp() { return this.maxLines > 1 ? this.inputbox.wordWrap(this.area.value).split(CR) : [this.inputbox.wordWrap(this.area.value.replace(/\n/g, ''))] }

    get calcLength() { let ww = this.wordWarp; return ww.length - 1 + ww.map(a => a.length).reduce((a, b) => a + b) }

    get select() { return this.area.value.slice(this.area.selectionStart, this.area.selectionEnd) }

    setCur(sel, end) {

      let last = 0
      let vindex = this.wordWarp.map((l, i) => {
        let r
        if (l.length) {
          r = { i, ix: this.area.value.indexOf(l, last), l }
          last += l.length
        } else {
          r = { i, ix: -1, l }
        }
        return r
      })
      // if(vindex[vindex.length-1].ix<0){ vindex[vindex.length-1].ix = this.area.value.length-1 } // // handle end of -1	
      for (var v = vindex.length - 2; v > 0; v--) { if (vindex[v].ix < 0) { vindex[v].ix = vindex[v + 1].ix - 1 } }

      this.vii = vindex
      let found = vindex.find(l => l.ix <= sel && sel <= l.ix + l.l.length)

      //let line = found ? found.l.slice(0,sel-found.ix) : vindex[vindex.length-1].l
      let line = found ? found.l.slice(0, sel - found.ix) : vindex.last.l

      let x = this.textWidth(this.isSecret ? "*".repeat(sel) : line)
      let y = (found ? found.i : vindex.length - 1) * this.inputbox.style.lineHeight  // még mindíg nem tökkéletes a záró sortörések kezelése 
      if (end) { this.cutend.position.set(x, y) } else { this.cursor.position.set(x, y) }

    }

    textWidth(text) { return this.inputbox.context.measureText(text).width }

    /*
cursorWarp( selpos ){ // ezzel hihetetlen mennyiségű probléma van a \s-ek miatt. 

  if(!selpos)return [''];

  let ww = this.wordWarp
  let sum = 0
  let res = []
  while( ww.length ){
    var top = ww.shift()
    sum+=top.length
    if( sum>selpos ){ 
      top = top.slice(0,top.length-sum+selpos)
      res.push( top )			
      break
    }
    res.push(top)
  }
  return res	
}
*/

    textEditing() {

      var lines = this.singleLine(this.area.value)//.split(/\s/g)
      if (this.isLocalStorage) { localStorage.setItem(this.isLocalStorage[1], lines) }

      if (this.isSecret) {

        this.inputbox.text = "*".repeat(lines.length)
        this.inputbox.pswd = lines
        this.setCur(this.area.selectionStart)

      } else {

        this.inputbox.text = lines

        let end = this.area.selectionStart != this.area.selectionEnd
        this.cutend.visible = end
        this.setCur(this.area.selectionStart)
        if (end) { this.setCur(this.area.selectionEnd, true) }
        renderer.render(stage)

      }

    }

    getValue() { return this.area.value }

    get value() { return this.getValue() }

    setValue(value) {

      this.area.value = this.singleLine(value);
      this.textEditing()

    }

    singleLine(v) { return this.maxLines > 1 ? v : v.replace(/\n/g, '') }

    set value(v) { this.setValue(v) }

    // KIHAL megvan az ES6 global class static const 
    // http://tomasalabes.me/blog/_site/web-development/2015/09/16/ES6-Classes-For-Java-Developers.html
    // static get valami(){ return 'valami' }

  } // class NewEditor

  window.Editor = Editor

  // így egyszerűnn PIXI -ben kezelni az egeret meg a touch position-t
  window.dragByPIXI = function(dragThis) {

    window.follow = dragThis



    skeleton.interaction.push(dragging)

    function dragging() {

      //let mouse = renderer.plugins.interaction.mouse.global	// de úgy látom touch-ra nem működik 
      let mouse = renderer.plugins.interaction.eventData.data.global	// ez elméletileg mindkettőre  KIHAL !

      window.follow.position.set(mouse.x, mouse.y)


    }

  }

  this.missionSelect = function() {

    //afs_collection.filter(SCENE).map( s=>s.width=2)	

    //let swiper = new MissionSwiper( false , false , afs_collection.filter(SCENE).map(function(c){return c.serial}).slice(0,10) , { w:1280, h:350 , y: 370 } , true )
    //let swiper = new MissionSwiper( false , false , afs_collection.filter(SCENE).map( c => c.serial ) , { w:1280, h:350 , y: 170 } , true )
    let swiper = new MissionSwiper(false, false, 'QF04|KUCA|S0NI|TQIS|FQMI|O43L|T140'.split(I), { w: 1280, h: 350, y: 170 })

    skeleton.interaction = [swiper] // y:150			 

    // afs_collection.filter(SCENE).map( s=>s.width=1)	

  }

  this.missionPlay = function() {

    // DB.scenes.find(s=>s.name.match(/Engag/))

    let sq = skeleton.main.questLinePanel.questLine; window.sq = sq

    let gmid = KKK[skeleton.interaction[0].selected].gmid

    let quest = new PIXI.Sprite.fromImage(`img/scenes/ls${gmid}.jpg`) // 03
    // let quest = new PIXI.Sprite.fromImage('img/scenes/ls06.jpg') // 03
    let speaker = new PIXI.Sprite.fromImage('img/actors/037.png') // 045
    let title = sq.title.name.pixi
    let out = sq.descript.pixi

    let ch = chaptersOfStory()

    sq.questImage.pixi.addChild(quest)
    sq.speaker.pixi.addChild(speaker)

    this.actMission = { descript: ch[0].missions[0].descript, out, line: 0 }

    // out.text = ch[0].missions[0].descript
    title.text = ch[0].missions[0].name
    this.taskInfo()

  }

  this.taskInfo = function() {

    let sq = skeleton.main.questLinePanel.questLine;

    let mission = this.actMission

    if (!mission) { return }

    let lines = skeleton.main.questLinePanel.questLine.descript.pixi.wordWrap(mission.descript).split(CR).splice(mission.line, 5).join(CR)

    let isIMG = lines.match(/\{\.\.img\:(....)?\}/)

    if (isIMG) {

      lines = lines.replace(/\{\.\.img\:(....)?\}/, '')

      log = isIMG

      if (KKK[isIMG[1]]) {

        sq.questImage.pixi.removeChildren()
        sq.questImage.pixi.addChild(new PIXI.Sprite.fromImage(`img/scenes/ls${KKK[isIMG[1]].gmid}.jpg`))

      }

    }

    if (lines) {

      mission.out.text = lines.temp({ name: 'Richard Smörgsen' })
      this.actMission.line = mission.line + 5

    } else { // this.actMission.over()

      mission.out.text = ''
      sq.speaker.pixi.fly = { step: 40, to: { y: 2000 } }
      sq.next.pixi.fly = { step: 40, wait: 20, to: { x: 4000 } }
      sq.descBckg.pixi.fly = { step: 40, wait: 40, to: { x: 4000 }, intOn: { animEndCall: startGame } }
    }

    function startGame() {
      log = 'animEndCall -- nextinfo '

      GZ.es6pve()
      window.es6stepp(1)
      /*
    uppdate('main')
    flyOver()
    GZ.playerVsAI() 
      */
      //uppdate('game.setup')

    }


  }


  // ----------------------------------------------------[ SwiperAgain III ]---------------------------------------------

  // a II-es csak elodázta a problémát. 

  class DeckOfCards extends Array {
    constructor(anything) {
      super()
    }

    get extra() { return this.last + ' az uccso' }
  }

  class Swiper {

    constructor(sensor, base) {

      const SENSOR_ALPHA = .1

      this.base = stage || base
      // ezt kiscit szebben 
      this.sensor = sensor || this.full(SENSOR_ALPHA)
      if (!this.sensor.parent) this.base.addChild(this.sensor);

      this.sensorOn()
    }

    sensorOn() {

      this.sensor.interactive = true
      this.sensor.buttonMode = false

      this.sensor.on('mousedown', this.moveStart.bind(this)).on('touchstart', this.moveStart.bind(this))
      this.sensor.on('mouseup', this.moveStop.bind(this)).on('mouseupoutside', this.moveStop.bind(this)).on('touchend', this.moveStop.bind(this)).on('touchendoutside', this.moveStop.bind(this))
      this.sensor.on('mousemove', this.moving.bind(this)).on('touchmove', this.moving.bind(this))

      this.isDown = false

    }

    sensorOff() { this.sensor.interactive = false; /* this.base.removeChild( this.sensor ) */ }

    moveStart() {
      log = 'moveStart'
      this.isDown = true
    }

    moveStop() {
      log = 'moveStop'
      this.isDown = false
    }

    moving() {

      //log = this.isDown ? 'dragging' : 'overing' 
      if (this.isDown) log = 'dragging'
    }

    full(alpha) { return new PIXI.Graphics().beginFill(0, alpha).drawRect(0, 0, 1280, 720).endFill() }

  }

  class Arrow extends Swiper {

    constructor(sensor, base) {
      super(sensor, base)

      this.arrow = new PIXI.Container()
      this.base.addChild(this.arrow)
      this.arrow.visible = 0
      this.arrowColor = 0xFF0000
    }

    moveStart(e) {

      this.arrow.removeChildren()
      this.isDown = this.arrow.visible = 1
      this.final = this.origo = e.data.global.clone()


    }

    moveStop(e) {
      this.isDown = this.arrow.visible = 0
    }

    moving(e) {
      if (!this.isDown) return;
      this.final = e.data.global.clone()
      this.arrow.removeChildren()
      this.arrow.addChild(new PIXI.Graphics().lineStyle(1, this.arrowColor, 1).moveTo(this.origo.x, this.origo.y).lineTo(this.final.x, this.final.y).endFill())
      renderer.render(stage)
    }

    get distance() { return Math.sqrt((this.origo.x - this.final.x) * (this.origo.x - this.final.x) + (this.origo.y - this.final.y) * (this.origo.y - this.final.y)) }

    get tilt() { return (this.origo.x - this.final.x) / (this.origo.y - this.final.y) }

  }

  class RandomCardSwiper extends Arrow {

    constructor(sensor, base) {

      super(sensor, base)
      this.content = new PIXI.Container()
      this.base.addChild(this.content)

    }

    swiping() {

      if (this.isDown) {
        this.content.x += (this.origo.x - this.final.x) / 25
        this.content.y += (this.origo.y - this.final.y) / 25
        requestAnimationFrame(this.swiping.bind(this))
      }

    }

    moveStart(e) {
      super.moveStart(e)
      requestAnimationFrame(this.swiping.bind(this))
    }

    moveStop(e) {
      super.moveStop(e)

      if (this.distance < 5) {
        let card = skeletonCardRender(KKK[afs_collection.cards.random().serial])
        card.anchor.set(.5)
        card.position.set(this.final.x - this.content.x, this.final.y - this.content.y)
        this.content.addChild(card)
        this.base.addChild(this.arrow)
      }
    }

  }

  class TwoDeck extends Arrow {

    constructor(sensor, base) {

      // a base-nek a skeleton-HOLDER-ből kell jönnie

      super(sensor, base)
      this.content = new PIXI.Container()
      this.base.addChild(this.content)

      this.swipers = []
      this.isDrag = false

      this.mline = skeleton.main.friendsBtn.swiper2test.midleLine.pixi

      this.mline.area.addEventListener('keydown', e => e.keyCode == 13 ? e.preventDefault() + this.searchFilter(this.mline.value) : 0)

    }

    searchFilter(search) {

      const NAME_SEARCH = e => e.name.match(new RegExp(search, 'g'))
      const DESCRIPT_SEARCH = e => e.descript.match(new RegExp(search, 'g'))
      const PROF_SEARCH = e => e.profLog.match(new RegExp(search, 'g'))
      const TYPE_IS_ACTOR = e => e.isActor
      const TYPE_IS_ITEM = e => e.isItem
      const TYPE_IS_SCENE = e => e.isScene
      const SIZE_W1 = e => e.width < 2
      const SIZE_W2 = e => e.width == 2
      const SIZE_W3 = e => e.width == 3
      const SIZE_BIG = e => e.width > 1

      // log = search

      // swiper2test

      let result = afs_collection.filter(NAME_SEARCH).map(c => c.serial)

      this.swipers[0].source = result

      this.reShow(this.swipers[0])

    }

    swiping() { // horisontal swipe with dragging start 

      if (!this.isDrag && this.tilt && this.distance > 30 && Math.abs(this.tilt) < .5) { // start drag 

        let card = this.whichOne(this.origo)

        if (card) return this.dragStart(card); // 

      }

      if (this.isDown && this.swipers.length) { // swipe 

        //this.swipers[( this.origo.y < 720 / 2 ) ? 0 : 1].holder.x -= (this.origo.x - this.final.x)  / 25
        this.whichDeck().holder.x -= (this.origo.x - this.final.x) / 25
        requestAnimationFrame(this.swiping.bind(this))

      }

    }

    dragStart(card) {

      // log = 'start drag: ' + KKK[card.serial.slice(0,4)].name 	

      this.isDrag = true

      this.base.addChild(card)
      this.base.addChild(this.arrow)

      let holder = this.whichDeck().holder
      card.begin = { x: card.x, y: card.y, holder } // save pos before mod. 

      card.x += holder.x //- this.final.x + this.origo.x 
      card.y += holder.y //- this.final.y + this.origo.y

      //card.diff = { x: card.x + this.final.x - this.origo.x , y: card.x + this.final.y - this.origo.x }
      card.diff = { x: this.final.x - card.x, y: this.final.y - card.y }


      this.drag = card

      requestAnimationFrame(this.dragging.bind(this))

    }

    dragging() {

      if (!this.isDrag) return;

      this.drag.x = this.final.x - this.drag.diff.x
      this.drag.y = this.final.y - this.drag.diff.y

      let target = this.whichOne(this.final)
      if (target && this.whichDeck() != this.whichDeck(this.final)) {
        let selectFilter = [BRIGHTNESS(.1)]
        if (this.prevOver) this.prevOver.filters = null;
        target.filters = selectFilter
        // target.tint = target.select ? 0x776644 : 0xFFFFFF
        this.prevOver = target
      } else { if (this.prevOver) this.prevOver.filters = null }

      requestAnimationFrame(this.dragging.bind(this))

    }

    // this.search.area.addEventListener('keydown', e=> e.keyCode==13 ? e.preventDefault()+this.searchFilter( this.search.value )  : 0 )

    dragEnd() {

      this.isDrag = false
      let card = this.drag
      this.drag = null
      if (this.prevOver) this.prevOver.filters = null;

      if (!card) return

      let target = this.whichOne(this.final)

      if (target && this.whichDeck() != this.whichDeck(this.final)) { // nem engedi a saját paklit targetelni 

        // work with select 

        let tcard = KKK[target.serial.slice(0, 4)]
        let dcard = KKK[card.serial.slice(0, 4)]
        let name = tcard.name
        let eline = skeleton.main.friendsBtn.swiper2test.midleLine.pixi

        //eline.value = ( card.type == tcard.type && card.width == tcard.width ) ? ' same type ' : ' different '
        let same = (dcard.type == tcard.type && dcard.width == tcard.width)
        // eline.value = `${dcard.type}:${dcard.width}  ${dcard.name} ${same?' == ':' -- '} ${tcard.type}:${tcard.width}  ${tcard.name}`

        // change image 

        if (same) {

          log = ` change image >> ${dcard.name} <--> ${tcard.name}`
          let gmid = tcard.gmid; tcard.gmid = dcard.gmid; dcard.gmid = gmid
          // [ dcard.gmid , tcard.gmid ] = [ tcard.gmid , dcard.gmid ]
          card.addChild(skeletonCardRender(dcard))
          target.addChild(skeletonCardRender(tcard))

        }

        // skeleton.main.friendsBtn.swiper2test.midleLine.pixi.value = name 	

        // http://igc-team.com/hu/kapcsolat/

      }

      if (card.begin && card.begin.holder) {
        card.position.set(card.begin.x, card.begin.y)
        card.begin.holder.addChild(card)
      }


    }


    whichOne(target) {

      let deck = this.whichDeck(target)
      let rel = target.x - deck.holder.x

      return deck.holder.children.find(s => rel >= s.x && rel <= s.x + s.width)

    }

    whichDeck(start) { start = start || this.origo; return this.swipers[(start.y < 720 / 2) ? 0 : 1] }

    moveStart(e) {

      super.moveStart(e)
      requestAnimationFrame(this.swiping.bind(this))


    }

    joinDecks(top, low) { // FIX - kicsit logikátlan, hogy egyszerre kérem be az adatokat és a megjelenítőt is 

      this.swipers = [{ source: top.deck, holder: top.holder }, { source: low.deck, holder: low.holder }]

      this.show(this.swipers[0], 5)
      this.show(this.swipers[1], 720 - 325)
    }

    show(deck, y) {

      deck.holder.position.y = y

      let vpos = 0
      deck.source.cards.forEach(c => { let r = skeletonCardRender(c); r.position.x += vpos; vpos += 250 * c.width + 5; deck.holder.addChild(r) })

    }

    reShow(deck) {

      deck.holder.removeChildren()
      deck.source.cards.forEach(c => { let r = skeletonCardRender(c); r.position.x += vpos; vpos += 250 * c.width + 5; deck.holder.addChild(r) })

    }


    moveStop(e) {
      super.moveStop(e)

      if (this.isDrag) this.dragEnd()

      if (this.distance < 5) { }
    }

  } // end TwoDeck


  // -----------------------------------------------------------------------[ LibraryPage ]----------------------------------------------------


  class LibraryPage extends Arrow {

    constructor(sk) {

      super()

      this.sk = sk
      this.holder = sk.side.pixi
      this.page = sk.page.pixi
      this.name = sk.page.name.pixi
      this.actor = sk.actor.pixi
      this.info = sk.page.info.pixi

      this.buffer = [] //new Map()
      this.allData = []

      this.search = sk.search.pixi

      this.search.area.addEventListener('keydown', e => e.keyCode == 13 ? e.preventDefault() + this.searchFilter(this.search.value) : 0)

      window.li = this

      this.sk.page.editDescript.pixi.visible = false

    }

    joinData(data) {

      let hpos = 0

      data.forEach(c => { this.buffer.push({ c, y: hpos }); hpos += 320 + 5 })
      // https://davidwalsh.name/javascript-clone-array
      this.allData = this.buffer.slice(0)

      this.aroundRender(1240)

      this.overLoader = setInterval(this.preloader.bind(this), 150)

    }

    aroundRender(fare) {

      let hy = this.holder.y
      let top = 0 - fare
      let bottom = 720 + fare + 320

      for (let b of this.buffer) { if (b.y + hy >= top && b.y + hy < bottom && !b.isRender) this.preRender(b); }

    }

    preRender(b) {

      b.isRender = skeletonCardRender(b.c, FORCE_ONE_WIDE)
      b.isRender.y = b.y
      this.holder.addChild(b.isRender)

    }

    preloader() {

      if (this.sk.keydot != here) return clearTimeout(this.overLoader);

      if (!this.isDown) {
        let b = this.buffer.random()
        if (b && !b.isRender) this.preRender(b);
      }

    }

    moveStart(e) {

      super.moveStart(e)
      requestAnimationFrame(this.swiping.bind(this))

    }

    swiping() { // vertical swipe 

      if (this.isDown) { // swipe 

        if (this.origo.x < 1280 - 255) { // swipe content 

          //this.page.y -= (this.origo.y - this.final.y)  / 25
          let speed = (this.origo.y - this.final.y) / 25
          let height = this.page.height + 30
          // speed = this.page.y - speed + height < 720 ? this.page.y+height-720 : speed 
          this.page.y -= speed

        } else { // swipe cardlist 

          this.holder.y -= (this.origo.y - this.final.y) / 15
          this.aroundRender(400)

          this.slowOverShowElement()

        }

        requestAnimationFrame(this.swiping.bind(this))

      }

    }

    moveStop(e) {
      super.moveStop(e)

      if (this.distance < 5 && this.origo.x > 1280 - 255) { // click 

        this.page.y = 0
        // this.name.y = this.sk.page.name.pos.y

        let target = this.whichOne(this.final)
        //if( target ) this.name.text = KKK[target.serial.slice(0,4)].name ; 
        if (target && target.serial) this.renderInfoPage(KKK[target.serial.slice(0, 4)]);

      }
    }

    whichOne(target) {

      let rel = target.y - this.holder.y

      return this.holder.children.find(s => rel >= s.y && rel <= s.y + s.height)

    }

    slowOverShowElement() {

      if (this.distance && this.distance < 150) {
        let target = this.whichOne(this.final)
        if (target && target.serial) this.renderInfoPage(KKK[target.serial.slice(0, 4)]);
      }

    }

    searchFilter(search) {

      const NAME_SEARCH = e => e.c.name.match(new RegExp(search, 'g'))
      const DESCRIPT_SEARCH = e => e.c.descript.match(new RegExp(search, 'g'))
      const PROF_SEARCH = e => e.c.profLog.match(new RegExp(search, 'g'))
      const TYPE_IS_ACTOR = e => e.c.isActor
      const TYPE_IS_ITEM = e => e.c.isItem
      const TYPE_IS_SCENE = e => e.c.isScene

      let searchMode = NAME_SEARCH

      if (search.slice(0, 1) == ':') {
        searchMode = PROF_SEARCH; search = search.slice(1)
        if (search.toLowerCase() == 'actor') { searchMode = TYPE_IS_ACTOR }
        if (search.toLowerCase() == 'item') { searchMode = TYPE_IS_ITEM }
        if (search.toLowerCase() == 'scene') { searchMode = TYPE_IS_SCENE }
      }

      // s.valami vagy scene.valami kereshetne a jelenetek között mindenben 
      // scene.search w1.search w2.  a.w1.valami   actor.w1.valami 
      // - sőt ::  a.w1.serach ,,, w2. ,, n.valami , name.w1.  n.a.w2:pilot

      if (search.slice(0, 1) == '.') { searchMode = DESCRIPT_SEARCH; search = search.slice(1) }

      // log = search
      this.holder.removeChildren()
      this.buffer = this.allData.filter(searchMode)
      this.buffer.forEach((e, i) => { e.y = i * 325; /*log = e.c.name*/ if (e.isRender) { this.holder.addChild(e.isRender); e.isRender.y = e.y } })
      this.holder.y = 0
      this.aroundRender(1240)

    }

    /*

  KIHAL már meg is van a professionok és a descriptek közötti keresés is, 
    már csak a találatok aszámát kellene kijelezni, plusz a swiperek határát limitálni.

    utána jöhetne ugyanez horizontálisan, bár az még várhat.

    Fontos ötlet viszont, hogy ne csináljunk-e olyan dolgokból lapot, mint a Sun tech.,
    Alpha corp. vagy éppen 1-1 profession, mint pld: Agent. Ezek az itemekhez hasonlóan 
    kiegészítő lapok lehetnének. De az Alpha corp. lap pld. csak alpha-s emberkéhez lehetne 
    csatolni, viszont egy ügynök lapot meg bárkihez és 1-2 vagy 3. szintű ügynök képességet adna pluszban.

    Csak mi legyen ennek a laptípusnak a neve ?  extra vagy info vagy knowledge !! esetleg kontakt ??

    Nem kellene megfeledkezni Igor ötletéről se, és ez itt pont jó helyen lenne.

    Másrészt alkalmat adna arra, hogy a libraryban ezekről az "elvont" dolgokról is szó essen.

    Ugyanakkor felveti azt a jogos problémát, hogy vajon a játékos dobhat-e el lapokat a húzás fázis előtt ??

    .. vagy csak valami meghatározott indokkal ?

    Ha csatolva van egy lap valakihez, akkor a közös nevüket kellene kiírni, pld: Mr Osborn + alpha laptop ...
    vagy ha túl hosszú akkor ennek egy rövidített formáját.

    A w2/w3 lapoknál szerencsére ilyen probléma nincs. 


    ++ 

      Jól ki kell találni, hogy az egyes laptípusokat hogyan is jelenítsük meg a könyvtárban.
      + szereplők
          + oldalt áll a szereplő és csak az infó scrollozódik. 
      + tárgyak
          + mint a szereplőknél, viszont a tárgykép pozíciója nem alul, hanem inkább középen lesz 
      + w2 / w3 szereplők
          + talán úgy mint a jeleneteknél, és mindkettőnél a szürke háttért ki kell tolni balra ( lehet a háttérkép szélesebb lesz  )
      + jelenetek
          + fent a nagy kép .. sajnos lehet, hogy enneki is az infóval együtt kell scrollozódnia. 

        - a felirat alatt legyen háttér és max a toppig scrollozódjon utána oda cuppanjon !
      - kell egy scroll jelző is, hogy mennyi van az infóból
      - kell talán egy másik a kártya sethez is. 


    // rémálom megoldások .. még jól jöhet a játék hangulatának a fokozására. 
     // http://index.hu/kultur/cinematrix/2016/01/19/a_nagy_david_lynch_remalom-hatarozo/


    KIHAL megvan a sorok megszámolása :  https://forum.sublimetext.com/t/count-lines-in-a-project/6554

    ^(.*)$
    /c/cor/roofconfigurator/src/ts,*.ts
    8826

    - 3d image from card test
    - helyzetelemző oldal a game play alatt, ahol, szépen látszódik a jelenet, kinek mi van a kezében ( élesben csak a sajátod ), milyen skillek aktívak, ki az umpire, ki a boss, hand, rest, deck, scene deck size, és eleve úgy felépíteni, hogy x játékosra lehessen alkalmazni.
    - Editor jegyezze meg az utolsó kurzor pozícióját .. ehhez a skeletonnak kellene rendelkezni némi memóriával azaz elkülöníteni a teljes újrarajzolást és az elővevést a memóriából.
    - iconos megjelenítés minden kártyáról
    - iconoknak mindig a GPU memóriába kellene maradni
    - global buffer megoldás
    + 53 new actor image .. mostmár bőven van elég a szereplők teszteléséhez. 
    - a.w1.serach ,,, w2. ,, n.valami , name.w1.  n.a.w2:pilot
    + :actor , :scene , :item keresés // filter
    + a lapok jol jelennek meg a libraryban
    - mátrixos card viewer in library 
    - képcsere localhost mentéssel 
    - ki kellene jelezni a találatok számát 		


  */

    renderInfoPage(card) {

      this.info.removeChildren()
      this.actor.removeChildren()

      if (!card) return;

      this.name.text = card.name

      if (card.isScene) {

        let scene = PIXI.Sprite.fromImage('img/scenes/ls{..1}.jpg'.insert(card.gmid))

        scene.scale.set(.6)
        scene.position.set(200, 100)

        this.info.addChild(scene)

        card.prof.forEach((pf, i) => {
          var icon = new PIXI.Sprite(window.PROT[1][pf.name])
          var name = new PIXI.Text(pf.name, { font: FontFace(36), fill: 'white' })
          // icon.width = icon.height = 40
          icon.position.set(430 + (320 * (i % 2)), 520 + 20 + ~~(i / 2) * 80)
          name.position.set(510 + (320 * (i % 2)), 540 + 20 + ~~(i / 2) * 80)
          this.info.addChild(icon)
          this.info.addChild(name)
        })

        this.sk.page.editDescript.pixi.y = this.info.height + 140


        return
      }


      if (card.isActor || card.isItem) {

        let actor = card.isActor ? PIXI.Sprite.fromImage('img/actors/' + card.gmid + '.png') : PIXI.Sprite.fromImage('img/items/itm' + card.gmid + '.png')

        let w23extra = 0

        if (card.width > 1) {

          actor.anchor.set(1, 0)
          actor.position.set(card.width > 2 ? 1000 : 1200, 110)
          this.info.addChild(actor)
          w23extra = 340

        } else {

          actor.anchor.set(0, card.isActor ? 1 : .5)
          actor.position.set(30, card.isActor ? 710 : 720 / 2)
          this.actor.addChild(actor)
        }


        card.prof.forEach((pf, i) => {
          var icon = new PIXI.Sprite(window.PROT[1][pf.name])
          var name = new PIXI.Text(pf.name, { font: FontFace(36), fill: 'white' })
          // icon.width = icon.height = 40
          icon.position.set(430, 110 + i * 80 + w23extra)
          name.position.set(510, 130 + i * 80 + w23extra)
          this.info.addChild(icon)
          this.info.addChild(name)
        })


        var skill = new PIXI.Text(card.whatIsDo + CR + '-'.repeat(40) + CR + card.descript, STYLE_F36_LIBRARY)

        skill.position.set(510, 140 + card.prof.length * 80 + w23extra)
        this.info.addChild(skill)

        this.sk.page.editDescript.pixi.y = this.info.height + 140

        return
      }


    }

  } // end LibraryPage


  /*


  Eddig elég szép, most esik a maci a levesbe, mert a puding próbája az ha felzabálják, 
  szóval a kártyák képcseréje lenne a terv adatbázis háttérrel. 

  Valahol az az érzésem, hogy a szűrhető / kereshető / adatbázisal kommunikáló laplistának a 
  decknél kell egy jobban alkalmazható alapobjektumának lennie, ami lehet akár az új deck is,
  de annál összetettebb feladatokat is el kell tudnia látni, minél egyszerűbben.

  vagy csak én bonyolítom már megint az életem ?

  lehet, hogy a serial lehetne a kulcs 

  vagy inkább Array-ban legyen az adat?


  Bemutató elötti tennivalók

    + loader
    + GravitonZoneCCG main screen 
    + fancy button 
    + ThreeSwiper 
    + matrixArea ! KIHAL 
      - full screen
      - fog 
    + teljes avatár sett.	
      - bufferelve 

  Utómunkálatok

    - Lambert új adatainak a beépítése
    - check offline work 
    - upload program to server 
    - bevezető "anim" leírás
    - screenek rendezése


    - edit isSecret problem 
    - PVP 3 ellenfél közül választani
    - PVP lista		
    - boss választás
    - valami képesség használat
    - library name cuppanás a tetejére
    - library esetleg szűrő gombok
    - prezi szerű bemutatás
    - bevezető történet animáció ... valahogy
    - átnézni, hogy minden részlet működjön a bemutatón
    - global card image booster ( utánanézni, hogyan lehet PIXI.sprite -ot duplikálni )
    - helyzetelemző oldal a game play alatt, ahol, szépen látszódik a jelenet, kinek mi van a kezében ( élesben csak a sajátod ), 
      milyen skillek aktívak, ki az umpire, ki a boss, hand, rest, deck, scene deck size, és eleve úgy felépíteni, hogy x játékosra lehessen alkalmazni.

    - 3D image in play 

      + blender 1 setup 

      - interactive 3d game play with only camrea and card moving 2-6 players .. first set :: 4 player 
      - test import model 

    - class :: Skillplay 




*/

  this.swiper2test = function() {

    let sk = skeleton.main.friendsBtn.swiper2test

    var iact = new TwoDeck()
    sk.sensor.pixi.addChild(iact.sensor)

    //let deck1 = pva.all.yers[0].deck
    //let deck2 = pva.all.yers[1].deck

    let deck1 = new Deck()
    let deck2 = new Deck()

    deck1.randomFill(20)
    deck2.randomFill(20)

    iact.joinDecks(
      { deck: deck1, holder: sk.topdeck.pixi },
      { deck: deck2, holder: sk.lowdeck.pixi }
    )

    window.sk = sk
    window.ia = iact

  }


  this.library2test = function() {

    let sk = skeleton.main.libraryPanel.library2

    let iact = new LibraryPage(sk)
    sk.sensor.pixi.addChild(iact.sensor)

    //iact.joinData( afs_collection.cards.map( c => c ).sort( SHUFFLE ) )
    iact.joinData(afs_collection.cards.map(c => c))

    window.sk = sk
    window.ia = iact

  }


  /*

2 arrow test:

a = new PIXI.Graphics().beginFill( 0 , .1 ).drawRect( 0 , 0 , 640 , 720 ).endFill()
b = new PIXI.Graphics().beginFill( 0 , .1 ).drawRect( 640 , 0 , 640 , 720 ).endFill()
aa = new Swiper(a)
bb = new Swiper(bb)
bb.arrowColor = 0x0000ff

dotd guilds

Overlords

777




*/


  // ----------------------------------------------------[ SwiperAgain II ]---------------------------------------------

  function SwiperBase(isAVATAR, isVertical, cardSetOfSerial, box) {

    box = box || {}

    this.eList = new PIXI.Container()
    this.sensor = new PIXI.Graphics()
    this.box = box

    var colorOfSensorDebug = 0 // 0.3

    this.sensor.beginFill(0, colorOfSensorDebug).drawRect(0, 0, box.w || 1280, box.h || 720).endFill()
    this.sensor.position.set(box.x || 0, box.y || 0)

    stage.addChild(this.sensor)

    isVertical = isVertical || false

    this.eList.isVertical = isVertical

    stage.addChild(this.eList)

    // fill this.sensor 

    var avaibleAvatars = cardSetOfSerial || (afs_collection.filter(ACTOR).map(function(a) { return isAVATAR ? a.gmid : a.serial })).sort(function(a, b) { return Math.random() - .5 }).slice(-11)

    var eList = this.eList

    let apx = 5
    avaibleAvatars.forEach(function(gmid, i) {
      // KIHAL majdnem jó és a kártyaszövegek is a helyükön vannak. 		 	
      var avatarShape = isAVATAR ? avatarInContainer(gmid) : skeletonCardRender(new Card(gmid)) // TODO itt nagy pazarlásokat követek el 
      //var avatarShape = isAVATAR ?  avatarInContainer( gmid ) : skeletonCardRender( KKK[gmid.slice(0,4)] ) 
      if (isVertical) {
        avatarShape.y = isAVATAR ? this.eList.height + 10 : i * 325
        avatarShape.x = 1280 - 255
      } else {

        avatarShape.x = apx
        apx += isAVATAR ? 350 : KKK[gmid.slice(0, 4)].width * 250 + 5
      }
      avatarShape.name = gmid
      // if(isAVATAR){ avatarShape.anchor.y = 1 }
      eList.addChild(avatarShape)
    })

    function avatarInContainer(gmid) {

      var img = PIXI.Sprite.fromImage('img/actors/' + gmid + '.png')
      img.anchor.y = 1
      var con = new PIXI.Container()
      con.addChild(img)
      con.gmid = gmid
      return con

    }

    this.sensor.name = this.sensor.name || UID() + isVertical
    this.sensor.eList = this.eList
    this.sensor.base = this

    // console.log(this.sensor.name + " .. is setup " + this.sensor.y )

    if (isVertical) { this.eList.y = 0 } else { this.eList.y = isAVATAR ? 720 : this.sensor.y + 30 }


    // add interaction to this.sensor 

    this.sensor.interactive = true;
    this.sensor.buttonMode = false;

    this.sensor.on('mousedown', moveStart).on('touchstart', moveStart)
    function moveStart(e) {

      var sensor = this // becouse filter this 
      // console.log( sensor.name + " down "  )
      sensor.dragLocal = e.data.getLocalPosition(sensor)
      sensor.pos = sensor.dragLocal
      sensor.ee = e.data
      sensor.mousePrev = e.data.global
      //var clickSomes = sensor.eList.children.filter(function(s,i){ return isUnderCursor(s,sensor.mousePrev ) })
      // console.log( clickSomes.map(function(t){return t.serial}) )
      //var clickSomes = sensor.eList.children.filter( s => sensor.mousePrev.x >= s.position.x+sensor.eList.x && sensor.mousePrev.x< s.position.x + s.width+sensor.eList.x )
      var clickSomes = isVertical ? sensor.eList.children.filter(s => sensor.mousePrev.y >= s.position.y + sensor.eList.y && sensor.mousePrev.y < s.position.y + s.height + sensor.eList.y)
        : sensor.eList.children.filter(s => sensor.mousePrev.x >= s.position.x + sensor.eList.x && sensor.mousePrev.x < s.position.x + s.width + sensor.eList.x)
      //console.log(sensor.mousePrev,clickSomes,basicf)
      //window.swlist = sensor.eList.children
      sensor.downOn = clickSomes.length ? clickSomes[0] : false // megvan clickSomes megoldása - a probléma a maszkolt és nem levágott figurák miatt van. 
      sensor.traveling = 0

    }

    this.sensor.on('mouseup', moveStop).on('mouseupoutside', moveStop).on('touchend', moveStop).on('touchendoutside', moveStop)
    function moveStop(e) {

      var sensor = this // becouse filter this 
      // console.log( sensor.name + " up " , sensor.traveling )
      sensor.ee = null
      sensor.dragLocal = false
      sensor.pos = false
      sensor.speed = 100

      if (sensor.base.whenSlowDown && sensor.traveling > 30) { sensor.base.whenSlowDown(); return }

      if (sensor.traveling > 5) { return } // ne számoljon klikknek ha mozgatta a cuccot ... better traveling based check 

      // nem ugyanaz a 
      // var clickSomes = sensor.eList.children.filter(function(s,i){ return isUnderCursor(s,sensor.mousePrev ) })
      var clickSomes = isVertical ? sensor.eList.children.filter(s => sensor.mousePrev.y >= s.position.y + sensor.eList.y && sensor.mousePrev.y < s.position.y + s.height + sensor.eList.y)
        : sensor.eList.children.filter(s => sensor.mousePrev.x >= s.position.x + sensor.eList.x && sensor.mousePrev.x < s.position.x + s.width + sensor.eList.x)

      // KIHAL lehet még odázhatom a SwiperAgain-t !! 
      // console.log( clickSomes.length , clickSomes[0] == sensor.downOn )

      if (clickSomes.length && clickSomes[0] == sensor.downOn) {
        //log = clickSomes
        sensor.base.clickElement(clickSomes[0], sensor.eList, sensor)
      } else { /*log = 'miss click'*/ }

    }

    this.sensor.on('mousemove', moving).on('touchmove', moving)
    function moving(e) {

      var sensor = this // becouse filter this 

      if (sensor.dragLocal) {
        // console.log( sensor.name + " drag " )
        sensor.mousePrev = e.data.global
        var nPos = e.data.getLocalPosition(sensor)
        var speed = distance(sensor.pos, nPos)
        sensor.traveling += speed
        sensor.pos = nPos

        // if(sensor.base.whenSlowDown && sensor.speed < 10 ){ sensor.base.whenSlowDown()  }

      }
    }

    function distance(a, b) { return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y)) }


    this.sensorInteraction = function() {

      try {


        if (this.eList.isVertical) {

          var vswip = (this.sensor.pos.y - this.sensor.dragLocal.y) / 12 // vertical speed

          if (!vswip) { return }

          // console.log( vswip )

          if (Math.abs(vswip) < 7 && skeleton.interaction[0] instanceof LibrarySwiper) { skeleton.interaction[0].whenSlowDown() }

          this.eList.y += this.eList.y + vswip < 0 && this.eList.y + vswip - 720 > -this.eList.height ? vswip : 0

        } else {
          var hswip = (this.sensor.pos.x - this.sensor.dragLocal.x) / 16 // horisontal speed 

          if (!hswip) { return }

          var move = this.eList.x + hswip < 0 && this.eList.x + hswip - 1280 > -this.eList.width ? hswip : 0

          // if ( move !=  0){ console.log( this.sensor.name ) }

          this.eList.x += move
        }

      } catch (err) { }

    }


    return this

  }

  /*

    ide jön a lap kimozgatása a listából

      + 	valami máshoz hozzáadni és grafikailag már ki is van szedve
      + 	ugyanoda pozícionálni, hogy az animáció innen induljon 
      - 	helyettesíteni egy lista összerántó animációval, ami akár egyből, vagy késleltetéssel is inudlhat
        közben átanimálni a kártyát az új pozíciójába. 
        Miközben le kell védeni, hogy ne lehessen kilépni az oldalról, vagy ha ki is lép 
        akkor az animáció nem fut le, viszont a logikai lépésnek le kell futnia ( vagy nem )
        de minden esetre ezt a lehetőséget jól eldönthetően le kell fektetni. 
      +	folyamat befejezése .. lehet rajta csiszolni 
      -	a laplista egy deck + search and filter option 

  + AvatarSwiper sensor kijavítása ( container-be kell rakni a sima Sprite -ot )
  + Deck insert position by x coord 
  + deck builder lapok mozgatása a paklik között. 
  + LibrarySwiper info deck 
  - kijavítani, a LibrarySwiper -ben az lapok érzékelését - és esetleg pozícióra is kicserélni az infót, hogyha a swiper sebessége lecsökken
  - swiperek lassulása
  + click csak egy bizonyos megtett távolság alatt működjön ( remeghet az a kéz )
  - swiper méret jelző csík 
  - assign Deck to swiper instead of seiral[]
  - ha a végére insertálok lapot, akkor nem működik a swipe
  - search és filternél az opciók a swiper helyén jelenhetnének meg, addig az kimozog a képből ... és miután leszúrtük akkor mozog vissza ... 1. ötlet. 

  - konzekvensebben kellene kezelni a skeleton-ra felhelyezett eseményeket és a kidolgozni az egyese elemek $ szintű elérését.
  - a skeleton is lehetne egy objektum a kezelő függvényeivel együtt

  - az animációkat meg egy timeline objektumba kellene pakolnom, ahol szép egyértelműen el lenne tárolva ki kihez tartozik, 
    illetve tetszőleges helyeken lehessen key-eket hozzájuk adni, amiket a kontroll objektum vezérelne. 
    Illetve tömb helyett praktikusabb lenne egy láncolt listában tárolni az épp futó animációkat 

  - a gameplay-t is ezzel a skeletonra építő rendszerrel lenne érdemes megvalósítani. 

  + LibrarySwiper megállásra váltson képet - - szerintem ez nagyon kényelmes .. persze a usereknek lehet szokatlan lesz. 
  -+  ne a lap jelenjen meg, hanem a tervezett detailed leírás 
  + váltásokor minimum animmal menjen át az egyik a másikba 	- - - KIHAL 

  - vajon még megvan hogyan kell cordovával lefordítani a cuccot  ? -- nem látja a JDK-t most 
  + sima cordova -val irdatlan lassú a mobilomon. 
  + LibrarySwiper csak a képernyű szélén a lapoknál működik
  - LibrarySwiper info váltakozása lassú sebességnél 
  - a könyvtárba is 2 egymás melletti swiper 

  -- http://index.hu/tech/2015/11/08/jobb_mint_a_bl-donto_de_rosszabb_mint_az_nb1/

  DRIVE
  https://drive.google.com/a/innosenses.com/folderview?id=0B4nRt-veGqGgSE1jc1hPNlhHU00&usp=sharing_eid&ts=562e0d7c


    TODO

    A swipereknél 3 fontos lépés hiányzik:

      - az interakciót rendbe kell rakni és elválasztani a PIXI-től amennyire csak lehet
        ha árnyék elemeket használnék, akkor már a lapok betöltése előtt is tudnám őket 
        használni, és mindíg csak megfelelő mennyiségű lappal kellene dolgoznom
      - normálisan be kell, hogy épüljön a skeletonba 
      - szűrhető és filterezhetőnek kellene lennie

      - nem csak kártya, de tetszőleges skeleton alapú komponensek 
      - horizontal
      - vertical
      - 2-D
      - 2/3-D 
      - think editor 

  */


  /*

  Most jön az a rész, hogy az egymásból leszármáztatot swipereknek különböző módon kell működnie 

  illetve mindegyiknek leszűrhetőnek és infó alapján kereshetőnek is kell lennie 

    - swiper indicator - ami mutatja, hogy hol tart a listban a swipe 

    - swiper megoldás laptop tapicska padra -- az komoly kérdés 


  swipert használok ( szinte mindenhol ahol sok infóval dolgozok )  :

               content 					action 

    ---------------------------------------------------------------------------------------------------------------------------------------------------------------							 

    - changeAvatar		elérhető avatár				egyszerű kiválasztás

    - mission 			küldetések					kiválasztani az adott missziót , a még el nem értekből a következő ( pár ) inaktív

    - library 			megszerzett lapok ( professionok / attributumok )	kiválasztani azt aminek a leírására kíváncsiak vagyunk { legyenek benne belső linkek ? }	

    - deckbuilder 		meglévő és deck lapjai		2 swiper egymás alatt , egymás között mozgatni lehet a lapokat 

    - cardFactory  		fejleszthető lapok 			ha üres a fejlesztési hely akkor oda mozgathat egy lapot , egyébként kijelölheti kiket álldoz be ( amikor a beálldozásra kapcsol akkor értelem szerint szúr )

    - rival 			pvp lista					pvp listában hol állunk - kivállasztásnál esetleg részletesebb infók az illetőről 

    - global 			group pvp lista				world pvp listában hol tartunk

    - trade 			ha sok tradelhető item lesz 

    - rule 				háttértörténetben lapozás 	- eseti linkek a library-ra 	


    Nov. 20 - p, szo , vas  + utana valo kethet 



*/

  // JS leszármaztatás 

  SwiperBase.prototype.clickElement = function(element, list, swiper) { }

  // SwiperBase.prototype.whenSlowDown = function( ){ }

  function LibrarySwiper(isAVATAR, isVertical, cardSetOfSerial, box) {

    SCENEW_FORCE = 1

    SwiperBase.call(this, isAVATAR, isVertical, cardSetOfSerial, box)

    this.infoPanel = new PIXI.Container()

    this.previous = new PIXI.Container()

    stage.addChild(this.infoPanel)

  }

  LibrarySwiper.prototype = Object.create(SwiperBase.prototype)

  LibrarySwiper.prototype.clickElement = function(card, list, swiper) {

    //this.showCardInfo( KKK[card.serial] )
    this.showCardInfo(KKK[card.serial.slice(0, 4)])

  }

  LibrarySwiper.prototype.showCardInfo = function(card) {

    // previous animation 

    var previous = this.previous

    // rework
    if (previous && card && (previous.serial == card.serial)) { return }

    var pan = this.infoPanel

    pan.removeChildren()

    previous.serial = card.serial

    previous.removeChildren()

    this.infoPanel.children.forEach(function(ch, i) { previous.addChild(ch) })

    previous.position = this.infoPanel.position.clone()

    stage.addChild(previous)

    // previous.fly = { to:{ x: previous.x , y: previous.y + 900  } , step: 10  }


    // miért nincs előző kianimálódása ?
    pan.fly = { from: { x: -700, y: 0 }, to: { x: 0, y: 0 }, i: 0, step: 13 }


    stage.addChild(this.infoPanel)

    // remder content 

    //skeleton.main.libraryPanel.library.nameOfCard.pixi.text = card.serial ? KKK[card.serial].name : ' - - name error - - ' 
    skeleton.main.libraryPanel.library.nameOfCard.pixi.text = card.serial ? CR + KKK[card.ser].name : ' - - name error - - '

    if (card.isScene) { // miért nincs a settből érkező lapoknak típus azonosítása ?? TODO 

      var sceneBg = PIXI.Sprite.fromImage('img/scenes/ls{..1}.jpg'.insert(card.gmid))

      sceneBg.scale.set(.6)
      sceneBg.position.set(200, 100)

      this.infoPanel.addChild(sceneBg)

      card.prof.forEach(function(pf, i) {
        var icon = new PIXI.Sprite(window.PROT[1][pf.name])
        var name = new PIXI.Text(pf.name, { font: FontFace(36), fill: 'white' })
        // icon.width = icon.height = 40
        icon.position.set(430 + (320 * (i % 2)), 520 + ~~(i / 2) * 80)
        name.position.set(510 + (320 * (i % 2)), 540 + ~~(i / 2) * 80)
        pan.addChild(icon)
        pan.addChild(name)
      })

      return
    }

    if (card.isActor || card.isItem) {

      var actor = card.isActor ? PIXI.Sprite.fromImage('img/actors/' + card.gmid + '.png') : PIXI.Sprite.fromImage('img/items/itm' + card.gmid + '.png')

      actor.anchor.set(0, 1)
      actor.position.set(30, 710)

      pan.addChild(actor)

      card.prof.forEach(function(pf, i) {
        var icon = new PIXI.Sprite(window.PROT[1][pf.name])
        var name = new PIXI.Text(pf.name, { font: FontFace(36), fill: 'white' })
        // icon.width = icon.height = 40
        icon.position.set(430, 120 + i * 80)
        name.position.set(510, 140 + i * 80)
        pan.addChild(icon)
        pan.addChild(name)
      })


      var skill = new PIXI.Text(card.whatIsDo + CR + card.descript, STYLE_F36_LIBRARY)

      // https://pixijs.github.io/docs/PIXI.Text.html

      skill.position.set(510, 140 + card.prof.length * 80)
      pan.addChild(skill)

      return
    }

    // Item vagy nincs azonosító függvénye

    //var clone = skeletonCardRender(KKK[card.serial])
    var clone = skeletonCardRender(KKK[card.ser])

    clone.scale.set(1.8)
    clone.position.set(500, 120)

    this.infoPanel.addChild(clone)

  }

  LibrarySwiper.prototype.whenSlowDown = function() {

    // console.log( 'whenSlowDown' )

    var list = this.eList

    var index = list.children.findIndex(function(c, i) { if (list.y + c.y > 80) return c })

    var cardImage = list.children[index]

    if (cardImage.serial) { this.showCardInfo(KKK[cardImage.serial.slice(0, 4)]) }

  }

  function MissionSwiper(isAVATAR, isVertical, cardSetOfSerial, box) {

    SwiperBase.call(this, isAVATAR, isVertical, cardSetOfSerial, box)

    //this.eList.children.forEach(function(c,i){ if(i>3){ c.filters = selectFilter } else {  c.isAvaible = true } })
  }

  MissionSwiper.prototype = Object.create(SwiperBase.prototype)

  MissionSwiper.prototype.clickElement = function(element) {

    // let ser = KKK[element.serial.slice(0,4)].gmid

    this.selected = element.serial.slice(0, 4)

    log = this.selected

    uppdate(skeleton.main.questLinePanel.questLine.keydot)

  }


  function BuilderSwiper(isAVATAR, isVertical, cardSetOfSerial, box) { SwiperBase.call(this, isAVATAR, isVertical, cardSetOfSerial, box) }

  BuilderSwiper.prototype = Object.create(SwiperBase.prototype)

  BuilderSwiper.prototype.otherDeck = function(swiper) { this.other = swiper }

  BuilderSwiper.prototype.clickElement = function(element, list, swiper) {

    // console.log( 'click:' , element.serial ? element.serial + ' ' + KKK[element.serial].name : element )

    var pos = element.position

    stage.addChild(element)

    //list.children.forEach( function(c,i){ c.x = i*255+20} )
    this.reorderHorizontal(list)

    if (list.x + list.width < 1280) { list.x = 1280 - list.width }

    // same position 
    element.position.set(pos.x + list.x, pos.y + list.y)
    //element.anim = { from: { x:element.x, y:element.y} , to:{ x: element.x , y: 390  } , i:0 , step: 9 , intOn: this }
    fly(element, { from: { x: element.x, y: element.y }, to: { x: element.x, y: 390 }, i: 0, step: 9, intOn: this })

    //console.log(element.anim)

    // flyingCards.push( element )

  }

  function CollectionSwiper(isAVATAR, isVertical, cardSetOfSerial, box) { SwiperBase.call(this, isAVATAR, isVertical, cardSetOfSerial, box) }

  CollectionSwiper.prototype = Object.create(SwiperBase.prototype)

  CollectionSwiper.prototype.otherDeck = function(swiper) { this.other = swiper }

  CollectionSwiper.prototype.clickElement = function(element, list, swiper) {

    // console.log( 'click:' , element.serial ? element.serial + ' ' + KKK[element.serial].name : element )

    var pos = element.position

    stage.addChild(element)


    //list.children.forEach( function(c,i){ c.x = i*255+20} ) // list reposition without anim 
    this.reorderHorizontal(list)

    if (list.x + list.width < 1280) { list.x = 1280 - list.width }

    // same position 
    element.position.set(pos.x + list.x, pos.y + list.y)
    element.fly = { to: { x: element.x, y: 10 }, intOn: this }
    //fly( element , { from: { x:element.x, y:element.y} , to:{ x: element.x , y: 10  } , i:0 , step: 9 , intOn: this } )
    // flyingCards.push( element )

  }


  BuilderSwiper.prototype.animEndCall = CollectionSwiper.prototype.animEndCall = function(card) {

    // console.log( card , 'need to insert to other ' )

    if (this.other && this.other.insert) { this.other.insert(card) }

  }


  function FactorySwiper(isAVATAR, isVertical, cardSetOfSerial, box) {

    SwiperBase.call(this, isAVATAR, isVertical, cardSetOfSerial, box)

    this.improvedOne = false

  }

  FactorySwiper.prototype = Object.create(SwiperBase.prototype)


  var selectFilter = [new PIXI.filters.GrayFilter()] // GLOBAL 

  // selectFilter.push(new PIXI.filters.BlurFilter()) selectFilter[1].blur = 2


  FactorySwiper.prototype.clickElement = function(element, list, swiper) {

    if (this.improvedOne) {

      element.select = element.select ? 0 : 1
      element.tint = element.select ? 0x776644 : 0xFFFFFF
      element.filters = element.select ? selectFilter : null

    } else {

      //console.log( 'javitott kartya: ' + KKK[element.serial].name )
      console.log('javitott kartya: ' + element)

      var pos = element.position
      var ser = element.serial.slice(0, 4)

      stage.addChild(element)

      //var psx = 20; list.children.forEach( function(c,i){ c.x = psx ; psx += KKK[c.serial.slice(0,4)].width*250 + 5 } )
      this.reorderHorizontal(list)

      element.position.set(pos.x + list.x, pos.y + list.y)

      element.fly = { to: { x: 752 - KKK[ser].width * 250, y: 22 }, intOn: swiper }
      //fly( element , { from: { x:element.x, y:element.y} , to:{ x: 502 , y: 22  } , i:0 , step: 9 , intOn: swiper })

      this.improvedOne = element

    }

  }

  SwiperBase.prototype.reorderHorizontal = function(list) { var psx = 20; list.children.forEach(function(c, i) { c.x = psx; psx += KKK[c.serial.slice(0, 4)].width * 250 + 5 }) }

  SwiperBase.prototype.insert = function(card) {

    var pos = card.position.clone()
    var list = this.eList

    var index = list.children.findIndex(function(c, i) { if (card.x < c.x + list.x) { return c } })
    //console.log('insert index '+index)

    // itt még a listát szét kellene nyitni 
    // figyelni kellene a végére való beilesztéssel 

    // egyre rosszabb  emiatt kellene áttérni THREE-re ott legalább a raycast jól működik 

    if (index >= 0) {
      //list.x -= list.x+list.children[index].x-card.x > 10 ? list.x+list.children[index].x-card.x : 0	
      list.addChildAt(card, index)
    } else {
      list.addChild(card)
    }

    // animation 

    card.y = 0

    //var  psx = 20;	list.children.forEach(function(c,i){if(i>=index){ c.x = psx} ; psx += KKK[c.serial.slice(0,4)].width*250 + 5 })	
    this.reorderHorizontal(list)

  }

  FactorySwiper.prototype.unselectAll = function() { this.eList.children.forEach(function(c, i) { if (c.select) { c.select = false; c.filters = null; c.tint = 0xFFFFFF } }) }

  FactorySwiper.prototype.unselectImproved = function() {

    if (this.improvedOne) {

      this.unselectAll()

      this.insert(this.improvedOne)

      this.improvedOne = false

    } else { console.log('nem fejelesztesz') }
  }

  FactorySwiper.prototype.improvedDone = function() { console.log('a lap lefejlesztve') }

  function AvatarSwiper(isAVATAR, isVertical, cardSetOfSerial, box) { SwiperBase.call(this, isAVATAR, isVertical, cardSetOfSerial, box) }

  AvatarSwiper.prototype = Object.create(SwiperBase.prototype)

  // + az AvatarSwiper clickElement -jével gond van ! Már nincs
  AvatarSwiper.prototype.clickElement = function(element) {

    var selectAvatarBtn = skeleton.main.avatarPanel.playerInfo.selectAvatarBtn.pixi
    var avatar = makeAvatar(element.gmid)
    avatar.position.set(15, -230)
    avatar.scale.set(1.5)
    avatar.gmid = element.gmid
    while (selectAvatarBtn.children.length > 1) { selectAvatarBtn.removeChildAt(1) }
    selectAvatarBtn.addChild(avatar)

  }


  this.selectAvatar = function() {

    var selectAvatarBtn = skeleton.main.avatarPanel.playerInfo.selectAvatarBtn.pixi

    // console.log( 'selectAvatar' , selectAvatarBtn )

    if (selectAvatarBtn && selectAvatarBtn.children.length == 2 && selectAvatarBtn.children[1].gmid) {

      var gmid = selectAvatarBtn.children[1].gmid
      //console.log("setAvatar:" + gmid )
      server.answer({ order: 'setAvatar', avatar: gmid })
      who.avatar = gmid

      var hero = skeleton.main.avatarPanel
      hero.img = null
      hero.render = makeAvatar(gmid, true)
      hero.render.anchor.set(.5, 0)

      //console.log( here, hero )

      uppdate('main')

    }
  }

  function makeAvatar(gmid, isHero) {

    var avatarBake = new PIXI.RenderTexture(renderer, isHero ? 450 : 150, isHero ? 411 : 150) // , PIXI.SCALE_MODES.LINEAR {0} , scale  {1}
    var face = PIXI.Sprite.fromImage('img/actors/' + gmid + '.png')
    // background
    if (!isHero) {
      face.anchor.set(.35, -.01)
      avatarBake.render(new PIXI.Graphics().beginFill(0x776644, .7).drawRect(0, 0, 150, 150).endFill())
    }
    avatarBake.render(face)

    return new PIXI.Sprite(avatarBake)
  }

  // basic card anim 
  // http://robertpenner.com/easing/
  // https://github.com/danro/jquery-easing/blob/master/jquery.easing.js
  // t - ide , b innen , i , step 
  function easeLinear(t, b, c, d) { return c * t / d + b }

  function easeInElastic(t, b, c, d, a, p) {
    if (t == 0) return b; if ((t /= d) == 1) return b + c; if (!p) p = d * .3;
    if (!a || a < Math.abs(c)) { a = c; var s = p / 4; }
    else var s = p / (2 * Math.PI) * Math.asin(c / a);
    return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
  }

  function easeOutElastic(t, b, c, d, a, p) {
    if (t == 0) return b; if ((t /= d) == 1) return b + c; if (!p) p = d * .3;
    if (!a || a < Math.abs(c)) { a = c; var s = p / 4; }
    else var s = p / (2 * Math.PI) * Math.asin(c / a);
    return (a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
  }

  function easeInOutElastic(t, b, c, d, a, p) {
    if (t == 0) return b; if ((t /= d / 2) == 2) return b + c; if (!p) p = d * (.3 * 1.5);
    if (!a || a < Math.abs(c)) { a = c; var s = p / 4; }
    else var s = p / (2 * Math.PI) * Math.asin(c / a);
    if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
  }

  // KIHAL ez elsőre át lehetett írni 

  function playOneGame() {

    var oneGame = new Coroutine()
    oneGame.isRender = false
    oneGame.isPixi = true

    prepareStacio(oneGame) // 1 hibával kevesebb 

    //uppdate('game.play')

    var stopInner = setInterval(innerAutoPlay, 77)

    function innerAutoPlay() {
      if (oneGame.gfx || flyingCards.length) { return }
      switchMatch(oneGame)
      stacio(oneGame)
      /*	
    if(!switchMatch( oneGame )){ 
      console.log( 'fight is over')			
      clearInterval(stopInner) 
      server.send('deck')
      uppdate('main')
    } else {

      stacio( oneGame )
    }
      */
    }

  }

  // --------------------------------------------------------------- [ Interface by skeleton ]

  // ha még egy jó binding rendszert is kitalálnék hozzá akkor már igazán tuti lenne 
  // http://riotjs.com/ - alkalmasint meg kellene nézni, mert lehetnek benne okosságok 
  // http://engineering.flipboard.com/2015/02/mobile-web/  60fps mobil flip book
  // https://github.com/facebook/css-layout  javascript CSS 

  var uitype = {

    SCREEN: 'screen', 			// callTo , animTo
    BUTTON: "button", 			// callTo
    PANEL: "panel",			// interactions - minden ami összetett és nem triviális 
    BAR: 'bar', 				// showValue , slide 
    AMOUNT: "amount", 			// showValue
    FIELD: "textField", 		// showText	
    SWIPER: "swiper",			// swipe , select , pick , getElementOut , insertNewElement 
    INPUT: "input",			// textInput
    ANIMATION: 'animation',
    HOLDER: 'holder',			// PIXI.Collection
    FLOW: 'flow'				// flow KIHAL - ez is kell bele 

  }

  var DOT = '.'
  var F28 = '28px ', F54 = '54px '
  var folder = "img/pieces/"

  var skeleton = {

    interaction: [],

    'splash': {
      ui: uitype.SCREEN, callTo: 'loginMove', img: folder + 'GravitonZoneSplash.jpg', //'nullpointstudioinverse.jpg', //'nullpointstudi002.jpg',

      versionText: { ui: uitype.FIELD, text: VERSION, style: STYLE_F28, pos: { x: 1260, y: 680, s: .7, alpha: .5, ax: 1 } }

    },

    // 'login': { ui: uitype.SCREEN , img : (function(){ return 'img/scenes/ls{..1}.jpg'.insert( ('0'+(dice(32)+1)).slice(-2) )  })() ,  // direct function test KIHAL! de nem csinalunk ilyet 

    'login': {
      ui: uitype.SCREEN, img: folder + 'nj720.jpg',

      name: { ui: uitype.INPUT, text: 'name...', style: STYLE_F28_INPUT, pos: { x: 515, y: 235 } },

      password: { ui: uitype.INPUT, text: 'password...', style: STYLE_F28_INPUT, pos: { x: 515, y: 300, pswd: true } },

      loginBtn: { ui: uitype.BUTTON, text: 'login', callTo: 'loginCheck', style: STYLE_F28, pos: { x: 515, y: 400 } },

      directLogin: { ui: uitype.BUTTON, text: 'welcome guest', callTo: 'directLogin', style: STYLE_F28, pos: { x: 515 + 300, y: 400 } },

      registrationBtn: { ui: uitype.BUTTON, text: 'registration', callTo: 'login.registration', style: STYLE_F28, pos: { x: 515, y: 470 } },

      passwordResetBtn: { ui: uitype.BUTTON, text: 'reset password', callTo: 'passwordReset', style: STYLE_F28, pos: { x: 515 - 300, y: 470 } },


      'autoLogin': { ui: uitype.SCREEN },

      'registration': {
        ui: uitype.SCREEN,

        selectYourAvatar: { ui: uitype.SWIPER },

        name: { ui: uitype.INPUT, text: 'name...', style: STYLE_F28_INPUT, pos: { x: 700, y: 150 } },

        password1: { ui: uitype.INPUT, text: 'password...', style: STYLE_F28_INPUT, pos: { pswd: true, x: 700, y: 220 } },

        password2: { ui: uitype.INPUT, text: 'password again...', style: STYLE_F28_INPUT, pos: { pswd: true, fontSize: F54, x: 700, y: 290 } },

        email: { ui: uitype.INPUT, text: 'email ...', style: STYLE_F28_INPUT, pos: { x: 700, y: 360 } },

        doneBtn: { ui: uitype.BUTTON, text: 'done', style: STYLE_F28, pos: { x: 700, y: 440 }, callTo: 'registrationCheck' },

        cancelBtn: { ui: uitype.BUTTON, text: 'cancel', style: STYLE_F28, pos: { x: 700 - 300, y: 440 }, callTo: 'login' },

      }

    },

    'main': {
      ui: uitype.SCREEN,

      questLinePanel: {
        ui: uitype.PANEL,

        'questLine': {
          ui: uitype.SCREEN, readyTo: 'missionPlay', img: folder + 'nj720.jpg',

          questImage: { ui: uitype.HOLDER, pos: { x: 0, y: 0 } },

          title: {
            ui: uitype.PANEL, pos: { x: 700, y: -20 }, box: { col: 0, alpha: .7, w: 700, h: 100, r: 20 },

            name: { ui: uitype.FIELD, text: 'First Mission', style: STYLE_F48, pos: { x: 20, y: 20 } }
          },

          descBckg: { ui: uitype.PANEL, pos: { x: 100, y: 490 }, box: { col: 0, alpha: .7, w: 1100, h: 740 - 490, r: 20 } },

          descript: { ui: uitype.FIELD, text: 'descript...', style: STYLE_F28_MISSION, pos: { x: 420, y: 500 } },

          speaker: { ui: uitype.HOLDER, pos: { x: 50, y: 250 } },

          next: { ui: uitype.PANEL, img: folder + 'nextinfo.png', pos: { x: 1125, y: 630 }, callTo: 'taskInfo' },

          backToMain: { ui: uitype.BUTTON }

        },

        missionSelect: {
          ui: uitype.SCREEN, setupTo: 'missionSelect', img: folder + 'missionarea.jpg',

          title: {
            ui: uitype.PANEL, pos: { x: 700, y: -20 }, box: { col: 0, alpha: .7, w: 700, h: 100, r: 20 },

            name: { ui: uitype.FIELD, text: 'Select mission', style: STYLE_F48, pos: { x: 20, y: 20 } }
          },

          backToMain: { ui: uitype.BUTTON }

        }


        /*
      'missionChange' : { ui:uitype.SCREEN , setupTo:'mission', img: folder+'nj720.jpg',

        questImage: { ui:uitype.HOLDER , pos:{x:0,y:0} }, 

        sceneA: { ui:uitype.HOLDER , pos:{x:10,y:10} }, 

        sceneB: { ui:uitype.HOLDER , pos:{x:1000,y:10} }, 

        change: { ui:uitype.BUTTON , text:'change' , style:STYLE_F28, pos:{ x:500, y:0 } , callTo:'changeQuestImage' },

        questNameField : { ui:uitype.FIELD },

        questSelect : { ui:uitype.HOLDER },

        prologOfQuest : { ui:uitype.ANIMATION,

          playAgainstQuest : { ui:uitype.GAMEPLAY }

        },

        backToMain : { ui:uitype.BUTTON }

        }*/
      },

      // nullpointstudio : { ui:uitype.PANEL, img:folder+'nullpointstudio.png' , pos:{ x: 980, y:10, s:1 } } , 

      // a binding megoldás azért kérdéses, mert az objektumok gyakran csak később jönnek létre amikhez bindelek. 
      // simán lehet úgy mint ahogy az avatart is megoldottam, hogy a bind-ek bekerülnek egy bind verembe és direkt a text-be írnak , esetleg egy isBind - et true-ra állít amikor összejön a binding 
      // .. hmm elsőre ez a megoldás még nem tűnik a legjobbnak, de most talán jó lesz. 

      dimensionitAmount: { ui: uitype.FIELD, text: '0', bind: 'who.dimensionit', style: STYLE_F28, pos: { x: 140, y: -40, ax: 1 } },

      cashAmount: { ui: uitype.FIELD, text: '1000', bind: 'who.chache', style: STYLE_F28, pos: { x: 140, y: -7, ax: 1 } },

      cardAmount: { ui: uitype.FIELD, text: '1000', bind: 'who.collection.cards.length', style: STYLE_F28, pos: { x: 140, y: 26, ax: 1 } },

      questBar: { ui: uitype.PANEL, pos: { x: 846, y: 20 }, box: { col: 0xb7fc1f0, w: 275, h: 7 } },

      rivalRunBar: { ui: uitype.PANEL, pos: { x: 846, y: 37 }, box: { col: 0xff0000, w: 137, h: 7 } },

      factionBar: { ui: uitype.PANEL, pos: { x: 846, y: 54 }, box: { col: 0xe9db00, w: 58, h: 7 } },

      rivalRunPvP: {
        ui: uitype.BUTTON,

        'pvpSelectEnemy': {
          ui: uitype.SCREEN, backToMain: { ui: uitype.BUTTON },

          playAgainstEnemy: { ui: uitype.GAMEPLAY }

        },

        'pvpRankList': {
          ui: uitype.SCREEN, backToMain: { ui: uitype.BUTTON },

          rankList: { ui: uitype.PANEL }

        },

      },

      factionChallangePvP: {
        ui: uitype.BUTTON,

        'pvpManyVsMany': { ui: uitype.SCREEN, setupTo: 'editorTest', backToMain: { ui: uitype.BUTTON } },
      },

      deckbuilderBtn: {
        ui: uitype.BUTTON, /* callTo:'main.deckbuilderBtn.deckbuilder' , */

        'deckbuilder': {
          ui: uitype.SCREEN, readyTo: 'deckBuildCode',

          backToMain: { ui: uitype.BUTTON },

          changeActualDeck: { ui: uitype.PANEL },

          searchAndfilter: { ui: uitype.PANEL },

          saveDeckBtn: { ui: uitype.BUTTON, text: 'save deck', style: STYLE_F28, pos: { x: 840, y: 340 }, callTo: 'saveDeck' }

        }
      },

      newsWall: {
        ui: uitype.BUTTON, callTo: 'main.newsPanel.boosterAmount.openBoosters',

        tradingPost: { ui: uitype.SCREEN },

        openBoosters: {
          ui: uitype.SCREEN, backToMain: { ui: uitype.BUTTON }, readyTo: 'fullDev',

        }

      },

      avatarPanel: {
        ui: uitype.PANEL,

        achivementsInfo: { ui: uitype.PANEL },

        playerNameField: { ui: uitype.FIELD },

        'playerInfo': {
          ui: uitype.SCREEN, readyTo: 'changeAvatar',

          backToMain: { ui: uitype.BUTTON },

          selectAvatarBtn: { ui: uitype.BUTTON, text: 'select', style: STYLE_F28, pos: { x: 630, y: 630 }, callTo: 'selectAvatar' }, // g = skeleton.main.avatarPanel.playerInfo.selectAvatarBtn.pixi

          dontSelectBtn: { ui: uitype.BUTTON, text: 'cancel', style: STYLE_F28, pos: { x: 630 + 300, y: 630 }, callTo: 'main' }, // g = skeleton.main.avatarPanel.playerInfo.selectAvatarBtn.pixi


          avatar: {
            ui: uitype.PANEL,

            selectAvatar: { ui: uitype.SWIPER },

            changeBackground: { ui: uitype.SWIPER }

          },

          infoPanel: { ui: uitype.PANEL },

          goals: { ui: uitype.PANEL },

          achivements: { ui: uitype.PANEL }

        }
      },

      newsPanel: {
        ui: uitype.PANEL,

        boosterAmount: {
          ui: uitype.AMOUNT,

          'openBoosters': {
            ui: uitype.SCREEN, backToMain: { ui: uitype.BUTTON },

            unopenedBoosters: { ui: uitype.PANEL },

            openingBooster: { ui: uitype.ANIMATION },

            cardsFromBooster: { ui: uitype.ANIMATION },

          }
        },

        billAmount: { ui: uitype.AMOUNT },

        solidAmount: { ui: uitype.AMOUNT },

      },

      libraryPanel: {
        ui: uitype.PANEL,

        library: {
          ui: uitype.SCREEN, readyTo: 'library',

          nameOfCard: { ui: uitype.FIELD, text: ' ', style: STYLE_F54, pos: { x: 420, y: -35 } }, // 25 -- CR hack 

          backToMain: { ui: uitype.BUTTON },

          gameplayDescription: {
            ui: uitype.SCREEN, backToMain: { ui: uitype.BUTTON },

            ownedCards: { ui: uitype.SWIPER },

            searchAndfilter: { ui: uitype.PANEL }

          },

          backgroundStoryOfCards: {
            ui: uitype.SCREEN, backToMain: { ui: uitype.BUTTON },

            ownedCards: { ui: uitype.SWIPER },

            searchAndfilter: { ui: uitype.PANEL }

          },

          gameRule: {
            ui: uitype.SCREEN, backToMain: { ui: uitype.BUTTON },

            sections: { ui: uitype.PANEL }

          },

          // search: { ui:uitype.INPUT , text:'searc...' , style:STYLE_F54, pos:{x:0,y:650}  }	


        },

        library2: {
          ui: uitype.SCREEN, readyTo: 'library2test', img: folder + "library-bg1.jpg",

          sensor: { ui: uitype.HOLDER },

          base: { ui: uitype.HOLDER },

          side: { ui: uitype.HOLDER, pos: { x: 1280 - 255 } },

          actor: { ui: uitype.HOLDER },

          page: {
            ui: uitype.HOLDER,

            name: { ui: uitype.FIELD, text: ' ', style: STYLE_F54_LIB, pos: { x: 420, y: 15 } },

            info: { ui: uitype.HOLDER },

            editDescript: { ui: uitype.BUTTON, style: STYLE_F28, pos: { x: 440, y: 0 }, text: 'editDescript', callTo: '..editDescript' }, // proper class LibraryPage.editDescript .. ez még így számos kérdést felvet 

            // additional: { ui:uitype.INPUT, text:'...' , style:STYLE_F28_400 , pos:{ x:0, y:500  } }

          },

          search: { ui: uitype.INPUT, text: 'ls>>gz_library_search<<', style: STYLE_F28_400, pos: { x: 20, y: 720 - 60 } },



          backToMain: { ui: uitype.BUTTON }

        }

      },

      cardFactoryBtn: {
        ui: uitype.BUTTON,

        'cardFactory': {
          ui: uitype.SCREEN, setupTo: 'cardFactoryCode',

          title: {
            ui: uitype.PANEL, pos: { x: 900, y: -20 }, box: { col: 0, alpha: .7, w: 700, h: 100, r: 20 },

            name: { ui: uitype.FIELD, text: 'Training cards', style: STYLE_F48, pos: { x: 20, y: 20 } }
          },

          backToMain: { ui: uitype.BUTTON },

          unupgradedCards: { ui: uitype.SWIPER },

          searchAndfilter: { ui: uitype.PANEL },

          placeOfImprovedCard: { ui: uitype.PANEL },

          unselectImproved: { ui: uitype.BUTTON, img: folder + "x-bottom-left.png", style: STYLE_F28, pos: { x: 697, y: 313 }, callTo: 'unselectImproved' },

          improvedDone: { ui: uitype.BUTTON, style: STYLE_F28, pos: { x: 820, y: 313 }, callTo: 'improvedDone', text: 'improve' }

        }
      },

      setupBtn: {
        ui: uitype.BUTTON,

        'setup': {
          ui: uitype.SCREEN, backToMain: { ui: uitype.BUTTON },

          soundVolume: { ui: uitype.BAR },

          musicVolume: { ui: uitype.BAR },

          languageSelection: { ui: uitype.PANEL },

          animationSpeed: { ui: uitype.PANEL },

          infoOnPlayedCard: { ui: uitype.PANEL },

          pushNotification: { ui: uitype.PANEL },

          resetGame: { ui: uitype.BUTTON }
        }
      },

      chatLine: {
        ui: uitype.PANEL,

        'bigChat': {
          ui: uitype.SCREEN, backToMain: { ui: uitype.BUTTON },

          chatArea: { ui: uitype.PANEL }

        }

      },

      friendsBtn: {
        ui: uitype.BUTTON,

        swiper2test: {
          ui: uitype.SCREEN, img: folder + 'setup-bg.jpg',

          sensor: { ui: uitype.HOLDER },

          base: { ui: uitype.HOLDER },

          topdeck: { ui: uitype.HOLDER },

          lowdeck: { ui: uitype.HOLDER },

          midleLine: { ui: uitype.INPUT, text: 'ls>>gz_middle_line<<', style: STYLE_F28_ILINE, pos: { x: 40, y: 340 } },

          backToMain: { ui: uitype.BUTTON },

          readyTo: 'swiper2test'
        }

      },

      teamBtn: {
        ui: uitype.BUTTON,

        guild: {
          ui: uitype.SCREEN, readyTo: 'playerVsAI',

          backToMain: { ui: uitype.BUTTON }

        }

      }

      // ,countdown : { ui:uitype.PANEL }

      , backToLogin: { ui: uitype.BUTTON, text: 'back to login', callTo: 'login', style: STYLE_F28, pos: { x: 20, y: 570, s: 1 } } // .7
      , matrixBtn: { ui: uitype.BUTTON, text: 'matrix area', callTo: 'matrixArea', style: STYLE_F28, pos: { x: 20, y: 480, s: 1 } } // .7

    },

    // --------------------------------------------------[ in GAME 1 vs 1 ]--------------------------------------------------------------------

    game: {
      ui: uitype.FLOW, order: 'setup|play|result',

      setup: {
        ui: uitype.SCREEN, img: folder + 'pvp-bg.jpg',

        title: {
          ui: uitype.PANEL, pos: { x: 700, y: -20 }, box: { col: 0, alpha: .7, w: 700, h: 100, r: 20 },

          name: { ui: uitype.FIELD, text: 'Game Play', style: STYLE_F48, pos: { x: 20, y: 20 } }

        }, backToMain: { ui: uitype.BUTTON },

        player: {
          ui: uitype.HOLDER, pos: { x: 390, y: 165 },
          bg: { ui: uitype.PANEL, box: { col: 0, alpha: .7, w: 170, h: 200 } },
          face: { ui: uitype.HOLDER, pos: { x: 10, y: 10 } },
          name: { ui: uitype.FIELD, text: ' --- ', style: STYLE_F28, pos: { x: 85, y: 169, ax: .5 } },
          drawDeck: { ui: uitype.PANEL, img: folder + 'deck3.png', pos: { x: 125, y: 210 }, length: { ui: uitype.FIELD, text: '21', style: STYLE_F28, pos: { x: 22, y: 14, ax: .5 } } },
        },

        enemy: {
          ui: uitype.HOLDER, pos: { x: 770, y: 165 },
          bg: { ui: uitype.PANEL, box: { col: 0, alpha: .7, w: 170, h: 200 } },
          face: { ui: uitype.HOLDER, pos: { x: 10, y: 10 } },
          name: { ui: uitype.FIELD, text: ' --- ', style: STYLE_F28, pos: { x: 85, y: 169, ax: .5 } },
          drawDeck: { ui: uitype.PANEL, img: folder + 'deck3.png', pos: { y: 210 }, length: { ui: uitype.FIELD, text: '23', style: STYLE_F28, pos: { x: 22, y: 14, ax: .5 } } },
        },

        sceneDeck: { ui: uitype.PANEL, img: folder + 'deck3.png', pos: { x: 645, y: 375 }, length: { ui: uitype.FIELD, text: '9', style: STYLE_F28, pos: { x: 22, y: 14, ax: .5 } } },

        start: { ui: uitype.BUTTON, text: 'start run', style: STYLE_F28, pos: { x: 535, y: 485 }, callTo: 'playerVsAIPlay' }

      },

      play: {
        ui: uitype.SCREEN, backToMain: { ui: uitype.BUTTON }, img: folder + 'darkcorner2.jpg',

        scene: { ui: uitype.HOLDER },

        // sceneText: { ui:uitype.FIELD, text:'scene name', pos:{fontSize:'250px ', x:640, y:2000 ,ax:.5 , ay:.5}}, 
        // #921414

        topinfo: {
          ui: uitype.HOLDER, pos: { y: 20 },  // 20 // 300 - middle infoLine

          player: {
            ui: uitype.HOLDER, pos: { x: 110 },

            uIndicator: { ui: uitype.PANEL, img: folder + 'underIndicator.png', pos: { x: -110, y: 270, sx: 1.5, sy: 2 } },

            avatarHolder: {
              ui: uitype.PANEL, img: folder + 'top-avatar-left.png',
              victoryAmount: { ui: uitype.FIELD, text: '28', style: STYLE_F28, pos: { x: 95, y: 12, ax: .5, fontColor: '#7598b6' } },
              sceneValue: { ui: uitype.FIELD, text: '48', style: STYLE_F28, pos: { x: 95, y: 43, ax: .5 } },
              valueIndicator: { ui: uitype.PANEL, pos: { x: 10, y: 72 }, box: { col: 0x7598b6, w: 100, h: 6 } },
              avatarPic: { ui: uitype.HOLDER, pos: { x: 3, y: 3, s: .43 } }
            },

            lostDeck: { ui: uitype.PANEL, pos: { x: -100 }, length: { ui: uitype.FIELD, text: '48', style: STYLE_F28, pos: { x: 22, y: 14, ax: .5 } } },
            drawDeck: { ui: uitype.PANEL, pos: { x: -50 }, length: { ui: uitype.FIELD, text: '48', style: STYLE_F28, pos: { x: 22, y: 14, ax: .5 } } },
            active: { ui: uitype.PANEL, img: folder + 'leftSelect.png', pos: { x: 107, y: 62, hidden: true } }

          },

          enemy: {
            ui: uitype.HOLDER, pos: { x: 1045 },

            uIndicator: { ui: uitype.PANEL, img: folder + 'underIndicator.png', pos: { x: 240, y: 270, ax: 0, sx: -1.5, sy: 2 } },

            avatarHolder: {
              ui: uitype.PANEL, img: folder + 'top-avatar-right.png',
              victoryAmount: { ui: uitype.FIELD, text: '18', style: STYLE_F28, pos: { x: 26, y: 12, ax: .5, fontColor: '#9cb7a6' } },
              sceneValue: { ui: uitype.FIELD, text: '68', style: STYLE_F28, pos: { x: 26, y: 43, ax: .5 } },
              valueIndicator: { ui: uitype.PANEL, pos: { x: 110, y: 72 }, box: { col: 0x9cb7a6, w: -100, h: 6 } },
              avatarPic: { ui: uitype.HOLDER, pos: { x: 53, y: 3, s: .43 } }
            },

            lostDeck: { ui: uitype.PANEL, pos: { x: 175 }, length: { ui: uitype.FIELD, text: '48', style: STYLE_F28, pos: { x: 22, y: 14, ax: .5 } } },
            drawDeck: { ui: uitype.PANEL, pos: { x: 125 }, length: { ui: uitype.FIELD, text: '48', style: STYLE_F28, pos: { x: 22, y: 14, ax: .5 } } },
            active: { ui: uitype.PANEL, img: folder + 'rightSelect.png', pos: { x: -402, y: 62, hidden: true } }

          },

          infoLine: {
            ui: uitype.HOLDER, pos: { x: 500, y: 3 }, // KIHAL HOLDER a megoldas  					
            txbg: { ui: uitype.PANEL, box: { col: 0, alpha: .7, y: 10, w: 322, h: 55 } },
            message: { ui: uitype.FIELD, text: '-- play game ---', style: STYLE_F28, pos: { y: 25, x: 322 / 2, ax: .5 } },
            icons: { ui: uitype.HOLDER, pos: { x: -70 * 3 } }
          },

          sceneDeck: { ui: uitype.PANEL, pos: { x: 970, y: 4 }, length: { ui: uitype.FIELD, text: '48', style: STYLE_F28, pos: { x: 22, y: 14, ax: .5 } } },

        },

        inPlay: {
          ui: uitype.HOLDER, pos: { y: 324 }, //324 // 230 middle infoLine
          player: { ui: uitype.HOLDER },
          enemy: { ui: uitype.HOLDER }
        },

        hand: { ui: uitype.HOLDER, pos: { y: 400 } },

        enemyHand: { ui: uitype.HOLDER },

        moreOrAction: {
          ui: uitype.HOLDER, pos: { x: 400, y: 1400 },

          more: { ui: uitype.BUTTON, text: 'Play more', style: STYLE_F28, pos: {}, callTo: 'choicePlayMore' },
          action: { ui: uitype.BUTTON, text: 'Action', style: STYLE_F28, pos: { x: 300 }, callTo: 'choiceAction' }

        },

        skillDeploy: {
          ui: uitype.HOLDER, pos: { x: 100, y: 1394 },
          txbg: { ui: uitype.PANEL, box: { col: 0, alpha: .7, w: 800, h: 55 } },
          message: { ui: uitype.FIELD, text: 'deploy skill: ', style: STYLE_F28, pos: { y: 10, x: 10 } },
          done: { ui: uitype.BUTTON, text: 'done', style: STYLE_F28, pos: { x: 810, y: 7 }, callTo: 'doneDeploySkill' }
        },

        sceneShadow: { ui: uitype.FIELD, text: 'scene name', style: { font: FontFace(200), fill: 'black', ineHeight: 2800 /*, stroke:'#AAAAAA', strokeThickness:8  */ }, pos: { x: 640, y: 2000, ax: .5, alpha: .4 } },
        sceneText: { ui: uitype.FIELD, text: 'scene name', style: { font: FontFace(200), fill: 'white', ineHeight: 2800 /*, stroke:'#AAAAAA', strokeThickness:8  */ }, pos: { x: 640, y: 2000, ax: .5 } },



        floating: {
          ui: uitype.FLOW,

          stepp: { ui: uitype.BUTTON, text: 'next stepp just 4 test', pos: { x: 515, y: 0, s: .7 }, callTo: 'firstNextStepp' }, // y:500

          debug: { ui: uitype.FIELD, text: '-', style: STYLE_F28, pos: { x: 505, y: 71, s: .5 } }

        }

      },

      result: {
        ui: uitype.SCREEN, img: folder + 'darkcorner2.jpg', //'setup-bg.jpg',

        title: {
          ui: uitype.PANEL, pos: { x: 700, y: -20 }, box: { col: 0, alpha: .7, w: 700, h: 100, r: 20 },

          name: { ui: uitype.FIELD, text: 'Result of Play', style: STYLE_F48, pos: { x: 20, y: 20 } }

        },

        player: {
          ui: uitype.HOLDER, pos: { x: 390, y: 165 },
          bg: { ui: uitype.PANEL, box: { col: 0, alpha: .7, w: 170, h: 200 } },
          face: { ui: uitype.HOLDER, pos: { x: 10, y: 10 } },
          name: { ui: uitype.FIELD, text: ' --- ', style: STYLE_F28, pos: { x: 85, y: 169, ax: .5 } },
          drawDeck: { ui: uitype.PANEL, img: folder + 'deck3.png', pos: { x: 125, y: 210 }, length: { ui: uitype.FIELD, text: '21', style: STYLE_F28, pos: { x: 22, y: 14, ax: .5 } } },
          lostDeck: { ui: uitype.PANEL, img: folder + 'deck3.png', pos: { x: 125 - 50, y: 210 }, length: { ui: uitype.FIELD, text: '21', style: STYLE_F28, pos: { x: 22, y: 14, ax: .5 } } },
        },

        enemy: {
          ui: uitype.HOLDER, pos: { x: 770, y: 165 },
          bg: { ui: uitype.PANEL, box: { col: 0, alpha: .7, w: 170, h: 200 } },
          face: { ui: uitype.HOLDER, pos: { x: 10, y: 10 } },
          name: { ui: uitype.FIELD, text: ' --- ', style: STYLE_F28, pos: { x: 85, y: 169, ax: .5 } },
          drawDeck: { ui: uitype.PANEL, img: folder + 'deck3.png', pos: { y: 210 }, length: { ui: uitype.FIELD, text: '23', style: STYLE_F28, pos: { x: 22, y: 14, ax: .5 } } },
          lostDeck: { ui: uitype.PANEL, img: folder + 'deck3.png', pos: { x: 50, y: 210 }, length: { ui: uitype.FIELD, text: '23', style: STYLE_F28, pos: { x: 22, y: 14, ax: .5 } } },
        },

        // sceneDeck: { ui:uitype.PANEL,  img:folder+'deck3.png', pos:{x:670,y:310} , length: { ui:uitype.FIELD, text:'9', style:STYLE_F28, pos:{ x:22, y:9, ax:.5 } } },

        score: {
          ui: uitype.HOLDER, pos: { x: 662, y: 165 },

          player: { ui: uitype.FIELD, text: '0', style: STYLE_F54, pos: { fontColor: '#7598b6', x: -20, y: 10, ax: 1 } },
          sparate: { ui: uitype.FIELD, text: ':', style: STYLE_F54, pos: { y: 75, ax: .5 } },
          enemy: { ui: uitype.FIELD, text: '0', style: STYLE_F54, pos: { fontColor: '#9cb7a6', x: +20, y: 10, ax: 0 } },

        },

        endOfRun: { ui: uitype.BUTTON, text: 'end of run', style: STYLE_F28, pos: { x: 535, y: 485 }, callTo: 'main' }

      }

      // s = skeleton.game.result
      // a = [ s.player.pixi , s.enemy.pixi , s.score.pixi , s.endOfRun.pixi ]
      // a.forEach( e => console.log( e.ui.keydot ,  e.position ) )

    },

    // -----------------------------------[ cards skeleton just for render ]--------------------------------------

    card: {

      actor: {

        inPlay: {
          ui: uitype.HOLDER,

          pic: { ui: uitype.HOLDER, pos: { y: -220, s: .7 } },

          // bckg: { ui:uitype.PANEL, img: folder+'inplay-stand.png'  },
          stand: { ui: uitype.HOLDER },

          icons: { ui: uitype.HOLDER, pos: { x: 0, y: -26 } },

          name: { ui: uitype.FIELD, text: ' ... ', style: STYLE_CARD_NAME, pos: { x: 202 / 2, y: 0, ax: .5 } },

          info: {
            ui: uitype.HOLDER,

            bckg: { ui: uitype.PANEL, pos: { x: 10 }, box: { col: 0, alpha: .7, w: 185, h: 60 } },

            icons: { ui: uitype.HOLDER, pos: { x: 0, y: 0 } },

            descript: { ui: uitype.FIELD, text: ' a skill leirasa ', style: STYLE_INPLAY_DESCRIPT, pos: { x: 20, y: 5 } }

          },

          score: { ui: uitype.FIELD, text: '+1', styleL: STYLE_CARD_NAME, pos: { x: 180, y: 38, ax: 1 } },

          item: {
            ui: uitype.HOLDER, pos: { s: .7 },

            pic: { ui: uitype.HOLDER, pos: { x: 0, y: 120, s: .7 } },

            /*

          info: { ui:uitype.HOLDER , 

            bckg: { ui:uitype.PANEL , pos:{ x:10 }, box:{ col:0,alpha:.7, w: 185 , h:60 } } , 

            icons: { ui:uitype.HOLDER, pos:{ x: 0, y:0  } },					

            descript: { ui:uitype.FIELD , text:' a skill leirasa ', style:STYLE_INPLAY_DESCRIPT , pos:{ x:20 , y:5 } } ,	

          }

            */

          }

        },

        inHand: {
          ui: uitype.HOLDER,

          under: { ui: uitype.HOLDER, pos: { x: 0, y: 0 } },

          bckg: { ui: uitype.PANEL, img: isUNDER ? folder + 'card-border-w1.png' : folder + 'card-bckg.png' },

          icons: { ui: uitype.HOLDER, pos: { x: 0, y: 0 } },

          name: { ui: uitype.FIELD, text: ' ... ', style: STYLE_CARD_NAME, pos: { x: 250 / 2, y: 5, ax: .5 } },

          pic: { ui: uitype.HOLDER, pos: { s: .7, x: -10, y: 38 } },

          info: {
            ui: uitype.HOLDER, pos: { y: 200 },

            bckg: { ui: uitype.PANEL, pos: { x: 10 }, box: { col: 0, alpha: .7, w: 230, h: 60 } },

            icons: { ui: uitype.HOLDER, pos: { x: 0, y: 0 } },

            descript: { ui: uitype.FIELD, text: ' a skill leirasa ', style: STYLE_CARD_DESCRIPT, pos: { x: 20, y: 5 } },

          }

        },

        W2inHand: {
          ui: uitype.HOLDER,

          bckg: { ui: uitype.PANEL, img: folder + 'card-border-w2.png' },

          icons: { ui: uitype.HOLDER, pos: { x: 0, y: 0 } },

          name: { ui: uitype.FIELD, text: ' ... ', style: STYLE_CARD_NAME, pos: { x: 250 / 2, y: 7, ax: .5 } },

          pic: { ui: uitype.HOLDER, pos: { s: .7, x: -10, y: 38 } },

          info: {
            ui: uitype.HOLDER, pos: { y: 200 },

            bckg: { ui: uitype.PANEL, pos: { x: 10 }, box: { col: 0, alpha: .7, w: 230, h: 60 } },

            icons: { ui: uitype.HOLDER, pos: { x: 0, y: 0 } },

            descript: { ui: uitype.FIELD, text: ' a skill leirasa ', style: STYLE_CARD_DESCRIPT, pos: { x: 20, y: 5 } },

          }

        },


        W3inHand: {
          ui: uitype.HOLDER,

          bckg: { ui: uitype.PANEL, img: folder + 'card-border-w3.png' },

          icons: { ui: uitype.HOLDER, pos: { x: 0, y: 0 } },

          name: { ui: uitype.FIELD, text: ' ... ', style: STYLE_CARD_NAME, pos: { x: 250 / 2, y: 7, ax: .5 } },

          pic: { ui: uitype.HOLDER, pos: { s: .7, x: -10, y: 38 } },

          info: {
            ui: uitype.HOLDER, pos: { y: 200 },

            bckg: { ui: uitype.PANEL, pos: { x: 10 }, box: { col: 0, alpha: .7, w: 230, h: 60 } },

            icons: { ui: uitype.HOLDER, pos: { x: 0, y: 0 } },

            descript: { ui: uitype.FIELD, text: ' a skill leirasa ', style: STYLE_CARD_DESCRIPT, pos: { x: 20, y: 5 } },

          }

        }



      },

      // if( card.isActor ){ actor.scale.set(.7);actor.position.set(-10,38) } else { actor.scale.set(.7);actor.position.set(30,50) }	

      item: {
        ui: uitype.HOLDER, // only hand version

        bckg: { ui: uitype.PANEL, img: folder + 'card-bckg.png' },

        icons: { ui: uitype.HOLDER, pos: { x: 0, y: 0 } },

        name: { ui: uitype.FIELD, text: ' ... ', style: STYLE_CARD_NAME, pos: { x: 250 / 2, y: 5, ax: .5 } },

        pic: { ui: uitype.HOLDER, pos: { s: .7, x: 30, y: 50 } },

        info: {
          ui: uitype.HOLDER, pos: { y: 200 },

          bckg: { ui: uitype.PANEL, pos: { x: 10 }, box: { col: 0, alpha: .7, w: 230, h: 60 } },

          icons: { ui: uitype.HOLDER, pos: { x: 0, y: 0 } },

          descript: { ui: uitype.FIELD, text: ' a skill leirasa ', style: STYLE_CARD_DESCRIPT, pos: { x: 20, y: 5 } },

        }

      },

      sceneW2: {
        ui: uitype.HOLDER, // w2 for test

        pic: { ui: uitype.HOLDER, pos: { s: .92, y: 22 } },

        border: { ui: uitype.PANEL, img: folder + 'card-border-w2-alpha.png' },

        name: { ui: uitype.FIELD, text: ' ... ', style: STYLE_CARD_NAME, pos: { x: 20, y: 7, ax: 0 } },

        icons: { ui: uitype.HOLDER, pos: { x: 0, y: 0 } }

      },

      scene: {
        ui: uitype.HOLDER, // only hand version

        pic: { ui: uitype.HOLDER },

        border: { ui: uitype.PANEL, img: folder + 'card-border-w1.png' },

        name: { ui: uitype.FIELD, text: ' ... ', style: STYLE_CARD_NAME, pos: { x: 250 / 2, y: 5, ax: .5 } },

        icons: { ui: uitype.HOLDER, pos: { x: 0, y: 0 } }

      }

    }

  }

  function prepareInterface(u) {

    var folder = "img/pieces/"

    u.main.img = folder + "exoMenu.jpg"

    u.main.avatarPanel.playerInfo.img = folder + "chatbg.jpg"

    u.main.deckbuilderBtn.deckbuilder.img = folder + "chatbg.jpg"

    u.main.libraryPanel.library.img = folder + "library-bg1.jpg"

    u.main.newsWall.openBoosters.img = folder + "ogabor_corridor_01.jpg"

    // u.main.questLinePanel.questLine.img = folder+"nj720.jpg"

    // u.main.factionChallangePvP.pvpManyVsMany.img = folder+'nullpointstudioinverse.jpg' //'pvp-bg.jpg'
    u.main.factionChallangePvP.pvpManyVsMany.img = folder + 'speedb01.jpg' //folder+'inspectOfWastecity.jpg' //'tara.jpg' //'pvp-bg.jpg' // 'inspectOfWastecity.jpg'

    u.main.cardFactoryBtn.cardFactory.img = folder + "exoInnerPlace.jpg" //'noscene.jpg'

    u.main.teamBtn.guild.img = "img/scenes/ls32.jpg"

    u.login.registration.img = folder + "ogabor_corridor_01.jpg"

    extend(u.main.cardFactoryBtn.cardFactory.placeOfImprovedCard, { img: folder + "factored-card-base.png", pos: { x: 500, y: 20 } })

    // autoWorkButtonWithout callTo but have children screen 

    // align and functionality to all backToMain buttons 

    extendClass('backToMain', { img: folder + 'back_to_menu.png', pos: { x: 1280, ax: 1 }, callTo: 'main' })

    extend(u.main.questLinePanel, { img: folder + 'btnMission.png', pos: { x: 900, y: 55 } })

    extend(u.main.deckbuilderBtn, { img: folder + 'btnDeckBuild.png', pos: { x: 810, y: 640 } })

    extend(u.main.cardFactoryBtn, { img: folder + 'btnTraining.png', pos: { x: 1040, y: 640 } })

    extend(u.main.libraryPanel, { img: folder + 'btnLibrary.png', pos: { x: 520, y: 470 } })

    extend(u.main.rivalRunPvP, { img: folder + 'btnRival.png', pos: { x: 810, y: 400 }, callTo: 'es6pve' })

    extend(u.main.factionChallangePvP, { img: folder + 'btnGlobal.png', pos: { x: 1040, y: 400 } })

    extend(u.main.avatarPanel, { img: folder + 'heroAvatar.png', pos: { ax: 0.5, x: 1280 / 2, y: 70 } })

    extend(u.main.friendsBtn, { img: folder + 'btnFriends.png', pos: { x: -50, y: 400 } /*, callTo:'moneyMoneyMoney' */ })

    extend(u.main.teamBtn, { img: folder + 'btnTeam.png', pos: { x: 150, y: 400 } })

    extend(u.main.newsWall, { img: folder + 'btnTrade.png', pos: { x: 145, y: 55 } })


  }

  function extend(obj, json) { try { obj = Object.assign(obj, json) } catch (err) { console.log(err) } }

  function extendClass(name, json) {
    //travel(skeleton,name).forEach(function( obj ){ Object.assign( obj , json ) })

    for (let node of Object.walk(skeleton, (o, k) => o.ui || !k, (o, k) => k && ~(k.indexOf(name)))) Object.assign(node, json)

    // ||!k - a rooton ne keressen ui-t
    // nem feltétlenül olvashatóbb, de sokkal általánosabb célú a walk, mint a tracel, ráadásul nem kerül végtelen ciklusba se! 

  }

  // rework 
  function autoKeydotCallTo(o, keydot) {
    var keys = Object.keys(o)
    while (keys.length) {
      var key = keys.shift()
      if (o[key] instanceof Object) {
        var kdot = keydot.length ? keydot + DOT + key : key
        o[key].keydot = kdot
        // console.log( kdot )

        if (o[key].ui && o.ui && [uitype.PANEL, uitype.BUTTON].indexOf(o.ui) >= 0 && o[key].ui == uitype.SCREEN) { o.callTo = kdot }

        autoKeydotCallTo(o[key], kdot)
      }
    }
  }

  function objByKeys(obj, keyDotSelected) {

    var sa = keyDotSelected.split('.')

    while (sa.length && obj) { obj = obj[sa[0]] ? obj[sa.shift()] : undefined }

    return obj

  }

  function resultToMain() { uppto('main', { to: { y: 0 }, s1: { y: -720 }, s2: { y: 720 }, step: 19 }) } // ez igy már nem megy át kell gondolni 


  this.loginMove = function() { uppto('login', { to: { y: 0 }, s1: { y: 720 }, s2: { y: -720 }, step: 19 }) } // direction up 


  var currentSCENE = ''


  function uppto(keyDotSelected, fly) {

    var u = objByKeys(skeleton, keyDotSelected)

    if (!currentSCENE || u.ui != uitype.SCREEN) { return uppdate(keyDotSelected) } else {

      fly = fly || { to: { x: 0 }, s1: { x: 1280 }, s2: { x: -1280 } } /// direction left

      var prevScreen = currentSCENE.pixi

      uppdate(keyDotSelected)

      u.pixi.addChild(prevScreen)

      u.pixi.x = fly.s1.x || u.pixi.x
      u.pixi.y = fly.s1.y || u.pixi.y
      prevScreen.x = fly.s2.x || prevScreen.x
      prevScreen.y = fly.s2.y || prevScreen.y

      u.pixi.fly = fly

    }

  }

  function uppdate(keyDotSelected, base) {

    keyDotSelected = keyDotSelected.keydot ? keyDotSelected.keydot : keyDotSelected

    base = base || stage

    // console.log( u )

    var u = objByKeys(skeleton, keyDotSelected)

    if (!u) { return }

    var subs = Object.keys(u)

    if (u && u.img) {

      if (u.ui == uitype.SCREEN) {
        // console.log( "\n[{..1}] \n -------------".insert( keyDotSelected   , subs.join(CR)) )

        flyOver()
        if (editor) { editor.doc.style.visibility = 'hidden' }
        SCENEW_FORCE = false

        if (base.x != 0) {
          base.position.set(0, 0);
          base.scale.set(1)
          base.interactive = false

          // ([ 'mousedown' ,'touchstart' ,'mouseup', 'mouseupoutside', 'touchend','touchendoutside','mousemove', 'touchmove']).forEach( function(eventType){ base.removeAllListeners( eventType ) })

          base.removeAllListeners()

        } // moneyMoneyMoney hack 


        base.removeChildren()
        // összeakad az ace-vel? + igen!
        let tareas = document.querySelectorAll('._inputbox_'); for (i = 0; i < tareas.length; i++) { tareas[i].remove() }
        currentSCENE = u
      }

      var element = PIXI.Sprite.fromImage(u.img)
      u.pixi = element
      element.ui = u

      if (u.pos) { align(element) }

      if (u.callTo) { element.interactive = true; element.on('mouseup', callToAction).on('touchend', callToAction) }

      base.addChild(element)
    }

    // ne legyen egyszerre .render és .box a panelben 
    if (u && u.ui == uitype.PANEL && (u.render || u.box)) {

      u.pixi = u.box ? u.box.r ? new PIXI.Graphics().beginFill(u.box.col || 0, u.box.alpha || 1).drawRoundedRect(u.box.x || 0, u.box.y || 0, u.box.w || 9, u.box.h || 9, u.box.r).endFill()

        : new PIXI.Graphics().beginFill(u.box.col || 0, u.box.alpha || 1).drawRect(u.box.x || 0, u.box.y || 0, u.box.w || 9, u.box.h || 9).endFill()

        : u.render

      u.pixi.ui = u

      if (u.pos) { align(u.pixi) }

      if (u.callTo) { u.render.interactive = true; u.pixi.on('mouseup', callToAction).on('touchend', callToAction) }

      base.addChild(u.pixi)

    }

    if (u && u.ui == uitype.HOLDER) {
      var holder = new PIXI.Container()
      holder.ui = u
      u.pixi = holder
      if (u.pos) { u.pos.ax = null; u.pos.ay = null; align(holder) }
      base.addChild(holder)
    }

    if (u && [uitype.FIELD, uitype.INPUT, uitype.BUTTON].indexOf(u.ui) >= 0 && u.text) {

      //var autobg = new PIXI.Graphics().beginFill(0,0.7).drawRect( 0,0,250, 40).endFill()	

      var style = u.style || { font: (u.pos && u.pos.fontSize ? u.pos.fontSize : '18px ') + FONT_FACE, fill: (u.pos && u.pos.fontColor ? u.pos.fontColor : 'white') }
      var autobg = style.fancy ? fancyButton() : new PIXI.Graphics().beginFill(0, 0.7).drawRoundedRect(0, 0, style.width || 250, 40, 7).endFill()
      if (u.pos && u.pos.fontColor) { style = Object.assign({}, style); style.fill = u.pos.fontColor }  // correct clone 

      switch (u.ui) {

        case uitype.BUTTON:

          var field = new PIXI.Text(u.text, style)

          field.anchor.set(0.5, 0.5)
          field.position.set(125, 29) // y: 33 - Kenyan , 20 - Qlassik - túlságosan hack jellegű 
          autobg.addChild(field)

          autobg.ui = u

          if (u.pos) { align(autobg) }
          // ide talán kellene bind - FIX 	
          if (u.ui == uitype.BUTTON && u.callTo) { autobg.interactive = true; autobg.on('mouseup', callToAction).on('touchend', callToAction) }

          u.pixi = autobg

          base.addChild(autobg)

            ; break;

        case uitype.INPUT:

          style.bg = autobg
          style.width = style.width || 400
          style.isSecret = (u.pos && u.pos.pswd) ? u.pos.pswd : style.isSecret || false
          //console.log(style)

          var field = new Editor(u.text, style)
          field.inputbox.position.y -= 6 + 7
          field.ui = u
          u.pixi = field
          if (u.pos) { align(field) }
          // base.addChild( field )

          ; break;

        case uitype.FIELD:

          if (style.sharp) {
            if (!style.isCalced) {
              style.font = (style.font.match(/(\d+)px/)[1] * style.sharp) + style.font.match(/px.+/)
              style.lineHeight *= style.sharp
              if (style.wordWrap && style.wordWrapWidth) { style.wordWrapWidth *= style.sharp }
              style.isCalced = true
            }
            //console.log( 'sharp: x'+style.sharp + " : " + style.font )
            u.pos = u.pos || {}
            u.pos.s = 1 / style.sharp
          }
          var field = new PIXI.Text(u.text, style)
          field.ui = u
          if (u.pos) { align(field) }
          u.pixi = field
          base.addChild(field)
            ; break;

      }

    }

    // before render 
    if (u.setupTo) { activateTo(u.setupTo) }

    // render subs of screens 

    if ([uitype.SCREEN, uitype.HOLDER, uitype.PANEL].indexOf(u.ui) >= 0) subs.forEach(function(subKey, i) {

      if (u.ui == uitype.SCREEN) { window.here = u.keydot }

      var sub = objByKeys(skeleton, keyDotSelected + DOT + subKey)

      if (sub && sub.ui) {

        if ([uitype.BUTTON, uitype.PANEL, uitype.FIELD, uitype.INPUT, uitype.HOLDER].indexOf(sub.ui) >= 0) { uppdate(keyDotSelected + DOT + subKey, u.pixi ? u.pixi : null) }

      }

    })

    // after render 	
    if (u && u.readyTo) { activateTo(u.readyTo) }

    function callToAction(e) { if (this && this.ui && this.ui.callTo) { activateTo(this.ui.callTo) } }

    // + TODO - jó kérdés ezt nem lehetne autómatizálni mert kicsit feleslegesnek tűnik ... ki kell szedni - FIX 
    function activateTo(label) {

      // ...  label = label() a sok feles case 'passwordReset': passwordReset() ;break; -t feleslegessé tette

      if (GZ[label] && GZ[label] instanceof Function) { return GZ[label]() }
      //if( this[label] && this[label] instanceof Function ){ return this[label]() }

      switch (label) {

        case 'autoplay': playOneGame(); break;

        //case 'mission': skeleton.interaction = [ new MissionSwiper( false , false , afs_collection.filter(SCENE).map(function(c){return c.serial}) , { w:1280, h:350 , y: 370 } )  ] ;break;

        case 'library':

          // let content = who ? who.collection.cards.map(function(c){return c.serial}) : afs_collection.cards.sort(function(a,b){return Math.random()-.5}).map(function(c){return c.serial})
          let content = afs_collection.cards.map(c => c.serial)

          skeleton.interaction = [new LibrarySwiper(false, true, content, { w: 250, h: 720, x: 1280 - 250 })]
          stage.addChild(skeleton.main.libraryPanel.library.backToMain.pixi)

            ; break;


        case 'changeAvatar':

          //skeleton.interaction = [ new AvatarSwiper( true , false , who ?  who.collection.filter(ACTOR).filter( c => c.width<2 ).filter( onlyUnique ).map(function(c){return c.gmid}) : false  ) ] 
          skeleton.interaction = [new AvatarSwiper(true, false, afs_collection.filter(ACTOR).filter(c => c.width < 2 || !c.width).filter(onlyUnique).map(function(c) { return c.gmid }))]

          stage.children[0].addChildAt(skeleton.interaction[0].sensor, 0)
          stage.children[0].addChildAt(skeleton.interaction[0].eList, 0)

            // KIHAL ! persze szebben is meg lehetne oldani a base problémát

            ; break;


        case 'cardFactoryCode':

          skeleton.interaction = [new FactorySwiper(false, false, who ? who.collection.cards.map(function(c) { return c.serial })
            : afs_collection.cards.sort(function(a, b) { return a.name > b.name ? 1 : -1 }).map(function(c) { return c.serial }).slice(-20), { w: 1280, h: 350, y: 360 })]

            ; break;

        // nagyon csúnya összekapcsolás egy ideiglenes tömb direkt számú elemére hivatkozni 

        case 'unselectImproved': if (skeleton.interaction[0] instanceof FactorySwiper) { skeleton.interaction[0].unselectImproved() }; break;
        case 'improvedDone': if (skeleton.interaction[0] instanceof FactorySwiper) { skeleton.interaction[0].improvedDone() }; break;

        case 'backToMain': backToMainButton(); break;

        case 'editorTest':

          // window.redit = new Editor( chaptersOfStory()[0].missions[0].descript )  // briefing() , storyMode()
          window.redit = new Editor('ls>>gz_edit_test<<');
          redit.positionSet(400, 40)

            // var masik = new Editor('Masik') ; masik.inputbox.position.set( 820 , 40 ) 

            ; break;

        // case 'directLogin': server.answer({order:'login',name: isDevServer ? 'valaki' : 'frederic',password:(26425).toString(32)}) ;break; // sensei 

        default: uppdate(label)

      }
    }

    function align(element) {

      var pos = element.ui.pos

      pos.x = pos.x || 0
      pos.y = pos.y || 0
      pos.ax = pos.ax || 0
      pos.ay = pos.ay || 0

      if (element.position && element.position.set) { element.position.set(pos.x, pos.y) } else if (element.positionSet) { element.positionSet(pos.x, pos.y) }

      if (element.anchor) { element.anchor.set(pos.ax, pos.ay) }

      if (element.scale) {
        if (pos.s) { element.scale.set(pos.s) } else {
          if (pos.sx) { element.scale.x = pos.sx }
          if (pos.sy) { element.scale.y = pos.sy }
        }
      }

      if (element.alpha && pos.alpha) { element.alpha = pos.alpha }

      element.visible = !pos.hidden

    }

  }

  function fancyButton() {
    let buttonbg = new PIXI.Container()
    let fancy = new PIXI.Sprite.fromImage(folder + 'buttonbg.png')
    buttonbg.addChild(fancy)
    fancy.position.set(-10, -7)
    return buttonbg
  }

  this.directLogin = function() { if (server) { server.answer({ order: 'login', name: 'valaki', password: (26425).toString(32) }) } else getLocalAccount() }
  //this.directLogin = function(){ if( server){	server.answer({order:'login',name: 'frederic',password:(26425).toString(32)})  }else getLocalAccount() }

  this.deckBuildCode = function() {

    // afs_collection.filter(SCENE).map( s=>s.width=2)	

    var deckList = afs_collection.cards.sort(function(a, b) { return a.name > b.name ? 1 : -1 }).map(function(c) { return c.serial }).slice(-30)

    var collectionList = who ? who.collection.cards.sort(function(a, b) { return a.name > b.name ? 1 : -1 }).map(function(c) { return c.serial })
      : afs_collection.cards.sort(function(a, b) { return a.name > b.name ? 1 : -1 }).map(function(c) { return c.serial }).slice(-20)

    skeleton.interaction = [

      new BuilderSwiper(false, false, deckList, { w: 1280, h: 350, y: -20 })
      ,
      new CollectionSwiper(false, false, collectionList, { w: 1280, h: 350, y: 360 })
    ]

    skeleton.interaction[0].otherDeck(skeleton.interaction[1])
    skeleton.interaction[1].otherDeck(skeleton.interaction[0])

    stage.addChild(stage.children[0].children[0])

  }


  this.deckOfPlayCode = function(co) {

    // afs_collection.filter(SCENE).map( s=>s.width=2)	

    var deckList = co.all.yers[0].deck.serials

    var collectionList = co.all.yers[1].deck.serials

    skeleton.interaction = [

      new BuilderSwiper(false, false, deckList, { w: 1280, h: 350, y: -20 })
      ,
      new CollectionSwiper(false, false, collectionList, { w: 1280, h: 350, y: 360 })
    ]

    skeleton.interaction[0].otherDeck(skeleton.interaction[1])
    skeleton.interaction[1].otherDeck(skeleton.interaction[0])

    stage.addChild(stage.children[0].children[0])

  }

  function userInterface(u) {

    autoKeydotCallTo(u, '')

    prepareInterface(u)

    console.log('userInterface ... ')
    // console.log( Object.keys(skeleton.main).join(CR) )

    uppdate('splash')

    window.afterall()

  }

  // ------------------------------------------ [ server area  ] -----------------------------

  /*

  Szépen működik a start / stop / send a konzolból 
  nohup - al pedig nem is áll le hibával .. persze majd el kellene érni azt a stabilitást ami szükséges ahhoz, 
  hogy jól működjön a rendszer.

  módosítani kellene a rendszer jelszavát - és lefuttatni néhány biztonsági kört. 

  multi player TODO :

  + mongodb test 
  + mongo skill table fill and retest 

  - library fejlesztés 

    - lapok meghatározás
    - lapok módosítása
    - a teljes lapkészlet adatainak szerveren való tárolása 	

  + létrehozni kvázi usereket akik első körben 

    + login :  server.answer({order:'login',name:'sensei',password:'ppp'})
    + registration: 	
    - ki/be léphetnek
    - üzeneteket hagyhatnak az adatbázisban

  Nos akkor ma le kellene kódolni a játékos aktivitásait, legalábbis minél többet. Úgy, hogy közben az adatok a szerver oldalon legyenek. De JSON-ben is letölthetőek legyenek, hogy offline esetben is lehessen használni.

  Sőt egy egyszerű fórum rendszer is jöhetne id. Szerencsére a HTML elemektől se kell tartani.

  Az OPTIMALIZÁCIÓ meg a library kezelésnél jöhet elő.

  Minden esetre eléggé érdekes résznél járok, hála Istennek kezd összeállni a történet.

  Nem figyel a szerver arra, hogy valaki épp bent van amikor egy másik user újra belép. Amúgy meg egy csomó statisztikát is számolni kell a programban.


  Ma a játékos viselkedését kellene valamennyire úgy kezelni, hogy a szerveren követhető legyen 


  { bakker az Uncharted-et irdatlanul látványosra csinálták meg }

  mostmár tudom menteni a szerverre is a kódot. 

  .... client actions:

    + registration
    + login - browserben is meg kell csinálnom a bejelentkezést, névbeírással , avatár választással ... utána a pakliját is meg kell kapnia a szervertől 
    + create new Account
    - 
    - get global card data ( first in code )
    - get ( fresh ) library data 
    - get collection data
    - get process data
    - get information
    - get decks data
    - deck build
    - improve card
    - select deck
    - play mission
    - play pvp
    - buy card
    - earn money (millions) / dimensionit
      money change to something when reach galaxy
    - unlock achivement
    - change avatar
    - get achivement
    - unlock achivement
    - chat
    - create team
    - join team
    - leave team
    - team play

  ... developer actions: ( same as client + )

    - work on card
    - work on story
    - work on mission line
    - work on game UI dynamic ( hehe )
    - uppload graphics
    - work with profession an attributes
    - play with bots 
    - kick client


  Alakul a történet ... mármint az adatbázis kezelés. A skillek már bent figyelnek az adatbázisban. 
  De a többit is  fel kellen tölteni + a require-t is megcsináltam, hogy modulként a szerver konzolban is elinduljon, és ott is lehessen tesztelni.

  jé már ez is működik a consolban alapból !

  Object.keys(skill).map( f => skill[f].id )

  online card game tutorial http://www.tamas.io/online-card-game-with-node-js-and-socket-io-episode-1/
  MarkLogic adatbázist használ node.js alá 


*/

  this.loginCheck = function() {

    // check in login.SCREEN

    console.log('loginCheck')

    // ezt csúnyán beleégettem a kódba. 
    server.answer({ order: 'login', name: stage.children[1].children[0].text, password: stage.children[2].children[0].pswd })
    stage.children[2].children[0].pswd = '-o,o-'

  }

  this.registrationCheck = function() {

    // check in login.SCREEN

    var inputs = stage.children

    console.log('registrationCheck')

    if (inputs[2].children[0].pswd != inputs[3].children[0].pswd) { return console.log("password isnt same !") }

    if (!inputs[4].children[0].text.match(/\S+@\S+.\S{2,4}/)) { return console.log("wrong email:" + inputs[4].children[0].text) }

    server.answer({ order: 'registration', name: inputs[1].children[0].text, password: inputs[2].children[0].pswd, email: inputs[4].children[0].text })

  }

  this.passwordReset = function() { server.answer({ order: 'passwordReset' }); console.log('passwordReset') }


  function handleMessage(msg) {

    // console.log('handleMessage: '+ msg.fun )

    const II = '`'
    const SEPARATOR = II + CR + '//--------' + CR + II

    let header = CR + '// --[ datas from server  ]--' + CR + II + CR
    let footer = II + CR + '// --'

    window.msg = msg

    switch (msg.fun) {

      case 'getAccount': getAccount(msg); break;
      case 'gathering': gatheringSomething(msg); break;

      //				
      default:
        // Forum.find({_id:'568f5ffaa92d824f77591530'},daerr)

        if (msg.data && Array.isArray(msg.data)) { editor.setValue(editor.getValue() + header + msg.data.map(record => record.msg).join(SEPARATOR) + footer) }
        else console.log('deffault:', msg)

    }

    if (msg.data && msg.data.msg) { editor.setValue(editor.getValue() + header + msg.data.msg + footer) }

  }

  function getAccount(fun) {

    // console.log( fun.acc.collection )
    // fun.acc.collection.forEach(function(ser){ console.log(KKK[ser].name) })

    // console.log('create player cliens side')

    log = fun

    window.who = new Player(fun.acc.name, false, fun.acc.avatar)

    who.cash = fun.acc.cash
    skeleton.main.cashAmount.text = CR + 'CASH: ' + who.cash
    who.dimensionit = fun.acc.dimensionit
    skeleton.main.dimensionitAmount.text = CR + 'DIMENSIONIT: ' + who.dimensionit

    // TODO :: gravitonZone FIX server side collection 
    // who.collection.fillByCode( fun.acc.collection )

    who.collection = new Deck()
    who.collection.randomFill(22, ACTOR)
    who.collection.randomFill(4, ITEM)
    who.collection.randomFill(3, SCENE)


    skeleton.main.cardAmount.text = CR + 'BOOSTERS: ' + who.collection.length()

    var hero = skeleton.main.avatarPanel
    console.log(hero)
    hero.img = null
    hero.render = makeAvatar(who.avatar, true)
    hero.render.anchor.set(.5, 0)

    //uppdate('main')
    uppto('main', { to: { x: 0 }, s1: { x: 1280 }, s2: { x: -1280 }, step: 19 })

    console.log(who)

    // server.answer({order:'getCollection'})

  }

  // localStorage -- string only 
  function getLocalAccount() {
    let acc = {
      name: 'Localone',
      dimensionit: 0,
      cash: 500,
      avatar: '007'
    }
    localStorage.setItem('gz-acc', JSON.stringify(acc))
    getAccount({ acc })
  }

  // http://stackoverflow.com/questions/1960473/unique-values-in-an-array
  // funciton for unique search 
  function onlyUnique(value, index, self) { return self.indexOf(value) === index; }

  function gatheringSomething(fun) {

    // TODO látványossabban és túl favágó még 

    if (!who) { return console.log('-- nincs Player de már gyűjt!') }

    // if( fun.cash ){ skeleton.main.cashAmount.pixi.text = skeleton.main.cashAmount.text = who.cash = fun.cash }
    if (fun.cash) { skeleton.main.cashAmount.pixi.text = who.cash = fun.cash }

    if (fun.dimensionit) { skeleton.main.dimensionitAmount.pixi.text = skeleton.main.dimensionitAmount.text = who.dimensionit = fun.dimensionit }

    if (fun.booster) {

      console.log('új lapok:' + CR, fun.booster.map(function(s) { return KKK[s].name }).join(CR))

      who.collection.fillByCode(fun.booster)

      skeleton.main.cardAmount.pixi.text = skeleton.main.cardAmount.text = who.collection.length()

    }

  }

  this.saveDeck = function() {

    console.log('save who deck to server')

    server.answer({ order: 'saveDeck', deck: who.deck.cards.map(function(c) { return c.serial }) })

  }

  /*

a nagy kerdes hogy az animaciot hogyan illesszem be  arendszerbe
valahol jelölnöm kell az éppen mozgó lapokat is.
Szerencsére ez csak kliens oldalon a fontos.
Ha a co-nak lenne egy tárolója az epp mozgo lapokról, 
akkor az sokat segitene.

milyen animok vannak játék közben?

- DRAW: lapok húzásakor a lapok betöltődnek a kézbe
- SCENE_IN: jelenet lap bemozgása
- SECENE_OUT:
- ACTOR_SELECT: lap kivállasztása és a játékba mozgása
- ITEM_SELECT: csatolt felszerelés kiválasztása
- EACTOR_IN: ellenfél lapja bejön a játékba
- MESSAGE: üzenet megjelenése
- ICON_ANIM: a megfelelő ikonok mutatják, hogy épp melyik használható
- PROFS_ANIM: képességek animációi.
- TO_DECK: lap mozgása a pakliba
- TO_LOST: lap mozgása a lostba
- CARD_SELECT:  lap kivállasztása egy listából
- SHUFFLE: pakli keveredése 
- PROFDO: profession használata 
- PROFTARGET: profession céppontjának kivállasztása
- MODAL_BOX: egyéb interactív panelek.

és akkor még az effektekről nem is beszéltünk 

elméletileg akár ezzel a telefonnal is lehetne js-t fejleszteni, hogyha ennél sokkal gyorsabb lenne a szövegszerkesztő.

ennek a tanulsága, hogy az Edit-et is optimalizálni kellene, de az egy külön történet. Viszont az elképzelt online szerkesztőnek alapvető fontosságú része.

.. off .. egy matematikus UTF8-ban tuti görög betíket használna változó neveknek.

Visszatérve az animációhoz a co-nak tudnia kelll, hogy várnia kell-e még hogy valami megérkezzen, és ahhoz képest kezdjen új fázist.

A lapotopon is elférne némi optimalizáció, mert közel se fut olyan simán mint a benti gépemen.

- Bakker majndem 4 óra és még egy hasznos sort sem írtam, és még a fogorvoshoz is el kell menjek ... mondjuk legalább rajzoltam


*/

  function prepareStacio(co, overAnimAlter) {

    // co = co || new Coroutine()	

    console.log('skeleton.game frissítése ') // de még néha beakad - viszont már kicsit kevesebszer 
    if (!window.gameSkeloClone) { window.gameSkeloClone = Object.assign({}, skeleton.game) } else { skeleton.game = Object.assign({}, window.gameSkeloClone) }


    var sgp = skeleton.game.play; folder = 'img/pieces/'
    var FONT28 = { font: FontFace(28), fill: 'white', lineHeight: 32 }

    var baseDeck = folder + 'deck3.png'

    sgp.topinfo.player.lostDeck.img = baseDeck
    sgp.topinfo.player.drawDeck.img = baseDeck
    sgp.topinfo.enemy.lostDeck.img = baseDeck
    sgp.topinfo.enemy.drawDeck.img = baseDeck
    sgp.topinfo.sceneDeck.img = baseDeck

    uppdate('game.play') // render sgp 		

    sgp.backToMain.pixi.y = -60

    co.animEndCall = overAnimAlter || animOver

    sgp.topinfo.player.avatarHolder.avatarPic.pixi.removeChildren()
    sgp.topinfo.enemy.avatarHolder.avatarPic.pixi.removeChildren()

    sgp.topinfo.player.avatarHolder.valueIndicator.pixi.width = 0
    sgp.topinfo.enemy.avatarHolder.valueIndicator.pixi.width = 0

    // ötletnek nem rossz, de a formáján még törpölni kell, ez a köd nagyon nem!
    sgp.topinfo.player.uIndicator.pixi.scale.x = 1.5
    sgp.topinfo.enemy.uIndicator.pixi.scale.x = -1.5

    sgp.topinfo.player.uIndicator.pixi.visible = sgp.topinfo.enemy.uIndicator.pixi.visible = false

    // debug turn on 
    uppdate(skeleton.game.play.floating.debug.keydot)

  }

  function stacio(co) {

    // co = co || new Coroutine()
    // console.log( 'stacio', co.info() )

    var sgp = skeleton.game.play, inl = sgp.topinfo; folder = 'img/pieces/'

    if (here != 'game.play') { return console.log('first: prepareStacio') }

    if (co.gfx == co._.endAnim) { return }

    // if( !co.situation ){ return }	

    if (!inl.player.avatarHolder.avatarPic.pixi.children.length) { inl.player.avatarHolder.avatarPic.pixi.addChild(makeAvatar(co.all.yers[0].avatar)) }
    if (!inl.enemy.avatarHolder.avatarPic.pixi.children.length) { inl.enemy.avatarHolder.avatarPic.pixi.addChild(makeAvatar(co.all.yers[1].avatar)) }

    // scene in bg
    if (co.scene) {

      sgp.scene.gmid = co.scene.gmid

      if (co.gfx == co._.scenePlayAnim) {

        let slow = 3 * GSPEED

        sgp.scene.pixi.removeChildren()

        // console.log('... scene anim in')	

        // sgp.scene.pixi.removeChildren()

        var sceneCard = skeletonCardRender(KKK[co.scene.ser])
        sceneCard.position = inl.sceneDeck.pixi.position.clone()
        sceneCard.fly = [{ from: { x: sceneCard.x, y: sceneCard.y, s: .18 }, to: SWIDTH > 1 ? { x: 400, y: 85, s: 1 } : { x: 510, y: 77, s: 1 }, step: 9 * slow / 1.2 }, { wait: 2 * slow }, { isKill: true }]

        var sceneImage = PIXI.Sprite.fromImage('img/scenes/ls{..1}.jpg'.insert(co.scene.gmid))
        sceneImage.fly = { wait: 17 * slow, from: { x: 510, y: 77, s: .18, a: 0 }, to: { x: 0, y: 0, s: 1, a: 1 }, step: 9 * slow }
        sceneImage.y = -1000
        sgp.scene.pixi.addChild(sceneImage)

        var title = skeleton.game.play.sceneText.pixi
        var shadow = skeleton.game.play.sceneShadow.pixi

        shadow.text = title.text = CR + co.scene.name // + CR + co.scene.prof.map( p => p.name ).join(' / ')
        shadow.fly = [{ wait: 27 * slow, step: 32 * slow / 2, from: { y: 103, s: .21 }, to: { y: 103, s: .41 } }, { from: { y: 4000 }, to: { y: 4000 } }]
        title.fly = [{ wait: 27 * slow, step: 32 * slow / 2, from: { y: 100, s: .2 }, to: { y: 100, s: .4 } }, { from: { y: 4000 }, to: { y: 4000 }, intOn: co }]
        //title.fly = [{wait:11,step:77,from:{x:1700,y:200,s:.7},to:{x:-700,y:200,s:.7}},{from:{y:4000},to:{y:4000}, intOn: co }]



      } else {

        if (sgp.scene.gmid != co.scene.gmid) {
          sgp.scene.pixi.removeChildren()
          sgp.scene.pixi.addChild(PIXI.Sprite.fromImage('img/scenes/ls{..1}.jpg'.insert(co.scene.gmid)))
        }

      }

      var iconline = inl.infoLine.icons.pixi

      inl.infoLine.message.pixi.visible = co.gfx != co._.changePlayer

      if (co.gfx != co._.changePlayer) {
        iconline.removeChildren()
        co.scene.prof.forEach(function(pf, i) {
          var icon = new PIXI.Sprite(window.PROT[1][pf.name])
          //icon.position.set( co.gfx == co._.changePlayer ? i*70 + 151 : i<3 ? i*70 : i*70+322 , 0 )
          icon.position.set(i < 3 ? i * 70 : i * 70 + 322, 0)
          iconline.addChild(icon)
        })
      }
      // icon line - csak az icon holderbe rakja be a megfelelő ikonokat a mozgatásukért az infoLine a felelős 

    } else { sgp.scene.pixi.removeChildren() }

    // top line data 

    inl.infoLine.pixi.visible = co.scene && (co.situation != co._.scenePlayAnim)

    inl.sceneDeck.length.pixi.text = co.sceneDeck.length()

    inl.infoLine.message.pixi.text = co.situation

    inl.player.drawDeck.length.pixi.text = co.all.yers[0].deck.length()
    inl.player.lostDeck.length.pixi.text = co.all.yers[0].rest.length()
    inl.enemy.drawDeck.length.pixi.text = co.all.yers[1].deck.length()
    inl.enemy.lostDeck.length.pixi.text = co.all.yers[1].rest.length()


    var pscore = co.all.yers[0].countScore(co.scene); pscore = pscore < 0 ? 0 : pscore
    var escore = co.all.yers[1].countScore(co.scene); escore = escore < 0 ? 0 : escore

    inl.player.avatarHolder.victoryAmount.pixi.text = co.all.yers[0].matchResult().win
    inl.player.avatarHolder.sceneValue.pixi.text = pscore //co.all.yers[0].countScore(co.scene)
    inl.enemy.avatarHolder.victoryAmount.pixi.text = co.all.yers[1].matchResult().win
    inl.enemy.avatarHolder.sceneValue.pixi.text = escore //co.all.yers[1].countScore(co.scene)

    sgp.topinfo.player.avatarHolder.valueIndicator.pixi.width = Math.max(pscore, escore) > 5 ? ~~(100 / Math.max(pscore, escore) * pscore) : pscore * 20
    sgp.topinfo.enemy.avatarHolder.valueIndicator.pixi.width = Math.max(pscore, escore) > 5 ? ~~(100 / Math.max(pscore, escore) * escore) : escore * 20
    sgp.topinfo.player.uIndicator.pixi.scale.x = Math.max(pscore, escore) > 5 ? ~~(1.5 / Math.max(pscore, escore) * pscore) : pscore * 1.5 / 5
    sgp.topinfo.enemy.uIndicator.pixi.scale.x = Math.max(pscore, escore) > 5 ? - ~~(1.5 / Math.max(pscore, escore) * escore) : - escore * 1.5 / 5

    inl.player.active.pixi.visible = co.gfx == co._.changePlayer || [co._.WinSomeone, co._.escalation].indexOf(co.situation) >= 0 ? false : (co.who == co.all.yers[0]) && inl.infoLine.pixi.visible
    inl.enemy.active.pixi.visible = co.gfx == co._.changePlayer || [co._.WinSomeone, co._.escalation].indexOf(co.situation) >= 0 ? false : (co.who == co.all.yers[1]) && inl.infoLine.pixi.visible

    // hand - TODO - dynamic 

    var hand = sgp.hand.pixi
    var ehand = sgp.enemyHand.pixi

    // static 		
    hand.removeChildren()
    //co.all.yers[0].hand.cards.forEach(function(c,i){ let cr = skeletonCardRender( c , 0 ); c.rih = cr ;cr.position.x = i*255 ; hand.addChild( cr ) })
    var handNext = 0; co.all.yers[0].hand.cards.forEach(function(c, i) { let cr = skeletonCardRender(c, 0); c.rih = cr; cr.position.x = handNext; handNext += cr.width + 5; hand.addChild(cr) })

    // ehand

    ehand.removeChildren()
    co.all.yers[1].hand.cards.forEach(function(c, i) { let cr = PIXI.Sprite.fromImage('img/pieces/enemy-hand-bottom.png'); cr.position.x = i * 255; c.rih = cr; ehand.addChild(cr) })
    // co.all.yers[1].hand.cards.forEach( function(c,i){ cr = c.rih ?  c.rih : PIXI.Sprite.fromImage('img/pieces/enemy-hand-bottom.png') ; cr.position.x = i*255 ; c.rih = cr ;ehand.addChild( cr )   })			

    // start hand draw animation 
    co.all.yers.forEach(function(pl, isEnemy) {

      // console.log(pl.name , pl.hand.length() )
      var handNext = 0
      //var handX = (1280 - ( pl.hand.cards.length ) * 255 )/ 2 
      var handX = pl.hand.cards.length ? (1280 - (pl.hand.cards.map(c => c.width).reduce((a, b) => a + b) * 250)) / 2 - (2.5 * pl.hand.cards.length - 1) : 0
      if (co.gfx == co._.drawAnim) {

        let slow = 1.5 * GSPEED

        pl.hand.cards.forEach(function(c, i) {
          //var handX = (1280 - ( pl.hand.cards.length ) * 255 )/ 2 
          var reverse = pl.hand.length() - i
          if (isEnemy) {
            var startX = 1280 + reverse * 200
            c.rih.fly = { from: { x: pl.fly.indexOf(c) >= 0 ? startX : reverse * 255 }, to: { x: reverse * 255 }, step: (19 + reverse * 7) * slow, intOn: co }
            // Reduce of empty array with no initial value
          } else {
            var startX = -1000 // reverse * -500
            //c.rih.fly = { from: { x:  pl.fly.indexOf(c)>=0 ? startX : c.rih.x - 127.5 * pl.fly.length } , to: { x: i * 255 + handX } , step: 19 + reverse *7 , intOn:co } 

            c.rih.fly = { from: { x: pl.fly.indexOf(c) >= 0 ? startX : c.rih.x - 127.5 * pl.fly.length }, to: { x: handNext + handX }, step: (19 + reverse * 7) * slow, intOn: co }
            handNext += c.rih.width + 5

          }

          // heck ! 
          // flyingCards[flyingCards.length-1].intOn = co

        })
      } else {

        //var handX = (1280 - pl.hand.cards.length * 255 )/ 2 
        //pl.hand.cards.forEach(function( c , i  ){ c.rih.x = handX + i * 255 ; c.rih.scale.set(1) })
        pl.hand.cards.forEach(function(c, i) { c.rih.x = handNext + handX; c.rih.scale.set(1); handNext += c.rih.width + 5 })

      }

    })

    // playA,B - TODO - dynamic

    var playA = sgp.inPlay.player.pixi; playA.removeChildren()
    co.all.yers[0].play.cards.forEach(function(c, i) {
      if (c.isActor) {
        let cr = skeletonCardRender(c, co.scene || true, 0, 0);
        c.rip = cr;
        playA.addChild(cr)
        if (flyingCards.indexOf(c.rih) >= 0 && co.gfx) { cr.visible = false }
      }
    })
    //playA.children.forEach(function(cr,i){ cr.position.x = i*205  })
    var crpx = 0; playA.children.forEach(function(cr) { cr.position.x = crpx * 205; crpx += KKK[cr.serial.slice(0, 4)].width })
    //playA.position.set( 20 + ( 3 - playA.children.length ) * 103 , 0 )
    playA.position.set(20 + (3 - crpx) * 103, 0)

    var playB = sgp.inPlay.enemy.pixi; playB.removeChildren()
    co.all.yers[1].play.cards.forEach(function(c, i) {
      if (c.isActor) {
        let cr = skeletonCardRender(c, co.scene || true, 0, 1); c.rip = cr; playB.addChild(cr)
        if (flyingCards.indexOf(c.rih) >= 0 && co.gfx) { cr.visible = false }
      }
    })

    //playB.children.forEach(function(cr,i){ cr.position.x = i*205  })
    var crpx = 0; playB.children.forEach(function(cr) { cr.position.x = crpx * 205; crpx += KKK[cr.serial.slice(0, 4)].width })
    //playB.position.set( 20 + ( 3 - playB.children.length ) * 103 + 640 , 0 )
    playB.position.set(20 + (3 - crpx) * 103 + 640, 0)

  }

  // TODO - W3 + escalation nem tud a döntéshozó kirakni kártyát, tehát passzal kel kezdenie. 

  function actorAnimIntoPlay(co) {

    co.gfx = co._.playAnim

    let slow = 1.5 * GSPEED

    // console.log( 'actorAnimIntoPlay' )

    flyOver()

    if (co.who.index == 0) { // player 		

      co.who.fly.forEach(function(c) {

        //console.log( co.who.play.length() )
        var inplayX = [0, 20, 222, 424][co.who.play.size(ACTOR)] - skeleton.game.play.hand.pixi.x
        if (c.rih && c.rih.parent) { c.rih.parent.addChild(c.rih) }
        c.rih.fly = { wait: c.isActor ? 0 : 9, from: { x: c.rih.x, y: c.rih.y, s: 1.3 }, to: { x: inplayX, y: c.rih.y - 300, s: 0.8 }, step: 15 * slow, intOn: co }
        //fly( c.rih , { wait: c.isActor ? 0 : 9 , from: { x:c.rih.x , y:c.rih.y , s:1.3} , to: { x: inplayX , y:c.rih.y - 300 , s:0.8 } , i:0 , step: 15 , intOn: co } )

      })

    } else { // enemy 

      // console.log( 'enemy', co.who.fly.length , co.resub[co.phase] )

      co.who.fly.forEach(function(c) {

        //console.log( co.who.play.length() )
        //log = co.who.play.size(ACTOR)
        var inplayX = [866, 900, 970, 970][co.who.play.size(ACTOR)] // skeleton.game.play.enemyHand.pixi.x + skeleton.game.play.enemyHand.pixi.width - 404
        c.rih = PIXI.Sprite.fromImage('img/pieces/card-bckg-gz-w1.png')
        c.rih.x = c.isActor ? 640 : 100
        stage.addChild(c.rih)
        var fto = { wait: c.isActor ? 0 : 9, from: { x: c.rih.x, y: - 300, s: 1.3 }, to: { x: inplayX, y: 100, s: 0.9 }, i: 0, step: 15 * slow, intOn: co, isKill: true }
        // console.log( fto )
        c.rih.fly = fto
        //fly(c.rih,fto)

      })

    }

    // console.log( flyingCards , co.info() )

  }

  function actualPlayerChange(co) {

    var inl = skeleton.game.play.topinfo.infoLine //.icons.pixi.children
    let slow = 2 * GSPEED

    co.gfx = co._.changePlayer
    co.phase = co.sub.DETERMINATE

    inl.icons.pixi.children.forEach(function(ico, i) { // icons
      ico.fly = { from: { x: i < 3 ? i * 70 : i * 70 + 322 }, to: { x: i * 70 + 151 }, after: 15 * slow, next: { from: { x: i * 70 + 151 }, to: { x: i < 3 ? i * 70 : i * 70 + 322 }, i: 0, step: 9 * slow } }
      //fly( ico , { from: { x: i<3 ? i*70 : i*70+322 } , to: { x: i*70 + 151 } , i:0 , step: 9 , after:15 , next: { from: { x: i*70 + 151 } , to: { x: i<3 ? i*70 : i*70+322 } , i:0 , step: 9  } } );		
    })

    inl.txbg.pixi.fly = { from: { x: 0 }, to: { x: -50 }, after: 15 * slow, next: { from: { x: -50 }, to: { x: 0 }, i: 0, step: 9 * slow, intOn: co } }
    //fly( inl.txbg.pixi , { from: { x: 0 } , to: { x: -50 } , i:0 , step: 9 , after:15 , next: { from: { x: -50 } , to: { x: 0 } , i:0 , step: 9 , intOn: co } } )

  }

  function outOfPlayAnimation(co) {

    let result = co.roundScore[0].who.isAI
    let slow = 3 * GSPEED

    // clear stack 
    co.stack = []

    console.log('outOfPlayAnimation result: ' + result)

    let sgp = skeleton.game.play

    let player = sgp.inPlay.player.pixi.children
    let enemy = sgp.inPlay.enemy.pixi.children
    let scene = sgp.scene.pixi
    let title = sgp.sceneText.pixi

    if (co.gfx == co._.endAnim) { // someone win 


      sgp.topinfo.infoLine.pixi.fly = { from: { a: 1 }, to: { a: 0 }, step: 12 }
      sgp.hand.pixi.fly = { to: { y: 800 }, after: 130, next: { to: { y: co.phase == co.sub.BEFORE_END ? 800 : 400 }, step: 22, intOn: co } }

      sgp.inPlay.player.pixi.fly = { to: { y: !result ? 20 : 200 }, step: 9 * slow, after: !result ? 40 : 20, next: { to: { y: !result ? -400 : 800 }, step: 9 * slow } }
      sgp.inPlay.enemy.pixi.fly = { to: { y: result ? 20 : 200 }, step: 9 * slow, after: result ? 40 : 20, next: { to: { y: result ? -400 : 800 }, step: 9 * slow } }

      // scene transform 
      let sceneCard = skeletonCardRender(co.sceneRest.last)
      sceneCard.y = 3000

      //scene.fly = [{ from:{s:1 ,x:0,y:0}, to:{ s:.37 , x:result ? 780 : 20 , y:440} ,step:9*slow } , {wait:60}, to:{x:result ? 2000 : -1000} ,step:9*slow }]
      scene.fly = [{ from: { s: 1, x: 0, y: 0 }, to: { s: .37, x: result ? 780 : 20, y: 440 }, step: 9 * slow }, { wait: 3, from: { a: 1 }, to: { a: 0 } }, { from: { y: 3000, a: 1 }, to: { y: 3000, a: 1 } }]
      sceneCard.fly = [{ wait: 30 }, { from: { y: 400, x: result ? 840 : 100 }, to: { x: result ? 840 : 100, y: 400 } }, { wait: 60 }, { to: { x: result ? 2000 : -1000 }, step: 9 * slow }] // de macera volt pezsgősen KIHAL ! 
      //sceneCard.fly = [ {from:{a:0}},{ wait:9*slow } , { from:{ y:340} , to:{ x:result ? 840 : 100 , y:340}} , {wait:60} , { to:{x:result ? 2000 : -1000} ,step:9*slow }]

      //title.text = pva.all.yers[0].matchResult().win + ' : ' + pva.all.yers[1].matchResult().win
      //title.text = pva.all.yers[0].countScore( co.scene ) + ' : ' + pva.all.yers[1].countScore( co.scene )
      title.text = CR + sgp.topinfo.player.avatarHolder.sceneValue.pixi.text + ' : ' + sgp.topinfo.enemy.avatarHolder.sceneValue.pixi.text
      title.fly = [{ wait: 11, from: { y: 100, s: .2 }, to: { y: 100, s: .7 } }, { wait: 70, from: { y: 4000 }, to: { y: 4000 } }]


    } else { // escalation 	

      scene.fly = [{ from: { s: 1, x: 0, y: 0 }, to: { s: 2, x: -640, y: -360 }, step: 6 * slow }, { to: { s: 1, x: 0, y: 0 }, from: { s: 2, x: -640, y: -360 }, step: 6 * slow }]
      title.text = CR + 'ESCALATION'
      title.fly = [{ from: { y: 200, s: .2 }, to: { y: 400, s: .4 } }, { wait: 70, from: { y: 4000 }, to: { y: 4000 } }]

      sgp.hand.pixi.fly = { to: { y: 800 }, after: 85, next: { to: { y: 400 }, step: 22, intOn: co } }

      //sgp.inPlay.player.pixi.fly = { to:{ y:100  } }
      //sgp.inPlay.enemy.pixi.fly = { to:{ y:100  } }

    }

  }

  // ------------------------------[ Interaction ]-----------------------------

  function beginActorSelectInteraction(co, playable) {

    // console.log('--- select your actor ---', playable )

    stacio(co)

    skeleton.game.play.topinfo.infoLine.message.pixi.text = "Select actor!"
    co.isInteraction = true

    let slow = 3 * GSPEED
    //const PLAY_HELP = true 

    playable.forEach(function(card) {
      card.rih.fly = { to: { y: -30 }, step: 3 * slow, wait: dice(7 * slow) }

      let score = card.score(co.scene)

      if (PLAY_HELP && score) {


        let help = new PIXI.Text(CR + score, STYLE_F28_RED)
        help.position.set(55, -40)
        card.rih.addChild(help)

      }


      card.rih.removeAllListeners()
      card.rih.interactive = true
      card.rih.buttonMode = true
      card.rih.card = card
      card.rih.on('mousedown', pickActor, co).on('touchstart', pickActor, co)  // KIHAL így kell PIXI-ben az eventet bindelne 
      //card.rih.on( 'mousedown' , pickActor.bind(co) ).on( 'touchstart' , pickActor.bind(co) )
    })

    function pickActor(e) {

      var co = this // thanks for on binding 
      var rih = e.target
      // console.log(this, rih )
      try { co.who.hand.cards.forEach(function(c) { c.rih.removeAllListeners(); c.rih.y = 0 }) } catch (err) { }
      co.isInteraction = false
      co.PLAY_SELECTED_ACTOR(co, rih.card)

    }

  }

  // - az egész viewert persze egy szép Classba kellene rendeznem 
  this.playerVsAI = function() {

    console.log('playerVsAI ----> ')

    window.pva = new Coroutine()

    // a beléptetés is nagy barkácsolás ezzel a módszerrel 

    var gamers = new Allyers()

    who.deck = new Deck()
    who.hand = new Deck()
    who.rest = new Deck()
    who.play = new Deck()
    who.deck.randomFill(22, ACTOR)
    who.deck.randomFill(4, ITEM)
    who.deck.randomFill(5, SCENE)
    who.deck.cards.forEach(function(c) { c.uniqueSetup(c.ser) })
    who.deck.cards.forEach(function(c) { var d = dice() - 2 + c.width * 2; while (d-- > 0) { c.randomImprove() } })
    who.deck.shuffle()
    who.isAI = false

    var enemy = new Player('Darkside')

    enemy.deck.randomFill(22, c => c.type == ACTOR && c.width == 1)
    enemy.deck.randomFill(4, ITEM)
    enemy.deck.randomFill(2, SCENE)
    enemy.deck.shuffle()
    enemy.deck.cards.forEach(function(c) { c.uniqueSetup(c.ser) })
    enemy.deck.cards.forEach(function(c) { var d = dice() - 1 + c.width * 2; while (d-- > 0) { c.randomImprove() } })
    enemy.isAI = true
    enemy.avatar = DB.actors.map(a => a.gmid).random() // kezdem ES6-al teleszemetelni a kódot 

    gamers.loginToMatch(who)
    gamers.loginToMatch(enemy)

    switchMatch(pva, false, gamers)

    log = ' - - game.setup - - '

    uppto('game.setup', { to: { y: 0 }, s1: { y: 720 }, s2: { y: -720 }, step: 19 })
    // uppdate('game.setup')

    var player = skeleton.game.setup.player
    var right = skeleton.game.setup.enemy

    player.face.pixi.addChild(makeAvatar(pva.all.yers[0].avatar))
    player.name.pixi.text = pva.all.yers[0].name
    player.drawDeck.length.pixi.text = pva.all.yers[0].deck.length()

    right.face.pixi.addChild(makeAvatar(pva.all.yers[1].avatar))
    right.name.pixi.text = pva.all.yers[1].name
    right.drawDeck.length.pixi.text = pva.all.yers[1].deck.length()
    skeleton.game.setup.sceneDeck.length.pixi.text = pva.sceneDeck.length()

    log = ' - end - '

  }

  function playerVsAIResult() {

    skeleton.game.play.hand.pixi.y = skeleton.game.play.skillDeploy.pixi.y = skeleton.game.play.moreOrAction.pixi.y = 2200


    uppto('game.result', { to: { y: 0 }, s1: { y: 720 }, s2: { y: -720 }, step: 19 })
    //uppdate('game.result' ) // safer ?

    var player = skeleton.game.result.player
    var right = skeleton.game.result.enemy

    player.face.pixi.addChild(makeAvatar(pva.all.yers[0].avatar))
    player.name.pixi.text = pva.all.yers[0].name
    player.drawDeck.length.pixi.text = pva.all.yers[0].deck.length()
    player.lostDeck.length.pixi.text = pva.all.yers[0].rest.length()

    right.face.pixi.addChild(makeAvatar(pva.all.yers[1].avatar))
    right.name.pixi.text = pva.all.yers[1].name
    right.drawDeck.length.pixi.text = pva.all.yers[1].deck.length()
    right.lostDeck.length.pixi.text = pva.all.yers[1].rest.length()

    skeleton.game.result.score.player.pixi.text = CR + pva.all.yers[0].matchResult().win
    skeleton.game.result.score.enemy.pixi.text = CR + pva.all.yers[1].matchResult().win

  }

  this.playerVsAIPlay = function() { // start of single player fight against enemy 

    console.log('playerVsAIPlay :: ', here)


    prepareStacio(pva)

    // pva.all.yers[0].isAI = false // nem robot 

    uppdate('game.play.floating.stepp')
    var back = skeleton.game.play.backToMain.pixi
    back.y = -60 //100
    back.parent.addChild(back)

    // itt indítom az ütemezőt, de a megfelelő helyen vagyok ??
    nextStepp()

    // KIHAL - ezzel megy, de ez csufi
    au = { stop: setInterval(nextSteppInner, 300), isRun: true }
    skeleton.game.play.floating.stepp.pixi.children[0].text = '... going '

  }

  var au

  // heck
  this.firstNextStepp = () => nextStepp()

  function nextStepp() {

    skeleton.game.play.floating.stepp.pixi.visible = false  // turn off 

    var msg = skeleton.game.play.floating.stepp.pixi.children[0]

    if (au)
      if (au.isRun) {
        msg.text = 'to run'
        clearInterval(au.stop); au.isRun = false
      } else {
        msg.text = '... stop ...'
        au = { stop: setInterval(nextSteppInner, 300), isRun: true }
      }
    else
      nextSteppInner()

  }

  function nextSteppInner() {

    if (pva.gfx) { return }

    switchMatch(pva)

    if (pva.phase == pva.sub.MATCH_END) {

      console.log("nextSteppInner stop: {..1} sec game play {..2} scene ".insert(~~((+new Date() - pva.birth) / 1000), pva.sceneRest.length()))

      if (au && au.isRun) { nextStepp() } // az ütemező leállítása 

      playerVsAIResult()

    }

    if (!pva.isInteraction) { stacio(pva) }

  }

  function moreOrAction(co) {

    //uppdate('game.play.floating.moreOrAction')	
    skeleton.game.play.moreOrAction.pixi.y = 400
    skeleton.game.play.hand.pixi.fly = { to: { y: 450 } }

  }

  this.choicePlayMore = function() {

    console.log('choicePlayMore')

    skeleton.game.play.moreOrAction.pixi.y = 1400
    skeleton.game.play.hand.pixi.fly = { to: { y: 400 }, intOn: pva }
    pva.situation = pva._.choicePlayMore
    pva.phase = pva.sub.DETERMINATE
    pva.gfx = pva._.choicePlayMore
    // switchMatch( pva )

  }

  this.choiceAction = function() {

    console.log('choiceAction')

    skeleton.game.play.moreOrAction.pixi.y = 1400
    skeleton.game.play.hand.pixi.fly = { to: { y: 400 }, intOn: pva }
    pva.situation = pva._.choiceAction
    pva.phase = pva.sub.ACTION
    pva.gfx = pva._.choiceAction
    // switchMatch( pva )

  }

  // 4 test 
  function deploySkillAnim(co) {

    var sgp = skeleton.game.play

    var last = co.stack[co.stack.length - 1]

    if (last == undefined || last.play) { return }

    last.play = true

    if (last.card.skill.hcrb == "H") { last.cast = true }
    if (last.card.skill.hcrb == "B") { return }

    sgp.skillDeploy.pixi.fly = { from: { x: 1500, y: 394 }, to: { x: 100, y: 394 } }
    sgp.hand.pixi.fly = { to: { y: 450 } }
    console.log(last)

    co.gfx = co._.skillDeploy
    sgp.skillDeploy.message.pixi.text = ((last.card.skill.hcrb == "H") ? 'cast:: ' : 'deploy:: ') + last.card.skill.descript.replace(/(^.)..(.*)/, '$2 :$1')

  }

  this.doneDeploySkill = function() {

    skeleton.game.play.skillDeploy.pixi.y = 1394
    skeleton.game.play.hand.pixi.fly = { to: { y: 400 }, intOn: pva }

  }

  function bossSkillAnim(co) {

    var sgp = skeleton.game.play

    sgp.skillDeploy.pixi.fly = { from: { x: 1500, y: 394 }, to: { x: 100, y: 394 } }
    sgp.hand.pixi.fly = { to: { y: 450 } }

    co.gfx = co._.castSkill

    sgp.skillDeploy.message.pixi.text = "cast B skill"

  }

  function doneBossSkill() {

    skeleton.game.play.skillDeploy.pixi.y = 1394
    skeleton.game.play.hand.pixi.fly = { to: { y: 400 }, intOn: pva }

  }

  // ----------------------------------------------------------------[ core animation rutin ]------------------------------------------------------------------

  // TODO túlságosan arra épül, hogy megvárja a program amíg az egyes animáció vagy interakció lejár 

  var flyingCards = [] // helyette egy láncolt lista lenne a nyerő -- ott sokkal könnyebb kivenni egy elemet 

  /*
  // + az animációknak adhatna az elején egy random id-t a progi, és akkor a hiányzó alap értékeket felrakhatná
  // + pixi.fly() formátum 
  // - easing function modification 
  // + time line complex anim 
  
    .fly = [{from: to:},{t:},{t:},{t:},{t:}]   // KIHAL 2.-ra 
  
  // - GFX to timeline 
  // - enemy card turn 3d 
  
  
    egyszerű képváltás :: 
  
    skeleton.game.play.pixi.addChild( skeleton.main.pixi )
    skeleton.main.pixi.y = -720
  
    inout = { to:{y:720}, after:15, next:{from:{y:720},to:{y:0},i:0,step:20} }
    skeleton.game.play.pixi.fly = inout
  
    KIHAL még ez is működik ::
  
    skeleton.game.play.pixi.fly = { to:{y:720}, after:15, next:{ to:{y:0},step:20} }
  
  
  // nice animation software for PIXI 
  // http://esotericsoftware.com/	
  
  TODO - idővel az egész anim rendszert átdolgozni ES6-ra
  
  */

  function cardMover() {

    var isEnd = []
    // console.log(flyingCards.length)
    // if( window.pva && window.pva.phase == 'SK7B' && flyingCards.length  ){ console.log(flyingCards[0].anim.i) }

    for (var i = 0; i < flyingCards.length; i++) {

      var c = flyingCards[i]
      // prepare 
      if (c.anim && !c.anim.rid) {
        c.anim = Object.assign({
          rid: (327680 + Math.floor(Math.random() * 720895)).toString(32).toUpperCase(),
          from: c.anim.from || { x: c.x, y: c.y },
          to: c.anim.to || { x: c.x, y: c.y },
          i: c.anim.i || 0,
          step: c.anim.step || 9
        }, c.anim)
      }
      if (c.anim && c.anim.step) {
        var ca = c.anim
        //if( ca.hasOwnProperty('after')){ ca.after--; if(!ca.after){ ca = ca.next }}
        if (ca.wait) { ca.wait--; continue }
        if (++ca.i <= ca.step) {
          c.x = ca.to.hasOwnProperty('x') ? easeLinear(ca.to.x - ca.from.x, ca.from.x, ca.i, ca.step) : c.x
          c.y = ca.to.hasOwnProperty('y') ? easeLinear(ca.to.y - ca.from.y, ca.from.y, ca.i, ca.step) : c.y
          if (ca.to.hasOwnProperty('s')) { c.scale.set(easeLinear(ca.to.s - ca.from.s, ca.from.s, ca.i, ca.step)) }
          if (ca.to.hasOwnProperty('a')) { c.alpha = easeLinear(ca.to.a - ca.from.a, ca.from.a, ca.i, ca.step) }
        } else {
          if (ca.after) { if (--ca.after) { continue } else { c.anim = ca.next; continue } }
          if (c.timeline && ++c.timeline.ii < c.timeline.length) { c.anim = c.timeline[c.timeline.ii]; continue }
          isEnd.push(i)
          if (ca.intOn && ca.intOn.animEndCall) { ca.intOn.animEndCall(c) }
        }
      }
    }

    // még gond van, hogyha egyszerre több anim áll le TODO !  
    if (isEnd.length > 0) {
      // console.log( 'licence to kill: ', isEnd[0] , flyingCards[isEnd[0]].anim.isKill  )
      try {
        var c = flyingCards[isEnd[0]]
        if (c && c.anim && c.anim.isKill) {
          c.parent.removeChild(c)
        }
        flyingCards.splice(isEnd[0], 1)
      } catch (err) { /*console.log('dont have parent',c) */ }
    }
  }

  function fly(pix, anim) { pix.anim = anim; flyingCards.push(pix) }

  function flyOver() { // minden animációt leállít - hard version 

    if (flyingCards.length) { console.log('flyOver:' + flyingCards.length) }

    flyingCards = []
  }

  // KIHAL !! ez egyből működött

  Object.defineProperties(PIXI.Container.prototype, {
    fly: { //  lehetne tween -nek nevezni 
      get: function() { return this.anim },
      set: function(anim) {
        if (Array.isArray(anim)) {
          this.timeline = anim
          this.timeline.ii = 0 // de csunya, de mukodik !
          this.anim = anim[0]
        } else {
          this.anim = anim
        }
        flyingCards.push(this)
      }
    }

    // ,removeSelf: { get: function(){  return this.parent ? this.parent.removeChild( this ) : -1  } } 
  })

  PIXI.Container.prototype.removeSelf = function() { return this.parent ? this.parent.removeChild(this) : -1 }

  /*
  
    core parts of code :: 
  
      - data >> 			skill , DB .actors .items .scenes
      - game rule >> 		Card, Deck, Player, Allyers, Coroutine, switchMatch		
      - interface >> 		skeleton , uppdate
      - interaction >> 	SwiperBase 
      - animation >> 		cardMover PIXI.Container.fly 		
      - server >> 		server
      - library >> 		PIXI
  
  */

  // ---------------------------------------------[ THREE part :: TRE is expansion for PIXI  ]--------------------------------
  /*
  
    Lehet, hogy nemsokára a PIXI kikerül, de nem feltétlenül kellene azzal vackolnom, mert ahoz túl sok mindent át kellene írnom a kódban. 
    Egyenlőre jöjjön valami alap teszt 
  
      Ez a canvas -> Texture macerásabb mint gondoltam
  
    https://www.airtightinteractive.com/2013/02/intro-to-pixel-shaders-in-three-js/
    http://japhr.blogspot.hu/2012/09/threejs-text-sprites.html
    http://gamingjs.com/ice/#
    http://stackoverflow.com/questions/23514274/three-js-2d-text-sprite-labels
    http://localhost/stemkoski.github.com/Three.js/Texture-From-Canvas.html
  
    még totál nem oké a történet ... szerencsére már látom a fényt az alagút végén.
    Az a kérdés, hogy most csináljam meg a THREE felület tesztet, vagy az adatokat próbáljam
    beépíteni az adatokba ?
  
    KIHAL + végre skierült kártyákat szövegekkel meg mindennel TRE alatt megjeleníteni 
  
      + forgatás teszt működik :D 
      + wide card test also work fine !
  
    A nagy kérdés, hogyan cseréljem le az egész megjelenítést TRE-re, úgy, hogy minél fájdalom mentesebb legyen ?
  
      + simple big image test 
      + basic kamera setup
      + change between PIXI and THREE
      + basic swiper test
      - interactive swiper test with different size cards 
        + different size cards 
        - http://threejs.org/docs/api/core/Raycaster.html
  
          Ráadásul az interakció és a animáció egyaránt szenved az időben zajló folyamatok kezelhetőségétől
          valahogy szebben kellene felépítenem. 
  
    Ha a swiper test is lefutna akkor
  
      - lista a PIXI to THREE átalakításról:
        + mobil speed test 
        + alpha png image
        + cardRender 
          + with image and icons and text  
          + wide test 
          + rotation test 
          - inPlay .. rosszúl van pozícionálva 
          - inPlay 3D model from card  
        + swipe test 
          - a swiper erejét jelző vonal lehet, hogy hasznos lenne az értelmezés szempontjából. 
          + cards attach to Mesh or Object3D 
          + 22 kártya swiper előállítása .48 sec ... sok ... talán ha ne PIXI rakná össze a képeket akkor gyorsabb lenne 
          -+ swipe interaction
            + found right card + szerencsére a Raycaster fényévekkel jobb, mint a PIXI megoldása, amivel annyi időm elment 
            + focus 
          - swipe interaction on mobil 
        + start with TRE 
        - screen coord position 				http://stackoverflow.com/questions/21786184/setting-up-a-2d-view-in-three-js
        - ui build up from skeleton to TRE 
        - pixelshader próba 
        - animation for TRE 
        - friends test with lof of image and models in 3D 
        - valami letisztult 3D pakli animáció
        - performance test alpha PlaneBufferGeometry vs card Mesh 
        - change anchor point test 
      - responsive THREE 
      - fullscreen
  
    Attach / Detach 
  
      THREE.SceneUtils.attach(cubeMesh[i], scene, parentCube); de lehet, hogy a sima .add egyszerűbb 
      group = new THREE.Object3D()
      hand = Array(5).fill( TRE.cardRender( rCard() ) ) // repeat x helyett jó az Array(x).fill is vagy a  
      felpakoltam a swiper-t 1 Object3D -re , de azt forgatni nem tudtam. 
      Mesh-el ugyanúgy működik,, lehet, hogy a befolgaló box-ot kellene hozzá csatolni üresben 		
  
    Illetve a rendszert mielőbb fel kellene töltenem Lambert és Igor munkájával , de az 2 monitoron kényelmesebb lesz. 
  
      - Zone DB 
      - library
        - Zone data 
        - content can scroll
        - content can edit online 
  
    Össze kötni a THREDITOR -t a skeleton rendszerrel, és csinálni egy 3D/2D fejlesztő rendszert - ez kicsit az ágyúval verébre esete lenne, 
    de idővel lehet rákényszerűlnék. Közben már 8000+ sornál járok 
  
    Pesszimista verzió - core kuka - anim - kuka - PIXI - kuka - interaction - kuka 
  
  
    line 199
    https://github.com/photonstorm/phaser/blob/v2.3.0/src/pixi/textures/RenderTexture.js
    itt WebGL texture a célpont a renderelésnek ... szerintem ez kellene nekem 
  
    A THREEjs teszt mindenképpen hasznos volt, de azért egy direkt PIXI WebGLRenderer -t is ki kellene próbálni mobil chrome alatt, ha menne,
    akkor nem kellene most a THREEjs -el vackolni. 
  
    Mondjuk ha ugyanezt a skeleton GUI-t THREEjs-ben is meg tudnám jeleníteni, na az durva lenne 
    akkor már a shadererk beépítése is sorra kerülhetne 
  
  
  */

  // -----------------------------------[ THREEjs part ]-------------// TODO move to different js 

  const RAD = 180 / Math.PI

  function TRE() {

    const RAD = 180 / Math.PI // use fok/RAD

    log = 'TRE extension started ... '

    this.clickFullScreen = function() {
      var canv = document.querySelector('canvas'); canv.onclick = function() { canv.webkitRequestFullscreen() }
      window.addEventListener('resize', onWindowResize, false);
    }


    this.combinePIXIandTRE = function(width, height) {

      //width = width || 1280 // window.innerWidth
      width = width || window.innerWidth
      this.SCRW = width
      //height = height || 720 // window.innerHeight
      height = height || window.innerHeight
      this.SCRH = height

      // 3D Scene canvas --------------------------------------

      var scene_3D = new THREE.Scene()
      this.scene = scene_3D
      // scene_3D.fog = new THREE.Fog( "#a1a1a1", 2000, 4000 )
      //scene_3D.fog = new THREE.Fog( "#000000", 2000, 4000 )

      var camera = new THREE.PerspectiveCamera(55, width / height, 1, 150000)
      camera.position.set(0, 0, 700)
      camera.updateProjectionMatrix()
      this.kamera = camera

      var canvas_3D = new THREE.WebGLRenderer({ antialias: true })
      canvas_3D.setSize(width, height)
      canvas_3D.setClearColor(0, 1)
      document.body.appendChild(canvas_3D.domElement)

      this.renderer3d = canvas_3D

      scene_3D.fog = new THREE.FogExp2(0x000000, 0.00001)
      var light = new THREE.AmbientLight(0x252525)
      //var light = new THREE.AmbientLight( 0x424242 )        
      scene_3D.add(light)

      // initPostprocessing()

      //this.ac = this.randomActor()
      //scene_3D.add( this.ac )	        

      // Render Animation --------------------------------------

      function animate() {
        requestAnimationFrame(animate)
        handleInteraction()
        handleAnimation()
        // canvas_UI.render( scene_UI )
        // if(cube){cube.rotation.y += 0.01}
        canvas_3D.render(scene_3D, camera)
      }

      animate()

    }

    this.good = function() {

      TRE = window.TRE
      window.RAD = 180 / Math.PI

      // pixi off 
      document.querySelectorAll('canvas')[0].style.display = 'none'
      document.body.style.overflow = 'hidden'

      TRE.combinePIXIandTRE()

      //var timg = TRE.pixi2three( new PIXI.Sprite.fromImage( skeleton.splash.img ) ); TRE.scene.add(timg)
      var timg = TRE.pixi2three(new PIXI.Sprite.fromImage(folder + 'galaxy.jpg')); TRE.scene.add(timg)

      // var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 ); directionalLight.position.set( 1, 1, 1 ).normalize(); TRE.scene.add( directionalLight );    	

      // this.timg = timg 
      // var tcard = TRE.cardRender( new Card('B9AM') ) ; TRE.scene.add(tcard) 

      //timg.position.z = -10000 ; timg.scale.set(20,20,20) 
      timg.position.z = -100000; timg.scale.set(170, 170, 170)

      // TRE.kamera.add( timg )

      TRE.kamera.position.set(0, 0, 0)


      // http://localhost/three.js/examples/#webgl_lights_hemisphere 	
      let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
      hemiLight.color.setHSL(0.6, 1, 0.6);
      hemiLight.groundColor.setHSL(0.095, 1, 0.75);
      hemiLight.position.set(0, 500, 0);
      TRE.scene.add(hemiLight);

    }

    this.forgoDoboz = function() {
      // forgó doboz teszt 
      var geometry = new THREE.BoxGeometry(500, 500, 500)
      var material = new THREE.MeshNormalMaterial()
      var cube = new THREE.Mesh(geometry, material)
      cube.position.z = -500
      cube.rotation.z = -45
      this.scene.add(cube)
    }

    this.pixi2three = function(pix, width, height, isOpaque) {

      var pt = new PIXI.RenderTexture(renderer, width || pix.width, height || pix.height)
      pt.render(pix)
      var texTRE = new THREE.Texture(pt.getCanvas())
      texTRE.needsUpdate = true
      var matTRE = new THREE.MeshBasicMaterial({ map: texTRE, side: THREE.DoubleSide })
      matTRE.transparent = !isOpaque
      matTRE.map.minFilter = THREE.LinearFilter
      var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(pt.width, pt.height), matTRE)

      return mesh
    }

    this.randomActor = function(rn) { // image direct to TRE 

      var sprite
      rn = rn || ('00' + (~~(Math.random() * 50) + 1)).slice(-2)
      // var spriteImage = THREE.ImageUtils.loadTexture( `img/actors/${rn}.png` )
      var spriteImage = THREE.ImageUtils.loadTexture(`img/actors/${rn}.png`, null, function() {

        sprite.scale.set(spriteMat.map.image.width, spriteMat.map.image.height, 1.0); // KIHAL 

      })

      var spriteMat = new THREE.SpriteMaterial({
        map: spriteImage,
        useScreenCoordinates: true,
        alignment: new THREE.Vector2(1, -1)
        // THREE.SpriteAlignment.topLeft  
      });
      spriteMat.map.minFilter = THREE.LinearFilter
      sprite = new THREE.Sprite(spriteMat)

      sprite.position.set(100, 100, 0);
      //sprite.scale.set( 800 , 900 , 1.0 );
      //sprite.scale.set( spriteMat.map.image.width , spriteMat.map.image.height , 1.0 );

      // TRE.ac.scale.set( TRE.ac.material.map.image.width , TRE.ac.material.map.image.height , 1.0 )
      return sprite
    }


    this.placeModel = function(name, holder) {
      //var model
      var loader = new THREE.JSONLoader();
      loader.load(name || '3d/ram1.json', function(geometry, materials) {

        let model = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: rgray() }))

        log = model

        model.scale.multiplyScalar(170 * Math.random())

        /*                               
              model.position.z = 500
              model.position.y = 2000 * Math.random()
              model.position.x = 1000 * Math.random() - 500
              model.rotation.y = RAD * 360 * Math.random()
              model.rotation.z = RAD * 360 * Math.random()
  
              holder.model = model 
              */

      })

      //return model 

    }

    // promise loader :: https://github.com/mrdoob/three.js/issues/4248

    /*

    this.loadModel = function( name ){

      var loader = new THREE.JSONLoader();
      var load3dModel = new Promise((resolve,reject)=>{

        loader.load( name || '3d/ram1.json', function ( geometry, materials ) {

              model = new THREE.Mesh( geometry , new THREE.MeshPhongMaterial( { color: rgray() } ) )

              log = model

              model.scale.multiplyScalar( 70 * Math.random() ) 

              resolve()

          }

      })


    }


    Persze nem annyira egyszerű a blenderból threejs-be vinni mondelleket főleg hogyha a 
    cycles-t használom és nem a blender render-t vagy a game engine-t 

    viszont szerencsére úgy néz ki, hogy a bakkel elég jó ereményt lehet elérni. 

    Viszont át kellene írni a json exportot, hogy akár az összes modelt is ki tudja menteni,
    vagy csak a megadott layereken, vagy a kiválasztottat.

    Szóval a blendernek még mindíg a sok layer/model kezelése a rákfenéje, illetve
    a duplikált modelleket, is értelmesen kellene kimentenie. 

      - rögzíthető kamera pozíciók kellenének, és közöttük tweennel mozogna a program

    - kellene 4 szép játékos modell, egyenlőre statikusak, az egyik lehetne nő 

    + http://www.manuelbastioni.com/guide_a_detailed_tutorial_about_clothes.php -  human model maker for blender 

    11 / 1024 - el elég gyorsan lefut a bake, teszt 2 111 , 2048 

    valami nagyon gyors módszer kellene kidolgozni, hogy akár egy ilyen bonyolult teret is pillanatok alatt át lehessen dolgozni lowpolyra 

    vagy ez nem az én gondom  ?? 

    legalább a módszer alapjai megvannak és már az is nagy szó. Szerintem a 

    LOTS is dead ?? hmmm.... 


    */

    function rgray() { var c = parseInt((~~(0xff * Math.random())).toString(16).repeat(3), 16); return c }

    this.bad = function() {
      var canvases = document.querySelectorAll('canvas')
      canvases[1].style.display = 'none'
      canvases[0].style.display = 'block'
    }

    this.swiper = function() {

      const PADDING = 5
      TRE = window.TRE
      var swiper = new THREE.Mesh() //Object3D()
      var nextx = 0
      for (var card of who.collection.cards) {

        let tcard = TRE.cardRender(card)
        swiper.add(tcard)
        let w = tcard.material.map.image.width
        tcard.position.x = nextx + w / 2
        nextx += w + PADDING

      }

      return swiper
    }


    /*
     http://localhost/three.js/examples/#webgl_materials_blending_custom - - ezt kell nagyon átnéznem 

    meg ez képváltás shaderrel !!
   http://localhost/three.js/examples/#webgl_postprocessing_crossfade

   illetve postprocessing vakítás:
      http://localhost/three.js/examples/#webgl_postprocessing_dof2

  ezt kerestme formak
  http://localhost/three.js/examples/canvas_geometry_shapes.html

  */

    this.cardRender = function(card, isInPlay, isInfoBox, side) { // KIHAL ez alapvetően fontos

      // KIHAL elég csúnyán, de meg van a 2 oldalas kártya model ! 

      var cardTexture = skeletonCardRender(card, isInPlay || 0, isInfoBox || 0, side || 0, true)
      var texTRE = new THREE.Texture(cardTexture.getCanvas())
      texTRE.needsUpdate = true

      card.width = card.width ? card.width : 1

      //var pix = new PIXI.Sprite.fromImage( folder + `rew-bckg-gz-w${card.width}.png` )
      var pix = new PIXI.Sprite.fromImage(folder + `card-bckg-gz-w${card.width}.png`)
      var pt = new PIXI.RenderTexture(renderer, card.width * 250, 320)
      pt.render(pix)
      var backTRE = new THREE.Texture(pt.getCanvas())
      backTRE.needsUpdate = true
      //backTRE.needsUpdate = true 
      // http://stackoverflow.com/questions/11325548/creating-a-plane-adding-a-texture-on-both-sides-and-rotating-the-object-on-its
      //var matTREbck = new THREE.MeshBasicMaterial( {map: backTRE , side:THREE.BackSide  } )
      var matTREbck = new THREE.MeshBasicMaterial({ map: backTRE, side: THREE.FrontSide })
      var matTRE = new THREE.MeshBasicMaterial({ map: texTRE, side: THREE.FrontSide })
      // var matTRE = new THREE.MeshBasicMaterial( {map: texTRE , side:THREE.DoubleSide  } )
      matTRE.transparent = true
      matTREbck.transparent = true
      matTRE.map.minFilter = THREE.LinearFilter
      matTREbck.map.minFilter = THREE.LinearFilter


      // var mesh = new THREE.Mesh(	new THREE.PlaneBufferGeometry( cardTexture.width, cardTexture.height),  new THREE.MeshFaceMaterial(materials) )
      let front = new THREE.Mesh(new THREE.PlaneBufferGeometry(cardTexture.width, cardTexture.height), matTRE)
      let back = new THREE.Mesh(new THREE.PlaneBufferGeometry(cardTexture.width, cardTexture.height), matTREbck)
      var mesh = new THREE.Mesh()
      back.rotateY(180 / RAD)
      mesh.add(front)
      mesh.add(back)
      mesh.serial = card.serial

      return mesh
    }

    /*
    this.setupInteraction = function(){
  
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      this.focus = this.scene
  
      window.addEventListener('mousedown',mousedown.bind(this),false)
      window.addEventListener('mousemove',mousemove.bind(this),false)
      window.addEventListener('mouseup',mouseup.bind(this),false)
  
      function mouseup(event){ 
        // log = 'mouseup' + this.scene.children.length 
      }
  
      function mousemove(event){ 
  
        this.mouse.x = ( event.clientX / 1280 ) * 2 - 1;
        // this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        this.mouse.y = - ( event.clientY / 720 ) * 2 + 1;	
        // this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;	
        // log = 'mousemove' + this.scene.children.length 
      }
  
      function mousedown(event){ 
        // log = 'mousedown' + this.scene.children.length 
        this.raycaster.setFromCamera( this.mouse, this.kamera )
        var intersects = this.raycaster.intersectObjects( this.focus.children )
        for( let found of intersects ){
          log = found.object.serial ? KKK[found.object.serial.slice(0,4)].name  : found.object 
        }
  
      }
  
  
  
    }
  
    */

    /*
    this.swiperInteraction = function(){
  
      var swp = this.swiper()
      this.scene.add( swp )
      swp.position.x = -1700
      this.setupInteraction()
      this.focus = swp 
  
    }
    */

    function handleInteraction() { }

    function handleAnimation() { }


    /*	Ambient Occlusion beépítés 
  
      http://threejs.org/examples/webgl_postprocessing_ssao.html
  
      Brutal physical based rendering :) 
      http://alteredqualia.com/xg/examples/deferred_skin.html
  
  
      elképesztő 
      http://alteredqualia.com/xg/examples/emily.html
  
      Itt nagyon tud valamit az ember ! 
      http://alteredqualia.com/
  
      Na ez tényleg brutal 
      - http://alteredqualia.com/xg/examples/animation_physics_level.html
  
      Na meg a tökkéletes űr! 
      http://alteredqualia.com/xg/examples/deferred_particles_nebula.html
  
      spacescybox creator !! 
  
        - - http://alexcpeterson.com/spacescape/
  
      tömörített 3D formátum  - http://openctm.sourceforge.net/  - OpenCTM 
  
      most elég nekem egy sima AO 
  
      itt meg van egy oceán és sky shader ... vízalámerüléssel .. brutál durva 
      http://devlog-martinsh.blogspot.hu/
  
  
      Itt is vannak fény ködök a térben akár ez is jó lehet lámpáknak . 
      http://localhost/three.js/examples/#webgl_particles_shapes		
      illetve sima ocean shader :  http://localhost/three.js/examples/#webgl_shaders_ocean
  
      ez se 2 perc belerakni a shadereket, előbb valami szép modellt kellene összehozni. 
  
      Végülis unity-ből szereztem textúrákat.  :)  - ami már máshonnan is megvolt, meg az alap gyártási teszt is sikeres 
  
      - jöhet a doboz tervezés 	
  
  
      -------------------- BABYLONjs ------------------------
  
      Nagyon meggyőző babylonjs demo 
      http://www.babylonjs.com/Demos/instances2/
  
      illetve egy tökkéletes felhő anim :: http://www.babylonjs.com/Demos/VertexData/
  
      bakker még fur material is van benne 
  
      bolygó generátor :: 
      http://www.babylonjs.com/Demos/planet/
  
      Doksija is van axért :: http://doc.babylonjs.com/whats-new
  
      Blender can now bake Procedural textures & Cycles materials. Plus more. !! HMMM! 			
  
      https://github.com/BabylonJS/Babylon.js/tree/master/Exporters/Blender
  
      http://doc.babylonjs.com/generals/A_Babylon.js_Primer#babylonjs-webgl-game-creation-system
  
      Logaritmikus Z buffer 
        - http://www.gamasutra.com/blogs/BranoKemen/20090812/85207/Logarithmic_Depth_Buffer.php
  
      Van playground!  http://www.babylonjs-playground.com/?25
  
        KIHAL ráadásul inteligens BABYLON kódkiegészítéssel! 
  
      web.config - elég a MIME típus beállítására 
  
  
      Már működik
      http://localhost/babylonsamples/sandbox/
  
      PBR ::
  
      http://doc.babylonjs.com/extensions/Physically_Based_Rendering
  
        - gondolom azért meg kellene dolgozni vele. 
  
      -------------------- Quixel ------------------------
  
      itt találtam:
  
        https://code.blender.org/2015/11/the-2-8-project-for-developers/
  
      http://quixel.se/
  
        Valami űber brutál amit tud. Menyivel durvább mint amit a blender tud!
  
        és csak 139 dollár az nem is sok 
  
      KIHAL ez a program zseniális ! 
  
      itt is írnak érdekeseket :: http://www.gamefromscratch.com/archive.aspx
  
  
  
      THREEjs physical based renderer >> http://amine.dai.free.fr/three.js/pbr.html
  
  
      PBR medival armor model 
      https://clara.io/view/193070f2-e8af-4afc-a531-9d82338b5288/webgl
  
  
      http://cabbi.bo/DRAGONFISH/
      http://cabbi.bo/huldra/
  
      http://doc.babylonjs.com/extensions/Physically_Based_Rendering
  
  
      Nagy űrhajó tervezése :: 
      http://www.conceptart.org/forums/showthread.php/234083-Making-of-Dreadnought
  
  
    */

    this.initPostprocessing = function() {

      var depthMaterial, effectComposer, depthRenderTarget;
      var ssaoPass;
      var group;
      var depthScale = 1.0;
      var postprocessing = { enabled: true, renderMode: 0 }; // renderMode: 0('framebuffer'), 1('onlyAO')


      // Setup render pass
      var renderPass = new THREE.RenderPass(TRE.scene, TRE.camera);
      let camera = TRE.camera

      // Setup depth pass
      var depthShader = THREE.ShaderLib["depthRGBA"];
      var depthUniforms = THREE.UniformsUtils.clone(depthShader.uniforms);

      depthMaterial = new THREE.ShaderMaterial({
        fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader,
        uniforms: depthUniforms, blending: THREE.NoBlending
      });

      var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
      depthRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, pars);

      // Setup SSAO pass
      ssaoPass = new THREE.ShaderPass(THREE.SSAOShader);
      ssaoPass.renderToScreen = true;
      //ssaoPass.uniforms[ "tDiffuse" ].value will be set by ShaderPass
      ssaoPass.uniforms["tDepth"].value = depthRenderTarget;
      ssaoPass.uniforms['size'].value.set(window.innerWidth, window.innerHeight);
      ssaoPass.uniforms['cameraNear'].value = camera.near;
      ssaoPass.uniforms['cameraFar'].value = camera.far;
      ssaoPass.uniforms['onlyAO'].value = (postprocessing.renderMode == 1);
      ssaoPass.uniforms['aoClamp'].value = 0.3;
      ssaoPass.uniforms['lumInfluence'].value = 0.5;

      // Add pass to effect composer
      effectComposer = new THREE.EffectComposer(renderer);
      effectComposer.addPass(renderPass);
      effectComposer.addPass(ssaoPass);
    }



  } // TRE end 

  window.TRE = new TRE()
  this.TREstart = function() { this.directLogin(); window.TRE.good() }

  // THREE JS SWIPER 

  //class ThreeDeeMatrix extends Swiper {
  class ThreeSwiper {

    constructor() {

      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      this.origo = new THREE.Vector2();
      this.final = new THREE.Vector2(1, 1);
      this.focus = this.scene
      this.sensorOn()

    }

    sensorOn() {

      window.addEventListener('mousedown', this.moveStart.bind(this), false)
      window.addEventListener('mousemove', this.moving.bind(this), false)
      window.addEventListener('mouseup', this.moveStop.bind(this), false)

      this.isDown = false

    }

    sensorOff() {
      window.removeEventListener('mousedown', this.moveStart.bind(this))
      window.removeEventListener('mousemove', this.moving.bind(this))
      window.removeEventListener('mouseup', this.moveStop.bind(this))
    }

    moveStart(e) {

      this.setMouse(e)
      //log = this.mouse 
      this.isDown = true
      this.final = this.origo = this.mouse.clone()
      requestAnimationFrame(this.swiping.bind(this))

    }

    moveStop() { this.isDown = false }

    moving(e) {

      this.setMouse(e)

      if (this.isDown) {

        this.final = this.mouse.clone()
        // log = this.distance 
      }
    }

    swiping() {

      if (this.isDown) requestAnimationFrame(this.swiping.bind(this))
    }

    setMouse(e) {
      this.mouse.x = (e.clientX / 1280) * 2 - 1
      this.mouse.y = -(e.clientY / 720) * 2 + 1

    }

    get distance() { return Math.sqrt((this.origo.x - this.final.x) * (this.origo.x - this.final.x) + (this.origo.y - this.final.y) * (this.origo.y - this.final.y)) }

    get tilt() { return (this.origo.x - this.final.x) / (this.origo.y - this.final.y) }

  }

  class MatrixSwiper extends ThreeSwiper {

    constructor(TRE) {

      super()

      this.TRE = TRE
      // this.focus = this.TRE.scene
      this.SCRW = TRE.SCRW
      this.SCRH = TRE.SCRH

      this.focus = false
      // this.background = this.TRE.scene.children[0]
      // this.backgroundVector = new THREE.Vector3()
      // this.backgroundVector. subVectors( this.background.position , this.TRE.kamera.position  )
      this.area = this.areaConsol()

    }

    setMouse(e) {
      this.mouse.x = (e.clientX / this.SCRW) * 2 - 1
      this.mouse.y = -(e.clientY / this.SCRH) * 2 + 1
    }

    swiping() {

      if (this.isDown) {

        let distX = (this.origo.x - this.final.x)
        let distY = (this.origo.y - this.final.y)

        if (this.focus) {

          if (this.isFocusRotating) {
            this.focus.rotateY(distX * -.02)

          } else if (this.isFocusZooming) {

            //this.focus.position.z -= distY  * -25
            this.focus.translateZ(distY * 25)

          } else {
            //this.focus.position.x -= distX  * +42
            this.focus.translateX(distX * - 42)
            //this.focus.position.y -= distY  * +42 
            this.focus.translateY(distY * - 42)
          }

        } else {

          let direction = TRE.kamera.getWorldDirection()

          if (this.isFocusRotating) {
            this.TRE.kamera.rotateY(distX * -.05)
          } else if (this.isFocusZooming) {
            this.TRE.kamera.translateZ(distY * 25)
            //this.TRE.kamera.translateOneAxis( direction , distY  * 25 )

            //this.TRE.kamera.position.z -= distY  * -25			
            // this.background.position.z -= distY  * -25

          } else {
            this.TRE.kamera.translateX(distX * 25)
            this.TRE.kamera.translateY(distY * 25)

            //this.TRE.kamera.position.x -= distX  * -25
            //this.TRE.kamera.position.y -= distY  * -25 

          }
        }

        super.swiping()

      }

      /*
  
      Kamera moving, and place object direct to camera point 
  
      http://stackoverflow.com/questions/14813902/three-js-get-the-direction-in-which-the-camera-is-looking
  
        vector = camera.getWorldDirection();
  
        var vector = new THREE.Vector3( 0, 0, -1 );
        vector.applyQuaternion( camera.quaternion );
  
      https://github.com/mrdoob/three.js/issues/1689
  
        var position = new THREE.Vector3(0,0*CNspacing+350,600);
        var target = new THREE.Vector3(0,0*CNspacing,0);
        function tweenCamera(position, target){
        new TWEEN.Tween( camera.position ).to( {
                x: position.x,
                y: position.y,
                z: position.z}, 600 )
            .easing( TWEEN.Easing.Sinusoidal.EaseInOut).start();
        new TWEEN.Tween( controls.target ).to( {
                x: target.x,
                y: target.y,
                z: target.z}, 600 )
            .easing( TWEEN.Easing.Sinusoidal.EaseInOut).start();
        }
  
  
  
      */

    }

    moveStart(e) {

      // log = e.button	
      if (e.button == 2) { e.stopPropagation() }

      if (e.target.tagName && e.target.tagName == 'TEXTAREA') return;
      this.focus = e.altKey ? this.found() : false
      this.isFocusRotating = e.shiftKey
      this.isFocusZooming = e.ctrlKey
      this.isAltOnStart = e.altKey
      // if( e.altKey ) this.focus = false
      // log = this.focus.serial ? KKK[this.focus.serial.slice(0,4)].name : this.focus ;

      super.moveStart(e)

    }

    moveStop() {

      super.moveStop()
      //let items = this.found()

      if (this.isAltOnStart && this.distance < 0.01) this.placeCard()

    }

    placeCard() {

      this.focus = false

      var card = TRE.cardRender(afs_collection.randomPick(), 0, 0, 0, 1)
      // card.position.set( this.mouse.x * this.SCRW + TRE.kamera.position.x , this.mouse.y * this.SCRH + TRE.kamera.position.y  , Math.random()*1000-900 )
      card.position.addVectors(TRE.kamera.position, new THREE.Vector3(this.mouse.x * this.SCRW, this.mouse.y * this.SCRH, 0))
      card.translateZ(-800 - Math.random() * 1500)

      TRE.scene.add(card)
      // card.rotateY( -this.mouse.x/RAD*42 )

    }

    // blender pose sculpting 
    // http://aligorith.blogspot.hu/

    /*
  
      ha sikerülne egy jól használható scene builder-t építeni, akkor az sokat segítene az űrhajó létrehozásán.
      A spider editor jó kiindulási alap lehetne, és kellene hozzá még egy a fő view-re rárakható modell libraryra,
      amiket azután szépen el lehetne helyezni a térben. 
  
    */

    add3Dmodel(search) {

      // ide jön valami alap model - prakitkusan egy kocka - textúrázva . . 

      let found = search.match(/dae\s*(.*)/)
      if (found) {
        this.coloader(`3d/${found[1]}.dae`)
      }

    }

    found() {

      this.raycaster.setFromCamera(this.mouse, this.TRE.kamera)
      var intersects = this.raycaster.intersectObjects(this.TRE.scene.children, true) // , true ha a 3d objektumokat is meg akarom fogni 
      //log = intersects
      let found = intersects.filter(e => e.object != this.TRE.scene.children[0])
      return found.length && found[0].object.parent.serial ? found[0].object.parent : false

      // for( let found of intersects ){	if(found.object != this.TRE.scene.children[0] ) log = found.object.serial ? KKK[found.object.serial.slice(0,4)].name : found.object ; }

    }

    areaConsol() {

      let area = document.createElement('textarea')
      area.className = 'overArea'
      area.setAttribute('spellcheck', 'false')
      document.body.appendChild(area)
      // area.on('mousedown',(e)=>{ e.preventDefault() })

      area.addEventListener('keydown', e => e.keyCode == 13 ? e.preventDefault() + this.searchFilter(this.area.value) : 0)
      return area

    }

    searchFilter(search) {

      log = search

      if (search == 'room') { this.coloader('3d/virtualParty9high.dae') }
      // if(search == 'obj'){ this.objloader() }
      if (search == 'exit') { TRE.bad() }
      if (search == 'play') { this.placeCardsToDesk() }
      // if(search == 'add'){ this.add3Dmodel() }
      if (search.match(/dae\s*.*/)) { this.add3Dmodel(search) }

      //if(search == 'w1'){ this.w1() }


    }

    /*
    w1(){
  
          var loader = new THREE.JSONLoader()
        loader.load( '3d/w1.json', function ( geometry, materials ) {
  
          let cardMesh = new THREE.Mesh( geometry , new THREE.MeshPhongMaterial( { color: '#dedede' } )  )
              //TRE.scene.add( cardMesh )      
              log = cardMesh 
              window.cardMesh = cardMesh
          })
  
    }
    */

    /// https://speakerdeck.com/yomotsu/web-graphics-of-the-present-time-and-the-near-future


    // http://www.babylonjs.com/cyos/acpr/  
    // csinalj shadert az assasin creed kalózhajójához. ... szép a model  - - és itt vannak az alap shaderek :: phong, freshnel ... stb 
    // benyaltam első körben a babylon scene loader-t pedig egészen ígéretes volt. vissz a THREEjs-hez 

    /*
      room = dae.getObjectByName('roomBase')
  
      room.children[0].material = new THREE.MeshPhongMaterial( { color: '#dedede' }  )
  
    */


    coloader(name) {

      var loader = new THREE.ColladaLoader();

      // loader.options.convertUpAxis = true;

      //loader.load( name || '3d/virtualParty8babylon.dae', function ( collada  ) {
      loader.load(name || '3d/virtualParty8high.dae', function(collada) {

        var dae = collada.scene;

        var skin = collada.skins[0];

        dae.position.set(0, 0, 0);//x,z,y- if you think in blender dimensions ;)

        dae.scale.multiplyScalar(50)
        dae.rotateX(-90 / RAD) // nem szerencsés ! 

        window.dae = dae

        TRE.scene.add(dae);

      })


    }

    /*
  
      Most jön a poénos rész ahol a lapokat szépen elhelyezem a térbe,
      persze ide elég lenne gyengébb modelleket használni. 
  
      Illetve kellene egy drag card to surface módot csinálni, úgy gyorsan lehetne
      rögzíteni a kordinátákat. 
  
      jobb, hogyha a screenen állítgatom be 
  
    */

    placeCardsToDesk() {

      let dae = window.dae
      if (!dae) return log = 'load room first!'

      let hand = { x: -239.90710628841492, y: 270.2757916241069, z: 73.25056268785534 }

      // let c2 = dae.getObjectByName('card2')
      let downscale = .1
      let ww = 0
      for (var i = 0; i < 5; i++) {
        let card = TRE.cardRender(afs_collection.randomPick(), 0, 0, 0, 1)
        card.scale.multiplyScalar(downscale)
        card.position.set(hand.x + ww, hand.y, hand.z)
        //let width = KKK[card.serial.slice(0,3)].width
        ww += 255 * downscale
        TRE.scene.add(card)
      }


    }


  }

  /*
  
    új kamera mozgás:  swipe irányba forog és megy előre , vagy hátra , shiftel pedig nem megy csak irányba néz !
  
    vagy a klasszikus amerre overel a kurzor arra néz, ha megnyomom a mouse-t akkor bal: előre , jobb hátra.  
  
  
  
  */

  class RoomPlay extends MatrixSwiper {

    moveStart(e) {

      if (e.target.tagName && e.target.tagName == 'TEXTAREA') return;
      this.isAltOnStart = e.altKey
      this.focus = this.found()
      this.isFocusRotating = e.shiftKey
      this.isFocusZooming = e.ctrlKey || e.button == 2
      // if( e.altKey ) this.focus = false

      this.setMouse(e)
      this.isDown = true
      this.final = this.origo = this.mouse.clone()
      requestAnimationFrame(this.swiping.bind(this))

    }

    /*
    moveStop(){
  
      this.isDown = false
      if( this.distance < 0.01 ) this.placeCard()
  
    }
    */

    swiping() {

      if (this.isDown) {

        let distX = (this.origo.x - this.final.x)
        let distY = (this.origo.y - this.final.y)

        if (this.focus) {

          if (this.isFocusRotating) {
            this.focus.rotateY(distX * -.02)
          } else if (this.isFocusZooming) {
            this.focus.translateZ(distY * 25)
          } else {
            this.focus.translateX(distX * - 42)
            this.focus.translateY(distY * - 42)
          }

        } else {

          //let direction = new THREE.Vector3( distX * -42  , 0 , distY * 42 ) ; TRE.kamera.position.addVectors( TRE.kamera.position , direction )

          if (this.isFocusRotating) {

          } else if (this.isFocusZooming) {
            this.TRE.kamera.translateX(distX * -25)
            this.TRE.kamera.translateY(distY * -25)
          } else {
            this.TRE.kamera.rotateY(distX * .05)
            this.TRE.kamera.translateZ(distY * 25)
          }

        }

        // this.background.position.addVectors( this.backgroundVector , this.TRE.kamera.position  )
        requestAnimationFrame(this.swiping.bind(this))

      }
    }

    // object.translateOnAxis(object.worldToLocal(new THREE.Vector3(0,0,25)),50)

  }

  /*
  
  gzTREm1 =  TRE.scene.children.map( e=> e.serial ? { serial:e.serial, position:e.position } : false )
  localStorage.setItem( 'gz-tre-m1' , JSON.stringify( gzTREm1 ) )
  
  78868350
  */
  this.matrixArea = function() {

    let TRE = window.TRE
    TRE.good()
    TRE.kamera.translateY(343)
    TRE.kamera.translateZ(1500)
    TRE.kamera.translateX(-500)

    var iact = new RoomPlay(TRE)
    // iact.area.value = 'Somthing arraived in our scenners!'

    window.ms = iact

  }

  // .3 - 1.5 perc 

  // ---------------------------------------------[ exports ]--------------------------------

  // export 4 debug 

  window.skeleton = skeleton
  window.KKK = KKK
  window.skeletonCardRender = skeletonCardRender
  window.DB = DB
  window.uppdate = uppdate
  window.rCard = () => new Card(afs_collection.cards.random())
  window.pa = pa
  window.UID = UID
  window.prepareStacio = prepareStacio
  window.stacio = stacio

  // DB.actors.filter( a => ~a.name.indexOf('Indián') )[0].serial
  window.afterall = function() { log = afterall } // miután bejött a splash screen 

  window.rendere = renderer

  return console.log('gravitonZone still started in strict mode')
}

// ---------------------------------------------[ onload ]--------------------------------

window.onload = function strickModeStart() {

  PIXI.utils._saidHello = true // don't need pink line 
  window.zone = new GravitonZoneCCG(window, document)
  // console.log('zone ::', zone)
  zone.initZone()

  log = `Forum.find({},daerr).sort({wroteDate:-1}).limit(20)`
  //window.afterall=function(){ zone.directLogin(); TRE.good() }
}


