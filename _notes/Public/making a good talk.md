---
title: "Bullet train: making a good talk"
feed: show
permalink: /talks_tips
date: 19-01-2025
summary: personal tips and tricks from my favorite talks
thumbnail: talk_tips.png
---
I love doing talks. I'm just fond of youtubers conveying complex talks with fascinating storytelling and catchy editing, like [Fireship](https://www.youtube.com/watch?v=5C_HPTJg5ek) with his code reviews. I feel creating fun and engaging presentations is a stimulating creative project akin to video editing, just requiring less effort ^^' 

I wanted to share here some of my personal tips, tricks and opinions for a memorable talk.
I'll try going straight to the point and give examples of talks that I found inspiring. 

I'm going to focus my article on 3 key points:
- <a href="#speaking-in-public">Speaking in public</a>: nail your delivery
- <a href="#content">Content</a>: convey your thoughts in an engaging way
- <a href="#style">Style</a>: make your talk crisp and cool.

> [!info] Disclaimer
> All opinion written here is purely personal. None of my given advice is a "rule" set in stone . I often break some of my own guidelines to create something that fits best my presentations. Please take this article as an inspiration, not an injunction!
> I'd be happy to get your thoughts  on this article, or your personal hints, you can find my socials or my email on my <a href="/">homepage</a> to hit me up 😀

### Speaking in public
*nail your delivery*

A botched talk can make a fascinating subject boring, but as Will Stephen showed in his TED talk, you can make a  [captivating speech about nothing](https://www.youtube.com/watch?v=8S0FDjFBj8o). 

You even can hook someone on a topic he doesn't understand, as when I saw my first talk from Charlie Bromberg on [Kerberos Delegation](https://www.youtube.com/watch?v=7_iv_eaAFyQ) while knowing nada about Active Directory.


> [!info] info
> I will not talk much about how to improve your speech tone, body language and other non-verbal communication hints, as I'm pretty bad at those, but please check about it on other sources 😅  

It's also the part with the most generic advice, so quick tips before jumping on fun technical parts (the ones with pretty pictures) : 

##### **Repeat, repeat and repeat your speech**. 

I do it minimum 5 times for all of my speeches, even the hour longs ones. It is just necessary to create a fast, fluid and natural speech flow. Extra repeat individual parts of your talk if you find them more difficult to present. 
##### **Memorize keywords, not full sentences**

No need to know by hearth all your talk. It's almost impossible for long talks, and it will make you feel robotic. You normally should be able to tweak some turns of phrases on the fly,  but **memorize key concepts and technical terms** to avoid a sudden blank in front of the audience.
##### **Understand perfectly what you are presenting**

Know as much as you can of what you are talking about. It's obviously okay to not know a specific detail when you get a tricky question from the audience. But you should be able to naturally summarize and explain every concept of your talk to a newcomer. **Be passionate about your subject**, audience will like it and being focused on your explanations reduces the stress of talking. 

##### **Watch the audience, not the slides**

Knowing your subject and your slides obviously help not watching them.
People praise me for watching the audience. Truth is **I mostly stare blankly**, mechanically moving my head across the room **while I'm focused in my explanations**. People seem not to notice it, they probably watch the slides most of the time.

I'll add that having a **Bluetooth remote** is a good way to move more comfortably and get a good body language in front of the audience. You can use a mouse, a 10€ remote, or even a Wiimote, they're Bluetooth! 

##### **Do not repeat exactly the content of your slide**

Plainest advice here. Slides are here to summarize, but you should explain in-depth orally. If you have no more to say than what your slide shows, maybe it's a good opportunity to **simplify** your slide. If it's really a plain slide, you could quickly go over it by **rephrasing it, making a small joke or telling an anecdote** by the same occasion.


### Content
*convey your thoughts in an engaging way*

##### **Write big**
If slides are only for summarizing, it's because small and condensed text makes your slides unreadable.
Think of the ones on the far back of the room, or the people watching the replay on the phone!
If you have a lot to say, spread it across multiple slides.

Let me add a *very situational advice* on top of the generic one: **don't put too much stuff on the bottom of your slides.** If you aren't in an amphitheater, people with a tall front neighbor may have a hard time reading all your content!

##### **go Low-Code**

Not only code takes a lot of screen space, but a lot of brain power too!
As a conference attendee, when attending the 7th talk of the day, it's usually at complex code explanations that my brain shuts off.
Of course you can't remove your code examples, it's the core of your talk and people are there for it. But you can make it clearer and easier to understand. 

First, **you can cheat: put only the valuable snippets**. Create the smallest and simplest examples. Crop your images. **Edit out the irrelevant output** from your screenshots . (I still put tiny "..." to signify I edited for brevity)

if you have a complex code block, **visually explain it progressively**.
A step by step animation highlighting with an arrow or a box the relevant part really helps following your code , as Philip Roberts demonstrates in his brillant [JS Event loop explanation talk](https://youtu.be/8aGhZQkoFbQ?si=aKM5-bI4WIdQJCEY&t=331) 

![[talks_code_explain.gif|An example of progressive code reveal from one of my talks (sped up)]]

##### **Don't tell everything**, leave some for a blog post

If you have a very complex subject, for example with a lot of code, I'd recommend **creating a blog article in complement of your talk**, to further elaborate your points. Even a small blog post allows interested viewers to get a fast reference to a specific concept you mentioned, access links to your sources and copy code snippets.

A personal opinion subject to debate, for me *the purpose of a talk is to story tell about your subject, pique the viewer interest , raise their curiosity and give just enough info to make them feel they understood most of it while hungry for more.* Then the blog post (or the project you're presenting) is there to provide the complete, complex and boring experience !

##### **to demo or not demo?**

Demos are a nightmare: You have to talk and entertain the audience *all while typing*, know exactly what to type, and if demonstrating a project with frequent updates or polling from internet, you need to sacrifice a goat in dark rituals to prevent Murphy's law.
*Not to say you shouldn't do live demos* , but you'll play in hard mode and need to work extra hard to rock a live coding session like Brian Leroux and his [ 18 minute WTFJS talk](https://www.youtube.com/watch?v=et8xNAc2ic8).

If you insist on live coding, **prepare your setup for presentation** : Zoom your terminal, put your editor on distraction-less mode and disable plugins, mute OS notifications, default your dual screen configuration to "duplicate screens". *Before* the talk! 

Best solution is again, cheating: Jeff Delaney from Fireship [explains how he records his "live demos"](https://youtu.be/N6-Q2dgodLs?si=paaOMyReBKDiFKkz)  and he just copy pastes prepared blocks of code instead of typing. Harder to pull in front of a live audience seeing your desktop, but doable!

Safest solution is obviously recording your screen. That's also the perfect occasion to do some light editing, like zooming on the interesting parts! For terminal sessions, [Asciinema](https://asciinema.org/) is the perfect recording tool, with **crisp output and auto retiming options**.

Additional tip if you play videos: keep them on your hard drive, **don't rely on internet connectivity** during your talk!

##### **engage your audience with a cold open**

Now for another hot take: **I don't understand why people directly introduce themselves on talks.** Audience is here for the content of your talk, not specifically for you. Your introduction slide will only be a small hindrance and people will have forgotten your name by the end of the talk. 

Okay, I'm a bit too harsh! But you can hook your audience from your first words, and **make people want to know who you are**... by the power of the cold open.

Just start your talk directly into your subject, do some storytelling on how you encountered the situation that made you make this talk, introduce a problem or better, a mystery. And just when it becomes interesting... wham, your introduction slide!
Now people are hooked, and better, **they care about who you are because you introduced them the reason why you're an expert on the subject you will be presenting**. 

A perfect demonstration of a cold open done right is [this Joseph Cox talk introduction](https://youtu.be/uFyk5UOyNqI?si=SDZnzJO5zPzFF8d6&t=19) .
Still it's a bit of a cheat, it's way easier to make a thrilling story about \*check notes\*... the bust of a drug trafficking ring via an encrypted phone company secretly run by the FBI, than say, about the refactor of your networking stack to gain 5% performance 🤣

 You also can **put your resume slide at the end** of the talk. Even if they're already at the start, nothing wrong redoing your promotion. Take the opportunity to put a QR code to your blog, pointing to the slides and your sources.

##### **Bullet points are great actually**

People love to hate bullet points even if they are a **perfect tool to efficiently summarize key points**, but also **tie in several related concepts not deserving their own full slide**.
It's visually pleasing and appeasing, perfect for your talk warmup or after an heavy code explanation.

However the design of your bullet point is crucial: by definition, you should limit yourself to one small sentence by point. I circumvent this rule by sometimes *adding a small additional text on the current point* 

Also don't show all your bullets at once! **gradually display bullets as you speak, each one with it's own illustration** (usually I put memes when I don't have relevant info to illustrate ^^') . Put the **current bullet text in bold**

![[talks_nested_bulletpoints.gif|a rare case of nested bulletpoint (breaking some of my own guidelines)]]

The problem is that bullet points are so great that you want to put them everywhere, and then people start to notice.

> [!info] disclaimer
> I Sin way too much in that regard, I think 75% of my slides are bullet points , sorry 😅

However If you can summarize your key points in a few words and an icon, it's easier to disguise your bullet points as a stylish animation. Be creative! 

![[talks_different_bulletpoints.gif| Wait it's all bullet points?]]


### Style
*make your slides crisp and cool*

##### **image size: go big**

In the age of 4K display, take your **screenshots at the highest resolution** possible to avoid them appear fuzzy on the amphitheater projector. Also watch out , if your presentation tool compresses images by default, [like Powerpoint](https://answers.microsoft.com/en-us/msoffice/forum/all/how-to-permanently-disable-image-compression-in/ffbaf11a-a619-4a0e-b017-1567d26b489f), disable this option! 

Best bullet-proof option, but time expensive: **embed your code directly as text in your presentation**. Most tools have a code block option/plugin, or you can open your snippet in Visual Studio Code and copy/paste it in your slides, it preserves syntaxic coloring.

##### **get a nice template**

That's the advice, except if you are a graphics designer don't try reinventing the wheel, lots of cool templates are available online for a multitude of tools.

If customizing, try not putting too much different colors, not have too many distracting background elements and follow other design principles.

Of course customizing a bit is a good way to make standing-out slides, I particularly liked ideas from the [Panda3DS: Climbing the tree of 3DS emulation](https://archive.fosdem.org/2024/schedule/event/fosdem-2024-1726-panda3ds-climbing-the-tree-of-3ds-emulation/) talk by George Poniris.

If you want to see stunning slides done by a professional graphic designer, you can check the [" Practical Exploitation of DoS in Bug Bounty" talk by Roni Lupin Carta](https://youtu.be/b7WlUofPJpU?si=dphUtO3dbvzef7MO ) 

##### **keep animations unnoticeable** (generally)

Before giving tips on how to do fun an visually impressive effects, remember that even if motion is meant to emphasize your point, it **may easily be distracting** 

- **Keep effects minimal**: a simple "fade" of your elements is 90% of the time sufficient. 
- **Make them quick**: Tools like PowerPoint tend to have a "1 second" effect time by default, which make them slow and quite noticeable.
- **Only animate what needs to change**: Seems like an obvious tip, but for example if you have 2 slides with the same structure, with an illustrative picture, put both images exactly at the same place, and with the same size, for a seamless transition. 

![[talks_animate_size.gif|an example of reduced animations changes]]

- <b>Only animate 1 object a time</b>: See the gif above? Don't do like this, if possible! If two objects move, people will not know what to watch.
- <b>Use big animations to make an impact</b>. You can do a few "wow effects" at the start of the talk or to give a brief pause after some complex slides. Animations are also perfect to explain complex subjects and diagrams, step by steps.  

##### **PowerPoint key feature: Morph transition**

One last design hint, this time limited to a specific, and proprietary tool.

> [!info] Excuse
> I prefer *WYSIWYG* tools to create quick and customizable slides, and I feel free and open source tools are way less practical and powerful than Microsoft's product. What other tool has scripting or 3D objects integrations? *Of course I'd maybe be less ecstatic if I hadn't a free license...* 

The game changer for quick and stunning animations on PowerPoint is as simple as selecting a transition option: the Morph.
It will automatically **transition similar objects between two slides**.

Meaning if you have a small red square on the left, and next slide a big green square on the right, Morph will automatically, slide, enlarge and fade color the shape, all seamlessly!

That's a simple example, but a few hacks and tips give stunning results.
I am delighted with the trend of Tiktoks/Youtube shorts giving lots of condensed mini-tutorials , perfect to find inspirations.
I can only recommend [Luis Urrutia's ](https://www.youtube.com/@lourrutiappt/videos) and [SlideSkills](https://www.youtube.com/@SlideSkills/videos) Youtube channels  as they makes a lot of cool short content [like this one](https://www.youtube.com/shorts/_m6IfAbS1jw)  as well as more detailed tutorials.

![[talks_animate_morph.gif|it's all Morph!]]

Of course you can do animations on other tools: I already shared [Philip Roberts's what the heck is the event loop anyway](https://www.youtube.com/watch?v=8aGhZQkoFbQ) talk which is made with Apple Keynote, and you can even create slides with the open source [Godot game engine](https://godotengine.org/article/godot-slides-gamified-slideshows-with-godot/) if you're brave enough! 

I hope you found some of my tips useful and I'd be very happy to get your opinion on my ramblings !
### inspirational talks 

| Talk                                                                                                                                               | Why it impressed me                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [How to sound smart in your TEDx Talk - Will Stephen](https://www.youtube.com/watch?v=8S0FDjFBj8o)<br>                                             | Incredible nonverbal communication demonstration                               |
| [déléguer kerberos pour contourner des limitations de la délégation kerberos - Charlie Bromberg ](https://www.youtube.com/watch?v=7_iv_eaAFyQ) | Fascinating talk with nice touches of humor                                    |
| [what the heck is the event loop anyway - Philip Roberts](https://www.youtube.com/watch?v=8aGhZQkoFbQ)                                             | Great animations explaining quite complex subjects                             |
| [Wat - Gary Bernhardt](https://www.destroyallsoftware.com/talks/wat)<br>                                                                           | A quick and fun live demo of programming languages quircks                     |
| [WTFJS - Brian Leroux ](https://www.youtube.com/watch?v=et8xNAc2ic8)<br>                                                                           | like the "Wat" talk but longer and more serious                                |
| [DEF CON 32 - Inside the FBI’s Secret Encrypted Phone Company ‘Anom’ - Joseph Cox](https://www.youtube.com/watch?v=uFyk5UOyNqI)                    | An enthralling intro with a perfect cold open                                  |
| [Panda3DS: Climbing the tree of 3DS emulation - George Poniris](https://archive.fosdem.org/2024/schedule/event/fosdem-2024-1726-panda3ds-clim)     | Nice custom slide template ideas                                               |
| [Practical Exploitation of DoS in Bug Bounty - Roni Lupin Carta](https://youtu.be/b7WlUofPJpU?si=dphUtO3dbvzef7MO )                                | Stunning slides done by a professional graphic designer.                       |
| [Rust in 100 Seconds - Fireship](https://www.youtube.com/watch?v=5C_HPTJg5ek)                                                                      | YouTube content creator creating fast and catchy tutorials & tech news reports |



