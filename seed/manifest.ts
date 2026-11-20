import type { Media } from "../src/payload-types";

export type PhotoEntry = {
  file: string;
  credit: string;
  source: string;
  license: Media["license"];
  alt: { de: string; en: string };
};

type Table = { header: string[]; rows: string[][] };

const cells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

const isSeparator = (row: string[]): boolean =>
  row.every((cell) => /^:?-+:?$/.test(cell));

/** The first markdown table after the `## heading` line. */
const tableAfter = (lines: string[], heading: string): Table => {
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) {
    throw new Error(`MANIFEST.md: section "${heading}" not found`);
  }
  const rows: string[][] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) {
      break;
    }
    if (line.trim().startsWith("|")) {
      rows.push(cells(line));
    } else if (rows.length > 0) {
      break;
    }
  }
  const [header, ...body] = rows;
  if (!header) {
    throw new Error(`MANIFEST.md: no table in section "${heading}"`);
  }
  return { header, rows: body.filter((row) => !isSeparator(row)) };
};

const column = (table: Table, name: string): number => {
  const index = table.header.indexOf(name);
  if (index === -1) {
    throw new Error(`MANIFEST.md: column "${name}" not found`);
  }
  return index;
};

const toLicense = (text: string): Media["license"] => {
  if (/unsplash/i.test(text)) {
    return "unsplash";
  }
  if (/pexels/i.test(text)) {
    return "pexels";
  }
  throw new Error(`MANIFEST.md: unknown license "${text}"`);
};

const required = (value: string | undefined, what: string): string => {
  if (!value) {
    throw new Error(`MANIFEST.md: ${what} is empty`);
  }
  return value;
};

/**
 * Reads seed/images/MANIFEST.md: author, link and license from the table
 * «Файлы», German and English alt texts from «Alt-тексты».
 */
export const parseManifest = (markdown: string): PhotoEntry[] => {
  const lines = markdown.split(/\r?\n/);
  const files = tableAfter(lines, "Файлы");
  const alts = tableAfter(lines, "Alt-тексты");

  const fileCol = column(files, "Файл");
  const creditCol = column(files, "Автор");
  const sourceCol = column(files, "Ссылка");
  const licenseCol = column(files, "Лицензия");
  const altFileCol = column(alts, "Файл");
  const deCol = column(alts, "alt (de)");
  const enCol = column(alts, "alt (en)");

  return files.rows.map((row) => {
    const file = required(row[fileCol], "file name");
    const alt = alts.rows.find((altRow) => altRow[altFileCol] === file);
    if (!alt) {
      throw new Error(`MANIFEST.md: no alt text for ${file}`);
    }
    return {
      file,
      credit: required(row[creditCol], `author of ${file}`),
      source: required(row[sourceCol], `link of ${file}`),
      license: toLicense(required(row[licenseCol], `license of ${file}`)),
      alt: {
        de: required(alt[deCol], `German alt text of ${file}`),
        en: required(alt[enCol], `English alt text of ${file}`),
      },
    };
  });
};
