/* Curated competitive layer. Edit freely each patch.
   id        = Riot Data Dragon champion id (e.g. "MonkeyKing" for Wukong)
   maxOrder  = primary > secondary > tertiary basic ability
   keys      = "Key Punish Spells": the 1-2 spells that define the lane
   overrides = { R: [120,100,80] } replaces Data Dragon cooldowns for a slot
   tags: danger | punish | pressure | escape                                     */
(function () {
  'use strict';
  var C = (window.LCT_CHAMPS = {});
  function K(slot, tag, tip) { return { slot: slot, tag: tag, tip: tip }; }
  function add(id, roles, order, aliases, keys, extra) {
    C[id] = { id: id, roles: roles, maxOrder: order, aliases: aliases || [], keys: keys, overrides: {}, notes: '' };
    if (extra) { for (var k in extra) C[id][k] = extra[k]; }
  }

  /* ---------------- MIDLANE (flagship) ---------------- */
  add('Ahri', ['MIDDLE'], 'QWE', [], [
    K('E', 'danger', 'Charm is her only reliable catch. Dodge it, or punish the long cooldown after it is used.'),
    K('R', 'escape', 'Her escape and burst reset. With R down she is easy to punish and gank.')]);
  add('Syndra', ['MIDDLE'], 'QWE', ['syn'], [
    K('E', 'danger', 'Stun is her main defense. Once E is down, walk up and trade.'),
    K('Q', 'pressure', 'Low-cooldown poke. Track Q to know when she cannot zone you.')]);
  add('Sylas', ['MIDDLE'], 'QWE', [], [
    K('E', 'danger', 'Chain pull is his engage and escape. With E down he cannot safely all-in.'),
    K('W', 'pressure', 'His heal and damage in trades. Respect it when it is up.')]);
  add('Yone', ['MIDDLE', 'TOP'], 'QWE', [], [
    K('Q', 'punish', 'Third Q knocks up. Track his Q stacks and trade when Q is on cooldown.'),
    K('W', 'pressure', 'His shield makes trades strong. Trade when W is on cooldown.')]);
  add('Viktor', ['MIDDLE'], 'EQW', ['vik'], [
    K('E', 'danger', 'His main poke and wave clear. Step up when E is down.'),
    K('Q', 'pressure', 'Q shield powers his trades. Trade when it is on cooldown.')]);
  add('Zed', ['MIDDLE'], 'QEW', [], [
    K('W', 'punish', 'Without W he has no clean engage or escape. Step up and trade.'),
    K('R', 'danger', 'His kill threat from level 6. Long cooldown, so play freely after it.')]);
  add('Akali', ['MIDDLE', 'TOP'], 'QEW', ['kali'], [
    K('W', 'danger', 'Shroud is her escape and her invisibility. Without W she is easy to trade into.'),
    K('R', 'escape', 'Her dash combo. When R is down she is exposed.')]);
  add('Orianna', ['MIDDLE'], 'QWE', ['ori'], [
    K('Q', 'pressure', 'Ball poke and mobility. Play on the side away from the ball.'),
    K('E', 'punish', 'Shield protects her in trades. Punish when it is down.')]);
  add('Azir', ['MIDDLE'], 'QWE', [], [
    K('E', 'danger', 'Shield dash is his engage and escape. Without E he cannot commit safely.'),
    K('Q', 'pressure', 'His main poke and zone control.')]);
  add('Katarina', ['MIDDLE'], 'QEW', ['kata'], [
    K('E', 'punish', 'Her blink. Without E she cannot engage safely.'),
    K('R', 'danger', 'Channeled burst. Interrupt it with CC; long cooldown.')]);
  add('Leblanc', ['MIDDLE'], 'QWE', ['lb', 'leb'], [
    K('W', 'punish', 'Her main engage and escape. With W down she is easy to punish.'),
    K('E', 'danger', 'Chain root. Dodge it, then punish.')]);
  add('Fizz', ['MIDDLE'], 'EQW', [], [
    K('E', 'danger', 'His dodge and engage. Trade after he uses it.'),
    K('R', 'danger', 'Long cooldown shark. Sidestep it and play freely afterwards.')]);
  add('Talon', ['MIDDLE', 'JUNGLE'], 'WQE', [], [
    K('E', 'punish', 'Wall-hop gap closer. Without E he is much weaker.'),
    K('W', 'pressure', 'Slows and poke. Track it before you trade.')]);
  add('Vex', ['MIDDLE'], 'QEW', [], [
    K('W', 'punish', 'Her shield is key to her trades. Punish when it is down.'),
    K('R', 'danger', 'Long range execute-style burst. Track it from level 6.')]);
  add('Lux', ['MIDDLE', 'UTILITY'], 'EQW', [], [
    K('Q', 'danger', 'Root is her only catch. Dodge it and punish.'),
    K('E', 'pressure', 'Slow and poke. Track it for safe approach windows.')]);
  add('Veigar', ['MIDDLE'], 'QWE', [], [
    K('E', 'danger', 'Cage is his only CC. Leave the ring before it forms.'),
    K('Q', 'pressure', 'Stacking poke and wave clear.')]);
  add('Xerath', ['MIDDLE'], 'QWE', [], [
    K('E', 'danger', 'Long range stun. Dodge it and go in.'),
    K('Q', 'pressure', 'Long range poke. Track it to approach.')]);
  add('Ryze', ['MIDDLE', 'TOP'], 'QEW', [], [
    K('W', 'danger', 'Root enables his combo. When W is down he is easy to punish.'),
    K('Q', 'pressure', 'His main damage and stacking. Track it.')]);
  add('Kassadin', ['MIDDLE'], 'QEW', ['kass'], [
    K('Q', 'punish', 'Shield and silence set up his trades. Trade when Q is down.'),
    K('R', 'pressure', 'Blink with stacks. Track it for kill pressure.')]);
  add('TwistedFate', ['MIDDLE'], 'QWE', ['tf'], [
    K('W', 'danger', 'Gold card stun is his catch. Engage when W is down.'),
    K('Q', 'pressure', 'Poke and wave clear. Track it.')]);
  add('Malzahar', ['MIDDLE'], 'EQW', ['malz'], [
    K('Q', 'danger', 'Silence stops your abilities. It is the spell to track.'),
    K('E', 'pressure', 'Spreads on the wave. Track it for trades.')]);
  add('Galio', ['MIDDLE', 'UTILITY'], 'QWE', [], [
    K('W', 'danger', 'Taunt zone. Once W is down he cannot engage.'),
    K('Q', 'pressure', 'Poke and wave clear.')]);
  add('Cassiopeia', ['MIDDLE'], 'EQW', ['cass'], [
    K('R', 'danger', 'Her cone stun is her catch. Face away or dodge.'),
    K('Q', 'pressure', 'Her poke. Track it.')]);
  add('Anivia', ['MIDDLE'], 'EQW', ['ani'], [
    K('Q', 'danger', 'Stun is her main catch. Dodge it.'),
    K('E', 'pressure', 'Her damage. Track it to trade.')]);
  add('Yasuo', ['MIDDLE', 'TOP'], 'QEW', ['yas'], [
    K('W', 'punish', 'Wind Wall blocks projectiles. Trade after it is used.'),
    K('E', 'escape', 'His gap closer. Without a minion nearby he is stuck.')]);

  /* ---------------- TOP ---------------- */
  add('Aatrox', ['TOP'], 'QEW', [], [K('W', 'danger', 'Chain pull sets up his combo. Dodge it.'), K('E', 'escape', 'His dash. Without E he is easy to kite.')]);
  add('Camille', ['TOP'], 'QEW', [], [K('E', 'danger', 'Hookshot is her engage. Punish when E is down.'), K('Q', 'pressure', 'Empowered Q is her main trade tool.')]);
  add('Darius', ['TOP'], 'QEW', [], [K('E', 'danger', 'Pull ends your kiting. Dodge it or punish it.'), K('Q', 'pressure', 'Edge hits heal him. Avoid the edge.')]);
  add('Fiora', ['TOP'], 'QEW', [], [K('W', 'punish', 'Riposte blocks your CC. Bait it, then trade.'), K('Q', 'pressure', 'Her gap closer. Without Q she cannot reach you.')]);
  add('Gwen', ['TOP'], 'QEW', [], [K('W', 'danger', 'Mist makes her untargetable to spells. Wait for it to end.'), K('E', 'pressure', 'Her dash and attack speed.')]);
  add('Jax', ['TOP'], 'WQE', [], [K('E', 'punish', 'Counter Strike blocks autos. Trade after it is used.'), K('Q', 'pressure', 'His gap closer. Without Q he cannot catch you.')]);
  add('Irelia', ['TOP', 'MIDDLE'], 'QWE', [], [K('E', 'danger', 'Her stun is her catch. Dodge it.'), K('Q', 'pressure', 'Resets on kill. Track it.')]);
  add('Malphite', ['TOP'], 'QEW', ['malph'], [K('Q', 'pressure', 'Slow and poke. Track it.'), K('R', 'danger', 'Long cooldown engage. Play freely after it.')]);
  add('Mordekaiser', ['TOP'], 'QEW', ['mord', 'morde'], [K('E', 'danger', 'Pull is his catch. Dodge it.'), K('Q', 'pressure', 'Empowered third Q is his main burst.')]);
  add('Renekton', ['TOP'], 'QWE', ['renek'], [K('W', 'danger', 'Empowered stun is his engage. Punish when W is down.'), K('E', 'escape', 'His dash. Without E he cannot reach you.')]);
  add('Riven', ['TOP'], 'QEW', [], [K('E', 'punish', 'Her shield and dash. Trade when E is down.'), K('W', 'danger', 'Her stun. Dodge it.')]);
  add('Sett', ['TOP'], 'QWE', [], [K('E', 'danger', 'Pull and stun. Dodge it or play away from walls.'), K('W', 'pressure', 'Needs grit stored to hit hard. Avoid feeding it.')]);

  /* ---------------- JUNGLE ---------------- */
  add('LeeSin', ['JUNGLE'], 'QEW', ['lee'], [K('Q', 'danger', 'Sonic Wave sets up his engage. Dodge it.'), K('R', 'danger', 'Kick has a long cooldown. Play freely afterwards.')]);
  add('Vi', ['JUNGLE'], 'QEW', [], [K('Q', 'danger', 'Charged gap closer. Dodge it.'), K('R', 'danger', 'Her lockdown. Long cooldown.')]);
  add('JarvanIV', ['JUNGLE'], 'QEW', ['j4'], [K('Q', 'danger', 'Drag Strike starts his combo.'), K('E', 'pressure', 'Standard of the combo. Track it.')]);
  add('Graves', ['JUNGLE'], 'QEW', [], [K('E', 'pressure', 'His dash. Track it for safe approaches.'), K('W', 'danger', 'Smoke blinds. Avoid it.')]);
  add('Khazix', ['JUNGLE'], 'QWE', ['kha'], [K('E', 'danger', 'His leap. Track it for his gank range.'), K('R', 'escape', 'Stealth lets him disengage or reposition.')]);
  add('Elise', ['JUNGLE'], 'QWE', [], [K('E', 'danger', 'Cocoon is her catch. Dodge it.'), K('R', 'pressure', 'Form switch. Track her cooldown by form.')], { notes: 'Two forms: cooldowns shown are human form.' });
  add('Viego', ['JUNGLE'], 'QWE', [], [K('W', 'danger', 'Stun is his catch. Dodge or interrupt it.'), K('E', 'pressure', 'His camp hiding.')]);
  add('Hecarim', ['JUNGLE'], 'QEW', ['heca'], [K('E', 'danger', 'Momentum builds from E. Track it.'), K('R', 'danger', 'Fear and engage. Long cooldown.')]);
  add('Amumu', ['JUNGLE', 'UTILITY'], 'EWQ', [], [K('Q', 'danger', 'Bandage Toss is his engage. Dodge it.'), K('R', 'danger', 'Mass root. Spread out.')]);
  add('Sejuani', ['JUNGLE'], 'WEQ', ['sej'], [K('R', 'danger', 'Her stun. Long cooldown.'), K('Q', 'pressure', 'Gap closer. Track it.')]);
  add('Kayn', ['JUNGLE'], 'QWE', [], [K('W', 'danger', 'His knock-up. Dodge it.'), K('R', 'pressure', 'He becomes untargetable.')], { notes: 'Form dependent kit.' });
  add('Zac', ['JUNGLE'], 'EQW', [], [K('E', 'danger', 'Long range engage. Dodge it.'), K('R', 'danger', 'Knock-up zone. Long cooldown.')]);

  /* ---------------- BOTTOM / ADC ---------------- */
  add('Jinx', ['BOTTOM'], 'QWE', [], [K('W', 'danger', 'Zap slows and roots at range. Dodge it.'), K('E', 'danger', 'Chompers root you. Stay out of the trap.')]);
  add('Ezreal', ['BOTTOM'], 'QEW', ['ez'], [K('E', 'escape', 'His escape. Without E he is easy to dive.'), K('Q', 'pressure', 'Main poke. Track it.')]);
  add('Kaisa', ['BOTTOM'], 'QEW', ['kai'], [K('W', 'danger', 'Long range poke. Respect it.'), K('E', 'pressure', 'Her dash and speed.')]);
  add('Caitlyn', ['BOTTOM'], 'QWE', ['cait'], [K('E', 'danger', 'Net pulls and roots. Dodge it.'), K('W', 'pressure', 'Trap. Avoid stepping on it.')]);
  add('Jhin', ['BOTTOM'], 'QWE', [], [K('W', 'danger', 'Root at range. Dodge it.'), K('Q', 'pressure', 'Bounce poke.')]);
  add('Draven', ['BOTTOM'], 'QWE', [], [K('E', 'danger', 'Stun and knockback. Dodge it.'), K('Q', 'pressure', 'Axes drive his damage.')]);
  add('MissFortune', ['BOTTOM'], 'QWE', ['mf'], [K('E', 'pressure', 'Slow zone. Avoid it.'), K('R', 'danger', 'Channel burst.')]);
  add('Vayne', ['BOTTOM'], 'QWE', [], [K('E', 'danger', 'Condemn into wall. Avoid walls.'), K('Q', 'pressure', 'Her mobility and damage.')]);
  add('Lucian', ['BOTTOM'], 'QEW', ['luc'], [K('E', 'pressure', 'His dash. Track it for safe approaches.'), K('Q', 'pressure', 'Poke through minions.')]);
  add('Samira', ['BOTTOM'], 'QEW', [], [K('W', 'punish', 'Wind Wall. Trade after it is used.'), K('E', 'escape', 'Her dash and engage.')]);
  add('Ashe', ['BOTTOM', 'UTILITY'], 'WQE', [], [K('W', 'pressure', 'Slow poke.'), K('R', 'danger', 'Global arrow. Long cooldown.')]);
  add('Xayah', ['BOTTOM'], 'QEW', [], [K('W', 'danger', 'Attack speed and move speed. Respect it.'), K('R', 'escape', 'Her escape and zone.')]);

  /* ---------------- UTILITY / SUPPORT ---------------- */
  add('Thresh', ['UTILITY'], 'QEW', [], [K('Q', 'danger', 'Death Sentence is his catch. Dodge it.'), K('E', 'pressure', 'Flay pushes or pulls you.')]);
  add('Blitzcrank', ['UTILITY'], 'QEW', ['blitz'], [K('Q', 'danger', 'Rocket Grab is his only catch. Once it misses you have a window.'), K('R', 'pressure', 'Pulse burst. Track it.')]);
  add('Nautilus', ['UTILITY'], 'QWE', ['naut'], [K('Q', 'danger', 'Hook is his catch. Dodge it.'), K('R', 'danger', 'Long cooldown knock-up.')]);
  add('Leona', ['UTILITY'], 'WEQ', [], [K('E', 'danger', 'Zenith Blade is her engage. Dodge it.'), K('R', 'danger', 'Long cooldown stun.')]);
  add('Lulu', ['UTILITY'], 'EWQ', [], [K('W', 'danger', 'Polymorph turns you off. Track it.'), K('E', 'pressure', 'Shield and poke.')]);
  add('Nami', ['UTILITY'], 'WEQ', [], [K('Q', 'danger', 'Bubble is her catch. Dodge it.'), K('R', 'pressure', 'Wave stun.')]);
  add('Karma', ['UTILITY', 'MIDDLE'], 'QEW', [], [K('W', 'danger', 'Root is her catch. Dodge it.'), K('E', 'pressure', 'Shield and speed.')]);
  add('Morgana', ['UTILITY', 'MIDDLE'], 'QWE', ['morg'], [K('Q', 'danger', 'Dark Binding is her catch. Dodge it.'), K('E', 'punish', 'Black Shield blocks your CC. Trade after it is used.')]);
  add('Alistar', ['UTILITY'], 'QWE', ['ali'], [K('W', 'danger', 'Headbutt is his engage. Track it.'), K('Q', 'pressure', 'Pulverize.')]);
  add('Rakan', ['UTILITY'], 'WQE', [], [K('W', 'danger', 'Engage knock-up. Track it.'), K('R', 'pressure', 'Charm.')]);
  add('Pyke', ['UTILITY'], 'QEW', [], [K('Q', 'danger', 'Hook is his catch. Dodge it.'), K('E', 'pressure', 'Stun.')]);
  add('Janna', ['UTILITY'], 'WEQ', [], [K('Q', 'danger', 'Tornado knock-up. Dodge it.'), K('R', 'pressure', 'Disengage.')]);
  add('Braum', ['UTILITY'], 'WQE', [], [K('Q', 'pressure', 'Slow and stacks the passive.'), K('R', 'danger', 'Long cooldown stun.')]);
})();
