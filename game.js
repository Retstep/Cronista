'use strict';

/* ═══ TOMO DO CRONISTA — Persistência entre runs ═══ */
// Estrutura: {
//   fusions: { [fusionId]: { name, ico, count, discovered } }
//   enemies: { [enemyId]: { name, ico, kills } }
//   events:  { [eventId]: { title, ico, count } }
//   deaths:  { [causeType]: { label, count } }  causeType: combat/poison/boss/event/etc
// }

function tomoLoad(){
  try {
    return JSON.parse(localStorage.getItem('cronista_tomo')||'{}');
  } catch(e){ return {}; }
}
function tomoSave(t){ localStorage.setItem('cronista_tomo', JSON.stringify(t)); }

function tomoGet(){
  const t = tomoLoad();
  if(!t.fusions) t.fusions = {};
  if(!t.enemies) t.enemies = {};
  if(!t.events)  t.events  = {};
  if(!t.deaths)  t.deaths  = {};
  return t;
}

// Registra fusão usada em combate
function tomoRecordFusion(f){
  const t = tomoGet();
  if(!t.fusions[f.id]) t.fusions[f.id] = { name:f.name, ico:f.ico, tier:f.tier, count:0 };
  t.fusions[f.id].count++;
  tomoSave(t);
}

// Registra inimigo morto
function tomoRecordKill(enemy){
  const t = tomoGet();
  const key = enemy.id || enemy.name;
  if(!t.enemies[key]) t.enemies[key] = { name:enemy.name, ico:enemy.ico, sub:enemy.sub||'', kills:0 };
  t.enemies[key].kills++;
  tomoSave(t);
}

// Registra evento vivido
function tomoRecordEvent(evId, evTitle, evIco){
  const t = tomoGet();
  if(!t.events[evId]) t.events[evId] = { title:evTitle, ico:evIco, count:0 };
  t.events[evId].count++;
  tomoSave(t);
}

// Registra morte e causa
function tomoRecordDeath(causeType, label){
  const t = tomoGet();
  if(!t.deaths[causeType]) t.deaths[causeType] = { label, count:0 };
  t.deaths[causeType].count++;
  tomoSave(t);
}

// Bônus do Tomo aplicados ao iniciar run
function tomoApplyBonuses(){
  if(!G) return;
  const t = tomoGet();
  // Fusões dominadas (5+ usos): -5 MP por fusão dominada, máx -30
  const dominatedFusions = Object.values(t.fusions).filter(f=>f.count>=5).length;
  G.mpDiscount = (G.mpDiscount||0) + Math.min(30, dominatedFusions * 5);
  // Mortes por tipo: resistência acumulada
  Object.entries(t.deaths).forEach(([type, d])=>{
    if(d.count >= 2){
      if(type==='poison' && !G.passives.includes('tomo_res_poison')){ G.passives.push('tomo_res_poison'); }
      if(type==='burn'   && !G.passives.includes('tomo_res_burn'))  { G.passives.push('tomo_res_burn'); }
      if(type==='boss'   && !G.passives.includes('tomo_res_boss'))  { G.passives.push('tomo_res_boss'); G.def+=2; }
      if(type==='combat' && !G.passives.includes('tomo_res_combat')){ G.passives.push('tomo_res_combat'); G.hpMax+=10; G.hp+=10; }
    }
  });
}

// Verifica se inimigo está "estudado" (3+ kills)
function tomoIsEnemyStudied(enemyId){
  const t = tomoGet();
  return (t.enemies[enemyId]?.kills||0) >= 3;
}

// Verifica se evento tem opção extra desbloqueada (2+ visitas)
function tomoEventUnlocked(evId){
  const t = tomoGet();
  return (t.events[evId]?.count||0) >= 2;
}

// Raridade da entrada no Tomo
function tomoRarity(count, type){
  if(type==='fusion'){
    if(count>=20) return 'legendary';
    if(count>=10) return 'epic';
    if(count>=5)  return 'rare';
    return 'common';
  }
  if(type==='enemy'){
    if(count>=20) return 'legendary';
    if(count>=10) return 'epic';
    if(count>=3)  return 'rare';
    return 'common';
  }
  if(type==='event'){
    if(count>=10) return 'epic';
    if(count>=5)  return 'rare';
    return 'common';
  }
  if(count>=5) return 'rare';
  return 'common';
}

/* ─── Tela do Tomo ─── */
function showTomoScreen(){
  const t = tomoGet();
  const rarityColor = { common:'var(--txt2)', rare:'var(--blu)', epic:'var(--purple,#9b59b6)', legendary:'var(--gold)' };
  const rarityLabel = { common:'Comum', rare:'Raro', epic:'Épico', legendary:'Lendário' };

  const fusionEntries = Object.values(t.fusions).sort((a,b)=>b.count-a.count);
  const enemyEntries  = Object.values(t.enemies).sort((a,b)=>b.kills-a.kills);
  const eventEntries  = Object.values(t.events).sort((a,b)=>b.count-a.count);
  const deathEntries  = Object.entries(t.deaths).map(([k,v])=>({...v,key:k})).sort((a,b)=>b.count-a.count);

  const totalEntries = fusionEntries.length + enemyEntries.length + eventEntries.length + deathEntries.length;

  const dominated = fusionEntries.filter(f=>f.count>=5).length;
  const mpDisc = Math.min(30, dominated*5);

  const section = (title, ico, items, emptyTxt) => `
    <div class="tomo-section">
      <div class="tomo-section-title">${ico} ${title}</div>
      ${items.length ? items.map(i=>i).join('') : `<div class="tomo-empty">${emptyTxt}</div>`}
    </div>`;

  const fusionRows = fusionEntries.map(f=>{
    const rar = tomoRarity(f.count,'fusion');
    const dominated = f.count>=5;
    return `<div class="tomo-entry">
      <span class="tomo-ico">${f.ico}</span>
      <div class="tomo-info">
        <span class="tomo-name" style="color:${rarityColor[rar]}">${f.name}</span>
        <span class="tomo-sub">${dominated?'✦ Dominada — −5 MP':'Usada '+f.count+'× '+(dominated?'':'— '+Math.max(0,5-f.count)+' para dominar')}</span>
      </div>
      <span class="tomo-badge" style="color:${rarityColor[rar]}">${rarityLabel[rar]}</span>
    </div>`;
  });

  const enemyRows = enemyEntries.map(e=>{
    const rar = tomoRarity(e.kills,'enemy');
    const studied = e.kills>=3;
    return `<div class="tomo-entry">
      <span class="tomo-ico">${e.ico}</span>
      <div class="tomo-info">
        <span class="tomo-name" style="color:${rarityColor[rar]}">${e.name}</span>
        <span class="tomo-sub">${studied?'✦ Estudado — fraqueza revelada':e.kills+'× morto — '+Math.max(0,3-e.kills)+' para estudar'}</span>
      </div>
      <span class="tomo-badge" style="color:${rarityColor[rar]}">${rarityLabel[rar]}</span>
    </div>`;
  });

  const eventRows = eventEntries.map(e=>{
    const rar = tomoRarity(e.count,'event');
    const unlocked = e.count>=2;
    return `<div class="tomo-entry">
      <span class="tomo-ico">${e.ico}</span>
      <div class="tomo-info">
        <span class="tomo-name" style="color:${rarityColor[rar]}">${e.title}</span>
        <span class="tomo-sub">${unlocked?'✦ Opção secreta desbloqueada':'Visitado '+e.count+'×'+(e.count<2?' — mais 1 para desbloquear':'')}</span>
      </div>
      <span class="tomo-badge" style="color:${rarityColor[rar]}">${rarityLabel[rar]}</span>
    </div>`;
  });

  const deathRows = deathEntries.map(d=>{
    const rar = tomoRarity(d.count,'death');
    const resisted = d.count>=2;
    return `<div class="tomo-entry">
      <span class="tomo-ico">💀</span>
      <div class="tomo-info">
        <span class="tomo-name" style="color:${rarityColor[rar]}">${d.label}</span>
        <span class="tomo-sub">${resisted?'✦ Resistência adquirida (+15%)':'Morreu '+d.count+'×'+(d.count<2?' — mais 1 para resistência':'')}</span>
      </div>
      <span class="tomo-badge" style="color:${rarityColor[rar]}">${rarityLabel[rar]}</span>
    </div>`;
  });

  const tomoEl = document.getElementById('tomo-screen');
  tomoEl.innerHTML = `
    <div class="tomo-wrap">
      <div class="tomo-header">
        <div class="tomo-title">📖 TOMO DO CRONISTA</div>
        <div class="tomo-subtitle">${totalEntries} entrada${totalEntries!==1?'s':''} registrada${totalEntries!==1?'s':''}</div>
        ${mpDisc>0?`<div class="tomo-bonus-row">✦ Bônus ativo: fusões dominadas reduzem −${mpDisc} MP nesta run</div>`:''}
      </div>
      ${section('Fusões Elementais','⚗️', fusionRows, 'Nenhuma fusão usada ainda.')}
      ${section('Inimigos Estudados','⚔️', enemyRows, 'Nenhum inimigo registrado ainda.')}
      ${section('Eventos Vividos','🗺️', eventRows, 'Nenhum evento registrado ainda.')}
      ${section('Causas de Morte','💀', deathRows, 'Nenhuma morte registrada ainda.')}
      <button class="tomo-close-btn" onclick="hideTomoScreen()">← Voltar</button>
    </div>`;

  document.getElementById('tomo-screen').classList.remove('off');
  document.getElementById('s-title').classList.add('off');
}

function hideTomoScreen(){
  document.getElementById('tomo-screen').classList.add('off');
  document.getElementById('s-title').classList.remove('off');
}



/* ═══ MEMÓRIAS — fragmentos de vidas passadas ═══ */
const MEMORIES = [
  // Afinidade: forca
  {id:'mem_warrior',  name:'Memória do Guerreiro',   ico:'⚔️', mp:10, desc:'Golpe físico pesado. Dano baseado em ATK.',      type:'mem_warrior',   affinity:'forca',   rarity:'common'},
  {id:'mem_berserker',name:'Memória do Berserker',   ico:'🪓', mp:14, desc:'Ataque duplo. Consome 10% do HP próprio.',       type:'mem_berserker', affinity:'forca',   rarity:'rare'},
  {id:'mem_knight',   name:'Memória do Cavaleiro',   ico:'🛡️',mp:8,  desc:'Bloqueia próximo ataque. +3 DEF por 2 turnos.', type:'mem_knight',    affinity:'forca',   rarity:'common'},
  // Afinidade: arcano
  {id:'mem_mage',     name:'Memória do Mago',        ico:'🔥', mp:18, desc:'Dano mágico massivo baseado em MAG.',            type:'mem_mage',      affinity:'arcano',  rarity:'common'},
  {id:'mem_shaman',   name:'Memória do Xamã',        ico:'🌀', mp:22, desc:'Invoca o elemento ativo.',                       type:'elemental',     affinity:'arcano',  rarity:'common'},
  {id:'mem_oracle',   name:'Memória da Oráculo',     ico:'🔮', mp:16, desc:'Drena MP do inimigo e cura HP.',                type:'mem_oracle',    affinity:'arcano',  rarity:'rare'},
  {id:'mem_necro',    name:'Memória do Necromante',  ico:'💀', mp:20, desc:'Enfraquece inimigo: -4 ATK por 3 turnos.',      type:'mem_necro',     affinity:'arcano',  rarity:'rare'},
  // Afinidade: espirito
  {id:'mem_healer',   name:'Memória do Curandeiro',  ico:'💚', mp:14, desc:'Cura HP baseada em MAG.',                       type:'mem_healer',    affinity:'espirito',rarity:'common'},
  {id:'mem_assassin', name:'Memória do Assassino',   ico:'🌑', mp:12, desc:'Dano crítico garantido.',                       type:'sneak',         affinity:'espirito',rarity:'common'},
  {id:'mem_bard',     name:'Memória do Trovador',    ico:'🎵', mp:10, desc:'+4 ATK e +4 DEF por 3 turnos.',                type:'mem_bard',      affinity:'espirito',rarity:'rare'},
  // Afinidade: vigor
  {id:'mem_titan',    name:'Memória do Titã',        ico:'💪', mp:16, desc:'Ataque pesado. Cura 10 HP por golpe.',          type:'mem_titan',     affinity:'vigor',   rarity:'rare'},
  {id:'mem_monk',     name:'Memória do Monge',       ico:'🥋', mp:8,  desc:'Ataque rápido 3x consecutivo.',                type:'mem_monk',      affinity:'vigor',   rarity:'common'},
  // Memórias épicas — andar 3+
  {id:'mem_dragonborn',name:'Memória do Dragão',     ico:'🐉', mp:30, desc:'Sopro elemental devastador. Ignora DEF.',       type:'mem_dragon',    affinity:'arcano',  rarity:'epic'},
  {id:'mem_valkyrie', name:'Memória da Valquíria',   ico:'⚡', mp:25, desc:'Ataque relâmpago + ressuscita com 30 HP uma vez.',type:'mem_valkyrie', affinity:'forca',  rarity:'epic'},
  {id:'mem_anubis',   name:'Memória de Anúbis',      ico:'⚖️', mp:28, desc:'Julga o inimigo: dano = karma acumulado × 3.', type:'mem_anubis',    affinity:'espirito',rarity:'epic'},
];

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
  {id:'warrior',name:'Paladino',ico:'🛡️',flavor:'Guardião sagrado — protege, pune e persiste.',
   hp:120,mp:40,atk:13,def:10,mag:4,spd:5,crit:.09,dodge:.05,lifesteal:0,bars:{atk:82,def:72,mag:22},
   skill:{name:'Golpe Sagrado',ico:'✨',mp:12,desc:'Dano físico + sagrado. Cura 8 HP.',type:'holy_strike'},
   skill2:{name:'Escudo Divino',ico:'🛡️',mp:10,desc:'Bloqueia próximo ataque. +4 DEF por 2 turnos.',type:'divine_shield'},
   items:['🛡️ Escudo Abençoado','⚔️ Espada da Luz'],
   subclasses:[
     {id:'paladin_holy',key:'pld',name:'Arauto Sagrado',ico:'☀️🛡️',desc:'Cura poderosa e proteção divina.',bonus:'DEF+6, Cura 12HP/turno',fn:G=>{G.def+=6;G.passives.push('regen_strong');}},
     {id:'crusader',key:'bsk',name:'Cruzado',ico:'⚔️✨',desc:'Ataque sagrado com dano duplo contra mortos-vivos.',bonus:'ATK+7, Dano +50% vs Undead',fn:G=>{G.atk+=7;G.passives.push('holy_dmg');}},
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
  {id:'druid',name:'Druida',ico:'🌿',flavor:'A natureza cura — mas também devora.',
   hp:90,mp:75,atk:7,def:6,mag:13,spd:7,crit:.10,dodge:.08,lifesteal:.04,bars:{atk:44,def:44,mag:78},
   skill:{name:'Espinhos da Floresta',ico:'🌿',mp:14,desc:'Dano de natureza + veneno por 3 turnos.',type:'thorns'},
   skill2:{name:'Pulso Vital',ico:'💚',mp:16,desc:'Cura 25% do HP máximo.',type:'vital_pulse'},
   items:['🌿 Cajado de Raiz','🍄 Fungo Curativo'],
   subclasses:[
     {id:'archdruid',key:'arc',name:'Arquidruida',ico:'🌳🌿',desc:'Mestre da natureza — venenos letais e cura ampliada.',bonus:'MAG+6, Veneno dura +2 turnos',fn:G=>{G.mag+=6;G.passives.push('long_poison');}},
     {id:'shapeshifter',key:'shd',name:'Metamorfo',ico:'🐻🌿',desc:'Transforma-se, ganhando HP e ATK temporários.',bonus:'HP+25, ATK+5 por combate',fn:G=>{G.hpMax+=25;G.hp=Math.min(G.hpMax,G.hp+25);G.atk+=5;}},
   ]},
  {id:'hunter',name:'Caçador',ico:'🏹',flavor:'Nenhuma presa escapa. Nenhum erro é tolerado.',
   hp:85,mp:48,atk:13,def:5,mag:3,spd:12,crit:.18,dodge:.14,lifesteal:0,bars:{atk:82,def:32,mag:18},
   skill:{name:'Flecha Certeira',ico:'🏹',mp:10,desc:'Dano físico alto. Bônus se inimigo estiver marcado.',type:'precise_arrow'},
   skill2:{name:'Marcar Presa',ico:'🎯',mp:8,desc:'Marca o inimigo: +25% dano recebido por 3 turnos.',type:'mark_prey'},
   items:['🏹 Arco Longo','🪤 Armadilha de Ferro'],
   subclasses:[
     {id:'trapper',key:'pld',name:'Trapaceiro',ico:'🪤🏹',desc:'Especialista em armadilhas — paralisa e sangra inimigos.',bonus:'VEL+3, Paralisia ao marcar',fn:G=>{G.spd+=3;G.passives.push('trap_master');}},
     {id:'beastmaster',key:'shd',name:'Domador',ico:'🐺🏹',desc:'Companheiro animal concede bônus em combate.',bonus:'CRIT+10%, DODGE+8%',fn:G=>{G.crit+=.10;G.dodge+=.08;}},
   ]},
  {id:'sorcerer',name:'Feiticeiro',ico:'⚡',flavor:'Poder caótico e instável. Grandioso ou devastador.',
   hp:55,mp:110,atk:4,def:2,mag:20,spd:7,crit:.15,dodge:.07,lifesteal:0,bars:{atk:25,def:12,mag:100},
   skill:{name:'Descarga Caótica',ico:'⚡',mp:20,desc:'Dano mágico aleatório (pode ser massivo ou fraco).',type:'chaos_bolt'},
   skill2:{name:'Surto Arcano',ico:'🌀',mp:25,desc:'Dano mágico garantido alto. Custa 15 HP próprio.',type:'arcane_surge'},
   items:['⚡ Varinha do Caos','📜 Pergaminho Instável'],
   subclasses:[
     {id:'chaos_mage',key:'arc',name:'Mago do Caos',ico:'🌀⚡',desc:'Amplifica o caos — dano extremo com riscos extremos.',bonus:'MAG+10, Chance de explodir (dano duplo ou zero)',fn:G=>{G.mag+=10;G.passives.push('chaos_master');}},
     {id:'storm_caller',key:'shd',name:'Invocador da Tempestade',ico:'🌩️⚡',desc:'Controla o caos com raios em cadeia.',bonus:'MAG+6, Dano em cadeia nos inimigos',fn:G=>{G.mag+=6;G.passives.push('chain_lightning');}},
   ]},
  {id:'barbarian',name:'Bárbaro',ico:'🪓',flavor:'Não há estratégia. Apenas fúria. Apenas sangue.',
   hp:140,mp:20,atk:18,def:5,mag:1,spd:6,crit:.14,dodge:.04,lifesteal:.03,bars:{atk:100,def:35,mag:5},
   skill:{name:'Frenesi',ico:'🪓',mp:8,desc:'Ataca 2-3 vezes. Dano aumenta com HP baixo.',type:'frenzy'},
   skill2:{name:'Rugido Selvagem',ico:'😤',mp:6,desc:'Intimida: -4 ATK do inimigo por 3 turnos.',type:'wild_roar'},
   items:['🪓 Machado de Osso','🩸 Amuleto de Fúria'],
   subclasses:[
     {id:'warchief',key:'bsk',name:'Chefe de Guerra',ico:'🔥🪓',desc:'Entra em fúria total abaixo de 30% HP.',bonus:'ATK+10, Fúria ativa abaixo de 30% HP',fn:G=>{G.atk+=10;G.passives.push('berzerk','war_rage');}},
     {id:'juggernaut',key:'pld',name:'Juggernaut',ico:'🪨🪓',desc:'Imparável — ignora parte da defesa inimiga.',bonus:'HP+30, Ignora 30% DEF inimiga',fn:G=>{G.hpMax+=30;G.hp=Math.min(G.hpMax,G.hp+30);G.passives.push('armor_pierce');}},
   ]},
  {id:'assassin_cls',name:'Assassino',ico:'🌑',flavor:'Você não o viu chegar. Não o verá partir.',
   hp:70,mp:60,atk:10,def:3,mag:6,spd:13,crit:.20,dodge:.16,lifesteal:.02,bars:{atk:65,def:20,mag:38},
   skill:{name:'Golpe das Sombras',ico:'🌑',mp:14,desc:'Primeiro turno: dano triplicado. Demais: dano duplo.',type:'shadow_strike'},
   skill2:{name:'Névoa Tóxica',ico:'☠️',mp:12,desc:'Envenena e reduz precisão do inimigo por 3 turnos.',type:'toxic_mist'},
   items:['🌑 Lâmina das Sombras','☠️ Veneno de Aranha'],
   subclasses:[
     {id:'phantom',key:'shd',name:'Fantasma',ico:'👻🌑',desc:'Torna-se intangível — esquiva quase garantida.',bonus:'DODGE+20%, VEL+4',fn:G=>{G.dodge+=.20;G.spd+=4;}},
     {id:'venomancer',key:'arc',name:'Envenenador',ico:'🐍🌑',desc:'Venenos em cadeia — múltiplos inimigos envenenados.',bonus:'Veneno em área, MAG+4',fn:G=>{G.mag+=4;G.passives.push('chain_poison');}},
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

function genProcEnemy(floor, isElite=false){
  const arch=pick(PROC_ARCHETYPES);
  const mod1=pick(PROC_MODIFIERS);
  const ngMult=G?.ngMult||1;

  // Elite usa dois modificadores e escala maior
  let mod2=null;
  if(isElite){
    mod2=pick(PROC_MODIFIERS);
    while(mod2.prefix===mod1.prefix) mod2=pick(PROC_MODIFIERS);
  }
  const scale=floorScale(floor)*(isElite?1.5:1);
  const total=scale*ngMult;
  const hpM =isElite?mod1.hpM*mod2.hpM*1.4:mod1.hpM;
  const atkM=isElite?mod1.atkM*mod2.atkM:mod1.atkM;
  const defM=isElite?mod1.defM*mod2.defM*1.2:mod1.defM;
  const xpM =isElite?mod1.xpM*mod2.xpM:mod1.xpM;

  const hp =Math.round(arch.hp *hpM *total);
  const atk=Math.round(arch.atk*atkM*total);
  const def=Math.round(arch.def*defM*(1+(floor-1)*0.12));
  const xp =Math.round((isElite?20+floor*6:10+floor*4)*xpM);
  const gold=isElite
    ?[Math.round((5+floor*2)*total), Math.round((10+floor*3)*total)]
    :[Math.round((2+floor)*total),   Math.round((5+floor*2)*total)];

  const badges=isElite
    ?[...new Set(['Elite',...arch.badges,...mod1.badges,...mod2.badges])]
    :[...new Set([...arch.badges,...mod1.badges])];
  if(!isElite&&floor>=5&&Math.random()<0.4)
    badges.push(pick(['Fúria','Resistência','Certeiro','Drena MP']));

  const prefix=isElite?pick(ELITE_PREFIXES):null;
  return {
    id:(isElite?'elite_':'proc_')+r(99999),
    name:isElite?`★ ${prefix} ${arch.name}`:`${mod1.prefix} ${arch.name}`,
    ico:isElite?`⭐${arch.ico}`:`${mod1.ico}${arch.ico}`,
    sub:isElite?`Elite · ${mod1.prefix} & ${mod2.prefix}`:`${arch.type} · Andar ${floor}`,
    hp,atk,def,xp,gold,badges,
    boss:false,elite:isElite,
    type:arch.type,
    proc:true,
  };
}
function genEnemy(floor){ return genProcEnemy(floor,false); }

function genElite(floor){ return genProcEnemy(floor,true); }

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
  {id:'iron_sw',cls:'warrior',   name:'Espada de Ferro',   ico:'⚔️',rarity:'common', uses:null,slot:'weapon',bonus:{atk:5},               desc:'+5 ATK'},
  {id:'fine_sw',cls:'warrior',   name:'Espada Fina',       ico:'🗡️',rarity:'rare',   uses:null,slot:'weapon',bonus:{atk:8,crit:.05},      desc:'+8 ATK +5% CRIT'},
  {id:'cursed_sw',cls:'warrior', name:'Lâmina Maldita',    ico:'🌑⚔️',rarity:'epic',  uses:null,slot:'weapon',bonus:{atk:14,def:-3},      desc:'+14 ATK -3 DEF'},
  {id:'runeblade',cls:'warrior', name:'Lâmina Rúnica',     ico:'⚡⚔️',rarity:'legendary',uses:null,slot:'weapon',bonus:{atk:18,mag:6,crit:.1},desc:'+18 ATK +6 MAG +10% CRIT'},
  {id:'staff',cls:'mage',     name:'Cajado Arcano',     ico:'🪄',rarity:'rare',   uses:null,slot:'weapon',bonus:{mag:8},               desc:'+8 MAG'},
  {id:'staff2',cls:'mage',    name:'Báculo Ancestral',  ico:'🔱',rarity:'epic',   uses:null,slot:'weapon',bonus:{mag:14,mp:20},        desc:'+14 MAG +20 MP'},
  {id:'daggers',cls:'rogue',   name:'Adagas Duplas',     ico:'🗡️',rarity:'common', uses:null,slot:'weapon',bonus:{atk:4,spd:2,crit:.08},desc:'+4 ATK +2 VEL +8% CRIT'},
  {id:'leather',   name:'Armadura de Couro', ico:'🥋',rarity:'common', uses:null,slot:'chest',bonus:{def:4},                desc:'+4 DEF'},
  {id:'chainmail',cls:'warrior', name:'Cota de Malha',     ico:'🛡️',rarity:'rare',   uses:null,slot:'chest',bonus:{def:7,hp:10},         desc:'+7 DEF +10 HP'},
  {id:'platemail',cls:'warrior', name:'Armadura de Placas',ico:'🏛️',rarity:'epic',   uses:null,slot:'chest',bonus:{def:12,hp:20,spd:-2}, desc:'+12 DEF +20 HP -2 VEL'},
  {id:'dragonmail',cls:'warrior',name:'Armadura do Dragão',ico:'🐉🛡️',rarity:'legendary',uses:null,slot:'chest',bonus:{def:16,hp:30,atk:5},desc:'+16 DEF +30 HP +5 ATK'},
  {id:'hood',cls:'rogue',      name:'Capuz do Ladrão',   ico:'🎭',rarity:'common', uses:null,slot:'head',bonus:{spd:2,dodge:.05},       desc:'+2 VEL +5% ESQUIVA'},
  {id:'helm',cls:'warrior',      name:'Elmo de Guerra',    ico:'⛑️',rarity:'rare',   uses:null,slot:'head',bonus:{def:5,hp:8},           desc:'+5 DEF +8 HP'},
  {id:'crown',cls:'mage',     name:'Coroa do Arquimago',ico:'👑',rarity:'epic',   uses:null,slot:'head',bonus:{mag:10,mp:25},          desc:'+10 MAG +25 MP'},
  {id:'death_mask',name:'Máscara da Morte',  ico:'💀',rarity:'legendary',uses:null,slot:'head',bonus:{atk:8,crit:.15,hp:-15},desc:'+8 ATK +15% CRIT -15 HP'},
  {id:'boots',cls:'rogue',     name:'Botas Ágeis',       ico:'👟',rarity:'common', uses:null,slot:'feet', bonus:{spd:3},                desc:'+3 VEL'},
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

  // ═══ ITENS EXCLUSIVOS POR CLASSE ═══

  // ── Paladino (warrior) ──
  {id:'holy_sword',    cls:'warrior',name:'Espada Sagrada',     ico:'✝️⚔️',rarity:'rare',   uses:null,slot:'weapon',bonus:{atk:9,def:3},            desc:'+9 ATK +3 DEF'},
  {id:'divine_shield_item',cls:'warrior',name:'Escudo Divino',  ico:'🛡️✨',rarity:'epic',   uses:null,slot:'chest', bonus:{def:14,hp:25},            desc:'+14 DEF +25 HP'},
  {id:'paladin_helm',  cls:'warrior',name:'Elmo do Paladino',   ico:'⛑️✝️',rarity:'rare',   uses:null,slot:'head',  bonus:{def:6,hp:12},             desc:'+6 DEF +12 HP'},
  {id:'sacred_boots',  cls:'warrior',name:'Botas Sagradas',     ico:'👢✝️',rarity:'common', uses:null,slot:'feet',  bonus:{spd:2,def:2},             desc:'+2 VEL +2 DEF'},
  {id:'holy_potion',   cls:'warrior',name:'Bálsamo Sagrado',    ico:'🏺',  rarity:'common', uses:1,   slot:null,    desc:'Cura 35 HP e remove veneno',fn:G=>{const h=35;G.hp=Math.min(G.hpMax,G.hp+h);G.poisonTurns=0;toast(`✝️ +${h} HP, veneno removido!`);}},
  {id:'crusader_ring', cls:'warrior',name:'Anel do Cruzado',    ico:'💍✝️',rarity:'epic',   uses:null,slot:null,   bonus:{atk:6,def:4,hp:15},        desc:'+6 ATK +4 DEF +15 HP'},

  // ── Mago ──
  {id:'arcane_wand',   cls:'mage',  name:'Varinha Arcana',      ico:'🪄✨',rarity:'common', uses:null,slot:'weapon',bonus:{mag:6},                  desc:'+6 MAG'},
  {id:'void_staff',    cls:'mage',  name:'Cajado do Vazio',     ico:'🌑🪄',rarity:'epic',   uses:null,slot:'weapon',bonus:{mag:16,mp:15,spd:-1},     desc:'+16 MAG +15 MP -1 VEL'},
  {id:'mage_robe',     cls:'mage',  name:'Manto Arcano',        ico:'🥻',  rarity:'common', uses:null,slot:'chest', bonus:{mag:4,mp:10},             desc:'+4 MAG +10 MP'},
  {id:'lich_crown',    cls:'mage',  name:'Coroa da Lich',       ico:'💀👑',rarity:'legendary',uses:null,slot:'head',bonus:{mag:14,mp:40,hp:-20},    desc:'+14 MAG +40 MP -20 HP'},
  {id:'mana_boots',    cls:'mage',  name:'Botas da Concentração',ico:'👟💙',rarity:'rare',  uses:null,slot:'feet',  bonus:{mag:4,spd:1},             desc:'+4 MAG +1 VEL'},
  {id:'spell_scroll',  cls:'mage',  name:'Pergaminho de Feitiço',ico:'📜🔮',rarity:'rare',  uses:1,   slot:null,    desc:'Dano mágico imediato (40-60)',fn:(G,ctx)=>{if(!ctx?.combat){toast('Só em combate!');return;}const d=r(20)+40;ctx.E.hpCur=Math.max(0,ctx.E.hpCur-d);toast(`📜 -${d} HP mágico!`);updateCombatUI();}},
  {id:'mage_ring',     cls:'mage',  name:'Anel do Arcano',      ico:'💍🔮',rarity:'epic',   uses:null,slot:null,   bonus:{mag:8,mp:20},              desc:'+8 MAG +20 MP'},

  // ── Ladino/Assassino (rogue) ──
  {id:'shadow_blade',  cls:'rogue', name:'Lâmina das Sombras',  ico:'🌑🗡️',rarity:'rare',  uses:null,slot:'weapon',bonus:{atk:7,crit:.1,spd:2},     desc:'+7 ATK +10% CRIT +2 VEL'},
  {id:'rogue_armor',   cls:'rogue', name:'Armadura do Ladrão',  ico:'🥷🎭',rarity:'rare',   uses:null,slot:'chest', bonus:{def:5,dodge:.06},          desc:'+5 DEF +6% ESQUIVA'},
  {id:'assassin_mask', cls:'rogue', name:'Máscara do Assassino',ico:'🎭🌑',rarity:'epic',   uses:null,slot:'head',  bonus:{crit:.12,dodge:.05},       desc:'+12% CRIT +5% ESQUIVA'},
  {id:'swift_boots',   cls:'rogue', name:'Botas Velozes',       ico:'👟💨',rarity:'common', uses:null,slot:'feet',  bonus:{spd:4,dodge:.03},          desc:'+4 VEL +3% ESQUIVA'},
  {id:'poison_vial',   cls:'rogue', name:'Ampola de Veneno',    ico:'🐍💉',rarity:'epic',   uses:1,   slot:null,    desc:'Veneno forte (6dmg/turno, 5t)',fn:(G,ctx)=>{if(!ctx?.combat){toast('Só em combate!');return;}ctx.E.poisonDmg=6;ctx.E.poisonTurns=5;toast('🐍 Veneno forte aplicado!');}},
  {id:'rogue_ring',    cls:'rogue', name:'Anel do Ladrão',      ico:'💍🗡️',rarity:'epic',   uses:null,slot:null,   bonus:{atk:4,crit:.08,spd:2},     desc:'+4 ATK +8% CRIT +2 VEL'},

  // ── Druida ──
  {id:'nature_staff',  cls:'druid', name:'Cajado da Natureza',  ico:'🌿🪄',rarity:'rare',   uses:null,slot:'weapon',bonus:{mag:7,hp:10},             desc:'+7 MAG +10 HP'},
  {id:'bark_armor',    cls:'druid', name:'Armadura de Casca',   ico:'🌳🛡️',rarity:'common', uses:null,slot:'chest', bonus:{def:5,hp:8},              desc:'+5 DEF +8 HP'},
  {id:'druid_crown',   cls:'druid', name:'Coroa das Raízes',    ico:'🌿👑',rarity:'epic',   uses:null,slot:'head',  bonus:{mag:8,hp:15},             desc:'+8 MAG +15 HP'},
  {id:'moss_boots',    cls:'druid', name:'Botas de Musgo',      ico:'🌿👟',rarity:'common', uses:null,slot:'feet',  bonus:{spd:2,hp:5},              desc:'+2 VEL +5 HP'},
  {id:'healing_herb',  cls:'druid', name:'Erva Curativa',       ico:'🌿💚',rarity:'common', uses:1,   slot:null,    desc:'Cura 30 HP + regen 10HP/turno por 3t',fn:G=>{const h=30;G.hp=Math.min(G.hpMax,G.hp+h);G.regenTurns=(G.regenTurns||0)+3;G.regenAmt=10;toast(`🌿 +${h} HP + regen!`);}},
  {id:'nature_ring',   cls:'druid', name:'Anel da Floresta',    ico:'💍🌿',rarity:'epic',   uses:null,slot:null,   bonus:{mag:6,hp:20},              desc:'+6 MAG +20 HP'},
  {id:'druid_tome',    cls:'druid', name:'Tomo da Natureza',    ico:'📗🌿',rarity:'legendary',uses:1,  slot:null,   desc:'+15 HP máx e +5 MAG permanente',fn:G=>{G.hpMax+=15;G.hp=Math.min(G.hpMax,G.hp+15);G.mag+=5;upd();toast('📗 Poder da Natureza absorvido!');}},

  // ── Caçador ──
  {id:'hunter_bow',    cls:'hunter',name:'Arco do Caçador',     ico:'🏹',  rarity:'common', uses:null,slot:'weapon',bonus:{atk:5,spd:2},             desc:'+5 ATK +2 VEL'},
  {id:'longbow',       cls:'hunter',name:'Arco Longo Reforçado',ico:'🏹💥',rarity:'epic',   uses:null,slot:'weapon',bonus:{atk:12,crit:.08,spd:1},   desc:'+12 ATK +8% CRIT +1 VEL'},
  {id:'hunter_vest',   cls:'hunter',name:'Colete do Caçador',   ico:'🎯🥋',rarity:'rare',   uses:null,slot:'chest', bonus:{def:4,dodge:.05,spd:1},   desc:'+4 DEF +5% ESQUIVA +1 VEL'},
  {id:'tracker_helm',  cls:'hunter',name:'Elmo do Rastreador',  ico:'🎯⛑️',rarity:'rare',   uses:null,slot:'head',  bonus:{crit:.07,spd:2},          desc:'+7% CRIT +2 VEL'},
  {id:'ranger_boots',  cls:'hunter',name:'Botas do Ranger',     ico:'🥾🏹',rarity:'common', uses:null,slot:'feet',  bonus:{spd:4,dodge:.02},          desc:'+4 VEL +2% ESQUIVA'},
  {id:'beast_trap',    cls:'hunter',name:'Armadilha de Fera',   ico:'🪤',  rarity:'epic',   uses:1,   slot:null,    desc:'Imobiliza inimigo por 2 turnos',fn:(G,ctx)=>{if(!ctx?.combat){toast('Só em combate!');return;}ctx.E.freezeTurns=(ctx.E.freezeTurns||0)+2;toast('🪤 Inimigo imobilizado!');}},
  {id:'hunter_ring',   cls:'hunter',name:'Anel da Presa',       ico:'💍🏹',rarity:'epic',   uses:null,slot:null,   bonus:{atk:5,crit:.07,spd:1},     desc:'+5 ATK +7% CRIT +1 VEL'},

  // ── Feiticeiro ──
  {id:'chaos_orb',     cls:'sorcerer',name:'Orbe do Caos',      ico:'🌀🔮',rarity:'rare',   uses:null,slot:'weapon',bonus:{mag:9,mp:5},              desc:'+9 MAG +5 MP'},
  {id:'storm_staff',   cls:'sorcerer',name:'Cajado da Tempestade',ico:'⚡🪄',rarity:'epic',  uses:null,slot:'weapon',bonus:{mag:15,mp:20},            desc:'+15 MAG +20 MP'},
  {id:'arcane_robe',   cls:'sorcerer',name:'Manto Caótico',     ico:'🌀🥻',rarity:'common', uses:null,slot:'chest', bonus:{mag:5,mp:12},             desc:'+5 MAG +12 MP'},
  {id:'chaos_crown',   cls:'sorcerer',name:'Coroa do Caos',     ico:'🌀👑',rarity:'epic',   uses:null,slot:'head',  bonus:{mag:10,mp:18,hp:-10},     desc:'+10 MAG +18 MP -10 HP'},
  {id:'sorc_boots',    cls:'sorcerer',name:'Botas Arcanas',     ico:'👟🌀',rarity:'common', uses:null,slot:'feet',  bonus:{mag:3,spd:1},             desc:'+3 MAG +1 VEL'},
  {id:'chaos_elixir',  cls:'sorcerer',name:'Elixir do Caos',    ico:'⚗️🌀',rarity:'epic',   uses:1,   slot:null,    desc:'+12 MAG temporário por 3 salas',fn:G=>{G.mag+=12;G.tmpBuffs.push({stat:'mag',val:12,rooms:3});toast('🌀 +12 MAG caótico!');}},
  {id:'sorc_ring',     cls:'sorcerer',name:'Anel da Tempestade',ico:'💍⚡',rarity:'epic',   uses:null,slot:null,   bonus:{mag:9,mp:15},              desc:'+9 MAG +15 MP'},

  // ── Bárbaro ──
  {id:'great_axe',     cls:'barbarian',name:'Grande Machado',   ico:'🪓💥',rarity:'common', uses:null,slot:'weapon',bonus:{atk:9,spd:-1},            desc:'+9 ATK -1 VEL'},
  {id:'war_hammer',    cls:'barbarian',name:'Martelo de Guerra',ico:'🔨',  rarity:'epic',   uses:null,slot:'weapon',bonus:{atk:16,def:4,spd:-2},     desc:'+16 ATK +4 DEF -2 VEL'},
  {id:'berserk_armor', cls:'barbarian',name:'Armadura Bárbara', ico:'🔴🛡️',rarity:'rare',   uses:null,slot:'chest', bonus:{def:8,hp:20,atk:3},       desc:'+8 DEF +20 HP +3 ATK'},
  {id:'warrior_helm',  cls:'barbarian',name:'Elmo da Fúria',    ico:'🪖🔴',rarity:'rare',   uses:null,slot:'head',  bonus:{atk:5,hp:12},             desc:'+5 ATK +12 HP'},
  {id:'berserker_boots',cls:'barbarian',name:'Botas do Bárbaro',ico:'👢🔴',rarity:'common', uses:null,slot:'feet',  bonus:{spd:2,atk:2},             desc:'+2 VEL +2 ATK'},
  {id:'rage_potion',   cls:'barbarian',name:'Poção de Fúria',   ico:'🍺🔴',rarity:'rare',   uses:1,   slot:null,    desc:'+10 ATK temporário por 2 salas',fn:G=>{G.atk+=10;G.tmpBuffs.push({stat:'atk',val:10,rooms:2});toast('🍺 FÚRIA! +10 ATK!');}},
  {id:'barb_ring',     cls:'barbarian',name:'Anel do Guerreiro',ico:'💍🔴',rarity:'epic',   uses:null,slot:null,   bonus:{atk:8,hp:20},              desc:'+8 ATK +20 HP'},

  // ── Assassino ──
  {id:'poison_dagger', cls:'assassin_cls',name:'Adaga Envenenada',ico:'🗡️🐍',rarity:'rare', uses:null,slot:'weapon',bonus:{atk:7,crit:.09},          desc:'+7 ATK +9% CRIT'},
  {id:'shadow_cloak',  cls:'assassin_cls',name:'Manto das Sombras',ico:'🌑🥷',rarity:'epic', uses:null,slot:'chest', bonus:{dodge:.1,spd:2},           desc:'+10% ESQUIVA +2 VEL'},
  {id:'death_hood',    cls:'assassin_cls',name:'Capuz da Morte',  ico:'💀🎭',rarity:'epic',  uses:null,slot:'head',  bonus:{crit:.13,dodge:.04},       desc:'+13% CRIT +4% ESQUIVA'},
  {id:'shadow_boots',  cls:'assassin_cls',name:'Botas Silenciosas',ico:'👟🌑',rarity:'common',uses:null,slot:'feet', bonus:{spd:4,dodge:.04},           desc:'+4 VEL +4% ESQUIVA'},
  {id:'smoke_bomb',    cls:'assassin_cls',name:'Bomba de Névoa',  ico:'💨🌑',rarity:'rare',  uses:1,   slot:null,    desc:'30% chance inimigo errar por 3t',fn:(G,ctx)=>{if(!ctx?.combat){toast('Só em combate!');return;}ctx.E._foggedTurns=3;toast('💨 Névoa das sombras!');}},
  {id:'assassin_ring', cls:'assassin_cls',name:'Anel do Assassino',ico:'💍🌑',rarity:'epic', uses:null,slot:null,   bonus:{crit:.1,spd:3,atk:3},       desc:'+10% CRIT +3 VEL +3 ATK'},

  // ═══ SETS DE ARMADURA ═══
  // Set do Caçador (Ladino)
  {id:'set_hunter_bow',cls:'rogue',  name:'Arco Longo',          ico:'🏹',rarity:'epic',  uses:null,slot:'weapon',set:'hunter',bonus:{atk:7,spd:2},          desc:'+7 ATK +2 VEL | Set Caçador'},
  {id:'set_hunter_hood',cls:'rogue', name:'Capuz do Caçador',    ico:'🎯',rarity:'epic',  uses:null,slot:'head',  set:'hunter',bonus:{dodge:.08},             desc:'+8% ESQUIVA | Set Caçador'},
  {id:'set_hunter_boots',cls:'rogue',name:'Botas do Caçador',    ico:'🥾',rarity:'epic',  uses:null,slot:'feet',  set:'hunter',bonus:{spd:3},                 desc:'+3 VEL | Set Caçador'},
  // Set do Mago Ancestral (Mago)
  {id:'set_mage_staff',cls:'mage',  name:'Cajado Ancestral+',   ico:'🔱',rarity:'epic',  uses:null,slot:'weapon',set:'mage_anc',bonus:{mag:10},              desc:'+10 MAG | Set Mago Ancestral'},
  {id:'set_mage_robe',cls:'mage',   name:'Túnica Arcana',       ico:'🥻',rarity:'epic',  uses:null,slot:'chest', set:'mage_anc',bonus:{mag:6,mp:10},         desc:'+6 MAG +10 MP | Set Mago Ancestral'},
  {id:'set_mage_crown',cls:'mage',  name:'Coroa da Sabedoria',  ico:'👑',rarity:'epic',  uses:null,slot:'head',  set:'mage_anc',bonus:{mag:8,mp:20},         desc:'+8 MAG +20 MP | Set Mago Ancestral'},
  // ══ ARTEFATOS DIVINOS MITOLÓGICOS ══
  // Tártaro (Andar 1)
  {id:'moeda_caronte',  name:'Moeda de Caronte',    ico:'⛵',rarity:'epic',    uses:1, slot:null,desc:'Fuga garantida de qualquer combate.',fn:(G,ctx)=>{if(ctx?.combat)ctx.flee(true);else toast('Só em combate.');}},
  {id:'chama_prometeu', name:'Chama de Prometeu',   ico:'🔥',rarity:'epic',    uses:1, slot:null,desc:'+12 MAG e dano de fogo por 1 combate.',fn:G=>{G.mag+=12;G.tmpBuffs.push({stat:'mag',val:12,rooms:1});toast('🔥 Chama de Prometeu — +12 MAG!');}},
  {id:'escudo_perseu',  name:'Escudo de Perseu',    ico:'🛡️',rarity:'legendary',uses:null,slot:'chest',bonus:{def:10,dodge:.10},desc:'+10 DEF +10% Esquiva — reflexo divino.'},
  // Nifleheim (Andar 2)
  {id:'mjolnir_frag',   name:'Fragmento de Mjolnir',ico:'⚡',rarity:'legendary',uses:null,slot:'weapon',bonus:{atk:12,mag:6},desc:'+12 ATK +6 MAG. 20% chance de atordoar.'},
  {id:'runa_odin',      name:'Runa de Odin',        ico:'🔵',rarity:'epic',    uses:1, slot:null,desc:'Revela os próximos 3 tipos de sala.',fn:G=>{G.passives.push('divination');toast('🔵 Runa de Odin ativada!');}},
  {id:'manto_freya',    name:'Manto de Freya',      ico:'🌿',rarity:'epic',    uses:null,slot:'chest',bonus:{def:8,hpMax:20},desc:'+8 DEF +20 HP MAX — proteção da deusa.'},
  // Duat (Andar 3)
  {id:'olho_horus',     name:'Olho de Hórus',       ico:'👁️',rarity:'epic',   uses:null,slot:'head', bonus:{mag:6},desc:'Revela ATK/DEF/XP de todos os inimigos.', fn:G=>{G.passives.push('guardian_eye');toast('👁️ Olho de Hórus ativado!');}},
  {id:'amuleto_isis',   name:'Amuleto de Ísis',     ico:'☥', rarity:'legendary',uses:null,slot:null, bonus:{hpMax:25,mag:8},desc:'+25 HP MAX +8 MAG — proteção da mãe dos deuses.'},
  {id:'luz_ra',         name:'Luz de Rá',           ico:'☀️',rarity:'epic',    uses:1, slot:null,desc:'Cura 40 HP e remove todos os debuffs.',fn:G=>{G.hp=Math.min(G.hpMax,G.hp+40);G.poisonTurns=0;G.curseTurns=0;toast('☀️ Luz de Rá — purificado!');}},
  // Diyu (Andar 4)
  {id:'jade_imperial',  name:'Jade Imperial',       ico:'🐲',rarity:'legendary',uses:1, slot:null,desc:'+12 MAG e +25 MP.',fn:G=>{G.mag+=12;G.mpMax+=25;G.mp=Math.min(G.mpMax,G.mp+25);toast('🐲 Poder do Jade Imperial!');}},
  {id:'pergaminho_monkey',name:'Pergaminho de Sun Wukong',ico:'🐒',rarity:'epic',uses:1,slot:null,desc:'Ataca 3 vezes com dano crítico garantido.',fn:(G,ctx)=>{if(!ctx?.combat){toast('Só em combate!');return;}const dmg=Math.round(G.atk*3);ctx.E.hpCur=Math.max(0,ctx.E.hpCur-dmg);updateCombatUI();toast(`🐒 Sun Wukong: ${dmg} dano!`);}},
  {id:'espada_guan_yu',  name:'Espada de Guan Yu',  ico:'⚔️',rarity:'legendary',uses:null,slot:'weapon',bonus:{atk:16,def:4},desc:'+16 ATK +4 DEF — lâmina do Deus da Guerra.'},
  // Yomi (Andar 5)
  {id:'kusanagi',       name:'Lâmina de Kusanagi',  ico:'🗡️',rarity:'legendary',uses:null,slot:'weapon',bonus:{atk:14,mag:8,crit:.12},desc:'+14 ATK +8 MAG +12% CRIT — espada sagrada japonesa.'},
  {id:'mascara_tengu',  name:'Máscara do Tengu',    ico:'🦅',rarity:'epic',    uses:null,slot:'head',  bonus:{spd:4,dodge:.10,crit:.08},desc:'+4 VEL +10% ESQ +8% CRIT.'},
  {id:'espelho_amaterasu',name:'Espelho de Amaterasu',ico:'🪞',rarity:'legendary',uses:null,slot:null, bonus:{mag:10,dodge:.08},desc:'+10 MAG +8% Esquiva — reflete magias.'},
  // Naraka (Andar 6)
  {id:'dente_naga',     name:'Dente de Naga',       ico:'🐍',rarity:'epic',    uses:null,slot:'weapon',bonus:{atk:10,mag:6},desc:'+10 ATK +6 MAG. Ataques envenenam o inimigo.'},
  {id:'pena_garuda',    name:'Pena de Garuda',      ico:'🦅',rarity:'epic',    uses:1, slot:null,desc:'Fuga garantida + +20 HP.',fn:(G,ctx)=>{if(ctx?.combat){G.hp=Math.min(G.hpMax,G.hp+20);ctx.flee(true);}else toast('Só em combate.');}},
  {id:'loto_negro',     name:'Coroa do Lótus Negro',ico:'🪷',rarity:'legendary',uses:null,slot:'head',  bonus:{mag:12,hpMax:20,mp:30},desc:'+12 MAG +20 HP MAX +30 MP — iluminação escura.'},
  {id:'petala_lotus',   name:'Pétala do Lótus',     ico:'🪷',rarity:'legendary',uses:1, slot:null,desc:'HP cheio e +5 karma.',fn:G=>{G.hp=G.hpMax;G.karma=(G.karma||0)+5;toast('🪷 Purificação completa!');}},

  // Set do Berserker (Guerreiro)
  {id:'set_bsk_axe',cls:'warrior',     name:'Machado Duplo',       ico:'🪓',rarity:'epic',  uses:null,slot:'weapon',set:'berserker',bonus:{atk:14,spd:-3},      desc:'+14 ATK -3 VEL | Set Berserker'},
  {id:'set_bsk_armor',cls:'warrior',   name:'Armadura do Berserker',ico:'🔴',rarity:'epic', uses:null,slot:'chest', set:'berserker',bonus:{atk:5,def:-2},       desc:'+5 ATK -2 DEF | Set Berserker'},
  {id:'set_bsk_helm',cls:'warrior',    name:'Elmo do Berserker',   ico:'🪖',rarity:'epic',  uses:null,slot:'head',  set:'berserker',bonus:{atk:6,def:-2},       desc:'+6 ATK -2 DEF | Set Berserker'},
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
  {id:'mpregen1', name:'Fluxo de Mana',  ico:'🔵', desc:'+2 MP/sala', tag:'magic',fn:G=>{G.mpRegen+=2;toast('MP/sala: '+G.mpRegen+'🔵');}},
  {id:'mpregen2', name:'Canalização',    ico:'💠', desc:'+3 MP/sala (requer Fluxo de Mana)', tag:'magic',req:'mpregen1',fn:G=>{G.mpRegen+=3;toast('MP/sala: '+G.mpRegen+'🔵');}},
  {id:'mpregen3', name:'Reservatório',   ico:'🌀', desc:'+4 MP/sala (requer Canalização)', tag:'magic',req:'mpregen2',fn:G=>{G.mpRegen+=4;toast('MP/sala: '+G.mpRegen+'🔵');}},
  {id:'mpregen4', name:'Fonte Arcana',   ico:'⚡', desc:'+6 MP/sala (requer Reservatório)', tag:'magic',req:'mpregen3',fn:G=>{G.mpRegen+=6;toast('MP/sala: '+G.mpRegen+'🔵');}},
];

/* ═══ ELEMENTOS ═══ */
const ELEMENTS=[
  /* ══════════════════════════════════════════════════
     ELEMENTOS UNIVERSAIS — disponíveis desde o início
     Aparecem nos tomos dos primeiros andares
  ══════════════════════════════════════════════════ */
  // Tier 5 — Base (mult 1.0)
  {id:'fogo',      name:'Fogo',          ico:'🔥', tier:5, mult:1.0, andar:0, desc:'Chama universal. Calor que destrói e purifica.'},
  {id:'agua',      name:'Água',          ico:'💧', tier:5, mult:1.0, andar:0, desc:'Fluxo eterno. Se adapta e penetra tudo.'},
  {id:'terra',     name:'Terra',         ico:'🌍', tier:5, mult:1.0, andar:0, desc:'Fundação do mundo. Imóvel e implacável.'},
  {id:'ar',        name:'Ar',            ico:'🌬️', tier:5, mult:1.0, andar:0, desc:'Onipresente e invisível. Carrega tudo.'},
  // Tier 4 — Comuns (mult 1.2)
  {id:'luz',       name:'Luz',           ico:'☀️', tier:4, mult:1.2, andar:0, desc:'Energia radiante. Expõe e queima.'},
  {id:'sombra',    name:'Sombra',        ico:'👤', tier:4, mult:1.2, andar:0, desc:'Ausência de luz. Cobre e corrói.'},
  {id:'vida',      name:'Vida',          ico:'💚', tier:4, mult:1.2, andar:0, desc:'Força vital primordial. Cura e sustenta.'},

  /* ══════════════════════════════════════════════════
     TÁRTARO — Andar 1 (Mitologia Grega)
     Elementos do reino de Hades: morte, trovão, pedra
  ══════════════════════════════════════════════════ */
  // Tier 4 — Comuns do Tártaro (mult 1.2)
  {id:'trovao',    name:'Trovão',        ico:'⚡', tier:4, mult:1.2, andar:1, desc:'Arma de Zeus. Descarga que não perdoa.'},
  {id:'veneno',    name:'Veneno',        ico:'🐍', tier:4, mult:1.2, andar:1, desc:'Hidra e Medusa. Dissolve por dentro.'},
  {id:'pedra',     name:'Pedra',         ico:'🪨', tier:4, mult:1.2, andar:1, desc:'Petrificação de Medusa. Rígida e esmagadora.'},
  // Tier 3 — Incomuns do Tártaro (mult 1.4)
  {id:'morte',     name:'Morte',         ico:'💀', tier:3, mult:1.4, andar:1, desc:'Tânatos personificado. Fim absoluto.'},
  {id:'alma',      name:'Alma',          ico:'👻', tier:3, mult:1.4, andar:1, desc:'Psique grega. Energia do ser que persiste.'},
  // Tier 2 — Raros do Tártaro (mult 1.7)
  {id:'eris',      name:'Discórdia',     ico:'⚔️', tier:2, mult:1.7, andar:1, desc:'Poder de Éris. Caos que divide e enfraquece.'},
  {id:'tartaro_fogo',name:'Chama Eterna',ico:'🔴', tier:2, mult:1.7, andar:1, desc:'Fogo do Tártaro. Não se apaga — nunca.'},

  /* ══════════════════════════════════════════════════
     NIFLEHEIM — Andar 2 (Mitologia Nórdica)
     Elementos do reino de Hel: gelo, runas, vento ártico
  ══════════════════════════════════════════════════ */
  // Tier 4 — Comuns de Nifleheim (mult 1.2)
  {id:'gelo',      name:'Gelo',          ico:'❄️', tier:4, mult:1.2, andar:2, desc:'Fimbulwinter. Congela e fragmenta.'},
  {id:'ferro',     name:'Ferro',         ico:'⚙️', tier:4, mult:1.2, andar:2, desc:'Metal nórdico. Resistência de Asgard.'},
  {id:'vento',     name:'Vento Glacial', ico:'🌪️', tier:4, mult:1.2, andar:2, desc:'Vento de Nifleheim. Penetra qualquer armadura.'},
  // Tier 3 — Incomuns de Nifleheim (mult 1.4)
  {id:'runas',     name:'Runas',         ico:'🔵', tier:3, mult:1.4, andar:2, desc:'Sabedoria de Odin. Gravadas no custo de um olho.'},
  {id:'trevas',    name:'Trevas Nórdicas',ico:'🌑',tier:3, mult:1.4, andar:2, desc:'Escuridão de Nifleheim. Apaga calor e esperança.'},
  // Tier 2 — Raros de Nifleheim (mult 1.7)
  {id:'yggdrasil', name:'Yggdrasil',     ico:'🌳', tier:2, mult:1.7, andar:2, desc:'A Árvore do Mundo. Conecta e absorve tudo.'},
  {id:'mjolnir',   name:'Mjolnir',       ico:'🔨', tier:2, mult:1.7, andar:2, desc:'Martelo de Thor. Raio e força em uma só arma.'},

  /* ══════════════════════════════════════════════════
     DUAT — Andar 3 (Mitologia Egípcia)
     Elementos do reino de Anúbis: areia, sol, hieróglifos
  ══════════════════════════════════════════════════ */
  // Tier 4 — Comuns do Duat (mult 1.2)
  {id:'areia',     name:'Areia',         ico:'🏜️', tier:4, mult:1.2, andar:3, desc:'Deserto eterno. Corrói e cobre tudo.'},
  {id:'sol_ra',    name:'Sol de Rá',     ico:'☀️', tier:4, mult:1.2, andar:3, desc:'Olho de Rá. Calor divino que purifica.'},
  {id:'cobra',     name:'Apófis',        ico:'🐍', tier:4, mult:1.2, andar:3, desc:'Serpente do caos. Veneno e trevas em forma de deus.'},
  // Tier 3 — Incomuns do Duat (mult 1.4)
  {id:'magia_egip',name:'Heka',          ico:'𓂀', tier:3, mult:1.4, andar:3, desc:'Magia primordial egípcia. Transforma realidade por palavras.'},
  {id:'ka',        name:'Ka',            ico:'⚖️', tier:3, mult:1.4, andar:3, desc:'Duplo espiritual egípcio. A força que sobrevive à morte.'},
  // Tier 2 — Raros do Duat (mult 1.7)
  {id:'ankh',      name:'Ankh',          ico:'☥', tier:2, mult:1.7, andar:3, desc:'Símbolo da vida eterna. Cura e maldiz com igual poder.'},
  {id:'olho_horus_el',name:'Olho de Hórus',ico:'👁️',tier:2,mult:1.7, andar:3, desc:'Visão que atravessa ilusões e revela a verdade absoluta.'},

  /* ══════════════════════════════════════════════════
     DIYU — Andar 4 (Mitologia Chinesa)
     Elementos do reino de Yanluo: jade, karma, dragão
  ══════════════════════════════════════════════════ */
  // Tier 3 — Comuns de Diyu (mult 1.4)
  {id:'jade',      name:'Jade',          ico:'🐲', tier:3, mult:1.4, andar:4, desc:'Pedra imperial. Canal entre mortal e divino.'},
  {id:'karma_neg', name:'Karma Negro',   ico:'☯️', tier:3, mult:1.4, andar:4, desc:'Karma acumulado em atos impuros. Pesa e destrói.'},
  {id:'correntes', name:'Correntes',     ico:'⛓️', tier:3, mult:1.4, andar:4, desc:'Grilhões do Diyu. Prendem e drenam força vital.'},
  // Tier 2 — Incomuns de Diyu (mult 1.7)
  {id:'dragao_sangue',name:'Sangue de Dragão',ico:'🩸',tier:2,mult:1.7, andar:4, desc:'Sangue do Long Wang. Poder que corrompe quem toca.'},
  {id:'qi_negro',  name:'Qi Sombrio',    ico:'🌀', tier:2, mult:1.7, andar:4, desc:'Energia vital corrompida. Drena força de dentro para fora.'},
  // Tier 1 — Raros de Diyu (mult:2.0)
  {id:'fogo_infernal',name:'Fogo Infernal',ico:'🔥',tier:1,mult:2.0, andar:4, desc:'Chama do Diyu. Queima alma, não corpo — dor eterna.'},
  {id:'espectro',  name:'Espectro',      ico:'👁️', tier:1, mult:2.0, andar:4, desc:'Jiangshi liberado. Drena qi e corrompe o ambiente.'},

  /* ══════════════════════════════════════════════════
     YOMI — Andar 5 (Mitologia Japonesa)
     Elementos do reino de Izanami: youki, oni, kekkai
  ══════════════════════════════════════════════════ */
  // Tier 3 — Comuns de Yomi (mult 1.4)
  {id:'youki',     name:'Youki',         ico:'🌑', tier:3, mult:1.4, andar:5, desc:'Energia dos youkai. Corrompe e transforma.'},
  {id:'kekkai',    name:'Kekkai',        ico:'🔮', tier:3, mult:1.4, andar:5, desc:'Barreira espiritual japonesa. Prende e sela.'},
  // Tier 2 — Incomuns de Yomi (mult 1.7)
  {id:'oni_fogo',  name:'Fogo do Oni',   ico:'👹', tier:2, mult:1.7, andar:5, desc:'Chama dos demônios Oni. Devora tudo — incluindo almas.'},
  {id:'kuroi_kaze',name:'Vento Negro',   ico:'🌪️', tier:2, mult:1.7, andar:5, desc:'Vento de Yomi. Carrega maldições para onde sopra.'},
  {id:'mizuchi',   name:'Mizuchi',       ico:'🐉', tier:2, mult:1.7, andar:5, desc:'Dragão aquático japonês. Veneno e fluência em uma só força.'},
  // Tier 1 — Raros de Yomi (mult 2.0)
  {id:'shinigami_el',name:'Shinigami',   ico:'⚰️', tier:1, mult:2.0, andar:5, desc:'Deus da Morte japonês. Coleta almas indiscriminadamente.'},
  {id:'kusanagi_el',name:'Kusanagi',     ico:'🗡️', tier:1, mult:2.0, andar:5, desc:'Espada sagrada de Yamato. Corta vento, destino e ilusão.'},

  /* ══════════════════════════════════════════════════
     NARAKA — Andar 6 (Mitologia Tailandesa/Budista)
     Elementos do reino de Yama: lótus, dharma, nirvana
  ══════════════════════════════════════════════════ */
  // Tier 2 — Comuns de Naraka (mult 1.7)
  {id:'loto_el',   name:'Lótus Sombrio', ico:'🪷', tier:2, mult:1.7, andar:6, desc:'Flor que floresce no lodo. Pureza que emerge do horror.'},
  {id:'naga_el',   name:'Naga',          ico:'🐍', tier:2, mult:1.7, andar:6, desc:'Serpente divina tailandesa. Veneno sagrado e proteção.'},
  // Tier 1 — Incomuns de Naraka (mult 2.2)
  {id:'garuda_el', name:'Garuda',        ico:'🦅', tier:1, mult:2.2, andar:6, desc:'Pássaro divino de Vishnu. Devora nagas e purifica o ar.'},
  {id:'dharma_el', name:'Dharma',        ico:'☸️', tier:1, mult:2.2, andar:6, desc:'Lei cósmica budista. Ordena e pune o caos com precisão.'},
  {id:'karma_el',  name:'Karma',         ico:'⚖️', tier:1, mult:2.2, andar:6, desc:'Equilíbrio absoluto. Cada golpe retorna ao atacante.'},
  // Tier 0 — Raríssimos de Naraka (mult 2.5)
  {id:'nirvana',   name:'Nirvana Sombrio',ico:'🌌',tier:0, mult:2.5, andar:6, desc:'Extinção total. Nada permanece — nem dor, nem existência.'},
  {id:'yama_el',   name:'Julgamento',    ico:'⚖️', tier:0, mult:2.5, andar:6, desc:'Sentença de Yama. Instantânea e sem apelação.'},
];

/* ═══ FUSÕES ═══ */
const ELEM_TYPE = {
  /* Universal */
  fogo:'igneo',        agua:'aquatico',     terra:'terreo',
  ar:'gasoso',         luz:'luminoso',      sombra:'sombrio',
  vida:'vital',

  /* Tártaro — Grego */
  trovao:'voltaico',   veneno:'toxico',     pedra:'solido',
  morte:'mortal',      alma:'espiritual',
  eris:'caotico',      tartaro_fogo:'igneo_eterno',

  /* Nifleheim — Nórdico */
  gelo:'gelido',       ferro:'metalico',    vento:'gasoso',
  runas:'arcano',      trevas:'sombrio',
  yggdrasil:'natural', mjolnir:'voltaico',

  /* Duat — Egípcio */
  areia:'abrasivo',    sol_ra:'luminoso',   cobra:'toxico',
  magia_egip:'arcano', ka:'espiritual',
  ankh:'vital',        olho_horus_el:'luminoso',

  /* Diyu — Chinês */
  jade:'cristalino',   karma_neg:'corruptivo', correntes:'metalico',
  dragao_sangue:'vital', qi_negro:'sombrio',
  fogo_infernal:'igneo_eterno', espectro:'espiritual',

  /* Yomi — Japonês */
  youki:'sombrio',     kekkai:'arcano',
  oni_fogo:'igneo',    kuroi_kaze:'gasoso',  mizuchi:'aquatico',
  shinigami_el:'mortal', kusanagi_el:'metalico',

  /* Naraka — Tailandês/Budista */
  loto_el:'vital',     naga_el:'toxico',
  garuda_el:'luminoso', dharma_el:'divino',  karma_el:'divino',
  nirvana:'vacuo',     yama_el:'mortal',
};

// Regras de fusão: par de tipos → {name, ico, desc, tierOffset, multBonus}
// tierOffset: reduz o tier médio (resultado mais poderoso que a média)
// multBonus: somado ao mult calculado
const FUSION_RULES = {

  /* ══════════════════════════════════════
     CÓSMICAS — Vácuo, Divino, Espiritual
  ══════════════════════════════════════ */
  'divino+sombrio':       {name:'Dharma das Trevas',     ico:'☯️', desc:'A lei cósmica corrói o que está fora de equilíbrio — dano proporcional ao karma.'},
  'divino+vital':         {name:'Bênção Eterna',         ico:'🌸', desc:'Karma positivo manifesto — cura massiva e fortalece quem tem karma alto.'},
  'divino+mortal':        {name:'Extinção Cármica',      ico:'☸️', desc:'Karma negativo acumulado destruído de uma vez — dano escalonado pelo karma do inimigo.'},
  'arcano+divino':        {name:'Mandala Arcana',        ico:'✨', desc:'Magia estruturada pela lei cósmica — feitiço que não pode ser resistido nem esquivado.'},
  'mortal+vacuo':         {name:'Nirvana',               ico:'🌌', desc:'Extinção absoluta — o alvo deixa de existir sem deixar rastro ou memória.'},
  'vacuo+vital':          {name:'Vácuo Vital',           ico:'🌑', desc:'Drena a força vital ao criar vácuo interno — silencioso e inevitável.'},
  'sombrio+vacuo':        {name:'Abismo',                ico:'⬛', desc:'Escuridão sem fundo que engole tudo — nenhuma luz, nenhuma magia persiste.'},
  'arcano+vacuo':         {name:'Silêncio Arcano',       ico:'🔇', desc:'Dissolve magia no vácuo — anula escudos e feitiços instantaneamente.'},
  'espiritual+mortal':    {name:'Colheita de Almas',     ico:'👻', desc:'Shinigami e Tânatos agem juntos — drena a alma sem tocar o corpo.'},
  'espiritual+sombrio':   {name:'Possessão',             ico:'🌑', desc:'Espírito sombrio invade o alvo — causa confusão e dano contínuo por dentro.'},
  'espiritual+vital':     {name:'Ressurreição',          ico:'💫', desc:'Alma e vida reunidas — cura drástica ou ressuscita aliados caídos.'},
  'arcano+espiritual':    {name:'Invocação',             ico:'🔮', desc:'Ka e runas combinados — manifesta uma entidade que atua por 3 turnos.'},
  'espiritual+luminoso':  {name:'Ascensão',              ico:'✨', desc:'Alma iluminada — purifica todos os debuffs e causa dano sagrado massivo.'},

  /* ══════════════════════════════════════
     ENERGIA — Igneo, Igneo Eterno, Voltaico, Luminoso
  ══════════════════════════════════════ */
  'igneo+igneo_eterno':   {name:'Fogo do Averno',        ico:'🔴', desc:'Chama comum encontra fogo eterno do Tártaro — arde para sempre, não apaga.'},
  'igneo+voltaico':       {name:'Tempestade de Fogo',    ico:'⛈️', desc:'Relâmpago e chamas — explosão termal devastadora que deixa queimaduras elétricas.'},
  'igneo+luminoso':       {name:'Chama Solar',           ico:'☀️', desc:'Fogo de Rá — chamas sagradas que cegam e purificam simultaneamente.'},
  'igneo+sombrio':        {name:'Chama Negra',           ico:'🖤', desc:'Fogo do Oni — não ilumina, consome alma e deixa o corpo intacto.'},
  'aquatico+igneo':       {name:'Vapor Explosivo',       ico:'💥', desc:'Fogo e água — expansão violenta de vapor superaquecido em área.'},
  'igneo+vital':          {name:'Fênix',                 ico:'🔥', desc:'Fogo e vida — chama que cura e queima; quem cai em batalha pode renascer.'},
  'igneo+mortal':         {name:'Chama da Morte',        ico:'💀', desc:'Fogo infernal que mata alma e corpo — não deixa cinzas, nem memória.'},
  'igneo+toxico':         {name:'Veneno Ardente',        ico:'☠️', desc:'Chama venenosa — queima por fora e apodrece por dentro simultaneamente.'},
  'gelido+igneo':         {name:'Forja Polar',           ico:'🌋', desc:'Calor extremo encontra frio absoluto — explosão de cristais incandescentes.'},
  'arcano+igneo':         {name:'Brasas Rúnicas',        ico:'🔴', desc:'Fogo gravado com runas nórdicas — queima que enfraquece defesas mágicas.'},
  'igneo+terreo':         {name:'Magma',                 ico:'🌋', desc:'Rocha derretida emerge do chão — devorador lento e inevitável.'},
  'gasoso+igneo':         {name:'Erupção',               ico:'🌋', desc:'Fogo e gás — nuvem flamejante que queima e asfixia ao mesmo tempo.'},
  'igneo_eterno+sombrio': {name:'Fogo Sombrio',          ico:'🖤', desc:'Chama eterna do Diyu — queima o que não pode ser queimado: esperança e vontade.'},
  'igneo_eterno+vital':   {name:'Vida Eterna',           ico:'🌺', desc:'Fogo que dá vida em vez de destruir — regenera massivamente aliados.'},
  'igneo_eterno+mortal':  {name:'Purgatório',            ico:'🔴', desc:'Fogo eterno do Tártaro — condena o alvo a arder sem destruir, ciclo sem fim.'},
  'aquatico+igneo_eterno':{name:'Dilúvio de Fogo',       ico:'🌊', desc:'Água e fogo eterno — vapor que escala e queima por dentro como lava líquida.'},
  'igneo_eterno+voltaico':{name:'Zeus Desencadeado',     ico:'⚡', desc:'Trovão e fogo eterno — a ira máxima de Zeus manifesta em um único golpe.'},
  'aquatico+voltaico':    {name:'Maré Elétrica',         ico:'⚡', desc:'Raio e água — condução total, atinge todos os alvos em contato com o líquido.'},
  'gelido+voltaico':      {name:'Relâmpago Gélido',      ico:'❄️', desc:'Mjolnir encontra gelo — paralisa e queima ao mesmo tempo, sem escapatória.'},
  'sombrio+voltaico':     {name:'Raio das Trevas',       ico:'🌑', desc:'Descarga elétrica invisível — atinge sem aviso, impossível de desviar.'},
  'mortal+voltaico':      {name:'Pulso Fúnebre',         ico:'💀', desc:'Raio que para o coração — silencioso, limpo e absolutamente letal.'},
  'toxico+voltaico':      {name:'Descarga Tóxica',       ico:'☠️', desc:'Relâmpago e veneno — envenena e paralisa simultaneamente.'},
  'terreo+voltaico':      {name:'Faísca da Terra',       ico:'⚡', desc:'Corrente elétrica que percorre o solo — atinge todos que pisam no chão.'},
  'arcano+voltaico':      {name:'Runa de Relâmpago',     ico:'⚡', desc:'Raio carregado de magia rúnica — ignora resistências e atinge alma e corpo.'},
  'gasoso+voltaico':      {name:'Tempestade Estática',   ico:'⚡', desc:'Ar carregado que dispara descargas espontâneas a qualquer movimento.'},
  'caotico+voltaico':     {name:'Caos Elétrico',         ico:'🌀', desc:'Eris e trovão — descarga sem padrão que salta entre alvos imprevisível.'},
  'luminoso+sombrio':     {name:'Eclipse',               ico:'🌑', desc:'Luz e trevas em colapso — cegueira total seguida de explosão devastadora.'},
  'luminoso+mortal':      {name:'Luz Mortal',            ico:'💡', desc:'Brilho que drena vitalidade — quanto mais ilumina, mais vida consome.'},
  'luminoso+vital':       {name:'Cura Sagrada',          ico:'💛', desc:'Luz divina que restaura e protege — cura massiva, remove todos os debuffs.'},
  'arcano+luminoso':      {name:'Luz Arcana',            ico:'✨', desc:'Éter irradiado — dissolve escudos mágicos e queima almas diretamente.'},
  'luminoso+toxico':      {name:'Luz Corrosiva',         ico:'☠️', desc:'Sol de Rá combinado com veneno de Apófis — queima e apodrece ao mesmo tempo.'},
  'gasoso+luminoso':      {name:'Nuvem Flamejante',      ico:'☀️', desc:'Luz concentrada aquece gás ao ponto de ignição — explosão de fotorradical.'},
  'luminoso+terreo':      {name:'Cristalização Solar',   ico:'💎', desc:'Calor de Rá petrifica e cristaliza — transforma inimigos em estátuas de luz.'},

  /* ══════════════════════════════════════
     SOMBRA — Sombrio, Trevas, Corrupto
  ══════════════════════════════════════ */
  'mortal+sombrio':       {name:'Espectro',              ico:'👻', desc:'Sombra e morte — entidade invocada que drena vitalidade sem poder ser atacada.'},
  'sombrio+toxico':       {name:'Veneno das Sombras',    ico:'🌑', desc:'Youki e cobra — veneno que viaja pelas sombras, imperceptível até agir.'},
  'arcano+sombrio':       {name:'Trevas Arcanas',        ico:'🌒', desc:'Magia negra — corrói mente e corpo simultaneamente de dentro para fora.'},
  'sombrio+vital':        {name:'Drenagem',              ico:'🩸', desc:'Sombra e sangue — vampiriza força vital transferindo ao conjurador.'},
  'gelido+sombrio':       {name:'Lâmina de Sombra',      ico:'🌑', desc:'Escuridão solidificada — corta carne e espírito, ignorando armaduras.'},
  'aquatico+sombrio':     {name:'Névoa Sombria',         ico:'🌫️', desc:'Qi negro e água — névoa escura que drena força e desorienta os sentidos.'},
  'gasoso+sombrio':       {name:'Vento Maldito',         ico:'🌪️', desc:'Kuroi Kaze ampliado — vento que carrega maldições para onde sopra.'},
  'sombrio+terreo':       {name:'Terra Corrompida',      ico:'🌑', desc:'Solo absorvido pelo qi sombrio — terreno que enfraquece quem pisa nele.'},
  'caotico+sombrio':      {name:'Caos Sombrio',          ico:'🌒', desc:'Eris e youki — escuridão viva que consome tudo sem ordem ou propósito.'},
  'corruptivo+sombrio':   {name:'Podridão das Trevas',   ico:'☠️', desc:'Karma negro e youki — corrupção que se espalha por qualquer sombra.'},
  'corruptivo+vital':     {name:'Vida Corrompida',       ico:'🦠', desc:'Karma negativo corrói a força vital — quanto mais saudável, mais doloroso.'},
  'arcano+corruptivo':    {name:'Magia Corrompida',      ico:'🌀', desc:'Runas e karma negro — feitiços do inimigo se voltam contra ele.'},
  'corruptivo+mortal':    {name:'Maldição Terminal',     ico:'💀', desc:'Karma e morte — maldição que inevitavelmente mata, só o momento varia.'},

  /* ══════════════════════════════════════
     MORTE E VENENO
  ══════════════════════════════════════ */
  'mortal+toxico':        {name:'Toxina Mortal',         ico:'☠️', desc:'Shinigami e naga — veneno que mata em segundos, sem antídoto conhecido.'},
  'arcano+mortal':        {name:'Toque da Morte',        ico:'💀', desc:'Feitiço que apaga a faísca vital — sem dano visível, sem rastro mágico.'},
  'aquatico+mortal':      {name:'Águas do Estige',       ico:'💧', desc:'Morte e água — beber desta água paralisa alma e corpo por tempo indeterminado.'},
  'mortal+terreo':        {name:'Sepultura',             ico:'⚰️', desc:'Terra e morte — o solo engole o alvo vivo, aprisionando até a extinção.'},
  'gasoso+mortal':        {name:'Último Suspiro',        ico:'💨', desc:'O ar se torna veneno de Tânatos — cada respiração aproxima do fim.'},
  'aquatico+toxico':      {name:'Veneno Líquido',        ico:'🐍', desc:'Naga e água — contamina qualquer líquido, paralisia instantânea ao contato.'},
  'gasoso+toxico':        {name:'Epidemia',              ico:'🦠', desc:'Veneno de cobra se vaporiza — ar torna-se vetor de doença imparável.'},
  'terreo+toxico':        {name:'Solo Envenenado',       ico:'🐍', desc:'Veneno que satura o chão — todo movimento expõe a novas doses de toxina.'},
  'gelido+toxico':        {name:'Veneno Gélido',         ico:'❄️', desc:'Mizuchi e gelo — veneno que cristaliza o sangue, dor que aumenta com o frio.'},
  'toxico+vital':         {name:'Mutação',               ico:'🧬', desc:'Veneno e vida — crescimento grotesco, o organismo torna-se predador imprevisível.'},
  'arcano+toxico':        {name:'Veneno Arcano',         ico:'🐍', desc:'Heka e veneno — toxina que dissolve escudos mágicos antes de atacar o corpo.'},

  /* ══════════════════════════════════════
     ARCANO — Runas, Heka, Kekkai
  ══════════════════════════════════════ */
  'aquatico+arcano':      {name:'Água Arcana',           ico:'💧', desc:'Kekkai e água — barreira líquida que reflete magias e envenena quem as lança.'},
  'arcano+gasoso':        {name:'Vórtice Etéreo',        ico:'🌀', desc:'Magia e ar — redemoinho que dissolve feitiços inimigos antes de atingir.'},
  'arcano+vital':         {name:'Cura Rúnica',           ico:'🔵', desc:'Runas de cura — recuperação que escala com o nível de magia acumulada.'},
  'arcano+terreo':        {name:'Pedra Rúnica',          ico:'🪨', desc:'Magia e terra — pilar de pedra gravado com runas emerge e esmaga o alvo.'},
  'arcano+natural':       {name:'Floresta Encantada',    ico:'🌳', desc:'Yggdrasil e runas — árvore que cresce instantaneamente e prende o inimigo.'},

  /* ══════════════════════════════════════
     ELEMENTAIS — Terra, Água, Ar
  ══════════════════════════════════════ */
  'aquatico+terreo':      {name:'Lama Sufocante',        ico:'🌫️', desc:'Terra e água — massa viscosa que gruda, imobiliza e sufoca progressivamente.'},
  'gasoso+terreo':        {name:'Terremoto',             ico:'🌍', desc:'Terra e ar — ondas sísmicas que se propagam pelo solo e pelo ar simultaneamente.'},
  'gelido+terreo':        {name:'Tundra',                ico:'🧊', desc:'Terra e gelo de Nifleheim — solo que congela ao toque, campo de gelo em área.'},
  'natural+terreo':       {name:'Floresta de Pedra',     ico:'🗿', desc:'Yggdrasil e terra — raízes de rocha que aprisionam e esmagam o alvo.'},
  'abrasivo+terreo':      {name:'Tempestade de Areia',   ico:'🌪️', desc:'Terra e areia do Duat — tornado que desintegra armadura por atrito.'},
  'caotico+terreo':       {name:'Caos Sísmico',          ico:'🌍', desc:'Terra e Eris — terremoto imprevisível que abre falhas sem padrão definido.'},
  'aquatico+gasoso':      {name:'Vapor Letal',           ico:'♨️', desc:'Água e ar quente — névoa invisível que cozinha alvos por dentro.'},
  'aquatico+gelido':      {name:'Gelo Vivo',             ico:'🧊', desc:'Água e gelo — congela ao toque, aprisionando o alvo sem matar imediatamente.'},
  'aquatico+natural':     {name:'Seiva Vital',           ico:'🌿', desc:'Mizuchi e Yggdrasil — aura de regeneração acelerada, cura ferimentos graves.'},
  'aquatico+solido':      {name:'Pedra Submersa',        ico:'🪨', desc:'Pedra de Medusa e água — petrifica por dentro, começando pelo sangue.'},
  'gasoso+gelido':        {name:'Blizzard',              ico:'❄️', desc:'Vento glacial de Nifleheim — tempestade de gelo que cega e congela em área.'},
  'gasoso+natural':       {name:'Esporos Letais',        ico:'🍄', desc:'Ar e Yggdrasil — esporos explosivos que explodem ao contato, infectam pulmões.'},
  'caotico+gasoso':       {name:'Tornado do Caos',       ico:'🌪️', desc:'Vento e Eris — tempestade que não tem centro nem direção, devasta aleatoriamente.'},
  'abrasivo+gasoso':      {name:'Nuvem Cortante',        ico:'💨', desc:'Ar e areia do Duat — névoa de partículas que lacera pulmões e olhos.'},

  /* ══════════════════════════════════════
     MATERIAIS — Metalico, Solido, Cristalino
  ══════════════════════════════════════ */
  'igneo+metalico':       {name:'Metal Incandescente',   ico:'🔥', desc:'Ferro e fogo — metal fundido que adere à pele, impossível de remover.'},
  'igneo_eterno+metalico':{name:'Aço Eterno',            ico:'⚔️', desc:'Kusanagi e fogo eterno — lâmina que arde para sempre e não quebra.'},
  'metalico+sombrio':     {name:'Aço Sombrio',           ico:'⚔️', desc:'Correntes e youki — metal que absorve luz e magia, imperceptível no escuro.'},
  'metalico+voltaico':    {name:'Liga Elétrica',         ico:'⚡', desc:'Mjolnir e ferro — metal condutor que transmite descarga ao toque.'},
  'gelido+metalico':      {name:'Ferro Congelado',       ico:'❄️', desc:'Ferro de Nifleheim e gelo — metal que congela ao toque, prende o alvo.'},
  'arcano+metalico':      {name:'Correntes Rúnicas',     ico:'⛓️', desc:'Correntes e runas — grilhões mágicos que não podem ser quebrados por força.'},
  'metalico+terreo':      {name:'Pilar de Ferro',        ico:'🏛️', desc:'Ferro e terra — pilar emerge do solo instantaneamente, esmaga ou muralha.'},
  'metalico+mortal':      {name:'Lâmina da Morte',       ico:'⚰️', desc:'Kusanagi e Shinigami — espada que corta destino além de carne e osso.'},
  'igneo+solido':         {name:'Pedra Incandescente',   ico:'🌋', desc:'Pedra de Medusa e fogo — rocha fundida que petrifica e queima ao mesmo tempo.'},
  'mortal+solido':        {name:'Petrificação Fatal',    ico:'🪨', desc:'Pedra de Medusa e morte — olhar que mata e petrifica instantaneamente.'},
  'arcano+solido':        {name:'Runa de Pedra',         ico:'🪨', desc:'Pedra e magia — muro mágico que reflete projéteis e absorve impactos.'},
  'solido+terreo':        {name:'Rocha Metamórfica',     ico:'🗿', desc:'Pedra e terra — absorve impactos físicos e os devolve em ondas de choque.'},
  'cristalino+luminoso':  {name:'Prisma Solar',          ico:'💎', desc:'Jade e sol de Rá — refrata luz em lasers focados, atravessa qualquer material.'},
  'cristalino+gelido':    {name:'Cristal de Gelo',       ico:'🧊', desc:'Jade e gelo — estrutura que amplifica frio e propaga congelamento em área.'},
  'arcano+cristalino':    {name:'Amplificador Arcano',   ico:'🔷', desc:'Jade imperial e runas — amplifica qualquer feitiço ao triplo do poder normal.'},
  'cristalino+sombrio':   {name:'Cristal Negro',         ico:'🔮', desc:'Jade e youki — cristal que absorve e redireciona magia sombria ao atacante.'},
  'cristalino+vital':     {name:'Cristal da Vida',       ico:'🔷', desc:'Jade e Ka — amplifica energia vital para cura massiva ou dano devastador.'},
  'cristalino+toxico':    {name:'Jade Envenenado',       ico:'💎', desc:'Jade e naga — fragmentos que liberam veneno ao partir, armadilha perfeita.'},

  /* ══════════════════════════════════════
     NATUREZA — Natural, Gelido, Abrasivo
  ══════════════════════════════════════ */
  'natural+vital':        {name:'Sopro da Vida',         ico:'🌬️', desc:'Yggdrasil e vida — vento que restaura energia total e remove todos os debuffs.'},
  'natural+sombrio':      {name:'Floresta das Trevas',   ico:'🌑', desc:'Yggdrasil e trevas nórdicas — árvore que cresce no escuro e suga energia vital.'},
  'natural+toxico':       {name:'Veneno da Floresta',    ico:'🌿', desc:'Yggdrasil e veneno de cobra — toxina orgânica que dissolve o organismo lentamente.'},
  'mortal+natural':       {name:'Raiz da Morte',         ico:'🌿', desc:'Árvore do Mundo toca o inimigo — raízes que drenam a alma enquanto prendem.'},
  'gelido+natural':       {name:'Floresta Congelada',    ico:'🌳', desc:'Yggdrasil e gelo de Nifleheim — árvore que cresce e imediatamente congela o alvo.'},
  'caotico+natural':      {name:'Floresta Caótica',      ico:'🌳', desc:'Eris e Yggdrasil — árvore que cresce em padrão aleatório, imprevisível e letal.'},
  'gelido+mortal':        {name:'Frio da Morte',         ico:'❄️', desc:'Gelo de Nifleheim e morte — congela a alma antes do corpo, morte instantânea.'},
  'gelido+vital':         {name:'Criogenia',             ico:'💙', desc:'Gelo e vida — suspende o alvo em animação, preserva ou mata conforme o uso.'},
  'arcano+gelido':        {name:'Feitiço Rúnico de Gelo',ico:'❄️', desc:'Runas nórdicas e gelo — congelamento que escala com o poder mágico disponível.'},
  'abrasivo+igneo':       {name:'Cinzas Ardentes',       ico:'🌋', desc:'Areia e fogo — partículas incandescentes que penetram qualquer proteção.'},
  'abrasivo+sombrio':     {name:'Areia das Sombras',     ico:'🌑', desc:'Areia do Duat e youki — partículas invisíveis que corroem de dentro para fora.'},
  'abrasivo+mortal':      {name:'Tempestade Mortal',     ico:'💀', desc:'Areia e morte — tornado que enterra vivo e drena força vital durante a asfixia.'},
  'abrasivo+toxico':      {name:'Névoa Ácida',           ico:'☠️', desc:'Areia e veneno — micropartículas tóxicas que envenenam ao respirar.'},
  'abrasivo+aquatico':    {name:'Pasta Corrosiva',       ico:'🏖️', desc:'Areia e água — pasta que penetra armaduras e irrita tecidos profundamente.'},

  /* ══════════════════════════════════════
     CAOS — Eris
  ══════════════════════════════════════ */
  'caotico+vital':        {name:'Caos Vital',            ico:'💚', desc:'Eris e vida — cura e corrompe ao acaso; pode salvar ou destruir instantaneamente.'},
  'arcano+caotico':       {name:'Magia do Caos',         ico:'✨', desc:'Eris e Heka — feitiços que se transformam em outros ao serem conjurados.'},
  'caotico+mortal':       {name:'Morte Caótica',         ico:'⬛', desc:'Eris e Yama — a morte vem sem aviso, sem ordem, sem lógica — imparável.'},
  'caotico+gelido':       {name:'Caos Glacial',          ico:'🌪️', desc:'Eris e gelo — blizzard sem direção que pode congelar aliados ou inimigos igualmente.'},
  'caotico+toxico':       {name:'Praga Caótica',         ico:'🦠', desc:'Eris e veneno — doença que muta constantemente, impossível de curar ou prever.'},
  'caotico+luminoso':     {name:'Luz Caótica',           ico:'💥', desc:'Eris e luz — flashes imprevisíveis que podem cegar inimigos ou revelar fraquezas.'},
}

function tryFuse(id1, id2){
  // Geração procedural: lookup pelo par de tipos canonizado
  const t1=ELEM_TYPE[id1]||'desconhecido';
  const t2=ELEM_TYPE[id2]||'desconhecido';
  const key=[t1,t2].sort().join('+');
  const rule=FUSION_RULES[key];
  if(!rule) return null;
  // Calcula tier e mult a partir da média dos elementos originais
  const el1=[...ELEMENTS].find(e=>e.id===id1);
  const el2=[...ELEMENTS].find(e=>e.id===id2);
  if(!el1||!el2) return null;
  const avgTier=Math.floor((el1.tier+el2.tier)/2);
  const avgMult=+((el1.mult+el2.mult)/2).toFixed(2);
  // Tier menor = mais poderoso; combinar dois baixos tiers produz resultado forte
  const tier=Math.max(0,avgTier-1);
  const mult=+(avgMult+0.2).toFixed(2);
  return {
    id:'fuse_'+id1+'_'+id2,
    name:rule.name,
    ico:rule.ico,
    desc:rule.desc,
    tier,mult,
    e1:id1,e2:id2,
    _proc:true,
  };
}

// Gera TODAS as fusões possíveis entre todos os elementos do jogo (para debug)
function getAllFusions(){
  const allIds=ELEMENTS.map(e=>e.id);
  const results=[];
  const seen=new Set();
  for(let i=0;i<allIds.length;i++){
    for(let j=i+1;j<allIds.length;j++){
      const f=tryFuse(allIds[i],allIds[j]);
      if(!f) continue;
      if(seen.has(f.id)) continue;
      seen.add(f.id);
      results.push(f);
    }
  }
  return results.sort((a,b)=>a.tier-b.tier);
}

// Array global de todas as fusões possíveis — gerado a partir de FUSION_RULES + ELEMENTS
const FUSIONS = getAllFusions();

function getAvailFusions(excludeOwned=true){
  const owned=G.elements.map(e=>e.id);
  const results=[];
  const seen=new Set();
  for(let i=0;i<owned.length;i++){
    for(let j=i+1;j<owned.length;j++){
      const f=tryFuse(owned[i],owned[j]);
      if(!f) continue;
      if(excludeOwned&&owned.includes(f.id)) continue;
      if(seen.has(f.id)) continue;
      seen.add(f.id);
      results.push(f);
    }
  }
  return results.sort((a,b)=>a.tier-b.tier);
};

/* ═══ SISTEMA DE ELEMENTOS ═══ */

// Retorna a fusão disponível entre dois elementos, se existir
// tryFuse definida acima (sistema procedural)

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
    const availFusions=getAvailFusions(true);
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

function setActiveElement(id, origin='picker'){
  const el=G.elements.find(e=>e.id===id);
  if(!el)return;
  G.activeElement=G.activeElement?.id===id?null:el;
  toast(G.activeElement?`${el.ico} ${el.name} ativado!`:'Elemento desativado.');
  if(origin==='grimoire') renderGrimoirePanel('elements');
  else renderElementPicker($('scroll'));
}

function fuseElements(fusionId, origin='picker'){
  if(hasElement(fusionId))return;
  // Buscar pelo id exato na lista de fusões disponíveis
  const f=getAvailFusions(false).find(x=>x.id===fusionId);
  if(!f||!hasElement(f.e1)||!hasElement(f.e2))return;
  G.elements.push({...f});
  toast(`✨ Fusão: ${f.ico} ${f.name} criada!`,2500);
  if(origin==='grimoire') renderGrimoirePanel('elements');
  else renderElementPicker($('scroll'));
}

/* ═══ EVENTS ═══ */
const EVENTS=[
  // ══ EVENTOS UNIVERSAIS (todos os andares) ══
  {id:'camp',type:'rest',title:'Abrigo entre os Mundos',ico:'🏕️',
   body:'Um recanto silencioso no limbo entre os reinos. Uma chama persistente aquece o vazio.',narr_key:'',
   choices:[
     {txt:'Descansar e recuperar forças',hint:'Recupera HP e MP',fn:'rest_camp',hintcls:'ok'},
     {txt:'Vasculhar o abrigo',hint:'Pode conter algo útil',fn:'search_camp'},
     {txt:'Seguir em frente',hint:'',fn:'pass'},
   ]},
  {id:'merchant',type:'shop',title:'Mercador das Almas',ico:'🧳',
   body:'Uma figura encurvada surge da névoa. Seus olhos brilham com conhecimento antigo. <b>"Troco artefatos por ouro, alma."</b>',narr_key:'buy',
   choices:[
     {txt:'Comprar poção (15💰)',hint:'',fn:'buy_pot',cost:{gold:15}},
     {txt:'Comprar equipamento (30💰)',hint:'Item aleatório por raridade',fn:'buy_gear',cost:{gold:30}},
     {txt:'Comprar item raro (50💰)',hint:'Garantido Raro+',fn:'buy_rare',cost:{gold:50}},
     {txt:'Negociar (sorte)',hint:'Pode sair de graça ou mal',fn:'haggle'},
     {txt:'Dispensar',hint:'',fn:'pass'},
   ]},
  {id:'chest',type:'explore',title:'Cofre Sagrado',ico:'📦',
   body:'Um cofre ornamentado com símbolos de várias mitologias. Pulsa com energia contida.',narr_key:'greed',
   choices:[
     {txt:'Abrir o cofre',hint:'Escolha com sabedoria',fn:'chest_game'},
     {txt:'Deixar para trás',hint:'',fn:'pass'},
   ]},
  {id:'altar',type:'story',title:'Altar dos Mortos',ico:'🕯️',
   body:'Um altar coberto de símbolos das 6 mitologias. Pulsa com energia entre a vida e a morte.',narr_key:'curse',
   choices:[
     {txt:'Fazer uma oferenda de HP (-15 HP, +5 ATK)',hint:'Sacrifício por poder',fn:'dark_pact',hintcls:'warn'},
     {txt:'Destruir o altar',hint:'Chance de recompensa',fn:'smash_altar'},
     {txt:'Recuar',hint:'',fn:'pass'},
   ]},
  {id:'trap',type:'explore',title:'Passagem Perigosa',ico:'⚠️',
   body:'Glifos brilham no chão. Alguém colocou armadilhas aqui.',narr_key:'',
   choices:[
     {txt:'Avançar com cautela (DEF)',hint:'Teste de defesa',fn:'trap_def'},
     {txt:'Correr para o outro lado (VEL)',hint:'Teste de velocidade',fn:'trap_spd'},
     {txt:'Dar a volta',hint:'',fn:'pass'},
   ]},
  {id:'library',type:'story',title:'Biblioteca Etérea',ico:'📚',
   body:'Tomos flutuam em espiral. Um volume brilha com energia elemental concentrada.',narr_key:'',
   choices:[
     {txt:'Estudar o tomo brilhante',hint:'Chance de aprender um elemento',fn:'read_tome'},
     {txt:'Coletar vários tomos',hint:'Podem ter valor',fn:'collect_tomes'},
     {txt:'Seguir em frente',hint:'',fn:'pass'},
   ]},
  {id:'wounded',type:'story',title:'Alma Perdida',ico:'👻',
   body:'Uma alma translúcida bloqueia o caminho, ferida. <b>"Você consegue me ver? Ajude-me."</b>',narr_key:'',
   choices:[
     {txt:'Usar poção para ajudar',hint:'Gasta 1 poção',fn:'save_him',cost:{item:'potion'},hintcls:'warn'},
     {txt:'Compartilhar ouro (20💰)',hint:'',fn:'give_gold',cost:{gold:20}},
     {txt:'Ignorar e seguir',hint:'Penalidade no karma',fn:'abandon'},
   ]},
  {id:'gamble',type:'story',title:'O Demônio Apostador',ico:'🎲',
   body:'Um demônio de olhos de brasa ri. <b>"Toda alma tem um preço. O teu... dobro ou nada."</b>',narr_key:'greed',
   choices:[
     {txt:'Apostar 20 moedas',hint:'50% duplicar ou perder',fn:'gamble',hintcls:'warn'},
     {txt:'Apostar tudo',hint:'All in!',fn:'gamble_all',hintcls:'warn'},
     {txt:'Recusar',hint:'',fn:'pass'},
   ]},
  {id:'book',type:'story',title:'Tomo Elemental',ico:'📚',
   body:'Um livro antigo pulsa com energia arcana. Três tomos flutuam diante de você.',narr_key:'',
   choices:[
     {txt:'Estudar os tomos',hint:'Aprenda um novo elemento',fn:'book_event'},
     {txt:'Ignorar',hint:'',fn:'pass'},
   ]},

  // ══ TÁRTARO — ANDAR 1 (Grego) ══
  {id:'hades_encounter',type:'story',title:'A Sombra de Hades',ico:'💀',
   body:'O Senhor do Submundo aparece. <b>"Uma alma não registrada. O que me ofereces em troca de passagem?"</b>',narr_key:'boss',
   choices:[
     {txt:'Oferecer 30 moedas',hint:'Hades aceita ouro',fn:'hades_gold',cost:{gold:30},hintcls:'warn'},
     {txt:'Desafiar seu julgamento',hint:'Risco e recompensa altos',fn:'hades_defy'},
     {txt:'Inclinar a cabeça (+2 karma)',hint:'Humildade tem valor',fn:'hades_bow'},
   ]},
  {id:'elysium_fragment',type:'rest',title:'Fragmento do Elísio',ico:'🌟',
   body:'Uma clareira dourada no Tártaro. A luz de almas abençoadas aquece o ar.',narr_key:'',
   choices:[
     {txt:'Absorver a luz (+HP, +MP, +1 karma)',hint:'',fn:'elysium_absorb',hintcls:'ok'},
     {txt:'Observar e seguir',hint:'',fn:'pass'},
   ]},
  {id:'styx_crossing',type:'explore',title:'As Margens do Estige',ico:'⛵',
   body:'O rio negro separa você do próximo caminho. Há uma barca abandonada.',narr_key:'',
   choices:[
     {txt:'Atravessar sozinho',hint:'Pode encontrar algo nas águas',fn:'styx_alone'},
     {txt:'Pagar um espírito local (10💰)',hint:'Travessia segura',fn:'styx_pay',cost:{gold:10}},
     {txt:'Buscar outra passagem',hint:'',fn:'pass'},
   ]},

  // ══ NIFLEHEIM — ANDAR 2 (Nórdico) ══
  {id:'odin_wisdom',type:'story',title:'O Olho de Odin',ico:'👁️',
   body:'Um corvo pousa no ombro. A presença do Allfather. <b>"Conhecimento tem preço. O que sacrificas?"</b>',narr_key:'',
   choices:[
     {txt:'Sacrificar HP (-20 HP, +2 karma)',hint:'Dói, mas vale',fn:'odin_sacrifice',hintcls:'warn'},
     {txt:'Oferecer ouro (25💰)',hint:'Odin aceita',fn:'odin_gold',cost:{gold:25}},
     {txt:'Recusar',hint:'',fn:'pass'},
   ]},
  {id:'nornas',type:'story',title:'As Nornas',ico:'🕸️',
   body:'Três figuras tecem o destino. Uma levanta os olhos. <b>"Cada fio tem peso. Escolhe qual cortar."</b>',narr_key:'',
   choices:[
     {txt:'O fio da força (+6 ATK, -10 HP MAX)',hint:'Poder ao custo de resistência',fn:'norna_strength',hintcls:'warn'},
     {txt:'O fio da proteção (+6 DEF, -1 VEL)',hint:'Defesa ao custo de velocidade',fn:'norna_defense',hintcls:'warn'},
     {txt:'O fio do destino (efeito aleatório)',hint:'Imprevisível',fn:'norna_fate'},
   ]},
  {id:'yggdrasil',type:'rest',title:'Raiz de Yggdrasil',ico:'🌳',
   body:'Uma raiz da Árvore do Mundo emerge do gelo. Pulsa com vida primordial.',narr_key:'',
   choices:[
     {txt:'Tocar a raiz (HP e MP cheios)',hint:'',fn:'yggdrasil_touch',hintcls:'ok'},
     {txt:'Absorver energia (+15 HP MAX permanente)',hint:'',fn:'yggdrasil_absorb'},
     {txt:'Observar e seguir',hint:'',fn:'pass'},
   ]},

  // ══ DUAT — ANDAR 3 (Egípcio) ══
  {id:'anubis_scale',type:'story',title:'A Balança de Anúbis',ico:'⚖️',
   body:'Anúbis pesa o coração. <b>"Cada escolha que fez tem peso. Deixa eu ver o que carregaste."</b>',narr_key:'boss',
   choices:[
     {txt:'Apresentar o coração com honestidade',hint:'Karma alto = recompensa',fn:'anubis_honest'},
     {txt:'Tentar enganar a balança',hint:'Risco — pode falhar',fn:'anubis_cheat'},
     {txt:'Recusar o julgamento',hint:'Consequências',fn:'anubis_refuse'},
   ]},
  {id:'ra_blessing',type:'rest',title:'Bênção de Rá',ico:'☀️',
   body:'Um raio de sol atravessa o Duat — impossível, mas real. O calor de Rá aquece a alma.',narr_key:'',
   choices:[
     {txt:'Absorver a luz (purifica e cura)',hint:'+HP, remove veneno/maldição',fn:'ra_absorb',hintcls:'ok'},
     {txt:'Capturar em cristal (item)',hint:'Guarda a luz para depois',fn:'ra_capture'},
     {txt:'Observar e seguir',hint:'',fn:'pass'},
   ]},
  {id:'sphinx_riddle',type:'story',title:'A Esfinge Fala',ico:'🦁',
   body:'A Esfinge bloqueia o caminho. <b>"Responde ao meu enigma e passa. Falha e carregues minha maldição."</b>',narr_key:'',
   choices:[
     {txt:'Responder com confiança',hint:'50% passar, 50% maldição',fn:'sphinx_answer'},
     {txt:'Oferecer combate',hint:'Luta difícil — alto risco e recompensa',fn:'sphinx_fight'},
     {txt:'Desviar pelo caminho longo',hint:'Sem risco',fn:'sphinx_avoid'},
   ]},

  // ══ DIYU — ANDAR 4 (Chinês) ══
  {id:'yanluo_judgment',type:'story',title:'O Livro de Yanluo Wang',ico:'📖',
   body:'O Rei do Inferno Chinês consulta seu livro. <b>"Teus pecados estão aqui registrados. Explica-te."</b>',narr_key:'boss',
   choices:[
     {txt:'Confessar e aceitar punição',hint:'Karma aumenta — punição leve',fn:'yanluo_confess'},
     {txt:'Argumentar em sua defesa',hint:'Pode convencê-lo',fn:'yanluo_argue'},
     {txt:'Oferecer tributo (40💰)',hint:'O Rei aceita ouro',fn:'yanluo_bribe',cost:{gold:40}},
   ]},
  {id:'jade_emperor',type:'rest',title:'Fragmento do Jade Imperial',ico:'🐲',
   body:'Um pedaço de jade celestial caiu do Palácio Celestial. Brilha com poder divino.',narr_key:'',
   choices:[
     {txt:'Absorver o poder (+8 MAG, +10 MP MAX)',hint:'',fn:'jade_absorb',hintcls:'ok'},
     {txt:'Guardar como artefato',hint:'Item de uso único',fn:'jade_keep'},
     {txt:'Deixar para trás',hint:'',fn:'pass'},
   ]},

  // ══ YOMI — ANDAR 5 (Japonês) ══
  {id:'izanami_whisper',type:'story',title:'O Sussurro de Izanami',ico:'🌑',
   body:'A voz da Deusa da Morte ecoa. <b>"Você não deveria estar aqui ainda. Prova que mereces existir."</b>',narr_key:'boss',
   choices:[
     {txt:'Demonstrar força (combate com fantasma)',hint:'Risco — alta recompensa',fn:'izanami_fight'},
     {txt:'Demonstrar sabedoria (usa karma)',hint:'Karma 5+ → bônus',fn:'izanami_wisdom'},
     {txt:'Silenciar a mente e avançar',hint:'',fn:'pass'},
   ]},
  {id:'torii_gate',type:'rest',title:'O Portão Torii',ico:'⛩️',
   body:'Um portão vermelho brilhante. Do outro lado, paz e clareza momentâneas.',narr_key:'',
   choices:[
     {txt:'Atravessar o portão (purificação total)',hint:'HP, MP cheios + remove debuffs',fn:'torii_cross',hintcls:'ok'},
     {txt:'Observar do lado de fora',hint:'',fn:'pass'},
   ]},

  // ══ NARAKA — ANDAR 6 (Tailandês/Budista) ══
  {id:'yama_preparation',type:'story',title:'A Ante-Sala de Yama',ico:'⚖️',
   body:'Você está quase lá. Guardas observam em silêncio. Um pergaminho flutua — um resumo de sua jornada.',narr_key:'boss',
   choices:[
     {txt:'Meditar e preparar a mente (+2 karma, +20 HP)',hint:'',fn:'yama_meditate'},
     {txt:'Rever as escolhas feitas',hint:'Revela seu karma total',fn:'yama_review'},
     {txt:'Avançar sem hesitar',hint:'',fn:'pass'},
   ]},
  {id:'lotus_shrine',type:'rest',title:'Santuário do Lótus',ico:'🪷',
   body:'Um lótus floresce em água impossível no Naraka. Pureza no lugar mais impuro.',narr_key:'',
   choices:[
     {txt:'Tocar o lótus (HP cheio e +3 karma)',hint:'',fn:'lotus_touch',hintcls:'ok'},
     {txt:'Colher uma pétala (item sagrado)',hint:'Obtém Pétala do Lótus',fn:'lotus_petal'},
     {txt:'Observar e seguir',hint:'',fn:'pass'},
   ]},

  // ══ FERREIRO ══
  {id:'blacksmith',type:'shop',title:'Ferreiro Errante',ico:'⚒️',
   body:'Um ferreiro enorme ocupa um canto. <b>"Trago o ofício comigo. Ouro aceito, reclamação não."</b>',narr_key:'',
   choices:[
     {txt:'Melhorar item equipado',hint:'Fortifica um slot equipado',fn:'smith_upgrade'},
     {txt:'Fundir dois itens',hint:'Combina stats — custa 80💰',fn:'smith_fuse',cost:{gold:80}},
     {txt:'Reparar item maldito',hint:'Remove penalidades — 50💰',fn:'smith_repair',cost:{gold:50}},
     {txt:'Craftar item novo',hint:'Forja item pelo andar — 70💰',fn:'smith_craft',cost:{gold:70}},
     {txt:'Comprar/Vender itens',hint:'Troca de mercadorias',fn:'smith_trade'},
     {txt:'Dispensar',hint:'',fn:'pass'},
   ]},

  // ══ EVENTOS EM CADEIA ══
  {id:'chain_oracle',type:'story',title:'A Oráculo das Ruínas',ico:'🔮',chain:true,
   body:'Uma figura encurvada bloqueia a passagem. Olhos brancos e vazios. <b>"Eu vejo o que você esconde."</b>',narr_key:'',
   choices:[
     {txt:'Encarar seus olhos',hint:'Ato de coragem',fn:'chain_oracle_brave'},
     {txt:'Oferecer ouro (20💰)',hint:'',fn:'chain_oracle_gold',cost:{gold:20}},
     {txt:'Dar as costas e fugir',hint:'Pode haver consequências',fn:'chain_oracle_flee'},
   ]},
  {id:'chain_ruins',type:'explore',title:'Ruínas Submersas',ico:'🏛️',chain:true,
   body:'Uma estrutura antiga emerge da neblina. Dois caminhos se abrem.',narr_key:'',
   choices:[
     {txt:'Mergulhar na sala alagada',hint:'Algo brilha lá dentro',fn:'chain_ruins_dive'},
     {txt:'Subir a escada estreita',hint:'Risco de desabamento',fn:'chain_ruins_climb'},
     {txt:'Examinar as paredes',hint:'Pode revelar segredos',fn:'chain_ruins_read'},
   ]},
  {id:'chain_prisoner',type:'story',title:'O Prisioneiro Esquecido',ico:'⛓️',chain:true,
   body:'Uma cela na rocha viva. <b>"Me solte. Tenho informações sobre o que espera à frente."</b>',narr_key:'',
   choices:[
     {txt:'Abrir a cela (força)',hint:'Teste de ATK',fn:'chain_prisoner_force'},
     {txt:'Buscar uma chave nos arredores',hint:'Mais seguro',fn:'chain_prisoner_search'},
     {txt:'Ignorá-lo',hint:'Talvez seja armadilha',fn:'chain_prisoner_ignore'},
   ]},
];

/* ═══ STATE ═══ */
let G=null,CE=null,combatLog=[],pendingLevelUp=false,pendingSubclass=false;

function newG(soulData){
  // soulData: { name, vigor, forca, arcano, espirito }
  // Cada ponto distribuído vale:
  //   vigor   → +20 HP máx
  //   forca   → +4 ATK
  //   arcano  → +5 MAG, +10 MP
  //   espirito→ +3 DEF, +5% dodge
  const vigor   = soulData.vigor   || 0;
  const forca   = soulData.forca   || 0;
  const arcano  = soulData.arcano  || 0;
  const espirito= soulData.espirito|| 0;

  const baseHP  = 80  + vigor   * 20;
  const baseMP  = 60  + arcano  * 10;
  const baseATK = 8   + forca   * 4;
  const baseDEF = 4   + espirito* 3;
  const baseMAG = 6   + arcano  * 5;
  const baseSPD = 6;
  const baseDodge = 0.05 + espirito * 0.05;

  G={
    // Identidade
    soulName: soulData.name || 'Alma Sem Nome',
    cls:{id:'soul',name:'Alma',ico:'👻'}, // compatibilidade
    soulBuild: {vigor, forca, arcano, espirito},

    // Vitais
    hp:baseHP, hpMax:baseHP,
    mp:baseMP, mpMax:baseMP,
    atk:baseATK, def:baseDEF, mag:baseMAG, spd:baseSPD,
    crit:0.08, dodge:Math.min(0.40, baseDodge),
    lifesteal:0, critMult:2.0,

    // Progressão
    xp:0, xpNext:40, level:1, gold:20,
    floor:1, room:0, maxRooms:10,
    kills:0, totalDmg:0, events:0,
    karma:0, // novo — karma mitológico

    // Memórias (substituem skills)
    memories: [],

    // Estado
    passives:[], inv:[],
    equip:{head:null,chest:null,weapon:null,feet:null},
    elements:[], activeElement:null,
    _elChargeEl:null, _elChargeCount:0,
    runLog:[], upgrades:[],
    mpRegen: 10 + arcano * 2,
    mpDiscount:0,
    view:'explore', inCombat:false,
    t0:Date.now(), tmpBuffs:[],

    // Missões
    missions:[], missionsCompleted:0,

    // Sets
    activeSets:{},

    // Estado de itens especiais
    compassNextRoom:null,
    arcanaReady:true, arcanaCombatsSince:0,
    phoenixUsed:false,
    warcryTurns:0,
    specialMerchantSeen:false,
    challengeRoomDoneThisFloor:false,

    // Compatibilidade legado
    subclass:null,
    skills:[],
  };

  // Memórias iniciais — 2 aleatórias baseadas no build
  assignStartingMemories();
  generateMissions();
}

function assignStartingMemories(){
  // Pool de memórias iniciais baseado nos atributos mais altos
  const build = G.soulBuild;
  const all = [...MEMORIES];
  // Prioriza memórias compatíveis com o build
  const preferred = all.filter(m=>{
    if(build.forca>=3  && m.affinity==='forca')  return true;
    if(build.arcano>=3 && m.affinity==='arcano')  return true;
    if(build.espirito>=3&&m.affinity==='espirito')return true;
    if(build.vigor>=3  && m.affinity==='vigor')   return true;
    return false;
  });
  const pool = preferred.length >= 2 ? preferred : all;
  const chosen = [...pool].sort(()=>Math.random()-.5).slice(0,2);
  G.memories = chosen.map(m=>({...m}));
  // Compatibilidade: skills aponta para memories
  G.skills = G.memories;
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
function toast(msg,ms=1800){const el=$('toast');if(!el)return;el.textContent=msg;el.classList.remove('hide');clearTimeout(_tt);_tt=setTimeout(()=>el.classList.add('hide'),ms);}
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
  if($('hud-name')) $('hud-name').textContent=G.soulName||'Herói';
  $('hud-cls').textContent=(G.cls?.name||'Alma')+(G.subclass?' · '+G.subclass.name:'')+' — Andar '+floorLabel;
  $('vhp').style.width=pct(G.hp,G.hpMax);$('vmp').style.width=pct(G.mp,G.mpMax);
  $('nhp').textContent=G.hp+'/'+G.hpMax;$('nmp').textContent=G.mp+'/'+G.mpMax;
  $('hlv').textContent='Nv.'+G.level;$('xpf').style.width=pct(G.xp,G.xpNext);
  $('hgold').textContent='💰'+G.gold;
  const subBadge=G.subclass?`<span class="sub-badge">${G.subclass.name}</span>`:'';
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
// ── Sistema de criação de alma ──
let _soulPoints = {vigor:0,forca:0,arcano:0,espirito:0};
const SOUL_TOTAL_POINTS = 10;
const SOUL_ATTRS = [
  {key:'vigor',   label:'Vigor',    ico:'❤️', desc:'+20 HP máx por ponto'},
  {key:'forca',   label:'Força',    ico:'⚔️', desc:'+4 ATK por ponto'},
  {key:'arcano',  label:'Arcano',   ico:'✨', desc:'+5 MAG, +10 MP por ponto'},
  {key:'espirito',label:'Espírito', ico:'🌀', desc:'+3 DEF, +5% Esquiva por ponto'},
];

function buildTitle(){
  renderSoulCreation();
}

function renderSoulCreation(){
  const grid = $('class-grid');
  if(!grid) return;

  const used = ()=>Object.values(_soulPoints).reduce((a,b)=>a+b,0);
  const remaining = ()=>SOUL_TOTAL_POINTS - used();

  const render = ()=>{
    const rem = remaining();
    grid.innerHTML = `
      <div class="soul-creation">
        <div class="soul-name-row">
          <input class="soul-name-input" id="soul-name-input" type="text"
            placeholder="Nome da alma..." maxlength="20"
            value="${$('soul-name-input')?$('soul-name-input').value:''}"
            oninput="checkSoulReady()"/>
        </div>
        <div class="soul-points-label">
          <span>Pontos restantes:</span>
          <span class="soul-pts-num${rem===0?' soul-pts-done':''}">${rem}</span>
        </div>
        <div class="soul-attrs">
          ${SOUL_ATTRS.map(a=>`
            <div class="soul-attr-row">
              <div class="soul-attr-info">
                <span class="soul-attr-ico">${a.ico}</span>
                <div>
                  <div class="soul-attr-name">${a.label}</div>
                  <div class="soul-attr-desc">${a.desc}</div>
                </div>
              </div>
              <div class="soul-attr-ctrl">
                <button class="soul-btn soul-minus" onclick="soulPt('${a.key}',-1)" ${_soulPoints[a.key]<=0?'disabled':''}>−</button>
                <span class="soul-val">${_soulPoints[a.key]}</span>
                <button class="soul-btn soul-plus"  onclick="soulPt('${a.key}',+1)" ${rem<=0?'disabled':''}>+</button>
              </div>
            </div>`).join('')}
        </div>
        <div class="soul-preview">
          <span>HP ${80+_soulPoints.vigor*20}</span>
          <span>MP ${60+_soulPoints.arcano*10}</span>
          <span>ATK ${8+_soulPoints.forca*4}</span>
          <span>DEF ${4+_soulPoints.espirito*3}</span>
          <span>MAG ${6+_soulPoints.arcano*5}</span>
        </div>
      </div>`;
    checkSoulReady();
  };

  render();
  window._soulRender = render;
}

function soulPt(key, delta){
  const used = Object.values(_soulPoints).reduce((a,b)=>a+b,0);
  const val = _soulPoints[key];
  if(delta>0 && used>=SOUL_TOTAL_POINTS) return;
  if(delta<0 && val<=0) return;
  _soulPoints[key] = Math.max(0, val+delta);
  if(window._soulRender) window._soulRender();
}

function checkSoulReady(){
  const inp = $('soul-name-input');
  const name = inp ? inp.value.trim() : '';
  const used = Object.values(_soulPoints).reduce((a,b)=>a+b,0);
  const btn = $('btn-go');
  if(btn) btn.disabled = !(name.length>0 && used===SOUL_TOTAL_POINTS);
}

function startGame(){
  const inp = $('soul-name-input');
  const name = inp ? inp.value.trim() : 'Alma Sem Nome';
  const used = Object.values(_soulPoints).reduce((a,b)=>a+b,0);
  if(!name || used!==SOUL_TOTAL_POINTS) return;
  pendingLevelUp=false;pendingSubclass=false;
  newG({name,..._soulPoints});
  tomoApplyBonuses();
  hide('s-title');show('s-game');upd();navTo('explore');
}

function goTitle(){
  ['s-death','s-win'].forEach(hide);
  G=null;CE=null;combatLog=[];pendingLevelUp=false;pendingSubclass=false;
  _soulPoints={vigor:0,forca:0,arcano:0,espirito:0};
  const btn=$('btn-go');if(btn)btn.disabled=true;
  show('s-title');
  renderSoulCreation();
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
    if(Math.random()<.12){
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
  if(ev && ev.id && ev.title) tomoRecordEvent(ev.id, ev.title, ev.ico||'🗺️'); // Tomo: registra evento
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
  // Tomo: adicionar opção secreta se evento visitado 2+ vezes
  const tomoSecrets={
    camp:     {txt:'Vasculhar com experiência',hint:'✦ Cronista — +25 HP e item garantido',fn:'tomo_camp_expert'},
    shrine:   {txt:'Invocar pela memória',hint:'✦ Cronista — bênção poderosa garantida',fn:'tomo_shrine_memory'},
    merchant: {txt:'Negociar como conhecedor',hint:'✦ Cronista — item raro grátis',fn:'tomo_merchant_expert'},
    dungeon:  {txt:'Explorar com mapa mental',hint:'✦ Cronista — tesouro sem risco',fn:'tomo_dungeon_map'},
    library:  {txt:'Ler na língua original',hint:'✦ Cronista — aprende elemento raro',fn:'tomo_library_read'},
    fountain: {txt:'Potencializar a fonte',hint:'✦ Cronista — cura total HP e MP',fn:'tomo_fountain_full'},
  };
  const evChoices = [...ev.choices];
  if(tomoEventUnlocked(ev.id) && tomoSecrets[ev.id]){
    evChoices.splice(evChoices.length-1, 0, tomoSecrets[ev.id]);
  }
  evChoices.forEach((ch,i)=>{
    const isTomo=ch.fn&&ch.fn.startsWith('tomo_');
    const canDo=isTomo||!ch.cost||canAfford(ch.cost);
    const btn=document.createElement('button');btn.className='chbtn';btn.disabled=!canDo;
    btn.innerHTML=`<span class="chkey">${i+1}</span>
      <div class="chinner"><span class="chtxt">${ch.txt}</span>
      ${ch.hint?`<span class="chhint ${ch.hintcls||''}">${ch.hint}</span>`:''}</div>`;
    btn.onclick=()=>{
      // Ferreiro: não trava os outros botões — permite navegar livremente entre serviços
      if(ev.id!=='blacksmith'){
        card.querySelectorAll('.chbtn').forEach(b=>{b.disabled=true;b.style.opacity=b===btn?'1':'0.25';b.style.transform='none';});
        btn.style.borderColor='rgba(200,168,75,.6)';btn.style.background='rgba(200,168,75,.08)';
      }
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

    // ── Tártaro ──
    hades_gold:()=>{G.karma=(G.karma||0)+1;oc('win','💀','Pacto com Hades','O deus aceita o ouro sem expressão. Uma passagem é garantida.',[{c:'gold',t:'-30💰'},{c:'xp',t:'+1 karma'}]);},
    hades_defy:()=>{if(Math.random()<.45){const b=r(20)+15;addGold(b);G.atk+=3;oc('crit','💀','Hades Recua','Incomum. O deus se retira — não por medo, mas por interesse.',[{c:'gold',t:'+'+b+'💰'},{c:'xp',t:'+3 ATK'}]);}else{const d=r(20)+15;G.hp=Math.max(1,G.hp-d);screenShake();oc('lose','💀','Ira de Hades','O deus não aprecia a afronta.',[{c:'dmg',t:'-'+d+' HP'}],'curse');}},
    hades_bow:()=>{G.karma=(G.karma||0)+2;oc('win','💀','Respeito Reconhecido','Hades observa a humildade. Não é o que esperava.',[{c:'xp',t:'+2 karma'}]);},
    elysium_absorb:()=>{const h=r(20)+20;G.hp=Math.min(G.hpMax,G.hp+h);G.mp=Math.min(G.mpMax,G.mp+20);G.karma=(G.karma||0)+1;oc('win','🌟','Luz do Elísio','A luz das almas abençoadas restaura e purifica.',[{c:'heal',t:'+'+h+' HP'},{c:'mp',t:'+20 MP'},{c:'xp',t:'+1 karma'}]);},
    styx_alone:()=>{if(Math.random()<.5){const it=randItemByRarity('rare+');addItemToInv(it);oc('crit','⛵','Achado no Estige','As águas escondem o que os mortos deixaram para trás.',[{c:'item '+it.rarity,t:it.ico+' '+it.name}]);}else{const d=r(15)+10;G.hp=Math.max(1,G.hp-d);screenShake();oc('lose','⛵','Algo nas Águas','Uma presença nas águas te machuca ao passar.',[{c:'dmg',t:'-'+d+' HP'}]);} },
    styx_pay:()=>{oc('win','⛵','Travessia Segura','O espírito conduz em silêncio. A passagem é tranquila.',[{c:'gold',t:'-10💰'}],'buy');},

    // ── Nifleheim ──
    odin_sacrifice:()=>{const d=20;G.hp=Math.max(1,G.hp-d);G.karma=(G.karma||0)+2;oc('crit','👁️','Sacrifício Aceito','Odin observa o pagamento. O conhecimento flui.',[{c:'dmg',t:'-'+d+' HP'},{c:'xp',t:'+2 karma'}]);},
    odin_gold:()=>{oc('win','👁️','Odin Aceita','O Allfather guarda o ouro sem comentar. Uma bênção sutil segue.',[{c:'gold',t:'-25💰'}]);G.def+=2;},
    norna_strength:()=>{G.atk+=6;G.hpMax=Math.max(20,G.hpMax-10);G.hp=Math.min(G.hp,G.hpMax);oc('warn','🕸️','Fio da Força','As Nornas cortam. A força cresce, a resistência diminui.',[{c:'xp',t:'+6 ATK'},{c:'dmg',t:'-10 HP MAX'}],'curse');},
    norna_defense:()=>{G.def+=6;G.spd=Math.max(1,G.spd-1);oc('warn','🕸️','Fio da Proteção','A armadura se espessa. O passo fica mais lento.',[{c:'xp',t:'+6 DEF'},{c:'dmg',t:'-1 VEL'}]);},
    norna_fate:()=>{const roll=Math.random();if(roll<.33){G.hpMax+=20;G.hp=Math.min(G.hpMax,G.hp+20);oc('crit','🕸️','Destino Benevolente','As Nornas sorriem — raramente.',[{c:'heal',t:'+20 HP MAX'}]);}else if(roll<.66){G.atk+=4;G.mag+=4;oc('win','🕸️','Destino Equilibrado','A balança pende para o bem, desta vez.',[{c:'xp',t:'+4 ATK +4 MAG'}]);}else{const d=r(15)+10;G.hp=Math.max(1,G.hp-d);G.karma=(G.karma||0)-1;screenShake();oc('lose','🕸️','Destino Cruel','O fio cortou fundo.',[{c:'dmg',t:'-'+d+' HP'},{c:'dmg',t:'-1 karma'}],'curse');}},
    yggdrasil_touch:()=>{G.hp=G.hpMax;G.mp=G.mpMax;oc('crit','🌳','Yggdrasil Restaura','A Árvore do Mundo reconhece a necessidade. Tudo é restaurado.',[{c:'heal',t:'HP Cheio'},{c:'mp',t:'MP Cheio'}]);},
    yggdrasil_absorb:()=>{G.hpMax+=15;G.hp=Math.min(G.hpMax,G.hp+15);oc('win','🌳','Energia Primordial','A raiz da árvore eterna transfere um fragmento de sua força.',[{c:'heal',t:'+15 HP MAX'}]);},

    // ── Duat ──
    anubis_honest:()=>{const k=G.karma||0;if(k>=5){const g=r(30)+20;addGold(g);G.hp=Math.min(G.hpMax,G.hp+30);oc('crit','⚖️','Coração Leve','Anúbis aprova. O karma fala mais alto que as palavras.',[{c:'gold',t:'+'+g+'💰'},{c:'heal',t:'+30 HP'}]);}else{oc('neutral','⚖️','Coração Pesado','Anúbis anota. Não condena — mas não recompensa.',[]);} },
    anubis_cheat:()=>{if(Math.random()<.3){const g=r(40)+30;addGold(g);oc('crit','⚖️','Engano Bem-Sucedido','Anúbis não detectou. Desta vez.',[{c:'gold',t:'+'+g+'💰'}]);}else{const d=r(25)+20;G.hp=Math.max(1,G.hp-d);G.karma=(G.karma||0)-2;screenShake();oc('lose','⚖️','Anúbis Detecta','O deus do julgamento não é enganado facilmente.',[{c:'dmg',t:'-'+d+' HP'},{c:'dmg',t:'-2 karma'}],'curse');}},
    anubis_refuse:()=>{const d=r(20)+15;G.hp=Math.max(1,G.hp-d);G.karma=(G.karma||0)-1;screenShake();oc('lose','⚖️','Ira de Anúbis','Recusar o julgamento tem um custo.',[{c:'dmg',t:'-'+d+' HP'},{c:'dmg',t:'-1 karma'}],'curse');},
    ra_absorb:()=>{const h=r(25)+20;G.hp=Math.min(G.hpMax,G.hp+h);G.poisonTurns=0;G.curseTurns=0;G.karma=(G.karma||0)+1;oc('win','☀️','Bênção de Rá','A luz sagrada cura e purifica.',[{c:'heal',t:'+'+h+' HP'},{c:'xp',t:'Debuffs removidos'}]);},
    ra_capture:()=>{const it={id:'ra_light_'+r(9999),name:'Luz de Rá',ico:'☀️',rarity:'epic',uses:1,slot:null,desc:'Cura 40 HP e remove todos os debuffs.',fn:G=>{G.hp=Math.min(G.hpMax,G.hp+40);G.poisonTurns=0;G.curseTurns=0;toast('☀️ Luz de Rá — purificado!');}};addItemToInv(it);oc('win','☀️','Luz Capturada','A luz de Rá aguarda o momento certo.',[{c:'item epic',t:'☀️ Luz de Rá'}]);},
    sphinx_answer:()=>{if(Math.random()<.5){const g=r(30)+20;addGold(g);G.karma=(G.karma||0)+1;oc('crit','🦁','Correto!','A Esfinge se inclina. A passagem é livre.',[{c:'gold',t:'+'+g+'💰'},{c:'xp',t:'+1 karma'}]);}else{G.passives.push('cursed');const d=r(15)+10;G.hp=Math.max(1,G.hp-d);screenShake();oc('lose','🦁','Errado!','A maldição da Esfinge cai sobre você.',[{c:'dmg',t:'-'+d+' HP'},{c:'dmg',t:'Maldição'}],'curse');}},
    sphinx_fight:()=>{const enemy={...ENEMIES.find(e=>e.id==='esfinge')||{name:'Esfinge',ico:'🦁',hp:90,atk:14,def:12,xp:45,gold:[14,24],badges:['Armadura'],type:'construct'},hpCur:90};startCombat(enemy,$('scroll'));},
    sphinx_avoid:()=>{G.room++;oc('neutral','🦁','Desvio Longo','O caminho mais longo... mas sem a maldição.',[]);},

    // ── Diyu ──
    yanluo_confess:()=>{const d=r(10)+5;G.hp=Math.max(1,G.hp-d);G.karma=(G.karma||0)+3;oc('win','📖','Confissão Aceita','Yanluo Wang aprecia a honestidade. A punição é leve.',[{c:'dmg',t:'-'+d+' HP'},{c:'xp',t:'+3 karma'}]);},
    yanluo_argue:()=>{if(Math.random()<.4){const g=r(30)+20;addGold(g);G.karma=(G.karma||0)+1;oc('crit','📖','Convencido!','O Rei dos Mortos aceita os argumentos, surpreendentemente.',[{c:'gold',t:'+'+g+'💰'},{c:'xp',t:'+1 karma'}]);}else{const d=r(20)+10;G.hp=Math.max(1,G.hp-d);oc('lose','📖','Argumento Rejeitado','Yanluo Wang não aprecia a contestação.',[{c:'dmg',t:'-'+d+' HP'}],'curse');}},
    yanluo_bribe:()=>{G.karma=(G.karma||0)-1;oc('neutral','📖','Suborno Aceito','Yanluo Wang guarda o ouro sem expressão. A corrupção tem sabor familiar aqui.',[{c:'gold',t:'-40💰'},{c:'dmg',t:'-1 karma'}]);},
    jade_absorb:()=>{G.mag+=8;G.mpMax+=10;G.mp=Math.min(G.mpMax,G.mp+10);oc('crit','🐲','Poder Imperial','O jade celestial transfere poder arcano antiquíssimo.',[{c:'xp',t:'+8 MAG'},{c:'mp',t:'+10 MP MAX'}]);},
    jade_keep:()=>{const it={id:'jade_'+r(9999),name:'Jade Imperial',ico:'🐲',rarity:'legendary',uses:1,slot:null,desc:'+12 MAG e +25 MP.',fn:G=>{G.mag+=12;G.mpMax+=25;G.mp=Math.min(G.mpMax,G.mp+25);toast('🐲 Poder do Jade Imperial!');}};addItemToInv(it);oc('win','🐲','Jade Guardado','O poder aguarda o momento certo.',[{c:'item legendary',t:'🐲 Jade Imperial'}]);},

    // ── Yomi ──
    izanami_fight:()=>{const enemy={name:'Espírito de Izanami',ico:'🌑',hp:80,atk:20,def:8,xp:60,gold:[20,35],hpCur:80,badges:['Maldição','Morto-vivo'],type:'undead'};startCombat(enemy,$('scroll'));},
    izanami_wisdom:()=>{const k=G.karma||0;if(k>=5){G.mag+=5;G.mp=Math.min(G.mpMax,G.mp+30);G.karma+=1;oc('crit','🌑','Sabedoria Reconhecida','Izanami se retira. O karma fala mais alto que qualquer arma.',[{c:'xp',t:'+5 MAG'},{c:'mp',t:'+30 MP'},{c:'xp',t:'+1 karma'}]);}else{oc('neutral','🌑','Insuficiente','O karma ainda é leve demais. Izanami observa e se afasta em silêncio.',[]);} },
    torii_cross:()=>{G.hp=G.hpMax;G.mp=G.mpMax;G.poisonTurns=0;G.curseTurns=0;G.karma=(G.karma||0)+1;oc('crit','⛩️','Purificação Total','O portão sagrado apaga toda impureza.',[{c:'heal',t:'HP Cheio'},{c:'mp',t:'MP Cheio'},{c:'xp',t:'Debuffs removidos'}]);},

    // ── Naraka ──
    yama_meditate:()=>{G.hp=Math.min(G.hpMax,G.hp+20);G.karma=(G.karma||0)+2;oc('win','⚖️','Mente Preparada','A meditação prepara a alma para o julgamento final.',[{c:'heal',t:'+20 HP'},{c:'xp',t:'+2 karma'}]);},
    yama_review:()=>{const k=G.karma||0;const klbl=k>=8?'Alma virtuosa':k>=5?'Alma equilibrada':'Alma a ser julgada';toast('⚖️ Karma total: '+k+' — '+klbl,3000);oc('neutral','⚖️','Jornada Revisada','Seu karma total é '+k+'. Yama já sabe o que decidir.',[{c:k>=5?'xp':'dmg',t:'Karma: '+k}]);},
    lotus_touch:()=>{G.hp=G.hpMax;G.karma=(G.karma||0)+3;oc('crit','🪷','Bênção do Lótus','A flor sagrada do Naraka purifica e ilumina a alma.',[{c:'heal',t:'HP Cheio'},{c:'xp',t:'+3 karma'}]);},
    lotus_petal:()=>{const it={id:'lotus_'+r(9999),name:'Pétala do Lótus',ico:'🪷',rarity:'legendary',uses:1,slot:null,desc:'Cura completamente HP e concede +5 karma.',fn:G=>{G.hp=G.hpMax;G.karma=(G.karma||0)+5;toast('🪷 Pétala do Lótus — purificação completa!');}};addItemToInv(it);oc('win','🪷','Pétala Colhida','A pétala sagrada guarda seu poder para quando mais precisar.',[{c:'item legendary',t:'🪷 Pétala do Lótus'}]);},

    // ── Opções secretas do Tomo ──
    tomo_camp_expert:()=>{const h=25;G.hp=Math.min(G.hpMax,G.hp+h);const it=randItemByRarity('rare+');addItemToInv(it);oc('crit','📖','Memória do Cronista','Seu conhecimento guia cada movimento neste lugar familiar.',[{c:'heal',t:'+'+h+' HP'},{c:'item '+it.rarity,t:it.ico+' '+it.name}]);},
    tomo_shrine_memory:()=>{const h=r(40)+30;G.hp=Math.min(G.hpMax,G.hp+h);G.mp=Math.min(G.mpMax,G.mp+30);G.atk+=2;oc('crit','📖','Memória do Cronista','Os espíritos reconhecem o Cronista. A bênção é total.',[{c:'heal',t:'+'+h+' HP'},{c:'mp',t:'+30 MP'},{c:'xp',t:'+2 ATK'}]);},
    tomo_merchant_expert:()=>{const it=randItemByRarity('rare+');addItemToInv(it);oc('crit','📖','Memória do Cronista','O mercador respeita quem conhece o valor das coisas.',[{c:'item '+it.rarity,t:it.ico+' '+it.name}],'buy');},
    tomo_dungeon_map:()=>{const it=randItemByRarity('rare+');addItemToInv(it);const g=r(25)+20;addGold(g);oc('crit','📖','Memória do Cronista','Você navega como se tivesse nascido aqui.',[{c:'item '+it.rarity,t:it.ico+' '+it.name},{c:'gold',t:'+'+g+'💰'}]);},
    tomo_library_read:()=>{const eligible=ELEMENTS.filter(e=>e.tier<=2&&!G.elements.some(x=>x.id===e.id));if(eligible.length){const el=pick(eligible);G.elements.push({...el});toast(`${el.ico} ${el.name} aprendido!`);oc('crit','📖','Memória do Cronista','As palavras antigas revelam seus segredos.',[{c:'xp',t:el.ico+' '+el.name+' aprendido'}]);}else{const xp=r(40)+30;G.xp+=xp;oc('win','📖','Memória do Cronista','Todo conhecimento tem valor.',[{c:'xp',t:'+'+xp+' XP'}]);}},
    tomo_fountain_full:()=>{G.hp=G.hpMax;G.mp=G.mpMax;oc('crit','📖','Memória do Cronista','Você canaliza toda a energia. Cura completa.',[{c:'heal',t:'HP Cheio'},{c:'mp',t:'MP Cheio'}]);},
    // ── Opções secretas do Tomo ──
    tomo_camp_expert:()=>{const h=25;G.hp=Math.min(G.hpMax,G.hp+h);const it=randItemByRarity('rare+');addItemToInv(it);oc('crit','📖','Memória do Cronista','Seu conhecimento guia cada movimento neste lugar familiar.',[{c:'heal',t:'+'+h+' HP'},{c:'item '+it.rarity,t:it.ico+' '+it.name}]);},
    tomo_shrine_memory:()=>{const h=r(40)+30;G.hp=Math.min(G.hpMax,G.hp+h);G.mp=Math.min(G.mpMax,G.mp+30);G.atk+=2;oc('crit','📖','Memória do Cronista','Os espíritos reconhecem o Cronista. A bênção é total.',[{c:'heal',t:'+'+h+' HP'},{c:'mp',t:'+30 MP'},{c:'xp',t:'+2 ATK'}]);},
    tomo_merchant_expert:()=>{const it=randItemByRarity('rare+');addItemToInv(it);oc('crit','📖','Memória do Cronista','O mercador respeita quem conhece o valor das coisas.',[{c:'item '+it.rarity,t:it.ico+' '+it.name}],'buy');},
    tomo_dungeon_map:()=>{const it=randItemByRarity('rare+');addItemToInv(it);const g=r(25)+20;addGold(g);oc('crit','📖','Memória do Cronista','Você navega pelos corredores como se tivesse nascido neles.',[{c:'item '+it.rarity,t:it.ico+' '+it.name},{c:'gold',t:'+'+g+'💰'}]);},
    tomo_library_read:()=>{const eligibleEls=ELEMENTS.filter(e=>e.tier<=2&&!G.elements.some(x=>x.id===e.id));if(eligibleEls.length){const el=pick(eligibleEls);G.elements.push({...el});toast(`${el.ico} ${el.name} aprendido!`);oc('crit','📖','Memória do Cronista','As palavras antigas revelam seus segredos ao Cronista.',[{c:'xp',t:el.ico+' '+el.name+' aprendido'}]);}else{const xp=r(40)+30;G.xp+=xp;oc('win','📖','Memória do Cronista','Todo conhecimento tem valor.',[{c:'xp',t:'+'+xp+' XP'}]);}},
    tomo_fountain_full:()=>{G.hp=G.hpMax;G.mp=G.mpMax;oc('crit','📖','Memória do Cronista','Você canaliza toda a energia da fonte. Cura completa.',[{c:'heal',t:'HP Cheio'},{c:'mp',t:'MP Cheio'}]);},
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
  const equipped=Object.entries(G.equip||{}).filter(([slot,it])=>it&&it.bonus);
  if(!equipped.length){toast('Nenhum item equipado para melhorar!');return;}

  const costs={common:30,rare:60,epic:100,legendary:150};
  const gains={common:2,rare:3,epic:4,legendary:5};

  const card=document.createElement('div');card.className='card esh';
  const rows=equipped.map(([slot,it])=>{
    const cost=costs[it.rarity]||60;
    const gain=gains[it.rarity]||2;
    const canBuy=G.gold>=cost;
    const mainStat=Object.keys(it.bonus||{})[0]||'atk';
    return `<div class="special-merch-item ${canBuy?'':'disabled'}" style="opacity:${canBuy?1:.5}" onclick="${canBuy?`smithUpgrade('${slot}',${cost},${gain},'${mainStat}')`:''}">
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



// ─── Fundir dois itens ───
function smithFuse(doFuse){
  const sc=$('scroll');
  // Executar a fusão
  if(doFuse===true){
    const sel=G._smithFuseSelected;
    if(!sel||sel.length!==2){toast('Selecione 2 itens!');return;}
    if(G.gold<80){toast('Ouro insuficiente! (80💰)');return;}
    const it1=G.inv[sel[0]];
    const it2=G.inv[sel[1]];
    if(!it1||!it2){toast('Itens inválidos!');return;}
    G.gold-=80;
    // Fusão: combina bonus dos dois itens
    const rarityOrder=['common','uncommon','rare','epic','legendary'];
    const r1=rarityOrder.indexOf(it1.rarity||'common');
    const r2=rarityOrder.indexOf(it2.rarity||'common');
    const newRar=rarityOrder[Math.min(4,Math.max(r1,r2)+1)];
    const combinedBonus={};
    [it1,it2].forEach(it=>{
      if(it.bonus) Object.entries(it.bonus).forEach(([k,v])=>{combinedBonus[k]=(combinedBonus[k]||0)+Math.round(v*0.7);});
    });
    const fused={
      id:'fused_'+r(99999),
      name:`${it1.name} & ${it2.name}`,
      ico:it1.ico,
      rarity:newRar,
      slot:it1.slot||it2.slot||null,
      desc:`Fusão de ${it1.name} e ${it2.name}.`,
      bonus:Object.keys(combinedBonus).length?combinedBonus:null,
      uses:null,fn:null,
    };
    // Remove os dois itens (do maior índice para não deslocar)
    const idxs=[sel[0],sel[1]].sort((a,b)=>b-a);
    idxs.forEach(i=>G.inv.splice(i,1));
    addItemToInv(fused);
    if(fused.bonus) applyBonus(fused);
    toast(`⚒️ ${fused.name} (${newRar}) criado!`,2500);
    upd();
    openSmith(sc);return;
  }
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
      <button class="btn-next" style="margin-bottom:8px;${canFuse?'':'opacity:.4;pointer-events:none;'}" onclick="smithFuse(true)">⚒️ Fundir (80💰)</button>
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



// ─── Reparar item maldito ───
function smithRepair(){
  const sc=$('scroll');
  const cursed=G.inv.filter(it=>it.bonus&&Object.values(it.bonus).some(v=>v<0));
  if(!cursed.length){toast('Nenhum item com penalidades no inventário!');return;}

  const card=document.createElement('div');card.className='card esh';
  const rows=cursed.map((it,i)=>{
    const negStats=Object.entries(it.bonus).filter(([k,v])=>v<0).map(([k,v])=>`${k.toUpperCase()} ${v}`).join(', ');
    return `<div class="special-merch-item" onclick="smithRepair('${it.id}')">
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



// ─── Craftar item novo ───
function smithCraft(execSlot){
  // Com argumento: executa o craft. Sem argumento: exibe o painel.
  if(execSlot!==undefined){
    if(G.gold<70){toast('Ouro insuficiente!');return;}
    G.gold-=70;
    const rarRoll=Math.random();
    const rarity= G.floor>=6 ? (rarRoll<.15?'legendary':rarRoll<.5?'epic':'rare')
                : G.floor>=4 ? (rarRoll<.08?'legendary':rarRoll<.35?'epic':'rare')
                : G.floor>=2 ? (rarRoll<.04?'legendary':rarRoll<.2?'epic':rarRoll<.55?'rare':'common')
                :               (rarRoll<.1?'rare':rarRoll<.4?'common':'common');
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
      name:names[execSlot][rarity],
      ico:icos[execSlot],
      rarity,slot:execSlot,uses:null,
      bonus:bonusMap[execSlot],
      desc:Object.entries(bonusMap[execSlot]).map(([k,v])=>`+${v} ${k.toUpperCase()}`).join(' ')+' [Forjado]',
    };
    addItemToInv(crafted);upd();
    toast(`⚒️ ${crafted.name} (${rarity}) forjado!`,2500);
    smithCraft(); return; // recarrega o painel
  }
  const sc=$('scroll');
  if(G.gold<70){toast('Ouro insuficiente! (70💰)');return;}
  const slots=['weapon','chest','head','feet'];
  const card=document.createElement('div');card.className='card esh';
  const rows=slots.map(slot=>{
    const ico={weapon:'⚔️',chest:'🛡️',head:'⛑️',feet:'👟'}[slot];
    const lbl={weapon:'Arma',chest:'Armadura',head:'Elmo',feet:'Botas'}[slot];
    return `<div class="special-merch-item" onclick="smithCraft('${slot}')">
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
  // No novo sistema, subclasse = ganhar uma Memória Épica ou Rara exclusiva
  sc.innerHTML='';
  const card=mkCard('explore');
  card.innerHTML=`
    <div class="ctag"><div class="ctag-dot" style="background:#9b59b6"></div><span class="ctag-txt" style="color:#9b59b6">MEMÓRIA DESPERTA</span></div>
    <div class="lvup-title">🌟 Uma Lembrança Emerge</div>
    <div class="lvup-sub">"${narr('subclass')}"</div>
    <div class="subcls-grid" id="subcls-grid"></div>`;
  sc.appendChild(card);
  // Oferecer 2 Memórias raras/épicas que a alma ainda não tem
  const owned = new Set(G.memories.map(m=>m.id));
  const opts = MEMORIES.filter(m=>!owned.has(m.id)&&(m.rarity==='rare'||m.rarity==='epic'))
    .sort(()=>Math.random()-.5).slice(0,2);
  // Fallback: qualquer memória não possuída
  const fallback = MEMORIES.filter(m=>!owned.has(m.id)).sort(()=>Math.random()-.5).slice(0,2);
  const choices = opts.length>=2 ? opts : fallback;
  choices.forEach(m=>{
    const d=document.createElement('div');d.className='subcls-card pld';
    d.innerHTML=`<div class="subcls-ico">${m.ico}</div><div class="subcls-name">${m.name}</div><div class="subcls-desc">${m.desc}</div><div class="subcls-bonus">${m.rarity.toUpperCase()} · ${m.affinity}</div>`;
    d.onclick=()=>{
      G.memories.push({...m});
      G.skills=G.memories; // compatibilidade
      G.subclass={name:m.name};
      upd();logRun('🌟',`Memória: ${m.name}`,'win');sfx('subclass');
      toast('🌟 '+m.name+' memorado!',2500);lvFlash();nextRoom();
    };
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
  // Filtra upgrades: remove já adquiridos e os que têm req não cumprido
  const acquired=new Set(G.upgrades.map(u=>typeof u==='string'?u:u));
  const acquiredIds=new Set(
    UPGRADES.filter(u=>G.upgrades.includes(u.name)).map(u=>u.id)
  );
  const eligible=UPGRADES.filter(u=>{
    if(acquiredIds.has(u.id)) return false; // já tem
    if(u.req&&!acquiredIds.has(u.req)) return false; // pré-requisito não cumprido
    return true;
  });
  const pool=(eligible.length>=count?eligible:[...eligible,...UPGRADES.filter(u=>!acquiredIds.has(u.id))])
    .sort(()=>Math.random()-.5).slice(0,count);
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

function tickStatus(target, isPlayer=false){
  // target: CE (inimigo) ou G (jogador)
  // Retorna true se o alvo morreu (só relevante para inimigo)
  const hpKey  = isPlayer?'hp':'hpCur';
  const hpMax  = isPlayer?target.hpMax:target.hp;
  const label  = isPlayer?'você':target.name;
  const logLvl = isPlayer?'le':'li';
  let died=false;

  // Veneno
  if(target.poisonTurns>0){
    const d=target.poisonDmg||(isPlayer?3:0);
    target[hpKey]=Math.max(0,target[hpKey]-d);
    target.poisonTurns--;
    clog(`🐍 Veneno: -${d} HP em ${label}. (${target.poisonTurns} rest.)`,
      target[hpKey]<=0?'ls':logLvl);
    if(target[hpKey]<=0) died=true;
  }
  // Queimadura (não expira por turno — só ao fim do combate)
  if(!died&&target.burnTurns>0){
    const d=target.burnDmg||(isPlayer?4:0);
    target[hpKey]=Math.max(0,target[hpKey]-d);
    clog(`🔥 Queimadura: -${d} HP em ${label}.`,
      target[hpKey]<=0?'ls':logLvl);
    if(target[hpKey]<=0) died=true;
  }
  // Congelamento (só no jogador — decai aqui, efeito tratado em enemyTurn)
  if(isPlayer&&target.freezeTurns>0) target.freezeTurns--;

  if(isPlayer&&target.passives?.includes('godmode')) target.hp=target.hpMax;
  return died;
}
function tickStatusOnEnemy(){ return tickStatus(CE,false); }

function tickStatusOnPlayer(){ tickStatus(G,true); }

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
  G._shadowUsed=false; // Assassino: reseta primeiro golpe a cada combate
  G.divineShield=false; // Paladino: reseta escudo
  CE={...enemy,hpCur:enemy.hp,stunned:false,poisonTurns:0,burnTurns:0,freezeTurns:0,_marked:false,_markedTurns:0,_foggedTurns:0,_roaredTurns:0,_roaredAtk:0};
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
  // Skill primária: sempre mostra a skill da classe (Bola de Fogo, etc.)
  // A Magia Elemental foi movida para o botão sk2 (Fusão Elemental)
  const sk=G.skills[0];
  const isMageEl=activeEl&&G.cls.id==='mage';
  const skIco=sk.ico;
  const skName=sk.name;
  const skDesc=sk.desc;
  const rawMp=sk.mp;
  const skMp=Math.max(0,rawMp-(G.mpDiscount||0));
  const skType=sk.type;
  // Carga elemental — indicador de progresso (mantido para referência visual)
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
  const _enemyStudied = tomoIsEnemyStudied(CE.id||CE.name);
  const eyeInfo=(G.passives.includes('guardian_eye')||_enemyStudied)?
    `<div style="font-size:10px;color:var(--txt2);font-family:var(--cinzel);margin-top:4px;opacity:.8;">${_enemyStudied?'📖 ':''}ATK ${CE.atk} | DEF ${CE.def} | XP ${CE.xp}</div>`:'';

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
  // Memórias — tipos novos
  if(type==='mem_warrior'){
    const dmg=Math.round(Math.max(8,G.atk*1.8+r(10)));
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    dentReadyBar(dmg);floatDmg('⚔️'+dmg,'#e74c3c');spawnParticles(10,'#e74c3c');
    clog(`⚔️ Memória do Guerreiro: ${dmg} dano físico!`,'lc');
    updateCombatUI();return;
  }
  if(type==='mem_berserker'){
    const dmg1=Math.round(Math.max(6,G.atk*1.4+r(8)));
    const dmg2=Math.round(Math.max(6,G.atk*1.4+r(8)));
    const selfDmg=Math.round(G.hp*0.10);
    CE.hpCur=Math.max(0,CE.hpCur-dmg1-dmg2);G.totalDmg+=dmg1+dmg2;
    G.hp=Math.max(1,G.hp-selfDmg);
    dentReadyBar(dmg1+dmg2);floatDmg('🪓'+(dmg1+dmg2),'#c0392b');spawnParticles(14,'#c0392b');
    clog(`🪓 Berserker: ${dmg1}+${dmg2} dano! (-${selfDmg} HP próprio)`,'lc');
    updateCombatUI();return;
  }
  if(type==='mem_knight'){
    G.tmpBuffs.push({stat:'def',val:3,turns:2});
    G._shieldNext=true;
    clog('🛡️ Cavaleiro: bloqueio ativado! +3 DEF por 2 turnos.','lh');
    updateCombatUI();return;
  }
  if(type==='mem_mage'){
    const dmg=Math.round(Math.max(10,G.mag*2.2+r(12)));
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    dentReadyBar(dmg);floatDmg('🔥'+dmg,'#e67e22');spawnParticles(12,'#e67e22');flashCard('rgba(230,126,34,.3)',280);
    clog(`🔥 Memória do Mago: ${dmg} dano mágico!`,'lc');
    updateCombatUI();return;
  }
  if(type==='mem_oracle'){
    const dmg=Math.round(Math.max(6,G.mag*1.2+r(8)));
    const heal=Math.round(dmg*0.5);
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    G.hp=Math.min(G.hpMax,G.hp+heal);
    dentReadyBar(dmg);floatDmg('🔮'+dmg,'#9b59b6');
    clog(`🔮 Oráculo: ${dmg} dano + ${heal} HP curado!`,'lh');
    updateCombatUI();return;
  }
  if(type==='mem_necro'){
    CE._atkDebuff=(CE._atkDebuff||0)+4;CE.atk=Math.max(1,CE.atk-4);
    clog('💀 Necromante: inimigo enfraquecido! -4 ATK por 3 turnos.','lh');
    updateCombatUI();return;
  }
  if(type==='mem_healer'){
    const heal=Math.round(Math.max(15,G.mag*1.5+r(10)));
    G.hp=Math.min(G.hpMax,G.hp+heal);
    floatDmg('💚+'+heal,'#27ae60');sfx('heal'||'open');
    clog(`💚 Curandeiro: +${heal} HP restaurado!`,'lh');
    updateCombatUI();return;
  }
  if(type==='mem_bard'){
    G.tmpBuffs.push({stat:'atk',val:4,turns:3},{stat:'def',val:4,turns:3});
    clog('🎵 Trovador: +4 ATK e +4 DEF por 3 turnos!','lh');
    updateCombatUI();return;
  }
  if(type==='mem_titan'){
    const dmg=Math.round(Math.max(12,G.atk*2.0+r(8)));
    const heal=10;
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;G.hp=Math.min(G.hpMax,G.hp+heal);
    dentReadyBar(dmg);floatDmg('💪'+dmg,'#e67e22');spawnParticles(12,'#f39c12');
    clog(`💪 Titã: ${dmg} dano + ${heal} HP recuperado!`,'lh');
    updateCombatUI();return;
  }
  if(type==='mem_monk'){
    const hits=[r(6)+G.atk,r(6)+G.atk,r(6)+G.atk];
    const total=hits.reduce((a,b)=>a+b,0);
    CE.hpCur=Math.max(0,CE.hpCur-total);G.totalDmg+=total;
    dentReadyBar(total);floatDmg('🥋'+total,'#f1c40f');spawnParticles(16,'#f1c40f');
    clog(`🥋 Monge: ${hits.join('+')}=${total} dano!`,'lc');
    updateCombatUI();return;
  }
  if(type==='mem_dragon'){
    const dmg=Math.round(Math.max(20,G.mag*3.0+r(15)));
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    dentReadyBar(dmg);floatDmg('🐉'+dmg,'#e74c3c');spawnParticles(20,'#e74c3c');flashCard('rgba(231,76,60,.4)',400);
    clog(`🐉 Dragão: ${dmg} dano elemental! (ignora DEF)`,'lc');
    updateCombatUI();return;
  }
  if(type==='mem_valkyrie'){
    const dmg=Math.round(Math.max(15,(G.atk+G.mag)*1.5+r(12)));
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    if(!G._valkyrieUsed){G._valkyrieUsed=true;G.passives.push('phoenix_once');}
    dentReadyBar(dmg);floatDmg('⚡'+dmg,'#f1c40f');spawnParticles(16,'#f1c40f');flashCard('rgba(241,196,15,.3)',300);
    clog(`⚡ Valquíria: ${dmg} dano! Ressurreição ativada.`,'lc');
    updateCombatUI();return;
  }
  if(type==='mem_anubis'){
    const dmg=Math.round(Math.max(10,(G.karma||0)*3+G.mag));
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    dentReadyBar(dmg);floatDmg('⚖️'+dmg,'#9b59b6');spawnParticles(14,'#9b59b6');
    clog(`⚖️ Anúbis: ${dmg} dano do julgamento! (karma: ${G.karma||0})`,'lc');
    updateCombatUI();return;
  }
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
  // ═══ PALADINO ═══
  } else if(type==='holy_strike'){
    const dmg=Math.round(Math.max(1,G.atk*1.5+r(10)-Math.floor(CE.def*.3)));
    const heal=8+(G.passives.includes('holy_dmg')?4:0);
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    G.hp=Math.min(G.hpMax,G.hp+heal);
    G._mSkillUses=(G._mSkillUses||0)+1;
    clog(`✨ Golpe Sagrado: ${dmg} dano + curou ${heal} HP!`,'lc');floatDmg('✨'+dmg,'#f1c40f',55,35);floatDmg('+'+heal+'❤️','#2ecc71',35,55);
    upd();
  } else if(type==='divine_shield'){
    G.divineShield=true;G.def+=4;G._divineShieldTurns=2;
    G._mSkillUses=(G._mSkillUses||0)+1;
    clog('🛡️ Escudo Divino ativado! Próximo ataque bloqueado. +4 DEF por 2 turnos!','lc');floatDmg('🛡️ Bloqueio','#f1c40f',40,30);
    updateCombatUI();return;
  // ═══ DRUIDA ═══
  } else if(type==='thorns'){
    const dmg=Math.round(Math.max(3,G.mag*1.3+r(8)));
    const turns=G.passives.includes('long_poison')?6:3;
    const pdmg=Math.max(3,Math.round(G.mag*.28));
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    applyStatus(CE,'poison',turns,pdmg);
    G._mSkillUses=(G._mSkillUses||0)+1;
    clog(`🌿 Espinhos da Floresta: ${dmg} dano + veneno ${pdmg}/turno por ${turns} turnos!`,'lc');floatDmg('🌿'+dmg,'#27ae60',55,35);
    spawnParticles(8,'#27ae60');
  } else if(type==='vital_pulse'){
    const heal=Math.round(G.hpMax*.25);
    G.hp=Math.min(G.hpMax,G.hp+heal);
    G._mSkillUses=(G._mSkillUses||0)+1;
    clog(`💚 Pulso Vital: curou ${heal} HP!`,'lc');floatDmg('+'+heal+'💚','#2ecc71',45,35);
    upd();updateCombatUI();return;
  // ═══ CAÇADOR ═══
  } else if(type==='precise_arrow'){
    const marked=CE._marked||false;
    const mult=marked?1.8:1.3;
    const dmg=Math.round(Math.max(1,G.atk*mult+r(12)-Math.floor(CE.def*.2)));
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    if(marked){clog(`🏹 Flecha Certeira na PRESA MARCADA: ${dmg} dano!`,'lc');floatDmg('🎯'+dmg,'#e67e22',55,35);}
    else{clog(`🏹 Flecha Certeira: ${dmg} dano!`,'lc');floatDmg('🏹'+dmg,'#e67e22',55,35);}
    G._mSkillUses=(G._mSkillUses||0)+1;
  } else if(type==='mark_prey'){
    CE._marked=true;CE._markedTurns=3;
    if(G.passives.includes('trap_master'))CE.stunned=true;
    G._mSkillUses=(G._mSkillUses||0)+1;
    clog(`🎯 Presa Marcada! +25% dano recebido por 3 turnos${G.passives.includes('trap_master')?' + Paralisia':''}!`,'lc');floatDmg('🎯 MARCADO','#e67e22',40,30);
    updateCombatUI();return;
  // ═══ FEITICEIRO ═══
  } else if(type==='chaos_bolt'){
    const hasChaos=G.passives.includes('chaos_master');
    let mult;
    const roll=Math.random();
    if(hasChaos){mult=roll<.10?0:roll<.40?3.0:1.8;}
    else{mult=roll<.20?0.4:roll<.55?1.2:2.4;}
    const dmg=Math.round(Math.max(0,G.mag*mult+r(18)));
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    G._mSkillUses=(G._mSkillUses||0)+1;
    if(mult===0||mult===0.4){clog(`⚡ Descarga Caótica... falhooou! Apenas ${dmg} dano!`,'li');floatDmg('⚡FALHA','#95a5a6',50,35);}
    else if(mult>=2.4||mult>=3.0){clog(`⚡ DESCARGA CAÓTICA MASSIVA: ${dmg} dano!!!`,'lc');floatDmg('⚡'+dmg,'#f1c40f',55,33);screenShake();spawnParticles(15,'#f39c12');}
    else{clog(`⚡ Descarga Caótica: ${dmg} dano mágico!`,'lc');floatDmg('⚡'+dmg,'#9b59b6',55,35);}
  } else if(type==='arcane_surge'){
    const selfDmg=15;
    G.hp=Math.max(1,G.hp-selfDmg);
    const dmg=Math.round(Math.max(6,G.mag*2.0+r(16)));
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    G._mSkillUses=(G._mSkillUses||0)+1;
    clog(`🌀 Surto Arcano: ${dmg} dano massivo! (Custou ${selfDmg} HP)!`,'lc');floatDmg('🌀'+dmg,'#8e44ad',55,33);floatDmg('-'+selfDmg+'❤️','#e74c3c',35,55);
    screenShake();spawnParticles(12,'#8e44ad');upd();
  // ═══ BÁRBARO ═══
  } else if(type==='frenzy'){
    const lowHp=G.hp/G.hpMax<.35;
    const hits=lowHp?3:2;
    let total=0;
    for(let i=0;i<hits;i++){
      const dmg=Math.round(Math.max(1,G.atk*(lowHp?1.4:1.1)+r(8)-Math.floor(CE.def*.2)));
      CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;total+=dmg;
    }
    G._mSkillUses=(G._mSkillUses||0)+1;
    clog(`🪓 Frenesi: ${hits} golpes! ${total} dano total${lowHp?' (FÚRIA MÁXIMA!)':''}!`,'lc');floatDmg('🪓×'+hits+' '+total,'#e74c3c',55,35);
    if(lowHp){screenShake();spawnParticles(10,'#e74c3c');}
  } else if(type==='wild_roar'){
    CE._roaredTurns=3;CE._roaredAtk=(CE._roaredAtk||0)+4;CE.atk=Math.max(1,CE.atk-4);
    G._mSkillUses=(G._mSkillUses||0)+1;
    clog(`😤 Rugido Selvagem! Inimigo perdeu 4 ATK por 3 turnos!`,'lc');floatDmg('😤-4ATK','#e74c3c',45,30);
    updateCombatUI();return;
  // ═══ ASSASSINO (classe) ═══
  } else if(type==='shadow_strike'){
    const isFirst=!(G._shadowUsed||false);
    const mult=isFirst?3.0:2.0;
    G._shadowUsed=true;
    const dmg=Math.round(Math.max(1,G.atk*mult+r(10)-Math.floor(CE.def*.15)));
    CE.hpCur=Math.max(0,CE.hpCur-dmg);G.totalDmg+=dmg;
    G._mSkillUses=(G._mSkillUses||0)+1;
    if(isFirst){clog(`🌑 GOLPE DAS SOMBRAS — PRIMEIRO ATAQUE: ${dmg} dano devastador!`,'lc');floatDmg('🌑×3 '+dmg,'#9b59b6',55,33);screenShake();}
    else{clog(`🌑 Golpe das Sombras: ${dmg} dano (x2)!`,'lc');floatDmg('🌑×2 '+dmg,'#9b59b6',55,35);}
  } else if(type==='toxic_mist'){
    const pdmg=Math.max(4,Math.round(G.atk*.35+G.mag*.2));
    applyStatus(CE,'poison',3,pdmg);
    CE._foggedTurns=3;
    G._mSkillUses=(G._mSkillUses||0)+1;
    clog(`☠️ Névoa Tóxica! Veneno ${pdmg}/turno + precisão reduzida por 3 turnos!`,'lc');floatDmg('☠️','#8e44ad',50,35);
    spawnParticles(10,'#8e44ad');
  }
  updateCombatUI();
}

function enemyTurn(){
  if(!CE)return;

  // ── 1. Warcry / buffs decay ──
  if(G.warcryTurns>0){G.warcryTurns--;if(G.warcryTurns===0){G.atk-=6;clog('📯 Grito de Guerra expirou.','li');}}
  if(G._divineShieldTurns>0&&!G.divineShield){G._divineShieldTurns--;if(G._divineShieldTurns===0){G.def-=4;clog('🛡️ Bônus de DEF do Escudo Divino expirou.','li');}}
  if(CE._markedTurns>0){CE._markedTurns--;if(CE._markedTurns===0){CE._marked=false;clog('🎯 Marca da Presa expirou.','li');}}
  if(CE._roaredTurns>0){CE._roaredTurns--;if(CE._roaredTurns===0){CE.atk+=CE._roaredAtk||4;CE._roaredAtk=0;clog('😤 Rugido Selvagem expirou. Inimigo recuperou ATK.','li');}}

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

  // ── 9. Escudo Divino — bloqueia ataque ──
  if(G.divineShield){
    G.divineShield=false;
    clog('🛡️ Escudo Divino bloqueou o ataque de '+CE.name+'!','ls');
    floatDmg('🛡️ BLOQUEADO','#f1c40f',40,40);
    sfx('block');
    updateCombatUI();
    // Ainda decai o turno do escudo
    if(G._divineShieldTurns!==undefined){G._divineShieldTurns--;if(G._divineShieldTurns<=0){G.def-=4;clog('🛡️ Bônus de DEF do Escudo Divino expirou.','li');}}
    return;
  }
  // Névoa tóxica — reduz precisão do inimigo
  if(CE._foggedTurns&&CE._foggedTurns>0){
    CE._foggedTurns--;
    if(Math.random()<.30){clog(CE.name+' errou o ataque por causa da névoa!','ls');updateCombatUI();return;}
  }
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
  const turnRegen = G.cls.id==='mage'?6 : G.cls.id==='sorcerer'?7 : G.cls.id==='druid'?5 : G.cls.id==='rogue'||G.cls.id==='assassin_cls'?3 : G.cls.id==='barbarian'?1 : 2;
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
  if(CE) tomoRecordKill(CE); // Tomo: registra inimigo morto
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
          html+=`<div onclick="setActiveElement('${el.id}')" style="border:1px solid ${active?tierColors[tier]:'var(--brd2)'};border-radius:8px;padding:10px 6px;background:${active?'rgba(255,255,255,.06)':'rgba(255,255,255,.02)'};text-align:center;cursor:pointer;transition:.2s;">
            <div style="font-size:22px;">${el.ico}</div>
            <div style="font-family:var(--cinzel);font-size:9px;color:${active?tierColors[tier]:'var(--txt2)'};margin-top:4px;">${el.name}</div>
          </div>`;
        });
        html+=`</div>`;
      });
      // Fusões disponíveis para aprender (não em combate)
      const availFusions=getAvailFusions(true);
      if(availFusions.length){
        html+=`<div style="font-family:var(--cinzel);font-size:9px;color:var(--gold);letter-spacing:2px;margin:14px 0 8px;padding-top:10px;border-top:1px solid var(--brd);">⚗️ FUSÕES PRONTAS</div>`;
        availFusions.forEach(f=>{
          const el1=ELEMENTS.find(e=>e.id===f.e1);const el2=ELEMENTS.find(e=>e.id===f.e2);
          html+=`<div onclick="fuseElements('${f.id}')" style="border:1px solid rgba(200,168,75,.3);border-radius:8px;padding:11px;background:rgba(200,168,75,.04);cursor:pointer;margin-bottom:6px;transition:.2s;">
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
      <button onclick="openCheatMenu()" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:5px 14px;font-family:var(--cinzel);font-size:9px;color:rgba(255,255,255,.4);letter-spacing:2px;cursor:pointer;transition:.2s;" onmouseover="this.style.color='rgba(255,255,255,.7)'" onmouseout="this.style.color='rgba(255,255,255,.4)'">⚙ debug</button>
    </div>`;
  sc.appendChild(card);scrollBot(sc);
}

/* ═══ CHEAT MENU ═══ */
function openCheatMenu(){
  const existing=$('cheat-overlay');if(existing)existing.remove();
  const ov=document.createElement('div');ov.id='cheat-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9500;display:flex;align-items:flex-end;padding:12px;';
  const allItems=[...ITEMS_POOL];
  const allElements=[...ELEMENTS,...getAllFusions()];
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
  const all=[...ELEMENTS,...getAllFusions()];
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
  tomoRecordFusion(f); // Tomo: registra fusão usada
  // Fusão destrutiva: consome os dois elementos originais
  G.elements = G.elements.filter(e=>e.id!==f.e1 && e.id!==f.e2);
  if(G.activeElement && (G.activeElement.id===f.e1 || G.activeElement.id===f.e2)) G.activeElement=G.elements[0]||null;
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
  const clsId=G?.cls?.id||null;
  const classPool=ITEMS_POOL.filter(i=>!i.cls||i.cls===clsId);
  let pool;
  if(mode==='common')pool=classPool.filter(i=>i.rarity==='common');
  else if(mode==='rare+')pool=classPool.filter(i=>['rare','epic','legendary'].includes(i.rarity));
  else{
    const w={common:.5,rare:.32,epic:.14,legendary:.04};
    const rn=Math.random();let cum=0,chosen='common';
    for(const[k,v] of Object.entries(w)){cum+=v;if(rn<cum){chosen=k;break;}}
    pool=classPool.filter(i=>i.rarity===chosen);
  }
  if(!pool||!pool.length)pool=classPool.length?classPool:ITEMS_POOL;
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
  // Tomo: registra causa da morte
  {
    let causeType='combat', causeLabel='Morte em Combate';
    if(msg.toLowerCase().includes('veneno')||msg.toLowerCase().includes('poison')){ causeType='poison'; causeLabel='Morte por Veneno'; }
    else if(msg.toLowerCase().includes('boss')||msg.toLowerCase().includes('chefe')){ causeType='boss'; causeLabel='Morte por Chefe'; }
    else if(msg.toLowerCase().includes('evento')||msg.toLowerCase().includes('maldição')||msg.toLowerCase().includes('baú')){ causeType='event'; causeLabel='Morte em Evento'; }
    else if(msg.toLowerCase().includes('explosão')||msg.toLowerCase().includes('goblin')){ causeType='explosion'; causeLabel='Morte por Explosão'; }
    tomoRecordDeath(causeType, causeLabel);
  }
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
  tartaro:   { label:'Tártaro',     desc:'Pedra negra & chamas violeta — reino de Hades' },
  nifleheim: { label:'Nifleheim',   desc:'Gelo eterno & névoa azul — reino de Hel' },
  duat:      { label:'Duat',        desc:'Areia dourada & lapislázuli — reino de Anúbis' },
  diyu:      { label:'Diyu',        desc:'Vermelho imperial & jade — reino de Yanluo Wang' },
  yomi:      { label:'Yomi',        desc:'Roxo sombrio & cerejeira — reino de Izanami' },
  naraka:    { label:'Naraka',      desc:'Turquesa sagrada & ouro — reino de Yama' },
};

let _currentTheme = localStorage.getItem('cronista_theme') || 'tartaro';
let _is16Bit = localStorage.getItem('cronista_16bit') === '1';

function applyTheme(id) {
  _currentTheme = id;
  localStorage.setItem('cronista_theme', id);
  const root = document.documentElement;
  Object.keys(THEMES).forEach(t => root.removeAttribute('data-theme'));
  root.setAttribute('data-theme', id);
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