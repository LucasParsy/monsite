---
title: Flag Quest Writeup
feed: show
permalink: /flag_quest_writeup
date: 26-11-2025
summary: By reading this writeup, you cheated not only the game but yourself.
---
### writeup

Hi today I will write about a cool video game challenge focused on memory hacking and using features of the CheatEngine (abbreviated **CE** from now on) tool, that I found interesting... Not saying that because I created it 😜

More than giving a basic simple solve, I'll try to delve in the more advanced features of Cheat Engine in order to create a cool, complete and modular hack, with a GUI. Some parts will go pretty in-depth, don't hesitate skipping some parts if you only want an hackish "works only once" solve.
So let's start the game!

*Note: this writeup assumes you have a basic understanding of the Cheat Engine tool. I recommend having watched my talk on the subject before!


![[fqw_gui.png|Graphic design is my passion]]

### level 1 part 1:  get rich quick

we start the game with a little platformer sequence.
After 2 levels, we are interrupted by the antagonist of the game that asks us to recover 250 coins or more. Problem: there aren't as many coins in the level!

![[fqw_coins11.png|I'm rich!]]

#### basic memory patching

| relevant resources                                                                | author          | type  |
| --------------------------------------------------------------------------------- | --------------- | ----- |
| [Part 1, introduction to scan types](https://www.youtube.com/watch?v=hgrIKUR5Hww) | Stephen Chapman | video |

So how to get more coins? Simple, we start Cheat Engine. search for the coin value in memory, and change it! 
Cheat Engine will search in all the memory of the program the value we are looking for, and save the list of addresses that match. When the value change, we tell cheat engine to search in this list the address that now have the updated value, and process by elimination.

But images speak a thousand words:

![[fqw_coins_explain.png]]
Notice we found 4 values that are identical. Only one (the last one) is the "true" value, that we have to modifiy, the 3 other ones are "reflected" values that change with the "true" one. 
As far as we are concerned for this quick hack, we can change the 4 values, but for the next part we will only use the "true" memory address.

#### making a persistent hack with autoAssembly

| relevant resource                                                                                                        | author          | type    |
| ------------------------------------------------------------------------------------------------------------------------ | --------------- | ------- |
| [Part 8: Memory Viewer, Writes To/Accesses An Address, Debugger, Etc.](https://youtu.be/-RiDP_6t1IE?si=ALbGJgzFThSqbDqi) | Stephen Chapman | video   |
| [Part 9: Array of Byte (AOB) Scans Demystified!](https://www.youtube.com/watch?v=2TYAd3l2mkY)                            |                 |         |
| [Code Injection: Full](https://wiki.cheatengine.org/index.php?title=Tutorials:Auto_Assembler:Injection_full)             | CE Wiki         | article |

Now let's go beyond the assignement, and create a persistent hack.
Indeed, previously we only found a memory address, that is not persistent. When you relaunch the game, or even restart the level, this address will change!

So we will directly find the code instruction that writes to this memory address and patch it with custom code. As the code address never changes (except on game updates), we will have a persistent hack. Cheat Engine has multiple features that makes it easy to do this patch:
- the "find out what writes to this address" option
- Autoassemby and its templates

> [!info] note
> We could use [pointer scanning](https://youtu.be/rBe8Atevd-4?si=AMl0kbDjVkTu94CS) to achieve a similar result more easily. However I had some issues with this method, auto assembly is more consistent in addition of being more modular.

again the process described visually:

![[fqw_create_aa_script.png]]
To summarize:
- the "find out what writes to this address" option on our coin address.
	- This attaches a debugger on the process
- We get a coin in the game to trigger this breakpoint
- We see that the `mov [rdi+08], rax` instruction is triggered
	- If we attached a manual breakpoint on this instruction, we could see that `rax` value is the coin count
- We use the AutoAssembler feature with it's AOB injection template that will automagically:
	- Allocate some memory where we can write any code we want.
	- Replace the original instruction (and some surrounding) in the game's memory with a jump to this new controlled memory addr.
	- in our new custom code, write a template with the original instruction(s) and add a jump back to the original next instruction, to keep the control flow/ the game running.
	- Add a "disable" section in the custom script, that automatically de-allocate the cheat memory, repatch the game with it's original code, thus removing any trace of the cheat. And you can disable a script just by pressing a button in the Cheat Engine UI.

here an annotated version of the generated script:
```c
[ENABLE] // code executed at hack launch

// find the addr of the original instruction 
aobscanmodule(INJECT,flag_quest.exe,48 89 47 08 48 8B 5C 24 40) // should be unique
// allocate memory where we put our new code
alloc(newmem,$1000,INJECT)

label(code)
label(return)

// hack code here
newmem:

code:
  // your new code here
  // add rax, 2
  // original instructions replica
  mov [rdi+08],rax
  mov rbx,[rsp+40]
  // go back to game next instruction
  jmp return

// at original addr of instruction, 
// jump to our code
INJECT:
  jmp newmem
  nop 4
return:
registersymbol(INJECT)

[DISABLE] // code executed at hack stop

// put back original instructions 
// at the original game memory addr
INJECT: 
  db 48 89 47 08 48 8B 5C 24 40

// deallocate all cheat memory
unregistersymbol(INJECT)
dealloc(newmem)
```

##### AOB injection bonus

| relevant resource                                                                    | author | type    |
| ------------------------------------------------------------------------------------ | ------ | ------- |
| [Auto Assembler - AOBs](https://wiki.cheatengine.org/index.php?title=Tutorials:AOBs) | Wiki   | Article |

I didn't introduce you to the classic "Code injection"  template. It is simpler but has one flaw:
it patches a static game code address, that will change at *any* game update, if a single unrelated feature is modified.

```c
// hardcoded address, breaks at any update
define(address,"flag_quest.exe"+231F0B1)
...
address:
  jmp newmem
```

With The "AOB injection"  template , CE will search the signature of the instruction in the game memory, to find dynamically it's address.
When the game is updated, as long as the "coin update" code is unmodified, the cheat will keep working.

```c
// dynamic address, found at cheat launch
aobscanmodule(INJECT,flag_quest.exe,48 89 47 08 48 8B 5C 24 40) // should be unique
alloc(newmem,$1000,INJECT)
...
INJECT:
  jmp newmem
```

notice the *should be* unique: there could be multiple similar instructions. In this case you will encounter bugs, and the fix is finding a more unique signature.
The signature being the instructions you are patching, and the ones surrounding them before and after. You can go in the memory viewer and copy a few more surrounding bytes to get a longer and more unique signature. 

##### writing our custom instructions

| relevant resource                                                                                                                                          | author                               | type           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------- |
| [User set variables which only exist in cheat engine.](https://www.reddit.com/r/cheatengine/comments/rbcg7n/user_set_variables_which_only_exist_in_cheat/) | EllesarDragon &<br>FrechetDerivative | Reddit article |

So the Cheat Engine template gives us code that... does nothing. For now!
But now we can place our custom code (as long as we know some assembler basics, sorry 😢)

We know that the `mov [rdi+08], rax` puts the value of `rax` inside the memory address of the coin counter (it will be read by other instructions)
So we only have to put a big value in `rax`, like 9999.
in asm it's as simple as: 
```c
code:
    // your custom code
    mov rax, #9999
    // rest of instructions
    mov [rdi+08],rax
	...
```

but it's not enough for us. We don't want a simple infinite coins cheat. Maybe the game is fun, but we find it too hard to grind for coins, so we would like to create an adjustable difficulty setting, where we could make picking up a coin give us two more. or 5, or 10.

So to make a dynamic hack... we can just allocate a variable! let's create the `coinsMultiplier` one.

Here is how we patch our cheat code:
```c
[ENABLE]
alloc(coinsMultiplier ,2, "flag_quest.exe"+231F0B1)
registerSymbol(coinsMultiplier)
... // other allocations

coinsMultiplier:
  dw 1 // set value to 1 by default
...
code:
  add rax, [coinsMultiplier]
  sub rax, 1 // add (multiplier - 1)
  // rest of instructions
  mov [rdi+08],rax
  ...
  
[DISABLE]
unregisterSymbol(coinsMultiplier)
dealloc(coinsMultiplier)
... // other deallocs + mem repatch
```

You can find the final Cheat script here: flagquest_level1_coins_multiplier.CEA #todo link

Once you created your script, you can save it in a custom file, and more importantly, add it to your main CE address list by clicking on "File" -> "Assign to current Cheat table".
There you will see it and be able to enable/disable it in one click on it's left checkbox.

So we created our variable `coinsMultiplier` , set it to 1 by default, and used it to add it's value to the coin counter each time we pick a coin.

But how do we set it's value? You can from any other Cheat Engine ASM or LUA script (we'll see later), but for now, we can set it in the CE interface.

Just go back to the CE main UI, click on "add address manually", and type the name of your variable. Now you will be able to change it like you changed your coin's value previously!

![[fqw_coinmultiplier_setting.png| adding the coin multiplier address in the UI]]
##### nothing is simple: bugs with shared instructions

| relevant resource                                                                  | author         | type  |
| ---------------------------------------------------------------------------------- | -------------- | ----- |
| [Cheat Engine Shared OpCode Tutorial](https://www.youtube.com/watch?v=Twj1cdG6DcE) | Guided hacking | Video |

OK, so i lied to you. Maybe you tried the code in the previous section and *maybe* it worked. But most probably it made your game crash, immediately or some time later.
Why? Simple: I don't know exactly what I coded, and  apparently the code for setting the coin counter is *used for setting other unrelated values* .

Of course, I don't know what I coded because I wrote it in an [interpreted language](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_basics.html), so the game engine does it's own funky stuff.  It's not because I'm a bad programmer! At least not here...

So how do you find the difference between one legitimate call to your coin setting code, and one that has nothing to do with it? We check the memory around each call to this instruction, and try to find unique patterns and hardcoded values inside. 
Who know, maybe when the coin method is called, `rbx+8 == 72` or in all other calls `rdi+24 == 1`? 
This sounds tedious, to put a debugger on the instruction, manually check all calls and their memory... Thankfully, Cheat Engine again to the rescue with 2 features: *F"ind out what addresses this instruction accesses* and *scan for commonalities*.

  Let's do this in a few clicks:
- in the disassembler view, right-click on the coin setting instruction  -> *Find out what addresses this instruction accesses* 
- You have lots of instructions listed, with their number of calls and their last value passed (here *rax*)
- All instructions listed here are false positive. pick a coin in the game, and you should find the call that we want to isolate. "count" should be "1" and "Value" your number of coins. (you can click on "count" to sort by ascending order)
- right click on the value -> "Find commonalities between addresses" -> "mark selection as group 1"
- If you have only a few values in the list, you can start the commonality scan. 
  Alas, here we have 500+ addresses, so only handpick 6 or more at random, and "Find commonalities ..." -> "mark selection as group 2"
- Start the scan with "Find commonalities ..." -> "scan for commonalities"
- If you are very lucky, you will get an output like "Register RAX: Group '2' has common value '0x42'", effectively meaning that you can do `if rax == 0: pass` 
- Else, it will propose to "launch structure compare", where you will be able to manually compare the values around *rax* , *rdi* or other registers to search for patterns.   

summarized with a screenshot:
![[fqw_scan_commonalities.png| searching for commonalities]]


> [!error] waring!
> Okay, super useful no? well, you know what? *I lied to you*. Ooops, I did it again.
This feature is super useful, but it has one flaw: it [doesn't work across game relaunches](https://forum.cheatengine.org/viewtopic.php?p=5794050#5794050). So values you may find "hardcoded" are indeed not all static.
 
 In the end, manual scanning is the most reliable way, even if tedious.
 manual way is:
 - putting a breakpoint on your coin-changing instruction
 - debug only when you know the correct instruction is called 
	 - conditional breakpoints can help you filter unwanted calls
- copy all values between *RDI-128* and *RDI+128* (arbitrary range)
- reboot the game and repeat 2 or 3 times
- compare all values ~~in paint~~ with a script you coded (or asked ChatGPT to do)

you can find [below the script I use to compare memory dumps and find common offsets](#commonalities_scanner_script).
example usage:

```bash
cat ./comm_test.txt
	80 F4 23 40 F6
	65 F4 8A 40 26
	68 F4 23 40 F6
python ./detect_commonalities_memory.py ./comm_test.txt 3
	-2 = F4
	0 = 40
```

![[fqw_manual_paint_analysis.png| this kind of hackish search never happened...]]

in the end, we found a unique pattern for our coin-setter script!
we can add these ASM conditions before our custom value-changing code:

```c
code: // if ([rdi+0x18] == [rdi+0x30] == [rdi+0x48] == 0x18)
  cmp [rdi+18], 18
  jne normal
  cmp [rdi+30], 18
  jne normal
  cmp [rdi+48], 18
  jne normal
custom: // your coin setting code
  add rax, [coinsMultiplier]
  sub rax, 1
normal: // normal code execution
  mov [rdi+08],rax
  mov rbx,[rsp+40]
  jmp return
```

Oof, that was a very long an in-depth dive in advanced CE features. Let's go back on an higher level 😀 (but i don't promise it won't happen again...)

You can again find the final Cheat script on my Github:  flagquest_level1_coins_multiplier.CEA #todo link
### level 1 part 2:  breaking the barriers

| relevant resources                                                                  | author         | type  |
| ----------------------------------------------------------------------------------- | -------------- | ----- |
| [How To Find Cheat Engine Coordinates](https://www.youtube.com/watch?v=Ym921qmVJ4s) | Guided hacking | video |
| [Value Types](https://www.youtube.com/watch?v=cJLbFh_74wg)                          | Guided hacking | video |
![[fqw_lev1_2_wall.png| intankable]]

After a little platforming challenge, we are again blocked by the vilainess, that puts a wall in the middle of the road. But what if we could teleport?

Solving it is simple, even if a bit long: as we did with the coins, the position of the character is a value in memory that we can find and change. Only problem, is that we don't know the exact position of our character.

Again, from the main page of Cheat Engine, we can launch a scan, but instead of searching for a known integer, we search "unknown initial value" and type "float" (positions are 99% floating points in video game)

We have a lot of values, so to filter, we have to move our character and find reflected changes in our scanned values.
We will try to find the "X" (horizontal) position of our character so:
- Move to the right -> "increased value"
- Move to the left  -> "decreased value"
- jump  -> "unchanged value"

do this 6 or 10 times, and in the end you should find a smaller list of values.
Then try to manually edit them (tip: you can select multiple to edit them in one go).
if your character teleported, well done, you found the correct address!

Now that we found the "X" value, do we have to repeat this for the "Y"?
let's be smart: values like the position are usually stored contiguously in memory, what if we could browse it and search our value?

Again there's a feature for that: right click on your found "X" value -> "browse this memory region"

You have a memory view in hexadecimal, not very readable, so right click -> "display type" -> "float" 
And tadaa! you have a readable hex view where you see your X position, and 4 bytes after, the Y one. You can't miss it, the values are live updated, and when they change, they blink! 

screenshot summary time:

![[fqw_lvl1_2_finding_position.png| finding position X and browsing memory for Y]]


now just change your X position to teleport beyond the wall!
#### autoassembly: getting the position address

We can repeat the steps of the first level to create a CE code but... Here we don't want to set an hardcoded value or create a multiplier. We could create hotkeys to teleport, but we'll see that  later...

For now, we can create a script that will store the address of the X and Y positions in variables.
They will be accessible from the CE interface, just like we did manually before, but this time persistent across game reboots.

First create an AutoAssembler script (refer to previous step, find correct instruction and check for commonalities)
When you create the script, you find that the instruction for setting the X value is `movsd [rdi+00000498],xmm1`. 
`xmm1` is the floating point value register. (float values are funky asm values, with their own set of registers and instructions to play with them)
So `[rdi+00000498]` is the memory address we want to store in our variable, let's name it `lev1Xaddr`.

here a very simplified version of our script:
(you can find the full one here: flagquest_level1_position.CEA #todo: link)
```c
[ENABLE]
// other variables allocs
alloc(lev1Xaddr ,8, address)
registerSymbol(lev1Xaddr)

lev1Xaddr:
  dq 0 // qword: 8 bytes

newmem:

code:
  // commonalities check here
custom:
  mov [lev1Xaddr], rdi
  add [lev1Xaddr], 498 // instruction offset
  mov [lev1Yaddr], rdi
  add [lev1Yaddr], 49C //498+4
end: //original instructions
  movsd [rdi+00000498],xmm1
  jmp return
```

Then to add the *lev1Xaddr* variable to your address list, click "Add Address Manually" as you did for the coin multiplier previously.
But here, check the "pointer" checkbox , and then set "lev1Xaddr" as the address and "x" as description.

![[fqw_lvl1_2_pointer.png|adding a pointer address]]

And now, if your "flagquest_level1_position" script is enabled, the variable should be automatically populated with the X position of the player when you launch the platformer sequence of the game!

### level 1 part 3:  no (code) filters

| relevant resources                                                                     | author          | type  |
| -------------------------------------------------------------------------------------- | --------------- | ----- |
| [How to Use Code Filter in Cheat Engine!](https://www.youtube.com/watch?v=HAFJmxI12Wo) | Stephen Chapman | video |

Ok, teleporting was fun, but now the villainess told us it won't work anymore...
Good news, we now have a double jump! Wait, we don't have it anymore, and now there's a huge impassable gap...

![[fqw_lvl1_2_jump_screen.png|a new gameplay mechanic]]

So we know there is a double jump mechanism, but it is disabled.
We can re-enable it temporarily by retrying the level. There must be a boolean variable "*isDoubleJumpActivated*",  but it must be quite tedious to find with the memory scan...

What we would like to do is find the instruction in the code that is checked when we try to double jump, and replace it to re-enable it. But that would mean we have to set thousands of breakpoints on all "if" conditions of the game. Impossible... but not for Cheat Engine!

The *Code Filter* functionality does exactly that, from GUI, allowing you to filter instructions just like we did with memory values.  

> [!info] note
> If you have an Intel CPU on your device, you can use the "Ultimap" feature that is equivalent, and supposedly more powerful. 

How it works:
- Go to "Memory Viewer" -> Tools -> "Code Filter"
- choose "Load Address list : From Disassembler" (I tried other methods with no good results)
- You can choose to scan in the executable or the libraries it loads. Now is guessing time, as the condition we look for is the "`asecret_player_movement_lib`" . Still it's not *so* secret, as it was given along the executable.
- Start the analysis, and filter the addresses by playing the game. 
	- If you didn't double jump -> "has not been executed"
	- if you double jumped -> "has been executed"
	- repeat until you have only 2 addesses, the second one (+42D8) is the correct one

when you click on the instruction, you see it in the memory viewer/disassembler:

```c
cmp [rdi+0000008D],r12b // if not isDoubleJumpActivated
je asecret_player_movement_lib.dll.text+42DD
	test eax,eax // dunno, lol
	jg asecret_player_movement_lib.dll.text+42DD
		cmp [rdi+0000008E],r12b // if numberOfJumps <= 2
		jne asecret_player_movement_lib.dll.text+42DD
			movaps xmm1,xmm7
			mov rcx,rdi
			call asecret_player_movement_lib.dll.text+3020 //double jump call
cmp [rdi+00000090],r12b
```
Indentation added manually, but CE is nice and shows little arrows indicating where jumps lead to.

We see that the instructions found by CE are quite simple: 3 conditions are checked , and then the double jump method is called.
ASM refresher: a condition is generally represented by 2 instructions, a comparison (`cmp`/`test`) and then a jump (`je`: `if ==`, `jg`: `>`, `jl`: `<`, `jne`: `!=`)

Here we can double click on all jmp instructions, and patch them with the padding `nop` instruction to unconditionally call the double jump method when the jump button is pressed, enabling infinite jump.

> [!info] note
> The Cheat Engine warns us that the instruction we put is smaller than the one we replace, and it will add `nop`'s to pad. No problem here, however *when the instruction is bigger* than the one we replace, CE will warn us too, but this time by overwriting the next instructions and generally crashing the program. That's where AutoAssembler scripts come handy. 

again, visual explanation:

![[fqw_lvl_1_2_code_filter.png|code filter steps]]

> [!info] note
> the code is inside a separate `asecret_player_movement_lib` DLL. Why?  First to make it easier to find for player. But secondly , as the game is coded in an interpreted language, it makes it way harder to find conditions with code filter. As I couldn't solve the challenge while testing myself, I recoded the player movement logic in C++. 
> What I didn't knew is that the library would be outside of the game binary, making it easy to find and even patch with Ghidra. 

#### autoassembly: creating an infinite jump script

This time the autoassembly script is... uninteresting.
It is literally what you already know to do, instruction patching, without variables or shared instructions.
Here is the complete code of the cheat.
As always, you can enable/disable it on the fly from the CE interface.

```c
define(address,"asecret_player_movement_lib.dll.text"+42BC)
define(bytes,44 38 A7 8D 00 00 00)

[ENABLE]
assert(address,bytes) // ensure game has not updated or alread patched

address:
  // jump directly to double jump call
  jmp asecret_player_movement_lib.dll.text+42D2 
  nop 2

[DISABLE]

address:
  db bytes // put back the original code on disable
```

### level 2:  gotta go fast

| relevant resources                                                                                                        | author            | type  |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----- |
| [LUA CE documentation](https://wiki.cheatengine.org/index.php?title=Lua)                                                  | Cheat Engine wiki | wiki  |
| [Lua Tutorial: How to Make an Auto-Clicker in Lua with Cheat Engine! (NSFW)](https://www.youtube.com/watch?v=OLX5VCoLsSQ) | Stephen Chapman   | video |

Here we have some exposition dialog, that is veeeeryyyyyy looooong... How can we speed it up?

![[fqw_lvl2_screen.png|its not plagiarism, its an hommage]]

> [!info] note
> kudos to the guy I met in CtF that stayed 50 minutes reading all the lore as he said "it was interesting" 

This time solution is extremely simple: on the main manu of Cheat Engine there is an "Enable Speedhack" checkbox. click on it, set speed to 50, and enjoy!

Watch out, as you spam "space", at the end there is a check "do you want me to repeat", that is by default set to "yes". We do like some tomfoolery here!
Also, if Speedhack does not work, relaunch the game and retry, it should work this time.

#### creating an autoclicker

Okay, this challenge was simple, but what if we made it simpler by overcomplicating it? 🤔
clicking by hand is tedious, why not create an Autoclicker!

Again Cheat Engine carries us, and keep calm, we won't code in ASM, but in LUA.
CE comes with a pretty solid [LUA interface](https://wiki.cheatengine.org/index.php?title=Lua) and you can directly code cheats with it.
[Speed Hack](https://wiki.cheatengine.org/index.php?title=Lua#Speed_Hack) , [input emulation](https://wiki.cheatengine.org/index.php?title=Lua#Input_devices), memory scanning and access, and interaction with AutoAssembly, you name it!

The cheat is made more complex by the bait at the end of the dialog: You have to press the "right" key to prevent the dialog from looping.
I couldn't find the instruction managing the text display. At first I wanted to scan the memory for the string "Do you want me to repeat", but it took too long.
My solution, even if not beautiful, works: we repeatedly spam the "right" key, every 0.1s and 1/10 time we input the "space" key instead. So we have 90% chance of the script working, lgtm ^^'

some code example in LUA for a cheat like this.

```lua
{$lua}
if syntaxcheck then return end
[ENABLE]

l2sh_counter = 0
l2sh_timer = createTimer(nil)

l2sh_timer.Enabled = false
l2sh_timer.Interval = 100 -- spam keys every 0.1s

function l2SH_loop(v_timer)
  if ((l2sh_counter == -1) or (l2sh_counter == 750)) then
     l2sh_timer.Enabled = false -- stop after 75s or manual interrupt
     speedhack_setSpeed(1)
     return
  end

  if (getForegroundWindow() ~= findWindow(null, "flag quest")) then
    return -- do not keypresses when game window is not focused 
  end

  if ((l2sh_counter % 10) == 0) then
    doKeyPress(VK_SPACE) -- 1/10 sace keypress
  else
      doKeyPress(VK_RIGHT)
  end
  l2sh_counter = l2sh_counter + 1
end

l2sh_timer.OnTimer = l2SH_loop -- put this AFTER method definition
speedhack_setSpeed(500)
l2sh_timer.Enabled = true

[DISABLE]
speedhack_setSpeed(1)
l2sh_timer.destroy() --important!
```

watch out, in LUA, to correctly stop / destroy your timer at the end.

You can find my full script that also handle manual interruption and adds an hotkey here: flagquest_level2_skipdialog.CEA #todo link

### level 3:  beyond the wall

| relevant resources                                                                                  | author              | type        |
| --------------------------------------------------------------------------------------------------- | ------------------- | ----------- |
| [Using 3D transforms](https://docs.godotengine.org/en/stable/tutorials/3d/using_transforms.html)    | Godot Gocs          | Wiki        |
| [Rotation converter](https://www.andre-gaschler.com/rotationconverter/)                             | Andre Gaschler      | online tool |
| [Quaternions and 3d rotation, explained interactively](https://www.youtube.com/watch?v=zjMuIxRvygQ) | <br>3Blue1Brown<br> | Video       |
| [Quaternions](https://www.youtube.com/watch?v=PMvIWws8WEo)                                          | Freya Holmer        | Video       |


![[fqw_lvl3_wall.png|whats behind the wall?]]

This time a "simple" challenge: the flag is behind the wall. But the game in in 2D? That's what you thought... but plot twist, it was 3D from the start!

> [!info] note
> It becomes 3D only starting from this level. 
> It's hard work making 3D levels...

We already made a teleport cheat, so here we follow the same principle, but with only one more axis.
We move left to right, find the X position, and look in the *Memory View* for the adjacent XYZ position. 
Let's keep it simple, and only change the Z axis, to move our camera beyond the wall. It was `15`, let's set it to `8`. And we get...

![[fqw_lvl3_troll.png|you gotta be kidding me...]]


> [!info] note
> If you set `z < 5` your character starts falling. I just forgot to extend the floor plane in the game. but then I told myself "whatever, it will be extra challenge for players".
> Now be creative on how to solve it, remove gravity, lock the character Y position, good luck!
> 


ok, so the flag can be only seen from a certain angle.
We just need to find the adjacent XYZ rota... wait a minute, what is this gibberish?

![[fqw_lvl3_positions.png|where rotation?]]

So we have the 3D position, but above we have a dozen of values, some that are between *-1* and *1*. And we try to set them to *180* or *360*, we have strange results?
Well everything is clearly explained by this diagram:

![[fqw_lvl3_quaternion.png|quaternion jumpscare]]

Indeed, the Godot engine uses the [Transform3D class](https://docs.godotengine.org/en/latest/classes/class_transform3d.html#class-transform3d) that 
> is a 3×4 matrix representing a transformation in 3D space. It contains a [Basis](https://docs.godotengine.org/en/latest/classes/class_basis.html#class-basis), which on its own can represent rotation, scale, and shear.

So instead of using normal degrees with Euler angles, we use radians, quaternions and rotation matrices. 
Look what you make me do here: A math lesson. Aaaaah!  

Go check the references I put at the top of this paragraph if you really want correct information by people that know what they are talking about.
Me, when I tried to solve my own chall , I just changed random values in memory until I found the correct combination.

If we are a bit more clever, we read Godot's documentation On Transform3D, and we see that we have a rotation matrix that is by default:

```
1 0 1
0 1 0
0 0 1
```

we find exactly this in memory.
Documentation also provides a constant, [Flip-Z](https://docs.godotengine.org/en/latest/classes/class_transform3d.html#class-transform3d-constant-flip-z) that is
```
 1  0  0
 0  0  0
 0  0 -1
```

and indeed, if we set the values in the memory viewer, we get the flag that is flipped!

But let's be even more clever, and use this [Rotation converter](https://www.andre-gaschler.com/rotationconverter/) , to convert a classic Euler angle of rotation X and Z of 180 (180,0,180). We get the matrix:

```
 -1  0  0
 0  0  0
 0  0 -1
```

and if we copy it, we get a part of the flag in the correct order. You just have to reduce your Z position, and you get the flag!

![[fqw_lvl3_flagpart.png|if you read this, youre almost there]]

#### advanced Autossembly scripting 

So what if we made a cool script that would rotate the camera and gradually reveal the flag? It will be a bit complicated, so let's use LUA.



If you expect more math for the rotation animation, I'm done. As I am the game creator, I cheated, i created the animation in the game editor, and copied the rotation matrix values to my cheat sorry😅.

#todo: finish this article with a deep dive on LUA scripting
### level 4:  final fight

A final fight that is surprisingly easy to get trough. You just need to use some of the tricks you learned in the previous levels.
So why not enjoy a bit of the gameplay? There are some cutscenes, different attack patterns, cool music, I'm certain the creator of the game spent quite some time on this level! 👀  

![[fqw_lvl4_game.png| you know how much time I spent coding this small scene?]]

In fact the game is really easy to solve, as it only relies on things you already did on previous steps.

The first part is dead simple: you have a damage multiplier, you can increase its value by getting some powerups. Find this value in memory and change it to "10000"

Second part is trickier:
You are one-shot by the boss, levels are completely unfair, and you don't know the boss health value.

We will search for the value of the boss HP. We search for an unknown value (but over "9000", as we know the boss is beefy) 

We attack, and the game tells us how much damage we give to the boss.
Very fast (there is maybe a 2s timing, but you can pause the game), we search for a value that decrease by the attack number. We normally find only 1 value. 

we right-click -> "find out what accesses this adress". We find:

```c
cmp [rcx + 08], rax
```

Several solutions exist: we can 
- NOP or modify it.
 - put the debugger on the instruction,  set `[rcx + 08]` to 0
	 -  or set RAX to `[rcx + 08]`.

By debugging, we understand that this instruction corresponds to "BossHP == 0". If this instruction is true, we win the fight, and the challenge is over.

### Bonus stage: creating a GUI

Now that we have scripted all our hacks, why not gather them in a nice and fancy GUI?
That way we can share our hack with people that won't need to understand how Cheat Engine works, even not needing to install Cheat Engine!

#todo Starting from here, the writeup in incomplete, I have to finish it and I was in a hurry, sorry ^^'
#### LUA footguns

#### creating a GUI

### After-credit sequence: hints on the achievements


### commonalities scanner script

#todo: put on Github
```python
import sys

def read_hex_file(filename):
    try:
        with open(filename, 'r') as file:
            lines = [line.strip().split() for line in file.readlines()]
        return lines
    except FileNotFoundError:
        print(f"Error: File '{filename}' not found.")
        sys.exit(1)

def validate_lines(lines):
    line_length = len(lines[0])
    for line in lines:
        if len(line) != line_length:
            print("Error: Lines in the file have different sizes.")
            sys.exit(1)

def compare_memory(lines, offset, value_size):
    for i in range(0, len(lines[0])):
        column = [line[i] for line in lines]
        if all(byte == column[0] for byte in column):
            relative_position = (i*value_size) - offset
            print(f"{relative_position} = {column[0]}")

def main():
    if len(sys.argv) < 3:
        print("Usage: python detect_commonalities_memory.py <filename> <offset> (value_size=1)")
        sys.exit(1)

    value_size = 1
    filename = sys.argv[1]
    try:
        offset = int(sys.argv[2], 16)
        if len(sys.argv) == 4:
            value_size = int(sys.argv[3])
    except ValueError:
        print("Error: Offset must be a valid hexadecimal number. and value_size a decimal one.")
        sys.exit(1)


    lines = read_hex_file(filename)
    validate_lines(lines)
    compare_memory(lines, offset, value_size)

if __name__ == "__main__":
    main()
```