# Runefall in Godot — Cutscenes

Short (3–8 s), skippable camera moves that break the fixed view to show something big. Gameplay pauses or the hero walks on their own; letterbox bars slide in. Each cutscene plays once per character (or once per trip for repeatable reveals).

The camera tool in `project/scripts/camera/cutscene_camera.gd` takes a list of shots: a point to look at, a distance, a pitch (how far it tilts up or down), a yaw (how far it turns around), and a time.

| # | Where | Trigger | Shot |
|---|---|---|---|
| 1 | Mistfall | first time in town | slow pull back from the hero over the rooftops to the town square fire, then settle into play |
| 2 | Dark Forest gate | first entry | the camera drops low, looks into the black trees, a howl |
| 3 | River Valley bridge | first reach | sweep along the river to the bandit camp on the bridge |
| 4 | **Lighthouse** | first sight from the Crossroads | **tilt up the tower to the dark beacon**, then back down |
| 5 | Lighthouse rooftop | beacon lit | pull far back and up: the beacon flares, the coast lights up below |
| 6 | Cursed Cemetery | reaching the iron gate | slow push in to the Grave Statue |
| 7 | Dark Crypt | Defiler wakes | low angle on the opened tomb as he rises |
| 8 | Lakeside Ruins | first sight of the lake | wide pan across the water to the island ruins |
| 9 | Black Marsh | first entry | fog rolls past the camera, a glimpse of the Forgotten Tower in the distance |
| 10 | Forgotten Tower | freeing the witch | the cage breaks, she turns to the hero |
| 11 | **Mountain Pass** | the summit road | **zoom out to show the whole mountain range and Frosthold far away** |
| 12 | Frosthold Keep | first sight of the gate | tilt up the walls to the dwarven banners |
| 13 | Frosthold Tower top | the Commander | push in as he speaks, cut to the turrets waking at 50% |
| 14 | Redridge Canyon | first entry | high wide shot over the red canyon and the watchtowers |
| 15 | Shadow Keep | the Breach opens | the ground cracks, the camera tilts down into the lava |
| 16 | Every big boss | first sight | a 2 s look at the boss with its name title |

**Rules:** never more than 8 s; skippable with any tap; the camera returns exactly to the play view; no cutscenes in the middle of fights except boss intros.
