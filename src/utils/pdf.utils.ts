import { PDFDocument, StandardFonts } from 'pdf-lib';

import { Prisma } from '@prisma/client';
import { DocumentsService } from '@/documents/documents.service';

type DocumentWithTranscription = Prisma.PromiseReturnType<
  typeof DocumentsService.prototype.findOneDeep
>;

export async function generatePdfFromImageAndTranscription(
  buffer: Buffer,
  doc: DocumentWithTranscription,
) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page1 = pdfDoc.addPage();
  const pageWidth = page1.getWidth();
  const pageHeight = page1.getHeight();
  const margin = 50;

  let imageEmbed;
  if (doc.mimeType === 'image/png') imageEmbed = await pdfDoc.embedPng(buffer);
  else imageEmbed = await pdfDoc.embedJpg(buffer);

  const { width: imgWidth, height: imgHeight } = imageEmbed.scaleToFit(
    pageWidth - 2 * margin,
    pageHeight - 2 * margin,
  );
  const imgX = pageWidth / 2 - imgWidth / 2;
  const imgY = pageHeight - imgHeight - margin;

  page1.drawImage(imageEmbed, {
    x: imgX,
    y: imgY,
    width: imgWidth,
    height: imgHeight,
  });

  const transcriptionText = doc.transcription?.text || '';
  if (transcriptionText) {
    const page2 = pdfDoc.addPage();
    const fontSize = 12;
    let cursorY = page2.getHeight() - margin;

    page2.drawText('Transcrição:', { x: margin, y: cursorY, size: 16, font });
    cursorY -= fontSize * 2;

    page2.drawText(transcriptionText, {
      x: margin,
      y: cursorY,
      size: fontSize,
      font,
      maxWidth: page2.getWidth() - 2 * margin,
      lineHeight: fontSize * 1.2,
    });
  }

  const completions = doc.transcription?.aiCompletions || [];
  if (completions.length > 0) {
    let page = pdfDoc.addPage();
    const fontSize = 12;
    let cursorY = page.getHeight() - margin;

    const lineHeight = fontSize * 1.2;

    for (let i = 0; i < completions.length; i++) {
      const { prompt, response } = completions[i];

      const promptText = `Pergunta ${i + 1}: ${prompt}`;
      const responseText = `Resposta: ${response}`;

      const wrapText = (text: string, maxWidth: number) => {
        const words = text.split(' ');
        const lines: string[] = [];
        let line = '';
        for (const word of words) {
          const testLine = line ? `${line} ${word}` : word;
          const width = font.widthOfTextAtSize(testLine, fontSize);
          if (width > maxWidth) {
            lines.push(line);
            line = word;
          } else {
            line = testLine;
          }
        }
        if (line) lines.push(line);
        return lines;
      };

      const promptLines = wrapText(
        promptText.replace(/\n/g, ' '),
        page.getWidth() - 2 * margin,
      );
      const responseLines = wrapText(
        responseText.replace(/\n/g, ' '),
        page.getWidth() - 2 * margin,
      );

      for (const line of [...promptLines, ...responseLines, '']) {
        if (cursorY < margin) {
          page = pdfDoc.addPage();
          cursorY = page.getHeight() - margin;
        }
        page.drawText(line, {
          x: margin,
          y: cursorY,
          size: fontSize,
          font,
          lineHeight,
        });
        cursorY -= lineHeight;
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
