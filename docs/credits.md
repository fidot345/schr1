# Источники фото и текстур

Заполняется по ходу работы. Одна строка — один файл.

| Файл | Что на нём | Автор | Источник (ссылка) | Лицензия |
|---|---|---|---|---|
| hero-1.jpg | мастер пилит ножовкой заготовку в тисках, летят опилки | Will Suddreth | https://unsplash.com/photos/man-sawing-in-room-o54RjF-C7xo | Unsplash License |
| service-kueche.jpg | кухня: светлые деревянные фасады, открытые полки с подсветкой, серые нижние шкафы без ручек, остров с деревянными табуретами, каменный пол | ML Design Cuisines | https://www.pexels.com/photo/19192264/ | Pexels License |
| service-schrank.jpg | деревянный комод-буфет с коваными узорами на дверцах | Erik Mclean | https://www.pexels.com/photo/9899846/ | Pexels License |
| service-tueren.jpg | деревянная дверь с горизонтальными филёнками в солнечном свете | Nothing Ahead | https://www.pexels.com/photo/32796606/ | Pexels License |
| service-ausbau.jpg | комната со стенами из деревянной вагонки, белый потолок с балками, диван | Max Vakhtbovych | https://www.pexels.com/photo/7745947/ | Pexels License |
| projekt-wohnkueche.jpg | светлая кухня-гостиная с деревянными фасадами и обеденным столом | Trần Tuấn Anh | https://www.pexels.com/photo/32780010/ | Pexels License |
| projekt-dachschraege.jpg | гардеробная под скатом крыши: белые встроенные полки и ящики, туалетный столик | Алан Албегов | https://www.pexels.com/photo/24461274/ | Pexels License |
| projekt-garderobe.jpg | прихожая с тёмными стенами, деревянными обрамлениями и реечной скамьёй | Max Vakhtbovych | https://www.pexels.com/photo/6580384/ | Pexels License |
| projekt-altbau-tueren.jpg | коридор старого дома с распахнутыми двустворчатыми дверями и плиткой на полу | Nim Nim | https://www.pexels.com/photo/34572109/ | Pexels License |
| projekt-buecherwand.jpg | белая книжная стена до потолка вокруг дверного проёма | Francesco Ungaro | https://www.pexels.com/photo/32471851/ | Pexels License |
| projekt-badmoebel.jpg | подвесная деревянная тумба с накладной раковиной у кирпичной стены | Polina | https://www.pexels.com/photo/5644275/ | Pexels License |
| about-werkstatt.jpg | верстак у окна в мастерской, инструменты на стене | Yaroslav Shuraev | https://www.pexels.com/photo/4888924/ | Pexels License |
| karriere.jpg | руки столяра в фартуке строгают рубанком брусок на верстаке, рядом стружка | Burst | https://www.pexels.com/photo/374861/ | Pexels License |
| textures/oak/color.webp | дуб «Oak Veneer 01», цвет; 1K, плитка 1,83 м, волокна вдоль картинки | Jenelle van Heerden | https://polyhaven.com/a/oak_veneer_01 | CC0 |
| textures/oak/roughness.webp | дуб «Oak Veneer 01», шероховатость (в оттенках серого) | Jenelle van Heerden | https://polyhaven.com/a/oak_veneer_01 | CC0 |
| textures/oak/normal.webp | дуб «Oak Veneer 01», нормали (OpenGL) | Jenelle van Heerden | https://polyhaven.com/a/oak_veneer_01 | CC0 |
| textures/birch/color.webp | клён «White Maple Veneer», цвет; 1K, плитка 1 м, повёрнут на 90°, чтобы волокна шли вдоль картинки. Замена берёзовой фанеры для задней стенки: CC0-текстуры берёзовой фанеры на Poly Haven и ambientCG нет (решение Максона, сессия 34) | Jenelle van Heerden | https://polyhaven.com/a/white_maple_veneer | CC0 |

| src/assets/fonts/ZillaSlab-SemiBold.ttf, ZillaSlab-Bold.ttf | шрифт Zilla Slab для картинок превью (`next/og` не читает woff2, которые отдаёт `next/font`) | The Mozilla Foundation, Typotheque | https://github.com/google/fonts/tree/main/ofl/zillaslab | SIL Open Font License 1.1, текст в `src/assets/fonts/OFL.txt` |

Текстуры лежат в `public/textures/`: 1K-JPG с Poly Haven пересжаты в WebP (sharp), иначе файлы не влезали в 300 КБ.
