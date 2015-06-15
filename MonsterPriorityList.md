When Monster - Attack - Stop is set to Priority List, a text box appears.  This box takes a string of comma or return separated words or phrases, and searches against the list of monsters you have available to decide what order to attack them in.

## Step 1 -- Define the monster(s) you wish to make setting(s) for ##

You can define individual monsters by using your friends name or "your" for your own monsters. (NOT case sensitive.) Ex
> james,
> bob,
> your,
> stallion

Valid separators are line returns or commas.  For monsters of equal priority, a "|" character can also be used.  See Note 6 below.

One special divider is "levelup."  This can be used to separate normal priority list with special conditions you want used for when you are need to burn energy/stamina to level up.  For example:

dragon:max200k<br>
levelup<br>
dragon:max400k<br>

First, all terms before "levelup" are parsed, whether in level up mode or not.  Then if not in level up mode, no further commands are parsed.  If in level up mode, then all previous matches are forgotten, and it begins parsing from after the levelup command again.<br>
<br>
You can also define which type of monster you want to set parameters for, such as "legion" or "serpent." To see the default achievement damage level for your monster, hover your cursor over the picture of the monster on the dashboard, and the achievement level damage will appear as a tooltip.<br>
<br>
<h4>NOTES</h4>

1. All Monsters with a Fortify/Dispel/Defenses takes the total damage and total fortification into account towards your total damage on that monster. Example: If you have Skaar in achievement mode and you do 400k Dispel, you will only do 600k Damage. (1m total first pass for achievement<br>
<br>
2. Legion (Battle of the Dark Legion) works off total orcs killed. 1000 orcs is the achievement, not 1000k dmg.  Also, Legions ignore fortification for achievement or max, since total fortification is not displayed.<br>
<br>
3. facebook ids, urlix, and freshmeat have no use in battle monster order.<br>
<br>
4. To "attack them all" set "Priority List" then do not type anything into the box. Golem will attack each in order up to Achievement level. Then proceed to attack the first monster on your list with no limit.<br>
<br>
5. If multiple monsters match the same search term, such as when you have multiple serpents and the search term "serpents", then the script will pick which one to start with according to your attack setting.  For example, if you had Attack set to "Shortest ETD", then it would attack the serpent with the shortest ETD first.<br>
<br>
6. If you want multiple search terms to be sorted together, then you can use the "|" separator.  For example, if you have "serpent|dragon,legion", then the script will search for serpents or dragons first, and if it can't find any, then search for legions.<br>
<br>
<br>
<h2>Step 2 -- defining special conditions for your monster(s)</h2>

After defining the name or monster type, there are a set of commands to apply actions with these monsters (note that these are case sensitive)<br>
<br>
:ach500k - use 500,000 damage as the achievement level for a match against this word, instead of the default<br>
:max1m - after 1,000,000 damage against a match for this word, do not attack this monster any more<br>
:f%50 - override the control panel Fortify if Percentage Over setting with 50% for this monster<br>
:sec - Make secondary attacks against this monster like deflect or cripple even if the monster is over achievement or max damage<br>
:ac - automatically collect the rewards from this monster<br>
k = X1,000<br>
m = X1,000,000<br>
:minpa#:maxpa#<br>
:achpa#<br>

<h3>NOTES</h3>

1) Basically, the scripts has two limits per monster - first pass ("achievement mode": Orange colored in Monster dashboard) and then it makes a second pass ("max damage": Red colored in Monster dashboard).<br>
<br>
2) Once a match has been found for a specific monster, all other matches after that will be ignored for that monster.  If Dave has a red dragon, and your list has "dave:ach50k, dragon:max100k" the script will only use the achievement level of 50k and ignore the max, since it matched dave first.<br>
<br>
3) To ignore a specific monster use the player name or monster type plus :max0<br>
example, to ignore dave's ancient red dragon<br>
dave:max0         <-just dave's monsters ignored<br>
red dragon:max0   <-all red dragons ignored<br>
<br>
4) To ignore fortification on a monster :f%0<br>
<br>
5) If you have a problem with Asian/special characters you can 'trick' golem into attacking them last by setting the requirements for all other monsters.  Also, Asian/special characters can be copy/pasted into the golem Attack Order.<br>
<br>
6) With regards to PA attacks: a sort of hack for PA limits in the Priority List code. Use :achpa### and :maxpa### for those. Note that this really doesn't limit it to exact attacks, but does a guess, the same way Golem guesses how many PAs you had in the first place. It maps that into a achievement and max damage pair. I'd suggest if you want something like 50 PAs, use :minpa50:maxpa55 to ensure you are in the right ballpark. A good string of crit hits might lower the real count of hits you've done.<br>
<br>
Examples and functions<br>
<br>
stallion:max0<br>
dragon:max200k|serpent:max500k:ac<br>
legion:ach300:max500:f%0,<br>
azriel:ach2m:f%90:sec<br>
keira:minpa20:maxpa25<br>

Summary of above functions.<br>
<br>
<ul><li>Ignore stallion's monsters, regardless of type<br>
</li><li>Attack dragons or serpents next, first pass-standard achievement for each monster, and then stop at 200k for dragons and 500k for serpents after all achievement levels done.  Automatically collect rewards.<br>
</li><li>Attack Battle of the Dark Legion, first pass of new achievement amt 300 orcs (second pass max 500 orcs), and don't fortify ever<br>
</li><li>Attack Azriel, first pass of new achievement 2m (second pass unlimited max), and fortify if under 90%.  Always do secondary attacks like cripple or deflect even if over achivement.<br>
</li><li>Attack Keira around 20 to 25 times based on Golem's damage calculation</li></ul>

This page largely copied from guide from Stallion on Caap page!