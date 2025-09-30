import { PDFDocument, PDFFont, StandardFonts } from 'pdf-lib';

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

  await appendTextAndCompletions(pdfDoc, doc, font, margin);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function appendTranscriptionToPdf(
  buffer: Buffer,
  doc: DocumentWithTranscription,
) {
  const pdfDoc = await PDFDocument.load(buffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 50;

  await appendTextAndCompletions(pdfDoc, doc, font, margin);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function sanitizeText(text: string) {
  return text.replace(/[^\x00-\x7F]/g, '');
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number) {
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
}

async function appendTextAndCompletions(
  pdfDoc: PDFDocument,
  doc: DocumentWithTranscription,
  font: PDFFont,
  margin: number,
) {
  const transcriptionText = doc.transcription?.text || '';
  if (transcriptionText) {
    const page = pdfDoc.addPage();
    const fontSize = 12;
    let cursorY = page.getHeight() - margin;

    page.drawText('Transcrição:', { x: margin, y: cursorY, size: 16, font });
    cursorY -= fontSize * 2;

    const lines = wrapText(
      sanitizeText(transcriptionText.replace(/\n/g, ' ')),
      page.getWidth() - 2 * margin,
      font,
      fontSize,
    );

    for (const line of lines) {
      if (cursorY < margin) {
        const newPage = pdfDoc.addPage();
        cursorY = newPage.getHeight() - margin;
        page.drawText(sanitizeText(line), {
          x: margin,
          y: cursorY,
          size: fontSize,
          font,
        });
      } else {
        page.drawText(sanitizeText(line), {
          x: margin,
          y: cursorY,
          size: fontSize,
          font,
        });
      }
      cursorY -= fontSize * 1.2;
    }
  }

  const completions = doc.transcription?.aiCompletions || [];
  if (completions.length > 0) {
    let page = pdfDoc.addPage();
    const fontSize = 12;
    const lineHeight = fontSize * 1.2;
    let cursorY = page.getHeight() - margin;

    for (let i = 0; i < completions.length; i++) {
      const { prompt, response } = completions[i];

      const promptText = `Pergunta ${i + 1}: ${prompt}`;
      const responseText = `Resposta: ${response}`;

      const promptLines = wrapText(
        sanitizeText(promptText.replace(/\n/g, ' ')),
        page.getWidth() - 2 * margin,
        font,
        fontSize,
      );
      const responseLines = wrapText(
        sanitizeText(responseText.replace(/\n/g, ' ')),
        page.getWidth() - 2 * margin,
        font,
        fontSize,
      );

      for (const line of [...promptLines, ...responseLines, '']) {
        if (cursorY < margin) {
          page = pdfDoc.addPage();
          cursorY = page.getHeight() - margin;
        }
        page.drawText(sanitizeText(line), {
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
}
