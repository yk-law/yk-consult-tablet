# -*- coding: utf-8 -*-
"""yk-binder-app.html(단일 파일)을 로컬 개발용 구조로 분해한다."""
import io,os,re,sys,json

SRC = sys.argv[1] if len(sys.argv)>1 else "yk-binder-app.html"
OUT = sys.argv[2] if len(sys.argv)>2 else "app"
s = io.open(SRC,encoding="utf-8").read()

def bal(txt,i):
    """txt[i]가 { 또는 [ 일 때 짝이 맞는 닫는 괄호 다음 인덱스를 돌려준다(문자열 인식)."""
    op=txt[i]; cl={'{':'}','[':']'}[op]; d=0; q=None
    while i<len(txt):
        c=txt[i]
        if q:
            if c=='\\': i+=2; continue
            if c==q: q=None
        elif c in '"\'': q=c
        elif c==op: d+=1
        elif c==cl:
            d-=1
            if d==0: return i+1
        i+=1
    raise ValueError("unbalanced")

# 1) CSS
m=re.search(r'<style>(.*?)</style>', s, re.S)
css=m.group(1).strip(); s=s[:m.start()]+"@@CSS@@"+s[m.end():]

# 2) script
a=s.index("<script>"); b=s.rindex("</script>")
js=s[a+len("<script>"):b]
html=s[:a]+"@@JS@@"+s[b+len("</script>"):]

# 3) 데이터 상수 분리
data={}
def grab(name, kind):
    global js
    m=re.search(r'(?:const |, ?)'+name+r'=', js)
    if not m: raise ValueError(name+" not found")
    i=m.end()
    if kind=='str':
        j=js.index('"',i); k=js.index('"',j+1)+1; val=js[j:k]
    else:
        val=js[i:bal(js,i)]
    data[name]=val
    js=js[:m.start()+(0 if js[m.start()]=='c' else 0)]+("const " if False else "")+js[m.start():m.start()]+js[m.start():m.start()]+js[m.start():] # placeholder
    return m,val

# 한 줄에 모여 있는 IMG/RAW/DETAIL/FEE/ADV 라인을 통째로 걷어낸다
line_m=re.search(r'^const IMG=.*?;\s*$', js, re.M|re.S)
line=line_m.group(0)
for name,kind in [("IMG",'obj'),("RAW",'str'),("DETAIL",'obj'),("FEE",'obj'),("ADV",'obj')]:
    mm=re.search(name+r'=',line); i=mm.end()
    data[name]= line[line.index('"',i):line.index('"',line.index('"',i)+1)+1] if kind=='str' else line[i:bal(line,i)]
js=js[:line_m.start()]+"/* 데이터는 data/*.js 에서 전역으로 주입된다 */"+js[line_m.end():]

# BOOKINGS
bm=re.search(r'const BOOKINGS=', js); i=bm.end()
data["BOOKINGS"]=js[i:bal(js,i)]
js=js[:bm.start()]+js[bal(js,i)+1:]      # 뒤의 ; 까지 제거

os.makedirs(OUT+"/data",exist_ok=True)
W=lambda p,t: io.open(os.path.join(OUT,p),"w",encoding="utf-8").write(t)

W("styles.css", css+"\n")
W("data/portraits.js", "/* 바인더 PDF에서 추출한 인물 사진 13장. 사람 손으로 고칠 파일이 아니다. */\nwindow.IMG="+data["IMG"]+";\n")
W("data/lawyers.js",   "/* 변호사 316명 · '이름:분야코드' — 출처 /member/lawyer 20p 전수 */\nwindow.RAW="+data["RAW"]+";\n")
W("data/details.js",   "/* 상세 프로필 14인 (바인더 13 + 강경훈) */\nwindow.DETAIL="+data["DETAIL"]+";\n")
W("data/fee.js",       "/* 약정금 분포 — YK-OS 선임 목록 계약 101건 */\nwindow.FEE="+data["FEE"]+";\n")
W("data/advisors.js",  "/* 고문 28 · 전문위원 61 · 자문위원 9 = 98명 */\nwindow.ADV="+data["ADV"]+";\n")
W("data/bookings.js",  "/* 예약 목록 — YK-OS 콜 탭 필드를 따른다. 고객명은 전부 가명.\n   ★ 시연 내용을 바꾸려면 대부분 이 파일만 고치면 된다. */\nwindow.BOOKINGS="+data["BOOKINGS"]+";\n")
W("app.js", js.strip()+"\n")

head = ('<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
 '<meta name="viewport" content="width=device-width,initial-scale=1">\n')
body = html.replace("@@CSS@@", "").replace("@@JS@@","")
body = body.replace('<link rel="stylesheet" href="https://fonts.googleapis.com',
                    '<link rel="stylesheet" href="styles.css">\n<link rel="stylesheet" href="https://fonts.googleapis.com')
tail = ('\n<script src="data/portraits.js"></script>\n<script src="data/lawyers.js"></script>\n'
 '<script src="data/details.js"></script>\n<script src="data/fee.js"></script>\n'
 '<script src="data/advisors.js"></script>\n<script src="data/bookings.js"></script>\n'
 '<script src="app.js"></script>\n</body>\n</html>\n')
W("index.html", head+body.replace("</style>","")+tail)
for f in ["index.html","styles.css","app.js"]+["data/"+x for x in os.listdir(OUT+"/data")]:
    print(f"{os.path.getsize(os.path.join(OUT,f))/1024:8.0f} KB  {f}")
