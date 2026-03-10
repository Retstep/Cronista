'use strict';

/* ═══ NARRADOR ═══ */
const NARR={
  buy:["O ouro muda de mãos. O destino, quem sabe.","Transações honestas são raras nessas terras."],
  win_combat:["Mais um obstáculo removido do seu caminho.","A vitória tem um sabor amargo quando se sabe o que vem a seguir.","Eles caíram. Você permanece. Por ora."],
  lose_hp:["O sangue é um lembrete de que você ainda vive.","A dor ensina o que os livros não conseguem.","Sinta. Aprenda. Sobreviva."],
  crit:["A sorte beija os ousados — desta vez.","Um golpe assim entra para as lendas. Suas ou de outrem."],
  greed:["A ganância será sua ruína.","Quem tudo quer, tudo arrisca.","Olhos maiores que a bolsa, como sempre."],
  help:["Uma boa ação no reino das sombras. Improvável. Necessário.","Há esperança ainda neste coração."],
  abandon:["Cada escolha revela um pouco mais de quem você é.","Às vezes sobreviver exige deixar para trás."],
  boss:["Este não é um inimigo comum. Sinta o peso do momento.","Aqui termina para muitos. Que não seja para você."],
  death:["E assim se encerra mais um capítulo do Cronista.","Os livros registrarão sua tentativa. Apenas a tentativa."],
  levelup:["Cada cicatriz é um ensinamento absorvido.","Você cresce. O mundo ao redor também."],
  subclass:["Uma nova identidade. Carregue-a com responsabilidade.","O caminho se bifurca. Você escolheu o seu."],
  curse:["Nem todo brilho é ouro. Nem todo tesouro é presente.","Maldito seja o dia em que a cobiça falou mais alto."],
  item_rare:["Raro não significa seguro. Mas ajuda.","Poucos foram agraciados com tal achado."],
  elite:["Brilha diferente. Mata diferente. Cuidado.","Um guerreiro comum... com algo a mais. Muito a mais."],
};
const narr=key=>{const a=NARR[key]||NARR.win_combat;return a[Math.floor(Math.random()*a.length)];};

/* ═══ CLASSES ═══ */
const CLASSES=[
  {id:'warrior',name:'Guerreiro',ico:'⚔️',flavor:'Força bruta e resiliência inabalável.',
   hp:115,mp:30,atk:14,def:8,mag:2,spd:5,crit:.1,dodge:.05,lifesteal:0,bars:{atk:88,def:60,mag:10},
   skill:{name:'Golpe Brutal',ico:'💥',mp:10,desc:'Dano pesado + atordoar.',type:'brutal'},
   skill2:{name:'Grito de Guerra',ico:'📯',mp:8,desc:'+6 ATK por 3 turnos.',type:'warcry'},
   items:['⚔️ Espada de Ferro','🛡️ Escudo Rachado'],
   subclasses:[
     {id:'paladin',key:'pld',name:'Paladino',ico:'🛡️✨',desc:'Defensor sagrado com cura.',bonus:'DEF+5, Cura 8HP/turno',fn:G=>{G.def+=5;G.passives.push('regen_strong');}},
     {id:'berserker',key:'bsk',name:'Berserker',ico:'🔥⚔️',desc:'Fúria pura. Ataca duas vezes.',bonus:'ATK+8, Duplo ataque',fn:G=>{G.atk+=8;G.passives.push('dbl','berzerk');}},
   ]},
  {id:'mage',name:'Mago',ico:'🔮',flavor:'Destrói com o poder arcano.',
   hp:62,mp:95,atk:5,def:3,mag:17,spd:6,crit:.08,dodge:.06,lifesteal:0,bars:{atk:35,def:18,mag:95},
   skill:{name:'Bola de Fogo',ico:'🔥',mp:18,desc:'Dano mágico massivo.',type:'fireball'},
   skill2:{name:'Magia Elemental',ico:'🔮',mp:22,desc:'Usa o elemento ativo.',type:'elemental'},
   items:['📖 Tomo de Chamas','🔮 Cajado Lascado'],
   subclasses:[
     {id:'archmage',key:'arc',name:'Arquimago',ico:'⚡🔮',desc:'Domínio total sobre a magia.',bonus:'MAG+8, MP+30',fn:G=>{G.mag+=8;G.mpMax+=30;G.mp=Math.min(G.mpMax,G.mp+30);}},
     {id:'warlock',key:'shd',name:'Bruxo',ico:'🌑🔮',desc:'Troca HP por poder sombrio.',bonus:'MAG+5, Vampirismo+5%',fn:G=>{G.mag+=5;G.lifesteal+=.05;G.passives.push('vamp');}},
   ]},
  {id:'rogue',name:'Ladino',ico:'🗡️',flavor:'Golpe certeiro antes de ser visto.',
   hp:78,mp:52,atk:11,def:4,mag:5,spd:11,crit:.22,dodge:.12,lifesteal:0,bars:{atk:70,def:30,mag:30},
   skill:{name:'Ataque Furtivo',ico:'🌑',mp:12,desc:'Dano crítico garantido.',type:'sneak'},
   skill2:{name:'Veneno na Lâmina',ico:'🐍',mp:10,desc:'Envenena o inimigo por 4 turnos.',type:'poison'},
   items:['🗡️ Adagas Duplas','🧪 Poção Menor'],
   subclasses:[
     {id:'assassin',key:'shd',name:'Assassino',ico:'💀🗡️',desc:'Mata em um golpe ou morre tentando.',bonus:'CRIT+20%, ATK+6',fn:G=>{G.crit+=.20;G.atk+=6;}},
     {id:'ranger',key:'pld',name:'Arqueiro',ico:'🏹',desc:'Ataque à distância, sempre esquiva.',bonus:'VEL+4, DODGE+15%',fn:G=>{G.spd+=4;G.dodge+=.15;}},
   ]},
];

/* ═══ ENEMIES ═══ */
const ENEMIES=[
  {id:'rat',   name:'Rato Gigante',    ico:'🐀',sub:'Verme comum',     hp:18, atk:4, def:1, xp:8,  gold:[1,4],  floor:1,badges:[],               boss:false,type:'normal'},
  {id:'skel',  name:'Esqueleto',       ico:'💀',sub:'Morto-vivo',      hp:30, atk:7, def:2, xp:14, gold:[2,6],  floor:1,badges:['Morto-vivo'],    boss:false,type:'undead'},
  {id:'slime', name:'Gosma Verde',     ico:'🟢',sub:'Regenerador',     hp:24, atk:5, def:3, xp:10, gold:[1,5],  floor:1,badges:['Regeneração'],   boss:false,type:'normal'},
  {id:'bat',   name:'Morcego Vampiro', ico:'🦇',sub:'Drena mana',      hp:20, atk:6, def:1, xp:12, gold:[2,5],  floor:1,badges:['Drena MP'],      boss:false,type:'undead'},
  {id:'orc',   name:'Orc Guerreiro',   ico:'👹',sub:'Bárbaro',         hp:48, atk:12,def:5, xp:22, gold:[4,10], floor:2,badges:['Fúria'],         boss:false,type:'normal'},
  {id:'witch', name:'Bruxa',           ico:'🧙',sub:'Enfraquece inimigos',hp:36,atk:10,def:2,xp:20,gold:[5,12], floor:2,badges:['Maldição'],      boss:false,type:'magic'},
  {id:'troll', name:'Troll',           ico:'🧌',sub:'Regeneração forte',hp:60,atk:10,def:7, xp:25, gold:[3,9],  floor:2,badges:['Regeneração'],   boss:false,type:'normal'},
  {id:'bomb',  name:'Goblin Bomba',    ico:'💣',sub:'Explode ao morrer',hp:22,atk:8, def:1, xp:18, gold:[3,8],  floor:2,badges:['Explosão'],      boss:false,type:'explode'},
  {id:'vampire',name:'Vampiro Nobre',  ico:'🧛',sub:'Drena vida',      hp:72, atk:15,def:6, xp:35, gold:[8,18], floor:3,badges:['Dreno de vida'], boss:false,type:'undead'},
  {id:'golem', name:'Golem de Pedra',  ico:'🪨',sub:'Armadura pesada', hp:90, atk:13,def:13,xp:38, gold:[6,15], floor:3,badges:['Armadura'],      boss:false,type:'construct'},
  {id:'demon', name:'Demônio',         ico:'😈',sub:'Resistente',      hp:68, atk:17,def:7, xp:40, gold:[10,20],floor:3,badges:['Resistência'],   boss:false,type:'demon'},
  {id:'healer',name:'Sacerdote Negro', ico:'🧎',sub:'Cura aliados',    hp:40, atk:8, def:4, xp:30, gold:[7,14], floor:3,badges:['Cura aliados'],  boss:false,type:'magic'},
  {id:'boss1', name:'Necromante Sombrio',ico:'🦇',sub:'⚠ CHEFE — Andar 1',hp:120,atk:12,def:6, xp:90, gold:[22,38], floor:1,badges:['Chefe','Invoca mortos'],boss:true,type:'undead'},
  {id:'boss2', name:'Dragão das Cinzas', ico:'🐉',sub:'⚠ CHEFE — Andar 2',hp:220,atk:22,def:11,xp:155,gold:[45,70], floor:2,badges:['Chefe','Sopro de fogo'],boss:true,type:'demon'},
  {id:'boss3', name:'Rei Lich',          ico:'👑',sub:'⚠ CHEFE FINAL',   hp:320,atk:26,def:16,xp:260,gold:[85,130],floor:3,badges:['Chefe','Maldição','Imortal'],boss:true,type:'undead'},
  // Andares 4+
{name:'Arauto do Vazio',     ico:'👁️', floor:4,hp:90, atk:22,def:8, xp:55,gold:[18,30],badges:['Drena MP']},
{name:'Colosso de Obsidiana',ico:'🗿', floor:4,hp:130,atk:18,def:16,xp:60,gold:[20,35],badges:['Regeneração']},
{name:'Lich Menor',          ico:'💀', floor:5,hp:100,atk:25,def:10,xp:70,gold:[22,38],badges:['Maldição','Drena MP']},
{name:'Devorador de Almas',  ico:'🌑', floor:5,hp:120,atk:20,def:14,xp:75,gold:[25,40],badges:['Dreno de vida','Fúria']},
{name:'Espectro Primordial', ico:'✨', floor:6,hp:140,atk:28,def:12,xp:90,gold:[30,50],badges:['Explosão','Maldição']},
{name:'Entidade Cósmica',    ico:'🌌', floor:6,hp:160,atk:24,def:18,xp:100,gold:[35,55],badges:['Regeneração','Drena MP','Fúria']},
{name:'Senhor das Sombras',  ico:'👤', floor:4,hp:200,atk:30,def:15,xp:150,gold:[60,90], badges:['Dreno de vida','Fúria'],boss:true},
{name:'Arquilich',           ico:'💀', floor:5,hp:250,atk:35,def:18,xp:180,gold:[75,110],badges:['Maldição','Drena MP','Explosão'],boss:true},
{name:'Deus do Vazio',       ico:'🌑', floor:6,hp:300,atk:40,def:20,xp:220,gold:[90,130],badges:['Regeneração','Fúria','Dreno de vida','Explosão'],boss:true},
];


/* ═══════════════════════════════════════════════════════
   GERADOR PROCEDURAL DE INIMIGOS
═══════════════════════════════════════════════════════ */

const PROC_ARCHETYPES = [
  {name:'Goblin',      ico:'👺',type:'normal', hp:20,atk:6, def:2, badges:[]},
  {name:'Esqueleto',   ico:'💀',type:'undead', hp:22,atk:7, def:2, badges:['Morto-vivo']},
  {name:'Lobo',        ico:'🐺',type:'beast',  hp:18,atk:8, def:1, badges:[]},
  {name:'Troll',       ico:'🧌',type:'normal', hp:40,atk:9, def:6, badges:['Regeneração']},
  {name:'Demônio',     ico:'😈',type:'demon',  hp:30,atk:11,def:4, badges:['Resistência']},
  {name:'Espectro',    ico:'👻',type:'undead', hp:25,atk:9, def:2, badges:['Morto-vivo']},
  {name:'Golem',       ico:'🪨',type:'construct',hp:45,atk:8,def:10,badges:['Armadura']},
  {name:'Cultista',    ico:'🧎',type:'magic',  hp:22,atk:7, def:3, badges:['Maldição']},
  {name:'Serpente',    ico:'🐍',type:'beast',  hp:20,atk:8, def:2, badges:[]},
  {name:'Vampiro',     ico:'🧛',type:'undead', hp:28,atk:10,def:3, badges:['Dreno de vida']},
  {name:'Ogro',        ico:'👹',type:'normal', hp:50,atk:12,def:5, badges:['Fúria']},
  {name:'Bruxa',       ico:'🧙',type:'magic',  hp:24,atk:9, def:2, badges:['Maldição']},
  {name:'Aranha',      ico:'🕷️',type:'beast',  hp:16,atk:7, def:1, badges:[]},
  {name:'Múmia',       ico:'🧟',type:'undead', hp:35,atk:8, def:6, badges:['Morto-vivo']},
  {name:'Elemental',   ico:'🔥',type:'demon',  hp:30,atk:12,def:3, badges:['Resistência']},
  {name:'Lich',        ico:'🌑',type:'undead', hp:28,atk:11,def:4, badges:['Maldição','Morto-vivo']},
  {name:'Gargoyle',    ico:'🗿',type:'construct',hp:38,atk:10,def:8,badges:['Armadura']},
  {name:'Harpia',      ico:'🦅',type:'beast',  hp:22,atk:9, def:2, badges:[]},
  {name:'Nécromante',  ico:'🪄',type:'magic',  hp:26,atk:10,def:3, badges:['Invoca mortos']},
  {name:'Colosso',     ico:'⛏️',type:'construct',hp:60,atk:11,def:12,badges:['Armadura']},
];

const PROC_MODIFIERS = [
  {prefix:'Veloz',     ico:'💨',hpM:.8, atkM:1.2,defM:.9, badges:['Certeiro'],    xpM:1.1},
  {prefix:'Blindado',  ico:'🛡️',hpM:1.2,atkM:.9, defM:1.5, badges:['Armadura'],   xpM:1.2},
  {prefix:'Venenoso',  ico:'🐍',hpM:1.0,atkM:1.1,defM:1.0, badges:['Veneno'],     xpM:1.15},
  {prefix:'Flamejante',ico:'🔥',hpM:1.0,atkM:1.3,defM:.9, badges:['Queimadura'], xpM:1.2},
  {prefix:'Gélido',    ico:'❄️',hpM:1.1,atkM:1.0,defM:1.1, badges:['Gelo'],       xpM:1.1},
  {prefix:'Regenerador',ico:'🌿',hpM:1.3,atkM:.9,defM:1.0, badges:['Regeneração'],xpM:1.15},
  {prefix:'Drenador',  ico:'💙',hpM:1.0,atkM:1.1,defM:1.0, badges:['Drena MP'],   xpM:1.1},
  {prefix:'Explosivo', ico:'💣',hpM:.9, atkM:1.2,defM:.8, badges:['Explosão'],   xpM:1.2},
  {prefix:'Maldito',   ico:'☠️',hpM:1.0,atkM:1.1,defM:1.0, badges:['Maldição'],  xpM:1.1},
  {prefix:'Vampírico', ico:'🩸',hpM:1.1,atkM:1.2,defM:.9, badges:['Dreno de vida'],xpM:1.2},
  {prefix:'Colossal',  ico:'💪',hpM:1.5,atkM:1.1,defM:1.2, badges:['Fúria'],      xpM:1.3},
  {prefix:'Sombrio',   ico:'🌑',hpM:1.0,atkM:1.1,defM:1.0, badges:['Resistência'],xpM:1.1},
  {prefix:'Ancião',    ico:'⭐',hpM:1.2,atkM:1.2,defM:1.1, badges:[],             xpM:1.25},
  {prefix:'Corrompido',ico:'🌀',hpM:1.1,atkM:1.3,defM:.9, badges:['Maldição'],  xpM:1.2},
  {prefix:'Furioso',   ico:'😤',hpM:.9, atkM:1.4,defM:.8, badges:['Fúria'],      xpM:1.2},
];

const ELITE_PREFIXES = ['Campeão','Ancião','Corrompido','Lorde','Guardião','Arauto','Executioner','Tirano'];

const BOSS_NAMES = [
  ['Senhor','das Sombras'],['Devorador','de Almas'],['Arauto','do Vazio'],
  ['Tirano','Eterno'],['Arquimago','das Trevas'],['Colosso','Primordial'],
  ['Executioner','Imortal'],['Espectro','do Caos'],['Guardião','Maldito'],
  ['Lorde','da Perdição'],['Entidade','Cósmica'],['Deus','do Esquecimento'],
  ['Juiz','das Eras'],['Destruidor','de Mundos'],['Oráculo','da Morte'],
];

const BOSS_ICOS = ['👁️','🌑','💀','🐉','👑','🌌','😈','🦇','⚡','🔱','🌀','☠️','🗿','🧿','🔥'];

const BOSS_BADGES_POOL = [
  ['Chefe','Fúria'],['Chefe','Maldição'],['Chefe','Dreno de vida'],
  ['Chefe','Explosão'],['Chefe','Regeneração'],['Chefe','Drena MP'],
  ['Chefe','Imortal'],['Chefe','Invoca mortos'],['Chefe','Sopro de fogo'],
];

function floorScale(floor){
  if(floor<=3) return 1+(floor-1)*0.25;
  if(floor<=6) return 1+(3*0.25)+(floor-4)*0.30;
  return 1+(3*0.25)+(3*0.30)+(floor-7)*0.18;
}

function genEnemy(floor){
  const arch=pick(PROC_ARCHETYPES);
  const mod=pick(PROC_MODIFIERS);
  const scale=floorScale(floor);
  const ngMult=G?.ngMult||1;
  const total=scale*ngMult;

  const hp=Math.round(arch.hp*mod.hpM*total);
  const atk=Math.round(arch.atk*mod.atkM*total);
  const def=Math.round(arch.def*mod.defM*(1+(floor-1)*0.12));
  const xp=Math.round((10+floor*4)*mod.xpM);
  const gold=[Math.round((2+floor)*total),Math.round((5+floor*2)*total)];

  // Badges base do arquétipo + modificador, sem duplicatas
  const badges=[...new Set([...arch.badges,...mod.badges])];

  // Andares altos ganham badge extra
  if(floor>=5&&Math.random()<0.4) badges.push(pick(['Fúria','Resistência','Certeiro','Drena MP']));

  return {
    id:'proc_'+r(99999),
    name:`${mod.prefix} ${arch.name}`,
    ico:`${mod.ico}${arch.ico}`,
    sub:`${arch.type} · Andar ${floor}`,
    hp,atk,def,xp,gold,badges,
    boss:false,elite:false,
    type:arch.type,
    proc:true,
  };
}

function genElite(floor){
  const arch=pick(PROC_ARCHETYPES);
  const mod1=pick(PROC_MODIFIERS);
  let mod2=pick(PROC_MODIFIERS);
  while(mod2.prefix===mod1.prefix) mod2=pick(PROC_MODIFIERS);
  const prefix=pick(ELITE_PREFIXES);
  const scale=floorScale(floor)*1.5;
  const ngMult=G?.ngMult||1;
  const total=scale*ngMult;

  const hp=Math.round(arch.hp*mod1.hpM*mod2.hpM*total*1.4);
  const atk=Math.round(arch.atk*mod1.atkM*mod2.atkM*total);
  const def=Math.round(arch.def*mod1.defM*mod2.defM*(1+(floor-1)*0.12)*1.2);
  const xp=Math.round((20+floor*6)*mod1.xpM*mod2.xpM);
  const gold=[Math.round((5+floor*2)*total),Math.round((10+floor*3)*total)];
  const badges=[...new Set(['Elite',...arch.badges,...mod1.badges,...mod2.badges])];

  return {
    id:'elite_'+r(99999),
    name:`★ ${prefix} ${arch.name}`,
    ico:`⭐${arch.ico}`,
    sub:`Elite · ${mod1.prefix} & ${mod2.prefix}`,
    hp,atk,def,xp,gold,badges,
    boss:false,elite:true,
    type:arch.type,
    proc:true,
  };
}

function genBoss(floor){
  const [title,epithet]=pick(BOSS_NAMES);
  const ico=pick(BOSS_ICOS);
  const badges=pick(BOSS_BADGES_POOL);
  const scale=floorScale(floor);
  const ngMult=G?.ngMult||1;

  const hp  = Math.round(80  * Math.pow(floor,1.4) * ngMult);
  const atk = Math.round(8   * floor * scale * ngMult);
  const def = Math.round(3   * floor * (1+(floor-1)*0.1) * ngMult);
  const xp  = Math.round(60  * floor * 1.3);
  const gold= [Math.round(20*floor*ngMult), Math.round(35*floor*ngMult)];

  // Adiciona badge extra a partir do andar 5
  if(floor>=5) badges.push(pick(['Fúria','Maldição','Drena MP','Explosão']));

  // Ataque especial baseado nas badges
  const atkSpecial=badges.includes('Sopro de fogo')||badges.includes('Queimadura')?'boss2':
                   badges.includes('Maldição')||badges.includes('Imortal')?'boss3':'boss1';

  return {
    id:atkSpecial, // reutiliza ataque especial existente
    name:`${title} ${epithet}`,
    ico,
    sub:`⚠ CHEFE — Andar ${floor}`,
    hp,atk,def,xp,gold,badges,
    boss:true,elite:false,
    type:'demon',
    proc:true,
    _atkSpecialId: atkSpecial,
  };
}


/* ═══ ITEMS ═══ */
const ITEMS_POOL=[
  {id:'potion',    name:'Poção Menor',      ico:'🧪',rarity:'common', uses:1, slot:null,   desc:'Recupera HP',              fn:G=>{const h=r(15)+10;G.hp=Math.min(G.hpMax,G.hp+h);toast(`+${h} HP!`);}},
  {id:'potion2',   name:'Poção Maior',      ico:'🍶',rarity:'rare',   uses:1, slot:null,   desc:'Recupera mais HP',         fn:G=>{const h=r(25)+25;G.hp=Math.min(G.hpMax,G.hp+h);toast(`+${h} HP!`);}},
  {id:'elixir',    name:'Elixir de Mana',   ico:'💙',rarity:'common', uses:1, slot:null,   desc:'Recupera MP',              fn:G=>{const m=r(12)+8;G.mp=Math.min(G.mpMax,G.mp+m);toast(`+${m} MP!`);}},
  {id:'scroll',    name:'Pergaminho',        ico:'📜',rarity:'common', uses:1, slot:null,   desc:'Ganha XP',                 fn:G=>{const x=r(30)+20;addXP(x);toast(`+${x} XP!`);}},
  {id:'holyw',     name:'Água Benta',        ico:'✝️',rarity:'rare',   uses:1, slot:null,   desc:'Destrói mortos-vivos',     fn:(G,ctx)=>{if(ctx?.E?.type==='undead'){ctx.E.hpCur=0;toast('💀 Destruído!');updateCombatUI();}else{const h=r(20)+15;G.hp=Math.min(G.hpMax,G.hp+h);toast(`+${h} HP!`);}}},
  {id:'bomb',      name:'Bomba de Fumaça',   ico:'💣',rarity:'common', uses:1, slot:null,   desc:'Fuga garantida',           fn:(G,ctx)=>{if(ctx?.combat)ctx.flee(true);else toast('Só usável em combate.');}},
  {id:'elixir2',   name:'Élixir de Poder',   ico:'⚗️',rarity:'epic',   uses:1, slot:null,   desc:'+8 ATK por 3 salas',       fn:G=>{G.atk+=8;G.tmpBuffs.push({stat:'atk',val:8,rooms:3});toast('+8 ATK temporário!');}},
  {id:'iron_sw',   name:'Espada de Ferro',   ico:'⚔️',rarity:'common', uses:null,slot:'weapon',bonus:{atk:5},               desc:'+5 ATK'},
  {id:'fine_sw',   name:'Espada Fina',       ico:'🗡️',rarity:'rare',   uses:null,slot:'weapon',bonus:{atk:8,crit:.05},      desc:'+8 ATK +5% CRIT'},
  {id:'cursed_sw', name:'Lâmina Maldita',    ico:'🌑⚔️',rarity:'epic',  uses:null,slot:'weapon',bonus:{atk:14,def:-3},      desc:'+14 ATK -3 DEF'},
  {id:'runeblade', name:'Lâmina Rúnica',     ico:'⚡⚔️',rarity:'legendary',uses:null,slot:'weapon',bonus:{atk:18,mag:6,crit:.1},desc:'+18 ATK +6 MAG +10% CRIT'},
  {id:'staff',     name:'Cajado Arcano',     ico:'🪄',rarity:'rare',   uses:null,slot:'weapon',bonus:{mag:8},               desc:'+8 MAG'},
  {id:'staff2',    name:'Báculo Ancestral',  ico:'🔱',rarity:'epic',   uses:null,slot:'weapon',bonus:{mag:14,mp:20},        desc:'+14 MAG +20 MP'},
  {id:'daggers',   name:'Adagas Duplas',     ico:'🗡️',rarity:'common', uses:null,slot:'weapon',bonus:{atk:4,spd:2,crit:.08},desc:'+4 ATK +2 VEL +8% CRIT'},
  {id:'leather',   name:'Armadura de Couro', ico:'🥋',rarity:'common', uses:null,slot:'chest',bonus:{def:4},                desc:'+4 DEF'},
  {id:'chainmail', name:'Cota de Malha',     ico:'🛡️',rarity:'rare',   uses:null,slot:'chest',bonus:{def:7,hp:10},         desc:'+7 DEF +10 HP'},
  {id:'platemail', name:'Armadura de Placas',ico:'🏛️',rarity:'epic',   uses:null,slot:'chest',bonus:{def:12,hp:20,spd:-2}, desc:'+12 DEF +20 HP -2 VEL'},
  {id:'dragonmail',name:'Armadura do Dragão',ico:'🐉🛡️',rarity:'legendary',uses:null,slot:'chest',bonus:{def:16,hp:30,atk:5},desc:'+16 DEF +30 HP +5 ATK'},
  {id:'hood',      name:'Capuz do Ladrão',   ico:'🎭',rarity:'common', uses:null,slot:'head',bonus:{spd:2,dodge:.05},       desc:'+2 VEL +5% ESQUIVA'},
  {id:'helm',      name:'Elmo de Guerra',    ico:'⛑️',rarity:'rare',   uses:null,slot:'head',bonus:{def:5,hp:8},           desc:'+5 DEF +8 HP'},
  {id:'crown',     name:'Coroa do Arquimago',ico:'👑',rarity:'epic',   uses:null,slot:'head',bonus:{mag:10,mp:25},          desc:'+10 MAG +25 MP'},
  {id:'death_mask',name:'Máscara da Morte',  ico:'💀',rarity:'legendary',uses:null,slot:'head',bonus:{atk:8,crit:.15,hp:-15},desc:'+8 ATK +15% CRIT -15 HP'},
  {id:'boots',     name:'Botas Ágeis',       ico:'👟',rarity:'common', uses:null,slot:'feet', bonus:{spd:3},                desc:'+3 VEL'},
  {id:'amulet',    name:'Amuleto Vital',     ico:'❤️',rarity:'rare',   uses:null,slot:null,   bonus:{hpMax:20},             desc:'+20 HP MAX'},
  {id:'ring',      name:'Anel de Poder',     ico:'💍',rarity:'epic',   uses:null,slot:null,   bonus:{atk:5,mag:5},          desc:'+5 ATK +5 MAG'},
  // ═══ ITENS ESPECIAIS ═══
  {id:'treasure_map',name:'Mapa do Tesouro',    ico:'🗺️',rarity:'epic',     uses:1,slot:null,desc:'Revela baús na próxima sala de tesouro.',
    fn:G=>{G.passives.push('treasure_map');toast('🗺️ Próxima sala de tesouro revelada!');}},
  {id:'master_key',  name:'Chave Mestre',        ico:'🗝️',rarity:'rare',     uses:1,slot:null,desc:'Abre qualquer baú sem risco.',
    fn:G=>{G.passives.push('master_key');toast('🗝️ Próximo baú garantido!');}},
  {id:'memory_crystal',name:'Cristal da Memória',ico:'🔵',rarity:'legendary',uses:1,slot:null,desc:'Troca um talento já escolhido.',
    fn:G=>{if(!G.upgrades.length){toast('Nenhum talento para trocar!');return;}openTalentSwap();}},
  {id:'star_fragment', name:'Fragmento de Estrela',ico:'⭐',rarity:'legendary',uses:1,slot:null,desc:'+1 talento extra no próximo nível.',
    fn:G=>{G.bonusUpgrades=(G.bonusUpgrades||0)+1;toast('⭐ +1 talento extra no próximo nível!');}},
  {id:'orb_divination',name:'Orbe da Adivinhação',ico:'🔮',rarity:'epic',    uses:1,slot:null,desc:'Revela resultado de um evento (1 uso).',
    fn:G=>{G.passives.push('divination');toast('🔮 Próximo evento terá resultados revelados!');}},
  {id:'totem_regen',   name:'Totem da Regeneração',ico:'🪆',rarity:'epic',   uses:null,slot:null,bonus:{},desc:'Cura 10% HP máx. após cada combate.',
    fn:G=>{G.passives.push('post_combat_regen');toast('🪆 Totem equipado!');}},
  {id:'magic_compass', name:'Bússola Mágica',      ico:'🧭',rarity:'rare',   uses:1,slot:null,desc:'Escolhe o tipo da próxima sala.',
    fn:G=>{openCompassMenu();}},
  {id:'blank_grimoire',name:'Grimório em Branco',  ico:'📕',rarity:'legendary',uses:1,slot:null,desc:'Aprende a skill2 da sua classe.',
    fn:G=>{
      const sk2=G.cls.skill2;
      if(!sk2){toast('Sua classe não tem skill extra!');return;}
      if(G.skills.some(s=>s.type===sk2.type)){toast('Skill já conhecida!');return;}
      G.skills.push({...sk2});toast(`📕 ${sk2.name} aprendida!`);
    }},
  {id:'lucky_coin',    name:'Moeda da Sorte',      ico:'🪙',rarity:'uncommon',uses:1,slot:null,desc:'50% dobrar ouro atual, 50% perder 30%.',
    fn:G=>{if(Math.random()<.5){const g=G.gold;addGold(g);toast(`🪙 Sorte! +${g}💰`);}else{const l=Math.round(G.gold*.3);G.gold=Math.max(0,G.gold-l);upd();toast(`🪙 Azar! -${l}💰`);}}},
  {id:'phoenix_feather',name:'Pena da Fênix',      ico:'🪶',rarity:'legendary',uses:null,slot:null,bonus:{},desc:'Revive uma vez com 30% HP.',
    fn:G=>{G.passives.push('phoenix');toast('🪶 Pena da Fênix ativada! Você revive uma vez.');}},
  {id:'mana_crystal',  name:'Cristal de Mana',     ico:'💎',rarity:'epic',   uses:1,slot:null,desc:'Recupera 100% do MP.',
    fn:G=>{G.mp=G.mpMax;upd();toast('💎 MP totalmente restaurado!');}},
  {id:'guardian_eye',  name:'Olho do Guardião',    ico:'👁️',rarity:'epic',   uses:null,slot:null,bonus:{},desc:'Revela atributos do inimigo antes do combate.',
    fn:G=>{G.passives.push('guardian_eye');toast('👁️ Você agora vê os atributos dos inimigos!');}},
  // ═══ SETS DE ARMADURA ═══
  // Set do Caçador (Ladino)
  {id:'set_hunter_bow',  name:'Arco Longo',          ico:'🏹',rarity:'epic',  uses:null,slot:'weapon',set:'hunter',bonus:{atk:7,spd:2},          desc:'+7 ATK +2 VEL | Set Caçador'},
  {id:'set_hunter_hood', name:'Capuz do Caçador',    ico:'🎯',rarity:'epic',  uses:null,slot:'head',  set:'hunter',bonus:{dodge:.08},             desc:'+8% ESQUIVA | Set Caçador'},
  {id:'set_hunter_boots',name:'Botas do Caçador',    ico:'🥾',rarity:'epic',  uses:null,slot:'feet',  set:'hunter',bonus:{spd:3},                 desc:'+3 VEL | Set Caçador'},
  // Set do Mago Ancestral (Mago)
  {id:'set_mage_staff',  name:'Cajado Ancestral+',   ico:'🔱',rarity:'epic',  uses:null,slot:'weapon',set:'mage_anc',bonus:{mag:10},              desc:'+10 MAG | Set Mago Ancestral'},
  {id:'set_mage_robe',   name:'Túnica Arcana',       ico:'🥻',rarity:'epic',  uses:null,slot:'chest', set:'mage_anc',bonus:{mag:6,mp:10},         desc:'+6 MAG +10 MP | Set Mago Ancestral'},
  {id:'set_mage_crown',  name:'Coroa da Sabedoria',  ico:'👑',rarity:'epic',  uses:null,slot:'head',  set:'mage_anc',bonus:{mag:8,mp:20},         desc:'+8 MAG +20 MP | Set Mago Ancestral'},
  // Set do Berserker (Guerreiro)
  {id:'set_bsk_axe',     name:'Machado Duplo',       ico:'🪓',rarity:'epic',  uses:null,slot:'weapon',set:'berserker',bonus:{atk:14,spd:-3},      desc:'+14 ATK -3 VEL | Set Berserker'},
  {id:'set_bsk_armor',   name:'Armadura do Berserker',ico:'🔴',rarity:'epic', uses:null,slot:'chest', set:'berserker',bonus:{atk:5,def:-2},       desc:'+5 ATK -2 DEF | Set Berserker'},
  {id:'set_bsk_helm',    name:'Elmo do Berserker',   ico:'🪖',rarity:'epic',  uses:null,slot:'head',  set:'berserker',bonus:{atk:6,def:-2},       desc:'+6 ATK -2 DEF | Set Berserker'},
];

/* ═══ UPGRADES ═══ */
const UPGRADES=[
  {id:'vigor',    name:'Vigor',          ico:'❤️', desc:'+20 HP máximo',            tag:'def',  fn:G=>{G.hpMax+=20;G.hp=Math.min(G.hp+20,G.hpMax);}},
  {id:'focus',    name:'Foco',           ico:'🔵', desc:'+15 MP máximo',            tag:'magic',fn:G=>{G.mpMax+=15;G.mp=Math.min(G.mp+15,G.mpMax);}},
  {id:'power',    name:'Poder',          ico:'💪', desc:'+4 Ataque',                tag:'off',  fn:G=>{G.atk+=4;}},
  {id:'guard',    name:'Guarda',         ico:'🛡️',desc:'+3 Defesa',                tag:'def',  fn:G=>{G.def+=3;}},
  {id:'arcane',   name:'Arcano',         ico:'✨', desc:'+4 Magia',                 tag:'magic',fn:G=>{G.mag+=4;}},
  {id:'speed',    name:'Agilidade',      ico:'💨', desc:'+2 Velocidade',            tag:'util', fn:G=>{G.spd+=2;}},
  {id:'regen',    name:'Regeneração',    ico:'🌿', desc:'+3 HP por evento',         tag:'def',  fn:G=>{G.passives.push('regen');}},
  {id:'lucky',    name:'Sorte',          ico:'🍀', desc:'+15% crítico',             tag:'off',  fn:G=>{G.crit+=.15;}},
  {id:'mflow',    name:'Fluxo',          ico:'💎', desc:'+5 MP por evento',         tag:'magic',fn:G=>{G.passives.push('mflow');}},
  {id:'thorns',   name:'Espinhos',       ico:'🌵', desc:'Reflete 2 dano',           tag:'def',  fn:G=>{G.passives.push('thorns');}},
  {id:'loot',     name:'Saqueador',      ico:'💰', desc:'+50% moedas',              tag:'util', fn:G=>{G.passives.push('loot');}},
  {id:'vamp',     name:'Vampirismo',     ico:'🩸', desc:'Cura 5 HP/ataque',         tag:'off',  fn:G=>{G.lifesteal+=.05;}},
  {id:'dbl',      name:'Duplo Golpe',    ico:'⚔️',desc:'10% atacar 2x',            tag:'off',  fn:G=>{G.passives.push('dbl');}},
  {id:'med',      name:'Meditação',      ico:'🧘', desc:'+8 MP por vitória',        tag:'magic',fn:G=>{G.passives.push('med');}},
  {id:'fheal',    name:'Cura Plena',     ico:'💊', desc:'+25% HP ao nivelar',       tag:'util', fn:G=>{G.passives.push('fheal');}},
  {id:'berzerk',  name:'Berserk',        ico:'🔥', desc:'+ATK quando HP<30%',       tag:'off',  fn:G=>{G.passives.push('berzerk');}},
  {id:'dodge_up', name:'Evasão',         ico:'💨', desc:'+10% esquiva',             tag:'def',  fn:G=>{G.dodge+=.10;}},
  {id:'crit_dmg', name:'Golpe Fatal',    ico:'💥', desc:'Críticos causam 2.5x',     tag:'off',  fn:G=>{G.critMult=2.5;}},
  {id:'mana_burn',name:'Queima de Mana', ico:'🔵🔥',desc:'Ataques drenam 3 MP do inimigo',tag:'magic',fn:G=>{G.passives.push('manaburn');}},
  {id:'fortress', name:'Fortaleza',      ico:'🏰', desc:'+6 DEF, -1 VEL',          tag:'def',  fn:G=>{G.def+=6;G.spd=Math.max(1,G.spd-1);}},
  {id:'mpregen1', name:'Fluxo de Mana',  ico:'🔵', desc:'+2 MP/sala (acumulativo)', tag:'magic',fn:G=>{G.mpRegen+=2;toast('MP/sala: '+G.mpRegen+'🔵');}},
  {id:'mpregen2', name:'Canalização',    ico:'💠', desc:'+2 MP/sala (acumulativo)', tag:'magic',fn:G=>{G.mpRegen+=2;toast('MP/sala: '+G.mpRegen+'🔵');}},
  {id:'mpregen3', name:'Reservatório',   ico:'🌀', desc:'+2 MP/sala (acumulativo)', tag:'magic',fn:G=>{G.mpRegen+=2;toast('MP/sala: '+G.mpRegen+'🔵');}},
  {id:'mpregen4', name:'Fonte Arcana',   ico:'⚡', desc:'+4 MP/sala (acumulativo)', tag:'magic',fn:G=>{G.mpRegen+=4;toast('MP/sala: '+G.mpRegen+'🔵');}},
];

/* ═══ ELEMENTOS ═══ */
const ELEMENTS=[
  // Tier 0 — Primordiais
  {id:'tempo',     name:'Tempo',         ico:'⏳',tier:0, mult:2.5, desc:'Manipula a causalidade.'},
  {id:'vacuo',     name:'Vácuo',         ico:'🌑',tier:0, mult:2.5, desc:'Aniquila o espaço.'},
  {id:'gravidade', name:'Gravidade',     ico:'🌀',tier:0, mult:2.5, desc:'Colapsa matéria.'},
  {id:'espaco',    name:'Espaço',        ico:'🌌',tier:0, mult:2.5, desc:'Dobra a realidade.'},
  {id:'materia_escura',name:'Matéria Escura',ico:'🕳️',tier:0,mult:2.5,desc:'Dissolve a existência.'},
  {id:'caos',      name:'Caos',          ico:'🌀',tier:0, mult:2.5, desc:'Força primordial que distorce toda ordem e realidade.'},
  // Tier 1 — Energias Puras
  {id:'eter',      name:'Éter',          ico:'✨',tier:1, mult:2.1, desc:'Energia primordial.'},
  {id:'vida',      name:'Vida',          ico:'💚',tier:1, mult:2.1, desc:'Força vital que sustenta e regenera tudo.'},
  {id:'raio',      name:'Raio',          ico:'⚡',tier:1, mult:2.1, desc:'Destruição instantânea.'},
  {id:'luz',       name:'Luz',           ico:'☀️',tier:1, mult:2.1, desc:'Alta energia radiante.'},
  {id:'fogo',      name:'Fogo',          ico:'🔥',tier:1, mult:2.1, desc:'Calor extremo.'},
  {id:'magma',     name:'Magma',         ico:'🌋',tier:1, mult:2.1, desc:'Rocha incandescente.'},
  {id:'plasma',    name:'Plasma',        ico:'💫',tier:1, mult:2.1, desc:'Estado energético puro.'},
  {id:'radiacao',  name:'Radiação',      ico:'☢️',tier:1, mult:2.1, desc:'Penetra qualquer matéria.'},
  // Tier 2 — Entrópicos
  {id:'necrose',   name:'Necrose',       ico:'🦠',tier:2, mult:1.8, desc:'Corrompe a vida.'},
  {id:'morte',     name:'Morte',         ico:'💀',tier:2, mult:1.8, desc:'Fim absoluto de qualquer existência viva.'},
  {id:'veneno',    name:'Veneno',        ico:'🐍',tier:2, mult:1.8, desc:'Dissolve o organismo.'},
  {id:'acido',     name:'Ácido',         ico:'⚗️',tier:2, mult:1.8, desc:'Corrói estruturas.'},
  {id:'escuridao', name:'Escuridão',     ico:'🌒',tier:2, mult:1.8, desc:'Corrói a alma.'},
  {id:'podridao',  name:'Podridão',      ico:'💀',tier:2, mult:1.8, desc:'Decompõe tudo.'},
  {id:'virus',     name:'Vírus',         ico:'🧬',tier:2, mult:1.8, desc:'Infecta e replica.'},
  {id:'carie',     name:'Cárie',         ico:'🦷',tier:2, mult:1.8, desc:'Corrói por dentro.'},
  // Tier 3 — Condutores
  {id:'mercurio',  name:'Mercúrio',      ico:'🪞',tier:3, mult:1.5, desc:'Metal tóxico fluido.'},
  {id:'som',       name:'Som',           ico:'🔊',tier:3, mult:1.5, desc:'Vibração devastadora.'},
  {id:'gelo',      name:'Gelo',          ico:'❄️',tier:3, mult:1.5, desc:'Congela e fragmenta.'},
  {id:'sangue',    name:'Sangue',        ico:'🩸',tier:3, mult:1.5, desc:'Manipula o vital.'},
  {id:'sombra',    name:'Sombra',        ico:'👤',tier:3, mult:1.5, desc:'Ilude e penetra.'},
  {id:'fumaca',    name:'Fumaça',        ico:'💨',tier:3, mult:1.5, desc:'Ofusca e sufoca.'},
  {id:'areia',     name:'Areia',         ico:'⏱️',tier:3, mult:1.5, desc:'Corrói por atrito.'},
  {id:'vidro',     name:'Vidro',         ico:'🔮',tier:3, mult:1.5, desc:'Fragmentos cortantes.'},
  {id:'oleo',      name:'Óleo',          ico:'🛢️',tier:3, mult:1.5, desc:'Inflamável e escorregadio.'},
  {id:'espuma',    name:'Espuma',        ico:'🫧',tier:3, mult:1.5, desc:'Aprisiona e sufoca.'},
  // Tier 4 — Materiais Nobres
  {id:'diamante',  name:'Diamante',      ico:'💎',tier:4, mult:1.3, desc:'Perfura qualquer coisa.'},
  {id:'platina',   name:'Platina',       ico:'🥈',tier:4, mult:1.3, desc:'Conduz e reflete.'},
  {id:'ouro',      name:'Ouro',          ico:'🥇',tier:4, mult:1.3, desc:'Conduz e estabiliza.'},
  {id:'metal',     name:'Metal',         ico:'⚙️',tier:4, mult:1.3, desc:'Resistência pura.'},
  {id:'cristal',   name:'Cristal',       ico:'🔷',tier:4, mult:1.3, desc:'Amplifica energia.'},
  {id:'titanio',   name:'Titânio',       ico:'🛡️',tier:4, mult:1.3, desc:'Leveza e dureza.'},
  {id:'aco',       name:'Aço',           ico:'⚔️',tier:4, mult:1.3, desc:'Resistência extrema.'},
  {id:'obsidiana', name:'Obsidiana',     ico:'🖤',tier:4, mult:1.3, desc:'Absorve impactos.'},
  {id:'marmore',   name:'Mármore',       ico:'🗿',tier:4, mult:1.3, desc:'Defesa absoluta.'},
  // Tier 5 — Elementais Básicos
  {id:'terra',     name:'Terra',         ico:'🌍',tier:5, mult:1.0, desc:'Fundação do mundo.'},
  {id:'ar',        name:'Ar',            ico:'🌬️',tier:5, mult:1.0, desc:'Onipresente e invisível.'},
  {id:'agua',      name:'Água',          ico:'💧',tier:5, mult:1.0, desc:'Adapta-se a tudo.'},
  {id:'flora',     name:'Flora',         ico:'🌿',tier:5, mult:1.0, desc:'Vida e crescimento.'},
  {id:'lodo',      name:'Lodo',          ico:'🟫',tier:5, mult:1.0, desc:'Prende e sufoca.'},
  {id:'cinzas',    name:'Cinzas',        ico:'🌫️',tier:5, mult:1.0, desc:'Resta após tudo.'},
  {id:'argila',    name:'Argila',        ico:'🏺',tier:5, mult:1.0, desc:'Moldável e resistente.'},
  {id:'nevoa',     name:'Névoa',         ico:'🌁',tier:5, mult:1.0, desc:'Obscurece e penetra.'},
  {id:'poeira',    name:'Poeira',        ico:'💭',tier:5, mult:1.0, desc:'Onipresente e corrosiva.'},
  {id:'espinho',   name:'Espinho',       ico:'🌵',tier:5, mult:1.0, desc:'Perfura e sangra.'},
  {id:'raiz',      name:'Raiz',          ico:'🪨',tier:5, mult:1.0, desc:'Prende e sufoca.'},
];

/* ═══ FUSÕES ═══ */
const FUSIONS=[
  {id:'continuum',       name:'Continuum',            ico:'♾️', tier:0,mult:2.8,e1:'tempo',      e2:'espaco',      desc:'Altera a malha da causalidade; permite onipresença local e manipulação cronológica.'},
  {id:'vazio_absoluto',  name:'Vazio Absoluto',        ico:'⬛',tier:0,mult:2.8,e1:'vacuo',      e2:'materia_escura',desc:'Aniquilação atômica total. Uma zona onde a existência é simplesmente deletada.'},
  {id:'essencia_divina', name:'Essência Divina',       ico:'🌟',tier:0,mult:2.8,e1:'eter',       e2:'gravidade',   desc:'Manifestação da vontade pura; cura o incurável ou cria matéria do nada.'},
  {id:'materia_sombria', name:'Matéria Sombria',       ico:'🌑',tier:0,mult:2.8,e1:'materia_escura',e2:'luz',      desc:'Matéria paradoxal que alterna entre solidez e intangibilidade absoluta.'},
  {id:'dobra_espacial',  name:'Dobra Espacial',        ico:'🌀',tier:0,mult:2.8,e1:'gravidade',  e2:'espaco',      desc:'Comprime distâncias infinitas; esmaga inimigos em um ponto singular.'},
  {id:'morte_divina',    name:'Morte Divina',          ico:'💀',tier:0,mult:2.8,e1:'necrose',     e2:'tempo',       desc:'O poder de apagar conceitos, leis da natureza ou matar seres imortais.'},
  {id:'lente_grav',      name:'Lente Gravitacional',   ico:'🔭',tier:1,mult:2.3,e1:'gravidade',  e2:'luz',         desc:'Invisibilidade perfeita e distorção da realidade visual em escala global.'},
  {id:'eco_temporal',    name:'Eco Temporal',          ico:'⏪',tier:1,mult:2.3,e1:'tempo',      e2:'som',         desc:'Gritos que ecoam pelo tempo, permitindo prever ataques ou alterar o passado.'},
  {id:'silencio_abs',    name:'Silêncio Absoluto',     ico:'🔇',tier:1,mult:2.3,e1:'vacuo',      e2:'som',         desc:'Remove o meio de propagação física; explosões e impactos tornam-se nulos.'},
  {id:'sangue_tempo',    name:'Sangue do Tempo',       ico:'🩸',tier:1,mult:2.3,e1:'tempo',      e2:'sangue',      desc:'Permite visualizar e acessar a memória genética de todas as eras.'},
  {id:'mutacao',         name:'Mutação',               ico:'🧬',tier:2,mult:2.0,e1:'radiacao',   e2:'flora',       desc:'Crescimento vegetal grotesco e acelerado; plantas tornam-se predadoras.'},
  {id:'fosforescencia',  name:'Fosforescência',        ico:'💡',tier:2,mult:2.0,e1:'necrose',    e2:'luz',         desc:'Brilho que drena a vitalidade; quanto mais brilha, mais vida consome.'},
  {id:'silencio_obs',    name:'Silêncio Obscuro',      ico:'🌑',tier:2,mult:2.0,e1:'escuridao',  e2:'som',         desc:'Privação sensorial total; mergulha o alvo em pânico e desorientação.'},
  {id:'peste',           name:'Peste',                 ico:'☠️',tier:2,mult:2.0,e1:'podridao',   e2:'sangue',      desc:'Corrupção imediata do sistema circulatório; o sangue apodrece nas veias.'},
  {id:'epidemia',        name:'Epidemia',              ico:'🦠',tier:2,mult:2.0,e1:'virus',      e2:'ar',          desc:'O ar torna-se o vetor de uma doença imparável e onipresente.'},
  {id:'luz_sonica',      name:'Luz Sônica',            ico:'💥',tier:2,mult:2.0,e1:'som',        e2:'luz',         desc:'Flash cegante acompanhado de uma onda de choque que explode órgãos.'},
  {id:'chama_negra',     name:'Chama Negra',           ico:'🖤',tier:2,mult:2.0,e1:'fogo',       e2:'escuridao',   desc:'Fogo que não ilumina; consome a alma e deixa o corpo físico intacto.'},
  {id:'eletrolise',      name:'Eletrólise',            ico:'⚡',tier:3,mult:1.7,e1:'raio',       e2:'agua',        desc:'Condução elétrica total em líquidos; gera explosões gasosas de hidrogênio.'},
  {id:'liga_plasma',     name:'Liga de Plasma',        ico:'💫',tier:3,mult:1.7,e1:'plasma',     e2:'metal',       desc:'Metal energético que corta a nível molecular e se autorregenera.'},
  {id:'toxina_liq',      name:'Toxina Líquida',        ico:'🐍',tier:3,mult:1.7,e1:'veneno',     e2:'agua',        desc:'Contaminação em massa de oceanos; toque na pele gera paralisia instantânea.'},
  {id:'corrosao',        name:'Corrosão',              ico:'⚗️',tier:3,mult:1.7,e1:'acido',      e2:'metal',       desc:'Derrete instantaneamente armaduras e estruturas metálicas nobres.'},
  {id:'amalgama',        name:'Amálgama Dentária',     ico:'🦷',tier:3,mult:1.7,e1:'carie',      e2:'ouro',        desc:'O paradoxo da corrupção do ouro; destrói relíquias indestrutíveis.'},
  {id:'neblina_sombria', name:'Neblina Sombria',       ico:'👤',tier:3,mult:1.7,e1:'sombra',     e2:'fumaca',      desc:'Cortina de fumaça viva que permite teletransporte entre sombras.'},
  {id:'elet_estatica',   name:'Eletricidade Estática', ico:'⚡',tier:3,mult:1.7,e1:'poeira',     e2:'raio',        desc:'Ar carregado que gera descargas de alta voltagem a qualquer movimento.'},
  {id:'vapor_super',     name:'Vapor Superaquecido',   ico:'♨️',tier:4,mult:1.5,e1:'fogo',       e2:'gelo',        desc:'Névoa invisível que cozinha alvos por dentro, ignorando armaduras.'},
  {id:'piroclasto',      name:'Piroclasto',            ico:'🌋',tier:4,mult:1.5,e1:'magma',      e2:'ar',          desc:'Chuva de cinzas e rochas incandescentes; soterra exércitos e cidades.'},
  {id:'mercurio_sol',    name:'Mercúrio Sólido',       ico:'🪞',tier:4,mult:1.5,e1:'mercurio',   e2:'gelo',        desc:'Lâminas de metal tóxico que derretem após atingir a corrente sanguínea.'},
  {id:'areia_vitr',      name:'Areia Vitrificada',     ico:'🏜️',tier:4,mult:1.5,e1:'areia',      e2:'vidro',       desc:'Chão transformado em espelhos afiados que refletem ataques mágicos.'},
  {id:'emulsao',         name:'Emulsão',               ico:'🛢️',tier:4,mult:1.5,e1:'oleo',       e2:'agua',        desc:'Superfície ultra-escorregadia e inflamável, mesmo sob chuva forte.'},
  {id:'bolhas_eternas',  name:'Bolhas Eternas',        ico:'🫧',tier:4,mult:1.5,e1:'espuma',     e2:'ar',          desc:'Prisões esféricas inquebráveis que asfixiam o alvo lentamente.'},
  {id:'po_diamante',     name:'Pó de Diamante',        ico:'💎',tier:4,mult:1.5,e1:'diamante',   e2:'fogo',        desc:'Nuvem de carbono indestrutível que perfura como agulhas ardentes.'},
  {id:'liga_nobre',      name:'Liga Nobre',            ico:'🥇',tier:4,mult:1.5,e1:'platina',    e2:'ouro',        desc:'Material supremo contra magia; anula feitiços de tiers inferiores.'},
  {id:'metal_crist',     name:'Metal Cristalino',      ico:'🔷',tier:4,mult:1.5,e1:'metal',      e2:'cristal',     desc:'Metal translúcido que foca e amplifica raios de energia.'},
  {id:'superliga',       name:'Superliga',             ico:'🛡️',tier:4,mult:1.5,e1:'titanio',    e2:'aco',         desc:'O metal definitivo: leve como o ar, porém impossível de amassar.'},
  {id:'rocha_meta',      name:'Rocha Metamórfica',     ico:'🗿',tier:4,mult:1.5,e1:'obsidiana',  e2:'marmore',     desc:'Absorve impactos físicos e os devolve como ondas de choque.'},
  {id:'ceramica',        name:'Cerâmica',              ico:'🏺',tier:4,mult:1.5,e1:'argila',     e2:'fogo',        desc:'Cascas defensivas que endurecem sob calor extremo.'},
  {id:'nevoeiro_gelido', name:'Nevoeiro Gélido',       ico:'🌁',tier:4,mult:1.5,e1:'nevoa',      e2:'gelo',        desc:'Congela a umidade interna dos pulmões de quem respira a névoa.'},
  {id:'barro_vermelho',  name:'Barro Vermelho',        ico:'🟫',tier:5,mult:1.2,e1:'sangue',     e2:'terra',       desc:'Cria golems de carne e terra com memória genética residual.'},
  {id:'tempestade_areia',name:'Tempestade de Areia',   ico:'🌪️',tier:5,mult:1.2,e1:'terra',      e2:'ar',          desc:'Tornado de partículas que desintegra carne e pedra por atrito.'},
  {id:'seiva_vital',     name:'Seiva Vital',           ico:'🌿',tier:5,mult:1.2,e1:'agua',       e2:'flora',       desc:'Aura de cura acelerada capaz de regenerar membros perdidos.'},
  {id:'lodo_cinzento',   name:'Lodo Cinzento',         ico:'🌫️',tier:5,mult:1.2,e1:'lodo',       e2:'cinzas',      desc:'Massa viscosa que endurece como cimento ao tocar o inimigo.'},
  {id:'espinheiro',      name:'Espinheiro',            ico:'🌵',tier:5,mult:1.2,e1:'espinho',    e2:'raiz',        desc:'Floresta de lanças vegetais que rastreiam o alvo pelo calor.'},
  // Fusões com Caos, Vida e Morte
  {id:'linha_tempo_caotica',name:'Linha do Tempo Caótica',ico:'🌀',tier:0,mult:2.8,e1:'caos',e2:'tempo',      desc:'Passado, presente e futuro se misturam; eventos podem se repetir ou nunca acontecer.'},
  {id:'dobra_dimensional',  name:'Dobra Dimensional',     ico:'🌌',tier:0,mult:2.8,e1:'caos',e2:'espaco',     desc:'Abre portais instáveis para dimensões aleatórias; invoca criaturas ou distorce a realidade.'},
  {id:'aniquilacao_abs',    name:'Aniquilação Absoluta',  ico:'⬛',tier:0,mult:2.8,e1:'caos',e2:'morte',      desc:'Apaga qualquer alvo da existência, sem chance de ressurreição ou vestígios.'},
  {id:'fim_dos_tempos',     name:'Fim dos Tempos',        ico:'⏳',tier:0,mult:2.8,e1:'morte',e2:'tempo',     desc:'Acelera o envelhecimento ou encerra ciclos instantaneamente; pode destruir eras inteiras.'},
  {id:'eter_caotico',       name:'Éter Caótico',          ico:'✨',tier:0,mult:2.8,e1:'caos',e2:'eter',       desc:'Altera as leis da física; cria áreas de gravidade zero ou fluxo de tempo lento.'},
  {id:'luz_caotica',        name:'Luz Caótica',           ico:'💥',tier:1,mult:2.3,e1:'caos',e2:'luz',        desc:'Flashes imprevisíveis que podem cegar inimigos ou revelar verdades ocultas.'},
  {id:'trevas_caoticas',    name:'Trevas Caóticas',       ico:'🌒',tier:1,mult:2.3,e1:'caos',e2:'escuridao',  desc:'Escuridão viva que se move e consome tudo, causando confusão e dano contínuo.'},
  {id:'vida_caotica',       name:'Vida Caótica',          ico:'💚',tier:1,mult:2.3,e1:'caos',e2:'vida',       desc:'Gera mutações aleatórias em seres vivos (cura, fortalece ou deforma o alvo).'},
  {id:'ciclo_eterno',       name:'Ciclo Eterno',          ico:'♾️',tier:1,mult:2.3,e1:'vida',e2:'morte',      desc:'Equilíbrio supremo; pode ressuscitar aliados ou destruir inimigos conforme o uso.'},
  {id:'fenix',              name:'Fênix',                 ico:'🔥',tier:2,mult:2.0,e1:'vida',e2:'fogo',       desc:'Chamas douradas que curam, regeneram e queimam; renasce das cinzas se destruída.'},
  {id:'agua_da_vida',       name:'Água da Vida',          ico:'💧',tier:2,mult:2.0,e1:'vida',e2:'agua',       desc:'Cura ferimentos graves e prolonga a vida; pode reverter o envelhecimento.'},
  {id:'sopro_vital',        name:'Sopro Vital',           ico:'🌬️',tier:2,mult:2.0,e1:'vida',e2:'ar',        desc:'Vento revigorante que restaura a energia total e remove efeitos de exaustão.'},
  {id:'choque_revigorante', name:'Choque Revigorante',    ico:'⚡',tier:2,mult:2.0,e1:'vida',e2:'raio',       desc:'Descarga elétrica que reanima seres inconscientes e remove estados de paralisia.'},
  {id:'sombra_viva',        name:'Sombra Viva',           ico:'👤',tier:2,mult:2.0,e1:'vida',e2:'sombra',     desc:'Sombras com consciência própria que agem como guardiões ou espiões perfeitos.'},
  {id:'sangue_vivo',        name:'Sangue Vivo',           ico:'🩸',tier:2,mult:2.0,e1:'vida',e2:'sangue',     desc:'Sangue que regenera tecidos e cria laços vitais profundos entre criaturas.'},
  {id:'frio_da_morte',      name:'Frio da Morte',         ico:'❄️',tier:2,mult:2.0,e1:'morte',e2:'gelo',      desc:'Gelo que congela a alma; causa morte instantânea ao toque espiritual.'},
  {id:'fogo_fatuo',         name:'Fogo Fátuo',            ico:'🕯️',tier:2,mult:2.0,e1:'morte',e2:'fogo',     desc:'Chamas esverdeadas que ignoram defesas físicas para queimar a alma diretamente.'},
  {id:'espectro',           name:'Espectro',              ico:'👻',tier:2,mult:2.0,e1:'morte',e2:'sombra',    desc:'Invoca uma entidade sombria persistente que drena a vitalidade dos inimigos.'},
  {id:'toxina_mortal',      name:'Toxina Mortal',         ico:'☠️',tier:2,mult:2.0,e1:'morte',e2:'veneno',    desc:'Veneno letal fulminante; causa morte em segundos sem antídoto comum.'},
  {id:'vida_na_morte',      name:'Vida na Morte',         ico:'🦠',tier:2,mult:2.0,e1:'vida',e2:'necrose',    desc:'Fungos e bactérias que prosperam na decomposição para gerar nova vida.'},
  {id:'fertilidade',        name:'Fertilidade',           ico:'🌱',tier:3,mult:1.7,e1:'vida',e2:'terra',      desc:'Torna o solo fértil instantaneamente; faz plantas crescerem em segundos.'},
  {id:'preservacao',        name:'Preservação',           ico:'🧊',tier:3,mult:1.7,e1:'vida',e2:'gelo',       desc:'Gelo que mantém organismos em animação suspensa (não envelhecem nem morrem).'},
  {id:'metal_maleavel',     name:'Metal Maleável',        ico:'⚙️',tier:3,mult:1.7,e1:'caos',e2:'metal',     desc:'Metal que muda de forma aleatoriamente; cria armas ou armaduras instáveis.'},
  {id:'vidro_fractal',      name:'Vidro Fractal',         ico:'🔮',tier:3,mult:1.7,e1:'caos',e2:'vidro',      desc:'Vidro com padrões infinitos que distorce a visão e causa alucinações severas.'},
  {id:'flora_morta',        name:'Flora Morta',           ico:'🌵',tier:3,mult:1.7,e1:'morte',e2:'flora',     desc:'Plantas secas e murchas que sugam energia ou lançam galhos mortais.'},
];

/* ═══ SISTEMA DE ELEMENTOS ═══ */

// Retorna a fusão disponível entre dois elementos, se existir
function tryFuse(id1, id2){
  return FUSIONS.find(f=>
    (f.e1===id1 && f.e2===id2)||(f.e1===id2 && f.e2===id1)
  )||null;
}

// Verifica se o jogador já possui o elemento ou fusão
function hasElement(id){
  return G.elements.some(e=>e.id===id);
}

// Aplica dano elemental baseado no MAG e multiplicador do tier
function elementDmg(el){
  return Math.round(Math.max(4, G.mag * el.mult + r(10)));
}

// Evento de livro — oferece 3 elementos aleatórios não aprendidos
function showBookEvent(sc){
  const learned = G.elements.map(e=>e.id);
  const available = ELEMENTS.filter(e=>!learned.includes(e.id));
  if(!available.length){
    outcome(sc,'neutral','📖','Sem novidades','Você já conhece todos os elementos disponíveis.',[]);
    return;
  }
  const opts = [...available].sort(()=>Math.random()-.5).slice(0,3);
  sc.innerHTML='';
  const card = mkCard('story');
  card.innerHTML=`
    <div class="ctag"><div class="ctag-dot"></div><span class="ctag-txt">TOMO ELEMENTAL</span></div>
    <div class="ctitle">📚 Estudo de Elementos</div>
    <div class="cbody">Três tomos brilham diante de você. Cada um contém um segredo elemental diferente. Você só pode absorver um.</div>
    <div class="choices" id="book-choices"></div>`;
  sc.appendChild(card);
  const cw = card.querySelector('#book-choices');
  opts.forEach((el,i)=>{
    const btn = document.createElement('button');
    btn.className='chbtn';
    btn.innerHTML=`<span class="chkey">${i+1}</span>
      <div class="chinner">
        <span class="chtxt">${el.ico} ${el.name} <span style="font-size:10px;color:var(--txt2)">Tier ${el.tier}</span></span>
        <span class="chhint">${el.desc}</span>
      </div>`;
    btn.onclick=()=>{
      card.querySelectorAll('.chbtn').forEach(b=>{b.disabled=true;b.style.opacity=b===btn?'1':'0.25';});
      G.elements.push({...el});
      const xp = (5-el.tier)*15+20;
      logRun('🔮',`Elemento aprendido: ${el.ico} ${el.name} (Tier ${el.tier})`,'win');
      addXP(xp);
      toast(`${el.ico} ${el.name} aprendido! +${xp} XP`);
      outcome(sc,'win','📖','Elemento Absorvido',
        `Você absorveu o conhecimento de <b>${el.name}</b>. O poder flui pelas suas veias.`,
        [{c:'item',t:`${el.ico} ${el.name}`},{c:'xp',t:`+${xp} XP`}],'');
    };
    cw.appendChild(btn);
  });
  scrollBot(sc);
}

// Tela de seleção de elemento ativo (abre na aba Skills)
function renderElementPicker(sc){
  sc.innerHTML='';
  const card = mkCard('explore');
  const tierNames=['Primordial','Energia Pura','Entrópico','Condutor','Material Nobre','Elemental Básico'];
  const tierColors=['#ff6b35','#f1c40f','#9b59b6','#3498db','#95a5a6','#27ae60'];

  // Agrupa por tier
  const byTier={};
  G.elements.forEach(el=>{
    if(!byTier[el.tier])byTier[el.tier]=[];
    byTier[el.tier].push(el);
  });

  let html=`<div class="panel-title">🔮 ELEMENTOS CONHECIDOS</div>`;
  if(!G.elements.length){
    html+=`<div style="color:var(--txt2);font-style:italic;text-align:center;padding:20px;">Nenhum elemento aprendido ainda.<br>Encontre Tomos Elementais explorando.</div>`;
  } else {
    Object.keys(byTier).sort().forEach(tier=>{
      html+=`<div style="font-family:var(--cinzel);font-size:9px;color:${tierColors[tier]};letter-spacing:2px;margin:10px 0 6px;">TIER ${tier} — ${tierNames[tier]}</div>`;
      html+=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:4px;">`;
      byTier[tier].forEach(el=>{
        const active = G.activeElement && G.activeElement.id===el.id;
        html+=`<div onclick="setActiveElement('${el.id}')" style="border:1px solid ${active?tierColors[tier]:'var(--brd2)'};border-radius:8px;padding:10px 6px;background:${active?`rgba(255,255,255,.06)`:'rgba(255,255,255,.02)'};text-align:center;cursor:pointer;transition:.2s;">
          <div style="font-size:22px;">${el.ico}</div>
          <div style="font-family:var(--cinzel);font-size:9px;color:${active?tierColors[tier]:'var(--txt2)'};margin-top:4px;">${el.name}</div>
        </div>`;
      });
      html+=`</div>`;
    });

    // Seção de fusões disponíveis
    const availFusions=FUSIONS.filter(f=>hasElement(f.e1)&&hasElement(f.e2)&&!hasElement(f.id));
    if(availFusions.length){
      html+=`<div style="font-family:var(--cinzel);font-size:9px;color:var(--gold);letter-spacing:2px;margin:14px 0 8px;padding-top:10px;border-top:1px solid var(--brd);">⚗️ FUSÕES DISPONÍVEIS</div>`;
      availFusions.forEach(f=>{
        const el1=ELEMENTS.find(e=>e.id===f.e1);
        const el2=ELEMENTS.find(e=>e.id===f.e2);
        html+=`<div onclick="fuseElements('${f.id}')" style="border:1px solid rgba(200,168,75,.3);border-radius:8px;padding:11px;background:rgba(200,168,75,.04);cursor:pointer;margin-bottom:6px;transition:.2s;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-size:18px;">${el1?el1.ico:'?'}</span>
            <span style="font-family:var(--cinzel);font-size:10px;color:var(--txt2);">+</span>
            <span style="font-size:18px;">${el2?el2.ico:'?'}</span>
            <span style="font-family:var(--cinzel);font-size:10px;color:var(--txt2);">→</span>
            <span style="font-size:18px;">${f.ico}</span>
            <span style="font-family:var(--cinzel);font-size:11px;color:var(--gold);">${f.name}</span>
            <span style="font-family:var(--cinzel);font-size:9px;color:var(--txt2);margin-left:auto;">Tier ${f.tier}</span>
          </div>
          <div style="font-size:12px;color:var(--txt2);font-style:italic;">${f.desc}</div>
        </div>`;
      });
    }
  }

  card.innerHTML=html;
  sc.appendChild(card);scrollBot(sc);
}

function setActiveElement(id){
  const el = G.elements.find(e=>e.id===id);
  if(!el)return;
  G.activeElement = G.activeElement?.id===id ? null : el;
  toast(G.activeElement ? `${el.ico} ${el.name} ativado!` : 'Elemento desativado.');
  renderElementPicker($('scroll'));
}

function fuseElements(fusionId){
  const f = FUSIONS.find(x=>x.id===fusionId);
  if(!f||!hasElement(f.e1)||!hasElement(f.e2)||hasElement(f.id))return;
  G.elements.push({...f});
  toast(`✨ Fusão: ${f.ico} ${f.name} criada!`,2500);
  renderElementPicker($('scroll'));
}

/* ═══ EVENTS ═══ */
const EVENTS=[
  {id:'camp',type:'explore',title:'Acampamento Abandonado',ico:'🏕️',body:'Uma fogueira ainda quente. Mochila rasgada ao lado.',narr_key:'',
   choices:[{txt:'Verificar a mochila',hint:'Pode conter itens',fn:'search_camp'},{txt:'Descansar na fogueira',hint:'Recupera HP e MP',fn:'rest_camp',hintcls:'ok'},{txt:'Seguir em frente',hint:'',fn:'pass'}]},
  {id:'shrine',type:'explore',title:'Santuário Antigo',ico:'⛩️',body:'Runas brilhantes num altar de pedra. Uma oferenda pode agradar — ou irritar.',narr_key:'',
   choices:[{txt:'Oferecer 10 moedas',hint:'Custo: 10 💰',fn:'shrine_offer',cost:{gold:10},hintcls:'warn'},{txt:'Sacrificar 15 HP por +4 ATK',hint:'Troca HP por poder',fn:'shrine_sacrifice',hintcls:'warn'},{txt:'Rezar sem oferecer',hint:'Bênção ou maldição',fn:'shrine_pray'},{txt:'Ignorar',hint:'',fn:'pass'}]},
  {id:'merchant',type:'shop',title:'Mercador Errante',ico:'🧳',body:'Um comerciante surge do nada, sorrindo com dentes de ouro.',narr_key:'buy',
   choices:[{txt:'Comprar poção (15💰)',hint:'',fn:'buy_pot',cost:{gold:15}},{txt:'Comprar equipamento (30💰)',hint:'Item aleatório por raridade',fn:'buy_gear',cost:{gold:30}},{txt:'Comprar item raro (50💰)',hint:'Garantido Raro+',fn:'buy_rare',cost:{gold:50}},{txt:'Negociar (sorte)',hint:'Pode sair de graça ou mal',fn:'haggle'},{txt:'Dispensar',hint:'',fn:'pass'}]},
  {id:'chest',type:'explore',title:'Baú Misterioso',ico:'📦',body:'Três baús diante de você. Um contém um tesouro raro. Os outros... surpresas.',narr_key:'greed',
   choices:[{txt:'Abrir um baú (mini-game)',hint:'Escolha com sabedoria',fn:'chest_game'},{txt:'Não tocar — pode ser armadilha',hint:'',fn:'pass'}]},
  {id:'dungeon',type:'explore',title:'Entrada da Masmorra',ico:'🚪',body:'Uma porta de pedra com crânios esculpidos. Há tesouros dentro — e perigos.',narr_key:'',
   choices:[{txt:'Entrar com cuidado',hint:'Explorar com cuidado',fn:'dungeon_safe'},{txt:'Invadir com força',hint:'Mais risco, mais recompensa',fn:'dungeon_charge'},{txt:'Continuar o caminho',hint:'',fn:'pass'}]},
  {id:'wounded',type:'story',title:'Guerreiro Ferido',ico:'🤕',body:'Um aventureiro caído, ferido gravemente. <b>"Por favor... não me deixe aqui."</b>',narr_key:'',
   choices:[{txt:'Usar poção para salvá-lo',hint:'Gasta 1 poção',fn:'save_him',cost:{item:'potion'},hintcls:'warn'},{txt:'Dar metade das moedas',hint:'',fn:'give_gold'},{txt:'Deixá-lo para trás',hint:'',fn:'abandon'}]},
  {id:'library',type:'story',title:'Biblioteca Esquecida',ico:'📚',body:'Tomos antigos em ruínas. Um brilha com luz azul.',narr_key:'',
   choices:[{txt:'Estudar o tomo brilhante',hint:'Chance de ganhar XP',fn:'read_tome'},{txt:'Pegar vários tomos',hint:'Podem ter valor',fn:'collect_tomes'},{txt:'Seguir em frente',hint:'',fn:'pass'}]},
  {id:'fountain',type:'rest',title:'Fonte Mágica',ico:'⛲',body:'Água cristalina emite luz suave e restauradora.',narr_key:'',
   choices:[{txt:'Beber da fonte',hint:'Recupera HP e MP',fn:'drink',hintcls:'ok'},{txt:'Encher um frasco',hint:'Ganha Água Benta',fn:'fill_flask'},{txt:'Não arriscar',hint:'',fn:'pass'}]},
  {id:'trap',type:'explore',title:'Corredor Suspeito',ico:'⚠️',body:'Chão solto com marcas de armadilhas. Um brilho no fim do corredor.',narr_key:'',
   choices:[{txt:'Avançar com cuidado (DEF)',hint:'Teste de defesa',fn:'trap_def'},{txt:'Correr para o tesouro (VEL)',hint:'Teste de velocidade',fn:'trap_spd'},{txt:'Dar a volta',hint:'',fn:'pass'}]},
  {id:'gamble',type:'story',title:'O Apostador',ico:'🎲',body:'<b>"Dobro ou nada. Simples assim."</b>',narr_key:'greed',
   choices:[{txt:'Apostar 20 moedas',hint:'50% duplicar ou perder',fn:'gamble',hintcls:'warn'},{txt:'Apostar tudo',hint:'All in! Muito risco',fn:'gamble_all',hintcls:'warn'},{txt:'Recusar',hint:'',fn:'pass'}]},
  {id:'ambush',type:'combat',title:'Emboscada!',ico:'👥',body:'<b>"Dinheiro ou vida."</b> Bandidos surgem das sombras.',narr_key:'',
   choices:[{txt:'Lutar! (em desvantagem)',hint:'Pego de surpresa',fn:'fight_ambush',hintcls:'warn'},{txt:'Entregar 15 moedas',hint:'Eles te deixam passar',fn:'pay_bandits',cost:{gold:15}},{txt:'Fugir (VEL)',hint:'',fn:'flee_ambush'}]},
  {id:'altar',type:'story',title:'Altar Sombrio',ico:'🕯️',body:'Um altar escuro pulsa com energia estranha. Glifos em sangue cobrem o chão.',narr_key:'curse',
   choices:[{txt:'Absorver a energia (-15 HP MAX, +5 ATK)',hint:'Troca vida por poder',fn:'dark_pact',hintcls:'warn'},{txt:'Destruir o altar',hint:'Chance de recompensa',fn:'smash_altar'},{txt:'Recuar',hint:'',fn:'pass'}]},
  {id:'survivor',type:'story',title:'Sobrevivente',ico:'🧑',body:'Uma pessoa assustada com um item nas mãos.',narr_key:'',
   choices:[{txt:'Ajudar e receber gratidão',hint:'',fn:'help_survivor'},{txt:'Pegar o item à força',hint:'',fn:'steal_survivor'},{txt:'Ignorar',hint:'',fn:'pass'}]},
   {id:'book',type:'story',title:'Tomo Elemental',ico:'📚',
   body:'Um livro antigo pulsa com energia arcana. Três tomos flutuam diante de você.',narr_key:'',
 choices:[
   {txt:'Estudar os tomos',hint:'Aprenda um novo elemento',fn:'book_event'},
   {txt:'Ignorar',hint:'',fn:'pass'},
 ]},
  // ══ FERREIRO ══
  {id:'blacksmith',type:'shop',title:'Ferreiro Errante',ico:'⚒️',
   body:'Um ferreiro enorme ocupa um canto da masmorra, bigorna e forja improvisadas. <b>"Trago o ofício comigo. Ouro aceito, reclamação não."</b>',narr_key:'',
   choices:[
     {txt:'Melhorar item equipado',hint:'Fortifica um slot equipado',fn:'smith_upgrade'},
     {txt:'Fundir dois itens',hint:'Combina stats — custa 80💰',fn:'smith_fuse',cost:{gold:80}},
     {txt:'Reparar item maldito',hint:'Remove penalidades — 50💰',fn:'smith_repair',cost:{gold:50}},
     {txt:'Craftar item novo',hint:'Forja item pelo andar — 70💰',fn:'smith_craft',cost:{gold:70}},
     {txt:'Comprar/Vender itens',hint:'Troca de mercadorias',fn:'smith_trade'},
     {txt:'Dispensar',hint:'',fn:'pass'},
   ]},
  // ══ EVENTOS EM CADEIA ══
  {id:'chain_oracle',type:'story',title:'A Oráculo das Ruínas',ico:'🔮',
   body:'Uma figura encurvada bloqueia a passagem. Olhos brancos e vazios. <b>"Eu vejo o que você esconde, viajante."</b> Ela ergue uma mão — à esquerda, névoa; à direita, chamas.',narr_key:'',
   chain:true,
   choices:[
     {txt:'Encarar seus olhos',hint:'Ato de coragem',fn:'chain_oracle_brave'},
     {txt:'Oferecer ouro (20💰)',hint:'Custo: 20💰',fn:'chain_oracle_gold',cost:{gold:20}},
     {txt:'Dar as costas e fugir',hint:'Pode haver consequências',fn:'chain_oracle_flee'},
   ]},
  {id:'chain_ruins',type:'explore',title:'Ruínas Submersas',ico:'🏛️',
   body:'Uma estrutura antiga emerge da neblina. Paredes cobertas de musgo brilhante. Dois caminhos se abrem: uma sala com água estagnada e uma escada estreita levando a cima.',narr_key:'',
   chain:true,
   choices:[
     {txt:'Mergulhar na sala alagada',hint:'Algo brilha lá dentro',fn:'chain_ruins_dive'},
     {txt:'Subir a escada estreita',hint:'Risco de desabamento',fn:'chain_ruins_climb'},
     {txt:'Examinar as paredes',hint:'Pode revelar segredos',fn:'chain_ruins_read'},
   ]},
  {id:'chain_prisoner',type:'story',title:'O Prisioneiro Esquecido',ico:'⛓️',
   body:'Uma cela entalhada na rocha viva. Dentro, um homem de meia-idade com vestes de mago. <b>"Me solte. Eu tenho informações... sobre o que espera mais à frente."</b>',narr_key:'',
   chain:true,
   choices:[
     {txt:'Abrir a cela (força)',hint:'Teste de ATK',fn:'chain_prisoner_force'},
     {txt:'Buscar uma chave nos arredores',hint:'Perde tempo, mas é mais seguro',fn:'chain_prisoner_search'},
     {txt:'Ignorá-lo',hint:'Talvez seja uma armadilha',fn:'chain_prisoner_ignore'},
   ]},
];

/* ═══ STATE ═══ */
let G=null,CE=null,combatLog=[],pendingLevelUp=false,pendingSubclass=false;

function newG(cls){
  G={cls,hp:cls.hp,hpMax:cls.hp,mp:cls.mp,mpMax:cls.mp,
    atk:cls.atk,def:cls.def,mag:cls.mag,spd:cls.spd,
    crit:cls.crit,dodge:cls.dodge||.05,lifesteal:cls.lifesteal||0,critMult:2.0,
    xp:0,xpNext:40,level:1,gold:20,floor:1,room:0,maxRooms:10,
    kills:0,totalDmg:0,events:0,passives:[],inv:[],
    equip:{head:null,chest:null,weapon:null,feet:null},
    skills: cls.skill2 ? [{...cls.skill},{...cls.skill2}] : [{...cls.skill}],
    elements:[],activeElement:null,_elChargeEl:null,_elChargeCount:0,runLog:[],
    subclass:null,upgrades:[],mpRegen:cls.id==='mage'?14:8,view:'explore',inCombat:false,
    t0:Date.now(),tmpBuffs:[],
    // Missões
    missions:[],missionsCompleted:0,
    // Sets
    activeSets:{},
    // Itens especiais de estado
    compassNextRoom:null,
    arcanaCooldown:0,    // combates restantes para recarregar Explosão Arcana
    arcanaReady:true,    // true = pode usar
    arcanaCombatsSince:0,
    phoenixUsed:false,
    // Buffs temporários de combate
    warcryTurns:0,
    // Mercador Especial e Sala de Desafio
    specialMerchantSeen:false,
    challengeRoomDoneThisFloor:false,
  };
  generateMissions();
  cls.items.forEach(name=>{
    G.inv.push({id:'start_'+r(9999),name,ico:name.split(' ')[0],uses:null,rarity:'common',desc:'Item inicial',slot:null,fn:null});
  });
}

/* ═══ HELPERS ═══ */
const r=n=>Math.floor(Math.random()*n)+1;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const pct=(v,m)=>Math.max(0,Math.min(100,Math.round(v/m*100)))+'%';
const $=id=>document.getElementById(id);
const show=id=>$(id).classList.remove('off');
const hide=id=>$(id).classList.add('off');
const tagLbl=t=>({combat:'Combate',explore:'Exploração',story:'História',shop:'Comércio',rest:'Descanso'}[t]||t);
const mkCard=type=>{const d=document.createElement('div');d.className='card '+({combat:'ec',explore:'ee',story:'es',shop:'esh',rest:'er',boss:'eb',elite:'elite'}[type]||'ee');return d;};
const scrollBot=el=>setTimeout(()=>{if(el)el.scrollTop=el.scrollHeight;},80);

/* ═══ SISTEMA DE MISSÕES ═══ */
const MISSION_POOL=[
  {id:'kill5',   desc:'Derrote 5 inimigos neste andar',    check:G=>G.kills>=G._mKillBase+5,  reward:{gold:30,xp:50}},
  {id:'kill3elite',desc:'Derrote 2 inimigos Elite',       check:G=>G._mElites>=2,            reward:{gold:40,xp:60}},
  {id:'nodmg',   desc:'Complete um combate sem tomar dano',check:G=>G._mNoDmg,               reward:{gold:25,xp:40}},
  {id:'noitem',  desc:'Vença 3 combates sem usar item',   check:G=>G._mNoItem>=3,            reward:{gold:20,xp:35}},
  {id:'gold100', desc:'Acumule 100 moedas de ouro',       check:G=>G.gold>=100,              reward:{xp:70,item:'rare'}},
  {id:'skill5',  desc:'Use sua skill 5 vezes em combate', check:G=>G._mSkillUses>=5,         reward:{gold:30,xp:45}},
  {id:'nofloor', desc:'Não fuja de nenhum combate neste andar',check:G=>!G._mFled,           reward:{gold:35,xp:55}},
];

function generateMissions(){
  const pool=[...MISSION_POOL].sort(()=>Math.random()-.5).slice(0,3);
  G.missions=pool.map(m=>({...m,done:false}));
  G._mKillBase=G.kills;G._mElites=0;G._mNoDmg=false;G._mNoItem=0;G._mSkillUses=0;G._mFled=false;
}

function checkMissions(){
  if(!G||!G.missions)return;
  G.missions.forEach(m=>{
    if(m.done)return;
    if(m.check(G)){
      m.done=true;G.missionsCompleted++;
      const r=m.reward;
      if(r.gold)addGold(r.gold);
      if(r.xp)addXP(r.xp);
      if(r.item){const it=randItemByRarity('rare+');addItemToInv(it);toast(`✅ Missão: ${m.desc}! +${it.name}`,2500);}
      else toast(`✅ Missão concluída! ${r.gold?'+'+r.gold+'💰':''} ${r.xp?'+'+r.xp+' XP':''}`,2500);
    }
  });
}

function renderMissions(container){
  if(!G.missions||!G.missions.length)return '';
  return `<div style="margin-top:14px;">
    <div class="panel-title" style="margin-bottom:8px;">🎯 MISSÕES DO ANDAR</div>
    ${G.missions.map(m=>`
      <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid ${m.done?'rgba(39,174,96,.4)':'var(--brd2)'};border-radius:7px;margin-bottom:6px;background:${m.done?'rgba(39,174,96,.06)':'rgba(255,255,255,.02)'};">
        <span style="font-size:16px;">${m.done?'✅':'🎯'}</span>
        <div style="flex:1;">
          <div style="font-size:12px;color:${m.done?'var(--grn)':'var(--txt)'};font-family:var(--cinzel);font-size:11px;">${m.desc}</div>
          <div style="font-size:10px;color:var(--gold);margin-top:2px;">${m.reward.gold?'+'+m.reward.gold+'💰 ':''} ${m.reward.xp?'+'+m.reward.xp+' XP':''} ${m.reward.item?'+ Item Raro':''}</div>
        </div>
      </div>`).join('')}
  </div>`;
}

/* ═══ SISTEMA DE SETS ═══ */
const SET_DEFS={
  hunter:{
    name:'Caçador',cls:'rogue',
    pieces:['set_hunter_bow','set_hunter_hood','set_hunter_boots'],
    bonus2:{desc:'+10% crítico',fn:G=>{G.crit+=.10;}},
    bonus3:{desc:'Ataques sempre acertam (sem dodge inimigo)',fn:G=>{G.passives.push('sure_hit');}},
  },
  mage_anc:{
    name:'Mago Ancestral',cls:'mage',
    pieces:['set_mage_staff','set_mage_robe','set_mage_crown'],
    bonus2:{desc:'-2 MP em todas as habilidades',fn:G=>{G.mpDiscount=(G.mpDiscount||0)+2;}},
    bonus3:{desc:'Explosão Arcana (sem custo, cooldown 3 vitórias)',fn:G=>{G.passives.push('arcana_explosion');}},
  },
  berserker:{
    name:'Berserker',cls:'warrior',
    pieces:['set_bsk_axe','set_bsk_armor','set_bsk_helm'],
    bonus2:{desc:'+15% chance de atacar duas vezes',fn:G=>{G.passives.push('dbl');}},
    bonus3:{desc:'HP<30%: +10 ATK e cura 5 HP/ataque',fn:G=>{G.passives.push('bsk_set');}},
  },
};

function evaluateSets(){
  // Conta peças equipadas por set
  const counts={};
  Object.values(G.equip).forEach(item=>{
    if(item&&item.set){counts[item.set]=(counts[item.set]||0)+1;}
  });
  // Aplica/remove bônus
  Object.entries(SET_DEFS).forEach(([setId,def])=>{
    const prev=G.activeSets[setId]||0;
    const curr=counts[setId]||0;
    if(curr===prev)return;
    // Remove bônus antigos
    if(prev>=2)reverseSetBonus(setId,2);
    if(prev>=3)reverseSetBonus(setId,3);
    // Aplica novos
    if(curr>=2){def.bonus2.fn(G);toast(`✨ Set ${def.name} (2 peças): ${def.bonus2.desc}`,2200);}
    if(curr>=3){def.bonus3.fn(G);toast(`🌟 Set ${def.name} (3 peças): ${def.bonus3.desc}`,2500);}
    G.activeSets[setId]=curr;
  });
  upd();
}

function reverseSetBonus(setId,tier){
  // Reverte passivos de set ao desequipar peça
  if(setId==='hunter'&&tier===2)G.crit=Math.max(0,G.crit-.10);
  if(setId==='hunter'&&tier===3){const i=G.passives.indexOf('sure_hit');if(i>=0)G.passives.splice(i,1);}
  if(setId==='mage_anc'&&tier===2)G.mpDiscount=Math.max(0,(G.mpDiscount||0)-2);
  if(setId==='mage_anc'&&tier===3){const i=G.passives.indexOf('arcana_explosion');if(i>=0)G.passives.splice(i,1);}
  if(setId==='berserker'&&tier===2){const i=G.passives.lastIndexOf('dbl');if(i>=0)G.passives.splice(i,1);}
  if(setId==='berserker'&&tier===3){const i=G.passives.indexOf('bsk_set');if(i>=0)G.passives.splice(i,1);}
}

/* ═══ MENUS ESPECIAIS ═══ */
function openTalentSwap(){
  const ov=document.createElement('div');ov.id='talent-swap-ov';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9500;display:flex;align-items:center;justify-content:center;padding:16px;';
  ov.innerHTML=`<div style="background:#0e0c14;border:1px solid #9b59b6;border-radius:12px;padding:16px;width:100%;max-width:420px;max-height:80vh;overflow-y:auto;">
    <div style="font-family:var(--cinzel);font-size:13px;color:#c39bd3;letter-spacing:2px;margin-bottom:12px;">🔵 TROCAR TALENTO</div>
    <div style="font-size:12px;color:var(--txt2);margin-bottom:12px;font-style:italic;">Escolha um talento para remover:</div>
    <div id="ts-remove"></div>
  </div>`;
  document.body.appendChild(ov);
  const rem=ov.querySelector('#ts-remove');
  G.upgrades.forEach((uName,idx)=>{
    const btn=document.createElement('button');
    btn.className='cheat-btn';btn.style.marginBottom='6px';
    btn.innerHTML=`<span style="flex:1;">${uName}</span><span style="color:var(--red2);font-size:10px;">Remover</span>`;
    btn.onclick=()=>{
      G.upgrades.splice(idx,1);
      ov.remove();
      // Abre level up para escolher novo
      renderLevelUp($('scroll'));
      toast('🔵 Talento removido. Escolha um novo!');
    };
    rem.appendChild(btn);
  });
  const cancel=document.createElement('button');
  cancel.className='cheat-btn';cancel.style.marginTop='8px';cancel.textContent='✕ Cancelar';
  cancel.onclick=()=>ov.remove();
  rem.appendChild(cancel);
}

function openCompassMenu(){
  const ov=document.createElement('div');ov.id='compass-ov';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9500;display:flex;align-items:center;justify-content:center;padding:16px;';
  const types=[{t:'combat',l:'⚔️ Combate'},{t:'explore',l:'🗺️ Exploração'},{t:'shop',l:'🧳 Comércio'},{t:'rest',l:'⛲ Descanso'},{t:'story',l:'📖 História'}];
  ov.innerHTML=`<div style="background:#0e0c14;border:1px solid var(--gold);border-radius:12px;padding:16px;width:100%;max-width:360px;">
    <div style="font-family:var(--cinzel);font-size:13px;color:var(--gold);letter-spacing:2px;margin-bottom:12px;">🧭 BÚSSOLA MÁGICA</div>
    <div style="font-size:12px;color:var(--txt2);margin-bottom:12px;font-style:italic;">Escolha o tipo da próxima sala:</div>
    <div style="display:flex;flex-direction:column;gap:7px;">
      ${types.map(t=>`<button class="cheat-btn" onclick="compassChoose('${t.t}')">${t.l}</button>`).join('')}
    </div>
  </div>`;
  document.body.appendChild(ov);
}

function compassChoose(type){
  G.compassNextRoom=type;
  const ov=$('compass-ov');if(ov)ov.remove();
  toast(`🧭 Próxima sala: ${type}!`);
}

/* ═══ VFX ═══ */
let _tt=null;
function toast(msg,ms=1800){const el=$('toast');el.textContent=msg;el.classList.remove('hide');clearTimeout(_tt);_tt=setTimeout(()=>el.classList.add('hide'),ms);}
function floatDmg(txt,color,x,y){
  const el=document.createElement('div');el.className='fdmg';
  el.style.cssText=`left:${x||45+r(20)}%;top:${y||38}%;color:${color};font-size:${txt.length>4?'16':'20'}px;`;
  el.textContent=txt;document.body.appendChild(el);setTimeout(()=>el.remove(),950);
}
function screenShake(){const sc=$('scroll');if(!sc)return;sc.classList.remove('shake');void sc.offsetWidth;sc.classList.add('shake');setTimeout(()=>sc.classList.remove('shake'),400);}
function lvFlash(){const sg=$('s-game');if(!sg)return;sg.classList.remove('lvflash');void sg.offsetWidth;sg.classList.add('lvflash');setTimeout(()=>sg.classList.remove('lvflash'),700);}

/* ═══════════════════════════════════════════
   SISTEMA DE ÁUDIO — Web Audio API
═══════════════════════════════════════════ */
let _actx=null;
let _sfxMuted=false;

function getACtx(){
  if(!_actx){try{_actx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}}
  if(_actx.state==='suspended')_actx.resume();
  return _actx;
}

function sfx(type){
  if(_sfxMuted)return;
  const ac=getACtx();if(!ac)return;
  const t=ac.currentTime;
  const SFX={
    // Ataque físico — impacto percussivo seco
    atk:()=>{
      const b=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();
      b.type='sawtooth';b.frequency.setValueAtTime(180,t);b.frequency.exponentialRampToValueAtTime(60,t+.08);
      f.type='bandpass';f.frequency.value=350;f.Q.value=2;
      g.gain.setValueAtTime(.55,t);g.gain.exponentialRampToValueAtTime(.001,t+.14);
      b.connect(f);f.connect(g);g.connect(ac.destination);
      b.start(t);b.stop(t+.15);
    },
    // Crítico — impacto mais agudo e brilhante
    crit:()=>{
      const b=ac.createOscillator(),g=ac.createGain();
      const b2=ac.createOscillator(),g2=ac.createGain();
      b.type='square';b.frequency.setValueAtTime(440,t);b.frequency.exponentialRampToValueAtTime(220,t+.12);
      g.gain.setValueAtTime(.4,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);
      b2.type='sine';b2.frequency.setValueAtTime(880,t);
      g2.gain.setValueAtTime(.2,t);g2.gain.exponentialRampToValueAtTime(.001,t+.1);
      b.connect(g);g.connect(ac.destination);b2.connect(g2);g2.connect(ac.destination);
      b.start(t);b.stop(t+.2);b2.start(t);b2.stop(t+.12);
    },
    // Dano recebido — tom baixo dissonante
    hit:()=>{
      const b=ac.createOscillator(),g=ac.createGain();
      b.type='sawtooth';b.frequency.setValueAtTime(120,t);b.frequency.exponentialRampToValueAtTime(55,t+.15);
      g.gain.setValueAtTime(.5,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);
      b.connect(g);g.connect(ac.destination);b.start(t);b.stop(t+.25);
    },
    // Skill elemental — sweep ressonante
    elemental:()=>{
      const b=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();
      b.type='sine';b.frequency.setValueAtTime(320,t);b.frequency.exponentialRampToValueAtTime(680,t+.15);b.frequency.exponentialRampToValueAtTime(420,t+.35);
      f.type='lowpass';f.frequency.setValueAtTime(1200,t);f.Q.value=8;
      g.gain.setValueAtTime(.0,t);g.gain.linearRampToValueAtTime(.5,t+.05);g.gain.exponentialRampToValueAtTime(.001,t+.4);
      b.connect(f);f.connect(g);g.connect(ac.destination);b.start(t);b.stop(t+.42);
    },
    // Carga elemental ×3 — acorde energético
    charge:()=>{
      [[330,0],[415,.04],[495,.08],[660,.14]].forEach(([freq,delay])=>{
        const b=ac.createOscillator(),g=ac.createGain();
        b.type='sine';b.frequency.value=freq;
        g.gain.setValueAtTime(0,t+delay);g.gain.linearRampToValueAtTime(.35,t+delay+.04);g.gain.exponentialRampToValueAtTime(.001,t+delay+.4);
        b.connect(g);g.connect(ac.destination);b.start(t+delay);b.stop(t+delay+.45);
      });
    },
    // Fusão elemental — arpejo mágico ascendente
    fusion:()=>{
      [261,329,392,523,659].forEach((freq,i)=>{
        const b=ac.createOscillator(),g=ac.createGain();
        b.type='sine';b.frequency.value=freq;
        const d=i*.07;
        g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.3,t+d+.04);g.gain.exponentialRampToValueAtTime(.001,t+d+.35);
        b.connect(g);g.connect(ac.destination);b.start(t+d);b.stop(t+d+.38);
      });
    },
    // Level up — fanfarra curta ascendente
    levelup:()=>{
      [[262,.0],[330,.1],[392,.2],[523,.3],[659,.4],[784,.5]].forEach(([freq,d])=>{
        const b=ac.createOscillator(),g=ac.createGain();
        b.type='triangle';b.frequency.value=freq;
        g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.4,t+d+.05);g.gain.exponentialRampToValueAtTime(.001,t+d+.28);
        b.connect(g);g.connect(ac.destination);b.start(t+d);b.stop(t+d+.32);
      });
    },
    // Chefe derrotado — impacto pesado + decaimento lento
    boss_die:()=>{
      const b=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();
      const b2=ac.createOscillator(),g2=ac.createGain();
      b.type='sawtooth';b.frequency.setValueAtTime(80,t);b.frequency.exponentialRampToValueAtTime(30,t+.8);
      f.type='lowpass';f.frequency.value=300;
      g.gain.setValueAtTime(.7,t);g.gain.exponentialRampToValueAtTime(.001,t+.9);
      b2.type='sine';b2.frequency.setValueAtTime(660,t);b2.frequency.exponentialRampToValueAtTime(220,t+.4);
      g2.gain.setValueAtTime(.3,t);g2.gain.exponentialRampToValueAtTime(.001,t+.5);
      b.connect(f);f.connect(g);g.connect(ac.destination);
      b2.connect(g2);g2.connect(ac.destination);
      b.start(t);b.stop(t+.95);b2.start(t);b2.stop(t+.55);
    },
    // Item lendário/épico — sino cristalino
    legendary:()=>{
      [1047,1319,1568,2093].forEach((freq,i)=>{
        const b=ac.createOscillator(),g=ac.createGain();
        b.type='sine';b.frequency.value=freq;
        const d=i*.06;
        g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.25,t+d+.03);g.gain.exponentialRampToValueAtTime(.001,t+d+.7);
        b.connect(g);g.connect(ac.destination);b.start(t+d);b.stop(t+d+.75);
      });
    },
    // Morte do herói — tom grave descendente
    death:()=>{
      const b=ac.createOscillator(),g=ac.createGain();
      b.type='sine';b.frequency.setValueAtTime(220,t);b.frequency.exponentialRampToValueAtTime(55,t+1.2);
      g.gain.setValueAtTime(.5,t);g.gain.linearRampToValueAtTime(.4,t+.3);g.gain.exponentialRampToValueAtTime(.001,t+1.4);
      b.connect(g);g.connect(ac.destination);b.start(t);b.stop(t+1.5);
    },
    // Click de navegação — sutil
    click:()=>{
      const b=ac.createOscillator(),g=ac.createGain();
      b.type='sine';b.frequency.setValueAtTime(800,t);b.frequency.exponentialRampToValueAtTime(500,t+.04);
      g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+.06);
      b.connect(g);g.connect(ac.destination);b.start(t);b.stop(t+.07);
    },
    // Subclasse escolhida — acorde majestoso
    subclass:()=>{
      [[196,0],[247,.08],[294,.16],[392,.24],[494,.32]].forEach(([freq,d])=>{
        const b=ac.createOscillator(),g=ac.createGain();
        b.type='triangle';b.frequency.value=freq;
        g.gain.setValueAtTime(0,t+d);g.gain.linearRampToValueAtTime(.35,t+d+.06);g.gain.exponentialRampToValueAtTime(.001,t+d+.5);
        b.connect(g);g.connect(ac.destination);b.start(t+d);b.stop(t+d+.55);
      });
    },
    // Fuga — whoosh descendente
    flee:()=>{
      const b=ac.createOscillator(),g=ac.createGain();
      b.type='sawtooth';b.frequency.setValueAtTime(600,t);b.frequency.exponentialRampToValueAtTime(150,t+.2);
      g.gain.setValueAtTime(.25,t);g.gain.exponentialRampToValueAtTime(.001,t+.22);
      b.connect(g);g.connect(ac.destination);b.start(t);b.stop(t+.25);
    },
    // Overlay aberto — tom suave
    open:()=>{
      const b=ac.createOscillator(),g=ac.createGain();
      b.type='sine';b.frequency.setValueAtTime(440,t);b.frequency.linearRampToValueAtTime(550,t+.1);
      g.gain.setValueAtTime(.18,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);
      b.connect(g);g.connect(ac.destination);b.start(t);b.stop(t+.2);
    },
  };
  try{(SFX[type]||SFX.click)();}catch(e){}
}

function toggleMute(){
  _sfxMuted=!_sfxMuted;
  try{localStorage.setItem('cronista_muted',_sfxMuted?'1':'0');}catch(e){}
  const btn=$('mute-btn');
  if(btn)btn.textContent=_sfxMuted?'🔇':'🔊';
}

// Carrega preferência salva
try{if(localStorage.getItem('cronista_muted')==='1')_sfxMuted=true;}catch(e){}

/* ═══════════════════════════════════════════
   SISTEMA DE VFX — Partículas + Flash
═══════════════════════════════════════════ */
function spawnParticles(count=10,color='#e74c3c',originEl=null){
  const origin=originEl||document.querySelector('.enemy-block')||document.body;
  const rect=origin.getBoundingClientRect();
  const cx=rect.left+rect.width/2;
  const cy=rect.top+rect.height/2;
  for(let i=0;i<count;i++){
    const p=document.createElement('div');
    p.className='vfx-particle';
    const angle=Math.random()*Math.PI*2;
    const dist=30+Math.random()*55;
    const tx=Math.cos(angle)*dist;
    const ty=Math.sin(angle)*dist;
    const size=3+Math.random()*4;
    p.style.cssText=`left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${color};--tx:${tx}px;--ty:${ty}px;`;
    document.body.appendChild(p);
    setTimeout(()=>p.remove(),700);
  }
}

function flashCard(color='rgba(231,76,60,.35)',duration=300){
  const block=document.querySelector('.enemy-block');
  if(!block)return;
  block.style.transition=`background ${duration/2}ms`;
  block.style.background=color;
  setTimeout(()=>{block.style.background='';block.style.transition='';},duration);
}

function flashPlayerHit(){
  const sg=$('s-game');if(!sg)return;
  sg.classList.remove('player-hit-flash');void sg.offsetWidth;sg.classList.add('player-hit-flash');
  setTimeout(()=>sg.classList.remove('player-hit-flash'),350);
}

function pulseEnemyIco(){
  const ico=document.querySelector('.eillo');if(!ico)return;
  ico.classList.remove('enemy-pulse');void ico.offsetWidth;ico.classList.add('enemy-pulse');
  setTimeout(()=>ico.classList.remove('enemy-pulse'),400);
}

/* ═══ HUD ═══ */
function upd(){
  if(!G)return;
  if(G.tmpBuffs){G.tmpBuffs=G.tmpBuffs.filter(b=>{if(b.rooms<=0){G[b.stat]-=b.val;return false;}b.rooms--;return true;});}
  let ico=G.cls.ico;
  if(G.equip.weapon)ico=G.equip.weapon.ico.split('')[0]||G.cls.ico;
  $('hud-ava').textContent=ico;
  const floorLabel=G.floor>3?`∞ ${G.floor}`:`${G.floor}`;
  $('hud-cls').textContent=G.cls.name+(G.subclass?' · '+G.subclass.name:'')+' — Andar '+floorLabel;
  $('vhp').style.width=pct(G.hp,G.hpMax);$('vmp').style.width=pct(G.mp,G.mpMax);
  $('nhp').textContent=G.hp+'/'+G.hpMax;$('nmp').textContent=G.mp+'/'+G.mpMax;
  $('hlv').textContent='Nv.'+G.level;$('xpf').style.width=pct(G.xp,G.xpNext);
  $('hgold').textContent='💰'+G.gold;
  const subBadge=G.subclass?`<span class="sub-badge ${G.subclass.key}">${G.subclass.name}</span>`:'';
  $('hstats').innerHTML=
    `<div class="schip"><span class="l">ATK</span><span class="v">${G.atk}</span></div>
    <div class="schip"><span class="l">DEF</span><span class="v">${G.def}</span></div>
    <div class="schip"><span class="l">MAG</span><span class="v">${G.mag}</span></div>
    <div class="schip"><span class="l">CRIT</span><span class="v">${Math.round(G.crit*100)}%</span></div>
    <div class="schip"><span class="l">ESQ</span><span class="v">${Math.round(G.dodge*100)}%</span></div>
    <div class="schip"><span class="l">MP/sala</span><span class="v">${G.mpRegen}</span></div>
    ${subBadge}<div class="fbadge">Sala ${G.room}/${G.maxRooms}</div>`;
}

/* ═══ XP / LEVEL ═══ */
function logRun(ico,txt,type='neutral'){
  if(!G||!G.runLog)return;
  G.runLog.push({ico,txt,type,floor:G.floor,room:G.room,level:G.level});
}

function addXP(n){
  G.xp+=n;
  while(G.xp>=G.xpNext){
    G.xp-=G.xpNext;G.xpNext=Math.round(G.xpNext*1.45);G.level++;
    if(G.passives.includes('fheal'))G.hp=Math.min(G.hpMax,G.hp+Math.round(G.hpMax*.25));
    logRun('⬆️',`Subiu para Nível ${G.level}`,'win');
    pendingLevelUp=true;sfx('levelup');lvFlash();
    if(G.level===3&&!G.subclass){pendingSubclass=true;pendingLevelUp=false;}
  }
  upd();
}
function addGold(n){if(G.passives.includes('loot'))n=Math.round(n*1.5);G.gold=Math.max(0,G.gold+n);upd();}

/* ═══ TITLE ═══ */
let selectedCls=null;
function buildTitle(){
  const grid=$('class-grid');grid.innerHTML='';
  CLASSES.forEach(cls=>{
    const d=document.createElement('div');d.className='cls';
    d.innerHTML=`<span class="cls-ico">${cls.ico}</span>
      <div class="cls-name">${cls.name}</div>
      <div class="cls-desc">${cls.flavor}</div>
      ${['atk','def','mag'].map(k=>`<div class="mini-bar"><span>${k.toUpperCase()}</span><div class="mini-bg"><div class="mini-fill fill-${k}" style="width:${cls.bars[k]}%"></div></div></div>`).join('')}`;
    d.onclick=()=>{document.querySelectorAll('.cls').forEach(x=>x.classList.remove('sel'));d.classList.add('sel');selectedCls=cls;$('btn-go').disabled=false;};
    grid.appendChild(d);
  });
}
function startGame(){if(!selectedCls)return;newG(selectedCls);hide('s-title');show('s-game');upd();navTo('explore');}
function goTitle(){
  ['s-death','s-win'].forEach(hide);
  G=null;CE=null;combatLog=[];pendingLevelUp=false;pendingSubclass=false;selectedCls=null;
  document.querySelectorAll('.cls').forEach(x=>x.classList.remove('sel'));
  $('btn-go').disabled=true;show('s-title');
}

/* ═══ SAFE RENDER ═══ */
function safeRender(fn,...args){try{fn(...args);}catch(e){console.error(e);toast('Erro na interface.',3000);if(G&&!G.inCombat)setTimeout(()=>navTo('explore'),300);}}

/* ═══ NAV ═══ */
function navTo(v) {
  sfx('click');
  const sc = $("scroll");
  // Conteúdo longo (combate, inv, skills, stats) = alinha ao topo
  const longViews = ["inv","skills","stats"];
  sc.classList.toggle("has-combat", v !== "explore" || G.inCombat);
  ["explore","inv","skills","stats"].forEach(n => $("nb-"+n).classList.toggle("active", n === v));
  if (G.inCombat && v === "explore") { renderCombat(sc); return; }
  const views = { inv: renderInv, skills: renderSkills, stats: renderStats };
  if (v === "explore") {
    if (G.currentEvent) showEvent(G.currentEvent, sc);
    else renderExplore(sc);
  } else {
    safeRender(views[v], sc);
  }
}

/* ═══ EXPLORE ═══ */
function renderExplore(sc){
  sc.innerHTML='';
  if(G.passives.includes('regen'))G.hp=Math.min(G.hpMax,G.hp+3);
  if(G.passives.includes('regen_strong'))G.hp=Math.min(G.hpMax,G.hp+8);
  G.mp=Math.min(G.mpMax,G.mp+G.mpRegen);
  upd();
  if(pendingSubclass){pendingSubclass=false;renderSubclass(sc);return;}
  if(pendingLevelUp){pendingLevelUp=false;renderLevelUp(sc);return;}
  G.room++;G.events++;
  G._mNoDmg=true; // reset por sala; vira false se levar dano
  if(G.room>G.maxRooms){G.room=G.maxRooms;startBoss(sc);return;}

  // ── Sala de Desafio — aparece na sala 5 de cada andar (se não feita ainda) ──
  if(G.room===5&&!G.challengeRoomDoneThisFloor){
    showChallengeRoomOffer(sc);return;
  }

  // ── Mercador Especial — andar 3+, sala 4, só uma vez por run ──
  if(G.floor>=3&&G.room===4&&!G.specialMerchantSeen){
    showSpecialMerchant(sc);return;
  }

  // Bússola Mágica — força tipo de sala
  let chosen='explore';
  if(G.compassNextRoom){
    chosen=G.compassNextRoom;G.compassNextRoom=null;
    toast('🧭 Bússola: sala '+chosen+'!');
  } else {
    const w=G.floor>=3?[58,18,10,9,5]:G.floor>=2?[50,24,12,9,5]:[40,30,15,10,5];
    const types=['combat','explore','story','shop','rest'];
    const total=w.reduce((a,b)=>a+b,0);
    let rn=r(total);
    for(let i=0;i<types.length;i++){rn-=w[i];if(rn<=0){chosen=types[i];break;}}
  }

  // Eventos em cadeia têm chance de aparecer em vez de eventos normais de story/explore
  if((chosen==='story'||chosen==='explore')&&Math.random()<0.35){
    const chainEvs=EVENTS.filter(e=>e.chain&&e.type===chosen);
    if(chainEvs.length){showEvent(pick(chainEvs),sc);return;}
  }

  if(chosen==='combat'){
    let enemy;
    if(Math.random()<.20){
      enemy=genElite(G.floor);
    } else {
      enemy=genEnemy(G.floor);
    }
    startCombat(enemy,sc);
  } else {
    // Ferreiro: 20% de chance em eventos shop, a partir do andar 2
    if(chosen==='shop'&&G.floor>=2&&Math.random()<.20){
      showEvent(EVENTS.find(e=>e.id==='blacksmith'),sc);return;
    }
    // Mapa do Tesouro — força evento de baú
    if(G.passives.includes('treasure_map')&&chosen==='explore'){
      const idx=G.passives.indexOf('treasure_map');G.passives.splice(idx,1);
      showChestGame(sc,true);return;
    }
    const evPool=EVENTS.filter(e=>!e.chain&&(e.type===chosen||(chosen==='explore'&&['explore','chest'].includes(e.type))));
    showEvent(pick(evPool.length?evPool:EVENTS.filter(e=>!e.chain)),sc);
  }
}

function makeElite(e){
  e.elite=true;e.name='★ '+e.name;
  e.hp=Math.round(e.hp*2.2);e.atk=Math.round(e.atk*1.4);
  e.def=Math.round(e.def*1.3);e.xp=Math.round(e.xp*2);
  e.gold=[e.gold[0]*2,e.gold[1]*3];e.badges=['Elite',...e.badges];
}

/* ═══ SALA DE DESAFIO ═══ */
function showChallengeRoomOffer(sc){
  sc.innerHTML='';
  const card=mkCard('boss');
  // Gera inimigo de desafio: élite super-buffado do andar atual
  const pool=ENEMIES.filter(e=>e.floor<=G.floor&&!e.boss);
  const base={...pick(pool)};
  const floorMult=1+(G.floor-1)*0.25;
  const ngMult=G.ngMult||1;
  base.hp=Math.round(base.hp*(floorMult*ngMult)*2.8);
  base.atk=Math.round(base.atk*(floorMult*ngMult)*1.8);
  base.def=Math.round(base.def*(1+(G.floor-1)*0.15)*1.5);
  base.elite=true;
  base.isChallenge=true;
  base.name='⚔️ '+base.name+' [Desafio]';
  base.badges=['Desafio','Elite',...(base.badges||[])];
  base.xp=Math.round(base.xp*3);
  base.gold=[base.gold[0]*3,base.gold[1]*4];
  // Armazena temporariamente
  G._challengeEnemy=base;

  card.innerHTML=`
    <div class="ctag"><div class="ctag-dot" style="background:#ff6b35"></div><span class="ctag-txt" style="color:#ff6b35">SALA DE DESAFIO</span></div>
    <div class="ctitle" style="color:#ff9055">⚔️ Porta do Desafio</div>
    <div class="cillo">🚪</div>
    <div class="cbody">Uma porta diferente das outras. Marcas de batalha antigas cobrem cada centímetro. Do outro lado, grunhidos. <b>Esta luta não será fácil — mas a recompensa é garantida.</b><br><br>
      <div style="border:1px solid rgba(255,107,53,.3);border-radius:8px;padding:10px;margin-top:10px;background:rgba(255,107,53,.05);">
        <div style="font-family:var(--cinzel);font-size:10px;color:#ff9055;letter-spacing:1px;margin-bottom:6px;">O QUE ESPERA:</div>
        <div style="font-size:12px;color:var(--txt2);">👹 ${base.name}<br>💔 ${base.hp} HP · ⚔️ ${base.atk} ATK · 🛡️ ${base.def} DEF</div>
        <div style="font-family:var(--cinzel);font-size:10px;color:var(--gold);margin-top:8px;">RECOMPENSA GARANTIDA: Item Épico ou Lendário + Bônus Extra</div>
      </div>
    </div>
    <div class="narrator">"${narr('elite')}"</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;">
      <button class="btn-next" style="border-color:#ff6b35;color:#ff9055;" onclick="enterChallengeRoom()">⚔️ Aceitar o Desafio</button>
      <button class="btn-next" style="border-color:var(--brd2);color:var(--txt2);margin-top:0;" onclick="skipChallengeRoom()">🚪 Ignorar e seguir</button>
    </div>`;
  sc.appendChild(card);scrollBot(sc);
}

function enterChallengeRoom(){
  const enemy=G._challengeEnemy;
  if(!enemy){nextRoom();return;}
  G._challengeEnemy=null;
  G.challengeRoomDoneThisFloor=true;
  G._inChallengeRoom=true;
  startCombat(enemy,$('scroll'));
}

function skipChallengeRoom(){
  G.challengeRoomDoneThisFloor=true; // não pode voltar
  G._challengeEnemy=null;
  toast('Você ignora a porta. Ela desaparece.',1800);
  nextRoom();
}

// Hook pós-combate para dar recompensa da sala de desafio
// Chamado em checkEnd após vitória
function grantChallengeReward(){
  if(!G._inChallengeRoom)return;
  G._inChallengeRoom=false;
  logRun('⚔️','Sala de Desafio concluída!','crit');
  const it1=randItemByRarity('rare+');
  const it2=randItemByRarity('rare+');
  // Garante pelo menos um lendário/épico
  const guaranteed=Math.random()<0.4?
    {...ITEMS_POOL.filter(i=>i.rarity==='legendary')[Math.floor(Math.random()*ITEMS_POOL.filter(i=>i.rarity==='legendary').length)],id:'chal_'+r(99999)}:
    {...ITEMS_POOL.filter(i=>i.rarity==='epic')[Math.floor(Math.random()*ITEMS_POOL.filter(i=>i.rarity==='epic').length)],id:'chal_'+r(99999)};
  addItemToInv(it1);
  addItemToInv(guaranteed);
  const xpBonus=80+G.floor*20;
  addXP(xpBonus);
  toast(`🏆 Recompensa do Desafio: ${it1.ico} + ${guaranteed.ico} + ${xpBonus}XP!`,3000);
}

/* ═══ EVENT ═══ */
function showEvent(ev,sc){
  G.currentEvent=ev;
  sc.innerHTML='';
  const card=mkCard(ev.type);
  card.innerHTML=`
    <div class="ctag"><div class="ctag-dot"></div><span class="ctag-txt">${tagLbl(ev.type)}</span></div>
    <div class="ctitle">${ev.title}</div>
    <div class="cillo">${ev.ico}</div>
    <div class="cbody">${ev.body}</div>
    <div class="choices" id="ev-choices"></div>`;
  sc.appendChild(card);
  const cw=card.querySelector('#ev-choices');
  ev.choices.forEach((ch,i)=>{
    const canDo=!ch.cost||canAfford(ch.cost);
    const btn=document.createElement('button');btn.className='chbtn';btn.disabled=!canDo;
    btn.innerHTML=`<span class="chkey">${i+1}</span>
      <div class="chinner"><span class="chtxt">${ch.txt}</span>
      ${ch.hint?`<span class="chhint ${ch.hintcls||''}">${ch.hint}</span>`:''}</div>`;
    btn.onclick=()=>{
      card.querySelectorAll('.chbtn').forEach(b=>{b.disabled=true;b.style.opacity=b===btn?'1':'0.25';b.style.transform='none';});
      btn.style.borderColor='rgba(200,168,75,.6)';btn.style.background='rgba(200,168,75,.08)';
      doChoice(ev,ch,sc);
    };
    cw.appendChild(btn);
  });
  scrollBot(sc);
}

function canAfford(cost){
  if(cost.gold&&G.gold<cost.gold)return false;
  if(cost.item==='potion')return G.inv.some(i=>i.id.includes('pot')||i.id==='potion');
  return true;
}
function payCost(cost){
  if(cost.gold)G.gold=Math.max(0,G.gold-cost.gold);
  if(cost.item==='potion'){const i=G.inv.findIndex(x=>x.id.includes('pot')||x.id==='potion');if(i>=0)G.inv.splice(i,1);}
  upd();
}

/* ═══ OUTCOME ═══ */
function outcome(sc,type,ico,lbl,txt,tags,narrKey){
  upd();
  if(G.hp<=0){setTimeout(()=>showDeath('Caiu em evento.'),400);return;}
  const el=document.createElement('div');el.className='outcome';
  const tc={win:'win',lose:'lose',crit:'crit',neutral:'neutral'}[type]||'neutral';
  el.innerHTML=`
    <div class="ohead"><span class="oico">${ico}</span><span class="olbl ${tc}">${lbl.toUpperCase()}</span></div>
    <div class="obody">${txt}</div>
    ${tags.length?`<div class="tags">${tags.map(t=>`<span class="tag ${t.c}">${t.t}</span>`).join('')}</div>`:''}
    ${narrKey?`<div class="narrator">"${narr(narrKey)}"</div>`:''}
    <button class="btn-next" onclick="nextRoom()">Próxima Sala →</button>`;
  sc.appendChild(el);scrollBot(sc);
}
const nextRoom = () => { G.currentEvent = null; navTo('explore'); };

/* ═══ CHOICE HANDLERS ═══ */
function doChoice(ev,ch,sc){
  if(ch.cost)payCost(ch.cost);
  const oc=(type,ico,lbl,txt,tags,nk='')=>outcome(sc,type,ico,lbl,txt,tags,nk);
  const F={
    pass:()=>oc('neutral','🚶','Passou','Você segue em frente sem se envolver.',[],ev.narr_key),
    smith_upgrade:()=>{smithUpgrade();},
    smith_fuse:()=>{smithFuse();},
    smith_repair:()=>{smithRepair();},
    smith_craft:()=>{smithCraft();},
    smith_trade:()=>{G._smithShopItems=null;smithTrade();},
    rest_camp:()=>{const h=r(20)+15,m=r(10)+5;G.hp=Math.min(G.hpMax,G.hp+h);G.mp=Math.min(G.mpMax,G.mp+m);oc('win','🔥','Descansou','O calor da fogueira restaura suas forças.',[{c:'heal',t:'+'+h+' HP'},{c:'mp',t:'+'+m+' MP'}]);},
    search_camp:()=>{if(Math.random()<.65){const it=randItemByRarity('common');addItemToInv(it);oc('win','🎒','Encontrou!','Havia algo útil dentro da mochila.',[{c:'item '+it.rarity,t:it.ico+' '+it.name}]);}else{const d=r(8)+3;G.hp=Math.max(0,G.hp-d);screenShake();oc('lose','🪤','Armadilha!','A mochila estava armada.',[{c:'dmg',t:'-'+d+' HP'}],'lose_hp');}},
    shrine_offer:()=>{G.hp=Math.min(G.hpMax,G.hp+30);G.mp=Math.min(G.mpMax,G.mp+20);oc('win','✨','Abençoado','Luz dourada te envolve.',[{c:'heal',t:'+30 HP'},{c:'mp',t:'+20 MP'}]);},
    shrine_sacrifice:()=>{G.hpMax=Math.max(20,G.hpMax-15);G.hp=Math.min(G.hp,G.hpMax);G.atk+=4;oc('crit','🗡️','Pacto de Sangue','Você cedeu saúde em troca de força.',[{c:'dmg',t:'-15 HP MAX'},{c:'xp',t:'+4 ATK'}],'curse');},
    shrine_pray:()=>{if(Math.random()<.5){const h=r(25)+10;G.hp=Math.min(G.hpMax,G.hp+h);oc('win','🙏','Bênção!','A divindade ouve.',[{c:'heal',t:'+'+h+' HP'}]);}else{const d=r(15)+5;G.hp=Math.max(0,G.hp-d);screenShake();oc('lose','💢','Maldição!','A divindade pune.',[{c:'dmg',t:'-'+d+' HP'}],'curse');}},
    buy_pot:()=>{const it={...ITEMS_POOL.find(x=>x.id==='potion')};addItemToInv(it);oc('win','🧪','Comprou','O mercador entrega a poção.',[{c:'item',t:'🧪 Poção Menor'}],'buy');},
    buy_gear:()=>{const it=randItemByRarity('weighted');addItemToInv(it);applyBonus(it);oc('win','🛒','Equipou!','Um novo item.',[{c:'item '+it.rarity,t:it.ico+' '+it.name}],'buy');},
    buy_rare:()=>{const it=randItemByRarity('rare+');addItemToInv(it);applyBonus(it);oc('win','💎','Adquirido!','Item raro nas mãos.',[{c:'item '+it.rarity,t:it.ico+' '+it.name}],it.rarity==='legendary'?'item_rare':'buy');},
    haggle:()=>{if(Math.random()<.4){const it=randItemByRarity('common');addItemToInv(it);oc('win','😏','Negócio Feito!','O mercador cede.',[{c:'item',t:it.ico+' '+it.name}],'buy');}else{const g=r(10)+5;G.gold=Math.max(0,G.gold-g);upd();oc('lose','😤','Enganado','Você perdeu moedas.',[{c:'dmg',t:'-'+g+' 💰'}],'greed');}},
    chest_game:()=>showChestGame(sc),
    dungeon_safe:()=>{const it=randItemByRarity('common');addItemToInv(it);const g=r(15)+10;addGold(g);oc('win','💎','Tesouro!','Com cuidado, você encontra recompensas.',[{c:'item '+it.rarity,t:it.ico+' '+it.name},{c:'gold',t:'+'+g+'💰'}]);},
    dungeon_charge:()=>{if(Math.random()<.55){const it=randItemByRarity('rare+');addItemToInv(it);const g=r(25)+15;addGold(g);oc('win','🏆','Glória!','Ousadia recompensada!',[{c:'item '+it.rarity,t:it.ico+' '+it.name},{c:'gold',t:'+'+g+'💰'}]);}else{const d=r(20)+10;G.hp=Math.max(0,G.hp-d);screenShake();oc('lose','💥','Emboscada!','Uma armadilha dispara.',[{c:'dmg',t:'-'+d+' HP'}],'lose_hp');}},
    save_him:()=>{const g=r(20)+15;addGold(g);const x=r(20)+15;addXP(x);oc('win','🤝','Recompensado','O guerreiro te agradece.',[{c:'gold',t:'+'+g+'💰'},{c:'xp',t:'+'+x+' XP'}],'help');},
    give_gold:()=>{const g=Math.floor(G.gold/2);G.gold=Math.max(0,G.gold-g);const x=r(15)+10;addXP(x);oc('win','❤️','Generoso','Karma acumulado.',[{c:'xp',t:'+'+x+' XP'}],'help');},
    abandon:()=>oc('neutral','💔','Seguiu','Às vezes sobreviver fala mais alto.',[],'abandon'),
    read_tome:()=>{if(Math.random()<.6){const x=r(30)+20;addXP(x);oc('win','📖','Conhecimento!','Um segredo mágico se revela.',[{c:'xp',t:'+'+x+' XP'}]);}else oc('neutral','📖','Ilegível','A língua era desconhecida.',[]);},
    collect_tomes:()=>{const g=r(12)+5;addGold(g);oc('win','📚','Vendável','Têm valor.',[{c:'gold',t:'+'+g+'💰'}]);},
    drink:()=>{const h=r(25)+15,m=r(15)+10;G.hp=Math.min(G.hpMax,G.hp+h);G.mp=Math.min(G.mpMax,G.mp+m);oc('win','💧','Restaurado','A água percorre seu corpo.',[{c:'heal',t:'+'+h+' HP'},{c:'mp',t:'+'+m+' MP'}]);},
    fill_flask:()=>{const it={...ITEMS_POOL.find(x=>x.id==='holyw')};addItemToInv(it);oc('win','✝️','Coletou','Água benta contra mortos-vivos.',[{c:'item rare',t:'✝️ Água Benta'}]);},
    trap_def:()=>{if(r(20)+G.def>=14){const g=r(20)+10;addGold(g);oc('win','🔍','Passou!','Você desativa as armadilhas.',[{c:'gold',t:'+'+g+'💰'}]);}else{const d=r(12)+5;G.hp=Math.max(0,G.hp-d);screenShake();oc('lose','💥','Atingido!',' ',[{c:'dmg',t:'-'+d+' HP'}],'lose_hp');}},
    trap_spd:()=>{if(r(20)+G.spd>=13){const g=r(25)+15;addGold(g);oc('win','💨','Chegou!','Rápido demais.',[{c:'gold',t:'+'+g+'💰'}]);}else{const d=r(18)+8;G.hp=Math.max(0,G.hp-d);screenShake();oc('lose','💥','Atingido!',' ',[{c:'dmg',t:'-'+d+' HP'}],'lose_hp');}},
    gamble:()=>{if(Math.random()<.5){addGold(20);oc('win','🎲','Venceu!','Dinheiro dobrado.',[{c:'gold',t:'+20💰'}]);}else{G.gold=Math.max(0,G.gold-20);upd();oc('lose','🎲','Perdeu!','Adeus, moedas.',[{c:'dmg',t:'-20💰'}],'greed');}},
    gamble_all:()=>{const g=G.gold;if(Math.random()<.45){addGold(g);oc('crit','🎲','JACKPOT!','Tudo dobrado!',[{c:'gold',t:'+'+g+'💰'}]);}else{G.gold=0;upd();oc('lose','💸','Falência','Perdeu tudo.',[{c:'dmg',t:'-'+g+'💰'}],'greed');}},
    fight_ambush:()=>{startCombat(genEnemy(G.floor),sc,true);},
    pay_bandits:()=>oc('neutral','💸','Pagou','Eles somem.',[]),
    flee_ambush:()=>{if(r(20)+G.spd>=13)oc('win','💨','Fugiu!','Deixou os bandidos para trás.',[]);else{const d=r(10)+4;G.hp=Math.max(0,G.hp-d);screenShake();oc('lose','🗡️','Acertaram','Faca nas costas.',[{c:'dmg',t:'-'+d+' HP'}],'lose_hp');}},
    dark_pact:()=>{G.hpMax=Math.max(20,G.hpMax-15);G.hp=Math.min(G.hp,G.hpMax);G.atk+=5;oc('crit','🕯️','Pacto Feito','Algo dentro de você muda.',[{c:'dmg',t:'-15 HP MAX'},{c:'xp',t:'+5 ATK'}],'curse');},
    smash_altar:()=>{if(Math.random()<.5){const g=r(20)+10;addGold(g);oc('win','💥','Destruído!','Energia libera moedas antigas.',[{c:'gold',t:'+'+g+'💰'}]);}else{const d=r(15)+5;G.hp=Math.max(0,G.hp-d);screenShake();oc('lose','💥','Represália!','Energia te atinge.',[{c:'dmg',t:'-'+d+' HP'}],'curse');}},
    help_survivor:()=>{const it=randItemByRarity('common');addItemToInv(it);oc('win','🤝','Grato','Ele te entrega o que tem.',[{c:'item',t:it.ico+' '+it.name}],'help');},
    steal_survivor:()=>{const it=randItemByRarity('common');addItemToInv(it);oc('neutral','😔','Pegou','O item é seu. A consciência pesa.',[{c:'item',t:it.ico+' '+it.name}],'abandon');},
    book_event: ()=> showBookEvent(sc),

    // ══ EVENTOS EM CADEIA — ORÁCULO ══
    chain_oracle_brave:()=>showChainStep(sc,'oracle_brave'),
    chain_oracle_gold: ()=>showChainStep(sc,'oracle_gold'),
    chain_oracle_flee: ()=>showChainStep(sc,'oracle_flee'),
    // ══ EVENTOS EM CADEIA — RUÍNAS ══
    chain_ruins_dive:   ()=>showChainStep(sc,'ruins_dive'),
    chain_ruins_climb:  ()=>showChainStep(sc,'ruins_climb'),
    chain_ruins_read:   ()=>showChainStep(sc,'ruins_read'),
    // ══ EVENTOS EM CADEIA — PRISIONEIRO ══
    chain_prisoner_force:  ()=>showChainStep(sc,'prisoner_force'),
    chain_prisoner_search: ()=>showChainStep(sc,'prisoner_search'),
    chain_prisoner_ignore: ()=>showChainStep(sc,'prisoner_ignore'),
    // ══ MERCADOR ESPECIAL ══
    special_merchant: ()=>showSpecialMerchant(sc),
  };
  (F[ch.fn]||F.pass)();
}

/* ═══ CHEST MINI-GAME ═══ */
function showChestGame(sc, revealed=false){
  // Chave Mestre — garante o prêmio, sem armadilha
  const hasMasterKey=G.passives.includes('master_key');
  if(hasMasterKey){
    const idx=G.passives.indexOf('master_key');G.passives.splice(idx,1);
    const it=randItemByRarity('rare+');addItemToInv(it);
    const g=r(30)+20;addGold(g);
    outcome(sc,'crit','🗝️','Chave Mestre!',`Você abre o baú com precisão e encontra o tesouro.`,
      [{c:'item '+it.rarity,t:it.ico+' '+it.name},{c:'gold',t:'+'+g+'💰'}],'item_rare');
    return;
  }

  sc.innerHTML='';
  const card=mkCard('explore');
  // 3 prêmios fixos por rodada
  const prizes=[
    ()=>{const it=randItemByRarity('rare+');addItemToInv(it);return{good:true,emoji:'✨',txt:`${it.ico} ${it.name} encontrado!`,tags:[{c:'item '+it.rarity,t:it.ico+' '+it.name}],nk:'item_rare'};},
    ()=>{const g=r(40)+20;addGold(g);return{good:true,emoji:'💰',txt:`${g} moedas de ouro!`,tags:[{c:'gold',t:'+'+g+'💰'}],nk:''};},
    ()=>{const d=r(20)+10;G.hp=Math.max(0,G.hp-d);screenShake();return{good:false,emoji:'💀',txt:`Maldição! -${d} HP`,tags:[{c:'dmg',t:'-'+d+' HP'}],nk:'curse'};},
  ];
  // Posições embaralhadas: posição[i] = índice do prêmio no baú i
  const prizeMap=[0,1,2].sort(()=>Math.random()-.5);
  let chosen=false;

  const bodyTxt=revealed
    ?'O Mapa do Tesouro revelou o conteúdo de cada baú. Escolha com sabedoria.'
    :'Três baús. Um tesouro. Dois problemas. A escolha é sua.';

  // Rótulos revelados para cada baú (só visíveis com Mapa do Tesouro)
  const revealLabels=prizeMap.map(pi=>['✨ Raro','💰 Ouro','⚠️ Armadilha'][pi]);

  card.innerHTML=`
    <div class="ctag"><div class="ctag-dot"></div><span class="ctag-txt">${revealed?'🗺️ Baú Revelado':'Baú Misterioso'}</span></div>
    <div class="ctitle">Escolha um Baú</div>
    <div class="cbody">${bodyTxt}</div>
    <div class="chest-grid" id="chest-grid"></div>
    <div id="chest-result"></div>`;
  sc.appendChild(card);
  const cg=card.querySelector('#chest-grid');

  prizeMap.forEach((prizeIdx,i)=>{
    const box=document.createElement('div');
    box.className='chest-box';
    if(revealed){
      // Mapa do Tesouro — mostra conteúdo
      const lbl=revealLabels[i];
      box.innerHTML=`<div style="font-size:28px;">${['✨','💰','⚠️'][prizeIdx]}</div><div style="font-size:9px;font-family:var(--cinzel);color:${prizeIdx===2?'var(--red2)':'var(--gold)'};margin-top:3px;">${lbl}</div>`;
      box.style.border=prizeIdx===2?'1px solid rgba(192,57,43,.4)':'1px solid rgba(200,168,75,.4)';
    } else {
      box.textContent='📦';
    }
    box.onclick=()=>{
      if(chosen)return;chosen=true;
      const result=prizes[prizeIdx]();
      box.innerHTML=`<div style="font-size:32px;">${result.emoji}</div>`;
      box.classList.add('revealed',result.good?'win':'lose');
      // Revela os outros
      cg.querySelectorAll('.chest-box').forEach((b,j)=>{
        if(j!==i)setTimeout(()=>{
          const ri=prizeMap[j];
          b.innerHTML=`<div style="font-size:32px;">${prizes[ri]&&ri===0?'✨':ri===1?'💰':'💀'}</div>`;
          b.classList.add('revealed',ri<2?'win':'lose');
        },300+j*150);
      });
      upd();
      card.querySelector('#chest-result').innerHTML=`<div class="outcome" style="margin-top:10px;">
        <div class="ohead"><span class="oico">${result.good?'🎉':'💥'}</span><span class="olbl ${result.good?'win':'lose'}">${result.good?'TESOURO!':'ARMADILHA!'}</span></div>
        <div class="obody">${result.txt}</div>
        ${result.tags.length?`<div class="tags">${result.tags.map(t=>`<span class="tag ${t.c}">${t.t}</span>`).join('')}</div>`:''}
        ${result.nk?`<div class="narrator">"${narr(result.nk)}"</div>`:''}
        <button class="btn-next" onclick="nextRoom()">Próxima Sala →</button></div>`;
      if(G.hp<=0)setTimeout(()=>showDeath('Maldição de um baú.'),400);
    };
    cg.appendChild(box);
  });
  scrollBot(sc);
}


/* ═══ EVENTOS EM CADEIA ═══ */
const CHAIN_STEPS={
  // ── ORÁCULO ──
  oracle_brave:{
    ico:'🔮',title:'A Oráculo — Fase 2',
    body:'Você a enfrenta diretamente. Ela sorri, revelando dentes de pedra. <b>"Coragem. Rara."</b> Visões fragmentadas invadem sua mente — dor, glória, o andar seguinte.',
    choices:[
      {txt:'Absorver a visão completa',hint:'Revelação total — pode custar caro',fn:'oracle_b_absorb'},
      {txt:'Rejeitar e manter o foco',hint:'Seguro, mas você perde a chance',fn:'oracle_b_reject'},
    ]
  },
  oracle_gold:{
    ico:'🔮',title:'A Oráculo — Fase 2',
    body:'Ela pesa as moedas devagar. <b>"Ouro compra palavras. Quer palavras ou poder?"</b>',
    choices:[
      {txt:'Poder',hint:'Ela canaliza algo em você',fn:'oracle_g_power'},
      {txt:'Palavras — quero saber sobre o próximo chefe',hint:'Informação estratégica',fn:'oracle_g_info'},
    ]
  },
  oracle_flee:{
    ico:'🔮',title:'A Oráculo — Fase 2',
    body:'Você se vira para sair. A voz ressoa nas paredes. <b>"Covardia. Ou sabedoria? Ambos, talvez."</b> Algo é jogado em seus pés.',
    choices:[
      {txt:'Pegar o que ela jogou',hint:'Risco desconhecido',fn:'oracle_f_take'},
      {txt:'Continuar correndo',hint:'Garantidamente seguro',fn:'oracle_f_run'},
    ]
  },
  // Fase 3 — Oráculo
  oracle_b_absorb:{
    ico:'💫',title:'A Oráculo — Revelação Final',
    body:'A dor é real — como fogo dentro do crânio. Mas depois vem a clareza. Você vê o mapa do andar. Os inimigos. O chefe. Tudo por um instante.',
    resolve:(sc)=>{
      const d=r(15)+8;G.hp=Math.max(1,G.hp-d);
      G.mpRegen+=3;
      const g=r(25)+15;addGold(g);
      outcome(sc,'crit','💫','Visão Obtida',
        `A oráculo abriu sua mente. Doloroso. Necessário.`,
        [{c:'dmg',t:'-'+d+' HP'},{c:'mp',t:'+3 MP/sala'},{c:'gold',t:'+'+g+'💰'}],'curse');
    }
  },
  oracle_b_reject:{
    ico:'🔮',title:'A Oráculo — Rejeição',
    body:'Você fecha a mente. Ela franze os lábios. Sem palavras, deposita um pequeno cristal em sua mão e desaparece.',
    resolve:(sc)=>{
      const it=randItemByRarity('rare+');addItemToInv(it);
      outcome(sc,'win','🔮','Cristal da Oráculo',
        `Você saiu intacto. Ainda assim, ela deixou algo.`,
        [{c:'item '+it.rarity,t:it.ico+' '+it.name}]);
    }
  },
  oracle_g_power:{
    ico:'⚡',title:'A Oráculo — Transferência',
    body:'Ela estende as mãos e uma descarga te atinge no peito. Depois silêncio. Você se sente diferente — mais forte, mais frágil.',
    resolve:(sc)=>{
      G.mag+=4;G.atk+=3;G.hpMax=Math.max(20,G.hpMax-10);G.hp=Math.min(G.hp,G.hpMax);
      outcome(sc,'crit','⚡','Poder Transferido',
        `Força arcana flui em você. O preço foi pago em sangue.`,
        [{c:'xp',t:'+4 MAG +3 ATK'},{c:'dmg',t:'-10 HP MAX'}],'curse');
    }
  },
  oracle_g_info:{
    ico:'📜',title:'A Oráculo — Segredos',
    body:'Ela sussurra detalhes sobre o próximo chefe. Fraquezas, padrões, o momento exato do ataque especial. Conhecimento é poder.',
    resolve:(sc)=>{
      G.passives.push('oracle_insight');
      const g=r(15)+10;addGold(g);
      outcome(sc,'win','📜','Sabedoria Comprada',
        `Você conhece seu inimigo antes de enfrentá-lo. A barra de prontidão do chefe começa mais lenta.`,
        [{c:'gold',t:'+'+g+'💰'},{c:'xp',t:'🎯 Insight do Oráculo'}]);
    }
  },
  oracle_f_take:{
    ico:'📦',title:'A Oráculo — O Presente',
    body:'Um embrulho escuro. Pode ser qualquer coisa — bênção ou maldição.',
    resolve:(sc)=>{
      if(Math.random()<0.6){const it=randItemByRarity('rare+');addItemToInv(it);outcome(sc,'win','🎁','Presente Inesperado','A oráculo era generosa, afinal.',[{c:'item '+it.rarity,t:it.ico+' '+it.name}]);}
      else{const d=r(20)+10;G.hp=Math.max(0,G.hp-d);screenShake();outcome(sc,'lose','☠️','Armadilha','A maldição te atinge em cheio.',[{c:'dmg',t:'-'+d+' HP'}],'curse');}
    }
  },
  oracle_f_run:{
    ico:'💨',title:'A Oráculo — Fuga',
    body:'Você corre. O riso dela ecoa, mas nada te atinge. Às vezes a melhor decisão é simplesmente sair.',
    resolve:(sc)=>{outcome(sc,'neutral','💨','Fugiu em Paz','A sabedoria está em saber quando recuar.',[],'abandon');}
  },

  // ── RUÍNAS ──
  ruins_dive:{
    ico:'🏛️',title:'Ruínas — Fase 2: Câmara Alagada',
    body:'Água fria até os joelhos. Na câmara submersa, estantes cobertas de musgo guardam objetos envoltos em luz. Mas o chão cede — você percebe que há algo se movendo abaixo.',
    choices:[
      {txt:'Pegar rapidamente e sair',hint:'Velocidade é essencial',fn:'ruins_d_fast'},
      {txt:'Mergulhar completamente para explorar',hint:'Alto risco, alta recompensa',fn:'ruins_d_deep'},
    ]
  },
  ruins_climb:{
    ico:'🏛️',title:'Ruínas — Fase 2: Escada Estreita',
    body:'Pedras rangem a cada passo. Você chega a uma plataforma. Há um altar intacto — e uma passagem lateral que leva ao exterior.',
    choices:[
      {txt:'Usar o altar',hint:'Oferenda de HP por bênção',fn:'ruins_c_altar'},
      {txt:'Tomar a passagem lateral',hint:'Pode encurtar o andar',fn:'ruins_c_skip'},
    ]
  },
  ruins_read:{
    ico:'🏛️',title:'Ruínas — Fase 2: Inscrições',
    body:'Você decifra fragmentos: uma advertência sobre a criatura no subsolo, e as coordenadas de uma câmara secreta que contém o que os construtores chamavam de "o dom eterno".',
    choices:[
      {txt:'Procurar a câmara secreta',hint:'Vai custar tempo e HP',fn:'ruins_r_secret'},
      {txt:'Usar o conhecimento para evitar perigos',hint:'Bônus passivo neste andar',fn:'ruins_r_wisdom'},
    ]
  },
  // Fase 3 — Ruínas
  ruins_d_fast:{
    ico:'💧',title:'Ruínas — Resultado',
    body:'Você pega dois objetos antes da criatura emergir. O frio te acompanha por um tempo.',
    resolve:(sc)=>{
      const it=randItemByRarity('rare+');addItemToInv(it);
      const g=r(20)+15;addGold(g);
      const d=r(8)+4;G.hp=Math.max(0,G.hp-d);
      outcome(sc,'win','💧','Saque Rápido','Rápido o suficiente. Desta vez.',[{c:'item '+it.rarity,t:it.ico+' '+it.name},{c:'gold',t:'+'+g+'💰'},{c:'dmg',t:'-'+d+' HP'}]);
    }
  },
  ruins_d_deep:{
    ico:'🌊',title:'Ruínas — Mergulho Profundo',
    body:'Você encontra uma câmara selada com a mão de um mago morto ainda agarrada a algo precioso.',
    resolve:(sc)=>{
      if(Math.random()<0.55){
        const it=randItemByRarity('rare+');addItemToInv(it);const it2=randItemByRarity('weighted');addItemToInv(it2);
        outcome(sc,'crit','🌊','Tesouro Duplo!','Valeu o risco. Desta vez.',[{c:'item '+it.rarity,t:it.ico+' '+it.name},{c:'item '+it2.rarity,t:it2.ico+' '+it2.name}],'item_rare');
      }else{
        const d=r(25)+15;G.hp=Math.max(0,G.hp-d);screenShake();
        outcome(sc,'lose','🦑','Criatura!','Algo te agarra nas profundezas.',[{c:'dmg',t:'-'+d+' HP'}],'lose_hp');
      }
    }
  },
  ruins_c_altar:{
    ico:'⛩️',title:'Ruínas — Altar das Ruínas',
    body:'O altar aceita sua oferenda e pulsa três vezes. Uma bênção de DEF e regeneração toca seu corpo.',
    resolve:(sc)=>{
      const d=r(12)+8;G.hp=Math.max(0,G.hp-d);
      G.def+=3;G.passives.push('regen');
      outcome(sc,'win','⛩️','Abençoado','O altar foi gracioso.',[{c:'dmg',t:'-'+d+' HP'},{c:'xp',t:'+3 DEF + Regen'}]);
    }
  },
  ruins_c_skip:{
    ico:'🚪',title:'Ruínas — Passagem Secreta',
    body:'A passagem leva a uma área já explorada... com um baú esquecido no canto.',
    resolve:(sc)=>{showChestGame(sc);}
  },
  ruins_r_secret:{
    ico:'🗝️',title:'Ruínas — Câmara Secreta',
    body:'A câmara existe. E o dom eterno também — um elemento raro gravado em cristal.',
    resolve:(sc)=>{
      const d=r(18)+10;G.hp=Math.max(0,G.hp-d);
      const elPool=ELEMENTS.filter(e=>!G.elements.some(x=>x.id===e.id)&&e.tier<=2);
      if(elPool.length){const el=pick(elPool);G.elements.push({...el});toast(`${el.ico} ${el.name} descoberto!`,2500);
        outcome(sc,'crit','🗝️','Dom Eterno','Um elemento raro foi seu.',[{c:'dmg',t:'-'+d+' HP'},{c:'item epic',t:el.ico+' '+el.name}],'item_rare');
      }else{const it=randItemByRarity('rare+');addItemToInv(it);outcome(sc,'win','🗝️','Câmara Saqueada','Os elementos já eram seus. Mas havia outros tesouros.',[{c:'dmg',t:'-'+d+' HP'},{c:'item '+it.rarity,t:it.ico+' '+it.name}]);}
    }
  },
  ruins_r_wisdom:{
    ico:'📜',title:'Ruínas — Sabedoria Aplicada',
    body:'Você usa as inscrições para navegar com segurança. Armadilhas evitadas. Tempo poupado.',
    resolve:(sc)=>{
      G.passives.push('ruins_wisdom');// bônus: próximo combate com vantagem
      const g=r(20)+10;addGold(g);
      outcome(sc,'win','📜','Navegação Segura','Conhecimento como escudo.',[{c:'gold',t:'+'+g+'💰'},{c:'xp',t:'🛡️ Vantagem no próximo combate'}]);
    }
  },

  // ── PRISIONEIRO ──
  prisoner_force:{
    ico:'⛓️',title:'Prisioneiro — Fase 2: Libertado',
    body:'A porta cede com um golpe. O mago sai cambaleando. <b>"Obrigado. Tenho algo para você — mas me dê um momento."</b>',
    choices:[
      {txt:'Esperar pacientemente',hint:'Você confia nele',fn:'prisoner_f_wait'},
      {txt:'Exigir agora — sem paciência',hint:'Pode ir mal',fn:'prisoner_f_demand'},
    ]
  },
  prisoner_search:{
    ico:'⛓️',title:'Prisioneiro — Fase 2: A Chave',
    body:'Você encontra a chave num guarda morto próximo. Abre a cela. O mago toca seu ombro. <b>"Você escolheu a forma certa."</b>',
    choices:[
      {txt:'Receber a recompensa com gratidão',hint:'Bônus garantido',fn:'prisoner_s_accept'},
      {txt:'Pedir informações sobre o andar',hint:'Pode valer mais',fn:'prisoner_s_info'},
    ]
  },
  prisoner_ignore:{
    ico:'⛓️',title:'Prisioneiro — Fase 2: O Grito',
    body:'Você parte. Um grito oco te segue. Mais adiante, você encontra marcas de batalha no chão — este homem esteve aqui antes. E deixou algo.',
    choices:[
      {txt:'Examinar as marcas',hint:'Pode encontrar algo',fn:'prisoner_i_search'},
      {txt:'Continuar ignorando',hint:'Seguro, mas vazio',fn:'prisoner_i_pass'},
    ]
  },
  // Fase 3 — Prisioneiro
  prisoner_f_wait:{
    ico:'🧙',title:'Prisioneiro — Gratidão Verdadeira',
    body:'O mago retorna suas forças e te presenteia com um encantamento que ele carregava há anos.',
    resolve:(sc)=>{
      const it=randItemByRarity('rare+');addItemToInv(it);
      G.mp=Math.min(G.mpMax,G.mp+30);
      outcome(sc,'win','🧙','Recompensado','A paciência tem seu preço. E sua recompensa.',[{c:'item '+it.rarity,t:it.ico+' '+it.name},{c:'mp',t:'+30 MP'}],'help');
    }
  },
  prisoner_f_demand:{
    ico:'😤',title:'Prisioneiro — Confronto',
    body:'O mago recua, assustado, e lança um feitiço defensivo antes de fugir. Você leva o impacto.',
    resolve:(sc)=>{
      const d=r(18)+8;G.hp=Math.max(0,G.hp-d);screenShake();
      const g=r(15)+5;addGold(g); // ele jogou moedas ao fugir
      outcome(sc,'lose','😤','Mal Recebido','Às vezes a pressa nos custia o prêmio.',[{c:'dmg',t:'-'+d+' HP'},{c:'gold',t:'+'+g+'💰'}],'abandon');
    }
  },
  prisoner_s_accept:{
    ico:'🧙',title:'Prisioneiro — Dom do Mago',
    body:'Ele encanta suas mãos. MAG permanentemente maior.',
    resolve:(sc)=>{
      G.mag+=5;const g=r(20)+15;addGold(g);
      outcome(sc,'crit','🧙','Encantamento','A magia do mago flui em você.',[{c:'xp',t:'+5 MAG'},{c:'gold',t:'+'+g+'💰'}],'help');
    }
  },
  prisoner_s_info:{
    ico:'📜',title:'Prisioneiro — Mapa do Andar',
    body:'Ele rabisca um mapa de memória. Rotas seguras, armadilhas, salas de descanso.',
    resolve:(sc)=>{
      G.mpRegen+=2;G.def+=2;
      outcome(sc,'win','📜','Mapa Cedido','O conhecimento local é uma arma.',[{c:'xp',t:'+2 DEF'},{c:'mp',t:'+2 MP/sala'}]);
    }
  },
  prisoner_i_search:{
    ico:'🗡️',title:'Prisioneiro — Rastro de Batalha',
    body:'Nas marcas você encontra uma faca bem escondida e uma nota críptica com um número: "Sala 7".',
    resolve:(sc)=>{
      const it=randItemByRarity('weighted');addItemToInv(it);
      outcome(sc,'win','🗡️','Achado','O passado deixa pistas.',[{c:'item '+it.rarity,t:it.ico+' '+it.name}]);
    }
  },
  prisoner_i_pass:{
    ico:'💔',title:'Prisioneiro — Silêncio',
    body:'Você não olha para trás. O andar continua. Apenas isso.',
    resolve:(sc)=>{outcome(sc,'neutral','💔','Seguiu em Frente','Às vezes não há recompensa.',[],'abandon');}
  },
};

function showChainStep(sc, stepKey){
  const step=CHAIN_STEPS[stepKey];
  if(!step){nextRoom();return;}
  // Se tem resolve() é etapa final
  if(step.resolve){step.resolve(sc);return;}
  // Senão é etapa intermediária — renderiza nova tela de escolhas
  sc.innerHTML='';
  const card=mkCard('story');
  card.innerHTML=`
    <div class="ctag"><div class="ctag-dot" style="background:#9b59b6"></div><span class="ctag-txt" style="color:#9b59b6">EVENTO — ETAPA 2</span></div>
    <div class="ctitle">${step.ico} ${step.title}</div>
    <div class="cbody">${step.body}</div>
    <div class="choices" id="chain-choices"></div>`;
  sc.appendChild(card);
  const cw=card.querySelector('#chain-choices');
  step.choices.forEach((ch,i)=>{
    const canDo=!ch.cost||canAfford(ch.cost);
    const btn=document.createElement('button');btn.className='chbtn';btn.disabled=!canDo;
    btn.innerHTML=`<span class="chkey">${i+1}</span>
      <div class="chinner"><span class="chtxt">${ch.txt}</span>
      ${ch.hint?`<span class="chhint">${ch.hint}</span>`:''}</div>`;
    btn.onclick=()=>{
      card.querySelectorAll('.chbtn').forEach(b=>{b.disabled=true;b.style.opacity=b===btn?'1':'0.25';b.style.transform='none';});
      btn.style.borderColor='rgba(200,168,75,.6)';btn.style.background='rgba(200,168,75,.08)';
      if(ch.cost)payCost(ch.cost);
      // Vai direto para a etapa final (fase 3)
      showChainStep(sc,ch.fn);
    };
    cw.appendChild(btn);
  });
  scrollBot(sc);
}


/* ═══════════════════════════════════════════════════════
   FERREIRO
═══════════════════════════════════════════════════════ */

function openSmith(sc){
  // Reabre o ferreiro
  showEvent(EVENTS.find(e=>e.id==='blacksmith'),sc);
}

// ─── Melhorar item equipado ───
function smithUpgrade(){
  const sc=$('scroll');
  const equipped=Object.entries(G.equipped||{}).filter(([slot,it])=>it&&it.bonus);
  if(!equipped.length){toast('Nenhum item equipado para melhorar!');return;}

  const costs={common:30,rare:60,epic:100,legendary:150};
  const gains={common:2,rare:3,epic:4,legendary:5};

  const card=document.createElement('div');card.className='card esh';
  const rows=equipped.map(([slot,it])=>{
    const cost=costs[it.rarity]||60;
    const gain=gains[it.rarity]||2;
    const canBuy=G.gold>=cost;
    const mainStat=Object.keys(it.bonus||{})[0]||'atk';
    return `<div class="special-merch-item ${canBuy?'':'disabled'}" style="opacity:${canBuy?1:.5}" onclick="${canBuy?`doSmithUpgrade('${slot}',${cost},${gain},'${mainStat}')`:''}">
      <span style="font-size:22px;">${it.ico}</span>
      <div style="flex:1;">
        <div style="font-family:var(--cinzel);font-size:12px;color:var(--${it.rarity});">${it.name}</div>
        <div style="font-size:11px;color:var(--txt2);">+${gain} no stat principal</div>
      </div>
      <div style="text-align:right;">
        <div style="font-family:var(--cinzel);font-size:13px;color:var(--gold);">💰${cost}</div>
        <div style="font-size:10px;color:${canBuy?'var(--grn2)':'var(--red2)'};">${canBuy?'Disponível':'Sem ouro'}</div>
      </div>
    </div>`;
  }).join('');

  card.innerHTML=`
    <div class="ctag"><div class="ctag-dot" style="background:#e67e22"></div><span class="ctag-txt" style="color:#e67e22">MELHORAR ITEM</span></div>
    <div class="ctitle">⚒️ Fortalecer Equipamento</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin:14px 0;">${rows||'<div style="color:var(--txt2);font-size:12px;">Nenhum item equipado.</div>'}</div>
    <button class="btn-next" onclick="openSmith($('scroll'))">← Voltar ao Ferreiro</button>`;
  sc.innerHTML='';sc.appendChild(card);scrollBot(sc);
}

function doSmithUpgrade(slot,cost,gain,stat){
  if(G.gold<cost){toast('Ouro insuficiente!');return;}
  const it=G.equipped[slot];if(!it)return;
  G.gold-=cost;
  it.bonus=it.bonus||{};
  it.bonus[stat]=(it.bonus[stat]||0)+gain;
  // aplica bônus direto no player
  if(stat==='atk')G.atk+=gain;
  else if(stat==='def')G.def+=gain;
  else if(stat==='mag')G.mag+=gain;
  else if(stat==='spd')G.spd+=gain;
  else if(stat==='hp'||stat==='hpMax'){G.hpMax+=gain;G.hp=Math.min(G.hp+gain,G.hpMax);}
  else if(stat==='mp'||stat==='mpMax'){G.mpMax+=gain;G.mp=Math.min(G.mp+gain,G.mpMax);}
  it.desc=(it.desc||'')+` [+${gain}]`;
  upd();
  toast(`⚒️ ${it.name} fortalecido! +${gain} ${stat.toUpperCase()}`,2500);
  smithUpgrade();
}

// ─── Fundir dois itens ───
function smithFuse(){
  const sc=$('scroll');
  if(G.inv.length<2){toast('Precisa de pelo menos 2 itens no inventário!');return;}
  G._smithFuseSelected=[];

  const card=document.createElement('div');card.className='card esh';
  card.id='smith-fuse-card';

  function renderFuseCard(){
    const rows=G.inv.slice(0,12).map((it,i)=>{
      const sel=G._smithFuseSelected.includes(i);
      return `<div class="special-merch-item" id="sfuse-${i}" style="border-color:${sel?'var(--acc)':'var(--brd2)'};background:${sel?'rgba(200,130,75,.12)':'transparent'};cursor:pointer;" onclick="toggleSmithFuse(${i})">
        <span style="font-size:20px;">${it.ico}</span>
        <div style="flex:1;"><div style="font-family:var(--cinzel);font-size:11px;color:var(--${it.rarity});">${it.name}</div>
        <div style="font-size:10px;color:var(--txt2);">${it.desc||''}</div></div>
        ${sel?'<span style="color:var(--acc);font-size:18px;">✓</span>':''}
      </div>`;
    }).join('');

    const canFuse=G._smithFuseSelected.length===2;
    card.innerHTML=`
      <div class="ctag"><div class="ctag-dot" style="background:#e67e22"></div><span class="ctag-txt" style="color:#e67e22">FUNDIR ITENS</span></div>
      <div class="ctitle">⚒️ Fusão de Itens</div>
      <div style="font-size:11px;color:var(--txt2);margin-bottom:10px;">Selecione 2 itens para fundir. O resultado combina os stats de ambos com raridade elevada.</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">${rows}</div>
      <button class="btn-next" style="margin-bottom:8px;${canFuse?'':'opacity:.4;pointer-events:none;'}" onclick="doSmithFuse()">⚒️ Fundir (80💰)</button>
      <button class="btn-next" style="background:transparent;border-color:var(--brd2);color:var(--txt2);" onclick="openSmith($('scroll'))">← Voltar</button>`;
  }

  renderFuseCard();
  sc.innerHTML='';sc.appendChild(card);scrollBot(sc);
  G._renderFuseCard=renderFuseCard;
}

function toggleSmithFuse(i){
  const sel=G._smithFuseSelected;
  const idx=sel.indexOf(i);
  if(idx>=0) sel.splice(idx,1);
  else if(sel.length<2) sel.push(i);
  else { sel.shift();sel.push(i); }
  if(G._renderFuseCard) G._renderFuseCard();
}

function doSmithFuse(){
  if(G._smithFuseSelected.length!==2){toast('Selecione 2 itens!');return;}
  if(G.gold<80){toast('Ouro insuficiente!');return;}
  const [i1,i2]=G._smithFuseSelected.sort((a,b)=>b-a);
  const it1=G.inv[i1],it2=G.inv[Math.min(i2,G.inv.length-1)];
  if(!it1||!it2){toast('Erro ao selecionar itens.');return;}

  G.gold-=80;
  // Remove os dois itens (maior índice primeiro)
  G.inv.splice(i1,1);
  const newI2=i2<i1?i2:i2-1;
  if(newI2>=0&&newI2<G.inv.length) G.inv.splice(newI2,1);

  // Combina stats
  const rarOrder=['common','uncommon','rare','epic','legendary'];
  const r1=rarOrder.indexOf(it1.rarity)||0,r2=rarOrder.indexOf(it2.rarity)||0;
  const newRar=rarOrder[Math.min(Math.max(r1,r2)+1,4)];
  const b1=it1.bonus||{},b2=it2.bonus||{};
  const newBonus={};
  [...new Set([...Object.keys(b1),...Object.keys(b2)])].forEach(k=>{
    newBonus[k]=Math.round(((b1[k]||0)+(b2[k]||0))*0.75);
  });
  const fusedItem={
    id:'fused_'+r(99999),
    name:`${it1.name.split(' ')[0]}+${it2.name.split(' ')[0]}`,
    ico:`${it1.ico}${it2.ico}`,
    rarity:newRar,
    slot:it1.slot||it2.slot||null,
    uses:null,
    bonus:newBonus,
    desc:'Fusão: '+Object.entries(newBonus).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(' '),
  };
  addItemToInv(fusedItem);
  upd();
  toast(`⚒️ Fusão criada: ${fusedItem.name}!`,2500);
  G._smithFuseSelected=[];
  smithFuse();
}

// ─── Reparar item maldito ───
function smithRepair(){
  const sc=$('scroll');
  const cursed=G.inv.filter(it=>it.bonus&&Object.values(it.bonus).some(v=>v<0));
  if(!cursed.length){toast('Nenhum item com penalidades no inventário!');return;}

  const card=document.createElement('div');card.className='card esh';
  const rows=cursed.map((it,i)=>{
    const negStats=Object.entries(it.bonus).filter(([k,v])=>v<0).map(([k,v])=>`${k.toUpperCase()} ${v}`).join(', ');
    return `<div class="special-merch-item" onclick="doSmithRepair('${it.id}')">
      <span style="font-size:20px;">${it.ico}</span>
      <div style="flex:1;"><div style="font-family:var(--cinzel);font-size:11px;color:var(--${it.rarity});">${it.name}</div>
      <div style="font-size:10px;color:var(--red2);">Penalidades: ${negStats}</div></div>
      <div style="font-family:var(--cinzel);font-size:12px;color:var(--gold);">💰50</div>
    </div>`;
  }).join('');

  card.innerHTML=`
    <div class="ctag"><div class="ctag-dot" style="background:#e67e22"></div><span class="ctag-txt" style="color:#e67e22">REPARAR ITEM</span></div>
    <div class="ctitle">⚒️ Remover Penalidades</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin:14px 0;">${rows}</div>
    <button class="btn-next" style="background:transparent;border-color:var(--brd2);color:var(--txt2);" onclick="openSmith($('scroll'))">← Voltar</button>`;
  sc.innerHTML='';sc.appendChild(card);scrollBot(sc);
}

function doSmithRepair(id){
  if(G.gold<50){toast('Ouro insuficiente!');return;}
  const it=G.inv.find(i=>i.id===id);if(!it)return;
  G.gold-=50;
  let fixed=0;
  Object.keys(it.bonus).forEach(k=>{if(it.bonus[k]<0){fixed++;it.bonus[k]=0;}});
  it.desc=(it.desc||'').replace(/-\d+ \w+/g,'').trim()+' [Reparado]';
  upd();
  toast(`⚒️ ${it.name} reparado! ${fixed} penalidade(s) removida(s).`,2500);
  smithRepair();
}

// ─── Craftar item novo ───
function smithCraft(){
  const sc=$('scroll');
  if(G.gold<70){toast('Ouro insuficiente! (70💰)');return;}

  const slots=['weapon','chest','head','feet'];
  const card=document.createElement('div');card.className='card esh';
  const rows=slots.map(slot=>{
    const ico={weapon:'⚔️',chest:'🛡️',head:'⛑️',feet:'👟'}[slot];
    const lbl={weapon:'Arma',chest:'Armadura',head:'Elmo',feet:'Botas'}[slot];
    return `<div class="special-merch-item" onclick="doSmithCraft('${slot}')">
      <span style="font-size:22px;">${ico}</span>
      <div style="flex:1;"><div style="font-family:var(--cinzel);font-size:12px;color:var(--acc);">${lbl}</div>
      <div style="font-size:11px;color:var(--txt2);">Raridade baseada no Andar ${G.floor}</div></div>
      <div style="font-family:var(--cinzel);font-size:13px;color:var(--gold);">💰70</div>
    </div>`;
  }).join('');

  card.innerHTML=`
    <div class="ctag"><div class="ctag-dot" style="background:#e67e22"></div><span class="ctag-txt" style="color:#e67e22">CRAFTAR ITEM</span></div>
    <div class="ctitle">⚒️ Forjar Novo Item</div>
    <div style="font-size:11px;color:var(--txt2);margin-bottom:10px;">Escolha o tipo. O ferreiro forja com materiais do andar atual.</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin:14px 0;">${rows}</div>
    <button class="btn-next" style="background:transparent;border-color:var(--brd2);color:var(--txt2);" onclick="openSmith($('scroll'))">← Voltar</button>`;
  sc.innerHTML='';sc.appendChild(card);scrollBot(sc);
}

function doSmithCraft(slot){
  if(G.gold<70){toast('Ouro insuficiente!');return;}
  G.gold-=70;

  // Raridade baseada no andar
  const rarRoll=Math.random();
  const rarity= G.floor>=6 ? (rarRoll<.15?'legendary':rarRoll<.5?'epic':'rare')
              : G.floor>=4 ? (rarRoll<.08?'legendary':rarRoll<.35?'epic':'rare')
              : G.floor>=2 ? (rarRoll<.04?'legendary':rarRoll<.2?'epic':rarRoll<.55?'rare':'common')
              :               (rarRoll<.1?'rare':rarRoll<.4?'common':'common');

  // Gera stats baseados no slot e raridade
  const statMult={common:1,rare:1.6,epic:2.4,legendary:3.5}[rarity]||1;
  const base=Math.round((3+G.floor)*statMult);
  const bonusMap={
    weapon:{atk:base,crit:Math.round(base*.01*100)/100},
    chest: {def:base,hp:base*2},
    head:  {def:Math.round(base*.7),hp:base},
    feet:  {spd:Math.round(base*.5),dodge:Math.round(base*.005*100)/100},
  };
  const names={
    weapon:{common:'Espada Forjada',rare:'Lâmina Temperada',epic:'Lâmina do Ferreiro',legendary:'Obra-Prima do Ferreiro'},
    chest: {common:'Armadura Forjada',rare:'Cota Temperada',epic:'Armadura do Artesão',legendary:'Armadura Mestra'},
    head:  {common:'Elmo Forjado',rare:'Elmo Temperado',epic:'Elmo do Artesão',legendary:'Coroa do Mestre'},
    feet:  {common:'Botas Forjadas',rare:'Botas Temperadas',epic:'Botas do Artesão',legendary:'Botas Mestras'},
  };
  const icos={weapon:'⚔️',chest:'🛡️',head:'⛑️',feet:'👟'};
  const crafted={
    id:'crafted_'+r(99999),
    name:names[slot][rarity],
    ico:icos[slot],
    rarity,slot,uses:null,
    bonus:bonusMap[slot],
    desc:Object.entries(bonusMap[slot]).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(' ')+' [Forjado]',
  };
  addItemToInv(crafted);upd();
  toast(`⚒️ ${crafted.name} (${rarity}) forjado!`,2500);
  smithCraft();
}

// ─── Comprar/Vender ───
function smithTrade(){
  const sc=$('scroll');
  const card=document.createElement('div');card.className='card esh';
  card.id='smith-trade-card';

  // Pool de compra: itens aleatórios por andar
  if(!G._smithShopItems){
    const pool=ITEMS_POOL.filter(i=>i.rarity!=='legendary');
    G._smithShopItems=[...pool].sort(()=>Math.random()-.5).slice(0,5).map(i=>({
      ...i,
      price:({common:15,uncommon:25,rare:40,epic:65}[i.rarity]||30)+G.floor*5,
      id:'smith_buy_'+r(99999),
    }));
  }

  function renderTrade(){
    const buyRows=G._smithShopItems.map((it,i)=>{
      const canBuy=G.gold>=it.price&&G.inv.length<16;
      return `<div class="special-merch-item ${canBuy?'':'disabled'}" style="opacity:${canBuy?1:.5}" onclick="${canBuy?`doSmithBuy(${i})`:''}">
        <span style="font-size:20px;">${it.ico}</span>
        <div style="flex:1;"><div style="font-family:var(--cinzel);font-size:11px;color:var(--${it.rarity});">${it.name}</div>
        <div style="font-size:10px;color:var(--txt2);">${it.desc||''}</div></div>
        <div style="text-align:right;">
          <div style="font-family:var(--cinzel);font-size:12px;color:var(--gold);">💰${it.price}</div>
          <div style="font-size:10px;color:${canBuy?'var(--grn2)':'var(--red2)'};">${canBuy?'Comprar':'—'}</div>
        </div>
      </div>`;
    }).join('');

    const sellRows=G.inv.slice(0,12).map((it,i)=>{
      const sellPrice=Math.max(5,Math.round(({common:10,uncommon:18,rare:30,epic:50,legendary:90}[it.rarity]||15)*0.6));
      return `<div class="special-merch-item" onclick="doSmithSell(${i},${sellPrice})">
        <span style="font-size:20px;">${it.ico}</span>
        <div style="flex:1;"><div style="font-family:var(--cinzel);font-size:11px;color:var(--${it.rarity});">${it.name}</div>
        <div style="font-size:10px;color:var(--txt2);">${it.desc||''}</div></div>
        <div style="text-align:right;">
          <div style="font-family:var(--cinzel);font-size:12px;color:var(--gold);">💰${sellPrice}</div>
          <div style="font-size:10px;color:var(--grn2);">Vender</div>
        </div>
      </div>`;
    }).join('');

    card.innerHTML=`
      <div class="ctag"><div class="ctag-dot" style="background:#e67e22"></div><span class="ctag-txt" style="color:#e67e22">COMPRAR / VENDER</span></div>
      <div class="ctitle">⚒️ Mercadoria do Ferreiro</div>
      <div style="font-family:var(--cinzel);font-size:10px;color:var(--acc);margin:10px 0 6px;">— COMPRAR —</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">${buyRows||'<div style="color:var(--txt2);font-size:11px;">Sem estoque.</div>'}</div>
      <div style="font-family:var(--cinzel);font-size:10px;color:var(--acc);margin:10px 0 6px;">— VENDER (60% do valor) —</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">${sellRows||'<div style="color:var(--txt2);font-size:11px;">Inventário vazio.</div>'}</div>
      <button class="btn-next" style="background:transparent;border-color:var(--brd2);color:var(--txt2);" onclick="openSmith($('scroll'))">← Voltar</button>`;
  }

  renderTrade();
  sc.innerHTML='';sc.appendChild(card);scrollBot(sc);
  G._renderTradeCard=renderTrade;
}

function doSmithBuy(i){
  const it=G._smithShopItems&&G._smithShopItems[i];if(!it)return;
  if(G.gold<it.price){toast('Ouro insuficiente!');return;}
  if(G.inv.length>=16){toast('Mochila cheia!');return;}
  G.gold-=it.price;
  const copy={...it,id:'smithbuy_'+r(99999)};
  addItemToInv(copy);
  G._smithShopItems.splice(i,1);
  upd();toast(`${it.ico} ${it.name} comprado!`,2000);
  smithTrade();
}

function doSmithSell(i,price){
  const it=G.inv[i];if(!it)return;
  G.inv.splice(i,1);
  addGold(price);
  upd();toast(`💰 +${price} — ${it.name} vendido!`,2000);
  G._smithShopItems=null; // reseta loja ao vender
  smithTrade();
}

// ─── Handler de choices do ferreiro ───

/* ═══ MERCADOR ESPECIAL (andar 3+) ═══ */
function showSpecialMerchant(sc){
  G.specialMerchantSeen=true;
  sc.innerHTML='';
  const card=mkCard('shop');
  // Gera 3 itens lendários/épicos e 2 elementos raros para venda
  const legendaryItems=ITEMS_POOL.filter(i=>['legendary','epic'].includes(i.rarity));
  const shopItems=[
    ...[...legendaryItems].sort(()=>Math.random()-.5).slice(0,3).map(i=>({...i,price:i.rarity==='legendary'?120:75})),
  ];
  const elPool=ELEMENTS.filter(e=>!G.elements.some(x=>x.id===e.id)&&e.tier<=2).sort(()=>Math.random()-.5).slice(0,2);
  const elItems=elPool.map(e=>({isElement:true,el:e,name:e.name,ico:e.ico,rarity:'epic',price:90,desc:'Tier '+e.tier+' — '+e.desc}));
  const allItems=[...shopItems,...elItems];

  let itemsHtml=allItems.map((it,i)=>{
    const canBuy=G.gold>=it.price;
    const rarColor={legendary:'var(--legendary)',epic:'var(--epic)',rare:'var(--rare)'}[it.rarity]||'var(--acc)';
    return `<div class="special-merch-item ${canBuy?'':'disabled'}" id="smi-${i}" onclick="buySpecialItem(${i})">
      <span style="font-size:22px;">${it.ico}</span>
      <div style="flex:1;">
        <div style="font-family:var(--cinzel);font-size:12px;color:${rarColor};">${it.name}</div>
        <div style="font-size:11px;color:var(--txt2);font-style:italic;">${it.desc}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-family:var(--cinzel);font-size:13px;color:var(--gold);">💰${it.price}</div>
        <div style="font-size:10px;color:${canBuy?'var(--grn)':'var(--red2)'};">${canBuy?'Disponível':'Sem ouro'}</div>
      </div>
    </div>`;
  }).join('');

  card.innerHTML=`
    <div class="ctag"><div class="ctag-dot" style="background:var(--gold)"></div><span class="ctag-txt" style="color:var(--gold)">MERCADOR LENDÁRIO</span></div>
    <div class="ctitle">🧿 Bartholomew, o Coleccionador</div>
    <div class="cillo">🧿</div>
    <div class="cbody">Uma figura encurvada sob mantos dourados. <b>"Não apareço sempre. Hoje sim. Seu ouro, meu tesouro — troca justa, não?"</b><br><br><span style="font-size:10px;color:var(--gold);font-family:var(--cinzel);">— Aparece apenas uma vez por run —</span></div>
    <div id="smerch-items" style="display:flex;flex-direction:column;gap:8px;margin:14px 0;">${itemsHtml}</div>
    <button class="btn-next" onclick="nextRoom()">Dispensar e seguir →</button>`;
  sc.appendChild(card);
  // Guarda os itens no estado temporário para compra
  G._specialMerchItems=allItems;
  scrollBot(sc);
}

function buySpecialItem(i){
  const it=G._specialMerchItems&&G._specialMerchItems[i];
  if(!it)return;
  if(G.gold<it.price){toast('Ouro insuficiente!');return;}
  G.gold-=it.price;upd();
  if(it.isElement){
    if(G.elements.some(e=>e.id===it.el.id)){toast('Elemento já conhecido!');return;}
    G.elements.push({...it.el});
    toast(`${it.ico} ${it.name} aprendido!`,2500);
  } else {
    const copy={...it,id:'smerch_'+r(99999)};
    addItemToInv(copy);applyBonus(copy);
    toast(`${it.ico} ${it.name} adquirido!`,2200);
  }
  // Remove item do grid
  const el=$('smi-'+i);if(el){el.style.opacity='0.3';el.style.pointerEvents='none';el.querySelector&&(el.style.textDecoration='line-through');}
}

/* ═══ SUBCLASS ═══ */
function renderSubclass(sc){
  sc.innerHTML='';
  const card=mkCard('explore');
  card.innerHTML=`
    <div class="ctag"><div class="ctag-dot" style="background:#9b59b6"></div><span class="ctag-txt" style="color:#9b59b6">SUBCLASSE DESBLOQUEADA</span></div>
    <div class="lvup-title">🌟 Escolha seu Caminho</div>
    <div class="lvup-sub">"${narr('subclass')}"</div>
    <div class="subcls-grid" id="subcls-grid"></div>`;
  sc.appendChild(card);
  G.cls.subclasses.forEach(s=>{
    const d=document.createElement('div');d.className=`subcls-card ${s.key}`;
    d.innerHTML=`<div class="subcls-ico">${s.ico}</div><div class="subcls-name">${s.name}</div><div class="subcls-desc">${s.desc}</div><div class="subcls-bonus">${s.bonus}</div>`;
    d.onclick=()=>{G.subclass=s;s.fn(G);upd();logRun('🌟',`Subclasse: ${s.name}`,'win');sfx('subclass');toast('🌟 '+s.name+' desbloqueado!',2500);lvFlash();nextRoom();};
    card.querySelector('#subcls-grid').appendChild(d);
  });
}

/* ═══ LEVEL UP ═══ */
function renderLevelUp(sc){
  sc.innerHTML='';lvFlash();
  const card=mkCard('explore');
  const bonus=G.bonusUpgrades||0;
  const count=3+bonus;
  if(bonus>0){G.bonusUpgrades=0;toast('⭐ Fragmento de Estrela: +1 opção de talento!',2000);}
  const pool=[...UPGRADES].sort(()=>Math.random()-.5).slice(0,count);
  const tlbls={off:'Ofensivo',def:'Defensivo',magic:'Mágico',util:'Utilitário'};
  card.innerHTML=`
    <div class="ctag"><div class="ctag-dot" style="background:var(--gold2)"></div><span class="ctag-txt" style="color:var(--gold2)">SUBIU DE NÍVEL</span></div>
    <div class="lvup-title">⬆ Nível ${G.level}!</div>
    <div class="lvup-sub">"${narr('levelup')}"</div>
    <div class="upgrid" id="upgrid"></div>`;
  sc.appendChild(card);
  pool.forEach(u=>{
    const b=document.createElement('div');b.className='upcard';
    b.innerHTML=`<div class="up-ico">${u.ico}</div><div class="up-name">${u.name}</div><div class="up-desc">${u.desc}</div><span class="uptag ${u.tag}">${tlbls[u.tag]||u.tag}</span>`;
    b.onclick=()=>{u.fn(G);upd();toast('✨ '+u.name+'!');G.upgrades.push(u.name);if(pendingSubclass){pendingSubclass=false;renderSubclass($('scroll'));return;}nextRoom();};
    card.querySelector('#upgrid').appendChild(b);
  });
}

/* ═══ STATUS DE COMBATE ═══ */
// Estrutura de status: {poison, burn, freeze} com turns e dmg
// Aplicável a CE (inimigo) e G (jogador) — acumulam simultaneamente

function applyStatus(target, type, turns, dmg){
  // type: 'poison'|'burn'|'freeze'
  // acumula — não sobrescreve, soma turnos se já ativo
  if(type==='poison'){
    target.poisonTurns=(target.poisonTurns||0)+turns;
    target.poisonDmg=Math.max(target.poisonDmg||0, dmg); // usa o maior dano
  } else if(type==='burn'){
    target.burnTurns=(target.burnTurns||0)+turns;
    target.burnDmg=Math.max(target.burnDmg||0, dmg);
  } else if(type==='freeze'){
    target.freezeTurns=(target.freezeTurns||0)+turns;
    // congelamento não tem dmg, só efeito de chance de pular turno
  }
}

function tickStatusOnEnemy(){
  if(!CE)return;
  let died=false;
  // Veneno
  if(CE.poisonTurns>0){
    CE.hpCur=Math.max(0,CE.hpCur-CE.poisonDmg);
    CE.poisonTurns--;
    clog(`🐍 Veneno: -${CE.poisonDmg} HP em ${CE.name}. (${CE.poisonTurns} rest.)`,CE.hpCur<=0?'ls':'li');
    if(CE.hpCur<=0){died=true;}
  }
  // Queimadura
  if(!died&&CE.burnTurns>0){
    CE.hpCur=Math.max(0,CE.hpCur-CE.burnDmg);
    // queimadura não expira por turno — só ao fim do combate
    clog(`🔥 Queimadura: -${CE.burnDmg} HP em ${CE.name}.`,CE.hpCur<=0?'ls':'li');
    if(CE.hpCur<=0){died=true;}
  }
  return died;
}

function tickStatusOnPlayer(){
  let msgs=[];
  // Veneno no jogador
  if(G.poisonTurns>0){
    const d=G.poisonDmg||3;
    G.hp=Math.max(0,G.hp-d);
    G.poisonTurns--;
    msgs.push(`🐍 Veneno: -${d} HP. (${G.poisonTurns} rest.)`);
  }
  // Queimadura no jogador (permanente até fim do combate)
  if(G.burnTurns>0){
    const d=G.burnDmg||4;
    G.hp=Math.max(0,G.hp-d);
    msgs.push(`🔥 Queimadura: -${d} HP.`);
  }
  // Congelamento no jogador
  if(G.freezeTurns>0){
    G.freezeTurns--;
    // efeito de congelamento tratado em enemyTurn
  }
  msgs.forEach(m=>clog(m,'le'));
  if(G.passives.includes('godmode'))G.hp=G.hpMax;
}

function clearCombatStatus(target){
  // Limpa ao fim do combate
  ['poisonTurns','poisonDmg','burnTurns','burnDmg','freezeTurns'].forEach(k=>delete target[k]);
  // Reseta carga elemental ao fim de cada combate
  if(target===G){G._elChargeEl=null;G._elChargeCount=0;}
}

function buildStatusBadges(target, isPlayer=false){
  // Retorna HTML dos badges de status ativos
  let html='';
  if((target.poisonTurns||0)>0)
    html+=`<span class="status-badge poison">🐍${target.poisonTurns}t</span>`;
  if((target.burnTurns||0)>0)
    html+=`<span class="status-badge burn">🔥∞</span>`;
  if((target.freezeTurns||0)>0)
    html+=`<span class="status-badge freeze">❄️${target.freezeTurns}t</span>`;
  return html;
}

/* ═══ BARRA DE PRONTIDÃO ═══ */
// Apenas chefes e elites possuem barra de prontidão
// Cada inimigo tem: readyMax (turnos para encher), readyCur (progresso atual)
// Quando cheia: dispara ataque especial

const READY_ATTACKS={
  // Definidos por id do inimigo ou tipo
  boss1:{name:'Invocar Mortos',ico:'💀',status:'poison',statusTurns:3,statusDmg:5,
    desc:'Invoca uma horda! Aplica Veneno.',dmgMult:1.8},
  boss2:{name:'Sopro de Fogo',ico:'🔥',status:'burn',statusTurns:0,statusDmg:8,
    desc:'Fogo devastador! Aplica Queimadura permanente.',dmgMult:2.2},
  boss3:{name:'Maldição da Morte',ico:'☠️',status:'freeze',statusTurns:2,statusDmg:0,
    desc:'O tempo congela. Aplica Congelamento.',dmgMult:2.0},
  elite:{name:'Golpe Devastador',ico:'⚡',status:null,statusTurns:0,statusDmg:0,
    desc:'Ataque poderoso com atordoamento.',dmgMult:1.9},
};

function initReadyBar(enemy){
  if(!enemy.boss&&!enemy.elite)return;
  enemy.readyMax=enemy.boss?4:5; // boss carrega em 4 turnos, elite em 5
  enemy.readyCur=0;
}

function tickReadyBar(){
  if(!CE||(CE.readyMax===undefined))return false;
  CE.readyCur=Math.min(CE.readyMax,(CE.readyCur||0)+1);
  return CE.readyCur>=CE.readyMax;
}

function resetReadyBar(){
  if(CE&&CE.readyMax!==undefined)CE.readyCur=0;
}

function getReadyAttack(){
  if(!CE)return READY_ATTACKS.elite;
  return READY_ATTACKS[CE._atkSpecialId||CE.id]||(CE.boss?READY_ATTACKS.boss1:READY_ATTACKS.elite);
}

function fireReadyAttack(){
  const atk=getReadyAttack();
  // 50/50: jogador esquiva ou leva dano pesado
  const dodged=Math.random()<0.5;
  const baseDmg=Math.max(8,Math.round((CE.atk-(G.def*.4)+r(10))*atk.dmgMult));

  clog(`⚡ ${CE.name} usa ${atk.ico} ${atk.name}!`,'ln');

  if(dodged){
    clog(`✨ Você desviou do ataque especial!`,'ls');
    floatDmg('DESVIOU','#f1c40f',45,45);
  } else {
    G.hp=Math.max(0,G.hp-baseDmg);
    if(G.passives.includes('godmode'))G.hp=G.hpMax;
    clog(`💥 ${atk.desc} -${baseDmg} HP!`,'le');
    floatDmg('-'+baseDmg,'#c0392b',38,50);
    screenShake();
    // Aplica status se houver
    if(atk.status){
      applyStatus(G,atk.status,atk.statusTurns,atk.statusDmg);
      const sNames={poison:'Veneno 🐍',burn:'Queimadura 🔥',freeze:'Congelamento ❄️'};
      clog(`${sNames[atk.status]} aplicado!`,'le');
    }
    // Atordoamento sempre no ataque especial
    CE.stunned=false; // inimigo não se atordoa, mas o jogador pode ter freeze
    // Aplica atordoamento no próprio inimigo como "recarga" — ele fica 1 turno sem agir
  }
  resetReadyBar();
  G._mNoDmg=dodged&&G._mNoDmg; // perde missão de "sem dano" se levar
  if(G.passives.includes('bsk_set')&&G.hp/G.hpMax<.3)G.hp=Math.min(G.hpMax,G.hp+5);
}

// Reduz barra de prontidão quando jogador causa dano
function dentReadyBar(dmg){
  if(!CE||CE.readyMax===undefined)return;
  // Dano equivale a ~2% da HP do inimigo = 1 tick de redução
  const threshold=Math.round(CE.hp*0.08);
  if(dmg>=threshold&&CE.readyCur>0){
    CE.readyCur=Math.max(0,CE.readyCur-1);
    clog('⚡ Barra de prontidão interrompida!','ls');
  }
}

/* ═══ COMBAT ═══ */
function startCombat(enemy,sc,disadv=false){
  G.inCombat=true;
  CE={...enemy,hpCur:enemy.hp,stunned:false,poisonTurns:0,burnTurns:0,freezeTurns:0};
  combatLog=[];
  initReadyBar(CE);
  if(CE.elite)clog(`⚠ ${CE.name} é um inimigo elite! Cuidado.`,'li');
  if(CE.boss)clog(`☠ ${CE.name} possui ataque especial carregável! Fique atento.`,'ln');
  if(disadv)clog('⚠ Pego de surpresa!','le');
  renderCombat(sc);
}

function startBoss(sc){
  // Boss fixo para andares 1-3, procedural para andares 4+
  const fixedBoss=ENEMIES.find(e=>e.id==='boss'+G.floor);
  const boss=fixedBoss||genBoss(G.floor);
  G._currentBoss=boss; // salva referência para o combate
  sc.innerHTML='';
  const card=mkCard('boss');
  const floorLabel=G.floor>3?`Andar ${G.floor} — Profundidades ∞`:`Andar ${G.floor}`;
  card.innerHTML=`
    <div class="ctag"><div class="ctag-dot" style="background:#ff6b35"></div><span class="ctag-txt" style="color:#ff6b35">CHEFE DO ANDAR</span></div>
    <div class="ctitle" style="color:#ff9055">${boss.name}</div>
    <div class="cillo">${boss.ico}</div>
    <div class="cbody">${boss.sub}<br><br>${boss.proc?'Uma presença antiga emerge das trevas. <b>Algo diferente. Algo maior.</b>':'Um adversário diferente. <b>Prepare-se.</b>'}</div>
    <div class="narrator">"${narr('boss')}"</div>
    <button class="btn-next" style="border-color:#ff6b35;color:#ff9055;" onclick="startCombat(G._currentBoss,$('scroll'))">⚔ Enfrentar o Chefe</button>`;
  sc.appendChild(card);scrollBot(sc);
}

function renderCombat(sc){
  sc.innerHTML='';
  const card=mkCard(CE.elite?'elite':'combat');
  const el=CE.elite;
  const activeEl=G.activeElement;
  // Determina a skill exibida no botão: elemental se mago com elemento ativo, senão skill1
  const sk=G.skills[0];
  const isMageEl=activeEl&&G.cls.id==='mage';
  const skIco=isMageEl?activeEl.ico:sk.ico;
  const skName=isMageEl?activeEl.name:sk.name;
  const skDesc=isMageEl?activeEl.desc:sk.desc;
  const rawMp=isMageEl?22:sk.mp;
  const skMp=Math.max(0,rawMp-(G.mpDiscount||0));
  const skType=isMageEl?'elemental':sk.type;
  // Carga elemental — indicador de progresso
  const chargeCount=G._elChargeCount||0;
  const isCharging=isMageEl&&G._elChargeEl===activeEl?.id&&chargeCount>0;
  const chargePips=isMageEl?`<span class="charge-pips">${[1,2,3].map(i=>`<span class="cpip${chargeCount>=i?' active':''}${chargeCount>=3?' full':''}"></span>`).join('')}</span>`:'';

  // Skill 2 (se tiver)
  const sk2=G.skills[1];
  let sk2Btn='';
  if(sk2){
    const isMageFusion=G.cls.id==='mage';
    // Para o mago, o botão sk2 vira Fusão Elemental
    const availFusions=isMageFusion?FUSIONS.filter(f=>
      G.elements.some(e=>e.id===f.e1)&&G.elements.some(e=>e.id===f.e2)
    ):[];
    const hasFusions=availFusions.length>0;
    const fusionMpCost=35;
    if(isMageFusion){
      sk2Btn=`<button class="cbtn cskill2${hasFusions?'':' cd'}" id="cb-sk2" onclick="ca('sk2')" ${hasFusions?'':'disabled'}>
        <span class="cbtn-ico">⚗️</span>
        <span class="cbtn-lbl">Fusão Elemental</span>
        <span class="cbtn-sub">${hasFusions?availFusions.length+' fusão'+(availFusions.length>1?'ões':'')+ ' disp.':'Sem fusões'}</span>
        <span class="mpcost">${fusionMpCost}MP</span>
      </button>`;
    } else {
      sk2Btn=`<button class="cbtn cskill2" id="cb-sk2" onclick="ca('sk2')">
        <span class="cbtn-ico">${sk2.ico}</span>
        <span class="cbtn-lbl">${sk2.name}</span>
        <span class="cbtn-sub">${sk2.desc}</span>
        <span class="mpcost">${Math.max(0,sk2.mp-(G.mpDiscount||0))}MP</span>
      </button>`;
    }
  }

  // Explosão Arcana (set mago 3 peças)
  const arcanaReady=G.passives.includes('arcana_explosion')&&G.arcanaReady;
  const arcanaCd=G.passives.includes('arcana_explosion')&&!G.arcanaReady;
  const arcanaBtn=G.passives.includes('arcana_explosion')?`<button class="cbtn carcana${arcanaReady?'':' cd'}" id="cb-arc" onclick="ca('arcana')" ${arcanaReady?'':'disabled'}>
    <span class="cbtn-ico">💜</span>
    <span class="cbtn-lbl">Explosão Arcana</span>
    <span class="cbtn-sub">${arcanaReady?'Disponível':'CD: '+(3-G.arcanaCombatsSince)+' vitórias'}</span>
  </button>`:'';

  // Exibir atributos do inimigo se tiver Olho do Guardião
  const eyeInfo=G.passives.includes('guardian_eye')?
    `<div style="font-size:10px;color:var(--txt2);font-family:var(--cinzel);margin-top:4px;opacity:.8;">ATK ${CE.atk} | DEF ${CE.def} | XP ${CE.xp}</div>`:'';

  // Status do inimigo (badges dinâmicos)
  const badges=(CE.badges||[]).map(b=>`<span class="ebadge${el?' elite-badge':''}">${b}</span>`).join('');
  const enemyStatusBadges=buildStatusBadges(CE);

  // Barra de prontidão (só chefe/elite)
  const hasReady=CE.readyMax!==undefined;
  const readyCur=CE.readyCur||0;
  const readyPct=hasReady?Math.round((readyCur/CE.readyMax)*100):0;
  const readyAtk=hasReady?getReadyAttack():null;
  const readyFull=hasReady&&readyCur>=CE.readyMax;
  const readyBarHtml=hasReady?`
    <div class="ready-bar-wrap${readyFull?' ready-full-wrap':''}">
      <div class="ready-bar-label">
        <span>${readyAtk.ico} ${readyAtk.name}</span>
        <span class="ready-pct${readyFull?' ready-alert':''}">${readyFull?'⚡ CUIDADO!':readyCur+'/'+CE.readyMax}</span>
      </div>
      <div class="ready-track">
        <div class="ready-fill${readyFull?' ready-fill-full':''}" id="rdyf" style="width:${readyPct}%"></div>
      </div>
    </div>`:'';

  // Status do jogador (exibido acima do log)
  const playerStatusHtml=buildPlayerStatusHtml();

  const logs=combatLog.slice(-6).map(l=>`<div class="${l.c}">${l.t}</div>`).join('');

  card.innerHTML=`
    <div class="ctag"><div class="ctag-dot"></div><span class="ctag-txt">${el?'Elite':'Combate'}</span></div>
    <div class="enemy-block${el?' elite-block':''}${readyFull?' ready-block-alert':''}">
      <div class="ehead">
        <div class="eillo${el?' elite-glow':''}">${CE.ico}</div>
        <div class="emeta">
          <div class="ename${el?' elite-name':''}">${CE.name}</div>
          <div class="esub">${CE.sub}</div>
          <div class="ebadges">${badges}${enemyStatusBadges}</div>
          ${eyeInfo}
        </div>
      </div>
      <div class="ehpbar"><div class="ehpfill${el?' elite-hp':''}" id="ehpf" style="width:${pct(CE.hpCur,CE.hp)}"></div></div>
      <div class="ehptxt" id="ehpt">${CE.hpCur}/${CE.hp} HP</div>
      ${readyBarHtml}
    </div>
    ${playerStatusHtml}
    <div class="clog" id="clog">${logs}</div>
    <div class="cbtns" id="cbtns-grid">
      <button class="cbtn catk" id="cb-atk" onclick="ca('atk')"><span class="cbtn-ico">⚔️</span><span class="cbtn-lbl">Atacar</span><span class="cbtn-sub">ATK ${G.atk}</span></button>
      <button class="cbtn cskill${activeEl&&G.cls.id==='mage'?' active-element':''}${chargeCount>=3?' charged':''}" id="cb-sk" onclick="ca('sk')">
        <span class="cbtn-ico">${skIco}</span><span class="cbtn-lbl">${skName}${chargePips}</span>
        <span class="cbtn-sub">${chargeCount>=3?'⚡ CARGA MÁXIMA!':skDesc}</span><span class="mpcost">${skMp}MP</span>
      </button>
      ${sk2Btn}
      ${arcanaBtn}
      <button class="cbtn citem" id="cb-item" onclick="ca('item')"><span class="cbtn-ico">🎒</span><span class="cbtn-lbl">Item</span><span class="cbtn-sub">${G.inv.filter(i=>i.uses).length} disp.</span></button>
      <button class="cbtn cflee" id="cb-flee" onclick="ca('flee')"><span class="cbtn-ico">💨</span><span class="cbtn-lbl">Fugir</span><span class="cbtn-sub">VEL ${G.spd}</span></button>
    </div>`;
  sc.appendChild(card);scrollBot(sc);lockBtns(250);
}

const clog=(t,c='li')=>combatLog.push({t,c});

function buildPlayerStatusHtml(){
  const hasAny=(G.poisonTurns||0)>0||(G.burnTurns||0)>0||(G.freezeTurns||0)>0;
  if(!hasAny)return'';
  let badges='';
  if((G.poisonTurns||0)>0)badges+=`<span class="status-badge poison">🐍 Veneno ${G.poisonTurns}t</span>`;
  if((G.burnTurns||0)>0)badges+=`<span class="status-badge burn">🔥 Queimadura ∞</span>`;
  if((G.freezeTurns||0)>0)badges+=`<span class="status-badge freeze">❄️ Gelo ${G.freezeTurns}t</span>`;
  return`<div class="player-status-row" id="pstatus">${badges}</div>`;
}

function updateCombatUI(){
  const f=$('ehpf'),t=$('ehpt'),l=$('clog');
  if(f)f.style.width=pct(CE.hpCur,CE.hp);
  if(t)t.textContent=CE.hpCur+'/'+CE.hp+' HP';
  if(l){l.innerHTML=combatLog.slice(-6).map(x=>`<div class="${x.c}">${x.t}</div>`).join('');l.scrollTop=l.scrollHeight;}
  // Atualiza barra de prontidão sem re-render completo
  const rdyf=$('rdyf');
  if(rdyf&&CE&&CE.readyMax!==undefined){
    const cur=CE.readyCur||0;
    const pctVal=Math.round((cur/CE.readyMax)*100);
    rdyf.style.width=pctVal+'%';
    rdyf.className='ready-fill'+(cur>=CE.readyMax?' ready-fill-full':'');
    const wrap=rdyf.closest('.ready-bar-wrap');
    if(wrap){
      wrap.className='ready-bar-wrap'+(cur>=CE.readyMax?' ready-full-wrap':'');
      const pctEl=wrap.querySelector('.ready-pct');
      if(pctEl){
        pctEl.textContent=cur>=CE.readyMax?'⚡ CUIDADO!':cur+'/'+CE.readyMax;
        pctEl.className='ready-pct'+(cur>=CE.readyMax?' ready-alert':'');
      }
      // Alerta visual no bloco do inimigo
      const eb=document.querySelector('.enemy-block');
      if(eb){eb.classList.toggle('ready-block-alert',cur>=CE.readyMax);}
    }
  }
  // Atualiza status do jogador
  const ps=$('pstatus');
  const newPsHtml=buildPlayerStatusHtml();
  if(ps)ps.outerHTML=newPsHtml||'';
  else if(newPsHtml){
    const logEl=$('clog');
    if(logEl)logEl.insertAdjacentHTML('beforebegin',newPsHtml);
  }
  // Atualiza badges de status do inimigo
  const ebadges=document.querySelector('.ebadges');
  if(ebadges&&CE){
    const baseBadges=(CE.badges||[]).map(b=>`<span class="ebadge${CE.elite?' elite-badge':''}">${b}</span>`).join('');
    ebadges.innerHTML=baseBadges+buildStatusBadges(CE);
  }
  upd();
}
function lockBtns(ms){
  ['cb-atk','cb-sk','cb-sk2','cb-arc','cb-item','cb-flee'].forEach(id=>{
    const el=$(id);if(!el)return;el.disabled=true;
    if(ms>0)setTimeout(()=>{if(el&&!el.classList.contains('cd'))el.disabled=false;},ms);
    else if(!el.classList.contains('cd'))el.disabled=false;
  });
}

function ca(action){
  lockBtns(700);
  if(action==='atk'){
    pAtk();
  } else if(action==='sk'){
    const sk=G.skills[0];
    const activeEl=G.activeElement;
    const type=activeEl&&G.cls.id==='mage'?'elemental':sk.type;
    const mpCost=Math.max(0,(activeEl&&G.cls.id==='mage'?22:sk.mp)-(G.mpDiscount||0));
    if(G.mp<mpCost&&!G.passives.includes('manamode')){toast('MP insuficiente!');lockBtns(0);return;}
    G.mp=G.passives.includes('manamode')?G.mpMax:G.mp-mpCost;upd();doSkill(type);
  } else if(action==='sk2'){
    const sk2=G.skills[1];if(!sk2){lockBtns(0);return;}
    if(G.cls.id==='mage'){
      const mpCost=35;
      if(G.mp<mpCost&&!G.passives.includes('manamode')){toast('MP insuficiente! (35 MP)');lockBtns(0);return;}
      const availFusions=FUSIONS.filter(f=>
        G.elements.some(e=>e.id===f.e1)&&G.elements.some(e=>e.id===f.e2)
      );
      if(!availFusions.length){toast('Nenhuma fusão disponível!');lockBtns(0);return;}
      openFusionOverlay(availFusions,mpCost);return;
    }
    const mpCost=Math.max(0,sk2.mp-(G.mpDiscount||0));
    if(G.mp<mpCost&&!G.passives.includes('manamode')){toast('MP insuficiente!');lockBtns(0);return;}
    G.mp=G.passives.includes('manamode')?G.mpMax:G.mp-mpCost;upd();doSkill(sk2.type);
  } else if(action==='arcana'){
    if(!G.arcanaReady){toast('Explosão Arcana em cooldown!');lockBtns(0);return;}
    doSkill('arcana');
  } else if(action==='item'){
    const usable=G.inv.filter(i=>i.uses&&i.uses>0);
    if(!usable.length){toast('Nenhum item usável!');lockBtns(0);return;}
    openItemOverlay(usable,true);return;
  } else if(action==='flee'){
    if(CE.boss){clog('Não é possível fugir de um chefe!','le');updateCombatUI();lockBtns(0);return;}
    if(r(20)+G.spd>=14){
      sfx('flee');
      G._mFled=true;
      // limpa status do jogador ao fugir
      clearCombatStatus(G);
      clog('Você foge!','ls');G.inCombat=false;CE=null;combatLog=[];
      outcome($('scroll'),'neutral','💨','Fugiu','Escape pela calada.',[]);return;
    } else {const d=r(8)+2;G.hp=Math.max(0,G.hp-d);screenShake();clog('Tentou fugir — levou -'+d+' HP!','le');}
  }
  if(CE&&CE.hpCur>0)enemyTurn();
  checkEnd();
}

function pAtk(bonus=0,forceCrit=false){
  // sure_hit (set caçador) garante acerto
  if(!G.passives.includes('sure_hit')&&CE&&Math.random()<(CE.dodge||0)){
    clog(CE.name+' esquivou do seu ataque!','li');updateCombatUI();return;
  }
  let bz=G.passives.includes('berzerk')&&G.hp/G.hpMax<.3?Math.round(G.atk*.35):0;
  let dmg=Math.max(1,G.atk+bz-Math.floor(CE.def*.5)+r(8));
  let isCrit=forceCrit||Math.random()<G.crit;
  if(isCrit){dmg=Math.round(dmg*(G.critMult||2));clog(`⚡ Crítico! ${dmg} dano!`,'lc');floatDmg('⚡'+dmg,'#f1c40f',55,36);sfx('crit');spawnParticles(14,'#f1c40f');flashCard('rgba(241,196,15,.25)',250);}
  else{clog(`Você ataca ${CE.name} — ${dmg} dano.`,'lp');floatDmg('-'+dmg,'#e74c3c',55,36);sfx('atk');spawnParticles(8,'#e74c3c');flashCard('rgba(231,76,60,.3)',200);}
  pulseEnemyIco();
  dmg+=bonus;
  CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
  dentReadyBar(dmg); // reduz barra de prontidão proporcional ao dano
  if(G.lifesteal>0)G.hp=Math.min(G.hpMax,G.hp+Math.round(dmg*G.lifesteal));
  if(G.passives.includes('vamp'))G.hp=Math.min(G.hpMax,G.hp+5);
  if(G.passives.includes('manaburn')&&CE.hpCur>0){CE.mp=(CE.mp||30);CE.mp=Math.max(0,CE.mp-3);}
  if(G.passives.includes('dbl')&&Math.random()<.12){
    const d2=Math.max(1,G.atk-Math.floor(CE.def*.5)+r(6));
    CE.hpCur=Math.max(0,CE.hpCur-d2);G.totalDmg+=d2;clog('Duplo golpe! +'+d2+' extra.','lc');
    dentReadyBar(d2);
  }
  if(G.passives.includes('thorns')&&CE.hpCur>0)CE.hpCur=Math.max(0,CE.hpCur-2);
  updateCombatUI();
}

function doSkill(type){
  if(type==='brutal'){
    const dmg=Math.round(Math.max(1,G.atk*1.7+r(12)-Math.floor(CE.def*.4)));
    const stun=Math.random()<.40;if(stun)CE.stunned=true;
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    G._mSkillUses=(G._mSkillUses||0)+1;
    clog(`💥 Golpe Brutal: ${dmg}${stun?' — Atordoado!':''}!`,'lc');floatDmg('💥'+dmg,'#ff6b35',55,35);
  } else if(type==='warcry'){
    G.atk+=6;G.warcryTurns=3;
    G._mSkillUses=(G._mSkillUses||0)+1;
    clog('📯 Grito de Guerra! +6 ATK por 3 turnos!','lc');floatDmg('📯+6ATK','#f1c40f',50,30);
    updateCombatUI();return;
  } else if(type==='fireball'){
    const dmg=Math.round(Math.max(4,G.mag*1.6+r(14)));
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    G._mSkillUses=(G._mSkillUses||0)+1;
    clog(`🔥 Bola de Fogo: ${dmg} mágico!`,'lc');floatDmg('🔥'+dmg,'#ff8c35',55,35);
  } else if(type==='sneak'){
    const dmg=Math.round(Math.max(1,G.atk*2.3+r(10)-Math.floor(CE.def*.3)));
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    G._mSkillUses=(G._mSkillUses||0)+1;
    clog(`🌑 Furtivo: ${dmg} (crítico garantido!)!`,'lc');floatDmg('🌑'+dmg,'#9b59b6',55,35);
  } else if(type==='poison'){
    // Veneno via Ladino: aplica acumulando
    const pdmg=Math.max(3,Math.round(G.atk*.3));
    applyStatus(CE,'poison',4,pdmg);
    G._mSkillUses=(G._mSkillUses||0)+1;
    clog(`🐍 Veneno aplicado! ${pdmg} dano/turno por 4 turnos!`,'lc');floatDmg('🐍','#27ae60',55,35);
  } else if(type==='elemental'){
    const el=G.activeElement;
    if(!el){toast('Nenhum elemento ativo!');return;}

    // ── Carga Elemental ──
    if(G._elChargeEl===el.id){
      G._elChargeCount=(G._elChargeCount||0)+1;
    } else {
      G._elChargeEl=el.id;
      G._elChargeCount=1;
    }
    const isCharged=G._elChargeCount>=3;
    if(isCharged) G._elChargeCount=0; // reseta após disparar

    const chargeMult=isCharged?1.8:1;
    const dmg=Math.round(Math.max(4,G.mag*el.mult*chargeMult+r(10)));
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    dentReadyBar(dmg);
    G._mSkillUses=(G._mSkillUses||0)+1;

    // Aplica status elemental baseado no tipo do elemento
    const elStatus={
      fogo:'burn',magma:'burn',plasma:'burn',fogo_fatuo:'burn',fenix:'burn',
      veneno:'poison',toxina_mortal:'poison',toxina_liq:'poison',
      gelo:'freeze',nevoeiro_gelido:'freeze',frio_da_morte:'freeze',preservacao:'freeze',
    };
    const statusType=elStatus[el.id]||null;
    if(isCharged){
      // Versão potencializada: log especial + status ampliado
      clog(`⚡ CARGA ELEMENTAL! ${el.ico} ${el.name}: ${dmg} dano potencializado!`,'lc');
      floatDmg('⚡'+el.ico+dmg,'#f1c40f',50,33);
      screenShake();sfx('charge');spawnParticles(20,'#f1c40f');flashCard('rgba(241,196,15,.4)',350);pulseEnemyIco();
      if(statusType){
        const sTurns=statusType==='burn'?0:4;
        const sDmg=statusType==='burn'?Math.round(G.mag*.45):statusType==='poison'?Math.round(G.mag*.38):0;
        applyStatus(CE,statusType,sTurns,sDmg);
        const sLabel={burn:'🔥 Queimadura Intensa',poison:'🐍 Veneno Letal',freeze:'❄️ Congelamento Profundo'};
        clog(`${sLabel[statusType]} aplicado!`,'lc');
      }
    } else {
      if(statusType){
        const sTurns=statusType==='burn'?0:2;
        const sDmg=statusType==='burn'?Math.round(G.mag*.25):statusType==='poison'?Math.round(G.mag*.2):0;
        applyStatus(CE,statusType,sTurns,sDmg);
        const sLabel={burn:'🔥 Queimadura',poison:'🐍 Veneno',freeze:'❄️ Congelamento'};
        clog(`${el.ico} ${el.name}: ${dmg} dano + ${sLabel[statusType]}!`,'lc');
      } else {
        const tierLabel=['Primordial','Energia','Entrópico','Condutor','Nobre','Básico'][el.tier]||'';
        clog(`${el.ico} ${el.name} (${tierLabel}): ${dmg} dano elemental!`,'lc');
      }
      floatDmg(el.ico+dmg,'#c39bd3',55,35);sfx('elemental');spawnParticles(10,'#9b59b6');flashCard('rgba(155,89,182,.3)',220);pulseEnemyIco();
    }
  } else if(type==='arcana'){
    const dmg=Math.round(Math.max(8,G.mag*2.2+r(20)));
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    G.arcanaReady=false;G.arcanaCombatsSince=0;
    clog(`💜 Explosão Arcana: ${dmg} dano massivo!`,'lc');floatDmg('💜'+dmg,'#9b59b6',55,33);
    screenShake();
  }
  updateCombatUI();
}

function enemyTurn(){
  if(!CE)return;

  // ── 1. Warcry decay ──
  if(G.warcryTurns>0){G.warcryTurns--;if(G.warcryTurns===0){G.atk-=6;clog('📯 Grito de Guerra expirou.','li');}}

  // ── 2. Tick status no inimigo (veneno + queimadura) ──
  const enemyDiedToStatus=tickStatusOnEnemy();
  updateCombatUI();
  if(enemyDiedToStatus){checkEnd();return;}

  // ── 3. Tick status no jogador ──
  tickStatusOnPlayer();
  if(G.passives.includes('godmode'))G.hp=G.hpMax;
  updateCombatUI();
  if(G.hp<=0){checkEnd();return;}

  // ── 4. Congelamento — inimigo pode perder o turno ──
  if(CE.freezeTurns>0){
    CE.freezeTurns--;
    if(Math.random()<0.5){
      clog(`❄️ ${CE.name} está congelado e perde o turno! (${CE.freezeTurns} rest.)`,'ls');
      updateCombatUI();return;
    } else {
      clog(`❄️ ${CE.name} avança mesmo congelado! (${CE.freezeTurns} rest.)`,'li');
    }
  }

  // ── 5. Atordoamento normal ──
  if(CE.stunned){clog(CE.name+' está atordoado e perde o turno.','li');CE.stunned=false;updateCombatUI();return;}

  // ── 6. Barra de prontidão — tick e disparo ──
  if(CE.readyMax!==undefined){
    const wasFull=CE.readyCur>=CE.readyMax;
    if(wasFull){
      // Dispara ataque especial
      fireReadyAttack();
      updateCombatUI();
      if(G.hp<=0){checkEnd();return;}
      return; // ataque especial substitui o turno normal
    } else {
      tickReadyBar();
      if(CE.readyCur>=CE.readyMax){
        clog(`⚠️ ${CE.name} carregou ${getReadyAttack().ico} ${getReadyAttack().name}! Próximo turno será devastador!`,'ln');
      }
    }
  }

  // ── 7. Dodge do jogador ──
  if(Math.random()<G.dodge){
    clog('Você esquivou do ataque de '+CE.name+'!','ls');
    updateCombatUI();return;
  }

  // ── 8. Efeitos de badge ──
  if(CE.badges&&CE.badges.includes('Regeneração')&&CE.hpCur<CE.hp*.65&&Math.random()<.5){
    const rg=r(6)+2;CE.hpCur=Math.min(CE.hp,CE.hpCur+rg);clog(CE.name+' regenera +'+rg+' HP.','li');
  }
  if(CE.badges&&CE.badges.includes('Drena MP')){G.mp=Math.max(0,G.mp-6);clog(CE.name+' drena 6 de Mana!','li');}
  if(CE.badges&&CE.badges.includes('Maldição')&&Math.random()<.3){G.def=Math.max(0,G.def-1);clog('A maldição do '+CE.name+' reduz sua DEF em 1.','le');}

  // ── 9. Ataque normal ──
  let dmg=Math.max(1,CE.atk-Math.floor(G.def*.6)+r(6));
  if(CE.badges&&CE.badges.includes('Fúria')&&CE.hpCur<CE.hp*.4)dmg=Math.round(dmg*1.35);
  const isCrit=Math.random()<.09;
  if(isCrit)dmg=Math.round(dmg*1.65);
  let logMsg=isCrit?`💀 ${CE.name} acerta um golpe crítico! -${dmg} HP!`:`${CE.name} ataca e causa -${dmg} HP.`;
  if(CE.badges&&CE.badges.includes('Dreno de vida')){const dr=Math.round(dmg*.35);CE.hpCur=Math.min(CE.hp,CE.hpCur+dr);logMsg+=` (drena ${dr} HP)`;}
  G.hp=Math.max(0,G.hp-dmg);
  if(dmg>0)G._mNoDmg=false;
  if(G.passives.includes('godmode'))G.hp=G.hpMax;
  if(G.passives.includes('bsk_set')&&G.hp/G.hpMax<.3)G.hp=Math.min(G.hpMax,G.hp+5);
  clog(logMsg,isCrit?'lc':'le');
  if(dmg>=15)screenShake();
  floatDmg('-'+dmg,'#c0392b',40,55);
  sfx('hit');flashPlayerHit();

  // ── Regeneração de MP por turno ──
  const turnRegen = G.cls.id==='mage' ? 6 : G.cls.id==='rogue' ? 3 : 2;
  const actualRegen = Math.min(turnRegen, G.mpMax - G.mp);
  if(actualRegen > 0){
    G.mp += actualRegen;
    floatDmg('+'+actualRegen+'MP','#4488cc',30,60);
  }

  updateCombatUI();
}

function checkEnd(){
  if(!CE)return;
  // Phoenix — revive com 30% HP uma vez
  if(G.hp<=0&&G.passives.includes('phoenix')&&!G.phoenixUsed){
    G.phoenixUsed=true;
    const idx=G.passives.indexOf('phoenix');if(idx>=0)G.passives.splice(idx,1);
    G.hp=Math.round(G.hpMax*.3);
    clog('🪶 Pena da Fênix! Você revive com '+G.hp+' HP!','lc');
    floatDmg('🪶REVIVE','#ff8c35',45,45);
    updateCombatUI();return;
  }
  if(G.hp<=0){showDeath('O herói caiu em combate.');sfx('death');return;}
  if(CE.hpCur<=0){
    if(CE.type==='explode'){
      const exd=r(12)+6;G.hp=Math.max(0,G.hp-exd);
      clog(`💣 EXPLOSÃO! -${exd} HP!`,'le');screenShake();
      if(G.hp<=0){
        if(G.passives.includes('phoenix')&&!G.phoenixUsed){
          G.phoenixUsed=true;const idx=G.passives.indexOf('phoenix');if(idx>=0)G.passives.splice(idx,1);
          G.hp=Math.round(G.hpMax*.3);clog('🪶 Pena da Fênix! Revive!','lc');
        } else {showDeath('Morreu na explosão do goblin bomba.');return;}
      }
    }
    G.kills++;
    if(CE.elite)G._mElites=(G._mElites||0)+1;
    // limpa status do jogador ao vencer
    clearCombatStatus(G);
    // Arcana cooldown tracking
    if(G.passives.includes('arcana_explosion')){
      if(!G.arcanaReady){
        G.arcanaCombatsSince=(G.arcanaCombatsSince||0)+1;
        if(G.arcanaCombatsSince>=3){G.arcanaReady=true;G.arcanaCombatsSince=0;toast('💜 Explosão Arcana recarregada!',2000);}
      }
    }
    // Post-combat regen (Totem)
    if(G.passives.includes('post_combat_regen')){
      const heal=Math.round(G.hpMax*.10);G.hp=Math.min(G.hpMax,G.hp+heal);
      clog(`🪆 Totem: +${heal} HP restaurado.`,'ls');
    }
    const xg=CE.xp,gg=r(CE.gold[1]-CE.gold[0]+1)+CE.gold[0];
    const wasElite=CE.elite,ceName=CE.name,ceIco=CE.ico,isBoss=CE.boss;
    addXP(xg);addGold(gg);
    if(isBoss){logRun('💀',`Chefe derrotado: ${ceIco} ${ceName}`,'crit');sfx('boss_die');screenShake();}
    else if(wasElite)logRun('⭐',`Elite eliminado: ${ceIco} ${ceName}`,'win');
    if(G.passives.includes('med'))G.mp=Math.min(G.mpMax,G.mp+8);
    checkMissions();grantChallengeReward();
    clog(`${ceName} derrotado! +${xg}XP +${gg}💰`,'ls');updateCombatUI();
    const wasBoss=isBoss,fl=G.floor;G.inCombat=false;CE=null;
    setTimeout(()=>{
      if(wasBoss&&fl===3){showVictory();return;}
      if(wasBoss){
        const prevFloor=G.floor;
        G.floor++;G.room=0;G.challengeRoomDoneThisFloor=false;G.specialMerchantSeen=false;
        logRun('🏰',`Avançou para o Andar ${G.floor}`,'win');
        generateMissions();
        if(prevFloor>=3){
          // Andares 4+: transição narrativa direta, sem tela de vitória
          const depthMsgs=[
            'As trevas se aprofundam. O silêncio pesa mais do que qualquer armadura.',
            'Você desce. A luz some. Algo lá embaixo te observa há muito tempo.',
            'O dungeon não tem fundo. Apenas mais escuridão, mais poder, mais morte.',
            'Cada andar é uma cicatriz. Você coleciona as suas com orgulho.',
            'Não há glória aqui. Apenas sobrevivência. E você ainda está de pé.',
          ];
          toast(`🏰 Andar ${G.floor} — ${pick(depthMsgs)}`,3500);
          const sc2=$('scroll');if(sc2)nextRoom();
          return;
        }
      }
      showCombatVictory(wasBoss,xg,gg);
    },600);
  }
}

/* ═══ COMBAT VICTORY IN-PLACE ═══ */
function showCombatVictory(wasBoss, xg, gg) {
  const sc = $('scroll');
  if (!sc) { nextRoom(); return; }

  // Encontra o card de combate ainda na tela
  const card = sc.querySelector('.card');
  if (!card) { nextRoom(); return; }

  const isBoss = wasBoss;
  const ico    = isBoss ? '🏆' : '⚔️';
  const title  = isBoss ? 'Chefe Derrotado!' : 'Vitória!';
  const quote  = narr(isBoss ? 'boss' : 'win_combat');

  // Transição suave: card pisca dourado
  card.style.transition = 'border-color .35s, box-shadow .35s';
  card.style.borderColor = 'rgba(200,130,75,.7)';
  card.style.boxShadow   = '0 0 24px rgba(200,130,75,.3)';

  // Substitui o conteúdo interno do card pelo resultado
  card.innerHTML = `
    <div class="ctag">
      <div class="ctag-dot" style="background:var(--grn2)"></div>
      <span class="ctag-txt" style="color:var(--grn2)">${isBoss ? 'CHEFE DERROTADO' : 'VITÓRIA'}</span>
    </div>

    <!-- Resultado central -->
    <div class="victory-center">
      <div class="victory-ico">${ico}</div>
      <div class="victory-title">${title}</div>
      <div class="victory-quote">"${quote}"</div>
    </div>

    <!-- Recompensas -->
    <div class="victory-rewards">
      <div class="vreward xp">
        <span class="vreward-ico">✨</span>
        <span class="vreward-val">+${xg} XP</span>
      </div>
      <div class="vreward gold">
        <span class="vreward-ico">💰</span>
        <span class="vreward-val">+${gg}</span>
      </div>
    </div>

    <!-- Log das últimas linhas do combate -->
    <div class="victory-log">
      ${combatLog.slice(-3).map(l => `<div class="${l.c}">${l.t}</div>`).join('')}
    </div>

    <!-- Botão único -->
    <button class="btn-next victory-btn" onclick="nextRoom()">
      Próxima Sala →
    </button>`;

  scrollBot(sc);
}

/* ═══ INVENTORY ═══ */
function renderInv(sc){
  sc.innerHTML='';
  const card=mkCard('explore');
  const slots=[{key:'head',lbl:'Cabeça',ico:'⛑️'},{key:'chest',lbl:'Peito',ico:'🛡️'},{key:'weapon',lbl:'Arma',ico:'⚔️'},{key:'feet',lbl:'Pés',ico:'👟'}];

  const eSlots=slots.map(s=>{
    const eq=G.equip[s.key];
    const isSet=eq&&eq.set;
    if(eq){
      return `<div class="eslot-compact ${eq.rarity}${isSet?' eslot-set':''}" onclick="unequip('${s.key}')">
        <div class="eslot-c-lbl">${s.lbl}</div>
        <div class="eslot-c-ico">${eq.ico}</div>
        <div class="eslot-c-name">${eq.name}</div>
        ${isSet?`<div class="eslot-c-set">Set</div>`:''}
      </div>`;
    }
    return `<div class="eslot-compact empty">
      <div class="eslot-c-lbl">${s.lbl}</div>
      <div class="eslot-c-ico" style="opacity:.22;">${s.ico}</div>
      <div class="eslot-c-name" style="color:var(--txt3);">vazio</div>
    </div>`;
  }).join('');

  const activeSets=Object.entries(G.activeSets||{}).filter(([,v])=>v>=2);
  const setBonusHtml=activeSets.length?`<div class="inv-set-bonus">${activeSets.map(([sid,cnt])=>{
    const def=SET_DEFS[sid];if(!def)return '';
    return `<span class="set-bonus-line">✨ ${def.name} (${cnt}p)${cnt>=2?` · ${def.bonus2.desc}`:''}${cnt>=3?` · ${def.bonus3.desc}`:''}</span>`;
  }).join('')}</div>`:'';

  card.innerHTML=`
    <div class="inv-header">
      <span class="panel-title" style="margin:0;font-size:12px;">🎒 EQUIPAMENTO</span>
      <span class="inv-count">${G.inv.filter(i=>i).length}/16</span>
    </div>
    <div class="eslots-compact-row">${eSlots}</div>
    ${setBonusHtml}
    ${renderMissions()}
    <div class="inv-bag-header">
      <span class="equip-title" style="margin:0;">MOCHILA</span>
    </div>
    <div class="inv-grid-compact" id="inv-grid"></div>`;

  sc.appendChild(card);
  renderInvGrid(card.querySelector('#inv-grid'));
  scrollBot(sc);
}

function renderInvGrid(grid){
  if(!grid)return;
  grid.innerHTML='';
  // Mostra só os slots ocupados + 2 vazios de contexto (ou mínimo 4)
  const items=G.inv.slice(0,16);
  const totalShow=Math.max(items.length+2,4);
  for(let i=0;i<Math.min(totalShow,16);i++){
    const item=items[i];
    const slot=document.createElement('div');
    if(item){
      slot.className=`islot-c ${item.rarity||'common'}${item.set?' set-item':''}`;
      slot.title=item.name+(item.desc?' — '+item.desc:'');
      slot.innerHTML=`<span class="islot-c-ico">${item.ico}</span><span class="islot-c-name">${item.name}</span>${item.uses?`<span class="islot-c-uses">×${item.uses}</span>`:''}${item.slot?`<span class="islot-c-slot">${item.slot==='head'?'⛑️':item.slot==='chest'?'🛡️':item.slot==='weapon'?'⚔️':'👟'}</span>`:''}`;
      slot.onclick=()=>{
        const equipSlots=['head','chest','weapon','feet'];
        if(item.slot&&equipSlots.includes(item.slot)){
          openEquipComparator(item);
        } else if(item.uses&&item.uses>0&&item.fn){
          item.fn(G,{});item.uses--;
          if(item.uses<=0)G.inv.splice(G.inv.indexOf(item),1);
          upd();safeRender(renderInv,$('scroll'));
        } else if(!item.slot&&item.fn&&!item.uses){
          toast(item.name+' — passivo ativo.');
        } else {
          toast('Item passivo.');
        }
      };
    } else {
      slot.className='islot-c empty';
      slot.innerHTML='<span style="color:var(--txt3);font-size:9px;font-family:Cinzel,serif;">—</span>';
    }
    grid.appendChild(slot);
  }
}

function unequip(slotKey){
  const eq=G.equip[slotKey];if(!eq)return true;
  if(G.inv.length>=16){toast('Mochila cheia! Não é possível desequipar.');return false;}
  if(eq.bonus)Object.entries(eq.bonus).forEach(([k,v])=>{G[k]=(G[k]||0)-v;if(k==='hpMax')G.hp=Math.min(G.hp,G.hpMax);});
  G.inv.push(eq);G.equip[slotKey]=null;
  evaluateSets();
  toast('Desequipado: '+eq.name);upd();safeRender(renderInv,$('scroll'));return true;
}

/* ═══ COMPARADOR DE EQUIPAMENTO ═══ */
function openEquipComparator(newItem){
  const existing=$('equip-cmp-ov');if(existing)existing.remove();
  const current=G.equip[newItem.slot];
  const rarColor={common:'var(--acc)',rare:'var(--rare)',epic:'var(--epic)',legendary:'var(--legendary)'};

  // Stats relevantes a comparar
  const STAT_LABELS={atk:'ATK',def:'DEF',mag:'MAG',spd:'VEL',hp:'HP',hpMax:'HP MÁX',mp:'MP',crit:'CRIT %',dodge:'ESQUIVA %',lifesteal:'VAMPIRISMO %'};
  const allStats=new Set([
    ...Object.keys(newItem.bonus||{}),
    ...Object.keys(current?.bonus||{})
  ]);

  function statVal(item,stat){
    if(!item||!item.bonus)return 0;
    const v=item.bonus[stat]||0;
    return (stat==='crit'||stat==='dodge'||stat==='lifesteal')?Math.round(v*100):v;
  }

  function diffHtml(stat){
    const nv=statVal(newItem,stat);
    const cv=statVal(current,stat);
    const diff=nv-cv;
    if(diff===0)return`<span style="color:var(--txt2);">—</span>`;
    const arrow=diff>0?'▲':'▼';
    const col=diff>0?'var(--grn2)':'var(--red2)';
    return`<span style="color:${col};font-weight:bold;">${arrow}${Math.abs(diff)}</span>`;
  }

  const statsRows=[...allStats].map(stat=>`
    <div class="cmp-stat-row">
      <span class="cmp-stat-lbl">${STAT_LABELS[stat]||stat}</span>
      <span class="cmp-val ${current?'':'empty'}">${current?statVal(current,stat):'—'}</span>
      <span class="cmp-diff">${current?diffHtml(stat):'<span style="color:var(--grn2)">Novo</span>'}</span>
      <span class="cmp-val new">${statVal(newItem,stat)}</span>
    </div>`).join('');

  const ov=document.createElement('div');ov.id='equip-cmp-ov';
  ov.className='cmp-overlay';
  ov.innerHTML=`
    <div class="cmp-sheet">
      <div class="cmp-header">
        <span class="cmp-title">COMPARAR EQUIPAMENTO</span>
        <button class="cmp-close" onclick="document.getElementById('equip-cmp-ov').remove();lockBtns(0);">✕</button>
      </div>
      <div class="cmp-cols">
        <div class="cmp-col cmp-current">
          <div class="cmp-col-lbl">EQUIPADO</div>
          ${current
            ?`<div class="cmp-item-ico">${current.ico}</div>
               <div class="cmp-item-name ${current.rarity}">${current.name}</div>
               <div class="cmp-item-desc">${current.desc||''}</div>`
            :`<div class="cmp-item-ico" style="opacity:.3;">—</div>
               <div class="cmp-item-name" style="color:var(--txt3);">Slot vazio</div>`}
        </div>
        <div class="cmp-divider">VS</div>
        <div class="cmp-col cmp-new">
          <div class="cmp-col-lbl" style="color:var(--grn2);">NOVO</div>
          <div class="cmp-item-ico">${newItem.ico}</div>
          <div class="cmp-item-name ${newItem.rarity}">${newItem.name}</div>
          <div class="cmp-item-desc">${newItem.desc||''}</div>
        </div>
      </div>
      ${allStats.size?`<div class="cmp-stats-header">
          <span>STAT</span><span>${current?current.ico:'—'}</span><span>DIFF</span><span>${newItem.ico}</span>
        </div>
        <div class="cmp-stats">${statsRows}</div>`
        :'<div style="color:var(--txt2);font-style:italic;font-size:12px;text-align:center;padding:10px;">Nenhum bônus de stat a comparar.</div>'}
      <div class="cmp-actions">
        <button class="cmp-btn-equip" onclick="doEquipFromComparator('${newItem.id}')">✔ Equipar ${newItem.ico} ${newItem.name}</button>
        <button class="cmp-btn-cancel" onclick="document.getElementById('equip-cmp-ov').remove();lockBtns(0);">✕ Cancelar</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
}

function doEquipFromComparator(itemId){
  const ov=$('equip-cmp-ov');if(ov)ov.remove();
  const item=G.inv.find(i=>i.id===itemId);
  if(!item)return;
  if(G.equip[item.slot]&&!unequip(item.slot))return;
  G.equip[item.slot]=item;applyBonus(item);G.inv.splice(G.inv.indexOf(item),1);
  evaluateSets();
  logRun('🛡️',`Equipou: ${item.ico} ${item.name}`,'neutral');
  toast('Equipado: '+item.name);upd();safeRender(renderInv,$('scroll'));
  lockBtns(0);
}
function renderSkills(sc){
  sc.innerHTML='';
  const card=mkCard('explore');
  const skHtml=G.skills.map(sk=>`<div class="sk-item"><span style="font-size:24px;">${sk.ico}</span><div class="sk-info"><div class="sk-name">${sk.name}</div><div class="sk-desc">${sk.desc}</div><div class="sk-cost">${sk.mp} MP</div></div></div>`).join('');
  const upHtml=G.upgrades.length?`<div style="margin-top:14px;"><div class="panel-title" style="margin-bottom:8px;">✨ TALENTOS ATIVOS</div><div class="pass-row">${G.upgrades.map(u=>`<span class="pass-tag">${u}</span>`).join('')}</div></div>`:'';
  card.innerHTML=`<div class="panel-title">✨ HABILIDADES</div><div class="sk-row">${skHtml}</div>${upHtml}`;
  if(G.cls.id==='mage'){
    // Abas: Elementos | Grimório
    const tabCard=mkCard('explore');
    tabCard.innerHTML=`
      <div class="grimoire-tabs" id="grimoire-tabs">
        <button class="gtab active" id="gtab-el" onclick="switchGrimoireTab('elements')">🔮 Elementos</button>
        <button class="gtab" id="gtab-gr" onclick="switchGrimoireTab('grimoire')">📖 Grimório</button>
      </div>
      <div id="grimoire-panel"></div>`;
    sc.appendChild(card);
    sc.appendChild(tabCard);
    renderGrimoirePanel('elements');
    scrollBot(sc);
    return;
  }
  sc.appendChild(card);scrollBot(sc);
}

function switchGrimoireTab(tab){
  document.querySelectorAll('.gtab').forEach(b=>b.classList.remove('active'));
  $('gtab-'+(tab==='elements'?'el':'gr')).classList.add('active');
  renderGrimoirePanel(tab);
}

function renderGrimoirePanel(tab){
  const panel=$('grimoire-panel');
  if(!panel)return;
  if(tab==='elements'){
    // Renderiza o elemento picker dentro do painel
    const tierNames=['Primordial','Energia Pura','Entrópico','Condutor','Material Nobre','Elemental Básico'];
    const tierColors=['#ff6b35','#f1c40f','#9b59b6','#3498db','#95a5a6','#27ae60'];
    const byTier={};
    G.elements.forEach(el=>{if(!byTier[el.tier])byTier[el.tier]=[];byTier[el.tier].push(el);});
    let html='';
    if(!G.elements.length){
      html=`<div style="color:var(--txt2);font-style:italic;text-align:center;padding:20px;">Nenhum elemento aprendido ainda.<br>Encontre Tomos Elementais explorando.</div>`;
    } else {
      Object.keys(byTier).sort().forEach(tier=>{
        html+=`<div style="font-family:var(--cinzel);font-size:9px;color:${tierColors[tier]};letter-spacing:2px;margin:10px 0 6px;">TIER ${tier} — ${tierNames[tier]}</div>`;
        html+=`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:4px;">`;
        byTier[tier].forEach(el=>{
          const active=G.activeElement&&G.activeElement.id===el.id;
          html+=`<div onclick="setActiveElementPanel('${el.id}')" style="border:1px solid ${active?tierColors[tier]:'var(--brd2)'};border-radius:8px;padding:10px 6px;background:${active?'rgba(255,255,255,.06)':'rgba(255,255,255,.02)'};text-align:center;cursor:pointer;transition:.2s;">
            <div style="font-size:22px;">${el.ico}</div>
            <div style="font-family:var(--cinzel);font-size:9px;color:${active?tierColors[tier]:'var(--txt2)'};margin-top:4px;">${el.name}</div>
          </div>`;
        });
        html+=`</div>`;
      });
      // Fusões disponíveis para aprender (não em combate)
      const availFusions=FUSIONS.filter(f=>hasElement(f.e1)&&hasElement(f.e2)&&!hasElement(f.id));
      if(availFusions.length){
        html+=`<div style="font-family:var(--cinzel);font-size:9px;color:var(--gold);letter-spacing:2px;margin:14px 0 8px;padding-top:10px;border-top:1px solid var(--brd);">⚗️ FUSÕES PRONTAS</div>`;
        availFusions.forEach(f=>{
          const el1=ELEMENTS.find(e=>e.id===f.e1);const el2=ELEMENTS.find(e=>e.id===f.e2);
          html+=`<div onclick="fuseElementsPanel('${f.id}')" style="border:1px solid rgba(200,168,75,.3);border-radius:8px;padding:11px;background:rgba(200,168,75,.04);cursor:pointer;margin-bottom:6px;transition:.2s;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="font-size:18px;">${el1?el1.ico:'?'}</span><span style="font-family:var(--cinzel);font-size:10px;color:var(--txt2);">+</span>
              <span style="font-size:18px;">${el2?el2.ico:'?'}</span><span style="font-family:var(--cinzel);font-size:10px;color:var(--txt2);">→</span>
              <span style="font-size:18px;">${f.ico}</span>
              <span style="font-family:var(--cinzel);font-size:11px;color:var(--gold);">${f.name}</span>
              <span style="font-family:var(--cinzel);font-size:9px;color:var(--txt2);margin-left:auto;">Tier ${f.tier}</span>
            </div>
            <div style="font-size:12px;color:var(--txt2);font-style:italic;">${f.desc}</div>
          </div>`;
        });
      }
    }
    panel.innerHTML=html;
  } else {
    // ── GRIMÓRIO ──
    renderGrimoirePage(panel);
  }
}

function setActiveElementPanel(id){
  const el=G.elements.find(e=>e.id===id);
  if(!el)return;
  G.activeElement=G.activeElement?.id===id?null:el;
  toast(G.activeElement?`${el.ico} ${el.name} ativado!`:'Elemento desativado.');
  renderGrimoirePanel('elements');
}

function fuseElementsPanel(fusionId){
  const f=FUSIONS.find(x=>x.id===fusionId);
  if(!f||!hasElement(f.e1)||!hasElement(f.e2)||hasElement(f.id))return;
  G.elements.push({...f});
  toast(`✨ Fusão: ${f.ico} ${f.name} criada!`,2500);
  renderGrimoirePanel('elements');
}

function renderGrimoirePage(panel){
  // Insere searchbar + container de resultados
  panel.innerHTML=`
    <div class="grim-search-wrap">
      <input id="grim-search" class="grim-search-input" type="text" placeholder="🔍 Buscar fusão, elemento..." oninput="filterGrimoire(this.value)" autocomplete="off" autocorrect="off" spellcheck="false">
    </div>
    <div id="grim-results"></div>`;
  filterGrimoire('');
}

function filterGrimoire(q){
  const out=$('grim-results');
  if(!out)return;
  const query=(q||'').toLowerCase().trim();
  const tierColors=['#ff6b35','#f1c40f','#9b59b6','#3498db','#95a5a6','#27ae60'];
  const knownIds=new Set(G.elements.map(e=>e.id));

  const elData=id=>{
    const found=G.elements.find(e=>e.id===id)||ELEMENTS.find(e=>e.id===id)||FUSIONS.find(e=>e.id===id);
    return found||{ico:'?',name:id};
  };

  const matchFusion=(f)=>{
    if(!query)return true;
    const e1=elData(f.e1),e2=elData(f.e2);
    return f.name.toLowerCase().includes(query)||
      f.desc.toLowerCase().includes(query)||
      e1.name.toLowerCase().includes(query)||
      e2.name.toLowerCase().includes(query)||
      (elData(f.id)?.name||'').toLowerCase().includes(query);
  };

  // Se busca ativa — mostra tudo junto sem seções
  if(query){
    const matched=FUSIONS.filter(f=>!hasElement(f.id)&&matchFusion(f));
    if(!matched.length){out.innerHTML=`<div class="grim-empty">Nenhuma fusão encontrada para "${q}".</div>`;return;}
    out.innerHTML=matched.map(f=>{
      const hasE1=knownIds.has(f.e1),hasE2=knownIds.has(f.e2);
      const state=hasE1&&hasE2?'ready':hasE1||hasE2?'almost':'locked';
      const e1=elData(f.e1),e2=elData(f.e2);
      const c=tierColors[f.tier]||'#ccc';
      const missing=!hasE1?f.e1:!hasE2?f.e2:null;
      const missEl=missing?elData(missing):null;
      return `<div class="grim-row-c grim-${state}" style="border-color:${c}33;">
        <div class="grim-c-left">
          <span class="grc-combo">${e1.ico}+${e2.ico}→${f.ico}</span>
          <span class="grc-name" style="color:${c};">${f.name}</span>
          <span class="grc-tier">T${f.tier}·×${f.mult}</span>
        </div>
        <div class="grc-right">
          ${state==='ready'?`<span class="grc-badge ready">✔ Pronta</span>`:''}
          ${state==='almost'?`<span class="grc-badge almost">Falta ${missEl.ico}</span>`:''}
          ${state==='locked'?`<span class="grc-badge locked">🔒</span>`:''}
        </div>
      </div>`;
    }).join('');
    return;
  }

  // Sem busca — exibe seções normais compactas
  const ready=[],almost=[],locked=[];
  FUSIONS.forEach(f=>{
    if(hasElement(f.id))return;
    const hasE1=knownIds.has(f.e1),hasE2=knownIds.has(f.e2);
    if(hasE1&&hasE2) ready.push(f);
    else if(hasE1||hasE2) almost.push({f,missing:hasE1?f.e2:f.e1});
    else locked.push(f);
  });

  const rowC=(f,state,missingId)=>{
    const e1=elData(f.e1),e2=elData(f.e2),res=elData(f.id);
    const c=tierColors[f.tier]||'#ccc';
    const miss=missingId?elData(missingId):null;
    return `<div class="grim-row-c grim-${state}" style="border-color:${c}33;">
      <div class="grim-c-left">
        <span class="grc-combo">${e1.ico}+${e2.ico}→${f.ico}</span>
        <span class="grc-name" style="color:${c};">${f.name}</span>
        <span class="grc-tier">T${f.tier}·×${f.mult}</span>
      </div>
      <div class="grc-right">
        ${state==='ready'?`<span class="grc-badge ready">✔</span>`:''}
        ${state==='almost'&&miss?`<span class="grc-badge almost">Falta ${miss.ico} ${miss.name}</span>`:''}
        ${state==='locked'?`<span class="grc-badge locked">🔒</span>`:''}
      </div>
    </div>`;
  };

  let html='';
  html+=`<div class="grim-sec-hdr gold">⚡ PRONTAS <span class="grim-cnt">${ready.length}</span></div>`;
  html+=ready.length?ready.map(f=>rowC(f,'ready',null)).join(''):`<div class="grim-empty">Nenhuma ainda.</div>`;

  html+=`<div class="grim-sec-hdr purple">🔍 FALTA 1 ELEMENTO <span class="grim-cnt">${almost.length}</span></div>`;
  html+=almost.length?almost.slice(0,15).map(({f,missing})=>rowC(f,'almost',missing)).join(''):`<div class="grim-empty">Nenhuma.</div>`;
  if(almost.length>15)html+=`<div class="grim-empty">...e mais ${almost.length-15}.</div>`;

  const lockedShow=locked.filter(f=>f.tier<=2).slice(0,6);
  if(lockedShow.length){
    html+=`<div class="grim-sec-hdr muted">🔒 BLOQUEADAS T0–2 <span class="grim-cnt">${locked.length}</span></div>`;
    html+=lockedShow.map(f=>rowC(f,'locked',null)).join('');
  }

  out.innerHTML=html;
}

function renderStats(sc){
  sc.innerHTML='';
  const card=mkCard('explore');
  const el=Math.round((Date.now()-G.t0)/1000);
  const mm=Math.floor(el/60),ss=el%60;
  const rows=[['NÍVEL',G.level],['ANDAR',G.floor],['SUBCLASSE',G.subclass?G.subclass.name:'—'],['INIMIGOS',G.kills],['MISSÕES',G.missionsCompleted||0],['MOEDAS',G.gold],['ESQUIVA',Math.round(G.dodge*100)+'%'],['TEMPO',mm+':'+String(ss).padStart(2,'0')]];
  const passHtml=G.passives.length?`<div style="margin-top:10px;"><div class="panel-title" style="margin-bottom:8px;">⚡ PASSIVOS</div><div class="pass-row">${G.passives.map(p=>`<span class="pass-tag">${p}</span>`).join('')}</div></div>`:'';
  card.innerHTML=`<div class="panel-title">📜 STATUS</div>
    <div class="stat-table">${rows.map(([l,v])=>`<div class="srow"><div class="slbl">${l}</div><div class="sval" style="font-size:${String(v).length>6?'12':'17'}px;">${v}</div></div>`).join('')}</div>${passHtml}
    ${renderMissions()}
    <div style="margin-top:18px;text-align:center;">
      <button onclick="openCheatMenu()" style="background:transparent;border:1px solid rgba(255,255,255,.06);border-radius:6px;padding:5px 14px;font-family:var(--cinzel);font-size:9px;color:rgba(255,255,255,.15);letter-spacing:2px;cursor:pointer;">⚙ debug</button>
    </div>`;
  sc.appendChild(card);scrollBot(sc);
}

/* ═══ CHEAT MENU ═══ */
function openCheatMenu(){
  const existing=$('cheat-overlay');if(existing)existing.remove();
  const ov=document.createElement('div');ov.id='cheat-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9500;display:flex;align-items:flex-end;padding:12px;';
  const allItems=[...ITEMS_POOL];
  const allElements=[...ELEMENTS,...FUSIONS];
  ov.innerHTML=`
    <div class="cheat-sheet">
      <div class="cheat-header">
        <span>⚙ MENU DE DEBUG</span>
        <button class="cheat-close-btn" onclick="document.getElementById('cheat-overlay').remove()">✕ Fechar</button>
      </div>

      <div class="cheat-section-lbl">RECURSOS</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px;">
        <button class="cheat-btn" onclick="G.hp=G.hpMax;G.passives.includes('godmode')||(G.passives.push('godmode'));toast('❤️ Vida infinita ON!');upd();">❤️ Vida Infinita</button>
        <button class="cheat-btn" onclick="G.mp=G.mpMax;G.passives.includes('manamode')||(G.passives.push('manamode'));toast('💙 Mana infinita ON!');upd();">💙 Mana Infinita</button>
        <button class="cheat-btn" onclick="addGold(99999);toast('💰 +99999 moedas!');">💰 Dinheiro Infinito</button>
        <button class="cheat-btn" onclick="addXP(99999);toast('⬆ XP maciço!');">⬆ XP Maciço</button>
      </div>

      <div class="cheat-section-lbl">ADICIONAR ITEM</div>
      <input id="cheat-item-search" oninput="renderCheatItems()" placeholder="Buscar item..." class="cheat-input">
      <div id="cheat-item-list" style="display:flex;flex-direction:column;gap:5px;max-height:200px;overflow-y:auto;"></div>

      <div class="cheat-section-lbl" style="margin-top:14px;">APRENDER ELEMENTO / FUSÃO</div>
      <input id="cheat-el-search" oninput="renderCheatElements()" placeholder="Buscar elemento ou fusão..." class="cheat-input">
      <div id="cheat-el-list" style="display:flex;flex-direction:column;gap:5px;max-height:200px;overflow-y:auto;"></div>
    </div>`;
  document.body.appendChild(ov);
  renderCheatItems();
  renderCheatElements();
}

function renderCheatItems(){
  const q=($('cheat-item-search')?.value||'').toLowerCase();
  const list=$('cheat-item-list');if(!list)return;
  const filtered=ITEMS_POOL.filter(i=>i.name.toLowerCase().includes(q)||i.desc.toLowerCase().includes(q));
  list.innerHTML=filtered.slice(0,20).map(it=>`
    <button class="cheat-btn" style="justify-content:flex-start;gap:8px;text-align:left;" onclick="cheatAddItem('${it.id}')">
      <span style="font-size:16px;">${it.ico}</span>
      <span style="flex:1;font-size:11px;">${it.name}</span>
      <span style="font-size:10px;color:var(--${it.rarity});">${it.rarity}</span>
    </button>`).join('');
}

function renderCheatElements(){
  const q=($('cheat-el-search')?.value||'').toLowerCase();
  const list=$('cheat-el-list');if(!list)return;
  const all=[...ELEMENTS,...FUSIONS];
  const filtered=all.filter(e=>e.name.toLowerCase().includes(q)||e.desc.toLowerCase().includes(q));
  list.innerHTML=filtered.slice(0,20).map(e=>`
    <button class="cheat-btn" style="justify-content:flex-start;gap:8px;text-align:left;" onclick="cheatAddElement('${e.id}')">
      <span style="font-size:16px;">${e.ico}</span>
      <span style="flex:1;font-size:11px;">${e.name}</span>
      <span style="font-size:10px;color:var(--txt2);">Tier ${e.tier}</span>
    </button>`).join('');
}

function cheatAddItem(id){
  const it=ITEMS_POOL.find(i=>i.id===id);if(!it)return;
  const copy={...it,id:'cheat_'+r(99999)};
  if(G.inv.length>=16){toast('Mochila cheia!');return;}
  G.inv.push(copy);upd();toast(`${it.ico} ${it.name} adicionado!`);
}

function cheatAddElement(id){
  const el=[...ELEMENTS,...FUSIONS].find(e=>e.id===id);if(!el)return;
  if(G.elements.some(e=>e.id===id)){toast('Elemento já conhecido!');return;}
  G.elements.push({...el});toast(`${el.ico} ${el.name} aprendido!`);
}

/* ═══ ITEM OVERLAY ═══ */
function openItemOverlay(items,inCombat){
  sfx('open');
  const grid=$('isheet-grid');grid.innerHTML='';
  items.forEach(it=>{
    const btn=document.createElement('button');btn.className='isheet-btn';
    btn.innerHTML=`<span class="isheet-ico">${it.ico}</span><div class="isheet-info"><div class="isheet-name ${it.rarity||'common'}">${it.name}</div><div class="isheet-desc">${it.desc||''}</div></div>`;
    btn.onclick=()=>{
      closeItemOverlay();
      if(it.fn)it.fn(G,inCombat?{E:CE,combat:true,flee:(forced)=>{if(forced){G.inCombat=false;CE=null;combatLog=[];}}}:{});
      it.uses--;if(it.uses<=0)G.inv.splice(G.inv.indexOf(it),1);
      upd();
      if(inCombat){if(CE&&CE.hpCur>0)enemyTurn();checkEnd();if(G.inCombat)renderCombat($('scroll'));else lockBtns(0);}
    };
    grid.appendChild(btn);
  });
  show('item-overlay');
}
function closeItemOverlay(){hide('item-overlay');lockBtns(0);}

/* ═══ FUSION OVERLAY ═══ */
function openFusionOverlay(fusions, mpCost){
  sfx('open');
  const grid=$('fusion-grid');
  const subtitle=$('fusion-subtitle');
  grid.innerHTML='';
  const tierColors=['#ff6b35','#f1c40f','#9b59b6','#3498db','#95a5a6','#27ae60'];
  const tierNames=['Primordial','Energia Pura','Entrópico','Condutor','Material Nobre','Elemental Básico'];

  // Ordena por tier (mais poderoso primeiro = menor tier)
  const sorted=[...fusions].sort((a,b)=>a.tier-b.tier);

  if(!sorted.length){
    grid.innerHTML='<div style="color:var(--txt2);text-align:center;padding:16px;font-family:var(--cinzel);font-size:11px;">Nenhuma fusão disponível.<br>Aprenda mais elementos para desbloquear.</div>';
  } else {
    subtitle.textContent=sorted.length+' fusão'+(sorted.length>1?'ões':'')+' disponível'+(sorted.length>1?'is':'')+' · Custo: '+mpCost+' MP';
    sorted.forEach(f=>{
      const el1=G.elements.find(e=>e.id===f.e1)||ELEMENTS.find(e=>e.id===f.e1);
      const el2=G.elements.find(e=>e.id===f.e2)||ELEMENTS.find(e=>e.id===f.e2);
      const color=tierColors[f.tier]||'#ccc';
      const tierLabel=tierNames[f.tier]||'Tier '+f.tier;
      const btn=document.createElement('button');
      btn.className='isheet-btn fusion-btn';
      btn.style.cssText='border-color:'+color+'33;';
      btn.innerHTML=`
        <div class="fusion-btn-top">
          <span class="fusion-tier-badge" style="color:${color};border-color:${color}44;">${tierLabel}</span>
          <span class="fusion-mult" style="color:${color};">×${f.mult}</span>
        </div>
        <div class="fusion-combo">
          <span>${el1?el1.ico:'?'}</span>
          <span class="fusion-plus">+</span>
          <span>${el2?el2.ico:'?'}</span>
          <span class="fusion-arrow">→</span>
          <span>${f.ico}</span>
        </div>
        <div class="isheet-name" style="color:${color};margin:4px 0 2px;">${f.ico} ${f.name}</div>
        <div class="isheet-desc">${f.desc}</div>`;
      btn.onclick=()=>{
        closeFusionOverlay();
        G.mp=G.passives.includes('manamode')?G.mpMax:G.mp-mpCost;
        upd();
        doFusionSkill(f);
        if(CE&&CE.hpCur>0)enemyTurn();
        checkEnd();
      };
      grid.appendChild(btn);
    });
  }
  show('fusion-overlay');
}

function closeFusionOverlay(){hide('fusion-overlay');lockBtns(0);}

function doFusionSkill(f){
  if(!CE)return;
  const baseDmg=Math.round(Math.max(6, G.mag*f.mult+r(14)));
  CE.hpCur=Math.max(0,CE.hpCur-baseDmg);
  G.totalDmg+=baseDmg;
  dentReadyBar(baseDmg);
  G._mSkillUses=(G._mSkillUses||0)+1;
  // Status baseado na fusão
  const elStatus={
    fogo:'burn',magma:'burn',plasma:'burn',fogo_fatuo:'burn',fenix:'burn',
    fenix:'burn',ceramica:'burn',po_diamante:'burn',
    veneno:'poison',toxina_mortal:'poison',toxina_liq:'poison',toxina_acida:'poison',
    gelo:'freeze',nevoeiro_gelido:'freeze',frio_da_morte:'freeze',preservacao:'freeze',mercurio_sol:'freeze',
  };
  const statusType=elStatus[f.id]||null;
  if(statusType&&CE.hpCur>0){
    const sTurns=statusType==='burn'?0:2;
    const sDmg=statusType==='burn'?Math.round(G.mag*.3):statusType==='poison'?Math.round(G.mag*.25):0;
    applyStatus(CE,statusType,sTurns,sDmg);
    const sLabel={burn:'🔥 Queimadura',poison:'🐍 Veneno',freeze:'❄️ Congelamento'};
    clog(`⚗️ ${f.ico} ${f.name}: ${baseDmg} dano + ${sLabel[statusType]}!`,'lc');
  } else {
    clog(`⚗️ ${f.ico} ${f.name}: ${baseDmg} dano de fusão!`,'lc');
  }
  floatDmg('⚗️'+baseDmg,'#c39bd3',55,35);
  sfx('fusion');spawnParticles(16,'#c39bd3');flashCard('rgba(195,155,211,.35)',280);pulseEnemyIco();
  updateCombatUI();
}

/* ═══ ITEM HELPERS ═══ */
function randItemByRarity(mode){
  let pool;
  if(mode==='common')pool=ITEMS_POOL.filter(i=>i.rarity==='common');
  else if(mode==='rare+')pool=ITEMS_POOL.filter(i=>['rare','epic','legendary'].includes(i.rarity));
  else{
    const w={common:.5,rare:.32,epic:.14,legendary:.04};
    const rn=Math.random();let cum=0,chosen='common';
    for(const[k,v] of Object.entries(w)){cum+=v;if(rn<cum){chosen=k;break;}}
    pool=ITEMS_POOL.filter(i=>i.rarity===chosen);
  }
  if(!pool||!pool.length)pool=ITEMS_POOL;
  return{...pick(pool),id:'item_'+r(99999)};
}
function addItemToInv(it){
  if(G.inv.length>=16){toast('Mochila cheia!');return;}
  G.inv.push(it);
  if(it.rarity==='legendary'){logRun('💎',`Lendário obtido: ${it.ico} ${it.name}`,'crit');sfx('legendary');}
  else if(it.rarity==='epic'){logRun('✨',`Épico obtido: ${it.ico} ${it.name}`,'win');sfx('open');}
  upd();
}
function applyBonus(it){
  if(!it.bonus)return;
  Object.entries(it.bonus).forEach(([k,v])=>{G[k]=(G[k]||0)+v;if(k==='hpMax')G.hp=Math.min(G.hpMax,G.hp+v);});
  upd();
}

/* ═══ DEATH / WIN ═══ */
function fmtTime(){const el=Math.round((Date.now()-G.t0)/1000);return Math.floor(el/60)+':'+String(el%60).padStart(2,'0');}
function dstatRows(rows){return rows.map(([l,v])=>`<div class="dstat"><div class="dl">${l}</div><div class="dv" style="font-size:${String(v).length>6?'12':'17'}px;">${v}</div></div>`).join('');}
function showDeath(msg){
  G.inCombat=false;
  const sd=$('s-death');
  const typeColor={win:'var(--grn2)',crit:'var(--gold)',neutral:'var(--txt2)'};
  // Build run log HTML
  const logHtml=(G.runLog&&G.runLog.length)
    ?`<div class="run-history">
        <div class="run-history-title">📜 CRÔNICA DA RUN</div>
        <div class="run-history-list">
          ${G.runLog.map(e=>`
            <div class="rh-entry">
              <span class="rh-ico">${e.ico}</span>
              <span class="rh-txt" style="color:${typeColor[e.type]||'var(--txt2)'};">${e.txt}</span>
              <span class="rh-loc">Andar ${e.floor} · Sala ${e.room}</span>
            </div>`).join('')}
        </div>
      </div>`
    :'';

  sd.innerHTML=`
    <div class="d-skull">💀</div>
    <h2 class="d-title">Fim da Jornada</h2>
    <p class="d-sub">${msg}</p>
    <p class="d-narr" style="font-style:italic;color:var(--txt2);margin-bottom:16px;font-size:14px;max-width:360px;text-align:center;">"${narr('death')}"</p>
    <div class="d-stats" id="d-stats">${dstatRows([['NÍVEL',G.level],['ANDAR',G.floor],['SUBCLASSE',G.subclass?G.subclass.name:'—'],['INIMIGOS',G.kills],['DANO',G.totalDmg],['TEMPO',fmtTime()]])}</div>
    ${logHtml}
    <button class="btn-retry" onclick="goTitle()">↩ Nova Jornada</button>
    <button class="btn-retry" style="background:transparent;border-color:var(--brd2);color:var(--txt2);margin-top:0;" onclick="goTitle()">Menu Principal</button>`;
  hide('s-game');show('s-death');
}
function showVictory(){
  const ng=G.ngPlus||0;
  const nextNg=ng+1;
  const sc=$('s-win');

  // Limpa botões antigos e reconstrói a tela
  sc.innerHTML=`
    <div class="w-star">🏆</div>
    <h2 class="w-title">VITÓRIA!</h2>
    <p style="font-style:italic;color:var(--txt2);margin-bottom:20px;" id="w-msg">
      ${ng>0?`NG+${ng} conquistado! `:''}Você derrotou o Rei Lich e libertou as terras das trevas!
    </p>
    <div class="d-stats" id="w-stats">${dstatRows([
      ['NÍVEL',G.level],
      ['SUBCLASSE',G.subclass?G.subclass.name:'—'],
      ['INIMIGOS',G.kills],
      ['DANO',G.totalDmg],
      ['MOEDAS',G.gold],
      ['TEMPO',fmtTime()]
    ])}</div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px;width:100%;max-width:360px;">
      <button class="btn-retry" onclick="startNG()">
        ⚔️ Nova Jornada — NG+${nextNg}
        <div style="font-size:10px;font-family:var(--cinzel);opacity:.7;margin-top:3px;letter-spacing:1px;">Inimigos +${Math.round(nextNg*30)}% mais fortes · Recompensas maiores</div>
      </button>
      <button class="btn-retry" style="background:rgba(41,128,185,.12);border-color:rgba(41,128,185,.5);color:#7ec8e3;" onclick="continueInfinite()">
        🌀 Modo Infinito — Andar ${G.floor+1}
        <div style="font-size:10px;font-family:var(--cinzel);opacity:.7;margin-top:3px;letter-spacing:1px;">Continue com seu personagem atual</div>
      </button>
      <button style="width:100%;padding:11px;border:1px solid var(--brd2);border-radius:8px;background:transparent;color:var(--txt2);font-family:var(--cinzel);font-size:12px;letter-spacing:2px;cursor:pointer;" onclick="goTitle()">
        ↩ Menu Principal
      </button>
    </div>`;

  hide('s-game');show('s-win');
}

function startNG(){
  const ng=(G.ngPlus||0)+1;
  const cls=G.cls;
  hide('s-win');
  newG(cls);
  G.ngPlus=ng;
  G.ngMult=1+ng*0.3;
  show('s-game');
  upd();
  toast(`⚔️ NG+${ng} iniciado! Inimigos ${Math.round(ng*30)}% mais fortes.`,2500);
  navTo('explore');
}

function continueInfinite(){
  hide('s-win');
  G.floor++;
  G.room=0;
  G.maxRooms=10;
  generateMissions();
  show('s-game');
  upd();
  toast(`🌀 Andar ${G.floor} — as trevas se aprofundam.`,2000);
  navTo('explore');
}

/* ═══ SISTEMA DE TEMAS ═══ */
const THEMES = {
  grimorio: { label:'Grimório',        desc:'Âmbar & sombras clássicas' },
  ice:      { label:'Cripta de Gelo',  desc:'Azul cristalino & frio' },
  inferno:  { label:'Forja Infernal',  desc:'Fogo, laranja & caos' },
  void:     { label:'Vazio Arcano',    desc:'Roxo profundo & névoa' },
  nature:   { label:'Floresta Antiga', desc:'Verde vivo & serenidade' },
  blood:    { label:'Pacto de Sangue', desc:'Carmesim & trevas' },
  abyss:    { label:'Abismo Profundo', desc:'Preto, roxo & marinho' },
  dawn:     { label:'Alvorada Celeste',desc:'Branco, dourado & azul bebê' },
};

let _currentTheme = localStorage.getItem('cronista_theme') || 'grimorio';
let _is16Bit = localStorage.getItem('cronista_16bit') === '1';

function applyTheme(id) {
  _currentTheme = id;
  localStorage.setItem('cronista_theme', id);
  const root = document.documentElement;
  Object.keys(THEMES).forEach(t => root.removeAttribute('data-theme'));
  if (id !== 'grimorio') root.setAttribute('data-theme', id);
  document.querySelectorAll('.theme-card').forEach(c => {
    c.classList.toggle('active', c.dataset.t === id);
  });
  toast(`${THEMES[id]?.label || id} ativado!`, 1500);
}

function toggle16Bit(){
  _is16Bit=!_is16Bit;
  try{localStorage.setItem('cronista_16bit',_is16Bit?'1':'0');}catch(e){}
  apply16Bit();
}

function apply16Bit(){
  document.documentElement.classList.toggle('mode-16bit',_is16Bit);
  const btn=$('btn-16bit');
  if(btn){btn.textContent=_is16Bit?'ON':'OFF';btn.classList.toggle('active',_is16Bit);}
}

function openThemeOverlay() {
  document.querySelectorAll('.theme-card').forEach(c => {
    c.classList.toggle('active', c.dataset.t === _currentTheme);
  });
  apply16Bit();
  show('theme-overlay');
}

function closeThemeOverlay() {
  hide('theme-overlay');
}

/* ═══ INIT ═══ */
applyTheme(_currentTheme);
apply16Bit();
buildTitle();
