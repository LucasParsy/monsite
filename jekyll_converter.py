#!/usr/bin/env python

import glob
import os

root_path = os.getcwd() + "/_notes/Public/"
paths = glob.glob("**/*.md", recursive=True, root_dir=root_path)
print(root_path)
for p in paths:
    pf = root_path + p
    d = ""
    with open(pf, "r") as f:
        d = f.readlines()
        

    print(pf, d)