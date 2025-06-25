---
title: Root-XMAS 2024 Day 24 - Root-Xmas Quiz
feed: hide
permalink: /RootXMAS_2024_24
date: 24-12-2024
summary: cheating the exam
---


### summary

cheating on the exam because I don't know any answer

### recon

The last challenge is a small quizz about the Root-me coomunity, but some answers are trolls, some are private jokes where you need to know very well  the Root-me staff, some need deep Osint, especially the "Who is the president of Root-me pro" where the first google result is outdated.
Also, some seem bugged, as for the question 'What challenge did user "yodzeb" flag on December 26, 2011?' . When searching on the root-me stat page for the user, we can see a chall validated at this date, but it is not any of the choice provided in the quizz!

The quiz thankfully allows us to retry as much as we want and even tells us what answers were incorrect.
But still, I didn't wanted to do it manually, as it was tedious, you had to re-enter all 30 answers, remember which correct choices you put previously, and when you retry the quiz, new answers are randomly shuffled!

### solution

Thankfully, the quiz questions and answers work with 2 api endpoints that outputs and take for input JSON, so automating a bruteforce answer is fairly easy:


```python
import requests
import json

requests.packages.urllib3.disable_warnings()
base_url = "https://day24.challenges.xmas.root-me.org/api/"

j = requests.get(base_url + "questions", verify=False).json()

# print(j)

res = [{"id": x["id"], "answer": x["options"][0]} for x in j]

counter = 0
while True:
    counter += 1
    r1 = requests.post(base_url + "submit", json={"answers": res}, verify=False)
    response = r1.json()
    if response["all_correct"]:

        for elem in res:
            question = [x["question"] for x in j if x["id"] == elem["id"]][0]
            print(question, ":", elem["answer"])

        print("")
        print(response["flag"])

        exit()

    for elem in response["results"]:
        if not elem["correct"]:
            to_replace_question = [x for x in j if x["question"] == elem["question"]][0]
            replaced = [x for x in res if x["id"] == to_replace_question["id"]][0]
            replaced["answer"] = to_replace_question["options"][counter]
```

```bash
...
How quickly can Cl0pinette solve infra problems on RM? : 30 seconds
What challenge did user "yodzeb" flag on December 26, 2011? : C’est dans les vieux pots...

RM{YoU_ArE_The_QUiZ_MaSTeR_MERRYXMAS<3}
```


| Previous day | [[Day 22 - The date is near]] |
