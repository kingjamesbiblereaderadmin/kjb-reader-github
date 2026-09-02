# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app-wide-overflow.spec.js >> [width 360px] >> no horizontal overflow: /espanol-evangelio
- Location: tests/app-wide-overflow.spec.js:63:7

# Error details

```
Error: /espanol-evangelio @ 360px overflows horizontally by 0px:
  <div class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm"> "" (over by 16px)

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 8

- Array []
+ Array [
+   Object {
+     "cls": "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm",
+     "overBy": 16,
+     "tag": "div",
+     "text": "",
+   },
+ ]
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - img "KJB Reader Logo" [ref=e5]
    - generic [ref=e6]: WELCOME BACK TO KJB READER.
  - generic [ref=e10]:
    - button "Volver" [ref=e11] [cursor=pointer]
    - 'link "Fuente: laiglesiadelanube.com — Roberto Breaker" [ref=e14] [cursor=pointer]':
      - /url: https://laiglesiadelanube.com/el-evangelio-de-salvaci%C3%B3n
    - generic [ref=e15]:
      - heading "¡El Evangelio es 1 Corintios 15:1-4!" [level=1] [ref=e19]
      - paragraph [ref=e20]: El Evangelio de Salvación
      - generic [ref=e23]:
        - button "Copiar Texto" [ref=e24] [cursor=pointer]
        - generic [ref=e28]:
          - button "Compartir" [ref=e29] [cursor=pointer]
          - button [ref=e36] [cursor=pointer]
    - generic [ref=e39]:
      - paragraph [ref=e40]:
        - text: Muchas sectas cristianas modernas erróneamente enseñan que la salvación viene por medio de algo que el pecador HACE. Ellos afirman que la salvación de una persona es dependiente sobre las
        - emphasis [ref=e41]: obras
        - text: del pecador. ¡Pero nada podría ser más lejos de la verdad de la palabra de Dios! Según la Biblia, la salvación es algo que recibimos (por fe) en lo que Jesús HIZO en la cruz del Calvario, porque allí ÉL derramó su sangre para pagar por los pecados de todos los seres humanos. SU OBRA TERMINADA, hecha una sola vez para todos, es la única cosa que puede salvar al pecador y darle perdón de sus pecados y vida eterna.
      - paragraph [ref=e42]: "La Biblia claramente presenta el Evangelio en 1 Corintios 15:1-4, donde leemos:"
      - blockquote [ref=e43]: 1 Empero os declaro, hermanos, el evangelio que os he predicado, el cual también recibisteis, y en el cual estáis firmes; 2 Por el cual asimismo, si retenéis la palabra que os he predicado, sois salvos, si no creísteis en vano. 3 Porque primeramente os he enseñado lo que asimismo yo recibí, que Cristo murió por nuestros pecados, según las Escrituras; 4 Y que fue sepultado, y que resucitó al tercer día, según las Escrituras;
      - paragraph [ref=e44]: "Hay que entender que el evangelio es: ¡lo que JESÚS HABÍA HECHO PARA LOS HOMBRES, y no lo que EL HOMBRE PUEDE HACER PARA DIOS! Una persona solamente está salva por medio de CREER en la obra cumplida de JesuCristo, cuando él derramó su sangre preciosa para nuestros pecados. La expiación de sangre era necesaria, porque sin derramamiento de sangre, no hay remisión (según Hebreos 9:22). Dios siempre ha demandado la sangre para el pecado. En el Antiguo Testamento, Dios aceptó la sangre de un cordero. Pero ahora, en el Nuevo Testamento, Dios sólo acepta el sacrificio de la sangre derramada de JesuCristo, el CORDERO DE DIOS, lo cual padeció por tus pecados."
      - paragraph [ref=e45]: "El Evangelio de 1 Corintios 15:1-4 tiene cinco partes:"
      - paragraph [ref=e46]: 1. Cristo murió 2. Por nuestros pecados 3. Fue Sepultado 4. Resucitó al tercer día 5. Según las Escrituras.
      - paragraph [ref=e47]: "¡Un predicador antiguo dijo una vez: \"NADIE PUEDE PREDICAR EL EVANGELIO SIN PREDICAR LA EXPIACIÓN DE SANGRE DE CRISTO Y TAMPOCO PUEDE ALGUIEN PREDICAR DE LA EXPIACIÓN DE SANGRE DE CRISTO SIN PREDICAR EL EVANGELIO!\""
      - paragraph [ref=e48]: ¡Esta es una verdad bíblica absoluta! Ya que la salvación por el sacrificio de sangre derramada de JesuCristo en la cruz es el único camino en que Dios nos ofrece vida eterna.
      - paragraph [ref=e49]: Como vemos la sangre de Cristo en las cinco heridas que él tenía en la cruz, también anotamos que hay cinco puntos del evangelio.
      - paragraph [ref=e50]:
        - strong [ref=e51]: "Punto #1 Cristo murió."
        - text: Jesús derramó cada gota de su sangre preciosa mientras que sufrió en la cruz del Calvario, muriendo por los pecados del hombre. Y su sangre manchó la tierra.
      - paragraph [ref=e52]:
        - strong [ref=e53]: "Punto #2 Por nuestros pecados."
        - text: "La biblia dice que el pecado es como sangre, en Isaías 1:18 leemos:"
      - blockquote [ref=e54]: "Venid luego, dirá el SEÑOR, y estemos a cuenta: si vuestros pecados fueren como la grana, como la nieve serán emblanquecidos: si fueren rojos como el carmesí, vendrán a ser como blanca lana."
      - paragraph [ref=e55]: Grana (o escarlata) y carmesí son el color de sangre.
      - paragraph [ref=e56]:
        - strong [ref=e57]: "Punto #3 Fue sepultado."
        - text: "Le enterraron al Señor JesuCristo en la misma tierra en la cual él derramó su sangre. Cuando murió Abel, leemos las siguientes palabras en Génesis 4:10 en lo cual Dios dijo:"
      - blockquote [ref=e58]: … La voz de la sangre de tu hermano clama a mí desde la tierra.
      - paragraph [ref=e59]: "Según la biblia ¡sangre habla a Dios! Y Hebreos 12:24 nos cuenta de la sangre preciosa de Jesús:"
      - blockquote [ref=e60]: Y a Jesús el mediador del nuevo pacto; Y a la sangre de la rociadura que habla cosas mejores que la de Abel.
      - paragraph [ref=e61]: ¡La sangre de Jesús también habla! ¿Qué dice? ¡Dice que el inocente (Jesús) murió para los culpables (nosotros pecadores)!
      - paragraph [ref=e62]:
        - strong [ref=e63]: "Punto #4 Resucitó."
        - text: Cuando Jesús resucitó de los muertos, la biblia nos dice que Jesús tomó su sangre al cielo con él y lo roció en el altar en el cielo (Heb. 9:12-25), ¡dónde está todavía esperando a lavar al más vil pecador! ¿Eres limpio en la sangre?
      - paragraph [ref=e64]:
        - strong [ref=e65]: "Punto #5 Según las Escrituras."
        - text: El Antiguo Testamento entero profetiza de JesuCristo como el Mesías que había de venir. Le miramos otra vez y otra vez en tipo cada vez que los judíos sacrificaron animales en el templo para expiación de sangre. Cuando Jesús murió en la cruz como el Cordero de Dios, derramando su sangre como nuestro sacrificio, él cumplió la profecía escrita de él a través del Antiguo Testamento. Entonces, ¡allí miramos que la SANGRE DE JESUCRISTO está hallada en todo el evangelio, y toda la biblia!
      - paragraph [ref=e66]: ¡No puedes predicar la sangre sin predicar el evangelio y no puedes predicar el evangelio sin predicar de la sangre derramada de Jesús!
      - paragraph [ref=e67]: "Ahora, para ser salvo, la biblia nos enseña claramente que la salvación es por la FE, sin OBRAS (Ef. 2:8-9). ¿Fe en qué? ¡FE EN AQUELLA SANGRE DERRAMADA DE JESUCRISTO! Romanos 3:25-28 aclaran esto:"
      - blockquote [ref=e68]: "Al cual Dios ha propuesto por propiciación POR LA FE EN SU SANGRE, para manifestación de su justicia por la remisión de los pecados pasados, por la paciencia de Dios; 26 Para manifestación de su justicia en este tiempo; para que él sea justo, y justificador del que cree en Jesús. 27 ¿Dónde, pues, está la jactancia? Excluída queda. ¿Por cuál ley? ¿De las obras? No: sino por la ley de la fe. 28 Así que, concluimos ser el hombre justificado por fe sin las obras de la ley."
      - paragraph [ref=e69]: Para ser justificado, o salvado, la fe del pecador debe ser puesta solamente en la sangre derramada de Cristo Jesús. Esto manifiesta o declara que el pecador está confiando en EL JUSTO (Jesús) y SU JUSTICIA y no en sus propias obras y su propia justicia. ¡Un creyente no puede jactarse de sí mismo y sus propias obras, sino en Jesús quién le salvó de sus pecados!
      - paragraph [ref=e70]: Tristemente, en nuestra edad moderna de apostasía, hay muy pocos cristianos que predican de la sangre de Jesús, y la necesidad de confiar en ella para obtener la salvación. ¡Pero la verdad bíblica simple es, NI ERES CRISTIANO HASTA QUE CONFÍAS EN LA SANGRE DERRAMADA DE CRISTO JESÚS!
    - generic [ref=e71]:
      - heading "Mis Videos Sobre la Sangre de Cristo" [level=2] [ref=e72]
      - generic [ref=e76]:
        - generic [ref=e77]:
          - paragraph [ref=e78]: La Importancia de la Sangre
          - iframe [ref=e81]
          - link "Ver en YouTube" [ref=e82] [cursor=pointer]:
            - /url: https://youtu.be/Vpn00jurClA
        - generic [ref=e87]:
          - paragraph [ref=e88]: Doctrina de la Expiación de Sangre
          - iframe [ref=e91]
          - link "Ver en YouTube" [ref=e92] [cursor=pointer]:
            - /url: https://youtu.be/rW7cF6T8LSs
        - generic [ref=e97]:
          - paragraph [ref=e98]: El Evangelio Sin Sangre
          - iframe [ref=e101]
          - link "Ver en YouTube" [ref=e102] [cursor=pointer]:
            - /url: https://youtu.be/6ZCvPnYxn0A
  - region "Notifications alt+T"
```

# Test source

```ts
  19  | // (admin-gated internal tools) — none of these are pages a normal reader
  20  | // ever lands on, and several would need real auth/session state to render
  21  | // meaningfully.
  22  | const ROUTES = [
  23  |   '/',
  24  |   '/read?book=GEN&chapter=1',
  25  |   '/read?book=1KI&chapter=16',
  26  |   '/gospel',
  27  |   '/resources',
  28  |   '/kjb-defence',
  29  |   '/about',
  30  |   '/contents',
  31  |   '/settings',
  32  |   '/search',
  33  |   '/advanced-search',
  34  |   '/saved',
  35  |   '/legacy',
  36  |   '/espanol',
  37  |   '/espanol-evangelio',
  38  |   '/landing',
  39  |   '/credits',
  40  |   '/changelog',
  41  |   '/terms',
  42  |   '/privacy',
  43  |   '/contact',
  44  |   '/salvation',
  45  |   '/discord',
  46  |   '/extension',
  47  |   '/extension-privacy',
  48  |   '/extension-terms',
  49  |   '/extension-license',
  50  | ];
  51  | 
  52  | // Real device widths this app targets, narrowest first (most likely to
  53  | // reveal an overflow).
  54  | const WIDTHS = [320, 360, 393, 412, 768];
  55  | 
  56  | const TOLERANCE_PX = 1.5;
  57  | 
  58  | for (const width of WIDTHS) {
  59  |   test.describe(`[width ${width}px]`, () => {
  60  |     test.use({ viewport: { width, height: 800 } });
  61  | 
  62  |     for (const route of ROUTES) {
  63  |       test(`no horizontal overflow: ${route}`, async ({ page }) => {
  64  |         await page.addInitScript(() => {
  65  |           try {
  66  |             localStorage.setItem('kjb-has-visited-app', 'true');
  67  |             localStorage.setItem('kjb-prompt-dismissed', 'true');
  68  |             localStorage.setItem('kjb-install-dismissed', 'true');
  69  |           } catch {}
  70  |         });
  71  |         await page.goto(route);
  72  |         await page.waitForLoadState('networkidle').catch(() => {});
  73  | 
  74  |         const overflow = await page.evaluate((tolerance) => {
  75  |           const docWidth = document.documentElement.clientWidth;
  76  |           const offenders = [];
  77  | 
  78  |           // Whole-document check first — cheapest signal that *something*
  79  |           // is overflowing.
  80  |           const docOverflow = document.documentElement.scrollWidth - docWidth;
  81  | 
  82  |           // Then find exactly which elements, so failures are actionable
  83  |           // instead of just "something, somewhere."
  84  |           const all = document.querySelectorAll('body *');
  85  |           for (const el of all) {
  86  |             const style = getComputedStyle(el);
  87  |             if (style.display === 'none' || style.visibility === 'hidden') continue;
  88  |             const rect = el.getBoundingClientRect();
  89  |             if (rect.width === 0 && rect.height === 0) continue;
  90  |             if (rect.right > docWidth + tolerance) {
  91  |               const text = (el.textContent || '').trim().slice(0, 60);
  92  |               offenders.push({
  93  |                 tag: el.tagName.toLowerCase(),
  94  |                 cls: (el.className && typeof el.className === 'string' ? el.className : '').slice(0, 80),
  95  |                 text,
  96  |                 overBy: Math.round((rect.right - docWidth) * 10) / 10,
  97  |               });
  98  |             }
  99  |           }
  100 |           // Dedupe by tag+text — parent/child elements of the same overflow
  101 |           // both get flagged, only the outermost is actionable.
  102 |           const seen = new Set();
  103 |           const deduped = offenders.filter((o) => {
  104 |             const key = `${o.tag}:${o.text}`;
  105 |             if (seen.has(key)) return false;
  106 |             seen.add(key);
  107 |             return true;
  108 |           });
  109 | 
  110 |           return { docOverflow, offenders: deduped.slice(0, 15) };
  111 |         }, TOLERANCE_PX);
  112 | 
  113 |         expect(
  114 |           overflow.offenders,
  115 |           `${route} @ ${width}px overflows horizontally by ${overflow.docOverflow}px:\n` +
  116 |             overflow.offenders
  117 |               .map((o) => `  <${o.tag} class="${o.cls}"> "${o.text}" (over by ${o.overBy}px)`)
  118 |               .join('\n')
> 119 |         ).toEqual([]);
      |           ^ Error: /espanol-evangelio @ 360px overflows horizontally by 0px:
  120 |       });
  121 |     }
  122 |   });
  123 | }
  124 | 
```