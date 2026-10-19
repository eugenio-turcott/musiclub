import sys
sys.path.insert(0,'audit/python-libs')
from pathlib import Path
import json, math
from fontTools.ttLib import TTFont as Font
from fontTools.varLib.instancer import instantiateVariableFont
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF
root=Path('.')
font=Font('src/fonts/Gabarito-Variable.woff2'); font.flavor=None
font=instantiateVariableFont(font,{'wght':800},inplace=True);font.save('audit/Gabarito-ExtraBold.ttf')
pdfmetrics.registerFont(TTFont('Gabarito','audit/Gabarito-ExtraBold.ttf'))
pages=json.loads(Path('audit/genre-artwork-pages.json').read_text(encoding='utf-8'))
Path('output/pdf').mkdir(parents=True,exist_ok=True)
c=canvas.Canvas('output/pdf/musiclub-generos-canva.pdf',pagesize=(1000,1000))
c.setTitle('Musiclub - Colección gráfica de géneros');c.setAuthor('Musiclub')
for page in pages:
 c.setFillColor(HexColor('#171433'));c.rect(0,0,1000,1000,fill=1,stroke=0)
 # Flat geometric accents from the Musiclub record identity.
 c.setFillColor(HexColor('#5A2D7C'));c.circle(1000,1000,330,fill=1,stroke=0)
 c.setFillColor(HexColor('#56408E'));c.circle(0,0,235,fill=1,stroke=0)
 c.setFillColor(HexColor('#F57FA2'));c.roundRect(58,48,70,9,4,fill=1,stroke=0)
 c.drawImage('public/musiclub_logo_corchea.png',62,866,width=56,height=60,mask='auto',preserveAspectRatio=True)
 c.setFont('Gabarito',29);c.setFillColor(HexColor('#FFDBE6'));c.drawString(136,887,'MUSICLUB')
 c.setFont('Gabarito',15);c.setFillColor(HexColor('#FFDBE6'));c.drawRightString(940,892,'SONIDOS DEL CLUB')
 drawing=svg2rlg(str(root/'public'/page['src'].removeprefix('/')))
 factor=600/drawing.width;drawing.scale(factor,factor);renderPDF.draw(drawing,c,200,245)
 text=page['name'];size=88
 while pdfmetrics.stringWidth(text,'Gabarito',size)>866 and size>52:size-=2
 words=text.split();lines=[text]
 if pdfmetrics.stringWidth(text,'Gabarito',size)>866:
  split=min(range(1,len(words)),key=lambda i:abs(len(' '.join(words[:i]))-len(' '.join(words[i:]))));lines=[' '.join(words[:split]),' '.join(words[split:])];size=72
 c.setFont('Gabarito',size);c.setFillColor(HexColor('#FFDBE6'))
 for index,line in enumerate(lines):c.drawCentredString(500,185-index*(size+6),line)
 c.setFont('Gabarito',18);c.setFillColor(HexColor('#F57FA2'));c.drawRightString(940,48,'ESCUCHA. DESCUBRE. COMPARTE.')
 c.showPage()
c.save();print(f'Created {len(pages)} square vector pages for Canva.')
