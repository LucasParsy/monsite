---
title: " Root-XMAS 2024 Day 11 - Padoru"
feed: show
permalink: /RootXMAS_2024_11
date: 11-12-2024
summary: " shader rever... PADORU PADORU!"
---
### summary

A... shader reverse challenge? that's an original one!
Two way to reverse them, statically, or dynamically... Let's try both!

Dans Ghidra:
&christmasKey et encTrueChristmasSecret qui sont 2 variables à checker.
 
### recon

We are provided a folder with a .exe and  multiple files:

```bash
dir
	fragment.spv       # fragment shader
	irrKlang.dll       # irrlicht lib
	msvcp140d.dll
	padoru.exe         # the binary to launch
	padoru.obj         # 3D model
	padoru.ogg         # the dreaded song file
	padoru.pdb         # nice, debug infos!
	padoru_texture.dds # texture file
	ucrtbased.dll
	vcruntime140d.dll
	vcruntime140_1d.dll
	vertex.spv         # vertex shader
```

Smells like a video game, or at least a 3D application!
So let's launch it:

```bash
.\padoru.exe
	Enter the correct christmas secret, 
	and try to unleash the hidden padoru colors: 
aaa # random flag try
	Shader program validation failed.
	Failed to load SPIR-V shaders
```

Nothing else happens. Damn, the chall seem to be very difficult... 
Wait a minute, is it expected behavior? 

After searching online for 30 minutes, reversing the executable to understand it was not part of the challenge, whining on the Discord, and then turning my brain on, I remembered I had a laptop, so I had to [force Windows to use my shiny graphic card and not the stinky iGPU](https://www.reddit.com/r/techsupport/comments/117e1yj/how_to_force_pc_to_use_a_specific_gpu_for_an/).

We relaunch the app and are greeted by Nero singing her[ beautiful christmas song ](https://www.youtube.com/watch?v=dQ_d_VKrFgM) . But we need to find the correct flag to unlock her "true colors".

![[rmxmas24d11_padoru.png|thank me for not putting the sound...]]

We saw an error message about shaders, this made me curious, what's inside them?

```bash
strings fragment.spv            
	...
	main
	flagDetected
	decChristmasLetter
	TrueSecrets
	encTrueChristmasSecret
	finalChristmasKey
	GuessedSecrets
	guessedSecret
	textureColor
	...

strings vertex.spv  
	...
	finalChristmasKey
	Keys
	initialChristmasKey
	gl_VertexID
```

Wait, so our flag verifyier is written in shaders? Damn that's a new one for me.
But these [SPIR-V shaders](https://en.wikipedia.org/wiki/Standard_Portable_Intermediate_Representation) are in an binary intermediate language, how to read them?

There are two methods to try and find the flag, dynamically and statically. I did a mix of both for my solve, but let's assume I knew what I was doing from start and let's try both methods individually!

> [!info] disclaimer
> Sorry if I said innacurate or just plain wrong stuff about graphics programming:  I only remember basic stuff about this domain. I vaguely followed an OpenGL course 7 years ago, created a 3D crane and a toon shader, then proceeded to forget about this black magic.

![[rmxmas24d11_crane.png| I really peaked at OpenGL  this day]]

### dynamic reversing solution

The reference for  graphics app debugging (and reverse!) is [RenderDoc](https://renderdoc.org/) , a tool allowing you to hook onto your app and its rendering libraries (OpenGL, Vulkan, DirectX), and capture everything that goes to the GPU: 3D models, textures, shaders, function calls and their parameters.

However when you are new to Graphics programming, it has a lot of options and it is easy to get underwhelmed and lost!


![[rmxmas24d11_renderdocMess.png| A very welcoming and comprehensible interface]]

First, we need to capture a frame of our application to get some data: On the *Launch Application* window, set the path of the app. press *Launch Button*. We enter a random passphrase, and on the window that appears we have an overlay UI telling "F12 to capture". We do that, and on Renderdoc, on the *padoru \[PID XX\]*  window we can select our frame.

Our goal is to decompile the shaders. So if we check the  *Pipeline State* window, we can see all the rendering steps, including *VS/Vertex Shader* and  *FS/Fragment Shader* .

Let's check *FS* first. There is a *Shader* panel with a *View* arrow button, let's press it... And we get a decompiled shader! Still it's some basic intermediate language conversion, we'll have to guess a bit what it does...

![[rmxmas24d11_renderdoc_spirv.png|ok, let's turn on our brain for reversing]]

But wait a minute, at the top of the window, we can set a different *Disassembly type*. What if we try with *GLSL (SPIR-V Cross (OpenGL Spir-V))* ?

```c
#version 460

layout(binding = 4, std140) uniform TrueSecrets { int encTrueChristmasSecret[67]; } _28;

layout(binding = 1, std140) uniform GuessedSecrets { int guessedSecret[67]; } _45;

layout(binding = 2) uniform sampler2D sampler;

layout(location = 4) flat in int finalChristmasKey;
layout(location = 3) in vec2 UV;
layout(location = 0) out vec4 color;

void main()
{
    bool flagDetected = true;
    for (int i = 0; i < 67; i++)
    {
        int decChristmasLetter = _28.encTrueChristmasSecret[i] ^ ((i + finalChristmasKey) % 25);
        if (decChristmasLetter != _45.guessedSecret[i])
        {
            flagDetected = false;
            break;
        }
    }
    vec4 textureColor = texture(sampler, UV);
    if (flagDetected)
    {
        textureColor = vec4(1.0 - textureColor.x, 1.0 - textureColor.y, 1.0 - textureColor.z, textureColor.w);
    }
    color = textureColor;
}
```

Damn, that is way, way clearer! The code is now looking very simple, let's summarize it:

We have two `uniform` parameters passed to the shader, `guessedSecret` and `encTrueChristmasSecret`.
There is also an `in` parameter, `finalChristmasKey` which comes from previous shaders output.

At each render frame, the shader will compare each character of `guessedSecret` with the ones of `encTrueChristmasSecret` xored with the `finalChristmasKey` ( plus the character index, and modulo 25).

If the correct flag is passed, the rest of the shader executes, inverting the colors of the character's texture.

coming back to the RenderDoc  *Pipeline State* window, we can see the uniform values passed to the shader, most interestingly the `TrueSecrets` / `encTrueChristmasSecret` one, by clicking on  it's *Go* arrow. It is a 67 "encoded" character string, we can even save it as a CSV!

![[rmxmas24d11_renderdocfs.png|The fragment shader has for parameter an uniform "encTrueChristmasSecret"]]

Armed with all this information, we can write a simple python script to un-xor the flag:

```python
import csv 

def solve(finalChristmasKey: int) # don't have the key yet
	res = ""
	
	with open('enc_bytes.csv') as csvfile:
	    spamreader = csv.reader(csvfile, delimiter=',')
	    next(spamreader); next(spamreader) # header lines
	    
	    for i, row in enumerate(spamreader):
	        c = row[1]
	        res += chr(int(c) ^ ((i + finalChristmasKey) % 25)) 
	
	    print(res)
```

However we don't have the `flat in int finalChristmasKey`  parameter showed on the RenderDoc *Pipeline State* window.

Still we can solve it by bruteforce , because the `finalChristmasKey` is only a single int, and is modulo 25, so there are really only 25 combinations.

```python
for i in range(25):
	solve(i)
	
	...
	]UzK5TI2S<^P1U0\X/^H5]2\O?GX3TXO2^[RVJ6L2I+S7^P1\Q;\1QTXQ7E?SV & "|
	RM{H4SH1R3_S0R1_Y0_K4Z3_N0_Y0U_N1_TSUK1M1H4R4_W0_P4D0RU_P4D0RU!!!!}
	JLxI3RK0]2\R7S2^F1\J3[0^A(^Z1R^M0PUPTL0N0W5Q5XV3^_,E3SR^S5K1QT& " b
```

Well done, Well done... HOWEVER! this is not enough, we need to go deeper and solve this rightfully, find the true `finalChristmasKey`!

We now from our `strings` command that `finalChristmasKey` is somewhere in the Vertex Shader. After all it's logical, the Vertex shader is executed before the Fragment one, and `out` data from the first becomes `in` data for the other!

So let's check the code on the *VS/Vertex Shader* tab:

```c
layout(binding = 0, std140) uniform Matrices { mat4 MVP; } _19;

layout(binding = 3, std140) uniform Keys { int initialChristmasKey; } _45;

layout(location = 0) in vec3 vertexPosition;
layout(location = 3) out vec2 UV;
layout(location = 1) in vec2 vertexUV;
layout(location = 4) out int finalChristmasKey;

void main()
{
    gl_Position = _19.MVP * vec4(vertexPosition, 1.0);
    UV = vertexUV;
    finalChristmasKey = (_45.initialChristmasKey + 2512) % 2024;
}
```

And we get the `Keys_var` / `initialChristmasKey` in Renderdoc like for our Vertex Shader:

![[rmxmas24d11_vshader_params.png|the "initialChristmasKey" vertex shader parameter ]]

calculating `finalChristmasKey` is the trivial:

```python
initialChristmasKey = 25122024
finalChristmasKey = (initialChristmasKey + 2512) % 2024
	624
```


> [!info] trivia
> `initialChristmasKey % 25 == finalChristmasKey % 25` , so you can totally find the initial variable and mistake it for the final one , skipping a step unknowingly!

But! it's not good enough! we don't want to do any calculation by hand, what if this shader code was non-trivial? I'm certain  `finalChristmasKey` is wandering somewhere in the RenderDoc interface. But where? someone already [asked the question](https://gamedev.stackexchange.com/questions/211162/how-to-check-input-output-data-for-shaders-in-renderdoc), that was unanswered... until now!

The output of the Vertex shader is available in the *Mesh Viewer* window. 
However , Renderdoc captures all the rendering steps, and the variable we are interested in is only available at the `glDrawArrays` step, that we have to select on the *Event Browser* window.

Add to this to the fact that the `finalChristmasKey` variable was hidden on my interface because the tab content was cropped and I had to scroll right to see it, it was really easy to miss!

![[rmxmas24d11_finalchristmaskey.png| not easy to find, but it's there, to the right]]

we can finally call our python `solve` method with the real `finalChristmasKey` :
```python
solve(624)
	'RM{H4SH1R3_S0R1_Y0_K4Z3_N0_Y0U_N1_TSUK1M1H4R4_W0_P4D0RU_P4D0RU!!!!}'
```

If we use this flag on the challenge, we unlock an inverted color shader!

![[rmxmas24d11_dark_padoru.png|She's so dark]]



### static reversing solution

But what if we are on a 2006 eeePC running Linux only, could we solve the chall without launching the executable?

We will not cover everything already discussed on the dynamic analysis section, like the shader code analysis. Let's focus on decompiling the shader and finding it's parameters in the executable binary.

First, for decompiling the shaders, we see that RenderDoc used [SPIR-V Cross](https://github.com/KhronosGroup/SPIRV-Cross) . It's actually a tool created by the Khronos group (the consortium managing OpenGL and Vulkan) to decompile SPIR-V shaders to multiple other languages. And it's available as a handful standalone!

```c
spirv-cross fragment.spv 

	...
	void main()
	{
	    bool flagDetected = true;
	    for (int i = 0; i < 67; i++)
		...
```


Now Let's find the parameters sent to our shaders by *padoru.exe* .
Thankfully we have the *.pdb* debug file, so Ghidra loads the executable with some variable and methods names !

We get a pretty long `main` thgat does lot of things: Get the flag input, initialize the window with [glfw](https://www.glfw.org/) , load the 3D model , the dreaded sound file with [IrrKlang](https://www.ambiera.com/irrklang/), but most importantly loads the shaders and set their parameters! And we see some suspicious code patterns:

```c++
if (local_b24[0] == 0xffffffff) {
	pbVar4 = std::operator<<<std::char_traits<char>_>
		((basic_ostream<> *)cerr_exref,"Failed to locate key uniform");
		  std::basic_ostream<>::operator<<((basic_ostream<> *)pbVar4,std::endl<>);
	local_44 = 0xffffffff;
	std::vector<>::~vector<>(&local_bc0);
  ...
}
else {
	(*__glewBufferSubData)(0x8a11,0,0x10,&christmasKey);
	(*__glewGenBuffers)(1,local_b04);
	...
```

We see a `christmasKey` variable! And not far after we  also see `encTrueChristmasSecret`

```c++
for (local_668[269] = 0; local_668[269] < 0x43;
  local_668[269] = local_668[269] + 1) {
	local_668[local_668[269] << 2] = encTrueChristmasSecret[local_668[269]];
	local_668[local_668[269] * 4 + 1] = 0;
	...
```

And Hooray, both variables are constants! We only need to click on them, and right click to copy our two variables. We can then solve the chall statically!

![[rmxmas24d11_constvars.png|const variables just chilling here ]]

Damn, static analysis was more straightforward than the dynamic one!