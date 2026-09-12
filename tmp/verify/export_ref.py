import sqlite3, json
con = sqlite3.connect('refpce/KJV-PCE.sqlite')
cur = con.cursor()
cur.execute('select b.BookName, v.Chapter, v.Verse, v.VText from Verses v join Books b on v.BookID=b.BookID')
rows = cur.fetchall()
data = {}
for book, ch, vs, text in rows:
    data.setdefault(book, {}).setdefault(str(ch), {})[str(vs)] = text
with open('ref_export.json','w') as f:
    json.dump(data, f)
print('done', len(rows))
