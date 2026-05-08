---
title: The quest Insomni'hack 2026 writeup
feed: show
permalink: /Insomihack26TheQuest
date: 01-02-2026
summary: Speed Gaming
---


A close friend, Phil, from the [Securimag](https://securimag.org/)/ [Grehack ](https://grehack.fr/)team, went to the 2026 edition of Insomni'hack and told me there was a Godot Video game challenge. A subject that [really interests me](/talk_vghacking), so I gave it a try ! 

> [!error] Waring
> This writeup may overlook some elements on how to navigate/use the Godot Engine. Screenshots will be provided, but I recommend following [tutorials](https://docs.godotengine.org/en/stable/getting_started/introduction/key_concepts_overview.html) to get the hang of it. 

### look, ma, I'm a game dev!

The challenge is a 2D Zelda-like video game where you have to activate switches guarded by seemingly impossible to avoid enemies. The game was to be solved IRL on an arcade cabinet, only with a joystick, so even if we were given the game binary for analysis, we had to solve the game without modifying it, only by abusing it's mechanics, Speedrun style.

There was also an NFC credit system that was part of the challenge, but not being there IRL I can't write about it (apparently you had to bruteforce an ID,  a flipper Zero could do the trick, I don't know anything about wireless attacks anyway)

We are given an ARM binary , `Inso26-TheQuest-Game.arm64` . I don't have any ARM computer, an don't want to setup a VM... But my friend mentioned that at game start the *Godot* game engine logo showed up! 

let's download the [gdre/gdsdecomp](https://github.com/GDRETools/gdsdecomp) Godot Decompiler tool and run it.

![[Inso26TheQuest_gdkre.png|full source recovery]]

What's that? I have access to all the ressource AND source code of my game? I can run it in the Godot editor just like I was the dev?

And not any protection? No [PCK encryption](https://docs.godotengine.org/en/4.4/contributing/development/compiling/compiling_with_script_encryption_key.html) ? So no need to use [gdke](https://github.com/char-ptr/gdke) to extract the key? I'm not spending 3 hours reversing a [custom C++ encryption obfuscation implementation](https://www.reddit.com/r/godot/comments/1koehtd/my_first_godot_pr_securing_godot_by_obfuscating/) ? Yay!   

Moreover back it my time (last year), the tool did not reverse ARM binaries, what a time we live in! 👴 

As gdsdecomp kindly tells us, let's download the version of the Engine used for this game, [Godot 4.5.1](https://godotengine.org/download/archive/4.5.1-stable/). It's small (160Mo) and easy to use, what a great game engine!

![[Inso26TheQuest_godotEditor.png|Look at me, I am the dev now]]

The `map/main.tscn` scene on the screenshot shows the start of a flag, `INS{...}` but truncated.
Of course the chall is not *that* easy, if we read `screens/flag_overlay.gd` we get:

```python
...
@export var MESSAGE_FILE_PATH: String = "/tmp/flag.txt"
...
func show_flag() -> void :
    var message = _read_flag_from_file()
...
```

So of course we don't have it in the binary.

When you start the game, you are immediately greeted with an "insert coin" screen.
If we go read the source of `screens/insert_coin.gd` 

```python
var main_scene: PackedScene = preload("uid://bcekff6xlw725")
...
func _on_credits_added(_credits: int) -> void :
    var check_coins: int = CreditManager.check_credits_amount()
...

func _on_tag_too_soon() -> void :
    msg_label.text = "5 minutes between retries !"
    await get_tree().create_timer(TIMER_SHOW_MSG).timeout
	...

func _on_game_can_start() -> void :
    get_tree().change_scene_to_packed(main_scene)
...
```

We see that the game  only allows retries every 5 minutes, which is quite punitive.
It loads the `main_scene` when credits are available.
Let's check the source of `scripts/credit_manager/credit_manager.gd`:

```python
const CREDIT_FILE_PATH = "/tmp/nfc_last.json"
const CREDITS_NEEDED = 1337
...
func _check_credit_file() -> void :
    if not FileAccess.file_exists(CREDIT_FILE_PATH):
        return
	...
    var amount: int = data.get("amount", 0)
    var toosoon: int = data.get("toosoon", 0)
	...
```

I don't have physical access to the chall, I guess an external process reads NFC badges and fills the `/tmp/nfc_last.json` .
But for tests on our machine we can trivially bypass this by different methods. let's be creative:

- Press the "run specific scene" (🎬 2nd icon)  top right of editor, (Ctrl-Shift-F5) and choose `map/main.tscn`.
- Better, add the `get_tree(). change_scene_to_packed(main_scene)` bit to the `_ready()` method of `insert_coin.gd`
- Best, go to the editors' top bar, *Project* -> *project settings* -> *application* -> *run* -> *main_scene* , to change it. Then press the play (▶) button (F5) to launch the game directly.

### Tool assisted speedrun

We can try playing the game. We control our character in a 2D game with the arrows and apparently have to activate levers (with the `E` key). But they are seemingly impossible to reach as they are guarded by enemies that kill us instantly after seeing us. If I judge the game interface, we have 4 lives and 210 seconds to enable 5 levers.

By looking at the map on the Godot editor, We can see each lever is numbered.
If we search the code in `map/main.gd` we have:

```python
@export var expected_lever_sequence: Array[int] = [1, 3, 2]
```

But it is a false lead, as the GUI shows us 5 elements. The `@export` indicates that devs can set the value directly in the editor, so, let's check the `main` object in the `main.tscn` scene.

![[Inso26TheQuest_uiNumbersLevers.png|kronk, wrong lever!]]

The order is `1,2,3,2,1`. We need to repeat 2 times some levers, pretty hard!

Also, the enemies seem to instantly detect us, sometimes even before I see them, their vision seems pretty arbitrary... let's fix that by displaying their line of vision! 

in the `main.tscn` scene tree, select any enemy (like `Enemies/Enemy0`) and click on it's scene icon (🎬)
On it, re-make the `visionComponent` visible to show it's line of vision. It's a strange polygon shape.

![[Inso26TheQuest_enemyvision.png|Les secrets de TASeur]]

As we edited a *prefab*, all  enemies are affected by this change, and when we launch the game we perfectly see their line of sight.

![[Inso26TheQuest_impossibleWall.png| you shall not pass]]

we could also make the player's hitbox visible, but enabling all hitboxes via the menu bar *Debug* -> *visible hitboxes*  displays *all* boxes, including the walls, which make the game way less readable.
But if you go watch on the  `entities/player/player.tscn` scene, you can notice his hitbox stops a bit below his hair (important!) 

### hitbox abuse

So now that we have a game seemingly well coded, where we cannot modify the binary to cheat or [send network input to trigger a buffer overflow](https://www.youtube.com/watch?v=PLAVmp5ky-k) . 

Well... I would have said we *vibe* speedrun the game. But **no AI here** , vibing in the sense trusting all kinds of bugs I saw in countless speedrun videos.

The first lever is pretty straightforward now that we see the guards line of sight: The guard in the corridor has actually a blind spot if you move just next to him, and when he will ~~turn~~ flip around, if you are just at the right spot, he won't see you!

A video is worth a thousand words:


{% include video.html content="Inso26TheQuest_lever1_hitbox.mp4" %}

It's easier said than done tough, the timing is short! Remember we have to flip this lever *2 times* ...

### It's no good being a guard in a CtF Challenge

The second lever is in a room where the entrance is firmly guarded.
However, by observing with the guards line of sight , we see that the line of the guard sometimes crosses with the one of another guard that is *behind the wall*. So, what if there was a logic bug where one raycast detection canceled the other? let's find out in video!


{% include video.html content="Inso26TheQuest_lever2_scanboxes_overlap.mp4" caption="only the penitent man passes" %}


I have to admit, I don't understand well how the bug is triggered. You can read the `components/vision_component.gd` source but I couldn't really explain it. thus the *human vibing* part of the solve 😅.

Watch out also, as you have to have to position your character just inside the 2 lines of sight, and there is few margin. Keep staying at the right to not die accidentally. Also, you have to repeat it on the way in *and* out, and do it 2 times!

### Take damage to save time

With the hitboxes visible, the last lever looks *even more impossible* .

![[Inso26TheQuest_impossibleWall.png| dungeon closed]]

Now if we check the map on the main scene, we start noticing some strange elements. Some parts of the levels are pretty much useless. There is a top par that is inaccessible, but *just linked to lever 3* , and an enemy patrols on the left side of the level where there is nothing to do... 

Also I noticed by playing that I respawned at a different place if I got killed by the guard at the bootom of the level instead of one in the middle. Wait, so there are 3 respawn points, *and one at the top*?

![[Inso26TheQuest_mapRespawns.png|yellow square are checkpoints, levers size increased, emphasis mine]]

Let's check the script for the respawn mechanic.

`scripts/respawn_manager/respawn_manager.gd`
```python
...
for point in respawn_points:
	var distance: float = from_position.distance_to(point.global_position)
	if distance < closest_distance:
		closest_distance = distance
		closest_point = point

return closest_point.global_position

```

So standard stuff, we respawn to the closest point to were we died. Let's try an intuition, and voluntarily get found by the guard just at the left edge of the map.
It's again way better explained visually:

{% include video.html content="Inso26TheQuest_lever3_respawn_points.mp4" %}


We got teleported at the top!
However, we lost 1 life to teleport, and lose another one on the way back, meaning we only effectively have 1 life available for mistakes and mis-inputs.  tough game!

### Bonus round: the ARG

We now have solved the game! But apparently this wasn't the end for IRL contestants, as the real flag told "Did you find the easter egg?"

We could try reversing all the game, inspect all the code, the easter egg was *right below our eyes*. Didn't you notice it by seeing the map picture on the previous section?
I tried inspecting all the very small details of games sprite, when I found a strange pattern on the floor of the level:

![[Inso26TheQuest_hiddenNumbers.png|emphasis mine]]

Some tiles were a little bit darker than the others, forming numbers!
You could manually search and read them on all the map. 

But let's do a little game dev trick: The floor *tile map* is an individual picture with all it's element placed in a PNG picture. If you edit it to remove all the basic tiles you don't want to see, the game editor will instantly reload and reveal only the "numbers" tiles!

Again, a video explains the trick:

{% include video.html content="Inso26TheQuest_easteregg_reveal_positions.mp4" caption="O.D.I.L ... Lido?" %}


We have then 4 numbers scattered across the map, 6.56,46.5,465,239.

Apparently, previous editions of the CTF included GPS coordinates. So Phil found that the combination, lat *46.5239  long 6.56465* is a position just at the back of the Insomni'hack convention center.

I learned there were staff members waiting with a shovel to give to the finder of this easter egg, so they can dig a treasure. What an awesome ride! 

![[Inso26TheQuest_location.png|oracle, tracing your location]]

It was a really cool and unique challenge, the easter egg idea was also really well thought, it must have been very fun IRL! 