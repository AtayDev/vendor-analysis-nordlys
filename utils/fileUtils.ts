import { Report } from '../types';

// Assuming xlsx is loaded from a script tag in index.html
declare const XLSX: any;

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix e.g. "data:image/png;base64,"
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

// --- STYLING DEFINITIONS ---
const thinBorder = { style: 'thin', color: { rgb: 'FFBFBFBF' } };
const allBorders = {
  top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder
};

const STYLES = {
  title: { font: { sz: 16, bold: true }, alignment: { vertical: 'center', horizontal: 'left' } },
  tableHeader: {
    font: { bold: true, color: { rgb: 'FFFFFFFF' } },
    fill: { fgColor: { rgb: 'FF4A5568' } },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: allBorders
  },
  cell: {
    border: allBorders,
    alignment: { vertical: 'top', wrapText: true }
  },
  cellZebra: {
    border: allBorders,
    fill: { fgColor: { rgb: 'FFF1F5F9' } },
    alignment: { vertical: 'top', wrapText: true }
  },
  quote: {
    font: { italic: true },
    fill: { fgColor: { rgb: 'FFFDFBF7' } },
    alignment: { wrapText: true, vertical: 'top' },
    border: {
        left: { style: 'medium', color: { rgb: 'FFD69E2E' } },
        top: thinBorder, bottom: thinBorder, right: thinBorder
    }
  },
  paragraph: {
    alignment: { vertical: 'top', wrapText: true },
    border: allBorders
  },
  listItem: {
    alignment: { vertical: 'top', wrapText: true },
    border: allBorders
  }
};

type StructuredBlock = 
    | { type: 'p', content: string }
    | { type: 'quote', content: string }
    | { type: 'list', items: string[] }
    | { type: 'table', header: string[], rows: string[][] };

type StyleMetadata = 
    | { type: 'title', row: number, colSpan: number }
    | { type: 'p', row: number, colSpan: number }
    | { type: 'quote', row: number, colSpan: number }
    | { type: 'list', startRow: number, endRow: number, colSpan: number }
    | { type: 'table', startRow: number, endRow: number, header: string[], rows: string[][] };

/**
 * LAYER 1: THE PARSER
 * Meticulously cleans markdown and converts it into a structured format.
 */
function markdownToStructuredBlocks(markdown: string): StructuredBlock[] {
    const blocks: StructuredBlock[] = [];
    if (!markdown) return blocks;

    const cleanMarkdown = (text: string) => text.trim()
        .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
        .replace(/(\*|_)(.*?)\1/g, '$2')   // italic
        .replace(/`(.*?)`/g, '$1');       // inline code

    const lines = markdown.trim().split('\n');
    let i = 0;

    while (i < lines.length) {
        let line = lines[i].trim();

        if (line.startsWith('|')) {
            const header = line.split('|').slice(1, -1).map(cleanMarkdown);
            const rows: string[][] = [];
            i++;
            
            if (i < lines.length && lines[i].trim().startsWith('|') && lines[i].includes('---')) {
                i++; // This is the separator line, skip it.
            }
            
            while (i < lines.length && lines[i].trim().startsWith('|')) {
                const rowCells = lines[i].trim().split('|').slice(1, -1).map(cleanMarkdown);
                rows.push(rowCells);
                i++;
            }
            if (header.length > 0 || rows.length > 0) {
                 blocks.push({ type: 'table', header, rows });
            }
        } else if (line.startsWith('>')) {
            let quoteText = cleanMarkdown(line.substring(1));
            i++;
            while (i < lines.length && lines[i].trim().startsWith('>')) {
                quoteText += '\n' + cleanMarkdown(lines[i].trim().substring(1));
                i++;
            }
            blocks.push({ type: 'quote', content: quoteText });
        } else if (line.startsWith('* ') || line.startsWith('- ')) {
            const items: string[] = [];
            while (i < lines.length && (lines[i].trim().startsWith('* ') || lines[i].trim().startsWith('- '))) {
                items.push('• ' + cleanMarkdown(lines[i].trim().substring(2)));
                i++;
            }
            blocks.push({ type: 'list', items });
        } else if (line) {
            let p_text = line;
            i++;
             while (i < lines.length && lines[i].trim() && !/^[|>*-]/.test(lines[i].trim())) {
                p_text += '\n' + lines[i].trim();
                i++;
            }
            blocks.push({ type: 'p', content: cleanMarkdown(p_text) });
        } else {
            i++; 
        }
    }
    return blocks;
}

/**
 * LAYER 2: THE UNSTYLED SHEET CREATOR
 * Takes structured blocks and creates a 'Version 0' Excel sheet with only raw data.
 * It returns the unstyled sheet and a 'map' of where content is for the stylist.
 */
function createUnstyledWorksheet(blocks: StructuredBlock[], title: string): { ws: any, metadata: StyleMetadata[] } {
    const ws = XLSX.utils.aoa_to_sheet([[]]);
    const metadata: StyleMetadata[] = [];
    let rowIndex = 0;
    const maxCols = 8;

    // Title
    XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: { r: rowIndex, c: 0 } });
    metadata.push({ type: 'title', row: rowIndex, colSpan: maxCols });
    rowIndex += 2;

    blocks.forEach(block => {
        if (rowIndex > 1) rowIndex++; // Space between blocks

        switch (block.type) {
            case 'table':
                XLSX.utils.sheet_add_aoa(ws, [block.header], { origin: rowIndex });
                XLSX.utils.sheet_add_aoa(ws, block.rows, { origin: rowIndex + 1 });
                metadata.push({
                    type: 'table',
                    startRow: rowIndex,
                    endRow: rowIndex + block.rows.length,
                    header: block.header,
                    rows: block.rows
                });
                rowIndex += block.rows.length + 1;
                break;

            case 'quote':
                XLSX.utils.sheet_add_aoa(ws, [[block.content]], { origin: rowIndex });
                metadata.push({ type: 'quote', row: rowIndex, colSpan: maxCols });
                rowIndex++;
                break;
            
            case 'list':
                const listStartRow = rowIndex;
                block.items.forEach(item => {
                    XLSX.utils.sheet_add_aoa(ws, [[item]], { origin: rowIndex });
                    rowIndex++;
                });
                metadata.push({ type: 'list', startRow: listStartRow, endRow: rowIndex - 1, colSpan: maxCols });
                break;

            case 'p':
                XLSX.utils.sheet_add_aoa(ws, [[block.content]], { origin: rowIndex });
                metadata.push({ type: 'p', row: rowIndex, colSpan: maxCols });
                rowIndex++;
                break;
        }
    });

    return { ws, metadata };
}

/**
 * LAYER 3: THE STYLIST
 * Takes a 'Version 0' sheet and a metadata map, and applies all professional styles.
 */
function applyStylesToWorksheet(ws: any, metadata: StyleMetadata[]): any {
    const merges: any[] = [];
    
    metadata.forEach(meta => {
        switch (meta.type) {
            case 'title':
                ws[XLSX.utils.encode_cell({ r: meta.row, c: 0 })].s = STYLES.title;
                merges.push({ s: { r: meta.row, c: 0 }, e: { r: meta.row, c: meta.colSpan - 1 } });
                break;

            case 'table':
                // Style header
                meta.header.forEach((_, c) => {
                    const cellRef = XLSX.utils.encode_cell({ r: meta.startRow, c });
                    if(ws[cellRef]) ws[cellRef].s = STYLES.tableHeader;
                });
                // Style rows
                meta.rows.forEach((row, r) => {
                    const style = r % 2 === 0 ? STYLES.cellZebra : STYLES.cell;
                    row.forEach((_, c) => {
                        const cellRef = XLSX.utils.encode_cell({ r: meta.startRow + 1 + r, c });
                        if(ws[cellRef]) ws[cellRef].s = style;
                    });
                });
                break;

            case 'quote':
                ws[XLSX.utils.encode_cell({ r: meta.row, c: 0 })].s = STYLES.quote;
                merges.push({ s: { r: meta.row, c: 0 }, e: { r: meta.row, c: meta.colSpan - 1 } });
                break;
            
            case 'list':
                for (let r = meta.startRow; r <= meta.endRow; r++) {
                    ws[XLSX.utils.encode_cell({ r, c: 0 })].s = STYLES.listItem;
                    merges.push({ s: { r, c: 0 }, e: { r, c: meta.colSpan - 1 } });
                }
                break;
            
            case 'p':
                ws[XLSX.utils.encode_cell({ r: meta.row, c: 0 })].s = STYLES.paragraph;
                merges.push({ s: { r: meta.row, c: 0 }, e: { r: meta.row, c: meta.colSpan - 1 } });
                break;
        }
    });

    ws['!merges'] = merges;
    ws['!cols'] = Array(8).fill({ wch: 30 });
    return ws;
}

// Helper to split a main section into subsections based on '###' headings
const splitMarkdownByH3 = (markdown: string, mainSectionTitle: string): { title: string; content: string }[] => {
    if (!markdown) return [{ title: mainSectionTitle, content: '' }];
    const sections = markdown.split(/(?=^###\s)/m);
    
    if (sections.length === 1 && !sections[0].startsWith('### ')) {
        return [{ title: mainSectionTitle, content: sections[0].trim() }];
    }

    return sections.map(sec => {
        const lines = sec.trim().split('\n');
        const title = lines[0].startsWith('### ') ? lines[0].replace('### ', '').trim() : mainSectionTitle;
        const content = lines.slice(1).join('\n').trim();
        return { title, content };
    }).filter(s => s.title || s.content);
};

/**
 * Main orchestrator function to generate and download the styled XLSX report.
 */
export const downloadReportAsXLSX = (report: Report): void => {
    if (typeof XLSX === 'undefined') {
        alert('Could not download report. The XLSX library is missing.');
        return;
    }

    const workbook = XLSX.utils.book_new();
    const sections: { key: keyof Report, name: string }[] = [
        { key: 'overview', name: 'Overview' },
        { key: 'technical', name: 'Technical Data' },
        { key: 'operational', name: 'Operational Analysis' },
        { key: 'financial', name: 'Financial Synopsis' },
    ];

    sections.forEach(section => {
        const subSections = splitMarkdownByH3(report[section.key], section.name);
        subSections.forEach((sub, index) => {
            let sheetName = sub.title.replace(/[\\/*?:]/g, '').substring(0, 31);
            if (workbook.SheetNames.includes(sheetName)) {
                sheetName = `${sheetName.substring(0, 28)}_${index + 1}`;
            }
            
            // EXECUTE 3-LAYER PIPELINE
            const structuredBlocks = markdownToStructuredBlocks(sub.content); // Layer 1
            const { ws: unstyledWs, metadata } = createUnstyledWorksheet(structuredBlocks, sub.title); // Layer 2
            const styledWs = applyStylesToWorksheet(unstyledWs, metadata); // Layer 3
            
            XLSX.utils.book_append_sheet(workbook, styledWs, sheetName);
        });
    });

    if (workbook.SheetNames.length > 0) {
        XLSX.writeFile(workbook, 'Nordlys-Vendor-Analysis.xlsx');
    } else {
        alert('No data available to generate a report.');
    }
};
