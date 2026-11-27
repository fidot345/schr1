# Источники фото, текстур и шрифтов

Одна строка — один файл. Авторы, ссылки и лицензии взяты из `seed/images/SOURCES.txt`, `seed/images/MANIFEST.md`, файлов лицензий шрифтов и страниц источников, записанных в этих файлах. Чего в этих файлах нет, помечено «уточнить».

Лицензии фото: Unsplash License — https://unsplash.com/license, Pexels License — https://www.pexels.com/license/. Обе разрешают бесплатное использование без обязательного указания автора; авторов всё равно указываем (раздел 3 брифа, «Фото»).

## Фото

Исходники лежат в `seed/images/`, на сайт попадают через seed и админку Payload (коллекция Media, поле с автором и ссылкой).

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

## Текстуры 3D-сцены

Лежат в `public/textures/`: 1K-JPG с Poly Haven пересжаты в WebP (sharp), иначе файлы не влезали в 300 КБ.

| Файл | Что на нём | Автор | Источник (ссылка) | Лицензия |
|---|---|---|---|---|
| textures/oak/color.webp | дуб «Oak Veneer 01», цвет; 1K, плитка 1,83 м, волокна вдоль картинки | Jenelle van Heerden | https://polyhaven.com/a/oak_veneer_01 | CC0 |
| textures/oak/roughness.webp | дуб «Oak Veneer 01», шероховатость (в оттенках серого) | Jenelle van Heerden | https://polyhaven.com/a/oak_veneer_01 | CC0 |
| textures/oak/normal.webp | дуб «Oak Veneer 01», нормали (OpenGL) | Jenelle van Heerden | https://polyhaven.com/a/oak_veneer_01 | CC0 |
| textures/birch/color.webp | клён «White Maple Veneer», цвет; 1K, плитка 1 м, повёрнут на 90°, чтобы волокна шли вдоль картинки. Замена берёзовой фанеры для задней стенки: CC0-текстуры берёзовой фанеры на Poly Haven и ambientCG нет (решение Максона, сессия 34) | Jenelle van Heerden | https://polyhaven.com/a/white_maple_veneer | CC0 |

## Шрифты

Оба шрифта — SIL Open Font License 1.1. Владельцы прав записаны так, как они названы в файлах лицензий.

| Где | Шрифт | Владелец прав (по файлу лицензии) | Источник | Лицензия |
|---|---|---|---|---|
| сайт, заголовки: `next/font/google` в `src/app/(frontend)/[locale]/layout.tsx`, начертания 600 и 700 | Zilla Slab | The Mozilla Foundation | Google Fonts: https://fonts.google.com/specimen/Zilla+Slab. `next/font` скачивает файлы при сборке и отдаёт их с нашего домена, браузер посетителя к Google не ходит | SIL OFL 1.1 |
| сайт, основной текст: `next/font/google` там же, начертания 400 и 700 | Atkinson Hyperlegible Next | The Atkinson Hyperlegible Next Project Authors (https://github.com/googlefonts/atkinson-hyperlegible-next) | Google Fonts: https://fonts.google.com/specimen/Atkinson+Hyperlegible+Next, так же через `next/font` | SIL OFL 1.1 |
| картинки превью: `src/assets/fonts/ZillaSlab-SemiBold.ttf`, `ZillaSlab-Bold.ttf` (`next/og` не читает woff2, которые отдаёт `next/font`) | Zilla Slab | The Mozilla Foundation | https://github.com/google/fonts/tree/main/ofl/zillaslab | SIL OFL 1.1, текст в `src/assets/fonts/OFL.txt` |
| макет: `design/assets/fonts/*.woff2` (только для HTML-макета, на сайт не попадают) | Zilla Slab, Atkinson Hyperlegible Next | The Mozilla Foundation; The Atkinson Hyperlegible Next Project Authors | уточнить: откуда скачаны woff2 макета, в файлах не записано (имена файлов как у Fontsource) | SIL OFL 1.1, тексты в `design/assets/fonts/OFL-zilla-slab.txt` и `OFL-atkinson-hyperlegible-next.txt` |

## Свои файлы

| Файл | Что это | Автор | Лицензия |
|---|---|---|---|
| public/images/3d/schrank-fertig.avif | снимок готового шкафа, последний шаг 3D-сцены (запасная картинка, раздел 4 брифа); снят Playwright с холста своей сцены в окне 1920 × 1080 (1211 × 1617 px, AVIF качество 50, 29 КБ), текстуры — из таблицы выше | сделан в проекте (сессия 41) | как у кода проекта (MIT, `package.json`), текстуры CC0 |
| public/images/logo-mark.svg, src/app/icon.svg, src/app/favicon.ico | знак «Tannrieder»: три бруска разной длины друг над другом и ствол — ель из досок | сделан в проекте | как у кода проекта (MIT) |
| src/components/ui/icons.tsx | иконки макета: телефон, меню, крестик, стрелка, ошибка (inline SVG) | уточнить: нарисованы для макета `design/` или взяты из набора иконок, в файлах не записано | уточнить |

## Уточнить

- Zilla Slab: в `OFL.txt` назван только владелец прав (The Mozilla Foundation). Кто рисовал шрифт, в файлах проекта не записано.
- Atkinson Hyperlegible Next: в файле лицензии назван только коллектив «The Atkinson Hyperlegible Next Project Authors», без имён и заказчика.
- Откуда скачаны woff2 макета в `design/assets/fonts/`.
- Иконки в `src/components/ui/icons.tsx`: свои или из набора.
