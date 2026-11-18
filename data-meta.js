/* Curated "most common matchup" pools. Ordered most common -> least common.
   Hand-maintained (no free official pick-rate API). Edit any list to match the current patch.
   Brackets: all = everyone, low = Iron-Gold, mid = Plat-Emerald, high = Diamond+            */
(function () {
  'use strict';
  function build(all, fronts) {
    var out = { all: all.slice() };
    ['low', 'mid', 'high'].forEach(function (b) {
      var f = (fronts && fronts[b]) || [];
      out[b] = f.concat(all.filter(function (x) { return f.indexOf(x) < 0; }));
    });
    return out;
  }

  window.LCT_META = {
    patchLabel: 'Curated by hand, Nov 2026 (edit data-meta.js)',
    brackets: [
      { id: 'all', label: 'All ranks' },
      { id: 'low', label: 'Iron to Gold' },
      { id: 'mid', label: 'Plat to Emerald' },
      { id: 'high', label: 'Diamond+' }
    ],
    MIDDLE: build(
      ['Ahri', 'Syndra', 'Sylas', 'Yone', 'Viktor', 'Zed', 'Akali', 'Orianna', 'Azir', 'Katarina', 'Leblanc', 'Fizz', 'Talon', 'Vex', 'Lux', 'Veigar', 'Xerath', 'Ryze', 'Kassadin', 'TwistedFate', 'Malzahar', 'Galio', 'Cassiopeia', 'Anivia', 'Yasuo'],
      {
        low: ['Ahri', 'Yasuo', 'Zed', 'Lux', 'Katarina', 'Veigar', 'Malzahar', 'Xerath'],
        mid: ['Ahri', 'Syndra', 'Yone', 'Zed', 'Sylas', 'Akali', 'Viktor'],
        high: ['Syndra', 'Ahri', 'Azir', 'Orianna', 'Viktor', 'Sylas', 'Akali', 'Vex']
      }),
    TOP: build(['Aatrox', 'Camille', 'Darius', 'Fiora', 'Gwen', 'Jax', 'Irelia', 'Malphite', 'Mordekaiser', 'Renekton', 'Riven', 'Sett'],
      { low: ['Darius'], high: ['Camille', 'Jax', 'Aatrox'] }),
    JUNGLE: build(['LeeSin', 'Vi', 'JarvanIV', 'Graves', 'Khazix', 'Elise', 'Viego', 'Hecarim', 'Amumu', 'Sejuani', 'Kayn', 'Zac'],
      { low: ['Amumu', 'LeeSin', 'Viego'], high: ['Vi', 'JarvanIV', 'Sejuani'] }),
    BOTTOM: build(['Jinx', 'Ezreal', 'Kaisa', 'Caitlyn', 'Jhin', 'Draven', 'MissFortune', 'Vayne', 'Lucian', 'Samira', 'Ashe', 'Xayah'],
      { low: ['Jinx', 'Caitlyn', 'Ashe'], high: ['Kaisa', 'Ezreal', 'Lucian'] }),
    UTILITY: build(['Thresh', 'Blitzcrank', 'Nautilus', 'Leona', 'Lulu', 'Nami', 'Karma', 'Morgana', 'Alistar', 'Rakan', 'Pyke', 'Janna', 'Braum'],
      { low: ['Blitzcrank', 'Leona', 'Lulu'], high: ['Nautilus', 'Rakan', 'Alistar'] }),
    botDuos: [
      ['Jinx', 'Thresh'], ['Kaisa', 'Nautilus'], ['Ezreal', 'Karma'], ['Caitlyn', 'Lulu'],
      ['Jhin', 'Leona'], ['Vayne', 'Nami'], ['MissFortune', 'Blitzcrank'], ['Draven', 'Pyke']
    ]
  };
})();
