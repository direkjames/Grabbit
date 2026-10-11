import sys, math
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

# Original rune-style glyphs on a 3x4 lattice: x 0..2, y 0..3
S = {
'A':[((0,0),(0,3)),((0,3),(2,3)),((1,0),(1,3))],
'B':[((0,0),(0,3)),((0,0),(2,1)),((0,3),(2,2))],
'C':[((0,1),(0,3)),((0,1),(2,0)),((0,3),(2,3))],
'D':[((0,0),(2,0)),((2,0),(2,3)),((0,2),(2,2))],
'E':[((0,0),(0,3)),((0,1),(2,1)),((0,3),(2,2))],
'F':[((0,0),(2,3)),((2,3),(2,0)),((0,3),(1,3))],
'G':[((0,0),(0,3)),((0,0),(2,0)),((1,1),(2,2))],
'H':[((0,0),(0,3)),((2,0),(2,3)),((0,1),(2,2))],
'I':[((1,0),(1,3)),((0,3),(2,3)),((0,0),(1,1))],
'J':[((0,3),(2,3)),((1,3),(1,0)),((1,0),(2,1))],
'K':[((0,0),(0,3)),((0,2),(2,3)),((0,2),(2,0))],
'L':[((0,3),(0,0)),((0,0),(2,0)),((1,0),(1,2))],
'M':[((0,0),(0,3)),((0,3),(1,1)),((1,1),(2,3)),((2,3),(2,0))],
'N':[((0,0),(0,3)),((0,0),(2,3)),((2,3),(2,0))],
'O':[((0,0),(0,3)),((0,3),(2,3)),((2,3),(2,0)),((0,0),(1,0))],
'P':[((0,1),(0,3)),((0,3),(2,3)),((1,3),(1,0)),((1,0),(2,0))],
'Q':[((0,0),(2,2)),((0,3),(2,3)),((0,3),(0,1))],
'R':[((0,0),(0,3)),((0,3),(2,2)),((2,2),(0,1)),((0,1),(2,0))],
'S':[((0,3),(2,3)),((2,3),(0,0)),((0,0),(2,0))],
'T':[((0,3),(2,3)),((1,3),(1,0)),((0,1),(2,1))],
'U':[((0,3),(0,0)),((0,0),(2,0)),((2,0),(2,2)),((0,2),(1,3))],
'V':[((0,3),(1,0)),((1,0),(2,3)),((0,1),(2,1))],
'W':[((0,3),(0,0)),((0,0),(1,2)),((1,2),(2,0)),((2,0),(2,3)),((0,3),(1,3))],
'X':[((0,0),(2,3)),((0,3),(2,0)),((0,1.5),(2,1.5))],
'Y':[((0,3),(1,1.5)),((2,3),(1,1.5)),((1,1.5),(1,0)),((0,0),(2,0))],
'Z':[((0,3),(2,3)),((2,3),(0,0)),((0,0),(2,0)),((1,0),(1,1.5))],
}
# make sure no two letters share the same stroke set
assert len({frozenset(v) for v in S.values()}) == 26

UPM=1000; W=620; X0=130; XS=180; Y0=0; YS=215; T=64
def quad(p,q):
    (x1,y1),(x2,y2)=p,q
    ax,ay,bx,by=X0+x1*XS,Y0+y1*YS+60,X0+x2*XS,Y0+y2*YS+60
    dx,dy=bx-ax,by-ay; L=math.hypot(dx,dy); nx,ny=-dy/L*T/2,dx/L*T/2
    ex,ey=dx/L*T/2,dy/L*T/2   # square-ish caps so joins overlap
    pts=[(ax-ex+nx,ay-ey+ny),(bx+ex+nx,by+ey+ny),(bx+ex-nx,by+ey-ny),(ax-ex-nx,ay-ey-ny)]
    area=sum(pts[i][0]*pts[(i+1)%4][1]-pts[(i+1)%4][0]*pts[i][1] for i in range(4))
    if area>0: pts=pts[::-1]          # one winding direction so overlaps union
    return pts
def glyph(strokes):
    pen=TTGlyphPen(None)
    for p,q in strokes:
        pts=[(round(x),round(y)) for x,y in quad(p,q)]
        pen.moveTo(pts[0]); [pen.lineTo(p) for p in pts[1:]]; pen.closePath()
    return pen.glyph()
order=['.notdef','space']+[c for c in S]
fb=FontBuilder(UPM,isTTF=True)
cmap={32:'space'}
for c in S: cmap[ord(c)]=c; cmap[ord(c.lower())]=c
fb.setupGlyphOrder(order); fb.setupCharacterMap(cmap)
gl={'.notdef':TTGlyphPen(None).glyph(),'space':TTGlyphPen(None).glyph()}
for c,s in S.items(): gl[c]=glyph(s)
fb.setupGlyf(gl)
fb.setupHorizontalMetrics({g:(W if g!='space' else 330,0) for g in order})
fb.setupHorizontalHeader(ascent=900,descent=-200)
fb.setupNameTable({'familyName':'Grabbit Enchant','styleName':'Regular','copyright':'Original glyph design for Grabbit by direk james. MIT licence.'})
fb.setupOS2(sTypoAscender=900,sTypoDescender=-200,usWinAscent=900,usWinDescent=200)
fb.setupPost()
fb.font.flavor='woff'
fb.save(sys.argv[1])
