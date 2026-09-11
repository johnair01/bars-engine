# work.py FILEBASENAME — print every unaccepted trailing_and site in one file, numbered.
import sys, subprocess, os, collections
os.chdir("/Users/wendellbritt/The Library/mtgoa-manuscript")
r = subprocess.run([sys.executable, "instruments/trailing_and.py", "--keys"], capture_output=True, text=True)
rows = [l.split("\t", 1) for l in r.stdout.splitlines() if "\t" in l]
want = sys.argv[1]
n = 0
for loc, key in rows:
    f, line = loc.rsplit(":", 1)
    if f != want:
        continue
    n += 1
    print("%d\tL%s\t%s" % (n, line, key))
